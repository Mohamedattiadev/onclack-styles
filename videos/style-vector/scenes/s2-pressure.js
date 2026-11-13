// 2 · Ships above, practice depth charges, Moscow silent. Each burst = a distant underwater thud on the impact frame.
import { buildWorld } from '../shared/world.js';
export default async function (root, ctx) {
  const world = await buildWorld(root, ctx);
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -20 });
  world.bursts.forEach((tb, i) => ctx.sfx(i === 1 ? 'boom-slapback-01' : 'boom-distant-01', tb - ctx.start + 1 / 30, { lu: i === 2 ? -9 : -12 }));
  ctx.sfx('drips-wood-01', 4.6, { lu: -24 }); // condensation dripping in a hot, silent boat (Moscow silent)
  return { update(t) { world.update(ctx.start + t); } };
}
