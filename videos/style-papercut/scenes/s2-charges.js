// 2 · PRESSURE. KNOW: US ships drop practice depth charges above the sub; Moscow has been silent for days.
// FEEL: rising threat, isolation. SEE: the next sheet slides in over the last (sub already cut) → three ships are cut on the
// surface lace → a small disc is cut under each and FALLS out of the paper (the charge) → lace rosettes burst open around
// the hull, the sheet shivers → right panel: MOSCOW cut, radio rings only pencilled (never cut = no signal), SILENT cut.
// truth: RC (schematic; "practice" charges = signalling charges, approx. as usually reported).
import { makeStage, makeSheet, borderLace, waveRows, subPath, shipPath, wt, textW, P, PAL } from '../shared/lace.js';
import { glide, shake, spring } from '/onclack-styles/engine/lib/spring.js';
import { svg, clamp } from '/onclack-styles/engine/lib/anim.js';

export default async function (root, ctx) {
  const S = await makeStage(root, ctx, { seed: 23, lamp: [0.42, 0.62] });
  const { L, W, H, u } = S;
  const port = L.portrait;
  const box = L.pick({
    landscape: { x: W * 0.065, y: H * 0.07, w: W * 0.87, h: H * 0.86 },
    portrait: { x: W * 0.04, y: H * 0.085, w: W * 0.86, h: H * 0.715 },
  });
  const r = L.pick({ landscape: 19, portrait: 17 }) * u;
  const sh = makeSheet(S, { ...box, r, enterAt: 0, name: '2 · Lace sheet (slides in)' });
  const lace = borderLace(box.x, box.y, box.w, box.h, r, 23);
  sh.holes(lace.holes);
  const I = lace.inner;

  const T = {
    ships: wt(ctx, 'ships', 0, 1.42), amer: wt(ctx, 'American', 0, 0.86), drop: wt(ctx, 'drop', 0, 1.74), depth: wt(ctx, 'depth', 0, 2.58),
    charges: wt(ctx, 'charges', 0, 2.84), moscow: wt(ctx, 'Moscow', 0, 3.74), silent: wt(ctx, 'silent', 0, 4.72), days: wt(ctx, 'days', 0, 5.28),
  };

  // ---- sections
  const sea = L.pick({
    landscape: { x: I.x, y: I.y, w: I.w * 0.63, h: I.h },
    portrait: { x: I.x, y: I.y, w: I.w, h: I.h * 0.6 },
  });
  const pan = L.pick({
    landscape: { x: I.x + I.w * 0.69, y: I.y, w: I.w * 0.31, h: I.h },
    portrait: { x: I.x, y: I.y + I.h * 0.66, w: I.w, h: I.h * 0.34 },
  });
  // divider: a column (or row) of diamonds with pin-holes — pre-cut lace
  if (!port) { const dx = I.x + I.w * 0.66; for (let y = I.y + 20 * u; y < I.y + I.h - 10 * u; y += 34 * u) { sh.hole(P.diamond(dx, y, 6 * u, 12 * u)); sh.hole(P.circle(dx, y + 17 * u, 3 * u)); } }
  else { const dy = I.y + I.h * 0.63; for (let x = I.x + 16 * u; x < I.x + I.w - 10 * u; x += 34 * u) { sh.hole(P.diamond(x, dy, 12 * u, 6 * u)); sh.hole(P.circle(x + 17 * u, dy, 3 * u)); } }

  // ---- surface lace + the sub (already cut, carried over)
  const waveY = sea.y + sea.h * L.pick({ landscape: 0.3, portrait: 0.3 });
  const ww = L.pick({ landscape: 52, portrait: 50 }) * u;
  sh.holes(waveRows(sea.x + sea.w / 2, waveY, sea.w - 10 * u, 2, ww, 28 * u));
  const sub = L.pick({
    landscape: { x: sea.x + sea.w * 0.2, y: sea.y + sea.h * 0.8, len: sea.w * 0.55 },
    portrait: { x: sea.x + sea.w * 0.12, y: sea.y + sea.h * 0.82, len: sea.w * 0.7 },
  });
  sh.hole(subPath(sub.x, sub.y, sub.len));

  // ---- three ships cut on the surface (different sizes, one facing the other way)
  const wl = waveY - 9 * u;
  const ships = L.pick({
    landscape: [[0.05, 0.25, 0], [0.38, 0.21, 2], [0.69, 0.27, 1]],
    portrait: [[0.0, 0.27, 0], [0.37, 0.23, 2], [0.68, 0.28, 1]],
  }).map(([fx, fl, v], i) => ({ x: sea.x + sea.w * fx, len: sea.w * fl, v, flip: i === 1 }));
  const shipT = [[T.amer - 0.08, T.amer + 0.22], [T.amer + 0.28, T.ships + 0.02], [T.ships + 0.06, T.drop - 0.06]];
  ships.forEach((s, i) => sh.cut(shipPath(s.x, wl, s.len, s.v, s.flip), shipT[i][0], shipT[i][1], { name: `Ship ${i + 1} cut`, seed: 40 + i, pre: 0.25, kerf: 2.2 }));

  // ---- charges: a disc cut under each ship falls out of the sheet (fall slower, like it sinks)
  const chT = [T.drop, T.drop + 0.2, T.drop + 0.42];
  const chR = 11 * u;
  const order = [1, 0, 2];
  order.forEach((si, k) => {
    const s = ships[si], x = s.x + s.len * (0.3 + 0.2 * k), y = waveY + 64 * u + k * 10 * u;
    sh.cut(P.circle(x, y, chR), chT[k], chT[k] + 0.12, { pencil: false, seed: 60 + k, fallOpts: { grav: 900, spin: 0.2 }, name: `Charge ${k + 1}` });
  });

  // ---- bursts: lace rosettes open around the hull (not on it — they missed)
  const bursts = [
    { x: sub.x + sub.len * 0.08, y: sub.y - sub.len * 0.2, r: 44 * u, t: T.depth },
    { x: sub.x + sub.len * 0.98, y: sub.y - sub.len * 0.26, r: 54 * u, t: T.charges + 0.05 },
    { x: sub.x + sub.len * 0.5, y: sub.y - sub.len * 0.34, r: 64 * u, t: T.charges + 0.42 },
  ];
  const burstG = bursts.map((b, bi) => {
    const parts = [];
    const n = 14;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + bi; parts.push({ d: P.petal(b.x + Math.sin(a) * b.r * 0.2, b.y - Math.cos(a) * b.r * 0.2, b.r * (i % 2 ? 0.55 : 0.8), b.r * 0.09, a), k: 1 }); }
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; parts.push({ d: P.circle(b.x + Math.cos(a) * b.r * 1.12, b.y + Math.sin(a) * b.r * 1.12, b.r * 0.06), k: 2 }); }
    parts.push({ d: P.circle(b.x, b.y, b.r * 0.12), k: 0 });
    return parts.map(p => ({ node: sh.island(p.d), k: p.k, t: b.t }));
  }).flat();
  burstG.forEach(p => p.node.setAttribute('fill', '#000'));

  // ---- right panel: MOSCOW, pencilled rings (no signal), SILENT
  const pcx = pan.x + pan.w / 2;
  const mS = L.pick({ landscape: 78, portrait: 84 }) * u;
  const mY = L.pick({ landscape: pan.y + pan.h * 0.2, portrait: pan.y + pan.h * 0.3 });
  const mX = L.pick({ landscape: pcx - textW('MOSCOW', mS) / 2, portrait: pan.x + 10 * u });
  sh.cutText('MOSCOW', mX, mY, mS, T.moscow - 0.05, T.moscow + 0.48, { name: 'Cut text MOSCOW', sketchAt: 0.5 });
  const ring = L.pick({ landscape: { x: pcx, y: pan.y + pan.h * 0.52 }, portrait: { x: pan.x + pan.w * 0.78, y: pan.y + pan.h * 0.42 } });
  sh.cut(P.circle(ring.x, ring.y, 8 * u), T.moscow + 0.55, T.moscow + 0.7, { pencil: false, seed: 71, name: 'Transmitter hole' });
  [36, 66, 96, 126].forEach((rr, i) => {
    const R = rr * u * L.pick({ landscape: 1, portrait: 0.85 });
    sh.pencil(`M${ring.x - R * 0.87} ${ring.y - R * 0.5} A${R} ${R} 0 0 1 ${ring.x + R * 0.87} ${ring.y - R * 0.5}`, T.moscow + 0.8 + i * 0.12, T.moscow + 1.0 + i * 0.12, { dash: `${4 * u} ${6 * u}`, w: 2.2 });
  });
  const sS = L.pick({ landscape: 72, portrait: 84 }) * u;
  const sY = L.pick({ landscape: pan.y + pan.h * 0.8, portrait: pan.y + pan.h * 0.7 });
  const sX = L.pick({ landscape: pcx - textW('SILENT', sS) / 2, portrait: pan.x + 10 * u });
  sh.cutText('SILENT', sX, sY, sS, T.silent - 0.06, T.silent + 0.4, { name: 'Cut text SILENT', sketchAt: 0.7 });
  sh.pencilText('for days — no orders', L.pick({ landscape: pcx, portrait: sX + 6 * u }), sY + L.pick({ landscape: 50, portrait: 56 }) * u, L.pick({ landscape: 32, portrait: 36 }) * u, T.days - 0.05, { anchor: L.pick({ landscape: 'middle', portrait: 'start' }) });

  // ---- sound
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -23, fade: 0.6 });
  ctx.sfx('page-turn-01', 0.0, { lu: -15, duration: 0.7, fadeOut: 0.2 });          // the sheet slides in
  bursts.forEach((b, i) => ctx.sfx(i === 1 ? 'boom-slapback-01' : 'boom-distant-01', b.t + 0.02, { lu: i === 2 ? -6 : -8, duration: i === 1 ? 3 : null, fadeOut: 0.6 }));

  return {
    update(t) {
      let sx = 0, sy = 0;
      for (const b of bursts) { sx += shake(t, b.t, { amp: 3.2 * u, decay: 0.22 }); sy += shake(t, b.t + 1 / 60, { amp: 2.2 * u, decay: 0.2 }); }
      // camera: start a touch wide, settle in toward the hull as the charges fall
      const s = glide(t, 0.6, 3.6, 1.0, 1.04);
      S.setCam(s, L.pick({ landscape: W * 0.38, portrait: W * 0.5 }), L.pick({ landscape: H * 0.6, portrait: H * 0.4 }), sx, sy);
      S.update(t);
      for (const p of burstG) {
        const dt = t - p.t - p.k * 2 / 30;
        p.node.setAttribute('opacity', dt >= 0 ? 1 : 0);
      }
    },
  };
}
