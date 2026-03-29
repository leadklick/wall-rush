import { create } from 'zustand'
import type { GameStatus } from '../types/game'
import { activateInvincibility } from '../utils/invincibilityState'
import { saveScore } from '../utils/highscores'

const COMBO_STEP = 3
const MAX_MULTI  = 5

interface GameStore {
  status:           GameStatus
  score:            number
  highScore:        number
  flashColor:       string
  lives:            number
  comboCount:       number
  comboMultiplier:  number
  world:            number
  coinsCollected:   number
  boostGauge:       number   // 0–1, updated from Player.tsx every ~50ms
  magnetActive:     boolean  // true while magnet power-up is running
  magnetTimer:      number   // seconds remaining

  startGame:       () => void
  endGame:         () => void
  restartGame:     () => void
  pauseGame:       () => void
  resumeGame:      () => void
  addScore:        (pts: number) => void
  addCoin:         () => void
  triggerFlash:    (color: string) => void
  loseLife:        () => void
  addWallPass:     () => void
  resetCombo:      () => void
  setWorld:        (w: number) => void
  setBoostGauge:   (g: number) => void
  setMagnetState:  (active: boolean, timer: number) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  status:          'start',
  score:           0,
  highScore:       0,
  flashColor:      '',
  lives:           5,
  comboCount:      0,
  comboMultiplier: 1,
  world:           1,
  coinsCollected:  0,
  boostGauge:      1.0,
  magnetActive:    false,
  magnetTimer:     0,

  startGame: () => set({
    status: 'playing', score: 0, flashColor: '',
    lives: 5, comboCount: 0, comboMultiplier: 1, world: 1, coinsCollected: 0,
  }),

  endGame: () => {
    const { score, highScore } = get()
    saveScore(score)
    set({ status: 'gameover', highScore: Math.max(score, highScore) })
  },

  restartGame: () => set({
    status: 'playing', score: 0, flashColor: '',
    lives: 5, comboCount: 0, comboMultiplier: 1, world: 1, coinsCollected: 0,
  }),

  pauseGame:  () => set({ status: 'paused' }),
  resumeGame: () => set({ status: 'playing' }),

  addScore: (pts) => set((s) => ({ score: s.score + pts * s.comboMultiplier })),

  addCoin: () => set((s) => ({
    score:          s.score + 15 * s.comboMultiplier,
    coinsCollected: s.coinsCollected + 1,
  })),

  triggerFlash: (color) => {
    set({ flashColor: color })
    setTimeout(() => set({ flashColor: '' }), 450)
  },

  loseLife: () => {
    const { lives, resetCombo } = get()
    resetCombo()
    if (lives <= 1) {
      get().endGame()
    } else {
      activateInvincibility()
      set({ lives: lives - 1 })
    }
  },

  addWallPass: () => {
    const { comboCount } = get()
    const next  = comboCount + 1
    const multi = Math.min(Math.floor(next / COMBO_STEP) + 1, MAX_MULTI)
    set({ comboCount: next, comboMultiplier: multi })
  },

  resetCombo: () => set({ comboCount: 0, comboMultiplier: 1 }),
  setWorld:        (w)        => set({ world: w }),
  setBoostGauge:   (g)        => set({ boostGauge: g }),
  setMagnetState:  (active, timer) => set({ magnetActive: active, magnetTimer: timer }),
}))
