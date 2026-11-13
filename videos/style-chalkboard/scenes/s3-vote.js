// SCENE 3 — eraser wipe 2 (sea → ghost), the torpedo, three officers, two YES. intent: KNOW a nuclear torpedo needs three yes votes; two said yes · FEEL the count closing in · SEE boxed 1-2-3, three figures in three different stances.
// The whole film is one board on one global clock (shared/board.js); this scene draws the board at global time.
import { mountBoard } from '../shared/board.js';

export default async function (root, ctx) {
  const B = await mountBoard(root, ctx);
  
  return { update(t, p, g) { B.draw(g ?? t + ctx.start); } };
}
