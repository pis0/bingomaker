import { Application } from '@pixi/react'
import Menton from './components/menton/Menton'
import { GAME_WIDTH, GAME_HEIGHT } from './components/menton/Scenery'
import DebugPanel from './debug/DebugPanel'
import { useAssets } from './assets/useAssets'
import { useDebugEngine } from './debug/useDebugEngine'

const showDevtools = new URLSearchParams(window.location.search).has('devtools')

export default function App() {
  const { status, progress } = useAssets()
  const engine = useDebugEngine()

  if (status === 'error') {
    return <div style={errorStyle}>Failed to load assets. Check console.</div>
  }

  if (status === 'loading') {
    return (
      <div style={loaderStyle}>
        <div style={barTrack}>
          <div style={{ ...barFill, width: `${Math.round(progress * 100)}%` }} />
        </div>
        <span style={labelStyle}>{Math.round(progress * 100)}%</span>
      </div>
    )
  }

  return (
    <>
      <Application
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        background="#000000"
      >
        <Menton round={engine.round} stakeIndex={engine.stakeIndex} />
      </Application>
      {showDevtools && <DebugPanel engine={engine} />}
    </>
  )
}

const loaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  background: '#000',
  gap: 12,
}

const barTrack: React.CSSProperties = {
  width: 240,
  height: 6,
  background: '#333',
  borderRadius: 3,
  overflow: 'hidden',
}

const barFill: React.CSSProperties = {
  height: '100%',
  background: '#f5c518',
  borderRadius: 3,
  transition: 'width 0.15s ease',
}

const labelStyle: React.CSSProperties = {
  color: '#888',
  fontSize: 13,
  fontFamily: 'monospace',
}

const errorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  background: '#000',
  color: '#f44',
  fontSize: 14,
  fontFamily: 'monospace',
}
