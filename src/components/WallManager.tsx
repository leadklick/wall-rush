// ─── Wall manager with world-themed colors ────────────────────────────────────
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Gap, WallData } from '../types/game'
import { useGameStore } from '../store/gameStore'
import type { PlayerPosition } from './Player'
import { getEffectiveSpeed, getSpawnInterval, pickGap, generateBreakZones } from '../utils/difficulty'
import { triggerShake } from '../utils/shakeState'
import { particleEmitter } from '../utils/particleEmitter'
import { Sounds } from '../utils/sounds'
import { invincState } from '../utils/invincibilityState'
import { WORLDS } from '../utils/worldThemes'

// ─── Wall geometry constants ──────────────────────────────────────────────────
const WALL_HEIGHT    = 5
const PLATFORM_HALF  = 5
const WALL_THICKNESS = 0.45

// ─── Card images from /public/walls ──────────────────────────────────────────
const CARD_URLS = [
  '/walls/card-01.png',
  '/walls/card-02.png',
  '/walls/card-10.png',
  '/walls/card-35.png',
  '/walls/card-50.png',
  '/walls/card-55.png',
  '/walls/card-62.png',
]

function pickCardUrl(): string | null {
  return null  // cards are now shown on the floor
}

function WallCard({ url, gap }: { url: string; gap: Gap }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    loader.load(
      url,
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; setTexture(tex) },
      undefined,
      () => { /* ignore */ },
    )
  }, [url])

  if (!texture) return null

  const cx    = (gap.xMin + gap.xMax) / 2
  const cardX = cx > 0 ? -3.0 : 3.0
  return (
    <mesh position={[cardX, 2.5, 0.28]}>
      <planeGeometry args={[1.4, 1.9]} />
      <meshStandardMaterial map={texture} transparent alphaTest={0.05} />
    </mesh>
  )
}

// ─── Brick mortar strips for a wall segment ───────────────────────────────────
function BrickStrips({ w, h, d }: { w: number; h: number; d: number }) {
  const count = Math.min(6, Math.max(2, Math.floor(h / 0.32)))
  return (
    <>
      {Array.from({ length: count - 1 }, (_, i) => {
        const y = ((i + 1) / count) * h - h / 2
        return (
          <mesh key={i} position={[0, y, d / 2 + 0.012]}>
            <boxGeometry args={[w + 0.01, 0.055, 0.04]} />
            <meshStandardMaterial color="#d4c0a8" roughness={0.95} />
          </mesh>
        )
      })}
    </>
  )
}

// ─── Wall mesh ────────────────────────────────────────────────────────────────
interface WallMeshProps {
  gaps:          Gap[]
  requiresSlide: boolean
  cardUrl:       string | null
  wallColor:     string
  wallEmissive:  string
  accentColor:   string
  brickStyle:    boolean
}

export const WallMesh = forwardRef<THREE.Group, WallMeshProps>(
  ({ gaps, requiresSlide, cardUrl, wallColor, wallEmissive, accentColor, brickStyle }, ref) => {
    const gap = gaps[0]

    const segs: Array<{ pos: [number, number, number]; size: [number, number, number] }> = []

    const leftW = gap.xMin + PLATFORM_HALF
    if (leftW > 0.01) segs.push({
      pos:  [(-PLATFORM_HALF + gap.xMin) / 2, WALL_HEIGHT / 2, 0],
      size: [leftW, WALL_HEIGHT, WALL_THICKNESS],
    })

    const rightW = PLATFORM_HALF - gap.xMax
    if (rightW > 0.01) segs.push({
      pos:  [(gap.xMax + PLATFORM_HALF) / 2, WALL_HEIGHT / 2, 0],
      size: [rightW, WALL_HEIGHT, WALL_THICKNESS],
    })

    const topH = WALL_HEIGHT - gap.yMax
    if (topH > 0.01) segs.push({
      pos:  [(gap.xMin + gap.xMax) / 2, (gap.yMax + WALL_HEIGHT) / 2, 0],
      size: [gap.xMax - gap.xMin, topH, WALL_THICKNESS],
    })

    if (gap.yMin > 0.01) segs.push({
      pos:  [(gap.xMin + gap.xMax) / 2, gap.yMin / 2, 0],
      size: [gap.xMax - gap.xMin, gap.yMin, WALL_THICKNESS],
    })

    const gapCx = (gap.xMin + gap.xMax) / 2
    const gapCy = (gap.yMin + gap.yMax) / 2
    const gapW  = gap.xMax - gap.xMin
    const gapH  = gap.yMax - gap.yMin

    return (
      <group ref={ref}>
        {/* Wall segments */}
        {segs.map((s, i) => (
          <group key={i} position={s.pos}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={s.size} />
              <meshStandardMaterial
                color={brickStyle ? '#b84030' : wallColor}
                emissive={brickStyle ? '#5a1a08' : wallEmissive}
                emissiveIntensity={0.2}
                metalness={brickStyle ? 0.0 : 0.25}
                roughness={brickStyle ? 0.95 : 0.72}
              />
            </mesh>
            {brickStyle && <BrickStrips w={s.size[0]} h={s.size[1]} d={s.size[2]} />}
          </group>
        ))}

        {/* Gap opening — bright tinted highlight */}
        <mesh position={[gapCx, gapCy, 0]}>
          <boxGeometry args={[gapW, gapH, 0.06]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.55}
            transparent
            opacity={0.28}
          />
        </mesh>

        {/* Gap border strips (top and bottom) for visual clarity */}
        <mesh position={[gapCx, gap.yMin + 0.04, 0.04]}>
          <boxGeometry args={[gapW, 0.08, 0.04]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[gapCx, gap.yMax - 0.04, 0.04]}>
          <boxGeometry args={[gapW, 0.08, 0.04]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.5} />
        </mesh>

        {/* Slide indicator — bright ground strip */}
        {requiresSlide && (
          <mesh position={[gapCx, 0.28, 0.28]}>
            <boxGeometry args={[gapW * 0.75, 0.10, 0.05]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffff00" emissiveIntensity={4.0} />
          </mesh>
        )}

        {/* caeschu.ch card */}
        {cardUrl && <WallCard url={cardUrl} gap={gap} />}
      </group>
    )
  },
)
WallMesh.displayName = 'WallMesh'

// ─── Collision ────────────────────────────────────────────────────────────────
const SPAWN_Z        = -44
const DESPAWN_Z      =  16
const PLAYER_Z       =   0
const COLLISION_HALF = WALL_THICKNESS / 2 + 0.42

function playerFitsGap(px: number, py: number, sliding: boolean, gap: Gap): boolean {
  const playerH = sliding ? 0.72 : 1.5   // matches visual character height
  const tol     = 0.12                    // 12 cm tolerance for fairness
  return (
    px - 0.4 >= gap.xMin - tol &&
    px + 0.4 <= gap.xMax + tol &&
    py       >= gap.yMin - tol &&
    py + playerH <= gap.yMax + tol
  )
}

interface WallManagerProps {
  posRef: React.MutableRefObject<PlayerPosition>
}

export function WallManager({ posRef }: WallManagerProps) {
  const status      = useGameStore((s) => s.status)
  const world       = useGameStore((s) => s.world)
  const loseLife    = useGameStore((s) => s.loseLife)
  const addScore    = useGameStore((s) => s.addScore)
  const addWallPass = useGameStore((s) => s.addWallPass)

  const theme = WORLDS[Math.max(0, world - 1)]

  const wallsRef    = useRef<WallData[]>([])
  const groupRefs   = useRef<Map<number, THREE.Group>>(new Map())
  const [renderWalls, setRenderWalls] = useState<WallData[]>([])

  const spawnTimerRef = useRef(2.5)
  const scoreTimerRef = useRef(0)
  const nextIdRef     = useRef(0)

  useEffect(() => {
    if (status === 'playing') {
      wallsRef.current = []
      groupRefs.current.clear()
      spawnTimerRef.current = 2.5
      scoreTimerRef.current = 0
      nextIdRef.current     = 0
      setRenderWalls([])
    }
  }, [status])

  const spawnWall = useCallback((score: number) => {
    const { gap, requiresSlide } = pickGap(score)
    const wall: WallData = {
      id:            nextIdRef.current++,
      z:             SPAWN_Z,
      gaps:          [gap],
      requiresSlide,
      breakZones:    generateBreakZones(gap, score),  // always []
      brokenZones:   [],
      passed:        false,
      cardUrl:       pickCardUrl(),
    }
    wallsRef.current = [...wallsRef.current, wall]
    setRenderWalls([...wallsRef.current])
  }, [])

  useFrame((_, delta) => {
    if (status !== 'playing') return

    const score            = useGameStore.getState().score
    const speed            = getEffectiveSpeed(score)
    const { triggerFlash } = useGameStore.getState()

    let structuralChange = false

    for (const wall of wallsRef.current) {
      wall.z += speed * delta
      groupRefs.current.get(wall.id)?.position.set(0, 0, wall.z)

      if (wall.z > PLAYER_Z - COLLISION_HALF && wall.z < PLAYER_Z + COLLISION_HALF) {
        if (invincState.active) continue

        const px      = posRef.current.x
        const py      = posRef.current.y
        const sliding = posRef.current.sliding

        let inGap = false
        for (const gap of wall.gaps) {
          if (playerFitsGap(px, py, sliding, gap)) { inGap = true; break }
        }

        if (!inGap) {
          triggerShake(0.65)
          triggerFlash('red')
          Sounds.hit()
          particleEmitter.emit(new THREE.Vector3(px, py + 0.75, wall.z), '#ff8800')
          loseLife()
          return
        }
      }

      if (!wall.passed && wall.z > PLAYER_Z + 2) {
        wall.passed = true
        addScore(50)
        addWallPass()
        Sounds.wallPass()
      }
    }

    // Despawn
    const before = wallsRef.current.length
    wallsRef.current = wallsRef.current.filter((w) => {
      if (w.z > DESPAWN_Z) { groupRefs.current.delete(w.id); return false }
      return true
    })
    if (wallsRef.current.length !== before) structuralChange = true

    // Spawn timer
    spawnTimerRef.current -= delta
    if (spawnTimerRef.current <= 0) {
      spawnWall(score)
      spawnTimerRef.current = getSpawnInterval(score)
      structuralChange = true
    }

    // Time score
    scoreTimerRef.current += delta
    if (scoreTimerRef.current >= 1) {
      addScore(10)
      scoreTimerRef.current -= 1
    }

    if (structuralChange) setRenderWalls([...wallsRef.current])
  })

  return (
    <>
      {renderWalls.map((wall) => (
        <WallMesh
          key={wall.id}
          gaps={wall.gaps}
          requiresSlide={wall.requiresSlide}
          cardUrl={wall.cardUrl}
          wallColor={theme.wallColor}
          wallEmissive={theme.wallEmissive}
          accentColor={theme.accentColor}
          brickStyle={world === 1}
          ref={(el: THREE.Group | null) => {
            el ? groupRefs.current.set(wall.id, el) : groupRefs.current.delete(wall.id)
          }}
        />
      ))}
    </>
  )
}
