// 4 · PEAK → RESOLUTION. intent: KNOW Arkhipov said no; the world learned his name ~40 years later · FEEL awe, then quiet
// relief · SEE one card alone in one cone of light, the red NO.
// 4A CU card III in the dark (gallery light down, the hall murmur gone = the drop); the big spot clicks on "third";
//    on "no" a tight pin spot clicks onto the NO and the main spot sinks (strongest contrast of the film).
// 4B PULL/m out to the lone case in the dark gallery; on "forty" a wall-wash slowly brings up "2002".
// truth: card = VO (label: interpretive, accounts differ); 2002 = when his role became widely known (approx.; Havana conference).
import { gallery, camera, level, wt, F } from '../shared/gallery.js';
import { case4 } from '../shared/exhibits.js';

export default async function (root, ctx) {
  const G = gallery(root, ctx, { ambient: 0.07 });
  const P = G.P, u = G.u;

  const tThird = wt(ctx, 'third', 0, 20.25) - 2 * F;
  const tNo = wt(ctx, 'no', 0, 22.03) - 2 * F;
  const tThe = (ctx.words.find(w => w.start > tNo + ctx.start + 0.2)?.start ?? 22.961) - ctx.start; // next word after "no"
  const tForty = wt(ctx, 'forty', 0, 24.131) - 2 * F;
  const tCut = (tNo + 2 * F + 0.15 + tThe) / 2;

  const C4 = case4(G, 0, { main: [[tThird, 1], [tNo, 0.5, 0.35], [tCut + 0.4, 0.85, 1.2]], pin: [[tNo, 1]] });
  const k = C4.card;
  const wall = G.wallText(P
    ? { X: 0, y: u(300), name: '4B Wall text 2002', washR: [480, 300], minO: 0, lines: [
        { text: '2002', size: u(200), font: "'Instrument Serif', serif", dy: 0, tracking: -0.02 },
        { text: 'FORTY YEARS ON,', size: u(26), weight: 600, dy: u(64), tracking: 0.16, fill: '#bdb6a8' },
        { text: 'THE WORLD LEARNS HIS NAME', size: u(26), weight: 600, dy: u(104), tracking: 0.16, fill: '#bdb6a8' },
      ] }
    : { X: u(980), y: u(380), name: '4B Wall text 2002', washR: [430, 300], minO: 0, lines: [
        { text: '2002', size: u(190), font: "'Instrument Serif', serif", dy: 0, tracking: -0.02 },
        { text: 'FORTY YEARS ON, THE WORLD LEARNS HIS NAME', size: u(25), weight: 600, dy: u(62), tracking: 0.16, fill: '#bdb6a8' },
      ] });

  // card centre in world space: base at depth 0.5 sits a little behind the front edge
  const base = G.geo.Ybase - (P ? u(380) : u(420));
  const sc = 1 - G.geo.k * 0.5;
  const baseY = base + (G.geo.yE - base) * G.geo.k * 0.5;
  const cardCY = baseY - (k.riser + k.ch * 0.5) * sc;
  const shots = P
    ? [{ t0: 0, t1: tCut, x: 0, y: [u(1040), u(1030)], z: [1.3, 1.38] },
       { t0: tCut, t1: ctx.duration, x: 0, y: [u(1030), u(880)], z: [1.38, 0.9], e: [0, 0.72] }]
    : [{ t0: 0, t1: tCut, x: 0, y: [cardCY - u(36), cardCY - u(22)], z: [2.0, 2.2] },
       { t0: tCut, t1: ctx.duration, x: [0, u(420)], y: [cardCY - u(22), u(470)], z: [2.2, 0.84], e: [0, 0.72] }];

  ctx.sfx('light-click-02', tThird + F, { lu: -9 });
  ctx.sfx('light-click-01', tNo + F, { lu: -13 });

  return {
    update(t) {
      wall.set(level(t, [[tForty, 1, 0.7]]));
      G.update(t, camera(t, shots));
    },
  };
}
