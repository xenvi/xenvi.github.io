'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useMotion } from '@/lib/motion'
import { achieve } from './Toaster'

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export type KonamiHandle = { trigger: () => void }

/** ↑↑↓↓←→←→BA (or tapping the logo 7×) sends the city into overdrive. */
export const Konami = forwardRef<KonamiHandle>(function Konami(_, ref) {
  const { setOverdrive, motion } = useMotion()
  const [bikes, setBikes] = useState<number[]>([])
  const idx = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const unlocked = useRef(false)

  const trigger = useCallback(() => {
    setOverdrive(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOverdrive(false), 12000)
    if (motion) {
      const id = Date.now()
      setBikes((b) => [...b, id])
      setTimeout(() => setBikes((b) => b.filter((x) => x !== id)), 2600)
    }
    if (!unlocked.current) {
      unlocked.current = true
      achieve('OVERDRIVE', 'You found the Konami code. Respect, fellow gamer.')
    }
  }, [motion, setOverdrive])

  useImperativeHandle(ref, () => ({ trigger }), [trigger])

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (k === CODE[idx.current]) {
        idx.current++
        if (idx.current === CODE.length) {
          idx.current = 0
          trigger()
        }
      } else {
        idx.current = k === CODE[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [trigger])

  return (
    <>
      {bikes.map((id) => (
        <div key={id} className="pointer-events-none fixed left-0 top-[62%] z-[80]" style={{ animation: 'zoom-across 2.4s cubic-bezier(.5,0,.3,1) forwards' }} aria-hidden>
          <svg width="260" height="110" viewBox="0 0 260 110" style={{ filter: 'drop-shadow(0 0 6px #00f0ff) drop-shadow(0 0 18px #ff2e97)' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1={-120 + i * 8} x2={20 + i * 6} y1={40 + i * 9} y2={40 + i * 9} stroke={i % 2 ? '#ff2e97' : '#00f0ff'} strokeWidth="2" opacity={0.7 - i * 0.08} />
            ))}
            <circle cx="62" cy="80" r="24" fill="none" stroke="#00f0ff" strokeWidth="4" />
            <circle cx="200" cy="80" r="24" fill="none" stroke="#00f0ff" strokeWidth="4" />
            <path d="M62 80 L100 50 L150 48 L178 36 L200 80 M100 50 L118 74 L160 74 L178 36 M150 48 L140 30 L112 30" fill="none" stroke="#ff2e97" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
            <rect x="112" y="52" width="40" height="20" rx="4" fill="#0b0520" stroke="#ff4fd8" strokeWidth="3" />
            <path d="M178 36 L190 28 M186 44 l14 -2" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      ))}
    </>
  )
})
