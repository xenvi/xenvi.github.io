'use client'

import { useCallback, useRef, useState } from 'react'
import { MotionProvider } from '@/lib/motion'
import { SmoothScroll } from './SmoothScroll'
import { Nav } from './Nav'
import { CityBackground } from './three/city/CityBackground'
import { Hero } from './sections/Hero'
import { About } from './sections/About'
import { Skills } from './sections/Skills'
import { Lab } from './sections/Lab'
import { Ride } from './sections/Ride'
import { Archive } from './sections/Archive'
import { OffClock } from './sections/OffClock'
import { Contact } from './sections/Contact'
import { Footer } from './sections/Footer'
import { BootSequence } from './extras/BootSequence'
import { Cursor } from './extras/Cursor'
import { CyberCat } from './extras/CyberCat'
import { Konami, type KonamiHandle } from './extras/Konami'
import { Toaster } from './extras/Toaster'

export function Experience() {
  const [booted, setBooted] = useState(false)
  const konami = useRef<KonamiHandle>(null)
  const taps = useRef<number[]>([])

  const onLogoTap = useCallback(() => {
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < 2500), now]
    if (taps.current.length >= 7) {
      taps.current = []
      konami.current?.trigger()
    }
  }, [])

  return (
    <MotionProvider>
      <BootSequence onDone={() => setBooted(true)} />
      <SmoothScroll />
      <CityBackground />
      <Nav onLogoTap={onLogoTap} />
      <main>
        <Hero booted={booted} />
        <About />
        <Skills />
        <Lab />
        <Ride />
        <Archive />
        <OffClock />
        <Contact />
      </main>
      <Footer />
      <CyberCat />
      <Cursor />
      <Konami ref={konami} />
      <Toaster />
    </MotionProvider>
  )
}
