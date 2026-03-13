import { useCallback } from 'react'
import { Sprite, Container, TextStyle } from 'pixi.js'
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
import Ball from './Ball'
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

interface Props {
  round: Round | null
}

/**
 * AS3: BallPanelMenton — Fase 1+2
 *
 * Layers (render order):
 * 1. bgextraball — background for extra area
 * 2. ballcontainer2 — rear tube
 * 3. Ball sprites (drawn balls in 2 rows)
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
export default function BallPanel({ round }: Props) {
  const ballCount = round?.currentBallIndex ?? 0
  const isIdle = !round || (round.draws.length === 0)
  const drawing = round && round.draws.length > 0

  // Regular draws only (first 30 balls)
  const regularDraws = round?.draws.filter((_d, i) => i < DEFAULT_BALLS) ?? []

  // Current ball number (last drawn)
  const currentBall = round && round.draws.length > 0
    ? round.draws[round.draws.length - 1].ball
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
      {/* 3. Ball sprites — drawn regular balls in final positions */}
      {regularDraws.map((draw, i) => {
        const pos = ballPosition(i)
        return <Ball key={i} number={draw.ball} x={pos.x} y={pos.y} />
      })}
      {/* 4. ballpipe */}
      <pixiSprite texture={tex('ballpipe')} x={PIPE_X} />
      {/* 5. BallCounter */}
      <BallCounter count={ballCount} x={COUNTER_X} y={COUNTER_Y} />
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
