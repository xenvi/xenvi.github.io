'use client'

import { useRef, useState, type PointerEvent } from 'react'
import { skillGroups } from '@/lib/content'
import { useReveal } from '@/lib/useReveal'
import { SectionHeading } from './SectionHeading'

const tone = {
  pink: { text: 'text-pink', border: 'hover:border-pink/70', glow: 'rgba(255,46,151,0.35)', chip: 'border-pink/30 hover:bg-pink/15 hover:text-white' },
  teal: { text: 'text-teal', border: 'hover:border-teal/70', glow: 'rgba(0,240,255,0.3)', chip: 'border-teal/30 hover:bg-teal/15 hover:text-white' },
  purple: { text: 'text-purple', border: 'hover:border-purple/80', glow: 'rgba(157,77,255,0.4)', chip: 'border-purple/40 hover:bg-purple/20 hover:text-white' },
  blue: { text: 'text-blue', border: 'hover:border-blue/80', glow: 'rgba(45,123,255,0.4)', chip: 'border-blue/40 hover:bg-blue/20 hover:text-white' },
} as const

function Module({ group, i }: { group: (typeof skillGroups)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const t = tone[group.color]
  const onMove = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    ref.current!.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current!.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  const span = group.id === 'ai' ? 'sm:col-span-2 lg:col-span-4' : group.id === 'core' || group.id === 'viz' ? 'lg:col-span-2' : ''
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      data-reveal
      data-delay={(i % 3) * 0.08}
      className={`group glass relative overflow-hidden rounded-2xl p-6 transition-colors duration-500 sm:p-7 ${t.border} ${span}`}
      style={{ ['--glow' as string]: t.glow }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mx) var(--my), var(--glow), transparent 60%)' }} />
      <div className="relative flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-bold text-white">{group.title}</h3>
        <span className={`shrink-0 font-mono text-xs ${t.text}`}>MOD_{group.glyph}</span>
      </div>
      <ul className="relative mt-5 flex flex-wrap gap-2">
        {group.items.map((s) => (
          <li key={s} className={`rounded-md border bg-void/40 px-2.5 py-1 font-mono text-xs text-haze transition-colors duration-300 ${t.chip}`}>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Skills() {
  const ref = useReveal<HTMLElement>()
  const [paused, setPaused] = useState(false)
  const marquee = ['TypeScript', 'React', 'Next.js', 'React Native', 'Node', 'GraphQL', 'D3', 'Python', 'Tailwind', 'Playwright', 'AWS', 'Stripe', 'MCP']

  return (
    <section id="skills" ref={ref} className="relative py-32 sm:py-44">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading index="02" kicker="loadout" accent="teal" title={<>The <span className="chrome-text">stack</span> I carry.</>} />
      </div>

      <div
        className="relative mb-16 -rotate-2 overflow-hidden border-y border-pink/30 bg-pink/5 py-4 backdrop-blur-sm"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        aria-hidden
      >
        <div className="marquee flex w-max gap-10 whitespace-nowrap" style={{ animationPlayState: paused ? 'paused' : 'running' }}>
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-3xl font-black tracking-wider text-transparent [-webkit-text-stroke:1px_rgba(255,79,216,0.9)] sm:text-5xl">
              {m}
              <span className="text-teal [-webkit-text-stroke:0]">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {skillGroups.map((g, i) => (
          <Module key={g.id} group={g} i={i} />
        ))}
      </div>
    </section>
  )
}
