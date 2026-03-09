import { Container } from 'pixi.js'
import { extend } from '@pixi/react'
import Scenery from './Scenery'
import CardPanel from './CardPanel'
import PayoutTable from './PayoutTable'
import type { Round } from '../../engine/Round'
import { STAKE_LEVELS } from '../../engine/constants'

extend({ Container })

interface Props {
  round: Round | null
  stakeIndex?: number
}

export default function Menton({ round, stakeIndex = 0 }: Props) {
  const stake = STAKE_LEVELS[stakeIndex]

  return (
    <pixiContainer>
      <Scenery />
      <PayoutTable round={round} stake={stake} />
      <CardPanel round={round} stakeIndex={stakeIndex} />
    </pixiContainer>
  )
}
