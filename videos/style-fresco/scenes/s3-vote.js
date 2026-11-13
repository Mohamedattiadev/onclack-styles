// 3 · turn. intent: KNOW one nuclear torpedo; three officers must agree; two say yes · FEEL dread · SEE two men painted,
// two green YES marks, the third man still only charcoal on bare rough plaster. Sound: a cough, metal deck steps, sea bed thins.
import { buildFresco } from '../shared/fresco.js';
export default async function (root, ctx) {
  const w = await buildFresco(root, ctx, 's3');
  const T = w.T;
  ctx.sfx('footsteps-metal-deck-01', T.officers - ctx.start, { lu: -24 });
  ctx.sfx('cough-01', T.agree + 0.45 - ctx.start, { lu: -24 });
  return { update(t) { w.update(ctx.start + t); } };
}
