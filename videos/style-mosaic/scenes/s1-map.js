// Scene s1 — draws the shared mosaic floor at global time (see shared/world.js for the beat table + truth codes).
import { mount } from '../shared/world.js';

export default async function (root, ctx) {
  const w = await mount(root, ctx);
  const at = (id, g, o) => ctx.sfx(id, g - ctx.start, o);                    // cue at a GLOBAL time
  const bed = (id, a, b, o) => ctx.ambience(id, { from: a - ctx.start, to: b - ctx.start, ...o });
  // open sea for the map; tesserae poured/laid; re-lay rattle; J-cut into the underwater hull bed
  bed('sea-wash-calm-01', 0, 7.3, { lu: -15, fade: 0.8 });
  at('sand-sprinkle-01', 0.1, { lu: -17, duration: 3.2, fadeOut: 0.6 });
  at('rock-stream-01', 5.38, { lu: -15, duration: 1.5, fadeIn: 0.03, fadeOut: 0.5 });
  bed('sea-water-close-01', 6.9, 13.9, { lu: -13, fade: 0.7 });
  return { update(t) { w.draw(ctx.start + t); } };
}
