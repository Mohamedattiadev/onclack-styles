// 1 · HOOK. 1A: worm's-eye of the operator's fists on the periscope handles, thrust at the lens; "1962" echo-stacks.
// Dive through the eyepiece → 1B: the boat, far and tiny, lunges at the lens from the deep; Cuba sits on the surface.
// intent: KNOW date + a Soviet boat hides near Cuba · FEEL pressure, curiosity · SEE the hull lunging out of the field.
// truth: VO/RC (toy reconstruction; B-59 shape simplified, not to scale).
import { el, clamp, spring, springs } from '/onclack-styles/engine/lib/anim.js';
import { C, F, wordT, thrust, easeIn, layer, field, grain, echo, tag, popIn, doodleLayer, diveMask, bubbles, toyText } from '../shared/toy.js';
import { PERI, periscope, SUB34, sub34, ISLE, island, surfaceBand } from '../shared/props.js';

export default function (root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, u = L.px(1), port = L.portrait;
  const T = {
    oct: wordT(ctx, 'October', 0, 0.58) - 2 * F,
    nine: wordT(ctx, 'nineteen', 0, 2.07) - 2 * F,
    sixty: wordT(ctx, 'sixty-two', 0, 2.61) - 2 * F,
    soviet: wordT(ctx, 'Soviet', 0, 3.79) - 2 * F,
    sub: wordT(ctx, 'submarine', 0, 4.3) - 2 * F,
    deep: wordT(ctx, 'deep', 0, 5.42) - 2 * F,
    cuba: wordT(ctx, 'Cuba', 0, 6.52) - 2 * F,
  };
  const dive0 = T.sixty + 0.36, dive1 = dive0 + 0.5; // push into the eyepiece
  const open0 = dive1 - 0.18, open1 = open0 + 0.42; // next shot opens inside the lens

  // ---------------- sound (natural only) ----------------
  ctx.sfx('cloth-jacket-01', 0.05, { lu: -16 });
  ctx.sfx('cloth-shake-01', dive0 + 0.12, { lu: -17 });
  ctx.ambience('sea-water-close-01', { from: open0 - 0.4, to: ctx.duration, lu: -15 });
  ctx.sfx('door-creak-01', T.sub + 0.15, { lu: -21 });

  // ================= 1A periscope =================
  const A = el('div', { 'data-name': '1A Periscope shot', style: { position: 'absolute', inset: '0', zIndex: 1, overflow: 'hidden' } }, root);
  field(A, L, 1);
  const rigH = port ? 1.3 * W * (PERI.h / PERI.w) : 1.15 * H;
  const rigW = rigH * (PERI.w / PERI.h);
  const res = Math.min(1.25, (rigW * 1.6) / PERI.w);
  const rig = layer(A, periscope(res), '1A Periscope + fists (thrust)', rigW, rigH, 5);
  const eyeHome = port ? [0.5 * W, 0.56 * H] : [0.5 * W, 0.45 * H];
  const zRig = (t) => {
    let z = thrust(t, -0.25, 1.6, 1.0, springs.gentle) + thrust(t, T.sixty, 0, -0.08, springs.snappy);
    if (t > dive0) z *= 1 - 0.91 * easeIn(clamp((t - dive0) / (dive1 - dive0)));
    return z;
  };
  const eyeAt = (t) => {
    const p = easeIn(clamp((t - dive0) / (dive1 - dive0)));
    return [eyeHome[0], eyeHome[1] + (H / 2 - eyeHome[1]) * p];
  };
  const lensR = (t) => (PERI.lensR / PERI.w) * rigW / zRig(t);

  // date: "27 OCT" then "1962" echo-stacked on its words
  const big = L.px(port ? 128 : 150);
  const dTxt = el('div', { 'data-name': '1A Date day', style: { ...toyText(big), left: L.safe.x + 'px', top: (port ? 0.1 * H : 0.2 * H) + 'px', zIndex: 600 } }, A, '27 OCT');
  const yr = port
    ? echo(A, '1962', { x: L.safe.x, y: 0.1 * H + big * 1.02, size: big, times: [T.nine, T.sixty, T.sixty + 4 * F], name: '1A Year echo' })
    : echo(A, '1962', { x: L.safe.x + L.safe.w, y: 0.2 * H, size: big, times: [T.nine, T.sixty, T.sixty + 4 * F], align: 'right', name: '1A Year echo' });

  // ================= 1B the boat =================
  const B = el('div', { 'data-name': '1B Boat shot', style: { position: 'absolute', inset: '0', zIndex: 2, overflow: 'hidden', visibility: 'hidden' } }, root);
  field(B, L, 2);
  const bandH = (port ? 0.13 : 0.17) * H;
  const band = layer(B, surfaceBand(W, bandH, 0.5, 5), '1B Sea surface (from below)', W, bandH, 2);
  const isleW = (port ? 0.34 : 0.17) * W, isleH = isleW * (ISLE.h / ISLE.w);
  const isle = layer(B, island(Math.min(2, (isleW * 1.3) / ISLE.w)), '1B Cuba (toy island)', isleW, isleH, 3);
  const isleX = port ? 0.3 * W : 0.24 * W;
  const bub = bubbles(B, L, 7, port ? 10 : 14, { y0: 0.3, y1: 1 });
  const subW = (port ? 1.35 : 0.86) * W, subH = subW * (SUB34.h / SUB34.w);
  const sub = layer(B, sub34(Math.min(1.1, (subW * 1.05) / SUB34.w)), '1B Submarine B-59 (thrust)', subW, subH, 5);
  const vp = [0.5 * W, 0.44 * H];
  const bowEnd = port ? [0.42 * W, 0.55 * H] : [0.4 * W, 0.6 * H];
  const zEnd = 0.92;
  const X = [(bowEnd[0] - vp[0]) * zEnd, (bowEnd[1] - vp[1]) * zEnd];
  const zSub = (t) => thrust(t, T.soviet - 0.15, 6.5, zEnd, springs.heavy) - 0.06 * clamp((t - T.sub) / (ctx.duration - T.sub));
  const sinkY = (t) => H * 0.05 * spring(t - T.deep, springs.gentle);
  const bowAt = (t) => { const z = zSub(t); return [vp[0] + X[0] / z, vp[1] + X[1] / z + sinkY(t)]; };
  const camLift = (t) => -H * 0.035 * spring(t - T.deep, springs.gentle); // camera tilts down with the dive

  const subTag = tag(B, 'B-59 <span style="font-weight:500;opacity:.8">· Soviet submarine</span>', {
    x: L.safe.x, y: port ? 0.71 * H : L.safe.y + L.safe.h - L.px(56), size: L.px(port ? 36 : 34), name: '1B Boat label',
  });
  const cubaTag = tag(B, 'Cuba', { x: isleX + isleW * 0.55, y: port ? bandH + L.px(30) : bandH + L.px(26), size: L.px(port ? 40 : 34), name: '1B Cuba label' });

  // ================= marks + grain =================
  const D = doodleLayer(root, L);
  D.add('burst', T.sixty, () => eyeAt(T.sixty), L.px(port ? 200 : 170), 3, 3, '1A burst on 1962');
  D.add('chevrons', T.deep, () => { const [x, y] = bowAt(T.deep + 0.2); return [x + L.px(port ? 120 : 260), y + L.px(port ? 330 : 250)]; }, L.px(80), 4, 3, '1B deep chevrons');
  D.add('ring', T.cuba, () => [isleX + isleW * 0.5, bandH * 0.3 + isleH * 0.6 + camLift(T.cuba)], isleW * 0.62, 5, 3, '1B ring on Cuba');
  const gr = grain(root, L);

  return {
    update(t) {
      // ---- 1A
      const showA = t < open1 + F;
      A.style.display = showA ? '' : 'none';
      if (showA) {
        const z = zRig(t), [ex, ey] = eyeAt(t);
        rig.set(ex, ey, 1 / z, 0.5, PERI.eye[1] / PERI.h, -1.5 + 1.5 * spring(t + 0.25, springs.gentle), 16, L.px(1500));
        popIn(dTxt, t, T.oct);
        yr.update(t);
      }
      // ---- 1B (opens inside the lens)
      const [lx, ly] = eyeAt(open0);
      diveMask(B, L, t, open0, open1, lensR(open0), lx, ly);
      if (t >= open0) {
        const lift = camLift(t);
        band.set(0, lift, 1, 0, 0);
        isle.set(isleX, bandH * 0.3 + lift, 1, 0, 0);
        const z = zSub(t), [bx, by] = bowAt(t);
        sub.set(bx, by, 1 / z, SUB34.bow[0] / SUB34.w, SUB34.bow[1] / SUB34.h, -2 + 2 * spring(t - T.soviet, springs.heavy), 14, L.px(900), 38);
        bub(t);
        cubaTag.style.marginTop = lift + 'px';
      }
      popIn(subTag, t >= open0 ? t : -1, T.sub);
      popIn(cubaTag, t >= open0 ? t : -1, T.cuba);
      D.update(t);
      gr(t);
    },
  };
}
