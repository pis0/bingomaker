/**
 * JackpotPanel — displays progressive jackpot value.
 *
 * AS3: com.assukar.praia.menton.components.jackpot.JackpotPanel
 * Composer runtime (relative to JackpotPanel at 540,130):
 *   prizejack: x:50 y:50 (158×75)
 *   "JACKPOT": x:50 y:50 w:158 h:30 fontSize:16 center white
 *   pContainer: x:~81 y:~101 (centered in AREA{50,90,158,40})
 *     ficha57_sk: scale:0.75 → 28.5×27.75
 *     value label: fontSize:35 bold 0xd5cdaa, after coin + gap
 *
 * Value container layout: [coin][2px gap][value text]
 * - Centered horizontally within prizejack background (158px)
 * - Auto-scale uniform (scaleX=scaleY) when exceeding max width
 * - Counter animation: 1s tween from old value to new
 */
import { useRef, useEffect, useCallback } from 'react'
import { Container, BitmapText, Ticker } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { JACKPOT_PANEL_X, JACKPOT_PANEL_Y } from './layoutConstants'

extend({ Container, BitmapText })

// Internal offset — AS3 children base at (50, 50)
const BASE_X = 50
const BASE_Y = 50

// prizejack dimensions
const BG_W = 158
const BG_H = 75

// AREA rect for value display (AS3: Rectangle(50, 90, 158, 40))
const AREA_X = 50
const AREA_Y = 90
const AREA_W = 158
const AREA_H = 40

// Max width for value container before auto-scaling
// Leave ~10px margin on each side within AREA_W
const MAX_CONTAINER_W = AREA_W - 20

// Coin: ficha57_sk at scale 0.75 → 28.5 × 27.75
const COIN_SCALE = 0.75
const COIN_W = 38 * COIN_SCALE  // 28.5
const COIN_H = 37 * COIN_SCALE  // 27.75

// Gap between coin right edge and value text left edge
const COIN_TEXT_GAP = 2

// Value text x within pContainer (after coin + gap)
const VALUE_X = COIN_W + COIN_TEXT_GAP

// BitmapFont names: 'jackpot-title' (white 16px), 'jackpot-sub' (brown 16px), 'jackpot-value' (tan 35px)

function formatNumber(n: number): string {
  return Math.floor(n).toLocaleString('pt-BR')
}

interface Props {
  value?: number
  active?: boolean
  ballsToJackpot?: number
  oneToWin?: boolean
}

export default function JackpotPanel({ value = 5000, active = true, ballsToJackpot = 30, oneToWin = false }: Props) {
  const valueTextRef = useRef<BitmapText>(null)
  const pContainerRef = useRef<Container>(null)
  const prevValueRef = useRef(value)
  const displayValueRef = useRef(value)

  // Fit and center the value container:
  // 1. Reset scale to 1
  // 2. Measure natural width (coin + gap + text)
  // 3. If exceeds MAX_CONTAINER_W, scale down uniformly
  // 4. Center horizontally within AREA, vertically at AREA center
  const fitAndCenter = useCallback(() => {
    const container = pContainerRef.current
    const textNode = valueTextRef.current
    if (!container || !textNode || textNode.width === 0) return

    // Reset scale to measure natural size
    container.scale.set(1)

    // Natural width = coin + gap + text width
    const naturalW = VALUE_X + textNode.width

    // Auto-scale if exceeds max
    if (naturalW > MAX_CONTAINER_W) {
      const s = MAX_CONTAINER_W / naturalW
      container.scale.set(s)
    }

    // Scaled width for centering
    const scaledW = naturalW * container.scale.x

    // Center horizontally within AREA (prizejack background)
    container.x = AREA_X + (AREA_W - scaledW) / 2
    // Center vertically within AREA
    container.y = AREA_Y + AREA_H / 2 - 4
  }, [])

  // Recenter on first frame (text needs one frame to measure)
  const needsFit = useRef(true)
  useTick(() => {
    if (needsFit.current) {
      fitAndCenter()
      if (pContainerRef.current && valueTextRef.current?.width) {
        needsFit.current = false
      }
    }
  })

  // Counter animation: tween from old to new over 1s
  useEffect(() => {
    const textNode = valueTextRef.current
    if (!textNode) return

    const oldValue = prevValueRef.current
    const newValue = value
    prevValueRef.current = newValue

    if (newValue <= oldValue) {
      displayValueRef.current = newValue
      textNode.text = formatNumber(newValue)
      needsFit.current = true
      return
    }

    const startValue = displayValueRef.current
    let elapsed = 0
    const ticker = Ticker.shared
    const onTick = () => {
      elapsed += ticker.deltaMS / 1000
      const t = Math.min(1, elapsed / 1)
      displayValueRef.current = startValue + (newValue - startValue) * t
      textNode.text = formatNumber(displayValueRef.current)
      fitAndCenter()
      if (t >= 1) ticker.remove(onTick)
    }
    ticker.add(onTick)
    return () => { ticker.remove(onTick) }
  }, [value, fitAndCenter])

  return (
    <pixiContainer x={JACKPOT_PANEL_X} y={JACKPOT_PANEL_Y}>
      {/* prizejack background */}
      <pixiSprite texture={tex('prizejack')} x={BASE_X} y={BASE_Y} />

      {/* prizejack_on glow — oneToWin state */}
      {oneToWin && (
        <pixiSprite texture={tex('prizejack_on')} x={BASE_X} y={BASE_Y} />
      )}

      {/* "JACKPOT" title — centered in bg, vCenter in 30px box */}
      {active && (
        <pixiBitmapText
          text="JACKPOT"
          style={{ fontFamily: 'jackpot-title', fontSize: 16, fill: 0xffffff }}
          anchor={{ x: 0.5, y: 0.5 }}
          x={BASE_X + BG_W / 2}
          y={BASE_Y + 15}
        />
      )}

      {/* "UNTIL BALL X" — shown when inactive */}
      {!active && (
        <pixiBitmapText
          text={`ATÉ BOLA ${ballsToJackpot}`}
          style={{ fontFamily: 'jackpot-sub', fontSize: 16, fill: 0x4e2b0d }}
          anchor={{ x: 0.5, y: 0.5 }}
          x={BASE_X + BG_W / 2}
          y={BASE_Y + 15}
        />
      )}

      {/* Value container: [coin][gap][text] — auto-scaled and centered */}
      <pixiContainer
        ref={pContainerRef}
        alpha={active ? 1.0 : 0.4}
      >
        {/* ficha57_sk — anchor 0.5, positioned so left edge = 0 */}
        <pixiSprite
          texture={tex('ficha57_sk')}
          anchor={0.5}
          scale={COIN_SCALE}
          x={COIN_W / 2}
          y={0}
        />
        {/* Value text — starts after coin right edge + gap, vCenter aligned with coin */}
        <pixiBitmapText
          ref={valueTextRef}
          text={formatNumber(value)}
          style={{ fontFamily: 'jackpot-value', fontSize: 35, fill: 0xd5cdaa }}
          anchor={{ x: 0, y: 0.5 }}
          x={VALUE_X}
          y={0}
        />
      </pixiContainer>
    </pixiContainer>
  )
}
