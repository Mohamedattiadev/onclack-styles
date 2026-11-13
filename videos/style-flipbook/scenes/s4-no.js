// SCENE 4 — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW his name + that he refused · FEEL relief/awe · SEE the red-pencil NO — and the flipbook STOPS (hold):
// no more boil, no flutter, no ghost of a next drawing. Only a hand adds notes in real time: HOLD, 1962 → 2002.
import { buildWorld, loadGeo } from '../shared/world.js';

export default async function (root, ctx) {
  await loadGeo(ctx);
  const Wd = buildWorld(root, ctx), T = Wd.T, at = tg => tg - ctx.start;
  // beds run up to the NO and stop dead there (the one big drop): only room tone after
  ctx.ambience('sea-water-close-01', { from: 0, to: at(T.no + 0.02), lu: -29, fade: 0.05 });
  ctx.ambience('breath-close-01', { from: 0, to: at(T.no - 0.1), lu: -24, fade: 0.08 });
  ctx.sfx('drawer-close-01', at(T.no + 2 / 30), { lu: -17, duration: 0.6, fadeOut: 0.1 });            // thumb presses the book flat
  return { update: t => Wd.update(t) };
}
