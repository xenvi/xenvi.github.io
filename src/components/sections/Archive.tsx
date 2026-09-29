'use client'

import { useRef, type PointerEvent } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '@/lib/content'
import { asset } from '@/lib/scroll'
import { useMotion } from '@/lib/motion'
import { useReveal } from '@/lib/useReveal'
import { SectionHeading } from './SectionHeading'

gsap.registerPlugin(useGSAP, ScrollTrigger)

function Card({ p, i }: { p: (typeof projects)[number]; i: number }) {
  const ref = useRef<HTMLElement>(null)
  const { motion } = useMotion()
  const onMove = (e: PointerEvent) => {
    if (!motion || e.pointerType !== 'mouse') return
    const r = ref.current!.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current!.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(0)`
    ref.current!.style.setProperty('--hx', `${(x + 0.5) * 100}%`)
    ref.current!.style.setProperty('--hy', `${(y + 0.5) * 100}%`)
  }
  const reset = () => {
    if (ref.current) ref.current.style.transform = ''
  }
  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="archive-card group glass relative flex w-[82vw] shrink-0 flex-col overflow-hidden rounded-2xl transition-transform duration-300 ease-out sm:w-[440px]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(p.img)} alt={`${p.name} screenshot`} loading="lazy" className="h-full w-full object-cover object-top saturate-[0.8] transition duration-700 group-hover:scale-105 group-hover:saturate-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-color-dodge transition-opacity duration-300 group-hover:opacity-60"
          style={{ background: 'radial-gradient(circle at var(--hx,50%) var(--hy,50%), rgba(255,79,216,0.7), rgba(0,240,255,0.35) 30%, transparent 60%)' }}
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-void/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-haze backdrop-blur">
          {p.year} · {p.kind}
        </span>
        <span className="absolute right-4 top-3 font-display text-5xl font-black text-white/10">0{i + 1}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-black text-white">{p.name}</h3>
        <p className="mt-2 flex-1 text-sm text-haze/85">{p.blurb}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {p.tags.map((t) => (
            <li key={t} className="rounded border border-purple/30 px-2 py-0.5 font-mono text-[10px] text-haze/80">
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex gap-4 font-mono text-xs uppercase tracking-widest">
          {p.live && (
            <a href={p.live} target="_blank" rel="noreferrer" className="text-pink hover:text-white">
              Live ↗
            </a>
          )}
          <a href={p.source} target="_blank" rel="noreferrer" className="text-teal hover:text-white">
            Source ↗
          </a>
        </div>
      </div>
    </article>
  )
}

export function Archive() {
  const ref = useReveal<HTMLElement>()
  const track = useRef<HTMLDivElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const { motion, ready } = useMotion()

  useGSAP(
    () => {
      if (!ready || !motion) return
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        const distance = () => track.current!.scrollWidth - window.innerWidth + 64
        gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: 0.8,
            pin: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        })
        gsap.utils.toArray<HTMLElement>('.archive-card').forEach((card, i) => {
          gsap.fromTo(card, { y: 60 + (i % 2) * 40, opacity: 0.3 }, { y: i % 2 ? 30 : 0, opacity: 1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: pin.current, start: 'top 70%' } })
        })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [motion, ready], revertOnUpdate: true },
  )

  return (
    <section id="archive" ref={ref} className="relative pt-32 sm:pt-44">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="05"
          kicker="the archive"
          title={
            <>
              Where it <span className="chrome-text">started.</span>
            </>
          }
        />
        <p data-reveal className="-mt-6 mb-10 max-w-2xl text-haze/85">
          Before the job titles: the self-taught builds from 2019–2020 that got me hired. They&apos;re a little rough, and I&apos;m proud of
          every one. Most of my professional work isn&apos;t public, but I&apos;m happy to walk you through it on a call.
        </p>
      </div>
      <div ref={pin} className="overflow-hidden lg:flex lg:h-screen lg:items-center">
        <div
          ref={track}
          className="flex gap-6 overflow-x-auto px-4 pb-10 sm:px-6 lg:overflow-visible lg:pb-0 lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {projects.map((p, i) => (
            <div key={p.name} style={{ scrollSnapAlign: 'start' }}>
              <Card p={p} i={i} />
            </div>
          ))}
          <div className="flex w-[70vw] shrink-0 flex-col justify-center sm:w-[360px]">
            <p className="font-display text-3xl font-black text-white">
              6 years later<span className="text-pink">…</span>
            </p>
            <p className="mt-3 text-haze/80">Design systems, 250k-point plots, mobile apps, payments, and teams I got to help grow.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
