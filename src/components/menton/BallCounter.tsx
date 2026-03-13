import { Text, TextStyle } from 'pixi.js'
import { extend } from '@pixi/react'
import { COUNTER_FONT, COUNTER_SIZE, COUNTER_COLOR, COUNTER_SHADOW } from './ballConstants'

extend({ Text })

const shadowStyle = new TextStyle({
  fontFamily: COUNTER_FONT,
  fontSize: COUNTER_SIZE,
  fill: COUNTER_SHADOW,
})

const labelStyle = new TextStyle({
  fontFamily: COUNTER_FONT,
  fontSize: COUNTER_SIZE,
  fill: COUNTER_COLOR,
})

interface Props {
  count: number
  x?: number
  y?: number
}

/** AS3: BallCounter — two-digit zero-padded counter with shadow */
export default function BallCounter({ count, x = 0, y = 0 }: Props) {
  const text = String(count).padStart(2, '0')

  return (
    <pixiContainer x={x} y={y}>
      <pixiText text={text} style={shadowStyle} anchor={0.5} y={2} />
      <pixiText text={text} style={labelStyle} anchor={0.5} />
    </pixiContainer>
  )
}
