// Global mutable — read every frame by camera, written by game events
export const shakeState = { intensity: 0 }

export function triggerShake(intensity: number) {
  shakeState.intensity = Math.max(shakeState.intensity, intensity)
}
