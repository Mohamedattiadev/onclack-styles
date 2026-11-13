// 2 · rising. intent: KNOW US ships above drop practice depth charges; Moscow silent · FEEL pressure · SEE charges painted
// one under the other down to the hull, lime-white bursts. Sound: three distant booms on the bursts, one slapback.
import { buildFresco } from '../shared/fresco.js';
export default async function (root, ctx) {
  const w = await buildFresco(root, ctx, 's2');
  const [b1, b2, b3] = w.bursts.map(b => b - ctx.start);
  ctx.sfx('boom-distant-01', b1 + 1 / 30, { lu: -8 });
  ctx.sfx('boom-distant-01', b2 + 1 / 30, { lu: -10 });
  ctx.sfx('boom-slapback-01', b3 + 1 / 30, { lu: -9 });
  ctx.sfx('drips-wood-01', w.T.silent - ctx.start, { lu: -22 });
  return { update(t) { w.update(ctx.start + t); } };
}
