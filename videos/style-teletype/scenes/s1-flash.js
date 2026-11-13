// 1 · FLASH — the wire comes alive: a FLASH header strikes, the dateline types on the word, the boat is drawn in type.
// intent: KNOW date + Soviet sub B-59 near Cuba, deep · FEEL a bulletin is arriving NOW · SEE characters striking the roll,
//         the tape running beside it, the sub built from X/M characters below a typed sea line.
// truth: RC — our wire is a labelled reconstruction (printed on the roll: "RECONSTRUCTION - NOT A 1962 WIRE").
import { wireScene } from '../shared/wire.js';

export default function (root, ctx) {
  return wireScene(root, ctx, (S, L) => L.portrait
    ? [[0, { s: 1.0, fx: 487, fy: 1000, ax: 500, ay: 960 }], [3.4, { s: 1.0, fx: 487, fy: 990, ax: 500, ay: 960 }], [6.6, { s: 0.94, fx: 500, fy: 930, ax: 500, ay: 900 }]]
    : [[0, { s: 1.24, fx: 900, fy: 700, ay: 600 }], [3.3, { s: 1.2, fx: 910, fy: 690, ay: 600 }], [6.4, { s: 1.04, fx: 930, fy: 600, ay: 560 }]],
  { sound: true });
}
