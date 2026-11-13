// WOOD INLAY (marquetry) kit — style-marquetry.
// Medium: thin veneers of real wood species, knife-cut and fitted flush into a ground veneer; the GRAIN DIRECTION
// draws the form (sea grain runs with the swell, a hull's grain runs bow→stern, a coat's grain runs down the body).
// Every picture element is a "piece": knife scores its outline → the window drops out (dark backing shows) →
// the veneer slides in ALONG ITS GRAIN, drops 1 % and seats with a dry wood tap. One dyed veneer (indigo) is kept
// for the NO. The panel is French-polished: one key light upper-left, a lacquer sheen sweeps once per scene.
//
// Wood textures are made ONCE at build time (seamless canvas tiles → blob URLs) and used as SVG patterns,
// so update() only moves SVG groups (cheap DOM/SVG, no per-frame pixel work).
import { svg, el, clamp, progress, rand } from '/onclack-styles/engine/lib/anim.js';

export const F = 1 / 30;
export const FONT = { inlay: "'Sofia Sans Extra Condensed', sans-serif", plate: "'IBM Plex Mono', monospace" };
export const JOINT = '#1E140D';
export const BACKING = '#2B1D13'; // what shows through a cut window (glue + backing paper)

// ---------- easing (asymmetric tokens, §7.10) ----------
export function bez(x1, y1, x2, y2) {
  const B = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const x = B(x1, x2, t) - p, dx = (B(x1, x2, t + 1e-4) - B(x1, x2, t)) / 1e-4;
      if (!dx) break; t = clamp(t - x / dx, 0, 1);
    }
    return B(y1, y2, t);
  };
}
export const ez = { enter: bez(0.16, 1, 0.3, 1), exit: bez(0.7, 0, 0.84, 0), move: bez(0.65, 0, 0.35, 1), camera: bez(0.45, 0, 0.15, 1) };
export const tw = (t, a, b, from, to, e = ez.enter) => from + (to - from) * e(progress(t, a, b));

// ---------- words ----------
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Local scene time of the nth word `w` (voice timing); fallback = local seconds. */
export function wordT(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.words.filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fallback;
}

// ---------- species (natural colours; only INDIGO is dyed) ----------
export const SPECIES = {
  holly:  { lo: '#F2ECDC', hi: '#DCD1B8', rings: 26, sharp: 2.2, con: 0.30, warp: 2.2, pores: 0, fiddle: 0.03 },
  maple:  { lo: '#EDD7AA', hi: '#CBA772', rings: 24, sharp: 3.0, con: 0.34, warp: 3, pores: 0, fiddle: 0.05, fq: 20 },
  satin:  { lo: '#E8BE64', hi: '#B0802C', rings: 28, sharp: 2.0, con: 0.40, warp: 4, pores: 0, fiddle: 0.16 },
  pear:   { lo: '#D8A37A', hi: '#AE7650', rings: 14, sharp: 2.4, con: 0.32, warp: 6, pores: 0, fiddle: 0.04 },
  padauk: { lo: '#BE5A33', hi: '#7C2D18', rings: 20, sharp: 2.6, con: 0.45, warp: 5, pores: 0.5, fiddle: 0.08 },
  mahog:  { lo: '#A35B37', hi: '#62301C', rings: 16, sharp: 2.8, con: 0.50, warp: 6, pores: 0.8, fiddle: 0.12 },
  walnut: { lo: '#86593A', hi: '#46291A', rings: 12, sharp: 3.4, con: 0.62, warp: 14, pores: 1, fiddle: 0.04 },
  bog:    { lo: '#4A3A2E', hi: '#241B15', rings: 16, sharp: 3.0, con: 0.55, warp: 8, pores: 1, fiddle: 0.03 },
  ebony:  { lo: '#2E2621', hi: '#130F0D', rings: 24, sharp: 2.0, con: 0.45, warp: 4, pores: 0.3, fiddle: 0.02 },
  hare:   { lo: '#BCB9AE', hi: '#7E7B72', rings: 26, sharp: 2.6, con: 0.42, warp: 2.5, pores: 0, fiddle: 0.07, fq: 22 },
  hareDk: { lo: '#8A8983', hi: '#52524E', rings: 26, sharp: 2.6, con: 0.42, warp: 2.5, pores: 0, fiddle: 0.07, fq: 22 },
  indigo: { lo: '#3D63AA', hi: '#1E3B78', rings: 18, sharp: 2.4, con: 0.36, warp: 6, pores: 0, fiddle: 0.10 },
};
const TW = 512, TH = 256; // texture tile, grain runs along x

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function makeTile(name, sp, seed) {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const g = c.getContext('2d'); const img = g.createImageData(TW, TH); const D = img.data;
  const lo = hex(sp.lo), hi = hex(sp.hi), R = k => rand(seed * 31 + k);
  const m1 = 1 + Math.floor(R(1) * 2), m2 = 3 + Math.floor(R(2) * 3), p1 = R(3) * 6.28, p2 = R(4) * 6.28;
  const warp = new Float32Array(TW);
  for (let x = 0; x < TW; x++) warp[x] = sp.warp * Math.sin(6.2832 * m1 * x / TW + p1) + sp.warp * 0.35 * Math.sin(6.2832 * m2 * x / TW + p2);
  const ringTone = Array.from({ length: sp.rings }, (_, i) => (R(10 + i) - 0.5) * 0.35);
  const p3 = R(5) * 6.28, p4 = R(6) * 6.28, q = sp.fq ?? 6 + Math.floor(R(7) * 6), p5 = R(8) * 6.28;
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const yy = y + warp[x];
    const ph = sp.rings * yy / TH + 0.35 * Math.sin(6.2832 * 2 * yy / TH + p3) + 0.18 * Math.sin(6.2832 * 5 * yy / TH + p4);
    const f = ph - Math.floor(ph);
    const ring = ((Math.floor(ph) % sp.rings) + sp.rings) % sp.rings;
    let v = sp.con * Math.pow(f, sp.sharp) + 0.5 + ringTone[ring] - sp.con * 0.3;
    const fid = 0.6 * Math.sin(6.2832 * q * x / TW + 0.9 * Math.sin(6.2832 * 2 * yy / TH + p5)) + 0.4 * Math.sin(6.2832 * Math.round(q * 1.6) * x / TW + 1.4 * Math.sin(6.2832 * 3 * yy / TH + p3));
    v += sp.fiddle * fid;
    const n = (rand(x * 7.13 + y * 113.7 + seed) - 0.5) * 0.06;
    v = clamp(v + n, 0, 1);
    const i = (y * TW + x) * 4;
    D[i] = lo[0] + (hi[0] - lo[0]) * v; D[i + 1] = lo[1] + (hi[1] - lo[1]) * v; D[i + 2] = lo[2] + (hi[2] - lo[2]) * v; D[i + 3] = 255;
  }
  // open pores: short dark dashes that follow the grain (walnut, mahogany, oak-like woods)
  const nP = Math.floor(sp.pores * TW * TH / 160);
  for (let k = 0; k < nP; k++) {
    const x0 = Math.floor(rand(seed + k * 3.1) * TW), y0 = rand(seed + k * 5.7) * TH, len = 3 + Math.floor(rand(seed + k * 9.3) * 9);
    for (let j = 0; j < len; j++) {
      const x = (x0 + j) % TW, y = ((Math.round(y0 + warp[x]) % TH) + TH) % TH, i = (y * TW + x) * 4;
      D[i] *= 0.8; D[i + 1] *= 0.8; D[i + 2] *= 0.8;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

let WOOD = null; // { name: url }
export function woodReady() {
  if (WOOD) return WOOD;
  WOOD = (async () => {
    const out = {};
    try { await Promise.all([document.fonts.load("800 60px 'Sofia Sans Extra Condensed'"), document.fonts.load("500 30px 'IBM Plex Mono'")]); } catch {}
    let s = 3;
    for (const [name, sp] of Object.entries(SPECIES)) {
      const c = makeTile(name, sp, s++ * 17);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      const im = new Image(); im.src = url; try { await im.decode(); } catch {}
      out[name] = url;
    }
    return out;
  })();
  return WOOD;
}

// ---------- panel ----------
/**
 * Build one marquetry panel (an SVG stage) for a scene.
 * Layers: world (camera) → screen (text pieces, plates) → border (crossbanding, screen-fixed) → finish (light, sheen).
 */
export async function panel(root, ctx, { id }) {
  const L = ctx.layout, W = L.width, H = L.height;
  const wood = await woodReady();
  const S = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'data-name': 'Marquetry panel', style: 'position:absolute;left:0;top:0;overflow:hidden' }, root);
  const defs = svg('defs', {}, S);
  let nP = 0;
  const tile = L.unit * 1.0;
  /** A wood fill: species + grain angle (deg) + seed (offset) + flip (book-match). Returns 'url(#id)'. */
  const pat = (species, angle = 0, seed = 1, { flip = false, scale = 1 } = {}) => {
    const pid = `${id}-w${nP++}`;
    const w = TW * tile * scale, h = TH * tile * scale;
    const p = svg('pattern', { id: pid, patternUnits: 'userSpaceOnUse', width: w, height: h,
      patternTransform: `rotate(${angle}) translate(${(rand(seed) * w).toFixed(1)} ${(rand(seed + 0.5) * h).toFixed(1)})${flip ? ' scale(1 -1)' : ''}` }, defs);
    svg('image', { href: wood[species], width: w, height: h, preserveAspectRatio: 'none' }, p);
    return `url(#${pid})`;
  };
  // sand-shading gradients (pieces scorched in hot sand along one edge → volume without paint)
  const shadeDirs = { b: [0, 1, 0, 0], t: [0, 0, 0, 1], l: [0, 0, 1, 0], r: [1, 0, 0, 0], br: [1, 1, 0.3, 0.3], bl: [0, 1, 0.7, 0.3], tl: [0, 0, 0.7, 0.7], tr: [1, 0, 0.3, 0.7] };
  for (const [k, [x1, y1, x2, y2]] of Object.entries(shadeDirs)) {
    const gr = svg('linearGradient', { id: `${id}-sh-${k}`, x1, y1, x2, y2 }, defs);
    svg('stop', { offset: 0, 'stop-color': '#2A1206', 'stop-opacity': 0.75 }, gr);
    svg('stop', { offset: 0.22, 'stop-color': '#3A1C0B', 'stop-opacity': 0.35 }, gr);
    svg('stop', { offset: 0.6, 'stop-color': '#3A1C0B', 'stop-opacity': 0 }, gr);
  }
  const brass = svg('linearGradient', { id: `${id}-brass`, x1: 0, y1: 0, x2: 0.25, y2: 1 }, defs);
  [['0', '#E4C77A'], ['0.45', '#C9A452'], ['1', '#9C7A35']].forEach(([o, c]) => svg('stop', { offset: o, 'stop-color': c }, brass));

  const world = svg('g', { 'data-name': 'World (camera)' }, S);
  const screen = svg('g', { 'data-name': 'Screen layer' }, S);
  const frameG = svg('g', { 'data-name': 'Border (crossbanding + stringing)' }, S);

  // ---- border: crossbanded walnut in short mitred segments + holly/ebony stringing (screen-fixed)
  const B = L.px(L.pick({ landscape: 40, portrait: 36 }));
  const jw = Math.max(1.2, L.px(1.4));
  {
    const segLen = L.px(74);
    const pats = { h: [0, 1, 2, 3].map(i => pat('walnut', 90, 50 + i)), v: [0, 1, 2, 3].map(i => pat('walnut', 0, 60 + i)) };
    const side = (x0, y0, x1, y1, inX0, inY0, inX1, inY1, kind, seed) => {
      // quad strip from outer edge (x0,y0)-(x1,y1) to inner edge; split into segments
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / segLen));
      for (let i = 0; i < n; i++) {
        const a = i / n, b = (i + 1) / n;
        const P = (u, outer) => outer ? [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u] : [inX0 + (inX1 - inX0) * u, inY0 + (inY1 - inY0) * u];
        const pts = [P(a, 1), P(b, 1), P(b, 0), P(a, 0)];
        svg('path', { d: 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + 'Z', fill: pats[kind][Math.floor(rand(seed + i) * 4)], stroke: JOINT, 'stroke-width': jw, 'stroke-opacity': 0.85 }, frameG);
        // slight tone change per segment (real crossbanding is cut from different leaves)
        const tone = rand(seed + i * 1.7) - 0.5;
        svg('path', { d: 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + 'Z', fill: tone > 0 ? '#FFF2DC' : '#1A0E06', opacity: (Math.abs(tone) * 0.16).toFixed(3) }, frameG);
      }
    };
    side(0, 0, W, 0, B, B, W - B, B, 'h', 1);
    side(W, H, 0, H, W - B, H - B, B, H - B, 'h', 2);
    side(0, H, 0, 0, B, H - B, B, B, 'v', 3);
    side(W, 0, W, H, W - B, B, W - B, H - B, 'v', 4);
    // stringing: ebony | holly | ebony just inside the band
    const s1 = Math.max(2, L.px(2.5)), s2 = Math.max(3, L.px(5));
    svg('rect', { x: B + s1 / 2, y: B + s1 / 2, width: W - 2 * B - s1, height: H - 2 * B - s1, fill: 'none', stroke: '#16100C', 'stroke-width': s1 }, frameG);
    svg('rect', { x: B + s1 + s2 / 2, y: B + s1 + s2 / 2, width: W - 2 * B - 2 * s1 - s2, height: H - 2 * B - 2 * s1 - s2, fill: 'none', stroke: pat('holly', 0, 9), 'stroke-width': s2 }, frameG);
    svg('rect', { x: B + s1 + s2 + s1 / 2, y: B + s1 + s2 + s1 / 2, width: W - 2 * B - 3 * s1 - 2 * s2, height: H - 2 * B - 3 * s1 - 2 * s2, fill: 'none', stroke: '#16100C', 'stroke-width': s1 }, frameG);
    svg('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, fill: 'none', stroke: '#120C08', 'stroke-width': Math.max(2, L.px(3)) }, frameG);
  }
  const inner = B + L.px(10); // picture area starts here

  // ---- finish: key light upper-left, soft fall-off, fixed lacquer reflection, one moving sheen
  const finish = el('div', { 'data-name': 'French-polish finish', style: { position: 'absolute', inset: 0, pointerEvents: 'none' } }, root);
  el('div', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 18% 8%, rgba(255,236,200,0.20), rgba(255,236,200,0) 70%)', mixBlendMode: 'screen' } }, finish);
  el('div', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 85% 85% at 40% 35%, rgba(0,0,0,0) 55%, rgba(24,12,4,0.30) 100%)', mixBlendMode: 'multiply' } }, finish);
  el('div', { 'data-name': 'Lacquer reflection', style: { position: 'absolute', inset: 0, background: 'linear-gradient(122deg, rgba(255,250,236,0) 30%, rgba(255,250,236,0.06) 38%, rgba(255,250,236,0) 46%)', mixBlendMode: 'screen' } }, finish);
  const sheen = el('div', { 'data-name': 'Lacquer sheen (moving)', style: { position: 'absolute', top: 0, left: 0, width: W * 0.9 + 'px', height: H + 'px', background: 'linear-gradient(112deg, rgba(255,246,226,0) 30%, rgba(255,246,226,0.20) 48%, rgba(255,255,255,0.30) 50%, rgba(255,246,226,0.20) 52%, rgba(255,246,226,0) 70%)', mixBlendMode: 'screen', opacity: 0 } }, finish);
  /** sheen sweep across the panel between t0 and t0+dur (once per scene) */
  const sheenAt = (t, t0, dur = 1.5) => {
    const p = progress(t, t0, t0 + dur);
    sheen.style.opacity = p > 0 && p < 1 ? Math.sin(Math.PI * p).toFixed(3) : '0';
    sheen.style.transform = `translateX(${(-W * 0.9 + p * W * 1.9).toFixed(1)}px)`;
  };

  // ---- knife-cut wipe transition (new panel cut in along a slanted joint)
  const edge = el('div', { 'data-name': 'Knife-cut edge', style: { position: 'absolute', top: -H * 0.2 + 'px', left: 0, width: Math.max(3, L.px(4)) + 'px', height: H * 1.4 + 'px', background: '#F0E6CF', boxShadow: `0 0 0 ${Math.max(1.5, L.px(2))}px ${JOINT}`, transformOrigin: '50% 50%', opacity: 0 } }, root);
  const wipe = (t, t0 = 0, dur = 0.45, on = true) => {
    if (!on) { root.style.clipPath = ''; edge.style.opacity = 0; return; }
    const p = ez.move(progress(t, t0, t0 + dur));
    const slant = H * 0.18, xe = -slant + p * (W + 2 * slant);
    if (p >= 1) { root.style.clipPath = ''; edge.style.opacity = 0; return; }
    root.style.clipPath = `polygon(0 0, ${(xe + slant).toFixed(1)}px 0, ${(xe - slant).toFixed(1)}px ${H}px, 0 ${H}px)`;
    edge.style.opacity = 1;
    edge.style.transform = `translateX(${(xe).toFixed(1)}px) rotate(${(Math.atan2(2 * slant, H) * 180 / Math.PI).toFixed(2)}deg)`;
  };

  return { L, W, H, S, defs, world, screen, frameG, pat, B, inner, jw, sheenAt, wipe, id, shade: k => `url(#${id}-sh-${k})`, brass: `url(#${id}-brass)` };
}

// ---------- a piece ----------
/**
 * One veneer piece. o = { d | text:{str,x,y,size,anchor,weight,ls}, species, angle (grain, deg), seed, name,
 *   at (local lock time; ≤ 0 = already there), dur (slide s), dist (px), dir (deg, default grain angle),
 *   score (s of knife line before the window; 0 = none), win (show cut window first), shade:'b'.., shadeAmt, flip }
 */
export function piece(P, parent, o) {
  const L = P.L;
  const g = svg('g', { 'data-name': o.name ?? 'Piece' }, parent);
  const isText = !!o.text;
  const shapeAttrs = isText
    ? { x: o.text.x, y: o.text.y, 'font-family': FONT.inlay, 'font-weight': o.text.weight ?? 800, 'font-size': o.text.size, 'text-anchor': o.text.anchor ?? 'start', 'letter-spacing': o.text.ls ?? '0.02em', 'dominant-baseline': 'alphabetic' }
    : { d: o.d };
  const mk = (par, attrs) => { const n = svg(isText ? 'text' : 'path', { ...shapeAttrs, ...attrs }, par); if (isText) n.textContent = o.text.str; return n; };
  const at = o.at ?? -10;
  const win = o.win !== false && at > 0 ? mk(g, { fill: BACKING, opacity: 0, 'data-name': 'Cut window' }) : null;
  const score = o.score && at > 0 && !isText ? mk(g, { fill: 'none', stroke: '#140C07', 'stroke-width': Math.max(2, L.px(2.6)), pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, 'data-name': 'Knife line' }) : null;
  const shadow = mk(g, { fill: '#140A04', opacity: 0, 'data-name': 'Lift shadow' });
  const mover = svg('g', {}, g);
  const fill = P.pat(o.species, o.angle ?? 0, o.seed ?? 1, { flip: o.flip, scale: o.scale ?? 1 });
  // text: stroke painted under the fill (font contours overlap → inner lines would show); width doubled = same outer joint
  const body = mk(mover, { fill, stroke: JOINT, 'stroke-width': (o.joint ?? P.jw) * (isText ? 2 : 1), 'stroke-opacity': 0.9, 'stroke-linejoin': 'round', ...(isText ? { 'paint-order': 'stroke' } : {}), 'data-name': `${o.name ?? 'Piece'} (${o.species})` });
  if (o.shade) mk(mover, { fill: P.shade(o.shade), opacity: o.shadeAmt ?? 0.8, 'pointer-events': 'none' });
  const dirRad = ((o.dir ?? o.angle ?? 0) * Math.PI) / 180;
  const dist = o.dist ?? L.px(90);
  const dur = o.dur ?? 0.42;
  const scoreDur = o.score ?? 0;
  // centre for the 1 % drop (bbox measured once)
  let cx = 0, cy = 0;
  try { const b = body.getBBox(); cx = b.x + b.width / 2; cy = b.y + b.height / 2; } catch {}
  const api = {
    g, body, at,
    update(t) {
      if (at <= 0) { mover.removeAttribute('transform'); shadow.setAttribute('opacity', 0); if (win) win.setAttribute('opacity', 0); return; }
      const tS = at - dur, tD = at - 0.1; // slide → drop → seated at `at`
      if (score) {
        const s0 = o.scoreAt ?? tS - 0.25 - scoreDur;
        const ps = progress(t, s0, s0 + scoreDur);
        score.setAttribute('stroke-dashoffset', (1 - ez.move(ps)).toFixed(4));
        score.setAttribute('opacity', t < s0 ? 0 : t > at ? 0 : 1);
      }
      const wA = o.winAt ?? (o.scoreAt != null ? o.scoreAt + scoreDur + 0.15 : tS - 0.25);
      if (win) win.setAttribute('opacity', ((o.winOpacity ?? 1) * progress(t, wA - 0.12, wA)).toFixed(3));
      if (t < tS) { mover.setAttribute('opacity', 0); shadow.setAttribute('opacity', 0); return; }
      const ps = ez.enter(progress(t, tS, tD));
      const off = (1 - ps) * dist;
      const lift = 1 - ez.move(progress(t, tD - 0.04, at)); // 1 while lifted → 0 seated
      const sc = 1 + 0.012 * lift;
      const dx = -Math.cos(dirRad) * off, dy = -Math.sin(dirRad) * off;
      mover.setAttribute('opacity', clamp((t - tS) / 0.08));
      mover.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) translate(${cx} ${cy}) scale(${sc.toFixed(4)}) translate(${-cx} ${-cy})`);
      const so = L.px(7) * lift;
      shadow.setAttribute('opacity', (0.38 * lift * clamp((t - tS) / 0.08)).toFixed(3));
      shadow.setAttribute('transform', `translate(${(dx + so * 0.6).toFixed(2)} ${(dy + so).toFixed(2)})`);
    },
  };
  return api;
}

/** Engraved brass plate (Boulle-style brass inlay) — small captions only. */
export function plate(P, parent, { x, y, text, size = 26, name = 'Brass plate', anchor = 'start', padX = 0.7, at = -1, dist }) {
  const L = P.L;
  const g = svg('g', { 'data-name': name }, parent);
  // IBM Plex Mono: every glyph advances 0.6 em (+0.04 em tracking) → exact width without measuring
  const pw = text.length * size * 0.64 + size * padX * 2, ph = size * 1.7;
  const x0 = anchor === 'end' ? x - pw : anchor === 'middle' ? x - pw / 2 : x;
  const pc = piece(P, g, { d: `M${x0} ${y}h${pw}v${ph}h${-pw}Z`, species: 'holly', name: `${name} recess`, at, win: true, dist: dist ?? L.px(60), dir: 0 });
  pc.body.setAttribute('fill', P.brass);
  pc.body.setAttribute('stroke', '#3B2A12');
  // engraved letters (dark fill + 1px light lip below = cut into metal)
  const mover = pc.body.parentNode;
  const lip = svg('text', { x: x0 + size * padX, y: y + ph * 0.5 + size * 0.36 + Math.max(1, L.px(1.2)), 'font-family': FONT.plate, 'font-weight': 500, 'font-size': size, 'letter-spacing': '0.04em', fill: '#F6E3A6', opacity: 0.55 }, mover);
  lip.textContent = text;
  const tx = svg('text', { x: x0 + size * padX, y: y + ph * 0.5 + size * 0.36, 'font-family': FONT.plate, 'font-weight': 500, 'font-size': size, 'letter-spacing': '0.04em', fill: '#33240F' }, mover);
  tx.textContent = text;
  return { g, update: pc.update, w: pw, h: ph, x: x0 };
}

/** Path string from points. */
export const poly = pts => 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') + 'Z';
/** Rounded rect path. */
export const rrect = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

/** Ground veneer: `leaves` book-matched leaves (alternate leaves mirrored) with visible joints. */
export function ground(P, parent, { species, angle = 0, leaves = 3, x = 0, y = 0, w = P.W, h = P.H, vertical = true, seed = 1, name = 'Ground veneer', tone = 0.07 }) {
  const g = svg('g', { 'data-name': name }, parent);
  for (let i = 0; i < leaves; i++) {
    const r = vertical ? { x: x + (w * i) / leaves, y, w: w / leaves, h } : { x, y: y + (h * i) / leaves, w, h: h / leaves };
    const d = `M${r.x} ${r.y}h${r.w + 0.8}v${r.h + 0.8}h${-r.w - 0.8}Z`;
    svg('path', { d, fill: P.pat(species, angle, seed + i * 0.37, { flip: i % 2 === 1 }), 'data-name': `Leaf ${i + 1}` }, g);
    const tv = rand(seed * 3 + i) - 0.5;
    svg('path', { d, fill: tv > 0 ? '#FFF4E0' : '#1A0E06', opacity: (Math.abs(tv) * tone * 2).toFixed(3) }, g);
    if (i > 0) svg('line', vertical ? { x1: r.x, y1: y, x2: r.x, y2: y + h } : { x1: x, y1: r.y, x2: x + w, y2: r.y }, g).setAttribute('style', `stroke:${JOINT};stroke-width:${P.jw};stroke-opacity:0.8`);
  }
  return g;
}

/** Inlaid stringing line (holly strip with dark edges) along a path d. */
export function stringing(P, parent, d, { w = 3, species = 'holly', name = 'Stringing', at = -1, ...rest } = {}) {
  const L = P.L;
  const g = svg('g', { 'data-name': name }, parent);
  const edge = svg('path', { d, fill: 'none', stroke: JOINT, 'stroke-width': L.px(w) + 2 * P.jw, 'stroke-linecap': 'butt', pathLength: 1 }, g);
  const core = svg('path', { d, fill: 'none', stroke: P.pat(species, 0, 3), 'stroke-width': L.px(w), 'stroke-linecap': 'butt', pathLength: 1 }, g);
  const dur = rest.dur ?? 0.6;
  return {
    g, update(t) {
      // a stringing strip is pushed into its groove lengthwise: it grows from one end
      const p = at <= 0 ? 1 : ez.move(progress(t, at - dur, at));
      for (const n of [edge, core]) { n.setAttribute('stroke-dasharray', `${p.toFixed(4)} 2`); n.setAttribute('opacity', p > 0 ? 1 : 0); }
    },
  };
}
