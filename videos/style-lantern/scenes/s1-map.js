// Slide 1 — the map. intent: KNOW where and when (27 Oct 1962, near Cuba) · FEEL curiosity, the hall going quiet ·
// SEE a hand-tinted map lit by the lantern; the lecturer's pointer finds the boat, then Cuba.
// truth: coastlines EV-derived (Natural Earth); boat position RC, lettered "position approx."; tints = our hand.
import { glide, smootherstep } from '/onclack-styles/engine/lib/anim.js';
import { F, tw, ez, wordT, projector, pointer } from '../shared/lantern.js';
import { slideMap } from '../shared/slides.js';

export default async function (root, ctx) {
  const L = ctx.layout;
  const P = projector(root, ctx, { seed: 1 });
  const slide = await slideMap(P.carrier, ctx, P);
  const ptr = pointer(P, L, { seed: 4 });
  const tSub = wordT(ctx, 'submarine', 0, 4.3) - 2 * F;
  const tCuba = wordT(ctx, 'Cuba', 0, 6.52) - 2 * F;
  // sound: the hall settles as the lamp comes up (murmur fades), then only room tone + voice
  ctx.ambience('crowd-museum-murmur-01', { from: 0, to: 1.7, lu: -22, fade: 0.6 });
  ctx.sfx('cloth-jacket-01', 0.15, { lu: -26 });
  return {
    update(t) {
      // lamp strikes: warm-up over 14 f (no flash), then the operator racks focus
      const bright = tw(t, 0, 14 * F, 0.08, 1, ez.enter);
      const focus = L.px(3) * (1 - ez.enter(Math.min(1, Math.max(0, (t - 8 * F) / (18 * F)))));
      // camera: from the back row, a slow walk toward the screen (discovery), drifting to the boat
      const k = smootherstep(t / ctx.duration);
      const cam = { s: 0.94 + 0.08 * k, x: -L.px(18) * k, y: L.px(6) * k };
      P.update(t, { bright, focus, cam });
      ptr.update(t, [[0, null], [tSub, ...slide.spots.sub], [tCuba, ...slide.spots.cuba]], L.landscape ? 34 : 58);
    },
  };
}
