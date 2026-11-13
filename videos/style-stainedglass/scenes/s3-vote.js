// Panel 3 — the torpedo pane, three lancets, two amber YES panes; the third stays dark.
// intent: KNOW three officers must agree, two say yes · FEEL dread · SEE two lancets warm, one cold
import { mountWorld } from '../shared/world.js';
export default async function (root, ctx) {
  const at = g => g - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -21, fade: 0.8 });
  ctx.sfx('cloth-jacket-01', at(16.8), { lu: -20, duration: 1.1, fadeOut: 0.3 });
  ctx.sfx('footsteps-metal-deck-01', at(18.27), { lu: -17 });
  ctx.sfx('footsteps-metal-deck-01', at(18.78), { lu: -19 });
  ctx.sfx('breath-close-01', at(19.0), { lu: -22, duration: 1.0, fadeIn: 0.25, fadeOut: 0.35 });
  return mountWorld(root, ctx);
}
