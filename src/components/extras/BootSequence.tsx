'use client'

import { useEffect, useRef, useState } from 'react'
import { useMotion } from '@/lib/motion'

const LINES: [string, string][] = [
  ['TIFF-OS v6.0.0 // neural interface', ''],
  ['mounting /skills', '47 modules'],
  ['calibrating neon', 'ok'],
  ['rendering 250,000 data points', 'ok'],
  ['charging motorcycle battery', '100%'],
  ['waking the cat', 'meow'],
  ['jacking in', ''],
]

export const BOOT_KEY = 'tiffxt:booted'

/**
 * The overlay is server-rendered so there's no flash of the page underneath.
 * An inline script marks html.booted for returning visitors, and CSS hides it after 8s
 * as a safety net if JS never runs.
 */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const { motion, ready } = useMotion()
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    try {
      sessionStorage.setItem(BOOT_KEY, '1')
    } catch {}
    setLeaving(true)
    onDone()
    setTimeout(() => setGone(true), 900)
  }

  useEffect(() => {
    if (!ready) return
    let seen = false
    try {
      seen = sessionStorage.getItem(BOOT_KEY) === '1'
    } catch {}
    if (seen || !motion) {
      done.current = true
      onDone()
      setGone(true)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    LINES.forEach((_, i) => timers.push(setTimeout(() => setShown(i + 1), 250 + i * 320)))
    timers.push(setTimeout(finish, 250 + LINES.length * 320 + 500))
    const skip = () => finish()
    window.addEventListener('keydown', skip)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', skip)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  if (gone) return null

  return (
    <div
      className={`boot fixed inset-0 z-[100] flex items-center justify-center bg-void transition-[clip-path,opacity] duration-[800ms] ease-[cubic-bezier(.7,0,.2,1)] ${
        leaving ? 'pointer-events-none opacity-0 [clip-path:inset(50%_0_50%_0)]' : '[clip-path:inset(0_0_0_0)]'
      }`}
      onClick={finish}
      role="presentation"
    >
      <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />
      <div className="w-[min(92vw,560px)] font-mono text-xs text-haze sm:text-sm">
        <p className="glitch mb-8 font-display text-5xl font-black tracking-[0.2em] text-white text-glow-pink" data-text="T/X">
          T<span className="text-teal">/</span>X
        </p>
        {LINES.slice(0, shown).map(([l, r], i) => (
          <div key={i} className="flex gap-2 py-0.5">
            <span className="text-pink">&gt;</span>
            <span className={i === 0 ? 'text-white' : ''}>{l}</span>
            {r && (
              <>
                <span className="flex-1 overflow-hidden whitespace-nowrap text-white/20">{'.'.repeat(60)}</span>
                <span className="text-teal">{r}</span>
              </>
            )}
          </div>
        ))}
        <div className="mt-6 h-1 w-full overflow-hidden rounded bg-white/10">
          <div className="h-full bg-gradient-to-r from-pink via-purple to-teal transition-[width] duration-300" style={{ width: `${(shown / LINES.length) * 100}%` }} />
        </div>
        <button onClick={finish} className="mt-4 text-[10px] uppercase tracking-[0.3em] text-haze/50 hover:text-teal">
          press any key to skip
        </button>
      </div>
    </div>
  )
}
