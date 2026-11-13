// Scene 3 — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW one weapon, three keys · FEEL dread rising · SEE three names stitched, two X's, a needle waiting.
// shots: 3A MS the torpedo, satin-stitched in cream on the indigo cloth (RC, schematic)
//        3B MCU the vote in the hoop: names backstitched, X stitches in rust, the third box holds a needle (VO)
import { Cloth, PAL, W, F, camAt, resample } from '../shared/stitch.js';
import { label } from '../shared/parts.js';
import { buildBallot } from '../shared/ballot.js';

export default async function (root, ctx) {
  const L = ctx.layout, P = L.portrait, Wd = L.width, Hd = L.height, T0 = ctx.start;
  const tNuc = W(ctx, 'nuclear', 0, 14.48), tTorp = W(ctx, 'torpedo.', 0, 14.88), tTo = W(ctx, 'To', 0, 15.73);
  const cut = tTo - 0.2;

  /* 3A · torpedo on the indigo cloth */
  const A = new Cloth(root, ctx, { kind: 'indigo', name: '3A Indigo cloth (canvas)', seed: 9 });
  const len = P ? 820 : 980, dia = P ? 74 : 84, tx = Wd / 2 - len / 2, ty = P ? Hd * 0.44 : Hd * 0.45;
  const prof = u => dia * (u < 0.04 ? 0.5 + u / 0.04 * 0.4 : u > 0.86 ? Math.sqrt(Math.max(0, 1 - ((u - 0.86) / 0.14) ** 2)) : 0.92 + 0.08 * Math.min(1, (u - 0.04) / 0.1));
  const spine = resample([[tx, ty], [tx + len, ty]], 4);
  const body = Cloth.satinSpine(spine, prof, 3.3, { split: 50 });
  const nose = body.filter(([a]) => a[0] > tx + len * 0.86), hull = body.filter(([a]) => a[0] <= tx + len * 0.86);
  // pen pattern of the outline, visible before the thread covers it
  const outline = []; for (let i = 0; i <= 50; i++) { const u = i / 50; outline.push([tx + u * len, ty - prof(u) / 2]); } for (let i = 50; i >= 0; i--) { const u = i / 50; outline.push([tx + u * len, ty + prof(u) / 2]); }
  A.trace(outline, { a: 0.6 });
  const t0 = T0 + 0.25, tBodyEnd = tNuc + 0.2;
  const e1 = A.run(hull, { t0, rate: hull.length / (tBodyEnd - t0), color: PAL.cream, w: 4.4, seed: 201, lift: 10, post: 0 });
  A.run(nose, { t0: e1, pre: 0, rate: nose.length / Math.max(0.3, tTorp - e1), color: PAL.rust, w: 4.4, seed: 202, lift: 10, post: 0.3 });
  // tail fins: short straight stitches
  const fins = [[[tx + 8, ty - dia * 0.42], [tx - 40, ty - dia * 0.95]], [[tx + 18, ty - dia * 0.42], [tx - 26, ty - dia * 0.95]], [[tx + 8, ty + dia * 0.42], [tx - 40, ty + dia * 0.95]], [[tx + 18, ty + dia * 0.42], [tx - 26, ty + dia * 0.95]]];
  A.run(fins, { t0: -20, rate: 999, color: PAL.cream, w: 4, needle: false, seed: 203 });
  A.name('3A Nuclear torpedo (satin, schematic)', [tx - 40, ty - dia, len + 40, dia * 2]);
  const cc = P ? 11 : 10, nu = Cloth.crossText('NUCLEAR', 0, 0, cc), nuT = Cloth.crossText('NUCLEAR', Wd / 2 - nu.w / 2, ty + dia + (P ? 60 : 50), cc);
  A.run(nuT.segs, { t0: tNuc - 0.35, rate: nuT.segs.length / 0.7, color: PAL.cream, w: cc * 0.44, needle: false, seed: 204 });
  A.name('3A Word NUCLEAR (cross-stitch)', [Wd / 2 - nu.w / 2, ty + dia + 50, nu.w, nu.h], tNuc);
  label(A, { x: P ? L.safe.x + 20 : Wd / 2 + len / 2 - 470, y: P ? ty - dia - 140 : ty - dia - 110, text: 'T-5 type, approx. 10 kt · schematic', size: P ? 26 : 24, t0: tTorp - 0.1, name: '3A Torpedo label' });

  /* 3B · the vote */
  const B = buildBallot(root, ctx);
  const { cx, cy } = B;
  const keysA = [[T0, { x: Wd / 2, y: ty + 10, z: P ? 1.0 : 1.0 }], [cut, { x: Wd / 2 + 30, y: ty + 10, z: P ? 1.07 : 1.08 }]];
  const keysB = [[cut, P ? { x: cx, y: cy - 90, z: 1.18 } : { x: cx - 20, y: cy - 95, z: 1.3 }], [ctx.start + ctx.duration, P ? { x: cx + 10, y: cy - 80, z: 1.24 } : { x: cx - 10, y: cy - 80, z: 1.38 }]];

  // sound: inside the hull now — the sea gets duller; one step on the metal deck; cloth as the names are worked
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -19, fade: 0.5 });
  ctx.sfx('footsteps-metal-deck-01', 0.3, { lu: -22 });
  ctx.sfx('cloth-jacket-01', tTo - T0, { lu: -27 });
  ctx.sfx('cloth-shake-01', W(ctx, 'Two', 0, 18.29) - T0 + 2 * F, { lu: -24 });

  return {
    update(t) {
      const g = T0 + t, a = g < cut;
      A.cv.style.display = a ? 'block' : 'none'; B.cloth.cv.style.display = a ? 'none' : 'block';
      A.layer.style.display = a ? 'block' : 'none'; B.cloth.layer.style.display = a ? 'none' : 'block';
      if (a) A.draw(g, camAt(g, keysA, { breathe: 0.5, seed: 6 }));
      else B.cloth.draw(g, camAt(g, keysB, { breathe: 0.5, seed: 7 }));
    },
  };
}
