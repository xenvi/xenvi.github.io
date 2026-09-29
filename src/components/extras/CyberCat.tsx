'use client'

import { useEffect, useRef, useState } from 'react'
import { useMotion } from '@/lib/motion'
import { achieve } from './Toaster'

type Mode = 'walk' | 'sit' | 'sleep' | 'run'

const W = 72
const LINES = ['purr~', 'mrrp!', '=^.^=', 'meow.exe', '*slow blink*', 'feed me bits', '♥ ♥ ♥']

/** A small neon cat that wanders the bottom of the viewport and likes being petted. */
export function CyberCat() {
  const { motion, ready } = useMotion()
  const el = useRef<HTMLButtonElement>(null)
  const [mode, setMode] = useState<Mode>('sit')
  const [facing, setFacing] = useState<1 | -1>(1)
  const [bubble, setBubble] = useState<string | null>(null)
  const [hearts, setHearts] = useState<{ id: number; dx: number }[]>([])
  const [hidden, setHidden] = useState(false)
  const pets = useRef(0)
  const state = useRef({ x: 24, target: 24, mode: 'sit' as Mode, until: 0, pointerX: -1, pointerY: -1, pettedUntil: 0 })

  useEffect(() => {
    if (!ready) return
    const s = state.current
    s.x = Math.min(window.innerWidth - W - 16, 24)
    if (!motion) {
      setMode('sit')
      if (el.current) el.current.style.transform = `translate3d(${s.x}px,0,0)`
      return
    }
    let raf = 0
    let last = performance.now()
    const onPointer = (e: PointerEvent) => {
      s.pointerX = e.clientX
      s.pointerY = e.clientY
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const setM = (m: Mode) => {
      if (s.mode !== m) {
        s.mode = m
        setMode(m)
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const maxX = window.innerWidth - W - 8
      const nearBottom = s.pointerY > window.innerHeight - 140 && s.pointerX >= 0

      if (now < s.pettedUntil) {
        setM('sit')
      } else if (nearBottom && s.mode !== 'sleep' && Math.abs(s.pointerX - W / 2 - s.x) > 30) {
        s.target = Math.max(8, Math.min(maxX, s.pointerX - W / 2))
        setM('run')
      } else if (s.mode === 'walk' || s.mode === 'run') {
        if (Math.abs(s.target - s.x) < 4) {
          const next: Mode = Math.random() < 0.2 ? 'sleep' : 'sit'
          setM(next)
          s.until = now + (next === 'sleep' ? 9000 : 2500 + Math.random() * 4000)
        }
      } else if (now > s.until) {
        s.target = 8 + Math.random() * maxX
        setM('walk')
      }

      if (s.mode === 'walk' || s.mode === 'run') {
        const speed = s.mode === 'run' ? 220 : 55
        const dir = Math.sign(s.target - s.x)
        s.x += dir * Math.min(speed * dt, Math.abs(s.target - s.x))
        if (dir) setFacing(dir as 1 | -1)
      }
      s.x = Math.max(8, Math.min(maxX, s.x))
      if (el.current) el.current.style.transform = `translate3d(${s.x}px,0,0)`
      raf = requestAnimationFrame(tick)
    }
    s.until = performance.now() + 2500
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [motion, ready])

  const pet = () => {
    pets.current++
    state.current.pettedUntil = performance.now() + 2200
    setMode('sit')
    setBubble(LINES[Math.floor(Math.random() * LINES.length)])
    const id = Date.now()
    setHearts((h) => [...h, { id, dx: (Math.random() - 0.5) * 40 }])
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1200)
    setTimeout(() => setBubble(null), 1800)
    if (pets.current === 10) achieve('Cat Whisperer', 'You pet the cat 10 times. It trusts you now.')
  }

  if (hidden) return null

  const walking = mode === 'walk' || mode === 'run'
  const dur = mode === 'run' ? '0.25s' : '0.6s'

  return (
    <div className="pointer-events-none fixed bottom-2 left-0 z-40 w-full" aria-live="polite">
      <button
        ref={el}
        onClick={pet}
        onDoubleClick={(e) => e.shiftKey && setHidden(true)}
        className="pointer-events-auto absolute bottom-0 left-0 block will-change-transform"
        style={{ width: W, transform: 'translate3d(24px,0,0)' }}
        aria-label="Pet the cyber-cat"
        title="Pet me"
      >
        {bubble && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-pink/50 bg-void/90 px-2 py-0.5 font-mono text-[10px] text-pink">
            {bubble}
          </span>
        )}
        {hearts.map((h) => (
          <span key={h.id} className="absolute -top-2 left-1/2 text-sm text-pink" style={{ animation: 'float-up 1.2s ease-out forwards', ['--dx' as string]: `${h.dx}px` }}>
            ♥
          </span>
        ))}
        {mode === 'sleep' && <span className="absolute -top-5 right-1 animate-pulse font-mono text-xs text-teal">z z</span>}
        <svg viewBox="0 0 64 48" width={W} overflow="visible" style={{ overflow: 'visible', transform: `scaleX(${facing})`, filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.8)) drop-shadow(0 0 10px rgba(255,46,151,0.5))' }}>
          <style>{`
            .leg{transform-box:fill-box;transform-origin:50% 0;}
            .walk .la{animation:leg ${dur} ease-in-out infinite alternate}
            .walk .lb{animation:leg ${dur} ease-in-out infinite alternate-reverse}
            @keyframes leg{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}
            .tail{transform-origin:12px 26px;animation:tail 1.6s ease-in-out infinite alternate}
            @keyframes tail{from{transform:rotate(-8deg)}to{transform:rotate(14deg)}}
          `}</style>
          <g className={walking ? 'walk' : ''}>
            <path className="tail" d="M13 26 C 3 24, 2 10, 9 7" fill="none" stroke="#ff2e97" strokeWidth="2.5" strokeLinecap="round" />
            <g style={{ transformOrigin: '14px 34px', transform: mode === 'sit' ? 'rotate(-16deg)' : mode === 'sleep' ? 'translateY(5px) scaleY(0.8)' : 'none', transition: 'transform .4s' }}>
              {!(mode === 'sleep') && (
                <>
                  <line className="leg la" x1="18" y1="32" x2="18" y2="43" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
                  <line className="leg lb" x1="23" y1="32" x2="23" y2="43" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
                  <line className="leg lb" x1="37" y1="32" x2="37" y2="43" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
                  <line className="leg la" x1="42" y1="32" x2="42" y2="43" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
                </>
              )}
              <path d="M12 26 Q12 18 20 18 L40 18 Q47 18 47 25 L47 28 Q47 34 40 34 L19 34 Q12 34 12 28 Z" fill="#0b0520" stroke="#00f0ff" strokeWidth="2" />
              <path d="M20 22 L26 22 M30 22 L36 22" stroke="#ff2e97" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
              <g>
                <path d="M42 11 L43.5 2.5 L48.5 8 Z M51 8 L56 2.5 L56.5 11 Z" fill="#0b0520" stroke="#00f0ff" strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="49" cy="15" r="8.5" fill="#0b0520" stroke="#00f0ff" strokeWidth="2" />
                {mode === 'sleep' ? (
                  <path d="M49 15 h3 M53.5 15 h2" stroke="#00f0ff" strokeWidth="1.4" strokeLinecap="round" />
                ) : bubble ? (
                  <path d="M49 16 q1.5 -2 3 0 M53.5 16 q1 -1.6 2 0" fill="none" stroke="#ff2e97" strokeWidth="1.3" strokeLinecap="round" />
                ) : (
                  <>
                    <circle cx="51" cy="14.5" r="1.4" fill="#ff2e97" />
                    <circle cx="55" cy="14.5" r="1.2" fill="#ff2e97" />
                  </>
                )}
                <path d="M56.5 18 l1.5 0.6 M56.5 19 l2 1.4" stroke="#c9b8ff" strokeWidth="0.8" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
      </button>
    </div>
  )
}
