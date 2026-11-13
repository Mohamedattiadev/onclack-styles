// SHEET 2 — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW ships above, charges falling, no word from Moscow · FEEL dread · SEE three bursts between ships and boat.
// truth: ships/boat = RC sketches (types, not exact ships); bursts = VO; tally = one mark per burst we show
// (the real number of charges is not claimed); "practice" charges as stated in later accounts.
import { Sheet, PAL, seq, fit, camAt, pastelPatch, blob } from '../shared/sketch.js';
import { submarine, ship } from '../shared/figures.js';
import { creep, rand } from '/onclack-styles/engine/lib/anim.js';

export default function (root, ctx) {
  const L = ctx.layout, Pt = L.portrait, W = ctx.width, H = ctx.height, sf = L.safe, u = L.unit;
  const S = new Sheet(root, ctx, { seed: 23, name: 'Sheet 2' });
  const T0 = ctx.start;

  // ---- 2A surface + the boat below (re-stated fast: "Above it") ----
  const sy = H * (Pt ? 0.3 : 0.31), sx0 = W * 0.035, sx1 = Pt ? W * 0.965 : W * 0.66;
  const surf = S.stroke([[sx0, sy + 3], [sx0 + (sx1 - sx0) * 0.4, sy - 4], [sx1, sy + 2]], { w: 4.2 * u, over: 14, taper: [0.05, 0.3] });
  seq([surf], 7.42, { speed: 3600 });
  const subPl = Pt ? { x: W * 0.5, y: H * 0.585, s: 0.6 * u } : { x: W * 0.37, y: H * 0.8, s: 0.6 * u };
  const sub = submarine(S, subPl, { seed: 8 });
  fit([...sub.gesture.slice(0, 2), ...sub.contour.slice(0, 3)], 7.6, 8.05);
  for (const s of [sub.gesture[2], ...sub.contour.slice(3), ...sub.ticks, ...sub.chalk]) { s.t0 = 99; s.t1 = 99; }   // left out: a quick re-statement
  fit(sub.tone, 8.05, 8.3);
  S.smudge(sub.smudge, { t0: 8.1, t1: 8.6, alpha: 0.3, blur: 14 * u });
  S.name('2A Boat below (quick sketch)', [subPl.x - 520 * subPl.s, subPl.y - 165 * subPl.s, 1040 * subPl.s, 230 * subPl.s]);
  const water = pastelPatch(S, blob(subPl.x, subPl.y - 40 * u, 700 * subPl.s, 230 * subPl.s, 4), { color: PAL.blue, w: 26 * u, seed: 44, alpha: 0.42 });
  seq(water, 8.3, { speed: 16000 });

  // ---- 2B three ships on the surface, ochre on the hulls ----
  const xs = Pt ? [0.2, 0.5, 0.8] : [0.12, 0.33, 0.54];
  const ships = xs.map((fx, i) => ship(S, { x: W * fx + (i - 1) * 6 * u, y: sy - 2, s: (Pt ? 0.78 : 1.05) * u * (1 - Math.abs(i - 1) * 0.06) }, { seed: 30 + i }));
  ships.forEach((sp, i) => {
    const a = 8.04 + i * 0.29;
    fit([...sp.gesture, ...sp.contour], a, a + 0.27);
    S.name(`2B Ship ${i + 1} (destroyer type, sketch)`, [W * xs[i] - 130 * u, sy - 80 * u, 260 * u, 90 * u]);
  });
  seq(ships.flatMap((s) => s.pastel), 8.95, { speed: 9000, gap: 0.02 });

  // ---- 2C charges: dotted fall from a ship → burst (charcoal rays + white chalk ring) ----
  const bursts = (Pt ? [[0.24, 0.43], [0.62, 0.47], [0.4, 0.5]] : [[0.18, 0.55], [0.52, 0.6], [0.33, 0.66]]).map(([fx, fy], i) => ({ x: W * fx, y: H * fy, tb: [9.42, 9.92, 10.42][i], from: i === 2 ? 1 : i * 2 }));
  bursts.forEach((b, i) => {
    const shipX = W * xs[b.from], top = sy + 22 * u, dots = [];
    for (let k = 0; k < 7; k++) {
      const f = k / 6, x = shipX + (b.x - shipX) * f * f, y = top + (b.y - 30 * u - top) * f;
      dots.push(S.stroke([[x, y], [x + 1, y + 9 * u]], { w: 3.4 * u, dur: 0.025, wobble: 0, taper: [0.2, 0.3] }));
    }
    seq(dots, b.tb - 0.42, { gap: 0.03 });
    // an underwater burst: two rough rings pushed out + a scrubbed chalk core (no cartoon star)
    const sp = [], a0 = rand(i * 9) * 6, turns = 2.4;
    for (let k = 0; k <= 46; k++) {
      const f = k / 46, a = a0 + f * turns * Math.PI * 2, R = (14 + f * 70) * u * (1 + 0.32 * (rand(k * 3 + i * 17) - 0.5));
      sp.push([b.x + Math.cos(a) * R, b.y + Math.sin(a) * R * 0.78]);
    }
    const rings = [S.stroke(sp, { w: 3.2 * u, alpha: 0.75, wobble: 3, dur: 0.22, taper: [0.05, 0.5], per: 3 })];
    seq(rings, b.tb, { gap: 0.02 });
    seq(pastelPatch(S, blob(b.x, b.y, 46 * u, 38 * u, 60 + i, 9), { color: PAL.chalk, w: 16 * u, seed: 70 + i, alpha: 0.75, angles: [35, -40] }), b.tb + 0.03, { speed: 9000 });
    const bub = [];
    for (let k = 0; k < 5; k++) { const x = b.x + (rand(i * 5 + k) - 0.5) * 70 * u, y = b.y - (70 + k * 22) * u; bub.push(S.stroke([[x, y], [x + 7 * u, y - 4 * u], [x + 9 * u, y + 4 * u], [x + 1, y + 5 * u], [x, y]], { layer: 'chalk', w: 2.6 * u, dur: 0.03, wobble: 0 })); }
    seq(bub, b.tb + 0.25, { gap: 0.03 });
    S.name(`2C Burst ${i + 1}`, [b.x - 90 * u, b.y - 90 * u, 180 * u, 180 * u]);
  });

  // ---- 2D margin notes: tally (one per burst shown), then Moscow's silence ----
  const nx = Pt ? sf.x + 30 * u : W * 0.7, ny = Pt ? H * 0.69 : H * 0.44;
  S.text('practice charges', nx, ny, { size: 64 * u, t0: 9.3, cps: 22, rot: -1.5 });
  bursts.forEach((b, i) => {
    const x = nx + (Pt ? 470 : 24) * u + i * 22 * u, y = ny + (Pt ? -48 : 30) * u;
    seq([S.stroke([[x, y], [x + 3 * u, y + 56 * u]], { w: 4.4 * u, dur: 0.07, taper: [0.1, 0.4] })], b.tb + 0.05);
  });
  S.name('2D Tally: one mark per burst shown', [nx, ny - 60 * u, 470 * u, 160 * u]);
  const my = ny + (Pt ? 100 : 190) * u;
  const mos = S.text('Moscow:', nx, my, { size: 70 * u, t0: 10.9, cps: 14, rot: -1 });
  S.text('silent', nx + mos.total + 20 * u, my, { size: 70 * u, t0: 11.86, cps: 14, rot: 1 });
  const dl = my + 84 * u, dash = [];
  for (let k = 0; k < 6; k++) dash.push(S.stroke([[nx + k * 46 * u, dl - 20 * u], [nx + k * 46 * u + 26 * u, dl - 21 * u]], { w: 3.6 * u, dur: 0.05, wobble: 0 }));
  seq(dash, 12.1, { gap: 0.03 });
  S.text('days', nx + 290 * u, dl, { size: 70 * u, t0: 12.44, cps: 12, rot: -2 });
  S.name('2D Moscow: silent — days', [nx, my - 70 * u, 470 * u, 180 * u]);

  // ---- camera: ships → down to the bursts → across to the margin ----
  const C = Pt
    ? [[7.2, 1.0, W * 0.5, H * 0.46], [8.0, 1.0, W * 0.5, H * 0.46], [9.2, 1.12, W * 0.5, H * 0.4], [10.6, 1.06, W * 0.5, H * 0.5], [12.6, 1.03, W * 0.5, H * 0.58]]
    : [[7.2, 1.0, W * 0.5, H * 0.5], [8.0, 1.0, W * 0.5, H * 0.5], [9.2, 1.04, W * 0.46, H * 0.47], [10.6, 1.04, W * 0.47, H * 0.55], [12.6, 1.035, W * 0.53, H * 0.55]];

  // ---- sound ----
  const at = (tg) => tg - T0;
  ctx.ambience('sea-water-close-01', { from: 0, to: at(11.05), lu: -21, fade: 0.5 });
  ctx.ambience('sea-water-close-01', { from: at(10.85), to: ctx.duration, lu: -30, fade: 0.6 });       // the drop: thinner after the last charge
  ctx.sfx('sand-sprinkle-01', at(8.04), { lu: -25, duration: 0.85, fadeIn: 0.03, fadeOut: 0.3 });
  bursts.forEach((b, i) => ctx.sfx(i === 1 ? 'boom-slapback-01' : 'boom-distant-01', at(b.tb) + 1 / 30, { lu: [-11, -15, -13][i], ...(i === 1 ? { duration: 2.2, fadeOut: 0.6 } : {}) }));
  ctx.sfx('door-creak-01', at(11.15), { lu: -27 });                                                   // the hull answers
  const flipAt = ctx.duration - 0.5;
  ctx.sfx('page-turn-01', flipAt - 0.62, { lu: -14, duration: 1.3, fadeOut: 0.25 });

  return {
    update(tl) {
      const tg = T0 + tl;
      const [s, fx, fy] = camAt(tg, C);
      S.camera(s * creep(tl, 0.04), fx, fy);
      S.render(tg);
      S.flip((tl - flipAt) / 0.5);
    },
  };
}
