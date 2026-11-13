// FOOTNOTE style kit — tokens, paper, grain, ink filter, the ✱ mark, pencil layer, page chrome.
// Every function is deterministic: imperfection is seeded per object, never by time.
import { el, svg, rand, clamp, progress } from '/onclack-styles/engine/lib/anim.js';
import { spring } from '/onclack-styles/engine/lib/spring.js';

export const C = {
  paper: '#F2EBDD', ink: '#1A1714', red: '#C2462B', rubric: '#A8361F',
  pencil: '#6E665B', plate: '#E4D9C3', inkTint: 'rgba(26,23,20,0.075)',
};
export const F = {
  serif: "'Newsreader', serif", mono: "'IBM Plex Mono', monospace", hand: "'Shantell Sans', cursive",
};

// ---------- motion tokens (history-director §7.10) ----------
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) { const e = sx(t) - p, d = dx(t); if (Math.abs(e) < 1e-6 || !d) break; t -= e / d; }
    t = clamp(t);
    return sy(t);
  };
}
export const tok = {
  enter: bezier(0.16, 1, 0.3, 1),   // 12–20 f
  exit: bezier(0.7, 0, 0.84, 0),    // 8–14 f
  move: bezier(0.65, 0, 0.35, 1),   // 15–30 f
  camera: bezier(0.45, 0, 0.15, 1), // 45–180 f
  drop: bezier(0.2, 0, 0, 1),       // the footnote hairline (14–18 f)
};
/** eased progress of a token between a and b seconds */
export const at = (t, a, b, e = tok.enter) => e(progress(t, a, b));
/** the ✱ landing spring: stiffness 320, damping 24 (≈ 3 % overshoot) */
export const markSpring = t => spring(t, { stiffness: 320, damping: 24 });

// ---------- paper (world space) ----------
const paperCache = new Map();
/** Procedural paper: soft mottling + laid fibres + rare specks. Seeded, generated once per size. */
export function paperURL(w, h, seed = 3) {
  const key = `${w}x${h}:${seed}`;
  if (paperCache.has(key)) return paperCache.get(key);
  const s = 0.5; // texture resolution (upscaled by the browser = softer fibres, cheaper)
  const cw = Math.ceil(w * s), ch = Math.ceil(h * s);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  g.fillStyle = C.paper; g.fillRect(0, 0, cw, ch);
  // low-frequency mottling: big soft blobs ±2 % lightness
  for (let i = 0; i < 36; i++) {
    const x = rand(seed * 100 + i) * cw, y = rand(seed * 200 + i) * ch, r = (0.08 + rand(seed * 300 + i) * 0.22) * Math.max(cw, ch);
    const dark = rand(seed * 400 + i) > 0.5;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, dark ? 'rgba(150,120,80,0.014)' : 'rgba(255,252,244,0.035)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // fibres: short, slightly curved strokes, mostly horizontal (laid paper direction)
  const n = Math.round(cw * ch / 900);
  for (let i = 0; i < n; i++) {
    const x = rand(seed + i * 1.37) * cw, y = rand(seed + i * 2.11) * ch;
    const len = 4 + rand(seed + i * 3.7) * 22, ang = (rand(seed + i * 5.3) - 0.5) * 0.9;
    const dark = rand(seed + i * 7.1) > 0.35;
    g.strokeStyle = dark ? `rgba(110,85,55,${0.025 + rand(i * 9.1) * 0.04})` : `rgba(255,255,250,${0.05 + rand(i * 9.7) * 0.07})`;
    g.lineWidth = 0.5 + rand(i * 4.4) * 0.6;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5 + (rand(i * 6.6) - 0.5) * 3, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }
  // specks (inclusions) — very rare
  for (let i = 0; i < Math.round(cw * ch / 60000); i++) {
    g.fillStyle = `rgba(60,45,30,${0.12 + rand(i * 8.8) * 0.18})`;
    g.beginPath(); g.arc(rand(i * 3.3 + seed) * cw, rand(i * 4.9 + seed) * ch, 0.4 + rand(i * 2.2) * 0.8, 0, Math.PI * 2); g.fill();
  }
  // fine per-pixel tooth (±2 code values) — also dithers the mottling
  const img = g.getImageData(0, 0, cw, ch), d = img.data;
  let st = seed * 9973 + 1;
  for (let i = 0; i < d.length; i += 4) {
    st = (st * 16807) % 2147483647;
    const v = ((st / 2147483647) - 0.5) * 5;
    d[i] += v; d[i + 1] += v; d[i + 2] += v;
  }
  g.putImageData(img, 0, 0);
  const url = c.toDataURL('image/png');
  paperCache.set(key, url);
  return url;
}

// ---------- film grain (screen space, seeded per frame) ----------
let grainTiles = null;
function makeGrain() {
  grainTiles = [];
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), img = g.createImageData(256, 256), d = img.data;
    let st = 7919 * (k + 1);
    for (let i = 0; i < d.length; i += 4) {
      st = (st * 16807) % 2147483647;
      const v = 128 + ((st / 2147483647) - 0.5) * 255;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grainTiles.push(c.toDataURL('image/png'));
  }
}
/** Grain overlay; call .update(globalT) every frame. */
export function grain(root, L, strength = 0.05) {
  if (!grainTiles) makeGrain();
  const g = el('div', { 'data-name': 'Film grain', style: {
    position: 'absolute', inset: '0', pointerEvents: 'none', mixBlendMode: 'overlay', opacity: String(strength),
    backgroundSize: `${Math.round(L.px(200))}px`, imageRendering: 'auto', zIndex: '50',
  } }, root);
  return {
    update(gt) {
      const f = Math.floor(gt * 30);
      g.style.backgroundImage = `url(${grainTiles[f % grainTiles.length]})`;
      g.style.backgroundPosition = `${Math.floor(rand(f * 1.3) * 256)}px ${Math.floor(rand(f * 2.7) * 256)}px`;
    },
  };
}

// ---------- SVG filters: ink spread + graphite ----------
/** Adds <defs> with #ink-<id> and #graphite-<id>; returns the ids. */
export function filters(root, id, L) {
  const s = svg('svg', { width: 0, height: 0, style: { position: 'absolute' } }, root);
  const defs = svg('defs', {}, s);
  const ink = svg('filter', { id: `ink-${id}`, x: '-2%', y: '-10%', width: '104%', height: '120%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.85, numOctaves: 2, seed: 11, result: 'n' }, ink);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: (0.9 * L.unit).toFixed(2), xChannelSelector: 'R', yChannelSelector: 'G' }, ink);
  const gr = svg('filter', { id: `graphite-${id}`, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 1.6, numOctaves: 1, seed: 4, result: 'n' }, gr);
  svg('feColorMatrix', { in: 'n', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.75', result: 'm' }, gr);
  svg('feComposite', { in: 'SourceGraphic', in2: 'm', operator: 'in', result: 'g' }, gr);
  svg('feDisplacementMap', { in: 'g', in2: 'n', scale: (1.2 * L.unit).toFixed(2), xChannelSelector: 'R', yChannelSelector: 'G' }, gr);
  return { ink: `url(#ink-${id})`, graphite: `url(#graphite-${id})` };
}

// ---------- the ✱ mark ----------
// Six tapered arms. The lower arm is 22 % longer — it "points down to the footnote". Arms are slightly uneven
// (fixed values, drawn once), the core is a little off-round. Unit radius = 1.
const ARMS = [
  { a: -90, l: 0.94, w: 0.25 }, { a: -30, l: 0.97, w: 0.24 }, { a: 30, l: 0.92, w: 0.25 },
  { a: 90, l: 1.18, w: 0.21 }, { a: 150, l: 0.95, w: 0.25 }, { a: 210, l: 0.99, w: 0.24 },
];
export function markD(scale = 1, small = false) {
  let d = '';
  for (const arm of ARMS) {
    const r = (arm.a + 1.5) * Math.PI / 180; // a hair off-axis
    const w = arm.w * (small ? 1.25 : 1); // optical tweak: thicker arms when tiny
    const ux = Math.cos(r), uy = Math.sin(r), nx = -uy, ny = ux;
    const L = arm.l, b = 0.08;
    const p = (u, v) => `${((ux * u + nx * v) * scale).toFixed(2)} ${((uy * u + ny * v) * scale).toFixed(2)}`;
    // base (wide) → shoulders → rounded blunt tip (ink-trap feel)
    d += `M ${p(-b, -w * 0.5)} C ${p(L * 0.35, -w * 0.55)} ${p(L * 0.8, -w * 0.32)} ${p(L, -w * 0.16)} ` +
      `Q ${p(L + w * 0.14, 0)} ${p(L, w * 0.16)} C ${p(L * 0.8, w * 0.32)} ${p(L * 0.35, w * 0.55)} ${p(-b, w * 0.5)} Z `;
  }
  return d;
}
/** An SVG ✱ of radius r px. Returns the <svg>; position it yourself. */
export function mark(parent, r, attrs = {}) {
  const pad = r * 1.4;
  const s = svg('svg', { width: pad * 2, height: pad * 2, viewBox: `${-pad} ${-pad} ${pad * 2} ${pad * 2}`, 'data-name': attrs.name ?? 'Mark ✱',
    style: { position: 'absolute', overflow: 'visible', ...(attrs.style ?? {}) } }, parent);
  svg('path', { d: markD(r, r < 18), fill: attrs.fill ?? C.red, 'fill-rule': 'nonzero' }, s);
  s.r = r; s.pad = pad;
  return s;
}
/** Place a mark element so its centre sits at (x, y) with the landing spring. */
export function placeMark(m, x, y, tl, { spin = -24 } = {}) {
  const k = markSpring(tl);
  const sc = Math.max(0, k);
  m.style.left = `${x - m.pad}px`; m.style.top = `${y - m.pad}px`;
  m.style.transform = `rotate(${(1 - k) * spin}deg) scale(${sc})`;
  m.style.opacity = tl > 0 ? '1' : '0';
}

// ---------- pencil (our layer) ----------
/** Hand ellipse path: centre, radii, start angle, overshoot (deg) — wobble seeded per object. */
export function pencilLoop(cx, cy, rx, ry, seed, over = 28, tilt = -6) {
  const pts = [], n = 64, a0 = -2.2 + rand(seed) * 0.4, total = Math.PI * 2 + over * Math.PI / 180;
  const tr = tilt * Math.PI / 180;
  for (let i = 0; i <= n; i++) {
    const a = a0 + total * i / n;
    const wob = 1 + (rand(seed + Math.floor(i / 8)) - 0.5) * 0.06 + (i / n) * 0.07; // spirals out a little
    const x = Math.cos(a) * rx * wob, y = Math.sin(a) * ry * wob;
    pts.push([cx + x * Math.cos(tr) - y * Math.sin(tr), cy + x * Math.sin(tr) + y * Math.cos(tr)]);
  }
  return smooth(pts);
}
/** Slightly bowed hand line from a to b. */
export function pencilLine(a, b, seed, bow = 0.02) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  const off = (rand(seed) - 0.3) * bow * len;
  return `M ${a[0]} ${a[1]} Q ${mx - dy / len * off} ${my + dx / len * off} ${b[0]} ${b[1]}`;
}
export function smooth(pts) {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
/** A drawable stroke: returns { node, set(p) } where p = 0..1 drawn. */
export function stroke(parent, d, { color = C.pencil, width = 3, filter, name, cap = 'round', dash } = {}) {
  const node = svg('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': cap, 'stroke-linejoin': 'round', 'data-name': name ?? 'Pencil stroke' }, parent);
  if (filter) node.setAttribute('filter', filter);
  const len = node.getTotalLength() + 2;
  if (dash) {
    // dashed line revealed with a mask-free trick: dasharray pattern + growing visible length via a clip on dashoffset is messy,
    // so dashed strokes reveal by 'pathLength' cut: draw full pattern, hide the rest with a second paper-coloured stroke? No —
    // we simply rebuild the dasharray each frame: pattern repeated up to the drawn length, then a long gap.
    node.setAttribute('stroke-dasharray', dash.join(' '));
  } else {
    node.setAttribute('stroke-dasharray', `${len} ${len}`);
  }
  return {
    node, len,
    set(p) {
      p = clamp(p);
      node.style.opacity = p > 0 ? '1' : '0';
      if (dash) {
        const drawn = p * len, [on, off] = dash, arr = [];
        for (let x = 0; x < drawn; x += on + off) { arr.push(Math.min(on, drawn - x)); arr.push(x + on + off < drawn ? off : len * 2); }
        node.setAttribute('stroke-dasharray', arr.length ? arr.join(' ') : `0 ${len * 2}`);
      } else node.setAttribute('stroke-dashoffset', String(len * (1 - p)));
    },
  };
}
/** Pencil handwriting (Shantell Sans) with per-letter seeded variation; returns { box, set(p) } (p = 0..1 written). */
export function hand(parent, text, { size, seed = 1, color = C.pencil, filter, name, style = {} }) {
  const box = el('div', { 'data-name': name ?? `Pencil note · ${text}`, style: {
    position: 'absolute', fontFamily: F.hand, fontWeight: '500', fontSize: `${size}px`, color, whiteSpace: 'nowrap',
    lineHeight: '1', letterSpacing: '0.01em', ...style } }, parent);
  if (filter) box.style.filter = filter;
  const spans = [...text].map((ch, i) => {
    const s = el('span', { style: { display: 'inline-block', transformOrigin: '50% 80%',
      transform: `translateY(${((rand(seed * 31 + i) - 0.5) * size * 0.07).toFixed(2)}px) rotate(${((rand(seed * 17 + i) - 0.5) * 7).toFixed(2)}deg) scale(${(0.95 + rand(seed * 13 + i) * 0.1).toFixed(3)})` } }, box, ch === ' ' ? ' ' : ch);
    return s;
  });
  return {
    box,
    set(p) {
      const n = spans.length, k = clamp(p) * n;
      spans.forEach((s, i) => { s.style.opacity = String(clamp(k - i)); });
    },
  };
}

// ---------- typography helpers ----------
/** Text block with sane typographic defaults. */
export function text(parent, str, style = {}, name) {
  const t = el('div', { 'data-name': name ?? str.slice(0, 40), style: {
    position: 'absolute', color: C.ink, fontFamily: F.serif, fontKerning: 'normal', fontSynthesis: 'none',
    fontFeatureSettings: '"kern","liga","onum"', whiteSpace: 'nowrap', lineHeight: '1', ...style } }, parent);
  t.innerHTML = str;
  return t;
}
/** Our small caps (the subset font has no smcp): capitals at 0.72 em, tracked +8 %. */
export const sc = s => `<span style="text-transform:uppercase;font-size:0.72em;letter-spacing:0.08em">${s}</span>`;

/** Running head + hairline + folio. Coordinates are page (world) px. */
export function chrome(page, L, { left, right, folio, top, x0, x1, bottom }) {
  const fs = L.px(26);
  text(page, sc(left), { left: `${x0}px`, top: `${top}px`, fontSize: `${fs * 1.3}px`, color: C.ink, letterSpacing: '0.02em' }, 'Running head');
  const r = text(page, right, { top: `${top + fs * 0.12}px`, fontFamily: F.mono, fontSize: `${fs}px`, color: C.pencil, fontFeatureSettings: '"tnum"' }, 'Running head · section');
  r.style.left = `${x1 - r.offsetWidth}px`;
  el('div', { 'data-name': 'Head rule', style: { position: 'absolute', left: `${x0}px`, width: `${x1 - x0}px`, top: `${top + fs * 1.75}px`, height: `${Math.max(2, L.px(2))}px`, background: C.ink } }, page);
  if (folio != null && bottom != null) {
    const f = text(page, folio, { top: `${bottom - fs}px`, fontSize: `${fs * 1.3}px`, fontStyle: 'italic', color: C.pencil }, 'Folio');
    f.style.left = `${(x0 + x1) / 2 - f.offsetWidth / 2}px`;
  }
}

/** Page container (world space). The camera transforms it. */
export function page(root, L, { w, h, seed = 3, name = 'Page' }) {
  const p = el('div', { 'data-name': name, style: {
    position: 'absolute', left: '0', top: '0', width: `${w}px`, height: `${h}px`, transformOrigin: '0 0',
    backgroundColor: C.paper, backgroundImage: `url(${paperURL(w, h, seed)})`, backgroundSize: `${w}px ${h}px`,
  } }, root);
  return p;
}
/** Camera: frame the world rect centred at (cx, cy) with zoom s. Fractional while moving, rounded at rest. */
export function camera(pageEl, L, cx, cy, s, moving = true) {
  let tx = L.width / 2 - cx * s, ty = L.height / 2 - cy * s;
  if (!moving) { tx = Math.round(tx); ty = Math.round(ty); }
  pageEl.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
}
export { clamp, progress, rand };

/** Wait for the faces we measure with (build time; layout uses offsetWidth). */
export async function fontsReady() {
  const faces = ['400 40px Newsreader', 'italic 400 40px Newsreader', '600 40px Newsreader', 'italic 600 40px Newsreader',
    '400 20px "IBM Plex Mono"', '500 40px "Shantell Sans"'];
  try { await Promise.all(faces.map(f => document.fonts.load(f))); } catch { /* render still works, widths may drift */ }
}
