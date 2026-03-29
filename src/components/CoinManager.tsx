// ─── Gold coins + magnet power-up ────────────────────────────────────────────
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import type { PlayerPosition } from './Player'
import { getEffectiveSpeed, getLevel } from '../utils/difficulty'
import { magnetState, activateMagnet, MAGNET_DURATION } from '../utils/magnetState'

// ─── Coin mesh ────────────────────────────────────────────────────────────────
const CoinMesh = forwardRef<THREE.Group, {}>((_, ref) => (
  <group ref={ref}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.28, 0.28, 0.09, 16]} />
      <meshStandardMaterial color="#FFD700" emissive="#FF9900" emissiveIntensity={0.7} metalness={0.9} roughness={0.15} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.22, 0.04, 8, 16]} />
      <meshStandardMaterial color="#FF9900" emissive="#FF6600" emissiveIntensity={0.9} />
    </mesh>
    <mesh>
      <boxGeometry args={[0.09, 0.09, 0.10]} />
      <meshStandardMaterial color="#FFFF44" emissive="#FFCC00" emissiveIntensity={1.8} />
    </mesh>
  </group>
))
CoinMesh.displayName = 'CoinMesh'

// ─── Magnet power-up mesh ─────────────────────────────────────────────────────
const MagnetMesh = forwardRef<THREE.Group, {}>((_, ref) => (
  <group ref={ref}>
    {/* Left arm — red (S-Pol) */}
    <mesh position={[-0.19, 0.22, 0]}>
      <cylinderGeometry args={[0.10, 0.10, 0.44, 10]} />
      <meshStandardMaterial color="#ee3333" emissive="#bb1111" emissiveIntensity={1.6} />
    </mesh>
    {/* Right arm — blue (N-Pol) */}
    <mesh position={[0.19, 0.22, 0]}>
      <cylinderGeometry args={[0.10, 0.10, 0.44, 10]} />
      <meshStandardMaterial color="#3355ee" emissive="#1133bb" emissiveIntensity={1.6} />
    </mesh>
    {/* Top connector — silver */}
    <mesh position={[0, 0.46, 0]}>
      <boxGeometry args={[0.48, 0.14, 0.14]} />
      <meshStandardMaterial color="#cccccc" emissive="#888888" emissiveIntensity={0.8} metalness={0.8} />
    </mesh>
    {/* S-pole tip glow */}
    <mesh position={[-0.19, -0.01, 0]}>
      <sphereGeometry args={[0.13, 8, 8]} />
      <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={3.0} />
    </mesh>
    {/* N-pole tip glow */}
    <mesh position={[0.19, -0.01, 0]}>
      <sphereGeometry args={[0.13, 8, 8]} />
      <meshStandardMaterial color="#2244ff" emissive="#0022ff" emissiveIntensity={3.0} />
    </mesh>
  </group>
))
MagnetMesh.displayName = 'MagnetMesh'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Coin    { id: number; x: number; z: number; rot: number }
interface Magnet  { id: number; x: number; z: number; rot: number }

const SPAWN_Z       = -42
const DESPAWN_Z     = 12
const COLLECT_DIST  = 0.82
const MAGNET_PICKUP = 0.90     // slightly larger pickup radius for magnet
const COIN_Y        = 0.65
const MAGNET_Y      = 1.05
const COIN_EVERY    = 2.2      // seconds between coin clusters
const MAGNET_EVERY  = 20.0     // seconds between magnet spawns
const MAGNET_RADIUS = 9.0      // magnet pull radius

let _magnetIdCounter = 1000000  // separate id range from coins

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { posRef: React.MutableRefObject<PlayerPosition> }

export function CoinManager({ posRef }: Props) {
  const status  = useGameStore((s) => s.status)
  const addCoin = useGameStore((s) => s.addCoin)
  const setMagnetState = useGameStore((s) => s.setMagnetState)

  const coinsRef    = useRef<Coin[]>([])
  const magnetsRef  = useRef<Magnet[]>([])
  const groupRefs   = useRef(new Map<number, THREE.Group>())

  const [renderCoins,   setRenderCoins]   = useState<Coin[]>([])
  const [renderMagnets, setRenderMagnets] = useState<Magnet[]>([])

  const coinTimerRef   = useRef(1.5)
  const magnetTimerRef = useRef(MAGNET_EVERY)
  const nextCoinId     = useRef(0)

  useEffect(() => {
    if (status === 'playing') {
      coinsRef.current   = []
      magnetsRef.current = []
      groupRefs.current.clear()
      coinTimerRef.current   = 1.5
      magnetTimerRef.current = MAGNET_EVERY
      nextCoinId.current     = 0
      setRenderCoins([])
      setRenderMagnets([])
    }
  }, [status])

  const spawnCoins = useCallback((score: number) => {
    const level  = getLevel(score)
    const count  = level >= 5 ? 5 : level >= 3 ? 4 : 3
    const lanes  = [-3.0, -1.5, 0, 1.5, 3.0]
    const x      = lanes[Math.floor(Math.random() * lanes.length)]
    for (let i = 0; i < count; i++) {
      coinsRef.current.push({ id: nextCoinId.current++, x, z: SPAWN_Z - i * 2.2, rot: 0 })
    }
  }, [])

  const spawnMagnet = useCallback(() => {
    const lanes = [-2.5, 0, 2.5]
    const x     = lanes[Math.floor(Math.random() * lanes.length)]
    magnetsRef.current.push({ id: _magnetIdCounter++, x, z: SPAWN_Z, rot: 0 })
  }, [])

  useFrame((_, delta) => {
    if (status !== 'playing') return

    const score = useGameStore.getState().score
    const speed = getEffectiveSpeed(score)
    const px    = posRef.current.x
    const py    = posRef.current.y

    const toCollect: number[] = []
    const toPickup:  number[] = []

    // ── Update coins ──────────────────────────────────────────────────────────
    for (const coin of coinsRef.current) {
      // Magnet pull: override forward movement, pull toward player
      if (magnetState.active) {
        const dx  = px - coin.x
        const dz  = 0  - coin.z
        const len = Math.sqrt(dx * dx + dz * dz)
        if (len < MAGNET_RADIUS && len > 0.01) {
          const pull = Math.min(18, 18 * (1 - len / MAGNET_RADIUS) + 6)
          coin.x += (dx / len) * pull * delta
          coin.z += (dz / len) * pull * delta
        } else {
          coin.z += speed * delta
        }
      } else {
        coin.z += speed * delta
      }

      coin.rot += delta * 3.2

      const mesh = groupRefs.current.get(coin.id)
      if (mesh) { mesh.position.set(coin.x, COIN_Y, coin.z); mesh.rotation.y = coin.rot }

      const dx   = coin.x - px
      const dy   = COIN_Y - (py + 0.75)
      const dist = Math.sqrt(dx * dx + coin.z * coin.z + dy * dy)
      if (dist < COLLECT_DIST) { toCollect.push(coin.id); addCoin() }
    }

    // ── Update magnet pickups ─────────────────────────────────────────────────
    for (const mag of magnetsRef.current) {
      mag.z   += speed * delta
      mag.rot += delta * 1.5

      const mesh = groupRefs.current.get(mag.id)
      if (mesh) { mesh.position.set(mag.x, MAGNET_Y, mag.z); mesh.rotation.y = mag.rot }

      const dx   = mag.x - px
      const dy   = MAGNET_Y - (py + 0.75)
      const dist = Math.sqrt(dx * dx + mag.z * mag.z + dy * dy)
      if (dist < MAGNET_PICKUP) {
        toPickup.push(mag.id)
        activateMagnet()
        setMagnetState(true, MAGNET_DURATION)
      }
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────
    let changed = toCollect.length > 0 || toPickup.length > 0

    for (const id of [...toCollect, ...toPickup]) groupRefs.current.delete(id)

    const cbefore = coinsRef.current.length
    coinsRef.current = coinsRef.current.filter(
      (c) => c.z <= DESPAWN_Z && !toCollect.includes(c.id),
    )
    if (coinsRef.current.length !== cbefore) changed = true

    const mbefore = magnetsRef.current.length
    magnetsRef.current = magnetsRef.current.filter(
      (m) => m.z <= DESPAWN_Z && !toPickup.includes(m.id),
    )
    if (magnetsRef.current.length !== mbefore) changed = true

    // ── Spawn timers ──────────────────────────────────────────────────────────
    coinTimerRef.current -= delta
    if (coinTimerRef.current <= 0) {
      spawnCoins(score)
      coinTimerRef.current = COIN_EVERY
      changed = true
    }

    magnetTimerRef.current -= delta
    if (magnetTimerRef.current <= 0) {
      spawnMagnet()
      magnetTimerRef.current = MAGNET_EVERY
      changed = true
    }

    if (changed) {
      setRenderCoins([...coinsRef.current])
      setRenderMagnets([...magnetsRef.current])
    }
  })

  return (
    <>
      {renderCoins.map((coin) => (
        <CoinMesh
          key={coin.id}
          ref={(el: THREE.Group | null) => {
            el ? groupRefs.current.set(coin.id, el) : groupRefs.current.delete(coin.id)
          }}
        />
      ))}
      {renderMagnets.map((mag) => (
        <MagnetMesh
          key={mag.id}
          ref={(el: THREE.Group | null) => {
            el ? groupRefs.current.set(mag.id, el) : groupRefs.current.delete(mag.id)
          }}
        />
      ))}
    </>
  )
}
