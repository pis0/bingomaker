import { useCallback, useEffect, useRef, useState } from 'react'
import { Sprite, Container, TextStyle, Ticker } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { BALL_PANEL_X, BALL_PANEL_Y } from './layoutConstants'
import {
  TUBING_Y,
  PIPE_X,
  EXTRA_FRONT_Y,
  BG_EXTRA_X,
  FUNDO_Y,
  TAMPA_Y,
  COVER_X, COVER_Y, COVER_PIVOT_X, COVER_PIVOT_Y,
  IDLE_CONTAINER_X, IDLE_CONTAINER_Y,
  IDLE_LEMON_X, IDLE_LEMON_Y,
  COUNTER_X, COUNTER_Y,
  LARGE_BALL_X, LARGE_BALL_Y,
  ROW_0_Y, ROW_1_Y,
  ROW_0_START_X, ROW_1_START_X,
  BALL_SPACING, BALL_ROW_SIZE,
  BALL_FONT, BALL_TEXT_COLOR,
} from './ballConstants'
import BallCounter from './BallCounter'
import AnimatedBall from './AnimatedBall'
import IdleLemon from './IdleLemon'
import { DEFAULT_BALLS } from '../../engine/constants'
import type { Round } from '../../engine/Round'

extend({ Sprite, Container })

// Large ball text style (AS3: fontSize:50, color:0x4d371e, letterSpacing:-2)
const largeBallStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: 50,
  fill: BALL_TEXT_COLOR,
  letterSpacing: -2,
})

/** Compute final x,y for a regular ball at draw index (0-29) */
function ballPosition(index: number): { x: number; y: number } {
  const row = Math.floor(index / BALL_ROW_SIZE)
  const col = index % BALL_ROW_SIZE
  const startX = row === 0 ? ROW_0_START_X : ROW_1_START_X
  const y = row === 0 ? ROW_0_Y : ROW_1_Y
  return { x: startX - BALL_SPACING * col, y }
}

/** Frames between consecutive ball launches */
const LAUNCH_INTERVAL = 5

interface Props {
  round: Round | null
  onBallArrive?: (ball: number) => void
}

/**
 * AS3: BallPanelMenton — Fase 1+2+3 (structure + balls + animation)
 *
 * Layers (render order):
 * 1. bgextraball — background for extra area
 * 2. ballcontainer2 — rear tube
 * 3. AnimatedBall sprites (drawn balls with path animation)
 * 4. ballpipe — pipe tip
 * 5. BallCounter — "00"..."30"
 * 6. ballcontainer1 — front tube
 * 7. Extra front container:
 *    - fundopipoqueira
 *    - IdleLemon (between fundo and tampa for correct z-order)
 *    - tampapipoqueira
 *    - Large ball (current ball number)
 *    - bigballpipe2 (cover, closed)
 */
export default function BallPanel({ round, onBallArrive }: Props) {
  const isIdle = !round || (round.draws.length === 0)

  // Regular draws only (first 30 balls)
  const regularDraws = round?.draws.filter((_d, i) => i < DEFAULT_BALLS) ?? []
  const drawCount = regularDraws.length

  // ── Animation queue ──────────────────────────────────────────────
  const [launchedIndices, setLaunchedIndices] = useState<number[]>([])
  const processedCountRef = useRef(0)
  const queueRef = useRef<number[]>([])

  // Detect new draws / undo / reset
  useEffect(() => {
    if (drawCount === 0) {
      // Reset (new round or no round)
      processedCountRef.current = 0
      queueRef.current = []
      setLaunchedIndices([])
    } else if (drawCount > processedCountRef.current) {
      // New draws → queue them
      for (let i = processedCountRef.current; i < drawCount; i++) {
        queueRef.current.push(i)
      }
      processedCountRef.current = drawCount
    } else if (drawCount < processedCountRef.current) {
      // Undo → remove excess
      processedCountRef.current = drawCount
      queueRef.current = queueRef.current.filter(i => i < drawCount)
      setLaunchedIndices(prev => prev.filter(i => i < drawCount))
    }
  }, [drawCount])

  // Process queue via ticker — launch balls with inter-ball delay
  useEffect(() => {
    let framesSinceLaunch = LAUNCH_INTERVAL // pre-fill so first ball launches immediately
    const ticker = Ticker.shared
    const onTick = () => {
      if (queueRef.current.length === 0) return
      framesSinceLaunch++
      if (framesSinceLaunch >= LAUNCH_INTERVAL) {
        framesSinceLaunch = 0
        const next = queueRef.current.shift()!
        setLaunchedIndices(prev => [...prev, next])
      }
    }
    ticker.add(onTick)
    return () => { ticker.remove(onTick) }
  }, [])

  // ── Derived state from animation ────────────────────────────────
  const drawing = launchedIndices.length > 0
  const ballCount = launchedIndices.length
  const currentBall = drawing
    ? regularDraws[launchedIndices[launchedIndices.length - 1]]?.ball ?? 0
    : 0

  // Ref callback to set pivot on cover sprite
  const coverRef = useCallback((sprite: Sprite | null) => {
    if (sprite) sprite.pivot.set(COVER_PIVOT_X, COVER_PIVOT_Y)
  }, [])

  return (
    <pixiContainer x={BALL_PANEL_X} y={BALL_PANEL_Y}>
      {/* 1. bgextraball */}
      <pixiSprite texture={tex('bgextraball')} x={BG_EXTRA_X} y={EXTRA_FRONT_Y} />
      {/* 2. ballcontainer2 — rear tube */}
      <pixiSprite texture={tex('ballcontainer2')} y={TUBING_Y} />
      {/* 3. Animated Ball sprites — launched from pipe, roll to final position */}
      {launchedIndices.map(i => {
        const draw = regularDraws[i]
        if (!draw) return null
        const pos = ballPosition(i)
        return (
          <AnimatedBall
            key={i}
            number={draw.ball}
            finalX={pos.x}
            y={pos.y}
            index={i}
            onArrive={() => onBallArrive?.(draw.ball)}
          />
        )
      })}
      {/* 4. ballpipe */}
      <pixiSprite texture={tex('ballpipe')} x={PIPE_X} />
      {/* 5. BallCounter — hidden during idle */}
      {drawing && <BallCounter count={ballCount} x={COUNTER_X} y={COUNTER_Y} />}
      {/* 6. ballcontainer1 — front tube */}
      <pixiSprite texture={tex('ballcontainer1')} y={TUBING_Y} />
      {/* 7. Extra front container (pipoqueira) */}
      <pixiContainer y={EXTRA_FRONT_Y}>
        <pixiSprite texture={tex('fundopipoqueira')} y={FUNDO_Y} />
        <IdleLemon
          active={isIdle}
          x={IDLE_CONTAINER_X + IDLE_LEMON_X}
          y={IDLE_CONTAINER_Y + IDLE_LEMON_Y}
        />
        <pixiSprite texture={tex('tampapipoqueira')} y={TAMPA_Y} />
        {/* Large ball — shows current ball number during drawing */}
        {drawing && currentBall > 0 && (
          <pixiContainer x={LARGE_BALL_X} y={LARGE_BALL_Y}>
            <pixiSprite texture={tex('bigballv2')} />
            <pixiText
              text={String(currentBall)}
              style={largeBallStyle}
              anchor={0.5}
              x={42}
              y={42}
            />
          </pixiContainer>
        )}
        <pixiSprite
          ref={coverRef}
          texture={tex('bigballpipe2')}
          x={COVER_X}
          y={COVER_Y}
        />
      </pixiContainer>
    </pixiContainer>
  )
}
