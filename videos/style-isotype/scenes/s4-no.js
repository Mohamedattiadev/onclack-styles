// Chart 4 — "The third vote"
// intent: KNOW Arkhipov said no, so the rule failed and the torpedo was not fired; his name became known ≈ 40 years
//         later · FEEL the room go quiet, then the weight of one refusal · SEE the only red unit in the film fill the
//         last slot, then 40 ochre year units counted from 1962 to 2002.
// truth: VO chart. "≈ 40 years": his role became widely known after the Oct 2002 Havana conference (re-check).
import { PAL, FONT, F, sheet, pict, box, rowLabel, laid, counted, tw, outCubic, wordT, mix, spring, springs } from '../shared/iso.js';
import { buildOfficers } from '../shared/officers.js';

export default function (root, ctx) {
  const L = ctx.layout, px = L.px, S = L.safe;
  const sh = sheet(root, ctx, {
    n: 4, title: 'The third vote',
    key: [{ kind: 'vote', w: 22, color: PAL.red, label: '1 refusal' }, { kind: 'year', w: 22, color: PAL.ochre, label: '1 year' }],
    note: null,
  });
  const C = sh.content, I = sh.ink, top = sh.bodyTop;

  const tThird = wordT(ctx, 'third', 0, 0.51) - 3 * F;
  const tVas = wordT(ctx, 'Vasili', 0, 0.87) - 2 * F;
  const tNo = wordT(ctx, 'no', 0, 2.29) - 3 * F;
  const tWorld = wordT(ctx, 'world', 0, 3.33) - 3 * F;
  const tLater = wordT(ctx, 'later', 0, 4.99) - 2 * F;

  // sound: the sea bed is gone (the drop) — room tone, one held breath, then one heavy wooden unit set down
  ctx.sfx('page-turn-01', 0.03, { lu: -24 });
  ctx.sfx('breath-close-01', tVas + 0.55, { lu: -22 });
  ctx.sfx('drawer-close-01', tNo + 3 * F, { lu: -6 });
  ctx.ambience('roomtone-library-01', { from: tNo + 0.6, to: ctx.duration, lu: -24, fade: 1.2 });

  // ---- recap of the vote (smaller), then the refusal
  const V = L.pick({
    landscape: { x: S.x, w: px(700), figY: top + px(6), figH: px(300), slot: px(84) },
    portrait: { x: S.x, w: S.w, figY: top + px(6), figH: px(236), slot: px(78) },
  });
  const centers = [1, 3, 5].map(k => V.x + V.w * k / 6);
  const offs = buildOfficers(C, I, L, { centers, y: V.figY, h: V.figH, slot: V.slot, nameSize: 22, roles: false, gap: 10 });
  const ark = offs[2];
  const sy = ark.slotY;
  ark.nameEl.firstChild.textContent = 'Arkhipov';

  // the NO — the one red thing in the whole film
  const N = L.pick({
    landscape: { x: S.x + px(820), y: top - px(34), size: px(330), resY: top + px(300) },
    portrait: { x: S.x, y: sy + V.slot + px(14), size: px(272), resY: sy + V.slot + px(262) },
  });
  const no = box(C, 'NO type', N.x, N.y, { font: `800 ${N.size}px ${FONT}`, color: PAL.red, lineHeight: 0.86, letterSpacing: '-0.04em', whiteSpace: 'nowrap', transformOrigin: '0% 80%' }, 'NO');
  const res = box(C, 'Result line', N.x + px(10), N.resY, { font: `500 ${px(27)}px ${FONT}`, color: PAL.ink, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', columnGap: px(14) + 'px' });
  const resT = box(res, 'Result text', 0, 0, { position: 'relative' });
  resT.innerHTML = '<b style="font-weight:800">2 of 3</b> · 3 needed · the torpedo';
  const tp = box(res, 'Result torpedo', 0, 0, { position: 'relative', width: px(110) + 'px', height: px(110 / 6) + 'px' });
  const tpU = pict(tp, 'torpedo', px(110), { color: PAL.ochre, name: 'Unfired torpedo' });
  const resT2 = box(res, 'Result text 2', 0, 0, { position: 'relative', fontWeight: 800 }, 'was not fired');

  // ---- forty years, counted
  const Y = L.pick({
    landscape: { x: S.x, y: top + px(470), cols: 20, tile: px(62), gap: px(10), gridY: top + px(586) },
    portrait: { x: S.x, y: N.resY + px(62), cols: 10, tile: px(62), gap: px(10), gridY: N.resY + px(66) + px(124) },
  });
  const yLab = rowLabel(C, L, 'Years counted', Y.x, Y.y, { caption: 'years before the world knew<br>his name (≈; after Havana, Oct 2002)', prefix: '', size: 96, capSize: 24, inline: true });
  const years = [];
  for (let i = 0; i < 40; i++) {
    const col = i % Y.cols, row = Math.floor(i / Y.cols);
    const x = Y.x + col * (Y.tile + Y.gap), y = Y.gridY + row * (Y.tile + Y.gap);
    const gh = box(I, `Year ${i + 1} slot`, x, y, {});
    pict(gh, 'year', Y.tile, { color: PAL.ghost, mode: 'ghost', name: `Year ${1963 + i} empty` });
    const hold = box(I, `Year ${1963 + i}`, x, y, {});
    pict(hold, 'year', Y.tile, { color: PAL.ochre, name: 'Year unit' });
    years.push({ gh, hold, at: tWorld + 0.12 + i * ((tLater - tWorld - 0.12) / 39) });
  }
  const gridR = Y.x + Y.cols * (Y.tile + Y.gap) - Y.gap;
  const gridB = Y.gridY + Math.ceil(40 / Y.cols) * (Y.tile + Y.gap) - Y.gap;
  const yA = box(C, 'Year 1962', Y.x, L.portrait ? Y.gridY - px(34) : gridB + px(12), { font: `700 ${px(24)}px ${FONT}`, color: PAL.text2 }, '1962 →');
  const yB = box(C, 'Year 2002', gridR + px(22), gridB, { font: `800 ${px(L.pick({ landscape: 64, portrait: 40 }))}px ${FONT}`, color: PAL.ink, transform: 'translateY(-100%)', lineHeight: 0.9, fontVariantNumeric: 'tabular-nums' }, '2002');

  return {
    update(t) {
      sh.update(t);
      // the recap is already there when the card arrives (continuity with chart 3)
      const third = tw(t, tThird, tThird + 0.3, 0, 1);
      for (const o of offs) {
        o.fig.set(o === ark ? PAL.ink : mix(PAL.ink, PAL.faded, third));
        o.nameEl.style.color = o === ark ? PAL.ink : mix(PAL.ink, PAL.faded, third);
        o.slotGhost.style.opacity = 1;
        if (o !== ark) { o.slotHold.style.opacity = 1; o.vote.set(mix(PAL.ink, PAL.faded, third)); continue; }
        const v = laid(t, tNo, px(26));
        o.slotHold.style.opacity = v.o;
        o.slotHold.style.transform = `translateX(${v.x.toFixed(2)}px)`;
        o.vote.set(PAL.red);
      }
      ark.nameEl.firstChild.textContent = t >= tVas ? 'Vasili Arkhipov' : 'Arkhipov';
      // NO: laid in like every other unit — only bigger in type, never a bigger symbol
      const s = spring(t - tNo, springs.snappy);
      no.style.opacity = tw(t, tNo, tNo + 2 * F, 0, 1);
      no.style.transform = `translateX(${(-px(60) * (1 - s)).toFixed(2)}px)`;
      res.style.opacity = tw(t, tNo + 0.45, tNo + 0.65, 0, 1);
      tpU.set(mix(PAL.ochre, PAL.faded, tw(t, tNo + 0.8, tNo + 1.1, 0, 1)));

      yLab.wrap.style.opacity = tw(t, tWorld - 0.25, tWorld - 0.05, 0, 1);
      yLab.set(counted(t, years.map(y => y.at)));
      yA.style.opacity = tw(t, tWorld - 0.1, tWorld + 0.1, 0, 1);
      for (const y of years) {
        y.gh.style.opacity = tw(t, 0.5, 0.8, 0, 1);
        const q = laid(t, y.at, px(14));
        y.hold.style.opacity = q.o;
        y.hold.style.transform = `translateX(${q.x.toFixed(2)}px)`;
      }
      yB.style.opacity = tw(t, tLater, tLater + 3 * F, 0, 1);
    },
  };
}
