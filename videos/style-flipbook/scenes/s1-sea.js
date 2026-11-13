// SCENE 1 — "October twenty-seventh, 1962. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW date + Soviet boat near Cuba · FEEL curiosity · SEE the boat drawn (blue construction → graphite) and diving
// into darker hatching. Shots: 1A page EST (date lettered) → 1B push to the boat → 1C inset map (Cuba, approx. area).
import { buildWorld, loadGeo } from '../shared/world.js';

export default async function (root, ctx) {
  await loadGeo(ctx);
  const Wd = buildWorld(root, ctx), T = Wd.T, at = tg => tg - ctx.start;
  ctx.sfx('page-turn-01', at(0.05), { lu: -20, duration: 0.55, fadeOut: 0.15 });                 // thumb catches the corner
  ctx.ambience('sea-water-close-01', { from: at(T.soviet - 0.6), to: ctx.duration, lu: -27, fade: 1.2 }); // the drawn sea, muffled
  return { update: t => Wd.update(t) };
}
