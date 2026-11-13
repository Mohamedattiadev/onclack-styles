// Scene 2 — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW they were hunted and alone · FEEL pressure · SEE French-knot bursts around the hull; the cut thread to Moscow.
// shots: 2A INS the real photo, printed on a cotton patch, being tacked onto indigo cloth (EV)
//        2B WS section: ships on the surface, charges dropping in stitch steps, three French-knot bursts (RC/VO)
//        2C pull/pan to MOSCOW: the line of stitches stops halfway, a cut thread end hangs; the pen pattern shows
//           where it should have joined (VO: "silent").
import { rand, noise1, smootherstep } from '/onclack-styles/engine/lib/anim.js';
import { Cloth, PAL, W, F, camAt, resample, ellipse } from '../shared/stitch.js';
import { label } from '../shared/parts.js';

export default async function (root, ctx) {
  const L = ctx.layout, P = L.portrait, Wd = L.width, Hd = L.height, T0 = ctx.start;
  const cloth = new Cloth(root, ctx, { kind: 'indigo', name: '2 Indigo cloth (canvas)', bounds: { x: -Wd, y: -Hd, w: Wd * 6, h: Hd * 3 }, seed: 9 });

  const tAbove = W(ctx, 'Above', 0, 7.56), tShips = W(ctx, 'ships', 0, 8.63), tDrop = W(ctx, 'drop', 0, 8.95);
  const tDepth = W(ctx, 'depth', 0, 9.79), tCharges = W(ctx, 'charges.', 0, 10.05), tMoscow = W(ctx, 'Moscow', 0, 10.95), tSilent = W(ctx, 'silent', 0, 11.93);
  const cutB = tDrop - 0.12, cutC = tMoscow - 0.12;

  /* ================= 2A · the photo patch (evidence) ================= */
  const img = new Image(); img.src = ctx.asset('assets/b59-surfaced-1962.jpg');
  await img.decode().catch(() => {});
  const pw = P ? 900 : 940, ph = Math.round(pw * 734 / 948);
  const pcx = P ? Wd / 2 : Wd * 0.38, pcy = P ? Hd * 0.42 : Hd * 0.5, rot = -0.022;
  // pre-processed patch: photo transfer on cream cotton (low contrast, ink sits in the weave, frayed raw edges)
  const patch = document.createElement('canvas'); patch.width = pw + 24; patch.height = ph + 24;
  {
    const g = patch.getContext('2d');
    g.fillStyle = 'rgb(228,222,206)'; g.fillRect(12, 12, pw, ph);
    g.save(); g.globalCompositeOperation = 'multiply'; g.filter = 'grayscale(1) contrast(0.82) brightness(1.08)';
    g.drawImage(img, 12 + 14, 12 + 14, pw - 28, ph - 28); g.restore();
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.5;
    for (let y = 12; y < ph + 12; y += 3) { g.fillStyle = `rgba(150,140,120,${0.18 + rand(y) * 0.12})`; g.fillRect(12, y, pw, 1); }
    for (let x = 12; x < pw + 12; x += 3) { g.fillStyle = `rgba(150,140,120,${0.12 + rand(x * 3) * 0.1})`; g.fillRect(x, 12, 1, ph); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(228,222,206,0.95)'; g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i < 260; i++) { // loose warp/weft ends along the four raw edges
      const side = i % 4, u = rand(i * 1.37), l = 2 + rand(i * 4.1) * 9;
      if (side === 0) { const x = 12 + u * pw; g.moveTo(x, 12); g.lineTo(x + (rand(i) - 0.5) * 2, 12 - l); }
      if (side === 1) { const x = 12 + u * pw; g.moveTo(x, 12 + ph); g.lineTo(x + (rand(i) - 0.5) * 2, 12 + ph + l); }
      if (side === 2) { const y = 12 + u * ph; g.moveTo(12, y); g.lineTo(12 - l, y + (rand(i) - 0.5) * 2); }
      if (side === 3) { const y = 12 + u * ph; g.moveTo(12 + pw, y); g.lineTo(12 + pw + l, y + (rand(i) - 0.5) * 2); }
    }
    g.stroke();
  }
  cloth.custom((g) => {
    g.translate(pcx, pcy); g.rotate(rot);
    g.fillStyle = 'rgba(4,8,20,0.55)'; g.fillRect(-pw / 2 + 3, -ph / 2 + 5, pw, ph);
    g.drawImage(patch, -pw / 2 - 12, -ph / 2 - 12);
  });
  // tacking it on: rust running stitch around the border (signature: the needle travels the whole edge)
  const c = Math.cos(rot), s = Math.sin(rot), R = (u, v) => [pcx + u * c - v * s, pcy + u * s + v * c];
  const m = 16, border = [R(-pw / 2 + m, -ph / 2 + m), R(pw / 2 - m, -ph / 2 + m), R(pw / 2 - m, ph / 2 - m), R(-pw / 2 + m, ph / 2 - m), R(-pw / 2 + m, -ph / 2 + m)];
  const bs = Cloth.running(border, 16, 10);
  cloth.run(bs, { t0: T0 + 0.05, rate: bs.length / (cutB - T0 - 0.45), color: PAL.rust, w: 3.2, seed: 21, lift: 8, angle: -0.95 });
  cloth.name('2A U.S. Navy photo of B-59 (patch)', [pcx - pw / 2, pcy - ph / 2, pw, ph], -99, cutB);
  label(cloth, P ? { x: pcx - pw / 2 + 10, y: pcy + ph / 2 + 30, text: 'U.S. Navy photo · B-59 surfaced, 28–29 Oct 1962', size: 24, t0: tAbove + 0.3, name: '2A Photo source', color: PAL.charcoal }
    : { x: pcx + pw / 2 + 36, y: pcy + ph / 2 - 150, text: 'U.S. Navy photo', size: 26, t0: tAbove + 0.3, name: '2A Photo source', rot: 0.03 });
  if (!P) label(cloth, { x: pcx + pw / 2 + 30, y: pcy + ph / 2 - 98, text: 'B-59 surfaced, 28–29 Oct 1962', size: 26, t0: tAbove + 0.45, name: '2A Photo date', rot: -0.015 });

  /* ================= 2B/2C · the section (same cloth, 3000 units to the right) ================= */
  const OX = 3000;
  const S = P
    ? { surf: 640, ships: [[110, 270], [650, 240]], sub: [540, 1290, 640, 84], mos: [300, 200, 13], line: [[560, 318], [585, 1190]], bursts: [[380, 1140, 0], [790, 1120, 1], [170, 1430, 2]] }
    : { surf: 300, ships: [[420, 330], [1130, 300]], sub: [980, 790, 640, 82], mos: [2120, 120, 12], line: [[2300, 228], [1012, 700]], bursts: [[770, 630, 0], [1350, 700, 1], [560, 945, 2]] };
  const X = x => OX + x;

  // sea surface: cream running stitch, gently waving (pre-worked)
  const surf = []; for (let x = -900; x <= 3300; x += 20) surf.push([X(x), S.surf + Math.sin(x * 0.012) * 5]);
  cloth.run(Cloth.running(surf, 18, 9), { t0: -40, rate: 3000, color: PAL.cream, w: 3, needle: false, seed: 22 });
  // a few deeper rows, fainter (indigo on indigo: aerial perspective of the depth)
  for (let r = 1; r < 9; r++) {
    const y = S.surf + r * (P ? 160 : 120); const pts = []; for (let x = -900; x <= 3300; x += 24) pts.push([X(x), y + Math.sin(x * 0.009 + r) * 6]);
    cloth.run(Cloth.running(pts, 12, 22, r * 7), { t0: -40, rate: 3000, color: [72, 92, 140], w: 2.2, needle: false, seed: 30 + r, sheen: 0.5 });
  }
  // ships: cream satin silhouettes sitting on the surface (stitches vertical)
  const shipPoly = (x0, len) => {
    const h = len * 0.1, y = S.surf;
    return [[x0, y - h * 0.6], [x0 + len * 0.06, y + h * 0.35], [x0 + len * 0.92, y + h * 0.35], [x0 + len, y - h * 0.85], [x0 + len * 0.8, y - h * 0.6], [x0 + len * 0.66, y - h * 0.6], [x0 + len * 0.62, y - h * 1.7], [x0 + len * 0.5, y - h * 1.7], [x0 + len * 0.47, y - h * 2.5], [x0 + len * 0.42, y - h * 2.5], [x0 + len * 0.4, y - h * 1.7], [x0 + len * 0.3, y - h * 1.5], [x0 + len * 0.28, y - h * 0.6]].map(([a, b]) => [X(a), b]);
  };
  S.ships.forEach(([x0, len], i) => {
    const poly = shipPoly(x0, len);
    const spine = [[X(x0 - 4), S.surf], [X(x0 + len + 4), S.surf]];
    cloth.run(Cloth.satinPoly(poly, spine, 3.2, { split: 22 }), { t0: -30, rate: 3000, color: PAL.cream, w: 3.8, needle: false, seed: 40 + i });
    cloth.name(`2B US ship ${i + 1}`, [X(x0), S.surf - len * 0.27, len, len * 0.32]);
  });
  // the boat: charcoal satin hull (stitches across the hull, following its curve) + cream backstitch outline
  const [sx, sy, sl, sh] = S.sub;
  const hw = u => sh * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, u * 1.04))), 0.38) * (u > 0.8 ? 1 - (u - 0.8) * 1.2 : 1);
  const spine = resample([[X(sx - sl / 2), sy], [X(sx + sl / 2), sy]], 4);
  cloth.run(Cloth.satinSpine(spine, hw, 3.4, { split: 30 }), { t0: -30, rate: 3000, color: PAL.charcoal, w: 4.2, needle: false, seed: 50 });
  const outlineTop = [], outlineBot = [];
  for (let i = 0; i <= 60; i++) { const u = i / 60, x = X(sx - sl / 2 + u * sl); outlineTop.push([x, sy - hw(u) / 2 - 2]); outlineBot.push([x, sy + hw(u) / 2 + 2]); }
  const outline = [...outlineTop, ...outlineBot.reverse(), outlineTop[0]];
  cloth.run(Cloth.back(outline, 11), { t0: -30, rate: 3000, color: PAL.cream, w: 2.6, needle: false, seed: 51 });
  const sail = [[X(sx - 70), sy - sh * 0.48], [X(sx - 52), sy - sh * 1.15], [X(sx + 30), sy - sh * 1.15], [X(sx + 48), sy - sh * 0.48]];
  cloth.run(Cloth.satinPoly(sail, [[X(sx - 80), sy - sh], [X(sx + 60), sy - sh]], 3.2), { t0: -30, rate: 3000, color: PAL.charcoal, w: 4, needle: false, seed: 52 });
  cloth.run(Cloth.back(sail, 10), { t0: -30, rate: 3000, color: PAL.cream, w: 2.6, needle: false, seed: 53 });
  cloth.name('2B B-59 (section, schematic)', [X(sx - sl / 2), sy - sh * 1.2, sl, sh * 1.8]);

  // depth charges: three drops, each a line of rust running stitch that grows stitch by stitch, then a burst
  const burstT = [tDepth - 2 * F, tCharges + 2 * F, tCharges + 0.34];
  S.bursts.forEach(([bx, by, i]) => {
    const ship = S.ships[i === 1 ? 1 : 0], x0 = ship[0] + ship[1] * (i === 2 ? 0.2 : i === 1 ? 0.8 : 0.85);
    const pts = []; for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push([X(x0 + (bx - x0) * u + Math.sin(u * 3 + i) * 10), S.surf + 18 + (by - S.surf - 18) * u]); }
    const segs = Cloth.running(pts, 11, 9);
    const t0 = tDrop + i * 0.18;
    cloth.run(segs, { t0, rate: segs.length / (burstT[i] - t0), color: PAL.rust, w: 2.6, needle: false, seed: 60 + i });
    // burst: radiating straight stitches (rust + cream), French knots at the heart and scattered around
    const tb = burstT[i], n = 11;
    const rays = [];
    for (let r = 0; r < n; r++) {
      const a = (r / n) * Math.PI * 2 + rand(i * 9 + r) * 0.4, r0 = 14 + rand(r * 3 + i) * 8, r1 = 46 + rand(r * 7 + i) * 34;
      rays.push([[X(bx) + Math.cos(a) * r0, by + Math.sin(a) * r0], [X(bx) + Math.cos(a) * r1, by + Math.sin(a) * r1]]);
    }
    cloth.run(rays.filter((_, r) => r % 2 === 0), { t0: tb, rate: 90, color: PAL.cream, w: 3, needle: false, seed: 70 + i });
    cloth.run(rays.filter((_, r) => r % 2 === 1), { t0: tb + 0.03, rate: 90, color: PAL.rust, w: 3, needle: false, seed: 75 + i });
    for (let kk = 0; kk < 7; kk++) { const a = kk * 2.4 + i, rr = kk === 0 ? 0 : 7 + rand(kk * 5 + i) * 8; cloth.knot(X(bx) + Math.cos(a) * rr, by + Math.sin(a) * rr, 5.2 + rand(kk + i * 3) * 1.6, kk % 3 ? PAL.cream : PAL.rust, tb + kk * F, 80 + i * 10 + kk); }
    for (let kk = 0; kk < 9; kk++) { const a = rand(kk * 11 + i * 2) * 6.28, rr = 70 + rand(kk * 13 + i) * 40; cloth.knot(X(bx) + Math.cos(a) * rr, by + Math.sin(a) * rr, 3.4, PAL.cream, tb + 0.08 + kk * F, 120 + i * 10 + kk); }
    cloth.name(`2B Depth charge ${i + 1} (French knots)`, [X(bx) - 90, by - 90, 180, 180], tb);
  });

  // MOSCOW, cross-stitched in cream (pre-worked) and the line of stitches that never arrives
  const [mx, my, mc] = S.mos;
  const mos = Cloth.crossText('MOSCOW', X(mx), my, mc);
  cloth.run(mos.segs, { t0: -30, rate: 3000, color: PAL.cream, w: mc * 0.44, needle: false, seed: 90 });
  cloth.name('2C Moscow (cross-stitch)', [X(mx), my, mos.w, mos.h]);
  const [la, lb] = S.line.map(([x, y]) => [X(x), y]);
  const lineAt = u => [la[0] + (lb[0] - la[0]) * u, la[1] + (lb[1] - la[1]) * u];
  const fromMos = [lineAt(0), lineAt(0.4)], fromSub = [lineAt(1), lineAt(0.8)];
  const ang = Math.atan2(lb[1] - la[1], lb[0] - la[0]);
  cloth.run(Cloth.running(fromMos, 14, 9), { t0: -30, rate: 3000, color: PAL.cream, w: 2.8, needle: false, seed: 91, tail: { len: 70, dir: ang + 0.5, curl: 0.9, sway: 0.08 } });
  cloth.run(Cloth.running(fromSub, 14, 9), { t0: -30, rate: 3000, color: PAL.cream, w: 2.8, needle: false, seed: 92, tail: { len: 56, dir: ang + Math.PI - 0.6, curl: -0.9, sway: 0.08 } });
  cloth.trace([lineAt(0.43), lineAt(0.77)], { t0: -9, t1: 99, a: 0.75, dash: [5, 7], w: 1.8 });
  cloth.name('2C Cut thread (no word from Moscow)', (() => { const a = lineAt(0.38), b = lineAt(0.82); return [Math.min(a[0], b[0]) - 40, Math.min(a[1], b[1]) - 40, Math.abs(a[0] - b[0]) + 80, Math.abs(a[1] - b[1]) + 80]; })());
  label(cloth, P ? { x: X(175), y: 1470, text: 'Schematic · not to scale', size: 26, t0: -9, name: '2B Schematic label' }
    : { x: X(110), y: 1000, text: 'Schematic · not to scale', size: 24, t0: -9, name: '2B Schematic label' });

  // camera
  const keys = [
    [T0, P ? { x: pcx, y: pcy + 90, z: 1.04 } : { x: Wd / 2 + 10, y: pcy + 40, z: 1.0 }],
    [cutB - 0.05, P ? { x: pcx, y: pcy - 30, z: 1.08 } : { x: Wd / 2 - 10, y: pcy - 20, z: 1.05 }],
    [cutB, P ? { x: X(540), y: 1100, z: 1.2 } : { x: X(960), y: 560, z: 1.0 }],
    [cutC, P ? { x: X(540), y: 1080, z: 1.24 } : { x: X(965), y: 575, z: 1.03 }],
    [cutC + 1.6, P ? { x: X(560), y: 900, z: 0.96 } : { x: X(1500), y: 520, z: 0.85 }],
  ];
  // the cut to 2B must be hard: no glide between the patch and the section
  const camFor = t => {
    const c = t < cutB ? camAt(t, keys.slice(0, 2), { breathe: 0.5, seed: 3 }) : camAt(t, keys.slice(2), { breathe: 0.5, seed: 4 });
    // charges: the cloth jolts (noise, decaying 0.35 s), never a frame-by-frame flip
    let jx = 0, jy = 0;
    burstT.forEach((tb, i) => { const d = t - tb; if (d > 0 && d < 0.4) { const a = (1 - d / 0.4) ** 2 * 7; jx += noise1(d * 38, i * 5) * a; jy += noise1(d * 41, i * 5 + 2) * a; } });
    return { x: c.x + jx / c.z, y: c.y + jy / c.z, z: c.z };
  };

  // sound: the sea bed continues; three distant thuds on the bursts (0–2 f after); drips in the silence
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -16, fade: 0.5 });
  ctx.sfx('boom-distant-01', burstT[0] + 2 * F - T0, { lu: -7 });
  ctx.sfx('boom-slapback-01', burstT[1] + 2 * F - T0, { lu: -9 });
  ctx.sfx('boom-distant-01', burstT[2] + 2 * F - T0, { lu: -12 });
  ctx.sfx('drips-wood-01', tSilent - 0.3 - T0, { lu: -26 });

  return { update(t) { const g = T0 + t; cloth.draw(g, camFor(g)); } };
}
