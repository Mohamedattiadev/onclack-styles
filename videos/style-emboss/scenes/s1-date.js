// 1 · HOOK + ORIENT. KNOW: 27 Oct 1962, a Soviet submarine near Cuba. FEEL: hush, curiosity. SEE: the date die, raked.
// 1A (0–3 s)  EST of the sheet: "27 OCTOBER" then "1962" bite in; the lamp drags in low from the left.   truth: VO
// 1B (3–7 s)  the paper slides up under the lamp → relief map (land raised, sea engraved), a small hull pressed
//             into the sea NE of Cuba, then pressed DEEPER on "deep".                                truth: RC (approx. area)
import { glide, clamp, ease, tween, keyframes } from '/onclack-styles/engine/lib/anim.js';
import { makeSheet, hgt, press, P } from '../shared/relief.js';
import { subPaths, mapProjector, ringsToPath } from '../shared/shapes.js';
import { svg } from '/onclack-styles/engine/lib/anim.js';

export default async function (root, ctx) {
  const S = makeSheet(root, ctx, { seed: 3, name: '1 · Cotton sheet' });
  const { W, H, L, world } = S;
  const port = L.portrait, sf = L.safe;
  const g0 = ctx.start;

  // ---- 1A date die (world = frame at home) -------------------------------------------------------
  const dateG = svg('g', { 'data-name': '1A Date die' }, world);
  const plate = svg('rect', { fill: 'none', stroke: hgt(-0.42), 'stroke-width': 3 * S.u, 'data-name': '1A Plate mark' }, dateG);
  const pmX = L.pick({ landscape: sf.x + sf.w * 0.08, portrait: sf.x + sf.w * 0.04 });
  const pmY = L.pick({ landscape: sf.y + sf.h * 0.1, portrait: sf.y + sf.h * 0.1 });
  const pmW = L.pick({ landscape: sf.w * 0.84, portrait: sf.w * 0.92 });
  const pmH = L.pick({ landscape: sf.h * 0.8, portrait: sf.h * 0.62 });
  Object.entries({ x: pmX, y: pmY, width: pmW, height: pmH }).forEach(([k, v]) => plate.setAttribute(k, v));
  const cx = pmX + pmW / 2;
  const lineA = svg('g', {}, dateG), lineB = svg('g', {}, dateG), lineC = svg('g', {}, dateG);
  const oct = port
    ? [P.text(lineA, '27', cx, pmY + pmH * 0.27, 300 * S.u, 0.9, { 'data-name': '1A Day' }),
       P.text(lineB, 'OCTOBER', cx, pmY + pmH * 0.53, 124 * S.u, 0.85, { 'letter-spacing': 6 * S.u, 'data-name': '1A Month' })]
    : [P.text(lineA, '27 OCTOBER', cx, pmY + pmH * 0.42, 190 * S.u, 0.85, { 'letter-spacing': 12 * S.u, 'data-name': '1A Day + month' })];
  P.text(lineC, '1962', cx, pmY + pmH * L.pick({ landscape: 0.84, portrait: 0.88 }), L.pick({ landscape: 330, portrait: 270 }) * S.u, 0.95,
    { 'data-name': '1A Year', 'font-variant-numeric': 'lining-nums' });
  // a pressed rule between the lines (debossed hairline, like a die's border)
  const rule = P.path(dateG, '', -0.5);
  const ry = pmY + pmH * L.pick({ landscape: 0.555, portrait: 0.6 });
  rule.setAttribute('d', `M ${cx - pmW * 0.18} ${ry} L ${cx + pmW * 0.18} ${ry} L ${cx + pmW * 0.18} ${ry + 4 * S.u} L ${cx - pmW * 0.18} ${ry + 4 * S.u} Z`);

  // ---- 1B relief map, one sheet-height below ------------------------------------------------------
  const box = L.pick({
    landscape: { x: sf.x + sf.w * 0.02, y: H + sf.y, w: sf.w * 0.96, h: sf.h },
    portrait: { x: sf.x - sf.w * 0.02, y: H + sf.y + sf.h * 0.12, w: sf.w * 1.04, h: sf.h * 0.8 },
  });
  const clip = svg('clipPath', { id: 'emb1clip' + ctx.format }, S.defs);
  svg('rect', { x: box.x - 40 * S.u, y: box.y - 30 * S.u, width: box.w + 80 * S.u, height: box.h + 60 * S.u, rx: 4 }, clip);
  const mapG = svg('g', { 'data-name': '1B Relief map', 'clip-path': `url(#emb1clip${ctx.format})` }, world);
  const view = L.pick({ landscape: [-87, 18.5, -64, 30.5], portrait: [-85.5, 18.5, -70.5, 30.5] });
  const proj = mapProjector(view, box);
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  // engraved sea: fine pressed horizontal lines (drawn first, land covers them)
  const sea = svg('g', { 'data-name': '1B Engraved sea' }, mapG);
  const step = 15 * S.u;
  for (let y = box.y - 40 * S.u, i = 0; y < box.y + box.h + 40 * S.u; y += step, i++) {
    const wob = (i % 7 === 3) ? 0.6 : 0; // every 7th line slightly heavier: hand-ruled, not machine-even
    svg('rect', { x: box.x - 60 * S.u, y, width: box.w + 120 * S.u, height: (2.2 + wob) * S.u, fill: hgt(-0.32) }, sea);
  }
  const land = svg('g', { 'data-name': '1B Land (raised)' }, mapG);
  for (const f of geo.features) {
    const d = ringsToPath(f.rings, proj, 5);
    if (!d) continue;
    const lv = f.name === 'Cuba' ? 0.62 : 0.42;
    svg('path', { d, fill: hgt(lv), stroke: hgt(lv), 'stroke-width': 3 * S.u, 'stroke-linejoin': 'round', 'data-name': f.name }, land);
  }
  // labels: a flat paper patch (masks the engraving) + raised letters
  const label = (txt, lon, lat, size, lv, nm) => {
    const [lx, ly] = proj([lon, lat]);
    const gg = svg('g', { 'data-name': nm }, mapG);
    const w = txt.length * size * 0.72 + 30 * S.u;
    svg('rect', { x: lx - w / 2, y: ly - size * 0.95, width: w, height: size * 1.3, fill: hgt(0), rx: 6 * S.u }, gg);
    P.text(gg, txt, lx, ly, size, lv, { 'letter-spacing': size * 0.12 });
    return gg;
  };
  const cubaLbl = label('CUBA', -79.2, 20.25, L.pick({ landscape: 64, portrait: 70 }) * S.u, 0.8, '1B Label Cuba');
  label('FLORIDA', ...L.pick({ landscape: [-84.4, 28.8], portrait: [-81.4, 28.4] }), L.pick({ landscape: 40, portrait: 34 }) * S.u, 0.6, '1B Label Florida');
  // approximate area of the submarine (sources differ → a pressed dashed ring, not a pin)
  const subArea = L.pick({ landscape: [-71.5, 25.6], portrait: [-73.4, 25.2] });
  const [sx, sy] = proj(subArea);
  const ringR = L.pick({ landscape: 150, portrait: 140 }) * S.u;
  const ring = svg('circle', { cx: sx, cy: sy, r: ringR, fill: hgt(0), stroke: hgt(-0.6), 'stroke-width': 4 * S.u,
    'stroke-dasharray': `${16 * S.u} ${12 * S.u}`, 'data-name': '1B Approx. area ring' }, mapG);
  const subG = svg('g', { 'data-name': '1B Submarine (pressed in)', transform: `translate(${sx} ${sy})` }, mapG);
  const sp = subPaths(L.pick({ landscape: 250, portrait: 230 }) * S.u);
  const subParts = [sp.hull, sp.sail, sp.rudder].map((d) => svg('path', { d, fill: hgt(-0.5) }, subG));
  const approx = label('APPROX. AREA', ...(L.pick({ landscape: [-71.5, 22.75], portrait: [-73.4, 22.5] })), L.pick({ landscape: 40, portrait: 30 }) * S.u, 0.8, '1B Label approx.');

  // ---- sound ------------------------------------------------------------------------------------
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -24, fade: 1.2 }); // the sea, heard through the hull — low
  ctx.sfx('letterpress-manual-01', 0.5 - 0.02, { lu: -9 });   // "27 OCTOBER" bite
  ctx.sfx('letterpress-manual-01', 2.02 - 0.02, { lu: -8 });  // "1962"
  ctx.sfx('page-turn-01', 2.95, { lu: -16 });                  // the sheet slides up under the lamp
  ctx.sfx('drawer-close-01', 4.28, { lu: -15 });               // small hull die
  ctx.sfx('drawer-close-01', 5.40, { lu: -12 });               // pressed deeper

  return {
    update(t) {
      const g = g0 + t;
      // presses
      const pA = press(g, 0.5), pB = press(g, 2.02);
      lineA.style.opacity = pA; lineB.style.opacity = press(g, port ? 0.62 : 0.5); lineC.style.opacity = pB;
      plate.style.opacity = clamp(pA * 1.2); rule.style.opacity = pB;
      land.style.opacity = 1;
      dateG.style.display = t > 4.2 ? 'none' : '';      // off the top of the frame by then
      mapG.style.display = t < 2.85 ? 'none' : '';      // not yet slid into view
      const pSub = press(g, 4.3);
      const deep = press(g, 5.42);
      subParts.forEach((p) => p.setAttribute('fill', hgt(-0.25 - 0.3 * pSub - 0.38 * deep)));
      subG.style.opacity = clamp(pSub * 1.4);
      ring.style.opacity = press(g, 3.8) * 0.95;
      approx.style.opacity = press(g, 4.0);
      cubaLbl.style.opacity = press(g, 6.45);

      // camera: hold on the die (slow creep), then the sheet slides up to the map
      const slide = glide(t, 2.9, 4.1, 0, 1);
      const cy = H / 2 + H * slide;
      const s = (1 + 0.012 * clamp(t / 2.9)) * (1 - 0.0) + glide(t, 4.1, 7.6, 0, 0.05);
      const mapC = L.pick({ landscape: proj([-76, 24.6])[0], portrait: W / 2 });
      const cx2 = W / 2 + (mapC - W / 2) * glide(t, 4.1, 7.6, 0, 0.35);
      S.cam(cx2, cy + glide(t, 4.1, 7.6, 0, (sy - H * 1.5) * 0.25), s);

      // lamp: drags in low from the left (1A), then swings to upper right and rakes the map
      const lx = keyframes(t, [[0, -0.5], [2.6, -0.14], [3.6, 0.45], [7.6, 1.16]], ease.inOutSine) * W;
      const ly = keyframes(t, [[0, 0.7], [2.6, 0.45], [3.6, -0.22], [7.6, -0.04]], ease.inOutSine) * H;
      const lz = keyframes(t, [[0, 210], [2.6, 260], [3.6, 330], [7.6, 300]]);
      S.lamp({ x: lx, y: ly, z: lz, power: clamp(0.55 + t / 1.2, 0, 1) });
    },
  };
}
