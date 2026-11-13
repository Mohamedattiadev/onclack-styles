// 4 · PEAK + resolution.
// 4A MCU, EYE, PUSH/s — "The third, Vasili Arkhipov, says no." The room dims (the maker turns down the room light),
//    only the third paper figure stays lit; the vote card's empty box takes a vermilion NO stamp on "no".
// 4B DISSOLVE (time passage) → WS, HI, PULL/s — "The world learned his name forty years later."
//    The whole model on the workbench: corrugated box, cut sea inside, offcuts, steel rule, pencil. Year tag rolls 1962 → 2002.
// Truth: RC (staged model, figures not portraits).
import { svg, el, glide, ease, progress, clamp, noise1, lerp } from '/onclack-styles/engine/lib/anim.js';
import { defs, makeCamera, grade, label, voteCard, wt, sceneIn, paper, poly, cut, rect, ellipse, band, shade, roundRect, officer, INK } from '../shared/kit.js';
import { ROOM } from './s3-room.js';
import { buildRoom } from './s3-room.js';
import { buildSea } from '../shared/sea.js';

function bench(root, L, W, H, u, P) {
  const view = el('div', { 'data-name': '4B Workbench view', style: { position: 'absolute', inset: 0, opacity: 0 } }, root);
  const d = defs(view, P + 'w');
  const cam = makeCamera(view, W, H, '4B Camera world');
  const pick = L.pick;
  const deskY = H * pick({ landscape: 0.5, portrait: 0.42 });
  // workshop wall (far, dark, soft)
  const wall = cam.layer('4B Workshop wall', 0.3);
  paper(wall, poly(rect(-W, -H, W * 3, deskY + H + 4)), { P: P + 'w', fill: '#2c2925', thick: 0, shadow: false, contact: false, light: 0.7 });
  // bench top + cutting mat
  const top = cam.layer('4B Bench top', 0.8, { margin: 0.6 });
  paper(top, poly(rect(-W, deskY, W * 3, H * 2)), { P: P + 'w', fill: '#5d4a36', rim: '#8a6d4d', thick: 5 * u, shadow: false, light: 0.8 });
  const mx = W * pick({ landscape: 0.08, portrait: 0.02 }), my = deskY + H * pick({ landscape: 0.07, portrait: 0.05 });
  const mw = W * pick({ landscape: 0.84, portrait: 0.96 }), mh = H * 0.8;
  // the mat lies flat: back edge narrower than the front, grid lines converge (a floor, not a wall)
  const ins = mw * 0.07, ML = v => [mx + ins * (1 - v), mx + mw - ins * (1 - v)], MY = v => my + mh * v;
  paper(top, poly(cut([[ML(0)[0], MY(0)], [ML(0)[1], MY(0)], [ML(1)[1], MY(1)], [ML(1)[0], MY(1)]], 3100, 0.5, 30)), { P: P + 'w', fill: '#3d4a4b', rim: '#64706f', thick: 3 * u, shadow: { dx: 10 * u, dy: 6 * u, b: 4, op: 0.4 }, name: '4B Cutting mat' });
  for (let i = 1; i < 24; i++) { const f = i / 24; svg('path', { d: `M${lerp(ML(0)[0], ML(0)[1], f)},${MY(0) + 3 * u}L${lerp(ML(1)[0], ML(1)[1], f)},${MY(1)}`, stroke: '#55625f', 'stroke-width': 1.1 * u, opacity: 0.55 }, top); }
  for (let i = 1; i < 16; i++) { const v = (i / 16) ** 1.5; svg('path', { d: `M${ML(v)[0]},${MY(v)}L${ML(v)[1]},${MY(v)}`, stroke: '#55625f', 'stroke-width': 1.1 * u, opacity: 0.55 }, top); }

  // the model box (subject plane): kraft corrugated card, front opening, lit top face
  const bl = cam.layer('4B The model box', 1.0);
  const bw = W * pick({ landscape: 0.5, portrait: 0.84 }), bh = H * pick({ landscape: 0.5, portrait: 0.3 });
  const bx = W / 2 - bw / 2 - W * pick({ landscape: 0.03, portrait: 0 }), by = deskY + H * pick({ landscape: 0.1, portrait: 0.12 }) - bh * 0.35;
  const lid = bh * 0.07, kraft = '#9a7a52';
  svg('path', { d: poly(rect(bx + 30 * u, by + bh - 6 * u, bw, 26 * u)), fill: '#0a0806', opacity: 0.5, filter: `url(#${P}wb12)` }, bl); // cast shadow on the mat
  paper(bl, poly([[bx, by], [bx + bw, by], [bx + bw - lid * 0.6, by - lid], [bx + lid * 0.6, by - lid]]), { P: P + 'w', fill: shade(kraft, 0.22), thick: 0, shadow: false, contact: false, name: '4B Box top (lit)' });
  const inset = bw * 0.05, ow = bw - inset * 2, oh = bh - inset * 2;
  // the sea, built inside the opening (same model as shot 1, smaller)
  const hole = el('div', { 'data-name': '4B Inside the box (the sea model)', style: { position: 'absolute', left: (bx + inset + bl.layer.w / 2 - W / 2) + 'px', top: (by + inset + bl.layer.h / 2 - H / 2) + 'px', width: ow + 'px', height: oh + 'px', overflow: 'hidden', background: '#1b1916' } }, bl.layer.node);
  const sd = defs(hole, P + 'i');
  const icam = makeCamera(hole, ow, oh, '4B Sea camera');
  const iu = ow / 1300;
  const isea = buildSea(icam, P + 'i', sd, { u: iu, surfaceY: oh * 0.3, aspect: ow / oh, seed: 40, subX: ow * 0.34, subY: oh * 0.7, subLen: ow * 0.44, coastX1: ow * 0.4, floorY: 0.93 });
  icam.apply({ zoom: 1.0 });
  const front = svg('svg', { width: bl.layer.w, height: bl.layer.h, viewBox: `${-W * 0.4} ${-H * 0.4} ${bl.layer.w} ${bl.layer.h}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, bl.layer.node);
  const fp = poly(rect(bx, by, bw, bh)) + poly(cut(rect(bx + inset, by + inset, ow, oh), 3200, 0.8, 24).reverse());
  paper(front, fp, { P: P + 'w', fill: kraft, rim: shade(kraft, 0.4), thick: 4 * u, shadow: false, light: 0.8, name: '4B Box front (kraft)' });
  for (const [x0, y0, x1, y1, lit] of [[bx + inset, by + inset + oh, bx + inset + ow, by + inset + oh + 7 * u, 1], [bx + inset + ow, by + inset, bx + inset + ow + 7 * u, by + inset + oh, 1], [bx + inset, by + inset - 7 * u, bx + inset + ow, by + inset, 0], [bx + inset - 7 * u, by + inset, bx + inset, by + inset + oh, 0]]) {
    svg('path', { d: poly(rect(x0, y0, x1 - x0, y1 - y0)), fill: lit ? '#d6bb8e' : '#5e4630' }, front); // cut edge of the opening (lit / shaded)
  }
  // the three paper figures, taken out of the model and stood on the mat: two together, the third apart
  const fs = pick({ landscape: 0.86, portrait: 0.8 }) * u, fr = 24 * fs, feet = by + bh + H * pick({ landscape: 0.0, portrait: 0.02 });
  const fx = pick({ landscape: [0.79, 0.845, 0.94], portrait: [0.2, 0.32, 0.6] }).map(f => W * f);
  fx.forEach((x, i) => officer(bl, P + 'w', x, feet - 12.2 * fr, fs, { face: -1, coat: ROOM.coat[i], cap: ROOM.cap, skin: ROOM.skin, seed: 700 + i * 60, name: `4B Paper figure ${i + 1}${i === 2 ? ' (Arkhipov, staged)' : ''}` }).setArm(6));
  // near props on the mat (out of focus): offcut wave strips, a steel rule, a pencil
  const near = cam.layer('4B Near props', 1.35, { margin: 0.7 });
  const nY = by + bh + H * pick({ landscape: 0.06, portrait: 0.06 });
  for (let i = 0; i < 3; i++) {
    const ox = W * pick({ landscape: 0.06, portrait: 0.04 }) + i * 34 * u, oy = nY + i * 26 * u;
    paper(near, band(ox, ox + W * 0.2, oy, oy + 34 * u, 14 * u, 90 * u, 3300 + i, 8 * u), { P: P + 'w', fill: ['#58898f', '#3d6c77', '#2a5463'][i], thick: 3 * u, shadow: { dx: 12 * u, dy: 6 * u, b: 4, op: 0.45 }, name: '4B Offcut wave strip' });
  }
  const rx = W * pick({ landscape: 0.6, portrait: 0.5 }), ry = nY - 10 * u;
  const rule = svg('g', { 'data-name': '4B Steel rule', transform: `rotate(3 ${rx} ${ry})` }, near);
  paper(rule, poly(rect(rx, ry, W * 0.5, 34 * u)), { P: P + 'w', fill: '#a8acab', rim: '#e3e6e3', thick: 2 * u, shadow: { dx: 10 * u, dy: 6 * u, b: 4, op: 0.45 } });
  for (let k = 0; k < 60; k++) svg('path', { d: `M${rx + 10 * u + k * 12 * u},${ry}L${rx + 10 * u + k * 12 * u},${ry + (k % 5 ? 8 : 15) * u}`, stroke: '#2e3231', 'stroke-width': 1.2 * u }, rule);
  const px0 = W * pick({ landscape: 0.36, portrait: 0.1 }), py0 = nY + 70 * u;
  const pen = svg('g', { 'data-name': '4B Pencil', transform: `rotate(8 ${px0} ${py0})` }, near);
  paper(pen, poly([[px0, py0], [px0 + W * 0.26, py0], [px0 + W * 0.26 + 30 * u, py0 + 9 * u], [px0 + W * 0.26, py0 + 18 * u], [px0, py0 + 18 * u]]), { P: P + 'w', fill: '#b8913f', thick: 2 * u, shadow: { dx: 10 * u, dy: 6 * u, b: 4, op: 0.45 } });
  svg('path', { d: poly([[px0 + W * 0.26, py0 + 1 * u], [px0 + W * 0.26 + 30 * u, py0 + 9 * u], [px0 + W * 0.26, py0 + 17 * u]]), fill: '#d9c19a' }, pen);
  return { view, cam, isea, box: { bx, by, bw, bh } };
}

export default function (root, ctx) {
  const L = ctx.layout, W = ctx.width, H = ctx.height, u = L.unit, P = 's4';
  root.style.background = '#1b1916';
  defs(root, P);
  const roomView = el('div', { 'data-name': '4A Room view', style: { position: 'absolute', inset: 0 } }, root);
  defs(roomView, P);
  const cam = makeCamera(roomView, W, H, '4A Camera world');
  const R = buildRoom(cam, P, W, H, L, u, { heroApart: true });
  R.offs[0].setArm(174); R.offs[1].setArm(173);
  const B = bench(root, L, W, H, u, P);

  const tThird = wt(ctx, 'third,', 0, 0.51), tVas = wt(ctx, 'Vasili', 0, 0.87), tNo = wt(ctx, 'no.', 0, 2.29);
  const tWorld = wt(ctx, 'The', 1, 3.22), tForty = wt(ctx, 'forty', 0, 4.39), tLater = wt(ctx, 'later.', 0, 4.99);
  const tB = tWorld - 0.25; // dissolve 0.5 s centred just before "The world"
  const s = L.safe;
  const vote = voteCard(root, L, { name: '4A Vote card', x: s.x, y: L.pick({ landscape: s.y, portrait: s.y + L.px(30) }), rot: -0.8, kicker: 'To fire: all three agree' });
  const name = label(root, L, {
    name: '4A Tag: Arkhipov', x: L.pick({ landscape: s.x + s.w, portrait: s.x + s.w }), y: L.pick({ landscape: s.y + s.h, portrait: s.y + s.h }), ax: 1, ay: 1, rot: 1.0,
    lines: [{ text: 'The third officer', kind: 'kicker' }, { text: 'Vasili Arkhipov' }],
  });
  const year = label(root, L, {
    name: '4B Tag: forty years', x: L.pick({ landscape: s.x + s.w, portrait: s.x }), y: L.pick({ landscape: s.y, portrait: s.y + L.px(30) }), ax: L.pick({ landscape: 1, portrait: 0 }), rot: -1.2,
    lines: [{ text: 'The world learned his name', kind: 'kicker' }, { text: '1962', size: 78 }, { text: 'Model · figures staged, not portraits', kind: 'note' }],
  });
  const yearRow = year.rows[1];
  const g = grade(root, L, { vignette: 0, warm: 0.05 });
  ctx.sfx('drawer-close-01', tB + 0.2, { volume: 0.18 });

  const heroX = W * R.ox[2];
  return {
    update(t) {
      sceneIn(root, ctx, t);
      // ---- 4A
      const dis = clamp((t - tB) / 0.5);
      roomView.style.display = dis >= 1 ? 'none' : '';
      if (dis < 1) {
        const push = glide(t, 0, tB + 0.5, 0, 1), pNo = ease.outCubic(progress(t, tNo - 0.05, tNo + 0.6));
        const z = L.pick({ landscape: 1.85, portrait: 1.45 }) * (1 + push * 0.07 + pNo * 0.035);
        const hx = (heroX - W / 2) / 1.08, hy = (R.oy + 24 * R.os * L.pick({ landscape: 3.2, portrait: 5.6 }) - H / 2) / 1.08;
        cam.apply({ unit: u, x: hx - L.pick({ landscape: W * 0.08, portrait: W * 0.02 }) / z, y: hy, zoom: z, focusP: 1.08, blur: 10 });
        R.dim.setAttribute('opacity', (0.12 + 0.33 * ease.inOutCubic(progress(t, tVas - 0.2, tNo + 0.2))).toFixed(3));
        R.offs[2].setArm(8 + noise1(t * 0.6, 7) * 0.8);
      }
      vote.update(t, -1, { ticks: [-1, -1], stampAt: tNo - 0.08, tout: tB - 0.1 });
      name.update(t, tVas - 0.12, tB - 0.1);
      // ---- 4B
      B.view.style.opacity = dis.toFixed(3);
      B.view.style.display = dis <= 0 ? 'none' : '';
      if (dis > 0) {
        const k = t - tB;
        B.cam.apply({ unit: u, x: 0, y: L.pick({ landscape: H * 0.06, portrait: H * 0.06 }), zoom: glide(t, tB, ctx.duration, 1.22, 1.0), focusP: 1.0, blur: 7 });
        B.isea.update(t + 20);
      }
      year.update(t, tWorld + 0.15);
      const yp = ease.inOutCubic(progress(t, tForty - 0.05, tLater + 0.1));
      yearRow.textContent = String(Math.round(1962 + 40 * yp));
      g.update(t + ctx.start);
    },
  };
}
