import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { getWorldSpeed, getEffectiveSpeed } from '../utils/difficulty'
import { WORLDS } from '../utils/worldThemes'
import { lineCount } from '../utils/deviceProfile'

const LINE_COUNT = lineCount
const SPAWN_Z    = -55
const DESPAWN_Z  = 14

interface Line {
  id: number; x: number; y: number; z: number; extraSpeed: number
}

export function SpeedLines() {
  const lines = useRef<Line[]>(
    Array.from({ length: LINE_COUNT }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 28,
      y: Math.random() * 9 + 0.3,
      z: SPAWN_Z + Math.random() * 60,
      extraSpeed: 10 + Math.random() * 18,
    })),
  )
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy   = useRef(new THREE.Object3D())

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const status = useGameStore.getState().status
    if (status !== 'playing') return

    const score = useGameStore.getState().score
    const ws          = getEffectiveSpeed(score)
    const speedFactor = getWorldSpeed(score) / 8  // visual scale uses base speed

    for (const ln of lines.current) {
      ln.z += (ws + ln.extraSpeed) * delta
      if (ln.z > DESPAWN_Z) {
        ln.z = SPAWN_Z
        ln.x = (Math.random() - 0.5) * 28
        ln.y = Math.random() * 9 + 0.3
      }
      dummy.current.position.set(ln.x, ln.y, ln.z)
      dummy.current.rotation.set(0, 0, 0)
      dummy.current.scale.set(0.015, 0.015, 0.5 + speedFactor * 0.5)
      dummy.current.updateMatrix()
      meshRef.current.setMatrixAt(ln.id, dummy.current.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  const status = useGameStore((s) => s.status)
  const world  = useGameStore((s) => s.world)
  const theme  = WORLDS[Math.max(0, world - 1)]
  if (status !== 'playing') return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, LINE_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={theme.speedLineColor} transparent opacity={0.25} />
    </instancedMesh>
  )
}
