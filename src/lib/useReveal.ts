'use client'

import { useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useMotion } from './motion'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Staggers every [data-reveal] child of the returned ref into view.
 * data-reveal="left" | "right" | "scale" | "" picks the entrance.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null)
  const { motion, ready } = useMotion()

  useGSAP(
    () => {
      if (!ready || !ref.current) return
      document.documentElement.classList.add('js-ready')
      const els = gsap.utils.toArray<HTMLElement>('[data-reveal]', ref.current)
      if (!motion) {
        gsap.set(els, { clearProps: 'all' })
        return
      }
      els.forEach((el) => {
        const kind = el.dataset.reveal
        const from: gsap.TweenVars = { opacity: 0, y: 40, filter: 'blur(8px)' }
        if (kind === 'left') Object.assign(from, { x: -60, y: 0 })
        if (kind === 'right') Object.assign(from, { x: 60, y: 0 })
        if (kind === 'scale') Object.assign(from, { scale: 0.9, y: 20 })
        gsap.fromTo(el, from, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.1,
          ease: 'expo.out',
          delay: Number(el.dataset.delay ?? 0),
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
    },
    { scope: ref, dependencies: [motion, ready], revertOnUpdate: true },
  )

  return ref
}
