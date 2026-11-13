// Station 1 — the date laid in gold, the coasts sprinkled, Cuba last; a strip of shell set in for the submarine.
// intent: KNOW 27 Oct 1962, Soviet sub near Cuba · FEEL quiet curiosity · SEE Cuba catching the gold on its word
import { mountWorld } from '../shared/lacquer.js';
export default async function (root, ctx) {
  const at = g => g - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -24, fade: 1.2 });
  ctx.sfx('sand-sprinkle-01', at(0.52), { lu: -20, duration: 0.7, fadeOut: 0.2 });
  ctx.sfx('sand-sprinkle-01', at(1.03), { lu: -18, duration: 0.9, fadeOut: 0.25 });
  ctx.sfx('sand-sprinkle-01', at(2.0), { lu: -20, duration: 0.95, fadeOut: 0.25 });
  ctx.sfx('wood-clash-01', at(4.22), { lu: -26 });           // the shell strip tapped into place
  ctx.sfx('sand-sprinkle-01', at(5.3), { lu: -21, duration: 1.6, fadeIn: 0.1, fadeOut: 0.4 });
  return mountWorld(root, ctx);
}
