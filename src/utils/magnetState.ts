// ─── Magnet power-up state ────────────────────────────────────────────────────
export const MAGNET_DURATION = 8.0  // seconds

export const magnetState = { active: false, timer: 0.0 }

export function activateMagnet(): void {
  magnetState.active = true
  magnetState.timer  = MAGNET_DURATION
}

export function tickMagnet(delta: number): void {
  if (magnetState.active) {
    magnetState.timer -= delta
    if (magnetState.timer <= 0) {
      magnetState.active = false
      magnetState.timer  = 0
    }
  }
}
