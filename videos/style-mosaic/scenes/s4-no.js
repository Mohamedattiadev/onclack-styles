// Scene s4 — draws the shared mosaic floor at global time (see shared/world.js for the beat table + truth codes).
import { mount } from '../shared/world.js';

export default async function (root, ctx) {
  const w = await mount(root, ctx);
  const at = (id, g, o) => ctx.sfx(id, g - ctx.start, o);                    // cue at a GLOBAL time
  const bed = (id, a, b, o) => ctx.ambience(id, { from: a - ctx.start, to: b - ctx.start, ...o });
  // the NO is set: one stone placed; then open, calm sea air (relief)
  at('rock-impact-01', 22.05, { lu: -9, duration: 2, fadeOut: 0.8 });
  bed('sea-wash-calm-01', 22.9, 25.88, { lu: -17, fade: 0.8 });
  return { update(t) { w.draw(ctx.start + t); } };
}
