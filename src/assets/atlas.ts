import { Assets, Spritesheet, Texture } from 'pixi.js'

const ATLAS_ALIAS = 'menton0'

/** Get a single texture from the menton0 spritesheet */
export function tex(name: string): Texture {
  const sheet = Assets.get<Spritesheet>(ATLAS_ALIAS)
  const t = sheet.textures[name]
  if (!t) throw new Error(`[atlas] texture "${name}" not found in ${ATLAS_ALIAS}`)
  return t
}

/** Get multiple textures matching a prefix, sorted by name (for animations) */
export function textures(prefix: string): Texture[] {
  const sheet = Assets.get<Spritesheet>(ATLAS_ALIAS)
  return Object.keys(sheet.textures)
    .filter(k => k.startsWith(prefix))
    .sort()
    .map(k => sheet.textures[k])
}
