// Paint on rock: finger strokes, finger dots, mouth-blown pigment around a held shape (negative), finger writing.
// All in WORLD px inside one SVG. Every mark registers an update(T) so it is a pure function of global time.
import { svg, rand, clamp } from '/onclack-styles/engine/lib/anim.js';
import { GLYPHS } from './glyphs.js';

// Palette (nothing else on the wall): earth pigments ground in water, seen in plain daylight.
export const PIG = {
  red: '#963a22',      // red ochre (haematite)
  yellow: '#c4862f',   // yellow ochre (goethite)
  char: '#2b2420',     // charcoal (burnt wood)
  white: '#ece4d2',    // kaolin clay
};

const ez = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
const outQ = (p) => { p = clamp(p); return 1 - (1 - p) * (1 - p) * (1 - p); };
let UID = 0;

export function createPainter(svgRoot, defs) {
  const marks = [];
  const reg = (u) => { marks.push(u); return u; };

  // radial "puff" gradient (white in a mask): dense core, soft spray edge
  const g = svg('radialGradient', { id: `puff${++UID}` }, defs);
  [[0, 0.9], [0.35, 0.72], [0.7, 0.28], [1, 0]].forEach(([o, a]) => svg('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, g));
  const puffId = g.id;

  // drying: wet pigment is darker and denser for ~1.5 s, then settles
  const dry = (T, tEnd) => (T < tEnd ? 1 : 1 - 0.16 * ez((T - tEnd) / 1.6));

  /** Jittered polyline → path (round joins) with a fixed seeded wobble (never boils). */
  function wobble(pts, w, seed) {
    return pts.map(([x, y], i) => [x + (rand(seed + i * 7.1) - 0.5) * w * 0.22, y + (rand(seed + i * 3.3 + 9) - 0.5) * w * 0.22]);
  }
  const dPath = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
  function offset(pts, d) {
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      return [p[0] + nx * d, p[1] + ny * d];
    });
  }
  function resample(pts, step) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const L = Math.hypot(x1 - x0, y1 - y0); const n = Math.max(1, Math.round(L / step));
      for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
    }
    return out;
  }
  const polyLen = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

  /** One finger stroke: body (pigment runs out toward the end) + faint pigment ridges at the edges + a loaded dab where the finger lands. */
  function stroke(parent, pts, { w = 24, color = PIG.char, t0 = 0, t1 = 1, seed = 1, name, opacity = 0.92, ridge = true, flat = false } = {}) {
    if (flat) { ridge = false; opacity = 1; }
    const P = wobble(resample(pts, Math.max(6, w * 0.6)), w, seed);
    const gEl = svg('g', { 'data-name': name ?? 'Finger stroke', opacity: 0 }, parent);
    const d = dPath(P);
    const a = P[0], b = P[P.length - 1];
    const far = Math.hypot(b[0] - a[0], b[1] - a[1]) > w * 1.5;
    let paint = color;
    if (far) {
      const gr = svg('linearGradient', { id: `run${++UID}`, gradientUnits: 'userSpaceOnUse', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, defs);
      const end = 0.5 + 0.25 * rand(seed * 1.9);
      [[0, 1], [0.55, 0.85], [1, end]].forEach(([o, op]) => svg('stop', { offset: o, 'stop-color': color, 'stop-opacity': op }, gr));
      paint = `url(#${gr.id})`;
    }
    const common = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 2' };
    const body = svg('path', { ...common, d, stroke: paint, 'stroke-width': w, opacity: flat ? 1 : 0.86 }, gEl);
    const edges = ridge ? [offset(P, w * 0.33), offset(P, -w * 0.33)].map((E, k) =>
      svg('path', { ...common, d: dPath(E), stroke: color, 'stroke-width': w * (k ? 0.16 : 0.22), opacity: 0.22 }, gEl)) : [];
    const dab = svg('circle', { cx: P[0][0], cy: P[0][1], r: w * 0.6, fill: color, opacity: flat ? 0 : 0.35 }, gEl);
    const paths = [body, ...edges];
    return reg((T) => {
      const p = (T - t0) / Math.max(0.01, t1 - t0);
      if (p <= 0) { gEl.setAttribute('opacity', 0); return; }
      gEl.setAttribute('opacity', flat ? 1 : (opacity * dry(T, t1)).toFixed(3));
      const off = (1 - ez(p)).toFixed(4);
      for (const el of paths) el.setAttribute('stroke-dashoffset', off);
      dab.setAttribute('r', (w * (0.4 + 0.18 * outQ(p * 4))).toFixed(1));
    });
  }

  /** Finger dot (pressed fingertip). */
  function dot(parent, x, y, { r = 18, color = PIG.char, t = 0, seed = 1, name, flat = false } = {}) {
    const n = 9, pts = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; const rr = r * (0.86 + 0.24 * rand(seed + i)); return [x + rr * Math.cos(a), y + rr * 0.92 * Math.sin(a)]; });
    const el = svg('path', { d: dPath(pts) + 'Z', fill: color, opacity: 0, 'data-name': name ?? 'Finger dot', 'stroke-linejoin': 'round', stroke: color, 'stroke-width': r * 0.25 }, parent);
    el.style.transformOrigin = `${x}px ${y}px`; el.style.transformBox = 'view-box';
    return reg((T) => {
      const p = (T - t) / 0.12;
      if (p <= 0) { el.setAttribute('opacity', 0); return; }
      el.setAttribute('opacity', flat ? 1 : (0.86 * dry(T, t + 0.15)).toFixed(3));
      el.style.transform = `scale(${(0.7 + 0.3 * outQ(p)).toFixed(3)})`;
    });
  }

  /** Mouth-blown pigment around a held shape (a hand-cut piece of bark/hide): the puffs follow its outline, the
   *  shape itself stays bare rock (negative). `shape` = polygon points. Puffs land along the shape, left → right. */
  function blow(parent, { shape, cx, cy, rx, ry, color = PIG.red, t0, t1, seed = 1, n = 18, reach = 1, name } = {}) {
    const id = `blow${++UID}`;
    const box = { x: cx - rx * 2, y: cy - ry * 2.6, width: rx * 4, height: ry * 5.2 };
    const mask = svg('mask', { id, maskUnits: 'userSpaceOnUse', ...box }, defs);
    // outline samples, pushed outwards from the centre
    const per = resample([...shape, shape[0]], 8);
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const q = per[Math.floor((i + rand(seed + i * 3.1) * 0.8) / n * per.length) % per.length];
      const vx = q[0] - cx, vy = q[1] - cy, vl = Math.hypot(vx, vy) || 1;
      const out = ry * (0.15 + 0.35 * rand(seed + i * 2.9)) * reach;
      const px = q[0] + vx / vl * out, py = q[1] + vy / vl * out;
      const R = ry * (0.42 + 0.38 * rand(seed + i * 5.3)) * reach;
      const c = svg('circle', { cx: px.toFixed(1), cy: py.toFixed(1), r: 0, fill: `url(#${puffId})`, opacity: 0 }, mask);
      puffs.push({ c, px, R });
    }
    puffs.sort((A, B) => A.px - B.px).forEach((p, i) => { p.at = t0 + (t1 - t0) * (i / n) + (rand(seed + i) - 0.5) * 0.08; });
    // the held piece: hand-cut (slightly irregular), its edge a little soft where breath lifted it
    const cut = resample([...shape, shape[0]], 14).map(([x, y], i) => [x + (rand(seed + i * 1.37) - 0.5) * 3.5, y + (rand(seed + i * 2.71) - 0.5) * 3.5]);
    const dC = dPath(cut) + 'Z';
    svg('path', { d: dC, fill: 'none', stroke: '#000', 'stroke-width': 9, 'stroke-opacity': 0.25, 'stroke-linejoin': 'round' }, mask);
    svg('path', { d: dC, fill: '#000', stroke: '#000', 'stroke-width': 4, 'stroke-opacity': 0.55, 'stroke-linejoin': 'round' }, mask);
    const gEl = svg('g', { 'data-name': name ?? 'Blown pigment', opacity: 0 }, parent);
    svg('rect', { ...box, fill: color, mask: `url(#${id})` }, gEl);
    // spatter: loose droplets around the cloud
    const spat = [];
    for (let i = 0; i < Math.round(n * 2.5); i++) {
      const q = per[Math.floor(rand(seed * 3 + i * 1.3) * per.length)];
      const vx = q[0] - cx, vy = q[1] - cy, vl = Math.hypot(vx, vy) || 1;
      const out = ry * (0.7 + 0.8 * rand(seed * 5 + i * 2.1)) * reach;
      const sx = q[0] + vx / vl * out, sy = q[1] + vy / vl * out;
      const c = svg('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: (1.2 + 3.4 * rand(seed + i * 9.7) ** 2).toFixed(1), fill: color, opacity: 0 }, gEl);
      spat.push({ c, at: t0 + (t1 - t0) * clamp((sx - (cx - rx)) / (2 * rx)) });
    }
    return reg((T) => {
      if (T < t0 - 0.05) { gEl.setAttribute('opacity', 0); return; }
      gEl.setAttribute('opacity', (0.95 * dry(T, t1)).toFixed(3));
      for (const p of puffs) {
        const q = (T - p.at) / 0.3;
        p.c.setAttribute('opacity', q <= 0 ? 0 : (0.9 * outQ(q)).toFixed(3));
        p.c.setAttribute('r', q <= 0 ? 0 : (p.R * (0.5 + 0.5 * outQ(q))).toFixed(1));
      }
      for (const s of spat) s.c.setAttribute('opacity', T < s.at ? 0 : 0.75);
    });
  }

  /** Finger writing. Returns { strokes:[…], width }. Time is split over strokes by length. */
  function write(parent, text, { x, y, cap = 80, color = PIG.char, t0, t1, seed = 1, w = null, anchor = 'start', name, track = 0.2, lean = 0.06 } = {}) {
    const chars = [...text.toUpperCase()];
    let adv = 0; const lines = [];
    chars.forEach((ch, ci) => {
      const gph = GLYPHS[ch] ?? GLYPHS[' '];
      const sc = cap * (0.95 + 0.1 * rand(seed + ci * 13)); // each letter a little different
      const ln = (rand(seed + ci * 7) - 0.5) * lean * 2;
      const dy = (rand(seed + ci * 5) - 0.5) * cap * 0.06;
      gph.s.forEach((s) => lines.push(s.map(([gx, gy]) => [adv + gx * sc + (1 - gy) * sc * ln, gy * sc + dy])));
      adv += (gph.w + track) * cap;
    });
    const width = adv - track * cap;
    const ox = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
    const gEl = svg('g', { 'data-name': name ?? `Finger writing "${text}"`, opacity: 0.86 }, parent);
    const lens = lines.map(polyLen), total = lens.reduce((a, b) => a + b, 0) || 1;
    const gap = Math.min(0.05, (t1 - t0) * 0.25 / Math.max(1, lines.length));
    const avail = (t1 - t0) - gap * lines.length;
    let at = t0;
    lines.forEach((ln, i) => {
      const dt = avail * lens[i] / total;
      const pts = ln.map(([lx, ly]) => [ox + lx, y - cap + ly]);
      stroke(gEl, pts.length === 2 && polyLen(pts) < cap * 0.08 ? [pts[0], [pts[1][0] + 0.5, pts[1][1] + 0.5]] : pts,
        { w: w ?? cap * 0.17, color, t0: at, t1: at + Math.max(0.04, dt), seed: seed * 31 + i, flat: true });
      at += dt + gap;
    });
    return { width, x: ox };
  }

  return {
    stroke, dot, blow, write,
    update(T) { for (const m of marks) m(T); },
  };
}
