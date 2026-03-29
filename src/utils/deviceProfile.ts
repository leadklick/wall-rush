// ─── Device capability detection ─────────────────────────────────────────────
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

export const isMobile: boolean =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|Mobi/i.test(ua))

// Limit canvas pixel ratio and other heavy features on mobile
export const maxDpr       = isMobile ? 1.5  : 2.0
export const shadowsOn    = !isMobile
export const starCount    = isMobile ? 150  : 400
export const lineCount    = isMobile ? 40   : 90
export const spectatorRows = isMobile ? 1   : 3   // rows per side
