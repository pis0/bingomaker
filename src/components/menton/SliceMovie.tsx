/**
 * SliceMovie — decorative citrus slices drifting across the extra ball panel.
 *
 * AS3: BallPanelMenton.showExtraBgTextureMovie()
 *
 * 16 "textura_painelbolaextra" sprites drift left→right over 16s (infinite loop),
 * each slowly rotating. Container clipped to 370×126, alpha 0.66.
 * Visible during idle + regular discharge, hidden in extra mode.
 */
import { useEffect, useRef } from 'react'
import { Container, Sprite, Ticker, Graphics } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'

extend({ Container, Sprite, Graphics })

const COUNT = 16
const CLIP_W = 370
const CLIP_H = 126
const DRIFT_DURATION = 16 // seconds
const CONTAINER_ALPHA = 0.66
const FADE_IN = 300 // ms

interface SliceState {
  sprite: Sprite
  speed: number       // px per ms
  rotSpeed: number    // rad per ms (±)
}

interface Props {
  active: boolean
  x?: number
  y?: number
}

export default function SliceMovie({ active, x = 173, y = 3 }: Props) {
  const containerRef = useRef<Container>(null)
  const slicesRef = useRef<SliceState[]>([])
  const builtRef = useRef(false)
  const fadeRef = useRef({ elapsed: 0, target: 0 })

  // Build slices once
  useEffect(() => {
    const container = containerRef.current
    if (!container || builtRef.current) return
    builtRef.current = true

    // Clip mask
    const mask = new Graphics()
    mask.rect(0, 0, CLIP_W, CLIP_H).fill({ color: 0xffffff })
    container.addChild(mask)
    container.mask = mask

    const texture = tex('textura_painelbolaextra')
    const slices: SliceState[] = []

    for (let i = 0; i < COUNT; i++) {
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5, 1.0) // AS3: pivotRatioX=0.5, pivotRatioY=1.0
      sprite.scale.set(2.0 - 1.5 * Math.random()) // [0.5, 2.0]
      sprite.alpha = 0.3 + 0.35 * Math.random()   // [0.3, 0.65]
      sprite.rotation = Math.PI * 2 * Math.random()

      // Start position: spread across the drift range (staggered)
      const totalWidth = CLIP_W + sprite.width * 2
      const speed = totalWidth / (DRIFT_DURATION * 1000) // px/ms
      const stagger = (DRIFT_DURATION * 1000 / COUNT) * i
      sprite.x = -sprite.width + speed * stagger
      sprite.y = Math.floor(CLIP_H * 2 * Math.random())

      const dir = Math.random() < 0.5 ? 1 : -1
      const rotSpeed = 0.010006 / 16.667 * dir // AS3: 0.010006 per frame @ ~60fps → per ms

      container.addChild(sprite)
      slices.push({ sprite, speed, rotSpeed })
    }

    slicesRef.current = slices
    container.alpha = 0

    return () => {
      // Cleanup
      for (const s of slices) s.sprite.destroy()
      mask.destroy()
      slicesRef.current = []
      builtRef.current = false
    }
  }, [])

  // Ticker — drift + rotation + fade
  useEffect(() => {
    const ticker = Ticker.shared
    const onTick = () => {
      const container = containerRef.current
      if (!container) return
      const dt = ticker.deltaMS
      const slices = slicesRef.current

      // Fade in/out
      const fade = fadeRef.current
      if (active && container.alpha < CONTAINER_ALPHA) {
        fade.elapsed += dt
        container.alpha = Math.min(CONTAINER_ALPHA, (fade.elapsed / FADE_IN) * CONTAINER_ALPHA)
      } else if (!active && container.alpha > 0) {
        container.alpha = 0
      }

      if (!active || slices.length === 0) return

      for (const s of slices) {
        s.sprite.x += s.speed * dt
        s.sprite.rotation += s.rotSpeed * dt

        // Wrap around when past right edge
        if (s.sprite.x > CLIP_W + s.sprite.width) {
          s.sprite.x = -s.sprite.width
          s.sprite.y = Math.floor(CLIP_H * 2 * Math.random())
        }
      }
    }
    ticker.add(onTick)
    return () => { ticker.remove(onTick) }
  }, [active])

  // Reset fade when becoming active
  useEffect(() => {
    if (active) {
      fadeRef.current.elapsed = 0
    }
  }, [active])

  return <pixiContainer ref={containerRef} x={x} y={y} />
}
