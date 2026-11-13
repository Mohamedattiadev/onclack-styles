// 3 · THE VOTE — close on the roll: the torpedo in overstruck type, the rule (3 must agree), then the vote line
// "1:YES 2:YES 3:" — and the type box stops at the empty third slot.
// intent: KNOW the rule and the 2 yes votes · FEEL the wait · SEE an empty slot after "3:".
// truth: RC — vote is reconstructed from later crew accounts (hedge in the full script).
import { wireScene } from '../shared/wire.js';

export default function (root, ctx) {
  return wireScene(root, ctx, (S, L) => L.portrait
    ? [[ctx.start, { s: 1.0, fx: 487, fy: 1010, ax: 500, ay: 950 }], [S.tVoteWait - 1.4, { s: 1.0, fx: 487, fy: 1030, ax: 500, ay: 950 }], [ctx.start + ctx.duration, { s: 1.0, fx: 487, fy: 1080, ax: 500, ay: 960 }]]
    : [[ctx.start, { s: 1.34, fx: 790, fy: 640, ay: 560 }], [S.tVoteWait - 1.4, { s: 1.36, fx: 780, fy: 650, ay: 560 }], [ctx.start + ctx.duration, { s: 1.58, fx: 700, fy: 700, ay: 560 }]]);
}
