import { Container } from 'pixi.js'
import { extend } from '@pixi/react'
import type { Round } from '../../engine/Round'
import CardView from './CardView'
import { CARD_W, CARD_H, CARD_GAP } from './cardConstants'
import { GAME_WIDTH } from './Scenery'

extend({ Container })

const PANEL_W = CARD_W * 2 + CARD_GAP

// Card positions in the 2x2 grid (matching AS3: (332+5)*col, (168+5)*row)
const positions = [
  { x: 0, y: 0 },
  { x: CARD_W + CARD_GAP, y: 0 },
  { x: 0, y: CARD_H + CARD_GAP },
  { x: CARD_W + CARD_GAP, y: CARD_H + CARD_GAP },
]

interface Props {
  round: Round
  stakeIndex?: number
  x?: number
  y?: number
}

export default function CardPanel({ round, stakeIndex = 0, x, y }: Props) {
  const offsetX = x ?? Math.round((GAME_WIDTH - PANEL_W) / 2)
  const offsetY = y ?? 630

  return (
    <pixiContainer x={offsetX} y={offsetY}>
      {round.cards.map((card, i) => (
        <pixiContainer key={card.index} x={positions[i].x} y={positions[i].y}>
          <CardView card={card} stakeIndex={stakeIndex} />
        </pixiContainer>
      ))}
    </pixiContainer>
  )
}
