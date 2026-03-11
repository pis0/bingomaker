import type { AssetsManifest } from 'pixi.js'

/**
 * Asset manifest for Menton.
 *
 * Bundles group assets by usage so we can load them in stages if needed.
 * For now we load everything upfront ("menton-core" bundle).
 *
 * To add assets: just add entries to the appropriate bundle's `assets` array.
 * The `alias` is what you use with Assets.get('alias') to retrieve the loaded asset.
 */

export const mentonManifest: AssetsManifest = {
  bundles: [
    {
      name: 'menton-core',
      assets: [
        { alias: 'bgmenton', src: '/assets/menton/bgmenton.webp' },
        { alias: 'menton0', src: '/assets/menton/menton0.json' },
        { alias: 'menton_4col_bright', src: '/assets/menton/particles/menton_4col_bright.png' },
        { alias: 'menton_pipoqueira_bbl', src: '/assets/menton/particles/menton_pipoqueira_bbl.png' },
        { alias: 'menton_chip_xplosion', src: '/assets/menton/particles/menton_chip_xplosion.png' },
        { alias: 'menton_lemon_xplosion', src: '/assets/menton/particles/menton_lemon_xplosion.png' },
      ],
    },
    {
      name: 'menton-movies',
      assets: [
        { alias: 'menton_bingo', src: '/assets/menton/menton_bingo.json' },
        { alias: 'menton_bell', src: '/assets/menton/menton_bell.json' },
      ],
    },
    // Future bundles:
    // { name: 'menton-bonus', assets: [...] },
    // { name: 'menton-audio', assets: [...] },
  ],
}
