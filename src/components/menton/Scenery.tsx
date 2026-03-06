import { Sprite, Texture } from 'pixi.js'
import { extend } from '@pixi/react'
import { AssetManager } from '../../assets/AssetManager'

extend({ Sprite })

export const GAME_WIDTH = 760
export const GAME_HEIGHT = 1024

export default function Scenery() {
  const texture = AssetManager.get<Texture>('bgmenton')

  return (
    <pixiSprite
      texture={texture}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
    />
  )
}
