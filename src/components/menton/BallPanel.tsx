import { useCallback, useEffect, useRef, useState } from 'react'
import { Sprite, Container, Text, TextStyle, Ticker, MeshPlane, Assets, Texture } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { BALL_PANEL_X, BALL_PANEL_Y } from './layoutConstants'
import {
  TUBING_Y,
  PIPE_X,
  EXTRA_FRONT_Y,
  BG_EXTRA_X,
  FUNDO_Y,
  TAMPA_Y,
  COVER_X, COVER_Y, COVER_PIVOT_X, COVER_PIVOT_Y,
  COVER_ROTATION_CLOSED,
  COVER_CLOSE_DURATION,
  IDLE_CONTAINER_X, IDLE_CONTAINER_Y,
  IDLE_LEMON_X, IDLE_LEMON_Y,
  COUNTER_X, COUNTER_Y,
  LARGE_BALL_X, LARGE_BALL_Y,
  ROW_0_Y, ROW_1_Y,
  ROW_0_START_X, ROW_1_START_X,
  BALL_SPACING, BALL_ROW_SIZE,
  BALL_FONT, BALL_TEXT_COLOR, BALL_EXTRA_SIZE,
  EXTRA_GRID_START_X, EXTRA_GRID_COL_SPACING, EXTRA_GRID_ROW_SPACING, EXTRA_GRID_BASE_Y,
  EXTRA_TEXT_COLOR, EXTRA_TEXT_SIZE,
  SUPER_TEXT_COLOR, SUPER_TEXT_SIZE,
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
import { DEFAULT_BALLS, EXTRA_BALLS, HALT_PRIORITY } from '../../engine/constants'
import type { Round } from '../../engine/Round'
import { ParticleEmitter } from '../../particles/ParticleEmitter'
import { mentonExtraWater } from '../../particles/configs/menton_extra_water'

extend({ Sprite, Container, Text })

// Large ball text style (AS3: fontSize:50, color:0x4d371e, letterSpacing:-2)
const largeBallStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: 50,
  fill: BALL_TEXT_COLOR,
  letterSpacing: -2,
})

// Extra price display text (AS3: MyriadPro Semibold, 22px equiv, white)
// Sized to fit within bigballv2 circle (86px wide)
const extraPriceStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: 20,
  fill: 0xffffff,
})

// "EXTRA" overlay text style (AS3: Fonts.IOWAN_BLACK, 70px, 0xfff000)
const extraOverlayStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: EXTRA_TEXT_SIZE,
  fill: EXTRA_TEXT_COLOR,
})

// "SUPER" overlay text style (AS3: Fonts.IOWAN_BLACK, 74px, 0x00fcff)
const superOverlayStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: SUPER_TEXT_SIZE,
  fill: SUPER_TEXT_COLOR,
})

// Peel ball text style (same as AnimatedBall extra style)
const peelBallStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: BALL_EXTRA_SIZE,
  fill: BALL_TEXT_COLOR,
})

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

/** Default frames between consecutive ball launches (60fps) */
const DEFAULT_INTERVAL = 6
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

interface Props {
  round: Round | null
  /** How many balls to launch (visual target, may outpace engine processing) */
  targetBallCount: number
  /** Current stake level (for extra ball price calculation) */
  stake?: number
  /** Current max pattern priority — drives dynamic launch interval */
  launchInterval?: number
  /** Pause ball launching (bonus animations active) */
  paused?: boolean
  /** Increments to advance one peel step (user-driven) */
  peelAdvanceTick?: number
  onBallArrive?: () => void
  /** Reports when peel animation starts/ends (for halt-for-user) */
  onPeelChange?: (peeling: boolean) => void
  /** Reports when super balls are in flight (for z-order toggle — AS3: addChild/addChildAt) */
  onSuperFlyingChange?: (flying: boolean) => void
  /** zIndex passed to the root container (for sortableChildren in parent) */
  zIndex?: number
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
export default function BallPanel({ round, targetBallCount, stake = 1, launchInterval = DEFAULT_INTERVAL, paused = false, peelAdvanceTick = 0, onBallArrive, onPeelChange, onSuperFlyingChange, zIndex }: Props) {
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

  // Synchronous reset on round change
  const prevRoundRef = useRef<Round | null>(null)
  if (round !== prevRoundRef.current) {
    prevRoundRef.current = round
    processedCountRef.current = 0
    queueRef.current = []
    if (launchedIndices.length > 0) {
      setLaunchedIndices([])
    }
    peelRef.current.active = false
    peelRef.current.dispatchReady = false
    if (peelVisible) {
      setPeelVisible(false)
    }
  }

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
    let framesSinceLaunch = 999
    const ticker = Ticker.shared
    const onTick = () => {
      const hasItems = queueRef.current.length > 0
      if (hasItems !== flowingRef.current) {
        flowingRef.current = hasItems
        setFlowing(hasItems)
      }
      if (!hasItems || pausedRef.current) return
      framesSinceLaunch++
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
        framesSinceLaunch = 0
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
      if (framesSinceLaunch >= intervalRef.current) {
        framesSinceLaunch = 0
        const next = queueRef.current.shift()!
        setLaunchedIndices(prev => [...prev, next])
        onBallArriveRef.current?.()
      }
    }
    ticker.add(onTick)
    return () => { ticker.remove(onTick) }
  }, [])

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
  if (superCount > superLaunchedCountRef.current) {
    superLaunchedCountRef.current = superCount
    onSuperFlyingChangeRef.current?.(true)
  }
  // "In extra mode" = extras available OR already launched some
  const inExtraMode = extraReady || hasLaunchedExtras
  // "In super mode" = super available OR already launched some
  const inSuperMode = superReady || hasLaunchedSupers
  const isExtraPhase = inExtraMode && !inSuperMode
  const isSuperPhase = inSuperMode

  // ── Price text auto-scale (AS3: autoScale + resizeOffset) ─────
  // Scales down text if it exceeds the bigballv2 circle width (76px usable)
  const PRICE_MAX_WIDTH = 64
  const priceTextRef = useRef<Text>(null)
  const priceTextAutoScale = useCallback((t: Text | null) => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => { extraWaterRef.current?.destroy(); extraWaterRef.current = null }
  }, [])

  // ── 3D beat on extra grid (AS3: beatExtraBallContainer) ────────
  // Simulates 3D tilt with skewX/skewY when an extra ball lands.
  // Direction depends on slot: odd/even → skewY sign, upper/lower → skewX sign
  const extraGridRef = useRef<Container>(null)
  const meshRef = useRef<MeshPlane>(null)
  const beatRef = useRef({ active: false, t0: 0, direction: 0 }) // direction: -1 left, +1 right
  // Shake tick — increments on each extra ball land, propagates to settled balls
  const [shakeTick, setShakeTick] = useState(0)

  // Triggered by AnimatedBall.onArrive when extra ball reaches its slot
  const onExtraBallLand = useCallback((slot: number) => {
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
      setOverlayText('extra')
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
      overlayTimerRef.current = setTimeout(() => setOverlayText(null), TEXT_FADE_IN + TEXT_HOLD + TEXT_FADE_OUT)
    }
    if (isSuperPhase && !overlayShownRef.current.super) {
      overlayShownRef.current.super = true
      setOverlayText('super')
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
      overlayTimerRef.current = setTimeout(() => setOverlayText(null), TEXT_FADE_IN + TEXT_HOLD + TEXT_FADE_OUT)
    }
  }, [isExtraPhase, isSuperPhase])

  // ── Text overlay animation (fade in → hold → fade out) ────────
  const overlayRef = useRef<Text>(null)
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
              onSettled={handleSuperSettled}
            />
          )
        }
      })}

      {/* 4b. Peel ball — stuck in chute during peel animation */}
      {peelVisible && (
        <pixiContainer ref={peelBallContainerRef} x={PEEL_BALL_X[3]} y={PEEL_BALL_Y} scale={PEEL_BALL_SCALE}>
          <pixiSprite texture={tex('extraball')} anchor={0.5} />
          <pixiText text={String(peelBallNumber)} style={peelBallStyle} anchor={0.5} />
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

      {/* 9. Extra front container (pipoqueira) */}
      <pixiContainer y={EXTRA_FRONT_Y}>
        <pixiSprite texture={tex('fundopipoqueira')} y={FUNDO_Y} />
        {/* IdleLemon — visible only during idle (not extras) */}
        <IdleLemon
          active={isIdle && !inExtraMode}
          x={IDLE_CONTAINER_X + IDLE_LEMON_X}
          y={IDLE_CONTAINER_Y + IDLE_LEMON_Y}
        />
        <pixiSprite texture={tex('tampapipoqueira')} y={TAMPA_Y} />

        {/* Large ball — shows current ball number during REGULAR drawing only */}
        {drawing && !inExtraMode && currentBall > 0 && (
          <pixiContainer x={LARGE_BALL_X} y={LARGE_BALL_Y}>
            <pixiSprite texture={tex('bigballv2')} />
            <pixiText
              text={String(currentBall)}
              style={largeBallStyle}
              anchor={0.5}
              x={42}
              y={42}
            />
          </pixiContainer>
        )}

        {/* Extra price display — icon + text centered in pipoqueira circle.
            bigballv2 center = (LARGE_BALL_X+43, LARGE_BALL_Y+42) = (83, 71) in this container.
            Icon at upper half (~58), text at lower half (~82). */}
        {inExtraMode && (
          <>
            {/* Icon: star (free), ficha (coins), or dindin (cash/super) — AS3: mutually exclusive */}
            <pixiSprite
              texture={tex(nextExtraStake === 'free' ? 'extragratis' : nextExtraStake === 'cash' ? 'dindin77_sk' : 'ficha78_sk')}
              anchor={0.5}
              x={83}
              y={55}
              scale={nextExtraStake === 'cash' ? 0.75 : 0.6}
            />
            {/* Text: "FREE" or price value — auto-scales to fit circle (max 76px) */}
            <pixiText
              ref={priceTextAutoScale}
              text={nextExtraStake === 'free' ? 'FREE' : String(nextExtraPrice)}
              style={extraPriceStyle}
              anchor={0.5}
              x={83}
              y={88}
            />
          </>
        )}

        <pixiSprite
          ref={setupCover}
          texture={tex('bigballpipe2')}
          x={COVER_X}
          y={COVER_Y}
        />

      </pixiContainer>

      {/* 10. Text overlay — "EXTRA" / "SUPER" announcement */}
      {overlayText && (
        <pixiText
          ref={overlayRef}
          text={overlayText === 'extra' ? 'EXTRA' : 'SUPER'}
          style={overlayText === 'extra' ? extraOverlayStyle : superOverlayStyle}
          anchor={0.5}
          x={380}
          y={-20}
          alpha={0}
        />
      )}
    </pixiContainer>
  )
}
