import { useRef, useState, useCallback } from 'react'
import { Container } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import Scenery from './Scenery'
import CardPanel from './CardPanel'
import PayoutTable from './PayoutTable'
import BallPanel from './BallPanel'
import BellPanel from './BellPanel'
import BellFlyAnimation from './BellFlyAnimation'
import BellRingAnimation from './BellRingAnimation'
import MultiplierCollect from './MultiplierCollect'
import FruitBombAnimation from './FruitBombAnimation'
import ChipFlyAnimation, { type ChipPosition } from './ChipFlyAnimation'
import Payout from './Payout'
import type { Round } from '../../engine/Round'
import type { Pattern } from '../../engine/Pattern'
import type { SlotSymbol } from '../../engine/SlotBonusSession'
import { FruitBombBonusSession, type BombPosition } from '../../engine/FruitBombBonusSession'
import { COLS, STAKE_LEVELS, DEFAULT_BALLS } from '../../engine/constants'
import { SLOT_X2, SLOT_FRUIT } from '../../engine/SlotBonusSession'
import { INTERVAL_PATTERNS, INTERVAL_PATTERN_DELAY, PATTERN_TO_CARD_INDEX } from './payoutConstants'
import { CARD_PANEL_X, CARD_PANEL_Y } from './layoutConstants'
import { CARD_W, CARD_H, CARD_GAP, X_O, Y_O, CELL_W, CELL_H, SLOT_W, SLOT_H } from './cardConstants'

extend({ Container })

// Card positions in 2x2 grid (relative to CARD_PANEL)
const CARD_OFFSETS = [
  { x: 0, y: 0 },
  { x: CARD_W + CARD_GAP, y: 0 },
  { x: 0, y: CARD_H + CARD_GAP },
  { x: CARD_W + CARD_GAP, y: CARD_H + CARD_GAP },
]

/** Compute cell centers in Menton space for a pattern on a given card */
function patternChipPositions(cardIndex: number, pattern: Pattern): ChipPosition[] {
  const card = CARD_OFFSETS[cardIndex]
  const baseX = CARD_PANEL_X + card.x
  const baseY = CARD_PANEL_Y + card.y
  const positions: ChipPosition[] = []

  for (let i = 0; i < pattern.mask.length; i++) {
    if (pattern.mask[i]) {
      const row = Math.floor(i / COLS)
      const col = i % COLS
      positions.push({
        x: baseX + X_O + col * CELL_W + SLOT_W / 2,
        y: baseY + Y_O + row * CELL_H + SLOT_H / 2,
      })
    }
  }
  return positions
}

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

  // Bell ring animation → slot spin chain
  // AS3: CardPanel.callBellAnimation() → BellPanel.animateSlots()
  const [bellRingActive, setBellRingActive] = useState(false)
  const [releasedSpinSymbols, setReleasedSpinSymbols] = useState<SlotSymbol[] | null>(null)
  const prevSpinSymbolsRef = useRef<SlotSymbol[] | null>(null)

  // Slot bonus animation states
  const [slotBlinking, setSlotBlinking] = useState(false)
  const [multiplierActive, setMultiplierActive] = useState(false)
  const [fruitBombActive, setFruitBombActive] = useState(false)

  // Fruit bomb engine + positions
  const fruitBombRef = useRef<FruitBombBonusSession | null>(null)
  const [bombPositions, setBombPositions] = useState<BombPosition[]>([])

  // Card shake offset (driven by FruitBombAnimation)
  const [cardShake, setCardShake] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Ball arrival tracking — cards mark only when ball settles in tube
  const arrivedBallsRef = useRef<Set<number>>(new Set())
  const [, setArrivalTick] = useState(0)

  // Force re-render after fruit bomb marks cells (Card is mutable)
  const [, setTick] = useState(0)

  // Payout display
  const prevPayoutRef = useRef(0)

  // Chip fly animation — fichas voam do pattern até o Payout
  const [chipFlyPositions, setChipFlyPositions] = useState<ChipPosition[] | null>(null)
  const prevDrawCountRef = useRef(0)
  const prevPatternsRef = useRef<number[]>([0, 0, 0, 0])

  // Reset all bonus states on round change
  const prevRoundRef = useRef<Round | null>(null)
  if (round !== prevRoundRef.current) {
    const isUndo = prevRoundRef.current && round && round.draws.length > 0
    prevRoundRef.current = round
    if (slotBlinking) setSlotBlinking(false)
    if (multiplierActive) setMultiplierActive(false)
    if (fruitBombActive) setFruitBombActive(false)
    if (bellRingActive) setBellRingActive(false)
    if (releasedSpinSymbols) setReleasedSpinSymbols(null)
    prevSpinSymbolsRef.current = null
    fruitBombRef.current = null
    if (bombPositions.length > 0) setBombPositions([])
    if (chipFlyPositions) setChipFlyPositions(null)

    if (isUndo) {
      // Undo: keep arrivedBalls for balls still in draws, remove undone
      const currentBalls = new Set(round.draws.map(d => d.ball))
      for (const ball of arrivedBallsRef.current) {
        if (!currentBalls.has(ball)) arrivedBallsRef.current.delete(ball)
      }
      // Sync tracking refs to current state so chip fly doesn't retrigger
      prevDrawCountRef.current = round.draws.length
      prevPayoutRef.current = round.totalPayout
      for (let ci = 0; ci < round.cards.length; ci++) {
        prevPatternsRef.current[ci] = round.cards[ci].completedPatterns.size
      }
    } else {
      // New round or no round: full reset
      prevPayoutRef.current = 0
      prevDrawCountRef.current = 0
      prevPatternsRef.current = [0, 0, 0, 0]
      arrivedBallsRef.current = new Set()
    }
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

  const currentPayout = round?.totalPayout ?? 0
  const isExtraPhase = (round?.currentBallIndex ?? 0) > DEFAULT_BALLS

  // Detect new pattern completions → trigger chip fly
  const drawCount = round?.draws.length ?? 0
  if (drawCount > prevDrawCountRef.current && round && !chipFlyPositions) {
    for (let i = prevDrawCountRef.current; i < drawCount; i++) {
      const draw = round.draws[i]
      if (draw.additionalPayout > 0 && draw.affectedCard >= 0) {
        const card = round.cards[draw.affectedCard]
        const prevCount = prevPatternsRef.current[draw.affectedCard]
        if (card.completedPatterns.size > prevCount) {
          // Find the newest pattern (last in Set iteration = insertion order)
          const patterns = [...card.completedPatterns]
          const newPattern = patterns[patterns.length - 1]
          setChipFlyPositions(patternChipPositions(draw.affectedCard, newPattern))
          break
        }
      }
    }
    // Update tracking refs
    prevDrawCountRef.current = drawCount
    if (round) {
      for (let ci = 0; ci < round.cards.length; ci++) {
        prevPatternsRef.current[ci] = round.cards[ci].completedPatterns.size
      }
    }
  }

  // Detect when spinSymbols first appears → start bell ring animation
  const rawSpinSymbols = round?.slotBonus.symbols ?? null
  if (rawSpinSymbols && rawSpinSymbols !== prevSpinSymbolsRef.current) {
    prevSpinSymbolsRef.current = rawSpinSymbols
    if (!bellRingActive && !releasedSpinSymbols) {
      setBellRingActive(true)
    }
  }
  if (!rawSpinSymbols) {
    prevSpinSymbolsRef.current = null
  }

  // Bell ring animation complete → release symbols to BellPanel for slot spin
  const handleBellRingComplete = useCallback(() => {
    setBellRingActive(false)
    setReleasedSpinSymbols(rawSpinSymbols)
  }, [rawSpinSymbols])

  // AS3: RoundMotion.checkBonus → prize-specific animations
  const handleSlotComplete = useCallback(() => {
    const prize = round?.slotBonus.prize
    if (!prize) return

    setSlotBlinking(true)

    if (prize === SLOT_X2) {
      setMultiplierActive(true)
    } else if (prize === SLOT_FRUIT) {
      // AS3: FruitBombBonusSession — select positions BEFORE animation
      const session = new FruitBombBonusSession()
      session.selectPositions(round.cards)
      fruitBombRef.current = session
      setBombPositions([...session.positions])
      setFruitBombActive(true)
    }
    // SLOT_BONUS → future: Fête du Citron bonus game
  }, [round])

  const handleBallArrive = useCallback((ball: number) => {
    arrivedBallsRef.current.add(ball)
    setArrivalTick(t => t + 1)
  }, [])

  const handleChipFlyComplete = useCallback(() => {
    setChipFlyPositions(null)
  }, [])

  const handleMultiplierComplete = useCallback(() => {
    setMultiplierActive(false)
  }, [])

  // AS3: cardShake callback from FruitBombAnimation
  const handleFruitShake = useCallback((dx: number, dy: number) => {
    setCardShake({ x: dx, y: dy })
  }, [])

  // AS3: after fruit animation complete → mark cells, update visual
  const handleFruitBombComplete = useCallback(() => {
    // Process bomb — marks cells on cards (mutates Card objects)
    if (fruitBombRef.current && round) {
      fruitBombRef.current.process(round, stake)
      // Add fruit bomb cell numbers to arrivedBalls so SlotCell shows marks
      for (const pos of fruitBombRef.current.positions) {
        const card = round.cards[pos.cardIndex]
        // 2×2 block from top-left (row, col)
        for (let dr = 0; dr < 2; dr++) {
          for (let dc = 0; dc < 2; dc++) {
            arrivedBallsRef.current.add(card.numbers[pos.row + dr][pos.col + dc])
          }
        }
      }
    }
    setFruitBombActive(false)
    setBombPositions([])
    setCardShake({ x: 0, y: 0 })
    // Force re-render so cards show newly marked cells
    setTick(t => t + 1)
  }, [round, stake])

  const bellsRevealed = round?.slotBonus.hits ?? 0
  const bellPositions = round?.slotBonus.positions ?? []

  return (
    <pixiContainer>
      <Scenery />
      {round && (
        <>
          <BallPanel round={round} onBallArrive={handleBallArrive} />
          <BellPanel
            bellsRevealed={bellsRevealed}
            spinSymbols={releasedSpinSymbols}
            blinking={slotBlinking}
            onSpinComplete={handleSlotComplete}
          />
          <PayoutTable round={round} stake={stake} activeIdleCard={activeIdleCard} idlePattern={idlePattern} />
          <Payout value={currentPayout} collecting={!!chipFlyPositions} />
          <CardPanel
            round={round}
            stakeIndex={stakeIndex}
            idlePattern={idlePattern}
            shakeOffset={cardShake}
            shouldBlink={isExtraPhase}
            arrivedBalls={arrivedBallsRef.current}
          />
          {/* Overlay animations (above cards, not clipped) */}
          {chipFlyPositions && (
            <ChipFlyAnimation chips={chipFlyPositions} onComplete={handleChipFlyComplete} />
          )}
          <BellFlyAnimation positions={bellPositions} />
          <BellRingAnimation active={bellRingActive} onComplete={handleBellRingComplete} />
          <MultiplierCollect active={multiplierActive} onComplete={handleMultiplierComplete} />
          <FruitBombAnimation
            active={fruitBombActive}
            bombPositions={bombPositions}
            onShake={handleFruitShake}
            onComplete={handleFruitBombComplete}
          />
        </>
      )}
    </pixiContainer>
  )
}
