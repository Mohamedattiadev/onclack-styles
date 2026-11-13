// SCENE 4 — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW Arkhipov said no; known only decades later · FEEL held breath, then release · SEE his card lift, turn face DOWN (the only back on the table), the torpedo card taken away, his name on a card-stock strip.
import { buildTable } from '../shared/table.js';
import { cardSounds } from '../shared/sound.js';
export default function (root, ctx) {
  const T = buildTable(root, ctx), t = T.t;
  const at = (tg) => tg - ctx.start;
  ctx.sfx('breath-close-01', at(t.third - 0.3), { lu: -24, duration: 1.4, fadeIn: 0.3, fadeOut: 0.5 });
  cardSounds(ctx, ['slide', t.third - 0.05], ['flip', t.says + 0.3], ['slide', t.no + 0.55], ['slide', t.no + 0.8]);
  ctx.sfx('crowd-hall-01', at(t.world - 0.2), { lu: -27, duration: 3.4, fadeIn: 0.9, fadeOut: 1.1 });
  return { update: (tt) => T.update(ctx.start + tt) };
}
