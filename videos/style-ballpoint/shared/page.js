// NOTEBOOK MARGIN — one spiral school-notebook page, filled in blue ballpoint as the story is told.
// Rules of the medium (designed once, kept everywhere):
//   1. The pen only ADDS. Nothing on the page moves or disappears; only the camera moves.
//   2. Important things are "gone over again": 2–4 jittered passes, each later and darker (ballpoint retrace).
//   3. Every ink line leaves a pressed groove (a paper-white highlight under it); hard-pressed lines leave a shadow too.
//   4. Shapes are filled with zig-zag scribble hatch, never with flat colour.
//   5. Blue ballpoint for everything. Red ballpoint exists for ONE thing: the NO.
// Everything is a pure function of global time `tg`. All wobble is seeded per element, never by time.
import { el, svg, clamp, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep, shake } from '/onclack-styles/engine/lib/spring.js';

export const C = {
  paper: '#F5F4EE',
  paperShade: '#E9E7DE',
  rule: 'rgba(92,140,200,0.42)',
  margin: 'rgba(150,120,185,0.62)',  // lilac printed margin (kept far from the red ink)
  print: '#7E9CC6',                   // printed header ink
  ink: '#22318F',                     // blue ballpoint
  red: '#C3172C',                     // red ballpoint — only the NO
  groove: 'rgba(255,255,255,0.95)',
  dent: 'rgba(60,55,40,0.22)',
  desk: '#2B2724',
  wire: '#9A9C9F',
};
const HAND = "'Reenie Beanie', cursive";
const PRINT = "'Schibsted Grotesk', sans-serif";

/* ---------- seeded helpers ---------- */
const r1 = (s) => { let x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const jit = (s, a) => (r1(s) - 0.5) * 2 * a;
const prog = (tg, a, b) => clamp((tg - a) / Math.max(1e-6, b - a));
// pen speed: mostly constant, soft start/stop
const penEase = (p) => 0.55 * p + 0.45 * (0.5 - 0.5 * Math.cos(Math.PI * p));

function smoothPath(pts, closed = false) {
  if (closed) pts = [...pts, pts[0], pts[1]];
  if (pts.length < 3) return 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const n = closed ? pts.length - 2 : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
const polyPath = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');

/** Word start (global s) of the n-th occurrence of a word. */
export function wordAt(ctx, w, n = 0, fb = 0) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = (ctx.words || []).filter((x) => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start : fb;
}

export function buildPage(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, px = L.px, P = L.portrait;
  const ID = 'bp-' + (ctx.props.id || Math.round(ctx.start * 1000));
  const items = [];
  const S = L.safe;
  /** point in region k (0 = upper half of page, 1 = lower half) from safe-area fractions */
  const R = (k, fx, fy) => [S.x + S.w * fx, k * H + S.y + S.h * fy];

  /* ---------- page geometry ---------- */
  const pageX = P ? px(48) : px(80), pageY = 0, pageW = W + px(60) - pageX, pageH = 2 * H + px(70);
  const g = px(P ? 50 : 47);               // rule spacing
  const y0 = px(P ? 210 : 132);             // first rule (under the printed header band)
  const marginX = pageX + px(P ? 104 : 140);
  const snap = (y) => y0 + Math.round((y - y0) / g) * g;   // put handwriting ON the lines

  root.style.background = C.desk;
  const world = el('div', { 'data-name': 'Camera (notebook page)', style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: pageH + 'px', transformOrigin: '0 0' } }, root);
  // desk under the page: worn laminate, one soft lamp falloff
  el('div', { 'data-name': 'Desk', style: { position: 'absolute', left: -2 * W + 'px', top: -2 * H + 'px', width: 5 * W + 'px', height: 4 * H + pageH + 'px',
    background: `radial-gradient(ellipse at 45% 30%, #3a342f 0%, ${C.desk} 45%, #1d1a18 100%)` } }, world);
  // the page
  const ruled = `repeating-linear-gradient(180deg, transparent 0, transparent ${g - px(1.6)}px, ${C.rule} ${g - px(1.6)}px, ${C.rule} ${g}px)`;
  el('div', { 'data-name': 'Notebook page', style: {
    position: 'absolute', left: pageX + 'px', top: pageY + 'px', width: pageW + 'px', height: pageH + 'px',
    backgroundColor: C.paper,
    backgroundImage: `radial-gradient(ellipse at 30% 25%, rgba(255,255,250,0.9) 0%, rgba(255,255,250,0) 60%), linear-gradient(90deg, ${C.paperShade} 0, ${C.paper} ${px(70)}px)`,
        boxShadow: `0 ${px(10)}px ${px(40)}px rgba(0,0,0,0.45), 0 ${px(2)}px ${px(4)}px rgba(0,0,0,0.3)`,
  } }, world);
  // printed lilac margin (double line) + printed header
  const hdr = (txt, x, y, extra = {}) => el('div', { 'data-name': 'Printed header', style: { position: 'absolute', left: x + 'px', top: y + 'px', font: `600 ${px(17)}px ${PRINT}`,
    letterSpacing: '0.18em', color: C.print, whiteSpace: 'nowrap', ...extra } }, world, txt);
  hdr('DATE', marginX + px(26), y0 - g - px(10));
  el('div', { style: { position: 'absolute', left: marginX + px(96) + 'px', top: y0 - g + px(8) + 'px', width: px(P ? 360 : 520) + 'px', height: px(1.4) + 'px', background: C.print } }, world);
  hdr('NO.', W - px(P ? 330 : 300), y0 - g - px(10));
  el('div', { style: { position: 'absolute', left: W - px(P ? 270 : 240) + 'px', top: y0 - g + px(8) + 'px', width: px(110) + 'px', height: px(1.4) + 'px', background: C.print } }, world);

  /* ---------- SVG ink layer ---------- */
  const sv = svg('svg', { width: W, height: pageH, viewBox: `0 0 ${W} ${pageH}`, 'data-name': 'Ink layer', style: 'position:absolute;left:0;top:0;overflow:visible' }, world);
  const defs = svg('defs', {}, sv);
  // spiral binding: punched holes + wire coils over the page edge
  const coils = svg('g', { 'data-name': 'Spiral binding' }, sv);
  for (let y = px(40); y < pageH - px(20); y += px(P ? 46 : 44)) {
    svg('ellipse', { cx: pageX + px(22), cy: y, rx: px(7.5), ry: px(9), fill: '#1f1c1a' }, coils);
    svg('path', { d: `M${pageX + px(22)} ${y - px(2)} C${pageX + px(6)} ${y - px(16)} ${pageX - px(22)} ${y - px(10)} ${pageX - px(20)} ${y + px(10)}`,
      fill: 'none', stroke: '#55575a', 'stroke-width': px(5.5), 'stroke-linecap': 'round' }, coils);
    svg('path', { d: `M${pageX + px(21)} ${y - px(4)} C${pageX + px(6)} ${y - px(17)} ${pageX - px(20)} ${y - px(12)} ${pageX - px(19)} ${y + px(8)}`,
      fill: 'none', stroke: '#cfd1d3', 'stroke-width': px(1.6), 'stroke-linecap': 'round' }, coils);
  }

  // printed rules as SVG lines (crisp at every camera scale)
  const rules = svg('g', { 'data-name': 'Printed rules' }, sv);
  for (let y = y0; y < pageH - px(10); y += g) svg('line', { x1: pageX + px(2), x2: pageX + pageW, y1: y, y2: y, stroke: C.rule, 'stroke-width': px(2) }, rules);
  for (const dx of [0, px(5)]) svg('line', { x1: marginX + dx, x2: marginX + dx, y1: 0, y2: pageH, stroke: C.margin, 'stroke-width': px(1.7), 'data-name': 'Printed margin' }, rules);
  // ghost indents: someone wrote on the page above (only visible in raking light, no ink)
  const ghost = (txt, x, y, size, rot) => {
    const gg = svg('g', { transform: `translate(${x} ${y}) rotate(${rot})`, 'data-name': 'Indent from the page above', opacity: 0.85 }, sv);
    svg('text', { x: px(1.2), y: px(1.2), 'font-family': HAND, 'font-size': size, fill: 'rgba(255,255,255,0.75)' }, gg).textContent = txt;
    svg('text', { x: -px(0.8), y: -px(0.8), 'font-family': HAND, 'font-size': size, fill: 'rgba(90,80,60,0.13)' }, gg).textContent = txt;
    svg('text', { x: 0, y: 0, 'font-family': HAND, 'font-size': size, fill: C.paper }, gg).textContent = txt;
  };

  // ballpoint grain: ink is never perfectly even (static noise, same every frame)
  const flt = svg('filter', { id: ID + '-grain', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 1, seed: 7, result: 'n' }, flt);
  svg('feColorMatrix', { in: 'n', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.75', result: 'm' }, flt);
  svg('feComposite', { in: 'SourceGraphic', in2: 'm', operator: 'in' }, flt);
  const layer = svg('g', { 'data-name': 'Ballpoint', filter: `url(#${ID}-grain)` }, sv);

  /* ---------- drawing primitives ---------- */
  let seedN = 1;
  /** a ballpoint stroke through points; passes>1 = gone over again (each pass later, darker, slightly off). */
  function stroke(pts, o = {}) {
    const { t0 = 0, dur = 0.5, w = px(3.1), col = C.ink, op = 0.88, passes = 1, gap = 0.16, j = px(1.6), closed = false,
      smooth = true, gob = true, press = false, name, parent = layer } = o;
    const seed = o.seed ?? seedN++ * 17;
    const gEl = svg('g', name ? { 'data-name': name } : {}, parent);
    const els = [];
    for (let k = 0; k < passes; k++) {
      const pp = pts.map(([x, y], i) => [x + jit(seed + i * 3 + k * 101, k ? j * 1.4 : j * 0.6), y + jit(seed + i * 5 + k * 131, k ? j * 1.4 : j * 0.6)]);
      const d = smooth ? smoothPath(pp, closed) : polyPath(closed ? [...pp, pp[0]] : pp);
      const ww = w * (k ? 0.82 : 1) * (0.9 + r1(seed + k) * 0.2);
      const base = { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1.02', 'stroke-dashoffset': 1 };
      const sh = press ? svg('path', { ...base, stroke: C.dent, 'stroke-width': ww * 1.6, transform: `translate(${-px(1.1)} ${-px(1.1)})` }, gEl) : null;
      const hi = svg('path', { ...base, stroke: C.groove, 'stroke-width': ww * (press ? 1.9 : 1.25), transform: `translate(${px(press ? 1.6 : 0.9)} ${px(press ? 1.8 : 1.1)})` }, gEl);
      const ink = svg('path', { ...base, stroke: col, 'stroke-width': ww, opacity: op * (k ? 0.8 : 1) }, gEl);
      // the second, thinner track a ballpoint leaves inside a fast line
      const skip = svg('path', { ...base, stroke: col, 'stroke-width': ww * 0.35, opacity: 0.35, transform: `translate(${px(0.7)} ${-px(0.5)})` }, gEl);
      const blob = gob && k === 0 ? svg('circle', { cx: pp[0][0], cy: pp[0][1], r: ww * 0.95, fill: col, opacity: 0 }, gEl) : null;
      els.push({ sh, hi, ink, skip, blob, a: t0 + k * (dur * 0.55 + gap), b: t0 + k * (dur * 0.55 + gap) + dur * (k ? 0.75 : 1) });
    }
    items.push((tg) => {
      for (const e of els) {
        const p = penEase(prog(tg, e.a, e.b));
        const off = String(1 - p);
        e.ink.setAttribute('stroke-dashoffset', off); e.hi.setAttribute('stroke-dashoffset', off); e.skip.setAttribute('stroke-dashoffset', off);
        if (e.sh) e.sh.setAttribute('stroke-dashoffset', off);
        if (e.blob) e.blob.setAttribute('opacity', p > 0 ? 0.8 : 0);
      }
    });
    return gEl;
  }
  /** zig-zag scribble fill clipped to a closed shape */
  function hatch(shape, o = {}) {
    const { t0 = 0, dur = 0.6, ang = -35, sp = px(5), w = px(1.7), col = C.ink, op = 0.78, name } = o;
    const seed = o.seed ?? seedN++ * 29;
    const cid = `${ID}-c${seedN++}`;
    const cp = svg('clipPath', { id: cid }, defs);
    svg('path', { d: smoothPath(shape, true) }, cp);
    const a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const rot = ([x, y]) => [x * ca + y * sa, -x * sa + y * ca];
    const unrot = ([u, v]) => [u * ca - v * sa, u * sa + v * ca];
    const rp = shape.map(rot);
    const umin = Math.min(...rp.map((p) => p[0])) - sp * 2, umax = Math.max(...rp.map((p) => p[0])) + sp * 2;
    const vmin = Math.min(...rp.map((p) => p[1])) - sp, vmax = Math.max(...rp.map((p) => p[1])) + sp;
    const zz = [];
    let i = 0;
    for (let v = vmin; v <= vmax; v += sp, i++) {
      const vv = v + jit(seed + i, sp * 0.25);
      if (i % 2 === 0) { zz.push(unrot([umin + jit(seed + i * 7, sp), vv])); zz.push(unrot([umax + jit(seed + i * 9, sp), vv + sp * 0.5])); }
      else { zz.push(unrot([umax + jit(seed + i * 7, sp), vv])); zz.push(unrot([umin + jit(seed + i * 9, sp), vv + sp * 0.5])); }
    }
    const gEl = svg('g', { 'clip-path': `url(#${cid})`, ...(name ? { 'data-name': name } : {}) }, layer);
    const base = { d: polyPath(zz), fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1.02', 'stroke-dashoffset': 1 };
    const hi = svg('path', { ...base, stroke: C.groove, 'stroke-width': w * 1.2, transform: `translate(${px(0.8)} ${px(1)})` }, gEl);
    const ink = svg('path', { ...base, stroke: col, 'stroke-width': w, opacity: op }, gEl);
    items.push((tg) => { const off = String(1 - prog(tg, t0, t0 + dur)); ink.setAttribute('stroke-dashoffset', off); hi.setAttribute('stroke-dashoffset', off); });
    return gEl;
  }
  /** handwriting: revealed left → right at writing speed; sits on its baseline */
  function write(txt, x, y, o = {}) {
    const { t0 = 0, dur = null, size = px(60), col = C.ink, rot = 0, anchor = 'start', press = false, name, weight = 0 } = o;
    const d = dur ?? Math.max(0.25, txt.length * 0.055);
    const cid = `${ID}-t${seedN++}`;
    const cp = svg('clipPath', { id: cid }, defs);
    const rect = svg('rect', { x: -9999, y: -size * 1.5, width: 0, height: size * 2.4 }, cp);
    const gEl = svg('g', { transform: `translate(${x} ${y}) rotate(${rot})`, 'data-name': name || 'Handwriting: ' + txt }, layer);
    const inner = svg('g', { 'clip-path': `url(#${cid})` }, gEl);
    const t = (fill, dx, dy, extra = {}) => { const e = svg('text', { x: dx, y: dy, 'font-family': HAND, 'font-size': size, 'text-anchor': anchor, fill, ...extra }, inner); e.textContent = txt; return e; };
    if (press) t(C.dent, -px(1.2), -px(1.2), { stroke: C.dent, 'stroke-width': px(2.5) });
    t(C.groove, px(press ? 1.8 : 1), px(press ? 2 : 1.2), { stroke: C.groove, 'stroke-width': press ? px(3) : px(1) });
    const main = t(col, 0, 0, { stroke: col, 'stroke-width': weight || px(0.6), 'stroke-linejoin': 'round', opacity: 0.92 });
    let bb = null;
    items.push((tg) => {
      if (!bb) { const b = main.getBBox(); if (b.width > 0) bb = b; else return; }
      const p = prog(tg, t0, t0 + d);
      rect.setAttribute('x', bb.x - px(10));
      rect.setAttribute('width', p >= 1 ? bb.width + px(40) : p * (bb.width + px(14)));
    });
    return gEl;
  }
  /** dashed line drawn dash by dash (pen lifts between dashes) */
  function dashed(pts, o = {}) {
    const { t0 = 0, dur = 0.5, w = px(2.2), col = C.ink, dash = px(12), gapL = px(10), name } = o;
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const len = Math.hypot(bx - ax, by - ay);
      for (let s = 0; s < len; s += dash + gapL) {
        const e = Math.min(len, s + dash);
        segs.push([[ax + ((bx - ax) * s) / len, ay + ((by - ay) * s) / len], [ax + ((bx - ax) * e) / len, ay + ((by - ay) * e) / len]]);
      }
    }
    const gEl = svg('g', name ? { 'data-name': name } : {}, layer);
    const hi = svg('path', { d: '', stroke: C.groove, 'stroke-width': w * 1.3, 'stroke-linecap': 'round', transform: `translate(${px(0.9)} ${px(1)})` }, gEl);
    const ink = svg('path', { d: '', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', opacity: 0.85 }, gEl);
    let last = -1;
    items.push((tg) => {
      const n = Math.floor(prog(tg, t0, t0 + dur) * segs.length + 1e-6);
      if (n === last) return; last = n;
      const d = segs.slice(0, n).map(([a, b]) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`).join('');
      ink.setAttribute('d', d); hi.setAttribute('d', d);
    });
    return gEl;
  }
  /** scribble burst: fast spiral loops + short flicks (the pen going round and round) */
  function burst(cx, cy, r, o = {}) {
    const seed = o.seed ?? seedN++ * 41;
    const pts = [];
    const turns = 5.5, N = 70;
    for (let i = 0; i <= N; i++) {
      const p = i / N, a = p * turns * Math.PI * 2 + r1(seed) * 6;
      const rr = r * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, p * 1.25))) * (0.8 + r1(seed + i) * 0.35);
      pts.push([cx + Math.cos(a) * rr * 1.2 + p * r * 0.3, cy + Math.sin(a) * rr * 0.9]);
    }
    stroke(pts, { ...o, w: px(2), passes: 1, j: 0, seed, name: o.name || 'Burst scribble' });
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + r1(seed + k * 3);
      const r0 = r * 1.25, r2 = r * (1.6 + r1(seed + k) * 0.5);
      stroke([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.85], [cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.85]],
        { t0: (o.t0 || 0) + o.dur * 0.75 + k * 0.025, dur: 0.08, w: px(2.2), smooth: false, gob: false });
    }
  }
  const box = (x0, y0b, x1, y1, o = {}) => stroke([[x0, y0b], [x1 + px(6), y0b - px(3)], [x1, y1], [x0 - px(4), y1 + px(2)], [x0 + px(10), y0b - px(6)]], { smooth: false, ...o });
  const xf = (pts, ox, oy, u, rot = 0, sx = 1) => {
    const a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y]) => { x *= sx; return [ox + (x * c - y * s) * u, oy + (x * s + y * c) * u]; });
  };

  /* ---------- times (from the voice) ---------- */
  const T = (w, n, fb) => wordAt(ctx, w, n, fb);
  const tOct = T('october', 0, 0.58), tSixty = T('sixty-two', 0, 2.61), tSub = T('submarine', 0, 4.3), tDeep = T('deep', 0, 5.42),
    tSea = T('sea', 0, 5.98), tCuba = T('cuba', 0, 6.52), tAbove = T('above', 0, 7.56), tShips = T('ships', 0, 8.63), tDrop = T('drop', 0, 8.95),
    tPractice = T('practice', 0, 9.28), tDepth = T('depth', 0, 9.79), tCharges = T('charges', 0, 10.05), tMoscow = T('moscow', 0, 10.95),
    tSilent = T('silent', 0, 11.93), tDays = T('days', 0, 12.49), tOn = T('on', 0, 13.67), tTorp = T('torpedo', 0, 14.88), tNuc = T('nuclear', 0, 14.48),
    tFire = T('fire', 0, 15.9), tThree = T('three', 0, 16.51), tOff = T('officers', 0, 16.86), tAgree = T('agree', 0, 17.61), tTwo = T('two', 0, 18.29),
    tYes = T('yes', 0, 18.8), tThird = T('third', 0, 20.25), tVas = T('vasili', 0, 20.61), tArk = T('arkhipov', 0, 21.12), tNo = T('no', 0, 22.03),
    tWorld = T('world', 0, 23.07), tName = T('name', 0, 23.73), tForty = T('forty', 0, 24.13);
  const F = 1 / 30;

  /* ---------- layout per orientation ---------- */
  const Lx = P ? {
    date: [0.14, 0.085], dateSize: px(100), d1962dx: px(500),
    moscow: [0.52, 0.265], moscowSize: px(66), surf: 0.43, ships: [0.27, 0.47, 0.66], shipU: px(18), navy: [0.08, 0.355],
    cuba: [0.86, 0.355], sub: [0.50, 0.71], subU: px(21), deepX: 0.05, burst: [[0.33, 0.585], [0.49, 0.56], [0.63, 0.61]],
    practice: [0.08, 0.90], b59: [0.58, 0.80], torp: [0.06, 0.07, 0.94], torpLab: [0.10, 0.155], rule3: [0.04, 0.29],
    table: 0.64, offX: [0.17, 0.45, 0.74], offU: px(37), boxY: 0.40, labY: 0.685, nameAt: [0.47, 0.785], noAt: [0.24, 0.985], noSize: px(260), later: [0.56, 0.93],
    end: { s: 0.72, cy: 1.52 },
  } : {
    date: [0.10, 0.125], dateSize: px(112), d1962dx: px(560),
    moscow: [0.70, 0.11], moscowSize: px(72), surf: 0.42, ships: [0.26, 0.44, 0.6], shipU: px(24), navy: [0.10, 0.33],
    cuba: [0.86, 0.33], sub: [0.43, 0.76], subU: px(22), deepX: 0.07, burst: [[0.33, 0.62], [0.46, 0.60], [0.58, 0.66]],
    practice: [0.66, 0.56], b59: [0.64, 0.84], torp: [0.09, 0.2, 0.66], torpLab: [0.12, 0.3], rule3: [0.71, 0.13], rule2: true,
    table: 0.85, offX: [0.20, 0.43, 0.72], offU: px(36), boxY: 0.45, labY: 0.93, nameAt: null, noAt: [0.785, 0.75], noSize: px(255), later: [0.37, 0.27],
    end: { s: 0.465, cy: 1.03 },
  };

  /* ================= REGION 0: the sea ================= */
  // ghost indents from last week's homework (no ink)
  ghost('Homework: read p. 212 - 219', R(0, 0.30, 0)[0], snap(R(0, 0, 0.5)[1]) - px(6), px(54), -1.2);
  ghost('x² + 5x = 14', R(0, P ? 0.45 : 0.42, 0)[0], snap(R(1, 0, P ? 0.27 : 0.27)[1]) - px(6), px(58), 0.8);
  ghost('Q4  (b)  see notes', R(0, 0.36, 0)[0], snap(R(0, 0, P ? 0.27 : 0.24)[1]) + px(14), px(50), -0.6);

  // margin question numbers (a student's habit)
  write('1.', marginX - px(62), snap(R(0, 0, Lx.date[1])[1]), { t0: 0.15, size: px(62), name: 'Margin number 1' });

  // date — written into the printed DATE field, too big for it, then 1962 boxed (gone over 3 times)
  const dY = snap(R(0, 0, Lx.date[1])[1]) - px(4), dX = R(0, Lx.date[0], 0)[0];
  write('Sat. Oct. 27,', dX, dY, { t0: tOct - 2 * F, dur: tSixty - tOct - 0.1, size: Lx.dateSize, name: 'Date (handwritten)', rot: -0.8 });
  const yX = P ? dX + px(20) : dX + Lx.d1962dx, yY = P ? dY + g * 3 : dY - px(3), ySz = Lx.dateSize * (P ? 1.7 : 1.08);
  write('1962', yX, yY, { t0: tSixty - 2 * F, dur: 0.55, size: ySz, name: 'Year 1962', rot: -1.5, weight: px(1.4) });
  const bx0 = yX - px(16), bx1 = bx0 + ySz * 1.82;
  box(bx0, yY - ySz * (P ? 0.64 : 0.74), bx1, yY + px(16), { t0: tSixty + 0.45, dur: 0.42, passes: 3, gap: 0.05, name: 'Box around 1962 (retraced)' });

  // the sea surface: one printed rule, traced over in ink, with little wave doodles
  const sY = snap(R(0, 0, Lx.surf)[1]);
  const sx0 = R(0, 0.0, 0)[0] + px(40), sx1 = R(0, 1.0, 0)[0];
  const surf = []; for (let i = 0; i <= 24; i++) surf.push([sx0 + ((sx1 - sx0) * i) / 24, sY + Math.sin(i * 1.7) * px(2)]);
  stroke(surf, { t0: tSub - 0.3, dur: 0.6, w: px(2.8), passes: 2, gap: 0.0, name: 'Sea surface (traced rule)' });
  for (let i = 0; i < (P ? 5 : 7); i++) {
    const wx = sx0 + px(60) + i * (sx1 - sx0 - px(120)) / (P ? 4.6 : 6.4) + jit(i * 11, px(20));
    const wv = []; for (let k = 0; k <= 8; k++) wv.push([wx + k * px(8), sY + px(18) + Math.sin(k * 1.6) * px(5)]);
    stroke(wv, { t0: tSea - 2 * F + i * 0.06, dur: 0.18, w: px(1.8), gob: false, name: 'Wave doodle' });
  }

  // the submarine (Foxtrot class, side view) — outline, then dense cross-hatch: darkest shape in the upper half
  const [subX, subYf] = R(0, Lx.sub[0], Lx.sub[1]);
  const subY = snap(subYf);
  const hull = [[-10, 0.2], [-8, -1.0], [-4, -1.45], [4, -1.45], [8, -1.1], [10.2, -0.1], [9.2, 1.0], [4, 1.4], [-4, 1.4], [-8, 0.95]];
  const sail = [[1, -1.4], [1.35, -3.1], [4.1, -3.15], [4.7, -2.6], [4.5, -1.4]];
  const rudder = [[-9.6, 0.1], [-10.9, -0.9], [-11.1, 1.0]];
  const u = Lx.subU;
  stroke(xf(hull, subX, subY, u), { t0: tSub - 0.25, dur: 0.7, w: px(3), closed: true, passes: 2, gap: 0.02, name: 'Submarine hull' });
  stroke(xf(sail, subX, subY, u), { t0: tSub + 0.3, dur: 0.35, w: px(2.8), name: 'Submarine sail' });
  stroke(xf(rudder, subX, subY, u), { t0: tSub + 0.55, dur: 0.2, w: px(2.4), closed: true, smooth: false, name: 'Rudder' });
  stroke(xf([[3.4, -3.15], [3.4, -4.0], [3.9, -4.0]], subX, subY, u), { t0: tSub + 0.62, dur: 0.15, w: px(2.2), smooth: false, name: 'Periscope' });
  hatch(xf(hull, subX, subY, u), { t0: tSub + 0.45, dur: 0.75, ang: -28, sp: px(5.5), name: 'Hull hatch' });
  hatch(xf(hull, subX, subY, u), { t0: tSub + 0.9, dur: 0.6, ang: 38, sp: px(7), op: 0.6, name: 'Hull cross-hatch' });
  hatch(xf(sail, subX, subY, u), { t0: tSub + 0.8, dur: 0.3, ang: -28, sp: px(4.5), name: 'Sail hatch' });
  write('B-59', R(0, Lx.b59[0], 0)[0], snap(R(0, 0, Lx.b59[1])[1]), { t0: tSub + 1.1, size: px(62), name: 'Label B-59', weight: px(1) });
  write('(Foxtrot class, diesel)', R(0, Lx.b59[0], 0)[0], snap(R(0, 0, Lx.b59[1])[1]) + g, { t0: tSub + 1.4, dur: 0.6, size: px(44), name: 'Label class' });
  const b59 = R(0, Lx.b59[0], Lx.b59[1]);
  stroke([[b59[0] - px(10), snap(b59[1]) - px(26)], [subX + u * 7, subY + u * 0.4]], { t0: tSub + 1.3, dur: 0.18, w: px(2), smooth: false, name: 'Arrow to boat' });

  // "deep": a depth arrow from the surface down to the boat, with tick marks on every rule
  const dXp = R(0, Lx.deepX, 0)[0] + px(40);
  stroke([[dXp, sY + px(10)], [dXp + px(2), subY]], { t0: tDeep - 3 * F, dur: 0.3, w: px(2.4), name: 'Depth arrow' });
  stroke([[dXp - px(12), subY - px(16)], [dXp + px(2), subY], [dXp + px(15), subY - px(15)]], { t0: tDeep + 0.27, dur: 0.12, smooth: false, gob: false });
  for (let y = sY + g, k = 0; y < subY - px(10); y += g, k++) stroke([[dXp - px(9), y], [dXp + px(9), y]], { t0: tDeep + 0.05 + k * 0.04, dur: 0.05, w: px(1.8), smooth: false, gob: false });
  write('deep', dXp + px(18), snap((sY + subY) / 2), { t0: tDeep, size: px(52), name: 'Note deep', rot: -4 });

  // Cuba: a doodled island on the surface line + label
  const [cbX] = R(0, Lx.cuba[0], 0);
  const isl = [[-1, 0], [-0.6, -0.5], [0.1, -0.7], [0.5, -0.4], [1.2, -0.55], [1.6, 0]];
  stroke(xf(isl, cbX, sY - px(2), px(P ? 46 : 52)), { t0: tCuba - 0.3, dur: 0.35, w: px(2.6), name: 'Cuba island doodle' });
  hatch(xf([...isl, [1.6, 0.05], [-1, 0.05]], cbX, sY - px(2), px(P ? 46 : 52)), { t0: tCuba + 0.05, dur: 0.35, ang: 60, sp: px(5), name: 'Island hatch' });
  write('CUBA', cbX - px(30), snap(R(0, 0, Lx.cuba[1])[1]), { t0: tCuba - 2 * F, dur: 0.4, size: px(58), name: 'Label Cuba', weight: px(1) });

  /* ---- scene 2 on the same patch of paper: ships, charges, Moscow ---- */
  const ship = [[-3, 0], [3.5, -0.45], [2.7, 0.75], [-2.6, 0.75]];
  const sup = [[-1.3, 0], [-1.3, -0.9], [0.5, -0.9], [0.5, -0.5], [1.4, -0.5], [1.4, 0.05]];
  Lx.ships.forEach((fx, i) => {
    const [x] = R(0, fx, 0), su = Lx.shipU * (1 - i * 0.06), t = tAbove + 0.05 + i * 0.33;
    const flip = i === 1 ? -1 : 1; // the middle one steams the other way
    stroke(xf(ship, x, sY - px(4), su, 0, flip), { t0: t, dur: 0.3, w: px(2.6), closed: true, smooth: false, name: `US ship ${i + 1}` });
    stroke(xf(sup, x, sY - px(4), su, 0, flip), { t0: t + 0.2, dur: 0.25, w: px(2.2), smooth: false, gob: false });
    stroke(xf([[0, -0.9], [0, -2.3], [-0.5, -1.8], [0.5, -1.8]], x, sY - px(4), su, 0, flip), { t0: t + 0.35, dur: 0.15, w: px(2), smooth: false, gob: false });
    hatch(xf(ship, x, sY - px(4), su, 0, flip), { t0: t + 0.3, dur: 0.3, ang: 70, sp: px(4.5) });
  });
  write('US Navy', R(0, Lx.navy[0], 0)[0], snap(R(0, 0, Lx.navy[1])[1]), { t0: tShips - 2 * F, dur: 0.45, size: px(56), name: 'Label US Navy' });

  // charges: a can at each stern, a dashed fall line (pen lifting), a scribble burst near the boat
  const hits = [tDepth - 0.05, tCharges + 0.12, tCharges + 0.55];
  Lx.burst.forEach(([fx, fy], i) => {
    const [x0] = R(0, Lx.ships[i], 0), su = Lx.shipU, flip = i === 1 ? -1 : 1;
    const stern = [x0 - flip * su * 2.6, sY + px(6)];
    const [bx, byf] = R(0, fx, fy);
    const t = tDrop - 2 * F + i * 0.22;
    stroke([[stern[0] - px(5), stern[1]], [stern[0] + px(5), stern[1]], [stern[0] + px(5), stern[1] + px(12)], [stern[0] - px(5), stern[1] + px(12)]], { t0: t, dur: 0.12, closed: true, smooth: false, w: px(2.2), gob: false, name: 'Depth charge' });
    const mid = [(stern[0] + bx) / 2 + flip * px(14), (stern[1] + byf) / 2];
    dashed([[stern[0], stern[1] + px(16)], mid, [bx, byf - px(26)]], { t0: t + 0.12, dur: hits[i] - t - 0.12, name: 'Charge fall line' });
    burst(bx, byf, px(P ? 22 : 26), { t0: hits[i], dur: 0.28, name: `Charge burst ${i + 1}` });
  });
  write('practice charges', R(0, Lx.practice[0], 0)[0], snap(R(0, 0, Lx.practice[1])[1]), { t0: tPractice - 2 * F, dur: 0.6, size: px(54), name: 'Note practice charges' });
  write('(signals: "come up")', R(0, Lx.practice[0], 0)[0] + px(10), snap(R(0, 0, Lx.practice[1])[1]) + g, { t0: tCharges + 0.3, dur: 0.6, size: px(44), name: 'Note signals' });

  // Moscow: boxed (gone over), a dashed line toward the boat that just stops, and a tally of days
  const [mX, mYf] = R(0, Lx.moscow[0], Lx.moscow[1]);
  const mY = snap(mYf);
  write('MOSCOW', mX, mY, { t0: tMoscow - 2 * F, dur: 0.4, size: Lx.moscowSize, name: 'Moscow', weight: px(1.2) });
  const mW = Lx.moscowSize * 3.35;
  box(mX - px(14), mY - Lx.moscowSize * 0.72, mX + mW, mY + px(14), { t0: tMoscow + 0.35, dur: 0.35, passes: 2, gap: 0.02, name: 'Box around Moscow' });
  const lineEnd = P ? [mX - px(70), mY + g * 2.2] : [mX - px(150), mY + g * 2.4];
  dashed([[mX - px(10), mY + px(20)], lineEnd], { t0: tMoscow + 0.6, dur: 0.4, name: 'Radio line (stops)' });
  write('? ?', lineEnd[0] - px(56), snap(lineEnd[1] + g * 0.6), { t0: tSilent - 2 * F, dur: 0.25, size: px(58), name: 'Question marks' });
  write('days:', mX, mY + g * 1.15, { t0: tSilent + 0.1, dur: 0.3, size: px(50), name: 'Days tally label' });
  for (let k = 0; k < 6; k++) {
    const tx = mX + px(108) + (k < 5 ? k * px(15) : px(-4)), ty = mY + g * 1.15;
    const pts = k < 5 ? [[tx, ty - px(36)], [tx + px(2), ty + px(2)]] : [[mX + px(96), ty - px(26)], [mX + px(184), ty - px(8)]];
    stroke(pts, { t0: tSilent + 0.35 + k * 0.1, dur: 0.07, w: px(2.4), smooth: false, gob: false, name: 'Tally mark' });
  }
  [[px(212), 0], [px(227), 1]].forEach(([dx], k) => stroke([[mX + dx, mY + g * 1.15 - px(36)], [mX + dx + px(2), mY + g * 1.15 + px(2)]], { t0: tDays + 0.1 + k * 0.1, dur: 0.07, w: px(2.4), smooth: false, gob: false }));

  /* ================= REGION 1: the vote ================= */
  write('2.', marginX - px(62), snap(R(1, 0, 0.04)[1]), { t0: tOn - 0.3, size: px(62), name: 'Margin number 2' });

  // the torpedo: long body, gone over twice, hatched hard
  const [tx0, tyf] = R(1, Lx.torp[0], Lx.torp[1]);
  const tLen = S.w * (Lx.torp[2] - Lx.torp[0]);
  const ty = snap(tyf) - g / 2, tu = tLen / 20;
  const torp = [[0.6, -0.5], [1.4, -0.9], [16.3, -0.9], [18.5, -0.65], [19.6, 0], [18.5, 0.65], [16.3, 0.9], [1.4, 0.9], [0.6, 0.5]];
  stroke(xf(torp, tx0, ty, tu), { t0: tOn, dur: 0.75, w: px(3), closed: true, passes: 2, gap: 0.03, name: 'Torpedo body' });
  stroke(xf([[1.2, -0.85], [-0.5, -1.9], [0.3, 0], [-0.5, 1.9], [1.2, 0.85]], tx0, ty, tu), { t0: tOn + 0.55, dur: 0.3, w: px(2.6), smooth: false, name: 'Torpedo fins' });
  stroke(xf([[15.6, -0.9], [15.6, 0.9]], tx0, ty, tu), { t0: tOn + 0.7, dur: 0.1, w: px(2.2), smooth: false, gob: false });
  hatch(xf(torp, tx0, ty, tu), { t0: tNuc - 0.1, dur: 0.75, ang: -30, sp: px(5), name: 'Torpedo hatch' });
  hatch(xf([[15.6, -0.9], [16.3, -0.9], [18.5, -0.65], [19.6, 0], [18.5, 0.65], [16.3, 0.9], [15.6, 0.9]], tx0, ty, tu), { t0: tTorp, dur: 0.3, ang: 45, sp: px(4), op: 0.8, name: 'Warhead cross-hatch' });
  write('nuclear torpedo', R(1, Lx.torpLab[0], 0)[0], snap(R(1, 0, Lx.torpLab[1])[1]), { t0: tNuc - 2 * F, dur: 0.7, size: px(66), name: 'Label nuclear torpedo', weight: px(1) });
  write('(one on board)', R(1, Lx.torpLab[0], 0)[0] + px(8), snap(R(1, 0, Lx.torpLab[1])[1]) + g, { t0: tTorp + 0.3, dur: 0.5, size: px(46), name: 'Label one on board' });

  // the rule: all 3 must agree
  const [rX, rYf] = R(1, Lx.rule3[0], Lx.rule3[1]);
  write('to fire: all', rX, snap(rYf), { t0: tFire - 2 * F, dur: 0.5, size: px(64), name: 'Rule text' });
  write('3', rX + px(255), snap(rYf), { t0: tThree - 2 * F, dur: 0.12, size: px(84), name: 'Rule 3', weight: px(1.6) });
  const c3 = [rX + px(269), snap(rYf) - px(24)], c3r = px(36);
  const circ = []; for (let i = 0; i <= 26; i++) { const a = -2.2 + (i / 24) * Math.PI * 2; circ.push([c3[0] + Math.cos(a) * c3r * 1.1, c3[1] + Math.sin(a) * c3r]); }
  stroke(circ, { t0: tThree + 0.15, dur: 0.3, passes: 2, gap: 0.02, w: px(2.4), name: 'Circle around 3' });
  write('must agree', Lx.rule2 ? rX + px(40) : rX + px(330), snap(rYf) + (Lx.rule2 ? g * 1.3 : 0), { t0: tOff + 0.15, dur: 0.6, size: px(64), name: 'Rule text 2' });
  stroke(Lx.rule2 ? [[rX + px(30), snap(rYf) + g * 1.3 + px(12)], [rX + px(340), snap(rYf) + g * 1.3 + px(8)]] : [[rX, snap(rYf) + px(12)], [rX + px(620), snap(rYf) + px(8)]], { t0: tAgree + 0.1, dur: 0.3, w: px(2.4), name: 'Underline rule' });

  // the table: a printed rule traced over (it doubles as the table edge)
  const tbY = snap(R(1, 0, Lx.table)[1]);
  stroke([[R(1, 0.03, 0)[0], tbY], [R(1, 0.97, 0)[0], tbY + px(2)]], { t0: tThree - 0.2, dur: 0.45, w: px(2.8), passes: 2, gap: 0, name: 'Table edge (traced rule)' });

  // three officers — busts, no faces (a hatched head), three different postures, no raised arms
  const torso = [[-2.4, 0], [-2.3, -2.4], [-1.9, -3.5], [-1.0, -4.0], [-0.45, -4.25], [0.45, -4.25], [1.0, -4.0], [1.9, -3.5], [2.3, -2.4], [2.4, 0]];
  const head = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; head.push([Math.cos(a) * 0.85, -5.25 + Math.sin(a) * 1.0]); }
  const cap = [[-1.15, -5.7], [-1.3, -6.25], [0, -6.6], [1.3, -6.25], [1.15, -5.7]];
  const band = [[-1.05, -5.7], [1.05, -5.7], [1.0, -5.45], [-1.0, -5.45]];
  const lapel = [[-0.45, -4.25], [0, -3.1], [0.45, -4.25]];
  const officers = [
    { rot: 6, lean: 0.3, hx: 0.35, hy: 0.35, extra: 'arms', t: tOff - 0.1, name: 'Officer 1 (leans in, forearms on table)' },
    { rot: -3, lean: 0, hx: -0.25, hy: 0, extra: 'fold', t: tOff + 0.25, name: 'Officer 2 (arms folded)' },
    { rot: 0, lean: 0, extra: 'hands', t: tOff + 0.6, name: 'Officer 3 (still, hands flat)' },
  ];
  const ou = Lx.offU;
  officers.forEach((o, i) => {
    const [x] = R(1, Lx.offX[i], 0), bY = tbY - px(3), sc = i === 2 ? 1.04 : 1;
    const T2 = (pts) => xf(pts.map(([a, b]) => [a + o.lean * (b / -4) * 2 + (b < -4.3 ? (o.hx || 0) : 0), b + (b < -4.3 ? (o.hy || 0) : 0)]), x, bY, ou * sc, o.rot);
    stroke(T2(torso), { t0: o.t, dur: 0.45, w: px(2.8), passes: 2, gap: 0.02, name: o.name });
    stroke(T2(lapel), { t0: o.t + 0.35, dur: 0.15, w: px(2), smooth: false, gob: false });
    hatch(T2(torso), { t0: o.t + 0.35, dur: 0.55, ang: i === 1 ? 40 : -35, sp: px(6.5), op: 0.66 });
    stroke(T2(head), { t0: o.t + 0.2, dur: 0.25, w: px(2.6), closed: true });
    hatch(T2(head), { t0: o.t + 0.4, dur: 0.3, ang: 20, sp: px(5), op: 0.5 });
    stroke(T2(cap), { t0: o.t + 0.3, dur: 0.2, w: px(2.6), closed: true, smooth: false });
    hatch(T2(cap), { t0: o.t + 0.45, dur: 0.25, ang: -60, sp: px(3.6), op: 0.9 });
    stroke(T2(band), { t0: o.t + 0.45, dur: 0.15, w: px(2.2), closed: true, smooth: false, gob: false });
    stroke(T2([[-1.9, -3.5], [-1.0, -3.85]]), { t0: o.t + 0.5, dur: 0.06, w: px(4), smooth: false, gob: false });
    stroke(T2([[1.0, -3.85], [1.9, -3.5]]), { t0: o.t + 0.55, dur: 0.06, w: px(4), smooth: false, gob: false });
    if (o.extra === 'arms') { const arm = [[-2.3, -0.1], [-2.2, -0.75], [1.4, -0.85], [1.9, -0.5], [1.5, -0.1]]; stroke(T2(arm), { t0: o.t + 0.6, dur: 0.3, w: px(2.6), closed: true }); hatch(T2(arm), { t0: o.t + 0.8, dur: 0.2, ang: 80, sp: px(4.5) }); }
    if (o.extra === 'fold') { const arm = [[-1.95, -1.6], [-1.6, -2.3], [1.7, -2.5], [2.05, -1.8], [1.6, -1.4], [-1.5, -1.25]]; stroke(T2(arm), { t0: o.t + 0.6, dur: 0.3, w: px(2.6), closed: true }); hatch(T2(arm), { t0: o.t + 0.8, dur: 0.2, ang: 80, sp: px(4) }); }
    if (o.extra === 'hands') for (const hx of [-1.6, 1.6]) { const hand = []; for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; hand.push([hx + Math.cos(a) * 0.55, -0.2 + Math.sin(a) * 0.22]); } stroke(T2(hand), { t0: o.t + 0.6, dur: 0.15, w: px(2.4), closed: true, gob: false, name: 'Hand on table' }); }
  });
  // name labels under the table (hedged roles)
  const names = [['Savitsky', 'captain'], ['Maslennikov', 'political officer']];
  names.forEach(([n, r], i) => {
    const [x] = R(1, Lx.offX[i], 0);
    write(n, x, snap(R(1, 0, Lx.labY)[1]), { t0: tAgree + 0.1 + i * 0.25, dur: 0.5, size: px(P ? 44 : 50), anchor: 'middle', name: 'Name ' + n });
    write(r, x, snap(R(1, 0, Lx.labY)[1]) + g * (P ? 0.75 : 0.8), { t0: tAgree + 0.35 + i * 0.25, dur: 0.5, size: px(P ? 36 : 40), anchor: 'middle', name: 'Role ' + r });
  });
  // vote boxes above each head: "yes [ ]  no [ ]" — the passed-note checkbox
  const voteBox = (i, t, tickYesAt, name) => {
    const [x] = R(1, Lx.offX[i], 0), y = snap(R(1, 0, Lx.boxY)[1]);
    const s = P ? 0.86 : 1;
    write('yes', x - px(118) * s, y, { t0: t, dur: 0.2, size: px(50) * s, name: name + ' yes' });
    box(x - px(46) * s, y - px(34) * s, x - px(12) * s, y + px(2), { t0: t + 0.15, dur: 0.15, w: px(2.2), gob: false });
    write('no', x + px(14) * s, y, { t0: t + 0.25, dur: 0.15, size: px(50) * s, name: name + ' no' });
    box(x + px(62) * s, y - px(34) * s, x + px(96) * s, y + px(2), { t0: t + 0.35, dur: 0.15, w: px(2.2), gob: false });
    return { yes: [x - px(29) * s, y - px(16) * s], no: [x + px(79) * s, y - px(16) * s] };
  };
  const tick = (c, t, col, w = px(3), name = 'Tick', press = false, size = 1) =>
    stroke([[c[0] - px(12) * size, c[1] - px(2) * size], [c[0] - px(2) * size, c[1] + px(12) * size], [c[0] + px(22) * size, c[1] - px(26) * size]], { t0: t, dur: 0.16, w, col, smooth: false, press, name });
  const vb1 = voteBox(0, tAgree - 0.35, 0, 'Vote box 1'), vb2 = voteBox(1, tAgree - 0.1, 0, 'Vote box 2');
  tick(vb1.yes, T('say', 0, 18.55) - 2 * F, C.ink, px(3.2), 'Tick YES (officer 1)');
  tick(vb2.yes, tYes - 2 * F, C.ink, px(3.2), 'Tick YES (officer 2)');
  write('2 of 3', R(1, Lx.offX[1], 0)[0] + px(P ? 30 : 150), snap(R(1, 0, Lx.boxY)[1]) - (P ? g * 1.2 : 0), { t0: tYes + 0.35, dur: 0.4, size: px(52), rot: -4, name: 'Note 2 of 3' });

  /* ---- scene 4: the third box, the red NO, the name ---- */
  const vb3 = voteBox(2, tThird - 0.15, 0, 'Vote box 3');
  const [o3x] = R(1, Lx.offX[2], 0);
  const nmA = Lx.nameAt ? R(1, Lx.nameAt[0], Lx.nameAt[1]) : [o3x, R(1, 0, Lx.labY)[1]];
  if (Lx.nameAt) stroke([[nmA[0] + px(150), snap(nmA[1]) - px(60)], [o3x - px(10), snap(R(1, 0, Lx.labY)[1]) - px(10)]], { t0: tVas - 0.25, dur: 0.2, w: px(2.2), name: 'Arrow name to officer 3' });
  write('Vasili Arkhipov', nmA[0], snap(nmA[1]), { t0: tVas - 2 * F, dur: tArk + 0.5 - tVas, size: px(P ? 72 : 60), anchor: 'middle', name: 'Name Vasili Arkhipov', weight: px(1.1) });
  write('flotilla chief of staff', nmA[0], snap(nmA[1]) + g * (P ? 0.9 : 0.85), { t0: tArk + 0.5, dur: 0.6, size: px(P ? 36 : 40), anchor: 'middle', name: 'Role Arkhipov' });
  // RED: the tick in NO, pressed hard (groove + shadow), then "no." written big and underlined twice
  tick(vb3.no, tNo - 3 * F, C.red, px(4), 'RED tick NO', true, 1.25);
  const [nX, nYf] = R(1, Lx.noAt[0], Lx.noAt[1]);
  const nY = snap(nYf);
  write('no.', nX, nY, { t0: tNo + 0.08, dur: 0.32, size: Lx.noSize, col: C.red, press: true, weight: px(3.2), name: 'RED NO (pressed hard)', rot: -3 });
  stroke([[nX - px(10), nY + px(18)], [nX + Lx.noSize * 0.95, nY + px(8)]], { t0: tNo + 0.42, dur: 0.18, w: px(4.2), col: C.red, passes: 2, gap: 0, press: true, name: 'RED underline 1' });
  stroke([[nX + px(4), nY + px(36)], [nX + Lx.noSize * 0.88, nY + px(28)]], { t0: tNo + 0.62, dur: 0.16, w: px(3.6), col: C.red, press: true, name: 'RED underline 2' });
  // the name, gone over: a box around Arkhipov on "name"
  const nmW = px(P ? 450 : 380), nmY = snap(nmA[1]);
  box(nmA[0] - nmW / 2 - px(10), nmY - px(P ? 60 : 54), nmA[0] + nmW / 2 + px(10), nmY + px(16), { t0: tName - 3 * F, dur: 0.4, passes: 3, gap: 0.04, name: 'Box around the name (retraced)' });
  const [lX, lYf] = R(1, Lx.later[0], Lx.later[1]);
  write('known only in 2002', lX, snap(lYf), { t0: tForty - 2 * F, dur: 0.7, size: px(56), name: 'Note 2002' });
  write('(40 yrs later, Havana)', lX + px(10), snap(lYf) + g * 0.9, { t0: tForty + 0.6, dur: 0.6, size: px(42), name: 'Note Havana' });

  /* ---------- camera ---------- */
  const regC = (k) => [W / 2, k * H + H / 2];
  const burstsT = hits;
  function camera(tg) {
    let [cx, cy] = regC(0), s = 1 + 0.004 * tg;              // slow creep while writing
    // opening: tight on the date being written, then the eye pulls back to the page as the boat is drawn
    const pi = 1 - smootherstep(prog(tg, tSub - 0.75, tSub + 0.45));
    if (pi > 0) {
      const dcx = dX + (P ? px(330) : px(400)), dcy = P ? H / (2 * 1.15) + px(6) : dY - Lx.dateSize * 0.25 + px(150);
      const sIn = P ? 1.15 : 1.75;
      cx = cx + (dcx - cx) * pi; cy = cy + (dcy - cy) * pi; s = s + (sIn * (1 + 0.02 * tg) - s) * pi;
    }
    // scene 2: a small push toward the sea action
    const p2 = smootherstep(prog(tg, tAbove - 0.5, tAbove + 0.4));
    s += p2 * 0.03; cy += p2 * px(P ? 40 : 12);
    // eye moves down the page to the lower half
    const pd = smootherstep(prog(tg, tOn - 0.55, tOn + 0.15));
    const [, cyB] = regC(1);
    cy = cy + (cyB - cy) * pd;
    s = s * (1 - pd) + (1 + 0.004 * Math.max(0, tg - tOn)) * pd;
    // lower half opens tight on the torpedo, then widens as the rule and the officers arrive
    const pt = smootherstep(prog(tg, tOn - 0.55, tOn + 0.15)) * (1 - smootherstep(prog(tg, tFire - 0.3, tThree + 0.3)));
    if (pt > 0) {
      const tcx = tx0 + tLen * (P ? 0.46 : 0.48), tcy = ty + (P ? px(230) : px(150));
      const sT = P ? 1.26 : 1.6;
      cx = cx + (tcx - cx) * pt; cy = cy + (tcy - cy) * pt; s = s + (sT - s) * pt;
    }
    // scene 4: lean in to the third officer on "third", hold on NO
    const p4 = smootherstep(prog(tg, tThird - 0.3, tThird + 0.5));
    s *= 1 + p4 * 0.05; cx += p4 * (R(1, Lx.offX[2], 0)[0] - W / 2) * (P ? 0 : 0.2); cy += p4 * px(P ? 30 : 40);
    // pull back: the whole page, the one red mark among all the blue
    const pe = smootherstep(prog(tg, tWorld - 0.1, tWorld + 1.7));
    s = s * (1 - pe) + Lx.end.s * pe;
    cx = cx * (1 - pe) + (W / 2 + px(P ? 10 : 0)) * pe;
    cy = cy * (1 - pe) + H * Lx.end.cy * pe;
    // hand-held: the desk is never perfectly still
    cx += noise1(tg * 0.35, 3) * px(2.5); cy += noise1(tg * 0.3, 7) * px(2.5);
    let rot = noise1(tg * 0.2, 11) * 0.12;
    // the charges thump the table a little
    for (const h of burstsT) { const sh = shake(tg, h + F, { amp: px(5), decay: 0.22 }); cx += sh * 0.4; cy += sh; }
    cy += shake(tg, tNo + 0.1, { amp: px(2.5), decay: 0.15 });
    world.style.transform = `translate(${W / 2}px, ${H / 2}px) rotate(${rot}deg) scale(${s}) translate(${-cx}px, ${-cy}px)`;
  }

  return {
    update(tg) {
      camera(tg);
      for (const f of items) f(tg);
    },
  };
}
