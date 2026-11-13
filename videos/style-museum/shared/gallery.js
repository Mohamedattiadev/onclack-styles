// DISPLAY CASE — shared gallery kit. A dark museum gallery built in SVG: wall with downlight scallops, polished floor,
// glass vitrines on linen plinths drawn in REAL perspective (the vanishing point is the camera, so the box turns as the
// camera walks), spotlights that click on (mask-based light, warm multiply, cone + dust), glass reflections that slide
// against the objects, printed museum labels. Everything is a pure function of time.
import { svg, el, rand, noise1, clamp, lerp, smootherstep } from '/onclack-styles/engine/lib/anim.js';

let UID = 0;
const uid = p => `mu-${p}-${UID++}`;
export const F = 1 / 30;

/* ---------- palette tokens (README) ---------- */
export const PAL = {
  wall: '#1b1c20', wallSkirt: '#121316', floorNear: '#0b0c0e', floorFar: '#16171a',
  plinth: '#2a2b30', plinthLow: '#1c1d21', plinthSide: '#16171b',
  linen: '#d7cbb2', linenBack: '#b9ad95',
  label: '#ECE9E1', labelInk: '#1f1d1a', labelGrey: '#6c675f',
  warm: '#ffd8a0', warmHi: '#fff1d8',
  metal: '#4a4640', metalHi: '#9a948a', glass: '#9fb3ac',
  brass: '#a8844a', dark: '#0a0a0c',
  accent: '#B3261E', // the NO only
  ink: '#25262e',
};
export const FONT = { sans: "'Schibsted Grotesk', sans-serif", serif: "'Instrument Serif', serif" };

/* ---------- time helpers ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Scene-local start time of the n-th occurrence of a word (global fallback time). */
export function wt(ctx, w, n = 0, fallbackGlobal = 0) {
  const hits = (ctx.words || []).filter(x => norm(x.word) === norm(w));
  return (hits[n] ? hits[n].start : fallbackGlobal) - ctx.start;
}
export function wend(ctx, w, n = 0, fallbackGlobal = 0) {
  const hits = (ctx.words || []).filter(x => norm(x.word) === norm(w));
  return (hits[n] ? hits[n].end : fallbackGlobal) - ctx.start;
}
/** Light level from keys [[t, value, rampSeconds]]: each key moves from the current value to `value`. */
export function level(t, keys) {
  let pT = -1e9, pFrom = 0, pTo = 0, pR = 0;
  const at = tt => lerp(pFrom, pTo, pR <= 0 ? 1 : smootherstep((tt - pT) / pR));
  for (const [t0, v, r = 0.07] of keys) {
    if (t < t0) break;
    const from = at(t0);
    pT = t0; pFrom = from; pTo = v; pR = r;
  }
  return at(t);
}
/** Camera from shots [{t0, t1, x:[a,b], y:[a,b], z:[a,b], e:[s,e] (fraction of shot for the move)}]; hard cuts between shots. */
export function camera(t, shots, walk = 0) {
  let s = shots[0];
  for (const sh of shots) if (t >= sh.t0) s = sh;
  const [e0, e1] = s.e ?? [0, 1];
  const span = s.t1 - s.t0;
  const p = (t - s.t0) / span;
  const q = s.linear ? clamp((p - e0) / (e1 - e0)) : smootherstep((p - e0) / (e1 - e0));
  const v = k => (Array.isArray(s[k]) ? lerp(s[k][0], s[k][1], q) : s[k]);
  // a steadicam operator walking: tiny vertical bob + sway, only while the shot is a walk
  const w = (s.walk ?? walk);
  return { x: v('x') + w * noise1(t * 0.9, 3) * 1.2, y: v('y') + w * Math.sin(t * Math.PI * 2 * 0.92) * 1.1, z: v('z') };
}

/* ---------- textures (built once, seeded; imperfection fixed per object, never boiling) ---------- */
const TEX = {};
function canvasURL(key, w, h, draw) {
  if (TEX[key]) return TEX[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  return (TEX[key] = c.toDataURL('image/png'));
}
function noisePixels(g, w, h, amp, seed) {
  const im = g.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rand(i * 0.0137 + seed) - 0.5) * amp; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(im, 0, 0);
}
const linenURL = () => canvasURL('linen', 384, 384, (g, w, h) => {
  g.fillStyle = '#d4c8ae'; g.fillRect(0, 0, w, h);
  let s = 11;
  for (let y = 0; y < h; y += 2) { const a = (rand(s++) - 0.5) * 0.2; g.fillStyle = a > 0 ? `rgba(255,250,236,${a})` : `rgba(70,52,30,${-a})`; g.fillRect(0, y, w, 1); }
  for (let x = 0; x < w; x += 2) { const a = (rand(s++) - 0.5) * 0.16; g.fillStyle = a > 0 ? `rgba(255,250,236,${a})` : `rgba(70,52,30,${-a})`; g.fillRect(x, 0, 1, h); }
  for (let i = 0; i < 320; i++) { // slubs: thicker irregular threads, the thing that says "real linen"
    const x = rand(s++) * w, y = Math.floor(rand(s++) * h / 2) * 2, l = 5 + rand(s++) * 30;
    g.fillStyle = rand(s++) > 0.45 ? `rgba(250,244,226,${0.15 + rand(s++) * 0.2})` : `rgba(96,76,50,${0.12 + rand(s++) * 0.16})`;
    g.fillRect(x, y, l, 1.3); if (x + l > w) g.fillRect(x - w, y, l, 1.3);
  }
  noisePixels(g, w, h, 12, 3);
});
const paperURL = () => canvasURL('paper', 256, 256, (g, w, h) => {
  g.fillStyle = '#ebe4d2'; g.fillRect(0, 0, w, h);
  let s = 71;
  for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(120,100,70,${0.05 + rand(s++) * 0.07})`; g.lineWidth = 0.6; g.beginPath(); const x = rand(s++) * w, y = rand(s++) * h, a = rand(s++) * 6.28, l = 3 + rand(s++) * 9; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  noisePixels(g, w, h, 9, 7);
});
const concreteURL = () => canvasURL('conc', 512, 512, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  let s = 131;
  for (let i = 0; i < 90; i++) {
    const x = rand(s++) * w, y = rand(s++) * h, r = 20 + rand(s++) * 90, a = (rand(s++) - 0.5) * 0.22;
    for (const [dx, dy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      gr.addColorStop(0, a > 0 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${-a})`); gr.addColorStop(1, 'rgba(128,128,128,0)');
      g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  }
  noisePixels(g, w, h, 30, 11);
});
const grainURL = () => canvasURL('grain', 256, 256, (g, w, h) => {
  const im = g.createImageData(w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = 128 + (rand(i * 0.0071 + 19) - 0.5) * 255; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
});
const speckURL = () => canvasURL('speck', 256, 256, (g, w, h) => { // rubber-stamp ink: mostly solid, starved specks + one dry streak
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  let s = 211;
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${0.35 + rand(s++) * 0.6})`; const r = 0.4 + rand(s++) * 1.6; g.beginPath(); g.arc(rand(s++) * w, rand(s++) * h, r, 0, 6.29); g.fill(); }
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(0,0,0,${0.25 + rand(s++) * 0.3})`; g.fillRect(rand(s++) * w, rand(s++) * h, 14 + rand(s++) * 40, 1 + rand(s++) * 2); }
});

/* ---------- small svg helpers ---------- */
export const pts = a => a.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
function hull(P) { // monotone chain convex hull
  const p = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function grad(defs, type, id, stops, attrs = {}) {
  const g = svg(type, { id, ...attrs }, defs);
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g);
  return g;
}
export function text(parent, x, y, str, { size = 20, font = FONT.sans, weight = 400, italic = false, fill = PAL.labelInk, anchor = 'start', tracking = 0, name, opacity, tnum = false } = {}) {
  const t = svg('text', {
    x, y, 'font-family': font, 'font-size': size, 'font-weight': weight, fill, 'text-anchor': anchor,
    style: `font-style:${italic ? 'italic' : 'normal'};letter-spacing:${tracking}em;font-kerning:normal;font-variant-numeric:${tnum ? 'tabular-nums lining-nums' : 'lining-nums'}`,
  }, parent);
  if (name) t.setAttribute('data-name', name);
  if (opacity != null) t.setAttribute('opacity', opacity);
  t.textContent = str;
  return t;
}

/* =====================================================================================================
   GALLERY
   ===================================================================================================== */
export function gallery(root, ctx, { ambient = 0.3 } = {}) {
  const L = ctx.layout, W = L.width, H = L.height, u = L.px, P = L.portrait;
  const geo = P
    ? { Ybase: u(1470), ph: u(400), gh: u(560), yE: u(860), k: 0.15, Yf: u(1358), canopy: u(40), scY: u(-30) }
    : { Ybase: u(935), ph: u(330), gh: u(390), yE: u(470), k: 0.16, Yf: u(846), canopy: u(32), scY: u(-60) };
  const pw = 0.86, pf = 1.45; // parallax: back wall, foreground

  const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'data-name': 'Gallery', style: 'position:absolute;inset:0;display:block' }, root);
  const defs = svg('defs', {}, s);
  const id = {
    linen: uid('linen'), paper: uid('paper'), conc: uid('conc'), speck: uid('speck'), blob: uid('blob'), warm: uid('warm'), pool: uid('pool'),
    cone: uid('cone'), scallop: uid('scal'), floor: uid('floor'), refl: uid('refl'), fglow: uid('fglow'), band: uid('band'), face: uid('face'),
    hi: uid('hi'), wash: uid('wash'), blur: uid('blur'), blurS: uid('blurs'), side: uid('side'), canopy: uid('canopy'), ceil: uid('ceil'),
  };
  const pat = (pid, href, w, h, extra = {}) => { const p = svg('pattern', { id: pid, patternUnits: 'userSpaceOnUse', width: w, height: h, ...extra }, defs); svg('image', { href, width: w, height: h, preserveAspectRatio: 'none' }, p); };
  pat(id.linen, linenURL(), u(200), u(200));
  pat(id.paper, paperURL(), u(220), u(220));
  pat(id.conc, concreteURL(), u(900), u(900));
  pat(id.speck, speckURL(), u(120), u(120));
  grad(defs, 'radialGradient', id.blob, [[0, '#000', 1], [0.42, '#000', 0.92], [0.75, '#000', 0.4], [1, '#000', 0]]);
  grad(defs, 'radialGradient', id.warm, [[0, '#ffd59c', 0.85], [0.6, '#ffe2bb', 0.45], [1, '#fff', 0]]);
  grad(defs, 'radialGradient', id.pool, [[0, PAL.warmHi, 0.55], [0.5, PAL.warm, 0.22], [1, PAL.warm, 0]]);
  grad(defs, 'linearGradient', id.cone, [[0, '#fff4df', 0.2], [0.55, '#ffe6c2', 0.07], [1, '#ffe6c2', 0.02]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad(defs, 'radialGradient', id.scallop, [[0, '#a69d8e', 0.6], [0.35, '#857d71', 0.32], [1, '#5a554d', 0]], { cx: 0.5, cy: 0, r: 1 });
  grad(defs, 'linearGradient', id.floor, [[0, PAL.floorFar], [1, PAL.floorNear]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad(defs, 'linearGradient', id.refl, [[0, '#2a2b30', 0.5], [1, '#2a2b30', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad(defs, 'radialGradient', id.fglow, [[0, '#ffcf91', 0.22], [1, '#ffcf91', 0]]);
  grad(defs, 'linearGradient', id.band, [[0, '#fff', 0], [0.5, '#fff', 0.11], [1, '#fff', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  grad(defs, 'linearGradient', id.face, [[0, PAL.plinth], [1, PAL.plinthLow]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad(defs, 'linearGradient', id.hi, [[0, '#ffe0b0', 0.3], [1, '#ffe0b0', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad(defs, 'radialGradient', id.wash, [[0, '#ffe2b6', 0.34], [0.5, '#e8cfa6', 0.13], [1, '#e8cfa6', 0]]);
  grad(defs, 'linearGradient', id.side, [[0, '#fff', 0.1], [0.4, '#fff', 0.03], [1, '#fff', 0.07]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  grad(defs, 'linearGradient', id.canopy, [[0, '#2f2e2c'], [0.8, '#1c1b1a'], [1, '#0e0e0e']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  const fb = svg('filter', { id: id.blur, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
  svg('feGaussianBlur', { stdDeviation: u(16) }, fb);
  const fbs = svg('filter', { id: id.blurS, x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
  svg('feGaussianBlur', { stdDeviation: u(5) }, fbs);

  const gWall = svg('g', { 'data-name': 'Back wall (parallax 0.86)' }, s);
  const gFloor = svg('g', { 'data-name': 'Floor' }, s);
  const gCases = svg('g', { 'data-name': 'Cases' }, s);
  const gFg = svg('g', { 'data-name': 'Foreground' }, s);

  /* wall: painted plaster, downlight scallops, skirting */
  svg('rect', { x: -20000, y: -4000, width: 60000, height: geo.Yf + 4000, fill: PAL.wall }, gWall);
  svg('rect', { x: -20000, y: -4000, width: 60000, height: geo.Yf + 4000, fill: `url(#${id.conc})`, opacity: 0.09, style: 'mix-blend-mode:overlay' }, gWall);
  const gSc = svg('g', { 'data-name': 'Wall scallops (ambient light)' }, gWall);
  const spacing = P ? u(620) : u(760);
  for (let i = -14; i < 40; i++) {
    const x = i * spacing + (rand(i + 40) - 0.5) * u(30);
    svg('ellipse', { cx: x, cy: geo.scY, rx: u(300), ry: (P ? u(980) : u(700)) * (0.92 + rand(i + 90) * 0.16), fill: `url(#${id.scallop})` }, gSc);
  }
  svg('rect', { x: -20000, y: geo.Yf - u(18), width: 60000, height: u(18), fill: PAL.wallSkirt }, gWall);
  svg('rect', { x: -20000, y: geo.Yf - u(18), width: 60000, height: u(1.5), fill: '#2e2f33' }, gWall);

  /* floor: polished concrete, wall sheen */
  svg('rect', { x: -20000, y: geo.Yf, width: 60000, height: u(3000), fill: `url(#${id.floor})` }, gFloor);
  svg('rect', { x: -20000, y: geo.Yf, width: 60000, height: u(3000), fill: `url(#${id.conc})`, opacity: 0.22, style: 'mix-blend-mode:overlay' }, gFloor);
  const sheen = svg('rect', { x: -20000, y: geo.Yf, width: 60000, height: u(70), fill: '#fff', opacity: 0.025 }, gFloor);
  svg('rect', { x: -20000, y: geo.Yf, width: 60000, height: u(5), fill: '#000', opacity: 0.45 }, gFloor);

  /* grain (screen space, seeded per frame) */
  const grain = el('div', { 'data-name': 'Grain', style: { position: 'absolute', inset: 0, backgroundImage: `url(${grainURL()})`, backgroundSize: `${u(256)}px`, opacity: 0.055, mixBlendMode: 'overlay', pointerEvents: 'none' } }, root);

  const cases = [], wallItems = [], fgItems = [];
  const G = {
    L, u, W, H, P, geo, defs, id, s, gWall, gFloor, gCases, gFg, pw, pf, cases,
    ambient: () => ambient, setAmbient(a) { ambient = a; },
    /** wall-layer x for something that should sit centred when the camera is at world X */
    wallX: X => X * pw,
    fgX: X => X * pf,
  };

  /* ---- wall text block: vinyl letters + its own wall-wash light ---- */
  G.wallText = ({ X, y, lines, anchor = 'middle', washR = [700, 380], name = 'Wall text', minO = 0.16 }) => {
    const g = svg('g', { 'data-name': name }, gWall);
    const wash = svg('ellipse', { cx: X * pw, cy: y, rx: u(washR[0]), ry: u(washR[1]), fill: `url(#${id.wash})`, opacity: 0, style: 'mix-blend-mode:screen' }, g);
    const tg = svg('g', {}, g);
    for (const ln of lines) text(tg, X * pw + (ln.dx ?? 0), y + ln.dy, ln.text, { anchor, fill: ln.fill ?? '#e6e1d5', ...ln });
    const item = { g, wash, tg, set(lv) { wash.setAttribute('opacity', lv.toFixed(3)); tg.setAttribute('opacity', (minO + (1 - minO) * lv).toFixed(3)); } };
    wallItems.push(item);
    return item;
  };
  /* ---- foreground bench (out of focus, passes the lens) ---- */
  G.bench = (X, w, yBase) => {
    const g = svg('g', { 'data-name': 'Foreground bench (out of focus)', filter: `url(#${id.blur})` }, gFg);
    const y = yBase ?? H + u(10);
    svg('rect', { x: X * pf - w / 2, y: y - u(150), width: w, height: u(58), rx: u(8), fill: '#050506' }, g);
    svg('rect', { x: X * pf - w / 2 + u(40), y: y - u(100), width: u(36), height: u(200), fill: '#050506' }, g);
    svg('rect', { x: X * pf + w / 2 - u(76), y: y - u(100), width: u(36), height: u(200), fill: '#050506' }, g);
    svg('rect', { x: X * pf - w / 2, y: y - u(150), width: w, height: u(4), fill: '#34353a', opacity: 0.7 }, g);
    return g;
  };

  /* =================================================================================================
     CASE: plinth + linen deck + back panel + glass hood + canopy with internal spots
     spec: { cx, w, ph, gh, name, label:{...}, spots:[{x, y, f, r, keys, cone}], back }
     ================================================================================================= */
  G.addCase = (spec) => {
    const k = spec.k ?? geo.k;
    const w = spec.w, cx = spec.cx;
    const ph = spec.ph ?? geo.ph, gh = spec.gh ?? geo.gh;
    const yb = geo.Ybase, ypt = yb - ph, ygt = ypt - gh;
    const xl = cx - w / 2, xr = cx + w / 2;
    const cg = svg('g', { 'data-name': spec.name ?? 'Case' }, gCases);
    const C = { spec, cg, xl, xr, ypt, ygt, yb, k, cx, w, placed: [], spotEls: [], lights: [] };

    // floor: reflection of the plinth + warm spill
    const reflR = svg('rect', { x: xl, y: yb, width: w, height: ph * 0.55, fill: `url(#${id.refl})`, opacity: 0.8 }, cg);
    const fGlow = svg('ellipse', { cx, cy: yb + u(16), rx: w * 0.75, ry: u(60), fill: `url(#${id.fglow})`, opacity: 0, style: 'mix-blend-mode:screen' }, cg);
    svg('rect', { x: xl - u(6), y: yb - u(2), width: w + u(12), height: u(10), rx: u(4), fill: '#000', opacity: 0.55, filter: `url(#${id.blurS})` }, cg);
    // plinth
    const pSide = svg('polygon', { fill: PAL.plinthSide }, cg);
    svg('rect', { x: xl, y: ypt, width: w, height: ph, fill: `url(#${id.face})`, 'data-name': 'Plinth' }, cg);
    svg('rect', { x: xl + u(10), y: yb - u(14), width: w - u(20), height: u(14), fill: '#0d0d0f' }, cg); // toe-kick
    const pHi = svg('rect', { x: xl, y: ypt, width: w, height: ph * 0.45, fill: `url(#${id.hi})`, opacity: 0 }, cg);
    svg('rect', { x: xl, y: ypt, width: w, height: u(1.5), fill: '#55534e', opacity: 0.8 }, cg);
    // label
    let labelDim = null;
    if (spec.label) {
      const lb = G.label(cg, spec.label, { xl, xr, ypt, w });
      labelDim = lb.dim; C.labelBox = lb;
    }
    // case interior
    const back = svg('polygon', { fill: `url(#${id.linen})`, 'data-name': 'Back panel (linen)' }, cg);
    const backShade = svg('polygon', { fill: '#2b2318', opacity: 0.42 }, cg);
    const deck = svg('polygon', { fill: `url(#${id.linen})`, 'data-name': 'Deck (linen)' }, cg);
    const deckShade = svg('polygon', { fill: '#fff6e6', opacity: 0.06 }, cg);
    const gObj = svg('g', { 'data-name': 'Objects' }, cg);
    // light: darkness overlay masked by spot blobs, then warm multiply
    const mid = uid('mask');
    const mask = svg('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -20000, y: -4000, width: 60000, height: 9000 }, defs);
    const maskBase = svg('rect', { x: -20000, y: -4000, width: 60000, height: 9000, fill: '#fff' }, mask);
    void maskBase;
    const dark = svg('polygon', { fill: PAL.dark, mask: `url(#${mid})`, 'data-name': 'Case darkness' }, cg);
    const warmG = svg('g', { style: 'mix-blend-mode:multiply' }, cg);
    const screenG = svg('g', { style: 'mix-blend-mode:screen' }, cg);
    for (const sp of spec.spots ?? []) {
      const blob = svg('ellipse', { fill: `url(#${id.blob})` }, mask);
      const warm = svg('ellipse', { fill: `url(#${id.warm})` }, warmG);
      const pool = svg('ellipse', { fill: `url(#${id.pool})` }, screenG);
      const cone = svg('polygon', { fill: `url(#${id.cone})` }, screenG);
      const clipId = uid('clip');
      const clip = svg('clipPath', { id: clipId }, defs);
      const clipPoly = svg('polygon', {}, clip);
      const motes = svg('g', { 'clip-path': `url(#${clipId})` }, screenG);
      const ms = [];
      const n = sp.cone === false ? 0 : (sp.motes ?? 26);
      for (let i = 0; i < n; i++) ms.push({ c: svg('circle', { r: u(0.9 + rand(i * 7 + sp.x) * 1.7), fill: '#fff4e0' }, motes), a: rand(i * 3.1 + 5), b: rand(i * 5.7 + 9), v: 0.25 + rand(i * 1.3 + 2) * 0.6, o: 0.3 + rand(i * 9.1) * 0.7 });
      C.spotEls.push({ sp, blob, warm, pool, cone, clipPoly, motes, ms });
    }
    // glass hood
    const gTop = svg('polygon', { fill: '#cfe0da', opacity: 0.035 }, cg);
    const gSideL = svg('polygon', { fill: `url(#${id.side})` }, cg);
    const gSideR = svg('polygon', { fill: `url(#${id.side})` }, cg);
    const rearEdges = svg('path', { fill: 'none', stroke: PAL.metalHi, 'stroke-width': u(1.3), opacity: 0.35 }, cg);
    // reflections on the front pane (clipped), they slide against the objects as the camera walks
    const rcId = uid('rclip');
    const rc = svg('clipPath', { id: rcId }, defs);
    svg('rect', { x: xl, y: ygt, width: w, height: gh }, rc);
    const refl = svg('g', { 'clip-path': `url(#${rcId})`, style: 'mix-blend-mode:screen', 'data-name': 'Glass reflections' }, cg);
    const bands = [];
    for (let i = 0; i < 3; i++) {
      const bw = w * (0.07 + rand(cx * 0.001 + i) * 0.1);
      const b = svg('polygon', { fill: `url(#${id.band})`, opacity: i === 1 ? 0.55 : 1 }, refl);
      bands.push({ b, bw, base: (i - 1) * w * 0.42 + (rand(i + cx * 0.003) - 0.5) * w * 0.1, slant: w * (0.08 + i * 0.03) });
    }
    const ceilR = []; // reflections of the ceiling track lights
    for (let i = 0; i < 4; i++) ceilR.push(svg('ellipse', { cy: ygt + u(22), rx: u(22), ry: u(4), fill: `url(#${id.pool})`, opacity: 0.5 }, refl));
    const oppo = svg('rect', { y: ygt + gh * 0.18, width: w * 0.22, height: gh * 0.55, fill: '#ffdcae', opacity: 0.035 }, refl); // a lit case behind the camera
    // frame
    svg('rect', { x: xl, y: ypt - u(10), width: w, height: u(10), fill: PAL.metal }, cg);
    svg('rect', { x: xl, y: ypt - u(10), width: w, height: u(1.2), fill: PAL.metalHi, opacity: 0.6 }, cg);
    const front = svg('rect', { x: xl, y: ygt, width: w, height: gh, fill: 'none', stroke: PAL.glass, 'stroke-width': u(2), opacity: 0.5 }, cg);
    void front;
    for (const x of [xl, xr]) svg('rect', { x: x - u(2), y: ygt, width: u(4), height: gh, fill: PAL.glass, opacity: 0.22 }, cg); // glass thickness edge
    const sideEdges = svg('path', { fill: 'none', stroke: PAL.glass, 'stroke-width': u(1.6), opacity: 0.4 }, cg);
    // canopy (opaque light box) + its side
    const canSide = svg('polygon', { fill: '#141414' }, cg);
    svg('rect', { x: xl - u(4), y: ygt - geo.canopy, width: w + u(8), height: geo.canopy, fill: `url(#${id.canopy})`, 'data-name': 'Canopy' }, cg);
    svg('rect', { x: xl - u(4), y: ygt - geo.canopy, width: w + u(8), height: u(1.5), fill: '#5c5852', opacity: 0.7 }, cg);
    const canGlow = svg('rect', { x: xl, y: ygt, width: w, height: u(3), fill: PAL.warmHi, opacity: 0 }, cg);

    C.place = (x, f, name, half) => { const g = svg('g', { 'data-name': name ?? 'Object' }, gObj); C.placed.push({ g, x, f, half }); return g; };
    C.rear = null;
    C.update = (t, cam) => {
      const vpX = cam.x, vpY = geo.yE;
      const R = (x, y, f = 1) => [x + (vpX - x) * k * f, y + (vpY - y) * k * f];
      C.rear = R;
      const rTL = R(xl, ygt), rTR = R(xr, ygt), rBL = R(xl, ypt), rBR = R(xr, ypt), rFL = R(xl, yb), rFR = R(xr, yb);
      // plinth side
      if (vpX < xl) pSide.setAttribute('points', pts([[xl, ypt], rBL, rFL, [xl, yb]]));
      else if (vpX > xr) pSide.setAttribute('points', pts([[xr, ypt], rBR, rFR, [xr, yb]]));
      else pSide.setAttribute('points', '0,0');
      back.setAttribute('points', pts([rBL, rBR, rTR, rTL]));
      backShade.setAttribute('points', pts([rBL, rBR, rTR, rTL]));
      deck.setAttribute('points', pts([[xl, ypt], [xr, ypt], rBR, rBL]));
      deckShade.setAttribute('points', pts([[xl, ypt], [xr, ypt], rBR, rBL]));
      gTop.setAttribute('points', pts([[xl, ygt], [xr, ygt], rTR, rTL]));
      const sideL = vpX < xl ? [[xl, ygt], rTL, rBL, [xl, ypt]] : null;
      const sideR = vpX > xr ? [[xr, ygt], rTR, rBR, [xr, ypt]] : null;
      gSideL.setAttribute('points', sideL ? pts(sideL) : '0,0');
      gSideR.setAttribute('points', sideR ? pts(sideR) : '0,0');
      rearEdges.setAttribute('d', `M${pts([rBL, rTL, rTR, rBR])}`.replace(/ /g, ' L'));
      sideEdges.setAttribute('d', [[xl, ygt, rTL], [xr, ygt, rTR], [xl, ypt, rBL], [xr, ypt, rBR]].map(([x, y, r]) => `M${x},${y} L${r[0]},${r[1]}`).join(' '));
      const cTL = R(xl - u(4), ygt - geo.canopy), cBL = R(xl - u(4), ygt), cTR = R(xr + u(4), ygt - geo.canopy), cBR = R(xr + u(4), ygt);
      canSide.setAttribute('points', vpX < xl ? pts([[xl - u(4), ygt - geo.canopy], cTL, cBL, [xl - u(4), ygt]]) : vpX > xr ? pts([[xr + u(4), ygt - geo.canopy], cTR, cBR, [xr + u(4), ygt]]) : '0,0');
      dark.setAttribute('points', pts(hull([[xl, ygt], [xr, ygt], [xr, ypt], [xl, ypt], rTL, rTR, rBL, rBR])));
      // objects at depth f
      for (const o of C.placed) {
        const [bx, by] = R(cx + o.x, ypt, o.f); const sc = 1 - k * o.f;
        o.g.setAttribute('transform', `translate(${bx.toFixed(2)} ${by.toFixed(2)}) scale(${sc.toFixed(4)})`);
        if (o.half) { const s0 = W / 2 + (bx - o.half - cam.x) * cam.z, s1 = W / 2 + (bx + o.half - cam.x) * cam.z; o.g.style.display = (s1 < 0 || s0 > W) ? 'none' : ''; }
      }
      // lights
      const A = ambient;
      let Lsum = 0;
      for (const S of C.spotEls) {
        const sp = S.sp, lv = clamp(level(t, sp.keys ?? []), 0, 1.2);
        Lsum = Math.max(Lsum, lv * (sp.weight ?? 1));
        const sc = 1 - k * sp.f;
        const [tx, ty] = R(cx + sp.x, ypt - sp.y, sp.f);
        const r = sp.r * sc;
        S.blob.setAttribute('cx', tx); S.blob.setAttribute('cy', ty);
        S.blob.setAttribute('rx', r); S.blob.setAttribute('ry', r * (sp.ry ?? 1.12)); S.blob.setAttribute('opacity', clamp(lv).toFixed(3));
        S.warm.setAttribute('cx', tx); S.warm.setAttribute('cy', ty); S.warm.setAttribute('rx', r * 0.9); S.warm.setAttribute('ry', r); S.warm.setAttribute('opacity', (0.55 * clamp(lv)).toFixed(3));
        const [px, py] = R(cx + sp.x, ypt, sp.f);
        S.pool.setAttribute('cx', px); S.pool.setAttribute('cy', py - u(4)); S.pool.setAttribute('rx', r * 0.95); S.pool.setAttribute('ry', r * 0.16); S.pool.setAttribute('opacity', (0.9 * clamp(lv)).toFixed(3));
        if (sp.cone !== false) {
          const [fx, fy] = R(cx + sp.x, ygt, sp.f);
          const tw = u(9) * sc, bw = r * (sp.coneW ?? 0.85);
          const poly = [[fx - tw, fy], [fx + tw, fy], [px + bw, py], [px - bw, py]];
          S.cone.setAttribute('points', pts(poly)); S.clipPoly.setAttribute('points', pts(poly));
          S.cone.setAttribute('opacity', (clamp(lv) * (sp.coneO ?? 1)).toFixed(3));
          const hgt = py - fy, kick = sp.kick ? sp.kick(t) : 0;
          for (const m of S.ms) {
            const yy = ((m.a + t * m.v * 0.035) % 1);
            const half = tw + (bw - tw) * yy;
            const xx = fx + (m.b - 0.5) * 2 * half * 0.92 + noise1(t * 0.25, m.a * 40) * u(6);
            m.c.setAttribute('cx', xx.toFixed(2)); m.c.setAttribute('cy', (fy + yy * hgt - kick * u(14) * (0.5 + m.b)).toFixed(2));
            m.c.setAttribute('opacity', (clamp(lv) * m.o * 0.75 * Math.sin(Math.PI * yy)).toFixed(3));
          }
        }
        if (sp.onFrame) sp.onFrame(lv, tx, ty, r);
      }
      const base = 0.95 - 0.5 * A;
      dark.setAttribute('opacity', base.toFixed(3));
      canGlow.setAttribute('opacity', (0.5 * clamp(Lsum)).toFixed(3));
      pHi.setAttribute('opacity', (0.45 * clamp(Lsum)).toFixed(3));
      fGlow.setAttribute('opacity', clamp(Lsum).toFixed(3));
      reflR.setAttribute('opacity', (0.5 + 0.3 * A).toFixed(3));
      if (labelDim) labelDim.setAttribute('opacity', (0.62 * (1 - clamp(0.35 + A * 0.9 + 0.5 * Lsum))).toFixed(3));
      // reflections: things behind the camera — they move against the truck
      const off = (cam.x - cx);
      for (const B of bands) {
        const x0 = cx + B.base - off * 0.55;
        B.b.setAttribute('points', pts([[x0 + B.slant, ygt], [x0 + B.slant + B.bw, ygt], [x0 + B.bw, ypt], [x0, ypt]]));
      }
      ceilR.forEach((e, i) => { e.setAttribute('cx', (cx + (i - 1.5) * w * 0.34 - off * 0.85).toFixed(2)); });
      oppo.setAttribute('x', (cx + w * 0.18 - off * 0.7).toFixed(2));
      refl.setAttribute('opacity', (0.75 + 0.5 * A).toFixed(3));
      if (spec.onUpdate) spec.onUpdate(t, cam, C);
    };
    cases.push(C);
    return C;
  };

  /* ---- printed museum label on the plinth front ---- */
  G.label = (parent, lab, { xl, xr, ypt, w }) => {
    const lw = lab.w ?? (P ? u(600) : u(390));
    const pad = P ? u(26) : u(20);
    const ts = lab.titleSize ?? (P ? u(52) : u(40)), ms = lab.metaSize ?? (P ? u(26) : u(19)), ns = P ? u(21) : u(16);
    const x = lab.align === 'center' ? (xl + xr) / 2 - lw / 2 : xr - lw - (P ? u(30) : u(24));
    const y = ypt + (P ? u(40) : u(30));
    const titleLines = Array.isArray(lab.title) ? lab.title : [lab.title];
    const lh = ts * 1.02, mh = ms * 1.36;
    const h = pad + ns * 1.2 + u(12) + titleLines.length * lh * 1.25 + u(10) + u(14) + lab.lines.length * mh + pad * 0.7;
    const g = svg('g', { 'data-name': lab.name ?? 'Museum label' }, parent);
    svg('rect', { x: x + u(3), y: y + u(4), width: lw, height: h, fill: '#000', opacity: 0.45, filter: `url(#${id.blurS})` }, g);
    svg('rect', { x, y, width: lw, height: h, fill: PAL.label }, g);
    svg('rect', { x, y, width: lw, height: h, fill: `url(#${id.paper})`, opacity: 0.35, style: 'mix-blend-mode:multiply' }, g);
    let yy = y + pad + ns;
    text(g, x + pad, yy, lab.num, { size: ns, weight: 600, fill: PAL.labelGrey, tracking: 0.09, name: 'Label number', tnum: true });
    yy += u(12);
    titleLines.forEach((tl, i) => { yy += i ? lh * 1.25 : lh; text(g, x + pad, yy - ts * 0.18, tl, { size: ts, font: FONT.serif, italic: true, fill: PAL.labelInk, tracking: -0.01, name: 'Label title' }); });
    yy += u(10);
    svg('rect', { x: x + pad, y: yy, width: u(46), height: Math.max(1.5, u(2)), fill: PAL.labelInk }, g);
    yy += u(14);
    lab.lines.forEach(l => { yy += mh; text(g, x + pad, yy - ms * 0.3, l, { size: ms, fill: '#4f4b45', name: 'Label text' }); });
    const dim = svg('rect', { x, y, width: lw, height: h, fill: '#000', opacity: 0.3 }, g);
    return { g, dim, x, y, w: lw, h };
  };

  G.update = (t, cam) => {
    const z = cam.z;
    const tr = (p) => `translate(${(W / 2 - cam.x * p * z).toFixed(2)} ${(H / 2 - cam.y * z).toFixed(2)}) scale(${z.toFixed(4)})`;
    gWall.setAttribute('transform', tr(pw));
    gFloor.setAttribute('transform', tr(1));
    gCases.setAttribute('transform', tr(1));
    gFg.setAttribute('transform', tr(pf));
    gSc.setAttribute('opacity', clamp(ambient * 2.4, 0, 1).toFixed(3));
    sheen.setAttribute('opacity', (0.012 + ambient * 0.05).toFixed(3));
    // cull what is fully outside the frame (keeps the layout lint honest, saves paint)
    const sx = X => W / 2 + (X - cam.x) * z, sy = Y => H / 2 + (Y - cam.y) * z;
    for (const c of cases) {
      const off = sx(c.xr + c.w * 0.25) < 0 || sx(c.xl - c.w * 0.25) > W;
      c.cg.style.display = off ? 'none' : '';
      if (off) continue;
      c.update(t, cam);
      const b = c.labelBox;
      if (b) b.g.style.display = c.hideLabel ? 'none' : (sx(b.x + b.w) < 0 || sx(b.x) > W || sy(b.y) > H || sy(b.y + b.h) < 0) ? 'none' : '';
    }
    for (const wi of wallItems) {
      const bb = wi.box ?? (wi.box = (() => { try { return wi.tg.getBBox(); } catch { return null; } })());
      if (bb && bb.width) { const X0 = (bb.x - cam.x * pw) * z + W / 2, X1 = (bb.x + bb.width - cam.x * pw) * z + W / 2; wi.g.style.display = (X1 < 0 || X0 > W) ? 'none' : ''; }
    }
    const fr = Math.round(t * 30);
    grain.style.backgroundPosition = `${Math.floor(rand(fr * 1.7 + 3) * 256)}px ${Math.floor(rand(fr * 2.3 + 8) * 256)}px`;
  };
  return G;
}
