// Scene 3 — CRISIS. intent: KNOW a nuclear torpedo; 3 officers must agree; two say yes · FEEL dread, the vote tipping
// SEE: a black torpedo on the diagonal with a red warhead, three different cut-paper officers, two YES strips slapped on.
// truth: torpedo diagram VO (labelled), figures RC (no faces, roles only). transition in: sheet slides over (GLIDE).
import { boardVote } from '../shared/boards.js';
export default async function (root, ctx) {
  const b = await boardVote(root, ctx, { sheetIn: true, phase: 3 });
  return { update: t => b.update(t) };
}
