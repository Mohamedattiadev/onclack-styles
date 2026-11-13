// Scene s4-no — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW Arkhipov said no; known ~40 years later · FEEL relief, awe · SEE the table swept clean to light, one patch of sand left with the third man; his name trickled in dark sand.
// truth: VO/RC — an evocation drawn in sand, not a record. All picture code lives in shared/table.js (one world, global time).
import { buildTable } from '../shared/table.js';

export default function (root, ctx) {
  const table = buildTable(root, ctx);
  const at = (g) => g - ctx.start;           // global → scene-local seconds (sound cues)
  ctx.sfx('sand-sprinkle-01', at(21.66), { lu: -11, duration: 1.0, fadeOut: 0.3 });  // the NO sweep (hardest sand sound)
  ctx.sfx('sand-sprinkle-01', at(23.05), { lu: -23, duration: 0.95, fadeOut: 0.2 }); // name trickled
  ctx.sfx('sand-sprinkle-01', at(24.12), { lu: -24, duration: 0.8, fadeOut: 0.2 });  // 2002
  const last = true;
  return {
    update(t) {
      // the next scene's (opaque) table covers this one during the 0.5 s overlap — don't paint twice
      if (!last && t > ctx.duration - 0.5) return;
      table.render(ctx.start + t);
    },
  };
}
