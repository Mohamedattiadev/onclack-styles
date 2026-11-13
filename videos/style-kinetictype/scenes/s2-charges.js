// 2 · ABOVE — ships sit on the waterline, "depth charges" are dropped and HIT the baseline; then: Moscow, a long empty rule, "silent".
// intent: KNOW US ships drop PRACTICE charges; no word from Moscow · FEEL pressure → isolation · SEE the baseline bending under the impacts
// shots: 2A (match from 1C: same waterline, same DEEP) HOLD · drop lines · two falling words, jolt · CUT on the voice pause →
//        2B Moscow ——— silent (≥ 55 % empty page)
// truth: VO (type). "practice" is shown on screen on purpose: the charges were signalling charges, not attacks.
import { el, svg } from '/onclack-styles/engine/lib/anim.js';
import { C, F, ez, tw, on, wordT, grid, T, fitT, rise, show, vis, box, camera, jolt, seaGeom, kicker } from '../shared/kt.js';

export default function (root, ctx) {
  const L = ctx.layout, G = grid(L), S = seaGeom(L), P = L.portrait;
  root.style.background = C.paper;

  // ---- voice
  const tAbove = on(ctx, 'Above', 0, 0.35), tAm = on(ctx, 'American', 0, 0.86), tShips = on(ctx, 'ships', 0, 1.42);
  const tDrop = on(ctx, 'drop', 0, 1.74), tPrac = on(ctx, 'practice', 0, 2.07);
  const tDepth = wordT(ctx, 'depth', 0, 2.58), tCharges = wordT(ctx, 'charges', 0, 2.84);
  const tMos = on(ctx, 'Moscow', 0, 3.74), tHas = on(ctx, 'has', 0, 4.26), tSil = on(ctx, 'silent', 0, 4.72), tFor = on(ctx, 'for', 0, 5.14);
  const tCut = tMos - 4 * F; // cut on the voice pause, just before "Moscow"
  const land1 = tDepth - 1 * F, land2 = tCharges - 1 * F; // impacts land 1 frame before each word

  // global time of "deep" (scene 1) → DEEP keeps the same slow sink across the cut
  const gDeep = (ctx.words.find(w => w.word.toLowerCase().startsWith('deep'))?.start ?? 5.42) - 2 * F;

  /* =============== 2A — the water =============== */
  const A = camera(root, '2A Layout (camera)');
  box(A, '2A Waterline', 0, S.water, L.width, Math.max(2, L.px(3)), { background: C.ink });
  const surf = T(A, '2A Surface label', 'surface', { fam: 'mono', size: L.px(24), wght: 500, ls: 0.1, upper: true, align: 'right' });
  surf.place(G.right, S.water - L.px(16));
  for (let i = 1; i < 30; i++) box(A, `2A gauge tick ${i}`, G.right - (i % 4 ? L.px(16) : L.px(40)), S.water + i * L.px(48), i % 4 ? L.px(16) : L.px(40), Math.max(2, L.px(2)), { background: C.ink });

  const above = T(A, '2A Above it', '', { fam: 'mono', size: L.px(28), wght: 500, ls: 0.1, upper: true, words: ['Above it,'] });
  const shipSize = L.pick({ landscape: L.px(140), portrait: L.px(124) });
  const am = T(A, '2A Ship word American', '', { size: shipSize, wght: 800, wdth: 75, words: ['American'] });
  const sh = T(A, '2A Ship word ships', '', { size: shipSize, wght: 800, wdth: 75, words: ['ships'], align: P ? 'right' : 'left' });
  am.place(G.x(0), S.water - L.px(4));
  sh.place(P ? G.right - L.px(170) : G.x(7), S.water - L.px(4));
  above.place(G.x(0), S.water - am.m.cap - L.px(48));

  // landing baseline (an SVG line that bends where a charge hits)
  const yLand = L.pick({ landscape: S.water + L.px(400), portrait: S.water + L.px(620) });
  const bl = svg('svg', { 'data-name': '2A Landing baseline', width: L.width, height: L.height, style: 'position:absolute;left:0;top:0;overflow:visible' }, A);
  const blPath = svg('path', { fill: 'none', stroke: C.ink, 'stroke-width': Math.max(2, L.px(3)) }, bl);

  // falling words
  const fSize = L.pick({ landscape: L.px(150), portrait: L.px(130) });
  const dWord = T(A, '2A Falling word depth', 'depth', { size: fSize, wght: 800, wdth: 75 });
  const cWord = T(A, '2A Falling word charges', 'charges', { size: fSize, wght: 800, wdth: 75, align: P ? 'right' : 'left' });
  const x1 = am.m.x + L.px(6), x2 = P ? sh.m.x + sh.m.w - L.px(6) : sh.m.x + L.px(6);
  const dropStart = S.water + L.px(8);
  // drop lines from each ship to the baseline
  const dl1 = box(A, '2A Drop line 1', x1 - L.px(18), dropStart, Math.max(2, L.px(2)), yLand - dropStart, { background: C.ink, transformOrigin: '50% 0' });
  const dl2 = box(A, '2A Drop line 2', (P ? x2 + L.px(16) : x2 - L.px(18)), dropStart, Math.max(2, L.px(2)), yLand - dropStart, { background: C.ink, transformOrigin: '50% 0' });
  const prac = T(A, '2A Practice label', '', { fam: 'mono', size: L.px(28), wght: 500, ls: 0.1, upper: true, words: ['practice'] });
  prac.place(x1 + L.px(22), S.water + L.px(52));

  const deep = T(A, '2A DEEP (held word)', 'deep', { size: S.deepSize, wght: 800, wdth: L.pick({ landscape: 100, portrait: 92 }) });

  /* =============== 2B — Moscow, silent =============== */
  const B = camera(root, '2B Layout (camera)');
  const mSize = L.px(150);
  const mos = T(B, '2B Moscow', '', { size: mSize, wght: 800, wdth: 75, words: ['Moscow'] });
  mos.place(G.x(0), L.safe.y + L.pick({ landscape: L.px(330), portrait: L.px(420) }));
  const ruleX = mos.m.x + mos.m.w + L.px(28), ruleY = mos.m.base - mos.m.cap * 0.42;
  const rule = box(B, '2B Silence rule', ruleX, ruleY, G.right - ruleX, Math.max(2, L.px(2)), { background: C.ink, transformOrigin: '0 50%' });
  const sil = fitT(B, '2B silent (held word)', 'silent', { size: L.pick({ landscape: L.px(360), portrait: L.px(320) }), wght: 200, wdth: 100, color: C.hush, align: 'right' }, L.safe.w);
  sil.place(G.right, L.safe.y + L.safe.h - L.pick({ landscape: L.px(150), portrait: L.px(260) }));
  const days = T(B, '2B for days', '', { fam: 'mono', size: L.px(30), wght: 500, ls: 0.1, upper: true, align: 'right', words: ['for days.'] });
  days.place(G.right, sil.m.base + L.px(78));

  const kick = kicker(root, L, '2', 'The ships');
  ctx.ambience('sea-water-close-01', { from: 0, to: tCut, lu: -24, fade: 0.3 });
  ctx.sfx('boom-distant-01', land1, { lu: -12 });
  ctx.sfx('boom-distant-01', land2, { lu: -15 });

  const xs = [];
  for (let x = 0; x <= L.width; x += L.px(16)) xs.push(x);

  return {
    update(t) {
      const inA = t < tCut;
      vis(A, inA); vis(B, !inA);

      if (inA) {
        // camera: a small rise on "Above" (we look up toward the ships), then the impacts jolt the whole page
        const up = tw(t, tAbove - 6 * F, tAbove + 30 * F, 0, -L.px(18), ez.camera);
        const j = jolt(t, land1, L.px(9), 0.4, 1) + jolt(t, land2, L.px(12), 0.45, 2);
        A.set(0, up + j);

        rise(above.words[0], t, tAbove);
        rise(am.words[0], t, tAm); rise(sh.words[0], t, tShips);
        // ships ride the water (ambient, ≤ 2 px)
        am.words[0].wrap.style.transform = `translateY(${(Math.sin(t * 1.7) * L.px(2)).toFixed(2)}px)`;
        sh.words[0].wrap.style.transform = `translateY(${(Math.sin(t * 1.7 + 1.9) * L.px(2)).toFixed(2)}px)`;

        // drop lines run down to the baseline; "practice" tags the first one
        dl1.style.transform = `scaleY(${tw(t, tDrop, tDrop + 9 * F, 0, 1).toFixed(4)})`;
        dl2.style.transform = `scaleY(${tw(t, tDrop + 3 * F, tDrop + 12 * F, 0, 1).toFixed(4)})`;
        rise(prac.words[0], t, tPrac);

        // baseline: draws with the drop lines, bends under each impact
        const draw = tw(t, tDrop, tDrop + 12 * F, 0, 1);
        const xEnd = L.width * draw;
        const dip = (x, xi, ti, amp) => {
          const d = t - ti; if (d < 0 || d > 0.6) return 0;
          return amp * Math.exp(-d / 0.14) * Math.cos(d * 34) * Math.exp(-(((x - xi) / L.px(220)) ** 2));
        };
        const xi1 = x1 + dWord.m.w / 2, xi2 = P ? x2 - cWord.m.w / 2 : x2 + cWord.m.w / 2;
        blPath.setAttribute('d', xs.filter(x => x <= xEnd).map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${(yLand + L.px(10) + dip(x, xi1, land1, L.px(22)) + dip(x, xi2, land2, L.px(26))).toFixed(1)}`).join(' '));

        // the falling words: gravity in 8 f, land on the baseline, squash 5 f
        const fall = (node, x, tl) => {
          const t0 = tl - 8 * F;
          node.style.visibility = t >= t0 ? 'visible' : 'hidden';
          const startBase = dropStart + node.m.cap + L.px(6);
          const base = tw(t, t0, tl, startBase, yLand, ez.fall);
          node.place(x, base);
          const sq = t < tl ? 1 : 1 - 0.12 * Math.exp(-(t - tl) / 0.06) * Math.cos((t - tl) * 40);
          node.style.transformOrigin = '50% 100%';
          node.style.transform = `scale(${(1 + (1 - sq) * 0.5).toFixed(4)}, ${sq.toFixed(4)})`;
        };
        fall(dWord, x1, land1); fall(cWord, x2, land2);

        // DEEP: held from scene 1, same slow sink; each impact pushes it down a little more
        const sinkMore = Math.max(0, ctx.start + t - gDeep - 1.15) * L.px(6);
        const push = tw(t, land1, land1 + 10 * F, 0, L.px(8)) + tw(t, land2, land2 + 10 * F, 0, L.px(10));
        deep.place(S.deepX, S.deepBase + sinkMore + push);
      } else {
        const tb = t - tCut;
        B.set(0, -tb * L.px(5)); // slow drift up (never fully static)
        rise(mos.words[0], t, tMos);
        rule.style.transform = `scaleX(${tw(t, tHas, tSil, 0, 1, ez.move).toFixed(4)})`;
        // "silent" is the only thing in the film that fades in — it arrives without a sound
        sil.style.opacity = tw(t, tSil, tSil + 0.7, 0, 1, ez.move).toFixed(3);
        rise(days.words[0], t, tFor);
      }
      show(kick, t, 0);
    },
  };
}
