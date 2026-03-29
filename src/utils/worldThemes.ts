// ─── 4 Child-friendly World Themes ───────────────────────────────────────────
export interface WorldTheme {
  id:               number
  name:             string
  nameLong:         string
  fogColor:         string
  fogNear:          number
  fogFar:           number
  bgColor:          string
  skyTurbidity:     number
  skyRayleigh:      number
  sunPosition:      [number, number, number]
  ambientSky:       string
  ambientGround:    string
  ambientIntensity: number
  dirColor:         string
  platformColor:    string
  railColor:        string
  railEmissive:     string
  crackColor:       string
  wallColor:        string
  wallEmissive:     string
  accentColor:      string
  accentEmissive:   string
  speedLineColor:   string
  obstacleColor:    string
  obstacleEmissive: string
}

export const WORLDS: WorldTheme[] = [
  // ── Welt 1: Bunte Stadt ──────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Bunte Stadt',
    nameLong: 'WELT 1 – BUNTE STADT',
    fogColor: '#c0dcff', fogNear: 55, fogFar: 145,
    bgColor: '#7ec8e3',
    skyTurbidity: 3, skyRayleigh: 0.9, sunPosition: [0.5, 0.4, -1],
    ambientSky: '#d0eeff', ambientGround: '#88cc44', ambientIntensity: 3.2,
    dirColor: '#fff8e0',
    platformColor: '#888888',
    railColor: '#ff7722', railEmissive: '#ff4400',
    crackColor: '#ffee00',
    wallColor: '#e84422', wallEmissive: '#aa1a00',
    accentColor: '#ff9900', accentEmissive: '#ff5500',
    speedLineColor: '#ffcc44',
    obstacleColor: '#ff8833', obstacleEmissive: '#cc4400',
  },
  // ── Welt 2: Zauberwald ───────────────────────────────────────────────────────
  {
    id: 2,
    name: 'Zauberwald',
    nameLong: 'WELT 2 – ZAUBERWALD',
    fogColor: '#aaeebb', fogNear: 45, fogFar: 118,
    bgColor: '#5aaa5a',
    skyTurbidity: 5, skyRayleigh: 1.3, sunPosition: [0.3, 0.5, -1],
    ambientSky: '#99dd88', ambientGround: '#2a7a2a', ambientIntensity: 2.8,
    dirColor: '#ffee88',
    platformColor: '#8b6340',
    railColor: '#44cc44', railEmissive: '#228822',
    crackColor: '#aaff44',
    wallColor: '#8B4513', wallEmissive: '#5a2800',
    accentColor: '#55ee22', accentEmissive: '#33aa00',
    speedLineColor: '#88ee55',
    obstacleColor: '#7a5c2a', obstacleEmissive: '#4a3010',
  },
  // ── Welt 3: Eiswelt ──────────────────────────────────────────────────────────
  {
    id: 3,
    name: 'Eiswelt',
    nameLong: 'WELT 3 – EISWELT',
    fogColor: '#d8f0ff', fogNear: 42, fogFar: 110,
    bgColor: '#a8d8f0',
    skyTurbidity: 2, skyRayleigh: 0.4, sunPosition: [0.6, 0.45, -1],
    ambientSky: '#d8f4ff', ambientGround: '#a0c8e8', ambientIntensity: 3.4,
    dirColor: '#eef8ff',
    platformColor: '#aaccee',
    railColor: '#44ccff', railEmissive: '#0099dd',
    crackColor: '#88ddff',
    wallColor: '#4499cc', wallEmissive: '#1a5588',
    accentColor: '#44ddff', accentEmissive: '#0099cc',
    speedLineColor: '#88eeff',
    obstacleColor: '#5588bb', obstacleEmissive: '#224466',
  },
  // ── Welt 4: Vulkaninsel ──────────────────────────────────────────────────────
  {
    id: 4,
    name: 'Vulkaninsel',
    nameLong: 'WELT 4 – VULKANINSEL',
    fogColor: '#ffcc88', fogNear: 28, fogFar: 90,
    bgColor: '#ff9040',
    skyTurbidity: 12, skyRayleigh: 1.8, sunPosition: [0.8, 0.1, -1],
    ambientSky: '#ff9955', ambientGround: '#550800', ambientIntensity: 2.4,
    dirColor: '#ffcc44',
    platformColor: '#3a2200',
    railColor: '#ff4400', railEmissive: '#cc1800',
    crackColor: '#ff8800',
    wallColor: '#8a2400', wallEmissive: '#440800',
    accentColor: '#ff7700', accentEmissive: '#cc3300',
    speedLineColor: '#ff9944',
    obstacleColor: '#662800', obstacleEmissive: '#331400',
  },
]

export function getWorld(level: number): number {
  if (level <= 3) return 1
  if (level <= 6) return 2
  if (level <= 9) return 3
  return 4
}

export function getWorldTheme(level: number): WorldTheme {
  return WORLDS[getWorld(level) - 1]
}
