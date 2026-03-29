// Platform: runs from behind the player (Z=10) to far ahead (Z=-65)
// Center of platform body at Z = (10 + -65) / 2 = -27.5, length = 75

const LEN    = 75
const Z_CTR  = -27.5
const W      = 10
const STRIPE_COUNT = 37  // dashed center line segments

export function Platform() {
  return (
    <group>
      {/* ── Main platform body ──────────────────────────────────────────────── */}
      <mesh position={[0, -0.51, Z_CTR]} receiveShadow castShadow>
        <boxGeometry args={[W, 1, LEN]} />
        <meshStandardMaterial color="#2c3a52" roughness={0.65} metalness={0.45} />
      </mesh>

      {/* ── Top surface (slightly lighter, receiveShadow) ───────────────────── */}
      <mesh position={[0, 0.006, Z_CTR]} receiveShadow>
        <boxGeometry args={[W, 0.012, LEN]} />
        <meshStandardMaterial color="#344260" roughness={0.55} metalness={0.5} />
      </mesh>

      {/* ── Edge rails ──────────────────────────────────────────────────────── */}
      <mesh position={[-4.82, 0.085, Z_CTR]}>
        <boxGeometry args={[0.12, 0.17, LEN]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.7}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[4.82, 0.085, Z_CTR]}>
        <boxGeometry args={[0.12, 0.17, LEN]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.7}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* ── Dashed center line ──────────────────────────────────────────────── */}
      {Array.from({ length: STRIPE_COUNT }, (_, i) => (
        <mesh key={i} position={[0, 0.012, -(i * 2 + 1)]}>
          <boxGeometry args={[0.07, 0.02, 0.9]} />
          <meshStandardMaterial color="#2a4aaa" emissive="#2a4aaa" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* ── Lane dividers at ±2.5 ───────────────────────────────────────────── */}
      {Array.from({ length: STRIPE_COUNT }, (_, i) => (
        <group key={i}>
          <mesh position={[-2.5, 0.012, -(i * 2 + 1)]}>
            <boxGeometry args={[0.05, 0.015, 0.6]} />
            <meshStandardMaterial color="#1a2f5a" emissive="#1a2f5a" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[2.5, 0.012, -(i * 2 + 1)]}>
            <boxGeometry args={[0.05, 0.015, 0.6]} />
            <meshStandardMaterial color="#1a2f5a" emissive="#1a2f5a" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      {/* ── Rail glow lights (every 12 units) ───────────────────────────────── */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i}>
          <pointLight
            position={[-4.82, 0.1, -(i * 12 + 6)]}
            color="#00d4ff"
            intensity={0.6}
            distance={10}
          />
          <pointLight
            position={[4.82, 0.1, -(i * 12 + 6)]}
            color="#00d4ff"
            intensity={0.6}
            distance={10}
          />
        </group>
      ))}
    </group>
  )
}
