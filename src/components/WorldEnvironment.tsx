// ─── Rich world environment ────────────────────────────────────────────────────
import { forwardRef, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { getEffectiveSpeed } from '../utils/difficulty'
import { WORLDS } from '../utils/worldThemes'

// ─── Scrolling track-side posts/trees ─────────────────────────────────────────
const DECO_SPACING = 12
const N_DECOS      = 9
const DECO_TOTAL   = DECO_SPACING * N_DECOS

function CityPost({ x }: { x: number }) {
  const dir = x < 0 ? 1 : -1
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 5.2, 8]} />
        <meshStandardMaterial color="#777777" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[dir * 0.28, 4.9, 0]} rotation={[0, 0, dir * 0.35]}>
        <cylinderGeometry args={[0.04, 0.04, 0.66, 8]} />
        <meshStandardMaterial color="#777777" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[dir * 0.52, 4.80, 0]}>
        <sphereGeometry args={[0.17, 8, 8]} />
        <meshStandardMaterial color="#ffffbb" emissive="#ffee66" emissiveIntensity={2.5} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.38, 0.16, 0.38]} />
        <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.7} />
      </mesh>
    </group>
  )
}

function ForestPost({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.17, 0.24, 3.8, 7]} />
        <meshStandardMaterial color="#7a4a1a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.1, 0]}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshStandardMaterial color="#2d7a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.1, 0]}>
        <sphereGeometry args={[0.82, 8, 8]} />
        <meshStandardMaterial color="#3d9a3a" roughness={0.9} />
      </mesh>
      {/* Root bumps */}
      <mesh position={[0.28, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.07, 0.12, 0.3, 5]} />
        <meshStandardMaterial color="#6a3a10" roughness={0.95} />
      </mesh>
      <mesh position={[-0.22, 0.1, 0.18]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.06, 0.10, 0.25, 5]} />
        <meshStandardMaterial color="#6a3a10" roughness={0.95} />
      </mesh>
    </group>
  )
}

function IcePost({ x }: { x: number }) {
  const side = x < 0 ? 1 : -1
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0, 0.42, 4.6, 6]} />
        <meshStandardMaterial color="#b8e8ff" emissive="#88ccff" emissiveIntensity={0.5} transparent opacity={0.82} />
      </mesh>
      <mesh position={[side * 0.34, 1.5, 0]} rotation={[0, 0.6, 0.32]}>
        <cylinderGeometry args={[0, 0.26, 3.0, 6]} />
        <meshStandardMaterial color="#d8f4ff" emissive="#aaddff" emissiveIntensity={0.3} transparent opacity={0.75} />
      </mesh>
      <mesh position={[side * 0.15, 0.7, 0.2]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0, 0.16, 1.8, 6]} />
        <meshStandardMaterial color="#eef8ff" emissive="#cceeFF" emissiveIntensity={0.2} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function VolcanoPost({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.20, 0.28, 1.3, 8]} />
        <meshStandardMaterial color="#3a2810" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 2.3, 8]} />
        <meshStandardMaterial color="#2e1e08" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.65, 0]}>
        <sphereGeometry args={[0.27, 8, 8]} />
        <meshStandardMaterial color="#ff7700" emissive="#ff3300" emissiveIntensity={3.5} />
      </mesh>
      {/* Flame wisps */}
      <mesh position={[0.08, 3.95, 0]}>
        <sphereGeometry args={[0.14, 6, 6]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={2.5} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

const DecoPair = forwardRef<THREE.Group, { world: number }>((props, ref) => (
  <group ref={ref}>
    {([-6.5, 6.5] as const).map((x) => (
      <group key={x}>
        {props.world === 1 && <CityPost x={x} />}
        {props.world === 2 && <ForestPost x={x} />}
        {props.world === 3 && <IcePost x={x} />}
        {props.world === 4 && <VolcanoPost x={x} />}
      </group>
    ))}
  </group>
))
DecoPair.displayName = 'DecoPair'

function ScrollingDecorations() {
  const status    = useGameStore((s) => s.status)
  const world     = useGameStore((s) => s.world)
  const decoData  = useRef(Array.from({ length: N_DECOS }, (_, i) => ({ id: i, z: -(i * DECO_SPACING + 4) })))
  const groupRefs = useRef(new Map<number, THREE.Group>())
  const [ids]     = useState(() => decoData.current.map((d) => d.id))

  useEffect(() => {
    if (status === 'playing') decoData.current.forEach((d, i) => { d.z = -(i * DECO_SPACING + 4) })
  }, [status])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const speed = getEffectiveSpeed(useGameStore.getState().score)
    for (const d of decoData.current) {
      d.z += speed * delta
      if (d.z > 14) d.z -= DECO_TOTAL
      groupRefs.current.get(d.id)?.position.set(0, 0, d.z)
    }
  })

  return (
    <>
      {ids.map((id) => (
        <DecoPair key={id} world={world}
          ref={(el: THREE.Group | null) => { el ? groupRefs.current.set(id, el) : groupRefs.current.delete(id) }}
        />
      ))}
    </>
  )
}

// ─── Close-up ground detail components ───────────────────────────────────────
function Flower({ x, y, z, color, h = 0.38 }: { x: number; y: number; z: number; color: string; h?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, h * 0.5, 0]}>
        <cylinderGeometry args={[0.025, 0.025, h, 5]} />
        <meshStandardMaterial color="#44bb22" roughness={0.9} />
      </mesh>
      <mesh position={[0, h + 0.10, 0]}>
        <sphereGeometry args={[0.11, 6, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.8} />
      </mesh>
      {/* Tiny petals */}
      {([0, 1, 2, 3, 4] as const).map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.12, h + 0.10, Math.sin(a) * 0.12]}>
            <sphereGeometry args={[0.055, 5, 5]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

function GrassTuft({ x, y, z, color = '#44aa22' }: { x: number; y: number; z: number; color?: string }) {
  const blades: Array<[number, number, number, number]> = [
    [-0.10, 0.22, 0.0,  0.25],
    [0.0,   0.28, 0.0, -0.20],
    [0.10,  0.20, 0.0,  0.30],
    [-0.04, 0.24, 0.06, 0.0 ],
    [0.06,  0.18, -0.04, -0.15],
  ]
  return (
    <group position={[x, y, z]}>
      {blades.map(([bx, h, bz, lean], i) => (
        <mesh key={i} position={[bx, h / 2, bz]} rotation={[0, 0, lean]}>
          <boxGeometry args={[0.04, h, 0.035]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

function SmallBush({ x, y, z, r = 0.32, color = '#2d7a22' }: {
  x: number; y: number; z: number; r?: number; color?: string
}) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, r * 0.7, 0]}>
        <sphereGeometry args={[r, 8, 7]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      <mesh position={[r * 0.55, r * 0.5, 0]}>
        <sphereGeometry args={[r * 0.7, 7, 6]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      <mesh position={[-r * 0.45, r * 0.45, 0.1]}>
        <sphereGeometry args={[r * 0.65, 7, 6]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
    </group>
  )
}

function Rock({ x, y, z, s = 0.22, color = '#888888' }: {
  x: number; y: number; z: number; s?: number; color?: string
}) {
  return (
    <mesh position={[x, y + s * 0.45, z]} scale={[s, s * 0.65, s * 0.85]} rotation={[0, Math.random() * 3, 0]}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshStandardMaterial color={color} roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

function SnowMound({ x, y, z, r = 0.38 }: { x: number; y: number; z: number; r?: number }) {
  return (
    <mesh position={[x, y + r * 0.3, z]} scale={[1, 0.45, 0.85]}>
      <sphereGeometry args={[r, 8, 7]} />
      <meshStandardMaterial color="#eef8ff" roughness={0.85} />
    </mesh>
  )
}

function LavaRock({ x, y, z, s = 0.3 }: { x: number; y: number; z: number; s?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, s * 0.5, 0]} scale={[s, s * 0.7, s * 0.9]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshStandardMaterial color="#2a1400" roughness={0.98} />
      </mesh>
      {/* Glowing crack */}
      <mesh position={[0, s * 0.52, s * 0.5]}>
        <boxGeometry args={[s * 0.5, 0.04, 0.04]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={3.0} />
      </mesh>
    </group>
  )
}

// ─── Per-world ground detail clusters ────────────────────────────────────────
function CityGroundDetail({ side }: { side: -1 | 1 }) {
  const sx = side * 7.2
  return (
    <group>
      <SmallBush x={sx} y={-1.0} z={0}    r={0.30} color="#2a7a1a" />
      <Flower    x={sx + side * 0.55} y={-1.0} z={0.15} color="#ff4488" h={0.44} />
      <Flower    x={sx - side * 0.40} y={-1.0} z={-0.2} color="#ffcc00" h={0.36} />
      <Flower    x={sx + side * 0.15} y={-1.0} z={-0.4} color="#ff8800" h={0.32} />
      <Rock      x={sx + side * 0.7}  y={-1.0} z={-0.3} s={0.18} color="#999999" />
      <GrassTuft x={sx - side * 0.6} y={-1.0} z={0.3} />
    </group>
  )
}

function ForestGroundDetail({ side, variant }: { side: -1 | 1; variant: number }) {
  const sx   = side * 7.0
  const even = variant % 2 === 0
  return (
    <group>
      <GrassTuft x={sx}              y={-1.0} z={0}    color="#3aaa1a" />
      <GrassTuft x={sx + side * 0.4} y={-1.0} z={0.28} color="#44bb22" />
      <Flower    x={sx + side * 0.6} y={-1.0} z={-0.1} color={even ? '#ff2222' : '#4488ff'} h={0.42} />
      <Flower    x={sx - side * 0.3} y={-1.0} z={0.35} color={even ? '#ffee00' : '#ff88cc'} h={0.34} />
      <Rock      x={sx + side * 0.2} y={-1.0} z={-0.35} s={0.24} color="#7a6040" />
      {even && <SmallBush x={sx - side * 0.7} y={-1.0} z={0.1} r={0.28} color="#1d5a14" />}
      {!even && (
        <group position={[sx + side * 0.8, -1.0, 0.4]}>
          {/* Mini mushroom */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.44, 7]} />
            <meshStandardMaterial color="#f0dfc8" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[0.28, 8, 7]} />
            <meshStandardMaterial color="#cc2211" roughness={0.8} />
          </mesh>
          <mesh position={[0.10, 0.56, 0.18]}>
            <sphereGeometry args={[0.05, 5, 5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <mesh position={[-0.08, 0.60, 0.14]}>
            <sphereGeometry args={[0.04, 5, 5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function IceGroundDetail({ side, variant }: { side: -1 | 1; variant: number }) {
  const sx   = side * 7.1
  const even = variant % 2 === 0
  return (
    <group>
      <SnowMound x={sx}              y={-1.0} z={0}    r={even ? 0.40 : 0.32} />
      <SnowMound x={sx + side * 0.5} y={-1.0} z={0.3}  r={0.25} />
      <Rock      x={sx - side * 0.3} y={-1.0} z={-0.3} s={0.20} color="#aaccdd" />
      {/* Small ice shard */}
      <mesh position={[sx + side * 0.65, -0.88, 0.15]} rotation={[0, 0, side * 0.25]}>
        <cylinderGeometry args={[0, 0.12, 0.55, 6]} />
        <meshStandardMaterial color="#ccf0ff" emissive="#88ddff" emissiveIntensity={0.4} transparent opacity={0.8} />
      </mesh>
      <mesh position={[sx + side * 0.38, -0.90, -0.22]} rotation={[0, 1.2, side * 0.35]}>
        <cylinderGeometry args={[0, 0.08, 0.38, 6]} />
        <meshStandardMaterial color="#e0f8ff" emissive="#aaeeff" emissiveIntensity={0.3} transparent opacity={0.75} />
      </mesh>
      {/* Frost patch */}
      <mesh position={[sx, -1.00, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 8]} />
        <meshStandardMaterial color="#ddf0ff" roughness={0.7} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

function VolcanoGroundDetail({ side, variant }: { side: -1 | 1; variant: number }) {
  const sx = side * 7.0
  return (
    <group>
      <LavaRock x={sx}              y={-1.0} z={0}    s={0.32} />
      <LavaRock x={sx + side * 0.5} y={-1.0} z={-0.3} s={0.22} />
      <LavaRock x={sx - side * 0.3} y={-1.0} z={0.35}  s={0.18} />
      <Rock     x={sx + side * 0.7} y={-1.0} z={0.2}  s={0.25} color="#3a1a00" />
      {/* Dead stump */}
      {variant % 3 === 0 && (
        <mesh position={[sx - side * 0.5, -0.85, -0.4]}>
          <cylinderGeometry args={[0.10, 0.14, 0.30, 7]} />
          <meshStandardMaterial color="#1a0a00" roughness={0.98} />
        </mesh>
      )}
      {/* Ash patch */}
      <mesh position={[sx, -1.00, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 7]} />
        <meshStandardMaterial color="#2a1800" roughness={0.99} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

// ─── Scrolling ground details ──────────────────────────────────────────────────
const DETAIL_SPACING = 5.5
const N_DETAILS      = 14
const DETAIL_TOTAL   = DETAIL_SPACING * N_DETAILS

const GroundDetailPair = forwardRef<THREE.Group, { world: number; variant: number }>((props, ref) => (
  <group ref={ref}>
    {([-1, 1] as const).map((side) => (
      <group key={side}>
        {props.world === 1 && <CityGroundDetail side={side} />}
        {props.world === 2 && <ForestGroundDetail side={side} variant={props.variant} />}
        {props.world === 3 && <IceGroundDetail side={side} variant={props.variant} />}
        {props.world === 4 && <VolcanoGroundDetail side={side} variant={props.variant} />}
      </group>
    ))}
  </group>
))
GroundDetailPair.displayName = 'GroundDetailPair'

function ScrollingGroundDetails() {
  const status     = useGameStore((s) => s.status)
  const world      = useGameStore((s) => s.world)
  const detailData = useRef(Array.from({ length: N_DETAILS }, (_, i) => ({
    id: i,
    z:  -(i * DETAIL_SPACING + 2),
    variant: i % 4,
  })))
  const groupRefs  = useRef(new Map<number, THREE.Group>())
  const [ids]      = useState(() => detailData.current.map((d) => d.id))

  useEffect(() => {
    if (status === 'playing') {
      detailData.current.forEach((d, i) => { d.z = -(i * DETAIL_SPACING + 2) })
    }
  }, [status])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const speed = getEffectiveSpeed(useGameStore.getState().score)
    for (const d of detailData.current) {
      d.z += speed * delta
      if (d.z > 12) d.z -= DETAIL_TOTAL
      groupRefs.current.get(d.id)?.position.set(0, 0, d.z)
    }
  })

  return (
    <>
      {ids.map((id) => (
        <GroundDetailPair key={id} world={world} variant={detailData.current[id]?.variant ?? 0}
          ref={(el: THREE.Group | null) => { el ? groupRefs.current.set(id, el) : groupRefs.current.delete(id) }}
        />
      ))}
    </>
  )
}

// ─── Atmospheric particles ─────────────────────────────────────────────────────
const PART_COUNT = 55
const PART_SPAWN_Z = -58

interface Particle {
  id: number; x: number; y: number; z: number
  vx: number; vy: number; rotX: number; rotZ: number; rotSp: number
}

function AtmosphericParticles() {
  const status = useGameStore((s) => s.status)
  const world  = useGameStore((s) => s.world)
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy   = useRef(new THREE.Object3D())

  const particles = useRef<Particle[]>(
    Array.from({ length: PART_COUNT }, (_, i) => ({
      id:    i,
      x:     (Math.random() - 0.5) * 22,
      y:     Math.random() * 7 + 0.5,
      z:     PART_SPAWN_Z + Math.random() * 65,
      vx:    (Math.random() - 0.5) * 0.6,
      vy:    0,
      rotX:  Math.random() * Math.PI * 2,
      rotZ:  Math.random() * Math.PI * 2,
      rotSp: (Math.random() - 0.5) * 2.2,
    })),
  )

  useFrame((_, delta) => {
    if (!meshRef.current || status !== 'playing') return
    const score = useGameStore.getState().score
    const speed = getEffectiveSpeed(score)
    const t = performance.now() * 0.001

    for (const p of particles.current) {
      p.z += speed * delta

      // World-specific drift
      if (world === 1) {
        // Leaves: sway + fall
        p.x  += p.vx * delta + Math.sin(t * 0.8 + p.id) * 0.015
        p.y  -= 0.55 * delta
        p.rotX += p.rotSp * delta
      } else if (world === 2) {
        // Fireflies: bob up/down gently
        p.x  += p.vx * delta
        p.y  += Math.sin(t * 1.2 + p.id * 0.7) * 0.6 * delta
        p.rotX += p.rotSp * 0.4 * delta
      } else if (world === 3) {
        // Snow: fall straight, slight drift
        p.x  += Math.sin(t * 0.5 + p.id * 0.9) * 0.2 * delta
        p.y  -= 1.0 * delta
        p.rotZ += p.rotSp * 0.5 * delta
      } else {
        // Embers: rise + spread
        p.x  += p.vx * delta * 1.4
        p.y  += 1.2 * delta
        p.rotX += p.rotSp * delta
      }

      // Recycle
      if (p.z > 14 || p.y < 0.1 || p.y > 10) {
        p.z  = PART_SPAWN_Z
        p.x  = (Math.random() - 0.5) * 22
        p.y  = world === 3 ? 8 + Math.random() * 2 : Math.random() * 6 + 0.5
        p.vx = (Math.random() - 0.5) * 0.6
      }

      dummy.current.position.set(p.x, p.y, p.z)
      dummy.current.rotation.set(p.rotX, 0, p.rotZ)

      if (world === 1) {
        // Leaves: flat, tumbling
        dummy.current.scale.set(0.18, 0.12, 0.015)
      } else if (world === 2) {
        // Fireflies: tiny spheres
        dummy.current.scale.set(0.06, 0.06, 0.06)
      } else if (world === 3) {
        // Snowflakes: tiny flat squares
        dummy.current.scale.set(0.10, 0.10, 0.012)
      } else {
        // Embers: tiny
        dummy.current.scale.set(0.07, 0.07, 0.07)
      }

      dummy.current.updateMatrix()
      meshRef.current.setMatrixAt(p.id, dummy.current.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  const color   = world === 1 ? '#cc8833' : world === 2 ? '#aaff44' : world === 3 ? '#ddf4ff' : '#ff6600'
  const emissive = world === 2 ? '#88ff00' : world === 4 ? '#ff3300' : '#000000'
  const emissInt = world === 2 ? 2.0 : world === 4 ? 2.5 : 0.0

  if (status !== 'playing') return null
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PART_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissInt} transparent opacity={world === 2 ? 0.95 : 0.7} />
    </instancedMesh>
  )
}

// ─── City backdrop ─────────────────────────────────────────────────────────────
function CityHouse({ x, z, h, w, bodyColor, roofColor }: {
  x: number; z: number; h: number; w: number; bodyColor: string; roofColor: string
}) {
  const d = w * 0.72
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, h + 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[w * 0.80, 1.8, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.9} />
      </mesh>
      {/* Lit window */}
      <mesh position={[0, h * 0.56, d / 2 + 0.03]}>
        <boxGeometry args={[w * 0.40, h * 0.28, 0.06]} />
        <meshStandardMaterial color="#fffcc8" emissive="#ffe888" emissiveIntensity={0.9} transparent opacity={0.92} />
      </mesh>
      {/* Door */}
      <mesh position={[0, h * 0.20, d / 2 + 0.03]}>
        <boxGeometry args={[w * 0.22, h * 0.42, 0.06]} />
        <meshStandardMaterial color={roofColor} roughness={0.9} />
      </mesh>
      {/* Chimney */}
      <mesh position={[w * 0.28, h + 1.4, 0]}>
        <boxGeometry args={[0.22, 0.8, 0.22]} />
        <meshStandardMaterial color="#cc5533" roughness={0.9} />
      </mesh>
    </group>
  )
}

function CityTree({ x, z, h = 3.0 }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h * 0.38, 0]}>
        <cylinderGeometry args={[0.14, 0.20, h * 0.75, 7]} />
        <meshStandardMaterial color="#7a4a1a" roughness={0.95} />
      </mesh>
      <mesh position={[0, h * 0.85, 0]}>
        <sphereGeometry args={[h * 0.30, 8, 8]} />
        <meshStandardMaterial color="#2d7a22" roughness={0.9} />
      </mesh>
      <mesh position={[0, h * 1.05, 0]}>
        <sphereGeometry args={[h * 0.20, 7, 7]} />
        <meshStandardMaterial color="#3d9a2a" roughness={0.9} />
      </mesh>
    </group>
  )
}

function CityBackdrop() {
  const lHouses = [
    { x: -11, z: -24, h: 4.0, w: 3.5, bodyColor: '#ff6b8a', roofColor: '#cc2244' },
    { x: -15, z: -22, h: 6.0, w: 4.5, bodyColor: '#ffd344', roofColor: '#cc8800' },
    { x: -11, z: -40, h: 3.5, w: 3.0, bodyColor: '#44aaff', roofColor: '#2255cc' },
    { x: -15, z: -38, h: 7.5, w: 5.5, bodyColor: '#88dd55', roofColor: '#338822' },
    { x: -11, z: -55, h: 5.0, w: 4.0, bodyColor: '#ff9944', roofColor: '#cc5522' },
    { x: -15, z: -55, h: 4.5, w: 3.5, bodyColor: '#cc88ff', roofColor: '#7733cc' },
    { x: -11, z: -70, h: 6.5, w: 4.5, bodyColor: '#ff6b8a', roofColor: '#cc2244' },
    { x: -15, z: -70, h: 4.0, w: 3.5, bodyColor: '#44aaff', roofColor: '#2255cc' },
    { x: -11, z: -84, h: 5.0, w: 4.0, bodyColor: '#ffd344', roofColor: '#cc8800' },
    { x: -15, z: -85, h: 3.5, w: 3.0, bodyColor: '#88dd55', roofColor: '#338822' },
  ]
  const lTrees = [
    { x: -8.5, z: -31 }, { x: -8.5, z: -47 }, { x: -8.5, z: -63 }, { x: -8.5, z: -77 },
  ]
  return (
    <>
      {lHouses.map((h, i) => <CityHouse key={`lh${i}`} {...h} />)}
      {lHouses.map((h, i) => <CityHouse key={`rh${i}`} {...h} x={-h.x} />)}
      {lTrees.map((t, i) => <CityTree key={`lt${i}`} {...t} />)}
      {lTrees.map((t, i) => <CityTree key={`rt${i}`} x={-t.x} z={t.z} />)}
    </>
  )
}

// ─── Forest backdrop ──────────────────────────────────────────────────────────
function BigTree({ x, z, h, r, c1, c2, c3 }: {
  x: number; z: number; h: number; r: number; c1: string; c2: string; c3?: string
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h * 0.42, 0]}>
        <cylinderGeometry args={[r * 0.22, r * 0.32, h * 0.82, 7]} />
        <meshStandardMaterial color="#6a3a10" roughness={0.95} />
      </mesh>
      {/* Roots */}
      {([0.3, -0.25, 0.05] as const).map((rx, i) => (
        <mesh key={i} position={[rx, 0.12, i * 0.15 - 0.1]} rotation={[0, 0, rx * 0.5]}>
          <cylinderGeometry args={[0.06, 0.10, 0.28, 5]} />
          <meshStandardMaterial color="#5a2a08" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, h * 0.72, 0]}>
        <sphereGeometry args={[r, 8, 8]} />
        <meshStandardMaterial color={c1} roughness={0.9} />
      </mesh>
      <mesh position={[0, h * 0.88, 0]}>
        <sphereGeometry args={[r * 0.75, 8, 8]} />
        <meshStandardMaterial color={c2} roughness={0.9} />
      </mesh>
      {c3 && (
        <mesh position={[0, h * 1.02, 0]}>
          <sphereGeometry args={[r * 0.5, 7, 7]} />
          <meshStandardMaterial color={c3} roughness={0.9} />
        </mesh>
      )}
    </group>
  )
}

function Mushroom({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 1.0, 8]} />
        <meshStandardMaterial color="#f0e0c8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.55, 10, 10]} />
        <meshStandardMaterial color="#ee3322" roughness={0.8} />
      </mesh>
      {([[0.22, 0.14], [-0.18, 0.26], [0.04, 0.34], [-0.28, 0.07]] as const).map(([ox, oy], i) => (
        <mesh key={i} position={[ox, 1.12 + oy, 0.48]}>
          <sphereGeometry args={[0.068, 6, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function ForestBackdrop() {
  const lTrees = [
    { x: -10, z: -20, h: 8,  r: 2.8, c1: '#2d6a20', c2: '#3d8a2a', c3: '#4aaa33' },
    { x: -14, z: -22, h: 11, r: 3.5, c1: '#1d5a14', c2: '#2d7a22', c3: '#3d8a2a' },
    { x: -10, z: -38, h: 7,  r: 2.5, c1: '#3d8a2a', c2: '#4aaa33' },
    { x: -14, z: -40, h: 10, r: 3.2, c1: '#2d6a20', c2: '#3d8a2a', c3: '#4aaa33' },
    { x: -10, z: -55, h: 9,  r: 3.0, c1: '#1d5a14', c2: '#2d7a22', c3: '#3d8a2a' },
    { x: -14, z: -55, h: 7,  r: 2.4, c1: '#3d8a2a', c2: '#4aaa33' },
    { x: -10, z: -70, h: 10, r: 3.4, c1: '#2d6a20', c2: '#3d8a2a', c3: '#4aaa33' },
    { x: -14, z: -70, h: 8,  r: 2.8, c1: '#1d5a14', c2: '#2d7a22' },
    { x: -10, z: -85, h: 7,  r: 2.5, c1: '#3d8a2a', c2: '#4aaa33', c3: '#55cc40' },
  ]
  const lMush = [
    { x: -8.2, z: -28, scale: 1.0 }, { x: -8.8, z: -46, scale: 0.7 },
    { x: -8.0, z: -62, scale: 1.2 }, { x: -8.6, z: -78, scale: 0.8 },
    { x: -9.0, z: -34, scale: 0.5 }, { x: -8.4, z: -55, scale: 0.6 },
  ]
  return (
    <>
      {lTrees.map((t, i) => <BigTree key={`lt${i}`} {...t} c3={t.c3 ?? undefined} />)}
      {lTrees.map((t, i) => <BigTree key={`rt${i}`} {...t} x={-t.x} c3={t.c3 ?? undefined} />)}
      {lMush.map((m, i) => <Mushroom key={`lm${i}`} x={m.x} z={m.z} scale={m.scale} />)}
      {lMush.map((m, i) => <Mushroom key={`rm${i}`} x={-m.x} z={m.z} scale={m.scale} />)}
    </>
  )
}

// ─── Ice backdrop ─────────────────────────────────────────────────────────────
function IceCrystal({ x, z, h, r }: { x: number; z: number; h: number; r: number }) {
  const side = x < 0 ? 1 : -1
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0, r, h, 6]} />
        <meshStandardMaterial color="#c8ecff" emissive="#88ccff" emissiveIntensity={0.4} transparent opacity={0.80} />
      </mesh>
      <mesh position={[side * r * 0.7, h * 0.35, 0]} rotation={[0, 0.8, 0.3]}>
        <cylinderGeometry args={[0, r * 0.55, h * 0.7, 6]} />
        <meshStandardMaterial color="#d8f4ff" emissive="#aaddff" emissiveIntensity={0.3} transparent opacity={0.75} />
      </mesh>
      <mesh position={[side * r * 0.3, h * 0.2, 0.2]} rotation={[0, 0, -side * 0.5]}>
        <cylinderGeometry args={[0, r * 0.35, h * 0.45, 6]} />
        <meshStandardMaterial color="#eef8ff" emissive="#cceeFF" emissiveIntensity={0.2} transparent opacity={0.70} />
      </mesh>
    </group>
  )
}

function FrozenTree({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h * 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.18, h * 0.8, 6]} />
        <meshStandardMaterial color="#ccddee" roughness={0.85} />
      </mesh>
      <mesh position={[0, h * 0.85, 0]}>
        <sphereGeometry args={[h * 0.24, 8, 8]} />
        <meshStandardMaterial color="#eef8ff" roughness={0.75} />
      </mesh>
      <mesh position={[0, h * 1.0, 0]}>
        <sphereGeometry args={[h * 0.16, 7, 7]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
    </group>
  )
}

function IceBackdrop() {
  const lCrystals = [
    { x: -10, z: -22, h: 6,  r: 1.2 }, { x: -14, z: -22, h: 9,  r: 1.8 },
    { x: -10, z: -38, h: 7,  r: 1.4 }, { x: -14, z: -38, h: 5,  r: 1.0 },
    { x: -12, z: -53, h: 10, r: 2.0 }, { x: -10, z: -68, h: 6,  r: 1.3 },
    { x: -14, z: -68, h: 8,  r: 1.6 }, { x: -10, z: -83, h: 7,  r: 1.5 },
  ]
  const lTrees = [
    { x: -8.5, z: -28, h: 4.0 }, { x: -8.5, z: -45, h: 5.0 },
    { x: -8.5, z: -60, h: 3.5 }, { x: -8.5, z: -75, h: 4.5 },
  ]
  return (
    <>
      {lCrystals.map((c, i) => <IceCrystal key={`lc${i}`} {...c} />)}
      {lCrystals.map((c, i) => <IceCrystal key={`rc${i}`} {...c} x={-c.x} />)}
      {lTrees.map((t, i) => <FrozenTree key={`lt${i}`} {...t} />)}
      {lTrees.map((t, i) => <FrozenTree key={`rt${i}`} {...t} x={-t.x} />)}
    </>
  )
}

// ─── Volcano backdrop ─────────────────────────────────────────────────────────
function VolcanoRock({ x, z, h, w }: { x: number; z: number; h: number; w: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[w * 0.38, w, h, 5]} />
        <meshStandardMaterial color="#4a2a00" roughness={0.95} />
      </mesh>
      <mesh position={[0, h + 0.06, 0]}>
        <boxGeometry args={[w * 0.6, 0.12, w * 0.6]} />
        <meshStandardMaterial color="#ff5500" emissive="#ff2200" emissiveIntensity={2.0} />
      </mesh>
    </group>
  )
}

function VolcanoBackdrop() {
  const lRocks = [
    { x: -10, z: -22, h: 5,  w: 3.5 }, { x: -14, z: -22, h: 8,  w: 4.5 },
    { x: -10, z: -38, h: 6,  w: 4.0 }, { x: -14, z: -38, h: 4,  w: 3.0 },
    { x: -12, z: -53, h: 10, w: 5.5 }, { x: -10, z: -68, h: 7,  w: 3.8 },
    { x: -14, z: -70, h: 5,  w: 3.5 }, { x: -10, z: -83, h: 8,  w: 4.5 },
  ]
  return (
    <>
      {lRocks.map((r, i) => <VolcanoRock key={`lr${i}`} {...r} />)}
      {lRocks.map((r, i) => <VolcanoRock key={`rr${i}`} {...r} x={-r.x} />)}
      {/* Background volcano cone */}
      <mesh position={[0, 0, -105]}>
        <cylinderGeometry args={[0, 18, 36, 12]} />
        <meshStandardMaterial color="#3a1800" roughness={0.95} />
      </mesh>
      <mesh position={[0, 36, -105]}>
        <sphereGeometry args={[2.8, 10, 10]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={4.0} />
      </mesh>
      {/* Lava river at base */}
      <mesh position={[0, 0.05, -95]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 20]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={1.5} transparent opacity={0.85} />
      </mesh>
    </>
  )
}

function WorldBackdrop() {
  const world = useGameStore((s) => s.world)
  if (world === 1) return <CityBackdrop />
  if (world === 2) return <ForestBackdrop />
  if (world === 3) return <IceBackdrop />
  return <VolcanoBackdrop />
}

// ─── Ground ────────────────────────────────────────────────────────────────────
function Ground() {
  const world = useGameStore((s) => s.world)
  const theme = WORLDS[Math.max(0, world - 1)]

  const grassColor    = world === 1 ? '#4a8a2a' : world === 2 ? '#3a7a1a' : world === 3 ? '#c8e8f8' : '#1a0a00'
  const sidewalkColor = world === 1 ? '#b0b0b0' : world === 2 ? '#9a7a4a' : world === 3 ? '#c0d8ee' : '#2a1800'
  const curbColor     = world === 1 ? '#d8d8d8' : world === 2 ? '#bb9944' : world === 3 ? '#a8c8e8' : '#4a2800'

  return (
    <>
      {/* Main road */}
      <mesh position={[0, -1.06, -50]} receiveShadow>
        <boxGeometry args={[10, 0.10, 200]} />
        <meshStandardMaterial color={theme.platformColor} roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Road curbs */}
      <mesh position={[-5.12, -0.98, -50]}>
        <boxGeometry args={[0.24, 0.16, 200]} />
        <meshStandardMaterial color={curbColor} roughness={0.65} />
      </mesh>
      <mesh position={[5.12, -0.98, -50]}>
        <boxGeometry args={[0.24, 0.16, 200]} />
        <meshStandardMaterial color={curbColor} roughness={0.65} />
      </mesh>
      {/* Sidewalk strips */}
      <mesh position={[-7.6, -1.09, -50]} receiveShadow>
        <boxGeometry args={[5.0, 0.08, 200]} />
        <meshStandardMaterial color={sidewalkColor} roughness={0.9} />
      </mesh>
      <mesh position={[7.6, -1.09, -50]} receiveShadow>
        <boxGeometry args={[5.0, 0.08, 200]} />
        <meshStandardMaterial color={sidewalkColor} roughness={0.9} />
      </mesh>
      {/* Grass terrain */}
      <mesh position={[-22, -1.13, -50]} receiveShadow>
        <boxGeometry args={[34, 0.08, 200]} />
        <meshStandardMaterial color={grassColor} roughness={0.95} />
      </mesh>
      <mesh position={[22, -1.13, -50]} receiveShadow>
        <boxGeometry args={[34, 0.08, 200]} />
        <meshStandardMaterial color={grassColor} roughness={0.95} />
      </mesh>
      {/* Far ground plane */}
      <mesh position={[0, -1.20, -50]} receiveShadow>
        <boxGeometry args={[120, 0.06, 200]} />
        <meshStandardMaterial color={grassColor} roughness={0.98} />
      </mesh>
    </>
  )
}

// ─── Export ────────────────────────────────────────────────────────────────────
export function WorldEnvironment() {
  return (
    <>
      <ScrollingDecorations />
      <ScrollingGroundDetails />
      <AtmosphericParticles />
      <WorldBackdrop />
      <Ground />
    </>
  )
}
