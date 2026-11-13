// Sheet 3 — consent form: the torpedo, the rule (three must agree), two typed YES and two pen signatures.
// intent: KNOW one nuclear torpedo; three must agree; two say yes · FEEL dread rising · SEE two YES, one taped-over name
// truth: form = RC, clearly labelled; names from later accounts (hedged on the sheet: "accounts differ")
import { slideIn } from '../shared/dossier.js';
import { buildForm, T } from '../shared/form.js';

export default function (root, ctx) {
  const form = buildForm(root, ctx);
  ctx.sfx('dos-paper-slide', 0, { lu: -14 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration + 0.2, lu: -24, fade: 0.6 });
  ctx.sfx('breath-scared-01', 19.3 - ctx.start, { lu: -22 });   // a held breath before "the third"
  return { update(t) { slideIn(root, t, 0.42, ctx.layout.width); form.update(t + ctx.start); } };
}
