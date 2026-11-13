// SHEET 3a — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW one nuclear torpedo, three must agree, two said yes · FEEL dread · SEE two ochre backs, one bare.
// The sheet itself (and its truth codes) lives in shared/vote.js; this scene adds the sound for its part.
import { buildVote } from '../shared/vote.js';

export default function (root, ctx) {
  const V = buildVote(root, ctx), at = (tg) => tg - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -29, fade: 0.6 });
  ctx.sfx('footsteps-metal-deck-01', at(13.55), { lu: -25 });                                  // inside the boat now
  ctx.sfx('sand-sprinkle-01', at(13.97), { lu: -25, duration: 0.9, fadeIn: 0.03, fadeOut: 0.3 });  // charcoal on the torpedo
  ctx.sfx('sand-sprinkle-01', at(16.32), { lu: -26, duration: 1.4, fadeIn: 0.03, fadeOut: 0.35 }); // three quick figures
  ctx.sfx('breath-close-01', at(17.9), { lu: -26, duration: 2.4, fadeIn: 0.4, fadeOut: 0.6 });   // a held breath in the cramped room
  return { update(t) { V.update(ctx.start + t); } };
}
