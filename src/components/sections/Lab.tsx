'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { quadtree, type Quadtree } from 'd3-quadtree'
import { scaleLinear } from 'd3-scale'
import { mulberry32 } from '../three/city/layout'
import { useReveal } from '@/lib/useReveal'
import { SectionHeading } from './SectionHeading'

type Secret = { name: string; fc: number; p: number; fact: string; emoji: string }

const SECRETS: Secret[] = [
  { name: 'MEOW1', fc: 3.4, p: 17.2, emoji: '🐱', fact: 'Spikes 11× in cats whose humans said "who\'s a good kitty". Also found in the dev who wrote this.' },
  { name: 'ZOOMIES', fc: 4.6, p: 11.5, emoji: '💨', fact: 'Spikes at 3am. Strongly linked to knocking things off desks and to hot-fixes pushed right before bed.' },
  { name: 'VROOM3', fc: -3.9, p: 15.8, emoji: '🏍️', fact: 'Electric variant: 0 emissions, 100% grin. Readings double on twisty mountain roads.' },
  { name: 'GG-EZ', fc: -2.6, p: 8.4, emoji: '🎮', fact: 'Associated with late-night ranked matches and the phrase "one more game".' },
  { name: 'BOOP4', fc: 1.7, p: 5.1, emoji: '🐾', fact: 'Activated by gentle nose contact. Side effects: purring, slow blinks, pure serotonin.' },
  { name: 'SHIPIT', fc: -1.9, p: 21.4, emoji: '🚀', fact: 'The strongest signal in the dataset. Triggered by green CI and a good code review.' },
]

const COUNTS = [10_000, 50_000, 250_000] as const
const PAD = { l: 48, r: 16, t: 16, b: 38 }
const X_DOMAIN: [number, number] = [-6, 6]
const Y_DOMAIN: [number, number] = [0, 24]

function makeData(n: number, seed: number) {
  const rand = mulberry32(seed)
  const normal = () => {
    let u = 0
    while (u === 0) u = rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
  }
  const fc = new Float32Array(n)
  const p = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const heavy = rand() < 0.07
    const f = normal() * (heavy ? 1.9 : 0.75)
    const y = Math.pow(Math.abs(f), 1.75) * (0.4 + rand() * 2.1) + -Math.log10(rand() + 1e-9) * 0.42
    fc[i] = Math.max(X_DOMAIN[0] + 0.05, Math.min(X_DOMAIN[1] - 0.05, f))
    // fold outliers back under the ceiling instead of piling them on it
    p[i] = y > Y_DOMAIN[1] - 0.5 ? Y_DOMAIN[1] - 0.5 - rand() * 6 : y
  }
  return { fc, p, n }
}

const pointName = (i: number) => {
  const pre = ['CYB', 'NEO', 'SYN', 'VLT', 'HOL', 'GLT', 'PXL', 'QNT']
  return `${pre[i % pre.length]}${((i * 7919) % 9973).toString().padStart(4, '0')}`
}

function hex(c: string) {
  const v = parseInt(c.slice(1), 16)
  // little-endian RGBA packed into a Uint32
  return (255 << 24) | ((v & 0xff) << 16) | (((v >> 8) & 0xff) << 8) | ((v >> 16) & 0xff)
}
const C_UP = hex('#ff2e97')
const C_DOWN = hex('#00f0ff')
const C_NS = (150 << 24) | (150 << 16) | (110 << 8) | 130

export function Lab() {
  const ref = useReveal<HTMLElement>()
  const wrap = useRef<HTMLDivElement>(null)
  const pointsCanvas = useRef<HTMLCanvasElement>(null)
  const overlayCanvas = useRef<HTMLCanvasElement>(null)
  const [count, setCount] = useState<(typeof COUNTS)[number]>(250_000)
  const [seed, setSeed] = useState(42)
  const [fcCut, setFcCut] = useState(1.5)
  const [pCut, setPCut] = useState(4)
  const [size, setSize] = useState({ w: 800, h: 480, dpr: 1 })
  const [view, setView] = useState({ k: 1, tx: 0, ty: 0 })
  const [hover, setHover] = useState<{ x: number; y: number; name: string; fc: number; p: number; secret?: Secret } | null>(null)
  const [found, setFound] = useState<string[]>([])
  const [fact, setFact] = useState<Secret | null>(null)
  const [renderMs, setRenderMs] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const tree = useRef<Quadtree<number> | null>(null)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null)
  // Wheel-zoom only once the plot is engaged, so scrolling past it never gets hijacked.
  const engaged = useRef(false)
  const [showZoomHint, setShowZoomHint] = useState(false)

  const data = useMemo(() => makeData(count, seed), [count, seed])
  const plotW = size.w - PAD.l - PAD.r
  const plotH = size.h - PAD.t - PAD.b
  const sx = useMemo(() => scaleLinear().domain(X_DOMAIN).range([0, plotW]), [plotW])
  const sy = useMemo(() => scaleLinear().domain(Y_DOMAIN).range([plotH, 0]), [plotH])

  const stats = useMemo(() => {
    let up = 0
    let down = 0
    for (let i = 0; i < data.n; i++) {
      if (data.p[i] < pCut) continue
      if (data.fc[i] >= fcCut) up++
      else if (data.fc[i] <= -fcCut) down++
    }
    return { up, down }
  }, [data, fcCut, pCut])

  // Size to container
  useEffect(() => {
    const el = wrap.current!
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      setSize({ w, h: w < 640 ? 380 : 500, dpr: Math.min(2, window.devicePixelRatio || 1) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Spatial index in un-zoomed plot pixels; hover divides the pointer by the zoom.
  useEffect(() => {
    tree.current = null
    const id = setTimeout(() => {
      const idx = new Uint32Array(data.n).map((_, i) => i)
      tree.current = quadtree<number>()
        .x((i) => sx(data.fc[i]))
        .y((i) => sy(data.p[i]))
        .addAll(Array.from(idx))
    }, 60)
    return () => clearTimeout(id)
  }, [data, sx, sy])

  // Points layer: written straight into an ImageData buffer, one putImageData per frame.
  useEffect(() => {
    const c = pointsCanvas.current!
    const { dpr } = size
    const W = Math.round(plotW * dpr)
    const H = Math.round(plotH * dpr)
    c.width = W
    c.height = H
    c.style.width = `${plotW}px`
    c.style.height = `${plotH}px`
    const ctx = c.getContext('2d')!
    const raf = requestAnimationFrame(() => {
      const t0 = performance.now()
      const img = ctx.createImageData(W, H)
      const buf = new Uint32Array(img.data.buffer)
      const r = Math.max(1, Math.round(1.1 * dpr))
      const ax = (plotW / (X_DOMAIN[1] - X_DOMAIN[0])) * view.k * dpr
      const bx = (-X_DOMAIN[0] * plotW / (X_DOMAIN[1] - X_DOMAIN[0]) * view.k + view.tx) * dpr
      const ay = (-plotH / (Y_DOMAIN[1] - Y_DOMAIN[0])) * view.k * dpr
      const by = (plotH * view.k + view.ty) * dpr
      const plot = (pass: number) => {
        for (let i = 0; i < data.n; i++) {
          const f = data.fc[i]
          const pv = data.p[i]
          const sig = pv >= pCut && (f >= fcCut || f <= -fcCut)
          if ((pass === 0) === sig) continue
          const x = (f * ax + bx) | 0
          const y = (pv * ay + by) | 0
          if (x < 0 || y < 0 || x >= W - r || y >= H - r) continue
          const col = !sig ? C_NS : f > 0 ? C_UP : C_DOWN
          for (let dy = 0; dy < r; dy++) {
            const row = (y + dy) * W + x
            for (let dx = 0; dx < r; dx++) buf[row + dx] = col
          }
        }
      }
      plot(0)
      plot(1)
      ctx.putImageData(img, 0, 0)
      setRenderMs(performance.now() - t0)
    })
    return () => cancelAnimationFrame(raf)
  }, [data, view, fcCut, pCut, size, plotW, plotH])

  // Overlay: axes, thresholds, secret-signal rings, hover.
  useEffect(() => {
    const c = overlayCanvas.current!
    const { w, h, dpr } = size
    c.width = w * dpr
    c.height = h * dpr
    c.style.width = `${w}px`
    c.style.height = `${h}px`
    const ctx = c.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const X = (v: number) => PAD.l + sx(v) * view.k + view.tx
    const Y = (v: number) => PAD.t + sy(v) * view.k + view.ty

    ctx.font = '10px ui-monospace, monospace'
    ctx.fillStyle = 'rgba(201,184,255,0.7)'
    ctx.strokeStyle = 'rgba(157,77,255,0.18)'
    ctx.lineWidth = 1
    ctx.save()
    ctx.beginPath()
    ctx.rect(PAD.l, PAD.t, plotW, plotH)
    ctx.clip()
    for (let v = -6; v <= 6; v += 1) {
      ctx.beginPath()
      ctx.moveTo(X(v), PAD.t)
      ctx.lineTo(X(v), PAD.t + plotH)
      ctx.stroke()
    }
    for (let v = 0; v <= 24; v += 4) {
      ctx.beginPath()
      ctx.moveTo(PAD.l, Y(v))
      ctx.lineTo(PAD.l + plotW, Y(v))
      ctx.stroke()
    }
    // thresholds
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ;[fcCut, -fcCut].forEach((v) => {
      ctx.beginPath()
      ctx.moveTo(X(v), PAD.t)
      ctx.lineTo(X(v), PAD.t + plotH)
      ctx.stroke()
    })
    ctx.beginPath()
    ctx.moveTo(PAD.l, Y(pCut))
    ctx.lineTo(PAD.l + plotW, Y(pCut))
    ctx.stroke()
    ctx.setLineDash([])

    // secret signals: faint shimmer for the curious
    SECRETS.forEach((s) => {
      const x = X(s.fc)
      const y = Y(s.p)
      const isFound = found.includes(s.name)
      ctx.beginPath()
      ctx.arc(x, y, isFound ? 6 : 3.5, 0, Math.PI * 2)
      ctx.fillStyle = isFound ? '#ffffff' : 'rgba(255,220,120,0.95)'
      ctx.shadowColor = isFound ? '#00f0ff' : '#ffb347'
      ctx.shadowBlur = isFound ? 14 : 8
      ctx.fill()
      ctx.shadowBlur = 0
      if (isFound) {
        ctx.fillStyle = '#fff'
        ctx.font = '600 11px ui-monospace, monospace'
        ctx.fillText(`${s.emoji} ${s.name}`, x + 10, y - 8)
        ctx.font = '10px ui-monospace, monospace'
      }
      if (hint === s.name) {
        ctx.strokeStyle = '#ffb347'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, 18, 0, Math.PI * 2)
        ctx.stroke()
        ctx.lineWidth = 1
      }
    })

    if (hover) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(hover.x, hover.y, 6, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()

    // axes labels
    ctx.fillStyle = 'rgba(201,184,255,0.75)'
    ctx.textAlign = 'center'
    for (let v = -6; v <= 6; v += 2) {
      const x = X(v)
      if (x >= PAD.l && x <= PAD.l + plotW) ctx.fillText(String(v), x, h - PAD.b + 16)
    }
    ctx.fillText('effect  (laser pointer vs. none)', PAD.l + plotW / 2, h - 6)
    ctx.textAlign = 'right'
    for (let v = 0; v <= 24; v += 4) {
      const y = Y(v)
      if (y >= PAD.t && y <= PAD.t + plotH) ctx.fillText(String(v), PAD.l - 8, y + 3)
    }
    ctx.save()
    ctx.translate(12, PAD.t + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('significance', 0, 0)
    ctx.restore()
  }, [size, view, sx, sy, fcCut, pCut, found, hover, hint, plotW, plotH])

  const pick = useCallback(
    (mx: number, my: number) => {
      const px = mx - PAD.l
      const py = my - PAD.t
      if (px < 0 || py < 0 || px > plotW || py > plotH) return null
      const bx = (px - view.tx) / view.k
      const by = (py - view.ty) / view.k
      // secrets win ties
      for (const s of SECRETS) {
        if (Math.hypot(sx(s.fc) - bx, sy(s.p) - by) * view.k < 12) {
          return { x: PAD.l + sx(s.fc) * view.k + view.tx, y: PAD.t + sy(s.p) * view.k + view.ty, name: s.name, fc: s.fc, p: s.p, secret: s }
        }
      }
      const i = tree.current?.find(bx, by, 8 / view.k)
      if (i === undefined) return null
      return {
        x: PAD.l + sx(data.fc[i]) * view.k + view.tx,
        y: PAD.t + sy(data.p[i]) * view.k + view.ty,
        name: pointName(i),
        fc: data.fc[i],
        p: data.p[i],
      }
    },
    [data, sx, sy, view, plotW, plotH],
  )

  const local = (e: { clientX: number; clientY: number }) => {
    const r = overlayCanvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const zoomAt = useCallback(
    (mx: number, my: number, factor: number) => {
      setView((v) => {
        const k = Math.min(40, Math.max(1, v.k * factor))
        if (k === 1) return { k: 1, tx: 0, ty: 0 }
        const px = mx - PAD.l
        const py = my - PAD.t
        const tx = px - ((px - v.tx) / v.k) * k
        const ty = py - ((py - v.ty) / v.k) * k
        return { k, tx, ty }
      })
    },
    [],
  )

  // Native, non-passive wheel listener so the page doesn't scroll while zooming
  useEffect(() => {
    const c = overlayCanvas.current!
    const onWheel = (e: WheelEvent) => {
      if (!engaged.current && !e.ctrlKey && !e.metaKey) {
        setShowZoomHint(true)
        return
      }
      e.preventDefault()
      e.stopPropagation()
      const { x, y } = local(e)
      zoomAt(x, y, Math.exp(-e.deltaY * 0.0022))
    }
    c.addEventListener('wheel', onWheel, { passive: false })
    return () => c.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const discover = (s: Secret) => {
    setFact(s)
    setHint(null)
    setFound((f) => (f.includes(s.name) ? f : [...f, s.name]))
  }

  const nextHint = () => {
    const s = SECRETS.find((x) => !found.includes(x.name))
    if (!s) return
    setHint(s.name)
    setView({ k: 1, tx: 0, ty: 0 })
    setTimeout(() => setHint((h) => (h === s.name ? null : h)), 3500)
  }

  const allFound = found.length === SECRETS.length

  return (
    <section id="lab" ref={ref} className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-44">
      <SectionHeading index="03" kicker="the lab" title={<>A quarter-million points. <span className="chrome-text">Zero lag.</span></>} />

      <div className="grid gap-10 lg:grid-cols-[1fr_2.1fr]">
        <div data-reveal="left" className="space-y-6">
          <p className="text-lg text-haze">
            I build data-heavy visualizations with D3 and Plotly: volcano, violin, dot and scatter plots that stay smooth at 250,000+
            points, with performance safeguards on both the frontend and the backend.
          </p>
          <p className="text-haze/80">
            So here&apos;s a very serious study: <span className="text-pink">The Laser Pointer Report</span>. A quarter-million cat
            reactions, laser pointer versus no laser pointer. Somewhere in the data, six secret signals are hiding.{' '}
            <span className="text-white">Find them.</span>
          </p>

          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-haze/70">
              secret signals · {found.length}/{SECRETS.length}
            </p>
            <div className="flex flex-wrap gap-2">
              {SECRETS.map((s) => {
                const isFound = found.includes(s.name)
                return (
                  <button
                    key={s.name}
                    onClick={() => isFound && setFact(s)}
                    disabled={!isFound}
                    className={`rounded-md border px-2.5 py-1 font-mono text-xs transition ${
                      isFound ? 'border-teal/60 bg-teal/10 text-white hover:bg-teal/20' : 'border-white/10 text-white/30'
                    }`}
                  >
                    {isFound ? `${s.emoji} ${s.name}` : '??????'}
                  </button>
                )
              })}
            </div>
            {!allFound ? (
              <button onClick={nextHint} className="mt-3 font-mono text-xs text-amber-300/80 underline decoration-dotted underline-offset-4 hover:text-amber-200">
                psst, need a hint?
              </button>
            ) : (
              <p className="mt-3 font-mono text-xs text-teal">★ Achievement: Certified Signal Hunter</p>
            )}
          </div>
        </div>

        <div data-reveal="right" className="glass corner-frame rounded-2xl p-3 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex overflow-hidden rounded-lg border border-purple/40" role="group" aria-label="Number of points">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  aria-pressed={count === c}
                  className={`px-3 py-1.5 font-mono text-xs transition ${count === c ? 'bg-pink text-void' : 'text-haze hover:bg-white/5'}`}
                >
                  {c >= 1000 ? `${c / 1000}k` : c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="rounded bg-pink/15 px-2 py-1 text-pink">▲ {stats.up.toLocaleString()}</span>
              <span className="rounded bg-teal/15 px-2 py-1 text-teal">▼ {stats.down.toLocaleString()}</span>
              <span className="rounded bg-white/5 px-2 py-1 text-haze/80" title="Time to rasterize every point">{renderMs.toFixed(1)} ms</span>
            </div>
          </div>

          <div ref={wrap} className="relative w-full select-none" style={{ height: size.h }}>
            <div className="absolute rounded-md bg-void/70" style={{ left: PAD.l, top: PAD.t, width: plotW, height: plotH }} />
            <canvas ref={pointsCanvas} className="absolute" style={{ left: PAD.l, top: PAD.t }} aria-hidden />
            <canvas
              ref={overlayCanvas}
              className="absolute inset-0 cursor-crosshair"
              style={{ touchAction: 'pan-y' }}
              role="img"
              aria-label={`Volcano plot of ${count.toLocaleString()} simulated cat reactions. ${stats.up} strong positive and ${stats.down} strong negative at the current thresholds.`}
              onPointerDown={(e) => {
                if (e.pointerType !== 'mouse') return
                engaged.current = true
                setShowZoomHint(false)
                drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false }
              }}
              onPointerMove={(e) => {
                const d = drag.current
                if (d) {
                  const dx = e.clientX - d.x
                  const dy = e.clientY - d.y
                  if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
                  if (d.moved && view.k > 1) {
                    setView((v) => ({ ...v, tx: d.tx + dx, ty: d.ty + dy }))
                    return
                  }
                }
                const { x, y } = local(e)
                setHover(pick(x, y))
              }}
              onPointerUp={(e) => {
                const d = drag.current
                drag.current = null
                if (d?.moved) return
                const { x, y } = local(e)
                const h = pick(x, y)
                setHover(h)
                if (h?.secret) discover(h.secret)
              }}
              onPointerLeave={() => {
                drag.current = null
                engaged.current = false
                setShowZoomHint(false)
                setHover(null)
              }}
              onDoubleClick={() => setView({ k: 1, tx: 0, ty: 0 })}
            />
            {showZoomHint && (
              <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full border border-purple/40 bg-void/90 px-3 py-1 font-mono text-[10px] text-haze">
                click the plot (or hold ⌘/Ctrl) to zoom with scroll
              </div>
            )}
            {hover && (
              <div
                className="pointer-events-none absolute z-10 rounded-md border border-teal/50 bg-void/95 px-3 py-2 font-mono text-[11px] text-white shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                style={{ left: Math.min(hover.x + 14, size.w - 170), top: Math.max(0, hover.y - 58) }}
              >
                <div className={hover.secret ? 'text-amber-300' : 'text-teal'}>
                  {hover.secret ? `${hover.secret.emoji} ${hover.name}` : hover.name}
                </div>
                <div className="text-haze/80">effect {hover.fc.toFixed(2)} · signal {hover.p.toFixed(2)}</div>
                {hover.secret && !found.includes(hover.name) && <div className="text-amber-300/80">click to decode!</div>}
              </div>
            )}
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              {[
                { l: '+', a: () => zoomAt(PAD.l + plotW / 2, PAD.t + plotH / 2, 1.6), n: 'Zoom in' },
                { l: '−', a: () => zoomAt(PAD.l + plotW / 2, PAD.t + plotH / 2, 1 / 1.6), n: 'Zoom out' },
                { l: '⟲', a: () => setView({ k: 1, tx: 0, ty: 0 }), n: 'Reset zoom' },
              ].map((b) => (
                <button key={b.n} onClick={b.a} aria-label={b.n} className="h-7 w-7 rounded border border-purple/40 bg-void/80 font-mono text-sm text-haze hover:border-teal hover:text-teal">
                  {b.l}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block font-mono text-[11px] text-haze/80">
              |effect| ≥ <span className="text-white">{fcCut.toFixed(1)}</span>
              <input type="range" min={0.5} max={4} step={0.1} value={fcCut} onChange={(e) => setFcCut(Number(e.target.value))} className="mt-2 w-full accent-pink" />
            </label>
            <label className="block font-mono text-[11px] text-haze/80">
              significance ≥ <span className="text-white">{pCut.toFixed(1)}</span>
              <input type="range" min={1.3} max={14} step={0.1} value={pCut} onChange={(e) => setPCut(Number(e.target.value))} className="mt-2 w-full accent-teal" />
            </label>
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="rounded-lg border border-pink/50 px-4 py-2 font-mono text-xs uppercase tracking-widest text-pink transition hover:bg-pink hover:text-void"
            >
              Re-run experiment
            </button>
          </div>
          <p className="mt-3 font-mono text-[10px] text-haze/50">click + scroll to zoom · drag to pan · double-click to reset · data is simulated, cats are real</p>
        </div>
      </div>

      {fact && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-void/70 p-4 backdrop-blur-sm" onClick={() => setFact(null)} role="dialog" aria-modal aria-label={`Secret signal ${fact.name}`}>
          <div className="glass corner-frame max-w-md rounded-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-6xl">{fact.emoji}</div>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-amber-300">signal decoded</p>
            <h3 className="mt-2 font-display text-3xl font-black text-white">{fact.name}</h3>
            <p className="mt-4 text-haze">{fact.fact}</p>
            <p className="mt-4 font-mono text-[11px] text-haze/60">effect {fact.fc} · signal {fact.p}</p>
            <button autoFocus onClick={() => setFact(null)} className="mt-6 rounded-full border border-teal/60 px-6 py-2 font-mono text-xs uppercase tracking-widest text-teal hover:bg-teal/10">
              {found.length === SECRETS.length ? 'All six! Nice.' : `Keep hunting (${found.length}/${SECRETS.length})`}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
