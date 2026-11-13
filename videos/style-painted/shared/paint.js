// PAINTED SHORT — our own watercolour / ink toolkit for Canvas 2D.
// Every function is deterministic: randomness only from rand(seed) (anim.js). Line boil = a new seed per
// 12 fps drawing (boilIndex), never per render call. Backgrounds are painted ONCE at build time.
import { rand } from '/onclack-styles/engine/lib/anim.js';

export const TAU = Math.PI * 2;
export const BOIL_FPS = 12;
/** Index of the current hand-drawn "drawing" (on twos at 24 → 12 drawings per second). */
export const boilIndex = T => Math.floor(T * BOIL_FPS + 1e-6);
/** Time quantised to 12 fps — characters and FX are animated on these steps like a hand-drawn film. */
export const onTwos = t => Math.floor(t * BOIL_FPS + 1e-6) / BOIL_FPS;

/** Seeded random stream: const r = rng(4); r() → [0,1). */
export function rng(seed) {
  let i = 0;
  const s = seed * 0.7319 + 0.123;
  return () => rand(s + (++i) * 7.9193);
}
export const gauss = r => (r() + r() + r() - 1.5) * 1.15;
export const lerp = (a, b, p) => a + (b - a) * p;
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const smooth = p => { p = clamp(p); return p * p * (3 - 2 * p); };

/** 1D smooth value noise in [-1, 1]. */
export function vnoise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(rand(i * 1.371 + seed * 91.7), rand((i + 1) * 1.371 + seed * 91.7), u) * 2 - 1;
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

// ---------------------------------------------------------------- geometry
/** Catmull-Rom smoothing of a polyline / closed polygon. */
export function smoothPts(pts, closed = false, n = 6) {
  const out = [], N = pts.length;
  const get = i => closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))];
  const last = closed ? N : N - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(pts[N - 1]);
  return out;
}

export function ellipsePts(cx, cy, rx, ry, n = 40, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot), out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
}

/** Superellipse "bean" (crown/jaw exponents, egg taper, one-side bulge) — construction from the reference study. */
export function blobPts(cx, cy, a, b, { nTop = 2, nBot = 2, egg = 0, asym = 0, rot = 0, n = 64, wob = 0, seed = 1 } = {}) {
  const out = [], cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TAU, c = Math.cos(th), s = Math.sin(th);
    const e = s < 0 ? nTop : nBot;
    let X = Math.sign(c) * Math.abs(c) ** (2 / e), Y = Math.sign(s) * Math.abs(s) ** (2 / e);
    X *= (1 + egg * Y) * (1 + asym * Math.sign(X));
    const k = 1 + wob * (Math.sin(th * 2 + seed) * 0.5 + Math.sin(th * 3 + seed * 2.3) * 0.3 + Math.sin(th * 5 + seed * 4.1) * 0.2);
    const x = a * X * k, y = b * Y * k;
    out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return out;
}

export function tracePath(g, pts, closed = true) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (closed) g.closePath();
}
export const transformPts = (pts, { x = 0, y = 0, s = 1, sx = s, sy = s, rot = 0 } = {}) => {
  const c = Math.cos(rot), si = Math.sin(rot);
  return pts.map(([px, py]) => { const X = px * sx, Y = py * sy; return [x + X * c - Y * si, y + X * si + Y * c]; });
};

/** Hobbs-style recursive edge deformation (watercolour wash edges). pts: [[x,y,var?]]. */
export function deform(pts, depth, variance, r) {
  let P = pts.map(p => [p[0], p[1], p[2] ?? 1]);
  for (let d = 0; d < depth; d++) {
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      out.push(a);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), v = (a[2] + b[2]) / 2;
      out.push([(a[0] + b[0]) / 2 + gauss(r) * len * variance * v, (a[1] + b[1]) / 2 + gauss(r) * len * variance * v, v * (0.75 + 0.5 * r())]);
    }
    P = out;
  }
  return P;
}

// ---------------------------------------------------------------- textures (fast: random lattice scaled up = value noise)
export function noiseCanvas(w, h, cell, seed, lo = 0, hi = 255, asAlpha = false) {
  const nw = Math.ceil(w / cell) + 2, nh = Math.ceil(h / cell) + 2;
  const c = makeCanvas(nw, nh), g = c.getContext('2d'), id = g.createImageData(nw, nh), r = rng(seed);
  for (let i = 0; i < nw * nh; i++) {
    const v = lo + (hi - lo) * r();
    if (asAlpha) { id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 0; id.data[i * 4 + 3] = v; }
    else { id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  }
  g.putImageData(id, 0, 0);
  return c;
}
/** Draw value noise of the given cell size over (0,0,w,h). */
export function drawNoise(g, w, h, cell, seed, lo, hi, { op = 'multiply', alpha = 1, asAlpha = false } = {}) {
  const n = noiseCanvas(w, h, cell, seed, lo, hi, asAlpha);
  g.save(); g.globalCompositeOperation = op; g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(n, -cell, -cell, n.width * cell, n.height * cell);
  g.restore();
}

/** Watercolour paper: warm base, cloudy sizing, fibres and tooth. */
export function paper(g, w, h, seed = 1, base = '#f2e9d6') {
  g.save();
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  drawNoise(g, w, h, 260, seed + 1, 215, 255, { alpha: 0.5 });
  drawNoise(g, w, h, 70, seed + 2, 225, 255, { alpha: 0.55 });
  drawNoise(g, w, h, 9, seed + 3, 228, 255, { alpha: 0.6 });
  drawNoise(g, w, h, 2.2, seed + 4, 205, 255, { alpha: 0.45 });
  const r = rng(seed + 9);
  g.lineCap = 'round';
  for (let i = 0; i < (w * h) / 9000; i++) {
    const x = r() * w, y = r() * h, a = r() * TAU, L = 6 + r() * 26;
    g.strokeStyle = r() < 0.5 ? 'rgba(120,96,70,0.07)' : 'rgba(255,255,250,0.22)';
    g.lineWidth = 0.6 + r() * 0.8;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * L * 0.5, y + Math.sin(a + 0.6) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
  }
  g.restore();
}

/** Pigment granulation (ultramarine-like speckle) inside the current clip. */
export function granulate(g, w, h, seed, strength = 0.35, cell = 2.4) {
  drawNoise(g, w, h, cell, seed, 120, 255, { alpha: strength });
  drawNoise(g, w, h, cell * 7, seed + 5, 170, 255, { alpha: strength * 0.7 });
}

// ---------------------------------------------------------------- paint
/**
 * Watercolour wash: many low-alpha deformed copies (soft, pooled edges) + darker dried rim + blooms.
 * mode 'multiply' = transparent glaze over what is below (real watercolour); 'source-over' = gouache.
 */
export function wash(g, pts, color, { layers = 12, alpha = 0.07, spread = 0.35, depth = 3, seed = 1, rim = 0.22, rimW = 2.2,
  mode = 'multiply', blooms = 0, bloomR = 60, gran = 0, granCell = 2.4, W = 0, H = 0 } = {}) {
  const r = rng(seed);
  const base = deform(pts, 2, spread * 0.45, r);
  g.save();
  g.globalCompositeOperation = mode;
  g.fillStyle = color;
  for (let k = 0; k < layers; k++) {
    const p = deform(base, depth, spread * 0.3, r);
    g.globalAlpha = alpha;
    tracePath(g, p); g.fill();
  }
  if (rim) { // pigment dries darker at the edge
    g.globalAlpha = rim; g.strokeStyle = color; g.lineWidth = rimW; g.lineJoin = 'round';
    tracePath(g, deform(base, 2, spread * 0.12, r)); g.stroke();
  }
  if (blooms || gran) {
    tracePath(g, base); g.clip();
    for (let i = 0; i < blooms; i++) { // back-run "cauliflower" rings
      const p = base[Math.floor(r() * base.length)], q = base[Math.floor(r() * base.length)];
      const cx = lerp(p[0], q[0], 0.3 + r() * 0.4), cy = lerp(p[1], q[1], 0.3 + r() * 0.4), rr = bloomR * (0.5 + r());
      g.globalAlpha = 0.12; g.strokeStyle = color; g.lineWidth = rimW * 0.9;
      tracePath(g, deform(ellipsePts(cx, cy, rr, rr * (0.6 + r() * 0.5), 14), 3, 0.18, r)); g.stroke();
    }
    if (gran && W) { g.globalCompositeOperation = 'multiply'; granulate(g, W, H, seed + 77, gran, granCell); }
  }
  g.restore();
  return base;
}

/** Flat body of paint with soft light/shadow split (painterly form shading). pts closed. lx,ly = shift of the lit shape toward the light. */
export function shadeFill(g, pts, lit, shadow, lx, ly, blur, { core = null, coreAlpha = 0.5 } = {}) {
  g.save();
  tracePath(g, pts); g.clip();
  g.fillStyle = shadow; g.fill();
  g.filter = `blur(${Math.max(0.1, blur)}px)`;
  g.fillStyle = lit;
  tracePath(g, pts.map(([x, y]) => [x + lx, y + ly])); g.fill();
  if (core) { // darker core shadow band at the terminator
    g.globalAlpha = coreAlpha; g.globalCompositeOperation = 'multiply'; g.strokeStyle = core; g.lineWidth = blur * 1.2;
    tracePath(g, pts.map(([x, y]) => [x + lx * 1.05, y + ly * 1.05])); g.stroke();
  }
  g.restore();
}

/**
 * Ink brush stroke: tapered, pressure-varied, thick on the shadow side, with line boil.
 * pts are control points (smoothed). w = nominal width. boil = drawing index (0 = still line).
 */
export function brush(g, pts, { w = 3, color = '#241726', seed = 1, boil = 0, amp = 0.7, taper = [0.18, 0.28], closed = false,
  press = 0.35, alpha = 1, thick = null, step = 2.5, sm = 5, mode = 'source-over', dry = 0 } = {}) {
  const P = pts.length > 2 ? smoothPts(pts, closed, sm) : pts.slice();
  if (closed) P.push(P[0]);
  // resample
  const S = [P[0]];
  let acc = 0;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    acc += d;
    if (acc >= step || i === P.length - 1) { S.push(b); acc = 0; }
  }
  if (S.length < 2) return;
  const L = [0];
  for (let i = 1; i < S.length; i++) L.push(L[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
  const total = L[L.length - 1] || 1;
  const left = [], right = [];
  const bs = seed * 13.7 + boil * 31.3;
  for (let i = 0; i < S.length; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;
    const s = L[i] / total;
    let wt = 1;
    if (!closed) wt = Math.min(1, s / taper[0]) ** 0.6 * Math.min(1, (1 - s) / taper[1]) ** 0.6;
    const wn = 1 + press * vnoise(L[i] / (18 * w + 10), seed);
    let wd = 1;
    if (thick) wd = 1 + thick.k * Math.cos(Math.atan2(ny, nx) - thick.angle);
    const width = Math.max(0.15, w * wt * wn * wd);
    const j = boil ? amp * vnoise(L[i] / 22 + bs, bs) : 0;
    const j2 = boil ? amp * 0.6 * vnoise(L[i] / 9 + bs * 1.7, bs + 3) : 0;
    left.push([S[i][0] + nx * (width / 2 + j + j2), S[i][1] + ny * (width / 2 + j + j2)]);
    right.push([S[i][0] - nx * (width / 2 - j - j2), S[i][1] - ny * (width / 2 - j - j2)]);
  }
  g.save();
  g.globalCompositeOperation = mode;
  g.globalAlpha = alpha;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(left[0][0], left[0][1]);
  for (const p of left) g.lineTo(p[0], p[1]);
  for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
  g.closePath(); g.fill();
  if (dry) { // dry-brush breaks: knock tiny gaps out of the stroke
    const r = rng(seed * 3 + boil);
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < S.length; i += 3) if (r() < dry) { const p = S[i]; g.globalAlpha = 0.5; g.beginPath(); g.arc(p[0] + (r() - 0.5) * w, p[1] + (r() - 0.5) * w, w * 0.25 * r(), 0, TAU); g.fill(); }
  }
  g.restore();
}

/** Soft additive light (lamp, flash, sun). */
export function glow(g, x, y, r, color, alpha = 1, op = 'lighter') {
  g.save();
  g.globalCompositeOperation = op; g.globalAlpha = alpha;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color); gr.addColorStop(0.35, color.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.45).toFixed(3) + ')')); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

/** Run fn with the context clipped to pts. */
export function clipTo(g, pts, fn) { g.save(); tracePath(g, pts); g.clip(); fn(); g.restore(); }

/** Horizontal band polygon with a wobbly top/bottom edge (for sky / water bands). */
export function bandPts(x0, x1, yTop, yBot, seed, wobble = 10, n = 14) {
  const r = rng(seed), top = [], bot = [];
  for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); top.push([x, yTop + gauss(r) * wobble]); bot.push([x, yBot + gauss(r) * wobble]); }
  return [...top, ...bot.reverse()];
}

// ---------------------------------------------------------------- camera + grade
/**
 * A painted layer that is bigger than the frame (margin m), drawn in FRAME coordinates.
 * layer.g is translated so (0,0) = frame top-left.
 */
export function makeLayer(W, H, m = 0.12) {
  const ox = Math.round(W * m / 2), oy = Math.round(H * m / 2);
  const c = makeCanvas(W + ox * 2, H + oy * 2), g = c.getContext('2d');
  g.translate(ox, oy);
  return { c, g, ox, oy, W, H };
}
/** Draw a layer through a camera {x, y (frame px offset of view centre), z (zoom)} with parallax p. */
export function drawLayer(g, layer, cam, p = 1, alpha = 1) {
  const z = 1 + (cam.z - 1) * p, W = layer.W, H = layer.H;
  const fx = cam.fx ?? W / 2, fy = cam.fy ?? H / 2; // zoom focus (frame px)
  g.save();
  g.globalAlpha = alpha;
  // screen = f + z*(world - f) - cam*p
  g.setTransform(z, 0, 0, z, fx - z * fx - cam.x * p - z * layer.ox, fy - z * fy - cam.y * p - z * layer.oy);
  g.drawImage(layer.c, 0, 0);
  g.restore();
}
/** Same transform for things drawn live (characters, FX) in frame coordinates. */
export function camTransform(g, cam, p = 1, W, H) {
  const z = 1 + (cam.z - 1) * p, fx = cam.fx ?? W / 2, fy = cam.fy ?? H / 2;
  g.setTransform(z, 0, 0, z, fx - z * fx - cam.x * p, fy - z * fy - cam.y * p);
}

/** Film-grain frames (screen space, changes at 12 fps) — built once per scene. */
export function grainFrames(W, H, seed, n = 3) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = makeCanvas(W / 2, H / 2), g = c.getContext('2d');
    g.fillStyle = '#808080'; g.fillRect(0, 0, c.width, c.height);
    drawNoise(g, c.width, c.height, 1, seed + i * 17, 96, 160, { op: 'source-over', alpha: 1 });
    out.push(c);
  }
  return out;
}

/** Final grade: vignette (coloured), lifted plum blacks, film grain. */
export function grade(g, W, H, T, grains, { vignette = 'rgba(40,18,30,0.55)', lift = '#1c1219', grain = 0.07, warm = null } = {}) {
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (warm) { g.globalCompositeOperation = 'soft-light'; g.fillStyle = warm; g.fillRect(0, 0, W, H); }
  g.globalCompositeOperation = 'multiply';
  const R = Math.hypot(W, H) / 2;
  const v = g.createRadialGradient(W / 2, H * 0.46, R * 0.35, W / 2, H / 2, R * 1.05);
  v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(1, vignette.replace(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/, (m, r, gg, b, a) => {
    const k = parseFloat(a); const mix = (c) => Math.round(255 - (255 - c) * k); return `rgb(${mix(+r)},${mix(+gg)},${mix(+b)})`;
  }));
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighten'; g.fillStyle = lift; g.fillRect(0, 0, W, H);
  if (grains?.length && grain) {
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = grain;
    g.drawImage(grains[boilIndex(T) % grains.length], 0, 0, W, H);
  }
  g.restore();
}

/** Painted lettering: each glyph placed by hand (tiny jitter), ink with dry-brush gaps. Returns a canvas. */
export function paintedText(text, { font, color = '#2b2633', size = 60, seed = 3, track = 0, jitter = 0.04 }) {
  const c0 = makeCanvas(10, 10).getContext('2d');
  c0.font = font;
  const widths = [...text].map(ch => c0.measureText(ch).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + track * (text.length - 1);
  const c = makeCanvas(totalW + size, size * 1.6), g = c.getContext('2d'), r = rng(seed);
  g.font = font; g.fillStyle = color; g.textBaseline = 'alphabetic';
  let x = size * 0.5;
  [...text].forEach((ch, i) => {
    g.save();
    g.translate(x, size * 1.15 + (r() - 0.5) * size * jitter);
    g.rotate((r() - 0.5) * jitter * 0.9);
    g.globalAlpha = 0.82 + r() * 0.18;
    g.fillText(ch, 0, 0);
    g.restore();
    x += widths[i] + track;
  });
  // dry brush tooth + pooled darker edges
  drawNoise(g, c.width, c.height, 1.6, seed + 4, 0, 255, { op: 'destination-out', alpha: 0.3, asAlpha: true });
  drawNoise(g, c.width, c.height, 14, seed + 6, 0, 120, { op: 'source-atop', alpha: 0.18 });
  return c;
}

/**
 * Wet-in-wet glaze: paint into a temp sheet, blur it (soft bleeding edges), optionally lift out areas
 * (knock = the painter "painting around" the shallows), then glaze it onto the layer.
 */
export function softWash(layer, paintFn, { blur = 30, mode = 'multiply', alpha = 1, knock = null, knockBlur = 12 } = {}) {
  const c = makeCanvas(layer.c.width, layer.c.height), cg = c.getContext('2d');
  cg.translate(layer.ox, layer.oy);
  cg.filter = `blur(${blur}px)`;
  paintFn(cg);
  if (knock) { cg.filter = `blur(${knockBlur}px)`; cg.globalCompositeOperation = 'destination-out'; cg.fillStyle = '#000'; knock(cg); }
  const g = layer.g;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.drawImage(c, 0, 0); g.restore();
}
