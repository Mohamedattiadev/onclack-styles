// 1 · HOOK + ORIENT. KNOW: 27 Oct 1962, a Soviet submarine deep in the sea near Cuba. FEEL: hush, a careful hand.
// SEE: a folded sheet finishes its last cut and OPENS (signature) → the date is cut letter by letter → a submarine is cut
// freehand below the lace waves, the piece drops out, light shows its shape → a dotted depth line → Cuba is cut.
// truth: RC (schematic, not to scale; Cuba outline = Natural Earth PD). Pencil note = our label.
import { makeStage, makeSheet, borderLace, waveRows, garland, subPath, cubaPath, wt, textW, P, PAL } from '../shared/lace.js';
import { glide } from '/onclack-styles/engine/lib/spring.js';

export default async function (root, ctx) {
  const S = await makeStage(root, ctx, { seed: 11, lamp: [0.5, 0.55] });
  const { L, W, H, u } = S;
  const port = L.portrait;
  const box = L.pick({
    landscape: { x: W * 0.065, y: H * 0.07, w: W * 0.87, h: H * 0.86 },
    portrait: { x: W * 0.04, y: H * 0.085, w: W * 0.86, h: H * 0.715 },
  });
  const r = L.pick({ landscape: 19, portrait: 17 }) * u;
  const sh = makeSheet(S, { ...box, r, openAt: 0.42, openDur: 0.5, name: '1 · Lace sheet (folded at start)' });
  const lace = borderLace(box.x, box.y, box.w, box.h, r, 11);
  sh.holes(lace.holes);
  const I = lace.inner, cx = box.x + box.w / 2;

  // ---- voice (local)
  const tOct = wt(ctx, 'October', 0, 0.58), tNine = wt(ctx, 'nineteen', 0, 2.07);
  const tSub = wt(ctx, 'submarine', 0, 4.3), tDeep = wt(ctx, 'deep', 0, 5.42), tCuba = wt(ctx, 'Cuba', 0, 6.52), tNear = wt(ctx, 'near', 0, 6.24);

  // ---- ornament waves (symmetric, cut while folded)
  const waveY = I.y + I.h * L.pick({ landscape: 0.41, portrait: 0.36 });
  sh.holes(garland(cx, I.y + I.h * L.pick({ landscape: 0.29, portrait: 0.295 }), I.w * L.pick({ landscape: 0.62, portrait: 0.9 }), L.pick({ landscape: 40, portrait: 36 }) * u, 0, false));
  const ww = L.pick({ landscape: 58, portrait: 50 }) * u;
  sh.holes(waveRows(cx, waveY, I.w - r, 3, ww, L.pick({ landscape: 30, portrait: 26 }) * u));

  // ---- last folded cut: a lozenge on the crease (half cut → opens to a whole)
  const lzH = 50 * u, lzY = I.y + I.h * L.pick({ landscape: 0.29, portrait: 0.295 }) + lzH / 2;
  sh.cut(`M${cx} ${lzY - lzH} Q${cx - 46 * u} ${lzY - lzH * 0.5} ${cx - 54 * u} ${lzY - lzH * 0.5} Q${cx - 46 * u} ${lzY - lzH * 0.5} ${cx} ${lzY} Z`,
    -0.05, 0.36, { mirror: true, pencil: false, seed: 3 });

  // ---- date, cut letter by letter
  if (!port) {
    const sz = 132 * u, a = '27 OCTOBER', b = '1962', gap = 46 * u;
    const wa = textW(a, sz), wb = textW(b, sz), x0 = cx - (wa + gap + wb) / 2, y = I.y + I.h * 0.2;
    sh.cutText(a, x0, y, sz, tOct + 0.42, tNine - 0.1, { name: '1 · Date "27 OCTOBER"' });
    sh.cutText(b, x0 + wa + gap, y, sz, tNine - 0.02, tNine + 0.5, { name: '1 · Year 1962' });
  } else {
    const a = '27 OCTOBER', b = '1962';
    const sa = Math.min(118 * u, (I.w - 20 * u) / (textW(a, 100) / 100)), sb = 190 * u;
    sh.cutText(a, cx - textW(a, sa) / 2, I.y + I.h * 0.085, sa, tOct + 0.42, tNine - 0.1, { name: '1 · Date "27 OCTOBER"' });
    sh.cutText(b, cx - textW(b, sb) / 2, I.y + I.h * 0.24, sb, tNine - 0.02, tNine + 0.5, { name: '1 · Year 1962' });
  }

  // ---- the submarine, cut freehand under the waves
  const sub = L.pick({
    landscape: { x: I.x + I.w * 0.07, y: I.y + I.h * 0.84, len: I.w * 0.4 },
    portrait: { x: I.x + I.w * 0.06, y: I.y + I.h * 0.6, len: I.w * 0.86 },
  });
  sh.cut(subPath(sub.x, sub.y, sub.len), tSub - 0.06, tSub + 0.98, { name: 'Submarine cut', seed: 5, pre: 1.75 });
  // depth: a line of pin-holes from the surface lace down to the sail
  const dx = sub.x + sub.len * 0.585, yTop = waveY + 3 * 30 * u, yBot = sub.y - sub.len * 0.17;
  const dots = [];
  for (let y = yTop; y < yBot; y += 15 * u) dots.push([dx, y]);
  sh.cutDots(dots, 3.6 * u, tDeep - 0.06, tDeep + 0.42);
  sh.pencilText('Soviet submarine B-59', sub.x + sub.len * 0.04, sub.y + sub.len * 0.12 + 18 * u, L.pick({ landscape: 34, portrait: 36 }) * u, tSub + 0.9, { rot: -1.5 });
  

  // ---- Cuba (Natural Earth outline), cut fast, then its name
  const cb = L.pick({
    landscape: { x: I.x + I.w * 0.6, y: I.y + I.h * 0.6, w: I.w * 0.36, h: I.h * 0.22 },
    portrait: { x: I.x + I.w * 0.18, y: I.y + I.h * 0.76, w: I.w * 0.72, h: I.h * 0.14 },
  });
  sh.cut(await cubaPath(ctx, cb), tNear - 0.02, tCuba + 0.36, { name: 'Cuba cut', seed: 9, pre: 3.7, fallOpts: { spin: 0.4 } });
  const cs = L.pick({ landscape: 50, portrait: 50 }) * u;
  sh.cutText('CUBA', cb.x + cb.w * 0.5 - textW('CUBA', cs) / 2, cb.y + cb.h + cs * 0.95, cs, tCuba + 0.44, tCuba + 0.8, { name: 'Cut text CUBA' });
  sh.pencilText('schematic · not to scale', cb.x + cb.w * 0.5, cb.y + cb.h + cs * 1.75, 26 * u, tCuba + 0.85, { anchor: 'middle', rot: -1 });

  // ---- sound
  ctx.sfx('page-turn-01', 0.42, { lu: -11, duration: 0.9, fadeOut: 0.2 });   // the fold opens
  ctx.ambience('sea-water-close-01', { from: 3.3, to: ctx.duration, lu: -24, fade: 1.2 }); // the sea, under the hull

  return {
    update(t) {
      S.setCam(glide(t, 0, ctx.duration, 1.0, 1.035), W * 0.5, H * 0.55);
      S.update(t);
    },
  };
}
