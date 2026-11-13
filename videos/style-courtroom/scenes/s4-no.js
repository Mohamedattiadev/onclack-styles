// SHEET 3b — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW Arkhipov said no; known ~2002 · FEEL relief/awe · SEE one hard black line through the torpedo.
// Same sheet as s3 (shared/vote.js, global times). Peak = strongest contrast: blue + white chalk on him, the black line.
import { buildVote } from '../shared/vote.js';

export default function (root, ctx) {
  const V = buildVote(root, ctx), at = (tg) => tg - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: at(21.35), lu: -29, fade: 0.5 });
  // near-silence (room tone only) for ~0.6 s before "no" — then the line
  ctx.sfx('cloth-jacket-01', at(20.3), { lu: -26 });                                            // the third man turns his shoulder
  ctx.sfx('cloth-shake-01', at(21.97) + 1 / 30, { lu: -15 });                                  // the arm sweeps the hard line
  ctx.sfx('sand-sprinkle-01', at(21.99), { lu: -16, duration: 0.35, fadeIn: 0.005, fadeOut: 0.12 }); // charcoal bites the paper
  ctx.ambience('sea-water-close-01', { from: at(22.6), to: ctx.duration, lu: -25, fade: 1.2 });  // the sea comes back, calmer
  return { update(t) { V.update(ctx.start + t); } };
}
