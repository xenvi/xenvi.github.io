'use client'

import { useEffect, useState } from 'react'
import { useMotion } from '@/lib/motion'
import { links } from '@/lib/content'
import { scrollToId } from './SmoothScroll'

const items = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Stack' },
  { id: 'lab', label: 'Lab' },
  { id: 'ride', label: 'Ride' },
  { id: 'archive', label: 'Archive' },
  { id: 'contact', label: 'Contact' },
]

export function Nav({ onLogoTap }: { onLogoTap: () => void }) {
  const { motion, toggleMotion } = useMotion()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    items.forEach((i) => {
      const el = document.getElementById(i.id)
      if (el) obs.observe(el)
    })
    return () => {
      window.removeEventListener('scroll', onScroll)
      obs.disconnect()
    }
  }, [])

  const go = (id: string) => {
    setOpen(false)
    scrollToId(id)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4 sm:py-6'}`}
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full px-4 py-2 transition-all duration-500 sm:px-6 ${
          scrolled ? 'glass mx-3 sm:mx-auto' : ''
        }`}
        aria-label="Primary"
      >
        <button
          onClick={() => {
            onLogoTap()
            go('top')
          }}
          className="font-display text-lg font-black tracking-[0.2em] text-white"
          aria-label="Back to top"
        >
          <span className="text-glow-pink">T</span>
          <span className="text-teal">/</span>
          <span className="text-glow-teal">X</span>
        </button>

        <ul className="hidden items-center gap-1 md:flex">
          {items.map((i, n) => (
            <li key={i.id}>
              <button
                onClick={() => go(i.id)}
                className={`group relative px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                  active === i.id ? 'text-teal' : 'text-haze/80 hover:text-white'
                }`}
              >
                <span className="mr-1 text-pink/70">0{n + 1}</span>
                {i.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-pink to-teal transition-transform duration-300 ${
                    active === i.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMotion}
            aria-pressed={motion}
            className="rounded-full border border-purple/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-haze transition hover:border-teal hover:text-teal"
            title="Toggle animations"
          >
            motion: <span className={motion ? 'text-teal' : 'text-pink'}>{motion ? 'on' : 'off'}</span>
          </button>
          {links.resume && (
            <a
              href={links.resume}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-pink/60 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-pink transition hover:bg-pink hover:text-void sm:block"
            >
              Resume
            </a>
          )}
          <button
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Menu"
          >
            <span className={`h-px w-5 bg-white transition ${open ? 'translate-y-[3.5px] rotate-45' : ''}`} />
            <span className={`h-px w-5 bg-white transition ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`glass mx-3 mt-2 overflow-hidden rounded-2xl transition-all duration-500 md:hidden ${
          open ? 'max-h-96 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <ul className="p-4">
          {items.map((i, n) => (
            <li key={i.id}>
              <button onClick={() => go(i.id)} className="w-full py-3 text-left font-display text-lg tracking-widest text-white">
                <span className="mr-3 font-mono text-xs text-pink">0{n + 1}</span>
                {i.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
