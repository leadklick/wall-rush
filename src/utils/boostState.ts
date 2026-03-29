// ─── Shared boost state (read by difficulty.ts, written by Player.tsx) ─────────
export const boostState = { active: false, gauge: 1.0 }

/** Called every frame from Player.tsx */
export function tickBoost(delta: number, boosting: boolean): void {
  if (boosting && boostState.gauge > 0) {
    boostState.active = true
    boostState.gauge  = Math.max(0, boostState.gauge - delta * 0.18)  // ~5.5 s full→empty
  } else {
    boostState.active = false
    boostState.gauge  = Math.min(1.0, boostState.gauge + delta * 0.11) // ~9 s empty→full
  }
}

export function getBoostMultiplier(): number {
  return boostState.active && boostState.gauge > 0 ? 3.0 : 1.0
}
