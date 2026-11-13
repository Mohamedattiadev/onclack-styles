// BLIND EMBOSS — shared sheet: thick cotton paper pressed with relief dies, seen only by a low moving lamp.
//
// How it works (all DOM/SVG, no per-frame canvas):
//  1. Every picture is drawn as a HEIGHT MAP in grey: #808080 = paper level, lighter = raised (embossed),
//     darker = pressed in (debossed). Paper tooth is baked once into a small tile that move with the paper.
//  2. One SVG filter turns that height map into light: two blurs (crisp edge + soft cotton shoulder) →
//     feDiffuseLighting with a POINT light (the lamp) at a low height → warm light + cool ambient.
//     The lamp is in screen space; the paper (camera) moves under it — like sliding a sheet under a desk lamp.
//  3. The single inked element (the NO) lives in a second SVG, multiplied over the lit paper so the
//     relief shading still shows through the ink.
// Imperfection is designed once (seeded per sheet), never boils per frame.
import { svg, el, rand, clamp, spring } from '/onclack-styles/engine/lib/anim.js';

export const INK = '#1F2C86';          // ultramarine letterpress ink — the only colour in the film
export const PAPER = '#EFEBE2';        // cotton rag, lit flat (used for the stage background)
let uid = 0;

/** grey for a height level (-1 = deepest press, 0 = paper, +1 = highest relief) */
export const hgt = (lv) => { const v = Math.round(128 + 127 * clamp(lv, -1, 1)); return `rgb(${v},${v},${v})`; };

/** Die press: 0 before t0, bites in over ~4 frames, small paper rebound, settles at 1. */
export const press = (t, t0, dur = 0.14) => (t < t0 ? 0 : clamp(spring(t - t0, { stiffness: 900, damping: 30 }) * 1.0, 0, 1.08));

/** Paper tooth tile (fibre + grain), made once per size and shared by every sheet. */
const tileCache = new Map();
function toothTile(size, seed) {
  const key = size + ':' + seed;
  if (tileCache.has(key)) return tileCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  // felted cotton: coarse random cells, upscaled + blurred (no grid), plus a fine speckle
  const sm = document.createElement('canvas'); const n = Math.round(size / 2.5); sm.width = sm.height = n;
  const sg = sm.getContext('2d'); const si = sg.createImageData(n, n);
  for (let i = 0; i < n * n; i++) { const v = Math.round(128 + (rand(seed * 977 + i * 1.371) - 0.5) * 90); si.data.set([v, v, v, 255], i * 4); }
  sg.putImageData(si, 0, 0);
  g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
  g.filter = 'blur(1px)'; g.imageSmoothingEnabled = true;
  for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) g.drawImage(sm, dx, dy, size, size); // wrap so the tile has no seam
  g.filter = 'none';
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < size * size; i++) { const d = (rand(seed * 31 + i) - 0.5) * 22; for (let k = 0; k < 3; k++) img.data[i * 4 + k] = Math.max(0, Math.min(255, img.data[i * 4 + k] + d)); }
  g.putImageData(img, 0, 0);
  // cotton fibres: short curved hairs, a few raised, a few pressed
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const r = (k) => rand(seed * 101 + i * 13 + k);
    const x = r(1) * size, y = r(2) * size, len = 8 + r(3) * 26, ang = r(4) * Math.PI * 2, bend = (r(5) - 0.5) * 0.9;
    const up = r(6) > 0.35;
    g.strokeStyle = up ? 'rgba(200,200,200,0.55)' : 'rgba(70,70,70,0.45)';
    g.lineWidth = 0.8 + r(7) * 0.9;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(ang + bend) * len * 0.5, y + Math.sin(ang + bend) * len * 0.5, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }
  const url = c.toDataURL('image/png');
  tileCache.set(key, url);
  return url;
}

/**
 * Build a sheet inside `root`.
 * Returns { world, ink, inkDefs, cam(x, y, s, rot), lamp({x,y,z,power}), enter(t), W, H, L }.
 * `world` = SVG group in WORLD px (same as frame px at camera home) — draw height-map shapes into it.
 */
export function makeSheet(root, ctx, { seed = 1, name = 'Cotton sheet', blur = 3, soft = 9, relief = 8 } = {}) {
  const { width: W, height: H, layout: L } = ctx;
  const id = 'emb' + (++uid);
  const u = L.unit;
  const sheet = el('div', { 'data-name': name, style: {
    position: 'absolute', inset: '0', isolation: 'isolate', background: PAPER, willChange: 'transform',
  } }, root);
  // soft shadow the sheet throws when it slides over the previous one
  el('div', { style: { position: 'absolute', top: '0', bottom: '0', left: '-1px', width: '1px',
    boxShadow: `${-14 * u}px 0 ${36 * u}px ${6 * u}px rgba(40,44,58,0.35)` } }, sheet);

  const lit = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;inset:0;display:block' }, sheet);
  const defs = svg('defs', {}, lit);
  const f = svg('filter', { id, x: 0, y: 0, width: W, height: H, filterUnits: 'userSpaceOnUse',
    primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, defs);
  svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: blur * u, result: 'crisp' }, f);
  svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: soft * u, result: 'shoulder' }, f);
  svg('feComposite', { in: 'crisp', in2: 'shoulder', operator: 'arithmetic', k1: 0, k2: 0.62, k3: 0.38, k4: 0, result: 'h' }, f);
  svg('feColorMatrix', { in: 'h', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0', result: 'ha' }, f);
  const dl = svg('feDiffuseLighting', { in: 'ha', surfaceScale: relief * u, diffuseConstant: 1, 'lighting-color': '#FFF2DE', result: 'lit' }, f);
  const pl = svg('fePointLight', { x: 0, y: 0, z: 300 }, dl);
  svg('feFlood', { 'flood-color': '#A7ABB4', result: 'amb' }, f);
  const mix = svg('feComposite', { in: 'lit', in2: 'amb', operator: 'arithmetic', k1: 0, k2: 1.35, k3: 0.82, k4: 0 }, f);

  const fg = svg('g', { filter: `url(#${id})` }, lit);
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: hgt(0) }, fg);
  const camG = svg('g', {}, fg);
  // paper tooth over everything — moves with the paper
  const pad = Math.max(W, H);
  // (no low-frequency cockle: an 8-bit height map turns smooth slopes into contour 'cracks' under raking light)
  const world = svg('g', { 'data-name': 'Relief (height map)' }, camG);
  const pat = svg('pattern', { id: id + 'p', patternUnits: 'userSpaceOnUse', width: 420, height: 420 }, defs);
  svg('image', { href: toothTile(420, seed), x: 0, y: 0, width: 420, height: 420 }, pat);
  const tooth = svg('rect', { x: -pad, y: -pad, width: W + 2 * pad, height: H + 2 * pad, fill: `url(#${id}p)`, opacity: 0.032 }, camG);
  tooth.style.pointerEvents = 'none';

  // warm cotton tone (one grade layer, multiplied; the light itself stays neutral-warm)
  el('div', { 'data-name': 'Paper tone', style: { position: 'absolute', inset: '0', background: '#F8F3EA', mixBlendMode: 'multiply', pointerEvents: 'none' } }, sheet);
  // ink layer (multiplied over the lit paper)
  const inkSvg = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'data-name': 'Ink layer',
    style: 'position:absolute;inset:0;display:block;mix-blend-mode:multiply' }, sheet);
  const inkDefs = svg('defs', {}, inkSvg);
  const fi = svg('filter', { id: id + 'i', x: '-5%', y: '-5%', width: '110%', height: '110%', 'color-interpolation-filters': 'sRGB' }, inkDefs);
  // letterpress ink: uneven lay-down (mottle) + slightly heavier at the edges (squash)
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.55, numOctaves: 2, seed: seed * 3 + 1, result: 'n' }, fi);
  svg('feColorMatrix', { in: 'n', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.38', result: 'm' }, fi);
  svg('feComposite', { in: 'SourceGraphic', in2: 'm', operator: 'in', result: 'mottled' }, fi);
  svg('feMorphology', { in: 'SourceAlpha', operator: 'erode', radius: 3 * u, result: 'inner' }, fi);
  svg('feComposite', { in: 'SourceGraphic', in2: 'inner', operator: 'out', result: 'rim' }, fi);
  const merge = svg('feMerge', {}, fi);
  svg('feMergeNode', { in: 'mottled' }, merge); svg('feMergeNode', { in: 'rim' }, merge);
  const inkCam = svg('g', {}, inkSvg);
  const ink = svg('g', { filter: `url(#${id}i)` }, inkCam);

  let camState = { x: W / 2, y: H / 2, s: 1, r: 0 };
  return {
    W, H, L, u, sheet, world, ink, defs, inkDefs,
    /** camera: world point (x, y) at frame centre, scale s, roll r (deg) */
    cam(x = W / 2, y = H / 2, s = 1, r = 0) {
      camState = { x, y, s, r };
      const tr = `translate(${W / 2} ${H / 2}) rotate(${r}) scale(${s}) translate(${-x} ${-y})`;
      camG.setAttribute('transform', tr); inkCam.setAttribute('transform', tr);
    },
    /** lamp in SCREEN px; z = height above the paper (low = raking); power 0..1 dims it */
    lamp({ x, y, z = 260, power = 1 }) {
      // keep the lamp far away along the same direction (same elevation at the centre): a gentle falloff across
      // the sheet instead of a burnt-out hot spot when the lamp comes close
      const cx = W / 2, cy = H / 2, d = Math.hypot(x - cx, y - cy) || 1, D = Math.max(d, 1.25 * Math.max(W, H)), k = D / d;
      x = cx + (x - cx) * k; y = cy + (y - cy) * k; z = z * k;
      pl.setAttribute('x', x.toFixed(1)); pl.setAttribute('y', y.toFixed(1)); pl.setAttribute('z', (z * u).toFixed(1));
      mix.setAttribute('k2', (1.35 * power).toFixed(3));
      mix.setAttribute('k3', (0.82 + 0.12 * (1 - power)).toFixed(3));
    },
    /** new sheet slides in from the right over the old one (paper over paper), first `dur` s */
    enter(t, dur = 0.5) {
      const p = clamp(t / dur);
      const e = 1 - (1 - p) ** 3;
      sheet.style.transform = p >= 1 ? '' : `translateX(${((1 - e) * W * 1.02).toFixed(1)}px)`;
    },
    get camera() { return camState; },
  };
}

/** Small helpers to draw height-map shapes. */
export const P = {
  path: (g, d, lv, extra = {}) => svg('path', { d, fill: hgt(lv), ...extra }, g),
  line: (g, pts, w, lv, extra = {}) => svg('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: hgt(lv),
    'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra }, g),
  text: (g, str, x, y, size, lv, extra = {}) => {
    const n = svg('text', { x, y, 'font-size': size, fill: hgt(lv), 'text-anchor': 'middle', 'dominant-baseline': 'alphabetic',
      'font-family': 'Fraunces', 'font-weight': 600, ...extra }, g);
    n.textContent = str; return n;
  },
};
