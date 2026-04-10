import { useState, useCallback, useRef } from 'react'
import { Container } from 'pixi.js'
import { extend } from '@pixi/react'
import { FULL } from '../../engine/Pattern'
import CardView from './CardView'
import BingoMovie from './BingoMovie'
import { CARD_W, CARD_H, CARD_GAP } from './cardConstants'
import { CARD_PANEL_X, CARD_PANEL_Y } from './layoutConstants'
import { DEFAULT_BALLS } from '../../engine/constants'
import { INTERVAL_PATTERNS } from './payoutConstants'
import { useGameStore, setAnimFlag } from '../../store/gameStore'
import { playSFX, playVO } from '../../audio/AudioManager'
import { BUTTON_SHUFFLE, PRIZE_BINGO, VO_BINGO } from '../../audio/SoundID'

extend({ Container })

// Card positions in the 2x2 grid (matching AS3: (332+5)*col, (168+5)*row)
const positions = [
  { x: 0, y: 0 },
  { x: CARD_W + CARD_GAP, y: 0 },
  { x: 0, y: CARD_H + CARD_GAP },
  { x: CARD_W + CARD_GAP, y: CARD_H + CARD_GAP },
]

interface Props {
  x?: number
  y?: number
  /** Called when player clicks cards during idle to shuffle */
  onShuffle?: () => void
}

export default function CardPanel({ x, y, onShuffle }: Props) {
  // ── Read from Zustand store ─────────────────────────────────────
  const round = useGameStore(s => s.round)
  const stakeIndex = useGameStore(s => s.stakeIndex)
  const shakeX = useGameStore(s => s.cardShake.x)
  const shakeY = useGameStore(s => s.cardShake.y)
  const drawing = useGameStore(s => s.drawing)
  const idlePatternIndex = useGameStore(s => s.idlePatternIndex)

  // Derived locally
  const idlePattern = !drawing ? INTERVAL_PATTERNS[idlePatternIndex] : null
  const shouldBlink = (round?.currentBallIndex ?? 0) > DEFAULT_BALLS
  const isIdle = !drawing
  const offsetX = (x ?? CARD_PANEL_X) + shakeX
  const offsetY = (y ?? CARD_PANEL_Y) + shakeY

  const [cardsVisible, setCardsVisible] = useState(true)
  const [bingoCardIndex, setBingoCardIndex] = useState<number | null>(null)
  const triggeredFullRef = useRef<Set<number>>(new Set())

  // Detect FULL pattern on any card (AS3: Cardd → CardPanel.ME.animaBingo).
  // Intentional render-time check guarded by triggeredFullRef. Engine mutates
  // `round` in-place (fruit bomb etc.), so useEffect deps would miss state changes.
  // The ref guard ensures setBingoCardIndex fires at most once per FULL detection.
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

  const handleHideCards = useCallback(() => {
    playSFX(PRIZE_BINGO, { volume: 0.2 })
    playVO(VO_BINGO)
    setCardsVisible(false)
    setAnimFlag('bingoActive', true)
  }, [])
  const handleShowCards = useCallback(() => setCardsVisible(true), [])
  const handleBingoComplete = useCallback(() => {
    setBingoCardIndex(null)
    setAnimFlag('bingoActive', false)
  }, [])

  if (!round) return null

  return (
    <pixiContainer x={offsetX} y={offsetY}>
      {round.cards.map((card, i) => (
        <pixiContainer
          key={card.index}
          x={positions[i].x}
          y={positions[i].y}
          visible={cardsVisible}
          eventMode={isIdle && onShuffle ? 'static' : 'auto'}
          cursor={isIdle && onShuffle ? 'pointer' : 'default'}
          onPointerUp={isIdle && onShuffle ? () => { playSFX(BUTTON_SHUFFLE); onShuffle() } : undefined}
        >
          <CardView card={card} stakeIndex={stakeIndex} bellPosition={round.bellPositions[i]} idlePattern={idlePattern} shouldBlink={shouldBlink} />
        </pixiContainer>
      ))}
      <BingoMovie
        cardIndex={bingoCardIndex}
        onHideCards={handleHideCards}
        onShowCards={handleShowCards}
        onComplete={handleBingoComplete}
        onBurst={undefined}
      />
    </pixiContainer>
  )
}
