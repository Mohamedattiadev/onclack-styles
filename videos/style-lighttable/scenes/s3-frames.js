// Scene 3 — THE RULE. The torpedo frame (a diagram), then three single frames cut from the same roll are laid side by side.
// intent: KNOW a nuclear torpedo needs 3 yes votes; 2 said yes · FEEL dread, counting · SEE two red ticks and one untouched frame.
// truth: torpedo = RC diagram ("not to scale" printed on the frame); officer frames are blank on purpose (no faces) = VO.
// shots: 3A CU torpedo frame, loupe on the warhead · CUT on the pause → 3B the three frames slid in by hand · 3C ticks.
import { film } from '../shared/world.js';

export default async function (root, ctx) {
  const f = await film(root, ctx);
  const T = f.plan.T, s = x => x - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0.1, to: s(T.fire) - 0.4, lu: -24, fade: 0.8 }); // inside the hull: far, low
  ctx.sfx('door-creak-01', s(T.torpedo) + 0.6, { lu: -20 });            // hull creak under the weapon
  ctx.sfx('cloth-jacket-01', s(T.three) - 0.05, { lu: -21 });            // frames slid over the glass by a sleeve
  ctx.sfx('footsteps-metal-deck-01', s(T.two) + 0.02, { lu: -22 });
  return { update: t => f.update(t) };
}
