// Closed-form springs and camera helpers — every value is a pure function of time.

/** Spring presets: stiffness, damping (mass = 1). */
export const springs = {
  snappy: { stiffness: 420, damping: 32 },   // UI, small elements
  default: { stiffness: 170, damping: 22 },  // cards, labels
  gentle: { stiffness: 90, damping: 18 },    // big titles, camera
  heavy: { stiffness: 60, damping: 16 },     // large type, slow weight
  bouncy: { stiffness: 260, damping: 14 },   // playful pops (use rarely)
};

/**
 * Progress 0 → 1 of a damped spring released at t = 0 (t in seconds).
 * Returns 0 for t <= 0. May overshoot 1 for low damping.
 */
export function spring(t, cfg = springs.default) {
  if (t <= 0) return 0;
  const { stiffness: k, damping: c, mass: m = 1 } = typeof cfg === 'string' ? springs[cfg] : cfg;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
  }
  // critically / over damped
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

/**
 * A value that springs to new targets over time. keys: [[time, value], ...] sorted by time.
 * Each change adds its own spring, so any frame renders on its own (no state between frames).
 */
export function track(t, keys, cfg = springs.default) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [ti, vi] = keys[i];
    if (t <= ti) break;
    v += (vi - keys[i - 1][1]) * spring(t - ti, cfg);
  }
  return v;
}

/** Smootherstep 0..1 (zero velocity and acceleration at both ends) — for camera glides. */
export const smootherstep = p => { p = Math.min(1, Math.max(0, p)); return p * p * p * (p * (p * 6 - 15) + 10); };

/** Camera glide from a to b between t0 and t1 seconds. */
export const glide = (t, t0, t1, a, b) => a + (b - a) * smootherstep((t - t0) / (t1 - t0));

/**
 * Slow "creep" so a hold is never fully static: returns a scale factor that grows
 * ratePerSec/10 per second from the hold start (e.g. 0.06 → 0.6 % per second, a calm creep; 0.04–0.10 is typical).
 */
export const creep = (t, ratePerSec = 0.06) => 1 + Math.max(0, t) * ratePerSec / 10;

/** Impact shake: sign flips every frame, decays over `decay` seconds. Returns pixels. */
export function shake(t, start, { amp = 14, decay = 0.25, fps = 30 } = {}) {
  const dt = t - start;
  if (dt < 0 || dt > decay) return 0;
  const frame = Math.floor(dt * fps);
  return (frame % 2 ? -1 : 1) * amp * (1 - dt / decay);
}
