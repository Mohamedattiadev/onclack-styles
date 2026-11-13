// SCENE 2 — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW they are hunted + cut off · FEEL dread · SEE charges tumbling down, scribble bursts, the boat shaking;
// a dotted radio line to "Moscow?" struck through, a tally of days. Riffle in (fast flip) at the paragraph break.
import { buildWorld, loadGeo } from '../shared/world.js';

export default async function (root, ctx) {
  await loadGeo(ctx);
  const Wd = buildWorld(root, ctx), T = Wd.T, at = tg => tg - ctx.start;
  ctx.sfx('page-turn-01', at(T.r1), { lu: -15, duration: 0.5, fadeOut: 0.12 });                   // the riffle
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -27, fade: 0.6 });
  ctx.sfx('boom-distant-01', at(T.bursts[0] + 2 / 30), { lu: -9, duration: 2.6, fadeOut: 0.8 });
  ctx.sfx('boom-distant-01', at(T.bursts[1] + 2 / 30), { lu: -13, duration: 2.2, fadeOut: 0.8 });
  ctx.sfx('boom-slapback-01', at(T.bursts[2] + 2 / 30), { lu: -14, duration: 3.0, fadeOut: 1.2 });
  return { update: t => Wd.update(t) };
}
