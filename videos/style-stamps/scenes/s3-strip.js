// 3 · THE RULE. KNOW: a nuclear torpedo on board; three officers must agree; two say yes. FEEL: the walls closing.
// 3A (0–2.4 s) new leaf: an empty printed space; the long torpedo issue is laid into it on "nuclear torpedo".   truth: RC
// 3B (2.4–6.9 s) tilt down: the se-tenant strip of three officer stamps lands as one piece on "three officers";
//               pencil "all three must agree"; black YES overprints strike I and II on "Two … yes"; III stays clean,
//               the camera drifts toward it.                                                                    truth: VO
import { glide, clamp, spring } from '/onclack-styles/engine/lib/anim.js';
import { strike } from '../shared/album.js';
import { buildLeaf3, camAtCut } from '../shared/leaf3.js';

const place = (t, t0) => (t < t0 ? 0 : clamp(spring(t - t0, { stiffness: 300, damping: 26 }), 0, 1.02));

export default async function (root, ctx) {
  const o = buildLeaf3(root, ctx);
  const { pg, ts, officers, yes, no, penAgree, penName, T, R, u, L, W } = o;
  const g0 = ctx.start;
  const tTorp = 14.42, tStrip = 16.46, tYes = [18.26, 18.76];

  ctx.sfx('page-turn-01', 0.02, { lu: -15 });
  ctx.sfx('page-turn-01', tTorp - g0 - 0.04, { lu: -19 });
  ctx.sfx('cloth-jacket-01', tStrip - g0 - 0.05, { lu: -24 });     // the strip slides into the glassine
  ctx.sfx('letterpress-manual-01', tYes[0] - g0 - 0.02, { lu: -12 });
  ctx.sfx('letterpress-manual-01', tYes[1] - g0 - 0.02, { lu: -11 });
  ctx.sfx('breath-close-01', 19.35 - g0, { lu: -22 });               // one held breath before the third

  return {
    update(t) {
      const g = g0 + t;
      pg.turn(glide(t, 0, 0.55, 0, 1));
      const pT = place(g, tTorp);
      ts.outer.style.opacity = clamp((g - tTorp + 0.04) * 12);
      ts.setPose(0, -60 * u * (1 - pT), ts.rot + (1 - pT) * 2.5, 1 + 0.04 * (1 - pT), 1 - clamp(pT));
      const pS = place(g, tStrip);
      officers.forEach((st) => {
        st.outer.style.opacity = clamp((g - tStrip + 0.04) * 12);
        // the strip lands as one piece: all three share one pivot (strip centre)
        const cx = (R.x + 1.5 * R.w) * u, ox = st.x + st.w / 2 - cx;
        const rot = (1 - pS) * -3;
        const dx = ox * Math.cos(rot * Math.PI / 180) - ox - 0, dy = ox * Math.sin(rot * Math.PI / 180);
        st.setPose(dx, dy - 80 * u * (1 - pS), rot, 1 + 0.04 * (1 - pS), 1 - clamp(pS));
      });
      yes.forEach((y, i) => { const v = strike(g, tYes[i]); y.g.setAttribute('opacity', clamp(v * 3, 0, 0.94)); });
      no.g.setAttribute('opacity', 0);
      penAgree.set(clamp((g - 17.3) / 1.15));
      penName.set(0);
      // camera: on the torpedo space → tilt down to the strip → drift toward III (ends exactly at camAtCut)
      const A = L.pick({ landscape: [(T.x + T.w / 2) * u, 455 * u, 1.18], portrait: [W / 2, 900 * u, 1.07] });
      const B = L.pick({ landscape: [(R.x + 1.5 * R.w) * u, (R.y + R.h * 0.5 - 40) * u, 1.08], portrait: [W / 2, 960 * u, 1.0] });
      const Cc = camAtCut(o);
      const k1 = glide(t, 2.3, 3.4, 0, 1), k2 = glide(t, 5.3, ctx.duration - 0.5, 0, 1);
      const mix = (i) => A[i] + (B[i] - A[i]) * k1 + (Cc[i] - B[i]) * k2;
      pg.cam(mix(0), mix(1), mix(2));
    },
  };
}
