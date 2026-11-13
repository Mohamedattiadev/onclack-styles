// The six sketchbook pages (3 spreads). Each builder draws into a 1000 × 1400 page and animates from GLOBAL time,
// so the same page looks identical in every scene that shows it (also on the turning leaf).
// truth codes: map scrap = EV-derived (Natural Earth, printed look) · photo = EV (US Navy, NARA) · drawings = RC/VO.
import { C, FONT, F, el, svg, pageSvg, penDrawing, pencil, hand, wash, tape, tornClip, place, dense, ellipse, sketch } from './kit.js';

/* ---------- shapes (local coordinates) ---------- */
const SUB = {
  hullTop: [[-320, 0], [-302, -24], [-252, -35], [-60, -36], [240, -33], [298, -19], [320, 0]],
  hullBot: [[320, 0], [296, 21], [220, 33], [-60, 36], [-240, 35], [-296, 24], [-320, 0]],
  sail: [[-92, -35], [-78, -90], [-60, -103], [18, -104], [31, -92], [44, -34]],
  mast1: [[-24, -104], [-24, -142]], mast2: [[-4, -104], [-3, -128]],
  ridge: [[-262, -13], [0, -14], [262, -11]],
  plane1: [[298, -19], [334, -35]], plane2: [[296, 20], [332, 31]],
  prop1: [[322, -9], [338, 8]], prop2: [[322, 8], [338, -8]],
};
const subStrokes = (o, seed = 1, w = 3.4) => [
  { pts: place(dense(SUB.hullTop, 50), o), pass2: true, seed: seed, w },
  { pts: place(dense(SUB.hullBot, 50), o), seed: seed + 1, w },
  { pts: place(SUB.sail, o), pass2: true, seed: seed + 2, w },
  { pts: place(SUB.mast1, o), seed: seed + 3, w: w * 0.8, over: 2 }, { pts: place(SUB.mast2, o), seed: seed + 4, w: w * 0.8, over: 2 },
  { pts: place(dense(SUB.ridge, 60), o), seed: seed + 5, w: w * 0.6, opacity: 0.7 },
  { pts: place(SUB.plane1, o), seed: seed + 6, w: w * 0.8 }, { pts: place(SUB.plane2, o), seed: seed + 7, w: w * 0.8 },
  { pts: place(SUB.prop1, o), seed: seed + 8, w: w * 0.7, over: 1 }, { pts: place(SUB.prop2, o), seed: seed + 9, w: w * 0.7, over: 1 },
  ...Array.from({ length: 9 }, (_, i) => ({ pts: place([[-200 + i * 50, 16], [-186 + i * 50, 16]], o), seed: seed + 20 + i, w: w * 0.7, over: 0, jit: 0.8 })),
];
const SHIP = {
  hull: [[0, -6], [18, 15], [236, 15], [258, 2], [262, -6]],
  deck: [[0, -6], [262, -6]],
  sup: [[70, -6], [70, -27], [108, -27], [108, -42], [128, -42], [128, -27], [172, -27], [172, -6]],
  funnel: [[140, -27], [144, -52], [160, -52], [163, -27]],
  mast: [[118, -42], [118, -80]], yard: [[107, -67], [129, -67]],
  gun: [[38, -6], [38, -15], [56, -15], [56, -6]], barrel: [[38, -12], [20, -14]],
};
const shipStrokes = (o, seed) => Object.values(SHIP).map((pts, i) => ({ pts: place(pts.length > 2 ? dense(pts, 40) : pts, o), seed: seed + i, w: i < 2 ? 3.2 : 2.8, over: i < 2 ? 5 : 2, jit: 1.2 }));
const TORP = {
  top: [[-330, -40], [330, -40]], bot: [[-330, 40], [330, 40]],
  nose: [[-330, -40], [-368, -31], [-392, -14], [-400, 0], [-392, 14], [-368, 31], [-330, 40]],
  tailT: [[330, -40], [366, -23], [380, -10]], tailB: [[330, 40], [366, 23], [380, 10]],
  finT: [[346, -33], [366, -64], [384, -62], [372, -25]], finB: [[346, 33], [366, 64], [384, 62], [372, 25]],
  shaft: [[380, 0], [400, 0]], propA: [[392, -24], [398, 24]],
  band1: [[-215, -40], [-207, 0], [-215, 40]], band2: [[40, -40], [48, 0], [40, 40]], band3: [[262, -40], [270, 0], [262, 40]],
};
const torpStrokes = (o, seed) => Object.entries(TORP).map(([k, pts], i) => ({ pts: place(k === 'top' || k === 'bot' ? dense(pts, 60) : pts, o), seed: seed + i, w: k.startsWith('band') ? 2.4 : 3.4, pass2: k === 'top' || k === 'nose', over: k.startsWith('band') ? 1 : 5 }));
// officer, standing, seen from the front — no face (the head is an empty oval, as in a quick figure sketch)
const MAN = {
  cap: [[-46, 30], [-52, 9], [-30, -2], [30, -2], [53, 9], [46, 30]], band: [[-44, 30], [44, 30]], visor: [[-40, 32], [-10, 45], [32, 40]],
  head: ellipse(0, 74, 33, 41, 16, -Math.PI * 0.6, 1.06), ear: [[32, 66], [39, 72], [33, 84]],
  shL: [[-14, 116], [-16, 130], [-68, 146], [-86, 172], [-92, 300], [-86, 424]], shR: [[14, 116], [16, 130], [68, 146], [86, 172], [92, 300], [86, 424]],
  hem: [[-86, 424], [-20, 430], [20, 429], [86, 424]], collar: [[-16, 130], [0, 162], [16, 130]], front: [[0, 162], [2, 424]],
  armL: [[-86, 176], [-104, 268], [-100, 372]], armR: [[86, 176], [104, 268], [100, 372]],
  legL: [[-38, 430], [-40, 482]], legR: [[38, 430], [41, 482]],
};
const POSE = {
  hip: { armR: [[86, 176], [124, 246], [80, 296]] },                                   // hand on hip
  behind: { armL: [[-86, 176], [-100, 252], [-78, 306]], armR: [[86, 176], [100, 252], [78, 306]] }, // hands behind the back
  down: {},
};
const manStrokes = (o, seed, w = 3.2, pose = 'down') => [
  ...Object.entries({ ...MAN, ...POSE[pose] }).map(([k, pts], i) => ({ pts: place(pts.length > 3 ? dense(pts, 45) : pts, o), seed: seed + i, w: k === 'front' ? w * 0.7 : w, over: k.startsWith('leg') ? 2 : 4, jit: 1.6, pass2: k === 'shL' || k === 'cap' })),
  ...[196, 246, 296, 346].map((y, i) => ({ pts: place(ellipse(12, y, 4, 4, 8), o), seed: seed + 40 + i, w: w * 0.7, over: 0, jit: 0.4 })),
  // hatching on the shadow side (key light upper left)
  ...Array.from({ length: 6 }, (_, i) => ({ pts: place([[52, 206 + i * 34], [80, 188 + i * 34]], o), seed: seed + 50 + i, w: w * 0.55, over: 2, jit: 0.8, opacity: 0.8 })),
];
const MAN_SIL = [[-58, -10], [58, -10], [60, 32], [42, 44], [40, 112], [22, 126], [90, 148], [106, 300], [96, 428], [50, 436], [50, 488], [-50, 488], [-50, 436], [-96, 428], [-106, 300], [-90, 148], [-22, 126], [-40, 112], [-42, 44], [-60, 32]];
const polyPath = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';

/* ---------- page furniture ---------- */
function folio(pg, n, side) {
  hand(pg, String(n), { x: side === 'left' ? 84 : 880, y: 1318, size: 38, seed: 900 + n, t0: -99, name: `Page number ${n}`, opacity: 0.85 });
}
/* ===== PAGE 0 — date + pasted map scrap ===== */
export function page0(pg, ctx, T, side) {
  const geo = ctx.geo;
  const S = pageSvg(pg, 'Pen layer', 5);
  const dateA = hand(pg, 'Oct. 27,', { x: 100, y: 96, size: 132, seed: 11, rot: -1.5, t0: T.oct - 2 * F, cps: 9.5, name: '1A Date “Oct. 27,”' });
  const dateB = hand(pg, '1962', { x: 540, y: 232, size: 132, seed: 12, rot: -3, t0: T.y62 - 2 * F, cps: 5.2, name: '1A Date “1962”' });
  const under = penDrawing(S, [{ pts: dense([[548, 404], [700, 398], [866, 388]], 40), seed: 3, w: 3.6 }, { pts: dense([[560, 420], [760, 412], [850, 405]], 40), seed: 4, w: 2.8 }], T.y62end, T.y62end + 0.3, { name: 'Date underline' });

  // printed map scrap (torn from an atlas), taped in
  const sx = 95, sy = 488, sw = 820, sh = 640, srot = -2.2;
  const scrapWrap = el('div', { 'data-name': '1A Map scrap (Natural Earth, printed)', style: { position: 'absolute', left: sx + 'px', top: sy + 'px', width: sw + 'px', height: sh + 'px', transform: `rotate(${srot}deg)`, zIndex: 2, filter: 'drop-shadow(2px 3px 2px rgba(50,40,30,0.22))' } }, pg);
  const scrap = el('div', { style: { position: 'absolute', inset: 0, background: C.printSea, clipPath: tornClip(sw, sh, 7, { r: true, b: true }) } }, scrapWrap);
  const lon0 = -86.2, lat0 = 29.8, k = sw / (18.6 * 0.92), kc = 0.92;
  const pr = (lo, la) => [(lo - lon0) * k * kc, (lat0 - la) * k];
  const ms = svg('svg', { width: sw, height: sh, viewBox: `0 0 ${sw} ${sh}`, style: 'position:absolute;left:0;top:0' }, scrap);
  // sea lines (printed water-lining along the coasts is replaced by a fine screen of horizontal rules)
  for (let y = 6; y < sh; y += 7) svg('line', { x1: 0, x2: sw, y1: y, y2: y, stroke: '#9fb0b5', 'stroke-width': 0.8, opacity: 0.35 }, ms);
  let d = '';
  for (const f of geo.features) for (const r of f.rings) d += r.map(([lo, la], i) => { const [x, y] = pr(lo, la); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join('') + 'Z';
  svg('path', { d, fill: C.printLand, stroke: C.print, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, ms);
  for (const la of [20, 25]) { const [, y] = pr(-80, la); svg('line', { x1: 0, x2: sw, y1: y, y2: y, stroke: C.print, 'stroke-width': 0.9, 'stroke-dasharray': '6 5', opacity: 0.6 }, ms); const t = svg('text', { x: 30, y: y - 6, fill: C.print, 'font-family': FONT.print, 'font-size': 17 }, ms); t.textContent = `${la}°N`; }
  for (const lo of [-85, -80, -75, -70]) { const [x] = pr(lo, 25); svg('line', { x1: x, x2: x, y1: 0, y2: sh, stroke: C.print, 'stroke-width': 0.9, 'stroke-dasharray': '6 5', opacity: 0.6 }, ms); const t = svg('text', { x: x + 6, y: 46, fill: C.print, 'font-family': FONT.print, 'font-size': 17 }, ms); t.textContent = `${-lo}°W`; }
  const lab = (txt, lo, la, size, ital = false, ls = '0.22em') => { const [x, y] = pr(lo, la); const t = svg('text', { x, y, fill: C.print, 'font-family': FONT.print, 'font-weight': 500, 'font-size': size, 'letter-spacing': ls, 'font-style': ital ? 'italic' : 'normal', 'text-anchor': 'middle' }, ms); t.textContent = txt; };
  lab('CUBA', -79.2, 21.75, 26); lab('FLA.', -81.35, 27.6, 17, false, '0.12em'); lab('BAHAMAS', -75.0, 26.9, 18);
  lab('ATLANTIC  OCEAN', -70.8, 28.2, 21, true); lab('CARIBBEAN  SEA', -81.6, 19.0, 20, true);
  svg('rect', { x: 14, y: 14, width: sw - 28, height: sh - 28, fill: 'none', stroke: C.print, 'stroke-width': 1.4 }, ms);
  tape(pg, { x: 150, y: 500, rot: -38, seed: 3, name: 'Tape (map, top left)' });
  tape(pg, { x: 858, y: 470, rot: 24, seed: 5, w: 170, name: 'Tape (map, top right)' });

  // pen marks on the scrap: B-59 position, approx. (page coords through the scrap's rotation)
  const toPage = ([x, y]) => { const a = (srot * Math.PI) / 180, cx = sw / 2, cy = sh / 2; const dx = x - cx, dy = y - cy; return [sx + cx + dx * Math.cos(a) - dy * Math.sin(a), sy + cy + dx * Math.sin(a) + dy * Math.cos(a)]; };
  const [bx, by] = toPage(pr(-71.2, 25.4));
  ctx.subOnMap = [bx, by];
  const circ = penDrawing(S, [{ pts: ellipse(bx, by, 50, 40, 20, -2.2, 1.18), seed: 21, w: 3.6, jit: 2.4, over: 0 }], T.soviet - 2 * F, T.soviet + 0.42, { name: '1B Pen circle (B-59 approx.)' });
  const arrow = penDrawing(S, [{ pts: [[bx + 54, by + 38], [bx + 96, by + 112], [bx + 112, by + 150]], seed: 22, w: 3 }, { pts: [[bx + 52, by + 40], [bx + 50, by + 66]], seed: 23, w: 3, over: 1 }, { pts: [[bx + 52, by + 40], [bx + 76, by + 50]], seed: 24, w: 3, over: 1 }], T.soviet + 0.42, T.soviet + 0.62, { name: 'Arrow to B-59' });
  const lbl = hand(pg, 'B-59', { x: bx + 34, y: by + 150, size: 66, seed: 31, rot: -4, t0: T.submarine - 2 * F, cps: 11, name: '1B Note “B-59”' });
  const appr = hand(pg, 'approx.', { x: bx + 40, y: by + 226, size: 40, seed: 32, rot: -4, t0: lbl.t1 + 0.05, cps: 20, name: 'Note “approx.”' });
  folio(pg, 14, side);
  const parts = [dateA, dateB, under, circ, arrow, lbl, appr];
  return { update: (tg) => parts.forEach((p) => p.update(tg)) };
}

/* ===== PAGE 1 — the sea in section, the boat hiding deep ===== */
export function page1(pg, ctx, T, side) {
  const S = pageSvg(pg, 'Pen layer', 5);
  const P = pageSvg(pg, 'Pencil layer', 3);
  const so = { x: 520, y: 860, s: 1.08 };
  pencil(P, [
    { pts: dense([[90, 330], [910, 322]], 60), jit: 4 },
    { pts: place(dense(SUB.hullTop, 60), { ...so, x: so.x - 6, y: so.y + 4 }), jit: 5 }, { pts: place(dense(SUB.hullBot, 60), { ...so, x: so.x + 4 }), jit: 5 },
    { pts: place(SUB.sail, { ...so, x: so.x - 8 }), jit: 4 },
    { pts: [[120, 360], [120, 1180]], jit: 2, passes: 1 },
  ]);
  hand(pg, 'the sea, in section', { x: 560, y: 120, size: 40, color: C.pencil, seed: 41, rot: -1, t0: -99, name: 'Pencil note (plan)', opacity: 0.8 });
  // surface: a wavy pen line
  const wave = []; for (let x = 92; x <= 910; x += 22) wave.push([x, 326 + Math.sin(x * 0.07) * 5]);
  const surf = penDrawing(S, [{ pts: wave, seed: 51, w: 3, jit: 1.2, over: 4 }], T.submarine + 0.15, T.hides - 0.02, { name: '1C Sea surface' });
  const sub = penDrawing(S, subStrokes(so, 61), T.hides - 2 * F, T.hides + 0.62, { name: '1C Pen submarine' });
  const depth = penDrawing(S, [{ pts: [[122, 350], [120, 760], [122, 1150]], seed: 71, w: 3, pass2: false }, { pts: [[102, 1118], [122, 1158], [142, 1116]], seed: 72, w: 3, over: 1 },
    ...[480, 620, 760, 900, 1040].map((y, i) => ({ pts: [[110, y], [134, y]], seed: 73 + i, w: 2.4, over: 1 }))], T.deep - 0.25, T.deep + 0.18, { name: 'Depth arrow' });
  // the wash: Payne's grey runs down from the surface and closes round the boat (the boat "hides")
  const wet = `M138 352 C330 344 640 350 900 340 C915 520 880 640 920 820 C930 960 860 1040 760 1080 C640 1150 560 1100 470 1140 C360 1190 250 1120 190 1060 C150 960 170 860 150 760 C130 620 160 480 138 352 Z`;
  const W = wash(pg, { path: wet, color: C.payne, seed: 5, origin: [480, 350], t0: T.deep - 0.02, dur: 1.5, density: 0.5, blur: 18, rag: 0.8, x: 100, y: 300, w: 850, h: 920,
    grad: { y0: 360, y1: 1100, from: 0.35, to: 1.25 }, backrun: 0.35, gaps: 0, edge: 1.4, name: '1C Wash: Payne’s grey sea' });
  const deep = hand(pg, 'deep.', { x: 160, y: 1180, size: 62, seed: 81, rot: -3, t0: T.sea - 2 * F, cps: 11, name: 'Note “deep.”' });
  folio(pg, 15, side);
  const parts = [surf, sub, depth, W, deep];
  return { update: (tg) => parts.forEach((p) => p.update(tg)) };
}

/* ===== PAGE 2 — above it: ships, falling charges, bursts ===== */
export function page2(pg, ctx, T, side) {
  const S = pageSvg(pg, 'Pen layer', 5);
  const P = pageSvg(pg, 'Pencil layer', 3);
  const sea = 330, so = { x: 520, y: 1110, s: 0.5 };
  const s1 = { x: 150, y: sea - 9, s: 1.0 }, s2 = { x: 560, y: sea - 9, s: 0.92 };
  pencil(P, [{ pts: dense([[90, sea + 4], [910, sea]], 60), jit: 4 }, { pts: place(dense(SHIP.hull, 50), s1), jit: 4 }, { pts: place(dense(SHIP.hull, 50), s2), jit: 4 },
    { pts: place(dense(SUB.hullTop, 80), so), jit: 3 }, { pts: place(dense(SUB.hullBot, 80), so), jit: 3 }]);
  const sub = penDrawing(S, subStrokes(so, 101, 2.6).slice(0, 4), T.above - 2 * F, T.above + 0.4, { name: '2A Pen submarine (small, deep)' });
  const seaW = wash(pg, { path: `M120 ${sea + 16} C320 ${sea + 40} 620 ${sea + 4} 890 ${sea + 22} C860 560 930 760 870 960 C850 1120 900 1200 760 1250 C600 1230 470 1290 330 1240 C200 1230 150 1150 160 1000 C120 820 170 640 120 ${sea + 16} Z`, color: C.payne, seed: 25,
    origin: [520, 1110], t0: T.above + 0.3, dur: 1.4, density: 0.22, blur: 34, rag: 1.1, backrun: 0.3, edge: 1.2, grad: { y0: sea, y1: 1250, from: 0.08, to: 1.35 }, x: 60, y: sea - 20, w: 900, h: 1300 - sea, name: '2A Wash: sea (light)', z: 3 });
  hand(pg, 'US destroyers', { x: 330, y: 186, size: 32, color: C.pencil, seed: 181, rot: -1, t0: -99, name: 'Pencil note (ships)', opacity: 0.85 });
  hand(pg, 'B-59', { x: 700, y: 1150, size: 32, color: C.pencil, seed: 182, rot: -2, t0: -99, name: 'Pencil note (boat)', opacity: 0.85 });
  const wave = []; for (let x = 92; x <= 910; x += 22) wave.push([x, sea + Math.sin(x * 0.08 + 1) * 4]);
  const surf = penDrawing(S, [{ pts: wave, seed: 111, w: 3, jit: 1.2 }], T.above + 0.42, T.american - 0.02, { name: '2A Sea surface' });
  const ships = penDrawing(S, [...shipStrokes(s1, 121), ...shipStrokes(s2, 141)], T.american - 2 * F, T.ships + 0.3, { name: '2A Pen ships (US Navy, sketch)' });
  // falling charges: dotted lines from the ships
  const falls = [[[290, sea + 22], [296, 640]], [[650, sea + 22], [660, 720]], [[720, sea + 22], [612, 868]]];
  const dots = [];
  falls.forEach(([[ax, ay], [bx, by]], f) => { const n = Math.round(Math.hypot(bx - ax, by - ay) / 30); for (let i = 0; i < n; i++) { const q = i / n, x = ax + (bx - ax) * q, y = ay + (by - ay) * q; dots.push({ pts: [[x, y], [x + 1, y + 9]], seed: 160 + f * 40 + i, w: 3.2, over: 0, jit: 0.6 }); } });
  const fall = penDrawing(S, dots, T.drop - 2 * F, T.drop + 0.42, { name: '2B Falling charges (dotted)', lift: 0.004 });
  const prac = hand(pg, '“practice”', { x: 330, y: 452, size: 50, seed: 171, rot: -2, t0: T.practice - 2 * F, cps: 22, name: '2B Note “practice”' });
  // bursts: pen burst, then a grey bloom inside it (signature move, small)
  const bursts = [[296, 650, T.depth - 2 * F], [660, 728, T.charges - 2 * F], [612, 876, T.charges + 0.36]].map(([x, y, t], i) => {
    const rays = Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2 + i; return { pts: [[x + Math.cos(a) * 38, y + Math.sin(a) * 34], [x + Math.cos(a) * (58 + (k % 3) * 9), y + Math.sin(a) * (52 + (k % 3) * 8)]], seed: 200 + i * 20 + k, w: 2.8, over: 0 }; });
    const pen = penDrawing(S, [{ pts: ellipse(x, y, 30, 26, 14, i, 1.1), seed: 190 + i, w: 3.2, over: 0, jit: 2.2 }, ...rays], t, t + 0.2, { name: `2B Burst ${i + 1}` });
    const r = 64 + i * 6;
    const W = wash(pg, { path: polyPath(ellipse(x, y, r, r * 0.9, 20)), color: C.payne, seed: 30 + i, origin: [x, y], t0: t + 0.08, dur: 0.75, density: 0.62, blur: 12, rag: 0.9, x: x - r - 30, y: y - r - 30, w: 2 * r + 60, h: 2 * r + 60, name: `2B Wash burst ${i + 1}` });
    return { update: (tg) => { pen.update(tg); W.update(tg); } };
  });
  folio(pg, 16, side);
  const parts = [sub, seaW, surf, ships, fall, prac, ...bursts];
  return { update: (tg) => parts.forEach((p) => p.update(tg)) };
}

/* ===== PAGE 3 — the pasted photo + Moscow stub ===== */
export function page3(pg, ctx, T, side) {
  const ph = el('div', { 'data-name': '2C Photo B-59 (US Navy, NARA)', style: { position: 'absolute', left: '150px', top: '150px', width: '700px', height: '552px', background: '#F4F2EC', padding: '22px', transform: 'rotate(1.6deg)', zIndex: 2, boxShadow: '2px 4px 4px rgba(50,40,30,0.25), 0 0 0 1px rgba(60,50,40,0.08)' } }, pg);
  el('img', { src: ctx.asset('assets/b59-surfaced-1962.jpg'), style: { width: '656px', height: '508px', objectFit: 'cover', display: 'block', filter: 'grayscale(1) contrast(1.06) brightness(0.98) sepia(0.12)' } }, ph);
  tape(pg, { x: 190, y: 168, rot: -34, seed: 9, name: 'Tape (photo, left)' });
  tape(pg, { x: 812, y: 182, rot: 30, seed: 11, w: 170, name: 'Tape (photo, right)' });
  hand(pg, 'B-59 after surfacing · US Navy photo,\n28/29 Oct. (NARA)', { x: 170, y: 728, size: 38, seed: 301, rot: 0.8, t0: -99, name: 'Photo caption (written earlier)' });
  // the stub: a perforated slip used as a note tag
  const stub = el('div', { 'data-name': '2D Paper stub (note tag)', style: { position: 'absolute', left: '232px', top: '880px', width: '540px', height: '250px', transform: 'rotate(-2.6deg)', zIndex: 2, filter: 'drop-shadow(2px 3px 2px rgba(50,40,30,0.2))' } }, pg);
  el('div', { style: { position: 'absolute', inset: 0, clipPath: tornClip(540, 250, 13, { r: true }),
    background: `radial-gradient(circle at 14px 50%, rgba(0,0,0,0) 0 6px, transparent 6.5px) 0 0/28px 22px repeat-y, linear-gradient(90deg, rgba(120,100,70,0.12) 0 1px, transparent 1px) 30px 0/100% 100% no-repeat, #F6F0E1` } }, stub);
  const perf = svg('svg', { width: 30, height: 250, style: 'position:absolute;left:0;top:0' }, stub);
  for (let y = 12; y < 250; y += 18) svg('circle', { cx: 14, cy: y, r: 4.2, fill: '#DCCFB2' }, perf);
  tape(pg, { x: 760, y: 900, rot: 62, seed: 15, w: 150, h: 48, name: 'Tape (stub)' });
  const a = hand(stub, 'MOSCOW:', { x: 58, y: 26, size: 64, seed: 311, t0: T.moscow - 2 * F, cps: 13, name: '2D Note “MOSCOW:”' });
  const b = hand(stub, '— no word —', { x: 76, y: 104, size: 54, seed: 312, t0: T.silent - 2 * F, cps: 19, name: '2D Note “no word”' });
  const ss = svg('svg', { width: 540, height: 250, viewBox: '0 0 540 250', style: 'position:absolute;left:0;top:0;overflow:visible;z-index:7' }, stub);
  const tally = penDrawing(ss, [...Array.from({ length: 6 }, (_, i) => ({ pts: [[80 + i * 26, 182], [84 + i * 26, 226]], seed: 330 + i, w: 3, over: 2, opacity: 1 - i * 0.12 })),
    { pts: [[250, 214], [258, 214]], seed: 340, w: 4, over: 0 }, { pts: [[274, 214], [282, 214]], seed: 341, w: 4, over: 0 }, { pts: [[298, 214], [306, 214]], seed: 342, w: 4, over: 0 }],
  T.days - 2 * F, T.days + 0.55, { name: '2D Tally of days (uncounted)' });
  folio(pg, 17, side);
  const parts = [a, b, tally];
  return { update: (tg) => parts.forEach((p) => p.update(tg)) };
}

/* ===== PAGE 4 — on board: the torpedo ===== */
export function page4(pg, ctx, T, side) {
  const S = pageSvg(pg, 'Pen layer', 5);
  const P = pageSvg(pg, 'Pencil layer', 3);
  const to = { x: 500, y: 560, s: 1.0, rot: -3 };
  pencil(P, [{ pts: place(dense(TORP.top, 80), { ...to, y: to.y - 5 }), jit: 4 }, { pts: place(dense(TORP.bot, 80), { ...to, y: to.y + 4 }), jit: 4 }, { pts: place(TORP.nose, to), jit: 4 },
    { pts: [[96, 470], [930, 426]], jit: 2, passes: 1 }, { pts: [[96, 664], [930, 620]], jit: 2, passes: 1 }]);
  const head = hand(pg, 'On board:', { x: 100, y: 130, size: 84, seed: 401, rot: -2, t0: T.onboard - 2 * F, cps: 15, name: '3A Note “On board:”' });
  const torp = penDrawing(S, torpStrokes(to, 411), head.t1 - 0.05, T.torpedo + 0.12, { name: '3A Pen torpedo' });
  const bodyPath = polyPath(place([[-338, -52], [330, -52], [384, -14], [384, 14], [330, 52], [-338, 52], [-404, 10], [-404, -10]], to));
  const W = wash(pg, { path: bodyPath, color: C.payne, seed: 41, origin: place([[60, 0]], to)[0], t0: T.torpedo + 0.1, dur: 0.9, density: 0.42, blur: 8, rag: 0.6, backrun: 0.15, x: 70, y: 430, w: 870, h: 240, name: '3A Wash torpedo body' });
  const noseP = polyPath(place([[-212, -46], [-338, -46], [-402, 0], [-338, 46], [-212, 46]], to));
  const W2 = wash(pg, { path: noseP, color: C.payne, seed: 43, origin: place([[-300, 0]], to)[0], t0: T.torpedo + 0.45, dur: 0.8, density: 0.5, blur: 7, rag: 0.5, backrun: 0, x: 70, y: 450, w: 340, h: 220, name: '3A Wash warhead (darker)' });
  const nuc = hand(pg, 'nuclear', { x: 120, y: 690, size: 60, seed: 421, rot: -3, t0: T.torpedo + 0.5, cps: 16, name: '3A Note “nuclear”' });
  const lead = penDrawing(S, [{ pts: [[200, 700], [176, 640], [160, 600]], seed: 431, w: 2.8 }], T.torpedo + 0.42, T.torpedo + 0.55, { name: 'Leader to warhead' });
  const fire = hand(pg, 'to fire:', { x: 540, y: 820, size: 64, seed: 441, rot: -2, t0: T.fire - 2 * F, cps: 14, name: '3B Note “to fire:”' });
  const arr = penDrawing(S, [{ pts: [[770, 880], [860, 900], [930, 870], [978, 820]], seed: 451, w: 3.2 }, { pts: [[978, 820], [948, 826]], seed: 452, w: 3, over: 1 }, { pts: [[978, 820], [972, 850]], seed: 453, w: 3, over: 1 }], fire.t1, fire.t1 + 0.3, { name: '3B Arrow to the officers' });
  // colour test swatches in the margin (painters test the wash first) — the viridian is waiting
  const sw = [[110, 1150, C.payne, 0.35], [200, 1150, C.payne, 0.7], [290, 1150, C.viridian, 0.6]].map(([x, y, col, dn], i) =>
    wash(pg, { path: polyPath([[x, y], [x + 74, y + 3], [x + 72, y + 56], [x + 2, y + 54]]), color: col, seed: 60 + i, t0: -50, dur: 0.5, density: dn, blur: 5, rag: 0.8, x: x - 20, y: y - 20, w: 114, h: 96, name: `Test swatch ${i + 1}` }));
  hand(pg, 'P. grey', { x: 112, y: 1218, size: 30, color: C.pencil, seed: 461, t0: -99, name: 'Pencil swatch label', opacity: 0.85 });
  hand(pg, 'virid.', { x: 292, y: 1218, size: 30, color: C.pencil, seed: 462, t0: -99, name: 'Pencil swatch label 2', opacity: 0.85 });
  folio(pg, 18, side);
  const parts = [head, torp, W, W2, nuc, lead, fire, arr, ...sw];
  return { update: (tg) => parts.forEach((p) => p.update(tg)) };
}

/* ===== PAGE 5 — three officers; the third says no ===== */
export function page5(pg, ctx, T, side) {
  const S = pageSvg(pg, 'Pen layer', 5);
  const P = pageSvg(pg, 'Pencil layer', 3);
  const R = pageSvg(pg, 'Red pen layer', 9);
  const top = 300, sc = 0.88, xs = [180, 410, 700], poses = ['hip', 'behind', 'down'];
  const os = xs.map((x, i) => ({ x, y: top + (i === 1 ? 6 : 0), s: sc * (i === 1 ? 0.97 : 1), rot: [1.5, -1, 0.5][i] }));
  pencil(P, os.flatMap((o, i) => [{ pts: place(MAN.cap, o), seed: 500 + i, jit: 4 }, { pts: place(dense(MAN.shL, 60), o), seed: 510 + i, jit: 5 }, { pts: place(dense(MAN.shR, 60), o), seed: 520 + i, jit: 5 }, { pts: place(MAN.head, o), seed: 530 + i, jit: 4 }]));
  const boxY = top + 478 * sc + 46;
  ['capt.\nSavitsky', 'pol. officer\nMaslennikov', '?'].forEach((t, i) =>
    hand(pg, t, { x: xs[i] - 110, y: boxY + 76, w: 220, align: 'center', size: 34, color: C.pencil, seed: 541 + i, t0: -99, name: `Pencil label ${i + 1}`, opacity: 0.9 }));
  const figs = os.map((o, i) => penDrawing(S, [...manStrokes(o, 560 + i * 60, 3.2, poses[i]),
    { pts: [[xs[i] - 30, boxY], [xs[i] + 30, boxY + 1], [xs[i] + 29, boxY + 58], [xs[i] - 31, boxY + 57]], closed: true, seed: 600 + i * 60, w: 3, over: 0, smooth: false, jit: 1.5 }],
  T.three - 2 * F + i * 0.42, T.three - 2 * F + i * 0.42 + 0.4, { name: `3C Officer ${i + 1} (no face)` }));
  const ticks = [0, 1].map((i) => penDrawing(S, [{ pts: [[xs[i] - 20, boxY + 30], [xs[i] - 4, boxY + 48], [xs[i] + 34, boxY - 8]], seed: 640 + i, w: 4, over: 2, smooth: false }],
    (i ? T.yes : T.two) - 2 * F, (i ? T.yes : T.two) - 2 * F + 0.16, { name: `3D Tick yes ${i + 1}` }));
  const yes = [0, 1].map((i) => hand(pg, 'yes', { x: xs[i] + 44, y: boxY - 4, size: 54, seed: 651 + i, rot: -4, t0: (i ? T.yes : T.two) + 0.1, cps: 14, name: `3D Note “yes” ${i + 1}` }));
  // ---- s4: the third man. Pen goes over him firmly, then the one viridian wash blooms inside him.
  const o3 = os[2];
  const firm = penDrawing(S, manStrokes({ ...o3, x: o3.x + 1.5 }, 700, 4.2).slice(0, 11), T.third - 2 * F, T.vasili + 0.1, { name: '4A Officer 3 inked firmly' });
  const vir = wash(pg, { path: polyPath(place(MAN_SIL, o3)), color: C.viridian, seed: 77, origin: place([[0, 200]], o3)[0], t0: T.vasili - 2 * F, dur: 1.3, density: 0.52, blur: 16, rag: 0.7, backrun: 0.22, grad: { y0: 300, y1: 800, from: 0.8, to: 1.15 },
    x: o3.x - 140, y: top - 50, w: 280, h: 540, name: '4A Wash: viridian (Arkhipov)', z: 6 });
  const name = hand(pg, 'Vasili\nArkhipov', { x: xs[2] - 130, y: boxY + 126, w: 260, align: 'center', size: 50, seed: 671, rot: -3, t0: T.vasili + 0.05, cps: 17, name: '4A Note “Vasili Arkhipov”' });
  // red pen — only for the NO
  const no = hand(pg, 'NO', { x: 776, y: 352, size: 140, color: C.red, seed: 681, rot: -9, t0: T.no - 3 * F, cps: 9, name: '4B Red pen “NO”', weight: 500, z: 10 });
  const redU = penDrawing(R, [{ pts: dense([[792, 492], [876, 480], [962, 462]], 30), seed: 691, w: 5.2, color: C.red }, { pts: dense([[806, 512], [900, 500], [948, 490]], 30), seed: 692, w: 4, color: C.red },
    { pts: [[xs[2] - 26, boxY + 6], [xs[2] + 28, boxY + 52]], seed: 693, w: 5, color: C.red, over: 3 }, { pts: [[xs[2] + 28, boxY + 6], [xs[2] - 26, boxY + 54]], seed: 694, w: 5, color: C.red, over: 3 }],
  T.no + 0.2, T.no + 0.7, { name: '4B Red underline + cross' });
  const later = hand(pg, 'the world heard his name\nonly in 2002 — 40 years on', { x: 100, y: 1130, size: 50, seed: 701, rot: -1.5, t0: T.world - 2 * F, cps: 23, name: '4C Note “2002 — 40 years on”' });
  hand(pg, '(accounts differ — told decades later)', { x: 300, y: 1272, size: 30, color: C.pencil, seed: 711, rot: -1, t0: -99, name: 'Pencil caveat', opacity: 0.9 });
  folio(pg, 19, side);
  const parts = [...figs, ...ticks, ...yes, firm, vir, name, no, redU, later];
  return { update: (tg) => parts.forEach((p) => p.update(tg)) };
}

export const PAGES = [page0, page1, page2, page3, page4, page5];
