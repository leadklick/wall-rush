import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ObstacleData } from '../types/game'
import { useGameStore } from '../store/gameStore'
import type { PlayerPosition } from './Player'
import { getEffectiveSpeed, getObstacleInterval, getLevel } from '../utils/difficulty'
import { triggerShake } from '../utils/shakeState'
import { Sounds } from '../utils/sounds'
import { invincState } from '../utils/invincibilityState'
import { WORLDS } from '../utils/worldThemes'

// ─── Obstacle meshes ──────────────────────────────────────────────────────────
const CrateMesh = forwardRef<THREE.Group, { color: string; emissive: string }>((props, ref) => (
  <group ref={ref}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.75, 0.75, 0.75]} />
      <meshPhysicalMaterial color={props.color} emissive={props.emissive} emissiveIntensity={0.3} metalness={0.5} roughness={0.4} clearcoat={0.3} />
    </mesh>
    {/* Top edge highlight */}
    <mesh position={[0, 0.38, 0]}>
      <boxGeometry args={[0.76, 0.04, 0.76]} />
      <meshStandardMaterial color={props.emissive} emissive={props.emissive} emissiveIntensity={1.5} />
    </mesh>
  </group>
))
CrateMesh.displayName = 'CrateMesh'

// Bar: must slide under (height 0.5 at y=0.7, gap 0.55 needed to slide under)
const BarMesh = forwardRef<THREE.Group, { color: string; emissive: string }>((props, ref) => (
  <group ref={ref}>
    {/* Horizontal bar */}
    <mesh position={[0, 0.72, 0]} castShadow>
      <boxGeometry args={[3.5, 0.22, 0.50]} />
      <meshPhysicalMaterial color={props.color} emissive={props.emissive} emissiveIntensity={0.4} metalness={0.7} roughness={0.2} clearcoat={0.4} />
    </mesh>
    {/* Left post */}
    <mesh position={[-1.6, 0.36, 0]} castShadow>
      <boxGeometry args={[0.14, 0.72, 0.14]} />
      <meshPhysicalMaterial color={props.color} metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Right post */}
    <mesh position={[1.6, 0.36, 0]} castShadow>
      <boxGeometry args={[0.14, 0.72, 0.14]} />
      <meshPhysicalMaterial color={props.color} metalness={0.8} roughness={0.2} />
    </mesh>
  </group>
))
BarMesh.displayName = 'BarMesh'

// ─── Constants ────────────────────────────────────────────────────────────────
const SPAWN_Z        = -40
const DESPAWN_Z      =  16
const PLAYER_Z       =   0
const CRATE_HALF_H   = 0.375   // crate height / 2
const BAR_Y          = 0.72    // bar center Y
const BAR_HALF_H     = 0.11    // bar height / 2

interface ObstacleManagerProps {
  posRef: React.MutableRefObject<PlayerPosition>
}

export function ObstacleManager({ posRef }: ObstacleManagerProps) {
  const status   = useGameStore((s) => s.status)
  const loseLife = useGameStore((s) => s.loseLife)
  const world    = useGameStore((s) => s.world)

  const obstRef    = useRef<ObstacleData[]>([])
  const groupRefs  = useRef<Map<number, THREE.Group>>(new Map())
  const [renderObs, setRenderObs] = useState<ObstacleData[]>([])

  const spawnTimerRef = useRef(2.5)
  const nextIdRef     = useRef(0)

  useEffect(() => {
    if (status === 'playing') {
      obstRef.current = []
      groupRefs.current.clear()
      spawnTimerRef.current = 2.5
      nextIdRef.current     = 0
      setRenderObs([])
    }
  }, [status])

  const spawnObstacle = useCallback((score: number) => {
    const level   = getLevel(score)
    if (level < 2) return

    const type: ObstacleData['type'] = level >= 6 && Math.random() > 0.75 ? 'bar' : 'crate'
    const xOptions = [-3.5, -2.5, -1.5, 0, 1.5, 2.5, 3.5]
    const x = xOptions[Math.floor(Math.random() * xOptions.length)]

    const obs: ObstacleData = { id: nextIdRef.current++, z: SPAWN_Z, x, type }
    obstRef.current = [...obstRef.current, obs]

    // 30% chance of a second crate nearby (different lane)
    if (level >= 3 && Math.random() < 0.30) {
      const x2Options = xOptions.filter((v) => Math.abs(v - x) >= 1.5)
      if (x2Options.length > 0) {
        const x2 = x2Options[Math.floor(Math.random() * x2Options.length)]
        obstRef.current = [...obstRef.current, {
          id:   nextIdRef.current++,
          z:    SPAWN_Z - 1.8,
          x:    x2,
          type: 'crate',
        }]
      }
    }

    setRenderObs([...obstRef.current])
  }, [])

  useFrame((_, delta) => {
    if (status !== 'playing') return

    const score            = useGameStore.getState().score
    const speed            = getEffectiveSpeed(score)
    const { triggerFlash } = useGameStore.getState()

    let changed = false

    for (const obs of obstRef.current) {
      obs.z += speed * delta
      groupRefs.current.get(obs.id)?.position.set(obs.x, 0, obs.z)

      // Collision check
      if (!invincState.active && obs.z > PLAYER_Z - 0.8 && obs.z < PLAYER_Z + 0.8) {
        const px = posRef.current.x
        const py = posRef.current.y
        const sl = posRef.current.sliding

        if (obs.type === 'crate') {
          // Crate: hitbox x ±0.375, y 0–0.75. Player feet py, height 1.0/0.55
          const playerH = sl ? 0.55 : 1.0
          const xHit = Math.abs(px - obs.x) < 0.375 + 0.4
          const yHit = py < CRATE_HALF_H * 2 && py + playerH > 0
          if (xHit && yHit) {
            triggerShake(0.55)
            triggerFlash('red')
            Sounds.hit()
            loseLife()
            return
          }
        } else {
          // Bar: x span ±1.75, y 0.61–0.83. Player can jump over or slide under.
          const xHit = Math.abs(px - obs.x) < 1.75 + 0.4
          if (xHit) {
            const playerH = sl ? 0.55 : 1.0
            const pBottom = py
            const pTop    = py + playerH
            const bBottom = BAR_Y - BAR_HALF_H - 0.05
            const bTop    = BAR_Y + BAR_HALF_H + 0.05
            // Hit if player overlaps the bar vertically
            if (pBottom < bTop && pTop > bBottom) {
              triggerShake(0.55)
              triggerFlash('red')
              Sounds.hit()
              loseLife()
              return
            }
          }
        }
      }
    }

    // Despawn
    const before = obstRef.current.length
    obstRef.current = obstRef.current.filter((o) => {
      if (o.z > DESPAWN_Z) { groupRefs.current.delete(o.id); return false }
      return true
    })
    if (obstRef.current.length !== before) changed = true

    // Spawn timer
    spawnTimerRef.current -= delta
    if (spawnTimerRef.current <= 0) {
      spawnObstacle(score)
      spawnTimerRef.current = getObstacleInterval(score)
      changed = true
    }

    if (changed) setRenderObs([...obstRef.current])
  })

  const theme = WORLDS[Math.max(0, world - 1)]

  return (
    <>
      {renderObs.map((obs) =>
        obs.type === 'crate' ? (
          <CrateMesh
            key={obs.id}
            color={theme.obstacleColor}
            emissive={theme.obstacleEmissive}
            ref={(el: THREE.Group | null) => {
              el ? groupRefs.current.set(obs.id, el) : groupRefs.current.delete(obs.id)
            }}
          />
        ) : (
          <BarMesh
            key={obs.id}
            color={theme.obstacleColor}
            emissive={theme.obstacleEmissive}
            ref={(el: THREE.Group | null) => {
              el ? groupRefs.current.set(obs.id, el) : groupRefs.current.delete(obs.id)
            }}
          />
        ),
      )}
    </>
  )
}
