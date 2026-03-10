import { useRef, useMemo } from 'react'
import { Graphics, Text, TextStyle, Sprite, Container } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { SLOT_W, SLOT_H, MISSING_ICONS, MISSING_ICON_OFFSETS, COLORS } from './cardConstants'
import type { MissingPatternsHolder } from '../../engine/MissingPatternsHolder'

extend({ Graphics, Text, Sprite, Container })

const FONT_FAMILY = '"Iowan Old Style Black", "Iowan Old Style", Georgia, serif'

// --- Shared text styles (matching AS3 MissingMarkMovie) ---
const titleStyleGreen = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: 'bold',
  fill: COLORS.missingTitle,
})

const titleStyleDark = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: 'bold',
  fill: COLORS.textDefault,
})

const priceStyle = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: 'bold',
  fill: 0xffffff,
})

const bonusStyle = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 'bold',
  fill: 0xfff770,
})

// --- Easing functions ---
function easeInOutCirc(t: number): number {
  if (t < 0.5) return (1 - Math.sqrt(1 - 4 * t * t)) / 2
  return (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2
}

// AS3: Transitions.EASE_OUT_BOUNCE
function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t
  } else if (t < 2 / 2.75) {
    t -= 1.5 / 2.75
    return 7.5625 * t * t + 0.75
  } else if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75
    return 7.5625 * t * t + 0.9375
  } else {
    t -= 2.625 / 2.75
    return 7.5625 * t * t + 0.984375
  }
}

function easeInCubic(t: number): number {
  return t * t * t
}

// --- Entrance animation (Y bounce, no scale) ---
// Phase 0: push up + fade in (0.2s) — y to finalY - 10, alpha 0→1
// Phase 1: bounce down (0.2s) — y from finalY - 10 to finalY
// Phase 2: settled
const DROP_OFFSET = -10
const DROP_DURATION = 200  // ms
const BOUNCE_DURATION = 200 // ms

interface AnimState {
  phase: number // 0=push-up, 1=bounce-down, 2=settled
  startTime: number
}

// --- Spotlight (holofote) for FULL/jackpot (priority 6) ---
// AS3: MissingMarkMovie.createLight / animatelLight
const SPOTLIGHT_INTERVAL = 1700  // ms — tween every 1.7s
const SPOTLIGHT_DURATION = 1600  // ms — tween lasts 1.6s

function randomLightPos(offset: number) {
  return { x: Math.random() * 50 - offset, y: Math.random() * 50 - offset }
}

interface SpotlightState {
  fromX: number; fromY: number
  toX: number; toY: number
  startTime: number
}

// --- Component ---
interface Props {
  holder: MissingPatternsHolder
  ballNumber: number
  x: number
  y: number
}

// Title/label y-positions per priority (from AS3 MissingMarkMovie.playBg)
const MISSING_LAYOUT: Record<number, { titleY: number; labelY: number }> = {
  1: { titleY: -6, labelY: 24 },
  2: { titleY: -10, labelY: 21 },
  3: { titleY: -10, labelY: 23 },
  4: { titleY: -10, labelY: 23 },
  5: { titleY: -10, labelY: 23 },
  6: { titleY: -15, labelY: 21 },
}

export default function MissingMark({ holder, ballNumber, x, y }: Props) {
  const priority = holder.maxPriority
  const payout = holder.expectation
  const iconName = MISSING_ICONS[priority]
  const iconOffset = MISSING_ICON_OFFSETS[priority]
  const titleStyle = priority <= 1 ? titleStyleGreen : titleStyleDark
  const layout = MISSING_LAYOUT[priority] ?? MISSING_LAYOUT[1]

  const hasEntrance = priority >= 2

  const iconTex = useMemo(
    () => (iconName ? tex(iconName) : null),
    [iconName],
  )

  const drawBg = useMemo(
    () => (g: Graphics) => {
      g.clear()
      g.rect(-1, 0, SLOT_W + 3, SLOT_H)
      g.fill(COLORS.missingBg)
      g.rect(-1, 28, SLOT_W + 3, 16)
      g.fill(COLORS.missingPriceBg)
    },
    [],
  )

  // Ref for entrance Y-bounce (on container)
  const containerRef = useRef<Container | null>(null)
  const animState = useRef<AnimState>({
    phase: hasEntrance ? 0 : 2,
    startTime: 0,
  })
  const prevPriority = useRef(priority)

  // Spotlight refs (priority 6 only)
  const light1Ref = useRef<Sprite | null>(null)
  const light2Ref = useRef<Sprite | null>(null)
  const initPos1 = useMemo(() => randomLightPos(10), [])
  const initPos2 = useMemo(() => randomLightPos(5), [])
  const spot1 = useRef<SpotlightState>({
    fromX: initPos1.x, fromY: initPos1.y,
    toX: initPos1.x, toY: initPos1.y,
    startTime: 0,
  })
  const spot2 = useRef<SpotlightState>({
    fromX: initPos2.x, fromY: initPos2.y,
    toX: initPos2.x, toY: initPos2.y,
    startTime: 0,
  })

  useTick(() => {
    const c = containerRef.current
    if (!c) return

    const now = performance.now()

    // Reset animation when priority changes (detected in tick to avoid ref access during render)
    if (priority !== prevPriority.current) {
      prevPriority.current = priority
      if (hasEntrance) {
        animState.current = { phase: 0, startTime: now }
        c.alpha = 0
        c.y = DROP_OFFSET
      } else {
        animState.current = { phase: 2, startTime: now }
        c.alpha = 1
        c.y = 0
      }
    }

    const st = animState.current
    // Capture real start time on first tick (startTime=0 means "not yet started")
    if (st.startTime === 0) st.startTime = now
    const elapsed = now - st.startTime

    // --- Entrance Y-bounce (priority 2+ only) ---
    if (st.phase === 0) {
      // Push up + fade in
      const t = Math.min(elapsed / DROP_DURATION, 1)
      const eased = easeInCubic(t)
      c.y = DROP_OFFSET
      c.alpha = eased
      if (t >= 1) {
        st.phase = 1
        st.startTime = now
      }
    } else if (st.phase === 1) {
      // Bounce down: y from DROP_OFFSET → 0
      const t = Math.min(elapsed / BOUNCE_DURATION, 1)
      const eased = easeOutBounce(t)
      c.y = DROP_OFFSET * (1 - eased)
      c.alpha = 1
      if (t >= 1) {
        c.y = 0
        st.phase = 2
      }
    }

    // --- Spotlight animation (priority 6 only) ---
    if (priority === 6) {
      const animateSpot = (sprite: Sprite | null, state: SpotlightState, offset: number) => {
        if (!sprite) return
        const e = now - state.startTime
        if (e >= SPOTLIGHT_INTERVAL) {
          // Start new tween
          state.fromX = state.toX
          state.fromY = state.toY
          const next = randomLightPos(offset)
          state.toX = next.x
          state.toY = next.y
          state.startTime = now
        }
        const progress = Math.min((now - state.startTime) / SPOTLIGHT_DURATION, 1)
        const eased = easeInOutCirc(progress)
        sprite.x = state.fromX + (state.toX - state.fromX) * eased
        sprite.y = state.fromY + (state.toY - state.fromY) * eased
      }
      animateSpot(light1Ref.current, spot1.current, 10)
      animateSpot(light2Ref.current, spot2.current, 5)
    }
  })

  const payoutText = payout === 0 ? 'BONUS' : payout > 0 ? String(payout) : ''

  return (
    <pixiContainer x={x} y={y}>
      <pixiContainer
        ref={(inst: Container | null) => { containerRef.current = inst }}
        y={hasEntrance ? DROP_OFFSET : 0}
        alpha={hasEntrance ? 0 : 1}
      >
        {/* Spotlight holofotes — behind everything (priority 6 only) */}
        {priority === 6 && (
          <>
            <pixiSprite
              ref={(inst: Sprite | null) => { light1Ref.current = inst }}
              texture={tex('missing_holofote')}
              anchor={0.5}
              x={initPos1.x}
              y={initPos1.y}
            />
            <pixiSprite
              ref={(inst: Sprite | null) => { light2Ref.current = inst }}
              texture={tex('missing_holofote')}
              anchor={0.5}
              x={initPos2.x}
              y={initPos2.y}
            />
          </>
        )}

        {/* White bg + green price bar */}
        <pixiGraphics draw={drawBg} />

        {/* Priority icon */}
        {iconTex && iconOffset && (
          <pixiSprite
            texture={iconTex}
            x={iconOffset.x}
            y={iconOffset.y}
          />
        )}

        {/* Ball number */}
        <pixiText
          text={String(ballNumber)}
          style={titleStyle}
          anchor={{ x: 0.5, y: 0 }}
          x={SLOT_W / 2}
          y={layout.titleY}
        />

        {/* Payout label on green bar */}
        {payoutText !== '' && (
          <pixiText
            text={payoutText}
            style={payout === 0 ? bonusStyle : priceStyle}
            anchor={{ x: 0.5, y: 0 }}
            x={SLOT_W / 2}
            y={layout.labelY}
          />
        )}
      </pixiContainer>
    </pixiContainer>
  )
}
