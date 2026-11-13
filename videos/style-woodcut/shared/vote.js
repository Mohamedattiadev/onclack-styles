// BLOCK III (scenes 3 + 4 share it, global time, so the join is seamless): the torpedo, three carved frames = three
// officers, two "yes" marks, then the third frame gets the name and a bold carved NO. One print shows the whole decision.
// truth: torpedo = RC (generic, no type claimed); frames/marks/NO = VO (a symbol of the vote, not a record of a ballot);
// name = fact (Vasili Arkhipov, flotilla chief of staff aboard B-59); 2002 = when his role became widely known
// (Havana conference, Oct 2002) — re-check with 2+ sources before public use.
import { F, rects, ridgeLines, cut, schedule, cascade, offsetPoly, densify, polyPath, contourCuts, camFit, camPage, camAt, createBlock, stampDraw, textWidth, textCuts, boldGlyphPath, clearingCuts } from './wood.js';
import { torpedoPoly, torpedoDetails } from './shapes.js';

/** global start time of the n-th occurrence of a word */
export function gT(ctx, word, n = 0, fb = 0) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = ctx.words.filter(w => norm(w.word) === norm(word));
  return hits[n]?.start ?? fb;
}

export function buildVote(root, ctx, { name }) {
  const L = ctx.layout, { R, band } = rects(L), land = L.landscape, px = L.px;
  const U = u => R.x + R.w * u, V = v => R.y + R.h * v;
  const xIn0 = R.x + px(28), xIn1 = R.x + R.w - px(26);
  const T = {
    start: gT(ctx, 'On', 0, 13.67) - 0.35, board: gT(ctx, 'board', 0, 13.83), torpedo: gT(ctx, 'torpedo', 0, 14.88), three: gT(ctx, 'three', 0, 16.51),
    officers: gT(ctx, 'officers', 0, 16.86), two: gT(ctx, 'Two', 0, 18.29), yes: gT(ctx, 'yes', 0, 18.8), third: gT(ctx, 'third', 0, 20.25),
    vas: gT(ctx, 'Vasili', 0, 20.61), ark: gT(ctx, 'Arkhipov', 0, 21.12), says: gT(ctx, 'says', 0, 21.69), no: gT(ctx, 'no', 0, 22.03),
    world: gT(ctx, 'world', 0, 23.07), forty: gT(ctx, 'forty', 0, 24.13),
  };

  // ---- the torpedo, left standing in a field of horizontal cuts (teal under them)
  const tLen = R.w * L.pick({ landscape: 0.8, portrait: 0.88 }), tx0 = U(L.pick({ landscape: 0.09, portrait: 0.06 })), ty = V(L.pick({ landscape: 0.25, portrait: 0.15 })), tr = R.h * L.pick({ landscape: 0.115, portrait: 0.052 });
  const torp = torpedoPoly(tx0, ty, tLen, tr);
  const fieldBottom = V(L.pick({ landscape: 0.47, portrait: 0.28 }));
  const fieldYs = []; for (let y = R.y + px(34); y < fieldBottom; y += px(17)) fieldYs.push(y);
  const field = ridgeLines({ x0: xIn0, x1: xIn1, ys: fieldYs, w: px(7.5), amp: px(1.2), lambda: px(1400), seed: 23, minLen: px(300), maxLen: px(900) });
  const torpErase = polyPath(offsetPoly(densify(torp, px(6)), px(17)));
  const torpContour = contourCuts(torp, px(8), px(6.5), 2, 53);
  const torpDet = torpedoDetails(tx0, ty, tLen, tr, 63);
  const sep = cut([[xIn0 - px(6), fieldBottom + px(16)], [xIn1 + px(6), fieldBottom + px(14)]], px(9), { seed: 33, entry: 0.02, exit: 0.02 });

  // ---- three frames (landscape: columns; portrait: rows)
  const top = fieldBottom + px(L.pick({ landscape: 56, portrait: 50 })), bottom = R.y + R.h - px(L.pick({ landscape: 46, portrait: 42 }));
  const gap = px(L.pick({ landscape: 40, portrait: 30 }));
  const slots = [0, 1, 2].map(i => land
    ? { x: xIn0 + px(20) + i * ((xIn1 - xIn0 - px(40) - 2 * gap) / 3 + gap), y: top, w: (xIn1 - xIn0 - px(40) - 2 * gap) / 3, h: bottom - top }
    // 9:16 rows: the two "yes" rows are short, the third (the hero) is tall
    : (() => { const hh = bottom - top - 2 * gap, hs = [0.25, 0.25, 0.5].map(f => f * hh), y = top + hs.slice(0, i).reduce((a, b) => a + b + gap, 0); return { x: xIn0 + px(20), y, w: xIn1 - xIn0 - px(40), h: hs[i] }; })());
  const fw = px(9);
  const frames = slots.map((s, i) => [[[s.x - fw, s.y], [s.x + s.w + fw, s.y]], [[s.x + s.w, s.y - fw], [s.x + s.w, s.y + s.h + fw]], [[s.x + s.w + fw, s.y + s.h], [s.x - fw, s.y + s.h]], [[s.x, s.y + s.h + fw], [s.x, s.y - fw]]]
    .map((p, k) => cut(p, fw, { seed: 900 + i * 10 + k, entry: 0.05, exit: 0.05, tipMin: 0.5 })));
  // yes marks: one bold gouge each, slightly slanted
  // a carved tick = yes: a short stab down, then one long push up and out
  const marks = [0, 1].map(i => {
    const s = slots[i], cx = s.x + s.w / 2, cy = s.y + s.h * 0.54, z = Math.min(s.w, s.h) * 0.66, markW = Math.max(px(16), z * 0.16);
    return [cut([[cx - z * 0.4, cy - z * 0.04], [cx - z * 0.12, cy + z * 0.3]], markW * 0.85, { seed: 950 + i, entry: 0.15, exit: 0.05, tipMin: 0.4 }),
      cut([[cx - z * 0.14, cy + z * 0.3], [cx + z * 0.12, cy - z * 0.08], [cx + z * 0.4, cy - z * 0.4]], markW, { seed: 960 + i, entry: 0.05, exit: 0.28, tipMin: 0.6 })];
  });

  // the third frame: the name, small, then NO, big
  const s3 = slots[2], nCap = px(L.pick({ landscape: 36, portrait: 34 })), pad = px(L.pick({ landscape: 30, portrait: 28 }));
  const vas = textCuts('VASILI', s3.x + pad, s3.y + pad, nCap, { seed: 41 });
  const ark = land ? textCuts('ARKHIPOV', s3.x + pad, s3.y + pad + nCap * 1.5, nCap, { seed: 42 }) : textCuts('ARKHIPOV', s3.x + pad + vas.w + nCap * 0.55, s3.y + pad, nCap, { seed: 42 });
  let noCap, noX, noY;
  if (land) {
    const availH = s3.h - pad * 2 - nCap * 2.5 - px(30), availW = s3.w - 2 * pad;
    noCap = Math.min(availH / 1.34, availW / 2.42); const wNo = noCap * 2.42;
    noX = s3.x + (s3.w - wNo) / 2; noY = s3.y + s3.h - pad - noCap * 1.17;
  } else {
    // tall hero row: the name on one line at the top, NO under it
    const availH = s3.h - pad * 2 - nCap - px(34), availW = s3.w - 2 * pad;
    noCap = Math.min(availH / 1.34, availW / 2.42); const wNo = noCap * 2.12;
    noX = s3.x + (s3.w - wNo) / 2; noY = s3.y + s3.h - pad - noCap * 1.17;
  }
  const NO = boldGlyphPath('NO', noX, noY, noCap, { seed: 7 });
  const clear = clearingCuts(NO.strokes, NO.w, { lanes: 3, seed: 8 });

  // ---- timing (global)
  schedule(torpContour, T.start + 0.12, T.board + 0.5, 0.15);
  cascade(field, T.board + 0.25, 0.017, 0.26);
  schedule(torpDet, T.torpedo - 0.18, T.torpedo + 0.4, 0.4);
  sep.t0 = T.torpedo + 0.45; sep.dur = 0.3;
  frames.forEach((f, i) => schedule(f, T.three - 0.12 + i * 0.2, T.three + 0.14 + i * 0.2, 0.3));
  marks[0][0].t0 = T.two - 3 * F; marks[0][0].dur = 3 * F; marks[0][1].t0 = T.two; marks[0][1].dur = 5 * F;
  marks[1][0].t0 = T.yes - 3 * F; marks[1][0].dur = 3 * F; marks[1][1].t0 = T.yes; marks[1][1].dur = 5 * F;
  schedule(vas.cuts, T.vas - 0.1, T.vas + 0.4); schedule(ark.cuts, T.ark - 0.08, T.ark + 0.5);
  // NO: the centre pass of every stroke lands on the word, then the side passes clear it bold
  const centre = clear.filter((_, i) => i % 3 === 1), sides = clear.filter((_, i) => i % 3 !== 1);
  cascade(centre, T.no - 6 * F, F * 0.3, 3 * F);
  cascade(sides, T.no - 2 * F, F * 0.3, 4 * F);

  const colour = new Path2D(); colour.rect(R.x + px(6), R.y + px(6), R.w - px(3), fieldBottom - R.y + px(2));
  const pullT = T.no + 0.5;
  const sCap = px(L.pick({ landscape: 44, portrait: 42 })), sText = '1962 > 2002', sPad = px(18);
  const sW = textWidth(sText, sCap) + 2 * sPad + px(20), sH = sCap + 2 * sPad;
  const block = createBlock(root, ctx, {
    name, seed: 303, rects: { R, band }, colour, misreg: [px(5), px(4)],
    ops: [
      { cuts: field }, { erase: torpErase }, { cuts: [...torpContour, ...torpDet, sep] },
      { cuts: frames.flat() }, { cuts: marks.flat() }, { cuts: [...vas.cuts, ...ark.cuts] },
      { cuts: clear, clip: NO.path, noGuide: true },
    ],
    pull: { t0: pullT },
    pencil: { left: 'iii · three must agree · 3/3' },
    stamp: { name: '4 Stamp — 1962 to 2002', t: T.forty - 2 * F, rect: { x: band.x + band.w - sW, y: band.y + px(2), w: sW, h: sH }, draw: stampDraw(sText, sCap, { seed: 33 }), rot: 0.7 },
  });

  // ---- camera (global): nose CU while the contour is cut → torpedo whole → the three frames → push into frame 3 → print
  const page = camPage(L), cBlock = camFit(L, R, R, false);
  const cNose = camFit(L, { x: tx0 - px(40), y: ty - tr * 2.2, w: tLen * L.pick({ landscape: 0.42, portrait: 0.6 }), h: tr * 4.4 }, R);
  const cTorp = land ? cBlock : camFit(L, { x: R.x, y: R.y, w: R.w, h: fieldBottom - R.y + px(60) }, R);
  const cSlots = cBlock;
  const cThird = land ? camFit(L, { x: s3.x - px(40), y: s3.y - px(40), w: s3.w + px(80), h: s3.h + px(80) }, R)
    : camFit(L, { x: s3.x - px(14), y: s3.y - px(20), w: s3.w + px(28), h: s3.h + px(40) }, R);
  const keys = [[T.start, cNose], [T.board + 0.3, { ...cNose, x: cNose.x + px(60) }], [T.torpedo + 0.2, cTorp], [T.three - 0.6, { ...cTorp, s: cTorp.s * 1.01 }], [T.three + 0.25, cSlots],
    [T.third - 0.25, { ...cSlots, s: cSlots.s * 1.03 }], [T.vas - 0.05, cThird], [T.no + 0.3, { ...cThird, s: cThird.s * 1.03 }], [pullT + 10 * F, { ...cThird, s: cThird.s * 1.035 }], [pullT + 36 * F, page],
    [T.start + 13.2, { ...page, s: 1.03, y: page.y + px(8) }]];

  return { T, block, cam: t => camAt(t, keys), pullT };
}
