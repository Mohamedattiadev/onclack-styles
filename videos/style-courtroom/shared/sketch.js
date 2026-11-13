// REPORTAGE SKETCH — shared drawing kit. One "sheet" of toned pastel paper per scene, drawn live with
// charcoal, white chalk and two pastels. Every stroke is a pressure-tapered polygon revealed along its length;
// tooth (paper grain) breaks the dry media. Imperfection is fixed per stroke (seeded), never per frame.
// All times here are GLOBAL seconds (scene t + ctx.start), so two scenes can show the same sheet (s3 → s4).
import { rand, clamp, smootherstep, el } from '/onclack-styles/engine/lib/anim.js';

export const PAL = {
  paper: [189, 179, 162],   // #BDB3A2 toned pastel paper
  charcoal: '#1E1B19',
  chalk: '#F2EEE6',
  ochre: '#C98F3A',
  blue: '#5C84A6',
  board: '#2B2824',
};

// ---------- noise (periodic value noise, so the tooth tile is seamless) ----------
const hash = (x, y, s) => rand(x * 127.1 + y * 311.7 + s * 74.7);
function vnoise(x, y, period, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const w = (v) => ((v % period) + period) % period;
  const a = hash(w(xi), w(yi), seed), b = hash(w(xi + 1), w(yi), seed);
  const c = hash(w(xi), w(yi + 1), seed), d = hash(w(xi + 1), w(yi + 1), seed);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const TILE = 384;
let toothCache = null;
/** Paper tooth 0..1, a seamless 384 px tile: fine pits + a faint horizontal "laid" grain (pastel paper). */
function tooth() {
  if (toothCache) return toothCache;
  const T = new Float32Array(TILE * TILE);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const n = 0.55 * vnoise(x / 2.4, y / 2.0, TILE / 2.4 | 0 || 1, 3) + 0.3 * vnoise(x / 6, y / 4.5, TILE / 6, 7)
      + 0.15 * vnoise(x / 1.2, y / 1.2, TILE / 1.2, 11);
    const laid = 0.06 * Math.sin((y / TILE) * Math.PI * 2 * 64 + vnoise(x / 40, y / 40, TILE / 40, 5) * 2);
    T[y * TILE + x] = clamp(n + laid);
  }
  return (toothCache = T);
}
/** A mask tile: alpha = floor + (1 − floor) · smoothstep(lo, hi, tooth). Higher lo = only paper peaks take the medium. */
function maskTile(lo, hi, floor) {
  const T = tooth(), c = document.createElement('canvas');
  c.width = c.height = TILE;
  const g = c.getContext('2d'), im = g.createImageData(TILE, TILE);
  for (let i = 0; i < T.length; i++) {
    const p = clamp((T[i] - lo) / (hi - lo)), s = p * p * (3 - 2 * p);
    im.data[i * 4 + 3] = Math.round(255 * (floor + (1 - floor) * s));
  }
  g.putImageData(im, 0, 0);
  return c;
}

// ---------- geometry ----------
/** Catmull-Rom through control points → dense polyline. */
export function smooth(pts, per = 8) {
  if (pts.length < 3) {
    const out = [];
    for (let i = 0; i <= per; i++) out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * i / per, pts[0][1] + (pts[1][1] - pts[0][1]) * i / per]);
    return out;
  }
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
        + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
/** Place local points: scale s, rotate r (deg), then translate to (x, y). */
export const place = (pts, { x = 0, y = 0, s = 1, r = 0, fx = 1 } = {}) => {
  const c = Math.cos(r * Math.PI / 180), n = Math.sin(r * Math.PI / 180);
  return pts.map(([a, b]) => [x + s * (a * fx * c - b * n), y + s * (a * fx * n + b * c)]);
};
/** Zig-zag scribble filling a polygon region (pastel / charcoal tone), rows along `angle`. */
export function scribble(poly, { gap = 14, angle = -20, seed = 1, loose = 0.25 } = {}) {
  const a = angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const rot = poly.map(([x, y]) => [x * c + y * s, -x * s + y * c]);   // into row space
  const ys = rot.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const out = [];
  let row = 0;
  for (let y = y0 + gap * 0.5; y < y1; y += gap, row++) {
    const xs = [];
    for (let i = 0; i < rot.length; i++) {
      const [ax, ay] = rot[i], [bx, by] = rot[(i + 1) % rot.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) / (by - ay) * (bx - ax));
    }
    if (xs.length < 2) continue;
    const lo = Math.min(...xs), hi = Math.max(...xs), span = hi - lo;
    const jl = (rand(seed * 31 + row) - 0.5) * span * loose, jr = (rand(seed * 57 + row) - 0.5) * span * loose;
    const pair = row % 2 ? [hi + jr, lo + jl] : [lo + jl, hi + jr];
    for (const x of pair) out.push([x, y + (rand(seed * 13 + row * 7 + x) - 0.5) * gap * 0.5]);
  }
  return out.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

// ---------- the sheet ----------
const LAYERS = {
  pastel: { lo: 0.38, hi: 0.62, floor: 0.0, blend: 'normal' },
  charcoal: { lo: 0.3, hi: 0.55, floor: 0.12, blend: 'multiply' },
  notes: { lo: 0.18, hi: 0.5, floor: 0.45, blend: 'multiply' },
  chalk: { lo: 0.48, hi: 0.7, floor: 0.0, blend: 'normal' },
};

export class Sheet {
  constructor(root, ctx, { seed = 1, name = 'Sheet' } = {}) {
    const { width: W, height: H } = ctx;
    this.ctx = ctx; this.W = W; this.H = H; this.seed = seed;
    this.m = Math.round(Math.max(W, H) * 0.06);                        // paper bleeds past the frame
    const SW = W + 2 * this.m, SH = H + 2 * this.m;
    this.items = []; this.smudges = []; this.cache = {};
    this.p3d = el('div', { style: { position: 'absolute', inset: '0', perspective: `${Math.round(H * 2.6)}px`, perspectiveOrigin: '50% -10%' } }, root);
    this.flipper = el('div', { 'data-name': `${name} (page)`, style: { position: 'absolute', inset: '0', transformOrigin: '50% 0%', backfaceVisibility: 'hidden' } }, this.p3d);
    this.cam = el('div', { style: { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', transformOrigin: '0 0' } }, this.flipper);
    this.sheet = el('div', { 'data-name': name, style: { position: 'absolute', left: -this.m + 'px', top: -this.m + 'px', width: SW + 'px', height: SH + 'px' } }, this.cam);
    // paper (static): tone + tooth relief + soft mottling + one key light from upper left (a lamp over the board)
    const paper = el('canvas', { width: SW, height: SH, 'data-name': 'Toned paper', style: { position: 'absolute', inset: '0' } }, this.sheet);
    this.paintPaper(paper, SW, SH);
    this.layers = {};
    for (const [k, cfg] of Object.entries(LAYERS)) {
      const c = el('canvas', { width: SW, height: SH, 'data-name': `Layer: ${k}`, style: { position: 'absolute', inset: '0', mixBlendMode: cfg.blend } }, this.sheet);
      this.layers[k] = { c, g: c.getContext('2d'), mask: null, cfg };
    }
    this.shade = el('div', { style: { position: 'absolute', inset: '0', background: '#000', opacity: '0', pointerEvents: 'none' } }, this.flipper);
    this.cast = el('div', { style: { position: 'absolute', left: '0', right: '0', top: '0', height: '45%', opacity: '0', pointerEvents: 'none',
      background: 'linear-gradient(to bottom, rgba(20,16,12,0.55), rgba(20,16,12,0))' } }, root);
  }

  paintPaper(c, SW, SH) {
    const g = c.getContext('2d'), T = tooth(), [r0, g0, b0] = PAL.paper, s = this.seed;
    // tooth relief (one tile, repeated)
    const tile = document.createElement('canvas'); tile.width = tile.height = TILE;
    const tg = tile.getContext('2d'), im = tg.createImageData(TILE, TILE);
    for (let i = 0; i < T.length; i++) {
      const k = 1 + 0.085 * (T[i] - 0.5);
      im.data[i * 4] = r0 * k; im.data[i * 4 + 1] = g0 * k; im.data[i * 4 + 2] = b0 * k; im.data[i * 4 + 3] = 255;
    }
    tg.putImageData(im, 0, 0);
    g.fillStyle = g.createPattern(tile, 'repeat');
    g.fillRect(0, 0, SW, SH);
    // soft mottling of the dyed paper (coarse grid, scaled up smooth)
    const mw = Math.ceil(SW / 24), mh = Math.ceil(SH / 24), mc = document.createElement('canvas');
    mc.width = mw; mc.height = mh;
    const mg = mc.getContext('2d'), mi = mg.createImageData(mw, mh);
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
      const v = vnoise(x / 11, y / 11, 9999, s) - 0.5 + 0.5 * (vnoise(x / 3, y / 3, 9999, s + 1) - 0.5);
      const i = (y * mw + x) * 4, d = v > 0 ? 255 : 0;
      mi.data[i] = mi.data[i + 1] = mi.data[i + 2] = d; mi.data[i + 3] = Math.round(Math.abs(v) * 2 * 18);
    }
    mg.putImageData(mi, 0, 0);
    g.imageSmoothingQuality = 'high';
    g.globalCompositeOperation = 'soft-light';
    g.drawImage(mc, 0, 0, SW, SH);
    // one key light from the upper left (a lamp over the board), falling off to the lower right
    const lg = g.createLinearGradient(0, 0, SW, SH);
    lg.addColorStop(0, 'rgba(255,250,240,0.10)'); lg.addColorStop(0.55, 'rgba(255,250,240,0)'); lg.addColorStop(1, 'rgba(40,30,20,0.10)');
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = lg;
    g.fillRect(0, 0, SW, SH);
  }

  /** A stroke (frame coordinates). Returns the item; schedule it with seq()/at(). */
  stroke(ctrl, o = {}) {
    const id = this.items.length + 1, sd = this.seed * 1000 + id;
    let pts = o.raw ? ctrl : smooth(ctrl, o.per ?? 8);
    // overshoot both ends a little along the tangent (the hand does not stop on the corner)
    const over = o.over ?? 0;
    if (over && pts.length > 2) {
      const ext = (a, b, d) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [a[0] + dx / l * d, a[1] + dy / l * d]; };
      pts = [ext(pts[0], pts[1], over * (0.4 + rand(sd))), ...pts, ext(pts[pts.length - 1], pts[pts.length - 2], over * (0.4 + rand(sd + 9)))];
    }
    // hand wobble: fixed per stroke (seeded), a slow lateral drift
    const wob = o.wobble ?? 1.6;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1] || 1;
    if (wob) pts = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, u = cum[i] / 90;
      const n = Math.sin(u * 1.7 + sd) * 0.6 + Math.sin(u * 4.1 + sd * 1.3) * 0.4;
      return [p[0] - dy / l * n * wob, p[1] + dx / l * n * wob];
    });
    const it = { kind: 'stroke', id, pts, cum, L, layer: o.layer ?? 'charcoal', color: o.color ?? null, w: o.w ?? 4, alpha: o.alpha ?? 0.9,
      taper: o.taper ?? [0.12, 0.35], minW: o.minW ?? 0.25, jit: o.jit ?? 0.18, sd, t0: o.t0 ?? 0, t1: o.t1 ?? 0, dur: o.dur ?? null };
    this.items.push(it);
    return it;
  }

  /** Handwritten note: Caveat with per-letter jitter (seeded), written letter by letter. */
  text(str, x, y, o = {}) {
    const g = this.layers.notes.g, size = o.size ?? 64, id = this.items.length + 1, sd = this.seed * 1000 + id;
    g.font = `600 ${size}px Caveat`;
    const chars = [...str], xs = [];
    for (let i = 0; i < chars.length; i++) xs.push(g.measureText(chars.slice(0, i).join('')).width);
    const total = g.measureText(str).width;
    const ox = o.align === 'right' ? -total : o.align === 'center' ? -total / 2 : 0;
    const it = { kind: 'text', id, str, chars, xs, total, x: x + ox, y, size, rot: o.rot ?? 0, layer: o.layer ?? 'notes', color: o.color ?? PAL.charcoal,
      alpha: o.alpha ?? 0.92, bold: o.bold ?? 0, sd, t0: o.t0 ?? 0, cps: o.cps ?? 14, t1: 0 };
    it.t1 = it.t0 + chars.length / it.cps;
    this.items.push(it);
    return it;
  }

  /** A finger smudge (soft, no tooth) that fades in from t0 to t1. */
  smudge(poly, { t0, t1, alpha = 0.22, blur = 14, color = PAL.charcoal, layer = 'charcoal' } = {}) {
    const s = { poly, t0, t1, alpha, blur, color, layer };
    this.smudges.push(s);
    return s;
  }

  /** Box for the studio picker (moves with the paper). */
  name(label, [x, y, w, h]) {
    el('div', { 'data-name': label, style: { position: 'absolute', left: x + this.m + 'px', top: y + this.m + 'px', width: w + 'px', height: h + 'px' } }, this.sheet);
  }

  // ---------- drawing ----------
  drawStroke(g, it, f) {
    const { pts, cum, L, w, taper, minW, jit, sd } = it, upto = f * L;
    const left = [], right = [];
    const width = (s) => {
      const u = s / L;
      const a = taper[0] > 0 ? smootherstep(u / taper[0]) : 1, b = taper[1] > 0 ? smootherstep((1 - u) / taper[1]) : 1;
      const press = minW + (1 - minW) * Math.min(a, b);
      return w * press * (1 + jit * Math.sin(s / 23 + sd) * Math.sin(s / 7.3 + sd * 0.7));
    };
    let last = 0;
    for (let i = 0; i < pts.length; i++) {
      let p = pts[i], s = cum[i];
      if (s > upto) {
        if (i === 0) return;
        const k = (upto - cum[i - 1]) / ((s - cum[i - 1]) || 1);
        p = [pts[i - 1][0] + (p[0] - pts[i - 1][0]) * k, pts[i - 1][1] + (p[1] - pts[i - 1][1]) * k]; s = upto;
      }
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, hw = width(s) / 2;
      left.push([p[0] - dy / l * hw, p[1] + dx / l * hw]);
      right.push([p[0] + dy / l * hw, p[1] - dx / l * hw]);
      last = i;
      if (s >= upto) break;
    }
    if (left.length < 2) return;
    g.beginPath();
    g.moveTo(left[0][0], left[0][1]);
    for (const q of left) g.lineTo(q[0], q[1]);
    for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
    g.closePath();
    g.fill();
  }

  drawText(g, it, t) {
    const n = (t - it.t0) * it.cps;
    if (n <= 0) return;
    g.font = `600 ${it.size}px Caveat`;
    g.textBaseline = 'alphabetic';
    g.save();
    g.translate(it.x, it.y);
    g.rotate(it.rot * Math.PI / 180);
    for (let i = 0; i < it.chars.length && i < n; i++) {
      const ch = it.chars[i];
      if (ch === ' ') continue;
      const r = (rand(it.sd + i * 3.1) - 0.5) * 0.07, dy = (rand(it.sd + i * 5.7) - 0.5) * it.size * 0.05, sc = 1 + (rand(it.sd + i * 7.9) - 0.5) * 0.08;
      const part = clamp(n - i);
      g.save();
      g.translate(it.xs[i], dy);
      g.rotate(r);
      g.scale(sc, sc);
      if (part < 1) { g.beginPath(); g.rect(-it.size * 0.1, -it.size * 1.2, (g.measureText(ch).width + it.size * 0.1) * part + it.size * 0.05, it.size * 1.6); g.clip(); }
      g.fillText(ch, 0, 0);
      if (it.bold) { g.fillText(ch, it.bold, 0.4); g.fillText(ch, -it.bold * 0.5, -it.bold * 0.6); }
      g.restore();
    }
    g.restore();
  }

  /** Draw everything that exists at global time t. Layers redraw only when their state changed. */
  render(t) {
    const m = this.m;
    for (const [k, L] of Object.entries(this.layers)) {
      const items = this.items.filter((it) => it.layer === k && t > it.t0);
      const sm = this.smudges.filter((s) => s.layer === k && t > s.t0);
      const prog = (it) => it.kind === 'text' ? Math.min(it.chars.length, (t - it.t0) * it.cps) : clamp((t - it.t0) / Math.max(1e-3, it.t1 - it.t0));
      const key = items.map((it) => it.id + ':' + prog(it).toFixed(4)).join(',') + '|' + sm.map((s) => clamp((t - s.t0) / (s.t1 - s.t0)).toFixed(3)).join(',');
      if (this.cache[k] === key) continue;
      this.cache[k] = key;
      const g = L.g;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, L.c.width, L.c.height);
      if (!items.length && !sm.length) continue;
      g.setTransform(1, 0, 0, 1, m, m);
      for (const it of items) {
        g.globalAlpha = it.alpha;
        g.fillStyle = it.color ?? (k === 'chalk' ? PAL.chalk : PAL.charcoal);
        if (it.kind === 'text') this.drawText(g, it, t); else this.drawStroke(g, it, prog(it));
      }
      // tooth: the dry medium only sits on the paper's peaks
      if (!L.mask) L.mask = g.createPattern(maskTile(L.cfg.lo, L.cfg.hi, L.cfg.floor), 'repeat');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'destination-in';
      g.fillStyle = L.mask;
      g.fillRect(0, 0, L.c.width, L.c.height);
      // smudges go UNDER the strokes and fill the tooth (a finger pushes the dust into the paper)
      if (sm.length) {
        g.globalCompositeOperation = 'destination-over';
        g.setTransform(1, 0, 0, 1, m, m);
        for (const s of sm) {
          g.globalAlpha = s.alpha * smootherstep((t - s.t0) / (s.t1 - s.t0));
          g.filter = `blur(${s.blur}px)`;
          g.fillStyle = s.color;
          g.beginPath();
          s.poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
          g.closePath();
          g.fill();
        }
        g.filter = 'none';
      }
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
    }
  }

  /** Camera: frame shows sheet point (fx, fy) at the frame centre, scale s. */
  camera(s, fx, fy) {
    // never show past the paper's edge (the board only shows when a page flips)
    const hw = this.W / 2 / s, hh = this.H / 2 / s, m = this.m - 2;
    fx = Math.min(Math.max(fx, hw - m), this.W + m - hw);
    fy = Math.min(Math.max(fy, hh - m), this.H + m - hh);
    this.cam.style.transform = `translate(${this.W / 2 - fx * s}px, ${this.H / 2 - fy * s}px) scale(${s})`;
  }

  /** Page flip over the top of the pad: p 0 → 1. */
  flip(p) {
    if (p <= 0) { this.flipper.style.transform = ''; this.shade.style.opacity = '0'; this.cast.style.opacity = '0'; this.flipper.style.visibility = ''; return; }
    const e = p * p * (3 - 2 * p);
    const a = e * 112;
    this.flipper.style.transform = `translateY(${-e * this.H * 0.12}px) rotateX(${a}deg)`;
    this.flipper.style.visibility = a > 89 ? 'hidden' : '';
    this.shade.style.opacity = String(Math.min(0.45, e * 0.5));
    this.cast.style.opacity = String(Math.sin(Math.PI * clamp(p * 1.15)) * 0.7);
  }
}

/** Pastel laid with the side of the stick: 2 loose passes in different directions over an irregular patch. */
export function pastelPatch(S, poly, { color, w = 26, seed = 1, alpha = 0.5, angles = [-8, 28] } = {}) {
  return angles.map((a, i) => S.stroke(scribble(poly, { gap: w * (i ? 1.5 : 0.85), angle: a + (rand(seed + i) - 0.5) * 8, seed: seed + i * 17, loose: 0.45 }),
    { raw: true, layer: 'pastel', color, w: w * (i ? 0.7 : 1), alpha: alpha * (i ? 0.8 : 1), wobble: w * 0.25, taper: [0.01, 0.03], minW: 0.55, jit: 0.35 }));
}
/** Irregular blob polygon around (cx, cy) with radii rx, ry (seeded) — patches never have ruler edges. */
export function blob(cx, cy, rx, ry, seed = 1, n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 0.78 + 0.4 * rand(seed * 7 + i);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
}

// ---------- scheduling ----------
/** Lay strokes/texts one after another from t0 at `speed` px/s (strokes) with small lifts between them. Returns end time. */
export function seq(items, t0, { speed = 2200, gap = 0.035, min = 0.07 } = {}) {
  let t = t0;
  for (const it of items) {
    if (it.kind === 'text') { const d = it.t1 - it.t0; it.t0 = t; it.t1 = t + d; t += d + gap; continue; }
    const d = it.dur ?? Math.max(min, it.L / speed);
    it.t0 = t; it.t1 = t + d; t += d + gap;
  }
  return t;
}
/** Same as seq, but squeezed to finish exactly at t1 (the "quick sketch" in a fixed time). */
export function fit(items, t0, t1, opts = {}) {
  const end = seq(items, 0, opts), k = (t1 - t0) / (end || 1);
  for (const it of items) { it.t0 = t0 + it.t0 * k; it.t1 = t0 + it.t1 * k; }
  return t1;
}

// ---------- camera keys ----------
/** keys: [[t, s, fx, fy], ...] global times; camera-token style glide between keys + a calm creep. */
export function camAt(t, keys) {
  let k = keys[0];
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b[0]) {
      const p = smootherstep((t - a[0]) / (b[0] - a[0]));
      return [a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p, a[3] + (b[3] - a[3]) * p];
    }
    k = b;
  }
  return k.slice(1);
}
