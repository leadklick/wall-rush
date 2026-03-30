// ─── Large floor cards between walls ──────────────────────────────────────────
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

// ─── Single floor card ────────────────────────────────────────────────────────
function FloorCard({ url, groupRef }: {
  url: string
  groupRef: (el: THREE.Group | null) => void
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null!)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        if (matRef.current) {
          matRef.current.map   = tex
          matRef.current.color.set('#ffffff')
          matRef.current.needsUpdate = true
        }
      },
    )
  }, [url])

  // Vertical card — stands upright on the road like a billboard
  // Card aspect ratio ~1:1.4 (portrait). Size: 5 wide × 7 tall
  return (
    <group ref={groupRef}>
      {/* Subtle glow behind card */}
      <mesh position={[0, 3.6, 0.04]}>
        <planeGeometry args={[5.6, 7.8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {/* The card — vertical, centered at y=3.5 so bottom is at y=0 */}
      <mesh position={[0, 3.5, 0]}>
        <planeGeometry args={[5.0, 7.0]} />
        <meshBasicMaterial
          ref={matRef}
          color="#ffaa00"
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// ─── Manager ──────────────────────────────────────────────────────────────────
interface CardData { id: number; z: number; urlIndex: number }

const SPAWN_Z   = -46
const DESPAWN_Z =  18
const CARD_INTERVAL = 8.0   // seconds between cards (~every 2 walls)

export function FloorCardManager() {
  const status = useGameStore((s) => s.status)

  const cardsRef    = useRef<CardData[]>([])
  const groupRefs   = useRef(new Map<number, THREE.Group>())
  const [render, setRender] = useState<CardData[]>([])
  const timerRef    = useRef(6.0)
  const nextId      = useRef(0)
  const urlIndex    = useRef(0)

  useEffect(() => {
    if (status === 'playing') {
      cardsRef.current = []
      groupRefs.current.clear()
      timerRef.current = 3.0
      nextId.current   = 0
      urlIndex.current = 0
      setRender([])
    }
  }, [status])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const speed = getEffectiveSpeed(useGameStore.getState().score)
    let changed = false

    for (const c of cardsRef.current) {
      c.z += speed * delta
      groupRefs.current.get(c.id)?.position.setZ(c.z)
    }

    const before = cardsRef.current.length
    cardsRef.current = cardsRef.current.filter((c) => {
      if (c.z > DESPAWN_Z) { groupRefs.current.delete(c.id); return false }
      return true
    })
    if (cardsRef.current.length !== before) changed = true

    timerRef.current -= delta
    if (timerRef.current <= 0) {
      cardsRef.current = [...cardsRef.current, {
        id:       nextId.current++,
        z:        SPAWN_Z,
        urlIndex: urlIndex.current++ % CARD_URLS.length,
      }]
      timerRef.current = CARD_INTERVAL
      changed = true
    }

    if (changed) setRender([...cardsRef.current])
  })

  return (
    <>
      {render.map((card) => (
        <FloorCard
          key={card.id}
          url={CARD_URLS[card.urlIndex]}
          groupRef={(el) => { el ? groupRefs.current.set(card.id, el) : groupRefs.current.delete(card.id) }}
        />
      ))}
    </>
  )
}
