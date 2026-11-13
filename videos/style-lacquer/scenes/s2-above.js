// Station 2 — silver ships on the surface, charges fall as grains and burst round the shell sub; Moscow's line is brushed off.
// intent: KNOW US ships drop practice charges, Moscow silent · FEEL pressure · SEE three rings of grains round the hull
import { mountWorld } from '../shared/lacquer.js';
export default async function (root, ctx) {
  const at = g => g - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -22, fade: 0.8 });
  ctx.sfx('sand-sprinkle-01', at(8.0), { lu: -21, duration: 1.2, fadeOut: 0.3 });
  ctx.sfx('boom-distant-01', at(10.11), { lu: -10 });
  ctx.sfx('boom-distant-01', at(10.49), { lu: -13 });
  ctx.sfx('boom-distant-01', at(10.89), { lu: -11 });
  ctx.sfx('drips-wood-01', at(11.4), { lu: -26, duration: 1.6, fadeOut: 0.5 });
  ctx.sfx('cloth-shake-01', at(11.9), { lu: -24 });           // the brush sweeps the orders off
  return mountWorld(root, ctx);
}
