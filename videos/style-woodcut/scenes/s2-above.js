// BLOCK II — above it, the ships; depth charges; Moscow silent. intent: KNOW US ships drop practice depth charges on
// the sub, no word from Moscow · FEEL dread (pressure from above) · SEE bursts carved as stars in a black sea, the sub
// small and deep below them. truth: ships/charges/bursts = RC (generic shapes, positions symbolic, not a plot);
// "practice" charges = signalling charges (hedged in README); stamp text = VO.
import { F, C, rects, wordT, ridgeLines, cut, schedule, cascade, offsetPoly, densify, polyPath, contourCuts, camFit, camPage, camAt, createBlock, stampDraw, textWidth, seq, vnoise } from '../shared/wood.js';
import { subPoly, subHighlights, shipPoly } from '../shared/shapes.js';

export default function (root, ctx) {
  const L = ctx.layout, { R, band } = rects(L), land = L.landscape, px = L.px;
  const tAbove = wordT(ctx, 'Above', 0, 0.35), tShips = wordT(ctx, 'ships', 0, 1.42), tDrop = wordT(ctx, 'drop', 0, 1.74);
  const tDepth = wordT(ctx, 'depth', 0, 2.58), tMoscow = wordT(ctx, 'Moscow', 0, 3.74), tSilent = wordT(ctx, 'silent', 0, 4.72);
  const U = u => R.x + R.w * u, V = v => R.y + R.h * v;
  const xIn0 = R.x + px(28), xIn1 = R.x + R.w - px(26);

  // ---- geography (same screen sides as block I: the sub deep, low; the surface high)
  const yH = V(L.pick({ landscape: 0.3, portrait: 0.25 }));
  const shipA = shipPoly(U(L.pick({ landscape: 0.12, portrait: 0.06 })), yH, R.w * L.pick({ landscape: 0.3, portrait: 0.48 }));
  const shipB = shipPoly(U(L.pick({ landscape: 0.6, portrait: 0.6 })), yH, R.w * L.pick({ landscape: 0.22, portrait: 0.34 }));
  const subLen = R.w * L.pick({ landscape: 0.26, portrait: 0.5 }), subX = U(L.pick({ landscape: 0.5, portrait: 0.5 })), subY = V(L.pick({ landscape: 0.86, portrait: 0.87 }));
  const sub = subPoly(subX, subY, subLen);

  // sky: dense near the horizon so the ships stand out as black silhouettes
  const skyYs = []; for (let y = yH - px(13), i = 0; y > R.y + px(30); i++) { skyYs.push(y); y -= px(12) * (1 + i * 0.2); }
  const sky = ridgeLines({ x0: xIn0, x1: xIn1, ys: skyYs, w: i => px(7) * (1 - i * 0.04), lambda: px(1200), amp: px(1.5), seed: 22, minLen: px(240), maxLen: px(700) });
  const shipErase = polyPath(offsetPoly(densify(shipA, px(6)), px(19))); shipErase.addPath(polyPath(offsetPoly(densify(shipB, px(6)), px(19))));
  const shipContour = [...contourCuts(shipA, px(8), px(6), 2, 54), ...contourCuts(shipB, px(8), px(6), 2, 55)];
  const horizon = cut([[xIn0 - px(6), yH + px(2)], [U(0.5), yH], [xIn1 + px(6), yH + px(3)]], px(9), { seed: 32, entry: 0.02, exit: 0.02 });

  // sea: lively near the surface, sparse (darker) in the deep
  const seaYs = []; for (let y = yH + px(26), i = 0; y < R.y + R.h - px(24); i++) { seaYs.push(y); y += px(22) * (1 + i * 0.16); }
  const nS = seaYs.length;
  const sea = ridgeLines({ x0: xIn0, x1: xIn1, ys: seaYs, w: i => px(11) * (1 - 0.55 * i / nS), amp: i => px(7) * (1 - 0.8 * i / nS), lambda: px(L.pick({ landscape: 240, portrait: 200 })), seed: 42, phaseStep: 0.5, minLen: px(200), maxLen: px(560) });

  // depth charges: four small black barrels with a contour cut and a falling trail (dashes)
  const chargesAt = L.pick({
    landscape: [[0.2, 0.42], [0.31, 0.5], [0.66, 0.44], [0.74, 0.53]],
    portrait: [[0.18, 0.38], [0.36, 0.46], [0.7, 0.4], [0.82, 0.5]],
  });
  const cR = px(17);
  const charges = chargesAt.map(([u, v], i) => {
    const cx = U(u), cy = V(v), ring = []; for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283, c = Math.cos(a), sn = Math.sin(a); ring.push([cx + Math.sign(c) * Math.pow(Math.abs(c), 0.45) * cR * 0.78, cy + Math.sign(sn) * Math.pow(Math.abs(sn), 0.45) * cR]); }
    const erase = polyPath(offsetPoly(ring, px(22)));
    const contour = contourCuts(ring, px(9), px(6), 1, 70 + i);
    const trail = [0, 1, 2].map(j => cut([[cx, cy - cR - px(30) - j * px(34)], [cx, cy - cR - px(14) - j * px(34)]], px(6), { seed: 80 + i * 3 + j, tipMin: 0.5 }));
    return { cx, cy, erase, contour, trail };
  });
  // bursts: a black disc kept, spokes cut out of it — the shock, carved
  const burstsAt = L.pick({ landscape: [[0.36, 0.66], [0.58, 0.71], [0.24, 0.74]], portrait: [[0.32, 0.62], [0.66, 0.7], [0.3, 0.76]] });
  const bursts = burstsAt.map(([u, v], i) => {
    const cx = U(u), cy = V(v), r = seq(500 + i), rb = px(L.pick({ landscape: 78, portrait: 70 }));
    const erase = new Path2D(); erase.arc(cx, cy, rb, 0, 6.283);
    const spokes = []; const n = 13;
    for (let k = 0; k < n; k++) {
      const a = k / n * 6.283 + r() * 0.3, r1 = px(16) + r() * px(10), r2 = rb * (0.62 + r() * 0.3);
      spokes.push(cut([[cx + Math.cos(a) * r1, cy + Math.sin(a) * r1], [cx + Math.cos(a) * r2, cy + Math.sin(a) * r2]], px(11) * (0.8 + r() * 0.4), { seed: 600 + i * 20 + k, entry: 0.05, exit: 0.5, tipMin: 0.8 }));
    }
    spokes.push(cut([[cx - px(6), cy], [cx + px(6), cy]], px(16), { seed: 690 + i, tipMin: 0.9, chip: false }));
    return { erase, spokes, cx, cy };
  });
  const subErase = polyPath(offsetPoly(densify(sub, px(8)), px(26)));
  const subContour = contourCuts(sub, px(11), px(8), 2, 52);
  const hi = subHighlights(subX, subY, subLen, 62);

  // ---- timing (carving follows the words)
  schedule(subContour, 0.02, tAbove + 0.12, 0.25); schedule(hi, tAbove + 0.05, tAbove + 0.3, 0.5);
  cascade(sky, tAbove + 0.12, 0.022, 0.3);
  horizon.t0 = tShips - 0.5; horizon.dur = 0.3;
  schedule(shipContour, tShips - 0.42, tShips + 0.04, 0.3);
  cascade(sea, tShips - 0.35, 0.018, 0.28);
  charges.forEach((c, i) => { cascade(c.trail.slice().reverse(), tDrop - 0.08 + i * 0.1, 0.03, 0.08); schedule(c.contour, tDrop + 0.02 + i * 0.1, tDrop + 0.22 + i * 0.1); });
  bursts.forEach((b, i) => cascade(b.spokes, tDepth - 0.06 + i * 0.14, F * 0.5, 4 * F));

  const colour = new Path2D(); colour.rect(R.x + px(6), yH - px(4), R.w - px(3), R.y + R.h - yH + px(2));
  const pullT = tDepth + 0.62;
  const sCap = px(L.pick({ landscape: 42, portrait: 38 })), sText = 'MOSCOW: SILENT', sPad = px(18);
  const sW = textWidth(sText, sCap) + 2 * sPad + px(20), sH = sCap + 2 * sPad;
  const block = createBlock(root, ctx, {
    name: '2 Block II', seed: 202, rects: { R, band }, colour, misreg: [px(5), px(-4)],
    ops: [
      { cuts: sky }, { erase: shipErase }, { cuts: [horizon, ...sea, ...shipContour] },
      { erase: subErase }, { cuts: [...subContour, ...hi] },
      ...charges.flatMap(c => [{ erase: c.erase }, { cuts: [...c.contour, ...c.trail] }]),
      ...bursts.flatMap(b => [{ erase: b.erase }, { cuts: b.spokes }]),
    ],
    pull: { t0: pullT },
    pencil: { left: L.landscape ? 'ii · above it · 2/3' : 'ii · above it · 2/3' },
    stamp: { name: '2 Stamp — Moscow: silent', t: tSilent - 2 * F, rect: { x: band.x + band.w - sW, y: band.y + px(2), w: sW, h: sH }, draw: stampDraw(sText, sCap, { seed: 31 }), rot: -0.8 },
  });

  // ---- camera: from the sub up to the ships ("above it") → whole block for the charges (shake on the bursts) → print
  const page = camPage(L), cBlock = camFit(L, R, R, false);
  const cSub = camFit(L, { x: subX - subLen * 0.9, y: subY - R.h * 0.3, w: subLen * 1.8, h: R.h * 0.42 }, R);
  const cShips = camFit(L, { x: R.x, y: R.y, w: R.w * L.pick({ landscape: 0.85, portrait: 1 }), h: R.h * 0.5 }, R);
  const keys = [[0, cSub], [tAbove + 0.1, { ...cSub, s: cSub.s * 1.01 }], [tShips + 0.05, cShips], [tDrop + 0.1, { ...cShips, s: cShips.s * 1.015 }], [tDepth - 0.1, cBlock], [pullT + 10 * F, { ...cBlock, s: cBlock.s * 1.01 }], [pullT + 34 * F, page], [ctx.duration, { ...page, s: 1.035 }]];
  const shakeAt = t => { // noise-based, decaying; never a frame-by-frame sign flip
    let a = 0; bursts.forEach((b, i) => { const dt = t - b.spokes[0].t0; if (dt > 0 && dt < 0.6) a += (1 - dt / 0.6) ** 2; }); return a;
  };

  // ---- sound
  ctx.sfx('sand-sprinkle-01', 0.02, { lu: -27, duration: 2.4, fadeIn: 0.1, fadeOut: 0.4 });
  ctx.sfx('footsteps-wood-creep-01', 0.04, { lu: -18, duration: 0.42, fadeOut: 0.06 });
  ctx.sfx('footsteps-wood-creep-01', tShips - 0.3, { lu: -20, duration: 0.42, fadeOut: 0.06 });
  ctx.sfx('boom-distant-01', tDepth, { lu: -9, duration: 2.6, fadeOut: 1.2 });
  ctx.sfx('boom-distant-01', bursts[2].spokes[0].t0 + 0.04, { lu: -15, duration: 2.0, fadeOut: 1.0 });
  ctx.sfx('page-turn-01', block.pull.turn - 0.85, { lu: -13, duration: 1.75, fadeIn: 0.2, fadeOut: 0.3 });
  ctx.sfx('drawer-close-01', tSilent, { lu: -11 });

  return {
    update(t) {
      const c = camAt(t, keys), a = shakeAt(t) * px(5);
      block.update(t, { ...c, x: c.x + a * vnoise(t * 10, 3) / c.s, y: c.y + a * vnoise(t * 10, 9) / c.s });
    },
  };
}
