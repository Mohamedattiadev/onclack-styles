// Scene 1 — ECU on the date being painted, pull back to reveal the whole pot; the sub hides (intent: KNOW date + place, FEEL curiosity, SEE a pot).
import { buildVase } from '../shared/vase.js';
import { buildLabels } from '../shared/label.js';

export default async function (root, ctx) {
  const V = await buildVase(root, ctx);
  const lab = buildLabels(root, ctx);
  const G = t => t - ctx.start; // global → scene-local seconds
  ctx.ambience('sea-water-close-01', { from: 0, to: G(19.3), lu: -15, fade: 1.2 }); // hull water: we are with the sub
  ctx.sfx('door-creak-01', G(5.3), { lu: -22 }); // hull creak as it sinks ("hides deep")
  return { update(t) { const T = ctx.start + t; V.render(T); lab.update(T); } };
}
