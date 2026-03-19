import { BitmapText } from 'pixi.js'
import { extend } from '@pixi/react'

extend({ BitmapText })

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
      <pixiBitmapText text={text} style={{ fontFamily: 'counter-shadow', fontSize: 25, fill: 0x37393c }} anchor={0.5} y={2} />
      <pixiBitmapText text={text} style={{ fontFamily: 'counter-label', fontSize: 25, fill: 0xc1c0ae }} anchor={0.5} />
    </pixiContainer>
  )
}
