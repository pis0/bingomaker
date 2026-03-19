import { Sprite, Container, BitmapText } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'

extend({ Sprite, Container, BitmapText })

interface Props {
  number: number
  x: number
  y: number
  extra?: boolean
}

/** AS3: Ball — single drawn ball with number text */
export default function Ball({ number, x, y, extra = false }: Props) {
  const textureName = extra ? 'extraball' : 'ball'
  const bitmapFont = extra ? 'ball-extra' : 'ball-regular'
  const fontSize = extra ? 29 : 24

  return (
    <pixiContainer x={x} y={y}>
      <pixiSprite texture={tex(textureName)} anchor={0.5} />
      <pixiBitmapText text={String(number)} style={{ fontFamily: bitmapFont, fontSize, fill: 0x4d371e }} anchor={0.5} />
    </pixiContainer>
  )
}
