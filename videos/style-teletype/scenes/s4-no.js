// 4 · NO — the name types, the machine falls silent, then the NO rises out of the platen as punched holes full of lamp
// light. On "The world learned…" the sheet is torn off the bar and pinned above; new paper prints "HAVANA, OCT 2002".
// intent: KNOW the third officer, Arkhipov, said no; the world learned it in 2002 · FEEL relief/awe · SEE light through NO.
// truth: VO for the punched NO (symbolic); 2002 = Havana conference where his role became widely known (hedged).
import { wireScene } from '../shared/wire.js';

export default function (root, ctx) {
  return wireScene(root, ctx, (S, L) => L.portrait
    ? [[ctx.start, { s: 1.0, fx: 487, fy: 1060, ax: 500, ay: 960 }], [S.tNo + 0.1, { s: 1.0, fx: 487, fy: 980, ax: 500, ay: 900 }], [S.tTear, { s: 1.0, fx: 487, fy: 960, ax: 500, ay: 900 }], [S.tTear + 1.2, { s: 0.9, fx: 520, fy: 840, ax: 520, ay: 840 }], [ctx.start + ctx.duration, { s: 0.88, fx: 520, fy: 830, ax: 520, ay: 840 }]]
    : [[ctx.start, { s: 1.3, fx: 790, fy: 660, ay: 560 }], [S.tNo + 0.1, { s: 1.22, fx: 790, fy: 600, ay: 520 }], [S.tTear, { s: 1.2, fx: 790, fy: 600, ay: 520 }], [S.tTear + 1.2, { s: 0.9, fx: 860, fy: 450, ay: 520 }], [ctx.start + ctx.duration, { s: 0.88, fx: 860, fy: 440, ay: 520 }]]);
}
