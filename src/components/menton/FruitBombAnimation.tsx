import { useRef, useEffect } from 'react'
import { Container, Sprite } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { CARD_W, CARD_H, CARD_GAP } from './cardConstants'
import { CARD_PANEL_X, CARD_PANEL_Y } from './layoutConstants'

extend({ Container })

const CARD_POSITIONS = [
  { x: 0, y: 0 },
  { x: CARD_W + CARD_GAP, y: 0 },
  { x: 0, y: CARD_H + CARD_GAP },
  { x: CARD_W + CARD_GAP, y: CARD_H + CARD_GAP },
]

// AS3: FruitBonus at (170, 150) in card space — roughly center
const CARD_CENTER_X = 170
const CARD_CENTER_Y = 150

// AS3: fly duration 0.3s EASE_IN_EXPO, then 0.4s explosion
const FLY_DURATION = 0.3
const EXPLODE_DURATION = 0.4

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

// Bomb textures per card position (top/middle/bottom variants)
const BOMB_TEXTURES = ['bomb1', 'bomb2', 'bomb1', 'bomb3']

interface BombAnim {
  startX: number
  startY: number
  targetX: number
  targetY: number
  elapsed: number
  phase: 'fly' | 'explode'
}

interface Props {
  active: boolean
  onComplete?: () => void
}

export default function FruitBombAnimation({ active, onComplete }: Props) {
  const containerRef = useRef<Container>(null)
  const spritesRef = useRef<Sprite[]>([])
  const animsRef = useRef<BombAnim[]>([])
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })
  const wasActiveRef = useRef(false)
  const builtRef = useRef(false)

  useEffect(() => {
    const root = containerRef.current
    if (!root || builtRef.current) return
    builtRef.current = true

    for (let i = 0; i < 4; i++) {
      const bomb = new Sprite(tex(BOMB_TEXTURES[i]))
      bomb.visible = false
      bomb.anchor.set(0.5)
      root.addChild(bomb)
      spritesRef.current.push(bomb)
    }
  }, [])

  useTick((ticker) => {
    // Detect activation
    if (active && !wasActiveRef.current) {
      wasActiveRef.current = true
      animsRef.current = []

      for (let i = 0; i < 4; i++) {
        const cardPos = CARD_POSITIONS[i]
        const targetX = CARD_PANEL_X + cardPos.x + CARD_CENTER_X
        const targetY = CARD_PANEL_Y + cardPos.y + CARD_CENTER_Y
        // AS3: random start within 400x100 area above target
        const startX = targetX + (Math.random() - 0.5) * 400
        const startY = targetY - 100 - Math.random() * 100

        animsRef.current.push({
          startX, startY, targetX, targetY,
          elapsed: 0, phase: 'fly',
        })

        const sprite = spritesRef.current[i]
        if (sprite) {
          sprite.visible = true
          sprite.alpha = 0
          sprite.scale.set(3)
          sprite.x = startX
          sprite.y = startY
        }
      }
    }

    if (!active && wasActiveRef.current) {
      wasActiveRef.current = false
      for (const s of spritesRef.current) s.visible = false
      animsRef.current = []
    }

    if (!active || animsRef.current.length === 0) return

    const dt = ticker.deltaMS / 1000
    let allDone = true

    for (let i = 0; i < animsRef.current.length; i++) {
      const anim = animsRef.current[i]
      const sprite = spritesRef.current[i]
      if (!sprite) continue

      anim.elapsed += dt

      if (anim.phase === 'fly') {
        const t = Math.min(anim.elapsed / FLY_DURATION, 1)
        const e = easeInExpo(t)
        sprite.x = anim.startX + (anim.targetX - anim.startX) * e
        sprite.y = anim.startY + (anim.targetY - anim.startY) * e
        sprite.alpha = t
        sprite.scale.set(3 - 2 * t) // 3 → 1

        if (t >= 1) {
          anim.phase = 'explode'
          anim.elapsed = 0
        }
        allDone = false
      } else if (anim.phase === 'explode') {
        const t = Math.min(anim.elapsed / EXPLODE_DURATION, 1)
        sprite.alpha = 1 - t
        sprite.scale.set(1 + t * 0.5)

        if (t < 1) allDone = false
        else sprite.visible = false
      }
    }

    if (allDone) {
      animsRef.current = []
      onCompleteRef.current?.()
    }
  })

  return <pixiContainer ref={containerRef} />
}
