// SCENE 1 — "October twenty-seventh, nineteen sixty-two. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW date + a Soviet boat deep near Cuba · FEEL a game starting, quiet · SEE the date card, then B-59 slid lower, Cuba beside it.
import { buildTable } from '../shared/table.js';
import { cardSounds } from '../shared/sound.js';
export default function (root, ctx) {
  const T = buildTable(root, ctx);
  const at = (tg) => tg - ctx.start;
  // the room is quiet; far under it, sea against a hull (we are inside the boat's wardroom)
  ctx.ambience('sea-water-close-01', { from: at(1.5), to: at(13.9), lu: -23, fade: 1.5 });
  cardSounds(ctx, ['deal', T.t.oct + 0.25 - 2 / 30], ['deal', T.t.sub - 2 / 30], ['slide', T.t.deep - 0.05], ['deal', T.t.cuba - 2 / 30]);
  return { update: (t) => T.update(ctx.start + t) };
}
