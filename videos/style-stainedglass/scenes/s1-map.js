// Panel 1 — the date panes ignite word by word, then the glass sea, the amber sub, and Cuba last.
// intent: KNOW 27 Oct 1962, Soviet sub near Cuba · FEEL curiosity, cool dawn · SEE date panes lighting one by one
// sound: muffled sea under a hull (POV: the sub), J-cut from 0.
import { mountWorld } from '../shared/world.js';
export default async function (root, ctx) {
  const at = g => g - ctx.start; // global → scene-local
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -19, fade: 1.2 });
  ctx.sfx('footsteps-metal-deck-01', at(4.32), { lu: -22 });
  return mountWorld(root, ctx);
}
