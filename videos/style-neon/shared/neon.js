// NEON TUBES — real bent glass on a dark brick wall. Shared kit for all four scenes.
// Everything here is built once; update() only sets opacities from a pure function of time.
import { rand, noise1, clamp } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep } from '/onclack-styles/engine/lib/spring.js';

const NS = 'http://www.w3.org/2000/svg';
const f2 = n => (Math.round(n * 10) / 10).toString();
const P = p => `${f2(p[0])},${f2(p[1])}`;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export function S(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.appendChild(n);
  return n;
}

/* ---------------- palette (gas colours, glass, hardware) ---------------- */
// warm = "3500 white" phosphor-coated tube (milky when off) · blue = argon/mercury in clear glass · red = true neon in
// clear glass. Red is used ONCE in the film: the NO.
export const GAS = {
  warm: { core: '#fff7ea', body: '#ffd8a3', glow: '#ffb466', spill: '#ff9f4a', coated: true },
  blue: { core: '#f0f5ff', body: '#9cc0f5', glow: '#5b8fe6', spill: '#4a7bd6', coated: false },
  red: { core: '#fff2ea', body: '#ff6d42', glow: '#ff4420', spill: '#ff3a14', coated: false },
};
export const HW = { wire: '#262422', wireHi: '#6b665f', boot: '#121110', blackout: '#0d0b0a', tie: '#8f8a82' };

/* ---------------- our single-stroke tube alphabet (cap height 10, y down) ---------------- */
const A = (cx, cy, rx, ry, a0, a1, n = 18) => {
  const o = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return o;
};
const rot180 = (w, strokes) => strokes.map(s => s.map(([x, y]) => [w - x, 10 - y]).reverse()).reverse();
const SIX = [[...A(6.1, 6.9, 5.6, 6.6, -112, -180, 10), ...A(3, 6.9, 3, 3.1, 180, -175, 30)]];
export const GLYPHS = {
  A: { w: 7, s: [[[0, 10], [3.5, 0], [7, 10]], [[1.4, 6.2], [5.6, 6.2]]] },
  B: { w: 6.1, s: [[[0, 5], ...A(3.2, 2.5, 2.5, 2.5, 90, -90, 14), [0, 0], [0, 10], ...A(3.6, 7.5, 2.5, 2.5, 90, -90, 14), [0, 5]]] },
  C: { w: 6.6, s: [A(3.7, 5, 3.7, 5, -42, -318, 26)] },
  E: { w: 5.4, s: [[[5.4, 0], [0, 0], [0, 10], [5.4, 10]], [[0, 5], [4.4, 5]]] },
  H: { w: 6, s: [[[0, 0], [0, 10]], [[0, 5], [6, 5]], [[6, 0], [6, 10]]] },
  I: { w: 0, s: [[[0, 0], [0, 10]]] },
  K: { w: 5.8, s: [[[0, 0], [0, 10]], [[5.6, 0], [0, 6.2]], [[1.9, 4.3], [5.8, 10]]] },
  L: { w: 5, s: [[[0, 0], [0, 10], [5, 10]]] },
  M: { w: 8, s: [[[0, 10], [0, 0], [4, 7], [8, 0], [8, 10]]] },
  N: { w: 6.4, s: [[[0, 10], [0, 0], [6.4, 10], [6.4, 0]]] },
  O: { w: 7.2, s: [A(3.6, 5, 3.6, 5, -95, 262, 34)] },
  P: { w: 5.8, s: [[[0, 10], [0, 0], [3.1, 0], ...A(3.1, 2.7, 2.7, 2.7, -90, 90, 14), [0, 5.4]]] },
  R: { w: 6, s: [[[0, 10], [0, 0], [3.1, 0], ...A(3.1, 2.7, 2.7, 2.7, -90, 90, 14), [0, 5.4]], [[3, 5.4], [6, 10]]] },
  S: { w: 6, s: [[...A(3, 2.6, 3, 2.6, -15, -270, 18), ...A(3, 7.6, 3, 2.4, -90, 165, 18)]] },
  T: { w: 6.4, s: [[[0, 0], [6.4, 0]], [[3.2, 0], [3.2, 10]]] },
  U: { w: 6.2, s: [[[0, 0], ...A(3.1, 6.9, 3.1, 3.1, 180, 0, 16), [6.2, 0]]] },
  V: { w: 6.8, s: [[[0, 0], [3.4, 10], [6.8, 0]]] },
  W: { w: 9.6, s: [[[0, 0], [2.2, 10], [4.8, 2.4], [7.4, 10], [9.6, 0]]] },
  Y: { w: 6.6, s: [[[0, 0], [3.3, 5.2]], [[6.6, 0], [3.3, 5.2], [3.3, 10]]] },
  0: { w: 6, s: [A(3, 5, 3, 5, -95, 262, 34)] },
  1: { w: 2.6, s: [[[0, 2.1], [2.6, 0], [2.6, 10]]] },
  2: { w: 6, s: [[...A(3, 3, 3, 3, -168, 22, 18), [0, 10], [6.2, 10]]] },
  5: { w: 6, s: [[[5.8, 0], [0.7, 0], [0.3, 4.6], ...A(2.9, 6.9, 3.1, 3.1, -128, 150, 22)]] },
  6: { w: 6, s: SIX },
  7: { w: 6, s: [[[0, 0], [6, 0], [2.2, 10]]] },
  9: { w: 6, s: rot180(6, SIX) },
  '-': { w: 3.4, s: [[[0, 6], [3.4, 6]]] },
};

/** Lay out a string in tube strokes. Returns { strokes (px), w, h, x0, x1 }. align: 0 left, 0.5 centre, 1 right. */
export function textStrokes(str, x, y, cap, { track = 2.7, space = 5, align = 0 } = {}) {
  const k = cap / 10;
  let adv = 0;
  const items = [];
  for (const ch of str) {
    if (ch === ' ') { adv += space; continue; }
    const g = GLYPHS[ch];
    if (!g) throw new Error('No neon glyph for ' + ch);
    items.push({ g, ox: adv });
    adv += g.w + track;
  }
  const total = adv - track;
  const x0 = x - total * k * align;
  const strokes = [];
  for (const it of items) for (const s of it.g.s) strokes.push(s.map(([gx, gy]) => [x0 + (it.ox + gx) * k, y + gy * k]));
  return { strokes, w: total * k, h: cap, x0, x1: x0 + total * k };
}

/** Map unit-space strokes to px: (u * s + offset), optional mirror. */
export const xf = (strokes, x, y, s, flip = false) => strokes.map(st => st.map(([u, v]) => [x + (flip ? -u : u) * s, y + v * s]));

/* ---------------- rounded tube path (glass is bent, never a sharp corner) ---------------- */
function dedupe(pts) { const o = [pts[0]]; for (const p of pts.slice(1)) if (dist(o[o.length - 1], p) > 0.01) o.push(p); return o; }
export function roundD(pts, r) {
  pts = dedupe(pts);
  if (pts.length < 2) return '';
  let d = `M${P(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1], p = pts[i], p1 = pts[i + 1];
    const l0 = dist(p0, p), l1 = dist(p, p1);
    const rr = Math.min(r, l0 / 2, l1 / 2);
    const a = [p[0] + (p0[0] - p[0]) * rr / l0, p[1] + (p0[1] - p[1]) * rr / l0];
    const b = [p[0] + (p1[0] - p[0]) * rr / l1, p[1] + (p1[1] - p[1]) * rr / l1];
    d += `L${P(a)}Q${P(p)} ${P(b)}`;
  }
  return d + `L${P(pts[pts.length - 1])}`;
}

/* ---------------- start-up / steady / off brightness (pure function of t, seeded, flash-safe) ---------------- */
// Start-up: one weak strike, a dip, a second strike, a short sag, then it catches and rises over ~0.2 s.
// ≤ 2 small flashes, only on the one tube that starts (local, never full-frame). Red never strikes hard.
export function bright(t, on, seed = 1, { off = Infinity, fail = false, gentle = false } = {}) {
  if (t < on) return 0;
  const d = t - on;
  let b;
  if (fail) { // the transformer clicks, the gas twitches, nothing catches
    b = d < 0.05 ? 0.2 : d < 0.19 ? 0.02 : d < 0.24 ? 0.09 : d < 0.62 ? 0.015 * (1 - (d - 0.24) / 0.38) : 0;
    return b;
  }
  const r1 = rand(seed * 3.1), r2 = rand(seed * 5.7 + 1), r3 = rand(seed * 7.3 + 2);
  if (gentle) {
    b = d < 0.07 ? 0.28 : d < 0.15 ? 0.16 : 0.16 + 0.84 * smootherstep((d - 0.15) / 0.34);
  } else {
    const k1 = 0.04 + 0.03 * r1, g1 = 0.06 + 0.06 * r2, k2 = 0.04 + 0.04 * r3, sag = 0.06 + 0.05 * r1;
    if (d < k1) b = 0.45 + 0.25 * r2;
    else if (d < k1 + g1) b = 0.05;
    else if (d < k1 + g1 + k2) b = 0.55 + 0.2 * r3;
    else if (d < k1 + g1 + k2 + sag) b = 0.22;
    else b = 0.22 + 0.78 * smootherstep((d - (k1 + g1 + k2 + sag)) / 0.2);
  }
  b *= 1 + 0.012 * noise1(t * 5, seed);          // gas is never perfectly still (≈1 %, slow)
  if (t >= off) { const e = t - off; b = e < 0.05 ? b * (1 - e / 0.05) * 0.6 : 0.05 * Math.max(0, 1 - (e - 0.05) / 0.45); } // snap + phosphor afterglow
  return clamp(b, 0, 1.05);
}

/* ---------------- the wall (brick, built once into a canvas, seeded) ---------------- */
const wallCache = new Map();
export function wallDataURL(W, H, u, seed) {
  const key = `${W}x${H}:${seed}`;
  if (wallCache.has(key)) return wallCache.get(key);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#141110'; g.fillRect(0, 0, W, H);           // mortar (recessed, dark)
  const bh = 46 * u, bw = 138 * u, m = 7 * u;
  let row = 0;
  for (let y = -bh * rand(seed) ; y < H; y += bh, row++) {
    const off = (row % 2 ? bw / 2 : 0) - bw * rand(seed + 2);
    for (let x = off - bw; x < W + bw; x += bw) {
      const r = rand(seed * 13 + row * 97 + Math.round(x / bw) * 31);
      const r2 = rand(seed * 17 + row * 53 + Math.round(x / bw) * 7);
      const L = 10.5 + r * 6.5 + (r2 > 0.92 ? -3.5 : 0);           // lightness %
      const hue = 8 + r2 * 12, sat = 24 + r * 16;
      const bx = x + m / 2 + (r2 - 0.5) * 1.5 * u, by = y + m / 2 + (r - 0.5) * 1.2 * u;
      const ww = bw - m + (r - 0.5) * 2 * u, hh = bh - m;
      g.fillStyle = `hsl(${hue} ${sat}% ${L}%)`;
      roundRect(g, bx, by, ww, hh, 3 * u); g.fill();
      // key light from upper left: lit top edge, shadow under the brick lip
      g.fillStyle = `hsla(${hue} ${sat}% ${L + 9}% / 0.55)`; g.fillRect(bx + 2 * u, by, ww - 4 * u, 1.6 * u);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(bx + 2 * u, by + hh - 1.8 * u, ww - 4 * u, 2.4 * u);
      // a few chips and old paint flecks
      if (r > 0.7) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(bx + ww * r2, by + hh * (0.2 + 0.6 * r), 6 * u * r, 3 * u, 0.3, 0, 7); g.fill(); }
      if (r2 > 0.965) { g.fillStyle = 'rgba(140,135,120,0.10)'; g.fillRect(bx + ww * 0.2, by + hh * 0.3, ww * 0.5, hh * 0.35); }
    }
  }
  // grain of fired clay + mortar sand (seeded, fixed per wall)
  const img = g.getImageData(0, 0, W, H), d = img.data;
  let s = seed * 9301 + 49297;
  for (let i = 0; i < d.length; i += 4) {
    s = (s * 9301 + 49297) % 233280; const n = (s / 233280 - 0.5) * 16;
    d[i] = clamp(d[i] + n, 0, 255) | 0; d[i + 1] = clamp(d[i + 1] + n * 0.9, 0, 255) | 0; d[i + 2] = clamp(d[i + 2] + n * 0.8, 0, 255) | 0;
  }
  g.putImageData(img, 0, 0);
  // dim room: a little ambient from the upper left, edges fall away
  const lg = g.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.4, H * 0.4, Math.max(W, H) * 0.85);
  lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  const url = c.toDataURL('image/png');
  wallCache.set(key, url);
  return url;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

let grainURL = null;
function grain() {
  if (grainURL) return grainURL;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), img = g.createImageData(256, 256);
  let s = 12345;
  for (let i = 0; i < img.data.length; i += 4) { s = (s * 9301 + 49297) % 233280; const v = (s / 233280) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  return (grainURL = c.toDataURL('image/png'));
}

/* ---------------- stage: wall + layered SVG + grade ---------------- */
export function makeStage(root, ctx, { seed = 1, name = 'Wall' } = {}) {
  const L = ctx.layout, W = L.width, H = L.height, u = L.unit;
  root.style.background = '#120e0d';
  const cam = document.createElement('div');
  cam.dataset.name = 'Camera';
  Object.assign(cam.style, { position: 'absolute', inset: '0', transformOrigin: '50% 50%' });
  root.appendChild(cam);
  const svg = S('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'data-name': name });
  Object.assign(svg.style, { position: 'absolute', left: '0', top: '0', overflow: 'visible' });
  cam.appendChild(svg);
  const defs = S('defs', {}, svg);
  S('image', { href: wallDataURL(W, H, u, seed), x: 0, y: 0, width: W, height: H, 'data-name': 'Brick wall', preserveAspectRatio: 'none' }, svg);
  const layer = n => S('g', { 'data-name': n }, svg);
  const lay = {
    wires: layer('GTO wires'), shadow: layer('Tube shadows + standoffs'), spill: layer('Light on the wall'),
    hw: layer('Electrodes + housings'), glass: layer('Tubes'), top: layer('Ties + highlights'),
  };
  lay.spill.style.mixBlendMode = 'screen';
  const filters = new Map();
  const blur = sd => {
    sd = Math.max(0.5, Math.round(sd * 2) / 2);
    if (!filters.has(sd)) {
      const id = 'b' + String(sd).replace('.', '_') + '_' + seed;
      const fl = S('filter', { id, filterUnits: 'userSpaceOnUse', x: -W * 0.1, y: -H * 0.1, width: W * 1.2, height: H * 1.2 }, defs);
      S('feGaussianBlur', { stdDeviation: sd }, fl);
      filters.set(sd, `url(#${id})`);
    }
    return filters.get(sd);
  };
  // grade: vignette + fine moving grain (screen space)
  const vig = document.createElement('div');
  Object.assign(vig.style, { position: 'absolute', inset: '0', pointerEvents: 'none',
    background: 'radial-gradient(ellipse 75% 70% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)' });
  root.appendChild(vig);
  const gr = document.createElement('div');
  Object.assign(gr.style, { position: 'absolute', inset: '0', pointerEvents: 'none', backgroundImage: `url(${grain()})`,
    backgroundSize: `${Math.round(256 * u * 1.6)}px`, opacity: '0.045', mixBlendMode: 'overlay' });
  root.appendChild(gr);
  return {
    W, H, u, L, svg, defs, lay, blur, cam,
    /** camera: scale about a point (px), pure of t */
    camera(scale, fx = W / 2, fy = H / 2) { cam.style.transformOrigin = `${f2(fx)}px ${f2(fy)}px`; cam.style.transform = `scale(${scale.toFixed(5)})`; },
    grainAt(t) { const fr = Math.floor(t * 30); gr.style.backgroundPosition = `${Math.floor(rand(fr + 1) * 256)}px ${Math.floor(rand(fr + 9) * 256)}px`; },
  };
}

/* ---------------- one tube = one gas, one length of glass, two electrodes ---------------- */
// spec: { strokes: [[px,px],...][], gas, w, ends: [dirStart, dirEnd] (unit vectors or 'down'/'up'/'left'/'right'),
//         wireTo: [x,y] | [[x,y],[x,y]], name, supports }
const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
export function makeTube(st, spec) {
  const { lay, blur, u } = st;
  const gas = GAS[spec.gas ?? 'warm'];
  const w = spec.w ?? 10 * u;
  const strokes = spec.strokes.map(dedupe).filter(s => s.length > 1);
  const r = spec.radius ?? w * 1.1;
  const litD = strokes.map(s => roundD(s, r)).join('');
  const jumps = [];
  for (let i = 0; i < strokes.length - 1; i++) jumps.push([strokes[i][strokes[i].length - 1], strokes[i + 1][0]]);
  // jumps run BEHIND the letters (back-bent glass, painted black), dipping toward the wall
  const jumpD = jumps.filter(([a, b]) => dist(a, b) > w * 0.8).map(([a, b]) => {
    const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + Math.min(dist(a, b) * 0.35, w * 6)];
    return `M${P(a)}Q${P(m)} ${P(b)}`;
  }).join('');
  const name = spec.name ?? 'Tube';

  // shadow on the wall (tube stands ~3 cm off the bricks on glass standoffs)
  const sh = S('g', { transform: `translate(${f2(w * 0.45)},${f2(w * 0.9)})`, 'data-name': name + ' shadow' }, lay.shadow);
  S('path', { d: litD, fill: 'none', stroke: '#000', 'stroke-width': w * 1.15, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.6, filter: blur(w * 0.55) }, sh);

  // light thrown on the wall: wide soft + tight halo (screen-blended)
  const spillWide = S('path', { d: litD, fill: 'none', stroke: gas.spill, 'stroke-width': w * 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: blur(w * 5.5), opacity: 0 }, lay.spill);
  const halo = S('path', { d: litD, fill: 'none', stroke: gas.glow, 'stroke-width': w * 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: blur(w * 0.9), opacity: 0 }, lay.spill);

  // the glass itself
  const g = S('g', { 'data-name': name }, lay.glass);
  const base = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  let off1, off2;
  if (gas.coated) { // milky phosphor coating when off
    off1 = S('path', { ...base, d: litD, stroke: '#b9b1a3', 'stroke-width': w, opacity: 0.5 }, g);
    off2 = S('path', { ...base, d: litD, stroke: '#ece4d4', 'stroke-width': w * 0.38, opacity: 0.22 }, g);
  } else {          // clear glass: rim + you see the wall through it
    off1 = S('path', { ...base, d: litD, stroke: '#cdd3d4', 'stroke-width': w, opacity: 0.3 }, g);
    off2 = S('path', { ...base, d: litD, stroke: '#0b0a0a', 'stroke-width': w * 0.56, opacity: 0.45 }, g);
  }
  const body = S('path', { ...base, d: litD, stroke: gas.body, 'stroke-width': w * 0.94, opacity: 0 }, g);
  const core = S('path', { ...base, d: litD, stroke: gas.core, 'stroke-width': w * 0.4, opacity: 0 }, g);
  // black-out paint on the jumps between letters (painted glass behind the letters, never lights)
  if (jumpD) {
    const jg = S('g', { 'data-name': name + ' blackout jumps' }, lay.shadow);
    S('path', { ...base, d: jumpD, stroke: HW.blackout, 'stroke-width': w * 0.8, opacity: 0.7 }, jg);
    S('path', { ...base, d: jumpD, stroke: '#4a4440', 'stroke-width': Math.max(1, w * 0.12), transform: `translate(${f2(-w * 0.15)},${f2(-w * 0.18)})`, opacity: 0.3 }, jg);
  }
  // specular line of the glass (key light upper left)
  const spec1 = S('path', { ...base, d: litD, stroke: '#ffffff', 'stroke-width': Math.max(1.2, w * 0.13), transform: `translate(${f2(-w * 0.2)},${f2(-w * 0.24)})`, opacity: 0.32 }, lay.top);

  // standoffs + tie wires along long straight runs
  if (spec.supports !== false) {
    const every = spec.supportEvery ?? w * 16;
    for (const s of strokes) {
      let acc = every * (0.45 + 0.3 * rand(s.length + s[0][0]));
      for (let i = 1; i < s.length; i++) {
        const a = s[i - 1], b = s[i], l = dist(a, b);
        if (l < w * 3) { acc += l; continue; }
        let pos = every - acc;
        while (pos < l - w * 1.5) {
          if (pos > w * 1.5) {
            const k = pos / l, x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
            const nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
            S('circle', { cx: f2(x + w * 0.35), cy: f2(y + w * 0.5), r: f2(w * 0.62), fill: '#1b1817' }, lay.shadow);
            S('circle', { cx: f2(x + w * 0.2), cy: f2(y + w * 0.3), r: f2(w * 0.5), fill: 'none', stroke: '#4a4542', 'stroke-width': Math.max(1, w * 0.1) }, lay.shadow);
            S('line', { x1: f2(x - nx * w * 0.75), y1: f2(y - ny * w * 0.75), x2: f2(x + nx * w * 0.75), y2: f2(y + ny * w * 0.75), stroke: HW.tie, 'stroke-width': Math.max(1, w * 0.12), opacity: 0.75 }, lay.top);
          }
          pos += every;
        }
        acc = (acc + l) % every;
      }
    }
  }

  // electrodes at both ends of the glass + GTO wire to the transformer
  const first = strokes[0], last = strokes[strokes.length - 1];
  const endPts = [first[0], last[last.length - 1]];
  const ends = (spec.ends ?? ['down', 'down']).map(e => (e === 'back' ? 'back' : typeof e === 'string' ? DIRS[e] : e));
  const wireTo = spec.wireTo ? (Array.isArray(spec.wireTo[0]) ? spec.wireTo : [spec.wireTo, spec.wireTo]) : null;
  const glowEls = [];
  endPts.forEach((p, i) => {
    if (ends[i] === 'back') { // tube bends straight back into the wall: we see a rounded elbow with a dark core
      S('circle', { cx: f2(p[0] + w * 0.25), cy: f2(p[1] + w * 0.35), r: f2(w * 0.75), fill: '#000', opacity: 0.5 }, lay.shadow);
      S('circle', { cx: f2(p[0]), cy: f2(p[1]), r: f2(w * 0.52), fill: '#3a3632' }, lay.top);
      S('circle', { cx: f2(p[0]), cy: f2(p[1]), r: f2(w * 0.26), fill: '#0d0c0b' }, lay.top);
      return;
    }
    const [dx, dy] = ends[i];
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const eg = S('g', { transform: `translate(${f2(p[0])},${f2(p[1])}) rotate(${f2(ang)})`, 'data-name': `${name} electrode ${i + 1}` }, lay.hw);
    // short glass leg from the letter into the electrode
    S('rect', { x: 0, y: -w * 0.5, width: w * 0.9, height: w, rx: w * 0.3, fill: gas.coated ? '#9d968a' : '#6f7476', opacity: 0.55 }, eg);
    // electrode housing (wider glass, metal shell inside)
    S('rect', { x: w * 0.6, y: -w * 0.72, width: w * 3, height: w * 1.44, rx: w * 0.62, fill: '#57534e', opacity: 0.95 }, eg);
    S('rect', { x: w * 0.85, y: -w * 0.42, width: w * 2.2, height: w * 0.84, rx: w * 0.3, fill: '#24221f' }, eg);
    S('rect', { x: w * 0.75, y: -w * 0.6, width: w * 2.7, height: w * 0.22, rx: w * 0.1, fill: '#b9b3a8', opacity: 0.35 }, eg);
    const eGlow = S('rect', { x: w * 0.55, y: -w * 0.6, width: w * 1.2, height: w * 1.2, rx: w * 0.5, fill: gas.glow, opacity: 0 }, eg);
    glowEls.push(eGlow);
    // rubber boot
    S('rect', { x: w * 3.3, y: -w * 0.85, width: w * 1.7, height: w * 1.7, rx: w * 0.45, fill: HW.boot }, eg);
    S('rect', { x: w * 3.45, y: -w * 0.72, width: w * 1.4, height: w * 0.25, rx: w * 0.12, fill: '#3c3835' }, eg);
    // wire
    if (wireTo) {
      const bx = p[0] + dx * w * 5, by = p[1] + dy * w * 5;
      const T = wireTo[i];
      const c1 = [bx + dx * 70 * u, by + dy * 70 * u];
      const c2 = [T[0] + (spec.wireBend?.[0] ?? 0) * u, T[1] - (spec.wireBend?.[1] ?? (spec.grommet ? 0 : 90)) * u];
      const c1s = spec.grommet ? [bx + dx * 30 * u, by + dy * 30 * u] : c1;
      const d = `M${P([bx, by])}C${P(c1s)} ${P(c2)} ${P(T)}`;
      S('path', { d, fill: 'none', stroke: HW.wire, 'stroke-width': Math.max(2, 3.4 * u), 'stroke-linecap': 'round', 'data-name': `${name} GTO wire ${i + 1}` }, lay.wires);
      S('path', { d, fill: 'none', stroke: HW.wireHi, 'stroke-width': Math.max(0.8, 1 * u), opacity: 0.35, transform: `translate(${f2(-0.8 * u)},${f2(-0.9 * u)})` }, lay.wires);
      if (spec.grommet) { // wire enters the brick through a drilled hole with a rubber grommet
        S('circle', { cx: f2(T[0]), cy: f2(T[1]), r: f2(5.5 * u), fill: '#0a0908', stroke: '#2e2b29', 'stroke-width': 2 * u }, lay.wires);
      }
    }
  });

  let last_b = -1;
  return {
    name, strokes, w,
    set(b) {
      b = Math.round(b * 400) / 400;
      if (b === last_b) return;
      last_b = b;
      const lb = Math.min(1, b);
      body.setAttribute('opacity', lb.toFixed(3));
      core.setAttribute('opacity', clamp(b * 1.1 - 0.1, 0, 1).toFixed(3));
      halo.setAttribute('opacity', (0.42 * b).toFixed(3));
      spillWide.setAttribute('opacity', (0.2 * b).toFixed(3));
      off1.setAttribute('opacity', ((gas.coated ? 0.5 : 0.3) * (1 - lb)).toFixed(3));
      off2.setAttribute('opacity', ((gas.coated ? 0.22 : 0.45) * (1 - lb)).toFixed(3));
      spec1.setAttribute('opacity', (0.32 - 0.18 * lb).toFixed(3));
      for (const e of glowEls) e.setAttribute('opacity', (0.35 * lb).toFixed(3));
    },
  };
}

/* ---------------- transformer box (the sign's housing) ---------------- */
export function makeTransformer(st, x, y, { w = 170, h = 112, label = '15 kV · 30 mA', name = 'Transformer' } = {}) {
  const { lay, u } = st;
  const W = w * u, H = h * u;
  const g = S('g', { 'data-name': name }, lay.hw);
  S('rect', { x: x + 6 * u, y: y + 10 * u, width: W, height: H, rx: 4 * u, fill: '#000', opacity: 0.45 }, g);
  S('rect', { x, y, width: W, height: H, rx: 4 * u, fill: '#33302d', stroke: '#4a4642', 'stroke-width': 1.5 * u }, g);
  S('rect', { x: x + 3 * u, y: y + 3 * u, width: W - 6 * u, height: 3 * u, fill: '#6b655e', opacity: 0.5 }, g);
  for (const [sx, sy] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) S('circle', { cx: x + sx * u, cy: y + sy * u, r: 3.2 * u, fill: '#1c1a18', stroke: '#6b655e', 'stroke-width': 0.8 * u }, g);
  // rating plate
  S('rect', { x: x + 24 * u, y: y + 30 * u, width: W - 48 * u, height: 38 * u, rx: 2 * u, fill: '#8d867a', opacity: 0.75 }, g);
  const tx = S('text', { x: x + W / 2, y: y + 55 * u, 'text-anchor': 'middle', fill: '#1f1c19', 'font-family': 'IBM Plex Mono', 'font-weight': 500, 'font-size': 12.5 * u, 'letter-spacing': 0 }, g);
  tx.textContent = label;
  // two ceramic HV terminals on top
  const terms = [[x + W * 0.3, y - 2 * u], [x + W * 0.7, y - 2 * u]];
  for (const [cx, cy] of terms) {
    S('rect', { x: cx - 7 * u, y: cy - 14 * u, width: 14 * u, height: 16 * u, rx: 3 * u, fill: '#cfc8bb', opacity: 0.8 }, g);
    S('rect', { x: cx - 7 * u, y: cy - 9 * u, width: 14 * u, height: 2 * u, fill: '#7d766c' }, g);
  }
  // conduit down out of frame
  S('rect', { x: x + W * 0.45, y: y + H, width: 16 * u, height: 900 * u, fill: '#2a2826', stroke: '#3e3a36', 'stroke-width': u }, g);
  return terms.map(([cx, cy]) => [cx, cy - 14 * u]);
}

/* ---------------- painted label on the brick (sign-maker's layout note) ---------------- */
export function paintLabel(st, x, y, text, { size = 30, anchor = 'start', name = 'Label', opacity = 0.62 } = {}) {
  const t = S('text', { x, y, 'text-anchor': anchor, fill: '#d9d1c2', opacity, 'font-family': 'IBM Plex Mono', 'font-weight': 500,
    'font-size': size * st.u, 'letter-spacing': 1.2 * st.u, 'data-name': name }, st.lay.shadow);
  t.textContent = text;
  return t;
}

/* ---------------- shapes (unit space, drawn by us, simplified, not to scale) ---------------- */
export const SHAPES = {
  // Foxtrot-class (Project 641) submarine, side view, length 100, waterline-free
  sub: [
    [[-48, 1.5], [-50, 0], [-44, -3.8], [34, -4.4], [44, -2.8], [50, 0.3], [46, 3.4], [-40, 3.9], [-47, 2.4]],
    [[-9, -4.2], [-7.2, -12], [7.5, -12], [10.5, -4.3]],
    [[2, -12], [2, -16.5]],
  ],
  // destroyer, side view, length 100, waterline y = 0
  ship: [
    [[-49, -3], [-46, 2.5], [43, 2.5], [50, -6.5], [31, -5.3], [21, -5.3], [19, -12.5], [7, -12.5], [5, -8.6], [-11, -8.6], [-13, -4.4], [-47.5, -3.4]],
    [[-26, -4], [-23.5, -10.5], [-17.5, -10.5], [-16.5, -4.2]],
    [[12, -12.5], [12, -27]],
    [[8, -22], [16, -22]],
  ],
  // T-5 nuclear torpedo, side view, length 100 (diameter exaggerated so it reads)
  torpedo: [
    [[-49, -2.4], [-44, -4.2], [38, -4.2], ...A(38, 0, 11, 4.2, -90, 90, 16), [-44, 4.2], [-49, 2.4]],
    [[-41, -4.2], [-47, -8.5], [-50.5, -8.5], [-48.5, -3.6]],
    [[-41, 4.2], [-47, 8.5], [-50.5, 8.5], [-48.5, 3.6]],
    [[21, -4.2], [21, 4.2]],
  ],
};
// Three officers (height 100, feet at y=0). No faces: a ring is a head. Each his own weight and posture; arms stay low.
const head = (x, y, r = 7) => A(x, y, r, r, -60, 270, 26);
const cap = x => [[x - 8.5, -94.5], [x + 8.5, -94.5], [x + 12.5, -93.4]];
const FIG = [
  { name: 'Captain (hand on hip, weight on one leg)', head: head(1, -87), cap: cap(1),
    jacket: [[-3, -79], [-12, -76], [-13.5, -60], [-12, -44], [11.5, -44], [12.5, -60], [12, -76], [4, -79]],
    legL: [[-5, -44], [-8, -22], [-11, 0], [-16.5, 0]], legR: [[6, -44], [6.5, -22], [5.5, 0], [11, 0]],
    armL: [[-12.5, -74], [-23, -61], [-13.5, -52]], armR: [[12.5, -74], [15.5, -59], [14.5, -44]] },
  { name: 'Political officer (arms folded, feet apart)', head: head(-1, -87.5, 7.2), cap: null,
    jacket: [[-4, -79], [-12.5, -76], [-13.5, -60], [-12.5, -44], [12, -44], [13, -60], [12, -76], [3, -79]],
    legL: [[-6, -44], [-9.5, -22], [-13, 0], [-18, 0]], legR: [[6, -44], [9.5, -22], [13, 0], [18, 0]],
    armL: [[-12.5, -74], [-16, -63], [8.5, -59]], armR: [[12.5, -74], [16, -62], [-8, -57]] },
  { name: 'Third officer (standing still)', head: head(0, -87), cap: cap(0),
    jacket: [[-3.5, -79], [-12, -76], [-13, -60], [-12, -44], [12, -44], [13, -60], [12, -76], [3.5, -79]],
    legL: [[-5, -44], [-5.5, -22], [-5, 0], [-10.5, 0]], legR: [[5, -44], [5.5, -22], [5, 0], [10.5, 0]],
    armL: [[-12.5, -74], [-16.5, -59], [-16, -43]], armR: [[12.5, -74], [16.5, -59], [16, -43]] },
];
/** One continuous tube per figure: starts at the left toe, ends at the right toe (electrodes hide at floor level). */
export const FIGURES = FIG.map(f => ({ name: f.name,
  s: [[...f.legL].reverse(), f.jacket, f.head, ...(f.cap ? [f.cap] : []), f.armL, f.armR, f.legR] }));

/* ---------------- map (Natural Earth coast) ---------------- */
function simplify(pts, tol) { // Douglas–Peucker
  if (pts.length < 3) return pts;
  if (dist(pts[0], pts[pts.length - 1]) < 1e-6) { const m = pts.length >> 1; return [...simplify(pts.slice(0, m + 1), tol).slice(0, -1), ...simplify(pts.slice(m), tol)]; }
  let idx = 0, md = 0;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  const L = dist(a, b) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const dd = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L;
    if (dd > md) { md = dd; idx = i; }
  }
  if (md <= tol) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}
export function mapProj(box, [lo0, lo1, la0, la1]) {
  const k = Math.cos(23 * Math.PI / 180);
  const s = Math.min(box.w / ((lo1 - lo0) * k), box.h / (la1 - la0));
  const ox = box.x + (box.w - (lo1 - lo0) * k * s) / 2, oy = box.y + (box.h - (la1 - la0) * s) / 2;
  return (lo, la) => [ox + (lo - lo0) * k * s, oy + (la1 - la) * s];
}
/** Coast polylines of a country inside a lon/lat window, projected + simplified. Longest first. */
export function coast(geo, name, proj, win, tol) {
  const [lo0, lo1, la0, la1] = win;
  const inside = ([lo, la]) => lo >= lo0 && lo <= lo1 && la >= la0 && la <= la1;
  const out = [];
  for (const f of geo.features.filter(f => f.name === name)) for (const ring of f.rings) {
    let cur = [];
    for (const p of ring) { if (inside(p)) cur.push(proj(...p)); else { if (cur.length > 1) out.push(cur); cur = []; } }
    if (cur.length > 1) out.push(cur);
  }
  return out.map(pl => simplify(pl, tol)).sort((a, b) => b.length - a.length);
}

/** An empty mounting: two drilled holes and two bare glass standoffs where a tube could hang (nothing there). */
export function emptyMount(st, x, y, span, name = 'Empty mounting') {
  const { lay, u } = st;
  const g = S('g', { 'data-name': name }, lay.shadow);
  for (const k of [-0.5, 0.5]) {
    S('circle', { cx: f2(x + k * span), cy: f2(y), r: f2(5.5 * u), fill: '#0a0908', stroke: '#2e2b29', 'stroke-width': 2 * u }, g);
    S('circle', { cx: f2(x + k * span * 0.45), cy: f2(y - 16 * u), r: f2(4 * u), fill: '#1b1817', stroke: '#4a4542', 'stroke-width': 0.9 * u }, g);
  }
  return g;
}
