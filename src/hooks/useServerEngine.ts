/* eslint-disable react-hooks/refs */
// Refs read during render: intentional — mutable game state + tick counter
// pattern (same approach as useDebugEngine).
/**
 * useServerEngine — production engine hook that mirrors the DebugEngine interface
 * but uses the serverless API instead of local engine computation.
 *
 * Key differences from useDebugEngine:
 * - newRound() → POST /rounds, hydrates response into ServerRound
 * - processNextBall() → returns pre-fetched draws (initial 30) or extra draws
 * - advance() → unified handler: starts discharge, resumes halt, draws extras
 * - endRound() → POST /rounds/{id}/end, triggers collect animation
 * - shuffle() → POST /rounds (new cards = new round with same stake)
 * - No RNG, no force configs, no pattern forcing — server is authoritative
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { bumpTick } from '../store/gameStore'
import type { Draw } from '../engine/Draw'
import { DEFAULT_BALLS, STAKE_LEVELS } from '../engine/constants'
import type { Round } from '../engine/Round'
import type { DebugEngine } from '../debug/useDebugEngine'
import { createRound, drawBall, peekBall, endRound as apiEndRound } from '../api/client'
import type { CreateRoundResponse, DrawResponse } from '../../server/src/types/api'
import {
  hydrateRound,
  applyDrawResponse,
  type ServerRound,
} from '../api/hydrate'

/** Auto-end conference timeout (ms) — same as useDebugEngine */
const CONFERENCE_TIMEOUT = 4000

export function useServerEngine(): DebugEngine {
  const [stakeIndex, setStakeIndex] = useState(0)
  const stake = STAKE_LEVELS[stakeIndex]
  const [, setTick] = useState(0)

  // Seed control — via debug panel only
  const [seed, setSeed] = useState(0)
  const [lockSeed, setLockSeed] = useState(false)
  const seedRef = useRef(seed)
  const lockSeedRef = useRef(lockSeed)
  const [isCollecting, setIsCollecting] = useState(false)
  const [lastPayout, setLastPayout] = useState(0)
  const [bonusActive, setBonusActive] = useState(false)
  const [isPeeling, setIsPeeling] = useState(false)
  const isPeelingRef = useRef(false)
  const peelAdvanceTickRef = useRef(0)

  // Server state
  const roundRef = useRef<ServerRound | null>(null)
  const roundIdRef = useRef<string | null>(null)
  /** Cached server response for locked-seed reset (replay without server call) */
  const lastResponseRef = useRef<CreateRoundResponse | null>(null)
  /** Card numbers from current round — reused on newRound to keep same cards */
  const cardNumbersRef = useRef<number[][] | null>(null)
  /** Auto-start discharge after next newRound completes */
  const autoPlayAfterNewRef = useRef(false)
  const targetBallCountRef = useRef(0)
  /** How many draws have been consumed by BallPanel animation */
  const drawnIndexRef = useRef(0)
  /** True while an API call is in-flight (prevents double-clicks) */
  const fetchingRef = useRef(false)

  /**
   * One-ball-ahead prefetch for extras via peekBall (read-only on the server).
   * On user click, the response is applied locally for ~0ms perceived latency
   * and a commit drawBall is queued through commitChainRef in the background.
   * `forRoundId` guards against stale responses landing after a new round.
   */
  const prefetchRef = useRef<{
    state: 'idle' | 'pending' | 'ready'
    promise?: Promise<DrawResponse | null>
    response?: DrawResponse
    forRoundId?: string
  }>({ state: 'idle' })

  /**
   * Serialised promise chain for commit drawBall calls. Each new commit awaits
   * the previous so the server sees them in order (drawCount optimistic lock
   * would otherwise race). endRound also awaits this before finalising so the
   * server's payout is computed over all peeked-then-clicked balls.
   */
  const commitChainRef = useRef<Promise<void>>(Promise.resolve())

  /**
   * Count of commits queued and not yet finished. The idle (no-peek) path in
   * fetchExtraDraw bails when this is > 0: firing drawBall directly would
   * skip commitChainRef and race the queued commit for the same drawCount.
   * Peek consumption (ready/pending) is allowed because those balls are for
   * a later drawCount and serialise behind the chain.
   *
   * Paired with commitEpochRef: a round change bumps the epoch and resets the
   * counter, and stale commits (captured under an older epoch) skip the
   * decrement so the counter can't go negative and unblock the guard.
   */
  const pendingCommitsRef = useRef(0)
  const commitEpochRef = useRef(0)

  /**
   * Generation counter bumped whenever a peek-in-flight should be considered
   * cancelled (clearPrefetch, round change, endRound). Pending .then handlers
   * capture the epoch at kickoff and bail out if it has changed by the time
   * they run, preventing a late peek response from applying after end.
   */
  const prefetchEpochRef = useRef(0)

  const autoEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoEndFiredRef = useRef(false)

  const rerender = useCallback(() => setTick(t => t + 1), [])

  // Track previous stakeIndex for idle-round refresh
  const prevStakeIndexRef = useRef(stakeIndex)
  /** Always-current stakeIndex — read inside async callbacks to avoid stale closures */
  const stakeIndexRef = useRef(stakeIndex)
  stakeIndexRef.current = stakeIndex

  // ── Network retry state ─────────────────────────────────────
  const [retrying, setRetrying] = useState(false)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Refs to hold latest callback versions — avoids forward-reference in self-retrying useCallbacks
  const retryTargetRef = useRef<(() => void) | null>(null)

  // Stable refs for self-retrying useCallbacks (avoids ESLint forward-reference error)
  const newRoundRef = useRef<() => void>(() => {})
  const fetchExtraDrawRef = useRef<() => void>(() => {})
  const advanceWithInitRef = useRef<() => void>(() => {})
  /** Forward ref so processNextBall (declared earlier) can call kickoffPrefetch. */
  const kickoffPrefetchRef = useRef<() => void>(() => {})

  const isNetworkError = (err: unknown): boolean => err instanceof TypeError

  /** Schedule a retry — uses retryTargetRef (must be set by caller before calling) */
  const scheduleRetry = useCallback(() => {
    setRetrying(true)
    const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 10000)
    retryCountRef.current++
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    retryTimerRef.current = setTimeout(() => {
      retryTargetRef.current?.()
    }, delay)
  }, [])

  const clearRetry = useCallback(() => {
    setRetrying(false)
    retryCountRef.current = 0
    retryTargetRef.current = null
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])

  // Immediate retry when browser comes back online
  useEffect(() => {
    const handler = () => {
      const fn = retryTargetRef.current
      if (fn) {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
        fn()
      }
    }
    window.addEventListener('online', handler)
    return () => {
      window.removeEventListener('online', handler)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  const handlePeelChange = useCallback((peeling: boolean) => {
    isPeelingRef.current = peeling
    setIsPeeling(peeling)
    if (!peeling) peelAdvanceTickRef.current = 0
  }, [])

  // ── newRound — POST /rounds ───────────────────────────────────
  // reuseCards=true → same cards, new draws (newRound / bet change)
  // reuseCards=false → new cards + new draws (shuffle only)

  const newRoundImpl = useCallback((reuseCards: boolean) => {
    if (fetchingRef.current) return
    // Cancel pending auto-end
    if (autoEndTimerRef.current) {
      clearTimeout(autoEndTimerRef.current)
      autoEndTimerRef.current = null
    }
    setIsCollecting(false)
    autoEndFiredRef.current = false
    // Reset peel state
    isPeelingRef.current = false
    setIsPeeling(false)
    peelAdvanceTickRef.current = 0
    // Drop peek + bump epoch so an in-flight peek for the OLD round can't
    // resolve into `ready` state and block the new round's prefetch.
    prefetchEpochRef.current++
    prefetchRef.current = { state: 'idle' }
    // Reset the commit chain so a stuck/hung commit from the previous round
    // can't keep pendingCommitsRef > 0 and block extras in the new round.
    // Bump the epoch so old commits' `finally` skips the decrement — without
    // this, stale finishes would drive the counter negative and silently
    // disable the idle-path guard.
    commitChainRef.current = Promise.resolve()
    pendingCommitsRef.current = 0
    commitEpochRef.current++

    fetchingRef.current = true
    const opts: { seed?: number; cardNumbers?: number[][] } = {}
    if (lockSeedRef.current) opts.seed = seedRef.current
    if (reuseCards && cardNumbersRef.current && !lockSeedRef.current) opts.cardNumbers = cardNumbersRef.current
    console.log(`[newRound] reuseCards=${reuseCards} cards=${opts.cardNumbers ? 'yes' : 'no'} seed=${opts.seed ?? 'random'}`)
    createRound(STAKE_LEVELS[stakeIndex], Object.keys(opts).length > 0 ? opts : undefined)
      .then(res => {
        clearRetry()
        lastResponseRef.current = res
        // Store card numbers for reuse — extract in column-major order (matches setNumbers)
        cardNumbersRef.current = res.cards.map(c => {
          const nums: number[] = []
          for (let col = 0; col < c.numbers[0].length; col++)
            for (let row = 0; row < c.numbers.length; row++)
              if (c.numbers[row][col] > 0) nums.push(c.numbers[row][col])
          return nums
        })
        const round = hydrateRound(res, STAKE_LEVELS[stakeIndex])
        roundRef.current = round
        roundIdRef.current = res.roundId
        drawnIndexRef.current = 0
        if (autoPlayAfterNewRef.current) {
          autoPlayAfterNewRef.current = false
          targetBallCountRef.current = Math.min(DEFAULT_BALLS, round.draws.length)
        } else {
          targetBallCountRef.current = 0
        }
        if (!lockSeedRef.current) {
          seedRef.current = seedRef.current + 1
          setSeed(seedRef.current)
        }
        rerender()
      })
      .catch(err => {
        console.error('[useServerEngine] newRound failed:', err)
        if (isNetworkError(err)) {
          retryTargetRef.current = () => { fetchingRef.current = false; newRoundRef.current() }
          scheduleRetry()
          // Prevent auto-end from re-firing while retrying (old round still in state)
          autoEndFiredRef.current = true
        }
      })
      .finally(() => {
        fetchingRef.current = false
        rerender()
        // If stake changed while this fetch was in flight, the bet change
        // effect was blocked by fetchingRef and prevStakeIndex wasn't updated.
        // Re-trigger to pick up the latest stake.
        if (stakeIndexRef.current !== prevStakeIndexRef.current) {
          prevStakeIndexRef.current = stakeIndexRef.current
          clearRetry()
          setTimeout(() => newRoundRef.current(), 0)
        }
      })
  }, [stakeIndex, rerender, scheduleRetry, clearRetry])

  const newRound = useCallback(() => newRoundImpl(true), [newRoundImpl])
  newRoundRef.current = newRound

  // Auto-create first round on mount (idle with cards visible)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      newRound()
    }
  }, [newRound])

  // ── shuffle — new cards (new seed) with same stake ───────────

  const shuffle = useCallback(() => {
    if (!roundRef.current) return
    newRoundImpl(false)
  }, [newRoundImpl])

  // ── processNextBall — called by BallPanel when ball arrives ───

  const processNextBall = useCallback((): Draw | null => {
    const round = roundRef.current
    if (!round) return null

    const idx = drawnIndexRef.current
    // Don't advance past what the target allows
    if (idx >= targetBallCountRef.current) return null
    // Don't advance past available draws
    if (idx >= round.draws.length) return null

    // Apply draw incrementally — marks card cell, adds patterns, updates payout
    const draw = round.applyNextDraw()
    if (!draw) return null
    drawnIndexRef.current = round.currentBallIndex

    // AS3: halt for user — cap target when high-priority pattern detected
    if (round.shouldHalt) {
      targetBallCountRef.current = round.currentBallIndex
    }

    // Kick off the first peek the instant the main discharge ends and extras
    // unlock. Subsequent peeks are chained by queueCommit on each commit ack
    // — firing here on every animation tick would race a peek against a
    // pending commit and re-fetch the same drawCount's ball.
    if (round.currentBallIndex === DEFAULT_BALLS && (round.extraAvailable || round.superExtraAvailable)) {
      kickoffPrefetchRef.current()
    }

    bumpTick() // Force Zustand subscribers to re-read mutated card state
    rerender()
    return draw
  }, [rerender])

  // ── drawExtra/drawSuperExtra — fetch from server ──────────────

  /** Drop the pending peek-prefetch and invalidate any in-flight peek `.then`s
   *  via the epoch counter. Pending commits (commitChainRef) are NOT cancelled
   *  — they finish so server state stays consistent. */
  const clearPrefetch = useCallback(() => {
    prefetchEpochRef.current++
    prefetchRef.current = { state: 'idle' }
  }, [])

  /**
   * Fire a background peekBall for the next extra. The response is stashed in
   * prefetchRef and consumed by the next user click. No UI side effects.
   * Silent on error — user click falls back to a fresh commit.
   */
  const kickoffPrefetch = useCallback(() => {
    const roundId = roundIdRef.current
    const round = roundRef.current
    if (!roundId || !round) return
    if (prefetchRef.current.state !== 'idle') return
    if (!round.extraAvailable && !round.superExtraAvailable) return

    const epoch = prefetchEpochRef.current
    const promise = peekBall(roundId)
      .then((res): DrawResponse | null => {
        // Discard if round changed or peek was cancelled (clear/endRound)
        if (roundIdRef.current !== roundId) return null
        if (prefetchEpochRef.current !== epoch) return null
        prefetchRef.current = { state: 'ready', response: res, forRoundId: roundId }
        return res
      })
      .catch(err => {
        console.debug('[useServerEngine] peek failed:', err)
        if (prefetchEpochRef.current === epoch && prefetchRef.current.forRoundId === roundId) {
          prefetchRef.current = { state: 'idle' }
        }
        return null
      })
    prefetchRef.current = { state: 'pending', promise, forRoundId: roundId }
  }, [])
  kickoffPrefetchRef.current = kickoffPrefetch

  /**
   * Queue a commit drawBall behind any in-flight commits. Retries network
   * errors with backoff. On success, kicks off the next peek — only after
   * the server's drawCount has actually advanced, so the next peek can't
   * race-read a stale drawCount and return the same ball again.
   *
   * The captured roundId is used unconditionally: if the user moved to a
   * new round before this commit ran, we still persist to the original
   * roundId (server 409/404 are silently OK), preventing the OLD round
   * from being finalised with stale drawCount.
   */
  const queueCommit = useCallback((roundId: string) => {
    const epoch = commitEpochRef.current
    pendingCommitsRef.current++
    commitChainRef.current = commitChainRef.current
      .catch(() => {})
      .then(async () => {
        try {
          // 3 attempts (~6s worst case) keeps UX snappy. Beyond that,
          // local state may stay ahead of server until next newRound resets it
          // — acceptable for V1 single-user/mobile WebView; not worth a full
          // getRound resync flow yet.
          const maxAttempts = 3
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
              await drawBall(roundId)
              // Server drawCount advanced — next peek is safe to fire
              if (roundIdRef.current === roundId) {
                kickoffPrefetchRef.current()
              }
              return
            } catch (err) {
              const givingUp = !isNetworkError(err) || attempt === maxAttempts - 1
              if (givingUp) {
                console.error('[useServerEngine] commit failed:', err)
                // Disable extras so the idle path can't fire drawBall for the
                // same stale drawCount (HIGH duplication). Applies to both
                // exhausted-retry network failures and immediate HTTP errors
                // (5xx/409) — both leave local state ahead of the server.
                // Skip if the user already moved on to a fresh round.
                if (roundIdRef.current !== roundId) return
                const round = roundRef.current
                if (round) {
                  round.extraAvailable = false
                  round.superExtraAvailable = false
                  rerender()
                }
                return
              }
              const delay = Math.min(2000 * Math.pow(2, attempt), 4000)
              await new Promise(r => setTimeout(r, delay))
            }
          }
        } finally {
          // Skip decrement if a round change reset the counter — otherwise
          // this stale finish would drive it negative and unblock the
          // idle-path guard for the new round.
          if (commitEpochRef.current === epoch) {
            pendingCommitsRef.current--
            // Re-evaluate canAdvance once the chain drains so the button
            // un-disables when the last commit acks (no other render fires).
            if (pendingCommitsRef.current === 0) rerender()
          }
        }
      })
  }, [rerender])

  /**
   * Serialise endRound behind any pending commits. All three end paths
   * (manual endRound, autoNewRound, post-conference auto-end) must go through
   * this so the server's final payout includes every committed extra.
   */
  const finalizeRound = useCallback((roundId: string) => {
    commitChainRef.current = commitChainRef.current
      .catch(() => {})
      .then(() => apiEndRound(roundId))
      .then(() => undefined)
      .catch(err => {
        // 409 = already completed; rest are network/server issues
        console.error('[useServerEngine] endRound failed:', err)
      })
  }, [])

  const fetchExtraDraw = useCallback(() => {
    const roundId = roundIdRef.current
    if (!roundId || fetchingRef.current) return

    // Apply a ready peek synchronously, fire commit in background.
    // Next peek is kicked off by queueCommit AFTER the commit acks, so the
    // server's drawCount has advanced — otherwise peek would race-read
    // the same drawCount and return the same ball twice.
    if (prefetchRef.current.state === 'ready' && prefetchRef.current.forRoundId === roundId) {
      const res = prefetchRef.current.response!
      prefetchRef.current = { state: 'idle' }
      const round = roundRef.current
      if (round) {
        clearRetry() // drop any stale retry timer from a prior failure
        applyDrawResponse(round, res)
        targetBallCountRef.current = round.draws.length
        rerender()
        queueCommit(roundId)
      }
      return
    }

    // Peek in flight — wait for it instead of duplicating the request
    if (prefetchRef.current.state === 'pending' && prefetchRef.current.forRoundId === roundId) {
      const epoch = prefetchEpochRef.current
      fetchingRef.current = true
      rerender()
      prefetchRef.current.promise!
        .then(res => {
          fetchingRef.current = false
          // Round transitioned (endRound/newRound) before peek landed — discard
          if (prefetchEpochRef.current !== epoch || roundIdRef.current !== roundId) {
            rerender()
            return
          }
          if (!res) {
            // Peek failed — fall through to a fresh commit
            fetchExtraDrawRef.current()
            return
          }
          const round = roundRef.current
          if (round) {
            clearRetry() // drop any stale retry timer from a prior failure
            applyDrawResponse(round, res)
            targetBallCountRef.current = round.draws.length
            rerender()
            prefetchRef.current = { state: 'idle' }
            queueCommit(roundId) // chains next peek on commit ack
          }
        })
      return
    }

    // No peek available — straight commit.
    // Block if a previous commit is still in flight: drawBall direct would
    // bypass commitChainRef and race the queued commit for the same drawCount.
    // The chained commit will fire the next peek on ack, then user click hits
    // ready/pending path instead.
    if (pendingCommitsRef.current > 0) return

    fetchingRef.current = true
    rerender() // disable button immediately
    drawBall(roundId)
      .then(res => {
        // Discard if the round changed while we were waiting on the network
        if (roundIdRef.current !== roundId) return
        clearRetry()
        const round = roundRef.current
        if (!round) return
        applyDrawResponse(round, res)
        // Bump target so BallPanel animates the new ball
        targetBallCountRef.current = round.draws.length
        rerender()
        kickoffPrefetch()
      })
      .catch(err => {
        console.warn('[useServerEngine] drawExtra failed:', err)
        if (isNetworkError(err)) {
          retryTargetRef.current = () => { fetchingRef.current = false; fetchExtraDrawRef.current() }
          scheduleRetry()
        } else {
          // Server says no extras — sync client state
          const round = roundRef.current
          if (round) {
            round.extraAvailable = false
            round.superExtraAvailable = false
            rerender()
          }
        }
      })
      .finally(() => {
        fetchingRef.current = false
        rerender()
      })
  }, [rerender, scheduleRetry, clearRetry, kickoffPrefetch, queueCommit])
  fetchExtraDrawRef.current = fetchExtraDraw

  const drawExtra = useCallback(() => {
    fetchExtraDraw()
  }, [fetchExtraDraw])

  const drawSuperExtra = useCallback(() => {
    fetchExtraDraw()
  }, [fetchExtraDraw])

  // ── drawNext / drawAll — target count bumps (initial 30 pre-fetched) ──

  const drawNext = useCallback(() => {
    const round = roundRef.current
    if (!round) return
    targetBallCountRef.current = Math.min(
      targetBallCountRef.current + 1,
      round.draws.length,
    )
    rerender()
  }, [rerender])

  const drawAll = useCallback(() => {
    const round = roundRef.current
    if (!round) return
    // Target the lesser of DEFAULT_BALLS or available draws
    targetBallCountRef.current = Math.min(DEFAULT_BALLS, round.draws.length)
    rerender()
  }, [rerender])

  // ── autoNewRound — shared helper for auto-end flow ────────────

  const autoNewRound = useCallback(() => {
    const prevPayout = roundRef.current?.totalPayout ?? 0
    if (prevPayout > 0) setLastPayout(prevPayout)
    setIsCollecting(false)
    // Cancel any in-flight peek for the old round
    clearPrefetch()
    // Complete old round on server — serialised behind pending commits
    const oldId = roundIdRef.current
    if (oldId) finalizeRound(oldId)
    newRound()
  }, [newRound, clearPrefetch, finalizeRound])
  // Stable ref — avoids stale closures in setTimeout callbacks
  const autoNewRoundRef = useRef(autoNewRound)
  autoNewRoundRef.current = autoNewRound

  // ── Stake change → new round with same cards (reuse seed) ──
  // Triggers when idle (drawnIndex === 0) OR settled/conference (not actively drawing).
  // IMPORTANT: prevStakeIndex is only updated when we actually process the change.
  // If fetchingRef blocks us, we leave prevStakeIndex stale so the post-fetch
  // re-check in newRoundImpl.finally() picks up the pending change.
  useEffect(() => {
    if (stakeIndex === prevStakeIndexRef.current) return
    if (!roundRef.current || fetchingRef.current) return
    prevStakeIndexRef.current = stakeIndex
    const idle = drawnIndexRef.current === 0
    const settled = drawnIndexRef.current >= targetBallCountRef.current
    if (idle || settled) {
      // Cancel any pending auto-end timers
      if (autoEndTimerRef.current) {
        clearTimeout(autoEndTimerRef.current)
        autoEndTimerRef.current = null
      }
      autoEndFiredRef.current = false
      setIsCollecting(false)
      newRoundImpl(true) // reuse seed → same cards, new payouts
    }
  }, [stakeIndex, newRoundImpl])

  // ── endRound — manual end (skip extras) ───────────────────────

  const endRoundHandler = useCallback(() => {
    const round = roundRef.current
    const roundId = roundIdRef.current
    if (!round || !roundId) return

    targetBallCountRef.current = drawnIndexRef.current
    if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current)
    // Reset peel state
    isPeelingRef.current = false
    setIsPeeling(false)
    peelAdvanceTickRef.current = 0
    // Drop unconsumed peek — server DDB hasn't been touched by it
    clearPrefetch()

    // Serialise behind pending commits so server's payout is correct
    finalizeRound(roundId)

    // AS3: apply x2 multiplier bonus at end of round (server-authoritative, idempotent)
    roundRef.current?.applyMultiplierBonus()

    if (round.totalPayout > 0) {
      setIsCollecting(true)
      rerender()
      autoEndTimerRef.current = setTimeout(() => autoNewRoundRef.current(), 1500)
    } else {
      autoEndTimerRef.current = setTimeout(() => autoNewRoundRef.current(), 300)
    }
  }, [rerender, clearPrefetch, finalizeRound])

  // ── Advance — unified button handler ──────────────────────────

  const advance = useCallback(() => {
    const round = roundRef.current
    if (!round || fetchingRef.current) return

    const idx = drawnIndexRef.current

    // Peel in progress — advance peel step
    if (isPeelingRef.current) {
      peelAdvanceTickRef.current++
      rerender()
      return
    }

    if (idx === 0 || (idx < DEFAULT_BALLS && !round.shouldHalt)) {
      // Start or resume auto-discharge → target all 30 pre-fetched draws
      targetBallCountRef.current = Math.min(DEFAULT_BALLS, round.draws.length)
    } else if (idx < DEFAULT_BALLS && round.shouldHalt) {
      // Halted → resume discharge
      targetBallCountRef.current = Math.min(DEFAULT_BALLS, round.draws.length)
    } else if (round.extraAvailable || round.superExtraAvailable) {
      // Extra/Super — fetch from server (fetchExtraDraw manages its own fetchingRef)
      fetchExtraDraw()
      return
    } else {
      // Done — end + new round
      if (autoEndTimerRef.current) {
        clearTimeout(autoEndTimerRef.current)
        autoEndTimerRef.current = null
      }
      // AS3: apply x2 multiplier bonus (server-authoritative, idempotent)
      roundRef.current?.applyMultiplierBonus()
      const prevPayout = round.totalPayout
      if (prevPayout > 0) setLastPayout(prevPayout)
      setIsCollecting(false)
      autoPlayAfterNewRef.current = true
      newRound()
      return
    }
    rerender()
  }, [stakeIndex, fetchExtraDraw, rerender])

  // ── Derive state (same logic as useDebugEngine) ───────────────

  const round = roundRef.current
  const drawn = drawnIndexRef.current
  const isSettling = round ? drawn < targetBallCountRef.current : false
  const halted = round?.shouldHalt ?? false

  // All draws consumed by animation AND no pending server draws
  const allDrawsConsumed = !!round && drawn >= round.draws.length
  // Track when everything becomes idle after draws consumed.
  // Use wall-clock time (not render count) to ensure animations complete.
  const idleSinceRef = useRef(0)
  const STABLE_IDLE_MS = 2000 // 2s grace for last ball to settle + pattern anims
  if (allDrawsConsumed && drawn > 0 && !bonusActive && !isSettling && !isCollecting && !isPeeling) {
    if (idleSinceRef.current === 0) idleSinceRef.current = Date.now()
  } else {
    idleSinceRef.current = 0
  }
  if (drawn === 0) idleSinceRef.current = 0
  const stableIdle = idleSinceRef.current > 0 && (Date.now() - idleSinceRef.current) >= STABLE_IDLE_MS
  // When idle state starts, schedule a render after STABLE_IDLE_MS to evaluate stableIdle
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (idleSinceRef.current > 0 && !stableIdle && !idleTimerRef.current) {
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null
        rerender()
      }, STABLE_IDLE_MS + 50) // +50ms buffer
    }
    if (idleSinceRef.current === 0 && idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  })

  let advanceLabel = 'Play'
  let canAdvance = false

  if (!round) {
    advanceLabel = 'Play'
    canAdvance = true // Allow starting first round
  } else if (isPeeling) {
    advanceLabel = 'Peel'
    canAdvance = true
  } else if (drawn < DEFAULT_BALLS && halted && !bonusActive) {
    advanceLabel = 'Next'
    canAdvance = true
  } else if (isSettling || bonusActive || fetchingRef.current || pendingCommitsRef.current > 0) {
    // Busy — show current phase label but disabled.
    // pendingCommitsRef > 0 means a peek-consumed draw is still committing;
    // fetchExtraDraw's idle path bails until it acks. Without this guard the
    // button would look clickable but taps would be silently ignored.
    if (drawn < DEFAULT_BALLS) {
      advanceLabel = 'Play'
    } else if (round.superExtraAvailable) {
      advanceLabel = 'Super Extra'
    } else if (round.extraAvailable) {
      advanceLabel = 'Extra'
    } else {
      advanceLabel = 'Play'
    }
    canAdvance = false
  } else if (drawn === 0) {
    advanceLabel = 'Play'
    canAdvance = true
  } else if (drawn < DEFAULT_BALLS) {
    advanceLabel = 'Play'
    canAdvance = true
  } else if (round.extraAvailable) {
    advanceLabel = 'Extra'
    canAdvance = true
  } else if (round.superExtraAvailable) {
    advanceLabel = 'Super Extra'
    canAdvance = true
  } else {
    advanceLabel = 'Play'
    canAdvance = true
  }

  // End button — only when there's a choice to skip
  const canEnd = !!round && !isCollecting && drawn >= DEFAULT_BALLS &&
    (round.extraAvailable || round.superExtraAvailable || isPeeling)

  // Auto-end: when round is done (no more extras), wait then auto new round
  if (!round || drawn === 0) {
    autoEndFiredRef.current = false
  }
  // Track: has bonusActive completed a full cycle (true→false) this round?
  const bonusCycledRef = useRef(false)
  if (bonusActive) bonusCycledRef.current = true // mark that bonus started
  if (drawn === 0) bonusCycledRef.current = false // reset on new round

  // If slot was triggered with a prize, block roundDone until bonus has cycled (true→false)
  const slotNeedsBonus = !!round && round.slotBonus.triggered && round.slotBonus.prize != null
  const bonusResolved = !slotNeedsBonus || (bonusCycledRef.current && !bonusActive)

  const roundDone = !!round && drawn >= DEFAULT_BALLS &&
    !round.extraAvailable && !round.superExtraAvailable &&
    !fetchingRef.current &&
    stableIdle && bonusResolved &&
    allDrawsConsumed && drawn > 0

  // Cancel pending auto-end if extras became available (e.g. fruit bomb enabled them)
  if (autoEndFiredRef.current && round && (round.extraAvailable || round.superExtraAvailable)) {
    if (autoEndTimerRef.current) { clearTimeout(autoEndTimerRef.current); autoEndTimerRef.current = null }
    autoEndFiredRef.current = false
  }

  if (roundDone && !autoEndFiredRef.current) {
    autoEndFiredRef.current = true
    if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current)

    // AS3: apply x2 multiplier bonus at end of round (server-authoritative, idempotent)
    roundRef.current?.applyMultiplierBonus()
    rerender()

    const payout = round?.totalPayout ?? 0
    if (payout > 0) {
      // Conference → collect animation → new round
      autoEndTimerRef.current = setTimeout(() => {
        setIsCollecting(true)
        rerender()
        // End on server — serialised behind pending commits
        clearPrefetch()
        const rid = roundIdRef.current
        if (rid) finalizeRound(rid)
        // Wait for collection to finish, then new round
        autoEndTimerRef.current = setTimeout(() => autoNewRoundRef.current(), 2000)
      }, CONFERENCE_TIMEOUT)
    } else {
      // No payout — conference → new round
      autoEndTimerRef.current = setTimeout(() => autoNewRoundRef.current(), CONFERENCE_TIMEOUT)
    }
  }

  // ── First-click behavior: if no round yet, advance creates one ──

  const advanceWithInit = useCallback(() => {
    if (!roundRef.current && !fetchingRef.current) {
      // First click — create round then start discharge
      fetchingRef.current = true
      createRound(STAKE_LEVELS[stakeIndex])
        .then(res => {
          clearRetry()
          cardNumbersRef.current = res.cards.map(c => {
            const nums: number[] = []
            for (let col = 0; col < c.numbers[0].length; col++)
              for (let row = 0; row < c.numbers.length; row++)
                if (c.numbers[row][col] > 0) nums.push(c.numbers[row][col])
            return nums
          })
          const rd = hydrateRound(res, STAKE_LEVELS[stakeIndex])
          roundRef.current = rd
          roundIdRef.current = res.roundId
          drawnIndexRef.current = 0
          autoEndFiredRef.current = false
          targetBallCountRef.current = Math.min(DEFAULT_BALLS, rd.draws.length)
          rerender()
        })
        .catch(err => {
          console.error('[useServerEngine] initial newRound failed:', err)
          if (isNetworkError(err)) {
            retryTargetRef.current = () => { fetchingRef.current = false; advanceWithInitRef.current() }
            scheduleRetry()
          }
        })
        .finally(() => {
          fetchingRef.current = false
          rerender()
        })
      return
    }
    advance()
  }, [stakeIndex, advance, rerender, scheduleRetry, clearRetry])
  advanceWithInitRef.current = advanceWithInit

  return {
    // Cast ServerRound as Round — they're duck-type compatible for all component access
    round: round as unknown as Round | null,
    seed,
    lockSeed,
    setLockSeed: (locked: boolean) => {
      lockSeedRef.current = locked
      setLockSeed(locked)
      if (locked) {
        lastResponseRef.current = null
        newRound() // immediately create round with locked seed
      }
    },
    stake,
    stakeIndex,
    targetBallCount: targetBallCountRef.current,
    isSettling,
    advanceLabel,
    canAdvance,
    canEnd,
    isCollecting,
    lastPayout,
    bonusActive,
    setBonusActive,
    endRound: endRoundHandler,
    setSeed: (s: number) => {
      seedRef.current = s
      setSeed(s)
      // If locked, immediately create round with new seed
      if (lockSeedRef.current) {
        lastResponseRef.current = null
        newRound()
      }
    },
    setStakeIndex: (i: number) => setStakeIndex(Math.max(0, Math.min(i, STAKE_LEVELS.length - 1))),
    newRound,
    shuffle,
    advance: advanceWithInit,
    drawNext,
    drawAll,
    drawExtra,
    drawSuperExtra,
    processNextBall,
    isPeeling,
    peelAdvanceTick: peelAdvanceTickRef.current,
    handlePeelChange,
    retrying,
  }
}

