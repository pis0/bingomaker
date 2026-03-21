import { useRef, useEffect } from 'react'
import { Container, Sprite } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import type { SlotPosition } from '../../engine/SlotBonusSession'
import { X_O, Y_O, CELL_W, CELL_H, CARD_W, CARD_H, CARD_GAP } from './cardConstants'
import { CARD_PANEL_X, CARD_PANEL_Y, BELL_PANEL_CENTER_X, BELL_PANEL_CENTER_Y } from './layoutConstants'

extend({ Container })

const CARD_POSITIONS = [
  { x: 0, y: 0 },
  { x: CARD_W + CARD_GAP, y: 0 },
  { x: 0, y: CARD_H + CARD_GAP },
  { x: CARD_W + CARD_GAP, y: CARD_H + CARD_GAP },
]

// Bell flies to BellPanel center
const TARGET_X = BELL_PANEL_CENTER_X
const TARGET_Y = BELL_PANEL_CENTER_Y
const FLY_DURATION = 0.6

interface FlyAnim {
  startX: number
  startY: number
  elapsed: number
}

interface Props {
  positions: SlotPosition[]
}

export default function BellFlyAnimation({ positions }: Props) {
  const containerRef = useRef<Container>(null)
  const spriteRef = useRef<Sprite | null>(null)
  const animatedBallsRef = useRef<Set<number>>(new Set())
  const queueRef = useRef<{ x: number; y: number }[]>([])
  const flyRef = useRef<FlyAnim | null>(null)
  const roundKeyRef = useRef('')

  useEffect(() => {
    const root = containerRef.current
    if (!root || spriteRef.current) return
    const bell = new Sprite(tex('cardbell4'))
    bell.visible = false
    bell.anchor.set(0.5)
    bell.scale.set(2)
    root.addChild(bell)
    spriteRef.current = bell

    return () => {
      bell.destroy()
      spriteRef.current = null
    }
  }, [])

  useTick((ticker) => {
    // Detect new round (bell positions change)
    const key = positions.map(p => p.ball).join(',')
    if (key !== roundKeyRef.current) {
      roundKeyRef.current = key
      animatedBallsRef.current.clear()
      queueRef.current = []
      flyRef.current = null
      if (spriteRef.current) spriteRef.current.visible = false
    }

    // Detect new bell hits
    for (const pos of positions) {
      if (pos.hit && !animatedBallsRef.current.has(pos.ball)) {
        animatedBallsRef.current.add(pos.ball)
        const cardPos = CARD_POSITIONS[pos.cardIndex]
        if (cardPos) {
          queueRef.current.push({
            x: CARD_PANEL_X + cardPos.x + X_O + pos.col * CELL_W + CELL_W / 2,
            y: CARD_PANEL_Y + cardPos.y + Y_O + pos.row * CELL_H + CELL_H / 2,
          })
        }
      }
    }

    const sprite = spriteRef.current
    if (!sprite) return

    // Start next fly animation
    if (!flyRef.current && queueRef.current.length > 0) {
      const pos = queueRef.current.shift()!
      flyRef.current = { startX: pos.x, startY: pos.y, elapsed: 0 }
      sprite.x = pos.x
      sprite.y = pos.y
      sprite.visible = true
      sprite.alpha = 1
      sprite.scale.set(2)
    }

    if (flyRef.current) {
      flyRef.current.elapsed += ticker.deltaMS / 1000
      const t = Math.min(flyRef.current.elapsed / FLY_DURATION, 1)

      sprite.x = flyRef.current.startX + (TARGET_X - flyRef.current.startX) * t
      sprite.y = flyRef.current.startY + (TARGET_Y - flyRef.current.startY) * t
      // Fade out in final 30%
      sprite.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3
      // Scale down during flight
      sprite.scale.set(2 - t * 0.8)

      if (t >= 1) {
        sprite.visible = false
        flyRef.current = null
      }
    }
  })

  return <pixiContainer ref={containerRef} />
}
