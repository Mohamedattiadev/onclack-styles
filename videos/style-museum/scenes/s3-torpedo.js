// 3 · TURN. intent: KNOW a nuclear torpedo needs three officers to agree; two say yes · FEEL dread · SEE two lit YES cards, one empty slot.
// 3A WS truck along Case 3 (out-of-focus bench passes the lens), spot clicks on the torpedo on "nuclear".
// 3B MS the approval cards; on "Two" two pin spots click on cards I and II together; slot III stays dark.
// truth: torpedo = RC (model, not to scale); cards = VO (label: interpretive, accounts from later testimony).
import { gallery, camera, wt, F } from '../shared/gallery.js';
import { case3 } from '../shared/exhibits.js';

export default async function (root, ctx) {
  const G = gallery(root, ctx, { ambient: 0.27 });
  const P = G.P, u = G.u;

  const tNuc = wt(ctx, 'nuclear', 0, 14.483) - 2 * F;
  const tTorp = wt(ctx, 'torpedo', 0, 14.883);
  const tTo = wt(ctx, 'To', 0, 15.733);
  const tTwo = wt(ctx, 'Two', 0, 18.293) - 2 * F;
  const tCut = (tTorp + 0.56 + tTo) / 2;

  const C3 = case3(G, 0, { torpedo: [[tNuc, 1]], cards: [[tTwo, 1]] });
  void C3;
  G.bench(u(-760), P ? u(820) : u(760), P ? undefined : u(900));

  const shots = P
    ? [{ t0: 0, t1: tCut, x: [u(-560), u(-470)], y: u(960), z: 1.12, walk: 1, linear: true },
       { t0: tCut, t1: ctx.duration, x: [u(560), u(612)], y: [u(990), u(985)], z: [1.1, 1.14] }]
    : [{ t0: 0, t1: tCut, x: [u(-530), u(-440)], y: u(475), z: 1.5, walk: 1, linear: true },
       { t0: tCut, t1: ctx.duration, x: [u(470), u(540)], y: [u(572), u(566)], z: [1.48, 1.52] }];

  [0.08, 0.62, 1.16, 1.7].forEach((s, i) => ctx.sfx(i % 2 ? 'footsteps-ground-01' : 'footsteps-concrete-crouch-01', s, { lu: -23 - (i % 2) }));
  ctx.sfx('light-click-01', tNuc + F, { lu: -11 });
  ctx.sfx('light-click-01', tTwo + F, { lu: -12 });

  return { update(t) { G.update(t, camera(t, shots)); } };
}
