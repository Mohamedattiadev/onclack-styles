// Picture recipes: where each pigment goes. Shapes are our own simplified silhouettes (reconstruction, not records).
import { mix, blend, inPoly, inEllipse, segDist, place, clamp01 } from './dots.js';

// ---- palettes (optical mixes of pure pigments) ----
export const MIX = {
  skyTop: [['cerulean', 3], ['white', 2.2], ['cobalt', 1], ['lemon', 0.5]],
  skyLow: [['lemon', 2.6], ['white', 2.4], ['orange', 1.2], ['yellow', 1], ['cerulean', 0.6]],
  glint: [['white', 3], ['lemon', 2], ['cerulean', 1.5]],
  shallow: [['cerulean', 3], ['viridian', 2], ['cobalt', 2], ['white', 0.6], ['emerald', 0.6]],
  mid: [['cobalt', 3], ['ultra', 3], ['viridian', 1.2], ['violet', 0.7], ['cerulean', 0.4]],
  deep: [['ultra', 3], ['cobalt', 2.2], ['violet', 1.4], ['viridian', 0.8], ['dultra', 0.8], ['cerulean', 0.4]],
  hull: [['dviolet', 3], ['dultra', 3.4], ['violet', 0.5]],
  hullRim: [['cobalt', 2], ['cerulean', 2], ['violet', 1], ['white', 0.4]],
  ship: [['dultra', 3], ['dviolet', 2.5], ['ultra', 1]],
  room: [['viridian', 3], ['cobalt', 2], ['ultra', 1.2], ['violet', 0.8], ['cerulean', 0.7], ['orange', 0.22]],
  lamp: [['yellow', 2], ['lemon', 1.6], ['orange', 1.2], ['white', 1.2], ['emerald', 0.6]],
  steel: [['white', 3], ['cerulean', 1.4], ['orange', 1], ['lemon', 0.9], ['cobalt', 0.5]],
  steelDark: [['cobalt', 2], ['white', 1.2], ['orange', 0.9], ['ultra', 0.8], ['cerulean', 0.8]],
  warhead: [['vermilion', 3.4], ['orange', 1.6], ['yellow', 0.7], ['crimson', 1]],
  figure: [['dviolet', 3], ['dultra', 3.4], ['ultra', 0.4]],
  rimWarm: [['yellow', 2], ['orange', 2], ['lemon', 1]],
  rimCool: [['cerulean', 2.5], ['white', 1.5], ['cobalt', 1]],
  yes: [['vermilion', 3.2], ['orange', 2.2], ['yellow', 1.2], ['crimson', 1.2], ['lemon', 0.4]],
  calm: [['cerulean', 3], ['white', 2.4], ['cobalt', 1.6], ['emerald', 0.7], ['lemon', 0.5]],
  ink: [['dultra', 3], ['dviolet', 2], ['ultra', 1.4]],
};
export const r2 = r => (r * 7.137) % 1;

// ---- silhouettes (local coords; u along length 0..1, v across in half-heights) ----
const HULL = [[0, 0.05], [0.04, -0.3], [0.14, -0.48], [0.3, -0.52], [0.86, -0.52], [0.95, -0.42], [1, -0.12], [1, 0.12], [0.95, 0.4], [0.86, 0.52], [0.3, 0.52], [0.12, 0.42], [0.04, 0.28]];
const SAIL = [[0.5, -0.5], [0.535, -1.12], [0.56, -1.2], [0.64, -1.2], [0.655, -1.0], [0.68, -0.5]];
const PLANE = [[0.02, -0.05], [-0.02, -0.62], [0.03, -0.62], [0.08, -0.1]];
/** submarine: centre x/y, length; returns inside(x,y) and rim(x,y) tests */
export function submarine(cx, cy, len) {
  const hh = len * 0.1; // half hull height
  const x0 = cx - len / 2;
  const hull = place(HULL, x0, cy, len, hh), sail = place(SAIL, x0, cy, len, hh), plane = place(PLANE, x0, cy, len, hh);
  const inside = (x, y) => inPoly(x, y, hull) || inPoly(x, y, sail) || inPoly(x, y, plane);
  return { inside, sail: [x0 + len * 0.58, cy - hh * 0.5], hh, len, x0, cy, outline: [hull, sail, plane] };
}
const DD = [[0, -0.02], [0.03, -0.1], [0.82, -0.12], [0.97, -0.24], [1, -0.22], [0.97, 0]];
const DD_TOP = [[0.24, -0.11], [0.26, -0.3], [0.4, -0.3], [0.42, -0.44], [0.48, -0.44], [0.5, -0.3], [0.6, -0.28], [0.62, -0.11]];
const DD_MAST = [[0.335, -0.29], [0.35, -0.68], [0.37, -0.68], [0.385, -0.29]];
/** destroyer on the waterline wy (generic WWII-era profile; not a specific ship) */
export function destroyer(x0, wy, len, flip = false) {
  const tf = pts => pts.map(([u, v]) => [flip ? 1 - u : u, v]);
  const sc = len * 0.55;
  const parts = [DD, DD_TOP, DD_MAST].map(p => place(tf(p), x0, wy, len, sc));
  return { inside: (x, y) => parts.some(p => inPoly(x, y, p)), outline: parts, sternX: x0 + (flip ? len * 0.9 : len * 0.1) };
}

/** standing figure, no face. pose: 'square' | 'crossed' | 'turned'. foot = [x, y], H = height */
export function figure(pose, fx, fy, H) {
  const head = { cx: fx, cy: fy - H * 0.885, rx: H * 0.062, ry: H * 0.075 };
  let lean = 0, sw = H * 0.135, hw = H * 0.1;
  if (pose === 'crossed') lean = H * 0.02;
  if (pose === 'turned') { sw = H * 0.105; head.cx += H * 0.018; head.cy += H * 0.02; }
  head.cx += lean;
  const sy = fy - H * 0.78, wy = fy - H * 0.47, hy = fy - H * 0.44;
  const torso = [[fx - sw + lean, sy], [fx + sw + lean, sy], [fx + hw + lean * 0.5, wy], [fx + hw, hy + H * 0.02], [fx - hw, hy + H * 0.02], [fx - hw + lean * 0.5, wy]];
  const cap = { cx: head.cx, cy: head.cy - head.ry * 0.62, rx: head.rx * 1.22, ry: head.ry * 0.34 };
  const limbs = []; // [ax, ay, bx, by, r]
  const legR = H * 0.047, armR = H * 0.037;
  const legSpread = pose === 'square' ? H * 0.07 : pose === 'crossed' ? H * 0.035 : H * 0.045;
  limbs.push([fx - hw * 0.5, hy, fx - legSpread, fy - legR * 0.6, legR], [fx + hw * 0.5, hy, fx + legSpread * (pose === 'turned' ? 0.4 : 1), fy - legR * 0.6, legR]);
  if (pose === 'square') { // hands on hips: both elbows out
    for (const sg of [-1, 1]) limbs.push([fx + sg * sw, sy + armR, fx + sg * (sw + H * 0.085), fy - H * 0.6, armR], [fx + sg * (sw + H * 0.085), fy - H * 0.6, fx + sg * hw * 1.1, fy - H * 0.49, armR * 0.95]);
  } else if (pose === 'crossed') { // weight on one leg, one hand in a pocket (elbow out right), left arm hangs
    limbs.push([fx - sw + lean, sy + armR, fx - sw - H * 0.015, fy - H * 0.43, armR]);
    limbs.push([fx + sw + lean, sy + armR, fx + sw + H * 0.07, fy - H * 0.58, armR], [fx + sw + H * 0.07, fy - H * 0.58, fx + hw * 1.05, fy - H * 0.46, armR * 0.95]);
  } else { // turned, hands behind the back: upper arms visible, elbows out back
    limbs.push([fx - sw + 0, sy + armR, fx - sw - H * 0.025, fy - H * 0.55, armR], [fx + sw, sy + armR, fx + sw + H * 0.035, fy - H * 0.56, armR]);
  }
  const inside = (x, y) => inEllipse(x, y, head.cx, head.cy, head.rx, head.ry) || inEllipse(x, y, cap.cx, cap.cy, cap.rx, cap.ry)
    || inPoly(x, y, torso) || inEllipse(x, y, fx + lean * 0.5, sy + H * 0.02, sw * 1.02, H * 0.05)
    || limbs.some(([ax, ay, bx, by, r]) => segDist(x, y, ax, ay, bx, by) <= r)
    || segDist(x, y, head.cx, head.cy, fx + lean, sy) <= H * 0.03;
  return { inside, chest: [fx + lean, fy - H * 0.64], head, cap, torso, limbs, neck: [head.cx, head.cy, fx + lean, sy, H * 0.03], H, fx, fy };
}

// ---- the sea (used by scenes 1 and 2) ----
export function seaColor({ P, surf, sp, sub, shipsInside }) {
  const bottom = P.y + P.h;
  return (x, y, r) => {
    const sy = surf(x);
    if (sub && sub.inside(x, y)) return mix(sub.inside(x, y + sp * 1.3) && sub.inside(x, y - sp * 0.0) && !sub.inside(x, y - sp * 1.1) ? MIX.hullRim : MIX.hull, r);
    if (shipsInside && shipsInside(x, y)) return -1; // reserved linen; ships are painted later
    if (y < sy - sp * 0.4) return mix(blend(MIX.skyTop, MIX.skyLow, clamp01((y - P.y) / (sy - P.y))), r);
    if (y < sy + sp * 0.9) return mix(MIX.glint, r);
    const d = clamp01((y - sy) / (bottom - sy));
    let w = d < 0.45 ? blend(MIX.shallow, MIX.mid, d / 0.45) : blend(MIX.mid, MIX.deep, (d - 0.45) / 0.55);
    // light shafts from the surface
    const s = Math.sin((x * 0.9 + (y - sy) * 0.42) / (P.w * 0.035));
    if (s > 0.8 && r2(r) < 0.3 * (1 - d / 0.6)) w = MIX.glint;
    return mix(w, r);
  };
}
