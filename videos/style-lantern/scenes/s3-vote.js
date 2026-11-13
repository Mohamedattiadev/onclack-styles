// Slide 3 — the weapon and the vote. intent: KNOW a nuclear torpedo needs three officers to agree, two said yes ·
// FEEL rising dread · SEE three cap cartouches (no faces); two amber "yes" slid into register, the third left empty.
// truth: torpedo + caps VO diagrams (proportions approx., warhead yield "approx."); the vote is from later accounts.
import { smootherstep } from '/onclack-styles/engine/lib/anim.js';
import { F, wordT, projector, slideChange, loadCarrier, pointer } from '../shared/lantern.js';
import { slidePhoto, slideVote } from '../shared/slides.js';

export default async function (root, ctx) {
  const L = ctx.layout;
  const P = projector(root, ctx, { seed: 3 });
  const prev = await slidePhoto(P.carrier, ctx, P, {});
  const T = { three: wordT(ctx, 'three', 0, 3.19), two: wordT(ctx, 'Two', 0, 4.97) };
  const cur = slideVote(P.carrier, ctx, P, T);
  const car = loadCarrier(P, prev.el, cur.el);
  const ptr = pointer(P, L, { seed: 6 });
  const tTorp = wordT(ctx, 'torpedo', 0, 1.56) - 2 * F;
  const tYes = wordT(ctx, 'yes', 0, 5.48);
  ctx.sfx('drawer-close-01', 16 * F + F, { lu: -15 });
  ctx.sfx('cloth-jacket-01', T.three - 4 * F, { lu: -22 });          // the lecturer's sleeve as the card is lifted
  ctx.sfx('footsteps-wood-creep-01', tYes + 0.35, { lu: -24 });       // a step toward the screen
  prev.update(1e6);
  return {
    update(t) {
      const st = slideChange(t, 0, P.G, L);
      car.visible(st);
      cur.update(t);
      const k = smootherstep((t - 0.6) / (ctx.duration - 0.6));
      P.update(t, { bright: st.bright * 0.97, focus: st.focus, hblur: st.hblur, carrierX: st.x, cam: { s: 1.0 + 0.04 * k, x: 0, y: -L.px(20) * k } });
      ptr.update(t, [[0, null], [tTorp, ...cur.spots.warhead], [T.three - 6 * F, null], [tYes + 0.75, ...cur.spots.third]], L.landscape ? 30 : 56);
    },
  };
}
