// Sheet A4 — THE NAME + "NO": the signature press, then a newspaper correction that arrived 40 years late.
// intent: KNOW Arkhipov said no; his name became public only in 2002 · FEEL awe/relief · SEE a huge red NO resolving
//         from coarse dots to solid ink
// truth: name card only (no photo, no face); "NO." = VO (our type); 1962 → 2002 = his role became widely known after the
//        Oct. 2002 Havana conference (re-check with 2+ sources before public use).
import { el } from '/onclack-styles/engine/lib/anim.js';
import { INK, FONT, MISREG, F, ez, tw, wordT, grid, sheet, box, plate, press, applyPress, headStyle, labelStyle, captionStyle, inkDefs } from '../shared/press.js';

export default function (root, ctx) {
  const L = ctx.layout, G = grid(L);
  const S = sheet(root, ctx, { page: 4, folioRight: 'A4 · Late edition', slideIn: true });
  const C = S.content;
  const fx = inkDefs(root, 's4');

  // ---- voice times (local)
  const tThird = wordT(ctx, 'third', 0, 0.51) - 2 * F;
  const tVas = wordT(ctx, 'Vasili', 0, 0.87) - 2 * F;
  const tArk = wordT(ctx, 'Arkhipov', 0, 1.38) - 2 * F;
  const tNo = wordT(ctx, 'no', 0, 2.29) - 2 * F;
  const tWorld = wordT(ctx, 'world', 0, 3.33) - 2 * F;
  const tForty = wordT(ctx, 'forty', 0, 4.39) - 2 * F;
  const tYears = wordT(ctx, 'years', 0, 4.72) - 2 * F;
  const tLater = wordT(ctx, 'later', 0, 4.99) - 2 * F;
  ctx.sfx('drawer-close-01', tNo + 2 * F, { volume: 0.5 }); // one wooden thump under the press (natural, no tone)

  const top = S.top + L.px(26);

  // ---- name card (no face)
  const kick = box(C, '4A Kicker', L.safe.x, top, G.w(L.pick({ landscape: 6, portrait: 4 })), null, labelStyle(L.px(26), { fontWeight: 800 }), 'The third officer');
  const nSize = L.px(L.pick({ landscape: 232, portrait: 200 }));
  const name = box(C, '4A Name', L.safe.x, top + L.px(46), L.pick({ landscape: G.w(7), portrait: L.safe.w }), null, { ...headStyle(nSize), display: 'flex', flexDirection: 'column', rowGap: L.px(18) + 'px', filter: fx.ink });
  const nw = [['Vasili', tVas], ['Arkhipov', tArk]].map(([w, at]) => ({ node: el('span', { 'data-name': `Name word ${w}`, style: { display: 'block', alignSelf: 'flex-start' } }, name, w), at }));
  const nameH = name.getBoundingClientRect().height;
  const rankY = top + L.px(46) + nameH + L.px(22);
  const rank = box(C, '4A Rank', L.safe.x, rankY, L.pick({ landscape: G.w(7), portrait: L.safe.w }), null,
    captionStyle(L.px(L.pick({ landscape: 40, portrait: 40 })), { fontStyle: 'italic', whiteSpace: 'nowrap' }), 'Flotilla chief of staff, aboard B-59');

  // ---- the NO plate (spot ink, 15°, constant misregistration) — the signature press
  const N = L.pick({
    // 16:9: the NO stands on the same baseline as the year 2002 (bottom-right), negative space above it
    landscape: { x: G.x(6) + L.px(56), y: top, w: L.safe.x + L.safe.w - G.x(6) - L.px(56), h: L.safe.y + L.safe.h - L.px(180) + L.px(124) - top },
    portrait: { x: L.safe.x - L.px(16), y: rankY + L.px(96), w: L.safe.w + L.px(32), h: L.px(440) },
  });
  const noBox = box(C, '4B NO plate', N.x, N.y, N.w, N.h, { mixBlendMode: 'multiply' });
  const noPlate = plate(noBox, N.w, N.h, (g, w, h) => {
    g.fillStyle = '#000';
    g.textBaseline = 'alphabetic';
    let fs = h * 1.25;
    g.font = `800 ${fs}px 'Sofia Sans Extra Condensed'`;
    let m = g.measureText('NO.');
    fs *= Math.min((w - L.px(L.pick({ landscape: 24, portrait: 48 }))) / m.width, (h - L.px(L.pick({ landscape: 60, portrait: 70 }))) / (m.actualBoundingBoxAscent || fs * 0.7));
    g.font = `800 ${fs}px 'Sofia Sans Extra Condensed'`;
    m = g.measureText('NO.');
    const asc = m.actualBoundingBoxAscent;
    g.fillText('NO.', L.pick({ landscape: w - m.width - L.px(24), portrait: (w - m.width) / 2 }), L.pick({ landscape: h - L.px(48), portrait: (h + asc) / 2 }));
  }, { name: 'NO halftone (spot)', style: { left: 0, top: 0 } });

  // ---- the correction: 1962 ──── 40 years ──── 2002
  const K = L.pick({
    landscape: { x: L.safe.x, y: L.safe.y + L.safe.h - L.px(250), w: G.w(6) },
    portrait: { x: L.safe.x, y: N.y + N.h + L.px(36), w: L.safe.w },
  });
  const kRule = box(C, '4C Correction rule', K.x, K.y, K.w, L.px(6), { background: INK.black, transformOrigin: '0 50%' });
  const kHead = box(C, '4C Correction head', K.x, K.y + L.px(18), K.w, null, { ...labelStyle(L.px(26), { fontWeight: 800 }), display: 'flex', justifyContent: 'space-between' });
  el('span', {}, kHead, 'Correction');
  el('span', { style: { fontWeight: 600 } }, kHead, 'Havana, Oct.\u00a02002');
  const ySize = L.px(L.pick({ landscape: 112, portrait: 104 }));
  const yRowY = K.y + L.px(70);
  const yStyle = { ...headStyle(ySize), fontVariantNumeric: 'tabular-nums lining-nums', lineHeight: 0.8 };
  const y62 = box(C, '4C Year 1962', K.x, yRowY, null, null, yStyle, '1962');
  const y02 = box(C, '4C Year 2002', K.x, yRowY, K.w, null, { ...yStyle, textAlign: 'right' }, '2002');
  const yW = y62.getBoundingClientRect().width;
  const barX = K.x + yW + L.px(24), barW = K.w - 2 * yW - L.px(48), barY = yRowY + ySize * 0.36;
  const bar = box(C, '4C 40-year bar', barX, barY, barW, L.px(8), { background: INK.black, transformOrigin: '0 50%' });
  const tick = (x, n) => box(C, n, x, barY - L.px(12), Math.max(2, L.px(3)), L.px(32), { background: INK.black });
  const t0 = tick(barX, 'Bar tick 1962'), t1 = tick(barX + barW - L.px(3), 'Bar tick 2002');
  const forty = box(C, '4C 40 years', barX, barY - L.px(56), barW, null, { ...labelStyle(L.px(30), { fontWeight: 800 }), textAlign: 'center' }, '40 years');
  const kBody = box(C, '4C Correction body', K.x, yRowY + ySize * 0.8 + L.px(18), K.w, null, captionStyle(L.px(L.pick({ landscape: 32, portrait: 32 })), { fontStyle: 'italic', whiteSpace: 'nowrap' }), 'His name reached the world four decades late.');

  return {
    update(t) {
      // the NO hit is the biggest bounce of the piece (the peak)
      S.update(t, [...nw.map(w => [w.at, 0.8]), [tNo, 1.8], [tLater, 0.5]], L.px(3));

      kick.style.opacity = tw(t, tThird - 4 * F, tThird + 4 * F, 0, 1);
      for (const w of nw) applyPress(w.node, press(t, w.at, { lift: L.pick({ landscape: 0.07, portrait: 0.035 }) }), '0% 100%');
      rank.style.opacity = tw(t, tArk + 8 * F, tArk + 14 * F, 0, 1);
      rank.style.transform = `translateY(${tw(t, tArk + 8 * F, tArk + 20 * F, L.px(10), 0).toFixed(2)}px)`;

      // signature: 4-frame fall, squash, bounce — and the dots resolve coarse → fine in 14 f
      applyPress(noBox, press(t, tNo, { lift: 0.06, squash: 0.014 }), '50% 100%');
      const cell = +L.px(tw(t, tNo, tNo + 14 * F, 46, 6, ez.enter)).toFixed(2);
      noPlate.draw({ v: 1 }, [{ cell, angle: 15, color: INK.spot, ox: L.px(MISREG[0]), oy: L.px(MISREG[1]), gain: 1.1 }]);

      // correction: rule runs on "world", head pressed; years + 40-year bar on "forty years later"
      kRule.style.transform = `scaleX(${tw(t, tWorld - 4 * F, tWorld + 8 * F, 0, 1, ez.enter)})`;
      kHead.style.opacity = tw(t, tWorld + 2 * F, tWorld + 8 * F, 0, 1);
      applyPress(y62, press(t, tWorld + 6 * F, { lift: 0.04 }), '0 100%');
      t0.style.opacity = tw(t, tForty - 2 * F, tForty, 0, 1);
      bar.style.transform = `scaleX(${tw(t, tForty, tLater, 0, 1, ez.move).toFixed(4)})`;
      forty.style.opacity = tw(t, tYears - 2 * F, tYears + 4 * F, 0, 1);
      t1.style.opacity = t >= tLater ? 1 : 0;
      applyPress(y02, press(t, tLater), '100% 100%');
      kBody.style.opacity = tw(t, tLater + 10 * F, tLater + 18 * F, 0, 1);
    },
  };
}
