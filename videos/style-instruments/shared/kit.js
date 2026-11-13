// INSTRUMENTS kit — "the story told by the dials".
// Every instrument is painted ONCE into canvases at build time (enamel, wear, ink, glass), then only rotated/moved
// in update(t). Imperfection is seeded per object (never per frame), so the same scratch is always in the same place.
// Key light: upper-left work lamp → every shadow falls down-right.
import { clamp, lerp, rand, noise1, el } from '/onclack-styles/engine/lib/anim.js';
import { spring, smootherstep } from '/onclack-styles/engine/lib/spring.js';

export const PAL = {
  enamel: '#5f6553', enamelLt: '#757b67', enamelDk: '#3c4135', metal: '#2a2b26', steel: '#a7a79c',
  cream: '#e6dcc2', creamDk: '#cfc3a3', ink: '#17180f', red: '#a3261b', brass: '#9a8452', brassLt: '#cdb47b',
  bakelite: '#1c1b17', phosphorBg: '#1d231b', phosphor: '#a9b892', tape: '#e2dcc8', pencil: '#2a2a33',
};
export const NARROW = "'PT Sans Narrow'";
export const HAND = "'Caveat'";
export const F = 1 / 30;

// ---------- seeded helpers ----------
export function rng(seed) { let a = (seed * 2654435761) >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Global time of the n-th spoken occurrence of a word (falls back to `fb`). */
export function wordT(ctx, w, n = 0, fb = 0) { const h = ctx.words.filter(x => norm(x.word) === norm(w)); return h[n]?.start ?? fb; }
/** Same, but scene-local. */
export const wl = (ctx, w, n = 0, fb = 0) => wordT(ctx, w, n, ctx.start + fb) - ctx.start;
export const easeCam = p => smootherstep(p);
export const glideKeys = (t, keys) => { // keys: [[t0, t1, a, b], ...] chained numeric glides
  let v = keys[0][2];
  for (const [t0, t1, a, b] of keys) { if (t >= t0) v = lerp(a, b, smootherstep((t - t0) / Math.max(1e-6, t1 - t0))); }
  return v;
};

// ---------- canvas ----------
/** Fast per-pixel grain on a region (device pixels), seeded. amp = ± code values. */
export function noisePass(g, x, y, w, h, seed, amp = 8) {
  const T = g.getTransform(), X = Math.max(0, Math.floor(T.a * x + T.e)), Y = Math.max(0, Math.floor(T.d * y + T.f));
  const Wd = Math.min(g.canvas.width - X, Math.ceil(T.a * w)), Hd = Math.min(g.canvas.height - Y, Math.ceil(T.d * h));
  if (Wd <= 0 || Hd <= 0) return;
  const id = g.getImageData(X, Y, Wd, Hd), d = id.data;
  let a = (seed * 2654435761) >>> 0 || 1;
  for (let i = 0; i < d.length; i += 4) {
    a ^= a << 13; a ^= a >>> 17; a ^= a << 5; const n = ((a >>> 0) / 4294967296 - 0.5) * 2 * amp;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(id, X, Y);
}
export function mkCanvas(w, h, res) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * res); c.height = Math.ceil(h * res);
  const g = c.getContext('2d'); g.scale(res, res);
  return { c, g };
}

/** Painted enamel sheet: base coat, mottling, fine grain, scratches, edge chips, grime toward the bottom. */
export function enamel(g, x, y, w, h, seed, { base = PAL.enamel, wear = 1, rad = 10, chips = true } = {}) {
  const r = rng(seed);
  g.save();
  g.beginPath(); g.roundRect(x, y, w, h, rad); g.clip();
  g.fillStyle = base; g.fillRect(x, y, w, h);
  // broad mottling (uneven spray coat)
  for (let i = 0, nM = Math.min(110, 30 + w * h / 20000); i < nM; i++) {
    const cx = x + r() * w, cy = y + r() * h, rr = 20 + r() * Math.min(260, Math.max(w, h) * 0.18);
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
    const lt = r() < 0.5;
    gr.addColorStop(0, lt ? 'rgba(170,175,150,0.05)' : 'rgba(20,24,15,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  // fine grain specks
  noisePass(g, x, y, w, h, seed, 9);
  // grime collects low (lamp-soot and hands)
  const gg = g.createLinearGradient(0, y, 0, y + h);
  gg.addColorStop(0, 'rgba(255,250,225,0.035)'); gg.addColorStop(0.6, 'rgba(0,0,0,0)'); gg.addColorStop(1, 'rgba(18,16,8,0.16)');
  g.fillStyle = gg; g.fillRect(x, y, w, h);
  // scratches: short, slightly curved, mostly one direction (hands, tools)
  const nS = Math.round((12 + w * h / 7000) * wear);
  for (let i = 0; i < nS; i++) {
    const sx = x + r() * w, sy = y + r() * h, a = -0.5 + r() * 0.5 + (r() < 0.2 ? 1.6 : 0), l = 8 + r() ** 2 * 90;
    g.strokeStyle = r() < 0.75 ? `rgba(215,212,190,${0.12 + r() * 0.18})` : `rgba(10,10,6,${0.15 + r() * 0.15})`;
    g.lineWidth = 0.5 + r() * 0.8; g.beginPath(); g.moveTo(sx, sy);
    g.quadraticCurveTo(sx + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, sy + Math.sin(a) * l * 0.5 + (r() - 0.5) * 6, sx + Math.cos(a) * l, sy + Math.sin(a) * l);
    g.stroke();
  }
  // chips at the edges show dark primer/metal with a bright broken rim
  if (chips) {
    const nC = Math.round((4 + (w + h) / 90) * wear);
    for (let i = 0; i < nC; i++) {
      const side = Math.floor(r() * 4), u = r();
      const cx = side === 0 ? x + u * w : side === 1 ? x + w : side === 2 ? x + u * w : x;
      const cy = side === 0 ? y : side === 1 ? y + u * h : side === 2 ? y + h : y + u * h;
      const s = 1.5 + r() ** 3 * 5;
      g.beginPath();
      for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, rr = s * (0.5 + r() * 0.7); g.lineTo(cx + Math.cos(a) * rr * 1.5, cy + Math.sin(a) * rr); }
      g.closePath(); g.fillStyle = '#34372e'; g.fill();
      g.strokeStyle = 'rgba(200,200,180,0.22)'; g.lineWidth = 0.6; g.stroke();
    }
  }
  // edge bevel: light top-left, dark bottom-right
  g.lineWidth = 3;
  g.strokeStyle = 'rgba(230,228,205,0.16)'; g.beginPath(); g.moveTo(x + rad, y + 1.5); g.lineTo(x + w - rad, y + 1.5); g.moveTo(x + 1.5, y + rad); g.lineTo(x + 1.5, y + h - rad); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.moveTo(x + rad, y + h - 1.5); g.lineTo(x + w - rad, y + h - 1.5); g.moveTo(x + w - 1.5, y + rad); g.lineTo(x + w - 1.5, y + h - rad); g.stroke();
  g.restore();
}

/** Slotted screw head, seeded slot angle (never two the same). */
export function screw(g, x, y, rr, seed) {
  const r = rng(seed + 77);
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x + rr * 0.18, y + rr * 0.25, rr * 1.05, 0, 7); g.fill();
  const gr = g.createRadialGradient(x - rr * 0.35, y - rr * 0.4, rr * 0.1, x, y, rr);
  gr.addColorStop(0, '#c8c6b6'); gr.addColorStop(0.55, '#7d7c70'); gr.addColorStop(1, '#3d3d36');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
  const a = r() * Math.PI;
  g.strokeStyle = '#1b1b17'; g.lineWidth = rr * 0.28; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(x - Math.cos(a) * rr * 0.8, y - Math.sin(a) * rr * 0.8); g.lineTo(x + Math.cos(a) * rr * 0.8, y + Math.sin(a) * rr * 0.8); g.stroke();
  g.strokeStyle = 'rgba(230,228,210,0.25)'; g.lineWidth = rr * 0.08;
  g.beginPath(); g.moveTo(x - Math.cos(a) * rr * 0.8, y - Math.sin(a) * rr * 0.8 + rr * 0.16); g.lineTo(x + Math.cos(a) * rr * 0.8, y + Math.sin(a) * rr * 0.8 + rr * 0.16); g.stroke();
  g.restore();
}

/** Aged cream dial face with bezel shadow + paper specks. */
export function dialFace(g, cx, cy, R, seed, { color = PAL.cream } = {}) {
  const r = rng(seed + 5);
  g.save();
  g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
  g.fillStyle = color; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const yel = g.createRadialGradient(cx - R * 0.2, cy - R * 0.3, R * 0.1, cx, cy, R * 1.05);
  yel.addColorStop(0, 'rgba(255,252,238,0.10)'); yel.addColorStop(1, 'rgba(120,95,40,0.13)');
  g.fillStyle = yel; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  for (let i = 0; i < R * R / 30; i++) { g.fillStyle = r() < 0.7 ? 'rgba(90,70,30,0.08)' : 'rgba(255,255,245,0.12)'; g.fillRect(cx + (r() - 0.5) * 2 * R, cy + (r() - 0.5) * 2 * R, 0.7 + r(), 0.7 + r()); }
  // a few foxing stains, fixed per dial
  for (let i = 0; i < 3; i++) { const fx = cx + (r() - 0.5) * R * 1.4, fy = cy + (r() - 0.5) * R * 1.4, fr = R * (0.03 + r() * 0.06); const gr = g.createRadialGradient(fx, fy, 0, fx, fy, fr); gr.addColorStop(0, 'rgba(130,95,40,0.10)'); gr.addColorStop(1, 'rgba(130,95,40,0)'); g.fillStyle = gr; g.fillRect(fx - fr, fy - fr, fr * 2, fr * 2); }
  // bezel throws a crescent shadow down-right onto the face
  g.globalCompositeOperation = 'multiply';
  const sh = g.createRadialGradient(cx - R * 0.07, cy - R * 0.09, R * 0.86, cx - R * 0.07, cy - R * 0.09, R * 1.08);
  sh.addColorStop(0, 'rgba(255,255,255,1)'); sh.addColorStop(1, 'rgba(95,85,65,1)');
  g.fillStyle = sh; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  g.restore();
}

/** Bezel ring: 'brass' or 'black' (bakelite). Light from upper-left. */
export function bezel(g, cx, cy, R, w, kind = 'brass', seed = 1) {
  const r = rng(seed + 9);
  g.save();
  // cast shadow on the panel
  g.fillStyle = 'rgba(8,10,6,0.35)'; g.filter = `blur(${w * 0.5}px)`;
  g.beginPath(); g.arc(cx + w * 0.35, cy + w * 0.5, R + w, 0, 7); g.fill(); g.filter = 'none';
  const lin = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  if (kind === 'brass') { lin.addColorStop(0, '#d8c08a'); lin.addColorStop(0.35, '#a68d58'); lin.addColorStop(0.7, '#6d5a33'); lin.addColorStop(1, '#4a3d22'); }
  else { lin.addColorStop(0, '#4a4740'); lin.addColorStop(0.4, '#25241f'); lin.addColorStop(1, '#0f0f0c'); }
  g.fillStyle = lin; g.beginPath(); g.arc(cx, cy, R + w, 0, Math.PI * 2); g.moveTo(cx + R, cy); g.arc(cx, cy, R, Math.PI * 2, 0, true); g.fill('evenodd');
  // inner lip: dark top-left, light bottom-right (reverse of outer slope)
  const lip = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  lip.addColorStop(0, 'rgba(0,0,0,0.55)'); lip.addColorStop(1, kind === 'brass' ? 'rgba(240,220,170,0.4)' : 'rgba(150,150,140,0.25)');
  g.strokeStyle = lip; g.lineWidth = w * 0.22; g.beginPath(); g.arc(cx, cy, R + w * 0.11, 0, 7); g.stroke();
  // tarnish + scuffs on the ring
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, rr = R + w * (0.2 + r() * 0.75);
    g.fillStyle = kind === 'brass' ? (r() < 0.6 ? 'rgba(40,45,25,0.18)' : 'rgba(255,240,200,0.18)') : (r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)');
    g.beginPath(); g.ellipse(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1 + r() * w * 0.25, 0.6 + r() * 1.2, a + Math.PI / 2, 0, 7); g.fill();
  }
  g.restore();
}

/** Glass cover: one soft window reflection (the lamp), a smudge, dust. Static, drawn last. */
export function glass(g, cx, cy, R, seed) {
  const r = rng(seed + 31);
  g.save();
  g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
  // reflection of a rectangular lamp/hatch, upper-left, curved by the dome
  g.translate(cx, cy); g.rotate(-0.62);
  const rg = g.createLinearGradient(0, -R, 0, -R * 0.35);
  rg.addColorStop(0, 'rgba(255,252,240,0)'); rg.addColorStop(0.25, 'rgba(255,252,240,0.13)'); rg.addColorStop(0.7, 'rgba(255,252,240,0.05)'); rg.addColorStop(1, 'rgba(255,252,240,0)');
  g.fillStyle = rg; g.beginPath(); g.ellipse(0, -R * 0.55, R * 0.62, R * 0.3, 0, 0, 7); g.fill();
  g.restore();
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
  // thumb smudge
  const sx = cx + (r() - 0.2) * R * 0.8, sy = cy + (0.2 + r() * 0.5) * R;
  const sg = g.createRadialGradient(sx, sy, 0, sx, sy, R * 0.22);
  sg.addColorStop(0, 'rgba(235,230,210,0.07)'); sg.addColorStop(1, 'rgba(235,230,210,0)');
  g.fillStyle = sg; g.fillRect(sx - R * 0.3, sy - R * 0.3, R * 0.6, R * 0.6);
  for (let i = 0; i < R * 0.35; i++) { g.fillStyle = `rgba(240,235,215,${0.08 + r() * 0.18})`; g.beginPath(); g.arc(cx + (r() - 0.5) * 2 * R, cy + (r() - 0.5) * 2 * R, 0.3 + r() * 0.9, 0, 7); g.fill(); }
  // rim darkening where the glass meets the bezel
  const rim = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R);
  rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = rim; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  g.restore();
}

/** Dial scale: ticks, numerals, optional red sector, title text. Angles in degrees, 0 = up, clockwise. */
export function scale(g, cx, cy, R, o) {
  const { a0 = -135, a1 = 135, min = 0, max = 100, major = 10, minor = 2, labels = true, red, fmt = v => String(v), font = 1, ink = PAL.ink } = o;
  const ang = v => ((a0 + (a1 - a0) * (v - min) / (max - min)) - 90) * Math.PI / 180;
  g.save();
  if (red) {
    g.strokeStyle = PAL.red; g.lineWidth = R * 0.075; g.lineCap = 'butt';
    g.beginPath(); g.arc(cx, cy, R * 0.86, ang(red[0]), ang(red[1])); g.stroke();
  }
  g.strokeStyle = ink; g.lineCap = 'butt';
  for (let v = min; v <= max + 1e-9; v += minor) {
    const isM = Math.abs(Math.round(v / major) * major - v) < 1e-6, a = ang(v);
    const r0 = R * (isM ? 0.79 : 0.84), r1 = R * 0.92;
    g.lineWidth = isM ? R * 0.022 : R * 0.009;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
    if (isM && labels) {
      g.fillStyle = ink; g.font = `700 ${R * 0.14 * font}px ${NARROW}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(fmt(v), cx + Math.cos(a) * R * 0.64, cy + Math.sin(a) * R * 0.64 + R * 0.01);
    }
  }
  g.restore();
  return ang;
}

/** Hand-cut masking-tape label with handwritten ink (Caveat, seeded jitter per letter). */
export function tape(g, x, y, w, h, lines, seed, { rot = 0, size = 0.42, color = PAL.pencil } = {}) {
  const r = rng(seed + 400);
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot);
  // shadow
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.filter = 'blur(1.5px)'; g.fillRect(-w / 2 + 1.5, -h / 2 + 2, w, h); g.filter = 'none';
  // torn ends
  g.beginPath(); g.moveTo(-w / 2, -h / 2);
  g.lineTo(w / 2, -h / 2);
  for (let k = 0; k <= 8; k++) g.lineTo(w / 2 + (r() - 0.5) * 3, -h / 2 + (h * k) / 8);
  g.lineTo(-w / 2, h / 2);
  for (let k = 8; k >= 0; k--) g.lineTo(-w / 2 + (r() - 0.5) * 3, -h / 2 + (h * k) / 8);
  g.closePath();
  g.fillStyle = PAL.tape; g.fill();
  g.save(); g.clip();
  const tg = g.createLinearGradient(0, -h / 2, 0, h / 2); tg.addColorStop(0, 'rgba(255,255,250,0.15)'); tg.addColorStop(1, 'rgba(120,100,60,0.15)');
  g.fillStyle = tg; g.fillRect(-w, -h, 2 * w, 2 * h);
  for (let i = 0; i < w * h / 25; i++) { g.fillStyle = r() < 0.6 ? 'rgba(110,90,50,0.08)' : 'rgba(255,255,255,0.1)'; g.fillRect((r() - 0.5) * w, (r() - 0.5) * h, 1, 0.6); }
  g.restore();
  // writing
  const fs = h * size, n = lines.length;
  g.fillStyle = color; g.textBaseline = 'middle'; g.textAlign = 'left';
  lines.forEach((ln, li) => {
    const big = li === 0 ? 1 : 0.78;
    g.font = `600 ${fs * big}px ${HAND}`;
    const total = g.measureText(ln).width;
    let cx = -total / 2;
    const cy = -h / 2 + h * (li + 0.5) / n + (n === 1 ? 0 : (li === 0 ? h * 0.04 : -h * 0.02));
    for (const ch of ln) {
      const cw = g.measureText(ch).width;
      g.save(); g.translate(cx, cy + (r() - 0.5) * fs * 0.06); g.rotate((r() - 0.5) * 0.06); g.fillText(ch, 0, 0); g.restore();
      cx += cw;
    }
  });
  g.restore();
}

/** Engraved black label plate (white-filled engraving, like real panel plates). */
export function plateLabel(g, x, y, w, h, text, seed, { size = 0.5 } = {}) {
  const r = rng(seed + 900);
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 1.5, y + 2, w, h);
  const pg = g.createLinearGradient(x, y, x, y + h); pg.addColorStop(0, '#2b2a25'); pg.addColorStop(1, '#141410');
  g.fillStyle = pg; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(255,255,240,0.12)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.fillStyle = '#d9d3bd'; g.font = `700 ${h * size}px ${NARROW}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.letterSpacing = `${h * 0.04}px`;
  g.fillText(text, x + w / 2, y + h / 2 + h * 0.03);
  g.letterSpacing = '0px';
  for (let i = 0; i < w * h / 40; i++) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + r() * w, y + r() * h, 1.2, 0.5); }
  screw(g, x + h * 0.32, y + h / 2, h * 0.14, seed); screw(g, x + w - h * 0.32, y + h / 2, h * 0.14, seed + 1);
  g.restore();
}

// ---------- world objects ----------
/**
 * An instrument (or any object) in the world: a div at (x, y) of w×h world px, filled with canvas layers.
 * depth = where it sits along the lens' focus axis (camera rack-focuses between depths).
 */
export const RES_SCALE = 0.78; // global paint resolution trim (build time on a busy 2-core machine)
export function object(world, { x, y, w, h, depth = 0, name, res = 2, z = 2 }) {
  res *= RES_SCALE;
  const root = el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: z } }, world);
  const o = {
    root, x, y, w, h, depth, res,
    /** Static layer painted once. */
    layer(draw, { name: ln, z: lz, lowres } = {}) {
      const { c, g } = mkCanvas(w, h, lowres ? res * 0.5 : res);
      draw(g, w, h);
      Object.assign(c.style, { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px' });
      if (ln) c.dataset.name = ln; if (lz != null) c.style.zIndex = lz;
      root.appendChild(c); return c;
    },
    /** Moving part: canvas of size pw×ph drawn with pivot at (px,py) inside it, placed so pivot sits at (ax,ay) in the object.
     *  Returns set(angleDeg, dx, dy). shadow: casts a soft shadow down-right (lamp upper-left). */
    part(pw, ph, pxv, pyv, ax, ay, draw, { shadow = 0, name: pn } = {}) {
      const mk = isShadow => {
        const { c, g } = mkCanvas(pw, ph, res);
        draw(g, pw, ph, isShadow);
        Object.assign(c.style, { position: 'absolute', left: (ax - pxv) + 'px', top: (ay - pyv) + 'px', width: pw + 'px', height: ph + 'px', transformOrigin: `${pxv}px ${pyv}px` });
        if (isShadow) Object.assign(c.style, { filter: `blur(${shadow * 0.6}px) brightness(0)`, opacity: 0.32 });
        if (pn) c.dataset.name = pn + (isShadow ? ' shadow' : '');
        root.appendChild(c); return c;
      };
      const sh = shadow ? mk(true) : null, c = mk(false);
      return (deg = 0, dx = 0, dy = 0) => {
        c.style.transform = `translate(${dx}px,${dy}px) rotate(${deg}deg)`;
        if (sh) sh.style.transform = `translate(${dx + shadow * 0.55}px,${dy + shadow * 0.8}px) rotate(${deg}deg)`;
      };
    },
  };
  return o;
}

/** Needle painter: tapered pointer with counterweight; drawn pointing UP from the pivot. */
export function needlePainter(len, { width = 0.05, color = PAL.ink, tail = 0.22, tip } = {}) {
  return (g, pw, ph, isShadow) => {
    const cx = pw / 2, cy = ph / 2, w = len * width;
    g.fillStyle = color;
    g.beginPath(); g.moveTo(cx - w * 0.5, cy); g.lineTo(cx - w * 0.12, cy - len); g.lineTo(cx + w * 0.12, cy - len); g.lineTo(cx + w * 0.5, cy);
    g.lineTo(cx + w * 0.75, cy + len * tail); g.lineTo(cx - w * 0.75, cy + len * tail); g.closePath(); g.fill();
    if (tip && !isShadow) { g.fillStyle = tip; g.beginPath(); g.moveTo(cx - w * 0.2, cy - len * 0.72); g.lineTo(cx - w * 0.12, cy - len); g.lineTo(cx + w * 0.12, cy - len); g.lineTo(cx + w * 0.2, cy - len * 0.72); g.closePath(); g.fill(); }
    if (!isShadow) { g.strokeStyle = 'rgba(255,255,240,0.18)'; g.lineWidth = w * 0.12; g.beginPath(); g.moveTo(cx - w * 0.35, cy - len * 0.1); g.lineTo(cx - w * 0.1, cy - len * 0.95); g.stroke(); }
  };
}
export function hubPainter(R, kind = 'black') {
  return (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(cx + R * 0.2, cy + R * 0.3, R, 0, 7); g.fill();
    const gr = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    if (kind === 'brass') { gr.addColorStop(0, '#e2cb93'); gr.addColorStop(1, '#5d4c2a'); } else { gr.addColorStop(0, '#5b5a52'); gr.addColorStop(1, '#0d0d0b'); }
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  };
}

/**
 * Round gauge on a square enamel flange. Returns { obj, set(value, t) }.
 * o: { x, y, size, depth, seed, name, min, max, a0, a1, major, minor, red, fmt, title, unit, bezel, serial, tapeText }
 */
export function gauge(world, o) {
  const S = o.size, pad = S * 0.12, W = S + pad * 2, cx = W / 2, cy = W / 2;
  const R = S * 0.38, bw = S * 0.055;
  const obj = object(world, { x: o.x - W / 2, y: o.y - W / 2, w: W, h: W + (o.tapeText ? S * 0.22 : 0), depth: o.depth, name: o.name, res: o.res ?? 2 });
  let ang;
  obj.layer(g => {
    // flange shadow + flange
    g.save(); g.fillStyle = 'rgba(6,8,4,0.45)'; g.filter = `blur(${S * 0.03}px)`; g.fillRect(pad + S * 0.03, pad + S * 0.05, S, S); g.restore();
    enamel(g, pad, pad, S, S, o.seed, { base: o.flange ?? PAL.enamelLt, rad: S * 0.06, wear: 1.2 });
    [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]].forEach(([u, v], i) => screw(g, pad + S * u, pad + S * v, S * 0.028, o.seed + i));
    bezel(g, cx, cy, R, bw, o.bezel ?? 'brass', o.seed);
    dialFace(g, cx, cy, R, o.seed, { color: o.face ?? PAL.cream });
    ang = scale(g, cx, cy, R, o);
    g.fillStyle = PAL.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (o.title) { g.font = `700 ${R * 0.13}px ${NARROW}`; g.letterSpacing = `${R * 0.012}px`; g.fillText(o.title, cx, cy - R * 0.3); g.letterSpacing = '0px'; }
    if (o.unit) { g.font = `400 ${R * 0.11}px ${NARROW}`; g.fillText(o.unit, cx, cy + R * 0.34); }
    if (o.serial) { g.font = `400 ${R * 0.065}px ${NARROW}`; g.fillStyle = 'rgba(23,24,15,0.7)'; g.fillText(o.serial, cx, cy + R * 0.52); }
    if (o.tapeText) tape(g, cx - S * 0.3, W - pad * 0.15, S * 0.6, S * 0.15, o.tapeText, o.seed, { rot: (rng(o.seed)() - 0.5) * 0.06 });
  }, { name: o.name + ' body' });
  const nlen = R * 0.86, setN = obj.part(R * 2.2, R * 2.2, R * 1.1, R * 1.1, cx, cy, needlePainter(nlen, { tip: o.tip }), { shadow: R * 0.05, name: o.name + ' needle' });
  const hubR = R * 0.075;
  obj.part(hubR * 3, hubR * 3, hubR * 1.5, hubR * 1.5, cx, cy, hubPainter(hubR, o.hub ?? 'black'));
  obj.layer(g => glass(g, cx, cy, R + 0.5, o.seed), { name: o.name + ' glass', lowres: true });
  const toDeg = v => o.a0 + (o.a1 - o.a0) * (clamp(v, o.min - (o.max - o.min) * 0.04, o.max + (o.max - o.min) * 0.04) - o.min) / (o.max - o.min);
  return { obj, cx: o.x, cy: o.y, R, set: v => setN(toDeg(v)), setDeg: d => setN(d) };
}

// ---------- camera ----------
/**
 * World + camera. A shot is { x, y, size } in world px: `size` = world width that fits the short side of the frame.
 * depth-of-field: focus f; each object's blur = |depth − f| × dofK × zoom (macro = shallow).
 */
export function rig(root, ctx, { bg = PAL.enamelDk } = {}) {
  const L = ctx.layout;
  const viewport = el('div', { 'data-name': 'Camera', style: { position: 'absolute', inset: 0, overflow: 'hidden', background: bg } }, root);
  const world = el('div', { 'data-name': 'Panel world', style: { position: 'absolute', left: 0, top: 0, transformOrigin: '0 0' } }, viewport);
  const objs = [];
  const cam = {
    viewport, world, objs,
    add(o) { objs.push(o); return o; },
    /** x,y = world point at frame centre; size = world span over the short side; rot deg; f focus; dof strength */
    set({ x, y, size, rot = 0, f = 0, dof = 6, shakeX = 0, shakeY = 0 }) {
      const k = Math.min(L.width, L.height) / size;
      world.style.transform = `translate(${L.width / 2 + shakeX}px,${L.height / 2 + shakeY}px) rotate(${rot}deg) scale(${k}) translate(${-x}px,${-y}px)`;
      for (const o of objs) {
        const b = Math.min(28, Math.abs((o.depth ?? 0) - f) * dof * k * L.unit);
        o.root.style.filter = b > 0.25 ? `blur(${b.toFixed(2)}px)` : 'none';
      }
      return k;
    },
  };
  return cam;
}

/** Slow tripod-breathing + creeping push, all from t (no state). */
export const breathe = (t, seed, amp = 1) => [noise1(t * 0.35, seed) * 2.2 * amp, noise1(t * 0.3, seed + 4) * 1.6 * amp, noise1(t * 0.22, seed + 9) * 0.06 * amp];

/** Noise-based impact shake (no per-frame sign flip). Returns [dx, dy, rot]. */
export function impact(t, hits, amp = 1) {
  let dx = 0, dy = 0, dr = 0;
  for (const [tb, a] of hits) {
    const d = t - tb; if (d < 0 || d > 1.4) continue;
    const env = Math.exp(-d * 4.2) * a * amp * clamp(d / 0.03);
    dx += noise1(d * 22, tb * 7) * 9 * env; dy += (noise1(d * 19, tb * 3 + 1) * 11 + 5 * Math.exp(-d * 10)) * env; dr += noise1(d * 15, tb) * 0.25 * env;
  }
  return [dx, dy, dr];
}

// ---------- screen space: caption, grade, transition ----------
/** Caption plate (screen space). Black plate, cream engraved-style caps; small hedge line optional. */
export function caption(root, ctx, { text, sub, t0, t1, at = 'low', name = 'Caption' }) {
  const L = ctx.layout;
  const box = el('div', { 'data-name': name, style: { position: 'absolute', zIndex: 50, background: 'rgba(20,21,16,0.92)', padding: `${L.px(14)}px ${L.px(22)}px ${L.px(12)}px`, borderLeft: `${L.px(5)}px solid ${PAL.red}`, maxWidth: (L.safe.w * 0.8) + 'px' } }, root);
  const main = el('div', { style: { font: `700 ${L.pick({ landscape: L.px(46), portrait: L.px(50) })}px ${NARROW}`, color: '#ebe4cf', letterSpacing: '0.07em', textTransform: 'uppercase', lineHeight: 1.08 } }, box, text);
  let subEl = null;
  if (sub) subEl = el('div', { style: { font: `400 ${L.pick({ landscape: L.px(30), portrait: L.px(32) })}px ${NARROW}`, color: '#bdb6a0', letterSpacing: '0.03em', marginTop: L.px(6) + 'px' } }, box, sub);
  const place = () => {
    const bw = box.offsetWidth, bh = box.offsetHeight;
    let x, y;
    if (at === 'low') { x = L.safe.x; y = L.safe.y + L.safe.h - bh; }
    else if (at === 'top') { x = L.safe.x; y = L.safe.y; }
    else if (at === 'lowright') { x = L.safe.x + L.safe.w - bw; y = L.safe.y + L.safe.h - bh; }
    box.style.left = Math.round(x) + 'px'; box.style.top = Math.round(y) + 'px';
  };
  place();
  return t => {
    const pin = spring(t - t0, { stiffness: 480, damping: 44 }), pout = clamp((t - t1) / 0.3);
    const v = pin * (1 - pout);
    box.style.opacity = v.toFixed(3);
    box.style.visibility = v < 0.01 ? 'hidden' : 'visible';
    box.style.clipPath = `inset(0 ${((1 - pin) * 100).toFixed(2)}% 0 0)`;
    box.style.transform = pin >= 0.999 && pout === 0 ? 'none' : `translateX(${(-(1 - pin) * L.px(12)).toFixed(2)}px)`;
  };
}

/** Grain + lamp falloff (screen space). Grain tile seeded per FRAME (deterministic), ≤ 1.5 %. */
export function grade(root, ctx, seed = 1) {
  const L = ctx.layout;
  const fall = el('div', { 'data-name': 'Lamp falloff', style: { position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none', background: `radial-gradient(ellipse 80% 75% at 32% 28%, rgba(255,240,200,0.07) 0%, rgba(0,0,0,0) 45%, rgba(10,9,5,0.5) 100%)` } }, root);
  const { c, g } = mkCanvas(256, 256, 1);
  const id = g.createImageData(256, 256), r = rng(seed);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 70; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  const grain = el('div', { 'data-name': 'Grain', style: { position: 'absolute', inset: 0, zIndex: 41, pointerEvents: 'none', backgroundImage: `url(${c.toDataURL()})`, backgroundSize: `${L.px(300)}px`, mixBlendMode: 'overlay', opacity: 0.11 } }, root);
  return t => { const fr = Math.round(t * 30); grain.style.backgroundPosition = `${Math.floor(rand(fr + seed) * 256)}px ${Math.floor(rand(fr * 1.7 + seed) * 256)}px`; void fall; };
}

/** Scene entry: rack-focus dissolve (the one transition of this style). */
export function rackIn(root, t, dur = 0.5) {
  if (t >= dur) { root.style.opacity = 1; root.style.filter = 'none'; return; }
  const p = smootherstep(t / dur);
  root.style.opacity = p.toFixed(3); root.style.filter = `blur(${((1 - p) * 10).toFixed(2)}px)`;
}

/** Dust motes in the lamp beam + dust falling after impacts (world-agnostic, screen space, few and slow). */
export function dust(root, ctx, { seed = 3, n = 26, hits = [] } = {}) {
  const L = ctx.layout;
  const layer = el('div', { 'data-name': 'Dust', style: { position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none' } }, root);
  const motes = Array.from({ length: n }, (_, i) => {
    const r = rng(seed * 100 + i), s = L.px(1.5 + r() * 3.5);
    const d = el('div', { style: { position: 'absolute', left: 0, top: 0, width: s + 'px', height: s + 'px', borderRadius: '50%', background: 'rgba(235,228,205,0.5)', filter: `blur(${(r() * 2).toFixed(1)}px)` } }, layer);
    return { d, x: r(), y: r(), vx: (r() - 0.5) * 0.008, vy: 0.004 + r() * 0.01, ph: r() * 9, a: 0.25 + r() * 0.45, fall: r() };
  });
  return t => {
    for (const m of motes) {
      let y = m.y + m.vy * t, x = m.x + m.vx * t + Math.sin(t * 0.6 + m.ph) * 0.006;
      for (const [tb] of hits) { const d = t - tb; if (d > 0) y += m.fall * 0.06 * Math.min(d, 2.5) * (d < 2.5 ? 1 : 1); }
      y = ((y % 1) + 1) % 1; x = ((x % 1) + 1) % 1;
      m.d.style.transform = `translate(${(x * L.width).toFixed(1)}px,${(y * L.height).toFixed(1)}px)`;
      m.d.style.opacity = (m.a * (0.6 + 0.4 * Math.sin(t * 0.8 + m.ph))).toFixed(3);
    }
  };
}

/** Big enamel back panel covering the world rect (one texture, painted once). */
export function panel(cam, { x = 0, y = 0, w, h, seed = 1, depth = 0, base = PAL.enamel, res = 0.6, seams, vseams, cables }) {
  const o = object(cam.world, { x, y, w, h, depth, name: 'Back panel', res, z: 1 });
  o.layer(g => {
    enamel(g, 0, 0, w, h, seed, { base, rad: 0, wear: 0.6, chips: false });
    const r = rng(seed + 3);
    // sheet seams with rivet rows (panels were bolted sections)
    for (const sy of seams ?? []) {
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, sy, w, 3); g.fillStyle = 'rgba(230,228,200,0.12)'; g.fillRect(0, sy + 3, w, 1.5);
      for (let rx = 30; rx < w; rx += 64) for (const off of [-16, 20]) {
        const cx = rx + (r() - 0.5) * 2, cy = sy + off;
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(cx + 1.5, cy + 2, 6, 0, 7); g.fill();
        const gr = g.createRadialGradient(cx - 2, cy - 2, 0.5, cx, cy, 6); gr.addColorStop(0, '#9a9f88'); gr.addColorStop(1, '#3e4236');
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill();
      }
    }
    for (const sx of vseams ?? []) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(sx, 0, 3, h); g.fillStyle = 'rgba(230,228,200,0.12)'; g.fillRect(sx + 3, 0, 1.5, h); }
    // cable runs: bundles of lacquered cable with clamps
    for (const cb of cables ?? []) {
      const { y: cy0, n = 3, th = 22 } = cb;
      for (let i = 0; i < n; i++) {
        const yy = cy0 + i * th * 1.05;
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, yy + th * 0.4, w, th);
        const lg = g.createLinearGradient(0, yy, 0, yy + th); lg.addColorStop(0, '#4a4a40'); lg.addColorStop(0.3, '#77776a'); lg.addColorStop(0.6, '#2b2b25'); lg.addColorStop(1, '#151510');
        g.fillStyle = lg; g.fillRect(0, yy, w, th);
      }
      for (let cx = 120 + r() * 100; cx < w; cx += 380 + r() * 160) {
        const hh = n * th * 1.05 + 16;
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(cx + 4, cy0 - 8 + 6, 34, hh);
        enamel(g, cx, cy0 - 8, 34, hh, seed + cx, { base: '#585d4c', rad: 4, wear: 0.4, chips: false });
        screw(g, cx + 17, cy0 - 1, 5, seed + cx); screw(g, cx + 17, cy0 + hh - 15, 5, seed + cx + 1);
      }
    }
  });
  return cam.add(o);
}

/**
 * Mechanical drum counter (odometer) on an enamel plate. digits: number of drums.
 * set(value) rolls drums like a real counter: lower drum carries the next one only in its last 10 %.
 */
export function counter(world, { x, y, digits = 4, dw = 46, dh = 70, seed = 11, name = 'Counter', depth = 0, label, tapeText, res = 2.4 }) {
  const gap = dw * 0.12, ww = digits * dw + (digits - 1) * gap, padX = dw * 0.7, padY = dh * 0.55;
  const W = ww + padX * 2, H = dh + padY * 2 + (label ? dh * 0.45 : 0) + (tapeText ? dh * 0.75 : 0);
  const obj = object(world, { x: x - W / 2, y: y - (dh / 2 + padY + (label ? dh * 0.45 : 0)), w: W, h: H, depth, name, res });
  const top = padY + (label ? dh * 0.45 : 0);
  obj.layer(g => {
    g.save(); g.fillStyle = 'rgba(6,8,4,0.45)'; g.filter = `blur(${dh * 0.12}px)`; g.fillRect(dw * 0.1, dh * 0.15, W - dw * 0.1, H - (tapeText ? dh * 0.75 : 0)); g.restore();
    enamel(g, 0, 0, W, H - (tapeText ? dh * 0.75 : 0), seed, { base: PAL.enamelLt, rad: dh * 0.12, wear: 1.3 });
    screw(g, padX * 0.45, top + dh / 2, dh * 0.07, seed); screw(g, W - padX * 0.45, top + dh / 2, dh * 0.07, seed + 1);
    if (label) { g.fillStyle = '#dcd5bf'; g.font = `700 ${dh * 0.3}px ${NARROW}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = `${dh * 0.03}px`; g.fillText(label, W / 2, padY * 0.55 + dh * 0.2); g.letterSpacing = '0px'; }
    // window recess
    g.fillStyle = '#0c0c09'; g.fillRect(padX - gap, top - gap, ww + gap * 2, dh + gap * 2);
    if (tapeText) tape(g, W * 0.12, H - dh * 0.72, W * 0.76, dh * 0.62, tapeText, seed, { rot: (rng(seed)() - 0.5) * 0.05 });
  }, { name: name + ' body' });
  // drums: a strip 0..9,0 drawn once, shifted per digit
  const drums = [];
  for (let i = 0; i < digits; i++) {
    const wrap = el('div', { style: { position: 'absolute', left: (padX + i * (dw + gap)) + 'px', top: top + 'px', width: dw + 'px', height: dh + 'px', overflow: 'hidden', background: '#e9e2cc' } }, obj.root);
    const { c, g } = mkCanvas(dw, dh * 11, res);
    g.fillStyle = '#e4dcc4'; g.fillRect(0, 0, dw, dh * 11);
    g.fillStyle = PAL.ink; g.font = `700 ${dh * 0.72}px ${NARROW}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let d = 0; d <= 10; d++) g.fillText(String(d % 10), dw / 2, dh * d + dh * 0.53);
    Object.assign(c.style, { position: 'absolute', left: 0, top: 0, width: dw + 'px', height: dh * 11 + 'px' });
    wrap.appendChild(c);
    // cylinder shading over the drum
    el('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 30%, rgba(255,255,240,0.08) 48%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.66) 100%)' } }, wrap);
    drums.push(c);
  }
  return {
    obj,
    set(v) {
      v = Math.max(0, v);
      for (let i = 0; i < digits; i++) {
        const p = 10 ** (digits - 1 - i);
        const q = v / p, base = Math.floor(q) % 10, frac = q - Math.floor(q);
        // carry: only roll during the last 10 % of the lower drum
        const lower = (v % p) / p; let pos = base;
        if (i === digits - 1) pos = base + frac; else if (lower > 0.9) pos = base + (lower - 0.9) / 0.1;
        drums[i].style.transform = `translateY(${(-pos * dh).toFixed(2)}px)`;
      }
    },
  };
}

/** Foreground pipe close to the lens: always out of focus, moves with parallax 1.35 (screen space). */
export function fgPipe(root, ctx, { seed = 5, angle = -8, xFrac = 0.5, yFrac = 0.92, thick = 120, blur = 16 } = {}) {
  const L = ctx.layout;
  const w = L.width * 1.8, h = L.px(thick);
  const { c, g } = mkCanvas(w, h + 40, 0.5);
  const gr = g.createLinearGradient(0, 20, 0, 20 + h);
  gr.addColorStop(0, '#3a3d31'); gr.addColorStop(0.22, '#666b57'); gr.addColorStop(0.5, '#2c2f25'); gr.addColorStop(1, '#0e0f0b');
  g.fillStyle = gr; g.fillRect(0, 20, w, h);
  const r = rng(seed);
  for (let i = 0; i < 5; i++) { const bx = r() * w; g.fillStyle = '#2b2d25'; g.fillRect(bx, 10, h * 0.35, h + 20); g.fillStyle = 'rgba(200,200,180,0.25)'; g.fillRect(bx, 10, h * 0.05, h + 20); }
  Object.assign(c.style, { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 40 + 'px', filter: `blur(${L.px(blur)}px)`, zIndex: 35, transformOrigin: '50% 50%' });
  c.dataset.name = 'Foreground pipe';
  root.appendChild(c);
  return (camX, camY, k = 1) => {
    const x = -w / 2 + L.width * xFrac - camX * 1.35 * k * 0.25, y = L.height * yFrac - h / 2 - camY * 1.35 * k * 0.25;
    c.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${angle}deg)`;
  };
}
