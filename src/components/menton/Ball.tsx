import { Sprite, Container, TextStyle } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { BALL_FONT, BALL_TEXT_COLOR, BALL_NORMAL_SIZE, BALL_EXTRA_SIZE } from './ballConstants'

extend({ Sprite, Container })

const normalStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: BALL_NORMAL_SIZE,
  fill: BALL_TEXT_COLOR,
})

const extraStyle = new TextStyle({
  fontFamily: BALL_FONT,
  fontSize: BALL_EXTRA_SIZE,
  fill: BALL_TEXT_COLOR,
})

interface Props {
  number: number
  x: number
  y: number
  extra?: boolean
}

/** AS3: Ball — single drawn ball with number text */
export default function Ball({ number, x, y, extra = false }: Props) {
  const textureName = extra ? 'extraball' : 'ball'
  const style = extra ? extraStyle : normalStyle

  return (
    <pixiContainer x={x} y={y}>
      <pixiSprite texture={tex(textureName)} anchor={0.5} />
      <pixiText text={String(number)} style={style} anchor={0.5} />
    </pixiContainer>
  )
}
