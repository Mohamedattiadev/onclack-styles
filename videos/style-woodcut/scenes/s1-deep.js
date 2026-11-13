// BLOCK I — the date, the sea, the submarine. intent: KNOW 27 Oct 1962, a Soviet sub hides deep near Cuba ·
// FEEL curiosity, a held breath · SEE a black submarine left standing in carved sea ridges.
// truth: date = VO (our letters); sub = RC (generic Foxtrot-type outline, no markings); Cuba = RC silhouette.
import { F, C, rects, at, wordT, textCuts, textWidth, ridgeLines, cut, schedule, cascade, offsetPoly, densify, polyPath, contourCuts, camFit, camPage, camAt, createBlock, seq } from '../shared/wood.js';
import { subPoly, subHighlights } from '../shared/shapes.js';

export default function (root, ctx) {
  const L = ctx.layout, { R, band } = rects(L), land = L.landscape, px = L.px;
  const tOct = wordT(ctx, 'October', 0, 0.58), tTw = wordT(ctx, 'twenty-seventh', 0, 1.1), tNin = wordT(ctx, 'nineteen', 0, 2.07);
  const tSix = wordT(ctx, 'sixty-two', 0, 2.61), tSub = wordT(ctx, 'submarine', 0, 4.3), tDeep = wordT(ctx, 'deep', 0, 5.42), tCuba = wordT(ctx, 'Cuba', 0, 6.52);

  // ---- 1A the date, carved letter by letter
  const cap1 = px(L.pick({ landscape: 88, portrait: 74 })), cap2 = px(L.pick({ landscape: 180, portrait: 176 }));
  const dx = R.x + R.w * L.pick({ landscape: 0.045, portrait: 0.06 }), dy = R.y + R.h * L.pick({ landscape: 0.075, portrait: 0.045 });
  const oct = textCuts('OCTOBER', dx, dy, cap1, { seed: 11 });
  const d27 = textCuts('27', dx + oct.w + cap1 * 0.55, dy, cap1, { seed: 12 });
  const y2 = dy + cap1 + px(L.pick({ landscape: 42, portrait: 36 }));
  const c19 = textCuts('19', dx - cap2 * 0.02, y2, cap2, { seed: 13, wRel: 0.19 });
  const c62 = textCuts('62', dx - cap2 * 0.02 + c19.w + cap2 * 0.3, y2, cap2, { seed: 14, wRel: 0.19 });
  schedule(oct.cuts, tOct - 0.26, tTw - 0.08);
  schedule(d27.cuts, tTw - 0.06, tTw + 0.5);
  schedule(c19.cuts, tNin - 0.08, tNin + 0.42);
  schedule(c62.cuts, tSix - 0.1, tSix + 0.4);
  const dateBottom = y2 + cap2, dateRight = dx + Math.max(oct.w + cap1 * 0.55 + d27.w, c19.w + cap2 * 0.3 + c62.w);

  // ---- 1B sky (sparse horizontal cuts), horizon, Cuba, sea ridges
  const yH = R.y + R.h * L.pick({ landscape: 0.53, portrait: 0.42 });
  const skyYs = []; for (let y = yH - px(16), i = 0; y > (land ? R.y + px(26) : dateBottom + px(36)); i++) { skyYs.push(y); y -= px(15) * (1 + i * 0.16); }
  const sky = ridgeLines({ x0: land ? dateRight + px(70) : R.x + px(28), x1: R.x + R.w - px(26), ys: skyYs, w: i => px(7.5) * (1 - i * 0.05), lambda: px(900), amp: px(2), seed: 21, minLen: px(180), maxLen: px(520) });
  cascade(sky, 2.62, 0.028, 0.3);
  const iu = u => R.x + R.w * u, ih = v => yH - R.h * v;
  const ihp = v => yH - px(v); // hills in design px
  const island = [[iu(0.66), yH + px(4)], [iu(0.69), ihp(14)], [iu(0.73), ihp(30)], [iu(0.76), ihp(26)], [iu(0.8), ihp(52)], [iu(0.83), ihp(70)], [iu(0.86), ihp(58)], [iu(0.9), ihp(64)], [iu(0.935), ihp(40)], [iu(0.95), ihp(22)], [iu(0.965), ihp(10)], [iu(0.968), yH + px(4)]];
  const capC = px(L.pick({ landscape: 40, portrait: 38 })), cubaW = textWidth('CUBA', capC);
  const cubaX = iu(0.83) - cubaW / 2, cubaY = ihp(70) - px(34) - capC;
  const cuba = textCuts('CUBA', cubaX, cubaY, capC, { seed: 15, wRel: 0.2 });
  schedule(cuba.cuts, 3.05, 3.45);
  const labelBox = new Path2D(); labelBox.rect(cubaX - px(18), cubaY - px(16), cubaW + px(36), capC + px(32));
  const islandErase = polyPath(offsetPoly(densify(island, px(8)), px(7))); islandErase.addPath(labelBox);

  const horizon = cut([[R.x + px(22), yH + px(1)], [R.x + R.w * 0.5, yH - px(1)], [R.x + R.w - px(22), yH + px(2)]], px(10), { seed: 31, entry: 0.02, exit: 0.02 });
  const seaYs = []; for (let y = yH + px(30), i = 0; y < R.y + R.h - px(16); i++) { seaYs.push(y); y += px(23) * (1 + i * 0.075); }
  const nSea = seaYs.length;
  const sea = ridgeLines({ x0: R.x + px(28), x1: R.x + R.w - px(26), ys: seaYs, w: i => px(12.5) * (1 - 0.5 * i / nSea), amp: i => px(8) * (1 - 0.75 * i / nSea), lambda: px(L.pick({ landscape: 250, portrait: 210 })), seed: 41, phaseStep: 0.5, minLen: px(300), maxLen: px(800) });
  horizon.t0 = 2.75; horizon.dur = 0.35;
  cascade(sea, 2.88, 0.02, 0.32);

  // ---- 1C the submarine, left standing: ridges stop around it, one knife contour, three highlight cuts
  const subLen = R.w * L.pick({ landscape: 0.34, portrait: 0.62 }), subX = R.x + R.w * L.pick({ landscape: 0.42, portrait: 0.47 }), subY = R.y + R.h * L.pick({ landscape: 0.8, portrait: 0.77 });
  const sub = subPoly(subX, subY, subLen);
  const subErase = polyPath(offsetPoly(densify(sub, px(8)), px(28)));
  const subContour = contourCuts(sub, px(12), px(9), 2, 51);
  schedule(subContour, tSub - 0.78, tSub - 0.12, 0.2);
  const hi = subHighlights(subX, subY, subLen, 61); schedule(hi, tSub - 0.2, tSub + 0.12, 0.5);

  // ---- colour block: the sea, teal
  const colour = new Path2D(); colour.rect(R.x + px(6), yH - px(5), R.w + px(1), R.y + R.h - yH + px(5));

  const pullT = tSub + 0.02;
  const block = createBlock(root, ctx, {
    name: '1 Block I', seed: 101, rects: { R, band }, colour, misreg: [px(8), px(-6)],
    ops: [{ cuts: [...oct.cuts, ...d27.cuts, ...c19.cuts, ...c62.cuts] }, { cuts: sky }, { erase: islandErase }, { cuts: cuba.cuts }, { cuts: [horizon, ...sea] }, { erase: subErase }, { cuts: [...subContour, ...hi] }],
    pull: { t0: pullT },
    pencil: { left: 'i · deep, near Cuba', right: '1/3' },
  });

  // ---- camera: CU on the date as it is cut → whole block for the sea → pull back to the print → push to the sub → drift to Cuba
  const dateRect = { x: land ? dx - px(30) : R.x - px(10), y: dy - px(30), w: L.pick({ landscape: R.w * 0.53, portrait: R.w }), h: dateBottom - dy + px(70) };
  const c0 = camFit(L, dateRect, R), c0b = { ...c0, x: c0.x + px(14), s: c0.s * 1.025 };
  const cBlock = camFit(L, R, R, false);
  const page = camPage(L);
  const sv = (s, x, y) => ({ s, x: Math.min(L.width - L.width / (2 * s), Math.max(L.width / (2 * s), x)), y: Math.min(L.height - L.height / (2 * s), Math.max(L.height / (2 * s), y)) });
  const cSub = sv(1.12, subX, L.height / 2 + px(34));
  const cCuba = sv(1.15, subX + (iu(0.83) - subX) * 0.3, L.height / 2 + px(10));
  const keys = [[0, c0], [2.55, c0b], [3.5, cBlock], [pullT + 10 * F, { ...cBlock, s: cBlock.s * 1.01 }], [pullT + 34 * F, page], [tDeep - 0.1, page], [tCuba - 0.2, cSub], [ctx.duration, cCuba]];

  // ---- sound: sea under everything up to the vote, chips while carving, the gouge pushes, the paper turned
  ctx.ambience('sea-water-close-01', { from: 0, to: 21.55, lu: -17, fade: 1.0 });
  ctx.sfx('sand-sprinkle-01', tOct - 0.3, { lu: -27, duration: 2.6, fadeIn: 0.15, fadeOut: 0.4 });
  ctx.sfx('sand-sprinkle-01', 2.7, { lu: -25, duration: 1.5, fadeIn: 0.1, fadeOut: 0.3 });
  const r = seq(7);
  for (const tt of [oct.cuts[0].t0, d27.cuts[0].t0, c19.cuts[0].t0, c62.cuts[0].t0, subContour[0].t0]) ctx.sfx('footsteps-wood-creep-01', tt + F, { lu: -17 - r() * 3, duration: 0.42, fadeOut: 0.06 });
  ctx.sfx('page-turn-01', block.pull.turn - 0.85, { lu: -13, duration: 1.75, fadeIn: 0.2, fadeOut: 0.3 });

  return { update(t) { block.update(t, camAt(t, keys)); } };
}
