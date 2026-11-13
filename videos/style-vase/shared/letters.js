// Painted inscriptions: our own brush alphabet (not a font). Thin archaic-looking capitals, cap height = 6 units,
// drawn stroke by stroke with a brush whose width swells in the middle of each stroke (loaded brush) and thins at
// the ends. Small fixed wobble per letter (seeded by position, never by time), so each painted word is "one hand".
import { rand } from '/onclack-styles/engine/lib/anim.js';

const arc = (cx, cy, rx, ry, a0, a1, n = 14) => {
  const p = [];
  for (let i = 0; i <= n; i++) { const a = ((a0 + (a1 - a0) * i / n) * Math.PI) / 180; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return p;
};
const six = [[2.9, 0.4], [1.9, 0], [0.9, 0.4], [0.2, 1.8], [0, 3.6], [0.3, 5.2], [1.2, 6], [2.2, 6], [3.0, 5.3], [3.2, 4.3], [2.9, 3.3], [2.0, 2.8], [1.0, 3.0], [0.1, 3.8]];

export const GLYPHS = {
  A: { w: 4, s: [[[0, 6], [2, 0], [4, 6]], [[0.95, 3.7], [3.05, 3.7]]] },
  B: { w: 3.6, s: [[[0, 6], [0, 0]], [[0, 0], [2.2, 0], [3.0, 0.5], [3.2, 1.4], [2.9, 2.4], [2.1, 2.9], [0, 2.9]], [[0, 2.9], [2.4, 2.9], [3.3, 3.5], [3.5, 4.5], [3.2, 5.5], [2.4, 6], [0, 6]]] },
  C: { w: 4, s: [arc(2.2, 3, 2.1, 3, -48, -312, 18)] },
  H: { w: 3.4, s: [[[0, 0], [0, 6]], [[3.4, 0], [3.4, 6]], [[0, 3], [3.4, 3]]] },
  I: { w: 0.7, s: [[[0.35, 0], [0.35, 6]]] },
  K: { w: 3.3, s: [[[0, 0], [0, 6]], [[3.2, 0], [0.1, 3.3]], [[1.1, 2.4], [3.4, 6]]] },
  N: { w: 3.5, s: [[[0, 6], [0, 0]], [[0, 0], [3.5, 6]], [[3.5, 6], [3.5, 0]]] },
  O: { w: 4.2, s: [arc(2.1, 3, 2.1, 3, -90, 272, 24)] },
  P: { w: 3.3, s: [[[0, 6], [0, 0]], [[0, 0], [2.2, 0], [3.1, 0.6], [3.3, 1.6], [3.0, 2.6], [2.1, 3.2], [0, 3.2]]] },
  R: { w: 3.5, s: [[[0, 6], [0, 0]], [[0, 0], [2.2, 0], [3.1, 0.6], [3.3, 1.6], [3.0, 2.6], [2.1, 3.2], [0, 3.2]], [[1.5, 3.2], [3.5, 6]]] },
  T: { w: 4, s: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]] },
  U: { w: 3.4, s: [[[0, 0], [0, 4.2], ...arc(1.7, 4.3, 1.7, 1.7, 180, 0, 10).slice(1), [3.4, 0]]] },
  V: { w: 3.8, s: [[[0, 0], [1.9, 6]], [[1.9, 6], [3.8, 0]]] },
  0: { w: 3.4, s: [arc(1.7, 3, 1.7, 3, -90, 272, 22)] },
  1: { w: 1.6, s: [[[0, 1.1], [1.5, 0], [1.5, 6]]] },
  2: { w: 3.3, s: [[[0.1, 1.3], [0.6, 0.4], [1.6, 0], [2.6, 0.3], [3.1, 1.2], [2.9, 2.3], [0, 6], [3.4, 6]]] },
  5: { w: 3.3, s: [[[3.1, 0], [0.5, 0], [0.2, 2.6]], [[0.2, 2.6], [1.4, 2.2], [2.5, 2.4], [3.2, 3.3], [3.3, 4.5], [2.8, 5.5], [1.7, 6], [0.6, 5.7], [0, 5]]] },
  6: { w: 3.2, s: [six] },
  7: { w: 3.3, s: [[[0, 0], [3.3, 0], [1.2, 6]]] },
  9: { w: 3.2, s: [six.map(([x, y]) => [3.2 - x, 6 - y])] },
  '-': { w: 2.2, s: [[[0.1, 3.4], [2.1, 3.4]]] },
  ' ': { w: 1.6, s: [] },
};
const GAP = 1.25;

/** Width of a painted word in the same units as `cap`. */
export function textWidth(str, cap) {
  let w = 0;
  for (const ch of str) w += (GLYPHS[ch]?.w ?? 2) + GAP;
  return (w - GAP) * cap / 6;
}

/** Paint `str` with its baseline-left at (x, y); cap = cap height. p 0..1 = how much of the word is painted (brush order). */
export function paint(g, str, x, y, cap, { p = 1, color = '#E8DDC6', weight = 0.13, seed = 1, align = 'left' } = {}) {
  if (p <= 0) return;
  const k = cap / 6;
  let cx = align === 'center' ? x - textWidth(str, cap) / 2 : x;
  // flatten all strokes to know the total brush length (for the progressive reveal)
  const strokes = [];
  let li = 0;
  for (const ch of str) {
    const gl = GLYPHS[ch] ?? GLYPHS[' '];
    const jx = (rand(seed * 31 + li * 7.1) - 0.5) * 0.18, jy = (rand(seed * 17 + li * 3.3) - 0.5) * 0.25, sl = (rand(seed * 5 + li) - 0.5) * 0.05;
    gl.s.forEach((s, si) => {
      const pts = s.map(([px, py], pi) => [cx + (px + jx + (6 - py) * sl + (rand(seed + li * 13 + si * 5 + pi) - 0.5) * 0.12) * k, y - (6 - py - jy) * k]);
      let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      strokes.push({ pts, len: Math.max(len, k * 0.3), w: weight * cap * (0.85 + rand(seed * 3 + li * 11 + si) * 0.3) });
    });
    cx += (gl.w + GAP) * k;
    li++;
  }
  const total = strokes.reduce((a, s) => a + s.len, 0);
  let budget = total * Math.min(1, p);
  g.save();
  g.strokeStyle = color; g.fillStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of strokes) {
    if (budget <= 0) break;
    const use = Math.min(budget, s.len); budget -= use;
    // walk the stroke, segment by segment, width swelling in the middle (brush pressure)
    let acc = 0;
    for (let i = 1; i < s.pts.length; i++) {
      const [x0, y0] = s.pts[i - 1], [x1, y1] = s.pts[i];
      const seg = Math.hypot(x1 - x0, y1 - y0);
      if (acc >= use) break;
      const f = Math.min(1, (use - acc) / (seg || 1));
      const m = (acc + seg * 0.5) / s.len;
      g.lineWidth = s.w * (0.72 + 0.42 * Math.sin(Math.PI * Math.min(1, Math.max(0, m))));
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f); g.stroke();
      acc += seg;
    }
    if (s.pts.length === 2 && s.len < k * 0.5) { g.beginPath(); g.arc(s.pts[0][0], s.pts[0][1], s.w * 0.6, 0, Math.PI * 2); g.fill(); }
  }
  g.restore();
}
