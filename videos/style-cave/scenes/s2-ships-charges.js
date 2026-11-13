// Scene 2 of the one-wall film (shared/wall.js): two ships; depth charges as dotted falls + blown charcoal around a held drum; MOSCOW + tally of silent days.
// Truth codes: all images = VO/RC (our own pigment drawing on our own procedural rock; generic shapes, no faces, no markings).
import { buildWall } from '../shared/wall.js';

export default function (root, ctx) {
  const w = buildWall(root, ctx, 1);
  return { update(t) { w.update(ctx.start + t); } };
}
