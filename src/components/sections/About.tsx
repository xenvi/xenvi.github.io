'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMotion } from '@/lib/motion'
import { useReveal } from '@/lib/useReveal'
import { strengths } from '@/lib/content'
import { SectionHeading } from './SectionHeading'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const statement =
  "I'm a self-taught software engineer who walked into a corporate office at 18 and never stopped shipping. Six-plus years later, frontend is my home turf, but I'm just as happy in Node, Python, SQL, React Native or an AWS console. I do my best work where the requirements are fuzzy and someone needs to own the architecture, the product call, and the team's craft."

const stats = [
  { n: 6, suffix: '+', label: 'years shipping' },
  { n: 250, suffix: 'k+', label: 'points per plot' },
  { n: 18, suffix: '', label: 'age I went corporate' },
  { n: 0, suffix: '', label: 'litres of gas burned', display: '0' },
]

export function About() {
  const ref = useReveal<HTMLElement>()
  const statementRef = useRef<HTMLParagraphElement>(null)
  const { motion, ready } = useMotion()

  useGSAP(
    () => {
      if (!ready) return
      const words = gsap.utils.toArray<HTMLElement>('.word', statementRef.current)
      const counters = gsap.utils.toArray<HTMLElement>('[data-count]', ref.current)
      if (!motion) {
        gsap.set(words, { opacity: 1 })
        counters.forEach((c) => (c.textContent = c.dataset.count!))
        return
      }
      gsap.fromTo(
        words,
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: statementRef.current, start: 'top 80%', end: 'bottom 45%', scrub: true },
        },
      )
      counters.forEach((c) => {
        const obj = { v: 0 }
        gsap.to(obj, {
          v: Number(c.dataset.count),
          duration: 2,
          ease: 'power3.out',
          scrollTrigger: { trigger: c, start: 'top 90%', once: true },
          onUpdate: () => (c.textContent = String(Math.round(obj.v))),
        })
      })
    },
    { scope: ref, dependencies: [motion, ready], revertOnUpdate: true },
  )

  const highlight = new Set(['self-taught', '18', 'Six-plus', 'frontend', 'architecture,', 'product', 'craft.'])

  return (
    <section id="about" ref={ref} className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-44">
      <SectionHeading index="01" kicker="whoami" title={<>Senior engineer. <span className="chrome-text">Still curious.</span></>} />

      <p ref={statementRef} className="max-w-4xl text-2xl leading-snug font-medium text-white sm:text-4xl sm:leading-tight">
        {statement.split(' ').map((w, i) => (
          <span key={i} className={`word inline-block pr-[0.25em] ${highlight.has(w) ? 'text-teal' : ''}`}>
            {w}
          </span>
        ))}
      </p>

      <div className="mt-20 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} data-reveal="scale" data-delay={i * 0.08} className="glass corner-frame rounded-xl p-6">
            <div className="font-display text-4xl font-black text-white sm:text-5xl">
              <span data-count={s.n}>{s.n}</span>
              <span className="text-pink">{s.suffix}</span>
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-haze/80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-purple/25 bg-purple/20 sm:grid-cols-2 lg:grid-cols-3">
        {strengths.map((s, i) => (
          <div key={s.k} data-reveal data-delay={(i % 3) * 0.08} className="group relative bg-void/85 p-7 transition-colors duration-500 hover:bg-ink/90">
            <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-pink via-purple to-teal transition-transform duration-700 group-hover:scale-x-100" />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-pink">0{i + 1}</p>
            <h3 className="mt-3 font-display text-lg font-bold text-white">{s.k}</h3>
            <p className="mt-2 text-haze/85">{s.v}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
