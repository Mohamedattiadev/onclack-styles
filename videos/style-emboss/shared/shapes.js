// Relief dies drawn in code: hull profiles, torpedo, map, officer figures. All are height-map shapes (see relief.js).
// Profiles are simplified reconstructions (truth code RC), not plans of the real boats.
import { svg } from '/onclack-styles/engine/lib/anim.js';
import { hgt } from './relief.js';

/** Foxtrot-type diesel submarine, side view, centred on (0,0), length L. Returns path d strings. */
export function subPaths(L) {
  const h = L * 0.075, k = L / 100;
  const hull = `M ${-50 * k} ${0.2 * h} C ${-46 * k} ${-0.9 * h}, ${-30 * k} ${-h}, ${-10 * k} ${-h} L ${34 * k} ${-h}
    C ${44 * k} ${-h}, ${50 * k} ${-0.45 * h}, ${50.5 * k} ${0.05 * h} C ${49 * k} ${0.7 * h}, ${40 * k} ${h}, ${30 * k} ${h}
    L ${-30 * k} ${h} C ${-42 * k} ${h}, ${-49 * k} ${0.8 * h}, ${-50 * k} ${0.2 * h} Z`;
  const sail = `M ${-2 * k} ${-h + 1} L ${0 * k} ${-2.35 * h} C ${1 * k} ${-2.6 * h}, ${12 * k} ${-2.6 * h}, ${13 * k} ${-2.35 * h}
    L ${17 * k} ${-h + 1} Z`;
  const mast = `M ${4 * k} ${-2.5 * h} L ${4.6 * k} ${-3.3 * h} L ${5.6 * k} ${-3.3 * h} L ${6 * k} ${-2.5 * h} Z`;
  const rudder = `M ${-47 * k} ${-0.1 * h} L ${-53 * k} ${-0.9 * h} L ${-54 * k} ${0.9 * h} L ${-47 * k} ${0.6 * h} Z`;
  const deck = `M ${-36 * k} ${-h} L ${42 * k} ${-h}`;
  return { hull, sail, mast, rudder, deck, h };
}

/** Destroyer side view, waterline at y=0, bow to the RIGHT. variant 0..2 changes the superstructure. */
export function shipPaths(L, v = 0) {
  const k = L / 100;
  const hull = `M ${-50 * k} ${-5 * k} L ${44 * k} ${-6.5 * k} L ${52 * k} ${-8.5 * k} L ${46 * k} ${3 * k} L ${-46 * k} ${3 * k} L ${-50 * k} ${-1 * k} Z`;
  const blocks = [
    [[-30, -13], [-4, -13], [-2, -6], [-32, -5.5]],
    v === 1 ? [[2, -15], [16, -15], [20, -7], [0, -6.5]] : [[6, -17], [20, -17], [24, -7], [4, -6.5]],
    v === 2 ? [[-44, -9], [-36, -9], [-35, -5.5], [-45, -5.2]] : [[28, -11], [36, -11], [38, -7], [27, -7]],
  ];
  const sup = blocks.map((b) => 'M ' + b.map(([x, y]) => `${x * k} ${y * k}`).join(' L ') + ' Z').join(' ');
  const fx = [-20, -10].slice(0, v === 1 ? 1 : 2);
  const funnels = fx.map((x) => `M ${x * k} ${-13 * k} L ${(x + 1) * k} ${-21 * k} L ${(x + 6) * k} ${-21 * k} L ${(x + 6) * k} ${-13 * k} Z`).join(' ');
  const mx = v === 1 ? 9 : 12;
  const mast = `M ${mx * k} ${-17 * k} L ${(mx + 0.6) * k} ${-32 * k} L ${(mx + 1.6) * k} ${-32 * k} L ${(mx + 2.2) * k} ${-17 * k} Z
    M ${(mx - 1.5) * k} ${-33.5 * k} L ${(mx + 4) * k} ${-32.5 * k} L ${(mx + 4) * k} ${-31.6 * k} L ${(mx - 1.5) * k} ${-32.4 * k} Z`; // radar bar on top
  return { hull, sup, funnels, mast };
}

/** Torpedo side view centred at (0,0), length L, nose to the RIGHT. */
export function torpedoPaths(L) {
  const r = L * 0.055, k = L / 100;
  const body = `M ${-44 * k} ${-r} L ${36 * k} ${-r} C ${46 * k} ${-r}, ${50 * k} ${-r * 0.35}, ${50 * k} 0
    C ${50 * k} ${r * 0.35}, ${46 * k} ${r}, ${36 * k} ${r} L ${-44 * k} ${r} C ${-47 * k} ${r * 0.8}, ${-48 * k} ${r * 0.4}, ${-48 * k} 0
    C ${-48 * k} ${-r * 0.4}, ${-47 * k} ${-r * 0.8}, ${-44 * k} ${-r} Z`;
  const fins = `M ${-40 * k} ${-r} L ${-47 * k} ${-r * 2.0} L ${-50 * k} ${-r * 2.0} L ${-48 * k} ${-r * 0.5} Z
    M ${-40 * k} ${r} L ${-47 * k} ${r * 2.0} L ${-50 * k} ${r * 2.0} L ${-48 * k} ${r * 0.5} Z`;
  const prop = `M ${-48 * k} ${-r * 0.75} L ${-52 * k} ${-r * 0.9} L ${-52 * k} ${r * 0.9} L ${-48 * k} ${r * 0.75} Z`;
  const bands = [-30, -6, 22].map((x) => `M ${x * k} ${-r} L ${(x + 1.1) * k} ${-r} L ${(x + 1.1) * k} ${r} L ${x * k} ${r} Z`).join(' ');
  return { body, fins, prop, bands, r };
}

/** Equirectangular-ish projection for the Caribbean (cos lat correction at 24°N). */
export function mapProjector(view, box) {
  const [lon0, lat0, lon1, lat1] = view; const c = Math.cos(24 * Math.PI / 180);
  const sx = box.w / ((lon1 - lon0) * c), sy = box.h / (lat1 - lat0); const s = Math.min(sx, sy);
  const ox = box.x + (box.w - (lon1 - lon0) * c * s) / 2, oy = box.y + (box.h - (lat1 - lat0) * s) / 2;
  return ([lon, lat]) => [ox + (lon - lon0) * c * s, oy + (lat1 - lat) * s];
}
export function ringsToPath(rings, proj, minPts = 6) {
  return rings.filter((r) => r.length >= minPts).map((r) => 'M ' + r.map((p) => proj(p).map((v) => v.toFixed(1)).join(' ')).join(' L ') + ' Z').join(' ');
}

function mkArmIn(ga, l, w1, w2) {
  const a = svg('line', { stroke: hgt(l), 'stroke-width': w1, 'stroke-linecap': 'round' }, ga);
  const b = svg('line', { stroke: hgt(l), 'stroke-width': w2, 'stroke-linecap': 'round' }, ga);
  return (p0, p1, p2) => { [['x1', p0[0]], ['y1', p0[1]], ['x2', p1[0]], ['y2', p1[1]]].forEach(([k, v]) => a.setAttribute(k, v.toFixed(1)));
    [['x1', p1[0]], ['y1', p1[1]], ['x2', p2[0]], ['y2', p2[1]]].forEach(([k, v]) => b.setAttribute(k, v.toFixed(1))); };
}
/** Closed path around a polyline with a width per point (a tapered limb: sleeve → cuff). */
function limb(pts, ws) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
    const w = ws[i] / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const e = pts[pts.length - 1], st = pts[0];
  return `M ${f(L[0])} ` + L.slice(1).map((p) => `L ${f(p)}`).join(' ')
    + ` A ${ws[ws.length - 1] / 2} ${ws[ws.length - 1] / 2} 0 0 0 ${f(R[R.length - 1])} `
    + R.slice(0, -1).reverse().map((p) => `L ${f(p)}`).join(' ') + ` A ${ws[0] / 2} ${ws[0] / 2} 0 0 0 ${f(L[0])} Z`;
}

/**
 * Officer in bas-relief (no face: a smooth head — we never invent a real face). Greatcoat to the knee, peaked cap,
 * tapered sleeves, boots. Local units: feet at (0,0), ~400 tall. Angles in degrees, 0 = hanging down, + = toward the front (+x).
 * Returns { g, pose(p) } — call pose() every frame to animate a gesture.
 */
export function officer(parent, { x, y, s = 1, flip = 1, lv = 0.62, name = 'Officer' }) {
  const g = svg('g', { 'data-name': name, transform: `translate(${x} ${y}) scale(${s * flip} ${s})`, style: `filter: blur(${(1.6 * s).toFixed(2)}px)` }, parent);
  const P = (l) => svg('path', { fill: hgt(l) }, g);
  const backArmEl = svg('g', {}, g), backLeg = P(lv - 0.1), frontLeg = P(lv - 0.04);
  const backArm = mkArmIn(backArmEl, lv - 0.16, 29, 23);
  const coat = P(lv), lapel = svg('path', { fill: 'none', stroke: hgt(lv - 0.25), 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
  const buttons = svg('g', {}, g);
  for (let r = 0; r < 4; r++) for (const bx of [-11, 11]) svg('circle', { cx: bx, cy: -282 + r * 30, r: 3.6, fill: hgt(lv + 0.22) }, buttons);
  const core = svg('ellipse', { cx: 0, cy: -250, rx: 30, ry: 78, fill: hgt(lv + 0.16), style: 'filter: blur(14px)' }, g);
  const belt = P(lv + 0.08), collar = P(lv + 0.1);
  const head = svg('ellipse', { rx: 25, ry: 31, fill: hgt(lv + 0.1) }, g);
  const cap = P(lv + 0.22);
  const mkArm = (l, w1, w2) => mkArmIn(svg('g', {}, g), l, w1, w2);
  const frontArm = mkArm(lv + 0.24, 31, 24), hand = P(lv + 0.3);
  const D = Math.PI / 180;
  const seg = (o, a, len) => [o[0] + Math.sin(a * D) * len, o[1] + Math.cos(a * D) * len];
  function pose({ lean = 0, tilt = 0, front = [10, 20], back = [-8, -4], legs = [6, -6], stance = 14 }) {
    g.setAttribute('transform', `translate(${x} ${y}) scale(${s * flip} ${s}) rotate(${lean})`);
    // legs: only knee → boot shows below the coat
    const legPath = (hx, a) => { const knee = seg([hx, -175], a, 70), ank = seg(knee, a * 0.4, 92);
      return limb([[hx, -175], knee, [ank[0], -16]], [34, 30, 26]) + ` M ${ank[0] - 14} -24 L ${ank[0] + 26} -22 C ${ank[0] + 34} -18, ${ank[0] + 32} 0, ${ank[0] + 24} 0 L ${ank[0] - 16} 0 Z`; };
    frontLeg.setAttribute('d', legPath(stance * 0.5, legs[0]));
    backLeg.setAttribute('d', legPath(-stance * 0.5, legs[1]));
    // greatcoat: sloped shoulders, waist, flared skirt to below the knee; hem a little uneven (cloth, not a stamp)
    const hem = -112 + legs[0] * 0.6;
    coat.setAttribute('d', `M -46 -324 C -58 -318, -60 -296, -54 -270 C -48 -240, -40 -222, -38 -204
      C -44 -170, -54 -140, -60 ${hem - 4} C -30 ${hem + 6}, 26 ${hem + 4}, 58 ${hem - 2} C 52 -140, 42 -170, 38 -204
      C 40 -222, 48 -240, 54 -270 C 60 -296, 58 -318, 46 -324 C 30 -332, -30 -332, -46 -324 Z`);
    lapel.setAttribute('d', 'M -16 -326 L -4 -286 L 0 -300 M 16 -326 L 4 -286 M 0 -300 L 0 -196 M 2 -196 L 4 -118');
    belt.setAttribute('d', 'M -40 -214 L 40 -214 L 39 -200 L -39 -200 Z M -7 -216 L 7 -216 L 7 -198 L -7 -198 Z');
    collar.setAttribute('d', 'M -30 -330 L -14 -342 L 0 -322 L 14 -342 L 30 -330 L 18 -318 L 0 -312 L -18 -318 Z');
    const neck = [tilt * 0.8, -338];
    const hc = seg(neck, 180 - tilt, 30);
    head.setAttribute('cx', hc[0].toFixed(1)); head.setAttribute('cy', hc[1].toFixed(1));
    head.setAttribute('transform', `rotate(${tilt} ${hc[0]} ${hc[1]})`);
    cap.setAttribute('transform', `translate(${hc[0]} ${hc[1]}) rotate(${tilt})`);
    // peaked naval cap: wide flat crown, band, visor to the front
    cap.setAttribute('d', 'M -40 -24 C -44 -36, -20 -42, 4 -42 C 30 -42, 46 -36, 42 -24 L 30 -16 L -26 -16 Z M -26 -17 L 28 -17 L 28 -6 L -26 -8 Z M 14 -8 C 26 -10, 40 -6, 44 -1 L 40 3 C 30 -1, 20 -2, 10 -3 Z');
    const shF = [38, -312], shB = [-38, -312];
    const elF = seg(shF, front[0], 82), haF = seg(elF, front[1], 76);
    frontArm(shF, elF, haF);
    // hand: an open palm when the forearm points up, a fist otherwise
    const up = Math.cos(front[1] * D) < -0.5;
    hand.setAttribute('d', up
      ? `M ${haF[0] - 11} ${haF[1] + 4} L ${haF[0] - 12} ${haF[1] - 26} C ${haF[0] - 10} ${haF[1] - 36}, ${haF[0] + 10} ${haF[1] - 36}, ${haF[0] + 12} ${haF[1] - 26} L ${haF[0] + 15} ${haF[1] - 6} L ${haF[0] + 22} ${haF[1] - 16} L ${haF[0] + 25} ${haF[1] - 11} L ${haF[0] + 12} ${haF[1] + 8} Z`
      : `M ${haF[0]} ${haF[1]} m -12 0 a 12 14 0 1 0 24 0 a 12 14 0 1 0 -24 0 Z`);
    const elB = seg(shB, back[0], 82), haB = seg(elB, back[1], 74);
    backArm(shB, elB, haB);
  }
  pose({});
  return { g, pose };
}
