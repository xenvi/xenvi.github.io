'use client'

import { useEffect, useRef, useState } from 'react'
import { useMotion } from '@/lib/motion'

export function Cursor() {
  const { motion } = useMotion()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [fine, setFine] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    setFine(mq.matches)
    const on = () => setFine(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const enabled = fine && motion

  useEffect(() => {
    document.documentElement.dataset.cursor = enabled ? 'on' : 'off'
    if (!enabled) return
    const pos = { x: -100, y: -100 }
    const lag = { x: -100, y: -100 }
    let hovering = false
    let down = false
    let raf = 0
    const move = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const t = e.target as HTMLElement
      hovering = !!t.closest('a, button, [role="button"], input, textarea, label, canvas')
    }
    const onDown = () => (down = true)
    const onUp = () => (down = false)
    const tick = () => {
      lag.x += (pos.x - lag.x) * 0.18
      lag.y += (pos.y - lag.y) * 0.18
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`
      if (ring.current) {
        const s = (hovering ? 1.8 : 1) * (down ? 0.75 : 1)
        ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0) translate(-50%, -50%) scale(${s})`
        ring.current.style.borderColor = hovering ? '#ff2e97' : 'rgba(0,240,255,0.8)'
        ring.current.style.backgroundColor = hovering ? 'rgba(255,46,151,0.12)' : 'transparent'
      }
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <>
      <div ref={ring} className="pointer-events-none fixed left-0 top-0 z-[90] h-9 w-9 rounded-full border transition-[background-color,border-color] duration-200" style={{ boxShadow: '0 0 12px rgba(0,240,255,0.5)' }} aria-hidden />
      <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[91] h-1.5 w-1.5 rounded-full bg-white" style={{ boxShadow: '0 0 8px #fff, 0 0 16px #ff2e97' }} aria-hidden />
    </>
  )
}
