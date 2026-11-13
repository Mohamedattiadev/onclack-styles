// 1 · establish. intent: KNOW date + a Soviet sub deep near Cuba · FEEL hush · SEE the sub pounced as dots, then painted
// into the wet sea section. truth: RC/VO (our wall painting, not a record). Sound: sea bed (from inside the story), pounce dust.
import { buildFresco } from '../shared/fresco.js';
export default async function (root, ctx) {
  const w = await buildFresco(root, ctx, 's1');
  const T = w.T;
  ctx.ambience('sea-water-close-01', { from: 0, to: T.third - 0.3, lu: -22, fade: 1.2 });
  ctx.sfx('sand-sprinkle-01', 1.7, { lu: -24 });
  ctx.sfx('cloth-jacket-01', T.hides - 0.1 - ctx.start, { lu: -26 });
  return { update(t) { w.update(ctx.start + t); } };
}
