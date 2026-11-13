// Scene s2 — draws the shared mosaic floor at global time (see shared/world.js for the beat table + truth codes).
import { mount } from '../shared/world.js';

export default async function (root, ctx) {
  const w = await mount(root, ctx);
  const at = (id, g, o) => ctx.sfx(id, g - ctx.start, o);                    // cue at a GLOBAL time
  const bed = (id, a, b, o) => ctx.ambience(id, { from: a - ctx.start, to: b - ctx.start, ...o });
  // three muffled depth-charge thuds on the burst frames, hull groan, a drip; re-lay rattle into the interior
  at('boom-distant-01', 10.02, { lu: -7 });
  at('boom-slapback-01', 10.64, { lu: -9, duration: 3, fadeOut: 1 });
  at('boom-distant-01', 11.34, { lu: -8 });
  at('door-creak-01', 12.0, { lu: -15 });
  at('drips-wood-01', 12.6, { lu: -20, duration: 3, fadeOut: 0.8 });
  at('rock-stream-01', 13.43, { lu: -16, duration: 1.3, fadeIn: 0.03, fadeOut: 0.5 });
  return { update(t) { w.draw(ctx.start + t); } };
}
