// Scene 1 of the one-wall film (shared/wall.js): date in charcoal + red ochre; submarine blown in red ochre over a swelling of the rock (negative); sea in white clay; Cuba.
// Truth codes: all images = VO/RC (our own pigment drawing on our own procedural rock; generic shapes, no faces, no markings).
import { buildWall } from '../shared/wall.js';

export default function (root, ctx) {
  const w = buildWall(root, ctx, 0);
  return { update(t) { w.update(ctx.start + t); } };
}
