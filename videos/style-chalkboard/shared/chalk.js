// LECTURE CHALKBOARD — drawing kit. Everything is drawn on one <canvas> from global time g (pure function of time).
// Chalk = strokes filled with a grain pattern that is FIXED to the board (real chalk catches the board's tooth, so the
// grain does not move with the stroke). Tip strokes (lines, letters) + side-of-chalk strokes (wide, streaky shading).
// Eraser wipes cut the finished layer with a streaky mask → a ghost (5–18 % of the chalk) stays on the slate.
import { smootherstep } from '/onclack-styles/engine/lib/spring.js';

export const F = 1 / 30;
export const C = {
  slate: '#26332B', slateDeep: '#1B2620', white: [236, 238, 229], yellow: [242, 210, 104], pink: [240, 150, 182],
  wood: '#6B4A2E', woodDark: '#3E2A19',
};
export const FONT = '"Shantell Sans"';

export function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
/** Seeded PRNG (mulberry32) — deterministic, never Math.random. */
export function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (g, a, b) => (b <= a ? (g >= b ? 1 : 0) : clamp((g - a) / (b - a)));

// ---------------------------------------------------------------- grain patterns
// tooth: per-pixel alpha with holes (chalk skipping the low spots of the slate); streak: side-of-chalk drag lines.
function grainCanvas(seed, rgb, { size = 256, base = 0.7, spread = 0.55, holes = 0.2, streak = 0, streakDir = 'x', pressure = 0.5 } = {}) {
  const c = cv(size, size), g = c.getContext('2d'), img = g.createImageData(size, size), r = rng(seed), d = img.data;
  const lines = Array.from({ length: size }, () => r());
  // smooth the streak lines a little so they read as drag marks, not barcode
  const sl = lines.map((v, i) => (v * 2 + lines[(i + 1) % size] + lines[(i + size - 1) % size]) / 4);
  // low-frequency "pressure" noise (tileable value noise, two octaves) → chalk density breathes along a stroke
  const vn = (cells, sd) => { const rr = rng(sd), grid = Array.from({ length: cells * cells }, () => rr()); const cs = size / cells;
    return (x, y) => { const gx = x / cs, gy = y / cs, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const G = (i, j) => grid[((j % cells + cells) % cells) * cells + ((i % cells + cells) % cells)];
      return (G(x0, y0) * (1 - sx) + G(x0 + 1, y0) * sx) * (1 - sy) + (G(x0, y0 + 1) * (1 - sx) + G(x0 + 1, y0 + 1) * sx) * sy; }; };
  const n1 = vn(8, seed + 5), n2 = vn(32, seed + 9);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const lf = n1(x, y) * 0.6 + n2(x, y) * 0.4;
    let a = (base + (r() - 0.5) * spread) * (1 - pressure + pressure * lf * 1.5);
    if (pressure > 0 && lf < 0.32 && r() < 0.5) a *= 0.2;
    if (r() < holes) a *= 0.12;
    if (streak) a *= (1 - streak) + streak * Math.pow(sl[streakDir === 'x' ? y : x], 1.6) * 2.1;
    const i = (y * size + x) * 4;
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = clamp(a) * 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function makeKit(g2, px) {
  const pat = {}, mk = (key, seed, rgb, o) => { pat[key] = g2.createPattern(grainCanvas(seed, rgb, o), 'repeat'); };
  for (const [name, rgb, s] of [['white', C.white, 1], ['yellow', C.yellow, 2], ['pink', C.pink, 3]]) {
    mk(name, 11 * s, rgb, { holes: 0.2 });
    mk(name + 'Core', 17 * s, rgb, { base: 0.9, spread: 0.3, holes: 0.1, pressure: 0.6 });
    mk(name + 'Side', 23 * s, rgb, { base: 0.5, spread: 0.6, holes: 0.3, streak: 0.85, size: 192 });
  }
  // eraser mask: horizontal felt streaks, alpha 0.80–0.97 → the ghost left behind is uneven, like a real wiped board
  pat.erase = g2.createPattern(grainCanvas(91, [0, 0, 0], { base: 0.96, spread: 0.06, holes: 0, streak: 0.12, size: 256, pressure: 0 }), 'repeat');
  return pat;
}

// ---------------------------------------------------------------- geometry
export function pathLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
/** Resample + hand wobble (low-frequency drift, seeded) so no line is CAD-straight. */
export function wobble(pts, step, amp, seed) {
  const out = [], r = rng(seed), ph = [r() * 6.28, r() * 6.28];
  const L = pathLen(pts); let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(l / step));
    const nx = -(y1 - y0) / (l || 1), ny = (x1 - x0) / (l || 1);
    for (let k = i === 1 ? 0 : 1; k <= n; k++) {
      const u = k / n, s = (acc + l * u) / (L || 1);
      const w = amp * (Math.sin(s * 7.1 + ph[0]) * 0.6 + Math.sin(s * 17.3 + ph[1]) * 0.4);
      out.push([x0 + (x1 - x0) * u + nx * w, y0 + (y1 - y0) * u + ny * w]);
    }
    acc += l;
  }
  return out;
}
export function arc(cx, cy, rx, ry, a0, a1, n = 40) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
export function pointAt(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= l) { const u = l ? d / l : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u, Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
    d -= l;
  }
  const n = pts.length - 1; return [pts[n][0], pts[n][1], 0];
}
function toPath(pts) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); return p; }

// ---------------------------------------------------------------- items
// stroke: { pts, w, col, t0, t1 }  side: { pts, w, col, t0, t1 } (wide streaky shading)
// text: { str, x, y, size, col, t0, t1, seed } — hand-printed: each letter its own tilt/baseline/size, written left→right.
export function stroke(pts, o) {
  const pp = o.raw ? pts : wobble(pts, o.step ?? 6, o.amp ?? 1.6, o.seed ?? 1);
  return { kind: o.side ? 'side' : 'stroke', pts: pp, path: toPath(pp), len: pathLen(pp), w: o.w, col: o.col ?? 'white', t0: o.t0, t1: o.t1, alpha: o.alpha ?? 1 };
}

export function text(g2, str, x, y, size, o = {}) {
  const r = rng(o.seed ?? 7), font = `500 ${size}px ${FONT}`;
  g2.font = font;
  const chars = []; let cx = x;
  const track = o.track ?? 0.02;
  for (const ch of str) {
    const w = g2.measureText(ch).width;
    chars.push({ ch, x: cx, w, rot: (r() - 0.5) * 0.07, dy: (r() - 0.5) * size * 0.05, sc: 1 + (r() - 0.5) * 0.07 });
    cx += w + size * track;
  }
  const width = cx - x - size * track;
  if (o.align === 'center') for (const c of chars) c.x -= width / 2;
  if (o.align === 'right') for (const c of chars) c.x -= width;
  const left = chars[0].x;
  return { kind: 'text', str, chars, x: left, y, size, font, width, col: o.col ?? 'white', t0: o.t0, t1: o.t1, alpha: o.alpha ?? 1, bold: o.bold ?? 1 };
}

// ---------------------------------------------------------------- drawing
function drawStroke(g2, pat, it, g) {
  const p = prog(g, it.t0, it.t1); if (p <= 0) return null;
  const e = p >= 1 ? 1 : 1 - Math.pow(1 - p, 1.35); // hand slows a little at the end of a line
  const d = it.len * e;
  g2.save();
  g2.lineCap = 'round'; g2.lineJoin = 'round';
  if (e < 1) g2.setLineDash([d, it.len + 10]);
  g2.globalAlpha = it.alpha;
  if (it.kind === 'side') {
    g2.strokeStyle = pat[it.col + 'Side']; g2.lineWidth = it.w; g2.lineCap = 'butt'; g2.stroke(it.path);
  } else {
    g2.strokeStyle = pat[it.col]; g2.lineWidth = it.w; g2.stroke(it.path);
    g2.globalAlpha = it.alpha * 0.75; g2.strokeStyle = pat[it.col + 'Core']; g2.lineWidth = it.w * 0.5; g2.stroke(it.path);
  }
  g2.restore();
  return e < 1 ? pointAt(it.pts, d) : null;
}

function drawText(g2, pat, it, g) {
  const p = prog(g, it.t0, it.t1); if (p <= 0) return null;
  const n = it.chars.length, pos = p * n; let tip = null;
  g2.save();
  g2.font = it.font; g2.textBaseline = 'alphabetic'; g2.globalAlpha = it.alpha;
  for (let i = 0; i < n; i++) {
    const c = it.chars[i], q = clamp(pos - i); if (q <= 0) break;
    g2.save();
    g2.translate(c.x, it.y + c.dy); g2.rotate(c.rot); g2.scale(c.sc, c.sc);
    if (q < 1) { g2.beginPath(); g2.rect(-it.size * 0.1, -it.size * 1.2, (c.w + it.size * 0.2) * q, it.size * 1.6); g2.clip(); tip = [c.x + c.w * q, it.y - it.size * 0.3]; }
    const o = it.size * 0.012 * it.bold;
    g2.fillStyle = pat[it.col]; g2.fillText(c.ch, 0, 0); g2.fillText(c.ch, o, -o * 0.6); g2.fillText(c.ch, -o * 0.5, o * 0.7);
    g2.globalAlpha = it.alpha * 0.6; g2.fillStyle = pat[it.col + 'Core']; g2.fillText(c.ch, o * 0.3, 0);
    g2.restore();
  }
  g2.restore();
  return tip;
}

/** Draw items at time g; returns the active chalk tips (for dust). */
export function drawItems(g2, pat, items, g) {
  const tips = [];
  for (const it of items) {
    if (g < it.t0) continue;
    const tip = it.kind === 'text' ? drawText(g2, pat, it, g) : drawStroke(g2, pat, it, g);
    if (tip) tips.push({ tip, it });
  }
  return tips;
}

/** Chalk dust falling from the tip while it writes: specks are born along the recent tip path and fall. */
export function drawDust(g2, items, g, px) {
  g2.save();
  for (const it of items) {
    if (g < it.t0 || g > it.t1 + 0.9) continue;
    const r = rng(Math.round(it.t0 * 1000) + 3), n = it.kind === 'side' ? 26 : 14;
    for (let k = 0; k < n; k++) {
      const born = it.t0 + (it.t1 - it.t0) * r(), age = g - born, life = 0.5 + r() * 0.5;
      const rx = r(), ry = r(), sz = px(1.2 + r() * 2.2), drift = (r() - 0.5) * px(14);
      if (age < 0 || age > life) continue;
      let x, y;
      if (it.kind === 'text') { const c = it.chars[Math.min(it.chars.length - 1, Math.floor((born - it.t0) / (it.t1 - it.t0) * it.chars.length))]; x = c.x + c.w * rx; y = it.y - it.size * 0.2 * ry; }
      else { const pq = pointAt(it.pts, it.len * clamp((born - it.t0) / (it.t1 - it.t0))); x = pq[0]; y = pq[1]; }
      x += drift * age; y += px(260) * age * age + px(10) * age;
      g2.globalAlpha = 0.55 * (1 - age / life);
      g2.fillStyle = 'rgb(236,238,229)';
      g2.fillRect(x, y, sz, sz);
    }
  }
  g2.restore();
}

// ---------------------------------------------------------------- slate + frame (built once per format)
export function paintSlate(W0, H0, px, seed, frame, res = 1) {
  const c = cv(W0 * res, H0 * res), g = c.getContext('2d'), r = rng(seed), W = W0, H = H0;
  g.scale(res, res);
  g.fillStyle = C.slate; g.fillRect(0, 0, W, H);
  // mottling: big soft clouds, darker and lighter (old washes, hand grease)
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = r() * H, rad = px(120 + r() * 380), light = r() < 0.55;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, light ? `rgba(200,215,200,${0.012 + r() * 0.022})` : `rgba(8,14,10,${0.04 + r() * 0.06})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // old eraser swirls: wide arcs of faint dust (somebody wiped this board many times before us)
  g.lineCap = 'round';
  for (let i = 0; i < 22; i++) {
    const cx = r() * W, cy = r() * H, rad = px(160 + r() * 420), a0 = r() * 6.28, span = 0.6 + r() * 1.6;
    g.strokeStyle = `rgba(215,225,212,${0.008 + r() * 0.014})`; g.lineWidth = px(70 + r() * 90);
    g.beginPath(); g.arc(cx, cy, rad, a0, a0 + span); g.stroke();
  }
  for (let i = 0; i < 14; i++) { // horizontal felt passes
    const y = r() * H, x = r() * W * 0.6;
    g.strokeStyle = `rgba(215,225,212,${0.014 + r() * 0.016})`; g.lineWidth = px(60 + r() * 50);
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + W * 0.15, y + px(20), x + W * 0.3, y - px(30), x + W * (0.3 + r() * 0.3), y + px(10)); g.stroke();
  }
  // fine tooth
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  // ghosts of an earlier lecture: real chalk letters, then wiped with felt streaks so they can never be read
  const gh = cv(c.width, c.height), gg = gh.getContext('2d'), sc = res;
  gg.scale(sc, sc);
  const abc = 'aeinorstlchdmupbgyfwk';
  for (let line = 0; line < 11; line++) {
    const size = px(34 + r() * 40); gg.font = `500 ${size}px ${FONT}`;
    let x = r() * W0 * 0.85, y = px(60) + r() * (H0 - px(120)); const nw = 2 + Math.floor(r() * 4);
    gg.fillStyle = `rgba(232,236,226,${0.07 + r() * 0.05})`;
    gg.save(); gg.translate(x, y); gg.rotate((r() - 0.5) * 0.04); x = 0;
    for (let w = 0; w < nw; w++) { let wd = ''; const n = 2 + Math.floor(r() * 7); for (let k = 0; k < n; k++) wd += abc[Math.floor(r() * abc.length)]; gg.fillText(wd, x, 0); x += gg.measureText(wd + ' ').width; }
    gg.restore();
  }
  gg.lineCap = 'round';
  for (let i = 0; i < 5; i++) { gg.strokeStyle = `rgba(232,236,226,${0.08 + r() * 0.06})`; gg.lineWidth = px(5); const x = r() * W0, y = r() * H0, rr2 = px(50 + r() * 90); gg.beginPath(); gg.arc(x, y, rr2, r() * 3, 4 + r() * 2.5); gg.stroke(); }
  // felt streaks remove most of it (horizontal passes)
  gg.globalCompositeOperation = 'destination-out';
  for (let y = 0; y < H0; y += px(4)) { gg.fillStyle = `rgba(0,0,0,${0.6 + r() * 0.38})`; gg.fillRect(0, y, W0, px(4)); }
  for (let x = 0; x < W0; x += px(3)) { gg.fillStyle = `rgba(0,0,0,${r() * 0.35})`; gg.fillRect(x, 0, px(3), H0); }
  for (let i = 0; i < 20; i++) { gg.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.5})`; gg.fillRect(r() * W0, r() * H0, px(200 + r() * 500), px(60 + r() * 120)); }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `blur(${px(2.2) * res}px)`; g.drawImage(gh, 0, 0); g.restore();
  // wiped-over haze on top so the old ghosts sit "under" the slate
  g.fillStyle = 'rgba(38,51,43,0.25)'; g.fillRect(0, 0, W, H);
  // wooden frame + chalk tray
  if (frame) frame(g, r);
  return c;
}

/** Felt board eraser (top view). Wood back with grain, felt edge, chalk dust caked on the felt. */
export function makeEraser(px, seed) {
  const L = px(176), Wd = px(68), pad = px(24), c = cv(L + pad * 2, Wd + pad * 2), g = c.getContext('2d'), r = rng(seed);
  g.translate(pad, pad);
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = px(16); g.shadowOffsetX = px(6); g.shadowOffsetY = px(9);
  // felt (light grey, dusty)
  g.fillStyle = '#B9B9B0'; rr(g, 0, 0, L, Wd, px(8)); g.fill();
  g.shadowColor = 'transparent';
  // wooden back, slightly inset
  const inset = px(7); const gr = g.createLinearGradient(0, inset, 0, Wd - inset);
  gr.addColorStop(0, '#9A6A3E'); gr.addColorStop(0.5, '#86592F'); gr.addColorStop(1, '#6B4523');
  g.fillStyle = gr; rr(g, inset, inset, L - inset * 2, Wd - inset * 2, px(10)); g.fill();
  g.save(); rr(g, inset, inset, L - inset * 2, Wd - inset * 2, px(10)); g.clip();
  for (let i = 0; i < 26; i++) { // grain lines along the length
    const y = inset + r() * (Wd - inset * 2); g.strokeStyle = `rgba(50,28,12,${0.12 + r() * 0.2})`; g.lineWidth = px(0.8 + r() * 1.4);
    g.beginPath(); g.moveTo(inset, y); g.bezierCurveTo(L * 0.3, y + px((r() - 0.5) * 8), L * 0.6, y + px((r() - 0.5) * 8), L, y + px((r() - 0.5) * 4)); g.stroke();
  }
  // chalky thumb marks on the wood
  for (let i = 0; i < 5; i++) { const x = inset + r() * (L - inset * 2), y = inset + r() * (Wd - inset * 2), rad = px(8 + r() * 16); const q = g.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, 'rgba(235,235,225,0.22)'); q.addColorStop(1, 'rgba(235,235,225,0)'); g.fillStyle = q; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  g.restore();
  // dust on the felt edge
  for (let i = 0; i < 260; i++) { const side = r(); const x = r() * L, y = side < 0.5 ? r() * inset : Wd - r() * inset; g.fillStyle = `rgba(245,245,238,${0.2 + r() * 0.5})`; g.fillRect(x, y, px(1.5), px(1.5)); }
  return { canvas: c, L, Wd, pad };
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/** An eraser pass: boustrophedon sweeps over a rect, with human irregularity (curved passes, uneven spacing). */
export function wipePath(rect, passes, seed, px, { horizontal = true } = {}) {
  const r = rng(seed), pts = [];
  const { x, y, w, h } = rect;
  for (let i = 0; i < passes; i++) {
    const u = passes === 1 ? 0.5 : i / (passes - 1);
    const jitter = (r() - 0.5) * (horizontal ? h : w) / passes * 0.35;
    const a = (horizontal ? y + h * u : x + w * u) + jitter;
    const startEdge = i % 2 === 0, bow = (r() - 0.5) * px(60);
    const n = 10;
    for (let k = 0; k <= n; k++) {
      const v = startEdge ? k / n : 1 - k / n;
      const s = Math.sin(v * Math.PI) * bow;
      pts.push(horizontal ? [x + w * v, a + s] : [a + s, y + h * v]);
    }
  }
  return pts;
}

/** Camera: keys [[g, {x,y,s}]] → smootherstep between keys (holds have a tiny drift added by the caller). */
export function camAt(g, keys) {
  if (g <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (g <= keys[i][0]) {
      const [ta, a] = keys[i - 1], [tb, b] = keys[i], u = smootherstep((g - ta) / (tb - ta));
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, s: a.s + (b.s - a.s) * u };
    }
  }
  return keys[keys.length - 1][1];
}
