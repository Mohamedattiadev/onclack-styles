// PERIOD LENS kit — "each story in the graphic language of its own time".
// Constant channel frame (paper, ink, vermillion, thin rules, crop marks) + the era medium inside the plate.
// 1962 era card: civil-defence pamphlet (navy line + yellow tint) → screenprint poster (flat navy + yellow + our vermillion).
// Everything is a pure function of time. Imperfection (paper fibres, ink edge, misregistration) is seeded ONCE.
import { el, svg, clamp, progress, rand } from '/onclack-styles/engine/lib/anim.js';

/* ---------- tokens ---------- */
export const INK = {
  paper: '#F2EBDD',  // channel paper (constant)
  ink: '#1A1714',    // channel ink (constant)
  verm: '#C2462B',   // channel vermillion (constant) — the hero mark only
  navy: '#22395E',   // era ink 1 (1962 card)
  yellow: '#E2AA3C', // era ink 2 (1962 card: civil-defence yellow)
};
export const FONT = {
  serif: "'Newsreader', serif",          // channel: captions
  mono: "'IBM Plex Mono', monospace",    // channel: running head, folio, labels of record
  era: "'Schibsted Grotesk', sans-serif", // era type inside the plate (mid-century gothic feeling)
  poster: "'Sofia Sans Extra Condensed', sans-serif", // era type for the screenprint poster
};
/** Constant misregistration of the yellow plate (design px). Same everywhere, never animated except at a medium shift. */
export const MISREG = [2.6, -1.8];
export const F = 1 / 30;

/* ---------- motion tokens ---------- */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = s => ((ax * s + bx) * s + cx) * s, fy = s => ((ay * s + by) * s + cy) * s;
  const dx = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let s = p;
    for (let i = 0; i < 8; i++) { const e = fx(s) - p, d = dx(s); if (Math.abs(e) < 1e-5 || !d) break; s -= e / d; }
    return fy(clamp(s));
  };
}
export const ez = { enter: bezier(0.16, 1, 0.3, 1), exit: bezier(0.7, 0, 0.84, 0), move: bezier(0.65, 0, 0.35, 1), camera: bezier(0.45, 0, 0.15, 1) };
export const tw = (t, a, b, from, to, e = ez.enter) => from + (to - from) * e(progress(t, a, b));

/* ---------- voice ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Scene-local time of the nth word `w` inside paragraph `para`. */
export function wordT(ctx, para, w, n = 0, fallback = 0) {
  const hits = ctx.words.filter(x => x.para === para && norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fallback;
}

/* ---------- small DOM helpers ---------- */
export function box(parent, name, x, y, w, h, style = {}, text) {
  const s = { position: 'absolute', left: x + 'px', top: y + 'px', ...style };
  if (w != null) s.width = w + 'px';
  if (h != null) s.height = h + 'px';
  return el('div', { 'data-name': name, style: s }, parent, text);
}
export const mono = (size, extra = {}) => ({ fontFamily: FONT.mono, fontWeight: 500, fontSize: size + 'px', letterSpacing: '0.08em', textTransform: 'uppercase', color: INK.ink, lineHeight: 1.2, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', ...extra });
export const eraCaps = (size, weight = 800, extra = {}) => ({ fontFamily: FONT.era, fontWeight: weight, fontSize: size + 'px', letterSpacing: '0.08em', textTransform: 'uppercase', color: INK.navy, lineHeight: 1, whiteSpace: 'nowrap', fontKerning: 'normal', fontVariantNumeric: 'lining-nums', ...extra });

/** Ink-edge filter (seeded turbulence → 1–2 px displacement). One recipe for all era ink. Returns 'url(#id)'. */
export function inkDefs(parent, id, u) {
  const s = svg('svg', { width: 0, height: 0, style: 'position:absolute' }, parent);
  const defs = svg('defs', {}, s);
  const f = svg('filter', { id: `ink-${id}`, x: '-3%', y: '-3%', width: '106%', height: '106%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.85, numOctaves: 2, seed: 11, result: 'n' }, f);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: (1.7 * u).toFixed(2), xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  return `url(#ink-${id})`;
}

/* ---------- paper (world space, seeded once) ---------- */
function paper(root, L, seed) {
  el('div', { 'data-name': 'Paper', style: { position: 'absolute', inset: 0, background: INK.paper } }, root);
  const c = el('canvas', { 'data-name': 'Paper fibres', width: Math.round(L.width / 2), height: Math.round(L.height / 2), style: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 } }, root);
  const g = c.getContext('2d');
  const n = Math.round((c.width * c.height) / 260);
  for (let i = 0; i < n; i++) {
    const x = rand(seed + i * 3.1) * c.width, y = rand(seed + i * 7.7) * c.height;
    const r = rand(seed + i * 1.3);
    if (r < 0.82) { // speck
      g.fillStyle = r < 0.5 ? 'rgba(120,98,70,0.10)' : 'rgba(255,252,244,0.35)';
      g.fillRect(x, y, 1, 1);
    } else { // fibre
      const a = rand(seed + i * 5.9) * Math.PI, len = 3 + rand(seed + i * 9.1) * 9;
      g.strokeStyle = 'rgba(110,90,60,0.08)'; g.lineWidth = 0.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 1, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
  }
}

/** Registration mark (our constant channel mark): circle + cross, one arm longer (points into the plate). */
function regMark(parent, size, color) {
  const s = svg('svg', { 'data-name': 'Channel mark', width: size, height: size, viewBox: '-12 -12 24 24', style: 'display:block;flex:none' }, parent);
  svg('circle', { r: 6.2, fill: 'none', stroke: color, 'stroke-width': 1.6 }, s);
  svg('circle', { r: 2.4, fill: color }, s);
  svg('path', { d: 'M-11 0H9.5M0 -11V11.5', stroke: color, 'stroke-width': 1.4 }, s);
  return s;
}

/** Ink chips (printer's colour bar) — shows which inks the current medium uses. */
function chips(parent, inks, size) {
  const row = el('div', { 'data-name': 'Ink chips', style: { display: 'flex', gap: size * 0.3 + 'px', flex: 'none' } }, parent);
  return inks.map(c => el('div', { style: { width: size + 'px', height: size + 'px', background: c, mixBlendMode: 'multiply' } }, row));
}

export const LENS = {
  pamphlet: { text: '1962 · Civil-defence pamphlet · 2 inks', inks: [INK.navy, INK.yellow] },
  poster: { text: '1962 · Screenprint poster · 3 inks', inks: [INK.navy, INK.yellow, INK.verm] },
};

/**
 * The constant channel frame. Returns { plate (div, clipped), P (plate rect in px), setLens(key, p), update(t) }.
 * opts: { scene (1-4), lens: 'pamphlet'|'poster', fig, caption }
 */
export function frame(root, ctx, opts) {
  const L = ctx.layout, u = L.unit, S = L.safe;
  paper(root, L, 100 + opts.scene * 17);
  const headH = L.px(L.pick({ landscape: 50, portrait: 96 }));
  const capH = L.px(L.pick({ landscape: 70, portrait: 118 }));
  const gap = L.px(L.pick({ landscape: 30, portrait: 30 }));
  const P = { x: S.x, y: S.y + headH + gap, w: S.w, h: S.h - headH - gap - capH - gap };

  // --- running head
  const head = box(root, 'Running head', S.x, S.y, S.w, headH);
  const fs = L.px(L.pick({ landscape: 24, portrait: 26 }));
  const brand = box(head, 'Brand', 0, 0, null, null, { display: 'flex', alignItems: 'center', gap: L.px(12) + 'px' });
  regMark(brand, L.px(30), INK.verm);
  el('span', { style: { ...mono(fs, { fontWeight: 500 }) } }, brand, 'OnClack');
  el('span', { style: { ...mono(fs, { fontWeight: 400, color: '#5E564B' }) } }, brand, '— Period Lens');
  const lensRow = box(head, 'Lens label', 0, 0, S.w, null, L.landscape
    ? { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: L.px(12) + 'px' }
    : { display: 'flex', alignItems: 'center', gap: L.px(12) + 'px', top: L.px(50) + 'px' });
  const lensClip = el('div', { style: { overflow: 'hidden', position: 'relative', height: fs * 1.25 + 'px' } }, lensRow);
  const lensLab = el('div', { 'data-name': 'Lens text', style: { ...mono(fs, { fontWeight: 400 }), position: 'relative' } }, lensClip);
  const chipRow = el('div', { style: { display: 'flex' } }, lensRow);
  if (L.landscape) lensRow.insertBefore(chipRow, lensClip); else lensRow.appendChild(chipRow);
  let chipEls = [];
  const setChips = key => { chipRow.textContent = ''; chipEls = chips(chipRow, LENS[key].inks, fs * 0.7); };
  lensLab.textContent = 'Lens: ' + LENS[opts.lens].text; setChips(opts.lens);
  box(root, 'Head rule', S.x, S.y + headH, S.w, Math.max(2, L.px(2)), { background: INK.ink });

  // --- plate + crop marks
  const plate = box(root, 'Plate', P.x, P.y, P.w, P.h, { overflow: 'hidden' });
  const cm = svg('svg', { 'data-name': 'Crop marks', width: L.width, height: L.height, style: 'position:absolute;left:0;top:0;pointer-events:none' }, root);
  const o = L.px(7), len = L.px(12), sw = Math.max(1.5, L.px(1.5));
  for (const [cx, cy, sx, sy] of [[P.x, P.y, -1, -1], [P.x + P.w, P.y, 1, -1], [P.x, P.y + P.h, -1, 1], [P.x + P.w, P.y + P.h, 1, 1]])
    svg('path', { d: `M${cx + sx * o} ${cy}h${sx * len}M${cx} ${cy + sy * o}v${sy * len}`, stroke: INK.ink, 'stroke-width': sw, fill: 'none' }, cm);

  // --- caption row
  const capY = P.y + P.h + gap;
  box(root, 'Caption rule', S.x, capY, S.w, Math.max(1, L.px(1.2)), { background: INK.ink, opacity: 0.55 });
  const capFs = L.px(L.pick({ landscape: 30, portrait: 32 }));
  const cap = box(root, 'Caption', S.x, capY + L.px(12), S.w - L.px(L.pick({ landscape: 160, portrait: 110 })), null,
    { fontFamily: FONT.serif, fontStyle: 'italic', fontSize: capFs + 'px', lineHeight: 1.22, color: INK.ink, fontKerning: 'normal', textWrap: 'pretty' });
  const figLab = el('div', { 'data-name': 'Fig. number', style: { position: 'absolute', left: 0, top: capFs * 0.2 + 'px', textIndent: 0, fontStyle: 'normal', fontFamily: FONT.mono, fontWeight: 500, fontSize: capFs * 0.78 + 'px', lineHeight: 1, letterSpacing: '0.06em', whiteSpace: 'nowrap' } }, cap, `Fig. ${opts.fig}`);
  cap.appendChild(document.createTextNode(opts.caption));
  cap.style.textIndent = capFs * 3.62 + 'px'; // 6 mono chars at 0.78 em + tracking + gap (measured once, fixed)
  box(root, 'Folio', S.x + S.w - L.px(96), capY + L.px(14), L.px(96), null, { ...mono(L.px(24)), textAlign: 'right' }, `${opts.scene} / 4`);

  // lens swap (used at the medium shift): old label slides up, new comes from below
  let swap = null;
  const setLens = (key, at, dur = 12 * F) => { swap = { key, at, dur, from: lensLab.textContent }; };

  return {
    plate, P, setLens,
    update(t) {
      if (!swap) return;
      const p = progress(t, swap.at, swap.at + swap.dur);
      const on = t >= swap.at + swap.dur * 0.5;
      const want = on ? 'Lens: ' + LENS[swap.key].text : swap.from;
      if (lensLab.textContent !== want) { lensLab.textContent = want; setChips(on ? swap.key : opts.lens); }
      const y = on ? (1 - ez.enter(p * 2 - 1)) * fs * 1.2 : -ez.exit(p * 2) * fs * 1.2;
      lensLab.style.transform = `translateY(${y.toFixed(2)}px)`;
    },
  };
}

/** A full-plate SVG with a 'cam' group for camera moves (transform about a focus point). */
export function plateSvg(plate, P, name) {
  const s = svg('svg', { 'data-name': name, width: P.w, height: P.h, viewBox: `0 0 ${P.w} ${P.h}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, plate);
  const cam = svg('g', { 'data-name': name + ' camera' }, s);
  return { s, cam, setCam: (scale, fx, fy, dx = 0, dy = 0) => cam.setAttribute('transform', `translate(${(fx + dx).toFixed(2)} ${(fy + dy).toFixed(2)}) scale(${scale.toFixed(4)}) translate(${-fx} ${-fy})`) };
}

/** Same camera for HTML layers inside the plate. */
export const camCss = (scale, fx, fy, dx = 0, dy = 0) => `translate(${(fx + dx).toFixed(2)}px, ${(fy + dy).toFixed(2)}px) scale(${scale.toFixed(4)}) translate(${-fx}px, ${-fy}px)`;

/** Seeded ragged squeegee edge as a CSS clip-path polygon revealing from left to right. p = 0..1. */
export function squeegee(p, seed, rag = 1.6) {
  const n = 14, pts = [];
  const x0 = -rag * 2 + p * (100 + rag * 4);
  for (let i = 0; i <= n; i++) pts.push(`${(x0 + (rand(seed + i) - 0.5) * rag * 2).toFixed(2)}% ${(i / n * 100).toFixed(1)}%`);
  return `polygon(0% 0%, ${pts.join(', ')}, 0% 100%)`;
}

/* ---------- era figures (no faces): naval officer pictogram, 100 × 260 box, feet at y = 260 ---------- */
export const OFFICER = {
  cap: 'M23 31 Q50 23 77 31 L72 41 L28 41 Z M29 41 H71 V47 H29 Z M33 47 H67 L63 52 H37 Z',
  head: 'M50 65 m-14 0 a14 16 0 1 0 28 0 a14 16 0 1 0 -28 0',
  body: 'M30 82 Q50 76 70 82 L84 92 Q92 98 91 110 L86 168 L76 168 L74 122 L72 172 L70 258 L54 258 L50 186 L46 258 L30 258 L28 172 L26 122 L24 168 L14 168 L9 110 Q8 98 16 92 Z',
};
