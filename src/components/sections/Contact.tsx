'use client'

import { useState, type FormEvent } from 'react'
import { links } from '@/lib/content'
import { useReveal } from '@/lib/useReveal'
import { SectionHeading } from './SectionHeading'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function Contact() {
  const ref = useReveal<HTMLElement>()
  const [status, setStatus] = useState<Status>('idle')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')
    try {
      const res = await fetch(links.formspree, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('sent')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" ref={ref} className="relative mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-44">
      <div className="grid gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading index="07" kicker="open channel" accent="teal" title={<>Let&apos;s build something <span className="chrome-text">loud.</span></>} />
          <p data-reveal className="max-w-md text-lg text-haze/85">
            Hiring, collaborating, or just want to talk data viz, design systems or motorcycles? My inbox is open.
          </p>
          <div data-reveal className="mt-10 flex flex-wrap gap-3">
            <a href={links.linkedin} target="_blank" rel="noreferrer" className="glass flex items-center gap-3 rounded-xl px-5 py-4 transition hover:border-teal/70 hover:shadow-[0_0_30px_rgba(0,240,255,0.25)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-teal" aria-hidden>
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
              </svg>
              <span className="font-mono text-sm text-white">LinkedIn</span>
            </a>
            <a href={links.github} target="_blank" rel="noreferrer" className="glass flex items-center gap-3 rounded-xl px-5 py-4 transition hover:border-pink/70 hover:shadow-[0_0_30px_rgba(255,46,151,0.25)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-pink" aria-hidden>
                <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57v-2c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3" />
              </svg>
              <span className="font-mono text-sm text-white">GitHub</span>
            </a>
          </div>
        </div>

        <form data-reveal="right" onSubmit={submit} className="glass corner-frame self-end rounded-2xl p-6 sm:p-8">
          <p className="mb-6 font-mono text-xs text-teal">
            <span className="text-pink">tiffany@neon</span>:~$ send --message
          </p>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-haze/70">your email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-purple/40 bg-void/60 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-haze/30 focus:border-teal focus:shadow-[0_0_0_3px_rgba(0,240,255,0.15)]"
              placeholder="you@company.com"
            />
          </label>
          <label className="mt-5 block">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-haze/70">message</span>
            <textarea
              name="message"
              required
              rows={5}
              className="mt-2 w-full resize-none rounded-lg border border-purple/40 bg-void/60 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-haze/30 focus:border-teal focus:shadow-[0_0_0_3px_rgba(0,240,255,0.15)]"
              placeholder="Hey Tiffany…"
            />
          </label>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-pink via-magenta to-purple py-3 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_0_30px_rgba(255,46,151,0.4)] transition hover:shadow-[0_0_50px_rgba(255,46,151,0.7)] disabled:opacity-60"
          >
            {status === 'sending' ? 'Transmitting…' : status === 'sent' ? 'Received ✓' : 'Transmit'}
          </button>
          <p className="mt-3 min-h-5 font-mono text-xs" role="status" aria-live="polite">
            {status === 'sent' && <span className="text-teal">Message received. I&apos;ll get back to you soon.</span>}
            {status === 'error' && <span className="text-pink">Signal lost. Try again, or reach me on LinkedIn.</span>}
          </p>
        </form>
      </div>
    </section>
  )
}
