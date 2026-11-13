// INK WASH kit — rice paper, live brush strokes with pressure, washes, ink blooms, one vermillion seal.
// Everything is a pure function of global time T. Imperfection is seeded per object (never per frame).
import { el, svg, rand, clamp, lerp, progress, smootherstep } from '/onclack-styles/engine/lib/anim.js';

export const INK = {
  black: '#161514',   // warm lamp-black, never #000
  paper: '#F2EEE5',   // unbleached rice paper
  label: '#2B2926',   // type = slightly diluted ink
  seal: '#C0391F',    // vermillion seal paste — the ONLY colour, used once (on "no")
};
export const FONT = "'Instrument Serif', serif";

/** Start time (global s) of the nth word in paragraph `para` matching `re`. */
export function wordAt(words, para, re, nth = 0) {
  const hits = words.filter(w => w.para === para && re.test(w.word));
  return hits[Math.min(nth, hits.length - 1)]?.start ?? 0;
}

// ---------- paper ----------
/** Rice paper as a canvas (world space, moves with the camera). Fibres, mottling, tooth — seeded, drawn once. */
export function paper(parent, W, H, { seed = 11, margin = 0.22 } = {}) {
  const mx = Math.round(W * margin), my = Math.round(H * margin);
  const cw = W + 2 * mx, ch = H + 2 * my;
  const c = el('canvas', { 'data-name': 'Rice paper', width: cw, height: ch,
    style: { position: 'absolute', left: -mx + 'px', top: -my + 'px', width: cw + 'px', height: ch + 'px' } }, parent);
  const g = c.getContext('2d');
  let s = seed * 7919 + 1;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  g.fillStyle = INK.paper; g.fillRect(0, 0, cw, ch);
  // 1. cloudy formation (uneven pulp thickness): big soft light/dark blooms
  for (let i = 0; i < 60; i++) {
    const x = r() * cw, y = r() * ch, rad = (0.04 + r() * 0.16) * Math.max(cw, ch);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const c0 = i % 3 ? '253,251,246' : '196,184,160', a0 = i % 3 ? 0.18 : 0.05;
    gr.addColorStop(0, `rgba(${c0},${a0})`);
    gr.addColorStop(1, `rgba(${c0},0)`); // same colour at alpha 0 (canvas interpolates unpremultiplied)
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // 2. tooth: per-pixel luma noise ±4 (also dithers the blooms)
  const img = g.getImageData(0, 0, cw, ch), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 8; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
  g.putImageData(img, 0, 0);
  // 3. fibres: short curly dark ones, long faint ones, a few bright ones (kozo fibres catch light)
  const unit = Math.min(W, H) / 1080;
  const fibre = (len, lw, col) => {
    const x = r() * cw, y = r() * ch, a = r() * Math.PI * 2, bend = (r() - 0.5) * 0.7;
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    const cx = (x + x2) / 2 + Math.cos(a + Math.PI / 2) * len * bend * 0.5, cy = (y + y2) / 2 + Math.sin(a + Math.PI / 2) * len * bend * 0.5;
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, cy, x2, y2); g.stroke();
  };
  for (let i = 0; i < 1100; i++) fibre((5 + r() ** 2 * 34) * unit, (0.4 + r() * 0.7) * unit, `rgba(130,116,94,${0.04 + r() * 0.08})`);
  for (let i = 0; i < 220; i++) fibre((40 + r() * 160) * unit, (0.5 + r() * 0.6) * unit, `rgba(150,136,112,${0.03 + r() * 0.05})`);
  for (let i = 0; i < 260; i++) fibre((20 + r() * 70) * unit, (0.8 + r() * 1.2) * unit, `rgba(255,254,250,${0.18 + r() * 0.22})`);
  // 4. rare bark inclusions
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,78,60,${0.2 + r() * 0.3})`; g.beginPath(); g.ellipse(r() * cw, r() * ch, (0.6 + r() * 1.6) * unit, (0.4 + r()) * unit, r() * 3, 0, 7); g.fill(); }
  return c;
}

// ---------- filters ----------
/** One set of ink filters per scene SVG. Seeds are fixed → the same edge every frame. */
export function inkDefs(root, prefix, L) {
  const defs = svg('defs', {}, root);
  const id = n => `${prefix}-${n}`;
  const f = (name, inner, pad = 0.15) => {
    const fl = svg('filter', { id: id(name), x: -pad * 100 + '%', y: -pad * 100 + '%', width: (100 + 200 * pad) + '%', height: (100 + 200 * pad) + '%', 'color-interpolation-filters': 'sRGB' }, defs);
    fl.innerHTML = inner;
    return fl;
  };
  const u = L.unit;
  // ink: fine rough edge + paper-tooth speckle inside the stroke (dry paper drinks unevenly)
  f('ink', `<feTurbulence type="fractalNoise" baseFrequency="${(0.05 / u).toFixed(4)}" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${(4.5 * u).toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="${(0.55 / u).toFixed(4)}" numOctaves="1" seed="3" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.38" result="ga"/>
    <feComposite in="d" in2="ga" operator="in"/>`);
  // wash: soft, wandering edge + pigment mottling (wet ink pools and thins)
  f('wash', `<feTurbulence type="fractalNoise" baseFrequency="${(0.009 / u).toFixed(5)}" numOctaves="3" seed="21" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${(26 * u).toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${(1.6 * u).toFixed(2)}" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="${(0.006 / u).toFixed(5)} ${(0.014 / u).toFixed(5)}" numOctaves="3" seed="5" result="m"/>
    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.4" result="ma"/>
    <feComposite in="b" in2="ma" operator="in"/>`, 0.2);
  // hair: frays the flying-white streaks so they read as single hairs, not dashes
  f('hair', `<feTurbulence type="fractalNoise" baseFrequency="${(0.12 / u).toFixed(4)}" numOctaves="2" seed="41" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${(5 * u).toFixed(2)}" xChannelSelector="R" yChannelSelector="G"/>`, 0.1);
  // bleed: the feathered halo where water carries ink into the fibres
  f('bleed', `<feTurbulence type="fractalNoise" baseFrequency="${(0.08 / u).toFixed(4)}" numOctaves="2" seed="13" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${(10 * u).toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${(2.4 * u).toFixed(2)}"/>`, 0.25);
  // bloom: an ink drop spreading in wet paper — fractal tendrils
  f('bloom', `<feTurbulence type="fractalNoise" baseFrequency="${(0.03 / u).toFixed(4)}" numOctaves="3" seed="17" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${(34 * u).toFixed(2)}" xChannelSelector="R" yChannelSelector="B" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${(7 * u).toFixed(2)}"/>`, 0.6);
  // seal: uneven paste impression, crisp but broken
  f('seal', `<feTurbulence type="fractalNoise" baseFrequency="${(0.09 / u).toFixed(4)}" numOctaves="2" seed="29" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${(3.5 * u).toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="${(0.11 / u).toFixed(4)}" numOctaves="3" seed="31" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.8 1.95" result="ga"/>
    <feComposite in="d" in2="ga" operator="in"/>`);
  return { defs, id, url: n => `url(#${id(n)})` };
}

// ---------- geometry ----------
/** Catmull-Rom through the control points, resampled to n points evenly by arc length (+ unit normals). */
export function resample(pts, n = 140) {
  const dense = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 16; k++) {
      const u = k / 16, u2 = u * u, u3 = u2 * u;
      const cr = j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3);
      dense.push([cr(0), cr(1)]);
    }
  }
  dense.push(pts[pts.length - 1]);
  const cum = [0];
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const len = cum[cum.length - 1], P = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const d = (len * i) / (n - 1);
    while (j < dense.length - 2 && cum[j + 1] < d) j++;
    const k = (d - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
    P.push([lerp(dense[j][0], dense[j + 1][0], k), lerp(dense[j][1], dense[j + 1][1], k)]);
  }
  const T = P.map((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    return [dx / m, dy / m];
  });
  const N = T.map(([x, y]) => [-y, x]);
  return { P, T, N, len, n };
}

const interpKeys = (keys, s) => {
  if (typeof keys === 'number') return keys;
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (s <= keys[i][0]) {
    const k = smootherstep((s - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
    return lerp(keys[i - 1][1], keys[i][1], k);
  }
  return keys[keys.length - 1][1];
};
const f2 = v => v.toFixed(1);

/**
 * THE STROKE — one brush stroke painted live.
 * o.pts control points (world px) in painting order · o.w width keys [[s, px], …] (pressure) · o.t0, o.dur (global s)
 * o.ink opacity (wet black ≈ 0.9, pale grey ≈ 0.2) · o.dry where the brush starts to run dry (0..1; 1 = never)
 * o.bristles hair count for the dry part · o.wash true = wide graded wash (gradient along the stroke, soft edge)
 * o.rough edge irregularity (0..0.2) · o.seed · o.name (data-name)
 */
export function stroke(parent, F, o) {
  const R = resample(o.pts, o.n ?? 150);
  const { P, N, T, n } = R;
  const seed = o.seed ?? 1, dry = o.dry ?? 0.8, ink = o.ink ?? 0.9, rough = o.rough ?? 0.07;
  const W = i => interpKeys(o.w, i / (n - 1));
  // per-object edge wobble (left/right different) — the hand, not noise per frame
  const wob = side => Array.from({ length: n }, (_, i) => {
    const s = i / (n - 1);
    return 1 + rough * (Math.sin(s * 9.1 + seed * (side + 1.7)) * 0.6 + Math.sin(s * 23.7 + seed * 3.1 * (side + 1)) * 0.4);
  });
  const wl = wob(0), wr = wob(1);
  const core = s => (s < dry ? 1 : lerp(1, o.coreEnd ?? 0.8, smootherstep((s - dry) / Math.max(1e-3, 1 - dry))));

  const g = svg('g', { 'data-name': o.name ?? 'Stroke' }, parent);
  let grad = null;
  if (o.wash) {
    const gid = F.id(`grad-${seed}`);
    grad = svg('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1: P[0][0], y1: P[0][1], x2: P[n - 1][0], y2: P[n - 1][1] }, F.defs);
    const stops = o.grad ?? [1, 0.8, 0.55];
    stops.forEach((v, i) => svg('stop', { offset: i / (stops.length - 1), 'stop-color': INK.black, 'stop-opacity': (ink * v).toFixed(3) }, grad));
  }
  const halo = o.halo === false ? null : svg('path', { fill: INK.black, 'fill-opacity': (ink * (o.wash ? 0.22 : 0.12)).toFixed(3), filter: F.url('bleed') }, g);
  // the ink body is solid inside a group with the ink opacity → overlaps never darken (one wet layer, like real ink)
  const ig = svg('g', { opacity: o.wash ? 1 : ink }, g);
  // dry brush = "flying white": paper-coloured streaks where single hairs run out of ink. They are a fixed mask
  // (built once, seeded); the stroke reveals them as the brush passes. More and wider streaks towards the lift.
  let maskUrl = null;
  if (dry < 1) {
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]), mw = Math.max(...(typeof o.w === 'number' ? [o.w] : o.w.map(k => k[1])));
    const bx = Math.min(...xs) - mw * 2, by = Math.min(...ys) - mw * 2, bw = Math.max(...xs) - bx + mw * 2, bh = Math.max(...ys) - by + mw * 2;
    const mid = F.id(`dry-${seed}`);
    const mk = svg('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: f2(bx), y: f2(by), width: f2(bw), height: f2(bh) }, F.defs);
    svg('rect', { x: f2(bx), y: f2(by), width: f2(bw), height: f2(bh), fill: '#fff' }, mk);
    const nb = Math.round((o.bristles ?? 14) * 1.6);
    const classes = [0.22, 0.42, 0.75].map(m => ({ m, d: '' }));
    for (let b = 0; b < nb; b++) {
      const r1 = rand(seed * 31 + b * 7.3), r2 = rand(seed * 17 + b * 3.1);
      const off = -0.5 + (b + 0.2 + 0.6 * r1) / nb;            // lanes, unevenly spaced
      const cls = classes[Math.floor(r2 * 2.999)];
      const edge = Math.abs(off) > 0.36 ? 0.12 : 0;            // outer hairs dry first → ragged edge
      let s = dry + (1 - dry) * (0.05 + 0.35 * rand(seed * 7 + b)) - edge, on = false, k = 0;
      while (s < 1.02) {
        const rr = rand(seed * 101 + b * 13.7 + k * 1.31), wet = clamp((s - dry) / Math.max(1e-3, 1 - dry));
        const len = on ? 0.05 + 0.3 * rr * (0.4 + wet) : 0.02 + 0.16 * rr * (1.2 - wet);
        if (on && s < 1) {
          const a = clamp(s), e = Math.min(1, s + len), i0 = a * (n - 1), i1 = e * (n - 1), steps = Math.max(1, Math.ceil(i1 - i0));
          for (let j = 0; j <= steps; j++) {
            const ii = i0 + ((i1 - i0) * j) / steps, ia = Math.floor(ii), w0 = W(ia) * core(ii / (n - 1));
            cls.d += `${j ? 'L' : 'M'}${f2(P[ia][0] + N[ia][0] * off * w0)},${f2(P[ia][1] + N[ia][1] * off * w0)}`;
          }
        }
        s += len; on = !on; k++;
      }
    }
    const hw = (mw / nb) * (o.hairW ?? 1);
    const hg = svg('g', { filter: F.url('hair') }, mk);
    for (const c of classes) if (c.d) svg('path', { d: c.d, fill: 'none', stroke: '#000', 'stroke-width': f2(hw * c.m), 'stroke-linecap': 'round' }, hg);
    maskUrl = `url(#${mid})`;
  }
  const body = svg('path', { fill: o.wash ? `url(#${F.id(`grad-${seed}`)})` : INK.black, filter: F.url(o.wash ? 'wash' : 'ink') }, ig);
  if (maskUrl) body.setAttribute('mask', maskUrl);
  const rim = o.wash ? svg('path', { fill: 'none', stroke: INK.black, 'stroke-opacity': (ink * 0.45).toFixed(3), 'stroke-width': f2(1.4 * (o.unit ?? 1)), filter: F.url('wash') }, g) : null;
  const hairs = null, segs = [];

  const at = (i, k) => { // point + normal + width at fractional index
    const a = Math.floor(i), b = Math.min(n - 1, a + 1), f = i - a;
    return { p: [lerp(P[a][0], P[b][0], f), lerp(P[a][1], P[b][1], f)], nn: [lerp(N[a][0], N[b][0], f), lerp(N[a][1], N[b][1], f)], t: [lerp(T[a][0], T[b][0], f), lerp(T[a][1], T[b][1], f)], w: lerp(W(a), W(b), f), wl: lerp(wl[a], wl[b], f), wr: lerp(wr[a], wr[b], f) };
  };
  function outline(q, extra) {
    const m = q * (n - 1), im = Math.floor(m), idx = [];
    for (let i = 0; i <= im; i++) idx.push(i);
    if (m - im > 1e-4) idx.push(m);
    if (idx.length < 2) idx.push(Math.min(n - 1, m + 0.5));
    const Lp = [], Rp = [];
    let last;
    for (const i of idx) {
      const s = i / (n - 1), A = at(i), h = (A.w * core(s)) / 2;
      Lp.push([A.p[0] + A.nn[0] * (h * A.wl + extra), A.p[1] + A.nn[1] * (h * A.wl + extra)]);
      Rp.push([A.p[0] - A.nn[0] * (h * A.wr + extra), A.p[1] - A.nn[1] * (h * A.wr + extra)]);
      last = { A, h: h + extra };
    }
    const f0 = at(0), h0 = (f0.w * core(0)) / 2 + extra;
    let d = `M${f2(Rp[0][0])},${f2(Rp[0][1])}`;
    // rounded entry (the press of the tip) — back half-circle
    for (let k = 1; k < 8; k++) { const a = (k / 8) * Math.PI; d += `L${f2(f0.p[0] - f0.nn[0] * h0 * Math.cos(a) - f0.t[0] * h0 * Math.sin(a) * 0.8)},${f2(f0.p[1] - f0.nn[1] * h0 * Math.cos(a) - f0.t[1] * h0 * Math.sin(a) * 0.8)}`; }
    for (const p of Lp) d += `L${f2(p[0])},${f2(p[1])}`;
    // the moving brush head — front half-circle
    const { A, h } = last;
    for (let k = 1; k < 8; k++) { const a = (k / 8) * Math.PI; d += `L${f2(A.p[0] + A.nn[0] * h * Math.cos(a) + A.t[0] * h * Math.sin(a) * 0.7)},${f2(A.p[1] + A.nn[1] * h * Math.cos(a) + A.t[1] * h * Math.sin(a) * 0.7)}`; }
    for (let i = Rp.length - 1; i >= 0; i--) d += `L${f2(Rp[i][0])},${f2(Rp[i][1])}`;
    return d + 'Z';
  }
  const t1 = o.t0 + o.dur;
  // brush speed: a short press, a fast middle, a slower lift
  const qOf = T => { const p = progress(T, o.t0, t1); return p <= 0 ? 0 : Math.pow(smootherstep(p * 0.92 + 0.08 * p * p), 0.85); };
  let lastQ = -1;
  return {
    R, g, t0: o.t0, t1,
    point: s => at(clamp(s) * (n - 1)).p,
    update(T) {
      if (T < o.t0) { g.style.display = 'none'; return; }
      g.style.display = '';
      const q = qOf(T);
      const bleed = (o.bleed ?? 4) * (o.unit ?? 1) * smootherstep(progress(T, o.t0, t1 + 1.4));
      if (halo) halo.setAttribute('d', outline(Math.max(q, 0.01), bleed + (o.unit ?? 1) * 1.5));
      if (q !== lastQ) {
        body.setAttribute('d', outline(Math.max(q, 0.01), 0));
        if (rim) rim.setAttribute('d', outline(Math.max(q, 0.01), 0));
        if (hairs) {
          let d = '';
          for (const sg of segs) {
            if (sg.a >= q) continue;
            const e = Math.min(sg.b, q), i0 = sg.a * (n - 1), i1 = e * (n - 1);
            const steps = Math.max(1, Math.ceil(i1 - i0));
            for (let k = 0; k <= steps; k++) {
              const i = i0 + ((i1 - i0) * k) / steps, A = at(i), off = sg.off * A.w * 0.98;
              d += `${k ? 'L' : 'M'}${f2(A.p[0] + A.nn[0] * off)},${f2(A.p[1] + A.nn[1] * off)}`;
            }
          }
          hairs.setAttribute('d', d);
        }
        lastQ = q;
      }
    },
  };
}

/** An ink drop that falls as a thin live trail and then blooms in the wet wash (depth charge). */
export function bloom(parent, F, { at: [x, y], from, t0, fall = 0.42, R = 60, seed = 1, unit = 1, name = 'Ink bloom' }) {
  const g = svg('g', { 'data-name': name }, parent);
  // the fall: a few ink specks dripping down from the ship, one after another (no line — a line reads as a fishing line)
  const specks = [0.18, 0.4, 0.62, 0.82].map((f, i) => svg('ellipse', {
    cx: f2(lerp(from[0], x, f) + (rand(seed + i * 3) - 0.5) * 6 * unit), cy: f2(lerp(from[1], y, f)),
    rx: f2((2.2 + rand(seed + i) * 1.6) * unit), ry: f2((3 + rand(seed + i + 4) * 2) * unit), fill: INK.black, 'fill-opacity': 0.5, filter: F.url('ink'), style: 'display:none' }, g));
  const b = svg('g', { filter: F.url('bloom') }, g);
  const ks = [0.16, 0.42, 0.72, 1], ops = [0.9, 0.45, 0.2, 0.09];
  const rings = ks.map((k, i) => svg('circle', { cx: f2(x + (rand(seed + i) - 0.5) * R * 0.22 * k), cy: f2(y + (rand(seed + i + 9) - 0.5) * R * 0.18 * k), r: 1, fill: INK.black }, b));
  const tb = t0 + fall;
  return {
    update(T) {
      if (T < t0) { g.style.display = 'none'; return; }
      g.style.display = '';
      specks.forEach((sp, i) => { const ti = t0 + fall * [0.18, 0.4, 0.62, 0.82][i]; sp.style.display = T >= ti ? '' : 'none'; sp.setAttribute('fill-opacity', (0.5 * Math.exp(-Math.max(0, T - ti) / 3)).toFixed(3)); });
      if (T < tb) { b.style.display = 'none'; return; }
      b.style.display = '';
      const dt = T - tb, gr = 1 - Math.exp(-dt / 0.5);       // fast spread, slow settle (diffusion)
      const thin = 1 / (1 + 0.9 * gr + 0.12 * dt);          // the same ink over a larger area = paler
      rings.forEach((c, i) => {
        c.setAttribute('r', f2(Math.max(1, R * ks[i] * (0.12 + 0.88 * gr))));
        c.setAttribute('fill-opacity', (ops[i] * (i ? thin : 1 / (1 + 0.25 * dt))).toFixed(3));
      });
    },
  };
}

/** Small calm label in screen space, written in left→right by a soft ink mask (never a fade). */
export function label(parent, text, { size = 44, italic = false, color = INK.label, name, align = 'left', unit = 1, ls = 0.01 } = {}) {
  const e = el('div', { 'data-name': name ?? text, style: {
    position: 'absolute', left: '0px', top: '0px', whiteSpace: 'nowrap', fontFamily: FONT, fontStyle: italic ? 'italic' : 'normal',
    fontSize: (size * unit).toFixed(1) + 'px', lineHeight: 1.1, color, letterSpacing: ls + 'em', fontKerning: 'normal',
    fontVariantNumeric: 'oldstyle-nums proportional-nums', display: 'none',
  } }, parent);
  e.innerHTML = text;
  let w = 0;
  return {
    el: e,
    /** x,y = anchor in screen px; reveal 0..1 */
    set(x, y, reveal) {
      if (reveal <= 0) { e.style.display = 'none'; return; }
      e.style.display = '';
      if (!w) w = e.offsetWidth;
      const ax = align === 'right' ? w : align === 'center' ? w / 2 : 0;
      e.style.transform = `translate(${Math.round(x - ax)}px, ${Math.round(y)}px)`;
      if (reveal >= 1) { e.style.webkitMaskImage = e.style.maskImage = ''; return; }
      const p = (reveal * 115).toFixed(1);
      const m = `linear-gradient(90deg, #000 ${p - 15}%, transparent ${p}%)`;
      e.style.webkitMaskImage = e.style.maskImage = m;
    },
  };
}
/** Reveal for a label written over `dur` seconds starting at t0 (ease-out, like a pen slowing). */
export const writeIn = (T, t0, dur = 0.45) => { const p = progress(T, t0, t0 + dur); return p <= 0 ? 0 : 1 - (1 - p) ** 2; };

/** Seal impression "НЕТ" (Russian: no), hand-cut white letters on vermillion. Built from bars — no font needed. */
export function seal(parent, F, { x, y, S, rot = -2.5, seed = 5, name = 'Seal НЕТ (no)' }) {
  const w = S * 1.86, h = S, m = S * 0.15, gap = S * 0.12, bt = S * 0.155;
  const lw = (w - 2 * m - 2 * gap) / 3, lh = h - 2 * m;
  const g = svg('g', { 'data-name': name, transform: `translate(${f2(x)},${f2(y)}) rotate(${rot}) translate(${f2(-w / 2)},${f2(-h / 2)})`, style: 'mix-blend-mode:multiply' }, parent);
  const mid = F.id(`sealmask-${seed}`);
  const mask = svg('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -S, y: -S, width: w + 2 * S, height: h + 2 * S }, F.defs);
  svg('rect', { x: -S, y: -S, width: w + 2 * S, height: h + 2 * S, fill: '#fff' }, mask);
  let k = 0;
  const bar = (lx, bx, by, bw, bh) => { // hand-cut: each bar a little uneven
    const j = () => (rand(seed * 13 + k++ * 2.7) - 0.5) * bt * 0.18;
    svg('polygon', { points: [[bx + j(), by + j()], [bx + bw + j(), by + j()], [bx + bw + j(), by + bh + j()], [bx + j(), by + bh + j()]].map(p => `${f2(m + lx + p[0])},${f2(m + p[1])}`).join(' '), fill: '#000' }, mask);
  };
  const L0 = 0, L1 = lw + gap, L2 = 2 * (lw + gap);
  bar(L0, 0, 0, bt, lh); bar(L0, lw - bt, 0, bt, lh); bar(L0, 0, lh / 2 - bt / 2, lw, bt);                       // Н
  bar(L1, 0, 0, bt, lh); bar(L1, 0, 0, lw, bt); bar(L1, 0, lh / 2 - bt / 2, lw * 0.82, bt); bar(L1, 0, lh - bt, lw, bt); // Е
  bar(L2, 0, 0, lw, bt); bar(L2, lw / 2 - bt / 2, 0, bt, lh);                                                    // Т
  const inner = svg('g', { filter: F.url('seal') }, g);
  svg('rect', { x: 0, y: 0, width: f2(w), height: f2(h), rx: f2(S * 0.03), fill: INK.seal, mask: `url(#${mid})` }, inner);
  return { g, w, h };
}
