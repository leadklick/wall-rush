import * as THREE from 'three'

type BurstCallback = (pos: THREE.Vector3, color: string) => void
let _cb: BurstCallback | null = null

export const particleEmitter = {
  register: (cb: BurstCallback) => { _cb = cb },
  unregister: () => { _cb = null },
  emit: (pos: THREE.Vector3, color = '#ff8c00') => { _cb?.(pos, color) },
}
