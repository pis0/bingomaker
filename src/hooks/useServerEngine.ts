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
import { createRound, drawBall, endRound as apiEndRound } from '../api/client'
import type { CreateRoundResponse } from '../../server/src/types/api'
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
  /** Auto-start discharge after next newRound completes */
  const autoPlayAfterNewRef = useRef(false)
  const targetBallCountRef = useRef(0)
  /** How many draws have been consumed by BallPanel animation */
  const drawnIndexRef = useRef(0)
  /** True while an API call is in-flight (prevents double-clicks) */
  const fetchingRef = useRef(false)

  const autoEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoEndFiredRef = useRef(false)

  const rerender = useCallback(() => setTick(t => t + 1), [])

  const handlePeelChange = useCallback((peeling: boolean) => {
    isPeelingRef.current = peeling
    setIsPeeling(peeling)
    if (!peeling) peelAdvanceTickRef.current = 0
  }, [])

  // ── newRound — POST /rounds ───────────────────────────────────

  const newRound = useCallback(() => {
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

    // Locked seed → always create on server (need valid roundId for extras)
    // Same seed = same cards/draws = deterministic replay

    fetchingRef.current = true
    const requestSeed = lockSeedRef.current ? seedRef.current : undefined
    console.log(`[newRound] lock=${lockSeedRef.current} seed=${seedRef.current} sending=${requestSeed ?? 'random'}`)
    createRound(STAKE_LEVELS[stakeIndex], requestSeed)
      .then(res => {
        lastResponseRef.current = res
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
      })
      .finally(() => {
        fetchingRef.current = false
        rerender()
      })
  }, [stakeIndex, rerender])

  // Auto-create first round on mount (idle with cards visible)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      newRound()
    }
  }, [newRound])

  // ── shuffle — new round with same stake (new cards) ───────────

  const shuffle = useCallback(() => {
    if (!roundRef.current) return
    newRound()
  }, [newRound])

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

    bumpTick() // Force Zustand subscribers to re-read mutated card state
    rerender()
    return draw
  }, [rerender])

  // ── drawExtra/drawSuperExtra — fetch from server ──────────────

  const fetchExtraDraw = useCallback(() => {
    const roundId = roundIdRef.current
    if (!roundId || fetchingRef.current) return

    fetchingRef.current = true
    rerender() // disable button immediately
    drawBall(roundId)
      .then(res => {
        const round = roundRef.current
        if (!round) return
        applyDrawResponse(round, res)
        // Bump target so BallPanel animates the new ball
        targetBallCountRef.current = round.draws.length
        rerender()
      })
      .catch(err => {
        console.warn('[useServerEngine] drawExtra failed:', err)
        // Server says no extras — sync client state
        const round = roundRef.current
        if (round) {
          round.extraAvailable = false
          round.superExtraAvailable = false
          rerender()
        }
      })
      .finally(() => {
        fetchingRef.current = false
        rerender()
      })
  }, [rerender])

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
    // Complete old round on server (fire-and-forget, silently ignore 409 = already completed)
    const oldId = roundIdRef.current
    if (oldId) apiEndRound(oldId).catch(() => { /* already completed — ok */ })
    newRound()
  }, [newRound])

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

    // Notify server the round is ending
    apiEndRound(roundId).catch(err => {
      console.error('[useServerEngine] endRound API failed:', err)
    })

    if (round.totalPayout > 0) {
      setIsCollecting(true)
      rerender()
      autoEndTimerRef.current = setTimeout(autoNewRound, 1500)
    } else {
      autoEndTimerRef.current = setTimeout(autoNewRound, 300)
    }
  }, [autoNewRound, rerender])

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
  } else if (isSettling || bonusActive || fetchingRef.current) {
    // Busy — show current phase label but disabled
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
    const payout = round?.totalPayout ?? 0
    if (payout > 0) {
      // Conference → collect animation → new round
      autoEndTimerRef.current = setTimeout(() => {
        setIsCollecting(true)
        rerender()
        // End on server
        const rid = roundIdRef.current
        if (rid) apiEndRound(rid).catch(() => {})
        // Wait for collection to finish, then new round
        autoEndTimerRef.current = setTimeout(autoNewRound, 2000)
      }, CONFERENCE_TIMEOUT)
    } else {
      // No payout — conference → new round
      autoEndTimerRef.current = setTimeout(autoNewRound, CONFERENCE_TIMEOUT)
    }
  }

  // ── First-click behavior: if no round yet, advance creates one ──

  const advanceWithInit = useCallback(() => {
    if (!roundRef.current && !fetchingRef.current) {
      // First click — create round then start discharge
      fetchingRef.current = true
      createRound(STAKE_LEVELS[stakeIndex])
        .then(res => {
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
        })
        .finally(() => {
          fetchingRef.current = false
          rerender()
        })
      return
    }
    advance()
  }, [stakeIndex, advance, rerender])

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
  }
}

