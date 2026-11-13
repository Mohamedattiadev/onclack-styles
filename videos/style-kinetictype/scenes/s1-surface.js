// 1 · SURFACE — the date stands ON the waterline; the camera tilts under it; "deep" sinks out of the frame.
// intent: KNOW 27 Oct 1962, a Soviet sub near Cuba · FEEL quiet unease · SEE the word DEEP sinking past the frame edge
// shots: 1A EST "27 / 1962 on the waterline" HOLD+creep · 1B TILT-D (camera) under the surface · 1C DEEP sinks, camera follows late
// truth: VO (type only). No depth numbers on the gauge — the sub's depth is not claimed.
import { el } from '/onclack-styles/engine/lib/anim.js';
import { C, F, ez, tw, on, grid, T, fitT, rise, show, box, camera, setAxes, seaGeom, kicker } from '../shared/kt.js';

export default function (root, ctx) {
  const L = ctx.layout, G = grid(L), S = seaGeom(L), P = L.portrait;
  root.style.background = C.paper;
  const cam = camera(root);

  // ---- voice
  const tOct = on(ctx, 'October', 0, 0.58), t27 = on(ctx, 'twenty-seventh', 0, 1.1);
  const t19 = on(ctx, 'nineteen', 0, 2.07), t62 = on(ctx, 'sixty-two', 0, 2.61);
  const tSov = on(ctx, 'Soviet', 0, 3.79), tSub = on(ctx, 'submarine', 0, 4.3), tHide = on(ctx, 'hides', 0, 4.93);
  const tDeep = on(ctx, 'deep', 0, 5.42), tSea = on(ctx, 'in', 0, 5.72), tNear = on(ctx, 'near', 0, 6.24);

  // ---- world geometry: frame A (date on the water) → frame B (under the surface)
  const wA = L.pick({ landscape: L.height * 0.8, portrait: L.px(1400) });  // waterline, world y
  const follow = L.px(40);                                                  // late camera follow on "deep"
  const D = wA - S.water - follow;                                          // tilt distance (so the end frame = scene 2's first frame)
  const Dend = D + follow;

  // waterline (bleeds off both edges) + "surface" label + depth gauge (ticks only, no numbers)
  const line = box(cam, '1A Waterline', 0, wA, L.width, Math.max(2, L.px(3)), { background: C.ink, transformOrigin: '0 50%' });
  const surf = T(cam, '1A Surface label', 'surface', { fam: 'mono', size: L.px(24), wght: 500, ls: 0.1, upper: true, align: 'right' });
  surf.place(G.right, wA - L.px(16));
  const gauge = el('div', { 'data-name': '1B Depth gauge (ticks)', style: { position: 'absolute', left: '0px', top: '0px' } }, cam);
  for (let i = 1; i < 44; i++) box(gauge, `tick ${i}`, G.right - (i % 4 ? L.px(16) : L.px(40)), wA + i * L.px(48), i % 4 ? L.px(16) : L.px(40), Math.max(2, L.px(2)), { background: C.ink });

  // date: OCTOBER (mono) · 27 (huge, condensed black) · 1962 (hairline, wide) — all on one baseline = the water
  const d62 = L.pick({ landscape: L.px(300), portrait: L.px(250) });
  const yr = T(cam, '1A Year 1962', '', { size: d62, wght: 200, wdth: 100, words: ['19', '62'], join: '' });
  const n27 = fitT(cam, '1A Day 27', '27', { size: L.pick({ landscape: L.px(860), portrait: L.px(820) }), wght: 800, wdth: 75 },
    L.pick({ landscape: G.w(5), portrait: G.w(4) * 0.8 }));
  const oct = T(cam, '1A Month', '', { fam: 'mono', size: L.px(34), wght: 500, ls: 0.14, upper: true, words: ['October'] });
  if (!P) {
    n27.place(G.x(0), wA);
    yr.place(G.x(6), wA);
    oct.place(G.x(6), wA - yr.m.cap - L.px(56));
  } else {
    yr.place(G.x(0), wA);
    n27.place(G.x(0), wA - yr.m.cap - L.px(84));
    oct.place(G.x(0), wA - yr.m.cap - L.px(84) - n27.m.cap - L.px(52));
  }

  // under the surface: "Soviet submarine hides" — hides loses weight and ink
  const sz = L.pick({ landscape: L.px(150), portrait: L.px(140) });
  const lines = P
    ? [['Soviet', 160], ['submarine', 300], ['hides', 440]].map(([w, dy]) => { const n = T(cam, `1B ${w}`, '', { size: sz, wght: 700, wdth: 75, words: [w] }); n.place(G.x(0), S.water + D + follow + L.px(dy)); return n.words[0]; })
    : (() => { const n = T(cam, '1B Soviet submarine hides', '', { size: sz, wght: 700, wdth: 75, words: ['Soviet', 'submarine', 'hides'] }); n.place(G.x(0), S.water + Dend + L.px(250)); return n.words; })();
  const [wSov, wSub, wHide] = lines;

  // DEEP — the held word of this scene (ends exactly where scene 2 picks it up)
  const deep = T(cam, '1C DEEP (held word)', 'deep', { size: S.deepSize, wght: 800, wdth: L.pick({ landscape: 100, portrait: 92 }) });
  const deepEnd = S.deepBase + Dend, deepStart = deepEnd - S.deepRise;

  // "in the sea · near Cuba" — small, right under the waterline, by the gauge
  const where = T(cam, '1C In the sea near Cuba', '', { fam: 'mono', size: L.px(28), wght: 500, ls: 0.1, upper: true, align: 'right', words: ['in the sea ·', 'near Cuba'] });
  where.place(G.right - L.px(64), wA + L.px(54));

  const kick = kicker(root, L, '1', 'The sea');
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -24, fade: 0.6 });

  return {
    update(t) {
      // camera: hold (tiny creep) on the date → tilt under the water on "Soviet" → late follow on "deep"
      const creepY = tw(t, 0, 3.4, 0, L.px(14), ez.lin);
      const tilt = tw(t, tSov - 10 * F, tSov + 22 * F, 0, D - L.px(14), ez.camera);
      const fol = tw(t, tDeep + 6 * F, tDeep + 40 * F, 0, follow, ez.camera);
      cam.set(0, creepY + tilt + fol);

      line.style.transform = `scaleX(${tw(t, 0, 16 * F, 0, 1, ez.enter).toFixed(4)})`;
      surf.style.visibility = t >= 10 * F ? 'visible' : 'hidden';

      // date lands on the water: month first (small), then the day hits, then the year in two halves
      rise(oct.words[0], t, tOct);
      const p27 = ez.enter((t - t27) / (9 * F));
      n27.style.visibility = t >= t27 ? 'visible' : 'hidden';
      // the day drops onto the waterline with weight: wght thins→black as it lands (weight = arrival)
      setAxes(n27, tw(t, t27, t27 + 9 * F, 500, 800), 75);
      n27.style.transform = `translateY(${(-(1 - Math.min(1, Math.max(0, p27))) * L.px(60)).toFixed(2)}px)`;
      rise(yr.words[0], t, t19); rise(yr.words[1], t, t62);

      // under the surface
      rise(wSov, t, tSov + 8 * F); rise(wSub, t, tSub); rise(wHide, t, tHide);
      // "hides": the word loses its weight and its ink — it hides inside the line
      const ph = ez.move(Math.min(1, Math.max(0, (t - tHide - 6 * F) / 0.5)));
      wHide.inner.style.fontVariationSettings = `'wght' ${(700 - 480 * ph).toFixed(1)}, 'wdth' 75`;
      wHide.inner.style.color = ph > 0.5 ? C.hush : C.ink;

      // DEEP: appears, then sinks (heavy, slow), never fully stops (keeps sinking 6 px/s)
      show(deep, t, tDeep);
      const sink = tw(t, tDeep, tDeep + 1.15, 0, S.deepRise, ez.move) + Math.max(0, t - tDeep - 1.15) * L.px(6);
      deep.place(S.deepX, deepStart + sink);

      rise(where.words[0], t, tSea); rise(where.words[1], t, tNear);
      show(kick, t, 0);
    },
  };
}
