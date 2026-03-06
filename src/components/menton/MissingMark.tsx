import { useMemo } from 'react'
import { Graphics, Text, TextStyle, Sprite, Container } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { SLOT_W, SLOT_H, MISSING_ICONS, MISSING_ICON_OFFSETS, COLORS } from './cardConstants'
import type { MissingPatternsHolder } from '../../engine/MissingPatternsHolder'

extend({ Graphics, Text, Sprite, Container })

const FONT_FAMILY = '"Iowan Old Style Black", "Iowan Old Style", Georgia, serif'

// --- Shared text styles (matching AS3 MissingMarkMovie) ---
// title: ball number, large — green for LINE/DOUBLE_COLUMN, dark for others
const titleStyleGreen = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: 'bold',
  fill: COLORS.missingTitle,
})

const titleStyleDark = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: 'bold',
  fill: COLORS.textDefault,
})

// label: payout value on green bar
const priceStyle = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: 'bold',
  fill: 0xffffff,
})

// --- Component ---
interface Props {
  holder: MissingPatternsHolder
  ballNumber: number
  x: number
  y: number
}

// Title/label y-positions per priority (from AS3 MissingMarkMovie.playBg)
// Priority 1 (LINE/DOUBLE_COLUMN): default positions, green title, no icon
// Priority 2+ (TRIPLE_COLUMN and above): icon shown, positions shift to accommodate
const MISSING_LAYOUT: Record<number, { titleY: number; labelY: number }> = {
  1: { titleY: -6, labelY: 24 },
  2: { titleY: -10, labelY: 21 },   // TRIPLE_COLUMN
  3: { titleY: -10, labelY: 23 },   // DOUBLE_LINE
  4: { titleY: -10, labelY: 23 },   // QUAD_COLUMN
  5: { titleY: -10, labelY: 23 },   // QUAD_COLUMN_3
  6: { titleY: -15, labelY: 21 },   // FULL
}

export default function MissingMark({ holder, ballNumber, x, y }: Props) {
  const priority = holder.maxPriority
  const payout = holder.expectation
  const iconName = MISSING_ICONS[priority]
  const iconOffset = MISSING_ICON_OFFSETS[priority]
  // Only LINE and DOUBLE_COLUMN (priority 1) use green title
  const titleStyle = priority <= 1 ? titleStyleGreen : titleStyleDark
  const layout = MISSING_LAYOUT[priority] ?? MISSING_LAYOUT[1]

  const iconTex = useMemo(
    () => (iconName ? tex(iconName) : null),
    [iconName],
  )

  const drawBg = useMemo(
    () => (g: Graphics) => {
      g.clear()
      // White background
      g.rect(-1, 0, SLOT_W + 3, SLOT_H)
      g.fill(COLORS.missingBg)
      // Green price background at bottom
      g.rect(-1, 28, SLOT_W + 3, 16)
      g.fill(COLORS.missingPriceBg)
    },
    [],
  )

  const payoutText = payout === 0 ? 'BONUS' : payout > 0 ? String(payout) : ''

  return (
    <pixiContainer x={x} y={y}>
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

      {/* Ball number (large, centered horizontally) */}
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
  )
}

const bonusStyle = new TextStyle({
  fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 'bold',
  fill: 0xfff770,
})
