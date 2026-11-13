// BLOCK III, part 1 — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW the launch needed three agreeing officers, two agreed · FEEL dread · SEE two bold marks, one empty frame.
import { F, seq } from '../shared/wood.js';
import { buildVote } from '../shared/vote.js';

export default function (root, ctx) {
  const V = buildVote(root, ctx, { name: '3 Block III' }), T = V.T, at = g => g - ctx.start;
  // sound (only the cues that fall inside this scene; scene 4 registers the rest)
  ctx.sfx('sand-sprinkle-01', at(T.start + 0.1), { lu: -27, duration: 2.0, fadeIn: 0.1, fadeOut: 0.4 });
  ctx.sfx('footsteps-wood-creep-01', at(T.start + 0.14), { lu: -18, duration: 0.42, fadeOut: 0.06 });
  ctx.sfx('footsteps-wood-creep-01', at(T.torpedo - 0.16), { lu: -19, duration: 0.42, fadeOut: 0.06 });
  ctx.sfx('sand-sprinkle-01', at(T.three - 0.12), { lu: -28, duration: 0.8, fadeIn: 0.05, fadeOut: 0.3 });
  ctx.sfx('wood-clash-01', at(T.two + F), { lu: -10 });
  ctx.sfx('wood-clash-01', at(T.yes + F), { lu: -11, volume: 0.92 });
  return { update(t) { const g = t + ctx.start; V.block.update(g, V.cam(g)); } };
}
