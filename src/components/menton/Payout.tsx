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
 *   blinkCollectMoney(): continuous toggle GLOW↔ON every 0.1s, during collection
 *
 * Collection animation (AS3: AutoCollector):
 *   Value decrements from current → 0 in loops, blinking during decrement.
 *   After collection: idle shows lastPayout (previous round's win).
 *   Blank when no payout at all.
 */
import { useRef, useState, useEffect, useCallback } from 'react'
import { Container, Sprite, BitmapText } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { PAYOUT_X, PAYOUT_Y, PAYOUT_W, PAYOUT_H } from './layoutConstants'
import { playSFX } from '../../audio/AudioManager'
import { COINS_COLLECT } from '../../audio/SoundID'

extend({ Container, Sprite, BitmapText })

// AS3: BgPayout texture names
const BG_OFF = 'payout'
const BG_ON = 'payout_on'
const BG_GLOW = 'payout_glow'

// BitmapFont name: 'payout' (white base, tinted yellow on win blink)

// Coin icon — AS3: scale 0.75 → 39×37
const COIN_SCALE = 0.75
const COIN_H = 37

// Label position relative to coin — Composer: x:42
const LABEL_OFFSET_X = 46

// AS3: Payout.align() — y offset +12
const ALIGN_Y_OFFSET = 12
// AS3: container spans y[-15..45] = height 60 (Starling TextField fixed h:60, vAlign:center)
const AS3_CONTAINER_H = 60

const FONT_SIZE = 43

// AS3: blinkWonMoney — 0.2s interval, ~1.6s duration (4 full cycles GLOW↔ON)
const WON_BLINK_INTERVAL = 200
const WON_BLINK_DURATION = 1600
// AS3: blinkCollectMoney — 0.1s interval, continuous
const COLLECT_BLINK_INTERVAL = 100

// AS3: AutoCollector timing
const COLLECTION_TIME_BASE = 80
const MIN_INTERVAL = 33 // ms
const MIN_LOOPS = 12

// Content padding inside bg
const PADDING = 8

// Format number with dots — AS3: TextUtils.formatNumber
function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

interface Props {
  value: number
  stake?: number
  lastPayout?: number
  tween?: boolean
  collecting?: boolean
}

export default function Payout({ value, stake = 1, lastPayout = 0, tween = false, collecting = false }: Props) {
  // BgPayout state — initialized from props to avoid flicker on key-based remount
  const initialBg = (value > 0 || lastPayout > 0) ? BG_ON : BG_OFF
  const [bgTexture, setBgTexture] = useState(initialBg)
  const bgSpriteRef = useRef<Sprite>(null)
  const bgTextureRef = useRef(initialBg)
  const setBgTextureImperative = useCallback((name: string) => {
    if (name === bgTextureRef.current) return
    bgTextureRef.current = name
    if (bgSpriteRef.current) bgSpriteRef.current.texture = tex(name)
  }, [])

  // Tween animation state — alpha driven imperatively to avoid per-frame re-renders
  const [, setTweenAlpha] = useState(1)
  const tweenAlphaRef = useRef(1)
  const contentRef = useRef<Container>(null)
  const tweenActiveRef = useRef(false)
  const tweenTimeRef = useRef(0)

  // Won blink — internal, triggered by value increase
  const prevValueRef = useRef(0)
  const wonBlinkRef = useRef(false)
  const wonTimerRef = useRef(0)
  const blinkTimerRef = useRef(0)
  const blinkToggleRef = useRef(false)

  // Collection decrement animation state
  const collectRef = useRef({
    active: false,
    startValue: 0,
    remaining: 0,
    loops: 0,
    loopsLeft: 0,
    perLoop: 0,
    perLoopRemainder: 0,
    interval: 0,
    elapsed: 0,
    done: false, // decrement finished, showing "last win" fade
  })

  // Displayed value — either real value, decrementing value, or lastPayout
  const [displayValue, setDisplayValue] = useState(0)

  // Detect payout increase → trigger won blink (AS3: blinkWonMoney)
  useEffect(() => {
    if (value > prevValueRef.current && value > 0) {
      prevValueRef.current = value
      wonBlinkRef.current = true
      wonTimerRef.current = 0
      blinkTimerRef.current = 0
      blinkToggleRef.current = false
      setBgTexture(BG_GLOW)
      setBgTextureImperative(BG_GLOW)
    }
    if (value === 0 && !collecting && !collectRef.current.active) {
      prevValueRef.current = 0
      wonBlinkRef.current = false
    }
  }, [value, collecting, setBgTextureImperative])

  // Handle tween trigger
  useEffect(() => {
    if (tween && value > 0) {
      tweenActiveRef.current = true
      tweenTimeRef.current = 0
      setTweenAlpha(0)
    }
  }, [tween, value])

  // Start/stop collection decrement
  useEffect(() => {
    const c = collectRef.current
    if (collecting && value > 0 && !c.active) {
      // AS3: AutoCollector — compute loops and interval
      const ratio = Math.max(value / stake, 1)
      const time = Math.round(COLLECTION_TIME_BASE * Math.pow(ratio, 0.67))
      const objects = value
      let intervalLength = Math.floor(time / objects)
      if (intervalLength < MIN_INTERVAL) intervalLength = MIN_INTERVAL
      let loops = Math.floor(time / intervalLength)
      if (loops < MIN_LOOPS) loops = MIN_LOOPS

      const perLoop = Math.floor(objects / loops)
      const remainder = objects % loops

      // AS3: Sounds.ME.playFx(SoundID.COINS_COLLECT) + stopFx after loops*interval
      const stopFn = playSFX(COINS_COLLECT, { volume: 0.5 })
      const duration = loops * intervalLength
      if (stopFn) setTimeout(stopFn, duration)

      c.active = true
      c.startValue = value
      c.remaining = value
      c.loops = loops
      c.loopsLeft = loops
      c.perLoop = perLoop
      c.perLoopRemainder = remainder
      c.interval = intervalLength
      c.elapsed = 0
      c.done = false

      wonBlinkRef.current = false
      blinkTimerRef.current = 0
      blinkToggleRef.current = false
      setBgTexture(BG_GLOW)
      setDisplayValue(value)
    } else if (collecting && value <= 0) {
      // Collecting but no value — just blink
      blinkTimerRef.current = 0
      blinkToggleRef.current = false
      setBgTexture(BG_GLOW)
    } else if (!collecting) {
      const wasActive = c.active
      c.active = false
      if (wasActive) {
        // Collection ended externally (new round) — clean up
        c.done = false
        setDisplayValue(0)
      }
    }
  }, [collecting, value, stake])

  useTick((ticker) => {
    const c = collectRef.current

    // ── Collection decrement ──
    if (c.active && !c.done) {
      c.elapsed += ticker.deltaMS
      if (c.elapsed >= c.interval && c.loopsLeft > 0) {
        c.elapsed = 0
        let step = c.perLoop
        if (c.perLoopRemainder > 0) {
          step += 1
          c.perLoopRemainder--
        }
        c.remaining = Math.max(0, c.remaining - step)
        c.loopsLeft--
        setDisplayValue(c.remaining)

        if (c.remaining <= 0 || c.loopsLeft <= 0) {
          // Decrement done → show "last win" fade in
          c.done = true
          c.remaining = 0
          setDisplayValue(c.startValue) // Show last won value
          setBgTexture(BG_ON)
          // Trigger fade-in tween for last win display
          tweenActiveRef.current = true
          tweenTimeRef.current = 0
          setTweenAlpha(0)
        }
      }

      // Collect blink during decrement (0.1s toggle)
      if (!c.done) {
        blinkTimerRef.current += ticker.deltaMS
        if (blinkTimerRef.current >= COLLECT_BLINK_INTERVAL) {
          blinkTimerRef.current = 0
          blinkToggleRef.current = !blinkToggleRef.current
          setBgTextureImperative(blinkToggleRef.current ? BG_ON : BG_GLOW)
        }
      }
      return // Skip other blink logic during collection
    }

    // ── Won blink — brief GLOW↔ON toggle (0.2s for 0.4s) ──
    if (wonBlinkRef.current && !collecting) {
      wonTimerRef.current += ticker.deltaMS
      blinkTimerRef.current += ticker.deltaMS

      if (wonTimerRef.current >= WON_BLINK_DURATION) {
        wonBlinkRef.current = false
        setBgTextureImperative(BG_ON)
      } else if (blinkTimerRef.current >= WON_BLINK_INTERVAL) {
        blinkTimerRef.current = 0
        blinkToggleRef.current = !blinkToggleRef.current
        setBgTextureImperative(blinkToggleRef.current ? BG_ON : BG_GLOW)
      }
    }

    // ── Chip fly collecting blink (no decrement, just blink) ──
    if (collecting && !c.active) {
      blinkTimerRef.current += ticker.deltaMS
      if (blinkTimerRef.current >= COLLECT_BLINK_INTERVAL) {
        blinkTimerRef.current = 0
        blinkToggleRef.current = !blinkToggleRef.current
        setBgTextureImperative(blinkToggleRef.current ? BG_ON : BG_GLOW)
      }
    }

    // ── Tween alpha animation (label alpha 0→1 over 0.8s) ──
    if (tweenActiveRef.current) {
      tweenTimeRef.current += ticker.deltaMS
      const progress = Math.min(tweenTimeRef.current / 800, 1)
      tweenAlphaRef.current = progress
      if (contentRef.current) contentRef.current.alpha = progress
      if (progress >= 1) {
        tweenActiveRef.current = false
      }
    }
  })

  // Sync displayValue with value when not collecting
  useEffect(() => {
    if (!collecting && !collectRef.current.active && !collectRef.current.done) {
      setDisplayValue(value)
    }
  }, [value, collecting])

  // Base bg state
  useEffect(() => {
    if (!collecting && !collectRef.current.active) {
      if (value === 0 && lastPayout === 0) {
        setBgTexture(BG_OFF)
      } else if (value > 0 && !wonBlinkRef.current) {
        setBgTexture(BG_ON)
      } else if (value === 0 && lastPayout > 0) {
        setBgTexture(BG_ON)
      }
    }
  }, [value, collecting, lastPayout])

  // Determine what to show
  const c = collectRef.current
  const showValue = c.active
    ? displayValue  // decrementing or "last win" fade
    : value > 0
      ? value       // active round payout
      : lastPayout  // idle: previous round's win (0 = blank)

  const labelFont = 'payout'
  const labelFill = tweenActiveRef.current ? 0xfdfaa6 : 0xffffff
  const displayAlpha = tweenActiveRef.current ? tweenAlphaRef.current : 1
  const labelText = showValue > 0 ? formatNumber(showValue) : ''

  // Dynamic centering — AS3: Payout.align()
  const contentContainerRef = useRef<Container>(null)
  const [containerPos, setContainerPos] = useState({ x: 0, y: 0 })
  const [contentScale, setContentScale] = useState(1)

  const [contentVisible, setContentVisible] = useState(false)

  const updateAlign = useCallback(() => {
    const cont = contentContainerRef.current
    if (!cont) return
    cont.scale.set(1)
    const bounds = cont.getLocalBounds()
    const maxW = PAYOUT_W - PADDING * 2
    const scale = bounds.width > maxW ? maxW / bounds.width : 1
    const scaledW = bounds.width * scale
    const cx = Math.floor(PAYOUT_W / 2 - scaledW / 2 - bounds.x * scale)
    const cy = Math.floor(PAYOUT_H / 2 - AS3_CONTAINER_H / 2 + ALIGN_Y_OFFSET)
    setContentScale(scale)
    setContainerPos({ x: cx, y: cy })
    setContentVisible(true)
  }, [])

  // Re-align when displayed value changes; hide until centered
  useEffect(() => {
    let rafId: number | undefined
    if (showValue > 0) {
      setContentVisible(false)
      rafId = requestAnimationFrame(updateAlign)
    } else {
      setContentVisible(false)
    }
    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId)
    }
  }, [showValue, updateAlign])

  return (
    <pixiContainer x={PAYOUT_X} y={PAYOUT_Y}>
      {/* BgPayout */}
      <pixiSprite ref={bgSpriteRef} texture={tex(bgTexture)} x={0} y={0} />

      {/* Content: coin + label, centered via align() */}
      {showValue > 0 && (
        <pixiContainer
          ref={(node: Container | null) => { contentContainerRef.current = node; contentRef.current = node }}
          x={containerPos.x}
          y={containerPos.y}
          scale={contentScale}
          alpha={displayAlpha}
          visible={contentVisible}
        >
          <pixiSprite
            texture={tex('ficha78_sk')}
            x={0}
            y={0}
            scale={COIN_SCALE}
          />
          <pixiBitmapText
            text={labelText}
            style={{ fontFamily: labelFont, fontSize: FONT_SIZE, fill: 0xffffff }}
            tint={labelFill}
            anchor={{ x: 0, y: 0.5 }}
            x={LABEL_OFFSET_X}
            y={Math.round(COIN_H / 2)}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  )
}
