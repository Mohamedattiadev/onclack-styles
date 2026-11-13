// Scene 4 — the seal НЕТ on "no", then the whole sheet. Same sheet as scene 3 (shared/vote.js), continuous camera.
import { buildVote } from '../shared/vote.js';
export default function (root, ctx) {
  const update = buildVote(root, ctx, 4);
  return { update(t) { update(ctx.start + t); } };
}
