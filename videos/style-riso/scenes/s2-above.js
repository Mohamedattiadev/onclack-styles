// Spread 2 — PRESSURE: a real U.S. Navy photo of USS Beale (one of the destroyers over B-59), separated into the two
// drums; a hand-made section strip where three practice charges are printed falling, step by step; a Moscow form left blank.
// intent: KNOW US ships forced the boat, Moscow silent · FEEL pressure from above · SEE the destroyer printed in two passes.
// truth: photo = EV (U.S. Navy NH 103711, 1964 — captioned with its real date); section strip = VO, "not to scale";
//        the Moscow form = VO (our paste-up, no invented document text).
import { glide } from '/onclack-styles/engine/lib/anim.js';
import { F, FONT, wordT, spread, furniture, columns, printed, jolt, text, measure, pathFrom, cutPts, tornPts, pasteShadow, tape, photo, grey } from '../shared/riso.js';

export default async function (root, ctx) {
  const L = ctx.layout, u = L.unit, P = L.portrait;
  const sheet = spread(root, ctx, { seed: 12 });
  const C = columns(L);
  const fur = furniture(sheet.cam, sheet, L, { page: 4 });
  const img = new Image();
  img.src = ctx.asset('assets/uss-beale-1964.jpg');
  await img.decode();

  const tAbove = wordT(ctx, 'Above', 0, 0.35) - 2 * F;
  const tAmer = wordT(ctx, 'American', 0, 0.86) - 2 * F;
  const tShips = wordT(ctx, 'ships', 0, 1.42) - 2 * F;
  const tDrop = wordT(ctx, 'drop', 0, 1.74) - 2 * F;
  const tCharges = wordT(ctx, 'charges', 0, 2.84) - 2 * F;
  const tMoscow = wordT(ctx, 'Moscow', 0, 3.74) - 2 * F;
  const tSilent = wordT(ctx, 'silent', 0, 4.72) - 2 * F;
  const tDays = wordT(ctx, 'days', 0, 5.28) - 2 * F;

  // ---- the photo scrap (EV), torn on three sides, scissor-cut on the left
  const Ph = L.pick({
    landscape: { x: C.left.x - 6 * u, y: C.top + 34 * u, w: C.left.w + 10 * u, h: 600 * u },
    portrait: { x: C.left.x - 10 * u, y: C.top + 90 * u, w: C.left.w + 10 * u, h: 600 * u },
  });
  const tear = pathFrom(tornPts(16 * u, 16 * u, Ph.w - 32 * u, Ph.h - 32 * u, 51, u, { amp: 9, torn: [1, 1, 1, 0] }));
  const pbox = { x: 16 * u, y: 16 * u, w: Ph.w - 32 * u, h: Ph.h - 32 * u };
  const crop = { focus: [0.5, 0.52], zoom: 1.02, contrast: 1.45, bright: 1.03 };
  const ph = printed(sheet.cam, sheet, {
    name: '2A Photo USS Beale (two drums)', x: Ph.x, y: Ph.y, w: Ph.w, h: Ph.h, rot: -1.1, seed: 53,
    layers: [
      { ink: 'teal', at: tAbove, dur: 8 * F, gamma: 1.15, gain: 1.1, lo: 0.22, grain: 2.8, fine: 0.25, starve: 0.32, draw: g => { pasteShadow(g, tear, u, 0.7); photo(g, img, tear, pbox, crop); } },
      { ink: 'orange', at: tAmer, dur: 8 * F, gamma: 0.9, gain: 0.62, lo: 0.3, grain: 2.8, fine: 0.25, starve: 0.45, draw: g => {
        photo(g, img, tear, pbox, crop);
        tape(g, 60 * u, 26 * u, 170 * u, 50 * u, -12, 54, u, 0.36);
        tape(g, Ph.w - 70 * u, Ph.h - 30 * u, 170 * u, 50 * u, -8, 55, u, 0.36);
      } },
    ],
  });

  // typed caption under the photo (specific, with the real date of the photo)
  const fCap = { family: FONT.mono, size: L.pick({ landscape: 26, portrait: 27 }) * u, weight: 500, track: 0 };
  const capLines = ['USS BEALE (DD-471), one of the ships over B-59.', 'U.S. Navy photo NH 103711 — taken 1964.'];
  const capW = Math.max(...capLines.map(s => measure(s, fCap).w)) + 10 * u;
  const cap = printed(sheet.cam, sheet, {
    name: '2A Typed caption', x: Ph.x + 22 * u, y: Ph.y + Ph.h + 4 * u, w: capW, h: 84 * u, seed: 57,
    layers: [{ ink: 'teal', at: tShips, starve: 0.2, draw: g => capLines.forEach((s, i) => text(g, s, 4 * u, 28 * u + i * 38 * u, fCap)) }],
  });

  // ---- section strip (VO): surface, ruled water, the boat deep below; charges printed as they fall
  const S = L.pick({
    landscape: { x: C.right.x + 10 * u, y: C.top + 30 * u, w: 380 * u, h: 600 * u },
    portrait: { x: C.left.x, y: Ph.y + Ph.h + 110 * u, w: 400 * u, h: 520 * u },
  });
  const surfY = 70 * u, boatY = S.h - 90 * u;
  const strip = pathFrom(cutPts(10 * u, 10 * u, S.w - 20 * u, S.h - 20 * u, 61, u, 0.7));
  const fLab = { family: FONT.mono, size: 24 * u, weight: 500, track: 2 * u };
  const sect = printed(sheet.cam, sheet, {
    name: '2B Section strip (diagram, not to scale)', x: S.x, y: S.y, w: S.w, h: S.h, rot: 0.7, seed: 63,
    layers: [{ ink: 'teal', at: tAbove + 6 * F, dur: 8 * F, starve: 0.3, draw: g => {
      pasteShadow(g, strip, u, 0.6);
      g.save(); g.clip(strip);
      g.fillStyle = grey(1); g.fillRect(0, surfY, S.w, 7 * u);                      // sea surface
      g.strokeStyle = grey(0.3); g.lineWidth = 2 * u;
      for (let y = surfY + 30 * u; y < S.h; y += 22 * u) { g.beginPath(); g.moveTo(0, y); g.lineTo(S.w, y - 2 * u); g.stroke(); }
      // the boat: a plain cut shape (diagram, not a drawing of B-59)
      const bw = S.w * 0.5, bh = 30 * u, bx = S.w * 0.25;
      g.fillStyle = grey(1);
      g.beginPath(); g.moveTo(bx, boatY); g.lineTo(bx + bw * 0.12, boatY - bh / 2); g.lineTo(bx + bw, boatY - bh * 0.42); g.lineTo(bx + bw, boatY + bh * 0.42); g.lineTo(bx + bw * 0.12, boatY + bh / 2); g.closePath(); g.fill();
      g.fillRect(bx + bw * 0.4, boatY - bh / 2 - 20 * u, bw * 0.17, 22 * u);
      // ship on the surface: a cut trapezoid
      g.beginPath(); g.moveTo(S.w * 0.3, surfY); g.lineTo(S.w * 0.72, surfY); g.lineTo(S.w * 0.76, surfY - 18 * u); g.lineTo(S.w * 0.26, surfY - 18 * u); g.closePath(); g.fill();
      g.fillRect(S.w * 0.46, surfY - 40 * u, 26 * u, 24 * u);
      g.restore();
      text(g, 'B-59', bx + bw * 0.28, boatY + 54 * u, { ...fLab, size: 28 * u }, 1);
      
    } }],
  });

  // three charges: a dotted fall printed step by step (slow feed), then a burst ring lands (orange, with the snap)
  const xs = [0.33, 0.52, 0.68];
  const depthY = [boatY - 150 * u, boatY - 110 * u, boatY - 170 * u];
  const charges = xs.map((fx, i) => {
    const x = S.w * fx, y0 = surfY + 14 * u, y1 = depthY[i];
    const tFall = tDrop + i * 7 * F, tBurst = tCharges + i * 9 * F;
    const trail = printed(sheet.cam, sheet, {
      name: `2B Charge ${i + 1} fall`, x: S.x + x - 10 * u, y: S.y + y0, w: 20 * u, h: y1 - y0, rot: 0.7, seed: 70 + i,
      layers: [{ ink: 'orange', at: tFall, dur: Math.max(10 * F, tBurst - tFall), draw: (g, w, h) => {
        g.fillStyle = grey(1);
        for (let y = 0; y < h - 8 * u; y += 16 * u) g.fillRect(w / 2 - 3 * u, y, 6 * u, 7 * u);
      } }],
    });
    const R = 46 * u;
    const ring = printed(sheet.cam, sheet, {
      name: `2B Charge ${i + 1} burst`, x: S.x + x - R, y: S.y + y1 - R, w: 2 * R, h: 2 * R, seed: 74 + i,
      layers: [{ ink: 'orange', at: tBurst, dur: 4 * F, draw: (g, w) => {
        g.fillStyle = grey(1); g.beginPath(); g.arc(w / 2, w / 2, 11 * u, 0, Math.PI * 2); g.fill();
        g.strokeStyle = grey(1); g.lineWidth = 5 * u; g.setLineDash([9 * u, 7 * u]);
        g.beginPath(); g.arc(w / 2, w / 2, R - 8 * u, 0, Math.PI * 2); g.stroke();
      } }],
    });
    ctx.sfx(i === 1 ? 'boom-slapback-01' : 'boom-distant-01', tBurst + 2 * F, { lu: i === 0 ? -12 : -16 });
    return [trail, ring];
  }).flat();

  // label for the charges (orange type, beside the strip)
  const lab = L.pick({
    landscape: { x: S.x + S.w + 26 * u, y: S.y + 150 * u, w: C.right.x + C.right.w - (S.x + S.w + 26 * u) },
    portrait: { x: S.x + S.w + 22 * u, y: S.y + 40 * u, w: C.left.x + C.left.w - (S.x + S.w + 22 * u) },
  });
  const fL2 = { family: FONT.cut, weight: 800, size: L.pick({ landscape: 50, portrait: 46 }) * u, track: 0 };
  const labLines = ['PRACTICE', 'DEPTH', 'CHARGES'];
  const chargeLab = printed(sheet.cam, sheet, {
    name: '2B Label practice depth charges', x: lab.x, y: lab.y, w: lab.w, h: 300 * u, seed: 79,
    layers: [{ ink: 'orange', at: tDrop + 4 * F, draw: g => {
      labLines.forEach((s, i) => text(g, s, 4 * u, 50 * u + i * 52 * u, fL2, 1));
      text(g, '= a signal:', 6 * u, 50 * u + 3 * 52 * u + 4 * u, { family: FONT.mono, weight: 500, size: 24 * u }, 1);
      text(g, '"come up."', 6 * u, 50 * u + 3 * 52 * u + 38 * u, { family: FONT.mono, weight: 500, size: 24 * u }, 1);
      text(g, '(diagram, not to scale)', 6 * u, 50 * u + 3 * 52 * u + 82 * u, { family: FONT.mono, weight: 500, size: 20 * u }, 0.8);
    } }],
  });

  // ---- the Moscow form (VO): typed head, empty ruled lines; orange strip on "silent"
  const Mo = L.pick({
    landscape: { x: C.right.x, y: S.y + S.h + 50 * u, w: C.right.w - 10 * u, h: 200 * u },
    portrait: { x: S.x + S.w + 22 * u, y: S.y + 345 * u, w: lab.w, h: 190 * u },
  });
  const fForm = { family: FONT.mono, size: L.pick({ landscape: 30, portrait: 26 }) * u, weight: 500, track: 1 * u };
  const formPath = pathFrom(tornPts(8 * u, 8 * u, Mo.w - 16 * u, Mo.h - 16 * u, 81, u, { amp: 5, torn: [0, 1, 0, 0] }));
  const stripTxt = L.pick({ landscape: 'NO ORDERS. FOR DAYS.', portrait: 'NOTHING.' });
  const fStrip = { family: FONT.mono, size: L.pick({ landscape: 34, portrait: 30 }) * u, weight: 500, track: 2 * u };
  const stripW = measure(stripTxt, fStrip).w + 44 * u;
  const form = printed(sheet.cam, sheet, {
    name: '2C Moscow form (left blank)', x: Mo.x, y: Mo.y, w: Mo.w, h: Mo.h, rot: L.pick({ landscape: -0.9, portrait: 1.2 }), seed: 83,
    layers: [
      { ink: 'teal', at: tMoscow, starve: 0.25, draw: g => {
        pasteShadow(g, formPath, u, 0.55);
        text(g, 'FROM MOSCOW:', 26 * u, 54 * u, fForm, 1);
        g.fillStyle = grey(0.7);
        g.fillRect(26 * u, 80 * u, Mo.w - 70 * u, 2.5 * u); g.fillRect(26 * u, 172 * u, Mo.w - 70 * u, 2.5 * u);
      } },
      { ink: 'orange', at: tSilent, draw: g => {
        g.fillStyle = grey(0.95); g.fill(pathFrom(cutPts(36 * u, 96 * u, stripW, 58 * u, 84, u, 0.6)));
        text(g, stripTxt, 58 * u, 138 * u, fStrip, 0);
      } },
    ],
  });

  const items = [ph, cap, sect, ...charges, chargeLab, form];
  const lands = items.flatMap(i => i.lands).filter(x => x < tDrop || x > tCharges);
  sheet.cam.style.transformOrigin = L.pick({ landscape: `${(Ph.x + Ph.w * 0.5).toFixed(1)}px ${(Ph.y + Ph.h * 0.45).toFixed(1)}px`, portrait: '50% 30%' });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -24, fade: 0.6 });

  return {
    update(t) {
      fur.update(t);
      items.forEach(i => i.update(t));
      // camera: a slow drift from the photo toward the section strip once the charges fall (connect)
      const s = 1.02 + 0.004 * t;
      const tx = glide(t, tDrop - 6 * F, tDays, 0, L.pick({ landscape: -14, portrait: 0 }) * u);
      const ty = glide(t, tDrop - 6 * F, tDays, 0, L.pick({ landscape: 0, portrait: -30 }) * u);
      sheet.cam.style.transform = `translate(${tx.toFixed(2)}px, ${(ty + jolt(t, lands, 1.6 * u)).toFixed(2)}px) scale(${s.toFixed(5)})`;
    },
  };
}
