import { useEffect } from 'react'
import { Application } from '@pixi/react'
import Menton from './components/menton/Menton'
import { GAME_WIDTH, GAME_HEIGHT } from './components/menton/Scenery'
import DebugPanel from './debug/DebugPanel'
import PixiStats, { PixiStatsBridge } from './debug/PixiStats'
import SoundToggles from './debug/SoundToggles'
import { useAssets } from './assets/useAssets'
import { resumeAudio } from './audio/AudioManager'
import { useServerEngine } from './hooks/useServerEngine'
import { useGameStore } from './store/gameStore'
import { STAKE_LEVELS } from './engine/constants'

// Debug panel only available on localhost — never in production
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const showDevtools = isLocal && new URLSearchParams(window.location.search).has('devtools')

/** Set CSS custom properties for canvas scaling (contain-fit, centered) */
function useViewportScale() {
  useEffect(() => {
    const update = () => {
      const scaleX = window.innerWidth / GAME_WIDTH
      const scaleY = window.innerHeight / GAME_HEIGHT
      const s = Math.min(1, scaleX, scaleY)
      const fitByWidth = scaleX < scaleY
      document.documentElement.style.setProperty('--game-scale', String(s))
      document.documentElement.style.setProperty('--game-fit', fitByWidth ? 'width' : 'height')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
}

export default function App() {
  const { status, progress, retry } = useAssets()
  const engine = useServerEngine()
  useViewportScale()

  // Resume AudioContext on first user gesture (iOS/Android WebView requirement)
  // Listen to multiple event types and keep retrying until context is running
  useEffect(() => {
    let done = false
    const handler = async () => {
      if (done) return
      await resumeAudio()
      done = true
      for (const ev of events) document.removeEventListener(ev, handler, true)
    }
    const events = ['pointerdown', 'touchstart', 'mousedown', 'keydown'] as const
    for (const ev of events) document.addEventListener(ev, handler, { capture: true })
    return () => { for (const ev of events) document.removeEventListener(ev, handler, true) }
  }, [])

  // Button state — must be before early returns (hooks rules)
  const showEnd = engine.canEnd

  // ── Sync engine state to Zustand store (react-dom reconciler → no cross-update warning) ──
  // BallPanel/CardPanel (@pixi/react reconciler) subscribe to these slices.
  // Synchronous during render so subscribers see values on the same frame.
  useGameStore.setState({
    round: engine.round,
    stakeIndex: engine.stakeIndex,
    stake: STAKE_LEVELS[engine.stakeIndex],
    targetBallCount: engine.targetBallCount,
    peelAdvanceTick: engine.peelAdvanceTick,
    drawing: engine.targetBallCount > 0,
  })

  if (status === 'error') {
    return (
      <div style={errorStyle}>
        <span>Failed to load assets</span>
        <button style={retryBtnStyle} onClick={retry}>Try Again</button>
      </div>
    )
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
        preference="webgpu"
      >
        <Menton
          round={engine.round}
          stakeIndex={engine.stakeIndex}
          targetBallCount={engine.targetBallCount}
          processNextBall={engine.processNextBall}
          isCollecting={engine.isCollecting}
          lastPayout={engine.lastPayout}
          onBonusActiveChange={engine.setBonusActive}
          onPeelChange={engine.handlePeelChange}
          buttonPhase={
            engine.advanceLabel === 'Extra' ? 'extra'
            : engine.advanceLabel === 'Super Extra' ? 'super'
            : engine.advanceLabel === 'Peel' ? 'peel'
            : engine.advanceLabel === 'Next' ? 'halt'
            : 'play'
          }
          buttonEnabled={engine.canAdvance}
          onPlay={engine.advance}
          onExtra={engine.advance}
          showEnd={showEnd}
          onEnd={engine.endRound}
          onStakeChange={engine.setStakeIndex}
          onShuffle={engine.shuffle}
        />
        <PixiStatsBridge />
      </Application>
      <PixiStats />
      <SoundToggles />
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
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  background: '#000',
  color: '#f44',
  fontSize: 14,
  fontFamily: 'monospace',
  gap: 16,
}

const retryBtnStyle: React.CSSProperties = {
  padding: '10px 28px',
  fontSize: 14,
  fontFamily: 'monospace',
  background: '#333',
  color: '#fff',
  border: '1px solid #555',
  borderRadius: 6,
  cursor: 'pointer',
}
