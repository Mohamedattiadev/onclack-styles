// PENCIL FLIPBOOK kit — palette, seeded noise, pencil strokes (graphite + blue construction + red), lettering.
// Everything returns SVG markup strings, built per DRAWING (10 drawings/s), never per frame.
// Boil is the medium here (every page is a new drawing), but it is small, seeded by element + drawing number,
// and it STOPS on the hold (the NO) — the only time the paper stands still.

export const DPS = 10;                 // drawings per second ("on threes" at 30 fps)
export const F = 1 / 30;

export const C = {
  paper: '#ECE9E0',      // cheap 20 lb bond, slightly cool
  paperBack: '#DEDAD0',  // back of the leaf (no light through it)
  edge: '#CFCABD',       // page-block edges
  edgeDark: '#B9B3A5',
  graphite: '#2B2C30',   // HB/2B, with grain filter
  blue: '#4F84C2',       // light-blue construction pencil
  red: '#BE3226',        // red pencil — only the NO
  desk: '#3B3A34',       // worn masonite desk
  shadow: 'rgba(16,15,12,',
};
export const FONT = "'Kalam'";

/* ---------- seeded noise ---------- */
export function hash(a, b = 0, c = 0) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 982451653) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export const sr = (a, b = 0, c = 0) => hash(a, b, c) * 2 - 1; // −1..1
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
export const easeIO = p => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
export const easeOut = p => 1 - (1 - p) ** 3;
const f1 = v => (Math.round(v * 10) / 10).toString();

/** Global start time of the n-th spoken occurrence of a word. */
export function wordAt(words, w, n = 0, fb = 0) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = words.filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start : fb;
}

/* ---------- geometry ---------- */
export function ell(cx, cy, rx, ry, { rot = 0, seg = 30, start = -0.4, sweep = Math.PI * 2.12 } = {}) {
  const out = [], cr = Math.cos(rot), sn = Math.sin(rot);
  for (let i = 0; i <= seg; i++) {
    const a = start + (sweep * i) / seg, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * cr - y * sn, cy + x * sn + y * cr]);
  }
  return out;
}
/** Prefix of a polyline by fraction of its length (draw-on). */
export function partial(pts, f) {
  if (f >= 1) return pts;
  if (f <= 0 || pts.length < 2) return [];
  const seg = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
  let want = tot * f; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (want >= seg[i - 1]) { out.push(pts[i]); want -= seg[i - 1]; continue; }
    const q = want / seg[i - 1];
    out.push([lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)]);
    break;
  }
  return out;
}
export const xf = (pts, dx, dy, s = 1, rot = 0) => {
  const c = Math.cos(rot), sn = Math.sin(rot);
  return pts.map(([x, y]) => [dx + (x * c - y * sn) * s, dy + (x * sn + y * c) * s]);
};

/* ---------- strokes ---------- */
/** Path data for a hand line: seeded jitter per drawing n, optional overshoot at both ends, smoothed. */
export function pd(pts, seed, n, { amp = 1.3, over = 0, smooth = true } = {}) {
  if (pts.length < 2) return '';
  const p = pts.map(([x, y], i) => [x + amp * sr(seed, i, n), y + amp * sr(seed + 77, i, n)]);
  if (over) {
    const ext = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], d = Math.hypot(dx, dy) || 1; return [a[0] + (dx / d) * over * (0.6 + 0.4 * hash(seed, 9, n)), a[1] + (dy / d) * over * (0.6 + 0.4 * hash(seed, 9, n))]; };
    p[0] = ext(p[0], p[1]); p[p.length - 1] = ext(p[p.length - 1], p[p.length - 2]);
  }
  let d = `M${f1(p[0][0])} ${f1(p[0][1])}`;
  if (!smooth || p.length < 3) { for (let i = 1; i < p.length; i++) d += `L${f1(p[i][0])} ${f1(p[i][1])}`; return d; }
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
    d += `Q${f1(p[i][0])} ${f1(p[i][1])} ${f1(mx)} ${f1(my)}`;
  }
  const l = p[p.length - 1];
  return d + `L${f1(l[0])} ${f1(l[1])}`;
}
/** Graphite line: a main pass + a lighter second pass that does not quite follow (pencil re-stated). */
export function G(pts, seed, n, { w = 3.2, op = 0.92, over = 4, amp = 1.3, smooth = true, col = C.graphite, two = true } = {}) {
  if (pts.length < 2) return '';
  let s = `<path d="${pd(pts, seed, n, { amp, over, smooth })}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
  if (two) s += `<path d="${pd(pts, seed + 501, n, { amp: amp * 1.8, over: over * 1.6, smooth })}" fill="none" stroke="${col}" stroke-width="${(w * 0.55).toFixed(2)}" stroke-linecap="round" opacity="${(op * 0.45).toFixed(2)}"/>`;
  return s;
}
/** Blue construction line: thin, light, long overshoot, drawn fast. */
export const B = (pts, seed, n, o = {}) => G(pts, seed, n, { w: 2.3, op: 0.58, over: 14, amp: 1.6, col: C.blue, two: false, ...o });
/** Red pencil (pressed hard). */
export const R = (pts, seed, n, o = {}) => G(pts, seed, n, { w: 7, op: 0.95, over: 6, amp: 1.6, col: C.red, ...o });

/** Parallel hatch lines over a rect (clip with a clipPath outside). Lines break and vary like real hatching. */
export function hatch(x0, y0, x1, y1, gap, ang, seed, n, { w = 1.6, op = 0.55, col = C.graphite } = {}) {
  const c = Math.cos(ang), s = Math.sin(ang), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const R0 = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = '';
  for (let k = -R0, i = 0; k <= R0; k += gap, i++) {
    // a row is laid as several short strokes with small gaps (hand hatching, not a ruler)
    let a = -R0 * (0.85 + 0.15 * hash(seed, i, 3)); const end = R0 * (0.85 + 0.15 * hash(seed, i, 5));
    for (let m = 0; a < end && m < 40; m++) {
      const len = 40 + 120 * hash(seed, i * 41 + m, 6), b = Math.min(end, a + len);
      const j = 1.6 * sr(seed, i * 7 + m, n) + 5 * sr(seed, i * 7 + m, 99), px = cx - s * (k + j), py = cy + c * (k + j), tilt = 2.5 * sr(seed, i * 13 + m, n + 3);
      d += `M${f1(px + c * a)} ${f1(py + s * a)}L${f1(px + c * b)} ${f1(py + s * b + tilt)}`;
      a = b + 6 + 22 * hash(seed, i * 17 + m, 8);
    }
  }
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
}

/** Hand lettering (Kalam), boiled per drawing; `count` letters shown (animators letter fast, 2–3 per drawing). */
export function T(str, x, y, size, seed, n, { count = Infinity, w = 400, col = C.graphite, anchor = 'start', op = 0.92, name = '', rot = 0, ls = 0 } = {}) {
  const s = str.slice(0, Math.max(0, Math.floor(count)));
  if (!s) return '';
  const dx = 1.2 * sr(seed, 1, n), dy = 1.2 * sr(seed, 2, n), r = rot + 0.5 * sr(seed, 3, n);
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<text x="${f1(x + dx)}" y="${f1(y + dy)}" transform="rotate(${r.toFixed(2)} ${f1(x)} ${f1(y)})" font-family="${FONT}" font-weight="${w}" font-size="${size}" fill="${col}" opacity="${op}" text-anchor="${anchor}" letter-spacing="${ls}"${name ? ` data-name="${name}"` : ''}>${esc}</text>`;
}

/* ---------- paper texture (made once, deterministic) ---------- */
let paperURL = null, deskURL = null;
export function paperTexture() {
  if (paperURL) return paperURL;
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    const tooth = hash(x, y, 11) * 0.6 + hash(x >> 1, y >> 1, 12) * 0.4;
    const cloud = 0.5 + 0.5 * Math.sin(x * 0.013 + Math.sin(y * 0.011) * 2.1) * Math.sin(y * 0.017 + x * 0.004);
    const v = 236 - 9 * tooth - 5 * cloud;
    d[i] = v; d[i + 1] = v - 2; d[i + 2] = v - 8; d[i + 3] = 255;
  }
  // a few long paper fibres
  for (let k = 0; k < 140; k++) {
    let x = hash(k, 1, 13) * S, y = hash(k, 2, 13) * S; const a = hash(k, 3, 13) * Math.PI * 2, L = 6 + 18 * hash(k, 4, 13);
    for (let j = 0; j < L; j++) { const xi = (((x + Math.cos(a) * j) | 0) + S) % S, yi = (((y + Math.sin(a + j * 0.05) * j) | 0) + S) % S, i = (yi * S + xi) * 4; d[i] -= 10; d[i + 1] -= 10; d[i + 2] -= 9; }
  }
  g.putImageData(im, 0, 0);
  return (paperURL = c.toDataURL('image/png'));
}
export function deskTexture() {
  if (deskURL) return deskURL;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4, v = hash(x, y, 31) * 14 + hash(x >> 2, y >> 2, 32) * 8;
    d[i] = 52 + v; d[i + 1] = 51 + v; d[i + 2] = 45 + v; d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return (deskURL = c.toDataURL('image/png'));
}
