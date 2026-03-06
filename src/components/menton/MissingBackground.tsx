import { useMemo } from 'react'
import { Sprite, Container } from 'pixi.js'
import { extend } from '@pixi/react'
import { COLS, ROWS } from '../../engine/constants'
import { tex } from '../../assets/atlas'
import { MOLDURA_CONFIG, Y_O, CELL_H, SLOT_H } from './cardConstants'
import type { Card } from '../../engine/Card'

extend({ Sprite, Container })

interface Props {
  card: Card
}

interface PatternInfo {
  priority: number
  missingRow: number
}

/** Collect unique pattern names from missing-one expectations, with priority and missing row */
function collectMissingPatterns(card: Card): Map<string, PatternInfo> {
  const patterns = new Map<string, PatternInfo>()
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const holder = card.expectations[row][col]
      if (!holder) continue
      for (const p of holder.getPatterns()) {
        const existing = patterns.get(p.name)
        if (existing === undefined || p.group.priority > existing.priority) {
          patterns.set(p.name, { priority: p.group.priority, missingRow: row })
        }
      }
    }
  }
  return patterns
}

export default function MissingBackground({ card }: Props) {
  const missingPatterns = useMemo(
    () => collectMissingPatterns(card),
    // Re-evaluate when maxMissingPriority changes (rough proxy for expectation changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card.maxMissingPriority, card.expectations],
  )

  const frames = useMemo(() => {
    const result: { key: string; zOrder: number; texture: string; x: number; y: number; scaleX: number; scaleY: number }[] = []
    for (const [name, info] of missingPatterns) {
      const config = MOLDURA_CONFIG[name]
      if (!config) continue

      // AS3: posDouble.y = (slot.bgDefault.y + slot.bgDefault.height * 0.5) - 2
      const y = config.dynamicY
        ? Y_O + info.missingRow * CELL_H + SLOT_H * 0.5 - 2
        : config.y

      result.push({
        key: name,
        zOrder: config.zOrder,
        texture: config.texture,
        x: config.x,
        y,
        scaleX: config.scaleX,
        scaleY: config.scaleY,
      })
    }
    // Sort by AS3 layer order: tripleCol(0) → fourCol(1) → doubleBox(2) → doubleLine(3) → bingo(4)
    result.sort((a, b) => a.zOrder - b.zOrder)
    return result
  }, [missingPatterns])

  if (frames.length === 0) return null

  return (
    <pixiContainer>
      {frames.map((f) => (
        <pixiSprite
          key={f.key}
          texture={tex(f.texture)}
          x={f.x}
          y={f.y}
          scale={{ x: f.scaleX, y: f.scaleY }}
          alpha={0.9}
        />
      ))}
    </pixiContainer>
  )
}
