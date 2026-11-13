// 2 · DEPTH CHARGES — wide: the machine, the roll and the tape. Each charge hammers ### and jolts the whole machine.
// "Moscow has been silent": the printer types slow dots, then the tape runs blank (sprocket holes only = no data).
// intent: KNOW US ships attack with practice charges, no word from Moscow · FEEL pressure, then empty waiting ·
//         SEE the jolt, then the blank tape sliding out.
import { wireScene } from '../shared/wire.js';

export default function (root, ctx) {
  return wireScene(root, ctx, (S, L) => L.portrait
    ? [[ctx.start, { s: 0.9, fx: 520, fy: 1010, ax: 520, ay: 900 }], [S.booms[2] + 0.4, { s: 0.92, fx: 520, fy: 1040, ax: 520, ay: 900 }], [ctx.start + ctx.duration, { s: 0.98, fx: 560, fy: 1180, ax: 520, ay: 1000 }]]
    : [[ctx.start, { s: 0.98, fx: 1000, fy: 560 }], [S.booms[2] + 0.5, { s: 1.0, fx: 1010, fy: 560 }], [ctx.start + ctx.duration, { s: 1.18, fx: 1180, fy: 640 }]],
  { shakes: [S => [S.booms[0], 9], S => [S.booms[1], 12], S => [S.booms[2], 7]] });
}
