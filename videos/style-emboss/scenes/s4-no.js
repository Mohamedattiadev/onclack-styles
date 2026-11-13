// 4 · PEAK → RESOLUTION. KNOW: Arkhipov said no; his name came out decades later. FEEL: relief, then quiet awe.
// SEE: the only ink in the film — an ultramarine NO bitten into the paper — still there when the lamp goes.
// 4A (0–2.2 s) the third officer, alone on his sheet; the lamp finds him; he lifts a hand.      truth: VO (figure, no face)
// 4B (2.2 s)   the inked die: its shadow falls for 4 frames, then NO bites in (the only colour). truth: VO
// 4C (3.2–6.3 s) the lamp rises overhead: the blind relief melts back into white, the ink stays;
//               then the lamp drops low along the foot and rakes his name out of the paper.     truth: EV (name, dates)
import { svg, clamp, ease, keyframes, glide } from '/onclack-styles/engine/lib/anim.js';
import { makeSheet, hgt, press, P, INK } from '../shared/relief.js';
import { officer } from '../shared/shapes.js';

export default function (root, ctx) {
  const S = makeSheet(root, ctx, { seed: 13, name: '4 · Cotton sheet' });
  const { W, H, L, world, ink, u } = S;
  const port = L.portrait, sf = L.safe;
  const g0 = ctx.start;
  const NO_T = 21.97; // "no" = 22.03 → ink lands 2 frames before the word

  // figure (same posture family as panel 3: head bowed, then the hand comes up)
  const figH = L.pick({ landscape: sf.h * 0.78, portrait: sf.h * 0.34 });
  const fx = L.pick({ landscape: sf.x + sf.w * 0.17, portrait: sf.x + sf.w * 0.5 });
  const fy = L.pick({ landscape: sf.y + sf.h * 0.9, portrait: sf.y + sf.h * 0.4 });
  const niche = svg('path', { fill: hgt(-0.2), 'data-name': '4A Niche' }, world);
  const nw = figH * 0.55, nh = figH * 1.08;
  niche.setAttribute('d', `M ${fx - nw / 2} ${fy + 10 * u} L ${fx - nw / 2} ${fy - nh + nw / 2} A ${nw / 2} ${nw / 2} 0 0 1 ${fx + nw / 2} ${fy - nh + nw / 2} L ${fx + nw / 2} ${fy + 10 * u} Z`);
  const fig = officer(world, { x: fx, y: fy, s: figH / 400 * 0.92, flip: -1, lv: 0.45, name: '4A Vasili Arkhipov (figure, no face)' });

  // the NO — deboss in the height map + ink on top (same glyphs, same place)
  const noX = L.pick({ landscape: sf.x + sf.w * 0.64, portrait: W / 2 - sf.w * 0.02 });
  const noY = L.pick({ landscape: sf.y + sf.h * 0.62, portrait: sf.y + sf.h * 0.71 });
  const noSize = L.pick({ landscape: 520, portrait: 470 }) * u;
  const noAttrs = { 'font-family': 'Schibsted Grotesk', 'font-weight': 800, 'letter-spacing': -6 * u };
  const noBite = P.text(world, 'NO', noX, noY, noSize, -0.62, { ...noAttrs, 'data-name': '4B NO bite (deboss)' });
  const shadow = svg('text', { x: noX + 10 * u, y: noY + 16 * u, 'font-size': noSize, 'text-anchor': 'middle', fill: '#5C6070',
    filter: 'blur(14px)', ...noAttrs, 'data-name': '4B Die shadow' }, ink);
  shadow.textContent = 'NO';
  const noInk = svg('text', { x: noX, y: noY, 'font-size': noSize, 'text-anchor': 'middle', fill: INK, ...noAttrs, 'data-name': '4B NO (ink)' }, ink);
  noInk.textContent = 'NO';

  // name + dates, blind (revealed only when the lamp drops low)
  const nameG = svg('g', { 'data-name': '4C Name (blind)' }, world);
  const nameY = L.pick({ landscape: sf.y + sf.h * 0.83, portrait: sf.y + sf.h * 0.89 });
  P.text(nameG, 'VASILI ARKHIPOV', noX, nameY, L.pick({ landscape: 76, portrait: 66 }) * u, 0.85, { 'letter-spacing': 9 * u });
  const datesG = svg('g', { 'data-name': '4C Dates (blind)' }, world);
  P.text(datesG, '1926 – 1998', noX, nameY + L.pick({ landscape: 70, portrait: 66 }) * u, L.pick({ landscape: 40, portrait: 38 }) * u, 0.65,
    { 'letter-spacing': 6 * u, 'font-variant-numeric': 'lining-nums' });
  // the empty nameplate waits from the start (the world does not know his name yet)
  const npW = L.pick({ landscape: 820, portrait: 820 }) * u, npH = L.pick({ landscape: 170, portrait: 160 }) * u;
  const plate = svg('rect', { x: noX - npW / 2, y: nameY - npH * 0.55, width: npW, height: npH, rx: 8 * u, fill: 'none', stroke: hgt(-0.5),
    'stroke-width': 3 * u, 'data-name': '4C Nameplate (empty until the end)' }, world);

  ctx.sfx('page-turn-01', 0.0, { lu: -17 });
  ctx.sfx('breath-close-01', 21.25 - g0, { lu: -24 });                // a held breath under "says"
  ctx.sfx('letterpress-manual-01', NO_T - g0 + 0.01, { lu: -4 });     // the inked die
  ctx.sfx('drawer-close-01', NO_T - g0 + 0.02, { lu: -9 });           // its weight in the wood
  ctx.sfx('letterpress-manual-01', 23.72 - g0, { lu: -16 });          // name (soft, blind)

  return {
    update(t) {
      const g = g0 + t;
      S.enter(t);
      // gesture: head bowed → lifts, hand rises palm-out just before the word
      const lift = ease.inOutCubic(clamp((g - 21.15) / 0.75));
      fig.pose({ lean: 2 - 3 * lift, tilt: 16 - 20 * lift, front: [4 + 132 * lift, 8 + 160 * lift], back: [-5, -2], legs: [6, -10], stance: 18 });
      niche.style.opacity = 1;
      const pNo = press(g, NO_T);
      noBite.style.opacity = pNo;
      noInk.style.opacity = g >= NO_T ? 1 : 0;
      const sh = clamp((g - (NO_T - 0.14)) / 0.14);
      shadow.style.opacity = g < NO_T ? sh * 0.55 : 0;
      noInk.setAttribute('transform', `translate(${noX} ${noY}) scale(${1 + 0.01 * (1 - clamp((g - NO_T) / 0.2))}) translate(${-noX} ${-noY})`);
      nameG.style.opacity = press(g, 23.72);
      datesG.style.opacity = press(g, 24.45);

      // camera: slow push toward the NO after it lands, a 1-frame die jolt
      const jolt = g >= NO_T && g < NO_T + 0.1 ? 3 * u : 0;
      const tx = W / 2 + (noX - W / 2) * glide(g, 22.2, 25.8, 0, 0.18);
      S.cam(tx, H / 2 + jolt, 1 + glide(g, 22.1, 26.5, 0, 0.05));
      // lamp: finds him from the left → hangs over the NO → rises (relief melts) → drops low at the foot (name)
      const lx = keyframes(g, [[19.7, -0.34], [21.6, -0.2], [22.6, -0.16], [23.6, 0.35], [24.6, -0.12], [26.2, 0.05]], ease.inOutSine) * W;
      const ly = keyframes(g, [[19.7, 0.35], [21.6, 0.5], [22.6, -0.12], [23.6, -0.6], [24.6, 1.1], [26.2, 1.12]], ease.inOutSine) * H;
      const lz = keyframes(g, [[19.7, 260], [21.6, 270], [22.6, 300], [23.6, 1400], [24.4, 330], [26.2, 280]]);
      S.lamp({ x: lx, y: ly, z: lz, power: 1 });
    },
  };
}
