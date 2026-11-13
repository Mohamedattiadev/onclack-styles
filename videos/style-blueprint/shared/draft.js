// BLUEPRINT kit — "history as an engineering drawing".
// Cyanotype sheet, drafting primitives that draw themselves ("the draft": construction → ink → dimension),
// camera over one big sheet. Everything is a pure function of GLOBAL time; every imperfection is seeded once.
import { svg, el, clamp, progress } from '/onclack-styles/engine/lib/anim.js';

/** Seeded generator (mulberry32): rng(seed)() → [0,1). Same seed → same sequence; never Math.random. */
export function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- tokens ---------- */
export const C = {
  paper: '#E6E1D2',   // uncoated paper at the brushed edge
  sheet: '#173F6E',   // Prussian blue (exposed cyanotype)
  deep: '#0E2B50',    // dense coating
  thin: '#2A5B92',    // thin coating / weak exposure
  ink: '#E3EAE8',     // line (unexposed paper showing through) — never pure white
  con: '#9DB7D2',     // construction / guide lines
  red: '#F47B52',     // red pencil — the one warm accent, the "no" only
};
export const FONT = { mono: "'IBM Plex Mono', monospace" };
export const MONO_ADV = 0.6;            // IBM Plex Mono advance = 600/1000 em
export const LW = { thick: 3.4, thin: 1.7, con: 1.15, hatch: 1.25 }; // ISO 128 line weights, world px

/* ---------- motion tokens ---------- */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = s => ((ax * s + bx) * s + cx) * s, fy = s => ((ay * s + by) * s + cy) * s, dx = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let s = p;
    for (let i = 0; i < 8; i++) { const e = fx(s) - p, d = dx(s); if (Math.abs(e) < 1e-5 || !d) break; s -= e / d; }
    return fy(clamp(s));
  };
}
export const ez = { enter: bezier(0.16, 1, 0.3, 1), exit: bezier(0.7, 0, 0.84, 0), move: bezier(0.65, 0, 0.35, 1), camera: bezier(0.45, 0, 0.15, 1), pen: bezier(0.35, 0.1, 0.55, 1) };
export const F = 1 / 30;

/* ---------- voice ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** GLOBAL time of the nth word matching w. */
export function W(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.words.filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start : fallback;
}

/* ---------- geometry ---------- */
/** Sample a path given as [['M',x,y],['L',x,y],['C',x1,y1,x2,y2,x,y]...] into points. */
export function samplePath(cmds, step = 6) {
  const pts = []; let cx = 0, cy = 0;
  for (const c of cmds) {
    if (c[0] === 'M') { cx = c[1]; cy = c[2]; pts.push([cx, cy]); }
    else if (c[0] === 'L') {
      const n = Math.max(1, Math.ceil(Math.hypot(c[1] - cx, c[2] - cy) / step));
      for (let i = 1; i <= n; i++) pts.push([cx + (c[1] - cx) * i / n, cy + (c[2] - cy) * i / n]);
      cx = c[1]; cy = c[2];
    }
    else if (c[0] === 'C') {
      const [, x1, y1, x2, y2, x, y] = c;
      const est = Math.hypot(x1 - cx, y1 - cy) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x - x2, y - y2);
      const n = Math.max(4, Math.ceil(est / step));
      for (let i = 1; i <= n; i++) {
        const s = i / n, m = 1 - s;
        pts.push([m * m * m * cx + 3 * m * m * s * x1 + 3 * m * s * s * x2 + s * s * s * x, m * m * m * cy + 3 * m * m * s * y1 + 3 * m * s * s * y2 + s * s * s * y]);
      }
      cx = x; cy = y;
    }
  }
  return pts;
}
export const ellipsePts = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 48) =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const cum = pts => { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; };
function partial(pts, c, p) {
  if (p >= 1) return pts;
  const L = c[c.length - 1] * p, out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (c[i] <= L) { out.push(pts[i]); continue; }
    const s = (L - c[i - 1]) / ((c[i] - c[i - 1]) || 1);
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * s, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * s]);
    break;
  }
  return out;
}
const ptsStr = pts => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

/** Parallel hatch segments clipped to a polygon (angle in degrees, spacing in px). */
export function hatchSegments(poly, angle, spacing, phase = 0) {
  const a = (angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const rot = ([x, y]) => [x * ca + y * sa, -x * sa + y * ca];          // into hatch space (lines are horizontal there)
  const back = ([u, v]) => [u * ca - v * sa, u * sa + v * ca];
  const P = poly.map(rot), vs = P.map(p => p[1]);
  const segs = [];
  for (let v = Math.min(...vs) + spacing * (0.5 + phase); v < Math.max(...vs); v += spacing) {
    const xs = [];
    for (let i = 0; i < P.length; i++) {
      const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % P.length];
      if ((y1 <= v && y2 > v) || (y2 <= v && y1 > v)) xs.push(x1 + ((v - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((m, n) => m - n);
    for (let i = 0; i + 1 < xs.length; i += 2) segs.push([back([xs[i], v]), back([xs[i + 1], v])]);
  }
  return segs;
}

/** A hand signature: loops that run left → right (seeded, fixed). */
export function signaturePts(seed, x, y, w, h) {
  const r = rng(seed), pts = [];
  const loops = 5 + Math.floor(r() * 3), k = loops * Math.PI * 2;
  const amp = [0.6 + r() * 0.4, 0.3 + r() * 0.4, 0.5 + r() * 0.5];
  for (let i = 0; i <= 220; i++) {
    const s = i / 220, env = Math.sin(Math.PI * Math.min(1, s * 1.15)) ** 0.6;
    const rr = (0.16 + 0.1 * Math.sin(s * 9 + seed)) * h;
    const px = x + s * w * 0.92 + rr * 0.9 * Math.cos(k * s + 0.6);
    const py = y - (s * 0.18 * h) + env * (rr * amp[i % 3 === 0 ? 0 : 1] * Math.sin(k * s) - (s < 0.18 ? (0.18 - s) * h * 1.6 : 0));
    pts.push([px, py]);
  }
  // final flourish underline
  const e = pts[pts.length - 1];
  for (let i = 1; i <= 30; i++) { const s = i / 30; pts.push([e[0] - s * w * 0.85, e[1] + h * 0.28 + Math.sin(s * 3) * h * 0.05]); }
  return pts;
}

/* ---------- cyanotype sheet (canvas, built once per size, cached) ---------- */
const sheetCache = new Map();
export const SHEET_EXT = 150; // paper beyond the coated area (seen only in the final pull-back)
function makeSheet(WW, HH, seed = 1962) {
  const key = `${WW}x${HH}`;
  if (sheetCache.has(key)) return sheetCache.get(key);
  const R = 1 / 1.5, E = SHEET_EXT, cw = Math.round((WW + 2 * E) * R), ch = Math.round((HH + 2 * E) * R);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d'); g.scale(R, R);
  g.fillStyle = C.paper; g.fillRect(0, 0, WW + 2 * E, HH + 2 * E);
  g.translate(E, E); // world coordinates from here; the paper runs E px past the drawing on every side
  const r = rng(seed);
    // uncoated-paper fibres (seen only at the brushed edge)
  g.strokeStyle = 'rgba(120,110,90,0.08)'; g.lineWidth = 1;
  for (let i = 0; i < 300; i++) { const x = r() * WW, y = r() * HH; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 30); g.stroke(); }
  // coated area: brushed by hand — ragged edges, brush streaks running past the edge
  const ragged = (len, base, s) => { const rr = rng(s); const out = []; let v = 0; for (let i = 0; i <= len; i += 16) { v = v * 0.9 + (rr() - 0.5) * 3.2; out.push([i, base + v + Math.sin(i / 260 + s) * 5 + (rr() < 0.04 ? rr() * 10 : 0)]); } return out; };
  const top = ragged(WW, -24, 3), bot = ragged(WW, -24, 7), lef = ragged(HH, -26, 11), rig = ragged(HH, -26, 13);
  g.beginPath();
  top.forEach(([x, d], i) => (i ? g.lineTo(x, d) : g.moveTo(x, d)));
  rig.forEach(([y, d]) => g.lineTo(WW - d, y));
  [...bot].reverse().forEach(([x, d]) => g.lineTo(x, HH - d));
  [...lef].reverse().forEach(([y, d]) => g.lineTo(d, y));
  g.closePath(); g.fillStyle = C.sheet; g.fill();
  g.save(); g.clip();
  // uneven coating: low-frequency density map (two octaves), drawn soft
  for (const [gw, alpha] of [[14, 0.55], [40, 0.28]]) {
    const gh = Math.max(2, Math.round(gw * HH / WW)), sc = document.createElement('canvas'); sc.width = gw; sc.height = gh;
    const sg = sc.getContext('2d'), id = sg.createImageData(gw, gh);
    for (let i = 0; i < gw * gh; i++) {
      const v = r();
      const a = [0x0E, 0x2B, 0x50], b = [0x2A, 0x5B, 0x92];
      for (let k = 0; k < 3; k++) id.data[i * 4 + k] = a[k] + (b[k] - a[k]) * v;
      id.data[i * 4 + 3] = 255;
    }
    sg.putImageData(id, 0, 0);
    g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(sc, -WW * 0.05, -HH * 0.05, WW * 1.1, HH * 1.1);
  }
  g.globalAlpha = 1;
  // brush streaks (coating brushed left → right, slight tilt)
  { // soft streaks: painted on a small canvas, smoothly enlarged (cheap blur)
    const sw = 480, sh = Math.round(480 * HH / WW), sc = document.createElement('canvas'); sc.width = sw; sc.height = sh;
    const sg = sc.getContext('2d');
    for (let i = 0; i < 70; i++) {
      const y = r() * sh, hgt = 1 + r() * 8, light = r() < 0.45;
      sg.fillStyle = light ? `rgba(70,120,175,${0.04 + r() * 0.05})` : `rgba(6,26,52,${0.05 + r() * 0.07})`;
      sg.save(); sg.translate(0, y); sg.rotate((r() - 0.5) * 0.012);
      sg.fillRect(r() * sw * 0.5 - sw * 0.2, 0, sw * (0.4 + r() * 0.9), hgt); sg.restore();
    }
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(sc, 0, 0, WW, HH);
  }
  // paper fibres showing through the coating
  for (let i = 0; i < 2600; i++) {
    const x = r() * WW, y = r() * HH, l = 6 + r() * 26, a = r() * Math.PI;
    g.strokeStyle = r() < 0.75 ? `rgba(150,185,220,${0.05 + r() * 0.09})` : `rgba(4,20,44,${0.08 + r() * 0.1})`;
    g.lineWidth = 0.6 + r() * 0.9;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 6, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // erased pencil ghosts (faint light lines left from an earlier layout)
  for (let i = 0; i < 9; i++) {
    const x = r() * WW, y = r() * HH, hor = r() < 0.6, l = 200 + r() * 700;
    g.strokeStyle = `rgba(160,195,230,${0.05 + r() * 0.04})`; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(hor ? x + l : x + (r() - 0.5) * 8, hor ? y + (r() - 0.5) * 6 : y + l); g.stroke();
  }
  // fold creases (the print was folded to file size): broken fibres = lighter line + shadow
  const crease = (x0, y0, x1, y1, s) => {
    const rr = rng(s), n = 60, pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + (rr() - 0.5) * 2.5, y0 + (y1 - y0) * t + (rr() - 0.5) * 2.5]); }
    const vert = Math.abs(x1 - x0) < Math.abs(y1 - y0);
    for (const [off, col, w] of [[2.5, 'rgba(4,18,40,0.22)', 4], [0, 'rgba(175,205,235,0.28)', 1.6], [-1.4, 'rgba(120,165,210,0.12)', 3]]) {
      g.strokeStyle = col; g.lineWidth = w; g.beginPath();
      pts.forEach(([x, y], i) => { const X = vert ? x + off : x, Y = vert ? y : y + off; i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
      g.stroke();
    }
    // worn spots along the crease
    for (let i = 0; i < 14; i++) { const t = rr(); g.fillStyle = `rgba(170,200,230,${0.05 + rr() * 0.06})`; g.beginPath(); g.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, vert ? 3 : 10 + rr() * 20, vert ? 10 + rr() * 20 : 3, 0, 0, 7); g.fill(); }
  };
  crease(WW * 0.312, 0, WW * 0.309, HH, 21); crease(WW * 0.655, 0, WW * 0.658, HH, 22); crease(0, HH * 0.565, WW, HH * 0.561, 23);
  // fine grain (paper tooth) — a seeded tile
  const tile = document.createElement('canvas'); tile.width = tile.height = 96;
  const tg = tile.getContext('2d'), td = tg.createImageData(96, 96);
  for (let i = 0; i < 96 * 96; i++) { const v = r(); td.data[i * 4] = td.data[i * 4 + 1] = td.data[i * 4 + 2] = v < 0.5 ? 0 : 255; td.data[i * 4 + 3] = Math.abs(v - 0.5) * 34; }
  tg.putImageData(td, 0, 0);
  g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, WW, HH);
  g.restore();
  // pin holes in the corners (sheet was pinned to a board)
  for (const [x, y] of [[70, 66], [WW - 74, 62], [68, HH - 70], [WW - 66, HH - 72]]) {
    g.fillStyle = 'rgba(200,215,230,0.35)'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
    g.fillStyle = '#081a33'; g.beginPath(); g.arc(x + 0.5, y + 0.5, 3.2, 0, 7); g.fill();
  }
  sheetCache.set(key, cv);
  return cv;
}

/* ---------- the Draft: one sheet, primitives drawn over global time ---------- */
export class Draft {
  constructor(root, ctx, WW, HH) {
    this.ctx = ctx; this.L = ctx.layout; this.WW = WW; this.HH = HH; this.items = []; this.texts = [];
    const L = this.L;
    this.world = el('div', { 'data-name': 'Sheet (camera)', style: { position: 'absolute', left: 0, top: 0, width: WW + 'px', height: HH + 'px', transformOrigin: '0 0' } }, root);
    const cv = document.createElement('canvas'); const src = makeSheet(WW, HH);
    cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0);
    cv.dataset.name = 'Cyanotype sheet';
    Object.assign(cv.style, { position: 'absolute', left: -SHEET_EXT + 'px', top: -SHEET_EXT + 'px', width: WW + 2 * SHEET_EXT + 'px', height: HH + 2 * SHEET_EXT + 'px' });
    this.world.appendChild(cv);
    this.svg = svg('svg', { 'data-name': 'Drawing', width: WW, height: HH, viewBox: `0 0 ${WW} ${HH}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, this.world);
    const defs = svg('defs', {}, this.svg);
    // ink: diazo-like line spread (tiny wobble + soft edge + uneven density). Seeded once — never boils.
    defs.innerHTML = `
      <filter id="bp-ink" filterUnits="userSpaceOnUse" x="0" y="0" width="${WW}" height="${HH}" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="11" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4" result="lo"/>
        <feColorMatrix in="lo" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0.55" result="dens"/>
        <feComposite in="d" in2="dens" operator="in" result="dd"/>
        <feGaussianBlur in="dd" stdDeviation="0.9" result="b"/>
        <feComponentTransfer in="b" result="bb"><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
        <feMerge><feMergeNode in="bb"/><feMergeNode in="dd"/></feMerge>
      </filter>
      <filter id="bp-pencil" filterUnits="userSpaceOnUse" x="0" y="0" width="${WW}" height="${HH}" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="5" result="g"/>
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1" result="tooth"/>
        <feComposite in="SourceGraphic" in2="tooth" operator="in" result="p"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="1" seed="9" result="w"/>
        <feDisplacementMap in="p" in2="w" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>`;
    this.gCon = svg('g', { 'data-name': 'Construction lines', fill: 'none', stroke: C.con, 'stroke-linecap': 'round' }, this.svg);
    this.gInk = svg('g', { 'data-name': 'Ink', fill: 'none', stroke: C.ink, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#bp-ink)' }, this.svg);
    this.gRed = svg('g', { 'data-name': 'Red pencil', fill: 'none', stroke: C.red, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#bp-pencil)' }, this.svg);
    this.cam = { z: 1, tx: 0, ty: 0 };
  }

  /** Line / polyline drawn by the pen. type: thick | thin | center | hidden | con | hatch | red */
  line(pts, { t0 = 0, dur = 0.4, type = 'thick', name, parent, fadeTo, fadeAt, e = ez.pen, w } = {}) {
    const red = type === 'red', con = type === 'con';
    const g = parent ?? (red ? this.gRed : con ? this.gCon : this.gInk);
    const width = w ?? (type === 'thick' ? LW.thick : type === 'con' ? LW.con : type === 'hatch' ? LW.hatch : red ? 6 : LW.thin);
    const attrs = { 'stroke-width': width };
    if (type === 'center') attrs['stroke-dasharray'] = '34 7 4 7';
    if (type === 'hidden') attrs['stroke-dasharray'] = '12 7';
    if (con) attrs['stroke-opacity'] = 0.6;
    if (name) attrs['data-name'] = name;
    const node = svg('polyline', attrs, g);
    const c = cum(pts);
    // ink pools a little where the pen lands and lifts
    let dots = null;
    if (type === 'thick') dots = [svg('circle', { r: width * 0.72, fill: C.ink, stroke: 'none', cx: pts[0][0], cy: pts[0][1] }, g), svg('circle', { r: width * 0.62, fill: C.ink, stroke: 'none', cx: pts.at(-1)[0], cy: pts.at(-1)[1] }, g)];
    const it = { kind: 'line', node, pts, c, t0, dur, e, last: -1, dots, fadeTo, fadeAt: fadeAt ?? t0 + dur + 0.6, con };
    this.items.push(it); return it;
  }
  /** Construction line: faint, runs past its ends like a real drafter's layout line, fades after inking. */
  con(a, b, { t0 = 0, dur = 0.22, over = 22, fadeAt } = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    return this.line([[a[0] - ux * over, a[1] - uy * over], [b[0] + ux * over, b[1] + uy * over]], { t0, dur, type: 'con', e: ez.move, fadeTo: 0.28, fadeAt: fadeAt ?? t0 + 1.4 });
  }
  /** Filled shape that appears (arrowheads, ink dots, hatched solids) at t0. */
  fill(pts, { t0 = 0, name, color = C.ink, parent } = {}) {
    const node = svg('polygon', { points: ptsStr(pts), fill: color, stroke: 'none', ...(name ? { 'data-name': name } : {}) }, parent ?? this.gInk);
    const it = { kind: 'pop', node, t0 }; this.items.push(it); return it;
  }
  arrow(tip, dir, { t0, size = 22 } = {}) {
    const [dx, dy] = dir, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, wv = size * 0.27; // ISO closed filled 15°
    return this.fill([tip, [tip[0] - ux * size - uy * wv, tip[1] - uy * size + ux * wv], [tip[0] - ux * size + uy * wv, tip[1] - uy * size - ux * wv]], { t0 });
  }
  /** Hand lettering: guide lines first, then letters at a steady hand speed. Returns the bbox. */
  text(str, x, y, { size = 32, t0 = 0, cps = 22, anchor = 'start', weight = 400, name, guide = true, rot = 0, color, red = false, parent, track = 0, halo = false } = {}) {
    const adv = (MONO_ADV + track) * size, wdt = str.length * adv - track * size;
    const x0 = anchor === 'middle' ? x - wdt / 2 : anchor === 'end' ? x - wdt : x;
    const g = svg('g', rot ? { transform: `rotate(${rot} ${x} ${y})` } : {}, parent ?? (red ? this.gRed : this.gInk));
    let guides = null;
    if (guide) {
      guides = [y, y - size * 0.7].map((gy, i) => this.line([[x0 - size * 0.3, gy], [x0 + wdt + size * 0.3, gy]], { t0: t0 - 0.28 + i * 0.05, dur: 0.18, type: 'con', parent: this.gCon, w: 0.9, fadeTo: 0.32, fadeAt: t0 + str.length / cps + 0.6 }));
      if (rot) guides.forEach(gl => gl.node.setAttribute('transform', `rotate(${rot} ${x} ${y})`));
    }
    const node = svg('text', { x: x0, y, 'font-family': FONT.mono, 'font-size': size, 'font-weight': weight, fill: color ?? (red ? C.red : C.ink), stroke: 'none', 'letter-spacing': track ? track + 'em' : null, 'xml:space': 'preserve', style: 'white-space:pre', 'data-name': name ?? str.slice(0, 32), ...(halo ? { stroke: C.sheet, 'stroke-width': size * 0.28, 'paint-order': 'stroke', 'stroke-linejoin': 'round' } : {}) }, g);
    const bbox = rot ? { x: x - size, y: y - wdt, w: size * 1.4, h: wdt + size } : { x: x0 - 2, y: y - size * 0.98, w: wdt + 4, h: size * 1.28 };
    const it = { kind: 'text', node, str, t0, cps, last: -1, bbox };
    this.items.push(it); this.texts.push(it); return it;
  }
  /** Linear dimension between points a and b, offset `off` (perpendicular, +left of a→b), with label. */
  dim(a, b, off, label, { t0 = 0, size = 30, gap = 10, over = 14, name = 'Dimension', textRot } = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = uy, ny = -ux; // normal
    const s = Math.sign(off) || 1;
    const A = [a[0] + nx * off, a[1] + ny * off], B = [b[0] + nx * off, b[1] + ny * off];
    this.line([[a[0] + nx * gap * s, a[1] + ny * gap * s], [A[0] + nx * over * s, A[1] + ny * over * s]], { t0, dur: 0.14, type: 'thin' });
    this.line([[b[0] + nx * gap * s, b[1] + ny * gap * s], [B[0] + nx * over * s, B[1] + ny * over * s]], { t0: t0 + 0.06, dur: 0.14, type: 'thin' });
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    this.line([mid, A], { t0: t0 + 0.16, dur: 0.22, type: 'thin', e: ez.move });
    this.line([mid, B], { t0: t0 + 0.16, dur: 0.22, type: 'thin', e: ez.move });
    this.arrow(A, [-ux, -uy], { t0: t0 + 0.38 }); this.arrow(B, [ux, uy], { t0: t0 + 0.38 });
    const ang = textRot ?? (Math.atan2(dy, dx) * 180) / Math.PI;
    const up = ny > 0 || (Math.abs(ny) < 1e-6 && nx > 0) ? -1 : 1; // text sits above (or left of) the dimension line
    const tp = [mid[0] + nx * up * 12, mid[1] + ny * up * 12];
    return this.text(label, tp[0], tp[1], { size, t0: t0 + 0.42, anchor: 'middle', rot: Math.abs(ang) > 1 ? ang : 0, guide: false, name });
  }
  hatch(poly, { angle = 45, spacing = 11, t0 = 0, dur = 0.5, type = 'hatch', phase = 0, w } = {}) {
    const segs = hatchSegments(poly, angle, spacing, phase);
    segs.forEach((sg, i) => this.line(sg, { t0: t0 + (dur * i) / Math.max(1, segs.length), dur: 0.08, type, w }));
  }
  balloon(c, r, label, target, { t0 = 0, size = 34 } = {}) {
    const d = [target[0] - c[0], target[1] - c[1]], l = Math.hypot(...d);
    this.line([[c[0] + (d[0] / l) * r, c[1] + (d[1] / l) * r], target], { t0, dur: 0.2, type: 'thin' });
    this.fill(ellipsePts(target[0], target[1], 5, 5, 0, Math.PI * 2, 12), { t0: t0 + 0.2 });
    this.line(ellipsePts(c[0], c[1], r, r, -Math.PI / 2, Math.PI * 1.5), { t0: t0 + 0.12, dur: 0.3, type: 'thin' });
    return this.text(label, c[0], c[1] + size * 0.36, { size, t0: t0 + 0.35, anchor: 'middle', guide: false, weight: 500 });
  }
  /** People as drafting symbols: plan-view figure (seen from above), nose tick shows facing. */
  figure(cx, cy, s, { t0 = 0, facing = 0 } = {}) {
    const a = (facing * Math.PI) / 180, rot = ([x, y]) => [cx + (x * Math.cos(a) - y * Math.sin(a)), cy + (x * Math.sin(a) + y * Math.cos(a))];
    // shoulders: rounded slab across the body; head: circle; nose tick shows facing (architectural plan convention)
    const sh = [['M', -s * 0.22, -s], ['C', s * 0.2, -s * 1.04, s * 0.26, -s * 0.5, s * 0.24, 0], ['C', s * 0.26, s * 0.5, s * 0.2, s * 1.04, -s * 0.22, s], ['C', -s * 0.4, s * 0.96, -s * 0.4, -s * 0.96, -s * 0.22, -s]];
    this.line(samplePath(sh, 2).map(rot), { t0, dur: 0.35, type: 'thin', w: 2.2 });
    this.line(ellipsePts(s * 0.3, 0, s * 0.3, s * 0.3, 0, Math.PI * 2, 28).map(rot), { t0: t0 + 0.25, dur: 0.22, type: 'thin', w: 2.2 });
    this.line([[s * 0.58, -s * 0.11], [s * 0.74, 0], [s * 0.58, s * 0.11]].map(rot), { t0: t0 + 0.45, dur: 0.1, type: 'thin', w: 2.2 });
  }

  /** Custom per-frame function of global time (moving markers etc.). */
  fn(f) { this.items.push({ kind: 'fn', f }); }

  /** Camera: world point (cx, cy) lands on the safe-area centre, scaled by z. */
  setCamera(z, cx, cy, clampEdge = true) {
    const S = this.L.safe, Lw = this.L.width, Lh = this.L.height, m = -14;
    if (clampEdge) { // never show past the coated sheet in a close shot
      const lo = x => (x), fitAxis = (c, sc, span, world) => { const a = (0 - sc) / z + c, b = (span - sc) / z + c; if (b - a >= world - 2 * m) return world / 2; if (a < m) return c + (m - a); if (b > world - m) return c - (b - (world - m)); return c; };
      cx = fitAxis(cx, S.cx, Lw, this.WW); cy = fitAxis(cy, S.cy, Lh, this.HH);
    }
    const tx = S.cx - cx * z, ty = S.cy - cy * z;
    this.cam = { z, tx, ty };
    this.world.style.transform = `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${z.toFixed(5)})`;
  }

  update(gt) {
    for (const it of this.items) {
      if (it.kind === 'line') {
        const p = it.e(progress(gt, it.t0, it.t0 + it.dur));
        if (p !== it.last) {
          it.last = p;
          if (p <= 0) it.node.setAttribute('points', '');
          else it.node.setAttribute('points', ptsStr(partial(it.pts, it.c, p)));
          if (it.dots) { it.dots[0].style.display = p > 0 ? '' : 'none'; it.dots[1].style.display = p >= 1 ? '' : 'none'; }
        }
        if (it.fadeTo != null) it.node.style.opacity = 1 - (1 - it.fadeTo) * ez.move(progress(gt, it.fadeAt, it.fadeAt + 0.8));
      } else if (it.kind === 'fn') {
        it.f(gt);
      } else if (it.kind === 'pop') {
        it.node.style.display = gt >= it.t0 ? '' : 'none';
      } else if (it.kind === 'text') {
        const n = clamp(Math.floor((gt - it.t0) * it.cps) + 1, 0, it.str.length);
        if (n !== it.last) { it.last = n; it.node.textContent = it.str.slice(0, n); }
        // keep only text that sits fully inside the safe area visible (no half-cut labels at frame edges)
        const { z, tx, ty } = this.cam, S = this.L.safe, b = it.bbox;
        const sx = b.x * z + tx, sy = b.y * z + ty, sw = b.w * z, sh = b.h * z;
        const m = Math.min(sx - S.x, sy - S.y, S.x + S.w - (sx + sw), S.y + S.h - (sy + sh));
        const f = clamp((m - 3) / 12);
        it.node.style.opacity = f;
        it.node.style.display = f <= 0.001 || n === 0 ? 'none' : '';
      }
    }
  }
}
