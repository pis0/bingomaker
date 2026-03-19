/**
 * ButtonPanel — Play/Extra/End/Stakes buttons.
 *
 * AS3: com.assukar.praia.menton.components.buttons.ButtonPanel
 * Position: x:7, y:712 in Menton space (Composer-verified)
 *
 * All text positions and font sizes verified via Composer MCP inspection
 * of AssukarTextField instances in the AS3 runtime.
 */
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { BUTTON_PANEL_X, BUTTON_PANEL_Y } from './layoutConstants'
import { STAKE_LEVELS } from '../../engine/constants'

extend({ Container, Graphics, Sprite, Text })

// ── Layout (Composer-verified) ──────────────────────────────────
const STAKES_X = 21
const STAKES_Y = 13
const PLAY_X = 226
const PLAY_Y = 0
const END_X = 21
const END_Y = 10

// ── Font (Composer-verified sizes) ──────────────────────────────
const BUTTON_FONT = '"Clarendon Black BT", Georgia, serif'
const IOWAN_FONT = '"Iowan Old Style Black", Georgia, serif'
const COLOR_ON = 0xffffff
const COLOR_OFF = 0xbbbbbb

// PLAY/EXTRA: AS3 fontSize 43 — reduced for Canvas text parity
// PLAY/EXTRA: Composer fontSize 43
const playStyle = new TextStyle({ fontFamily: BUTTON_FONT, fontSize: 43, fill: COLOR_ON })
const playOffStyle = new TextStyle({ fontFamily: BUTTON_FONT, fontSize: 43, fill: COLOR_OFF })

// END: Composer fontSize 33
const endStyle = new TextStyle({ fontFamily: BUTTON_FONT, fontSize: 33, fill: COLOR_ON })
const endOffStyle = new TextStyle({ fontFamily: BUTTON_FONT, fontSize: 33, fill: COLOR_OFF })

// BET: Composer fontSize 24
const betStyle = new TextStyle({ fontFamily: BUTTON_FONT, fontSize: 24, fill: COLOR_ON })
const betOffStyle = new TextStyle({ fontFamily: BUTTON_FONT, fontSize: 24, fill: COLOR_OFF })

// AS3: STAKE_COLORS per stake index
const STAKE_COLORS = [0x6AB22F, 0xB1AA03, 0xCF499D, 0x66736F, 0x4781CD, 0xd5cdaa, 0x80128F, 0xffffff]

// Total payout tongue (AS3: mCompTotalPayout)
const TONGUE_X = 20
const TONGUE_CLOSED_Y = 25   // behind btn center (fully covered by 93px-tall btbet)
const TONGUE_OPEN_Y = -21    // visible above btn (~30% less)
const TONGUE_W = 135
const TONGUE_H = 50
const TONGUE_RADIUS = 15
const TONGUE_COLOR = 0x471043
const TONGUE_TWEEN_MS = 500
const FICHA_SCALE = 0.57 // ficha43_sk(29px) / ficha78_sk(50px)

const tonguePriceStyle = new TextStyle({ fontFamily: IOWAN_FONT, fontSize: 26, fill: 0xffffff })

/** Button phase — determines label text and which button is visible */
export type ButtonPhase = 'play' | 'halt' | 'peel' | 'extra' | 'super'

const PHASE_LABELS: Record<ButtonPhase, string> = {
  play: 'PLAY',
  halt: 'NEXT',
  peel: 'PEEL',
  extra: 'EXTRA',
  super: 'SUPER',
}

function phaseToState(phase: ButtonPhase, enabled: boolean) {
  const showExtra = phase === 'extra' || phase === 'super'
  const showEnd = phase === 'extra' || phase === 'super' || phase === 'peel'
  return {
    playOn: !showExtra && enabled,
    extraOn: showExtra && enabled,
    endOn: showEnd && enabled,
    stakeOn: phase === 'play' && enabled,
  }
}

// ── Shared button sub-component ─────────────────────────────────
interface MentonButtonProps {
  prefix: string
  x: number
  y: number
  label: string
  on: boolean
  visible?: boolean
  labelStyle: TextStyle
  labelOffStyle: TextStyle
  /** Text rect from Composer: x, y, w, h — text centered inside */
  textRect: { x: number; y: number; w: number; h: number }
  onPress?: () => void
}

function MentonButton({ prefix, x, y, label, on, visible = true, labelStyle, labelOffStyle, textRect, onPress }: MentonButtonProps) {
  const idleTex = useMemo(() => tex(`${prefix}_idle`), [prefix])
  const hitTex = useMemo(() => tex(`${prefix}_hit`), [prefix])
  const offTex = useMemo(() => tex(`${prefix}_off`), [prefix])
  const spriteRef = useRef<Sprite>(null)
  const textRef = useRef<Text>(null)
  const labelCenterY = textRect.y + textRect.h / 2

  const handleDown = useCallback(() => {
    if (!on) return
    if (spriteRef.current) spriteRef.current.texture = hitTex
    if (textRef.current) textRef.current.y = labelCenterY + 5
  }, [on, hitTex, labelCenterY])

  const handleUp = useCallback(() => {
    if (!on) return
    if (spriteRef.current) spriteRef.current.texture = idleTex
    if (textRef.current) textRef.current.y = labelCenterY
    onPress?.()
  }, [on, idleTex, labelCenterY, onPress])

  const handleOut = useCallback(() => {
    if (!on) return
    if (spriteRef.current) spriteRef.current.texture = idleTex
    if (textRef.current) textRef.current.y = labelCenterY
  }, [on, idleTex, labelCenterY])

  if (!visible) return null

  return (
    <pixiContainer x={x} y={y} eventMode={on ? 'static' : 'none'} cursor={on ? 'pointer' : 'default'} onPointerDown={handleDown} onPointerUp={handleUp} onPointerUpOutside={handleOut}>
      <pixiSprite ref={spriteRef} texture={on ? idleTex : offTex} eventMode="passive" />
      <pixiText
        ref={textRef}
        text={label}
        style={on ? labelStyle : labelOffStyle}
        anchor={{ x: 0.5, y: 0.5 }}
        x={textRect.x + textRect.w / 2}
        y={labelCenterY}
        eventMode="passive"
      />
    </pixiContainer>
  )
}

// ── Text rects (Composer-verified) ──────────────────────────────
// Play/Extra: AssukarTextField at (0, 14, 281, 70)
const PLAY_TEXT_RECT = { x: 0, y: 14, w: 281, h: 70 }
// End: AssukarTextField at (9, -5, 163, 100)
const END_TEXT_RECT = { x: 9, y: -5, w: 163, h: 100 }
// BET: AssukarTextField at (7, 35, 164, 46)
const BET_TEXT_RECT = { x: 7, y: 35, w: 164, h: 46 }
// Stake value: AssukarTextField at (62, -1, 55, 55)
const VALUE_TEXT_RECT = { x: 62, y: -1, w: 55, h: 55 }

// ── Main ButtonPanel ────────────────────────────────────────────
interface Props {
  phase: ButtonPhase
  enabled: boolean
  stakeIndex: number
  /** Force-show End button (even outside extra/super/peel) */
  showEnd?: boolean
  onPlay?: () => void
  onExtra?: () => void
  onEnd?: () => void
  onStakeChange?: (newIndex: number) => void
}

export default function ButtonPanel({ phase, enabled, stakeIndex, showEnd: forceShowEnd = false, onPlay, onExtra, onEnd, onStakeChange }: Props) {
  const state = phaseToState(phase, enabled)
  const label = PHASE_LABELS[phase]
  const showExtra = phase === 'extra' || phase === 'super'

  // Tongue animation (total payout tab behind bet button)
  const tongueRef = useRef<Container>(null)
  const tongueAnimRef = useRef({ t0: 0, from: 0, to: 0, active: false })
  const [tongueOpen, setTongueOpen] = useState(false)

  // Open tongue when stake changes, close when phase leaves 'play'
  const prevStakeRef = useRef(stakeIndex)
  useEffect(() => {
    if (stakeIndex !== prevStakeRef.current) {
      prevStakeRef.current = stakeIndex
      setTongueOpen(true)
    }
  }, [stakeIndex])

  // Close tongue when round starts (phase leaves 'play' or button disables)
  useEffect(() => {
    if (phase !== 'play' || !enabled) setTongueOpen(false)
  }, [phase, enabled])

  // Tween tongue position
  useEffect(() => {
    const tongue = tongueRef.current
    if (!tongue) return
    if (tongueOpen) {
      // Show + slide up
      tongue.visible = true
      const a = tongueAnimRef.current
      a.from = tongue.y
      a.to = TONGUE_OPEN_Y
      a.t0 = performance.now()
      a.active = true
    } else {
      // Slide down + hide when done
      const a = tongueAnimRef.current
      a.from = tongue.y
      a.to = TONGUE_CLOSED_Y
      a.t0 = performance.now()
      a.active = true
    }
  }, [tongueOpen])

  const totalStake = STAKE_LEVELS[stakeIndex] * 4

  // Tongue tween per-frame
  useTick(() => {
    const a = tongueAnimRef.current
    if (!a.active || !tongueRef.current) return
    const t = Math.min(1, (performance.now() - a.t0) / TONGUE_TWEEN_MS)
    const eased = tongueOpen
      ? 1 - (1 - t) ** 3 // easeOutCubic
      : t * t * t          // easeInCubic
    tongueRef.current.y = a.from + (a.to - a.from) * eased
    if (t >= 1) {
      a.active = false
      // Hide when closing completes
      if (!tongueOpen) tongueRef.current.visible = false
    }
  })

  // Draw tongue rounded rect
  const drawTongue = useCallback((g: Graphics) => {
    g.clear()
    g.roundRect(0, 0, TONGUE_W, TONGUE_H, TONGUE_RADIUS)
    g.fill(TONGUE_COLOR)
  }, [])

  const betSpriteRef = useRef<Sprite>(null)
  const betLabelRef = useRef<Text>(null)
  const betValueRef = useRef<Text>(null)
  const betLabelCY = BET_TEXT_RECT.y + BET_TEXT_RECT.h / 2
  const betValueCY = VALUE_TEXT_RECT.y + VALUE_TEXT_RECT.h / 2
  const betHitTex = useMemo(() => tex('btbet_hit'), [])

  const handleStakeDown = useCallback(() => {
    if (!state.stakeOn) return
    if (betSpriteRef.current) betSpriteRef.current.texture = betHitTex
    if (betLabelRef.current) betLabelRef.current.y = betLabelCY + 5
    if (betValueRef.current) betValueRef.current.y = betValueCY + 5
  }, [state.stakeOn, betHitTex, betLabelCY, betValueCY])

  const handleStakeUp = useCallback(() => {
    if (!state.stakeOn) return
    if (betSpriteRef.current) betSpriteRef.current.texture = tex('btbet_idle')
    if (betLabelRef.current) betLabelRef.current.y = betLabelCY
    if (betValueRef.current) betValueRef.current.y = betValueCY
    const next = (stakeIndex + 1) % STAKE_LEVELS.length
    onStakeChange?.(next)
  }, [state.stakeOn, stakeIndex, onStakeChange, betLabelCY, betValueCY])

  const handleStakeOut = useCallback(() => {
    if (!state.stakeOn) return
    if (betSpriteRef.current) betSpriteRef.current.texture = tex('btbet_idle')
    if (betLabelRef.current) betLabelRef.current.y = betLabelCY
    if (betValueRef.current) betValueRef.current.y = betValueCY
  }, [state.stakeOn, betLabelCY, betValueCY])

  const stakeColor = STAKE_COLORS[stakeIndex % STAKE_COLORS.length]
  const stakeValStyle = useMemo(() => new TextStyle({
    fontFamily: IOWAN_FONT,
    fontSize: 26,
    fill: stakeColor,
  }), [stakeColor])

  return (
    <pixiContainer x={BUTTON_PANEL_X} y={BUTTON_PANEL_Y}>
      {/* Tongue — slides behind bet button (AS3: mCompTotalPayout) */}
      <pixiContainer ref={tongueRef} x={STAKES_X + TONGUE_X} y={STAKES_Y + TONGUE_CLOSED_Y} visible={false}>
        <pixiGraphics draw={drawTongue} />
        <pixiContainer ref={useCallback((c: Container | null) => {
          if (!c) return
          // Recenter ficha+value pair in tongue after each render
          const fichaW = 29 // ficha78_sk scaled
          const gap = 4
          const textChild = c.children[1] as Text | undefined
          const textW = textChild?.width ?? 20
          const totalW = fichaW + gap + textW
          c.x = (TONGUE_W - totalW) / 2
        }, [totalStake])}>
          <pixiSprite texture={tex('ficha78_sk')} y={TONGUE_H / 2 - 5} anchor={{ x: 0, y: 0.5 }} scale={FICHA_SCALE} eventMode="passive" />
          <pixiText
            text={String(totalStake)}
            style={tonguePriceStyle}
            anchor={{ x: 0, y: 0.5 }}
            x={33}
            y={TONGUE_H / 2 - 5}
            eventMode="passive"
          />
        </pixiContainer>
      </pixiContainer>

      {/* Stakes/Bet button */}
      <pixiContainer x={STAKES_X} y={STAKES_Y} eventMode={state.stakeOn ? 'static' : 'none'} cursor={state.stakeOn ? 'pointer' : 'default'} onPointerDown={handleStakeDown} onPointerUp={handleStakeUp} onPointerUpOutside={handleStakeOut}>
        <pixiSprite ref={betSpriteRef} texture={state.stakeOn ? tex('btbet_idle') : tex('btbet_off')} eventMode="passive" />
        <pixiText
          ref={betLabelRef}
          text="BET"
          style={state.stakeOn ? betStyle : betOffStyle}
          anchor={{ x: 0.5, y: 0.5 }}
          x={BET_TEXT_RECT.x + BET_TEXT_RECT.w / 2}
          y={betLabelCY}
          eventMode="passive"
        />
        <pixiText
          ref={betValueRef}
          text={String(STAKE_LEVELS[stakeIndex])}
          style={stakeValStyle}
          anchor={{ x: 0.5, y: 0.5 }}
          x={VALUE_TEXT_RECT.x + VALUE_TEXT_RECT.w / 2}
          y={betValueCY}
          eventMode="passive"
        />
      </pixiContainer>

      {/* End button — Composer: text rect (9, -5, 163×100), fontSize 33 */}
      <MentonButton
        prefix="btend"
        x={END_X}
        y={END_Y}
        label="END"
        on={state.endOn || forceShowEnd}
        visible={phase === 'extra' || phase === 'super' || phase === 'peel' || forceShowEnd}
        labelStyle={endStyle}
        labelOffStyle={endOffStyle}
        textRect={END_TEXT_RECT}
        onPress={onEnd}
      />

      {/* Play button — Composer: text rect (0, 14, 281×70), fontSize 43 */}
      <MentonButton
        prefix="btplay"
        x={PLAY_X}
        y={PLAY_Y}
        label={label}
        on={state.playOn}
        visible={!showExtra}
        labelStyle={playStyle}
        labelOffStyle={playOffStyle}
        textRect={PLAY_TEXT_RECT}
        onPress={onPlay}
      />

      {/* Extra button — same text rect as Play */}
      <MentonButton
        prefix="btextra"
        x={PLAY_X}
        y={PLAY_Y}
        label={label}
        on={state.extraOn}
        visible={showExtra}
        labelStyle={playStyle}
        labelOffStyle={playOffStyle}
        textRect={PLAY_TEXT_RECT}
        onPress={onExtra}
      />
    </pixiContainer>
  )
}
