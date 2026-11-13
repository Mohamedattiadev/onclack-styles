// SCENE 2 — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW US ships drop (practice) charges, no orders from Moscow · FEEL dread, cut off · SEE three bursts scribbled at the boat, a radio line that stops.
import { buildPage, wordAt } from '../shared/page.js';
export default function (root, ctx) {
  const P = buildPage(root, ctx);
  const at = (tg) => tg - ctx.start;
  const tDepth = wordAt(ctx, 'depth', 0, 9.79), tCharges = wordAt(ctx, 'charges', 0, 10.05);
  [[tDepth - 0.05, 'boom-distant-01', -11], [tCharges + 0.12, 'boom-slapback-01', -12], [tCharges + 0.55, 'boom-distant-01', -15]]
    .forEach(([tg, id, lu]) => ctx.sfx(id, at(tg + 1 / 30), { lu, duration: 2.2, fadeOut: 0.8 }));
  return { update: (t) => P.update(ctx.start + t) };
}
