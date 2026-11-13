// ENGRAVING kit — security-print (intaglio) look made only from lines.
// Everything is a pure function of time. Imperfection is seeded once per object, never per frame.
//
// Layers of one "note" (bottom → top):
//   back  (world space, CSS camera): shadow + cotton paper canvas (fibres, security threads, iris tint)
//   ink   (screen space canvas, redrawn each frame with the camera matrix → crisp at any zoom): engraved line fields
//   front (world space SVG): border band (guilloche + microtext), vignette frame, rosette seal, numerals, serials, stamps
import { el, svg, rand, clamp, lerp } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep } from '/onclack-styles/engine/lib/spring.js';

export const PAL = {
  paper: '#EEEAD9', ink: '#1F3B2D', red: '#B0302A', desk: '#141B17', hole: '#0B110E',
  tintRose: '#EFCFC2', tintGold: '#EAE0B4', tintSea: '#C9E0D8', tintLilac: '#DCD3E6',
};
export const FONT = { serif: "'Instrument Serif'", num: "'Sofia Sans Extra Condensed'" };
export const ss = (a, b, x) => smootherstep((x - a) / (b - a));

// ---------------------------------------------------------------- geometry (note units, one per orientation)
export function geom(L, kind) {
  const P = L.portrait;
  if (kind === 'sea') return P ? {
    W: 900, H: 1500, vig: { x: 56, y: 60, w: 788, h: 860 },
    seal: { cx: 450, cy: 1218, R: 182, cw: 300, ch: 150 },
    serialA: { x: 78, y: 1226, a: 'start' }, serialB: { x: 822, y: 1226, a: 'end' }, legend: { x: 450, y: 1004, size: 52 },
  } : {
    W: 1640, H: 860, vig: { x: 64, y: 64, w: 1090, h: 664 },
    seal: { cx: 1372, cy: 404, R: 200, cw: 300, ch: 150 },
    serialA: { x: 1372, y: 128, a: 'middle' }, serialB: { x: 1372, y: 712, a: 'middle' }, legend: { x: 609, y: 790, size: 44 },
  };
  // 'vote'
  return P ? {
    W: 900, H: 1500, vig: { x: 56, y: 60, w: 788, h: 380 },
    seal: { cx: 450, cy: 588, R: 136, cw: 280, ch: 132 },
    serialA: { x: 78, y: 596, a: 'start' }, serialB: { x: 822, y: 596, a: 'end' },
    boxes: [0, 1, 2].map(i => ({ x: 56, y: 752 + i * 222, w: 788, h: 204 })), legend: { x: 450, y: 1432, size: 26 },
  } : {
    W: 1640, H: 860, vig: { x: 64, y: 64, w: 1090, h: 380 },
    seal: { cx: 1372, cy: 254, R: 172, cw: 290, ch: 136 },
    serialA: { x: 1576, y: 808, a: 'end' }, serialB: { x: 64, y: 808, a: 'start' },
    boxes: [0, 1, 2].map(i => ({ x: 64 + i * 512, y: 470, w: 488, h: 300 })), legend: { x: 820, y: 806, size: 24 },
  };
}

// ---------------------------------------------------------------- camera
/** Zoom-out/in between two framings that keeps the motion straight on screen (inverse-zoom interpolation). */
export function camLerp(a, b, p) {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), p));
  const q = Math.abs(1 / b.z - 1 / a.z) < 1e-6 ? p : (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z);
  return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), z };
}
/** keys: [[T, {x,y,z}], ...] — holds between keys, glides (camera token) over `dur` s after each key time. */
export function camPath(T, keys) {
  let c = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t0, k, dur = 1] = keys[i];
    if (T <= t0) break;
    const p = clamp((T - t0) / dur);
    // camera token (0.45,0,0.15,1)-like: slow start, long settle
    const e = p < 1 ? 1 - Math.pow(1 - smootherstep(p), 1.6) : 1;
    c = camLerp(c, k, e);
  }
  return c;
}

// ---------------------------------------------------------------- paper (cached per format+kind)
const paperCache = new Map();
function paperCanvas(G, key) {
  if (paperCache.has(key)) return paperCache.get(key);
  const S = 2, c = document.createElement('canvas');
  c.width = G.W * S; c.height = G.H * S;
  const g = c.getContext('2d');
  g.scale(S, S);
  g.fillStyle = PAL.paper; g.fillRect(0, 0, G.W, G.H);
  // iris ("rainbow") print: a soft multi-colour band behind the seal, printed before the intaglio
  const s = G.seal, bw = s.R * 2.6;
  const grad = g.createLinearGradient(s.cx - bw / 2, 0, s.cx + bw / 2, 0);
  [[0, PAL.paper], [0.18, PAL.tintRose], [0.42, PAL.tintGold], [0.62, PAL.tintSea], [0.82, PAL.tintLilac], [1, PAL.paper]]
    .forEach(([o, col]) => grad.addColorStop(o, col));
  g.save(); g.globalAlpha = 0.55; g.fillStyle = grad;
  g.beginPath(); g.ellipse(s.cx, s.cy, bw / 2, s.R * 1.18, 0, 0, Math.PI * 2); g.fill(); g.restore();
  // cotton fibres (tone) + a few coloured security fibres (red / blue), seeded once
  for (let i = 0; i < 2600; i++) {
    const x = rand(i * 3.1 + 1) * G.W, y = rand(i * 7.7 + 2) * G.H, a = rand(i * 1.3 + 5) * Math.PI;
    const l = 3 + rand(i * 2.9) * 9;
    g.strokeStyle = `rgba(120,108,80,${0.05 + rand(i * 5.5) * 0.06})`; g.lineWidth = 0.35;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 1.5, y + Math.sin(a) * l * 0.5 - 1, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 70; i++) {
    const x = rand(i * 13.1 + 9) * G.W, y = rand(i * 17.7 + 4) * G.H, a = rand(i * 3.3) * Math.PI * 2, l = 7 + rand(i * 9.1) * 12;
    g.strokeStyle = i % 3 ? 'rgba(176,48,42,0.42)' : 'rgba(52,84,150,0.42)'; g.lineWidth = 0.45;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + Math.cos(a) * l * 0.3, y + 3, x + Math.cos(a) * l * 0.7, y + Math.sin(a) * l - 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // fine grain (dither, ±3 code values), fixed
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  let seed = 12345;
  for (let i = 0; i < d.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const n = ((seed >> 8) % 7) - 3;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(id, 0, 0);
  paperCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------- vector ornaments
const f1 = n => n.toFixed(1);
function polyPath(pts, close) {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) d += (i ? 'L' : 'M') + f1(pts[i]) + ' ' + f1(pts[i + 1]);
  return close ? d + 'Z' : d;
}
/** Rounded rectangle sampled by arc length: returns {pts:[x,y,nx,ny...], len}. Normals point inward. */
function roundRectSamples(x, y, w, h, r, step) {
  const raw = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 12; i++) { const a = a0 + (i / 12) * Math.PI / 2; raw.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, -Math.cos(a), -Math.sin(a)]); } };
  raw.push([x + r, y, 0, 1]); raw.push([x + w - r, y, 0, 1]); corner(x + w - r, y + r, -Math.PI / 2);
  raw.push([x + w, y + h - r, -1, 0]); corner(x + w - r, y + h - r, 0);
  raw.push([x + r, y + h, 0, -1]); corner(x + r, y + h - r, Math.PI / 2);
  raw.push([x, y + r, 1, 0]); corner(x + r, y + r, Math.PI);
  raw.push(raw[0]);
  // resample
  const out = []; let acc = 0, next = 0;
  for (let i = 1; i < raw.length; i++) {
    const [ax, ay, anx, any] = raw[i - 1], [bx, by, bnx, bny] = raw[i];
    const seg = Math.hypot(bx - ax, by - ay);
    while (next <= acc + seg && seg > 0) {
      const p = (next - acc) / seg;
      let nx = lerp(anx, bnx, p), ny = lerp(any, bny, p); const nl = Math.hypot(nx, ny) || 1;
      out.push(lerp(ax, bx, p), lerp(ay, by, p), nx / nl, ny / nl);
      next += step;
    }
    acc += seg;
  }
  return { pts: out, len: acc };
}

/** Border band: microtext ring + interlaced guilloche strands + two rules. Returns <g>. */
export function borderBand(parent, G, { id, micro }) {
  const g = svg('g', { 'data-name': 'Border guilloche band' }, parent);
  const outer = 14, bw = 30;
  // two thin rules
  [outer, outer + 6 + bw + 6].forEach((ins, i) => svg('rect', { x: ins, y: ins, width: G.W - ins * 2, height: G.H - ins * 2, rx: 22 - ins * 0.3, fill: 'none', stroke: PAL.ink, 'stroke-width': i ? 1.1 : 0.8 }, g));
  // guilloche strands along the band
  const base = outer + 6;
  const { pts, len } = roundRectSamples(base, base, G.W - base * 2, G.H - base * 2, 20, 3);
  const lambda = len / Math.round(len / 27);
  for (let j = 0; j < 6; j++) {
    const ph = (j / 6) * Math.PI * 2, line = [];
    for (let i = 0; i < pts.length; i += 4) {
      const s = (i / 4) * 3, o = bw / 2 + (bw / 2 - 1) * Math.sin((s / lambda) * Math.PI * 2 + ph) * (0.82 + 0.18 * Math.sin((s / lambda) * Math.PI * 2 / 7));
      line.push(pts[i] + pts[i + 2] * o, pts[i + 1] + pts[i + 3] * o);
    }
    svg('path', { d: polyPath(line, true), fill: 'none', stroke: PAL.ink, 'stroke-width': 0.55, opacity: 0.85 }, g);
  }
  // microtext ring (outside the band)
  const mp = svg('path', { id: `${id}-micro`, d: `M ${outer + 4} ${outer + 4 + 12} L ${G.W - outer - 4} ${outer + 4 + 12}`, fill: 'none' }, g);
  void mp;
  const rp = roundRectSamples(outer - 6.5, outer - 6.5, G.W - (outer - 6.5) * 2, G.H - (outer - 6.5) * 2, 26, 4);
  const ring = []; for (let i = 0; i < rp.pts.length; i += 4) ring.push(rp.pts[i], rp.pts[i + 1]);
  svg('path', { id: `${id}-ring`, d: polyPath(ring, true), fill: 'none' }, g);
  const tx = svg('text', { 'font-family': FONT.num, 'font-weight': 700, 'font-size': 5.6, 'letter-spacing': 0.35, fill: PAL.ink, 'data-name': 'Microtext ring' }, g);
  const tp = svg('textPath', { href: `#${id}-ring` }, tx);
  tp.textContent = (micro + ' · ').repeat(Math.ceil(rp.len / (micro.length * 2.25)) + 1);
  return g;
}

/** Vignette frame: double rule + a chain of tiny pearls + corner notches. */
export function vignetteFrame(parent, v, name = 'Vignette frame') {
  const g = svg('g', { 'data-name': name }, parent);
  svg('rect', { x: v.x - 9, y: v.y - 9, width: v.w + 18, height: v.h + 18, rx: 10, fill: 'none', stroke: PAL.ink, 'stroke-width': 1.0 }, g);
  svg('rect', { x: v.x - 1, y: v.y - 1, width: v.w + 2, height: v.h + 2, fill: 'none', stroke: PAL.ink, 'stroke-width': 2.2 }, g);
  const { pts } = roundRectSamples(v.x - 5, v.y - 5, v.w + 10, v.h + 10, 6, 7.5);
  let d = '';
  for (let i = 0; i < pts.length; i += 4) { const x = pts[i], y = pts[i + 1]; d += `M${f1(x - 1.5)} ${f1(y)}a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0`; }
  svg('path', { d, fill: PAL.ink, opacity: 0.9 }, g);
  return g;
}

/** Guilloche rosette: interlaced rose strands in bands + scalloped edge. Each strand can draw in (pathLength 1). */
export function rosette(parent, s, seed = 1) {
  const g = svg('g', { 'data-name': 'Guilloche rosette' }, parent);
  const R = s.R, strands = [];
  const bands = [
    { r0: 0.50, a: 0.075, n: 11, m: 3, k: 14, w: 0.55 },
    { r0: 0.71, a: 0.085, n: 17, m: 5, k: 12, w: 0.55 },
    { r0: 0.90, a: 0.055, n: 29, m: 4, k: 9, w: 0.5 },
  ];
  bands.forEach((b, bi) => {
    for (let j = 0; j < b.k; j++) {
      const ph = (j / b.k) * Math.PI * 2 / b.n * 2.2 + rand(seed + bi) * 0.2;
      const pts = [];
      for (let i = 0; i <= 900; i++) {
        const th = (i / 900) * Math.PI * 2;
        const r = R * (b.r0 + b.a * Math.sin(b.n * th + ph * b.n) + b.a * 0.32 * Math.sin(b.m * th + j));
        pts.push(s.cx + Math.cos(th) * r, s.cy + Math.sin(th) * r);
      }
      strands.push(svg('path', { d: polyPath(pts, true), fill: 'none', stroke: PAL.ink, 'stroke-width': b.w, pathLength: 1, opacity: 0.88 }, g));
    }
  });
  // scalloped rim (double)
  [1.0, 1.035].forEach((k, ri) => {
    const pts = [];
    for (let i = 0; i <= 1440; i++) { const th = (i / 1440) * Math.PI * 2; const r = R * (k + 0.022 * Math.abs(Math.sin(36 * th))); pts.push(s.cx + Math.cos(th) * r, s.cy + Math.sin(th) * r); }
    strands.push(svg('path', { d: polyPath(pts, true), fill: 'none', stroke: PAL.ink, 'stroke-width': ri ? 0.6 : 1.1, pathLength: 1 }, g));
  });
  return {
    g,
    /** p 0..1: strands trace in, staggered (the "lathe" drawing the rosette). */
    draw(p) {
      strands.forEach((e, i) => {
        const q = clamp((p * (1 + strands.length * 0.035) - i * 0.035) / 1);
        const v = smootherstep(q);
        if (v >= 1) e.style.strokeDasharray = 'none';
        else e.style.strokeDasharray = `${v.toFixed(4)} 1.01`;
        e.style.opacity = v <= 0 ? 0 : '';
      });
    },
  };
}

/** Line-fill pattern for engraved lettering (horizontal hatch). */
export function hatchPattern(defs, id, { gap = 3.2, w = 1.55, color = PAL.ink, angle = 0 } = {}) {
  const p = svg('pattern', { id, patternUnits: 'userSpaceOnUse', width: 40, height: gap, patternTransform: `rotate(${angle})` }, defs);
  svg('rect', { x: 0, y: 0, width: 40, height: w, fill: color }, p);
  return `url(#${id})`;
}

/** Engraved lettering: hatch-filled glyphs + a fine outline, revealed by a burin sweep (clip rect, left → right). */
export function engravedText(parent, defs, { id, text, x, y, size, anchor = 'middle', family = FONT.serif, weight = 400, italic = false, fill, spacing = 0, name }) {
  const clip = svg('clipPath', { id: `${id}-clip` }, defs);
  const cr = svg('rect', { x: -10, y: -10, width: 0, height: 0 }, clip);
  const g = svg('g', { 'clip-path': `url(#${id}-clip)`, 'data-name': name ?? text }, parent);
  const t = svg('text', { x, y, 'font-family': family, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor, fill, stroke: PAL.ink, 'stroke-width': size * 0.009 + 0.35, 'letter-spacing': spacing, 'font-style': italic ? 'italic' : 'normal', style: 'font-kerning:normal;font-variant-numeric:lining-nums tabular-nums' }, g);
  t.textContent = text;
  let bb = null;
  return {
    g, t,
    reveal(p) {
      if (!bb) { try { bb = t.getBBox(); } catch { bb = { x: x - size * 4, y: y - size, width: size * 8, height: size * 1.4 }; } }
      const e = clamp(p);
      cr.setAttribute('x', bb.x - 4); cr.setAttribute('y', bb.y - 6);
      cr.setAttribute('width', (bb.width + 8) * e); cr.setAttribute('height', bb.height + 12);
    },
  };
}

// ---------------------------------------------------------------- the line engraver (canvas)
/**
 * Build line families over a rect (vignette-local units). Each family = parallel lines at `angle`, `spacing` apart,
 * sampled every `step`. Width per point comes from a tone field at draw time → tone = line density/width, no fills.
 */
export function engraver(w, h, families, { step = 3 } = {}) {
  const fams = families.map(f => {
    const a = (f.angle ?? 0) * Math.PI / 180, s = f.spacing;
    const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    const R = Math.hypot(w, h) / 2 + 4, cx = w / 2, cy = h / 2;
    const lines = [];
    for (let d = -R + (f.offset ?? 0.5) * s; d <= R; d += s) {
      const pts = [];
      for (let al = -R; al <= R; al += step) {
        const x = cx + dx * al + nx * d, y = cy + dy * al + ny * d;
        if (x < -8 || x > w + 8 || y < -8 || y > h + 8) continue;
        pts.push(x, y);
      }
      if (pts.length >= 4) lines.push(Float32Array.from(pts));
    }
    return { ...f, nx, ny, dx, dy, lines };
  });
  /**
   * Draw into g (already transformed to note units and clipped). o.tone(x,y) → 0..1; o.disp(x,y) → [dx,dy] | null;
   * o.vis(xn, yn, famIndex) → 0..1 width scale (burin front). Lines break where they get thinner than minW.
   */
  function draw(g, ox, oy, o) {
    const top = new Float32Array(4096), bot = new Float32Array(4096);
    fams.forEach((f, fi) => {
      g.beginPath();
      for (const L of f.lines) {
        let n = 0;
        const flush = () => {
          if (n >= 2) {
            g.moveTo(ox + top[0], oy + top[1]);
            for (let k = 2; k < n * 2; k += 2) g.lineTo(ox + top[k], oy + top[k + 1]);
            for (let k = n * 2 - 2; k >= 0; k -= 2) g.lineTo(ox + bot[k], oy + bot[k + 1]);
            g.closePath();
          }
          n = 0;
        };
        for (let i = 0; i < L.length; i += 2) {
          let x = L[i], y = L[i + 1];
          const dd = o.disp ? o.disp(x, y, fi) : null;
          if (dd) { x += dd[0]; y += dd[1]; }
          const vis = o.vis ? o.vis(L[i] / w, L[i + 1] / h, fi) : 1;
          const tone = vis > 0 ? o.tone(x, y) : 0;
          const half = vis > 0 ? f.width(tone) * vis * 0.5 : 0;
          if (half < (f.minW ?? 0.18)) { flush(); continue; }
          if (n >= 2040) flush();
          top[n * 2] = x + f.nx * half; top[n * 2 + 1] = y + f.ny * half;
          bot[n * 2] = x - f.nx * half; bot[n * 2 + 1] = y - f.ny * half;
          n++;
        }
        flush();
      }
      g.fillStyle = f.color ?? PAL.ink;
      g.fill();
    });
  }
  return { draw, fams };
}

/** Standard 3-family intaglio set: main lines, cross-hatch for darks, a third pass for the deepest blacks. */
export function intaglioFamilies({ spacing = 6.2, angle = 0, cross = 28, third = null, k = 1 } = {}) {
  return [
    { angle, spacing, width: t => (t < 0.035 ? 0 : spacing * (0.07 + 0.8 * Math.min(1, t * 1.08)) * k), minW: 0.2 },
    { angle: angle + cross, spacing: spacing * 1.08, offset: 0.25, width: t => spacing * 0.62 * clamp((t - 0.6) / 0.38) * k, minW: 0.45 },
    ...(third == null ? [] : [{ angle: angle + third, spacing: spacing * 1.15, offset: 0.7, width: t => spacing * 0.6 * clamp((t - 0.8) / 0.2) * k, minW: 0.3 }]),
  ];
}

/** Burin sweep front: lines draw left → right, rows staggered top → bottom; second / third passes follow. */
export function burin(T, t0, dur, { lag = 0.55, passGap = 0.18, tip = 0.05 } = {}) {
  return (xn, yn, fi) => {
    const p = (T - t0 - fi * passGap * dur) / dur;
    if (p >= 1 + lag + tip) return 1;
    const front = p * (1 + lag + tip) - yn * lag;
    return clamp((front - xn) / tip);
  };
}

// ---------------------------------------------------------------- the note
/**
 * Build one note on the desk. Returns { G, front, defs, setCam(cam) → matrix, ink (2D ctx), clear(), vigClip() }.
 */
export function makeNote(root, ctx, kind, { id, micro }) {
  const L = ctx.layout, G = geom(L, kind);
  const fit = Math.min(L.safe.w / (G.W + 70), L.safe.h / (G.H + 70));
  Object.assign(root.style, { position: 'absolute', inset: '0', overflow: 'hidden' });
  const wrap = el('div', { 'data-name': `Note ${id}`, style: { position: 'absolute', inset: '0' } }, root);
  const back = el('div', { 'data-name': 'Note (cotton paper)', style: { position: 'absolute', left: '0', top: '0', width: G.W + 'px', height: G.H + 'px', transformOrigin: '0 0', borderRadius: '5px', overflow: 'hidden', boxShadow: '0 1.5px 2px rgba(4,9,6,0.55), 10px 18px 34px rgba(4,9,6,0.42)' } }, wrap);
  const pc = paperCanvas(G, `${ctx.format}-${kind}`);
  const pcv = el('canvas', { width: pc.width, height: pc.height, style: { width: G.W + 'px', height: G.H + 'px', display: 'block' } }, back);
  pcv.getContext('2d').drawImage(pc, 0, 0);
  const cv = el('canvas', { 'data-name': 'Engraved lines (intaglio)', width: ctx.width, height: ctx.height, style: { position: 'absolute', left: '0', top: '0', width: ctx.width + 'px', height: ctx.height + 'px', mixBlendMode: 'multiply' } }, wrap);
  const ink = cv.getContext('2d');
  const front = svg('svg', { width: G.W, height: G.H, viewBox: `0 0 ${G.W} ${G.H}`, style: { position: 'absolute', left: '0', top: '0', overflow: 'visible', transformOrigin: '0 0' } }, wrap);
  const defs = svg('defs', {}, front);
  borderBand(front, G, { id, micro });
  let m = [1, 0, 0, 1, 0, 0];
  return {
    G, L, front, defs, ink, fit, back, wrap,
    show(on) { wrap.style.display = on ? '' : 'none'; },
    setCam(c) {
      // Framing rule: never show desk inside the frame when the note is bigger than the view (portrait: the bottom
      // 20 % is platform UI, desk may show there); when the note is smaller, centre it in the usable area.
      const s = fit * c.z, Hb = L.portrait ? L.height * 0.8 : L.height;
      const clampAxis = (v, cen, span, full) => { const lo = cen / s, hi = full - (span - cen) / s; return lo > hi ? full / 2 + (cen - span / 2) / s : Math.min(hi, Math.max(lo, v)); };
      const x = clampAxis(c.x, L.safe.cx, L.width, G.W), y = clampAxis(c.y, L.safe.cy, Hb, G.H);
      const tx = L.safe.cx - x * s, ty = L.safe.cy - y * s;
      const tr = `translate(${tx.toFixed(3)}px,${ty.toFixed(3)}px) scale(${s.toFixed(5)})`;
      back.style.transform = tr; front.style.transform = tr;
      m = [s, 0, 0, s, tx, ty];
      return m;
    },
    /** Clear, set camera matrix and clip to the vignette. */
    begin(v = G.vig) {
      ink.setTransform(1, 0, 0, 1, 0, 0);
      ink.clearRect(0, 0, ctx.width, ctx.height);
      ink.setTransform(...m);
      ink.save();
      ink.beginPath(); ink.rect(v.x, v.y, v.w, v.h); ink.clip();
    },
    end() { ink.restore(); },
  };
}

/** Serial number in the numbering-machine face (two colours on every note). */
export function serial(parent, { x, y, a }, text, color, size, name) {
  const t = svg('text', { x, y, 'text-anchor': a, 'font-family': FONT.num, 'font-weight': 800, 'font-size': size, 'letter-spacing': size * 0.08, fill: color, 'data-name': name, style: 'font-variant-numeric:tabular-nums lining-nums' }, parent);
  t.textContent = text;
  return t;
}

/** Seal: rosette + oval cartouche with a small line and big engraved numerals. */
export function seal(front, defs, s, { id, small, big }) {
  const ros = rosette(front, s, 3);
  const g = svg('g', { 'data-name': 'Denomination cartouche' }, front);
  const rx = s.cw / 2, ry = s.ch / 2;
  svg('ellipse', { cx: s.cx, cy: s.cy, rx: rx + 10, ry: ry + 10, fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 0.9 }, g);
  svg('ellipse', { cx: s.cx, cy: s.cy, rx: rx + 4, ry: ry + 4, fill: 'none', stroke: PAL.ink, 'stroke-width': 2.4 }, g);
  // fine radial hatch ring between the two ellipses → engraved frame
  let d = '';
  for (let i = 0; i < 160; i++) { const a = (i / 160) * Math.PI * 2; d += `M${f1(s.cx + Math.cos(a) * (rx + 4))} ${f1(s.cy + Math.sin(a) * (ry + 4))}L${f1(s.cx + Math.cos(a) * (rx + 9))} ${f1(s.cy + Math.sin(a) * (ry + 9))}`; }
  svg('path', { d, stroke: PAL.ink, 'stroke-width': 0.6, fill: 'none' }, g);
  const fillNum = hatchPattern(defs, `${id}-numhatch`, { gap: 2.9, w: 1.5 });
  const sm = engravedText(g, defs, { id: `${id}-small`, text: small, x: s.cx, y: s.cy - ry * 0.5, size: s.ch * 0.17, family: FONT.num, weight: 700, fill: PAL.ink, spacing: s.ch * 0.06, name: 'Cartouche line' });
  const bg = engravedText(g, defs, { id: `${id}-big`, text: big, x: s.cx, y: s.cy + ry * 0.62, size: s.ch * 0.66, fill: fillNum, spacing: s.ch * 0.02, name: 'Denomination numerals' });
  return { ros, g, sm, bg, rx, ry };
}
