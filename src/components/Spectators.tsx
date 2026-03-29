// ─── Scrolling fans / spectators on both sides ───────────────────────────────
import { forwardRef, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { getWorldSpeed } from '../utils/difficulty'
import { WORLDS } from '../utils/worldThemes'
import { spectatorRows } from '../utils/deviceProfile'

// Simple humanoid spectator (capsule body, sphere head)
const Spectator = forwardRef<THREE.Group, { side: number; color: string; accentColor: string }>(
  ({ side, color, accentColor }, ref) => (
    <group ref={ref}>
      {/* Body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.45, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Arms waving (static position, animation via parent group rotation) */}
      <mesh position={[side * 0.22, 0.75, 0]} rotation={[0, 0, side * -0.6]} castShadow>
        <capsuleGeometry args={[0.055, 0.28, 4, 6]} />
        <meshStandardMaterial color={accentColor} />
      </mesh>
      {/* Glow accent */}
      <pointLight position={[0, 0.8, 0]} color={accentColor} intensity={0.5} distance={3} />
    </group>
  ),
)
Spectator.displayName = 'Spectator'

const SPACING   = 3.2
const N_PER_ROW = 14
const TOTAL_L   = SPACING * N_PER_ROW

// 3 rows per side, staggered Z and X
const ROWS = [
  { xOffset: 0,    yBase: 0.1,  rowZ: 0    },
  { xOffset: 0.8,  yBase: 0.4,  rowZ: 0.5  },
  { xOffset: 1.6,  yBase: 0.8,  rowZ: 1.0  },
]

interface SpectatorRowProps {
  side: number   // -1 left, +1 right
  rowIdx: number
}

function SpectatorRow({ side, rowIdx }: SpectatorRowProps) {
  const status   = useGameStore((s) => s.status)
  const world    = useGameStore((s) => s.world)
  const theme    = WORLDS[Math.max(0, world - 1)]

  const row      = ROWS[rowIdx]
  const baseX    = side * (8.0 + row.xOffset)
  const baseY    = row.yBase

  const data     = useRef(
    Array.from({ length: N_PER_ROW }, (_, i) => ({
      id: i + rowIdx * N_PER_ROW * 2 + (side === -1 ? 0 : N_PER_ROW * 3),
      z:  -(i * SPACING + rowIdx * 1.5),
    })),
  )
  const groupRefs = useRef(new Map<number, THREE.Group>())
  const [ids]     = useState(() => data.current.map((d) => d.id))
  const waveRef   = useRef(0)

  useEffect(() => {
    if (status === 'playing') {
      data.current.forEach((d, i) => { d.z = -(i * SPACING + rowIdx * 1.5) })
    }
  }, [status, rowIdx])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const speed = getWorldSpeed(useGameStore.getState().score)
    waveRef.current += delta * 2.5

    data.current.forEach((d) => {
      d.z += speed * delta
      if (d.z > 14) d.z -= TOTAL_L
      const g = groupRefs.current.get(d.id)
      if (g) {
        g.position.set(baseX, baseY, d.z + row.rowZ)
        // Gentle wave animation (arm bob)
        g.rotation.z = Math.sin(waveRef.current + d.id * 0.7) * 0.1
      }
    })
  })

  // Vary spectator colors slightly
  const colors  = ['#c8a060', '#e0c090', '#a08050', '#d0b070', '#b09060']
  const accents = [theme.accentColor, theme.railColor, theme.accentEmissive]

  return (
    <>
      {ids.map((id, i) => (
        <Spectator
          key={id}
          side={side}
          color={colors[i % colors.length]}
          accentColor={accents[i % accents.length]}
          ref={(el: THREE.Group | null) => {
            el ? groupRefs.current.set(id, el) : groupRefs.current.delete(id)
          }}
        />
      ))}
    </>
  )
}

export function Spectators() {
  const rows = Array.from({ length: spectatorRows }, (_, i) => i)
  return (
    <>
      {rows.map((rowIdx) => (
        <SpectatorRow key={`L${rowIdx}`} side={-1} rowIdx={rowIdx} />
      ))}
      {rows.map((rowIdx) => (
        <SpectatorRow key={`R${rowIdx}`} side={1} rowIdx={rowIdx} />
      ))}
    </>
  )
}
