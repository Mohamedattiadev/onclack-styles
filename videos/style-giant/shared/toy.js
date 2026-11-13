// GIANT FOREGROUND — shared kit: palette, gouache "painted 3D" baker, thrust projection, doodles, echo words,
// smear frame, dive-through mask, grain. Everything seeded once (never per frame) and pure of time.
import { el, svg, spring, springs, clamp } from '/onclack-styles/engine/lib/anim.js';

export const FPS = 30;
export const F = 1 / FPS;

/* ---------- palette ---------- */
// ONE flat colour world. Two candidates were tested on stills (see README): 'verdigris' won over 'cobalt'.
const FIELDS = {
  verdigris: { field: '#127463', lite: '#2A8E7B', deep: '#0B5547' },
  cobalt: { field: '#2C47B8', lite: '#4762D0', deep: '#1D3088' },
};
export const FIELD_NAME = 'verdigris';
const FD = FIELDS[FIELD_NAME];
export const C = {
  field: FD.field, fieldLite: FD.lite, fieldDeep: FD.deep,
  cream: '#F3EAD7', yellow: '#FFD43A', ink: '#141619',
  hull: '#25292D', hullLite: '#6A7680',
  steel: '#55605E', steelLite: '#A3B0A9',
  skin: '#D39468', skinLite: '#F0C49A', skinDark: '#8F5638',
  navy: '#1E2436', navyLite: '#48557A',
  boot: '#131417', bootLite: '#626A74',
  brass: '#B08B45', brassLite: '#E8C77E',
  olive: '#5E6A57', oliveLite: '#A3AF92',
  torp: '#3D4943', torpLite: '#8C9D93',
  sand: '#8C8A52', sandLite: '#C9C784',
};
export const FONT = "'Bricolage Grotesque', sans-serif";

/* ---------- small helpers ---------- */
export function rng(seed) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, p) => {
  const A = hx(a), B = hx(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(p)).toString(16).padStart(2, '0')).join('');
};
export const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
export const wordT = (ctx, w, n = 0, fb = 0) => {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = ctx.wordsIn().filter((x) => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fb;
};
/** Thrust value: from a to b on a spring released at t0 (frame 1 already moving if t0 < 0). */
export const thrust = (t, t0, a, b, cfg = springs.gentle) => a + (b - a) * spring(t - t0, cfg);
export const easeIn = (p) => p * p * p;
export const sm = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };

/* ---------- canvas + gouache painter ---------- */
export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h));
  return c;
}

/**
 * Paint a closed Path2D like a toy painted in gouache: base coat, soft form light from `light`, a dark core on the far
 * side, seeded directional brush strokes whose tone follows the form, then a soft occlusion rim inside the edge.
 * Coordinates are design units; `k` = canvas px per unit (blur sizes need it).
 */
export function paint(g, path, o) {
  const { base, seed = 1, box, k = 1, dir = -0.6, size = 1, density = 1, light = [-0.55, -0.75], rim = 1, gloss = 0, flow = 0.7 } = o;
  const lite = o.lite ?? mix(base, '#ffffff', 0.35);
  const dark = o.dark ?? mix(base, '#000000', 0.5);
  const [x, y, w, h] = box;
  const R = rng(seed);
  const cx = x + w / 2, cy = y + h / 2, rr = Math.max(w, h);
  g.save();
  g.clip(path);
  g.fillStyle = base; g.fillRect(x - 4, y - 4, w + 8, h + 8);
  let gr = g.createRadialGradient(cx + light[0] * w * 0.42, cy + light[1] * h * 0.42, 0, cx + light[0] * w * 0.3, cy + light[1] * h * 0.3, rr * 0.9);
  gr.addColorStop(0, rgba(lite, 0.9)); gr.addColorStop(0.5, rgba(lite, 0));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  gr = g.createRadialGradient(cx - light[0] * w * 0.6, cy - light[1] * h * 0.6, 0, cx - light[0] * w * 0.45, cy - light[1] * h * 0.45, rr * 0.85);
  gr.addColorStop(0, rgba(dark, 0.85)); gr.addColorStop(0.6, rgba(dark, 0));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  // brush strokes (gouache): tone follows the light, direction mostly `dir` with a hand's variation
  const n = Math.round(clamp((w * h) / (700 * size * size) * density, 30, 2600));
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const px = x + R() * w, py = y + R() * h;
    const lx = ((px - cx) / (w / 2)) * light[0] + ((py - cy) / (h / 2)) * light[1];
    const tone = clamp(0.5 + lx * 0.38 + (R() - 0.5) * 0.55);
    const col = tone > 0.5 ? mix(base, lite, (tone - 0.5) * 1.7) : mix(base, dark, (0.5 - tone) * 1.5);
    const len = (12 + R() * 30) * size, wid = (2.5 + R() * 5.5) * size, a = dir + (R() - 0.5) * flow;
    const bend = (R() - 0.5) * len * 0.5;
    const ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len;
    g.strokeStyle = rgba(col, 0.22 + R() * 0.32); g.lineWidth = wid;
    g.beginPath(); g.moveTo(px, py);
    g.quadraticCurveTo((px + ex) / 2 - Math.sin(a) * bend, (py + ey) / 2 + Math.cos(a) * bend, ex, ey);
    g.stroke();
  }
  // dry-brush flecks of the light colour on the lit side (paint catching)
  for (let i = 0; i < n * 0.08; i++) {
    const px = x + R() * w * 0.7 + (light[0] < 0 ? 0 : w * 0.3), py = y + R() * h * 0.7 + (light[1] < 0 ? 0 : h * 0.3);
    g.fillStyle = rgba(lite, 0.18 + R() * 0.25);
    g.beginPath(); g.ellipse(px, py, (1.5 + R() * 3) * size, (1 + R() * 1.6) * size, dir, 0, Math.PI * 2); g.fill();
  }
  if (gloss) {
    g.filter = `blur(${Math.max(1, rr * 0.025 * k)}px)`;
    g.strokeStyle = rgba('#ffffff', 0.35 * gloss); g.lineWidth = rr * 0.035;
    g.beginPath();
    g.ellipse(cx + light[0] * w * 0.18, cy + light[1] * h * 0.2, w * 0.3, h * 0.3, 0, Math.PI * 1.05, Math.PI * 1.45);
    g.stroke(); g.filter = 'none';
  }
  if (rim) {
    g.filter = `blur(${Math.max(1.5, Math.min(w, h) * 0.05 * k)}px)`;
    g.strokeStyle = rgba(dark, 0.6 * rim); g.lineWidth = Math.min(w, h) * 0.1;
    g.stroke(path); g.filter = 'none';
  }
  g.restore();
}

/** Soft cast/contact shadow of a path, in the field's deep colour (never default black). */
export function shade(g, path, k, { dx = 0, dy = 0, blur = 10, alpha = 0.5, col = C.fieldDeep } = {}) {
  g.save(); g.translate(dx, dy); g.filter = `blur(${blur * k}px)`; g.fillStyle = rgba(mix(col, '#000000', 0.45), alpha); g.fill(path); g.restore();
}

/** Bake: canvas of design size (dw × dh units) at resolution `res` px/unit, drawn by fn(g). */
export function bake(dw, dh, res, fn) {
  const c = canvas(dw * res, dh * res);
  const g = c.getContext('2d');
  g.setTransform(res, 0, 0, res, 0, 0);
  fn(g, res);
  return c;
}

/* ---------- placing layers ---------- */
/** A positioned canvas element: CSS size = design px (unit size), transform set per frame. */
export function layer(parent, cv, name, cssW, cssH, z = 1) {
  cv.setAttribute('data-name', name);
  Object.assign(cv.style, { position: 'absolute', left: '0', top: '0', width: cssW + 'px', height: cssH + 'px', transformOrigin: '0 0', zIndex: z, willChange: 'transform' });
  parent.appendChild(cv);
  return {
    el: cv, w: cssW, h: cssH,
    /** anchor (ax, ay as 0..1 of the layer) is put at screen (x, y), scaled by s, rotated r (deg). */
    set(x, y, s, ax = 0.5, ay = 0.5, r = 0, tilt = 0, persp = 1400, ry = 0) {
      const p3 = tilt || ry ? `perspective(${persp}px) rotateX(${tilt}deg) rotateY(${ry}deg) ` : '';
      cv.style.transform = `translate(${x}px,${y}px) ${p3}rotate(${r}deg) scale(${s}) translate(${-ax * cssW}px,${-ay * cssH}px)`;
    },
  };
}

/* ---------- field ---------- */
/** The flat colour world: base + very faint large brush strokes (fixed per scene seed). */
export function field(root, L, seed = 1) {
  const W = L.width, H = L.height, res = 0.5;
  const cv = bake(W, H, res, (g) => {
    g.fillStyle = C.field; g.fillRect(0, 0, W, H);
    const R = rng(seed * 31 + 7);
    g.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = R() * W, y = R() * H, len = 120 + R() * 260, a = -0.35 + (R() - 0.5) * 0.5;
      g.strokeStyle = rgba(R() < 0.5 ? C.fieldLite : C.fieldDeep, 0.05 + R() * 0.06);
      g.lineWidth = 30 + R() * 60;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len * 0.5, y + (R() - 0.5) * 60, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
  });
  cv.setAttribute('data-name', 'Colour field');
  Object.assign(cv.style, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px' });
  root.appendChild(cv);
  return cv;
}

/* ---------- grain (screen space, seeded per frame, ≤ 1.5 %) ---------- */
let grainURL = null;
function grainTile() {
  if (grainURL) return grainURL;
  const n = 256, c = canvas(n, n), g = c.getContext('2d');
  const img = g.createImageData(n, n), R = rng(991);
  for (let i = 0; i < n * n; i++) {
    const v = Math.round(R() * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainURL = c.toDataURL();
  return grainURL;
}
export function grain(root, L) {
  const d = el('div', { 'data-name': 'Film grain', style: { position: 'absolute', inset: '0', zIndex: 900, pointerEvents: 'none', backgroundImage: `url(${grainTile()})`, backgroundSize: `${Math.round(L.px(200))}px`, opacity: '0.07', mixBlendMode: 'overlay' } }, root);
  return (t) => {
    const f = Math.floor(t * FPS);
    const R = rng(f + 17);
    d.style.backgroundPosition = `${Math.round(R() * 256)}px ${Math.round(R() * 256)}px`;
  };
}

/* ---------- echo-stacked words ---------- */
const extrude = (u, col = C.ink, n = 7) => Array.from({ length: n }, (_, i) => `${((i + 1) * 0.011).toFixed(3)}em ${((i + 1) * 0.015).toFixed(3)}em 0 ${col}`).join(',') + `, 0.09em 0.16em ${0.12}em ${rgba('#000000', 0.25)}`;
export const toyText = (size) => ({
  position: 'absolute', fontFamily: FONT, fontWeight: 800, fontSize: size + 'px', lineHeight: 0.86, color: C.cream,
  letterSpacing: '-0.01em', whiteSpace: 'nowrap', textShadow: extrude(), fontKerning: 'normal', fontSynthesis: 'none',
  fontVariantNumeric: 'lining-nums tabular-nums',
});
/**
 * A word that appears, then 2 copies, then 3 (rhythm made visible). times = [t1, t2, t3] (one per copy).
 * Each copy lands with a small snappy push from behind (scale 1.18 → 1).
 */
export function echo(parent, text, { x, y, size, times, align = 'left', name, gap = 0.9 }) {
  const box = el('div', { 'data-name': name ?? `Echo word ${text}`, style: { position: 'absolute', left: x + 'px', top: y + 'px', zIndex: 600 } }, parent);
  const copies = times.map((at, i) => {
    const s = el('div', { 'data-name': `${name ?? text} copy ${i + 1}`, style: { ...toyText(size), top: i * size * gap + 'px', [align === 'right' ? 'right' : 'left']: '0', transformOrigin: align === 'right' ? '100% 50%' : '0 50%' } }, box, text);
    return { s, at };
  });
  return {
    box,
    update(t) {
      for (const { s, at } of copies) {
        const on = t >= at;
        s.style.visibility = on ? 'visible' : 'hidden';
        if (on) s.style.transform = `scale(${(1 + 0.18 * (1 - spring(t - at, springs.snappy))).toFixed(4)})`;
      }
    },
  };
}

/** Small label (Bricolage 500/800) — on a cream tag with an ink edge, for names and captions. */
export function tag(parent, html, { x, y, size, name, align = 'left', plate = true }) {
  const d = el('div', {
    'data-name': name, style: {
      position: 'absolute', left: x + 'px', top: y + 'px', zIndex: 650, fontFamily: FONT, fontWeight: 800, fontSize: size + 'px', lineHeight: 1.05,
      letterSpacing: '0.04em', textTransform: 'uppercase', color: plate ? C.ink : C.cream, whiteSpace: 'nowrap',
      background: plate ? C.cream : 'none', padding: plate ? '0.28em 0.5em 0.24em' : '0', borderRadius: '0.18em',
      boxShadow: plate ? `0.12em 0.16em 0 ${C.ink}` : 'none', transformOrigin: align === 'right' ? '100% 0' : '0 0',
      transform: align === 'right' ? 'translateX(-100%)' : 'none', textShadow: plate ? 'none' : `0.05em 0.07em 0 ${C.ink}`,
    },
  }, parent);
  d.innerHTML = html;
  return d;
}
/** Tag pop-in: snappy scale from 0.6 + fade over 3 frames (no fade-only entrances). */
export function popIn(node, t, at, align = 'left') {
  const on = t >= at;
  node.style.visibility = on ? 'visible' : 'hidden';
  if (!on) return;
  const s = 0.6 + 0.4 * spring(t - at, springs.snappy);
  node.style.transform = `${align === 'right' ? 'translateX(-100%) ' : ''}scale(${s.toFixed(4)})`;
}

/* ---------- yellow doodle marks (2–4 frames) ---------- */
function doodlePath(kind, r, R) {
  const P = [];
  if (kind === 'burst') {
    const n = 8 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (R() - 0.5) * 0.35, r0 = r * (0.62 + R() * 0.12), r1 = r * (0.95 + R() * 0.45), wd = 0.07 + R() * 0.05;
      const p = (rad, ang) => `${(Math.cos(ang) * rad).toFixed(1)},${(Math.sin(ang) * rad).toFixed(1)}`;
      P.push({ d: `M${p(r0, a - wd)} L${p(r1, a)} L${p(r0, a + wd)} Z`, fill: true });
    }
  } else if (kind === 'ring') {
    let d = '';
    const turns = 1.25, steps = 48, ph = R() * 6;
    for (let i = 0; i <= steps; i++) {
      const a = ph + (i / steps) * Math.PI * 2 * turns, rr = 1 + 0.07 * Math.sin(a * 2.3 + ph) + (i / steps) * 0.08;
      d += `${i ? 'L' : 'M'}${(Math.cos(a) * r * rr * 1.25).toFixed(1)},${(Math.sin(a) * r * rr * 0.82).toFixed(1)} `;
    }
    P.push({ d });
  } else if (kind === 'chevrons') {
    for (let i = 0; i < 3; i++) {
      const yy = (i - 1) * r * 0.42, ww = r * (0.55 - i * 0.08);
      P.push({ d: `M${-ww},${yy - ww * 0.45} L0,${yy + ww * 0.25} L${ww},${yy - ww * 0.45}` });
    }
  } else if (kind === 'check') {
    P.push({ d: `M${-r * 0.55},${-r * 0.02} L${-r * 0.12},${r * 0.42} L${r * 0.62},${-r * 0.6}` });
  } else if (kind === 'flat') {
    let d = `M${-r},${(R() - 0.5) * 8}`;
    for (let i = 1; i <= 10; i++) d += ` L${(-r + (i / 10) * 2 * r).toFixed(1)},${((i < 3 ? (R() - 0.5) * r * 0.5 : (R() - 0.5) * 6)).toFixed(1)}`;
    P.push({ d });
  } else if (kind === 'ticks') {
    for (let i = 0; i < 4; i++) { const xx = (i - 1.5) * r * 0.32; P.push({ d: `M${xx},${-r * 0.4} L${xx + r * 0.12},${r * 0.4}` }); }
  }
  return P;
}
export function doodleLayer(root, L) {
  const s = svg('svg', { 'data-name': 'Doodle marks (yellow)', width: L.width, height: L.height, viewBox: `0 0 ${L.width} ${L.height}`, style: `position:absolute;left:0;top:0;z-index:800;overflow:visible;pointer-events:none` }, root);
  const marks = [];
  return {
    /** kind, at (local s), frames (2–4), pos(t) → [x, y], r (px), seed */
    add(kind, at, pos, r, seed = 1, frames = 3, name) {
      const R = rng(seed * 13 + 5);
      const g = svg('g', { 'data-name': name ?? `Doodle ${kind}`, style: 'display:none' }, s);
      for (const p of doodlePath(kind, r, R)) {
        svg('path', p.fill ? { d: p.d, fill: C.yellow } : { d: p.d, fill: 'none', stroke: C.yellow, 'stroke-width': Math.max(4, L.px(9)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      }
      marks.push({ g, at, frames, pos });
    },
    update(t) {
      for (const m of marks) {
        const f = Math.floor((t - m.at) * FPS + 1e-6);
        const on = f >= 0 && f < m.frames;
        m.g.style.display = on ? '' : 'none';
        if (on) { const [x, y] = m.pos(m.at); m.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${f * 4})`); }
      }
    },
  };
}

/* ---------- 1-frame painted smear (cut) ---------- */
export function smear(root, L, seed, cols, { angle = -0.12, frames = 1 } = {}) {
  const W = L.width, H = L.height;
  const cv = bake(W, H, 0.5, (g) => {
    const R = rng(seed * 7 + 3);
    g.lineCap = 'round';
    g.fillStyle = C.field; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 170; i++) {
      const y = R() * H * 1.2 - H * 0.1, x = -W * 0.2 + R() * W * 0.6, len = W * (0.45 + R() * 0.9);
      g.strokeStyle = rgba(cols[Math.floor(R() * cols.length)], 0.45 + R() * 0.45);
      g.lineWidth = 6 + R() * 46;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + len * 0.5, y + Math.sin(angle) * len * 0.5 + (R() - 0.5) * 30, x + len, y + Math.sin(angle) * len);
      g.stroke();
    }
  });
  cv.setAttribute('data-name', 'Smear frame (cut)');
  Object.assign(cv.style, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', zIndex: 850, display: 'none' });
  root.appendChild(cv);
  return (t) => { cv.style.display = t >= 0 && t < frames * F - 1e-6 ? '' : 'none'; };
}

/* ---------- dive-through opening: the next shot opens inside a circle ---------- */
/** Applies a circular clip to `node` growing from r0 (px) at t0 to cover the frame by t1, centre (cx, cy) → frame centre. */
export function diveMask(node, L, t, t0, t1, r0, cx, cy) {
  if (t >= t1) { node.style.clipPath = 'none'; node.style.visibility = 'visible'; return; }
  if (t < t0) { node.style.visibility = 'hidden'; return; }
  node.style.visibility = 'visible';
  const p = (t - t0) / (t1 - t0);
  const e = p * p * (1.6 - 0.6 * p); // accelerating, like being pulled through
  const rMax = Math.hypot(L.width, L.height) * 0.62;
  const r = r0 + (rMax - r0) * e;
  const x = cx + (L.width / 2 - cx) * e, y = cy + (L.height / 2 - cy) * e;
  node.style.clipPath = `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
}

/* ---------- painted rising bubbles (ambient, ≤ 2 % W/s, low contrast) ---------- */
export function bubbles(parent, L, seed, n = 14, { y0 = 0.2, y1 = 1 } = {}) {
  const items = [];
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const r = L.px(4 + R() * 9);
    const d = el('div', { 'data-name': 'Bubble', style: { position: 'absolute', left: '0', top: '0', width: 2 * r + 'px', height: 2 * r + 'px', borderRadius: '50%', border: `${Math.max(2, L.px(2.5))}px solid ${rgba(C.cream, 0.35)}`, background: rgba(C.fieldLite, 0.25), zIndex: 3 } }, parent);
    items.push({ d, x: R() * L.width, y: (y0 + R() * (y1 - y0)) * L.height, v: L.px(14 + R() * 18), ph: R() * 6 });
  }
  return (t) => {
    for (const b of items) {
      let y = b.y - b.v * t;
      const span = L.height * 1.1;
      y = ((y % span) + span) % span - L.height * 0.05;
      b.d.style.transform = `translate(${(b.x + Math.sin(t * 1.3 + b.ph) * L.px(6)).toFixed(1)}px,${y.toFixed(1)}px)`;
    }
  };
}
