import { useState, useEffect, useCallback } from 'react'
import { Assets, Spritesheet, Texture } from 'pixi.js'
import { AssetManager } from './AssetManager'
import { createManifest } from './manifest'
import { installBitmapFonts } from './bitmapFonts'
import { preloadSounds } from '../audio/AudioManager'

export type AssetStatus = 'loading' | 'ready' | 'error'

const BUNDLES_TO_LOAD = ['menton-core', 'menton-panels', 'menton-movies']

const manifest = createManifest(AssetManager.format)

/** Max retries within a single page load before forcing a reload. */
const MAX_RETRIES = 2

/** Max full page reloads before giving up with an error screen. */
const MAX_RELOADS = 1

const RELOAD_COUNT_KEY = 'bingomaker_reload_count'

/** Font specs that must pass document.fonts.check() before proceeding. */
const REQUIRED_FONTS = [
  'normal 24px "Iowan Old Style Black"',
  'normal 24px "Iowan Old Style Bold"',
  '600 24px "Myriad Pro"',
  'bold 24px "Myriad Pro"',
  'normal 24px "Clarendon Black BT"',
] as const

/** All asset aliases that must be present in PixiJS cache. */
function getRequiredAliases(): string[] {
  return manifest.bundles.flatMap(
    b => (b.assets as { alias: string }[]).map(a => a.alias),
  )
}

// ── Verification helpers ────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

function verifyFonts(): string[] {
  const missing: string[] = []
  for (const spec of REQUIRED_FONTS) {
    if (!document.fonts.check(spec)) missing.push(spec)
  }
  return missing
}

/**
 * Some WebViews report fonts as not ready immediately after
 * document.fonts.ready resolves. Poll a few times before giving up.
 */
async function verifyFontsWithGrace(maxPolls = 10, intervalMs = 300): Promise<string[]> {
  for (let i = 0; i < maxPolls; i++) {
    const missing = verifyFonts()
    if (missing.length === 0) return []
    // Re-trigger load for missing fonts each poll
    await Promise.all(missing.map(spec => document.fonts.load(spec)))
    await document.fonts.ready
    if (i < maxPolls - 1) await delay(intervalMs)
  }
  return verifyFonts()
}

function verifyAssets(): string[] {
  const missing: string[] = []
  for (const alias of getRequiredAliases()) {
    const res = Assets.get<Spritesheet | Texture>(alias)
    if (!res) missing.push(alias)
  }
  return missing
}

// ── Fix KTX2 premultiplied alpha ────────────────────────────────

function fixKtx2Alpha() {
  if (AssetManager.format !== 'ktx2') return
  for (const alias of getRequiredAliases()) {
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

// ── Hook ────────────────────────────────────────────────────────

export function useAssets() {
  const [status, setStatus] = useState<AssetStatus>('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    let attempt = 0

    async function load() {
      attempt++
      const tag = `[Preloader] attempt ${attempt}/${MAX_RETRIES + 1}`

      try {
        // 1. Init PixiJS asset registry
        await AssetManager.init(manifest)

        // 2. Load bundles + fonts + audio in parallel
        await Promise.all([
          AssetManager.loadBundle(BUNDLES_TO_LOAD, (p) => {
            if (!cancelled) setProgress(p * 0.85) // visual assets = 85% of bar
          }),
          ...REQUIRED_FONTS.map(spec => document.fonts.load(spec)),
          preloadSounds((p) => {
            if (!cancelled) setProgress(0.85 + p * 0.15) // audio = last 15%
          }),
        ])

        // 3. Global font gate — waits for all font-face layout to settle
        await document.fonts.ready

        // 4. Verify everything actually loaded (with grace period for WebView timing)
        const missingFonts = await verifyFontsWithGrace()
        const missingAssets = verifyAssets()

        if (missingFonts.length || missingAssets.length) {
          if (missingFonts.length) console.warn(`${tag} missing fonts:`, missingFonts)
          if (missingAssets.length) console.warn(`${tag} missing assets:`, missingAssets)
          throw new Error(`Missing: ${missingFonts.length} fonts, ${missingAssets.length} assets`)
        }

        // 5. Post-processing
        fixKtx2Alpha()
        installBitmapFonts()

        console.log(`${tag} ✔ all assets verified`)
        // Loading succeeded — clear reload counter
        try { sessionStorage.removeItem(RELOAD_COUNT_KEY) } catch { /* WebView may block sessionStorage */ }
        if (!cancelled) setStatus('ready')

      } catch (err) {
        console.error(`${tag} failed:`, err)

        if (cancelled) return

        if (attempt <= MAX_RETRIES) {
          console.log(`${tag} retrying in 1s…`)
          setProgress(0)
          await delay(1000)
          if (cancelled) return
          load()
        } else {
          // Retries exhausted — check if we can still reload
          let reloads = 0
          try { reloads = Number(sessionStorage.getItem(RELOAD_COUNT_KEY) || '0') } catch { /* noop */ }

          if (reloads < MAX_RELOADS) {
            try { sessionStorage.setItem(RELOAD_COUNT_KEY, String(reloads + 1)) } catch { /* noop */ }
            console.error(`[Preloader] reloading page (reload ${reloads + 1}/${MAX_RELOADS})`)
            window.location.reload()
          } else {
            // Truly unrecoverable — show error
            console.error('[Preloader] all recovery attempts exhausted')
            setStatus('error')
          }
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const retry = useCallback(() => {
    // Manual retry from error screen — reset reload counter and start fresh
    try { sessionStorage.removeItem(RELOAD_COUNT_KEY) } catch { /* noop */ }
    window.location.reload()
  }, [])

  return { status, progress, retry }
}
