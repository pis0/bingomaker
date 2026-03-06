import { Container } from 'pixi.js'
import { extend } from '@pixi/react'
import Scenery from './Scenery'
import CardPanel from './CardPanel'
import type { Round } from '../../engine/Round'

extend({ Container })

interface Props {
  round: Round | null
  stakeIndex?: number
}

export default function Menton({ round, stakeIndex = 0 }: Props) {
  return (
    <pixiContainer>
      <Scenery />
      {round && <CardPanel round={round} stakeIndex={stakeIndex} />}
    </pixiContainer>
  )
}
