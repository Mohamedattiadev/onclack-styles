// PHOTOMONTAGE kit — real public-domain photos cut with scissors, flat red/black paper, bold type on diagonals.
// Every piece is paper: it has a scissor edge (designed once per piece, seeded), a shadow from ONE key light
// (upper-left → shadows fall down-right in SCREEN space), and it arrives by hand: lifted, then slapped flat.
// Nothing here boils or flickers: imperfection is fixed per object, only the hand and the camera move.
import { el, svg, rand, clamp, lerp, progress, spring } from '/onclack-styles/engine/lib/anim.js';

export const PAL = {
  board: '#D3CDBF',   // grey card (the work board)
  boardDk: '#C4BDAD',
  black: '#191715',   // black poster paper
  red: '#C3271C',     // red poster paper (the only accent)
  paper: '#EFEAE0',   // white print paper / label strips
  ink: '#1B1916',
  shadow: 'rgba(38,28,20,1)',
};
export const FONT = {
  disp: "'Big Shoulders Display', 'IBM Plex Mono', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};
export const F = 1 / 30;
export const bez = (x1, y1, x2, y2) => p => {
  // cubic-bezier easing (Newton steps), pure
  p = clamp(p);
  let u = p;
  for (let i = 0; i < 6; i++) {
    const x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3 - p;
    const dx = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u = clamp(u - x / dx);
  }
  return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3;
};
export const ez = { hand: bez(0.2, 0.9, 0.3, 1), out: bez(0.16, 1, 0.3, 1), inout: bez(0.65, 0, 0.35, 1), fall: bez(0.5, 0, 0.9, 0.6) };
export const tw = (t, a, b, from, to, e = ez.out) => from + (to - from) * e(progress(t, a, b));

/* ---------- voice ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
/** Local scene time of the nth word `w` (visuals land 0–3 f before it). */
export function wordT(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.wordsIn().filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fallback;
}

/* ---------- scissor edges ---------- */
/** Turn a clean polygon into a scissor cut: straight snips 18–34 px long with a small drifting angle,
 *  and an over-cut nick at some corners (where the blades went a bit too far). Seeded = same every frame. */
export function scissor(pts, seed, { snip = 26, jit = 1.4, nick = 0.35 } = {}) {
  const out = [];
  let off = 0, k = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const n = Math.max(1, Math.round(len / (snip * (0.75 + rand(seed + i * 3.1) * 0.6))));
    for (let j = 0; j < n; j++) {
      const f = j / n;
      if (j > 0) off = clamp(off + (rand(seed + ++k * 1.7) - 0.5) * jit * 2, -jit * 1.8, jit * 1.8);
      else off *= 0.4; // corners are cut precisely
      out.push([a[0] + dx * f + nx * off, a[1] + dy * f + ny * off]);
      if (j === 0 && rand(seed + i * 9.3) < nick && len > 60) {
        // nick: a 5–9 px slit into the piece just after the corner
        const d = 10 + rand(seed + i) * 8, depth = 5 + rand(seed + i * 2) * 4;
        const px = a[0] + dx / len * d, py = a[1] + dy / len * d;
        out.push([px, py], [px - nx * depth + dx / len * 1.2, py - ny * depth + dy / len * 1.2], [px + dx / len * 2.4, py + dy / len * 2.4]);
      }
    }
  }
  return out;
}
export const polyCss = pts => `polygon(${pts.map(p => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',')})`;
export const polyPath = pts => 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') + ' Z';
export const rectPts = (w, h, inset = 0) => [[inset, inset], [w - inset, inset], [w - inset, h - inset], [inset, h - inset]];

/* ---------- textures (built once) ---------- */
let boardTex = null;
function boardTexture() {
  if (boardTex) return boardTex;
  const c = document.createElement('canvas'); c.width = c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = PAL.board; g.fillRect(0, 0, 384, 384);
  // card fibres: short light/dark strokes, mostly horizontal (pressed board)
  for (let i = 0; i < 900; i++) {
    const x = rand(i * 1.31) * 384, y = rand(i * 2.77) * 384, l = 3 + rand(i * 3.9) * 14, a = (rand(i * 5.1) - 0.5) * 0.7;
    g.strokeStyle = rand(i * 7.3) < 0.5 ? 'rgba(255,252,244,0.22)' : 'rgba(80,70,55,0.10)';
    g.lineWidth = 0.6 + rand(i * 8.1) * 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  boardTex = c.toDataURL('image/png');
  return boardTex;
}
let paperTex = null;
function paperTexture() {
  if (paperTex) return paperTex;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const d = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = rand(i * 0.731 + 11) - 0.5;
    d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v > 0 ? 255 : 0;
    d.data[i * 4 + 3] = Math.abs(v) * 26;
  }
  g.putImageData(d, 0, 0);
  paperTex = c.toDataURL('image/png');
  return paperTex;
}

/* ---------- scene frame: board + camera + optional sheet-in transition ---------- */
export function stageBoard(root, ctx, { sheetIn = false, seed = 1 } = {}) {
  const L = ctx.layout, W = L.width, H = L.height;
  const wrap = el('div', { 'data-name': 'Board sheet', style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', overflow: 'hidden' } }, root);
  const cam = el('div', { 'data-name': 'Camera', style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', transformOrigin: '50% 50%' } }, wrap);
  const pad = 0.08;
  el('div', { 'data-name': 'Grey card board', style: { position: 'absolute', left: -W * pad + 'px', top: -H * pad + 'px', width: W * (1 + 2 * pad) + 'px', height: H * (1 + 2 * pad) + 'px', background: `${PAL.board} url(${boardTexture()})`, backgroundPosition: `${Math.round(rand(seed) * 300)}px ${Math.round(rand(seed + 1) * 300)}px` } }, cam);
  // dried glue haze: a few faint, fixed blotches on the board (glue spread past the pieces)
  for (let i = 0; i < 5; i++) {
    const r = L.px(60 + rand(seed * 7 + i) * 110);
    el('div', { style: { position: 'absolute', left: rand(seed * 3 + i * 1.7) * W - r + 'px', top: rand(seed * 5 + i * 2.3) * H - r + 'px', width: 2 * r + 'px', height: 2 * r * 0.6 + 'px', borderRadius: '50%', background: 'rgba(120,104,70,0.016)', transform: `rotate(${(rand(i + seed) - 0.5) * 60}deg)` } }, cam);
  }
  const content = el('div', { 'data-name': 'Montage', style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' } }, cam);
  // a whisper of light falloff from the key light (upper-left) — one grade layer, not a vignette effect
  el('div', { 'data-name': 'Grade', style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(255,250,240,0.07) 0%, rgba(255,250,240,0) 45%, rgba(40,30,20,0.10) 100%)' } }, wrap);
  let last = '';
  return {
    W, H, L, content, cam, wrap,
    /** cam: { s, x, y } (scale about centre + px offset). Sheet slides in on a diagonal in 10 f with a lifted edge. */
    update(t, { s = 1, x = 0, y = 0 } = {}) {
      const ct = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(5)})`;
      if (ct !== last) { cam.style.transform = ct; last = ct; }
      if (sheetIn) {
        const p = ez.hand(progress(t, 0, 11 * F));
        const dx = (1 - p) * W * 0.62, dy = (1 - p) * H * L.pick({ landscape: 0.34, portrait: 0.2 });
        wrap.style.transform = p >= 1 ? '' : `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${((1 - p) * -3).toFixed(2)}deg)`;
        wrap.style.boxShadow = p >= 1 ? 'none' : `${L.px(-14)}px ${L.px(-10)}px ${L.px(40)}px rgba(30,22,14,${(0.45 * (1 - p * 0.6)).toFixed(3)})`;
      }
    },
  };
}

/* ---------- a piece of paper ---------- */
/**
 * piece(parent, { name, w, h, pts (polygon in piece px), node (content element, sized w×h), seed, edge })
 * set({ x, y, r, s, lift, op }) — x,y = centre in frame px; lift 0 = glued flat, 1 = held up by the hand.
 */
export function piece(parent, { name, w, h, pts, node, L, raw = false, clip = null, z = null, origin = null }) {
  const [ox0, oy0] = origin ?? [w / 2, h / 2];
  const root = el('div', { 'data-name': name, style: { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px', transformOrigin: `${ox0}px ${oy0}px` } }, parent);
  if (z != null) root.style.zIndex = z;
  const cp = clip ?? polyCss(pts);
  const sh = el('div', { 'data-name': `${name} shadow`, style: { position: 'absolute', inset: 0, background: PAL.shadow, clipPath: cp } }, root);
  const body = el('div', { style: { position: 'absolute', inset: 0, clipPath: cp, overflow: 'hidden' } }, root);
  if (node) body.appendChild(node);
  if (!raw) el('div', { style: { position: 'absolute', inset: 0, background: `url(${paperTexture()})`, mixBlendMode: 'soft-light', pointerEvents: 'none' } }, body);
  const unit = L.unit;
  let lastT = '', lastS = '';
  return {
    root, body, w, h, pts,
    set({ x, y, r = 0, s = 1, lift = 0, op = 1 }) {
      const tr = `translate(${(x - ox0).toFixed(2)}px,${(y - oy0).toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
      if (tr !== lastT) { root.style.transform = tr; lastT = tr; }
      root.style.opacity = op <= 0 ? '0' : op >= 1 ? '' : op.toFixed(3);
      root.style.visibility = op <= 0 ? 'hidden' : '';
      // shadow in screen space: down-right from the upper-left key light; grows and softens when lifted
      const d = (2.5 + 26 * lift) * unit, blur = (1.6 + 22 * lift) * unit;
      const a = -r * Math.PI / 180;
      const ox = (d * Math.cos(a) - d * 0.8 * Math.sin(a)) / s, oy = (d * Math.sin(a) + d * 0.8 * Math.cos(a)) / s;
      const ss = `${ox.toFixed(1)}|${oy.toFixed(1)}|${blur.toFixed(1)}|${lift.toFixed(2)}`;
      if (ss !== lastS) {
        sh.style.transform = `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px)`;
        sh.style.filter = `blur(${blur.toFixed(1)}px)`;
        sh.style.opacity = (0.42 - 0.18 * lift).toFixed(3);
        lastS = ss;
      }
    },
  };
}

/** Hand placement: the piece comes down from above the board (bigger, soft shadow) and is slapped flat at t0.
 *  from = [dx, dy] px the hand travels, r0 → r1 rotation. Returns state for piece.set(). */
export function slap(t, t0, { at, r1 = 0, from = [0, 0], r0 = null, dur = 0.34, fadeIn = 3 * F, s0 = 1.14 } = {}) {
  const ta = t0 - dur;
  if (t < ta) return { x: at[0] + from[0], y: at[1] + from[1], r: r0 ?? r1, s: s0, lift: 1, op: 0 };
  const p = progress(t, ta, t0);
  const e = ez.hand(p);
  const lift = t >= t0 ? 0 : 1 - ez.inout(clamp((p - 0.35) / 0.65));
  // after the slap the hand presses: 3 f micro-settle (scale 1.006 → 1), no bounce (paper does not bounce)
  const press = t >= t0 ? 1 + 0.006 * (1 - clamp((t - t0) / (3 * F))) : 1;
  return {
    x: at[0] + from[0] * (1 - e), y: at[1] + from[1] * (1 - e),
    r: lerp(r0 ?? r1 + 6, r1, e),
    s: lerp(s0, 1, ez.out(p)) * press, lift,
    op: clamp((t - ta) / Math.max(1e-3, fadeIn)),
  };
}

/* ---------- photo prints (baked once: greyscale gelatin print + white margin + grain) ---------- */
const imgCache = new Map();
export async function loadImg(ctx, src) {
  if (!imgCache.has(src)) {
    const im = new Image(); im.src = ctx.asset(src);
    imgCache.set(src, im.decode().then(() => im));
  }
  return imgCache.get(src);
}
/** Bake a print: crop {x,y,w,h} of the source, drawn at w×h px, optional white print margin m px. */
export function bakePrint(img, crop, w, h, { m = 0, contrast = 1.22, seed = 3 } = {}) {
  const c = document.createElement('canvas');
  c.width = Math.round(w); c.height = Math.round(h);
  const g = c.getContext('2d');
  g.fillStyle = PAL.paper; g.fillRect(0, 0, c.width, c.height);
  g.filter = `grayscale(1) contrast(${contrast}) brightness(1.03)`;
  g.drawImage(img, crop.x, crop.y, crop.w, crop.h, m, m, c.width - 2 * m, c.height - 2 * m);
  g.filter = 'none';
  // warm silver-gelatin tone (a print, not a screen grab): multiply a faint sepia, keep blacks neutral
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = 'rgba(236,222,198,1)'; g.fillRect(m, m, c.width - 2 * m, c.height - 2 * m);
  g.globalCompositeOperation = 'source-over';
  // fixed print grain (seeded, small) — hides upscale softness; same every frame
  const d = g.getImageData(m, m, c.width - 2 * m, c.height - 2 * m);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = (rand(i * 0.0137 + seed) - 0.5) * 16;
    d.data[i] += v; d.data[i + 1] += v; d.data[i + 2] += v;
  }
  g.putImageData(d, m, m);
  c.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px`;
  return c;
}

/* ---------- flat paper + type strips ---------- */
export function flat(color, w, h) {
  return el('div', { style: { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px', background: color } });
}
/**
 * A cut strip of paper carrying type. Measures itself; returns { piece, w, h }.
 * opts: text, size (px), font, weight, color, bg, padX, padY, track (em), parent, name, seed, L
 */
export function strip(parent, { text, size, font = FONT.disp, weight = 900, color = PAL.ink, bg = PAL.paper, padX = 0.18, padY = 0.06, track = 0.01, name, seed = 1, L, lh = 0.86, upper = true, slant = 0 }) {
  const meas = el('div', { style: { position: 'absolute', left: '-9999px', top: 0, whiteSpace: 'pre', font: `${weight} ${size}px ${font}`, letterSpacing: track + 'em', lineHeight: lh, textTransform: upper ? 'uppercase' : 'none' } }, document.body, text);
  const tw_ = meas.getBoundingClientRect().width, th = meas.getBoundingClientRect().height;
  meas.remove();
  const w = Math.ceil(tw_ + size * padX * 2), h = Math.ceil(th + size * padY * 2 + size * 0.02);
  const node = el('div', { style: { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px', background: bg, color, font: `${weight} ${size}px ${font}`, letterSpacing: track + 'em', lineHeight: lh, textTransform: upper ? 'uppercase' : 'none', whiteSpace: 'pre', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: track + 'em' } }, null, text);
  // strips are cut quickly: a slightly skewed quad (two cuts not quite parallel), then scissor edge
  const k = size * 0.05;
  const quad = [[rand(seed) * k, rand(seed + 1) * k + slant * h], [w - rand(seed + 2) * k, rand(seed + 3) * k], [w - rand(seed + 4) * k, h - rand(seed + 5) * k - slant * h], [rand(seed + 6) * k, h - rand(seed + 7) * k]];
  const pts = scissor(quad, seed * 13 + 5, { snip: Math.max(18, size * 0.5), jit: Math.max(0.8, size * 0.012), nick: 0.2 });
  const p = piece(parent, { name, w, h, pts, node, L });
  return { piece: p, w, h, node };
}

/** Small typed label (mono) on a white strip — used for sources, "approx.", "diagram", "montage". */
export function label(parent, { text, size, name, seed = 7, L, bg = PAL.paper, color = PAL.ink }) {
  return strip(parent, { text, size, font: FONT.mono, weight: 500, color, bg, padX: 0.5, padY: 0.32, track: 0.04, name, seed, L, lh: 1.15, upper: true });
}

/** Place a set of [piece, state] pairs. */
export const place = (pc, st) => pc.set(st);

/** A geometric officer figure cut from black paper (no face): cap, head, torso, arms, legs, in a pose.
 *  pose: { lean (deg), armL (deg from down), armR, stance (leg spread px), twist (shoulder narrowing 0..0.3) } */
export function figure(parent, { name, hgt, pose, color = PAL.black, seed = 1, L }) {
  const u = hgt / 100; // design: 100 units tall
  const w = 70 * u, h = 106 * u;
  const s = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: `position:absolute;left:0;top:0;overflow:visible` });
  const g = svg('g', { transform: `rotate(${pose.lean} ${w / 2} ${96 * u})` }, s);
  const cx = w / 2, tw_ = 30 * u * (1 - (pose.twist ?? 0));
  const path = (d) => svg('path', { d, fill: color }, g);
  // legs (trousers), stance
  const st = pose.stance * u;
  path(`M${cx - tw_ * 0.42} ${60 * u} L${cx - 2 * u} ${60 * u} L${cx - st * 0.5 + 2 * u} ${100 * u} L${cx - st * 0.5 - 9 * u} ${100 * u} Z`);
  path(`M${cx + 2 * u} ${60 * u} L${cx + tw_ * 0.42} ${60 * u} L${cx + st * 0.5 + 9 * u} ${100 * u} L${cx + st * 0.5 - 2 * u} ${100 * u} Z`);
  // torso (jacket): shoulders wider than waist
  path(`M${cx - tw_ / 2} ${24 * u} L${cx + tw_ / 2} ${24 * u} L${cx + tw_ * 0.4} ${62 * u} L${cx - tw_ * 0.4} ${62 * u} Z`);
  // arms: rectangles rotated at the shoulder
  const arm = (side, deg) => {
    const sx = cx + side * (tw_ / 2 - 3 * u), sy = 26 * u;
    svg('rect', { x: sx - 4.5 * u, y: sy, width: 9 * u, height: 34 * u, rx: 1.5 * u, fill: color, transform: `rotate(${side * -deg} ${sx} ${sy + 2 * u})` }, g);
  };
  arm(-1, pose.armL); arm(1, pose.armR);
  // neck + head (plain disc, no face) + peaked officer cap
  path(`M${cx - 4 * u} ${18 * u} L${cx + 4 * u} ${18 * u} L${cx + 5 * u} ${25 * u} L${cx - 5 * u} ${25 * u} Z`);
  svg('circle', { cx, cy: 12 * u, r: 8.5 * u, fill: color }, g);
  path(`M${cx - 12 * u} ${6.5 * u} L${cx + 12 * u} ${4.5 * u} L${cx + 10.5 * u} ${-1.5 * u} Q${cx} ${-6 * u} ${cx - 10.5 * u} ${0 * u} Z`);
  path(`M${cx + 3 * u} ${6.8 * u} L${cx + 15 * u} ${8.6 * u} L${cx + 12 * u} ${4.6 * u} Z`); // visor
  // the figure is cut out of black paper: piece with a loose scissor outline around it (we let the silhouette clip itself)
  const node = el('div', { style: { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px' } });
  node.appendChild(s);
  const pc = piece(parent, { name, w, h, pts: rectPts(w, h), node, L, raw: true, clip: 'none' });
  // shadow from the silhouette itself: replace the rect shadow with a drop-shadow on the svg
  pc.root.firstChild.style.display = 'none';
  s.style.filter = `drop-shadow(${(3 * L.unit).toFixed(1)}px ${(2.5 * L.unit).toFixed(1)}px ${(1.8 * L.unit).toFixed(1)}px rgba(38,28,20,0.42))`;
  return { piece: pc, w, h, svg: s, paths: g };
}

/** A flat shape cut from coloured paper, given as an SVG path in local px (w×h box). Shadow follows the silhouette. */
export function shapePiece(parent, { name, w, h, d, color, L, extra = null }) {
  const s = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: 'position:absolute;left:0;top:0;overflow:visible' });
  svg('path', { d, fill: color, 'fill-rule': 'evenodd' }, s);
  if (extra) extra(s);
  const node = el('div', { style: { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px' } });
  node.appendChild(s);
  const pc = piece(parent, { name, w, h, pts: rectPts(w, h), node, L, raw: true, clip: 'none' });
  pc.root.firstChild.style.display = 'none';
  s.style.filter = `drop-shadow(${(3 * L.unit).toFixed(1)}px ${(2.5 * L.unit).toFixed(1)}px ${(1.8 * L.unit).toFixed(1)}px rgba(38,28,20,0.42))`;
  return { piece: pc, svg: s, w, h };
}

/** Thin a dense coastline to hand-cut spacing (≥ min px between points). */
export function thin(pts, min) {
  const out = [pts[0]];
  for (const p of pts) { const q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= min) out.push(p); }
  return out;
}
