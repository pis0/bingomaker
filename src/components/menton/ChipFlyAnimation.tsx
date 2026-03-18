/**
 * ChipFlyAnimation — fichas voam das células do pattern até o Payout.
 *
 * AS3: LinePattern.sendChipsToPayout / ColumnPattern.sendChipsToPayout
 *   - ficha78_sk, scale 0.75, centerPivots
 *   - Shake Y ±3px (0.2s period) before flight
 *   - Fly 0.7s linear to Payout center, 0.08s stagger (last→first)
 *   - After all arrive + 0.1s delay → callback
 */
import { useRef, useState } from 'react'
import { Container, Sprite } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { PAYOUT_CENTER_X, PAYOUT_CENTER_Y } from './layoutConstants'

extend({ Container, Sprite })

// AS3: ficha78_sk scale 0.75, centerPivots
const CHIP_SCALE = 0.75

// AS3: shake Y ±3 every 0.2s
const SHAKE_AMPLITUDE = 3
const SHAKE_PERIOD = 200

// AS3: fly duration 0.7s per chip, 0.08s stagger
const FLY_DURATION = 700
const FLY_STAGGER = 80

// Default delay before flight starts (shake/bump phase)
const DEFAULT_FLY_DELAY = 300

// Delay after last chip arrives before calling onComplete
const END_DELAY = 100

export interface ChipPosition {
  x: number
  y: number
}

interface Props {
  chips: ChipPosition[]
  onComplete: () => void
  /** How long chips bump in place before flying (ms). Sync with PatternMovie timing. */
  flyDelay?: number
}

interface ChipState {
  startX: number
  startY: number
  x: number
  y: number
  visible: boolean
  flyStartTime: number
}

export default function ChipFlyAnimation({ chips, onComplete, flyDelay = DEFAULT_FLY_DELAY }: Props) {
  const stateRef = useRef<ChipState[] | null>(null)
  const timerRef = useRef(0)
  const doneRef = useRef(false)
  const [, setTick] = useState(0)

  // Initialize chip states on first render or when chips change
  if (!stateRef.current || stateRef.current.length !== chips.length) {
    doneRef.current = false
    timerRef.current = 0

    // AS3: stagger from last to first
    const totalChips = chips.length
    stateRef.current = chips.map((pos, i) => ({
      startX: pos.x,
      startY: pos.y,
      x: pos.x,
      y: pos.y,
      visible: true,
      flyStartTime: flyDelay + (totalChips - 1 - i) * FLY_STAGGER,
    }))
  }

  useTick((ticker) => {
    if (doneRef.current || !stateRef.current) return

    timerRef.current += ticker.deltaMS
    const t = timerRef.current
    let allArrived = true

    for (const chip of stateRef.current) {
      if (!chip.visible) continue

      const flyElapsed = t - chip.flyStartTime

      if (flyElapsed < 0) {
        // Shake phase — Y oscillates ±SHAKE_AMPLITUDE
        const shakePhase = Math.sin((t / SHAKE_PERIOD) * Math.PI * 2)
        chip.x = chip.startX
        chip.y = chip.startY + shakePhase * SHAKE_AMPLITUDE
        allArrived = false
      } else if (flyElapsed < FLY_DURATION) {
        // Fly phase — linear interpolation to Payout center
        const progress = flyElapsed / FLY_DURATION
        chip.x = chip.startX + (PAYOUT_CENTER_X - chip.startX) * progress
        chip.y = chip.startY + (PAYOUT_CENTER_Y - chip.startY) * progress
        allArrived = false
      } else {
        // Arrived — hide
        chip.x = PAYOUT_CENTER_X
        chip.y = PAYOUT_CENTER_Y
        chip.visible = false
      }
    }

    // Force re-render so sprite positions update
    setTick(t => t + 1)

    if (allArrived && !doneRef.current) {
      doneRef.current = true
      setTimeout(onComplete, END_DELAY)
    }
  })

  const state = stateRef.current
  if (!state) return null

  return (
    <pixiContainer>
      {state.map((chip, i) =>
        chip.visible ? (
          <pixiSprite
            key={i}
            texture={tex('ficha78_sk')}
            anchor={0.5}
            scale={CHIP_SCALE}
            x={chip.x}
            y={chip.y}
          />
        ) : null,
      )}
    </pixiContainer>
  )
}
