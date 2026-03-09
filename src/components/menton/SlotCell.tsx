import { useRef, useState, useMemo, useCallback } from 'react'
import { Graphics, Text, TextStyle, AnimatedSprite, Sprite, Texture } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import type { Card } from '../../engine/Card'
import { tex, textures as getTextures } from '../../assets/atlas'
import { SLOT_W, SLOT_H, COLORS } from './cardConstants'
import MissingMark from './MissingMark'

extend({ Graphics, Text, AnimatedSprite, Sprite })

// ── Shared resources (created once) ──────────────────────────
let markingFrames: Texture[] | null = null
function getMarkingFrames() {
  if (!markingFrames) markingFrames = getTextures('marking')
  return markingFrames
}

let _bellTex: Texture | null = null
function getBellTex() {
  if (!_bellTex) _bellTex = tex('cardbell4')
  return _bellTex
}

const FONT_FAMILY = '"Iowan Old Style Black", "Iowan Old Style", Georgia, serif'
const FONT_SIZE = 28

const styleDefault = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, fontWeight: 'bold',
  fill: COLORS.textDefault, letterSpacing: -1,
})
const styleMatched = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, fontWeight: 'bold',
  fill: COLORS.textMatched, letterSpacing: -1,
})
const styleInPattern = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, fontWeight: 'bold',
  fill: COLORS.textInPattern, letterSpacing: -1,
})
// AS3: setMark with intervalMark=true → MARKED_NUMBER_COLORS_BY_STAKE_INDEX[0]
const styleIdleHighlight = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, fontWeight: 'bold',
  fill: COLORS.textMatched, letterSpacing: -1, // 0x852f96
})

// ── Color interpolation (matching AS3 Slot.enterFrame) ───────
const CYCLE_LENGTH = 20 // frames per color transition
const RESTORE_LENGTH = 10 // frames to transition back to settled color (AS3: prepareRestore)
const CYCLE_DURATION_MS = 2500 // auto-restore after this (placeholder until overlay animations exist)

function lerpColor(c1: number, c2: number, t: number): number {
  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return (r << 16) | (g << 8) | b
}

// state: 0=cycling, 1=restoring, 2=done
interface CycleState {
  active: boolean
  state: number
  frame: number
  colorIndex: number
  c1: number
  c2: number
  colors: number[]
  startTime: number
}

// ── Component ────────────────────────────────────────────────
interface Props {
  card: Card
  row: number
  col: number
  x: number
  y: number
  hasBell?: boolean
  idleHighlighted?: boolean
}

export default function SlotCell({ card, row, col, x, y, hasBell, idleHighlighted = false }: Props) {
  const matched = card.matches[row][col]
  const inPattern = card.inPattern[row][col]
  const priority = card.patternPriority[row][col]
  const num = String(card.numbers[row][col])
  const holder = card.expectations[row][col]
  const isMissing = !matched && holder !== null
  const bellTex = useMemo(() => hasBell ? getBellTex() : null, [hasBell])

  // Track match state for animation triggers
  const wasMatched = useRef(false)
  const animRef = useRef<AnimatedSprite | null>(null)
  const isAnimating = useRef(false)
  const settleStart = useRef(0)
  // 0 = animation playing (white bg, default text)
  // 1 = text settled (white bg, matched text) — at ~0.2s
  // 2 = fully settled (matched bg + text) — when animation ends
  const [settlePhase, setSettlePhase] = useState(2)

  // Pattern color cycling state
  const bgRef = useRef<Graphics | null>(null)
  const cycleRef = useRef<CycleState>({ active: false, state: 0, frame: 0, colorIndex: 0, c1: 0, c2: 0, colors: [], startTime: 0 })
  const wasInPattern = useRef(false)

  // Detect new match → play marking animation
  if (matched && !wasMatched.current) {
    wasMatched.current = true
    isAnimating.current = true
    settleStart.current = performance.now()
    setSettlePhase(0)
    if (animRef.current) {
      animRef.current.visible = true
      animRef.current.gotoAndPlay(0)
    }
  }

  // Reset when card clears (new round)
  if (!matched && wasMatched.current) {
    wasMatched.current = false
    isAnimating.current = false
    setSettlePhase(2)
  }

  // Detect pattern start → init color cycling (AS3: saveParent)
  if (inPattern && matched && !wasInPattern.current) {
    wasInPattern.current = true
    const colors = COLORS.patternColors[priority]
    if (colors) {
      cycleRef.current = {
        active: true,
        state: 0,
        frame: 0,
        colorIndex: 0,
        c1: 0x000000, // AS3: NEW_PATTERN_MATCH_STARTING_COLOR
        c2: colors[0],
        colors,
        startTime: performance.now(),
      }
    }
  }

  // Reset cycling on new round
  if (!inPattern && wasInPattern.current) {
    wasInPattern.current = false
    cycleRef.current.active = false
  }

  // Tick: marking animation + pattern color cycling
  useTick(() => {
    // Marking animation phases
    if (isAnimating.current && animRef.current) {
      if (settlePhase < 1) {
        const elapsed = (performance.now() - settleStart.current) / 1000
        if (elapsed >= 0.2) setSettlePhase(1)
      }
      if (!animRef.current.playing) {
        isAnimating.current = false
        animRef.current.visible = false
        setSettlePhase(2)
      }
    }

    // Pattern color cycling + restore (AS3: Slot.enterFrame)
    const cycle = cycleRef.current
    if (cycle.active && bgRef.current && !isAnimating.current) {
      const g = bgRef.current

      if (cycle.state === 0) {
        // State 0: color cycling
        cycle.frame++
        if (cycle.frame >= CYCLE_LENGTH) {
          cycle.frame = 0
          cycle.c1 = cycle.colors[cycle.colorIndex]
          const nextIndex = (cycle.colorIndex + 1) % cycle.colors.length
          cycle.c2 = cycle.colors[nextIndex]
          cycle.colorIndex = nextIndex
        }
        const color = lerpColor(cycle.c1, cycle.c2, cycle.frame / CYCLE_LENGTH)
        g.clear()
        g.rect(0, 0, SLOT_W, SLOT_H)
        g.fill(color)

        // Auto-trigger restore after timeout (placeholder for overlay animation callback)
        if (performance.now() - cycle.startTime > CYCLE_DURATION_MS) {
          cycle.state = 1
          cycle.c1 = color // transition FROM current cycling color
          cycle.frame = 0
        }
      } else if (cycle.state === 1) {
        // State 1: restore — transition to settled color (AS3: prepareRestore)
        cycle.frame++
        const t = Math.min(cycle.frame / RESTORE_LENGTH, 1)
        const color = lerpColor(cycle.c1, COLORS.bgMatchedDark, t)
        g.clear()
        g.rect(0, 0, SLOT_W, SLOT_H)
        g.fill(color)

        if (cycle.frame >= RESTORE_LENGTH) {
          cycle.active = false
          cycle.state = 2
        }
      }
    }
  })

  // Determine visual state — keep default look while marking animation plays
  let bgColor: number
  let textStyle: TextStyle
  if (settlePhase < 2 && matched) {
    bgColor = COLORS.bgDefault
    textStyle = settlePhase >= 1 ? styleMatched : styleDefault
  } else if (inPattern && matched) {
    bgColor = COLORS.bgMatchedDark // fallback; cycling overrides via useTick
    textStyle = styleInPattern
  } else if (matched) {
    bgColor = COLORS.bgMatched
    textStyle = styleMatched
  } else if (idleHighlighted) {
    // AS3: setIntervalPattern → setMark(i,j,false,true) — purple bg + purple text
    bgColor = COLORS.bgMatched // 0x5b1f72
    textStyle = styleIdleHighlight
  } else {
    bgColor = COLORS.bgDefault
    textStyle = styleDefault
  }

  const drawBg = useCallback((g: Graphics) => {
    bgRef.current = g
    g.clear()
    g.rect(0, 0, SLOT_W, SLOT_H)
    g.fill(bgColor)
  }, [bgColor])

  const frames = useMemo(() => getMarkingFrames(), [])

  const onAnimCreated = useCallback((inst: AnimatedSprite | null) => {
    animRef.current = inst
    if (!inst) return
    inst.animationSpeed = 0.5 // 30fps at 60fps ticker
    inst.loop = false
    inst.visible = false
    inst.scale.set(1.02) // AS3: markAnima.scaleX/Y = 1.02
    if (isAnimating.current) {
      inst.visible = true
      inst.gotoAndPlay(0)
    }
  }, [])

  return (
    <pixiContainer x={x} y={y}>
      {/* Background quad */}
      <pixiGraphics draw={drawBg} />

      {/* Bell icon — hidden when slot is matched or idle-highlighted */}
      {bellTex && !matched && !idleHighlighted && (
        <pixiSprite
          texture={bellTex}
          x={10}
          y={3}
        />
      )}

      {/* Match marking animation (plays on new match) */}
      <pixiAnimatedSprite
        ref={onAnimCreated}
        textures={frames}
        x={0}
        y={0}
        width={SLOT_W}
        height={SLOT_H}
      />

      {/* Number text (hidden when missing mark is active) */}
      {!isMissing && (
        <pixiText
          text={num}
          style={textStyle}
          anchor={0.5}
          x={SLOT_W / 2 - 2}
          y={SLOT_H / 2 - 2}
        />
      )}

      {/* Missing-one overlay */}
      {isMissing && (
        <MissingMark
          holder={holder}
          ballNumber={card.numbers[row][col]}
          x={0}
          y={0}
        />
      )}

    </pixiContainer>
  )
}
