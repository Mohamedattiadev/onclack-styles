// SCENE 2 — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW US ships above, charges, no word from Moscow · FEEL hit, shaken, alone · SEE three ship cards dealt fast, two charge cards slapped down (the table jumps), a Moscow card with its signal printed grey.
import { buildTable } from '../shared/table.js';
import { cardSounds } from '../shared/sound.js';
export default function (root, ctx) {
  const T = buildTable(root, ctx), t = T.t;
  const at = (tg) => tg - ctx.start;
  cardSounds(ctx, ['deal', t.ships - 0.62], ['deal', t.ships - 0.32], ['deal', t.ships - 0.02], ['deal', t.moscow - 2 / 30]);
  // charges: a hard card slap on the table + the boom heard through the hull
  cardSounds(ctx, ['slap', t.depth], ['slap', t.charges]);
  ctx.sfx('boom-distant-01', at(t.depth + 0.03), { lu: -12, duration: 2.6, fadeOut: 1.2 });
  ctx.sfx('boom-slapback-01', at(t.charges + 0.05), { lu: -15, duration: 3.0, fadeOut: 1.4 });
  return { update: (tt) => T.update(ctx.start + tt) };
}
