// Web Audio API sound effects — no extra dependencies

let audioCtx: AudioContext | null = null

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function tone(
  freq: number,
  type: OscillatorType,
  dur: number,
  vol = 0.25,
  delay = 0,
  freqEnd?: number,
) {
  const ac  = ctx()
  const osc = ac.createOscillator()
  const g   = ac.createGain()
  osc.connect(g)
  g.connect(ac.destination)
  osc.type = type
  const t = ac.currentTime + delay
  osc.frequency.setValueAtTime(freq, t)
  if (freqEnd !== undefined) osc.frequency.linearRampToValueAtTime(freqEnd, t + dur)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function noise(dur: number, vol = 0.1, delay = 0) {
  const ac      = ctx()
  const bufSize = Math.floor(ac.sampleRate * dur)
  const buf     = ac.createBuffer(1, bufSize, ac.sampleRate)
  const data    = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  const g = ac.createGain()
  src.connect(g)
  g.connect(ac.destination)
  const t = ac.currentTime + delay
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.start(t)
  src.stop(t + dur + 0.05)
}

export const Sounds = {
  init: async () => {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    } else if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }
  },

  jump: () => {
    tone(300, 'triangle', 0.08, 0.18)
    tone(480, 'triangle', 0.06, 0.12, 0.05)
  },

  land: () => {
    noise(0.08, 0.18)
    tone(90, 'sawtooth', 0.09, 0.28)
  },

  slide: () => {
    noise(0.22, 0.12)
    tone(180, 'sawtooth', 0.2, 0.1, 0, 80)
  },

  wallPass: () => {
    tone(900,  'sine', 0.08, 0.10)
    tone(1200, 'sine', 0.06, 0.07, 0.04)
  },

  wallBreak: () => {
    noise(0.18, 0.22)
    tone(220, 'sawtooth', 0.22, 0.32, 0, 80)
    tone(440, 'square',   0.1,  0.12, 0.04)
  },

  hit: () => {
    // Distinct hit sound — heavier, alarming
    noise(0.25, 0.35)
    tone(120, 'sawtooth', 0.3, 0.4, 0, 60)
    tone(80,  'square',   0.2, 0.25, 0.05)
  },

  levelUp: () => {
    const freqs = [523, 659, 784, 1047]
    freqs.forEach((f, i) => tone(f, 'sine', 0.14, 0.22, i * 0.09))
  },

  worldChange: () => {
    // Epic ascending fanfare
    ;[262, 392, 523, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.18, 0.28, i * 0.1))
    tone(1047, 'triangle', 0.5, 0.15, 0.45)
  },

  comboUp: () => {
    tone(800,  'sine', 0.06, 0.12)
    tone(1000, 'sine', 0.05, 0.10, 0.04)
    tone(1200, 'sine', 0.05, 0.08, 0.08)
  },

  gameOver: () => {
    ;[380, 300, 220, 150].forEach((f, i) =>
      tone(f, 'sawtooth', 0.45, 0.38, i * 0.13),
    )
    noise(0.55, 0.25, 0.05)
  },
}
