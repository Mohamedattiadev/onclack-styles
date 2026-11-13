// SCENE 3 — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW a nuclear torpedo; 3 must agree; 2 say yes · FEEL tension · SEE three faceless officers, two ticked boxes, one empty.
// shots: page turn → 3A torpedo drawn + washed → 3B arrow across the gutter → 3C/3D officers, ticks.
import { buildBook, loadGeo, turnStart, TURN_DUR } from '../shared/book.js';

export default async function (root, ctx) {
  await loadGeo(ctx);
  const B = buildBook(root, ctx, 2), T = B.T, at = (tg) => tg - ctx.start;
  ctx.sfx('page-turn-01', at(turnStart(T, 2) + TURN_DUR - 0.86), { lu: -17, duration: 1.15, fadeOut: 0.15 });
  ctx.sfx('footsteps-metal-deck-01', at(T.onboard + 0.05), { lu: -26 });                       // inside the boat now
  ctx.sfx('drips-wood-01', at(T.torpedo + 0.05), { lu: -28, duration: 0.3, fadeOut: 0.08 });     // brush on the torpedo
  ctx.sfx('breath-close-01', at(T.agree + 0.15), { lu: -25, duration: 2.0, fadeIn: 0.3, fadeOut: 0.6 }); // a held breath before the vote
  return { update: (t) => B.update(t) };
}
