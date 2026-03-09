import { useMemo } from 'react'
import { Container } from 'pixi.js'
import { extend } from '@pixi/react'
import type { Round } from '../../engine/Round'
import PayoutCard, { type PayoutCardState, type MissingInfo } from './PayoutCard'
import {
  PAYOUT_CARD_PATTERNS,
  PATTERN_TO_CARD_INDEX,
  PAYOUT_CARD_SPACING,
  PAYOUT_TABLE_X,
  PAYOUT_TABLE_Y,
} from './payoutConstants'

extend({ Container })

interface Props {
  round: Round | null
  stake: number
  x?: number
  y?: number
}

/** Derive state per PayoutCard from round state */
function deriveCardStates(round: Round | null): {
  states: PayoutCardState[]
  missings: MissingInfo[][]
  winCounts: number[]
} {
  const states: PayoutCardState[] = Array(7).fill('idle')
  const missings: MissingInfo[][] = Array.from({ length: 7 }, () => [])
  const winCounts: number[] = Array(7).fill(0)

  if (!round) return { states, missings, winCounts }

  // Scan all cards for completed and missing-one patterns
  for (const card of round.cards) {
    // Completed patterns → won state
    for (const pattern of card.completedPatterns) {
      const idx = PATTERN_TO_CARD_INDEX.get(pattern)
      if (idx !== undefined) {
        states[idx] = 'won'
        winCounts[idx]++
      }
    }

    // Missing-one expectations → missing state (only if not already won)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const holder = card.expectations[row][col]
        if (!holder) continue
        for (const pattern of holder.getPatterns()) {
          const idx = PATTERN_TO_CARD_INDEX.get(pattern)
          if (idx !== undefined && states[idx] !== 'won') {
            states[idx] = 'missing'
            missings[idx].push({
              cardIndex: card.index,
              row,
              col,
              pattern,
            })
          }
        }
      }
    }
  }

  return { states, missings, winCounts }
}

export default function PayoutTable({ round, stake, x, y }: Props) {
  const posX = x ?? PAYOUT_TABLE_X
  const posY = y ?? PAYOUT_TABLE_Y

  const { states, missings, winCounts } = useMemo(
    () => deriveCardStates(round),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round, round?.draws.length],
  )

  // AS3: PatternsController.stopAnimas() called when draws start
  const drawing = (round?.draws.length ?? 0) > 0

  return (
    <pixiContainer x={posX} y={posY}>
      {PAYOUT_CARD_PATTERNS.map((patterns, i) => (
        <pixiContainer key={i} x={i * PAYOUT_CARD_SPACING}>
          <PayoutCard
            cardIndex={i}
            patterns={patterns}
            stake={stake}
            state={states[i]}
            missings={missings[i]}
            winCount={winCounts[i]}
            drawing={drawing}
          />
        </pixiContainer>
      ))}
    </pixiContainer>
  )
}
