import { useCallback } from 'react'
import { Sprite, Container } from 'pixi.js'
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
} from './ballConstants'
import BallCounter from './BallCounter'
import IdleLemon from './IdleLemon'
import type { Round } from '../../engine/Round'

extend({ Sprite, Container })

interface Props {
  round: Round | null
}

/**
 * AS3: BallPanelMenton — Fase 1 (static structure + IdleLemon + BallCounter)
 *
 * Layers (render order):
 * 1. bgextraball — background for extra area
 * 2. ballcontainer2 — rear tube
 * 3. (ball container — Fase 2)
 * 4. ballpipe — pipe tip
 * 5. BallCounter — "00"..."30"
 * 6. ballcontainer1 — front tube
 * 7. Extra front container:
 *    - fundopipoqueira
 *    - IdleLemon (between fundo and tampa for correct z-order)
 *    - tampapipoqueira
 *    - bigballpipe2 (cover, closed)
 */
export default function BallPanel({ round }: Props) {
  const ballCount = round?.currentBallIndex ?? 0
  const isIdle = !round || (round.draws.length === 0)

  // Ref callback to set pivot on cover sprite (can't set ObservablePoint via JSX prop)
  const coverRef = useCallback((sprite: Sprite | null) => {
    if (sprite) sprite.pivot.set(COVER_PIVOT_X, COVER_PIVOT_Y)
  }, [])

  return (
    <pixiContainer x={BALL_PANEL_X} y={BALL_PANEL_Y}>
      {/* 1. bgextraball */}
      <pixiSprite texture={tex('bgextraball')} x={BG_EXTRA_X} y={EXTRA_FRONT_Y} />
      {/* 2. ballcontainer2 — rear tube */}
      <pixiSprite texture={tex('ballcontainer2')} y={TUBING_Y} />
      {/* 3. ball container — Fase 2 */}
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
