// Our own drawings, in local units, as stroke recipes. Each builder returns stroke groups in drawing order:
// gesture (3 light lines) → contour → tone (scribble/smudge) → chalk → pastel. The scene schedules them.
// No faces anywhere: people are drawn from behind.
import { place, scribble, PAL } from './sketch.js';

const P = (pts, pl) => place(pts, pl);

/** Foxtrot-class boat (B-59 type), side view, bow LEFT, length 1000 local units. */
export function submarine(S, pl, { seed = 1 } = {}) {
  const k = pl.s, w = (v) => Math.max(1.5, v * k * 2.1);
  const g = {
    gesture: [
      S.stroke(P([[-540, 8], [-200, -26], [200, -22], [540, 4]], pl), { w: w(2.2), alpha: 0.32, over: 10 }),
      S.stroke(P([[-520, 12], [0, 50], [520, 2]], pl), { w: w(2), alpha: 0.28 }),
      S.stroke(P([[-200, -30], [-150, -124], [-30, -112]], pl), { w: w(2), alpha: 0.3 }),
    ],
    contour: [
      S.stroke(P([[-500, 2], [-488, -16], [-460, -30], [-400, -38], [-200, -40], [100, -40], [330, -36], [440, -24], [500, -6]], pl), { w: w(3.6), over: 14, taper: [0.06, 0.2] }),
      S.stroke(P([[-500, 2], [-480, 18], [-430, 32], [-300, 42], [0, 44], [300, 40], [420, 26], [500, -2]], pl), { w: w(4.2), over: 12, taper: [0.08, 0.25] }),
      S.stroke(P([[-192, -39], [-178, -92], [-160, -112], [-120, -118], [-55, -117], [-38, -104], [-28, -40]], pl), { w: w(3.4), over: 8 }),
      S.stroke(P([[-150, -103], [-60, -105]], pl), { w: w(1.8), alpha: 0.7 }),
      S.stroke(P([[-118, -118], [-115, -160]], pl), { w: w(2.2), taper: [0.05, 0.6] }),
      S.stroke(P([[-92, -117], [-90, -146]], pl), { w: w(2), taper: [0.05, 0.6] }),
      S.stroke(P([[470, -14], [494, -36], [506, -30], [498, -6]], pl), { w: w(2.6) }),
      S.stroke(P([[468, 12], [492, 30]], pl), { w: w(2.4) }),
      // a second, harder pass on the belly (the artist re-states the weight)
      S.stroke(P([[-420, 36], [-300, 46], [0, 49], [280, 44]], pl), { w: w(3), alpha: 0.75, over: 20 }),
    ],
    tone: [
      S.stroke(P(scribble([[-470, 12], [-300, 38], [0, 42], [300, 38], [440, 20], [300, 20], [0, 22], [-300, 18]], { gap: 8, angle: -12, seed: seed + 3 }), pl),
        { w: w(2.6), alpha: 0.5, raw: true, wobble: 0.6, taper: [0.02, 0.05], minW: 0.6 }),
      S.stroke(P(scribble([[-72, -112], [-40, -104], [-30, -42], [-74, -42]], { gap: 9, angle: 70, seed: seed + 4 }), pl),
        { w: w(2.4), alpha: 0.55, raw: true, wobble: 0.5, taper: [0.02, 0.05], minW: 0.6 }),
    ],
    ticks: Array.from({ length: 22 }, (_, i) => -400 + i * 36).map((x, i) =>
      S.stroke(P([[x, -27 + (i % 3)], [x + 2, -18 + (i % 2)]], pl), { w: w(2.2), alpha: 0.7, taper: [0.2, 0.4], dur: 0.025, wobble: 0 })),
    chalk: [
      S.stroke(P([[-470, -30], [-200, -44], [200, -44], [430, -30]], pl), { layer: 'chalk', w: w(3.2), alpha: 0.85, over: 6 }),
      S.stroke(P([[-158, -115], [-62, -121]], pl), { layer: 'chalk', w: w(2.6), alpha: 0.8 }),
    ],
    smudge: P([[-470, 30], [-200, 70], [200, 72], [460, 30], [200, 48], [-200, 50]], pl),
  };
  return g;
}

/** A surface warship (destroyer type), bow LEFT, length 300 local units, ochre pastel on the hull. */
export function ship(S, pl, { seed = 1 } = {}) {
  const k = pl.s, w = (v) => Math.max(1.4, v * k * 1.6);
  return {
    gesture: [S.stroke(P([[-170, -4], [0, -2], [170, -6]], pl), { per: 2, w: w(2), alpha: 0.3 }),
      S.stroke(P([[-60, -10], [-30, -60], [30, -40]], pl), { per: 2, w: w(1.8), alpha: 0.25 })],
    contour: [
      S.stroke(P([[-152, -20], [-140, 0], [140, 0], [152, -12]], pl), { per: 2, w: w(3), over: 6 }),
      S.stroke(P([[-152, -20], [-60, -14], [152, -12]], pl), { per: 2, w: w(2.4) }),
      S.stroke(P([[-70, -14], [-68, -40], [-20, -42], [-18, -14]], pl), { per: 2, w: w(2.6) }),
      S.stroke(P([[4, -12], [10, -46], [34, -46], [38, -12]], pl), { per: 2, w: w(2.6) }),
      S.stroke(P([[-44, -42], [-41, -92]], pl), { per: 2, w: w(2), taper: [0.05, 0.6] }),
      S.stroke(P([[-58, -76], [-28, -77]], pl), { per: 2, w: w(1.8) }),
      S.stroke(P([[-112, -18], [-112, -27], [-94, -28]], pl), { per: 2, w: w(2) }),
    ],
    pastel: [S.stroke(P(scribble([[-140, -18], [140, -12], [140, -2], [-138, -2]], { gap: 6, angle: -8, seed: seed + 9 }), pl),
      { layer: 'pastel', color: PAL.ochre, w: w(4), alpha: 0.8, raw: true, wobble: 0.4, taper: [0.02, 0.05], minW: 0.7 }),
    S.stroke(P(scribble([[-68, -40], [-20, -42], [-18, -16], [-68, -16]], { gap: 7, angle: 60, seed: seed + 10 }), pl),
      { layer: 'pastel', color: PAL.ochre, w: w(3.4), alpha: 0.7, raw: true, wobble: 0.4, taper: [0.02, 0.05], minW: 0.7 })],
  };
}

/** An officer seen from BEHIND (no face), local origin = bottom centre, height ≈ 420. */
export function officer(S, pl, { seed = 1, lean = 0 } = {}) {
  const k = pl.s, w = (v) => Math.max(1.5, v * k * 2.1), r = (n) => Math.sin(seed * 9.1 + n) * 6;
  const tilt = lean * 0.012, hx = lean * 0.5, hy = -338;
  const head = [];
  for (let i = 0; i <= 15; i++) {
    const a = (205 + i * 25) * Math.PI / 180, x = Math.cos(a) * (31 + r(i) * 0.12), y = Math.sin(a) * 39;
    head.push([hx + x * Math.cos(tilt) - y * Math.sin(tilt), hy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
  }
  const sh = r(3) * 1.6;   // one shoulder a little higher: a real back is never symmetric
  return {
    gesture: [
      S.stroke(P([[hx * 0.6, -300], [lean * 0.4 + 4, -190], [2, -20]], pl), { w: w(2), alpha: 0.26 }),
      S.stroke(P([[-158, -236 - sh], [lean * 0.4, -276], [154, -244 + sh]], pl), { w: w(2), alpha: 0.28, over: 10 }),
      S.stroke(P([[-150, -60], [-60, -120], [10, -250]], pl), { w: w(1.6), alpha: 0.18 }),
    ],
    contour: [
      S.stroke(P(head, pl), { w: w(3), taper: [0.1, 0.2] }),
      S.stroke(P([[hx - 31, -346], [hx - 37, -336], [hx - 33, -322]], pl), { w: w(2.2), alpha: 0.8 }),
      S.stroke(P([[hx + 31, -344], [hx + 37, -334], [hx + 32, -320]], pl), { w: w(2.2), alpha: 0.8 }),
      S.stroke(P([[hx * 0.7 - 15, -302], [-18, -286]], pl), { w: w(2.6) }),
      S.stroke(P([[hx * 0.7 + 15, -302], [19, -285]], pl), { w: w(2.6) }),
      S.stroke(P([[-20, -284], [-66, -272 - sh], [-116, -254 - sh], [-140, -218 - sh * 0.5], [-148, -150], [-154, -30]], pl), { w: w(3.8), over: 8 }),
      S.stroke(P([[20, -284], [70, -270 + sh], [118, -250 + sh], [140, -212 + sh * 0.5], [150, -150], [153, -34]], pl), { w: w(4), over: 8 }),
      S.stroke(P([[-22, -284], [0, -276], [24, -283]], pl), { w: w(2.4), alpha: 0.85 }),
      S.stroke(P([[-108, -200], [-114, -120], [-118, -40]], pl), { w: w(2.2), alpha: 0.6, taper: [0.3, 0.5] }),
      S.stroke(P([[112, -196], [118, -120], [120, -44]], pl), { w: w(2.2), alpha: 0.6, taper: [0.3, 0.5] }),
      S.stroke(P([[-60, -236], [-30, -200], [-40, -150]], pl), { w: w(1.8), alpha: 0.45, taper: [0.4, 0.5] }),
      S.stroke(P([[64, -232], [36, -196], [44, -150]], pl), { w: w(1.8), alpha: 0.45, taper: [0.4, 0.5] }),
    ],
    tone: [
      S.stroke(P(scribble([[hx - 28, -372], [hx + 26, -374], [hx + 32, -346], [hx - 32, -344]], { gap: 6, angle: 75, seed: seed + 1 }), pl),
        { w: w(2.6), alpha: 0.8, raw: true, wobble: 0.3, taper: [0.02, 0.05], minW: 0.6 }),
      S.stroke(P(scribble([[40, -262], [118, -246], [140, -208], [148, -40], [64, -46], [52, -200]], { gap: 9, angle: -55, seed: seed + 2 }), pl),
        { w: w(2.6), alpha: 0.5, raw: true, wobble: 0.5, taper: [0.02, 0.05], minW: 0.6 }),
      S.stroke(P(scribble([[-14, -300], [16, -300], [18, -284], [-16, -284]], { gap: 5, angle: 10, seed: seed + 3 }), pl),
        { w: w(2.2), alpha: 0.6, raw: true, wobble: 0.2, taper: [0.02, 0.05], minW: 0.6 }),
    ],
    chalk: [S.stroke(P([[-26, -283], [-80, -270 - sh], [-122, -246 - sh]], pl), { layer: 'chalk', w: w(3.4), alpha: 0.85 }),
      S.stroke(P([[hx - 28, -352], [hx - 20, -372], [hx + 2, -378]], pl), { layer: 'chalk', w: w(2.6), alpha: 0.75 })],
    // pastel tone for "yes" (ochre) or for the third man (cold blue)
    fill: (color) => S.stroke(P(scribble([[-116, -250], [-60, -266], [60, -266], [116, -248], [138, -150], [142, -60], [-142, -60], [-138, -150]], { gap: 11, angle: -30, seed: seed + 5, loose: 0.35 }), pl),
      { layer: 'pastel', color, w: w(5), alpha: 0.72, raw: true, wobble: 0.6, taper: [0.02, 0.05], minW: 0.7 }),
    box: P([[-155, -392], [155, 0]], pl),
  };
}

/** The nuclear torpedo in its tube, nose RIGHT, length 600 local units. */
export function torpedo(S, pl, { seed = 1 } = {}) {
  const k = pl.s, w = (v) => Math.max(1.5, v * k * 2.1);
  return {
    gesture: [
      S.stroke(P([[-440, -50], [430, -52]], pl), { w: w(2), alpha: 0.3, over: 20 }),
      S.stroke(P([[-440, 52], [430, 50]], pl), { w: w(2), alpha: 0.28, over: 20 }),
      S.stroke(P([[-360, 0], [300, -2]], pl), { w: w(2), alpha: 0.25 }),
    ],
    contour: [
      S.stroke(P([[-300, -30], [0, -31], [230, -30], [268, -22], [294, -7], [300, 0], [294, 7], [268, 22], [230, 30], [0, 31], [-300, 30]], pl), { w: w(3.6), over: 6 }),
      S.stroke(P([[-300, -30], [-348, -13], [-358, 0], [-348, 13], [-300, 30]], pl), { w: w(3) }),
      S.stroke(P([[-326, -21], [-358, -44], [-372, -42], [-350, -14]], pl), { w: w(2.4) }),
      S.stroke(P([[-326, 21], [-358, 44], [-372, 42], [-350, 14]], pl), { w: w(2.4) }),
      S.stroke(P([[-367, -16], [-367, 16]], pl), { w: w(2.6) }),
      S.stroke(P([[-200, -31], [-202, 31]], pl), { w: w(2), alpha: 0.7 }),
      S.stroke(P([[150, -31], [152, 31]], pl), { w: w(2), alpha: 0.7 }),
      S.stroke(P([[-430, -50], [0, -52], [420, -50]], pl), { w: w(3), over: 18 }),
      S.stroke(P([[-430, 52], [0, 51], [420, 50]], pl), { w: w(3.2), over: 18 }),
      S.stroke(P([[420, -50], [434, -30], [440, 0], [434, 30], [420, 50]], pl), { w: w(3) }),
    ],
    tone: [S.stroke(P(scribble([[-300, 6], [230, 6], [292, 8], [230, 30], [-300, 30]], { gap: 7, angle: -10, seed: seed + 6 }), pl),
      { w: w(2.6), alpha: 0.5, raw: true, wobble: 0.4, taper: [0.02, 0.05], minW: 0.6 }),
    S.stroke(P(scribble([[-430, 36], [420, 36], [436, 50], [-430, 50]], { gap: 6, angle: -4, seed: seed + 7 }), pl),
      { w: w(2.2), alpha: 0.4, raw: true, wobble: 0.3, taper: [0.02, 0.05], minW: 0.6 })],
    chalk: [S.stroke(P([[-290, -21], [0, -23], [226, -22], [262, -14]], pl), { layer: 'chalk', w: w(3.2), alpha: 0.85 })],
    box: P([[-440, -60], [440, 60]], pl),
  };
}

/** Quick corner map of Cuba from Natural Earth rings, projected into a box [x, y, w, h]. */
export function cubaMap(S, geo, [bx, by, bw, bh], { lon0 = -86, lon1 = -68, lat0 = 18, lat1 = 28 } = {}) {
  const kx = bw / (lon1 - lon0), ky = bh / (lat1 - lat0), k = Math.min(kx, ky * 1.05);
  const proj = ([lo, la]) => [bx + (lo - lon0) * k, by + (lat1 - la) * k * 1.05];
  const inBox = ([lo, la]) => lo > lon0 && lo < lon1 && la > lat0 && la < lat1;
  const strokes = [];
  const thin = (ring, step) => ring.filter((_, i) => i % step === 0);
  for (const f of geo.features) {
    if (!['Cuba', 'United States of America', 'Bahamas', 'Haiti', 'Dominican Rep.'].includes(f.name)) continue;
    const runs = [];
    for (const ring of f.rings) {
      let run = [];
      for (const p of ring) { if (inBox(p)) run.push(p); else { if (run.length) runs.push(run); run = []; } }
      if (run.length) runs.push(run);
    }
    for (const pts of runs) {
      if (pts.length < 10) continue;
      const main = f.name === 'Cuba';
      const step = main ? 3 : 4;
      const t = thin(pts, step).map(proj);
      // the hand draws a long coast in 2–3 pieces
      const n = main ? 3 : 1, per = Math.ceil(t.length / n);
      for (let i = 0; i < n; i++) {
        const seg = t.slice(Math.max(0, i * per - 1), (i + 1) * per + 1);
        if (seg.length > 2) strokes.push(S.stroke(seg, { raw: true, w: main ? 3.4 : 2.4, alpha: main ? 0.9 : 0.6, wobble: 0.8, over: 3, taper: [0.08, 0.15] }));
      }
    }
  }
  return { strokes, proj };
}
