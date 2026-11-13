// 4 · THE TURN + END. KNOW: the third officer, Vasili Arkhipov, says no; the world learned his name ~40 years later.
// FEEL: release, respect. SEE: the only red in the film.
// 4A (0–2.2 s) same leaf as 3 (invisible cut): push to stamp III, the loupe looks at the open hand; pencil "V. Arkhipov".
// 4B (2.2 s)   the loupe lifts; a red NO overprint strikes III on "no" — the one red ink of the whole album.   truth: VO
// 4C (3.2–6.3) pull back: YES · YES · NO; on "forty years later" a 2002 datestamp ties the strip to the day it was known.
import { glide, clamp, spring, shake } from '/onclack-styles/engine/lib/anim.js';
import { strike, makePostmark, showStrike, makeLoupe } from '../shared/album.js';
import { buildLeaf3, camAtCut } from '../shared/leaf3.js';

export default async function (root, ctx) {
  const o = buildLeaf3(root, ctx);
  const { pg, ts, officers, yes, no, penAgree, penName, R, u, L, W, H } = o;
  const g0 = ctx.start;
  const s3 = officers[2];
  const tNo = 21.96, t2002 = 24.1;
  const pm = makePostmark(pg, s3.marks, { cx: s3.w * 0.3, cy: s3.h * 0.2, r: 96 * u, ring: 'SEA POST · FORTY YEARS ON', mid: '2002', bars: false, rot: -14, seed: 9, name: '4C Datestamp X 2002' });
  const loupe = makeLoupe(pg, pg.content, [s3.id], { r: L.pick({ landscape: 128, portrait: 120 }), name: '4A Loupe' });

  ctx.sfx('drawer-close-01', 0.62, { lu: -24 });                     // loupe set down
  ctx.sfx('letterpress-manual-01', tNo - g0 - 0.03, { lu: -6 });     // the NO: the heaviest strike of the film
  ctx.sfx('drawer-close-01', tNo - g0 - 0.02, { lu: -12 });          // + the table under it
  ctx.sfx('letterpress-manual-01', t2002 - g0 - 0.02, { lu: -14 });  // the later datestamp, lighter
  ctx.sfx('page-turn-01', 5.1, { lu: -22 });                         // the album is closed over the last words

  return {
    update(t) {
      const g = g0 + t;
      pg.turn(1);
      ts.outer.style.opacity = 1; ts.setPose();
      officers.forEach((st) => { st.outer.style.opacity = 1; st.setPose(); });
      yes.forEach((y) => y.g.setAttribute('opacity', 0.94));
      penAgree.set(1);
      penName.set(clamp((g - 20.55) / 1.1));
      const vNo = strike(g, tNo);
      no.g.setAttribute('opacity', clamp(vNo * 3, 0, 0.95).toFixed(3));
      const sNo = 1 + (1 - Math.min(1, vNo)) * 0.08;
      no.g.setAttribute('transform', `translate(${s3.w / 2} ${s3.h * 0.6}) scale(${sNo}) translate(${-s3.w / 2} ${-s3.h * 0.6})`);
      showStrike(pm, strike(g, t2002), s3.w * 0.3, s3.h * 0.2);
      // loupe on the open hand of III, lifts off before the NO
      const fx = s3.x + s3.w * 0.68, fy = s3.y + s3.h * 0.5;
      const inP = clamp(spring(t - 0.35, { stiffness: 70, damping: 16 }), 0, 1.03);
      const out = glide(g, 21.35, 21.85, 0, 1);
      const lx = fx + 380 * u * (1 - inP) + 420 * u * out, ly = fy + 260 * u * (1 - inP) + 300 * u * out;
      loupe.set(lx, ly, 1.9, clamp((t - 0.3) * 4) * (1 - out));
      // camera: from the cut key → close on III → bump on NO → pull back to the whole strip
      const A = camAtCut(o);
      const B = L.pick({ landscape: [(R.x + 2.5 * R.w + 60) * u, (R.y + R.h * 0.57) * u, 1.6], portrait: [(R.x + 2.5 * R.w) * u, (R.y + R.h * 0.41) * u, 1.5] });
      const Cc = L.pick({ landscape: [(R.x + 1.5 * R.w + 80) * u, (R.y + R.h * 0.5 - 30) * u, 1.04], portrait: [W / 2, 880 * u, 1.0] });
      const k1 = glide(t, 0.1, 1.6, 0, 1), k2 = glide(g, 22.9, 25.4, 0, 1);
      const mix = (i) => A[i] + (B[i] - A[i]) * k1 + (Cc[i] - B[i]) * k2;
      const bump = shake(g, tNo, { amp: 7 * u, decay: 0.26 });
      pg.cam(mix(0) + bump * 0.4, mix(1) + bump, mix(2) * (1 + 0.012 * clamp((g - tNo) / 0.2) * (1 - k2)));
    },
  };
}
