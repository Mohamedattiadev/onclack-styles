// COUNT SHEET — shared kit for the isotype-principle style test.
// Rules of the system (see README): one symbol = one fixed thing, more = more symbols (never bigger symbols);
// every row has a counted numeral that always equals the units on screen; empty slots are drawn before the count
// (so a zero or a missing vote is visible); flat opaque colour, no outlines, no gradients, no glow.
import { el, svg, clamp, rand, spring, springs } from '/onclack-styles/engine/lib/anim.js';

export const F = 1 / 30;
export const PAL = {
  board: '#E4E1D6',   // matte card board (cool greige, not cream)
  ink: '#1B1F27',     // blue-black: Soviet boat, people, counts
  steel: '#3A6591',   // US Navy units
  ochre: '#D49A1F',   // time (days, years) + the one nuclear unit
  red: '#C4331F',     // used once: the NO
  ghost: '#B9B4A6',   // empty-slot outlines
  faded: '#A9A498',   // units no longer in focus
  text2: '#4A4C52',
};
export const FONT = "'Schibsted Grotesk', sans-serif";
export const COND = "'Sofia Sans Extra Condensed', sans-serif";

/* ---------- path helpers (our own pictograms, drawn on simple unit grids) ---------- */
const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const RR = (x, y, w, h, r) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
const P = (...pts) => 'M' + pts.map(p => p.join(' ')).join('L') + 'Z';
const C = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`;

// Each pictogram: viewBox w/h + filled path + optional "cut" path (board colour, cut out of the shape)
// + optional stroked limbs (figures). Drawn once, reused by count — that is the point of the system.
export const PICT = {
  sub: { w: 120, h: 40, d: [RR(2, 21, 116, 13, 6.5), RR(52, 9, 22, 14, 3), R(64, 1, 2.6, 9), P([2, 27.5], [-1, 22], [5, 24])].join('') },
  destroyer: { w: 120, h: 40, d: [P([1, 24], [119, 20], [110, 35], [12, 35]), R(30, 16, 44, 9), R(62, 8, 12, 9), P([40, 6], [50, 6], [48, 17], [38, 17]), R(69, 0, 2, 9), R(90, 17, 9, 5), R(98, 18.4, 12, 2)].join('') },
  carrier: { w: 120, h: 40, d: [R(0, 18, 120, 4.5), P([6, 22], [116, 22], [107, 34], [14, 34]), R(82, 7, 11, 11.5), R(86, 0, 2, 8)].join('') },
  charge: { w: 24, h: 30, d: [RR(2, 1, 20, 7.5, 2.5), R(2, 10.8, 20, 8.4), RR(2, 21.5, 20, 7.5, 2.5)].join('') },
  torpedo: { w: 120, h: 20, d: [RR(16, 5.5, 103, 9, 4.5), P([17, 6], [8, 8], [8, 12], [17, 14]), R(5, 3.2, 8, 2.4), R(5, 14.4, 8, 2.4), R(1.5, 6.5, 3, 7)].join('') },
  day: { w: 20, h: 20, d: RR(1, 1, 18, 18, 2.2) },
  year: { w: 20, h: 20, d: RR(1, 1, 18, 18, 1.5) },
  signal: { w: 32, h: 24, d: [R(1, 2, 30, 20)].join(''), cut: [P([3.5, 4], [16, 13.5], [28.5, 4], [28.5, 6], [16, 16], [3.5, 6])].join('') },
  vote: { w: 20, h: 20, d: R(1, 1, 18, 18) },
};

// Three officers, three bodies: same head/cap/scale (the system), different weight and arms (the people).
// peaked naval cap seen from the front: wide flat crown, narrower band, short visor
const head = (dx = 0, dy = 0) => [C(20 + dx, 18 + dy, 6.3), RR(9 + dx, 5.6 + dy, 22, 3.6, 1.8), P([9.6 + dx, 7.6 + dy], [30.4 + dx, 7.6 + dy], [26.8 + dx, 12.8 + dy], [13.2 + dx, 12.8 + dy]), P([13 + dx, 12.2 + dy], [27 + dx, 12.2 + dy], [25.2 + dx, 14.6 + dy], [14.8 + dx, 14.6 + dy]), R(17.6 + dx * 0.5, 23 + dy, 4.8, 3.5)].join('');
export const FIG = {
  // captain: feet planted wide, fists on hips (akimbo) — the loudest silhouette
  akimbo: {
    w: 40, h: 100,
    d: head() + P([9, 26], [31, 26], [28, 58], [12, 58]) + P([12, 57], [19.4, 57], [14.6, 94], [7.6, 94]) + P([20.6, 57], [28, 57], [32.4, 94], [25.4, 94]) + RR(5.4, 93.4, 10, 4, 1.5) + RR(24.6, 93.4, 10, 4, 1.5),
    limbs: [[[10, 28.5], [2.2, 42], [13, 52]], [[30, 28.5], [37.8, 42], [27, 52]]], lw: 5.4,
  },
  // political officer: weight on one leg, a folder held to the chest
  folder: {
    w: 40, h: 100,
    d: head(-0.6, 0) + P([9, 26], [31, 26], [28, 58], [12, 58]) + P([12, 57], [19.4, 57], [19, 94], [12.6, 94]) + P([20.6, 57], [28, 57], [30.4, 75], [28.2, 94], [21.6, 94], [23.4, 76]) + RR(10.4, 93.4, 10, 4, 1.5) + RR(21.2, 93.4, 10, 4, 1.5),
    cut: R(12.6, 33, 14.4, 17.5), // the folder edge: a board-colour gap…
    d2: R(13.8, 34.2, 12, 15), // …and the folder itself
    limbs: [[[30.5, 28.5], [33, 43], [32.4, 57]], [[9.6, 28.5], [6.6, 41], [16, 44]]], lw: 5.2,
  },
  // flotilla chief of staff: feet together, hands held behind the back — the still one
  behind: {
    w: 40, h: 100,
    limbsUnder: true,
    d: head(0.4, 0.8) + P([10, 26.6], [30, 26.6], [27.6, 58], [12.4, 58]) + P([12.4, 57], [19.5, 57], [19.3, 94], [13.2, 94]) + P([20.5, 57], [27.6, 57], [26.8, 94], [20.7, 94]) + RR(11.6, 93.4, 9, 4, 1.5) + RR(19.4, 93.4, 9, 4, 1.5),
    limbs: [[[11, 29], [7.6, 43], [14.5, 54.5]], [[29, 29], [32.4, 43], [25.5, 54.5]]], lw: 5,
  },
};

/** Build a pictogram <svg> of width w (px). mode: 'fill' | 'ghost'. Returns { node, set(color) }. */
export function pict(parent, kind, w, { color = PAL.ink, mode = 'fill', name, board = PAL.board, style = {} } = {}) {
  const def = PICT[kind] ?? FIG[kind];
  const h = w * def.h / def.w;
  const s = svg('svg', { viewBox: `0 0 ${def.w} ${def.h}`, width: w, height: h, overflow: 'visible', 'data-name': name ?? kind }, parent);
  Object.assign(s.style, { position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style });
  const parts = [];
  if (mode === 'ghost') {
    const sw = def.w / w * 2.2; // 2.2 px hairline whatever the size
    parts.push(svg('path', { d: def.d, fill: 'none', stroke: color, 'stroke-width': sw, 'stroke-linejoin': 'round' }, s));
    if (def.cut) parts.push(svg('path', { d: def.cut, fill: 'none', stroke: color, 'stroke-width': sw, 'stroke-linejoin': 'round' }, s));
  } else {
    const limbs = () => (def.limbs ?? []).forEach(pts => parts.push(svg('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: color, 'stroke-width': def.lw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s)));
    if (def.limbsUnder) limbs();
    parts.push(svg('path', { d: def.d, fill: color }, s));
    if (!def.limbsUnder) limbs();
    if (def.cut) svg('path', { d: def.cut, fill: board }, s);
    if (def.d2) parts.push(svg('path', { d: def.d2, fill: color }, s));
  }
  return {
    node: s, w, h,
    set(c) { for (const p of parts) p.getAttribute('fill') === 'none' ? p.setAttribute('stroke', c) : p.setAttribute('fill', c); },
  };
}

/* ---------- motion ---------- */
export const tw = (t, a, b, from, to, e = x => x) => from + (to - from) * e(clamp((t - a) / (b - a)));
export const outCubic = p => 1 - (1 - p) ** 3;
export const inQuad = p => p * p;
export const wordT = (ctx, w, n = 0, fb = 0) => {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = ctx.wordsIn().filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fb;
};

/**
 * The signature "count-in": a unit is laid into its slot in reading order, like a block set into a composing stick.
 * It slides in from the left by `dx` px over a spring, ink appears in 2 frames. Returns { x, o, landed }.
 */
export function laid(t, at, dx) {
  if (t < at) return { x: -dx, o: 0, landed: false };
  const s = spring(t - at, springs.snappy);
  return { x: -dx * (1 - s), o: clamp((t - at) / (2 * F)), landed: t >= at + 3 * F };
}

/** How many units have landed (for the counted numeral): exact, never ahead of the picture. */
export const counted = (t, times) => times.reduce((n, at) => n + (t >= at + 3 * F ? 1 : 0), 0);

/* ---------- the sheet ---------- */
let texN = 0;
/**
 * One chart card. Board + fixed fibre texture + header (chart number, title) + key + footer note.
 * Incoming sheets wipe in left→right (reading direction) with an ink edge, 0.45 s.
 */
export function sheet(root, ctx, { n, title, key = [], note, wipe = true }) {
  const L = ctx.layout;
  const W = L.width, H = L.height, px = L.px;
  const wrap = el('div', { 'data-name': `Chart ${n}`, style: { position: 'absolute', inset: 0, background: PAL.board, overflow: 'hidden' } }, root);
  // fibre texture: fixed per sheet (seeded), never animated
  const id = `iso-tex-${n}-${texN++}`;
  const tex = svg('svg', { width: W, height: H, 'data-name': 'Board fibre' }, wrap);
  Object.assign(tex.style, { position: 'absolute', left: 0, top: 0, opacity: 0.55, mixBlendMode: 'multiply' });
  tex.innerHTML = `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85 0.6" numOctaves="2" seed="${7 + n}"/>
    <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.40  0 0 0 0 0.35  0 0 0 -1.9 1.08"/></filter><rect width="100%" height="100%" filter="url(#${id})"/>`;
  // ink layer: one edge-spread filter for every unit on the sheet (designed once, same everywhere)
  const fid = `iso-ink-${n}-${texN++}`;
  const defs = svg('svg', { width: 0, height: 0 }, wrap);
  defs.style.position = 'absolute';
  defs.innerHTML = `<filter id="${fid}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="${3 + n}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${(1.6 * L.unit).toFixed(2)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  const content = el('div', { 'data-name': 'Chart content', style: { position: 'absolute', inset: 0, transformOrigin: '50% 45%' } }, wrap);
  const ink = el('div', { 'data-name': 'Units layer', style: { position: 'absolute', inset: 0, filter: `url(#${fid})` } }, content);

  // header: thin ink rule across the safe width, chart number left, title, key right
  const S = L.safe;
  const hy = S.y + px(L.pick({ landscape: 6, portrait: 10 }));
  const rule = el('div', { 'data-name': 'Header rule', style: { position: 'absolute', left: S.x + 'px', top: hy + px(L.pick({ landscape: 92, portrait: 132 })) + 'px', width: S.w + 'px', height: Math.max(2, px(3)) + 'px', background: PAL.ink, transformOrigin: '0 50%' } }, content);
  const num = el('div', { 'data-name': 'Chart number', style: { position: 'absolute', left: S.x + 'px', top: hy + 'px', font: `600 ${px(22)}px ${FONT}`, letterSpacing: '0.16em', color: PAL.text2, textTransform: 'uppercase', whiteSpace: 'nowrap' } }, content, `Chart ${n} of 4 · B-59 · 27 Oct 1962`);
  const ttl = el('div', { 'data-name': 'Chart title', style: { position: 'absolute', left: S.x + 'px', top: hy + px(30) + 'px', font: `800 ${px(L.pick({ landscape: 50, portrait: 46 }))}px ${FONT}`, color: PAL.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap', lineHeight: 1.05 } }, content, title);
  // key (legend) — portrait: second header line under the title; landscape: top right
  const keyBox = el('div', { 'data-name': 'Key', style: { position: 'absolute', display: 'flex', alignItems: 'center', columnGap: px(26) + 'px', font: `500 ${px(22)}px ${FONT}`, color: PAL.ink, whiteSpace: 'nowrap' } }, content);
  if (L.portrait) Object.assign(keyBox.style, { left: S.x + 'px', top: hy + px(94) + 'px' });
  else Object.assign(keyBox.style, { right: (W - S.x - S.w) + 'px', top: hy + px(8) + 'px', flexDirection: 'column', alignItems: 'flex-end', rowGap: px(8) + 'px' });
  for (const k of key) {
    const item = el('div', { style: { display: 'flex', alignItems: 'center', columnGap: px(10) + 'px' } }, keyBox);
    const holder = el('div', { style: { position: 'relative', width: px(k.w) + 'px', height: px(k.w) * ((PICT[k.kind] ?? FIG[k.kind]).h / (PICT[k.kind] ?? FIG[k.kind]).w) + 'px' } }, item);
    pict(holder, k.kind, px(k.w), { color: k.color ?? PAL.ink, name: `Key ${k.kind}` });
    el('span', {}, item, `= ${k.label}`);
  }
  let foot = null;
  if (note) {
    foot = el('div', { 'data-name': 'Footer note', style: { position: 'absolute', left: S.x + 'px', width: S.w + 'px', top: S.y + S.h - px(30) + 'px', font: `400 ${px(19)}px ${FONT}`, color: PAL.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip' } }, content, note);
  }
  const edge = el('div', { 'data-name': 'Wipe edge', style: { position: 'absolute', top: 0, height: H + 'px', width: px(10) + 'px', background: PAL.ink, left: 0 } }, root);

  const bodyTop = hy + px(L.pick({ landscape: 92, portrait: 132 })) + px(L.pick({ landscape: 46, portrait: 46 }));
  return {
    wrap, content, ink, bodyTop,
    update(t) {
      // wipe in (reading direction), then a slow camera creep so holds are never frozen
      const p = wipe ? outCubic(clamp(t / 0.45)) : 1;
      wrap.style.clipPath = p < 1 ? `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0)` : 'none';
      edge.style.display = p < 1 && p > 0 ? 'block' : 'none';
      edge.style.transform = `translateX(${(p * W - px(10)).toFixed(1)}px)`;
      // slow push-in that ENDS at 1.0, so nothing ever grows past the safe area
      content.style.transform = `scale(${(1 - 0.014 * (1 - Math.min(1, Math.max(0, t) / ctx.duration))).toFixed(5)})`;
      rule.style.transform = `scaleX(${tw(t, 0.1, 0.55, 0, 1, outCubic).toFixed(4)})`;
      const hdr = tw(t, 0.15, 0.35, 0, 1);
      num.style.opacity = hdr; ttl.style.opacity = hdr; keyBox.style.opacity = tw(t, 0.3, 0.5, 0, 1);
      if (foot) foot.style.opacity = tw(t, 0.5, 0.7, 0, 1);
    },
  };
}

/** Absolutely positioned div helper. */
export function box(parent, name, x, y, style = {}, text) {
  return el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', ...style } }, parent, text);
}

/** Row label: big counted numeral + caption. Returns { set(n) }. */
export function rowLabel(parent, L, name, x, y, { caption, prefix = '', size = 96, capSize = 25, capWidth, color = PAL.ink, inline = false }) {
  const px = L.px;
  const wrap = box(parent, name, x, y, { display: 'flex', flexDirection: inline ? 'row' : 'column', alignItems: inline ? 'baseline' : 'flex-start', columnGap: px(18) + 'px' });
  const num = el('div', { 'data-name': `${name} numeral`, style: { font: `800 ${px(size)}px ${FONT}`, color, lineHeight: 0.86, fontVariantNumeric: 'tabular-nums lining-nums', letterSpacing: '-0.03em', whiteSpace: 'nowrap' } }, wrap, prefix + '0');
  const cap = el('div', { 'data-name': `${name} caption`, style: { font: `500 ${px(capSize)}px ${FONT}`, color: PAL.ink, lineHeight: 1.2, marginTop: inline ? 0 : px(10) + 'px', width: capWidth ? px(capWidth) + 'px' : 'auto' } }, wrap);
  cap.innerHTML = caption;
  return { wrap, num, cap, set(n) { num.textContent = prefix + n; } };
}

export { rand, spring, springs };

/** Mix two #rrggbb colours (p 0..1). */
export function mix(a, b, p) {
  p = clamp(p);
  const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join('');
}
