// Plate 4 — SCREENPRINT POSTER: the third officer is finally "printed" — in our vermillion — with a squeegee-pulled NO.
// intent: KNOW Vasili Arkhipov said no; his name became known ~40 years later · FEEL awe, then relief · SEE the unprinted
//         figure and a huge NO pulled in one stroke of ink
// truth: officer = era pictogram, no face (VO); name card only; "NO" = our type (VO); 2002 = Havana conference, when his
//        role became widely known (re-check with 2+ sources before public use).
import { el, svg, rand } from '/onclack-styles/engine/lib/anim.js';
import { INK, FONT, MISREG, F, ez, tw, wordT, box, eraCaps, mono, frame, inkDefs, plateSvg, squeegee } from '../shared/lens.js';
import { rowPos, officer } from '../shared/figures.js';

export default function (root, ctx) {
  const L = ctx.layout, u = L.unit;
  const FR = frame(root, ctx, { scene: 4, lens: 'poster', fig: 4, caption: 'Arkhipov’s part became widely known only in 2002, at a conference in Havana.' });
  const { plate, P } = FR;
  const ink = inkDefs(root, 's4', u);

  const tThird = wordT(ctx, 3, 'third', 0, 0.51) - 2 * F;
  const tVas = wordT(ctx, 3, 'Vasili', 0, 0.87) - 2 * F;
  const tNo = wordT(ctx, 3, 'no', 0, 2.29) - 2 * F;
  const tWorld = wordT(ctx, 3, 'world', 0, 3.33) - 2 * F;
  const tForty = wordT(ctx, 3, 'forty', 0, 4.39) - 2 * F;
  const tLater = wordT(ctx, 3, 'later', 0, 4.99) - 2 * F;
  ctx.sfx('drawer-close-01', tNo + 6 * F, { lu: -17 }); // one soft wooden knock as the squeegee stops (natural, no tone)
  ctx.ambience('sea-water-close-01', { from: 0, to: 0.9, lu: -28, fade: 0.6 });

  const W = P.w, H = P.h;
  const R = rowPos(L, P);
  // end layout
  const E = L.pick({
    landscape: { yes: [[W * 0.05, H * 0.6, H * 0.3], [W * 0.13, H * 0.6, H * 0.3]], hero: [W * 0.3, H * 0.965, H * 0.86],
      no: { x: W * 0.43, y: H * -0.04, size: H * 0.86 }, name: { x: W * 0.445, y: H * 0.725 }, years: { x: W * 0.445, y: H * 0.88, w: W * 0.5 } },
    portrait: { yes: [[W * 0.07, H * 0.235, H * 0.16], [W * 0.19, H * 0.235, H * 0.16]], hero: [W * 0.21, H * 0.75, H * 0.46],
      no: { x: W * 0.42, y: H * 0.255, size: H * 0.43 }, name: { x: 0, y: H * 0.785 }, years: { x: 0, y: H * 0.915, w: W } },
  });

  const S = plateSvg(plate, P, '4 Plate art');
  const offs = [0, 1, 2].map(i => officer(S.cam, i === 2 ? '4A Arkhipov (pictogram, no face)' : `4B Officer ${i + 1} (yes)`, ink, u));
  offs.forEach((o, i) => { o.verm.style.opacity = 0; if (i < 2) o.key.style.opacity = 0; else { o.yel.style.opacity = 0; o.nav.style.opacity = 0; } });

  // NO — vermillion, pulled with one squeegee stroke; a yellow under-plate shows as a misregistered sliver
  const noBox = box(plate, '4C NO', E.no.x, E.no.y + E.no.size * 0.13, null, null, { lineHeight: 0.74 });
  const noStyle = { fontFamily: FONT.poster, fontWeight: 800, fontSize: E.no.size + 'px', letterSpacing: '-0.01em', lineHeight: 0.74, whiteSpace: 'nowrap', textTransform: 'uppercase' };
  const noYel = el('div', { 'data-name': 'NO yellow plate', style: { ...noStyle, position: 'absolute', left: 0, top: 0, color: INK.yellow, mixBlendMode: 'multiply', filter: ink, transform: `translate(${L.px(MISREG[0]) * 2.2}px, ${L.px(MISREG[1]) * 2.2}px)` } }, noBox, 'No');
  const noRed = el('div', { 'data-name': 'NO vermillion plate', style: { ...noStyle, position: 'relative', color: INK.verm, filter: ink } }, noBox, 'No');

  // name card
  const nameBox = box(plate, '4D Name card', E.name.x, E.name.y, L.portrait ? W : null, null, { display: 'flex', flexDirection: 'column', gap: L.px(8) + 'px' });
  const nm = el('div', { 'data-name': 'Name', style: eraCaps(L.px(L.pick({ landscape: 70, portrait: 66 })), 800, { letterSpacing: '0.04em', filter: ink, whiteSpace: 'nowrap' }) }, nameBox, 'Vasili Arkhipov');
  const role = el('div', { 'data-name': 'Role', style: mono(L.px(L.pick({ landscape: 26, portrait: 26 })), { color: INK.navy, fontWeight: 400 }) }, nameBox, 'Officer aboard B-59 · the third vote');

  // years: 1962 ——— 2002 (rule draws on "forty years")
  const Y = E.years;
  const yrs = box(plate, '4E Years', Y.x, Y.y, Y.w, L.px(60));
  const ySize = L.px(L.pick({ landscape: 46, portrait: 46 }));
  const y62 = box(yrs, 'Year 1962', 0, 0, null, null, mono(ySize, { color: INK.navy, fontWeight: 500, letterSpacing: '0.02em' }), '1962');
  const y02 = box(yrs, 'Year 2002', 0, 0, null, null, { ...mono(ySize, { color: INK.verm, fontWeight: 500, letterSpacing: '0.02em' }), right: 0, left: 'auto' }, '2002');
  const yRule = box(yrs, 'Years rule', 0, ySize * 0.6, 0, Math.max(2, L.px(3)), { background: INK.navy, transformOrigin: '0 50%' });
  const yTick = el('div', { style: { position: 'absolute', width: 0, height: 0, borderTop: `${L.px(9)}px solid transparent`, borderBottom: `${L.px(9)}px solid transparent`, borderLeft: `${L.px(16)}px solid ${INK.navy}` } }, yrs);

  return {
    update(t) {
      FR.update(t);
      // officers: start exactly where plate 3 ended; on "third" the two YES officers step back, the third steps forward
      const pm = tw(t, tThird - 2 * F, tThird + 22 * F, 0, 1, ez.move);
      offs.forEach((o, i) => {
        const [x1, f1, h1] = i < 2 ? E.yes[i] : E.hero;
        const x = R.xs[i] + (x1 - R.xs[i]) * pm, feet = R.feet + (f1 - R.feet) * pm, h = R.h + (h1 - R.h) * pm;
        const s = o.place(x, feet, h);
        if (i < 2) { o.nav.style.opacity = 1; o.misreg(s); o.g.style.opacity = 1 - 0.55 * pm; }
      });
      // the third officer is printed in vermillion by the same squeegee stroke that pulls the NO
      const pq = tw(t, tNo - 7 * F, tNo + 5 * F, 0, 1, ez.move);
      const hero = offs[2];
      hero.verm.style.opacity = t >= tNo - 7 * F ? 1 : 0;
      hero.verm.style.clipPath = squeegee(pq, 7, 3) + ' fill-box';
      hero.key.style.opacity = 1 - tw(t, tNo + 2 * F, tNo + 10 * F, 0, 1);

      const pn = tw(t, tNo - 5 * F, tNo + 6 * F, 0, 1, ez.move); // half-pulled on the word
      noBox.style.opacity = t >= tNo - 5 * F ? 1 : 0;
      noRed.style.clipPath = squeegee(pn, 21, 1.4);
      noYel.style.clipPath = squeegee(tw(t, tNo - 4 * F, tNo + 7 * F, 0, 1, ez.move), 33, 1.4); // yellow trap follows the red stroke

      // name: lands on "Vasili" (yellow tint comes 0, navy type 3 f later)
      const pv = tw(t, tVas, tVas + 14 * F, 0, 1, ez.enter);
      nameBox.style.opacity = Math.min(1, Math.max(0, (t - tVas) / (3 * F)));
      nameBox.style.transform = `translateY(${((1 - pv) * L.px(18)).toFixed(2)}px)`;

      // years
      const ww = yrs.offsetWidth, w62 = y62.offsetWidth, w02 = y02.offsetWidth, gap = L.px(18);
      y62.style.opacity = tw(t, tWorld, tWorld + 6 * F, 0, 1);
      const pr = tw(t, tForty, tLater + 4 * F, 0, 1, ez.move);
      const rw = (ww - w62 - w02 - gap * 2) * pr;
      yRule.style.left = w62 + gap + 'px';
      yRule.style.width = Math.max(0, rw - L.px(10)) + 'px';
      yTick.style.left = (w62 + gap + rw - L.px(16)) + 'px';
      yTick.style.top = (ySize * 0.6 + Math.max(2, L.px(3)) / 2 - L.px(9)) + 'px';
      yTick.style.opacity = pr > 0 ? 1 : 0;
      yRule.style.opacity = pr > 0 ? 1 : 0;
      y02.style.opacity = tw(t, tLater, tLater + 4 * F, 0, 1);
      y02.style.transform = `translateY(${((1 - tw(t, tLater, tLater + 12 * F, 0, 1)) * L.px(10)).toFixed(2)}px)`;
    },
  };
}
