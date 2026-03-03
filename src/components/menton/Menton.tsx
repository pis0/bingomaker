import { Container } from 'pixi.js'
import { extend } from '@pixi/react'
import Scenery from './Scenery'

extend({ Container })

export default function Menton() {
  return (
    <pixiContainer>
      <Scenery />
    </pixiContainer>
  )
}
