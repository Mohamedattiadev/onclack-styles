// Scene 3 of the one-wall film (see shared/mural.js). Truth codes: date/text = VO (our stencil letters);
// sub, ships, torpedo, officers = RC (generic hand-cut silhouettes, no faces, no markings).
import { buildMural } from '../shared/mural.js';

export default function (root, ctx) {
  const m = buildMural(root, ctx, 2);
  return { update(t) { m.update(ctx.start + t); } };
}
