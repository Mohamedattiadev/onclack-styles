// Scene s3-vote — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW 3 officers must agree, 2 say yes · FEEL dread · SEE torpedo, then three officers from behind, two fingertip dots above two heads.
// truth: VO/RC — an evocation drawn in sand, not a record. All picture code lives in shared/table.js (one world, global time).
import { buildTable } from '../shared/table.js';

export default function (root, ctx) {
  const table = buildTable(root, ctx);
  const at = (g) => g - ctx.start;           // global → scene-local seconds (sound cues)
  ctx.sfx('sand-sprinkle-01', at(13.5), { lu: -14, duration: 0.85, fadeOut: 0.2 });   // sweep 2
  ctx.sfx('sand-sprinkle-01', at(15.86), { lu: -15, duration: 0.7, fadeOut: 0.2 });  // sweep 3
  ctx.sfx('breath-close-01', at(18.95), { lu: -22, duration: 1.7, fadeIn: 0.1, fadeOut: 0.4 }); // held breath before the third
  const last = false;
  return {
    update(t) {
      // the next scene's (opaque) table covers this one during the 0.5 s overlap — don't paint twice
      if (!last && t > ctx.duration - 0.5) return;
      table.render(ctx.start + t);
    },
  };
}
