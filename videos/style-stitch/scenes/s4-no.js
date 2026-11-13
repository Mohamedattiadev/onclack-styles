// Scene 4 — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW one man refused · FEEL held breath → relief · SEE the waiting needle pull the red thread into NO.
// shots: 4A push in on row 3 (MCU → CU) while the needle waits · 4B "no": red satin NO (peak, the only red)
//        4C pull back to the whole hoop (WS), 2002 cross-stitched on "forty years later" (resolution).
import { F, camAt } from '../shared/stitch.js';
import { buildBallot } from '../shared/ballot.js';

export default async function (root, ctx) {
  const L = ctx.layout, P = L.portrait, T0 = ctx.start;
  const B = buildBallot(root, ctx);
  const { cx, cy, sc, rowsY, t } = B;
  const r3 = rowsY[2];
  const keys = [
    [T0, P ? { x: cx + 10, y: cy - 80, z: 1.24 } : { x: cx - 10, y: cy - 80, z: 1.38 }],
    [t.tVas + 0.5, P ? { x: cx - 20, y: r3 + 110 * sc, z: 1.3 } : { x: cx - 10, y: r3 + 120 * sc, z: 1.85 }],
    [t.tNo + 0.75, P ? { x: cx - 15, y: r3 + 115 * sc, z: 1.33 } : { x: cx - 5, y: r3 + 125 * sc, z: 1.9 }],
    [t.tForty - 0.1, P ? { x: cx, y: cy + 40, z: 0.98 } : { x: cx, y: cy + 8, z: 0.93 }],
    [T0 + ctx.duration, P ? { x: cx, y: cy + 40, z: 0.95 } : { x: cx, y: cy + 8, z: 0.9 }],
  ];
  // sound: the sea thins to room tone (the drop), one held breath before "no", a firm cloth pull on it
  ctx.ambience('sea-water-close-01', { from: 0, to: t.tNo - 0.6 - T0, lu: -21, fade: 0.6 });
  ctx.sfx('breath-scared-01', t.tNo - 1.0 - T0, { lu: -24 });
  ctx.sfx('cloth-shake-01', t.tNo + 2 * F - T0, { lu: -16 });
  ctx.sfx('cloth-jacket-01', t.tForty - 0.2 - T0, { lu: -28 });
  return { update(tt) { const g = T0 + tt; B.cloth.draw(g, camAt(g, keys, { breathe: 0.45, seed: 8 })); } };
}
