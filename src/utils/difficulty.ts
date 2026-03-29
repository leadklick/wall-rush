import type { Gap } from '../types/game'
import { getBoostMultiplier } from './boostState'

// ─── Level table — gentle curve for all ages ──────────────────────────────────
// Thresholds doubled so each level lasts much longer.
// Speeds lowered further; max is 16 (was 18/26).
const LEVELS = [
  { minScore: 0,    speed: 5,   spawnInterval: 6.5 },  // 1  very relaxed start
  { minScore: 300,  speed: 6.5, spawnInterval: 5.5 },  // 2
  { minScore: 700,  speed: 8,   spawnInterval: 4.6 },  // 3
  { minScore: 1200, speed: 9.5, spawnInterval: 3.8 },  // 4
  { minScore: 1800, speed: 11,  spawnInterval: 3.1 },  // 5
  { minScore: 2600, speed: 12,  spawnInterval: 2.6 },  // 6
  { minScore: 3600, speed: 13,  spawnInterval: 2.2 },  // 7
  { minScore: 5000, speed: 14,  spawnInterval: 1.9 },  // 8
  { minScore: 7000, speed: 15,  spawnInterval: 1.6 },  // 9
  { minScore: 9500, speed: 16,  spawnInterval: 1.35 }, // 10
]

function getLevelData(score: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) return { ...LEVELS[i], level: i + 1 }
  }
  return { ...LEVELS[0], level: 1 }
}

export function getWorldSpeed(score: number):    number { return getLevelData(score).speed }
export function getSpawnInterval(score: number): number { return getLevelData(score).spawnInterval }
export function getLevel(score: number):         number { return getLevelData(score).level }

/** Applies boost multiplier (1.5× when boosting). Use this in all movement useFrames. */
export function getEffectiveSpeed(score: number): number {
  return getWorldSpeed(score) * getBoostMultiplier()
}

// ─── Gap pools (generous sizes for all ages) ──────────────────────────────────
const FLOOR_GAPS: Gap[] = [
  { xMin: -2.0, xMax: 2.0,  yMin: 0, yMax: 3.0 },
  { xMin: -5,   xMax: -1.0, yMin: 0, yMax: 3.0 },
  { xMin: 1.0,  xMax: 5,    yMin: 0, yMax: 3.0 },
  { xMin: -4.5, xMax: 0.5,  yMin: 0, yMax: 3.0 },
  { xMin: -0.5, xMax: 4.5,  yMin: 0, yMax: 3.0 },
]

// Only used from level 3 — requires jumping
const ELEVATED_GAPS: Gap[] = [
  { xMin: -2.0, xMax: 2.0, yMin: 1.0, yMax: 4.0 },
  { xMin: -5,   xMax: -1.0, yMin: 1.0, yMax: 4.0 },
  { xMin: 1.0,  xMax: 5,   yMin: 1.0, yMax: 4.0 },
]

// Only used from level 4 — requires sliding
const SLIDE_GAPS: Gap[] = [
  { xMin: -5,   xMax: 5,   yMin: 0, yMax: 0.75 },
  { xMin: -3.5, xMax: 3.5, yMin: 0, yMax: 0.75 },
  { xMin: -5,   xMax: 0,   yMin: 0, yMax: 0.75 },
  { xMin: 0,    xMax: 5,   yMin: 0, yMax: 0.75 },
]

// Tighter gaps from level 6
const NARROW_GAPS: Gap[] = [
  { xMin: -1.5, xMax: 1.5, yMin: 0, yMax: 2.6 },
  { xMin: -5,   xMax: -1.2, yMin: 0, yMax: 2.6 },
  { xMin: 1.2,  xMax: 5,   yMin: 0, yMax: 2.6 },
]

export function pickGap(score: number): { gap: Gap; requiresSlide: boolean } {
  const level = getLevel(score)

  // Slide gaps only from level 6 onward, low chance
  const slideChance = level >= 6 ? 0.06 + (level - 6) * 0.05 : 0
  if (Math.random() < slideChance) {
    return {
      gap: SLIDE_GAPS[Math.floor(Math.random() * SLIDE_GAPS.length)],
      requiresSlide: true,
    }
  }

  let pool: Gap[]
  if (level <= 4)      pool = FLOOR_GAPS                                          // only easy floor gaps levels 1–4
  else if (level <= 5) pool = [...FLOOR_GAPS, ...FLOOR_GAPS, ...ELEVATED_GAPS]   // mostly floor, occasional jump
  else if (level <= 7) pool = [...FLOOR_GAPS, ...ELEVATED_GAPS]
  else                 pool = [...FLOOR_GAPS, ...ELEVATED_GAPS, ...NARROW_GAPS]

  return { gap: pool[Math.floor(Math.random() * pool.length)], requiresSlide: false }
}

// Break zones removed — keeps gameplay clear and simple
export function generateBreakZones(_gap: Gap, _score: number): Gap[] {
  return []
}

// ─── Obstacle spawn interval ─────────────────────────────────────────────────
export function getObstacleInterval(score: number): number {
  const level = getLevel(score)
  if (level < 2) return Infinity  // no obstacles level 1 only
  return Math.max(2.2, 7.5 - (level - 2) * 0.65)
}
