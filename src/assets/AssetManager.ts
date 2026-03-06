import { Assets, type AssetsManifest, type ProgressCallback } from 'pixi.js'

let initPromise: Promise<void> | null = null

export const AssetManager = {
  async init(manifest: AssetsManifest) {
    if (!initPromise) {
      initPromise = Assets.init({ manifest })
    }
    return initPromise
  },

  async loadBundle(
    bundleIds: string | string[],
    onProgress?: ProgressCallback,
  ) {
    return Assets.loadBundle(bundleIds, onProgress)
  },

  get<T>(alias: string): T {
    return Assets.get<T>(alias)
  },
}
