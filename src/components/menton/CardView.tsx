import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Graphics, Text, Sprite, Container } from 'pixi.js'
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



  // Track which patterns have already been animated
  const animatedRef = useRef<Set<string>>(new Set())
  const [activeAnim, setActiveAnim] = useState<{ pattern: Pattern; configs: ReturnType<typeof getPatternAnimConfigs> } | null>(null)

  // Detect new completed patterns → trigger animation
  const currentPatterns = card.completedPatterns
  // Process pattern animations — useEffect runs after every render.
  // Finds next unanimated pattern, starts it if nothing is playing.
  // No useMemo, no render-phase state updates — simple and StrictMode safe.
  useEffect(() => {
    if (activeAnim) return // wait for current to finish

    for (const p of currentPatterns) {
      if (animatedRef.current.has(p.name)) continue
      animatedRef.current.add(p.name)
      const configs = getPatternAnimConfigs(p.name)
      if (configs.length > 0) {
        setActiveAnim({ pattern: p, configs })
        return // one at a time
      }
      // no configs = non-visual, already marked, continue to next
    }
  })

  // Reset tracking when card clears
  useEffect(() => {
    if (currentPatterns.size === 0 && animatedRef.current.size > 0) {
      animatedRef.current.clear()
      setActiveAnim(null)
    }
  }, [currentPatterns.size])

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

      {/* Slot layer 2: missing slots (above moldura, AS3: topChild)
          sortableChildren + zIndex ensures higher-priority patterns render on top */}
      <pixiContainer sortableChildren>
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const holder = card.expectations[row][col]
            if (card.matches[row][col] || holder === null) return null
            return (
              <SlotCell
                key={`m${row * COLS + col}`}
                card={card}
                row={row}
                col={col}
                x={X_O + col * CELL_W}
                y={Y_O + row * CELL_H}
                zIndex={holder.maxPriority}
                hasBell={bellPosition?.row === row && bellPosition?.col === col}
                idleHighlighted={!!idlePattern && idlePattern.mask[row * COLS + col]}
                shouldBlink={shouldBlink}
              />
            )
          }),
        )}
      </pixiContainer>

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

