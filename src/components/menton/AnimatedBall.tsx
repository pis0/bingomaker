import { useEffect, useRef } from 'react'
import { Container, Sprite, BitmapText, Ticker } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'
import {
  BALL_TRAVEL_SPEED,
  EXTRA_CHUTE_X, EXTRA_CHUTE_Y,
  EXTRA_WAYPOINT_X, EXTRA_WAYPOINT_Y,
  EXTRA_SPEED_PHASE1, EXTRA_SPEED_PHASE2,
  EXTRA_BALL_SCALE, EXTRA_LAND_DURATION, EXTRA_LAND_SCALE_DURATION,
  SUPER_TARGET_X, SUPER_TARGET_Y,
  SUPER_PHASE1_DURATION, SUPER_PHASE1_TARGET_X, SUPER_PHASE1_TARGET_Y,
  SUPER_ARC_PEAK_Y, SUPER_FINAL_SNAP_DURATION,
  SUPER_STACK_X, SUPER_STACK_BASE_Y, SUPER_STACK_BALL_HEIGHT,
} from './ballConstants'

extend({ Container, Sprite, BitmapText })

/** Pipe exit X — center of ballpipe bottom opening */
const PIPE_EXIT_X = 33
/** Pipe bottom Y — where balls emerge */
const PIPE_BOTTOM_Y = 77

/** Drop speed: per-second (AS3: 0.096/frame × 60fps), scaled by travel speed */
const DROP_SPEED_PS = 0.096 * 60 * BALL_TRAVEL_SPEED
/** Fixed roll duration — all balls take the same time regardless of distance.
 *  Far balls roll fast, near balls roll slow (visible spin). AS3 legacy feel. */
const ROLL_DURATION = 0.5 / BALL_TRAVEL_SPEED
/** Fraction of roll duration spent ramping from 0 to full speed (smooth start) */
const ROLL_RAMP_RATIO = 0.1
/** Rotation factor — maps px traveled to rotation (AS3: 18). Higher = fewer spins. */
/** Rotation factor — maps px traveled to rotation. Higher = fewer spins. */
const ROTATION_FACTOR = 36
/** Minimum full rotations during roll — ensures near-pipe balls still spin visibly */
const MIN_ROLL_ROTATIONS = 1.5

function easeInQuad(t: number): number { return t * t }
function easeInSine(t: number): number { return 1 - Math.cos(t * Math.PI / 2) }
function easeOutSine(t: number): number { return Math.sin(t * Math.PI / 2) }
function easeOutBack(t: number): number {
  const s = 1.70158
  const t1 = t - 1
  return t1 * t1 * ((s + 1) * t1 + s) + 1
}
function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75; return 7.5625 * t2 * t2 + 0.984375
}
function easeOutCubic(t: number): number { const t1 = t - 1; return t1 * t1 * t1 + 1 }

export type BallType = 'regular' | 'extra' | 'super'

interface Props {
  number: number
  finalX: number
  finalY: number
  type: BallType
  index: number
  /** Super extra stack position (0, 1, 2...) — used for arc height calculation */
  superPos?: number
  /** Increments when another ball lands — triggers micro-shake on settled balls */
  shakeTick?: number
  /** Y offset in pixels driven by water animation — ball bobs in sync */
  floatOffset?: number
  onArrive?: () => void
  /** Fires when the full animation completes (all phases done, ball settled) */
  onSettled?: () => void
}

/**
 * AS3: BallPath — ball travels from origin to final position.
 *
 * Regular: pipe exit → drop → roll → land (rotation settle)
 * Extra:   chute (130,-70) → waypoint → grid position (easeOutBack + spin)
 * Super:   chute → phase1 (340,365) → arc → stack position → snap
 */
export default function AnimatedBall({ number, finalX, finalY, type, index, superPos = 0, shakeTick = 0, floatOffset = 0, onArrive, onSettled }: Props) {
  const containerRef = useRef<Container>(null)
  const onArriveRef = useRef(onArrive)
  onArriveRef.current = onArrive
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled
  const settledRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    settledRef.current = false
    if (type === 'regular') {
      return animateRegular(container, finalX, finalY, onArriveRef, settledRef)
    } else if (type === 'extra') {
      return animateExtra(container, finalX, finalY, onArriveRef, settledRef)
    } else {
      return animateSuper(container, superPos, onArriveRef, onSettledRef)
    }
  }, [finalX, finalY, index, type, superPos])

  // AS3: Ball.shake — smooth tween to offset (0.1s) then tween back (0.2s)
  // Regular: position only. Extra: position + scale ±3% elastic.
  // Guard: if already shaking, skip (AS3: if (shaking) return)
  const shakingRef = useRef(false)
  useEffect(() => {
    if (shakeTick === 0 || !settledRef.current || shakingRef.current) return
    const container = containerRef.current
    if (!container) return
    shakingRef.current = true
    const isExtra = type !== 'regular'
    const dx = (Math.random() - 0.5) * 2  // ±1px centered
    const dy = (Math.random() - 0.5) * 2
    const baseX = container.x, baseY = container.y
    const targetScale = isExtra ? 1 + 0.03 * Math.random() * (Math.random() < 0.5 ? -1 : 1) : 1
    const ticker = Ticker.shared
    let elapsed = 0
    let phase = 0 // 0 = tween out (0.1s), 1 = tween back (0.2s)
    const onTick = () => {
      elapsed += ticker.deltaMS / 1000
      if (phase === 0) {
        const t = Math.min(1, elapsed / 0.1)
        container.x = baseX + dx * t
        container.y = baseY + dy * t
        if (isExtra) container.scale.set(1 + (targetScale - 1) * t)
        if (t >= 1) { phase = 1; elapsed = 0 }
      } else {
        const t = Math.min(1, elapsed / 0.2)
        container.x = baseX + dx * (1 - t)
        container.y = baseY + dy * (1 - t)
        if (isExtra) container.scale.set(targetScale + (1 - targetScale) * t)
        if (t >= 1) {
          container.x = baseX
          container.y = baseY
          if (isExtra) container.scale.set(1)
          shakingRef.current = false
          ticker.remove(onTick)
        }
      }
    }
    ticker.add(onTick)
    // Cleanup: always restore position to prevent drift
    return () => {
      ticker.remove(onTick)
      container.x = baseX
      container.y = baseY
      if (isExtra) container.scale.set(1)
      shakingRef.current = false
    }
  }, [shakeTick, type])

  // Water float: apply Y offset from water animation (synced with TubeWater)
  const floatBaseYRef = useRef<number | null>(null)
  useEffect(() => {
    if (!settledRef.current) return
    const container = containerRef.current
    if (!container) return
    if (floatBaseYRef.current === null) floatBaseYRef.current = container.y
    container.y = floatBaseYRef.current + floatOffset
    // Reset base when float ends
    if (floatOffset === 0) floatBaseYRef.current = null
  })

  const isExtra = type !== 'regular'
  const textureName = isExtra ? 'extraball' : 'ball'
  const bitmapFont = isExtra ? 'ball-extra' : 'ball-regular'
  const fontSize = isExtra ? 29 : 24
  const startX = isExtra ? EXTRA_CHUTE_X : PIPE_EXIT_X
  const startY = isExtra ? EXTRA_CHUTE_Y : PIPE_BOTTOM_Y

  return (
    <pixiContainer ref={containerRef} x={startX} y={startY}>
      <pixiSprite texture={tex(textureName)} anchor={0.5} />
      <pixiBitmapText text={String(number)} style={{ fontFamily: bitmapFont, fontSize, fill: 0x4d371e }} anchor={0.5} />
    </pixiContainer>
  )
}

// ── Regular ball animation (unchanged logic) ──────────────────────

function animateRegular(
  container: Container,
  finalX: number,
  finalY: number,
  onArriveRef: React.RefObject<((()=> void) | undefined) | null>,
  settledRef: React.MutableRefObject<boolean>,
) {
  const landingDuration = (0.08 + 0.066 * Math.random()) / BALL_TRAVEL_SPEED
  const rollDistance = finalX - PIPE_EXIT_X

  let phase = 0
  let movePercent = 0
  let rollElapsed = 0
  let landingElapsed = 0
  let rotationAtLanding = 0

  container.x = PIPE_EXIT_X
  container.y = PIPE_BOTTOM_Y
  container.rotation = 0
  container.scale.set(1)

  const ticker = Ticker.shared
  const onTick = () => {
    const dt = ticker.deltaMS / 1000
    if (phase === 0) {
      movePercent += DROP_SPEED_PS * dt
      const t = Math.min(movePercent, 1)
      container.y = PIPE_BOTTOM_Y + (finalY - PIPE_BOTTOM_Y) * easeInQuad(t)
      container.rotation = Math.PI * 2 * 2 * t
      if (movePercent >= 1) {
        container.y = finalY
        phase = 1
        rollElapsed = 0
      }
    } else if (phase === 1) {
      rollElapsed += dt
      // Normalized progress 0→1 with soft ramp-in at start
      const raw = Math.min(1, rollElapsed / ROLL_DURATION)
      const t = raw < ROLL_RAMP_RATIO
        ? (raw / ROLL_RAMP_RATIO) * (raw / ROLL_RAMP_RATIO) * ROLL_RAMP_RATIO // ease-in ramp
        : raw
      const px = rollDistance * t
      container.x = PIPE_EXIT_X + px
      // Distance-based rotation (rolling on surface) with minimum for near-pipe balls
      const totalRotations = Math.max(MIN_ROLL_ROTATIONS, rollDistance / ROTATION_FACTOR)
      container.rotation = totalRotations * Math.PI * 2 * raw
      if (raw >= 1) {
        container.x = finalX
        rotationAtLanding = container.rotation % (Math.PI * 2)
        phase = 2
        onArriveRef.current?.()
      }
    } else {
      landingElapsed += ticker.deltaMS / 1000
      const t = Math.min(1, landingElapsed / landingDuration)
      container.rotation = rotationAtLanding * (1 - easeOutBack(t))
      if (t >= 1) {
        container.rotation = 0
        settledRef.current = true
        ticker.remove(onTick)
      }
    }
  }

  ticker.add(onTick)
  return () => { ticker.remove(onTick) }
}

// ── Extra ball animation ──────────────────────────────────────────
// AS3: BallPath (3-point: chute → waypoint → stake) + Ball.fitToExtraStake

function animateExtra(
  container: Container,
  finalX: number,
  finalY: number,
  onArriveRef: React.RefObject<((()=> void) | undefined) | null>,
  settledRef: React.MutableRefObject<boolean>,
) {
  // Extra path: chute start → short move to waypoint → fly to grid position
  // Then landing: easeOutBack position + easeOutBounce scale + double rotation
  let phase = 0 // 0=flight-phase1, 1=flight-phase2, 2=landing
  let movePercent = 0
  const startX = EXTRA_CHUTE_X
  const startY = EXTRA_CHUTE_Y
  const initialRotation = (Math.random() - 0.5) * Math.PI * 2

  container.x = startX
  container.y = startY
  container.rotation = initialRotation
  container.scale.set(EXTRA_BALL_SCALE)

  // Landing state
  let landElapsed = 0
  let landScaleElapsed = 0
  let landStartX = 0
  let landStartY = 0
  // Orbit spins: 1–1.5 full rotations (slower, more graceful)
  const rotSign = Math.random() < 0.5 ? -1 : 1
  const landRotation = rotSign * (Math.PI * 2 + Math.random() * Math.PI) // 1–1.5 full spins
  // AS3: ballContainer2.pivotX/Y = 5 + 5*random → off-center orbit radius
  const pivotOffset = 14 + 10 * Math.random()

  const ticker = Ticker.shared
  const onTick = () => {
    const dt = ticker.deltaMS / 1000
    if (phase === 0) {
      // Phase 1: short move from chute to waypoint (very fast)
      movePercent += EXTRA_SPEED_PHASE1 * 60 * dt
      if (movePercent >= 1) {
        movePercent = 0
        phase = 1
      }
      // Barely moves (130→135, same Y) — just a brief pause
    } else if (phase === 1) {
      // Phase 2: fly from waypoint to grid position
      movePercent += EXTRA_SPEED_PHASE2 * 60 * dt
      const t = Math.min(movePercent, 1)
      container.x = EXTRA_CHUTE_X + (finalX - EXTRA_CHUTE_X) * t
      container.y = EXTRA_CHUTE_Y + (finalY - EXTRA_CHUTE_Y) * t
      container.rotation = initialRotation + Math.PI * 2 * t
      if (movePercent >= 1) {
        landStartX = container.x
        landStartY = container.y
        phase = 2
        landElapsed = 0
        landScaleElapsed = 0
        onArriveRef.current?.()
      }
    } else {
      // Landing: "magnetic slot" effect — ball orbits around an off-center
      // pivot point that converges to zero, creating a spiral settle.
      // AS3: ballContainer2 with randomized pivotX/Y (5-10) rotating one way,
      // ballContainer rotating the opposite way → wobbly magnetic attraction.
      const dt = ticker.deltaMS / 1000
      landElapsed += dt
      landScaleElapsed += dt

      // Position snap to final (easeOutBack 0.6s — overshoot bounce)
      const tPos = Math.min(1, landElapsed / EXTRA_LAND_DURATION)
      const ePos = easeOutBack(tPos)
      const baseX = landStartX + (finalX - landStartX) * ePos
      const baseY = landStartY + (finalY - landStartY) * ePos

      // Orbital wobble: pivot offset decays with easeOutCubic over 1.2s
      // This creates the "magnetic" spiral — ball orbits around the slot center
      const tOrbit = Math.min(1, landElapsed / 1.2)
      const orbitDecay = 1 - easeOutCubic(tOrbit)
      const orbitAngle = landRotation * 2 * (1 - easeOutCubic(tOrbit))
      const orbitRadius = pivotOffset * orbitDecay
      container.x = baseX + Math.cos(orbitAngle) * orbitRadius
      container.y = baseY + Math.sin(orbitAngle) * orbitRadius

      // Spin: ball rotates WITH orbit direction (less spin, more orbit area)
      container.rotation = orbitAngle * 0.4

      // Scale 1.3 → 1.0 (easeOutBounce 0.2s)
      const tScale = Math.min(1, landScaleElapsed / EXTRA_LAND_SCALE_DURATION)
      const s = EXTRA_BALL_SCALE + (1 - EXTRA_BALL_SCALE) * easeOutBounce(tScale)
      container.scale.set(s)

      if (tPos >= 1 && tOrbit >= 1 && tScale >= 1) {
        container.x = finalX
        container.y = finalY
        container.scale.set(1)
        container.rotation = 0
        settledRef.current = true
        ticker.remove(onTick)
      }
    }
  }

  ticker.add(onTick)
  return () => { ticker.remove(onTick) }
}

// ── Super extra ball animation ────────────────────────────────────
// AS3: BallPath (chute→waypoint→730,0) → Ball.fitToLastSuperPosition (swoop→arc→snap)
//
// Phase 0: BallPath seg0 — chute (130,-70) → waypoint (135,-70), ~67ms
// Phase 1: BallPath seg1 — waypoint → far right (730,0), ~104ms → onArrive
// Phase 2: Swoop back — (730,0) → (340,365), 0.4s, linear X + easeInSine Y
// Phase 3: Arc — (340,365) → near-final via parabolic, 0.5s
// Phase 4: Snap — near-final → final, 0.2s, easeOutBounce

function animateSuper(
  container: Container,
  pos: number,
  onArriveRef: React.RefObject<((()=> void) | undefined) | null>,
  onSettledRef: React.RefObject<((()=> void) | undefined) | null>,
) {
  const finalX = SUPER_STACK_X
  const finalY = SUPER_STACK_BASE_Y - SUPER_STACK_BALL_HEIGHT * pos

  let phase = 0
  let elapsed = 0

  // BallPath segment durations — AS3 uses EXTRA speeds for super balls too
  const seg0Duration = 1 / (EXTRA_SPEED_PHASE1 * 60) // ~0.067s (4 frames)
  const seg1Duration = 1 / (EXTRA_SPEED_PHASE2 * 60) // ~0.104s (6.25 frames)

  // Waypoints
  const wp0x = EXTRA_CHUTE_X, wp0y = EXTRA_CHUTE_Y           // 130, -70
  const wp1x = EXTRA_WAYPOINT_X, wp1y = EXTRA_WAYPOINT_Y     // 135, -70
  const wp2x = SUPER_TARGET_X, wp2y = SUPER_TARGET_Y         // 730, 0
  const swoopX = SUPER_PHASE1_TARGET_X                        // 340
  const swoopY = SUPER_PHASE1_TARGET_Y                        // 365

  // Arc parameters
  const arcDuration = SUPER_PHASE1_DURATION + 0.1 // 0.5s
  const riseRatio = 0.5 + 0.1 * pos
  const fallRatio = 0.5 - 0.1 * pos
  const nearFinalX = finalX - 4
  const nearFinalY = finalY - 10

  container.x = wp0x
  container.y = wp0y
  container.rotation = 0
  container.scale.set(EXTRA_BALL_SCALE) // 1.3

  const ticker = Ticker.shared
  const onTick = () => {
    const dt = ticker.deltaMS / 1000

    if (phase === 0) {
      // BallPath seg0: chute → waypoint (barely moves, one full CW rotation)
      elapsed += dt
      const t = Math.min(1, elapsed / seg0Duration)
      container.x = wp0x + (wp1x - wp0x) * t
      container.y = wp0y + (wp1y - wp0y) * t
      container.rotation = Math.PI * 2 * t
      if (t >= 1) {
        phase = 1
        elapsed = 0
      }
    } else if (phase === 1) {
      // BallPath seg1: waypoint → far right (730, 0) — one full CW rotation
      elapsed += dt
      const t = Math.min(1, elapsed / seg1Duration)
      container.x = wp1x + (wp2x - wp1x) * t
      container.y = wp1y + (wp2y - wp1y) * t
      container.rotation = Math.PI * 2 * t
      if (t >= 1) {
        // AS3: rotation = 0, scale = 1 at start of fitToLastSuperPosition
        container.rotation = 0
        container.scale.set(1)
        phase = 2
        elapsed = 0
        onArriveRef.current?.()
      }
    } else if (phase === 2) {
      // Swoop: (730, 0) → (340, 365), 0.4s — AS3 fitToLastSuperPosition phase 1
      elapsed += dt
      const t = Math.min(1, elapsed / SUPER_PHASE1_DURATION)
      container.x = wp2x + (swoopX - wp2x) * t  // linear
      container.y = wp2y + (swoopY - wp2y) * easeInSine(t)
      container.rotation = -(Math.PI * 2) * t    // full CCW spin
      if (t >= 1) {
        phase = 3
        elapsed = 0
      }
    } else if (phase === 3) {
      // Arc: (340, 365) → near-final via parabolic trajectory — AS3 throwObject
      elapsed += dt
      const t = Math.min(1, elapsed / arcDuration)
      // X: linear from swoopX to nearFinalX
      container.x = swoopX + (nearFinalX - swoopX) * t
      // Y: parabolic — rise then fall
      if (t < riseRatio) {
        const tUp = t / riseRatio
        container.y = swoopY + (SUPER_ARC_PEAK_Y - swoopY) * easeOutSine(tUp)
      } else {
        const tDown = (t - riseRatio) / fallRatio
        container.y = SUPER_ARC_PEAK_Y + (nearFinalY - SUPER_ARC_PEAK_Y) * easeInSine(tDown)
      }
      // Rotation: full CCW spin during arc
      container.rotation = -(Math.PI * 2) * t
      if (t >= 1) {
        phase = 4
        elapsed = 0
      }
    } else {
      // Snap: near-final → final, 0.2s, easeOutBounce — AS3 final settle
      elapsed += dt
      const t = Math.min(1, elapsed / SUPER_FINAL_SNAP_DURATION)
      const e = easeOutBounce(t)
      container.x = nearFinalX + (finalX - nearFinalX) * e
      container.y = nearFinalY + (finalY - nearFinalY) * e
      container.rotation = 0
      if (t >= 1) {
        container.x = finalX
        container.y = finalY
        ticker.remove(onTick)
        onSettledRef.current?.()
      }
    }
  }

  ticker.add(onTick)
  return () => { ticker.remove(onTick) }
}
