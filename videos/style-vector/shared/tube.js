// VECTOR CRT — the display engine. One electron beam draws every line; nothing is a font, nothing is an image.
// Pure function of time: build a display list once, then update(t) sets every path from t.
import { svg, el, rand, clamp } from '/onclack-styles/engine/lib/anim.js';

/* ---------- palette (only these) ---------- */
export const PH = {
  bezel: '#151614',      // painted steel around the tube
  bezelEdge: '#2a2c28',
  glass: '#070b08',      // unlit phosphor (never pure black)
  glassMid: '#0c130e',
  etch: '#262c27',       // faceplate graticule, unlit (ambient light only)
  steady: '#7fd893',     // P31-type green, settled trace
  hot: '#eafff0',        // fresh trace / beam spot (near white)
};

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const A = hex(PH.steady), B = hex(PH.hot);
export const mix = k => `rgb(${A.map((a, i) => Math.round(a + (B[i] - a) * clamp(k))).join(',')})`;

/* ---------- our own single-stroke vector font (4 × 6 grid, y down, 0 = cap top) ---------- */
const O = [[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]];
const Pb = [[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]];
export const GLYPHS = {
  A: [[[0, 6], [2, 0], [4, 6]], [[0.7, 4], [3.3, 4]]],
  B: [[[0, 3], [3, 3], [4, 4], [4, 5], [3, 6], [0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3]]],
  C: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]],
  D: [[[0, 0], [0, 6], [2.5, 6], [4, 4.5], [4, 1.5], [2.5, 0], [0, 0]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
  G: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3.5], [2.2, 3.5]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[2, 0], [2, 6]], [[1, 0], [3, 0]], [[1, 6], [3, 6]]],
  J: [[[4, 0], [4, 5], [3, 6], [1, 6], [0, 5]]],
  K: [[[0, 0], [0, 6]], [[4, 0], [0, 4]], [[1.4, 3], [4, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [O],
  P: [Pb],
  Q: [O, [[2.5, 4.5], [4.2, 6.4]]],
  R: [Pb, [[2, 3], [4, 6]]],
  S: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [1, 6], [2, 2.5], [3, 6], [4, 0]]],
  X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
  Y: [[[0, 0], [2, 3], [4, 0]], [[2, 3], [2, 6]]],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
  0: [O, [[3.5, 0.6], [0.5, 5.4]]], // slashed zero, like a real character generator
  1: [[[1, 1], [2, 0], [2, 6]], [[1, 6], [3, 6]]],
  2: [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [0, 6], [4, 6]]],
  3: [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]], [[1.5, 3], [3, 3]]],
  4: [[[3, 6], [3, 0], [0, 4], [4, 4]]],
  5: [[[4, 0], [0, 0], [0, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]],
  6: [[[3.5, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]]],
  7: [[[0, 0], [4, 0], [1.5, 6]]],
  8: [[[3, 3], [1, 3], [0, 4], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3]]],
  9: [[[4, 3], [1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [0.5, 6]]],
  '.': [[[2, 5.6], [2, 6]]],
  ',': [[[2, 5.4], [2, 6], [1.4, 7]]],
  ':': [[[2, 1.6], [2, 2]], [[2, 5.6], [2, 6]]],
  '-': [[[0.8, 3], [3.2, 3]]],
  "'": [[[2, 0], [2, 1.5]]],
  '/': [[[0, 6], [4, 0]]],
  '?': [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [2, 3.5], [2, 4.3]], [[2, 5.6], [2, 6]]],
  '(': [[[3, 0], [2, 1], [1.6, 3], [2, 5], [3, 6]]],
  ')': [[[1, 0], [2, 1], [2.4, 3], [2, 5], [1, 6]]],
  '·': [[[2, 2.8], [2, 3.2]]],
  '~': [[[0, 3.4], [1, 2.6], [3, 3.4], [4, 2.6]]],
};
const ADV = 4, TRACK = 2.2, SPACE = 4;

/** Width in px of a string at cap height `cap`. */
export function textWidth(str, cap, track = TRACK) {
  const u = cap / 6; let w = 0;
  for (const ch of str) w += (ch === ' ' ? SPACE : ADV + track) * u;
  return Math.max(0, w - track * u);
}
/** Strokes (px polylines) for a string. (x,y) = top-left of caps unless anchor 'middle'/'end'. */
export function textStrokes(str, x, y, cap, { anchor = 'start', track = TRACK, slant = 0 } = {}) {
  const u = cap / 6, w = textWidth(str, cap, track);
  let cx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const out = [];
  for (const ch of str.toUpperCase()) {
    if (ch === ' ') { cx += SPACE * u; continue; }
    for (const s of GLYPHS[ch] ?? []) out.push(s.map(([gx, gy]) => [cx + gx * u + (6 - gy) * u * slant, y + gy * u]));
    cx += (ADV + track) * u;
  }
  return out;
}

/* ---------- geometry ---------- */
export const place = (shape, cx, cy, s, sy = s) => shape.map(p => p.map(([x, y]) => [cx + x * s, cy + y * sy]));
export function circlePts(cx, cy, r, n = 28, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
const lens = pts => { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; };
const fmt = n => n.toFixed(1);
const dOf = pts => 'M' + pts.map(p => fmt(p[0]) + ' ' + fmt(p[1])).join('L');
/** Part of a stroke between fractions a..b of its length. */
function sub(st, a, b) {
  const L = st.len, la = a * L, lb = b * L, c = st.cum, p = st.pts, out = [];
  const at = l => { let i = 1; while (i < c.length - 1 && c[i] < l) i++; const k = (l - c[i - 1]) / ((c[i] - c[i - 1]) || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; };
  out.push(at(la));
  for (let i = 1; i < c.length - 1; i++) if (c[i] > la && c[i] < lb) out.push(p[i]);
  out.push(at(lb));
  return out;
}

/* ---------- the tube ---------- */
export function buildTube(root, ctx, uid) {
  const L = ctx.layout, W = L.width, H = L.height, u = L.unit;
  root.style.background = PH.bezel;
  const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;inset:0;display:block' }, root);
  const defs = svg('defs', {}, s);
  const id = n => `${n}-${uid}`;
  // face geometry: the curved faceplate sits inside a painted bezel
  const inset = L.px(18), R = L.px(L.portrait ? 64 : 78);
  const face = { x: inset, y: inset, w: W - inset * 2, h: H - inset * 2 };
  const rg = svg('radialGradient', { id: id('face'), cx: '50%', cy: '48%', r: '75%' }, defs);
  svg('stop', { offset: '0%', 'stop-color': PH.glassMid }, rg);
  svg('stop', { offset: '100%', 'stop-color': PH.glass }, rg);
  const vg = svg('radialGradient', { id: id('vig'), cx: '50%', cy: '50%', r: '72%' }, defs);
  svg('stop', { offset: '62%', 'stop-color': '#000', 'stop-opacity': 0 }, vg);
  svg('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.62 }, vg);
  const sh = svg('linearGradient', { id: id('sheen'), x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
  svg('stop', { offset: '0%', 'stop-color': '#dfe8e2', 'stop-opacity': 0.055 }, sh);
  svg('stop', { offset: '38%', 'stop-color': '#dfe8e2', 'stop-opacity': 0.0 }, sh);
  // restrained bloom: one tight halo, alpha 0.5 — the trace is a line, not a neon tube
  const f = svg('filter', { id: id('bloom'), x: '-2%', y: '-2%', width: '104%', height: '104%' }, defs);
  svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: (2.4 * u).toFixed(2), result: 'b' }, f);
  const ct = svg('feComponentTransfer', { in: 'b', result: 'b2' }, f); svg('feFuncA', { type: 'linear', slope: 0.5 }, ct);
  const mg = svg('feMerge', {}, f); svg('feMergeNode', { in: 'b2' }, mg); svg('feMergeNode', { in: 'SourceGraphic' }, mg);
  const clip = svg('clipPath', { id: id('clip') }, defs);
  svg('rect', { x: face.x, y: face.y, width: face.w, height: face.h, rx: R }, clip);

  const faceG = svg('g', { 'clip-path': `url(#${id('clip')})`, 'data-name': 'Tube face' }, s);
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id('face')})` }, faceG);
  // faceplate graticule: etched, unlit, 1 px — it belongs to the glass, so it never moves with the picture
  const gr = svg('g', { stroke: PH.etch, 'stroke-width': 1, fill: 'none', 'data-name': 'Graticule (etched)' }, faceG);
  const nx = L.portrait ? 8 : 10, ny = L.portrait ? 14 : 8, gx = face.w / nx, gy = face.h / ny;
  let gd = '';
  for (let i = 1; i < nx; i++) gd += `M${fmt(face.x + i * gx)} ${face.y}V${face.y + face.h}`;
  for (let j = 1; j < ny; j++) gd += `M${face.x} ${fmt(face.y + j * gy)}H${face.x + face.w}`;
  const cx0 = face.x + face.w / 2, cy0 = face.y + face.h / 2;
  for (let i = 1; i < nx * 5; i++) { const x = face.x + i * gx / 5; gd += `M${fmt(x)} ${fmt(cy0 - 4 * u)}V${fmt(cy0 + 4 * u)}`; }
  for (let j = 1; j < ny * 5; j++) { const y = face.y + j * gy / 5; gd += `M${fmt(cx0 - 4 * u)} ${fmt(y)}H${fmt(cx0 + 4 * u)}`; }
  svg('path', { d: gd, opacity: 0.55 }, gr);

  const pic = svg('g', { 'data-name': 'Picture (deflection)' }, faceG);
  const content = svg('g', { filter: `url(#${id('bloom')})`, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, pic);
  const flood = svg('rect', { x: 0, y: 0, width: W, height: H, fill: PH.steady, opacity: 0, 'data-name': 'Erase flood' }, faceG);
  // glass: vignette of the curved face, one soft reflection of the room, dust + two old fingerprints (fixed, seeded)
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id('vig')})` }, faceG);
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id('sheen')})` }, faceG);
  const dust = el('canvas', {}, null); dust.width = 384; dust.height = 384;
  const g2 = dust.getContext('2d');
  for (let i = 0; i < 260; i++) {
    const r = rand(i * 3.1 + 7), a = 0.05 + 0.25 * rand(i * 5.7 + 1);
    g2.fillStyle = `rgba(220,230,222,${a.toFixed(3)})`;
    g2.fillRect(Math.floor(rand(i * 1.3) * 384), Math.floor(rand(i * 2.9 + 4) * 384), r > 0.93 ? 2 : 1, 1);
  }
  const dustPat = svg('pattern', { id: id('dust'), width: 384, height: 384, patternUnits: 'userSpaceOnUse' }, defs);
  svg('image', { href: dust.toDataURL(), width: 384, height: 384 }, dustPat);
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id('dust')})`, opacity: 0.22, 'data-name': 'Dust on glass' }, faceG);
  for (const [fx, fy, fr, sd] of [[0.83, 0.2, 0.07, 1], [0.12, 0.86, 0.05, 2]]) {
    const smud = svg('radialGradient', { id: id('sm' + sd) }, defs);
    svg('stop', { offset: '0%', 'stop-color': '#cfd8d1', 'stop-opacity': 0.035 }, smud);
    svg('stop', { offset: '100%', 'stop-color': '#cfd8d1', 'stop-opacity': 0 }, smud);
    svg('ellipse', { cx: W * fx, cy: H * fy, rx: Math.min(W, H) * fr, ry: Math.min(W, H) * fr * 0.7, fill: `url(#${id('sm' + sd)})`, transform: `rotate(${-25 + sd * 30} ${W * fx} ${H * fy})` }, faceG);
  }
  // bezel: inner lip shadow + a thin catch-light on the lower edge
  svg('rect', { x: face.x, y: face.y, width: face.w, height: face.h, rx: R, fill: 'none', stroke: '#000', 'stroke-width': L.px(10), opacity: 0.55 }, s);
  svg('rect', { x: face.x - L.px(3), y: face.y - L.px(3), width: face.w + L.px(6), height: face.h + L.px(6), rx: R + L.px(3), fill: 'none', stroke: PH.bezelEdge, 'stroke-width': L.px(1.5) }, s);

  return { svg: s, pic, content, flood, face, u };
}

/* ---------- the display list (one beam) ---------- */
export function makeDisplay(tube, { winFrom = -Infinity, winTo = Infinity } = {}) {
  const u = tube.u, items = [], dyns = [], dwells = [];
  let cursor = 0;
  const D = {
    at(t) { cursor = t; return D; },
    get cursor() { return cursor; },
    /** Beam draws polylines in order. o: t0, speed (design px/s), dur, w (width ×), int (brightness), until, ghost, fade(t), name */
    draw(strokes, o = {}) {
      const speed = (o.speed ?? 2600) * u;
      const t0 = o.t0 ?? cursor;
      let t = t0; const st = [];
      for (const pts of strokes) {
        if (!pts || pts.length < 2) continue;
        const cum = lens(pts), len = cum[cum.length - 1];
        if (len < 0.5) { pts.push([pts[0][0] + 0.6, pts[0][1]]); }
        const c2 = lens(pts), l2 = c2[c2.length - 1];
        const dur = Math.max(l2 / speed, 0.01);
        st.push({ pts, cum: c2, len: l2, t0: t, t1: t + dur }); t += dur + (o.blank ?? 0.004);
      }
      if (o.dur && st.length) { const k = o.dur / (t - t0); for (const x of st) { x.t0 = t0 + (x.t0 - t0) * k; x.t1 = t0 + (x.t1 - t0) * k; } t = t0 + o.dur; }
      const it = { st, t0, t1: t, until: o.until ?? Infinity, ghost: o.ghost ?? true, fade: o.fade, w: o.w ?? 1, int: o.int ?? 1, name: o.name ?? 'Trace', dash: o.dash, xf: o.xf, xp: o.xp };
      items.push(it);
      cursor = t + (o.after ?? 0.03);
      return it;
    },
    text(str, x, y, cap, o = {}) { return D.draw(textStrokes(str, x, y, cap, o), { speed: 1500, ...o, name: o.name ?? `Text "${str}"` }); },
    /** fn(t) → [{pts, o, w, hot}] — redrawn every refresh (moving things). */
    dyn(fn, { max = 8, name = 'Moving trace', from = -Infinity, to = Infinity } = {}) { dyns.push({ fn, max, name, from, to }); },
    /** Beam parked: a bright spot that slowly burns (the hesitation). */
    dwell(x, y, t0, t1) { dwells.push({ x, y, t0, t1 }); },
    erases: [],
    erase(t) { D.erases.push(t); for (const it of items) if (it.until === Infinity && it.t0 < t) it.until = t; },
    jitter: () => ({ dx: 0, sy: 1 }),
    build() {
      const C = tube.content;
      for (const it of items) {
        if (it.until < winFrom - 0.6 || it.t0 > winTo) { it.skip = true; continue; }
        it.g = svg('g', { 'data-name': it.name, display: 'none' }, C);
        it.done = svg('path', { stroke: PH.steady, 'stroke-width': (2.8 * u * it.w).toFixed(2), ...(it.dash ? { 'stroke-dasharray': it.dash.map(v => v * u).join(' ') } : {}) }, it.g);
        it.ends = svg('path', { stroke: PH.steady, 'stroke-width': (4.2 * u * it.w).toFixed(2), opacity: 0.55 }, it.g);
        it.trail = svg('path', { stroke: PH.hot, 'stroke-width': (3.0 * u * it.w).toFixed(2), opacity: 0.95 }, it.g);
        it.key = '';
      }
      for (const d of dyns) d.paths = Array.from({ length: d.max }, () => svg('path', { stroke: PH.steady, display: 'none', 'data-name': d.name }, C));
      D.beam = svg('g', { 'data-name': 'Beam spot', display: 'none' }, tube.pic);
      D.beamHalo = svg('circle', { r: 13 * u, fill: PH.steady, opacity: 0.2 }, D.beam);
      D.beamCore = svg('circle', { r: 3.6 * u, fill: PH.hot }, D.beam);
      return D;
    },
    update(t) {
      let beam = null;
      for (const it of items) {
        if (it.skip) continue;
        const erased = t >= it.until;
        if (t < it.t0 || (erased && (!it.ghost || t > it.until + 0.9))) { it.g.setAttribute('display', 'none'); continue; }
        it.g.setAttribute('display', 'inline');
        // which strokes are complete / partial
        let n = 0, part = null, pf = 0;
        for (const s of it.st) { if (t >= s.t1) n++; else { if (t >= s.t0) { part = s; pf = (t - s.t0) / (s.t1 - s.t0); } break; } }
        const key = n + ':' + (part ? pf.toFixed(3) : '-');
        if (key !== it.key) {
          let d = '', e = '';
          for (let i = 0; i < n; i++) { const p = it.st[i].pts; d += dOf(p); e += `M${fmt(p[0][0])} ${fmt(p[0][1])}h0.1M${fmt(p[p.length - 1][0])} ${fmt(p[p.length - 1][1])}h0.1`; }
          if (part) { const sp = sub(part, 0, pf); d += dOf(sp); beam = it.xp ? it.xp(sp[sp.length - 1], t) : sp[sp.length - 1]; }
          it.done.setAttribute('d', d || 'M0 0'); it.ends.setAttribute('d', e || 'M0 0');
          it.key = key;
        } else if (part) { const sp = sub(part, 0, pf); beam = it.xp ? it.xp(sp[sp.length - 1], t) : sp[sp.length - 1]; }
        // hot trail: the last 0.14 s of beam travel
        const tau = 0.14;
        if (t < it.t1 + tau && !erased) {
          let td = '';
          for (const s of it.st) {
            if (s.t1 < t - tau || s.t0 > t) continue;
            const a = clamp((t - tau - s.t0) / (s.t1 - s.t0)), b = clamp((t - s.t0) / (s.t1 - s.t0));
            if (b > a) td += dOf(sub(s, a, b));
          }
          it.trail.setAttribute('d', td || 'M0 0');
        } else it.trail.setAttribute('d', 'M0 0');
        // persistence: fresh lines are whiter, settle in ~0.5 s, then age a little
        const age = Math.max(0, t - it.t1);
        const hot = it.t1 > t ? 0.55 : 0.55 * Math.exp(-age / 0.35);
        it.done.setAttribute('stroke', mix(hot));
        let op = it.int * (1 - 0.12 * clamp(age / 4));
        if (it.fade) op *= it.fade(t);
        if (erased) op *= 0.16 * Math.exp(-(t - it.until) / 0.3); // storage erase leaves a short ghost
        it.g.setAttribute('opacity', op.toFixed(3));
        if (it.xf) it.g.setAttribute('transform', it.xf(t));
      }
      for (const d of dyns) {
        const list = t >= d.from && t <= d.to ? (d.fn(t) ?? []) : [];
        d.paths.forEach((p, i) => {
          const s = list[i];
          if (!s || !s.pts || s.pts.length < 2) { p.setAttribute('display', 'none'); return; }
          p.setAttribute('display', 'inline'); p.setAttribute('d', dOf(s.pts));
          p.setAttribute('stroke', mix(s.hot ?? 0.15)); p.setAttribute('stroke-width', (2.8 * u * (s.w ?? 1)).toFixed(2));
          p.setAttribute('opacity', clamp(s.o ?? 1).toFixed(3));
        });
      }
      let burn = 0;
      if (!beam) for (const w of dwells) if (t >= w.t0 && t < w.t1) { beam = [w.x, w.y]; burn = clamp((t - w.t0) / 1.6); }
      if (beam) {
        D.beam.setAttribute('display', 'inline');
        D.beam.setAttribute('transform', `translate(${fmt(beam[0])} ${fmt(beam[1])})`);
        D.beamCore.setAttribute('r', (u * (3.6 + 2 * burn)).toFixed(2));
        D.beamHalo.setAttribute('r', (u * (13 + 9 * burn)).toFixed(2));
        D.beamHalo.setAttribute('opacity', (0.2 + 0.12 * burn).toFixed(3));
      } else D.beam.setAttribute('display', 'none');
      // erase flood: storage tubes flash the whole face once when cleared (soft, < 0.4 s, 1 per scene)
      let fl = 0;
      for (const e of D.erases) { const x = t - e; if (x >= 0 && x < 0.5) fl += 0.11 * Math.min(1, x / 0.033) * Math.exp(-x / 0.11); }
      tube.flood.setAttribute('opacity', fl.toFixed(3));
      const j = D.jitter(t);
      const cy = tube.face.y + tube.face.h / 2;
      tube.pic.setAttribute('transform', `translate(${fmt(j.dx)} ${fmt(cy * (1 - j.sy))}) scale(1 ${j.sy.toFixed(4)})`);
    },
  };
  return D;
}
