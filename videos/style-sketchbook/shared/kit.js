// FIELD SKETCHBOOK kit — pen lines, pencil underdrawing, handwriting, watercolour washes, tape, torn scraps, paper.
// All drawing is in BOOK UNITS (one page = 1000 × 1400). Everything is a pure function of global time `tg`.
// "Imperfection is designed once": every wobble is seeded by the element, never by time.
import { el, svg, clamp, lerp, ease } from '/onclack-styles/engine/lib/anim.js';

export const F = 1 / 30;
export const PAGE_W = 1000, PAGE_H = 1400;

/* ---------- palette (tokens only) ---------- */
export const C = {
  paper: '#F1E8D3',      // page cream
  paperEdge: '#E2D6BC',  // page block edge
  sepia: '#3D271A',      // sepia pen (fibre-tip, waterproof)
  pencil: '#77736C',     // graphite underdrawing
  red: '#B02A22',        // red pen — only for the NO
  payne: [50, 64, 84],   // Payne's grey wash (rgb)
  viridian: [36, 112, 92], // the one viridian wash
  desk: '#262C31',       // slate linen desk
  cover: '#1E1B19',      // book cover
  print: '#44525D',      // printed map ink
  printSea: '#DCE1DF',
  printLand: '#EEE7D6',
  tape: 'rgba(233,221,186,0.82)',
};
export const FONT = {
  hand: "'Shantell Sans', sans-serif",
  print: "'IBM Plex Mono', monospace",
};

/* ---------- seeded noise ---------- */
function hash2(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, s = 0, oct = 4) {
  let sum = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { sum += amp * vnoise(x * f, y * f, s + i * 31); n += amp; amp *= 0.5; f *= 2.03; }
  return sum / n;
}
/** seeded 0..1 */
export const r1 = (seed) => hash2(seed * 7 + 3, seed * 13 + 1, 9177);

/* ---------- time helpers ---------- */
/** Global start time of the n-th occurrence of a spoken word (normalised), from ctx.words. */
export function wordAt(ctx, w, n = 0, fallback = 0) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = ctx.words.filter((x) => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start : fallback;
}
export const prog = (tg, a, b) => clamp((tg - a) / Math.max(1e-6, b - a));

/* ---------- sketch geometry ---------- */
/**
 * Hand-drawn path through points: seeded jitter, optional overshoot at both ends (pen keeps moving after
 * the line), Catmull-Rom smoothing. Returns { d, len }.
 */
export function sketch(points, { seed = 1, jit = 2.2, over = 0, closed = false, smooth = true } = {}) {
  let pts = points.map(([x, y], i) => [x + (r1(seed * 101 + i) - 0.5) * 2 * jit, y + (r1(seed * 203 + i) - 0.5) * 2 * jit]);
  if (over && pts.length > 1 && !closed) {
    const ext = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [b[0] + (dx / l) * over, b[1] + (dy / l) * over + over * 0.25]; };
    pts = [ext(pts[1], pts[0]), ...pts, ext(pts[pts.length - 2], pts[pts.length - 1])];
  }
  if (closed) pts = [...pts, pts[0]];
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (!smooth || pts.length < 3) return { d: 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'), len };
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return { d, len };
}
/** Transform a list of local points: rotate (deg), scale, translate. */
export const place = (pts, { x = 0, y = 0, s = 1, rot = 0 } = {}) => {
  const c = Math.cos((rot * Math.PI) / 180), sn = Math.sin((rot * Math.PI) / 180);
  return pts.map(([px, py]) => [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s]);
};
/** Densify a polyline (so jitter reads as a hand, not as corners). */
export function dense(pts, step = 40) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}
export const ellipse = (cx, cy, rx, ry, n = 18, a0 = 0, turns = 1) =>
  Array.from({ length: Math.round(n * turns) + 1 }, (_, i) => { const a = a0 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });

/* ---------- page layers ---------- */
export function pageSvg(parent, name, z = 0) {
  return svg('svg', { 'data-name': name, viewBox: `0 0 ${PAGE_W} ${PAGE_H}`, width: PAGE_W, height: PAGE_H, style: `position:absolute;left:0;top:0;overflow:visible;z-index:${z}` }, parent);
}

/**
 * A PEN DRAWING: strokes drawn one after another between t0 and t1 (constant pen speed, small lifts between strokes).
 * strokes: [{ pts | d+len, w, color, seed, jit, over, pass2 }]. pass2 = the sketcher goes over the line a second time.
 */
export function penDrawing(g, strokes, t0, t1, { name = 'Pen drawing', color = C.sepia, w = 3.4, lift = 0.05, opacity = 1 } = {}) {
  const grp = svg('g', { 'data-name': name }, g);
  const items = [];
  strokes.forEach((s, i) => {
    const seed = s.seed ?? i + 1;
    const geo = s.d ? { d: s.d, len: s.len ?? 200 } : sketch(s.pts, { seed, jit: s.jit ?? 1.6, over: s.over ?? 6, closed: s.closed, smooth: s.smooth ?? true });
    const p = svg('path', { d: geo.d, fill: 'none', stroke: s.color ?? color, 'stroke-width': s.w ?? w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, opacity: 0 }, grp);
    items.push({ p, len: geo.len, op: (s.opacity ?? 1) * opacity });
    if (s.pass2) {
      const g2 = s.d ? geo : sketch(s.pts, { seed: seed + 977, jit: (s.jit ?? 1.6) * 1.3, over: (s.over ?? 6) * 0.6, closed: s.closed });
      const p2 = svg('path', { d: g2.d, fill: 'none', stroke: s.color ?? color, 'stroke-width': (s.w ?? w) * 0.7, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, opacity: 0 }, grp);
      items.push({ p: p2, len: g2.len * 0.8, op: 0.62 * (s.opacity ?? 1) * opacity });
    }
  });
  const total = items.reduce((a, b) => a + b.len, 0);
  const avail = Math.max(0.05, t1 - t0 - lift * (items.length - 1));
  let t = t0;
  for (const it of items) { it.a = t; it.b = t + (it.len / total) * avail; t = it.b + lift; }
  let last = -1;
  return {
    el: grp,
    update(tg) {
      const key = Math.round(clamp((tg - t0) / Math.max(1e-6, t1 - t0), -0.01, 1.01) * 3000);
      if (key === last) return; last = key;
      for (const it of items) {
        const q = clamp((tg - it.a) / Math.max(1e-6, it.b - it.a));
        const e = ease.inOutSine(q) * 0.25 + q * 0.75; // pen: nearly constant speed, soft start/stop
        it.p.setAttribute('stroke-dashoffset', (1 - e).toFixed(4));
        it.p.setAttribute('opacity', q > 0 ? it.op : 0);
      }
    },
  };
}

/** Static pencil underdrawing (already on the page): light, scratchy, several passes. */
export function pencil(g, strokes, { name = 'Pencil underdrawing', opacity = 0.42 } = {}) {
  const grp = svg('g', { 'data-name': name, opacity }, g);
  strokes.forEach((s, i) => {
    for (let k = 0; k < (s.passes ?? 2); k++) {
      const geo = sketch(s.pts, { seed: (s.seed ?? i + 50) + k * 311, jit: s.jit ?? 3.5, over: s.over ?? 12, closed: s.closed });
      svg('path', { d: geo.d, fill: 'none', stroke: C.pencil, 'stroke-width': s.w ?? 1.6, 'stroke-linecap': 'round', opacity: k ? 0.6 : 1 }, grp);
    }
  });
  return grp;
}

/* ---------- handwriting ---------- */
/**
 * Handwritten text, revealed letter by letter left → right (each letter wiped in, like a nib moving).
 * Every letter has its own fixed tilt / baseline / size (seeded), so repeated letters never look identical.
 */
export function hand(parent, text, { x, y, size = 56, color = C.sepia, seed = 1, rot = 0, t0 = 0, cps = 16, name, weight = 500, lineH = 1.12, opacity = 1, z = 6, slant = -4, w = null, align = 'left' } = {}) {
  const box = el('div', { 'data-name': name ?? `Note “${text.replace(/\n/g, ' ')}”`, style: {
    position: 'absolute', left: x + 'px', top: y + 'px', fontFamily: FONT.hand, fontWeight: weight, fontSize: size + 'px', lineHeight: lineH,
    color, whiteSpace: 'pre', transform: `rotate(${rot}deg)`, transformOrigin: '0 0', zIndex: z, opacity, fontKerning: 'normal', textAlign: align, ...(w ? { width: w + 'px' } : {}),
  } }, parent);
  const letters = [];
  let i = 0;
  for (const line of text.split('\n')) {
    const ln = el('div', {}, box);
    for (const ch of line) {
      const k = seed * 1000 + i;
      const sp = el('span', { style: { display: 'inline-block', whiteSpace: 'pre',
        transform: `translateY(${((r1(k) - 0.5) * size * 0.07).toFixed(2)}px) rotate(${((r1(k + 7) - 0.5) * 7).toFixed(2)}deg) scale(${(1 + (r1(k + 13) - 0.5) * 0.08).toFixed(3)}) skewX(${slant}deg)`,
        marginRight: ((r1(k + 19) - 0.5) * size * 0.03).toFixed(2) + 'px' } }, ln, ch);
      letters.push({ sp, w: ch === ' ' ? 0.5 : 1 }); i++;
    }
    letters.push({ sp: null, w: 1.5 }); // pen moves to the next line
  }
  const tot = letters.reduce((a, b) => a + b.w, 0);
  let acc = 0;
  for (const L of letters) { L.a = t0 + acc / cps; acc += L.w; L.b = t0 + acc / cps; }
  const t1 = t0 + tot / cps;
  let last = null;
  return {
    el: box, t1,
    update(tg) {
      const key = tg < t0 ? -1 : tg > t1 ? 1e9 : Math.round(tg * 60);
      if (key === last) return; last = key;
      for (const L of letters) {
        if (!L.sp) continue;
        const q = clamp((tg - L.a) / (L.b - L.a));
        L.sp.style.visibility = q > 0 ? 'visible' : 'hidden';
        L.sp.style.clipPath = q > 0 && q < 1 ? `inset(-30% ${((1 - q) * 100).toFixed(1)}% -30% -10%)` : 'none';
      }
    },
  };
}

/* ---------- watercolour wash (canvas, precomputed fields) ---------- */
const maskCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/**
 * A wash that BLOOMS from a point where the brush touches, spreads fast, slows, then dries lighter.
 * Pigment: granulation + blotches + darker dried edge (the tide line). Multiply blend over pen and paper.
 * path: SVG path string in page units (the wet area — loose, a little outside the pen line).
 */
export function wash(parent, { path, color = C.payne, x = 0, y = 0, w = PAGE_W, h = PAGE_H, seed = 1, origin, t0, dur = 1.0, density = 0.55,
  blur = 10, rag = 0.55, edge = 0.9, res = 0.6, name = 'Wash', z = 4, gran = 0.36, grad = null, backrun = 0.35, gaps = 0 }) {
  const cw = Math.max(2, Math.round(w * res)), ch = Math.max(2, Math.round(h * res));
  const cv = el('canvas', { 'data-name': name, width: cw, height: ch, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', mixBlendMode: 'multiply', zIndex: z, pointerEvents: 'none' } }, parent);
  const m = maskCanvas(cw, ch), mg = m.getContext('2d');
  mg.scale(res, res); mg.translate(-x, -y);
  mg.filter = `blur(${blur * res}px)`;
  mg.fillStyle = '#fff'; mg.fill(new Path2D(path));
  const md = mg.getImageData(0, 0, cw, ch).data;
  const N = cw * ch, base = new Float32Array(N), arr = new Float32Array(N);
  const [ox, oy] = origin ?? [x + w / 2, y + h / 2];
  let R = 1; for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) R = Math.max(R, Math.hypot(cx - ox, cy - oy));
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const k = j * cw + i, mv = md[k * 4 + 3] / 255;
    if (mv < 0.12) { base[k] = 0; arr[k] = 9; continue; }
    const X = x + i / res, Y = y + j / res;
    const th = 0.5 + (fbm(X * 0.018, Y * 0.018, seed, 3) - 0.5) * rag;         // ragged wet edge
    const inner = (mv - th);
    if (inner <= 0) { base[k] = 0; arr[k] = 9; continue; }
    const a = clamp(inner / 0.06);                                               // crisp dried edge
    const rim = 1 - clamp(inner / 0.16);                                         // pigment piles at the edge
    const blot = 0.72 + 0.56 * fbm(X * 0.006, Y * 0.006, seed + 3, 3);           // uneven load of the brush
    const g = 1 - gran / 2 + gran * vnoise(X * 0.55, Y * 0.55, seed + 9);        // granulation (pigment in paper tooth)
    const gr = grad ? lerp(grad.from, grad.to, clamp((Y - grad.y0) / (grad.y1 - grad.y0))) : 1; // graded wash (more pigment lower)
    // backruns: water crept back into a drying patch → paler pool with a dark cauliflower edge
    const bn = fbm(X * 0.017, Y * 0.017, seed + 21, 3), bt = 0.66, nearEdge = inner < 0.3;
    const br = backrun && nearEdge ? (bn > bt ? 1 - backrun : 1) + (Math.abs(bn - bt) < 0.01 ? backrun * 1.3 : 0) : 1;
    // dry-brush gaps: the brush skipped over the paper tooth (white flecks), only where asked
    const gap = gaps && vnoise(X * 0.09, Y * 0.35, seed + 33) > 1 - gaps ? 0.15 : 1;
    base[k] = a * density * blot * g * gr * br * gap * (1 + edge * rim * rim);
    arr[k] = (Math.hypot(X - ox, Y - oy) / R) * 0.9 + (fbm(X * 0.011, Y * 0.011, seed + 5, 3) - 0.5) * 0.42;
  }
  const g2 = cv.getContext('2d'), img = g2.createImageData(cw, ch), px = img.data;
  const [cr, cg, cb] = color;
  for (let k = 0; k < N; k++) { px[k * 4] = cr; px[k * 4 + 1] = cg; px[k * 4 + 2] = cb; }
  let last = null;
  return {
    el: cv,
    update(tg) {
      const q = clamp((tg - t0) / dur);
      const r = q <= 0 ? -1 : 1.25 * (1 - Math.pow(1 - q, 2.4)) - 0.08;           // water runs fast, then slows
      const dry = clamp((tg - t0 - dur * 0.4) / (dur + 1.6));                    // wet → dry: lighter, edge sharpens
      const key = q <= 0 ? 'off' : `${r.toFixed(3)}|${dry.toFixed(2)}`;
      if (key === last) return; last = key;
      if (q <= 0) { g2.clearRect(0, 0, cw, ch); return; }
      const wet = 1 - dry;
      for (let k = 0; k < N; k++) {
        const b = base[k];
        if (b === 0) { px[k * 4 + 3] = 0; continue; }
        const f = clamp((r - arr[k]) / 0.045);
        if (f <= 0) { px[k * 4 + 3] = 0; continue; }
        const front = 1 - clamp((r - arr[k]) / 0.16);                            // wet front carries more pigment
        const a = b * f * (1 + 0.22 * wet + 0.55 * wet * front);
        px[k * 4 + 3] = a >= 1 ? 255 : a * 255;
      }
      g2.putImageData(img, 0, 0);
    },
  };
}

/* ---------- pasted things ---------- */
/** Torn-edge polygon (clip-path) for a w × h scrap; torn on the listed sides, cut straight on the others. */
export function tornClip(w, h, seed, torn = { r: true, b: true }) {
  const pts = [];
  const edge = (ax, ay, bx, by, isTorn, s) => {
    const n = isTorn ? Math.round(Math.hypot(bx - ax, by - ay) / 9) : 1;
    for (let i = 0; i < n; i++) {
      const q = i / n, nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny);
      const d = isTorn ? (fbm(q * 9, s, seed, 3) - 0.5) * 22 + (r1(seed * 51 + i + s * 97) - 0.5) * 6 : 0;
      pts.push([ax + (bx - ax) * q + (nx / l) * d, ay + (by - ay) * q + (ny / l) * d]);
    }
  };
  edge(0, 0, w, 0, torn.t, 1); edge(w, 0, w, h, torn.r, 2); edge(w, h, 0, h, torn.b, 3); edge(0, h, 0, 0, torn.l, 4);
  return `polygon(${pts.map(([a, b]) => `${a.toFixed(1)}px ${b.toFixed(1)}px`).join(',')})`;
}
/** A strip of masking tape (translucent, torn ends, fibres). */
export function tape(parent, { x, y, w = 190, h = 54, rot = 0, seed = 1, name = 'Masking tape', z = 8 }) {
  const t = el('div', { 'data-name': name, style: {
    position: 'absolute', left: x - w / 2 + 'px', top: y - h / 2 + 'px', width: w + 'px', height: h + 'px', transform: `rotate(${rot}deg)`, zIndex: z,
    background: `repeating-linear-gradient(${88 + r1(seed) * 4}deg, rgba(255,255,255,0.10) 0 2px, rgba(120,100,60,0.05) 2px 5px), ${C.tape}`,
    clipPath: tornClip(w, h, seed + 40, { l: true, r: true }), filter: 'drop-shadow(1px 2px 1.5px rgba(40,35,30,0.18))',
  } }, parent);
  return t;
}

/* ---------- paper texture (made once, cached for every page) ---------- */
let paperURL = null;
export function paperTexture() {
  if (paperURL) return paperURL;
  const w = 500, h = 700, c = maskCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j * w + i) * 4;
    const lo = (fbm(i * 0.012, j * 0.012, 11, 4) - 0.5) * 10;        // cloudy formation of the sheet
    const fib = (vnoise(i * 0.9, j * 0.08, 23) - 0.5) * 3.5;           // long fibres
    const tooth = (vnoise(i * 0.7, j * 0.7, 37) - 0.5) * 5;            // cold-press tooth
    const speck = hash2(i, j, 5) > 0.9993 ? -26 : 0;                   // a few inclusions
    const v = lo + fib + tooth + speck;
    d[k] = 241 + v; d[k + 1] = 232 + v; d[k + 2] = 211 + v * 1.1; d[k + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  paperURL = c.toDataURL('image/png');
  return paperURL;
}
let deskURL = null;
export function deskTexture() {
  if (deskURL) return deskURL;
  const w = 256, h = 256, c = maskCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j * w + i) * 4;
    const weave = ((i % 4 < 2) ^ (j % 4 < 2) ? 3 : -3) + (hash2(i, j, 3) - 0.5) * 7 + (hash2(i >> 3, j, 4) - 0.5) * 3;
    d[k] = 38 + weave; d[k + 1] = 44 + weave; d[k + 2] = 49 + weave; d[k + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  deskURL = c.toDataURL('image/png');
  return deskURL;
}
export { el, svg, clamp, lerp, ease };
