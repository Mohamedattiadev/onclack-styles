// SHEET 3 (used by scenes s3 AND s4): the torpedo, three officers from behind, two "yes", then Arkhipov's NO —
// one hard charcoal line through the torpedo. Built from GLOBAL times, so s3's last frames = s4's first frames.
// truth: torpedo = RC (type drawing, "1 on board" per later accounts); officers = VO (no faces, no likeness);
// the vote of three = as told in later accounts (debated) → note says "as later told".
import { Sheet, PAL, seq, fit, camAt, pastelPatch, blob } from './sketch.js';
import { torpedo, officer } from './figures.js';
import { creep } from '/onclack-styles/engine/lib/anim.js';

export function buildVote(root, ctx) {
  const L = ctx.layout, Pt = L.portrait, W = ctx.width, H = ctx.height, sf = L.safe, u = L.unit;
  const S = new Sheet(root, ctx, { seed: 37, name: 'Sheet 3' });

  // ---- 3A torpedo in its tube ----
  const tp = Pt ? { x: W * 0.5, y: H * 0.27, s: 0.86 * u } : { x: W * 0.4, y: H * 0.23, s: 1.12 * u };
  const tor = torpedo(S, tp, { seed: 2 });
  fit(tor.gesture, 13.6, 13.95);
  let t = fit(tor.contour, 13.97, 14.85);
  t = fit(tor.tone, t + 0.02, t + 0.28);
  fit(tor.chalk, t, t + 0.14);
  S.smudge([[tp.x - 430 * tp.s, tp.y + 40 * tp.s], [tp.x + 420 * tp.s, tp.y + 40 * tp.s], [tp.x + 400 * tp.s, tp.y + 80 * tp.s], [tp.x - 420 * tp.s, tp.y + 76 * tp.s]], { t0: 15.0, t1: 15.6, alpha: 0.28, blur: 14 * u });
  S.name('3A Nuclear torpedo in its tube (sketch)', [tp.x - 440 * tp.s, tp.y - 60 * tp.s, 880 * tp.s, 120 * tp.s]);
  const nx = Pt ? W * 0.5 : W * 0.835, ny = Pt ? tp.y + 112 * u : tp.y - 16 * u;
  S.text('nuclear torpedo', nx, ny, { size: 64 * u, t0: 14.95, cps: 22, align: 'center', rot: -1.5 });
  S.text('1 on board', nx, ny + 66 * u, { size: 56 * u, t0: 15.75, cps: 18, align: 'center', rot: 1, alpha: 0.8 });
  S.name('3A Note: nuclear torpedo, 1 on board', [nx - 230 * u, ny - 64 * u, 460 * u, 150 * u]);

  // ---- 3B three quick figure sketches (from behind) ----
  const fs = Pt ? [[0.2, 0.75, 0.72], [0.46, 0.755, 0.74], [0.755, 0.75, 0.76]] : [[0.17, 0.99, 1.0], [0.37, 1.0, 1.04], [0.66, 0.99, 1.06]];
  const figs = fs.map(([fx, fy, s], i) => officer(S, { x: W * fx, y: H * fy, s: s * u }, { seed: 4 + i * 3, lean: [-8, 6, -3][i] }));
  const fStart = [16.32, 16.82, 17.32];
  figs.forEach((f, i) => {
    const a = fStart[i];
    fit(f.gesture, a, a + 0.12);
    const e = fit(f.contour, a + 0.13, a + 0.4);
    fit(f.tone, e, e + 0.1);
    for (const c of f.chalk) { c.t0 = 99; c.t1 = 99; }
    const [[x0, y0], [x1, y1]] = f.box;
    S.name(`3B Officer ${i + 1} (from behind, no likeness)`, [x0, y0, x1 - x0, y1 - y0]);
  });
  // "must agree": one loose bracket under/over the three
  const bY = Pt ? H * 0.488 : H * 0.505, bx0 = W * fs[0][0] - 120 * u, bx1 = W * fs[2][0] + 120 * u;
  const brace = S.stroke([[bx0, bY + 16 * u], [bx0 + 10 * u, bY], [(bx0 + bx1) / 2 - 20 * u, bY - 2 * u], [(bx0 + bx1) / 2, bY - 16 * u], [(bx0 + bx1) / 2 + 20 * u, bY - 2 * u], [bx1 - 10 * u, bY], [bx1, bY + 16 * u]].map(([x, y]) => (Pt ? [x, 2 * bY - y] : [x, y])), { w: 3.2 * u, alpha: 0.8, per: 4 });
  brace.t0 = brace.t1 = 99;   // (tried a brace: read as a ruler line — the note alone is clearer)
  const ag = S.text(Pt ? 'all three must agree' : 'all three must agree', (bx0 + bx1) / 2, Pt ? bY : bY - 30 * u, { size: 52 * u, t0: 17.62, cps: 30, align: 'center', alpha: 0.85 });
  S.name('3B Note: all three must agree (as later told)', [(bx0 + bx1) / 2 - ag.total / 2, Pt ? bY - 54 * u : bY - 80 * u, ag.total, 70 * u]);

  // ---- 3C two say yes: ochre on two backs, "yes" over their heads ----
  [18.48, 18.76].forEach((tY, i) => {
    seq([figs[i].fill(PAL.ochre)], tY, { speed: 12000 });
    const [[x0, y0], [x1]] = figs[i].box;
    S.text('yes', (x0 + x1) / 2, y0 - 14 * u, { size: 62 * u, t0: tY + 0.04, cps: 14, align: 'center', rot: -4 + i * 5 });
  });

  // ---- 4A the third: cold blue, white chalk light, his name ----
  const f3 = figs[2], [[a0, b0], [a1, b1]] = f3.box;
  seq([f3.fill(PAL.blue)], 20.26, { speed: 12000 });
  for (const c of f3.chalk) { c.t0 = 0; c.t1 = 0; }
  fit(f3.chalk, 20.5, 20.7);
  seq(pastelPatch(S, blob((a0 + a1) / 2 - 30 * u, b0 + 120 * u, 120 * u, 70 * u, 81, 9), { color: PAL.chalk, w: 16 * u, seed: 83, alpha: 0.5, angles: [40] }), 20.62, { speed: 9000 });
  const nmX = Pt ? W * 0.5 : Math.min(a1 + 44 * u, sf.x + sf.w - 360 * u), nmY = Pt ? H * 0.79 : H * 0.72;
  const n1 = S.text(Pt ? 'Vasili Arkhipov' : 'Vasili', nmX, nmY, { size: 72 * u, t0: 20.6, cps: 13, rot: -2, align: Pt ? 'center' : 'left' });
  const n2 = S.text(Pt ? ' ' : 'Arkhipov', nmX + (Pt ? 0 : 6 * u), nmY + 76 * u, { size: 80 * u, t0: 21.12, cps: 15, rot: -1, bold: 1.2, align: Pt ? 'center' : 'left' });
  S.name('4A Name: Vasili Arkhipov', [nmX - (Pt ? 220 * u : 0), nmY - 70 * u, Math.max(n1.total, n2.total) + 20 * u, 170 * u]);

  // ---- 4B NO: one hard charcoal line through the torpedo, then the word ----
  const slash = S.stroke([[tp.x - 470 * tp.s, tp.y + 92 * tp.s], [tp.x, tp.y + 4 * tp.s], [tp.x + 470 * tp.s, tp.y - 96 * tp.s]], { w: 15 * u, alpha: 1, over: 30, taper: [0.03, 0.18], minW: 0.4, jit: 0.1, wobble: 2 });
  seq([slash], 21.97, { speed: 6000 });
  const slash2 = S.stroke([[tp.x - 440 * tp.s, tp.y + 104 * tp.s], [tp.x + 30 * tp.s, tp.y + 10 * tp.s], [tp.x + 450 * tp.s, tp.y - 80 * tp.s]], { w: 6 * u, alpha: 0.75, over: 20, taper: [0.05, 0.4], wobble: 1.5 });
  seq([slash2], 22.2, { speed: 7000 });
  const noX = (a0 + a1) / 2 - 10 * u, noY = b0 - 24 * u;
  S.text('NO', noX, noY, { size: 128 * u, t0: 22.04, cps: 9, align: 'center', bold: 2.4, rot: -3 });
  S.name('4B NO + the line through the torpedo', [tp.x - 470 * tp.s, tp.y - 100 * tp.s, 940 * tp.s, 200 * tp.s]);

  // ---- 4C forty years later ----
  const yx = Pt ? W * 0.5 : W * 0.835, yy = Pt ? H * 0.41 : tp.y + 150 * u;
  S.text('1962 → 2002', yx, yy, { size: 70 * u, t0: 23.62, cps: 9.5, align: 'center', rot: -1.5 });
  S.text('his name became known', yx, yy + 58 * u, { size: 48 * u, t0: 23.2, cps: 40, align: 'center', alpha: 0.75 });
  S.name('4C Note: 1962 → 2002', [yx - 260 * u, yy - 70 * u, 520 * u, 150 * u]);

  // ---- camera: torpedo → the three → lean in on the third → back out for the line → slow settle ----
  const C = Pt
    ? [[13.3, 1.0, W * 0.5, H * 0.45], [13.6, 1.0, W * 0.5, H * 0.45], [15.3, 1.2, W * 0.5, H * 0.33], [16.1, 1.2, W * 0.5, H * 0.33], [17.6, 1.02, W * 0.5, H * 0.56], [19.9, 1.02, W * 0.5, H * 0.56],
      [21.3, 1.08, W * 0.6, H * 0.62], [21.5, 1.08, W * 0.6, H * 0.62], [22.0, 1.0, W * 0.5, H * 0.5], [25.9, 0.985, W * 0.5, H * 0.5]]
    : [[13.3, 1.0, W * 0.5, H * 0.5], [13.6, 1.0, W * 0.5, H * 0.5], [15.3, 1.05, W * 0.52, H * 0.36], [16.1, 1.05, W * 0.52, H * 0.36], [17.6, 1.02, W * 0.48, H * 0.56], [19.9, 1.02, W * 0.48, H * 0.56],
      [21.3, 1.09, W * 0.6, H * 0.6], [21.5, 1.09, W * 0.6, H * 0.6], [22.0, 1.0, W * 0.5, H * 0.5], [25.9, 0.985, W * 0.5, H * 0.5]];

  return {
    S,
    update(tg) {
      const [s, fx, fy] = camAt(tg, C);
      S.camera(s, fx, fy);
      S.render(tg);
    },
  };
}
