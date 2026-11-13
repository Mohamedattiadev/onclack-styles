// Panel 1 — THE MAP (hook/context, intensity 3)
// intent: KNOW 27 Oct 1962, a Soviet sub near Cuba · FEEL curiosity · SEE a map-table inlay: harewood sea, light-wood
//         islands sliding home along their grain, and one dark EMPTY window shaped like Cuba that is filled on "Cuba".
// truth: coastline EV-derived (Natural Earth, public domain) but re-made in wood = RC; sub position RC ("position approx.").
// sound: sea bed (low), dry taps on the date words, a heavier seat for the sub and for Cuba.
import { svg, rand, progress } from '/onclack-styles/engine/lib/anim.js';
import { F, ez, panel, piece, plate, ground, stringing, wordT, poly, rrect, JOINT } from '../shared/inlay.js';

export default async function (root, ctx) {
  const P = await panel(root, ctx, { id: 's1' });
  const { L, W, H } = P;
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();

  // ---- voice (local)
  const tOct = wordT(ctx, 'October', 0, 0.58) - 2 * F;
  const t27 = wordT(ctx, 'twenty-seventh', 0, 1.1) - 2 * F;
  const t19 = wordT(ctx, 'nineteen', 0, 2.07) - 2 * F;
  const tSub = wordT(ctx, 'submarine', 0, 4.3) - 2 * F;
  const tDeep = wordT(ctx, 'deep', 0, 5.42) - 2 * F;
  const tCuba = wordT(ctx, 'Cuba', 0, 6.52) - 2 * F;

  // ---- projection (equirectangular, cos 23°)
  const V = L.pick({ landscape: { lon: -78.6, lat: 23.0, span: 28 }, portrait: { lon: -78.4, lat: 23.6, span: 14.5 } });
  const kc = Math.cos((23 * Math.PI) / 180), k = W / (V.span * kc);
  const proj = (lon, lat) => [W / 2 + (lon - V.lon) * k * kc, H / 2 - (lat - V.lat) * k];
  const SUB = [-75.6, 23.2];
  const subXY = proj(...SUB);

  // ---- world: sea ground (harewood, grain with the swell, book-matched leaves)
  const ov = L.px(220);
  ground(P, P.world, { species: 'hare', angle: 0, leaves: L.pick({ landscape: 4, portrait: 3 }), vertical: false, x: -ov, y: -ov, w: W + 2 * ov, h: H + 2 * ov, seed: 11, name: 'Sea (harewood leaves)' });

  // graticule as inlaid stringing (lat 20/25/30, lon −85…−70)
  const lines = [];
  for (const lat of [20, 25]) { const [x0, y] = proj(-100, lat), [x1] = proj(-55, lat); lines.push(stringing(P, P.world, `M${x0} ${y}H${x1}`, { w: 1.8, name: `Stringing ${lat}°N` })); }
  for (const lon of L.pick({ landscape: [-85, -80, -75, -70], portrait: [-80, -75] })) { const [x, y0] = proj(lon, 40), [, y1] = proj(lon, 5); lines.push(stringing(P, P.world, `M${x} ${y0}V${y1}`, { w: 1.8, name: `Stringing ${-lon}°W` })); }

  // compass rose (classic inlay star: each point split light/dark)
  {
    const [cx, cy] = proj(...L.pick({ landscape: [-88.2, 25.6], portrait: [-82.4, 17.4] }));
    const R = L.px(L.pick({ landscape: 92, portrait: 84 }));
    const cg = svg('g', { 'data-name': 'Compass star' }, P.world);
    piece(P, cg, { d: `M${cx - R * 0.5} ${cy}a${R * 0.5} ${R * 0.5} 0 1 0 ${R} 0a${R * 0.5} ${R * 0.5} 0 1 0 ${-R} 0Z`, species: 'walnut', angle: 30, seed: 3, name: 'Compass disc' });
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2, r = i % 2 ? R * 0.62 : R, w = i % 2 ? R * 0.12 : R * 0.17;
      const tip = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      const l = [cx + Math.cos(a - Math.PI / 2) * w, cy + Math.sin(a - Math.PI / 2) * w], rr = [cx + Math.cos(a + Math.PI / 2) * w, cy + Math.sin(a + Math.PI / 2) * w];
      piece(P, cg, { d: poly([[cx, cy], l, tip]), species: 'holly', angle: (a * 180) / Math.PI, seed: 20 + i, name: `Star point ${i} light` });
      piece(P, cg, { d: poly([[cx, cy], tip, rr]), species: i % 2 ? 'pear' : 'ebony', angle: (a * 180) / Math.PI, seed: 40 + i, name: `Star point ${i} dark` });
    }
    // N mark
    const nT = svg('text', { x: cx, y: cy - R - L.px(10), 'text-anchor': 'middle', 'font-family': "'Sofia Sans Extra Condensed', sans-serif", 'font-weight': 800, 'font-size': L.px(34), fill: P.pat('holly', 0, 5), stroke: JOINT, 'stroke-width': P.jw, 'data-name': 'Compass N' }, cg);
    nT.textContent = 'N';
  }

  // ---- land pieces (one piece per country; grain along each landmass)
  const LAND = {
    Mexico: ['pear', 62, 0.2], 'United States of America': ['maple', 78, 0.42],
    Belize: ['maple', 80, 0.62], Guatemala: ['pear', 20, 0.66], Honduras: ['pear', 5, 0.74], Nicaragua: ['maple', 70, 0.8], 'El Salvador': ['holly', 0, 0.84], 'Costa Rica': ['pear', 40, 0.86],
    Haiti: ['pear', 4, 0.98], 'Dominican Rep.': ['maple', -6, 1.12], Jamaica: ['maple', 8, 1.3], Bahamas: ['holly', 47, 1.48],
    'Puerto Rico': ['pear', 0, 1.62], 'Cayman Is.': ['holly', 0, 1.7], 'Turks and Caicos Is.': ['holly', 0, 1.74], Colombia: ['pear', 30, 1.0], Venezuela: ['maple', 0, 1.05],
  };
  const pathFor = f => {
    let d = '';
    for (const r of f.rings) {
      const pts = r.map(([lo, la]) => proj(lo, la));
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 < -ov || x0 > W + ov || y1 < -ov || y0 > H + ov) continue;
      if ((x1 - x0) * (y1 - y0) < L.px(7) ** 2) continue; // tiny islets: too small to cut
      d += poly(pts);
    }
    return d;
  };
  const land = svg('g', { 'data-name': 'Land pieces' }, P.world);
  const pieces = [];
  for (const f of geo.features) {
    if (f.name === 'Cuba') continue;
    const spec = LAND[f.name] ?? ['holly', 0, 1.8];
    const d = pathFor(f);
    if (!d) continue;
    pieces.push(piece(P, land, { d, species: spec[0], angle: spec[1], seed: f.name.length * 3.3, name: `Land · ${f.name}`, at: spec[2] + 0.35, dur: 0.4, dist: L.px(70), shade: 'br', shadeAmt: 0.35, win: false }));
  }
  // the deep (darker harewood patch) and the sub
  const [sx, sy] = subXY;
  const deep = piece(P, P.world, { d: `M${sx - L.px(150)} ${sy}a${L.px(150)} ${L.px(70)} 0 1 0 ${L.px(300)} 0a${L.px(150)} ${L.px(70)} 0 1 0 ${-L.px(300)} 0Z`, species: 'hareDk', angle: 0, seed: 7, name: 'Deep water patch', at: tDeep, dur: 0.5, dist: L.px(40), win: true, winOpacity: 0.4 });
  const sl = L.px(118), sh = L.px(22);
  const subD = `M${sx - sl / 2} ${sy} Q${sx - sl / 2} ${sy - sh / 2} ${sx - sl * 0.3} ${sy - sh / 2} L${sx - sl * 0.08} ${sy - sh / 2} L${sx - sl * 0.04} ${sy - sh * 1.25} L${sx + sl * 0.14} ${sy - sh * 1.25} L${sx + sl * 0.18} ${sy - sh / 2} L${sx + sl * 0.36} ${sy - sh / 2} Q${sx + sl / 2} ${sy - sh / 2} ${sx + sl / 2} ${sy} Q${sx + sl / 2} ${sy + sh / 2} ${sx + sl * 0.36} ${sy + sh / 2} L${sx - sl * 0.3} ${sy + sh / 2} Q${sx - sl / 2} ${sy + sh / 2} ${sx - sl / 2} ${sy} Z`;
  const sub = piece(P, P.world, { d: subD, species: 'ebony', angle: 0, seed: 9, name: 'B-59 (ebony inlay)', at: tSub, dur: 0.45, dist: L.px(110), dir: 180, shade: 'b', shadeAmt: 0.5, score: 0.35 });

  // Cuba: knifed early, the window stays dark (the open question) until "Cuba"
  const cuba = geo.features.find(f => f.name === 'Cuba');
  const cubaP = piece(P, land, { d: pathFor(cuba), species: 'satin', angle: 10, seed: 4, name: 'Land · Cuba (hero)', at: tCuba, dur: 0.5, dist: L.px(150), dir: 10, shade: 'br', shadeAmt: 0.35, score: 1.0, scoreAt: 1.25 });

  // ---- screen space: date cartouche (walnut + holly stringing, holly letters)
  const C = L.pick({
    landscape: { w: L.px(560), h: L.px(300), x: W - P.inner - L.px(40) - L.px(560), y: P.inner + L.px(36), s1: 92, s2: 150 },
    portrait: { w: L.px(640), h: L.px(310), x: (W - L.px(640)) / 2 - L.px(40), y: L.safe.y + L.px(40), s1: 100, s2: 160 },
  });
  const cart = svg('g', { 'data-name': 'Date cartouche' }, P.screen);
  piece(P, cart, { d: rrect(C.x, C.y, C.w, C.h, L.px(22)), species: 'walnut', angle: 0, seed: 13, name: 'Cartouche (walnut)', shade: 'br', shadeAmt: 0.3 });
  const inset = L.px(14);
  stringing(P, cart, rrect(C.x + inset, C.y + inset, C.w - 2 * inset, C.h - 2 * inset, L.px(12)), { w: 3, name: 'Cartouche stringing' }).update(1);
  const line1Y = C.y + C.h * 0.4, line2Y = C.y + C.h * 0.86;
  const oct = piece(P, cart, { text: { str: 'OCTOBER', x: C.x + L.px(44), y: line1Y, size: L.px(C.s1), ls: '0.06em' }, species: 'holly', angle: 0, seed: 21, name: 'Date · OCTOBER', at: tOct, dur: 0.36, dist: L.px(60), dir: 0 });
  const d27 = piece(P, cart, { text: { str: '27', x: C.x + C.w - L.px(44), y: line1Y, size: L.px(C.s1), anchor: 'end' }, species: 'holly', angle: 0, seed: 22, name: 'Date · 27', at: t27, dur: 0.36, dist: L.px(60), dir: 180 });
  const yr = piece(P, cart, { text: { str: '1962', x: C.x + C.w / 2, y: line2Y, size: L.px(C.s2), anchor: 'middle', ls: '0.08em' }, species: 'satin', angle: 0, seed: 23, name: 'Date · 1962', at: t19, dur: 0.4, dist: L.px(70), dir: -90 });

  // sub label (brass), screen space, follows the sub
  const lab = plate(P, P.screen, { x: 0, y: 0, text: 'B-59 · position approx.', size: L.px(L.pick({ landscape: 28, portrait: 30 })), name: 'Label B-59 (brass)', at: tSub + 0.3, dist: L.px(50) });
  const labG = svg('g', {}, P.screen); labG.appendChild(lab.g);

  // ---- sound
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -17, fade: 0.6 });
  ctx.sfx('inlay-tap', tOct + 2 * F, { lu: -14 });
  ctx.sfx('inlay-tap', t19 + 2 * F, { lu: -13 });
  ctx.sfx('inlay-seat', tSub + 2 * F, { lu: -11 });
  ctx.sfx('inlay-seat', tCuba + 2 * F, { lu: -9 });

  const all = [...lines, ...pieces, deep, sub, cubaP, oct, d27, yr];
  return {
    update(t) {
      // camera: steady creep, then a slow push toward the sub after "submarine"
      const fz = ez.camera(progress(t, tSub + 0.2, tCuba + 0.4));
      const z = 1 + 0.004 * t + 0.16 * fz;
      const tgx = sx + (W / 2 + (sx - W / 2) * 0.35 - sx) * fz, tgy = sy + (H / 2 + (sy - H / 2) * 0.35 - sy) * fz; // sub drifts toward centre
      const camX = tgx - sx * z, camY = tgy - sy * z;
      P.world.setAttribute('transform', `translate(${camX.toFixed(2)} ${camY.toFixed(2)}) scale(${z.toFixed(5)})`);
      all.forEach(p => p.update(t));
      // label next to the sub (screen space, scale 1)
      const lx = sx * z + camX, ly = sy * z + camY;
      const off = L.pick({ landscape: [L.px(90), -L.px(110)], portrait: [-lab.w / 2 - L.px(0), L.px(70)] });
      labG.setAttribute('transform', `translate(${(lx + off[0]).toFixed(1)} ${(ly + off[1]).toFixed(1)})`);
      lab.update(t);
      P.sheenAt(t, tCuba + 0.05, 1.4);
    },
  };
}
