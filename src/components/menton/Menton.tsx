import { useRef, useState, useCallback } from 'react'
import { Container } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import Scenery from './Scenery'
import CardPanel from './CardPanel'
import PayoutTable from './PayoutTable'
import BellPanel from './BellPanel'
import type { Round } from '../../engine/Round'
import { STAKE_LEVELS } from '../../engine/constants'
import { INTERVAL_PATTERNS, INTERVAL_PATTERN_DELAY, PATTERN_TO_CARD_INDEX } from './payoutConstants'

extend({ Container })

interface Props {
  round: Round | null
  stakeIndex?: number
}

export default function Menton({ round, stakeIndex = 0 }: Props) {
  const stake = STAKE_LEVELS[stakeIndex]

  // AS3: IntervalCardPatternController — cycles individual patterns during idle
  const drawing = (round?.draws.length ?? 0) > 0
  const [idlePatternIndex, setIdlePatternIndex] = useState(0)
  const idleTimerRef = useRef(0)

  // Slot bonus blinking state
  const [slotBlinking, setSlotBlinking] = useState(false)

  useTick((ticker) => {
    if (drawing) return
    idleTimerRef.current += ticker.deltaMS
    if (idleTimerRef.current >= INTERVAL_PATTERN_DELAY) {
      idleTimerRef.current = 0
      setIdlePatternIndex((prev) => (prev + 1) % INTERVAL_PATTERNS.length)
    }
  })

  const idlePattern = !drawing ? INTERVAL_PATTERNS[idlePatternIndex] : null
  const activeIdleCard = idlePattern ? (PATTERN_TO_CARD_INDEX.get(idlePattern) ?? -1) : -1

  const handleSlotComplete = useCallback(() => {
    if (round?.slotBonus.prize) {
      setSlotBlinking(true)
    }
  }, [round])

  const bellsRevealed = round?.slotBonus.hits ?? 0
  const spinSymbols = round?.slotBonus.symbols ?? null

  return (
    <pixiContainer>
      <Scenery />
      {round && (
        <>
          <BellPanel
            bellsRevealed={bellsRevealed}
            spinSymbols={spinSymbols}
            blinking={slotBlinking}
            onSpinComplete={handleSlotComplete}
          />
          <PayoutTable round={round} stake={stake} activeIdleCard={activeIdleCard} idlePattern={idlePattern} />
          <CardPanel round={round} stakeIndex={stakeIndex} idlePattern={idlePattern} />
        </>
      )}
    </pixiContainer>
  )
}
