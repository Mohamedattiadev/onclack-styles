// Plate 3 — TORPEDO (pamphlet line art) → THE MEDIUM SHIFT (30 f match dissolve) → screenprint: three officers, two YES.
// intent: KNOW one nuclear torpedo; firing needed three officers; two agreed · FEEL tension rising · SEE the drawing
//         re-print itself as a poster at the moment the decision begins; the third officer still "unprinted"
// truth: torpedo = generic schematic (VO); officers = era pictograms, no faces (VO); vote details come from later
//        accounts and are debated (README).
import { el, svg, glide, rand } from '/onclack-styles/engine/lib/anim.js';
import { INK, FONT, MISREG, F, ez, tw, wordT, box, eraCaps, frame, inkDefs, plateSvg } from '../shared/lens.js';
import { rowPos, officer, TORP } from '../shared/figures.js';

export default function (root, ctx) {
  const L = ctx.layout, u = L.unit;
  const FR = frame(root, ctx, { scene: 3, lens: 'pamphlet', fig: 3, caption: 'Schematic. Firing is said to have needed the consent of three officers on board.' });
  const { plate, P } = FR;
  const ink = inkDefs(root, 's3', u);

  const tNuc = wordT(ctx, 2, 'nuclear', 0, 1.16) - 2 * F;
  const tTorp = wordT(ctx, 2, 'torpedo', 0, 1.56) - 2 * F;
  const tTo = wordT(ctx, 2, 'To', 0, 2.41);
  const tThree = wordT(ctx, 2, 'three', 0, 3.19) - 2 * F;
  const tAgree = wordT(ctx, 2, 'agree', 0, 4.29) - 2 * F;
  const tTwo = wordT(ctx, 2, 'Two', 0, 4.97) - 2 * F;
  const tYes = wordT(ctx, 2, 'yes', 0, 5.48) - 2 * F;
  const tShift = tTo - 6 * F, SH = 30 * F; // the medium shift: 30 frames
  FR.setLens('poster', tShift + 8 * F);
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -26 });
  ctx.sfx('press-slow-01', tShift, { lu: -24 });

  const W = P.w, H = P.h;
  const T = L.pick({
    landscape: { len: W * 0.62, x: W * 0.19, y0: H * 0.46, y1: H * 0.2, s1: 0.8, x1: W * 0.04 },
    portrait: { len: W * 0.92, x: W * 0.04, y0: H * 0.36, y1: H * 0.16, s1: 0.92, x1: W * 0.02 },
  });
  const S = plateSvg(plate, P, '3 Plate art');
  const defs = svg('defs', {}, S.s);
  const hid = 'hatch-s3-' + L.format, cid = 'torp-clip-s3-' + L.format;
  const pat = svg('pattern', { id: hid, patternUnits: 'userSpaceOnUse', width: 9, height: 9, patternTransform: 'rotate(45)' }, defs);
  svg('line', { x1: 0, y1: 0, x2: 0, y2: 9, stroke: INK.navy, 'stroke-width': 2.4 }, pat);
  svg('path', { d: TORP.body }, svg('clipPath', { id: cid }, defs));

  // torpedo group (shared transform for both media → a true match dissolve)
  const sc = T.len / 1000;
  const torp = svg('g', { 'data-name': '3A Torpedo' }, S.cam);
  // medium A: pamphlet line art
  const A = svg('g', { 'data-name': 'Torpedo · pamphlet line art', filter: ink }, torp);
  svg('rect', { x: 0, y: 14, width: 1000, height: 40, fill: `url(#${hid})`, 'clip-path': `url(#${cid})` }, A);
  const outline = svg('path', { d: TORP.body + TORP.fins, fill: 'none', stroke: INK.navy, 'stroke-width': 3.2 / sc * u * 0.9, 'stroke-linejoin': 'round' }, A);
  svg('path', { d: TORP.joints + TORP.prop, fill: 'none', stroke: INK.navy, 'stroke-width': 2.4 / sc * u * 0.9 }, A);
  svg('path', { d: TORP.centre, fill: 'none', stroke: INK.navy, 'stroke-width': 1.4 / sc * u, 'stroke-dasharray': '26 7 5 7' }, A);
  const olen = outline.getTotalLength();
  outline.setAttribute('stroke-dasharray', `${olen} ${olen}`);
  // medium B: screenprint flat inks (yellow under-plate, navy body, warhead left in yellow, paper knock-out highlight)
  const B = svg('g', { 'data-name': 'Torpedo · screenprint' }, torp);
  const Byel = svg('path', { d: TORP.body + TORP.fins, fill: INK.yellow, style: 'mix-blend-mode:multiply', filter: ink }, B);
  const Bnav = svg('g', { filter: ink }, B);
  svg('path', { d: 'M80 -50 L700 -50 L700 50 L80 50 L22 26 L22 -26 Z' + TORP.fins, fill: INK.navy }, Bnav);
  const Bhi = svg('path', { d: 'M110 -30 H660', stroke: INK.paper, 'stroke-width': 7, 'stroke-linecap': 'round' }, B);

  const labT = box(plate, '3A Label torpedo', 0, 0, null, null, { display: 'flex', alignItems: 'baseline', gap: L.px(16) + 'px', filter: ink });
  const labNum = el('span', { style: eraCaps(L.px(L.pick({ landscape: 60, portrait: 56 })), 800) }, labT, '1');
  const labTxt = el('span', { style: eraCaps(L.px(L.pick({ landscape: 40, portrait: 38 })), 700, { letterSpacing: '0.12em' }) }, labT, 'Nuclear torpedo');

  // officers (screenprint)
  const R = rowPos(L, P);
  const offs = [0, 1, 2].map(i => officer(S.cam, `3B Officer ${i + 1}${i === 2 ? ' (unprinted)' : ''}`, ink, u));
  offs.forEach((o, i) => { o.verm.style.opacity = 0; if (i < 2) o.key.style.opacity = 0; else { o.yel.style.opacity = 0; o.nav.style.opacity = 0; } });
  const yes = [0, 1].map(i => box(plate, `3C YES stamp ${i + 1}`, 0, 0, null, null, {
    fontFamily: FONT.poster, fontWeight: 800, fontSize: L.px(L.pick({ landscape: 64, portrait: 60 })) + 'px', letterSpacing: '0.06em', lineHeight: 1,
    color: INK.navy, background: INK.yellow, padding: `${L.px(6)}px ${L.px(14)}px ${L.px(2)}px`, mixBlendMode: 'multiply', filter: ink, transformOrigin: '50% 100%',
  }, 'YES'));
  const agree = box(plate, '3C All three must agree', 0, 0, null, null, { fontFamily: FONT.poster, fontWeight: 800, fontSize: L.px(L.pick({ landscape: 58, portrait: 54 })) + 'px', letterSpacing: '0.1em', textTransform: 'uppercase', color: INK.navy, whiteSpace: 'nowrap', lineHeight: 1, filter: ink }, 'All three must agree');

  return {
    update(t) {
      FR.update(t);
      // torpedo: drafted (pen line), then lifts to the top of the plate before the shift
      const pd = tw(t, tNuc - 0.2, tNuc + 0.55, 0, 1, ez.move);
      outline.setAttribute('stroke-dashoffset', (olen * (1 - pd)).toFixed(1));
      A.style.opacity = t < tNuc - 0.2 ? 0 : 1;
      const pm = tw(t, tTorp + 0.15, tTorp + 0.15 + 22 * F, 0, 1, ez.move);
      const s = sc * (1 + (T.s1 - 1) * pm);
      const y = T.y0 + (T.y1 - T.y0) * pm;
      const x = T.x + (T.x1 - T.x) * pm;
      torp.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})`);
      A.querySelector('rect').style.opacity = tw(t, tNuc + 0.4, tNuc + 0.6, 0, 1);

      // ---- THE MEDIUM SHIFT (30 f): yellow plate registers under the line art, line art sinks, navy plate lands
      const f = (t - tShift) / F;
      const pY = Math.min(1, Math.max(0, f / 12)), pReg = ez.enter(Math.min(1, Math.max(0, f / 24)));
      const pN = Math.min(1, Math.max(0, (f - 10) / 16)), pA = Math.min(1, Math.max(0, (f - 6) / 24));
      A.style.opacity = (t < tNuc - 0.2 ? 0 : 1) * (1 - pA);
      const off = (1 - pReg) * 16 * u;
      Byel.style.opacity = pY; Byel.setAttribute('transform', `translate(${((u * MISREG[0] + off) / s).toFixed(2)} ${((u * MISREG[1] - off * 0.6) / s).toFixed(2)})`);
      Bnav.style.opacity = pN; Bnav.setAttribute('transform', `translate(${(-(1 - ez.enter(pN)) * 10 * u / s).toFixed(2)} 0)`);
      Bhi.style.opacity = pN;

      // label follows the torpedo (above it, left)
      labT.style.transform = `translate(${(x).toFixed(1)}px, ${(y - 100 * s - L.px(L.pick({ landscape: 78, portrait: 74 }))).toFixed(1)}px)`;
      labT.style.opacity = tw(t, tNuc, tNuc + 4 * F, 0, 1) * (1 - tw(t, tShift, tShift + 10 * F, 0, 1, ez.exit));

      // officers press in on "three" (yellow plate, then navy 4 f later); the third is a key line only
      offs.forEach((o, i) => {
        const at = tThree + i * 4 * F;
        const p = tw(t, at, at + 14 * F, 0, 1, ez.enter);
        const sF = o.place(R.xs[i], R.feet + (1 - p) * L.px(26), R.h);
        o.g.style.opacity = Math.min(1, Math.max(0, (t - at) / (3 * F)));
        if (i < 2) {
          const pn = Math.min(1, Math.max(0, (t - at - 4 * F) / (6 * F)));
          o.nav.style.opacity = pn;
          o.misreg(sF, (1 - p) * 10 * u);
        } else {
          o.key.style.opacity = 1;
        }
      });
      const [ax, ay] = L.pick({ landscape: [R.xs[0] - R.h * 0.2, R.feet - R.h - L.px(150)], portrait: [R.xs[0] - R.h * 0.24, R.feet - R.h - L.px(160)] });
      agree.style.transform = `translate(${ax.toFixed(1)}px, ${ay.toFixed(1)}px)`;
      agree.style.opacity = tw(t, tAgree, tAgree + 4 * F, 0, 1) * (1 - tw(t, tTwo - 6 * F, tTwo, 0, 1, ez.exit));
      yes.forEach((y2, i) => {
        const at = i ? tYes : tTwo;
        const p = tw(t, at, at + 8 * F, 0, 1, ez.enter);
        y2.style.opacity = t >= at ? 1 : 0;
        const w = y2.offsetWidth;
        y2.style.transform = `translate(${(R.xs[i] - w / 2).toFixed(1)}px, ${(R.feet - R.h - L.px(96)).toFixed(1)}px) rotate(${(i ? 2.2 : -3.1)}deg) scale(${(1.12 - 0.12 * p).toFixed(3)})`;
      });
    },
  };
}
