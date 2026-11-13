// 4 · THE FOOTNOTE — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// Same page as scene 3 (built again, driven by global time → the cut is invisible). The camera has followed the
// hairline down; the footnote opens: name, "said no." with the one red pencil loop, then 1962 ——— 2002.
import { buildLedger } from '../shared/ledger.js';

export default async function (root, ctx) {
  const pg = await buildLedger(root, ctx, 's4');
  return { update(t, p, g) { pg.update(g ?? ctx.start + t); } };
}
