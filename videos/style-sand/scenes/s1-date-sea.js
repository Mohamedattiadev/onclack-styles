// Scene s1-date-sea — "October 27th, 1962. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW the date + place · FEEL quiet unease · SEE a finger writes OCT 27 / 1962, a palm sweeps it into the sea, the sub is pushed together deep below, Cuba rises at the surface.
// truth: VO/RC — an evocation drawn in sand, not a record. All picture code lives in shared/table.js (one world, global time).
import { buildTable } from '../shared/table.js';

export default function (root, ctx) {
  const table = buildTable(root, ctx);
  const at = (g) => g - ctx.start;           // global → scene-local seconds (sound cues)
  ctx.ambience('sea-water-close-01', { from: 0, to: 22.25, lu: -17, fade: 0.6 });   // sea under the table, ends at the NO (the drop)
  ctx.sfx('sand-sprinkle-01', at(0.5), { lu: -24, duration: 1.25, fadeOut: 0.15 });  // finger writing
  ctx.sfx('sand-sprinkle-01', at(2.02), { lu: -24, duration: 1.2, fadeOut: 0.15 });
  ctx.sfx('sand-sprinkle-01', at(3.3), { lu: -14, duration: 0.85, fadeOut: 0.2 });   // sweep 1
  ctx.sfx('sand-sprinkle-01', at(4.2), { lu: -21, duration: 0.65, fadeOut: 0.15 });  // sub pushed together
  ctx.sfx('door-creak-01', at(5.0), { lu: -25, duration: 1.6, fadeOut: 0.4 });       // hull strain, deep
  ctx.sfx('sand-sprinkle-01', at(6.3), { lu: -23, duration: 0.7, fadeOut: 0.15 });   // CUBA trickled
  const last = false;
  return {
    update(t) {
      // the next scene's (opaque) table covers this one during the 0.5 s overlap — don't paint twice
      if (!last && t > ctx.duration - 0.5) return;
      table.render(ctx.start + t);
    },
  };
}
