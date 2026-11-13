// Officer figures in marquetry: flat veneer pieces, NO faces (head = one pear-wood piece, sand-shaded on the
// shadow side). Grain follows each limb (coat grain runs down the body, sleeve grain runs along the arm).
// Three different poses, not one stamped icon: 'urge' (leans in, arm thrust forward), 'crossed' (arms folded,
// weight back), 'still' (upright, hands open, head a little down).
import { svg } from '/onclack-styles/engine/lib/anim.js';
import { piece } from './inlay.js';

const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

// local design box 240 × 560, feet on y = 556
const BASE = {
  legL: ['M70 328 L118 328 L114 538 L82 538 Z', 'bog', -88],
  legR: ['M122 328 L170 328 L160 538 L128 538 Z', 'bog', -92],
  shoeL: ['M78 536 L116 536 L118 556 L66 556 Q66 544 78 536 Z', 'ebony', 0],
  shoeR: ['M126 536 L162 536 Q174 544 174 556 L124 556 Z', 'ebony', 0],
  coat: ['M66 128 C90 116 150 116 174 128 L186 238 L178 336 L62 336 L54 238 Z', 'bog', 90],
  shirt: ['M102 121 L138 121 L120 172 Z', 'holly', 90],
  tie: ['M117 128 L123 128 L126 168 L120 178 L114 168 Z', 'ebony', 90],
  boardL: ['M60 129 L92 120 L95 131 L64 140 Z', 'satin', -16],
  boardR: ['M148 120 L180 129 L176 140 L145 131 Z', 'satin', 16],
  neck: ['M108 104 L132 104 L134 124 L106 124 Z', 'pear', 90],
};
const HEAD = {
  head: [ell(120, 80, 27, 33), 'pear', 84],
  crown: ['M82 62 C80 34 158 28 162 58 L160 66 C138 60 104 60 84 68 Z', 'walnut', 0],
  band: ['M84 66 C104 60 138 60 160 64 L160 72 C138 68 104 68 84 74 Z', 'ebony', 0],
  badge: [ell(122, 56, 6, 5), 'satin', 0],
  visor: ['M98 72 C112 70 136 70 150 72 L146 80 C132 77 114 77 102 80 Z', 'ebony', 0],
};
const ARMS = {
  urge: {
    armL: ['M56 134 L76 136 L84 236 L76 306 L58 304 L54 232 Z', 'bog', 92],
    handL: [ell(66, 318, 10, 14), 'pear', 90],
    armR: ['M160 130 L182 132 L212 196 L252 176 L260 196 L214 224 L196 218 Z', 'bog', 50],
    handR: [ell(266, 182, 15, 10), 'pear', -20],
    cuffL: ['M57 282 L77 284 L76 292 L57 290 Z', 'satin', 0], cuffR: ['M236 196 L246 190 L250 197 L240 203 Z', 'satin', -30],
    lean: 5,
  },
  crossed: {
    armR: ['M164 134 L184 136 L190 236 L170 240 Z', 'bog', 88],
    armL: ['M56 136 L76 134 L84 220 L170 208 L178 234 L80 250 L56 240 Z', 'bog', 0],
    handL: [ell(178, 222, 12, 11), 'pear', 0],
    handR: [ell(62, 238, 10, 10), 'pear', 0],
    cuffL: ['M150 211 L156 210 L159 232 L153 233 Z', 'satin', 90], cuffR: ['M168 222 L188 220 L189 228 L169 230 Z', 'satin', 0],
    lean: -2,
  },
  still: {
    armL: ['M56 134 L76 136 L82 236 L80 314 L62 316 L56 236 Z', 'bog', 90],
    handL: [ell(71, 330, 10, 15), 'pear', 90],
    armR: ['M164 136 L184 134 L186 236 L180 316 L162 314 L160 236 Z', 'bog', 90],
    handR: [ell(171, 330, 10, 15), 'pear', 90],
    cuffL: ['M62 294 L80 294 L80 302 L62 302 Z', 'satin', 0], cuffR: ['M162 294 L181 294 L181 302 L162 302 Z', 'satin', 0],
    lean: 0, headTilt: 5,
  },
};
// sand-shading side per part (key light upper-left → shadow on the right / underside)
const SHADE = { head: 'r', coat: 'r', legL: 'r', legR: 'r', head: 'r', armR: 'r', armL: 'b', crown: 'b', neck: 't', handL: 'r', handR: 'r' };

/**
 * Build an officer. o = { x, y (feet point), h (height px), pose, at (local time the last piece seats),
 *   scoreFrom (local time the knife lines start; optional), name, seed }
 */
export function officer(P, parent, o) {
  const s = o.h / 560;
  const A = ARMS[o.pose];
  const g = svg('g', { 'data-name': o.name, transform: `translate(${o.x - 120 * s} ${o.y - 556 * s}) scale(${s}) rotate(${A.lean} 120 556)` }, parent);
  const body = svg('g', { 'data-name': 'Body' }, g);
  const headG = svg('g', { 'data-name': 'Head (no face)', transform: A.headTilt ? `rotate(${A.headTilt} 120 118)` : '' }, g);
  // seating order (cascade): legs → shoes → coat → arms → shirt/tie → boards → neck → head → cap
  const order = [
    ['legL', BASE], ['legR', BASE], ['shoeL', BASE], ['shoeR', BASE], ['coat', BASE], ['armL', A], ['armR', A],
    ['cuffL', A], ['cuffR', A], ['handL', A], ['handR', A], ['shirt', BASE], ['tie', BASE], ['boardL', BASE], ['boardR', BASE], ['neck', BASE],
    ['head', HEAD], ['crown', HEAD], ['band', HEAD], ['visor', HEAD], ['badge', HEAD],
  ];
  const n = order.length, step = o.step ?? 0.05;
  const pieces = order.map(([k, set], i) => {
    const [d, sp, ang] = set[k];
    const par = set === HEAD ? headG : body;
    const at = o.at - (n - 1 - i) * step;
    const big = k === 'coat' || k.startsWith('leg') || k.startsWith('arm') || k === 'head';
    return piece(P, par, {
      d, species: sp, angle: ang, seed: (o.seed ?? 1) * 40 + i, name: `${o.name} · ${k}`, at,
      dur: 0.34, dist: (big ? 70 : 40) / 1, dir: k.startsWith('leg') || k.startsWith('shoe') ? -90 : ang,
      score: big && o.scoreFrom != null ? (o.scoreDur ?? 1.2) : 0,
      scoreAt: big && o.scoreFrom != null ? o.scoreFrom + i * 0.03 : undefined,
      winAt: o.winAt,
      shade: SHADE[k], shadeAmt: k === 'head' ? 1 : 0.75, joint: 1.6 / s, scale: 0.6 / s,
    });
  });
  return { g, update: t => pieces.forEach(p => p.update(t)) };
}
