// SCENE 2 — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW US ships drop (practice) charges; no word from Moscow · FEEL dread · SEE three grey bursts bloom in the water.
// shots: page turn → 2A left page ships → 2B charges fall + bloom → 2C/2D right page photo + stub.
import { buildBook, loadGeo, turnStart, TURN_DUR } from '../shared/book.js';

export default async function (root, ctx) {
  await loadGeo(ctx);
  const B = buildBook(root, ctx, 1), T = B.T, at = (tg) => tg - ctx.start;
  ctx.sfx('page-turn-01', at(turnStart(T, 1) + TURN_DUR - 0.86), { lu: -17, duration: 1.15, fadeOut: 0.15 });
  const F = 1 / 30;
  [[T.depth - 2 * F, -11], [T.charges - 2 * F, -13], [T.charges + 0.36, -15]].forEach(([tg, lu], i) =>
    ctx.sfx(i === 1 ? 'boom-slapback-01' : 'boom-distant-01', at(tg + 0.03), { lu, duration: 2.4, fadeOut: 0.8 }));
  return { update: (t) => B.update(t) };
}
