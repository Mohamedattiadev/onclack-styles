// DIORAMA kit — 2.5D cut-paper miniature world (style test).
// Everything here is built once (at scene build time) and is a pure function of t in update().
// Imperfection is designed once: every cut edge, fibre and speck is seeded per object, never per frame.
import { el, svg, rand, clamp, lerp, progress, ease, noise1 } from '/onclack-styles/engine/lib/anim.js';

// ---------------------------------------------------------------- colour
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2 = a => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex2(a), B = hex2(b); return rgb2(A.map((v, i) => v + (B[i] - v) * t)); };
export const shade = (c, k) => (k >= 0 ? mix(c, '#fff4e2', k) : mix(c, '#0b0d10', -k)); // light is warm, dark is cool

// ---------------------------------------------------------------- textures (procedural, seeded, tileable)
const TEX = 384;
let _paper = null, _grain = null;
function valueNoise(n, seed) {
  const a = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) a[i] = rand(seed + i * 1.731);
  return (x, y) => {
    const fx = (x / TEX) * n, fy = (y / TEX) * n, x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const g = (i, j) => a[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
    return lerp(lerp(g(x0, y0), g(x0 + 1, y0), sx), lerp(g(x0, y0 + 1), g(x0 + 1, y0 + 1), sx), sy);
  };
}
/** Cold-press paper: soft cloudy formation + short fibres + rare specks. Mostly white → used with multiply. */
export function paperTexture() {
  if (_paper) return _paper;
  const c = document.createElement('canvas'); c.width = c.height = TEX;
  const g = c.getContext('2d');
  const img = g.createImageData(TEX, TEX);
  const n1 = valueNoise(6, 11), n2 = valueNoise(22, 29), n3 = valueNoise(90, 47);
  for (let y = 0; y < TEX; y++) for (let x = 0; x < TEX; x++) {
    const v = n1(x, y) * 0.5 + n2(x, y) * 0.32 + n3(x, y) * 0.18;
    const l = 243 + (v - 0.5) * 22;
    const i = (y * TEX + x) * 4;
    img.data[i] = l + 2; img.data[i + 1] = l; img.data[i + 2] = l - 3; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // fibres: short, slightly curved strokes, light and dark; wrapped so the tile repeats cleanly
  for (let k = 0; k < 520; k++) {
    const x = rand(k * 3.1 + 1) * TEX, y = rand(k * 5.7 + 2) * TEX, a = rand(k * 7.3 + 3) * Math.PI;
    const len = 4 + rand(k * 1.9 + 4) * 16, bend = (rand(k * 2.3 + 5) - 0.5) * 6;
    const dark = rand(k * 4.1 + 6) < 0.55;
    g.strokeStyle = dark ? `rgba(90,70,50,${0.05 + rand(k + 9) * 0.07})` : `rgba(255,255,255,${0.25 + rand(k + 8) * 0.3})`;
    g.lineWidth = 0.6 + rand(k * 6.1) * 0.7;
    for (const [ox, oy] of [[0, 0], [-TEX, 0], [TEX, 0], [0, -TEX], [0, TEX]]) {
      g.beginPath(); g.moveTo(x + ox, y + oy);
      g.quadraticCurveTo(x + ox + Math.cos(a) * len / 2 - Math.sin(a) * bend, y + oy + Math.sin(a) * len / 2 + Math.cos(a) * bend,
        x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len);
      g.stroke();
    }
  }
  for (let k = 0; k < 60; k++) { // specks (inclusions)
    g.fillStyle = `rgba(70,55,40,${0.12 + rand(k * 9.1) * 0.2})`;
    g.beginPath(); g.arc(rand(k * 3.7 + 20) * TEX, rand(k * 8.3 + 21) * TEX, 0.4 + rand(k * 2.9) * 0.9, 0, 7); g.fill();
  }
  return (_paper = c.toDataURL('image/png'));
}
/** Film grain tile (screen space). Mid grey, used with overlay. */
export function grainTexture() {
  if (_grain) return _grain;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const v = 128 + (rand(i * 0.917 + 3) + rand(i * 1.31 + 7) - 1) * 70; // triangular-ish distribution
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return (_grain = c.toDataURL('image/png'));
}

// ---------------------------------------------------------------- SVG defs (per scene; ids prefixed)
export function defs(root, P) {
  const s = svg('svg', { width: 0, height: 0, style: 'position:absolute;width:0;height:0' }, root);
  const d = svg('defs', {}, s);
  const pat = svg('pattern', { id: P + 'tex', patternUnits: 'userSpaceOnUse', width: TEX, height: TEX }, d);
  svg('image', { href: paperTexture(), width: TEX, height: TEX }, pat);
  for (const b of [1, 2, 4, 7, 12, 20, 34]) {
    const f = svg('filter', { id: P + 'b' + b, x: '-60%', y: '-60%', width: '220%', height: '220%' }, d);
    svg('feGaussianBlur', { stdDeviation: b }, f);
  }
  // Face light: key upper-left. Top-left of every sheet catches a little more light, bottom-right falls off.
  const lg = svg('linearGradient', { id: P + 'lg', x1: 0.15, y1: 0, x2: 0.55, y2: 1 }, d);
  svg('stop', { offset: 0, 'stop-color': '#fff6e6', 'stop-opacity': 0.22 }, lg);
  svg('stop', { offset: 0.45, 'stop-color': '#fff6e6', 'stop-opacity': 0 }, lg);
  svg('stop', { offset: 1, 'stop-color': '#06080c', 'stop-opacity': 0.32 }, lg);
  // Cylinder shading (pipes, torpedo, periscope): light from top
  const cy = svg('linearGradient', { id: P + 'cyl', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
  [[0, '#000', 0.35], [0.18, '#fff', 0.28], [0.32, '#fff', 0.06], [0.75, '#000', 0.25], [1, '#000', 0.55]]
    .forEach(([o, c, a]) => svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, cy));
  const cyv = svg('linearGradient', { id: P + 'cylv', x1: 0, y1: 0, x2: 1, y2: 0 }, d);
  [[0, '#000', 0.4], [0.22, '#fff', 0.25], [0.4, '#fff', 0.04], [0.8, '#000', 0.3], [1, '#000', 0.55]]
    .forEach(([o, c, a]) => svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, cyv));
  return d;
}

// ---------------------------------------------------------------- paths
export const poly = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';
/** Scissor-cut edge: resample a polyline every `step` px and jitter it a little (fixed per object). */
export function cut(pts, seed, amp = 0.7, step = 10, closed = true) {
  const out = [];
  const n = pts.length, segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
    const len = Math.hypot(x1 - x0, y1 - y0), k = Math.max(1, Math.round(len / step));
    for (let j = 0; j < k; j++) {
      const f = j / k, r = seed + out.length * 1.618;
      out.push([x0 + (x1 - x0) * f + (rand(r) - 0.5) * 2 * amp, y0 + (y1 - y0) * f + (rand(r + 0.5) - 0.5) * 2 * amp]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const ellipse = (cx, cy, rx, ry, n = 36, a0 = 0, a1 = Math.PI * 2) =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
export const roundRect = (x, y, w, h, r, n = 5) => [
  ...ellipse(x + w - r, y + r, r, r, n, -Math.PI / 2, 0), ...ellipse(x + w - r, y + h - r, r, r, n, 0, Math.PI / 2),
  ...ellipse(x + r, y + h - r, r, r, n, Math.PI / 2, Math.PI), ...ellipse(x + r, y + r, r, r, n, Math.PI, Math.PI * 1.5)];

/** Wave/current band: cut top edge with peaky crests, filled down to yBot. */
export function band(x0, x1, yTop, yBot, amp, period, seed, step = 12) {
  const pts = [], ph = rand(seed) * 6.283;
  for (let x = x0; x <= x1 + step; x += step) {
    const c = 0.5 + 0.5 * Math.cos((2 * Math.PI * x) / period + ph);
    const A = amp * (0.55 + 0.45 * (0.5 + 0.5 * noise1(x * 0.0041, seed)));
    const y = yTop - A * c ** 1.9 - amp * 0.3 * Math.sin((2 * Math.PI * x) / (period * 2.7) + ph * 1.3) + (rand(seed + x * 0.137) - 0.5) * 1.4;
    pts.push([x, y]);
  }
  pts.push([x1 + step, yBot], [x0, yBot]);
  return poly(pts);
}

// ---------------------------------------------------------------- one sheet of paper
/**
 * Draw a cut-paper sheet: cast shadow + contact shadow + lit top face (thickness) + dark lip + face + key-light
 * falloff + paper texture. o: { P, fill, rim, edge, thick, shadow:{dx,dy,b,op}|false, shadowCol, contact, tex, light, name, opacity }
 */
export function paper(parent, d, o = {}) {
  const P = o.P, fill = o.fill ?? '#c9bda4';
  const g = svg('g', o.name ? { 'data-name': o.name } : {}, parent);
  if (o.opacity != null) g.setAttribute('opacity', o.opacity);
  const sc = o.shadowCol ?? '#10161c';
  const sh = o.shadow === false ? null : { dx: 9, dy: 13, b: 7, op: 0.3, ...(o.shadow ?? {}) };
  if (sh) svg('path', { d, fill: sc, opacity: sh.op, transform: `translate(${sh.dx},${sh.dy})`, filter: `url(#${P}b${sh.b})` }, g);
  if (o.contact !== false) svg('path', { d, fill: sc, opacity: 0.42, transform: 'translate(1.4,2.6)', filter: `url(#${P}b2)` }, g);
  const th = o.thick ?? 2.6;
  if (th) svg('path', { d, fill: o.rim ?? shade(fill, 0.42), transform: `translate(${-th * 0.35},${-th})` }, g); // lit top face (board thickness)
  svg('path', { d, fill: o.edge ?? shade(fill, -0.45), transform: 'translate(0.6,1.3)' }, g); // dark lower lip
  const face = svg('path', { d, fill }, g);
  if (o.light !== false) svg('path', { d, fill: `url(#${P}lg)`, opacity: o.light ?? 1 }, g);
  if (o.tex !== false) svg('path', { d, fill: `url(#${P}tex)`, style: 'mix-blend-mode:multiply', opacity: o.tex ?? 0.9 }, g);
  g.face = face;
  return g;
}

// ---------------------------------------------------------------- 2.5D camera (cinema-shots §4.1, container-sized)
/**
 * Parallax layers inside a cw×ch container. Draw on each layer's SVG in CONTAINER coordinates (0..cw, 0..ch at rest).
 * p = 1 subject plane, < 1 far, > 1 near.
 */
export function makeCamera(parent, cw, ch, name = 'Camera world') {
  const world = el('div', { 'data-name': name, style: { position: 'absolute', left: 0, top: 0, width: cw + 'px', height: ch + 'px', overflow: 'hidden' } }, parent);
  const layers = [];
  return {
    world, layers, cw, ch,
    layer(lname, p, { margin = 0.4, sharp = false } = {}) {
      const mw = cw * margin, mh = ch * margin, w = cw + 2 * mw, h = ch + 2 * mh;
      const node = el('div', { 'data-name': lname, style: { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px', transformOrigin: '0 0' } }, world);
      const s = svg('svg', { width: w, height: h, viewBox: `${-mw} ${-mh} ${w} ${h}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, node);
      const l = { node, svg: s, p, w, h, sharp, name: lname };
      layers.push(l);
      s.layer = l;
      return s;
    },
    /** cam: {x,y (truck/ped at subject plane), panX,panY, zoom, dolly, roll, focusP, blur (design px), unit} */
    apply({ x = 0, y = 0, panX = 0, panY = 0, zoom = 1, dolly = 0, roll = 0, focusP = null, blur = 0, unit = 1, maxBlur = 30 }) {
      for (const l of layers) {
        const s = zoom / Math.max(0.3, 1 - dolly * l.p);
        const ox = -x * l.p * s - panX * zoom, oy = -y * l.p * s - panY * zoom;
        l.node.style.transform = `translate(${cw / 2}px,${ch / 2}px) rotate(${roll.toFixed(3)}deg) translate(${ox.toFixed(2)}px,${oy.toFixed(2)}px) scale(${s.toFixed(5)}) translate(${-l.w / 2}px,${-l.h / 2}px)`;
        if (focusP != null && !l.sharp) {
          // thin-lens shape with saturation (depth.md §1.4): blur grows with |p - focus| and levels off
          const dp = Math.abs(l.p - focusP), b = Math.min(maxBlur, blur * unit * (dp / (dp + 0.6)) * 1.6) / s;
          l.node.style.filter = b > 0.35 ? `blur(${b.toFixed(2)}px)` : 'none';
        }
      }
    },
  };
}

// ---------------------------------------------------------------- props
/** Foxtrot-like submarine (generic, no markings). Bow at x, facing left. Returns {g, window:{x,y,w,h}}. */
export function submarine(parent, P, x, y, len, { aspect = 16 / 9, fill = '#2b3335', seed = 300, glow = true } = {}) {
  const H = 0.043 * len, g = svg('g', { 'data-name': 'Submarine B-59' }, parent);
  const r = u => (u < 0.1 ? H * Math.sqrt(Math.max(0, 1 - ((0.1 - u) / 0.1) ** 2)) : u < 0.62 ? H : H * (1 - 0.86 * ((u - 0.62) / 0.38) ** 1.35));
  const sm = (a, b, u) => { const k = clamp((u - a) / (b - a)); return k * k * (3 - 2 * k); };
  const casing = u => 1.2 * H * sm(0.02, 0.13, u) * (1 - sm(0.8, 0.93, u));
  const top = [], bot = [];
  for (let i = 0; i <= 100; i++) { const u = i / 100; top.push([x + u * len, y - Math.max(r(u), casing(u))]); bot.push([x + u * len, y + r(u) * 0.96]); }
  const hull = cut([...top, ...bot.reverse()], seed, 0.5, 8);
  const sail = cut([[x + 0.335 * len, y - 1.15 * H], [x + 0.338 * len, y - 2.3 * H], [x + 0.352 * len, y - 2.75 * H], [x + 0.37 * len, y - 2.88 * H],
    [x + 0.448 * len, y - 2.8 * H], [x + 0.472 * len, y - 1.15 * H]], seed + 9, 0.4, 6);
  const masts = [[0.39, 3.7], [0.405, 4.1], [0.425, 3.4]].map(([u, h]) => rect(x + u * len, y - h * H, 0.006 * len, h * H - 2.6 * H));
  const rudder = cut([[x + 0.955 * len, y - 0.2 * H], [x + 0.985 * len, y - 1.3 * H], [x + 1.005 * len, y - 1.25 * H], [x + 1.0 * len, y + 1.25 * H], [x + 0.975 * len, y + 1.2 * H]], seed + 4, 0.3, 6);
  const plane = cut([[x + 0.06 * len, y + 0.1 * H], [x + 0.1 * len, y - 0.15 * H], [x + 0.115 * len, y + 0.35 * H]], seed + 5, 0.3, 6);
  const o = { P, fill, thick: Math.max(1.6, len * 0.004), shadow: { dx: len * 0.02, dy: len * 0.03, b: len > 900 ? 12 : 4, op: 0.35 } };
  for (const m of masts) paper(g, poly(m), { ...o, fill: shade(fill, -0.1), shadow: false });
  paper(g, poly(rudder), { ...o, fill: shade(fill, -0.05) });
  paper(g, poly(hull), { ...o, name: 'Hull' });
  paper(g, poly(sail), { ...o, fill: shade(fill, 0.06), shadow: { ...o.shadow, op: 0.25 } });
  paper(g, poly(plane), { ...o, fill: shade(fill, -0.15), shadow: false });
  // embossed plate seams + limber holes: score lines, not ink
  for (let i = 0; i < 9; i++) {
    const u = 0.16 + i * 0.075;
    svg('path', { d: `M${x + u * len},${y - H * 0.95} L${x + u * len + 0.5},${y + H * 0.85}`, stroke: shade(fill, -0.3), 'stroke-width': Math.max(0.6, len * 0.0016), opacity: 0.5 }, g);
  }
  for (let i = 0; i < 22; i++) {
    const u = 0.14 + i * 0.03;
    svg('path', { d: poly(rect(x + u * len, y - H * 1.08, len * 0.012, H * 0.13)), fill: shade(fill, -0.4), opacity: 0.55 }, g);
  }
  // cutaway window (museum-model convention): sized to the frame aspect so the camera can enter it
  const wh = 3.3 * H, ww = Math.min(0.26 * len, wh * aspect), wcx = x + 0.403 * len, wcy = y - 0.85 * H;
  const win = { x: wcx - ww / 2, y: wcy - wh / 2, w: ww, h: wh };
  g.window = win; g.H = H;
  return g;
}

/** Cutaway frame drawn over the window: the cut hull shell shows its pale board core. */
export function cutawayFrame(parent, P, win, fill = '#2b3335', t = 1) {
  const g = svg('g', { 'data-name': 'Cutaway edge' }, parent);
  const b = Math.max(1.2, win.h * 0.06) * t;
  const outer = cut(rect(win.x - b, win.y - b, win.w + 2 * b, win.h + 2 * b), 911, b * 0.08, b * 2);
  const inner = rect(win.x, win.y, win.w, win.h).reverse();
  svg('path', { d: poly(outer) + poly(inner), fill: '#d8cdb5', 'fill-rule': 'evenodd' }, g); // board core
  svg('path', { d: poly(rect(win.x - b * 0.45, win.y - b * 0.45, win.w + b * 0.9, win.h + b * 0.9)) + poly(inner), fill: shade(fill, -0.2), 'fill-rule': 'evenodd' }, g);
  // inner shadow so the room sits BEHIND the hull
  svg('path', { d: poly(rect(win.x, win.y, win.w, b * 1.4)), fill: '#000', opacity: 0.45, filter: `url(#${P}b2)` }, g);
  svg('path', { d: poly(rect(win.x, win.y, b * 0.9, win.h)), fill: '#000', opacity: 0.3, filter: `url(#${P}b2)` }, g);
  return g;
}

/** Generic US destroyer, profile, bow LEFT (no hull number, no flags). Waterline at y. */
export function destroyer(parent, P, x, y, len, { seed = 500, fill = '#7f888d', name = 'Destroyer' } = {}) {
  const g = svg('g', { 'data-name': name }, parent);
  const X = u => x + u * len, Y = v => y + v * len;
  const deck = u => -0.098 + 0.06 * u - 0.02 * u * u;
  const hullPts = [[X(0), Y(-0.1)]];
  for (let i = 1; i <= 20; i++) { const u = i / 20; hullPts.push([X(u), Y(deck(u))]); }
  hullPts.push([X(1.0), Y(0.012)], [X(0.95), Y(0.036)], [X(0.14), Y(0.04)], [X(0.065), Y(0.012)], [X(0.035), Y(0)]);
  const sup = fill, dark = shade(fill, -0.55), o = { P, thick: Math.max(1.8, len * 0.004), shadow: { dx: len * 0.03, dy: len * 0.016, b: 7, op: 0.36 } };
  const piece = (pts, f, extra = {}) => paper(g, poly(cut(pts, seed + pts.length * 7 + pts[0][0] * 0.01, 0.35, 6)), { ...o, fill: f, ...extra });
  // aft-to-fore so forward pieces overlap
  piece([[X(0.37), Y(deck(0.37))], [X(0.372), Y(-0.31)], [X(0.378), Y(-0.31)], [X(0.384), Y(deck(0.38))]], shade(sup, -0.2), { shadow: false }); // mast
  piece([[X(0.33), Y(-0.24)], [X(0.42), Y(-0.24)], [X(0.42), Y(-0.233)], [X(0.33), Y(-0.233)]], shade(sup, -0.2), { shadow: false }); // yard
  piece(rect(X(0.62), Y(-0.13), 0.17 * len, 0.06 * len), shade(sup, 0.05)); // aft deckhouse
  piece([[X(0.555), Y(-0.1)], [X(0.565), Y(-0.19)], [X(0.61), Y(-0.19)], [X(0.612), Y(-0.1)]], shade(sup, 0.1)); // funnel 2
  piece([[X(0.555), Y(-0.19)], [X(0.565), Y(-0.205)], [X(0.61), Y(-0.205)], [X(0.61), Y(-0.19)]], dark, { thick: 1 });
  piece([[X(0.425), Y(-0.1)], [X(0.435), Y(-0.2)], [X(0.482), Y(-0.2)], [X(0.486), Y(-0.1)]], shade(sup, 0.1)); // funnel 1
  piece([[X(0.425), Y(-0.2)], [X(0.435), Y(-0.215)], [X(0.482), Y(-0.215)], [X(0.482), Y(-0.2)]], dark, { thick: 1 });
  piece([[X(0.235), Y(-0.085)], [X(0.25), Y(-0.15)], [X(0.38), Y(-0.15)], [X(0.39), Y(-0.08)]], shade(sup, 0.08)); // bridge base
  piece([[X(0.265), Y(-0.15)], [X(0.275), Y(-0.19)], [X(0.345), Y(-0.19)], [X(0.35), Y(-0.15)]], shade(sup, 0.16)); // bridge
  svg('path', { d: poly(rect(X(0.28), Y(-0.178), 0.06 * len, 0.008 * len)), fill: dark, opacity: 0.8 }, g); // bridge windows (a dark strip)
  piece(roundRect(X(0.135), Y(-0.118), 0.055 * len, 0.03 * len, 0.012 * len), shade(sup, 0.12)); // gun mount 1
  piece(rect(X(0.09), Y(-0.108), 0.05 * len, 0.005 * len), dark, { shadow: false, thick: 0.8 });
  piece(roundRect(X(0.83), Y(-0.1), 0.05 * len, 0.028 * len, 0.011 * len), shade(sup, 0.12)); // gun mount aft
  for (let i = 0; i < 3; i++) piece(roundRect(X(0.93 + i * 0.018), Y(-0.072), 0.014 * len, 0.016 * len, 0.006 * len), '#3b4043', { thick: 1, shadow: false }); // depth charge rack
  const hull = paper(g, poly(cut(hullPts, seed, 0.4, 7)), { ...o, fill: shade(fill, -0.12), name: name + ' hull', thick: 2.4 });
  svg('path', { d: poly(rect(X(0.035), Y(-0.004), 0.965 * len, 0.044 * len)), fill: '#3a2a26', opacity: 0.0 }, g); // (boot-top kept as option)
  return g;
}

/**
 * Paper officer: hinged arm on a brass split pin. No face, no likeness. Origin = shoulder centre.
 * Returns { g, arm (set via setArm(deg)) } — 0° = hanging down, +90° = pointing toward `face` side horizontally.
 */
export function officer(parent, P, cx, sy, s, { face = 1, coat = '#2a1416', skin = '#c98c78', cap = '#1d0f10', seed = 700, name = 'Officer', light = '#ff7a5c', rim = 0, legs = true } = {}) {
  const g = svg('g', { 'data-name': name }, parent);
  const r = 24 * s, o = { P, thick: 2 * s, shadow: { dx: 10 * s, dy: 14 * s, b: 7, op: 0.45 }, shadowCol: '#0a0303' };
  const body = cut([[cx - 1.75 * r, sy + 0.55 * r], ...ellipse(cx - 1.05 * r, sy + 0.65 * r, 0.7 * r, 0.62 * r, 6, Math.PI, Math.PI * 1.5),
    ...ellipse(cx + 1.05 * r, sy + 0.65 * r, 0.7 * r, 0.62 * r, 6, Math.PI * 1.5, Math.PI * 2), [cx + 1.75 * r, sy + 0.55 * r],
    [cx + 1.55 * r, sy + 6.6 * r], [cx - 1.55 * r, sy + 6.6 * r]], seed, 0.5 * s, 8 * s);
  // legs (trousers + shoes), drawn first so the tunic overlaps them; feet on the deck at sy + 12.2 r
  if (legs) {
    svg('ellipse', { cx: cx + 1.6 * r, cy: sy + 12.25 * r, rx: 2.6 * r, ry: 0.35 * r, fill: '#06090c', opacity: 0.45, filter: `url(#${P}b7)` }, g); // cast shadow on the deck (key upper-left)
    for (const lx of [-1, 1]) {
      paper(g, poly(cut([[cx + lx * 0.12 * r, sy + 6 * r], [cx + lx * 1.2 * r, sy + 6 * r], [cx + lx * 1.0 * r, sy + 11.9 * r], [cx + lx * 0.2 * r, sy + 11.9 * r]], seed + 20 + lx, 0.3 * s, 8 * s)), { ...o, fill: shade(coat, lx > 0 ? -0.12 : 0.02), shadow: { dx: 5 * s, dy: 4 * s, b: 2, op: 0.4 } });
      paper(g, poly(cut(roundRect(cx + lx * 0.6 * r - 0.62 * r + (face < 0 ? -0.25 * r : 0.25 * r), sy + 11.75 * r, 1.24 * r, 0.5 * r, 0.22 * r), seed + 30 + lx, 0.2 * s, 4)), { ...o, fill: '#121418', thick: 1, shadow: { dx: 3 * s, dy: 2 * s, b: 1, op: 0.5 } });
    }
  }
  paper(g, poly(cut(rect(cx - 0.32 * r, sy - 0.6 * r, 0.64 * r, 0.9 * r), seed + 1, 0.3 * s, 6)), { ...o, fill: shade(skin, -0.25), shadow: false }); // neck
  paper(g, poly(body), { ...o, fill: coat, name: name + ' coat' });
  // lapel + shoulder boards: separate small pieces glued on (a hand-made detail)
  paper(g, poly(cut([[cx - 0.45 * r, sy + 0.1 * r], [cx, sy + 1.5 * r], [cx + 0.45 * r, sy + 0.1 * r]], seed + 2, 0.3 * s, 5)), { ...o, fill: shade(coat, 0.18), shadow: { dx: 2 * s, dy: 3 * s, b: 1, op: 0.4 } });
  for (const sx of [-1, 1]) paper(g, poly(cut(rect(cx + sx * 1.05 * r - 0.42 * r, sy + 0.12 * r, 0.84 * r, 0.22 * r), seed + 3 + sx, 0.2 * s, 5)), { ...o, fill: '#b98a4c', thick: 1, shadow: { dx: 1.5 * s, dy: 2 * s, b: 1, op: 0.5 } });
  for (let i = 0; i < 2; i++) svg('circle', { cx: cx + 0.42 * r * face, cy: sy + (2.2 + i * 1.3) * r, r: 0.12 * r, fill: '#d9a35c' }, g);
  const head = paper(g, poly(cut(ellipse(cx, sy - 1.3 * r, r, r * 1.04, 28), seed + 4, 0.3 * s, 6)), { ...o, fill: skin, name: name + ' head' });
  // peaked cap: crown, band, visor toward `face`
  paper(g, poly(cut([[cx - 1.05 * r, sy - 2.0 * r], [cx + 1.05 * r, sy - 2.0 * r], [cx + 0.98 * r, sy - 1.62 * r], [cx - 0.98 * r, sy - 1.62 * r]], seed + 5, 0.3 * s, 5)), { ...o, fill: shade(cap, 0.05) });
  paper(g, poly(cut(ellipse(cx + 0.08 * r * face, sy - 2.06 * r, 1.42 * r, 0.36 * r, 20), seed + 6, 0.3 * s, 6)), { ...o, fill: shade(cap, 0.12), shadow: { dx: 3 * s, dy: 5 * s, b: 2, op: 0.5 } });
  svg('circle', { cx: cx + 0.1 * r * face, cy: sy - 1.82 * r, r: 0.16 * r, fill: '#d9a35c' }, g); // cap badge (brass)
  // rim light from the practical lamp on the side facing it
  svg('path', { d: poly(ellipse(cx, sy - 1.3 * r, r, r * 1.04, 28, -Math.PI * 0.95, -Math.PI * 0.35)), fill: 'none', stroke: light, 'stroke-width': 1.6 * s, opacity: rim, 'stroke-linecap': 'round' }, g);
  // arm: separate piece on a split pin, toward `face`
  const px = cx + 1.25 * r * face, py = sy + 0.75 * r;
  const arm = svg('g', { 'data-name': name + ' arm' }, g);
  const armPts = cut([[px - 0.42 * r, py - 0.2 * r], [px + 0.42 * r, py - 0.2 * r], [px + 0.34 * r, py + 4.9 * r], [px - 0.34 * r, py + 4.9 * r]], seed + 8, 0.25 * s, 6);
  paper(arm, poly(armPts), { ...o, fill: shade(coat, 0.1), shadow: { dx: 8 * s, dy: 11 * s, b: 4, op: 0.5 } });
  paper(arm, poly(cut(ellipse(px, py + 5.2 * r, 0.38 * r, 0.48 * r, 16), seed + 9, 0.2 * s, 5)), { ...o, fill: skin, shadow: { dx: 6 * s, dy: 8 * s, b: 2, op: 0.5 } });
  svg('circle', { cx: px, cy: py, r: 0.2 * r, fill: '#c9954f' }, arm); // brass split pin
  svg('circle', { cx: px - 0.06 * r, cy: py - 0.06 * r, r: 0.08 * r, fill: '#f3d28e' }, arm);
  const setArm = deg => arm.setAttribute('transform', `rotate(${(-deg * face).toFixed(2)} ${px.toFixed(1)} ${py.toFixed(1)})`);
  setArm(8);
  return { g, arm, setArm, head, x: cx, y: sy, r };
}

/** Round handwheel (valve) with spokes. */
export function wheel(parent, P, cx, cy, R, fill = '#9b2b22', seed = 900) {
  const g = svg('g', { 'data-name': 'Valve wheel' }, parent);
  const ring = ellipse(cx, cy, R, R, 32), inner = ellipse(cx, cy, R * 0.78, R * 0.78, 32).reverse();
  const spokes = [0, 1, 2].map(i => { const a = (i * Math.PI) / 3 + 0.3; return rect(-R * 0.08, -R * 0.82, R * 0.16, R * 1.64).map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]); });
  const o = { P, fill, thick: 1.5, shadow: { dx: R * 0.25, dy: R * 0.35, b: 4, op: 0.5 }, shadowCol: '#0a0303' };
  for (const sp of spokes) paper(g, poly(cut(sp, seed, 0.2, 5)), { ...o, fill: shade(fill, -0.15) });
  paper(g, poly(cut(ring, seed + 1, 0.3, 5)) + poly(inner), { ...o });
  paper(g, poly(ellipse(cx, cy, R * 0.18, R * 0.18, 12)), { ...o, fill: shade(fill, 0.1), shadow: false });
  return g;
}
/** Gauge: cream dial, tick marks, one needle (no text). */
export function gauge(parent, P, cx, cy, R, needle = -0.6, seed = 950, face = '#cf9a83') {
  const g = svg('g', { 'data-name': 'Gauge' }, parent);
  paper(g, poly(cut(ellipse(cx, cy, R * 1.14, R * 1.14, 30), seed, 0.3, 5)), { P, fill: '#3b1a18', thick: 1.6, shadow: { dx: R * 0.15, dy: R * 0.22, b: 4, op: 0.5 }, shadowCol: '#090202' });
  paper(g, poly(ellipse(cx, cy, R, R, 30)), { P, fill: face, thick: 0, shadow: false, contact: false });
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI * 1.25 + (i / 10) * Math.PI * 1.5, r0 = R * (i % 5 ? 0.78 : 0.68);
    svg('path', { d: `M${cx + Math.cos(a) * r0},${cy + Math.sin(a) * r0}L${cx + Math.cos(a) * R * 0.9},${cy + Math.sin(a) * R * 0.9}`, stroke: '#3a1512', 'stroke-width': Math.max(0.8, R * 0.05) }, g);
  }
  const n = svg('path', { d: `M${cx},${cy + R * 0.1}L${cx + R * 0.05},${cy}L${cx},${cy - R * 0.78}L${cx - R * 0.05},${cy}Z`, fill: '#4a0f0b', transform: `rotate(${needle * 57.3} ${cx} ${cy})` }, g);
  svg('circle', { cx, cy, r: R * 0.08, fill: '#2a0b08' }, g);
  g.needle = n;
  return g;
}

// ---------------------------------------------------------------- museum label (screen space)
const FONT_LABEL = "'Schibsted Grotesk', sans-serif", FONT_DISPLAY = "'Fraunces', serif";
/**
 * A museum label card, placed on the glass. Anchor = bottom-left at (x, y) unless anchor:'tl'.
 * Lines: [{ text, kind:'kicker'|'main'|'note'|'accent' }]
 */
export function card(root, L, { name, lines, x, y, anchor = 'bl', maxW, tone = 'light' }) {
  const light = tone === 'light';
  const node = el('div', { 'data-name': name, style: {
    position: 'absolute', left: Math.round(x) + 'px', top: Math.round(y) + 'px',
    padding: `${L.px(16)}px ${L.px(24)}px ${L.px(18)}px ${L.px(22)}px`,
    background: light ? '#ebe2cd' : '#1f1b18', backgroundImage: `url(${paperTexture()})`, backgroundBlendMode: 'multiply',
    color: light ? '#1d1813' : '#ece2cc', maxWidth: maxW ? maxW + 'px' : 'none', opacity: 0,
    fontKerning: 'normal', fontSynthesis: 'none', textRendering: 'geometricPrecision',
    borderLeft: `${L.px(5)}px solid ${light ? '#8c2a1f' : '#c9a25f'}`,
  } }, root);
  const rows = lines.map(ln => {
    const k = ln.kind ?? 'main';
    const st = k === 'kicker'
      ? { fontFamily: FONT_LABEL, fontWeight: 600, fontSize: L.px(25) + 'px', letterSpacing: '0.14em', textTransform: 'uppercase', color: light ? '#6d5b47' : '#b9a88c', marginBottom: L.px(6) + 'px', whiteSpace: 'nowrap' }
      : k === 'note'
        ? { fontFamily: FONT_LABEL, fontWeight: 400, fontSize: L.px(24) + 'px', letterSpacing: '0.02em', color: light ? '#5c4d3d' : '#b9a88c', marginTop: L.px(8) + 'px', whiteSpace: 'nowrap' }
        : k === 'accent'
          ? { fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontWeight: 600, fontSize: L.px(ln.size ?? 50) + 'px', lineHeight: 1.05, color: light ? '#8c2a1f' : '#e7a07d', whiteSpace: 'nowrap', marginTop: L.px(4) + 'px' }
          : { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: L.px(ln.size ?? 54) + 'px', lineHeight: 1.04, letterSpacing: '-0.012em', whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums' };
    return el('div', { 'data-name': `${name} — ${k}`, style: st }, node, ln.text);
  });
  const W = node.offsetWidth, H = node.offsetHeight;
  const ox = anchor.includes('r') ? -W : 0, oy = anchor.includes('b') ? -H : 0;
  const u = L.unit;
  return {
    node, rows, w: W, h: H,
    /** Placed onto the glass: drops 10 px with its shadow tightening (lifted → resting). Row i may have its own onset. */
    update(t, tin, tout = 1e9, rowIn = []) {
      const e = ease.outQuart(progress(t, tin, tin + 0.42)), x = 1 - ease.inCubic(progress(t, tout, tout + 0.3));
      const a = Math.min(clamp((t - tin) / 0.2), x);
      node.style.opacity = a.toFixed(3);
      const lift = (1 - e) * 12 * u;
      node.style.transform = `translate(${ox}px,${(oy - lift).toFixed(2)}px)`;
      const sd = 3 + (1 - e) * 16;
      node.style.boxShadow = `${(1 * u).toFixed(1)}px ${(1.6 * u).toFixed(1)}px ${(2 * u).toFixed(1)}px rgba(18,12,8,${0.5 * a}), ${(sd * 0.6 * u).toFixed(1)}px ${(sd * u).toFixed(1)}px ${(sd * 1.8 * u).toFixed(1)}px rgba(14,10,8,${0.32 * a})`;
      rowIn.forEach((ti, i) => { if (ti != null && rows[i]) rows[i].style.opacity = clamp((t - ti) / 0.25).toFixed(3); });
    },
  };
}

/** Small hanging tag (world space): string + punched card with one word. */
export function tag(parent, P, x, y, text, { size = 22, seed = 1200, fill = '#e9dfc8', ink = '#2a1f17', string = 46, side = 1 } = {}) {
  const g = svg('g', { 'data-name': 'Tag ' + text }, parent);
  const w = text.length * size * 0.72 + size * 1.6, h = size * 1.75, tx = x + side * size * 0.4, ty = y + string;
  svg('path', { d: `M${x},${y} Q${x + side * string * 0.15},${y + string * 0.6} ${tx + size * 0.55},${ty + h * 0.5}`, stroke: '#d8cfb8', 'stroke-width': Math.max(1, size * 0.06), fill: 'none', opacity: 0.9 }, g);
  paper(g, poly(cut([[tx, ty + h * 0.3], [tx + h * 0.3, ty], [tx + w, ty], [tx + w, ty + h], [tx + h * 0.3, ty + h], [tx, ty + h * 0.7]], seed, 0.3, 5)),
    { P, fill, thick: 1.4, shadow: { dx: size * 0.4, dy: size * 0.6, b: 4, op: 0.4 } });
  svg('circle', { cx: tx + size * 0.55, cy: ty + h * 0.5, r: size * 0.16, fill: '#3a2c22' }, g); // punched hole
  const t = svg('text', { x: tx + size * 1.05, y: ty + h * 0.68, fill: ink, 'font-family': 'Schibsted Grotesk', 'font-weight': 600, 'font-size': size, 'letter-spacing': size * 0.14 }, g);
  t.textContent = text.toUpperCase();
  return g;
}

// ---------------------------------------------------------------- final grade (one layer over the comp, §8b.4)
export function grade(root, L, { fps = 30, vignette = 0.42, warm = 0.06, tilt = 0 } = {}) {
  const W = L.width, H = L.height, u = L.unit;
  let tiltTop = null, tiltBot = null;
  if (tilt) { // miniature look (deliberate): blur bands top + bottom
    const mk = (pos, grad) => el('div', { 'data-name': 'Miniature focus band', style: { position: 'absolute', left: 0, right: 0, [pos]: 0, height: H * 0.3 + 'px', backdropFilter: `blur(${tilt * u}px)`, WebkitMaskImage: grad, maskImage: grad, pointerEvents: 'none' } }, root);
    tiltTop = mk('top', 'linear-gradient(to bottom, #000 0%, #000 25%, transparent 100%)');
    tiltBot = mk('bottom', 'linear-gradient(to top, #000 0%, #000 25%, transparent 100%)');
  }
  el('div', { 'data-name': 'Grade: warm paper tint', style: { position: 'absolute', inset: 0, background: '#ffd9a8', opacity: warm, mixBlendMode: 'soft-light', pointerEvents: 'none' } }, root);
  if (vignette > 0) el('div', { 'data-name': 'Grade: vignette', style: { position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply',
    background: `radial-gradient(ellipse ${W > H ? '78% 92%' : '110% 72%'} at 50% 46%, rgba(255,255,255,1) 45%, rgba(${Math.round(255 - 255 * vignette)},${Math.round(250 - 250 * vignette)},${Math.round(246 - 246 * vignette)},1) 100%)` } }, root);
  const grain = el('div', { 'data-name': 'Grade: grain', style: { position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `url(${grainTexture()})`, backgroundSize: `${Math.round(256 * 1.5 * u)}px`, mixBlendMode: 'overlay', opacity: 0.11 } }, root);
  return {
    tiltTop, tiltBot,
    update(globalT) {
      const f = Math.round(globalT * fps);
      grain.style.backgroundPosition = `${Math.round(rand(f * 1.13 + 2) * 256)}px ${Math.round(rand(f * 2.71 + 5) * 256)}px`;
    },
  };
}

// ================================================================ DIORAMA additions (style-diorama scenes)
export const INK = '#211a14', CREAM = '#e9dec6', VERMILION = '#a3341f', BRASS = '#b98a4c';
const F_MAIN = "'Newsreader', serif", F_TYPE = "'IBM Plex Mono', monospace";

/** Local time (scene seconds) of the n-th occurrence of `word` inside this scene. */
export function wt(ctx, word, n = 0, fb = 0) {
  const clean = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = ctx.words.filter(w => w.start >= ctx.start - 0.05 && w.start < ctx.start + ctx.duration && clean(w.word) === clean(word));
  return hits[n] ? hits[n].start - ctx.start : fb;
}
/** Scene-in dissolve over the voice-overlap (first scene stays opaque). */
export function sceneIn(root, ctx, t, dur = 0.45) { root.style.opacity = ctx.start > 0 ? clamp(t / dur).toFixed(3) : '1'; }

const tagClip = n => `polygon(${n}px 0, 100% 0, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px), 0 ${n}px)`;
/**
 * Paper tag in screen space (text is read here, never on a moving layer). Card with real thickness:
 * dark underside lip (bottom-right), lit cut edge (top-left), punched hole + brass pin, cast + contact shadow (key upper-left).
 * lines: [{ text, kind:'kicker'|'main'|'accent'|'note', size }]. Anchor (ax, ay) in 0..1 of the card.
 */
export function label(root, L, { name, lines, x, y, ax = 0, ay = 0, rot = 0, maxW = null }) {
  const u = L.unit, n = Math.round(14 * u);
  const wrap = el('div', { 'data-name': name, style: { position: 'absolute', left: Math.round(x) + 'px', top: Math.round(y) + 'px', opacity: 0 } }, root);
  const inner = el('div', { style: { position: 'relative', transform: `translate(${-ax * 100}%, ${-ay * 100}%)` } }, wrap);
  const mover = el('div', { style: { position: 'relative', transformOrigin: '12% 50%' } }, inner);
  const lip = el('div', { style: { position: 'absolute', inset: 0, background: '#8f826a', clipPath: tagClip(n), transform: `translate(${(1.2 * u).toFixed(1)}px,${(2.2 * u).toFixed(1)}px)` } }, mover);
  const edge = el('div', { style: { position: 'absolute', inset: 0, background: '#f8f1e0', clipPath: tagClip(n), transform: `translate(${(-0.8 * u).toFixed(1)}px,${(-1.4 * u).toFixed(1)}px)` } }, mover);
  const body = el('div', { style: {
    position: 'relative', clipPath: tagClip(n), background: CREAM, backgroundImage: `url(${paperTexture()})`, backgroundBlendMode: 'multiply',
    backgroundSize: `${Math.round(384 * 0.8 * u)}px`, color: INK, padding: `${L.px(14)}px ${L.px(30)}px ${L.px(16)}px ${L.px(54)}px`,
    maxWidth: maxW ? maxW + 'px' : 'none', fontKerning: 'normal', fontSynthesis: 'none', textRendering: 'geometricPrecision',
  } }, mover);
  el('div', { style: { position: 'absolute', left: L.px(17) + 'px', top: '50%', width: L.px(15) + 'px', height: L.px(15) + 'px', marginTop: L.px(-7.5) + 'px', borderRadius: '50%', background: '#2a241d', boxShadow: `inset ${L.px(1.5)}px ${L.px(2)}px ${L.px(2)}px rgba(0,0,0,.6)` } }, body); // punched hole
  el('div', { 'data-name': name + ' pin', style: { position: 'absolute', left: L.px(19) + 'px', top: '50%', width: L.px(11) + 'px', height: L.px(11) + 'px', marginTop: L.px(-5.5) + 'px', borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #f1d696 0 20%, ${BRASS} 55%, #6e4f24 100%)`, boxShadow: `${L.px(2)}px ${L.px(3)}px ${L.px(2)}px rgba(16,12,8,.55)` } }, body); // brass pin head
  const rows = lines.map((ln, i) => {
    const k = ln.kind ?? 'main';
    const st = k === 'kicker'
      ? { fontFamily: F_TYPE, fontWeight: 500, fontSize: L.px(ln.size ?? 24) + 'px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b4d3d', marginBottom: L.px(12) + 'px', whiteSpace: 'nowrap' }
      : k === 'note'
        ? { fontFamily: F_TYPE, fontWeight: 400, fontSize: L.px(ln.size ?? 21) + 'px', letterSpacing: '0.02em', color: '#5b4d3d', marginTop: L.px(14) + 'px', whiteSpace: 'nowrap' }
        : k === 'accent'
          ? { fontFamily: F_MAIN, fontStyle: 'italic', fontWeight: 600, fontSize: L.px(ln.size ?? 54) + 'px', lineHeight: 1.05, color: VERMILION, whiteSpace: 'nowrap' }
          : { fontFamily: F_MAIN, fontWeight: 600, fontSize: L.px(ln.size ?? 56) + 'px', lineHeight: 1.06, letterSpacing: '-0.01em', whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums tabular-nums' };
    return el('div', { 'data-name': `${name} — ${k}`, style: st }, body, ln.text);
  });
  return {
    node: wrap, body, rows,
    /** Placed by hand: arrives lifted (bigger, softer shadow, slight turn) and settles flat on the board. */
    update(t, tin, tout = 1e9) {
      const e = ease.outQuart(progress(t, tin, tin + 0.5)), xo = ease.inCubic(progress(t, tout, tout + 0.3));
      const a = Math.min(clamp((t - tin) / 0.18), 1 - xo);
      wrap.style.opacity = a.toFixed(3);
      wrap.style.display = a <= 0 ? 'none' : '';
      const lift = 1 - e + xo;
      mover.style.transform = `translate(${(-4 * lift * u).toFixed(2)}px,${(-12 * lift * u).toFixed(2)}px) rotate(${(rot + lift * 2.2).toFixed(2)}deg) scale(${(1 + lift * 0.03).toFixed(4)})`;
      const d = 4 + lift * 14;
      mover.style.filter = `drop-shadow(${(1 * u).toFixed(1)}px ${(1.8 * u).toFixed(1)}px ${(1.5 * u).toFixed(1)}px rgba(20,16,12,0.5)) drop-shadow(${(d * 0.6 * u).toFixed(1)}px ${(d * u).toFixed(1)}px ${(d * 1.3 * u).toFixed(1)}px rgba(14,18,24,${(0.3 - lift * 0.1).toFixed(2)}))`;
    },
  };
}

/** Vote card: one paper tag with three boxes. Ticks are pen strokes (drawn on), NO is a vermilion rubber stamp. */
export function voteCard(root, L, { name = 'Vote card', x, y, ax = 0, ay = 0, rot = 0, kicker = 'To fire: all three agree' }) {
  const lab = label(root, L, { name, x, y, ax, ay, rot, lines: [{ text: kicker, kind: 'kicker' }] });
  const u = L.unit, row = el('div', { 'data-name': name + ' boxes', style: { display: 'flex', gap: L.px(26) + 'px', marginTop: L.px(10) + 'px', alignItems: 'flex-end' } }, lab.body);
  const S = L.px(64);
  const boxes = [0, 1, 2].map(i => {
    const cell = el('div', { 'data-name': `${name} box ${i + 1}`, style: { position: 'relative', width: S + 'px', height: S + 'px', border: `${L.px(3.2)}px solid ${INK}`, borderRadius: L.px(3) + 'px', transform: `rotate(${(rand(i * 7.7 + 3) - 0.5) * 3}deg)` } }, row);
    const s = svg('svg', { width: S * 1.2, height: S * 1.2, viewBox: '0 0 100 100', style: `position:absolute;left:${-S * 0.05}px;top:${-S * 0.18}px;overflow:visible` }, cell);
    const tick = svg('path', { d: 'M18,55 C26,60 34,70 40,82 C52,58 68,34 92,14', fill: 'none', stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, s);
    const cap = el('div', { style: { position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', fontFamily: F_TYPE, fontSize: L.px(18) + 'px', color: '#5b4d3d', marginTop: L.px(4) + 'px' } }, cell, ['I', 'II', 'III'][i]);
    return { cell, tick, cap };
  });
  row.style.marginBottom = L.px(22) + 'px';
  const stamp = el('div', { 'data-name': name + ' stamp NO', style: { position: 'absolute', left: '50%', top: '50%', fontFamily: F_MAIN, fontWeight: 600, fontSize: L.px(46) + 'px', color: VERMILION, letterSpacing: '0.04em', border: `${L.px(4)}px solid ${VERMILION}`, borderRadius: L.px(6) + 'px', padding: `0 ${L.px(8)}px`, lineHeight: 1.1, opacity: 0, mixBlendMode: 'multiply' } }, boxes[2].cell, 'NO');
  return {
    ...lab, boxes,
    update(t, tin, { ticks = [], stampAt = null, tout = 1e9 } = {}) {
      lab.update(t, tin, tout);
      boxes.forEach((b, i) => {
        const p = ticks[i] != null ? ease.outCubic(progress(t, ticks[i], ticks[i] + 0.22)) : 0;
        b.tick.setAttribute('stroke-dashoffset', (1 - p).toFixed(3));
      });
      if (stampAt != null) {
        const p = progress(t, stampAt, stampAt + 0.16);
        stamp.style.opacity = (p > 0 ? 0.92 * clamp(p * 3) : 0).toFixed(3);
        stamp.style.transform = `translate(-50%,-50%) rotate(-9deg) scale(${(1.35 - 0.35 * ease.outCubic(p)).toFixed(3)})`;
      }
    },
  };
}

/**
 * The model box's front opening, cut from corrugated card (flutes visible on the cut edge). Drawn on a NEAR layer
 * so a dolly passes through it: the tell that this is a real object on a table. o: { p, u, open:{x,y,w,h}, fill }
 */
export function boxFrame(cam, P, { p = 1.6, u = 1, open, fill = '#8c6d4a', name = 'Model box front (corrugated card)' }) {
  const l = cam.layer(name, p, { margin: 0.9 });
  const { cw, ch } = cam, B = Math.max(cw, ch) * 1.2, ct = 15 * u;
  const { x, y, w, h } = open;
  const outer = rect(x - B, y - B, w + 2 * B, h + 2 * B), inner = rect(x, y, w, h).reverse();
  const g = svg('g', { 'data-name': name }, l);
  // face of the box (kraft), holes cut with a knife: slightly wavy edge
  paper(g, poly(outer) + poly(cut(rect(x, y, w, h), 77, 1.2 * u, 30 * u).reverse()), { P, fill, thick: 0, shadow: { dx: 14 * u, dy: 22 * u, b: 20, op: 0.45 }, shadowCol: '#0a0806', light: 0.6, tex: 1 });
  // cut edge: two liners + fluting, on the top/left inner edges (lit) and right/bottom (in shade)
  const edgeBand = (x0, y0, x1, y1, horiz, lit) => {
    const len = horiz ? x1 - x0 : y1 - y0;
    const base = lit ? '#d9bf94' : '#6b5236', flute = lit ? '#a8865d' : '#4a3825';
    const bx = horiz ? rect(x0, y0, len, ct) : rect(x0, y0, ct, len);
    svg('path', { d: poly(bx), fill: base }, g);
    let dpath = '';
    const per = 9 * u;
    for (let k = 0; k <= len / per; k++) {
      const a = k * per;
      dpath += horiz ? `M${x0 + a},${y0 + ct * 0.18} Q${x0 + a + per / 2},${y0 + ct * 0.95} ${x0 + a + per},${y0 + ct * 0.18}`
        : `M${x0 + ct * 0.18},${y0 + a} Q${x0 + ct * 0.95},${y0 + a + per / 2} ${x0 + ct * 0.18},${y0 + a + per}`;
    }
    svg('path', { d: dpath, fill: 'none', stroke: flute, 'stroke-width': 1.6 * u }, g);
    svg('path', { d: poly(horiz ? rect(x0, y0, len, ct * 0.14) : rect(x0, y0, ct * 0.14, len)), fill: lit ? '#efdcb8' : '#7d6142' }, g);
    svg('path', { d: poly(horiz ? rect(x0, y0 + ct * 0.86, len, ct * 0.14) : rect(x0 + ct * 0.86, y0, ct * 0.14, len)), fill: lit ? '#bfa071' : '#5a432b' }, g);
  };
  edgeBand(x, y - ct, x + w, y, true, false); // top edge faces down → in shade
  edgeBand(x - ct, y, x, y + h, false, false); // left edge faces right → in shade
  edgeBand(x + w, y, x + w + ct, y + h, false, true); // right edge faces left → lit by upper-left key
  edgeBand(x, y + h, x + w, y + h + ct, true, true); // bottom edge faces up → lit
  return l;
}

/** Camera state → screen position of a point drawn at container coords (px, py) on a layer with parallax p (matches apply()). */
export function toScreen(cam, p, px, py, st) {
  const { x = 0, y = 0, panX = 0, panY = 0, zoom = 1, dolly = 0 } = st, s = zoom / Math.max(0.3, 1 - dolly * p);
  return [cam.cw / 2 - x * p * s - panX * zoom + (px - cam.cw / 2) * s, cam.ch / 2 - y * p * s - panY * zoom + (py - cam.ch / 2) * s];
}
export function fromScreen(cam, p, sx, sy, st) {
  const { x = 0, y = 0, panX = 0, panY = 0, zoom = 1, dolly = 0 } = st, s = zoom / Math.max(0.3, 1 - dolly * p);
  return [cam.cw / 2 + (sx - cam.cw / 2 + x * p * s + panX * zoom) / s, cam.ch / 2 + (sy - cam.ch / 2 + y * p * s + panY * zoom) / s];
}
/** Practice depth charge: small card drum with two end caps. Centre at 0,0 (place with a transform). */
export function charge(parent, P, s, seed = 1300) {
  const g = svg('g', { 'data-name': 'Depth charge (practice)' }, parent);
  const o = { P, thick: 1.2, shadow: { dx: 5 * s, dy: 3 * s, b: 2, op: 0.4 } };
  paper(g, poly(cut(roundRect(-9 * s, -12 * s, 18 * s, 24 * s, 3 * s), seed, 0.3, 4)), { ...o, fill: '#4a4f4c' });
  for (const yy of [-8, 6]) svg('path', { d: poly(rect(-9 * s, yy * s, 18 * s, 2.2 * s)), fill: '#2a2d2b' }, g);
  return g;
}
/** Burst as a twist of crumpled tissue paper (white, matte, folds drawn as darker facets). No glow. */
export function tissue(parent, P, r, seed = 1400) {
  const g = svg('g', { 'data-name': 'Burst (crumpled tissue)' }, parent);
  const pts = [];
  for (let i = 0; i < 15; i++) { const a = (i / 15) * Math.PI * 2, rr = r * (0.7 + 0.45 * rand(seed + i * 3.3)); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.92]); }
  paper(g, poly(pts), { P, fill: '#e4e6df', thick: 1.6, shadow: { dx: r * 0.18, dy: r * 0.12, b: 7, op: 0.35 }, shadowCol: '#06141b', light: 1, tex: 1 });
  for (let i = 0; i < 7; i++) { // creases: thin grey facets
    const a = rand(seed + i * 7.1) * 6.283, l = r * (0.4 + 0.5 * rand(seed + i)), a2 = a + 0.5 + rand(seed + i * 2) * 0.6;
    svg('path', { d: poly([[0, 0], [Math.cos(a) * l, Math.sin(a) * l], [Math.cos(a2) * l * 0.7, Math.sin(a2) * l * 0.7]]), fill: '#aeb6b3', opacity: 0.35 + rand(seed + i * 5) * 0.25 }, g);
  }
  // a few loose bubbles (punched dots of the same tissue)
  for (let i = 0; i < 5; i++) svg('circle', { cx: (rand(seed + i * 9) - 0.5) * r * 2.4, cy: -r * (0.9 + rand(seed + i * 4) * 1.1), r: r * (0.05 + rand(seed + i) * 0.06), fill: '#dfe5e1', opacity: 0.85 }, g);
  return g;
}
