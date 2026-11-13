// The sea in cross-section, built as stacked cut-paper planes. Used full-frame in shot 1 and as the
// model inside the museum vitrine in shot 4 (same geometry, so the pull-back reads as "this was the model").
import { svg, rand, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { paper, poly, cut, band, rect, ellipse, shade, submarine } from './kit.js';

export const SEA = {
  skyTop: '#a9aba0', skyLow: '#e3d5b6', hillFar: '#97a08a', hillNear: '#7a8770',
  surf: '#6d9a99', w1: '#3f707a', w2: '#2b5765', w3: '#1d4352', w4: '#14313f', floor: '#162523', sub: '#283133',
};

/**
 * cam: makeCamera() instance over a cw×ch container. o: { surfaceY, subX, subY, subLen, aspect, u, detail, seed }
 * Returns { subG, subLayer, window, update(t) }.
 */
export function buildSea(cam, P, defsEl, o) {
  const { cw, ch } = cam, u = o.u ?? 1, sY = o.surfaceY, seed = o.seed ?? 40;
  const X0 = -cw * 0.45, X1 = cw * 1.45; // overscan for camera moves
  // gradients
  const gsky = svg('linearGradient', { id: P + 'gsky', gradientUnits: 'userSpaceOnUse', x1: 0, y1: -ch * 0.4, x2: 0, y2: sY }, defsEl);
  svg('stop', { offset: 0, 'stop-color': SEA.skyTop }, gsky); svg('stop', { offset: 1, 'stop-color': SEA.skyLow }, gsky);
  const gw = svg('linearGradient', { id: P + 'gw', gradientUnits: 'userSpaceOnUse', x1: 0, y1: sY, x2: 0, y2: ch * 1.1 }, defsEl);
  [[0, SEA.surf], [0.18, SEA.w1], [0.55, SEA.w3], [1, '#0d222c']].forEach(([of, c]) => svg('stop', { offset: of, 'stop-color': c }, gw));

  // 1. sky backdrop (a painted card at the back of the box)
  const sky = cam.layer('1A Sky backdrop', 0.08);
  paper(sky, poly(rect(X0 - cw, -ch, X1 - X0 + 2 * cw, sY + ch * 1.05)), { P, fill: `url(#${P}gsky)`, rim: SEA.skyLow, edge: SEA.skyLow, thick: 0, shadow: false, contact: false, light: 0.4, tex: 1 });
  // cloud strips: long, flat, pale card, each with its own shadow on the backdrop
  for (let i = 0; i < 4; i++) {
    const cx = X0 + (0.15 + i * 0.27) * (X1 - X0) * 0.7, cy = sY - ch * (0.12 + rand(seed + i) * 0.2) - ch * 0.05, w = cw * (0.18 + rand(seed + i * 3) * 0.14), h = ch * 0.022;
    const pts = [[cx - w * 0.5, cy + h * 0.6]];
    let bx = cx - w * 0.5;
    for (let k = 0; bx < cx + w * 0.42; k++) { // lumpy hand-cut top: uneven bumps, flat bottom
      const bw = w * (0.08 + 0.14 * rand(seed + i * 13 + k * 3)), f = (bx + bw / 2 - (cx - w * 0.5)) / w;
      const bh = Math.min(bw * 0.42, h * (0.6 + 2.6 * Math.sin(Math.PI * Math.min(1, f)) * (0.35 + 0.65 * rand(seed + i * 11 + k))));
      pts.push(...ellipse(bx + bw / 2, cy, bw / 2, bh, 7, Math.PI, Math.PI * 2));
      bx += bw * 0.92;
    }
    pts.push([cx + w * 0.5, cy + h * 0.6]);
    paper(sky, poly(cut(pts, seed + i * 17, 0.5 * u, 8 * u)), { P, fill: '#ece2cb', thick: 1.5 * u, shadow: { dx: 8 * u, dy: 12 * u, b: 7, op: 0.12 }, light: 0.6 });
  }

  // 2. Cuba coast — far, lifted toward the sky colour (aerial perspective)
  const coast = cam.layer('1B Cuba coast', 0.22);
  const hills = (x0, x1, base, hgt, s, fill, name) => {
    const pts = [[x0, base + 30 * u]];
    for (let x = x0; x <= x1; x += 14 * u) {
      const f = (x - x0) / (x1 - x0), env = Math.sin(Math.PI * Math.min(1, f * 1.15)) ** 0.6;
      pts.push([x, base - hgt * env * (0.62 + 0.38 * noise1(x * 0.004 / u, s)) - (rand(s + x) - 0.5) * 1.2 * u]);
    }
    pts.push([x1, base + 30 * u]);
    return paper(coast, poly(pts), { P, fill, thick: 2 * u, shadow: { dx: 10 * u, dy: 10 * u, b: 7, op: 0.13 }, name, light: 0.7 });
  };
  const cx1 = o.coastX1 ?? cw * 0.46;
  hills(X0, cx1 * 0.95, sY + 2 * u, ch * 0.085, seed + 3, SEA.hillFar, 'Cuba hills far');
  hills(X0 + cw * 0.05, cx1, sY + 4 * u, ch * 0.05, seed + 5, SEA.hillNear, 'Cuba coast');
  for (let i = 0; i < 5; i++) { // palms: tiny, cut with care
    const M = Math.max(cw, ch), m = Math.min(cw, ch);
    const px = cx1 - M * (0.03 + i * 0.05 + rand(seed + i * 5) * 0.025), py = sY - m * 0.018 + rand(seed + i) * 3 * u, hh = m * (0.034 + rand(seed + i * 2) * 0.012);
    const lean = (rand(seed + i * 9) - 0.5) * 6 * u;
    const g = svg('g', { 'data-name': 'Palm' }, coast);
    svg('path', { d: `M${px},${py} Q${px + lean * 0.4},${py - hh * 0.5} ${px + lean},${py - hh}`, stroke: '#5f6b56', 'stroke-width': 1.8 * u, fill: 'none' }, g);
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k - 2.5) * 0.5, L2 = hh * 0.42;
      svg('path', { d: `M${px + lean},${py - hh} Q${px + lean + Math.cos(a) * L2 * 0.6},${py - hh + Math.sin(a) * L2 * 0.6 - 3 * u} ${px + lean + Math.cos(a) * L2},${py - hh + Math.sin(a) * L2 + L2 * 0.35}`, stroke: '#5f6b56', 'stroke-width': 2.2 * u, fill: 'none', 'stroke-linecap': 'round' }, g);
    }
  }

  // 3. the water body with the surface edge
  const water = cam.layer('1C Sea surface + water', 0.3);
  paper(water, band(X0, X1, sY, ch * 1.6, 7 * u, 64 * u, seed + 11, 9 * u), { P, fill: SEA.surf, rim: '#d5e3d6', edge: '#2a4c52', thick: 3.2 * u, shadow: false, light: 0.5, tex: 0.95, name: 'Sea surface' });

  o.afterWater?.(cam, { X0, X1, sY });

  // 4. light through the surface: vellum strips (tracing paper), key from upper left
  const rays = cam.layer('1D Light rays (vellum)', 0.42);
  for (let i = 0; i < 6; i++) {
    const x = X0 + cw * (0.25 + i * 0.24 + rand(seed + i * 4) * 0.08), w = cw * (0.025 + rand(seed + i * 6) * 0.03), d = ch * 0.55;
    svg('path', { d: poly([[x, sY + 6 * u], [x + w, sY + 6 * u], [x + w + d * 0.32 + w * 1.6, sY + d], [x + d * 0.32, sY + d]]), fill: '#f6efd8', opacity: 0.075 + rand(seed + i) * 0.04, style: 'mix-blend-mode:screen' }, rays);
  }

  // 5. current layers: each a separate sheet, deeper = nearer the glass = darker
  const depthY = f => sY + (ch - sY) * f;
  [[0.12, 0.4, '#58898f', 16], [0.32, 0.5, '#3d6c77', 24], [0.54, 0.64, '#2a5463', 21], [0.76, 0.8, '#1b3e4c', 18]].forEach(([f, p, c, amp], i) => {
    const l = cam.layer(`1E Current layer ${i + 1}`, p);
    paper(l, band(X0, X1, depthY(f), ch * 1.6, amp * u, (150 + i * 60) * u, seed + 20 + i, 10 * u), { P, fill: c, thick: 4 * u, shadow: { dx: 16 * u, dy: 6 * u, b: 7, op: 0.45 }, shadowCol: '#06141b', light: 0.85, tex: 0.9, rim: shade(c, 0.32), name: `Current layer ${i + 1}` });
  });

  // 6. the submarine
  const subLayer = cam.layer('1F Submarine', o.subP ?? 0.9);
  const subG = submarine(subLayer, P, o.subX, o.subY, o.subLen, { aspect: o.aspect, fill: SEA.sub, seed: seed + 300 });
  const win = subG.window;
  if (o.subThreads !== false) { // the model hangs on two fine threads from the box lid (a maker's detail, not hidden)
    for (const f of [0.22, 0.8]) {
      const tx = o.subX + o.subLen * f, ty = o.subY - subG.H * (f < 0.5 ? 1.05 : 0.9);
      svg('path', { d: `M${tx},${ty} L${tx + 0.6 * u},${-ch * 1.2}`, stroke: '#e6e0cf', 'stroke-width': 1.1 * u, opacity: 0.38 }, subLayer);
      svg('circle', { cx: tx, cy: ty, r: 2.2 * u, fill: '#cfc6b0', opacity: 0.8 }, subLayer); // dab of glue
    }
  }
  if (o.windowGlow) { // shot 1: the control room is only a red slit of light in the model
    const wg = svg('g', { 'data-name': 'Red window (control room)' }, subG);
    svg('path', { d: poly(rect(win.x, win.y + win.h * 0.32, win.w, win.h * 0.5)), fill: '#5b1410' }, wg);
    svg('path', { d: poly(rect(win.x, win.y + win.h * 0.32, win.w, win.h * 0.5)), fill: '#e0452f', opacity: 0.85, filter: `url(#${P}b1)` }, wg);
    for (let k = 0; k < 3; k++) svg('path', { d: poly(ellipse(win.x + win.w * (0.3 + k * 0.2), win.y + win.h * 0.62, win.w * 0.05, win.h * 0.2, 10)), fill: '#2a0806' }, wg);
    svg('circle', { cx: win.x + win.w / 2, cy: win.y + win.h * 0.55, r: win.w * 1.1, fill: '#ff4a2e', opacity: 0.18, filter: `url(#${P}b12)`, style: 'mix-blend-mode:screen' }, wg);
  }

  // 7. drifting flecks (paper punch-outs on fine thread): ambient, ≤ 2 % W/s
  const flecks = [];
  for (const [p, n, sz] of [[0.75, 14, 2.4], [1.12, 10, 3.6]]) {
    const l = cam.layer(`1G Flecks p${p}`, p);
    for (let i = 0; i < n; i++) {
      const g = svg('g', {}, l);
      const fx = X0 + rand(seed + i * 7 + p * 100) * (X1 - X0), fy = depthY(0.08 + rand(seed + i * 13 + p * 50) * 0.8);
      svg('path', { d: poly(cut(ellipse(fx, fy, sz * u, sz * u * 0.8, 8), seed + i, 0.3 * u, 2 * u)), fill: '#b9cdc4', opacity: 0.55 }, g);
      flecks.push({ g, s: seed + i * 3 + p, a: (6 + rand(i) * 8) * u });
    }
  }

  // 8. sea floor at the glass: dark rock card + weed strips
  const floor = cam.layer('1H Sea floor', 1.25);
  const fy0 = ch * (o.floorY ?? 0.97);
  const pts = [[X0, ch * 1.6]];
  for (let x = X0; x <= X1; x += 18 * u) pts.push([x, fy0 - (noise1(x * 0.006 / u, seed + 9) * 0.5 + 0.5) * ch * 0.06 - rand(seed + x) * 3 * u]);
  pts.push([X1, ch * 1.6]);
  paper(floor, poly(pts), { P, fill: SEA.floor, thick: 3 * u, shadow: false, rim: '#3c5550', name: 'Sea floor' });
  for (let i = 0; i < 16; i++) {
    const x = X0 + (i / 16) * (X1 - X0) + rand(seed + i) * 40 * u, h = ch * (0.05 + rand(seed + i * 3) * 0.07), w = 7 * u;
    const bend = (rand(seed + i * 5) - 0.5) * 28 * u;
    const blade = [[x - w, fy0 + 10 * u], [x - w * 0.3 + bend * 0.5, fy0 - h * 0.55], [x + bend, fy0 - h], [x + w * 0.4 + bend * 0.5, fy0 - h * 0.5], [x + w, fy0 + 10 * u]];
    paper(floor, poly(cut(blade, seed + i * 31, 0.4 * u, 6 * u)), { P, fill: '#24403a', thick: 1.4 * u, shadow: { dx: 6 * u, dy: 8 * u, b: 4, op: 0.35 }, rim: '#4f6e5f' });
  }

  return {
    subG, subLayer, window: win,
    update(t) {
      for (const f of flecks) f.g.setAttribute('transform', `translate(${(noise1(t * 0.35, f.s) * f.a).toFixed(2)},${(noise1(t * 0.3, f.s + 5) * f.a * 0.6 - t * 1.5 * u).toFixed(2)})`);
    },
  };
}
