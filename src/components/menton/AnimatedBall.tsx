import { useEffect, useRef } from 'react'
import { Container, Sprite, Text, TextStyle, Ticker } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'
import {
  BALL_FONT, BALL_TEXT_COLOR, BALL_NORMAL_SIZE, BALL_EXTRA_SIZE,
  EXTRA_CHUTE_X, EXTRA_CHUTE_Y,
  EXTRA_SPEED_PHASE1, EXTRA_SPEED_PHASE2,
  EXTRA_BALL_SCALE, EXTRA_LAND_DURATION, EXTRA_LAND_SCALE_DURATION,
  SUPER_PHASE1_DURATION, SUPER_PHASE1_TARGET_X, SUPER_PHASE1_TARGET_Y,
  SUPER_ARC_PEAK_Y, SUPER_FINAL_SNAP_DURATION,
  SUPER_STACK_X, SUPER_STACK_BASE_Y, SUPER_STACK_BALL_HEIGHT,
} from './ballConstants'

extend({ Container, Sprite, Text })

const normalStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: BALL_NORMAL_SIZE,
  fill: BALL_TEXT_COLOR,
})

const extraStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: BALL_EXTRA_SIZE,
  fill: BALL_TEXT_COLOR,
})

/** Pipe exit X — center of ballpipe bottom opening */
const PIPE_EXIT_X = 33
/** Pipe bottom Y — where balls emerge */
const PIPE_BOTTOM_Y = 77

/** Drop speed: gravity (~10 frames = 167ms) */
const DROP_SPEED = 0.096
/** Frames for roll to ramp up from 0 to full speed */
const ROLL_RAMP_FRAMES = 4
/** Constant horizontal roll speed in px/frame */
const ROLL_PX_PER_FRAME = 14.4
/** Ball rotation factor */
const ROTATION_FACTOR = 18

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
  /** Increments when another extra ball lands — triggers micro-shake on settled balls */
  shakeTick?: number
  onArrive?: () => void
}

/**
 * AS3: BallPath — ball travels from origin to final position.
 *
 * Regular: pipe exit → drop → roll → land (rotation settle)
 * Extra:   chute (130,-70) → waypoint → grid position (easeOutBack + spin)
 * Super:   chute → phase1 (340,365) → arc → stack position → snap
 */
export default function AnimatedBall({ number, finalX, finalY, type, index, superPos = 0, shakeTick = 0, onArrive }: Props) {
  const containerRef = useRef<Container>(null)
  const onArriveRef = useRef(onArrive)
  onArriveRef.current = onArrive
  const settledRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    settledRef.current = false
    if (type === 'regular') {
      return animateRegular(container, finalX, finalY, onArriveRef)
    } else if (type === 'extra') {
      return animateExtra(container, finalX, finalY, onArriveRef, settledRef)
    } else {
      return animateSuper(container, superPos, onArriveRef)
    }
  }, [finalX, finalY, index, type, superPos])

  // Micro-shake on settled extra balls when another ball lands
  useEffect(() => {
    if (shakeTick === 0 || !settledRef.current) return
    const container = containerRef.current
    if (!container) return
    const dx = (Math.random() - 0.5) * 4
    const dy = (Math.random() - 0.5) * 3
    const baseX = container.x, baseY = container.y
    container.x = baseX + dx
    container.y = baseY + dy
    const ticker = Ticker.shared
    let elapsed = 0
    const onTick = () => {
      elapsed += ticker.deltaMS / 1000
      const t = Math.min(1, elapsed / 0.3)
      const decay = 1 - easeOutCubic(t)
      container.x = baseX + dx * decay
      container.y = baseY + dy * decay
      if (t >= 1) {
        container.x = baseX
        container.y = baseY
        ticker.remove(onTick)
      }
    }
    ticker.add(onTick)
    return () => { ticker.remove(onTick) }
  }, [shakeTick])

  const isExtra = type !== 'regular'
  const textureName = isExtra ? 'extraball' : 'ball'
  const style = isExtra ? extraStyle : normalStyle
  const startX = isExtra ? EXTRA_CHUTE_X : PIPE_EXIT_X
  const startY = isExtra ? EXTRA_CHUTE_Y : PIPE_BOTTOM_Y

  return (
    <pixiContainer ref={containerRef} x={startX} y={startY}>
      <pixiSprite texture={tex(textureName)} anchor={0.5} />
      <pixiText text={String(number)} style={style} anchor={0.5} />
    </pixiContainer>
  )
}

// ── Regular ball animation (unchanged logic) ──────────────────────

function animateRegular(
  container: Container,
  finalX: number,
  finalY: number,
  onArriveRef: React.RefObject<((()=> void) | undefined) | null>,
) {
  const landingDuration = 0.08 + 0.066 * Math.random()
  const rollDistance = finalX - PIPE_EXIT_X

  let phase = 0
  let movePercent = 0
  let pixelsTraveled = 0
  let rollFrameCount = 0
  let landingElapsed = 0
  let rotationAtLanding = 0

  container.x = PIPE_EXIT_X
  container.y = PIPE_BOTTOM_Y
  container.rotation = 0
  container.scale.set(1)

  const ticker = Ticker.shared
  const onTick = () => {
    if (phase === 0) {
      movePercent += DROP_SPEED
      const t = Math.min(movePercent, 1)
      container.y = PIPE_BOTTOM_Y + (finalY - PIPE_BOTTOM_Y) * easeInQuad(t)
      container.rotation = Math.PI * 2 * 2 * t
      if (movePercent >= 1) {
        container.y = finalY
        phase = 1
        pixelsTraveled = 0
        rollFrameCount = 0
      }
    } else if (phase === 1) {
      rollFrameCount++
      const speedFactor = Math.min(rollFrameCount / ROLL_RAMP_FRAMES, 1)
      pixelsTraveled += ROLL_PX_PER_FRAME * speedFactor
      const arrived = pixelsTraveled >= rollDistance
      const px = arrived ? rollDistance : pixelsTraveled
      container.x = PIPE_EXIT_X + px
      container.rotation = (px / ROTATION_FACTOR) * Math.PI * 2
      if (arrived) {
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
    if (phase === 0) {
      // Phase 1: short move from chute to waypoint (very fast)
      movePercent += EXTRA_SPEED_PHASE1
      if (movePercent >= 1) {
        movePercent = 0
        phase = 1
      }
      // Barely moves (130→135, same Y) — just a brief pause
    } else if (phase === 1) {
      // Phase 2: fly from waypoint to grid position
      movePercent += EXTRA_SPEED_PHASE2
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
// AS3: BallPath → Ball.fitToLastSuperPosition (3-phase arc)

function animateSuper(
  container: Container,
  pos: number,
  onArriveRef: React.RefObject<((()=> void) | undefined) | null>,
) {
  const finalX = SUPER_STACK_X
  const finalY = SUPER_STACK_BASE_Y - SUPER_STACK_BALL_HEIGHT * pos

  let phase = 0 // 0=move-to-340,365  1=arc  2=snap
  let elapsed = 0
  const startX = EXTRA_CHUTE_X
  const startY = EXTRA_CHUTE_Y

  container.x = startX
  container.y = startY
  container.rotation = 0
  container.scale.set(EXTRA_BALL_SCALE)

  // Phase 1 targets
  const p1x = SUPER_PHASE1_TARGET_X
  const p1y = SUPER_PHASE1_TARGET_Y

  // Arc phase state
  let arcElapsed = 0
  const arcDuration = SUPER_PHASE1_DURATION + 0.1 // 0.5s
  const riseRatio = 0.5 + 0.1 * pos
  const fallRatio = 0.5 - 0.1 * pos

  // Snap phase state
  let snapElapsed = 0

  const ticker = Ticker.shared
  const onTick = () => {
    const dt = ticker.deltaMS / 1000

    if (phase === 0) {
      // Phase 1: fly to (340, 365) with rotation
      elapsed += dt
      const t = Math.min(1, elapsed / SUPER_PHASE1_DURATION)
      container.x = startX + (p1x - startX) * t
      container.y = startY + (p1y - startY) * easeInSine(t)
      container.rotation = -(Math.PI * 2) * t
      if (t >= 1) {
        phase = 1
        arcElapsed = 0
        onArriveRef.current?.()
      }
    } else if (phase === 1) {
      // Phase 2: arc trajectory — rise then fall
      arcElapsed += dt
      const t = Math.min(1, arcElapsed / arcDuration)
      // Horizontal: linear from p1x to finalX-4
      container.x = p1x + ((finalX - 4) - p1x) * t
      // Vertical: parabolic arc
      if (t < riseRatio) {
        // Rise
        const tUp = t / riseRatio
        container.y = p1y + (SUPER_ARC_PEAK_Y - p1y) * easeOutSine(tUp)
      } else {
        // Fall
        const tDown = (t - riseRatio) / fallRatio
        container.y = SUPER_ARC_PEAK_Y + ((finalY - 10) - SUPER_ARC_PEAK_Y) * easeInSine(tDown)
      }
      // Rotation: full spin during arc
      container.rotation = -(Math.PI * 2) * t
      // Scale down during arc
      const sT = Math.min(1, t * 2)
      container.scale.set(EXTRA_BALL_SCALE + (1 - EXTRA_BALL_SCALE) * sT)
      if (t >= 1) {
        phase = 2
        snapElapsed = 0
      }
    } else {
      // Phase 3: final snap to exact position (easeOutBounce)
      snapElapsed += dt
      const t = Math.min(1, snapElapsed / SUPER_FINAL_SNAP_DURATION)
      const e = easeOutBounce(t)
      container.x = (finalX - 4) + ((finalX) - (finalX - 4)) * e
      container.y = (finalY - 10) + ((finalY) - (finalY - 10)) * e
      container.rotation = 0
      container.scale.set(1)
      if (t >= 1) {
        container.x = finalX
        container.y = finalY
        ticker.remove(onTick)
      }
    }
  }

  ticker.add(onTick)
  return () => { ticker.remove(onTick) }
}
