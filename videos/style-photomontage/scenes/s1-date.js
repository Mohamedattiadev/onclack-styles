// Scene 1 — ESTABLISH. intent: KNOW 27 Oct 1962, a Soviet sub near Cuba · FEEL a poster being built, alarm under order
// SEE: the year on a hard diagonal, a scissor-cut Navy print of B-59 on a red disc. truth: photo EV (28–29 Oct, labelled),
// chart EV-derived (Natural Earth), red dot RC "approx.". shots: 1A WS board, slow push toward the print.
import { boardOpen } from '../shared/boards.js';
export default async function (root, ctx) {
  const b = await boardOpen(root, ctx);
  return { update: t => b.update(t) };
}
