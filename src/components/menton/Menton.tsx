import { useRef, useState, useCallback, useEffect } from 'react'
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
import JackpotPanel from './JackpotPanel'
import type { Round } from '../../engine/Round'
import type { Draw } from '../../engine/Draw'
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
  /** How many balls BallPanel should launch (set by engine, visual target) */
  targetBallCount?: number
  /** Process one draw when ball arrives in tube (calls round.drawNext) */
  processNextBall?: () => Draw | null
  /** End-of-round payout collect animation */
  isCollecting?: boolean
  /** Previous round's payout — shown in idle state */
  lastPayout?: number
  /** Report bonus animation active state to parent */
  onBonusActiveChange?: (active: boolean) => void
  /** Peel step advance tick (user-driven) */
  peelAdvanceTick?: number
  /** BallPanel peel state change callback */
  onPeelChange?: (peeling: boolean) => void
}

export default function Menton({ round, stakeIndex = 0, targetBallCount = 0, processNextBall, isCollecting = false, lastPayout = 0, onBonusActiveChange, peelAdvanceTick = 0, onPeelChange }: Props) {
  const stake = STAKE_LEVELS[stakeIndex]

  // AS3: IntervalCardPatternController — cycles individual patterns during idle
  const drawing = targetBallCount > 0
  const [idlePatternIndex, setIdlePatternIndex] = useState(0)
  const idleTimerRef = useRef(0)

  // Bell ring animation → slot spin chain
  // AS3: CardPanel.callBellAnimation() → BellPanel.animateSlots()
  const [bellRingActive, setBellRingActive] = useState(false)
  const [releasedSpinSymbols, setReleasedSpinSymbols] = useState<SlotSymbol[] | null>(null)
  const prevSpinSymbolsRef = useRef<SlotSymbol[] | null>(null)

  // Super ball z-order toggle (AS3: BallPanel goes to front during super ball flight)
  const [superFlying, setSuperFlying] = useState(false)

  // Slot bonus animation states
  const [slotBlinking, setSlotBlinking] = useState(false)
  const [multiplierActive, setMultiplierActive] = useState(false)
  const [fruitBombActive, setFruitBombActive] = useState(false)

  // Fruit bomb engine + positions
  const fruitBombRef = useRef<FruitBombBonusSession | null>(null)
  const [bombPositions, setBombPositions] = useState<BombPosition[]>([])

  // Card shake offset (driven by FruitBombAnimation)
  const [cardShake, setCardShake] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Force re-render after fruit bomb marks cells (Card is mutable)
  const [, setTick] = useState(0)

  // Chip fly animation — fichas voam do pattern até o Payout
  const [chipFlyPositions, setChipFlyPositions] = useState<ChipPosition[] | null>(null)
  const prevPatternsRef = useRef<number[]>([0, 0, 0, 0])

  // Round generation counter — drives key-based remount of ALL children
  const roundGenRef = useRef(0)
  const prevRoundRef = useRef<Round | null>(null)
  if (round !== prevRoundRef.current) {
    prevRoundRef.current = round
    // New round: bump generation → full unmount/remount of all children
    roundGenRef.current++
    // Reset Menton-level state
    if (slotBlinking) setSlotBlinking(false)
    if (multiplierActive) setMultiplierActive(false)
    if (fruitBombActive) setFruitBombActive(false)
    if (bellRingActive) setBellRingActive(false)
    if (superFlying) setSuperFlying(false)
    if (releasedSpinSymbols) setReleasedSpinSymbols(null)
    prevSpinSymbolsRef.current = null
    fruitBombRef.current = null
    if (bombPositions.length > 0) setBombPositions([])
    if (chipFlyPositions) setChipFlyPositions(null)
    prevPatternsRef.current = [0, 0, 0, 0]
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

  // Payout and extra phase derive from engine state (advances incrementally)
  const currentPayout = round?.totalPayout ?? 0
  const isExtraPhase = (round?.currentBallIndex ?? 0) > DEFAULT_BALLS

  // AS3: RoundMotion pauses ball discharge during bonus animations
  const bonusActive = bellRingActive
    || (releasedSpinSymbols !== null && !slotBlinking) // slot spinning
    || multiplierActive
    || fruitBombActive
    || !!chipFlyPositions // pattern celebration

  // Report bonus state to parent (disables advance/end buttons)
  useEffect(() => {
    onBonusActiveChange?.(bonusActive)
  }, [bonusActive, onBonusActiveChange])

  // AS3: dynamic ball trigger interval based on maxPatternPriority
  // Values doubled from AS3 30fps → 60fps (original: [3,3,4,5,6,7,8,12,15,20,30])
  const TRIGGER_INTERVALS = [6, 6, 8, 10, 12, 14, 16, 24, 30, 40, 60]
  const maxPriority = round?.maxPatternPriority ?? 0
  const launchInterval = TRIGGER_INTERVALS[Math.min(maxPriority, TRIGGER_INTERVALS.length - 1)]

  // Detect new pattern completions → trigger chip fly
  // (runs on re-render after processNextBall advances engine state)
  if (round && !chipFlyPositions) {
    for (let ci = 0; ci < round.cards.length; ci++) {
      const card = round.cards[ci]
      if (card.completedPatterns.size > prevPatternsRef.current[ci]) {
        const patterns = [...card.completedPatterns]
        const newPattern = patterns[patterns.length - 1]
        setChipFlyPositions(patternChipPositions(ci, newPattern))
        break
      }
    }
    // Update tracking refs
    for (let ci = 0; ci < round.cards.length; ci++) {
      prevPatternsRef.current[ci] = round.cards[ci].completedPatterns.size
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

  // Ball arrives in tube → process engine draw (incremental)
  const handleBallArrive = useCallback(() => {
    processNextBall?.()
  }, [processNextBall])

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
        <pixiContainer key={roundGenRef.current} sortableChildren>
          {/* Z-order matches AS3 Menton display list:
              0: Scenery (outside this container)
              1: PayoutTable
              2: BellPanel
              3: JackpotPanel
              4: BallPanel (→ 100 during super ball flight)
              6: CardPanel
              9: Overlay animations (chips, bells, multiplier, fruit — always above cards) */}
          <pixiContainer zIndex={2}>
            <BellPanel
              bellsRevealed={bellsRevealed}
              spinSymbols={releasedSpinSymbols}
              blinking={slotBlinking}
              onSpinComplete={handleSlotComplete}
            />
          </pixiContainer>
          <pixiContainer zIndex={3}>
            <JackpotPanel />
          </pixiContainer>
          <pixiContainer zIndex={1}>
            <PayoutTable round={round} stake={stake} activeIdleCard={activeIdleCard} idlePattern={idlePattern} />
            <Payout value={currentPayout} stake={stake} lastPayout={!drawing ? lastPayout : 0} collecting={isCollecting || !!chipFlyPositions} />
          </pixiContainer>
          <BallPanel round={round} targetBallCount={targetBallCount} stake={stake} launchInterval={launchInterval} paused={bonusActive} peelAdvanceTick={peelAdvanceTick} onBallArrive={handleBallArrive} onPeelChange={onPeelChange} onSuperFlyingChange={setSuperFlying} zIndex={superFlying ? 100 : 4} />
          <pixiContainer zIndex={6}>
            <CardPanel
              round={round}
              stakeIndex={stakeIndex}
              idlePattern={idlePattern}
              shakeOffset={cardShake}
              shouldBlink={isExtraPhase}
            />
          </pixiContainer>
          {/* Overlay animations — z=9, always above cards (AS3: ParticlesLayer level) */}
          <pixiContainer zIndex={9}>
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
          </pixiContainer>
        </pixiContainer>
      )}
    </pixiContainer>
  )
}
