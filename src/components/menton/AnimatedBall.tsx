import { useEffect, useRef } from 'react'
import { Container, Sprite, Text, TextStyle, Ticker } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { BALL_FONT, BALL_TEXT_COLOR, BALL_NORMAL_SIZE } from './ballConstants'

extend({ Container, Sprite, Text })

const normalStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: BALL_NORMAL_SIZE,
  fill: BALL_TEXT_COLOR,
})

/** Pipe exit X — center of ballpipe bottom opening (texture center at row 60-76 = x:39, pipe at PIPE_X=-6) */
const PIPE_EXIT_X = 33

/** Pipe bottom Y — where balls emerge (ballpipe at y=0, height=77) */
const PIPE_BOTTOM_Y = 77

/** Drop speed: gravity (~10 frames = 167ms) */
const DROP_SPEED = 0.096

/** Frames for roll to ramp up from 0 to full speed (smooth entry into tube) */
const ROLL_RAMP_FRAMES = 4

/** Constant horizontal roll speed in px/frame — all balls roll at same speed */
const ROLL_PX_PER_FRAME = 14.4

/** Ball "circumference" factor for rotation — smaller = more rotations per distance */
const ROTATION_FACTOR = 18

/** EaseIn quadratic — simulates gravity acceleration */
function easeInQuad(t: number): number {
  return t * t
}

/** Starling Transitions.EASE_OUT_BACK */
function easeOutBack(t: number): number {
  const s = 1.70158
  const t1 = t - 1
  return t1 * t1 * ((s + 1) * t1 + s) + 1
}

interface Props {
  number: number
  finalX: number
  y: number
  index: number // 0-29 draw index
  onArrive?: () => void
}

/**
 * AS3: BallPath — ball travels from pipe exit to final row position.
 *
 * Phase 0 (drop): Ball falls from pipe bottom to tube row Y (easeIn gravity)
 * Phase 1 (roll): Ball rolls at constant px/frame speed to final column
 * Phase 2 (land): Rotation settles to 0 with EASE_OUT_BACK
 */
export default function AnimatedBall({ number, finalX, y, index, onArrive }: Props) {
  const containerRef = useRef<Container>(null)
  const onArriveRef = useRef(onArrive)
  onArriveRef.current = onArrive

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const landingDuration = 0.08 + 0.066 * Math.random()
    const rollDistance = finalX - PIPE_EXIT_X

    let phase = 0 // 0=drop, 1=roll, 2=landing
    let movePercent = 0
    let pixelsTraveled = 0
    let rollFrameCount = 0
    let landingElapsed = 0
    let rotationAtLanding = 0

    container.x = PIPE_EXIT_X
    container.y = PIPE_BOTTOM_Y
    container.rotation = 0

    const ticker = Ticker.shared
    const onTick = () => {
      if (phase === 0) {
        // Drop: straight vertical from pipe bottom to tube row Y
        movePercent += DROP_SPEED
        const t = Math.min(movePercent, 1)
        container.y = PIPE_BOTTOM_Y + (y - PIPE_BOTTOM_Y) * easeInQuad(t)
        container.rotation = Math.PI * 2 * 2 * t
        if (movePercent >= 1) {
          container.y = y
          phase = 1
          pixelsTraveled = 0
          rollFrameCount = 0
        }
      } else if (phase === 1) {
        // Roll: ramp up speed over first few frames, then constant
        rollFrameCount++
        const speedFactor = Math.min(rollFrameCount / ROLL_RAMP_FRAMES, 1)
        pixelsTraveled += ROLL_PX_PER_FRAME * speedFactor
        const arrived = pixelsTraveled >= rollDistance
        const px = arrived ? rollDistance : pixelsTraveled
        container.x = PIPE_EXIT_X + px
        // Rotation proportional to distance (like a real rolling ball)
        container.rotation = (px / ROTATION_FACTOR) * Math.PI * 2
        if (arrived) {
          container.x = finalX
          rotationAtLanding = container.rotation % (Math.PI * 2)
          phase = 2
          onArriveRef.current?.()
        }
      } else {
        // Landing: settle rotation to 0
        landingElapsed += ticker.deltaMS / 1000
        const t = Math.min(1, landingElapsed / landingDuration)
        const eased = easeOutBack(t)
        container.rotation = rotationAtLanding * (1 - eased)
        if (t >= 1) {
          container.rotation = 0
          ticker.remove(onTick)
        }
      }
    }

    ticker.add(onTick)
    return () => { ticker.remove(onTick) }
  }, [finalX, y, index])

  return (
    <pixiContainer ref={containerRef} x={PIPE_EXIT_X} y={PIPE_BOTTOM_Y}>
      <pixiSprite texture={tex('ball')} anchor={0.5} />
      <pixiText text={String(number)} style={normalStyle} anchor={0.5} />
    </pixiContainer>
  )
}
