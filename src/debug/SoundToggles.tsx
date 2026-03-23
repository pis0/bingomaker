/**
 * SoundToggles — 3 icon toggle buttons for BG / VO / SFX.
 * Positioned next to PixiStats overlay.
 */
import { useState } from 'react'
import { setMusicEnabled, setSFXEnabled, setVOEnabled } from '../audio/AudioManager'

// ── LocalStorage persistence ─────────────────────────────────────
const LS_KEY = 'bingomaker_sound'

function loadPrefs(): { bg: boolean; vo: boolean; sfx: boolean } {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return { bg: true, vo: true, sfx: true }
}

function savePrefs(bg: boolean, vo: boolean, sfx: boolean) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ bg, vo, sfx })) } catch { /* noop */ }
}

// ── SVG Icons (18x18) ────────────────────────────────────────────

const SLASH = <line x1="3" y1="3" x2="15" y2="15" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" />

function MusicIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M12 3v9.5c0 1.38-1.12 2.5-2.5 2.5S7 13.88 7 12.5 8.12 10 9.5 10c.53 0 1.02.15 1.5.42V5l-5 1.5v7c0 1.38-1.12 2.5-2.5 2.5S1 14.88 1 13.5 2.12 11 3.5 11c.53 0 1.02.15 1.5.42V4l7-2z"
        fill={on ? '#00ff00' : '#666'}
      />
      {/* Sound waves */}
      <path
        d="M14 6.5c.8.8 1.2 1.8 1.2 3s-.4 2.2-1.2 3"
        stroke={on ? '#00ff00' : '#666'}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      {!on && SLASH}
    </svg>
  )
}

function VoiceIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* Head */}
      <circle cx="9" cy="6" r="3.5" fill={on ? '#00ff00' : '#666'} />
      {/* Body */}
      <path
        d="M3 16.5c0-3.31 2.69-6 6-6s6 2.69 6 6"
        stroke={on ? '#00ff00' : '#666'}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {!on && SLASH}
    </svg>
  )
}

function FxIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <text
        x="9" y="13"
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight="bold"
        fontSize="12"
        fill={on ? '#00ff00' : '#666'}
      >
        FX
      </text>
      {!on && SLASH}
    </svg>
  )
}

// ── Component ────────────────────────────────────────────────────

export default function SoundToggles() {
  const prefs = loadPrefs()
  const [bg, setBg] = useState(() => { setMusicEnabled(prefs.bg); return prefs.bg })
  const [vo, setVo] = useState(() => { setVOEnabled(prefs.vo); return prefs.vo })
  const [sfx, setSfx] = useState(() => { setSFXEnabled(prefs.sfx); return prefs.sfx })

  const toggleBg = () => { const v = !bg; setMusicEnabled(v); setBg(v); savePrefs(v, vo, sfx) }
  const toggleVo = () => { const v = !vo; setVOEnabled(v); setVo(v); savePrefs(bg, v, sfx) }
  const toggleSfx = () => { const v = !sfx; setSFXEnabled(v); setSfx(v); savePrefs(bg, vo, v) }

  return (
    <div style={containerStyle}>
      <button style={btnStyle(bg)} onClick={toggleBg} title="Background Music">
        <MusicIcon on={bg} />
      </button>
      <button style={btnStyle(vo)} onClick={toggleVo} title="Voice-Over">
        <VoiceIcon on={vo} />
      </button>
      <button style={btnStyle(sfx)} onClick={toggleSfx} title="Sound Effects">
        <FxIcon on={sfx} />
      </button>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 8,
  left: 200,
  display: 'flex',
  gap: 4,
  zIndex: 9999,
}

function btnStyle(on: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    background: on ? 'rgba(0,80,0,0.7)' : 'rgba(40,0,0,0.7)',
    padding: 0,
  }
}
