// BROADSHEET kit — "history as it went to press".
// Paper, page chrome, halftone screen, "the press" impact, motion tokens.
// Everything is a pure function of time; all imperfection is seeded ONCE per object, never per frame.
import { el, svg, clamp, progress, rand } from '/onclack-styles/engine/lib/anim.js';

/* ---------- tokens ---------- */
export const INK = {
  paper: '#ECE6D6',   // newsprint
  black: '#161513',   // press black
  spot: '#D9381E',    // spot red (crisis story) — large type and marks only
  grey: '#7C776C',    // halftone grey — never for text
};
export const FONT = {
  head: "'Sofia Sans Extra Condensed', sans-serif", // 800 headlines, numbers
  grot: "'Schibsted Grotesk', sans-serif",          // decks, labels, folio
  body: "'Newsreader', serif",                      // captions, body
};
// One constant misregistration for the spot plate (px at 1080 short side). Same on every sheet.
export const MISREG = [1.3, -0.9];

/* ---------- motion tokens (cubic-bezier like CSS) ---------- */
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
export const ez = {
  enter: bezier(0.16, 1, 0.3, 1),
  exit: bezier(0.7, 0, 0.84, 0),
  move: bezier(0.65, 0, 0.35, 1),
  camera: bezier(0.45, 0, 0.15, 1),
};
export const F = 1 / 30; // one frame
export const tw = (t, a, b, from, to, e = ez.enter) => from + (to - from) * e(progress(t, a, b));

/* ---------- words ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Local scene time of the nth word matching `w` (voice timing). Visuals land 0–3 f before the word. */
export function wordT(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.wordsIn().filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fallback;
}

/* ---------- grid ---------- */
export function grid(L) {
  const cols = L.pick({ landscape: 12, portrait: 4 });
  const gut = L.px(24);
  const cw = (L.safe.w - gut * (cols - 1)) / cols;
  return {
    cols, gut, cw,
    x: i => L.safe.x + i * (cw + gut),                   // left edge of column i (0-based)
    w: n => n * cw + (n - 1) * gut,                      // width of n columns
    base: n => Math.round(n / L.px(8)) * L.px(8),        // snap to 8-px baseline
  };
}

/* ---------- paper (procedural newsprint, seeded, cached per size + page) ---------- */
const paperCache = new Map();
function valueNoise(w, h, cell, seed) {
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = rand(seed * 1000 + i * 1.37);
  return (x, y) => {
    const fx = x / cell, fy = y / cell, ix0 = Math.floor(fx), iy0 = Math.floor(fy), u = fx - ix0, v = fy - iy0;
    const X = i => ((i % gw) + gw) % gw, Y = j => ((j % gh) + gh) % gh;
    const ix = X(ix0), ix1 = X(ix0 + 1), iy = Y(iy0), iy1 = Y(iy0 + 1);
    const s = t => t * t * (3 - 2 * t), a = g[iy * gw + ix], b = g[iy * gw + ix1], c = g[iy1 * gw + ix], d = g[iy1 * gw + ix1];
    return a + (b - a) * s(u) + (c - a) * s(v) + (a - b - c + d) * s(u) * s(v);
  };
}
export function paperCanvas(W, H, page) {
  const key = `${W}x${H}:${page}`;
  if (paperCache.has(key)) return paperCache.get(key);
  // Render at half size (paper fibres are soft anyway), upscale on draw.
  const w = Math.ceil(W / 2), h = Math.ceil(H / 2);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const img = g.createImageData(w, h), d = img.data;
  const big = valueNoise(w, h, 180, 11 + page), mid = valueNoise(w, h, 22, 23 + page), fib = valueNoise(w, h, 3, 37 + page);
  const base = [236, 230, 214];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // mottling (cloudy pulp) + short horizontal fibres (stretched noise) + fine tooth
    const m = (big(x, y) - 0.5) * 7 + (mid(x, y * 1.0) - 0.5) * 4;
    const f = fib(x * 0.35, y * 2.2) - 0.5;
    const tooth = rand(x * 7.1 + y * 131.7 + page) - 0.5;
    const v = m + f * 5 + tooth * 3;
    const i = (y * w + x) * 4;
    d[i] = base[0] + v; d[i + 1] = base[1] + v * 0.97; d[i + 2] = base[2] + v * 0.9; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // Show-through: the reverse page's columns, mirrored, barely visible (newsprint is thin).
  g.save(); g.globalAlpha = 0.016; g.fillStyle = INK.black;
  const colW = w / 6;
  for (let cI = 0; cI < 6; cI++) {
    let y = h * (0.12 + rand(page * 9 + cI) * 0.1);
    while (y < h * 0.95) {
      const lw = colW * (0.62 + rand(cI * 31 + y) * 0.22);
      g.fillRect(w - (cI + 1) * colW + colW * 0.12, y, lw, 2);
      y += 9 + (rand(y * 3.3 + cI) > 0.93 ? 22 : 0);
    }
  }
  g.restore();
  // A few specks of pulp (fixed).
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(22,21,19,${0.08 + rand(i * 5.1 + page) * 0.18})`;
    g.beginPath(); g.arc(rand(i * 2.3 + page) * w, rand(i * 7.9 + page) * h, 0.4 + rand(i * 3.7) * 0.9, 0, Math.PI * 2); g.fill();
  }
  paperCache.set(key, c);
  return c;
}

/* ---------- ink filter (edge bite) — one seeded filter, same everywhere ---------- */
export function inkDefs(root, id) {
  const s = svg('svg', { width: 0, height: 0, style: 'position:absolute;width:0;height:0' }, root);
  const defs = svg('defs', {}, s);
  // Letterpress/ink spread: tiny displacement of the edge, fixed seed.
  const f = svg('filter', { id: `ink-${id}`, x: '-2%', y: '-2%', width: '104%', height: '104%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 2, seed: 7, result: 'n' }, f);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 1.6, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  // Rubber stamp: displacement + ink starvation holes.
  const st = svg('filter', { id: `stamp-${id}`, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.6', numOctaves: 2, seed: 3, result: 'n' }, st);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 2, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, st);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.045 0.11', numOctaves: 3, seed: 19, result: 'm' }, st);
  svg('feColorMatrix', { in: 'm', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -8 5.6', result: 'holes' }, st);
  svg('feComposite', { in: 'd', in2: 'holes', operator: 'in' }, st);
  return { ink: `url(#ink-${id})`, stamp: `url(#stamp-${id})` };
}

/* ---------- halftone screen (Canvas) ---------- */
/**
 * Draw an AM halftone of `img` (ImageData, same size as g.canvas) onto g.
 * cell = screen pitch in px, angle in degrees. Dots grow with darkness; at full tone they merge (ink gain).
 */
export function halftone(g, img, { cell, angle = 45, color = INK.black, ox = 0, oy = 0, gain = 1.06, channel = 0, area = false }) {
  const w = img.width, h = img.height, d = img.data;
  const a = (angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const R = Math.hypot(w, h) / 2 + cell, cx = w / 2, cy = h / 2;
  g.fillStyle = color;
  g.beginPath();
  const kMax = cell * 0.74 * gain;
  for (let v = -R; v <= R; v += cell) {
    for (let u = -R; u <= R; u += cell) {
      const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
      if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
      const sx = Math.min(w - 1, Math.max(0, x | 0)), sy = Math.min(h - 1, Math.max(0, y | 0));
      const dk = 1 - d[(sy * w + sx) * 4 + channel] / 255;
      if (dk < 0.03) continue;
      // area=true: dot AREA follows tone (photos keep their mid-tones); else the poster curve used for flat tints
      const r = area ? cell * Math.sqrt(Math.min(1.3, dk * gain) / Math.PI) : kMax * Math.sqrt(dk);
      g.moveTo(x + ox + r, y + oy);
      g.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    }
  }
  g.fill();
}

/**
 * A halftone plate: a canvas element that re-screens a "tone" picture when its params change.
 * paint(g, w, h, state) draws the continuous-tone source in greys (white = paper).
 * Memoised by a key, so a held frame costs nothing — still a pure function of t.
 */
export function plate(parent, w, h, paint, { name = 'Halftone plate', style = {} } = {}) {
  const dpr = 1;
  const cv = el('canvas', { 'data-name': name, width: Math.round(w * dpr), height: Math.round(h * dpr), style: { position: 'absolute', width: w + 'px', height: h + 'px', ...style } }, parent);
  const g = cv.getContext('2d');
  const src = document.createElement('canvas'); src.width = cv.width; src.height = cv.height;
  const sg = src.getContext('2d', { willReadFrequently: true });
  let lastKey = null;
  return {
    canvas: cv,
    draw(state, screens) {
      const key = JSON.stringify([state, screens]);
      if (key === lastKey) return;
      lastKey = key;
      sg.save(); sg.fillStyle = '#fff'; sg.fillRect(0, 0, src.width, src.height); paint(sg, src.width, src.height, state); sg.restore();
      g.clearRect(0, 0, cv.width, cv.height);
      const img = sg.getImageData(0, 0, src.width, src.height);
      for (const s of screens) halftone(g, img, s);
    },
  };
}

/* ---------- "the press": impact + squash + paper bounce ---------- */
/**
 * Transform for a block that is pressed onto the sheet at time `at` (impact frame).
 * 4 frames of fall (scale 1.07 → 1, shadow lifts off), squash 1.3 % on impact, settle in 3 f.
 */
export function press(t, at, { lift = 0.07, squash = 0.013 } = {}) {
  const fall = 4 * F;
  if (t < at - fall) return { visible: false, opacity: 0, transform: 'scale(1.07)', shadow: 0 };
  if (t < at) {
    const p = (t - (at - fall)) / fall;          // 0 → 1, accelerating
    const s = 1 + lift * (1 - p * p);
    return { visible: true, opacity: Math.min(1, 0.35 + p * 1.3), transform: `scale(${s})`, shadow: 1 - p * p };
  }
  const k = (t - at) / F; // frames since impact
  const sq = k < 1 ? squash : k < 2 ? squash * 0.45 : k < 3 ? squash * 0.12 : 0;
  return { visible: true, opacity: 1, transform: `scale(${1 + sq * 0.6}, ${1 - sq})`, shadow: 0 };
}
export function applyPress(node, st, origin = '50% 100%') {
  node.style.opacity = st.opacity;
  node.style.transformOrigin = origin;
  node.style.transform = st.transform;
}
/** Paper bounce of the whole sheet: +amp px on the impact frame, 40 % next frame, then rest (never alternates). */
export function bounce(t, impacts, amp) {
  let y = 0;
  for (const [at, a = 1] of impacts) {
    const k = Math.floor((t - at) / F + 1e-6);
    if (k === 0) y += amp * a; else if (k === 1) y += amp * a * 0.4; else if (k === 2) y += amp * a * 0.1;
  }
  return y;
}

/* ---------- sheet + chrome ---------- */
/**
 * A newspaper sheet: paper, folio line, Oxford rule (6 px + 2 px). Returns the content layer.
 * slideIn: the sheet is laid over the previous one from the right in 15 f (enter token).
 */
export function sheet(root, ctx, { page, folioRight, slideIn = false }) {
  const L = ctx.layout, W = L.width, H = L.height;
  const s = el('div', { 'data-name': `Sheet ${page}`, style: { position: 'absolute', inset: 0, background: INK.paper, willChange: 'transform' } }, root);
  const pc = paperCanvas(W, H, page);
  const pcv = el('canvas', { 'data-name': 'Newsprint', width: pc.width, height: pc.height, style: { position: 'absolute', inset: 0, width: W + 'px', height: H + 'px' } }, s);
  pcv.getContext('2d').drawImage(pc, 0, 0);
  const content = el('div', { 'data-name': 'Page content', style: { position: 'absolute', inset: 0 } }, s);

  // Folio line + rules (same place on every sheet → pages read as one paper)
  const fs = L.px(L.pick({ landscape: 25, portrait: 27 }));
  const folio = el('div', { 'data-name': 'Folio line', style: {
    position: 'absolute', left: L.safe.x + 'px', top: L.safe.y + 'px', width: L.safe.w + 'px', height: L.px(34) + 'px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    fontFamily: FONT.grot, fontWeight: 600, fontSize: fs + 'px', letterSpacing: '0.12em', color: INK.black, textTransform: 'uppercase',
  } }, content);
  el('span', {}, folio, L.pick({ landscape: 'Saturday, 27 October 1962', portrait: 'Sat. 27 Oct. 1962' }));
  const right = el('span', { style: { fontVariantNumeric: 'tabular-nums lining-nums' } }, folio, folioRight);
  const ruleY = L.safe.y + L.px(44);
  el('div', { 'data-name': 'Heavy rule', style: { position: 'absolute', left: L.safe.x + 'px', top: ruleY + 'px', width: L.safe.w + 'px', height: L.px(6) + 'px', background: INK.black } }, content);
  el('div', { 'data-name': 'Hairline rule', style: { position: 'absolute', left: L.safe.x + 'px', top: ruleY + L.px(10) + 'px', width: L.safe.w + 'px', height: Math.max(2, L.px(2)) + 'px', background: INK.black } }, content);
  const top = ruleY + L.px(12);

  return {
    el: s, content, top, folio, right,
    update(t, impacts = [], amp = L.px(3)) {
      let x = 0;
      if (slideIn) x = W * (1 - ez.enter(progress(t, 0, 15 * F)));
      const y = bounce(t, impacts, amp);
      s.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      s.style.boxShadow = slideIn && x > 0.5 ? `${-L.px(18)}px 0 ${L.px(40)}px rgba(22,21,19,0.22), ${-L.px(2)}px 0 ${L.px(3)}px rgba(22,21,19,0.25)` : 'none';
    },
  };
}

/** Absolutely positioned box helper. */
export const box = (parent, name, x, y, w, h, style = {}, text) =>
  el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h == null ? 'auto' : h + 'px', ...style } }, parent, text);

/** Headline type style. */
export const headStyle = (size, extra = {}) => ({
  fontFamily: FONT.head, fontWeight: 800, fontSize: size + 'px', lineHeight: 0.84, color: INK.black,
  textTransform: 'uppercase', letterSpacing: '-0.005em', whiteSpace: 'nowrap', fontKerning: 'normal',
  fontVariantNumeric: 'lining-nums', fontSynthesis: 'none', ...extra,
});
export const labelStyle = (size, extra = {}) => ({
  fontFamily: FONT.grot, fontWeight: 600, fontSize: size + 'px', lineHeight: 1.15, color: INK.black,
  textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', fontSynthesis: 'none', ...extra,
});
export const captionStyle = (size, extra = {}) => ({
  fontFamily: FONT.body, fontWeight: 400, fontSize: size + 'px', lineHeight: 1.22, color: INK.black,
  fontVariantNumeric: 'oldstyle-nums proportional-nums', fontFeatureSettings: '"kern","liga"', fontSynthesis: 'none', ...extra,
});
