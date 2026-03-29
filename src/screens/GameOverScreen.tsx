import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { loadScores, type ScoreEntry } from '../utils/highscores'

export function GameOverScreen() {
  const score     = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const restart   = useGameStore((s) => s.restartGame)
  const goStart   = useGameStore((s) => s.startGame)

  const [scores, setScores] = useState<ScoreEntry[]>([])
  const isNewBest = score > 0 && score >= highScore

  useEffect(() => {
    setScores(loadScores())
  }, [])

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h1 style={styles.title}>GAME OVER</h1>

        <div style={styles.scoreBlock}>
          <div style={styles.scoreLabel}>PUNKTE</div>
          <div style={styles.scoreValue}>{score}</div>
          {isNewBest && <div style={styles.newBest}>NEUER REKORD!</div>}
        </div>

        {highScore > 0 && !isNewBest && (
          <div style={styles.best}>Bestzeit: {highScore}</div>
        )}

        {/* Top 5 leaderboard */}
        {scores.length > 0 && (
          <div style={styles.scoreboard}>
            <div style={styles.boardTitle}>BESTENLISTE</div>
            {scores.map((e, i) => (
              <div
                key={i}
                style={{
                  ...styles.scoreRow,
                  background: e.score === score ? 'rgba(231,76,60,0.12)' : 'transparent',
                  borderRadius: '6px',
                }}
              >
                <span style={{ ...styles.rank, color: i === 0 ? '#f39c12' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.4)' }}>
                  #{i + 1}
                </span>
                <span style={styles.scoreVal}>{e.score}</span>
                <span style={styles.scoreDate}>{e.date}</span>
              </div>
            ))}
          </div>
        )}

        <button style={styles.btn} onClick={restart}>
          NOCHMAL SPIELEN
        </button>
        <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => goStart()}>
          HAUPTMENÜ
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position:       'fixed',
    inset:          0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     'rgba(10, 20, 35, 0.93)',
    zIndex:         10,
    fontFamily:     "'Segoe UI', system-ui, sans-serif",
    overflowY:      'auto',
  },
  card: {
    textAlign:      'center',
    padding:        '48px 56px',
    background:     'rgba(255,255,255,0.04)',
    border:         '1px solid rgba(255,255,255,0.1)',
    borderRadius:   '16px',
    backdropFilter: 'blur(10px)',
    maxWidth:       '400px',
    width:          '90%',
    margin:         '20px auto',
  },
  title: {
    fontSize:      '44px',
    fontWeight:    900,
    color:         '#e74c3c',
    letterSpacing: '4px',
    margin:        '0 0 28px 0',
    textShadow:    '0 0 30px rgba(231,76,60,0.5)',
  },
  scoreBlock: { marginBottom: '16px' },
  scoreLabel: {
    color:         'rgba(255,255,255,0.5)',
    fontSize:      '12px',
    letterSpacing: '3px',
    marginBottom:  '6px',
  },
  scoreValue: {
    color:      '#ffffff',
    fontSize:   '64px',
    fontWeight: 900,
    lineHeight: 1,
  },
  newBest: {
    color:         '#f39c12',
    fontSize:      '16px',
    fontWeight:    700,
    letterSpacing: '3px',
    marginTop:     '8px',
  },
  best: {
    color:         'rgba(255,255,255,0.4)',
    fontSize:      '15px',
    marginBottom:  '20px',
  },
  scoreboard: {
    borderTop:    '1px solid rgba(255,255,255,0.1)',
    paddingTop:   '16px',
    marginBottom: '28px',
    marginTop:    '16px',
  },
  boardTitle: {
    color:         'rgba(255,255,255,0.3)',
    fontSize:      '10px',
    letterSpacing: '3px',
    marginBottom:  '10px',
    fontWeight:    600,
  },
  scoreRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '5px 8px',
    color:          'rgba(255,255,255,0.6)',
    fontSize:       '14px',
  },
  rank:      { fontWeight: 700, width: '30px', textAlign: 'left' },
  scoreVal:  { fontWeight: 700, color: '#fff', flex: 1, textAlign: 'center' },
  scoreDate: { color: 'rgba(255,255,255,0.3)', fontSize: '11px', textAlign: 'right' },
  btn: {
    display:       'block',
    width:         '100%',
    background:    '#e74c3c',
    color:         '#fff',
    border:        'none',
    borderRadius:  '8px',
    padding:       '14px 0',
    fontSize:      '16px',
    fontWeight:    700,
    letterSpacing: '2px',
    cursor:        'pointer',
    marginTop:     '10px',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.08)',
    border:     '1px solid rgba(255,255,255,0.15)',
    fontSize:   '14px',
  },
}
