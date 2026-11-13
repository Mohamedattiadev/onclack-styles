// Scene 3 — torpedo + three upright strokes. Shares one sheet with scene 4 (see shared/vote.js for intent + truth).
import { buildVote } from '../shared/vote.js';
export default function (root, ctx) {
  const update = buildVote(root, ctx, 3);
  return { update(t) { update(ctx.start + t); } };
}
