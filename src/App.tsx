import { Application } from '@pixi/react'
import Menton from './components/menton/Menton'
import { GAME_WIDTH, GAME_HEIGHT } from './components/menton/Scenery'
import DebugPanel from './debug/DebugPanel'

const showDevtools = new URLSearchParams(window.location.search).has('devtools')

export default function App() {
  return (
    <>
      <Application
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        background="#000000"
      >
        <Menton />
      </Application>
      {showDevtools && <DebugPanel />}
    </>
  )
}
