// 2 · RISING. KNOW: US ships drop practice depth charges; Moscow is silent. FEEL: dread, pressure. SEE: pressure rings
// rising through the engraved water toward a hull pressed deep into the paper.
// 2A (0–2.6 s)  section: three raised hulls on the surface, the submarine pressed deep below.       truth: RC (profiles)
// 2B (2.6–4 s)  charges fall; each burst = a raised ring that swells and sinks back into the paper;
//               the lamp jolts with each one (the room shakes, not the picture).                     truth: VO
// 2C (3.7–6.6 s) a radio-log die presses in, its lines left blank: Moscow says nothing.              truth: VO
import { svg, clamp, ease, keyframes, glide } from '/onclack-styles/engine/lib/anim.js';
import { makeSheet, hgt, press, P } from '../shared/relief.js';
import { subPaths, shipPaths } from '../shared/shapes.js';

export default function (root, ctx) {
  const S = makeSheet(root, ctx, { seed: 5, name: '2 · Cotton sheet' });
  const { W, H, L, world, u } = S;
  const port = L.portrait, sf = L.safe;
  const g0 = ctx.start;

  const surfY = L.pick({ landscape: sf.y + sf.h * 0.34, portrait: sf.y + sf.h * 0.27 });
  const secW = L.pick({ landscape: sf.w * 0.62, portrait: sf.w });
  const secX = L.pick({ landscape: sf.x, portrait: sf.x });
  const botY = L.pick({ landscape: sf.y + sf.h * 0.98, portrait: sf.y + sf.h * 0.66 });

  // caption, raised (≤ 7 words)
  const cap = svg('g', { 'data-name': '2A Caption' }, world);
  P.text(cap, 'PRACTICE DEPTH CHARGES', secX + secW / 2, L.pick({ landscape: sf.y + sf.h * 0.08, portrait: sf.y + sf.h * 0.05 }),
    L.pick({ landscape: 50, portrait: 42 }) * u, 0.85, { 'letter-spacing': L.pick({ landscape: 7, portrait: 4 }) * u });
  // engraved water (motif: water = pressed lines, as on the map)
  const water = svg('g', { 'data-name': '2A Engraved water' }, world);
  for (let y = surfY + 8 * u, i = 0; y < botY; y += 15 * u, i++) {
    svg('rect', { x: secX, y, width: secW, height: (i % 6 === 2 ? 2.8 : 2.2) * u, fill: hgt(-0.3) }, water);
  }
  // surface: a raised wavy line
  let d = `M ${secX} ${surfY}`;
  for (let x = 0; x <= secW; x += 10 * u) d += ` L ${secX + x} ${surfY + Math.sin(x / (38 * u)) * 3 * u + Math.sin(x / (13 * u) + 1) * 1.2 * u}`;
  svg('path', { d, fill: 'none', stroke: hgt(0.6), 'stroke-width': 5 * u, 'data-name': '2A Sea surface' }, world);

  // three destroyers — different sizes (depth), variants and a slight list each, so not one stamp repeated
  const ships = [
    { fx: 0.2, L: 380, v: 0, rot: -1.2, lv: 0.75, flip: 1 },
    { fx: 0.56, L: 290, v: 1, rot: 0.8, lv: 0.65, flip: -1 },
    { fx: 0.86, L: 210, v: 2, rot: -0.5, lv: 0.55, flip: 1 },
  ].map((s, i) => {
    const k = L.pick({ landscape: 1, portrait: 0.82 });
    const gx = secX + secW * s.fx, gg = svg('g', { 'data-name': `2A Destroyer ${i + 1}`,
      transform: `translate(${gx} ${surfY + 2 * u}) rotate(${s.rot}) scale(${s.flip} 1)` }, world);
    const sp = shipPaths(s.L * k * u, s.v);
    svg('path', { d: sp.hull, fill: hgt(s.lv) }, gg);
    svg('path', { d: sp.sup + ' ' + sp.funnels, fill: hgt(s.lv + 0.15) }, gg);
    svg('path', { d: sp.mast, fill: hgt(s.lv + 0.1) }, gg);
    return { gx, gg, L: s.L * k * u, flip: s.flip };
  });

  // submarine, pressed deep
  const subY = L.pick({ landscape: sf.y + sf.h * 0.8, portrait: sf.y + sf.h * 0.55 });
  const subX = secX + secW * 0.5;
  const subG = svg('g', { 'data-name': '2A B-59 (pressed in)', transform: `translate(${subX} ${subY}) rotate(1.5)` }, world);
  const spp = subPaths(L.pick({ landscape: 520, portrait: 560 }) * u);
  // a flat paper bed around the hull so the engraving stops short of it (cleaner read)
  svg('path', { d: spp.hull, fill: 'none', stroke: hgt(0), 'stroke-width': 26 * u }, subG);
  svg('path', { d: spp.sail, fill: 'none', stroke: hgt(0), 'stroke-width': 26 * u }, subG);
  svg('path', { d: `${spp.hull} ${spp.rudder}`, fill: hgt(-0.85) }, subG);
  svg('path', { d: `M ${-spp.h * 6} 0 L ${spp.h * 5.5} 0`, stroke: hgt(-1), 'stroke-width': spp.h * 0.9, 'stroke-linecap': 'round', style: `filter: blur(${spp.h * 0.35}px)` }, subG); // rounded hull, pressed deepest along the axis
  svg('path', { d: spp.sail + ' ' + spp.mast, fill: hgt(-0.7) }, subG);
  svg('path', { d: spp.deck, fill: 'none', stroke: hgt(-0.55), 'stroke-width': 3 * u }, subG);

  // depth charges: fall from a ship, burst at depth as a raised ring
  const charges = [
    { ship: 0, drop: 8.95, burst: 9.75, fx: 0.27, depth: 0.55 },
    { ship: 1, drop: 9.35, burst: 10.5, fx: 0.6, depth: 0.7 },
    { ship: 0, drop: 9.9, burst: 11.3, fx: 0.36, depth: 0.82 },
  ].map((c, i) => {
    const x = secX + secW * c.fx, y1 = surfY + (subY - surfY) * c.depth;
    const can = svg('rect', { x: -9 * u, y: -14 * u, width: 18 * u, height: 28 * u, rx: 5 * u, fill: hgt(0.75), 'data-name': `2B Charge ${i + 1}` }, world);
    const ring = svg('circle', { cx: x, cy: y1, r: 10, fill: 'none', stroke: hgt(0.6), 'stroke-width': 10 * u, 'data-name': `2B Pressure ring ${i + 1}` }, world);
    const ring2 = svg('circle', { cx: x, cy: y1, r: 10, fill: 'none', stroke: hgt(0.4), 'stroke-width': 6 * u }, world);
    return { ...c, x, y1, can, ring, ring2 };
  });

  // radio log die — header + blank pressed lines (the silence)
  const log = svg('g', { 'data-name': '2C Radio log (blank)' }, world);
  const lg = L.pick({
    landscape: { x: sf.x + sf.w * 0.68, y: sf.y + sf.h * 0.18, w: sf.w * 0.3, h: sf.h * 0.66 },
    portrait: { x: sf.x + sf.w * 0.04, y: sf.y + sf.h * 0.72, w: sf.w * 0.92, h: sf.h * 0.27 },
  });
  svg('rect', { x: lg.x, y: lg.y, width: lg.w, height: lg.h, fill: hgt(0.18), stroke: hgt(-0.45), 'stroke-width': 3 * u }, log);
  const head = svg('g', {}, log);
  P.text(head, 'MOSCOW', lg.x + lg.w / 2, lg.y + L.pick({ landscape: 92, portrait: 80 }) * u, L.pick({ landscape: 64, portrait: 62 }) * u, 0.85, { 'letter-spacing': 9 * u });
  P.text(log, 'RADIO LOG · INCOMING', lg.x + lg.w / 2, lg.y + L.pick({ landscape: 140, portrait: 124 }) * u, 30 * u, 0.75, { 'letter-spacing': 3 * u });
  const nLines = L.pick({ landscape: 7, portrait: 3 });
  const lines = [];
  for (let i = 0; i < nLines; i++) {
    const y = lg.y + L.pick({ landscape: 200, portrait: 170 }) * u + i * L.pick({ landscape: 58, portrait: 56 }) * u;
    const gl = svg('g', {}, log);
    P.text(gl, String(i + 1).padStart(2, '0'), lg.x + 40 * u, y + 6 * u, 28 * u, 0.7, { 'font-variant-numeric': 'lining-nums tabular-nums' });
    svg('rect', { x: lg.x + 70 * u, y, width: lg.w - 100 * u, height: 3 * u, fill: hgt(-0.55) }, gl);
    lines.push(gl);
  }

  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -22, fade: 0.6 });
  charges.forEach((c, i) => ctx.sfx(i === 1 ? 'boom-slapback-01' : 'boom-distant-01', c.burst - g0 + 0.02, { lu: i === 2 ? -6 : -8 }));
  ctx.sfx('page-turn-01', 0.0, { lu: -17 });
  ctx.sfx('drawer-close-01', 7.9 - g0, { lu: -16 }); // log die (blank form)
  ctx.sfx('drawer-close-01', 10.98 - g0, { lu: -13 }); // MOSCOW

  return {
    update(t) {
      const g = g0 + t;
      S.enter(t);
      cap.style.opacity = press(g, 9.25);
      let jolt = 0;
      for (const c of charges) {
        const sh = ships[c.ship];
        const p = clamp((g - c.drop) / (c.burst - c.drop));
        const vis = g >= c.drop && g < c.burst;
        c.can.style.opacity = vis ? 1 : 0;
        const x0 = sh.gx - sh.flip * sh.L * 0.45;
        const cx = x0 + (c.x - x0) * ease.outQuad(p), cy = surfY + 10 * u + (c.y1 - surfY) * (p * p * 0.6 + p * 0.4);
        c.can.setAttribute('transform', `translate(${cx} ${cy}) rotate(${p * 160})`);
        const b = g - c.burst;
        const rp = clamp(b / 1.1), on = b >= 0 && b < 1.1;
        c.ring.setAttribute('r', (10 + ease.outCubic(rp) * 190 * u).toFixed(1));
        c.ring2.setAttribute('r', (8 + ease.outCubic(clamp(b / 1.4)) * 120 * u).toFixed(1));
        c.ring.style.opacity = on ? (1 - rp) ** 1.4 : 0;
        c.ring2.style.opacity = b >= 0 && b < 1.4 ? (1 - clamp(b / 1.4)) ** 1.6 * 0.9 : 0;
        if (b >= 0) jolt += Math.exp(-b / 0.35) * Math.sin(b * Math.PI * 2 * 2.6); // lamp swings on its cord, decays
      }
      log.style.opacity = press(g, 7.9);
      head.style.opacity = press(g, 10.98);
      lines.forEach((l, i) => { l.style.opacity = press(g, 8.0 + i * 0.05); });

      S.cam(W / 2 + jolt * 3 * u, H / 2 + jolt * 2 * u, 1.0 + glide(t, 0, ctx.duration, 0, 0.035));
      const lx = keyframes(t, [[0, 1.18], [3, 0.7], [ctx.duration, 0.25]], ease.inOutSine) * W + jolt * 60 * u;
      const ly = keyframes(t, [[0, -0.18], [ctx.duration, -0.22]]) * H + jolt * 40 * u;
      S.lamp({ x: lx, y: ly, z: 280 + jolt * 30, power: 1 });
    },
  };
}
