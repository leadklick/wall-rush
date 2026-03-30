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

  return (
    <group ref={groupRef}>
      {/* Card image — full road width, Y=0.08 safely above platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} renderOrder={2}>
        <planeGeometry args={[9.0, 7.0]} />
        <meshBasicMaterial
          ref={matRef}
          color="#ffaa00"
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </group>
  )
}

// ─── Manager ──────────────────────────────────────────────────────────────────
interface CardData { id: number; z: number; urlIndex: number }

const SPAWN_Z   = -46
const DESPAWN_Z =  18
const SPACING   =  20

export function FloorCardManager() {
  const status = useGameStore((s) => s.status)

  const cardsRef    = useRef<CardData[]>([])
  const groupRefs   = useRef(new Map<number, THREE.Group>())
  const [render, setRender] = useState<CardData[]>([])
  const timerRef    = useRef(3.0)
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
          groupRef={(el) => { el ? groupRefs.current.set(card.id, el) : groupRefs.current.delete(card.id) }}
        />
      ))}
    </>
  )
}
