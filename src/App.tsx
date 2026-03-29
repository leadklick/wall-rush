import { useGameStore } from './store/gameStore'
import { Game } from './components/Game'
import { StartScreen } from './screens/StartScreen'
import { GameOverScreen } from './screens/GameOverScreen'

export default function App() {
  const status = useGameStore((s) => s.status)

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative' }}>
      {/* 3D game mounted while playing or paused */}
      {(status === 'playing' || status === 'paused') && <Game />}

      {status === 'start'    && <StartScreen />}
      {status === 'gameover' && <GameOverScreen />}
    </div>
  )
}
