// BENT WIRE — the objects, each authored as ONE continuous wire in local units.
import { arc, fillet } from './wire.js';

const back = (list, o = [0.009, -0.005]) => list.slice().reverse().map(([x, y]) => [x + o[0], y + o[1]]);

// ---------- figures (height 1: head top 0 → feet 1, facing right; no faces — the head is an empty loop) ----------
// One wire runs round the whole silhouette: down the outside of one leg, up between the legs, down the other,
// up the side, out and back along each arm, round the head. Arms are narrow hairpins, so limbs have volume.
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
function limb(sh, e, h, hand, w = 0.019) {
  const d = sub2(h, sh), l = Math.hypot(...d) || 1, n = [-d[1] / l * w, d[0] / l * w];
  return [sh, [e[0] + n[0], e[1] + n[1]], ...hand, [e[0] - n[0], e[1] - n[1]]];
}
const HANDS = {
  none: (h) => [h],
  point: ([x, y]) => [[x, y], [x + 0.085, y + 0.03], [x + 0.08, y + 0.042], [x + 0.004, y + 0.016]],
  stop: ([x, y]) => [[x, y + 0.01], [x + 0.02, y - 0.004], [x + 0.016, y - 0.075], [x + 0.03, y - 0.08], [x + 0.042, y - 0.012], [x + 0.06, y - 0.042], [x + 0.07, y - 0.034], [x + 0.044, y + 0.018], [x + 0.004, y + 0.026]],
};
function head({ cx, cy, rx, ry }, cap) {
  if (!cap) return arc(cx, cy, rx, ry, 70, -250, 30);
  return [
    ...arc(cx, cy, rx, ry, 70, -48, 16),
    [cx + rx * 1.95, cy - ry * 0.5], [cx + rx * 1.9, cy - ry * 0.68], [cx - rx * 1.2, cy - ry * 0.72],
    [cx - rx * 1.25, cy - ry * 1.28], [cx + rx * 0.95, cy - ry * 1.42], [cx + rx * 1.0, cy - ry * 0.78],
    ...arc(cx, cy, rx, ry, -132, -250, 12),
  ];
}
export function figure(P) {
  const hipY = 0.53, [kL, kR] = P.knees, [aL, aR] = P.ankles, [tL, tR] = P.toes;
  const footL = tL < 0 ? [[aL + tL, 1.0], [aL + 0.03, 1.0]] : [[aL - 0.03, 1.0], [aL + tL, 1.0]];
  const footR = tR > 0 ? [[aR - 0.03, 1.0], [aR + tR, 1.0]] : [[aR + tR, 1.0], [aR + 0.03, 1.0]];
  let pts = [
    [-0.082, 0.45], [-0.095, 0.56], [kL[0] - 0.036, kL[1]], [aL - 0.027, 0.965], ...footL, [aL + 0.024, 0.96], [kL[0] + 0.03, kL[1] + 0.01],
    [(kL[0] + kR[0]) / 2, 0.6],
    [kR[0] - 0.03, kR[1] + 0.01], [aR - 0.024, 0.96], ...footR, [aR + 0.027, 0.965], [kR[0] + 0.036, kR[1]], [0.095, 0.56], [0.082, 0.45],
    ...limb([0.11, 0.24], P.armR[0], P.armR[1], HANDS[P.handR ?? 'none'](P.armR[1])), [0.08, 0.3], [0.1, 0.25],
    [0.028, 0.205], ...head(P.head, P.cap), [-0.028, 0.205],
    ...limb([-0.11, 0.24], P.armL[0], P.armL[1], HANDS[P.handL ?? 'none'](P.armL[1])), [-0.08, 0.3], [-0.088, 0.42],
  ];
  pts = pts.map(([x, y]) => [x + (y < hipY ? (hipY - y) * (P.lean ?? 0) : 0), y]);
  if (P.mirror) pts = pts.map(([x, y]) => [-x, y]);
  return fillet(pts, 0.012, 5);
}

/** Officer 1 — upright, hands clasped behind the back, naval cap. */
export const OFF1 = () => figure({
  knees: [[-0.055, 0.77], [0.05, 0.77]], ankles: [-0.062, 0.058], toes: [-0.08, 0.08],
  head: { cx: 0.0, cy: 0.115, rx: 0.05, ry: 0.068 }, cap: true,
  armL: [[-0.16, 0.37], [-0.05, 0.45]], armR: [[0.16, 0.37], [0.05, 0.45]], lean: -0.03,
});
/** Officer 2 — leans in, wide stance, one hand on the hip, the other points forward and down ("go"). No cap. */
export const OFF2 = () => figure({
  knees: [[-0.1, 0.77], [0.11, 0.76]], ankles: [-0.14, 0.15], toes: [-0.07, 0.085],
  head: { cx: 0.01, cy: 0.12, rx: 0.05, ry: 0.066 }, cap: false,
  armL: [[-0.19, 0.36], [-0.085, 0.46]], armR: [[0.17, 0.36], [0.3, 0.43]], handR: 'point', lean: 0.18,
});
/** Arkhipov — faces the other two, feet together, still; bent arm with an open hand at chest height (stop). Cap. */
export const OFF3 = () => figure({
  knees: [[-0.035, 0.77], [0.035, 0.77]], ankles: [-0.036, 0.036], toes: [0.07, 0.085],
  head: { cx: 0.0, cy: 0.115, rx: 0.05, ry: 0.068 }, cap: true,
  armL: [[-0.13, 0.38], [-0.125, 0.52]], armR: [[0.2, 0.37], [0.3, 0.31]], handR: 'stop', lean: 0, mirror: true,
});
export const OFF3_HAND = [0.125, 0.52]; // the hanging hand (after mirror) — the copper NO is fed out of it

// ---------- vessels and weapons (width 1, centred on 0,0) ----------
/** Foxtrot-class-like submarine in profile (B-59 was a Project 641 boat). */
export const SUB = () => fillet([
  [-0.47, 0.02], [-0.2, 0.05], [0.25, 0.05], [0.42, 0.035], [0.5, 0.0], [0.47, -0.035], [0.35, -0.045], [0.12, -0.05],
  [0.09, -0.06], [0.07, -0.17], [-0.03, -0.172], [-0.03, -0.24], [-0.015, -0.243], [-0.012, -0.174], [-0.1, -0.17], [-0.13, -0.05],
  [-0.44, -0.035], [-0.5, -0.005], [-0.535, -0.045], [-0.545, 0.055], [-0.5, 0.04], [-0.475, 0.025],
], 0.012, 5);

/** Torpedo; the warhead section is marked by ribs where the wire is wound round it. Both wire ends meet under the hull. */
export function TORPEDO() {
  const h = 0.05;
  const pts = [[-0.2, h], [-0.44, h], [-0.5, 0.024], [-0.535, 0.1], [-0.56, 0.1], [-0.545, 0.0], [-0.56, -0.1], [-0.535, -0.1], [-0.5, -0.024], [-0.44, -h], [0.04, -h]];
  for (let i = 0; i < 4; i++) { const x = 0.04 + i * 0.05; pts.push([x, h], [x + 0.025, h], [x + 0.025, -h], [x + 0.05, -h]); }
  pts.push([0.27, -h], ...arc(0.27, 0, 0.23, h, -90, 90, 22).slice(1), [0.04, h + 0.006], [-0.26, h + 0.006]);
  return fillet(pts, 0.006, 4);
}

/** Three different warship profiles above the waterline (bow to the right). */
export function SHIP(v = 0) {
  let pts;
  if (v === 0) { // destroyer: two raked funnels, tall mast
    pts = [[-0.5, -0.06], [-0.46, 0.0], [0.44, 0.0], [0.53, -0.1], [0.32, -0.075], [0.3, -0.11], [0.22, -0.11], [0.21, -0.075],
      [0.14, -0.075], [0.14, -0.18], [0.05, -0.18], [0.07, -0.18], [0.07, -0.34], [0.075, -0.336], [0.075, -0.27], [0.03, -0.27], [0.12, -0.27],
      [0.08, -0.265], [0.08, -0.185], [0.02, -0.185], [0.02, -0.12], [-0.04, -0.12], [-0.06, -0.22], [-0.12, -0.22], [-0.115, -0.12],
      [-0.15, -0.12], [-0.17, -0.2], [-0.23, -0.2], [-0.215, -0.12], [-0.3, -0.075], [-0.33, -0.1], [-0.38, -0.1], [-0.39, -0.07], [-0.5, -0.06]];
  } else if (v === 1) { // bigger ship: high bridge block, lattice mast, guns fore and aft
    pts = [[-0.5, -0.05], [-0.47, 0.0], [0.45, 0.0], [0.54, -0.11], [0.36, -0.08], [0.34, -0.12], [0.25, -0.12], [0.33, -0.15], [0.25, -0.12], [0.24, -0.08],
      [0.16, -0.08], [0.16, -0.16], [0.1, -0.16], [0.1, -0.25], [0.0, -0.25], [0.02, -0.25], [0.04, -0.42], [0.06, -0.25], [0.035, -0.33], [0.05, -0.33],
      [0.0, -0.25], [-0.02, -0.16], [-0.06, -0.16], [-0.08, -0.26], [-0.15, -0.26], [-0.16, -0.16], [-0.24, -0.16], [-0.24, -0.08],
      [-0.31, -0.08], [-0.33, -0.12], [-0.41, -0.12], [-0.34, -0.15], [-0.41, -0.12], [-0.42, -0.07], [-0.5, -0.05]];
  } else { // small escort: low, one squat funnel, short pole mast
    pts = [[-0.5, -0.07], [-0.44, 0.0], [0.42, 0.0], [0.52, -0.12], [0.3, -0.09], [0.28, -0.12], [0.2, -0.12], [0.19, -0.09],
      [0.1, -0.09], [0.1, -0.2], [0.0, -0.2], [0.03, -0.2], [0.03, -0.31], [0.04, -0.31], [0.04, -0.2], [-0.02, -0.2], [-0.02, -0.12],
      [-0.08, -0.12], [-0.1, -0.21], [-0.2, -0.21], [-0.2, -0.12], [-0.5, -0.07]];
  }
  return fillet(pts, 0.007, 4);
}

/** Depth charge = a little barrel coil of wire. */
export function CHARGE(N, r) {
  const out = [];
  for (let i = 0; i < N; i++) { const u = i / (N - 1), a = u * 5 * Math.PI * 2; out.push([r * Math.cos(a), (u - 0.5) * r * 2.6 + r * 0.32 * Math.sin(a)]); }
  return out;
}
/** Burst = the coil sprung open into a jagged ring. */
export function BURST(N, R, seed = 0) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), a = u * Math.PI * 2 * 1.04 + seed, spike = (Math.floor(u * 22) % 2) ? 1 : 0.48;
    const k = (u * 22) % 1, rr = R * (spike === 1 ? 0.48 + 0.52 * Math.sin(k * Math.PI) : 0.48);
    out.push([rr * Math.cos(a), rr * Math.sin(a)]);
  }
  return out;
}

/** Sea surface: one long slack wire with small uneven waves. */
export function SEA(x0, x1, y, amp, N, seed = 1) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), x = x0 + (x1 - x0) * u;
    out.push([x, y + amp * (Math.sin(u * 31 + seed) * 0.6 + Math.sin(u * 13.7 + seed * 2) * 0.4)]);
  }
  return out;
}
