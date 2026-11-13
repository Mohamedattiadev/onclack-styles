// Panel 4 — THE NO (peak → resolution, intensity 5 → 2)
// intent: KNOW Arkhipov said no; his name became widely known only ~40 years later · FEEL relief/awe ·
//         SEE the empty slot from panel 3 filled by the ONLY dyed veneer in the film: an indigo NO.
// truth: figure = VO (no face); NO = VO; "as told in later accounts" + "c. 2002" hedges (his role became widely
//        known around the Oct 2002 Havana conference — re-check with 2+ sources before public use).
// sound: the sea bed stops 0.5 s before "no" (silence = room tone), one heavy wood seat on the NO, a cloth polish under
//        the sheen, then the room only.
import { svg, progress } from '/onclack-styles/engine/lib/anim.js';
import { F, ez, panel, piece, plate, ground, stringing, wordT, rrect } from '../shared/inlay.js';
import { officer } from '../shared/figures.js';

export default async function (root, ctx) {
  const P = await panel(root, ctx, { id: 's4' });
  const { L, W, H } = P;

  const tVas = wordT(ctx, 'Vasili', 0, 0.87) - 2 * F;
  const tArk = wordT(ctx, 'Arkhipov', 0, 1.38) - 2 * F;
  const tNo = wordT(ctx, 'no', 0, 2.29) - 2 * F;
  const tWorld = wordT(ctx, 'world', 0, 3.33) - 2 * F;
  const tForty = wordT(ctx, 'forty', 0, 4.39) - 2 * F;
  const tLater = wordT(ctx, 'later', 0, 4.99) - 2 * F;

  ground(P, P.world, { species: 'holly', angle: 90, leaves: L.pick({ landscape: 4, portrait: 3 }), x: -L.px(80), y: -L.px(80), w: W + L.px(160), h: H + L.px(160), seed: 8, name: 'Holly field (book-matched)', tone: 0.05 });

  const R = L.pick({
    landscape: {
      fig: { x: W * 0.215, feet: H - P.inner - L.px(34), h: H * 0.84 },
      pl: { x: W * 0.42, y: P.inner + L.px(54), w: W * 0.5, h: H * 0.44 }, noSize: 470,
      nm: { x: W * 0.42, y: P.inner + L.px(54) + H * 0.44 + L.px(26), w: W * 0.5, h: L.px(150) }, nmSize: 104, twoLine: false,
      tl: { x0: W * 0.42 + L.px(10), x1: W * 0.92 - L.px(10), y: H - P.inner - L.px(150), size: 74 },
      acc: { x: W * 0.92, y: H - P.inner - L.px(92) },
    },
    portrait: {
      fig: { x: W * 0.25, feet: L.safe.y + L.px(1190), h: L.px(600) },
      pl: { x: P.inner + L.px(30), y: L.safe.y + L.px(26), w: W * 0.86 - P.inner - L.px(30), h: L.px(520) }, noSize: 470,
      nm: { x: W * 0.47, y: L.safe.y + L.px(700), w: W * 0.86 - W * 0.47, h: L.px(250) }, nmSize: 100, twoLine: true,
      tl: { x0: P.inner + L.px(40), x1: W * 0.86, y: L.safe.y + L.px(1290), size: 74 },
      acc: { x: W * 0.86, y: L.safe.y + L.px(1324) },
    },
  });

  // ---- Arkhipov (already inlaid: continuity from panel 3)
  const fig = officer(P, P.world, { x: R.fig.x, y: R.fig.feet, h: R.fig.h, pose: 'still', name: 'Arkhipov (figure, no face)', seed: 3, at: -1 });

  // ---- the plaque: walnut frame, the slot is still empty (dark) — then the indigo NO insert
  const pg = svg('g', { 'data-name': 'NO plaque' }, P.screen);
  const { x, y, w, h } = R.pl;
  piece(P, pg, { d: rrect(x, y, w, h, L.px(16)), species: 'walnut', angle: 0, seed: 71, name: 'Plaque frame (walnut)', shade: 'br', shadeAmt: 0.35 });
  const m = L.px(L.pick({ landscape: 30, portrait: 24 }));
  stringing(P, pg, rrect(x + m * 0.45, y + m * 0.45, w - m * 0.9, h - m * 0.9, L.px(10)), { w: 3, name: 'Plaque stringing' }).update(1);
  const sx = x + m, sy = y + m, sw = w - 2 * m, sh = h - 2 * m;
  svg('path', { d: `M${sx} ${sy}h${sw}v${sh}h${-sw}Z`, fill: '#2B1D13', 'data-name': 'Empty slot (backing)' }, pg);
  const insert = piece(P, pg, { d: `M${sx} ${sy}h${sw}v${sh}h${-sw}Z`, species: 'holly', angle: 0, seed: 72, name: 'NO insert (holly)', at: tNo, dur: 0.5, dist: L.px(150), dir: 90, win: false });
  const no = piece(P, pg, { text: { str: 'NO', x: sx + sw / 2, y: sy + sh * 0.5 + L.px(R.noSize) * 0.36, size: L.px(R.noSize), anchor: 'middle', ls: '0.06em' }, species: 'indigo', angle: 0, seed: 73, name: 'NO (indigo-dyed veneer — the only dyed piece)', at: tNo, dur: 0.5, dist: L.px(150), dir: 90, win: false, joint: Math.max(2, L.px(2.4)) });

  // ---- name band (walnut + holly letters)
  const N = R.nm;
  const ng = svg('g', { 'data-name': 'Name band' }, P.screen);
  const band = piece(P, ng, { d: rrect(N.x, N.y, N.w, N.h, L.px(12)), species: 'walnut', angle: 0, seed: 74, name: 'Name band (walnut)', at: tVas - 0.15, dur: 0.4, dist: L.px(80), dir: 0, shade: 'br', shadeAmt: 0.3 });
  const ns = L.px(R.nmSize);
  const vas = piece(P, ng, R.twoLine
    ? { text: { str: 'VASILI', x: N.x + N.w / 2, y: N.y + N.h * 0.44, size: ns, anchor: 'middle', ls: '0.08em' }, species: 'holly', seed: 75, name: 'Name · VASILI', at: tVas, dur: 0.36, dist: L.px(60), dir: 0, win: false }
    : { text: { str: 'VASILI', x: N.x + L.px(44), y: N.y + N.h * 0.5 + ns * 0.35, size: ns, ls: '0.06em' }, species: 'holly', seed: 75, name: 'Name · VASILI', at: tVas, dur: 0.36, dist: L.px(60), dir: 0, win: false });
  const ark = piece(P, ng, R.twoLine
    ? { text: { str: 'ARKHIPOV', x: N.x + N.w / 2, y: N.y + N.h * 0.88, size: ns, anchor: 'middle', ls: '0.08em' }, species: 'holly', seed: 76, name: 'Name · ARKHIPOV', at: tArk, dur: 0.36, dist: L.px(60), dir: 0, win: false }
    : { text: { str: 'ARKHIPOV', x: N.x + N.w - L.px(44), y: N.y + N.h * 0.5 + ns * 0.35, size: ns, anchor: 'end', ls: '0.06em' }, species: 'holly', seed: 76, name: 'Name · ARKHIPOV', at: tArk, dur: 0.36, dist: L.px(60), dir: 180, win: false });

  // ---- 1962 ── forty years ── 2002 (ebony letters, a stringing strip pushed along the groove)
  const T = R.tl, ts = L.px(T.size);
  const y62 = piece(P, P.screen, { text: { str: '1962', x: T.x0, y: T.y, size: ts, ls: '0.04em' }, species: 'ebony', seed: 77, name: 'Year 1962', at: tWorld, dur: 0.36, dist: L.px(50), dir: 0, win: false });
  const y02 = piece(P, P.screen, { text: { str: '2002', x: T.x1, y: T.y, size: ts, anchor: 'end', ls: '0.04em' }, species: 'ebony', seed: 78, name: 'Year 2002', at: tLater, dur: 0.36, dist: L.px(50), dir: 180, win: false });
  const gap = ts * 2.15;
  const line = stringing(P, P.screen, `M${T.x0 + gap} ${T.y - ts * 0.34}H${T.x1 - gap}`, { w: 5, species: 'ebony', name: 'Forty-year stringing', at: tLater - 0.05, dur: tLater - tForty - 0.05 });
  const acc = plate(P, P.screen, { x: R.acc.x, y: R.acc.y, text: 'vote as told in later accounts', size: L.px(L.pick({ landscape: 28, portrait: 28 })), anchor: 'end', name: 'Hedge plate (brass)', at: tLater + 0.25 });

  // ---- sound: drop before the NO, one heavy seat, the cloth of the polish
  ctx.ambience('sea-water-close-01', { from: 0, to: tNo - 0.55, lu: -20, fade: 0.4 });
  ctx.sfx('inlay-tap', tVas + 2 * F, { lu: -16 });
  ctx.sfx('inlay-seat', tNo + 2 * F, { lu: -5 });
  ctx.sfx('cloth-jacket-01', tNo + 0.35, { lu: -21 });
  ctx.sfx('inlay-tap', tLater + 2 * F, { lu: -15 });

  return {
    update(t) {
      P.wipe(t, 0, 0.45);
      // slow push toward the plaque, settling after the NO
      const k = ez.camera(progress(t, 0, tNo + 0.8));
      const z = 1 + 0.035 * k + 0.003 * t;
      const fx = L.pick({ landscape: W * 0.5, portrait: W * 0.5 }), fy = H * 0.45;
      P.world.setAttribute('transform', `translate(${(fx * (1 - z)).toFixed(2)} ${(fy * (1 - z)).toFixed(2)}) scale(${z.toFixed(5)})`);
      fig.update(t);
      insert.update(t); no.update(t);
      band.update(t); vas.update(t); ark.update(t);
      y62.update(t); line.update(t); y02.update(t); acc.update(t);
      P.sheenAt(t, tNo + 0.3, 1.6);
    },
  };
}
