// LACE PAPERCUT kit — one white sheet of thin paper in front of a lit teal glass panel.
// The paper is an SVG mask: white = paper, black = cut. Every cut is a pure function of time:
//   pencil guide (graphite, dashed) → kerf (thin slit that lets light through, drawn as the blade passes)
//   → the piece drops out (falls toward the floor, in front, with its own shadow) → the hole shows the light.
// Ornament (border lace, waves) is symmetric and was cut while the sheet was folded; every scene opens the fold.
// Story shapes (sub, ships, torpedo, NO) are cut freehand AFTER it opens — symmetric = ornament, asymmetric = story.
import { el, svg, rand, clamp, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { spring, smootherstep } from '/onclack-styles/engine/lib/spring.js';

export const PAL = {
  paper: '#F3EEE3', paperDeep: '#E2D9C6',
  light0: '#3FA9A0', light1: '#0F5257', light2: '#062226', // teal glass, lit from behind (centre → edge)
  amber: '#F5A23A', amberCore: '#FFE2A6',                  // the second lamp — only behind the NO
  graphite: '#6E6A62', steel0: '#E9ECEE', steel1: '#9AA2A8', handle: '#3E4347',
};
export const CUTFONT = "'Bricolage Grotesque'";
export const PENFONT = "'Shantell Sans'";
export const F = 1 / 30;

let UID = 0;
const uid = p => `${p}${++UID}`;

/** Local time of the n-th word matching `w` in this scene (fallback = given local time). */
export function wt(ctx, w, n = 0, fb = 0) {
  const re = new RegExp('^' + w, 'i');
  const hits = ctx.wordsIn().filter(x => re.test(x.word.replace(/[^\w-]/g, '')));
  return hits[n] ? hits[n].start - ctx.start : fb;
}

// ---------------------------------------------------------------- paper texture (seeded, generated once)
const tileCache = {};
function paperTile(seed) {
  if (tileCache[seed]) return tileCache[seed];
  const N = 384, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = PAL.paper; g.fillRect(0, 0, N, N);
  let k = seed * 1000;
  const r = () => rand(++k);
  for (let i = 0; i < 1500; i++) { // fibres (wrap around so the tile is seamless)
    const x = r() * N, y = r() * N, len = 4 + r() * 22, a = r() * Math.PI, dark = r() < 0.55;
    g.strokeStyle = dark ? `rgba(150,130,100,${0.05 + r() * 0.08})` : `rgba(255,255,255,${0.25 + r() * 0.35})`;
    g.lineWidth = 0.5 + r() * 0.9;
    for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) {
      g.beginPath();
      g.moveTo(x + ox, y + oy);
      g.quadraticCurveTo(x + ox + Math.cos(a) * len * 0.5 + (r() - 0.5) * 3, y + oy + Math.sin(a) * len * 0.5, x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len);
      g.stroke();
    }
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,100,80,${0.03 + r() * 0.06})`; g.fillRect(r() * N, r() * N, 1, 1); }
  return (tileCache[seed] = c.toDataURL('image/png'));
}

// ---------------------------------------------------------------- geometry helpers (absolute coords)
export const P = {
  /** teardrop: base (x,y), points along angle a (radians, 0 = up), length len, half width w */
  petal(x, y, len, w, a = 0) {
    const s = Math.sin(a), c = Math.cos(a);
    const T = (px, py) => `${(x + px * c - py * s).toFixed(1)} ${(y + px * s + py * c).toFixed(1)}`;
    return `M${T(0, 0)} C${T(w, -len * 0.25)} ${T(w * 0.9, -len * 0.75)} ${T(0, -len)} C${T(-w * 0.9, -len * 0.75)} ${T(-w, -len * 0.25)} ${T(0, 0)} Z`;
  },
  circle(x, y, r) { return `M${(x - r).toFixed(1)} ${y.toFixed(1)} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`; },
  /** rounded slit centred at x,y with angle a */
  slit(x, y, len, th, a = 0) {
    const c = Math.cos(a), s = Math.sin(a), h = len / 2, r = th / 2;
    const T = (px, py) => `${(x + px * c - py * s).toFixed(1)} ${(y + px * s + py * c).toFixed(1)}`;
    return `M${T(-h + r, -r)} L${T(h - r, -r)} A${r} ${r} 0 0 1 ${T(h - r, r)} L${T(-h + r, r)} A${r} ${r} 0 0 1 ${T(-h + r, -r)} Z`;
  },
  diamond(x, y, rx, ry) { return `M${x} ${y - ry} L${x + rx} ${y} L${x} ${y + ry} L${x - rx} ${y} Z`; },
  /** crescent "wave" cut, opening up */
  wave(x, y, w, th) {
    const r1 = w / 2;
    return `M${x - r1} ${y} A${r1} ${r1 * 0.62} 0 0 0 ${x + r1} ${y} A${r1 * 0.86} ${r1 * 0.62 - th} 0 0 1 ${x - r1} ${y} Z`;
  },
  rosette(x, y, r, n = 8, rot = 0) {
    let d = '';
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; d += P.petal(x + Math.sin(a) * r * 0.2, y - Math.cos(a) * r * 0.2, r * 0.8, r * 0.24, a) + ' '; }
    return d + P.circle(x, y, r * 0.13);
  },
  poly(pts, close = true) { return 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') + (close ? ' Z' : ''); },
  /** rectangle whose edges are zigzag (saw teeth pointing out of the hole) */
  sawRect(x, y, w, h, tooth) {
    const pts = [];
    const side = (x0, y0, x1, y1, nx, ny) => {
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / tooth));
      for (let i = 0; i < n; i++) {
        const a = i / n, b = (i + 0.5) / n;
        pts.push([x0 + (x1 - x0) * a, y0 + (y1 - y0) * a]);
        pts.push([x0 + (x1 - x0) * b + nx * tooth * 0.45, y0 + (y1 - y0) * b + ny * tooth * 0.45]);
      }
    };
    side(x, y, x + w, y, 0, -1); side(x + w, y, x + w, y + h, 1, 0); side(x + w, y + h, x, y + h, 0, 1); side(x, y + h, x, y, -1, 0);
    return P.poly(pts);
  },
};

/** Sheet outline with scalloped edges (bumps outward). Symmetric about the centre by construction. */
function scallopOutline(x, y, w, h, r) {
  const nx = Math.max(2, Math.round(w / (2 * r))), ny = Math.max(2, Math.round(h / (2 * r)));
  const sx = w / nx, sy = h / ny;
  let d = `M${x} ${y}`;
  for (let i = 0; i < nx; i++) d += ` A${sx / 2} ${r * 0.7} 0 0 1 ${x + sx * (i + 1)} ${y}`;
  for (let i = 0; i < ny; i++) d += ` A${r * 0.7} ${sy / 2} 0 0 1 ${x + w} ${y + sy * (i + 1)}`;
  for (let i = 0; i < nx; i++) d += ` A${sx / 2} ${r * 0.7} 0 0 1 ${x + w - sx * (i + 1)} ${y + h}`;
  for (let i = 0; i < ny; i++) d += ` A${r * 0.7} ${sy / 2} 0 0 1 ${x} ${y + h - sy * (i + 1)}`;
  return d + ' Z';
}

/** Symmetric border lace for a sheet box. Returns path d strings (all holes). Positions mirror about cx. */
export function borderLace(x, y, w, h, r, seed = 1) {
  const out = [];
  const cx = x + w / 2;
  const along = (len, step) => { // symmetric offsets from centre
    const n = Math.floor(len / 2 / step);
    const a = [];
    for (let i = -n; i <= n; i++) a.push(i * step);
    return a;
  };
  // 1) pin-holes row
  const m1 = r * 1.55;
  for (const o of along(w - 2 * m1 - r, r * 1.5)) { out.push(P.circle(cx + o, y + m1, r * 0.26)); out.push(P.circle(cx + o, y + h - m1, r * 0.26)); }
  for (const o of along(h - 2 * m1 - r, r * 1.5)) { out.push(P.circle(x + m1, y + h / 2 + o, r * 0.26)); out.push(P.circle(x + w - m1, y + h / 2 + o, r * 0.26)); }
  // 2) petal band: teardrops pointing to the edge, alternating with small diamonds
  const m2 = r * 3.3, st = r * 1.25;
  const hz = along(w - 2 * m2 - 3 * r, st), vt = along(h - 2 * m2 - 3 * r, st);
  hz.forEach((o, i) => {
    if (i % 2 === 0) { out.push(P.petal(cx + o, y + m2 + r * 0.5, r * 1.15, r * 0.34, 0)); out.push(P.petal(cx + o, y + h - m2 - r * 0.5, r * 1.15, r * 0.34, Math.PI)); }
    else { out.push(P.diamond(cx + o, y + m2 - r * 0.15, r * 0.2, r * 0.42)); out.push(P.diamond(cx + o, y + h - m2 + r * 0.15, r * 0.2, r * 0.42)); }
  });
  vt.forEach((o, i) => {
    if (i % 2 === 0) { out.push(P.petal(x + m2 + r * 0.5, y + h / 2 + o, r * 1.15, r * 0.34, -Math.PI / 2)); out.push(P.petal(x + w - m2 - r * 0.5, y + h / 2 + o, r * 1.15, r * 0.34, Math.PI / 2)); }
    else { out.push(P.diamond(x + m2 - r * 0.15, y + h / 2 + o, r * 0.42, r * 0.2)); out.push(P.diamond(x + w - m2 + r * 0.15, y + h / 2 + o, r * 0.42, r * 0.2)); }
  });
  // 3) corner rosettes
  const m3 = r * 3.4;
  for (const [px, py] of [[x + m3, y + m3], [x + w - m3, y + m3], [x + m3, y + h - m3], [x + w - m3, y + h - m3]]) out.push(P.rosette(px, py, r * 1.9, 8, Math.PI / 8));
  // 3b) second band: small crescents opening outward, between pin-holes and petals
  const m5 = r * 2.35;
  for (const o of along(w - 2 * m5 - 3 * r, r * 1.5)) { out.push(P.wave(cx + o, y + m5 - r * 0.05, r * 0.9, r * 0.2)); out.push(waveFlip(cx + o, y + h - m5 + r * 0.05, r * 0.9, r * 0.2)); }
  // corner ring of pin-holes around each rosette
  for (const [px, py] of [[x + m3, y + m3], [x + w - m3, y + m3], [x + m3, y + h - m3], [x + w - m3, y + h - m3]])
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; out.push(P.circle(px + Math.cos(a) * r * 2.35, py + Math.sin(a) * r * 2.35, r * 0.13)); }
  // 4) inner frame: long slits with paper bridges
  const m4 = r * 5.6, sl = r * 2.6, gap = r * 0.55, th = r * 0.34;
  const fx0 = x + m4, fx1 = x + w - m4, fy0 = y + m4, fy1 = y + h - m4;
  for (const o of along(fx1 - fx0 - sl, sl + gap)) { out.push(P.slit(cx + o, fy0, sl, th)); out.push(P.slit(cx + o, fy1, sl, th)); }
  for (const o of along(fy1 - fy0 - sl, sl + gap)) { out.push(P.slit(fx0, y + h / 2 + o, sl, th, Math.PI / 2)); out.push(P.slit(fx1, y + h / 2 + o, sl, th, Math.PI / 2)); }
  return { holes: out, inner: { x: fx0 + r, y: fy0 + r, w: fx1 - fx0 - 2 * r, h: fy1 - fy0 - 2 * r } };
}

function waveFlip(x, y, w, th) { const r1 = w / 2; return `M${x - r1} ${y} A${r1} ${r1 * 0.62} 0 0 1 ${x + r1} ${y} A${r1 * 0.86} ${r1 * 0.62 - th} 0 0 0 ${x - r1} ${y} Z`; }

/** Symmetric garland: pairs of leaves on a slit stem along a gentle arc, from cx outwards (w = total width). */
export function garland(cx, y, w, s, sag = 0, centre = true) {
  const out = [];
  const n = Math.floor(w / 2 / (s * 1.3));
  for (const side of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const x = cx + side * (s * 0.9 + i * s * 1.3), yy = y + sag * Math.pow((i + 0.5) / n, 2);
      out.push(P.slit(x, yy, s * 1.05, s * 0.09, 0));
      out.push(P.petal(x, yy - s * 0.12, s * 0.62, s * 0.16, side * 0.7));
      out.push(P.petal(x, yy + s * 0.12, s * 0.62, s * 0.16, Math.PI - side * 0.7));
      if (i % 2 === 1) out.push(P.circle(x + side * s * 0.65, yy, s * 0.1));
    }
  }
  if (centre) out.push(P.rosette(cx, y, s * 0.55, 8, 0));
  return out;
}

/** Rows of crescent waves, symmetric about cx. */
export function waveRows(cx, y, w, rows, ww, rowGap) {
  const out = [];
  for (let k = 0; k < rows; k++) {
    const yy = y + k * rowGap, half = w / 2 - ww / 2;
    const xs = [];
    if (k % 2 === 0) { const n = Math.floor(half / ww); for (let i = -n; i <= n; i++) xs.push(cx + i * ww); }
    else { const n = Math.floor(half / ww - 0.5); for (let i = 0; i <= n; i++) xs.push(cx + (i + 0.5) * ww, cx - (i + 0.5) * ww); }
    for (const x of xs) out.push(P.wave(x, yy, ww * 0.84, ww * 0.15));
    if (k < rows - 1) for (const x2 of xs) out.push(P.circle(x2, yy + rowGap * 0.62, ww * 0.045));
  }
  return out;
}

// ---------------------------------------------------------------- the stage
export async function makeStage(root, ctx, { seed = 1, lamp = [0.5, 0.42], name = 'Papercut' } = {}) {
  await Promise.all([document.fonts.load(`800 100px ${CUTFONT}`), document.fonts.load(`500 40px ${PENFONT}`)]);
  const L = ctx.layout, W = L.width, H = L.height, u = L.unit;
  const S = { L, W, H, u, ctx, seed };
  S.light = el('div', { 'data-name': 'Teal glass light panel', style: {
    position: 'absolute', inset: 0,
    background: `radial-gradient(ellipse ${L.portrait ? '95% 60%' : '70% 85%'} at ${lamp[0] * 100}% ${lamp[1] * 100}%, ${PAL.light0} 0%, ${PAL.light1} 58%, ${PAL.light2} 100%)`,
  } }, root);
  // glass grain on the light panel (fixed): fine vertical streaks of the glass
  S.amber = el('div', { 'data-name': 'Amber second lamp', style: { position: 'absolute', inset: 0, opacity: 0 } }, root);
  const mk = (nm, shadow) => {
    const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'data-name': nm,
      style: `position:absolute;left:0;top:0;overflow:visible;filter:drop-shadow(${shadow[0] * u}px ${shadow[1] * u}px ${shadow[2] * u}px rgba(2,20,22,${shadow[3]}))` }, root);
    const cam = svg('g', {}, s);
    return { s, cam };
  };
  S.sheetLayer = mk(name + ' · sheet', [9, 13, 10, 0.62]);
  S.fallLayer = mk('Falling pieces', [26, 40, 20, 0.45]);
  S.bladeLayer = mk('Craft knife', [30, 44, 14, 0.42]);
  S.defs = svg('defs', {}, S.sheetLayer.s);
  const pat = svg('pattern', { id: uid('pp'), patternUnits: 'userSpaceOnUse', width: 384 * u * 0.9, height: 384 * u * 0.9 }, S.defs);
  svg('image', { href: paperTile(seed), width: 384 * u * 0.9, height: 384 * u * 0.9 }, pat);
  S.paperFill = `url(#${pat.id})`;
  const fdefs = svg('defs', {}, S.fallLayer.s);
  const pat2 = pat.cloneNode(true); pat2.id = uid('pp'); fdefs.appendChild(pat2);
  S.paperFill2 = `url(#${pat2.id})`;
  S.fdefs = fdefs;
  const sh = svg('linearGradient', { id: uid('sh'), x1: 0, y1: 0, x2: 1, y2: 1 }, S.defs);
  svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.32 }, sh);
  svg('stop', { offset: 0.55, 'stop-color': '#fff', 'stop-opacity': 0 }, sh);
  svg('stop', { offset: 1, 'stop-color': '#6b5a3c', 'stop-opacity': 0.16 }, sh);
  S.shadeFill = `url(#${sh.id})`;
  S.blade = makeBlade(S);
  S.sheets = [];
  S.cam = { s: 1, x: 0, y: 0 };
  S.setCam = (s, fx, fy, dx = 0, dy = 0) => { // scale s about frame point (fx,fy) + offset
    const tr = `translate(${(fx + dx - fx * s).toFixed(2)} ${(fy + dy - fy * s).toFixed(2)}) scale(${s.toFixed(4)})`;
    for (const l of [S.sheetLayer, S.fallLayer, S.bladeLayer]) l.cam.setAttribute('transform', tr);
  };
  S.amberAt = (bb, pad = 26 * u) => { // a warm lamp right behind one shape: opaque over it, only a small soft spill
    Object.assign(S.amber.style, { inset: 'auto', left: `${bb.x - pad}px`, top: `${bb.y - pad}px`, width: `${bb.width + 2 * pad}px`, height: `${bb.height + 2 * pad}px`,
      borderRadius: `${pad * 1.5}px`, filter: `blur(${pad * 0.55}px)`,
      background: `radial-gradient(ellipse 60% 60% at 50% 58%, ${PAL.amberCore} 0%, ${PAL.amber} 100%)` });
  };
  S.update = t => {
    S.blade.segs.sort((a, b) => a.t0 - b.t0);
    for (const sh of S.sheets) sh.update(t);
    S.blade.update(t);
  };
  return S;
}

// ---------------------------------------------------------------- craft knife (one per scene)
function makeBlade(S) {
  const { u } = S;
  const g = svg('g', { 'data-name': 'Craft knife (blade tip = cut point)', opacity: 0 }, S.bladeLayer.cam);
  const d = svg('defs', {}, S.bladeLayer.s);
  const st = svg('linearGradient', { id: uid('st'), x1: 0, y1: 0, x2: 0, y2: 1 }, d);
  svg('stop', { offset: 0, 'stop-color': PAL.steel0 }, st); svg('stop', { offset: 1, 'stop-color': PAL.steel1 }, st);
  const hd = svg('linearGradient', { id: uid('hd'), x1: 0, y1: 0, x2: 0, y2: 1 }, d);
  svg('stop', { offset: 0, 'stop-color': '#7d858b' }, hd); svg('stop', { offset: 0.45, 'stop-color': PAL.handle }, hd); svg('stop', { offset: 1, 'stop-color': '#24282b' }, hd);
  const k = svg('g', { transform: `rotate(-38) scale(${u * 1.15})` }, g);
  svg('path', { d: 'M0 0 L30 -11 L84 -11 L84 9 L22 9 Z', fill: `url(#${st.id})`, stroke: '#5d656b', 'stroke-width': 0.8 }, k); // scalpel blade
  svg('path', { d: 'M8 1 L80 -3', stroke: '#fff', 'stroke-opacity': 0.7, 'stroke-width': 1.2 }, k); // edge glint
  svg('rect', { x: 82, y: -14, width: 22, height: 26, rx: 3, fill: '#8a9197' }, k); // collet
  svg('rect', { x: 102, y: -12, width: 250, height: 22, rx: 8, fill: `url(#${hd.id})` }, k); // handle
  for (let i = 0; i < 9; i++) svg('rect', { x: 120 + i * 7, y: -12, width: 2.4, height: 22, fill: '#1c1f21', opacity: 0.5 }, k); // knurl
  const B = { g, segs: [] };
  const off = [330 * u, -300 * u];
  const pos = t => {
    const segs = B.segs;
    for (const s of segs) if (t >= s.t0 && t <= s.t1) return { p: s.pos(clamp((t - s.t0) / (s.t1 - s.t0))), on: 1 };
    let prev = null, next = null;
    for (const s of segs) { if (s.t1 < t) prev = s; else if (s.t0 > t && !next) next = s; }
    if (prev && next && next.t0 - prev.t1 < 1.1) {
      const a = prev.pos(1), b = next.pos(0), e = smootherstep((t - prev.t1) / (next.t0 - prev.t1));
      const lift = Math.sin(e * Math.PI) * 26 * u;
      return { p: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e - lift], on: 1, lifted: Math.sin(e * Math.PI) };
    }
    if (next && next.t0 - t < 0.4) {
      const b = next.pos(0), e = smootherstep((t - (next.t0 - 0.4)) / 0.4);
      return { p: [b[0] + off[0] * (1 - e), b[1] + off[1] * (1 - e)], on: e, lifted: 1 - e };
    }
    if (prev && t - prev.t1 < 0.5) {
      const a = prev.pos(1), e = smootherstep((t - prev.t1) / 0.5);
      return { p: [a[0] + off[0] * e, a[1] + off[1] * e], on: 1 - e, lifted: e };
    }
    return null;
  };
  B.update = t => {
    const r = pos(t);
    if (!r) { g.setAttribute('opacity', 0); return; }
    const tremor = [noise1(t * 6, 3) * 0.8 * u, noise1(t * 6, 7) * 0.8 * u];
    const lift = (r.lifted ?? 0);
    g.setAttribute('opacity', clamp(r.on * 1.6).toFixed(3));
    g.setAttribute('transform', `translate(${(r.p[0] + tremor[0]).toFixed(1)} ${(r.p[1] + tremor[1] - lift * 6 * u).toFixed(1)}) rotate(${(noise1(t * 1.7, 2) * 3).toFixed(2)})`);
  };
  return B;
}

// ---------------------------------------------------------------- one sheet
/**
 * opts: x,y,w,h (sheet box), r (lace unit), openAt/openDur (fold opens), enterAt (slides in), name
 */
export function makeSheet(S, o) {
  const { u } = S;
  const r = o.r ?? 22 * u;
  const cx = o.x + o.w / 2;
  const id = uid('sheet');
  const mask = svg('mask', { id: id + 'm', maskUnits: 'userSpaceOnUse', x: o.x - 400 * u, y: o.y - 400 * u, width: o.w + 800 * u, height: o.h + 800 * u }, S.defs);
  const outline = scallopOutline(o.x, o.y, o.w, o.h, r);
  svg('path', { d: outline, fill: '#fff' }, mask);
  const ops = svg('g', {}, mask);
  const cl = svg('clipPath', { id: id + 'cl' }, S.defs);
  svg('rect', { x: o.x - 60 * u, y: o.y - 60 * u, width: o.w / 2 + 60 * u, height: o.h + 120 * u }, cl);
  const cr = svg('clipPath', { id: id + 'cr' }, S.defs);
  svg('rect', { x: cx, y: o.y - 60 * u, width: o.w / 2 + 60 * u, height: o.h + 120 * u }, cr);

  const root = svg('g', { 'data-name': o.name ?? 'Paper sheet' }, S.sheetLayer.cam);
  const paperG = (clip, nm) => {
    const g = svg('g', { mask: `url(#${id}m)`, 'clip-path': `url(#${clip})`, 'data-name': nm }, root);
    svg('rect', { x: o.x - 40 * u, y: o.y - 40 * u, width: o.w + 80 * u, height: o.h + 80 * u, fill: S.paperFill }, g);
    svg('rect', { x: o.x - 40 * u, y: o.y - 40 * u, width: o.w + 80 * u, height: o.h + 80 * u, fill: S.shadeFill }, g);
    return g;
  };
  const left = paperG(id + 'cl', 'Sheet left half');
  const rightWrap = svg('g', {}, root);
  rightWrap.appendChild(paperG(id + 'cr', 'Sheet right half (folds)'));
  const right = rightWrap.lastChild;
  rightWrap.appendChild(right);
  const back = svg('rect', { x: o.x - 40 * u, y: o.y - 40 * u, width: o.w + 80 * u, height: o.h + 80 * u, fill: '#3b3326', opacity: 0, mask: `url(#${id}m)`, 'clip-path': `url(#${id}cr)` }, rightWrap);
  const crease = svg('line', { x1: cx, y1: o.y + 4 * u, x2: cx, y2: o.y + o.h - 4 * u, stroke: '#8d826c', 'stroke-width': 1.3 * u, opacity: 0, 'data-name': 'Fold crease' }, root);
  // pencil layer (on the paper, masked so a hole removes the pencil too)
  const pencil = svg('g', { mask: `url(#${id}m)`, 'data-name': 'Pencil guides' }, root);
  const measure = svg('path', { d: 'M0 0', fill: 'none' }, S.defs);

  const SH = { o, r, cx, root, ops, mask, cuts: [], falls: [], timed: [], pencilG: pencil, outline };
  const add = (d, fill = '#000', parent = ops, attrs = {}) => svg('path', { d, fill, ...attrs }, parent);
  SH.hole = d => add(d);
  SH.holes = list => { const g = svg('g', {}, ops); for (const d of list) add(d, '#000', g); return g; };
  SH.island = (d, parent = ops) => add(d, '#fff', parent);
  SH.group = (attrs = {}) => svg('g', attrs, ops);

  const fallPiece = (dOrNode, at, seed, opts = {}) => {
    const g = svg('g', { opacity: 0, 'data-name': opts.name ?? 'Falling piece' }, S.fallLayer.cam);
    const inner = svg('g', {}, g);
    if (typeof dOrNode === 'string') {
      svg('path', { d: dOrNode, fill: S.paperFill2, stroke: '#d8cfbc', 'stroke-width': 0.8 * u }, inner);
    } else inner.appendChild(dOrNode);
    const bb = opts.bbox ?? (() => { measure.setAttribute('d', typeof dOrNode === 'string' ? dOrNode : 'M0 0'); return measure.getBBox(); })();
    const pc = [bb.x + bb.width / 2, bb.y + bb.height / 2];
    const rs = rand(seed * 7.1);
    SH.falls.push({ g, at, pc, spin: (rs - 0.5) * 140 * (opts.spin ?? 1), drift: (rand(seed * 3.3) - 0.5) * 160 * u, grav: (opts.grav ?? 2400) * u, delay: opts.delay ?? 0 });
    return g;
  };
  SH.fallPiece = fallPiece;

  /** Animated cut: pencil guide from t0-pre, kerf drawn t0→t1 (blade on it), hole + falling piece at t1. */
  SH.cut = (d, t0, t1, opts = {}) => {
    measure.setAttribute('d', d);
    const len = measure.getTotalLength();
    const pts = [];
    const N = Math.max(24, Math.ceil(len / (6 * u)));
    for (let i = 0; i <= N; i++) { const p = measure.getPointAtLength((len * i) / N); pts.push([p.x, p.y]); }
    const bb = measure.getBBox();
    const guide = opts.pencil === false ? null : add(d, 'none', pencil, { stroke: PAL.graphite, 'stroke-width': 1.9 * u, 'stroke-dasharray': `${6 * u} ${4 * u}`, opacity: 0 });
    const kerf = add(d, 'none', opts.parent ?? ops, { stroke: '#000', 'stroke-width': (opts.kerf ?? 2.6) * u, 'stroke-dasharray': `${len} ${len + 10}`, 'stroke-dashoffset': len, 'stroke-linejoin': 'round' });
    if (opts.mirror) { // folded sheet: the same cut goes through the top (mirrored) layer
      const m = add(d, 'none', ops, { transform: `matrix(-1 0 0 1 ${2 * cx} 0)`, stroke: '#000', 'stroke-width': (opts.kerf ?? 2.6) * u, 'stroke-dasharray': `${len} ${len + 10}`, 'stroke-dashoffset': len });
      SH.timed.push(t => { const e = clamp((t - t0) / (t1 - t0)); m.setAttribute('stroke-dashoffset', (len * (1 - e)).toFixed(1)); m.setAttribute('fill', t >= t1 ? '#000' : 'none'); });
    }
    const piece = opts.fall === false ? null : fallPiece(d, t1, opts.seed ?? t0 * 13, { bbox: bb, ...opts.fallOpts });
    const c = { d, len, t0, t1, guide, kerf, piece, pre: opts.pre ?? 0.4, name: opts.name };
    SH.cuts.push(c);
    S.blade.segs.push({ t0, t1, pos: p => { const f = p * N, i = Math.min(N - 1, Math.floor(f)), e = f - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * e, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * e]; } });
    return c;
  };

  /** Cut text: letters appear (as holes) behind the blade as it runs along the line. */
  SH.cutText = (str, x, y, size, t0, t1, opts = {}) => {
    const anchor = opts.anchor ?? 'start';
    const cp = svg('clipPath', { id: uid('tc') }, S.defs);
    const cr = svg('rect', { x: -10, y: y - size * 1.2, width: 0, height: size * 1.6 }, cp);
    const tx = svg('text', { x, y, fill: '#000', 'font-family': CUTFONT, 'font-weight': 800, 'font-size': size, 'text-anchor': anchor,
      'letter-spacing': opts.ls ?? size * 0.04, 'clip-path': `url(#${cp.id})`, 'data-name': opts.name ?? `Cut text ${str}` }, opts.parent ?? ops);
    tx.textContent = str;
    let bb = tx.getBBox();
    if (opts.maxW && bb.width > opts.maxW) { tx.setAttribute('font-size', size * opts.maxW / bb.width); bb = tx.getBBox(); }
    if (opts.sketchAt != null) { // the cutter's pencil outline of the letters, drawn long before the cut
      const sk = tx.cloneNode(true);
      sk.removeAttribute('clip-path'); sk.removeAttribute('data-name');
      Object.entries({ fill: 'none', stroke: PAL.graphite, 'stroke-width': 1.3 * u, 'stroke-dasharray': `${3 * u} ${3 * u}`, opacity: 0 }).forEach(([k, v]) => sk.setAttribute(k, v));
      pencil.appendChild(sk);
      SH.timed.push(t => sk.setAttribute('opacity', (0.8 * clamp((t - opts.sketchAt) / 0.4)).toFixed(3)));
    }
    const x0 = bb.x - 4 * u, x1 = bb.x + bb.width + 4 * u;
    const capH = bb.height * 0.7;
    cr.setAttribute('x', x0);
    cr.setAttribute('y', bb.y - 20 * u); cr.setAttribute('height', bb.height + 40 * u);
    const nLet = Math.max(1, str.replace(/\s/g, '').length);
    const pos = p => [x0 + (x1 - x0) * p, y - capH * (0.5 + 0.48 * Math.sin(p * nLet * Math.PI * 2))];
    if (!opts.noBlade) S.blade.segs.push({ t0, t1, pos });
    SH.timed.push(t => cr.setAttribute('width', Math.max(0, (x1 - x0) * clamp((t - t0) / (t1 - t0)) + 2 * u)));
    return { node: tx, bb, t1 };
  };

  /** A dotted line of small holes that appear as the blade runs along it. */
  SH.cutDots = (pts, rDot, t0, t1) => {
    const n = pts.length;
    const nodes = pts.map(p => add(P.circle(p[0], p[1], rDot), '#000', ops, { opacity: 0 }));
    SH.timed.push(t => nodes.forEach((nd, i) => nd.setAttribute('opacity', t >= t0 + (t1 - t0) * (i / Math.max(1, n - 1)) ? 1 : 0)));
    S.blade.segs.push({ t0, t1, pos: p => { const f = p * (n - 1), i = Math.min(n - 2, Math.floor(f)), e = f - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * e, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * e]; } });
    return nodes;
  };

  /** Pencil line (graphite, on the paper, never cut). draws from t0 to t1. */
  SH.pencil = (d, t0, t1, opts = {}) => {
    measure.setAttribute('d', d);
    const len = measure.getTotalLength();
    const p = add(d, 'none', pencil, { stroke: PAL.graphite, 'stroke-width': (opts.w ?? 1.8) * u, 'stroke-linecap': 'round', 'stroke-dasharray': opts.dash ?? `${len} ${len + 10}`, opacity: 0.85 });
    const m = opts.dash ? null : p;
    SH.timed.push(t => {
      const e = clamp((t - t0) / (t1 - t0));
      if (m) p.setAttribute('stroke-dashoffset', len * (1 - e)); else p.setAttribute('opacity', e > 0 ? 0.85 * Math.min(1, e * 3) : 0);
    });
    return p;
  };
  SH.pencilText = (str, x, y, size, t0, opts = {}) => {
    const tx = svg('text', { x, y, fill: PAL.graphite, 'font-family': PENFONT, 'font-weight': 500, 'font-size': size, 'text-anchor': opts.anchor ?? 'start', opacity: 0, 'data-name': opts.name ?? `Pencil note ${str}`, transform: `rotate(${opts.rot ?? -2} ${x} ${y})` }, pencil);
    tx.textContent = str;
    SH.timed.push(t => tx.setAttribute('opacity', (clamp((t - t0) / 0.3) * 0.9).toFixed(3)));
    return tx;
  };

  SH.update = t => {
    // entrance + fold
    const enter = o.enterAt == null ? 1 : spring(t - o.enterAt, { stiffness: 150, damping: 21 });
    const dy = (1 - enter) * (S.H * 0.9);
    const openP = o.openAt == null ? 1 : smootherstep((t - o.openAt) / (o.openDur ?? 0.5));
    const sx = -Math.cos(openP * Math.PI); // -1 folded → 1 open
    const lift = Math.sin(openP * Math.PI);
    root.setAttribute('transform', `translate(0 ${dy.toFixed(1)})`);
    rightWrap.setAttribute('transform', `translate(${cx} ${o.y + o.h / 2}) scale(${(Math.abs(sx) < 0.002 ? 0.002 : sx).toFixed(4)} ${(1 + lift * 0.035).toFixed(4)}) translate(${-cx} ${-(o.y + o.h / 2)})`);
    back.setAttribute('opacity', sx < 0 ? (0.08 + 0.18 * (1 + sx)).toFixed(3) : (lift * 0.12).toFixed(3));
    crease.setAttribute('opacity', o.openAt == null ? 0 : openP >= 1 ? 0.35 : 0.6 * openP);
    pencil.setAttribute('opacity', openP >= 1 ? 1 : 0);
    // cuts
    for (const c of SH.cuts) {
      const e = clamp((t - c.t0) / (c.t1 - c.t0));
      c.kerf.setAttribute('stroke-dashoffset', (c.len * (1 - e)).toFixed(1));
      c.kerf.setAttribute('fill', t >= c.t1 ? '#000' : 'none');
      if (c.guide) c.guide.setAttribute('opacity', t < c.t0 - c.pre ? 0 : (0.75 * clamp((t - (c.t0 - c.pre)) / 0.2)).toFixed(3));
    }
    for (const f of SH.falls) {
      const tau = t - f.at - f.delay;
      if (t < f.at || tau > 1.4) { f.g.setAttribute('opacity', 0); continue; }
      const tt = Math.max(0, tau);
      const y = 0.5 * f.grav * tt * tt, x = f.drift * tt, rot = f.spin * tt, sc = 1 + 0.12 * tt;
      f.g.setAttribute('opacity', (1 - clamp((tau - 0.9) / 0.4)).toFixed(3));
      f.g.setAttribute('transform', `translate(${(x + f.pc[0]).toFixed(1)} ${(y + f.pc[1]).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(3)}) translate(${-f.pc[0]} ${-f.pc[1]})`);
    }
    for (const fn of SH.timed) fn(t);
  };
  S.sheets.push(SH);
  return SH;
}

// ---------------------------------------------------------------- story shapes (absolute coords, length-scaled)
const scalePts = (pts, x, y, s) => pts.map(([a, b]) => [x + a * s, y + b * s]);

/** Submarine side view, bow to the right. (x,y) = stern-centre, len = length. */
export function subPath(x, y, len) {
  const p = scalePts([[0.035, -0.032], [0.2, -0.05], [0.5, -0.056], [0.515, -0.058], [0.53, -0.15], [0.545, -0.158], [0.63, -0.158], [0.66, -0.06], [0.86, -0.056],
    [0.93, -0.048], [0.975, -0.03], [1.0, -0.004], [0.985, 0.025], [0.94, 0.047], [0.86, 0.058], [0.4, 0.06], [0.15, 0.05], [0.04, 0.024], [0.0, 0.05], [-0.012, 0.05], [-0.012, -0.05], [0.0, -0.05]], x, y, len);
  return P.poly(p);
}
/** Warship side view at a waterline y; only the part above the waterline. v = variant 0..2 */
export function shipPath(x, y, len, v = 0, flip = false) {
  const base = [
    [[0, 0], [0.0, -0.06], [0.22, -0.06], [0.24, -0.11], [0.38, -0.11], [0.39, -0.17], [0.44, -0.17], [0.455, -0.33], [0.465, -0.33], [0.48, -0.17], [0.52, -0.17], [0.53, -0.11],
      [0.58, -0.11], [0.59, -0.2], [0.65, -0.2], [0.66, -0.11], [0.72, -0.11], [0.73, -0.08], [0.96, -0.085], [1.0, -0.1], [0.96, 0]],
    [[0, 0], [0.0, -0.07], [0.3, -0.07], [0.31, -0.13], [0.42, -0.13], [0.43, -0.24], [0.47, -0.24], [0.48, -0.36], [0.49, -0.36], [0.5, -0.24], [0.55, -0.24], [0.56, -0.13],
      [0.66, -0.13], [0.67, -0.09], [0.95, -0.09], [1.0, -0.11], [0.95, 0]],
    [[0, 0], [0.0, -0.065], [0.18, -0.065], [0.2, -0.12], [0.3, -0.12], [0.31, -0.19], [0.36, -0.19], [0.37, -0.3], [0.38, -0.3], [0.395, -0.19], [0.43, -0.19], [0.44, -0.12],
      [0.5, -0.12], [0.51, -0.22], [0.56, -0.22], [0.57, -0.12], [0.62, -0.12], [0.63, -0.25], [0.64, -0.25], [0.65, -0.12], [0.7, -0.12], [0.71, -0.085], [0.95, -0.09], [1.0, -0.105], [0.955, 0]],
  ][v % 3];
  const pts = base.map(([a, b]) => [flip ? 1 - a : a, b]);
  return P.poly(scalePts(pts, x, y, len));
}
/** Torpedo, nose to the right. (x,y) = tail-centre. */
export function torpedoPath(x, y, len) {
  const h = 0.042;
  const pts = [[0.0, -0.075], [0.035, -0.075], [0.06, -0.02], [0.1, -h], [0.86, -h], [0.93, -h * 0.85], [0.975, -h * 0.55], [1.0, 0], [0.975, h * 0.55], [0.93, h * 0.85], [0.86, h],
    [0.1, h], [0.06, 0.02], [0.035, 0.075], [0.0, 0.075], [0.025, 0.012], [0.0, 0.012], [0.0, -0.012], [0.025, -0.012]];
  return P.poly(scalePts(pts, x, y, len));
}

/**
 * Officer figure as paper (white islands) with lace cuts in the coat. cx = centre, foot = ground y, hgt = height.
 * pose: 'sides' | 'behind' | 'folded'. No face, no insignia. Returns a <g> inside the sheet mask.
 */
export function officer(SH, cx, foot, hgt, pose = 'sides', { lean = 0, name = 'Officer', headTilt = 0 } = {}) {
  const g = SH.group({ 'data-name': name, transform: `rotate(${lean} ${cx} ${foot})` });
  const H = hgt, W = (a, b) => [cx + a * H, foot - b * H];
  const isl = d => SH.island(d, g), cut = d => svg('path', { d, fill: '#000' }, g);
  // legs
  const stance = pose === 'behind' ? 0.075 : 0.05;
  isl(P.poly([W(-0.075, 0.38), W(-0.012, 0.38), W(-stance + 0.035, 0.012), W(-stance - 0.03, 0.0), W(-stance - 0.05, 0.0)]));
  isl(P.poly([W(0.012, 0.38), W(0.075, 0.38), W(stance + 0.05, 0.0), W(stance + 0.03, 0.0), W(stance - 0.035, 0.012)]));
  isl(P.poly([W(-stance - 0.075, 0), W(-stance + 0.03, 0), W(-stance + 0.03, 0.022), W(-stance - 0.06, 0.03)])); // boots
  isl(P.poly([W(stance - 0.03, 0), W(stance + 0.075, 0), W(stance + 0.06, 0.03), W(stance - 0.03, 0.022)]));
  // greatcoat: shoulders → chest → belted waist → flared hem
  const C = (pts) => 'M' + pts.map(p => p.join(' ')).join(' ');
  isl(`${C([W(-0.118, 0.785)])} Q${W(-0.135, 0.7).join(' ')} ${W(-0.122, 0.62).join(' ')} L${W(-0.106, 0.55).join(' ')} Q${W(-0.122, 0.45).join(' ')} ${W(-0.134, 0.36).join(' ')}
    L${W(0.134, 0.36).join(' ')} Q${W(0.122, 0.45).join(' ')} ${W(0.106, 0.55).join(' ')} L${W(0.122, 0.62).join(' ')} Q${W(0.135, 0.7).join(' ')} ${W(0.118, 0.785).join(' ')} Q${W(0, 0.81).join(' ')} ${W(-0.118, 0.785).join(' ')} Z`);
  cut(P.slit(cx, foot - 0.552 * H, 0.2 * H, 0.012 * H)); // belt line
  // neck + head (plain oval, no face) + cap
  isl(P.poly([W(-0.028, 0.79), W(0.028, 0.79), W(0.028, 0.84), W(-0.028, 0.84)]));
  const hg = svg('g', { transform: `rotate(${headTilt} ${cx} ${foot - 0.84 * H})` }, g);
  SH.island(`M${cx - 0.062 * H} ${foot - 0.9 * H} a${0.062 * H} ${0.074 * H} 0 1 0 ${0.124 * H} 0 a${0.062 * H} ${0.074 * H} 0 1 0 ${-0.124 * H} 0 Z`, hg);
  SH.island(`M${cx - 0.066 * H} ${foot - 0.935 * H} L${cx + 0.066 * H} ${foot - 0.935 * H} Q${cx + 0.11 * H} ${foot - 0.975 * H} ${cx + 0.088 * H} ${foot - 0.995 * H} Q${cx} ${foot - 1.015 * H} ${cx - 0.088 * H} ${foot - 0.995 * H} Q${cx - 0.11 * H} ${foot - 0.975 * H} ${cx - 0.066 * H} ${foot - 0.935 * H} Z`, hg); // cap crown
  SH.island(P.poly([[cx - 0.07 * H, foot - 0.94 * H], [cx + 0.07 * H, foot - 0.94 * H], [cx + 0.05 * H, foot - 0.918 * H], [cx - 0.05 * H, foot - 0.918 * H]]), hg); // visor
  svg('path', { d: P.slit(cx, foot - 0.952 * H, 0.11 * H, 0.011 * H), fill: '#000' }, hg); // cap band cut
  // arms (sleeves end in small mitten hands; never raised)
  const hand = (x, y) => isl(`M${x - 0.022 * H} ${y} a${0.022 * H} ${0.028 * H} 0 1 0 ${0.044 * H} 0 a${0.022 * H} ${0.028 * H} 0 1 0 ${-0.044 * H} 0 Z`);
  if (pose === 'sides') {
    for (const sd of [-1, 1]) {
      isl(P.poly([W(sd * 0.105, 0.785), W(sd * 0.15, 0.765), W(sd * 0.178, 0.68), W(sd * 0.182, 0.47), W(sd * 0.142, 0.47), W(sd * 0.138, 0.66), W(sd * 0.12, 0.7)]));
      hand(cx + sd * 0.162 * H, foot - 0.445 * H);
      cut(P.slit(cx + sd * 0.16 * H, foot - 0.5 * H, 0.05 * H, 0.008 * H)); // cuff
    }
  } else if (pose === 'behind') {
    for (const sd of [-1, 1]) {
      isl(P.poly([W(sd * 0.105, 0.785), W(sd * 0.152, 0.765), W(sd * 0.18, 0.68), W(sd * 0.176, 0.57), W(sd * 0.13, 0.52), W(sd * 0.118, 0.56), W(sd * 0.14, 0.62), W(sd * 0.125, 0.7)]));
    }
  } else { // folded across the chest
    for (const sd of [-1, 1]) isl(P.poly([W(sd * 0.105, 0.785), W(sd * 0.152, 0.765), W(sd * 0.182, 0.68), W(sd * 0.178, 0.6), W(sd * 0.14, 0.58), W(sd * 0.13, 0.7)]));
    isl(P.poly([W(-0.18, 0.62), W(0.11, 0.665), W(0.115, 0.625), W(-0.17, 0.575)]));            // lower forearm
    isl(P.poly([W(0.18, 0.64), W(-0.1, 0.69), W(-0.105, 0.648), W(0.17, 0.595)]));             // upper forearm
    cut(P.poly([W(0.165, 0.597), W(-0.098, 0.646), W(-0.098, 0.652), W(0.165, 0.604)]));       // the gap where they cross
    hand(cx + 0.115 * H, foot - 0.645 * H); hand(cx - 0.105 * H, foot - 0.668 * H);
  }
  // lace in the coat: buttons, hem petals, collar slits
  for (let i = 0; i < 4; i++) { const by = 0.735 - i * 0.075; if (pose === 'folded' && by < 0.71 && by > 0.55) continue; cut(P.circle(cx, foot - by * H, 0.011 * H)); }
  for (let i = -2; i <= 2; i++) cut(P.circle(cx + i * 0.045 * H, foot - 0.395 * H, 0.008 * H)); // coat hem stitch holes
  cut(P.slit(cx, foot - 0.44 * H, 0.09 * H, 0.008 * H, Math.PI / 2)); // coat split
  cut(P.slit(cx - 0.055 * H, foot - 0.76 * H, 0.06 * H, 0.012 * H, 0.5));
  cut(P.slit(cx + 0.055 * H, foot - 0.76 * H, 0.06 * H, 0.012 * H, -0.5));
  cut(P.slit(cx, foot - 0.2 * H, 0.012 * H * 0 + 0.16 * H, 0.01 * H, Math.PI / 2)); // leg gap line
  return g;
}

/** Cuba outline (Natural Earth, PD) projected into a box. */
export async function cubaPath(ctx, box) {
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const cuba = geo.features.find(f => f.name === 'Cuba');
  const ring = cuba.rings.reduce((a, b) => (b.length > a.length ? b : a));
  const lon0 = -85.1, lon1 = -74.0, lat0 = 19.7, lat1 = 23.4;
  const k = Math.cos((21.5 * Math.PI) / 180);
  const sx = box.w / ((lon1 - lon0) * k), sy = box.h / (lat1 - lat0), s = Math.min(sx, sy);
  const pts = [];
  ring.forEach((p, i) => { if (i % 2 === 0) pts.push([box.x + (p[0] - lon0) * k * s, box.y + box.h - (p[1] - lat0) * s]); });
  return P.poly(pts);
}

/** Width of cut text (canvas measure, same font + letter-spacing as cutText). */
export function textW(str, size, ls = size * 0.04) {
  const c = textW.c ?? (textW.c = document.createElement('canvas').getContext('2d'));
  c.font = `800 ${size}px ${CUTFONT}`;
  return c.measureText(str).width + ls * str.length;
}
