import { forwardRef, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { getEffectiveSpeed } from '../utils/difficulty'
import { WORLDS } from '../utils/worldThemes'

const TILE_L    = 18
const N_TILES   = 8
const TOTAL_L   = TILE_L * N_TILES
const RECYCLE_Z = TILE_L
const STRIPE_N  = 5

interface TileProps {
  railColor:     string
  crackColor:    string
  platformColor: string
}

const PlatformTile = forwardRef<THREE.Group, TileProps>((props, ref) => (
  <group ref={ref}>
    {/* Main body */}
    <mesh receiveShadow castShadow position={[0, -0.51, 0]}>
      <boxGeometry args={[10, 1, TILE_L]} />
      <meshStandardMaterial color={props.platformColor} roughness={0.75} metalness={0.15} />
    </mesh>
    {/* Top surface */}
    <mesh receiveShadow position={[0, 0.006, 0]}>
      <boxGeometry args={[10, 0.012, TILE_L]} />
      <meshStandardMaterial color={props.platformColor} roughness={0.65} metalness={0.1} />
    </mesh>
    {/* Edge rails (emissive only — no point lights) */}
    <mesh position={[-4.82, 0.085, 0]}>
      <boxGeometry args={[0.12, 0.17, TILE_L]} />
      <meshStandardMaterial color={props.railColor} emissive={props.railColor} emissiveIntensity={0.9} roughness={0.3} metalness={0.5} />
    </mesh>
    <mesh position={[4.82, 0.085, 0]}>
      <boxGeometry args={[0.12, 0.17, TILE_L]} />
      <meshStandardMaterial color={props.railColor} emissive={props.railColor} emissiveIntensity={0.9} roughness={0.3} metalness={0.5} />
    </mesh>
    {/* Dashed center line */}
    {Array.from({ length: STRIPE_N }, (_, i) => {
      const z = -TILE_L / 2 + (i + 0.5) * (TILE_L / STRIPE_N)
      return (
        <mesh key={i} position={[0, 0.013, z]}>
          <boxGeometry args={[0.08, 0.02, 1.0]} />
          <meshStandardMaterial color={props.crackColor} emissive={props.crackColor} emissiveIntensity={0.5} />
        </mesh>
      )
    })}
    {/* Side lane markers */}
    {Array.from({ length: STRIPE_N }, (_, i) => {
      const z = -TILE_L / 2 + (i + 0.5) * (TILE_L / STRIPE_N)
      return (
        <group key={i}>
          <mesh position={[-2.5, 0.013, z]}>
            <boxGeometry args={[0.05, 0.015, 0.6]} />
            <meshStandardMaterial color={props.crackColor} emissive={props.crackColor} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[2.5, 0.013, z]}>
            <boxGeometry args={[0.05, 0.015, 0.6]} />
            <meshStandardMaterial color={props.crackColor} emissive={props.crackColor} emissiveIntensity={0.3} />
          </mesh>
        </group>
      )
    })}
  </group>
))
PlatformTile.displayName = 'PlatformTile'

export function PlatformTiles() {
  const status = useGameStore((s) => s.status)
  const world  = useGameStore((s) => s.world)
  const theme  = WORLDS[Math.max(0, world - 1)]

  const tilesData = useRef(
    Array.from({ length: N_TILES }, (_, i) => ({ id: i, z: TILE_L - i * TILE_L })),
  )
  const groupRefs = useRef(new Map<number, THREE.Group>())
  const [ids]     = useState(() => tilesData.current.map((t) => t.id))

  useEffect(() => {
    if (status === 'playing') {
      tilesData.current.forEach((tile, i) => {
        tile.z = TILE_L - i * TILE_L
        groupRefs.current.get(tile.id)?.position.set(0, 0, tile.z)
      })
    }
  }, [status])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const speed = getEffectiveSpeed(useGameStore.getState().score)
    for (const tile of tilesData.current) {
      tile.z += speed * delta
      if (tile.z > RECYCLE_Z + TILE_L / 2) tile.z -= TOTAL_L
      groupRefs.current.get(tile.id)?.position.set(0, 0, tile.z)
    }
  })

  return (
    <>
      {ids.map((id) => (
        <PlatformTile
          key={id}
          railColor={theme.railColor}
          crackColor={theme.crackColor}
          platformColor={theme.platformColor}
          ref={(el: THREE.Group | null) => {
            el ? groupRefs.current.set(id, el) : groupRefs.current.delete(id)
          }}
        />
      ))}
    </>
  )
}
