// LIGHT TABLE kit — "the archive under the loupe".
// Model: one real light table in a dark archive room. Everything is a physical object lying on the glass:
// sheet negatives, 35 mm strips, cut single frames, paper tape labels, grease-pencil marks, and one loupe.
// Imperfection is designed once per object (seeded) and never boils: dust, hairs, fingerprints, base mottle,
// scratches, edge print. Only the camera, the loupe and the grease pencil move.
import { clamp, progress } from '/onclack-styles/engine/lib/anim.js';

export const F = 1 / 30;

/* ---------- tokens ---------- */
export const C = {
  room: '#111416',            // dark archive room (RGB ≈ 17, never #000)
  glass: '#E6EEF2',           // light-table white-blue
  glassHi: '#EEF3F6',
  glassLo: '#CBD8E0',
  rail: '#7D868C',
  red: '#C42A1E',             // grease pencil, on light areas
  yellow: '#F1BF2C',          // grease pencil, on dense film
  type: '#1D1B19',            // typewriter ink on tape
  tape: '#D3CCBB',            // paper tape, backlit (reads grey-warm on the glass)
};
// film colours (rgb): light through clear orange base / dense silver on base / positive print paper
export const FILM = { clear: [240, 168, 96], dense: [34, 17, 9], paperW: [234, 229, 218], paperK: [24, 21, 19] };
export const FONT = { hand: "'Shantell Sans', sans-serif", type: "'IBM Plex Mono', monospace" };
export const RES = 2; // canvas px per world unit

/* ---------- motion tokens ---------- */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = s => ((ax * s + bx) * s + cx) * s, fy = s => ((ay * s + by) * s + cy) * s;
  const dx = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let s = p;
    for (let i = 0; i < 8; i++) { const e = fx(s) - p, d = dx(s); if (Math.abs(e) < 1e-5 || !d) break; s -= e / d; }
    return fy(clamp(s));
  };
}
export const ez = { enter: bezier(0.16, 1, 0.3, 1), exit: bezier(0.7, 0, 0.84, 0), move: bezier(0.65, 0, 0.35, 1), camera: bezier(0.45, 0, 0.15, 1) };

/* ---------- seeded noise ---------- */
export function hash(x, y, s) {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
export const r01 = (seed, i = 0) => hash(seed, i, 917);
export function vnoise(x, y, cell, s) {
  const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}
/** smooth 1-D noise in [-1, 1] (hand tremor, table shake) */
export const n1 = (t, s) => vnoise(t * 100, s * 37, 100, 71) * 2 - 1;

/* ---------- words ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Global start time of the nth word matching w (fallback if missing). */
export function wordAt(words, w, n = 0, fallback = 0) {
  const hits = words.filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start : fallback;
}

/* ---------- canvas helpers ---------- */
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; }
export async function toURL(c) {
  const b = await new Promise(r => c.toBlob(r, 'image/png'));
  return URL.createObjectURL(b);
}
export async function loadImage(src) { const i = new Image(); i.src = src; await i.decode(); return i; }

/** Greyscale luminance array of an image, cropped (cover) to aspect w/h. */
export function greyCrop(img, w, h, focus = [0.5, 0.5]) {
  const c = canvas(w, h), g = c.getContext('2d');
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  g.drawImage(img, (w - dw) * focus[0], (h - dh) * focus[1], dw, dh);
  const d = g.getImageData(0, 0, w, h).data, L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
  return L;
}
const mix3 = (a, b, p) => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];

/** Negative pixel (rgb) from a scene luminance (bright scene → dense film). */
export function negPx(L, grain) {
  const d = clamp(Math.pow(clamp(L * 1.06 - 0.02), 0.85) + grain);
  return mix3(FILM.clear, FILM.dense, d);
}
/** Positive print pixel from luminance. */
export function posPx(L, grain) {
  const v = clamp((L - 0.5) * 1.12 + 0.5 + grain * 0.6);
  return mix3(FILM.paperK, FILM.paperW, Math.pow(v, 1.05));
}

/** Film-base texture: mottle, long scratches, dust specks, a hair. Draws on g over w×h px. */
export function baseTexture(g, w, h, seed, k = RES) {
  // long base scratches (along the film)
  for (let i = 0; i < 5; i++) {
    const y = r01(seed, i) * h, a = 0.05 + 0.06 * r01(seed, i + 20);
    g.strokeStyle = `rgba(255,236,200,${a})`; g.lineWidth = (0.6 + r01(seed, i + 40)) * k;
    g.beginPath(); g.moveTo(r01(seed, i + 60) * w * 0.3, y); g.lineTo(w * (0.6 + 0.4 * r01(seed, i + 80)), y + (r01(seed, i + 90) - 0.5) * 6 * k); g.stroke();
  }
  // dust specks (dark on the negative) + a few clear pinholes
  for (let i = 0; i < Math.round(w * h / (9000 * k * k)); i++) {
    const x = r01(seed + 1, i) * w, y = r01(seed + 2, i) * h, r = (0.5 + 1.8 * r01(seed + 3, i) ** 3) * k;
    const pin = r01(seed + 4, i) < 0.18;
    g.fillStyle = pin ? 'rgba(255,240,215,0.55)' : `rgba(20,10,4,${0.35 + 0.4 * r01(seed + 5, i)})`;
    g.beginPath(); g.ellipse(x, y, r, r * (0.6 + 0.4 * r01(seed + 6, i)), r01(seed + 7, i) * 3, 0, Math.PI * 2); g.fill();
  }
  // one or two hairs / fibres
  for (let j = 0; j < 2; j++) {
    if (r01(seed + 9, j) < 0.35) continue;
    let x = r01(seed + 10, j) * w, y = r01(seed + 11, j) * h, a = r01(seed + 12, j) * 6.28;
    g.strokeStyle = 'rgba(25,12,5,0.55)'; g.lineWidth = 0.7 * k; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 26; s++) { a += (vnoise(s * 10, j * 50, 30, seed) - 0.5) * 0.9; x += Math.cos(a) * 3 * k; y += Math.sin(a) * 3 * k; g.lineTo(x, y); }
    g.stroke();
  }
}

/** Fingerprint: concentric ridge loops, oily, very low contrast. */
export function fingerprint(g, cx, cy, rx, ry, rot, seed, color = 'rgba(40,60,70,0.07)', k = RES) {
  g.save(); g.translate(cx, cy); g.rotate(rot); g.strokeStyle = color; g.lineWidth = 1.6 * k;
  for (let i = 1; i < 16; i++) {
    const f = i / 16; g.beginPath();
    for (let a = 0; a <= 64; a++) {
      const th = (a / 64) * Math.PI * 2, wob = 1 + 0.05 * Math.sin(th * 3 + seed + i * 0.4) + 0.03 * (vnoise(a * 7, i * 13, 9, seed) - 0.5);
      const x = Math.cos(th) * rx * f * wob, y = Math.sin(th) * ry * f * wob * (1 + 0.25 * (th > Math.PI ? 0.3 : 0));
      if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    // ridges break: skip parts with a dash pattern seeded per ring
    g.setLineDash([(18 + 30 * r01(seed, i)) * k, (3 + 7 * r01(seed + 1, i)) * k]);
    g.stroke();
  }
  g.restore();
}

/* ---------- hand-drawn geometry ---------- */
export function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
/** A grease-pencil loop: starts upper-left, goes round once and overshoots past its start (like a real hand). */
export function handLoop(cx, cy, rx, ry, seed, rot = 0) {
  const n = 40, a0 = -2.5 + r01(seed) * 0.5, sweep = Math.PI * 2 + 0.5 + r01(seed, 1) * 0.3, cr = Math.cos(rot), sr = Math.sin(rot);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n, a = a0 + sweep * f;
    const k = 1 + 0.035 * Math.sin(a * 2 + seed) + 0.025 * Math.sin(a * 3.3 + seed * 2) + 0.07 * f;
    const x = rx * k * Math.cos(a), y = ry * k * Math.sin(a);
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return smoothPath(pts);
}
/** A tick (✓) mark at x,y, size s. */
export function handTick(x, y, s, seed) {
  const j = i => (r01(seed, i) - 0.5) * s * 0.12;
  return smoothPath([[x - s * 0.5 + j(1), y - s * 0.05 + j(2)], [x - s * 0.28 + j(3), y + s * 0.18], [x - s * 0.12 + j(4), y + s * 0.42 + j(5)], [x + s * 0.18, y - s * 0.1 + j(6)], [x + s * 0.55 + j(7), y - s * 0.62 + j(8)]]);
}
/** A slightly wavering straight stroke. */
export function handLine(x1, y1, x2, y2, seed, wob = 4) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const f = i / 10; pts.push([x1 + (x2 - x1) * f + (r01(seed, i) - 0.5) * wob * 0.5, y1 + (y2 - y1) * f + Math.sin(f * 3.1 + seed) * wob * 0.6 + (r01(seed, i + 30) - 0.5) * wob * 0.4]);
  }
  return smoothPath(pts);
}

export const pr = progress;
