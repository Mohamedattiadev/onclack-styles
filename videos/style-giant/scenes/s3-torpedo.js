// 3 · TURN. 3A: the torpedo slides at the lens flank-first on its cradles (nose turned away, toward the tube doors —
// never aimed at the viewer). Hard cut in the pause → 3B: worm's-eye of three officers: three pairs of boots stomp in,
// toy-scale (huge boots, tiny faceless heads). Two lean in: yellow checks, "YES" echo-stacks twice. The third stands apart.
// intent: KNOW one nuclear torpedo, 3 must agree, 2 say yes · FEEL dread · SEE three giant pairs of boots.
// truth: RC/VO (the vote is known from later accounts; figures are symbols, no likeness).
import { el, clamp, spring, springs } from '/onclack-styles/engine/lib/anim.js';
import { C, F, wordT, thrust, layer, field, grain, echo, tag, popIn, doodleLayer, smear, bake, rgba, mix } from '../shared/toy.js';
import { TORP, torpedo, OFF, officer } from '../shared/props.js';

export default function (root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, port = L.portrait;
  const T = {
    nuclear: wordT(ctx, 'nuclear', 0, 1.16) - 2 * F,
    fire: wordT(ctx, 'fire', 0, 2.58) - 2 * F,
    three: wordT(ctx, 'three', 0, 3.19) - 2 * F,
    officers: wordT(ctx, 'officers', 0, 3.54) - 2 * F,
    agree: wordT(ctx, 'agree', 0, 4.29) - 2 * F,
    two: wordT(ctx, 'Two', 0, 4.97) - 2 * F,
    yes: wordT(ctx, 'yes', 0, 5.48) - 2 * F,
  };
  const cut = T.three - 0.1;

  // ---------------- sound ----------------
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -19, fade: 0.3 });
  ctx.sfx('footsteps-metal-deck-01', cut + F, { lu: -11 });
  ctx.sfx('cloth-jacket-01', T.yes, { lu: -17 });
  ctx.sfx('door-creak-01', 0.2, { lu: -20 });

  // ================= 3A torpedo =================
  const A = el('div', { 'data-name': '3A Torpedo shot', style: { position: 'absolute', inset: '0', zIndex: 1, overflow: 'hidden' } }, root);
  field(A, L, 5);
  // tube doors on the far bulkhead (aerial perspective: lighter, low contrast)
  const tubes = bake(W, H, 0.4, (g) => {
    const cs = port ? [[0.2, 0.2], [0.42, 0.14], [0.2, 0.34]] : [[0.1, 0.24], [0.21, 0.2], [0.1, 0.46], [0.21, 0.42]];
    for (const [fx, fy] of cs) {
      const x = fx * W, y = fy * H, r = (port ? 0.09 : 0.055) * W;
      g.fillStyle = rgba(mix(C.field, C.fieldDeep, 0.6), 0.6); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = rgba(C.fieldLite, 0.5); g.lineWidth = r * 0.16; g.beginPath(); g.arc(x, y, r * 1.05, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = rgba(mix(C.fieldLite, C.cream, 0.2), 0.5); g.lineWidth = r * 0.08; g.beginPath(); g.arc(x, y, r * 1.08, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    }
  });
  layer(A, tubes, '3A Tube doors (far bulkhead)', W, H, 2).set(0, 0, 1, 0, 0);
  const tw = (port ? 1.9 : 0.95) * W, th = tw * (TORP.h / TORP.w);
  const torp = layer(A, torpedo(Math.min(1.05, (tw * 1.15) / TORP.w)), '3A Torpedo on cradles (thrust)', tw, th, 5);
  const tHome = port ? [0.5 * W, 0.5 * H] : [0.4 * W, 0.5 * H];
  const zT = (t) => thrust(t, -0.12, 3.2, 1.0, springs.gentle) - 0.05 * clamp((t - 1.2) / 2);
  const xT = (t) => thrust(t, -0.12, 0.22 * W, 0, springs.gentle);
  const nTag = tag(A, 'Nuclear torpedo', { x: L.safe.x, y: port ? 0.71 * H : L.safe.y + L.safe.h - L.px(56), size: L.px(port ? 38 : 36), name: '3A Torpedo label' });
  const rot = port ? -68 : -4;

  // ================= 3B officers =================
  const B = el('div', { 'data-name': '3B Officers shot', style: { position: 'absolute', inset: '0', zIndex: 2, overflow: 'hidden', display: 'none' } }, root);
  field(B, L, 6);
  const figs = [
    { pose: 'behind', lean: -26, seed: 1, name: '3B Officer 1 (says yes)' },
    { pose: 'crossed', lean: 18, seed: 2, name: '3B Officer 2 (says yes)' },
    { pose: 'sides', lean: 0, seed: 3, name: '3B Officer 3 (Arkhipov, apart)' },
  ].map((f, i) => {
    const hgt = (port ? [0.66, 0.44, 0.54] : [1.12, 0.78, 0.95])[i] * H, wd = hgt * (OFF.w / OFF.h);
    const feet = port ? [[0.27, 0.9], [0.6, 0.6], [0.8, 0.79]][i] : [[0.23, 1.02], [0.5, 0.84], [0.8, 0.96]][i];
    const ly = layer(B, officer(Math.min(1.1, (wd * 1.2) / OFF.w), f), f.name, wd, hgt, [5, 3, 4][i]);
    const t0 = [cut - 0.1, T.three + 0.02, T.officers][i];
    return { ...f, ly, wd, hgt, feet: [feet[0] * W, feet[1] * H], t0 };
  });
  const zF = (f, t) => thrust(t, f.t0, 1.7, 1, springs.default);
  const dropY = (f, t) => -H * 0.07 * (1 - spring(t - f.t0, springs.default));
  const nod = (f, i, t) => (i < 2 ? (i ? -1 : 1) * 3.2 * spring(t - (i ? T.yes : T.two + 0.1), springs.default) : 0);
  const headAt = (f, t) => {
    const s = 1 / zF(f, t);
    return [f.feet[0] + ((300 + f.lean * 1.6) / OFF.w - 0.5) * f.wd * s, f.feet[1] + dropY(f, t) - (0.97 - 230 / OFF.h) * f.hgt * s];
  };
  const agreeTag = tag(B, '3 must agree', { x: port ? L.safe.x : L.safe.x + L.safe.w, y: port ? 0.1 * H : L.safe.y + L.safe.h - L.px(56), size: L.px(port ? 40 : 36), name: '3B Rule label', align: port ? 'left' : 'right' });
  const yes = port
    ? echo(B, 'YES', { x: L.safe.x, y: 0.16 * H, size: L.px(140), times: [T.yes, T.yes + 4 * F], name: '3B Yes echo' })
    : echo(B, 'YES', { x: 0.57 * W, y: 0.05 * H, size: L.px(128), times: [T.yes, T.yes + 4 * F], name: '3B Yes echo' });

  // ================= marks, smear, grain =================
  const D = doodleLayer(root, L);
  D.add('ring', T.nuclear, () => [tHome[0] - xT(T.nuclear) * 0 - tw * 0.1 / zT(T.nuclear), tHome[1]], tw * 0.17, 41, 3, '3A ring on the warhead');
  D.add('check', T.two, () => { const [x, y] = headAt(figs[0], T.two); return [x + L.px(10), y - L.px(port ? 70 : 110)]; }, L.px(port ? 46 : 56), 42, 3, '3B check officer 1');
  D.add('check', T.yes, () => { const [x, y] = headAt(figs[1], T.yes); return [x, y - L.px(port ? 60 : 80)]; }, L.px(port ? 40 : 46), 43, 3, '3B check officer 2');
  D.add('ticks', T.three + 0.04, () => [figs[1].feet[0], figs[1].feet[1] + L.px(30)], L.px(90), 44, 3, '3B stomp ticks');
  const sm = smear(root, L, 33, [C.torp, C.fieldLite, C.cream, C.hull], { angle: 0.1 });
  const gr = grain(root, L);

  return {
    update(t) {
      const inA = t < cut;
      A.style.display = inA ? '' : 'none';
      B.style.display = inA ? 'none' : '';
      if (inA) {
        const z = zT(t);
        torp.set(tHome[0] + xT(t), tHome[1], 1 / z, 0.42, 0.55, rot, 16, L.px(1000), port ? -40 : -52);
        popIn(nTag, t, T.nuclear);
      } else {
        figs.forEach((f, i) => {
          const z = zF(f, t);
          f.ly.set(f.feet[0], f.feet[1] + dropY(f, t), 1 / z, 0.5, 0.97, nod(f, i, t), 8, L.px(2200), [14, -10, 22][i]);
          f.ly.el.style.visibility = t >= f.t0 ? 'visible' : 'hidden';
        });
        popIn(agreeTag, t, T.agree, port ? 'left' : 'right');
        yes.update(t);
      }
      D.update(t);
      sm(t);
      gr(t);
    },
  };
}
