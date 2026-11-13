// Shot 3A · INS/SIDE — "On board: a nuclear torpedo."  →  Shot 3B · MS/EYE — "To fire it, three officers must agree. Two say yes."
// 3A: the torpedo painted lengthwise on the page, pencil note, slow pan along it. Wet dissolve (15 f) into
// 3B: three painted officers under a lamp (original figures, NOT portraits). On "Two say yes" the left two nod
// (on twos) and a pencilled "yes" lands beside each; the third stays still, apart — the camera starts creeping to him.
import { el, ease, tween } from '/onclack-styles/engine/lib/anim.js';
import { glide } from '/onclack-styles/engine/lib/spring.js';
import { makeLayer, rng, blobPts, ellipsePts, drawLayer, grainFrames, boilIndex, onTwos, makeCanvas, lerp } from '../shared/paint.js';
import { PAL, paperSheet, wetWash, wetField, inkLine, pencil, inkText, lightGrade, caption } from '../shared/water.js';
import { makeFigure, ARKHIPOV_FACE } from '../shared/figure.js';

export default function (root, ctx) {
  ctx.sfx('cloth-jacket-01', 4.95, { volume: 0.35 });
  let run = null; // heavy painting happens on the first frame this scene is shown (fast load, same pixels)
  return { update(t) { if (!run) run = paint(root, ctx); run.update(t); } };
}

function paint(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, U = L.unit, P = L.portrait;
  const canvas = el('canvas', { width: W, height: H, 'data-name': '3 · Torpedo + three officers', style: { position: 'absolute', inset: 0 } }, root);
  const g = canvas.getContext('2d');
  const CUT = 2.5, XF = 0.5; // wet dissolve 2.5 → 3.0 s (local)

  // ================= 3A torpedo
  const A = makeLayer(W, H, 0.14), ag = A.g;
  ag.save(); ag.setTransform(1, 0, 0, 1, 0, 0); paperSheet(ag, A.c.width, A.c.height, 31, U); ag.restore();
  const tl = W * L.pick({ landscape: 0.76, portrait: 0.78 }), tr = tl * 0.058;          // length, radius
  const tx = W * L.pick({ landscape: 0.5, portrait: 0.47 }), ty = H * L.pick({ landscape: 0.5, portrait: 0.46 });
  // a pale wet ground behind it (the torpedo room, only suggested)
  wetField(ag, [{ color: PAL.payne, a: 0.6, pts: ellipsePts(tx, ty + tr * 1.5, tl * 0.55, tr * 4.5, 16) }, { color: PAL.ochre, a: 0.7, pts: ellipsePts(tx - tl * 0.3, ty - tr * 3, tl * 0.25, tr * 2.5, 14) }],
    { W, H, blur: 40 * U, alpha: 0.32, seed: 3, U, gran: 0.3 });
  // body: green-grey steel, highlight lifted along the top, dark belly dropped in wet
  const prof = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + i / 12 * Math.PI; prof.push([tx - tl / 2 + tr * 1.6 - Math.cos(a) * tr * 1.6, ty + Math.sin(a) * tr]); }
  const body = [...prof, [tx + tl * 0.38, ty + tr], [tx + tl * 0.46, ty + tr * 0.55], [tx + tl * 0.46, ty - tr * 0.55], [tx + tl * 0.38, ty - tr]];
  wetWash(ag, body, '#8a9a8e', { alpha: 0.6, soft: 0.3, bleed: 8 * U, rim: 0.7, rimW: 4 * U, mottle: 0.25, gran: 0.35, seed: 10, U, spread: 0.006, maxSeg: 60,
    lift: { blur: 10 * U, alpha: 0.75, fn: lg => { lg.beginPath(); lg.ellipse(tx - tl * 0.02, ty - tr * 0.45, tl * 0.42, tr * 0.18, 0, 0, 7); lg.fill(); } } });
  wetWash(ag, [[tx - tl * 0.44, ty - tr * 0.1], [tx + tl * 0.44, ty - tr * 0.15], [tx + tl * 0.38, ty + tr], [tx - tl * 0.42, ty + tr]], PAL.payne, { alpha: 0.32, soft: 0.85, bleed: 18 * U, rim: 0.3, rimW: 3 * U, mottle: 0.4, gran: 0.35, seed: 11, U, spread: 0.01 });
  wetWash(ag, [[tx - tl * 0.42, ty + tr * 0.55], [tx + tl * 0.44, ty + tr * 0.5], [tx + tl * 0.38, ty + tr], [tx - tl * 0.4, ty + tr]], PAL.ultra, { alpha: 0.3, soft: 0.9, bleed: 8 * U, rim: 0.2, rimW: 3 * U, mottle: 0.3, gran: 0.4, seed: 18, U, spread: 0.01 });
  // the highlight: pigment lifted off with a damp brush along the top
  wetWash(ag, [[tx - tl * 0.4, ty - tr * 0.62], [tx + tl * 0.36, ty - tr * 0.66], [tx + tl * 0.34, ty - tr * 0.4], [tx - tl * 0.38, ty - tr * 0.36]], PAL.paper, { alpha: 0.55, soft: 0.6, bleed: 6 * U, rim: 0, mottle: 0.4, gran: 0, seed: 17, U, spread: 0.02, maxSeg: 50, mode: 'source-over' });
  // its shadow on the deck
  wetField(ag, [{ color: PAL.payne, a: 0.7, pts: ellipsePts(tx, ty + tr * 2.1, tl * 0.46, tr * 0.35, 18) }], { W, H, blur: 14 * U, alpha: 0.35, seed: 19, U, gran: 0.3 });
  // warhead section: a slightly warmer, darker band (the part that made it "special")
  wetWash(ag, [[tx - tl / 2 + tr * 1.2, ty - tr], [tx - tl * 0.22, ty - tr], [tx - tl * 0.22, ty + tr], [tx - tl / 2 + tr * 1.2, ty + tr]], PAL.burnt, { alpha: 0.16, soft: 0.75, bleed: 8 * U, rim: 0.5, rimW: 3 * U, mottle: 0.3, gran: 0.3, seed: 12, U, spread: 0.03, maxSeg: 40 });
  // tail: fins + propellers
  const fin = s => [[tx + tl * 0.42, ty + s * tr * 0.5], [tx + tl * 0.5, ty + s * tr * 1.7], [tx + tl * 0.53, ty + s * tr * 1.6], [tx + tl * 0.5, ty + s * tr * 0.4]];
  wetWash(ag, fin(-1), '#7d8b84', { alpha: 0.65, soft: 0.2, bleed: 4 * U, rim: 0.7, rimW: 2 * U, mottle: 0.3, gran: 0.3, seed: 13, U, spread: 0.01, shapes: [fin(1)] });
  wetWash(ag, blobPts(tx + tl * 0.475, ty, tr * 0.22, tr * 0.9, { n: 16 }), '#6c6f6a', { alpha: 0.7, soft: 0.2, bleed: 3 * U, rim: 0.7, rimW: 2 * U, mottle: 0.3, gran: 0.2, seed: 14, U, spread: 0.02 });
  // cradle: two wooden chocks
  [-0.25, 0.25].forEach((k, i) => wetWash(ag, [[tx + tl * k - tr * 0.8, ty + tr * 0.85], [tx + tl * k, ty + tr * 1.02], [tx + tl * k + tr * 0.8, ty + tr * 0.85], [tx + tl * k + tr * 1.0, ty + tr * 1.9], [tx + tl * k - tr * 1.0, ty + tr * 1.9]], PAL.burnt, { alpha: 0.4, soft: 0.4, bleed: 5 * U, rim: 0.7, rimW: 2 * U, mottle: 0.4, gran: 0.3, seed: 15 + i, U, spread: 0.05, maxSeg: 30 }));
  // pen: broken contour, panel seams (long lines get a hand wobble — not ruled)
  const rw = rng(23);
  const wob = ([a, b2], sd) => Array.from({ length: 9 }, (_, i) => [lerp(a[0], b2[0], i / 8), lerp(a[1], b2[1], i / 8) + (i % 8 ? (rw() - 0.5) * 3 * U : 0)]);
  const torpInk = [
    { p: wob([prof[0], [tx + tl * 0.38, ty - tr]], 21), w: 1.6 }, { p: prof, w: 1.8 }, { p: wob([prof[12], [tx + tl * 0.38, ty + tr]], 22), w: 2.2 },
    { p: [[tx - tl * 0.22, ty - tr], [tx - tl * 0.22, ty + tr]], w: 1.1 }, { p: [[tx + tl * 0.05, ty - tr], [tx + tl * 0.05, ty + tr]], w: 1.0 },
    { p: [[tx + tl * 0.3, ty - tr], [tx + tl * 0.3, ty + tr]], w: 1.0 }, { p: fin(-1), w: 1.2 }, { p: fin(1), w: 1.2 },
  ];
  pencil(ag, [[tx - tl * 0.5, ty + tr * 1.95], [tx + tl * 0.5, ty + tr * 1.93]], { seed: 20, U, alpha: 0.3 });
  const note = inkText('nuclear torpedo', { font: `italic 600 ${Math.round(L.pick({ landscape: 62, portrait: 66 }) * U)}px 'Cormorant Garamond'`, size: L.pick({ landscape: 62, portrait: 66 }) * U, seed: 21 });
  const noteXY = [tx - tl * L.pick({ landscape: 0.36, portrait: 0.42 }), ty - tr * 4.6];

  // ================= 3B three officers
  const Bl = makeLayer(W, H, 0.14), bg = Bl.g;
  bg.save(); bg.setTransform(1, 0, 0, 1, 0, 0); paperSheet(bg, Bl.c.width, Bl.c.height, 33, U); bg.restore();
  const floorY = H * L.pick({ landscape: 0.86, portrait: 0.7 });
  // the room: a loose vignette — green-grey wall, warm lamp pool, pipes in pencil
  const room = [[W * 0.04, H * 0.05], [W * 0.96, H * 0.04], [W * 0.97, floorY], [W * 0.03, floorY + 6 * U]];
  wetWash(bg, room, '#9aa79b', { alpha: 0.4, soft: 0.6, bleed: 30 * U, rim: 0.7, rimW: 5 * U, mottle: 0.5, gran: 0.25, seed: 40, U, spread: 0.03, maxSeg: 90,
    lift: { blur: 70 * U, alpha: 0.85, fn: lg => { lg.beginPath(); lg.ellipse(W * 0.4, H * 0.2, W * 0.2, H * 0.22, 0, 0, 7); lg.fill(); } } });
  wetField(bg, [{ color: PAL.ochre, a: 0.8, pts: ellipsePts(W * 0.4, H * 0.18, W * 0.17, H * 0.16, 14) }], { W, H, blur: 45 * U, alpha: 0.45, seed: 41, U, gran: 0.1 });
  wetField(bg, [{ color: PAL.payne, a: 0.6, pts: ellipsePts(W * 0.88, H * 0.45, W * 0.12, H * 0.35, 14) }, { color: PAL.payne, a: 0.5, pts: ellipsePts(W * 0.08, H * 0.5, W * 0.08, H * 0.3, 14) }], { W, H, blur: 50 * U, alpha: 0.35, seed: 42, U, gran: 0.3 });
  const rp = rng(44);
  for (let i = 0; i < 4; i++) { const y = H * (0.1 + i * 0.045 + rp() * 0.01); pencil(bg, [[W * 0.05, y], [W * 0.5, y + 2 * U], [W * 0.95, y - 1 * U]], { seed: 45 + i, U, alpha: 0.28, w: 1.2 }); }
  // the lamp
  pencil(bg, [[W * 0.4, H * 0.0], [W * 0.4, H * 0.07]], { seed: 54, U, alpha: 0.5, w: 1.3 });
  wetWash(bg, [[W * 0.39, H * 0.07], [W * 0.41, H * 0.07], [W * 0.43, H * 0.105], [W * 0.37, H * 0.105]], '#5a6050', { alpha: 0.55, soft: 0.2, bleed: 3 * U, rim: 0.7, rimW: 2 * U, mottle: 0.3, gran: 0.2, seed: 55, U, spread: 0.02, maxSeg: 20 });
  wetWash(bg, ellipsePts(W * 0.4, H * 0.11, 9 * U, 6 * U, 10), '#fff6d8', { alpha: 0.9, soft: 0.9, bleed: 6 * U, rim: 0, mottle: 0, gran: 0, seed: 56, U, mode: 'source-over' });
  const u = L.pick({ landscape: H * 0.155, portrait: W * 0.145 });
  const figY = floorY - u * 2.6;
  const xs = L.pick({ landscape: [0.24, 0.46, 0.77], portrait: [0.2, 0.5, 0.81] }).map(f => W * f);
  // two gauges on the wall, in the gaps between the men (never behind a head)
  [(xs[0] + xs[1]) / 2, (xs[1] + xs[2]) / 2].forEach((cx, i) => {
    const cy = figY - u * 0.9 + i * u * 0.15, R = u * 0.2;
    wetWash(bg, ellipsePts(cx, cy, R, R, 14), '#efe8d2', { alpha: 0.8, soft: 0.2, bleed: 3 * U, rim: 0.4, rimW: 2 * U, mottle: 0.2, gran: 0, seed: 50 + i, U, mode: 'source-over', spread: 0.02 });
    inkLine(bg, ellipsePts(cx, cy, R, R, 18), { w: 1.3, U, alpha: 0.55, seed: 52 + i, closed: true, gaps: 0.2 });
    inkLine(bg, [[cx, cy], [cx + R * 0.6 * Math.cos(-0.9 - i), cy + R * 0.6 * Math.sin(-0.9 - i)]], { w: 1.4, U, alpha: 0.6, seed: 54 + i, gaps: 0 });
  });
  const figs = [
    makeFigure({ u, arms: 'behind', cap: true, seed: 3, U, shirt: 'blue', hair: '#5a4334', brows: 1, build: 1.06, face: { w: 1.06, nose: 0.9, eyeY: 0.01, mouth: 1.15, eyeGap: 1.05 } }),
    makeFigure({ u: u * 0.97, arms: 'hips', cap: false, seed: 5, U, shirt: 'khaki', hair: '#7a5a40', brows: 0.5, build: 0.98, skin: '#d9a070', face: { w: 0.94, nose: 1.15, eyeY: -0.015, mouth: 0.85, eyeGap: 0.95 } }),
    makeFigure({ u: u * 1.0, arms: 'down', cap: false, seed: 7, U, shirt: 'blue', hair: '#4e3b30', brows: -0.3, build: 1.0, face: ARKHIPOV_FACE }),
  ];
  const roleSize = L.pick({ landscape: 40, portrait: 38 }) * U;
  const roles = ['captain', 'political officer', 'flotilla chief of staff'].map((t, i) => inkText(t, { font: `italic 500 ${Math.round(roleSize)}px 'Cormorant Garamond'`, size: roleSize, seed: 60 + i, color: '#544c46', alpha: 0.9 }));
  const yes = [0, 1].map(i => inkText('yes', { font: `italic 600 ${Math.round(58 * U)}px 'Cormorant Garamond'`, size: 58 * U, seed: 70 + i }));
  const cap = caption('illustration · not portraits', U);
  // timing (local): "three officers" 3.19 · "Two" 4.97 · "say yes" 5.23–5.82
  const NOD = [4.98, 5.3];
  const grains = grainFrames(W, H, 51);
  el('div', { 'data-name': '3B · Three officers (painted, not portraits)', style: { position: 'absolute', left: W * 0.05 + 'px', top: figY - u * 1.3 + 'px', width: W * 0.9 + 'px', height: u * 4 + 'px', pointerEvents: 'none' } }, root);

  return {
    update(t) {
      const T = ctx.start + t, b = boilIndex(T), tt = onTwos(t);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = PAL.paper; g.fillRect(0, 0, W, H);
      const mix = tween(t, CUT, CUT + XF, 0, 1, ease.inOutSine);
      // ---- 3A
      if (mix < 1) {
        const pan = glide(t, 0, CUT + XF, 0, 1);
        const cam = { x: lerp(-W * 0.035, W * 0.035, pan), y: 0, z: 1.06 + pan * 0.04 };
        g.save(); g.globalAlpha = 1;
        drawLayer(g, A, cam, 1);
        g.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.z * W / 2 - cam.x, H / 2 - cam.z * H / 2);
        torpInk.forEach((l, i) => inkLine(g, l.p, { w: l.w, U, alpha: 0.7, seed: 80 + i, boil: b, gaps: 0.2 }));
        const nA = tween(t, 0.95, 1.5, 0, 1, ease.outCubic);
        if (nA > 0) {
          g.globalCompositeOperation = 'multiply';
          g.save(); g.beginPath(); g.rect(noteXY[0], noteXY[1], note.width * nA, note.height); g.clip(); g.drawImage(note, noteXY[0], noteXY[1]); g.restore();
          if (nA > 0.6) pencil(g, [[noteXY[0] + note.width * 0.3, noteXY[1] + note.height * 0.95], [noteXY[0] + note.width * 0.25, ty - tr * 1.15]], { seed: 22, U, alpha: 0.55, w: 1.4, boil: b });
        }
        g.restore();
      }
      // ---- 3B (wet dissolve: the new page comes up through the old one)
      if (mix > 0) {
        const push = glide(t, CUT, ctx.duration + 0.4, 0, 1);
        const late = glide(t, 5.6, ctx.duration + 0.5, 0, 1);
        const cam = { x: late * (xs[2] - W / 2) * 0.12, y: -late * u * 0.1, z: 1.0 + push * 0.03 + late * 0.06 };
        g.save(); g.globalAlpha = mix;
        if (mix < 1) g.globalCompositeOperation = 'source-over';
        drawLayer(g, Bl, cam, 1);
        g.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.z * W / 2 - cam.x, H / 2 - cam.z * H / 2 - cam.y);
        figs.forEach((f, i) => {
          let nod = 0;
          if (i < 2) { const e = tt - NOD[i]; if (e > 0) nod = Math.sin(Math.min(1, e / 0.42) * Math.PI) * 0.32 + (e > 0.42 ? Math.sin(Math.min(1, (e - 0.42) / 0.3) * Math.PI) * 0.12 : 0); }
          const breathe = Math.sin(t * 1.6 + i * 2) * 0.006 * u;
          const turn = i === 2 ? -0.25 : (i === 0 ? 0.35 : 0.1);
          f.draw(g, xs[i], figY + breathe, { b: b + i, nod, turn, alpha: 1 });
        });
        // role labels (pencil, under each figure) land with "three officers"
        const rA = tween(t, 3.1, 3.6, 0, 1, ease.outCubic);
        if (rA > 0) roles.forEach((c, i) => { g.save(); g.globalAlpha = mix * rA * (i === 2 ? 1 : 0.9); g.globalCompositeOperation = 'multiply'; g.drawImage(c, xs[i] - c.width / 2, floorY + 4 * U); g.restore(); });
        // "yes" beside the two who agree
        [0, 1].forEach(i => {
          const a = tween(t, NOD[i] + 0.05, NOD[i] + 0.4, 0, 1, ease.outCubic);
          if (a <= 0) return;
          const c = yes[i], x = xs[i] + u * 0.55, y = figY - u * 1.55;
          g.save(); g.globalCompositeOperation = 'multiply'; g.beginPath(); g.rect(x, y, c.width * a, c.height); g.clip(); g.drawImage(c, x, y); g.restore();
          if (a > 0.7) inkLine(g, [[x + c.width * 0.85, y + c.height * 0.62], [x + c.width * 0.95, y + c.height * 0.78], [x + c.width * 1.15, y + c.height * 0.38]], { w: 2.2, U, alpha: 0.8, seed: 90 + i, boil: b, gaps: 0 });
        });
        g.restore();
        g.setTransform(1, 0, 0, 1, 0, 0);
        { const [cx, cy] = L.at(1, 0); g.save(); g.globalAlpha = mix * 0.9; g.globalCompositeOperation = 'multiply'; g.drawImage(cap, cx - cap.width, cy); g.restore(); }
      }
      lightGrade(g, W, H, T, grains);
    },
  };
}
