// SCENE 3 — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW the three-key rule · FEEL tension · SEE three different officers (gesture first, then coats — no faces),
// two quick graphite "yes". Riffle in at the paragraph break.
import { buildWorld, loadGeo } from '../shared/world.js';

export default async function (root, ctx) {
  await loadGeo(ctx);
  const Wd = buildWorld(root, ctx), T = Wd.T, at = tg => tg - ctx.start;
  ctx.sfx('page-turn-01', at(T.r2), { lu: -15, duration: 0.5, fadeOut: 0.12 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -29, fade: 0.6 });
  ctx.ambience('breath-close-01', { from: at(T.three - 0.4), to: ctx.duration, lu: -24, fade: 0.8 }); // close, tense breathing in the hull
  return { update: t => Wd.update(t) };
}
