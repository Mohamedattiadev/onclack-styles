// STITCH — "history embroidered by hand". The stitch engine shared by every scene.
// One canvas per cloth. Everything is a pure function of time: a stitch exists when t >= its time, the needle sits
// at the hole of the stitch being made, and all "imperfection" (stitch jitter, colour of each strand, tail curls)
// is seeded ONCE per object id — never per frame — so nothing boils.
// Coordinates are "fabric units" (1 unit = 1 px at camera zoom 1). The camera scales thread, holes and weave together.
import { rand, clamp, smootherstep, noise1 } from '/onclack-styles/engine/lib/anim.js';

export const F = 1 / 30;

/* ---------------- palette (thread + cloth) ---------------- */
export const PAL = {
  linen: [205, 190, 158],     // natural flax ground (light base)
  indigoCloth: [36, 45, 72],  // indigo-dyed linen (dark base, scenes 2–3A)
  indigo: [44, 62, 112],      // thread
  rust: [168, 82, 44],        // thread
  cream: [238, 228, 204],     // thread
  charcoal: [46, 43, 40],     // thread
  red: [204, 30, 38],         // ONE bright red thread: only the "no"
  pen: [86, 128, 196],        // water-soluble transfer pen (the pattern, before stitching)
  steel: [196, 200, 204],
};
export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (c, d, k) => [c[0] + (d[0] - c[0]) * k, c[1] + (d[1] - c[1]) * k, c[2] + (d[2] - c[2]) * k];
const light = (c, k) => mix(c, [255, 250, 240], k);
const dark = (c, k) => mix(c, [12, 10, 14], k);

/* ---------------- word timing ---------------- */
const clean = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Global start time of the n-th occurrence of `w` in words.json (fallback if missing). */
export function W(ctx, w, n = 0, fb = 0) {
  const hits = (ctx.words ?? []).filter(x => clean(x.word) === clean(w));
  return hits[n]?.start ?? fb;
}
export function WE(ctx, w, n = 0, fb = 0) {
  const hits = (ctx.words ?? []).filter(x => clean(x.word) === clean(w));
  return hits[n]?.end ?? fb;
}

/* ---------------- geometry helpers ---------------- */
export function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
export function pointAt(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= l || i === pts.length - 1) { const k = l ? clamp(d / l) : 0; return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], tan: l ? [(b[0] - a[0]) / l, (b[1] - a[1]) / l] : [1, 0] }; }
    d -= l;
  }
  return { p: pts[pts.length - 1], tan: [1, 0] };
}
export function smoothPts(pts, k = 2, closed = false) {
  const n = pts.length; return pts.map((_, i) => {
    let sx = 0, sy = 0, c = 0;
    for (let j = -k; j <= k; j++) { let m = i + j; if (closed) m = (m + n) % n; else if (m < 0 || m >= n) continue; sx += pts[m][0]; sy += pts[m][1]; c++; }
    return [sx / c, sy / c];
  });
}
/** Even resampling of a polyline (step in fabric units). */
export function resample(pts, step) { const L = polyLen(pts), n = Math.max(2, Math.round(L / step)), out = []; for (let i = 0; i <= n; i++) out.push(pointAt(pts, (L * i) / n).p); return out; }
export function inPoly(p, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
/** Intersections (parameter s along the line p + s·d) of an infinite line with a polygon. */
function lineHits(p, d, poly) {
  const out = [];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i], ex = b[0] - a[0], ey = b[1] - a[1];
    const den = d[0] * ey - d[1] * ex; if (Math.abs(den) < 1e-9) continue;
    const s = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den;
    const u = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den;
    if (u >= 0 && u < 1) out.push(s);
  }
  return out.sort((x, y) => x - y);
}
export function ellipse(cx, cy, rx, ry, n = 48, a0 = 0, a1 = Math.PI * 2) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return pts;
}

/* ---------------- letterforms ---------------- */
// Cross-stitch chart (5 × 7 cells). Drawn by us for this test.
const XS = {
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '], '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'], '3': ['#####', '   # ', '  #  ', '   # ', '    #', '#   #', ' ### '],
  '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '], '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': ['  ## ', ' #   ', '#    ', '#### ', '#   #', '#   #', ' ### '], '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '], '9': [' ### ', '#   #', '#   #', ' ####', '    #', '   # ', ' ##  '],
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'], B: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
  C: [' ### ', '#   #', '#    ', '#    ', '#    ', '#   #', ' ### '], D: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'], I: [' ### ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'], L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '# # #', '#   #', '#   #', '#   #'], N: ['#   #', '##  #', '# # #', '#  ##', '#   #', '#   #', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '], P: ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
  R: ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'], S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '], U: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '], W: ['#   #', '#   #', '#   #', '# # #', '# # #', '# # #', ' # # '],
  Y: ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '], '-': ['     ', '     ', '     ', ' ### ', '     ', '     ', '     '],
  '+': ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  ', '     '], ' ': ['   ', '   ', '   ', '   ', '   ', '   ', '   '],
  '.': ['  ', '  ', '  ', '  ', '  ', '##', '##'],
};
export const xsWidth = (str, cell, gap = 1) => [...str].reduce((s, ch) => s + ((XS[ch]?.[0].length ?? 5) + gap) * cell, -gap * cell);

// Single-line letters for backstitch (4 × 6 grid, y down). Drawn by us for this test.
const O_ = ellipse(2, 3, 2, 3, 14, -Math.PI / 2, Math.PI * 1.5);
const BS = {
  V: { w: 4, s: [[[0, 0], [2, 6], [4, 0]]] },
  S: { w: 4, s: [[[3.9, 0.9], [3, 0.05], [1, 0.05], [0.1, 0.9], [0.1, 2], [1, 2.75], [3, 3.25], [3.9, 4], [3.9, 5.1], [3, 5.95], [1, 5.95], [0.1, 5.1]]] },
  A: { w: 4, s: [[[0, 6], [2, 0], [4, 6]], [[0.75, 3.9], [3.25, 3.9]]] },
  I: { w: 1, s: [[[0.5, 0], [0.5, 6]]] },
  T: { w: 4, s: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]] },
  K: { w: 3.6, s: [[[0, 0], [0, 6]], [[3.6, 0], [0, 3.7]], [[1.2, 2.6], [3.6, 6]]] },
  Y: { w: 4, s: [[[0, 0], [2, 3.1], [4, 0]], [[2, 3.1], [2, 6]]] },
  M: { w: 4.6, s: [[[0, 6], [0, 0], [2.3, 3.8], [4.6, 0], [4.6, 6]]] },
  L: { w: 3.4, s: [[[0, 0], [0, 6], [3.4, 6]]] },
  E: { w: 3.4, s: [[[3.4, 0], [0, 0], [0, 6], [3.4, 6]], [[0, 3], [2.8, 3]]] },
  N: { w: 4, s: [[[0, 6], [0, 0], [4, 6], [4, 0]]] },
  O: { w: 4, s: [O_] },
  R: { w: 3.8, s: [[[0, 6], [0, 0], [2.8, 0], [3.8, 0.8], [3.8, 2.2], [2.8, 3], [0, 3]], [[2, 3], [3.8, 6]]] },
  H: { w: 4, s: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]] },
  P: { w: 3.8, s: [[[0, 6], [0, 0], [2.8, 0], [3.8, 0.8], [3.8, 2.2], [2.8, 3], [0, 3]]] },
  '.': { w: 0.8, s: [[[0.4, 5.5], [0.4, 6]]] },
  ' ': { w: 1.6, s: [] },
};
export const bsWidth = (str, u, track = 1.4) => [...str].reduce((s, ch) => s + ((BS[ch]?.w ?? 4) + track) * u, -track * u);

/* ---------------- the cloth ---------------- */
const tileCache = {};
/** Plain-weave linen tile (seamless), drawn at 2× so close-ups keep the weave sharp. */
function linenTile(kind) {
  if (tileCache[kind]) return tileCache[kind];
  const S = 512, p = 7; // tile px, thread pitch in tile px (= 3.5 fabric units)
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  const base = kind === 'indigo' ? PAL.indigoCloth : PAL.linen;
  const n = Math.round(S / p), pitch = S / n;
  const warpV = [], weftV = [], warpW = [], weftW = [];
  for (let i = 0; i < n; i++) { warpV.push(rand(i * 3.1 + 7) - 0.5); weftV.push(rand(i * 5.7 + 11) - 0.5); warpW.push(0.72 + rand(i * 9.3) * 0.22); weftW.push(0.7 + rand(i * 2.9 + 4) * 0.26); }
  // slubs: thicker, lighter stretches along a few threads (linen's character)
  const slub = (i, pos, s) => { const r = rand(i * 13.7 + s); if (r > 0.18) return 0; const c0 = rand(i * 4.1 + s) * S, L = 30 + rand(i + s) * 70; let dd = Math.abs(((pos - c0 + S * 1.5) % S) - S / 2); return dd < L ? (1 - dd / L) * 0.5 : 0; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = Math.floor(x / pitch), j = Math.floor(y / pitch), fx = x / pitch - i, fy = y / pitch - j;
    const warpTop = (i + j) % 2 === 0;
    const sw = slub(i, y, 1), sf = slub(j, x, 2);
    const ww = Math.min(0.98, warpW[i] + sw * 0.3), fw = Math.min(0.98, weftW[j] + sf * 0.3);
    const inWarp = Math.abs(fx - 0.5) < ww / 2, inWeft = Math.abs(fy - 0.5) < fw / 2;
    let v;
    if (warpTop && inWarp) v = 0.06 + warpV[i] * 0.16 + sw * 0.35 + Math.cos((fx - 0.5) / ww * Math.PI) * 0.12 - Math.abs(fy - 0.5) * 0.18;
    else if (inWeft) v = 0.04 + weftV[j] * 0.16 + sf * 0.35 + Math.cos((fy - 0.5) / fw * Math.PI) * 0.12 - Math.abs(fx - 0.5) * 0.18;
    else if (inWarp) v = warpV[i] * 0.12 - 0.08;
    else v = -0.42; // the tiny holes between threads
    const k = (y * S + x) * 4, amp = kind === 'indigo' ? 70 : 62;
    const tint = kind === 'indigo' ? [0.8, 0.9, 1.05] : [1, 0.97, 0.88];
    d[k] = clamp(base[0] + v * amp * tint[0], 0, 255); d[k + 1] = clamp(base[1] + v * amp * tint[1], 0, 255); d[k + 2] = clamp(base[2] + v * amp * tint[2], 0, 255); d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return (tileCache[kind] = c);
}
/** Large soft dye/flax mottling (not tiled) so the tile repeat never shows. */
function mottle(w, h, seed) {
  const s = 24, cw = Math.ceil(w / s), ch = Math.ceil(h / s);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'), img = g.createImageData(cw, ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const v = noise1(x * 0.21, seed) * 0.5 + noise1(y * 0.17 + x * 0.05, seed + 3) * 0.5 + (rand(x * 31 + y * 17 + seed) - 0.5) * 0.25;
    const k = (y * cw + x) * 4; img.data[k] = v > 0 ? 255 : 0; img.data[k + 1] = v > 0 ? 245 : 0; img.data[k + 2] = v > 0 ? 225 : 10; img.data[k + 3] = Math.abs(v) * (seed > 8 ? 12 : 20);
  }
  g.putImageData(img, 0, 0);
  return c;
}

export class Cloth {
  /**
   * opts: kind 'natural'|'indigo', bounds {x,y,w,h} (fabric area that can be seen), name.
   */
  constructor(root, ctx, opts = {}) {
    this.ctx = ctx; this.L = ctx.layout; this.kind = opts.kind ?? 'natural';
    this.bounds = opts.bounds ?? { x: -ctx.width, y: -ctx.height, w: ctx.width * 3, h: ctx.height * 3 };
    const cv = document.createElement('canvas'); cv.width = ctx.width; cv.height = ctx.height;
    Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    cv.setAttribute('data-name', opts.name ?? 'Cloth');
    root.appendChild(cv);
    this.cv = cv; this.g = cv.getContext('2d');
    this.layer = document.createElement('div'); Object.assign(this.layer.style, { position: 'absolute', inset: '0', pointerEvents: 'none' }); root.appendChild(this.layer);
    this.tile = linenTile(this.kind);
    this.pattern = this.g.createPattern(this.tile, 'repeat');
    this.mot = mottle(this.bounds.w, this.bounds.h, opts.seed ?? 3);
    this.items = []; this.runs = []; this.hot = []; this.extra = [];
    this.shadowCol = this.kind === 'indigo' ? [6, 10, 24] : [70, 48, 24];
    this.shadowA = this.kind === 'indigo' ? 0.55 : 0.4;
    this.sid = 0;
  }

  /* ---------- building runs (each run = one length of thread, sewn in order) ---------- */
  /** Add a run of stitches [[a,b],…]. t0 = first stitch starts, rate = stitches per second. Returns end time. */
  run(segs, o) {
    const { t0, rate = 12, color = PAL.charcoal, w = 3, needle = true, tail = null, name, pull = 1, shade = 1 } = o;
    const run = { t0, rate, color, w, needle, stitches: [], tail, t1: t0 + segs.length / rate, name, pull, lift: o.lift ?? 14, angle: o.angle ?? -0.92, park: o.park, pre: o.pre ?? 0.25, post: o.post ?? 0.35, needleLen: o.needleLen ?? 128 };
    segs.forEach(([a, b], i) => {
      const id = ++this.sid + (o.seed ?? 0) * 1000;
      const j = o.jitter ?? 0.5;
      const A = [a[0] + (rand(id * 1.7) - 0.5) * j, a[1] + (rand(id * 2.3) - 0.5) * j];
      const B = [b[0] + (rand(id * 3.1) - 0.5) * j, b[1] + (rand(id * 4.9) - 0.5) * j];
      const vary = (rand(id * 7.7) - 0.5) * 0.09 * shade;
      const col = vary > 0 ? light(color, vary) : dark(color, -vary);
      const st = { kind: 's', a: A, b: B, w: w * (0.94 + rand(id * 5.3) * 0.12), col, t: t0 + (i + 1) / rate, run, sheen: o.sheen ?? 1 };
      run.stitches.push(st); this.items.push(st);
    });
    if (tail && run.stitches.length) {
      const last = run.stitches[run.stitches.length - 1];
      this.items.push({ kind: 'tail', p: last.b, len: tail.len ?? 60, curl: tail.curl ?? 0.8, dir: tail.dir ?? 0.6, col: color, w: w * 0.75, t: run.t1 + 0.12, sway: tail.sway ?? 0, seed: this.sid });
    }
    this.runs.push(run);
    return run.t1;
  }
  /** Straight stitches of length `len` with gaps (running stitch) along a polyline. */
  static running(pts, len = 14, gap = 8, phase = 0) {
    const L = polyLen(pts), out = [];
    for (let d = phase; d + len * 0.5 < L; d += len + gap) {
      const a = pointAt(pts, d).p, e = Math.min(L, d + len), b = pointAt(pts, e).p;
      // stitches on curves: endpoints on the curve, straight between (as real thread does)
      out.push([a, b]);
    }
    return out;
  }
  /** Backstitch: continuous line of stitches of about `len`. */
  static back(pts, len = 12) {
    const L = polyLen(pts), n = Math.max(1, Math.round(L / len)), out = [];
    for (let i = 0; i < n; i++) out.push([pointAt(pts, (L * i) / n).p, pointAt(pts, (L * (i + 1)) / n).p]);
    return out;
  }
  /** Satin stitches across a spine: at every `sp` along the spine, a stitch across of width wFn(s 0..1). */
  static satinSpine(spine, wFn, sp = 4, { lean = 0, split = 0 } = {}) {
    const L = polyLen(spine), out = [];
    let k = 0;
    for (let d = sp * 0.5; d < L; d += sp, k++) {
      const { p, tan } = pointAt(spine, d), s = d / L, hw = wFn(s) / 2;
      if (hw < 0.6) continue;
      let nx = -tan[1], ny = tan[0];
      if (lean) { const c = Math.cos(lean), si = Math.sin(lean); [nx, ny] = [nx * c - ny * si, nx * si + ny * c]; }
      const a = [p[0] - nx * hw, p[1] - ny * hw], b = [p[0] + nx * hw, p[1] + ny * hw];
      pushSplit(out, a, b, split, k);
    }
    return out;
  }
  /** Satin fill of a polygon: stitch direction follows the local normal of a spine (thread follows the shape). */
  static satinPoly(poly, spine, sp = 4, { split = 0, pad = 0 } = {}) {
    const L = polyLen(spine), out = []; let k = 0;
    for (let d = sp * 0.5; d < L; d += sp, k++) {
      const { p, tan } = pointAt(spine, d); const nrm = [-tan[1], tan[0]];
      const hits = lineHits(p, nrm, poly);
      for (let i = 0; i + 1 < hits.length; i += 2) {
        const s0 = hits[i] - pad, s1 = hits[i + 1] + pad;
        if (s1 - s0 < 1.2) continue;
        pushSplit(out, [p[0] + nrm[0] * s0, p[1] + nrm[1] * s0], [p[0] + nrm[0] * s1, p[1] + nrm[1] * s1], split, k);
      }
    }
    return out;
  }
  /** Cross-stitch text. Returns { segs, w, h }. Rows are worked "/" left→right then "\" right→left. */
  static crossText(str, x, y, cell, { gap = 1 } = {}) {
    // worked letter by letter; inside a letter, a row of "/" left→right, then "\" back (so a half-done word reads)
    let cx = x; const e = cell * 0.07, segs = [];
    for (const ch of str) {
      const gl = XS[ch] ?? XS[' '];
      gl.forEach((row, j) => {
        const cells = [...row].map((c, i) => (c === '#' ? [cx + i * cell, y + j * cell] : null)).filter(Boolean);
        cells.forEach(([x0, y0]) => segs.push([[x0 + e, y0 + cell - e], [x0 + cell - e, y0 + e]]));
        [...cells].reverse().forEach(([x0, y0]) => segs.push([[x0 + e, y0 + e], [x0 + cell - e, y0 + cell - e]]));
      });
      cx += (gl[0].length + gap) * cell;
    }
    return { segs, w: cx - x - gap * cell, h: 7 * cell };
  }
  /** Backstitched text (single-line letters). u = grid unit. Returns { segs, w, strokes }. */
  static backText(str, x, y, u, { len, track = 1.4 } = {}) {
    let cx = x; const segs = [], strokes = [];
    for (const ch of str) {
      const gl = BS[ch] ?? BS[' '];
      for (const s of gl.s) { const pts = s.map(([px, py]) => [cx + px * u, y + py * u]); strokes.push(pts); segs.push(...Cloth.back(pts, len ?? u * 1.15)); }
      cx += (gl.w + track) * u;
    }
    return { segs, w: cx - x - track * u, strokes };
  }

  /* ---------- other objects ---------- */
  knot(x, y, r, color, t, seed = 0) { this.items.push({ kind: 'k', x, y, r, col: color, t, seed }); }
  /** Pattern traced in water-soluble pen (visible before and between stitches). */
  trace(pts, { t0 = -9, t1 = 99, dash = [6, 5], w = 1.5, a = 0.5 } = {}) { this.items.unshift({ kind: 'trace', pts, t0, t1, dash, w, a }); }
  /** A needle parked in the cloth with an unpulled thread through its eye. */
  parked(o) { this.items.push({ kind: 'park', ...o }); }
  /** Custom draw call in fabric space: fn(g, t, z) — drawn in insertion order. */
  custom(fn, t0 = -99, t1 = 99) { this.items.push({ kind: 'fn', fn, t: t0, t1 }); }
  /** Invisible hotspot so the studio can select a canvas element by name. rect in fabric units. */
  name(label, rect, t0 = -99, t1 = 99) {
    const d = document.createElement('div'); d.setAttribute('data-name', label);
    Object.assign(d.style, { position: 'absolute', display: 'none' }); this.layer.appendChild(d);
    this.hot.push({ d, rect, t0, t1 });
  }

  /* ---------- drawing ---------- */
  thread(g, pts, col, w, lift = 0, z = 1) {
    // a loose strand: shadow (further away when lifted), body, one sheen line
    const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else if (pts.length === 4) g.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); else pts.slice(1).forEach(p => g.lineTo(p[0], p[1])); };
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.translate(1.2 + lift * 0.5, 1.8 + lift * 0.8); path(); g.strokeStyle = rgb(this.shadowCol, this.shadowA * (lift > 2 ? 0.55 : 0.9)); g.lineWidth = w * 1.1; g.stroke();
    g.restore(); g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    path(); g.strokeStyle = rgb(col); g.lineWidth = w; g.stroke();
    g.translate(-w * 0.18, -w * 0.18); path(); g.strokeStyle = rgb(light(col, 0.32), 0.55); g.lineWidth = w * 0.26; g.stroke();
    g.restore();
  }
  stitch(g, s, z) {
    const [ax, ay] = s.a, [bx, by] = s.b, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, w = s.w;
    const ux = dx / L, uy = dy / L; let nx = -uy, ny = ux; if (nx + ny > 0) { nx = -nx; ny = -ny; } // n points toward the key light (upper-left)
    // shadow (key light upper-left)
    g.strokeStyle = rgb(this.shadowCol, this.shadowA); g.lineWidth = w * 1.12;
    g.beginPath(); g.moveTo(ax + 1.1, ay + 1.6); g.lineTo(bx + 1.1, by + 1.6); g.stroke();
    // body
    g.strokeStyle = rgb(s.col); g.lineWidth = w;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    // shade on the side away from the light (round thread)
    g.strokeStyle = rgb(dark(s.col, 0.35), 0.5); g.lineWidth = w * 0.3;
    g.beginPath(); g.moveTo(ax - nx * w * 0.33, ay - ny * w * 0.33); g.lineTo(bx - nx * w * 0.33, by - ny * w * 0.33); g.stroke();
    // twist of the floss: fine diagonal grooves
    if (w * z >= 3.2 && L > w * 1.4) {
      const n = Math.floor(L / (w * 0.75)); g.strokeStyle = rgb(dark(s.col, 0.45), 0.32); g.lineWidth = Math.max(0.5 / z, w * 0.1);
      g.beginPath();
      for (let k = 0; k < n; k++) {
        const c = (k + 0.5) / n, cx = ax + dx * c, cy = ay + dy * c, h = w * 0.42;
        g.moveTo(cx - nx * h - ux * h * 0.7, cy - ny * h - uy * h * 0.7); g.lineTo(cx + nx * h + ux * h * 0.7, cy + ny * h + uy * h * 0.7);
      }
      g.stroke();
    }
    // sheen: light catches the ridge facing the lamp
    if (s.sheen) {
      g.strokeStyle = rgb(light(s.col, 0.42), 0.62 * s.sheen); g.lineWidth = w * 0.24;
      const k0 = Math.min(0.3, w * 0.5 / L);
      g.beginPath(); g.moveTo(ax + dx * k0 + nx * w * 0.2, ay + dy * k0 + ny * w * 0.2); g.lineTo(bx - dx * k0 + nx * w * 0.2, by - dy * k0 + ny * w * 0.2); g.stroke();
    }
    // the thread dives into the weave: pinched, darker ends
    g.fillStyle = rgb(this.shadowCol, 0.28);
    g.beginPath(); g.arc(ax, ay, w * 0.36, 0, 7); g.arc(bx, by, w * 0.36, 0, 7); g.fill();
  }
  knotDraw(g, k) {
    const { x, y, r, col } = k;
    g.fillStyle = rgb(this.shadowCol, this.shadowA + 0.1); g.beginPath(); g.arc(x + r * 0.3, y + r * 0.45, r * 1.04, 0, 7); g.fill();
    g.fillStyle = rgb(dark(col, 0.12)); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    // wraps around the needle: two strand arcs
    const a0 = rand(k.seed * 3.3) * 6.28;
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const rr = r * (0.42 + i * 0.2), a = a0 + i * 2.1;
      g.strokeStyle = rgb(light(col, 0.18 + 0.1 * (2 - i))); g.lineWidth = r * 0.34;
      g.beginPath(); g.arc(x, y, rr, a, a + 2.4); g.stroke();
      g.strokeStyle = rgb(dark(col, 0.4), 0.45); g.lineWidth = r * 0.08;
      g.beginPath(); g.arc(x, y, rr + r * 0.17, a + 0.2, a + 2.2); g.stroke();
    }
    g.fillStyle = rgb(light(col, 0.6), 0.75); g.beginPath(); g.arc(x - r * 0.38, y - r * 0.4, r * 0.2, 0, 7); g.fill();
  }
  tailDraw(g, o, t) {
    const sway = o.sway ? noise1(t * 0.9, o.seed) * o.sway : 0;
    const d = o.dir + sway, c = o.curl, L = o.len, p = o.p;
    const p1 = [p[0] + Math.cos(d) * L * 0.45, p[1] + Math.sin(d) * L * 0.45];
    const p2 = [p[0] + Math.cos(d + c) * L * 0.8, p[1] + Math.sin(d + c) * L * 0.8];
    const p3 = [p[0] + Math.cos(d + c * 1.5) * L, p[1] + Math.sin(d + c * 1.5) * L];
    this.thread(g, [p, p1, p2, p3], o.col, o.w, 0);
    // frayed end: two fine fibres
    g.strokeStyle = rgb(light(o.col, 0.15), 0.8); g.lineWidth = o.w * 0.22; g.lineCap = 'round';
    g.beginPath(); g.moveTo(p3[0], p3[1]); g.lineTo(p3[0] + Math.cos(d + c * 1.9) * o.w * 2.2, p3[1] + Math.sin(d + c * 1.9) * o.w * 2.2);
    g.moveTo(p3[0], p3[1]); g.lineTo(p3[0] + Math.cos(d + c * 1.2) * o.w * 2.6, p3[1] + Math.sin(d + c * 1.2) * o.w * 2.6); g.stroke();
  }
  needle(g, tip, ang, lift, z, len = 150) {
    // a steel needle, tip at `tip`, body rising toward the eye; lift = height above the cloth (fabric units)
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    const body = (ox, oy) => {
      const P = (s, h) => [tip[0] + ux * s + nx * h + ox, tip[1] + uy * s + ny * h + oy];
      const pts = [P(0, 0), P(len * 0.16, 2.1), P(len * 0.93, 2.3), P(len, 1.2), P(len, -1.2), P(len * 0.93, -2.3), P(len * 0.16, -2.1)];
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    };
    g.save();
    g.fillStyle = rgb(this.shadowCol, this.kind === 'indigo' ? 0.6 : 0.42);
    body(3 + lift * 0.55, 4 + lift * 0.85); g.fill();
    const gr = g.createLinearGradient(tip[0] + nx * 2.4, tip[1] + ny * 2.4, tip[0] - nx * 2.4, tip[1] - ny * 2.4);
    gr.addColorStop(0, '#f4f5f4'); gr.addColorStop(0.35, '#c9ccce'); gr.addColorStop(0.7, '#7d8186'); gr.addColorStop(1, '#4b4f55');
    body(0, 0); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(30,32,36,0.55)'; g.lineWidth = 0.6; g.stroke();
    // eye (slot) — the thread goes through here
    const e0 = [tip[0] + ux * len * 0.86, tip[1] + uy * len * 0.86], e1 = [tip[0] + ux * len * 0.95, tip[1] + uy * len * 0.95];
    g.strokeStyle = 'rgba(40,36,34,0.9)'; g.lineWidth = 1.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(e0[0], e0[1]); g.lineTo(e1[0], e1[1]); g.stroke();
    // specular glint along the body
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(tip[0] + ux * len * 0.2 + nx * 1, tip[1] + uy * len * 0.2 + ny * 1); g.lineTo(tip[0] + ux * len * 0.8 + nx * 1, tip[1] + uy * len * 0.8 + ny * 1); g.stroke();
    g.restore();
    return [tip[0] + ux * len * 0.905, tip[1] + uy * len * 0.905];
  }
  /** The signature move: needle at the current hole, thread pulled from the last hole up through the eye. */
  needleFor(g, run, t, z) {
    if (!run.needle || t < run.t0 - run.pre || t > run.t1 + run.post) return;
    const n = run.stitches.length, k = (t - run.t0) * run.rate;
    const i = clamp(Math.floor(k), 0, n - 1), f = clamp(k - Math.floor(k));
    const s = run.stitches[i];
    let tip, from, lift;
    if (t < run.t0) { tip = s.a; from = s.a; lift = 16 * smootherstep((run.t0 - t) / Math.max(0.01, run.pre)); }
    else if (t > run.t1) { const e = smootherstep((t - run.t1) / Math.max(0.01, run.post)); tip = [s.b[0] + 30 * e, s.b[1] - 46 * e]; from = s.b; lift = 22 * e; }
    else {
      const e = smootherstep(f);
      tip = [s.a[0] + (s.b[0] - s.a[0]) * e, s.a[1] + (s.b[1] - s.a[1]) * e];
      from = s.a; lift = Math.sin(Math.PI * f) * run.lift * Math.min(1, 8 / run.rate + 0.25);
    }
    const ang = run.angle;
    const tipL = [tip[0] - lift * 0.35, tip[1] - lift * 0.55];
    const len = run.needleLen;
    const eye = [tipL[0] + Math.cos(ang) * len * 0.905, tipL[1] + Math.sin(ang) * len * 0.905];
    // pulled strand: from the hole up to the eye, sagging a little toward the light-side
    const mx = (from[0] + eye[0]) / 2, my = (from[1] + eye[1]) / 2, dl = Math.hypot(eye[0] - from[0], eye[1] - from[1]);
    const ctrl = [mx + dl * 0.18, my + dl * 0.22];
    this.thread(g, [from, ctrl, eye], run.color, run.w * 0.82, 6, z);
    this.needle(g, tipL, ang, lift + 8, z, len);
    // short tail beyond the eye
    const tl = [eye[0] + Math.cos(ang + 0.9) * 34, eye[1] + Math.sin(ang + 0.9) * 34];
    this.thread(g, [eye, [eye[0] + Math.cos(ang) * 18, eye[1] + Math.sin(ang) * 18], tl], run.color, run.w * 0.78, 10, z);
  }
  parkDraw(g, o, t, z) {
    // needle stuck in the cloth (tip hidden under the weave), thread through the eye lying slack on the cloth
    const lift = o.lift ? o.lift(t) : 0;
    const ang = o.angle ?? -0.8, len = o.len ?? 150;
    const tip = [o.p[0] - lift * 0.35, o.p[1] - lift * 0.55];
    // slack thread: from eye down to the cloth in a loop, then off as a tail
    const eye = [tip[0] + Math.cos(ang) * len * 0.905, tip[1] + Math.sin(ang) * len * 0.905];
    this.thread(g, [eye, ...o.slack.map(([dx, dy]) => [eye[0] + dx, eye[1] + dy])], o.col, o.w, 2, z);
    // hole where the tip went in
    g.fillStyle = rgb(this.shadowCol, 0.5); g.beginPath(); g.ellipse(o.p[0], o.p[1], 2.4, 1.6, 0, 0, 7); g.fill();
    this.needle(g, tip, ang, 10 + lift, z, len);
    const tl = [eye[0] + Math.cos(ang + 1.1) * 30, eye[1] + Math.sin(ang + 1.1) * 30];
    this.thread(g, [eye, [eye[0] + Math.cos(ang) * 14, eye[1] + Math.sin(ang) * 14], tl], o.col, o.w * 0.9, 9, z);
  }

  /** Draw the cloth at time t (global seconds) with camera {x, y, z} (fabric point at frame centre, zoom). */
  draw(t, cam) {
    const g = this.g, W = this.cv.width, H = this.cv.height, z = cam.z;
    const ox = W / 2 - cam.x * z, oy = H / 2 - cam.y * z;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = rgb(this.kind === 'indigo' ? PAL.indigoCloth : PAL.linen); g.fillRect(0, 0, W, H);
    g.setTransform(z, 0, 0, z, ox, oy);
    const x0 = cam.x - W / 2 / z - 4, y0 = cam.y - H / 2 / z - 4, vw = W / z + 8, vh = H / z + 8;
    this.pattern.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
    g.fillStyle = this.pattern; g.fillRect(x0, y0, vw, vh);
    g.imageSmoothingEnabled = true; g.globalAlpha = 1;
    const b = this.bounds; g.drawImage(this.mot, b.x, b.y, this.mot.width * 24, this.mot.height * 24);
    if (this.under) this.under(g, t, z);
    g.lineCap = 'round';
    const vis = (p, m = 80) => p[0] > x0 - m && p[0] < x0 + vw + m && p[1] > y0 - m && p[1] < y0 + vh + m;
    for (const it of this.items) {
      if (it.kind === 's') { if (t >= it.t && (vis(it.a) || vis(it.b))) this.stitch(g, it, z); }
      else if (it.kind === 'k') { if (t >= it.t && vis([it.x, it.y])) this.knotDraw(g, it); }
      else if (it.kind === 'tail') { if (t >= it.t) this.tailDraw(g, it, t); }
      else if (it.kind === 'trace') {
        if (t < it.t0 || t > it.t1) continue;
        const a = it.a * (1 - smootherstep((t - (it.t1 - 0.6)) / 0.6));
        g.save(); g.setLineDash(it.dash); g.strokeStyle = rgb(PAL.pen, a); g.lineWidth = it.w; g.beginPath();
        it.pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.restore();
      } else if (it.kind === 'fn') { if (t >= it.t && t <= it.t1) { g.save(); it.fn(g, t, z); g.restore(); g.lineCap = 'round'; } }
      else if (it.kind === 'park') { if (t >= it.t0 && t <= (it.t1 ?? 99)) this.parkDraw(g, it, t, z); }
    }
    for (const r of this.runs) this.needleFor(g, r, t, z);
    if (this.over) this.over(g, t, z);
    // one key light, upper-left: a lamp on the work table (warm, falls off toward lower-right)
    g.setTransform(1, 0, 0, 1, 0, 0);
    const lg = g.createRadialGradient(W * 0.22, H * 0.12, 0, W * 0.22, H * 0.12, Math.hypot(W, H) * 0.95);
    lg.addColorStop(0, 'rgba(255,236,200,0.07)'); lg.addColorStop(0.55, 'rgba(0,0,0,0)'); lg.addColorStop(1, `rgba(${this.kind === 'indigo' ? '4,8,20,0.34' : '40,24,8,0.26'})`);
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    // hotspots for the studio
    for (const h of this.hot) {
      const on = t >= h.t0 && t <= h.t1; h.d.style.display = on ? 'block' : 'none'; if (!on) continue;
      const r = typeof h.rect === 'function' ? h.rect(t) : h.rect;
      Object.assign(h.d.style, { left: (r[0] * z + ox).toFixed(1) + 'px', top: (r[1] * z + oy).toFixed(1) + 'px', width: (r[2] * z).toFixed(1) + 'px', height: (r[3] * z).toFixed(1) + 'px' });
    }
  }
}

function pushSplit(out, a, b, split, k) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (!split || L <= split) { out.push([a, b]); return; }
  // long-and-short: break long stitches, staggering the break so no seam line shows
  const n = Math.ceil(L / split), off = (k % 2 ? 0.5 : 0) / n;
  let prev = 0;
  for (let i = 1; i <= n; i++) {
    let s = i === n ? 1 : i / n - off; if (s <= prev + 0.08) continue;
    out.push([[a[0] + (b[0] - a[0]) * prev, a[1] + (b[1] - a[1]) * prev], [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]]);
    prev = s;
  }
}

/** Camera from shot keys: [[t, {x,y,z}], …] with smootherstep glides; plus a tiny hand-held breath + creep. */
export function camAt(t, keys, { breathe = 0.6, seed = 1 } = {}) {
  let c = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [ta, A] = keys[i - 1], [tb, B] = keys[i];
    if (t <= ta) break;
    if (t < tb) { const e = smootherstep((t - ta) / (tb - ta)); c = { x: A.x + (B.x - A.x) * e, y: A.y + (B.y - A.y) * e, z: A.z * Math.pow(B.z / A.z, e) }; break; }
    c = B;
  }
  return { x: c.x + noise1(t * 0.35, seed) * breathe, y: c.y + noise1(t * 0.31, seed + 5) * breathe, z: c.z };
}
