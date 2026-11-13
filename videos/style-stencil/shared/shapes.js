// Hand-cut stencil shapes: everything is a polygon with straight knife facets (no smooth vector curves),
// with "bridges" where a real stencil needs them so islands do not fall out. Our own drawings, generic,
// no markings (truth code RC = reconstruction).
import { rand } from '/onclack-styles/engine/lib/anim.js';

const f1 = (v) => v.toFixed(1);
const pts = (P) => P.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');
const poly = (P) => ({ tag: 'polygon', attrs: { points: pts(P) } });
const bar = (x, y, w, h, rot = 0, cx = x + w / 2, cy = y + h / 2) => ({ tag: 'rect', attrs: { x: f1(x), y: f1(y), width: f1(w), height: f1(h), ...(rot ? { transform: `rotate(${rot} ${f1(cx)} ${f1(cy)})` } : {}) } });
const boxOf = (P) => { const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]); const x = Math.min(...xs), y = Math.min(...ys); return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }; };
/** knife jitter: every vertex moved a little, fixed per seed */
const knife = (P, amt, seed) => P.map(([x, y], i) => [x + (rand(seed * 31 + i * 1.7) - 0.5) * amt, y + (rand(seed * 17 + i * 2.3) - 0.5) * amt]);
/** faceted circle (a knife can't cut a perfect circle) */
export const ring = (cx, cy, r, n = 11, seed = 1, amt = 0.06) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + seed; const rr = r * (1 + (rand(seed * 7 + i) - 0.5) * amt); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
/** tapered limb between two points */
const limb = ([x1, y1], [x2, y2], w1, w2) => { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; return [[x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x2 + nx * w2 / 2, y2 + ny * w2 / 2], [x2 - nx * w2 / 2, y2 - ny * w2 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2]]; };
const lows = (P, n) => { // drip points: lowest vertices
  return [...P].sort((a, b) => b[1] - a[1]).slice(0, n);
};

/** Soviet diesel-electric sub, side view, facing left (generic Foxtrot-like outline, no markings). */
export function sub(x, y, len, seed = 5) {
  const U = [[0, 0.012], [0.006, -0.018], [0.025, -0.038], [0.06, -0.05], [0.12, -0.056], [0.33, -0.058], [0.345, -0.1], [0.352, -0.135], [0.362, -0.148], [0.44, -0.148], [0.452, -0.14], [0.47, -0.1], [0.49, -0.06], [0.72, -0.054], [0.86, -0.044], [0.94, -0.03], [0.985, -0.012], [1.0, 0.0], [0.975, 0.016], [0.9, 0.032], [0.78, 0.046], [0.5, 0.054], [0.2, 0.052], [0.07, 0.043], [0.02, 0.03]];
  const P = knife(U.map(([u, v]) => [x + u * len, y + v * len]), len * 0.004, seed);
  // periscope masts (thin cuts) + stern rudder
  const mast1 = limb([x + 0.385 * len, y - 0.148 * len], [x + 0.387 * len, y - 0.215 * len], len * 0.009, len * 0.007);
  const mast2 = limb([x + 0.41 * len, y - 0.148 * len], [x + 0.41 * len, y - 0.19 * len], len * 0.007, len * 0.006);
  const rudder = [[x + 0.955 * len, y - 0.02 * len], [x + 0.985 * len, y - 0.06 * len], [x + 0.995 * len, y - 0.056 * len], [x + 0.99 * len, y - 0.012 * len]];
  const specs = [poly(P), poly(mast1), poly(mast2), poly(rudder)];
  // bridges: two thin uncut strips across the hull (a real stencil keeps the card in one piece) — read as hull sections
  const bridges = [bar(x + 0.22 * len, y - 0.07 * len, len * 0.007, 0.14 * len, 4), bar(x + 0.64 * len, y - 0.07 * len, len * 0.007, 0.14 * len, -3)];
  return { specs, bridges, box: boxOf([...P, ...mast1]), drips: lows(P, 3).map(([a, b]) => [a, b - 2]) };
}

/** Destroyer, side view, facing right; y = waterline. */
export function ship(x, y, len, seed = 7) {
  const L = len;
  const hull = knife([[x, y - 0.05 * L], [x + 0.55 * L, y - 0.056 * L], [x + 0.93 * L, y - 0.068 * L], [x + 1.0 * L, y - 0.082 * L], [x + 0.965 * L, y], [x + 0.03 * L, y]], L * 0.004, seed);
  const sup = knife([[x + 0.52 * L, y - 0.05 * L], [x + 0.52 * L, y - 0.11 * L], [x + 0.6 * L, y - 0.11 * L], [x + 0.61 * L, y - 0.165 * L], [x + 0.7 * L, y - 0.165 * L], [x + 0.72 * L, y - 0.11 * L], [x + 0.77 * L, y - 0.1 * L], [x + 0.78 * L, y - 0.055 * L]], L * 0.004, seed + 1);
  const funnel = knife([[x + 0.4 * L, y - 0.05 * L], [x + 0.415 * L, y - 0.14 * L], [x + 0.48 * L, y - 0.14 * L], [x + 0.49 * L, y - 0.05 * L]], L * 0.004, seed + 2);
  const mast = limb([x + 0.655 * L, y - 0.16 * L], [x + 0.645 * L, y - 0.3 * L], L * 0.012, L * 0.007);
  const yard = limb([x + 0.615 * L, y - 0.25 * L], [x + 0.69 * L, y - 0.252 * L], L * 0.007, L * 0.006);
  const gunA = knife([[x + 0.13 * L, y - 0.05 * L], [x + 0.14 * L, y - 0.085 * L], [x + 0.22 * L, y - 0.085 * L], [x + 0.23 * L, y - 0.05 * L]], L * 0.003, seed + 3);
  const barA = limb([x + 0.14 * L, y - 0.072 * L], [x + 0.06 * L, y - 0.084 * L], L * 0.008, L * 0.006);
  const gunF = knife([[x + 0.8 * L, y - 0.06 * L], [x + 0.81 * L, y - 0.097 * L], [x + 0.87 * L, y - 0.097 * L], [x + 0.88 * L, y - 0.064 * L]], L * 0.003, seed + 4);
  const barF = limb([x + 0.865 * L, y - 0.084 * L], [x + 0.95 * L, y - 0.1 * L], L * 0.008, L * 0.006);
  const all = [hull, sup, funnel, mast, yard, gunA, barA, gunF, barF];
  // bridge: the superstructure is cut as a separate island from the hull (gap = deck line)
  const bridges = [bar(x + 0.02 * L, y - 0.057 * L, 0.96 * L, L * 0.007, -0.6)];
  return { specs: all.map(poly), bridges, box: boxOf(all.flat()), drips: [[x + 0.3 * L, y - 1], [x + 0.84 * L, y - 1]] };
}

/** Torpedo, facing left. y = centre line. part: 'body' | 'tip' (warhead section for a second colour layer). */
export function torpedo(x, y, len, part = 'body', seed = 9) {
  const r = len * 0.034;
  if (part === 'tip') {
    const T = [[x, y], [x + 0.012 * len, y - r * 0.62], [x + 0.04 * len, y - r * 0.93], [x + 0.17 * len, y - r], [x + 0.17 * len, y + r], [x + 0.04 * len, y + r * 0.93], [x + 0.012 * len, y + r * 0.62]];
    const P = knife(T, len * 0.002, seed);
    return { specs: [poly(P)], bridges: [bar(x + 0.1 * len, y - r * 1.2, len * 0.006, r * 2.4)], box: boxOf(P), drips: [[x + 0.09 * len, y + r - 2]] };
  }
  const B = [[x, y], [x + 0.012 * len, y - r * 0.62], [x + 0.04 * len, y - r * 0.93], [x + 0.08 * len, y - r], [x + 0.86 * len, y - r], [x + 0.93 * len, y - r * 0.55], [x + 0.96 * len, y - r * 0.3], [x + 0.96 * len, y + r * 0.3], [x + 0.93 * len, y + r * 0.55], [x + 0.86 * len, y + r], [x + 0.08 * len, y + r], [x + 0.04 * len, y + r * 0.93], [x + 0.012 * len, y + r * 0.62]];
  const P = knife(B, len * 0.002, seed);
  const finU = [[x + 0.88 * len, y - r * 0.6], [x + 0.95 * len, y - r * 1.9], [x + 0.985 * len, y - r * 1.9], [x + 0.965 * len, y - r * 0.3]];
  const finD = finU.map(([a, b]) => [a, 2 * y - b]);
  const prop = [[x + 0.965 * len, y - r * 0.9], [x + 0.99 * len, y - r * 0.9], [x + 0.99 * len, y + r * 0.9], [x + 0.965 * len, y + r * 0.9]];
  const bridges = [bar(x + 0.17 * len, y - r * 1.3, len * 0.006, r * 2.6), bar(x + 0.55 * len, y - r * 1.3, len * 0.006, r * 2.6), bar(x + 0.955 * len, y - r * 1.3, len * 0.005, r * 2.6)];
  return { specs: [poly(P), poly(finU), poly(finD), poly(prop)], bridges, box: boxOf([...P, ...finU, ...finD]), drips: [[x + 0.3 * len, y + r - 2], [x + 0.7 * len, y + r - 2]] };
}

/** Depth-charge burst: jagged star with a cut centre ring. */
export function burst(cx, cy, r, seed = 11) {
  const n = 13, P = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + seed * 0.3;
    const rr = (i % 2 ? 0.5 + rand(seed + i) * 0.12 : 0.85 + rand(seed * 3 + i) * 0.3) * r;
    P.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const hole = ring(cx, cy, r * 0.24, 9, seed);
  const bubbles = [[0.15, -1.25, 0.09], [-0.2, -1.5, 0.07], [0.05, -1.75, 0.05]].map(([u, v, s], i) => poly(ring(cx + u * r, cy + v * r, s * r, 7, seed + i)));
  return { specs: [poly(P), ...bubbles], bridges: [poly(hole)], box: { x: cx - r * 1.15, y: cy - r * 1.85, w: r * 2.3, h: r * 3 }, drips: [[cx - r * 0.1, cy + r * 0.8]] };
}

/** Sea: wavy bands cut as strips with bridges every so often. */
export function waves(x, y, w, seed = 13, { rows = 3, gap = 46, thick = 20, lambda = 220 } = {}) {
  const specs = [], bridges = [], drips = [];
  for (let r = 0; r < rows; r++) {
    const yy = y + r * gap, th = thick * (1 - r * 0.22), ph = rand(seed + r) * 6, amp = 9 - r * 2;
    const N = Math.round(w / 26), top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const xx = x + (i / N) * w + (r % 2 ? 30 : 0);
      const s = Math.sin(((xx - x) / lambda) * Math.PI * 2 + ph);
      top.push([xx, yy + s * amp - th / 2]); bot.push([xx, yy + s * amp + th / 2]);
    }
    specs.push(poly([...top, ...bot.reverse()]));
    const nb = Math.max(2, Math.round(w / 340));
    for (let k = 1; k <= nb; k++) bridges.push(bar(x + (k / (nb + 1)) * w + (rand(seed * 5 + k + r) - 0.5) * 80, yy - th - amp, 9, th * 2 + amp * 2, 8));
    if (r === 0) drips.push([x + w * (0.2 + rand(seed + 7) * 0.2), yy + th / 2 + amp * 0.6], [x + w * (0.65 + rand(seed + 8) * 0.2), yy + th / 2 + amp * 0.6]);
  }
  return { specs, bridges, box: { x, y: y - thick, w: w + 30, h: (rows - 1) * gap + thick * 2 }, drips };
}

// ------------------------------------------------------------------ officers (silhouettes, no faces)
// Frontal-ish figures in units: feet at y=0, top of cap ≈ -100, x + = right. Limbs are single knife-cut outlines
// (chain), so joints have no notches. Each pose has its own weight, tilt and gesture.
const chain = (P, Wd) => {
  const A = [], B = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = -ty, ny = tx, w = Wd[i] / 2;
    A.push([P[i][0] + nx * w, P[i][1] + ny * w]); B.push([P[i][0] - nx * w, P[i][1] - ny * w]);
  }
  return [...A, ...B.reverse()];
};
const rot = ([x, y], deg, [cx, cy]) => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s2 = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s2, cy + (x - cx) * s2 + (y - cy) * c]; };
const oval = (cx, cy, rx, ry, n, seed) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + seed; const k = 1 + (rand(seed * 5 + i) - 0.5) * 0.06; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });

export const POSES = {
  // arms folded high, weight on one leg, head a little down
  folded: { tilt: 0, head: [0.6, -87.6],
    arms: [[[-12, -76], [-16, -62], [5, -64.5]], [[12, -76], [16, -61.5], [-4, -66.5]]],
    legs: [[[-5, -47], [-6, -24], [-8.5, 0]], [[5, -47], [7.5, -24], [11, 0]]] },
  // leans in, one arm stabbing down at the table: yes
  lean: { tilt: -8,
    arms: [[null, [-25, -60], [-35, -50]], [null, [15, -62], [14, -48]]],
    legs: [[[-5, -47], [-11, -24], [-15.5, 0]], [[5, -47], [8, -24], [12.5, 0]]] },
  // hands on hips, wide stance
  hips: { tilt: 0,
    arms: [[[-12, -76], [-22, -63], [-9, -52]], [[12, -76], [22, -63], [9, -52]]],
    legs: [[[-5, -47], [-11, -24], [-15, 0]], [[5, -47], [11, -24], [15, 0]]] },
  // Arkhipov: upright, one open hand raised: no
  stop: { tilt: 0,
    arms: [[[-12, -76], [-23, -69], [-24, -86]], [[12, -76], [14.5, -61], [14, -47]]],
    legs: [[[-5, -47], [-5.5, -24], [-6.5, 0]], [[5, -47], [5.5, -24], [6.5, 0]]], palm: true },
};

export function officer(x, y, h, pose, { seed = 21 } = {}) {
  const P = POSES[pose], s = h / 100, piv = [0, -47];
  const R = (p) => rot(p, P.tilt, piv);
  const T = ([u, v]) => [x + u * s, y + v * s];
  const parts = [];
  const add = (Q) => parts.push(knife(Q.map(T), s * 0.35, seed + parts.length));
  // jacket: sloped shoulders, armpits, waist, hem
  add([[-3.6, -82.5], [-10, -80.5], [-13.2, -77.5], [-12, -68], [-9.2, -56], [-10.4, -45.5], [10.4, -45.5], [9.2, -56], [12, -68], [13.2, -77.5], [10, -80.5], [3.6, -82.5]].map(R));
  add([[-3.4, -84.5], [3.4, -84.5], [3.6, -81], [-3.6, -81]].map(R)); // neck
  const [hx, hy] = R(P.head ?? [0, -87.6]);
  add(oval(hx, hy, 5.9, 6.9, 12, seed));
  // peaked cap seen from the front: crown (wider than the head), band, visor
  add([[-9, -100.6], [9, -100.6], [7.6, -95.4], [-7.6, -95.4]].map((p) => [p[0] + hx, p[1] + hy + 87.6]));
  add([[-7.4, -95], [7.4, -95], [7.2, -92.6], [6.2, -91.4], [-6.2, -91.4], [-7.2, -92.6]].map((p) => [p[0] + hx, p[1] + hy + 87.6]));
  for (const [i, [sh, el2, wr]] of P.arms.entries()) {
    const a = R(sh ?? (i === 0 ? [-12, -76] : [12, -76]));
    add(chain([a, el2, wr], [7.4, 6.2, 4.6]));
    const dx = wr[0] - el2[0], dy = wr[1] - el2[1], l = Math.hypot(dx, dy);
    add(oval(wr[0] + (dx / l) * 2.2, wr[1] + (dy / l) * 2.2, 2.7, 2.9, 8, seed + wr[0]));
  }
  if (P.palm) { const [px, py] = P.arms[0][2]; add([[px - 3.4, py + 1], [px - 4.4, py - 6.5], [px - 2.6, py - 8.6], [px - 0.4, py - 9.2], [px + 1.6, py - 8.4], [px + 2.6, py - 5], [px + 3.6, py - 6.4], [px + 3.2, py + 0.5]]); }
  add([[-9.6, -48], [9.6, -48], [4.6, -38], [0, -36.5], [-4.6, -38]].map(R)); // seat of the trousers
  for (const [hp, kn, an] of P.legs) {
    add(chain([R(hp), kn, an], [9.6, 7.2, 5.8]));
    const dir = an[0] < -1 ? -1 : an[0] > 1 ? 1 : (hp[0] < 0 ? -1 : 1);
    add([[an[0] - 3.4 * dir, an[1] - 2.6], [an[0] + 2 * dir, an[1] - 3], [an[0] + 7 * dir, an[1] - 1.4], [an[0] + 7.4 * dir, an[1] + 0.2], [an[0] - 3.6 * dir, an[1] + 0.2]]);
  }
  const ctr = R([0, -46.3]), cap = [hx, hy - 7.6];
  const bridges = [
    bar(...T([cap[0] - 10, cap[1] - 0.45]), 20 * s, 0.9 * s), // cap band gap (keeps the crown island in the card)
    bar(...T([ctr[0] - 12, ctr[1] - 0.6]), 24 * s, 1.2 * s, P.tilt), // belt gap between jacket and trousers
  ];
  const all = parts.flat();
  const hem = [R([-10.4, -45.5]), R([10.4, -45.5])].map(T);
  return { specs: parts.map(poly), bridges, box: boxOf(all), drips: hem.map(([a, b], i) => [a + (i ? -1 : 1) * s * 2, b - 1]) };
}
