// Scene 4 — THE TURN + PAYOFF. Push to the third frame: his name, a red NO. The loupe moves to the B-59 sheet and the
// camera drops through it (signature move); the negative develops into a positive print: 1962 → 2002.
// intent: KNOW Arkhipov said no; the world learned it 40 years later · FEEL relief, quiet awe · SEE the boat coming up out of the negative.
// truth: B-59 photo = EV (U.S. Navy, NARA 428-N-711200, 28–29 Oct 1962, captioned); develop = VO (a metaphor, the photo is unchanged).
// shots: 4A push-in to frame 3 · 4B silence, NO · 4C loupe glide + DROP · 4D develop, hold.
import { film } from '../shared/world.js';

export default async function (root, ctx) {
  const f = await film(root, ctx);
  const T = f.plan.T, s = x => x - ctx.start;
  ctx.sfx('door-close-01', s(T.no) + 0.04, { lu: -15 });                 // one hard sound under the NO (a hatch shut — the decision)
  ctx.ambience('sea-wash-calm-01', { from: s(T.world) - 0.3, to: ctx.duration, lu: -17, fade: 1.2 }); // the boat on the surface: open, calm
  return { update: t => f.update(t) };
}
