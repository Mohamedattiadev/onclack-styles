// LEADED GLASS — the tiny glazing engine for this style test.
// A panel = a stack of layers. Each layer = [black backing] [glass pieces] [glass texture] [sun sheen] [grisaille paint] [lead].
// Upper layers paint their own black backing first, so the lead of the layer below never shows through a piece.
// Glass brightness = transmitted light: piece opacity over black. Unlit glass is almost black (a window at dusk);
// a pane "ignites" when the light reaches it. Imperfection (thickness, streaks, cut angles) is seeded per piece, never per frame.
import { svg, rand, clamp } from '/onclack-styles/engine/lib/anim.js';

export const PAL = {
  lead: '#17181b', leadHi: '#4a4e55', solder: '#2a2c31', paint: '#1c140f', backing: '#040506',
  cobalt: ['#163a94', '#1f4bb0', '#12307c', '#2a5cc2', '#0f2766'],
  deep: ['#0e2260', '#0b1b4e', '#13296b'],
  sea: ['#2e8a72', '#3aa086', '#24715e', '#45ab8f'],
  amber: ['#d9962a', '#e8ae45', '#c47c1c', '#f0bf5a'],
  pale: ['#efe3bd', '#e7d8a9', '#f3ead0', '#e0d0a0'],
  white: ['#d9dfd6', '#cfd8d3', '#e2e3d4', '#c6d1cf'],
  grey: ['#78808b', '#8b939c', '#6a727d', '#99a0a7'],
  sky: ['#bcd3e6', '#a9c4dd', '#cadbe9'],
  ruby: ['#a50c25', '#bd122d', '#88091f', '#c81b35'],
  coat: ['#1d2b55', '#24356a', '#18244a'],
  skin: ['#e9cf9f', '#e2c391'],
};
export const pick = (arr, s) => arr[Math.floor(rand(s) * arr.length) % arr.length];

/* ---------- colour ---------- */
const h2r = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const r2h = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, k) => { const x = h2r(a), y = h2r(b); return r2h(x.map((v, i) => v + (y[i] - v) * k)); };
export const shade = (c, k) => (k >= 0 ? mix(c, '#ffffff', k) : mix(c, '#000000', -k));

/* ---------- geometry ---------- */
export const f1 = v => (Math.round(v * 10) / 10).toString();
export const dPoly = pts => 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
export const bbox = pts => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return { x: a, y: b, w: c - a, h: d - b, cx: (a + c) / 2, cy: (b + d) / 2 }; };
export function pip([x, y], poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
/** Parts of segment a→b that lie inside polygon (even-odd). */
export function clipSeg(a, b, poly) {
  const ts = [0, 1];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const p = poly[j], q = poly[i];
    const ex = q[0] - p[0], ey = q[1] - p[1];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / den;
    const u = ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / den;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
  }
  ts.sort((m, n) => m - n);
  const out = [];
  for (let k = 0; k < ts.length - 1; k++) {
    const t0 = ts[k], t1 = ts[k + 1];
    if (t1 - t0 < 1e-6) continue;
    const tm = (t0 + t1) / 2;
    if (pip([a[0] + dx * tm, a[1] + dy * tm], poly)) out.push([[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1], t0 > 0, t1 < 1]);
  }
  return out;
}
/** Ramer–Douglas–Peucker on an open polyline. */
function rdp(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let best = -1, bi = 0;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L;
    if (d > best) { best = d; bi = i; }
  }
  if (best <= tol) return [a, b];
  return rdp(pts.slice(0, bi + 1), tol).slice(0, -1).concat(rdp(pts.slice(bi), tol));
}
export function simplify(ring, tol) {
  // split the closed ring at its two farthest points so RDP keeps the overall shape
  let far = 0, fd = 0;
  for (let i = 1; i < ring.length; i++) { const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]); if (d > fd) { fd = d; far = i; } }
  const A = rdp(ring.slice(0, far + 1), tol), B = rdp(ring.slice(far).concat([ring[0]]), tol);
  return A.slice(0, -1).concat(B.slice(0, -1));
}
export const area = pts => { let s = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(s / 2); };
export function ellipse(cx, cy, rx, ry, n = 14, rot = 0) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return out;
}
/** Pointed arch: x,y = top-left (apex at y), w wide, h tall; r = arc radius (w = equilateral). */
export function arch(x, y, w, h, r = w * 0.9, n = 12) {
  const half = w / 2, rise = Math.sqrt(r * r - (r - half) * (r - half)), ys = y + rise;
  const pts = [[x, y + h], [x, ys]];
  const aL = Math.acos((half - r) / r);
  for (let i = 1; i < n; i++) { const a = Math.PI + (aL - Math.PI) * (i / n); pts.push([x + r + Math.cos(a) * r, ys - Math.abs(Math.sin(a)) * r]); }
  pts.push([x + half, y]);
  const aR = Math.acos((r - half) / r);
  for (let i = 1; i < n; i++) { const a = aR * (1 - i / n); pts.push([x + w - r + Math.cos(a) * r, ys - Math.sin(a) * r]); }
  pts.push([x + w, ys], [x + w, y + h]);
  pts.rise = rise;
  return pts;
}
/** Quad from 4 corners with seeded tiny cut irregularity (hand-cut glass is never perfectly square). */
export const quad = (a, b, c, d) => [a, b, c, d];

/* ---------- shared defs (texture tile + gradients) ---------- */
let UID = 0;
export function makeDefs(svgRoot, L) {
  const defs = svg('defs', {}, svgRoot);
  const grads = new Map();
  // streaky antique-glass texture: drawn ONCE (seeded), then tiled — never changes per frame
  const S = 420;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const g = c.getContext('2d');
  for (let i = 0; i < 38; i++) {
    const y0 = rand(i * 7.1) * S, amp = 2 + rand(i * 3.3) * 7, ph = rand(i * 9.7) * 6.28, w = 0.6 + rand(i * 1.9) * 2.2;
    g.strokeStyle = i % 4 ? `rgba(0,0,0,${0.03 + rand(i * 2.2) * 0.06})` : `rgba(255,255,255,${0.04 + rand(i * 4.4) * 0.05})`;
    g.lineWidth = w; g.beginPath();
    for (let x = -10; x <= S + 10; x += 10) { const y = y0 + Math.sin(x / S * 6.28 * (1 + (i % 2)) + ph) * amp; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
    // wrap so the tile has no seam
    g.save(); g.translate(0, -S); g.stroke(); g.translate(0, 2 * S); g.stroke(); g.restore();
  }
  for (let i = 0; i < 46; i++) { // seed bubbles
    const x = rand(i * 5.5 + 1) * S, y = rand(i * 6.6 + 2) * S, r = 0.8 + rand(i * 7.7) * 2.2;
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(x, y, r * 1.6, r, 0, 0, 6.28); g.stroke();
  }
  const pat = svg('pattern', { id: 'sg-tex', patternUnits: 'userSpaceOnUse', width: S * L.unit * 1.2, height: S * L.unit * 1.2 }, defs);
  svg('image', { href: c.toDataURL('image/png'), width: S * L.unit * 1.2, height: S * L.unit * 1.2, preserveAspectRatio: 'none' }, pat);
  /** Uneven thickness: each colour gets 4 seeded radial gradients (thicker = darker at one edge). */
  const grad = (color, seed) => {
    const v = Math.floor(rand(seed) * 4), key = color + v;
    if (grads.has(key)) return grads.get(key);
    const id = 'sg-g' + UID++;
    const cx = 0.25 + rand(v * 3.1 + 1) * 0.5, cy = 0.2 + rand(v * 5.3 + 2) * 0.5;
    const gr = svg('radialGradient', { id, cx, cy, r: 0.85, fx: cx, fy: cy }, defs);
    svg('stop', { offset: 0, 'stop-color': shade(color, 0.3) }, gr);
    svg('stop', { offset: 0.5, 'stop-color': color }, gr);
    svg('stop', { offset: 1, 'stop-color': shade(color, -0.42) }, gr);
    grads.set(key, `url(#${id})`);
    return `url(#${id})`;
  };
  return { defs, grad, uid: () => 'sg' + UID++ };
}

/* ---------- timing ---------- */
const outCubic = p => 1 - Math.pow(1 - clamp(p), 3);
/** Light level of a piece at global time T: ignite at `at` over `dur`, optional fade to `offTo` at `off`. */
export function level(T, pc) {
  let v = pc.at == null ? 0 : outCubic((T - pc.at) / pc.dur) * pc.max;
  // a lit pane "catches": a short warm swell right after it ignites (+8 %, 10 f), never a flash
  if (pc.at != null && T > pc.at) v += 0.08 * pc.max * Math.sin(Math.PI * clamp((T - pc.at - pc.dur * 0.5) / 0.34));
  if (pc.keys) for (const [t0, t1, to] of pc.keys) { const p = clamp((T - t0) / (t1 - t0)); if (p > 0) v = v + (to - v) * outCubic(p); }
  return v;
}

/* ---------- panel ---------- */
export function makePanel(parent, D, { W, H, lw, name, x = 0, y = 0 }) {
  const g = svg('g', { 'data-name': name, transform: `translate(${x} ${y})` }, parent);
  const cid = D.uid();
  const cp = svg('clipPath', { id: cid }, D.defs); svg('rect', { width: W, height: H }, cp);
  g.setAttribute('clip-path', `url(#${cid})`);
  svg('rect', { width: W, height: H, fill: PAL.backing }, g);
  const sheenId = D.uid();
  const sheen = svg('radialGradient', { id: sheenId, gradientUnits: 'userSpaceOnUse', cx: W / 2, cy: H / 2, r: Math.max(W, H) * 0.6 }, D.defs);
  const s0 = svg('stop', { offset: 0, 'stop-color': '#fff6e0', 'stop-opacity': 0.3 }, sheen);
  const s1 = svg('stop', { offset: 0.45, 'stop-color': '#fff6e0', 'stop-opacity': 0.1 }, sheen);
  svg('stop', { offset: 1, 'stop-color': '#fff6e0', 'stop-opacity': 0 }, sheen);
  const layers = [], pieces = [];
  let seedN = 1;

  function layer(lname) {
    const lg = svg('g', { 'data-name': `${name} · ${lname}` }, g);
    const back = svg('path', { fill: PAL.backing }, lg);
    const glass = svg('g', {}, lg);
    const over = svg('g', {}, lg);
    const paint = svg('g', { 'data-name': `${name} · ${lname} paint` }, lg);
    const lead = svg('path', { fill: 'none', stroke: PAL.lead, 'stroke-width': lw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, lg);
    const leadHi = svg('path', { fill: 'none', stroke: PAL.leadHi, 'stroke-width': lw * 0.16, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-opacity': 0.35, transform: `translate(${-lw * 0.18} ${-lw * 0.2})` }, lg);
    const solder = svg('path', { fill: PAL.solder }, lg);
    const st = { backD: '', unionD: '', leadD: '', joints: new Map(), lg, glass, over, paint };
    const addLead = (a, b) => { st.leadD += `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`; };
    const addJoint = p => { const k = Math.round(p[0] / 3) + ',' + Math.round(p[1] / 3); if (!st.joints.has(k)) st.joints.set(k, p); };
    const mk = (pts, color, o, parentG) => {
      const s = o.seed ?? seedN++ * 1.37 + layers.length * 11;
      const b = bbox(pts);
      const el = svg('path', { d: o.d ?? dPoly(pts), fill: o.flat ? color : D.grad(color, s), opacity: 0.1, ...(o.name ? { 'data-name': o.name } : {}) }, parentG);
      const pc = { el, cx: b.cx, cy: b.cy, at: o.at, dur: o.dur ?? 0.28, max: o.max ?? 1, keys: o.keys, unlit: o.unlit ?? 0.1, sun: o.sun ?? 1 };
      if (o.ghost) el.setAttribute('stroke', 'none');
      pieces.push(pc);
      return pc;
    };
    const api = {
      g: lg, paint,
      /** standalone piece: own outline lead + backing */
      piece(pts, color, o = {}) {
        if (o.back !== false) { st.backD += o.d ?? dPoly(pts); st.unionD += o.d ?? dPoly(pts); }
        const pc = mk(pts, color, o, glass);
        if (o.lead !== false) { for (let i = 0; i < pts.length; i++) addLead(pts[i], pts[(i + 1) % pts.length]); if (o.joints !== false) (o.corners ?? pts.length <= 8 ? pts : []).forEach(addJoint); }
        return pc;
      },
      /** region: outline poly; `polys` (cut pieces) are clipped to it — fills by clipPath, lead by segment clipping */
      region(poly, polys, colorFn, o = {}) {
        const d = dPoly(poly);
        st.backD += d; st.unionD += d;
        const id = D.uid(); const c = svg('clipPath', { id }, D.defs); svg('path', { d }, c);
        const rg = svg('g', { 'clip-path': `url(#${id})`, 'data-name': o.name ?? 'region' }, glass);
        const b = bbox(poly);
        const out = polys.map((pts, i) => {
          const pb = bbox(pts);
          const at = o.at == null ? null : o.at + (o.sweep ? o.sweep * clamp((pb.cx - b.x) / Math.max(1, b.w)) : 0) + (o.sweepY ? o.sweepY * clamp((pb.cy - b.y) / Math.max(1, b.h)) : 0) + (o.jitter ? o.jitter * rand(i * 3.7 + b.x) : 0);
          const pc = mk(pts, typeof colorFn === 'function' ? colorFn(i, pts, pb) : colorFn, { ...o, name: undefined, at, max: typeof o.max === 'function' ? o.max(i, pb) : o.max }, rg);
          for (let k = 0; k < pts.length; k++) for (const [p, q, ja, jb] of clipSeg(pts[k], pts[(k + 1) % pts.length], poly)) { addLead(p, q); if (ja) addJoint(p); if (jb) addJoint(q); }
          (pts.corners ?? []).forEach(p => { if (pip(p, poly)) addJoint(p); });
          return pc;
        });
        if (o.outline !== false) for (let i = 0; i < poly.length; i++) addLead(poly[i], poly[(i + 1) % poly.length]);
        return out;
      },
      /** an image fired onto a pane (the real photo); dims with the pane */
      image(href, poly, o = {}) {
        const d = dPoly(poly); st.backD += d; st.unionD += d;
        const id = D.uid(); const c = svg('clipPath', { id }, D.defs); svg('path', { d }, c);
        const b = bbox(poly);
        const el = svg('image', { href, x: o.x ?? b.x, y: o.y ?? b.y, width: o.w ?? b.w, height: o.h ?? b.h, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${id})`, opacity: 0.1, style: o.filter ? `filter:${o.filter}` : '', 'data-name': o.name ?? 'image' }, glass);
        pieces.push({ el, cx: b.cx, cy: b.cy, at: o.at, dur: o.dur ?? 0.4, max: o.max ?? 1, unlit: 0.06, sun: 0.6, keys: o.keys });
        for (let i = 0; i < poly.length; i++) addLead(poly[i], poly[(i + 1) % poly.length]);
        return el;
      },
      lead: addLead, joint: addJoint,
    };
    layers.push(st);
    st.finish = () => {
      back.setAttribute('d', st.backD);
      if (layers.indexOf(st) === 0) back.remove();
      const id = D.uid(); const c = svg('clipPath', { id }, D.defs); svg('path', { d: st.unionD || 'M0 0' }, c);
      over.setAttribute('clip-path', `url(#${id})`);
      svg('rect', { width: W, height: H, fill: 'url(#sg-tex)', opacity: 0.55 }, over);
      st.sheen = svg('rect', { width: W, height: H, fill: `url(#${sheenId})` }, over);
      lead.setAttribute('d', st.leadD); leadHi.setAttribute('d', st.leadD);
      const r = lw * 0.5; let sd = '';
      for (const [x0, y0] of st.joints.values()) sd += `M${f1(x0 - r)} ${f1(y0)}a${f1(r)} ${f1(r * 0.8)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r * 0.8)} 0 1 0 ${f1(-2 * r)} 0`;
      solder.setAttribute('d', sd);
    };
    return api;
  }

  return {
    g, W, H, layer, pieces,
    finish() { layers.forEach(l => l.finish()); },
    /** sun: { x, y (panel px), color, k (sheen strength 0..1) } */
    update(T, sun) {
      const sig2 = 2 * Math.pow(Math.max(W, H) * 0.55, 2);
      let lit = 0;
      for (const pc of pieces) {
        const v = level(T, pc);
        lit += v;
        const s = Math.exp(-((pc.cx - sun.x) ** 2 + (pc.cy - sun.y) ** 2) / sig2);
        const o = pc.unlit + (1 - pc.unlit) * clamp(v) * (1 - pc.sun * 0.34 * (1 - s));
        const os = o.toFixed(3);
        if (pc._o !== os) { pc.el.setAttribute('opacity', os); pc._o = os; }
      }
      const k = clamp(lit / Math.max(1, pieces.length)) * sun.k;
      sheen.setAttribute('cx', f1(sun.x)); sheen.setAttribute('cy', f1(sun.y));
      s0.setAttribute('stop-color', sun.color); s1.setAttribute('stop-color', sun.color);
      s0.setAttribute('stop-opacity', (0.34 * k).toFixed(3)); s1.setAttribute('stop-opacity', (0.12 * k).toFixed(3));
    },
  };
}

/* ---------- pattern makers ---------- */
/** Diamond quarry lattice (two sets of diagonal leads) covering rect r; returns polys with .corners. */
export function quarries(r, size, ratio = 1.35) {
  const out = [], hw = size / 2, hh = (size * ratio) / 2;
  for (let j = -1, row = 0; r.y + j * hh <= r.y + r.h + hh; j++, row++) {
    for (let i = -1; r.x + i * size <= r.x + r.w + size; i++) {
      const cx = r.x + i * size + (j % 2 ? hw : 0), cy = r.y + j * hh;
      const p = [[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]];
      p.corners = p; out.push(p);
    }
  }
  return out;
}
/** Small-square border band (the classic glazier's border) inside rect r, band width bw. */
export function borderBand(r, bw, n) {
  const out = [];
  const seg = (x0, y0, x1, y1, horiz) => {
    const len = horiz ? x1 - x0 : y1 - y0, k = Math.max(1, Math.round(len / n));
    for (let i = 0; i < k; i++) {
      const a = x0 + (horiz ? (len * i) / k : 0), b = y0 + (horiz ? 0 : (len * i) / k);
      const p = horiz ? [[a, b], [a + len / k, b], [a + len / k, b + bw], [a, b + bw]] : [[a, b], [a + bw, b], [a + bw, b + len / k], [a, b + len / k]];
      p.corners = p; out.push(p);
    }
  };
  seg(r.x, r.y, r.x + r.w, r.y, true);
  seg(r.x, r.y + r.h - bw, r.x + r.w, r.y + r.h - bw, true);
  seg(r.x, r.y + bw, r.x, r.y + r.h - bw, false);
  seg(r.x + r.w - bw, r.y + bw, r.x + r.w - bw, r.y + r.h - bw, false);
  return out;
}
/** Water cut: rows follow gentle waves; the cuts between pieces lean (seeded) and are offset per row → T-joints,
 *  long and short pieces, never a brick grid. */
export function waterCut(r, rowH, colW, seed = 1, amp = 0.18) {
  const out = [];
  const rows = Math.ceil(r.h / rowH) + 1;
  const hk = k => rowH * (0.75 + rand(seed + k * 5.9) * 0.5);
  const ys = [r.y - rowH * 0.6]; for (let k = 0; k < rows; k++) ys.push(ys[k] + hk(k));
  const yAt = (k, x) => ys[k] + Math.sin(x / (colW * 1.1) + k * 1.9 + seed) * rowH * amp + Math.sin(x / (colW * 0.37) + k) * rowH * amp * 0.25;
  for (let k = 0; k < rows; k++) {
    let x = r.x - colW * rand(seed + k * 3.1), lean0 = 0;
    while (x < r.x + r.w + colW) {
      const w = colW * (0.45 + rand(seed + k * 7.3 + x * 0.013) * 1.25);
      const lean1 = (rand(seed + k * 11.1 + x * 0.007) - 0.5) * colW * 0.7;
      const x0 = x, x1 = x + w, n = 7;
      const top = [], bot = [];
      for (let i = 0; i <= n; i++) {
        const f = i / n, xt = x0 + lean0 * -0.5 + (w + (lean1 - lean0) * -0.5) * f, xb = x0 + lean0 * 0.5 + (w + (lean1 - lean0) * 0.5) * f;
        top.push([xt, yAt(k, xt)]); bot.push([xb, yAt(k + 1, xb)]);
      }
      const p = top.concat(bot.reverse());
      p.corners = [top[0], top[n], p[n + 1], p[p.length - 1]];
      p.row = k; out.push(p);
      x = x1; lean0 = lean1;
    }
  }
  return out;
}
/** Parallel cuts across a shape's bbox at an angle → strips (for land, bodies, plates). */
export function strips(poly, n, angle = 0.3, seed = 1) {
  const b = bbox(poly), out = [];
  const pad = Math.max(b.w, b.h);
  const ts = [0]; for (let i = 1; i < n; i++) ts.push((i + (rand(seed + i) - 0.5) * 0.5) / n); ts.push(1);
  const dx = Math.cos(angle), dy = Math.sin(angle);
  // cut lines are perpendicular to (dx,dy), positioned along the projection range
  const proj = poly.map(([x, y]) => x * dx + y * dy); const p0 = Math.min(...proj), p1 = Math.max(...proj);
  for (let i = 0; i < ts.length - 1; i++) {
    const a = p0 + (p1 - p0) * ts[i], c = p0 + (p1 - p0) * ts[i + 1];
    const pt = (s, t) => [dx * s - dy * t, dy * s + dx * t];
    const qp = [pt(a, -pad * 3 + (b.cx * -dy + b.cy * dx)), pt(c, -pad * 3 + (b.cx * -dy + b.cy * dx)), pt(c, pad * 3 + (b.cx * -dy + b.cy * dx)), pt(a, pad * 3 + (b.cx * -dy + b.cy * dx))];
    out.push(qp);
  }
  return out;
}
