/**
 * ChipFlyAnimation — fichas voam das células do pattern até o Payout.
 *
 * AS3: LinePattern.sendChipsToPayout / ColumnPattern.sendChipsToPayout
 *   - ficha78_sk, scale 0.75, centerPivots
 *   - Shake Y ±3px (0.2s period) before flight
 *   - Fly 0.7s linear to Payout center, 0.08s stagger (last→first)
 *   - After all arrive + 0.1s delay → callback
 */
import { useRef, useEffect, useCallback } from 'react'
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
  flyStartTime: number
  sprite: Sprite | null
}

export default function ChipFlyAnimation({ chips, onComplete, flyDelay = DEFAULT_FLY_DELAY }: Props) {
  const containerRef = useRef<Container>(null)
  const statesRef = useRef<ChipState[]>([])
  const timerRef = useRef(0)
  const doneRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Build sprites imperatively once
  const setupContainer = useCallback((node: Container | null) => {
    containerRef.current = node
    if (!node || statesRef.current.length > 0) return

    const chipTex = tex('ficha78_sk')
    const totalChips = chips.length
    const states: ChipState[] = []

    for (let i = 0; i < totalChips; i++) {
      const pos = chips[i]
      const sprite = new Sprite(chipTex)
      sprite.anchor.set(0.5)
      sprite.scale.set(CHIP_SCALE)
      sprite.x = pos.x
      sprite.y = pos.y
      node.addChild(sprite)

      states.push({
        startX: pos.x,
        startY: pos.y,
        flyStartTime: flyDelay + (totalChips - 1 - i) * FLY_STAGGER,
        sprite,
      })
    }

    statesRef.current = states
    timerRef.current = 0
    doneRef.current = false
  }, [chips, flyDelay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      // Destroy all sprites
      for (const s of statesRef.current) {
        s.sprite?.destroy()
      }
      statesRef.current = []
    }
  }, [])

  useTick((ticker) => {
    if (doneRef.current || statesRef.current.length === 0) return

    timerRef.current += ticker.deltaMS
    const t = timerRef.current
    let allArrived = true

    for (const chip of statesRef.current) {
      const sprite = chip.sprite
      if (!sprite || !sprite.visible) continue

      const flyElapsed = t - chip.flyStartTime

      if (flyElapsed < 0) {
        // Shake phase — Y oscillates ±SHAKE_AMPLITUDE
        const shakePhase = Math.sin((t / SHAKE_PERIOD) * Math.PI * 2)
        sprite.x = chip.startX
        sprite.y = chip.startY + shakePhase * SHAKE_AMPLITUDE
        allArrived = false
      } else if (flyElapsed < FLY_DURATION) {
        // Fly phase — linear interpolation to Payout center
        const progress = flyElapsed / FLY_DURATION
        sprite.x = chip.startX + (PAYOUT_CENTER_X - chip.startX) * progress
        sprite.y = chip.startY + (PAYOUT_CENTER_Y - chip.startY) * progress
        allArrived = false
      } else {
        // Arrived — hide
        sprite.visible = false
      }
    }

    if (allArrived && !doneRef.current) {
      doneRef.current = true
      timeoutRef.current = setTimeout(() => onCompleteRef.current(), END_DELAY)
    }
  })

  return <pixiContainer ref={setupContainer} />
}
