import { useRef, useEffect, useCallback } from 'react'
import { Container, Assets, Spritesheet, Texture } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { loadMovieBytes } from '../../animations/loadMovieBytes'
import { MovieBytesPlayer } from '../../animations/MovieBytesPlayer'
import type { MovieBytesData } from '../../animations/parseMovieBytes'
import type { BombPosition } from '../../engine/FruitBombBonusSession'
import { CARD_W, CARD_H, CARD_GAP, X_O, Y_O, CELL_W, CELL_H } from './cardConstants'
import { CARD_PANEL_X, CARD_PANEL_Y } from './layoutConstants'

extend({ Container })

// AS3: 0.3s EASE_IN_EXPO tween
const FLY_DURATION = 0.3

// AS3: cardShake — 4 steps of 0.05s each
const SHAKE_STEPS: Array<{ x: number; y: number; delay: number }> = [
  { x: 1, y: 1, delay: 0 },
  { x: -2, y: -2, delay: 0.05 },
  { x: 1, y: -1, delay: 0.10 },
  { x: 0, y: 0, delay: 0.17 },
]
const SHAKE_DURATION = 0.22

// AS3: 0.5s delay after shake before callback
const POST_SHAKE_DELAY = 0.5

// movieScale — maps tx/ty from Flash authoring coords to game coords
const MOVIE_SCALE = 0.41667

// Fruit MovieBytes URLs + AS3 clip offsets (in authoring coords, scaled by movieScale at runtime)
const BASE = import.meta.env.BASE_URL
const FRUIT_CONFIGS: Record<string, { url: string; offsetX: number; offsetY: number }> = {
  grapes: { url: `${BASE}assets/menton/movies/grapes.bytes`, offsetX: -84, offsetY: -66 },
  apple: { url: `${BASE}assets/menton/movies/apple.bytes`, offsetX: -91, offsetY: -86 },
  strawberry: { url: `${BASE}assets/menton/movies/strawberry.bytes`, offsetX: -99, offsetY: -80 },
  pineapple: { url: `${BASE}assets/menton/movies/pineapple.bytes`, offsetX: -98, offsetY: -69 },
}

const FRUIT_NAMES = Object.keys(FRUIT_CONFIGS)

// Card grid positions in Menton space
const CARD_POSITIONS = [
  { x: 0, y: 0 },
  { x: CARD_W + CARD_GAP, y: 0 },
  { x: 0, y: CARD_H + CARD_GAP },
  { x: CARD_W + CARD_GAP, y: CARD_H + CARD_GAP },
]

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

/** AS3: randomFruit() — equal probability among 4 fruits */
function pickRandomFruit(): string {
  return FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)]
}

function getFruitTexture(name: string): Texture {
  const sheet = Assets.get<Spritesheet>('menton_fruit')
  if (sheet?.textures[name]) return sheet.textures[name]
  return Texture.EMPTY
}

interface FruitAnim {
  /** Container holding the MovieBytesPlayer */
  container: Container
  player: MovieBytesPlayer | null
  /** Tween start position in Menton space */
  startX: number
  startY: number
  /** Tween end position in Menton space */
  targetX: number
  targetY: number
  elapsed: number
  phase: 'tween' | 'playing' | 'done'
}

type AnimPhase = 'idle' | 'tween' | 'shake' | 'delay' | 'done'

interface Props {
  active: boolean
  bombPositions: BombPosition[]
  /** Called with (dx, dy) offsets during card shake */
  onShake?: (dx: number, dy: number) => void
  onComplete?: () => void
}

export default function FruitBombAnimation({ active, bombPositions, onShake, onComplete }: Props) {
  const containerRef = useRef<Container>(null)
  const fruitsRef = useRef<FruitAnim[]>([])
  const phaseRef = useRef<AnimPhase>('idle')
  const phaseTimerRef = useRef(0)
  const wasActiveRef = useRef(false)
  const bytesCache = useRef<Map<string, MovieBytesData>>(new Map())

  const onCompleteRef = useRef(onComplete)
  const onShakeRef = useRef(onShake)
  useEffect(() => { onCompleteRef.current = onComplete })
  useEffect(() => { onShakeRef.current = onShake })

  // Preload all fruit MovieBytes data on mount; clear cache on unmount
  useEffect(() => {
    let unmounted = false
    for (const [name, cfg] of Object.entries(FRUIT_CONFIGS)) {
      loadMovieBytes(cfg.url).then(data => {
        if (!unmounted) bytesCache.current.set(name, data)
      })
    }
    return () => {
      unmounted = true
      for (const data of bytesCache.current.values()) {
        // Destroy cached frame textures if the data exposes them
        if (data && typeof (data as any).destroy === 'function') {
          (data as any).destroy()
        }
      }
      bytesCache.current.clear()
    }
  }, [])

  const cleanup = useCallback(() => {
    const root = containerRef.current
    for (const fruit of fruitsRef.current) {
      fruit.player?.destroy()
      if (root?.children.includes(fruit.container)) {
        root.removeChild(fruit.container)
      }
    }
    fruitsRef.current = []
    phaseRef.current = 'idle'
    phaseTimerRef.current = 0
  }, [])

  useTick((ticker) => {
    // Detect activation
    if (active && !wasActiveRef.current) {
      wasActiveRef.current = true
      cleanup()

      const root = containerRef.current
      if (!root) return

      const anims: FruitAnim[] = []

      for (const pos of bombPositions) {
        const fruitName = pickRandomFruit()
        const data = bytesCache.current.get(fruitName)

        // Card top-left in Menton space
        const cardX = CARD_PANEL_X + CARD_POSITIONS[pos.cardIndex].x
        const cardY = CARD_PANEL_Y + CARD_POSITIONS[pos.cardIndex].y

        // Center of 2×2 block (intersection point of the 4 cells)
        const blockCenterX = X_O + (pos.col + 1) * CELL_W
        const blockCenterY = Y_O + (pos.row + 1) * CELL_H
        const targetX = cardX + blockCenterX
        const targetY = cardY + blockCenterY

        // Random start: above the card, spread horizontally
        const startX = cardX + CARD_W * Math.random()
        const startY = cardY - 50 - Math.random() * 100

        // Create container for this fruit
        const fruitContainer = new Container()
        fruitContainer.x = startX
        fruitContainer.y = startY
        fruitContainer.alpha = 0
        fruitContainer.scale.set(3)
        root.addChild(fruitContainer)

        // Create MovieBytesPlayer if data is loaded
        let player: MovieBytesPlayer | null = null
        if (data) {
          player = new MovieBytesPlayer(data, getFruitTexture, {
            scale: MOVIE_SCALE,
            textureScale: MOVIE_SCALE,
          })
          player.container.visible = false
          fruitContainer.addChild(player.container)
        }

        anims.push({
          container: fruitContainer,
          player,
          startX, startY,
          targetX, targetY,
          elapsed: 0,
          phase: 'tween',
        })
      }

      fruitsRef.current = anims
      phaseRef.current = 'tween'
      phaseTimerRef.current = 0
    }

    if (!active && wasActiveRef.current) {
      wasActiveRef.current = false
      cleanup()
      return
    }

    if (!active || phaseRef.current === 'idle' || phaseRef.current === 'done') return

    const dt = ticker.deltaMS / 1000

    // Phase: tween — fly fruits to cell positions
    if (phaseRef.current === 'tween') {
      let allDone = true

      for (const fruit of fruitsRef.current) {
        if (fruit.phase !== 'tween') continue

        fruit.elapsed += dt
        const t = Math.min(fruit.elapsed / FLY_DURATION, 1)
        const e = easeInExpo(t)

        fruit.container.x = fruit.startX + (fruit.targetX - fruit.startX) * e
        fruit.container.y = fruit.startY + (fruit.targetY - fruit.startY) * e
        fruit.container.alpha = t
        fruit.container.scale.set(3 - 2 * t) // 3 → 1

        if (t >= 1) {
          fruit.phase = 'playing'
          // AS3: play MovieBytes once (fire and forget — callback fires immediately after tween)
          if (fruit.player) {
            fruit.player.container.visible = true
            fruit.player.play({ fps: 30, repeatCount: 1 })
          }
        } else {
          allDone = false
        }
      }

      // All tweens complete → start shake
      if (allDone) {
        phaseRef.current = 'shake'
        phaseTimerRef.current = 0
      }
    }

    // Phase: shake — AS3 cardShake() 4-step micro-shake
    if (phaseRef.current === 'shake') {
      phaseTimerRef.current += dt

      // Find current shake step
      let currentOffset = { x: 0, y: 0 }
      for (let i = SHAKE_STEPS.length - 1; i >= 0; i--) {
        if (phaseTimerRef.current >= SHAKE_STEPS[i].delay) {
          currentOffset = SHAKE_STEPS[i]
          break
        }
      }
      onShakeRef.current?.(currentOffset.x, currentOffset.y)

      if (phaseTimerRef.current >= SHAKE_DURATION) {
        onShakeRef.current?.(0, 0) // reset
        phaseRef.current = 'delay'
        phaseTimerRef.current = 0
      }
    }

    // Phase: delay — 0.5s post-shake delay (AS3: delayCall2(callback, 0.5))
    if (phaseRef.current === 'delay') {
      phaseTimerRef.current += dt
      if (phaseTimerRef.current >= POST_SHAKE_DELAY) {
        phaseRef.current = 'done'
        onCompleteRef.current?.()
      }
    }
  })

  return <pixiContainer ref={containerRef} />
}
