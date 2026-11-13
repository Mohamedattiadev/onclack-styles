// SCENE 2 — eraser wipe 1 (date → ghost), ships above, depth charges, Moscow silent. intent: KNOW US ships drop practice charges, no word from Moscow · FEEL pressure from above · SEE three ships, dashed falls, chalk bursts at the sub.
// The whole film is one board on one global clock (shared/board.js); this scene draws the board at global time.
import { mountBoard } from '../shared/board.js';

export default async function (root, ctx) {
  const B = await mountBoard(root, ctx);
  
  return { update(t, p, g) { B.draw(g ?? t + ctx.start); } };
}
