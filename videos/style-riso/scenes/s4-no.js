// Spread 4 — PEAK + RESOLUTION: the blank third slip gets its name; a huge hand-cut "NO." is printed across the fold
// (teal drum, then the orange drum lands with the biggest registration snap of the film); "1962 — 40 years — 2002".
// intent: KNOW Arkhipov refused, and we learned it 40 years later · FEEL relief, then quiet · SEE the NO across the spread.
// truth: name slip = VO (our paste-up); NO = VO (cut letters); 2002 = the Havana conference where the story became
//        widely known (to re-check with 2+ sources before public use).
import { glide } from '/onclack-styles/engine/lib/anim.js';
import { F, FONT, wordT, spread, furniture, columns, printed, jolt, text, measure, pathFrom, cutPts, tornPts, pasteShadow, grey, cutWord, cutWordWidth, fillLetters, zineGeo } from '../shared/riso.js';

export default async function (root, ctx) {
  const L = ctx.layout, u = L.unit, P = L.portrait;
  const sheet = spread(root, ctx, { seed: 14 });
  const C = columns(L);
  const geo = zineGeo(L);
  const fur = furniture(sheet.cam, sheet, L, { page: 8 });

  const tVasili = wordT(ctx, 'Vasili', 0, 0.87) - 2 * F;
  const tArkh = wordT(ctx, 'Arkhipov', 0, 1.38) - 2 * F;
  const tSays = wordT(ctx, 'says', 0, 1.95) - 2 * F;
  const tNo = wordT(ctx, 'no', 0, 2.29) - 3 * F;
  const tForty = wordT(ctx, 'forty', 0, 4.39) - 2 * F;
  const tLater = wordT(ctx, 'later', 0, 4.99) - 2 * F;

  // ---- the third slip, carried over from spread 3 (already printed), now the name arrives
  const sw = L.pick({ landscape: 700, portrait: 820 }) * u, sh = 150 * u;
  const S3 = L.pick({ landscape: { x: C.left.x, y: C.top + 20 * u }, portrait: { x: C.left.x, y: C.top + 200 * u } });
  const slipPath = pathFrom(cutPts(10 * u, 10 * u, sw - 20 * u, sh - 20 * u, 112, u, 0.8));
  const fRole = { family: FONT.mono, size: 24 * u, weight: 500, track: 2 * u };
  const fName = { family: FONT.mono, size: L.pick({ landscape: 46, portrait: 46 }) * u, weight: 500, track: 1 * u };
  const nameStr = 'VASILI ARKHIPOV';
  const nm = measure(nameStr, fName);
  const slip = printed(sheet.cam, sheet, {
    name: '4A Slip 3 BRIGADE CHIEF OF STAFF', x: S3.x, y: S3.y, w: sw, h: sh, rot: -1.1, seed: 121,
    layers: [{ ink: 'teal', at: -1, starve: 0.25, draw: g => {
      pasteShadow(g, slipPath, u, 0.6);
      text(g, '3', 30 * u, sh * 0.5 + 26 * u, { family: FONT.cut, weight: 800, size: 74 * u }, 1);
      text(g, 'BRIGADE CHIEF OF STAFF', 104 * u, 50 * u, fRole, 0.9);
    } }],
  });
  const name = printed(sheet.cam, sheet, {
    name: '4A Name VASILI ARKHIPOV', x: S3.x + 96 * u, y: S3.y + 62 * u, w: nm.w + 40 * u, h: 66 * u, rot: -1.1, seed: 123,
    layers: [
      { ink: 'teal', at: tVasili, draw: g => text(g, nameStr, 14 * u, 48 * u, fName, 1) },
      { ink: 'orange', at: tArkh, gain: 0.55, starve: 0.4, draw: (g, w, h) => { g.fillStyle = grey(1); g.fill(pathFrom(cutPts(3 * u, 4 * u, w - 8 * u, h - 8 * u, 124, u, 0.5))); } },
    ],
  });

  // ---- NO. — hand-cut letters, across the fold on 16:9
  const word = 'NO.';
  const size = L.pick({ landscape: 380, portrait: 300 }) * u;
  const ww = cutWordWidth(word, size, 0.12);
  const NO = L.pick({
    landscape: { x: geo.fold - ww * 0.47, y: S3.y + sh + 70 * u },
    portrait: { x: C.left.x + (C.left.w - ww) / 2, y: S3.y + sh + 140 * u },
  });
  const pad = 30 * u;
  const cw = cutWord(word, pad, pad, size, 131, { gap: 0.12, rot: 3 });
  const noBox = { w: ww + 2 * pad + 20 * u, h: size * 1.2 + 2 * pad + 20 * u };
  const no = printed(sheet.cam, sheet, {
    name: '4B Hand-cut NO.', x: NO.x - pad, y: NO.y - pad, w: noBox.w, h: noBox.h, rot: -1.5, seed: 133,
    layers: [
      { ink: 'teal', at: tSays, dur: 7 * F, gain: 0.95, starve: 0.42, draw: g => fillLetters(g, cw.letters, 1, [6 * u, 7 * u]) },
      { ink: 'orange', at: tNo, dur: 5 * F, starve: 0.5, draw: g => fillLetters(g, cw.letters, 1) },
    ],
  });
  // the orange drum lands harder here: bigger kick
  no.layers[1].kick = [26 * u, -16 * u];

  // ---- 1962 — 40 years — 2002 (typed) + orange torn scrap under 2002
  const fYear = { family: FONT.cut, weight: 800, size: L.pick({ landscape: 64, portrait: 58 }) * u };
  const fSmall = { family: FONT.mono, weight: 500, size: L.pick({ landscape: 25, portrait: 24 }) * u };
  const Y = L.pick({
    landscape: { x: C.right.x + 40 * u, y: NO.y + size * 1.2 + 40 * u, w: C.right.w - 40 * u },
    portrait: { x: C.left.x, y: NO.y + size * 1.2 + 110 * u, w: C.left.w - 20 * u },
  });
  const y1962 = measure('1962', fYear).w, y2002 = measure('2002', fYear).w;
  const years = printed(sheet.cam, sheet, {
    name: '4C Years 1962 — 40 years — 2002', x: Y.x, y: Y.y, w: Y.w, h: 170 * u, seed: 141,
    layers: [
      { ink: 'teal', at: tForty, starve: 0.25, draw: (g, w) => {
        text(g, '1962', 10 * u, 74 * u, fYear, 1);
        text(g, '2002', w - 18 * u, 74 * u, fYear, 1, 'right');
        g.fillStyle = grey(1);
        const a = 10 * u + y1962 + 20 * u, b = w - 18 * u - y2002 - 22 * u;
        for (let x = a; x < b; x += 16 * u) g.fillRect(x, 50 * u, 9 * u, 4 * u);
        text(g, '40 YEARS', (a + b) / 2, 38 * u, { ...fSmall, size: 24 * u }, 1, 'center');
        text(g, 'told in public at a conference in Havana, 2002.', 10 * u, 128 * u, fSmall, 0.85);
      } },
      { ink: 'orange', at: tLater, gain: 0.6, starve: 0.45, draw: (g, w) => {
        g.fillStyle = grey(1); g.fill(pathFrom(tornPts(w - 18 * u - y2002 - 18 * u, 14 * u, y2002 + 30 * u, 80 * u, 142, u, { amp: 6 })));
      } },
    ],
  });

  const items = [slip, name, no, years];
  const lands = items.flatMap(i => i.lands).filter(x => x < tNo || x > tNo + 1);
  const noLand = tNo + 4 * F;
  ctx.sfx('drawer-close-01', noLand + 1 * F, { lu: -14 });
  sheet.cam.style.transformOrigin = L.pick({ landscape: `${geo.fold}px 52%`, portrait: '50% 45%' });

  return {
    update(t) {
      fur.update(t);
      items.forEach(i => i.update(t));
      // camera: creep; on the NO a small settle (the paper takes the drum), then a slow pull back to rest
      const s = 1.03 + 0.003 * t - glide(t, noLand + 0.5, ctx.duration, 0, 0.018);
      const jy = jolt(t, lands, 1.6 * u) + jolt(t, [noLand], 4 * u);
      sheet.cam.style.transform = `translate(0px, ${jy.toFixed(2)}px) scale(${s.toFixed(5)})`;
    },
  };
}
