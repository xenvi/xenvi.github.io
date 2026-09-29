// Deterministic procedural city layout, so every visitor sees the same skyline.

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Building = { x: number; z: number; w: number; d: number; h: number; row: number; side: -1 | 1 }

export const AVENUE_HALF = 11
export const CITY_START = 60
export const CITY_END = -640

export function makeCity(density = 1) {
  const rand = mulberry32(20260929)
  const near: Building[] = []
  const far: Building[] = []
  const step = 10 / density

  for (let z = CITY_START; z > CITY_END; z -= step) {
    for (const side of [-1, 1] as const) {
      let x = AVENUE_HALF + 2 + rand() * 2
      for (let row = 0; row < 4; row++) {
        const w = 5 + rand() * 7
        const d = 5 + rand() * (step - 5.5)
        const tall = rand() > 0.93
        const base = row === 0 ? 10 + rand() * 30 : 18 + rand() * (45 + row * 22)
        // Taper toward the far end so the sun can sit on the horizon
        const taper = z < -360 ? Math.max(0.28, 1 - (-360 - z) / 300) : 1
        const h = (tall ? 90 + rand() * 90 : base) * taper
        near.push({ x: side * (x + w / 2), z: z - rand() * 2, w, d, h, row, side })
        x += w + 1.5 + rand() * 3
      }
    }
  }

  // Distant skyline: fewer, taller, dimmer. Gives the scene parallax depth.
  for (let i = 0; i < 520 * density; i++) {
    const side = rand() > 0.5 ? 1 : -1
    const x = side * (75 + rand() * 260)
    const z = CITY_START - rand() * (CITY_START - CITY_END + 180)
    const w = 10 + rand() * 18
    let h = 50 + rand() * 170 * (rand() > 0.85 ? 1.6 : 1)
    if (z < -380 && Math.abs(x) < 170) h *= 0.3
    far.push({ x, z, w, d: 10 + rand() * 18, h, row: 9, side })
  }

  return { near, far }
}
