// SCENE 4 — the third man, the pink NO, forty years later. intent: KNOW Arkhipov refused; his name became known about 40 years later · FEEL relief, awe · SEE the only pink chalk of the film, circled twice.
// The whole film is one board on one global clock (shared/board.js); this scene draws the board at global time.
import { mountBoard } from '../shared/board.js';

export default async function (root, ctx) {
  const B = await mountBoard(root, ctx);
  
  return { update(t, p, g) { B.draw(g ?? t + ctx.start); } };
}
