// STAMP ALBUM — shared kit: album leaf, perforated stamps, glassine stock strips, postmarks, overprints,
// collector's pencil notes and the loupe. All SVG, built once; update() only moves/fades things.
// Imperfections (ink starvation in a postmark, a short perf tooth, a crooked stamp, misregistered second plate)
// are seeded once per element and never change between frames.
import { svg, el, rand, clamp, spring } from '/onclack-styles/engine/lib/anim.js';

export const C = {
  leaf: '#E3DED0',        // album leaf, warm grey card
  grid: '#C7CBC6',        // printed quadrille (pale blue-grey)
  print: '#4A4E55',       // album's printed captions
  stampPaper: '#F3EEDF',  // gummed stamp paper
  prussian: '#1F4B66',    // plate 1 — sea / frames
  ochre: '#C8963F',       // plate 2 — land / tablets
  slate: '#3D4A57',
  olive: '#56633A',
  plum: '#5E4256',
  steel: '#2F4560',
  postmark: '#2A2734',    // oily violet-black cancel ink
  carmine: '#B3263A',     // the ONE red: the NO overprint
  pencil: '#55565C',
  black: '#1A1A1C',
};
export const F = {
  stamp: "'Fraunces', serif",
  print: "'Schibsted Grotesk', sans-serif",
  over: "'Sofia Sans Extra Condensed', sans-serif",
  mono: "'IBM Plex Mono', monospace",
  hand: "'Shantell Sans', sans-serif",
};

let uid = 0;
export const nid = (p) => `${p}${++uid}`;

/** A hand strike: 0 before t0, lands in ~2 frames with a tiny over-press, settles. */
export const strike = (t, t0) => (t < t0 ? 0 : clamp(spring(t - t0, { stiffness: 1400, damping: 38 }), 0, 1.04));

/** Grain tile (made once): paper fibre speckle used as a multiply overlay. */
let grainUrl = null;
function grain() {
  if (grainUrl) return grainUrl;
  const n = 220, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'); const im = g.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = 236 + (rand(i * 1.731 + 7) - 0.5) * 26;
    im.data.set([v, v - 2, v - 6, 255], i * 4);
  }
  g.putImageData(im, 0, 0);
  g.strokeStyle = 'rgba(120,110,95,0.18)'; g.lineWidth = 0.7;
  for (let i = 0; i < 40; i++) {
    const r = (k) => rand(i * 17 + k * 3.1);
    const x = r(1) * n, y = r(2) * n, a = r(3) * 6.28, l = 5 + r(4) * 14;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l / 2, y + Math.sin(a + 0.6) * l / 2, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  grainUrl = c.toDataURL('image/png');
  return grainUrl;
}

/**
 * An album leaf filling the frame. Returns { root, svg, defs, world, top, cam(cx,cy,s,rot), turn(p), W, H, L, u }.
 * world = SVG group in frame px at camera home. top = SVG group above world (screen space: lamp, vignette).
 */
export function makeLeaf(root, ctx, { name = 'Album leaf', header = '', folio = '', seed = 1 } = {}) {
  const { width: W, height: H, layout: L } = ctx;
  const u = L.unit;
  const box = el('div', { 'data-name': name, style: { position: 'absolute', inset: '0', background: C.leaf, overflow: 'hidden' } }, root);
  // page-turn shadow on the left edge (visible while the leaf slides in over the previous one)
  const edge = el('div', { style: { position: 'absolute', top: '0', bottom: '0', left: '0', width: '2px',
    boxShadow: `${-18 * u}px 0 ${40 * u}px ${10 * u}px rgba(30,28,24,0.45)` } }, box);
  const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;inset:0;display:block' }, box);
  const defs = svg('defs', {}, s);
  // soft shadow filter for stamps / loupe (static)
  const shId = nid('sh');
  const sh = svg('filter', { id: shId, x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
  svg('feGaussianBlur', { stdDeviation: 5 * u }, sh);
  const world = svg('g', { 'data-name': 'Leaf (camera)' }, s);
  // the leaf itself extends well past the frame so camera moves never show an edge
  const PAD = 1.2;
  svg('rect', { x: -W * PAD, y: -H * PAD, width: W * (1 + 2 * PAD), height: H * (1 + 2 * PAD), fill: C.leaf }, world);
  // printed quadrille: fine 5 mm grid (as real blank album leaves have), every line slightly uneven in weight
  const grid = svg('g', { 'data-name': 'Printed quadrille', stroke: C.grid, 'stroke-width': 1.1 * u, opacity: 0.75 }, world);
  const step = 30 * u;
  let d = '';
  for (let x = -W * 0.6; x < W * 1.6; x += step) d += `M ${x.toFixed(1)} ${-H * 0.6} V ${H * 1.6} `;
  for (let y = -H * 0.6; y < H * 1.6; y += step) d += `M ${-W * 0.6} ${y.toFixed(1)} H ${W * 1.6} `;
  svg('path', { d }, grid);
  // printed border rule of the leaf (double line), inside the safe area
  const sf = L.safe;
  const bx = sf.x + 2 * u, by = sf.y + 12 * u, bw = sf.w - 4 * u, bh = sf.h - 16 * u;
  svg('rect', { x: bx, y: by, width: bw, height: bh, fill: 'none', stroke: C.print, 'stroke-width': 2.2 * u, opacity: 0.55 }, world);
  svg('rect', { x: bx + 7 * u, y: by + 7 * u, width: bw - 14 * u, height: bh - 14 * u, fill: 'none', stroke: C.print, 'stroke-width': 0.9 * u, opacity: 0.5 }, world);
  if (header) {
    const hw = header.length * 13 * u + 40 * u;
    svg('rect', { x: W / 2 - hw / 2, y: by - 14 * u, width: hw, height: 28 * u, fill: C.leaf }, world);
    txt(world, header, W / 2, by + 6 * u, 18 * u, { fill: C.print, 'font-family': F.print, 'font-weight': 600, 'letter-spacing': 4 * u, 'data-name': 'Leaf header' });
  }
  if (folio) txt(world, folio, bx + bw - 30 * u, by + bh - 18 * u, 16 * u, { fill: C.print, 'font-family': F.mono, 'text-anchor': 'end', opacity: 0.8, 'data-name': 'Folio' });
  const content = svg('g', { 'data-name': 'Leaf content' }, world);
  // screen-space: paper grain (multiply) + warm desk-lamp falloff + vignette
  const top = svg('g', { 'pointer-events': 'none' }, s);
  const gpat = nid('gp');
  const pat = svg('pattern', { id: gpat, width: 220, height: 220, patternUnits: 'userSpaceOnUse' }, defs);
  svg('image', { href: grain(), width: 220, height: 220 }, pat);
  svg('rect', { width: W, height: H, fill: `url(#${gpat})`, style: 'mix-blend-mode:multiply', opacity: 0.55 }, top);
  const lg = nid('lg');
  const rg = svg('radialGradient', { id: lg, cx: L.portrait ? 0.42 : 0.36, cy: 0.28, r: L.portrait ? 1.0 : 0.85 }, defs);
  svg('stop', { offset: 0, 'stop-color': '#FFF6E2', 'stop-opacity': 0.22 }, rg);
  svg('stop', { offset: 0.55, 'stop-color': '#FFF6E2', 'stop-opacity': 0 }, rg);
  svg('stop', { offset: 1, 'stop-color': '#2A2418', 'stop-opacity': 0.34 }, rg);
  svg('rect', { width: W, height: H, fill: `url(#${lg})`, 'data-name': 'Desk lamp falloff' }, top);

  return {
    root: box, svg: s, defs, world, content, top, W, H, L, u, shadowFilter: shId,
    cam(cx, cy, sc = 1, rot = 0) {
      world.setAttribute('transform', `translate(${W / 2} ${H / 2}) rotate(${rot}) scale(${sc}) translate(${-cx} ${-cy})`);
    },
    /** page turn-in: p 0→1 slides the leaf in from the right (only used at the start of a scene). */
    turn(p) {
      const x = (1 - p) * W * 1.02;
      box.style.transform = x > 0.5 ? `translateX(${x}px)` : '';
      edge.style.opacity = p < 1 ? 1 : 0;
    },
  };
}

export function txt(parent, s, x, y, size, attrs = {}) {
  const t = svg('text', { x, y, 'font-size': size, 'text-anchor': 'middle', ...attrs }, parent);
  t.textContent = s;
  return t;
}

/**
 * A perforated stamp. (x,y) = top-left of the paper (incl. perforation margin) in world px.
 * Returns { g, design, id, w, h, ix, iy, iw, ih, setPose(dx,dy,rot,scale) }.
 * design = group in STAMP-LOCAL px (0,0 = paper top-left); the printed image area is (ix,iy,iw,ih).
 */
export function makeStamp(page, parent, { x, y, w, h, seed = 1, rot = 0, margin = 0.085, name = 'Stamp', shortPerf = -1 }) {
  const { defs, u } = page;
  const id = nid('stamp');
  const pitch = 21 * u, rp = 5.6 * u;
  // paper silhouette with perforation teeth: mask = white rect − holes centred on the edges
  const mid = nid('pm');
  const mask = svg('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -20 * u, y: -20 * u, width: w + 40 * u, height: h + 40 * u }, defs);
  svg('rect', { x: 0, y: 0, width: w, height: h, fill: '#fff' }, mask);
  const holes = (len, fn) => { const n = Math.max(2, Math.round(len / pitch)); const p = len / n; for (let i = 0; i <= n; i++) fn(i * p, i); };
  let hi = 0;
  const hole = (cx, cy) => { const big = hi++ === shortPerf; svg('circle', { cx, cy, r: big ? rp * 2.1 : rp * (0.92 + rand(seed * 41 + hi) * 0.16), fill: '#000' }, mask); };
  holes(w, (p) => { hole(p, 0); hole(p, h); });
  holes(h, (p, i) => { if (i > 0 && i < 999) { hole(0, p); hole(w, p); } });
  const outer = svg('g', { 'data-name': name }, parent);
  // shadow (separate, so the loupe's <use> of the stamp doesn't copy it)
  const shadow = svg('rect', { x: 0, y: 0, width: w, height: h, fill: '#2A2216', opacity: 0.32, filter: `url(#${page.shadowFilter})` }, outer);
  const g = svg('g', { id }, outer);
  const paper = svg('g', { mask: `url(#${mid})` }, g);
  svg('rect', { x: 0, y: 0, width: w, height: h, fill: C.stampPaper }, paper);
  // faint gum toning at one corner (age)
  const tg = nid('tg');
  const lgr = svg('linearGradient', { id: tg, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
  svg('stop', { offset: 0, 'stop-color': '#C9A86A', 'stop-opacity': 0.0 }, lgr);
  svg('stop', { offset: 0.7, 'stop-color': '#C9A86A', 'stop-opacity': 0.0 }, lgr);
  svg('stop', { offset: 1, 'stop-color': '#B98F4E', 'stop-opacity': 0.22 }, lgr);
  svg('rect', { x: 0, y: 0, width: w, height: h, fill: `url(#${tg})` }, paper);
  const m = Math.min(w, h) * margin;
  // the printed image is never perfectly centred on the paper (perforation drift) — seeded
  const offX = (rand(seed * 7.7) - 0.5) * m * 0.5, offY = (rand(seed * 3.3) - 0.5) * m * 0.4;
  const ix = m + offX, iy = m + offY, iw = w - 2 * m, ih = h - 2 * m;
  const design = svg('g', { 'data-name': name + ' design' }, paper);
  const marks = svg('g', { 'data-name': name + ' marks' }, paper); // postmarks / overprints: on top of the design, ink only takes on the paper
  const st = { g, outer, shadow, design, marks, id, w, h, ix, iy, iw, ih, x, y, rot, mask: mid };
  st.setPose = (dx = 0, dy = 0, r = rot, sc = 1, lift = 0) => {
    const tr = `translate(${x + dx + w / 2} ${y + dy + h / 2}) rotate(${r}) scale(${sc}) translate(${-w / 2} ${-h / 2})`;
    g.setAttribute('transform', tr);
    shadow.setAttribute('transform', `translate(${x + dx + w / 2 + (4 + lift * 22) * u} ${y + dy + h / 2 + (6 + lift * 30) * u}) rotate(${r}) scale(${sc}) translate(${-w / 2} ${-h / 2})`);
    shadow.setAttribute('opacity', (0.32 - lift * 0.14).toFixed(3));
  };
  st.setPose();
  return st;
}

/** Clip group for the image area of a stamp (so art never spills onto the white margin). */
export function imageArea(page, st) {
  const cid = nid('ia');
  const cp = svg('clipPath', { id: cid }, page.defs);
  svg('rect', { x: st.ix, y: st.iy, width: st.iw, height: st.ih }, cp);
  return svg('g', { 'clip-path': `url(#${cid})` }, st.design);
}

/** Ruled litho screen (fine parallel lines) as a pattern fill in `color`. */
export function screen(page, color, { gap = 7, w = 2.4, angle = 0, bg = null } = {}) {
  const id = nid('scr'); const u = page.u;
  const p = svg('pattern', { id, width: gap * u, height: gap * u, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${angle})` }, page.defs);
  if (bg) svg('rect', { width: gap * u, height: gap * u, fill: bg }, p);
  svg('rect', { x: 0, y: 0, width: gap * u, height: w * u, fill: color }, p);
  return `url(#${id})`;
}

/**
 * Circular datestamp + wavy "killer" bars, struck by hand. (cx,cy) in the parent's px.
 * ring text = the fictional office name; mid = date line. Uneven inking is seeded (one side starved, specks missing).
 */
export function makePostmark(page, parent, { cx, cy, r, ring = 'SEA POST', mid = '27 X 62', sub = '', bars = true, rot = -8, seed = 1, name = 'Postmark', color = C.postmark, target = false }) {
  const u = page.u;
  const g = svg('g', { 'data-name': name, opacity: 0 }, parent);
  const inner = svg('g', {}, g);
  const mk = nid('ink');
  const mask = svg('mask', { id: mk, maskUnits: 'userSpaceOnUse', x: cx - r * 6, y: cy - r * 3, width: r * 12, height: r * 6 }, page.defs);
  const gr = nid('ig');
  const lgr = svg('linearGradient', { id: gr, x1: 0, y1: 0, x2: 1, y2: 0.3, gradientTransform: `rotate(${rand(seed) * 360} 0.5 0.5)` }, page.defs);
  svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 1 }, lgr);
  svg('stop', { offset: 0.6, 'stop-color': '#fff', 'stop-opacity': 0.9 }, lgr);
  svg('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0.62 }, lgr);
  svg('rect', { x: cx - r * 6, y: cy - r * 3, width: r * 12, height: r * 6, fill: `url(#${gr})` }, mask);
  for (let i = 0; i < 70; i++) {
    const a = rand(seed * 13 + i) * 6.283, rr = rand(seed * 29 + i * 2) * r * (bars ? 3.2 : 1.15);
    svg('circle', { cx: cx + Math.cos(a) * rr * (bars ? 1.6 : 1), cy: cy + Math.sin(a) * rr * 0.6, r: (0.8 + rand(seed + i * 5) * 2.4) * u, fill: '#000' }, mask);
  }
  inner.setAttribute('mask', `url(#${mk})`);
  const art = svg('g', { transform: `rotate(${rot} ${cx} ${cy})`, fill: 'none', stroke: color }, inner);
  if (target) {
    // concentric "target" cancel (a ring cancel): reads as ripples
    for (let k = 1; k <= 4; k++) svg('circle', { cx, cy, r: r * k / 4, 'stroke-width': (k === 4 ? 4.2 : 3.4) * u }, art);
    svg('circle', { cx, cy, r: r * 0.09, fill: color, stroke: 'none' }, art);
    return { g, art };
  }
  svg('circle', { cx, cy, r, 'stroke-width': 3.6 * u }, art);
  svg('circle', { cx, cy, r: r * 0.64, 'stroke-width': 2.2 * u }, art);
  const pid = nid('ring');
  const rr = r * 0.8;
  svg('path', { id: pid, d: `M ${cx - rr} ${cy} A ${rr} ${rr} 0 1 1 ${cx + rr} ${cy}`, fill: 'none', stroke: 'none' }, page.defs);
  const tt = svg('text', { 'font-family': F.print, 'font-weight': 600, 'font-size': r * 0.24, fill: color, stroke: 'none', 'letter-spacing': r * 0.04 }, art);
  const tp = svg('textPath', { href: `#${pid}`, startOffset: '50%', 'text-anchor': 'middle' }, tt);
  tp.textContent = ring;
  if (sub) {
    const pid2 = nid('ring');
    const r2 = r * 0.8 + r * 0.24 * 0.75;
    svg('path', { id: pid2, d: `M ${cx - r2} ${cy} A ${r2} ${r2} 0 0 0 ${cx + r2} ${cy}`, fill: 'none', stroke: 'none' }, page.defs);
    const t2 = svg('text', { 'font-family': F.print, 'font-weight': 600, 'font-size': r * 0.2, fill: color, stroke: 'none', 'letter-spacing': r * 0.03 }, art);
    const tp2 = svg('textPath', { href: `#${pid2}`, startOffset: '50%', 'text-anchor': 'middle' }, t2);
    tp2.textContent = sub;
  }
  txt(art, mid, cx, cy + r * 0.13, r * 0.36, { fill: color, stroke: 'none', 'font-family': F.mono, 'font-weight': 500, 'letter-spacing': r * 0.01 });
  if (bars) {
    // wavy killer bars to the right of the datestamp
    const x0 = cx + r * 1.08, len = r * 3.0;
    for (let k = -2; k <= 2; k++) {
      const yy = cy + k * r * 0.34;
      let d = `M ${x0} ${yy}`;
      for (let s = 1; s <= 24; s++) { const xx = x0 + len * s / 24; d += ` L ${xx.toFixed(1)} ${(yy + Math.sin(s / 24 * Math.PI * 4 + k * 0.4) * r * 0.09).toFixed(1)}`; }
      svg('path', { d, 'stroke-width': 3.6 * u, 'stroke-linecap': 'round' }, art);
    }
  }
  return { g, art };
}

/** Set a struck mark's state: v from strike(). Lands with a 3 % over-size settling to 1. */
export function showStrike(mark, v, cx, cy) {
  mark.g.setAttribute('opacity', clamp(v * 3, 0, 0.95).toFixed(3));
  const s = 1 + (1 - Math.min(1, v)) * 0.06;
  mark.g.setAttribute('transform', `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`);
}

/** Typeset overprint (letterpress on top of the printed stamp). */
export function makeOverprint(page, parent, { x, y, text, size, color = C.black, rot = -4, name = 'Overprint', spacing = 0.04, seed = 3 }) {
  const u = page.u;
  const g = svg('g', { 'data-name': name, opacity: 0 }, parent);
  const mk = nid('om');
  const mask = svg('mask', { id: mk, maskUnits: 'userSpaceOnUse', x: x - size * 3, y: y - size * 1.5, width: size * 6, height: size * 3 }, page.defs);
  svg('rect', { x: x - size * 3, y: y - size * 1.5, width: size * 6, height: size * 3, fill: '#fff' }, mask);
  for (let i = 0; i < 140; i++) svg('circle', { cx: x + (rand(seed * 3 + i) - 0.5) * size * 2.4, cy: y - size * 0.35 + (rand(seed * 7 + i) - 0.5) * size * 0.8, r: (0.4 + rand(seed + i * 9) * 1.0) * u, fill: '#000', opacity: 0.8 }, mask);
  const t = txt(g, text, x, y, size, { fill: color, stroke: color, 'stroke-width': size * 0.012, 'font-family': F.over, 'font-weight': 800,
    'letter-spacing': size * spacing, transform: `rotate(${rot} ${x} ${y - size * 0.35})`, mask: `url(#${mk})` });
  return { g, t };
}

/**
 * Collector's pencil note, written left→right (clip grows). Returns { g, set(p) }.
 */
export function makePencil(page, parent, { x, y, text, size, anchor = 'start', rot = -1.5, name = 'Pencil note', underline = false }) {
  const u = page.u;
  const g = svg('g', { 'data-name': name }, parent);
  const cid = nid('pc');
  const cp = svg('clipPath', { id: cid }, page.defs);
  const est = text.length * size * 0.56;
  const x0 = anchor === 'middle' ? x - est / 2 : anchor === 'end' ? x - est : x;
  const rect = svg('rect', { x: x0 - size, y: y - size * 1.6, width: 0, height: size * 2.6 }, cp);
  const inner = svg('g', { 'clip-path': `url(#${cid})`, transform: `rotate(${rot} ${x} ${y})` }, g);
  txt(inner, text, x, y, size, { fill: C.pencil, 'font-family': F.hand, 'font-weight': 500, 'text-anchor': anchor, opacity: 0.88 });
  if (underline) {
    let d = `M ${x0} ${y + size * 0.3}`;
    for (let s = 1; s <= 10; s++) d += ` L ${(x0 + est * s / 10).toFixed(1)} ${(y + size * 0.3 + Math.sin(s * 1.7) * size * 0.04 + s * size * 0.012).toFixed(1)}`;
    svg('path', { d, fill: 'none', stroke: C.pencil, 'stroke-width': 2 * u, 'stroke-linecap': 'round', opacity: 0.75 }, inner);
  }
  return { g, set(p) { rect.setAttribute('width', Math.max(0, (est + size * 2) * clamp(p))); } };
}

/**
 * The loupe: a hand lens that shows a magnified copy of given stamps (via <use>).
 * Returns { g, set(x, y, mag, opacity) } — (x,y) lens centre in world px.
 */
export function makeLoupe(page, parent, refIds, { r = 170, name = 'Loupe' } = {}) {
  const u = page.u; r *= u;
  const g = svg('g', { 'data-name': name, opacity: 0 }, parent);
  const shadow = svg('g', { filter: `url(#${page.shadowFilter})`, opacity: 0.4 }, g);
  const sCirc = svg('circle', { r: r * 1.04, fill: '#21180E' }, shadow);
  const sHandle = svg('rect', { width: r * 1.5, height: r * 0.24, rx: r * 0.12, fill: '#21180E' }, shadow);
  const cid = nid('lc');
  const cp = svg('clipPath', { id: cid }, page.defs);
  const clipC = svg('circle', { r }, cp);
  const lensG = svg('g', { 'clip-path': `url(#${cid})` }, g);
  const bgC = svg('circle', { r, fill: C.leaf }, lensG);
  const mag = svg('g', {}, lensG);
  for (const id of refIds) svg('use', { href: `#${id}` }, mag);
  // glass: slight warm tint toward the rim + a soft glint
  const gg = nid('gl');
  const rg = svg('radialGradient', { id: gg, cx: 0.5, cy: 0.5, r: 0.5 }, page.defs);
  svg('stop', { offset: 0.78, 'stop-color': '#000', 'stop-opacity': 0 }, rg);
  svg('stop', { offset: 1, 'stop-color': '#2A1C08', 'stop-opacity': 0.32 }, rg);
  const tint = svg('circle', { r, fill: `url(#${gg})` }, lensG);
  const glint = svg('path', { fill: '#FFFFFF', opacity: 0.22 }, lensG);
  // rim: dark bakelite + thin brass bezel, handle toward lower right
  const handle = svg('rect', { width: r * 1.45, height: r * 0.2, rx: r * 0.1, fill: '#2B211C' }, g);
  const rim = svg('circle', { r: r + 7 * u, fill: 'none', stroke: '#2B211C', 'stroke-width': 16 * u }, g);
  const bez = svg('circle', { r: r + 0.5 * u, fill: 'none', stroke: '#A98A55', 'stroke-width': 3 * u }, g);
  const hl = svg('circle', { r: r + 9 * u, fill: 'none', stroke: '#6E5E52', 'stroke-width': 2.4 * u, 'stroke-dasharray': `${r * 1.2} ${r * 9}`, opacity: 0.8 }, g);
  return {
    g,
    set(x, y, m, op) {
      g.setAttribute('opacity', clamp(op).toFixed(3));
      for (const c of [clipC, bgC, tint, rim, bez, hl]) { c.setAttribute('cx', x); c.setAttribute('cy', y); }
      sCirc.setAttribute('cx', x + 22 * u); sCirc.setAttribute('cy', y + 30 * u);
      const ang = 38;
      handle.setAttribute('transform', `translate(${x} ${y}) rotate(${ang}) translate(${r + 10 * u} ${-r * 0.1})`);
      sHandle.setAttribute('transform', `translate(${x + 22 * u} ${y + 30 * u}) rotate(${ang}) translate(${r + 10 * u} ${-r * 0.12})`);
      mag.setAttribute('transform', `translate(${x} ${y}) scale(${m}) translate(${-x} ${-y})`);
      glint.setAttribute('d', `M ${x - r * 0.72} ${y - r * 0.25} A ${r * 0.78} ${r * 0.78} 0 0 1 ${x - r * 0.1} ${y - r * 0.76} A ${r * 0.9} ${r * 0.9} 0 0 0 ${x - r * 0.72} ${y - r * 0.25} Z`);
    },
  };
}

/** Glassine stock strip across a row (stamps tucked under its lower part). */
export function makeStrip(page, parent, { x, y, w, h, name = 'Glassine strip' }) {
  const u = page.u;
  const g = svg('g', { 'data-name': name }, parent);
  svg('rect', { x, y, width: w, height: h, fill: '#FAF8F2', opacity: 0.2 }, g);
  svg('rect', { x, y, width: w, height: 2.4 * u, fill: '#FFFFFF', opacity: 0.55 }, g);
  svg('rect', { x, y: y + 2.4 * u, width: w, height: 3 * u, fill: '#000', opacity: 0.08 }, g);
  // a long soft sheen streak
  svg('rect', { x, y: y + h * 0.3, width: w, height: h * 0.08, fill: '#FFFFFF', opacity: 0.1 }, g);
  return g;
}

/** Album-printed caption under a space (small caps grotesk + catalogue number in mono). */
export function caption(page, parent, x, y, text, cat, { size = 20, name = 'Printed caption', anchor = 'middle' } = {}) {
  const u = page.u;
  const g = svg('g', { 'data-name': name }, parent);
  txt(g, text, x, y, size * u, { fill: C.print, 'font-family': F.print, 'font-weight': 600, 'letter-spacing': 2.4 * u, 'text-anchor': anchor });
  if (cat) txt(g, cat, x, y + size * 1.3 * u, size * 0.78 * u, { fill: C.print, 'font-family': F.mono, opacity: 0.75, 'text-anchor': anchor });
  return g;
}

/** Printed (empty) space for a stamp: thin rule frame with a quiet hatch, as album makers print them. */
export function emptySpace(page, parent, { x, y, w, h, label, name = 'Empty space' }) {
  const u = page.u;
  const g = svg('g', { 'data-name': name }, parent);
  svg('rect', { x, y, width: w, height: h, fill: '#DDD8C9', stroke: C.print, 'stroke-width': 1.4 * u, opacity: 0.85 }, g);
  svg('rect', { x: x + 8 * u, y: y + 8 * u, width: w - 16 * u, height: h - 16 * u, fill: 'none', stroke: C.print, 'stroke-width': 0.8 * u, 'stroke-dasharray': `${4 * u} ${5 * u}`, opacity: 0.6 }, g);
  if (label) txt(g, label, x + w / 2, y + h / 2 + 8 * u, 22 * u, { fill: C.print, 'font-family': F.mono, opacity: 0.55 });
  return g;
}
