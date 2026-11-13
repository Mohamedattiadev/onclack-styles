// BLOCK III, part 2 — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW Arkhipov refused; his role became known 40 years later · FEEL awe, relief · SEE a bold carved NO in the
// third frame, then the whole decision on one print, and a small teal stamp 1962 → 2002.
// Same block and global clock as scene 3 (shared/vote.js) — the scene join is invisible.
import { F } from '../shared/wood.js';
import { buildVote } from '../shared/vote.js';

export default function (root, ctx) {
  const V = buildVote(root, ctx, { name: '4 Block III' }), T = V.T, at = g => g - ctx.start;
  // a breath before the word (silence before the reveal: the sea bed is gone by now), then the hardest cut of the film
  ctx.sfx('breath-close-01', at(T.no - 2.05), { lu: -21, duration: 1.95, fadeIn: 0.3, fadeOut: 0.45 });
  ctx.sfx('sand-sprinkle-01', at(T.vas - 0.1), { lu: -28, duration: 1.1, fadeIn: 0.1, fadeOut: 0.3 });
  ctx.sfx('wood-clash-01', at(T.no - 6 * F + F), { lu: -6 });
  ctx.sfx('staff-hit-01', at(T.no - F), { lu: -14 });
  ctx.sfx('page-turn-01', at(V.block.pull.turn - 0.85), { lu: -13, duration: 1.75, fadeIn: 0.2, fadeOut: 0.3 });
  ctx.sfx('drawer-close-01', at(T.forty), { lu: -11 });
  return { update(t) { const g = t + ctx.start; V.block.update(g, V.cam(g)); } };
}
