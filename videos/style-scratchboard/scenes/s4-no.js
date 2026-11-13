// Board 4 — the third officer, the gouge, the name.
// intent: KNOW Arkhipov said no; the world learned it ~40 years later · FEEL release, then quiet awe · SEE the red gouge through the tally
// truth: VO (tally + gouge) · name = fact · "2002" hedged ("approx.")
import { makeBoard, fontsReady, F } from '../shared/board.js';
import { buildTally, tallyTimes, tallyCam } from '../shared/tally.js';

export default async function (root, ctx) {
  await fontsReady();
  const L = ctx.layout;
  const B = makeBoard(root, ctx, 'Board 4');
  const G = tallyTimes(ctx), lt = g => g - ctx.start;
  const tally = buildTally(B, root, ctx);

  // sound: breath held until just before "no" → near-silence (room tone) → the gouge → the sea comes back, far away
  ctx.ambience('breath-close-01', { from: 0, to: lt(G.no) - 0.7, lu: -24 });
  ctx.ambience('drips-wood-01', { from: 0.4, to: lt(G.no) - 0.6, lu: -21 });
  ctx.sfx('ice-debris-01', lt(G.no) - 2 * F + 1 / 30, { lu: -8 });
  ctx.sfx('staff-hit-01', lt(G.no) - 2 * F + 2 / 30, { lu: -14 });
  ctx.ambience('sea-water-close-01', { from: lt(G.no) + 0.9, to: ctx.duration, lu: -19 });

  return {
    update(t) {
      B.render(t, tallyCam(L, G, t + ctx.start));
      tally.update(t);
    },
  };
}
