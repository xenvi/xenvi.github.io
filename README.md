# tiffxt.github.io

Tiffany's portfolio: a scroll-driven cyberpunk city, a 250k-point data-viz playground, and an electric motorcycle.

**Stack:** Next.js 16 (static export) · React 19 · TypeScript · Tailwind CSS 4 · Three.js via React Three Fiber + drei + postprocessing · GSAP ScrollTrigger · Lenis · d3-scale / d3-quadtree

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out
npm run typecheck
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The base path comes from `actions/configure-pages`, so the site works as a project site
(`xenvi.github.io/tiffxt.github.io/`), a user site, or behind a custom domain without code changes.

## Map

| Where | What |
| --- | --- |
| `src/components/three/city/` | Procedural WebGL city (instanced buildings, custom window shader, signs, traffic, rain, bloom) + SVG fallback |
| `src/components/three/moto/` | Procedural 3D electric motorcycle with hold-to-throttle |
| `src/components/sections/Lab.tsx` | The Purr-teome: volcano plot rendered into an ImageData buffer, quadtree hover, hidden genes |
| `src/components/extras/` | Boot sequence, custom cursor, cyber-cat, Konami code, achievement toasts |
| `src/lib/content.ts` | All copy: skills, strengths, projects, links |
| `src/lib/motion.tsx` | Motion toggle (respects `prefers-reduced-motion`, persisted) + overdrive state |

## Accessibility & performance

- `prefers-reduced-motion` is honored by default, and the **motion** toggle in the nav overrides it. With motion off you get a static SVG skyline, no smooth scroll, no custom cursor, and no boot sequence.
- Mobile / coarse pointers get a lighter city (fewer buildings, no post-processing, lower DPR).
- The bike canvas only renders while on screen.

## Easter eggs

↑↑↓↓←→←→BA · tap the logo 7× · pet the cat 10× · find all six secret genes in the Lab · shift + double-click the cat to shoo it
