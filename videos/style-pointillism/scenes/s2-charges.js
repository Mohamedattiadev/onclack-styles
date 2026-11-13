// 2 · ABOVE — ships are painted into reserved (pencil-drawn) shapes; depth charges sink and bloom as pale dab rings.
// intent: KNOW US ships drop practice depth charges, Moscow silent · FEEL pressure from above · SEE pale blooms above the dark hull
// truth: RC (generic destroyer + sub silhouettes, charge count/positions are illustrative) · VO (bloom = our sign for a blast)
import { painter, field, wordT, prng, mix, CI, F, clamp01 } from '../shared/dots.js';
import { MIX, seaColor, submarine, destroyer } from '../shared/pictures.js';
import { frame, linenFor, caption, kickerStyle, capStyle, grade } from '../shared/frame.js';

export default function (root, ctx) {
  const Fm = frame(ctx), { L, P, band, sp } = Fm;
  const W = L.width, H = L.height;
  const tShips = wordT(ctx, 'ships', 0, 1.35), tAmer = wordT(ctx, 'american', 0, 0.5), tDrop = wordT(ctx, 'drop', 0, 1.65), tCharges = wordT(ctx, 'charges', 0, 2.75);
  const tMoscow = wordT(ctx, 'moscow', 0, 3.65), tSilent = wordT(ctx, 'silent', 0, 4.65);

  const surfV = L.pick({ landscape: 0.33, portrait: 0.28 });
  const surf = x => P.y + P.h * surfV + Math.sin(x / (P.w * 0.06) + 1.3) * L.px(3);
  const wy = P.y + P.h * surfV + L.px(4);
  const sub = L.pick({
    landscape: submarine(P.x + P.w * 0.6, P.y + P.h * 0.86, P.w * 0.3),
    portrait: submarine(P.x + P.w * 0.52, P.y + P.h * 0.87, P.w * 0.62),
  });
  const ships = L.pick({
    landscape: [destroyer(P.x + P.w * 0.07, wy, P.w * 0.25), destroyer(P.x + P.w * 0.43, wy, P.w * 0.21, true), destroyer(P.x + P.w * 0.73, wy, P.w * 0.19)],
    portrait: [destroyer(P.x + P.w * 0.03, wy, P.w * 0.5), destroyer(P.x + P.w * 0.6, wy, P.w * 0.36, true)],
  });
  const shipIn = (x, y) => ships.some(s => s.inside(x, y));
  const sea = seaColor({ P, surf, sp, sub, shipsInside: shipIn });

  const bg = field({ x: P.x, y: P.y, w: P.w, h: P.h, sp, edge: sp * 2.2, seed: 21, colorAt: sea, key: (x, y, r) => r, rot: (x, y) => (y < surf(x) ? -0.15 : 0.08 * Math.sin(x / 90)), a: -3, b: -2 });
  const subFine = field({ x: sub.x0 - sp, y: sub.cy - sub.hh * 1.4, w: sub.len + sp * 2, h: sub.hh * 2.2, sp: sp * 0.58, rScale: 0.7, seed: 22, colorAt: (x, y, r) => (sub.inside(x, y) ? sea(x, y, r) : -1), key: r => r, a: -3, b: -2 });
  const shipDabs = field({
    x: P.x, y: wy - P.w * 0.2, w: P.w, h: P.w * 0.2 + sp, sp: sp * 0.55, rScale: 0.72, seed: 23,
    colorAt: (x, y, r) => (shipIn(x, y) ? mix(MIX.ship, r) : -1), key: (x, y, r) => x / W + r * 0.15, rot: () => 0, a: tAmer - 2 * F, b: tShips + 0.3, pow: 1.4,
  });

  // depth charges: drop from a stern, sink, bloom
  const n = L.pick({ landscape: 3, portrait: 3 });
  const depth = sub.cy - L.pick({ landscape: P.h * 0.2, portrait: P.h * 0.17 });
  const charges = Array.from({ length: n }, (_, i) => {
    const s = ships[i % ships.length];
    const tD = tDrop + [0, 0.7, 1.45][i];
    const tB = i === 0 ? tCharges : tD + 1.1;
    const x = sub.x0 + sub.len * [0.32, 0.78, 0.55][i];
    return { x, tD, tB, y1: depth + L.px([0, 34, -26][i]) };
  });
  const Rb = L.pick({ landscape: P.h * 0.19, portrait: P.w * 0.2 });
  const blooms = charges.flatMap((c, i) => {
    const R = prng(300 + i);
    return field({
      x: c.x - Rb, y: c.y1 - Rb, w: Rb * 2, h: Rb * 2, sp: sp * 0.62, rScale: 0.72, seed: 31 + i,
      colorAt: (x, y, r) => { const d = Math.hypot(x - c.x, y - c.y1) / Rb; if (d > 1 || r2(r) < d * d * 0.7) return -1; return mix(d < 0.5 ? [['white', 3.4], ['lemon', 2.2], ['yellow', 0.5]] : [['cerulean', 3], ['white', 1.6], ['cobalt', 1]], r); },
      key: r => r, a: 0, b: 1,
    }).map(d => ({ ...d, t0: c.tB + 0.42 * Math.pow(Math.hypot(d.x - c.x, d.y - c.y1) / Rb, 0.85) + R() * 0.04 }));
  });

  const linen = linenFor(ctx, Fm, 202, g => { for (const s of ships) for (const poly of s.outline) { g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke(); } });
  const pt = painter(root, ctx, { linen, name: '2A Dot painting · ships + charges', clip: Fm.clip });
  pt.set([...bg, ...subFine, ...shipDabs, ...blooms]);

  const capW = L.pick({ landscape: band.w * 0.62, portrait: band.w });
  const k1 = caption(root, '2B Kicker', band.x, band.y, capW, 'Above · US Navy destroyers', kickerStyle(L, L.pick({ landscape: 26, portrait: 30 })), tShips - 2 * F);
  const capY = band.y + L.px(L.pick({ landscape: 38, portrait: 46 }));
  const c1 = caption(root, '2B Caption · charges', band.x, capY, capW, 'Practice depth charges', capStyle(L, L.pick({ landscape: 56, portrait: 62 })), tDrop - 2 * F, tMoscow - 0.3);
  const c2 = caption(root, '2C Caption · Moscow', band.x, capY, capW, 'Moscow: silent for days', capStyle(L, L.pick({ landscape: 56, portrait: 62 })), tMoscow - 2 * F);
  const fade = grade(root, ctx);

  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -15, fade: 0.6 });
  charges.forEach((c, i) => ctx.sfx('boom-distant-01', c.tB, { lu: [-6, -9, -8][i] }));

  const can = [CI.dultra, CI.dviolet, CI.ultra];
  return {
    update(t) {
      fade(t);
      let sx = 0, sy = 0;
      for (const c of charges) { const dt = t - c.tB; if (dt > 0 && dt < 1.2) { const a = L.px(5) * Math.exp(-dt / 0.28); const fr = Math.floor(t * 30); sx += a * (prng(fr * 7 + 1)() - 0.5) * 2; sy += a * (prng(fr * 7 + 2)() - 0.5) * 2; } }
      pt.draw(t, { z: 1, cx: W / 2 + sx, cy: H / 2 + sy }, () => {
        for (const [i, c] of charges.entries()) {
          if (t < c.tD || t >= c.tB) continue;
          const p = clamp01((t - c.tD) / (c.tB - c.tD));
          const y = wy + (c.y1 - wy) * (p * p * 0.35 + p * 0.65), x = c.x + Math.sin(p * 5 + i) * L.px(4);
          for (let k = 4; k >= 1; k--) pt.dab({ x: x + Math.sin(p * 9 + k) * L.px(3), y: y - k * sp * 0.75, r: sp * 0.28, rot: 0, ci: k % 2 ? CI.white : CI.cerulean, v: k % 4 }, 1, 0.65 - k * 0.12);
          for (let k = 0; k < 3; k++) pt.dab({ x: x + (k - 1) * sp * 0.32, y: y + (k % 2) * sp * 0.2, r: sp * 0.42, rot: 1.57, ci: can[k], v: k }, 1, 1);
        }
      });
      k1.update(t); c1.update(t); c2.update(t);
    },
  };
}
const r2 = r => (r * 7.137) % 1;
