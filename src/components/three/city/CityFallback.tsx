'use client'

import { useEffect, useMemo, useRef } from 'react'
import { mulberry32 } from './layout'

/**
 * Layered SVG skyline. Shown while WebGL loads, when WebGL is unavailable,
 * and (frozen, no parallax) when motion is off.
 */
const LAYERS = [
  { seed: 1, base: 0.42, amp: 0.3, w: [30, 70], fill: '#1a0838', win: '#9d4dff', speed: 0.05, opacity: 0.8 },
  { seed: 2, base: 0.55, amp: 0.3, w: [40, 90], fill: '#12052a', win: '#00f0ff', speed: 0.12, opacity: 0.9 },
  { seed: 3, base: 0.7, amp: 0.25, w: [50, 120], fill: '#0a0318', win: '#ff2e97', speed: 0.22, opacity: 1 },
]

function skyline(seed: number, base: number, amp: number, [minW, maxW]: number[], win: string) {
  const rand = mulberry32(seed)
  const W = 1600
  const H = 900
  const rects: { x: number; y: number; w: number; h: number }[] = []
  const windows: { x: number; y: number }[] = []
  let x = -20
  while (x < W + 20) {
    const w = minW + rand() * (maxW - minW)
    const h = H * (1 - base) + rand() * H * amp
    const y = H - h
    rects.push({ x, y, w, h })
    for (let wy = y + 14; wy < H - 10; wy += 16)
      for (let wx = x + 6; wx < x + w - 8; wx += 11) if (rand() > 0.78) windows.push({ x: wx, y: wy })
    x += w + rand() * 6
  }
  return { rects, windows, win }
}

export function CityFallback({ animate }: { animate: boolean }) {
  const layers = useMemo(() => LAYERS.map((l) => ({ ...l, ...skyline(l.seed, l.base, l.amp, l.w, l.win) })), [])
  const refs = useRef<(SVGGElement | null)[]>([])

  useEffect(() => {
    if (!animate) {
      refs.current.forEach((g) => g?.setAttribute('transform', ''))
      return
    }
    let raf = 0
    const tick = () => {
      const y = window.scrollY
      refs.current.forEach((g, i) => g?.setAttribute('transform', `translate(0 ${y * LAYERS[i].speed * 0.5})`))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animate])

  return (
    <svg className="h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="fb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#030010" />
          <stop offset="0.55" stopColor="#1c0540" />
          <stop offset="0.8" stopColor="#6a0f5c" />
          <stop offset="1" stopColor="#b01a6b" />
        </linearGradient>
        <linearGradient id="fb-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd35a" />
          <stop offset="1" stopColor="#ff1a8c" />
        </linearGradient>
        <mask id="fb-slats">
          <rect width="1600" height="900" fill="white" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="0" y={440 + i * 18} width="1600" height={2 + i * 1.6} fill="black" />
          ))}
        </mask>
      </defs>
      <rect width="1600" height="900" fill="url(#fb-sky)" />
      <circle cx="800" cy="470" r="210" fill="url(#fb-sun)" mask="url(#fb-slats)" opacity="0.95" />
      {layers.map((l, i) => (
        <g key={i} ref={(el) => void (refs.current[i] = el)} opacity={l.opacity}>
          {l.rects.map((r, j) => (
            <rect key={j} x={r.x} y={r.y} width={r.w} height={r.h + 200} fill={l.fill} />
          ))}
          {l.windows.map((w, j) => (
            <rect key={`w${j}`} x={w.x} y={w.y} width="5" height="7" fill={l.win} opacity={0.75} />
          ))}
        </g>
      ))}
      <rect y="860" width="1600" height="40" fill="#05010d" />
      <rect y="858" width="1600" height="2" fill="#00f0ff" opacity="0.8" />
    </svg>
  )
}
