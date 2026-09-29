'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type MotionCtx = {
  /** false when the visitor prefers reduced motion or toggled it off */
  motion: boolean
  toggleMotion: () => void
  overdrive: boolean
  setOverdrive: (v: boolean) => void
  ready: boolean
}

const Ctx = createContext<MotionCtx>({
  motion: true,
  toggleMotion: () => {},
  overdrive: false,
  setOverdrive: () => {},
  ready: false,
})

const KEY = 'tiffxt:motion'

export function MotionProvider({ children }: { children: ReactNode }) {
  const [motion, setMotion] = useState(true)
  const [overdrive, setOverdrive] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let stored: string | null = null
    try {
      stored = localStorage.getItem(KEY)
    } catch {}
    setMotion(stored ? stored === 'on' : !mq.matches)
    setReady(true)
    const onChange = () => {
      try {
        if (localStorage.getItem(KEY)) return
      } catch {}
      setMotion(!mq.matches)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off'
  }, [motion])

  useEffect(() => {
    document.documentElement.classList.toggle('overdrive', overdrive)
  }, [overdrive])

  const toggleMotion = useCallback(() => {
    setMotion((m) => {
      try {
        localStorage.setItem(KEY, m ? 'off' : 'on')
      } catch {}
      return !m
    })
  }, [])

  return (
    <Ctx.Provider value={{ motion, toggleMotion, overdrive, setOverdrive, ready }}>{children}</Ctx.Provider>
  )
}

export const useMotion = () => useContext(Ctx)

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const on = () => setMatches(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}
