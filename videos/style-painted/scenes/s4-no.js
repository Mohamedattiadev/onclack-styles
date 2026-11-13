// Shot 4A · MCU/EYE — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// The same painted third officer (original figure — NOT a portrait of the real man, labelled), closer now.
// Behind him the sea-chart washes of shot 1 return (rhyme). On "no" he shakes his head (on twos) and the only
// red in the film drops onto the page: a vermillion bloom spreads wet-in-wet under the word (signature move).
// On "forty years later" a pencilled 1962 → 2002 is written under his name.
import { el, ease, tween } from '/onclack-styles/engine/lib/anim.js';
import { glide } from '/onclack-styles/engine/lib/spring.js';
import { makeLayer, rng, ellipsePts, drawLayer, grainFrames, boilIndex, onTwos, lerp } from '../shared/paint.js';
import { PAL, paperSheet, wetWash, wetField, inkLine, pencil, inkText, lightGrade, caption, bloomStages } from '../shared/water.js';
import { makeFigure, ARKHIPOV_FACE } from '../shared/figure.js';

const T_NAME = 0.85, T_NO = 2.16, T_YEARS = 4.36;

export default function (root, ctx) {
  ctx.sfx('cloth-jacket-01', T_NO, { volume: 0.3 });
  let run = null; // heavy painting happens on the first frame this scene is shown (fast load, same pixels)
  return { update(t) { if (!run) run = paint(root, ctx); run.update(t); } };
}

function paint(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, U = L.unit, P = L.portrait;
  const canvas = el('canvas', { width: W, height: H, 'data-name': '4A · Arkhipov (painted illustration)', style: { position: 'absolute', inset: 0 } }, root);
  const g = canvas.getContext('2d');

  // ---- page: the sea chart washes come back behind him (rhyme with shot 1)
  const sheet = makeLayer(W, H, 0.12), sg = sheet.g;
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); paperSheet(sg, sheet.c.width, sheet.c.height, 61, U); sg.restore();
  const fx = L.pick({ landscape: 0.66, portrait: 0.5 }) * W;
  const u = L.pick({ landscape: H * 0.27, portrait: W * 0.27 });
  const fy = L.pick({ landscape: H * 0.56, portrait: H * 0.53 });
  const vign = [[W * 0.04, H * 0.05], [W * 0.5, H * 0.03], [W * 0.96, H * 0.06], [W * 0.97, H * 0.6], [W * 0.95, H * 0.95], [W * 0.5, H * 0.97], [W * 0.03, H * 0.94], [W * 0.05, H * 0.5]];
  wetWash(sg, vign, PAL.cerulean, { alpha: 0.38, soft: 0.6, bleed: 34 * U, rim: 0.8, rimW: 5 * U, mottle: 0.5, gran: 0.2, seed: 62, U, spread: 0.03, maxSeg: 90,
    lift: { blur: 80 * U, alpha: 0.8, fn: lg => { lg.beginPath(); lg.ellipse(fx - u * 0.6, fy - u * 1.2, u * 1.6, u * 1.4, 0, 0, 7); lg.fill(); } } });
  const r = rng(63);
  wetField(sg, Array.from({ length: 5 }, (_, i) => ({ color: i % 2 ? PAL.ultra : PAL.payne, a: 0.6, pts: ellipsePts(W * (0.1 + r() * 0.8), H * (0.15 + r() * 0.75), W * 0.12, H * 0.1, 14, r()) })), { W, H, blur: 50 * U, alpha: 0.3, seed: 64, U, gran: 0.3 });
  wetField(sg, [{ color: PAL.ochre, a: 0.8, pts: ellipsePts(fx - u * 1.2, fy - u * 1.9, u * 1.2, u * 0.8, 14) }], { W, H, blur: 50 * U, alpha: 0.35, seed: 65, U, gran: 0.1 });
  // pencil graticule + a ghost of the coast (from shot 1)
  [0.3, 0.68].forEach((k, i) => pencil(sg, [[W * 0.05, H * k], [W * 0.5, H * (k + 0.004)], [W * 0.95, H * k]], { seed: 66 + i, U, alpha: 0.2 }));
  [0.22, 0.86].forEach((k, i) => pencil(sg, [[W * k, H * 0.06], [W * (k + 0.003), H * 0.5], [W * k, H * 0.94]], { seed: 68 + i, U, alpha: 0.2 }));

  const fig = makeFigure({ u, arms: 'down', cap: false, seed: 7, U, shirt: 'blue', hair: '#4e3b30', brows: -0.3, build: 1.0, face: ARKHIPOV_FACE });

  // ---- lettering
  const nSize = L.pick({ landscape: 74, portrait: 72 }) * U;
  const name = inkText('Vasili Arkhipov', { font: `600 ${Math.round(nSize)}px Cinzel`, size: nSize, seed: 71, track: 2 * U });
  const role = inkText('flotilla chief of staff, B-59', { font: `italic 500 ${Math.round(42 * U)}px 'Cormorant Garamond'`, size: 42 * U, seed: 72, color: '#544c46' });
  const noSize = L.pick({ landscape: 190, portrait: 170 }) * U;
  const no = inkText('No.', { font: `italic 600 ${Math.round(noSize)}px 'Cormorant Garamond'`, size: noSize, seed: 73, color: '#a8321f' });
  const ySize = L.pick({ landscape: 60, portrait: 60 }) * U;
  const years = inkText('the world learns: 2002', { font: `italic 600 ${Math.round(ySize)}px 'Cormorant Garamond'`, size: ySize, seed: 74 });
  const cap = caption('illustration · not a portrait', U);
  const nameXY = L.pick({ landscape: L.at(0.0, 0.04), portrait: L.at(0.02, 0.0) });
  const noXY = L.pick({ landscape: L.at(0.04, 0.36), portrait: L.at(0.0, 0.2) });
  const yrXY = L.pick({ landscape: L.at(0.0, 0.8), portrait: L.at(0.02, 0.86) });
  const bloomR = noSize * 0.62;
  const bloom = bloomStages(bloomR, PAL.verm, { stages: 7, seed: 75, U, alpha: 0.42, hollow: 0.35 });
  el('div', { 'data-name': '4A · Name card', style: { position: 'absolute', left: nameXY[0] + 'px', top: nameXY[1] + 'px', width: Math.max(name.width, role.width) + 'px', height: name.height + role.height * 0.8 + 'px' } }, root);
  el('div', { 'data-name': '4A · "No." + red bloom', style: { position: 'absolute', left: noXY[0] + 'px', top: noXY[1] + 'px', width: no.width + 'px', height: no.height + 'px' } }, root);
  el('div', { 'data-name': '4A · 2002 note', style: { position: 'absolute', left: yrXY[0] + 'px', top: yrXY[1] + 'px', width: years.width + 'px', height: years.height + 'px' } }, root);
  const grains = grainFrames(W, H, 81);

  const wipe = (img, x, y, a) => { if (a <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; g.beginPath(); g.rect(x, y, img.width * a, img.height); g.clip(); g.drawImage(img, x, y); g.restore(); };

  return {
    update(t) {
      const T = ctx.start + t, b = boilIndex(T), tt = onTwos(t);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = PAL.paper; g.fillRect(0, 0, W, H);
      // camera: carries the push from shot 3, then settles; a second small push on "no"
      const z = 1.04 + glide(t, 0, 1.6, 0, 0.03) + glide(t, T_NO, T_NO + 2.5, 0, 0.035);
      const cam = { x: 0, y: 0, z, fx, fy: fy - u };
      drawLayer(g, sheet, cam, 0.7);
      g.setTransform(z, 0, 0, z, cam.fx - z * cam.fx, cam.fy - z * cam.fy);
      // head shake on "no": three turns, decaying, on twos
      const e = tt - T_NO;
      const shake = e > 0 && e < 0.9 ? Math.sin(e / 0.9 * Math.PI * 3) * (1 - e / 0.9) * 0.9 : 0;
      const look = glide(t, 0, 1.2, -0.35, -0.15) + glide(t, 3.2, 4.4, 0, 0.25); // looks off, then toward camera-left as "the world" learns
      fig.draw(g, fx, fy + Math.sin(t * 1.5) * 0.004 * u, { b, turn: look + shake, nod: e > 0.9 && e < 1.4 ? Math.sin((e - 0.9) / 0.5 * Math.PI) * 0.06 : 0 });
      g.setTransform(1, 0, 0, 1, 0, 0);
      // name card (screen space, read text stays still)
      wipe(name, nameXY[0], nameXY[1], tween(t, T_NAME, T_NAME + 0.7, 0, 1, ease.outCubic));
      wipe(role, nameXY[0] + nSize * 0.3, nameXY[1] + name.height * 0.85, tween(t, T_NAME + 0.5, T_NAME + 1.1, 0, 1, ease.outCubic));
      // the red bloom (7 painted stages on twos), then the word
      if (e >= -0.04) {
        const idx = Math.min(bloom.length - 1, Math.max(0, Math.floor((e + 0.04) * 12)));
        const cv = bloom[idx], bx = noXY[0] + no.width * 0.42, by = noXY[1] + no.height * 0.58;
        g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(cv, bx - cv.width / 2, by - cv.height / 2); g.restore();
        wipe(no, noXY[0], noXY[1], tween(t, T_NO + 0.02, T_NO + 0.26, 0, 1, ease.outCubic));
      }
      // forty years later
      const yA = tween(t, T_YEARS, T_YEARS + 0.8, 0, 1, ease.outCubic);
      if (yA > 0) {
        wipe(years, yrXY[0], yrXY[1], yA);
        if (yA > 0.85) pencil(g, [[yrXY[0] + ySize * 0.35, yrXY[1] + years.height * 0.93], [yrXY[0] + ySize * 0.35 + (years.width - ySize * 0.7) * Math.min(1, (yA - 0.85) / 0.15), yrXY[1] + years.height * 0.95]], { seed: 76, U, alpha: 0.5, w: 1.6, boil: b });
      }
      { const [cx, cy] = P ? [nameXY[0] + nSize * 0.3 + cap.width, nameXY[1] + name.height * 0.85 + role.height * 0.9] : L.at(1, 0); g.save(); g.globalAlpha = 0.9; g.globalCompositeOperation = 'multiply'; g.drawImage(cap, cx - cap.width, cy); g.restore(); }
      lightGrade(g, W, H, T, grains);
    },
  };
}
