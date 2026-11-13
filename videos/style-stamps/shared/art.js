// Stamp artwork drawn in code (our own simplified designs, truth code RC/VO — not plans of real boats, no real stamp copied).
import { svg } from '/onclack-styles/engine/lib/anim.js';

/** Diesel-electric submarine side view, centre (0,0), length L, bow to the RIGHT. */
export function subD(L) {
  const k = L / 100, h = L * 0.07;
  return {
    hull: `M ${-50 * k} ${0.15 * h} C ${-47 * k} ${-0.85 * h} ${-32 * k} ${-h} ${-12 * k} ${-h} L ${33 * k} ${-h}
      C ${45 * k} ${-h} ${50 * k} ${-0.4 * h} ${50 * k} ${0.1 * h} C ${49 * k} ${0.75 * h} ${41 * k} ${h} ${30 * k} ${h}
      L ${-31 * k} ${h} C ${-43 * k} ${h} ${-49 * k} ${0.75 * h} ${-50 * k} ${0.15 * h} Z`,
    sail: `M ${-3 * k} ${-h + 1} L ${-0.5 * k} ${-2.4 * h} Q ${0.5 * k} ${-2.65 * h} ${6 * k} ${-2.65 * h} L ${11 * k} ${-2.6 * h}
      Q ${13 * k} ${-2.5 * h} ${14 * k} ${-2.2 * h} L ${17 * k} ${-h + 1} Z
      M ${3 * k} ${-2.6 * h} L ${3.6 * k} ${-3.4 * h} L ${4.6 * k} ${-3.4 * h} L ${5.2 * k} ${-2.6 * h} Z`,
    tail: `M ${-47 * k} ${-0.2 * h} L ${-54 * k} ${-1.1 * h} L ${-55 * k} ${1.0 * h} L ${-47 * k} ${0.6 * h} Z`,
  };
}

/** Destroyer side view, waterline y=0, bow RIGHT; v changes the superstructure. */
export function shipD(L, v = 0) {
  const k = L / 100;
  const hull = `M ${-50 * k} ${-5 * k} L ${42 * k} ${-6.5 * k} L ${52 * k} ${-9 * k} L ${45 * k} ${2.5 * k} L ${-46 * k} ${2.5 * k} Z`;
  const b = v ? [[-34, -12], [-6, -12], [-4, -6], [-36, -5.5], [4, -16], [18, -16], [21, -7], [2, -6.6]]
              : [[-28, -13], [-2, -13], [0, -6], [-30, -5.5], [8, -18], [21, -18], [25, -7], [6, -6.6]];
  const sup = `M ${b[0][0] * k} ${b[0][1] * k} L ${b[1][0] * k} ${b[1][1] * k} L ${b[2][0] * k} ${b[2][1] * k} L ${b[3][0] * k} ${b[3][1] * k} Z
    M ${b[4][0] * k} ${b[4][1] * k} L ${b[5][0] * k} ${b[5][1] * k} L ${b[6][0] * k} ${b[6][1] * k} L ${b[7][0] * k} ${b[7][1] * k} Z`;
  const fx = v ? -20 : -16;
  const fun = `M ${fx * k} ${-12 * k} L ${(fx + 1.5) * k} ${-21 * k} L ${(fx + 7) * k} ${-21 * k} L ${(fx + 7) * k} ${-12 * k} Z`;
  const mx = v ? 10 : 13;
  const mast = `M ${mx * k} ${-17 * k} L ${(mx + 0.7) * k} ${-33 * k} L ${(mx + 1.7) * k} ${-33 * k} L ${(mx + 2.4) * k} ${-17 * k} Z
    M ${(mx - 3) * k} ${-29 * k} L ${(mx + 6) * k} ${-28.4 * k} L ${(mx + 6) * k} ${-27.4 * k} L ${(mx - 3) * k} ${-28 * k} Z`;
  return { hull, sup: sup + ' ' + fun + ' ' + mast };
}

/** Torpedo side view, centre (0,0), length L, nose RIGHT. */
export function torpD(L) {
  const k = L / 100, r = L * 0.05;
  return {
    body: `M ${-44 * k} ${-r} L ${37 * k} ${-r} C ${46 * k} ${-r} ${50 * k} ${-r * 0.4} ${50 * k} 0 C ${50 * k} ${r * 0.4} ${46 * k} ${r} ${37 * k} ${r}
      L ${-44 * k} ${r} C ${-47 * k} ${r * 0.8} ${-48 * k} ${r * 0.4} ${-48 * k} 0 C ${-48 * k} ${-r * 0.4} ${-47 * k} ${-r * 0.8} ${-44 * k} ${-r} Z`,
    fins: `M ${-40 * k} ${-r} L ${-47 * k} ${-r * 2} L ${-50 * k} ${-r * 2} L ${-48 * k} ${-r * 0.5} Z
      M ${-40 * k} ${r} L ${-47 * k} ${r * 2} L ${-50 * k} ${r * 2} L ${-48 * k} ${r * 0.5} Z
      M ${-48 * k} ${-r * 0.7} L ${-52.5 * k} ${-r * 0.95} L ${-52.5 * k} ${r * 0.95} L ${-48 * k} ${r * 0.7} Z`,
    bands: [-30, -4, 24].map((x) => `M ${x * k} ${-r} h ${1.4 * k} v ${2 * r} h ${-1.4 * k} Z`).join(' '),
    r,
  };
}

/**
 * Officer figures for the se-tenant strip — faceless, seen from behind / three-quarter back, each with its own posture.
 * Drawn in a 100 × 150 box (feet at y=150). pose: 0 = leaning on the chart table, 1 = standing, arms folded, weight on one leg,
 * 2 = upright, one open hand raised at chest height (a "stop" gesture, palm out, low — not a salute).
 */
export function officer(parent, pose, ink, light) {
  const g = svg('g', {}, parent);
  const P = (d, f = ink) => svg('path', { d, fill: f }, g);
  if (pose === 0) {
    // leaning forward over a chart table, both hands on the table, cap, back to us
    P('M 4 104 L 98 104 L 98 111 L 4 111 Z', ink);                     // table top
    P('M 10 111 L 15 111 L 15 150 L 10 150 Z M 88 111 L 93 111 L 93 150 L 88 150 Z');
    P('M 12 104 L 30 97 L 70 99 L 90 104 Z', light);                   // the chart, lighter
    P('M 46 36 C 40 34 33 40 34 47 C 35 54 41 57 47 56 C 53 55 57 49 55 42 C 54 38 50 36 46 36 Z');     // head (back)
    P('M 31 41 C 38 34 52 32 59 38 L 61 41 L 30 44 Z');                // cap
    P('M 36 58 C 48 52 62 55 68 66 L 76 100 L 68 101 L 60 76 L 58 104 L 30 104 L 30 80 L 24 101 L 17 101 L 24 68 C 26 62 30 59 36 58 Z'); // torso + arms to table
    P('M 32 104 L 56 104 L 58 150 L 49 150 L 45 118 L 41 150 L 32 150 Z');   // legs
  } else if (pose === 1) {
    // standing, arms folded, weight on the right leg, body turned slightly
    P('M 52 22 C 45 21 40 27 41 34 C 42 41 48 45 54 43 C 60 41 63 35 61 29 C 60 25 56 22 52 22 Z');
    P('M 39 28 C 45 20 60 19 65 26 L 66 29 L 38 31 Z');
    P('M 40 46 C 50 41 62 43 68 50 C 72 56 72 70 70 84 L 69 98 L 36 98 L 34 82 C 32 68 33 54 40 46 Z');
    P('M 34 66 C 44 62 60 62 70 66 L 70 74 C 60 71 44 71 34 74 Z', light);   // folded forearms catch light
    P('M 37 98 L 69 98 L 66 150 L 57 150 L 53 112 L 49 150 L 40 150 Z');
  } else {
    // upright, left arm down, right hand open at chest height, palm out (a calm "no")
    P('M 48 20 C 41 19 36 25 37 32 C 38 39 44 43 50 41 C 56 39 59 33 57 27 C 56 23 52 20 48 20 Z');
    P('M 35 26 C 41 18 56 17 61 24 L 62 27 L 34 29 Z');
    P('M 36 44 C 46 39 58 41 64 48 C 67 55 67 70 66 84 L 65 98 L 33 98 L 32 82 C 30 68 31 52 36 44 Z');
    P('M 34 50 L 28 76 L 29 94 L 34 94 L 35 77 L 38 58 Z');            // left arm hanging
    P('M 62 50 C 70 54 76 60 79 64 L 76 68 C 72 64 67 61 62 59 Z');     // right upper arm
    P('M 76 70 L 79 56 L 81 56 L 81 52 L 83 52 L 83 50 L 85 50 L 85 52 L 87 53 L 87 66 L 82 71 Z', light); // open palm, fingers up
    P('M 35 98 L 64 98 L 62 150 L 53 150 L 49 112 L 45 150 L 37 150 Z');
  }
  return g;
}
