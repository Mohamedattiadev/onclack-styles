// LANTERN SLIDE — "a lecture in the dark". Shared kit: palette, the projector (hall, screen, beam, lamp, lens),
// glass slides (mask, binding tape, thumb spot, dust, hair), hand-laid aniline tints, hand lettering,
// the lecturer's pointer shadow and cover card, and the signature "slide change" (push-pull carrier).
// Everything is a pure function of time. Imperfection is seeded ONCE per object (never per frame), except the
// ±1 code-value dither, which is screen-space and seeded by frame number.
import { el, rand, noise1, clamp, progress } from '/onclack-styles/engine/lib/anim.js';

export const F = 1 / 30;

/* ---------- palette (tokens only) ---------- */
export const PAL = {
  hall: '#0E0C0A',        // dark base (RGB 14,12,10 — never #000)
  screen: '#1D1915',      // unlit screen fabric, lit only by spill
  lamp: '#F6E8C8',        // warm lamp light (multiplied over the glass)
  glass: '#FFFFFF',       // clear glass before the lamp colour
  ink: '#17110B',         // lettering + line drawing on glass
  inkSoft: '#3A2E22',     // pencil on the paper mask
  mask: '#8C6C48',        // translucent paper mask, as projected
  tape: '#1E160F',        // black paper binding tape, as projected
  label: '#C9AE84',       // gummed paper label / thumb spot, as projected
  blue: '#7FA9C9',        // aniline blue wash (multiply)
  amber: '#E7B062',       // aniline amber wash (multiply)
  carmine: '#C2493F',     // carmine wash — kept for the peak only
};
export const FONT = {
  glass: "'Instrument Serif', serif",   // pen lettering on the glass
  hand: "'Shantell Sans', sans-serif",  // pencil on the paper mask
};

/* ---------- easing ---------- */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let lo = 0, hi = 1, s = p;
    for (let i = 0; i < 24; i++) { const x = X(s); if (Math.abs(x - p) < 1e-5) break; if (x < p) lo = s; else hi = s; s = (lo + hi) / 2; }
    return Y(s);
  };
}
export const ez = {
  enter: bezier(0.16, 1, 0.3, 1),
  exit: bezier(0.7, 0, 0.84, 0),
  move: bezier(0.65, 0, 0.35, 1),
  camera: bezier(0.45, 0, 0.15, 1),
  hand: bezier(0.4, 0, 0.2, 1),
};
export const tw = (t, a, b, from, to, e = ez.enter) => from + (to - from) * e(progress(t, a, b));

/* ---------- words ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Local scene time of the nth spoken word `w`. Visuals land 0–3 f before their word. */
export function wordT(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.wordsIn().filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fallback;
}

/* ---------- geometry: where the beam lands ---------- */
export function geom(L) {
  if (L.landscape) {
    const h = L.px(930), w = Math.round(h * 1.36);
    const cx = L.width / 2, cy = L.height / 2;
    return { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h: Math.round(h), cx, cy };
  }
  const w = L.px(870), h = Math.round(w * 1.5);
  const cx = L.safe.cx, cy = L.safe.y + L.safe.h * 0.5;
  return { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.round(w), h, cx, cy };
}

/* ---------- small canvas helpers ---------- */
export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
/** A wobbly closed polygon around a rounded rect / dome — the hand-cut edge of a paper mask. */
export function maskPath(r, shape, seed, wob) {
  const pts = [], N = 220;
  const { x, y, w, h } = r;
  const rad = shape === 'round' ? Math.min(w, h) * 0.07 : shape === 'oval' ? 0 : Math.min(w, h) * 0.035;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    let px, py;
    if (shape === 'oval') {
      px = x + w / 2 + Math.cos(a) * w / 2; py = y + h / 2 + Math.sin(a) * h / 2;
    } else {
      // superellipse-ish rounded rect by angle walk (good enough for a mask cut)
      const c = Math.cos(a), s = Math.sin(a);
      const n = shape === 'dome' && s < 0 ? 2.6 : 9;      // dome = soft round top
      const k = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n);
      px = x + w / 2 + c * k * w / 2; py = y + h / 2 + s * k * h / 2;
      if (shape !== 'dome' || s >= 0) { /* corners already softened by n */ }
      void rad;
    }
    const j = (noise1(i * 0.21, seed) * 0.6 + (rand(seed * 31 + i) - 0.5) * 0.4) * wob;
    pts.push([px + Math.cos(a) * j, py + Math.sin(a) * j]);
  }
  const p = new Path2D();
  pts.forEach(([px, py], i) => (i ? p.lineTo(px, py) : p.moveTo(px, py)));
  p.closePath();
  return p;
}

/** Paper fibre mottling (static, seeded). */
function mottle(g, w, h, seed, amount, n = 900) {
  for (let i = 0; i < n; i++) {
    const x = rand(seed + i * 3.1) * w, y = rand(seed + i * 7.7) * h;
    const len = 4 + rand(seed + i * 1.3) * 22, a = rand(seed + i * 9.9) * Math.PI;
    g.strokeStyle = rand(seed + i * 5.5) < 0.5 ? `rgba(0,0,0,${amount})` : `rgba(255,240,210,${amount * 0.8})`;
    g.lineWidth = 1 + rand(seed + i) * 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
  }
}

/**
 * Hand-laid aniline wash, multiplied onto `g`. `region(gg)` must build the path (call gg.beginPath() + shapes).
 * Brushed in streaks along `angle`, three slightly offset passes (soft, uneven edge), a darker dried rim,
 * and optional `keepOut(gg)` drawn as an uneven gap (the tinter stops short of a line or a hull).
 */
export function wash(g, W, H, region, color, seed, { alpha = 0.85, angle = -0.2, rim = 0.22, keepOut = null, gap = 4, streak = 0.1, rule = 'nonzero' } = {}) {
  const c = canvas(W, H), t = c.getContext('2d');
  t.fillStyle = color;
  for (let k = 0; k < 3; k++) {
    t.save();
    t.translate((rand(seed + k * 3) - 0.5) * gap * 1.4, (rand(seed + k * 5) - 0.5) * gap * 1.4);
    t.globalAlpha = alpha / 2.2;
    region(t); t.fill(rule);
    t.restore();
  }
  // brush streaks (density variation along the stroke direction)
  t.save();
  region(t); t.clip(rule);
  const len = Math.hypot(W, H);
  for (let i = 0; i < 70; i++) {
    const off = (rand(seed * 7 + i) - 0.5) * len;
    const wid = 6 + rand(seed * 3 + i) * 28;
    t.globalAlpha = streak * (0.3 + rand(seed + i * 11) * 0.7);
    t.strokeStyle = rand(seed + i * 2) < 0.8 ? color : '#ffffff';
    t.lineWidth = wid;
    t.beginPath();
    const cx = W / 2 + Math.sin(angle) * off, cy = H / 2 + Math.cos(angle) * off;
    t.moveTo(cx - Math.cos(angle) * len, cy + Math.sin(angle) * len);
    t.lineTo(cx + Math.cos(angle) * len, cy - Math.sin(angle) * len);
    t.stroke();
  }
  t.restore();
  // dried rim: aniline pools at the edge of the wash
  if (rim > 0) {
    t.save();
    t.strokeStyle = color; region(t);
    t.globalAlpha = rim * 0.5; t.lineWidth = 4.5; t.stroke();
    t.globalAlpha = rim * 0.7; t.lineWidth = 2; t.stroke();
    t.restore();
  }
  if (keepOut) {
    t.save(); t.globalCompositeOperation = 'destination-out';
    keepOut(t);
    t.restore();
  }
  g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(c, 0, 0); g.restore();
}

/** An irregular brush-laid blob (for washes): ellipse with seeded lumpy edge. Adds to the current path. */
export function blob(t, cx, cy, rx, ry, seed, rot = 0) {
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = (i % N) / N * Math.PI * 2;
    const k = 1 + 0.07 * noise1(i * 0.55, seed) + 0.03 * (rand(seed + (i % N)) - 0.5);
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    const X = cx + x * Math.cos(rot) - y * Math.sin(rot), Y = cy + x * Math.sin(rot) + y * Math.cos(rot);
    i ? t.lineTo(X, Y) : t.moveTo(X, Y);
  }
  t.closePath();
}

/** Emulsion grain + dust + hair + one scratch on a glass slide (static, seeded). */
export function glassDirt(g, w, h, seed, win) {
  // emulsion grain inside the picture window only
  if (win) {
    g.save(); g.clip(win);
    for (let i = 0; i < w * h / 160; i++) {
      const x = rand(seed + i * 1.37) * w, y = rand(seed + i * 2.71) * h;
      g.fillStyle = rand(seed + i * 4.1) < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
      g.fillRect(x, y, 1.6, 1.6);
    }
    // one fine scratch in the emulsion (lets light through: bright line)
    g.strokeStyle = 'rgba(255,250,235,0.55)'; g.lineWidth = 1;
    const sx = w * (0.2 + rand(seed + 1) * 0.5), sy = h * (0.15 + rand(seed + 2) * 0.3);
    g.beginPath(); g.moveTo(sx, sy);
    g.bezierCurveTo(sx + w * 0.03, sy + h * 0.04, sx + w * 0.01, sy + h * 0.1, sx + w * 0.04, sy + h * 0.15); g.stroke();
    g.restore();
  }
  // dust on the cover glass: specks, some slightly out of focus
  for (let i = 0; i < 46; i++) {
    const x = rand(seed * 3 + i * 1.9) * w, y = rand(seed * 5 + i * 2.3) * h;
    const r = 0.6 + Math.pow(rand(seed + i * 6.1), 3) * 3.2;
    const soft = rand(seed + i * 8.3) < 0.3;
    g.save();
    if (soft) {
      const R = r + 2.2, gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, 'rgba(20,14,8,0.32)'); gr.addColorStop(1, 'rgba(20,14,8,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
    } else {
      g.fillStyle = `rgba(20,14,8,${0.55 + rand(seed + i) * 0.35})`;
      g.beginPath(); g.ellipse(x, y, r, r * (0.6 + rand(seed + i * 2) * 0.4), rand(seed + i * 3) * 3, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  // two hairs / fibres lying on the glass
  for (let k = 0; k < 1; k++) {
    // lies near the mask edge, where a hair caught under the cover glass usually ends up
    const x = w * (0.035 + rand(seed + 40 + k) * 0.02), y = h * (0.3 + rand(seed + 50 + k) * 0.4);
    const s = Math.min(w, h) * (0.025 + rand(seed + 60 + k) * 0.02);
    g.save(); g.strokeStyle = 'rgba(18,12,8,0.62)'; g.lineWidth = 1.3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y);
    g.bezierCurveTo(x + s * 0.6, y - s * 0.5, x + s * 0.2, y + s * 0.9, x + s * 1.1, y + s * 0.4);
    g.bezierCurveTo(x + s * 1.6, y + s * 0.1, x + s * 1.3, y + s * 0.9, x + s * 1.9, y + s * 1.1);
    g.stroke(); g.restore();
  }
}

/* ---------- hand lettering (DOM, so the studio can select it) ---------- */
/**
 * Pen lettering: each letter gets a fixed (seeded) tilt, baseline shift and size change — the same letter is never
 * identical twice, but nothing moves between frames.
 */
export function letter(parent, text, { name, x, y, size, font = FONT.glass, color = PAL.ink, seed = 1, italic = false,
  weight = 400, align = 'left', width = null, track = 0, jitter = 1, lineHeight = 1.05, style = {} }) {
  const box = el('div', {
    'data-name': name,
    style: {
      position: 'absolute', left: x + 'px', top: y + 'px', width: width ? width + 'px' : 'auto',
      fontFamily: font, fontSize: size + 'px', fontWeight: weight, fontStyle: italic ? 'italic' : 'normal',
      color, lineHeight, letterSpacing: track + 'em', textAlign: align, whiteSpace: 'pre-wrap',
      fontKerning: 'normal', fontSynthesis: 'none', ...style,
    },
  }, parent);
  [...text].forEach((ch, i) => {
    if (ch === ' ' || ch === '\n') { box.appendChild(document.createTextNode(ch)); return; }
    const r1 = rand(seed * 13 + i * 1.7) - 0.5, r2 = rand(seed * 17 + i * 2.9) - 0.5, r3 = rand(seed * 19 + i * 3.3) - 0.5;
    el('span', {
      style: {
        display: 'inline-block',
        transform: `translateY(${(r1 * 0.05 * jitter).toFixed(3)}em) rotate(${(r2 * 2.4 * jitter).toFixed(2)}deg) scale(${(1 + r3 * 0.05 * jitter).toFixed(3)})`,
        opacity: (0.88 + rand(seed + i * 5.1) * 0.12).toFixed(2), // pen pressure: ink density varies per letter
      },
    }, box, ch);
  });
  return box;
}

/* ---------- a glass slide ---------- */
const CACHE = new Map();   // painted pictures, shared between scenes (a slide appears in two scenes: as itself and as 'previous')
/**
 * Builds one slide (w×h, frame px): translucent paper mask, black binding tape, a gummed number label, a thumb spot,
 * picture window(s) cut by hand, `paint(g, wins)` for the picture, then emulsion grain, dust and hair.
 * Returns { el, wins, canvas }. Text goes on top as DOM (`letter`).
 */
export function makeSlide(parent, L, { w, h, seed, name, num, catalogue, windows, paint }) {
  const box = el('div', { 'data-name': name, style: { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px' } }, parent);
  const c = canvas(w, h), g = c.getContext('2d');
  c.setAttribute('data-name', name + ' — glass');
  Object.assign(c.style, { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px' });
  box.appendChild(c);
  const u = Math.min(w, h);
  // paper mask
  g.fillStyle = PAL.mask; g.fillRect(0, 0, w, h);
  mottle(g, w, h, seed + 100, 0.07, 1400);
  // window(s): rect in px from fractions
  const wins = windows.map((wd, i) => {
    const r = { x: wd.x * w, y: wd.y * h, w: wd.w * w, h: wd.h * h };
    return { ...r, shape: wd.shape ?? 'rect', path: maskPath(r, wd.shape ?? 'rect', seed + i * 9, Math.max(0.8, u * 0.0016)) };
  });
  const all = new Path2D(); wins.forEach(wi => all.addPath(wi.path));
  // a faint shadow line where the mask's cut edge lifts off the glass
  g.save(); g.strokeStyle = 'rgba(30,20,12,0.3)'; g.lineWidth = 3.4; g.stroke(all); g.strokeStyle = 'rgba(30,20,12,0.4)'; g.lineWidth = 1.6; g.stroke(all); g.restore();
  g.save(); g.clip(all);
  g.fillStyle = PAL.glass; g.fillRect(0, 0, w, h);
  const key = name + '|' + w + 'x' + h, hit = CACHE.get(key);
  if (hit) g.drawImage(hit, 0, 0);
  else { paint(g, wins); const cc = canvas(w, h); cc.getContext('2d').drawImage(c, 0, 0); CACHE.set(key, cc); }
  g.restore();
  // binding tape: four strips, uneven inner edge, darker where they overlap at the corners
  const bw = u * 0.034;
  const strip = (x0, y0, x1, y1, horiz, s) => {
    const p = new Path2D();
    const n = 40;
    if (horiz) {
      const inner = y0 === 0 ? bw : h - bw;
      p.moveTo(x0, y0 === 0 ? -2 : h + 2);
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; p.lineTo(x, inner + (rand(s + i) - 0.5) * u * 0.004 + noise1(i * 0.3, s) * u * 0.003); }
      p.lineTo(x1, y0 === 0 ? -2 : h + 2);
    } else {
      const inner = x0 === 0 ? bw : w - bw;
      p.moveTo(x0 === 0 ? -2 : w + 2, y0);
      for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; p.lineTo(inner + (rand(s + i) - 0.5) * u * 0.004 + noise1(i * 0.3, s) * u * 0.003, y); }
      p.lineTo(x0 === 0 ? -2 : w + 2, y1);
    }
    p.closePath();
    return p;
  };
  g.fillStyle = 'rgba(30,22,15,0.93)';
  [strip(-2, 0, w + 2, 0, true, seed + 1), strip(-2, h, w + 2, h, true, seed + 2), strip(0, -2, 0, h + 2, false, seed + 3), strip(w, -2, w, h + 2, false, seed + 4)]
    .forEach(p => g.fill(p));
  // gummed label (top-left, over tape and mask) and the thumb spot (bottom-left) — translucent paper, brighter
  const lab = { x: bw * 0.95, y: bw * 0.55, w: u * 0.16, h: u * 0.085 };
  g.save(); g.translate(lab.x + lab.w / 2, lab.y + lab.h / 2); g.rotate((rand(seed + 7) - 0.5) * 0.06);
  g.fillStyle = PAL.label; g.fillRect(-lab.w / 2, -lab.h / 2, lab.w, lab.h);
  g.strokeStyle = 'rgba(60,40,20,0.35)'; g.lineWidth = 1.5; g.strokeRect(-lab.w / 2 + 4, -lab.h / 2 + 4, lab.w - 8, lab.h - 8);
  g.restore();
  const ts = { x: bw * 2.1, y: h - bw * 2.1 };
  g.fillStyle = PAL.label; g.beginPath(); g.arc(ts.x, ts.y, u * 0.017, 0, Math.PI * 2); g.fill();
  mottle(g, w, h, seed + 300, 0.03, 300);
  glassDirt(g, w, h, seed + 500, all);

  // slide number on the label, catalogue line in pencil on the bottom mask
  letter(box, num, { name: name + ' — number label', x: lab.x, y: lab.y + lab.h * 0.08, width: lab.w, align: 'center', size: lab.h * 0.62, font: FONT.hand, color: PAL.inkSoft, seed: seed + 11, weight: 500 });
  if (catalogue) {
    const maskBottom = Math.max(...wins.map(wi => wi.y + wi.h));
    const room = h - bw - maskBottom;
    letter(box, catalogue, { name: name + ' — catalogue pencil', x: w * 0.5, y: maskBottom + room * 0.18, size: Math.min(room * 0.5, u * 0.036), font: FONT.hand, color: PAL.inkSoft, seed: seed + 12, weight: 500, style: { transform: 'translateX(-50%)', whiteSpace: 'nowrap' } });
  }
  return { el: box, wins, canvas: c, bw };
}

/* ---------- the projector: hall, screen, beam, lamp, lens ---------- */
let uid = 0;
export function projector(root, ctx, { seed = 1, screen = true, offset = [0, 0], spot = [50, 47] } = {}) {
  const L = ctx.layout, G = geom(L), id = 'lan' + (++uid) + Math.round(rand(seed) * 1e5);
  if (screen) root.style.background = PAL.hall;
  const cam = el('div', { 'data-name': 'Hall (camera)', style: { position: 'absolute', inset: 0, transformOrigin: `${G.cx}px ${G.cy}px` } }, root);

  // unlit screen around the beam: spill light, a soft hem at the bottom where the roller sits
  const sx = G.w * 0.16, sy = G.h * 0.07;
  if (screen) el('div', {
    'data-name': 'Screen fabric',
    style: {
      position: 'absolute', left: G.x - sx + 'px', top: G.y - sy + 'px', width: G.w + 2 * sx + 'px', height: G.h + 2 * sy + 'px',
      background: `radial-gradient(ellipse 58% 60% at 50% 50%, #241F19 0%, ${PAL.screen} 58%, #110F0C 100%)`,
      boxShadow: `0 0 ${L.px(40)}px ${L.px(20)}px rgba(14,12,10,0.9) inset`, borderRadius: L.px(3) + 'px',
    },
  }, cam);

  // the beam: everything projected lives in here (isolated so multiply stays inside)
  const keystone = L.landscape ? 0.9 : 0.6;
  const gate = el('div', {
    'data-name': 'Projected image',
    style: {
      position: 'absolute', left: G.x + offset[0] + 'px', top: G.y + offset[1] + 'px', width: G.w + 'px', height: G.h + 'px', overflow: 'hidden',
      background: '#000', isolation: 'isolate', transformOrigin: '50% 100%',
      transform: `perspective(${L.px(2600)}px) rotateX(${keystone}deg)`,   // projector sits low: image a little wider at the top
    },
  }, cam);
  // SVG filter for horizontal motion blur during the carrier push
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', 0); defs.setAttribute('height', 0); defs.style.position = 'absolute';
  defs.innerHTML = `<filter id="${id}-hb" x="-5%" y="0" width="110%" height="100%"><feGaussianBlur stdDeviation="0 0"/></filter>`;
  root.appendChild(defs);
  const hbNode = defs.querySelector('feGaussianBlur');

  const carrier = el('div', { 'data-name': 'Slide carrier', style: { position: 'absolute', left: 0, top: 0, width: G.w + 'px', height: G.h + 'px' } }, gate);
  const fx = el('div', { 'data-name': 'Lecturer layer', style: { position: 'absolute', inset: 0, pointerEvents: 'none' } }, gate);

  // lens: soft at the edges (a blurred copy of what is behind, masked to the rim)
  el('div', {
    'data-name': 'Lens softness',
    style: {
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backdropFilter: `blur(${L.px(1.5)}px)`,
      maskImage: 'radial-gradient(ellipse 74% 72% at 50% 48%, transparent 74%, black 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 74% 72% at 50% 48%, transparent 74%, black 100%)',
    },
  }, gate);
  // lamp colour + hot spot + fall-off (multiply)
  el('div', { 'data-name': 'Lamp colour', style: { position: 'absolute', inset: 0, background: PAL.lamp, mixBlendMode: 'multiply', pointerEvents: 'none' } }, gate);
  const hot = el('div', {
    'data-name': 'Hot spot',
    style: {
      position: 'absolute', left: '-10%', top: '-10%', width: '120%', height: '120%', mixBlendMode: 'multiply', pointerEvents: 'none',
      background: `radial-gradient(ellipse 50% 52% at ${spot[0]}% ${spot[1]}%, #FFFFFF 0%, #F4EEE2 38%, #CDBFA6 78%, #8E7F68 100%)`,
    },
  }, gate);
  // uneven screen: faint seams and a soft sag, fixed in screen space (slides move, the screen does not)
  const sc = canvas(Math.round(G.w / 4), Math.round(G.h / 4)), sg = sc.getContext('2d');
  sg.fillStyle = '#fff'; sg.fillRect(0, 0, sc.width, sc.height);
  for (let i = 1; i < 3; i++) { const x = sc.width * (i / 3) + (rand(seed + i) - 0.5) * 6; sg.fillStyle = 'rgba(0,0,0,0.03)'; sg.fillRect(x - 1, 0, 2, sc.height); }
  for (let i = 0; i < 9; i++) {
    const y = sc.height * (0.15 + 0.8 * rand(seed + 20 + i));
    sg.strokeStyle = `rgba(0,0,0,${0.008 + 0.01 * rand(seed + 30 + i)})`; sg.lineWidth = 6 + rand(seed + i) * 8;
    sg.beginPath(); sg.moveTo(0, y); sg.bezierCurveTo(sc.width * 0.3, y + 3, sc.width * 0.7, y - 4, sc.width, y + 2); sg.stroke();
  }
  sc.setAttribute('data-name', 'Screen unevenness');
  Object.assign(sc.style, { position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', pointerEvents: 'none', filter: 'blur(2px)' });
  gate.appendChild(sc);
  // dither (anti-banding, ±1 code value), screen space, offset by frame number
  const nc = canvas(192, 192), ng = nc.getContext('2d'), nd = ng.createImageData(192, 192);
  for (let i = 0; i < nd.data.length; i += 4) { const v = 128 + Math.round((rand(seed * 7 + i * 0.37) - 0.5) * 60); nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v; nd.data[i + 3] = 255; }
  ng.putImageData(nd, 0, 0);
  const dither = el('div', { 'data-name': 'Dither', style: { position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `url(${nc.toDataURL()})`, mixBlendMode: 'soft-light', opacity: 0.07 } }, gate);
  // lamp level (dark moments, warm-up, gentle breathing of the light)
  const dim = el('div', { 'data-name': 'Lamp level', style: { position: 'absolute', inset: 0, background: '#000', pointerEvents: 'none', opacity: 0 } }, gate);

  return {
    G, cam, gate, carrier, fx, hot,
    /** s: { bright 0..1, focus px, hblur px, carrierX px, cam: {s, x, y} } */
    update(t, s = {}) {
      const f = Math.floor(t * ctx.fps + ctx.start * ctx.fps);
      const breathe = 1 + 0.012 * noise1(t * 1.1, seed * 3) ;            // limelight/arc breathing, < 2 %, slow
      const b = clamp((s.bright ?? 1) * breathe, 0, 1);
      dim.style.opacity = (1 - b).toFixed(3);
      dither.style.backgroundPosition = `${Math.floor(rand(f * 1.3 + 1) * 192)}px ${Math.floor(rand(f * 2.1 + 2) * 192)}px`;
      const hb = s.hblur ?? 0, fo = s.focus ?? 0;
      hbNode.setAttribute('stdDeviation', `${hb.toFixed(2)} 0`);
      carrier.style.filter = [hb > 0.3 ? `url(#${id}-hb)` : '', fo > 0.05 ? `blur(${fo.toFixed(2)}px)` : ''].join(' ').trim() || 'none';
      carrier.style.transform = `translateX(${(s.carrierX ?? 0).toFixed(2)}px)`;
      const c = s.cam ?? { s: 1, x: 0, y: 0 };
      cam.style.transform = `translate(${(c.x ?? 0).toFixed(2)}px, ${(c.y ?? 0).toFixed(2)}px) scale(${(c.s ?? 1).toFixed(4)})`;
    },
  };
}

/* ---------- the slide change (signature move) ---------- */
/**
 * Push-pull carrier: the old slide leaves to the left, the dark wooden carrier bar crosses the beam (the brief dark
 * moment), the new slide lands from the right against its stop (tiny rebound), then the operator re-focuses.
 * One dark dip per change (never more than 1 per second), light changes eased over ≥ 4 frames.
 */
export function slideChange(t, t0, G, L, { dur = 16 * F } = {}) {
  const bar = G.w * 0.09, D = G.w + bar;
  const p = progress(t, t0, t0 + dur);
  const e = ez.move(p);
  const tl = t - (t0 + dur);
  const rebound = tl > 0 ? -L.px(7) * Math.exp(-tl * 14) * Math.sin(tl * 32) : 0;
  const x = -D * e + rebound;
  // speed for motion blur (px per frame) ≈ derivative of the ease
  const e2 = ez.move(Math.min(1, p + 0.02));
  const v = Math.abs(e2 - e) / 0.02 * D / (dur * 30);
  const hblur = p > 0 && p < 1 ? Math.min(L.px(60), v * 0.5) : 0;
  // dark moment: the bar crosses the beam centre around p = .5; smooth dip, plus a short lamp sag
  const dip = Math.sin(Math.PI * clamp((p - 0.15) / 0.75)) ** 2;
  const bright = 1 - 0.42 * dip;
  const focus = tl > 3 * F ? L.px(2.4) * (1 - ez.enter(progress(tl, 3 * F, 15 * F))) : tl > 0 ? L.px(2.4) : p > 0 ? L.px(2.4) * p : 0;
  return { x, hblur, bright, focus, bar, D, done: p >= 1 && tl > 0.4, moving: p > 0 && p < 1 };
}

/**
 * Lay out the carrier: previous slide at 0, the bar, the new slide at D. Returns setVisible(t) to hide the old slide
 * after the push (so it never counts in the layout check).
 */
export function loadCarrier(P, prevEl, nextEl, change) {
  const G = P.G, bar = G.w * 0.09;
  const wood = el('div', {
    'data-name': 'Carrier bar (wood)',
    style: { position: 'absolute', left: G.w + 'px', top: '-2%', width: bar + 'px', height: '104%', background: 'linear-gradient(90deg,#0B0907,#16110C 40%,#0B0907)' },
  }, P.carrier);
  if (prevEl) { prevEl.style.left = '0px'; }
  nextEl.style.left = G.w + bar + 'px';
  return {
    wood,
    visible(st) {
      if (prevEl) prevEl.style.display = st.done ? 'none' : '';
      wood.style.display = st.done ? 'none' : '';
    },
  };
}

/* ---------- the lecturer: pointer shadow and cover card ---------- */
/** The shadow of a wooden pointer. Only visible where the light falls (it lives inside the beam). */
export function pointer(P, L, { seed = 3, name = 'Pointer shadow' } = {}) {
  const len = P.G.h * 1.25, wid = L.px(24);
  const node = el('div', {
    'data-name': name,
    style: {
      position: 'absolute', left: 0, top: 0, width: len + 'px', height: wid + 'px', transformOrigin: '0 50%',
      background: 'linear-gradient(90deg, rgba(14,10,6,0.78) 0%, rgba(14,10,6,0.62) 100%)',
      clipPath: 'polygon(0 38%, 4% 30%, 100% 0, 100% 100%, 4% 70%, 0 62%)', filter: `blur(${L.px(2.2)}px)`, opacity: 0,
    },
  }, P.fx);
  return {
    node,
    /** keys: [[time, x, y], …] tip positions in beam px (null x = away). Moves are hand-like: ease, settle, tremor. */
    update(t, keys, deg = 34) {
      // find the active segment
      let a = keys[0], b = keys[0];
      for (let i = 0; i < keys.length; i++) { if (t >= keys[i][0]) { a = keys[i]; b = keys[i + 1] ?? keys[i]; } }
      const away = [P.G.w * 1.25, P.G.h * 1.2];
      const A = a[1] == null ? away : [a[1], a[2]], B = b[1] == null ? away : [b[1], b[2]];
      const moveDur = 0.5;
      const pp = b === a ? 1 : ez.hand(progress(t, b[0] - moveDur, b[0]));
      let x = A[0] + (B[0] - A[0]) * pp, y = A[1] + (B[1] - A[1]) * pp;
      x += noise1(t * 2.3, seed) * L.px(1.6); y += noise1(t * 2.9, seed + 5) * L.px(1.2);   // the hand is alive
      const vis = (a[1] == null && (b[1] == null || pp < 0.02)) ? 0 : 1;
      node.style.opacity = vis;
      node.style.transform = `translate(${x.toFixed(2)}px, ${(y - L.px(6.5)).toFixed(2)}px) rotate(${(deg + noise1(t * 0.9, seed + 9) * 0.6).toFixed(2)}deg)`;
    },
  };
}

/** The lecturer's cover card lying on the slide: a soft-edged dark shape that slides off to reveal a line. */
export function coverCard(parent, L, { x, y, w, h, name = 'Cover card', soft = 5 }) {
  const node = el('div', {
    'data-name': name,
    style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', background: PAL.tape, opacity: 0.8, filter: `blur(${L.px(soft)}px)`, pointerEvents: 'none', zIndex: 5 },
  }, parent);
  return {
    node,
    /** slide the card by dx over [t0, t0+dur] (hand move: fast start, long settle) */
    update(t, t0, dur, dx, dy = 0) {
      const p = ez.hand(progress(t, t0, t0 + dur));
      node.style.transform = `translate(${(dx * p).toFixed(2)}px, ${(dy * p).toFixed(2)}px)`;
      node.style.display = p >= 1 ? 'none' : '';
    },
  };
}
