import { useRef, useEffect } from 'react'
import { Assets, Container, Texture, Ticker } from 'pixi.js'
import { ParticleEmitter } from './ParticleEmitter'
import type { ParticleConfig } from './types'

interface EmitterOptions {
  config: ParticleConfig
  /** Whether the emitter should be active */
  active: boolean
  /** Emitter position */
  x?: number
  y?: number
  /** Override position variance */
  emitterXVariance?: number
  emitterYVariance?: number
}

/** React hook that manages a ParticleEmitter lifecycle.
 *  Returns the emitter's Container to be added to the scene. */
export function useParticleEmitter(opts: EmitterOptions) {
  // Lazy-init imperative emitter object. This is an imperative resource
  // (like a WebSocket or AudioContext) — useRef is the correct pattern.
  const emitterRef = useRef<ParticleEmitter | null>(null)
  if (emitterRef.current == null) {
    const texture = Assets.get<Texture>(opts.config.texture) ?? Texture.WHITE
    emitterRef.current = new ParticleEmitter(opts.config, texture)
  }
  // Stable container reference — set once during initialization, never changes.
  // eslint-disable-next-line react-hooks/refs
  const containerRef = useRef<Container>(emitterRef.current.container)

  // Update position, variance, and start/stop based on active flag
  useEffect(() => {
    const emitter = emitterRef.current
    if (!emitter) return

    emitter.emitterX = opts.x ?? 0
    emitter.emitterY = opts.y ?? 0
    if (opts.emitterXVariance !== undefined) emitter.emitterXVariance = opts.emitterXVariance
    if (opts.emitterYVariance !== undefined) emitter.emitterYVariance = opts.emitterYVariance

    if (opts.active) {
      emitter.start(Ticker.shared)
    } else {
      emitter.stop()
    }
  }, [opts.active, opts.x, opts.y, opts.emitterXVariance, opts.emitterYVariance])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      emitterRef.current?.destroy()
      emitterRef.current = null
    }
  }, [])

  // eslint-disable-next-line react-hooks/refs
  return containerRef.current
}
