'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMotion } from '@/lib/motion'
import { scrollState } from '@/lib/scroll'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll() {
  const { motion, ready } = useMotion()

  // Pointer + native scroll tracking always runs; it's cheap and feeds the 3D scene.
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scrollState.progress = max > 0 ? window.scrollY / max : 0
      scrollState.velocity = window.scrollY - last
      last = window.scrollY
    }
    const onPointer = (e: PointerEvent) => {
      scrollState.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      scrollState.pointerY = (e.clientY / window.innerHeight) * 2 - 1
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  useEffect(() => {
    if (!ready || !motion) return
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      delete (window as unknown as { __lenis?: Lenis }).__lenis
    }
  }, [motion, ready])

  return null
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis
  if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.6 })
  else el.scrollIntoView({ behavior: 'auto', block: 'start' })
}
