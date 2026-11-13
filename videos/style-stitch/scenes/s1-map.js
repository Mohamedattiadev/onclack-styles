// Scene 1 — "October 27th, 1962. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW date + place · FEEL quiet unease · SEE the needle cross-stitching the date, then the sea around Cuba.
// shots: 1A INS/ECU date being cross-stitched (needle, thread) → 1B pull back to the whole embroidered map (WS),
//        Cuba filled in satin stitch west→east, the boat stitched small in the open sea with an "approx." ring.
// truth: coastlines = Natural Earth (EV-derived); B-59 position = RC, labelled approx.; sea lines = VO.
import { Cloth, PAL, W, camAt, smoothPts, inPoly, ellipse, resample } from '../shared/stitch.js';
import { label } from '../shared/parts.js';

export default async function (root, ctx) {
  const L = ctx.layout, P = L.portrait, Wd = L.width, Hd = L.height;
  const T0 = ctx.start;
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const cloth = new Cloth(root, ctx, { kind: 'natural', name: '1 Embroidered map (canvas)', bounds: { x: -Wd, y: -Hd, w: Wd * 3, h: Hd * 3 }, seed: 4 });

  // projection (equirectangular, cos 23°)
  const lon0 = P ? -83.6 : -87.8, lonSpan = P ? 15 : 19.2;
  const k = Wd / (lonSpan * 0.92), latTop = P ? 27.8 : 28.2, Y0 = P ? 600 : 0;
  const proj = ([lo, la]) => [(lo - lon0) * 0.92 * k, Y0 + (latTop - la) * k];

  // land rings (projected) — keep the big ones that touch the view
  const lands = [];
  for (const f of geo.features) for (const ring of f.rings) {
    const pts = ring.map(proj);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    if (Math.max(...xs) < -60 || Math.min(...xs) > Wd + 60 || Math.max(...ys) < -60 || Math.min(...ys) > Hd + 60) continue;
    const area = Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
    if (area < 120) continue;
    lands.push({ name: f.name, pts, area, bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
  }
  const cuba = lands.filter(l => l.name === 'Cuba').sort((a, b) => b.area - a.area)[0];

  // words
  const tOct = W(ctx, 'October', 0, 0.58), t27 = W(ctx, 'twenty-seventh,', 0, 1.1), t19 = W(ctx, 'nineteen', 0, 2.07);
  const tSub = W(ctx, 'submarine', 0, 4.3), tHides = W(ctx, 'hides', 0, 4.93), tDeep = W(ctx, 'deep', 0, 5.42), tCuba = W(ctx, 'Cuba.', 0, 6.52), tSea = W(ctx, 'sea', 0, 5.98);

  // ---- the date, cross-stitched (charcoal) ----
  const cell = P ? 13 : 9.5;
  const dx = P ? L.safe.x + 30 : L.safe.x + 44, dy = P ? 250 : 104;
  const l1 = Cloth.crossText('OCT 27', dx, dy, cell), l2 = Cloth.crossText('1962', dx, dy + cell * 9.2, cell);
  const dateBox = [dx - cell * 2, dy - cell * 2, Math.max(l1.w, l2.w) + cell * 4, cell * 18.5];

  // ---- sea: rows of indigo running stitch, pre-worked (the cloth was prepared before the story starts) ----
  const nearLand = (p, m) => lands.some(l => p[0] > l.bb[0] - m && p[0] < l.bb[2] + m && p[1] > l.bb[1] - m && p[1] < l.bb[3] + m && (inPoly(p, l.pts) || inPoly([p[0] + m, p[1]], l.pts) || inPoly([p[0] - m, p[1]], l.pts) || inPoly([p[0], p[1] + m], l.pts) || inPoly([p[0], p[1] - m], l.pts)));
  const inBox = (p, b) => p[0] > b[0] && p[0] < b[0] + b[2] && p[1] > b[1] && p[1] < b[1] + b[3];
  const rowGap = P ? 40 : 44, seaSegs = [];
  let row = 0;
  for (let y = -rowGap * 3; y < Hd + rowGap * 3; y += rowGap, row++) {
    const pts = []; for (let x = -Wd * 0.25; x <= Wd * 1.25; x += 24) pts.push([x, y + Math.sin(x * 0.006 + row * 0.9) * 7]);
    for (const sg of Cloth.running(pts, 15, 10, (row * 9) % 25)) {
      const m = [(sg[0][0] + sg[1][0]) / 2, (sg[0][1] + sg[1][1]) / 2];
      if (nearLand(m, 9) || nearLand(sg[0], 7) || nearLand(sg[1], 7) || inBox(m, dateBox)) continue;
      seaSegs.push(sg);
    }
  }
  cloth.run(seaSegs, { t0: -60, rate: 2000, color: PAL.indigo, w: 2.4, needle: false, seed: 1 });

  // echo line around Cuba (one row of running stitch, following the coast)
  const cs = smoothPts(cuba.pts, 3, true);
  const echo = cs.map((p, i) => {
    const a = cs[(i - 2 + cs.length) % cs.length], b = cs[(i + 2) % cs.length];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const d = P ? 15 : 18; if (inPoly([p[0] + nx * 3, p[1] + ny * 3], cuba.pts)) { nx = -nx; ny = -ny; }
    return [p[0] + nx * d, p[1] + ny * d];
  });
  const echoS = smoothPts(echo, 3, true); echoS.push(echoS[0]);

  // other coasts: charcoal backstitch, pre-worked
  for (const l of lands) {
    if (l === cuba) continue;
    const pts = smoothPts(l.pts, 1, true); pts.push(pts[0]);
    const segs = Cloth.back(pts, 9).filter(([a, b]) => !(P && (a[1] < Y0 - 20 || b[1] < Y0 - 20)) && !(a[0] < -40 && b[0] < -40) && !(a[0] > Wd + 40 && b[0] > Wd + 40) && !(a[1] > Hd + 40 && b[1] > Hd + 40));
    if (segs.length) cloth.run(segs, { t0: -50, rate: 2000, color: PAL.charcoal, w: 2.3, needle: false, seed: 2 });
  }

  // ---- Cuba: pattern traced in pen first, then satin stitch (rust) along the island's spine ----
  const tr = cuba.pts.slice(); tr.push(tr[0]);
  cloth.trace(tr, { t0: -9, t1: tCuba + 1.5, a: 0.55 });
  const spineLL = [[-85.1, 21.85], [-83.6, 22.55], [-82.2, 22.85], [-80.6, 22.95], [-79.2, 22.45], [-78.0, 21.7], [-76.9, 21.0], [-75.8, 20.5], [-74.1, 20.2]];
  let spine = resample(spineLL.map(proj), 6); for (let i = 0; i < 4; i++) spine = smoothPts(spine, 10);
  const satin = Cloth.satinPoly(cuba.pts, spine, P ? 3.0 : 3.3, { split: P ? 30 : 34, pad: 0.6 });
  const tCubaStart = tHides + 0.5, tCubaEnd = tCuba + 0.05;
  cloth.run(satin, { t0: tCubaStart, rate: satin.length / (tCubaEnd - tCubaStart), color: PAL.rust, w: P ? 4.2 : 4.6, seed: 3, lift: 8, angle: -1.05 });
  cloth.run(Cloth.running(echoS, 13, 8), { t0: tCuba - 0.2, rate: 260, color: PAL.indigo, w: 2.4, needle: false, seed: 4 });

  // ---- the date run (signature move: one needle, one thread) ----
  // split by words: OCT on "October", 27 on "twenty-seventh", 1962 on "nineteen sixty-two"
  const octSegs = Cloth.crossText('OCT', dx, dy, cell).segs, sevSegs = Cloth.crossText('27', dx + 4 * 6 * cell, dy, cell).segs;
  const a1 = cloth.run(octSegs, { t0: tOct - 0.5, rate: octSegs.length / 0.95, color: PAL.charcoal, w: cell * 0.44, seed: 5, lift: 10, post: 0 });
  const a2t = Math.max(a1, t27 - 0.3), a2 = cloth.run(sevSegs, { t0: a2t, rate: sevSegs.length / 0.85, color: PAL.charcoal, w: cell * 0.44, seed: 6, lift: 10, pre: a2t - a1, post: 0 });
  const a3t = Math.max(a2, t19 - 0.25); cloth.run(l2.segs, { t0: a3t, rate: l2.segs.length / 1.15, color: PAL.charcoal, w: cell * 0.44, pre: a3t - a2, seed: 7, lift: 10, tail: { len: 46, dir: 0.4, curl: 1.1 } });
  cloth.name('1A Date (cross-stitch)', dateBox);

  // ---- the boat: small satin hull (charcoal) in the open sea, approx. ring, cross-stitched name ----
  const sp = proj([-71.2, 25.4]);
  const hl = P ? 110 : 124, ang = -0.18;
  const hullSpine = [[sp[0] - hl / 2 * Math.cos(ang), sp[1] - hl / 2 * Math.sin(ang)], [sp[0] + hl / 2 * Math.cos(ang), sp[1] + hl / 2 * Math.sin(ang)]];
  const hullW = s => (P ? 13 : 15) * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.08)), 0.45);
  const hull = Cloth.satinSpine(hullSpine, hullW, 3.2);
  const tB = tSub - 0.05;
  cloth.trace(ellipse(sp[0], sp[1], hl * 0.55, 10, 30), { t1: tB + 0.8, a: 0.5 });
  const hb = cloth.run(hull, { t0: tB, rate: hull.length / 0.5, post: 0, color: PAL.charcoal, w: 3.6, seed: 8, lift: 8 });
  // sail: three short vertical satin stitches
  const sail = [-1, 0, 1].map(i => [[sp[0] - 6 + i * 3.2, sp[1] - 6], [sp[0] - 6 + i * 3.2, sp[1] - 15]]);
  cloth.run(sail, { t0: hb, rate: 20, color: PAL.charcoal, w: 3.4, needle: false, seed: 9 });
  // "approx." ring: running stitch in rust, worked on "hides deep"
  const ring = ellipse(sp[0], sp[1], hl * 0.95, hl * 0.62, 60, -2.2, -2.2 + Math.PI * 2);
  const ringS = Cloth.running(ring, 11, 8), rgEnd = cloth.run(ringS, { t0: hb + 0.08, rate: ringS.length / 0.55, post: 0, color: PAL.rust, w: 2.6, seed: 10, lift: 8 });
  const bl = Cloth.crossText('B-59', sp[0] - (P ? 46 : 40), sp[1] + hl * 0.62 + 18, P ? 6.4 : 5.6);
  cloth.run(bl.segs, { t0: rgEnd + 0.06, pre: 0.06, post: 0.15, rate: bl.segs.length / 0.5, color: PAL.charcoal, w: (P ? 6.4 : 5.6) * 0.38, seed: 11, needle: true, lift: 6 });
  cloth.name('1B B-59 (approx. position)', [sp[0] - hl, sp[1] - hl * 0.7, hl * 2, hl * 1.6 + 40]);
  cloth.name('1B Cuba (satin stitch)', (() => { const xs = cuba.pts.map(p => p[0]), ys = cuba.pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; })());

  // honesty label
  label(cloth, { x: P ? L.safe.x + 10 : Wd * 0.3, y: P ? L.safe.y + L.safe.h - 70 : L.safe.y + L.safe.h - 60, text: 'Coasts: Natural Earth · position of B-59 approx.', size: P ? 24 : 24, t0: tSea, name: '1B Source label' });

  // ---- camera: 1A close on the date (needle working) → 1B pull back to the map → slow creep toward the boat
  const dc = [dx + l1.w * 0.55, dy + cell * 8];
  const full = { x: Wd / 2, y: Hd / 2, z: 1 };
  const keys = [
    [0, { x: dc[0] + 20, y: dc[1] + 10, z: P ? 1.9 : 2.5 }],
    [t19 + 0.95, { x: dc[0] + 10, y: dc[1] + 4, z: P ? 1.8 : 2.35 }],
    [tSub + 0.35, full],
    [tCuba + 1.0, { x: Wd / 2 + (P ? 0 : 30), y: Hd / 2 + (P ? -20 : 10), z: 1.05 }],
  ];

  // ---- sound: the sea outside the hull (low, continuous into scene 2), one cloth pull as the camera lifts off
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -16, fade: 0.6 });
  ctx.sfx('cloth-jacket-01', t19 + 1.0 - T0, { lu: -24 });

  return {
    update(t) { cloth.draw(T0 + t, camAt(T0 + t, keys, { breathe: 0.5, seed: 2 })); },
  };
}
