// Slide 4 — "No." intent: KNOW the third officer, Arkhipov, refused; his story was known only decades later ·
// FEEL relief, then quiet awe · SEE the carmine "No." uncovered by the lecturer's card (peak), then a dissolve to the
// second lantern: 1962 —— 2002. truth: name card VO (no portrait); dates EV-checked: Arkhipov 1926–1998, Havana 2002.
import { smootherstep } from '/onclack-styles/engine/lib/anim.js';
import { F, ez, tw, wordT, projector, slideChange, loadCarrier, pointer } from '../shared/lantern.js';
import { slideVote, slideNo, slideLater } from '../shared/slides.js';
import { progress } from '/onclack-styles/engine/lib/anim.js';

export default async function (root, ctx) {
  const L = ctx.layout;
  const P = projector(root, ctx, { seed: 4 });
  const prev = slideVote(P.carrier, ctx, P, {});
  const T = { no: wordT(ctx, 'no', 0, 2.29) };
  const cur = slideNo(P.carrier, ctx, P, T);
  const car = loadCarrier(P, prev.el, cur.el);
  const ptr = pointer(P, L, { seed: 8 });
  // the second lantern (biunial): its own slide, its own hot spot, registered a few px off — never perfect
  const B = projector(root, ctx, { seed: 5, screen: false, offset: [L.px(4), -L.px(3)], spot: [53, 45] });
  B.cam.style.mixBlendMode = 'plus-lighter';
  const later = slideLater(B.carrier, ctx, B);
  void later;
  const tArk = wordT(ctx, 'Arkhipov', 0, 1.38) - 2 * F;
  const tWorld = wordT(ctx, 'world', 0, 3.33);
  const d0 = tWorld + 0.25, d1 = d0 + 20 * F;                     // dissolve 20 f, lands before "forty"
  ctx.sfx('drawer-close-01', 16 * F + F, { lu: -15 });
  ctx.sfx('cloth-jacket-01', T.no - 5 * F, { lu: -24 });          // the card comes away — then only room tone
  prev.update(1e6);
  return {
    update(t) {
      const st = slideChange(t, 0, P.G, L);
      car.visible(st);
      cur.update(t);
      // camera: settle, then a slow push into the answer (the peak), then hold
      const push = ez.camera(progress(t, T.no - 2 * F, T.no + 1.6));
      const k = smootherstep(t / ctx.duration);
      const cam = { s: 1.0 + 0.012 * k + L.pick({ landscape: 0.05, portrait: 0.025 }) * push, x: -L.pick({ landscape: L.px(70), portrait: 0 }) * push, y: -L.pick({ landscape: L.px(20), portrait: L.px(30) }) * push };
      const dz = progress(t, d0, d1);
      const pA = 1 - Math.sin(dz * Math.PI / 2) ** 2 * 0 - dz;     // A fades out linearly…
      const pB = dz;                                                 // …B fades in (plus-lighter: no dip at the middle)
      P.update(t, { bright: st.bright, focus: st.focus, hblur: st.hblur, carrierX: st.x, cam });
      P.gate.style.opacity = Math.max(0, pA).toFixed(3);
      B.update(t, { bright: 1, focus: L.px(1.2) * (1 - ez.enter(progress(t, d1, d1 + 12 * F))), cam });
      B.gate.style.opacity = pB.toFixed(3);
      B.cam.style.display = pB <= 0 ? 'none' : '';
      ptr.update(t, [[0, null], [tArk, ...cur.spots.name], [T.no - 5 * F, null]], L.landscape ? 32 : 56);
    },
  };
}
