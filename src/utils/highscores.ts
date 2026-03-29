// ─── Top-5 LocalStorage highscores ───────────────────────────────────────────
const KEY = 'wallrush_scores'

export interface ScoreEntry {
  score: number
  date:  string   // ISO short: "YYYY-MM-DD"
}

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as ScoreEntry[]
  } catch {
    return []
  }
}

export function saveScore(score: number): ScoreEntry[] {
  const entries = loadScores()
  const date    = new Date().toISOString().slice(0, 10)
  entries.push({ score, date })
  entries.sort((a, b) => b.score - a.score)
  const top5 = entries.slice(0, 5)
  try { localStorage.setItem(KEY, JSON.stringify(top5)) } catch { /* ignore */ }
  return top5
}
