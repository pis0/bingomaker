import { Assets, Spritesheet, Texture } from 'pixi.js'

/** All panel atlases — searched in order by tex()/textures() */
const PANEL_ATLASES = [
  'menton_ballpanel',
  'menton_cardpanel',
  'menton_pattern',
  'menton_payoutpanel',
  'menton_bellpanel',
  'menton_jackpot',
  'menton_button',
  'menton_common',
]

/** Get a single texture, searching all panel atlases */
export function tex(name: string): Texture {
  for (const alias of PANEL_ATLASES) {
    const sheet = Assets.get<Spritesheet>(alias)
    if (sheet?.textures[name]) return sheet.textures[name]
  }
  throw new Error(`[atlas] texture "${name}" not found in any atlas`)
}

/** Get multiple textures matching a prefix, sorted (for animations) */
export function textures(prefix: string): Texture[] {
  for (const alias of PANEL_ATLASES) {
    const sheet = Assets.get<Spritesheet>(alias)
    if (!sheet) continue
    const matches = Object.keys(sheet.textures)
      .filter(k => k.startsWith(prefix))
      .sort()
    if (matches.length > 0) return matches.map(k => sheet.textures[k])
  }
  return []
}

/** Get a single texture from a specific named atlas */
export function texFrom(atlas: string, name: string): Texture {
  const sheet = Assets.get<Spritesheet>(atlas)
  const t = sheet?.textures[name]
  if (!t) throw new Error(`[atlas] texture "${name}" not found in ${atlas}`)
  return t
}

/** Get multiple textures matching a prefix from a named atlas, sorted */
export function texturesFrom(atlas: string, prefix: string): Texture[] {
  const sheet = Assets.get<Spritesheet>(atlas)
  if (!sheet) return []
  return Object.keys(sheet.textures)
    .filter(k => k.startsWith(prefix))
    .sort()
    .map(k => sheet.textures[k])
}
