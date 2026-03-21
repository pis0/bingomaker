import { useRef, useState, useMemo, useCallback } from 'react'
import { Graphics, BitmapText, AnimatedSprite, Sprite, Texture } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import type { Card } from '../../engine/Card'
import { tex, textures as getTextures } from '../../assets/atlas'
import { SLOT_W, SLOT_H, COLORS } from './cardConstants'
import MissingMark from './MissingMark'

extend({ Graphics, Text, BitmapText, AnimatedSprite, Sprite })

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

const FONT_SIZE = 28
// BitmapFont: single 'slot' font (white) — color via tint prop

// ── Color interpolation (matching AS3 Slot.enterFrame) ───────
const CYCLE_DURATION_FRAMES = 20 // AS3: 20 frames per color transition at 60fps
const CYCLE_LENGTH_MS = CYCLE_DURATION_FRAMES / 60 * 1000 // → ms
const RESTORE_FRAMES = 10 // AS3: 10 frames to transition back at 60fps
const RESTORE_LENGTH_MS = RESTORE_FRAMES / 60 * 1000 // → ms
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
  elapsed: number // ms accumulated within current transition
  colorIndex: number
  c1: number
  c2: number
  colors: number[]
  startTime: number
}

// ── Component ────────────────────────────────────────────────
// AS3: blinkMarkExtra — white↔purple toggle at 0.1s, ~3 cycles (6 toggles)
const BLINK_INTERVAL = 100
const BLINK_TOGGLES = 6

interface Props {
  card: Card
  row: number
  col: number
  x: number
  y: number
  zIndex?: number
  hasBell?: boolean
  idleHighlighted?: boolean
  shouldBlink?: boolean
}

export default function SlotCell({ card, row, col, x, y, zIndex, hasBell, idleHighlighted = false, shouldBlink = false }: Props) {
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

  // blinkMarkExtra state (AS3: white↔purple toggle after marking, extras only)
  const blinkActiveRef = useRef(false)
  const blinkTimerRef = useRef(0)
  const blinkCountRef = useRef(0)
  const blinkWhiteRef = useRef(false)

  // Pattern color cycling state
  const bgRef = useRef<Graphics | null>(null)
  const cycleRef = useRef<CycleState>({ active: false, state: 0, elapsed: 0, colorIndex: 0, c1: 0, c2: 0, colors: [], startTime: 0 })
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
    blinkActiveRef.current = false
    // Hide marking animation sprite (may be mid-play showing a purple frame)
    if (animRef.current) {
      animRef.current.visible = false
      animRef.current.stop()
    }
    // Force bg repaint — useTick may have painted purple that drawBg won't clear
    // (bgColor might be unchanged: bgDefault during animation → bgDefault on reset)
    if (bgRef.current) {
      bgRef.current.clear()
      bgRef.current.rect(0, 0, SLOT_W, SLOT_H)
      bgRef.current.fill(COLORS.bgDefault)
    }
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
        elapsed: 0,
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
  useTick((ticker) => {
    // Marking animation phases
    if (isAnimating.current && animRef.current) {
      if (settlePhase < 1) {
        const elapsed = (performance.now() - settleStart.current) / 1000
        if (elapsed >= 0.2) setSettlePhase(1)
      }
      if (!animRef.current.playing) {
        // Paint purple bg BEFORE hiding animation to avoid 1-frame white flash
        if (bgRef.current) {
          bgRef.current.clear()
          bgRef.current.rect(0, 0, SLOT_W, SLOT_H)
          bgRef.current.fill(COLORS.bgMatched)
        }
        isAnimating.current = false
        animRef.current.visible = false
        // Start blinkMarkExtra if in extra/super phase
        if (shouldBlink) {
          blinkActiveRef.current = true
          blinkTimerRef.current = 0
          blinkCountRef.current = 0
          blinkWhiteRef.current = false
        }
        setSettlePhase(2)
      }
    }

    // blinkMarkExtra — white↔purple toggle (AS3: extras/super extras only)
    if (blinkActiveRef.current && bgRef.current) {
      blinkTimerRef.current += ticker.deltaMS
      if (blinkTimerRef.current >= BLINK_INTERVAL) {
        blinkTimerRef.current = 0
        blinkCountRef.current++
        if (blinkCountRef.current >= BLINK_TOGGLES) {
          // Settle on purple
          blinkActiveRef.current = false
          bgRef.current.clear()
          bgRef.current.rect(0, 0, SLOT_W, SLOT_H)
          bgRef.current.fill(COLORS.bgMatched)
        } else {
          blinkWhiteRef.current = !blinkWhiteRef.current
          const color = blinkWhiteRef.current ? COLORS.bgDefault : COLORS.bgMatched
          bgRef.current.clear()
          bgRef.current.rect(0, 0, SLOT_W, SLOT_H)
          bgRef.current.fill(color)
        }
      }
    }

    // Pattern color cycling + restore (AS3: Slot.enterFrame)
    const cycle = cycleRef.current
    if (cycle.active && bgRef.current && !isAnimating.current) {
      const g = bgRef.current

      if (cycle.state === 0) {
        // State 0: color cycling (time-based)
        cycle.elapsed += ticker.deltaMS
        if (cycle.elapsed >= CYCLE_LENGTH_MS) {
          cycle.elapsed = 0
          cycle.c1 = cycle.colors[cycle.colorIndex]
          const nextIndex = (cycle.colorIndex + 1) % cycle.colors.length
          cycle.c2 = cycle.colors[nextIndex]
          cycle.colorIndex = nextIndex
        }
        const color = lerpColor(cycle.c1, cycle.c2, cycle.elapsed / CYCLE_LENGTH_MS)
        g.clear()
        g.rect(0, 0, SLOT_W, SLOT_H)
        g.fill(color)

        // Auto-trigger restore after timeout (placeholder for overlay animation callback)
        if (performance.now() - cycle.startTime > CYCLE_DURATION_MS) {
          cycle.state = 1
          cycle.c1 = color // transition FROM current cycling color
          cycle.elapsed = 0
        }
      } else if (cycle.state === 1) {
        // State 1: restore — transition to settled color (AS3: prepareRestore)
        cycle.elapsed += ticker.deltaMS
        const t = Math.min(cycle.elapsed / RESTORE_LENGTH_MS, 1)
        const color = lerpColor(cycle.c1, COLORS.bgMatchedDark, t)
        g.clear()
        g.rect(0, 0, SLOT_W, SLOT_H)
        g.fill(color)

        if (cycle.elapsed >= RESTORE_LENGTH_MS) {
          cycle.active = false
          cycle.state = 2
        }
      }
    }
  })

  // Determine visual state — keep default look while marking animation plays
  let bgColor: number
  let bitmapTint: number
  if (settlePhase < 2 && matched) {
    bgColor = COLORS.bgDefault
    bitmapTint = settlePhase >= 1 ? 0x852f96 : 0x332d11
  } else if (inPattern && matched) {
    bgColor = COLORS.bgMatchedDark // fallback; cycling overrides via useTick
    bitmapTint = 0x5b1f72
  } else if (matched) {
    bgColor = COLORS.bgMatched
    bitmapTint = 0x852f96
  } else if (idleHighlighted) {
    bgColor = COLORS.bgMatched
    bitmapTint = 0x852f96
  } else {
    bgColor = COLORS.bgDefault
    bitmapTint = 0x332d11
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
    <pixiContainer x={x} y={y} zIndex={zIndex}>
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

      {/* Number text — BitmapText for GPU performance (60 instances on screen) */}
      {!isMissing && (
        <pixiBitmapText
          text={num}
          style={{ fontFamily: 'slot', fontSize: FONT_SIZE, fill: 0xffffff }}
          tint={bitmapTint}
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
