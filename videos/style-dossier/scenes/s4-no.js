// Sheet 3 continued — the tape lifts off the third name, the red half of the ribbon strikes NO, the camera pulls back,
// a red stamp lands: made public 2002, forty years later.
// intent: KNOW Arkhipov said no; the world learned his name ~40 years later · FEEL relief/awe · SEE red NO filling the frame
// truth: RC (labelled); "2002" = the 40th-anniversary Havana conference where his role became widely known (hedged in README)
import { buildForm, T } from '../shared/form.js';

export default function (root, ctx) {
  const form = buildForm(root, ctx);
  // the sea thins out before the NO: only room tone and the keys (the one big drop of the film)
  ctx.ambience('sea-water-close-01', { from: 0, to: 1.6, lu: -24, fade: 0.9 });
  ctx.sfx('dos-paper-slide', T.tape - ctx.start, { lu: -15 });
  ctx.sfx('dos-stamp', T.stamp - ctx.start - 0.07, { lu: -6 });
  return { update(t) { form.update(t + ctx.start); } };
}
