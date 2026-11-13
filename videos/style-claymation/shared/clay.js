// CLAY — shared kit for the claymation style test.
// Everything is a pure function of time. The look:
//  - 12 fps stepped time (step(t)) for every moving thing, like a stop-motion camera taking one frame per pose
//  - "boil": each clay object cycles 3 displacement seeds per 12 fps frame (hands touched the clay between frames)
//  - puffy matte clay: one SVG filter (alpha blur → diffuse light from upper left → multiply) + fixed surface grain
//  - thumbprints and tool smears are FIXED per object (seeded by object id), never re-randomised per frame
//  - replacement animation: squash/stretch is a list of discrete poses, one per 12 fps frame (no tween in between)
import { svg, rand, clamp } from '/onclack-styles/engine/lib/anim.js';

export const FPS = 12;
export const frameNo = t => Math.floor(t * FPS + 1e-6);
export const step = t => frameNo(t) / FPS;
export const F = 1 / 30;

export const PAL = {
  sky: '#E8B088', skyHi: '#F1C49B', skyLo: '#DC9E78',
  cloud: '#F5E9D6',
  sea: ['#9AD6E4', '#6BBCD8', '#4A9DCB', '#357FB8', '#2A64A0', '#204D86', '#183A69', '#122C52'],
  surf: '#D9F0F4',
  island: '#5FA04C', islandLo: '#4C8A3E', sand: '#E5C07A',
  sub: '#8B9196', subLo: '#6B7176', subCut: '#B9BDC0',
  ship: '#7A8896', shipLo: '#5E6B78',
  wood: '#C9A26A',
  tag: '#F3E7CD', ink: '#3B2A1F',
  splat: '#EAF6F8',
  charge: '#34383C',
  wall: '#D9A65E', wallLo: '#B9853F', floor: '#8C5B3B',
  torp: '#56654A', torpBand: '#E4BA48',
  head: '#D6B08A',
  uni: ['#2C3B66', '#3A4A63', '#2A3556'], cap: '#1C2340',
  dark: '#3A2A26',
  no: '#D8392A',
};
export const FONT = { clay: "'Bricolage Grotesque', sans-serif", tag: "'Schibsted Grotesk', sans-serif" };

/** multiply a hex colour by f (f < 1 darker, > 1 lighter) */
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(clamp(f > 1 ? v + (255 - v) * (f - 1) : v * f, 0, 255)));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

/** local time (s) of the n-th word matching re inside this scene */
export function wordT(ctx, re, n = 0, fallback = 0) {
  const m = ctx.words.filter(w => re.test(w.word) && w.start >= ctx.start - 0.01 && w.start < ctx.start + ctx.duration);
  return m[n] ? m[n].start - ctx.start : fallback;
}

/** pick a replacement pose by 12 fps frames since tHit. Before tHit → `before` (or first pose). */
export function replace(t, tHit, poses, before) {
  if (t < tHit) return before ?? poses[0];
  const i = Math.floor((t - tHit) * FPS + 1e-6);
  return poses[Math.min(i, poses.length - 1)];
}
// thumb-press: the piece is pushed onto the set (high → squash → settle), one pose per frame
export const PRESS = [{ sx: 1.12, sy: 1.12, o: 1 }, { sx: 1.1, sy: 0.84, o: 1 }, { sx: 0.95, sy: 1.06, o: 1 }, { sx: 1, sy: 1, o: 1 }];
// heavy drop: stretched fall → big squash → rebound → settle (the signature, used for the NO)
export const SLAM = [
  { sx: 0.74, sy: 1.42, dy: -0.55, o: 1 }, { sx: 0.82, sy: 1.26, dy: -0.22, o: 1 },
  { sx: 1.42, sy: 0.6, dy: 0, o: 1 }, { sx: 1.3, sy: 0.72, dy: 0, o: 1 },
  { sx: 0.86, sy: 1.18, dy: -0.06, o: 1 }, { sx: 0.93, sy: 1.08, dy: -0.02, o: 1 },
  { sx: 1.06, sy: 0.95, dy: 0, o: 1 }, { sx: 0.98, sy: 1.02, dy: 0, o: 1 }, { sx: 1, sy: 1, dy: 0, o: 1 },
];

/** apply a pose to a <g> around a base point (bx, by) */
export function pose(g, p, bx, by, dx = 0, dy = 0) {
  g.setAttribute('transform', `translate(${(bx + dx).toFixed(2)} ${(by + dy).toFixed(2)}) scale(${p.sx.toFixed(4)} ${p.sy.toFixed(4)}) translate(${(-bx).toFixed(2)} ${(-by).toFixed(2)})`);
  g.style.opacity = p.o ?? 1;
}

/**
 * One full-frame SVG "set" per scene, with clay filters. Returns helpers.
 * Filter families: 'c' = big objects, 's' = small pieces + text, 'b' = backdrop (no boil, no shadow).
 */
export function makeSet(root, ctx, id) {
  const L = ctx.layout, W = L.width, H = L.height, u = L.unit;
  const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'data-name': 'Clay set', style: 'position:absolute;left:0;top:0;display:block;overflow:hidden' }, root);
  const defs = svg('defs', {}, s);
  const fam = {
    c: { blur: 7, boil: 3.0, depth: 13, grain: 0.045, shadow: [6, 9, 7, 0.42] },
    s: { blur: 3.2, boil: 1.6, depth: 9, grain: 0.05, shadow: [3, 5, 3.5, 0.4] },
    b: { blur: 9, boil: 0, depth: 6, grain: 0.07, shadow: null },
    k: { blur: 15, boil: 2.6, depth: 26, grain: 0.02, shadow: [4, 9, 6, 0.5] },
    t: { blur: 2.6, boil: 1.1, depth: 8, grain: 0.04, shadow: [3, 4, 3, 0.38] },
  };
  for (const [k, o] of Object.entries(fam)) for (let n = 0; n < (o.boil ? 3 : 1); n++) clayFilter(defs, `${id}-${k}${n}`, u, n, o);

  const boilers = [];
  const cam = svg('g', { 'data-name': 'Camera' }, s);
  const api = {
    L, W, H, u, svg: s, defs, cam, id,
    px: n => n * u,
    /** register a node as clay. kind: 'c' | 's' | 't' | 'b' */
    clay(node, kind = 'c', seed = 0) {
      // a stroked coil: its geometry bbox ignores the stroke, so the filter region would clip it → wrap it with a
      // transparent rect that covers the full stroke
      if (node.tagName === 'path' && node.getAttribute('fill') === 'none' && node.parentNode) {
        const wrap = svg('g', { 'data-name': node.getAttribute('data-name') ?? 'Coil' });
        node.parentNode.insertBefore(wrap, node);
        const bb = node.getBBox(), sw = +node.getAttribute('stroke-width') * 0.6;
        svg('rect', { x: bb.x - sw, y: bb.y - sw, width: bb.width + 2 * sw, height: bb.height + 2 * sw, fill: 'none' }, wrap);
        wrap.appendChild(node);
        node = wrap;
      }
      if (fam[kind].boil) { boilers.push({ node, kind, off: Math.floor(rand(seed + boilers.length * 3.1) * 3) }); node.setAttribute('filter', `url(#${id}-${kind}0)`); }
      else node.setAttribute('filter', `url(#${id}-${kind}0)`);
      return node;
    },
    group(parent, name, attrs = {}) { return svg('g', { 'data-name': name, ...attrs }, parent ?? cam); },
    /** call every frame: boil switches seed on each 12 fps frame (frozen objects stop boiling) */
    update(t) {
      const f = frameNo(t);
      for (const b of boilers) b.node.setAttribute('filter', `url(#${id}-${b.kind}${(f + b.off) % 3})`);
      flick.setAttribute('opacity', (0.012 + rand(f * 1.7 + 4) * 0.03).toFixed(3));
    },
  };
  // stop-motion exposure flicker (tiny, per 12 fps frame — real frames never match exactly)
  const flick = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#1a1008', opacity: 0.02, 'data-name': 'Exposure flicker', 'pointer-events': 'none' });
  api.finish = () => s.appendChild(flick);
  return api;
}

function clayFilter(defs, id, u, k, { blur, boil, depth, grain, shadow }) {
  const f = svg('filter', { id, x: '-15%', y: '-15%', width: '130%', height: '135%', 'color-interpolation-filters': 'sRGB' }, defs);
  const p = (tag, a) => svg(tag, a, f);
  let src = 'SourceGraphic';
  if (boil) {
    p('feTurbulence', { type: 'fractalNoise', baseFrequency: (0.012 / u).toFixed(5), numOctaves: 2, seed: 7 + k * 23, result: 'w' });
    p('feDisplacementMap', { in: 'SourceGraphic', in2: 'w', scale: (boil * u).toFixed(2), xChannelSelector: 'R', yChannelSelector: 'G', result: 's' });
    src = 's';
  }
  p('feGaussianBlur', { in: src, stdDeviation: (blur * u).toFixed(2), result: 'b' });
  // fixed surface grain (same seed every frame = the clay's own texture, not noise)
  p('feTurbulence', { type: 'fractalNoise', baseFrequency: (0.14 / u).toFixed(4), numOctaves: 2, seed: 3, result: 'g' });
  p('feComposite', { in: 'b', in2: 'g', operator: 'arithmetic', k1: 0, k2: 1, k3: grain, k4: -grain / 2, result: 'h' });
  const dl = p('feDiffuseLighting', { in: 'h', surfaceScale: depth, diffuseConstant: 1.22, 'lighting-color': '#FFF4E6', result: 'lit' });
  svg('feDistantLight', { azimuth: 225, elevation: 50 }, dl);
  p('feComposite', { in: src, in2: 'lit', operator: 'arithmetic', k1: 1.06, k2: 0, k3: 0, k4: 0, result: 'col' });
  p('feComposite', { in: 'col', in2: src, operator: 'in', result: 'clay' });
  if (shadow) {
    const [dx, dy, sb, a] = shadow;
    p('feColorMatrix', { in: src, type: 'matrix', values: `0 0 0 0 0.10  0 0 0 0 0.07  0 0 0 0 0.12  0 0 0 ${a} 0`, result: 'sa' });
    p('feGaussianBlur', { in: 'sa', stdDeviation: (sb * u).toFixed(2), result: 'sb' });
    p('feOffset', { in: 'sb', dx: (dx * u).toFixed(2), dy: (dy * u).toFixed(2), result: 'so' });
    const m = p('feMerge', {});
    svg('feMergeNode', { in: 'so' }, m);
    svg('feMergeNode', { in: 'clay' }, m);
  }
}

// ---------- clay pieces ----------

/** lumpy closed blob through points (Catmull-Rom → cubic Bézier), wobble fixed by seed */
export function blobPath(pts, wob = 0, seed = 1) {
  const P = pts.map(([x, y], i) => [x + (rand(seed + i * 1.31) - 0.5) * wob, y + (rand(seed + i * 2.17 + 9) - 0.5) * wob]);
  const n = P.length;
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
/** ellipse-ish blob */
export function ovalPath(cx, cy, rx, ry, wob = 0, seed = 1, n = 10) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return blobPath(pts, wob, seed);
}
/** open smooth path through points */
export function linePath(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** fingerprint whorl pressed into the clay (fixed per object) */
export function thumb(parent, S, cx, cy, r, rot, seed, base) {
  const u = S.u;
  const g = svg('g', { transform: `rotate(${rot} ${cx} ${cy})`, 'data-name': 'Thumbprint', opacity: 0.6 }, parent);
  const n = 6 + Math.floor(rand(seed) * 3);
  const dark = shade(base, 0.8), lite = shade(base, 1.22);
  for (let i = 1; i <= n; i++) {
    const rx = (r * i) / n, ry = rx * 0.7;
    const a0 = rand(seed + i * 4.1) * Math.PI * 2, span = Math.PI * (1.1 + rand(seed + i * 7.3) * 0.75);
    const pts = [];
    for (let j = 0; j <= 18; j++) { const a = a0 + (span * j) / 18; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    const d = linePath(pts);
    svg('path', { d, fill: 'none', stroke: lite, 'stroke-width': (1.3 * u).toFixed(2), 'stroke-linecap': 'round', opacity: 0.45, transform: `translate(${0.9 * u} ${1.2 * u})` }, g);
    svg('path', { d, fill: 'none', stroke: dark, 'stroke-width': (1.3 * u).toFixed(2), 'stroke-linecap': 'round', opacity: 0.55 }, g);
  }
  return g;
}
/** sculpting-tool drag marks */
export function smears(parent, S, x, y, w, h, n, seed, base) {
  const u = S.u;
  for (let i = 0; i < n; i++) {
    const sx = x + rand(seed + i * 3.3) * w, sy = y + rand(seed + i * 5.9) * h, len = (14 + rand(seed + i) * 26) * u;
    const a = (rand(seed + i * 8.1) - 0.5) * 0.6;
    const d = `M${sx} ${sy} q ${len / 2} ${-4 * u + a * 10 * u} ${len} ${a * len}`;
    svg('path', { d, fill: 'none', stroke: shade(base, i % 2 ? 0.86 : 1.16), 'stroke-width': ((1.6 + rand(seed + i * 2) * 1.6) * u).toFixed(2), 'stroke-linecap': 'round', opacity: 0.6 }, parent);
  }
}

/** rolled clay coil */
export function coil(parent, d, color, width, name) {
  return svg('path', { d, fill: 'none', stroke: color, 'stroke-width': width.toFixed(1), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(name ? { 'data-name': name } : {}) }, parent);
}
/** clay letters (puffed with a round stroke of the same colour) */
export function clayText(parent, S, str, x, y, size, fill, { anchor = 'start', weight = 800, name, spacing = 0.01 } = {}) {
  const t = svg('text', {
    x, y, fill, stroke: fill, 'stroke-width': (size * 0.07).toFixed(1), 'stroke-linejoin': 'round', 'paint-order': 'stroke',
    'text-anchor': anchor, 'data-name': name ?? `Clay letters ${str}`,
    style: `font-family:${FONT.clay};font-weight:${weight};font-size:${size}px;letter-spacing:${spacing}em`,
  }, parent);
  t.textContent = str;
  return t;
}

/**
 * Cream clay tag with words pressed into it. Returns { g, w, h, bx, by } (g is centred on its anchor for poses).
 * anchor: 'l' | 'c' | 'r' horizontally; y = tag centre.
 */
export function tag(parent, S, str, x, y, { size = 34, anchor = 'l', fill = PAL.tag, ink = PAL.ink, name, seed = 3, upper = false } = {}) {
  const u = S.u;
  const g = svg('g', { 'data-name': name ?? `Tag ${str}` }, parent);
  const inner = svg('g', {}, g);
  S.clay(inner, 't', seed);
  const slab = svg('path', { fill }, inner);
  const tid = `tagtxt-${S.id}-${Math.round(x)}-${Math.round(y)}-${seed}`;
  const font = `font-family:${FONT.tag};font-weight:800;font-size:${size}px;letter-spacing:${upper ? 0.06 : 0.005}em`;
  // lit lower edge of the pressed letters = a <use> copy (no second text node, so the layout lint sees one text)
  const lite = svg('use', { href: `#${tid}`, fill: shade(fill, 1.25), transform: `translate(${0.9 * u} ${1.3 * u})` }, inner);
  const inkG = svg('g', { fill: ink }, inner);
  const txt = svg('text', { id: tid, style: font }, inkG);
  txt.textContent = upper ? str.toUpperCase() : str;
  const tw = txt.getComputedTextLength();
  const padX = size * 0.62, h = size * 1.62, w = tw + padX * 2;
  const x0 = anchor === 'l' ? x : anchor === 'r' ? x - w : x - w / 2, y0 = y - h / 2;
  const r = h * 0.42;
  slab.setAttribute('d', blobPath([
    [x0 + r * 0.3, y0], [x0 + w * 0.5, y0 - 1.5 * u], [x0 + w - r * 0.3, y0 + 1 * u], [x0 + w, y0 + h * 0.5], [x0 + w - r * 0.3, y0 + h],
    [x0 + w * 0.5, y0 + h + 1.5 * u], [x0 + r * 0.3, y0 + h - 1 * u], [x0, y0 + h * 0.5],
  ], 2.5 * u, seed));
  txt.setAttribute('x', x0 + padX); txt.setAttribute('y', y0 + h * 0.5 + size * 0.36);
  thumb(inner, S, x0 + w * (0.25 + rand(seed) * 0.5), y0 + h * 0.5, h * 0.42, rand(seed + 1) * 180, seed + 5, fill);
  // put the thumbprint under the letters
  inner.insertBefore(inner.lastChild, lite);
  return { g, w, h, x0, y0, bx: x0 + w / 2, by: y0 + h };
}

/** a tag that is thumb-pressed onto the set at time at (local, stepped) */
export function pressOn(T, t, at) {
  const p = replace(t, at, PRESS, { sx: 1, sy: 1, o: 0 });
  pose(T.g, p, T.bx, T.by);
}

// ---------- set pieces ----------

/** rolled-clay sea: coils from yTop down past yBot. Returns the group. Front coil optional. */
export function sea(S, parent, yTop, yBot, { seed = 1, n = 8, x0 = -120, x1, pal = PAL.sea } = {}) {
  const u = S.u, W = S.W;
  x1 = x1 ?? W + 120;
  const g = S.group(parent, 'Sea of rolled clay');
  const gap = (yBot - yTop) / n;
  const width = gap * 1.38;
  const rows = [];
  for (let i = n - 1; i >= 0; i--) {
    const y = yTop + width * 0.5 + gap * i;
    const pts = [];
    const segs = 9;
    for (let j = 0; j <= segs; j++) {
      const x = x0 + ((x1 - x0) * j) / segs;
      pts.push([x, y + Math.sin(j * 1.7 + i * 2.3 + seed) * (5 + i * 0.6) * u + (rand(seed + i * 13 + j) - 0.5) * 6 * u]);
    }
    const col = pal[Math.min(pal.length - 1, i)];
    const c = coil(g, linePath(pts), col, width, `Sea coil ${i + 1}`);
    S.clay(c, 'k', seed + i);
    rows.push({ y, col, node: c });
    // a few pressed thumbprints on the coil
    for (let k = 0; k < 3; k++) {
      const tx = x0 + 140 * u + rand(seed + i * 7 + k) * (x1 - x0 - 280 * u);
      thumb(g, S, tx, y + (rand(seed + k + i) - 0.5) * width * 0.25, width * 0.3, rand(seed + i + k * 3) * 60 - 30, seed * 31 + i * 7 + k, col);
    }
  }
  return { g, rows, gap, width };
}

/** surface curls (small rolled crests along the top coil) */
export function crests(S, parent, y, seed = 2, every = 210) {
  const u = S.u, g = S.group(parent, 'Wave crests');
  for (let x = -40 * u + rand(seed) * 80 * u, i = 0; x < S.W + 60 * u; x += (every + rand(seed + i) * 90) * u, i++) {
    const r = (12 + rand(seed + i * 2) * 8) * u;
    const d = `M${x - r * 2.2} ${y + r * 0.6} q ${r * 1.2} ${-r * 1.6} ${r * 2.4} ${-r * 0.9} q ${r * 1.0} ${r * 0.5} ${r * 0.2} ${r * 1.0}`;
    const c = coil(g, d, PAL.surf, r * 0.95);
    S.clay(c, 's', seed + i);
  }
  return g;
}

/** warm smeared backdrop board (sky) with clay clouds */
export function backdrop(S, parent, y0, y1, { seed = 4, color = PAL.sky, clouds = [] } = {}) {
  const u = S.u, W = S.W;
  const g = S.group(parent, 'Backdrop (smeared clay board)');
  const inner = svg('g', {}, g);
  S.clay(inner, 'b');
  svg('rect', { x: -40 * u, y: y0 - 40 * u, width: W + 80 * u, height: y1 - y0 + 80 * u, fill: color }, inner);
  // thumb-smeared strokes, mostly horizontal, like clay pushed on a board
  for (let i = 0; i < 46; i++) {
    const x = rand(seed + i * 1.7) * W, y = y0 + rand(seed + i * 2.9) * (y1 - y0);
    const len = (90 + rand(seed + i) * 160) * u, wdt = (20 + rand(seed + i * 4.4) * 26) * u;
    const col = i % 3 === 0 ? shade(color, 0.93) : shade(color, 1.1);
    coil(inner, `M${x} ${y} q ${len * 0.5} ${(rand(seed + i * 6) - 0.5) * 22 * u} ${len} ${(rand(seed + i * 9) - 0.5) * 14 * u}`, col, wdt).setAttribute('opacity', 0.7);
  }
  for (const [cx, cy, r, sd] of clouds) {
    const cg = svg('g', { 'data-name': 'Clay cloud' }, g);
    S.clay(cg, 's', sd);
    // a few pinched-off balls pressed together, flat bottom
    const balls = [[-1.25, 0.15, 0.55], [-0.55, -0.2, 0.8], [0.3, -0.35, 0.95], [1.1, -0.05, 0.7], [1.75, 0.2, 0.45]];
    for (const [bx, by, br] of balls) svg('path', { d: ovalPath(cx + bx * r, cy + by * r, br * r * 1.05, br * r * 0.82, r * 0.06, sd + bx * 3), fill: PAL.cloud }, cg);
    svg('path', { d: blobPath([[cx - r * 1.7, cy + r * 0.1], [cx + r * 2.15, cy + r * 0.1], [cx + r * 2.0, cy + r * 0.5], [cx - r * 1.6, cy + r * 0.52]], r * 0.05, sd + 9), fill: PAL.cloud }, cg);
    thumb(cg, S, cx + r * 0.2, cy - r * 0.2, r * 0.55, 20, sd + 3, PAL.cloud);
  }
  return g;
}

/** the grey clay submarine, built around (0,0), length len, facing right. Returns group. */
export function submarine(S, parent, len, seed = 9, name = 'Clay submarine', kind = 'k') {
  const u = S.u, h = len * 0.17;
  const g = svg('g', { 'data-name': name }, parent);
  const inner = svg('g', {}, g);
  S.clay(inner, kind, seed);
  // tail fin + prop (behind)
  svg('path', { d: blobPath([[-len * 0.44, -h * 0.1], [-len * 0.53, -h * 0.62], [-len * 0.56, -h * 0.55], [-len * 0.54, 0], [-len * 0.56, h * 0.5], [-len * 0.53, h * 0.56], [-len * 0.44, h * 0.1]], 2 * u, seed + 1), fill: PAL.subLo }, inner);
  svg('path', { d: ovalPath(-len * 0.555, 0, len * 0.012, h * 0.2, 0, seed + 8, 8), fill: '#5A5F63' }, inner);
  // hull: long lumpy capsule
  const hull = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const c = Math.cos(a), sgn = Math.sign(c);
    const x = sgn * Math.pow(Math.abs(c), 0.45) * len * 0.5 + (c > 0 ? len * 0.0 : 0);
    hull.push([x, Math.sin(a) * h * (c > 0 ? 0.52 : 0.48)]);
  }
  svg('path', { d: blobPath(hull, 4 * u, seed + 2), fill: PAL.sub, 'data-name': 'Hull' }, inner);
  // sail (conning tower) — a squashed lump, slightly forward of centre
  svg('path', { d: blobPath([[-len * 0.02, -h * 0.4], [len * 0.0, -h * 1.12], [len * 0.1, -h * 1.22], [len * 0.2, -h * 1.1], [len * 0.22, -h * 0.4]], 3 * u, seed + 3), fill: PAL.sub, 'data-name': 'Sail' }, inner);
  // periscope: a bent wire (not clay)
  // pressed seam lines + hand marks
  for (const fx of [-0.3, -0.12, 0.3]) svg('path', { d: `M${len * fx} ${-h * 0.42} q ${4 * u} ${h * 0.45} 0 ${h * 0.86}`, fill: 'none', stroke: PAL.subLo, 'stroke-width': 2.2 * u, opacity: 0.7, 'stroke-linecap': 'round' }, inner);
  thumb(inner, S, -len * 0.2, -h * 0.05, h * 0.42, 14, seed + 4, PAL.sub);
  thumb(inner, S, len * 0.12, -h * 0.75, h * 0.28, -30, seed + 5, PAL.sub);
  smears(inner, S, -len * 0.4, -h * 0.25, len * 0.75, h * 0.5, 7, seed + 6, PAL.sub);
  svg('path', { d: `M${len * 0.05} ${-h * 1.15} l 0 ${-h * 0.55} l ${len * 0.05} 0`, fill: 'none', stroke: '#5C5F62', 'stroke-width': 3 * u, 'stroke-linecap': 'round', 'data-name': 'Periscope wire' }, g);
  return g;
}

/** simple grey clay ship (featureless destroyer), base at (0,0) waterline, facing dir (1 = right) */
export function ship(S, parent, len, seed, dir = 1, name = 'Clay ship') {
  const u = S.u, h = len * 0.12;
  const g = svg('g', { 'data-name': name, transform: dir < 0 ? 'scale(-1 1)' : '' }, parent);
  // toothpick mast + yard (real wood, not clay) — behind the superstructure
  svg('path', { d: `M${len * 0.13} ${-h * 1.9} L ${len * 0.11} ${-h * 3.7}`, stroke: '#A8814A', 'stroke-width': 5 * u, 'stroke-linecap': 'round', 'data-name': 'Toothpick mast' }, g);
  svg('path', { d: `M${len * 0.06} ${-h * 3.1} L ${len * 0.17} ${-h * 3.15}`, stroke: '#A8814A', 'stroke-width': 4 * u, 'stroke-linecap': 'round' }, g);
  const inner = svg('g', {}, g);
  S.clay(inner, 'c', seed);
  const lo = PAL.shipLo;
  // funnels (raked back), bridge, turrets, then the hull on top of their feet
  for (const [fx, fw] of [[-0.08, 0.07], [-0.24, 0.06]]) svg('path', { d: blobPath([[len * fx, -h * 0.9], [len * (fx - 0.025), -h * 2.15], [len * (fx + fw - 0.03), -h * 2.2], [len * (fx + fw), -h * 0.9]], 1.5 * u, seed + fx * 10), fill: lo }, inner);
  svg('path', { d: blobPath([[len * 0.04, -h * 0.9], [len * 0.06, -h * 1.75], [len * 0.2, -h * 1.85], [len * 0.25, -h * 0.9]], 2 * u, seed + 1), fill: PAL.ship }, inner);
  for (const tx of [0.33, -0.37]) svg('path', { d: ovalPath(len * tx, -h * 1.0, len * 0.045, h * 0.38, 1 * u, seed + tx * 7, 8), fill: lo }, inner);
  svg('path', { d: `M${len * 0.33} ${-h * 1.1} l ${len * 0.08} ${-h * 0.12}`, stroke: lo, 'stroke-width': 4 * u, 'stroke-linecap': 'round', fill: 'none' }, inner);
  svg('path', { d: blobPath([[-len * 0.5, -h * 0.75], [-len * 0.1, -h * 0.85], [len * 0.3, -h * 0.98], [len * 0.53, -h * 1.3], [len * 0.44, h * 0.3], [-len * 0.47, h * 0.3]], 2 * u, seed + 2), fill: PAL.ship }, inner);
  svg('path', { d: `M${-len * 0.44} ${-h * 0.35} L ${len * 0.42} ${-h * 0.5}`, stroke: lo, 'stroke-width': 2.2 * u, opacity: 0.8, fill: 'none', 'stroke-linecap': 'round' }, inner);
  thumb(inner, S, -len * 0.05, -h * 0.25, h * 0.5, 0, seed + 4, PAL.ship);
  return g;
}

/**
 * Featureless clay figure. Origin = floor point. h = height. opts: { body, lean, wide, head, flip, poses }.
 * Arm poses are REPLACEMENT parts: every pose is built once; setPose() shows exactly one.
 */
export function figure(S, parent, h, { body = PAL.uni[0], lean = 0, wide = 1, headR = 0.1, flip = false, seed = 20, name = 'Clay figure', poses = ['down'] } = {}) {
  const u = S.u;
  const outer = svg('g', { 'data-name': name }, parent);
  // contact shadow on the floor (not clay)
  svg('ellipse', { cx: 0, cy: 0, rx: h * 0.24 * wide, ry: h * 0.035, fill: '#1c120c', opacity: 0.38 }, outer);
  const g = svg('g', { transform: `${flip ? 'scale(-1 1) ' : ''}rotate(${lean})` }, outer);
  const inner = svg('g', {}, g);
  S.clay(inner, 'c', seed);
  const sw = h * 0.15 * wide; // shoulder half width
  // legs
  for (const lx of [-0.065, 0.065]) coil(inner, `M${lx * h * wide} ${-h * 0.2} L ${lx * h * wide * 1.05} ${-h * 0.035}`, shade(body, 0.8), h * 0.085);
  // torso (peg shape)
  svg('path', { d: blobPath([[-h * 0.17 * wide, -h * 0.16], [-sw, -h * 0.6], [-sw * 0.75, -h * 0.7], [0, -h * 0.72], [sw * 0.75, -h * 0.7], [sw, -h * 0.6], [h * 0.17 * wide, -h * 0.16], [0, -h * 0.13]], 2 * u, seed + 1), fill: body, 'data-name': `${name} body` }, inner);
  // belt line pressed in
  svg('path', { d: `M${-h * 0.15 * wide} ${-h * 0.33} q ${h * 0.15 * wide} ${h * 0.025} ${h * 0.3 * wide} 0`, fill: 'none', stroke: shade(body, 0.7), 'stroke-width': 2.4 * u, 'stroke-linecap': 'round' }, inner);
  thumb(inner, S, -h * 0.03, -h * 0.47, h * 0.09, 30, seed + 2, body);
  // head (no face) + cap
  const hr = h * headR;
  svg('path', { d: ovalPath(h * 0.01, -h * 0.72 - hr * 0.95, hr, hr * 1.06, hr * 0.08, seed + 3), fill: PAL.head, 'data-name': `${name} head (no face)` }, inner);
  thumb(inner, S, h * 0.03, -h * 0.72 - hr * 0.8, hr * 0.5, -20, seed + 4, PAL.head);
  const capY = -h * 0.72 - hr * 1.72;
  svg('path', { d: ovalPath(h * 0.0, capY, hr * 1.22, hr * 0.36, hr * 0.06, seed + 5), fill: PAL.cap }, inner);
  svg('path', { d: blobPath([[hr * 0.2, capY + hr * 0.2], [hr * 1.3, capY + hr * 0.42], [hr * 1.2, capY + hr * 0.58], [hr * 0.2, capY + hr * 0.45]], 0, seed + 6), fill: '#151a2e' }, inner);
  // arms (replacement poses)
  const shL = [-sw * 0.92, -h * 0.64], shR = [sw * 0.92, -h * 0.64];
  const aw = h * 0.07, hand = h * 0.04;
  const A = {
    down: [[shL, [-sw * 1.15, -h * 0.5], [-sw * 1.2, -h * 0.36]], [shR, [sw * 1.15, -h * 0.5], [sw * 1.2, -h * 0.36]]],
    point: [[shL, [-sw * 1.12, -h * 0.5], [-sw * 1.15, -h * 0.37]], [shR, [sw * 1.6, -h * 0.62], [h * 0.42, -h * 0.6]]],
    crossed: [[shL, [-sw * 0.9, -h * 0.5], [sw * 0.55, -h * 0.5]], [shR, [sw * 0.9, -h * 0.47], [-sw * 0.5, -h * 0.46]]],
    up: [[shL, [-sw * 1.12, -h * 0.5], [-sw * 1.16, -h * 0.37]], [shR, [sw * 1.35, -h * 0.82], [sw * 1.4, -h * 1.0]]],
    up2: [[shL, [-sw * 1.12, -h * 0.5], [-sw * 1.16, -h * 0.37]], [shR, [sw * 1.3, -h * 0.76], [sw * 1.45, -h * 0.9]]],
    stop: [[shL, [-sw * 1.12, -h * 0.5], [-sw * 1.16, -h * 0.37]], [shR, [sw * 1.7, -h * 0.66], [h * 0.36, -h * 0.82]]],
    stop2: [[shL, [-sw * 1.12, -h * 0.5], [-sw * 1.16, -h * 0.37]], [shR, [sw * 1.6, -h * 0.62], [h * 0.4, -h * 0.72]]],
    hips: [[shL, [-sw * 1.5, -h * 0.5], [-sw * 0.9, -h * 0.36]], [shR, [sw * 1.5, -h * 0.5], [sw * 0.9, -h * 0.36]]],
  };
  const parts = {};
  for (const pn of poses) {
    const pg = svg('g', { 'data-name': `${name} arms: ${pn}`, display: 'none' }, inner);
    for (const arm of A[pn]) {
      coil(pg, linePath(arm), shade(body, 1.04), aw);
      const e = arm[arm.length - 1];
      svg('path', { d: ovalPath(e[0], e[1], hand * (pn.startsWith('stop') && arm === A[pn][1] ? 1.35 : 1), hand * (pn.startsWith('stop') && arm === A[pn][1] ? 1.5 : 1), hand * 0.1, seed + 9), fill: PAL.head }, pg);
    }
    parts[pn] = pg;
  }
  const api = {
    g: outer, inner, body: g,
    setPose(pn) { for (const [k, v] of Object.entries(parts)) v.setAttribute('display', k === pn ? 'inline' : 'none'); },
  };
  api.setPose(poses[0]);
  return api;
}

/** kelp: olive coils standing up from the sea floor (foreground), sway is stepped */
export function kelp(S, parent, x, yBase, hgt, seed) {
  const u = S.u;
  const g = svg('g', { 'data-name': 'Kelp (clay coil)' }, parent);
  const strands = [];
  for (let i = 0; i < 2; i++) {
    const c = coil(g, 'M0 0', i ? '#4F7A3A' : '#5E8C42', (24 - i * 6) * u);
    strands.push({ c, h: hgt * (1 - i * 0.28), dx: (i ? 22 : 0) * u, ph: seed + i * 1.7 });
  }
  const wraps = strands.map(st => { st.c.setAttribute('d', `M${x + st.dx} ${yBase} L ${x + st.dx} ${yBase - st.h}`); return st; });
  const node = svg('g', {}, g);
  svg('rect', { x: x - 70 * u, y: yBase - hgt - 30 * u, width: 170 * u, height: hgt + 60 * u, fill: 'none' }, node);
  for (const st of wraps) node.appendChild(st.c);
  S.clay(node, 's', seed);
  return {
    g,
    update(q) {
      for (const st of wraps) {
        const pts = [];
        for (let j = 0; j <= 5; j++) {
          const f = j / 5;
          pts.push([x + st.dx + Math.sin(q * 1.4 + st.ph + f * 2.2) * f * 22 * u + Math.sin(f * 5 + st.ph) * 7 * u, yBase - st.h * f]);
        }
        st.c.setAttribute('d', linePath(pts));
      }
    },
  };
}

/** olive clay torpedo, centred at (0,0), length len, nose to the right */
export function torpedo(S, parent, len, seed = 300) {
  const u = S.u, r = len * 0.075;
  const g = svg('g', { 'data-name': 'Nuclear torpedo (clay)' }, parent);
  const inner = svg('g', {}, g);
  S.clay(inner, 'c', seed);
  svg('path', { d: blobPath([[-len * 0.5, -r * 0.9], [-len * 0.56, -r * 1.7], [-len * 0.6, -r * 1.6], [-len * 0.58, 0], [-len * 0.6, r * 1.6], [-len * 0.56, r * 1.7], [-len * 0.5, r * 0.9]], 1.5 * u, seed + 1), fill: shade(PAL.torp, 0.8) }, inner);
  const pts = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, c = Math.cos(a); pts.push([Math.sign(c) * Math.pow(Math.abs(c), c > 0 ? 0.6 : 0.25) * len * 0.5, Math.sin(a) * r]); }
  svg('path', { d: blobPath(pts, 2 * u, seed + 2), fill: PAL.torp }, inner);
  svg('path', { d: blobPath([[len * 0.3, -r * 0.98], [len * 0.36, -r * 0.95], [len * 0.36, r * 0.95], [len * 0.3, r * 0.98]], 1 * u, seed + 3), fill: PAL.torpBand }, inner);
  for (const fx of [-0.2, 0.05]) svg('path', { d: `M${len * fx} ${-r * 0.92} q ${4 * u} ${r * 0.9} 0 ${r * 1.84}`, fill: 'none', stroke: shade(PAL.torp, 0.7), 'stroke-width': 2.2 * u, 'stroke-linecap': 'round' }, inner);
  thumb(inner, S, -len * 0.08, -r * 0.2, r * 0.6, 10, seed + 4, PAL.torp);
  return g;
}

/** the cut-open hull: grey sliced rim + ochre interior + ribs + floor. Returns interior box. */
export function cutaway(S, parent, x, y, w, h, seed = 400, dim = 1) {
  const u = S.u, rim = 44 * u, r = h * 0.5;
  const g = svg('g', { 'data-name': 'Hull cutaway' }, parent);
  const outer = svg('g', {}, g);
  S.clay(outer, 'c', seed);
  const cap = (x0, y0, w0, h0) => {
    const rr = Math.min(h0 * 0.5, w0 * 0.2), pts = [];
    for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 - (i / 8) * Math.PI; pts.push([x0 + rr + Math.cos(a) * rr, y0 + h0 / 2 + Math.sin(a) * h0 / 2]); }
    for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 - (i / 8) * Math.PI; pts.push([x0 + w0 - rr + Math.cos(a) * rr, y0 + h0 / 2 + Math.sin(a) * h0 / 2]); }
    return pts;
  };
  svg('path', { d: blobPath(cap(x, y, w, h), 5 * u, seed + 1), fill: shade(PAL.subCut, dim), 'data-name': 'Sliced hull rim' }, outer);
  // strata lines on the cut face (the knife went through layers of clay)
  for (let k = 1; k <= 2; k++) svg('path', { d: blobPath(cap(x + rim * k / 3, y + rim * k / 3, w - rim * 2 * k / 3, h - rim * 2 * k / 3), 3 * u, seed + 2 + k), fill: 'none', stroke: shade(PAL.subCut, 0.85 * dim), 'stroke-width': 2 * u, opacity: 0.7 }, outer);
  const ix = x + rim, iy = y + rim, iw = w - 2 * rim, ih = h - 2 * rim;
  const wall = svg('g', {}, g);
  S.clay(wall, 'b');
  svg('path', { d: blobPath(cap(ix, iy, iw, ih), 2 * u, seed + 6), fill: shade(PAL.wall, dim) }, wall);
  const ribs = svg('g', {}, g);
  S.clay(ribs, 'c', seed + 7);
  for (let k = 1; k < 9; k++) {
    const rx = ix + (iw * k) / 9;
    coil(ribs, `M${rx} ${iy + 10 * u} L ${rx + 3 * u} ${iy + ih * 0.78}`, shade(PAL.wallLo, dim), 18 * u);
  }
  const floorY = iy + ih * 0.8;
  const fl = svg('g', {}, g);
  S.clay(fl, 'c', seed + 8);
  svg('path', { d: blobPath([[ix + Math.min(iw, ih) * 0.1, floorY], [ix + iw - Math.min(iw, ih) * 0.1, floorY - 3 * u], [ix + iw - Math.min(iw, ih) * 0.2, iy + ih - 6 * u], [ix + Math.min(iw, ih) * 0.2, iy + ih - 6 * u]], 3 * u, seed + 9), fill: shade(PAL.floor, dim), 'data-name': 'Deck' }, fl);
  return { g, ix, iy, iw, ih, floorY };
}
