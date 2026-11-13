// Shot 1A · EST/TOP — "October 27th, 1962. A Soviet submarine hides deep in the sea near Cuba."
// A sketchbook page: a loose watercolour chart painted in the middle of the sheet, white paper all round.
// Sea = cerulean wash with ultramarine dropped in wet-in-wet; Cuba = raw sienna + sap green bleeding together;
// thin broken sepia coast. The submarine is a soft indigo shadow UNDER the glaze. Camera: slow push to it.
import { el, ease, tween } from '/onclack-styles/engine/lib/anim.js';
import { glide } from '/onclack-styles/engine/lib/spring.js';
import { makeLayer, deform, rng, ellipsePts, blobPts, drawLayer, camTransform, grainFrames, boilIndex, makeCanvas, brush } from '../shared/paint.js';
import { PAL, paperSheet, wetWash, wetField, inkLine, pencil, inkText, lightGrade, caption } from '../shared/water.js';

export default function (root, ctx) {
  let run = null; // heavy painting happens on the first frame this scene is shown (fast load, same pixels)
  return { update(t) { if (!run) run = paint(root, ctx); run.update(t); } };
}

function paint(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, U = L.unit;
  const canvas = el('canvas', { width: W, height: H, 'data-name': '1A · Painted sea chart', style: { position: 'absolute', inset: 0 } }, root);
  const g = canvas.getContext('2d');

  // map space → frame (north up). Landscape: the whole sketch; portrait: a window around the submarine.
  const view = L.pick({ landscape: { cx: 0.86, cy: 0.56, s: W / 2.35 }, portrait: { cx: 0.95, cy: 0.56, s: W / 1.05 } });
  const M = (mx, my) => [W / 2 + (mx - view.cx) * view.s, H / 2 + (my - view.cy) * view.s];
  const S = v => v * view.s;
  const Mp = pts => pts.map(([x, y]) => M(x, y));

  const sheet = makeLayer(W, H, 0.16), sg = sheet.g;
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); paperSheet(sg, sheet.c.width, sheet.c.height, 11, U); sg.restore();

  // ---- geography (map units, loose sketch — not a survey)
  const coastMap = [[-0.25, 0.66], [-0.05, 0.665], [0.12, 0.68], [0.26, 0.7], [0.38, 0.715], [0.5, 0.735], [0.6, 0.745], [0.7, 0.77],
    [0.8, 0.785], [0.9, 0.795], [1.0, 0.81], [1.1, 0.835], [1.2, 0.86], [1.3, 0.885], [1.42, 0.905], [1.55, 0.93], [1.75, 0.965], [1.95, 1.0]];
  const rc = rng(9);
  const coast = deform(coastMap.filter(p => p[0] > -0.12 && p[0] < 1.85).map(p => [...p, 1]), 3, 0.07, rc).slice(0, -7);
  const coastLine = Mp(coast);
  const landPoly = [...coastLine, M(1.8, 1.08), M(1.5, 1.06), M(1.1, 1.0), M(0.7, 0.98), M(0.3, 0.93), M(-0.08, 0.9)];
  const cays = [[0.2, 0.32, 0.06], [0.36, 0.22, 0.045], [0.5, 0.29, 0.03], [1.24, 0.27, 0.055], [1.4, 0.18, 0.045], [1.52, 0.36, 0.035],
    [1.06, 0.13, 0.028], [0.82, 0.17, 0.022], [0.64, 0.1, 0.026], [0.3, 0.4, 0.018]];

  // ---- 1. the sea: one big cerulean wash, ragged edge, paper left all round (sketchbook vignette)
  const seaShape = Mp(blobPts(0.86, 0.43, 0.98, 0.5, { nTop: 2.4, nBot: 2.8, n: 30, wob: 0.07, seed: 3 }));
  const lift = { blur: 18 * U, alpha: 0.75, fn: cg => cays.forEach(([mx, my, s]) => { const [x, y] = M(mx, my); cg.beginPath(); cg.ellipse(x, y, S(s * 2.1), S(s * 1.1), -0.3, 0, 7); cg.fill(); }) };
  wetWash(sg, seaShape, PAL.cerulean, { alpha: 0.5, soft: 0.55, bleed: 26 * U, rim: 0.9, rimW: 5 * U, mottle: 0.45, gran: 0.15, seed: 2, U, spread: 0.035, depth: 5, lift });
  // deep water dropped in wet-in-wet (no edges)
  const r = rng(5);
  wetField(sg, [[0.95, 0.42, 0.34, 0.16], [0.62, 0.14, 0.2, 0.08], [1.55, 0.6, 0.2, 0.12], [0.1, 0.12, 0.18, 0.08], [1.2, 0.05, 0.16, 0.06]].map(([mx, my, rx, ry]) => {
    const [x, y] = M(mx, my); return { color: PAL.ultra, a: 0.7, pts: ellipsePts(x, y, S(rx), S(ry), 16, r() * 0.4 - 0.2) };
  }), { W: sheet.c.width, H: sheet.c.height, blur: 42 * U, alpha: 0.42, seed: 4, U, gran: 0.25, pad: 0 });
  // a couple of wet-on-dry glazes: the hard, dried edges a brush leaves
  [[0.78, 0.6, 0.22, 0.035], [1.25, 0.66, 0.16, 0.03], [0.42, 0.5, 0.13, 0.03], [1.3, 0.12, 0.12, 0.025]].forEach(([mx, my, rx, ry], i) => {
    const [x, y] = M(mx, my);
    wetWash(sg, ellipsePts(x, y, S(rx), S(ry), 14, 0.08 * i), PAL.cerulean, { alpha: 0.3, soft: 0.25, bleed: 8 * U, rim: 0.75, rimW: 4 * U, mottle: 0.3, gran: 0.15, seed: 30 + i, U, spread: 0.06, depth: 4 });
  });
  // shallows: pale turquoise halo round the cays
  cays.forEach(([mx, my, s], i) => {
    const [x, y] = M(mx, my);
    wetWash(sg, ellipsePts(x, y, S(s * 2.2), S(s * 1.15), 12, -0.3), '#9fd8c8', { alpha: 0.35, soft: 0.7, bleed: 10 * U, rim: 0.35, rimW: 3 * U, mottle: 0.2, gran: 0.15, seed: 60 + i, U, spread: 0.05 });
  });

  // ---- 2. Cuba: paper reserved, sienna + sap green dropped in and bleeding into each other
  const landClip = makeCanvas(sheet.c.width, sheet.c.height), lg = landClip.getContext('2d');
  lg.translate(sheet.ox, sheet.oy);
  wetWash(lg, landPoly, PAL.sienna, { alpha: 0.55, soft: 0.3, bleed: 8 * U, rim: 0.6, rimW: 4 * U, mottle: 0.5, gran: 0.3, seed: 81, U, spread: 0.03, depth: 5, mode: 'source-over' });
  const rl = rng(83);
  wetField(lg, Array.from({ length: 16 }, (_, i) => {
    const mx = rl() * 1.75, my = 0.8 + mx * 0.12 + rl() * 0.15, [x, y] = M(mx, my);
    return { color: i % 3 ? PAL.sap : PAL.burnt, a: 0.75, pts: ellipsePts(x, y, S(0.07 + rl() * 0.08), S(0.025 + rl() * 0.03), 12, 0.15) };
  }), { W: sheet.c.width, H: sheet.c.height, blur: 12 * U, alpha: 0.9, mode: 'source-atop', seed: 8, U, gran: 0.3 });
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'multiply'; sg.globalAlpha = 0.85; sg.drawImage(landClip, 0, 0); sg.restore();
  // hills: a few short dry hatches
  for (let i = 0; i < 46; i++) {
    const mx = 0.02 + rl() * 1.7, my = 0.8 + mx * 0.12 + 0.04 + rl() * 0.08;
    const [x, y] = M(mx, my), l = S(0.011 + rl() * 0.01), a = Math.PI / 2 + (rl() - 0.5) * 0.5;
    brush(sg, [[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { w: 1.1 * U, color: '#8a6a4a', alpha: 0.45, seed: 500 + i, taper: [0.2, 0.6] });
  }
  // cays: tiny sienna drops, ink only on the shadow side
  cays.forEach(([mx, my, s], i) => {
    const [x, y] = M(mx, my);
    const pts = blobPts(x, y, S(s), S(s * 0.32), { rot: -0.4 + rl() * 0.6, n: 14, wob: 0.2, seed: i });
    wetWash(sg, pts, PAL.sienna, { alpha: 0.5, soft: 0.1, bleed: 3 * U, rim: 0.7, rimW: 2 * U, mottle: 0.3, gran: 0.2, seed: 130 + i, U, spread: 0.05 });
    inkLine(sg, pts.filter(([, py]) => py > y), { w: 1.2, U, alpha: 0.6, seed: 140 + i, gaps: 0.1 });
  });
  // coast: thin broken sepia line, a second faint pencil line inland
  inkLine(sg, coastLine, { w: 1.8, U, alpha: 0.78, seed: 160, gaps: 0.16 });
  pencil(sg, coastLine.map(([x, y]) => [x, y + 9 * U]), { seed: 161, U, alpha: 0.22 });
  // graticule in pencil (wobbly, not ruled by machine)
  [0.25, 0.6].forEach((my, i) => pencil(sg, [M(-0.3, my), M(0.4, my + 0.002), M(1.1, my - 0.002), M(2, my)], { seed: 171 + i, U, alpha: 0.2 }));
  [0.45, 1.0, 1.5].forEach((mx, i) => pencil(sg, [M(mx, -0.3), M(mx + 0.003, 0.5), M(mx, 1.4)], { seed: 175 + i, U, alpha: 0.2 }));
  // CUBA lettered in sepia like an old chart
  const cuba = inkText('C U B A', { font: `500 ${Math.round(50 * U)}px Cinzel`, color: '#7a5a3c', size: 50 * U, seed: 4, track: 8 * U });
  { const [x, y] = M(L.portrait ? 0.95 : 0.86, 0.9); sg.save(); sg.globalCompositeOperation = 'multiply'; sg.globalAlpha = 0.8; sg.translate(x, y); sg.rotate(0.13); sg.drawImage(cuba, -cuba.width / 2, -cuba.height / 2); sg.restore(); }

  // ---- the submarine: soft indigo shadow under the glaze (painted once)
  const subPos = [0.98, 0.42];
  const subLen = S(L.portrait ? 0.27 : 0.2), subAng = -0.2;
  const subC = makeCanvas(subLen * 1.5, subLen * 0.6), subG = subC.getContext('2d');
  {
    const cx = subC.width / 2, cy = subC.height / 2;
    const hull = blobPts(cx, cy, subLen * 0.06, subLen / 2, { nTop: 2.2, nBot: 2.8, egg: -0.35, rot: -Math.PI / 2, n: 40 });
    const sail = blobPts(cx + subLen * 0.08, cy, subLen * 0.075, subLen * 0.03, { nTop: 3, nBot: 3, n: 20 });
    wetWash(subG, hull, '#3c4a78', { alpha: 0.75, soft: 0.7, bleed: 5 * U, rim: 0.6, rimW: 3 * U, mottle: 0.3, gran: 0.35, seed: 200, U, spread: 0.01, shapes: [sail], mode: 'source-over' });
  }
  // wave ticks: a few thin marks that boil
  const coastY = mx => { for (let i = 1; i < coastMap.length; i++) if (coastMap[i][0] >= mx) { const a = coastMap[i - 1], b = coastMap[i]; return a[1] + (b[1] - a[1]) * (mx - a[0]) / (b[0] - a[0]); } return 1; };
  const rt = rng(300), ticks = [];
  for (let i = 0; i < 200 && ticks.length < 34; i++) {
    const mx = -0.15 + rt() * 2, my = -0.1 + rt() * 0.95;
    if (my > coastY(mx) - 0.08 || Math.hypot((mx - 0.86) / 1.0, (my - 0.42) / 0.55) > 0.95) continue;
    if (cays.some(([cx, cy, s]) => Math.hypot(mx - cx, (my - cy) * 2) < s * 2.4)) continue;
    if (Math.hypot(mx - subPos[0], (my - subPos[1]) * 2) < 0.2) continue;
    ticks.push({ mx, my, len: 0.014 + rt() * 0.012, ph: rt() * 6, seed: 400 + i });
  }
  const grains = grainFrames(W, H, 31);
  const dSize = L.pick({ landscape: 72, portrait: 78 }) * U;
  const date = inkText('October 27, 1962', { font: `italic 600 ${Math.round(dSize)}px 'Cormorant Garamond'`, size: dSize, seed: 8 });
  const dateXY = L.pick({ landscape: L.at(0.0, 0.0), portrait: L.at(0.02, 0.02) });
  const tag = inkText('B-59', { font: `600 ${Math.round(40 * U)}px Cinzel`, size: 40 * U, seed: 12, track: 3 * U });
  const cap = caption('watercolour sketch · positions approximate', U);
  el('div', { 'data-name': '1A · Date (painted)', style: { position: 'absolute', left: dateXY[0] + 'px', top: dateXY[1] + 'px', width: date.width + 'px', height: date.height + 'px' } }, root);

  return {
    update(t) {
      const T = ctx.start + t, b = boilIndex(T);
      const [sx, sy] = M(subPos[0] + t * 0.002, subPos[1] - t * 0.0005);
      const z = glide(t, 0.2, 7.7, 1.0, L.pick({ landscape: 1.16, portrait: 1.1 }));
      const cam = { x: 0, y: 0, z, fx: sx, fy: sy };
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = PAL.paper; g.fillRect(0, 0, W, H);
      drawLayer(g, sheet, cam, 1);
      camTransform(g, cam, 1, W, H);
      // submarine fades in as the voice says "submarine" (glaze over it = under water)
      const subA = tween(t, 3.6, 4.6, 0, 1, ease.outCubic);
      if (subA > 0) {
        g.save(); g.translate(sx, sy); g.rotate(subAng);
        g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.85 * subA;
        g.drawImage(subC, -subC.width / 2, -subC.height / 2);
        g.restore();
      }
      // wave ticks: two little pen arcs, boiling on twos
      for (const k of ticks) {
        const [x, y] = M(k.mx - t * 0.003, k.my), l = S(k.len);
        brush(g, [[x - l, y], [x - l * 0.45, y - l * 0.3], [x, y]], { w: 1.4 * U, color: '#4a6a80', alpha: 0.5, seed: k.seed, boil: b, amp: 0.4 * U, taper: [0.35, 0.45] });
        brush(g, [[x + l * 0.15, y + 0.5 * U], [x + l * 0.5, y - l * 0.2], [x + l * 0.85, y + 0.5 * U]], { w: 1.1 * U, color: '#4a6a80', alpha: 0.38, seed: k.seed + 1, boil: b, amp: 0.35 * U, taper: [0.35, 0.45] });
      }
      // B-59 tag with a pencil leader, lands with "Soviet submarine"
      const tagA = tween(t, 4.0, 4.6, 0, 1, ease.outCubic);
      if (tagA > 0) {
        const tx = sx + S(0.06), ty = sy - S(L.portrait ? 0.15 : 0.12);
        g.save(); g.globalAlpha = tagA;
        pencil(g, [[sx + S(0.01), sy - S(0.025)], [tx - S(0.004), ty + 34 * U]], { seed: 13, U, alpha: 0.5, w: 1.3, boil: b });
        g.globalCompositeOperation = 'multiply'; g.drawImage(tag, tx - tag.width * 0.3, ty - tag.height * 0.4);
        g.restore();
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      // painted date, revealed at pen speed with the voice
      const rev = tween(t, 0.45, 2.6, 0, 1, ease.outCubic);
      if (rev > 0) {
        const [dx, dy] = dateXY;
        g.save(); g.globalCompositeOperation = 'multiply';
        g.beginPath(); g.rect(dx, dy, date.width * rev, date.height); g.clip();
        g.drawImage(date, dx, dy);
        g.restore();
        if (rev > 0.9) pencil(g, [[dx + dSize * 0.4, dy + date.height * 0.93], [dx + dSize * 0.4 + (date.width - dSize * 0.8) * Math.min(1, (rev - 0.9) / 0.1), dy + date.height * 0.95]], { seed: 9, U, alpha: 0.5, w: 1.6, boil: b });
      }
      // honest caption, bottom-right of the safe area
      { const [cx, cy] = L.at(1, 1); g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.85; g.drawImage(cap, cx - cap.width, cy - cap.height * 0.9); g.restore(); }
      lightGrade(g, W, H, T, grains);
    },
  };
}
