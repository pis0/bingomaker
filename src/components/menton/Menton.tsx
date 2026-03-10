import { useRef, useState, useCallback } from 'react'
import { Container } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import Scenery from './Scenery'
import CardPanel from './CardPanel'
import PayoutTable from './PayoutTable'
import BellPanel from './BellPanel'
import BellFlyAnimation from './BellFlyAnimation'
import MultiplierCollect from './MultiplierCollect'
import FruitBombAnimation from './FruitBombAnimation'
import type { Round } from '../../engine/Round'
import { STAKE_LEVELS } from '../../engine/constants'
import { SLOT_X2, SLOT_FRUIT } from '../../engine/SlotBonusSession'
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

  // Slot bonus animation states
  const [slotBlinking, setSlotBlinking] = useState(false)
  const [multiplierActive, setMultiplierActive] = useState(false)
  const [fruitBombActive, setFruitBombActive] = useState(false)

  // Reset all bonus states on round change
  const prevRoundRef = useRef<Round | null>(null)
  if (round !== prevRoundRef.current) {
    prevRoundRef.current = round
    if (slotBlinking) setSlotBlinking(false)
    if (multiplierActive) setMultiplierActive(false)
    if (fruitBombActive) setFruitBombActive(false)
  }

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

  // AS3: RoundMotion.checkBonus → prize-specific animations
  const handleSlotComplete = useCallback(() => {
    const prize = round?.slotBonus.prize
    if (!prize) return

    setSlotBlinking(true)

    if (prize === SLOT_X2) {
      setMultiplierActive(true)
    } else if (prize === SLOT_FRUIT) {
      setFruitBombActive(true)
    }
    // SLOT_BONUS → future: Fête du Citron bonus game
  }, [round])

  const handleMultiplierComplete = useCallback(() => {
    setMultiplierActive(false)
  }, [])

  const handleFruitBombComplete = useCallback(() => {
    setFruitBombActive(false)
  }, [])

  const bellsRevealed = round?.slotBonus.hits ?? 0
  const spinSymbols = round?.slotBonus.symbols ?? null
  const bellPositions = round?.slotBonus.positions ?? []

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
          {/* Overlay animations (above cards, not clipped) */}
          <BellFlyAnimation positions={bellPositions} />
          <MultiplierCollect active={multiplierActive} onComplete={handleMultiplierComplete} />
          <FruitBombAnimation active={fruitBombActive} onComplete={handleFruitBombComplete} />
        </>
      )}
    </pixiContainer>
  )
}
