// WOODCUT kit — a relief block carved live, then printed.
// Model: a scene is ONE block. Its picture is a list of gouge cuts (white = wood removed) plus "erase" masks
// (areas the carver leaves standing). Block view = stained wood, cuts show pale raw wood with a cut wall shadow.
// Print view = paper + one colour block (teal, misregistered) + key block ink with grain starvation.
// Signature move "carve and pull": cuts appear one by one in voice time, then a sheet is laid, rubbed and turned over.
// Everything is a pure function of t; all randomness is seeded and fixed per object (designed once, never boiling).
import { rand, clamp, lerp } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep } from '/onclack-styles/engine/lib/spring.js';

export const F = 1 / 30;
export const C = {
  paper: '#ECE4D1', ink: '#17130F', teal: '#1E5D5B', stain: '#1D1813', wood: '#D3AF7D', woodDark: '#A57C4B',
  bench: '#24201B', pencil: '#57524A',
};

// ---------- small math ----------
export const sstep = (a, b, x) => { const p = clamp((x - a) / (b - a)); return p * p * (3 - 2 * p); };
function bez(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => { p = clamp(p); let s = p; for (let i = 0; i < 6; i++) { const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= (X(s) - p) / d; } return Y(clamp(s)); };
}
export const ez = { enter: bez(0.16, 1, 0.3, 1), exit: bez(0.7, 0, 0.84, 0), move: bez(0.65, 0, 0.35, 1), cam: bez(0.45, 0, 0.15, 1), gouge: bez(0.4, 0, 0.3, 1) };
export const tw = (t, a, b, from, to, e = ez.move) => lerp(from, to, e(clamp((t - a) / (b - a))));
/** seeded sequence */
export const seq = seed => { let i = 0; return () => rand(seed * 131.7 + (i++) * 7.31 + 0.5); };
/** smooth 1D value noise in [-1, 1] */
export const vnoise = (x, seed = 0) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(rand(i * 17.17 + seed * 3.3) * 2 - 1, rand((i + 1) * 17.17 + seed * 3.3) * 2 - 1, u);
};

/** local time of the n-th occurrence of a word in this scene (fallback if missing) */
export function wordT(ctx, word, n = 0, fallback = 0) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = ctx.wordsIn().filter(w => norm(w.word) === norm(word));
  return hits[n] ? hits[n].start - ctx.start : fallback;
}

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

// ---------- layout: paper = full frame, image (block) rect R, a margin band under it for pencil + stamp ----------
export function rects(L) {
  if (L.landscape) {
    const x = L.safe.x + L.px(8), y = L.safe.y + L.px(4), w = L.safe.w - L.px(16), h = L.safe.h - L.px(150);
    return { R: { x, y, w, h }, band: { x, y: y + h + L.px(26), w, h: L.px(104) } };
  }
  const x = L.safe.x, y = L.safe.y, w = L.safe.w, h = L.safe.h - L.px(196);
  return { R: { x, y, w, h }, band: { x, y: y + h + L.px(30), w, h: L.px(150) } };
}
export const at = (R, u, v) => [R.x + u * R.w, R.y + v * R.h];

// ---------- textures (baked once per block, seeded) ----------
/** Grain line geometry shared by the stained block, the raw wood and the print's ink starvation (same block = same grain). */
function grainLines(w, h, seed, sc) {
  const r = seq(seed), lines = [];
  const knots = [0, 1].map(() => ({ x: r() * w, y: r() * h, k: (26 + r() * 40) * sc }));
  const n = Math.round(h / (3.2 * sc));
  for (let i = 0; i < n; i++) {
    const y0 = r() * h, amp = (1.5 + r() * 5) * sc, f = (0.0016 + r() * 0.003) / sc, ph = r() * 6.28;
    const pts = [];
    for (let x = -20; x <= w + 20; x += 14 * sc) {
      let y = y0 + amp * Math.sin(x * f + ph) + 2.2 * sc * Math.sin(x * f * 3.3 + ph * 2);
      for (const k of knots) { const dx = x - k.x, dy = y0 - k.y; y += (Math.sign(dy) || 1) * k.k * 1.4 * Math.exp(-(dx * dx) / (k.k * k.k * 14)) * Math.exp(-(dy * dy) / (k.k * k.k * 8)); }
      pts.push(x, y);
    }
    lines.push({ pts, lw: (0.35 + r() * r() * 3.2) * sc, a: 0.04 + r() * 0.2, dark: r() < 0.62 });
  }
  return { lines, knots };
}
function strokeLines(g, gl, colLight, colDark, gain = 1) {
  for (const l of gl.lines) {
    g.globalAlpha = Math.min(1, l.a * gain); g.strokeStyle = l.dark ? colDark : colLight; g.lineWidth = l.lw;
    g.beginPath(); g.moveTo(l.pts[0], l.pts[1]); for (let i = 2; i < l.pts.length; i += 2) g.lineTo(l.pts[i], l.pts[i + 1]); g.stroke();
  }
  g.globalAlpha = 1;
}
function knotsDraw(g, gl, col, sc) {
  g.strokeStyle = col;
  for (const k of gl.knots) for (let j = 1; j < 6; j++) {
    g.globalAlpha = 0.16 - j * 0.02; g.lineWidth = 1.1 * sc; g.beginPath();
    g.ellipse(k.x, k.y, k.k * 0.22 * j + 2, k.k * 0.09 * j + 1, 0, 0, Math.PI * 2); g.stroke();
  }
  g.globalAlpha = 1;
}
export function bakeBlock(w, h, seed, sc) {
  const gl = grainLines(w, h, seed, sc);
  const stain = canvas(w, h), gs = stain.getContext('2d');
  gs.fillStyle = C.stain; gs.fillRect(0, 0, w, h);
  strokeLines(gs, gl, '#3A3027', '#0E0B08', 1.1); knotsDraw(gs, gl, '#3A3027', sc);
  const wood = canvas(w, h), gw = wood.getContext('2d');
  gw.fillStyle = C.wood; gw.fillRect(0, 0, w, h);
  strokeLines(gw, gl, '#E8CDA0', C.woodDark, 1.5); knotsDraw(gw, gl, '#8C6438', sc);
  // print ink starvation (where the ink did not take): the light grain streaks, pin holes, one thin roller band
  const starve = canvas(w, h), gv = starve.getContext('2d');
  gv.strokeStyle = '#000'; gv.fillStyle = '#000';
  for (const l of gl.lines) if (!l.dark && l.a > 0.1) {
    gv.globalAlpha = Math.min(1, (l.a - 0.08) * 1.5); gv.lineWidth = l.lw * 1.3;
    gv.beginPath(); gv.moveTo(l.pts[0], l.pts[1]); for (let i = 2; i < l.pts.length; i += 2) gv.lineTo(l.pts[i], l.pts[i + 1]); gv.stroke();
  }
  const r = seq(seed + 9);
  for (let i = 0; i < (w * h) / 2600; i++) {
    gv.globalAlpha = 0.25 + r() * 0.6; gv.beginPath(); gv.arc(r() * w, r() * h, (0.4 + r() * r() * 1.8) * sc, 0, 6.283); gv.fill();
  }
  const by = (0.2 + r() * 0.6) * h, bh = (60 + r() * 80) * sc;
  const grd = gv.createLinearGradient(0, by - bh, 0, by + bh); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, 'rgba(0,0,0,0.13)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  gv.globalAlpha = 1; gv.fillStyle = grd; gv.fillRect(0, by - bh, w, bh * 2);
  const ink = canvas(w, h), gi = ink.getContext('2d');
  gi.fillStyle = C.ink; gi.fillRect(0, 0, w, h);
  gi.globalCompositeOperation = 'destination-out'; gi.drawImage(starve, 0, 0); gi.globalCompositeOperation = 'source-over';
  return { stain, wood, ink, starve, gl };
}
export function bakePaper(w, h, seed, sc) {
  const c = canvas(w, h), g = c.getContext('2d'), r = seq(seed);
  g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    const x = r() * w, y = r() * h, rad = (80 + r() * 260) * sc, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() < 0.5; gr.addColorStop(0, dark ? 'rgba(150,130,100,0.028)' : 'rgba(255,252,242,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < (w * h) / 700; i++) {
    const x = r() * w, y = r() * h, len = (5 + r() * 18) * sc, a = r() * 6.28, bend = (r() - 0.5) * len;
    g.globalAlpha = 0.05 + r() * 0.12; g.strokeStyle = r() < 0.7 ? '#A99C82' : '#FFFBF1'; g.lineWidth = (0.5 + r() * 0.6) * sc;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len / 2 - Math.sin(a) * bend, y + Math.sin(a) * len / 2 + Math.cos(a) * bend, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
  }
  g.fillStyle = '#8A7E69';
  for (let i = 0; i < (w * h) / 9000; i++) { g.globalAlpha = 0.12 + r() * 0.25; g.beginPath(); g.arc(r() * w, r() * h, (0.4 + r() * 0.9) * sc, 0, 6.283); g.fill(); }
  g.globalAlpha = 1;
  return c;
}

// ---------- the gouge cut ----------
/** One V-gouge cut along a polyline. w = full width (world px). Pointed entry, chunky body, lifted exit, slight wobble. */
export function cut(pts, w, opts = {}) {
  const seed = opts.seed ?? (pts[0][0] * 0.13 + pts[0][1] * 0.71);
  const step = Math.max(1.2, w * 0.22);
  // resample by arc length
  const P = []; let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0); if (d < 1e-6) continue;
    const n = Math.max(1, Math.ceil(d / step));
    for (let k = (i === 0 ? 0 : 1); k <= n; k++) P.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n), acc + d * k / n]);
    acc += d;
  }
  const L = acc || 1, N = P.length;
  const xs = new Float32Array(N), ys = new Float32Array(N), ss = new Float32Array(N), nx = new Float32Array(N), ny = new Float32Array(N), hl = new Float32Array(N), hr = new Float32Array(N);
  const entry = opts.entry ?? 0.2, exit = opts.exit ?? 0.16, tipMin = opts.tipMin ?? 0.18;
  for (let i = 0; i < N; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    nx[i] = -ty; ny[i] = tx;
    const u = P[i][2] / L, s = P[i][2];
    const prof = lerp(tipMin, 1, sstep(0, entry, u)) * lerp(1, 0.14, sstep(1 - exit, 1, u));
    const wob = 1 + 0.12 * vnoise(s / (w * 1.7), seed) + 0.05 * vnoise(s / (w * 0.5), seed + 4);
    const off = (opts.jitter ?? 0.07) * w * vnoise(s / (w * 3), seed + 8);
    xs[i] = P[i][0] + nx[i] * off; ys[i] = P[i][1] + ny[i] * off; ss[i] = s;
    hl[i] = (w / 2) * prof * wob * (1 + 0.07 * vnoise(s / (w * 0.8), seed + 2));
    hr[i] = (w / 2) * prof * wob * (1 + 0.07 * vnoise(s / (w * 0.8), seed + 6));
  }
  const c = { xs, ys, ss, nx, ny, hl, hr, N, L, w, t0: opts.t0 ?? 0, dur: opts.dur ?? 0.3, seed, full: null, guide: null, chip: opts.chip ?? true };
  c.full = cutPath(c, L);
  const gp = new Path2D(); gp.moveTo(P[0][0], P[0][1]); for (let i = 1; i < N; i++) gp.lineTo(P[i][0], P[i][1]); c.guide = gp;
  return c;
}
function cutPath(c, sf) {
  const p = new Path2D();
  let k = 0; while (k < c.N - 1 && c.ss[k + 1] <= sf) k++;
  // front point (interpolated)
  let fx = c.xs[k], fy = c.ys[k], fnx = c.nx[k], fny = c.ny[k], fh = (c.hl[k] + c.hr[k]) / 2;
  if (k < c.N - 1 && sf < c.L) {
    const q = clamp((sf - c.ss[k]) / Math.max(1e-6, c.ss[k + 1] - c.ss[k]));
    fx = lerp(c.xs[k], c.xs[k + 1], q); fy = lerp(c.ys[k], c.ys[k + 1], q); fh = lerp((c.hl[k] + c.hr[k]) / 2, (c.hl[k + 1] + c.hr[k + 1]) / 2, q);
  }
  p.moveTo(c.xs[0] - c.ny[0] * c.hl[0] * 0.9, c.ys[0] + c.nx[0] * c.hl[0] * 0.9); // pointed entry
  for (let i = 0; i <= k; i++) p.lineTo(c.xs[i] + c.nx[i] * c.hl[i], c.ys[i] + c.ny[i] * c.hl[i]);
  p.lineTo(fx + fnx * fh, fy + fny * fh);
  p.lineTo(fx - fny * fh * 0.85, fy + fnx * fh * 0.85); // V tip of the gouge (tangent = (-ny, nx))
  p.lineTo(fx - fnx * fh, fy - fny * fh);
  for (let i = k; i >= 0; i--) p.lineTo(c.xs[i] - c.nx[i] * c.hr[i], c.ys[i] - c.ny[i] * c.hr[i]);
  p.closePath();
  return p;
}
export const cutP = (c, t) => ez.gouge(clamp((t - c.t0) / c.dur));
/** front point + direction of a cut in progress (for the wood chip curl) */
function cutFront(c, p) {
  const sf = p * c.L; let k = 0; while (k < c.N - 1 && c.ss[k + 1] <= sf) k++;
  return { x: c.xs[k], y: c.ys[k], nx: c.nx[k], ny: c.ny[k], h: (c.hl[k] + c.hr[k]) / 2 };
}

/** Split a polyline at sharp corners (a gouge does not turn corners) and extend the pieces so corners stay filled. */
export function splitSharp(pts, w, maxTurn = 50) {
  const out = []; let cur = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const a1 = Math.atan2(b[1] - a[1], b[0] - a[0]), a2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let d = Math.abs(a2 - a1) * 180 / Math.PI; if (d > 180) d = 360 - d;
    cur.push(b);
    if (d > maxTurn) { out.push(cur); cur = [b]; }
  }
  cur.push(pts[pts.length - 1]); out.push(cur);
  const ext = (q, r, e) => { const d = Math.hypot(q[0] - r[0], q[1] - r[1]) || 1; return [q[0] + (q[0] - r[0]) / d * e, q[1] + (q[1] - r[1]) / d * e]; };
  return out.map(s => { const n = s.length; const e = w * 0.3; return [ext(s[0], s[1], e), ...s.slice(1, -1), ext(s[n - 1], s[n - 2], e)]; });
}

/** Schedule cuts one after another inside [ta, tb]; duration ~ length^0.6, each starts when the last is `ov` done. */
export function schedule(cuts, ta, tb, ov = 0.45) {
  if (!cuts.length) return cuts;
  const d = cuts.map(c => Math.pow(c.L, 0.6));
  const total = d.reduce((s, x, i) => s + (i < d.length - 1 ? x * (1 - ov) : x), 0);
  const k = (tb - ta) / total; let t = ta;
  cuts.forEach((c, i) => { c.t0 = t; c.dur = Math.max(2 * F, d[i] * k); t += d[i] * k * (1 - ov); });
  return cuts;
}
/** Start all cuts in a cascade: start i = ta + i*each, fixed duration */
export function cascade(cuts, ta, each, dur) { cuts.forEach((c, i) => { c.t0 = ta + i * each; c.dur = dur; }); return cuts; }

// ---------- stroke alphabet (our own carved letters; y 0 = cap top, 1 = baseline) ----------
const G = {
  A: [0.62, [[0, 1], [0.31, 0], [0.62, 1]], [[0.13, 0.64], [0.49, 0.64]]],
  B: [0.56, [[0, 0], [0, 1]], [[0, 0], [0.38, 0], [0.52, 0.1], [0.52, 0.36], [0.38, 0.47], [0.02, 0.47]], [[0.02, 0.47], [0.42, 0.47], [0.56, 0.58], [0.56, 0.88], [0.42, 1], [0, 1]]],
  C: [0.56, [[0.56, 0.14], [0.42, 0], [0.15, 0], [0, 0.16], [0, 0.84], [0.15, 1], [0.42, 1], [0.56, 0.86]]],
  D: [0.58, [[0, 0], [0, 1]], [[0, 0], [0.33, 0], [0.58, 0.22], [0.58, 0.78], [0.33, 1], [0, 1]]],
  E: [0.5, [[0.5, 0], [0, 0]], [[0, 0], [0, 1]], [[0, 1], [0.5, 1]], [[0, 0.49], [0.4, 0.49]]],
  F: [0.5, [[0.5, 0], [0, 0]], [[0, 0], [0, 1]], [[0, 0.49], [0.4, 0.49]]],
  G: [0.58, [[0.56, 0.14], [0.42, 0], [0.15, 0], [0, 0.16], [0, 0.84], [0.15, 1], [0.43, 1], [0.58, 0.86], [0.58, 0.56]], [[0.58, 0.56], [0.32, 0.56]]],
  H: [0.56, [[0, 0], [0, 1]], [[0.56, 0], [0.56, 1]], [[0, 0.5], [0.56, 0.5]]],
  I: [0, [[0, 0], [0, 1]]],
  K: [0.56, [[0, 0], [0, 1]], [[0.54, 0], [0.04, 0.6]], [[0.2, 0.44], [0.56, 1]]],
  L: [0.48, [[0, 0], [0, 1]], [[0, 1], [0.48, 1]]],
  M: [0.72, [[0, 1], [0, 0]], [[0, 0], [0.36, 0.62]], [[0.36, 0.62], [0.72, 0]], [[0.72, 0], [0.72, 1]]],
  N: [0.58, [[0, 1], [0, 0]], [[0, 0], [0.58, 1]], [[0.58, 1], [0.58, 0]]],
  O: [0.6, [[0.3, 0], [0.16, 0], [0, 0.17], [0, 0.83], [0.16, 1], [0.3, 1]], [[0.3, 0], [0.44, 0], [0.6, 0.17], [0.6, 0.83], [0.44, 1], [0.3, 1]]],
  P: [0.54, [[0, 1], [0, 0]], [[0, 0], [0.4, 0], [0.54, 0.12], [0.54, 0.4], [0.4, 0.52], [0.02, 0.52]]],
  R: [0.56, [[0, 1], [0, 0]], [[0, 0], [0.4, 0], [0.54, 0.12], [0.54, 0.38], [0.4, 0.5], [0.02, 0.5]], [[0.28, 0.5], [0.56, 1]]],
  S: [0.54, [[0.54, 0.13], [0.4, 0], [0.14, 0], [0.01, 0.12], [0.01, 0.36], [0.14, 0.47], [0.4, 0.53], [0.54, 0.64], [0.54, 0.88], [0.4, 1], [0.14, 1], [0, 0.87]]],
  T: [0.58, [[0, 0], [0.58, 0]], [[0.29, 0], [0.29, 1]]],
  U: [0.56, [[0, 0], [0, 0.83], [0.15, 1], [0.41, 1], [0.56, 0.83], [0.56, 0]]],
  V: [0.6, [[0, 0], [0.3, 1]], [[0.3, 1], [0.6, 0]]],
  W: [0.8, [[0, 0], [0.2, 1]], [[0.2, 1], [0.4, 0.3]], [[0.4, 0.3], [0.6, 1]], [[0.6, 1], [0.8, 0]]],
  Y: [0.6, [[0, 0], [0.3, 0.52]], [[0.6, 0], [0.3, 0.52]], [[0.3, 0.52], [0.3, 1]]],
  0: [0.52, [[0.26, 0], [0.14, 0], [0, 0.17], [0, 0.83], [0.14, 1], [0.26, 1]], [[0.26, 0], [0.38, 0], [0.52, 0.17], [0.52, 0.83], [0.38, 1], [0.26, 1]]],
  1: [0.3, [[0, 0.2], [0.3, 0]], [[0.3, 0], [0.3, 1]]],
  2: [0.54, [[0, 0.16], [0.13, 0], [0.4, 0], [0.54, 0.14], [0.54, 0.36], [0.02, 1]], [[0.02, 1], [0.56, 1]]],
  6: [0.54, [[0.5, 0.04], [0.36, 0], [0.15, 0], [0, 0.18], [0, 0.84], [0.15, 1], [0.4, 1], [0.54, 0.86], [0.54, 0.62], [0.4, 0.48], [0.14, 0.48], [0, 0.6]]],
  7: [0.54, [[0, 0], [0.54, 0]], [[0.54, 0], [0.18, 1]]],
  9: [0.54, [[0.04, 0.96], [0.18, 1], [0.39, 1], [0.54, 0.82], [0.54, 0.16], [0.39, 0], [0.14, 0], [0, 0.14], [0, 0.38], [0.14, 0.52], [0.4, 0.52], [0.54, 0.4]]],
  '-': [0.36, [[0, 0.52], [0.36, 0.52]]],
  ':': [0, [[0, 0.24], [0, 0.34]], [[0, 0.7], [0, 0.8]]],
  '>': [0.9, [[0, 0.5], [0.9, 0.5]], [[0.58, 0.22], [0.9, 0.5]], [[0.58, 0.78], [0.9, 0.5]]],
};
/** Width (world px) of a carved string. */
export function textWidth(str, cap, track = 0.3) {
  let x = 0; for (const ch of str) x += ch === ' ' ? cap * 0.5 : ((G[ch]?.[0] ?? 0.5) + track) * cap;
  return x - track * cap;
}
/** Carved letters as gouge cuts. Returns { cuts (in carving order), w }. Top-left of the cap at (x, y). */
export function textCuts(str, x, y, cap, { wRel = 0.17, track = 0.3, seed = 1 } = {}) {
  const w = cap * wRel, cuts = []; let cx = x, i = 0;
  for (const ch of str) {
    i++;
    if (ch === ' ') { cx += cap * 0.5; continue; }
    const g = G[ch]; if (!g) { cx += cap * 0.5; continue; }
    const r = seq(seed * 10 + i);
    const dx = (r() - 0.5) * cap * 0.04, dy = (r() - 0.5) * cap * 0.05, sk = (r() - 0.5) * 0.05; // each letter cut by hand
    for (const s of g.slice(1)) {
      const pts = s.map(([gx, gy]) => [cx + dx + gx * cap + sk * (gy - 0.5) * cap, y + dy + gy * cap]);
      for (const piece of splitSharp(pts, w)) cuts.push(cut(piece, w * (0.92 + r() * 0.16), { seed: seed * 50 + cuts.length }));
    }
    cx += (g[0] + track) * cap;
  }
  return { cuts, w: cx - x - track * cap };
}
/** Bold glyph region (for clearing a big word): union of thick strokes with rough edges, as one nonzero Path2D. */
export function boldGlyphPath(str, x, y, cap, { wRel = 0.34, track = 0.22, seed = 3 } = {}) {
  const path = new Path2D(), strokes = []; let cx = x, i = 0;
  const w = cap * wRel;
  for (const ch of str) {
    const g = G[ch]; i++; if (!g) { cx += cap * 0.5; continue; }
    for (const s of g.slice(1)) {
      const pts = s.map(([gx, gy]) => [cx + w / 2 + gx * (cap - 0) , y + gy * cap]);
      strokes.push(pts);
      for (let k = 0; k < pts.length - 1; k++) roughQuad(path, pts[k], pts[k + 1], w, seed * 31 + i * 7 + k);
      for (const p of pts) roughDisc(path, p, w / 2, seed + p[0] * 0.01);
    }
    cx += (g[0] + track) * cap + w;
  }
  return { path, strokes, w, width: cx - x - track * cap };
}
function ccw(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]; a += x0 * y1 - x1 * y0; } return a < 0 ? poly.reverse() : poly; }
function addPoly(path, poly) { ccw(poly); path.moveTo(poly[0][0], poly[0][1]); for (const p of poly.slice(1)) path.lineTo(p[0], p[1]); path.closePath(); }
function roughQuad(path, a, b, w, seed) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, n = Math.max(3, Math.round(d / (w * 0.35)));
  const L = [], Rr = [];
  for (let k = 0; k <= n; k++) {
    const q = k / n, x = a[0] + dx * q, y = a[1] + dy * q;
    const jl = 1 + 0.05 * vnoise(k * 1.3, seed), jr = 1 + 0.05 * vnoise(k * 1.3, seed + 5);
    L.push([x + nx * w / 2 * jl, y + ny * w / 2 * jl]); Rr.push([x - nx * w / 2 * jr, y - ny * w / 2 * jr]);
  }
  addPoly(path, [...L, ...Rr.reverse()]);
}
function roughDisc(path, p, r, seed) {
  const poly = []; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, rr = r * (1 + 0.05 * vnoise(k, seed)); poly.push([p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr]); }
  addPoly(path, poly);
}
/** Clearing cuts that follow a bold glyph's strokes: `lanes` parallel gouge passes per stroke (ridges stay between). */
export function clearingCuts(strokes, w, { lanes = 3, laneW = 0.42, seed = 5 } = {}) {
  const out = [];
  strokes.forEach((pts, si) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, tx = dx / d, ty = dy / d;
      for (let l = 0; l < lanes; l++) {
        const o = (l - (lanes - 1) / 2) * (w * 0.31), e = w * 0.55;
        out.push(cut([[a[0] + nx * o - tx * e, a[1] + ny * o - ty * e], [b[0] + nx * o + tx * e, b[1] + ny * o + ty * e]], w * laneW, { seed: seed * 90 + si * 13 + k * 3 + l, entry: 0.1, exit: 0.08, tipMin: 0.5, chip: l === 1 && k === 0 }));
      }
    }
  });
  return out;
}

// ---------- shapes ----------
/** polygon offset along averaged vertex normals (shape must be CCW in screen coords for outward = +) */
export function offsetPoly(poly, e) {
  const n = poly.length, out = [];
  let area = 0; for (let i = 0; i < n; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % n]; area += x0 * y1 - x1 * y0; }
  const s = area > 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const p = poly[(i - 1 + n) % n], c = poly[i], q = poly[(i + 1) % n];
    const e1 = norm([c[0] - p[0], c[1] - p[1]]), e2 = norm([q[0] - c[0], q[1] - c[1]]);
    const n1 = [e1[1] * s, -e1[0] * s], n2 = [e2[1] * s, -e2[0] * s];
    const m = norm([n1[0] + n2[0], n1[1] + n2[1]]), cosh = Math.max(0.45, m[0] * n1[0] + m[1] * n1[1]);
    out.push([c[0] + m[0] * e / cosh, c[1] + m[1] * e / cosh]);
  }
  return out;
}
const norm = v => { const d = Math.hypot(v[0], v[1]) || 1; return [v[0] / d, v[1] / d]; };
export function polyPath(poly) { const p = new Path2D(); p.moveTo(poly[0][0], poly[0][1]); for (const q of poly.slice(1)) p.lineTo(q[0], q[1]); p.closePath(); return p; }
/** Densify a closed polygon so offset contours follow it smoothly */
export function densify(poly, step) {
  const out = []; for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / step));
    for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
  }
  return out;
}
/** Contour cut(s) around a shape: offset polyline split into `parts` gouge passes, slightly overlapping. */
export function contourCuts(poly, e, w, parts = 2, seed = 7) {
  const off = offsetPoly(densify(poly, w * 1.5), e), n = off.length, out = [];
  for (let k = 0; k < parts; k++) {
    const i0 = Math.floor(k * n / parts), i1 = Math.floor((k + 1) * n / parts) + 2;
    const pts = []; for (let i = i0; i <= i1; i++) pts.push(off[i % n]);
    out.push(cut(pts, w, { seed: seed + k * 11, entry: 0.06, exit: 0.06, tipMin: 0.35 }));
  }
  return out;
}
/** Wavy parallel ridge lines (sea / sky). Each line is broken into 1–3 gouge passes with small lifts between. */
export function ridgeLines({ x0, x1, ys, amp = 0, lambda = 300, w, seed = 1, minLen = 260, maxLen = 700, phaseStep = 0.35, slope = 0 }) {
  const out = [];
  ys.forEach((y, li) => {
    const r = seq(seed * 100 + li), wl = typeof w === 'function' ? w(li) : w, A = typeof amp === 'function' ? amp(li) : amp;
    let x = x0 + (r() - 0.3) * wl * 2;
    while (x < x1 - wl) {
      const len = Math.min(x1 - x, minLen + r() * (maxLen - minLen)); const pts = [];
      for (let xx = x; xx <= x + len; xx += Math.max(6, lambda / 14)) pts.push([xx, y + A * Math.sin((xx / lambda) * 6.283 + li * phaseStep) + slope * (xx - x0)]);
      if (pts.length > 1) out.push(cut(pts, wl * (0.9 + r() * 0.2), { seed: seed * 300 + li * 7 + out.length }));
      x += len + wl * (0.8 + r() * 1.6);
    }
  });
  return out;
}

// ---------- camera ----------
/** cam = { x, y, s }: world point at screen centre, scale. keys = [[t, rect|cam], ...] glided with smootherstep. */
// 16:9: the block always fills the frame. 9:16: the block is wider than the frame allows, so the camera may show
// a little of the dark bench around it (margin) instead of cropping the picture's sides.
export function camFit(L, rect, R, fill = L.landscape) {
  const W = L.width, H = L.height;
  let s = Math.min(W / rect.w, H / rect.h);
  const s0 = Math.max(W / R.w, H / R.h), s1 = Math.min(W / R.w, H / R.h);
  s = fill ? Math.max(s, s0) : Math.max(s, s1);
  let x = rect.x + rect.w / 2, y = rect.y + rect.h / 2;
  const m = fill ? 0 : L.px(36), vw = W / s / 2, vh = H / s / 2;
  const ax = (c, lo, len, v) => (v * 2 >= len + 2 * m ? lo + len / 2 : clamp(c, lo + v - m, lo + len - v + m));
  x = ax(x, R.x, R.w, vw); y = ax(y, R.y, R.h, vh);
  return { x, y, s };
}
export const camPage = L => ({ x: L.width / 2, y: L.height / 2, s: 1 });
export function camAt(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, c1, e] = keys[i];
    if (t <= t1) {
      const [t0, c0] = keys[i - 1]; const p = (e ?? smootherstep)(clamp((t - t0) / (t1 - t0)));
      // interpolate the visible window's edges (not centre + scale): nothing that is in both framings leaves the frame
      const w0 = 1 / c0.s, w1 = 1 / c1.s, w = lerp(w0, w1, p);
      const l = lerp(c0.x - w0 / 2 * 1e3, c1.x - w1 / 2 * 1e3, p), tp = lerp(c0.y - w0 / 2 * 1e3, c1.y - w1 / 2 * 1e3, p);
      return { x: l + w / 2 * 1e3, y: tp + w / 2 * 1e3, s: 1 / w };
    }
  }
  return keys[keys.length - 1][1];
}
export const camMatrix = (L, c) => [c.s, 0, 0, c.s, L.width / 2 - c.x * c.s, L.height / 2 - c.y * c.s];

// ---------- the block: carve view, print, pull ----------
/**
 * ops: ordered list — { cuts:[...], clip?: Path2D } | { erase: Path2D }.  colour: Path2D of the teal block (world).
 * pull: { t0 } local time the sheet is laid; stamp: { t, draw(g, w, h) , rect } ; pencil: { left, right }.
 * Returns { update(t, cam) } — cam is the camera for both views (the canvas uses it directly, the sheet via CSS).
 */
export function createBlock(root, ctx, o) {
  const L = ctx.layout, W = L.width, H = L.height, { R, band } = o.rects;
  const k = 1.25; // print resolution factor (the print is pushed in up to ~1.2×)
  const seed = o.seed ?? 1;
  const tex = bakeBlock(Math.round(R.w * k), Math.round(R.h * k), seed, k);
  const paper = bakePaper(Math.round(W * k), Math.round(H * k), seed + 40, k);
  // a frame line cut around the block before the story starts (t0 < 0) + an uneven block edge
  const fi = L.px(15), fw = L.px(5.5), fr = { x: R.x + fi, y: R.y + fi, w: R.w - 2 * fi, h: R.h - 2 * fi };
  const frameCuts = [[[fr.x - fw, fr.y], [fr.x + fr.w + fw, fr.y]], [[fr.x + fr.w, fr.y - fw], [fr.x + fr.w, fr.y + fr.h + fw]], [[fr.x + fr.w + fw, fr.y + fr.h], [fr.x - fw, fr.y + fr.h]], [[fr.x, fr.y + fr.h + fw], [fr.x, fr.y - fw]]]
    .map((pts, i) => cut(pts, fw, { seed: seed * 7 + i, t0: -2, dur: 0.1, entry: 0.02, exit: 0.02, tipMin: 0.6, chip: false }));
  if (o.frame !== false) o.ops = [{ cuts: frameCuts, noGuide: true }, ...o.ops];
  const edge = new Path2D(); {
    const e = [], rr = seq(seed + 77), amp = L.px(1.6);
    const side = (x0, y0, x1, y1) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / L.px(14)); for (let i = 0; i < n; i++) e.push([lerp(x0, x1, i / n) + (rr() - 0.5) * amp, lerp(y0, y1, i / n) + (rr() - 0.5) * amp]); };
    side(R.x, R.y, R.x + R.w, R.y); side(R.x + R.w, R.y, R.x + R.w, R.y + R.h); side(R.x + R.w, R.y + R.h, R.x, R.y + R.h); side(R.x, R.y + R.h, R.x, R.y);
    edge.moveTo(e[0][0], e[0][1]); for (const q of e.slice(1)) edge.lineTo(q[0], q[1]); edge.closePath();
  }
  const allCuts = o.ops.flatMap(op => op.cuts ?? []);
  const tEnd = Math.max(...allCuts.map(c => c.t0 + c.dur));

  root.style.background = C.bench;
  const view = canvas(W, H); view.setAttribute('data-name', o.name ? `${o.name} — block (carving)` : 'Block (carving)');
  Object.assign(view.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
  root.appendChild(view);
  const g = view.getContext('2d'), M = canvas(W, H), m = M.getContext('2d'), T = canvas(W, H), tg = T.getContext('2d'), S = canvas(W, H), sg = S.getContext('2d');

  // world (CSS camera) holding the paper sheet
  const world = document.createElement('div');
  Object.assign(world.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', transformOrigin: '0 0', perspective: (H * 2.4) + 'px', pointerEvents: 'none' });
  root.appendChild(world);
  const shadow = document.createElement('div');
  Object.assign(shadow.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', background: 'rgba(8,6,4,0.75)', filter: `blur(${L.px(30)}px)`, opacity: 0 });
  world.appendChild(shadow);
  const sheet = document.createElement('div');
  sheet.setAttribute('data-name', `${o.name ?? 'Print'} — paper sheet`);
  Object.assign(sheet.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', transformStyle: 'preserve-3d', display: 'none' });
  world.appendChild(sheet);
  const face = (rot) => { const d = document.createElement('div'); Object.assign(d.style, { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: rot }); sheet.appendChild(d); return d; };
  const back = face('rotateY(0deg)'), front = face('rotateY(180deg)');
  const backC = canvas(W * k, H * k), frontC = canvas(W * k, H * k);
  for (const cv of [backC, frontC]) Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
  back.appendChild(backC); front.appendChild(frontC);
  front.setAttribute('data-name', `${o.name ?? 'Print'} — the print`);

  // ---- mask of everything carved at time t (in the given transform)
  function drawMask(mg, t, mat) {
    mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, mg.canvas.width, mg.canvas.height);
    mg.setTransform(...mat); mg.fillStyle = '#fff';
    for (const op of o.ops) {
      if (op.erase) { if ((op.from ?? -1e9) <= t) { mg.globalCompositeOperation = 'destination-out'; mg.fill(op.erase); mg.globalCompositeOperation = 'source-over'; } continue; }
      let any = false;
      for (const c of op.cuts) if (t > c.t0) { any = true; break; }
      if (!any) continue;
      if (op.clip) { mg.save(); mg.clip(op.clip); }
      for (const c of op.cuts) { const p = cutP(c, t); if (p <= 0) continue; mg.fill(p >= 1 ? c.full : cutPath(c, p * c.L)); }
      if (op.clip) mg.restore();
    }
    // the block has edges: nothing outside R
    mg.globalCompositeOperation = 'destination-in'; mg.fill(edge); mg.globalCompositeOperation = 'source-over';
  }

  // ---- block view (screen canvas, camera applied in canvas so cuts stay sharp at any zoom)
  let lastKey = '';
  function drawBlock(t, cam) {
    const tq = Math.min(t, tEnd + F);
    const key = `${tq.toFixed(4)}|${cam.x.toFixed(2)}|${cam.y.toFixed(2)}|${cam.s.toFixed(5)}`;
    if (key === lastKey) return; lastKey = key;
    const mat = camMatrix(L, cam);
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.bench; g.fillRect(0, 0, W, H);
    g.setTransform(...mat);
    g.save(); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = L.px(26) * cam.s; g.shadowOffsetX = L.px(6) * cam.s; g.shadowOffsetY = L.px(10) * cam.s;
    g.fillStyle = C.stain; g.fillRect(R.x, R.y, R.w, R.h); g.restore();
    g.drawImage(tex.stain, R.x, R.y, R.w, R.h);
    g.strokeStyle = 'rgba(255,232,196,0.12)'; g.lineWidth = 2 / cam.s; g.strokeRect(R.x, R.y, R.w, R.h);
    // the design drawn on the block in white chalk before cutting (a carver's guide)
    g.lineWidth = Math.max(1.2, L.px(1.6)) / cam.s;
    // only the next ~1.5 s of work is drawn, so the chalk never gives the story away
    g.strokeStyle = 'rgb(236,226,206)';
    for (const op of o.ops) {
      if (!op.cuts || op.noGuide) continue;
      for (const c of op.cuts) {
        if (cutP(c, tq) >= 1) continue;
        const a = 0.17 * clamp((tq - (c.t0 - 1.5)) / 0.5); if (a <= 0.004) continue;
        g.globalAlpha = a; g.stroke(c.guide);
      }
    }
    g.globalAlpha = 1;
    drawMask(m, tq, mat);
    // raw wood through the mask
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, W, H); tg.setTransform(...mat);
    tg.drawImage(tex.wood, R.x, R.y, R.w, R.h);
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(M, 0, 0); tg.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(T, 0, 0);
    // cut walls: key light upper-left → shadow strip on the upper-left inside edge, light on the lower-right
    const d = L.px(2.6) * cam.s;
    for (const [dx, col] of [[d, 'rgba(26,16,8,0.62)'], [-d * 0.6, 'rgba(255,246,224,0.30)']]) {
      sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W, H); sg.drawImage(M, 0, 0);
      sg.globalCompositeOperation = 'destination-out'; sg.drawImage(M, dx, dx);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, W, H); sg.globalCompositeOperation = 'source-over';
      g.drawImage(S, 0, 0);
    }
    // wood chips curling off the gouge while it cuts
    g.setTransform(...mat);
    for (const c of allCuts) {
      const p = cutP(c, tq); if (!c.chip || p <= 0.02 || p >= 1) continue;
      if (c.w * cam.s < L.px(9)) continue; // too small to see a chip
      const f = cutFront(c, p), r = Math.min(c.w * 0.3, L.px(6)), ang = Math.atan2(f.ny, f.nx);
      const cx = f.x + f.nx * f.h * 1.1, cy = f.y + f.ny * f.h * 1.1;
      g.lineCap = 'round'; g.strokeStyle = C.woodDark; g.lineWidth = r * 0.72;
      g.beginPath(); g.arc(cx, cy, r * 0.75, ang + 0.6, ang + 0.6 + 2.8 * Math.min(1, p * 6)); g.stroke();
      g.strokeStyle = '#E4C594'; g.lineWidth = r * 0.42;
      g.beginPath(); g.arc(cx, cy, r * 0.75, ang + 0.7, ang + 0.6 + 2.6 * Math.min(1, p * 6)); g.stroke();
    }
  }

  // ---- print (drawn once): paper, teal block (misregistered), key block ink, pencil notes
  let printed = false;
  function drawPrint() {
    if (printed) return; printed = true;
    const pw = W * k, ph = H * k, mat = [k, 0, 0, k, 0, 0];
    const fg = frontC.getContext('2d');
    fg.drawImage(paper, 0, 0, pw, ph);
    // colour block (second block, printed first; registered a few px off and very slightly turned)
    const P2 = canvas(pw, ph), p2 = P2.getContext('2d');
    if (o.colour) {
      const [mx, my] = o.misreg ?? [L.px(7), L.px(-5)];
      p2.setTransform(k, 0, 0, k, 0, 0); p2.translate(mx + W / 2, my + H / 2); p2.rotate(0.0022); p2.translate(-W / 2, -H / 2);
      p2.fillStyle = C.teal; p2.fill(o.colour);
      p2.setTransform(1, 0, 0, 1, 0, 0); p2.globalCompositeOperation = 'destination-out'; p2.globalAlpha = 0.55;
      p2.drawImage(tex.starve, 0, 0, tex.starve.width, tex.starve.height, R.x * k + 40, R.y * k + 25, R.w * k, R.h * k); // its own block's grain (offset)
      p2.globalAlpha = 1; p2.globalCompositeOperation = 'source-over';
      // ink is thin on a colour block: the paper shows a little everywhere
      fg.globalAlpha = 0.9; fg.globalCompositeOperation = 'multiply'; fg.drawImage(P2, 0, 0); fg.globalAlpha = 1; fg.globalCompositeOperation = 'source-over';
    }
    // key block: ink everywhere except the cuts
    const Mk = canvas(pw, ph), mk = Mk.getContext('2d'); drawMask(mk, 1e9, mat);
    const K = canvas(pw, ph), kg = K.getContext('2d');
    kg.save(); kg.scale(k, k); kg.clip(edge); kg.drawImage(tex.ink, R.x, R.y, R.w, R.h); kg.restore();
    kg.globalCompositeOperation = 'destination-out'; kg.drawImage(Mk, 0, 0); kg.globalCompositeOperation = 'source-over';
    fg.globalCompositeOperation = 'multiply'; fg.drawImage(K, 0, 0); fg.globalCompositeOperation = 'source-over';
    // pencil, by hand, in the margin
    if (o.pencil) {
      const size = L.px(L.pick({ landscape: 36, portrait: 38 })) * k, y = (band.y + L.px(46)) * k;
      fg.font = `italic 400 ${size}px 'Instrument Serif'`; fg.fillStyle = C.pencil; fg.textBaseline = 'alphabetic';
      const hand = (str, x, s0, alignRight) => {
        let w = 0; for (const ch of str) w += fg.measureText(ch).width;
        let cx = alignRight ? x - w : x; const r = seq(s0);
        for (const ch of str) { fg.save(); fg.globalAlpha = 0.72 + r() * 0.2; fg.translate(cx, y + (r() - 0.5) * size * 0.06); fg.rotate((r() - 0.5) * 0.05 - 0.012); fg.fillText(ch, 0, 0); fg.restore(); cx += fg.measureText(ch).width; }
      };
      if (o.pencil.left) hand(o.pencil.left, band.x * k + L.px(4) * k, seed + 3, false);
      if (o.pencil.right) hand(o.pencil.right, (band.x + band.w) * k - L.px(4) * k, seed + 5, true);
    }
    // back of the sheet: same ink pressed through the paper, faint
    const bg = backC.getContext('2d');
    bg.drawImage(paper, 0, 0, pw, ph);
    bg.globalAlpha = 0.2; bg.globalCompositeOperation = 'multiply'; bg.drawImage(K, 0, 0); bg.globalAlpha = 1; bg.globalCompositeOperation = 'source-over';
  }

  // ---- stamp: a small extra block pressed into the margin after the pull
  let stampEl = null;
  if (o.stamp) {
    const s = o.stamp, sc = canvas(s.rect.w * k, s.rect.h * k), sg2 = sc.getContext('2d');
    sg2.scale(k, k); s.draw(sg2, s.rect.w, s.rect.h, tex);
    Object.assign(sc.style, { position: 'absolute', left: s.rect.x + 'px', top: s.rect.y + 'px', width: s.rect.w + 'px', height: s.rect.h + 'px', mixBlendMode: 'multiply', opacity: 0, transformOrigin: '50% 60%' });
    sc.setAttribute('data-name', s.name ?? 'Stamp');
    front.appendChild(sc); stampEl = sc;
  }

  const pull = o.pull ? { lay: o.pull.t0, rub: o.pull.t0 + 8 * F, turn: o.pull.t0 + 13 * F, done: o.pull.t0 + 30 * F } : null;

  return {
    tEnd, pull, R, band,
    update(t, cam) {
      // sheet + pull timeline
      const showSheet = pull && t >= pull.lay;
      const turned = pull && t >= pull.done;
      if (showSheet) drawPrint();
      view.style.display = turned ? 'none' : '';
      if (!turned) drawBlock(t, cam);
      world.style.transform = `matrix(${camMatrix(L, cam).map(v => +v.toFixed(5)).join(',')})`;
      sheet.style.display = showSheet ? '' : 'none';
      if (showSheet) {
        const pLay = ez.enter(clamp((t - pull.lay) / (8 * F)));
        const pTurn = clamp((t - pull.turn) / (pull.done - pull.turn));
        const e = ez.move(pTurn), arc = Math.sin(Math.PI * e);
        const y = (1 - pLay) * -H * 1.08;
        sheet.style.transform = `translate3d(${(arc * W * 0.02).toFixed(2)}px, ${(y - arc * H * 0.02).toFixed(2)}px, ${(arc * H * 0.16).toFixed(2)}px) rotateY(${(e * 180).toFixed(3)}deg) rotateZ(${(-arc * 1.6).toFixed(3)}deg)`;
        shadow.style.opacity = (pTurn > 0 && pTurn < 1 ? arc * 0.55 : 0).toFixed(3);
        shadow.style.transform = `translate(${(arc * W * 0.05).toFixed(1)}px, ${(arc * H * 0.05).toFixed(1)}px) scale(${(1 - arc * 0.08).toFixed(4)})`;
        // the paper is rubbed with a baren: the ink shows through more as it is pressed
        backC.style.opacity = 1;
        backC.style.filter = `contrast(${(1 + 0.6 * clamp((t - pull.rub) / (5 * F))).toFixed(3)})`;
      }
      if (stampEl) {
        const s = o.stamp, p = clamp((t - s.t) / (3 * F));
        stampEl.style.opacity = t >= s.t ? (0.35 + 0.65 * p).toFixed(3) : 0;
        stampEl.style.transform = `scale(${(1.05 - 0.05 * ez.enter(p)).toFixed(4)}) rotate(${s.rot ?? -0.6}deg)`;
      }
    },
  };
}

/** A small teal stamp block with carved (paper-showing) letters. */
export function stampDraw(text, cap, { seed = 21, wRel = 0.19 } = {}) {
  return (g, w, h, tex) => {
    g.fillStyle = C.teal;
    // slightly uneven block edge
    const r = seq(seed), j = () => (r() - 0.5) * cap * 0.05;
    g.beginPath(); g.moveTo(j(), j()); g.lineTo(w + j(), j()); g.lineTo(w + j(), h + j()); g.lineTo(j(), h + j()); g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 0.7; g.drawImage(tex.starve, 0, 0, w * 1.6, h * 1.6); g.globalAlpha = 1; // ink starvation
    const tw2 = textWidth(text, cap); const x0 = (w - tw2) / 2, y0 = (h - cap) / 2;
    const { cuts } = textCuts(text, x0, y0, cap, { wRel, seed });
    for (const c of cuts) g.fill(c.full);
    g.globalCompositeOperation = 'source-over';
  };
}
