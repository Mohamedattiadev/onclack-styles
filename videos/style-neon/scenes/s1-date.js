// 1 · Date + sea map. The whole sign is on the wall from frame 0 as pale unlit glass; the voice switches it on piece by
// piece: date (relay click, uneven strike) → the submarine alone in the dark → the coast catches and tells us where.
import { glide } from '/onclack-styles/engine/lib/spring.js';
import { makeStage, makeTube, makeTransformer, paintLabel, textStrokes, xf, SHAPES, GLYPHS, mapProj, coast, bright } from '../shared/neon.js';
import { wordAt, switchOn, F } from '../shared/cues.js';

const SUB_ORDER = [[...SHAPES.sub[2]].reverse(), SHAPES.sub[1], SHAPES.sub[0]];

export default async function (root, ctx) {
  const st = makeStage(root, ctx, { seed: 11, name: '1 · Sign wall' });
  const { W, H, u, L } = st;
  const sf = L.safe, P = L.portrait, words = ctx.words;
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();

  // --- date: three tubes (one length of glass each), wires leave the frame upward to a box above
  const cap = L.pick({ landscape: 112, portrait: 150 }) * u;
  const wd = L.pick({ landscape: 12, portrait: 14 }) * u;
  const lines = P
    ? [['27 OCT', W / 2, sf.y + 70 * u, 0.5], ['1962', W / 2, sf.y + 70 * u + cap * 1.55, 0.5]]
    : [['27 OCT 1962', sf.x + 40 * u, sf.y + 70 * u, 0]];
  const dateTubes = [];
  for (const [str, x, y, al] of lines) {
    const t = textStrokes(str, x, y, cap, { align: al });
    // split into words → one tube per word, like a real sign (a tube is ~1–2 m of glass)
    const parts = str.split(' ');
    let i = 0;
    for (const word of parts) {
      const n = [...word].reduce((a, ch) => a + GLYPHS[ch].s.length, 0);
      const strokes = t.strokes.slice(i, i + n); i += n;
      const x0 = strokes[0][0][0];
      dateTubes.push(makeTube(st, {
        strokes, gas: 'warm', w: wd, name: `1A date "${word}"`, ends: ['left', 'back'],
        wireTo: [[x0 - 60 * u, -40 * u], [x0 + 80 * u, -40 * u]], wireBend: [0, -40],
      }));
    }
  }

  // --- map: Natural Earth coast as bent tube, sub in argon blue
  const box = P ? { x: sf.x, y: sf.y + 560 * u, w: sf.w, h: 640 * u } : { x: W * 0.17, y: H * 0.36, w: W * 0.77, h: H * 0.56 };
  const win = P ? [-85, -69.5, 19, 28.5] : [-86, -66, 19, 27.6];
  const proj = mapProj(box, win);
  const tol = 2.2 * u;
  let cuba = coast(geo, 'Cuba', proj, win, tol)[0];
  if (dist2(cuba[0], cuba[cuba.length - 1]) < 1) cuba = cuba.slice(0, -1);
  // open the ring on the south coast so the electrodes hang under the island
  let si = 0; cuba.forEach((p, i) => { if (p[1] > cuba[si][1] && p[0] < proj(-77, 20)[0]) si = i; });
  cuba = [...cuba.slice(si), ...cuba.slice(0, si)];
  cuba = cuba.slice(1, -1);
  const fl = coast(geo, 'United States of America', proj, win, tol)[0];
  const wc = 7 * u;
  const tfPos = P ? [sf.x + 20 * u, sf.y + sf.h - 150 * u] : [sf.x + 10 * u, H - 150 * u];
  const terms = makeTransformer(st, tfPos[0], tfPos[1], { name: '1 Transformer (map)' });
  const cubaT = makeTube(st, { strokes: [cuba], gas: 'warm', w: wc, name: '1C coast: Cuba', ends: ['down', 'down'], wireTo: terms, supportEvery: wc * 22 });
  const flT = makeTube(st, { strokes: [fl], gas: 'warm', w: wc, name: '1C coast: Florida', ends: ['up', 'up'], grommet: true, wireTo: [[fl[0][0] - 26 * u, fl[0][1] - 70 * u], [fl[fl.length - 1][0] + 26 * u, fl[fl.length - 1][1] - 70 * u]], supportEvery: wc * 22 });

  const subLen = L.pick({ landscape: 250, portrait: 210 }) * u;
  const [sx, sy] = proj(-72.6, 24.6);
  const subT = makeTube(st, { strokes: xf(SUB_ORDER, sx, sy, subLen / 100), gas: 'blue', w: 8 * u, name: '1B submarine B-59', ends: ['up', 'left'],
    wireTo: [[sx + subLen * 0.08, sy - subLen * 0.165 - 50 * u], [sx - subLen * 0.5 - 70 * u, sy + 20 * u]], grommet: true });
  paintLabel(st, P ? sx + subLen * 0.5 : sx, sy + 66 * u, 'B-59 · position approx.', { size: 26, anchor: P ? 'end' : 'middle', name: '1B label' });

  // --- cues (global seconds)
  const tDate = switchOn(ctx, wordAt(words, 'October', 0, 0.58) - 2 * F);
  const tSub = switchOn(ctx, wordAt(words, 'submarine', 0, 4.3) - 2 * F);
  const tCoast = switchOn(ctx, wordAt(words, 'Cuba', 0, 6.52) - 2 * F, { sfx: 'neon-relay-02', lu: -16 });
  const focus = [sx * 0.5 + W * 0.25, P ? box.y + box.h * 0.4 : H * 0.55];

  return {
    update(t) {
      const T = ctx.start + t;
      dateTubes.forEach((tb, i) => tb.set(bright(T, tDate + i * 0.09, 3 + i)));
      subT.set(bright(T, tSub, 21));
      cubaT.set(bright(T, tCoast, 31));
      flT.set(bright(T, tCoast + 0.05, 37));
      st.camera(glide(t, 0, ctx.duration + 1.5, 1.0, 1.045), focus[0], focus[1]);
      st.grainAt(T);
    },
  };
}
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
