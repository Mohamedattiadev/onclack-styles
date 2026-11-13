// Shot 2A · WS/SIDE (cross-section) — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// Light sketchbook section through the sea: paper sky, two grey ships on the surface line, the submarine low in a
// pale-blue wet-in-wet sea. Charges fall on twos; each burst is a lifted (paper-white) bloom with a dried rim.
// "Moscow … silent": the radio mast sends three pen arcs that break up before they reach the hand-lettered word.
import { el, ease, tween } from '/onclack-styles/engine/lib/anim.js';
import { makeLayer, rng, gauss, blobPts, ellipsePts, drawLayer, camTransform, grainFrames, boilIndex, onTwos, makeCanvas, brush, vnoise, lerp } from '../shared/paint.js';
import { PAL, paperSheet, wetWash, wetField, inkLine, pencil, inkText, lightGrade, bloomStages } from '../shared/water.js';

export default function (root, ctx) {
  [2.75, 3.25, 3.85, 4.5].forEach(t => ctx.sfx('boom-distant-01', t, { volume: 0.55 })); // depth-charge bursts (same times as below)
  let run = null; // heavy painting happens on the first frame this scene is shown (fast load, same pixels)
  return { update(t) { if (!run) run = paint(root, ctx); run.update(t); } };
}

function paint(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, U = L.unit, P = L.portrait;
  const canvas = el('canvas', { width: W, height: H, 'data-name': '2A · Section: ships, charges, submarine', style: { position: 'absolute', inset: 0 } }, root);
  const g = canvas.getContext('2d');
  const surf = H * L.pick({ landscape: 0.34, portrait: 0.3 });
  const sub = { x: W * 0.5, y: H * L.pick({ landscape: 0.74, portrait: 0.64 }), len: W * L.pick({ landscape: 0.36, portrait: 0.74 }) };
  const ships = L.pick({ landscape: [{ x: 0.3, s: 1 }, { x: 0.7, s: 0.85 }], portrait: [{ x: 0.3, s: 0.9 }, { x: 0.74, s: 0.75 }] })
    .map(o => ({ x: W * o.x, s: o.s * W * L.pick({ landscape: 0.15, portrait: 0.27 }) }));

  // ---- sheet: paper, sky, sea (painted once)
  const sheet = makeLayer(W, H, 0.1), sg = sheet.g;
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); paperSheet(sg, sheet.c.width, sheet.c.height, 21, U); sg.restore();
  const X0 = -sheet.ox, X1 = W + sheet.ox, Y1 = H + sheet.oy;
  // sky: a faint grey-blue drift, mostly paper
  wetField(sg, [{ color: PAL.payne, a: 0.5, pts: ellipsePts(W * 0.25, surf * 0.35, W * 0.3, surf * 0.18, 14, 0.1) }, { color: PAL.cerulean, a: 0.6, pts: ellipsePts(W * 0.8, surf * 0.45, W * 0.28, surf * 0.2, 14, -0.1) }],
    { W, H, blur: 40 * U, alpha: 0.35, seed: 3, U, gran: 0.2 });
  // the sea: one cerulean wash with a hard, rimmed surface edge; light shafts lifted out
  const seaPts = [];
  for (let i = 0; i <= 16; i++) seaPts.push([lerp(W * 0.035, W * 0.965, i / 16), surf + Math.sin(i * 1.7) * 3 * U]);
  seaPts.push([W * 0.975, H * 0.6], [W * 0.95, H * 0.93], [W * 0.7, H * 0.95], [W * 0.4, H * 0.92], [W * 0.1, H * 0.95], [W * 0.03, H * 0.7]);
  const rays = { blur: 40 * U, alpha: L.pick({ landscape: 0.45, portrait: 0.28 }), fn: cg => [0.2, 0.42, 0.63, 0.86].forEach((fx, i) => { const x = W * fx; cg.beginPath(); cg.moveTo(x - 20 * U, surf); cg.lineTo(x + 30 * U, surf); cg.lineTo(x + 140 * U + i * 20 * U, H); cg.lineTo(x + 40 * U, H); cg.fill(); }) };
  wetWash(sg, seaPts, PAL.cerulean, { alpha: 0.55, soft: 0.65, bleed: 30 * U, rim: 0.8, rimW: 4 * U, mottle: 0.4, gran: 0.2, seed: 5, U, spread: 0.012, depth: 4, lift: rays, cell: 260 * U });
  // depth: ultramarine dropped into the wet lower half (bleeds, no edge)
  const rr = rng(7);
  wetField(sg, Array.from({ length: 7 }, (_, i) => ({ color: i % 3 ? PAL.ultra : PAL.payne, a: 0.6, pts: ellipsePts(W * (0.15 + rr() * 0.7), lerp(surf, H * 0.9, 0.5 + rr() * 0.4), W * (0.1 + rr() * 0.1), H * (0.06 + rr() * 0.05), 14, rr() * 0.4) })),
    { W, H, blur: 45 * U, alpha: 0.45, seed: 8, U, gran: 0.3 });
  // a second, smaller glaze along the surface (darker band where the light stops)
  wetWash(sg, [[W * 0.04, surf + 70 * U], [W * 0.4, surf + 50 * U], [W * 0.96, surf + 80 * U], [W * 0.95, surf + 160 * U], [W * 0.55, surf + 130 * U], [W * 0.05, surf + 170 * U]], PAL.cerulean,
    { alpha: 0.28, soft: 0.8, bleed: 30 * U, rim: 0.5, rimW: 4 * U, mottle: 0.5, gran: 0.15, seed: 9, U, spread: 0.02 });
  // surface: a thin broken pen line
  inkLine(sg, seaPts.slice(0, 17), { w: 1.6, U, alpha: 0.6, seed: 11, gaps: 0.25 });

  // ---- ships: grey washes + pen (painted once, 3 boil variants of the line drawn live)
  const shipShapes = ships.map((sh, i) => {
    const s = sh.s, x = sh.x, y = surf;
    const hull = [[x - s * 0.5, y - s * 0.07], [x + s * 0.55, y - s * 0.09], [x + s * 0.42, y + s * 0.03], [x - s * 0.45, y + s * 0.03]];
    const deck = [[x - s * 0.22, y - s * 0.07], [x - s * 0.2, y - s * 0.17], [x + s * 0.05, y - s * 0.17], [x + s * 0.08, y - s * 0.22], [x + s * 0.17, y - s * 0.22], [x + s * 0.2, y - s * 0.08]];
    const mast = [[x + s * 0.12, y - s * 0.22], [x + s * 0.11, y - s * 0.38]];
    const stack = [[x - s * 0.08, y - s * 0.17], [x - s * 0.07, y - s * 0.26], [x - s * 0.01, y - s * 0.26], [x, y - s * 0.17]];
    wetWash(sg, hull, PAL.payne, { alpha: 0.6, soft: 0.2, bleed: 5 * U, rim: 0.7, rimW: 3 * U, mottle: 0.35, gran: 0.3, seed: 40 + i, U, spread: 0.01, shapes: [deck, stack] });
    // reflection: a soft vertical smear below the hull
    wetField(sg, [{ color: PAL.payne, a: 0.6, pts: [[x - s * 0.4, y + s * 0.04], [x + s * 0.4, y + s * 0.04], [x + s * 0.3, y + s * 0.18], [x - s * 0.3, y + s * 0.18]] }], { W, H, blur: 8 * U, alpha: 0.3, seed: 45 + i, U, gran: 0.2 });
    return { hull, deck, mast, stack, s, x, y };
  });

  // ---- submarine (side view, Foxtrot-like silhouette — sketch, not a blueprint): 3 painted boil variants
  const subVariants = [0, 1, 2].map(v => {
    const c = makeCanvas(sub.len * 1.25, sub.len * 0.45), cg = c.getContext('2d');
    const cx = c.width / 2, cy = c.height * 0.62, l = sub.len;
    // hull: round bow (left), long body, tapering stern (right) — hand-plotted profile
    const prof = [[-0.5, 0], [-0.49, -0.035], [-0.45, -0.055], [-0.3, -0.062], [0, -0.06], [0.25, -0.055], [0.4, -0.04], [0.5, -0.012],
      [0.5, 0.008], [0.4, 0.03], [0.2, 0.05], [-0.1, 0.056], [-0.4, 0.05], [-0.48, 0.03]];
    const hull = prof.map(([a, b2]) => [cx + a * l, cy + b2 * l]);
    const sail = [[cx - l * 0.1, cy - l * 0.055], [cx - l * 0.085, cy - l * 0.115], [cx + l * 0.06, cy - l * 0.12], [cx + l * 0.1, cy - l * 0.058]];
    wetWash(cg, hull, '#5f6a8c', { alpha: 0.62, soft: 0.25, bleed: 6 * U, rim: 0.8, rimW: 3.5 * U, mottle: 0.45, gran: 0.35, seed: 60 + v * 7, U, spread: 0.008, shapes: [sail], mode: 'source-over',
      lift: { blur: 6 * U, alpha: 0.55, fn: lg => { lg.beginPath(); lg.ellipse(cx - l * 0.05, cy - l * 0.035, l * 0.36, l * 0.012, 0, 0, 7); lg.fill(); } } });
    return { c, hull, sail, cx, cy };
  });
  const subInk = (gg, ox, oy, b) => {
    const v = subVariants[0];
    const tr = pts => pts.map(([x, y]) => [x + ox - v.c.width / 2, y + oy - v.c.height / 2]);
    inkLine(gg, tr(v.hull.slice(0, 9)), { w: 1.5, U, alpha: 0.65, seed: 70, boil: b, gaps: 0.25 });
    inkLine(gg, tr(v.hull.slice(9).concat([v.hull[0]])), { w: 1.2, U, alpha: 0.4, seed: 73, boil: b, gaps: 0.4 });
    inkLine(gg, tr(v.sail), { w: 1.3, U, alpha: 0.55, seed: 71, boil: b, gaps: 0.2 });
    const mx = v.cx + sub.len * 0.03, my = v.cy - sub.len * 0.12;
    brush(gg, tr([[mx, my], [mx + 1 * U, my - sub.len * 0.06]]), { w: 1.6 * U, color: PAL.ink, alpha: 0.6, seed: 72, boil: b, amp: 0.4 * U });
  };

  // ---- charges & bursts
  const rC = rng(90);
  const charges = [
    { ship: 0, t0: 1.45, dx: 0.06, burst: 2.75 },
    { ship: 1, t0: 1.75, dx: -0.04, burst: 3.25 },
    { ship: 0, t0: 2.1, dx: 0.12, burst: 3.85 },
    { ship: 1, t0: 2.45, dx: -0.1, burst: 4.5 },
  ].map((c, i) => {
    const sh = ships[c.ship], x0 = sh.x + sh.s * (c.ship ? 0.45 : -0.45);
    const bx = sub.x + (i % 2 ? 1 : -1) * sub.len * (0.22 + rC() * 0.25), by = sub.y - sub.len * (0.12 + rC() * 0.2) * (P ? 0.8 : 1);
    return { ...c, x0, bx, by, seed: 100 + i };
  });
  const bloomR = 70 * U * L.pick({ landscape: 1, portrait: 1.15 });
  const blooms = [0, 1].map(k => bloomStages(bloomR, PAL.payne, { stages: 7, seed: 300 + k, U, alpha: 0.5, hollow: 0.75 }));

  const grains = grainFrames(W, H, 41);
  const mSize = L.pick({ landscape: 60, portrait: 66 }) * U;
  const moscow = inkText('Moscow: silence', { font: `italic 600 ${Math.round(mSize)}px 'Cormorant Garamond'`, size: mSize, seed: 15 });
  const mXY = L.pick({ landscape: L.at(0.66, 0.0), portrait: L.at(0.2, 0.0) });
  const shipLbl = inkText('U.S. Navy destroyers', { font: `italic 500 ${Math.round(40 * U)}px 'Cormorant Garamond'`, size: 40 * U, seed: 16, alpha: 0.8 });
  el('div', { 'data-name': '2A · "Moscow: silence" (painted)', style: { position: 'absolute', left: mXY[0] + 'px', top: mXY[1] + 'px', width: moscow.width + 'px', height: moscow.height + 'px' } }, root);

  return {
    update(t) {
      const T = ctx.start + t, b = boilIndex(T), tt = onTwos(t);
      // camera: slow push in on the submarine + small noise shake after each burst
      let shx = 0, shy = 0;
      for (const c of charges) { const k = tt - c.burst; if (k > 0 && k < 0.7) { const a = (1 - k / 0.7) ** 2 * 6 * U; shx += vnoise(T * 14, c.seed) * a; shy += vnoise(T * 14, c.seed + 9) * a; } }
      const z = 1 + 0.05 * Math.min(1, t / ctx.duration);
      const cam = { x: shx, y: shy, z, fx: sub.x, fy: sub.y };
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = PAL.paper; g.fillRect(0, 0, W, H);
      drawLayer(g, sheet, cam, 1);
      camTransform(g, cam, 1, W, H);
      // ships: pen lines boil; tiny bob
      shipShapes.forEach((s, i) => {
        const bob = Math.sin(t * 1.3 + i) * 1.5 * U;
        g.save(); g.translate(0, bob);
        inkLine(g, s.hull.concat([s.hull[0]]), { w: 1.4, U, alpha: 0.65, seed: 50 + i, boil: b, gaps: 0.2 });
        inkLine(g, s.deck, { w: 1.2, U, alpha: 0.55, seed: 52 + i, boil: b, gaps: 0.2 });
        brush(g, s.mast, { w: 1.4 * U, color: PAL.ink, alpha: 0.6, seed: 54 + i, boil: b, amp: 0.3 * U });
        g.restore();
      });
      // submarine (wash boil = 3 painted variants, cycled on twos)
      const sv = subVariants[b % 3], sx = sub.x + t * 4 * U, sy = sub.y + Math.sin(t * 0.8) * 2 * U;
      g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(sv.c, sx - sv.c.width / 2, sy - sv.c.height / 2); g.restore();
      subInk(g, sx, sy, b);
      // charges fall (on twos), with a bubble trail; then burst
      for (const c of charges) {
        if (tt < c.t0) continue;
        const k = Math.min(1, (tt - c.t0) / (c.burst - c.t0)), kk = ease.inQuad(k);
        const x = lerp(c.x0, c.bx, kk) + Math.sin(k * 7 + c.seed) * 6 * U, y = lerp(surf - 8 * U, c.by, kk);
        if (tt < c.burst) {
          const s = 15 * U;
          // the charge: a little barrel, tumbling slowly (on twos)
          g.save(); g.translate(x, y); g.rotate(k * 2.4 + c.seed);
          g.globalAlpha = 0.85; g.fillStyle = '#4a5270'; g.beginPath(); g.roundRect(-s * 0.45, -s * 0.6, s * 0.9, s * 1.2, s * 0.25); g.fill();
          g.globalAlpha = 0.35; g.fillStyle = PAL.paper; g.fillRect(-s * 0.3, -s * 0.5, s * 0.18, s);
          g.restore();
          inkLine(g, [[x - s * 0.5, y - s * 0.62], [x + s * 0.5, y - s * 0.6]], { w: 1.2, U, alpha: 0.6, seed: c.seed + 3, boil: b, gaps: 0 });
          for (let j = 1; j < 5; j++) { const yy = y - j * 18 * U; if (yy < surf) break; g.save(); g.globalAlpha = 0.45 - j * 0.08; g.strokeStyle = PAL.ink; g.lineWidth = 1.1 * U; g.beginPath(); g.arc(x + vnoise(j + b * 0.3, c.seed) * 5 * U, yy, (2 + j * 0.6) * U, 0, 7); g.stroke(); g.restore(); }
          // splash ring on the surface when it enters
          const e = tt - c.t0; if (e < 0.5) inkLine(g, ellipsePts(c.x0, surf, (8 + e * 50) * U, (2 + e * 8) * U, 14), { w: 1.2, U, alpha: 0.6 * (1 - e / 0.5), seed: c.seed + 5, boil: b, closed: true, gaps: 0.3 });
        } else {
          const e = tt - c.burst, st = blooms[c.seed % 2], idx = Math.min(st.length - 1, Math.floor(e * 12));
          const fade = Math.max(0, 1 - Math.max(0, e - 1.2) / 1.6);
          // lifted pigment: the burst whitens the water first, then the pigment flows back
          g.save(); g.globalAlpha = 0.75 * fade * Math.min(1, e * 6);
          const R = bloomR * (0.4 + 0.6 * Math.min(1, e * 2.2));
          const rg = g.createRadialGradient(c.bx, c.by, 0, c.bx, c.by, R); rg.addColorStop(0, 'rgba(250,247,238,0.95)'); rg.addColorStop(0.7, 'rgba(250,247,238,0.6)'); rg.addColorStop(1, 'rgba(250,247,238,0)');
          g.fillStyle = rg; g.fillRect(c.bx - R, c.by - R, R * 2, R * 2);
          g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.9 * fade;
          const cv = st[idx]; g.drawImage(cv, c.bx - cv.width / 2, c.by - cv.height / 2);
          g.restore();
          // pen bubbles rising out of it
          for (let j = 0; j < 6; j++) { const a = j * 1.1 + c.seed, rise = e * (40 + j * 12) * U; if (fade <= 0) break;
            g.save(); g.globalAlpha = 0.5 * fade; g.strokeStyle = PAL.ink; g.lineWidth = 1 * U; g.beginPath(); g.arc(c.bx + Math.cos(a) * bloomR * 0.6, c.by - bloomR * 0.3 - rise, (2 + (j % 3)) * U, 0, 7); g.stroke(); g.restore(); }
        }
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      // ship label (lands with "American ships")
      const la = tween(t, 0.9, 1.4, 0, 1) * tween(t, 3.3, 3.7, 1, 0);
      if (la > 0) { const [lx, ly] = [ships[0].x - ships[0].s * 0.5, surf - ships[0].s * 0.62 - shipLbl.height * 0.6]; g.save(); g.globalAlpha = la; g.globalCompositeOperation = 'multiply'; g.drawImage(shipLbl, lx, ly); g.restore(); }
      // "Moscow: silence": three radio arcs leave the mast and break apart; the word stays
      const mA = tween(t, 3.55, 4.1, 0, 1, ease.outCubic);
      if (mA > 0) {
        const mastX = sx + sub.len * 0.03, mastY = sy + (sv.cy - sv.c.height / 2) - sub.len * 0.18;
        for (let k = 0; k < 3; k++) {
          const e = tt - 3.6 - k * 0.35; if (e < 0) continue;
          const R = (30 + e * 160) * U, al = Math.max(0, 0.6 - e * 0.35);
          if (al <= 0) continue;
          const pts = []; for (let j = 0; j <= 10; j++) { const a = -Math.PI / 2 - 0.6 + j * 0.12; pts.push([mastX + Math.cos(a) * R, mastY + Math.sin(a) * R]); }
          inkLine(g, pts, { w: 1.4, U, alpha: al, seed: 200 + k, boil: b, gaps: 0.25 + e * 0.4 });
        }
        const [mx, my] = mXY;
        g.save(); g.globalCompositeOperation = 'multiply'; g.beginPath(); g.rect(mx, my, moscow.width * mA, moscow.height); g.clip(); g.drawImage(moscow, mx, my); g.restore();
      }
      lightGrade(g, W, H, T, grains);
    },
  };
}
