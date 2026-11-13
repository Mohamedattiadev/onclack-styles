// Panel 4 — Arkhipov's lancet, the ruby NO (the only red glass), the name, 1962 → 2002, then the whole window.
// intent: KNOW Arkhipov said no; the world learned it 40 years later · FEEL relief, awe · SEE the ruby NO igniting
// sound: the sea thins out to room tone before NO; after it, the hall where the window stands now (murmur, very low).
import { mountWorld } from '../shared/world.js';
export default async function (root, ctx) {
  const at = g => g - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: at(21.5), lu: -23, fade: 0.6 });
  ctx.sfx('breath-close-01', at(20.6), { lu: -21, duration: 1.2, fadeIn: 0.3, fadeOut: 0.4 });
  ctx.sfx('footsteps-metal-deck-01', at(21.97), { lu: -12 });
  ctx.ambience('crowd-museum-murmur-01', { from: at(23.0), to: ctx.duration, lu: -24, fade: 1.4 });
  return mountWorld(root, ctx);
}
