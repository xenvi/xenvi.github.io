'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useMediaQuery, useMotion } from '@/lib/motion'
import { useReveal } from '@/lib/useReveal'
import { SectionHeading } from './SectionHeading'
import { MAX_MPH, stepSpeed } from '@/lib/bike'
import type { Throttle } from '../three/moto/MotoScene'

const MotoScene = dynamic(() => import('../three/moto/MotoScene'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center font-mono text-xs text-haze/60">charging battery…</div>,
})

const facts = [
  { k: 'Instant torque', v: '100% of it, from zero rpm. Every green light is a launch.' },
  { k: 'Near-silent', v: 'Just tire hum and a sci-fi whine. You hear the world instead of the engine.' },
  { k: '0 L of gas', v: 'Charged at home. The only thing I burn is tread.' },
]

/** Tiny WebAudio synth for the electric-motor whine. Created on first user gesture. */
function useWhine() {
  const ctx = useRef<AudioContext | null>(null)
  const osc = useRef<{ o1: OscillatorNode; o2: OscillatorNode; g: GainNode } | null>(null)
  const start = () => {
    try {
      ctx.current ??= new AudioContext()
      const ac = ctx.current
      const g = ac.createGain()
      g.gain.value = 0
      const o1 = ac.createOscillator()
      const o2 = ac.createOscillator()
      o1.type = 'sawtooth'
      o2.type = 'sine'
      o1.frequency.value = 180
      o2.frequency.value = 360
      const filter = ac.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1800
      o1.connect(filter)
      o2.connect(filter)
      filter.connect(g).connect(ac.destination)
      o1.start()
      o2.start()
      const t = ac.currentTime
      g.gain.linearRampToValueAtTime(0.05, t + 0.15)
      o1.frequency.exponentialRampToValueAtTime(900, t + 3.8)
      o2.frequency.exponentialRampToValueAtTime(1800, t + 3.8)
      osc.current = { o1, o2, g }
    } catch {
      // Audio is a garnish; ignore failures.
    }
  }
  const stop = () => {
    const ac = ctx.current
    const o = osc.current
    if (!ac || !o) return
    const t = ac.currentTime
    o.g.gain.cancelScheduledValues(t)
    o.g.gain.setValueAtTime(o.g.gain.value, t)
    o.g.gain.linearRampToValueAtTime(0, t + 0.6)
    o.o1.frequency.cancelScheduledValues(t)
    o.o1.frequency.setValueAtTime(o.o1.frequency.value, t)
    o.o1.frequency.exponentialRampToValueAtTime(120, t + 0.6)
    o.o1.stop(t + 0.65)
    o.o2.stop(t + 0.65)
    osc.current = null
  }
  return { start, stop }
}

export function Ride() {
  const ref = useReveal<HTMLElement>()
  const { motion } = useMotion()
  const lite = useMediaQuery('(max-width: 768px), (pointer: coarse)')
  const stage = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [holding, setHolding] = useState(false)
  const [sound, setSound] = useState(false)
  const speedEl = useRef<HTMLDivElement>(null)
  const barEl = useRef<HTMLDivElement>(null)
  const throttle = useRef(0) as Throttle
  const target = useRef(0)
  const speedMph = useRef(0)
  const whine = useWhine()

  // Only render the 3D bike while it's on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '200px' })
    io.observe(stage.current!)
    return () => io.disconnect()
  }, [])

  // Ease throttle and drive the speedo readout.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      speedMph.current = stepSpeed(speedMph.current, target.current === 1, dt)
      throttle.current = speedMph.current / MAX_MPH
      const mph = Math.round(speedMph.current)
      if (speedEl.current) speedEl.current.textContent = String(mph)
      if (barEl.current) barEl.current.style.width = `${(mph / MAX_MPH) * 100}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [throttle])

  const press = () => {
    target.current = 1
    setHolding(true)
    if (sound) whine.start()
  }
  const release = () => {
    if (!holding) return
    target.current = 0
    setHolding(false)
    whine.stop()
  }

  return (
    <section id="ride" ref={ref} className="relative py-32 sm:py-44">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading index="04" kicker="off the clock" accent="teal" title={<>I ride <span className="chrome-text">electric.</span></>} />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6 lg:pl-[max(0px,calc((100vw-72rem)/2-1.5rem))]">
          <p data-reveal className="text-xl text-white">
            When I close the laptop, I&apos;m usually on two wheels: electric motorcycles, the quietest way to go very, very fast.
          </p>
          <p data-reveal className="text-haze/85">
            It scratches the same itch as engineering: a machine you get to understand deeply, tune, and trust. Also, it&apos;s the
            closest thing to living in a cyberpunk city I&apos;ve found.
          </p>
          <div className="space-y-3">
            {facts.map((f, i) => (
              <div key={f.k} data-reveal="left" data-delay={i * 0.1} className="glass flex gap-4 rounded-xl p-4">
                <span className="font-display text-sm font-bold text-teal">0{i + 1}</span>
                <div>
                  <p className="font-display text-sm font-bold text-white">{f.k}</p>
                  <p className="text-sm text-haze/80">{f.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div data-reveal="scale" className="relative">
          <div ref={stage} className="corner-frame relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-purple/30 bg-void">
            <MotoScene throttle={throttle} motion={motion} active={active} lite={lite} />
            <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.3em] text-haze/60">
              EV-01 // drag to orbit
            </div>
            <div className="pointer-events-none absolute right-4 top-4 text-right">
              <div className="font-display text-4xl font-black tabular-nums text-white text-glow-teal" ref={speedEl}>0</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-teal">mph</div>
              <div className="mt-2 h-1 w-28 overflow-hidden rounded bg-white/10">
                <div ref={barEl} className="h-full w-0 bg-gradient-to-r from-teal via-purple to-pink" />
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-haze/60">0–60 in 3.8s · {MAX_MPH} top</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onPointerDown={press}
              onPointerUp={release}
              onPointerLeave={release}
              onPointerCancel={release}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && (e.preventDefault(), press())}
              onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && release()}
              onContextMenu={(e) => e.preventDefault()}
              className={`select-none rounded-full px-8 py-3 font-mono text-xs font-semibold uppercase tracking-[0.3em] transition-all duration-300 ${
                holding
                  ? 'scale-95 bg-teal text-void shadow-[0_0_60px_rgba(0,240,255,0.8)]'
                  : 'bg-gradient-to-r from-teal to-blue text-void shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_50px_rgba(0,240,255,0.7)]'
              }`}
              style={{ touchAction: 'none' }}
            >
              {holding ? 'Vrrrmmmm…' : 'Hold to throttle'}
            </button>
            <button
              onClick={() => setSound((s) => !s)}
              aria-pressed={sound}
              className="rounded-full border border-purple/40 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-haze hover:border-teal hover:text-teal"
            >
              sound: {sound ? 'on' : 'off'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
