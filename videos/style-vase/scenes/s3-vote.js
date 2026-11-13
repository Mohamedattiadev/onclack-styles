// Scene 3 — the turn lands on the torpedo; three officers are painted in; two raise a hand (intent: KNOW three must agree, two said yes, FEEL tension, SEE two raised hands).
import { buildVase } from '../shared/vase.js';
import { buildLabels } from '../shared/label.js';

export default async function (root, ctx) {
  const V = await buildVase(root, ctx);
  const lab = buildLabels(root, ctx);
  const G = t => t - ctx.start; // global → scene-local seconds
  ctx.sfx('drips-wood-01', G(14.1), { lu: -26 }); // condensation dripping in the hot compartment
  ctx.ambience('breath-close-01', { from: G(16.3), to: G(19.25), lu: -24, fade: 0.6 }); // close, tense breathing (voice-only human sound)
  ctx.sfx('cloth-jacket-01', G(18.26), { lu: -17 });
  ctx.sfx('cloth-jacket-01', G(18.52), { lu: -19 });
  return { update(t) { const T = ctx.start + t; V.render(T); lab.update(T); } };
}
