import { useRef, useEffect } from 'react'
import { Container, Sprite } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'

extend({ Container })

// AS3: x2MovieContainer at (50, 11) relative to BellPanel at (555, 75)
const START_X = 555 + 50
const START_Y = 75 + 11
// AS3: drops to y: 650 (+ 20 one-hand offset) — we use 725 for our viewport
const END_Y = 725
// AS3: 1.3333 seconds (4/3), EASE_IN_CUBIC
const DURATION = 1.3333

function easeInCubic(t: number): number {
  return t * t * t
}

interface Props {
  active: boolean
  onComplete?: () => void
}

export default function MultiplierCollect({ active, onComplete }: Props) {
  const containerRef = useRef<Container>(null)
  const spriteRef = useRef<Sprite | null>(null)
  const animRef = useRef<{ elapsed: number; done: boolean } | null>(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })
  const wasActiveRef = useRef(false)

  useEffect(() => {
    const root = containerRef.current
    if (!root || spriteRef.current) return
    const img = new Sprite(tex('multiply_anim'))
    img.visible = false
    img.anchor.set(0.5, 0)
    root.addChild(img)
    spriteRef.current = img
  }, [])

  useTick((ticker) => {
    // Detect activation
    if (active && !wasActiveRef.current) {
      wasActiveRef.current = true
      animRef.current = { elapsed: 0, done: false }
      if (spriteRef.current) {
        spriteRef.current.visible = true
        spriteRef.current.x = START_X
        spriteRef.current.y = START_Y
        spriteRef.current.alpha = 1
      }
    }

    if (!active && wasActiveRef.current) {
      wasActiveRef.current = false
      animRef.current = null
      if (spriteRef.current) spriteRef.current.visible = false
    }

    const sprite = spriteRef.current
    const anim = animRef.current
    if (!sprite || !anim || anim.done) return

    anim.elapsed += ticker.deltaMS / 1000
    const t = Math.min(anim.elapsed / DURATION, 1)
    sprite.y = START_Y + (END_Y - START_Y) * easeInCubic(t)
    // Fade out in final 20%
    sprite.alpha = t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2

    if (t >= 1) {
      anim.done = true
      sprite.visible = false
      onCompleteRef.current?.()
    }
  })

  return <pixiContainer ref={containerRef} />
}
