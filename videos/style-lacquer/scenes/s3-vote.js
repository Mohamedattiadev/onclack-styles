// Station 3 — the torpedo in gold, three officers in raised black lacquer; two fill with gold on "Two say yes".
// intent: KNOW three must agree, two say yes · FEEL dread · SEE two gold figures, one black
import { mountWorld } from '../shared/lacquer.js';
export default async function (root, ctx) {
  const at = g => g - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -23, fade: 0.8 });
  ctx.sfx('sand-sprinkle-01', at(14.4), { lu: -20, duration: 1.3, fadeOut: 0.3 });
  ctx.sfx('footsteps-metal-deck-01', at(16.48), { lu: -20 });
  ctx.sfx('cloth-jacket-01', at(16.85), { lu: -22, duration: 1.0, fadeOut: 0.3 });
  ctx.sfx('sand-sprinkle-01', at(18.25), { lu: -19, duration: 0.6, fadeOut: 0.15 });
  ctx.sfx('sand-sprinkle-01', at(18.72), { lu: -19, duration: 0.6, fadeOut: 0.15 });
  ctx.sfx('breath-close-01', at(19.05), { lu: -22, duration: 1.0, fadeIn: 0.25, fadeOut: 0.35 });
  return mountWorld(root, ctx);
}
