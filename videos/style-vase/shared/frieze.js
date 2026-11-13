// THE PAINTED SURFACE — everything on the pot, unwrapped flat. Coordinates: x = arc length at the belly (pot units,
// a = u·D2A, u in degrees round the pot), y = height on the pot (0 = lip, 1.6 = foot), y down.
// Black-figure rules used: figures are flat slip-black silhouettes; detail is INCISED (a thin line that shows the clay);
// overlapping limbs are separated by an incised outline; added white for bursts, bubbles, warhead band; added
// purple-red ONLY for the "NO". No eyes, no faces — profile silhouettes. Nothing is copied from a real vase.
import { clamp, rand } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep, spring, springs } from '/onclack-styles/engine/lib/spring.js';
import { paint, textWidth } from './letters.js';

export const PAL = {
  clay: '#C2683A', clayDeep: '#A9552E', slip: '#1B1410', white: '#E8DDC6', red: '#7A2630',
};
export const DEG = Math.PI / 180;
export const RB = 0.5;          // belly reference radius → 1° = RB·DEG pot units of arc
export const D2A = RB * DEG;

// ---- story timing (global seconds, from words.json; 0–3 frames before the word) ----
export const TT = {
  dateA: [0.52, 1.62], dateB: [2.0, 3.15],
  bubbles: 4.9,
  release: [8.98, 9.28, 9.62], burst: [9.95, 10.3, 10.62],
  silent: 11.9,
  officers: [16.45, 16.66, 16.86], vote: [18.24, 18.5],
  name: [20.56, 21.62], turn: [21.66, 22.14], no: [21.84, 22.2],
  y2002: [24.08, 24.95],
};

// ---- layout of the frieze (u in degrees) ----
export const U = {
  cubaText: -59, cuba: -38, date: -12, ship1: 13, ship2: 42, sub: 14, div1: 60,
  off1: 70, off2: 82, torpedo: 103, no: 136, ark: 150, div2: 180, y2002: 200, handles: [60, 240],
};
export const Y = { bandTop: 0.697, bandBot: 1.035, sea: 0.832, deck: 1.0, subY: 0.962 };
const CHARGES = [{ u: 3, yb: 0.906 }, { u: 23.5, yb: 0.898 }, { u: 35, yb: 0.913 }];
const ANT = { u: U.sub - 15 + 0.48 * 30, y: 0.877 };   // antenna tip of the sub (u ≈ 13.3)
export { ANT };

const inSea = (u0, u1) => { // whole span [u0,u1] lies in the sea world (outside the interior 57.5..182.5)
  const m = ((u0 % 360) + 360) % 360, m1 = m + (u1 - u0);
  return (m >= 182.5 && m1 <= 417.5) || (m1 <= 57.5);
};

/* ======================= small painters (local coordinates) ======================= */
function incise(g, w) { g.strokeStyle = PAL.clayDeep; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; }

// Officer, local units: height ≈ 100, feet at y = 0, facing +x. arm 0..1 = near arm raised (vote).
// Profile silhouette with a real contour (chest forward, waist in, calves), no face detail.
function limb(g, pts, ws) { // tapered limb through points with widths
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], wa = ws[i - 1] / 2, wb = ws[i] / 2;
    const l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l, ny = (bx - ax) / l;
    g.beginPath(); g.moveTo(ax + nx * wa, ay + ny * wa); g.lineTo(bx + nx * wb, by + ny * wb); g.lineTo(bx - nx * wb, by - ny * wb); g.lineTo(ax - nx * wa, ay - ny * wa); g.closePath(); g.fill();
    g.beginPath(); g.arc(bx, by, wb, 0, Math.PI * 2); g.fill();
    if (i === 1) { g.beginPath(); g.arc(ax, ay, wa, 0, Math.PI * 2); g.fill(); }
  }
}
function officer(g, arm, seed) {
  const S = PAL.slip; g.fillStyle = S;
  const jit = (rand(seed * 7) - 0.5) * 0.8;
  // far arm (behind the body)
  limb(g, [[-1, -78], [-3.6, -63], [-1.8, -50]], [5.6, 4.4, 3.6]);
  // back leg
  g.beginPath(); g.moveTo(1, -50); g.bezierCurveTo(0, -40, -1.5, -32, -2.2, -27); g.bezierCurveTo(-3.2, -18, -5, -10, -5.2, -5.5); g.lineTo(-3.6, -3.4);
  g.lineTo(1.4, -1.2); g.lineTo(1.6, 0); g.lineTo(-11.2, 0); g.lineTo(-11.6, -2.8); g.lineTo(-9.4, -5.5);
  g.bezierCurveTo(-9.8, -12, -10.6, -18, -9.6, -22); g.bezierCurveTo(-8.8, -26, -7.6, -28, -7.8, -32); g.bezierCurveTo(-8.4, -40, -8.2, -46, -7.2, -50); g.closePath(); g.fill();
  // front leg
  g.beginPath(); g.moveTo(6.6, -50); g.bezierCurveTo(7.6, -40, 7.8, -32, 7.6, -27); g.bezierCurveTo(8.2, -18, 9.4, -10, 9.8, -5.6); g.lineTo(11.4, -3.6);
  g.lineTo(17.2, -1.1); g.lineTo(17.4, 0); g.lineTo(5.2, 0); g.lineTo(4.9, -3.2); g.lineTo(5.4, -5.6);
  g.bezierCurveTo(4.0, -12, 3.0, -18, 3.4, -22); g.bezierCurveTo(3.8, -26, 3.0, -28, 2.6, -32); g.bezierCurveTo(1.6, -40, -0.6, -46, -1.6, -50); g.closePath(); g.fill();
  // tunic: back straight, waist in, chest forward, short flared skirt
  g.beginPath(); g.moveTo(-4.2, -83.5); g.bezierCurveTo(-7.6, -81, -8.4, -74, -7.2, -67); g.bezierCurveTo(-6.4, -63, -6.2, -61, -6.6, -59);
  g.bezierCurveTo(-7.6, -54, -9.4, -48, -10.4, -43); g.lineTo(11.2, -43.6); g.bezierCurveTo(10, -49, 8.4, -55, 7.4, -59.5);
  g.bezierCurveTo(7.6, -63, 10.4, -68, 10.6, -73); g.bezierCurveTo(10.6, -78, 8.2, -82, 4.6, -84); g.closePath(); g.fill();
  // neck, head (no features), cap with visor
  g.fillRect(-2.4, -88.6, 6.2, 6.4);
  g.beginPath(); g.arc(0.6 + jit * 0.3, -92.4, 6.1, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(4.8, -96.2); g.lineTo(6.2, -94.6); g.lineTo(8.7, -92.3); g.lineTo(6.7, -91.3); g.lineTo(7.1, -89.7); g.lineTo(6.5, -88.6);
  g.lineTo(5.7, -87); g.lineTo(2, -86.2); g.lineTo(2.4, -92); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-7.4, -97.2); g.lineTo(-8.4, -100.2); g.bezierCurveTo(-7.6, -102.4, -3, -103.4, 2, -103.4); g.bezierCurveTo(6.6, -103.4, 10.2, -102.6, 10.4, -101.2);
  g.lineTo(8.8, -98.4); g.lineTo(7.4, -97.2); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(5, -96.9); g.lineTo(12.9, -95.1); g.lineTo(11.9, -93.9); g.lineTo(5.1, -94.7); g.closePath(); g.fill();
  // incisions: cap band, collar, button line, belt, skirt folds, shoulder board, knees, shoe tops
  incise(g, 0.8);
  g.beginPath(); g.moveTo(-7.2, -97.6); g.lineTo(7.8, -98.2); g.stroke();
  g.beginPath(); g.moveTo(1.8, -83.8); g.lineTo(5.6, -78.2); g.lineTo(7.8, -82.8); g.stroke();
  g.beginPath(); g.moveTo(5.8, -78); g.bezierCurveTo(8.6, -71, 7.2, -64, 7.4, -59.6); g.bezierCurveTo(8.2, -54, 9.6, -48, 10.6, -44); g.stroke();
  g.beginPath(); g.moveTo(-6.5, -59.4); g.lineTo(7.6, -60.4); g.stroke();
  g.beginPath(); g.moveTo(-6.4, -57.2); g.lineTo(7.8, -58.1); g.stroke();
  g.beginPath(); g.moveTo(-2, -55); g.quadraticCurveTo(-3.6, -50, -4.6, -44.6); g.stroke();
  g.beginPath(); g.moveTo(3.6, -55.4); g.quadraticCurveTo(4.6, -50, 5.4, -44.8); g.stroke();
  g.beginPath(); g.moveTo(6.6, -27.5); g.quadraticCurveTo(8.8, -25, 7.8, -21.6); g.stroke();
  g.beginPath(); g.moveTo(-6.6, -27.4); g.quadraticCurveTo(-8.4, -25, -7.6, -21.8); g.stroke();
  g.beginPath(); g.moveTo(5.2, -5.4); g.lineTo(10.4, -5); g.stroke();
  g.beginPath(); g.moveTo(-9.6, -5.4); g.lineTo(-5, -5.6); g.stroke();
  g.fillStyle = PAL.clayDeep; [-71, -65.4].forEach(y => { g.beginPath(); g.arc(7.6, y, 0.7, 0, Math.PI * 2); g.fill(); });
  // near arm (tapered), separated from the body by an incised outline (clay halo), then the shoulder board
  const a1 = (8 + 142 * arm) * DEG, a2 = (14 + 8 * arm) * DEG;
  const sh = [1.4, -78.4], el = [sh[0] + 17.5 * Math.sin(a1), sh[1] + 17.5 * Math.cos(a1)];
  const dir = a1 + a2, wr = [el[0] + 14.5 * Math.sin(dir), el[1] + 14.5 * Math.cos(dir)];
  const hd = [wr[0] + 3.6 * Math.sin(dir), wr[1] + 3.6 * Math.cos(dir)];
  g.fillStyle = PAL.clay; limb(g, [sh, el, wr, hd], [7.8, 6.6, 5.4, 6.2]);
  g.fillStyle = PAL.slip; limb(g, [sh, el, wr, hd], [6.0, 4.8, 3.6, 4.4]);
  incise(g, 0.75);
  const nx = Math.cos(dir) * 2, ny = -Math.sin(dir) * 2, cf = [el[0] + 11.6 * Math.sin(dir), el[1] + 11.6 * Math.cos(dir)];
  g.beginPath(); g.moveTo(cf[0] - nx, cf[1] - ny); g.lineTo(cf[0] + nx, cf[1] + ny); g.stroke();
  g.beginPath(); g.moveTo(-1.6, -81.4); g.lineTo(4.4, -81.8); g.stroke();
}

// Submarine (Project 641 type, simplified): local length 100, nose at x = 0, centre line y = 0.
function submarine(g) {
  g.fillStyle = PAL.slip;
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(0, -5, 4, -7, 12, -7); g.lineTo(80, -7); g.bezierCurveTo(90, -6.4, 97, -3.2, 100, -0.6);
  g.lineTo(100, 0.6); g.bezierCurveTo(96, 3.2, 88, 6.3, 78, 7); g.lineTo(12, 7); g.bezierCurveTo(4, 7, 0, 5, 0, 0); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(30, -6.6); g.lineTo(33, -18); g.bezierCurveTo(34, -19.6, 36, -20, 40, -20); g.lineTo(50, -20); g.bezierCurveTo(53, -20, 54, -18.2, 56, -14); g.lineTo(59.5, -6.6); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(95, -1.2); g.lineTo(99.5, -6.2); g.lineTo(101, -6); g.lineTo(100, -0.8); g.lineTo(100, 0.8); g.lineTo(101, 6); g.lineTo(99.5, 6.2); g.lineTo(95, 1.2); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(102.2, 0, 0.9, 3.6, 0, 0, Math.PI * 2); g.fill(); g.fillRect(99.5, -0.7, 2.6, 1.4);
  g.strokeStyle = PAL.slip; g.lineCap = 'round'; g.lineWidth = 1.1;
  [[40, -28], [43.5, -25.5]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, -19.5); g.lineTo(x, y); g.stroke(); });
  g.lineWidth = 0.8; g.beginPath(); g.moveTo(48, -19.5); g.lineTo(48, -31.5); g.stroke();
  // incised: casing line, limber holes, sail windows, bow cap
  incise(g, 0.55);
  g.beginPath(); g.moveTo(5, -3.2); g.bezierCurveTo(30, -3.4, 70, -3.4, 94, -2.4); g.stroke();
  g.beginPath(); g.moveTo(9, -6.5); g.bezierCurveTo(6, -5.5, 4.5, 3, 9.5, 6.4); g.stroke();
  g.fillStyle = PAL.clayDeep;
  for (let x = 15; x <= 82; x += 2.6) { g.beginPath(); g.ellipse(x, 2.2, 0.55, 0.9, 0, 0, Math.PI * 2); g.fill(); }
  [37, 40.5, 44].forEach(x => g.fillRect(x, -17.2, 1.8, 1.6));
}

// Destroyer silhouette (simplified, not a specific ship): local length 100, bow at x = 0, waterline y = 0.
function ship(g) {
  g.fillStyle = PAL.slip; g.strokeStyle = PAL.slip; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -11); g.lineTo(3.5, 1.5); g.lineTo(100, 1.5); g.lineTo(100, -6); g.lineTo(40, -7.4); g.lineTo(12, -8.6); g.closePath(); g.fill();
  g.fillRect(13.5, -11.6, 5.5, 3.4); g.lineWidth = 1; g.beginPath(); g.moveTo(14, -10.6); g.lineTo(7, -11.8); g.stroke();
  g.beginPath(); g.moveTo(27.5, -7.6); g.lineTo(28, -16.6); g.lineTo(37.5, -17); g.lineTo(40, -7.5); g.closePath(); g.fill();
  g.lineWidth = 1.2; g.beginPath(); g.moveTo(33, -16.8); g.lineTo(33, -32); g.stroke();
  g.lineWidth = 0.9; g.beginPath(); g.moveTo(29, -27.5); g.lineTo(37, -27.5); g.stroke();
  g.beginPath(); g.moveTo(46, -7.4); g.lineTo(47.6, -18.2); g.lineTo(53.6, -18.2); g.lineTo(52, -7.3); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(58, -7.2); g.lineTo(59.6, -16.6); g.lineTo(64.6, -16.6); g.lineTo(63, -7.1); g.closePath(); g.fill();
  g.fillRect(81, -9.2, 6, 3.2); g.lineWidth = 1; g.beginPath(); g.moveTo(86, -8.2); g.lineTo(92, -9.4); g.stroke();
  incise(g, 0.6);
  g.beginPath(); g.moveTo(5, -6.8); g.lineTo(99, -3.9); g.stroke();
  g.fillStyle = PAL.clayDeep; for (let x = 12; x <= 92; x += 6.5) { g.beginPath(); g.arc(x, -2.4, 0.7, 0, Math.PI * 2); g.fill(); }
  [30, 33.5].forEach(x => g.fillRect(x, -14.6, 1.8, 1.5));
}

// Torpedo on its cradle: local length 100, nose at x = 0, centre line y = 0; ground at y = groundY.
function torpedo(g, groundY) {
  g.fillStyle = PAL.slip;
  [24, 72].forEach(x => { g.beginPath(); g.moveTo(x - 5, 4); g.lineTo(x + 5, 4); g.lineTo(x + 7.5, groundY); g.lineTo(x - 7.5, groundY); g.closePath(); g.fill(); });
  g.beginPath(); g.moveTo(7, -7); g.lineTo(84, -7); g.lineTo(95, -3); g.lineTo(95, 3); g.lineTo(84, 7); g.lineTo(7, 7); g.arc(7, 0, 7, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(86, -6); g.lineTo(96.5, -12.5); g.lineTo(98, -11.5); g.lineTo(95, -3); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(86, 6); g.lineTo(96.5, 12.5); g.lineTo(98, 11.5); g.lineTo(95, 3); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(99.5, 0, 1.6, 6.2, 0, 0, Math.PI * 2); g.fill(); g.fillRect(95, -1.4, 4, 2.8);
  incise(g, 0.7);
  [[23, 1], [46, 1], [70, 1]].forEach(([x]) => { g.beginPath(); g.moveTo(x, -6.6); g.lineTo(x, 6.6); g.stroke(); });
  [24, 72].forEach(x => { g.beginPath(); g.moveTo(x - 4, 9); g.lineTo(x + 4, 9); g.stroke(); });
  // warhead band in added white (the nuclear section — symbolic, VO)
  g.fillStyle = PAL.white; g.fillRect(13, -7, 3.2, 14); g.fillRect(17.6, -7, 1.2, 14);
}

function fish(g, dir, seed) {
  g.save(); g.scale(dir, 1); g.fillStyle = PAL.slip;
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(4, -4.5, 13, -4.6, 18, -0.6); g.lineTo(24, -4.6); g.lineTo(22.5, 0); g.lineTo(24, 4.4); g.lineTo(18, 0.6);
  g.bezierCurveTo(13, 4.4, 4, 4.2, 0, 0); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(8, -3.6); g.lineTo(12, -6.6 - rand(seed) * 1.5); g.lineTo(14, -3.4); g.closePath(); g.fill();
  incise(g, 0.5); g.beginPath(); g.moveTo(5.2, -2.6); g.quadraticCurveTo(6.6, 0, 5.2, 2.6); g.stroke();
  g.fillStyle = PAL.clayDeep; g.beginPath(); g.arc(2.8, -0.9, 0.7, 0, Math.PI * 2); g.fill();
  g.restore();
}

function starburst(g, R, seed, t) { // added white: rays + ring of dots; R grows by spring, then holds (a painted mark)
  g.strokeStyle = PAL.white; g.fillStyle = PAL.white; g.lineCap = 'round';
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(seed + i) * 0.25, l0 = R * 0.28, l1 = R * (0.78 + rand(seed * 3 + i) * 0.22);
    g.lineWidth = R * 0.085; g.beginPath(); g.moveTo(Math.cos(a) * l0, Math.sin(a) * l0); g.lineTo(Math.cos(a) * l1, Math.sin(a) * l1); g.stroke();
    const ad = a + Math.PI / n; g.beginPath(); g.arc(Math.cos(ad) * R * 1.1, Math.sin(ad) * R * 1.1, R * 0.06, 0, Math.PI * 2); g.fill();
  }
  g.beginPath(); g.arc(0, 0, R * 0.16, 0, Math.PI * 2); g.fill();
}

/* ======================= ornament bands ======================= */
function waveRun(g, a, y0, h, P) { // one period of a running wave: black body, the curl "incised" as a clay spiral
  const x = t => a + t * P, y = t => y0 + t * h;
  g.fillStyle = PAL.slip;
  g.beginPath(); g.moveTo(x(-0.01), y(1)); g.bezierCurveTo(x(0.2), y(1), x(0.24), y(0.3), x(0.55), y(0.14));
  g.bezierCurveTo(x(0.82), y(0.02), x(1.02), y(0.3), x(0.93), y(0.56)); g.bezierCurveTo(x(0.89), y(0.76), x(0.95), y(0.95), x(1.02), y(1)); g.closePath(); g.fill();
  g.strokeStyle = PAL.clay; g.lineWidth = Math.min(P * 0.07, h * 0.12); g.lineCap = 'round';
  g.beginPath();
  for (let i = 0; i <= 22; i++) { const t = i / 22, ang = -0.2 - t * 4.9, rr = 0.3 * (1 - 0.78 * t); const px = x(0.7 + Math.cos(ang) * rr * 0.62), py = y(0.42 + Math.sin(ang) * rr); i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke();
}
function meander(g, a, y0, h, P, lw) {
  const X = t => a + t * P, Yy = t => y0 + t * h;
  g.beginPath(); g.moveTo(X(0), Yy(1)); g.lineTo(X(0), Yy(0.12)); g.lineTo(X(0.72), Yy(0.12)); g.lineTo(X(0.72), Yy(0.68));
  g.lineTo(X(0.36), Yy(0.68)); g.lineTo(X(0.36), Yy(0.42)); g.stroke();
  g.beginPath(); g.moveTo(X(-0.02), Yy(1)); g.lineTo(X(1.02), Yy(1)); g.stroke();
}

/**
 * Paint the visible part of the pot surface. g has a transform: 1 unit = 1 pot unit, x = arc length.
 * u0..u1 = visible degrees (absolute), y0..y1 = visible heights, K = texels per pot unit (for hairline limits).
 */
export function paintSurface(g, T, rot, u0, u1, y0, y1, K) {
  const A0 = u0 * D2A, A1 = u1 * D2A, AW = A1 - A0;
  const px = 1 / K; // one texel in pot units
  const near = u => rot + ((((u - rot) % 360) + 540) % 360) - 180; // copy of u nearest to the front
  const vis = (u, half) => { const n = near(u); return n + half >= u0 && n - half <= u1 ? n * D2A : null; };
  const k0 = P => Math.floor(u0 / P) - 1, k1 = P => Math.ceil(u1 / P) + 1;

  // clay ground + throwing rings (horizontal, rotation-invariant → no aliasing when the pot turns)
  g.fillStyle = PAL.clay; g.fillRect(A0, y0, AW, y1 - y0);
  const step = 0.0043;
  for (let j = Math.floor(y0 / step); j <= Math.ceil(y1 / step); j++) {
    const lw = Math.max(0.0011, px * 0.9), al = (0.03 + rand(j * 1.7) * 0.05) * clamp(0.0011 / lw * 1.6, 0.25, 1);
    g.fillStyle = rand(j * 3.1) > 0.5 ? `rgba(120,52,22,${al})` : `rgba(236,160,110,${al})`;
    g.fillRect(A0, j * step + rand(j) * step * 0.6, AW, lw);
  }

  // slip-black zones (+ faint brush streaks running round the pot)
  const BLACK = [[0, 0.172], [0.268, 0.425], [0.612, 0.621], [0.689, 0.697], [1.035, 1.043], [1.083, 1.355], [1.45, 1.555], [1.567, 1.6]];
  g.fillStyle = PAL.slip;
  for (const [a, b] of BLACK) if (b > y0 && a < y1) g.fillRect(A0, a, AW, b - a);
  const SP = 9;
  for (const [a, b] of [[0, 0.172], [0.268, 0.425], [1.083, 1.355], [1.45, 1.555]]) {
    if (b < y0 || a > y1) continue;
    for (let j = 0; j < (b - a) / 0.006; j++) {
      const yy = a + j * 0.006 + 0.002;
      for (let k = k0(SP); k <= k1(SP); k++) {
        const s = rand(j * 131 + (((k % 40) + 40) % 40) * 7 + a * 1000);
        if (s < 0.55) continue;
        g.fillStyle = `rgba(92,62,44,${0.08 + (s - 0.55) * 0.18})`;
        g.fillRect((k * SP + s * 4) * D2A, yy, (3 + s * 6) * D2A, Math.max(0.0012, px));
      }
    }
  }
  // reserved clay lines inside the black lower body + foot
  g.fillStyle = PAL.clay; g.fillRect(A0, 1.19, AW, 0.006); g.fillRect(A0, 1.205, AW, 0.006);

  // neck: running wave band (the sea motif, small) 0.172–0.268
  if (y0 < 0.27 && y1 > 0.17) {
    const P = 12; for (let k = k0(P); k <= k1(P); k++) waveRun(g, k * P * D2A, 0.19, 0.06, P * D2A);
    g.fillStyle = PAL.slip; g.fillRect(A0, 0.25, AW, 0.018);
  }
  // shoulder: hanging tongues, black and outlined in turn, dots between the tips
  if (y0 < 0.61 && y1 > 0.42) {
    const P = 7.5;
    for (let k = k0(P); k <= k1(P); k++) {
      const a = k * P * D2A, w = P * D2A * 0.78, l = a + P * D2A * 0.11, top = 0.425, bot = 0.585;
      g.beginPath(); g.moveTo(l, top); g.lineTo(l, bot - w / 2); g.arc(l + w / 2, bot - w / 2, w / 2, Math.PI, 0, true); g.lineTo(l + w, top);
      if (((k % 2) + 2) % 2 === 0) { g.fillStyle = PAL.slip; g.fill(); incise(g, Math.max(0.0016, px)); g.beginPath(); g.moveTo(l + w / 2, top + 0.02); g.lineTo(l + w / 2, bot - 0.03); g.stroke(); }
      else { g.strokeStyle = PAL.slip; g.lineWidth = 0.0045; g.stroke(); }
      g.fillStyle = PAL.slip; g.beginPath(); g.arc(a + P * D2A * 0.005, 0.598, 0.0055, 0, Math.PI * 2); g.fill();
    }
  }
  // meander border above the frieze
  if (y0 < 0.69 && y1 > 0.62) {
    const P = 4.5; g.strokeStyle = PAL.slip; g.lineWidth = 0.0062; g.lineCap = 'butt'; g.lineJoin = 'miter';
    for (let k = k0(P); k <= k1(P); k++) meander(g, k * P * D2A, 0.632, 0.05, P * D2A, 0.0062);
  }
  // dot band under the frieze
  if (y0 < 1.08 && y1 > 1.04) {
    const P = 2.25; g.fillStyle = PAL.slip;
    for (let k = k0(P); k <= k1(P); k++) { g.beginPath(); g.arc(k * P * D2A, 1.063, 0.0072, 0, Math.PI * 2); g.fill(); }
  }
  // rays rising from the foot
  if (y0 < 1.45 && y1 > 1.35) {
    const P = 7.5; g.fillStyle = PAL.slip;
    for (let k = k0(P); k <= k1(P); k++) { const a = k * P * D2A, w = P * D2A * 0.8; g.beginPath(); g.moveTo(a, 1.452); g.lineTo(a + w / 2, 1.366); g.lineTo(a + w, 1.452); g.closePath(); g.fill(); }
  }

  if (y1 < Y.bandTop || y0 > Y.bandBot) return;
  /* ======================= THE FRIEZE ======================= */
  g.save(); g.beginPath(); g.rect(A0, Y.bandTop, AW, Y.bandBot - Y.bandTop); g.clip();

  // dividers: a black column with reserved lozenges
  for (const ud of [U.div1, U.div2]) {
    const a = vis(ud, 4); if (a == null) continue;
    const w = 5 * D2A; g.fillStyle = PAL.slip; g.fillRect(a - w / 2, Y.bandTop, w, Y.bandBot - Y.bandTop);
    g.fillStyle = PAL.clay;
    for (let yy = Y.bandTop + 0.03; yy < Y.bandBot - 0.02; yy += 0.046) { g.beginPath(); g.moveTo(a, yy - 0.017); g.lineTo(a + w * 0.3, yy); g.lineTo(a, yy + 0.017); g.lineTo(a - w * 0.3, yy); g.closePath(); g.fill(); }
    g.fillRect(a - w / 2 + 0.003, Y.bandTop, 0.0022, Y.bandBot - Y.bandTop); g.fillRect(a + w / 2 - 0.0052, Y.bandTop, 0.0022, Y.bandBot - Y.bandTop);
  }

  /* ---------- the sea world ---------- */
  // Cuba: island + two palms, name in slip
  { const a = vis(U.cuba, 22); if (a != null) {
    g.fillStyle = PAL.slip; const w = 28 * D2A;
    g.beginPath(); g.moveTo(a - w / 2, Y.sea + 0.004); g.bezierCurveTo(a - w * 0.38, 0.81, a - w * 0.22, 0.797, a - w * 0.05, 0.8); g.bezierCurveTo(a + w * 0.15, 0.802, a + w * 0.3, 0.806, a + w / 2, Y.sea + 0.004); g.closePath(); g.fill();
    g.strokeStyle = PAL.slip; g.lineCap = 'round';
    for (const [du, h, lean] of [[-6, 0.046, 1], [5, 0.04, -0.7]]) {
      const bx = a + du * D2A, by = 0.803, tx = bx + lean * 0.012, ty = by - h;
      g.lineWidth = 0.0042; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + lean * 0.002, by - h * 0.6, tx, ty); g.stroke();
      g.lineWidth = 0.0032;
      for (let f = 0; f < 5; f++) { const ang = -2.6 + f * 0.95; const ex = tx + Math.cos(ang) * 0.021, ey = ty + Math.sin(ang) * 0.012 + 0.007; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo((tx + ex) / 2 + Math.cos(ang) * 0.003, ty - 0.008, ex, ey); g.stroke(); }
    }
    incise(g, 0.0014); g.beginPath(); g.moveTo(a - w * 0.3, 0.818); g.quadraticCurveTo(a - w * 0.1, 0.81, a + w * 0.12, 0.818); g.stroke();
  } }
  { const a = vis(U.cubaText, 8); if (a != null) paint(g, 'CUBA', a, 0.821, 0.03, { color: PAL.slip, seed: 4, align: 'center' }); }

  // the date, painted as it is spoken
  { const a = vis(U.date, 14); if (a != null) {
    const pA = smootherstep((T - TT.dateA[0]) / (TT.dateA[1] - TT.dateA[0])), pB = smootherstep((T - TT.dateB[0]) / (TT.dateB[1] - TT.dateB[0]));
    paint(g, 'OCT 27', a, 0.762, 0.042, { p: pA, color: PAL.slip, seed: 11, align: 'center', weight: 0.14 });
    paint(g, '1962', a, 0.818, 0.042, { p: pB, color: PAL.slip, seed: 23, align: 'center', weight: 0.14 });
  } }
  // the year his part became known
  { const a = vis(U.y2002, 16); if (a != null) {
    const p = smootherstep((T - TT.y2002[0]) / (TT.y2002[1] - TT.y2002[0]));
    paint(g, '2002', a, 0.8, 0.074, { p, color: PAL.slip, seed: 37, align: 'center', weight: 0.14 });
  } }

  // ships (drawn before the waves so the waves cover their waterline)
  for (const us of [U.ship1, U.ship2]) {
    const a = vis(us, 14); if (a == null) continue;
    const L = 0.2; g.save(); g.translate(a - L / 2, Y.sea + 0.004); g.scale(L / 100, L / 100 * 1.0); ship(g); g.restore();
  }
  // waves = the sea surface (only in the sea world)
  { const P = 5; for (let k = k0(P); k <= k1(P); k++) { const u = k * P; if (!inSea(u, u + P)) continue; waveRun(g, u * D2A, Y.sea, 0.034, P * D2A); }
    g.fillStyle = PAL.slip;
    for (let k = k0(P); k <= k1(P); k++) { const u = k * P; if (inSea(u, u + P)) g.fillRect(u * D2A - 0.0005, Y.sea + 0.031, P * D2A + 0.001, 0.004); } }

  // fish (static, painted)
  const FISH = [[-48, 0.95, 1], [-26, 0.985, -1], [44, 0.975, -1], [206, 0.93, 1], [226, 0.975, -1], [252, 0.905, 1], [276, 0.96, -1], [300, 0.92, 1], [318, 0.985, -1], [236, 0.9, -1]];
  FISH.forEach(([u, y, d], i) => { const a = vis(u, 4); if (a == null) return; g.save(); g.translate(a, y); g.scale(0.0021, 0.0021); fish(g, d, i + 1); g.restore(); });

  // the submarine, low in the sea; sinks a little on "hides deep", a trail of bubbles
  { const a = vis(U.sub, 20); if (a != null) {
    const sink = 0.007 * smootherstep((T - TT.bubbles) / 1.2), L = 0.27, k = L / 100, x0 = a - L / 2, yc = Y.subY + sink;
    g.save(); g.translate(x0, yc); g.scale(k, k); submarine(g); g.restore();
    g.fillStyle = PAL.white;
    for (let i = 0; i < 7; i++) {
      const ti = TT.bubbles + i * 0.16, p = spring(T - ti, springs.gentle); if (p <= 0) continue;
      const bx = x0 + (4 + rand(i * 5) * 5) * k + Math.sin(i * 1.7) * 0.004, by = yc - 0.012 - i * 0.0095 - 0.004 * p;
      g.beginPath(); g.arc(bx, by, (0.0016 + rand(i) * 0.0016) * Math.min(1, p), 0, Math.PI * 2); g.fill();
    }
  } }

  // practice depth charges: fall from the ships, burst in added white (the bursts stay, like painted marks)
  CHARGES.forEach((c, i) => {
    const a = vis(c.u, 6); if (a == null) return;
    const tr = TT.release[i], tb = TT.burst[i];
    if (T >= tr && T < tb) {
      const p = (T - tr) / (tb - tr), y = Y.sea + 0.008 + (c.yb - Y.sea - 0.008) * Math.pow(p, 1.25);
      g.fillStyle = PAL.slip; g.beginPath(); g.ellipse(a + Math.sin(p * 3 + i) * 0.002, y, 0.0058, 0.0074, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = PAL.white; for (let j = 1; j <= 3; j++) { const yy = y - j * 0.011; if (yy > Y.sea + 0.03) { g.beginPath(); g.arc(a + Math.sin(j * 2.1 + i) * 0.003, yy, 0.0016, 0, Math.PI * 2); g.fill(); } }
    }
    if (T >= tb) {
      const s = spring(T - tb, springs.default), R = 0.03 * (0.35 + 0.65 * Math.min(1.06, s));
      g.save(); g.translate(a, c.yb); starburst(g, R, i * 9 + 3, T); g.restore();
    }
  });

  /* ---------- inside the submarine ---------- */
  { const a1 = vis((U.div1 + U.div2) / 2, 62); if (a1 != null) {
    const aL = a1 - 57.5 * D2A, aR = a1 + 57.5 * D2A;
    g.fillStyle = PAL.slip; g.fillRect(aL, Y.deck, aR - aL, 0.006); g.fillRect(aL, Y.deck + 0.011, aR - aL, 0.0035);
    g.fillRect(aL, 0.704, aR - aL, 0.005); g.fillRect(aL, 0.7118, aR - aL, 0.0024);
    for (let u = U.div1 + 9; u < U.div2 - 4; u += 16) { const a = a1 + (u - (U.div1 + U.div2) / 2) * D2A; g.beginPath(); g.arc(a, 0.7185, 0.0052, 0, Math.PI * 2); g.fill(); g.fillRect(a - 0.001, 0.712, 0.002, 0.007); }
    incise(g, 0.0014); for (let u = U.div1 + 9; u < U.div2 - 4; u += 16) { const a = a1 + (u - (U.div1 + U.div2) / 2) * D2A; g.beginPath(); g.arc(a, 0.7185, 0.0028, 0, Math.PI * 2); g.stroke(); }
  } }
  // torpedo
  { const a = vis(U.torpedo, 20); if (a != null) { const L = 0.33, k = L / 100; g.save(); g.translate(a - L / 2, 0.93); g.scale(k, k); torpedo(g, (Y.deck - 0.93) / k); g.restore(); } }

  // officers: painted in on "three officers"; two raise a hand on "Two say yes"; the third turns away on "says no"
  const H = 0.212;
  const fig = (u, i, facing, arm) => {
    const a = vis(u, 6); if (a == null) return;
    const rv = clamp((T - TT.officers[i]) / 0.34); if (rv <= 0) return;
    g.save();
    if (rv < 1) { // brush fill from the cap down, ragged lower edge
      const top = Y.deck - H * 1.07, yr = top + (H * 1.12) * smootherstep(rv), w = 0.05;
      g.beginPath(); g.moveTo(a - w, top - 0.01); g.lineTo(a + w, top - 0.01);
      for (let j = 0; j <= 10; j++) { const x = a + w - (2 * w * j) / 10; g.lineTo(x, yr + Math.sin(j * 2.3 + i) * 0.004); }
      g.closePath(); g.clip();
    }
    g.translate(a, Y.deck); g.scale((H / 100) * facing, H / 100); officer(g, arm, i + 1); g.restore();
  };
  const raise = i => clamp(spring(T - TT.vote[i], springs.gentle), 0, 1.04);
  fig(U.off1, 0, 1, raise(0));
  fig(U.off2, 1, 1, raise(1));
  { // Arkhipov: faces the others (left), then turns his back on the torpedo (right). Squash through edge-on.
    const p = smootherstep((T - TT.turn[0]) / (TT.turn[1] - TT.turn[0]));
    const f = -Math.cos(p * Math.PI); const facing = Math.sign(f || 1) * Math.max(0.12, Math.abs(f));
    fig(U.ark, 2, facing, 0);
  }
  // his name, painted beside his head (as names are written in the field on painted pots)
  { const a = vis(U.ark, 16); if (a != null) {
    const p = smootherstep((T - TT.name[0]) / (TT.name[1] - TT.name[0]));
    paint(g, 'ARKHIPOV', a, 0.765, 0.038, { p, color: PAL.slip, seed: 51, align: 'center', weight: 0.15 });
  } }
  // NO — added purple-red, with a thin slip contour so it holds on the clay
  { const a = vis(U.no, 10); if (a != null) {
    const p = smootherstep((T - TT.no[0]) / (TT.no[1] - TT.no[0]));
    if (p > 0) {
      paint(g, 'NO', a, 0.958, 0.092, { p, color: PAL.slip, seed: 61, align: 'center', weight: 0.27 });
      paint(g, 'NO', a, 0.958, 0.092, { p, color: PAL.red, seed: 61, align: 'center', weight: 0.19 });
    }
  } }
  g.restore();
}
