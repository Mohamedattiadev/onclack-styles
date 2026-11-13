// Scene 3 of the one-wall film (shared/wall.js): torpedo finger-painted along a ridge; three officers on a ledge (no faces, three different postures); two yellow YES dots.
// Truth codes: all images = VO/RC (our own pigment drawing on our own procedural rock; generic shapes, no faces, no markings).
import { buildWall } from '../shared/wall.js';

export default function (root, ctx) {
  const w = buildWall(root, ctx, 2);
  return { update(t) { w.update(ctx.start + t); } };
}
