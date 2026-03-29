// ─── Global mutable invincibility state ──────────────────────────────────────
// Written by WallManager / gameStore, read by Player for flicker effect

export const invincState = {
  active:    false,
  remaining: 0,     // seconds left
}

export const INVINC_DURATION = 2.5

export function activateInvincibility() {
  invincState.active    = true
  invincState.remaining = INVINC_DURATION
}

export function tickInvincibility(delta: number): void {
  if (!invincState.active) return
  invincState.remaining -= delta
  if (invincState.remaining <= 0) {
    invincState.active    = false
    invincState.remaining = 0
  }
}
