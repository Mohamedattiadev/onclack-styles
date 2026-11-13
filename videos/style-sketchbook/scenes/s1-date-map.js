// SCENE 1 — "October twenty-seventh, nineteen sixty-two. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW the date + a Soviet boat near Cuba · FEEL curiosity · SEE pen draws the boat, grey water closes round it.
// shots: 1A EST spread (date written) → 1B INS map scrap circle → 1C right page, sub + Payne's grey bloom.
import { buildBook, loadGeo } from '../shared/book.js';

export default async function (root, ctx) {
  await loadGeo(ctx);
  const B = buildBook(root, ctx, 0), T = B.T, at = (tg) => tg - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: at(T.no - 0.7), lu: -28, fade: 1.0 });      // the story's sea, muffled, until the NO
  ctx.sfx('drips-wood-01', at(T.deep - 0.1), { lu: -27, duration: 0.3, fadeOut: 0.08 });         // the brush touches wet paper
  return { update: (t) => B.update(t) };
}
