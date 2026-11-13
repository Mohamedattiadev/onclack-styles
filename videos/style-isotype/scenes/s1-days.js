// Chart 1 — "27 October 1962 · one boat among four"
// intent: KNOW the date and that B-59 was one of four Soviet boats · FEEL the count closing in on one day and one boat
//         · SEE October counted day by day (27 ochre units), then four submarine units, one taken down "deep".
// truth: VO chart (our pictograms). Four Foxtrot boats (B-4, B-36, B-59, B-130) as usually counted; Oct 1 1962 = Monday.
import { el } from '/onclack-styles/engine/lib/anim.js';
import { PAL, FONT, F, sheet, pict, box, rowLabel, laid, counted, tw, outCubic, wordT, mix, spring, springs } from '../shared/iso.js';

export default function (root, ctx) {
  const L = ctx.layout, px = L.px, S = L.safe;
  const sh = sheet(root, ctx, {
    n: 1, title: 'One day, one boat', wipe: false,
    key: [{ kind: 'day', w: 26, color: PAL.ochre, label: '1 day' }, { kind: 'sub', w: 64, label: '1 submarine' }],
    note: 'Counts as usually given in histories of the crisis. ≈ = approximate.',
  });
  const C = sh.content, I = sh.ink, top = sh.bodyTop;

  // ---- voice
  const tSixty = wordT(ctx, 'sixty-two', 0, 2.11);
  const tSoviet = wordT(ctx, 'Soviet', 0, 3.29) - 2 * F;
  const tHides = wordT(ctx, 'hides', 0, 4.43) - 2 * F;
  const tDeep = wordT(ctx, 'deep', 0, 4.92) - 3 * F;
  const tCuba = wordT(ctx, 'Cuba', 0, 6.02) - 2 * F;

  // ---- sound: the card is laid, then the sea under the boat (J-cut before "submarine")
  ctx.sfx('page-turn-01', 0.05, { lu: -22 });
  ctx.ambience('sea-water-close-01', { from: tSoviet - 0.6, to: ctx.duration, lu: -17, fade: 1.2 });

  // ---- block A: October 1962 as a calendar of day units (Monday first; 1 Oct 1962 was a Monday)
  const A = L.pick({
    landscape: { x: S.x, y: top, cell: 82, gap: 10, labY: top },
    portrait: { x: S.x, y: top, cell: 92, gap: 10, labY: top },
  });
  const cell = px(A.cell), gap = px(A.gap);
  const lab = rowLabel(C, L, 'Days counted', A.x, A.labY, { caption: 'days of October 1962,<br>counted to the night of the story', size: 104, capSize: 25, inline: true });
  const calY = A.labY + px(L.pick({ landscape: 128, portrait: 130 }));
  const wd = box(C, 'Weekday row', A.x, calY, { display: 'flex', columnGap: gap + 'px', font: `600 ${px(19)}px ${FONT}`, color: PAL.text2, letterSpacing: '0.1em' });
  ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach(d => el('div', { style: { width: cell + 'px' } }, wd, d));
  const gridY = calY + px(34);
  const tiles = [];
  for (let d = 1; d <= 31; d++) {
    const col = (d - 1) % 7, row = Math.floor((d - 1) / 7);
    const x = A.x + col * (cell + gap), y = gridY + row * (cell + gap);
    const ghost = box(I, `Day ${d} slot`, x, y, { width: cell + 'px', height: cell + 'px' });
    pict(ghost, 'day', cell, { color: PAL.ghost, mode: 'ghost', name: `Day ${d} empty` });
    const hold = box(I, `Day ${d}`, x, y, { width: cell + 'px', height: cell + 'px' });
    const u = pict(hold, 'day', cell, { color: PAL.ochre, name: `Day ${d} unit` });
    const num = box(hold, `Day ${d} number`, px(9), px(6), { font: `600 ${px(d === 27 ? 30 : 18)}px ${FONT}`, color: PAL.board });
    num.textContent = d;
    const gnum = box(ghost, `Day ${d} number empty`, px(9), px(6), { font: `500 ${px(18)}px ${FONT}`, color: PAL.ghost }, String(d));
    tiles.push({ d, hold, u, num, gnum, at: 0.62 + (d - 1) * 0.074 });
  }
  const t27 = tiles[26];
  t27.at = Math.min(t27.at, tSixty - 3 * F);
  const calBottom = gridY + 5 * cell + 4 * gap;
  const satCap = box(C, 'Saturday caption', A.x, calBottom + px(18), { font: `500 ${px(25)}px ${FONT}`, color: PAL.ink, whiteSpace: 'nowrap' });
  satCap.innerHTML = '<b style="font-weight:800">Sat 27</b> &nbsp;— the story happens here';

  // ---- block B: four Soviet submarines; B-59 is taken one row down ("deep")
  const calW = 7 * cell + 6 * gap;
  const B = L.pick({
    landscape: { x: S.x + calW + px(120), y: top, w: S.x + S.w - (S.x + calW + px(120)), rowY: top + px(196) },
    portrait: { x: S.x, y: calBottom + px(84), w: S.w, rowY: calBottom + px(84) + px(150) },
  });
  const subLab = rowLabel(C, L, 'Boats counted', B.x, B.y, { caption: 'Soviet submarines sent<br>toward Cuba (≈, Foxtrot class)', size: 104, capSize: 25, inline: true });
  const sgap = px(L.pick({ landscape: 26, portrait: 22 }));
  const sw = (B.w - 3 * sgap) / 4;
  const names = ['B-4', 'B-36', 'B-59', 'B-130'];
  const subs = names.map((nm, i) => {
    const x = B.x + i * (sw + sgap);
    const ghost = box(I, `${nm} slot`, x, B.rowY, {});
    pict(ghost, 'sub', sw, { color: PAL.ghost, mode: 'ghost', name: `${nm} empty` });
    const hold = box(I, `Sub ${nm}`, x, B.rowY, {});
    const u = pict(hold, 'sub', sw, { color: PAL.ink, name: `Sub ${nm} unit` });
    const tag = box(C, `${nm} tag`, x, B.rowY + u.h + px(12), { font: `600 ${px(22)}px ${FONT}`, color: PAL.ink, letterSpacing: '0.04em' }, nm);
    return { nm, ghost, hold, u, tag, at: tSoviet + i * 0.16, x };
  });
  const subH = subs[0].u.h;
  const surfY = B.rowY + subH + px(54);
  const surf = box(C, 'Sea line', B.x, surfY, { width: B.w + 'px', height: Math.max(2, px(2)) + 'px', background: PAL.ghost, transformOrigin: '0 50%' });
  const deepDy = px(L.pick({ landscape: 150, portrait: 150 }));
  const b59 = subs[2];
  const deepCap = box(C, 'B-59 caption', B.x, B.rowY + deepDy + subH * 0.62, { font: `500 ${px(25)}px ${FONT}`, color: PAL.ink, whiteSpace: 'nowrap', transform: 'translateY(-50%)' });
  deepCap.innerHTML = '<b style="font-weight:800">B-59</b> · deep, near Cuba';
  const deepTag = box(C, 'Below the line', B.x, surfY + px(12), { font: `500 ${px(19)}px ${FONT}`, color: PAL.text2, whiteSpace: 'nowrap', letterSpacing: '0.12em' }, 'BELOW THE SURFACE');

  return {
    update(t) {
      sh.update(t);
      lab.wrap.style.opacity = tw(t, 0.35, 0.55, 0, 1);
      for (const k of tiles) {
        if (k.d > 27) { k.hold.style.opacity = 0; continue; } // the count stops at the night of the story
        const q = laid(t, k.at, px(16));
        k.hold.style.opacity = q.o;
        k.hold.style.transform = `translateX(${q.x.toFixed(2)}px)`;
        k.gnum.style.opacity = q.landed ? 0 : 1;
      }
      // after the count: day 27 takes the ink, the other days step back
      const pick27 = tw(t, tSixty + 4 * F, tSixty + 10 * F, 0, 1);
      for (const k of tiles) k.u.set(k.d === 27 ? mix(PAL.ochre, PAL.ink, pick27) : mix(PAL.ochre, '#E2C27E', pick27 * tw(t, tSoviet, tSoviet + 0.4, 0, 1)));
      lab.set(Math.min(27, counted(t, tiles.slice(0, 27).map(k => k.at))));
      satCap.style.opacity = tw(t, tSixty + 6 * F, tSixty + 12 * F, 0, 1);

      // boats
      subLab.wrap.style.opacity = tw(t, 0.7, 0.9, 0, 1);
      subLab.set(counted(t, subs.map(s => s.at)));
      const g = tw(t, 0.75, 1.0, 0, 1);
      surf.style.transform = `scaleX(${tw(t, tHides - 0.1, tHides + 0.35, 0, 1, outCubic).toFixed(4)})`;
      deepTag.style.opacity = tw(t, tHides + 0.2, tHides + 0.4, 0, 1);
      for (const s of subs) {
        s.ghost.style.opacity = g;
        const q = laid(t, s.at, px(30));
        let y = 0;
        if (s === b59) y = deepDy * spring(t - tDeep, springs.default);
        s.hold.style.opacity = q.o;
        s.hold.style.transform = `translate(${q.x.toFixed(2)}px, ${y.toFixed(2)}px)`;
        s.u.set(s === b59 ? PAL.ink : mix(PAL.ink, PAL.faded, tw(t, tHides, tHides + 0.3, 0, 1)));
        s.tag.style.opacity = s === b59 ? q.o * (1 - tw(t, tDeep, tDeep + 0.15, 0, 1)) : q.o;
      }
      deepCap.style.opacity = tw(t, tDeep + 0.25, tDeep + 0.45, 0, 1);
      deepCap.lastChild.textContent = t >= tCuba ? ' · deep, near Cuba' : ' · deep';
    },
  };
}
