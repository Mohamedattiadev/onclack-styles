// 4 · THE THIRD — the empty line gets its name; then "no." stops everything (ink page, total stillness, voice silence);
//     the page comes back: the name, the held "no.", and 1962 ——— 40 years ——— 2002.
// intent: KNOW Arkhipov said no; the world learned his name ~40 years later · FEEL held breath → relief/awe
//         SEE "☐ no." alone on an ink page (the peak: the only full-frame inversion of the film)
// shots: 4A (match from 3C: same form) PED-down to row 3 · 4B CUT to ink, absolute HOLD (no creep — the only static frame,
//        on purpose) · 4C CUT back to paper, resolution layout, the held word "no." stays on the same screen spot
// truth: VO (type). Name card only, no face. "Forty years later" = his role became widely known after the Oct 2002 Havana
//        conference (re-check 2+ sources before public use).
import { C, F, ez, tw, on, grid, T, fitT, rise, show, vis, box, camera, kicker } from '../shared/kt.js';
import { buildForm } from '../shared/form.js';

export default function (root, ctx) {
  const L = ctx.layout, G = grid(L), P = L.portrait;
  root.style.background = C.paper;

  // ---- voice
  const tThird = on(ctx, 'third', 0, 0.51), tVas = on(ctx, 'Vasili', 0, 0.87), tArk = on(ctx, 'Arkhipov', 0, 1.38);
  const tNo = on(ctx, 'no', 0, 2.29), tWorld = on(ctx, 'world', 0, 3.33), tName = on(ctx, 'name', 0, 3.99);
  const tForty = on(ctx, 'forty', 0, 4.39), tYears = on(ctx, 'years', 0, 4.72), tLater = on(ctx, 'later', 0, 4.99);
  const tBack = tWorld - 3 * F; // the page comes back just before "world"

  /* =============== 4A — the form again; the third line gets its name =============== */
  const A = camera(root, '4A Form (camera)');
  const form = buildForm(A, L);
  A.querySelectorAll('[data-name^="3C"]').forEach(n => { n.dataset.name = '4A' + n.dataset.name.slice(2); });
  const { B, rows } = form;
  const r3 = rows[2];
  const vas = T(A, '4A Vasili', '', { fam: 'mono', size: L.px(30), wght: 500, ls: 0.12, upper: true, words: ['Vasili'] });
  vas.place(B.nameX + L.px(4), r3.y - B.size * 0.78 - L.px(26));
  const ark = T(A, '4A Arkhipov (on the empty line)', '', { size: B.size, wght: 800, wdth: 85, words: ['Arkhipov'] });
  ark.place(B.nameX, r3.y - L.px(10));
  const ped = B.step * 0.9;

  /* =============== 4B / 4C — the "no." (same screen spot on ink and on paper) =============== */
  const noSize = L.pick({ landscape: L.px(330), portrait: L.px(300) });
  const noBase = L.pick({ landscape: L.height * 0.62, portrait: L.height * 0.56 });
  const noX = L.pick({ landscape: G.x(7), portrait: G.x(0) + L.px(300 * 0.54 + 40) });
  const ink = box(root, '4B Ink page', 0, 0, L.width, L.height, { background: C.ink });
  const no = T(root, '4B no. (held word)', 'no.', { size: noSize, wght: 800, wdth: 85, color: C.paper });
  no.place(noX, noBase);
  // the third, empty box — set at the x-height of "no." (the answer that never got a tick)
    const nbS = noSize * 0.54; // = x-height of Bricolage at wght 800
  const nb = box(root, '4B Empty third box', noX - nbS - L.pick({ landscape: L.px(46), portrait: L.px(34) }), noBase - nbS, nbS, nbS,
    { border: `${Math.max(4, L.px(7))}px solid ${C.paper}` });

  /* =============== 4C — resolution =============== */
  const R = camera(root, '4C Resolution (camera)');
  const vas2 = T(R, '4C Vasili', '', { fam: 'mono', size: L.px(32), wght: 500, ls: 0.12, upper: true, words: ['Vasili'] });
  const ark2 = fitT(R, '4C ARKHIPOV', '', { size: L.pick({ landscape: L.px(230), portrait: L.px(200) }), wght: 800, wdth: 85, words: ['Arkhipov'] },
    L.pick({ landscape: noX - G.x(0) - L.px(60), portrait: L.safe.w }));
  const arkBase = L.pick({ landscape: L.safe.y + L.px(330), portrait: L.safe.y + L.px(420) });
  ark2.place(G.x(0), arkBase);
  vas2.place(G.x(0), arkBase - ark2.m.cap - L.px(40));
  // timeline: 1962 (hairline, the year from scene 1) ——— 40 years ——— 2002 (black)
  const yBase = L.safe.y + L.safe.h - L.pick({ landscape: L.px(40), portrait: L.px(30) });
  const ySize = L.pick({ landscape: L.px(124), portrait: L.px(110) });
  const y62 = T(R, '4C 1962', '', { size: ySize, wght: 200, wdth: 100, words: ['1962'] });
  y62.place(G.x(0), yBase);
  const y02 = T(R, '4C 2002', '', { size: ySize, wght: 800, wdth: 85, align: 'right', words: ['2002'] });
  y02.place(G.right, yBase);
  const rx0 = y62.m.x + y62.m.w + L.px(30), rx1 = y02.m.x - L.px(30), ry = yBase - y62.m.cap * 0.42;
  const rule = box(R, '4C 40-year rule', rx0, ry, rx1 - rx0, Math.max(2, L.px(3)), { background: C.ink, transformOrigin: '0 50%' });
  const forty = T(R, '4C 40 years', '', { fam: 'mono', size: L.px(28), wght: 500, ls: 0.1, upper: true, words: ['40 years'] });
  forty.place((rx0 + rx1) / 2 - forty.m.w / 2, ry - L.px(22));
  const hav = T(R, '4C Havana 2002 caption', '', { fam: 'mono', size: L.px(24), wght: 400, ls: 0.06, upper: true, align: 'right', words: ['Havana conference, Oct 2002'] });
  hav.place(G.right, yBase - y02.m.cap - L.px(28));

  const kick = kicker(root, L, '4', 'The third');

  return {
    update(t) {
      const inA = t < tNo, inB = t >= tNo && t < tBack, inC = t >= tBack;
      vis(A, inA); vis(ink, inB); vis(R, inC); vis(kick, !inB);
      show(no, t, tNo); show(nb, t, tNo);
      

      if (inA) {
        // the form from scene 3, fully set (ticks drawn, yes set)
        const done = 99;
        form.head.words.forEach(w => rise(w, done, 0));
        rows.forEach(r => { rise(r.num.words[0], done, 0); if (r.nm) { rise(r.nm.words[0], done, 0); rise(r.ro.words[0], done, 0); } });
        form.ticks.forEach(k => k.draw(done, 0)); form.yes.forEach(y => rise(y.words[0], done, 0));
        // camera pedestals down the form to the third row on "the third"
        A.set(0, tw(t, tThird - 8 * F, tThird + 28 * F, 0, ped, ez.camera) + Math.max(0, t - tThird) * L.px(4));
        // the blank line becomes a baseline: Vasili (small) above it, ARKHIPOV rises out of it
        rise(vas.words[0], t, tVas); rise(ark.words[0], t, tArk);
        r3.blank.style.transform = `scaleX(${tw(t, tArk, tArk + 8 * F, 1, (ark.m.w + L.px(8)) / parseFloat(r3.blank.style.width), ez.move).toFixed(4)})`;
      }
      if (inB) {
        // total stillness: nothing moves, nothing creeps. paper type on the ink page.
        no.style.color = C.paper; nb.style.borderColor = C.paper;
      }
      if (inC) {
        // back to paper: the held "no." stays exactly where it was, now in the accent; the box goes back to ink
        no.style.color = C.signal; nb.style.borderColor = C.ink;
        R.set(0, -(t - tBack) * L.px(4));
        no.style.transform = `translateY(${(-(t - tBack) * L.px(4)).toFixed(2)}px)`;
        nb.style.transform = no.style.transform;
        rise(vas2.words[0], t, tName - 6 * F); rise(ark2.words[0], t, tName);
        rise(y62.words[0], t, tForty);
        rule.style.transform = `scaleX(${tw(t, tForty + 3 * F, tLater, 0, 1, ez.move).toFixed(4)})`;
        rise(forty.words[0], t, tYears);
        rise(y02.words[0], t, tLater);
        rise(hav.words[0], t, tLater + 12 * F);
      } else if (inA) { no.style.transform = ''; nb.style.transform = ''; }
    },
  };
}
