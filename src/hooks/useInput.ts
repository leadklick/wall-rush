import { useEffect, useRef } from 'react'
import { touchState } from '../utils/touchState'

export interface InputState {
  left:  boolean
  right: boolean
  jump:  boolean
  slide: boolean
  boost: boolean   // ArrowUp / KeyW
}

export function useInput() {
  const keyboard = useRef<InputState>({
    left: false, right: false, jump: false, slide: false, boost: false,
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      switch (e.code) {
        case 'KeyA': case 'ArrowLeft':  keyboard.current.left  = true;  break
        case 'KeyD': case 'ArrowRight': keyboard.current.right = true;  break
        case 'Space':                   keyboard.current.jump  = true;  e.preventDefault(); break
        case 'KeyS': case 'ArrowDown':  keyboard.current.slide = true;  break
        case 'KeyW': case 'ArrowUp':    keyboard.current.boost = true;  e.preventDefault(); break
      }
    }
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyA': case 'ArrowLeft':  keyboard.current.left  = false; break
        case 'KeyD': case 'ArrowRight': keyboard.current.right = false; break
        case 'Space':                   keyboard.current.jump  = false; break
        case 'KeyS': case 'ArrowDown':  keyboard.current.slide = false; break
        case 'KeyW': case 'ArrowUp':    keyboard.current.boost = false; break
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup',   up)
    }
  }, [])

  const combined = useRef<InputState>({
    get left()  { return keyboard.current.left  || touchState.left  },
    get right() { return keyboard.current.right || touchState.right },
    get jump()  { return keyboard.current.jump  || touchState.jump  },
    get slide() { return keyboard.current.slide || touchState.slide },
    get boost() { return keyboard.current.boost || touchState.boost },
  })

  return combined
}
