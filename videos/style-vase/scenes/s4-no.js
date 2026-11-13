// Scene 4 — silent turn to the third officer; name painted; he turns his back on the torpedo; NO in purple-red; pull back to the whole pot, 2002 (intent: KNOW Arkhipov said no + was known only decades later, FEEL relief/awe, SEE the turned figure and the red NO).
import { buildVase } from '../shared/vase.js';
import { buildLabels } from '../shared/label.js';

export default async function (root, ctx) {
  const V = await buildVase(root, ctx);
  const lab = buildLabels(root, ctx);
  const G = t => t - ctx.start; // global → scene-local seconds
  ctx.sfx('breath-scared-01', G(19.55), { lu: -24 }); // one held breath in the silence before the reveal
  ctx.sfx('footsteps-metal-deck-01', G(21.84), { lu: -13 }); // his boot on the deck as he turns away
  ctx.ambience('crowd-museum-murmur-01', { from: G(23.0), to: ctx.duration, lu: -23, fade: 1.4 }); // the world: people in a gallery
  return { update(t) { const T = ctx.start + t; V.render(T); lab.update(T); } };
}
