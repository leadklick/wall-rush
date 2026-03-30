// ─── Street poster billboards on the road sides ───────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { getEffectiveSpeed } from '../utils/difficulty'

const CARD_URLS = [
  '/walls/card-01.png',
  '/walls/card-02.png',
  '/walls/card-10.png',
  '/walls/card-35.png',
  '/walls/card-50.png',
  '/walls/card-55.png',
  '/walls/card-62.png',
]

// ─── Single poster on a pole ──────────────────────────────────────────────────
function StreetPoster({ url, side, groupRef }: {
  url:      string
  side:     -1 | 1   // -1 = left, +1 = right
  groupRef: (el: THREE.Group | null) => void
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null!)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      if (matRef.current) {
        matRef.current.map = tex
        matRef.current.color.set('#ffffff')
        matRef.current.needsUpdate = true
      }
    })
  }, [url])

  const poleX = side * 7.8   // just off the sidewalk
  const boardW = 2.4
  const boardH = 3.4

  return (
    <group ref={groupRef}>
      {/* Pole */}
      <mesh position={[poleX, 1.8, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 3.6, 8]} />
        <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Wooden board backing */}
      <mesh position={[poleX, 3.8, 0]}>
        <boxGeometry args={[boardW + 0.14, boardH + 0.14, 0.10]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.9} />
      </mesh>
      {/* Poster face (toward player — faces +Z) */}
      <mesh position={[poleX, 3.8, 0.06]}>
        <planeGeometry args={[boardW, boardH]} />
        <meshBasicMaterial
          ref={matRef}
          color="#ddaa44"
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// ─── Manager ──────────────────────────────────────────────────────────────────
interface PosterData { id: number; z: number; urlIndex: number; side: -1 | 1 }

const SPAWN_Z        = -46
const DESPAWN_Z      =  20
const POSTER_INTERVAL = 9.0   // seconds — roughly every 2 walls

export function FloorCardManager() {
  const status = useGameStore((s) => s.status)

  const postersRef  = useRef<PosterData[]>([])
  const groupRefs   = useRef(new Map<number, THREE.Group>())
  const [render, setRender] = useState<PosterData[]>([])
  const timerRef    = useRef(5.0)
  const nextId      = useRef(0)
  const urlIndex    = useRef(0)
  const sideIndex   = useRef(0)

  useEffect(() => {
    if (status === 'playing') {
      postersRef.current = []
      groupRefs.current.clear()
      timerRef.current  = 5.0
      nextId.current    = 0
      urlIndex.current  = 0
      sideIndex.current = 0
      setRender([])
    }
  }, [status])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const speed = getEffectiveSpeed(useGameStore.getState().score)
    let changed = false

    for (const p of postersRef.current) {
      p.z += speed * delta
      groupRefs.current.get(p.id)?.position.setZ(p.z)
    }

    const before = postersRef.current.length
    postersRef.current = postersRef.current.filter((p) => {
      if (p.z > DESPAWN_Z) { groupRefs.current.delete(p.id); return false }
      return true
    })
    if (postersRef.current.length !== before) changed = true

    timerRef.current -= delta
    if (timerRef.current <= 0) {
      const side = sideIndex.current % 2 === 0 ? -1 : 1 as -1 | 1
      postersRef.current = [...postersRef.current, {
        id:       nextId.current++,
        z:        SPAWN_Z,
        urlIndex: urlIndex.current++ % CARD_URLS.length,
        side,
      }]
      sideIndex.current++
      timerRef.current = POSTER_INTERVAL
      changed = true
    }

    if (changed) setRender([...postersRef.current])
  })

  return (
    <>
      {render.map((p) => (
        <StreetPoster
          key={p.id}
          url={CARD_URLS[p.urlIndex]}
          side={p.side}
          groupRef={(el) => { el ? groupRefs.current.set(p.id, el) : groupRefs.current.delete(p.id) }}
        />
      ))}
    </>
  )
}
