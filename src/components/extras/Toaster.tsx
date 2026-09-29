'use client'

import { useEffect, useState } from 'react'

export function achieve(title: string, body: string) {
  window.dispatchEvent(new CustomEvent('tiffxt:achievement', { detail: { title, body } }))
}

type Toast = { id: number; title: string; body: string }

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => {
    const on = (e: Event) => {
      const { title, body } = (e as CustomEvent).detail
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, title, body }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
    }
    window.addEventListener('tiffxt:achievement', on)
    return () => window.removeEventListener('tiffxt:achievement', on)
  }, [])
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[70] flex flex-col gap-3" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="glass flex animate-[toastin_0.5s_cubic-bezier(.2,1.4,.4,1)] items-center gap-3 rounded-xl border-amber-300/40 px-4 py-3 shadow-[0_0_30px_rgba(255,179,71,0.25)]">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-300/15 text-lg">🏆</span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300">Achievement unlocked</p>
            <p className="font-display text-sm font-bold text-white">{t.title}</p>
            <p className="text-xs text-haze/80">{t.body}</p>
          </div>
        </div>
      ))}
      <style>{`@keyframes toastin{from{transform:translateX(120%);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  )
}
