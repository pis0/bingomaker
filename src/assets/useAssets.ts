import { useState, useEffect } from 'react'
import { Assets, Spritesheet, Texture } from 'pixi.js'
import { AssetManager } from './AssetManager'
import { createManifest } from './manifest'
import { installBitmapFonts } from './bitmapFonts'

export type AssetStatus = 'loading' | 'ready' | 'error'

const BUNDLES_TO_LOAD = ['menton-core', 'menton-panels', 'menton-movies']

const manifest = createManifest(AssetManager.format)

export function useAssets() {
  const [status, setStatus] = useState<AssetStatus>('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        await AssetManager.init(manifest)
        await Promise.all([
          AssetManager.loadBundle(BUNDLES_TO_LOAD, (p) => {
            if (!cancelled) setProgress(p)
          }),
          // Force font download — browser won't fetch @font-face until used in DOM
          document.fonts.load('normal 24px "Iowan Old Style Black"'),
          document.fonts.load('normal 24px "Iowan Old Style Bold"'),
          document.fonts.load('600 24px "Myriad Pro"'),
          document.fonts.load('bold 24px "Myriad Pro"'),
          document.fonts.load('normal 24px "Clarendon Black BT"'),
        ])
        // Fix KTX2 alpha: source PNGs are pre-multiplied before encoding,
        // tell PixiJS the compressed data is already premultiplied.
        // WebP textures are decoded by the browser (standard alpha) — skip.
        if (AssetManager.format === 'ktx2') {
          for (const bundle of BUNDLES_TO_LOAD) {
            const assets = manifest.bundles.find(b => b.name === bundle)?.assets as { alias: string }[] | undefined
            if (!assets) continue
            for (const asset of assets) {
              const alias = asset.alias
              const sheet = Assets.get<Spritesheet>(alias)
              if (sheet?.textureSource) {
                sheet.textureSource.alphaMode = 'premultiplied-alpha'
              }
              const tex = Assets.get<Texture>(alias)
              if (tex?.source && !sheet) {
                tex.source.alphaMode = 'premultiplied-alpha'
              }
            }
          }
        }
        // Generate BitmapFont atlases from loaded TTF fonts (runtime install)
        installBitmapFonts()
        if (!cancelled) setStatus('ready')
      } catch (err) {
        console.error('[AssetManager] Failed to load assets:', err)
        if (!cancelled) setStatus('error')
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { status, progress }
}
