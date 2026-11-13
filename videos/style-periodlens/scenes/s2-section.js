// Plate 2 — PAMPHLET CROSS-SECTION (technical-manual manner): ships above, practice depth charges, the sub below, Moscow silent.
// intent: KNOW U.S. ships dropped practice depth charges on the sub; no word from Moscow · FEEL dread · SEE charges
//         falling through ruled water toward the hatched hull
// truth: VO/RC diagram — schematic, not to scale (said in the caption); ship + sub outlines are generic class shapes.
import { el, svg, glide, rand, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { INK, MISREG, F, ez, tw, wordT, box, eraCaps, mono, frame, inkDefs, plateSvg, camCss } from '../shared/lens.js';

const DESTROYER = 'M0 0 L-8 -12 L40 -14 L44 -24 L70 -24 L72 -40 L78 -40 L80 -24 L104 -24 L106 -34 L122 -34 L124 -24 L150 -24 L152 -46 L155 -46 L157 -62 L160 -62 L162 -46 L166 -24 L196 -24 L198 -16 L262 -16 L284 -20 L270 0 Z';
const FOXTROT = 'M-150 4 Q-152 -6 -128 -10 L-30 -12 L-26 -30 Q-24 -36 -16 -36 L22 -36 Q30 -36 32 -28 L36 -12 L120 -10 Q150 -8 156 2 Q150 12 120 14 L-128 14 Q-150 13 -150 4 Z';

export default function (root, ctx) {
  const L = ctx.layout, u = L.unit;
  const FR = frame(root, ctx, { scene: 2, lens: 'pamphlet', fig: 2, caption: 'Schematic, not to scale: U.S. destroyers signal the hidden submarine with practice charges.' });
  const { plate, P } = FR;
  const ink = inkDefs(root, 's2', u);

  const tAbove = wordT(ctx, 1, 'Above', 0, 0.35) - 2 * F;
  const tShips = wordT(ctx, 1, 'ships', 0, 1.42) - 2 * F;
  const tDrop = wordT(ctx, 1, 'drop', 0, 1.74) - 2 * F;
  const tPract = wordT(ctx, 1, 'practice', 0, 2.07) - 2 * F;
  const tMos = wordT(ctx, 1, 'Moscow', 0, 3.74) - 3 * F;
  const tSil = wordT(ctx, 1, 'silent', 0, 4.72) - 2 * F;
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -22 });

  const W = P.w, H = P.h;
  const G = L.pick({
    landscape: { surf: 0.25, subY: 0.78, subX: 0.47, subS: 1.45, ships: [[0.1, 0.62], [0.4, 0.62]], shipS: 0.92, burstY: 0.58, mos: [0.94, 0.06] },
    portrait: { surf: 0.2, subY: 0.7, subX: 0.5, subS: 1.6, ships: [[0.02, 0.6], [0.42, 0.6]], shipS: 0.72, burstY: 0.55, mos: [0.98, 0.04] },
  });
  const surfY = H * G.surf, subP = [W * G.subX, H * G.subY];
  const S = plateSvg(plate, P, '2 Section art');
  const defs = svg('defs', {}, S.s);
  const hid = 'hatch-s2-' + L.format;
  const pat = svg('pattern', { id: hid, patternUnits: 'userSpaceOnUse', width: 7, height: 7, patternTransform: 'rotate(45)' }, defs);
  svg('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: INK.navy, 'stroke-width': 2.2 }, pat);

  // --- water: ruled line-tint, denser with depth (period line-tint gradient, no gradients)
  const water = svg('g', { 'data-name': '2 Water line-tint', filter: ink }, S.cam);
  for (let y = surfY + L.px(26), i = 0; y < H * 1.25; i++) {
    const d = (y - surfY) / (H - surfY);
    svg('line', { x1: -W * 0.2, x2: W * 1.2, y1: y.toFixed(1), y2: y.toFixed(1), stroke: INK.navy, 'stroke-width': Math.max(1.3, L.px(1.4)), 'stroke-opacity': 0.75 }, water);
    y += L.px(30 - 17 * Math.min(1, d));
  }
  // surface line with small regular scallops
  let sd = `M${-W * 0.2} ${surfY}`;
  const sc = L.px(26);
  for (let x = -W * 0.2; x < W * 1.2; x += sc) sd += ` q${sc / 2} ${-L.px(7)} ${sc} 0`;
  svg('path', { 'data-name': 'Surface', d: sd, fill: 'none', stroke: INK.navy, 'stroke-width': Math.max(2, L.px(2.6)), filter: ink }, S.cam);

  // --- ships (solid navy over an offset yellow plate)
  const ships = G.ships.map(([fx], i) => {
    const g = svg('g', { 'data-name': `2A Destroyer ${i + 1}` }, S.cam);
    svg('path', { d: DESTROYER, fill: INK.yellow, transform: `translate(${L.px(MISREG[0]) * 2} ${L.px(MISREG[1]) * 2})`, style: 'mix-blend-mode:multiply', filter: ink }, g);
    svg('path', { d: DESTROYER, fill: INK.navy, filter: ink }, g);
    return { g, x0: W * fx };
  });

  // --- sub: outline + hatching (manual drawing manner)
  const sub = svg('g', { 'data-name': '2B B-59 section', transform: `translate(${subP[0]} ${subP[1]}) scale(${(L.px(G.subS)).toFixed(3)})` }, S.cam);
  svg('path', { d: FOXTROT, fill: `url(#${hid})`, stroke: INK.navy, 'stroke-width': 2.6, filter: ink }, sub);
  svg('path', { d: 'M-118 1 H116', stroke: INK.navy, 'stroke-width': 1.4, 'stroke-dasharray': '14 4 3 4', fill: 'none' }, sub);

  // --- depth charges + bursts
  const drops = [0, 1, 2, 3].map(i => {
    const ship = ships[i % 2];
    const at = tDrop + i * 0.17;
    const x = ship.x0 + L.px(G.shipS * (30 + (i > 1 ? 18 : 0))) + (i % 2 ? W * 0.03 : 0);
    const yb = H * G.burstY + (rand(i + 4) - 0.5) * L.px(60);
    const c = svg('rect', { 'data-name': `Charge ${i + 1}`, x: -L.px(6), y: -L.px(9), width: L.px(12), height: L.px(18), rx: L.px(3), fill: INK.navy }, S.cam);
    const star = Array.from({ length: 22 }, (_, k) => { const a = (k / 22) * Math.PI * 2, r = k % 2 ? 0.48 + rand(i * 31 + k) * 0.12 : 0.86 + rand(i * 17 + k) * 0.28; return `${(Math.cos(a) * r).toFixed(3)},${(Math.sin(a) * r).toFixed(3)}`; }).join(' ');
    const disc = svg('polygon', { points: star, fill: INK.yellow, style: 'mix-blend-mode:multiply' }, S.cam);
    const ring = svg('circle', { r: 0, fill: 'none', stroke: INK.navy, 'stroke-width': Math.max(2, L.px(2.2)), 'stroke-dasharray': `${L.px(7)} ${L.px(6)}` }, S.cam);
    return { at, x, yb, c, disc, ring, burst: at + 0.92 };
  });
  ctx.sfx('boom-distant-01', drops[0].burst + 1 * F, { lu: -12 });
  ctx.sfx('boom-slapback-01', drops[2].burst + 1 * F, { lu: -15 });

  // --- Moscow line (radio, cut)
  const mosP = [W * G.mos[0], H * G.mos[1]];
  const sail = [subP[0] + L.px(G.subS * 2), subP[1] - L.px(G.subS * 36)];
  const radio = svg('line', { 'data-name': '2C Radio line', x1: sail[0], y1: sail[1], x2: mosP[0], y2: mosP[1] + L.px(30), stroke: INK.navy, 'stroke-width': Math.max(2, L.px(2.4)), 'stroke-dasharray': `${L.px(3)} ${L.px(8)}`, 'stroke-linecap': 'round' }, S.s);
  const radioLen = Math.hypot(mosP[0] - sail[0], mosP[1] + L.px(30) - sail[1]);

  // --- labels (screen space, constant size)
  const labS = L.pick({ landscape: 34, portrait: 36 });
  const subLab = box(plate, '2B Label B-59', 0, 0, null, null, { ...eraCaps(L.px(labS + 6), 800), filter: ink }, 'B-59');
  const shipLab = box(plate, '2A Label destroyers', 0, 0, null, null, { ...eraCaps(L.px(labS - 6), 700, { letterSpacing: '0.12em' }), filter: ink }, 'U.S. destroyers');
  const chLab = box(plate, '2A Label charges', 0, 0, null, null, { display: 'flex', alignItems: 'center', gap: L.px(14) + 'px' });
  el('div', { style: { ...eraCaps(L.px(labS - 6), 700, { letterSpacing: '0.12em', lineHeight: 1.15, whiteSpace: 'normal', textAlign: 'right', width: L.px(L.pick({ landscape: 300, portrait: 220 })) + 'px' }), filter: ink } }, chLab, 'Practice depth charges');
  const lead = el('div', { style: { width: L.px(60) + 'px', height: Math.max(2, L.px(2)) + 'px', background: INK.navy, flex: 'none', transformOrigin: '100% 50%' } }, chLab);
  const mosLab = box(plate, '2C Moscow box', 0, 0, null, null, { ...mono(L.px(30), { color: INK.navy, fontWeight: 500, border: `${Math.max(2, L.px(2))}px solid ${INK.navy}`, padding: `${L.px(6)}px ${L.px(12)}px`, background: INK.paper }) }, '→ Moscow');
  const stamp = box(plate, '2C Stamp silent', 0, 0, null, null, { ...eraCaps(L.px(46), 800, { letterSpacing: '0.14em', background: INK.yellow, mixBlendMode: 'multiply', padding: `${L.px(8)}px ${L.px(16)}px ${L.px(4)}px` }), filter: ink }, 'No reply');

  const focus0 = [subP[0], subP[1] - H * 0.05];
  const focus1 = [W / 2, H / 2];
  let cam = { z: 1, fx: W / 2, fy: H / 2, dx: 0, dy: 0 };
  const scr = ([x, y]) => [cam.fx + cam.dx + (x - cam.fx) * cam.z, cam.fy + cam.dy + (y - cam.fy) * cam.z];
  const place = (n, [x, y]) => { n.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; };

  return {
    update(t) {
      FR.update(t);
      // camera: starts close on the hidden sub, tilts up on "Above" to reveal the ships (reason: reveal), then creeps
      const pc = ez.camera(Math.min(1, Math.max(0, (t - tAbove) / 1.5)));
      const z = 1.3 + (1 - 1.3) * pc + glide(t, tAbove + 1.5, ctx.duration + 0.5, 0, 0.03);
      cam = { z, fx: focus0[0] + (focus1[0] - focus0[0]) * pc, fy: focus0[1] + (focus1[1] - focus0[1]) * pc, dx: 0, dy: 0 };
      S.setCam(cam.z, cam.fx, cam.fy);

      for (const [i, s] of ships.entries()) {
        const x = s.x0 + t * L.px(9);
        s.g.setAttribute('transform', `translate(${x.toFixed(2)} ${(surfY + L.px(2) + noise1(t * 0.6, i * 3) * L.px(1.5)).toFixed(2)}) scale(${L.px(G.shipS).toFixed(3)})`);
        s.xNow = x;
      }
      for (const [i, d] of drops.entries()) {
        const sx = ships[i % 2].xNow - ships[i % 2].x0 + d.x;
        const pf = Math.min(1, Math.max(0, (t - d.at) / (d.burst - d.at)));
        const y = surfY + (d.yb - surfY) * (1 - (1 - pf) ** 1.6);
        d.c.style.opacity = t >= d.at && t < d.burst ? 1 : 0;
        d.c.setAttribute('transform', `translate(${(sx + noise1(t * 3, i) * L.px(3)).toFixed(2)} ${y.toFixed(2)}) rotate(${(noise1(t * 2.2, i + 9) * 28).toFixed(2)})`);
        const pb = Math.max(0, t - d.burst);
        const on = t >= d.burst;
        d.disc.setAttribute('transform', `translate(${sx.toFixed(1)} ${d.yb.toFixed(1)}) rotate(${i * 37}) scale(${on ? (L.px(78) * ez.enter(Math.min(1, pb / 0.4))).toFixed(2) : 0.001})`);
        d.disc.style.opacity = on ? Math.max(0, 1 - pb / 1.6) : 0;
        d.ring.setAttribute('cx', sx.toFixed(1)); d.ring.setAttribute('cy', d.yb.toFixed(1));
        d.ring.setAttribute('r', on ? (L.px(40) + L.px(120) * ez.enter(Math.min(1, pb / 0.9))).toFixed(1) : 0);
        d.ring.style.opacity = on ? Math.max(0, 1 - pb / 1.1) : 0;
      }

      // labels
      const sp = scr([subP[0] + L.px(G.subS * 160), subP[1] - L.px(20)]);
      place(subLab, L.portrait ? scr([subP[0] - L.px(70), subP[1] + L.px(G.subS * 26)]) : sp);
      subLab.style.opacity = tw(t, 0.1, 0.3, 0, 1);
      const s0 = ships[0];
      place(shipLab, scr([s0.xNow, surfY - L.px(G.shipS * 62) - L.px(58)]));
      shipLab.style.opacity = Math.min(tw(t, tShips, tShips + 4 * F, 0, 1), 1 - tw(t, tMos - 0.3, tMos, 0, 1, ez.exit));
      const d0 = drops[1];
      const cy = surfY + (d0.yb - surfY) * 0.42;
      place(chLab, scr([ships[1].xNow - ships[1].x0 + d0.x - L.px(26), cy]));
      chLab.style.transform += ' translate(-100%, -50%)';
      chLab.style.opacity = tw(t, tPract, tPract + 4 * F, 0, 1);
      lead.style.transform = `scaleX(${tw(t, tPract, tPract + 12 * F, 0, 1).toFixed(3)})`;

      // radio line draws toward Moscow, then the reply never comes
      const pr = tw(t, tMos, tMos + 18 * F, 0, 1, ez.move);
      radio.setAttribute('stroke-dashoffset', 0);
      radio.style.opacity = t >= tMos ? 1 : 0;
      radio.setAttribute('x2', (sail[0] + (mosP[0] - sail[0]) * pr).toFixed(1));
      radio.setAttribute('y2', (sail[1] + (mosP[1] + L.px(30) - sail[1]) * pr).toFixed(1));
      const mw = mosLab.offsetWidth;
      place(mosLab, [mosP[0] - mw, mosP[1]]);
      mosLab.style.opacity = tw(t, tMos + 10 * F, tMos + 14 * F, 0, 1);
      const sw = stamp.offsetWidth;
      place(stamp, [mosP[0] - sw - L.px(L.pick({ landscape: 0, portrait: 0 })), mosP[1] + L.px(84)]);
      const ps = tw(t, tSil, tSil + 8 * F, 0, 1, ez.enter);
      stamp.style.opacity = t >= tSil ? 1 : 0;
      stamp.style.transform += ` rotate(-2.5deg) scale(${(1.08 - 0.08 * ps).toFixed(3)})`;
    },
  };
}
