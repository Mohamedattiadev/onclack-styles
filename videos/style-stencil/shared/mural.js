// The whole film is ONE wall that fills up, stencil by stencil, in voice time. Each scene module builds the same
// wall and shows it at its own times (global T), so cuts are invisible and the last shot pulls back to the full piece.
// 16:9: two panels side by side (sea left, vote right). 9:16: one tall wall, read top → bottom (camera tilts down).
import { createWorld, stencil, textShape, merge, cameraAt, C } from './stencil.js';
import { sub, ship, torpedo, burst, waves, officer } from './shapes.js';

const SCENE_STARTS = [];

export function buildMural(root, ctx, sceneIndex) {
  const L = ctx.layout, land = L.landscape;
  const W = (w) => ctx.words.find((x) => x.word.toLowerCase().replace(/[^a-z-]/g, '') === w);
  const wt = (w, fb) => W(w)?.start ?? fb;
  // sound window for this scene: [start, next scene start) so overlaps never double a cue
  const isLast = sceneIndex === 3;
  const win = [sceneIndex === 0 ? -1e9 : ctx.start, isLast ? 1e9 : ctx.start + ctx.duration - 0.5];

  const G = land
    ? { worldW: 3400, worldH: 1900, wall: 'assets/wall-land.jpg', wallOrigin: [-200, -250] }
    : { worldW: 1600, worldH: 4450, wall: 'assets/wall-port.jpg', wallOrigin: [-800, -200], wallScale: 1.75 };
  const world = createWorld(root, ctx, { ...G, win });

  // ---------------------------------------------------------------- positions (world px)
  const P = land ? {
    date: { x: 170, baseline: 360, width: 860 },
    moscow: { x: 1640, baseline: 610, width: 470, anchor: 'end' },
    ships: [[200, 805, 450], [740, 805, 480]],
    waves: [80, 840, 1640],
    cuba: { x: 1600, baseline: 1090, width: 330, anchor: 'end' },
    bursts: [[560, 1030, 62], [745, 1135, 56], [915, 1240, 50]],
    sub: [520, 1490, 980],
    torp: [1880, 560, 1300],
    nuclear: { x: 2690, top: 300, width: 440 },
    figs: [[2010, 1225, 520, 'folded'], [2390, 1225, 520, 'lean'], [2790, 1225, 540, 'stop']],
    yes: [[2010, 1350], [2390, 1350]], yesW: 130,
    no: { x: 3000, baseline: 1130, width: 370 },
    name: { x: 2640, baseline: 1350, width: 560 },
    years: { x: 2640, baseline: 1430, width: 300 },
  } : {
    date: { x: 330, baseline: 420, width: 640, line2: { gap: 46, width: 640 } },
    moscow: { x: 1220, baseline: 1300, width: 740, anchor: 'end' },
    ships: [[370, 1500, 400], [800, 1500, 420]],
    waves: [160, 1535, 1300],
    cuba: { x: 1150, baseline: 2400, width: 330, anchor: 'end' },
    bursts: [[600, 1730, 64], [780, 1865, 56], [950, 1990, 50]],
    sub: [450, 2230, 700],
    torp: [380, 2720, 840],
    nuclear: { x: 420, top: 2810, width: 470 },
    figs: [[470, 3520, 500, 'folded'], [790, 3520, 500, 'lean'], [1110, 3520, 520, 'stop']],
    yes: [[470, 3645], [790, 3645]], yesW: 130,
    no: { x: 600, baseline: 4120, width: 560, anchor: 'start' },
    name: { x: 600, baseline: 4270, width: 680 },
    years: { x: 600, baseline: 4360, width: 360 },
  };

  // ---------------------------------------------------------------- timings from the voice (global s)
  const t = {
    oct: wt('october', 0.58), sixty: wt('sixty-two', 2.61), soviet: wt('soviet', 3.79), sea: wt('sea', 5.98), cuba: wt('cuba', 6.52),
    ships: wt('ships', 8.63), drop: wt('drop', 8.95), depth: wt('depth', 9.79), charges: wt('charges', 10.05), moscow: wt('moscow', 10.95), days: wt('days', 12.49),
    torpedo: wt('torpedo', 14.88), three: wt('three', 16.51), agree: wt('agree', 17.61), two: wt('two', 18.29), yes: wt('yes', 18.8),
    third: wt('third', 20.25), vasili: wt('vasili', 20.61), no: wt('no', 22.03), name: wt('name', 23.73), world: wt('world', 23.07), forty: wt('forty', 24.13),
  };

  // ---------------------------------------------------------------- 1 · date, submarine, sea
  const date = land ? textShape(world, '27 OCT 1962', { ...P.date, seed: 2, drips: 3 })
    : (() => { const l1 = textShape(world, '27 OCT', { ...P.date, seed: 2, drips: 2 }); return merge(l1, textShape(world, '1962', { x: P.date.x, top: P.date.baseline + P.date.line2.gap, width: P.date.line2.width, seed: 3, drips: 2 })); })();
  stencil(world, { name: '1A Date', shape: date, color: C.black, lay: [0.05, 0.4], spray: [0.45, 1.95], lift: [1.98, 2.55], liftMode: 'top', seed: 3, dripLen: 60 });

  const subS = sub(...P.sub, 5);
  stencil(world, { name: '1B Submarine', shape: subS, color: C.black, lay: [2.5, 2.8], spray: [2.86, t.soviet + 1.0], lift: [t.soviet + 1.08, t.soviet + 1.6], liftMode: 'right', seed: 7, dripLen: 60 });
  const sea = merge(waves(P.waves[0], P.waves[1], P.waves[2], 13), textShape(world, 'NEAR CUBA', { ...P.cuba, seed: 4, drips: 1 }));
  stencil(world, { name: '1C Sea + "near Cuba"', shape: sea, color: C.white, lay: [t.soviet + 1.5, t.soviet + 1.8], spray: [t.soviet + 1.85, t.cuba + 0.15], lift: [t.cuba + 0.22, t.cuba + 0.75], liftMode: 'corner', seed: 11, dripLen: 40, dripW: 4 });

  // ---------------------------------------------------------------- 2 · ships, depth charges (stamped three times), Moscow silent
  const shipsS = merge(ship(...P.ships[0], 7), ship(...P.ships[1], 8));
  stencil(world, { name: '2A Two American ships', shape: shipsS, color: C.black, lay: [7.15, 7.45], spray: [7.5, t.ships + 0.25], lift: [t.ships + 0.32, t.drop + 0.35], liftMode: 'top', seed: 13, dripLen: 45 });
  const bt = [t.drop + 0.45, t.depth + 0.12, t.charges + 0.42];
  P.bursts.forEach(([x, y, r], i) => {
    const a = bt[i];
    stencil(world, { name: `2B Depth charge ${i + 1}`, shape: burst(x, y, r, 11 + i), color: C.orange, lay: [a - 0.22, a - 0.06], spray: [a - 0.04, a + 0.2], lift: [a + 0.24, a + 0.5], liftMode: ['corner', 'left', 'top'][i], seed: 17 + i, dripLen: 55, pad: 40, halo: 5, haloOpacity: 0.55, hissLu: -12, layLu: -20, liftLu: -18 });
    world.sfx('boom-distant-01', a + 0.02, { lu: -5 - i * 1.5 });
  });
  const mos = textShape(world, 'MOSCOW: SILENT', { ...P.moscow, seed: 6, drips: 2 });
  stencil(world, { name: '2C "Moscow: silent"', shape: mos, color: C.black, lay: [t.moscow - 0.2, t.moscow + 0.08], spray: [t.moscow + 0.12, t.days - 0.05], lift: [t.days + 0.05, t.days + 0.6], liftMode: 'bottom', seed: 23, dripLen: 70 });

  // ---------------------------------------------------------------- 3 · torpedo (black + orange warhead layer), three officers, two YES
  const nuc = textShape(world, 'NUCLEAR', { ...P.nuclear, seed: 16, drips: 2 });
  stencil(world, { name: '3A2 "Nuclear"', shape: nuc, color: C.white, lay: [14.55, 14.8], spray: [14.84, 15.35], lift: [15.42, 15.85], liftMode: 'right', seed: 33, dripLen: 35, dripW: 4, hissLu: -13 });
  const tb = torpedo(...P.torp, 'body', 9), tt = torpedo(...P.torp, 'tip', 10);
  stencil(world, { name: '3A Torpedo body', shape: tb, color: C.black, lay: [13.45, 13.75], spray: [13.8, 14.72], lift: [14.78, 15.2], liftMode: 'top', seed: 29, dripLen: 55 });
  stencil(world, { name: '3B Warhead (2nd layer)', shape: tt, color: C.orange, offset: [4, -3], lay: [15.05, 15.3], spray: [15.33, 15.78], lift: [15.84, 16.2], liftMode: 'left', seed: 31, dripLen: 45, pad: 45 });
  const figs = merge(...P.figs.map(([x, y, h, pose], i) => officer(x, y, h, pose, { seed: 41 + i * 9 })));
  stencil(world, { name: '3C Three officers', shape: figs, color: C.black, lay: [t.three - 0.42, t.three - 0.12], spray: [t.three - 0.08, t.agree + 0.15], lift: [t.agree + 0.22, t.agree + 0.7], liftMode: 'top', seed: 37, dripLen: 60, sweep: 'cols' });
  const yesS = merge(...P.yes.map(([x, y], i) => textShape(world, 'YES', { x, baseline: y, width: P.yesW, anchor: 'middle', seed: 8 + i, drips: 1 })));
  stencil(world, { name: '3D Two YES', shape: yesS, color: C.white, lay: [t.two - 0.18, t.two + 0.06], spray: [t.two + 0.1, t.yes + 0.25], lift: [t.yes + 0.32, t.yes + 0.75], liftMode: 'bottom', seed: 43, dripLen: 35, dripW: 4 });

  // ---------------------------------------------------------------- 4 · NO beside the third man, his name, the years
  const noS = textShape(world, 'NO', { ...P.no, spacing: 0.05, seed: 12, drips: 4 });
  stencil(world, { name: '4A NO', shape: noS, color: C.orange, lay: [t.third + 0.05, t.third + 0.35], spray: [t.vasili + 0.05, t.no - 0.32], lift: [t.no - 0.3, t.no + 0.3], liftMode: 'top', seed: 47, dripLen: 130, dripW: 8, halo: 6, haloOpacity: 0.5, hissLu: -9 });
  world.sfx('breath-close-01', t.no - 0.45, { lu: -21 });
  const nameS = merge(textShape(world, 'V. ARKHIPOV', { ...P.name, seed: 14, drips: 2 }), textShape(world, '1962 — 2002', { ...P.years, seed: 15, drips: 1 }));
  stencil(world, { name: '4B Name + years', shape: nameS, color: C.white, lay: [t.world - 0.25, t.world + 0.02], spray: [t.world + 0.06, t.forty + 0.3], lift: [t.forty + 0.38, t.forty + 0.95], liftMode: 'right', seed: 53, dripLen: 40, dripW: 4 });

  // ---------------------------------------------------------------- sound beds (once, scene 1)
  if (sceneIndex === 0) {
    ctx.ambience('sea-water-close-01', { from: 0, to: 20.2, lu: -17, fade: 1.2 });
    ctx.ambience('wind-grass-rustle-01', { from: 13.0, to: 27, lu: -24, fade: 1.5 });
  }

  // ---------------------------------------------------------------- camera
  function fit(bx, fw, fh) { const s2 = Math.min((L.safe.w * fw) / bx.w, (L.safe.h * fh) / bx.h); return { cx: bx.x + bx.w / 2, cy: bx.y + bx.h / 2 + 30, s: s2 }; }
  const V = land ? {
    date: { cx: 700, cy: 310, s: 1.38 }, sea: { cx: 1000, cy: 1230, s: 1.18 }, surf: { cx: 880, cy: 1010, s: 0.95 },
    torp: { cx: 2560, cy: 500, s: 1.22 }, vote: { cx: 2560, cy: 930, s: 1.04 }, third: { cx: 2950, cy: 1010, s: 1.15 }, all: { cx: 1720, cy: 840, s: 0.53 },
  } : {
    date: fit(date.box, 0.74, 0.55), sea: { cx: 800, cy: 2100, s: 1.15 }, surf: { cx: 795, cy: 1800, s: 1.0 },
    torp: { cx: 800, cy: 2580, s: 1.25 }, vote: { cx: 790, cy: 3240, s: 0.95 }, third: { cx: 790, cy: 3700, s: 0.86 }, all: { cx: 800, cy: 2780, s: 0.4 },
  };
  const moves = [
    { t0: -2, t1: -1, to: V.date },
    { t0: 0, t1: 2.25, to: { ...V.date, s: V.date.s * 1.035 } },
    { t0: 2.2, t1: 2.95, to: V.sea },
    { t0: 6.95, t1: 7.85, to: V.surf },
    { t0: 13.0, t1: 13.95, to: V.torp },
    { t0: 15.9, t1: 16.8, to: V.vote },
    { t0: 19.55, t1: 20.6, to: V.third },
    { t0: 24.1, t1: 26.2, to: V.all },
  ];

  return {
    world,
    update(T) {
      const c = cameraAt(T, moves);
      world.setCamera(c.cx, c.cy, c.s, c.rot);
      world.update(T);
    },
  };
}
