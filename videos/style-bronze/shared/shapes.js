// Relief forms (drawn white; fill-opacity = height). All hand-tuned paths, no assets.
import { svg } from '/onclack-styles/engine/lib/anim.js';

const W = (o) => ({ fill: '#fff', 'fill-opacity': o });
const ST = (o, w) => ({ fill: 'none', stroke: '#fff', 'stroke-opacity': o, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

/** Diesel attack submarine in profile, bow to the right. len = hull length. Centre at (x, y). */
export function submarine(g, x, y, len, lv = 0.5) {
  const h = len * 0.085, k = len / 2;
  const hull = `M ${x - k} ${y + h * 0.05} C ${x - k * 0.9} ${y - h * 0.45}, ${x - k * 0.5} ${y - h * 0.5}, ${x} ${y - h * 0.52} `
    + `L ${x + k * 0.72} ${y - h * 0.5} C ${x + k * 0.95} ${y - h * 0.45}, ${x + k * 1.02} ${y - h * 0.1}, ${x + k} ${y + h * 0.06} `
    + `C ${x + k * 0.96} ${y + h * 0.42}, ${x + k * 0.8} ${y + h * 0.5}, ${x + k * 0.6} ${y + h * 0.5} `
    + `L ${x - k * 0.55} ${y + h * 0.48} C ${x - k * 0.82} ${y + h * 0.42}, ${x - k * 0.95} ${y + h * 0.3}, ${x - k} ${y + h * 0.05} Z`;
  svg('path', { d: hull, ...W(lv) }, g);
  // sail (fin) with stepped top
  const sx = x + k * 0.05, sw = len * 0.13, sh = h * 1.15;
  svg('path', { d: `M ${sx - sw * 0.55} ${y - h * 0.48} L ${sx - sw * 0.42} ${y - h * 0.48 - sh * 0.7} Q ${sx - sw * 0.38} ${y - h * 0.48 - sh} ${sx - sw * 0.1} ${y - h * 0.48 - sh} `
    + `L ${sx + sw * 0.42} ${y - h * 0.48 - sh} Q ${sx + sw * 0.55} ${y - h * 0.48 - sh * 0.9} ${sx + sw * 0.6} ${y - h * 0.48 - sh * 0.6} L ${sx + sw * 0.7} ${y - h * 0.48} Z`, ...W(lv * 0.9) }, g);
  // masts
  svg('path', { d: `M ${sx - sw * 0.05} ${y - h * 0.48 - sh} l 0 ${-h * 0.55} M ${sx + sw * 0.18} ${y - h * 0.48 - sh} l 0 ${-h * 0.35}`, ...ST(lv * 0.8, h * 0.09) }, g);
  // a rounded spine (hull is a cylinder: higher along its middle)
  svg('path', { d: `M ${x - k * 0.82} ${y - h * 0.02} L ${x + k * 0.86} ${y - h * 0.02}`, ...ST(lv * 0.5, h * 0.5) }, g);
  // stern planes + rudder
  svg('path', { d: `M ${x - k * 0.88} ${y + h * 0.1} l ${-len * 0.05} ${h * 0.55} l ${len * 0.03} 0 Z M ${x - k * 0.9} ${y} l ${-len * 0.05} ${-h * 0.5} l ${len * 0.025} 0 Z`, ...W(lv * 0.9) }, g);
  // deck line, limber holes (sunk by lower-opacity marks drawn ON the hull: read as rhythm)
  svg('path', { d: `M ${x - k * 0.6} ${y - h * 0.36} L ${x + k * 0.7} ${y - h * 0.36}`, ...ST(lv * 0.35, h * 0.06) }, g);
}

/** Destroyer in profile, bow right. len = waterline length; y = waterline. */
export function destroyer(g, x, y, len, lv = 0.6, v = 0) {
  const k = len / 2, f = len * 0.06;
  svg('path', { d: `M ${x - k} ${y - f * 0.9} L ${x + k * 0.72} ${y - f * 1.0} L ${x + k * 1.06} ${y - f * 1.5} L ${x + k * 0.93} ${y} L ${x - k * 0.95} ${y} Z`, ...W(lv) }, g);
  // superstructure blocks
  svg('path', { d: `M ${x + k * 0.22} ${y - f * 0.95} l 0 ${-f * 1.2} l ${len * 0.1} 0 l ${len * 0.05} ${-f * 0.6} l ${len * 0.06} 0 l 0 ${f * 1.8} Z`, ...W(lv * 0.92) }, g);
  svg('path', { d: `M ${x - k * 0.25} ${y - f * 0.95} l 0 ${-f * 0.85} l ${len * 0.2} 0 l 0 ${f * 0.85} Z`, ...W(lv * 0.88) }, g);
  // funnels (raked)
  [[-0.02, 1.5], [-0.2, 1.3]].forEach(([fx, fh]) => svg('path', { d: `M ${x + k * fx} ${y - f * 1.8} l ${f * 0.2} ${-f * fh} l ${f * 0.75} 0 l ${-f * 0.1} ${f * fh} Z`, ...W(lv * 0.95) }, g));
  // mast
  // tripod mast with a small radar bar set off-centre (no crossing yard)
  svg('path', { d: `M ${x + k * 0.3} ${y - f * 2.6} L ${x + k * 0.36} ${y - f * (4.6 + v)} L ${x + k * 0.42} ${y - f * 2.6}`, ...ST(lv * 0.85, f * 0.2) }, g);
  svg('path', { d: `M ${x + k * 0.36} ${y - f * (4.4 + v)} l ${f * 0.9} ${-f * 0.35}`, ...ST(lv * 0.9, f * 0.28) }, g);
  // guns fore and aft
  svg('path', { d: `M ${x + k * 0.55} ${y - f * 1.0} l 0 ${-f * 0.6} l ${f * 1.0} 0 l 0 ${f * 0.6} Z M ${x - k * 0.7} ${y - f * 0.9} l 0 ${-f * 0.6} l ${f * 1.0} 0 l 0 ${f * 0.6} Z`, ...W(lv * 0.9) }, g);
  svg('path', { d: `M ${x + k * 0.6} ${y - f * 1.35} l ${f * 1.4} ${-f * 0.25} M ${x - k * 0.66} ${y - f * 1.25} l ${-f * 1.4} ${-f * 0.25}`, ...ST(lv * 0.9, f * 0.16) }, g);
}

/** Torpedo, nose right; len along x, centre (x,y). */
export function torpedo(g, x, y, len, lv = 0.6) {
  const r = len * 0.045, k = len / 2;
  svg('path', { d: `M ${x - k * 0.84} ${y - r} L ${x + k - r * 1.6} ${y - r} C ${x + k - r * 0.4} ${y - r}, ${x + k} ${y - r * 0.45}, ${x + k} ${y} `
    + `C ${x + k} ${y + r * 0.45}, ${x + k - r * 0.4} ${y + r}, ${x + k - r * 1.6} ${y + r} L ${x - k * 0.84} ${y + r} L ${x - k * 0.94} ${y + r * 0.55} L ${x - k * 0.94} ${y - r * 0.55} Z`, ...W(lv) }, g);
  // cylinder: higher along the middle
  svg('path', { d: `M ${x - k * 0.82} ${y - r * 0.15} L ${x + k - r * 1.2} ${y - r * 0.15}`, ...ST(lv * 0.55, r * 0.9) }, g);
  // fins + propeller
  svg('path', { d: `M ${x - k * 0.8} ${y - r * 0.8} L ${x - k * 0.98} ${y - r * 2.0} L ${x - k * 1.0} ${y - r * 0.4} Z M ${x - k * 0.8} ${y + r * 0.8} L ${x - k * 0.98} ${y + r * 2.0} L ${x - k * 1.0} ${y + r * 0.4} Z`, ...W(lv * 0.95) }, g);
  svg('path', { d: `M ${x - k * 1.0} ${y - r * 0.9} L ${x - k * 1.0} ${y + r * 0.9}`, ...ST(lv, r * 0.35) }, g);
  // bands (sunk-looking: thin lower lines)
  [0.35, 0.55, -0.35].forEach((b) => svg('path', { d: `M ${x + k * b} ${y - r * 0.95} L ${x + k * b} ${y + r * 0.95}`, ...ST(0.18, r * 0.18) }, g));
}

/** Depth charge: a short drum, slightly turned. */
export function charge(g, x, y, s, lv = 0.75, rot = 0) {
  svg('rect', { x: x - s * 0.5, y: y - s * 0.65, width: s, height: s * 1.3, rx: s * 0.22, ...W(lv), transform: `rotate(${rot} ${x} ${y})` }, g);
  svg('path', { d: `M ${x - s * 0.5} ${y - s * 0.3} L ${x + s * 0.5} ${y - s * 0.3} M ${x - s * 0.5} ${y + s * 0.3} L ${x + s * 0.5} ${y + s * 0.3}`, ...ST(0.25, s * 0.1), transform: `rotate(${rot} ${x} ${y})` }, g);
}

/** Concentric pressure rings (cast ripples) — raised rings, wider = lower. */
export function rings(g, x, y, r0, n, gap, lv = 0.5) {
  for (let i = 0; i < n; i++) svg('ellipse', { cx: x, cy: y, rx: r0 + i * gap, ry: (r0 + i * gap) * 0.42, ...ST(lv * (1 - i / (n + 1)), gap * 0.28) }, g);
}

/**
 * Standing naval officer in relief (no face: a smooth head under a peaked cap). Faces +x (flip = -1 faces -x).
 * pose: { lean, head, front:[shoulder°, elbow°], back:[shoulder°, elbow°], stance, palm }
 * angles: 0 = arm hanging down, + = swung forward. s = scale (figure ≈ 400*s tall).
 */
export function officer(g, x, y, s, pose, { flip = 1, lv = 0.42 } = {}) {
  const fg = svg('g', { transform: `translate(${x} ${y}) scale(${flip * s} ${s})` }, g);
  const { lean = 0, head = 0, front = [10, 10], back = [-8, 6], stance = 30, palm = false, coat = 1 } = pose;
  const body = svg('g', { transform: `rotate(${lean} 0 -10)` }, fg);
  const limb = (pts, w, o, parent = body) => svg('polyline', { points: pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '), ...ST(o, w) }, parent);
  const arm = (sh, el, sx, sy) => {
    const a = (sh * Math.PI) / 180, b = ((sh + el) * Math.PI) / 180;
    const ex = sx + Math.sin(a) * 74, ey = sy + Math.cos(a) * 74;
    const hx = ex + Math.sin(b) * 68, hy = ey + Math.cos(b) * 68;
    return [[sx, sy], [ex, ey], [hx, hy]];
  };
  // back arm + back leg (lowest relief)
  const ba = arm(back[0], back[1], -8, -314);
  if (Math.abs(back[0]) > 12) {   // a hanging back arm is hidden by the body — do not cast it
    limb(ba, 23, lv * 0.7);
    svg('circle', { cx: ba[2][0], cy: ba[2][1], r: 9, ...W(lv * 0.7) }, body);
  }
  limb([[-10, -112], [-stance * 0.45, -70], [-stance * 0.55, -10]], 30, lv * 0.78);
  svg('path', { d: `M ${-stance * 0.55 - 12} -14 Q ${-stance * 0.55 + 20} -18 ${-stance * 0.55 + 30} -4 L ${-stance * 0.55 + 30} 0 L ${-stance * 0.55 - 14} 0 Z`, ...W(lv * 0.78) }, body);
  // front leg
  limb([[10, -112], [stance * 0.42, -72], [stance * 0.5, -10]], 32, lv);
  svg('path', { d: `M ${stance * 0.5 - 13} -15 Q ${stance * 0.5 + 22} -19 ${stance * 0.5 + 34} -4 L ${stance * 0.5 + 34} 0 L ${stance * 0.5 - 15} 0 Z`, ...W(lv) }, body);
  // naval greatcoat: rounded shoulders, flaring to a hem below the knee
  const hem = coat ? -118 : -170;
  svg('path', { d: `M -24 -330 C -36 -326, -40 -312, -39 -296 C -40 -250, -44 -190, -46 ${hem} Q 0 ${hem + 6} 48 ${hem} C 44 -200, 42 -250, 40 -296 C 40 -314, 34 -326, 22 -330 Z`, ...W(lv * 0.95) }, body);
  // coat opening + belt (low lines, read as folds)
  svg('path', { d: `M 9 -326 C 12 -270, 14 -200, 16 ${hem + 4}`, ...ST(lv * 0.22, 4) }, body);
  svg('path', { d: `M -40 -228 Q 2 -224 42 -228`, ...ST(lv * 0.3, 7) }, body);
  // collar
  svg('path', { d: `M -18 -334 L 2 -312 L 22 -334`, ...ST(lv * 0.35, 6) }, body);
  // neck + head + cap (no face)
  svg('rect', { x: -8, y: -350, width: 17, height: 24, rx: 4, ...W(lv * 0.9) }, body);
  const hd = svg('g', { transform: `rotate(${head} 0 -350)` }, body);
  // head in profile: skull, brow, a plain nose and chin — a silhouette, no features modelled
  svg('path', { d: 'M -10 -342 C -22 -350, -24 -376, -12 -386 C -2 -393, 16 -390, 21 -379 L 23 -368 L 29 -360 L 24 -357 L 25 -349 C 21 -343, 12 -341, 6 -342 Z', ...W(lv * 0.95) }, hd);
  svg('path', { d: `M -21 -377 L 24 -377 L 25 -389 L -21 -389 Z`, ...W(lv) }, hd);             // cap band
  svg('ellipse', { cx: 1, cy: -392, rx: 30, ry: 8, ...W(lv) }, hd);                          // wide flat crown
  svg('path', { d: `M 14 -378 Q 30 -378 36 -371 L 16 -372 Z`, ...W(lv * 1.05) }, hd);          // short peak
  // front arm (highest)
  const fa = arm(front[0], front[1], 10, -314);
  limb(fa, 26, lv * 1.15);
  const [hx, hy] = fa[2];
  if (palm) {
    // open hand, palm out: a flat paddle + thumb, upright (a quiet "stop"), held at chest height, not raised
    svg('path', { d: `M ${hx - 8} ${hy + 10} C ${hx - 12} ${hy - 10}, ${hx - 10} ${hy - 34}, ${hx - 2} ${hy - 40} C ${hx + 6} ${hy - 43}, ${hx + 12} ${hy - 36}, ${hx + 12} ${hy - 22} L ${hx + 11} ${hy + 10} Z`, ...W(lv * 1.25) }, body);
    // finger grooves (very low) and the thumb along the palm
    svg('path', { d: `M ${hx - 3} ${hy - 36} L ${hx - 3} ${hy - 18} M ${hx + 4} ${hy - 37} L ${hx + 4} ${hy - 18}`, ...ST(lv * 0.25, 2.2) }, body);
    svg('path', { d: `M ${hx - 8} ${hy + 4} Q ${hx - 18} ${hy - 4} ${hx - 17} ${hy - 16}`, ...ST(lv * 1.2, 8) }, body);
  } else svg('circle', { cx: hx, cy: hy, r: 11.5, ...W(lv * 1.15) }, body);
  return fg;
}
