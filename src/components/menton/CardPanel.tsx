import { useState, useCallback, useRef } from 'react'
import { Container } from 'pixi.js'
import { extend } from '@pixi/react'
import type { Round } from '../../engine/Round'
import type { Pattern } from '../../engine/Pattern'
import { FULL } from '../../engine/Pattern'
import CardView from './CardView'
import BingoMovie from './BingoMovie'
import { CARD_W, CARD_H, CARD_GAP } from './cardConstants'
import { CARD_PANEL_X, CARD_PANEL_Y } from './layoutConstants'

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
  /** Card shake offset driven by FruitBombAnimation */
  shakeOffset?: { x: number; y: number }
}

export default function CardPanel({ round, stakeIndex = 0, idlePattern = null, x, y, shakeOffset }: Props) {
  const offsetX = (x ?? CARD_PANEL_X) + (shakeOffset?.x ?? 0)
  const offsetY = (y ?? CARD_PANEL_Y) + (shakeOffset?.y ?? 0)

  const [cardsVisible, setCardsVisible] = useState(true)
  const [bingoCardIndex, setBingoCardIndex] = useState<number | null>(null)
  const triggeredFullRef = useRef<Set<number>>(new Set())

  // Detect FULL pattern on any card (AS3: Cardd → CardPanel.ME.animaBingo)
  if (round) {
    for (const card of round.cards) {
      if (card.completedPatterns.has(FULL) && !triggeredFullRef.current.has(card.index)) {
        triggeredFullRef.current.add(card.index)
        setBingoCardIndex(card.index)
        break
      }
      // Undo cleared the FULL — allow re-trigger
      if (!card.completedPatterns.has(FULL) && triggeredFullRef.current.has(card.index)) {
        triggeredFullRef.current.delete(card.index)
      }
    }
  } else if (triggeredFullRef.current.size > 0) {
    triggeredFullRef.current.clear()
  }

  const handleHideCards = useCallback(() => setCardsVisible(false), [])
  const handleShowCards = useCallback(() => setCardsVisible(true), [])
  const handleBingoComplete = useCallback(() => setBingoCardIndex(null), [])

  if (!round) return null

  return (
    <pixiContainer x={offsetX} y={offsetY}>
      {round.cards.map((card, i) => (
        <pixiContainer key={card.index} x={positions[i].x} y={positions[i].y} visible={cardsVisible}>
          <CardView card={card} stakeIndex={stakeIndex} bellPosition={round.bellPositions[i]} idlePattern={idlePattern} />
        </pixiContainer>
      ))}
      <BingoMovie
        cardIndex={bingoCardIndex}
        onHideCards={handleHideCards}
        onShowCards={handleShowCards}
        onComplete={handleBingoComplete}
      />
    </pixiContainer>
  )
}
