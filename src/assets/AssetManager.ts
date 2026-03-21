import { Assets, type AssetsManifest, type ProgressCallback } from 'pixi.js'
import { setKTXTranscoderPath } from 'pixi.js'
import 'pixi.js/ktx2'

let initPromise: Promise<void> | null = null

export const AssetManager = {
  async init(manifest: AssetsManifest) {
    if (!initPromise) {
      // Self-host KTX2 transcoder (avoid CDN dependency in WebView)
      setKTXTranscoderPath({
        jsUrl: `${import.meta.env.BASE_URL}transcoders/ktx/libktx.js`,
        wasmUrl: `${import.meta.env.BASE_URL}transcoders/ktx/libktx.wasm`,
      })
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
