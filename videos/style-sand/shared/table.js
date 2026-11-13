// SAND TABLE — one lit glass table, filmed top-down, locked off. Every scene module draws the same world at the same
// global time, so the four voice paragraphs are one continuous performance (no cuts, only sweeps of sand).
//
// How the picture is made (pure function of global time g):
//   1. Three half-res grey layers: SAND (thickness poured/pushed), CLEAR (finger lines that remove sand), DUST (sand
//      trickled or sprinkled on top, also onto clean glass). 255 grey = 2 sand units.
//   2. RIDGE = blurred CLEAR: sand pushed out of a finger line heaps up on both sides of it (the darker rim).
//   3. Height h = sand·(1−clear) + ridge + dust. Light through sand: T = exp(−K · h · grain). Grain is a fixed full-res
//      field (seeded per pixel, never per frame) → thin sand looks granular, thick sand goes umber, bare glass = backlight.
//   4. Colour = only the palette: umber #3A2614 → amber #E9B66A → cream #F6DFAE, mapped by T. No glow, no gradients added.
// Truth codes: everything here is VO/RC (an evocation drawn in sand), never evidence.
import { prng, textStrokes, measure, strokePartial } from './glyphs.js';

export const PAL = { umber: [0x3a, 0x26, 0x14], amber: [0xe9, 0xb6, 0x6a], cream: [0xf6, 0xdf, 0xae] };
const K = 2.7, LUTN = 2048, XMAX = 5;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
const sm = p => { p = clamp(p); return p * p * p * (p * (p * 6 - 15) + 10); };
/** Finger speed: near-constant with soft start/stop. */
export const wr = (g, t0, t1) => { const p = clamp((g - t0) / (t1 - t0)); return 0.55 * p + 0.45 * sm(p); };
const grey = v => { const k = Math.round(clamp(v / 2) * 255); return `rgb(${k},${k},${k})`; };
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

// ---------- statics per frame size (shared by all scene instances) ----------
const STATIC = new Map();
function statics(W, H) {
  const key = W + 'x' + H;
  if (STATIC.has(key)) return STATIC.get(key);
  const w = W / 2, h = H / 2;
  const gf = new Float32Array(W * H), speck = new Uint8Array(W * H), fall = new Float32Array(W * H);
  const cx = W / 2, cy = H / 2, R2 = cx * cx + cy * cy;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const a = hash(x, y, 11), b = hash(x >> 1, y >> 1, 23);
    gf[i] = 0.42 + 1.05 * a * a + 0.42 * b + 0.12 * hash(x >> 3, y >> 3, 37);
    speck[i] = hash(x, y, 51) > 0.9962 ? 1 : 0;
    const r2 = ((x - cx) ** 2 + (y - cy) ** 2) / R2;
    fall[i] = 1 - 0.13 * r2;
  }
  // colour LUT: x = h·grain → RGB
  const lut = new Uint8Array(LUTN * 3);
  for (let i = 0; i < LUTN; i++) {
    const T = Math.exp(-K * (i / (LUTN - 1)) * XMAX);
    const a = ss(0.0, 0.5, T), b = ss(0.42, 0.96, T);
    for (let c = 0; c < 3; c++) {
      const v1 = PAL.umber[c] + (PAL.amber[c] - PAL.umber[c]) * a;
      lut[i * 3 + c] = Math.round(v1 + (PAL.cream[c] - v1) * b);
    }
  }
  // spreading noise (half-res, grey 0..255): low-frequency lumps + streaks left by the flat of the hand
  const noise = document.createElement('canvas'); noise.width = w; noise.height = h;
  const ng = noise.getContext('2d');
  const small = document.createElement('canvas'); small.width = 36; small.height = Math.round(36 * h / w);
  const sg = small.getContext('2d'); const r = prng(5);
  for (let y = 0; y < small.height; y++) for (let x = 0; x < small.width; x++) { const k = Math.round(r() * 255); sg.fillStyle = `rgb(${k},${k},${k})`; sg.fillRect(x, y, 1, 1); }
  ng.imageSmoothingEnabled = true; ng.imageSmoothingQuality = 'high';
  ng.fillStyle = 'rgb(118,118,118)'; ng.fillRect(0, 0, w, h);
  ng.globalAlpha = 0.5; ng.filter = 'blur(6px)'; ng.drawImage(small, -20, -20, w + 40, h + 40); ng.filter = 'none'; ng.globalAlpha = 1;
  // hand-spread swirls: broad soft arcs, the marks a palm leaves when it spreads sand
  ng.globalCompositeOperation = 'lighter'; ng.lineCap = 'round'; ng.filter = 'blur(5px)';
  for (let i = 0; i < 70; i++) {
    const cx = r() * w, cy = r() * h, rad = (0.15 + r() * 0.5) * w, a0 = r() * 6.3, a1 = a0 + 0.4 + r() * 1.2;
    const k = Math.round(10 + r() * 22); ng.strokeStyle = `rgb(${k},${k},${k})`; ng.lineWidth = 6 + r() * 40;
    ng.beginPath(); ng.arc(cx, cy, rad, a0, a1); ng.stroke();
  }
  ng.globalCompositeOperation = 'source-over'; ng.filter = 'none';
  const s = { gf, speck, fall, lut, noise };
  STATIC.set(key, s);
  return s;
}

// ---------- world (layout-aware geometry + the story timeline) ----------
function makeWorld(L) {
  const P = L.portrait, W = L.width, H = L.height, u = L.unit;
  const pk = (l, p) => (P ? p : l);
  const fw = pk(16, 14) * u;            // finger width, big writing
  const fd = pk(8, 7) * u;              // finger detail line
  const word = (txt, x, y, hh, o = {}) => measure(textStrokes(txt, x, y, hh, o).strokes);

  // --- helpers that draw into the layers (c = { S, C, D } 2D contexts in full-res coordinates) ---
  const S = {
    base(c, v, vary = 0.3, edge = 0.4) {
      c.S.fillStyle = grey(Math.max(0, v - vary * 0.5)); c.S.fillRect(0, 0, W, H);
      c.S.save(); c.S.setTransform(1, 0, 0, 1, 0, 0); c.S.globalCompositeOperation = 'lighter'; c.S.globalAlpha = clamp(vary / 2);
      c.S.drawImage(c.noise, 0, 0); c.S.restore();
      if (edge) {   // sand drifts thicker toward the rim of the table
        const gr = c.S.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.56);
        gr.addColorStop(0, 'rgb(0,0,0)'); gr.addColorStop(1, grey(edge));
        c.S.save(); c.S.globalCompositeOperation = 'lighter'; c.S.fillStyle = gr; c.S.fillRect(0, 0, W, H); c.S.restore();
      }
    },
    pile(c, path, v, blur = 3, fill) {
      if (v <= 0.001) return;
      c.S.save(); c.S.globalCompositeOperation = 'lighter';
      // loose sand around the pushed shape (halo), then the packed core
      c.S.filter = `blur(${blur + 5}px)`; c.S.strokeStyle = grey(v * 0.3); c.S.lineWidth = 12 * u; c.S.lineJoin = 'round';
      path(c.S); c.S.stroke();
      c.S.filter = `blur(${blur}px)`; c.S.fillStyle = fill ?? grey(v); path(c.S); c.S.fill(); c.S.restore();
    },
    finger(c, m, p, width, blur = 1) {
      if (p <= 0) return;
      c.C.save(); c.C.strokeStyle = '#fff'; c.C.lineWidth = width; c.C.lineCap = 'round'; c.C.lineJoin = 'round';
      c.C.filter = `blur(${blur}px)`; strokePartial(c.C, m, p); c.C.restore();
    },
    trickle(c, m, p, width, v = 1.1) {
      if (p <= 0) return;
      c.D.save(); c.D.globalCompositeOperation = 'lighter'; c.D.strokeStyle = grey(v); c.D.lineWidth = width; c.D.lineCap = 'round'; c.D.lineJoin = 'round';
      c.D.filter = 'blur(1.2px)'; strokePartial(c.D, m, p); c.D.restore();
    },
    press(c, x, y, r, p) {           // fingertip pressed straight down: a clean round hole
      if (p <= 0) return;
      c.C.save(); c.C.fillStyle = '#fff'; c.C.filter = 'blur(1.5px)'; c.C.beginPath(); c.C.arc(x, y, r * (0.7 + 0.3 * sm(p)), 0, Math.PI * 2); c.C.fill(); c.C.restore();
    },
    ring(c, x, y, r, p, width, a0 = -Math.PI / 2) {
      if (p <= 0) return;
      c.C.save(); c.C.strokeStyle = '#fff'; c.C.lineWidth = width; c.C.lineCap = 'round'; c.C.filter = 'blur(1px)';
      c.C.beginPath(); c.C.arc(x, y, r, a0, a0 + Math.PI * 2 * clamp(p) * 1.04); c.C.stroke(); c.C.restore();
    },
  };

  // ===== 1 · DATE (0 → sweep 1) =====
  const dH = pk(200, 150) * u, dY = pk(0.40, 0.40) * H;
  const wOCT = textStrokes('OCT', 0, 0, dH, { align: 0 }).w, wLine = textStrokes('OCT 27', 0, 0, dH, { align: 0 }).w;
  const x0 = W / 2 - wLine / 2;
  const mOCT = word('OCT', x0, dY, dH, { align: 0, seed: 3 });
  const m27 = word('27', x0 + wOCT + 0.2 * dH * 2 + 0.32 * dH, dY, dH, { align: 0, seed: 4 });
  const m1962 = word('1962', W / 2, dY + dH * 1.5, dH, { seed: 5 });
  const DATE = (c, g) => {
    S.base(c, 0.36, 0.36, 0.55);
    S.finger(c, mOCT, wr(g, 0.5, 1.12), fw);
    S.finger(c, m27, wr(g, 1.14, 1.72), fw);
    S.finger(c, m1962, wr(g, 2.0, 2.92), fw);
  };

  // ===== 2 · SEA, SUB, CUBA, SHIPS, CHARGES, SILENCE =====
  const surf = pk(0.30, 0.30) * H;
  const sub = { x: pk(0.42, 0.5) * W, y: pk(0.68, 0.6) * H, len: pk(0.40, 0.74) * W };
  sub.hh = sub.len * 0.12;
  const subPath = g2 => {
    const { x, y, len, hh } = sub, st = x - len / 2, bw = x + len / 2;
    g2.beginPath();
    g2.moveTo(st, y);
    g2.bezierCurveTo(st + len * 0.12, y - hh * 0.55, st + len * 0.3, y - hh / 2, x, y - hh / 2);
    g2.lineTo(bw - hh * 0.7, y - hh / 2);
    g2.bezierCurveTo(bw - hh * 0.1, y - hh / 2, bw, y - hh * 0.2, bw, y);
    g2.bezierCurveTo(bw, y + hh * 0.25, bw - hh * 0.1, y + hh / 2, bw - hh * 0.7, y + hh / 2);
    g2.lineTo(x, y + hh / 2);
    g2.bezierCurveTo(st + len * 0.3, y + hh / 2, st + len * 0.12, y + hh * 0.5, st, y);
    g2.closePath();
    // sail (conning tower), set forward of centre
    const sx = x + len * 0.06, sw = len * 0.15, sh = hh * 0.95;
    g2.moveTo(sx - sw / 2, y - hh * 0.4);
    g2.lineTo(sx - sw * 0.42, y - hh * 0.4 - sh);
    g2.quadraticCurveTo(sx - sw * 0.1, y - hh * 0.45 - sh * 1.08, sx + sw / 2, y - hh * 0.4 - sh * 0.82);
    g2.lineTo(sx + sw * 0.55, y - hh * 0.4);
    g2.closePath();
    // rudder + stern planes
    g2.moveTo(st + len * 0.03, y - hh * 0.05); g2.lineTo(st - len * 0.02, y - hh * 0.55); g2.lineTo(st + len * 0.07, y - hh * 0.2); g2.closePath();
  };
  const mDeck = measure([[[sub.x - sub.len * 0.33, sub.y - sub.hh * 0.18], [sub.x + sub.len * 0.4, sub.y - sub.hh * 0.18]]]);
  const mWave = measure([Array.from({ length: 60 }, (_, i) => { const x = -40 + (W + 80) * i / 59; return [x, surf + 14 * u + Math.sin(i * 0.9) * 7 * u]; })]);
  const mWave2 = measure([
    Array.from({ length: 14 }, (_, i) => [W * pk(0.08, 0.1) + i * 22 * u, surf + 70 * u + Math.sin(i * 0.95) * 6 * u]),
    Array.from({ length: 11 }, (_, i) => [W * pk(0.66, 0.6) + i * 22 * u, surf + 120 * u + Math.sin(i * 0.95 + 1) * 6 * u]),
  ]);
  const cuba = { x: pk(0.84, 0.9) * W, w: pk(0.19, 0.26) * W, h: pk(0.07, 0.04) * H };
  const cubaPath = g2 => {
    const { x, w, h } = cuba, y = surf + 6 * u;
    g2.beginPath(); g2.moveTo(x - w / 2, y);
    g2.bezierCurveTo(x - w * 0.32, y - h * 0.5, x - w * 0.22, y - h * 0.9, x - w * 0.05, y - h * 0.85);
    g2.bezierCurveTo(x + w * 0.1, y - h * 1.05, x + w * 0.18, y - h * 0.55, x + w * 0.3, y - h * 0.6);
    g2.bezierCurveTo(x + w * 0.42, y - h * 0.5, x + w * 0.45, y - h * 0.2, x + w / 2, y);
    g2.closePath();
  };
  const mCuba = word('CUBA', pk(cuba.x, 0.72 * W), surf - cuba.h - pk(70, 64) * u, pk(60, 58) * u, { seed: 8 });
  const shipW = pk(0.075, 0.15) * W;
  const ships = [-0.32, 0.0, 0.3].map((f, i) => ({ x: sub.x + f * sub.len * pk(1, 0.82) - pk(0, 0.05 * W) + (i - 1) * 8 * u, t: 8.08 + i * 0.27 }));
  const shipPath = (x, w) => g2 => {
    const y = surf + 4 * u;
    g2.beginPath();
    g2.moveTo(x - w / 2, y - w * 0.12); g2.lineTo(x + w / 2, y - w * 0.15); g2.lineTo(x + w * 0.4, y + w * 0.05); g2.lineTo(x - w * 0.42, y + w * 0.05); g2.closePath();
    g2.rect(x - w * 0.16, y - w * 0.3, w * 0.3, w * 0.19);
    g2.rect(x - w * 0.03, y - w * 0.44, w * 0.06, w * 0.16);
  };
  const tgt = [[-0.27, -0.16], [0.07, -0.21], [0.33, -0.1]].map(([fx, fy], i) => ({
    x: sub.x + fx * sub.len, y: sub.y + fy * pk(H, H * 0.75), t: 10.05 + i * 0.3,
  }));
  const charges = ships.map((s, i) => {
    const tg = tgt[i], n = 5, y0 = surf + shipW * 0.2;
    return Array.from({ length: n }, (_, k) => ({ x: s.x + (tg.x - s.x) * (k + 1) / (n + 1), y: y0 + (tg.y - y0) * (k + 1) / (n + 1), t: 9.0 + i * 0.12 + k * 0.17 }));
  });
  const rr = pk(54, 46) * u;
  const grains = (() => { const r = prng(77); return Array.from({ length: 9000 }, () => [r() * W, r() * H, r()]); })();
  const SEA = (c, g) => {
    S.base(c, 0, 0.18);
    c.S.save(); c.S.filter = 'blur(3px)';
    const gr = c.S.createLinearGradient(0, surf, 0, H);
    gr.addColorStop(0, grey(0.36)); gr.addColorStop(0.55, grey(0.62)); gr.addColorStop(1, grey(0.9));
    c.S.fillStyle = gr; c.S.globalCompositeOperation = 'lighter'; c.S.fillRect(-20, surf, W + 40, H - surf + 20); c.S.restore();
    S.finger(c, mWave, 1, fd); S.finger(c, mWave2, 1, fd * 0.8);
    // the submarine is pushed together from stern to bow
    const fp = clamp((g - 4.2) / 0.62);
    if (fp > 0) {
      const st = sub.x - sub.len * 0.56, ln = sub.len * 1.12, edge = st + ln * sm(fp);
      const gr2 = c.S.createLinearGradient(st, 0, st + ln, 0);
      const e = clamp((edge - st) / ln), soft = 0.12;
      gr2.addColorStop(0, grey(1.2)); gr2.addColorStop(clamp(e - soft), grey(1.2)); gr2.addColorStop(clamp(e + 0.001), 'rgb(0,0,0)'); gr2.addColorStop(1, 'rgb(0,0,0)');
      S.pile(c, subPath, 1.2 * fp, 3.5 + 6 * (1 - fp), gr2);
    }
    S.finger(c, mDeck, wr(g, 4.92, 5.4), fd * 0.8);
    // Cuba rises out of the surface, then is named in trickled sand
    S.pile(c, cubaPath, 1.05 * ss(6.05, 6.5, g), 2 + 5 * (1 - ss(6.05, 6.5, g)));
    S.trickle(c, mCuba, wr(g, 6.3, 6.95), pk(7, 6.5) * u);
    // ships set down on the surface
    for (const s of ships) { const p = ss(s.t, s.t + 0.28, g); S.pile(c, shipPath(s.x, shipW), 1.15 * p, 2 + 5 * (1 - p)); }
    // depth charges: finger taps going down, then a ring drawn round each burst
    for (const col of charges) for (const d of col) S.press(c, d.x, d.y, pk(7.5, 7) * u, ss(d.t, d.t + 0.06, g));
    for (const tg of tgt) {
      S.ring(c, tg.x, tg.y, rr, (g - tg.t) / 0.2, fd, -1.2);
      S.ring(c, tg.x, tg.y, rr * 1.75, (g - tg.t - 0.12) / 0.26, fd * 0.85, 2.0);
    }
    // silence: sand sprinkled from above, slowly burying the marks
    const sp = ss(10.95, 12.9, g);
    if (sp > 0) {
      c.D.save(); c.D.globalCompositeOperation = 'lighter';
      c.D.fillStyle = grey(0.2 * sp); c.D.fillRect(0, 0, W, H);
      c.D.fillStyle = grey(0.9);
      const n = Math.floor(grains.length * sp);
      for (let i = 0; i < n; i++) { const [x, y, k] = grains[i]; const s2 = (1.4 + k * 2.2) * u; c.D.fillRect(x, y, s2, s2); }
      c.D.restore();
    }
  };

  // ===== 3 · TORPEDO =====
  // landscape: lies across the frame · portrait: stands up, nose to the surface (fills the tall frame)
  const tp = { x: W / 2, y: pk(0.5, 0.47) * H, len: pk(0.66, 0.62) * (P ? H : W) };
  tp.d = tp.len * pk(0.115, 0.13);
  const tm = (lx, ly) => (P ? [tp.x + ly, tp.y - lx] : [tp.x + lx, tp.y + ly]);   // local (x along body) → screen
  const torpPath = g2 => {
    const { len, d } = tp, tail = -len / 2, nose = len / 2, r = d / 2;
    const M = (x, y) => g2.moveTo(...tm(x, y)), Ln = (x, y) => g2.lineTo(...tm(x, y));
    const B = (a, b, c2, e, f, h2) => g2.bezierCurveTo(...tm(a, b), ...tm(c2, e), ...tm(f, h2));
    g2.beginPath();
    M(tail + len * 0.08, -r * 0.42); Ln(tail + len * 0.18, -r); Ln(nose - d * 0.9, -r);
    B(nose - d * 0.2, -r, nose, -r * 0.45, nose, 0); B(nose, r * 0.45, nose - d * 0.2, r, nose - d * 0.9, r);
    Ln(tail + len * 0.18, r); Ln(tail + len * 0.08, r * 0.42); g2.closePath();
    M(tail + len * 0.15, -r * 0.6); Ln(tail + len * 0.03, -r * 1.35); Ln(tail + len * 0.06, -r * 0.3); g2.closePath();
    M(tail + len * 0.15, r * 0.6); Ln(tail + len * 0.03, r * 1.35); Ln(tail + len * 0.06, r * 0.3); g2.closePath();
    M(tail + len * 0.025, -r * 0.7); Ln(tail + len * 0.055, -r * 0.7); Ln(tail + len * 0.055, r * 0.7); Ln(tail + len * 0.025, r * 0.7); g2.closePath();
  };
  const T0 = -tp.len / 2, Tr = tp.d / 2;
  const mBands = measure([0.24, 0.6, 0.64].map(f => [tm(T0 + tp.len * f, -Tr * 0.82), tm(T0 + tp.len * f + 2 * u, Tr * 0.82)]));
  const mTop = measure([[tm(T0 + tp.len * 0.2, -Tr * 0.52), tm(T0 + tp.len * 0.86, -Tr * 0.52)]]);
  const TORP = (c, g) => {
    S.base(c, 0.3, 0.3);
    S.pile(c, torpPath, 1.35, 2.5);
    S.finger(c, mTop, wr(g, 14.45, 14.85), fd * 0.8);
    S.finger(c, mBands, wr(g, 14.85, 15.3), fd);
  };

  // ===== 4 · THREE OFFICERS (from behind, no faces) =====
  const fW = pk(0.125, 0.2) * W, hy = pk(0.36, 0.38) * H;
  const xs = pk([0.27, 0.46, 0.72], [0.2, 0.44, 0.74]).map(f => f * W);
  const figPath = x => g2 => {
    const hr = fW * 0.2, cy = hy;
    g2.beginPath(); g2.ellipse(x, cy, hr, hr * 1.15, 0, 0, Math.PI * 2);
    g2.moveTo(x - hr * 0.82, cy + hr * 0.15); g2.ellipse(x - hr * 0.98, cy + hr * 0.15, hr * 0.2, hr * 0.33, 0, 0, Math.PI * 2);   // ears
    g2.moveTo(x + hr * 1.18, cy + hr * 0.15); g2.ellipse(x + hr * 0.98, cy + hr * 0.15, hr * 0.2, hr * 0.33, 0, 0, Math.PI * 2);
    // peaked cap seen from behind, worn high: band, then a crown wider than the head
    g2.moveTo(x - hr * 1.0, cy - hr * 0.5); g2.lineTo(x - hr * 1.06, cy - hr * 1.0); g2.lineTo(x + hr * 1.06, cy - hr * 1.0); g2.lineTo(x + hr * 1.0, cy - hr * 0.5); g2.closePath();
    g2.moveTo(x + hr * 1.5, cy - hr * 1.15); g2.ellipse(x, cy - hr * 1.15, hr * 1.5, hr * 0.4, 0, 0, Math.PI * 2);
    g2.rect(x - hr * 0.42, cy + hr * 0.8, hr * 0.84, hr * 0.7);
    // shoulders and back (tunic), sloping like a real person, not a block
    const b = cy + fW * 1.35;
    g2.moveTo(x - fW * 0.64, b);
    g2.bezierCurveTo(x - fW * 0.66, cy + fW * 0.7, x - fW * 0.64, cy + fW * 0.46, x - fW * 0.44, cy + fW * 0.4);
    g2.bezierCurveTo(x - fW * 0.28, cy + fW * 0.35, x - fW * 0.16, cy + fW * 0.27, x, cy + fW * 0.26);
    g2.bezierCurveTo(x + fW * 0.16, cy + fW * 0.27, x + fW * 0.28, cy + fW * 0.35, x + fW * 0.44, cy + fW * 0.4);
    g2.bezierCurveTo(x + fW * 0.64, cy + fW * 0.46, x + fW * 0.66, cy + fW * 0.7, x + fW * 0.64, b);
    g2.closePath();
  };
  const figFill = (c2, x) => { const gr = c2.createLinearGradient(0, hy + fW * 0.6, 0, hy + fW * 1.35); gr.addColorStop(0, grey(1.3)); gr.addColorStop(1, grey(0.05)); return gr; };
  const mCap = xs.map(x => measure([[[x - fW * 0.18, hy - fW * 0.2 * 0.98], [x + fW * 0.18, hy - fW * 0.2 * 0.98]]]));
  const mSpine = xs.map(x => measure([[[x - fW * 0.52, hy + fW * 0.5], [x - fW * 0.34, hy + fW * 0.43]], [[x + fW * 0.34, hy + fW * 0.43], [x + fW * 0.52, hy + fW * 0.5]]]));
  const hull = { x: W / 2, y: hy + fW * 0.35, rx: pk(0.44 * W, 0.47 * W), ry: pk(0.56 * H, 0.3 * H) };
  const mHull = measure([Array.from({ length: 97 }, (_, i) => { const a = Math.PI * 0.62 + i / 96 * Math.PI * 2; return [hull.x + Math.cos(a) * hull.rx * (1 + 0.01 * Math.sin(a * 5)), hull.y + Math.sin(a) * hull.ry]; })]);
  const dotY = hy - fW * 0.7, dotR = pk(19, 17) * u;
  const FIG = (c, g, { keep3 = false } = {}) => {
    S.base(c, 0.32, 0.3);
    S.finger(c, mHull, 1, fd * 1.1);
    xs.forEach((x, i) => {
      if (keep3 && i < 2) return;
      S.pile(c, figPath(x), 1.3, 2.5, figFill(c.S, x));
      S.finger(c, mCap[i], wr(g, 16.95 + i * 0.12, 17.25 + i * 0.12), fd * 0.7);
      S.finger(c, mSpine[i], wr(g, 17.3 + i * 0.12, 17.6 + i * 0.12), fd * 0.6);
    });
    if (!keep3) {
      S.press(c, xs[0], dotY, dotR, ss(18.3, 18.4, g));
      S.press(c, xs[1], dotY, dotR, ss(18.8, 18.9, g));
    }
    S.ring(c, xs[2], dotY, dotR * 1.05, (g - 20.2) / 0.32, fd * 0.6, -2.4);   // the third: an empty circle, no dot
  };

  // ===== 5 · NO — swept clean to the light, only the third man's patch of sand is left =====
  const patch = { x: xs[2], y: hy + fW * 0.42, r: pk(fW * 1.12, fW * 0.98) };
  const patchPath = g2 => {
    g2.beginPath(); g2.rect(-50, -50, W + 100, H + 100);
    for (let i = 0; i <= 48; i++) {
      const a = -i / 48 * Math.PI * 2, wob = 1 + 0.06 * Math.sin(a * 3 + 1) + 0.035 * Math.sin(a * 7 + 2);
      const px = patch.x + Math.cos(a) * patch.r * wob, py = patch.y + Math.sin(a) * patch.r * 1.12 * wob;
      i ? g2.lineTo(px, py) : g2.moveTo(px, py);
    }
    g2.closePath();
  };
  const nH = pk(118, 92) * u;
  const nX = pk(0.34 * W, 0.5 * W), nY = pk(0.42 * H, 0.66 * H);
  const mName = word('ARKHIPOV', nX, nY, nH, { seed: 12, track: 0.24 });
  const m2002 = word('2002', nX, nY + nH * pk(1.6, 1.75), nH * 0.72, { seed: 13 });
  const NO = (c, g) => {
    FIG(c, g, { keep3: true });
    c.C.save(); c.C.fillStyle = '#fff'; c.C.filter = 'blur(5px)'; patchPath(c.C); c.C.fill('evenodd'); c.C.restore();
    const rim = ss(21.85, 22.25, g);
    if (rim > 0) {
      c.D.save(); c.D.globalCompositeOperation = 'lighter'; c.D.filter = 'blur(5px)'; c.D.strokeStyle = grey(0.75 * rim); c.D.lineWidth = 18 * u;
      c.D.beginPath();
      for (let i = 0; i <= 48; i++) { const a = -i / 48 * Math.PI * 2, wob = 1 + 0.06 * Math.sin(a * 3 + 1) + 0.035 * Math.sin(a * 7 + 2); const px = patch.x + Math.cos(a) * patch.r * wob * 1.02, py = patch.y + Math.sin(a) * patch.r * 1.12 * wob * 1.02; i ? c.D.lineTo(px, py) : c.D.moveTo(px, py); }
      c.D.stroke(); c.D.restore();
    }
    S.trickle(c, mName, wr(g, 23.05, 23.98), pk(9, 8) * u, 1.25);
    S.trickle(c, m2002, wr(g, 24.12, 24.92), pk(8, 7) * u, 1.25);
  };
  const nearPatch = (x, y) => Math.hypot(x - patch.x, (y - patch.y) / 1.12) < patch.r * 1.18;

  const timeline = [
    { img: DATE },
    { t0: 3.3, t1: 4.05, dir: [1, 0.06], seed: 1, to: SEA },
    { t0: 13.5, t1: 14.32, dir: [-0.95, -0.3], seed: 2, to: TORP },
    { t0: 15.86, t1: 16.5, dir: [0.18, 1], seed: 3, to: FIG },
    { t0: 21.66, t1: 22.2, dir: [1, 0.1], seed: 4, to: NO, skip: nearPatch, push: 1.25 },
  ];
  return { W, H, u, P, pk, timeline };
}

// ---------- the table (canvas + per-frame compositing) ----------
export function buildTable(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, w = W / 2, h = H / 2;
  const st = statics(W, H);
  const world = makeWorld(L);
  const mk = (cw, ch) => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; return cv; };
  const lay = { S: mk(w, h), C: mk(w, h), D: mk(w, h), R: mk(w, h) };
  const g2 = Object.fromEntries(Object.entries(lay).map(([k, cv]) => [k, cv.getContext('2d', { willReadFrequently: true })]));
  const out = mk(W, H);
  out.dataset.name = 'Sand table (glass, backlit)';
  Object.assign(out.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
  root.appendChild(out);
  const og = out.getContext('2d');
  const img = og.createImageData(W, H);
  const hArr = new Float32Array(w * h);
  const c = { S: g2.S, C: g2.C, D: g2.D, noise: st.noise };

  // sweep front: the edge of a flat hand pushing sand across the glass
  const E = d => Math.abs(d[0]) * W / 2 + Math.abs(d[1]) * H / 2;
  function front(sw, s) {
    const n = Math.hypot(...sw.dir), d = [sw.dir[0] / n, sw.dir[1] / n], q = [-d[1], d[0]];
    const Q = Math.hypot(W, H) / 2 + 60, bow = 0.12 * E(d), pts = [];
    for (let i = 0; i <= 40; i++) {
      const qq = -Q + 2 * Q * i / 40, f = qq / Q;
      const off = s + bow * (1 - f * f) + (Math.sin(f * 9 + sw.seed) * 0.6 + Math.sin(f * 23 + sw.seed * 3) * 0.4) * 10 * world.u;
      pts.push([W / 2 + d[0] * off + q[0] * qq, H / 2 + d[1] * off + q[1] * qq]);
    }
    return { d, q, Q, pts };
  }
  const clipTo = (pts, d, sign, big) => g => {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) g.lineTo(p[0], p[1]);
    const a = pts[pts.length - 1], b = pts[0];
    g.lineTo(a[0] + d[0] * big * sign, a[1] + d[1] * big * sign);
    g.lineTo(b[0] + d[0] * big * sign, b[1] + d[1] * big * sign);
    g.closePath();
  };
  function drawImg(fn, g, clip) {
    for (const k of ['S', 'C', 'D']) { c[k].save(); if (clip) { clip(c[k]); c[k].clip(); } }
    fn(c, g);
    for (const k of ['S', 'C', 'D']) c[k].restore();
  }

  function compose(g) {
    for (const k of ['S', 'C', 'D']) { const x = g2[k]; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.globalAlpha = 1; x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.setTransform(0.5, 0, 0, 0.5, 0, 0); }
    const tl = world.timeline;
    let cur = tl[0].img, sweep = null;
    for (const s of tl.slice(1)) { if (g >= s.t1) cur = s.to; else if (g >= s.t0) { sweep = { ...s, from: cur }; break; } else break; }
    if (!sweep) { drawImg(cur, g); return; }
    const p = (g - sweep.t0) / (sweep.t1 - sweep.t0);
    const n = Math.hypot(...sweep.dir), d = [sweep.dir[0] / n, sweep.dir[1] / n];
    const e = E(d), R = 70 * world.u, s = -e - 0.12 * e - R + (2 * e + 0.12 * e + 3 * R) * (0.5 * p + 0.5 * sm(p));
    const fr = front(sweep, s), big = 4 * Math.hypot(W, H);
    drawImg(sweep.from, g, clipTo(fr.pts, d, 1, big));       // ahead of the hand: the old picture
    drawImg(sweep.to, g, clipTo(fr.pts, d, -1, big));        // behind it: the new one
    // the heap of sand riding in front of the hand + drag streaks behind it
    const S2 = g2.D; S2.save(); S2.globalCompositeOperation = 'lighter';
    const r = prng(sweep.seed * 31 + 7);
    const amp = (sweep.push ?? 1) * (0.55 + 0.45 * Math.sin(Math.PI * clamp(p * 1.4)));
    for (let i = 0; i < fr.pts.length; i++) {
      const [x, y] = fr.pts[i], k = r();
      if (sweep.skip?.(x, y)) continue;
      const rad = R * (0.8 + 0.6 * k), cx = x + d[0] * rad * 0.2, cy = y + d[1] * rad * 0.2;
      const gr = S2.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gr.addColorStop(0, grey(1.25 * amp * (0.7 + 0.5 * r()))); gr.addColorStop(1, 'rgb(0,0,0)');
      S2.fillStyle = gr; S2.beginPath(); S2.arc(cx, cy, rad, 0, Math.PI * 2); S2.fill();
    }
    S2.lineWidth = 2.2 * world.u; S2.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const f = r(), j = Math.min(fr.pts.length - 1, Math.floor(f * fr.pts.length)), [x, y] = fr.pts[j], ln = (120 + 260 * r()) * world.u;
      if (sweep.skip?.(x, y)) continue;
      const gr = S2.createLinearGradient(x, y, x - d[0] * ln, y - d[1] * ln);
      gr.addColorStop(0, grey(0.3)); gr.addColorStop(1, 'rgb(0,0,0)');
      S2.strokeStyle = gr; S2.beginPath(); S2.moveTo(x - d[0] * 6, y - d[1] * 6); S2.lineTo(x - d[0] * ln, y - d[1] * ln); S2.stroke();
    }
    S2.restore();
  }

  function render(g) {
    compose(g);
    const R = g2.R; R.setTransform(1, 0, 0, 1, 0, 0); R.filter = 'none'; R.fillStyle = '#000'; R.fillRect(0, 0, w, h);
    R.filter = 'blur(5px)'; R.drawImage(lay.C, 0, 0); R.filter = 'none';
    const sd = g2.S.getImageData(0, 0, w, h).data, cd = g2.C.getImageData(0, 0, w, h).data, dd = g2.D.getImageData(0, 0, w, h).data, rd = R.getImageData(0, 0, w, h).data;
    for (let i = 0, j = 0; i < hArr.length; i++, j += 4) {
      const s = sd[j] / 127.5, cl = cd[j] / 255, cb = rd[j] / 255;
      hArr[i] = s * (1 - cl) + 3.2 * Math.max(0, cb - cl) * Math.min(1.1, s) + dd[j] / 127.5;
    }
    const o = img.data, { gf, speck, fall, lut } = st, scale = (LUTN - 1) / XMAX;
    for (let y = 0; y < H; y++) {
      let fy = y * 0.5 - 0.25; if (fy < 0) fy = 0; const y0 = fy | 0, y1 = Math.min(h - 1, y0 + 1), ty = fy - y0;
      const r0 = y0 * w, r1 = y1 * w;
      for (let x = 0; x < W; x++) {
        let fx = x * 0.5 - 0.25; if (fx < 0) fx = 0; const x0 = fx | 0, x1 = Math.min(w - 1, x0 + 1), tx = fx - x0;
        const a = hArr[r0 + x0] + (hArr[r0 + x1] - hArr[r0 + x0]) * tx, b = hArr[r1 + x0] + (hArr[r1 + x1] - hArr[r1 + x0]) * tx;
        const hv = a + (b - a) * ty, i = y * W + x;
        let v = hv * gf[i];
        if (speck[i] && hv < 0.2) v += 0.75;            // a stray grain left on the glass
        let k = (v * scale) | 0; if (k >= LUTN) k = LUTN - 1;
        const f = fall[i], q = i * 4, l = k * 3;
        o[q] = lut[l] * f; o[q + 1] = lut[l + 1] * f; o[q + 2] = lut[l + 2] * f; o[q + 3] = 255;
      }
    }
    og.putImageData(img, 0, 0);
  }
  return { render, world };
}
