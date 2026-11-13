// Scene 4 — PEAK + RESOLUTION. Same board as scene 3 (continuous). intent: KNOW Arkhipov said no; known ~40 years later
// FEEL relief after the held breath · SEE: a red NO bar slapped against the diagonal, the warhead cut off the torpedo.
// shots: 4A push in on officer 3 ("The third") → 4B snap back wide on NO (the strongest contrast) → 4C slow pull out, final poster.
import { boardVote } from '../shared/boards.js';
export default async function (root, ctx) {
  const b = await boardVote(root, ctx, { phase: 4 });
  return { update: t => b.update(t) };
}
