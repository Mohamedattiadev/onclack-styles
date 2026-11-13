// 1 · DEEP — macro on wet dabs, pull out: the dabs become a submarine in the deep sea.
// intent: KNOW date + a Soviet submarine hides near Cuba · FEEL quiet unease · SEE dark hull resolving out of blue dabs
// truth: RC (our simplified diesel-sub silhouette, not a record) · date = text
import { painter, field, schedule, textMask, wordT, glideT, prng, mix, F } from '../shared/dots.js';
import { MIX, seaColor, submarine } from '../shared/pictures.js';
import { frame, linenFor, caption, kickerStyle, capStyle, grade, FONT } from '../shared/frame.js';

export default function (root, ctx) {
  const Fm = frame(ctx), { L, P, band, foot, sp } = Fm;
  const W = L.width, H = L.height;
  const tOct = wordT(ctx, 'october', 0, 0.6), tSov = wordT(ctx, 'soviet', 0, 3.8), tDeep = wordT(ctx, 'deep', 0, 5.4), tCuba = wordT(ctx, 'cuba', 0, 6.5);

  const surfV = L.pick({ landscape: 0.22, portrait: 0.24 });
  const surf = x => P.y + P.h * surfV + Math.sin(x / (P.w * 0.07)) * L.px(3);
  const sub = L.pick({
    landscape: submarine(P.x + P.w * 0.6, P.y + P.h * 0.7, P.w * 0.46),
    portrait: submarine(P.x + P.w * 0.5, P.y + P.h * 0.7, P.w * 0.86),
  });

  // date, painted in small dark dabs into a reserved strip of the sky
  const fs = L.px(L.pick({ landscape: 128, portrait: 120 }));
  const dateX = L.pick({ landscape: P.x + L.px(40), portrait: P.x + P.w / 2 }), dateY = surf(0) - L.px(L.pick({ landscape: 34, portrait: 46 }));
  const M = textMask(W, H, g => { g.font = `800 ${fs}px ${FONT.sans}`; g.textAlign = L.landscape ? 'left' : 'center'; g.fillText('27 OCT 1962', dateX, dateY); });
  const tsp = L.px(6.6);

  const [scx, scy] = sub.sail;
  const diag = Math.hypot(P.w, P.h);
  const sea = seaColor({ P, surf, sp, sub });
  const bg = field({
    x: P.x, y: P.y, w: P.w, h: P.h, sp, edge: sp * 2.2, seed: 11,
    colorAt: (x, y, r) => (M.near(x, y, tsp * 2.4) ? -1 : sea(x, y, r)),
    key: (x, y, r) => Math.hypot(x - scx, (y - scy) * 1.3) / diag + r * 0.08,
    rot: (x, y) => (y < surf(x) ? -0.15 : 0.08 * Math.sin(x / 90)),
    a: 0.12, b: 3.0, pow: 2,
  });
  // the hero gets finer dabs (painted after the ground, so they sit on top)
  const fine = field({
    x: sub.x0 - sp, y: sub.cy - sub.hh * 1.4, w: sub.len + sp * 2, h: sub.hh * 2.2, sp: sp * 0.58, rScale: 0.7, seed: 13,
    colorAt: (x, y, r) => (sub.inside(x, y) ? sea(x, y, r) : -1),
    key: (x, y, r) => Math.hypot(x - scx, y - scy) + r * sp * 3, rot: () => 0.05, a: 0.2, b: 2.2, pow: 2.2,
  });
  const text = schedule(field({
    x: dateX - (L.portrait ? P.w / 2 : 0), y: dateY - fs, w: L.portrait ? P.w : P.w * 0.7, h: fs * 1.1, sp: tsp, rScale: 0.7, seed: 12,
    colorAt: (x, y, r) => (M.inside(x, y) ? mix(MIX.ink, r) : -1), key: x => x, a: 0, b: 1,
  }), tOct + 0.4, Math.max(tOct + 1.8, 2.9), 1.3);

  const linen = linenFor(ctx, Fm, 101, g => { for (const poly of sub.outline) { g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke(); } });
  const pt = painter(root, ctx, { linen, name: '1A Dot painting · sea + submarine', clip: Fm.clip });
  pt.set([...bg, ...fine, ...text]);

  // margin type
  const capW = L.pick({ landscape: band.w * 0.6, portrait: band.w });
  const k1 = caption(root, '1B Kicker', band.x, band.y, capW, 'Cuban Missile Crisis · Submarine B-59', kickerStyle(L, L.pick({ landscape: 26, portrait: 30 })), tOct + 0.2);
  const c1 = caption(root, '1B Caption', band.x, band.y + L.px(L.pick({ landscape: 38, portrait: 46 })), capW, 'Hiding deep, near Cuba', capStyle(L, L.pick({ landscape: 56, portrait: 62 })), tSov - 2 * F);
  const note = caption(root, '1C Pencil note', L.pick({ landscape: band.x + band.w * 0.62, portrait: band.x }), L.pick({ landscape: band.y + L.px(6), portrait: foot.y }), L.pick({ landscape: band.w * 0.38, portrait: band.w }),
    'Reconstruction · silhouette simplified', { fontSize: L.px(L.pick({ landscape: 24, portrait: 26 })) + 'px', fontWeight: 400, color: '#5E5A55', textAlign: L.pick({ landscape: 'right', portrait: 'left' }), letterSpacing: '0.02em' }, tCuba);
  grade(root, ctx);

  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -15, fade: 0.6 });

  const z0 = L.pick({ landscape: 3.6, portrait: 3.0 });
  return {
    update(t) {
      const p = glideT(t, 0.25, 3.3, 0, 1);
      const z = z0 + (1 - z0) * p;
      // creep after the reveal (very slow push, keeps the frame alive)
      const zz = z * (1 + Math.max(0, t - 3.3) * 0.006);
      pt.draw(t, { z: zz, cx: scx + (W / 2 - scx) * p, cy: scy + (H / 2 - scy) * p });
      k1.update(t); c1.update(t); note.update(t);
    },
  };
}
