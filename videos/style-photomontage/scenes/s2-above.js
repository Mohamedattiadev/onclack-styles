// Scene 2 — RISING. intent: KNOW US ships above drop practice charges; Moscow silent · FEEL pressure from above, cut off
// SEE: three Navy prints over a black surface line, red paper charges sinking toward the cut-paper boat; red tape over MOSCOW.
// truth: ship photos EV (dates on labels), boat RC (labelled cut paper), charges VO. transition in: sheet slides over (GLIDE).
import { boardAbove } from '../shared/boards.js';
export default async function (root, ctx) {
  const b = await boardAbove(root, ctx);
  return { update: t => b.update(t) };
}
