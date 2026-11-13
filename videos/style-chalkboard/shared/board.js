// LECTURE CHALKBOARD — the whole board for the whole film (one global clock). Every scene module mounts the same board
// and draws it at global time g, so scene joins are invisible; the "cuts" happen on the board: two eraser wipes
// (each leaves a ghost) and one camera travel. Layout is designed twice: 16:9 (wide lecture board) and 9:16 (stacked).
import { C, F, cv, rng, clamp, prog, makeKit, stroke, text, drawItems, drawDust, paintSlate, makeEraser, wipePath, pointAt, pathLen, arc, camAt } from './chalk.js';

const RES = 1.5; // offscreen layers are kept at 1.5× so push-ins stay crisp

export async function mountBoard(root, ctx) {
  await document.fonts.load('500 64px "Shantell Sans"');
  const L = ctx.layout, W = L.width, H = L.height, px = L.px, land = L.landscape;
  const words = ctx.words ?? [];
  const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const T = (w, n = 0, fb = 0) => { const h = words.filter(x => norm(x.word) === norm(w)); return h[n]?.start ?? fb; };
  const X = f => W * f, Y = f => H * f, P = o => L.pick(o);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.setAttribute('data-name', 'Chalkboard');
  Object.assign(canvas.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
  root.appendChild(canvas);
  const g2 = canvas.getContext('2d');
  const pat = makeKit(g2, px);
  const meas = cv(4, 4).getContext('2d');
  const tx = (str, x, y, size, o) => text(meas, str, x, y, size, o);

  // ----- helpers to time a list of strokes at a constant hand speed (like a real lecturer), with tiny lifts
  const timed = (list, t0, t1, gap = 0.04) => {
    const lens = list.map(s => s.len ?? 1), total = lens.reduce((a, b) => a + b, 0), span = Math.max(0.05, t1 - t0 - gap * (list.length - 1));
    let t = t0; list.forEach((s, i) => { s.t0 = t; s.t1 = t + span * lens[i] / total; t = s.t1 + gap; });
    return list;
  };
  const S = (pts, o = {}) => stroke(pts, { w: px(o.w ?? 6), col: o.col, side: o.side, seed: o.seed ?? Math.round(pts[0][0] + pts[0][1] * 3), amp: px(o.amp ?? 1.6), step: px(6), t0: 0, t1: 0, alpha: o.alpha });
  const wave = (x0, x1, y, amp, lambda, seed) => { const o = []; for (let x = x0; x <= x1; x += px(6)) o.push([x, y + Math.sin((x - x0) / lambda * Math.PI * 2 + seed) * amp]); return o; };
  const box = (x, y, w, h, seed) => { const o = px(6); return [S([[x - o, y], [x + w + o * 0.5, y + px(2)]], { seed }), S([[x + w, y - o * 0.4], [x + w - px(2), y + h + o]], { seed: seed + 1 }), S([[x + w + o * 0.3, y + h], [x - o * 0.5, y + h - px(3)]], { seed: seed + 2 }), S([[x, y + h + o * 0.6], [x + px(2), y - o * 0.5]], { seed: seed + 3 })]; };
  const arrow = (a, b, head, o = {}) => { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); const h = px(head); return [S([a, b], o), S([[b[0] - Math.cos(ang - 0.5) * h, b[1] - Math.sin(ang - 0.5) * h], b, [b[0] - Math.cos(ang + 0.5) * h, b[1] - Math.sin(ang + 0.5) * h]], { ...o, amp: 0.6 })]; };
  const scribbleCircle = (cx, cy, rx, ry, turns, seed, o = {}) => { const r = rng(seed), pts = [], n = Math.round(60 * turns), a0 = -2.2 + r() * 0.4; for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + u * turns * Math.PI * 2, k = 1 + 0.06 * Math.sin(u * 9 + r()) + (u - 0.5) * 0.08; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return S(pts, { ...o, amp: 1 }); };

  // ================================================================== GROUP 0 — the date, the sea, the submarine, Cuba
  const g0 = [], g1 = [], g2items = [];
  const tOct = T('October', 0, 0.58), tTw = T('twenty-seventh', 0, 1.1), tNin = T('nineteen', 0, 2.07), tSix = T('sixty-two', 0, 2.61);
  const tSub = T('submarine', 0, 4.3), tDeep = T('deep', 0, 5.42), tSea = T('sea', 0, 5.98), tCuba = T('Cuba', 0, 6.52);
  const dx = X(P({ landscape: 0.075, portrait: 0.085 }));
  const dateA = tx('Oct. 27,', dx, Y(P({ landscape: 0.19, portrait: 0.215 })), px(P({ landscape: 92, portrait: 84 })), { seed: 3, t0: tOct - 0.12, t1: tTw + 0.5 });
  const y1962 = Y(P({ landscape: 0.385, portrait: 0.33 })), s1962 = px(P({ landscape: 176, portrait: 196 }));
  const d19 = tx('19', dx - px(4), y1962, s1962, { seed: 4, t0: tNin - 0.1, t1: tNin + 0.38 });
  const d62 = tx('62', d19.x + d19.width + s1962 * 0.04, y1962, s1962, { seed: 5, t0: tSix - 0.1, t1: tSix + 0.4 });
  const ulW = d62.x + d62.width - dx;
  const ul = timed([S([[dx - px(10), y1962 + px(26)], [dx + ulW + px(30), y1962 + px(18)]], { w: 7, seed: 8 }), S([[dx + px(10), y1962 + px(46)], [dx + ulW + px(10), y1962 + px(42)]], { w: 6, seed: 9 })], tSix + 0.42, tSix + 0.78, 0.07);
  g0.push(dateA, d19, d62, ...ul);

  // the sea surface (chalk wave line) — Cuba's coast rises out of it on the right
  const ySea = Y(P({ landscape: 0.48, portrait: 0.425 }));
  const cubaX0 = X(P({ landscape: 0.74, portrait: 0.645 })), cubaX1 = X(P({ landscape: 0.93, portrait: 0.86 }));
  const seaL = S(wave(X(0.045), cubaX0, ySea, px(5), px(110), 0.3), { w: 6, amp: 1 });
  const seaR = S(wave(cubaX1, X(0.965), ySea, px(5), px(110), 1.4), { w: 6, amp: 1 });
  const cH = px(P({ landscape: 92, portrait: 78 })), cw = cubaX1 - cubaX0;
  const cubaShape = S([[cubaX0, ySea], [cubaX0 + cw * 0.12, ySea - cH * 0.3], [cubaX0 + cw * 0.25, ySea - cH * 0.42], [cubaX0 + cw * 0.38, ySea - cH * 0.8], [cubaX0 + cw * 0.5, ySea - cH], [cubaX0 + cw * 0.6, ySea - cH * 0.72], [cubaX0 + cw * 0.72, ySea - cH * 0.82], [cubaX0 + cw * 0.86, ySea - cH * 0.4], [cubaX1, ySea]], { w: 6, seed: 31 });
  const cubaHatch = []; { const r = rng(33); for (let i = 0; i < 7; i++) { const u = 0.15 + i * 0.1; cubaHatch.push(S([[cubaX0 + cw * u, ySea - px(4)], [cubaX0 + cw * (u + 0.07), ySea - cH * (0.3 + 0.35 * Math.sin(u * Math.PI)) + r() * px(6)]], { w: 3.5, alpha: 0.7, seed: 40 + i })); } }
  timed([seaL], tSix + 0.8, 3.95);
  timed([cubaShape, seaR], tSea - 0.25, tSea + 0.32, 0.02);
  timed(cubaHatch, tSea + 0.33, tCuba - 0.05, 0.01);
  const cuba = tx('CUBA', cubaX0 + cw * 0.5, ySea - cH - px(30), px(P({ landscape: 50, portrait: 46 })), { align: 'center', seed: 34, t0: tCuba - 0.08, t1: tCuba + 0.36 });
  g0.push(seaL, seaR, cubaShape, ...cubaHatch, cuba);

  // the submarine (generic Foxtrot-type side view, our drawing, no markings) + side-of-chalk shading
  const subC = [X(P({ landscape: 0.47, portrait: 0.52 })), Y(P({ landscape: 0.75, portrait: 0.62 }))];
  const subLen = W * P({ landscape: 0.37, portrait: 0.6 }), sh = subLen * 0.15;
  const sx = u => subC[0] - subLen / 2 + subLen * u, sy = v => subC[1] + sh * v;
  const hullTop = [[sx(0.0), sy(0.05)], [sx(0.02), sy(-0.32)], [sx(0.07), sy(-0.46)], [sx(0.2), sy(-0.52)], [sx(0.7), sy(-0.5)], [sx(0.88), sy(-0.32)], [sx(0.985), sy(-0.06)]];
  const hullBot = [[sx(0.985), sy(-0.06)], [sx(0.9), sy(0.22)], [sx(0.75), sy(0.42)], [sx(0.2), sy(0.48)], [sx(0.06), sy(0.4)], [sx(0.0), sy(0.05)]];
  const sail = [[sx(0.33), sy(-0.51)], [sx(0.355), sy(-1.25)], [sx(0.38), sy(-1.32)], [sx(0.47), sy(-1.32)], [sx(0.5), sy(-1.15)], [sx(0.53), sy(-0.51)]];
  const mast = [[sx(0.405), sy(-1.32)], [sx(0.405), sy(-1.62)]];
  const rudder = [[sx(0.955), sy(-0.15)], [sx(0.985), sy(-0.5)], [sx(1.0), sy(-0.48)], [sx(0.995), sy(0.32)], [sx(0.98), sy(0.34)], [sx(0.96), sy(0.1)]];
  const deck = [[sx(0.07), sy(-0.3)], [sx(0.86), sy(-0.28)]];
  const subStrokes = [S(hullTop, { w: 6.5, seed: 51 }), S(hullBot, { w: 6.5, seed: 52 }), S(sail, { w: 6, seed: 53 }), S(mast, { w: 4, seed: 54 }), S(rudder, { w: 5, seed: 55 }), S(deck, { w: 3, seed: 56, alpha: 0.7 })];
  timed(subStrokes, tSub - 0.62, tSub + 0.48, 0.03);
  // side shading: the lower belly of the hull, streaky (chalk laid flat)
  const shade = []; for (let i = 0; i < 6; i++) { const v = 0.1 + i * 0.065; shade.push(S([[sx(0.06 + i * 0.006), sy(v)], [sx(0.9 - i * 0.03), sy(v - 0.02)]], { w: 14, side: true, seed: 60 + i, alpha: 0.75 })); }
  timed(shade, tSub + 0.5, tSub + 0.95, 0.0);
  g0.push(...subStrokes, ...shade);
  const subLabel = tx(P({ landscape: 'SOVIET SUB · B-59', portrait: 'SOVIET SUB · B-59' }), sx(P({ landscape: 0.58, portrait: 0.02 })), sy(P({ landscape: 1.95, portrait: 2.25 })), px(P({ landscape: 38, portrait: 38 })), { seed: 57, t0: tSub + 0.62, t1: tSub + 1.12 });
  const leaderFrom = land ? [subLabel.x + px(40), subLabel.y - px(40)] : [subLabel.x + px(60), subLabel.y - px(42)];
  const leader = S([leaderFrom, [sx(land ? 0.62 : 0.2), sy(0.62)]], { w: 3.5, seed: 58 });
  leader.t0 = tSub + 1.12; leader.t1 = tSub + 1.24;
  g0.push(subLabel, leader);
  // depth: arrow from the surface down to the sub's level, ticks, DEEP
  const ax = X(P({ landscape: 0.19, portrait: 0.1 }));
  const depth = arrow([ax, ySea + px(18)], [ax, subC[1] + px(10)], 22, { w: 5 });
  const ticks = []; for (let i = 1; i <= 4; i++) { const y = ySea + px(18) + (subC[1] - ySea - px(8)) * i / 5; ticks.push(S([[ax - px(12), y], [ax + px(12), y]], { w: 3.5, seed: 70 + i })); }
  timed([...depth, ...ticks], tDeep - 0.42, tDeep + 0.12, 0.02);
  const deep = tx('DEEP', ax + px(26), ySea + (subC[1] - ySea) * P({ landscape: 0.52, portrait: 0.38 }), px(P({ landscape: 54, portrait: 46 })), { seed: 75, t0: tDeep - 0.02, t1: tDeep + 0.3, bold: 1.3 });
  g0.push(...depth, ...ticks, deep);

  // ================================================================== WIPE 1 — the top-left (date) is wiped, a ghost stays
  const tAbove = T('Above', 0, 7.56);
  const w1rect = land ? { x: X(0.035), y: Y(0.09), w: X(0.36), h: Y(0.25) } : { x: X(0.04), y: Y(0.155), w: X(0.56), h: Y(0.19) };
  const eraser = makeEraser(px, 5);
  const wipes = [];
  const mkWipe = (rect, t0, t1, seed, passes) => {
    const core = wipePath(rect, passes, seed, px);
    const entry = [core[0][0] - px(320), core[0][1] - px(60)], last = core[core.length - 1], exit = [last[0] + (last[0] > rect.x + rect.w / 2 ? px(380) : -px(380)), last[1] + px(80)];
    const pts = [entry, ...core, exit];
    const len = pathLen(pts), lenCore0 = Math.hypot(core[0][0] - entry[0], core[0][1] - entry[1]);
    const path = new Path2D(); path.moveTo(core[0][0], core[0][1]); for (let i = 1; i < core.length; i++) path.lineTo(core[i][0], core[i][1]);
    return { rect, pts, core, len, lenCore0, coreLen: pathLen(core), path, t0, t1, seed };
  };
  wipes.push(mkWipe(w1rect, tCuba + 0.42, tAbove + 0.2, 101, 3));

  // ================================================================== GROUP 1 — ships above, depth charges, Moscow silent
  const tAm = T('American', 0, 8.07), tShips = T('ships', 0, 8.63), tDrop = T('drop', 0, 8.95), tPr = T('practice', 0, 9.28), tCh = T('charges', 0, 10.05);
  const tMos = T('Moscow', 0, 10.95), tSil = T('silent', 0, 11.93), tDays = T('days', 0, 12.49);
  // three destroyers, each different (size, superstructure, distance) — generic shapes, no hull numbers
  const ship = (cx, len, v, seed) => {
    const b = ySea - px(2), hh = len * 0.09, x = u => cx - len / 2 + len * u;
    const hull = [[x(0), b - hh * 1.3], [x(0.06), b - hh * 0.2], [x(0.12), b], [x(0.92), b], [x(0.97), b - hh * 0.5], [x(1), b - hh * 0.9]];
    const deckL = [[x(0.0), b - hh * 1.3], [x(0.3), b - hh * 0.95], [x(1.0), b - hh * 0.9]];
    const sup = v === 0 ? [[x(0.3), b - hh], [x(0.32), b - hh * 2.4], [x(0.5), b - hh * 2.4], [x(0.52), b - hh * 3.4], [x(0.6), b - hh * 3.4], [x(0.62), b - hh]]
      : v === 1 ? [[x(0.26), b - hh], [x(0.28), b - hh * 2.8], [x(0.44), b - hh * 2.8], [x(0.46), b - hh]]
        : [[x(0.36), b - hh], [x(0.38), b - hh * 2.2], [x(0.58), b - hh * 2.2], [x(0.6), b - hh]];
    const mastP = v === 1 ? [[x(0.36), b - hh * 2.8], [x(0.37), b - hh * 5.4]] : [[x(0.56), b - hh * (v === 0 ? 3.4 : 2.2)], [x(0.56), b - hh * 5.0]];
    const yard = [[mastP[1][0] - len * 0.05, mastP[1][1] + hh * 0.9], [mastP[1][0] + len * 0.05, mastP[1][1] + hh * 0.9]];
    const fun = v === 1 ? [[x(0.56), b - hh], [x(0.58), b - hh * 2.4], [x(0.66), b - hh * 2.4], [x(0.67), b - hh]] : [[x(0.68), b - hh * 0.95], [x(0.7), b - hh * 2.1], [x(0.76), b - hh * 2.1], [x(0.77), b - hh * 0.95]];
    const gun = [[x(0.14), b - hh * 1.35], [x(0.2), b - hh * 1.35], [x(0.2), b - hh * 1.0]];
    const barrel = [[x(0.14), b - hh * 1.2], [x(0.06), b - hh * 1.5]];
    return [S(hull, { w: 5.5, seed }), S(deckL, { w: 3.5, seed: seed + 1, alpha: 0.8 }), S(sup, { w: 5, seed: seed + 2 }), S(fun, { w: 5, seed: seed + 3 }), S(mastP, { w: 3.5, seed: seed + 4 }), S(yard, { w: 3, seed: seed + 5 }), S(gun, { w: 4, seed: seed + 6 }), S(barrel, { w: 3.5, seed: seed + 7 })];
  };
  const shipDefs = land ? [[X(0.25), X(0.17), 0], [X(0.44), X(0.13), 1], [X(0.6), X(0.1), 2]] : [[X(0.155), X(0.21), 0], [X(0.375), X(0.17), 1], [X(0.555), X(0.12), 2]];
  const ships = shipDefs.map(([cx, len, v], i) => ship(cx, len, v, 200 + i * 20));
  timed(ships[0], tAbove - 0.05, tAm + 0.15, 0.02);
  timed(ships[1], tAm + 0.18, tShips + 0.05, 0.02);
  timed(ships[2], tShips + 0.08, tDrop - 0.02, 0.02);
  g1.push(...ships.flat());
  const navy = tx('U.S. NAVY', X(P({ landscape: 0.43, portrait: 0.36 })), ySea - px(P({ landscape: 150, portrait: 130 })), px(P({ landscape: 54, portrait: 50 })), { align: 'center', seed: 210, t0: tAm - 0.05, t1: tShips + 0.1 });
  g1.push(navy);
  // depth charges: dashed fall lines + small barrels, then bursts around the sub
  const charges = [], bursts = [];
  const dropX = shipDefs.map(([cx, len], i) => cx + len * (i === 1 ? -0.3 : 0.28));
  dropX.forEach((x, i) => {
    const yEnd = subC[1] - sh * (1.9 + 0.5 * (i % 2)) - px(i * 6), yStart = ySea + px(16), segs = 5;
    const dash = []; for (let k = 0; k < segs; k++) { const a = yStart + (yEnd - yStart) * k / segs, b = a + (yEnd - yStart) / segs * 0.55; dash.push(S([[x + px(k * 1.5), a], [x + px(k * 1.5 + 1), b]], { w: 4, seed: 300 + i * 10 + k })); }
    const can = box(x - px(9) + px(segs * 1.5), yEnd + px(2), px(18), px(22), 320 + i * 4); can.forEach(s => { s.w = px(4); });
    timed([...dash, ...can], tDrop + 0.05 + i * 0.22, tDrop + 0.55 + i * 0.22, 0.012);
    charges.push(...dash, ...can);
    // burst: short radial strokes around the end point (a chalk "star"), with a jittered ring
    const r = rng(340 + i), bc = [x + px(segs * 1.5), yEnd + px(13)], rays = [];
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + r() * 0.3, r0 = px(26 + r() * 6), r1 = px(52 + r() * 22); rays.push(S([[bc[0] + Math.cos(a) * r0, bc[1] + Math.sin(a) * r0], [bc[0] + Math.cos(a) * r1, bc[1] + Math.sin(a) * r1]], { w: 4.5, seed: 350 + i * 12 + k, amp: 0.5 })); }
    timed(rays, tCh - 0.06 + i * 0.14, tCh + 0.22 + i * 0.14, 0.0);
    bursts.push(...rays);
  });
  g1.push(...charges, ...bursts);
  const prX = X(P({ landscape: 0.67, portrait: 0.62 })), prY = ySea + px(P({ landscape: 150, portrait: 150 }));
  const prac = tx('practice', prX, prY, px(P({ landscape: 50, portrait: 46 })), { col: 'yellow', seed: 360, t0: tPr - 0.05, t1: tPr + 0.45 });
  const prac2 = tx('charges', prX + px(12), prY + px(P({ landscape: 54, portrait: 50 })), px(P({ landscape: 50, portrait: 46 })), { col: 'yellow', seed: 361, t0: tPr + 0.45, t1: tCh + 0.4 });
  const pracArrow = arrow([prX - px(16), prY - px(12)], [dropX[2] + px(34), prY - px(30)], 16, { w: 4, col: 'yellow' });
  timed(pracArrow, tCh + 0.42, tCh + 0.62, 0.02);
  g1.push(prac, prac2, ...pracArrow);
  // MOSCOW — boxed, the radio waves crossed out, a tally of silent days
  const mx = X(P({ landscape: 0.075, portrait: 0.09 })), my = Y(P({ landscape: 0.2, portrait: 0.165 })), ms = px(P({ landscape: 74, portrait: 70 }));
  const mos = tx('MOSCOW', mx, my, ms, { seed: 400, t0: tMos - 0.1, t1: tMos + 0.45, bold: 1.2 });
  const mbox = box(mx - px(18), my - ms * 0.95, mos.width + px(36), ms * 1.25, 401);
  timed(mbox, tMos + 0.47, T('been', 0, 11.66) + 0.15, 0.02);
  const rx0 = mx + mos.width + px(70), ryc = my - ms * 0.35;
  const waves = [0, 1, 2].map(i => S(arc(rx0, ryc, px(22 + i * 22), px(22 + i * 22), -0.75, 0.75, 16), { w: 4.5, seed: 410 + i }));
  timed(waves, T('been', 0, 11.66) + 0.18, tSil - 0.02, 0.03);
  const cross = [S([[rx0 - px(10), ryc - px(60)], [rx0 + px(78), ryc + px(58)]], { w: 6, seed: 420, col: 'yellow' }), S([[rx0 + px(78), ryc - px(58)], [rx0 - px(6), ryc + px(62)]], { w: 6, seed: 421, col: 'yellow' })];
  timed(cross, tSil + 0.02, tSil + 0.32, 0.05);
  const tyY = my + ms * P({ landscape: 1.05, portrait: 0.98 }), tally = [];
  for (let i = 0; i < 4; i++) tally.push(S([[mx + px(8 + i * 26), tyY - px(52)], [mx + px(4 + i * 26), tyY + px(2)]], { w: 5, seed: 430 + i }));
  tally.push(S([[mx - px(8), tyY - px(14)], [mx + px(104), tyY - px(40)]], { w: 5, seed: 435 }));
  timed(tally, tSil + 0.36, tDays + 0.12, 0.03);
  const daysT = tx('days of silence', mx + px(132), tyY, px(P({ landscape: 42, portrait: 40 })), { col: 'yellow', seed: 440, t0: tDays - 0.02, t1: tDays + 0.42 });
  g1.push(mos, ...mbox, ...waves, ...cross, ...tally, daysT);

  // ================================================================== WIPE 2 — most of the board; the sub stays as a ghost
  const tOn = T('On', 0, 13.67);
  const w2rect = land ? { x: X(0.03), y: Y(0.1), w: X(0.94), h: Y(0.8) } : { x: X(0.04), y: Y(0.09), w: X(0.92), h: Y(0.72) };
  wipes.push(mkWipe(w2rect, tDays + 0.5, tOn + 0.18, 202, land ? 6 : 8));

  // ================================================================== GROUP 2 — the torpedo, three officers, the vote
  const tNuc = T('nuclear', 0, 14.48), tTorp = T('torpedo', 0, 14.88), tThree = T('three', 0, 16.51), tOff = T('officers', 0, 16.86), tAgree = T('agree', 0, 17.61);
  const tTwo = T('Two', 0, 18.29), tYes = T('yes', 0, 18.8), tThird = T('third', 0, 20.25), tVas = T('Vasili', 0, 20.61), tArk = T('Arkhipov', 0, 21.12), tNo = T('no', 0, 22.03);
  const tWorld = T('world', 0, 23.07), tForty = T('forty', 0, 24.13);
  const ty = Y(P({ landscape: 0.25, portrait: 0.2 })), tx0 = X(P({ landscape: 0.09, portrait: 0.08 })), tx1 = X(P({ landscape: 0.58, portrait: 0.8 })), tr = px(P({ landscape: 40, portrait: 38 }));
  const tl = tx1 - tx0, tu = u => tx0 + tl * u;
  const torpTop = [[tu(0), ty + tr * 0.1], [tu(0.015), ty - tr * 0.6], [tu(0.06), ty - tr * 0.96], [tu(0.12), ty - tr], [tu(0.86), ty - tr], [tu(0.95), ty - tr * 0.55]];
  const torpBot = [[tu(0), ty + tr * 0.1], [tu(0.015), ty + tr * 0.7], [tu(0.06), ty + tr * 0.98], [tu(0.12), ty + tr], [tu(0.86), ty + tr], [tu(0.95), ty + tr * 0.55]];
  const tail = [[tu(0.95), ty - tr * 0.55], [tu(0.95), ty + tr * 0.55]];
  const fins = [[[tu(0.88), ty - tr * 0.82], [tu(0.97), ty - tr * 1.75], [tu(0.985), ty - tr * 1.75], [tu(0.95), ty - tr * 0.55]], [[tu(0.88), ty + tr * 0.82], [tu(0.97), ty + tr * 1.75], [tu(0.985), ty + tr * 1.75], [tu(0.95), ty + tr * 0.55]]];
  const prop = [[[tu(0.955), ty], [tu(0.99), ty - tr * 0.75]], [[tu(0.955), ty], [tu(0.99), ty + tr * 0.75]]];
  const bands = [0.18, 0.2, 0.62].map((u, i) => S([[tu(u), ty - tr * 0.98], [tu(u) + px(2), ty + tr * 0.98]], { w: 3, seed: 520 + i, alpha: 0.75 }));
  const torp = [S(torpTop, { w: 6.5, seed: 500 }), S(torpBot, { w: 6.5, seed: 501 }), S(tail, { w: 5, seed: 502 }), ...fins.map((f, i) => S(f, { w: 5, seed: 503 + i })), ...prop.map((f, i) => S(f, { w: 4, seed: 506 + i })), ...bands];
  timed(torp, tOn + 0.1, tTorp + 0.1, 0.02);
  const tshade = []; for (let i = 0; i < 4; i++) { const v = 0.25 + i * 0.17; tshade.push(S([[tu(0.05), ty + tr * v], [tu(0.87), ty + tr * (v - 0.02)]], { w: 13, side: true, seed: 530 + i, alpha: 0.7 })); }
  timed(tshade, tTorp + 0.12, tTorp + 0.5, 0);
  // the warhead section marked in yellow (nose) — "nuclear"
  const nose = scribbleCircle(tu(0.075), ty, tl * 0.1, tr * 1.6, 1.12, 540, { w: 5, col: 'yellow' });
  nose.t0 = tNuc - 0.06; nose.t1 = tNuc + 0.34;
  const tlab = land ? tx('NUCLEAR TORPEDO', tx1 + px(70), ty + px(18), px(54), { seed: 545, t0: tTorp + 0.15, t1: tTorp + 0.85, bold: 1.2 })
    : tx('NUCLEAR TORPEDO', tx0, ty + tr + px(100), px(56), { seed: 545, t0: tTorp + 0.15, t1: tTorp + 0.85, bold: 1.2 });
  g2items.push(...torp, ...tshade, nose, tlab);

  // three officers: boxed numbers, stick figures with different gestures (no faces), roles; the vote
  const colX = land ? [X(0.24), X(0.52), X(0.8)] : [X(0.17), X(0.455), X(0.74)];
  const fh = px(P({ landscape: 300, portrait: 300 })), footY = Y(P({ landscape: 0.835, portrait: 0.63 }));
  const POSES = {
    point: { head: [0.1, 0.88], neck: [0.07, 0.79], hip: [0, 0.42], legs: [[[-0.08, 0.2], [-0.16, 0]], [[0.07, 0.22], [0.13, 0]]], arms: [[[0.2, 0.84], [0.34, 0.96]], [[-0.05, 0.6], [0.03, 0.5]]] },
    raise: { head: [0, 0.88], neck: [0, 0.79], hip: [0.01, 0.42], legs: [[[-0.05, 0.21], [-0.08, 0]], [[0.06, 0.2], [0.12, 0]]], arms: [[[0.1, 0.96], [0.12, 1.14]], [[-0.09, 0.6], [-0.11, 0.44]]] },
    stand: { head: [-0.015, 0.875], neck: [0, 0.79], hip: [0.025, 0.42], legs: [[[-0.015, 0.21], [-0.04, 0]], [[0.08, 0.2], [0.095, 0]]], arms: [[[-0.075, 0.6], [0.0, 0.5]], [[0.1, 0.6], [0.035, 0.49]]] },
  };
  const figure = (cx, pose, seed) => {
    const p = POSES[pose], q = ([u, v]) => [cx + u * fh, footY - v * fh], hr = fh * 0.075, hc = q(p.head);
    const head = S(arc(hc[0], hc[1], hr, hr * 1.1, -1.9, -1.9 + Math.PI * 2.08, 30), { w: 5.5, seed, amp: 0.8 });
    const capBrim = S([[hc[0] - hr * 1.05, hc[1] - hr * 0.55], [hc[0] + hr * (pose === 'point' ? 1.5 : 1.35), hc[1] - hr * 0.62]], { w: 5, seed: seed + 1 });
    const capTop = S([[hc[0] - hr * 0.95, hc[1] - hr * 0.6], [hc[0] - hr * 1.1, hc[1] - hr * 1.2], [hc[0] + hr * 0.6, hc[1] - hr * 1.38], [hc[0] + hr * 0.9, hc[1] - hr * 0.7]], { w: 4.5, seed: seed + 2 });
    const body = S([q(p.neck), q(p.hip)], { w: 6, seed: seed + 3 });
    const sh = q([p.neck[0], p.neck[1] - 0.03]);
    const arms = p.arms.map(([e, h], i) => S([sh, q(e), q(h)], { w: 5.5, seed: seed + 4 + i }));
    const legs = p.legs.map(([k, f], i) => S([q(p.hip), q(k), q(f)], { w: 6, seed: seed + 6 + i }));
    return [head, capTop, capBrim, body, ...arms, ...legs];
  };
  const figs = [figure(colX[0], 'point', 600), figure(colX[1], 'raise', 620), figure(colX[2], 'stand', 640)];
  const numY = footY - fh * P({ landscape: 1.2, portrait: 1.26 }), numS = px(P({ landscape: 48, portrait: 46 }));
  const nums = [1, 2, 3].map((n, i) => { const bx = colX[i] - fh * P({ landscape: 0.62, portrait: 0.4 }), t = tx(String(n), bx, numY, numS, { seed: 660 + i, bold: 1.3 }); const b = box(bx - px(14), numY - numS * 0.92, t.width + px(28), numS * 1.2, 670 + i * 4); return { t, b }; });
  // timing: "three" → numbers; "officers" → figures drawn one after the other
  nums.forEach((n, i) => { n.t.t0 = tThree - 0.08 + i * 0.1; n.t.t1 = n.t.t0 + 0.14; timed(n.b, n.t.t1 + 0.01, n.t.t1 + 0.24, 0.0); });
  timed(figs[0], tThree + 0.36, tOff + 0.3, 0.02);
  timed(figs[1], tOff + 0.32, tAgree - 0.05, 0.02);
  timed(figs[2], tAgree - 0.03, tAgree + 0.4, 0.02);
  const roleS = px(P({ landscape: 36, portrait: 30 })), roleY = footY + px(P({ landscape: 52, portrait: 48 }));
  const role1 = tx('CAPTAIN', colX[0], roleY, roleS, { align: 'center', seed: 680, t0: tOff + 0.0, t1: tOff + 0.32 });
  const role2 = land ? tx('POLITICAL OFFICER', colX[1], roleY, roleS, { align: 'center', seed: 681, t0: tAgree - 0.3, t1: tAgree + 0.2 })
    : tx('POLIT. OFFICER', colX[1], roleY, roleS, { align: 'center', seed: 681, t0: tAgree - 0.3, t1: tAgree + 0.2 });
  const qm = tx('?', colX[2], roleY, roleS * 1.2, { align: 'center', seed: 682, t0: tTwo - 0.05, t1: tTwo + 0.05, col: 'yellow' });
  // brace: "all 3 must agree"
  const brY = numY - numS * P({ landscape: 1.6, portrait: 1.7 }), brX0 = colX[0] - fh * 0.62, brX1 = colX[2] + fh * 0.45;
  const brace = S([[brX0, brY + px(16)], [brX0 + px(8), brY], [(brX0 + brX1) / 2 - px(14), brY], [(brX0 + brX1) / 2, brY - px(14)], [(brX0 + brX1) / 2 + px(14), brY], [brX1 - px(8), brY], [brX1, brY + px(16)]], { w: 5, col: 'yellow', seed: 690 });
  timed([brace], tOff + 0.1, tAgree + 0.05);
  const agree = tx('all three must agree', (brX0 + brX1) / 2, brY - px(32), px(P({ landscape: 44, portrait: 40 })), { col: 'yellow', align: 'center', seed: 691, t0: tAgree - 0.2, t1: tAgree + 0.55 });
  g2items.push(...nums.flatMap(n => [n.t, ...n.b]), ...figs.flat(), role1, role2, qm, brace, agree);
  // votes: YES ✓ for 1 and 2 (white), NO for 3 (pink, the only pink on the board), circled twice
  const voteS = px(P({ landscape: 58, portrait: 54 }));
  const votePos = i => land ? [colX[i] - fh * 0.95, footY - fh * 0.62] : [colX[i], roleY + px(86)];
  const yes = [0, 1].map(i => { const [vx, vy] = votePos(i); const t = tx('YES', vx, vy, voteS, { seed: 700 + i, align: land ? 'left' : 'center', bold: 1.25 }); const tick = S([[t.x + t.width + px(14), vy - voteS * 0.35], [t.x + t.width + px(30), vy - px(2)], [t.x + t.width + px(62), vy - voteS * 0.95]], { w: 6, seed: 710 + i, amp: 0.6 }); return { t, tick }; });
  yes[0].t.t0 = tTwo + 0.04; yes[0].t.t1 = tYes - 0.06; yes[0].tick.t0 = tYes - 0.05; yes[0].tick.t1 = tYes + 0.07;
  yes[1].t.t0 = tYes + 0.1; yes[1].t.t1 = tYes + 0.42; yes[1].tick.t0 = tYes + 0.44; yes[1].tick.t1 = tYes + 0.56;
  const [nx, ny] = land ? [colX[2] - fh * 0.92, footY - fh * 0.5] : [colX[2] - px(6), roleY + px(150)];
  const noS = px(P({ landscape: 132, portrait: 140 }));
  const no = tx('NO', nx, ny, noS, { col: 'pink', seed: 720, align: land ? 'left' : 'center', bold: 1.6, t0: tArk + 0.52, t1: tNo - 2 * F });
  const noC = scribbleCircle(no.x + no.width / 2 + px(4), ny - noS * 0.36, no.width * 0.7, noS * 0.64, 1.9, 730, { w: 7, col: 'pink' });
  noC.t0 = tNo + 0.08; noC.t1 = tNo + 0.62;
  // the name under figure 3 — replaces the question mark (thumb-smudged out)
  const name = tx(land ? 'VASILI ARKHIPOV' : 'V. ARKHIPOV', colX[2], roleY + px(P({ landscape: 0, portrait: 0 })), roleS, { align: 'center', seed: 740, t0: tVas - 0.04, t1: tArk + 0.42, bold: 1.2 });
  const smudge = { t0: tVas - 0.2, t1: tVas - 0.02, x: colX[2], y: roleY - roleS * 0.4, r: roleS * 0.9 };
  // forty years later — a small yellow note + arrow from the NO
  const noteX = land ? X(0.645) : X(0.08), noteY = land ? Y(0.335) : Y(0.765), noteS = px(P({ landscape: 40, portrait: 38 }));
  const note1 = tx(land ? 'the world learned his name' : 'the world learned his name', noteX, noteY, noteS, { col: 'yellow', seed: 750, t0: tWorld - 0.1, t1: tForty - 0.05 });
  const note2 = tx('≈ 40 years later (2002)', noteX + px(20), noteY + noteS * 1.25, noteS, { col: 'yellow', seed: 751, t0: tForty, t1: tForty + 0.85 });
  const noteArrow = land ? arrow([no.x + no.width * 0.3, ny - noS * 1.15], [noteX + px(120), noteY + noteS * 1.6], 16, { w: 4, col: 'yellow' }) : [];
  if (noteArrow.length) timed(noteArrow, tForty + 0.86, tForty + 1.1, 0.02);
  g2items.push(...yes.flatMap(y => [y.t, y.tick]), no, noC, name, note1, note2, ...noteArrow);

  // ================================================================== static paint (slate, frame, light)
  const frame = (g, r) => {
    const fw = px(16);
    g.fillStyle = C.woodDark;
    if (land) { g.fillRect(0, 0, W, fw * 0.6); g.fillRect(0, 0, fw, H); g.fillRect(W - fw, 0, fw, H); }
    else { g.fillRect(0, 0, fw * 0.8, H); g.fillRect(W - fw * 0.8, 0, fw * 0.8, H); }
    // chalk tray at the bottom with chalk stubs and a dusting
    const ty0 = H - px(P({ landscape: 30, portrait: 120 }));
    const gr = g.createLinearGradient(0, ty0, 0, H); gr.addColorStop(0, '#7A5634'); gr.addColorStop(0.25, C.wood); gr.addColorStop(1, '#2E1F12');
    g.fillStyle = gr; g.fillRect(0, ty0, W, H - ty0);
    for (let i = 0; i < 240; i++) { g.fillStyle = `rgba(240,240,230,${0.15 + r() * 0.4})`; g.fillRect(r() * W, ty0 + r() * px(10), px(1.6), px(1.6)); }
    const stubs = [[0.12, 'rgb(236,236,226)', 52], [0.16, 'rgb(236,236,226)', 30], [0.71, 'rgb(242,210,104)', 40], [0.75, 'rgb(240,150,182)', 26]];
    for (const [u, col, l] of stubs) { g.save(); g.translate(W * u, ty0 + px(5)); g.rotate((r() - 0.5) * 0.3); g.fillStyle = col; g.fillRect(0, -px(5), px(l), px(10)); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, px(2), px(l), px(3)); g.restore(); }
    // dust shadow along the tray edge (where wiped dust collects)
    const dg = g.createLinearGradient(0, ty0 - px(40), 0, ty0); dg.addColorStop(0, 'rgba(230,235,225,0)'); dg.addColorStop(1, 'rgba(230,235,225,0.08)');
    g.fillStyle = dg; g.fillRect(0, ty0 - px(40), W, px(40));
  };
  const slate = paintSlate(W, H, px, 7, frame, RES);
  const light = cv(W, H); {
    const g = light.getContext('2d');
    const hs = g.createRadialGradient(X(0.3), Y(-0.15), 0, X(0.3), Y(-0.15), Math.max(W, H) * 0.9);
    hs.addColorStop(0, 'rgba(255,248,225,0.10)'); hs.addColorStop(0.5, 'rgba(255,248,225,0.03)'); hs.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hs; g.fillRect(0, 0, W, H);
    // a soft glossy reflection band (hall windows on a slightly worn board)
    g.save(); g.translate(X(0.62), Y(0.1)); g.rotate(-0.42);
    const band = g.createLinearGradient(-px(140), 0, px(140), 0); band.addColorStop(0, 'rgba(220,235,230,0)'); band.addColorStop(0.5, 'rgba(220,235,230,0.035)'); band.addColorStop(1, 'rgba(220,235,230,0)');
    g.fillStyle = band; g.fillRect(-px(140), -H, px(280), H * 3); g.restore();
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,8,6,0.42)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  // ================================================================== layers + wipes (cached, deterministic)
  const layer = () => { const c = cv(W * RES, H * RES); const g = c.getContext('2d'); g.setTransform(RES, 0, 0, RES, 0, 0); return { c, g }; };
  const lp = layer().g; const lpat = makeKit(lp, px); // patterns for offscreen contexts
  const renderFull = (items, under) => { const l = layer(); if (under) { l.g.save(); l.g.setTransform(1, 0, 0, 1, 0, 0); l.g.drawImage(under, 0, 0); l.g.restore(); } drawItems(l.g, lpat, items, 1e9); return l.c; };
  const tmp = layer();
  const wipeMaskW = eraser.L * 1.28;
  function erased(src, w, g) {
    const e = prog(g, w.t0, w.t1), u = e <= 0 ? 0 : (w.len * eased(e) - w.lenCore0) / w.coreLen;
    tmp.g.save(); tmp.g.setTransform(1, 0, 0, 1, 0, 0); tmp.g.clearRect(0, 0, tmp.c.width, tmp.c.height); tmp.g.drawImage(src, 0, 0); tmp.g.restore();
    if (u > 0) {
      tmp.g.save(); tmp.g.globalCompositeOperation = 'destination-out'; tmp.g.lineCap = 'round'; tmp.g.lineJoin = 'round'; tmp.g.lineWidth = wipeMaskW; tmp.g.strokeStyle = lpat.erase;
      if (u < 1) tmp.g.setLineDash([w.coreLen * clamp(u), w.coreLen + 10]);
      tmp.g.stroke(w.path); tmp.g.restore();
    }
    return { canvas: tmp.c, u: clamp(u) };
  }
  const eased = e => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2; // eraser accelerates in, slows out
  let ghost1 = null, src2 = null, ghost2 = null;
  const src1 = () => (src1.c ??= renderFull(g0));
  const getGhost1 = () => { if (!ghost1) { const r = erased(src1(), wipes[0], 1e9); ghost1 = cv(r.canvas.width, r.canvas.height); const q = ghost1.getContext('2d'); q.filter = `blur(${px(1.4) * RES}px)`; q.drawImage(r.canvas, 0, 0); } return ghost1; };
  const getSrc2 = () => (src2 ??= renderFull(g1, getGhost1()));
  const getGhost2 = () => { if (!ghost2) { const r = erased(getSrc2(), wipes[1], 1e9); ghost2 = cv(r.canvas.width, r.canvas.height); const q = ghost2.getContext('2d'); q.filter = `blur(${px(1.4) * RES}px)`; q.drawImage(r.canvas, 0, 0); } return ghost2; };
  const allItems = [...g0, ...g1, ...g2items];

  // ================================================================== camera (world = frame at s = 1)
  const cl = c => { const s = Math.max(1, c.s), hw = W / (2 * s), hh = H / (2 * s); return { s, x: clamp(c.x, hw, W - hw), y: clamp(c.y, hh, H - hh) }; };
  const dateC = { x: dx + ulW * 0.5 + px(P({ landscape: 40, portrait: -10 })), y: (dateA.y + y1962) / 2, s: P({ landscape: 1.72, portrait: 1.6 }) };
  const full = { x: W / 2, y: H / 2, s: 1 };
  const subCam = { x: subC[0] + px(30), y: (ySea + subC[1]) / 2 + px(20), s: P({ landscape: 1.14, portrait: 1.12 }) };
  const shipCam = { x: X(P({ landscape: 0.44, portrait: 0.42 })), y: (ySea * 0.62 + subC[1] * 0.38), s: P({ landscape: 1.12, portrait: 1.1 }) };
  const torpCam = { x: (tx0 + tx1) / 2 + px(P({ landscape: 160, portrait: 0 })), y: ty + px(P({ landscape: 150, portrait: 160 })), s: P({ landscape: 1.16, portrait: 1.2 }) };
  const col3Cam = land ? { x: X(0.66), y: footY - fh * 0.45, s: 1.4 } : { x: X(0.555), y: footY + px(110), s: 1.5 };
  const keys = [
    [0, dateC], [2.9, { ...dateC, x: dateC.x + px(18), s: dateC.s * 1.02 }], [3.9, full], [tSub - 0.2, { ...full, s: 1.02 }], [tSub + 1.4, subCam], [tSea - 0.1, subCam],
    [tCuba + 0.3, { ...full, s: 1.03 }], [wipes[0].t1, full], [tAm, { ...shipCam, s: 1.06 }], [tCh + 0.2, shipCam], [tMos - 0.25, { x: X(0.38), y: Y(0.38), s: 1.06 }],
    [tDays + 0.3, { x: X(0.4), y: Y(0.4), s: 1.08 }], [wipes[1].t0 + 0.25, full], [wipes[1].t1 + 0.1, { ...full, s: 1.02 }], [tTorp + 0.2, torpCam], [tThree - 0.2, { ...full, s: 1.04 }],
    [tYes + 0.6, { ...full, s: 1.05 }], [tThird + 0.1, col3Cam], [tNo + 0.7, { ...col3Cam, s: col3Cam.s * 1.03 }], [tWorld + 0.3, full], [ctx.start + ctx.duration + 2, { ...full, s: 1.02 }],
  ].map(([t, c]) => [t, cl(c)]);

  // ================================================================== draw
  function draw(g) {
    const cam = camAt(g, keys);
    const s = cam.s, ox = W / 2 - cam.x * s, oy = H / 2 - cam.y * s;
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.fillStyle = C.slate; g2.fillRect(0, 0, W, H);
    g2.setTransform(s, 0, 0, s, ox, oy);
    g2.drawImage(slate, 0, 0, W, H);
    const blit = c => g2.drawImage(c, 0, 0, W, H);
    const w1 = wipes[0], w2 = wipes[1];
    let live = [];
    if (g < w1.t0) live = g0.slice();
    else if (g < w2.t0) {
      blit(g < w1.t1 ? erased(src1(), w1, g).canvas : getGhost1());
      live = g1.slice();
    } else {
      blit(g < w2.t1 ? erased(getSrc2(), w2, g).canvas : getGhost2());
    }
    if (g >= w2.t0 - 0.0001) live.push(...g2items.filter(it => it.t0 <= g));
    // the thumb smudge that removes "?" (drawn into the board, before the name)
    const qVisible = g < smudge.t0 || g >= smudge.t0;
    live = live.filter(it => !(it === qm && g >= smudge.t1));
    drawItems(g2, pat, live, g);
    if (g >= smudge.t0 && g < smudge.t1 + 6) {
      // the ? half rubbed out: draw it faint, then a dusty thumb smear over it
      const a = prog(g, smudge.t0, smudge.t1);
      if (g >= smudge.t1) { g2.save(); g2.globalAlpha = 0.16; drawItems(g2, pat, [{ ...qm, alpha: 0.16 }], 1e9); g2.restore(); }
      g2.save(); const gr = g2.createRadialGradient(smudge.x, smudge.y, 0, smudge.x, smudge.y, smudge.r);
      gr.addColorStop(0, `rgba(225,232,222,${0.07 * a})`); gr.addColorStop(1, 'rgba(225,232,222,0)'); g2.fillStyle = gr; g2.fillRect(smudge.x - smudge.r, smudge.y - smudge.r, smudge.r * 2, smudge.r * 2); g2.restore();
    }
    void qVisible;
    drawDust(g2, live, g, px);
    // dust haze where the eraser just went
    for (const w of wipes) {
      if (g < w.t0 || g > w.t1 + 1.6) continue;
      const e = prog(g, w.t0, w.t1), d = w.len * eased(e), u = clamp((d - w.lenCore0) / w.coreLen);
      if (u > 0) { g2.save(); g2.globalAlpha = 0.05 * (1 - prog(g, w.t1, w.t1 + 1.6) * 0.6); g2.strokeStyle = pat.whiteSide; g2.lineWidth = wipeMaskW; g2.lineCap = 'round'; g2.lineJoin = 'round'; if (u < 1) g2.setLineDash([w.coreLen * u, w.coreLen + 10]); g2.stroke(w.path); g2.restore(); }
      // falling dust from the eraser
      if (g <= w.t1 + 0.8) { const r = rng(w.seed); g2.save(); g2.fillStyle = 'rgb(236,238,229)'; for (let k = 0; k < 90; k++) { const born = w.t0 + (w.t1 - w.t0) * r(), age = g - born, life = 0.5 + r() * 0.4; const ox2 = r(), oy2 = r(); if (age < 0 || age > life) continue; const pq = pointAt(w.pts, w.len * eased(prog(born, w.t0, w.t1))); g2.globalAlpha = 0.5 * (1 - age / life); g2.fillRect(pq[0] + (ox2 - 0.5) * eraser.L * 0.6, pq[1] + (oy2 - 0.5) * eraser.L * 0.9 + px(300) * age * age, px(2), px(2)); } g2.restore(); }
      // the eraser itself, with a short motion smear
      if (g <= w.t1) {
        for (const [lag, al] of [[0.05, 0.18], [0.025, 0.35], [0, 1]]) {
          const e2 = prog(g - lag, w.t0, w.t1), pq = pointAt(w.pts, w.len * eased(e2));
          g2.save(); g2.globalAlpha = al; g2.translate(pq[0], pq[1]); g2.rotate(pq[2] + Math.PI / 2 + Math.sin(g * 9 + w.seed) * 0.06);
          g2.drawImage(eraser.canvas, -eraser.canvas.width / 2, -eraser.canvas.height / 2); g2.restore();
        }
      }
    }
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.drawImage(light, 0, 0);
  }

  // ================================================================== sound (registered once, by scene 1)
  const sound = () => {
    const at = gt => gt - ctx.start;
    // chalk scratch = fine grain hiss under each written word/line (sand-sprinkle, very low); taps on dots, ticks, box corners
    const writing = allItems.filter(it => it.t1 - it.t0 > 0.18 && it.kind !== 'side');
    const merged = []; for (const it of writing.sort((a, b) => a.t0 - b.t0)) { const l = merged[merged.length - 1]; if (l && it.t0 - l[1] < 0.12) l[1] = Math.max(l[1], it.t1); else merged.push([it.t0, it.t1]); }
    for (const [a, b] of merged) ctx.sfx('sand-sprinkle-01', at(a), { lu: -27, duration: Math.max(0.25, b - a + 0.08), fadeIn: 0.03, fadeOut: 0.08 });
    const taps = [ul[1].t1, ...nums.map(n => n.t.t1), yes[0].tick.t1, yes[1].tick.t1, ...charges.filter((_, i) => i % 9 === 8).map(c => c.t1), mbox[3].t1, tally[4].t1];
    taps.forEach((t, i) => ctx.sfx(i % 2 ? 'footsteps-wood-creep-01' : 'staff-hit-01', at(t - F), { lu: -24 - (i % 3), duration: 0.16, fadeOut: 0.05 }));
    // the eraser: felt rubbing (cloth) + dust
    for (const w of wipes) { ctx.sfx('cloth-jacket-01', at(w.t0 + 0.05), { lu: -15, duration: w.t1 - w.t0 + 0.1, fadeIn: 0.06, fadeOut: 0.15 }); ctx.sfx('sand-sprinkle-01', at(w.t0 + 0.2), { lu: -25, duration: 0.9, fadeIn: 0.1, fadeOut: 0.3 }); }
    // the lecturer steps to a new spot after the big wipe; one distant cough in the hall
    ctx.sfx('footsteps-wood-creep-01', at(wipes[1].t1 - 0.05), { lu: -23, duration: 0.7, fadeOut: 0.2 });
    ctx.sfx('cough-01', at(wipes[1].t0 + 0.35), { lu: -33, duration: 0.8, fadeOut: 0.2 });
    // the story leaks in: depth charges, far and low
    ctx.sfx('boom-distant-01', at(tCh), { lu: -15 });
    ctx.sfx('boom-distant-01', at(tCh + 0.34), { lu: -19 });
    // before the NO: one breath; the NO itself = the hardest chalk hit; then the circle
    ctx.sfx('breath-close-01', at(tNo - 1.9), { lu: -22, duration: 1.7, fadeIn: 0.3, fadeOut: 0.4 });
    ctx.sfx('staff-hit-01', at(tNo - 2 * F), { lu: -13, duration: 0.3, fadeOut: 0.1 });
    ctx.sfx('sand-sprinkle-01', at(noC.t0), { lu: -23, duration: noC.t1 - noC.t0 + 0.1, fadeIn: 0.02, fadeOut: 0.1 });
  };

  return { draw, sound, T };
}
