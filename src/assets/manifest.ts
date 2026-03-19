import type { AssetsManifest } from 'pixi.js'

/**
 * Asset manifest for Menton.
 *
 * Organized by panel — each pluggable component has its own atlas.
 * Panel atlases are loaded upfront in menton-panels bundle.
 * MovieBytes atlases (for BingoMovie, BellRing, FruitBomb) stay in menton-movies.
 */

export const mentonManifest: AssetsManifest = {
  bundles: [
    {
      name: 'menton-core',
      assets: [
        { alias: 'bgmenton', src: '/assets/menton/bgmenton.webp' },
        // Particles
        { alias: 'menton_4col_bright', src: '/assets/menton/particles/menton_4col_bright.png' },
        { alias: 'menton_pipoqueira_bbl', src: '/assets/menton/particles/menton_pipoqueira_bbl.png' },
        { alias: 'menton_chip_xplosion', src: '/assets/menton/particles/menton_chip_xplosion.png' },
        { alias: 'menton_lemon_xplosion', src: '/assets/menton/particles/menton_lemon_xplosion.png' },
        { alias: 'menton_water', src: '/assets/menton/particles/menton_water.png' },
      ],
    },
    {
      name: 'menton-panels',
      assets: [
        { alias: 'menton_ballpanel', src: '/assets/menton/menton_ballpanel.json' },
        { alias: 'menton_cardpanel', src: '/assets/menton/menton_cardpanel.json' },
        { alias: 'menton_pattern', src: '/assets/menton/menton_pattern.json' },
        { alias: 'menton_payoutpanel', src: '/assets/menton/menton_payoutpanel.json' },
        { alias: 'menton_bellpanel', src: '/assets/menton/menton_bellpanel.json' },
        { alias: 'menton_jackpot', src: '/assets/menton/menton_jackpot.json' },
        { alias: 'menton_button', src: '/assets/menton/menton_button.json' },
        { alias: 'menton_common', src: '/assets/menton/menton_common.json' },
      ],
    },
    {
      name: 'menton-movies',
      assets: [
        { alias: 'menton_bingo', src: '/assets/menton/menton_bingo.json' },
        { alias: 'menton_fruit', src: '/assets/menton/menton_fruit.json' },
      ],
    },
    // Future bundles:
    // { name: 'menton-bonus', assets: [...] },
    // { name: 'menton-audio', assets: [...] },
  ],
}
