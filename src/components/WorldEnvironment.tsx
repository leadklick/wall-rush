// ─── Child-friendly world environment ────────────────────────────────────────
import { forwardRef, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { getEffectiveSpeed } from '../utils/difficulty'
import { WORLDS } from '../utils/worldThemes'

// ─── Scrolling track-side decorations ────────────────────────────────────────
const DECO_SPACING = 12
const N_DECOS      = 9
const DECO_TOTAL   = DECO_SPACING * N_DECOS

// World 1: City lamp post
function CityPost({ x }: { x: number }) {
  const dir = x < 0 ? 1 : -1
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 5.2, 8]} />
        <meshStandardMaterial color="#777777" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[dir * 0.28, 4.9, 0]} rotation={[0, 0, dir * 0.35]}>
        <cylinderGeometry args={[0.04, 0.04, 0.66, 8]} />
        <meshStandardMaterial color="#777777" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[dir * 0.52, 4.80, 0]}>
        <sphereGeometry args={[0.17, 8, 8]} />
        <meshStandardMaterial color="#ffffbb" emissive="#ffee66" emissiveIntensity={2.5} />
      </mesh>
    </group>
  )
}

// World 2: Forest tree
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
    </group>
  )
}

// World 3: Ice crystal
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
    </group>
  )
}

// World 4: Volcano fire torch
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
    if (status === 'playing') {
      decoData.current.forEach((d, i) => { d.z = -(i * DECO_SPACING + 4) })
    }
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
        <DecoPair
          key={id}
          world={world}
          ref={(el: THREE.Group | null) => { el ? groupRefs.current.set(id, el) : groupRefs.current.delete(id) }}
        />
      ))}
    </>
  )
}

// ─── City backdrop ────────────────────────────────────────────────────────────
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
      <mesh position={[0, h * 0.56, d / 2 + 0.03]}>
        <boxGeometry args={[w * 0.40, h * 0.28, 0.06]} />
        <meshStandardMaterial color="#fffcc8" emissive="#ffe888" emissiveIntensity={0.8} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, h * 0.20, d / 2 + 0.03]}>
        <boxGeometry args={[w * 0.22, h * 0.42, 0.06]} />
        <meshStandardMaterial color={roofColor} roughness={0.9} />
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

function Mushroom({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
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
    { x: -8.2, z: -28 }, { x: -8.8, z: -46 }, { x: -8.0, z: -62 }, { x: -8.6, z: -78 },
  ]
  return (
    <>
      {lTrees.map((t, i) => <BigTree key={`lt${i}`} {...t} c3={t.c3 ?? undefined} />)}
      {lTrees.map((t, i) => <BigTree key={`rt${i}`} {...t} x={-t.x} c3={t.c3 ?? undefined} />)}
      {lMush.map((m, i) => <Mushroom key={`lm${i}`} {...m} />)}
      {lMush.map((m, i) => <Mushroom key={`rm${i}`} x={-m.x} z={m.z} />)}
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
      {/* Background volcano */}
      <mesh position={[0, 0, -105]}>
        <cylinderGeometry args={[0, 18, 36, 12]} />
        <meshStandardMaterial color="#3a1800" roughness={0.95} />
      </mesh>
      <mesh position={[0, 36, -105]}>
        <sphereGeometry args={[2.8, 10, 10]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={4.0} />
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

// ─── Ground ───────────────────────────────────────────────────────────────────
function Ground() {
  const world = useGameStore((s) => s.world)
  const theme = WORLDS[Math.max(0, world - 1)]

  const sideColor =
    world === 1 ? '#9a9a9a' :
    world === 2 ? '#5a8a30' :
    world === 3 ? '#d8f0ff' :
                  '#1a1000'

  return (
    <>
      {/* Main track */}
      <mesh position={[0, -1.06, -50]} receiveShadow>
        <boxGeometry args={[10, 0.1, 200]} />
        <meshStandardMaterial color={theme.platformColor} roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Left side ground */}
      <mesh position={[-15, -1.10, -50]} receiveShadow>
        <boxGeometry args={[20, 0.08, 200]} />
        <meshStandardMaterial color={sideColor} roughness={0.95} />
      </mesh>
      {/* Right side ground */}
      <mesh position={[15, -1.10, -50]} receiveShadow>
        <boxGeometry args={[20, 0.08, 200]} />
        <meshStandardMaterial color={sideColor} roughness={0.95} />
      </mesh>
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function WorldEnvironment() {
  return (
    <>
      <ScrollingDecorations />
      <WorldBackdrop />
      <Ground />
    </>
  )
}
