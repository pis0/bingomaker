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
import { Container, Graphics, Sprite, BitmapText } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { BUTTON_PANEL_X, BUTTON_PANEL_Y } from './layoutConstants'
import { STAKE_LEVELS } from '../../engine/constants'
import { playSFX } from '../../audio/AudioManager'
import { BUTTON_CLICK, BUTTON_STAKE } from '../../audio/SoundID'

extend({ Container, Graphics, Sprite, BitmapText })

// ── Layout (Composer-verified) ──────────────────────────────────
const STAKES_X = 21
const STAKES_Y = 13
const PLAY_X = 226
const PLAY_Y = 0
const END_X = 21
const END_Y = 10

// BitmapFont names: btn-play, btn-end, btn-bet (white, tinted), value-26 (stakes/tongue)

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
  font: string
  fontSize: number
  /** Text rect from Composer: x, y, w, h — text centered inside */
  textRect: { x: number; y: number; w: number; h: number }
  onPress?: () => void
}

function MentonButton({ prefix, x, y, label, on, visible = true, font, fontSize, textRect, onPress }: MentonButtonProps) {
  const idleTex = useMemo(() => tex(`${prefix}_idle`), [prefix])
  const hitTex = useMemo(() => tex(`${prefix}_hit`), [prefix])
  const offTex = useMemo(() => tex(`${prefix}_off`), [prefix])
  const spriteRef = useRef<Sprite>(null)
  const textRef = useRef<BitmapText>(null)
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
      <pixiBitmapText
        ref={textRef}
        text={label}
        style={{ fontFamily: font, fontSize, fill: 0xffffff }}
        tint={on ? 0xffffff : 0xbbbbbb}
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

  // Open tongue when stake changes; skip the next enabled→false (newRound fetch flicker)
  const prevStakeRef = useRef(stakeIndex)
  const skipNextDisableRef = useRef(false)
  useEffect(() => {
    if (stakeIndex !== prevStakeRef.current) {
      prevStakeRef.current = stakeIndex
      setTongueOpen(true)
      skipNextDisableRef.current = true
    }
  }, [stakeIndex])

  // Close tongue when phase leaves 'play' or Play is clicked (enabled→false)
  useEffect(() => {
    if (phase !== 'play') {
      setTongueOpen(false)
      skipNextDisableRef.current = false
    } else if (!enabled) {
      if (skipNextDisableRef.current) {
        skipNextDisableRef.current = false // consumed — don't skip next time (Play click)
      } else {
        setTongueOpen(false)
      }
    }
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
  const betLabelRef = useRef<BitmapText>(null)
  const betValueRef = useRef<BitmapText>(null)
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
    const nextStake = STAKE_LEVELS[next]
    if (BUTTON_STAKE[nextStake]) playSFX(BUTTON_STAKE[nextStake])
    onStakeChange?.(next)
  }, [state.stakeOn, stakeIndex, onStakeChange, betLabelCY, betValueCY])

  const handleStakeOut = useCallback(() => {
    if (!state.stakeOn) return
    if (betSpriteRef.current) betSpriteRef.current.texture = tex('btbet_idle')
    if (betLabelRef.current) betLabelRef.current.y = betLabelCY
    if (betValueRef.current) betValueRef.current.y = betValueCY
  }, [state.stakeOn, betLabelCY, betValueCY])

  const stakeColor = STAKE_COLORS[stakeIndex % STAKE_COLORS.length]

  return (
    <pixiContainer x={BUTTON_PANEL_X} y={BUTTON_PANEL_Y} zIndex={5}>
      {/* Tongue — slides behind bet button (AS3: mCompTotalPayout) */}
      <pixiContainer ref={tongueRef} x={STAKES_X + TONGUE_X} y={STAKES_Y + TONGUE_CLOSED_Y} visible={false}>
        <pixiGraphics draw={drawTongue} />
        <pixiContainer ref={useCallback((c: Container | null) => {
          if (!c) return
          // Recenter ficha+value pair in tongue after each render
          const fichaW = 29 // ficha78_sk scaled
          const gap = 4
          const textChild = c.children[1] as BitmapText | undefined
          const textW = textChild?.width ?? 20
          const totalW = fichaW + gap + textW
          c.x = (TONGUE_W - totalW) / 2
        }, [totalStake])}>
          <pixiSprite texture={tex('ficha78_sk')} y={TONGUE_H / 2 - 5} anchor={{ x: 0, y: 0.5 }} scale={FICHA_SCALE} eventMode="passive" />
          <pixiBitmapText
            text={String(totalStake)}
            style={{ fontFamily: 'value-26', fontSize: 26, fill: 0xffffff }}
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
        <pixiBitmapText
          ref={betLabelRef}
          text="BET"
          style={{ fontFamily: 'btn-bet', fontSize: 24, fill: 0xffffff }}
          tint={state.stakeOn ? 0xffffff : 0xbbbbbb}
          anchor={{ x: 0.5, y: 0.5 }}
          x={BET_TEXT_RECT.x + BET_TEXT_RECT.w / 2}
          y={betLabelCY}
          eventMode="passive"
        />
        <pixiBitmapText
          ref={betValueRef}
          text={String(STAKE_LEVELS[stakeIndex])}
          style={{ fontFamily: 'value-26', fontSize: 26, fill: 0xffffff }}
          tint={stakeColor}
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
        font="btn-end"
        fontSize={33}
        textRect={END_TEXT_RECT}
        onPress={() => { playSFX(BUTTON_CLICK); onEnd?.() }}
      />

      {/* Play button — Composer: text rect (0, 14, 281×70), fontSize 43 */}
      <MentonButton
        prefix="btplay"
        x={PLAY_X}
        y={PLAY_Y}
        label={label}
        on={state.playOn}
        visible={!showExtra}
        font="btn-play"
        fontSize={43}
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
        font="btn-play"
        fontSize={43}
        textRect={PLAY_TEXT_RECT}
        onPress={onExtra}
      />
    </pixiContainer>
  )
}
