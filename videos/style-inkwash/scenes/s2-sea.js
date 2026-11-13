// 2 · SEA — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW they are hunted from above, cut off from home · FEEL pressure, then stillness · SEE one heavy hull stroke
//         deep under graded washes; ink drops bloom around it.
// truth: VO/RC — a side section, not to scale. Ships = two small strokes (no class shown). Charges were practice
//        charges used as signals to surface (US Navy procedure; accounts agree on this).
// shots: 2A MATCH from 1C: hull painted where the mark landed · 2B washes + ships (WS) · 2C three drops bloom (one per
//        ~0.45 s, each with a distant thud) · 2D HOLD+creep in the stillness: "no word from Moscow".
import { creep, glide, lerp } from '/onclack-styles/engine/lib/anim.js';
import { makeSheet } from '../shared/stage.js';
import { stroke, bloom, label, writeIn, wordAt } from '../shared/ink.js';
import { SUB_SCREEN } from './s1-island.js';

export default function (root, ctx) {
  const S = makeSheet(root, ctx, 's2', 23);
  const { L, W, H, F } = S, u = L.unit, P = L.portrait, w = ctx.words;
  const t0 = ctx.start;
  const tw = (re, n) => wordAt(w, 1, re, n);
  const surf = (P ? 0.30 : 0.34) * H;
  const [sx, sy] = SUB_SCREEN(L);
  const Ls = P ? 0.5 * W : 0.27 * W;

  const washL = S.layer('Sea washes'), shipL = S.layer('Ships'), subL = S.layer('Submarine'), dropL = S.layer('Charges');

  // 2B sea: a dry horizon line, then 4 graded washes — pale near the surface, darker with depth
  const horizon = stroke(washL, F, { name: '2B Sea surface (dry line)', pts: [[-0.03 * W, surf + 2 * u], [0.35 * W, surf - 1 * u], [0.7 * W, surf + 1.5 * u], [1.03 * W, surf]],
    w: [[0, 4 * u], [0.3, 6 * u], [0.8, 4.5 * u], [1, 2 * u]], t0: t0 + 0.3, dur: 0.75, ink: 0.6, dry: 0.55, bristles: 6, rough: 0.15, seed: 4, unit: u, bleed: 2 });
  const bands = P ? [0.37, 0.49, 0.61, 0.73, 0.85] : [0.41, 0.56, 0.71, 0.87];
  const bh = (P ? 0.13 : 0.165) * H;
  const inks = P ? [0.09, 0.12, 0.16, 0.2, 0.25] : [0.09, 0.13, 0.18, 0.25];
  const ends = P ? [1.16, 1.22, 1.15, 1.2, 1.18] : [1.16, 1.22, 1.14, 1.2];
  const washes = bands.map((b, i) => stroke(washL, F, {
    name: `2B Wash ${i + 1}`, pts: [[-0.1 * W, b * H + (i % 2 ? 6 : -4) * u], [0.3 * W, b * H - 8 * u], [0.62 * W, b * H + 7 * u], [ends[i] * W, b * H + (i % 2 ? -10 : 4) * u]],
    w: [[0, bh * 0.85], [0.15, bh], [0.92, bh * 0.9], [1, bh * 0.4]], t0: t0 + 0.42 + i * 0.2, dur: 0.62, ink: inks[i], wash: true,
    grad: [1, 0.78, 0.6], dry: 0.9, bristles: 26, hairW: 0.45, coreEnd: 0.7, rough: 0.04, seed: 30 + i, unit: u, bleed: 9,
  }));

  // 2A the submarine: ONE heavy stroke, bow (right) to stern, plus a short flick for the sail
  const bow = [sx + Ls / 2, sy];
  const hull = stroke(subL, F, { name: '2A B-59 hull (one heavy stroke)', pts: [bow, [sx + Ls * 0.15, sy - 3 * u], [sx - Ls * 0.25, sy - 1 * u], [sx - Ls / 2, sy + 4 * u]],
    w: [[0, 34 * u], [0.06, 46 * u], [0.45, 44 * u], [0.8, 30 * u], [1, 9 * u]], t0: t0 + 0.0, dur: 0.42, ink: 0.95, dry: 0.7, bristles: 12, coreEnd: 0.6, rough: 0.06, seed: 9, unit: u, bleed: 5 });
  const sail = stroke(subL, F, { name: '2A B-59 sail (flick)', pts: [[sx + Ls * 0.1, sy - 14 * u], [sx + Ls * 0.06, sy - 40 * u], [sx + Ls * 0.0, sy - 50 * u]],
    w: [[0, 26 * u], [0.5, 22 * u], [1, 10 * u]], t0: t0 + 0.44, dur: 0.14, ink: 0.92, dry: 0.6, bristles: 6, seed: 10, unit: u, bleed: 3 });

  // ships: two small strokes on the surface (hull + mast flick each)
  const shipX = P ? [0.3 * W, 0.66 * W] : [0.38 * W, 0.67 * W], sl = (P ? 120 : 110) * u;
  const ships = shipX.flatMap((x, i) => {
    const ts = tw(/^American/) + 0.0 + i * 0.32;
    return [
      stroke(shipL, F, { name: `2B Ship ${i + 1} hull`, pts: [[x - sl / 2, surf - 9 * u], [x, surf - 6 * u], [x + sl / 2, surf - 11 * u]], w: [[0, 9 * u], [0.3, 15 * u], [1, 5 * u]],
        t0: ts, dur: 0.26, ink: 0.85, dry: 0.6, bristles: 6, seed: 60 + i, unit: u, bleed: 2 }),
      stroke(shipL, F, { name: `2B Ship ${i + 1} mast`, pts: [[x + 6 * u, surf - 14 * u], [x + 2 * u, surf - 44 * u]], w: [[0, 8 * u], [1, 3 * u]],
        t0: ts + 0.27, dur: 0.1, ink: 0.85, dry: 0.5, bristles: 4, seed: 70 + i, unit: u, bleed: 1.5 }),
    ];
  });

  // 2C depth charges: drops fall as thin trails and bloom in the wet wash
  const tb = [tw(/^drop/) + 0.05, tw(/^practice/) + 0.14, tw(/^depth/) + 0.1];
  const spots = P ? [[sx - 0.26 * W, sy - 0.12 * H], [sx + 0.2 * W, sy - 0.17 * H], [sx + 0.03 * W, sy - 0.07 * H]]
    : [[sx - 0.17 * W, sy - 0.13 * H], [sx + 0.13 * W, sy - 0.21 * H], [sx + 0.03 * W, sy - 0.09 * H]];
  const froms = [shipX[0], shipX[1], shipX[0] + 30 * u];
  const blooms = spots.map((p, i) => bloom(dropL, F, { at: p, from: [froms[i], surf + 4 * u], t0: tb[i], fall: 0.42, R: [120, 150, 105][i] * u, seed: 80 + i * 5, unit: u, name: `2C Depth charge ${i + 1}` }));

  const items = [horizon, ...washes, hull, sail, ...ships, ...blooms];

  const lab = (txt, o) => label(S.text, txt, { unit: u, ...o });
  const subLab = lab('B-59', { size: P ? 40 : 36, italic: true, name: '2A Label B-59' });
  const shipLab = lab('U.S. Navy ships', { size: P ? 40 : 36, italic: true, name: '2B Label ships' });
  const chargeLab = lab('practice depth charges', { size: P ? 40 : 36, italic: true, name: '2C Label charges' });
  const chargeLab2 = lab('signals to surface', { size: P ? 32 : 28, italic: true, color: '#5E5A54', name: '2C Label signals' });
  const moscow = lab('No word from Moscow for days.', { size: P ? 50 : 46, name: '2D Moscow silent' });
  const tMoscow = tw(/^Moscow/) - 0.05;

  // sound: inside the water now — close hull wash; three distant thuds on the blooms; a single drip in the silence
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -15, fade: 0.6 });
  ctx.sfx('boom-distant-01', tb[0] + 0.42 - t0, { lu: -6 });
  ctx.sfx('boom-slapback-01', tb[1] + 0.42 - t0, { lu: -8 });
  ctx.sfx('boom-distant-01', tb[2] + 0.42 - t0, { lu: -10 });
  ctx.sfx('drips-wood-01', tw(/^silent/) + 0.35 - t0, { lu: -20 });

  return {
    update(t) {
      const T = t0 + t;
      for (const it of items) it.update(T);
      // camera: almost still; a slow settle toward the hull while the world goes quiet
      const s = creep(t, 0.05) * glide(T, tMoscow - 0.4, tMoscow + 2.4, 1, 1.04);
      S.camera([sx, sy], [sx, sy], s);
      const sc = q => S.toScreen(q);
      const a = sc([sx - Ls / 2 - 10 * u, sy + 46 * u]);
      subLab.set(a[0], a[1], writeIn(T, t0 + 0.55, 0.35));
      const b = sc([shipX[0] - sl / 2, surf - 102 * u]);
      shipLab.set(b[0], b[1], writeIn(T, tw(/^ships/) + 0.05, 0.4));
      const c = sc(P ? [spots[0][0] - 0.02 * W, spots[0][1] + 0.1 * H] : [spots[0][0] - 0.11 * W, spots[0][1] + 0.08 * H]);
      chargeLab.set(c[0], c[1], writeIn(T, tw(/^depth/), 0.45));
      chargeLab2.set(c[0], c[1] + (P ? 46 : 42) * u, writeIn(T, tw(/^depth/) + 0.4, 0.4));
      const m = P ? L.at(0.0, 0.0) : L.at(0.58, 0.06);
      moscow.set(m[0], m[1], writeIn(T, tMoscow, 0.8));
    },
  };
}
