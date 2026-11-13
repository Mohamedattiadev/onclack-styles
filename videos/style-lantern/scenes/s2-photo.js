// Slide 2 — the photograph. intent: KNOW US ships forced the boat, Moscow silent · FEEL pressure ·
// SEE the real U.S. Navy photo of B-59, hand-tinted; a slipping-glass diagram drops three charges.
// truth: photo EV (U.S. Navy, 28–29 Oct 1962 — dated after the event in its caption; tints are the medium, nothing added
// to the picture); diagram VO, lettered "diagram, not to scale".
import { smootherstep } from '/onclack-styles/engine/lib/anim.js';
import { F, wordT, projector, slideChange, loadCarrier } from '../shared/lantern.js';
import { slideMap, slidePhoto } from '../shared/slides.js';

export default async function (root, ctx) {
  const L = ctx.layout;
  const P = projector(root, ctx, { seed: 2 });
  const prev = await slideMap(P.carrier, ctx, P);
  const T = {
    drop: wordT(ctx, 'drop', 0, 1.74) - 2 * F,
    burst: wordT(ctx, 'charges', 0, 2.84) + 0.12,
    moscow: wordT(ctx, 'Moscow', 0, 3.74),
  };
  const cur = await slidePhoto(P.carrier, ctx, P, T);
  const car = loadCarrier(P, prev.el, cur.el);
  // sound: wooden carrier knock on landing; a low sea bed for the photograph; two muffled underwater thuds
  ctx.sfx('drawer-close-01', 16 * F + F, { lu: -15 });
  ctx.ambience('sea-water-close-01', { from: 0.2, to: ctx.duration, lu: -21, fade: 0.6 });
  ctx.sfx('boom-distant-01', cur.bursts[0] + F, { lu: -11 });
  ctx.sfx('boom-slapback-01', cur.bursts[2] + F, { lu: -15 });
  // someone in the hall coughs in the pause after "days" (a real voice sound, far back, very low)
  ctx.sfx('cough-01', wordT(ctx, 'days', 0, 5.28) + 0.75, { lu: -27 });
  return {
    update(t) {
      const st = slideChange(t, 0, P.G, L);
      car.visible(st);
      cur.update(t);
      const k = smootherstep((t - 0.6) / (ctx.duration - 0.6));
      P.update(t, { bright: st.bright, focus: st.focus, hblur: st.hblur, carrierX: st.x, cam: { s: 1.0 + 0.035 * k, x: L.pick({ landscape: L.px(40), portrait: 0 }) * k, y: L.pick({ landscape: 0, portrait: L.px(30) }) * k } });
    },
  };
}
