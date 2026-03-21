import type { AssetsManifest } from 'pixi.js'

/**
 * Asset manifest for Menton.
 *
 * Organized by panel — each pluggable component has its own atlas.
 * Panel atlases are loaded upfront in menton-panels bundle.
 * MovieBytes atlases (for BingoMovie, BellRing, FruitBomb) stay in menton-movies.
 *
 * Format: 'ktx2' for WebGL/WebGPU (GPU compressed textures),
 *         'webp' for Canvas fallback (standard image decode).
 */

export type TextureFormat = 'ktx2' | 'webp'

const BASE = import.meta.env.BASE_URL

/** Spritesheet asset with optional imageFilename override for WebP fallback. */
function sheet(alias: string, format: TextureFormat) {
  const entry: { alias: string; src: string; data?: { imageFilename: string } } = {
    alias,
    src: `${BASE}assets/menton/${alias}.json`,
  }
  // JSON meta.image points to .ktx2 — override to .webp for Canvas renderer
  if (format === 'webp') {
    entry.data = { imageFilename: `${alias}.webp` }
  }
  return entry
}

export function createManifest(format: TextureFormat): AssetsManifest {
  return {
    bundles: [
      {
        name: 'menton-core',
        assets: [
          { alias: 'bgmenton', src: `${BASE}assets/menton/bgmenton.${format}` },
          // Particles (always PNG — small, no compression benefit)
          { alias: 'menton_4col_bright', src: `${BASE}assets/menton/particles/menton_4col_bright.png` },
          { alias: 'menton_pipoqueira_bbl', src: `${BASE}assets/menton/particles/menton_pipoqueira_bbl.png` },
          { alias: 'menton_chip_xplosion', src: `${BASE}assets/menton/particles/menton_chip_xplosion.png` },
          { alias: 'menton_lemon_xplosion', src: `${BASE}assets/menton/particles/menton_lemon_xplosion.png` },
          { alias: 'menton_water', src: `${BASE}assets/menton/particles/menton_water.png` },
        ],
      },
      {
        name: 'menton-panels',
        assets: [
          sheet('menton_ballpanel', format),
          sheet('menton_cardpanel', format),
          sheet('menton_pattern', format),
          sheet('menton_payoutpanel', format),
          sheet('menton_bellpanel', format),
          sheet('menton_jackpot', format),
          sheet('menton_button', format),
          sheet('menton_common', format),
        ],
      },
      {
        name: 'menton-movies',
        assets: [
          sheet('menton_bingo', format),
          sheet('menton_fruit', format),
          sheet('menton_juice', format),
        ],
      },
      // Future bundles:
      // { name: 'menton-bonus', assets: [...] },
      // { name: 'menton-audio', assets: [...] },
    ],
  }
}
