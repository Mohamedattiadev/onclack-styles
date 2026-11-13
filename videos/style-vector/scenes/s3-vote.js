// 3 · The torpedo and the three officers. Bed thins out; one jacket rustle as the second officer says yes.
import { buildWorld } from '../shared/world.js';
export default async function (root, ctx) {
  const world = await buildWorld(root, ctx);
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration - 0.3, lu: -24 });
  const yes2 = ctx.words.find(w => w.word === 'yes.')?.start ?? ctx.start + 5.5;
  ctx.sfx('cloth-jacket-01', yes2 - ctx.start + 0.05, { lu: -22 });
  return { update(t) { world.update(ctx.start + t); } };
}
