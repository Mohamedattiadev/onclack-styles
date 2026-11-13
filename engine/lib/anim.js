// Small, time-pure animation helpers. All functions take time in seconds.

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, p) => a + (b - a) * p;
/** 0 → 1 as t goes from start to end (clamped). */
export const progress = (t, start, end) => (end <= start ? (t >= end ? 1 : 0) : clamp((t - start) / (end - start)));

export const ease = {
  linear: p => p,
  inQuad: p => p * p,
  outQuad: p => 1 - (1 - p) * (1 - p),
  inOutQuad: p => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
  inCubic: p => p ** 3,
  outCubic: p => 1 - (1 - p) ** 3,
  inOutCubic: p => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  outQuart: p => 1 - (1 - p) ** 4,
  inOutSine: p => -(Math.cos(Math.PI * p) - 1) / 2,
  outExpo: p => (p === 1 ? 1 : 1 - 2 ** (-10 * p)),
  inOutExpo: p => (p === 0 ? 0 : p === 1 ? 1 : p < 0.5 ? 2 ** (20 * p - 10) / 2 : (2 - 2 ** (-20 * p + 10)) / 2),
  outBack: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2; },
};

/** Value moving from `from` to `to` between start and end seconds. */
export const tween = (t, start, end, from, to, easing = ease.inOutCubic) =>
  lerp(from, to, easing(progress(t, start, end)));

/** Interpolate numeric keyframes: [[time, value], ...]. */
export function keyframes(t, frames, easing = ease.inOutCubic) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i];
    if (t <= t1) {
      const [t0, v0] = frames[i - 1];
      return lerp(v0, v1, easing(progress(t, t0, t1)));
    }
  }
  return frames[frames.length - 1][1];
}

/** Opacity for a fade-in at the start and a fade-out at the end of a span. */
export const fadeInOut = (t, duration, fadeIn = 0.5, fadeOut = 0.5) =>
  Math.min(fadeIn ? progress(t, 0, fadeIn) : 1, fadeOut ? 1 - progress(t, duration - fadeOut, duration) : 1);

/** Progress of item i in a staggered group. */
export const stagger = (t, i, start, each, dur, easing = ease.outCubic) =>
  easing(progress(t, start + i * each, start + i * each + dur));

/** Visible part of text typed at `cps` characters per second. */
export const typewriter = (text, t, start = 0, cps = 30) =>
  text.slice(0, Math.floor(clamp((t - start) * cps, 0, text.length)));

/** Deterministic pseudo-random number in [0,1) from a seed (no Math.random!). */
export function rand(seed) {
  let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Smooth, deterministic wobble in [-1,1] — use for subtle camera drift. */
export const noise1 = (t, seed = 0) =>
  Math.sin(t * 1.3 + seed) * 0.5 + Math.sin(t * 2.7 + seed * 2.1) * 0.3 + Math.sin(t * 0.7 + seed * 3.7) * 0.2;

/** Create an HTML element: el('div', {class:'x', style:{...}}, parent, 'text'). */
export function el(tag, attrs = {}, parent, text) {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  if (text != null) node.textContent = text;
  parent?.appendChild(node);
  return node;
}

/** Create an SVG element. */
export function svg(tag, attrs = {}, parent) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  applyAttrs(node, attrs);
  parent?.appendChild(node);
  return node;
}

function applyAttrs(node, attrs) {
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else node.setAttribute(k, v);
  }
}

export { spring, springs, track, smootherstep, glide, creep, shake } from './spring.js';
export { FORMATS, makeLayout, fitText } from './formats.js';
