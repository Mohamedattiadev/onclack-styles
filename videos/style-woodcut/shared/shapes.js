// Simple, bold silhouettes for the blocks (our own drawings, generic — no real hull numbers or markings).
// Truth code RC: a Foxtrot-type diesel submarine (B-59 was Project 641), generic destroyers, a generic torpedo.
import { cut } from './wood.js';

/** Submarine, bow left. cx, cy = centre of the hull; len = length (world px). */
export function subPoly(cx, cy, len) {
  const hh = len * 0.055, x0 = cx - len / 2;
  const pts = [[0, 0.1], [0.012, -0.5], [0.045, -0.85], [0.1, -1], [0.27, -1], [0.29, -2.45], [0.32, -2.7], [0.43, -2.7], [0.465, -1], [0.8, -0.9], [0.9, -0.6], [0.962, -0.28], [0.972, -0.75], [1, -0.8], [1, 0.8], [0.972, 0.75], [0.962, 0.28], [0.9, 0.6], [0.8, 0.9], [0.1, 1], [0.045, 0.85], [0.012, 0.5]];
  return pts.map(([u, v]) => [x0 + u * len, cy + v * hh]);
}
export function subHighlights(cx, cy, len, seed = 3) {
  const hh = len * 0.055, x0 = cx - len / 2, P = (u, v) => [x0 + u * len, cy + v * hh];
  return [
    cut([P(0.06, -0.5), P(0.3, -0.62), P(0.6, -0.6), P(0.86, -0.4)], hh * 0.36, { seed }),
    cut([P(0.14, 0.52), P(0.5, 0.56), P(0.76, 0.46)], hh * 0.16, { seed: seed + 1 }),
    cut([P(0.315, -2.3), P(0.31, -1.25)], hh * 0.26, { seed: seed + 2 }),
  ];
}

/** Destroyer silhouette, bow right, sitting on the waterline y. len = length. */
export function shipPoly(x0, y, len) {
  const pts = [[0, 0.02], [0, -0.05], [0.16, -0.05], [0.17, -0.085], [0.3, -0.085], [0.31, -0.14], [0.35, -0.14], [0.355, -0.085], [0.43, -0.085], [0.44, -0.15], [0.48, -0.15], [0.485, -0.085], [0.55, -0.085], [0.56, -0.12], [0.6, -0.12], [0.603, -0.24], [0.613, -0.24], [0.617, -0.12], [0.68, -0.12], [0.7, -0.085], [0.84, -0.07], [1, -0.085], [0.975, 0.02]];
  return pts.map(([u, v]) => [x0 + u * len, y + v * len * 1.35]);
}

/** Torpedo, nose left, centre line y, from x0 over len; radius r. Returns polygon. */
export function torpedoPoly(x0, y, len, r) {
  const prof = u => {
    if (u < 0.1) return Math.sqrt(Math.max(0, 1 - ((0.1 - u) / 0.1) ** 2)) * 0.98 + 0.02;
    if (u < 0.8) return 1;
    if (u < 0.93) return 1 - (u - 0.8) / 0.13 * 0.55;
    if (u < 0.96) return 0.22;
    if (u < 0.99) return 0.72;
    return 0.3;
  };
  const fin = u => (u > 0.85 && u < 0.925 ? 1.42 - (u - 0.85) * 1.2 : 0);
  const top = [], bot = [];
  for (let i = 0; i <= 160; i++) {
    const u = i / 160, rr = Math.max(prof(u), fin(u));
    top.push([x0 + u * len, y - rr * r]); bot.push([x0 + u * len, y + rr * r]);
  }
  return [...top, ...bot.reverse()];
}
export function torpedoDetails(x0, y, len, r, seed = 9) {
  const P = (u, v) => [x0 + u * len, y + v * r];
  return [
    cut([P(0.07, -0.5), P(0.45, -0.56), P(0.79, -0.5)], r * 0.22, { seed }),
    cut([P(0.13, -0.17), P(0.5, -0.2), P(0.76, -0.16)], r * 0.1, { seed: seed + 1 }),
    cut([P(0.18, 0.62), P(0.5, 0.66), P(0.74, 0.6)], r * 0.09, { seed: seed + 2 }),
    cut([P(0.3, -0.86), P(0.3, 0.86)], r * 0.08, { seed: seed + 3, tipMin: 0.5 }),
    cut([P(0.62, -0.86), P(0.62, 0.86)], r * 0.08, { seed: seed + 4, tipMin: 0.5 }),
    cut([P(0.1, -0.8), P(0.1, 0.8)], r * 0.07, { seed: seed + 5, tipMin: 0.5 }),
  ];
}
