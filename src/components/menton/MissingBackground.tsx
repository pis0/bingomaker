import { useRef, useMemo, useEffect } from 'react'
import { Sprite, Container } from 'pixi.js'
import { extend } from '@pixi/react'
import { COLS, ROWS } from '../../engine/constants'
import { tex } from '../../assets/atlas'
import { MOLDURA_CONFIG, Y_O, CELL_H, SLOT_H } from './cardConstants'
import type { Card } from '../../engine/Card'
import { useParticleEmitter } from '../../particles/useParticleEmitter'
import { menton4colBright } from '../../particles/configs/menton_4col_bright'

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

// Particle glow emitter positions per pattern (centered on moldura area)
const GLOW_CONFIG: Record<string, { x: number; y: number; xVariance: number; yVariance: number }> = {
  // Triple column (3 adjacent cols)
  TRIPLE_COLUMN_1: { x: 110, y: 100, xVariance: 95, yVariance: 60 },
  TRIPLE_COLUMN_2: { x: 175, y: 100, xVariance: 95, yVariance: 60 },
  TRIPLE_COLUMN_3: { x: 240, y: 100, xVariance: 95, yVariance: 60 },
  // Quad column (4 adjacent cols)
  QUAD_COLUMN_1:   { x: 162, y: 100, xVariance: 130, yVariance: 60 },
  QUAD_COLUMN_2:   { x: 206, y: 100, xVariance: 130, yVariance: 60 },
  // Quad column 3 / double box (2x5 box)
  QUAD_COLUMN_3:   { x: 175, y: 100, xVariance: 160, yVariance: 60 },
  // Double line (2 rows, full width) — y is approximate, actual depends on which rows
  DOUBLE_LINE_1:   { x: 175, y: 56, xVariance: 170, yVariance: 25 },
  DOUBLE_LINE_2:   { x: 175, y: 102, xVariance: 170, yVariance: 25 },
  DOUBLE_LINE_3:   { x: 175, y: 102, xVariance: 170, yVariance: 25 },
  // Full / bingo
  FULL:            { x: 186, y: 100, xVariance: 180, yVariance: 60 },
}

export default function MissingBackground({ card }: Props) {
  const containerRef = useRef<Container>(null)

  const missingPatterns = useMemo(
    () => collectMissingPatterns(card),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card.maxMissingPriority, card.expectations],
  )

  const frames = useMemo(() => {
    const result: { key: string; zOrder: number; texture: string; x: number; y: number; scaleX: number; scaleY: number }[] = []
    for (const [name, info] of missingPatterns) {
      const config = MOLDURA_CONFIG[name]
      if (!config) continue

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
    result.sort((a, b) => a.zOrder - b.zOrder)
    return result
  }, [missingPatterns])

  // Find the highest-priority pattern that has glow
  const glowPattern = useMemo(() => {
    let best: { name: string; priority: number } | null = null
    for (const [name, info] of missingPatterns) {
      if (GLOW_CONFIG[name] && (!best || info.priority > best.priority)) {
        best = { name, priority: info.priority }
      }
    }
    return best?.name ?? null
  }, [missingPatterns])

  const glowCfg = glowPattern ? GLOW_CONFIG[glowPattern] : null

  // Particle glow — imperatively added to the card content container (parent
  // of this component's container). PixiJS 8 has a rendering issue with
  // imperatively-added children inside @pixi/react-managed containers at
  // deeper nesting levels; adding to the card content parent works.
  const particleContainer = useParticleEmitter({
    config: menton4colBright,
    active: !!glowCfg,
    x: glowCfg?.x ?? 0,
    y: glowCfg?.y ?? 0,
    emitterXVariance: glowCfg?.xVariance,
    emitterYVariance: glowCfg?.yVariance,
  })

  useEffect(() => {
    const myContainer = containerRef.current
    if (!myContainer || !glowCfg) return
    // Add to parent (card content container) just before our MissingBackground
    // container, so particles render behind molduras and MissingMark but on
    // top of card backgrounds and cell slots.
    // Note: must addChild to the card content parent (not our own container)
    // due to a PixiJS 8 + @pixi/react rendering quirk with nested containers.
    const cardContent = myContainer.parent
    if (!cardContent) return
    const myIndex = cardContent.getChildIndex(myContainer)
    // Insert right AFTER our MissingBackground container (molduras),
    // so particles render on top of molduras but behind marked cells/MissingMark.
    cardContent.addChildAt(particleContainer, myIndex + 1)
    return () => {
      if (particleContainer.parent === cardContent) {
        cardContent.removeChild(particleContainer)
      }
    }
  }, [particleContainer, glowCfg])

  if (frames.length === 0 && !glowCfg) return null

  return (
    <pixiContainer ref={containerRef}>
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
