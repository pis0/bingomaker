import { useState, useEffect } from 'react'
import { AssetManager } from './AssetManager'
import { mentonManifest } from './manifest'

export type AssetStatus = 'loading' | 'ready' | 'error'

const BUNDLES_TO_LOAD = ['menton-core', 'menton-movies']

export function useAssets() {
  const [status, setStatus] = useState<AssetStatus>('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        await AssetManager.init(mentonManifest)
        await Promise.all([
          AssetManager.loadBundle(BUNDLES_TO_LOAD, (p) => {
            if (!cancelled) setProgress(p)
          }),
          // Force font download — browser won't fetch @font-face until used in DOM
          document.fonts.load('normal 24px "Iowan Old Style Black"'),
          document.fonts.load('normal 24px "Iowan Old Style Bold"'),
          document.fonts.load('600 24px "Myriad Pro"'),
          document.fonts.load('bold 24px "Myriad Pro"'),
        ])
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
