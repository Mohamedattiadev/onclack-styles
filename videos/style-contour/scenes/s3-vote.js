// SCENE 3 overlay — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// The vote panel (shared/vote.js) is pinned to the boat by a leader line; it hands over to scene 4 at the cut.
import { buildVote } from '../shared/vote.js';
import { wordAt } from '../shared/contour.js';

export default function (root, ctx) {
  const update = buildVote(root, ctx);
  const handover = wordAt(ctx.words, 'The', 1) - 0.35; // scene 4 starts here and draws the same panel
  return {
    update(t, p, gt = ctx.start + t) {
      root.style.visibility = gt >= handover ? 'hidden' : '';
      update(gt);
    },
  };
}
