/**
 * PixiStats — lightweight performance overlay as HTML.
 * Shows FPS, renderer type, and JS heap memory.
 *
 * Split into two parts:
 * - PixiStatsBridge: lives inside <Application> to capture the app instance
 * - PixiStats: lives outside <Application>, renders HTML overlay
 */
import { useEffect, useRef, useState } from 'react'
import { Ticker, type Application } from 'pixi.js'
import { useApplication } from '@pixi/react'

// Module-level ref shared between bridge (inside Application) and overlay (outside)
let _app: Application | null = null

/** Render inside <Application> to capture the app instance */
export function PixiStatsBridge() {
  const { app } = useApplication()
  useEffect(() => {
    _app = app
    return () => { _app = null }
  }, [app])
  return null
}

const UPDATE_INTERVAL = 500

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 8,
  left: 8,
  fontFamily: 'monospace',
  fontSize: 11,
  color: '#00ff00',
  background: 'rgba(0,0,0,0.7)',
  padding: '4px 8px',
  borderRadius: 4,
  lineHeight: 1.5,
  pointerEvents: 'none',
  zIndex: 9999,
  whiteSpace: 'pre',
}

/** Render outside <Application> as a regular HTML element */
export default function PixiStats() {
  const [text, setText] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)

  useEffect(() => {
    const update = () => {
      const lines: string[] = []
      lines.push(`FPS: ${Math.round(Ticker.shared.FPS)}`)

      const app = _app
      if (app?.renderer) {
        const r = app.renderer as any
        const type = r.gpu ? 'WebGPU' : r.gl ? 'WebGL' : 'Canvas'
        // Detect GPU texture format from supported compressed formats
        let texFormat = ''
        if (r.gpu) {
          // WebGPU: check supported GPUTextureFormat features
          const features = r.gpu.device?.features
          if (features?.has?.('texture-compression-astc')) texFormat = 'ASTC'
          else if (features?.has?.('texture-compression-bc')) texFormat = 'BC7'
          else if (features?.has?.('texture-compression-etc2')) texFormat = 'ETC2'
          else texFormat = 'RGBA'
        } else if (r.gl) {
          const gl = r.gl
          if (gl.getExtension('WEBGL_compressed_texture_astc')) texFormat = 'ASTC'
          else if (gl.getExtension('EXT_texture_compression_bptc')) texFormat = 'BC7'
          else if (gl.getExtension('WEBGL_compressed_texture_etc')) texFormat = 'ETC2'
          else texFormat = 'RGBA'
        }
        lines.push(`Renderer: ${type}${texFormat ? ` (${texFormat})` : ''}`)
      }

      const mem = (performance as any).memory
      if (mem) {
        const used = (mem.usedJSHeapSize / 1048576).toFixed(1)
        const total = (mem.totalJSHeapSize / 1048576).toFixed(1)
        lines.push(`Heap: ${used}/${total} MB`)
      }

      setText(lines.join('\n'))
    }

    intervalRef.current = setInterval(update, UPDATE_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return <div style={overlayStyle}>{text}</div>
}
