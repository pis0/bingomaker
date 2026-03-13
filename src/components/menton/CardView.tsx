import { useMemo, useRef, useState, useCallback } from 'react'
import { Graphics, Text, TextStyle, Sprite, Container } from 'pixi.js'
import { extend } from '@pixi/react'
import { COLS, ROWS } from '../../engine/constants'
import type { Card } from '../../engine/Card'
import { tex } from '../../assets/atlas'
import { X_O, Y_O, CELL_W, CELL_H, CARD_W, CARD_H } from './cardConstants'
import SlotCell from './SlotCell'
import MissingBackground from './MissingBackground'
import PatternMovie, { getPatternAnimConfigs } from './PatternMovie'
import type { Pattern } from '../../engine/Pattern'
import type { BellPosition } from '../../engine/Round'

extend({ Graphics, Text, Container, Sprite })

export const CARD_TOTAL_W = CARD_W
export const CARD_TOTAL_H = CARD_H

interface Props {
  card: Card
  stakeIndex?: number
  bellPosition?: BellPosition
  idlePattern?: Pattern | null
  shouldBlink?: boolean
}

export default function CardView({ card, stakeIndex = 0, bellPosition, idlePattern = null, shouldBlink = false }: Props) {
  const cardTex = useMemo(() => tex('card'), [])
  const betTex = useMemo(() => tex(`cardbet${stakeIndex + 1}`), [stakeIndex])

  const patternNames = useMemo(
    () => [...card.completedPatterns].map((p) => p.name).join(', '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card.completedPatterns.size],
  )

  // Track which patterns have already been animated
  const animatedRef = useRef<Set<string>>(new Set())
  const [activeAnim, setActiveAnim] = useState<{ pattern: Pattern; configs: ReturnType<typeof getPatternAnimConfigs> } | null>(null)

  // Detect new completed patterns → trigger animation
  const currentPatterns = card.completedPatterns
  const newPattern = useMemo(() => {
    for (const p of currentPatterns) {
      if (!animatedRef.current.has(p.name)) {
        return p
      }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatterns.size])

  // Start animation for new pattern
  if (newPattern && (!activeAnim || activeAnim.pattern !== newPattern)) {
    const configs = getPatternAnimConfigs(newPattern.name)
    if (configs.length > 0) {
      animatedRef.current.add(newPattern.name)
      setActiveAnim({ pattern: newPattern, configs })
    } else {
      animatedRef.current.add(newPattern.name)
    }
  }

  // Reset tracking when card clears
  if (currentPatterns.size === 0 && animatedRef.current.size > 0) {
    animatedRef.current.clear()
    if (activeAnim) setActiveAnim(null)
  }

  const handleAnimComplete = useCallback(() => {
    setActiveAnim(null)
  }, [])

  return (
    <pixiContainer>
      {/* Card background frame from atlas (offset matches AS3 bgContainer position) */}
      <pixiSprite texture={cardTex} x={10} y={9} />

      {/* Bet level header strip */}
      <pixiSprite texture={betTex} x={10} y={9} />

      {/* Slot layer 1: non-missing slots (below moldura) */}
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          if (!card.matches[row][col] && card.expectations[row][col] !== null) return null
          return (
            <SlotCell
              key={row * COLS + col}
              card={card}
              row={row}
              col={col}
              x={X_O + col * CELL_W}
              y={Y_O + row * CELL_H}
              hasBell={bellPosition?.row === row && bellPosition?.col === col}
              idleHighlighted={!!idlePattern && idlePattern.mask[row * COLS + col]}
              shouldBlink={shouldBlink}
            />
          )
        }),
      )}

      {/* Moldura borders for missing-one patterns */}
      {card.maxMissingPriority >= 2 && <MissingBackground card={card} />}

      {/* Slot layer 2: missing slots (above moldura, AS3: topChild) */}
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          if (card.matches[row][col] || card.expectations[row][col] === null) return null
          return (
            <SlotCell
              key={`m${row * COLS + col}`}
              card={card}
              row={row}
              col={col}
              x={X_O + col * CELL_W}
              y={Y_O + row * CELL_H}
              hasBell={bellPosition?.row === row && bellPosition?.col === col}
              idleHighlighted={!!idlePattern && idlePattern.mask[row * COLS + col]}
              shouldBlink={shouldBlink}
            />
          )
        }),
      )}

      {/* Pattern completion animation (liquid + chips) */}
      {activeAnim && (
        <PatternMovie
          key={activeAnim.pattern.name}
          configs={activeAnim.configs}
          onComplete={handleAnimComplete}
        />
      )}

      {/* Payout — debug overlay, uncomment when needed */}
      {/* {card.payout > 0 && (
        <pixiText
          text={`+${card.payout}`}
          style={payoutStyle}
          x={CARD_W - 40}
          y={4}
        />
      )} */}

      {/* Pattern names — debug overlay, uncomment when needed */}
      {/* {patternNames && (
        <pixiText
          text={patternNames}
          style={patternLabelStyle}
          x={X_O}
          y={CARD_H - 14}
        />
      )} */}
    </pixiContainer>
  )
}

const payoutStyle = new TextStyle({
  fontFamily: 'Arial', fontSize: 11, fontWeight: 'bold', fill: 0x4caf50,
})

const patternLabelStyle = new TextStyle({
  fontFamily: 'Arial', fontSize: 9, fontWeight: 'bold', fill: 0xbb86fc,
})
