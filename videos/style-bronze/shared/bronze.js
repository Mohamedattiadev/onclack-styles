// BRONZE RELIEF — shared plaque: a cast bronze frieze, lit by one fixed gallery light from the upper left.
//
// How it works (DOM/SVG only, no per-frame canvas):
//  1. Every form is drawn in WHITE into one relief group; its ALPHA is its height (field ≈ 0.3, low relief 0.5,
//     high relief 0.9). Overlapping shapes stack like modelled wax. Sunken letters are holes in the field mask.
//  2. One SVG filter turns height into cast metal: rounded shoulders (two blurs) → diffuse + specular light
//     (distant light, fixed: the plaque never "glows", it is lit) × bronze colour; verdigris collects in the
//     cavities (blur − height) and is broken up by a seeded mottle.
//  3. The SAME relief is drawn again with a "touched" filter (bare bronze, little patina) through a mask:
//     the rub mask. Rubs are short cloth strokes that grow in time — the story is told by where hands polished it.
//  4. Forms "rise" (repoussé): their height fades up from the field, never pops or scales.
import { svg, el, rand, clamp, spring, ease } from '/onclack-styles/engine/lib/anim.js';

export const C = {
  bg: '#1B1510',
  field: '#3A2C1E',       // patinated bronze (brown)
  touched: '#B27B4F',     // rubbed bare bronze (copper-brown, not gold)
  verd: '#5F8F7A',        // verdigris in the hollows
  verdPale: '#8DB09B',
  spec: '#F0C9A4',        // highlight colour of the gallery light on metal
};
export const FONT = "'Newsreader', serif";
let uid = 0;

/** height-rise 0→1 starting at t0 (wax pushed up from behind): fast start, soft settle, no overshoot */
export const rise = (t, t0, dur = 0.55) => (t <= t0 ? 0 : 1 - Math.pow(1 - clamp((t - t0) / dur), 3));

function bronzeFilter(defs, id, u, R, { base, spec = 0.9, exp = 16, patina = 1, mottle = 0.3, seed = 3, gain = 1.75, hw = 0.6, onlyHigh = false }) {
  const f = svg('filter', { id, ...R, filterUnits: 'userSpaceOnUse',
    primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, defs);
  svg('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: 1.4 * u, result: 'b1' }, f);
  svg('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: 7 * u, result: 'b2' }, f);
  svg('feComposite', { in: 'b1', in2: 'b2', operator: 'arithmetic', k2: 0.45, k3: 0.55, result: 'h0' }, f);
  // sand-cast tooth in the height itself (also dithers the 8-bit height so slopes do not band into contours)
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.55 / u, numOctaves: 2, seed: seed + 3, result: 'tn' }, f);
  svg('feColorMatrix', { in: 'tn', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0', result: 'ta' }, f);
  svg('feComposite', { in: 'h0', in2: 'ta', operator: 'arithmetic', k2: 1, k3: 0.016, k4: -0.008, result: 'h' }, f);
  const dl = svg('feDiffuseLighting', { in: 'h', surfaceScale: 16 * u, diffuseConstant: 1, 'lighting-color': '#FFFFFF', result: 'dif' }, f);
  svg('feDistantLight', { azimuth: 225, elevation: 42 }, dl);
  const sl = svg('feSpecularLighting', { in: 'h', surfaceScale: 16 * u, specularConstant: spec, specularExponent: exp, 'lighting-color': C.spec, result: 'sp' }, f);
  svg('feDistantLight', { azimuth: 225, elevation: 42 }, sl);
  svg('feComposite', { in: 'sp', in2: 'SourceAlpha', operator: 'in', result: 'spec' }, f);
  svg('feFlood', { 'flood-color': base, result: 'base' }, f);
  svg('feComposite', { in: 'base', in2: 'dif', operator: 'arithmetic', k1: gain, k4: -0.06, result: 'shaded0' }, f);
  // high points catch more of the hand (and the light): brightness weighted by height
  svg('feColorMatrix', { in: 'b2', type: 'matrix', values: `0 0 0 ${hw} ${1.2 - hw * 0.5}  0 0 0 ${hw} ${1.2 - hw * 0.5}  0 0 0 ${hw} ${1.2 - hw * 0.5}  0 0 0 0 1`, result: 'hg' }, f);
  svg('feComposite', { in: 'shaded0', in2: 'hg', operator: 'arithmetic', k1: 1, result: 'shaded' }, f);
  // casting mottle (fixed per plaque; moves with the metal)
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.017 / u, numOctaves: 4, seed, result: 'n' }, f);
  svg('feColorMatrix', { in: 'n', type: 'matrix', values: `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -0.88`, result: 'nm' }, f);
  // cavities: where the blurred height is above the local height = hollows beside raised forms
  svg('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: 9 * u, result: 'b3' }, f);
  svg('feComposite', { in: 'b3', in2: 'SourceAlpha', operator: 'arithmetic', k2: 3.2 * patina, k3: -3.2 * patina, result: 'cav' }, f);
  svg('feFlood', { 'flood-color': C.verd, result: 'g' }, f);
  svg('feComposite', { in: 'g', in2: 'cav', operator: 'in', result: 'gc' }, f);
  svg('feComposite', { in: 'gc', in2: 'nm', operator: 'arithmetic', k2: 0.55, k1: 0.6, result: 'pat' }, f);
  // a dusty green bloom over the whole field, broken by the mottle
  svg('feFlood', { 'flood-color': C.verdPale, 'flood-opacity': mottle, result: 'gp' }, f);
  svg('feComposite', { in: 'gp', in2: 'nm', operator: 'in', result: 'bloom' }, f);
  // fine grain (sand-cast surface)
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9 / u, numOctaves: 1, seed: seed + 7, result: 'fg' }, f);
  svg('feColorMatrix', { in: 'fg', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 0.62', result: 'grain' }, f);
  const m = svg('feMerge', { result: 'all' }, f);
  ['shaded', 'bloom', 'pat', 'spec', 'grain'].forEach((k) => svg('feMergeNode', { in: k }, m));
  if (onlyHigh) {
    // hands only reach the high points: the touched metal shows on raised forms, never on the field
    svg('feColorMatrix', { in: 'b1', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 4.5 -1.7', result: 'hm' }, f);
    svg('feComposite', { in: 'all', in2: 'hm', operator: 'in' }, f);
  }
  return f;
}

/**
 * Build a plaque inside root. Returns { W,H,L,u, relief, sunk, rubs, cam(x,y,s), slide(t, dir) , text(), ... }
 * Draw in WORLD px (= frame px at camera home).
 */
export function makePlaque(root, ctx, { seed = 1, name = 'Bronze plaque', pad = 1.4 } = {}) {
  const { width: W, height: H, layout: L } = ctx;
  const u = L.unit;
  const id = 'brz' + (++uid);
  const wrap = el('div', { 'data-name': name, style: { position: 'absolute', inset: '0', background: C.bg, willChange: 'transform' } }, root);
  const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;inset:0;display:block' }, wrap);
  const defs = svg('defs', {}, s);
  const R = { x: -0.25 * W, y: -0.25 * H, width: 1.5 * W, height: 1.5 * H };
  bronzeFilter(defs, id + 'f', u, R, { base: C.field, seed: seed + 2, mottle: 0.15 });
  bronzeFilter(defs, id + 't', u, R, { base: C.touched, spec: 1.5, exp: 24, patina: 0.55, mottle: 0.05, seed: seed + 2, gain: 1.5, hw: 1.3, onlyHigh: true });

  // relief source (in defs, drawn twice)
  const src = svg('g', { id: id + 'r' }, defs);
  // the field: a big plate, with sunken marks cut through its mask
  const fieldMask = svg('mask', { id: id + 'fm', maskUnits: 'userSpaceOnUse', ...R }, defs);
  const P = pad * Math.max(W, H);
  svg('rect', { x: -P, y: -P, width: W + 2 * P, height: H + 2 * P, fill: '#fff' }, fieldMask);
  const sunk = svg('g', {}, fieldMask);               // draw sunken shapes here in black/grey
  svg('rect', { x: -P, y: -P, width: W + 2 * P, height: H + 2 * P, fill: '#fff', 'fill-opacity': 0.34, mask: `url(#${id}fm)` }, src);
  // hand-modelled field: soft tool dabs (seeded, fixed)
  const dabs = svg('g', {}, src);
  for (let i = 0; i < 0; i++) {
    const r = (k) => rand(seed * 131 + i * 17 + k);
    svg('ellipse', { cx: -P * 0.2 + r(1) * (W + P * 0.4), cy: -P * 0.2 + r(2) * (H + P * 0.4), rx: (40 + r(3) * 120) * u, ry: (14 + r(4) * 40) * u,
      fill: `url(#${id}g)`, opacity: 0.03 + r(5) * 0.04 }, dabs);
  }
  // casting pits: tiny sunken dots
  for (let i = 0; i < 90; i++) {
    const r = (k) => rand(seed * 71 + i * 29 + k);
    svg('circle', { cx: r(1) * W, cy: r(2) * H, r: (1.2 + r(3) * 2.4) * u, fill: '#000', 'fill-opacity': 0.5 }, sunk);
  }
  const relief = svg('g', { 'data-name': 'Relief forms' }, src);

  const camG = svg('g', {}, s);
  svg('use', { href: `#${id}r`, filter: `url(#${id}f)` }, camG);
  const rubMask = svg('mask', { id: id + 'm', maskUnits: 'userSpaceOnUse', ...R }, defs);
  const rubs = svg('g', {}, rubMask);
  svg('use', { href: `#${id}r`, filter: `url(#${id}t)`, mask: `url(#${id}m)`, 'data-name': 'Rubbed bronze' }, camG);
  // soft gallery falloff (vignette) — fixed to the frame, not the metal
  const vg = svg('radialGradient', { id: id + 'v', cx: '38%', cy: '30%', r: '85%' }, defs);
  svg('stop', { offset: '0.45', 'stop-color': '#000', 'stop-opacity': 0 }, vg);
  svg('stop', { offset: '1', 'stop-color': '#0B0806', 'stop-opacity': 0.62 }, vg);
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id}v)`, 'pointer-events': 'none' }, s);

  // radial gradient for rub strokes
  const rg = svg('radialGradient', { id: id + 'g' }, defs);
  svg('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': 1 }, rg);
  svg('stop', { offset: '0.55', 'stop-color': '#fff', 'stop-opacity': 0.85 }, rg);
  svg('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': 0 }, rg);

  const items = [];
  const api = {
    W, H, L, u, wrap, relief, sunk, rubs, defs,
    /** camera: world point at frame centre, scale */
    cam(x = W / 2, y = H / 2, sc = 1) {
      camG.setAttribute('transform', `translate(${(W / 2).toFixed(2)} ${(H / 2).toFixed(2)}) scale(${sc.toFixed(4)}) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})`);
    },
    /** the frieze slides in (dolly along the bronze) during the first `dur` s; dir 'x' (landscape) or 'y' (portrait) */
    slide(t, dur = 0.5) {
      const p = clamp(t / dur), e = 1 - (1 - p) ** 3;
      const k = (1 - e) * 1.02;
      wrap.style.transform = p >= 1 ? '' : (L.portrait ? `translateY(${(k * H).toFixed(1)}px)` : `translateX(${(k * W).toFixed(1)}px)`);
    },
    /** a rising form: group whose height fades up from t0 */
    form(name, t0, dur = 0.55, parent = relief) {
      const g = svg('g', { 'data-name': name }, parent);
      items.push({ g, t0, dur });
      return g;
    },
    /** a rub: N short cloth strokes around (cx,cy) that polish the metal from t0 over dur */
    rub(cx, cy, rx, ry, t0, dur = 0.9, { n = 6, seed: rs = 1, ang = -18, name } = {}) {
      const g = svg('g', name ? { 'data-name': name } : {}, rubs);
      const strokes = [];
      for (let i = 0; i < n; i++) {
        const r = (k) => rand(rs * 97 + i * 13 + k);
        const ox = (-1 + 2 * (i + 0.5) / n) * rx * 0.85 + (r(1) - 0.5) * rx * 0.12, oy = (r(2) - 0.5) * ry * 0.5;
        const sx = Math.max(rx * 2.4 / n, ry * 0.9) * (0.8 + r(3) * 0.3), sy = ry * (0.75 + r(4) * 0.3);
        const e = svg('ellipse', { cx: cx + ox, cy: cy + oy, rx: sx, ry: sy, fill: `url(#${id}g)`,
          transform: `rotate(${ang + (r(5) - 0.5) * 30} ${cx + ox} ${cy + oy})` }, g);
        strokes.push({ e, i, a: 0.42 + r(6) * 0.2 });
      }
      items.push({ rub: true, strokes, t0, dur, n });
      return g;
    },
    /** polish mask element (white = rubbed), e.g. letter faces; fades in from t0 */
    polish(node, t0, dur = 0.5) { rubs.appendChild(node); items.push({ g: node, t0, dur }); return node; },
    text(parent, str, x, y, size, extra = {}) {
      const n = svg('text', { x, y, 'font-size': size, fill: '#fff', 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 600, ...extra }, parent);
      n.textContent = str; return n;
    },
    /** call every frame with GLOBAL time g */
    tick(g) {
      for (const it of items) {
        if (it.rub) {
          it.strokes.forEach(({ e, i, a }) => {
            const t0 = it.t0 + (i / it.n) * it.dur * 0.75;
            const p = clamp((g - t0) / (it.dur * 0.35));
            e.setAttribute('opacity', (a * ease.outCubic(p)).toFixed(3));
          });
        } else {
          it.g.setAttribute('opacity', rise(g, it.t0, it.dur).toFixed(3));
        }
      }
    },
  };
  return api;
}

/** Raised bead frame (a cast moulding) around a rectangle. */
export function bead(parent, x, y, w, h, r, th, u) {
  svg('rect', { x, y, width: w, height: h, rx: r, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.55, 'stroke-width': th }, parent);
  svg('rect', { x: x + th * 0.9, y: y + th * 0.9, width: w - th * 1.8, height: h - th * 1.8, rx: Math.max(0, r - th), fill: 'none', stroke: '#fff', 'stroke-opacity': 0.4, 'stroke-width': th * 0.35 }, parent);
}

/** Running-scroll wave band ("the sea" in relief convention): curls left→right along y. */
export function waveBand(parent, x0, x1, y, size, u, { lv = 0.55, seed = 1 } = {}) {
  let d = '';
  const step = size * 2.1;
  for (let x = x0, i = 0; x < x1; x += step, i++) {
    const j = (rand(seed * 19 + i) - 0.5) * size * 0.18;  // hand-modelled: no two curls equal
    const s = size * (0.94 + rand(seed * 7 + i) * 0.12);
    // crest rising, curling over into a spiral
    d += `M ${x} ${y} C ${x + s * 0.5} ${y}, ${x + s * 0.9} ${y - s * 0.95 + j}, ${x + s * 1.45} ${y - s * 0.9 + j} `
      + `C ${x + s * 2.0} ${y - s * 0.85 + j}, ${x + s * 2.05} ${y - s * 0.25}, ${x + s * 1.7} ${y - s * 0.2} `
      + `C ${x + s * 1.45} ${y - s * 0.18}, ${x + s * 1.35} ${y - s * 0.45}, ${x + s * 1.55} ${y - s * 0.52} `;
  }
  svg('path', { d, fill: 'none', stroke: '#fff', 'stroke-opacity': lv, 'stroke-width': size * 0.22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  // the sea surface line under the curls
  svg('path', { d: `M ${x0} ${y} L ${x1} ${y}`, stroke: '#fff', 'stroke-opacity': lv * 0.8, 'stroke-width': size * 0.2, 'stroke-linecap': 'round' }, parent);
}

/** Water below the surface: long horizontal tool strokes, lower relief with depth. */
export function deepWater(parent, x0, x1, y0, y1, u, seed = 1) {
  const rows = 6;
  for (let i = 0; i < rows; i++) {
    const r = (k) => rand(seed * 53 + i * 11 + k);
    const y = y0 + (y1 - y0) * (i + 0.6) / (rows + 0.5) + (r(1) - 0.5) * 14 * u;
    const wl = (420 + r(2) * 260) * u, amp = (7 + r(3) * 6) * u * (1 - i / rows * 0.5);
    let d = `M ${x0} ${y}`;
    for (let x = x0, k = 0; x < x1; x += wl / 2, k++) d += ` q ${wl / 4} ${(k % 2 ? -1 : 1) * amp * (0.7 + rand(seed + k * 3.1 + i) * 0.6)} ${wl / 2} 0`;
    svg('path', { d, stroke: '#fff', fill: 'none', 'stroke-opacity': 0.13 - i * 0.012, 'stroke-width': (7 - i * 0.6) * u, 'stroke-linecap': 'round' }, parent);
  }
}
