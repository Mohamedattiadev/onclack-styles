// RISO ZINE kit — "history, cut and printed by hand".
// Model: the zine is a physical object (paper tooth, centre fold, staples). Everything ON the pages is a two-ink
// risograph print of a hand-made paste-up: teal drum first, orange drum second, overprinting with multiply.
// Imperfection is designed once per object (seeded), never per frame: grain, ink starvation, roller banding,
// paste-up edge shadows. Only the second drum's misregistration drifts — slowly, the same for the whole sheet.
import { clamp, progress, spring, noise1 } from '/onclack-styles/engine/lib/anim.js';

export const F = 1 / 30;

/* ---------- tokens ---------- */
export const INK = {
  teal: { rgb: [0, 120, 128], css: '#007880' },    // drum 1 — master plate (registered to the paper)
  orange: { rgb: [255, 102, 44], css: '#FF662C' }, // drum 2 — lands second, misregistered
};
export const PAPER = '#F0EBDD';   // uncoated recycled cream stock
export const DESK = '#25221E';    // the table the zine lies on (only at the frame edges)
export const FONT = {
  cut: "'Bricolage Grotesque', sans-serif", // 800: headline words, cut out as strips
  mono: "'IBM Plex Mono', monospace",       // 400/500: typed captions (a typewritten paste-up)
};

/* ---------- motion tokens (cubic bezier) ---------- */
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
export const tw = (t, a, b, from, to, e = ez.enter) => from + (to - from) * e(progress(t, a, b));

/* ---------- words ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Scene-local start of the nth word matching w. */
export function wordT(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.wordsIn().filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fallback;
}

/* ---------- seeded noise (integer hash + value noise) ---------- */
export function hash(x, y, s) {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
export function vnoise(x, y, cell, s) {
  const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}
const sstep = (a, b, v) => { const p = clamp((v - a) / (b - a)); return p * p * (3 - 2 * p); };
export const r01 = (seed, i = 0) => hash(seed, i, 917);      // seeded 0..1
export const rpm = (seed, i = 0) => r01(seed, i) * 2 - 1;     // seeded −1..1

/* ---------- one ink layer: draw greys (black = full ink) → riso grain in one spot colour ---------- */
/**
 * draw(g, w, h) paints in greys on white. The result is a canvas of ink colour with stochastic grain,
 * ink starvation (soft low-frequency patches), roller banding along the feed direction and pinholes in solids.
 * opts: ink 'teal'|'orange', seed, u (layout unit), grain (design px), starve 0..1, gamma, gain, alpha
 */
export function inkLayer(w, h, draw, o = {}) {
  w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
  const { ink = 'teal', seed = 1, u = 1, grain = 2.4, starve = 0.38, gamma = 1, gain = 1, alpha = 0.9, lo = 0, fine = 0.4 } = o;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#000'; g.strokeStyle = '#000';
  draw(g, w, h);
  const img = g.getImageData(0, 0, w, h), d = img.data;
  const [R, G, B] = INK[ink].rgb;
  const big = 300 * u, mid = 70 * u, band = 34 * u, gc = grain * u;
  const s1 = seed * 7 + 1, s2 = seed * 7 + 2, s3 = seed * 7 + 3, s4 = seed * 7 + 4, s5 = seed * 7 + 5;
  for (let y = 0; y < h; y++) {
    const bandK = 1 - 0.07 * vnoise(0, y, band, s3);          // drum roller: faint bands across the feed
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let v = (255 - d[i]) / 255;
      d[i] = R; d[i + 1] = G; d[i + 2] = B;
      if (v < 0.01) { d[i + 3] = 0; continue; }
      if (lo) { v = (v - lo) / (1 - lo); if (v <= 0) { d[i + 3] = 0; continue; } }
      v = Math.pow(v, gamma) * gain * bandK;
      const n = 0.62 * vnoise(x, y, big, s1) + 0.38 * vnoise(x, y, mid, s2);
      v *= 1 - starve * sstep(0.5, 0.86, n);                   // ink starvation patches
      let thr = (1 - fine) * vnoise(x, y, gc, s4) + fine * hash(x, y, s5);
      thr = clamp((thr - 0.5) * 1.75 + 0.5);
      const a = clamp((v * 1.07 - thr) * 3.2 + 0.5);
      d[i + 3] = a * alpha * 255;
    }
  }
  g.putImageData(img, 0, 0);
  Object.assign(cv.style, { position: 'absolute', left: '0px', top: '0px', width: w + 'px', height: h + 'px', mixBlendMode: 'multiply' });
  return cv;
}

/* ---------- canvas drawing helpers for the paste-up (greys only) ---------- */
export function grey(v) { const c = Math.round(255 * (1 - clamp(v))); return `rgb(${c},${c},${c})`; } // v = ink density
export function setFont(g, { family = FONT.cut, size = 40, weight = 800, track = 0, style = 'normal' } = {}) {
  g.font = `${style} ${weight} ${size}px ${family}`;
  g.letterSpacing = `${track}px`;
  g.textBaseline = 'alphabetic';
}
const mctx = document.createElement('canvas').getContext('2d');
/** Measure text: { w, asc, desc } in px. */
export function measure(str, f) {
  setFont(mctx, f);
  const m = mctx.measureText(str);
  return { w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
}
/** Largest size (≤ max) so str fits width. */
export function fitSize(str, f, maxW, max) {
  const w1 = measure(str, { ...f, size: 100 }).w;
  return Math.min(max, (100 * maxW) / w1);
}
export function pathFrom(pts) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}
/** Torn-paper outline (all four sides torn, or some sides scissor-cut). Returns points. */
export function tornPts(x, y, w, h, seed, u, { amp = 7, step = 5, torn = [1, 1, 1, 1] } = {}) {
  const pts = [];
  const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  for (let s = 0; s < 4; s++) {
    const [ax, ay] = corners[s], [bx, by] = corners[(s + 1) % 4];
    const len = Math.hypot(bx - ax, by - ay), nx = (by - ay) / len, ny = -(bx - ax) / len; // outward normal
    const n = torn[s] ? Math.max(2, Math.round(len / (step * u))) : 2;
    for (let k = 0; k < n; k++) {
      const f = k / n, px = ax + (bx - ax) * f, py = ay + (by - ay) * f;
      let off = 0;
      if (torn[s]) {
        off = amp * u * ((vnoise(f * len, 0, 46 * u, seed * 13 + s) - 0.5) * 1.6 + (hash(k, s, seed) - 0.5) * 0.7);
        if (k === 0) off *= 0.3;
      } else if (k === 0) off = (hash(s, 9, seed) - 0.5) * 3 * u;
      pts.push([px + nx * off, py + ny * off]);
    }
  }
  return pts;
}
/** Scissor-cut strip: 4 corners with small angle errors (straight cuts). */
export function cutPts(x, y, w, h, seed, u, k = 1) {
  const j = i => rpm(seed, i) * 5 * u * k;
  return [[x + j(1), y + j(2)], [x + w + j(3), y + j(4)], [x + w + j(5), y + h + j(6)], [x + j(7), y + h + j(8)]];
}
/** Paste-up: the printed edge shadow of a pasted scrap (light from upper left), then a white knock-out inside. */
export function pasteShadow(g, path, u, dens = 0.75) {
  g.save();
  g.fillStyle = grey(dens);
  g.translate(2.2 * u, 3 * u); g.fill(path);
  g.restore();
  g.save(); g.fillStyle = '#fff'; g.fill(path); g.restore();
}
/** Printed masking tape: a light tint with torn short ends, rotated. Draw into a layer. */
export function tape(g, cx, cy, len, wid, rot, seed, u, dens = 0.26) {
  g.save();
  g.translate(cx, cy); g.rotate((rot * Math.PI) / 180);
  const pts = [];
  const n = 7;
  for (let i = 0; i <= n; i++) pts.push([-len / 2 + rpm(seed, i) * 2.5 * u, -wid / 2 + (wid * i) / n]);
  for (let i = n; i >= 0; i--) pts.push([len / 2 + rpm(seed, 20 + i) * 2.5 * u, -wid / 2 + (wid * i) / n]);
  g.fillStyle = grey(dens);
  g.fill(pathFrom(pts));
  g.restore();
}
/** Text on the paste-up (greys). */
export function text(g, str, x, y, f, dens = 1, align = 'left') {
  setFont(g, f);
  g.textAlign = align;
  g.fillStyle = grey(dens);
  g.fillText(str, x, y);
}
/** Photo separated for one drum: greyscale + curve chosen per drum. Clipped to path. */
export function photo(g, img, path, box, { focus = [0.5, 0.5], zoom = 1, contrast = 1.35, bright = 1.02 } = {}) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(box.w / iw, box.h / ih) * zoom, dw = iw * s, dh = ih * s;
  const ox = box.x + Math.min(0, Math.max(box.w - dw, box.w * 0.5 - dw * focus[0]));
  const oy = box.y + Math.min(0, Math.max(box.h - dh, box.h * 0.5 - dh * focus[1]));
  g.save();
  g.clip(path);
  g.filter = `grayscale(1) contrast(${contrast}) brightness(${bright})`;
  g.drawImage(img, ox, oy, dw, dh);
  g.restore();
}

/* ---------- hand-cut letters (scissors = straight cuts, every vertex a little off) ---------- */
const LETTERS = {
  N: { w: 1, polys: [[[0, 0], [0.28, 0], [0.72, 0.66], [0.72, 0], [1, 0], [1, 1.2], [0.73, 1.2], [0.28, 0.53], [0.28, 1.2], [0, 1.2]]] },
  O: { w: 1.08, ring: true },
  '.': { w: 0.34, polys: [[[0.02, 0.9], [0.3, 0.88], [0.32, 1.19], [0.04, 1.2]]] },
};
/** Polygons (px) for a word cut by hand; each letter rotated a little. size = cap height / 1.2 units. */
export function cutWord(word, x, y, size, seed, { gap = 0.1, rot = 2.4 } = {}) {
  const out = [];
  let cx = x;
  [...word].forEach((ch, li) => {
    const L = LETTERS[ch];
    const sd = seed * 31 + li;
    let polys;
    if (L.ring) {
      const ring = (n, rx, ry, cxu, cyu, k) => Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + rpm(sd, 50 + i + k) * 0.08;
        const r = 1 + rpm(sd, i + k) * 0.035;
        return [cxu + Math.cos(a) * rx * r, cyu + Math.sin(a) * ry * r];
      });
      polys = [ring(14, 0.54, 0.6, 0.54, 0.6, 0), ring(9, 0.25, 0.34, 0.55, 0.6, 30).reverse()];
    } else polys = L.polys;
    const ang = (rpm(sd, 99) * rot * Math.PI) / 180, ccx = (L.w / 2), ccy = 0.6;
    const pp = polys.map(poly => poly.map(([px, py], i) => {
      const jx = px + rpm(sd, 200 + i) * 0.022, jy = py + rpm(sd, 300 + i) * 0.022;
      const dx = jx - ccx, dy = jy - ccy;
      const rx = ccx + dx * Math.cos(ang) - dy * Math.sin(ang), ry = ccy + dx * Math.sin(ang) + dy * Math.cos(ang);
      return [cx + rx * size, y + (ry + rpm(sd, 7) * 0.02) * size];
    }));
    out.push(pp);
    cx += (L.w + gap) * size;
  });
  return { letters: out, width: cx - x - gap * size };
}
export function cutWordWidth(word, size, gap = 0.1) {
  return [...word].reduce((a, ch) => a + (LETTERS[ch].w + gap) * size, -gap * size);
}
export function fillLetters(g, letters, dens = 1, offset = [0, 0]) {
  g.save(); g.translate(offset[0], offset[1]); g.fillStyle = grey(dens);
  for (const polys of letters) {
    const p = new Path2D();
    for (const poly of polys) poly.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    g.fill(p, 'evenodd');
  }
  g.restore();
}

/* ---------- the zine (physical: paper, fold, staples, page stack) ---------- */
const zineCache = new Map();
function zineCanvas(L) {
  const key = `${L.width}x${L.height}`;
  if (zineCache.has(key)) return zineCache.get(key);
  const W = L.width, H = L.height, u = L.unit, P = L.portrait;
  const k = 0.5; // half resolution: paper tooth is soft anyway
  const cw = Math.round(W * k), ch = Math.round(H * k);
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const geo = zineGeo(L);
  // desk
  g.fillStyle = DESK; g.fillRect(0, 0, cw, ch);
  const pg = { x: geo.x * k, y: geo.y * k, w: geo.w * k, h: geo.h * k };
  // page stack under the spread (2 sheets peeking out at the outer edges)
  for (let i = 3; i >= 1; i--) {
    g.fillStyle = i === 3 ? '#cfc8b8' : i === 2 ? '#ddd6c6' : '#e7e1d3';
    const o = i * 2.2 * u * k;
    if (P) g.fillRect(pg.x, pg.y + o * 0.3, pg.w + o, pg.h);
    else g.fillRect(pg.x - o, pg.y + o * 0.3, pg.w + 2 * o, pg.h);
  }
  // soft cast shadow on the desk
  g.save();
  g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowBlur = 34 * u * k; g.shadowOffsetY = 12 * u * k;
  g.fillStyle = PAPER; g.fillRect(pg.x, pg.y, pg.w, pg.h);
  g.restore();
  g.fillStyle = PAPER; g.fillRect(pg.x, pg.y, pg.w, pg.h);
  // paper tooth + fold shading (per pixel, inside the page)
  const img = g.getImageData(0, 0, cw, ch), d = img.data;
  const foldX = geo.fold * k, x0 = Math.floor(pg.x), x1 = Math.ceil(pg.x + pg.w), y0 = Math.floor(pg.y), y1 = Math.ceil(pg.y + pg.h);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * cw + x) * 4;
    const tooth = 1 + 0.03 * (vnoise(x, y, 9 * u * k, 71) - 0.5) + 0.022 * (hash(x, y, 72) - 0.5) + 0.02 * (vnoise(x, y, 120 * u * k, 73) - 0.5);
    const dx = (x - foldX) / (u * k);
    let fold = 1 - 0.13 * Math.exp(-((dx / 16) ** 2)) - 0.05 * Math.exp(-((dx / 110) ** 2));
    if (P && dx < 0) fold = 1;
    const ridge = 1 + 0.02 * Math.exp(-(((Math.abs(dx) - 26) / 8) ** 2)); // the paper lifts a little beside the fold
    const edge = 1 - 0.035 * Math.exp(-((Math.min(x - pg.x, pg.x + pg.w - x, y - pg.y, pg.y + pg.h - y) / (u * k * 22)) ** 2));
    const m = tooth * fold * ridge * edge;
    d[i] = Math.min(255, d[i] * m); d[i + 1] = Math.min(255, d[i + 1] * m); d[i + 2] = Math.min(255, d[i + 2] * m * 0.995);
  }
  g.putImageData(img, 0, 0);
  // fibres: short faint strokes, seeded
  g.lineWidth = Math.max(0.5, 0.9 * u * k);
  for (let i = 0; i < 520; i++) {
    const x = pg.x + r01(81, i) * pg.w, y = pg.y + r01(82, i) * pg.h, a = r01(83, i) * Math.PI * 2, l = (4 + 10 * r01(84, i)) * u * k;
    g.strokeStyle = r01(85, i) > 0.5 ? 'rgba(120,108,88,0.13)' : 'rgba(255,255,250,0.35)';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.6, y + Math.sin(a + 0.6) * l * 0.6, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // staples on the fold (steel: dark edge, light centre)
  for (const fy of geo.staples) {
    const sx = foldX + (P ? 7 * u * k : 0), sy = fy * k, sw = 5 * u * k, sh = 52 * u * k;
    g.fillStyle = 'rgba(40,34,26,0.28)'; g.fillRect(sx - sw / 2 + 1.5 * u * k, sy - sh / 2 + 2 * u * k, sw, sh);
    g.fillStyle = '#8d8a84'; g.fillRect(sx - sw / 2, sy - sh / 2, sw, sh);
    g.fillStyle = '#d9d6cf'; g.fillRect(sx - sw * 0.15, sy - sh / 2 + 1, sw * 0.3, sh - 2);
  }
  zineCache.set(key, cv);
  return cv;
}
/** Geometry of the open zine in frame px. */
export function zineGeo(L) {
  const W = L.width, H = L.height, u = L.unit;
  if (L.portrait) {
    const x = Math.round(26 * u), y = Math.round(40 * u), w = Math.round(W - 46 * u), h = Math.round(H - 76 * u);
    return { x, y, w, h, fold: x, staples: [y + h * 0.22, y + h * 0.78] };
  }
  const x = Math.round(46 * u), y = Math.round(30 * u), w = W - 2 * x, h = H - 2 * y;
  return { x, y, w, h, fold: W / 2, staples: [y + h * 0.24, y + h * 0.76] };
}

/**
 * Mount one spread for a scene. Returns { cam, geo, mis(t), jolt(times) }.
 * mis(t) = misregistration of the orange drum for THIS sheet: a fixed offset (2–6 px) + a slow drift.
 */
export function spread(root, ctx, { seed = 1, folio = ['', ''] } = {}) {
  const L = ctx.layout, u = L.unit;
  const cam = document.createElement('div');
  cam.dataset.name = 'Camera';
  Object.assign(cam.style, { position: 'absolute', left: 0, top: 0, width: L.width + 'px', height: L.height + 'px', transformOrigin: '50% 50%' });
  root.appendChild(cam);
  const bg = zineCanvas(L);
  const c = document.createElement('canvas');
  c.width = L.width; c.height = L.height; c.dataset.name = 'Zine spread (paper)';
  c.getContext('2d').drawImage(bg, 0, 0, L.width, L.height);
  Object.assign(c.style, { position: 'absolute', left: 0, top: 0, width: L.width + 'px', height: L.height + 'px' });
  cam.appendChild(c);
  const geo = zineGeo(L);
  const base = [(3 + 2.2 * r01(seed, 1)) * (r01(seed, 2) > 0.4 ? 1 : -1) * u, (2 + 2 * r01(seed, 3)) * (r01(seed, 4) > 0.5 ? 1 : -1) * u];
  const mis = t => [base[0] + noise1(t * 0.32, seed * 3.1) * 1.1 * u, base[1] + noise1(t * 0.27, seed * 5.7) * 0.9 * u];
  return { cam, geo, mis, u };
}

/**
 * A printed item: a box on the page holding one ink layer per drum.
 * layers: [{ ink, at, draw, ...inkOpts }] — teal layer first, orange second.
 * "The pass": each layer is wiped on along the paper feed (top → bottom, 6 f); the orange layer lands
 * off-register and snaps (spring) to the sheet's misregistration.
 */
export function printed(parent, sheet, { name, x, y, w, h, rot = 0, seed = 1, layers, u = sheet.u }) {
  const box = document.createElement('div');
  box.dataset.name = name;
  Object.assign(box.style, { position: 'absolute', left: x + 'px', top: y + 'px', width: Math.ceil(w) + 'px', height: Math.ceil(h) + 'px', transform: `rotate(${rot}deg)`, transformOrigin: '50% 50%' });
  parent.appendChild(box);
  const ls = layers.map((l, i) => {
    const cv = inkLayer(w, h, l.draw, { u, seed: seed * 10 + i, ...l });
    cv.dataset.name = `${name} · ${l.ink} drum`;
    box.appendChild(cv);
    const kick = [(10 + 6 * r01(seed, 30 + i)) * u * (r01(seed, 31) > 0.5 ? 1 : -1), (7 + 5 * r01(seed, 32 + i)) * u * (r01(seed, 33) > 0.5 ? 1 : -1)];
    return { ...l, cv, kick, dur: l.dur ?? 6 * F };
  });
  return {
    box, layers: ls,
    /** Landing times of the second drum (for page jolts / SFX). */
    lands: ls.filter(l => l.ink === 'orange').map(l => l.at + l.dur * 0.7),
    update(t) {
      for (const l of ls) {
        if (t < l.at) { l.cv.style.visibility = 'hidden'; continue; }
        l.cv.style.visibility = 'visible';
        const p = ez.enter(progress(t, l.at, l.at + l.dur));
        l.cv.style.clipPath = p >= 1 ? 'none' : `inset(0 0 ${((1 - p) * 100).toFixed(2)}% 0)`;
        if (l.ink === 'orange') {
          const m = sheet.mis(t), s = 1 - spring(t - l.at, { stiffness: 420, damping: 30 });
          l.cv.style.transform = `translate(${(m[0] + l.kick[0] * s).toFixed(2)}px, ${(m[1] + l.kick[1] * s).toFixed(2)}px)`;
        }
      }
    },
  };
}
/** One-sided page jolt when a drum lands (decays in ~4 f, never alternates). Returns px. */
export function jolt(t, times, amp) {
  let v = 0;
  for (const T of times) { const dt = t - T; if (dt >= 0 && dt < 0.25) v += amp * Math.exp(-dt / 0.045); }
  return v;
}

/** Content columns: landscape → left/right page; portrait → one column (both = same). */
export function columns(L) {
  const u = L.unit, s = L.safe, geo = zineGeo(L);
  if (L.portrait) {
    const col = { x: s.x + 14 * u, w: s.w - 14 * u };
    return { left: col, right: col, top: s.y + 10 * u, bottom: s.y + s.h };
  }
  return {
    left: { x: s.x + 26 * u, w: geo.fold - 72 * u - (s.x + 26 * u) },
    right: { x: geo.fold + 72 * u, w: s.x + s.w - 26 * u - (geo.fold + 72 * u) },
    top: s.y + 26 * u, bottom: s.y + s.h - 10 * u,
  };
}
/** Pre-printed page furniture: folio numbers + running head (already on the sheet when we arrive). */
export function furniture(parent, sheet, L, { page = 2, head = 'B-59 / 27.X.1962', seed = 5 }) {
  const u = L.unit, geo = zineGeo(L), s = L.safe;
  const f = { family: FONT.mono, size: 22 * u, weight: 500, track: 1.5 * u };
  const items = [];
  const mk = (name, str, x, y, align) => {
    const m = measure(str, f), w = m.w + 8 * u, h = 34 * u;
    const bx = align === 'right' ? x - w : x;
    items.push(printed(parent, sheet, { name, x: bx, y, w, h, seed: seed + items.length, layers: [{ ink: 'teal', at: -1, starve: 0.2, draw: g => text(g, str, align === 'right' ? w - 4 * u : 4 * u, 26 * u, f, 1, align) }] }));
  };
  const yb = geo.y + geo.h - 50 * u;
  if (L.portrait) {
    mk('Folio', `— ${String(page).padStart(2, '0')} —`, geo.x + geo.w - 40 * u, yb, 'right');
    mk('Running head', head, geo.x + geo.w - 40 * u, geo.y + 28 * u, 'right');
  } else {
    mk('Folio left', `${String(page).padStart(2, '0')}`, geo.x + 44 * u, yb, 'left');
    mk('Folio right', `${String(page + 1).padStart(2, '0')}`, geo.x + geo.w - 44 * u, yb, 'right');
    mk('Running head', head, geo.x + 44 * u, geo.y + 24 * u, 'left');
  }
  return { update: t => items.forEach(i => i.update(t)) };
}
