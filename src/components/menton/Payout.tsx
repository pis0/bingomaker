/**
 * Payout display — shows accumulated winnings with coin icon + label.
 *
 * AS3: com.assukar.praia.menton.components.buttons.payout.Payout
 *      com.assukar.praia.menton.components.buttons.payout.BgPayout
 *
 * Backgrounds: payout (OFF), payout_on (ON), payout_glow (WIN blink)
 * Coin icon: ficha78_sk (scale 0.75) from commons atlas
 * Label: Myriad Pro Semibold, fontSize 43, white / yellow on tween
 *
 * Composer runtime:
 *   [Payout] x:525 y:10 (inside ButtonPanel x:7 y:712) → absolute 532,722
 *   ficha78_sk: x:0 y:0 scale:0.75 (39×37) relative to content container
 *   label: x:42 y:-15 fontSize:43 bold autoSize:horizontal
 *   Container centered via align(): x = bg.w/2 - cw/2, y = bg.h/2 - ch/2 + 12
 *
 * BgPayout blink modes (from AS3):
 *   blinkWonMoney(): toggle GLOW↔ON every 0.2s for 0.4s, triggered on payout increase
 *   blinkCollectMoney(): continuous toggle GLOW↔ON every 0.1s, during chip fly
 */
import { useRef, useState, useEffect, useCallback } from 'react'
import { Container, Sprite, Text } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { PAYOUT_X, PAYOUT_Y, PAYOUT_W, PAYOUT_H } from './layoutConstants'

extend({ Container, Sprite, Text })

// AS3: BgPayout texture names
const BG_OFF = 'payout'
const BG_ON = 'payout_on'
const BG_GLOW = 'payout_glow'

// AS3: LABEL_COLORS — [0] white normal, [1] yellow on tween
const COLOR_NORMAL = 0xffffff
const COLOR_TWEEN = 0xfdfaa6

// Coin icon — AS3: scale 0.75 → 39×37
const COIN_SCALE = 0.75
const COIN_H = 37

// Label position relative to coin — Composer: x:42
const LABEL_OFFSET_X = 42

// AS3: Payout.align() — y offset +12
const ALIGN_Y_OFFSET = 12
// AS3: container spans y[-15..45] = height 60 (Starling TextField fixed h:60, vAlign:center)
const AS3_CONTAINER_H = 60

// Composer: fontName "Myriad Pro Light", bold, fontSize 43
const FONT_FAMILY = '"Myriad Pro", Arial, sans-serif'
const FONT_SIZE = 43

// AS3: blinkWonMoney — 0.2s interval, 0.4s duration
// Extended to 1.2s until chip fly animation provides the longer collecting blink
const WON_BLINK_INTERVAL = 200
const WON_BLINK_DURATION = 1200
// AS3: blinkCollectMoney — 0.1s interval, continuous
const COLLECT_BLINK_INTERVAL = 100

// Content padding inside bg
const PADDING = 8

// Format number with dots — AS3: TextUtils.formatNumber
function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

interface Props {
  value: number
  tween?: boolean
  collecting?: boolean
}

export default function Payout({ value, tween = false, collecting = false }: Props) {
  // BgPayout state
  const [bgTexture, setBgTexture] = useState(BG_OFF)

  // Tween animation state
  const [tweenAlpha, setTweenAlpha] = useState(1)
  const tweenActiveRef = useRef(false)
  const tweenTimeRef = useRef(0)

  // Won blink — internal, triggered by value increase
  const prevValueRef = useRef(0)
  const wonBlinkRef = useRef(false)
  const wonTimerRef = useRef(0)
  const blinkTimerRef = useRef(0)
  const blinkToggleRef = useRef(false)

  // Detect payout increase → trigger won blink (AS3: blinkWonMoney)
  if (value > prevValueRef.current && value > 0) {
    prevValueRef.current = value
    wonBlinkRef.current = true
    wonTimerRef.current = 0
    blinkTimerRef.current = 0
    blinkToggleRef.current = false
    setBgTexture(BG_GLOW) // Start glow immediately — AS3: blinkCollectMoney(true)
  }
  if (value === 0) {
    prevValueRef.current = 0
    wonBlinkRef.current = false
  }

  // Handle tween trigger
  useEffect(() => {
    if (tween && value > 0) {
      tweenActiveRef.current = true
      tweenTimeRef.current = 0
      setTweenAlpha(0)
    }
  }, [tween, value])

  // Handle collecting mode start/stop
  useEffect(() => {
    if (collecting) {
      wonBlinkRef.current = false // collecting overrides won blink
      blinkTimerRef.current = 0
      blinkToggleRef.current = false
      setBgTexture(BG_GLOW)
    } else if (value > 0) {
      setBgTexture(BG_ON)
    }
  }, [collecting, value])

  useTick((ticker) => {
    // Won blink — brief GLOW↔ON toggle (AS3: blinkWonMoney, 0.2s for 0.4s)
    if (wonBlinkRef.current && !collecting) {
      wonTimerRef.current += ticker.deltaMS
      blinkTimerRef.current += ticker.deltaMS

      if (wonTimerRef.current >= WON_BLINK_DURATION) {
        wonBlinkRef.current = false
        setBgTexture(BG_ON)
      } else if (blinkTimerRef.current >= WON_BLINK_INTERVAL) {
        blinkTimerRef.current = 0
        blinkToggleRef.current = !blinkToggleRef.current
        setBgTexture(blinkToggleRef.current ? BG_ON : BG_GLOW)
      }
    }

    // Collecting blink — continuous fast GLOW↔ON (AS3: blinkCollectMoney, 0.1s)
    if (collecting) {
      blinkTimerRef.current += ticker.deltaMS
      if (blinkTimerRef.current >= COLLECT_BLINK_INTERVAL) {
        blinkTimerRef.current = 0
        blinkToggleRef.current = !blinkToggleRef.current
        setBgTexture(blinkToggleRef.current ? BG_ON : BG_GLOW)
      }
    }

    // Tween alpha animation (AS3: label alpha 0→1 over 0.8s)
    if (tweenActiveRef.current) {
      tweenTimeRef.current += ticker.deltaMS
      const progress = Math.min(tweenTimeRef.current / 800, 1)
      setTweenAlpha(progress)
      if (progress >= 1) {
        tweenActiveRef.current = false
      }
    }
  })

  // Base bg state — OFF when no value, ON when value > 0
  useEffect(() => {
    if (value === 0) {
      setBgTexture(BG_OFF)
    } else if (!collecting && !wonBlinkRef.current) {
      setBgTexture(BG_ON)
    }
  }, [value, collecting])

  const labelColor = (tween && tweenActiveRef.current) ? COLOR_TWEEN : COLOR_NORMAL
  const displayAlpha = tween ? tweenAlpha : 1
  const labelText = value > 0 ? formatNumber(value) : ''

  // Dynamic centering — AS3: Payout.align()
  const contentContainerRef = useRef<Container>(null)
  const [containerPos, setContainerPos] = useState({ x: 0, y: 0 })
  const [contentScale, setContentScale] = useState(1)

  const updateAlign = useCallback(() => {
    const c = contentContainerRef.current
    if (!c) return
    // Measure at scale 1 to get true content size
    c.scale.set(1)
    const bounds = c.getLocalBounds()
    const maxW = PAYOUT_W - PADDING * 2
    // Scale down if content wider than available area
    const scale = bounds.width > maxW ? maxW / bounds.width : 1
    const scaledW = bounds.width * scale
    // X: center scaled content
    const cx = Math.floor(PAYOUT_W / 2 - scaledW / 2 - bounds.x * scale)
    // Y: match AS3 align() — Starling TextField has fixed h:60 (vAlign:center)
    const cy = Math.floor(PAYOUT_H / 2 - AS3_CONTAINER_H / 2 + ALIGN_Y_OFFSET)
    setContentScale(scale)
    setContainerPos({ x: cx, y: cy })
  }, [])

  // Re-align when value changes
  useEffect(() => {
    if (value > 0) {
      requestAnimationFrame(updateAlign)
    }
  }, [value, updateAlign])

  return (
    <pixiContainer x={PAYOUT_X} y={PAYOUT_Y}>
      {/* BgPayout */}
      <pixiSprite texture={tex(bgTexture)} x={0} y={0} />

      {/* Content: coin + label, centered via align() */}
      {value > 0 && (
        <pixiContainer
          ref={contentContainerRef}
          x={containerPos.x}
          y={containerPos.y}
          scale={contentScale}
          alpha={displayAlpha}
        >
          <pixiSprite
            texture={tex('ficha78_sk')}
            x={0}
            y={0}
            scale={COIN_SCALE}
          />
          <pixiText
            text={labelText}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE,
              fill: labelColor,
              fontWeight: '600',
            }}
            anchor={{ x: 0, y: 0.5 }}
            x={LABEL_OFFSET_X}
            y={Math.round(COIN_H / 2)}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  )
}
