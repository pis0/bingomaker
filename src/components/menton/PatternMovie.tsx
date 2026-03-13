import { useRef, useMemo, useCallback } from 'react'
import { AnimatedSprite, Container, Texture } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { textures as getTextures } from '../../assets/atlas'
import { X_O, Y_O, CELL_W, CELL_H } from './cardConstants'

extend({ AnimatedSprite, Container })

// ── Shared resources ──────────────────────────────────────
let liqHFrames: Texture[] | null = null
let liqColFrames: Texture[] | null = null

// AS3 uses duplicate frames (pairs) for each animation step — replicate for timing
function duplicateFrames(frames: Texture[]): Texture[] {
  const out: Texture[] = []
  for (const f of frames) out.push(f, f)
  return out
}

function getLiqHFrames() {
  if (!liqHFrames) liqHFrames = duplicateFrames(getTextures('liqu_horizontal'))
  return liqHFrames
}
function getLiqColFrames() {
  if (!liqColFrames) liqColFrames = duplicateFrames(getTextures('liqu_col'))
  return liqColFrames
}

// ── Types ─────────────────────────────────────────────────
type AnimType = 'line' | 'column'

interface AnimConfig {
  type: AnimType
  x: number
  y: number
  flip?: boolean
  isBigPrize?: boolean
}

interface Props {
  configs: AnimConfig[]
  onComplete: () => void
}

// ── Build animation configs from pattern name ─────────────
export function getPatternAnimConfigs(patternName: string): AnimConfig[] {
  const configs: AnimConfig[] = []

  switch (patternName) {
    // Lines
    case 'LINE_1':
      configs.push({ type: 'line', x: X_O - 2, y: Y_O })
      break
    case 'LINE_2':
      configs.push({ type: 'line', x: X_O - 2, y: Y_O + CELL_H })
      break
    case 'LINE_3':
      configs.push({ type: 'line', x: X_O - 2, y: Y_O + CELL_H * 2 })
      break

    // Double lines (isBigPrize)
    case 'DOUBLE_LINE_1':
      configs.push({ type: 'line', x: X_O - 2, y: Y_O + CELL_H, isBigPrize: true })
      configs.push({ type: 'line', x: X_O - 2, y: Y_O, isBigPrize: true })
      break
    case 'DOUBLE_LINE_2':
      configs.push({ type: 'line', x: X_O - 2, y: Y_O + CELL_H * 2, isBigPrize: true })
      configs.push({ type: 'line', x: X_O - 2, y: Y_O, isBigPrize: true })
      break
    case 'DOUBLE_LINE_3':
      configs.push({ type: 'line', x: X_O - 2, y: Y_O + CELL_H * 2, isBigPrize: true })
      configs.push({ type: 'line', x: X_O - 2, y: Y_O + CELL_H, isBigPrize: true })
      break

    // Double columns (alternating flip)
    case 'DOUBLE_COLUMN_1':
      configs.push({ type: 'column', x: X_O, y: Y_O })
      configs.push({ type: 'column', x: X_O + CELL_W, y: Y_O, flip: true })
      break
    case 'DOUBLE_COLUMN_2':
      configs.push({ type: 'column', x: X_O + CELL_W, y: Y_O })
      configs.push({ type: 'column', x: X_O + CELL_W * 2, y: Y_O, flip: true })
      break
    case 'DOUBLE_COLUMN_3':
      configs.push({ type: 'column', x: X_O + CELL_W * 2, y: Y_O })
      configs.push({ type: 'column', x: X_O + CELL_W * 3, y: Y_O, flip: true })
      break
    case 'DOUBLE_COLUMN_4':
      configs.push({ type: 'column', x: X_O + CELL_W * 3, y: Y_O })
      configs.push({ type: 'column', x: X_O + CELL_W * 4, y: Y_O, flip: true })
      break

    // Triple columns (isBigPrize, alternating flip)
    case 'TRIPLE_COLUMN_1':
      configs.push({ type: 'column', x: X_O + CELL_W * 2, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W, y: Y_O, flip: true, isBigPrize: true })
      configs.push({ type: 'column', x: X_O, y: Y_O, isBigPrize: true })
      break
    case 'TRIPLE_COLUMN_2':
      configs.push({ type: 'column', x: X_O + CELL_W * 3, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W * 2, y: Y_O, flip: true, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W, y: Y_O, isBigPrize: true })
      break
    case 'TRIPLE_COLUMN_3':
      configs.push({ type: 'column', x: X_O + CELL_W * 4, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W * 3, y: Y_O, flip: true, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W * 2, y: Y_O, isBigPrize: true })
      break

    // Quad columns (isBigPrize, alternating flip)
    case 'QUAD_COLUMN_1':
      configs.push({ type: 'column', x: X_O + CELL_W * 3, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W * 2, y: Y_O, flip: true, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O, y: Y_O, flip: true, isBigPrize: true })
      break
    case 'QUAD_COLUMN_2':
      configs.push({ type: 'column', x: X_O + CELL_W * 4, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W * 3, y: Y_O, flip: true, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W * 2, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W, y: Y_O, flip: true, isBigPrize: true })
      break
    case 'QUAD_COLUMN_3': // CAIXA DUPLA
      configs.push({ type: 'column', x: X_O + CELL_W * 4, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W * 3, y: Y_O, flip: true, isBigPrize: true })
      configs.push({ type: 'column', x: X_O + CELL_W, y: Y_O, isBigPrize: true })
      configs.push({ type: 'column', x: X_O, y: Y_O, flip: true, isBigPrize: true })
      break

    default:
      break
  }

  return configs
}

// ── Single liquid animation (chips now handled by ChipFlyAnimation) ──
interface LiquidAnimProps {
  config: AnimConfig
  onDone: () => void
}

function LiquidAnim({ config, onDone }: LiquidAnimProps) {
  const { type, x, y, flip, isBigPrize } = config
  const isLine = type === 'line'

  const frames = useMemo(() => isLine ? getLiqHFrames() : getLiqColFrames(), [isLine])

  const animRef = useRef<AnimatedSprite | null>(null)
  const phase = useRef<'liquid' | 'hold' | 'fadeout' | 'done'>('liquid')
  const holdStart = useRef(0)
  const fadeStart = useRef(0)

  const holdDuration = isBigPrize ? 1750 : 500

  const onAnimCreated = useCallback((inst: AnimatedSprite | null) => {
    animRef.current = inst
    if (!inst) return
    inst.animationSpeed = 0.4
    inst.loop = false
    inst.visible = true
    inst.gotoAndPlay(0)
    inst.onComplete = () => {
      inst.gotoAndStop(inst.totalFrames - 1)
      phase.current = 'hold'
      holdStart.current = performance.now()
    }
  }, [])

  useTick(() => {
    const now = performance.now()

    if (phase.current === 'hold') {
      if (now - holdStart.current > holdDuration) {
        phase.current = 'fadeout'
        fadeStart.current = now
      }
    } else if (phase.current === 'fadeout') {
      const t = Math.min((now - fadeStart.current) / 500, 1)
      if (animRef.current) animRef.current.alpha = 1 - t
      if (t >= 1) {
        phase.current = 'done'
        onDone()
      }
    }
  })

  const scaleY = flip ? -1.025 : 1.025
  const liqY = flip ? (isLine ? 0 : frames[frames.length - 1]?.height ?? 130) : 0

  return (
    <pixiContainer x={x} y={y} alpha={0.9}>
      <pixiAnimatedSprite
        ref={onAnimCreated}
        textures={frames}
        x={0}
        y={liqY}
        scale={{ x: isLine ? 1.05 : 1, y: isLine ? 1 : scaleY }}
      />
    </pixiContainer>
  )
}

// ── Main component: renders all liquid anims for a pattern ──
export default function PatternMovie({ configs, onComplete }: Props) {
  const doneCount = useRef(0)

  const handleDone = useCallback(() => {
    doneCount.current++
    // Complete when at least one anim finishes (AS3 behavior — callback fires from first)
    if (doneCount.current === 1) {
      onComplete()
    }
  }, [onComplete])

  if (configs.length === 0) return null

  return (
    <pixiContainer>
      {configs.map((cfg, i) => (
        <LiquidAnim key={i} config={cfg} onDone={handleDone} />
      ))}
    </pixiContainer>
  )
}
