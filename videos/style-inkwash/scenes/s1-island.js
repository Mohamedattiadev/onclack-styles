// 1 · ISLAND — "October 27th, 1962. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW date + place · FEEL quiet unease · SEE one stroke of Cuba on empty paper, a tiny heavy mark far out at sea.
// truth: Cuba + Florida = RC derived from Natural Earth (stroke follows the real centre line, width = real island width);
//        B-59 position = RC, labelled "position approx." (same point as the other style tests).
// shots: 1A EST/TOP HOLD+creep (date → Florida → Cuba) · 1B INS mark + veil wash · 1C PUSH/f into the mark (match to 2A).
import { glide, creep, smootherstep, progress, lerp } from '/onclack-styles/engine/lib/anim.js';
import { makeSheet } from '../shared/stage.js';
import { stroke, label, writeIn, wordAt } from '../shared/ink.js';

const CUBA = [[-84.85, 21.87, 0.07], [-84.36, 22.097, 0.524], [-83.88, 22.45, 0.559], [-83.39, 22.567, 0.698], [-82.91, 22.792, 0.446], [-82.42, 22.906, 0.442], [-81.94, 22.721, 0.904], [-81.45, 22.655, 0.94], [-80.97, 22.573, 1.037], [-80.48, 22.552, 0.866], [-80.0, 22.336, 1.122], [-79.51, 22.089, 0.921], [-79.02, 21.988, 0.81], [-78.54, 21.8, 0.994], [-78.05, 21.388, 1.3], [-77.57, 20.872, 2.028], [-77.08, 20.735, 1.683], [-76.6, 20.615, 1.326], [-76.11, 20.569, 1.166], [-75.63, 20.484, 1.128], [-75.14, 20.345, 0.714], [-74.66, 20.284, 0.463], [-74.17, 20.225, 0.138]];
const FLORIDA = [[-82.01, 29.25, 2.0], [-81.69, 28.8, 1.9], [-81.65, 28.35, 2.1], [-81.68, 27.9, 2.3], [-81.49, 27.45, 2.3], [-81.25, 27.0, 2.3], [-81.04, 26.55, 2.0], [-80.95, 26.1, 1.7], [-80.78, 25.65, 1.0], [-80.89, 25.2, 0.5]];
const SUB = [-71.2, 25.4];
export const SUB_SCREEN = L => (L.portrait ? [0.5 * L.width, 0.62 * L.height] : [0.53 * L.width, 0.7 * L.height]);

export default function (root, ctx) {
  const S = makeSheet(root, ctx, 's1', 11);
  const { L, W, H, F } = S, u = L.unit, P = L.portrait, w = ctx.words;
  const k = P ? 68 : 104, lon0 = P ? -78 : -78, lat0 = 23, kc = Math.cos((lat0 * Math.PI) / 180);
  const cx = P ? 0.43 * W : 0.45 * W, cy = P ? 0.46 * H : 0.56 * H;
  const proj = (lon, lat) => [cx + (lon - lon0) * k * kc, cy - (lat - lat0) * k];

  const tWord = (p, re, n) => wordAt(w, p, re, n);
  const T = {
    date: tWord(0, /^October/) - 0.05, florida: 0.75, cuba: 1.15,
    sub: tWord(0, /^Soviet/) - 0.08, veil: tWord(0, /^hides/) - 0.02, cubaLab: tWord(0, /^Cuba/) - 0.08,
  };

  const land = S.layer('Land'), sea = S.layer('Sea marks');
  const smooth = a => a.map((v, i) => (a[Math.max(0, i - 1)] + 2 * v + a[Math.min(a.length - 1, i + 1)]) / 4);
  const wc = smooth(CUBA.map(c => c[2]));
  const cuba = stroke(land, F, {
    name: '1A Cuba (one stroke, west → east)', pts: CUBA.map(c => proj(c[0], c[1])),
    w: wc.map((v, i) => [i / (CUBA.length - 1), Math.max(10 * u, v * k * 0.78)]),
    t0: T.cuba, dur: 1.9, ink: 0.9, dry: 0.86, bristles: 16, coreEnd: 0.35, rough: 0.09, seed: 3, unit: u, bleed: 5,
  });
  const wf = FLORIDA.map(c => c[2]);
  const florida = stroke(land, F, {
    name: '1A Florida (pale dry stroke)', pts: FLORIDA.map(c => proj(c[0], c[1])),
    w: wf.map((v, i) => [i / (wf.length - 1), Math.max(8 * u, v * k * (P ? 0.4 : 0.55))]),
    t0: T.florida, dur: 0.6, ink: 0.42, dry: 0.3, bristles: 18, coreEnd: 0.15, rough: 0.12, seed: 8, unit: u, bleed: 3,
  });
  const sp = proj(...SUB), dl = 0.62 * k * kc;
  const sub = stroke(sea, F, {
    name: '1B B-59 mark (one heavy stroke)', pts: [[sp[0] + dl / 2, sp[1]], [sp[0], sp[1] - 1.5 * u], [sp[0] - dl / 2, sp[1] + 1 * u]],
    w: [[0, 17 * u], [0.25, 19 * u], [0.75, 14 * u], [1, 7 * u]], t0: T.sub, dur: 0.24, ink: 0.95, dry: 0.7, bristles: 7, seed: 12, unit: u, bleed: 3,
  });
  const veilW = (P ? 1.25 : 0.95) * k;
  const veil = stroke(sea, F, {
    name: '1B Deep water (veil wash over the mark)', pts: [proj(SUB[0] - 3.4, SUB[1] + 0.1), proj(SUB[0] - 0.6, SUB[1] - 0.12), proj(SUB[0] + (P ? 1.6 : 2.6), SUB[1] + 0.05)],
    w: [[0, veilW * 0.7], [0.2, veilW], [0.85, veilW * 0.9], [1, veilW * 0.6]], t0: T.veil, dur: 0.8, ink: 0.26, wash: true, grad: [1, 0.7, 0.35],
    dry: 0.8, bristles: 22, hairW: 0.5, coreEnd: 0.55, rough: 0.05, seed: 21, unit: u, bleed: 8,
  });
  const strokes = [florida, cuba, sub, veil];

  // type: small, calm, asymmetric
  const lab = (txt, o) => label(S.text, txt, { unit: u, ...o });
  const date = lab('27 October 1962', { size: P ? 50 : 46, name: '1A Date' });
  const subLab = lab('B-59, Soviet submarine', { size: P ? 40 : 36, italic: true, name: '1B Label B-59' });
  const approx = lab('position approx.', { size: P ? 32 : 28, italic: true, color: '#5E5A54', name: '1B Label approx' });
  const cubaLab = lab('Cuba', { size: P ? 44 : 40, italic: true, name: '1A Label Cuba' });

  // sound: open sea far away (we are above, looking down), a whisper of the brush
  ctx.ambience('sea-wash-calm-01', { from: Math.max(0, T.sub - 0.6 - ctx.start), to: ctx.duration, lu: -15, fade: 1.2 });
  ctx.sfx('cloth-jacket-01', T.cuba - ctx.start + 0.03, { lu: -26 });

  const S2 = SUB_SCREEN(L), tPush = ctx.start + ctx.duration - 0.5 - 0.48; // push runs into the cut (overlap starts at duration - 0.5)
  return {
    update(t) {
      const Tg = ctx.start + t;
      for (const s of strokes) s.update(Tg);
      // camera: calm creep, then a fast push into the mark that lands it where 2A paints the hull
      const pp = smootherstep(progress(Tg, tPush, tPush + 0.5));
      const pz = pp * pp;
      const s = creep(t, 0.04) * lerp(1, 1.55, pz);
      const Fp = [lerp(W / 2, sp[0], pp), lerp(H / 2, sp[1], pp)];
      const Tp = [lerp(W / 2, S2[0], pp), lerp(H / 2, S2[1], pp)];
      S.camera(Fp, Tp, s);
      const scr = q => S.toScreen(q);
      const dpos = P ? L.at(0.02, 0.9) : L.at(0.0, 0.93);
      date.set(dpos[0], dpos[1], writeIn(Tg, T.date, 0.7));
      const a = scr([sp[0] - (P ? 400 : 60) * u, sp[1] - (P ? 100 : 84) * u]);
      subLab.set(a[0], a[1], writeIn(Tg, T.sub + 0.22, 0.5) * (1 - pp));
      approx.set(a[0], a[1] + (P ? 46 : 42) * u, writeIn(Tg, T.sub + 0.55, 0.45) * (1 - pp));
      const c = scr(proj(-79.9, 21.55));
      cubaLab.set(c[0], c[1], writeIn(Tg, T.cubaLab, 0.35) * (1 - pp));
    },
  };
}
