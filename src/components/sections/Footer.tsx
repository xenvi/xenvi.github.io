export function Footer() {
  return (
    <footer className="relative border-t border-purple/20 bg-void/80 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[11px] text-haze/60 sm:flex-row">
        <p>© {new Date().getFullYear()} Tiffany · built with Next.js, Three.js, GSAP &amp; too much neon</p>
        <p className="tracking-[0.3em]" title="You know what to do">↑↑↓↓←→←→BA</p>
      </div>
    </footer>
  )
}
