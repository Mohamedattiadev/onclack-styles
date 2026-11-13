// 4 · NO — push in on the third officer; a cool field of pale dabs spreads out from him and covers the room,
// leaving the letters N O as bare linen; on "no" they are painted in dark ultramarine. Pull back: one man, one word.
// intent: KNOW the third, Vasili Arkhipov, said no; his name came out ~40 years later · FEEL relief, awe · SEE NO + lone figure
// truth: VO (the cool field is our sign for his refusal, not a depiction) · figure RC, no face.
import { painter, field, schedule, textMask, wordT, glideT, mix, prng, F } from '../shared/dots.js';
import { MIX } from '../shared/pictures.js';
import { roomGeometry, roomDabs, roomUnderdrawing } from '../shared/room.js';
import { frame, linenFor, caption, kickerStyle, capStyle, grade, INK, FONT } from '../shared/frame.js';

export default function (root, ctx) {
  const Fm = frame(ctx), { L, P, band, sp } = Fm;
  const W = L.width, H = L.height;
  const tThird = wordT(ctx, 'third', 0, 0.45), tVas = wordT(ctx, 'vasili', 0, 0.85), tSays = wordT(ctx, 'says', 0, 1.95), tNo = wordT(ctx, 'no', 0, 2.25);
  const tWorld = wordT(ctx, 'world', 0, 3.35), tForty = wordT(ctx, 'forty', 0, 4.35);

  const G = roomGeometry(Fm);
  // the room as scene 3 left it (already painted)
  const D = roomDabs(Fm, G, { bg: [-4, -3.5], torp: [-4, -3.5], figs: [-4, -3.4], yes: [-3.3, -3.2] });
  const f3 = G.figs[2];
  const [cx3, cy3] = f3.chest;

  // the other two officers get covered too (their feet sit in the ragged edge zone, so paint them over on purpose)
  const cover = G.figs.slice(0, 2).flatMap((f, i) => field({
    x: f.fx - f.H * 0.32, y: f.fy - f.H * 1.02, w: f.H * 0.64, h: f.H * 1.06, sp: sp * 0.7, rScale: 0.75, seed: 45 + i,
    colorAt: (x, y, r) => (f.inside(x, y) || f.inside(x, y - sp) || f.inside(x, y + sp) ? mix(MIX.calm, r) : -1), key: r => r, a: 0, b: 1,
  }).map(d => ({ ...d, t0: tThird + 0.05 + 1.35 * Math.pow(Math.hypot(d.x - cx3, d.y - cy3) / Math.hypot(P.w, P.h), 0.8) * 1.25 + 0.06 })));
  // the NO, reserved in the field, then painted
  const fs = L.pick({ landscape: P.h * 0.66, portrait: P.h * 0.36 });
  const nx = L.pick({ landscape: P.x + P.w * 0.33, portrait: P.x + P.w * 0.4 }), ny = L.pick({ landscape: P.y + P.h * 0.8, portrait: P.y + P.h * 0.4 });
  const M = textMask(W, H, g => { g.font = `800 ${fs}px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('NO', nx, ny); });

  const far = Math.hypot(P.w, P.h);
  const Rj = prng(77);
  const calm = field({
    x: P.x, y: P.y, w: P.w, h: P.h, sp: sp * 0.92, rScale: 0.7, edge: sp * 2.2, seed: 41,
    colorAt: (x, y, r) => (f3.inside(x, y) ? -1 : mix(M.near(x, y, sp * 0.4) ? [['white', 3], ['lemon', 1.2]] : MIX.calm, r)),
    key: r => r, a: 0, b: 1,
  }).map(d => ({ ...d, t0: tThird + 0.05 + 1.35 * Math.pow(Math.hypot(d.x - cx3, d.y - cy3) / far, 0.8) * 1.25 + Rj() * 0.08 }));
  const no = schedule(field({
    x: nx - fs, y: ny - fs, w: fs * 2, h: fs * 1.05, sp: sp * 0.55, rScale: 0.8, seed: 42,
    colorAt: (x, y, r) => (M.inside(x, y) ? mix(MIX.ink, r) : -1), key: (x, y, r) => (x - nx) / fs + r * 0.5, rot: () => 1.5, a: 0, b: 1,
  }), tSays - 0.12, tNo + 2 * F, 1.2);
  // the third officer, re-touched: his cool rim brightens as the field reaches him
  const rim = field({
    x: f3.fx - f3.H * 0.3, y: f3.fy - f3.H, w: f3.H * 0.6, h: f3.H * 1.02, sp: sp * 0.56, rScale: 0.72, seed: 43,
    colorAt: (x, y, r) => (f3.inside(x, y) && !f3.inside(x - sp * 0.9, y - sp * 0.3) ? mix([['white', 3], ['lemon', 1.5], ['cerulean', 1]], r) : -1),
    key: (x, y) => -y, a: tThird, b: tThird + 0.8, pow: 1,
  });

  const linen = linenFor(ctx, Fm, 404, roomUnderdrawing(G));
  const pt = painter(root, ctx, { linen, name: '4A Dot painting · the cool field + NO', clip: Fm.clip });
  pt.set([...D.bg, ...D.tp, ...D.fg, ...D.halos, ...calm, ...cover, ...rim, ...no]);

  const capW = L.pick({ landscape: band.w * 0.5, portrait: band.w });
  const k1 = caption(root, '4B Kicker', band.x, band.y, capW, 'Officer 3 · Chief of staff', kickerStyle(L, L.pick({ landscape: 26, portrait: 30 })), tVas - 2 * F);
  const c1 = caption(root, '4B Name', band.x, band.y + L.px(L.pick({ landscape: 38, portrait: 46 })), capW, 'Vasili Arkhipov', capStyle(L, L.pick({ landscape: 64, portrait: 68 })), tVas - 2 * F);
  const note = caption(root, '4C Later', L.pick({ landscape: band.x + band.w * 0.52, portrait: band.x }), L.pick({ landscape: band.y + L.px(10), portrait: band.y + L.px(128) }), L.pick({ landscape: band.w * 0.48, portrait: band.w }),
    'The world learned his name about forty years later, around 2002.', { ...capStyle(L, L.pick({ landscape: 34, portrait: 32 })), fontWeight: 400, color: INK.soft, lineHeight: 1.22 }, tWorld - 2 * F);
  const fade = grade(root, ctx);

  ctx.sfx('cloth-jacket-01', tSays - 0.25, { lu: -17 });
  ctx.ambience('sea-wash-calm-01', { from: tNo + 0.6, to: ctx.duration, lu: -17, fade: 1.2 });

  return {
    update(t) {
      fade(t);
      // push toward him while the field spreads, pull back as the word lands
      const pin = glideT(t, 0.2, 1.6, 0, 1), pout = glideT(t, tSays - 0.35, tNo + 0.15, 0, 1);
      const k = pin * (1 - pout);
      const zIn = L.pick({ landscape: 1.6, portrait: 1.45 });
      const z = (1 + (zIn - 1) * k) * (1 + Math.max(0, t - tNo - 0.6) * 0.006);
      pt.draw(t, { z, cx: W / 2 + (cx3 - W / 2) * k, cy: H / 2 + (cy3 - H / 2) * k });
      k1.update(t); c1.update(t); note.update(t);
    },
  };
}
