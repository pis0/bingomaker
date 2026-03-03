import { useState, useEffect } from 'react'
import { Assets, Sprite, Texture } from 'pixi.js'
import { extend } from '@pixi/react'

extend({ Sprite })

export const GAME_WIDTH = 760
export const GAME_HEIGHT = 1024

const BG_URL = '/assets/menton/bgmenton.webp'

export default function Scenery() {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    Assets.load<Texture>(BG_URL).then(setTexture)
  }, [])

  if (!texture) return null

  return (
    <pixiSprite
      texture={texture}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
    />
  )
}
