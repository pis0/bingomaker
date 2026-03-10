import { useRef, useEffect } from 'react'
import { Container, Assets, Spritesheet, Texture, Ticker } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { loadMovieBytes } from '../../animations/loadMovieBytes'
import { MovieBytesPlayer } from '../../animations/MovieBytesPlayer'
import { ParticleEmitter } from '../../particles/ParticleEmitter'
import { mentonPipoqueiraBbl } from '../../particles/configs/menton_pipoqueira_bbl'
import { mentonChipXplosion } from '../../particles/configs/menton_chip_xplosion'
import { mentonLemonXplosion } from '../../particles/configs/menton_lemon_xplosion'

extend({ Container })

const BINGO_BYTES_URL = '/assets/menton/movies/bingo.bytes'
const MOVIE_SCALE = 0.5

// Starting positions per card index (AS3 CardPanel.animaBingo)
const CARD_POSITIONS = [
  { x: -209, y: -340 }, // card 0 (top-left)
  { x: 128, y: -340 },  // card 1 (top-right)
  { x: -209, y: -167 }, // card 2 (bottom-left)
  { x: 128, y: -167 },  // card 3 (bottom-right)
]
const CENTER = { x: -70, y: -247 }

// Timing (AS3: delayCall 1s, tween 1s, particles at 1.85s after play starts)
const DELAY_MS = 1000
const TWEEN_MS = 1000
const PARTICLES_DELAY_MS = 1850

// AS3 BingoMovie particle positions (relative to BingoMovie container)
const BUBBLES_POS = { x: 377, y: 460 }
const CHIP_POS = { x: 380, y: 180 }
const LEMON_POS = { x: 367, y: 200 }

type Phase = 'idle' | 'delay' | 'tween' | 'playing'

/** Resolve texture name from bingo atlas or main atlas */
function getTexture(name: string): Texture {
  const bingoSheet = Assets.get<Spritesheet>('menton_bingo')
  if (bingoSheet?.textures[name]) return bingoSheet.textures[name]
  const mainSheet = Assets.get<Spritesheet>('menton0')
  if (mainSheet?.textures[name]) return mainSheet.textures[name]
  console.warn(`[BingoMovie] texture "${name}" not found`)
  return Texture.EMPTY
}

interface Props {
  /** Which card triggered bingo (0-3), or null when inactive */
  cardIndex: number | null
  onHideCards?: () => void
  onShowCards?: () => void
  onComplete?: () => void
}

export default function BingoMovie({ cardIndex, onHideCards, onShowCards, onComplete }: Props) {
  const containerRef = useRef<Container>(null)
  const playerRef = useRef<MovieBytesPlayer | null>(null)
  const phaseRef = useRef<Phase>('idle')
  const timerRef = useRef(0)
  const playTimerRef = useRef(0)
  const particlesStartedRef = useRef(false)
  const tweenFromRef = useRef({ x: 0, y: 0 })
  const readyRef = useRef(false)

  // Particle emitters
  const bubblesRef = useRef<ParticleEmitter | null>(null)
  const chipRef = useRef<ParticleEmitter | null>(null)
  const lemonRef = useRef<ParticleEmitter | null>(null)

  // Stable callback refs to avoid stale closures in tick
  const cbRef = useRef({ onHideCards, onShowCards, onComplete })
  useEffect(() => {
    cbRef.current = { onHideCards, onShowCards, onComplete }
  })

  // Track last triggered cardIndex to detect new triggers
  const activeCardRef = useRef<number | null>(null)

  // Load bytes + create particle emitters on mount
  useEffect(() => {
    let disposed = false
    loadMovieBytes(BINGO_BYTES_URL).then((data) => {
      if (disposed) return
      const player = new MovieBytesPlayer(data, getTexture, { scale: MOVIE_SCALE, checkIndex: true })
      playerRef.current = player
      if (containerRef.current) {
        containerRef.current.addChild(player.container)
      }

      // Create particle emitters
      const bubblesTex = Assets.get<Texture>('menton_pipoqueira_bbl') ?? Texture.WHITE
      const chipTex = Assets.get<Texture>('menton_chip_xplosion') ?? Texture.WHITE
      const lemonTex = Assets.get<Texture>('menton_lemon_xplosion') ?? Texture.WHITE

      bubblesRef.current = new ParticleEmitter(mentonPipoqueiraBbl, bubblesTex)
      chipRef.current = new ParticleEmitter(mentonChipXplosion, chipTex)
      lemonRef.current = new ParticleEmitter(mentonLemonXplosion, lemonTex)

      if (containerRef.current) {
        containerRef.current.addChild(bubblesRef.current.container)
        containerRef.current.addChild(chipRef.current.container)
        containerRef.current.addChild(lemonRef.current.container)
      }

      readyRef.current = true
    })
    return () => {
      disposed = true
      playerRef.current?.destroy()
      playerRef.current = null
      bubblesRef.current?.destroy()
      chipRef.current?.destroy()
      lemonRef.current?.destroy()
      bubblesRef.current = chipRef.current = lemonRef.current = null
    }
  }, [])

  const stopParticles = () => {
    bubblesRef.current?.stop()
    chipRef.current?.stop()
    lemonRef.current?.stop()
    particlesStartedRef.current = false
  }

  const startParticles = () => {
    const bubbles = bubblesRef.current
    const chip = chipRef.current
    const lemon = lemonRef.current
    if (!bubbles || !chip || !lemon) return

    // AS3 BingoMovie.startAnimation overrides at t=1.85s
    // Particle positions are absolute in BingoMovie space (no movieScale applied)
    bubbles.emitterX = BUBBLES_POS.x
    bubbles.emitterY = BUBBLES_POS.y
    bubbles.emitterXVariance = 170
    bubbles.lifespan = 0.7
    bubbles.lifespanVariance = 0.5
    bubbles.emitterYVariance = 50
    bubbles.start(Ticker.shared)

    chip.emitterX = CHIP_POS.x
    chip.emitterY = CHIP_POS.y
    chip.emitterXVariance = 250
    chip.start(Ticker.shared)

    lemon.emitterX = LEMON_POS.x
    lemon.emitterY = LEMON_POS.y
    lemon.emitterXVariance = 250
    lemon.start(Ticker.shared)

    particlesStartedRef.current = true
  }

  useTick((ticker) => {
    const player = playerRef.current
    if (!player || !readyRef.current) return

    // Detect new trigger (cardIndex changed from null to a number)
    if (cardIndex !== null && activeCardRef.current === null && phaseRef.current === 'idle') {
      activeCardRef.current = cardIndex
      phaseRef.current = 'delay'
      timerRef.current = 0
      playTimerRef.current = 0
      particlesStartedRef.current = false
      const pos = CARD_POSITIONS[cardIndex] ?? CARD_POSITIONS[0]
      tweenFromRef.current = { x: pos.x, y: pos.y }
    }

    const root = containerRef.current

    // Reset when cardIndex goes null while still running
    if (cardIndex === null && phaseRef.current !== 'idle') {
      player.stop()
      if (root) root.visible = false
      stopParticles()
      phaseRef.current = 'idle'
      timerRef.current = 0
      playTimerRef.current = 0
      activeCardRef.current = null
      return
    }

    if (cardIndex === null) {
      activeCardRef.current = null
      return
    }

    const dt = ticker.deltaMS

    if (phaseRef.current === 'delay') {
      timerRef.current += dt
      if (timerRef.current >= DELAY_MS) {
        // Show animation at card position, hide cards
        if (root) {
          root.visible = true
          root.x = tweenFromRef.current.x
          root.y = tweenFromRef.current.y
        }
        player.reset()
        cbRef.current.onHideCards?.()
        phaseRef.current = 'tween'
        timerRef.current = 0
      }
    } else if (phaseRef.current === 'tween') {
      timerRef.current += dt
      const t = Math.min(timerRef.current / TWEEN_MS, 1)
      const fx = tweenFromRef.current.x
      const fy = tweenFromRef.current.y
      if (root) {
        root.x = fx + (CENTER.x - fx) * t
        root.y = fy + (CENTER.y - fy) * t
      }
      if (t >= 1) {
        phaseRef.current = 'playing'
        playTimerRef.current = 0
        player.play({
          fps: 30,
          repeatCount: 1,
          onComplete: () => {
            if (root) root.visible = false
            stopParticles()
            phaseRef.current = 'idle'
            timerRef.current = 0
            playTimerRef.current = 0
            cbRef.current.onShowCards?.()
            cbRef.current.onComplete?.()
          },
        })
      }
    } else if (phaseRef.current === 'playing') {
      playTimerRef.current += dt
      // Start particles at 1.85s after play begins (AS3: juggler.delayCall 1.85)
      if (!particlesStartedRef.current && playTimerRef.current >= PARTICLES_DELAY_MS) {
        startParticles()
      }
    }
  })

  return <pixiContainer ref={containerRef} visible={false} />
}
