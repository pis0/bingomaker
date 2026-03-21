import { useCallback, useEffect, useRef } from 'react'
import { Container, Sprite, BitmapText } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { COLS } from '../../engine/constants'
import type { Pattern } from '../../engine/Pattern'
import {
  DOT_CELL_W, DOT_CELL_H, DOT_OFFSET_X, DOT_OFFSET_Y,
  BG_ON_TEXTURES, BGON_OFFSET_X, BGON_OFFSET_Y,
  PATTERN_CYCLE_INTERVAL,
  MISSING_COLORS, BLINK_COLORS,
  MISSING_ANIM_INTERVAL, MISSING_ANIM_INTERVAL_SINGLE,
} from './payoutConstants'

extend({ Container, Sprite, BitmapText })

const DOT_COUNT = 15 // 3 rows x 5 cols

// --- Types ---

export type PayoutCardState = 'idle' | 'missing' | 'won'

export interface MissingInfo {
  cardIndex: number
  row: number
  col: number
  pattern: Pattern
}

interface Props {
  cardIndex: number
  patterns: Pattern[]
  stake: number
  state: PayoutCardState
  missings: MissingInfo[]
  winCount: number
  drawing?: boolean
  idleHighlighted?: boolean
  idlePattern?: Pattern | null
}

// BitmapFont names: prize-num (tinted), prize-label (tinted)

// --- Component ---

export default function PayoutCard({ cardIndex, patterns, stake, state, missings, winCount, drawing = false, idleHighlighted = false, idlePattern = null }: Props) {
  const labelFontRef = useRef('prize-num')
  const labelTintRef = useRef(0x1b1302)
  const countFontRef = useRef('prize-label')
  const countTintRef = useRef(0xfacb25)
  // Pattern cycling for idle animation
  const patternIndexRef = useRef(0)
  const cycleTimerRef = useRef(0)

  // Missing blink state
  const blinkOnRef = useRef(false)
  const blinkTimerRef = useRef(0)
  const missingAnimIndexRef = useRef(0)
  const missingAnimTimerRef = useRef(0)

  // Refs for mutable pixi objects
  const dotSpritesRef = useRef<Sprite[]>([])
  const bgIdleRef = useRef<Sprite | null>(null)
  const bgOnRef = useRef<Sprite | null>(null)
  const bgWonRef = useRef<Sprite | null>(null)
  const labelRef = useRef<BitmapText | null>(null)
  const countRef = useRef<BitmapText | null>(null)
  const textsContainerRef = useRef<Container | null>(null)

  const currentPattern = patterns[patternIndexRef.current % patterns.length]
  const prizeValue = currentPattern.group.getPayout(stake)

  // Get bg texture dimensions for centering text
  const bgTex = tex('prize1')
  const bgW = bgTex.width
  const bgH = bgTex.height

  // --- Update dot sprites for a pattern (AS3: uses prizedot1 image sprites) ---
  const updateDots = useCallback((pattern: Pattern, color: number, missingSlot?: { row: number; col: number }, missingColor?: number, blinkOn?: boolean) => {
    const sprites = dotSpritesRef.current
    if (sprites.length < DOT_COUNT) return
    for (let i = 0; i < DOT_COUNT; i++) {
      const sprite = sprites[i]
      if (!pattern.mask[i]) {
        sprite.visible = false
        continue
      }
      sprite.visible = true
      const col = i % COLS
      const row = Math.floor(i / COLS)

      let dotColor = color
      if (missingSlot && row === missingSlot.row && col === missingSlot.col) {
        dotColor = blinkOn ? BLINK_COLORS[1] : (missingColor ?? color)
      } else if (missingSlot) {
        dotColor = missingColor ?? color
      }

      sprite.tint = dotColor
    }
  }, [])

  // --- Format number with dots (1000 → 1.000) ---
  const formatNumber = useCallback((n: number): string => {
    return n.toLocaleString('pt-BR')
  }, [])

  // --- Update label position (centered below bg) ---
  const updateLabelPosition = useCallback(() => {
    const label = labelRef.current
    const countText = countRef.current
    if (!label) return

    // Auto-shrink label to fit (scale down if exceeds 55px)
    label.scale.set(1)
    if (label.width > 55) {
      label.scale.set(55 / label.width)
    }

    // Position count next to label with small gap
    if (countText && countText.visible) {
      countText.x = label.width + 1
      countText.y = 0
    }

    // Center texts container below bg
    // AS3: mCompTexts.x = bg.x+bg.width-mCompTexts.bounds.width >> 1
    // AS3: mCompTexts.y = bg.y + bg.height - 5
    const textsContainer = textsContainerRef.current
    if (textsContainer) {
      const totalW = textsContainer.width
      textsContainer.x = (bgW - totalW) >> 1
      textsContainer.y = bgH - 1
    }
  }, [bgW, bgH])

  // --- Tick handler for animations ---
  useTick((ticker) => {
    const dt = ticker.deltaMS

    if (state === 'idle' && !drawing) {
      if (idlePattern && idleHighlighted) {
        // Synced with IntervalCardPatternController — show the specific pattern from Menton
        updateDots(idlePattern, 0xffffff)
      } else if (patterns.length > 1) {
        // Fallback: cycle patterns independently (when not driven by controller)
        cycleTimerRef.current += dt
        if (cycleTimerRef.current >= PATTERN_CYCLE_INTERVAL) {
          cycleTimerRef.current = 0
          patternIndexRef.current = (patternIndexRef.current + 1) % patterns.length
          const pat = patterns[patternIndexRef.current]
          updateDots(pat, 0xffffff)
        }
      }
    }

    if (state === 'missing' && missings.length > 0) {
      // Blink the missing slot
      blinkTimerRef.current += dt
      if (blinkTimerRef.current >= 500) {
        blinkTimerRef.current = 0
        blinkOnRef.current = !blinkOnRef.current
      }

      // Cycle between multiple missings
      const interval = missings.length > 1 ? MISSING_ANIM_INTERVAL : MISSING_ANIM_INTERVAL_SINGLE
      missingAnimTimerRef.current += dt
      if (missingAnimTimerRef.current >= interval) {
        missingAnimTimerRef.current = 0
        missingAnimIndexRef.current = (missingAnimIndexRef.current + 1) % missings.length
      }

      const activeMissing = missings[missingAnimIndexRef.current % missings.length]
      updateDots(
        activeMissing.pattern,
        MISSING_COLORS[cardIndex],
        { row: activeMissing.row, col: activeMissing.col },
        MISSING_COLORS[cardIndex],
        blinkOnRef.current,
      )
    }
  })

  // --- Sync bg/label state when state prop changes ---
  useEffect(() => {
    const bgIdle = bgIdleRef.current
    const bgOn = bgOnRef.current
    const bgWon = bgWonRef.current
    const label = labelRef.current

    if (!bgIdle || !bgOn || !bgWon || !label) return

    if (state === 'idle') {
      bgIdle.visible = true
      bgOn.visible = idleHighlighted  // AS3: bgon cycles per card during idle
      bgWon.visible = false
      labelFontRef.current = 'prize-num'
      labelTintRef.current = 0x1b1302
      countFontRef.current = 'prize-label'
      countTintRef.current = 0xfacb25
      if (label) {
        label.style = { fontFamily: 'prize-num', fontSize: 14, fill: 0xffffff }
        label.tint = 0x1b1302
      }
      const ct = countRef.current
      if (ct) {
        ct.style = { fontFamily: 'prize-label', fontSize: 14, fill: 0xffffff }
        ct.tint = 0xfacb25
      }
      patternIndexRef.current = 0
      cycleTimerRef.current = 0
      blinkOnRef.current = false
      // Show the specific idle pattern if synced, otherwise first pattern
      updateDots(idleHighlighted && idlePattern ? idlePattern : patterns[0], 0xffffff)
    } else if (state === 'missing') {
      bgIdle.visible = false
      bgOn.visible = true
      bgWon.visible = false
      labelFontRef.current = 'prize-num'
      labelTintRef.current = 0x1b1302
      if (label) {
        label.style = { fontFamily: 'prize-num', fontSize: 14, fill: 0xffffff }
        label.tint = 0x1b1302
      }
      missingAnimIndexRef.current = 0
      missingAnimTimerRef.current = 0
    } else if (state === 'won') {
      // AS3: show(bg, bgonPrize); hide(bgon) — dots stay visible showing the won pattern
      bgIdle.visible = true
      bgOn.visible = false
      bgWon.visible = true
      labelFontRef.current = 'prize-num'
      labelTintRef.current = 0xd11919
      countFontRef.current = 'prize-label'
      countTintRef.current = 0xd11919
      if (label) {
        label.style = { fontFamily: 'prize-num', fontSize: 14, fill: 0xffffff }
        label.tint = 0xd11919
      }
      const ct = countRef.current
      if (ct) {
        ct.style = { fontFamily: 'prize-label', fontSize: 14, fill: 0xffffff }
        ct.tint = 0xd11919
      }
      // Show the won pattern dots (use first pattern, white tint like idle)
      updateDots(patterns[0], 0xffffff)
    }
  }, [state, patterns, updateDots, cardIndex, idleHighlighted, idlePattern])

  // --- Sync label text when stake/prize changes ---
  useEffect(() => {
    const label = labelRef.current
    if (!label) return
    label.text = formatNumber(prizeValue)
    updateLabelPosition()
  }, [prizeValue, formatNumber, updateLabelPosition])

  // --- Sync count text ---
  useEffect(() => {
    const countText = countRef.current
    if (!countText) return
    if (winCount >= 2) {
      countText.text = `(${winCount})`
      countText.visible = true
    } else {
      countText.text = ''
      countText.visible = false
    }
    updateLabelPosition()
  }, [winCount, updateLabelPosition])

  // --- Init dot sprites on mount ---
  const dotsContainerRef = useRef<Container | null>(null)
  const dotsInitializedRef = useRef(false)

  useEffect(() => {
    const container = dotsContainerRef.current
    if (!container || dotsInitializedRef.current) return
    dotsInitializedRef.current = true

    const dotTex = tex('prizedot1')
    const sprites: Sprite[] = []
    for (let i = 0; i < DOT_COUNT; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const sprite = new Sprite(dotTex)
      sprite.x = col * DOT_CELL_W + 1
      sprite.y = row * DOT_CELL_H
      sprite.visible = false
      container.addChild(sprite)
      sprites.push(sprite)
    }
    dotSpritesRef.current = sprites

    // Initial draw
    if (state === 'idle') {
      updateDots(patterns[patternIndexRef.current % patterns.length], 0xffffff)
    }
  }, [state, patterns, updateDots])

  return (
    <pixiContainer>
      {/* BG idle — prize1 */}
      <pixiSprite
        texture={tex('prize1')}
        ref={(ref: Sprite | null) => { bgIdleRef.current = ref }}
      />

      {/* BG on — prize2-7 (cycles per card in idle, always on in missing) */}
      <pixiSprite
        texture={tex(BG_ON_TEXTURES[cardIndex])}
        x={BGON_OFFSET_X}
        y={BGON_OFFSET_Y}
        visible={state === 'missing' || (state === 'idle' && idleHighlighted)}
        ref={(ref: Sprite | null) => { bgOnRef.current = ref }}
      />

      {/* BG won — prize_won */}
      <pixiSprite
        texture={tex('prize_won')}
        x={BGON_OFFSET_X}
        y={BGON_OFFSET_Y}
        visible={state === 'won'}
        ref={(ref: Sprite | null) => { bgWonRef.current = ref }}
      />

      {/* Dot grid — AS3: prizedot1 sprites with tint */}
      <pixiContainer
        x={DOT_OFFSET_X}
        y={DOT_OFFSET_Y}
        ref={(ref: Container | null) => { dotsContainerRef.current = ref }}
      />

      {/* Labels container */}
      <pixiContainer ref={(ref: Container | null) => { textsContainerRef.current = ref }}>
        <pixiBitmapText
          text={formatNumber(prizeValue)}
          style={{ fontFamily: labelFontRef.current, fontSize: 14, fill: 0xffffff }}
          tint={labelTintRef.current}
          ref={(ref: BitmapText | null) => {
            labelRef.current = ref
            if (ref) updateLabelPosition()
          }}
        />
        <pixiBitmapText
          text=""
          style={{ fontFamily: countFontRef.current, fontSize: 14, fill: 0xffffff }}
          tint={countTintRef.current}
          visible={false}
          ref={(ref: BitmapText | null) => { countRef.current = ref }}
        />
      </pixiContainer>
    </pixiContainer>
  )
}
