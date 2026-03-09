import { Container } from 'pixi.js'
import { extend } from '@pixi/react'
import type { Round } from '../../engine/Round'
import type { Pattern } from '../../engine/Pattern'
import CardView from './CardView'
import { CARD_W, CARD_H, CARD_GAP } from './cardConstants'

extend({ Container })

// Card positions in the 2x2 grid (matching AS3: (332+5)*col, (168+5)*row)
const positions = [
  { x: 0, y: 0 },
  { x: CARD_W + CARD_GAP, y: 0 },
  { x: 0, y: CARD_H + CARD_GAP },
  { x: CARD_W + CARD_GAP, y: CARD_H + CARD_GAP },
]

interface Props {
  round: Round | null
  stakeIndex?: number
  idlePattern?: Pattern | null
  x?: number
  y?: number
}

export default function CardPanel({ round, stakeIndex = 0, idlePattern = null, x, y }: Props) {
  // AS3 Menton.as: addComp(new CardPanel(), {x:70, y:255})
  const offsetX = x ?? 70
  const offsetY = y ?? 255

  if (!round) return null

  return (
    <pixiContainer x={offsetX} y={offsetY}>
      {round.cards.map((card, i) => (
        <pixiContainer key={card.index} x={positions[i].x} y={positions[i].y}>
          <CardView card={card} stakeIndex={stakeIndex} bellPosition={round.bellPositions[i]} idlePattern={idlePattern} />
        </pixiContainer>
      ))}
    </pixiContainer>
  )
}
