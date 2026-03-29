// ─── On-screen touch controls (only shown on touch devices) ──────────────────
import { useEffect } from 'react'
import { touchState } from '../utils/touchState'
import { isMobile } from '../utils/deviceProfile'
import { useGameStore } from '../store/gameStore'

interface TouchBtnProps {
  label:    string
  onDown:   () => void
  onUp:     () => void
  style?:   React.CSSProperties
}

function TouchBtn({ label, onDown, onUp, style }: TouchBtnProps) {
  return (
    <div
      style={{ ...s.btn, ...style }}
      onPointerDown={(e) => { e.preventDefault(); onDown() }}
      onPointerUp={(e)   => { e.preventDefault(); onUp() }}
      onPointerLeave={(e)=> { e.preventDefault(); onUp() }}
      onPointerCancel={(e)=>{ e.preventDefault(); onUp() }}
    >
      {label}
    </div>
  )
}

export function TouchControls() {
  const status    = useGameStore((st) => st.status)
  const pauseGame = useGameStore((st) => st.pauseGame)
  const resume    = useGameStore((st) => st.resumeGame)

  // Reset all touch state when game status changes (avoid stuck inputs)
  useEffect(() => {
    touchState.left  = false
    touchState.right = false
    touchState.jump  = false
    touchState.slide = false
    touchState.boost = false
  }, [status])

  if (!isMobile) return null
  if (status === 'start' || status === 'gameover') return null

  if (status === 'paused') {
    return (
      <div style={s.pauseRow}>
        <div style={{ ...s.btn, ...s.btnPause, width: '140px' }} onPointerDown={() => resume()}>
          ▶ WEITER
        </div>
      </div>
    )
  }

  return (
    <div style={s.container}>
      {/* Directional pad — left side */}
      <div style={s.dpad}>
        <TouchBtn
          label="◀"
          style={s.btnMove}
          onDown={() => { touchState.left = true }}
          onUp={()   => { touchState.left = false }}
        />
        <TouchBtn
          label="▶"
          style={s.btnMove}
          onDown={() => { touchState.right = true }}
          onUp={()   => { touchState.right = false }}
        />
      </div>

      {/* Pause button — center top */}
      <div style={s.pauseWrap}>
        <div
          style={s.btnPause}
          onPointerDown={(e) => { e.preventDefault(); pauseGame() }}
        >
          ⏸
        </div>
      </div>

      {/* Action buttons — right side */}
      <div style={s.actions}>
        <TouchBtn
          label="⚡"
          style={{ ...s.btnAction, background: 'rgba(255,200,0,0.55)' }}
          onDown={() => { touchState.boost = true }}
          onUp={()   => { touchState.boost = false }}
        />
        <TouchBtn
          label="▲"
          style={{ ...s.btnAction, background: 'rgba(0,212,255,0.55)' }}
          onDown={() => { touchState.jump = true }}
          onUp={()   => { touchState.jump = false }}
        />
        <TouchBtn
          label="GLEITEN"
          style={{ ...s.btnAction, background: 'rgba(204,68,255,0.55)', fontSize: '13px', letterSpacing: '1px' }}
          onDown={() => { touchState.slide = true }}
          onUp={()   => { touchState.slide = false }}
        />
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: {
    position:       'fixed',
    bottom:         0,
    left:           0,
    right:          0,
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    padding:        '0 16px 24px 16px',
    pointerEvents:  'none',
    zIndex:         15,
  },
  dpad: {
    display: 'flex',
    gap:     '10px',
    pointerEvents: 'auto',
  },
  actions: {
    display: 'flex',
    gap:     '10px',
    pointerEvents: 'auto',
  },
  pauseWrap: {
    alignSelf:     'flex-end',
    paddingBottom: '8px',
    pointerEvents: 'auto',
  },
  btn: {
    width:          '72px',
    height:         '72px',
    borderRadius:   '50%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '26px',
    fontWeight:     900,
    color:          '#fff',
    userSelect:     'none',
    WebkitUserSelect: 'none',
    cursor:         'pointer',
    border:         '2px solid rgba(255,255,255,0.3)',
    backdropFilter: 'blur(4px)',
    touchAction:    'none',
  },
  btnMove: {
    background: 'rgba(255,255,255,0.18)',
  },
  btnAction: {
    width:  '72px',
    height: '72px',
  },
  btnPause: {
    width:          '44px',
    height:         '44px',
    borderRadius:   '12px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '20px',
    color:          'rgba(255,255,255,0.6)',
    background:     'rgba(255,255,255,0.08)',
    border:         '1px solid rgba(255,255,255,0.15)',
    cursor:         'pointer',
    touchAction:    'none',
  },
  pauseRow: {
    position:       'fixed',
    bottom:         '24px',
    left:           '50%',
    transform:      'translateX(-50%)',
    zIndex:         25,
    pointerEvents:  'auto',
  },
}
