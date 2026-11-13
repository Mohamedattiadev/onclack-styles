// SCENE 1 — date, sea, submarine, Cuba. intent: KNOW 27 Oct 1962, a Soviet sub hides deep near Cuba · FEEL a lecture beginning, curiosity · SEE the date written big, then a sea diagram with the sub drawn under the line. truth: date VO; sub = RC (generic Foxtrot-type outline); Cuba = RC sketch.
// The whole film is one board on one global clock (shared/board.js); this scene draws the board at global time.
import { mountBoard } from '../shared/board.js';

export default async function (root, ctx) {
  const B = await mountBoard(root, ctx);
  B.sound(); // all sound cues are registered once, here (global times)
  return { update(t, p, g) { B.draw(g ?? t + ctx.start); } };
}
