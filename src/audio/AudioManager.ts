/**
 * AudioManager — Web Audio API wrapper with 3 channels.
 *
 * Channels:
 *   BG  — 1 looping source, fade transitions between tracks
 *   VO  — 1 exclusive source (new cancels previous)
 *   SFX — N parallel sources, fire-and-forget
 *
 * All sounds are pre-decoded to AudioBuffers during preload.
 * AudioContext is created once and resumed on first user gesture.
 */

import { ALL_SOUND_URLS } from './SoundID'

// ── Types ────────────────────────────────────────────────────────

export interface PlayOptions {
  /** Volume 0–1 (default 1) */
  volume?: number
  /** Loop indefinitely (default false) */
  loop?: boolean
  /** Callback when playback ends (not called for looping sounds) */
  onEnd?: () => void
}

interface ActiveSource {
  source: AudioBufferSourceNode
  gain: GainNode
}

// ── Singleton ────────────────────────────────────────────────────

let ctx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()

// Channel gains
let masterGain: GainNode
let bgGain: GainNode
let sfxGain: GainNode
let voGain: GainNode

// Active sources
let bgActive: ActiveSource | null = null
let voActive: ActiveSource | null = null
let bgCurrentUrl: string | null = null
let bgVolume = 0.6

// Mute state
let _musicEnabled = true
let _sfxEnabled = true

// ── Init & Preload ───────────────────────────────────────────────

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    // Routing: source → channelGain → masterGain → destination
    masterGain = ctx.createGain()
    masterGain.connect(ctx.destination)
    bgGain = ctx.createGain()
    bgGain.connect(masterGain)
    sfxGain = ctx.createGain()
    sfxGain.connect(masterGain)
    voGain = ctx.createGain()
    voGain.connect(masterGain)
  }
  return ctx
}

/**
 * Resume AudioContext — must be called from a user gesture (tap/click).
 * Safe to call multiple times; no-op if already running.
 * Starts pending BG music that was requested while suspended.
 */
export async function resumeAudio(): Promise<void> {
  const c = getContext()
  if (c.state === 'suspended') {
    await c.resume()
    // Start BG that was requested while context was suspended
    if (bgCurrentUrl && _musicEnabled && !bgActive) {
      const url = bgCurrentUrl
      bgCurrentUrl = null
      playBG(url, bgVolume)
    }
  }
}

/**
 * Preload all sounds — fetches and decodes all MP3s into AudioBuffers.
 * Call during asset loading phase. Returns progress 0–1 via callback.
 */
export async function preloadSounds(
  onProgress?: (progress: number) => void,
): Promise<void> {
  const c = getContext()
  const urls = ALL_SOUND_URLS
  let loaded = 0

  // Fetch + decode in batches of 8 to avoid overwhelming the network
  const BATCH = 8
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (url) => {
        if (buffers.has(url)) { loaded++; return }
        try {
          const res = await fetch(url)
          const arrayBuf = await res.arrayBuffer()
          const audioBuf = await c.decodeAudioData(arrayBuf)
          buffers.set(url, audioBuf)
        } catch (err) {
          console.warn(`[AudioManager] Failed to load: ${url}`, err)
        }
        loaded++
        onProgress?.(loaded / urls.length)
      }),
    )
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function createSource(
  url: string,
  channelGain: GainNode,
  opts: PlayOptions = {},
): ActiveSource | null {
  const buffer = buffers.get(url)
  if (!buffer || !ctx) return null

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = opts.loop ?? false

  const gain = ctx.createGain()
  gain.gain.value = opts.volume ?? 1
  source.connect(gain)
  gain.connect(channelGain)

  return { source, gain }
}

// ── BG Channel ───────────────────────────────────────────────────

/**
 * Play background music. Loops indefinitely.
 * If already playing the same track, no-op.
 * If playing a different track, crossfades.
 */
export function playBG(url: string, volume = 0.6, fadeDuration = 1): void {
  bgVolume = volume
  if (!_musicEnabled) { bgCurrentUrl = url; return }
  if (bgCurrentUrl === url && bgActive) return

  // If context is suspended, just store intent — resumeAudio() will start it
  if (ctx?.state === 'suspended') { bgCurrentUrl = url; return }

  // Stop previous with fade
  stopBG(fadeDuration)
  bgCurrentUrl = url

  const active = createSource(url, bgGain, { loop: true, volume })
  if (!active) return
  bgActive = active
  active.source.start()
}

/** Stop background music with optional fade out. */
export function stopBG(fadeDuration = 0.5): void {
  if (!bgActive || !ctx) return
  const { source, gain } = bgActive
  bgActive = null

  if (fadeDuration > 0) {
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeDuration)
    source.stop(ctx.currentTime + fadeDuration)
  } else {
    source.stop()
  }
}

/** Set BG volume with smooth transition. */
export function setBGVolume(volume: number, duration = 0.3): void {
  if (!bgActive || !ctx) return
  bgActive.gain.gain.setValueAtTime(bgActive.gain.gain.value, ctx.currentTime)
  bgActive.gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + duration)
}

// ── SFX Channel ──────────────────────────────────────────────────

/**
 * Play a sound effect. Fire-and-forget, multiple can play simultaneously.
 * Returns a stop function to cancel early if needed.
 */
export function playSFX(url: string, opts: PlayOptions = {}): (() => void) | null {
  if (!_sfxEnabled) return null

  const active = createSource(url, sfxGain, opts)
  if (!active) return null

  if (opts.onEnd) {
    active.source.onended = opts.onEnd
  }
  active.source.start()

  return () => {
    try { active.source.stop() } catch { /* already stopped */ }
  }
}

// ── VO Channel ───────────────────────────────────────────────────

/**
 * Play a voice-over. Exclusive: new VO stops the previous one.
 * For random variant, pass an array and one is picked at random.
 */
// Mute state — VO has its own flag, independent of SFX
let _voEnabled = true

export function playVO(urlOrUrls: string | string[], opts: PlayOptions = {}): void {
  if (!_voEnabled) return

  // Pick random variant if array
  const url = Array.isArray(urlOrUrls)
    ? urlOrUrls[Math.floor(Math.random() * urlOrUrls.length)]
    : urlOrUrls

  // Stop previous VO
  stopVO()

  const active = createSource(url, voGain, opts)
  if (!active) return
  voActive = active

  active.source.onended = () => {
    if (voActive?.source === active.source) voActive = null
    opts.onEnd?.()
  }
  active.source.start()
}

/** Stop current voice-over immediately. */
export function stopVO(): void {
  if (!voActive) return
  try { voActive.source.stop() } catch { /* already stopped */ }
  voActive = null
}

// ── Global Controls ──────────────────────────────────────────────

/** Enable/disable background music. */
export function setMusicEnabled(enabled: boolean): void {
  _musicEnabled = enabled
  if (!enabled) {
    stopBG(0.5)
  } else if (bgCurrentUrl) {
    playBG(bgCurrentUrl)
  }
}

/** Enable/disable SFX. */
export function setSFXEnabled(enabled: boolean): void {
  _sfxEnabled = enabled
}

/** Enable/disable VO (independent channel). */
export function setVOEnabled(enabled: boolean): void {
  _voEnabled = enabled
  if (!enabled) stopVO()
}

/** Check if music is enabled. */
export function isMusicEnabled(): boolean { return _musicEnabled }

/** Check if SFX is enabled. */
export function isSFXEnabled(): boolean { return _sfxEnabled }

/** Set master volume (affects all channels). */
export function setMasterVolume(volume: number): void {
  if (masterGain) masterGain.gain.value = volume
}

/** Stop everything. */
export function stopAll(): void {
  stopBG(0)
  stopVO()
  // SFX are fire-and-forget — they'll end naturally
}

/** Get a preloaded AudioBuffer duration in seconds. Returns 0 if not loaded. */
export function getDuration(url: string): number {
  return buffers.get(url)?.duration ?? 0
}

/** Check if a URL has been preloaded. */
export function isLoaded(url: string): boolean {
  return buffers.has(url)
}
