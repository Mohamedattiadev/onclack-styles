// Scene 2 — PRESSURE. A 35 mm strip: three real U.S. Navy negatives (the hunters), then three empty frames.
// intent: KNOW US ships forced the boat; Moscow silent · FEEL pressure from above, then a void · SEE the loupe on the B-36 frame, then a flat red line through blank film.
// truth: Randolph 1962 / Beale (photo 1964, captioned) / B-36 + Cecil Oct 1962 = EV (U.S. Navy, PD). Empty frames + grease = VO.
// shots: 2A MS strip, loupe moves frame to frame · 2B the table jolts on each charge · CUT on the pause → 2C empty frames.
import { film } from '../shared/world.js';

export default async function (root, ctx) {
  const f = await film(root, ctx);
  const T = f.plan.T, s = x => x - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: s(T.moscow) - 0.1, lu: -15, fade: 0.6 });
  ctx.sfx('boom-distant-01', s(T.drop) + 0.03, { lu: -7 });
  ctx.sfx('boom-slapback-01', s(T.charges) + 0.03, { lu: -11, duration: 3.2, fadeOut: 1.4 });
  // "silent": the sea bed is gone, only the archive room tone remains
  return { update: t => f.update(t) };
}
