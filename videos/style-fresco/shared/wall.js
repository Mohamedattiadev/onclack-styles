// FRESCO WALL — the whole film is ONE lime-plaster wall, painted day-section by day-section (giornate) in voice time.
// Process per section, always in this order (that order IS the signature):
//   1. a patch of fresh intonaco is troweled onto the rough sand-coloured arriccio (wet = darker, it dries lighter),
//   2. the drawing is pounced through a pricked cartoon (spolvero: rows of charcoal dots),
//   3. pigment is brushed into the wet lime (visible hatch strokes, multiply = pigment soaked into plaster).
// Seams between sections stay visible as fine ridges. In the last beat ~40 years pass: cracks run, flakes drop out.
// 4 scene modules build the same wall on one global clock, so cuts are invisible; the camera moves along the wall.
import { svg, el, rand, clamp } from '/onclack-styles/engine/lib/anim.js';

const ez = (p) => { p = clamp(p); return p * p * p * (p * (p * 6 - 15) + 10); };
const prog = (t, a, b) => clamp((t - a) / (b - a));

export const PAL = {
  arriccio: '#A89E8D',  // rough sand + lime under-layer (cool grey-brown, not cream)
  lime: '#E4E1D9',      // fresh intonaco, dried
  limes: ['#E4E1D9', '#E1DED4', '#E6E3DC', '#DFDCD3', '#E3DFD5'], // each day's plaster dries a little differently
  char: '#34312E',      // pounce charcoal
  skyBlue: '#AEB9B9',   // very thin grey-blue wash
  sea1: '#8FA2A6', sea2: '#6D838D', sea3: '#4E626D', // sea, light → deep
  verde: '#7B8768',     // green earth (land, YES)
  umber: '#4A3B31',     // lettering, outlines
  black: '#2B2826',     // vine black (submarine, coats)
  slate: '#48525A',     // ships, one coat
  skin: '#B59C86',      // plain head tone, no features
  ochre: '#B58A4E',     // only the warhead
  cinnabar: '#B2382A',  // only the NO
};
export const FONT = "'Bricolage Grotesque', sans-serif";
export const SERIF = "'Newsreader', serif";

/* ------------------------------------------------------------ textures (built once, cached for all scenes) */
let TEX = null;
function canvasTex(n, paint) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'); paint(g, n);
  return c.toDataURL('image/png');
}
function wrapDraw(n, x, y, f) { for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) f(x + dx, y + dy); }
function textures() {
  if (TEX) return TEX;
  let s = 1;
  const r = () => rand(s++ * 1.371 + 0.5);
  const arr = canvasTex(512, (g, n) => {
    g.fillStyle = PAL.arriccio; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 160; i++) { // soft lime blotches + damp patches
      const x = r() * n, y = r() * n, rad = 20 + r() * 90, light = r() > 0.5;
      wrapDraw(n, x, y, (X, Y) => {
        const gr = g.createRadialGradient(X, Y, 0, X, Y, rad);
        gr.addColorStop(0, light ? 'rgba(235,230,220,0.10)' : 'rgba(70,62,52,0.09)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(X - rad, Y - rad, rad * 2, rad * 2);
      });
    }
    for (let i = 0; i < 14000; i++) { // sand grains
      const x = r() * n, y = r() * n, z = 0.6 + r() * 2.4, k = r();
      g.fillStyle = k < 0.45 ? `rgba(60,52,44,${0.25 + r() * 0.4})` : k < 0.8 ? `rgba(240,236,226,${0.25 + r() * 0.45})` : `rgba(140,112,80,${0.3 + r() * 0.3})`;
      g.fillRect(x, y, z, z * (0.6 + r() * 0.8));
    }
    const d = g.getImageData(0, 0, n, n), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const v = (r() - 0.5) * 22; a[i] += v; a[i + 1] += v; a[i + 2] += v; }
    g.putImageData(d, 0, 0);
  });
  const fine = canvasTex(1024, (g, n) => { // multiplied over everything: lime pores, trowel marks, fine grain
    g.fillStyle = '#fff'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 90; i++) {
      const x = r() * n, y = r() * n, rad = 60 + r() * 220;
      wrapDraw(n, x, y, (X, Y) => {
        const gr = g.createRadialGradient(X, Y, 0, X, Y, rad);
        gr.addColorStop(0, `rgba(120,115,105,${0.04 + r() * 0.05})`); gr.addColorStop(1, 'rgba(120,115,105,0)');
        g.fillStyle = gr; g.fillRect(X - rad, Y - rad, rad * 2, rad * 2);
      });
    }
    g.lineCap = 'round';
    for (let i = 0; i < 60; i++) { // faint trowel arcs
      const x = r() * n, y = r() * n, rad = 90 + r() * 160, a0 = r() * 6.28;
      g.strokeStyle = `rgba(110,104,94,${0.05 + r() * 0.05})`; g.lineWidth = 1 + r() * 2;
      wrapDraw(n, x, y, (X, Y) => { g.beginPath(); g.arc(X, Y, rad, a0, a0 + 0.5 + r() * 0.6); g.stroke(); });
    }
    for (let i = 0; i < 5000; i++) { const x = r() * n, y = r() * n, z = 0.7 + r() * 1.8; g.fillStyle = `rgba(80,74,66,${0.15 + r() * 0.35})`; g.fillRect(x, y, z, z); }
    const d = g.getImageData(0, 0, n, n), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const v = r() * 20; a[i] -= v; a[i + 1] -= v; a[i + 2] -= v * 1.05; }
    g.putImageData(d, 0, 0);
  });
  TEX = { arr, fine };
  return TEX;
}

export const arrTex = () => textures().arr;

/* ------------------------------------------------------------ geometry helpers */
const pts = (a) => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
/** A wobbly hand-made edge between two points (seeded, fixed per object). */
function edge(a, b, seed, amp = 9, step = 26) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), n = Math.max(2, Math.round(L / step));
  const nx = -dy / L, ny = dx / L, out = [];
  for (let i = 0; i < n; i++) {
    const u = i / n, w = (rand(seed + i * 3.1) - 0.5) * amp * 0.35 + Math.sin(u * L / 140 + seed) * amp * 0.6 + Math.sin(u * L / 61 + seed * 2.3) * amp * 0.35;
    out.push([a[0] + dx * u + nx * w, a[1] + dy * u + ny * w]);
  }
  return out;
}
/** Closed wobbly polygon through corner points. */
export function wobble(corners, seed, amp = 9) {
  const out = [];
  corners.forEach((c, i) => out.push(...edge(c, corners[(i + 1) % corners.length], seed + i * 17, amp)));
  return out;
}
const bboxOf = (p) => { const xs = p.map(q => q[0]), ys = p.map(q => q[1]); const x = Math.min(...xs), y = Math.min(...ys); return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }; };

/* ------------------------------------------------------------ the wall */
export async function buildWall(root, ctx, tag) {
  try { await Promise.all([document.fonts.load(`800 100px ${FONT}`), document.fonts.load(`italic 400 60px ${SERIF}`)]); } catch {}
  const L = ctx.layout, W = ctx.width, H = ctx.height, P = L.portrait;
  const T = textures();
  let uid = 0;
  const id = (k) => `fr-${tag}-${k}-${uid++}`;
  const ups = [];  // update functions (global time)

  Object.assign(root.style, { position: 'absolute', inset: 0, overflow: 'hidden', background: PAL.arriccio });
  const world = el('div', { 'data-name': 'Wall (camera)', style: { position: 'absolute', left: 0, top: 0, width: '1px', height: '1px', transformOrigin: '0 0' } }, root);
  el('div', { 'data-name': 'Arriccio (rough plaster)', style: { position: 'absolute', left: '-2000px', top: '-1500px', width: '8000px', height: '6000px', backgroundImage: `url(${T.arr})`, backgroundSize: '512px 512px' } }, world);
  const S = svg('svg', { width: 6000, height: 5000, viewBox: '-1000 -1000 6000 5000', 'data-name': 'Painted wall' }, world);
  Object.assign(S.style, { position: 'absolute', left: '-1000px', top: '-1000px', overflow: 'visible' });
  const defs = svg('defs', {}, S);
  // pigment edge: brush-ragged edges + uneven take-up in the lime (fixed per object, never animated)
  const fid = `fr-${tag}-paint`;
  const flt = svg('filter', { id: fid, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.045', numOctaves: 2, seed: 7, result: 'n' }, flt);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 6, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, flt);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.011 0.02', numOctaves: 3, seed: 3, result: 'g' }, flt);
  svg('feColorMatrix', { in: 'g', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0.62', result: 'ga' }, flt);
  svg('feComposite', { in: 'd', in2: 'ga', operator: 'in' }, flt);
  // brush front: the reveal stroke itself gets ragged bristle edges
  const bid = `fr-${tag}-bristle`;
  const bf = svg('filter', { id: bid, x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.09 0.03', numOctaves: 2, seed: 11, result: 'n' }, bf);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 22, xChannelSelector: 'R', yChannelSelector: 'G' }, bf);
  const layers = { under: svg('g', { 'data-name': 'Underdrawing on arriccio' }, S), patches: svg('g', {}, S), seams: svg('g', { 'data-name': 'Day seams' }, S), age: svg('g', { 'data-name': 'Cracks and losses' }, S) };
  el('div', { 'data-name': 'Lime grain', style: { position: 'absolute', left: '-2000px', top: '-1500px', width: '8000px', height: '6000px', backgroundImage: `url(${T.fine})`, backgroundSize: '1024px 1024px', mixBlendMode: 'multiply', opacity: 0.8, pointerEvents: 'none' } }, world);
  // one key light from upper left (daylight from a window), no glow
  el('div', { 'data-name': 'Daylight falloff', style: { position: 'absolute', inset: 0, background: 'radial-gradient(130% 120% at 18% 8%, rgba(255,255,255,0) 40%, rgba(24,26,28,0.22) 100%)', pointerEvents: 'none' } }, root);

  /* ---- groups (local coords), placed per format */
  const G = {};
  const place = P
    ? { sea: [20, 0, 0.62], torp: [20, 1530, 0.62], off: [30, 1800, 0.75], nob: [30, 2580, 0.75] }
    : { sea: [100, 100, 1], torp: [2000, 200, 1], off: [2000, 640, 1], nob: [2000, 1660, 1] };
  for (const [k, [x, y, s]] of Object.entries(place)) {
    G[k] = { x, y, s };
    for (const ln of ['under', 'patches', 'seams', 'age']) G[k][ln] = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, layers[ln]);
  }

  /* ---- a day-section (giornata) */
  function patch(g, poly, t0, { dur = 0.55, seed = 1, name = 'Day section', tone } = {}) {
    const bb = bboxOf(poly);
    const clipId = id('clip'), maskId = id('lay');
    const cp = svg('clipPath', { id: clipId }, defs); svg('polygon', { points: pts(poly) }, cp);
    const m = svg('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: bb.x - 60, y: bb.y - 60, width: bb.w + 120, height: bb.h + 120 }, defs);
    // trowel front: arc-shaped strokes along the leading edge
    const front = [[bb.x - bb.w - 400, bb.y - 60]];
    const n = Math.max(4, Math.round(bb.h / 70));
    for (let i = 0; i <= n; i++) { const y = bb.y - 60 + (bb.h + 120) * i / n; front.push([bb.x - 40 + Math.sin(i * 1.7 + seed) * 22 + (i % 2 ? 26 : -4), y]); }
    front.push([bb.x - bb.w - 400, bb.y + bb.h + 60]);
    const fp = svg('polygon', { points: pts(front), fill: '#fff' }, m);
    const outer = svg('g', { mask: `url(#${maskId})`, 'data-name': name }, g.patches);
    const inner = svg('g', { 'clip-path': `url(#${clipId})`, style: 'isolation:isolate' }, outer);
    svg('polygon', { points: pts(poly), fill: tone ?? PAL.limes[Math.floor(rand(seed) * 5)] }, inner);
    const content = svg('g', {}, inner);
    const wet = svg('polygon', { points: pts(poly), fill: '#56504A', style: 'mix-blend-mode:multiply' }, inner);
    // seam ridge: shadow below-right, light above-left
    const seam = svg('g', { 'data-name': name + ' seam' }, g.seams);
    svg('polygon', { points: pts(poly), fill: 'none', stroke: 'rgba(52,46,40,0.42)', 'stroke-width': 3, transform: 'translate(1.6 1.8)', 'stroke-linejoin': 'round' }, seam);
    svg('polygon', { points: pts(poly), fill: 'none', stroke: 'rgba(250,248,242,0.55)', 'stroke-width': 1.6, transform: 'translate(-1 -1)', 'stroke-linejoin': 'round' }, seam);
    const span = bb.w + 130;
    const st = { t0, t1: t0 + dur, inner, content };
    ups.push((t) => {
      const p = ez(prog(t, t0, t0 + dur));
      outer.style.display = p <= 0 ? 'none' : '';
      fp.setAttribute('transform', `translate(${(span * p).toFixed(1)} 0)`);
      seam.style.opacity = p >= 1 ? 1 : 0;
      const dry = prog(t, t0 + dur * 0.5, t0 + dur + 2.6);
      wet.style.opacity = (0.34 * (1 - Math.sqrt(dry))).toFixed(3);
    });
    return st;
  }

  /* ---- brush reveal: a zigzag hatch stroke runs over the shape (mask) */
  function hatch(bb, dir, sp, seed) {
    const out = []; let len = 0, prev = null;
    const push = (p) => { if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); out.push(p); prev = p; };
    if (dir === 'h') { for (let y = bb.y - sp / 2, i = 0; y <= bb.y + bb.h + sp; y += sp, i++) { const j = (rand(seed + i) - 0.5) * sp * 0.4; if (i % 2) { push([bb.x + bb.w + 10, y + j]); push([bb.x - 10, y + j + sp * 0.3]); } else { push([bb.x - 10, y + j]); push([bb.x + bb.w + 10, y + j + sp * 0.3]); } } }
    else { for (let x = bb.x - sp / 2, i = 0; x <= bb.x + bb.w + sp; x += sp, i++) { const j = (rand(seed + i) - 0.5) * sp * 0.4; if (i % 2) { push([x + j, bb.y + bb.h + 10]); push([x + j + sp * 0.35, bb.y - 10]); } else { push([x + j, bb.y - 10]); push([x + j + sp * 0.35, bb.y + bb.h + 10]); } } }
    return { out, len };
  }
  /** Paint `build(g)` into a patch between t0 and t1. opts: dir 'h'|'v', sp (stroke spacing), blend, streak colour. */
  function paint(pt, bb, t0, t1, build, { dir = 'h', sp = 40, blend = 'multiply', seed = 3, streak = 'rgba(30,26,22,0.05)', name = 'Paint', wetFor = 2.2 } = {}) {
    bb = { x: bb.x, y: bb.y, w: bb.w ?? bb.width, h: bb.h ?? bb.height };
    const maskId = id('br');
    const m = svg('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: bb.x - 80, y: bb.y - 80, width: bb.w + 160, height: bb.h + 160 }, defs);
    const hz = hatch(bb, dir, sp, seed);
    const line = svg('polyline', { points: pts(hz.out), fill: 'none', stroke: '#fff', filter: `url(#${bid})`, 'stroke-width': sp * 2.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': hz.len + 400, 'stroke-dashoffset': hz.len + 400 }, m);
    const g = svg('g', { mask: `url(#${maskId})`, 'data-name': name, style: `mix-blend-mode:${blend}` }, pt.content);
    const shape = svg('g', { filter: `url(#${fid})` }, g);
    build(shape);
    if (streak) { // visible brush direction inside the shape
      const cid = id('sc');
      const cp = svg('clipPath', { id: cid }, defs);
      for (const c of shape.children) cp.appendChild(c.cloneNode(true));
      svg('polyline', { points: pts(hatch(bb, dir, sp * 1.3, seed + 9).out), fill: 'none', stroke: streak, 'stroke-width': sp * 0.5, 'stroke-dasharray': `${sp * 3} ${sp * 1.2} ${sp * 6} ${sp * 0.8}`, 'clip-path': `url(#${cid})`, 'stroke-linecap': 'round' }, g);
    }
    // wet pigment reads darker and more saturated, then dries to chalky
    const wetL = svg('g', { style: 'mix-blend-mode:multiply', opacity: 0 }, g);
    for (const c of shape.children) { const k = c.cloneNode(true); wetL.appendChild(k); }
    ups.push((t) => {
      const p = prog(t, t0, t1);
      g.style.display = p <= 0 ? 'none' : '';
      line.setAttribute('stroke-dashoffset', ((hz.len + 400) * (1 - p)).toFixed(1));
      wetL.setAttribute('opacity', (0.32 * (1 - Math.sqrt(prog(t, t1, t1 + wetFor)))).toFixed(3));
    });
    return g;
  }

  /* ---- spolvero: charcoal dots pounced through the pricked cartoon */
  const tmpPath = svg('path', {}, defs);
  function dotsFor(ds, step = 10, seed = 5) {
    const out = [];
    ds.forEach((d, k) => {
      tmpPath.setAttribute('d', d);
      const len = tmpPath.getTotalLength();
      for (let l = 0, i = 0; l < len; l += step, i++) {
        const q = tmpPath.getPointAtLength(l);
        out.push([q.x + (rand(seed + k * 99 + i) - 0.5) * 2.4, q.y + (rand(seed + k * 77 + i * 1.3) - 0.5) * 2.4, rand(seed + i * 5.3 + k)]);
      }
    });
    return out;
  }
  function spolvero(parentG, ds, t0, t1, { fadeAt = Infinity, seed = 5, step = 10, w = 4.2 } = {}) {
    const dots = dotsFor(ds, step, seed);
    // heavier and lighter dots: two paths
    const a = svg('path', { fill: 'none', stroke: PAL.char, 'stroke-width': w, 'stroke-linecap': 'round', opacity: 0.8, 'data-name': 'Spolvero dots' }, parentG);
    const b = svg('path', { fill: 'none', stroke: PAL.char, 'stroke-width': w * 0.62, 'stroke-linecap': 'round', opacity: 0.6 }, parentG);
    let last = -1;
    ups.push((t) => {
      const n = Math.round(dots.length * ez(prog(t, t0, t1)));
      if (n !== last) {
        let da = '', db = '';
        for (let i = 0; i < n; i++) { const [x, y, k] = dots[i]; const s = `M${x.toFixed(1)} ${y.toFixed(1)}h0.01`; if (k > 0.35) da += s; else db += s; }
        a.setAttribute('d', da || 'M0 0'); b.setAttribute('d', db || 'M0 0');
        a.style.display = b.style.display = n ? '' : 'none';
        last = n;
      }
      const f = 1 - 0.55 * prog(t, fadeAt, fadeAt + 1);
      a.setAttribute('opacity', (0.8 * f).toFixed(3)); b.setAttribute('opacity', (0.6 * f).toFixed(3));
    });
  }

  /** Painted lettering (Bricolage 800 caps), brushed in left → right. Returns bbox. */
  function letters(pt, txt, x, y, size, t0, t1, { color = PAL.umber, anchor = 'start', name, track = 0.04, seed = 11 } = {}) {
    const probe = svg('text', { x, y, 'font-family': FONT, 'font-weight': 800, 'font-size': size, 'letter-spacing': size * track, 'text-anchor': anchor }, pt.content);
    probe.textContent = txt;
    const bb = probe.getBBox(); probe.remove();
    paint(pt, bb, t0, t1, (g) => {
      const tx = svg('text', { x, y, 'font-family': FONT, 'font-weight': 800, 'font-size': size, 'letter-spacing': size * track, 'text-anchor': anchor, fill: color, 'data-name': name ?? txt }, g);
      tx.textContent = txt;
    }, { dir: 'v', sp: Math.max(10, size * 0.16), streak: null, seed, name: name ?? txt });
    return bb;
  }
  /** Incised line/text: scratched into the plaster (dark groove + light lower lip). */
  function incise(g, d, t0, { w = 2.2 } = {}) {
    const gg = svg('g', { 'data-name': 'Incised guide line' }, g);
    svg('path', { d, fill: 'none', stroke: 'rgba(60,54,48,0.32)', 'stroke-width': w, pathLength: 1, 'stroke-dasharray': 1 }, gg);
    svg('path', { d, fill: 'none', stroke: 'rgba(255,253,248,0.5)', 'stroke-width': w * 0.7, transform: `translate(0 ${w})`, pathLength: 1, 'stroke-dasharray': 1 }, gg);
    ups.push((t) => { const p = ez(prog(t, t0, t0 + 0.18)); for (const c of gg.children) c.setAttribute('stroke-dashoffset', 1 - p); gg.style.display = p <= 0 ? 'none' : ''; });
  }

  return { root, world, S, defs, G, P, L, ups, id, patch, paint, spolvero, letters, incise, wobble, pts, bboxOf, prog, ez };
}
