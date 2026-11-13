// 4 · peak + resolution. intent: KNOW Arkhipov said no; his role became known ≈ 40 years later (c. 2002 Havana conference)
// · FEEL held breath, then weight of one refusal · SEE the third day section laid over his underdrawing, NO in cinnabar
// (the only red), then the camera pulls back and the whole wall ages: cracks run, flakes drop, the NO stays whole.
// Sound: the sea bed is gone (the drop) → room tone, one breath, a wooden thud on NO, plaster debris on the flakes.
import { buildFresco } from '../shared/fresco.js';
export default async function (root, ctx) {
  const w = await buildFresco(root, ctx, 's4');
  const T = w.T, s = ctx.start;
  ctx.sfx('breath-close-01', T.arkhipov - 0.2 - s, { lu: -20 });
  ctx.sfx('drawer-close-01', T.no + 1 / 30 - s, { lu: -9 });
  ctx.ambience('roomtone-library-01', { from: T.no + 0.5 - s, to: ctx.duration, lu: -24, fade: 1.2 });
  w.flakes.forEach((f, i) => ctx.sfx(i % 2 ? 'sand-sprinkle-01' : 'dirt-debris-01', f + 0.05 - s, { lu: -18 - i }));
  return { update(t) { w.update(ctx.start + t); } };
}
