import { forwardRef, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { getWorldSpeed } from '../utils/difficulty'

// ─── Instanced star field ─────────────────────────────────────────────────────
function Stars() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useEffect(() => {
    const d = new THREE.Object3D()
    for (let i = 0; i < 350; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.random() * Math.PI * 0.6
      const r     = 80 + Math.random() * 60
      d.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) + 5, r * Math.sin(phi) * Math.sin(theta) - 40)
      d.scale.setScalar(Math.random() * 0.2 + 0.04)
      d.updateMatrix()
      ref.current.setMatrixAt(i, d.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 350]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ddeeff" />
    </instancedMesh>
  )
}

// ─── Nebula / aurora planes ───────────────────────────────────────────────────
function Nebula() {
  return (
    <>
      <mesh position={[-35, 22, -75]} rotation={[0.08, 0.15, 0.2]}>
        <planeGeometry args={[55, 28]} />
        <meshBasicMaterial color="#220044" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[30, 28, -85]} rotation={[-0.05, -0.12, -0.15]}>
        <planeGeometry args={[60, 30]} />
        <meshBasicMaterial color="#002244" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 35, -100]} rotation={[0.1, 0, 0]}>
        <planeGeometry args={[80, 35]} />
        <meshBasicMaterial color="#110033" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

// ─── Scrolling energy rings ───────────────────────────────────────────────────
const EnergyRing = forwardRef<THREE.Group>((_, ref) => (
  <group ref={ref}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[6.8, 0.07, 10, 60]} />
      <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={3.0} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[5.2, 0.04, 8, 60]} />
      <meshStandardMaterial color="#0066ff" emissive="#0066ff" emissiveIntensity={2.0} />
    </mesh>
    <pointLight color="#00aaff" intensity={2.0} distance={12} />
  </group>
))
EnergyRing.displayName = 'EnergyRing'

const RING_SPACING = 22
const N_RINGS      = 6
const RING_TOTAL   = RING_SPACING * N_RINGS

function ScrollingRings() {
  const status    = useGameStore((s) => s.status)
  const ringsData = useRef(Array.from({ length: N_RINGS }, (_, i) => ({ id: i, z: -(i * RING_SPACING + 12) })))
  const groupRefs = useRef(new Map<number, THREE.Group>())
  const [ids]     = useState(() => ringsData.current.map((r) => r.id))

  useEffect(() => {
    if (status === 'playing') {
      ringsData.current.forEach((r, i) => { r.z = -(i * RING_SPACING + 12) })
    }
  }, [status])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const speed = getWorldSpeed(useGameStore.getState().score)
    for (const r of ringsData.current) {
      r.z += speed * delta
      if (r.z > 16) r.z -= RING_TOTAL
      groupRefs.current.get(r.id)?.position.set(0, 2.2, r.z)
    }
  })

  return (
    <>
      {ids.map((id) => (
        <EnergyRing
          key={id}
          ref={(el: THREE.Group | null) => { el ? groupRefs.current.set(id, el) : groupRefs.current.delete(id) }}
        />
      ))}
    </>
  )
}

// ─── Scrolling neon pillars ───────────────────────────────────────────────────
const PillarPair = forwardRef<THREE.Group>((_, ref) => (
  <group ref={ref}>
    {([-7.4, 7.4] as const).map((x) => (
      <group key={x}>
        <mesh position={[x, 2.0, 0]} castShadow>
          <boxGeometry args={[0.22, 4.0, 0.22]} />
          <meshStandardMaterial color="#1a2540" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[x, 4.15, 0]}>
          <boxGeometry args={[0.40, 0.22, 0.40]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[x, 0.06, 0]}>
          <boxGeometry args={[0.42, 0.12, 0.42]} />
          <meshStandardMaterial color="#0a1220" metalness={0.95} roughness={0.1} />
        </mesh>
        <pointLight position={[x, 4.15, 0]} color="#00aaff" intensity={1.4} distance={12} />
        {/* Base glow strip on ground */}
        <mesh position={[x, 0.01, 0]}>
          <boxGeometry args={[0.18, 0.02, 2.0]} />
          <meshStandardMaterial color="#0044ff" emissive="#0044ff" emissiveIntensity={1.5} />
        </mesh>
      </group>
    ))}
  </group>
))
PillarPair.displayName = 'PillarPair'

const PILLAR_SPACING = 10
const N_PILLARS      = 10
const PILLAR_TOTAL   = PILLAR_SPACING * N_PILLARS

function ScrollingPillars() {
  const status      = useGameStore((s) => s.status)
  const pillarsData = useRef(Array.from({ length: N_PILLARS }, (_, i) => ({ id: i, z: -(i * PILLAR_SPACING + 4) })))
  const groupRefs   = useRef(new Map<number, THREE.Group>())
  const [ids]       = useState(() => pillarsData.current.map((p) => p.id))

  useEffect(() => {
    if (status === 'playing') {
      pillarsData.current.forEach((p, i) => { p.z = -(i * PILLAR_SPACING + 4) })
    }
  }, [status])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const speed = getWorldSpeed(useGameStore.getState().score)
    for (const p of pillarsData.current) {
      p.z += speed * delta
      if (p.z > 14) p.z -= PILLAR_TOTAL
      groupRefs.current.get(p.id)?.position.set(0, 0, p.z)
    }
  })

  return (
    <>
      {ids.map((id) => (
        <PillarPair
          key={id}
          ref={(el: THREE.Group | null) => { el ? groupRefs.current.set(id, el) : groupRefs.current.delete(id) }}
        />
      ))}
    </>
  )
}

// ─── City backdrop (static) ───────────────────────────────────────────────────
function CityBackdrop() {
  const buildings = [
    { x: -32, h: 30, w: 5,  d: 5,  z: -80 },
    { x: -22, h: 18, w: 4,  d: 4,  z: -86 },
    { x: -40, h: 40, w: 6,  d: 6,  z: -75 },
    { x: -14, h: 22, w: 5,  d: 5,  z: -83 },
    { x:  32, h: 28, w: 5,  d: 5,  z: -80 },
    { x:  22, h: 16, w: 4,  d: 4,  z: -86 },
    { x:  42, h: 22, w: 7,  d: 7,  z: -73 },
    { x:   0, h: 48, w: 10, d: 10, z: -95 },
    { x:  12, h: 32, w: 6,  d: 6,  z: -90 },
    { x: -11, h: 20, w: 4,  d: 4,  z: -88 },
    { x:  55, h: 14, w: 8,  d: 8,  z: -70 },
    { x: -55, h: 18, w: 8,  d: 8,  z: -70 },
  ]

  return (
    <>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh castShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#192436" metalness={0.4} roughness={0.6} />
          </mesh>
          {/* Window rows */}
          {[0.65, 0.35, 0.1].map((fy, wi) => (
            <mesh key={wi} position={[0, b.h * (fy - 0.5), b.d / 2 + 0.02]}>
              <boxGeometry args={[b.w * 0.65, b.h * 0.05, 0.04]} />
              <meshStandardMaterial
                color={wi === 0 ? '#00d4ff' : wi === 1 ? '#4488ff' : '#0033aa'}
                emissive={wi === 0 ? '#00d4ff' : wi === 1 ? '#4488ff' : '#0033aa'}
                emissiveIntensity={wi === 0 ? 0.9 : 0.6}
                transparent
                opacity={0.85}
              />
            </mesh>
          ))}
          {/* Roof glow */}
          <mesh position={[0, b.h / 2 + 0.05, 0]}>
            <boxGeometry args={[b.w * 0.4, 0.06, b.d * 0.4]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ─── Glowing ground cracks ────────────────────────────────────────────────────
function GroundCracks() {
  // Decorative emissive strips on the ground, extending ahead
  return (
    <>
      {[-3.5, -1.2, 1.2, 3.5].map((x, i) => (
        <mesh key={i} position={[x, -0.004, -30]}>
          <boxGeometry args={[0.04, 0.008, 60]} />
          <meshStandardMaterial color="#0033cc" emissive="#0033cc" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </>
  )
}

// ─── Ground plane ─────────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh position={[0, -1.06, -50]} receiveShadow>
      <boxGeometry args={[300, 0.1, 200]} />
      <meshStandardMaterial color="#0e1825" roughness={1} metalness={0} />
    </mesh>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function Environment() {
  return (
    <>
      <Stars />
      <Nebula />
      <ScrollingRings />
      <ScrollingPillars />
      <CityBackdrop />
      <GroundCracks />
      <Ground />
    </>
  )
}
