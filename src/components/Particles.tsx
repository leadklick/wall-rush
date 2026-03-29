import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { particleEmitter } from '../utils/particleEmitter'

const MAX_PARTICLES = 200

interface Particle {
  pos: THREE.Vector3
  vel: THREE.Vector3
  life: number
  maxLife: number
}

export function Particles() {
  const meshRef   = useRef<THREE.InstancedMesh>(null!)
  const particles = useRef<Particle[]>([])
  const dummy     = useRef(new THREE.Object3D())

  useEffect(() => {
    particleEmitter.register((origin, _color) => {
      for (let i = 0; i < 24; i++) {
        particles.current.push({
          pos: origin.clone().add(
            new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0),
          ),
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 5 + 1,
            (Math.random() - 0.5) * 5,
          ),
          life:    0.5 + Math.random() * 0.5,
          maxLife: 0.5 + Math.random() * 0.5,
        })
      }
    })
    return () => particleEmitter.unregister()
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    // Update
    particles.current = particles.current.filter((p) => {
      p.life -= delta
      p.vel.y -= 14 * delta   // gravity
      p.pos.addScaledVector(p.vel, delta)
      return p.life > 0
    })

    // Render up to MAX_PARTICLES
    const count = Math.min(particles.current.length, MAX_PARTICLES)
    for (let i = 0; i < count; i++) {
      const p = particles.current[i]
      dummy.current.position.copy(p.pos)
      dummy.current.scale.setScalar(0.12 * (p.life / p.maxLife))
      dummy.current.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.current.matrix)
    }
    // Hide unused slots
    dummy.current.scale.setScalar(0)
    dummy.current.updateMatrix()
    for (let i = count; i < MAX_PARTICLES; i++) {
      meshRef.current.setMatrixAt(i, dummy.current.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff8c00" emissive="#ff4400" emissiveIntensity={1.5} />
    </instancedMesh>
  )
}
