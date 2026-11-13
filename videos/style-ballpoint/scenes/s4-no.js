// SCENE 4 — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW Arkhipov said no; known only decades later · FEEL release, weight · SEE the only red ink, pressed into the paper; pull back to the whole page.
import { buildPage, wordAt } from '../shared/page.js';
export default function (root, ctx) {
  const P = buildPage(root, ctx);
  const at = (tg) => tg - ctx.start;
  // near-silence before the NO (room tone only), then a far hall of voices as "the world" learns the name
  ctx.sfx('crowd-hall-01', at(wordAt(ctx, 'world', 0, 23.07) - 0.2), { lu: -25, duration: 3.2, fadeIn: 0.8, fadeOut: 1.0 });
  return { update: (t) => P.update(ctx.start + t) };
}
