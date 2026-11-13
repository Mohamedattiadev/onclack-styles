// Panel 2 — THE SECTION (rising, intensity 4, darkest panel)
// intent: KNOW US ships above drop practice depth charges; Moscow silent · FEEL dread · SEE the sea cut as strata of
//         ever darker veneers, the ebony hull at the bottom, and each charge leaving an inlaid "burst fan" above it.
// truth: section = RC (simplified Project 641 hull, generic destroyers); bursts = VO (inlay fans, not a record of
//        positions or number of charges). Moscow line = hedge-free summary of the voice.
// camera: opens close on the hull (match from the map marker), pulls back on "Above it" to reveal the ships.
import { svg, rand, progress, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { F, ez, panel, piece, plate, wordT, poly, rrect, stringing, JOINT } from '../shared/inlay.js';

export default async function (root, ctx) {
  const P = await panel(root, ctx, { id: 's2' });
  const { L, W, H } = P;

  const tAbove = wordT(ctx, 'Above', 0, 0.35) - 2 * F;
  const tShips = wordT(ctx, 'ships', 0, 1.42) - 2 * F;
  const tDrop = wordT(ctx, 'drop', 0, 1.74) - 2 * F;
  const tCharges = wordT(ctx, 'charges', 0, 2.84) - 2 * F;
  const tMoscow = wordT(ctx, 'Moscow', 0, 3.74) - 2 * F;
  const tSilent = wordT(ctx, 'silent', 0, 4.72) - 2 * F;

  const Y = f => P.inner + (H - 2 * P.inner) * f;
  const LY = L.pick({ landscape: { sky: 0.22, b: [0.22, 0.4, 0.56, 0.72, 1.08] }, portrait: { sky: 0.2, b: [0.2, 0.36, 0.52, 0.68, 1.08] } });
  const ov = L.px(260);

  // ---- strata (wavy knife cuts between leaves; grain runs with the water)
  const wave = (y, seed, amp = L.px(9)) => {
    const n = 12, pts = [];
    for (let i = 0; i <= n; i++) { const x = -ov + ((W + 2 * ov) * i) / n; pts.push([x, y + Math.sin(i * 1.7 + seed) * amp + (rand(seed + i) - 0.5) * amp]); }
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` Q${x0 + (x1 - x0) / 2} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`; }
    return { d: d + ` L${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`, pts };
  };
  const strata = svg('g', { 'data-name': 'Sea strata' }, P.world);
  piece(P, strata, { d: `M${-ov} ${-ov}H${W + ov}V${Y(LY.sky) + L.px(20)}H${-ov}Z`, species: 'holly', angle: 0, seed: 2, name: 'Sky (holly)' });
  const bands = [['hare', 0.0], ['hare', 0.16], ['hareDk', 0.06], ['hareDk', 0.4]];
  for (let i = 0; i < 4; i++) {
    const top = wave(Y(LY.b[i]), 3 + i * 2.1, i === 0 ? L.px(5) : L.px(10));
    const d = top.d + ` L${W + ov} ${H + ov} L${-ov} ${H + ov} Z`;
    const pc = piece(P, strata, { d, species: bands[i][0], angle: (rand(i + 9) - 0.5) * 4, seed: 30 + i, name: `Water stratum ${i + 1} (${bands[i][0]})` });
    if (bands[i][1]) svg('path', { d, fill: '#1A120C', opacity: bands[i][1] }, strata);
  }
  // surface line: holly + ebony stringing
  const surf = wave(Y(LY.sky), 3, L.px(5));
  svg('path', { d: surf.d, fill: 'none', stroke: '#16100C', 'stroke-width': L.px(6) }, strata);
  svg('path', { d: surf.d, fill: 'none', stroke: P.pat('holly', 0, 4), 'stroke-width': L.px(3) }, strata);

  // ---- the sub (deep)
  const SB = L.pick({ landscape: { x: W * 0.4, y: Y(0.82), l: W * 0.4 }, portrait: { x: W * 0.53, y: Y(0.74), l: W * 0.66 } });
  const subG = svg('g', { 'data-name': 'B-59 hull (section)' }, P.world);
  const subInner = svg('g', {}, subG);
  {
    const { x, y, l } = SB, h = l * 0.11;
    const hull = `M${x - l / 2} ${y + h * 0.05} C${x - l / 2} ${y - h * 0.45} ${x - l * 0.38} ${y - h / 2} ${x - l * 0.3} ${y - h / 2} L${x + l * 0.36} ${y - h / 2} C${x + l * 0.47} ${y - h / 2} ${x + l / 2} ${y - h * 0.2} ${x + l / 2} ${y + h * 0.08} C${x + l / 2} ${y + h * 0.4} ${x + l * 0.44} ${y + h / 2} ${x + l * 0.34} ${y + h / 2} L${x - l * 0.34} ${y + h / 2} C${x - l * 0.44} ${y + h / 2} ${x - l / 2} ${y + h * 0.3} ${x - l / 2} ${y + h * 0.05} Z`;
    const sail = `M${x + l * 0.02} ${y - h / 2 + 1} L${x + l * 0.05} ${y - h * 1.35} L${x + l * 0.19} ${y - h * 1.35} C${x + l * 0.22} ${y - h * 1.35} ${x + l * 0.23} ${y - h * 1.1} ${x + l * 0.23} ${y - h / 2 + 1} Z`;
    const casing = `M${x - l * 0.33} ${y - h / 2} L${x + l * 0.4} ${y - h / 2} L${x + l * 0.38} ${y - h * 0.32} L${x - l * 0.34} ${y - h * 0.32} Z`;
    const rudder = `M${x - l / 2 + l * 0.01} ${y - h * 0.1} L${x - l * 0.56} ${y - h * 0.5} L${x - l * 0.565} ${y + h * 0.45} L${x - l / 2 + l * 0.01} ${y + h * 0.25} Z`;
    const plane = `M${x + l * 0.36} ${y + h * 0.05} L${x + l * 0.45} ${y + h * 0.12} L${x + l * 0.36} ${y + h * 0.2} Z`;
    piece(P, subInner, { d: rudder, species: 'ebony', angle: 90, seed: 61, name: 'Rudder' });
    piece(P, subInner, { d: hull, species: 'ebony', angle: 0, seed: 62, name: 'Hull (ebony, grain bow→stern)', shade: 'b', shadeAmt: 0.9 });
    piece(P, subInner, { d: casing, species: 'walnut', angle: 0, seed: 63, name: 'Deck casing (walnut)' });
    piece(P, subInner, { d: sail, species: 'bog', angle: -90, seed: 64, name: 'Sail (bog oak, grain upright)', shade: 'r', shadeAmt: 0.7 });
    piece(P, subInner, { d: plane, species: 'ebony', angle: 0, seed: 65, name: 'Bow plane' });
  }

  // ---- three destroyers (grey harewood hulls = naval grey), bow to the LEFT: they move R→L toward the sub
  const SH = L.pick({ landscape: { xs: [0.56, 0.72, 0.88], l: W * 0.15 }, portrait: { xs: [0.2, 0.5, 0.8], l: W * 0.25 } });
  const sy = surf.pts ? Y(LY.sky) : 0;
  const ships = SH.xs.map((fx, i) => {
    const g = svg('g', { 'data-name': `US destroyer ${i + 1}` }, P.world);
    const l = SH.l * (1 - i * 0.04), x = W * fx, y = sy + L.px(4), h = l * 0.1;
    const hull = `M${x - l / 2} ${y - h * 1.15} L${x + l / 2} ${y - h * 0.75} L${x + l * 0.47} ${y + h * 0.15} L${x - l * 0.4} ${y + h * 0.15} Z`;
    const sup = `M${x - l * 0.22} ${y - h * 0.95} L${x - l * 0.22} ${y - h * 1.75} L${x - l * 0.08} ${y - h * 1.75} L${x - l * 0.08} ${y - h * 1.35} L${x + l * 0.22} ${y - h * 1.35} L${x + l * 0.22} ${y - h * 0.85} Z`;
    const stack = `M${x + l * 0.02} ${y - h * 1.35} L${x + l * 0.04} ${y - h * 2.3} L${x + l * 0.11} ${y - h * 2.3} L${x + l * 0.12} ${y - h * 1.35} Z`;
    const mast = `M${x - l * 0.16} ${y - h * 1.75} L${x - l * 0.15} ${y - h * 3.4} L${x - l * 0.135} ${y - h * 3.4} L${x - l * 0.125} ${y - h * 1.75} Z`;
    const yard = `M${x - l * 0.2} ${y - h * 2.9} H${x - l * 0.08} V${y - h * 2.8} H${x - l * 0.2} Z`;
    const at = tShips + i * 3 * F;
    const o = { at, dur: 0.5, dist: L.px(220), dir: 180 };
    const ps = [
      piece(P, g, { d: mast, species: 'ebony', angle: 90, seed: 70 + i, name: 'Mast', ...o }),
      piece(P, g, { d: yard, species: 'ebony', angle: 0, seed: 71 + i, name: 'Yard', ...o }),
      piece(P, g, { d: stack, species: 'ebony', angle: 90, seed: 72 + i, name: 'Funnel', ...o }),
      piece(P, g, { d: sup, species: 'hare', angle: 90, seed: 73 + i, name: 'Superstructure (harewood)', shade: 'r', shadeAmt: 0.5, ...o }),
      piece(P, g, { d: hull, species: 'hareDk', angle: 2, seed: 74 + i, name: 'Hull (dark harewood)', shade: 'b', shadeAmt: 0.6, ...o }),
    ];
    return { g, x, y, ps };
  });

  // ---- depth charges: pear barrels sink, then an inlaid burst fan stays where each one went off
  const CH = L.pick({ landscape: { depth: [0.62, 0.58, 0.64] }, portrait: { depth: [0.55, 0.5, 0.57] } });
  const charges = ships.map((s, i) => {
    const t0 = tDrop + i * 0.32, tB = tCharges + i * 0.62;
    const bx = s.x - L.px(10) - SB.l * 0.0, by0 = s.y + L.px(10), by1 = Y(CH.depth[i]);
    const g = svg('g', { 'data-name': `Depth charge ${i + 1}` }, P.world);
    const bw = L.px(22), bh = L.px(30);
    const barrel = svg('g', {}, g);
    piece(P, barrel, { d: rrect(-bw / 2, -bh / 2, bw, bh, L.px(5)), species: 'pear', angle: 90, seed: 80 + i, name: 'Barrel (pear)' });
    svg('path', { d: `M${-bw / 2} ${-bh * 0.18}H${bw / 2}M${-bw / 2} ${bh * 0.18}H${bw / 2}`, stroke: JOINT, 'stroke-width': L.px(2) }, barrel);
    // burst fan: 14 wedges, holly / pale harewood alternating (the classic inlay fan, here = a shock)
    const fan = svg('g', { 'data-name': 'Burst fan (inlay)' }, g);
    const R = L.px(L.pick({ landscape: 92, portrait: 100 })), n = 14;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, r = R * (k % 2 ? 0.78 : 1);
      piece(P, fan, { d: poly([[0, 0], [Math.cos(a0) * r, Math.sin(a0) * r], [Math.cos(a1) * r, Math.sin(a1) * r]]), species: k % 2 ? 'hare' : 'holly', angle: ((a0 + a1) / 2) * 57.3, seed: 90 + k + i * 20, name: `Fan wedge ${k}` });
    }
    piece(P, fan, { d: `M${-R * 0.16} 0a${R * 0.16} ${R * 0.16} 0 1 0 ${R * 0.32} 0a${R * 0.16} ${R * 0.16} 0 1 0 ${-R * 0.32} 0Z`, species: 'satin', angle: 0, seed: 99 + i, name: 'Fan centre' });
    ctx.sfx('boom-distant-01', tB + F, { lu: i === 0 ? -6 : -9 });
    return { g, barrel, fan, t0, tB, bx, by0, by1 };
  });

  // ---- Moscow cartouche (sky, screen space)
  const C = L.pick({
    landscape: { x: P.inner + L.px(40), y: P.inner + L.px(26), w: L.px(600), h: L.px(196), s1: 66, s2: 84 },
    portrait: { x: P.inner + L.px(30), y: L.safe.y + L.px(10), w: L.px(700), h: L.px(206), s1: 70, s2: 90 },
  });
  const cart = svg('g', { 'data-name': 'Moscow cartouche' }, P.screen);
  const cartP = piece(P, cart, { d: rrect(C.x, C.y, C.w, C.h, L.px(18)), species: 'walnut', angle: 0, seed: 14, name: 'Cartouche (walnut)', shade: 'br', shadeAmt: 0.3, at: tMoscow - 0.12, dur: 0.4, dist: L.px(60), dir: 0 });
  const str = stringing(P, cart, rrect(C.x + L.px(12), C.y + L.px(12), C.w - L.px(24), C.h - L.px(24), L.px(10)), { w: 3, name: 'Cartouche stringing', at: tMoscow + 0.3, dur: 0.5 });
  const mw = piece(P, cart, { text: { str: 'MOSCOW:', x: C.x + L.px(38), y: C.y + C.h * 0.44, size: L.px(C.s1), ls: '0.08em' }, species: 'holly', seed: 24, name: 'Text · MOSCOW', at: tMoscow + 0.05, dur: 0.34, dist: L.px(50), dir: 0 });
  const sw = piece(P, cart, { text: { str: 'SILENT FOR DAYS', x: C.x + L.px(38), y: C.y + C.h * 0.86, size: L.px(C.s2), ls: '0.03em' }, species: 'holly', seed: 25, name: 'Text · SILENT FOR DAYS', at: tSilent, dur: 0.4, dist: L.px(60), dir: 0 });

  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -15, fade: 0.8 });
  ctx.sfx('inlay-seat', tShips + 2 * F, { lu: -12 });
  ctx.sfx('door-creak-01', tSilent + 0.35, { lu: -17 }); // hull creak in the quiet after the charges
  ctx.sfx('inlay-tap', tSilent + 2 * F, { lu: -15 });

  const allShips = ships.flatMap(s => s.ps);
  return {
    update(t) {
      P.wipe(t, 0, 0.45);
      // camera: close on the hull → pull back to the whole section on "Above it"
      const k = ez.camera(progress(t, tAbove - 0.1, tShips + 0.3));
      const z = (L.pick({ landscape: 1.7, portrait: 1.45 }) + (1 - L.pick({ landscape: 1.7, portrait: 1.45 })) * k) * (1 + 0.003 * t);
      const fx = SB.x, fy = SB.y - SB.l * 0.04;
      const ax = W / 2 + (fx - W / 2) * k, ay = H / 2 + (fy - H / 2) * k;
      P.world.setAttribute('transform', `translate(${(ax - fx * z).toFixed(2)} ${(ay - fy * z).toFixed(2)}) scale(${z.toFixed(5)})`);

      // ships steam slowly left after they arrive (subject moves → camera holds)
      ships.forEach((s, i) => { const dx = -Math.max(0, t - tShips) * L.px(7 + i * 1.5); s.g.setAttribute('transform', `translate(${dx.toFixed(2)} 0)`); });
      allShips.forEach(p => p.update(t));

      // charges
      let shakeAmp = 0;
      charges.forEach((c, i) => {
        const sink = ez.move(progress(t, c.t0, c.tB));
        const drift = -Math.max(0, c.t0 - tShips) * L.px(7 + i * 1.5);
        const x = c.bx + drift, y = c.by0 + (c.by1 - c.by0) * sink;
        c.g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
        c.barrel.setAttribute('opacity', t >= c.t0 && t < c.tB ? 1 : 0);
        c.barrel.setAttribute('transform', `rotate(${(Math.sin((t - c.t0) * 5 + i) * 9).toFixed(2)})`);
        const fb = progress(t, c.tB, c.tB + 0.32);
        c.fan.setAttribute('opacity', t >= c.tB ? Math.min(1, (t - c.tB) / (2 * F)) : 0);
        c.fan.setAttribute('transform', `scale(${(0.25 + 0.75 * ez.enter(fb)).toFixed(4)}) rotate(${(i * 9).toFixed(1)})`);
        const dt = t - c.tB;
        if (dt > 0 && dt < 0.6) shakeAmp = Math.max(shakeAmp, (1 - dt / 0.6) * L.px(i === 0 ? 7 : 5));
      });
      const shx = noise1(t * 9, 3) * shakeAmp, shy = noise1(t * 9, 7) * shakeAmp * 0.6;
      subG.setAttribute('transform', `translate(${shx.toFixed(2)} ${shy.toFixed(2)})`);

      cartP.update(t); str.update(t); mw.update(t); sw.update(t);
      P.sheenAt(t, tSilent + 0.5, 1.4);
    },
  };
}
