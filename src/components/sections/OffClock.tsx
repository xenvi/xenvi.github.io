'use client'

import { useState } from 'react'
import { useReveal } from '@/lib/useReveal'
import { SectionHeading } from './SectionHeading'

const cards = [
  {
    icon: '🏍️',
    title: 'Electric motorcycles',
    text: 'Silent, instant, ridiculous fun. Mountain roads are the best debugger I know.',
    tone: 'from-teal/30',
  },
  {
    icon: '🎮',
    title: 'Gaming',
    text: 'Always have been. Games taught me more about UX, feedback loops and delight than any textbook.',
    tone: 'from-purple/40',
    secret: 'psst: try ↑ ↑ ↓ ↓ ← → ← → B A',
  },
  {
    icon: '🐾',
    title: 'Animals',
    text: 'I love animals, all of them. There may be a cat wandering around this page. Say hi.',
    tone: 'from-pink/30',
  },
]

export function OffClock() {
  const ref = useReveal<HTMLElement>()
  const [flipped, setFlipped] = useState<number | null>(null)
  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-44">
      <SectionHeading index="06" kicker="side quests" title={<>Things that make me <span className="chrome-text">me.</span></>} />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <button
            key={c.title}
            data-reveal
            data-delay={i * 0.1}
            onClick={() => setFlipped(flipped === i ? null : i)}
            className={`group glass relative overflow-hidden rounded-2xl p-8 text-left transition duration-500 hover:-translate-y-1`}
          >
            <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${c.tone} to-transparent blur-2xl transition-transform duration-700 group-hover:scale-150`} />
            <div className="relative text-5xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">{c.icon}</div>
            <h3 className="relative mt-6 font-display text-xl font-bold text-white">{c.title}</h3>
            <p className="relative mt-2 text-haze/85">{c.text}</p>
            {c.secret && (
              <p className={`relative mt-4 font-mono text-xs text-amber-300/80 transition-opacity ${flipped === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{c.secret}</p>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
