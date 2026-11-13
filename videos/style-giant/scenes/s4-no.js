// 4 · PEAK → RESOLUTION. 4A: Arkhipov from below, his arm reaching at the lens like every other object in the film.
// On "no" the hand PULLS BACK (the only retreat in the video) and everything stops: the NO is uncovered where the hand
// was. Hold. Then the camera rises through the open hatch above him → 4B: open air, the boat surfaced and small,
// the camera retreating (the opposite of the thrust): 1962 rolls to 2002.
// intent: KNOW Arkhipov said no; the world learned it ~40 years later · FEEL relief, awe · SEE the hand withdrawn.
// truth: RC/VO (no likeness: faceless toy figure; the name card carries the identity).
import { el, svg, clamp, spring, springs } from '/onclack-styles/engine/lib/anim.js';
import { C, F, wordT, layer, field, grain, tag, popIn, doodleLayer, diveMask, toyText, easeIn, bake, paint, canvas, rgba, rng } from '../shared/toy.js';
import { OFF, officer, HAND, reachHand, HATCH, hatch, SUBSIDE, subSide, seaBand } from '../shared/props.js';

export default function (root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, port = L.portrait;
  const T = {
    vasili: wordT(ctx, 'Vasili', 0, 0.87) - 2 * F,
    no: wordT(ctx, 'no', 0, 2.29) - 2 * F,
    world: wordT(ctx, 'world', 0, 3.33) - 2 * F,
    forty: wordT(ctx, 'forty', 0, 4.39) - 2 * F,
    later: wordT(ctx, 'later', 0, 4.99) - 2 * F,
  };
  const dive0 = T.no + 1.12, dive1 = dive0 + 0.5;
  const open0 = dive1 - 0.22, open1 = open0 + 0.45;

  // ---------------- sound: near-silence before the NO, then open air ----------------
  ctx.sfx('breath-close-01', T.no - 0.55, { lu: -24 });
  ctx.sfx('cloth-jacket-01', T.no + 0.04, { lu: -15 });
  ctx.ambience('sea-wash-calm-01', { from: open0 - 0.35, to: ctx.duration, lu: -14, fade: 0.6 });

  // ================= 4A Arkhipov =================
  const A = el('div', { 'data-name': '4A Arkhipov shot', style: { position: 'absolute', inset: '0', zIndex: 1, overflow: 'hidden' } }, root);
  const cam = el('div', { 'data-name': '4A Camera', style: { position: 'absolute', inset: '0', transformOrigin: '0 0' } }, A);
  field(cam, L, 7);
  const hw = (port ? 0.62 : 0.36) * W, hh = hw * (HATCH.h / HATCH.w);
  const hatchL = layer(cam, hatch(Math.min(1.4, (hw * 1.5) / HATCH.w)), '4A Open hatch + ladder', hw, hh, 2);
  const hatchAt = port ? [0.5 * W, 0.13 * H] : [0.52 * W, 0.12 * H];
  hatchL.set(hatchAt[0], hatchAt[1], 1, HATCH.c[0] / HATCH.w, HATCH.c[1] / HATCH.h);
  const bodyH = (port ? 0.95 : 1.5) * H, bodyW = bodyH * (OFF.w / OFF.h);
  const feet = port ? [0.6 * W, 1.08 * H] : [0.62 * W, 1.5 * H];
  const body = layer(cam, officer(Math.min(1.0, (bodyW * 1.15) / OFF.w), { seed: 3, pose: 'reach', lean: 0 }), '4A Arkhipov (faceless)', bodyW, bodyH, 4);
  body.set(feet[0], feet[1], 1, 0.5, 0.97, 0, 6, L.px(2400));
  const S = [feet[0] + (OFF.shoulderL[0] / OFF.w - 0.5) * bodyW, feet[1] - (0.97 - OFF.shoulderL[1] / OFF.h) * bodyH];
  const headY = feet[1] - (0.97 - OFF.head[1] / OFF.h) * bodyH;

  // the NO, uncovered where the hand was (single copy: no echo, no doodle — stillness)
  const noSize = L.px(port ? 260 : 280);
  const noPos = port ? [L.safe.x, 0.2 * H] : [L.safe.x, 0.1 * H];
  const no = el('div', { 'data-name': '4A NO', style: { ...toyText(noSize), left: noPos[0] + 'px', top: noPos[1] + 'px', zIndex: 5 } }, cam, 'NO');

  // arm + hand: sleeve = SVG polygon with a painted pattern (DOM, so every frame commits at once); hand = baked layer
  const tile = bake(220, 220, 1, (g) => {
    g.fillStyle = C.navy; g.fillRect(0, 0, 220, 220);
    const R = rng(301); g.lineCap = 'round';
    for (let i = 0; i < 160; i++) { const x = R() * 220, y = R() * 220, a = -0.9 + (R() - 0.5) * 0.6, l = 10 + R() * 22; g.strokeStyle = rgba(R() < 0.5 ? C.navyLite : '#0E1220', 0.25 + R() * 0.3); g.lineWidth = 2 + R() * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  });
  const armSvg = svg('svg', { 'data-name': '4A Reaching arm (pulls back on NO)', width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;left:0;top:0;z-index:6;overflow:visible' }, cam);
  const defs = svg('defs', {}, armSvg);
  const ptn = svg('pattern', { id: 'giant-sleeve', patternUnits: 'userSpaceOnUse', width: 220, height: 220 }, defs);
  svg('image', { href: tile.toDataURL(), width: 220, height: 220 }, ptn);
  const lgr = svg('linearGradient', { id: 'giant-sleeve-shade', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
  svg('stop', { offset: '0', 'stop-color': C.navyLite, 'stop-opacity': 0.3 }, lgr);
  svg('stop', { offset: '0.5', 'stop-color': C.navyLite, 'stop-opacity': 0 }, lgr);
  svg('stop', { offset: '1', 'stop-color': '#000000', 'stop-opacity': 0.35 }, lgr);
  const armShadow = svg('polygon', { fill: rgba('#000000', 0.14) }, armSvg);
  const armPoly = svg('polygon', { fill: 'url(#giant-sleeve)' }, armSvg);
  const armShade = svg('polygon', { fill: 'url(#giant-sleeve-shade)' }, armSvg);
  const handCss = (port ? 0.3 : 0.17) * W;
  const hk = handCss / HAND.w;
  const handL = layer(cam, reachHand(Math.min(2.2, (handCss * 2.2) / HAND.w)), '4A Reaching hand', handCss, handCss * (HAND.h / HAND.w), 7);
  const reach = port ? { x: 0.34 * W, y: 0.55 * H, z: 0.55 } : { x: 0.3 * W, y: 0.56 * H, z: 0.52 };
  const rest = { x: S[0] - L.px(port ? 30 : 46), y: S[1] + bodyH * 0.2, z: 3.6 };
  const handState = (t) => {
    const r = spring(t - T.no, springs.heavy);
    const zr = reach.z - 0.05 * clamp(t / Math.max(0.1, T.no)); // keeps pushing in until the NO
    return { x: reach.x + (rest.x - reach.x) * r, y: reach.y + (rest.y - reach.y) * r, z: zr + (rest.z - zr) * r, r };
  };
  const pts = (arr) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const drawArm = (t) => {
    const h = handState(t);
    const s = 1 / h.z;
    const dx = S[0] - h.x, dy = S[1] - h.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const w0 = L.px(port ? 36 : 40), w1 = Math.max(w0, HAND.w * 0.21 * hk * s);
    const quad = [[S[0] + nx * w0, S[1] + ny * w0], [h.x + nx * w1, h.y + ny * w1], [h.x - nx * w1, h.y - ny * w1], [S[0] - nx * w0, S[1] - ny * w0]];
    armShadow.setAttribute('points', pts(quad.map(([x, y], i) => [x + L.px(i === 1 || i === 2 ? 40 : 30), y + L.px(i === 1 || i === 2 ? 60 : 40)])));
    armPoly.setAttribute('points', pts(quad));
    armShade.setAttribute('points', pts(quad));
    const th = (Math.atan2(dy, dx) - Math.PI / 2) * 180 / Math.PI;
    handL.set(h.x, h.y, s, 0.5, (HAND.wrist[1] + 30) / HAND.h, th);
  };

  const nameTag = tag(A, 'Vasili Arkhipov<br><span style="font-weight:500;font-size:.62em;letter-spacing:.06em">flotilla chief of staff · on board B-59</span>', {
    x: port ? L.safe.x : L.safe.x + L.safe.w, y: port ? 0.725 * H : L.safe.y + L.safe.h - L.px(118), size: L.px(port ? 44 : 44), name: '4A Name card', align: port ? 'left' : 'right',
  });

  // camera: hold; after the NO's stillness, rise and dive through the open hatch
  const camAt = (t) => {
    const p = easeIn(clamp((t - dive0) / (dive1 - dive0)));
    const s = 1 + 7 * p;
    const cx = hatchAt[0] + (W / 2 - hatchAt[0]) * Math.min(1, p * 3), cy = hatchAt[1] + (H / 2 - hatchAt[1]) * Math.min(1, p * 3);
    return { s, tx: cx - hatchAt[0] * s, ty: cy - hatchAt[1] * s, hx: cx, hy: cy };
  };

  // ================= 4B open air, 2002 =================
  const B = el('div', { 'data-name': '4B Open air shot', style: { position: 'absolute', inset: '0', zIndex: 2, overflow: 'hidden', visibility: 'hidden' } }, root);
  const bw = el('div', { 'data-name': '4B World (camera retreats)', style: { position: 'absolute', inset: '0', transformOrigin: '50% 60%' } }, B);
  field(bw, L, 8);
  const horizon = (port ? 0.6 : 0.64) * H;
  layer(bw, seaBand(W, H - horizon + L.px(20), 0.5, 401), '4B Sea', W, H - horizon + L.px(20), 2).set(0, horizon, 1, 0, 0);
  const sw = (port ? 0.98 : 0.62) * W, sh = sw * (SUBSIDE.h / SUBSIDE.w);
  layer(bw, subSide(Math.min(1.2, (sw * 1.3) / SUBSIDE.w)), '4B B-59 surfaced (small, far)', sw, sh, 3).set(port ? 0.48 * W : 0.56 * W, horizon + L.px(port ? 70 : 60), 1, 0.5, SUBSIDE.water / SUBSIDE.h);
  const no2 = el('div', { 'data-name': '4B NO (kept)', style: { ...toyText(L.px(port ? 200 : 190)), left: L.safe.x + 'px', top: (port ? 0.1 * H : 0.12 * H) + 'px', zIndex: 5 } }, B, 'NO');
  const yrSize = L.px(port ? 150 : 170);
  const yr = el('div', { 'data-name': '4B Year counter', style: { ...toyText(yrSize), zIndex: 5, ...(port ? { left: L.safe.x + 'px', top: 0.25 * H + 'px' } : { right: W - (L.safe.x + L.safe.w) + 'px', top: 0.12 * H + 'px' }) } }, B, '1962');
  const laterTag = tag(B, '40 years later', { x: port ? L.safe.x : L.safe.x + L.safe.w, y: port ? 0.25 * H + yrSize * 0.98 : 0.12 * H + yrSize * 0.98, size: L.px(port ? 40 : 36), name: '4B Later label', align: port ? 'left' : 'right' });

  const D = doodleLayer(root, L);
  D.add('ring', T.vasili, () => [feet[0], headY - L.px(10)], L.px(port ? 120 : 130), 51, 3, '4A ring on Arkhipov');
  const gr = grain(root, L);

  return {
    update(t) {
      const showA = t < open1 + F;
      A.style.display = showA ? '' : 'none';
      if (showA) {
        const c = camAt(t);
        cam.style.transform = `translate(${c.tx.toFixed(2)}px,${c.ty.toFixed(2)}px) scale(${c.s.toFixed(4)})`;
        drawArm(t);
        no.style.visibility = t >= T.no ? 'visible' : 'hidden';
        popIn(nameTag, t, T.vasili, port ? 'left' : 'right');
        nameTag.style.opacity = t > dive0 ? String(1 - clamp((t - dive0) / 0.2)) : '1';
      }
      const c0 = camAt(open0);
      diveMask(B, L, t, open0, open1, (HATCH.r[0] / HATCH.w) * hw * c0.s * 0.92, c0.hx, c0.hy);
      if (t >= open0) {
        bw.style.transform = `scale(${(1.08 - 0.08 * spring(t - open0, springs.heavy)).toFixed(4)})`;
        const p = clamp((t - T.forty) / (T.later - T.forty));
        const e = p * p * (3 - 2 * p);
        yr.textContent = String(Math.round(1962 + 40 * e));
      }
      popIn(laterTag, t >= open0 ? t : -1, T.later - 0.1, port ? 'left' : 'right');
      D.update(t);
      gr(t);
    },
  };
}
