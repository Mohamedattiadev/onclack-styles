// 2 · RISING. intent: KNOW US ships drop practice depth charges, Moscow is silent · FEEL pressure · SEE the gauge needle jolting.
// 2A MS Case 2 (dim Case 1 at frame left), spot clicks on the gauge on "Above"; PUSH/m to the gauge on "drop";
//    two thuds: the needle jumps, the dust in the light jumps (the exhibit remembers — nothing else in the room moves).
// 2B INS the headset with its loose plug (spot clicks on "Moscow"), the photo behind it.
// truth: gauge + headset = RC ("similar type"); photo = EV (US Navy, 28–29 Oct 1962, NARA, PD), label says so.
import { gallery, camera, level, wt, F } from '../shared/gallery.js';
import { case1, case2 } from '../shared/exhibits.js';

export default async function (root, ctx) {
  const geoData = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const G = gallery(root, ctx, { ambient: 0.3 });
  const P = G.P, u = G.u;

  const tAbove = wt(ctx, 'Above', 0, 7.559) - 2 * F;
  const tDrop = wt(ctx, 'drop', 0, 8.949) - 2 * F;
  const tCharges = wt(ctx, 'charges', 0, 10.049);
  const tMoscow = wt(ctx, 'Moscow', 0, 10.949) - 2 * F;
  const tCut = tMoscow - 0.12;
  const bursts = [tCharges + 0.3, tCharges + 0.78];
  const thud = t => bursts.reduce((a, b, i) => a + (t > b ? Math.exp(-(t - b) * 5.5) * (i ? 0.7 : 1) : 0), 0);
  const jitter = t => bursts.reduce((a, b, i) => a + (t > b ? Math.exp(-(t - b) * 3.2) * Math.sin((t - b) * 31) * (i ? 0.7 : 1) : 0), 0);

  if (!P) case1(G, u(-1220), geoData, {}).hideLabel = true; // the case we just walked past, lights off
  const C2 = case2(G, 0, ctx.asset('assets/b59-surfaced-1962.jpg'), { gauge: [[tAbove, 1]], headset: [[tMoscow, 1]] }, thud);

  // gauge centre in world space (for the push) — base at depth 0.45
  const gx = P ? u(-190) : u(-170);
  const gy = P ? u(880) : u(380);
  const hx = P ? u(150) : u(160);
  const shots = P
    ? [{ t0: 0, t1: tDrop, x: [u(-60), u(-20)], y: u(960), z: 1.18, walk: 1, linear: true },
       { t0: tDrop, t1: tCut, x: [u(-20), gx], y: [u(960), gy], z: [1.18, 1.75], e: [0, 0.5] },
       { t0: tCut, t1: ctx.duration, x: [u(22), u(36)], y: [u(992), u(988)], z: [1.4, 1.44] }]
    : [{ t0: 0, t1: tDrop, x: [u(-90), u(-30)], y: u(580), z: 1.24, walk: 1, linear: true },
       { t0: tDrop, t1: tCut, x: [u(-30), gx], y: [u(580), gy], z: [1.24, 1.9], e: [0, 0.5] },
       { t0: tCut, t1: ctx.duration, x: [hx - u(10), hx + u(10)], y: [u(604), u(600)], z: [1.6, 1.64] }];

  ctx.sfx('footsteps-concrete-crouch-01', 0.1, { lu: -24 });
  ctx.sfx('footsteps-ground-01', 0.64, { lu: -25 });
  ctx.sfx('light-click-01', tAbove + F, { lu: -11 });
  ctx.sfx('boom-distant-01', bursts[0] + F, { lu: -12 });
  ctx.sfx('boom-slapback-01', bursts[1] + F, { lu: -15 });
  ctx.sfx('light-click-01', tMoscow + F, { lu: -14 });

  return {
    update(t) {
      C2.gauge.setValue(118 + jitter(t) * 14 + level(t, [[bursts[0], 6, 0.25], [bursts[1], 11, 0.25]]));
      G.update(t, camera(t, shots));
    },
  };
}
