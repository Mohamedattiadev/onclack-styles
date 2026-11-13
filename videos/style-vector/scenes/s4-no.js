// 4 · The NO. Near-silence (room tone only) + one held breath in the pause before "The third".
import { buildWorld } from '../shared/world.js';
export default async function (root, ctx) {
  const world = await buildWorld(root, ctx);
  ctx.sfx('breath-close-01', 0.05, { lu: -21 });
  return { update(t) { world.update(ctx.start + t); } };
}
