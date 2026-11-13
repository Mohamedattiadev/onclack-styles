// DISPLAY CASE — the exhibits. Each draws into a group whose origin (0,0) is the object's base centre on the deck; up = −y.
// Shading assumes the case's own top spot (light from above, slightly front). Truth codes in README (RC models, VO cards, EV photo).
import { svg, rand } from '/onclack-styles/engine/lib/anim.js';
import { PAL, FONT, text } from './gallery.js';

let N = 0;
const nid = p => `mo-${p}-${N++}`;
function lin(defs, stops, v = true) {
  const id = nid('g');
  const g = svg('linearGradient', { id, x1: 0, y1: 0, x2: v ? 0 : 1, y2: v ? 1 : 0 }, defs);
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g);
  return `url(#${id})`;
}
function rad(defs, stops, attrs = {}) {
  const id = nid('r');
  const g = svg('radialGradient', { id, ...attrs }, defs);
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g);
  return `url(#${id})`;
}
export function shadow(G, g, w, h = 10, o = 0.55, dy = 0) {
  svg('ellipse', { cx: 0, cy: dy, rx: w / 2, ry: G.u(h), fill: '#1a120a', opacity: o, filter: `url(#${G.id.blurS})` }, g);
}

/* ---------- clear acrylic mount block ---------- */
export function acrylic(G, g, x, w, h) {
  const u = G.u;
  svg('rect', { x: x - w / 2, y: -h, width: w, height: h, fill: '#fff', opacity: 0.07 }, g);
  svg('rect', { x: x - w / 2, y: -h, width: w, height: h, fill: 'none', stroke: '#fff', 'stroke-width': u(1.4), opacity: 0.32 }, g);
  svg('rect', { x: x - w / 2 + u(2), y: -h + u(2), width: u(2.5), height: h - u(4), fill: '#fff', opacity: 0.3 }, g);
}

/* ---------- model submarine (Project 641 / "Foxtrot" type, simple shapes, facing right) ---------- */
export function submarine(G, g, len) {
  const u = G.u, d = G.defs;
  const hh = len * 0.088, standH = len * 0.13;
  const yc = -standH - hh * 0.42;
  shadow(G, g, len * 0.62, 9, 0.6);
  // walnut base + brass posts with cradle cups
  svg('rect', { x: -len * 0.27, y: -len * 0.035, width: len * 0.54, height: len * 0.035, fill: lin(d, [[0, '#4a3524'], [1, '#22170f']]) }, g);
  svg('rect', { x: -len * 0.27, y: -len * 0.035, width: len * 0.54, height: u(1.4), fill: '#8a6a49', opacity: 0.8 }, g);
  for (const px of [-0.19, 0.17]) {
    svg('rect', { x: len * px - u(3.5), y: -standH, width: u(7), height: standH - len * 0.035, fill: lin(d, [[0, '#6f5631'], [0.4, '#d6b57a'], [1, '#5e4828']], false) }, g);
    svg('path', { d: `M${len * px - len * 0.035},${yc + hh * 0.18} Q${len * px},${yc + hh * 0.72} ${len * px + len * 0.035},${yc + hh * 0.18}`, fill: 'none', stroke: '#b89356', 'stroke-width': u(4) }, g);
  }
  const top = yc - hh / 2, bot = yc + hh / 2, L2 = len / 2;
  const hullFill = lin(d, [[0, '#6c726d'], [0.18, '#3a403d'], [0.6, '#232826'], [1, '#121514']]);
  // stern planes + rudder + props (behind hull)
  svg('path', { d: `M${-L2 + len * 0.02},${yc - hh * 0.05} L${-L2 - len * 0.015},${yc - hh * 0.75} L${-L2 + len * 0.05},${yc - hh * 0.75} L${-L2 + len * 0.09},${yc - hh * 0.05} Z`, fill: '#1d2120' }, g);
  svg('path', { d: `M${-L2 + len * 0.02},${yc + hh * 0.05} L${-L2 - len * 0.015},${yc + hh * 0.7} L${-L2 + len * 0.05},${yc + hh * 0.7} L${-L2 + len * 0.09},${yc + hh * 0.05} Z`, fill: '#161918' }, g);
  for (const dy of [-0.22, 0.22]) svg('ellipse', { cx: -L2 - len * 0.006, cy: yc + hh * dy, rx: u(3), ry: hh * 0.2, fill: '#8a7650' }, g);
  // hull
  svg('path', {
    'data-name': 'Model hull',
    d: `M${-L2},${yc} C${-L2 + len * 0.08},${top + hh * 0.08} ${-L2 + len * 0.16},${top} ${-L2 + len * 0.26},${top}
        L${L2 - len * 0.1},${top} C${L2 - len * 0.03},${top} ${L2},${yc - hh * 0.25} ${L2},${yc + hh * 0.02}
        C${L2},${yc + hh * 0.3} ${L2 - len * 0.04},${bot} ${L2 - len * 0.12},${bot}
        L${-L2 + len * 0.3},${bot} C${-L2 + len * 0.16},${bot} ${-L2 + len * 0.07},${yc + hh * 0.12} ${-L2},${yc} Z`,
    fill: hullFill,
  }, g);
  // casing strip with free-flood slots (the detail that makes it a Soviet diesel boat)
  svg('rect', { x: -L2 + len * 0.17, y: top - hh * 0.13, width: len * 0.72, height: hh * 0.15, rx: hh * 0.05, fill: lin(d, [[0, '#7d837e'], [1, '#2a2f2d']]) }, g);
  for (let i = 0; i < 46; i++) {
    const x = -L2 + len * 0.19 + i * len * 0.0148;
    if (x > len * 0.0 && x < len * 0.19) continue;
    svg('rect', { x, y: top + hh * 0.07, width: len * 0.006, height: hh * 0.11, rx: u(1), fill: '#0b0d0c', opacity: 0.85 }, g);
  }
  // sail
  const sx0 = len * 0.0, sx1 = len * 0.2, sTop = top - hh * 1.05;
  svg('path', { 'data-name': 'Model sail', d: `M${sx0},${top - hh * 0.1} L${sx0 + len * 0.025},${sTop + hh * 0.18} Q${sx0 + len * 0.03},${sTop} ${sx0 + len * 0.06},${sTop} L${sx1 - len * 0.04},${sTop} Q${sx1 - len * 0.01},${sTop + hh * 0.05} ${sx1 - len * 0.005},${sTop + hh * 0.35} L${sx1 + len * 0.012},${top - hh * 0.1} Z`, fill: lin(d, [[0, '#787e79'], [0.35, '#3c423f'], [1, '#202523']]) }, g);
  svg('rect', { x: sx0 + len * 0.055, y: sTop - hh * 0.55, width: u(3), height: hh * 0.56, fill: '#2b302e' }, g);
  svg('rect', { x: sx0 + len * 0.1, y: sTop - hh * 0.38, width: u(3.5), height: hh * 0.39, fill: '#2b302e' }, g);
  svg('rect', { x: sx0 + len * 0.035, y: sTop + hh * 0.02, width: len * 0.12, height: u(1.6), fill: '#a7aca6', opacity: 0.55 }, g);
  // top specular line
  svg('path', { d: `M${-L2 + len * 0.26},${top + u(1.5)} L${L2 - len * 0.1},${top + u(1.5)}`, stroke: '#c9cec7', 'stroke-width': u(1.4), opacity: 0.45 }, g);
  return { h: standH + hh + hh * 1.1 };
}

/* ---------- chart on an easel board: Natural Earth outlines (PD) ---------- */
export function chart(G, g, w, h, geo, lift = 0) {
  const u = G.u, d = G.defs;
  const foot = u(14);
  shadow(G, g, w * 0.7, 7, 0.45);
  svg('path', { d: `M${-w * 0.3},0 L${-w * 0.2},${-lift - h * 0.75} M${w * 0.3},0 L${w * 0.2},${-lift - h * 0.75}`, stroke: '#1d1712', 'stroke-width': u(5) }, g);
  svg('path', { d: `M${-w * 0.27},${-lift * 0.35} L${w * 0.27},${-lift * 0.35}`, stroke: '#1d1712', 'stroke-width': u(4) }, g);
  const x0 = -w / 2, y0 = -h - foot - lift;
  svg('rect', { x: x0 - u(8), y: y0 - u(8), width: w + u(16), height: h + u(16), fill: '#191510' }, g);
  svg('rect', { x: x0, y: y0, width: w, height: h, fill: G.P ? '#e6dfcc' : '#e6dfcc', 'data-name': 'Chart paper' }, g);
  svg('rect', { x: x0, y: y0, width: w, height: h, fill: `url(#${G.id.paper})`, opacity: 0.8, style: 'mix-blend-mode:multiply' }, g);
  const clip = nid('cc');
  const cp = svg('clipPath', { id: clip }, d);
  const m = u(16);
  svg('rect', { x: x0 + m, y: y0 + m, width: w - 2 * m, height: h - 2 * m - u(26) }, cp);
  const mg = svg('g', { 'clip-path': `url(#${clip})`, 'data-name': 'Chart map' }, g);
  const lon0 = -85.5, lon1 = -66.5, lat0 = 18.6, lat1 = 29.6;
  const iw = w - 2 * m, ih = h - 2 * m - u(26);
  const X = lo => x0 + m + (lo - lon0) / (lon1 - lon0) * iw;
  const Y = la => y0 + m + (lat1 - la) / (lat1 - lat0) * ih;
  svg('rect', { x: x0 + m, y: y0 + m, width: iw, height: ih, fill: '#dfe1d6', opacity: 0.55 }, mg);
  for (let lo = -84; lo <= -68; lo += 4) svg('line', { x1: X(lo), y1: Y(lat1), x2: X(lo), y2: Y(lat0), stroke: '#6f8494', 'stroke-width': u(0.8), opacity: 0.55 }, mg);
  for (let la = 20; la <= 28; la += 4) svg('line', { x1: X(lon0), y1: Y(la), x2: X(lon1), y2: Y(la), stroke: '#6f8494', 'stroke-width': u(0.8), opacity: 0.55 }, mg);
  let dd = '';
  for (const f of geo.features) for (const ring of f.rings) {
    if (!ring.some(([lo, la]) => lo > lon0 - 3 && lo < lon1 + 3 && la > lat0 - 3 && la < lat1 + 3)) continue;
    dd += 'M' + ring.map(([lo, la]) => `${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join('L') + 'Z';
  }
  svg('path', { d: dd, fill: '#d2bf95', stroke: '#3f4c55', 'stroke-width': u(1.1), 'stroke-linejoin': 'round' }, mg);
  const fs = G.P ? u(15) : u(12);
  text(mg, X(-79.6), Y(21.3), 'CUBA', { size: fs, weight: 600, fill: '#3f4c55', tracking: 0.25 });
  text(mg, X(-79.9), Y(27.4), 'FLORIDA', { size: fs * 0.85, weight: 600, fill: '#3f4c55', tracking: 0.2 });
  for (const [lo, la, s] of [[-84, 29.2, '84°'], [-76, 29.2, '76°'], [-68, 29.2, '68°']]) text(mg, X(lo) + u(3), Y(la), s, { size: fs * 0.8, fill: '#5d7181' });
  // brass pin + pencilled ring = approx. area
  const pinLo = -73.2, pinLa = 24.4;
  svg('circle', { cx: X(pinLo), cy: Y(pinLa), r: u(G.P ? 34 : 28), fill: 'none', stroke: '#3a3a3a', 'stroke-width': u(1.2), 'stroke-dasharray': `${u(4)} ${u(4)}`, opacity: 0.7 }, mg);
  svg('ellipse', { cx: X(pinLo) + u(5), cy: Y(pinLa) + u(4), rx: u(6), ry: u(3), fill: '#000', opacity: 0.35 }, g);
  svg('line', { x1: X(pinLo), y1: Y(pinLa), x2: X(pinLo) - u(3), y2: Y(pinLa) - u(14), stroke: '#777', 'stroke-width': u(1.5) }, g);
  svg('circle', { cx: X(pinLo) - u(3), cy: Y(pinLa) - u(15), r: u(5.5), fill: rad(d, [[0, '#f3d9a0'], [0.5, '#b38a45'], [1, '#5a4320']], { cx: 0.35, cy: 0.3 }), 'data-name': 'Chart pin (approx. area)' }, g);
  text(g, x0 + m, y0 + h - u(14), 'CARIBBEAN · B-59, APPROX. AREA, 27 OCT. 1962', { size: G.P ? u(14) : u(11.5), weight: 600, fill: '#4e5a62', tracking: 0.12 });
  return { pin: [X(pinLo), Y(pinLa)], cuba: [X(-79), Y(21.7)], top: y0 };
}

/* ---------- depth gauge on a bracket ---------- */
export function gauge(G, g, R) {
  const u = G.u, d = G.defs;
  const cy = -R - u(46);
  shadow(G, g, R * 1.6, 8, 0.55);
  svg('rect', { x: -R * 0.55, y: -u(26), width: R * 1.1, height: u(26), fill: lin(d, [[0, '#3d2c1d'], [1, '#1c130c']]) }, g);
  svg('rect', { x: -u(9), y: cy, width: u(18), height: -cy - u(24), fill: lin(d, [[0, '#2a2a2a'], [0.5, '#5a5752'], [1, '#202020']], false) }, g);
  svg('circle', { cx: u(4), cy: cy + u(6), r: R * 1.02, fill: '#000', opacity: 0.45, filter: `url(#${G.id.blurS})` }, g);
  svg('circle', { cx: 0, cy, r: R, fill: rad(d, [[0, '#e8c98a'], [0.55, '#a8823f'], [0.85, '#6b5126'], [1, '#3a2c14']], { cx: 0.38, cy: 0.28, r: 0.8 }), 'data-name': 'Gauge bezel' }, g);
  svg('circle', { cx: 0, cy, r: R * 0.9, fill: '#2a2116' }, g);
  svg('circle', { cx: 0, cy, r: R * 0.86, fill: rad(d, [[0, '#f1ebdc'], [0.8, '#e2d9c2'], [1, '#c9bea3']], { cx: 0.45, cy: 0.4 }), 'data-name': 'Gauge dial' }, g);
  const ang = v => (-225 + v / 300 * 270) * Math.PI / 180;
  for (let v = 0; v <= 300; v += 10) {
    const a = ang(v), big = v % 50 === 0;
    const r1 = R * 0.8, r0 = R * (big ? 0.68 : 0.74);
    svg('line', { x1: Math.cos(a) * r0, y1: cy + Math.sin(a) * r0, x2: Math.cos(a) * r1, y2: cy + Math.sin(a) * r1, stroke: '#1b1a18', 'stroke-width': u(big ? 2.4 : 1.1) }, g);
    if (big) text(g, Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55 + R * 0.055, String(v), { size: R * 0.13, weight: 600, anchor: 'middle', fill: '#1b1a18' });
  }
  svg('path', { d: `M${Math.cos(ang(250)) * R * 0.8},${cy + Math.sin(ang(250)) * R * 0.8} A${R * 0.8},${R * 0.8} 0 0 1 ${Math.cos(ang(300)) * R * 0.8},${cy + Math.sin(ang(300)) * R * 0.8}`, fill: 'none', stroke: '#7a2a20', 'stroke-width': u(4), opacity: 0.55 }, g);
  text(g, 0, cy + R * 0.36, 'ГЛУБИНА', { size: R * 0.1, weight: 600, anchor: 'middle', fill: '#2b2924', tracking: 0.12 });
  text(g, 0, cy + R * 0.49, 'м', { size: R * 0.1, anchor: 'middle', fill: '#2b2924' });
  const needle = svg('g', { 'data-name': 'Gauge needle' }, g);
  svg('path', { d: `M${-R * 0.18},${-u(3)} L${R * 0.72},0 L${-R * 0.18},${u(3)} Z`, fill: '#141414' }, needle);
  svg('circle', { cx: 0, cy, r: R * 0.075, fill: rad(d, [[0, '#f0d79b'], [1, '#6b5126']], { cx: 0.35, cy: 0.3 }) }, g);
  svg('path', { d: `M${-R * 0.62},${cy - R * 0.32} A${R * 0.78},${R * 0.78} 0 0 1 ${R * 0.3},${cy - R * 0.7} A${R * 0.9},${R * 0.9} 0 0 0 ${-R * 0.62},${cy - R * 0.32} Z`, fill: '#fff', opacity: 0.32 }, g);
  return { setValue(v) { needle.setAttribute('transform', `translate(0 ${cy}) rotate(${(-225 + v / 300 * 270).toFixed(3)})`); }, cy };
}

/* ---------- radio headset lying on the linen, its plug connected to nothing ---------- */
export function headset(G, g, s) {
  const u = G.u, d = G.defs;
  shadow(G, g, s * 1.25, 8, 0.5);
  svg('path', { d: `M${-s * 0.32},${-s * 0.14} C${-s * 0.3},${-s * 0.55} ${s * 0.3},${-s * 0.55} ${s * 0.32},${-s * 0.14}`, fill: 'none', stroke: '#2b2622', 'stroke-width': u(7) }, g);
  svg('path', { d: `M${-s * 0.32},${-s * 0.14} C${-s * 0.3},${-s * 0.55} ${s * 0.3},${-s * 0.55} ${s * 0.32},${-s * 0.14}`, fill: 'none', stroke: '#8b8378', 'stroke-width': u(1.6), opacity: 0.6, transform: `translate(0 ${-u(2)})` }, g);
  // cord: from the right cup across the linen to a loose jack plug
  svg('path', { d: `M${s * 0.34},${-s * 0.04} C${s * 0.55},${s * 0.02} ${s * 0.5},${-s * 0.02} ${s * 0.72},${-s * 0.01} S${s * 0.92},${-s * 0.06} ${s * 1.0},${-s * 0.02}`, fill: 'none', stroke: '#1d1916', 'stroke-width': u(3.4) }, g);
  svg('rect', { x: s * 0.99, y: -s * 0.045, width: s * 0.12, height: s * 0.045, rx: u(2), fill: lin(d, [[0, '#d2b27a'], [1, '#6e5428']]), 'data-name': 'Loose jack plug' }, g);
  for (const sx of [-1, 1]) {
    svg('ellipse', { cx: sx * s * 0.32, cy: -s * 0.1, rx: s * 0.17, ry: s * 0.11, fill: rad(d, [[0, '#5a4636'], [0.6, '#2c221b'], [1, '#140f0b']], { cx: 0.4, cy: 0.25 }), 'data-name': 'Headset cup' }, g);
    svg('ellipse', { cx: sx * s * 0.32 - s * 0.04, cy: -s * 0.165, rx: s * 0.06, ry: s * 0.02, fill: '#fff', opacity: 0.22 }, g);
  }
}

/* ---------- framed photograph on a small easel (EV) ---------- */
export function photo(G, g, w, h, href) {
  const u = G.u;
  svg('line', { x1: 0, y1: 0, x2: -w * 0.12, y2: -h * 0.6, stroke: '#16120e', 'stroke-width': u(4) }, g);
  shadow(G, g, w * 0.9, 6, 0.45);
  const x0 = -w / 2, y0 = -h - u(6);
  svg('rect', { x: x0, y: y0, width: w, height: h, fill: '#1e1914' }, g);
  svg('rect', { x: x0 + w * 0.045, y: y0 + w * 0.045, width: w * 0.91, height: h - w * 0.09, fill: '#e7e2d6' }, g);
  const iw = w * 0.74, ih = (h - w * 0.09) * 0.72;
  const img = svg('image', { href, x: -iw / 2, y: y0 + w * 0.045 + (h - w * 0.09 - ih) * 0.42, width: iw, height: ih, preserveAspectRatio: 'xMidYMid slice', 'data-name': 'Photo B-59 surfaced (US Navy, PD)' }, g);
  img.style.filter = 'grayscale(1) contrast(1.05)';
  svg('path', { d: `M${x0 + w * 0.1},${y0} L${x0 + w * 0.32},${y0} L${x0 + w * 0.02},${y0 + h} L${x0 - w * 0.2},${y0 + h} Z`, fill: '#fff', opacity: 0.06 }, g);
}

/* ---------- torpedo on acrylic mounts (model, simple shapes, nose right) ---------- */
export function torpedo(G, g, len) {
  const u = G.u, d = G.defs;
  const dia = len * 0.088, mountH = len * 0.06;
  const yc = -mountH - dia * 0.42, top = yc - dia / 2, bot = yc + dia / 2, L2 = len / 2;
  shadow(G, g, len * 0.85, 8, 0.6);
  const body = lin(d, [[0, '#a6aca4'], [0.2, '#6f766f'], [0.62, '#3b403c'], [1, '#1b1e1c']]);
  // tail fins + props
  svg('path', { d: `M${-L2 + len * 0.07},${top + dia * 0.12} L${-L2 + len * 0.005},${top - dia * 0.45} L${-L2 + len * 0.035},${top - dia * 0.45} L${-L2 + len * 0.12},${top + dia * 0.2} Z`, fill: '#3a3f3b' }, g);
  svg('path', { d: `M${-L2 + len * 0.07},${bot - dia * 0.12} L${-L2 + len * 0.005},${bot + dia * 0.45} L${-L2 + len * 0.035},${bot + dia * 0.45} L${-L2 + len * 0.12},${bot - dia * 0.2} Z`, fill: '#262a28' }, g);
  svg('rect', { x: -L2 - u(2), y: yc - dia * 0.42, width: u(5), height: dia * 0.84, rx: u(2), fill: '#8f7a4e' }, g);
  svg('rect', { x: -L2 + u(8), y: yc - dia * 0.34, width: u(4), height: dia * 0.68, rx: u(2), fill: '#7a6741' }, g);
  svg('path', {
    'data-name': 'Torpedo body',
    d: `M${-L2 + len * 0.015},${yc - dia * 0.2} L${-L2 + len * 0.13},${top} L${L2 - len * 0.11},${top}
        C${L2 - len * 0.03},${top} ${L2},${yc - dia * 0.2} ${L2},${yc} C${L2},${yc + dia * 0.2} ${L2 - len * 0.03},${bot} ${L2 - len * 0.11},${bot}
        L${-L2 + len * 0.13},${bot} L${-L2 + len * 0.015},${yc + dia * 0.2} Z`,
    fill: body,
  }, g);
  // warhead section: a slightly warmer, darker steel (no symbols — none are documented for this model)
  svg('path', { d: `M${L2 - len * 0.27},${top} L${L2 - len * 0.11},${top} C${L2 - len * 0.03},${top} ${L2},${yc - dia * 0.2} ${L2},${yc} C${L2},${yc + dia * 0.2} ${L2 - len * 0.03},${bot} ${L2 - len * 0.11},${bot} L${L2 - len * 0.27},${bot} Z`, fill: '#5d4f3c', opacity: 0.35, style: 'mix-blend-mode:multiply', 'data-name': 'Warhead section' }, g);
  for (const fx of [-0.37, -0.12, 0.08, 0.23]) {
    svg('line', { x1: L2 * 0 + len * fx, y1: top, x2: len * fx, y2: bot, stroke: '#151816', 'stroke-width': u(1.6), opacity: 0.8 }, g);
    for (let i = 0; i < 4; i++) svg('circle', { cx: len * fx + u(5), cy: top + dia * (0.2 + i * 0.2), r: u(1.2), fill: '#cfd3cc', opacity: 0.4 }, g);
  }
  svg('path', { d: `M${-L2 + len * 0.13},${top + u(2)} L${L2 - len * 0.1},${top + u(2)}`, stroke: '#e3e6df', 'stroke-width': u(1.6), opacity: 0.45 }, g);
  acrylic(G, g, -len * 0.25, len * 0.09, mountH + dia * 0.12);
  acrylic(G, g, len * 0.2, len * 0.09, mountH + dia * 0.12);
  return { h: mountH + dia };
}

/* ---------- interpretive vote card on a black acrylic easel (VO) ---------- */
export function card(G, g, cw, ch, { numeral, role, name, stamp, nameLine }) {
  const u = G.u;
  shadow(G, g, cw * 1.1, 6, 0.55);
  svg('path', { d: `M${-cw * 0.16},0 L${-cw * 0.04},${-ch * 0.62}`, stroke: '#0d0d0d', 'stroke-width': u(4) }, g);
  svg('rect', { x: -cw * 0.5, y: -u(10), width: cw, height: u(10), fill: '#101010' }, g);
  svg('rect', { x: -cw * 0.5, y: -u(10), width: cw, height: u(1.4), fill: '#5a5a5a' }, g);
  const x0 = -cw / 2, y0 = -ch - u(6);
  const cg = svg('g', { 'data-name': `Card ${numeral}` }, g);
  svg('rect', { x: x0 + u(3), y: y0 + u(3), width: cw, height: ch, fill: '#000', opacity: 0.35 }, cg);
  svg('rect', { x: x0, y: y0, width: cw, height: ch, fill: '#efe9da' }, cg);
  svg('rect', { x: x0, y: y0, width: cw, height: ch, fill: `url(#${G.id.paper})`, opacity: 0.9, style: 'mix-blend-mode:multiply' }, cg);
  const p = cw * 0.1;
  text(cg, x0 + p, y0 + p + cw * 0.06, 'APPROVAL TO FIRE', { size: cw * 0.064, weight: 600, fill: '#5d5850', tracking: 0.14 });
  text(cg, x0 + p, y0 + p + cw * 0.33, numeral, { size: cw * 0.26, font: FONT.serif, fill: '#1f1d1a' });
  text(cg, x0 + p, y0 + p + cw * 0.5, role, { size: cw * (role.length > 15 ? 0.088 : 0.1), font: FONT.serif, italic: true, fill: '#1f1d1a' });
  if (nameLine) text(cg, x0 + p, y0 + p + cw * 0.63, nameLine, { size: cw * 0.075, weight: 600, fill: '#3b3833', tracking: 0.04 });
  svg('rect', { x: x0 + p, y: y0 + ch * 0.6, width: cw - 2 * p, height: u(1.2), fill: '#6b655b', opacity: 0.6 }, cg);
  let stampG = null;
  if (stamp) {
    const red = stamp === 'NO';
    const col = red ? PAL.accent : PAL.ink;
    const sw = cw * (red ? 0.74 : 0.62), sh = ch * (red ? 0.25 : 0.2);
    const scx = 0, scy = y0 + ch * 0.79;
    const mid = `mo-stm-${N++}`;
    const m = svg('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: x0, y: y0, width: cw, height: ch }, G.defs);
    svg('rect', { x: x0, y: y0, width: cw, height: ch, fill: `url(#${G.id.speck})` }, m);
    stampG = svg('g', { mask: `url(#${mid})`, 'data-name': red ? 'NO stamp (accent)' : 'YES stamp' }, cg);
    const rot = red ? -5 : (rand(numeral.length * 7) - 0.5) * 6;
    const sg = svg('g', { transform: `translate(${scx} ${scy}) rotate(${rot})` }, stampG);
    svg('rect', { x: -sw / 2, y: -sh / 2, width: sw, height: sh, fill: 'none', stroke: col, 'stroke-width': cw * 0.02, opacity: 0.92 }, sg);
    svg('rect', { x: -sw / 2 + cw * 0.025, y: -sh / 2 + cw * 0.025, width: sw - cw * 0.05, height: sh - cw * 0.05, fill: 'none', stroke: col, 'stroke-width': cw * 0.008, opacity: 0.85 }, sg);
    text(sg, 0, sh * 0.27, stamp, { size: sh * 0.72, weight: 800, anchor: 'middle', fill: col, tracking: 0.12, opacity: 0.93 });
  }
  return { top: y0, stampY: y0 + ch * 0.79, h: ch + u(6) };
}

/* ---------- small curator's tag for an empty slot ---------- */
export function slotTag(G, g, w, lines) {
  const u = G.u;
  svg('rect', { x: -w * 0.5, y: -u(10), width: w, height: u(10), fill: '#101010' }, g);
  shadow(G, g, w, 5, 0.4);
  const h = w * 0.42;
  svg('rect', { x: -w * 0.42, y: -u(10) - h, width: w * 0.84, height: h, fill: '#d9d4c8', 'data-name': 'Empty slot tag' }, g);
  lines.forEach((l, i) => text(g, 0, -u(10) - h + h * (0.38 + i * 0.32), l, { size: w * 0.075, weight: 600, anchor: 'middle', fill: '#4f4a43', tracking: 0.06 }));
}
