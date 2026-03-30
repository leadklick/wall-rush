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

// Pre-load all textures once
const textureCache = new Map<string, THREE.Texture>()
function getTexture(url: string): THREE.Texture | null {
  if (textureCache.has(url)) return textureCache.get(url)!
  const loader = new THREE.TextureLoader()
  loader.load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    textureCache.set(url, tex)
  })
  return null
}

// ─── Single floor card mesh ────────────────────────────────────────────────────
function FloorCard({ url, groupRef }: { url: string; groupRef: React.RefCallback<THREE.Group> }) {
  const texture = getTexture(url)
  return (
    <group ref={groupRef}>
      {/* Slight glow halo under the card */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.990, 0]}>
        <planeGeometry args={[9.6, 7.6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
      </mesh>
      {/* The card image */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.985, 0]}>
        <planeGeometry args={[9.0, 7.0]} />
        {texture
          ? <meshStandardMaterial map={texture} transparent alphaTest={0.04} roughness={0.6} metalness={0.1} />
          : <meshStandardMaterial color="#333333" transparent opacity={0.3} />
        }
      </mesh>
      {/* Thin border frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.983, 0]}>
        <planeGeometry args={[9.1, 7.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} wireframe />
      </mesh>
    </group>
  )
}

// ─── Manager ───────────────────────────────────────────────────────────────────
interface CardData { id: number; z: number; urlIndex: number }

const SPAWN_Z   = -48
const DESPAWN_Z =  18
const PLAYER_Z  =   0
const SPACING   =  22   // roughly one wall-gap apart

export function FloorCardManager() {
  const status = useGameStore((s) => s.status)

  const cardsRef   = useRef<CardData[]>([])
  const groupRefs  = useRef(new Map<number, THREE.Group>())
  const [render, setRender] = useState<CardData[]>([])

  const timerRef   = useRef(4.0)   // first card appears after 4s
  const nextId     = useRef(0)
  const urlIndexRef = useRef(0)

  // Pre-load all textures at startup
  useEffect(() => {
    CARD_URLS.forEach(getTexture)
  }, [])

  useEffect(() => {
    if (status === 'playing') {
      cardsRef.current  = []
      groupRefs.current.clear()
      timerRef.current  = 4.0
      nextId.current    = 0
      urlIndexRef.current = 0
      setRender([])
    }
  }, [status])

  useFrame((_, delta) => {
    if (status !== 'playing') return
    const score = useGameStore.getState().score
    const speed = getEffectiveSpeed(score)
    let changed = false

    // Move cards
    for (const card of cardsRef.current) {
      card.z += speed * delta
      groupRefs.current.get(card.id)?.position.set(0, 0, card.z)
    }

    // Despawn
    const before = cardsRef.current.length
    cardsRef.current = cardsRef.current.filter((c) => {
      if (c.z > DESPAWN_Z) { groupRefs.current.delete(c.id); return false }
      return true
    })
    if (cardsRef.current.length !== before) changed = true

    // Spawn timer
    timerRef.current -= delta
    if (timerRef.current <= 0) {
      const card: CardData = {
        id:       nextId.current++,
        z:        SPAWN_Z,
        urlIndex: urlIndexRef.current % CARD_URLS.length,
      }
      urlIndexRef.current++
      cardsRef.current = [...cardsRef.current, card]
      timerRef.current = SPACING / Math.max(speed, 4)
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
          groupRef={(el: THREE.Group | null) => {
            el ? groupRefs.current.set(card.id, el) : groupRefs.current.delete(card.id)
          }}
        />
      ))}
    </>
  )
}
