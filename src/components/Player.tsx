// ─── Colorful child-friendly player character ─────────────────────────────────
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useInput } from '../hooks/useInput'
import { useGameStore } from '../store/gameStore'
import { Sounds } from '../utils/sounds'
import { invincState, tickInvincibility } from '../utils/invincibilityState'
import { boostState, tickBoost } from '../utils/boostState'
import { magnetState, tickMagnet } from '../utils/magnetState'

const PLAYER_SPEED   = 7
const JUMP_FORCE     = 10
const GRAVITY        = -22
const PLATFORM_HALF  = 4.3
const SLIDE_DURATION = 0.75

export interface PlayerPosition {
  x: number
  y: number       // feet Y (0 = ground)
  z: number
  sliding: boolean
}

interface PlayerProps {
  posRef: React.MutableRefObject<PlayerPosition>
}

export function Player({ posRef }: PlayerProps) {
  const rootRef      = useRef<THREE.Group>(null!)
  const leftLegRef   = useRef<THREE.Group>(null!)
  const rightLegRef  = useRef<THREE.Group>(null!)
  const leftArmRef   = useRef<THREE.Group>(null!)
  const rightArmRef  = useRef<THREE.Group>(null!)

  const velX      = useRef(0)
  const velY      = useRef(0)
  const onGround  = useRef(true)
  const stepRef   = useRef(0)

  const isSlidingRef = useRef(false)
  const slideTimer   = useRef(0)
  const wasOnGround  = useRef(true)
  const flickerRef        = useRef(0)
  const prevBoostGauge    = useRef(1.0)
  const prevMagnetActive  = useRef(false)

  const keys            = useInput()
  const status          = useGameStore((s) => s.status)
  const setBoostGauge   = useGameStore((s) => s.setBoostGauge)
  const setMagnetState  = useGameStore((s) => s.setMagnetState)

  useEffect(() => {
    if (status === 'playing') {
      posRef.current = { x: 0, y: 0, z: 0, sliding: false }
      velX.current   = 0
      velY.current   = 0
      onGround.current     = true
      isSlidingRef.current = false
    }
  }, [status, posRef])

  useFrame((_, delta) => {
    if (status !== 'playing') return

    tickInvincibility(delta)
    tickBoost(delta, keys.current.boost)
    tickMagnet(delta)

    // Push boost gauge + magnet state to store (throttled by change threshold)
    if (Math.abs(boostState.gauge - prevBoostGauge.current) > 0.015) {
      prevBoostGauge.current = boostState.gauge
      setBoostGauge(boostState.gauge)
    }
    if (magnetState.active !== prevMagnetActive.current) {
      prevMagnetActive.current = magnetState.active
      setMagnetState(magnetState.active, magnetState.timer)
    }

    const pos = posRef.current

    // Flicker during invincibility
    if (rootRef.current) {
      if (invincState.active) {
        flickerRef.current += delta
        rootRef.current.visible = Math.sin(flickerRef.current * 25) > 0
      } else {
        rootRef.current.visible = true
        flickerRef.current = 0
      }
    }

    // Slide
    if (keys.current.slide && onGround.current && !isSlidingRef.current) {
      isSlidingRef.current = true
      slideTimer.current   = SLIDE_DURATION
      Sounds.slide()
    }
    if (isSlidingRef.current) {
      slideTimer.current -= delta
      if (slideTimer.current <= 0) isSlidingRef.current = false
    }
    pos.sliding = isSlidingRef.current

    // Horizontal movement
    const targetVx = keys.current.left ? -PLAYER_SPEED : keys.current.right ? PLAYER_SPEED : 0
    velX.current += (targetVx - velX.current) * Math.min(1, 10 * delta)
    pos.x += velX.current * delta
    pos.x = Math.max(-PLATFORM_HALF, Math.min(PLATFORM_HALF, pos.x))

    // Jump
    if (keys.current.jump && onGround.current && !isSlidingRef.current) {
      velY.current     = JUMP_FORCE
      onGround.current = false
      Sounds.jump()
    }

    // Gravity
    if (!onGround.current) velY.current += GRAVITY * delta
    pos.y += velY.current * delta

    if (pos.y <= 0) {
      if (!wasOnGround.current) Sounds.land()
      pos.y            = 0
      velY.current     = 0
      onGround.current = true
    }
    wasOnGround.current = onGround.current

    // Slide squash
    const tgtSY  = isSlidingRef.current ? 0.50 : 1.0
    const tgtSXZ = isSlidingRef.current ? 1.40 : 1.0
    if (rootRef.current) {
      const s = rootRef.current.scale
      s.y += (tgtSY  - s.y)  * 0.22
      s.x += (tgtSXZ - s.x)  * 0.22
      s.z += (tgtSXZ - s.z)  * 0.22
    }

    // Limb animation
    const moving = Math.abs(velX.current) > 0.3
    if (moving && onGround.current) stepRef.current += delta * 9

    const swing  = moving && onGround.current ? Math.sin(stepRef.current) * 0.65 : 0
    const airLeg = onGround.current ? 0 : -0.35
    const airArm = onGround.current ? 0 :  0.55

    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing + airLeg
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing + airLeg
    if (leftArmRef.current)  leftArmRef.current.rotation.x  = -swing * 0.5 + airArm
    if (rightArmRef.current) rightArmRef.current.rotation.x =  swing * 0.5 + airArm

    const tiltZ = keys.current.left ? 0.07 : keys.current.right ? -0.07 : 0
    if (rootRef.current) {
      rootRef.current.position.set(pos.x, pos.y, pos.z)
      rootRef.current.rotation.z += (tiltZ - rootRef.current.rotation.z) * 0.18
    }
  })

  return (
    <group ref={rootRef}>
      {/* Rotated 180° so character faces down the track (away from camera) */}
      <group rotation={[0, Math.PI, 0]}>
      {/* ── Shoes ──────────────────────────────────────────────────────────── */}
      <group ref={leftLegRef} position={[-0.13, 0.66, 0]}>
        {/* Upper leg (shorts — dark blue) */}
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.24, 6, 10]} />
          <meshStandardMaterial color="#1a3a88" roughness={0.8} />
        </mesh>
        {/* Lower leg (stocking — white) */}
        <mesh position={[0, -0.40, 0]} castShadow>
          <capsuleGeometry args={[0.068, 0.22, 6, 10]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
        </mesh>
        {/* Shoe — red */}
        <mesh position={[0.01, -0.645, 0.042]} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.26]} />
          <meshStandardMaterial color="#cc2200" roughness={0.8} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.13, 0.66, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.24, 6, 10]} />
          <meshStandardMaterial color="#1a3a88" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.40, 0]} castShadow>
          <capsuleGeometry args={[0.068, 0.22, 6, 10]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
        </mesh>
        <mesh position={[0.01, -0.645, 0.042]} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.26]} />
          <meshStandardMaterial color="#cc2200" roughness={0.8} />
        </mesh>
      </group>

      {/* ── Shorts waistband ────────────────────────────────────────────────── */}
      <mesh position={[0, 0.70, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.21, 0.10, 12]} />
        <meshStandardMaterial color="#0d2266" roughness={0.7} />
      </mesh>

      {/* ── Torso (bright red t-shirt) ───────────────────────────────────────── */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.19, 0.50, 12]} />
        <meshStandardMaterial color="#ee2222" roughness={0.8} />
      </mesh>
      {/* Shirt number */}
      <mesh position={[0, 0.96, 0.115]}>
        <boxGeometry args={[0.18, 0.22, 0.03]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* ── Shoulder pads (yellow) ───────────────────────────────────────────── */}
      <mesh position={[-0.28, 1.10, 0]}>
        <sphereGeometry args={[0.10, 10, 10]} />
        <meshStandardMaterial color="#ff9900" roughness={0.7} />
      </mesh>
      <mesh position={[0.28, 1.10, 0]}>
        <sphereGeometry args={[0.10, 10, 10]} />
        <meshStandardMaterial color="#ff9900" roughness={0.7} />
      </mesh>

      {/* ── Arms (blue sleeves, yellow hands) ───────────────────────────────── */}
      <group ref={leftArmRef} position={[-0.28, 1.10, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.24, 6, 10]} />
          <meshStandardMaterial color="#2244cc" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.40, 0]}>
          <sphereGeometry args={[0.062, 8, 8]} />
          <meshStandardMaterial color="#1a2a88" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.54, 0]} castShadow>
          <capsuleGeometry args={[0.056, 0.18, 6, 10]} />
          <meshStandardMaterial color="#ffcc44" roughness={0.7} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.28, 1.10, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.24, 6, 10]} />
          <meshStandardMaterial color="#2244cc" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.40, 0]}>
          <sphereGeometry args={[0.062, 8, 8]} />
          <meshStandardMaterial color="#1a2a88" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.54, 0]} castShadow>
          <capsuleGeometry args={[0.056, 0.18, 6, 10]} />
          <meshStandardMaterial color="#ffcc44" roughness={0.7} />
        </mesh>
      </group>

      {/* ── Neck ───────────────────────────────────────────────────────────── */}
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.075, 0.09, 0.10, 10]} />
        <meshStandardMaterial color="#f4b88a" roughness={0.9} />
      </mesh>

      {/* ── Head (skin tone sphere) ─────────────────────────────────────────── */}
      <mesh position={[0, 1.38, 0]} castShadow>
        <sphereGeometry args={[0.24, 14, 14]} />
        <meshStandardMaterial color="#f4b88a" roughness={0.9} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 1.41, 0.21]}>
        <sphereGeometry args={[0.044, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      <mesh position={[0.08, 1.41, 0.21]}>
        <sphereGeometry args={[0.044, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.08, 1.41, 0.248]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#222222" roughness={0.5} />
      </mesh>
      <mesh position={[0.08, 1.41, 0.248]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#222222" roughness={0.5} />
      </mesh>
      {/* Hair / cap (bright yellow) */}
      <mesh position={[0, 1.56, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.12, 12]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.8} />
      </mesh>
      {/* Cap brim */}
      <mesh position={[0, 1.525, 0.18]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.36, 0.05, 0.20]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.8} />
      </mesh>
      </group>
    </group>
  )
}
