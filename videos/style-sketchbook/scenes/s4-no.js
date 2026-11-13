// SCENE 4 — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW Arkhipov said no; his name known ~2002 · FEEL relief/awe · SEE the one viridian wash blooms in him, red pen NO.
// shots: 4A push in on the third officer (inked firmly, viridian bloom, name) → 4B red NO → 4C pull out, 2002 note.
// peak = strongest contrast: the only colour wash + the only red, after ~0.7 s of near-silence.
import { buildBook, loadGeo } from '../shared/book.js';

export default async function (root, ctx) {
  await loadGeo(ctx);
  const B = buildBook(root, ctx, 3), T = B.T, at = (tg) => tg - ctx.start;
  const F = 1 / 30;
  ctx.sfx('drips-wood-01', at(T.vasili - 2 * F), { lu: -26, duration: 0.3, fadeOut: 0.08 });     // the viridian touches the page
  ctx.sfx('sand-sprinkle-01', at(T.no - 2 * F), { lu: -21, duration: 0.32, fadeIn: 0.005, fadeOut: 0.1 }); // the red nib bites
  ctx.ambience('sea-wash-calm-01', { from: at(T.no + 0.6), to: ctx.duration, lu: -27, fade: 1.4 }); // the sea again, calmer
  return { update: (t) => B.update(t) };
}
