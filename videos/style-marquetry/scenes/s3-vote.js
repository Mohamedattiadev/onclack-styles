// Panel 3 — THE VOTE (crisis, intensity 4)
// intent: KNOW a nuclear torpedo; firing needs 3 officers; 2 said yes · FEEL tension · SEE three dark figures on a
//         warm maple field; under each a slot is knifed out; two slots get holly inserts with ebony YES, the third
//         stays an EMPTY DARK WINDOW (the question carried into panel 4).
// truth: torpedo = RC/VO (generic T-5 shape, "yield approx." hedged); officers = VO figures, no faces; the vote is
//        known from later accounts and debated (said in panel 4's caption).
import { svg, progress } from '/onclack-styles/engine/lib/anim.js';
import { F, ez, panel, piece, plate, ground, wordT, rrect, JOINT } from '../shared/inlay.js';
import { officer } from '../shared/figures.js';

export default async function (root, ctx) {
  const P = await panel(root, ctx, { id: 's3' });
  const { L, W, H } = P;

  const tOn = wordT(ctx, 'On', 0, 0.35) - 2 * F;
  const tNuc = wordT(ctx, 'nuclear', 0, 1.16) - 2 * F;
  const tTorp = wordT(ctx, 'torpedo', 0, 1.56) - 2 * F;
  const tFire = wordT(ctx, 'fire', 0, 2.58) - 2 * F;
  const tThree = wordT(ctx, 'three', 0, 3.19) - 2 * F;
  const tOff = wordT(ctx, 'officers', 0, 3.54) - 2 * F;
  const tAgree = wordT(ctx, 'agree', 0, 4.29) - 2 * F;
  const tTwo = wordT(ctx, 'Two', 0, 4.97) - 2 * F;
  const tYes = wordT(ctx, 'yes', 0, 5.48) - 2 * F;

  ground(P, P.world, { species: 'maple', angle: 90, leaves: L.pick({ landscape: 5, portrait: 3 }), x: -L.px(60), y: -L.px(60), w: W + L.px(120), h: H + L.px(120), seed: 5, name: 'Maple field (book-matched)' });

  const R = L.pick({
    landscape: { tx: P.inner + L.px(64), ty: P.inner + L.px(132), ts: 104, tor: { x0: W * 0.47, x1: W - P.inner - L.px(70), y: P.inner + L.px(92), h: L.px(80) },
      cols: [0.25, 0.5, 0.75].map(f => W * f), feet: H - P.inner - L.px(200), fh: L.px(520), plY: H - P.inner - L.px(178), plW: L.px(300), plH: L.px(92), rkY: H - P.inner - L.px(68) },
    portrait: { tx: P.inner + L.px(40), ty: L.safe.y + L.px(150), ts: 112, tor: { x0: P.inner + L.px(40), x1: W - P.inner - L.px(40), y: L.safe.y + L.px(250), h: L.px(70) },
      cols: [0.205, 0.465, 0.725].map(f => W * f), feet: L.safe.y + L.px(1020), fh: L.px(540), plY: L.safe.y + L.px(1058), plW: L.px(240), plH: L.px(92), rkY: L.safe.y + L.px(1172) },
  });

  // ---- title inlay (ebony letters into maple)
  const title = piece(P, P.screen, { text: { str: 'NUCLEAR TORPEDO', x: R.tx, y: R.ty, size: L.px(R.ts), ls: '0.03em' }, species: 'ebony', seed: 31, name: 'Title · NUCLEAR TORPEDO', at: tNuc, dur: 0.4, dist: L.px(70), dir: 0 });

  // ---- torpedo: walnut body (grain along), padauk warhead, ebony fins, pear propeller
  const T = R.tor, tl = T.x1 - T.x0, th = T.h, cy = T.y;
  const tg = svg('g', { 'data-name': 'Torpedo (inlay)' }, P.world);
  const o = { at: tTorp, dur: 0.5, dist: L.px(240), dir: 0 };
  const xA = T.x0 + tl * 0.07, xW = T.x0 + tl * 0.72, xN = T.x1;
  const tp = [
    piece(P, tg, { d: `M${T.x0} ${cy - th * 0.62}L${xA + th * 0.2} ${cy - th * 0.28}L${xA + th * 0.2} ${cy + th * 0.28}L${T.x0} ${cy + th * 0.62}Z`, species: 'ebony', angle: 90, seed: 41, name: 'Fins', ...o }),
    piece(P, tg, { d: `M${xA} ${cy - th / 2}H${xW}V${cy + th / 2}H${xA}Q${xA - th * 0.3} ${cy} ${xA} ${cy - th / 2}Z`, species: 'walnut', angle: 0, seed: 42, name: 'Body (walnut, grain along)', shade: 'b', shadeAmt: 0.8, ...o }),
    piece(P, tg, { d: `M${xW} ${cy - th / 2}H${xN - th * 0.9}C${xN - th * 0.2} ${cy - th / 2} ${xN} ${cy - th * 0.15} ${xN} ${cy}C${xN} ${cy + th * 0.15} ${xN - th * 0.2} ${cy + th / 2} ${xN - th * 0.9} ${cy + th / 2}H${xW}Z`, species: 'padauk', angle: 0, seed: 43, name: 'Warhead (padauk)', shade: 'b', shadeAmt: 0.8, ...o }),
    piece(P, tg, { d: `M${T.x0 - th * 0.1} ${cy - th * 0.3}h${th * 0.16}v${th * 0.6}h${-th * 0.16}Z`, species: 'pear', angle: 90, seed: 44, name: 'Propeller', ...o }),
  ];
  for (const f of [0.3, 0.52]) tp.push(piece(P, tg, { d: `M${xA + (xW - xA) * f} ${cy - th / 2}h${L.px(5)}v${th}h${-L.px(5)}Z`, species: 'holly', angle: 90, seed: 45 + f, name: 'Section band (holly)', ...o }));
  const tPlate = plate(P, P.screen, { x: L.pick({ landscape: T.x1, portrait: W * 0.86 }), y: cy + th / 2 + L.px(18), text: 'T-5 · yield approx. 10 kt', size: L.px(L.pick({ landscape: 28, portrait: 28 })), anchor: 'end', name: 'Torpedo plate (brass)', at: tTorp + 0.35 });

  // ---- three officers (different poses), knife lines start on "fire", pieces seat on "officers"
  const OFF = [
    { pose: 'urge', name: 'Officer 1 · Captain', rank: 'CAPTAIN', vote: tTwo },
    { pose: 'crossed', name: 'Officer 2 · Political officer', rank: 'POLIT. OFFICER', vote: tYes },
    { pose: 'still', name: 'Officer 3 · Chief of staff', rank: 'CHIEF OF STAFF', vote: null },
  ];
  const figs = OFF.map((of, i) => officer(P, P.world, { x: R.cols[i], y: R.feet, h: R.fh * (i === 2 ? 1.02 : 1), pose: of.pose, name: of.name, seed: i + 1, at: tOff + 0.25 + i * 0.14, scoreFrom: tOn + 0.2 + i * 0.12, scoreDur: 1.0, winAt: tFire + i * 0.1, step: 0.035 }));

  // plaques: holly plaque with a slot knifed out on "agree"; YES inserts on "Two" / "yes"
  const plaques = OFF.map((of, i) => {
    const g = svg('g', { 'data-name': `Vote plaque ${i + 1}` }, P.screen);
    const x = R.cols[i] - R.plW / 2, y = R.plY;
    const pl = piece(P, g, { d: rrect(x, y, R.plW, R.plH, L.px(10)), species: 'walnut', angle: 0, seed: 50 + i, name: 'Plaque (walnut)', at: tOff + 0.5 + i * 0.1, dur: 0.36, dist: L.px(40), dir: -90 });
    const sx = x + L.px(14), sy = y + L.px(14), sw = R.plW - L.px(28), sh = R.plH - L.px(28);
    const slot = piece(P, g, { d: `M${sx} ${sy}h${sw}v${sh}h${-sw}Z`, species: 'holly', angle: 0, seed: 55 + i, name: of.vote ? 'YES insert (holly)' : 'Slot — still empty', at: of.vote ?? 999, dur: 0.34, dist: L.px(70), dir: 90, winAt: tAgree + i * 0.08, score: 0.25, scoreAt: tAgree - 0.3 + i * 0.08 });
    const yes = of.vote ? piece(P, g, { text: { str: 'YES', x: sx + sw / 2, y: sy + sh * 0.84, size: sh * 1.0, anchor: 'middle', ls: '0.12em' }, species: 'ebony', seed: 58 + i, name: 'YES (ebony letters)', at: of.vote, dur: 0.34, dist: L.px(70), dir: 90, win: false }) : null;
    const rk = plate(P, g, { x: R.cols[i], y: R.rkY, text: of.rank, size: L.px(L.pick({ landscape: 26, portrait: 24 })), anchor: 'middle', name: `Rank plate ${i + 1}`, at: tOff + 0.7 + i * 0.1, dist: L.px(40) });
    return { update: t => { pl.update(t); slot.update(t); yes?.update(t); rk.update(t); } };
  });

  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -24, fade: 0.8 });
  ctx.sfx('footsteps-metal-deck-01', tOn + 0.05, { lu: -17 });
  ctx.sfx('inlay-seat', tTorp + 2 * F, { lu: -10 });
  ctx.sfx('breath-close-01', tAgree + 0.25, { lu: -24, duration: 1.6, fadeIn: 0.2, fadeOut: 0.4 });
  ctx.sfx('inlay-tap', tTwo + 2 * F, { lu: -12 });
  ctx.sfx('inlay-tap', tYes + 2 * F, { lu: -12 });

  return {
    update(t) {
      P.wipe(t, 0, 0.45);
      const z = 1 + 0.004 * t;
      P.world.setAttribute('transform', `translate(${(W / 2 * (1 - z)).toFixed(2)} ${(H * 0.6 * (1 - z)).toFixed(2)}) scale(${z.toFixed(5)})`);
      title.update(t); tp.forEach(p => p.update(t)); tPlate.update(t);
      figs.forEach(f => f.update(t)); plaques.forEach(p => p.update(t));
      P.sheenAt(t, tYes + 0.35, 1.3);
    },
  };
}
