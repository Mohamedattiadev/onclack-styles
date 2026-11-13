// Panel 2 — ships above, practice charges falling as panes lighting downward, three bursts, the real photo, Moscow goes dark.
// intent: KNOW US ships dropped practice charges; Moscow silent · FEEL pressure · SEE charge panes igniting down to the sub
import { mountWorld } from '../shared/world.js';
export default async function (root, ctx) {
  const at = g => g - ctx.start;
  const ch = (ctx.words.find(w => /^charges/i.test(w.word))?.start ?? 10.05) - 2 / 30;
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -18, fade: 0.8 });
  ctx.sfx('boom-distant-01', at(ch + 0.2) + 2 / 30, { lu: -9, duration: 2.6, fadeOut: 1.2 });
  ctx.sfx('boom-distant-01', at(ch + 0.93) + 2 / 30, { lu: -15, duration: 2.0, fadeOut: 1.0 });
  ctx.sfx('drips-wood-01', at(ch + 1.6), { lu: -24, duration: 2.2, fadeIn: 0.2, fadeOut: 0.6 });
  return mountWorld(root, ctx);
}
