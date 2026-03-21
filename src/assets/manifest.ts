import type { AssetsManifest } from 'pixi.js'

/**
 * Asset manifest for Menton.
 *
 * Organized by panel — each pluggable component has its own atlas.
 * Panel atlases are loaded upfront in menton-panels bundle.
 * MovieBytes atlases (for BingoMovie, BellRing, FruitBomb) stay in menton-movies.
 */

const BASE = import.meta.env.BASE_URL

export const mentonManifest: AssetsManifest = {
  bundles: [
    {
      name: 'menton-core',
      assets: [
        { alias: 'bgmenton', src: `${BASE}assets/menton/bgmenton.ktx2` },
        // Particles
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
        { alias: 'menton_ballpanel', src: `${BASE}assets/menton/menton_ballpanel.json` },
        { alias: 'menton_cardpanel', src: `${BASE}assets/menton/menton_cardpanel.json` },
        { alias: 'menton_pattern', src: `${BASE}assets/menton/menton_pattern.json` },
        { alias: 'menton_payoutpanel', src: `${BASE}assets/menton/menton_payoutpanel.json` },
        { alias: 'menton_bellpanel', src: `${BASE}assets/menton/menton_bellpanel.json` },
        { alias: 'menton_jackpot', src: `${BASE}assets/menton/menton_jackpot.json` },
        { alias: 'menton_button', src: `${BASE}assets/menton/menton_button.json` },
        { alias: 'menton_common', src: `${BASE}assets/menton/menton_common.json` },
      ],
    },
    {
      name: 'menton-movies',
      assets: [
        { alias: 'menton_bingo', src: `${BASE}assets/menton/menton_bingo.json` },
        { alias: 'menton_fruit', src: `${BASE}assets/menton/menton_fruit.json` },
        { alias: 'menton_juice', src: `${BASE}assets/menton/menton_juice.json` },
      ],
    },
    // Future bundles:
    // { name: 'menton-bonus', assets: [...] },
    // { name: 'menton-audio', assets: [...] },
  ],
}
