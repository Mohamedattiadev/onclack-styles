// Builds every physical object of the table ONCE (module cache, shared by all scenes and by the loupe copy).
// Canvases are encoded to blob URLs so each copy is just an <img> (one decode, no duplicate pixels).
import { clamp } from '/onclack-styles/engine/lib/anim.js';
import { C, FILM, FONT, RES, r01, vnoise, hash, canvas, toURL, loadImage, greyCrop, negPx, posPx, baseTexture, fingerprint } from './kit.js';

export const FR = { pitch: 380, w: 360, h: 240, H: 350 }; // 35 mm frame geometry in world units (10 u = 1 mm)
const css = rgb => `rgb(${rgb.map(v => Math.round(v)).join(',')})`;
const grain = (x, y, s) => (hash(x, y, s) - 0.5) * 0.09 + (vnoise(x, y, 3, s + 1) - 0.5) * 0.06;

let cache = null;
export function loadAssets(ctx) {
  if (!cache) cache = build(ctx);
  return cache;
}

/* ---------- 35 mm strip: base, perforations (cut out), edge print; frames filled by fill(i, g, x, y, w, h) ---------- */
function strip(nFrames, firstNo, seed, fill, { leadL = 60, leadR = 60 } = {}) {
  const Wu = leadL + nFrames * FR.pitch + leadR, k = RES;
  const c = canvas(Wu * k, FR.H * k), g = c.getContext('2d');
  // base with slow density mottle (low-res noise, scaled up smoothly — cheap at load)
  g.fillStyle = css(FILM.clear); g.fillRect(0, 0, c.width, c.height);
  const mw = Math.ceil(c.width / 48), mh = Math.ceil(c.height / 48), mc = canvas(mw, mh), mg = mc.getContext('2d'), md = mg.createImageData(mw, mh);
  for (let i = 0; i < mw * mh; i++) { const v = hash(i, 1, seed); md.data.set([90, 45, 15, Math.round(v * 22)], i * 4); }
  mg.putImageData(md, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(mc, 0, 0, c.width, c.height);
  // frames
  const gy = (FR.H - FR.h) / 2;
  for (let i = 0; i < nFrames; i++) fill(i, g, (leadL + i * FR.pitch + (FR.pitch - FR.w) / 2) * k, gy * k, FR.w * k, FR.h * k);
  baseTexture(g, c.width, c.height, seed + 5);
  // edge print (latent, prints dense): frame numbers + arrows bottom, maker-neutral text top
  g.fillStyle = 'rgba(70,30,10,0.78)';
  g.font = `500 ${13 * k}px ${FONT.type}`; g.textBaseline = 'alphabetic';
  for (let i = 0; i < nFrames; i++) {
    const x = (leadL + i * FR.pitch) * k, n = firstNo + i;
    g.fillText(`${n}`, x + 30 * k, (FR.H - 6) * k);
    g.fillText(`▸ ${n}A`, x + 200 * k, (FR.H - 6) * k);
  }
  g.font = `400 ${11 * k}px ${FONT.type}`; g.fillStyle = 'rgba(70,30,10,0.6)';
  for (let x = leadL - 30; x < Wu; x += FR.pitch * 2) g.fillText('SAFETY FILM   ◂ 62 ▸', (x + 90) * k, 15 * k);
  // perforations: 8 per frame, cut out (the glass shows through)
  g.globalCompositeOperation = 'destination-out';
  const pw = 19.8, ph = 28, p = FR.pitch / 8;
  for (let x = 4; x + pw < Wu; x += p) for (const y of [20, FR.H - 20 - ph]) {
    g.beginPath(); g.roundRect((x + 9.3) * k, y * k, pw * k, ph * k, 3 * k); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  return { c, Wu };
}

/** Write a negative of `img` into a frame gate (rounded corners, lens fall-off = thinner density at corners). */
function negFrame(img, focus, seed) {
  return (i, g, x, y, w, h) => {
    const L = greyCrop(img, w, h, focus), id = g.getImageData(x, y, w, h), d = id.data, rr = 6 * RES;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const cxp = Math.min(px, w - 1 - px), cyp = Math.min(py, h - 1 - py);
      if (cxp < rr && cyp < rr && Math.hypot(rr - cxp, rr - cyp) > rr) continue;
      const nx = px / w - 0.5, ny = py / h - 0.5, fall = 1 - 0.32 * (nx * nx + ny * ny) * 2;
      const col = negPx(L[py * w + px] * fall, grain(px, py, seed));
      const j = (py * w + px) * 4; d[j] = col[0]; d[j + 1] = col[1]; d[j + 2] = col[2];
    }
    g.putImageData(id, x, y);
  };
}

/** Torpedo diagram, photographed line art → clear lines on dense film. Diagram only, not to scale. */
function torpedoFrame(i, g, x, y, w, h) {
  const k = RES, dense = css([FILM.dense[0] + 10, FILM.dense[1] + 6, FILM.dense[2] + 3]), clear = 'rgba(246,186,118,0.95)';
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 6 * k); g.fillStyle = dense; g.fill(); g.clip();
  const cy = y + h * 0.56, r = h * 0.075, x0 = x + w * 0.07, x1 = x + w * 0.9;
  g.strokeStyle = clear; g.lineWidth = 1.6 * k; g.lineJoin = 'round';
  // body + ogive nose + tail cone
  g.beginPath();
  g.moveTo(x0 + r * 2.6, cy - r); g.lineTo(x1 - r * 2, cy - r); g.lineTo(x1, cy - r * 0.45); g.lineTo(x1, cy + r * 0.45); g.lineTo(x1 - r * 2, cy + r);
  g.lineTo(x0 + r * 2.6, cy + r); g.bezierCurveTo(x0 + r * 0.6, cy + r, x0, cy + r * 0.35, x0, cy); g.bezierCurveTo(x0, cy - r * 0.35, x0 + r * 0.6, cy - r, x0 + r * 2.6, cy - r);
  g.stroke();
  // fins + two propellers
  g.beginPath(); g.moveTo(x1 - r * 1.6, cy - r * 0.8); g.lineTo(x1 - r * 0.6, cy - r * 1.9); g.lineTo(x1 - r * 0.2, cy - r * 1.9); g.lineTo(x1 - r * 0.4, cy - r * 0.6);
  g.moveTo(x1 - r * 1.6, cy + r * 0.8); g.lineTo(x1 - r * 0.6, cy + r * 1.9); g.lineTo(x1 - r * 0.2, cy + r * 1.9); g.lineTo(x1 - r * 0.4, cy + r * 0.6); g.stroke();
  for (const dx of [r * 0.25, r * 0.75]) { g.beginPath(); g.ellipse(x1 + dx, cy, r * 0.14, r * 1.05, 0, 0, Math.PI * 2); g.stroke(); }
  // section joints (dashed) and the warhead section hatched (no internal detail invented)
  g.setLineDash([4 * k, 3 * k]); g.lineWidth = 1.1 * k;
  for (const f of [0.26, 0.52, 0.74]) { const xx = x0 + (x1 - x0) * f; g.beginPath(); g.moveTo(xx, cy - r); g.lineTo(xx, cy + r); g.stroke(); }
  g.setLineDash([]);
  g.save(); g.beginPath(); g.rect(x0, cy - r, (x1 - x0) * 0.26, r * 2); g.clip();
  g.lineWidth = 0.9 * k; g.globalAlpha = 0.55;
  for (let xx = x0 - r * 2; xx < x0 + (x1 - x0) * 0.26; xx += 5 * k) { g.beginPath(); g.moveTo(xx, cy + r); g.lineTo(xx + r * 2, cy - r); g.stroke(); }
  g.restore();
  // dimension line + caption (clear type on the negative)
  g.lineWidth = 1 * k; g.globalAlpha = 0.7;
  g.beginPath(); g.moveTo(x0, cy + r * 2.4); g.lineTo(x1, cy + r * 2.4); g.moveTo(x0, cy + r * 2.0); g.lineTo(x0, cy + r * 2.8); g.moveTo(x1, cy + r * 2.0); g.lineTo(x1, cy + r * 2.8); g.stroke();
  g.globalAlpha = 0.8; g.fillStyle = clear; g.font = `500 ${12 * k}px ${FONT.type}`;
  g.fillText('TORPEDO, 533 mm — DIAGRAM, NOT TO SCALE', x + 16 * k, y + h - 16 * k);
  g.fillText('WARHEAD', x0 + 4 * k, cy - r * 1.6);
  g.restore();
}

/* ---------- chart negative (Natural Earth coastlines, our drawing) ---------- */
export const CHART = { w: 1000, h: 800, lon0: -74.5, lat0: 23.6, k: 40, kc: Math.cos(23.6 * Math.PI / 180) };
export const chartXY = (lon, lat) => [CHART.w / 2 + (lon - CHART.lon0) * CHART.k * CHART.kc, CHART.h / 2 - (lat - CHART.lat0) * CHART.k];

function chart(geo, seed) {
  const k = RES, c = canvas(CHART.w * k, CHART.h * k), g = c.getContext('2d');
  const clear = css(FILM.clear), dense = css([FILM.dense[0] + 4, FILM.dense[1] + 2, FILM.dense[2]]);
  const land = css([FILM.dense[0] + 34, FILM.dense[1] + 15, FILM.dense[2] + 5]);
  const P = (lon, lat) => chartXY(lon, lat).map(v => v * k);
  // sheet rebate (clear) + image area (dense = chart paper)
  g.fillStyle = clear; g.fillRect(0, 0, c.width, c.height);
  const m = 16 * k; g.fillStyle = dense; g.fillRect(m, m, c.width - 2 * m, c.height - 2 * m);
  g.save(); g.beginPath(); g.rect(m, m, c.width - 2 * m, c.height - 2 * m); g.clip();
  // land tint
  g.fillStyle = land;
  for (const f of geo.features) for (const ring of f.rings) { g.beginPath(); ring.forEach(([lo, la], i) => (i ? g.lineTo(...P(lo, la)) : g.moveTo(...P(lo, la)))); g.closePath(); g.fill(); }
  // graticule
  g.strokeStyle = 'rgba(240,168,96,0.32)'; g.lineWidth = 1 * k; g.setLineDash([2 * k, 6 * k]);
  for (let lo = -85; lo <= -60; lo += 5) { g.beginPath(); g.moveTo(...P(lo, 40)); g.lineTo(...P(lo, 5)); g.stroke(); }
  for (let la = 15; la <= 35; la += 5) { g.beginPath(); g.moveTo(...P(-100, la)); g.lineTo(...P(-50, la)); g.stroke(); }
  g.setLineDash([]);
  // coastlines (clear lines)
  g.strokeStyle = 'rgba(246,180,110,0.95)'; g.lineWidth = 1.7 * k; g.lineJoin = 'round';
  for (const f of geo.features) for (const ring of f.rings) { g.beginPath(); ring.forEach(([lo, la], i) => (i ? g.lineTo(...P(lo, la)) : g.moveTo(...P(lo, la)))); g.closePath(); g.stroke(); }
  // labels (clear type)
  g.fillStyle = 'rgba(246,184,116,0.9)';
  const lab = (s, lo, la, size, track = 0.25, italic = false) => {
    g.font = `${italic ? 400 : 500} ${size * k}px ${FONT.type}`; g.letterSpacing = `${size * track * k}px`;
    const [x, y] = P(lo, la); g.fillText(s, x, y);
  };
  lab('CUBA', -80.2, 22.3, 24); lab('FLORIDA', -82.4, 28.2, 17); lab('BAHAMAS', -77.4, 25.9, 15);
  lab('HISPANIOLA', -73.4, 18.0, 15); lab('ATLANTIC OCEAN', -70.5, 28.6, 17, 0.35); lab('CARIBBEAN SEA', -79.5, 16.4, 17, 0.35);
  g.letterSpacing = '0px'; g.font = `400 ${13 * k}px ${FONT.type}`; g.fillStyle = 'rgba(240,168,96,0.7)';
  for (let lo = -85; lo <= -65; lo += 5) { const [x] = P(lo, 0); g.fillText(`${-lo}°W`, x + 4 * k, m + 40 * k); }
  for (let la = 15; la <= 30; la += 5) { const [, y] = P(0, la); g.fillText(`${la}°N`, m + 34 * k, y - 5 * k); }
  // neatline
  g.strokeStyle = 'rgba(246,180,110,0.8)'; g.lineWidth = 1.4 * k; g.strokeRect(m + 22 * k, m + 22 * k, c.width - 2 * m - 44 * k, c.height - 2 * m - 44 * k);
  g.lineWidth = 0.8 * k; g.strokeRect(m + 28 * k, m + 28 * k, c.width - 2 * m - 56 * k, c.height - 2 * m - 56 * k);
  g.font = `400 ${11 * k}px ${FONT.type}`; g.fillText('COASTLINES: NATURAL EARTH 1:50m — DRAWN FOR THIS FILM', m + 30 * k, c.height - m - 8 * k);
  g.restore();
  baseTexture(g, c.width, c.height, seed);
  // sheet-film notch code (top edge, right): cut away
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.moveTo(c.width - 60 * k, 0); g.lineTo(c.width - 52 * k, 9 * k); g.lineTo(c.width - 44 * k, 0); g.fill();
  g.beginPath(); g.arc(c.width - 30 * k, 0, 5 * k, 0, Math.PI); g.fill();
  g.globalCompositeOperation = 'source-over';
  return c;
}

/* ---------- sheet film (4×5) holding the B-59 photo; image area is a separate develop canvas ---------- */
export const SHEET = { w: 800, h: 640, m: 14 };
function sheetBase(seed) {
  const k = RES, c = canvas(SHEET.w * k, SHEET.h * k), g = c.getContext('2d');
  g.fillStyle = css(FILM.clear); g.fillRect(0, 0, c.width, c.height);
  baseTexture(g, c.width, c.height, seed);
  g.fillStyle = 'rgba(70,30,10,0.7)'; g.font = `500 ${10 * k}px ${FONT.type}`;
  g.fillText('SAFETY  4×5', 40 * k, (SHEET.h - 3.5) * k);
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.moveTo(c.width - 70 * k, 0); g.lineTo(c.width - 62 * k, 9 * k); g.lineTo(c.width - 54 * k, 0); g.fill();
  g.beginPath(); g.moveTo(c.width - 44 * k, 0); g.lineTo(c.width - 36 * k, 9 * k); g.lineTo(c.width - 28 * k, 0); g.fill();
  g.globalCompositeOperation = 'source-over';
  return c;
}

/* ---------- glass dust tile, tape fibre tile, fingerprints ---------- */
function dustTile(seed) {
  const S = 512, c = canvas(S, S), g = c.getContext('2d');
  for (let i = 0; i < 260; i++) {
    const x = r01(seed, i) * S, y = r01(seed + 1, i) * S, r = 0.4 + 1.6 * r01(seed + 2, i) ** 3;
    g.fillStyle = `rgba(60,70,78,${0.12 + 0.3 * r01(seed + 3, i)})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  for (let j = 0; j < 5; j++) {
    let x = r01(seed + 5, j) * S, y = r01(seed + 6, j) * S, a = r01(seed + 7, j) * 6.28;
    g.strokeStyle = 'rgba(60,70,78,0.22)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 30; s++) { a += (vnoise(s * 10, j * 40, 30, seed) - 0.5) * 0.8; x += Math.cos(a) * 2.2; y += Math.sin(a) * 2.2; g.lineTo(x, y); }
    g.stroke();
  }
  return c;
}
function tapeTile(seed) {
  const S = 256, c = canvas(S, S), g = c.getContext('2d'), id = g.createImageData(S, S), d = id.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const f = (vnoise(x, y * 0.25, 6, seed) - 0.5) * 30 + (vnoise(x, y, 24, seed + 1) - 0.5) * 22 + (hash(x, y, seed) - 0.5) * 10;
    const i = (y * S + x) * 4; d[i] = 211 + f; d[i + 1] = 204 + f; d[i + 2] = 187 + f * 0.9; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0); return c;
}
function printsCanvas(seed, w, h) {
  const c = canvas(w * RES, h * RES), g = c.getContext('2d');
  fingerprint(g, c.width * 0.5, c.height * 0.5, c.width * 0.42, c.height * 0.46, r01(seed) * 3, seed);
  return c;
}

/* ---------- B-59 develop data: negative + positive + threshold field ---------- */
function developData(img) {
  const DK = 1.25, w = Math.round((SHEET.w - 2 * SHEET.m) * DK), h = Math.round((SHEET.h - 2 * SHEET.m) * DK);
  const L = greyCrop(img, w, h, [0.5, 0.5]);
  const neg = new Uint8ClampedArray(w * h * 4), pos = new Uint8ClampedArray(w * h * 4), th = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, gr = grain(x, y, 59), nx = x / w - 0.5, ny = y / h - 0.52;
    const fall = 1 - 0.25 * (nx * nx + ny * ny) * 2;
    const a = negPx(L[i] * fall, gr), b = posPx(L[i] * fall, gr);
    neg.set([a[0], a[1], a[2], 255], i * 4); pos.set([b[0], b[1], b[2], 255], i * 4);
    // where the picture comes up first: centre (the boat) outward, with a mottled front; darker areas a little earlier
    th[i] = clamp(Math.hypot(nx * 1.1, ny * 1.35) * 1.15 * 0.62 + vnoise(x, y, 26, 7) * 0.26 + L[i] * 0.12);
  }
  return { w, h, DK, neg, pos, th };
}

async function build(ctx) {
  const [geo, b59, b36, rand, beale] = await Promise.all([
    fetch(ctx.asset('assets/caribbean.json')).then(r => r.json()),
    loadImage(ctx.asset('assets/b59-surfaced-1962.jpg')),
    loadImage(ctx.asset('assets/b36-cecil-1962.jpg')),
    loadImage(ctx.asset('assets/randolph-1962.jpg')),
    loadImage(ctx.asset('assets/uss-beale-1964.jpg')),
  ]);
  const A = strip(6, 7, 11, (i, g, x, y, w, h) => {
    if (i === 0) negFrame(rand, [0.5, 0.42], 31)(i, g, x, y, w, h);
    else if (i === 1) negFrame(beale, [0.6, 0.55], 32)(i, g, x, y, w, h);
    else if (i === 2) negFrame(b36, [0.45, 0.6], 33)(i, g, x, y, w, h);
    // frames 4–6: unexposed, clear base only
  });
  const B = strip(1, 21, 13, torpedoFrame, { leadL: 130, leadR: 40 });
  const singles = [22, 23, 24].map((n, j) => strip(1, n, 40 + j, () => {}, { leadL: 0, leadR: 0 }));
  const out = {
    stripA: { url: await toURL(A.c), w: A.Wu, h: FR.H, lead: 60 },
    stripB: { url: await toURL(B.c), w: B.Wu, h: FR.H, lead: 130 },
    singles: await Promise.all(singles.map(async s => ({ url: await toURL(s.c), w: s.Wu, h: FR.H }))),
    chart: { url: await toURL(chart(geo, 21)), w: CHART.w, h: CHART.h },
    sheet: { url: await toURL(sheetBase(51)), w: SHEET.w, h: SHEET.h },
    dust: await toURL(dustTile(5)),
    tape: await toURL(tapeTile(9)),
    prints: await Promise.all([1, 2, 3].map(s => toURL(printsCanvas(s * 13, 120, 150)))),
    develop: developData(b59),
  };
  return out;
}
