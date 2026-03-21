import { Assets, type AssetsManifest, type ProgressCallback } from 'pixi.js'
import { setKTXTranscoderPath } from 'pixi.js'
import 'pixi.js/ktx2'
import type { TextureFormat } from './manifest'

let initPromise: Promise<void> | null = null
let _format: TextureFormat = 'ktx2'

/** Detect if GPU rendering is available (WebGL/WebGPU). If not → Canvas → WebP. */
function detectTextureFormat(): TextureFormat {
  // WebGPU check
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) return 'ktx2'

  // WebGL check
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (gl) {
      // Clean up the test context
      const ext = gl.getExtension('WEBGL_lose_context')
      ext?.loseContext()
      return 'ktx2'
    }
  } catch { /* no WebGL */ }

  console.warn('[AssetManager] No WebGL/WebGPU — falling back to WebP textures')
  return 'webp'
}

export const AssetManager = {
  /** Detected texture format ('ktx2' for GPU, 'webp' for Canvas fallback). */
  get format(): TextureFormat { return _format },

  async init(manifest: AssetsManifest) {
    if (!initPromise) {
      // Self-host KTX2 transcoder (avoid CDN dependency in WebView)
      if (_format === 'ktx2') {
        setKTXTranscoderPath({
          jsUrl: `${import.meta.env.BASE_URL}transcoders/ktx/libktx.js`,
          wasmUrl: `${import.meta.env.BASE_URL}transcoders/ktx/libktx.wasm`,
        })
      }
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

// Detect once at module load
_format = detectTextureFormat()
