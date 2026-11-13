// PAINTED SHORT — pass 2: a SOFT wet-in-wet watercolour kit (Canvas 2D, deterministic).
// The user's note on pass 1: "too dark and blotchy, like stained glass". So every wash here is:
//   light (low pigment alpha, multiplied on white paper) · edges partly hard (with a darker dried rim)
//   and partly bled out (blurred, wet-in-wet) · mottled inside (pigment settles unevenly) · granulated
//   (paper tooth shows through) · ink lines thin, broken, sepia — never black outlines around flat cells.
// Randomness only from rng(seed). Line boil = new seed per 12 fps drawing; wash boil = 3 painted variants.
import { rng, gauss, deform, tracePath, makeCanvas, smoothPts, brush, TAU, lerp, clamp, boilIndex } from './paint.js';

// ---------------------------------------------------------------- palette (pigment names = their role)
export const PAL = {
  paper: '#f8f3e8',      // cold-press paper, warm white (most of every frame)
  ink: '#3d332d',        // sepia ink (lines, lettering)
  pencil: '#8b8790',     // graphite under-drawing
  cerulean: '#86b9cc',   // sea, sky, cool light
  ultra: '#6f86bd',      // deep water, shadows (granulates)
  payne: '#77798f',      // neutral shadow, steel, ships
  sienna: '#d9a56a',     // raw sienna: land, skin light, lamp
  burnt: '#b9714a',      // burnt sienna: skin shadow, hair, wood
  sap: '#93ad6c',        // sap green: land patches
  ochre: '#e3c070',      // yellow ochre: lamp light, brass
  verm: '#c8462e',       // vermillion: ONLY Arkhipov's "no" (the hero accent)
};

// ---------------------------------------------------------------- noise canvases
/** Smooth value noise as an ALPHA canvas (w×h), contrast-shaped: thr = mean level, k = sharpness. */
export function alphaNoise(w, h, cell, seed, { thr = 0.5, k = 2.5, lo = 0, hi = 1 } = {}) {
  const nw = Math.ceil(w / cell) + 3, nh = Math.ceil(h / cell) + 3;
  const c = makeCanvas(nw, nh), g = c.getContext('2d'), id = g.createImageData(nw, nh), r = rng(seed);
  for (let i = 0; i < nw * nh; i++) {
    let v = clamp((r() - thr) * k + 0.5);
    v = v * v * (3 - 2 * v);
    id.data[i * 4 + 3] = Math.round(255 * lerp(lo, hi, v));
  }
  g.putImageData(id, 0, 0);
  const out = makeCanvas(w, h), og = out.getContext('2d');
  og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
  og.drawImage(c, -cell, -cell, nw * cell, nh * cell);
  return out;
}

/** Fine grain alpha canvas (tile) for granulation / tooth. */
const toothCache = new Map();
export function toothTile(size, cell, seed) {
  const key = `${size}|${cell}|${seed}`;
  if (!toothCache.has(key)) toothCache.set(key, alphaNoise(size, size, cell, seed, { thr: 0.62, k: 3.2 }));
  return toothCache.get(key);
}
function tileOver(g, tile, w, h, ox = 0, oy = 0) {
  const s = tile.width;
  for (let y = -((oy % s) + s) % s; y < h; y += s) for (let x = -((ox % s) + s) % s; x < w; x += s) g.drawImage(tile, x, y);
}

// ---------------------------------------------------------------- paper
/** Cold-press watercolour paper: warm white, faint sizing clouds, fine tooth. Painted once. */
export function paperSheet(g, w, h, seed = 1, U = 1, base = PAL.paper) {
  g.save();
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  // sizing clouds (very faint)
  const clouds = alphaNoise(w, h, 300 * U, seed + 1, { thr: 0.5, k: 1.2, hi: 0.05 });
  g.globalCompositeOperation = 'multiply';
  const tint = makeCanvas(w, h), tg = tint.getContext('2d');
  tg.drawImage(clouds, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#c9b48f'; tg.fillRect(0, 0, w, h);
  g.drawImage(tint, 0, 0);
  // tooth: tiny pits catch shadow
  const tooth = toothTile(512, 2.1 * U, seed + 3);
  const tc = makeCanvas(w, h), tcg = tc.getContext('2d');
  tileOver(tcg, tooth, w, h);
  tcg.globalCompositeOperation = 'source-in'; tcg.fillStyle = 'rgba(150,135,115,0.09)'; tcg.fillRect(0, 0, w, h);
  g.drawImage(tc, 0, 0);
  g.restore();
}

// ---------------------------------------------------------------- the wash
/** Split long polygon edges so the wash edge is ragged at the same scale everywhere. */
export function densify(pts, maxLen) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / maxLen));
    for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1 };
}

/**
 * One watercolour wash, multiplied onto g (so overlapping washes glaze and mix like pigment).
 *  alpha  – pigment strength (keep 0.25–0.6: values stay light)
 *  soft   – share of the edge that bled wet-in-wet (0 = all hard, 1 = all soft)
 *  bleed  – blur radius of the bled edge (px)
 *  rim    – dried, pooled darker edge on the hard parts (0–1)
 *  mottle – uneven pigment inside (0–1) · gran – granulation (0–1) · blooms – back-runs (cauliflowers)
 *  shapes – extra closed polygons painted in the SAME wet wash (they merge)
 */
export function wetWash(g, pts, color, o = {}) {
  const { alpha = 0.42, soft = 0.45, bleed = 16, rim = 0.55, rimW = 5, mottle = 0.35, gran = 0.3, seed = 1,
    layers = 5, spread = 0.035, depth = 4, mode = 'multiply', U = 1, blooms = 0, bloomR = 40, cell = null, dry = 0.6,
    shapes = [], lift = null, maxSeg = 110 } = o;
  const r = rng(seed);
  const polys = [pts, ...shapes].map(p => deform(densify(p, maxSeg * U).map(q => [q[0], q[1], 1]), 2, spread * 2, r));
  const bb = bbox(polys.flat());
  const pad = Math.ceil(bleed * 2.6 + 8 * U);
  const X = Math.floor(bb.x0 - pad), Y = Math.floor(bb.y0 - pad);
  const w = Math.ceil(bb.x1 - bb.x0 + pad * 2), h = Math.ceil(bb.y1 - bb.y0 + pad * 2);
  if (w < 2 || h < 2 || w * h > 40e6) return;
  // 1. mask: stacked Hobbs layers → organic, slightly ragged edge
  const M = makeCanvas(w, h), mg = M.getContext('2d');
  mg.translate(-X, -Y); mg.fillStyle = '#000';
  for (let k = 0; k < layers; k++) {
    mg.globalAlpha = 0.5;
    for (const base of polys) { tracePath(mg, deform(base, depth, spread * 1.4, r)); mg.fill(); }
  }
  mg.globalAlpha = 1;
  mg.setTransform(1, 0, 0, 1, 0, 0);
  // 2. which parts of the edge stayed hard (dried) vs bled (wet-in-wet)
  const ncell = cell ?? Math.max(30, Math.min(w, h) / 3);
  const N = alphaNoise(w, h, ncell, seed + 11, { thr: soft, k: 3 });
  // 3. soft copy (bled), only where the edge is NOT hard
  const D = makeCanvas(w, h), dg = D.getContext('2d');
  dg.filter = `blur(${bleed}px)`; dg.drawImage(M, 0, 0); dg.filter = 'none';
  dg.globalCompositeOperation = 'destination-out'; dg.drawImage(N, 0, 0);
  // 4. hard copy where N
  const Hd = makeCanvas(w, h), hg = Hd.getContext('2d');
  hg.drawImage(M, 0, 0); hg.globalCompositeOperation = 'destination-in'; hg.drawImage(N, 0, 0);
  dg.globalCompositeOperation = 'source-over'; dg.drawImage(Hd, 0, 0);
  // 5. mottling: pigment settles unevenly (lighter patches inside)
  if (mottle) {
    dg.globalCompositeOperation = 'destination-out';
    dg.globalAlpha = mottle;
    dg.drawImage(alphaNoise(w, h, Math.max(18, ncell * 0.45), seed + 21, { thr: 0.5, k: 1.6 }), 0, 0);
    dg.globalAlpha = 1;
  }
  // 6. lifted areas (painter dabbed with a tissue / painted around)
  if (lift) { dg.save(); dg.translate(-X, -Y); dg.globalCompositeOperation = 'destination-out'; dg.filter = `blur(${lift.blur ?? 10}px)`; dg.fillStyle = '#000'; dg.globalAlpha = lift.alpha ?? 0.8; lift.fn(dg); dg.restore(); }
  // 7. dried rim: mask minus its blur, only on the hard parts
  if (rim) {
    const R = makeCanvas(w, h), rg = R.getContext('2d');
    rg.drawImage(M, 0, 0);
    rg.globalCompositeOperation = 'destination-out'; rg.filter = `blur(${rimW}px)`; rg.drawImage(M, 0, 0); rg.filter = 'none';
    rg.globalCompositeOperation = 'destination-in'; rg.drawImage(N, 0, 0);
    dg.globalCompositeOperation = 'source-over'; dg.globalAlpha = rim; dg.drawImage(R, 0, 0); dg.drawImage(R, 0, 0); dg.globalAlpha = 1;
  }
  // 7b. dry-brush break-up: the paper tooth catches no pigment along part of the hard edge
  if (dry) {
    const B = makeCanvas(w, h), bg2 = B.getContext('2d');
    bg2.drawImage(M, 0, 0);
    bg2.globalCompositeOperation = 'destination-out'; bg2.filter = `blur(${rimW * 2.5}px)`; bg2.drawImage(M, 0, 0); bg2.filter = 'none';
    bg2.globalCompositeOperation = 'destination-in'; tileOver(bg2, toothTile(512, 2.6 * U, seed % 5 + 60), w, h, X, Y);
    bg2.globalCompositeOperation = 'destination-in'; bg2.drawImage(N, 0, 0);
    dg.globalCompositeOperation = 'destination-out'; dg.globalAlpha = dry; dg.drawImage(B, 0, 0); dg.drawImage(B, 0, 0); dg.globalAlpha = 1;
  }
  // 8. blooms / back-runs: pale centre, darker ragged ring
  for (let i = 0; i < blooms; i++) {
    const P = polys[0][Math.floor(r() * polys[0].length)];
    const cx = lerp(P[0], (bb.x0 + bb.x1) / 2, 0.35 + r() * 0.4) - X, cy = lerp(P[1], (bb.y0 + bb.y1) / 2, 0.35 + r() * 0.4) - Y;
    const rr = bloomR * (0.6 + r() * 0.8);
    const ring = deform(ellipsePts0(cx, cy, rr, rr * (0.7 + r() * 0.4), 12).map(p => [...p, 1]), 3, 0.16, r);
    dg.save(); dg.globalCompositeOperation = 'destination-out'; dg.filter = `blur(${rr * 0.25}px)`; dg.globalAlpha = 0.55; tracePath(dg, ring); dg.fill(); dg.restore();
    dg.save(); dg.globalCompositeOperation = 'source-over'; dg.globalAlpha = 0.45; dg.strokeStyle = '#000'; dg.lineWidth = 2.2 * U; dg.filter = `blur(${0.8 * U}px)`; tracePath(dg, ring); dg.stroke(); dg.restore();
  }
  // 9. granulation: pigment drops into the paper's valleys (speckle)
  if (gran) {
    granulateOut(dg, w, h, X, Y, seed, gran, U, Math.max(24, ncell * 0.35));
  }
  // 10. colour it and glaze it on
  dg.globalCompositeOperation = 'source-in'; dg.fillStyle = color; dg.fillRect(0, 0, w, h);
  g.save(); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.drawImage(D, X, Y); g.restore();
}

/** Granulation: knock pigment out of the paper's peaks, in clusters (strong in patches, none elsewhere). */
function granulateOut(dg, w, h, X, Y, seed, gran, U, cell) {
  const Gc = makeCanvas(w, h), gc = Gc.getContext('2d');
  tileOver(gc, toothTile(512, 2.3 * U, seed % 7 + 40), w, h, X, Y);
  gc.globalCompositeOperation = 'destination-in';
  gc.drawImage(alphaNoise(w, h, cell, seed + 31, { thr: 0.55, k: 2.4 }), 0, 0);
  dg.save(); dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = 'destination-out'; dg.globalAlpha = Math.min(1, gran * 1.6);
  dg.drawImage(Gc, 0, 0); dg.restore();
}

function ellipsePts0(cx, cy, rx, ry, n) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }

/** Big soft wet-in-wet field: blobs of colour dropped into wet paper (no edges at all). */
export function wetField(g, blobs, { blur = 60, alpha = 0.45, mode = 'multiply', W, H, seed = 1, gran = 0.25, U = 1, pad = 0 } = {}) {
  const c = makeCanvas(W + pad * 2, H + pad * 2), cg = c.getContext('2d');
  cg.translate(pad, pad);
  cg.filter = `blur(${blur}px)`;
  for (const b of blobs) { cg.globalAlpha = b.a ?? 1; cg.fillStyle = b.color; tracePath(cg, b.pts); cg.fill(); }
  cg.filter = 'none'; cg.globalAlpha = 1; cg.setTransform(1, 0, 0, 1, 0, 0);
  if (gran) granulateOut(cg, c.width, c.height, 0, 0, seed + 50, gran, U, 140 * U);
  g.save(); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.drawImage(c, -pad, -pad); g.restore();
}

// ---------------------------------------------------------------- ink + pencil
/**
 * Thin, BROKEN sepia ink line (dip pen): the line lifts off the paper here and there (fixed per object),
 * width swells a little, and the whole line boils on twos (boil = drawing index; 0 = still).
 */
export function inkLine(g, pts, { w = 1.6, color = PAL.ink, alpha = 0.8, seed = 1, boil = 0, amp = 0.6, gaps = 0.18, closed = false, U = 1, sm = 5, taper = [0.15, 0.25] } = {}) {
  let P = pts.length > 2 ? smoothPts(pts, closed, sm) : pts.slice();
  if (closed) P.push(P[0]);
  const r = rng(seed * 3.1 + 5);
  // walk the line, cut into runs with small gaps
  let run = [P[0]], acc = 0, target = (60 + r() * 140) * U, inGap = false;
  for (let i = 1; i < P.length; i++) {
    const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    acc += d;
    if (!inGap) run.push(P[i]);
    if (acc > target) {
      acc = 0;
      if (!inGap && r() < gaps * 3) { if (run.length > 1) brush(g, run, { w: w * U, color, alpha, seed: seed + i, boil, amp: amp * U, taper, press: 0.45, sm: 1, step: 2 }); run = []; inGap = true; target = (8 + r() * 16) * U; }
      else { if (inGap) { run = [P[i]]; } inGap = false; target = (60 + r() * 140) * U; }
    }
  }
  if (run.length > 1) brush(g, run, { w: w * U, color, alpha, seed: seed + 999, boil, amp: amp * U, taper, press: 0.45, sm: 1, step: 2 });
}

/** Faint graphite under-drawing (construction line the painter didn't erase). */
export function pencil(g, pts, { seed = 1, U = 1, alpha = 0.28, w = 1, boil = 0 } = {}) {
  const r = rng(seed);
  const P = pts.map(([x, y]) => [x + gauss(r) * 0.8 * U, y + gauss(r) * 0.8 * U]);
  brush(g, P, { w: w * U, color: PAL.pencil, alpha, seed, press: 0.7, taper: [0.05, 0.08], dry: 0.35, boil, amp: 0.3 * U });
}

// ---------------------------------------------------------------- lettering
/** Hand-lettered word in ink (each glyph hand-placed, slight pressure variation, dry tooth). */
export function inkText(text, { font, color = PAL.ink, size = 60, seed = 3, track = 0, jitter = 0.03, alpha = 0.92 }) {
  const c0 = makeCanvas(10, 10).getContext('2d');
  c0.font = font;
  const chars = [...text], widths = chars.map(ch => c0.measureText(ch).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
  const c = makeCanvas(totalW + size * 0.8, size * 1.7), g = c.getContext('2d'), r = rng(seed);
  g.font = font; g.fillStyle = color; g.textBaseline = 'alphabetic';
  let x = size * 0.4;
  chars.forEach((ch, i) => {
    g.save();
    g.translate(x, size * 1.2 + (r() - 0.5) * size * jitter);
    g.rotate((r() - 0.5) * jitter);
    g.globalAlpha = alpha * (0.85 + r() * 0.15);
    g.fillText(ch, 0, 0);
    g.restore();
    x += widths[i] + track;
  });
  g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.25;
  tileOver(g, toothTile(256, 1.6, seed + 9), c.width, c.height);
  return c;
}

// ---------------------------------------------------------------- the animated red bloom (signature move)
/**
 * A drop of vermillion touches wet paper and spreads: `stages` painted states of ONE wash (same seed,
 * growing radius), shown on twos. Returns { canvases, size }.
 */
export function bloomStages(R, color, { stages = 7, seed = 5, U = 1, alpha = 0.55, hollow = 0 } = {}) {
  const size = Math.ceil(R * 2.9), out = [];
  for (let s = 1; s <= stages; s++) {
    const k = s / stages, c = makeCanvas(size, size), g = c.getContext('2d');
    const rr = R * (0.25 + 0.75 * Math.sqrt(k));
    const base = ellipsePts0(size / 2, size / 2, rr, rr * 0.9, 11);
    const lift = hollow ? { blur: rr * 0.35, alpha: hollow, fn: lg => { lg.beginPath(); lg.arc(size / 2, size / 2, rr * 0.6, 0, 7); lg.fill(); } } : null;
    wetWash(g, base, color, { alpha, soft: 0.25, bleed: 10 * U, rim: 0.8 * k + 0.1, rimW: 5 * U, mottle: 0.5, gran: 0.25, seed, U, spread: 0.09, blooms: s > stages - 2 ? 1 : 0, bloomR: R * 0.3, mode: 'source-over', lift });
    out.push(c);
  }
  return out;
}

// ---------------------------------------------------------------- light grade (no dark lift!)
/** Paper-light grade: a faint warm edge (like the page curling into lamp shadow) + fine grain on twos. */
export function lightGrade(g, W, H, T, grains, { edge = 'rgba(214,196,168,1)', strength = 0.35, grain = 0.035 } = {}) {
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = strength;
  const R = Math.hypot(W, H) / 2;
  const v = g.createRadialGradient(W / 2, H / 2, R * 0.55, W / 2, H / 2, R * 1.08);
  v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(1, edge);
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;
  if (grains?.length && grain) { g.globalCompositeOperation = 'overlay'; g.globalAlpha = grain; g.drawImage(grains[boilIndex(T) % grains.length], 0, 0, W, H); }
  g.restore();
}

/** Small pencilled caption: "Illustration · not a portrait" etc. Returns canvas. */
export function caption(text, U, seed = 77) {
  const size = Math.round(30 * U);
  return inkText(text, { font: `italic 500 ${size}px 'Cormorant Garamond'`, color: '#5d5550', size, seed, jitter: 0.02, alpha: 0.9 });
}
