// Throttle model for the Ride section's bike. Kept free of three.js so the page's HUD can use it too.

export const MAX_MPH = 80

/**
 * Peak acceleration in mph/s. Torque tapers with (v / MAX_MPH)^3, like an EV running out of
 * motor headroom; this value is tuned numerically so 0-60 mph takes 3.8 s (80 mph at ~9.6 s).
 */
const LAUNCH = 18.05

/**
 * Advance speed (mph) by dt seconds, with the throttle held or released. Integrates in fixed
 * substeps so slow frames still track wall-clock time (0-60 stays 3.8 s at any frame rate).
 */
export function stepSpeed(mph: number, held: boolean, dt: number) {
  let t = Math.min(dt, 0.5) // e.g. a backgrounded tab resuming
  while (t > 0) {
    const h = Math.min(t, 1 / 120)
    mph = step(mph, held, h)
    t -= h
  }
  return mph
}

function step(mph: number, held: boolean, dt: number) {
  if (held) return Math.min(MAX_MPH, mph + LAUNCH * (1 - (mph / MAX_MPH) ** 3) * dt)
  // Off throttle: regen braking plus drag, ~4.6 s from top speed to a stop
  return Math.max(0, mph - (12 + 0.15 * mph) * dt)
}
