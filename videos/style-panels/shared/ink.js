// Ink Panels — shared drawing kit. Everything is geometry made once at build time (seeded, fixed per object);
// update() only moves cameras, clips and springs. No randomness by time.
import { rand, svg, clamp, lerp, spring } from '/onclack-styles/engine/lib/anim.js';

export const PAL = {
  paper: '#F2EEE4',     // page white (warm, not pure)
  ink: '#161514',       // brush ink
  teal: '#23676B',      // the one flat spot colour
  pencil: '#A8C5C2',    // light teal = "non-photo" pencil under the inks
  red: '#C8312A',       // only for the NO
};
export const F = 1 / 30;
export const FONT = { letter: "'Shantell Sans'", sfx: "'Bricolage Grotesque'" };

/* ---------- voice ---------- */
const clean = s => String(s).toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Global start time of the n-th occurrence of a word (fallback fb). */
export function W(ctx, w, n = 0, fb = 0) {
  const hits = (ctx.words ?? []).filter(x => clean(x.word) === clean(w));
  return hits[n]?.start ?? fb;
}

/* ---------- easing (motion tokens from the playbook) ---------- */
export function bez(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s;
  return p => {
    p = clamp(p);
    let s = p;
    for (let i = 0; i < 8; i++) { const dx = X(s) - p, d = (3 * ax * s + 2 * bx) * s + cx; if (Math.abs(d) < 1e-6) break; s -= dx / d; }
    return Y(clamp(s));
  };
}
export const ez = { enter: bez(0.16, 1, 0.3, 1), exit: bez(0.7, 0, 0.84, 0), move: bez(0.65, 0, 0.35, 1), camera: bez(0.45, 0, 0.15, 1) };
export const tw = (t, a, b, from, to, e = ez.move) => lerp(from, to, e(b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a))));
/** Spring settle (low bounce) from 0 → 1 released at t0. */
export const snap = (t, t0, cfg = { stiffness: 520, damping: 40 }) => spring(t - t0, cfg);

/* ---------- noise + geometry ---------- */
export function vnoise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = rand(i * 17.131 + seed * 101.73), b = rand((i + 1) * 17.131 + seed * 101.73);
  return (a + (b - a) * u) * 2 - 1;
}
export function resample(pts, step, closed = false) {
  const src = closed ? [...pts, pts[0]] : pts;
  const out = [src[0]];
  let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const [x0, y0] = src[i - 1], [x1, y1] = src[i];
    const L = Math.hypot(x1 - x0, y1 - y0);
    let d = step - carry;
    while (d <= L) { out.push([x0 + (x1 - x0) * d / L, y0 + (y1 - y0) * d / L]); d += step; }
    carry = L - (d - step);
  }
  if (!closed) out.push(src[src.length - 1]);
  return out;
}
/** Hand-inked outline: resample and push along the normal by smooth seeded noise (fixed per object). */
export function rough(pts, { step = 10, amp = 1.6, freq = 0.09, seed = 1, closed = true } = {}) {
  const r = resample(pts, step, closed);
  const n = r.length;
  return r.map(([x, y], i) => {
    const a = r[(i - 1 + n) % n], b = r[(i + 1) % n];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1;
    const o = vnoise(i * step * freq * 0.1, seed) * amp;
    return [x + nx / l * o, y + ny / l * o];
  });
}
export const dPath = (pts, closed = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + (closed ? 'Z' : '');
export function ellipsePts(cx, cy, rx, ry, n = 48, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * c - y * s, cy + x * s + y * c]; });
}
/** Points along a cubic bezier. */
export function cubicPts(p0, p1, p2, p3, n = 24) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, m = 1 - t;
    return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]];
  });
}

/**
 * A brush stroke as a filled polygon: pressure taper in/out + fixed wobble. p = 0..1 how much is drawn (pure fn of time).
 */
export function brush(center, { w = 8, p = 1, seed = 1, tin = 0.12, tout = 0.35, min = 0.12, wob = 0.18, step = 6 } = {}) {
  const pts = resample(center, step, false);
  if (pts.length < 2 || p <= 0) return '';
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1], cut = len * clamp(p);
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    let [x, y] = pts[i], s = cum[i];
    if (s > cut) {
      const s0 = cum[i - 1], f = (cut - s0) / (s - s0 || 1);
      x = lerp(pts[i - 1][0], x, f); y = lerp(pts[i - 1][1], y, f); s = cut;
    }
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const u = s / len;
    const prof = Math.min(1, min + (1 - min) * Math.min(u / tin, 1), min + (1 - min) * Math.min((1 - u) / tout, 1));
    const hw = w * 0.5 * prof * (1 + wob * vnoise(s * 0.02, seed));
    L.push([x + nx * hw, y + ny * hw]); R.push([x - nx * hw, y - ny * hw]);
    if (s >= cut) break;
  }
  return dPath([...L, ...R.reverse()], true);
}

/* ---------- lettering (Shantell Sans, tuned: caps, fixed per-letter rotate + baseline, never boiling) ---------- */
export function letter(parent, text, { x = 0, y = 0, size = 48, fill = PAL.ink, anchor = 'start', seed = 1, family = FONT.letter, weight = 500, spacing = 0.03, jitter = 1, name, stroke, strokeW = 0 } = {}) {
  const chars = [...text];
  const rot = [], dy = [];
  let prev = 0;
  chars.forEach((c, i) => {
    const j = (rand(seed * 31.7 + i * 7.13) - 0.5) * size * 0.05 * jitter;
    rot.push(((rand(seed * 13.1 + i * 3.71) - 0.5) * 4.2 * jitter).toFixed(2));
    dy.push((j - prev).toFixed(2)); prev = j;
  });
  const a = {
    x, y, fill, 'font-family': family, 'font-weight': weight, 'font-size': size, 'letter-spacing': `${spacing}em`,
    'text-anchor': anchor, rotate: rot.join(' '), dy: dy.join(' '), 'font-kerning': 'normal',
  };
  if (name) a['data-name'] = name;
  if (stroke) Object.assign(a, { stroke, 'stroke-width': strokeW, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
  const node = svg('text', a, parent);
  node.textContent = text;
  return node;
}
const textW = node => { try { return node.getComputedTextLength(); } catch { return 0; } };

/** Caption box: hand-ruled border (lines overshoot the corners a little, like an inker's ruler), lettered lines. */
export function caption(parent, lines, { x = 0, y = 0, size = 48, pad = 0.42, fill = PAL.paper, ink = PAL.ink, seed = 1, name = 'Caption', lead = 1.36, bw = 4 } = {}) {
  const g = svg('g', { 'data-name': name }, parent);
  const bg = svg('path', { fill }, g);
  const border = svg('path', { fill: ink }, g);
  const nodes = lines.map((s, i) => letter(g, s, { x: 0, y: 0, size, seed: seed + i * 5, fill: ink, name: `${name} line ${i + 1}` }));
  const p = size * pad;
  const w = Math.max(...nodes.map(textW)) + 2 * p;
  const h = lines.length * size * lead + p * 1.25;
  nodes.forEach((n, i) => { n.setAttribute('x', x + p); n.setAttribute('y', y + p * 0.62 + size * (0.86 + i * lead)); });
  const r = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  bg.setAttribute('d', dPath(r));
  border.setAttribute('d', ruledBox(r, bw, seed));
  return { g, w, h, x, y };
}
/** Four ruled ink lines around a quad; each overshoots its corners by a fixed small amount. */
export function ruledBox(q, bw, seed, over = 1) {
  let d = '';
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const o0 = (rand(seed * 3.3 + i) * 5 + 0.5) * over, o1 = (rand(seed * 5.9 + i) * 5 + 0.5) * over;
    d += brush([[a[0] - ux * o0, a[1] - uy * o0], [b[0] + ux * o1, b[1] + uy * o1]], { w: bw, seed: seed + i, tin: 0.02, tout: 0.03, min: 0.75, wob: 0.12, step: 14 });
  }
  return d;
}

/** Speech balloon: soft hand-drawn oval + curved tail to (tx, ty). Returns { g, bg, line }. */
export function balloon(parent, { cx, cy, rx, ry, tx, ty, seed = 3, bw = 5, name = 'Balloon', fill = PAL.paper }) {
  const g = svg('g', { 'data-name': name }, parent);
  const ring = ellipsePts(cx, cy, rx, ry, 64).map(([x, y], i) => [x + vnoise(i * 0.35, seed) * rx * 0.025, y + vnoise(i * 0.35, seed + 9) * ry * 0.03]);
  // tail: find two ring points around the direction of the tail
  const ang = Math.atan2(ty - cy, tx - cx);
  let best = 0, bd = 1e9;
  ring.forEach(([x, y], i) => { const a = Math.atan2(y - cy, x - cx), d = Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang))); if (d < bd) { bd = d; best = i; } });
  const n = ring.length, i0 = (best - 3 + n) % n, i1 = (best + 3) % n;
  const pts = [];
  for (let k = 0; k < n; k++) {
    const idx = (i1 + k) % n;
    pts.push(ring[idx]);
    if (idx === i0) break;
  }
  const a = ring[i0], b = ring[i1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const bend = [(mx + tx) / 2 + (ty - my) * 0.18, (my + ty) / 2 - (tx - mx) * 0.18];
  const tail = [...cubicPts(a, [lerp(a[0], bend[0], 0.6), lerp(a[1], bend[1], 0.6)], bend, [tx, ty], 10).slice(1), ...cubicPts([tx, ty], bend, [lerp(b[0], bend[0], 0.5), lerp(b[1], bend[1], 0.5)], b, 10).slice(1, -1)];
  const shape = [...pts, ...tail];
  const bg = svg('path', { d: dPath(shape), fill }, g);
  const line = svg('path', { d: dPath(shape), fill: 'none', stroke: PAL.ink, 'stroke-width': bw, 'stroke-linejoin': 'round' }, g);
  return { g, bg, line };
}

/* ---------- silhouettes (no faces: backs, hulls, machinery) ---------- */
/** Officer seen from behind, peaked cap. (cx, by) = base of the neck line; s = scale (shoulder half-width ≈ 1.1 s). */
export function officerBack(cx, by, s, { lean = 0, extend = 3 } = {}) {
  const P = (x, y) => [cx + x * s + lean * (by - (by + y * s)) * 0.0, by + y * s];
  const torso = [
    P(-1.2, extend), P(-1.2, 0.2),
    ...cubicPts(P(-1.2, 0.2), P(-1.2, -0.42), P(-1.05, -0.62), P(-0.5, -0.68), 10).slice(1),
    P(-0.2, -0.74), P(-0.17, -0.9), P(0.17, -0.9), P(0.2, -0.74),
    ...cubicPts(P(0.5, -0.68), P(1.05, -0.62), P(1.2, -0.42), P(1.2, 0.2), 10),
    P(1.2, extend),
  ];
  const head = ellipsePts(cx, by - 1.12 * s, 0.27 * s, 0.32 * s, 40);
  const earL = ellipsePts(cx - 0.265 * s, by - 1.1 * s, 0.055 * s, 0.1 * s, 16);
  const earR = ellipsePts(cx + 0.265 * s, by - 1.1 * s, 0.055 * s, 0.1 * s, 16);
  const band = [P(-0.29, -1.27), P(0.29, -1.27), P(0.3, -1.4), P(-0.3, -1.4)];
  const crown = ellipsePts(cx, by - 1.43 * s, 0.44 * s, 0.13 * s, 40);
  return { parts: [torso, head, earL, earR, band, crown],
    rim: [ // key light upper-left → rim along the left contours
      cubicPts(P(-1.17, -0.05), P(-1.17, -0.42), P(-1.03, -0.6), P(-0.5, -0.66), 12),
      ellipsePts(cx, by - 1.12 * s, 0.27 * s, 0.32 * s, 40).slice(17, 27),
      ellipsePts(cx, by - 1.43 * s, 0.44 * s, 0.13 * s, 40).slice(19, 29),
    ],
    boards: [[P(-0.95, -0.5), P(-0.55, -0.64)], [P(0.55, -0.64), P(0.95, -0.5)]] };
}

/** Foxtrot-type diesel submarine, side view, bow to the LEFT. Returns hull polygon + sail + rim line. */
export function subShape(x0, cy, len) {
  const hh = len * 0.105;
  const r = u => (u < 0.1 ? Math.sqrt(Math.max(0, 1 - ((0.1 - u) / 0.1) ** 2)) : u > 0.68 ? 1 - ((u - 0.68) / 0.32) ** 1.5 * 0.82 : 1) * hh / 2;
  const top = [], bot = [];
  for (let i = 0; i <= 60; i++) { const u = i / 60; top.push([x0 + u * len, cy - r(u)]); bot.push([x0 + u * len, cy + r(u) * 0.92]); }
  const hull = [...top, ...bot.reverse()];
  const X = u => x0 + u * len, T = cy - hh / 2;
  const sail = [[X(0.29), T + 2], [X(0.315), T - hh * 1.05], [X(0.345), T - hh * 1.12], [X(0.44), T - hh * 1.12], [X(0.455), T - hh * 0.95], [X(0.48), T + 2]];
  const masts = [[[X(0.36), T - hh * 1.1], [X(0.36), T - hh * 1.75]], [[X(0.395), T - hh * 1.1], [X(0.39), T - hh * 1.55]]];
  const fin = [[X(0.93), cy - hh * 0.05], [X(0.985), cy - hh * 0.55], [X(1.0), cy - hh * 0.5], [X(0.985), cy + hh * 0.5], [X(0.93), cy + hh * 0.08]];
  const rim = top.slice(3, 52).map(([x, y]) => [x, y + 2]);
  return { hull, sail, masts, fin, rim, hh };
}

/** Destroyer silhouette, side view, bow to the RIGHT. Waterline at y = wy. */
export function shipShape(x0, wy, len) {
  const h = len * 0.12, X = u => x0 + u * len;
  const hull = [[X(0), wy - h * 0.22], [X(0.6), wy - h * 0.24], [X(0.86), wy - h * 0.3], [X(1), wy - h * 0.4], [X(0.95), wy], [X(0.03), wy]];
  const blocks = [
    [[X(0.12), wy - h * 0.23], [X(0.12), wy - h * 0.48], [X(0.22), wy - h * 0.48], [X(0.22), wy - h * 0.23]],
    [[X(0.4), wy - h * 0.24], [X(0.42), wy - h * 0.82], [X(0.49), wy - h * 0.82], [X(0.5), wy - h * 0.24]],
    [[X(0.58), wy - h * 0.25], [X(0.58), wy - h * 0.62], [X(0.62), wy - h * 0.78], [X(0.74), wy - h * 0.78], [X(0.76), wy - h * 0.27]],
    [[X(0.8), wy - h * 0.29], [X(0.8), wy - h * 0.48], [X(0.86), wy - h * 0.48], [X(0.88), wy - h * 0.31]],
  ];
  const mast = [[X(0.665), wy - h * 0.78], [X(0.66), wy - h * 1.55]];
  // tripod mast: a brace + a one-sided yard and a small radar bar (no symmetric cross)
  const yard = [[X(0.664), wy - h * 1.32], [X(0.715), wy - h * 1.3]];
  const brace = [[X(0.6), wy - h * 0.78], [X(0.662), wy - h * 1.42]];
  const radar = [[X(0.645), wy - h * 1.55], [X(0.68), wy - h * 1.6]];
  return { hull, blocks, mast, yard, brace, radar, h };
}
