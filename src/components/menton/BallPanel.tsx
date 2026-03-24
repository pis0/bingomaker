import { useCallback, useEffect, useRef, useState } from 'react'
import { Sprite, Container, BitmapText, Ticker, MeshPlane, AnimatedSprite, Assets, Texture } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex, textures as getTextures } from '../../assets/atlas'
import { BALL_PANEL_X, BALL_PANEL_Y } from './layoutConstants'
import {
  TUBING_Y,
  PIPE_X,
  EXTRA_FRONT_Y,
  BG_EXTRA_X,
  FUNDO_Y,
  TAMPA_Y,
  COVER_X, COVER_Y, COVER_PIVOT_X, COVER_PIVOT_Y,
  COVER_ROTATION_CLOSED, COVER_ROTATION_OPEN,
  COVER_CLOSE_DURATION, COVER_OPEN_DURATION, COVER_SPLASH_CLOSE_DURATION,
  POPPER_X, POPPER_Y,
  IDLE_CONTAINER_X, IDLE_CONTAINER_Y,
  IDLE_LEMON_X, IDLE_LEMON_Y,
  COUNTER_X, COUNTER_Y,
  LARGE_BALL_X, LARGE_BALL_Y,
  ROW_0_Y, ROW_1_Y,
  ROW_0_START_X, ROW_1_START_X,
  BALL_SPACING, BALL_ROW_SIZE,
  EXTRA_GRID_START_X, EXTRA_GRID_COL_SPACING, EXTRA_GRID_ROW_SPACING, EXTRA_GRID_BASE_Y,
  TEXT_FADE_IN, TEXT_HOLD, TEXT_FADE_OUT,
  PEEL_STEP_TWEEN, PEEL_FLING_TWEEN,
  PEEL_COVER_ROTATIONS, PEEL_WOBBLE_AMPLITUDE, PEEL_WOBBLE_SPEED,
  PEEL_BALL_X, PEEL_BALL_Y, PEEL_BALL_SCALE,
} from './ballConstants'
import BallCounter from './BallCounter'
import AnimatedBall from './AnimatedBall'
import type { BallType } from './AnimatedBall'
import TubeWater from './TubeWater'
import IdleLemon from './IdleLemon'
import SliceMovie from './SliceMovie'
import MovieSplash, { type MovieSplashHandle } from './MovieSplash'
import { DEFAULT_BALLS, EXTRA_BALLS, HALT_PRIORITY } from '../../engine/constants'
import type { Round } from '../../engine/Round'
import { useGameStore } from '../../store/gameStore'
import { ParticleEmitter } from '../../particles/ParticleEmitter'
import { mentonExtraWater } from '../../particles/configs/menton_extra_water'
import { playSFX } from '../../audio/AudioManager'
import { BALL_SHOT, BALL_HIT, EXTRA_BALL_ACTIVATED, SUPER_BALL_ACTIVATED, PEEL } from '../../audio/SoundID'

extend({ Sprite, Container, BitmapText, AnimatedSprite })

/** Random volume between min and max — avoids robotic repetition */
const rVol = (min: number, max: number) => min + Math.random() * (max - min)


const MAX_EXTRA_INDEX = DEFAULT_BALLS + EXTRA_BALLS

/** Determine ball type from draw index */
function ballType(index: number): BallType {
  if (index < DEFAULT_BALLS) return 'regular'
  if (index < MAX_EXTRA_INDEX) return 'extra'
  return 'super'
}

/** Compute final x,y for a regular ball at draw index (0-29) */
function regularPosition(index: number): { x: number; y: number } {
  const row = Math.floor(index / BALL_ROW_SIZE)
  const col = index % BALL_ROW_SIZE
  const startX = row === 0 ? ROW_0_START_X : ROW_1_START_X
  const y = row === 0 ? ROW_0_Y : ROW_1_Y
  return { x: startX - BALL_SPACING * col, y }
}

/** Compute final x,y for an extra ball at draw index (30-39) */
function extraPosition(index: number): { x: number; y: number } {
  const i = index - DEFAULT_BALLS
  const col = Math.floor(i / 2)
  const row = i % 2
  return {
    x: EXTRA_GRID_START_X - EXTRA_GRID_COL_SPACING * col,
    y: EXTRA_GRID_BASE_Y - EXTRA_GRID_ROW_SPACING * row,
  }
}

/** Compute position and stack pos for super extra at draw index (40+) */
function superPosition(index: number): { superPos: number } {
  return { superPos: index - MAX_EXTRA_INDEX }
}

// ── Easing ──────────────────────────────────────────────────────
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}
function easeOutBack(t: number): number {
  const s = 1.70158
  const t1 = t - 1
  return t1 * t1 * ((s + 1) * t1 + s) + 1
}
function easeOutCubic(t: number): number {
  const t1 = t - 1
  return t1 * t1 * t1 + 1
}

// AS3: dynamic ball trigger interval based on maxPatternPriority
// Original AS3 (30fps): [3,3,4,5,6,7,8,12,15,20,30] frames → converted to ms
const TRIGGER_INTERVALS_MS = [4, 4, 6, 7, 8, 10, 11, 16, 20, 27, 40].map(f => f / 60 * 1000)

interface Props {
  onBallArrive?: () => void
  /** Reports when peel animation starts/ends (for halt-for-user) */
  onPeelChange?: (peeling: boolean) => void
  /** Reports when super balls are in flight (for z-order toggle — AS3: addChild/addChildAt) */
  onSuperFlyingChange?: (flying: boolean) => void
  /** Ref to trigger MovieSplash animation (prize celebration) */
  splashRef?: React.RefObject<MovieSplashHandle | null>
}

/**
 * AS3: BallPanelMenton — full ball panel with regular, extra, and super extra support.
 *
 * Layers (render order):
 * 1. bgextraball / bgextraball_full — background for extra area
 * 2. extragratis grid — placeholder slots for extra balls
 * 3. ballcontainer2 — rear tube
 * 4. AnimatedBall sprites (regular + extra + super)
 * 5. Water effects
 * 6. ballpipe — pipe tip
 * 7. BallCounter
 * 8. ballcontainer1 — front tube
 * 9. Extra front container (pipoqueira): fundo, lemon, tampa, large ball, cover
 * 10. Text overlay ("EXTRA" / "SUPER")
 */
export default function BallPanel({ onBallArrive, onPeelChange, onSuperFlyingChange, splashRef }: Props) {
  // ── Read from Zustand store ─────────────────────────────────────
  const round = useGameStore(s => s.round)
  const targetBallCount = useGameStore(s => s.targetBallCount)
  const stake = useGameStore(s => s.stake)
  const paused = useGameStore(s => s.bonusActive)
  const peelAdvanceTick = useGameStore(s => s.peelAdvanceTick)
  const superFlying = useGameStore(s => s.superFlying)

  // Derived locally
  const maxPriority = round?.maxPatternPriority ?? 0
  const launchInterval = TRIGGER_INTERVALS_MS[Math.min(maxPriority, TRIGGER_INTERVALS_MS.length - 1)]
  const zIndex = superFlying ? 100 : 4
  const isIdle = !round || targetBallCount === 0

  // ── Animation queue ──────────────────────────────────────────────
  const [launchedIndices, setLaunchedIndices] = useState<number[]>([])
  const [flowing, setFlowing] = useState(false)
  const flowingRef = useRef(false)
  const processedCountRef = useRef(0)
  const queueRef = useRef<number[]>([])
  const roundRef = useRef(round)
  roundRef.current = round

  // ── Super ball z-order toggle (AS3: addChild/addChildAt during fitToLastSuperPosition) ──
  const superSettledCountRef = useRef(0)
  const superLaunchedCountRef = useRef(0)
  const onSuperFlyingChangeRef = useRef(onSuperFlyingChange)
  onSuperFlyingChangeRef.current = onSuperFlyingChange

  const handleSuperSettled = useCallback(() => {
    superSettledCountRef.current++
    if (superSettledCountRef.current >= superLaunchedCountRef.current) {
      onSuperFlyingChangeRef.current?.(false)
    }
  }, [])

  // ── Peel animation state (extra/super ball launch buildup) ─────
  const peelRef = useRef({
    active: false,
    ballNumber: 0,
    step: 3,
    stepStartTime: 0,
    rotation: 0,
    dispatchReady: false,
  })
  const [peelVisible, setPeelVisible] = useState(false)
  const [peelBallNumber, setPeelBallNumber] = useState(0)
  const peelBallContainerRef = useRef<Container>(null)
  const onPeelChangeRef = useRef(onPeelChange)
  onPeelChangeRef.current = onPeelChange
  const prevPeelTickRef = useRef(0)

  // Reset on round change
  const prevRoundRef = useRef<Round | null>(null)
  useEffect(() => {
    if (round !== prevRoundRef.current) {
      prevRoundRef.current = round
      processedCountRef.current = 0
      queueRef.current = []
      setLaunchedIndices([])
      peelRef.current.active = false
      peelRef.current.dispatchReady = false
      setPeelVisible(false)
    }
  }, [round])

  // Detect new draws / undo — now supports ALL ball types (no cap at 30)
  const drawCount = targetBallCount
  useEffect(() => {
    if (drawCount === 0) {
      return
    } else if (drawCount > processedCountRef.current) {
      for (let i = processedCountRef.current; i < drawCount; i++) {
        queueRef.current.push(i)
      }
      processedCountRef.current = drawCount
    } else if (drawCount < processedCountRef.current) {
      processedCountRef.current = drawCount
      queueRef.current = queueRef.current.filter(i => i < drawCount)
      setLaunchedIndices(prev => prev.filter(i => i < drawCount))
    }
  }, [drawCount])

  // Process queue via ticker
  const intervalRef = useRef(launchInterval)
  intervalRef.current = launchInterval
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const onBallArriveRef = useRef(onBallArrive)
  onBallArriveRef.current = onBallArrive
  useEffect(() => {
    let msSinceLaunch = 999999
    const ticker = Ticker.shared
    const onTick = () => {
      const hasItems = queueRef.current.length > 0
      if (hasItems !== flowingRef.current) {
        flowingRef.current = hasItems
        setFlowing(hasItems)
      }
      if (!hasItems || pausedRef.current) return
      msSinceLaunch += ticker.deltaMS
      const nextIndex = queueRef.current[0]

      // ── Extra/super ball handling ──
      if (nextIndex != null && nextIndex >= DEFAULT_BALLS) {
        const peel = peelRef.current
        if (peel.active) return // peel in progress, wait

        const priority = roundRef.current?.maxPatternPriority ?? 0
        const shouldPeel = priority >= HALT_PRIORITY

        if (shouldPeel && !peel.dispatchReady) {
          // Start peel — high priority, build tension
          const ballNum = roundRef.current?.ballSequence[nextIndex] ?? 0
          peel.active = true
          peel.ballNumber = ballNum
          peel.step = 3
          peel.stepStartTime = performance.now()
          peel.rotation = Math.PI * Math.random()
          peel.dispatchReady = false
          setPeelBallNumber(ballNum)
          setPeelVisible(true)
          playSFX(PEEL, { volume: 0.2 })
          // Set cover to step 3 rotation
          const ca = coverAnimRef.current
          ca.current = coverRef.current?.rotation ?? ca.current
          ca.target = PEEL_COVER_ROTATIONS[3]
          ca.t0 = performance.now()
          ca.duration = PEEL_STEP_TWEEN
          ca.wobble = true
          ca.wobbleCenter = PEEL_COVER_ROTATIONS[3]
          ca.wobbleAmplitude = PEEL_WOBBLE_AMPLITUDE
          // Water spray at step 3
          const em = extraWaterRef.current
          if (em) {
            em.emitterY = -85 + Math.floor(50 * Math.random())
            em.stop()
            em.start(Ticker.shared)
            setTimeout(() => em.stop(), 166)
          }
          // Signal peel halt — user must click to advance steps
          onPeelChangeRef.current?.(true)
          return
        }

        if (peel.dispatchReady) {
          // Peel complete — dispatch ball
          peel.dispatchReady = false
        }

        // Dispatch extra (after peel, or direct if low priority)
        msSinceLaunch = 0
        const next = queueRef.current.shift()!
        setLaunchedIndices(prev => [...prev, next])
        onBallArriveRef.current?.()
        // Water spray on every extra dispatch
        const em = extraWaterRef.current
        if (em) {
          em.emitterY = -85 + Math.floor(50 * Math.random())
          em.stop()
          em.start(Ticker.shared)
          setTimeout(() => em.stop(), 166)
        }
        // Cover fling open + check if should close
        const ca = coverAnimRef.current
        ca.wobble = false
        if (!shouldPeel) {
          // No peel — quick fling open
          ca.current = coverRef.current?.rotation ?? ca.current
          ca.target = PEEL_COVER_ROTATIONS[0]
          ca.t0 = performance.now()
          ca.duration = PEEL_FLING_TWEEN
        }
        // Check if more extras available (round updated after processNextBall)
        const r = roundRef.current
        const moreExtras = r?.extraAvailable || r?.superExtraAvailable
        if (!moreExtras) {
          ca.pendingClose = true
        }
        return
      }

      // Regular ball dispatch
      if (msSinceLaunch >= intervalRef.current) {
        msSinceLaunch = 0
        const next = queueRef.current.shift()!
        playSFX(BALL_SHOT, { volume: rVol(0.05, 0.2) })
        setLaunchedIndices(prev => [...prev, next])
        onBallArriveRef.current?.()
      }
    }
    ticker.add(onTick)
    return () => { ticker.remove(onTick) }
  }, [])

  // ── Water float offset — synced with TubeWater Water2 Y timing ──
  // Water2: Y 30→15 (rise) over 2555ms, then 15→30 (fall) over 2000ms
  // Ball offset mirrors this: 0 → -3px (rise) → 0 (fall back)
  const FLOAT_AMP = 3 // max px the balls rise
  const FLOAT_RISE = 2555 // ms — matches W2_PH1
  const FLOAT_FALL = 2000 // ms — matches W2_PH2
  const floatStartRef = useRef(0)
  const [floatOffset, setFloatOffset] = useState(0)

  useEffect(() => {
    if (launchedIndices.length === 0) {
      setFloatOffset(0)
      return
    }
    if (floatStartRef.current === 0) floatStartRef.current = performance.now()
    const ticker = Ticker.shared
    const onTick = () => {
      const elapsed = performance.now() - floatStartRef.current
      if (elapsed < FLOAT_RISE) {
        // Rise phase: 0 → -FLOAT_AMP
        setFloatOffset(-FLOAT_AMP * (elapsed / FLOAT_RISE))
      } else if (elapsed < FLOAT_RISE + FLOAT_FALL) {
        // Fall phase: -FLOAT_AMP → 0
        const t = (elapsed - FLOAT_RISE) / FLOAT_FALL
        setFloatOffset(-FLOAT_AMP * (1 - t))
      } else {
        setFloatOffset(0)
        ticker.remove(onTick)
      }
    }
    ticker.add(onTick)
    return () => {
      ticker.remove(onTick)
      floatStartRef.current = 0
    }
  }, [launchedIndices.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ─────────────────────────────────────────────
  const drawing = launchedIndices.length > 0
  const ballCount = launchedIndices.length
  const lastLaunchedIndex = drawing ? launchedIndices[launchedIndices.length - 1] : -1
  const currentBall = drawing
    ? round?.ballSequence[lastLaunchedIndex] ?? 0
    : 0

  // Phase detection — driven by engine state, not launched balls.
  // AS3: visual changes (cover open, bg swap, text overlay) happen when extras
  // become AVAILABLE (after 30th ball), before the user presses Extra.
  const extraReady = round?.extraAvailable ?? false
  const superReady = round?.superExtraAvailable ?? false

  // Next extra ball stake type + price (for price display in pipoqueira)
  const nextDrawIndex = round?.currentBallIndex ?? 0
  const nextExtraStake = round?.extraStakeAt(nextDrawIndex) ?? 'coins'
  const nextExtraPrice = round?.extraPriceAt(nextDrawIndex, stake) ?? 0
  const hasLaunchedExtras = launchedIndices.some(i => i >= DEFAULT_BALLS)
  const hasLaunchedSupers = launchedIndices.some(i => i >= MAX_EXTRA_INDEX)
  // Detect newly launched super balls → signal "flying" to parent for z-order toggle
  const superCount = launchedIndices.filter(i => i >= MAX_EXTRA_INDEX).length
  useEffect(() => {
    if (superCount > superLaunchedCountRef.current) {
      superLaunchedCountRef.current = superCount
      onSuperFlyingChangeRef.current?.(true)
    }
  }, [superCount])
  // "In extra mode" = extras available OR already launched some
  const inExtraMode = extraReady || hasLaunchedExtras
  // "In super mode" = super available OR already launched some
  const inSuperMode = superReady || hasLaunchedSupers
  const isExtraPhase = inExtraMode && !inSuperMode
  const isSuperPhase = inSuperMode

  // ── Price text auto-scale (AS3: autoScale + resizeOffset) ─────
  // Scales down text if it exceeds the bigballv2 circle width (76px usable)
  const PRICE_MAX_WIDTH = 64
  const priceTextRef = useRef<BitmapText>(null)
  const priceTextAutoScale = useCallback((t: BitmapText | null) => {
    priceTextRef.current = t
  }, [])

  // Re-measure on every text change
  useEffect(() => {
    const t = priceTextRef.current
    if (!t) return
    t.scale.set(1)
    if (t.width > PRICE_MAX_WIDTH) {
      t.scale.set(PRICE_MAX_WIDTH / t.width)
    }
  }, [nextExtraPrice, nextExtraStake])

  // ── Extra water spray (AS3: extraWaterParticle) ─────────────────
  // Small burst of water particles at chute exit when extra ball launches
  const extraWaterRef = useRef<ParticleEmitter | null>(null)
  if (!extraWaterRef.current) {
    const waterTex = Assets.get<Texture>('menton_water') ?? Texture.WHITE
    extraWaterRef.current = new ParticleEmitter({ ...mentonExtraWater }, waterTex)
    // AS3: pos(145, -85) in BallPanel space
    extraWaterRef.current.emitterX = 145
    extraWaterRef.current.emitterY = -85
  }

  // Water spray is handled by peel step transitions (see queue processor + peelAdvanceTick effect)

  // Reset on round end
  useEffect(() => {
    if (!round) {
      extraWaterRef.current?.reset()
    }
  }, [round])

  // ── Peel step advance (user-driven) ─────────────────────────────
  // Each increment of peelAdvanceTick advances one peel step (3→2→1→0)
  useEffect(() => {
    if (peelAdvanceTick === prevPeelTickRef.current) return
    prevPeelTickRef.current = peelAdvanceTick

    const peel = peelRef.current
    if (!peel.active || peel.step <= 0) return

    // Play peel SFX only on intermediate steps (not the final open that dispatches)
    if (peel.step > 1) playSFX(PEEL, { volume: 0.2 })

    // Advance one step
    peel.step--
    peel.rotation += Math.PI * Math.random()

    // Update cover target (step 0 uses fast fling tween for force sensation)
    const ca = coverAnimRef.current
    ca.current = coverRef.current?.rotation ?? ca.current
    ca.target = PEEL_COVER_ROTATIONS[peel.step]
    ca.t0 = performance.now()
    ca.duration = peel.step === 0 ? PEEL_FLING_TWEEN : PEEL_STEP_TWEEN
    if (peel.step > 0) {
      ca.wobble = true
      ca.wobbleCenter = PEEL_COVER_ROTATIONS[peel.step]
      ca.wobbleAmplitude = PEEL_WOBBLE_AMPLITUDE
    } else {
      ca.wobble = false
    }

    // Water spray
    const em = extraWaterRef.current
    if (em) {
      em.emitterY = -85 + Math.floor(50 * Math.random())
      em.stop()
      em.start(Ticker.shared)
      setTimeout(() => em.stop(), 166)
    }

    // Step 0: dispatch immediately (cover tween plays in parallel)
    if (peel.step === 0) {
      peel.active = false
      peel.dispatchReady = true
      setPeelVisible(false)
      onPeelChangeRef.current?.(false)
    }
  }, [peelAdvanceTick])

  // ── 3D beat on extra grid (AS3: beatExtraBallContainer) ────────
  // Simulates 3D tilt with skewX/skewY when an extra ball lands.
  // Direction depends on slot: odd/even → skewY sign, upper/lower → skewX sign
  const extraGridRef = useRef<Container>(null)
  const meshRef = useRef<MeshPlane>(null)
  const beatRef = useRef({ active: false, t0: 0, direction: 0 }) // direction: -1 left, +1 right
  // Shake ticks — propagate micro-shake to settled balls
  const [shakeTick, setShakeTick] = useState(0)           // extra ball land → extra balls shake
  const [regularShakeTick, setRegularShakeTick] = useState(0)  // regular dispatch → settled regulars shake

  // AS3: beatIdleBalls() — triggered when a regular ball ARRIVES (not dispatches)
  const onRegularBallArrive = useCallback(() => {
    playSFX(BALL_HIT, { volume: rVol(0.2, 0.4) })
    setRegularShakeTick(t => t + 1)
  }, [])

  // Triggered by AnimatedBall.onArrive when extra ball reaches its slot
  const onExtraBallLand = useCallback((slot: number) => {
    playSFX(BALL_HIT, { volume: rVol(0.35, 0.55) })
    const beat = beatRef.current
    beat.active = true
    beat.t0 = performance.now()
    beat.direction = slot > 4 ? -1 : 1
    setShakeTick(t => t + 1)
  }, [])

  // ── Cover animation ───────────────────────────────────────────
  const coverRef = useRef<Sprite>(null)
  const coverAnimRef = useRef({
    target: COVER_ROTATION_CLOSED,
    current: COVER_ROTATION_CLOSED,
    t0: 0,
    duration: 0,
    wobble: false,
    wobbleCenter: 0,
    wobbleAmplitude: 0,
    pendingClose: false,
  })

  const setupCover = useCallback((sprite: Sprite | null) => {
    coverRef.current = sprite
    if (sprite) sprite.pivot.set(COVER_PIVOT_X, COVER_PIVOT_Y)
  }, [])

  // Cover closes when leaving extra mode (round end) — opening is handled by peel
  useEffect(() => {
    if (!inExtraMode) {
      const a = coverAnimRef.current
      if (a.target !== COVER_ROTATION_CLOSED) {
        a.current = coverRef.current?.rotation ?? a.current
        a.target = COVER_ROTATION_CLOSED
        a.t0 = performance.now()
        a.duration = COVER_CLOSE_DURATION
        a.wobble = false
      }
    }
  }, [inExtraMode])

  // ── Pipoqueira refs (shared by flash + splash) ──────────────
  const frontContainerRef = useRef<Container>(null)
  const largeBallRef = useRef<Container>(null)
  const extraPriceRef = useRef<Container>(null)

  // ── Large ball flash during extras (AS3: updateLargeBall on every draw) ──
  // When a new ball is dispatched during extras/supers, briefly show the ball
  // number in the pipoqueira (~2s) then restore the price display.
  const largeBallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevBallRef = useRef(0)
  useEffect(() => {
    if (!inExtraMode || currentBall === 0 || currentBall === prevBallRef.current) return
    prevBallRef.current = currentBall

    // Show ball, hide price
    if (largeBallRef.current) largeBallRef.current.visible = true
    if (extraPriceRef.current) extraPriceRef.current.visible = false

    // Restore after ~2s
    if (largeBallTimerRef.current) clearTimeout(largeBallTimerRef.current)
    largeBallTimerRef.current = setTimeout(() => {
      if (largeBallRef.current) largeBallRef.current.visible = false
      if (extraPriceRef.current) extraPriceRef.current.visible = true
    }, 1000)
  }, [currentBall, inExtraMode])

  // Cleanup timer on unmount/round change
  useEffect(() => {
    if (!drawing) {
      prevBallRef.current = 0
      if (largeBallTimerRef.current) { clearTimeout(largeBallTimerRef.current); largeBallTimerRef.current = null }
    }
  }, [drawing])

  // ── Splash orchestration (AS3: playSplash → shakePopper → resetPos) ──
  const movieSplashRef = useRef<MovieSplashHandle>(null)
  const popperRef = useRef<AnimatedSprite>(null)
  const splashCleanupRef = useRef<(() => void) | null>(null)

  // Expose orchestrated splash to parent via splashRef
  useEffect(() => {
    if (!splashRef) return
    const mutableRef = splashRef as React.MutableRefObject<MovieSplashHandle | null>
    mutableRef.current = {
      play: (text: string, ballNumber: string, onComplete?: () => void, onTextReady?: () => void) => {
        // Cleanup any previous splash
        splashCleanupRef.current?.()
        const timeouts: ReturnType<typeof setTimeout>[] = []
        const delay = (fn: () => void, ms: number) => { timeouts.push(setTimeout(fn, ms)) }
        splashCleanupRef.current = () => { timeouts.forEach(clearTimeout); timeouts.length = 0 }

        // AS3: hide(extraPriceContainer), show(largeBallContainer) with current ball number
        if (extraPriceRef.current) extraPriceRef.current.visible = false
        if (largeBallRef.current) largeBallRef.current.visible = true

        // Capture base position for shake restore
        const fc = frontContainerRef.current
        const baseX = fc?.x ?? 0
        const baseY = fc?.y ?? 0
        const popper = popperRef.current

        // Phase 1: Play popperJuice animation (pipo_juice frames, 1 loop)
        if (popper) {
          popper.visible = true
          popper.currentFrame = 0
          popper.play()
        }

        // Phase 2: After popper finishes → shake
        // Duration = totalFrames / (tickerFPS × animationSpeed) × 1000
        const popperDuration = popper ? (popper.totalFrames / (60 * 0.2)) * 1000 : 300
        delay(() => {
          // Hold popper at last frame
          if (popper) {
            popper.stop()
            popper.currentFrame = popper.totalFrames - 1
          }

          // Shake front container (AS3: 7 micro-tweens, 0.05s each, 0.28s total)
          if (fc) {
            const shakes = [
              { dx: 1, dy: 1, t: 0 }, { dx: -2, dy: -2, t: 50 },
              { dx: 1, dy: -1, t: 100 }, { dx: -1, dy: 1, t: 150 },
              { dx: 2, dy: -2, t: 200 }, { dx: -1, dy: -1, t: 250 },
              { dx: 0, dy: 0, t: 280 },
            ]
            for (const s of shakes) {
              delay(() => { fc.x = baseX + s.dx; fc.y = baseY + s.dy }, s.t)
            }
          }

          // Phase 3: After shake (280ms) → resetPos
          delay(() => {
            // Restore front container to original position
            if (fc) { fc.x = baseX; fc.y = baseY }

            // Hide large ball (AS3: largeBallContainer.visible = false)
            if (largeBallRef.current) largeBallRef.current.visible = false

            // Burst open cover: 0 → -2.2 rad, 1s, EASE_OUT_BACK
            const ca = coverAnimRef.current
            const cover = coverRef.current
            if (cover) {
              ca.current = cover.rotation
              ca.target = COVER_ROTATION_OPEN
              ca.t0 = performance.now()
              ca.duration = COVER_OPEN_DURATION
              ca.wobble = false
            }

            // Play MovieSplash (juice splash + ball + text)
            movieSplashRef.current?.play(text, ballNumber, () => {
              // Restore extra price (large ball stays hidden — React's visible={!inExtraMode} manages it)
              if (extraPriceRef.current) extraPriceRef.current.visible = true
              onComplete?.()
            }, onTextReady)

            // Hide popperJuice after 0.3s
            delay(() => {
              if (popper) popper.visible = false
            }, 300)

            // Close cover after 2.4s (0.2s duration)
            delay(() => {
              const ca2 = coverAnimRef.current
              const cover2 = coverRef.current
              if (cover2) {
                ca2.current = cover2.rotation
                ca2.target = COVER_ROTATION_CLOSED
                ca2.t0 = performance.now()
                ca2.duration = COVER_SPLASH_CLOSE_DURATION
                ca2.wobble = false
              }
            }, 2400)
          }, 280)
        }, popperDuration)
      }
    }
    return () => {
      mutableRef.current = null
      splashCleanupRef.current?.()
    }
  }, [splashRef])

  // ── Text overlay state ────────────────────────────────────────
  const [overlayText, setOverlayText] = useState<'extra' | 'super' | null>(null)
  const overlayShownRef = useRef({ extra: false, super: false })
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset overlay tracking on new round
  useEffect(() => {
    if (!round) {
      overlayShownRef.current = { extra: false, super: false }
      setOverlayText(null)
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
    }
  }, [round])

  // Trigger overlay on phase transition
  useEffect(() => {
    if (isExtraPhase && !overlayShownRef.current.extra) {
      overlayShownRef.current.extra = true
      playSFX(EXTRA_BALL_ACTIVATED, { volume: 0.4 })
      setOverlayText('extra')
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
      overlayTimerRef.current = setTimeout(() => setOverlayText(null), TEXT_FADE_IN + TEXT_HOLD + TEXT_FADE_OUT)
    }
    if (isSuperPhase && !overlayShownRef.current.super) {
      overlayShownRef.current.super = true
      playSFX(SUPER_BALL_ACTIVATED, { volume: 0.6 })
      setOverlayText('super')
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
      overlayTimerRef.current = setTimeout(() => setOverlayText(null), TEXT_FADE_IN + TEXT_HOLD + TEXT_FADE_OUT)
    }
  }, [isExtraPhase, isSuperPhase])

  // ── Text overlay animation (fade in → hold → fade out) ────────
  const overlayRef = useRef<BitmapText>(null)
  const overlayT0Ref = useRef(0)
  useEffect(() => {
    if (overlayText) overlayT0Ref.current = performance.now()
  }, [overlayText])

  // ── Per-frame animations (peel + cover + overlay) ──────────────
  useTick(() => {
    const now = performance.now()

    // ── Peel: visual update ───────────────────────────────────────
    // Step advancement + dispatch are user-driven (peelAdvanceTick effect).
    // Here we only update the stuck ball visual per frame.
    const peel = peelRef.current
    if (peel.active) {
      const ball = peelBallContainerRef.current
      if (ball) {
        ball.x = PEEL_BALL_X[peel.step]
        ball.y = PEEL_BALL_Y
        ball.rotation = peel.rotation
        ball.scale.set(PEEL_BALL_SCALE)
      }
    }

    // Cover rotation tween
    const cover = coverRef.current
    const ca = coverAnimRef.current
    if (cover && ca.duration > 0) {
      const t = Math.min(1, (now - ca.t0) / ca.duration)
      const eased = ca.target === COVER_ROTATION_CLOSED ? easeOutCubic(t) : easeOutBack(t)
      cover.rotation = ca.current + (ca.target - ca.current) * eased
      if (t >= 1) {
        cover.rotation = ca.target
        ca.duration = 0
        ca.current = ca.target
        // Chain: after open tween finishes, start close
        if (ca.pendingClose) {
          ca.pendingClose = false
          ca.current = ca.target
          ca.target = COVER_ROTATION_CLOSED
          ca.t0 = now
          ca.duration = COVER_CLOSE_DURATION
        }
      }
    } else if (cover && ca.wobble) {
      // Wobble after tween completes (peel steps 3-1)
      cover.rotation = ca.wobbleCenter + Math.sin(now / 1000 * PEEL_WOBBLE_SPEED) * ca.wobbleAmplitude
    }

    // Text overlay alpha
    const ov = overlayRef.current
    if (ov && overlayText) {
      const e = now - overlayT0Ref.current
      const totalDuration = TEXT_FADE_IN + TEXT_HOLD + TEXT_FADE_OUT
      if (e < TEXT_FADE_IN) {
        ov.alpha = e / TEXT_FADE_IN
      } else if (e < TEXT_FADE_IN + TEXT_HOLD) {
        ov.alpha = 1
      } else if (e < totalDuration) {
        ov.alpha = 1 - (e - TEXT_FADE_IN - TEXT_HOLD) / TEXT_FADE_OUT
      } else {
        ov.alpha = 0
      }
      // Rise: move up 108px over the full duration
      ov.y = -20 - (108 * Math.min(e / totalDuration, 1))
    }

    // 3D beat on extra grid (AS3: beatExtraBallContainer)
    // Mesh vertex distortion — trapezoid perspective: one side narrows, other widens
    const mesh = meshRef.current
    const beat = beatRef.current
    if (mesh && beat.active) {
      const e = now - beat.t0
      const BEAT_HIT = 133
      const BEAT_RECOVER = 500
      const MAX_D = 5 // max vertex displacement in px

      let intensity = 0
      if (e < BEAT_HIT) {
        intensity = e / BEAT_HIT
      } else if (e < BEAT_HIT + BEAT_RECOVER) {
        intensity = 1 - easeOutElastic((e - BEAT_HIT) / BEAT_RECOVER)
      } else {
        intensity = 0
        beat.active = false
      }

      const d = MAX_D * intensity * beat.direction
      const buf = mesh.geometry.getBuffer('aPosition')
      const verts = buf.data as Float32Array
      // MeshPlane 2x2 vertices: TL(0,1) TR(2,3) BL(4,5) BR(6,7)
      const t = mesh.texture
      const w = t.width, h = t.height
      // Left side: expand (move outward), Right side: contract (move inward)
      verts[0] = 0;     verts[1] = 0 - d    // TL.y shifts
      verts[2] = w;     verts[3] = 0 + d    // TR.y shifts opposite
      verts[4] = 0;     verts[5] = h + d    // BL.y shifts
      verts[6] = w;     verts[7] = h - d    // BR.y shifts opposite
      buf.update()
    }
  })

  // ── Cleanup on unmount — clear all timers and destroy all GPU resources ──
  useEffect(() => {
    return () => {
      // Timers
      if (largeBallTimerRef.current) { clearTimeout(largeBallTimerRef.current); largeBallTimerRef.current = null }
      if (overlayTimerRef.current) { clearTimeout(overlayTimerRef.current); overlayTimerRef.current = null }
      splashCleanupRef.current?.(); splashCleanupRef.current = null
      // GPU resources
      extraWaterRef.current?.destroy(); extraWaterRef.current = null
      meshRef.current?.destroy(); meshRef.current = null
      popperRef.current?.destroy(); popperRef.current = null
    }
  }, [])

  // ── Extra ball bg texture name ────────────────────────────────
  const extraBgTexture = inExtraMode ? 'bgextraball_full' : 'bgextraball'

  return (
    <pixiContainer x={BALL_PANEL_X} y={BALL_PANEL_Y} zIndex={zIndex}>
      {/* 1+2. Extra back container — bg (MeshPlane for 3D beat) + slots grid */}
      <pixiContainer ref={extraGridRef} x={BG_EXTRA_X} y={EXTRA_FRONT_Y}>
        <pixiContainer ref={useCallback((c: Container | null) => {
          if (!c) return
          if (meshRef.current) {
            meshRef.current.texture = tex(extraBgTexture)
            return
          }
          const m = new MeshPlane({ texture: tex(extraBgTexture), verticesX: 2, verticesY: 2 })
          meshRef.current = m
          c.addChild(m)
        }, [extraBgTexture])} />
        {!inExtraMode && <SliceMovie active={!inExtraMode} x={3} y={3} />}
        {/* Extra stakes grid — extragratis stars only on FREE slots */}
        {inExtraMode && Array.from({ length: EXTRA_BALLS }, (_, i) => {
          const stakeType = round?.extraStakeAt(DEFAULT_BALLS + i)
          if (stakeType !== 'free') return null
          const alreadyLanded = launchedIndices.includes(DEFAULT_BALLS + i)
          if (alreadyLanded) return null
          const col = Math.floor(i / 2)
          const row = i % 2
          return (
            <pixiSprite
              key={`eg${i}`}
              texture={tex('extragratis')}
              x={EXTRA_GRID_START_X - EXTRA_GRID_COL_SPACING * col - BG_EXTRA_X}
              y={EXTRA_GRID_BASE_Y - EXTRA_GRID_ROW_SPACING * row - EXTRA_FRONT_Y}
              anchor={0.5}
            />
          )
        })}
      </pixiContainer>

      {/* 3. ballcontainer2 — rear tube */}
      <pixiSprite texture={tex('ballcontainer2')} y={TUBING_Y} />

      {/* 4. Animated Ball sprites — regular + extra + super */}
      {launchedIndices.map(i => {
        const ball = round?.ballSequence[i]
        if (ball == null) return null
        const type = ballType(i)

        if (type === 'regular') {
          const pos = regularPosition(i)
          return (
            <AnimatedBall
              key={i}
              number={ball}
              finalX={pos.x}
              finalY={pos.y}
              type="regular"
              index={i}
              shakeTick={regularShakeTick}
              floatOffset={floatOffset}
              onArrive={onRegularBallArrive}
            />
          )
        } else if (type === 'extra') {
          const pos = extraPosition(i)
          return (
            <AnimatedBall
              key={i}
              number={ball}
              finalX={pos.x}
              finalY={pos.y}
              type="extra"
              index={i}
              shakeTick={shakeTick}
              onArrive={() => onExtraBallLand(i - DEFAULT_BALLS)}
            />
          )
        } else {
          const { superPos } = superPosition(i)
          return (
            <AnimatedBall
              key={i}
              number={ball}
              finalX={0}
              finalY={0}
              type="super"
              index={i}
              superPos={superPos}
              onLand={() => playSFX(BALL_HIT, { volume: rVol(0.35, 0.55) })}
              onSettled={handleSuperSettled}
            />
          )
        }
      })}

      {/* 4b. Peel ball — stuck in chute during peel animation */}
      {peelVisible && (
        <pixiContainer ref={peelBallContainerRef} x={PEEL_BALL_X[3]} y={PEEL_BALL_Y} scale={PEEL_BALL_SCALE}>
          <pixiSprite texture={tex('extraball')} anchor={0.5} />
          <pixiBitmapText text={String(peelBallNumber)} style={{ fontFamily: 'ball-extra', fontSize: 29, fill: 0x4d371e }} anchor={0.5} />
        </pixiContainer>
      )}

      {/* 5. Water effects */}
      <TubeWater active={drawing && !inExtraMode} flowing={flowing && !inExtraMode} idle={isIdle || inExtraMode} />
      {/* Extra water spray — AS3: particlesContainer1 (behind pipe) */}
      <pixiContainer ref={useCallback((c: Container | null) => {
        if (c && extraWaterRef.current) c.addChild(extraWaterRef.current.container)
      }, [])} />
      {/* 6. ballpipe */}
      <pixiSprite texture={tex('ballpipe')} x={PIPE_X} />

      {/* 7. BallCounter — shows during drawing (continues into extras) */}
      {drawing && <BallCounter count={ballCount} x={COUNTER_X} y={COUNTER_Y} />}

      {/* 8. ballcontainer1 — front tube */}
      <pixiSprite texture={tex('ballcontainer1')} y={TUBING_Y} />

      {/* 10. Text overlay — "EXTRA" / "SUPER" announcement (renders BELOW pipoqueira) */}
      {overlayText && (
        <pixiBitmapText
          ref={overlayRef}
          text={overlayText === 'extra' ? 'EXTRA' : 'SUPER'}
          style={overlayText === 'extra'
            ? { fontFamily: 'overlay-extra', fontSize: 70, fill: 0xfff000 }
            : { fontFamily: 'overlay-super', fontSize: 74, fill: 0x00fcff }
          }
          anchor={0.5}
          x={380}
          y={-20}
          alpha={0}
        />
      )}

      {/* 9. Extra front container (pipoqueira) — renders ABOVE overlay text.
          Z-order matches AS3: fundo → idleLemon → largeBall → extraPrice → splash+popper → tampa → cover */}
      <pixiContainer ref={frontContainerRef} y={EXTRA_FRONT_Y}>
        <pixiSprite texture={tex('fundopipoqueira')} y={FUNDO_Y} />
        {/* IdleLemon — visible only during idle (not extras) */}
        <IdleLemon
          active={isIdle && !inExtraMode}
          x={IDLE_CONTAINER_X + IDLE_LEMON_X}
          y={IDLE_CONTAINER_Y + IDLE_LEMON_Y}
        />

        {/* Large ball — always rendered during drawing (visibility managed by mode + splash).
            Regular: visible. Extras: hidden (price shows instead), except during splash sequence. */}
        {drawing && currentBall > 0 && (
          <pixiContainer ref={largeBallRef} x={LARGE_BALL_X} y={LARGE_BALL_Y} visible={!inExtraMode}>
            <pixiSprite texture={tex('bigballv2')} />
            <pixiBitmapText
              text={String(currentBall)}
              style={{ fontFamily: 'ball-large', fontSize: 50, fill: 0x4d371e }}
              anchor={0.5}
              x={42}
              y={42}
            />
          </pixiContainer>
        )}

        {/* Extra price display — same z-level as large ball */}
        {inExtraMode && (
          <pixiContainer ref={extraPriceRef}>
            <pixiSprite
              texture={tex(nextExtraStake === 'free' ? 'extragratis' : nextExtraStake === 'cash' ? 'dindin77_sk' : 'ficha78_sk')}
              anchor={0.5}
              x={83}
              y={55}
              scale={nextExtraStake === 'cash' ? 0.75 : 0.6}
            />
            <pixiBitmapText
              ref={priceTextAutoScale}
              text={nextExtraStake === 'free' ? 'FREE' : String(nextExtraPrice)}
              style={{ fontFamily: 'extra-price', fontSize: 20, fill: 0xffffff }}
              anchor={0.5}
              x={83}
              y={88}
            />
          </pixiContainer>
        )}

        {/* MovieSplash + PopperJuice — ABOVE ball, BELOW tampa (AS3: movieSplashContainer) */}
        <MovieSplash ref={movieSplashRef} />
        <pixiContainer ref={useCallback((c: Container | null) => {
          if (!c || popperRef.current) return
          const frames = getTextures('pipo_juice')
          const anim = new AnimatedSprite(frames)
          anim.x = POPPER_X
          anim.y = POPPER_Y
          anim.animationSpeed = 0.2 // ~12fps
          anim.loop = false
          anim.visible = false
          anim.autoUpdate = true
          c.addChild(anim)
          popperRef.current = anim
        }, [])} />

        {/* Tampa — clips splash/popper from below */}
        <pixiSprite texture={tex('tampapipoqueira')} y={TAMPA_Y} />

        {/* Cover (bigballpipe2) — topmost element */}
        <pixiSprite
          ref={setupCover}
          texture={tex('bigballpipe2')}
          x={COVER_X}
          y={COVER_Y}
        />

      </pixiContainer>

    </pixiContainer>
  )
}
