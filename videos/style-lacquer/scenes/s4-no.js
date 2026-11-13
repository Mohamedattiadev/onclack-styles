// Station 4 — his name in gold; charcoal polishes a vermilion NO out of the black; 1962 → 2002.
// intent: KNOW Arkhipov said no, known 40 years later · FEEL relief · SEE the red NO surfacing under the rubs (peak contrast)
import { mountWorld } from '../shared/lacquer.js';
export default async function (root, ctx) {
  const at = g => g - ctx.start;
  // the hull bed thins out before the NO (near-silence), the open sea comes back after it
  ctx.ambience('sea-water-close-01', { from: 0, to: at(21.25), lu: -24, fade: 0.6 });
  ctx.sfx('sand-sprinkle-01', at(20.55), { lu: -20, duration: 1.2, fadeOut: 0.3 });
  ctx.sfx('cloth-jacket-01', at(21.36), { lu: -16, duration: 0.25, fadeOut: 0.06 });
  ctx.sfx('cloth-jacket-01', at(21.58), { lu: -15, duration: 0.25, fadeOut: 0.06 });
  ctx.sfx('cloth-jacket-01', at(21.79), { lu: -14, duration: 0.3, fadeOut: 0.08 });
  ctx.ambience('sea-wash-calm-01', { from: at(22.4), to: ctx.duration, lu: -19, fade: 1.0 });
  ctx.sfx('sand-sprinkle-01', at(24.05), { lu: -21, duration: 1.0, fadeOut: 0.3 });
  return mountWorld(root, ctx);
}
