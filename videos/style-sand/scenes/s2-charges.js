// Scene s2-charges — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW ships above, charges around the sub · FEEL pressure, then isolation · SEE rings drawn round each burst, then sand rains down and buries the marks (silence).
// truth: VO/RC — an evocation drawn in sand, not a record. All picture code lives in shared/table.js (one world, global time).
import { buildTable } from '../shared/table.js';

export default function (root, ctx) {
  const table = buildTable(root, ctx);
  const at = (g) => g - ctx.start;           // global → scene-local seconds (sound cues)
  [10.05, 10.35, 10.65].forEach((g, i) => ctx.sfx('boom-distant-01', at(g), { lu: [-12, -15, -13][i], duration: 2.6, fadeOut: 0.8 }));
  ctx.sfx('sand-sprinkle-01', at(10.95), { lu: -18, duration: 2.0, fadeIn: 0.3, fadeOut: 0.5 });  // the silence sprinkle
  const last = false;
  return {
    update(t) {
      // the next scene's (opaque) table covers this one during the 0.5 s overlap — don't paint twice
      if (!last && t > ctx.duration - 0.5) return;
      table.render(ctx.start + t);
    },
  };
}
