// MOSAIC style test — the whole 26 s film as ONE stone floor that is laid, then re-laid.
// All four scene modules draw this shared world at global time (scene i = voice paragraph i).
//
// Beat table (times = words.json, global s)
// P1 MAP      0–6.9   hook/context  KNOW: Oct 1962, a sub near Cuba · FEEL: curiosity · SEE: tiles laying the Caribbean
//             tiles lay outline-first over a red-ochre sketch; date letters lay with "October… sixty-two";
//             B-59 marker flips in on "submarine"; camera pushes to it (truth: EV-derived coastline, RC position "approx.")
// P2 SECTION  5.4–14  rising  KNOW: depth charges above, no word from Moscow · FEEL: dread · SEE: sub deep under blue rows
//             re-lay from the marker; ships lay on "American ships"; 3 charges sink and burst as scattered tiles (RC)
// P3 VOTE     13.5–22 crisis  KNOW: nuclear torpedo, 3 must agree, 2 yes · FEEL: tension · SEE: two figures re-laid in
//             terracotta (VO — symbolic figures, no faces; vote as told in later accounts)
// P4 NO       21.5–end peak→resolution  KNOW: Arkhipov said no; known ~2002 · FEEL: relief/awe · SEE: the gold-glass NO
//             (gold appears ONLY here) re-laid from the third figure. Then hold + slow push.
import { clamp, progress, rand, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { buildTiles, drawTiles, inside, sinopia, mortarBed, hex, pickW } from './mosaic.js';

// ---------- palette (stone + one glass) ----------
const P = {
  mortar: [140, 133, 121],
  marble: ['#EFE9DD', '#E4DCCC', '#F4F0E8', '#DDD3C1'].map(hex),
  trav: ['#D8C8A6', '#CCB994', '#E1D5BB', '#C4AF88'].map(hex),
  slate: ['#2B2F35', '#353A41', '#40464E'].map(hex),
  slateMid: ['#535A63', '#606770'].map(hex),
  terra: ['#A44C2C', '#B35E39', '#C06F48'].map(hex),
  deep: ['#1C335A', '#213C68'].map(hex),
  lapis: ['#2C4E83', '#33598F'].map(hex),
  mid: ['#44709F', '#4D79A8'].map(hex),
  light: ['#7198BD', '#7FA3C3'].map(hex),
  pale: ['#A9C2D5', '#9DB8CD'].map(hex),
  gold: ['#CDA03A', '#DDB54E', '#BC8D2B', '#E8C762', '#D4A945'].map(hex),
};
const one = (list, r) => list[Math.floor(r * list.length) % list.length];

export const FONT = { label: "'Fraunces', serif", tiles: "'Bricolage Grotesque', sans-serif" };

// camera ease (0.45,0,0.15,1) — asymmetric, long settle
function bez(x1, y1, x2, y2) {
  const B = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) { const x = B(x1, x2, t) - p, dx = (B(x1, x2, t + 1e-4) - B(x1, x2, t)) / 1e-4; if (!dx) break; t -= x / dx; t = clamp(t, 0, 1); }
    return B(y1, y2, t);
  };
}
const camEase = bez(0.45, 0, 0.15, 1);
const enterEase = bez(0.16, 1, 0.3, 1);

// keep the floor covering the whole frame (no bare edge after a push)
const cover = (c, W, H) => ({ s: c.s, ox: clamp(c.ox, W - W * c.s, 0), oy: clamp(c.oy, H - H * c.s, 0) });

// ---------- shapes ----------
function ring(g, x, y, w, h, bw) { g.beginPath(); g.rect(x, y, w, h); g.rect(x + bw, y + bw, w - 2 * bw, h - 2 * bw); g.fill('evenodd'); }
function borderRegions(W, H, L) {
  const s1 = L.px(13), s2 = L.px(11);
  return [
    { name: 'border-outer', s: s1, draw: g => ring(g, 0, 0, W, H, s1 * 2), color: (i, r) => one(P.slate, r(20)) },
    { name: 'border-inner', s: s2, draw: g => ring(g, s1 * 2, s1 * 2, W - s1 * 4, H - s1 * 4, s2), color: (i, r) => one(P.marble, r(20)) },
  ];
}
function subShape(g, cx, cy, len) {
  const L2 = len / 2, ht = len * 0.12, h = ht / 2;
  g.beginPath();
  g.moveTo(cx - L2, cy + h * 0.1);
  g.bezierCurveTo(cx - L2 * 0.72, cy - h * 0.85, cx - L2 * 0.35, cy - h, cx - L2 * 0.1, cy - h);
  g.lineTo(cx + L2 * 0.74, cy - h);
  g.bezierCurveTo(cx + L2 * 0.97, cy - h, cx + L2, cy - h * 0.25, cx + L2, cy + h * 0.05);
  g.bezierCurveTo(cx + L2, cy + h * 0.55, cx + L2 * 0.9, cy + h, cx + L2 * 0.7, cy + h);
  g.lineTo(cx - L2 * 0.25, cy + h);
  g.bezierCurveTo(cx - L2 * 0.62, cy + h, cx - L2 * 0.86, cy + h * 0.45, cx - L2, cy + h * 0.1);
  g.closePath(); g.fill();
  // sail (conning tower), forward of midships
  g.beginPath();
  g.moveTo(cx + L2 * 0.0, cy - h + 1);
  g.lineTo(cx + L2 * 0.07, cy - h - ht * 0.95);
  g.lineTo(cx + L2 * 0.27, cy - h - ht * 0.98);
  g.quadraticCurveTo(cx + L2 * 0.39, cy - h - ht * 0.62, cx + L2 * 0.44, cy - h + 1);
  g.closePath(); g.fill();
  // stern planes
  g.beginPath(); g.moveTo(cx - L2 * 0.86, cy); g.lineTo(cx - L2 * 0.98, cy - ht * 0.75); g.lineTo(cx - L2 * 0.9, cy - ht * 0.75); g.lineTo(cx - L2 * 0.76, cy - h * 0.6); g.closePath(); g.fill();
}
function shipShape(g, xb, len, wy, dir) { // dir = -1: bow on the left
  const X = f => xb + dir * f * len, hh = len * 0.085;
  const poly = pts => { g.beginPath(); pts.forEach(([f, y], i) => (i ? g.lineTo(X(f), y) : g.moveTo(X(f), y))); g.closePath(); g.fill(); };
  poly([[0, wy - hh * 1.25], [0.07, wy + hh * 0.35], [0.95, wy + hh * 0.35], [1, wy - hh * 0.7], [0.08, wy - hh * 0.95]]);
  poly([[0.24, wy - hh * 0.9], [0.24, wy - hh * 2.05], [0.4, wy - hh * 2.05], [0.42, wy - hh * 0.9]]);       // bridge
  poly([[0.42, wy - hh * 0.9], [0.42, wy - hh * 1.5], [0.66, wy - hh * 1.5], [0.66, wy - hh * 0.9]]);       // deckhouse
  poly([[0.45, wy - hh * 1.4], [0.46, wy - hh * 2.5], [0.52, wy - hh * 2.5], [0.53, wy - hh * 1.4]]);       // stack 1
  poly([[0.57, wy - hh * 1.4], [0.58, wy - hh * 2.4], [0.64, wy - hh * 2.4], [0.65, wy - hh * 1.4]]);       // stack 2
  poly([[0.31, wy - hh * 2], [0.315, wy - hh * 3.9], [0.345, wy - hh * 3.9], [0.35, wy - hh * 2]]);         // mast
  poly([[0.12, wy - hh * 0.95], [0.12, wy - hh * 1.45], [0.2, wy - hh * 1.45], [0.21, wy - hh * 0.95]]);    // gun
}
function figureShape(g, cx, foot, h) {
  // a standing officer in a greatcoat and peaked cap — silhouette only, no face (VO: symbolic figure)
  const r = h * 0.064, hy = foot - h + r * 1.9;
  g.beginPath(); g.ellipse(cx, hy, r * 0.92, r * 1.05, 0, 0, Math.PI * 2); g.fill();                 // head
  g.beginPath(); g.ellipse(cx, hy - r * 0.95, r * 1.45, r * 0.42, 0, 0, Math.PI * 2); g.fill();     // cap top
  g.beginPath(); g.moveTo(cx - r * 1.0, hy - r * 0.8); g.lineTo(cx + r * 1.0, hy - r * 0.8); g.lineTo(cx + r * 1.25, hy - r * 0.45); g.lineTo(cx - r * 0.7, hy - r * 0.45); g.closePath(); g.fill(); // peak
  g.fillRect(cx - r * 0.42, hy + r * 0.7, r * 0.84, r * 0.9);                                        // neck
  const sy = hy + r * 1.45, sw = h * 0.135, hipY = foot - h * 0.44, coatY = foot - h * 0.16;
  g.beginPath();                                                                                     // greatcoat body
  g.moveTo(cx - sw * 0.45, sy - r * 0.1);
  g.quadraticCurveTo(cx - sw * 0.95, sy, cx - sw, sy + r * 0.9);
  g.lineTo(cx - sw * 0.82, hipY); g.lineTo(cx - sw * 1.0, coatY); g.lineTo(cx + sw * 1.0, coatY); g.lineTo(cx + sw * 0.82, hipY);
  g.lineTo(cx + sw, sy + r * 0.9); g.quadraticCurveTo(cx + sw * 0.95, sy, cx + sw * 0.45, sy - r * 0.1);
  g.closePath(); g.fill();
  const gap = h * 0.02, aw = h * 0.06;                                                              // arms, a hair apart from the body
  for (const sg of [-1, 1]) {
    const x0 = cx + sg * (sw + gap), x1 = cx + sg * (sw * 0.92 + gap);
    g.beginPath(); g.moveTo(x0, sy + r * 0.6);
    g.quadraticCurveTo(x0 + sg * aw * 1.1, sy + r * 0.3, x0 + sg * aw, sy + r * 1.4);
    g.lineTo(x1 + sg * aw * 0.9, foot - h * 0.4); g.quadraticCurveTo(x1 + sg * aw * 0.45, foot - h * 0.36, x1, foot - h * 0.41);
    g.closePath(); g.fill();
  }
  const lw = h * 0.075, lg = h * 0.03;                                                               // legs + boots
  g.fillRect(cx - lg / 2 - lw, coatY - 2, lw, foot - coatY + 2); g.fillRect(cx + lg / 2, coatY - 2, lw, foot - coatY + 2);
}
function torpedoShape(g, x0, x1, cy, dia, part = 'body') {
  const r = dia / 2;
  if (part === 'band') { g.fillRect(x1 - dia * 3.2, cy - r - 2, dia * 0.42, dia + 4); g.fillRect(x1 - dia * 2.5, cy - r - 2, dia * 0.16, dia + 4); return; }
  g.beginPath();
  g.moveTo(x0 + dia * 1.6, cy - r);
  g.lineTo(x1 - dia * 0.9, cy - r);
  g.ellipse(x1 - dia * 0.9, cy, dia * 0.9, r, 0, -Math.PI / 2, Math.PI / 2);
  g.lineTo(x0 + dia * 1.6, cy + r);
  g.quadraticCurveTo(x0 + dia * 0.9, cy + r * 0.9, x0 + dia * 0.45, cy + r * 0.55);
  g.lineTo(x0 + dia * 0.45, cy - r * 0.55);
  g.quadraticCurveTo(x0 + dia * 0.9, cy - r * 0.9, x0 + dia * 1.6, cy - r);
  g.closePath(); g.fill();
  g.fillRect(x0, cy - r * 0.95, dia * 0.42, r * 1.9);                                                 // propeller block
}
// ---------- map ----------
async function loadMap(url) { return (await fetch(url)).json(); }

// ---------- build everything for one format ----------
const cache = new Map();
export function getWorld(ctx) {
  if (!cache.has(ctx.format)) cache.set(ctx.format, build(ctx));
  return cache.get(ctx.format);
}

async function build(ctx) {
  const L = ctx.layout, W = L.width, H = L.height, px = L.px, pick = L.pick, S = L.safe;
  const map = await loadMap(ctx.asset('assets/caribbean.json'));
  const pics = [], overlays = [], labels = [];

  // ===== P1 — MAP =====
  const lon0 = pick({ landscape: -78.9, portrait: -76.9 }), lat0 = pick({ landscape: 23.9, portrait: 24.6 });
  const kc = Math.cos((24 * Math.PI) / 180), kk = W / (pick({ landscape: 22, portrait: 13.5 }) * kc);
  const proj = (lon, lat) => [W / 2 + (lon - lon0) * kk * kc, H / 2 + (lat0 - lat) * kk];
  const drawFeat = (g, test) => {
    g.beginPath();
    for (const f of map.features) if (test(f.name)) for (const ring of f.rings) ring.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.fill('nonzero');
  };
  const subLL = [-71.2, 25.4];
  const subXY = proj(...subLL);
  const dateFont = pick({ landscape: px(136), portrait: px(150) });
  const dateBox = pick({ landscape: [S.x + px(40), S.y + px(30)], portrait: [S.x + S.w - px(40), S.y + px(40)] });
  const dateAlign = pick({ landscape: 'left', portrait: 'right' });
  const seaWave = { flow: 'halo', halo: 1, amp: px(7), len: px(380), s: px(17), kind: 'sea' };
  const seaColor = (i, r) => {
    if (i.contour) return one(P.mid, r(20));
    const band = ((i.k % 7) + 7) % 7;
    return [P.mid, P.lapis, P.mid, P.light, P.mid, P.lapis, P.deep][band][Math.floor(r(21) * 2)];
  };
  const landColor = base => (i, r) => (i.k === 0 ? one(P.slate, r(20)) : i.k === 1 && base === P.trav ? one([P.trav[3], P.trav[1]], r(20)) : one(base, r(20)));
  const p1 = buildTiles({
    w: W, h: H, seed: 11, regions: [
      { name: 'sea', ...seaWave, draw: g => g.fillRect(0, 0, W, H), color: seaColor },
      { name: 'land', s: px(13), draw: g => drawFeat(g, n => n !== 'Cuba'), color: landColor(P.trav) },
      { name: 'cuba', s: px(13), draw: g => drawFeat(g, n => n === 'Cuba'), color: landColor(P.terra) },
      { name: 'date', s: px(10), shadeVar: 0.08, draw: g => {
          g.font = `800 ${dateFont}px ${FONT.tiles}`; g.textAlign = dateAlign; g.textBaseline = 'top'; g.letterSpacing = `${px(6)}px`;
          g.fillText('27 OCT', dateBox[0], dateBox[1]); g.fillText('1962', dateBox[0], dateBox[1] + dateFont * 0.86);
        }, color: (i, r) => (i.k === 0 ? one([P.marble[3], P.marble[1]], r(20)) : one(P.marble, r(20))) },
      ...borderRegions(W, H, L),
    ],
  });
  // lay order: border → coast outlines (west→east) → land fill → date (in reading order, synced to the words) → sea
  for (const T of p1.tiles) {
    const j = T.seed * 0.12, xf = T.x / W;
    if (T.reg.startsWith('border')) T.tIn = 0.05 + ((Math.atan2(T.y - H / 2, T.x - W / 2) + Math.PI) / (2 * Math.PI)) * 0.8 + j;
    else if (T.reg === 'land' || T.reg === 'cuba') T.tIn = (T.k === 0 ? 0.15 + xf * 0.9 : 0.55 + xf * 0.9 + T.k * 0.04) + j;
    else if (T.reg === 'date') {
      const line2 = T.y > dateBox[1] + dateFont * 0.8, lx = (T.x - (dateAlign === 'left' ? dateBox[0] : dateBox[0] - dateFont * 2.6)) / (dateFont * 2.6);
      T.tIn = (line2 ? 2.05 + lx * 0.9 : 0.55 + lx * 1.0) + j * 0.5;
    } else T.tIn = 0.9 + xf * 1.5 + rand(T.k * 3.3) * 0.15 + j * 2;
  }
  const subLen = px(74);
  const subOv = buildTiles({
    x: subXY[0] - px(80), y: subXY[1] - px(80), w: px(160), h: px(160), seed: 12, regions: [
      { name: 'ring', s: px(9), draw: g => { g.beginPath(); g.arc(subXY[0], subXY[1], px(64), 0, 7); g.arc(subXY[0], subXY[1], px(55), 0, 7); g.fill('evenodd'); }, color: (i, r) => one(P.marble, r(20)) },
      { name: 'sub', s: px(7), draw: g => subShape(g, subXY[0], subXY[1] + px(4), subLen), color: (i, r) => one(P.slate, r(20)) },
    ],
  });
  for (const T of subOv.tiles) {
    T.inMode = 'flip';
    T.tIn = T.reg === 'sub' ? 3.78 + (Math.hypot(T.x - subXY[0], T.y - subXY[1]) / subLen) * 0.5 + T.seed * 0.05
      : 4.25 + ((Math.atan2(T.y - subXY[1], T.x - subXY[0]) + Math.PI) / (2 * Math.PI)) * 0.5;
  }
  // P1 camera: tiny creep, then a push to the marker (it ends where the submarine sits in P2)
  const sub2 = pick({ landscape: [W * 0.44, H * 0.66], portrait: [W * 0.46, H * 0.6] });
  const cam1 = t => {
    const e = camEase(progress(t, 3.95, 6.6));
    const s = 1 + 0.012 * progress(t, 0, 3.95) + 1.15 * e;
    const tx = subXY[0] + (sub2[0] - subXY[0]) * e, ty = subXY[1] + (sub2[1] - subXY[1]) * e;
    const c0 = 1 + 0.012 * progress(t, 0, 3.95);
    if (e <= 0) return { s: c0, ox: W / 2 - (W / 2) * c0, oy: H / 2 - (H / 2) * c0 };
    return cover({ s, ox: tx - subXY[0] * s, oy: ty - subXY[1] * s }, W, H);
  };
  const sin1 = sinopia(p1);
  pics.push({ id: 'P1', set: p1, cam: cam1, sinopia: sin1, sinAlpha: t => 1 - progress(t, 2.6, 3.6) });
  overlays.push({ id: 'P1-sub', base: 'P1', set: subOv, cam: cam1 });
  labels.push(
    { id: 'Label Cuba', text: 'CUBA', pic: 'P1', at: proj(-79.2, 21.65), from: 2.2, to: 4.4, size: 40, color: '#2B2F35', halo: 'rgba(232,222,200,0.85)' },
    { id: 'Label Florida', text: 'FLORIDA', pic: 'P1', at: proj(-81.3, 27.6), from: 2.4, to: 4.3, size: 32, color: '#2B2F35', halo: 'rgba(232,222,200,0.85)' },
    { id: 'Label B-59', text: 'B-59', sub: 'position approx.', pic: 'P1', at: [subXY[0], subXY[1] + px(78)], from: 4.35, to: 6.2, size: 40, color: '#F2EEE6', halo: 'rgba(28,40,64,0.8)', align: 'center' },
  );

  // ===== P2 — SECTION UNDER THE SEA =====
  const surf = pick({ landscape: H * 0.3, portrait: H * 0.3 });
  const subLen2 = pick({ landscape: W * 0.4, portrait: W * 0.66 });
  const shipLen = pick({ landscape: W * 0.235, portrait: W * 0.4 });
  const ships = pick({ landscape: [[W * 0.67, 1], [W * 0.93, 1]], portrait: [[W * 0.5, 1], [W * 0.93, 1]] }); // [bow x, dir] bows face left (toward the sub)
  const wavyTop = g => {
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, surf + Math.sin(x / px(70)) * px(5) + Math.sin(x / px(23)) * px(2));
    g.lineTo(W, H); g.closePath(); g.fill();
  };
  const depthColor = (i, r) => {
    const f = clamp((i.y - surf) / (H - surf));
    if (i.contour) return one(f < 0.15 ? P.pale : f < 0.5 ? P.mid : P.lapis, r(20));
    const band = ((i.k % 5) + 5) % 5, jit = (r(22) - 0.5) * 0.18;
    const ff = f + jit + (band === 2 ? -0.12 : band === 4 ? 0.1 : 0);
    const tier = ff < 0.08 ? P.pale : ff < 0.25 ? P.light : ff < 0.5 ? P.mid : ff < 0.75 ? P.lapis : P.deep;
    return one(tier, r(20));
  };
  const p2 = buildTiles({
    w: W, h: H, seed: 21, regions: [
      { name: 'sky', flow: 'wave', amp: 0, len: 999, s: px(19), draw: g => g.fillRect(0, 0, W, surf + px(20)),
        color: (i, r) => (i.y > surf - px(60) ? one(P.marble, r(20)) : one([P.marble[0], P.marble[1], P.trav[2]], r(20))) },
      { name: 'sea', flow: 'halo', halo: 1, amp: px(9), len: px(340), s: px(17), kind: 'sea', draw: wavyTop, color: depthColor },
      { name: 'sub', s: px(12), draw: g => subShape(g, sub2[0], sub2[1], subLen2),
        color: (i, r) => (i.k === 0 ? [36, 40, 45] : i.y < sub2[1] - subLen2 * 0.03 && i.k <= 2 ? one(P.slateMid, r(20)) : one(P.slate, r(20))) },
      { name: 'ships', s: px(9), draw: g => ships.forEach(([xb]) => shipShape(g, xb - shipLen, shipLen, surf, 1)),
        color: (i, r) => (i.k === 0 ? one(P.slate, r(20)) : one([P.slate[2], P.slateMid[0]], r(20))) },
      ...borderRegions(W, H, L),
    ],
  });
  pics.push({ id: 'P2', set: p2, cam: null });
  // ships are laid on "American ships" (8.07–8.95): until then their tiles wait; re-lay handles the rest
  const plaqueText = 'MOSCOW · SILENT FOR DAYS';
  const plFont = pick({ landscape: px(38), portrait: px(36) });
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = `600 ${plFont}px ${FONT.label}`; meas.letterSpacing = `${plFont * 0.1}px`;
  const plW = meas.measureText(plaqueText).width + px(70), plH = px(92), ear = px(40);
  const plC = pick({ landscape: [S.x + px(30) + ear + plW / 2, S.y + px(26) + plH / 2], portrait: [W / 2 - px(20), S.y + px(150)] });
  const tabula = (g, inset = 0) => {
    const x0 = plC[0] - plW / 2 + inset, x1 = plC[0] + plW / 2 - inset, y0 = plC[1] - plH / 2 + inset, y1 = plC[1] + plH / 2 - inset, e = ear - inset * 0.5;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 + e, plC[1] - plH * 0.3); g.lineTo(x1 + e * 0.6, plC[1]); g.lineTo(x1 + e, plC[1] + plH * 0.3);
    g.lineTo(x1, y1); g.lineTo(x0, y1); g.lineTo(x0 - e, plC[1] + plH * 0.3); g.lineTo(x0 - e * 0.6, plC[1]); g.lineTo(x0 - e, plC[1] - plH * 0.3); g.closePath(); g.fill();
  };
  const plOv = buildTiles({
    x: plC[0] - plW / 2 - ear - px(10), y: plC[1] - plH / 2 - px(10), w: plW + 2 * ear + px(20), h: plH + px(20), seed: 22, regions: [
      { name: 'plaque', s: px(11), draw: g => tabula(g), color: (i, r) => (i.k === 0 ? one(P.terra, r(20)) : one(P.slate, r(20))) },
    ],
  });
  for (const T of plOv.tiles) { T.inMode = 'flip'; T.tIn = 10.85 + ((T.x - plC[0] + plW / 2 + ear) / (plW + 2 * ear)) * 0.45 + T.seed * 0.06; }
  overlays.push({ id: 'P2-plaque', base: 'P2', set: plOv, cam: null, backing: g => tabula(g, -px(3)) });
  labels.push(
    { id: 'Label B-59 (section)', text: 'B-59', sub: 'Soviet submarine, Project 641', pic: 'P2', at: [sub2[0] - subLen2 * 0.18, sub2[1] + subLen2 * 0.1], from: 7.0, to: 10.0, size: 40, color: '#F2EEE6', halo: 'rgba(20,32,56,0.85)', align: 'center' },
    { id: 'Label US ships', text: 'US NAVY', pic: 'P2', at: [ships[0][0] - shipLen * 0.5, surf - shipLen * 0.36], from: 8.3, to: 12.9, size: 36, color: '#2B2F35', halo: 'rgba(240,234,222,0.9)', align: 'center' },
    { id: 'Plaque text', text: plaqueText, pic: 'P2', at: plC, from: 11.25, to: 14.0, size: plFont / L.unit, color: '#EFE9DD', halo: 'rgba(30,33,38,0.6)', align: 'center', middle: true, track: 0.1 },
  );
  // depth charges: [drop x, drop time, burst time, burst point]
  const subTop = sub2[1] - subLen2 * 0.06;
  const charges = pick({
    landscape: [[W * 0.5, 9.25, 10.0, [W * 0.5, subTop - px(70)]], [W * 0.6, 9.6, 10.62, [W * 0.58, subTop - px(20)]], [W * 0.36, 10.15, 11.32, [W * 0.34, subTop - px(110)]]],
    portrait: [[W * 0.4, 9.25, 10.0, [W * 0.42, subTop - px(90)]], [W * 0.62, 9.6, 10.62, [W * 0.62, subTop - px(40)]], [W * 0.25, 10.15, 11.32, [W * 0.24, subTop - px(150)]]],
  });
  const BR = pick({ landscape: px(190), portrait: px(170) });
  const burstEnv = a => (a <= 0 ? 0 : (1 - Math.exp(-a / 0.045)) * Math.exp(-a / 0.5));
  const fx2 = (T, t) => {
    if (t < 9.9 || t > 13.5) return null;
    let dx = 0, dy = 0, rot = 0, mixA = 0;
    for (const [, , tb, [bx, by]] of charges) {
      const a = t - tb; if (a <= 0 || a > 2.2) continue;
      const vx = T.x - bx, vy = T.y - by, r = Math.hypot(vx, vy) + 1e-3;
      if (r > BR * 1.9) continue;
      const fall = (1 - r / (BR * 1.9)) ** 1.6, env = burstEnv(a);
      const throwF = r < BR * 0.45 ? 2.4 : 1;
      const m = env * px(30) * fall * throwF;
      if (T.reg === 'sub' || T.reg === 'ships') { const sh = env * px(3) * fall; dx += noise1(t * 40, T.seed * 9) * sh; dy += noise1(t * 40, T.seed2 * 9) * sh; continue; }
      dx += (vx / r) * m; dy += (vy / r) * m - env * px(10) * fall; rot += env * fall * (T.seed - 0.5) * 2.2;
      if (r < BR * 0.8) mixA = Math.max(mixA, Math.exp(-a / 0.4) * (1 - r / (BR * 0.8)) * 0.85);
    }
    return { dx, dy, rot, mix: [238, 234, 224, mixA] };
  };
  pics[1].fx = fx2;
  const cam2 = t => {
    const s = 1 + 0.035 * progress(t, 5.3, 14);
    let shx = 0, shy = 0;
    for (const [, , tb] of charges) { const e = burstEnv(t - tb) * px(4); shx += noise1(t * 23, tb) * e; shy += noise1(t * 23, tb + 3) * e; }
    return cover({ s, ox: sub2[0] - sub2[0] * s + shx, oy: sub2[1] - sub2[1] * s + shy }, W, H);
  };
  pics[1].cam = cam2; overlays[1].cam = cam2;

  // ===== P3 — THE VOTE (inside: dark slate ground, symbolic figures) =====
  const torY = pick({ landscape: H * 0.25, portrait: H * 0.25 });
  const torX = pick({ landscape: [W * 0.14, W * 0.86], portrait: [W * 0.1, W * 0.86] });
  const torD = pick({ landscape: px(104), portrait: px(112) });
  const figH = pick({ landscape: H * 0.42, portrait: H * 0.3 });
  const foot = pick({ landscape: H * 0.85, portrait: H * 0.72 });
  const figX = pick({ landscape: [W * 0.28, W * 0.5, W * 0.72], portrait: [S.x + S.w * 0.18, S.x + S.w * 0.5, S.x + S.w * 0.82] });
  const fieldColor = (i, r) => (i.contour ? one([P.slate[0], P.slate[1]], r(20)) : pickW([[P.slate[0], 5], [P.slate[1], 4], [P.slate[2], 2], [[36, 39, 44], 3]], r(20)));
  const figColor = (i, r) => (i.k === 0 ? one([P.trav[3], P.trav[1]], r(20)) : one(P.trav, r(20)));
  const p3 = buildTiles({
    w: W, h: H, seed: 31, regions: [
      { name: 'field', flow: 'halo', halo: 1, amp: px(5), len: px(520), s: px(16), draw: g => g.fillRect(0, 0, W, H), color: fieldColor },
      { name: 'torpedo', s: px(11), draw: g => torpedoShape(g, torX[0], torX[1], torY, torD),
        color: (i, r) => (i.k === 0 ? [128, 124, 116] : i.y < torY - torD * 0.12 ? one(P.marble, r(20)) : one([[184, 178, 167], [196, 190, 179]], r(20))) },
      { name: 'torpedo-band', s: px(11), draw: g => torpedoShape(g, torX[0], torX[1], torY, torD, 'band'), color: (i, r) => one(P.slateMid, r(20)) },
      ...borderRegions(W, H, L),
    ],
  });
  // the three officers are an overlay: the slate floor is complete, then they turn up on "three officers" (16.51)
  const figOv = buildTiles({
    x: 0, y: foot - figH - px(30), w: W, h: figH + px(60), seed: 33,
    regions: figX.map((x, n) => ({ name: `fig${n + 1}`, s: px(10), draw: g => figureShape(g, x, foot, figH), color: figColor })),
  });
  for (const T of figOv.tiles) {
    const n = +T.reg[3] - 1, yf = (T.y - (foot - figH)) / figH;
    T.inMode = 'flip'; T.tIn = 16.35 + n * 0.12 + yf * 0.3 + T.seed * 0.05;
    // "Two say yes" (18.29 / 18.55): figures 1 and 2 re-laid in terracotta, top to bottom
    if (n < 2) T.flips = [{ t: [18.3, 18.56][n] + yf * 0.35 + T.seed * 0.05, col: (T.k === 0 ? P.terra[0] : one(P.terra, T.seed2)).map(v => v * (0.94 + T.seed * 0.12)) }];
  }
  const S3 = pick({ landscape: 1.45, portrait: 1.2 });
  const fig3C = [figX[2], foot - figH * 0.5];
  const fig3T = pick({ landscape: [W * 0.76, H * 0.53], portrait: [W * 0.68, H * 0.6] });
  const cam3 = t => {
    const c = 1 + 0.02 * progress(t, 13.3, 19.9);
    const e = camEase(progress(t, 19.95, 21.45));
    const s = c + (S3 - c) * e;
    const tx = W / 2 + (fig3T[0] - W / 2) * e, ty = H / 2 + (fig3T[1] - H / 2) * e;
    const fx = W / 2 + (fig3C[0] - W / 2) * e, fy = H / 2 + (fig3C[1] - H / 2) * e; // world point that sits at (tx,ty)
    return cover({ s, ox: tx - fx * s, oy: ty - fy * s }, W, H);
  };
  const c3 = cam3(21.45), fig3S = [fig3C[0] * c3.s + c3.ox, fig3C[1] * c3.s + c3.oy];
  pics.push({ id: 'P3', set: p3, cam: cam3 });
  overlays.push({ id: 'P3-figs', base: 'P3', set: figOv, cam: cam3 });
  const roleSize = pick({ landscape: 32, portrait: 30 });
  const lt = pick({ landscape: true, portrait: false });
  labels.push(
    { id: 'Label torpedo', text: 'NUCLEAR TORPEDO', sub: 'T-5 · yield approx. 10 kt', pic: 'P3', at: [W / 2, torY + torD * 0.8], from: 14.55, to: 19.9, size: 40, color: '#EFE9DD', halo: 'rgba(30,33,38,0.7)', align: 'center' },
    ...(lt ? [
      { id: 'Role 1', text: 'COMMANDER', pic: 'P3', at: [figX[0], foot + px(18)], from: 16.7, to: 19.9, size: roleSize, color: '#D8C8A6', align: 'center' },
      { id: 'Role 2', text: 'POLITICAL\nOFFICER', pic: 'P3', at: [figX[1], foot + px(18)], from: 16.8, to: 19.9, size: roleSize, color: '#D8C8A6', align: 'center' },
      { id: 'Role 3', text: 'CHIEF\nOF STAFF', pic: 'P3', at: [figX[2], foot + px(18)], from: 16.9, to: 20.0, size: roleSize, color: '#D8C8A6', align: 'center' },
    ] : []),
    { id: 'Yes 1', text: 'YES', pic: 'P3', at: [figX[0], foot - figH - px(lt ? 62 : 56)], from: 18.32, to: 19.9, size: 44, color: '#D07A50', halo: 'rgba(30,33,38,0.7)', align: 'center' },
    { id: 'Yes 2', text: 'YES', pic: 'P3', at: [figX[1], foot - figH - px(lt ? 62 : 56)], from: 18.58, to: 19.9, size: 44, color: '#D07A50', halo: 'rgba(30,33,38,0.7)', align: 'center' },
    { id: 'Vote note', text: 'as told in later accounts', italic: true, pic: 'P3', at: pick({ landscape: [S.x + S.w - px(10), S.y + S.h - px(4)], portrait: [S.x + S.w / 2, foot + px(70)] }), from: 18.7, to: 19.9, size: 30, color: '#B9B3A7', align: pick({ landscape: 'right', portrait: 'center' }), bottom: lt },
  );

  // ===== P4 — NO (gold glass, the only gold in the film) =====
  const f4 = [fig3S[0], fig3S[1] + figH * S3 * 0.5, figH * S3]; // matched to the end of the P3 push
  const p4 = buildTiles({
    w: W, h: H, seed: 41, regions: [
      { name: 'field', flow: 'halo', halo: 1, amp: px(5), len: px(520), s: px(16), draw: g => g.fillRect(0, 0, W, H), color: fieldColor },
      { name: 'fig3', s: px(12), draw: g => figureShape(g, f4[0], f4[1], f4[2]), color: figColor },
      ...borderRegions(W, H, L),
    ],
  });
  pics.push({ id: 'P4', set: p4, cam: null });
  const noSize = pick({ landscape: px(560), portrait: px(430) });
  const noC = pick({ landscape: [W * 0.37, H * 0.46], portrait: [W * 0.5, H * 0.3] });
  const noOv = buildTiles({
    x: noC[0] - noSize * 0.9, y: noC[1] - noSize * 0.55, w: noSize * 1.8, h: noSize * 1.1, seed: 42, regions: [
      { name: 'no', s: px(15), kind: 'gold', shadeVar: 0.34, draw: g => {
          g.font = `800 ${noSize}px ${FONT.tiles}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = `${px(10)}px`;
          g.fillText('NO', noC[0], noC[1] + noSize * 0.04);
        }, color: (i, r) => (i.k === 0 ? one([P.gold[2], P.gold[0]], r(20)) : one(P.gold, r(20))) },
    ],
  });
  const cam4 = t => { const s = 1 + 0.025 * progress(t, 22.4, 26); return { s, ox: noC[0] - noC[0] * s, oy: noC[1] - noC[1] * s }; };
  pics[3].cam = cam4;
  noOv.glint = (T, t) => 1 + 0.32 * Math.max(0, Math.sin((T.x + T.y * 0.6) / px(260) - (t - 22.4) * 1.6)) ** 10;
  overlays.push({ id: 'P4-no', base: 'P4', set: noOv, cam: cam4 });
  labels.push(
    { id: 'Name Arkhipov', text: pick({ landscape: 'VASILI ARKHIPOV', portrait: 'VASILI\nARKHIPOV' }), pic: 'P3', at: pick({ landscape: [figX[2], foot + px(18)], portrait: [figX[2] - figH * 0.2, foot - figH * 0.55] }), from: 20.62, to: 21.6, size: 34, color: '#EFE9DD', align: pick({ landscape: 'center', portrait: 'right' }), hideRole: true },
    { id: 'Name Arkhipov (P4)', text: pick({ landscape: 'VASILI ARKHIPOV', portrait: 'VASILI\nARKHIPOV' }), pic: 'P4', at: pick({ landscape: [f4[0], f4[1] + px(26)], portrait: [f4[0] - f4[2] * 0.24, H * 0.6] }), from: 21.6, to: 99, size: 46, color: '#EFE9DD', halo: 'rgba(30,33,38,0.7)', align: pick({ landscape: 'center', portrait: 'right' }), sub: pick({ landscape: 'flotilla chief of staff, B-59', portrait: 'flotilla chief\nof staff, B-59' }), noEnter: true },
    { id: 'Known 2002', text: 'HIS STORY WIDELY KNOWN ONLY IN 2002', pic: 'P4', at: pick({ landscape: [noC[0], noC[1] + noSize * 0.5], portrait: [W / 2, S.y + px(14)] }), from: 24.12, to: 99, size: pick({ landscape: 40, portrait: 34 }), color: '#E8C762', halo: 'rgba(30,33,38,0.7)', align: 'center' },
  );

  // ===== re-lays (the signature move): old tiles turn over in a wave, new tiles turn up behind it =====
  const screenOf = (cam, t, X, Y) => { const c = cam(t); return [X * c.s + c.ox, Y * c.s + c.oy]; };
  const relay = (from, to, T0, origin, v, opts = {}) => {
    for (const Tl of from.set.tiles) {
      const [x, y] = screenOf(from.cam, T0, Tl.x, Tl.y);
      Tl.tOut = Math.min(Tl.tOut, T0 + Math.hypot(x - origin[0], y - origin[1]) / v + Tl.seed * 0.1);
    }
    for (const ov of overlays) if (ov.base === from.id) for (const Tl of ov.set.tiles) {
      const [x, y] = screenOf(ov.cam, T0, Tl.x, Tl.y);
      Tl.tOut = Math.min(Tl.tOut, T0 + Math.hypot(x - origin[0], y - origin[1]) / v + Tl.seed * 0.1);
    }
    for (const Tl of to.set.tiles) {
      const [x, y] = screenOf(to.cam, T0, Tl.x, Tl.y);
      Tl.inMode = 'flip';
      Tl.tIn = Math.max(T0 + 0.09 + Math.hypot(x - origin[0], y - origin[1]) / v + Tl.seed * 0.1, Tl.delay ?? -1);
    }
  };
  // P1→P2 from the marker ("deep in the sea", 5.42)
  relay(pics[0], pics[1], 5.4, screenOf(cam1, 5.4, ...subXY), px(1250));
  for (const T of p2.tiles) if (T.reg === 'ships') T.tIn = Math.max(T.tIn, 7.95 + ((T.x - W * 0.4) / (W * 0.6)) * 0.55 + T.seed * 0.08); // "American ships"
  // P2→P3 from the submarine ("On board", 13.67)
  relay(pics[1], pics[2], 13.45, screenOf(cam2, 13.45, ...sub2), px(1300));
  // P3→P4 from the third figure ("says", 21.69)
  relay(pics[2], pics[3], 21.42, fig3S, px(1700));
  // the gold NO arrives as a second wave behind the first and punches the slate field
  const noOrigin = [f4[0], f4[1] - f4[2] * 0.6];
  for (const T of noOv.tiles) { T.inMode = 'flip'; T.tIn = 21.72 + Math.hypot(T.x - noOrigin[0], T.y - noOrigin[1]) / px(2600) + T.seed * 0.08; }
  // overlays punch out the base tiles under them (the base tile turns over as the new one turns up)
  for (const ov of overlays) {
    const base = pics.find(p => p.id === ov.base);
    const tMin = Math.min(...ov.set.tiles.map(t => t.tIn));
    for (const T of base.set.tiles) {
      const pts = [[T.x, T.y], [T.x + T.ux * T.s * 0.32, T.y + T.uy * T.s * 0.32], [T.x - T.ux * T.s * 0.32, T.y - T.uy * T.s * 0.32]];
      if (pts.some(([x, y]) => inside(ov.set, x, y))) {
        let best = Infinity;
        for (const o of ov.set.tiles) { const d = (o.x - T.x) ** 2 + (o.y - T.y) ** 2; if (d < best) { best = d; T.tOut = Math.min(T.tOut, Math.max(tMin, o.tIn - 0.06)); } }
      }
    }
  }
  // sea shimmer: a slow light crest travelling along the rows (≈ 1.8 % W/s, ≤ 8 % brightness)
  const lam = px(560), om = (2 * Math.PI * px(34)) / lam;
  const shimmer = (T, t) => 1 + 0.08 * Math.max(0, Math.sin((2 * Math.PI * T.x) / lam + T.k * 0.55 - t * om)) ** 4;
  p1.shimmer = shimmer; p2.shimmer = shimmer;

  pics.forEach(p => {
    p.t0 = Math.min(...p.set.tiles.map(t => t.tIn));
    p.t1 = Math.max(...p.set.tiles.map(t => t.tOut)) + 0.25;
  });
  overlays.forEach(o => { o.t0 = Math.min(...o.set.tiles.map(t => t.tIn)); o.t1 = Math.max(...o.set.tiles.map(t => t.tOut)) + 0.25; });
  const bed = mortarBed(W, H, P.mortar);
  return { W, H, L, pics, overlays, labels, bed, P, charges: charges.map(([x, td, tb, b]) => [x, td, tb, b, surf]) };
}

// ---------- per-scene mount: canvas + labels; draws the world at global time ----------
export async function mount(root, ctx) {
  const world = await getWorld(ctx);
  const { W, H, L, pics, overlays } = world;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H; cv.dataset.name = 'Mosaic floor';
  Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
  root.appendChild(cv);
  const g = cv.getContext('2d');
  const layer = document.createElement('div');
  Object.assign(layer.style, { position: 'absolute', inset: 0 });
  root.appendChild(layer);
  const labs = world.labels.map(lb => {
    const el = document.createElement('div');
    el.dataset.name = lb.id;
    const fs = L.px(lb.size);
    Object.assign(el.style, {
      position: 'absolute', left: 0, top: 0, whiteSpace: 'pre', fontFamily: FONT.label, fontWeight: lb.italic ? 400 : 600,
      fontStyle: lb.italic ? 'italic' : 'normal', fontSize: fs + 'px', lineHeight: 1.08, color: lb.color,
      letterSpacing: lb.italic ? '0' : `${lb.track ?? 0.08}em`, textAlign: lb.align ?? 'left',
      textShadow: lb.halo ? `0 0 ${L.px(3)}px ${lb.halo}, 0 0 ${L.px(8)}px ${lb.halo}, 0 0 ${L.px(14)}px ${lb.halo}` : `0 ${L.px(2)}px ${L.px(6)}px rgba(0,0,0,0.6)`,
      fontFeatureSettings: '"kern","lnum"', fontKerning: 'normal', opacity: 0, willChange: 'transform,opacity',
    });
    const main = document.createElement('div'); main.textContent = lb.text; el.appendChild(main);
    if (lb.sub) {
      const s = document.createElement('div'); s.textContent = lb.sub;
      Object.assign(s.style, { fontWeight: 400, fontStyle: 'italic', letterSpacing: '0', fontSize: fs * 0.72 + 'px', marginTop: L.px(4) + 'px' });
      el.appendChild(s);
    }
    layer.appendChild(el);
    return { lb, el, w: 0, h: 0 };
  });
  labs.forEach(o => { o.w = o.el.offsetWidth; o.h = o.el.offsetHeight; });
  const camOf = id => (pics.find(p => p.id === id) ?? overlays.find(p => p.id === id)).cam;

  function draw(t) {
    // bed (moves with the newest visible picture's camera)
    const live = pics.filter(p => t >= p.t0 - 0.05 && t < p.t1);
    const top = live[live.length - 1] ?? pics[0];
    const ct = top.cam(t);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = `rgb(${world.P.mortar.join(',')})`; g.fillRect(0, 0, W, H);
    g.setTransform(ct.s * 2, 0, 0, ct.s * 2, ct.ox, ct.oy); g.drawImage(world.bed, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    for (const p of live) {
      const c = p.cam(t);
      if (p.sinopia) {
        const a = p.sinAlpha(t);
        if (a > 0) { g.globalAlpha = a; g.setTransform(c.s / p.set.R, 0, 0, c.s / p.set.R, c.ox, c.oy); g.drawImage(p.sinopia, 0, 0); g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0); }
      }
      drawTiles(g, p.set, t, c, p.fx);
      for (const ov of overlays) if (ov.base === p.id && t >= ov.t0 && t < ov.t1) {
        const oc = ov.cam(t);
        drawTiles(g, ov.set, t, oc, null);
      }
      // falling depth charges (P2): small dark capsules with a short trail of white bubbles
      if (p.id === 'P2') drawCharges(g, t, c, world);
    }
    // labels
    for (const o of labs) {
      const { lb, el } = o;
      if (lb.hideRole) { /* the name replaces role 3 */ }
      const vis = t >= lb.from && t < lb.to;
      if (!vis) { el.style.opacity = 0; continue; }
      const roleHidden = lb.id === 'Role 3' && t >= 20.62;
      const cam = camOf(lb.pic)(t);
      let x = lb.at[0] * cam.s + cam.ox, y = lb.at[1] * cam.s + cam.oy;
      if (lb.align === 'center') x -= o.w / 2; else if (lb.align === 'right') x -= o.w;
      if (lb.middle) y -= o.h / 2;
      if (lb.bottom) y -= o.h;
      const a = lb.noEnter ? 1 : enterEase(progress(t, lb.from, lb.from + 0.45));
      const out = 1 - progress(t, lb.to - 0.25, lb.to);
      y += (1 - a) * L.px(14);
      x = Math.max(L.safe.x, Math.min(L.safe.x + L.safe.w - o.w, x));
      el.style.opacity = roleHidden ? 0 : Math.min(a, out).toFixed(3);
      el.style.transform = a >= 1 ? `translate(${Math.round(x)}px, ${Math.round(y)}px)` : `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    }
  }
  return { draw };
}

function drawCharges(g, t, c, world) {
  const { L } = world;
  // geometry is rebuilt from the same numbers as in build() via world.charges (set lazily)
  const ch = world.charges; if (!ch) return;
  for (const [x0, td, tb, [bx, by], y0] of ch) {
    if (t < td || t >= tb) continue;
    const p = (t - td) / (tb - td), e = p * p * (3 - 2 * p) * 0.4 + p * 0.6;
    const x = x0 + (bx - x0) * e + Math.sin(p * 9) * L.px(3), y = y0 + (by - y0) * e;
    const X = x * c.s + c.ox, Y = y * c.s + c.oy, s = L.px(9) * c.s;
    // bubbles trail above
    for (let k = 0; k < 4; k++) {
      const bt = (t - td) - k * 0.12; if (bt < 0) continue;
      const bxp = X + Math.sin(k * 2.1 + bt * 6) * s * 0.8, byp = Y - s * (2.2 + k * 1.6) - bt * s * 0.6;
      g.fillStyle = 'rgba(239,233,221,0.85)'; g.fillRect(bxp - s * 0.32, byp - s * 0.32, s * 0.64, s * 0.64);
    }
    g.fillStyle = 'rgba(28,26,24,0.5)';
    g.fillRect(X - s * 0.6 + 1.5, Y - s * 1.5 + 2, s * 1.2, s * 3);
    g.fillStyle = '#2B2F35'; g.fillRect(X - s * 0.6, Y - s * 1.5, s * 1.2, s * 0.92); g.fillRect(X - s * 0.6, Y - s * 0.46, s * 1.2, s * 0.92); g.fillRect(X - s * 0.6, Y + s * 0.58, s * 1.2, s * 0.92);
  }
}
