import { Component, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import { Player } from './Player'
import { PlatformTiles } from './PlatformTiles'
import { WallManager } from './WallManager'
import { WorldEnvironment } from './WorldEnvironment'
import { SpeedLines } from './SpeedLines'
import { Particles } from './Particles'
import { PostProcessing } from './PostProcessing'
import { ObstacleManager } from './ObstacleManager'
import { CoinManager } from './CoinManager'
import { TouchControls } from './TouchControls'
import { useGameStore } from '../store/gameStore'
import { getLevel, getWorldSpeed } from '../utils/difficulty'
import { getWorld, WORLDS } from '../utils/worldThemes'
import { shakeState } from '../utils/shakeState'
import { Sounds } from '../utils/sounds'
import { isMobile, maxDpr, shadowsOn } from '../utils/deviceProfile'
import type { PlayerPosition } from './Player'

// ─── Error boundary (prevents PostProcessing or any component from killing the scene) ─
class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(e: unknown) { console.warn('[WallRush] Scene error caught:', e) }
  render() { return this.state.failed ? null : this.props.children }
}

// ─── Camera with shake + FOV-speed effect ─────────────────────────────────────
function FollowCamera({ posRef }: { posRef: React.MutableRefObject<PlayerPosition> }) {
  const { camera } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const target = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const p = posRef.current

    const shake = shakeState.intensity
    if (shake > 0.002) {
      shakeState.intensity *= Math.pow(0.01, delta)
    } else {
      shakeState.intensity = 0
    }

    const baseX = p.x * 0.6
    const baseY = p.y + 4.5
    const baseZ = p.z + 9

    target.current.set(
      baseX + (Math.random() - 0.5) * shake,
      baseY + (Math.random() - 0.5) * shake * 0.6,
      baseZ,
    )
    camera.position.lerp(target.current, 0.08)
    camera.lookAt(p.x * 0.4, p.y + 1.2, p.z - 4)

    const score     = useGameStore.getState().score
    const speed     = getWorldSpeed(score)
    const targetFov = 60 + (speed - 8) * 1.4
    cam.fov += (targetFov - cam.fov) * 3 * delta
    cam.updateProjectionMatrix()
  })

  return null
}

// ─── Dynamic sky and fog ──────────────────────────────────────────────────────
function WorldSky() {
  const world = useGameStore((s) => s.world)
  const theme = WORLDS[Math.max(0, world - 1)]

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={theme.sunPosition}
        turbidity={theme.skyTurbidity}
        rayleigh={theme.skyRayleigh}
        mieCoefficient={0.004}
        mieDirectionalG={0.88}
      />
      <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar]} />
      <hemisphereLight args={[theme.ambientSky, theme.ambientGround, theme.ambientIntensity]} />
      <directionalLight
        position={[10, 20, 8]}
        intensity={3.8}
        color={theme.dirColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <directionalLight position={[-8, 10, 6]}  intensity={1.6} color={theme.ambientSky} />
      <directionalLight position={[0,  4,  12]} intensity={1.3} color={theme.dirColor} />
    </>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene() {
  const posRef = useRef<PlayerPosition>({ x: 0, y: 0, z: 0, sliding: false })

  return (
    <>
      <FollowCamera posRef={posRef} />
      <WorldSky />
      <WorldEnvironment />
      <PlatformTiles />
      <SpeedLines />
      <Particles />
      <CoinManager posRef={posRef} />
      <Player posRef={posRef} />
      <WallManager posRef={posRef} />
      <ObstacleManager posRef={posRef} />
      <SceneBoundary><PostProcessing /></SceneBoundary>
    </>
  )
}

// ─── World tracker (sets world in store when level changes) ───────────────────
function WorldTracker() {
  const score    = useGameStore((s) => s.score)
  const status   = useGameStore((s) => s.status)
  const world    = useGameStore((s) => s.world)
  const setWorld = useGameStore((s) => s.setWorld)

  useEffect(() => {
    if (status !== 'playing') return
    const w = getWorld(getLevel(score))
    if (w !== world) {
      Sounds.worldChange()
      setWorld(w)
    }
  }, [score, status, world, setWorld])

  return null
}

// ─── Level-Up banner ──────────────────────────────────────────────────────────
function LevelUpBanner({ level }: { level: number }) {
  const [visible, setVisible] = useState(false)
  const prev = useRef(1)

  useEffect(() => {
    if (level > prev.current) {
      prev.current = level
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 2200)
      return () => clearTimeout(t)
    }
  }, [level])

  if (!visible) return null
  const world = getWorld(level)
  const theme = WORLDS[world - 1]
  const isNewWorld = level === 4 || level === 7 || level === 10

  return (
    <div style={s.levelBanner}>
      {isNewWorld && (
        <div style={{ ...s.worldBannerText, color: theme.accentColor, textShadow: `0 0 50px ${theme.accentColor}` }}>
          {theme.nameLong}
        </div>
      )}
      <div style={s.levelBannerText}>LEVEL {level}</div>
    </div>
  )
}

// ─── Screen flash ─────────────────────────────────────────────────────────────
function ScreenFlash() {
  const color = useGameStore((st) => st.flashColor)
  if (!color) return null
  const bg = color === 'red' ? 'rgba(220,30,30,0.35)' : 'rgba(255,255,255,0.45)'
  return <div style={{ ...s.flash, background: bg }} />
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function HUD() {
  const score           = useGameStore((st) => st.score)
  const highScore       = useGameStore((st) => st.highScore)
  const status          = useGameStore((st) => st.status)
  const lives           = useGameStore((st) => st.lives)
  const comboMultiplier = useGameStore((st) => st.comboMultiplier)
  const coinsCollected  = useGameStore((st) => st.coinsCollected)
  const boostGauge      = useGameStore((st) => st.boostGauge)
  const magnetActive    = useGameStore((st) => st.magnetActive)
  const magnetTimer     = useGameStore((st) => st.magnetTimer)
  const level          = getLevel(score)
  const world          = getWorld(level)
  const theme          = WORLDS[world - 1]

  if (status !== 'playing') return null

  const speedPct = Math.min((level - 1) / 9, 1)

  return (
    <>
      <div style={s.hud}>
        {/* Score + lives */}
        <div>
          <div style={s.score}>{score}</div>
          <div style={s.label}>PUNKTE</div>
          <div style={s.lives}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ color: i < lives ? '#e74c3c' : 'rgba(255,255,255,0.2)', fontSize: '20px' }}>
                ♥
              </span>
            ))}
          </div>
          {coinsCollected > 0 && (
            <div style={s.coinRow}>
              <span style={s.coinDot} />
              <span style={s.coinCount}>{coinsCollected}</span>
            </div>
          )}
          {/* Boost gauge */}
          <div style={s.boostWrap}>
            <span style={s.boostLabel}>⚡</span>
            <div style={s.boostTrack}>
              <div style={{ ...s.boostFill, width: `${boostGauge * 100}%`, background: boostGauge > 0.15 ? '#FFD700' : '#ff4444' }} />
            </div>
          </div>
          {/* Magnet indicator */}
          {magnetActive && (
            <div style={s.magnetBadge}>
              🧲 {Math.ceil(magnetTimer)}s
            </div>
          )}
        </div>

        {/* Level + world pill */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...s.levelPill, background: `rgba(${world === 2 ? '255,100,0' : world === 3 ? '170,0,255' : world === 4 ? '200,0,0' : '0,212,255'},.14)`, borderColor: theme.accentColor, color: theme.accentColor, textShadow: `0 0 14px ${theme.accentColor}` }}>
            LVL {level}
          </div>
          <div style={{ ...s.worldLabel, color: theme.accentColor }}>{theme.name.toUpperCase()}</div>
        </div>

        {/* Combo + best score */}
        <div style={{ textAlign: 'right' }}>
          {highScore > 0 && <><div style={s.best}>{highScore}</div><div style={s.label}>BESTZEIT</div></>}
          {comboMultiplier > 1 && (
            <div style={{ ...s.combo, color: theme.accentColor }}>×{comboMultiplier}</div>
          )}
        </div>
      </div>

      {/* Speed bar — raised on mobile to clear touch buttons */}
      <div style={{ ...s.speedWrap, bottom: isMobile ? '126px' : '22px' }}>
        <div style={s.speedLabel}>GESCHWINDIGKEIT</div>
        <div style={s.speedTrack}>
          <div style={{ ...s.speedFill, width: `${speedPct * 100}%`, background: `linear-gradient(90deg, ${theme.accentColor}, #ff4444)` }} />
        </div>
      </div>

      {/* Controls hint — keyboard only, hidden on mobile (touch buttons replace this) */}
      {!isMobile && (
        <div style={s.controls}>A / D Bewegen &nbsp;|&nbsp; LEERTASTE Springen &nbsp;|&nbsp; S Gleiten &nbsp;|&nbsp; ↑ / W Boost &nbsp;|&nbsp; ESC Pause</div>
      )}

      <LevelUpBanner level={level} />
      <ScreenFlash />
    </>
  )
}

// ─── Pause overlay ────────────────────────────────────────────────────────────
function PauseOverlay() {
  const resume    = useGameStore((s) => s.resumeGame)
  const endGame   = useGameStore((s) => s.endGame)

  return (
    <div style={s.pauseOverlay}>
      <div style={s.pauseCard}>
        <div style={s.pauseTitle}>PAUSE</div>
        <button style={{ ...s.pauseBtn, background: '#00d4ff' }} onClick={resume}>
          WEITER SPIELEN
        </button>
        <button style={{ ...s.pauseBtn, background: 'rgba(255,255,255,0.1)', marginTop: '12px' }} onClick={endGame}>
          AUFGEBEN
        </button>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function Game() {
  const status    = useGameStore((s) => s.status)
  const pauseGame = useGameStore((s) => s.pauseGame)
  const resume    = useGameStore((s) => s.resumeGame)
  const world     = useGameStore((s) => s.world)
  const theme     = WORLDS[Math.max(0, world - 1)]

  // ESC to pause/resume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      const current = useGameStore.getState().status
      if (current === 'playing') pauseGame()
      else if (current === 'paused') resume()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pauseGame, resume])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', touchAction: 'none' }}>
      <Canvas
        shadows={shadowsOn}
        dpr={[1, maxDpr]}
        camera={{ position: [0, 4.5, 9], fov: 60, near: 0.1, far: 200 }}
        gl={{
          antialias: !isMobile,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
        }}
        style={{ background: theme.bgColor }}
      >
        <WorldTracker />
        <Scene />
      </Canvas>
      <HUD />
      {status === 'paused' && <PauseOverlay />}
      <TouchControls />
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  hud: {
    position: 'absolute', top: 0, left: 0, right: 0,
    padding: '14px 20px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'flex-start',
    pointerEvents: 'none', fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  score: { color: '#fff', fontSize: '34px', fontWeight: 900, lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,.9)' },
  label: { color: 'rgba(255,255,255,.4)', fontSize: '11px', letterSpacing: '2px', fontWeight: 600, marginTop: '2px' },
  lives: { marginTop: '6px', display: 'flex', gap: '4px' },
  coinRow: { marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' },
  coinDot: { display: 'inline-block', width: 13, height: 13, borderRadius: '50%', background: '#FFD700', boxShadow: '0 0 6px #FF9900' },
  coinCount: { color: '#FFD700', fontSize: '16px', fontWeight: 800, textShadow: '0 0 8px rgba(255,200,0,.8)' },
  boostWrap: { marginTop: '7px', display: 'flex', alignItems: 'center', gap: '5px' },
  boostLabel: { fontSize: '14px', lineHeight: 1 },
  boostTrack: { width: '72px', height: '5px', background: 'rgba(255,255,255,.15)', borderRadius: '3px', overflow: 'hidden' },
  boostFill: { height: '100%', borderRadius: '3px', transition: 'width 0.1s linear' },
  magnetBadge: { marginTop: '5px', display: 'inline-block', background: 'rgba(0,0,0,0.45)', border: '1px solid #ff66cc', borderRadius: '8px', padding: '2px 8px', color: '#ff99ee', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(4px)' },
  levelPill: {
    border: '1px solid',
    borderRadius: '20px', padding: '6px 20px',
    fontSize: '15px', fontWeight: 700, letterSpacing: '2px',
    alignSelf: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  worldLabel: {
    fontSize: '11px', letterSpacing: '2px', fontWeight: 600,
    marginTop: '4px', textAlign: 'center',
  },
  best: { color: '#f39c12', fontSize: '24px', fontWeight: 700, lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,.9)' },
  combo: {
    fontSize: '28px', fontWeight: 900, lineHeight: 1, marginTop: '6px',
    textShadow: '0 0 20px currentColor', filter: 'brightness(1.4)',
  },
  levelBanner: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)', pointerEvents: 'none', textAlign: 'center',
  },
  worldBannerText: {
    fontSize: '28px', fontWeight: 900, letterSpacing: '6px',
    fontFamily: "'Segoe UI', system-ui, sans-serif", marginBottom: '8px',
  },
  levelBannerText: {
    color: '#00d4ff', fontSize: '60px', fontWeight: 900, letterSpacing: '10px',
    textShadow: '0 0 50px rgba(0,212,255,.95), 0 0 100px rgba(0,212,255,.4)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  flash: {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    transition: 'opacity 0.4s ease-out',
  },
  speedWrap: {
    position: 'absolute', bottom: '22px', left: '50%',
    transform: 'translateX(-50%)', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '4px',
    pointerEvents: 'none', fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  speedLabel: { color: 'rgba(255,255,255,.35)', fontSize: '10px', letterSpacing: '3px', fontWeight: 600 },
  speedTrack: { width: '160px', height: '4px', background: 'rgba(255,255,255,.1)', borderRadius: '2px', overflow: 'hidden' },
  speedFill: { height: '100%', borderRadius: '2px', transition: 'width .9s ease' },
  controls: {
    position: 'absolute', bottom: '52px', left: '50%',
    transform: 'translateX(-50%)', color: 'rgba(255,255,255,.28)',
    fontSize: '12px', pointerEvents: 'none',
    fontFamily: "'Segoe UI', system-ui, sans-serif", letterSpacing: '1px',
  },
  pauseOverlay: {
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 20,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  pauseCard: {
    textAlign: 'center', padding: '48px 64px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '16px', backdropFilter: 'blur(12px)',
  },
  pauseTitle: {
    fontSize: '52px', fontWeight: 900, color: '#fff', letterSpacing: '8px', marginBottom: '36px',
    textShadow: '0 0 40px rgba(255,255,255,0.3)',
  },
  pauseBtn: {
    display: 'block', width: '100%',
    color: '#fff', border: 'none', borderRadius: '8px',
    padding: '14px 0', fontSize: '16px', fontWeight: 700,
    letterSpacing: '2px', cursor: 'pointer',
  },
}
