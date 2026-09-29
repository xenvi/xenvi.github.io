'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMotion } from '@/lib/motion'
import { scrollToId } from '../SmoothScroll'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const roles = ['Software Engineer', 'Frontend Architect', 'Data-Viz Wrangler', 'Design-System Builder', 'Electric Rider']

function useTypewriter(words: string[], enabled: boolean) {
  const [text, setText] = useState(words[0])
  useEffect(() => {
    if (!enabled) {
      setText(words[0])
      return
    }
    let w = 0
    let i = words[0].length
    let deleting = true
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      const word = words[w]
      if (deleting) {
        i--
        if (i <= 0) {
          deleting = false
          w = (w + 1) % words.length
        }
      } else {
        i++
        if (i >= words[w].length) {
          deleting = true
          setText(words[w])
          timer = setTimeout(step, 2200)
          return
        }
      }
      setText((deleting ? word : words[w]).slice(0, Math.max(0, i)))
      timer = setTimeout(step, deleting ? 35 : 70)
    }
    timer = setTimeout(step, 2600)
    return () => clearTimeout(timer)
  }, [words, enabled])
  return text
}

export function Hero({ booted }: { booted: boolean }) {
  const { motion, ready } = useMotion()
  const root = useRef<HTMLElement>(null)
  const role = useTypewriter(roles, motion && booted)

  useGSAP(
    () => {
      if (!ready || !booted) return
      if (!motion) {
        gsap.set('.hero-in', { clearProps: 'all' })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo('.hero-letter', { yPercent: 120, opacity: 0, rotateX: -80 }, { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.4, stagger: 0.07 })
        .fromTo('.hero-in', { y: 30, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.12 }, '-=0.9')

      gsap.to('.hero-content', {
        yPercent: -35,
        opacity: 0,
        scale: 0.94,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: root, dependencies: [motion, ready, booted], revertOnUpdate: true },
  )

  const name = 'TIFFANY'

  return (
    <section id="top" ref={root} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,rgba(5,1,13,0.78),rgba(5,1,13,0.35)_60%,transparent_85%)]" />
      <div className="hero-content relative z-10 flex flex-col items-center text-center">
        <p className="hero-in mb-6 font-mono text-[11px] uppercase tracking-[0.5em] text-teal text-glow-teal sm:text-xs">
          // hello world, I&apos;m
        </p>
        <h1 className="neon-title glitch font-display text-[18vw] leading-[0.85] font-black tracking-[0.06em] sm:text-[8.5rem] lg:text-[11rem]" data-text={name} style={{ perspective: 800 }}>
          <span className="sr-only">{name}</span>
          <span aria-hidden className="inline-flex pb-[0.08em]">
            {name.split('').map((ch, i) => (
              <span key={i} className="hero-letter inline-block" style={{ transformOrigin: '50% 100%' }}>
                {ch}
              </span>
            ))}
          </span>
        </h1>
        <p className="hero-in mt-6 h-8 font-mono text-base text-white/90 sm:text-xl" aria-live="off">
          <span className="text-pink">&gt;</span> <span className="caret">{role}</span>
        </p>
        <p className="hero-in mt-5 max-w-xl text-balance text-sm text-haze/90 sm:text-base">
          Senior engineer, 6+ years. I build interfaces that feel alive, systems that scale to a quarter-million data points, and
          the design systems that hold it all together.
        </p>
        <div className="hero-in mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => scrollToId('about')}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-pink via-magenta to-purple px-7 py-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_0_30px_rgba(255,46,151,0.5)] transition hover:shadow-[0_0_50px_rgba(255,46,151,0.8)]"
          >
            <span className="relative z-10">Jack in</span>
            <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-700 group-hover:translate-x-full" />
          </button>
          <button
            onClick={() => scrollToId('contact')}
            className="rounded-full border border-teal/60 px-7 py-3 font-mono text-xs uppercase tracking-[0.25em] text-teal transition hover:bg-teal/10 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]"
          >
            Say hi
          </button>
        </div>
      </div>

      <div className="hero-in absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-haze/70">
        scroll to ride
        <span className="relative block h-10 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-4 animate-[scrollcue_1.8s_ease-in-out_infinite] bg-teal" />
        </span>
      </div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(250%)}}`}</style>
    </section>
  )
}
