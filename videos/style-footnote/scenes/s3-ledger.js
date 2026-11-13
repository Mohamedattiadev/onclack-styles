// 3 · THREE OFFICERS — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// The ledger page slides in over the evidence page. Fig. 4 (our torpedo drawing) + Table 1 (three officers, no faces).
// Two pencil ticks; row 3 gets the ✱ and the footnote dive starts. Page + camera live in shared/ledger.js (global time).
import { buildLedger } from '../shared/ledger.js';

export default async function (root, ctx) {
  const pg = await buildLedger(root, ctx, 's3');
  return { update(t, p, g) { pg.update(g ?? ctx.start + t); } };
}
