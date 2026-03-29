export interface Gap {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export interface WallData {
  id:            number
  z:             number
  gaps:          Gap[]
  requiresSlide: boolean
  breakZones:    Gap[]
  brokenZones:   boolean[]
  passed:        boolean
  cardUrl:       string | null   // caeschu.ch card image URL
}

export interface ObstacleData {
  id:   number
  z:    number
  x:    number
  type: 'crate' | 'bar'   // crate = jump over, bar = slide under
}

export type GameStatus = 'start' | 'playing' | 'paused' | 'gameover'
