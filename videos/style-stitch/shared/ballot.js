// The vote, embroidered inside a wooden hoop (natural linen). Built identically by scenes 3 and 4 (same global
// times), so the cut between them has exact continuity. Coordinates are designed around the hoop centre (landscape
// units) and scaled for portrait.
// truth: VO/RC — the three-officer consent and the vote come from later accounts (they differ); labelled on the cloth.
import { Cloth, PAL, W, F, ellipse } from './stitch.js';
import { label, hoop } from './parts.js';

export function buildBallot(root, ctx) {
  const L = ctx.layout, P = L.portrait, Wd = L.width, Hd = L.height;
  const cloth = new Cloth(root, ctx, { kind: 'natural', name: 'Vote hoop (canvas)', bounds: { x: -Wd, y: -Hd, w: Wd * 3, h: Hd * 3 }, seed: 6 });
  const sc = P ? 0.92 : 1, cx = Wd / 2, cy = P ? Hd * 0.45 : Hd / 2, r = 470 * sc;
  const Q = (x, y) => [cx + x * sc, cy + y * sc];

  const tTo = W(ctx, 'To', 0, 15.73), tThree = W(ctx, 'three', 0, 16.51), tAgree = W(ctx, 'agree.', 0, 17.61);
  const tTwo = W(ctx, 'Two', 0, 18.29), tSay = W(ctx, 'say', 0, 18.55), tYes = W(ctx, 'yes.', 0, 18.8);
  const tVas = W(ctx, 'Vasili', 0, 20.61), tNo = W(ctx, 'no.', 0, 22.03), tForty = W(ctx, 'forty', 0, 24.13), tLater = W(ctx, 'later.', 0, 24.73);

  // YES column header + three empty boxes (pre-worked: the pattern was set up before the vote)
  const yesC = 6 * sc, yes = Cloth.crossText('YES', 0, 0, yesC);
  const box = 76 * sc, bx = Q(236, 0)[0];
  const yHead = Q(0, -300)[1];
  const yesT = Cloth.crossText('YES', bx + box / 2 - yes.w / 2, yHead, yesC);
  cloth.run(yesT.segs, { t0: -30, rate: 3000, color: PAL.charcoal, w: yesC * 0.44, needle: false, seed: 101 });
  const rowsY = [-230, -120, -10].map(y => Q(0, y)[1]);
  const boxes = rowsY.map((y, i) => {
    const b = [bx, y - 10 * sc, box, box];
    const pts = [[b[0], b[1]], [b[0] + box, b[1]], [b[0] + box, b[1] + box], [b[0], b[1] + box], [b[0], b[1]]];
    cloth.run(Cloth.back(pts, 12 * sc), { t0: -30, rate: 3000, color: PAL.charcoal, w: 2.4, needle: false, seed: 110 + i });
    cloth.name(`3B Box ${i + 1} (YES)`, b);
    return b;
  });

  // three names: traced in pen first, then backstitched one after the other on "three officers must agree"
  const names = ['V. SAVITSKY', 'I. MASLENNIKOV', 'V. ARKHIPOV'];
  const u = 9.5 * sc, nx = Q(-400, 0)[0];
  const tN0 = tTo + 0.02, tN1 = tAgree + 0.32, per = (tN1 - tN0) / 3;
  names.forEach((n, i) => {
    const bt = Cloth.backText(n, nx, rowsY[i], u);
    bt.strokes.forEach(s => cloth.trace(s, { t0: -9, t1: 99, a: 0.5, dash: [4, 4], w: 1.3 }));
    cloth.run(bt.segs, { t0: tN0 + per * i, rate: bt.segs.length / (per - 0.04), color: PAL.charcoal, w: 2.9 * sc + 0.4, seed: 120 + i, lift: 8, pre: i ? 0.04 : 0.25, post: i < 2 ? 0 : 0.3, angle: -0.95 });
    cloth.name(`3B Name ${i + 1}: ${n}`, [nx, rowsY[i], bt.w, 6 * u]);
  });

  // two say yes: an X of doubled long stitches (rust) in boxes 1 and 2
  [tTwo - F, tSay - F].forEach((t0, i) => {
    const b = boxes[i], m = 12 * sc, o = 3 * sc;
    const a = [b[0] + m, b[1] + m], c = [b[0] + box - m, b[1] + box - m], d = [b[0] + box - m, b[1] + m], e = [b[0] + m, b[1] + box - m];
    cloth.run([[a, c], [[a[0] + o, a[1] - o * 0.3], [c[0] + o * 0.3, c[1] - o]], [d, e], [[d[0] - o * 0.3, d[1] - o], [e[0] - o, e[1] + o * 0.3]]], { t0, rate: 26, color: PAL.rust, w: 5.2 * sc, seed: 130 + i, lift: 16, pre: 0.12, post: 0.18, needleLen: 128 });
  });

  // the third: a needle parked in box 3 with an unpulled RED thread (waiting) — until "no"
  const b3 = boxes[2], parkP = [b3[0] + box * 0.42, b3[1] + box * 0.58];
  const tNoStart = tNo - 0.1;
  cloth.parked({ p: parkP, t0: tYes + 0.15, t1: tNoStart, col: PAL.red, w: 3.4, angle: -0.95, len: 128,
    slack: [[70, 40], [100, 190], [-30, 150]].map(([x, y]) => [x * sc, y * sc]),
    lift: t => 7 * Math.max(0, Math.min(1, (t - (tVas + 0.4)) / 0.5)) });
  cloth.name('3B Needle with unpulled red thread', [parkP[0] - 10, parkP[1] - 110, 120, 220], tYes + 0.15, tNoStart);

  // NO — red satin, improvised (no pen pattern under it), stitched on "no"; thread direction follows each stroke
  const H = 170 * sc, sw = 30 * sc, nx0 = Q(30, 0)[0], ny0 = Q(0, 110)[1], nW = 120 * sc;
  const strokes = [
    [[nx0 + sw / 2, ny0 + H], [nx0 + sw / 2, ny0]],
    [[nx0 + sw / 2, ny0], [nx0 + nW - sw / 2, ny0 + H]],
    [[nx0 + nW - sw / 2, ny0 + H], [nx0 + nW - sw / 2, ny0]],
  ];
  const ox = nx0 + nW + 30 * sc + 65 * sc, oy = ny0 + H / 2;
  const oRing = ellipse(ox, oy, 65 * sc - sw / 2, H / 2 - sw / 2, 64, -Math.PI / 2, Math.PI * 1.5);
  const noSegs = [...strokes.flatMap(s => Cloth.satinSpine(s, () => sw, 3.1 * sc)), ...Cloth.satinSpine(oRing, () => sw, 3.1 * sc)];
  cloth.run(noSegs, { t0: tNoStart, pre: 0, rate: noSegs.length / 0.62, color: PAL.red, w: 4.4 * sc, seed: 140, lift: 10, angle: -0.95, tail: { len: 90 * sc, dir: -0.3, curl: 0.7, sway: 0.05 } });
  cloth.name('4 NO (red satin)', [nx0, ny0, ox + 65 * sc - nx0, H]);

  // forty years later: 2002 cross-stitched small, lower left
  const yc = 6.5 * sc, y2 = Cloth.crossText('2002', Q(-380, 0)[0], Q(0, 175)[1], yc);
  cloth.run(y2.segs, { t0: tForty - 0.05, rate: y2.segs.length / Math.max(0.5, tLater - tForty + 0.1), color: PAL.charcoal, w: yc * 0.44, seed: 150, lift: 6 });
  cloth.name('4 Year 2002 (cross-stitch)', [Q(-380, 0)[0], Q(0, 175)[1], y2.w, y2.h], tForty);

  hoop(cloth, { cx, cy, r, band: 26 * sc, name: 'Wooden hoop' });
  // honesty labels on the loose cloth outside the hoop
  label(cloth, P ? { x: cx - 215, y: cy + r + 60, text: 'Vote: later accounts differ', size: 25, t0: -9, name: 'Label accounts differ' }
    : { x: cx + r - 30, y: cy + r - 50, text: 'From later accounts, which differ', size: 27, t0: -9, rot: -0.05, name: 'Label accounts differ' });
  label(cloth, P ? { x: cx - 200, y: cy + r + 118, text: 'Widely known from c. 2002', size: 25, t0: tForty, name: 'Label 2002' }
    : { x: cx - r - 360, y: cy + r - 80, text: 'Widely known from c. 2002', size: 27, t0: tForty, rot: 0.04, name: 'Label 2002' });

  return { cloth, cx, cy, r, sc, Q, rowsY, boxes, t: { tTo, tTwo, tYes, tVas, tNo, tForty, tLater } };
}
