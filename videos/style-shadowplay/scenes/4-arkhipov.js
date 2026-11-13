// 4 · MS — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// Saffron field = the brightest, warmest value of the test (peak of the intensity curve: ink on saffron, 8.6:1).
// The camera is now on HIS side of the floor plan: the two who said yes sit back in the haze (plane 0.6).
// The puppet beat at "no": chin up 4°, front hand forward 11° on its shoulder pin, heavy spring. Nothing else moves.
import { svg, clamp, noise1, creep, rand } from '/onclack-styles/engine/lib/anim.js';
import { C, mix, stage, plate, railIn, beat, span, tok, wordAt, officer } from '../shared/kit.js';

export default function (root, ctx) {
  const L = ctx.layout, W = ctx.width, H = ctx.height, F = C.saffron, P = L.portrait;
  const S = stage(root, ctx, { field: F, name: '4 Stage (saffron)' });

  const cutFar = S.cut('far', { rough: L.px(2), shadow: L.px(3), alpha: 0.12, seed: 61 });
  const cutMid = S.cut('mid', { rough: L.px(1.8), shadow: L.px(5), alpha: 0.18, seed: 63 });
  const cutHero = S.cut('hero', { rough: L.px(1.6), shadow: L.px(12), alpha: 0.26, seed: 65 });

  // Far (0.3): the same hull frames as scene 3 (continuity), hazed further, and the deck line.
  const pFar = S.plane(0.3, '4 Hull frames (far)');
  const gFar = svg('g', { filter: cutFar }, pFar);
  const nR = P ? 3 : 5;
  for (let i = 0; i < nR; i++) {
    const x = W * (0.02 + (0.8 * i) / (nR - 1)) + (rand(i * 6.1 + 2) - 0.5) * L.px(50), w = L.px(22 + rand(i * 3.3) * 8);
    svg('path', { d: `M${x},${H * 1.2} L${x},${H * 0.2} Q${x + w * 0.5},${H * 0.06} ${x + w * 3},${-H * 0.05} L${x + w * 4},${-H * 0.05} Q${x + w * 1.4},${H * 0.12} ${x + w},${H * 0.22} L${x + w},${H * 1.2} Z`, fill: mix(C.ink, F, 0.8) }, gFar);
  }
  // Mid (0.6): the two who said yes, small and hazed, facing him. Deck strip under them.
  const pMid = S.plane(0.6, '4 The two (mid, hazed)');
  const midFoot = H * L.pick({ landscape: 0.84, portrait: 0.62 }), midH = H * L.pick({ landscape: 0.44, portrait: 0.27 });
  const gDeck = svg('g', { filter: cutMid }, pMid);
  svg('rect', { x: -W * 0.3, y: midFoot, width: W * 1.6, height: H, fill: mix(C.ink, F, 0.8) }, gDeck);
  const midXs = L.pick({ landscape: [0.12, 0.27], portrait: [0.1, 0.3] }).map(f => W * f);
  const two = midXs.map((x, i) => {
    const h = svg('g', {}, pMid);
    const o = officer(h, { fill: mix(C.ink, F, 0.5), filter: cutMid, name: `4 Officer ${i + 1} (said yes, hazed)`, stocky: [1.08, 0.96][i], cap: i === 0, posture: [1, -0.6][i] });
    const s = midH / 875;
    h.setAttribute('transform', `translate(${x} ${midFoot}) scale(${s} ${s}) translate(-150 -902)`);
    return o;
  });
  // Far wall (0.3): his own cast shadow on the hull, thrown down-right by the key light (upper-left). Same pins, same pose.
  const pShadow = S.plane(0.3, '4 Cast shadow on hull (far)');
  const shG = svg('g', {}, pShadow);
  const shadow = officer(shG, { fill: mix(C.ink, F, 0.8), name: '4 Arkhipov cast shadow' });
  // Subject (1): Arkhipov — generic figure, not a portrait. Cropped at the thigh (MS), facing left toward the two.
  const pHero = S.plane(1, '4 Arkhipov plane');
  const heroH = H * L.pick({ landscape: 1.12, portrait: 0.74 });
  const heroX = W * L.pick({ landscape: 0.66, portrait: 0.66 }), heroFoot = H * L.pick({ landscape: 1.3, portrait: 1.04 });
  const hs = heroH / 875;
  const heroG = svg('g', { transform: `translate(${heroX} ${heroFoot}) scale(${-hs} ${hs}) translate(-150 -902)` }, pHero);
  const shs = hs;
  shG.setAttribute('transform', `translate(${heroX + W * L.pick({ landscape: 0.13, portrait: 0.17 })} ${heroFoot + H * 0.035}) scale(${-shs} ${shs}) translate(-150 -902)`);
  const hero = officer(heroG, { filter: cutHero, name: '4 Vasili Arkhipov (generic figure, not a portrait)' });

  // Voice timing.
  const tVas = wordAt(ctx, 'Vasili', 0, 0.87), tNo = wordAt(ctx, 'no.', 0, 2.29);
  const tWorld = wordAt(ctx, 'world', 0, 3.33), tForty = wordAt(ctx, 'forty', 0, 4.39);
  ctx.sfx('cloth-jacket-01', tNo - 0.12, { volume: 0.3 });

  // Type.
  const name = plate(S.type, L, { text: 'Vasili Arkhipov', font: 'title', size: L.pick({ landscape: 78, portrait: 76 }), name: '4 Name plate', seed: 71, padX: 0.38, padY: 0.2 });
  const role = plate(S.type, L, { text: 'B-59 · flotilla chief of staff · 1926–1998', size: L.pick({ landscape: 26, portrait: 24 }), ground: C.paper, color: C.ink, name: '4 Role + dates', seed: 73, track: 0.06 });
  const no = plate(S.type, L, { text: 'no.', font: 'title', italic: true, size: L.pick({ landscape: 150, portrait: 150 }), ground: C.paper, color: C.ink, name: '4 No plate', seed: 75, padX: 0.3, padY: 0.06 });
  const later = plate(S.type, L, { text: 'Made public: Havana conference,\nOctober 2002', size: L.pick({ landscape: 28, portrait: 28 }), name: '4 Later plate', seed: 77, track: 0.06 });
  const credit = plate(S.type, L, { text: 'Figure staged — not a portrait', size: L.pick({ landscape: 22, portrait: 24 }), ground: C.ink, color: mix(C.paper, C.ink, 0.25), name: '4 Credit', seed: 79, track: 0.06 });

  return {
    update(t) {
      S.update(t);
      // Camera: push toward his head through the name and the "no", then ease back a little for "forty years later".
      const pushIn = span(t, 0.2, tNo + 0.6), back = span(t, tWorld - 0.2, ctx.duration + 0.3);
      const z = creep(t, 0.03) * (1 + 0.08 * pushIn - 0.04 * back);
      const fx = heroX, fy = heroFoot - heroH * 0.88;
      S.camera({ s: z, fx, fy });

      // Hero: breathes (very small), then the puppet beat at "no".
      const k = beat(t, tNo - 0.1);
      const br = noise1(t * 0.4, 9);
      hero.set({ nod: -4 * k + br * 0.3, arm: -7 * k + br * 0.6, lean: 1.2 * k });
      shadow.set({ nod: -4 * k + br * 0.3, arm: -7 * k + br * 0.6, lean: 1.2 * k });
      // The two: they turn their heads up toward him a beat after the "no" (reaction, not decoration).
      two.forEach((o, i) => { const r = beat(t, tNo + 0.25 + i * 0.15); o.set({ nod: -5 * r + noise1(t * 0.3, i) * 0.4, lean: -0.6 * r }); });

      // Type.
      const m = L.safe;
      const nx = m.x + L.px(P ? 0 : 10), ny = m.y + L.px(P ? 60 : 20);
      railIn(name, t, tVas - 0.08, nx, ny, -L.px(110), 0);
      railIn(role, t, tVas + 0.3, nx, ny + name.h() + L.px(12), L.px(50), 0);
      const [hx, hy] = [fx + (heroX - heroH * 0.2 - fx) * z, fy + (heroFoot - heroH * 0.86 - fy) * z];
      railIn(no, t, tNo - 0.08, Math.max(m.x, hx - no.w()), P ? m.y + m.h * 0.25 : hy, L.px(90), 0);
      railIn(later, t, tForty - 0.1, P ? m.x : m.x + L.px(10), m.y + m.h - later.h() - (P ? credit.h() + L.px(14) : L.px(10)), L.px(60), 0);
      railIn(credit, t, 0.6, P ? m.x : m.x + m.w - credit.w(), m.y + m.h - credit.h(), 0, 0);
    },
  };
}
