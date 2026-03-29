import { useGameStore } from '../store/gameStore'
import { Sounds } from '../utils/sounds'
import { loadScores } from '../utils/highscores'
import { isMobile } from '../utils/deviceProfile'

export function StartScreen() {
  const startGame = useGameStore((s) => s.startGame)
  const scores    = loadScores()

  const handleStart = async () => {
    await Sounds.init()
    startGame()
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h1 style={styles.title}>WALL RUSH</h1>
        <p style={styles.subtitle}>Weiche den Wänden aus. Überlebst du?</p>

        {isMobile ? (
          <div style={styles.mobileHint}>
            <div style={styles.mobileHintRow}>◀ ▶ Bewegen &nbsp;|&nbsp; ▲ Springen &nbsp;|&nbsp; GLEITEN Gleiten</div>
            <div style={styles.mobileHintRow}>Tasten erscheinen im Spiel</div>
          </div>
        ) : (
          <div style={styles.controls}>
            <div style={styles.key}><span style={styles.kbd}>← A</span> Links</div>
            <div style={styles.key}><span style={styles.kbd}>→ D</span> Rechts</div>
            <div style={styles.key}><span style={styles.kbd}>LEERTASTE</span> Springen</div>
            <div style={styles.key}><span style={styles.kbd}>S ↓</span> Gleiten</div>
            <div style={styles.key}><span style={styles.kbd}>ESC</span> Pause</div>
          </div>
        )}

        <div style={styles.tips}>
          <p>Finde die Lücke und renne hindurch.</p>
          <p><span style={{ color: '#cc44ff' }}>Lila Lücke</span> = Gleiten (S / ↓)</p>
          <p><span style={{ color: '#ff8c00' }}>Orange Bereich</span> = Durchbrechen</p>
          <p>Neue Welt alle 3 Level!</p>
          <p>3 Leben — du startest dort weiter, wo du aufgehört hast.</p>
        </div>

        <button style={styles.btn} onClick={handleStart}>
          SPIEL STARTEN
        </button>

        {scores.length > 0 && (
          <div style={styles.scores}>
            <div style={styles.scoresTitle}>BESTENLISTE</div>
            {scores.map((e, i) => (
              <div key={i} style={styles.scoreRow}>
                <span style={styles.rank}>#{i + 1}</span>
                <span style={styles.scoreVal}>{e.score}</span>
                <span style={styles.scoreDate}>{e.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position:        'fixed',
    inset:           0,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    background:      'rgba(10, 20, 35, 0.96)',
    zIndex:          10,
    fontFamily:      "'Segoe UI', system-ui, sans-serif",
    overflowY:       'auto',
    WebkitOverflowScrolling: 'touch',
  },
  card: {
    textAlign:       'center',
    padding:         isMobile ? '32px 24px' : '48px 56px',
    background:      'rgba(255,255,255,0.04)',
    border:          '1px solid rgba(255,255,255,0.1)',
    borderRadius:    '16px',
    backdropFilter:  'blur(10px)',
    maxWidth:        '440px',
    width:           '90%',
    margin:          '20px auto',
  },
  title: {
    fontSize:      '52px',
    fontWeight:    900,
    color:         '#e74c3c',
    letterSpacing: '6px',
    margin:        '0 0 8px 0',
    textShadow:    '0 0 40px rgba(231,76,60,0.5)',
  },
  subtitle: {
    color:   'rgba(255,255,255,0.6)',
    fontSize: '15px',
    margin:  '0 0 32px 0',
  },
  controls: {
    display:        'flex',
    gap:            '10px',
    justifyContent: 'center',
    marginBottom:   '24px',
    flexWrap:       'wrap',
  },
  key: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
    color:      'rgba(255,255,255,0.8)',
    fontSize:   '13px',
  },
  kbd: {
    background:   'rgba(255,255,255,0.12)',
    border:       '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    padding:      '3px 8px',
    fontSize:     '11px',
    fontFamily:   'monospace',
    color:        '#f39c12',
  },
  mobileHint: {
    marginBottom:  '20px',
  },
  mobileHintRow: {
    color:    'rgba(255,255,255,0.5)',
    fontSize: '13px',
    lineHeight: '2.0',
  },
  tips: {
    color:         'rgba(255,255,255,0.45)',
    fontSize:      '13px',
    lineHeight:    '1.8',
    marginBottom:  '32px',
  },
  btn: {
    background:    '#e74c3c',
    color:         '#fff',
    border:        'none',
    borderRadius:  '8px',
    padding:       '14px 48px',
    fontSize:      '18px',
    fontWeight:    700,
    letterSpacing: '2px',
    cursor:        'pointer',
    transition:    'transform 0.1s, background 0.2s',
  },
  scores: {
    marginTop:  '32px',
    borderTop:  '1px solid rgba(255,255,255,0.1)',
    paddingTop: '20px',
  },
  scoresTitle: {
    color:         'rgba(255,255,255,0.3)',
    fontSize:      '11px',
    letterSpacing: '3px',
    marginBottom:  '12px',
    fontWeight:    600,
  },
  scoreRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '4px 8px',
    color:          'rgba(255,255,255,0.6)',
    fontSize:       '14px',
  },
  rank:      { color: '#f39c12', fontWeight: 700, width: '30px', textAlign: 'left' },
  scoreVal:  { fontWeight: 700, color: '#fff', flex: 1, textAlign: 'center' },
  scoreDate: { color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'right' },
}
