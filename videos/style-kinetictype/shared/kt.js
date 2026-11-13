// KINETIC TYPE — shared tokens and type helpers ("the words are the picture").
// Palette: 2 colours + 1 accent. Fonts: KT Bricolage (variable wght 200–800, wdth 75–100) + IBM Plex Mono.
import { el, svg, progress, clamp, noise1 } from '/onclack-styles/engine/lib/anim.js';

export const C = {
  paper: '#ECE8DF',   // light base (warm off-white, not pure white)
  ink: '#17181B',     // dark base (never #000)
  signal: '#D9441A',  // the one accent: marks the decision only (ticks, YES, no.)
  hush: '#9A958C',    // ink mixed into paper ~45 % — only for "hides"/"silent" (a weight of the ink, not a 4th hue)
};
export const FAM = { disp: "'KT Bricolage', sans-serif", mono: "'IBM Plex Mono', monospace" };
export const F = 1 / 30;

// Motion tokens (history-director §7.10) as cubic-beziers.
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let s = p;
    for (let i = 0; i < 8; i++) { const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= (X(s) - p) / d; }
    return Y(clamp(s, 0, 1));
  };
}
export const ez = {
  enter: bezier(0.16, 1, 0.3, 1),
  exit: bezier(0.7, 0, 0.84, 0),
  move: bezier(0.65, 0, 0.35, 1),
  camera: bezier(0.45, 0, 0.15, 1),
  fall: p => p * p * p,          // gravity: accelerates into the impact
  lin: p => p,
};
export const tw = (t, a, b, from, to, e = ez.enter) => from + (to - from) * e(progress(t, a, b));

/* ---------- voice ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Local scene time of the nth spoken word `w` (fallback = local seconds if no words.json). */
export function wordT(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.words.filter(x => norm(x.word) === norm(w) && x.start >= ctx.start - 0.01);
  return hits[n] ? hits[n].start - ctx.start : fallback;
}
/** Visual onset for a word: 2 frames before it is spoken (rule: 0–3 f before). */
export const on = (ctx, w, n, fb) => wordT(ctx, w, n, fb) - 2 * F;

/* ---------- grid (12 cols in 16:9, 4 in 9:16, 8-px baseline) ---------- */
export function grid(L) {
  const n = L.pick({ landscape: 12, portrait: 4 }), g = L.px(24);
  const cw = (L.safe.w - g * (n - 1)) / n;
  return { n, g, cw, x: i => L.safe.x + i * (cw + g), w: k => k * cw + (k - 1) * g, right: L.safe.x + L.safe.w, bl: v => Math.round(v / 8) * 8 };
}

/* ---------- type ---------- */
const fv = (wght, wdth) => `'wght' ${wght.toFixed(1)}, 'wdth' ${wdth.toFixed(1)}`;
export function setAxes(node, wght, wdth) { node.style.fontVariationSettings = fv(wght, wdth); }

/** Baseline offset (px from the element's top) — so type sits on exact baselines, not on box tops. */
function baselineOf(node) {
  const probe = el('span', { style: { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' } }, node);
  const b = probe.offsetTop; probe.remove(); return b;
}
let capCache = {};
/** Cap-height ratio of a family at a weight (measured once with canvas). */
export function capRatio(fam = 'disp', wght = 700) {
  const k = fam + wght; if (capCache[k]) return capCache[k];
  const g = document.createElement('canvas').getContext('2d');
  g.font = `${wght} 200px ${FAM[fam]}`;
  return (capCache[k] = g.measureText('H').actualBoundingBoxAscent / 200);
}

/**
 * One block of type placed on a BASELINE. o: { x, base, size, fam, wght, wdth, color, ls (em), align: left|right, z }.
 * Children words: pass `words` (array of strings) to get maskable word spans (node.words[i] = { wrap, inner }).
 */
export function T(parent, name, text, o) {
  const { fam = 'disp', size, wght = 700, wdth = 100, color = C.ink, ls = 0, align = 'left', upper = false } = o;
  const node = el('div', { 'data-name': name, style: {
    position: 'absolute', left: '0px', top: '0px', whiteSpace: 'nowrap', lineHeight: '1', fontFamily: FAM[fam],
    fontSize: size + 'px', color, letterSpacing: ls + 'em', textTransform: upper ? 'uppercase' : 'none',
    fontVariantNumeric: 'lining-nums tabular-nums', willChange: 'transform',
  } }, parent);
  if (fam === 'disp') setAxes(node, wght, wdth); else node.style.fontWeight = String(wght);
  node.words = [];
  if (o.words) {
    o.words.forEach((w, i) => {
      // clip-path mask (keeps the baseline, unlike overflow:hidden on inline-blocks)
      const wrap = el('span', { 'data-name': `${name} · ${w}`, style: { display: 'inline-block', clipPath: 'inset(-0.25em -0.2em 0 -0.2em)' } }, node);
      const inner = el('span', { style: { display: 'inline-block', willChange: 'transform' } }, wrap, w);
      node.words.push({ wrap, inner });
      if (i < o.words.length - 1 && (o.join ?? ' ')) node.appendChild(document.createTextNode(o.join ?? ' '));
    });
  } else node.textContent = text;
  const b = baselineOf(node);
  node.m = { w: node.offsetWidth, h: node.offsetHeight, b, cap: capRatio(fam, wght) * size };
  node.place = (x, base) => {
    node.m.x = align === 'right' ? x - node.m.w : x; node.m.base = base;
    node.style.left = node.m.x.toFixed(2) + 'px'; node.style.top = (base - b).toFixed(2) + 'px';
  };
  node.place(o.x ?? 0, o.base ?? 0);
  return node;
}

/** T() whose size shrinks so the block is at most maxW wide (deterministic: same text → same size). */
export function fitT(parent, name, text, o, maxW) {
  let n = T(parent, name, text, o);
  if (n.m.w > maxW) { const size = o.size * maxW / n.m.w; n.remove(); n = T(parent, name, text, { ...o, size }); }
  return n;
}

/** Word rises out of its own baseline mask (enter token, 7 f). */
export function rise(word, t, at, dur = 7 * F) {
  const p = ez.enter(progress(t, at, at + dur));
  word.inner.style.transform = `translateY(${((1 - p) * 105).toFixed(2)}%)`;
  word.wrap.style.visibility = t < at ? 'hidden' : 'visible';
}
/** Hard cut on/off (no fade): visible from a to b. */
// (opacity, not visibility: a child with visibility:visible would still show inside a hidden parent)
export const show = (node, t, a, b = Infinity) => { node.style.opacity = t >= a && t < b ? '1' : '0'; };
export const vis = (node, on) => { node.style.opacity = on ? '1' : '0'; };

/** A plain box (rule, hairline, tick box). */
export function box(parent, name, x, y, w, h, style = {}) {
  return el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', ...style } }, parent);
}

/** Camera: a world layer moved as one (translate + scale around a focus point). */
export function camera(parent, name = 'Type layout (camera)') {
  const w = el('div', { 'data-name': name, style: { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', transformOrigin: '0 0', willChange: 'transform' } }, parent);
  w.set = (x, y, s = 1) => { w.style.transform = `translate(${(-x * s).toFixed(2)}px, ${(-y * s).toFixed(2)}px) scale(${s.toFixed(5)})`; };
  return w;
}

/** Impact jolt: smooth noise (no per-frame sign flip → no 15 Hz flicker), decays. Returns px. */
export function jolt(t, at, amp, decay = 0.4, seed = 1) {
  const d = t - at; if (d < 0 || d > decay) return 0;
  const k = 1 - d / decay;
  return amp * k * k * (Math.sin(d * 38 + seed) * 0.7 + noise1(d * 20, seed) * 0.3);
}

/** Hand-made tick (seeded wobble so no two ticks are identical). Returns { path, draw(t, at) }. */
export function tick(parent, name, x, y, s, seed, color = C.signal) {
  const sv = svg('svg', { 'data-name': name, width: s * 1.6, height: s * 1.4, viewBox: '0 0 160 140', style: `position:absolute;left:${x}px;top:${y}px;overflow:visible` }, parent);
  const j = k => (Math.sin(seed * 7.3 + k * 3.1) * 6).toFixed(1);
  const d = `M ${12 + +j(1)} ${74 + +j(2)} C 30 ${86 + +j(3)}, 44 ${104 + +j(4)}, ${56 + +j(5)} ${124} C ${78} ${84 + +j(6)}, ${108 + +j(7)} ${40}, ${150 + +j(8)} ${8 + +j(9)}`;
  const path = svg('path', { d, fill: 'none', stroke: color, 'stroke-width': 15, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sv);
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len}`;
  return { el: sv, draw(t, at, dur = 6 * F) { const p = ez.enter(progress(t, at, at + dur)); path.style.strokeDashoffset = (len * (1 - p)).toFixed(2); sv.style.visibility = t < at ? 'hidden' : 'visible'; } };
}

/* ---------- shared geometry (so the held word sits on the same screen spot across a cut) ---------- */
/** Scene 1 end frame = scene 2 start frame: waterline + the sunk word DEEP. Screen coordinates. */
export function seaGeom(L) {
  const G = grid(L);
  return L.pick({
    landscape: { water: L.safe.y + L.px(250), deepX: G.x(5), deepBase: L.height + L.px(34), deepSize: L.px(400), deepRise: L.px(220) },
    portrait: { water: L.safe.y + L.px(300), deepX: L.safe.x, deepBase: L.safe.y + L.safe.h - L.px(10), deepSize: L.px(330), deepRise: L.px(320) },
  });
}
/** Scene 3 end frame = scene 4 start frame: the three-row ballot. */
export function ballotGeom(L) {
  const G = grid(L);
  return L.pick({
    landscape: { top: L.safe.y + L.px(370), step: L.px(150), numX: G.x(0), boxX: G.x(1), nameX: G.x(2) + L.px(8), size: L.px(104), boxS: L.px(64), yesX: G.x(10) },
    portrait: { top: L.safe.y + L.px(640), step: L.px(190), numX: G.x(0), boxX: G.x(0) + L.px(78), nameX: G.x(1) + L.px(40), size: L.px(92), boxS: L.px(60), yesX: G.x(3) + L.px(30) },
  });
}

/** Small mono kicker: section number + label, always at the same grid spot (series furniture). */
export function kicker(parent, L, n, label) {
  // white + difference = ink on paper, paper on ink: the kicker stays readable when big type passes under it
  const k = T(parent, `Kicker ${n}`, `B-59  ·  ${n} / 4  ·  ${label}`, { fam: 'mono', size: L.px(28), wght: 500, ls: 0.08, upper: true, color: '#FFFFFF' });
  k.style.mixBlendMode = 'difference'; k.style.zIndex = '5';
  k.place(L.safe.x, L.safe.y + L.px(30));
  return k;
}
