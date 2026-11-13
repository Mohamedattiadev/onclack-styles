// Scene s3 — draws the shared mosaic floor at global time (see shared/world.js for the beat table + truth codes).
import { mount } from '../shared/world.js';

export default async function (root, ctx) {
  const w = await mount(root, ctx);
  const at = (id, g, o) => ctx.sfx(id, g - ctx.start, o);                    // cue at a GLOBAL time
  const bed = (id, a, b, o) => ctx.ambience(id, { from: a - ctx.start, to: b - ctx.start, ...o });
  // thin interior bed, boots on the metal deck for 'three officers', cloth for 'two say yes'; bed drops before the reveal
  bed('sea-water-close-01', 13.5, 21.1, { lu: -20, fade: 0.6 });
  at('footsteps-metal-deck-01', 16.45, { lu: -14 });
  at('footsteps-metal-deck-01', 16.86, { lu: -17 });
  at('cloth-jacket-01', 18.3, { lu: -17, duration: 1.2, fadeOut: 0.3 });
  at('breath-close-01', 20.0, { lu: -21 });                                  // one held breath under 'The third'
  at('rock-stream-01', 21.42, { lu: -15, duration: 1.0, fadeIn: 0.03, fadeOut: 0.4 });
  return { update(t) { w.draw(ctx.start + t); } };
}
