// Era figures (flat screenprint officers, no faces) + torpedo geometry, shared by plates 3 and 4 so the cut 3 → 4 matches.
import { svg } from '/onclack-styles/engine/lib/anim.js';
import { INK, MISREG, OFFICER } from './lens.js';

/** Feet position (plate px) + height of each officer at the END of plate 3 (= START of plate 4). */
export function rowPos(L, P) {
  return L.pick({
    landscape: { xs: [0.17, 0.34, 0.76].map(f => P.w * f), feet: P.h * 0.965, h: P.h * 0.5 },
    portrait: { xs: [0.15, 0.42, 0.82].map(f => P.w * f), feet: P.h * 0.955, h: P.h * 0.4 },
  });
}

/**
 * One officer in screenprint inks inside an SVG parent.
 * kind: 'printed' (yellow under-plate + navy) | 'key' (dashed key line only — not yet printed).
 * Returns { g, yel, nav, key, verm, place(x, feetY, height) }.
 */
let fid = 0;
export function officer(parent, name, _ink, u) {
  const g = svg('g', { 'data-name': name }, parent);
  // own ink filter: displacement is in user units, so it is re-scaled with the figure to stay ~1.7 px on screen
  const id = `ink-off-${++fid}-${Math.round(u * 1000)}`;
  const f = svg('filter', { id, x: '-5%', y: '-5%', width: '110%', height: '110%' }, svg('defs', {}, g));
  const turb = svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.85, numOctaves: 2, seed: 11 + fid, result: 'n' }, f);
  const disp = svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 1.7, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  const ink = `url(#${id})`;
  const all = OFFICER.cap + OFFICER.head + OFFICER.body;
  const yel = svg('path', { d: all, fill: INK.yellow, style: 'mix-blend-mode:multiply', filter: ink }, g);
  const nav = svg('g', { filter: ink }, g);
  svg('path', { d: OFFICER.cap + OFFICER.body, fill: INK.navy }, nav);
  svg('path', { d: OFFICER.head, fill: INK.navy }, nav);
  const verm = svg('path', { d: all, fill: INK.verm, filter: ink }, g);
  svg('ellipse', { 'data-name': 'Cap badge', cx: 50, cy: 36.5, rx: 4.2, ry: 3.4, fill: INK.yellow }, g);
  const key = svg('path', { d: all, fill: 'none', stroke: INK.navy, 'stroke-width': 1.6, 'stroke-dasharray': '4 3.2', 'stroke-opacity': 0.85 }, g);
  return {
    g, yel, nav, key, verm,
    place(x, feet, h) {
      const s = h / 260;
      disp.setAttribute('scale', (1.7 * u / s).toFixed(3));
      turb.setAttribute('baseFrequency', (0.85 * s).toFixed(3));
      g.setAttribute('transform', `translate(${(x - 50 * s).toFixed(2)} ${(feet - 260 * s).toFixed(2)}) scale(${s.toFixed(4)})`);
      return s;
    },
    /** Yellow plate offset in figure units (so it stays constant in screen px). */
    misreg(s, extra = 0) {
      yel.setAttribute('transform', `translate(${((u * MISREG[0] + extra) / s).toFixed(3)} ${((u * MISREG[1] - extra * 0.6) / s).toFixed(3)})`);
    },
  };
}

/* Torpedo, 1000 long, centred on y = 0; nose to the right (it points into the story). */
export const TORP = {
  body: 'M80 -50 L860 -50 Q962 -46 1000 0 Q962 46 860 50 L80 50 L22 26 L22 -26 Z',
  fins: 'M70 -44 L26 -84 L4 -84 L30 -30 Z M70 44 L26 84 L4 84 L30 30 Z',
  prop: 'M22 0 H-6 M-6 -30 V30',
  joints: 'M700 -50 V50 M300 -50 V50 M520 -50 V50',
  warhead: 'M700 -50 L860 -50 Q962 -46 1000 0 Q962 46 860 50 L700 50 Z',
  centre: 'M-20 0 H1030',
};
