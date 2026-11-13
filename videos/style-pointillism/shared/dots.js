// DOT PAINTING engine for the style test. Pure function of time.
// A picture = a list of brush dabs {x, y, r, rot, ci, v, t0} in frame px (world coords).
// Dabs are pre-rendered sprites (one per pigment × 4 shapes) stamped with drawImage.
// Speed: dabs that have fully landed are kept in a cache canvas (linen + dabs, prefix of the
// time-sorted list). Same t → same pixels: if t goes back, the cache is rebuilt from zero.

// ---------- pigments (pure tube colours, no black, no mixing on the palette) ----------
export const PIG = {
  lemon: '#F3DC3C', yellow: '#F0B323', orange: '#E8731E', vermilion: '#D93A22', crimson: '#A51E3B',
  violet: '#5E3C99', dviolet: '#3B2366', ultra: '#2B3B9C', dultra: '#1B2266', cobalt: '#2D69B8',
  cerulean: '#3D9FD0', viridian: '#17836F', emerald: '#4AAE6A', white: '#F6F1E4',
};
export const PIG_NAMES = Object.keys(PIG);
export const CI = Object.fromEntries(PIG_NAMES.map((n, i) => [n, i]));
export const LINEN = '#E4D8BF';
export const GRAPHITE = '#5E5A55';
export const F = 1 / 30;

// ---------- deterministic PRNG ----------
export function prng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** pick a pigment index from weights [['cobalt', 3], ['white', 1]] */
export function mix(weights, r) {
  let s = 0; for (const w of weights) s += w[1];
  let x = r * s;
  for (const w of weights) { x -= w[1]; if (x <= 0) return CI[w[0]]; }
  return CI[weights[weights.length - 1][0]];
}
/** blend two weight lists, p = 0 → a, 1 → b */
export function blend(a, b, p) {
  const m = new Map();
  for (const [n, w] of a) m.set(n, (m.get(n) ?? 0) + w * (1 - p));
  for (const [n, w] of b) m.set(n, (m.get(n) ?? 0) + w * p);
  return [...m.entries()];
}

// ---------- geometry ----------
export const clamp01 = v => Math.max(0, Math.min(1, v));
export function inPoly(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
export const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
export function segDist(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp01(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}
/** map polygon from local (u along, v across) to world */
export const place = (pts, x0, y0, sx, sy) => pts.map(([u, v]) => [x0 + u * sx, y0 + v * sy]);

// ---------- sprites ----------
const SPR = 64;
let SPRITES = null;
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function shade(h, k) { const [r, g, b] = hexRgb(h); const f = c => Math.round(Math.max(0, Math.min(255, k > 0 ? c + (255 - c) * k : c * (1 + k)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
export function sprites() {
  if (SPRITES) return SPRITES;
  SPRITES = PIG_NAMES.map((name, ci) => [0, 1, 2, 3].map(v => {
    const c = document.createElement('canvas'); c.width = c.height = SPR;
    const g = c.getContext('2d');
    const R = prng(1000 + ci * 17 + v * 131);
    // dab outline: an egg (loaded end right, dry tail left) with a ragged edge
    const N = 22, pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const egg = 1 + 0.16 * Math.cos(a);
      const rr = (1 + (R() - 0.5) * 0.16) * egg;
      pts.push([SPR / 2 + Math.cos(a) * SPR * 0.38 * rr, SPR / 2 + Math.sin(a) * SPR * 0.2 * rr * (0.9 + 0.2 * R())]);
    }
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.fillStyle = PIG[name]; g.fill();
    g.save(); g.clip();
    // impasto: light ridge upper-left (key light), shadowed lip lower-right
    const hl = g.createRadialGradient(SPR * 0.38, SPR * 0.36, 1, SPR * 0.38, SPR * 0.36, SPR * 0.3);
    hl.addColorStop(0, 'rgba(255,252,240,0.2)'); hl.addColorStop(1, 'rgba(255,252,240,0)');
    g.fillStyle = hl; g.fillRect(0, 0, SPR, SPR);
    g.strokeStyle = shade(PIG[name], -0.35); g.globalAlpha = 0.3; g.lineWidth = 2.5;
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + 1.2, y + 1.6) : g.moveTo(x + 1.2, y + 1.6))); g.closePath(); g.stroke();
    // bristle grooves along the stroke
    g.globalAlpha = 0.22; g.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const yy = SPR * (0.4 + 0.07 * k) + (R() - 0.5) * 3;
      g.strokeStyle = k % 2 ? shade(PIG[name], 0.35) : shade(PIG[name], -0.25);
      g.beginPath(); g.moveTo(SPR * 0.18, yy); g.quadraticCurveTo(SPR * 0.5, yy + (R() - 0.5) * 4, SPR * 0.86, yy + (R() - 0.5) * 3); g.stroke();
    }
    // variant 3: a streak of white picked up from a wet neighbour
    if (v === 3 && name !== 'white') {
      g.globalAlpha = 0.35; g.strokeStyle = PIG.white; g.lineWidth = 3.2;
      g.beginPath(); g.moveTo(SPR * 0.22, SPR * 0.47); g.quadraticCurveTo(SPR * 0.5, SPR * 0.42, SPR * 0.8, SPR * 0.5); g.stroke();
    }
    g.restore();
    return c;
  }));
  return SPRITES;
}

// ---------- linen ground (+ painter's squaring grid in graphite) ----------
export function makeLinen(W, H, seed, grid) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = LINEN; g.fillRect(0, 0, W, H);
  const R = prng(seed);
  // weave: fine horizontal + vertical threads with slubs
  const step = Math.max(2, Math.round(W / 640));
  for (let y = 0; y < H; y += step) { g.fillStyle = `rgba(${R() < 0.5 ? '120,100,70' : '255,250,235'},${0.035 + R() * 0.05})`; g.fillRect(0, y, W, 1); }
  for (let x = 0; x < W; x += step) { g.fillStyle = `rgba(${R() < 0.5 ? '120,100,70' : '255,250,235'},${0.03 + R() * 0.04})`; g.fillRect(x, 0, 1, H); }
  for (let i = 0; i < (W * H) / 9000; i++) { g.fillStyle = `rgba(110,90,60,${0.05 + R() * 0.07})`; g.fillRect(R() * W, R() * H, 6 + R() * 26, 1.3); }
  // squaring-up grid (how a painter transfers a study): faint, slightly wobbly graphite lines
  if (grid) {
    const { x, y, w, h, cols, rows, lw } = grid;
    g.strokeStyle = GRAPHITE; g.lineWidth = lw; g.lineCap = 'round';
    const line = (x0, y0, x1, y1, a) => {
      g.globalAlpha = a; g.beginPath(); g.moveTo(x0, y0);
      const n = 6; for (let k = 1; k <= n; k++) { const p = k / n; g.lineTo(x0 + (x1 - x0) * p + (R() - 0.5) * lw * 0.9, y0 + (y1 - y0) * p + (R() - 0.5) * lw * 0.9); }
      g.stroke();
    };
    for (let i = 0; i <= cols; i++) { const xx = x + (w * i) / cols; line(xx, y - h * 0.03 * R(), xx, y + h + h * 0.03 * R(), 0.18 + R() * 0.1); }
    for (let j = 0; j <= rows; j++) { const yy = y + (h * j) / rows; line(x - w * 0.02 * R(), yy, x + w + w * 0.02 * R(), yy, 0.18 + R() * 0.1); }
    g.globalAlpha = 1;
  }
  return c;
}

// ---------- dab fields ----------
/**
 * Fill a rect with dabs on a jittered hex grid.
 * colorAt(x, y, r) → pigment index or -1 (skip) · key(x, y, r) → order key (smaller = earlier)
 * time: [a, b] window; arrival curve: first dabs one by one, then the field floods in (count ∝ u^pow).
 */
export function field({ x, y, w, h, sp, rScale = 0.66, colorAt, key, a, b, pow = 3, seed = 1, rot = () => 0, edge = 0 }) {
  const R = prng(seed);
  const out = [];
  const rowH = sp * 0.866;
  for (let j = 0, yy = y; yy <= y + h; j++, yy += rowH) {
    for (let xx = x + (j % 2 ? sp / 2 : 0); xx <= x + w; xx += sp) {
      const px = xx + (R() - 0.5) * sp * 0.7, py = yy + (R() - 0.5) * sp * 0.6;
      const rr = R(), rv = R(), rs = R(), ro = R();
      if (edge) { // ragged painted edge: dabs thin out near the rect border
        const d = Math.min(px - x, x + w - px, py - y, y + h - py);
        if (d < edge && R() > d / edge) continue;
      }
      const ci = colorAt(px, py, rr);
      if (ci < 0) continue;
      out.push({ x: px, y: py, r: sp * rScale * (0.82 + rs * 0.36), rot: rot(px, py) + (ro - 0.5) * 0.7, ci, v: (rv * 4) | 0, k: key(px, py, rr) });
    }
  }
  return schedule(out, a, b, pow);
}
export function schedule(out, a, b, pow = 3) {
  out.sort((p, q) => p.k - q.k);
  const N = out.length;
  out.forEach((d, i) => { d.t0 = a + (b - a) * Math.pow((i + 1) / N, 1 / pow); });
  return out;
}

/** sample a text mask: returns a function inside(x, y) for the text drawn at (x, y) with given font */
export function textMask(W, H, draw) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
  draw(g);
  const data = g.getImageData(0, 0, W, H).data;
  const at = (x, y) => { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < W && y < H ? data[(y * W + x) * 4 + 3] : 0; };
  return { inside: (x, y) => at(x, y) > 110, near: (x, y, d) => at(x, y) > 0 || at(x - d, y) > 0 || at(x + d, y) > 0 || at(x, y - d) > 0 || at(x, y + d) > 0 };
}

// ---------- the painter (canvas + camera + cache) ----------
const ARRIVE = 0.12;
export function painter(root, ctx, { linen, name = 'Dot painting', clip = null }) {
  const W = ctx.width, H = ctx.height;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  cv.dataset.name = name;
  Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
  if (clip) cv.style.clipPath = `inset(${clip.y}px ${W - clip.x - clip.w}px ${H - clip.y - clip.h}px ${clip.x}px)`;
  root.appendChild(cv);
  const g = cv.getContext('2d');
  const cache = document.createElement('canvas'); cache.width = W; cache.height = H;
  const cg = cache.getContext('2d');
  const S = sprites();
  let dots = [], count = -1, cz = 1, cox = 0, coy = 0;
  function stampCam(d, k, a) {
    const s = (d.r * 1.25 * k) / (SPR * 0.38) * cz;
    const c = Math.cos(d.rot) * s, sn = Math.sin(d.rot) * s;
    g.globalAlpha = a;
    g.setTransform(c, sn, -sn, c, d.x * cz + cox, d.y * cz + coy);
    g.drawImage(S[d.ci][d.v], -SPR / 2, -SPR / 2);
  }

  const stamp = (gg, d, k, alpha) => {
    const s = (d.r * 1.25 * k) / (SPR * 0.38);
    const c = Math.cos(d.rot) * s, sn = Math.sin(d.rot) * s;
    gg.globalAlpha = alpha;
    gg.setTransform(c, sn, -sn, c, d.x, d.y);
    gg.drawImage(S[d.ci][d.v], -SPR / 2, -SPR / 2);
  };
  const resetCache = () => { cg.setTransform(1, 0, 0, 1, 0, 0); cg.globalAlpha = 1; cg.drawImage(linen, 0, 0); count = 0; };

  return {
    canvas: cv,
    set(list) { dots = list.slice().sort((p, q) => p.t0 - q.t0); count = -1; },
    /** draw at time t. cam = { z, cx, cy } (world point at frame centre) */
    draw(t, cam = { z: 1, cx: W / 2, cy: H / 2 }, after) {
      const z = cam.z, ox = W / 2 - cam.cx * z, oy = H / 2 - cam.cy * z;
      cz = z; cox = ox; coy = oy;
      // landed = t0 + ARRIVE <= t  (prefix, since sorted by t0)
      let landed = 0; { let lo = 0, hi = dots.length; while (lo < hi) { const m = (lo + hi) >> 1; if (dots[m].t0 + ARRIVE <= t) lo = m + 1; else hi = m; } landed = lo; }
      let started = landed; while (started < dots.length && dots[started].t0 <= t) started++;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      if (z <= 1.25) {
        if (count < 0 || landed < count) resetCache();
        for (let i = count; i < landed; i++) stamp(cg, dots[i], 1, 1);
        count = landed;
        g.setTransform(z, 0, 0, z, ox, oy); g.drawImage(cache, 0, 0);
      } else {
        g.setTransform(z, 0, 0, z, ox, oy); g.drawImage(linen, 0, 0);
        const x0 = -ox / z - 40, x1 = (W - ox) / z + 40, y0 = -oy / z - 40, y1 = (H - oy) / z + 40;
        for (let i = 0; i < landed; i++) {
          const d = dots[i];
          if (d.x < x0 || d.x > x1 || d.y < y0 || d.y > y1) continue;
          stampCam(d, 1, 1);
        }
      }
      // dabs landing now: pressed down (big, faint → normal, full)
      for (let i = landed; i < started; i++) {
        const p = (t - dots[i].t0) / ARRIVE, e = 1 - (1 - p) * (1 - p);
        stampCam(dots[i], 1.35 - 0.35 * e, Math.min(1, 0.25 + 0.75 * e));
      }
      g.setTransform(z, 0, 0, z, ox, oy); g.globalAlpha = 1;
      after?.(g, z, ox, oy);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    },
    /** stamp one extra (moving) dab in world coords with the current camera — call inside draw's `after` */
    dab(d, k = 1, a = 1) { stampCam(d, k, a); },
  };
}

// ---------- small shared helpers ----------
export const smooth = p => { p = clamp01(p); return p * p * p * (p * (p * 6 - 15) + 10); };
export const glideT = (t, t0, t1, a, b) => a + (b - a) * smooth((t - t0) / (t1 - t0));
export function wordT(ctx, word, nth = 0, fallback = 0) {
  const ws = ctx.wordsIn().filter(w => w.word.toLowerCase().replace(/[^a-z-]/g, '') === word.toLowerCase());
  return ws[nth] ? ws[nth].start - ctx.start : fallback;
}
