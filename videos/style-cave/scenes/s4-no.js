// Scene 4 of the one-wall film (shared/wall.js): NO in red ochre (two fingers); white clay over the warhead; name + 2002; pull back to the whole wall.
// Truth codes: all images = VO/RC (our own pigment drawing on our own procedural rock; generic shapes, no faces, no markings).
import { buildWall } from '../shared/wall.js';

export default function (root, ctx) {
  const w = buildWall(root, ctx, 3);
  return { update(t) { w.update(ctx.start + t); } };
}
