// ─── Gesture-based touch controls ────────────────────────────────────────────
import { useEffect, useRef } from 'react'
import { touchState } from '../utils/touchState'
import { isMobile } from '../utils/deviceProfile'
import { useGameStore } from '../store/gameStore'

type Zone = 'left' | 'middle' | 'right'
type Action = 'hold' | 'slide'

interface PointerInfo {
  startX: number
  startY: number
  zone:   Zone
  action: Action
}

function getZone(x: number): Zone {
  const w = window.innerWidth
  if (x < w * 0.33) return 'left'
  if (x > w * 0.67) return 'right'
  return 'middle'
}

export function TouchControls() {
  const status    = useGameStore((st) => st.status)
  const pauseGame = useGameStore((st) => st.pauseGame)
  const resume    = useGameStore((st) => st.resumeGame)

  const pointers = useRef(new Map<number, PointerInfo>())

  // Recompute held-state from all active pointers
  function recompute() {
    let left = false, right = false, boost = false, slide = false
    for (const p of pointers.current.values()) {
      if (p.action === 'slide') { slide = true; continue }
      if (p.zone === 'left')   left  = true
      if (p.zone === 'right')  right = true
      if (p.zone === 'middle') boost = true
    }
    touchState.left  = left
    touchState.right = right
    touchState.boost = boost
    touchState.slide = slide
  }

  // Reset on status change
  useEffect(() => {
    touchState.left  = false
    touchState.right = false
    touchState.jump  = false
    touchState.slide = false
    touchState.boost = false
    pointers.current.clear()
  }, [status])

  if (!isMobile) return null
  if (status === 'start' || status === 'gameover') return null

  if (status === 'paused') {
    return (
      <div style={s.pauseRow}>
        <div style={s.resumeBtn} onPointerDown={() => resume()}>▶ WEITER</div>
      </div>
    )
  }

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, {
      startX: e.clientX,
      startY: e.clientY,
      zone:   getZone(e.clientX),
      action: 'hold',
    })
    recompute()
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    const p = pointers.current.get(e.pointerId)
    if (!p) return

    const dy = e.clientY - p.startY
    const dx = Math.abs(e.clientX - p.startX)

    // Swipe threshold: 45px vertical, more vertical than horizontal
    if (Math.abs(dy) > 45 && Math.abs(dy) > dx * 1.2) {
      if (dy < 0 && p.action !== 'slide') {
        // Swipe up → jump (momentary pulse)
        touchState.jump = true
        setTimeout(() => { touchState.jump = false }, 140)
        // Reset start so another swipe can be detected
        p.startY = e.clientY
      } else if (dy > 0 && p.action === 'hold') {
        // Swipe down → start sliding
        p.action = 'slide'
        recompute()
      }
    }
  }

  function onUp(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    pointers.current.delete(e.pointerId)
    recompute()
  }

  return (
    <div
      style={s.overlay}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
    >
      {/* Pause button — top right, isolated from gesture area */}
      <div
        style={s.pauseBtn}
        onPointerDown={(e) => { e.stopPropagation(); pauseGame() }}
      >
        ⏸
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position:      'fixed',
    inset:         0,
    zIndex:        15,
    touchAction:   'none',
    userSelect:    'none',
    WebkitUserSelect: 'none',
  },
  zone: {
    position: 'absolute',
    top:      0,
    bottom:   0,
    borderRadius: 0,
    pointerEvents: 'none',
  },
  hint: {
    position:   'absolute',
    bottom:     '28px',
    color:      'rgba(255,255,255,0.35)',
    fontSize:   '15px',
    fontWeight: 700,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    letterSpacing: '1px',
    pointerEvents: 'none',
  },
  swipeHint: {
    position:   'absolute',
    color:      'rgba(255,255,255,0.18)',
    fontSize:   '13px',
    fontWeight: 600,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
  pauseBtn: {
    position:       'absolute',
    top:            '14px',
    right:          '14px',
    width:          '40px',
    height:         '40px',
    borderRadius:   '10px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '18px',
    color:          'rgba(255,255,255,0.6)',
    background:     'rgba(0,0,0,0.25)',
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
  resumeBtn: {
    padding:        '14px 40px',
    background:     '#00d4ff',
    color:          '#fff',
    borderRadius:   '12px',
    fontSize:       '18px',
    fontWeight:     800,
    letterSpacing:  '2px',
    fontFamily:     "'Segoe UI', system-ui, sans-serif",
    cursor:         'pointer',
    touchAction:    'none',
    userSelect:     'none',
    WebkitUserSelect: 'none',
  },
}
