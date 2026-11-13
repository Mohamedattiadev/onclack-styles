// SCENE 3 — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW the weapon + the 3-of-3 rule + two yes · FEEL the count closing in · SEE two blue ticks, one empty pair of boxes.
import { buildPage, wordAt } from '../shared/page.js';
export default function (root, ctx) {
  const P = buildPage(root, ctx);
  const at = (tg) => tg - ctx.start;
  ctx.sfx('cloth-jacket-01', at(wordAt(ctx, 'officers', 0, 16.86)), { lu: -24, duration: 1.2, fadeOut: 0.4 });
  ctx.sfx('breath-close-01', at(wordAt(ctx, 'yes', 0, 18.8) + 0.7), { lu: -22, duration: 1.4, fadeOut: 0.5 });
  return { update: (t) => P.update(ctx.start + t) };
}
