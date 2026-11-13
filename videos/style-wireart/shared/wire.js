// BENT WIRE — geometry + rendering. Every figure is ONE continuous polyline ("one wire"),
// resampled to a fixed point count so any shape can bend into any other shape.
import { svg, clamp } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep } from '/onclack-styles/engine/lib/spring.js';

// ---------- geometry ----------
/** Arc points (y down; angles in degrees, 0 = right, 90 = down). */
export function arc(cx, cy, rx, ry, a0, a1, n = 28) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + (a1 - a0) * i / n) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

/** Round every corner with a small radius (pliers bend, never a perfect sharp corner). */
export function fillet(pts, r, steps = 6) {
  if (pts.length < 3) return pts.slice();
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [px, py] = pts[i], [bx, by] = pts[i + 1];
    const la = Math.hypot(ax - px, ay - py), lb = Math.hypot(bx - px, by - py);
    if (la < 1e-6 || lb < 1e-6) continue;
    const d1 = Math.min(r, la / 2), d2 = Math.min(r, lb / 2);
    const p1 = [px + (ax - px) / la * d1, py + (ay - py) / la * d1];
    const p2 = [px + (bx - px) / lb * d2, py + (by - py) / lb * d2];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps, v = 1 - u;
      out.push([v * v * p1[0] + 2 * u * v * px + u * u * p2[0], v * v * p1[1] + 2 * u * v * py + u * u * p2[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function length(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

/** Resample to exactly N points, evenly spaced along the wire. */
export function resample(pts, N) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1] || 1, out = [];
  let j = 1;
  for (let k = 0; k < N; k++) {
    const s = (L * k) / (N - 1);
    while (j < cum.length - 1 && cum[j] < s) j++;
    const seg = cum[j] - cum[j - 1] || 1, u = clamp((s - cum[j - 1]) / seg);
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u]);
  }
  return out;
}

/** Place local shape: scale s, rotate deg, then translate to (x, y). */
export const place = (pts, x, y, s = 1, rot = 0, sy = s) => {
  const c = Math.cos((rot * Math.PI) / 180), si = Math.sin((rot * Math.PI) / 180);
  return pts.map(([px, py]) => { const a = px * s, b = py * sy; return [x + a * c - b * si, y + a * si + b * c]; });
};

/** Small closed loops at the cut ends (made with round-nose pliers — the hand-made tell). */
export function endCurls(pts, r, which = 'both') {
  const loop = (p, q, dir) => {
    const dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy) || 1;
    const ux = dx / l, uy = dy / l, nx = -uy * dir, ny = ux * dir;
    const cx = p[0] + nx * r, cy = p[1] + ny * r, a0 = Math.atan2(p[1] - cy, p[0] - cx);
    const out = [];
    for (let i = 1; i <= 16; i++) { const a = a0 + dir * (i / 16) * Math.PI * 1.85; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return out;
  };
  let res = pts.slice();
  if (which !== 'end') res = [...loop(pts[0], pts[1], 1).reverse(), ...res];
  if (which !== 'start') res = [...res, ...loop(pts[pts.length - 1], pts[pts.length - 2], -1)];
  return res;
}

/** A loose coil of raw wire lying on the wall (the raw material every figure is bent from). */
export function coil(cx, cy, r, turns, N, squash = 0.34, seed = 0) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), a = u * turns * Math.PI * 2 + seed;
    const rr = r * (0.92 + 0.08 * Math.sin(a * 0.5 + seed));
    out.push([cx + rr * Math.cos(a) + (u - 0.5) * r * 0.5, cy + rr * squash * Math.sin(a) - u * r * 0.12]);
  }
  return out;
}

/** The same N points laid flat on a straight line (wire lying along the sea line / floor). */
export const flat = (N, x0, y0, x1, y1) => Array.from({ length: N }, (_, i) => { const u = i / (N - 1); return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u]; });

/** The bend travels along the wire (point 0 first) — like hands working down it. */
export function morph(A, B, p, spread = 0.55, bow = 0) {
  const N = A.length, out = new Array(N);
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), q = smootherstep(clamp(p * (1 + spread) - u * spread));
    const b = bow * Math.sin(Math.PI * q);
    out[i] = [A[i][0] + (B[i][0] - A[i][0]) * q - b, A[i][1] + (B[i][1] - A[i][1]) * q - b * 1.2];
  }
  return out;
}

export function toD(pts) {
  let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 1; i < pts.length; i++) d += 'L' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
  return d;
}

// ---------- wire glyphs (single-line, cap height 1, y 0 = top, 1 = baseline) ----------
const G = {
  '0': { w: 0.6, p: () => arc(0.3, 0.5, 0.29, 0.5, 100, -275, 40) },
  'O': { w: 0.74, p: () => arc(0.37, 0.5, 0.36, 0.5, 90, -270, 44) },
  'o': { w: 0.74, p: () => arc(0.37, 0.5, 0.36, 0.5, -90, 275, 44) },   // O entered from the top (after N)
  '1': { w: 0.4, p: () => [[0.04, 0.24], [0.3, 0.0], [0.3, 1.0]] },
  '2': { w: 0.6, p: () => [...arc(0.29, 0.29, 0.27, 0.27, 195, 395, 22), [0.03, 1.0], [0.6, 1.0]] },
  '6': { w: 0.6, p: () => [[0.5, 0.03], [0.24, 0.2], [0.06, 0.55], ...arc(0.31, 0.71, 0.26, 0.28, 180, -62, 30)] },
  '7': { w: 0.6, p: () => [[0.22, 1.0], [0.6, 0.0], [0.02, 0.0]] },            // drawn from the foot so the link runs on the baseline
  '9': { w: 0.62, p: () => [[0.08, 1.0], [0.3, 1.0], [0.5, 0.86], [0.57, 0.6], ...arc(0.3, 0.31, 0.27, 0.3, 0, -360, 34)] },
  'C': { w: 0.7, p: () => [...arc(0.38, 0.5, 0.36, 0.5, 90, 40, 6), ...arc(0.38, 0.5, 0.355, 0.49, 40, 322, 38).slice(1)] }, // enters on the baseline, hairpin at the lower tip
  'T': { w: 0.66, p: () => [[0.0, 0.0], [0.66, 0.0], [0.645, 0.05], [0.37, 0.05], [0.34, 1.0]] },
  'N': { w: 0.6, p: () => [[0.0, 1.0], [0.0, 0.0], [0.6, 1.0], [0.6, 0.0]] },
  'Y': { w: 0.66, p: () => [[0.0, 0.0], [0.31, 0.48], [0.31, 1.0], [0.36, 1.0], [0.36, 0.48], [0.67, 0.0]] },
  'E': { w: 0.54, p: () => [[0.54, 0.0], [0.0, 0.0], [0.0, 0.48], [0.42, 0.48], [0.42, 0.53], [0.02, 0.53], [0.0, 1.0], [0.55, 1.0]] },
  'S': { w: 0.58, // drawn from the lower tip so the link from E stays low
    p: () => [[0.57, 0.2], [0.46, 0.04], [0.26, 0.0], [0.09, 0.07], [0.05, 0.23], [0.16, 0.39], [0.44, 0.54], [0.57, 0.72], [0.5, 0.92], [0.3, 1.0], [0.1, 0.96], [0.0, 0.8]].reverse() },
};
const ROUND = new Set(['0', 'O', 'C', '6', '9', 'S', '2']);

/** One continuous wire that writes `str` (spaces become a small looped flourish). Baseline at y. */
export function wireText(str, x, y, cap, { track = 0.2, align = 'center' } = {}) {
  const items = [];
  let cx = 0;
  for (const ch of str) {
    if (ch === ' ') { items.push({ space: true, x: cx }); cx += 0.42; continue; }
    const g = G[ch];
    items.push({ x: cx, g });
    cx += g.w + track;
  }
  const total = cx - track;
  const ox = align === 'center' ? -total / 2 : align === 'right' ? -total : 0;
  let pts = [];
  for (const it of items) {
    if (it.space) { // flourish loop on the baseline between words
      const lx = it.x + 0.21 - track / 2;
      pts.push([lx - 0.16, 1.0], ...arc(lx, 0.86, 0.12, 0.14, 90, -270, 18).map(([a, b]) => [a, b]), [lx + 0.16, 1.0]);
      continue;
    }
    let gp = it.g.p().map(([a, b]) => [a + it.x, b]);
    pts.push(...gp);
  }
  pts = fillet(pts, 0.05, 6);
  return pts.map(([a, b]) => [x + (a + ox) * cap, y - cap + b * cap]);
}
export const textWidth = (str, cap, track = 0.2) => {
  let w = 0;
  for (const ch of str) w += ch === ' ' ? 0.42 : G[ch].w + track;
  return (w - track) * cap;
};

// ---------- rendering ----------
const KIND = {
  steel: { edge: '#101214', body: '#363B41', mid: '#6E767F', spec: '#EEF2F5', shadow: '#4B5562' },
  copper: { edge: '#4A1E0B', body: '#9A4B24', mid: '#C9763F', spec: '#FFE0C2', shadow: '#5A4B48' },
};

/**
 * One wire = shadow (on the wall, offset down-right from the upper-left key light) + 4 strokes that fake a lit cylinder:
 * dark underside rim, body, midtone, thin specular line on the light side.
 */
export function makeWire(gShadow, gWire, { kind = 'steel', w = 6, standoff = 1, name = 'Wire', unit = 1 }) {
  const k = KIND[kind];
  const base = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const sh = svg('path', { ...base, stroke: k.shadow, 'data-name': name + ' shadow' }, gShadow);
  const g = svg('g', { 'data-name': name }, gWire);
  const edge = svg('path', { ...base, stroke: k.edge, 'stroke-width': w, transform: `translate(${0.17 * w} ${0.22 * w})` }, g);
  const body = svg('path', { ...base, stroke: k.body, 'stroke-width': w }, g);
  const mid = svg('path', { ...base, stroke: k.mid, 'stroke-width': w * 0.5, transform: `translate(${-0.13 * w} ${-0.15 * w})` }, g);
  const spec = svg('path', { ...base, stroke: k.spec, 'stroke-width': Math.max(1.2, w * 0.2), 'stroke-opacity': 0.9, transform: `translate(${-0.2 * w} ${-0.25 * w})` }, g);
  let shown = true;
  return {
    set(pts, { lift = 0, op = 1 } = {}) {
      if (!pts || op <= 0.001) { if (shown) { sh.style.display = g.style.display = 'none'; shown = false; } return; }
      if (!shown) { sh.style.display = g.style.display = ''; shown = true; }
      const d = toD(pts);
      edge.setAttribute('d', d); body.setAttribute('d', d); mid.setAttribute('d', d); spec.setAttribute('d', d);
      sh.setAttribute('d', d);
      const off = (standoff + lift * 1.6) * 11 * unit;
      sh.setAttribute('transform', `translate(${(off * 0.78).toFixed(1)} ${off.toFixed(1)})`);
      sh.setAttribute('stroke-width', (w * (1.05 + lift * 0.7)).toFixed(2));
      sh.setAttribute('stroke-opacity', (0.36 * (1 - 0.4 * lift) * op).toFixed(3));
      g.style.opacity = op < 1 ? op : '';
    },
  };
}
