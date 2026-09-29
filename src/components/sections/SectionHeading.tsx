export function SectionHeading({ index, kicker, title, accent = 'pink' }: { index: string; kicker: string; title: React.ReactNode; accent?: 'pink' | 'teal' }) {
  return (
    <div className="mb-12 sm:mb-16">
      <p data-reveal className={`mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.4em] ${accent === 'pink' ? 'text-pink' : 'text-teal'}`}>
        <span className="text-white/40">{index}</span>
        <span className={`h-px w-10 ${accent === 'pink' ? 'bg-pink' : 'bg-teal'}`} />
        {kicker}
      </p>
      <h2 data-reveal className="font-display text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
        {title}
      </h2>
    </div>
  )
}
