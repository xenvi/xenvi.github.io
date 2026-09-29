// Shared, mutable scroll state. Written by SmoothScroll, read every frame by the WebGL scenes,
// so it deliberately lives outside React to avoid re-rendering on scroll.
export const scrollState = {
  /** 0 → 1 across the whole page */
  progress: 0,
  /** px per frame, signed */
  velocity: 0,
  /** normalized pointer, -1 → 1 */
  pointerX: 0,
  pointerY: 0,
}

export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`
