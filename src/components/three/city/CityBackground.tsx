'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useMediaQuery, useMotion } from '@/lib/motion'
import { CityFallback } from './CityFallback'

const CityCanvas = dynamic(() => import('./CityScene'), { ssr: false })

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function CityBackground() {
  const { motion, ready, overdrive } = useMotion()
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [loaded, setLoaded] = useState(false)
  const lite = useMediaQuery('(max-width: 768px), (pointer: coarse)')
  const shade = useRef<HTMLDivElement>(null)

  useEffect(() => setWebgl(hasWebGL()), [])

  // Dim the city once the visitor leaves the hero so text stays readable.
  useEffect(() => {
    const onScroll = () => {
      const t = Math.min(1, Math.max(0, (window.scrollY - window.innerHeight * 0.35) / (window.innerHeight * 0.8)))
      if (shade.current) shade.current.style.opacity = String(t * 0.62)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const use3D = ready && motion && webgl

  return (
    <div className="city-layer pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div className="absolute inset-0 transition-opacity duration-[1500ms]" style={{ opacity: use3D && loaded ? 0 : 1 }}>
        <CityFallback animate={ready && motion} />
      </div>
      {use3D && (
        <div className="absolute inset-0 transition-opacity duration-[1800ms]" style={{ opacity: loaded ? 1 : 0 }}>
          <CityCanvas lite={lite} overdrive={overdrive} onReady={() => setLoaded(true)} />
        </div>
      )}
      <div ref={shade} className="absolute inset-0 bg-void" style={{ opacity: 0 }} />
      <div className="scanlines absolute inset-0 opacity-30" />
    </div>
  )
}
