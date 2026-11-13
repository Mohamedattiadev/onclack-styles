// 1 · EST/MAP — "October 27th, 1962. A Soviet submarine hides deep in the sea near Cuba."
// Cobalt field, paper land. The stage opens (two ink flats part), date plate on a rail, the sub slides in
// on its groove and sinks into the blue (haze = depth). Camera: slow push toward the sub.
import { svg, clamp, progress, noise1, creep } from '/onclack-styles/engine/lib/anim.js';
import { C, mix, stage, plate, railIn, beat, span, tok, wordAt, shape, SUB } from '../shared/kit.js';

export default async function (root, ctx) {
  const L = ctx.layout, W = ctx.width, H = ctx.height;
  const map = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const S = stage(root, ctx, { field: C.cobalt, name: '1 Stage (cobalt)', wipe: false });

  // Map framing: which map units fill the frame (portrait crops tighter around Cuba + the sub).
  const view = L.pick({ landscape: { x0: 115, x1: 865, cy: 318 }, portrait: { x0: 280, x1: 815, cy: 340 } });
  const k = W / (view.x1 - view.x0);
  const toScreen = (mx, my) => [(mx - view.x0) * k, H / 2 + (my - view.cy) * k];
  const mapT = `translate(${-view.x0 * k} ${H / 2 - view.cy * k}) scale(${k})`;

  const farCut = S.cut('far', { rough: L.px(2.2), shadow: L.px(4), alpha: 0.22, seed: 3 });
  const cubaCut = S.cut('cuba', { rough: L.px(2.6), shadow: L.px(7), alpha: 0.3, seed: 5 });
  const subCut = S.cut('sub', { rough: L.px(1.6), shadow: L.px(9), alpha: 0.32, seed: 9 });
  const flatCut = S.cut('flat', { rough: L.px(4), shadow: L.px(12), alpha: 0.35, seed: 2 });

  // Plane 0.85: the rest of the land, hazed toward the field (aerial perspective).
  const pFar = S.plane(0.85, '1A Land, far (Florida, Bahamas, Hispaniola)');
  const gf = svg('g', { filter: farCut }, pFar);
  svg('path', { d: map.land, fill: mix(C.paper, C.cobalt, 0.58), transform: mapT }, gf);
  // Plane 1: Cuba, full paper — the place.
  const pCuba = S.plane(1, '1A Cuba (paper cut-out)');
  const gc = svg('g', { filter: cubaCut }, pCuba);
  svg('path', { d: map.cuba, fill: C.paper, transform: mapT }, gc);
  // Plane 1.12: the submarine marker (symbolic size, position approximate).
  const pSub = S.plane(1.12, '1B Submarine plane');
  const [ax, sy] = toScreen(673, 306); // B-59, approximate position on 27 Oct (style test)
  const subW = L.pick({ landscape: 330, portrait: 270 }) * L.unit;
  const sx = ax - subW / 2;
  const subHolder = svg('g', {}, pSub);
  const subShape = shape(subHolder, SUB, { fill: C.paper, filter: subCut, name: '1B Submarine B-59 (silhouette after US Navy photo)', w: subW });
  const subPath = subShape.querySelector('path');
  // Plane 1.5: the stage flats (theatre wings) — they part at the start and stay as the near frame.
  const pNear = S.plane(1.5, '1 Stage flats (near)');
  const flats = [-1, 1].map((side, i) => {
    const g = svg('g', { filter: flatCut, 'data-name': side < 0 ? 'Stage flat left' : 'Stage flat right' }, pNear);
    const n = 22, fw = W * 0.62, pts = [];
    for (let j = 0; j <= n; j++) pts.push([(Math.sin(j * 2.3 + i) * 0.5 + Math.sin(j * 5.1 + i * 3) * 0.5) * L.px(9), (H + 80) * j / n - 40]);
    const edge = pts.map(([x, y]) => `${(side < 0 ? fw + x : -x).toFixed(1)},${y.toFixed(1)}`).join('L');
    svg('path', { d: side < 0 ? `M-40,-40L${edge}L-40,${H + 40}Z` : `M${fw + 40},-40L${edge}L${fw + 40},${H + 40}Z`, fill: C.ink }, g);
    return { g, side, fw };
  });

  // Type (screen space).
  const tOct = wordAt(ctx, 'October', 0, 0.58), tSub = wordAt(ctx, 'submarine', 0, 4.3), tDeep = wordAt(ctx, 'deep', 0, 5.4), tCuba = wordAt(ctx, 'Cuba.', 0, 6.5);
  const date = plate(S.type, L, { text: '27 October 1962', font: 'title', size: L.pick({ landscape: 92, portrait: 96 }), name: '1A Date plate', seed: 4, padX: 0.42, padY: 0.24 });
  const kicker = plate(S.type, L, { text: 'Caribbean · Cuban Missile Crisis', size: L.pick({ landscape: 30, portrait: 32 }), ground: C.paper, color: C.ink, name: '1A Kicker', seed: 8 });
  const subLbl = plate(S.type, L, { text: 'Soviet submarine B-59', size: L.pick({ landscape: 30, portrait: 32 }), name: '1B Sub label', seed: 6 });
  const cubaLbl = plate(S.type, L, { text: 'Cuba', size: L.pick({ landscape: 40, portrait: 44 }), ground: C.paper, color: C.ink, name: '1C Cuba label', seed: 2, track: 0.2 });
  const [cx, cy] = toScreen(L.pick({ landscape: 345, portrait: 420 }), 420);

  return {
    update(t) {
      // Stage opens: flats part on the puppet beat (0.15 s), then breathe with the near plane.
      const open = beat(t, 0.12);
      for (const f of flats) {
        const rest = f.side < 0 ? -f.fw + W * 0.035 : W - W * 0.035;
        const shut = f.side < 0 ? -f.fw + W * 0.5 : W * 0.5;
        f.g.setAttribute('transform', `translate(${shut + (rest - shut) * open} 0)`);
      }
      // Camera: hold with a creep, then a slow push toward the sub from "submarine" on.
      const push = span(t, tSub - 0.4, ctx.duration + 0.4);
      const z = (1 + 0.1 * push) * creep(t, 0.03);
      S.camera({ s: z, fx: sx + subW * 0.5, fy: sy });

      // Sub: slides in on its groove (from the east) at "submarine", sinks + hazes at "deep".
      const inK = beat(t, tSub - 0.08), sink = span(t, tDeep - 0.05, tDeep + 1.1, tok.move);
      const bob = noise1(t * 0.6, 3) * L.px(2);
      subHolder.setAttribute('transform', `translate(${sx + (1 - inK) * L.px(320)} ${sy - subW * 0.11 + sink * L.px(26) + bob}) rotate(${(1 - inK) * -3 + sink * 2.2} ${subW / 2} ${subW * 0.12}) translate(${subW / 2} ${subW * 0.12}) scale(${1 - 0.08 * sink}) translate(${-subW / 2} ${-subW * 0.12})`);
      subHolder.style.visibility = t < tSub - 0.08 ? 'hidden' : 'visible';
      subPath.setAttribute('fill', mix(C.paper, C.cobalt, 0.38 * sink));

      // Type
      const m = L.safe;
      railIn(date, t, tOct - 0.08, m.x + L.px(L.pick({ landscape: 40, portrait: 10 })), m.y + L.px(L.pick({ landscape: 30, portrait: 40 })), -L.px(120), 0);
      railIn(kicker, t, tOct + 0.35, m.x + L.px(L.pick({ landscape: 40, portrait: 10 })), m.y + L.px(L.pick({ landscape: 30, portrait: 40 })) + date.h() + L.px(14), -L.px(90), 0);
      const zx = (x, y) => [sx + subW * 0.5 + (x - sx - subW * 0.5) * z, sy + (y - sy) * z];
      const [lx, ly] = zx(sx + subW * 0.04, sy + subW * 0.1);
      railIn(subLbl, t, tSub + 0.3, Math.min(lx, m.x + m.w - subLbl.w()), ly + sink * L.px(20) * z, 0, L.px(40));
      const [kx, ky] = zx(cx, cy);
      railIn(cubaLbl, t, tCuba - 0.08, kx, ky, 0, L.px(40));
    },
  };
}
