// 4 · Closer on the third man. On "The third" the officer beside him is switched off (one dry relay click), then a
// held quiet. On "no" the only RED tube of the film catches — slowly, never a hard strike. His name, then 2002.
import { glide } from '/onclack-styles/engine/lib/spring.js';
import { makeStage, makeTube, paintLabel, textStrokes, xf, FIGURES, bright } from '../shared/neon.js';
import { wordAt, switchOn, F } from '../shared/cues.js';

export default function (root, ctx) {
  const st = makeStage(root, ctx, { seed: 37, name: '4 · Sign wall (closer)' });
  const { W, H, u, L } = st;
  const sf = L.safe, P = L.portrait, words = ctx.words;

  // the third officer, bigger (camera has moved in on the same wall), and the second at the frame edge
  const fh = L.pick({ landscape: 700, portrait: 600 }) * u;
  const base = H * L.pick({ landscape: 0.955, portrait: 0.62 });
  const x3 = P ? W * 0.45 : W * 0.3, x2 = P ? -W * 0.06 : W * 0.04;
  const mk = (i, x, name) => {
    const strokes = xf(FIGURES[i].s, x, base, fh / 100);
    const lt = strokes[0][0], rt = strokes[strokes.length - 1].slice(-1)[0];
    return makeTube(st, { strokes, gas: 'warm', w: 12 * u, name, ends: ['left', 'right'], grommet: true, supportEvery: 12 * u * 16,
      wireTo: [[lt[0] - 80 * u, lt[1] + 6 * u], [rt[0] + 80 * u, rt[1] + 6 * u]] });
  };
  const f2 = mk(1, x2, '4A officer 2 (switched off)');
  const f3 = mk(2, x3, '4B Vasili Arkhipov (third officer)');

  // the red NO
  const ncap = L.pick({ landscape: 300, portrait: 270 }) * u;
  const nx = P ? W * 0.45 : W * 0.53, ny = P ? sf.y + 40 * u : H * 0.12;
  const nT = textStrokes('NO', nx, ny, ncap, { align: P ? 0.5 : 0, track: 3.4 });
  const no = makeTube(st, { strokes: nT.strokes, gas: 'red', w: 19 * u, name: '4C NO (the only red tube)', ends: ['down', 'up'], grommet: true,
    supportEvery: 19 * u * 9, wireTo: [[nT.x0 - 10 * u, ny + ncap + 110 * u], [nT.x1 - ncap * 0.36, ny - 70 * u]] });

  // name (one tube per word) + 2002
  const kcap = L.pick({ landscape: 54, portrait: 44 }) * u;
  const ky = P ? base + 70 * u : H * 0.6;
  const kx = P ? W * 0.45 : nx;
  const full = textStrokes('VASILI ARKHIPOV', kx, ky, kcap, { align: P ? 0.5 : 0 });
  const vStrokes = 1 + 2 + 1 + 1 + 1 + 1;
  const nameT = [full.strokes.slice(0, vStrokes), full.strokes.slice(vStrokes)].map((s, i) => makeTube(st, {
    strokes: s, gas: 'warm', w: 7 * u, name: `4D name ${i ? 'ARKHIPOV' : 'VASILI'}`, ends: i ? ['back', 'right'] : ['left', 'back'], supports: false, grommet: true,
    wireTo: [[s[0][0][0] - 30 * u, ky + kcap * 0.4], [s[s.length - 1].slice(-1)[0][0] + 30 * u, ky + kcap * 0.6]] }));
  const ycap = L.pick({ landscape: 112, portrait: 96 }) * u;
  const yy = ky + kcap + L.pick({ landscape: 70, portrait: 50 }) * u;
  const yT = textStrokes('2002', kx, yy, ycap, { align: P ? 0.5 : 0 });
  const y2002 = makeTube(st, { strokes: yT.strokes, gas: 'warm', w: 10 * u, name: '4E 2002', ends: ['left', 'right'], grommet: true,
    wireTo: [[yT.x0 - 36 * u, yy + ycap * 0.3], [yT.x1 + 36 * u, yy + ycap * 0.7]] });
  paintLabel(st, P ? W * 0.45 : yT.x0, yy + ycap + 60 * u, 'his story made public, c. 2002', { size: 26, anchor: P ? 'middle' : 'start', name: '4E label' });

  const tThird = switchOn(ctx, wordAt(words, 'third', 0, 20.25) - 2 * F, { sfx: 'neon-tick-01', lu: -16 });
  const tName = switchOn(ctx, wordAt(words, 'Vasili', 0, 20.61) - 2 * F, { lu: -20 });
  const tName2 = wordAt(words, 'Arkhipov', 0, 21.12) - 2 * F;
  const tNo = switchOn(ctx, wordAt(words, 'no', 0, 22.03) - 2 * F, { sfx: 'neon-relay-02', lu: -13 });
  const tYear = switchOn(ctx, wordAt(words, 'forty', 0, 24.13) - 2 * F, { lu: -19 });

  return {
    update(t) {
      const T = ctx.start + t;
      f2.set(bright(T, ctx.start - 3, 82, { off: tThird }));
      f3.set(bright(T, ctx.start - 3, 83));
      nameT[0].set(bright(T, tName, 101));
      nameT[1].set(bright(T, tName2, 102));
      no.set(bright(T, tNo, 111, { gentle: true }));
      y2002.set(bright(T, tYear, 121));
      st.camera(glide(t, 0, ctx.duration + 1, 1.0, 1.035), x3, base - fh * 0.75);
      st.grainAt(T);
    },
  };
}
