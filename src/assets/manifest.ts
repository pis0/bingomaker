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
      ],
    },
    // Future bundles:
    // { name: 'menton-bonus', assets: [...] },
    // { name: 'menton-audio', assets: [...] },
  ],
}
