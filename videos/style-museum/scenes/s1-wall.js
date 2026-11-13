// 1 · ESTABLISH. intent: KNOW 27 Oct 1962, a Soviet sub hides near Cuba · FEEL hushed curiosity · SEE the lit model submarine.
// 1A EST wall text, a wall-wash clicks on, the camera walks right (dim Case 1 waits at frame right).
// 1B MS Case 1: the spot clicks on the model on "Soviet"; a small second spot clicks on the chart pin on "Cuba".
// truth: model + chart = RC (label says "made for this film", "approx. area"); outlines = Natural Earth (PD).
import { gallery, camera, level, wt, F } from '../shared/gallery.js';
import { case1 } from '../shared/exhibits.js';

export default async function (root, ctx) {
  const geoData = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const G = gallery(root, ctx, { ambient: 0.3 });
  const P = G.P, u = G.u;

  const tWash = wt(ctx, 'October', 0, 0.58) - 3 * F;
  const tSov = wt(ctx, 'Soviet', 0, 3.79) - 2 * F;
  const tCuba = wt(ctx, 'Cuba', 0, 6.52) - 2 * F;
  const tCut = (wt(ctx, 'sixty-two', 0, 2.61) + 0.64 + wt(ctx, 'A', 0, 3.62)) / 2 + 0.0; // middle of the pause after the date

  // wall text (vinyl letters) — portrait stacks it
  const wall = G.wallText(P
    ? { X: 0, y: u(600), name: '1A Wall text', washR: [520, 560], lines: [
        { text: '27 October', size: u(150), font: "'Instrument Serif', serif", dy: 0, tracking: -0.015 },
        { text: '1962', size: u(250), font: "'Instrument Serif', serif", dy: u(300), tracking: -0.02 },
        { text: 'ROOM 3  ·  SOVIET SUBMARINE B-59', size: u(26), weight: 600, dy: u(400), tracking: 0.16, fill: '#bdb6a8' },
        { text: 'IN THE SEA NEAR CUBA', size: u(26), weight: 600, dy: u(442), tracking: 0.16, fill: '#bdb6a8' },
      ] }
    : { X: 0, y: u(440), name: '1A Wall text', washR: [760, 360], lines: [
        { text: '27 October 1962', size: u(150), font: "'Instrument Serif', serif", dy: 0, tracking: -0.015 },
        { text: 'ROOM 3  ·  SOVIET SUBMARINE B-59, IN THE SEA NEAR CUBA', size: u(25), weight: 600, dy: u(78), tracking: 0.16, fill: '#bdb6a8' },
      ] });

  const cx1 = P ? u(1250) : u(1520);
  const C1 = case1(G, cx1, geoData, { sub: [[tSov, 1]], chart: [[tCuba, 1]] });

  const shots = P
    ? [{ t0: 0, t1: tCut, x: [u(-200), u(40)], y: u(900), z: 1, walk: 1, linear: true },
       { t0: tCut, t1: ctx.duration, x: [cx1 - u(40), cx1], y: [u(955), u(942)], z: [1.15, 1.2], e: [0, 1] }]
    : [{ t0: 0, t1: tCut, x: [u(-330), u(130)], y: u(540), z: 1, walk: 1, linear: true },
       { t0: tCut, t1: ctx.duration, x: [cx1 - u(60), cx1], y: [u(585), u(575)], z: [1.24, 1.3], e: [0, 1] }];

  // sound: far visitors in the hall (bed runs until the last room), steps while walking, light clicks 1 frame after onset
  ctx.ambience('crowd-hall-01', { from: 0, to: 19.95 - ctx.start, lu: -17, fade: 0.5 });
  [0.12, 0.66, 1.2, 1.74, 2.28, 2.82].forEach((s, i) => ctx.sfx(i % 2 ? 'footsteps-ground-01' : 'footsteps-concrete-crouch-01', s, { lu: -23 + (i % 3) * 0.8 }));
  ctx.sfx('light-click-01', tWash + F, { lu: -12 });
  ctx.sfx('light-click-01', tSov + F, { lu: -11 });
  ctx.sfx('light-click-01', tCuba + F, { lu: -15 });

  return {
    update(t) {
      const cam = camera(t, shots);
      wall.set(level(t, [[tWash, 1, 0.09]]));
      G.update(t, cam);
    },
  };
}
