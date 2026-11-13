// 1 · Date + place. Inside the boat: hull water close, low (J-cut from 0).
import { buildWorld } from '../shared/world.js';
export default async function (root, ctx) {
  const world = await buildWorld(root, ctx);
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -22 });
  return { update(t) { world.update(ctx.start + t); } };
}
