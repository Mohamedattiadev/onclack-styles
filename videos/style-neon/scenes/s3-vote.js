// 3 · The torpedo and the three officers. Each officer is ONE bent tube (toe to toe, electrodes at the floor), each
// with his own weight and posture. The vote: a small warm "YES" tube catches over the first, then the second.
// Nothing over the third — his little tube stays dark glass.
import { glide } from '/onclack-styles/engine/lib/spring.js';
import { makeStage, makeTube, paintLabel, textStrokes, xf, SHAPES, FIGURES, bright, emptyMount } from '../shared/neon.js';
import { wordAt, switchOn, F } from '../shared/cues.js';

const TORP_ORDER = [SHAPES.torpedo[1], SHAPES.torpedo[0], SHAPES.torpedo[3], SHAPES.torpedo[2]];

export default function (root, ctx) {
  const st = makeStage(root, ctx, { seed: 37, name: '3 · Sign wall (the vote)' });
  const { W, H, u, L } = st;
  const sf = L.safe, P = L.portrait, words = ctx.words;

  // torpedo across the top
  const tl = L.pick({ landscape: 980, portrait: 800 }) * u;
  const tx = P ? W * 0.47 : W / 2, ty = H * L.pick({ landscape: 0.2, portrait: 0.25 });
  const torp = makeTube(st, { strokes: xf(TORP_ORDER, tx, ty, tl / 100), gas: 'warm', w: L.pick({ landscape: 10, portrait: 9 }) * u, name: '3A T-5 torpedo',
    ends: ['up', 'down'], grommet: true,
    wireTo: [[tx - tl * 0.47, ty - tl * 0.085 - 46 * u], [tx - tl * 0.47, ty + tl * 0.085 + 46 * u]] });
  paintLabel(st, tx + tl * 0.5, ty + tl * 0.042 + 58 * u, 'T-5 nuclear torpedo', { size: 26, anchor: 'end', name: '3A label' });

  // three officers
  const fh = L.pick({ landscape: 470, portrait: 520 }) * u;
  const base = H * L.pick({ landscape: 0.92, portrait: 0.76 });
  const fx = P ? [W * 0.2, W * 0.45, W * 0.7] : [W * 0.27, W * 0.5, W * 0.73];
  const figs = FIGURES.map((f, i) => {
    const s = fh / 100;
    const strokes = xf(f.s, fx[i], base, s);
    const lt = strokes[0][0], rt = strokes[strokes.length - 1].slice(-1)[0];
    return makeTube(st, { strokes, gas: 'warm', w: L.pick({ landscape: 9, portrait: 8.5 }) * u, name: `3B officer ${i + 1}: ${f.name}`,
      ends: ['left', 'right'], grommet: true, supportEvery: 9 * u * 18,
      wireTo: [[lt[0] - 70 * u, lt[1] + 4 * u], [rt[0] + 70 * u, rt[1] + 4 * u]] });
  });
  // vote tubes over the first two heads; the third slot is only drilled holes
  const ycap = L.pick({ landscape: 52, portrait: 50 }) * u;
  const votes = fx.slice(0, 2).map((x, i) => {
    const y = base - fh - ycap - 46 * u;
    const tsx = textStrokes('YES', x, y, ycap, { align: 0.5 });
    return makeTube(st, { strokes: tsx.strokes, gas: 'warm', w: 6.5 * u, name: `3C vote ${i + 1}`, ends: ['back', 'back'], supports: false });
  });

  // the third slot: drilled, empty — no answer yet
  emptyMount(st, fx[2], base - fh - ycap * 0.5 - 46 * u, ycap * 2.2, '3C vote 3: empty mounting');

  const tTorp = switchOn(ctx, wordAt(words, 'torpedo', 0, 14.88) - 2 * F);
  const tOff = wordAt(words, 'three', 0, 16.51) - 2 * F;
  [0, 1, 2].forEach(i => switchOn(ctx, tOff + i * 0.2, { sfx: 'neon-tick-01', lu: -20 }));
  const tYes1 = switchOn(ctx, wordAt(words, 'Two', 0, 18.29) - 2 * F, { lu: -17 });
  const tYes2 = switchOn(ctx, wordAt(words, 'yes', 0, 18.8) - 2 * F, { lu: -17 });
  ctx.sfx('cloth-jacket-01', tYes2 - ctx.start + 0.1, { lu: -26 });

  return {
    update(t) {
      const T = ctx.start + t;
      torp.set(bright(T, tTorp, 71));
      figs.forEach((f, i) => f.set(bright(T, tOff + i * 0.2, 81 + i)));
      votes[0].set(bright(T, tYes1, 91));
      votes[1].set(bright(T, tYes2, 92));
      st.camera(glide(t, 0, ctx.duration + 1, 1.0, 1.04), fx[2], base - fh * 0.6);
      st.grainAt(T);
    },
  };
}
