// Finger-drawn letters for the sand table. No font: every letter is a few single-line strokes, the way a finger
// writes in sand. Box: height 1, y down, width per glyph. Imperfection is fixed per letter (seeded), never per frame.
/** Seeded PRNG (mulberry32) → function returning [0,1). */
export function prng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const D = Math.PI / 180;
const arc = (cx, cy, rx, ry, a0, a1, n = 18) => {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return out;
};
const six = [[...arc(0.27, 0.5, 0.27, 0.5, -62, -200, 14), ...arc(0.27, 0.73, 0.25, 0.27, 180, -175, 18)]];

const G = {
  ' ': { w: 0.32, s: [] },
  A: { w: 0.62, s: [[[0, 1], [0.31, 0], [0.62, 1]], [[0.13, 0.64], [0.49, 0.64]]] },
  B: { w: 0.54, s: [[[0, 1], [0, 0], [0.28, 0], ...arc(0.28, 0.24, 0.22, 0.24, -90, 90, 10), [0, 0.48]],
                    [[0.3, 0.48], ...arc(0.3, 0.74, 0.25, 0.26, -90, 90, 10), [0, 1]]] },
  C: { w: 0.56, s: [arc(0.31, 0.5, 0.31, 0.5, -42, -318, 22)] },
  H: { w: 0.56, s: [[[0, 0], [0, 1]], [[0.56, 0], [0.56, 1]], [[0, 0.52], [0.56, 0.52]]] },
  I: { w: 0.04, s: [[[0.02, 0], [0.02, 1]]] },
  K: { w: 0.54, s: [[[0, 0], [0, 1]], [[0.54, 0], [0.02, 0.6]], [[0.17, 0.44], [0.56, 1]]] },
  O: { w: 0.66, s: [arc(0.33, 0.5, 0.33, 0.5, -100, 262, 30)] },
  P: { w: 0.52, s: [[[0, 1], [0, 0], [0.27, 0], ...arc(0.27, 0.26, 0.24, 0.26, -90, 90, 10), [0, 0.52]]] },
  R: { w: 0.54, s: [[[0, 1], [0, 0], [0.27, 0], ...arc(0.27, 0.25, 0.24, 0.25, -90, 90, 10), [0, 0.5]], [[0.22, 0.5], [0.56, 1]]] },
  T: { w: 0.58, s: [[[0, 0], [0.58, 0]], [[0.29, 0], [0.29, 1]]] },
  U: { w: 0.56, s: [[[0, 0], [0, 0.66], ...arc(0.28, 0.66, 0.28, 0.34, 180, 0, 14), [0.56, 0]]] },
  V: { w: 0.6, s: [[[0, 0], [0.3, 1], [0.6, 0]]] },
  0: { w: 0.52, s: [arc(0.26, 0.5, 0.26, 0.5, -95, 268, 28)] },
  1: { w: 0.3, s: [[[0.02, 0.2], [0.24, 0], [0.24, 1]]] },
  2: { w: 0.54, s: [[...arc(0.27, 0.27, 0.27, 0.27, -165, 28, 14), [0, 1], [0.56, 1]]] },
  6: { w: 0.54, s: six },
  7: { w: 0.54, s: [[[0, 0], [0.56, 0], [0.18, 1]]] },
  9: { w: 0.54, s: [six[0].map(([x, y]) => [0.54 - x, 1 - y]).reverse()] },
};

/** Strokes (absolute px) for a line of text. align: 0 left, 0.5 centre. Returns { strokes, w }. */
export function textStrokes(text, x, y, h, { align = 0.5, track = 0.2, seed = 1, wobble = 0.025 } = {}) {
  const chars = [...text];
  let w = 0;
  chars.forEach((c, i) => { w += (G[c]?.w ?? 0.4) * h + (i < chars.length - 1 ? track * h : 0); });
  let cx = x - w * align;
  const strokes = [];
  chars.forEach((c, i) => {
    const g = G[c] ?? G[' '];
    const r = prng(seed * 97 + i * 13 + 5);
    const lean = (r() - 0.5) * 0.06, dy = (r() - 0.5) * 0.05 * h, sc = 1 + (r() - 0.5) * 0.06;
    for (const s of g.s) {
      strokes.push(s.map(([px, py]) => [
        cx + (px + lean * (1 - py)) * h * sc + (r() - 0.5) * wobble * h,
        y + dy + (py - 0.5) * h * sc + (r() - 0.5) * wobble * h,
      ]));
    }
    cx += g.w * h + track * h;
  });
  return { strokes, w };
}

/** Pre-measure strokes so they can be drawn progressively (finger speed constant, lifts between strokes). */
export function measure(strokes) {
  let total = 0;
  const segs = strokes.map(s => {
    const lens = [];
    for (let i = 1; i < s.length; i++) { const l = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); lens.push(l); total += l; }
    return { pts: s, lens };
  });
  return { segs, total };
}

/** Stroke the first fraction p (0..1) of the measured strokes on a 2D context (path only, caller sets style). */
export function strokePartial(g, m, p) {
  if (p <= 0) return;
  let left = m.total * Math.min(1, p);
  g.beginPath();
  for (const s of m.segs) {
    if (left <= 0) break;
    g.moveTo(s.pts[0][0], s.pts[0][1]);
    for (let i = 1; i < s.pts.length; i++) {
      const l = s.lens[i - 1];
      if (left >= l) { g.lineTo(s.pts[i][0], s.pts[i][1]); left -= l; }
      else { const f = left / l; g.lineTo(s.pts[i - 1][0] + (s.pts[i][0] - s.pts[i - 1][0]) * f, s.pts[i - 1][1] + (s.pts[i][1] - s.pts[i - 1][1]) * f); left = 0; break; }
    }
  }
  g.stroke();
}
