// Scene 2 — MS: ships drop practice charges, added-white bursts; radio arcs go out on "silent"; the pot turns (intent: KNOW they are hunted + cut off, FEEL dread, SEE bursts round the sub).
import { buildVase } from '../shared/vase.js';
import { buildLabels } from '../shared/label.js';

export default async function (root, ctx) {
  const V = await buildVase(root, ctx);
  const lab = buildLabels(root, ctx);
  const G = t => t - ctx.start; // global → scene-local seconds
  [9.95, 10.3, 10.62].forEach((tb, i) => ctx.sfx(i === 1 ? 'boom-slapback-01' : 'boom-distant-01', G(tb) + 1 / 30, { lu: i === 1 ? -14 : -11 }));
  ctx.sfx('cloth-shake-01', G(12.95), { lu: -24 }); // soft organic swish as the pot starts to turn
  return { update(t) { const T = ctx.start + t; V.render(T); lab.update(T); } };
}
