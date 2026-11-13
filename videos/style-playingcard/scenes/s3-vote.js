// SCENE 3 — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW the weapon + the 3-of-3 rule + two yes · FEEL the count closing in · SEE the torpedo card, three court cards, two pushed forward to the torpedo, tally 2 / 3.
import { buildTable } from '../shared/table.js';
import { cardSounds } from '../shared/sound.js';
export default function (root, ctx) {
  const T = buildTable(root, ctx), t = T.t;
  const at = (tg) => tg - ctx.start;
  ctx.ambience('sea-water-close-01', { from: at(14.0), to: at(26.5), lu: -25, fade: 1.2 });
  cardSounds(ctx, ['deal', t.torp - 2 / 30], ['deal', t.three - 0.05], ['deal', t.three + 0.22], ['deal', t.three + 0.49],
    ['slide', t.two - 0.12], ['slide', t.yes - 0.28]);
  ctx.sfx('cloth-jacket-01', at(t.agree - 0.6), { lu: -27, duration: 1.2, fadeIn: 0.2, fadeOut: 0.4 });
  return { update: (tt) => T.update(ctx.start + tt) };
}
