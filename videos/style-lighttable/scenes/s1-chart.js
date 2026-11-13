// Scene 1 — ESTABLISH. The archive light table is switched on; a sheet negative of a chart lies on it.
// intent: KNOW Oct 27 1962, a sub near Cuba · FEEL quiet curiosity (we open a file) · SEE Cuba glowing in clear lines on dark film.
// truth: chart = EV-derived (Natural Earth coastlines, drawn by us, labelled on the film edge); sub position = RC, "approx.".
// shots: 1A EST wide (table edge + dark room) → slow CAMERA push to the circled position; loupe slides onto it on "deep".
import { film } from '../shared/world.js';

export default async function (root, ctx) {
  const f = await film(root, ctx);
  const T = f.plan.T, s = x => x - ctx.start;
  ctx.sfx('drawer-close-01', 0.04, { lu: -16 });                           // archive drawer shut as the light comes on
  ctx.ambience('sea-water-close-01', { from: s(T.sub) - 0.5, to: ctx.duration, lu: -19, fade: 1.5 }); // the sea under the circle (J-cut into 2)
  return { update: t => f.update(t) };
}
