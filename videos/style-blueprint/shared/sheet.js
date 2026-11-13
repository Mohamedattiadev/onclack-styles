// SHEET 1 OF 1 — the whole story is ONE drawing. Every scene builds the same sheet (same seeded paper, same
// global-time draft), only the camera differs: continuity across cuts is exact, and the last shot pulls back
// to show the finished drawing.
// Views (quadrants of a 2W × 2H sheet): Q1 general arrangement + key plan · Q2 section A–A (depth charges)
// · Q3 detail B (bow, torpedo) · Q4 notes, revisions, title block with the three approvals.
import { svg, clamp, progress, glide } from '/onclack-styles/engine/lib/anim.js';
import { Draft, C, FONT, ez, F, W, samplePath, ellipsePts, signaturePts, MONO_ADV } from './draft.js';

/* ---------- objects (metres, y up from keel) — illustrative, simplified ---------- */
// Project 641 ("Foxtrot") outline: length ≈ 90 m (sources give 89.9–91.3 m). Shapes simplified, not a survey drawing.
const HULL = [['M', 0, 3.6], ['C', 4, 5.6, 9, 7.0, 16, 7.4], ['L', 78, 7.4], ['C', 84, 7.4, 88.5, 6.2, 89.8, 4.2], ['C', 90.4, 2.6, 89, 0.9, 86, 0.4], ['C', 83, 0, 80, 0, 76, 0], ['L', 18, 0], ['C', 10, 0.2, 4, 1.8, 0, 3.6]];
const SAIL = [['M', 35.5, 7.4], ['L', 37, 12.4], ['C', 37.3, 13.2, 38, 13.4, 39, 13.4], ['L', 47.5, 13.4], ['C', 49.5, 13.4, 51, 11, 52.5, 7.4]];
const SHIP = [['M', 0, 6.4], ['L', 1.5, 1.4], ['L', 100, 0.6], ['C', 106, 0.9, 110, 3, 113, 7.6], ['L', 100, 7.0], ['L', 0, 6.4]];
const SHIP_TOP = [[[44, 7], [44, 10], [62, 10], [62, 7]], [[62, 7.2], [62, 12], [70, 12], [70, 7.4]], [[50, 10], [50.6, 14], [54.6, 14], [55, 10]], [[66, 12], [66, 19]], [[80, 7.5], [80, 9], [86, 9], [86, 7.6]], [[14, 6.5], [14, 8.4], [21, 8.4], [21, 6.6]]];

export async function buildSheet(root, ctx, views = [1, 2, 3, 4]) {
  const want = n => views.includes(n);
  const L = ctx.layout, P = L.portrait, Wd = L.width, Hd = L.height, S = L.safe;
  const WW = Wd * 2, HH = Hd * 2;
  const D = new Draft(root, ctx, WW, HH);
  const pad = 64; // creep zooms up to ≈ 1.06 about the safe centre → keep text ≥ 64 px inside the safe area
  const Q = n => { const ox = n === 3 || n === 4 ? Wd : 0, oy = n === 2 || n === 4 ? Hd : 0; return { ox, oy, x: ox + S.x + pad, y: oy + S.y + pad, w: S.w - 2 * pad, h: S.h - 2 * pad }; };
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const T = (w, n = 0, fb = 0) => W(ctx, w, n, fb);
  const pre = -5; // pre-printed / drawn before the story starts

  /* ---- helpers ---- */
  const toW = (cmds, ox, keelY, s) => samplePath(cmds, 0.6).map(([x, y]) => [ox + x * s, keelY - y * s]);
  const pt = (ox, keelY, s) => (x, y) => [ox + x * s, keelY - y * s];
  const breakLine = (a, b, t0, n = 7) => { // freehand-style break (zigzag) between two points
    const pts = []; for (let i = 0; i <= n; i++) { const s = i / n, k = i % 2 ? 1 : -1; const off = i === 0 || i === n ? 0 : k * 14; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); pts.push([a[0] + dx * s + (-dy / l) * off, a[1] + dy * s + (dx / l) * off]); }
    return D.line(pts, { t0, dur: 0.25, type: 'thin' });
  };
  const datum = (x, y, t0, label, size) => { // water-level symbol ▽ with three short lines
    D.line([[x - 16, y - 28], [x + 16, y - 28], [x, y], [x - 16, y - 28]], { t0, dur: 0.25, type: 'thin' });
    [[-20, 20, 8], [-13, 13, 16], [-6, 6, 24]].forEach(([a, b, dy], i) => D.line([[x + a, y + dy], [x + b, y + dy]], { t0: t0 + 0.15 + i * 0.05, dur: 0.08, type: 'thin' }));
    if (label) D.text(label, x + 32, y - 12, { size, t0: t0 + 0.2, cps: 30 });
  };
  const box = (x, y, w, h, t0, type = 'thin', dur = 0.5) => D.line([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], { t0, dur, type });
  const textLines = (lines, x, y, size, t0, lh = 1.45, cps = 30, gap = 0.12) => { let t = t0; return lines.map((s, i) => { const it = D.text(s, x, y + i * size * lh, { size, t0: t, cps }); t += s.length / cps + gap; return it; }); };

  /* ---- sheet frame (pre-printed): trimmed border + inner frame with zone ticks ---- */
  const bx = P ? 46 : 50, by = P ? 46 : 46;
  box(bx, by, WW - 2 * bx, HH - 2 * by, pre, 'thin');
  box(bx + 22, by + 22, WW - 2 * bx - 44, HH - 2 * by - 44, pre, 'thick');
  for (let i = 1; i < 8; i++) { const x = bx + 22 + ((WW - 2 * bx - 44) * i) / 8; D.line([[x, by], [x, by + 22]], { t0: pre, type: 'thin' }); D.line([[x, HH - by - 22], [x, HH - by]], { t0: pre, type: 'thin' }); }
  for (let i = 1; i < 6; i++) { const y = by + 22 + ((HH - 2 * by - 44) * i) / 6; D.line([[bx, y], [bx + 22, y]], { t0: pre, type: 'thin' }); D.line([[WW - bx - 22, y], [WW - bx, y]], { t0: pre, type: 'thin' }); }
  // centring marks (mid of each side)
  for (const [a, b] of [[[WW / 2, by], [WW / 2, by + 60]], [[WW / 2, HH - by], [WW / 2, HH - by - 60]], [[bx, HH / 2], [bx + 60, HH / 2]], [[WW - bx, HH / 2], [WW - bx - 60, HH / 2]]]) D.line([a, b], { t0: pre, type: 'thick' });

  /* =================== Q1 · GENERAL ARRANGEMENT (S1) =================== */
  const tOct = T('October', 0, 0.58), t27 = T('twenty-seventh,', 0, 1.1), t62 = T('nineteen', 0, 2.07);
  const tSov = T('Soviet', 0, 3.79), tSub = T('submarine', 0, 4.3), tHides = T('hides', 0, 4.93), tDeep = T('deep', 0, 5.42), tCuba = T('Cuba.', 0, 6.52);
  if (want(1)) {
    const R = Q(1);
    // drawing title: the date, lettered on its spoken words, over pencilled guide lines
    const ts = P ? 150 : 124, adv = ts * MONO_ADV;
    const parts = P ? [['OCT.', tOct, 0, 0], ['27,', t27, 5, 0], ['1962', t62, 0, 1]] : [['OCT.', tOct, 0, 0], ['27,', t27, 5, 0], ['1962', t62, 9, 0]];
    const base = P ? [R.y + 140, R.y + 345] : [R.y + 110];
    const lines = P ? [[0, 8], [0, 4]] : [[0, 13]];
    lines.forEach(([c0, n], li) => [0, 0.7].forEach((k, i) => D.line([[R.x - 16, base[li] - ts * k], [R.x + n * adv + 16, base[li] - ts * k]], { t0: -0.5 + li * 0.1 + i * 0.08, dur: 0.3, type: 'con', w: 1, fadeTo: 0.35, fadeAt: 3.4 })));
    parts.forEach(([s, t, col, li]) => D.text(s, R.x + col * adv, base[li], { size: ts, t0: t - 2 * F, cps: 16, weight: 500, guide: false, name: `Title ${s}` }));
    if (!P) D.text(P ? '' : 'SHEET 1 · B-59 · PROJECT 641 · GENERAL ARRANGEMENT', R.x, (P ? base[1] : base[0]) + 74, { size: P ? 30 : 28, t0: tSov - 0.1, cps: 40 });

    // geometry
    const surfY = P ? R.y + 430 : R.y + 300;
    const hx0 = P ? R.x + 90 : R.x + 160, hlen = P ? 700 : 990, s = hlen / 90;
    const keel = P ? R.y + 780 : R.y + 690;
    const p = pt(hx0, keel, s);
    // construction: keel line, deck line, centre line, stations — faint, run past the ends
    // the layout starts while the date is still being read: the pen is already working below it
    const tLay = t62 + 0.45, fadeL = tSub + 1.1;
    D.con(p(-2, 0), p(92, 0), { t0: tLay, dur: 0.4, fadeAt: fadeL });
    D.con(p(-2, 7.4), p(92, 7.4), { t0: tLay + 0.2, dur: 0.4, fadeAt: fadeL });
    [0, 16, 35.5, 52.5, 78, 90].forEach((x, i) => D.con(p(x, -1.5), p(x, 14), { t0: tLay + 0.6 + i * 0.12, dur: 0.2, over: 8, fadeAt: fadeL }));
    // ink
    D.line(toW(HULL, hx0, keel, s), { t0: tSub - 2 * F, dur: 0.75, type: 'thick', name: '1A Hull outline' });
    D.line(toW(SAIL, hx0, keel, s), { t0: tSub + 0.5, dur: 0.35, type: 'thick', name: '1A Sail' });
    D.line([p(39.8, 13.4), p(39.8, 15.6)], { t0: tSub + 0.8, dur: 0.1, type: 'thin' });
    D.line([p(41.3, 13.4), p(41.3, 14.9)], { t0: tSub + 0.84, dur: 0.1, type: 'thin' });
    D.line([p(83.5, 5.6), p(86.4, 5.0)], { t0: tSub + 0.7, dur: 0.1, type: 'thick' });
    D.line([p(2.2, 3.6), p(-1.4, 3.7)], { t0: tSub + 0.72, dur: 0.1, type: 'thick' });
    D.line([p(9, 0.8), p(84, 0.8)], { t0: tSub + 0.7, dur: 0.4, type: 'hidden' });
    D.line([p(12, 6.6), p(84, 6.6)], { t0: tSub + 0.76, dur: 0.4, type: 'hidden' });
    D.line([p(-4, 3.7), p(94, 3.7)], { t0: tSub + 0.6, dur: 0.4, type: 'center', name: 'Centre line' });
    // callout balloon — the boat's name
    const bc = P ? [p(30, 0)[0], surfY + 110] : [p(24, 0)[0], surfY + 120];
    D.balloon(bc, P ? 30 : 34, '1', p(36.5, 10.5), { t0: tSub + 0.3, size: P ? 30 : 34 });
    D.text('B-59', bc[0] + (P ? 48 : 56), bc[1] + 14, { size: P ? 46 : 50, t0: tSub + 0.55, cps: 18, weight: 500, name: '1A Boat name' });
    // sea surface + depth (break in the dimension = distance shortened, not to scale)
    D.line([[R.x + (P ? 70 : 110), surfY], [R.x + R.w - 10, surfY]], { t0: tHides - 0.1, dur: 0.45, type: 'thin', name: 'Sea surface' });
    datum(R.x + (P ? 120 : 170), surfY, tHides + 0.1, 'SEA SURFACE', P ? 26 : 26);
    const dX = P ? R.x + 30 : R.x + 50, cl = p(0, 3.7)[1];
    D.line([[dX - 18, surfY], [dX + 18, surfY]], { t0: tDeep - 0.1, dur: 0.1, type: 'thin' });
    D.line([[dX - 18, cl], [p(-4, 0)[0], cl]], { t0: tDeep - 0.05, dur: 0.15, type: 'thin' });
    const mid = (surfY + cl) / 2;
    D.line([[dX, surfY], [dX, mid - 20]], { t0: tDeep, dur: 0.2, type: 'thin' });
    D.line([[dX, mid + 20], [dX, cl]], { t0: tDeep + 0.05, dur: 0.2, type: 'thin' });
    D.line([[dX, mid - 20], [dX - 14, mid - 7], [dX + 14, mid + 7], [dX, mid + 20]], { t0: tDeep + 0.2, dur: 0.1, type: 'thin' });
    D.arrow([dX, surfY], [0, -1], { t0: tDeep + 0.3 }); D.arrow([dX, cl], [0, 1], { t0: tDeep + 0.3 });
    D.text('DEPTH · N.T.S.', dX - 14, (surfY + cl) / 2 + 150, { size: P ? 24 : 26, t0: tDeep + 0.3, cps: 34, rot: -90, guide: false, name: 'Depth not to scale' });
    // overall length — the dimension comes last
    D.dim(p(0, 0), p(90, 0), -(P ? 52 : 70), P ? '≈ 90 m (ILLUSTRATIVE)' : '≈ 90 m  (NOTE 2)', { t0: tDeep + 0.35, size: P ? 28 : 32, name: '1A Length' });
    // detail-circle B around the bow (drawn later, when detail B is drawn — visible in the final pull-back)
    const bow = p(84, 3.7);
    D.line(ellipsePts(bow[0], bow[1], s * 9, s * 7.5, -2.2, 4.1), { t0: 13.4, dur: 0.4, type: 'thin' });
    D.text('B', bow[0] - s * 7.8, bow[1] - s * 6.2, { size: P ? 36 : 40, t0: 13.6, weight: 500, guide: false });

    // KEY PLAN — Natural Earth coastlines; B-59 position approximate
    const kp = P ? { x: R.x + 70, y: R.y + 890, w: R.w - 140 } : { x: R.x + 1170, y: R.y + 470, w: R.w - 1170 };
    const lon0 = -86, lat1 = 28, k = kp.w / (18 * 0.92); kp.h = 10 * k;
    const proj = ([lo, la]) => [kp.x + (lo - lon0) * 0.92 * k, kp.y + (lat1 - la) * k];
    const tK = tCuba - 0.75;
    D.text('KEY PLAN · N.T.S.', kp.x, kp.y - 18, { size: P ? 26 : 24, t0: tK - 0.1, cps: 36, name: 'Key plan title' });
    box(kp.x, kp.y, kp.w, kp.h, tK - 0.2, 'thin', 0.4);
    const inside = ([lo, la]) => lo > -86.2 && lo < -67.8 && la > 17.8 && la < 28.2;
    for (const f of geo.features) {
      const cuba = f.name === 'Cuba';
      for (const ring of f.rings) {
        const rr = ring.filter(inside);
        if (rr.length < 3) continue;
        const area = Math.abs(rr.reduce((a, [x, y], i) => { const [x2, y2] = rr[(i + 1) % rr.length]; return a + x * y2 - x2 * y; }, 0));
        if (!cuba && area < 0.05) continue;
        const pts = [...rr, rr[0]].map(proj);
        D.line(pts, { t0: cuba ? tCuba - 3 * F : tK + 0.05, dur: cuba ? 0.6 : 0.4, type: cuba ? 'thick' : 'thin', w: cuba ? 2.6 : 1.4, name: cuba ? 'Key plan Cuba' : undefined });
      }
    }
    D.text('CUBA', ...proj([-80.6, 21.0]), { size: P ? 34 : 30, t0: tCuba + 0.2, cps: 20, weight: 500, guide: false, name: 'Label Cuba', halo: true });
    const sp = proj([-71.2, 25.4]);
    D.line(ellipsePts(sp[0], sp[1], 14, 14), { t0: tCuba + 0.1, dur: 0.2, type: 'thin' });
    D.line([[sp[0] - 24, sp[1]], [sp[0] + 24, sp[1]]], { t0: tCuba + 0.2, dur: 0.08, type: 'thin' });
    D.line([[sp[0], sp[1] - 24], [sp[0], sp[1] + 24]], { t0: tCuba + 0.24, dur: 0.08, type: 'thin' });
    D.text('B-59 (APPROX.)', sp[0] - 30, sp[1] - 30, { size: P ? 26 : 22, t0: tCuba + 0.3, cps: 34, anchor: 'middle', guide: false, name: 'Key plan B-59 approx', halo: true });
    // north arrow
    const na = [kp.x + 40, kp.y + kp.h - 110];
    D.line([[na[0], na[1] + 40], [na[0], na[1]]], { t0: tK + 0.2, dur: 0.1, type: 'thin' });
    D.arrow([na[0], na[1] - 4], [0, -1], { t0: tK + 0.3, size: 18 });
    D.text('N', na[0], na[1] + 70, { size: 22, t0: tK + 0.35, anchor: 'middle', guide: false });
  }

  /* =================== Q2 · SECTION A–A: DEPTH CHARGES (S2) =================== */
  const tAbove = T('Above', 0, 7.56), tAm = T('American', 0, 8.07), tDrop = T('drop', 0, 8.95), tPrac = T('practice', 0, 9.28);
  const tDepth = T('depth', 0, 9.79), tCh = T('charges.', 0, 10.05), tMos = T('Moscow', 0, 10.95), tSil = T('silent', 0, 11.93);
  const bursts = [];
  if (want(2)) {
    const R = Q(2);
    const tt = P ? [['SECTION A–A', 52], ['PRACTICE DEPTH CHARGES', 34], ['SCHEMATIC · N.T.S.', 24]] : [['SECTION A–A · PRACTICE DEPTH CHARGES', 40], ['SCHEMATIC · NOT TO SCALE', 24]];
    let ty = R.y + (P ? 56 : 48), tt0 = tAbove - 0.2;
    for (const [s, z] of tt) { D.text(s, R.x, ty, { size: z, t0: tt0, cps: 40, weight: z > 30 ? 500 : 400 }); tt0 += s.length / 40 + 0.05; ty += z * 1.5; }
    const surfY = R.y + (P ? 400 : 270);
    D.line([[R.x + (P ? 30 : 80), surfY], [R.x + R.w - 10, surfY]], { t0: tAbove - 0.1, dur: 0.5, type: 'thin', name: '2A Sea surface' });
    datum(R.x + (P ? 360 : 140), surfY, tAbove + 0.2, null);
    // depth axis
    const ax = R.x + (P ? 6 : 36), axEnd = R.y + (P ? 1000 : 860);
    D.line([[ax, surfY], [ax, axEnd]], { t0: tAbove + 0.1, dur: 0.4, type: 'thin' });
    D.arrow([ax, axEnd + 4], [0, 1], { t0: tAbove + 0.5 });
    D.text('DEPTH', ax - 12, axEnd - 30, { size: 26, t0: tAbove + 0.45, rot: -90, guide: false });
    // ships (schematic side elevations)
    const ss = (P ? 300 : 340) / 113, shipsX = P ? [R.x + 20, R.x + 400] : [R.x + 300, R.x + 980];
    shipsX.forEach((sx, i) => {
      const keelY = surfY + 3.2 * ss, t0 = tAm - 2 * F + i * 0.18;
      D.line(toW(SHIP, sx, keelY, ss), { t0, dur: 0.45, type: 'thick', w: 2.6, name: `2A Ship ${i + 1}` });
      SHIP_TOP.forEach((pp, j) => D.line(pp.map(([x, y]) => [sx + x * ss, keelY - y * ss]), { t0: t0 + 0.3 + j * 0.04, dur: 0.12, type: 'thin', w: 2 }));
    });
    D.text(P ? 'U.S. DESTROYERS' : 'U.S. DESTROYERS (SCHEMATIC)', shipsX[0], surfY - 96, { size: P ? 30 : 28, t0: tAm + 0.15, cps: 34, name: '2A Ships label' });
    // the sub, small, deep
    const s2 = 4, subX = P ? R.x + 230 : R.x + 620, subKeel = R.y + (P ? 900 : 730);
    D.line(toW(HULL, subX, subKeel, s2), { t0: tAbove + 0.15, dur: 0.5, type: 'thick', w: 2.8, name: '2A Sub' });
    D.line(toW(SAIL, subX, subKeel, s2), { t0: tAbove + 0.55, dur: 0.2, type: 'thick', w: 2.8 });
    D.text('B-59', subX + 90 * s2 + 22, subKeel - 10, { size: 30, t0: tAbove + 0.7, cps: 20, weight: 500 });
    // charges: dashed fall path, the charge itself, then the burst symbol + number (order = time)
    const cx = P ? [R.x + 140, R.x + 300, R.x + 520, R.x + 690] : [R.x + 470, R.x + 600, R.x + 1050, R.x + 1210];
    const cy = P ? [R.y + 660, R.y + 730, R.y + 700, R.y + 640] : [R.y + 560, R.y + 630, R.y + 600, R.y + 545];
    const drops = [tDrop - 2 * F, tPrac + 0.05, tDepth - 0.05, tCh + 0.15], fall = 0.6;
    cx.forEach((x, i) => {
      const t0 = drops[i], x1 = x + (i % 2 ? -14 : 18), y0 = surfY + 8, y1 = cy[i];
      const path = Array.from({ length: 21 }, (_, k) => { const s = k / 20; return [x + (x1 - x) * s * s, y0 + (y1 - y0) * s]; });
      D.line(path, { t0, dur: fall, type: 'hidden', e: p => p * p * (1.6 - 0.6 * p) });
      const dot = svg('circle', { r: 8, fill: C.ink, stroke: 'none', 'data-name': `2A Charge ${i + 1}` }, D.gInk);
      D.fn(gt => { const p = progress(gt, t0, t0 + fall), e = p * p * (1.6 - 0.6 * p); dot.style.display = p > 0 && p < 1 ? '' : 'none'; const k = Math.min(20, Math.floor(e * 20)); const q = path[k]; dot.setAttribute('cx', q[0]); dot.setAttribute('cy', q[1]); });
      const tb = t0 + fall; bursts.push(tb);
      const r0 = P ? 26 : 30;
      D.line(ellipsePts(x1, y1, r0, r0), { t0: tb, dur: 0.18, type: 'thick', w: 2.6 });
      D.hatch(ellipsePts(x1, y1, r0, r0, 0, Math.PI * 2, 24), { angle: 45, spacing: 8, t0: tb + 0.05, dur: 0.15 });
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; D.line([[x1 + Math.cos(a) * (r0 + 10), y1 + Math.sin(a) * (r0 + 10)], [x1 + Math.cos(a) * (r0 + 28), y1 + Math.sin(a) * (r0 + 28)]], { t0: tb + 0.04, dur: 0.1, type: 'thin' }); }
    });
    // radio: hidden line up from the sail, broken — no signal reaches the boat
    const sail = [subX + 42 * s2, subKeel - 13.4 * s2];
    const rTop = surfY + (P ? 120 : 90);
    D.line([sail, [sail[0], rTop + 70]], { t0: tMos - 0.05, dur: 0.35, type: 'hidden', name: '2A Radio line' });
    breakLine([sail[0], rTop + 70], [sail[0], rTop], tMos + 0.3, 5);
    // note 3
    const nb = P ? { x: R.x + 60, y: R.y + 1030, w: 640, h: 200 } : { x: R.x + 1260, y: R.y + 700, w: 420, h: 196 };
    box(nb.x, nb.y, nb.w, nb.h, tMos - 0.1, 'thin', 0.45);
    D.line([[nb.x + 16, nb.y + 18], [nb.x + 56, nb.y + 18], [nb.x + 36, nb.y + 52], [nb.x + 16, nb.y + 18]], { t0: tMos + 0.25, dur: 0.15, type: 'thin' });
    D.text('3', nb.x + 36, nb.y + 40, { size: 20, t0: tMos + 0.35, anchor: 'middle', guide: false });
    const fl = [sail[0] + 30, rTop + 40]; // note flag 3 next to the broken radio line
    D.line([[fl[0], fl[1] - 18], [fl[0] + 40, fl[1] - 18], [fl[0] + 20, fl[1] + 16], [fl[0], fl[1] - 18]], { t0: tMos + 0.45, dur: 0.15, type: 'thin' });
    D.text('3', fl[0] + 20, fl[1] + 4, { size: 20, t0: tMos + 0.55, anchor: 'middle', guide: false });
    const nl = P ? ['NO WORD FROM MOSCOW', 'FOR DAYS.'] : ['NO WORD FROM', 'MOSCOW', 'FOR DAYS.'];
    textLines(nl, nb.x + 76, nb.y + 50, P ? 38 : 34, tMos + 0.25, 1.4, 26, 0.05).forEach((it, i) => it.node.setAttribute('data-name', '2B Note 3 line ' + (i + 1)));
  }

  /* =================== Q3 · DETAIL B: BOW (S3) =================== */
  const tOn = T('On', 0, 13.67), tNuc = T('nuclear', 0, 14.48), tTorp = T('torpedo.', 0, 14.88);
  if (want(3)) {
    const R = Q(3);
    const tt = P ? [['DETAIL B', 52], ['BOW · LONG. SECTION', 34], ['SIMPLIFIED · ILLUSTRATIVE', 24]] : [['DETAIL B · BOW, LONGITUDINAL SECTION', 40], ['SIMPLIFIED · ILLUSTRATIVE', 24]];
    let ty = R.y + (P ? 56 : 48), tt0 = tOn - 0.3;
    for (const [s, z] of tt) { D.text(s, R.x, ty, { size: z, t0: tt0, cps: 44, weight: z > 30 ? 500 : 400 }); tt0 += s.length / 44 + 0.05; ty += z * 1.5; }
    // landscape: bow to the right · portrait: the same view turned 90°, bow up (fills the tall frame)
    const x0m = P ? 77 : 75.5, s = P ? 70 : 88, ox = R.x + 90 - x0m * s, keel = R.y + 790;
    const pc = R.x + 330, ptop = R.y + 200;
    const p = P ? (x, y) => [pc + (y - 3.7) * s, ptop + (90.6 - x) * s] : pt(ox, keel, s);
    const out = samplePath(HULL, 0.6).map(q => p(...q));
    const run = [], src = samplePath(HULL, 0.6);
    src.forEach((q, i) => { if (q[0] >= x0m) run.push(out[i]); });
    // construction
    D.con(p(x0m - 1, 0), p(91, 0), { t0: tOn - 0.3, dur: 0.2 });
    D.con(p(x0m - 1, 7.4), p(91, 7.4), { t0: tOn - 0.22, dur: 0.2 });
    [84, 88.8, 81.2].forEach((x, i) => D.con(p(x, -0.8), p(x, 8.2), { t0: tOn - 0.1 + i * 0.06, dur: 0.15, over: 6 }));
    [2.3, 3.7, 5.1].forEach((y, i) => D.con(p(x0m - 1, y), p(91, y), { t0: tOn + 0.02 + i * 0.05, dur: 0.15, over: 6 }));
    // outer hull + break line where the detail is cut
    D.line(run, { t0: tOn, dur: 0.7, type: 'thick', name: '3A Bow outline' });
    breakLine(run.at(-1), run[0], tOn + 0.65, 9);
    // pressure hull walls + forward bulkhead, cut → hatched (ISO 128 section lines, 45°)
    const wallTop = [p(x0m, 6.4), p(84.4, 6.4), p(84.4, 6.85), p(x0m, 6.85)];
    const wallBot = [p(x0m, 0.45), p(84.4, 0.45), p(84.4, 0.9), p(x0m, 0.9)];
    const bulk = [p(84, 0.9), p(84.4, 0.9), p(84.4, 6.4), p(84, 6.4)];
    for (const [poly, i] of [[wallTop, 0], [wallBot, 1], [bulk, 2]]) {
      D.line([...poly, poly[0]], { t0: tOn + 0.45 + i * 0.1, dur: 0.3, type: 'thin' });
      D.hatch(poly, { angle: 45, spacing: P ? 9 : 11, t0: tOn + 0.7 + i * 0.1, dur: 0.35 });
    }
    // three bow tubes seen in this section (of six) — Ø533 mm
    const tr = 0.2665;
    [2.3, 3.7, 5.1].forEach((y, i) => {
      const t0 = tOn + 0.6 + i * 0.08;
      D.line([p(81.2, y + tr), p(88.8, y + tr)], { t0, dur: 0.25, type: 'thin', w: 2.2 });
      D.line([p(81.2, y - tr), p(88.8, y - tr)], { t0: t0 + 0.03, dur: 0.25, type: 'thin', w: 2.2 });
      D.line([p(81.2, y + tr + 0.1), p(81.2, y - tr - 0.1)], { t0: t0 + 0.25, dur: 0.06, type: 'thick' });
      D.line([p(88.8, y + tr), p(88.8, y - tr)], { t0: t0 + 0.27, dur: 0.06, type: 'thin' });
    });
    // the weapon: cross-hatched (two directions) so it reads as "the one" in a black-and-white drawing
    const yc = 3.7, rT = 0.235;
    const torp = [['M', 81.7, yc + rT * 0.45], ['L', 82.5, yc + rT], ['L', 87.9, yc + rT], ['C', 88.3, yc + rT, 88.45, yc + rT * 0.5, 88.45, yc], ['C', 88.45, yc - rT * 0.5, 88.3, yc - rT, 87.9, yc - rT], ['L', 82.5, yc - rT], ['L', 81.7, yc - rT * 0.45], ['L', 81.7, yc + rT * 0.45]];
    const tp = samplePath(torp, 0.6).map(q => p(...q));
    D.line(tp, { t0: tNuc - 2 * F, dur: 0.4, type: 'thick', w: 3.2, name: '3A Nuclear torpedo' });
    D.line([p(82.5, yc + rT), p(82.5, yc - rT)], { t0: tNuc + 0.35, dur: 0.06, type: 'thin' });
    D.hatch(tp, { angle: 45, spacing: 7, t0: tTorp - 0.05, dur: 0.3 });
    D.hatch(tp, { angle: -45, spacing: 7, t0: tTorp + 0.15, dur: 0.3 });
    D.line([p(80.4, yc), p(90.8, yc)], { t0: tNuc + 0.1, dur: 0.4, type: 'center' });
    // balloon 1 + parts list line; Ø533 leader
    const fsL = P ? 40 : 48, labW = 15 * MONO_ADV * fsL;
    const bal = P ? [R.x + 40, ptop + 13.6 * s + 80] : [R.x + R.w - labW - 60, R.y + 92];
    D.balloon(bal, P ? 30 : 34, '2', p(85.6, yc + rT), { t0: tTorp + 0.05, size: P ? 30 : 34 });
    D.text('NUCLEAR TORPEDO', bal[0] + (P ? 46 : 54), bal[1] + 14, { size: fsL, t0: tTorp + 0.15, cps: 30, weight: 500, name: '3A Parts list torpedo' });
    const fsT = P ? 26 : 28, tw = 13 * MONO_ADV * fsT;
    if (P) {
      const lt = p(86.0, 5.1 + tr), lb = [R.x + R.w - 8 * MONO_ADV * fsT - 6, R.y + 330];
      D.line([lt, [lb[0] - 16, lb[1]], [lb[0] + 8 * MONO_ADV * fsT, lb[1]]], { t0: tTorp + 0.3, dur: 0.25, type: 'thin' });
      D.fill(ellipsePts(lt[0], lt[1], 4.5, 4.5, 0, 7, 10), { t0: tTorp + 0.3 });
      D.text('Ø533', lb[0], lb[1] - 12, { size: fsT, t0: tTorp + 0.5, cps: 40, guide: false, name: '3A Tube note' });
      D.text('TUBE (6)', lb[0], lb[1] + 34, { size: fsT, t0: tTorp + 0.65, cps: 40, guide: false, name: '3A Tube note 2' });
    } else {
      const lt = p(88.0, 2.3 - tr), lb = [R.x + R.w - tw - 10, keel + 34];
      D.line([lt, [lb[0] - 16, lb[1]], [lb[0] + tw, lb[1]]], { t0: tTorp + 0.3, dur: 0.25, type: 'thin' });
      D.fill(ellipsePts(lt[0], lt[1], 4.5, 4.5, 0, 7, 10), { t0: tTorp + 0.3 });
      D.text('Ø533 TUBE (6)', lb[0], lb[1] - 12, { size: fsT, t0: tTorp + 0.5, cps: 40, guide: false, name: '3A Tube note' });
    }
  }

  /* =================== Q4 · NOTES, REVISIONS, TITLE BLOCK (S3–S4) =================== */
  const tFire = T('fire', 0, 15.9), tThree = T('three', 0, 16.51), tOff = T('officers', 0, 16.86), tTwo = T('Two', 0, 18.29), tYes = T('yes.', 0, 18.8);
  const tThird = T('third,', 0, 20.25), tVas = T('Vasili', 0, 20.61), tSays = T('says', 0, 21.69), tNo = T('no.', 0, 22.03);
  const tWorld = T('world', 0, 23.07), tName = T('name', 0, 23.73), tForty = T('forty', 0, 24.13), tYears = T('years', 0, 24.46);
  const geoOut = {};
  {  // Q4 always built for geometry; cheap
    const R = Q(4);
    // general notes (pre-lettered) — in portrait they live under detail B
    const notes = ['GENERAL NOTES', '1. ILLUSTRATIVE DRAWING,', '   NOT TO SCALE.', '2. LENGTH ≈ 90 M; SOURCES', '   GIVE 89.9–91.3 M.', '3. POSITIONS APPROXIMATE.', '4. THE VOTE IS KNOWN', '   FROM LATER ACCOUNTS.'];
    const nPos = { x: R.x, y: R.y + 40, size: 24 };
    if (P) D.text('NOTE: THE VOTE IS KNOWN FROM LATER ACCOUNTS.', R.x, R.y + 512, { size: 18, t0: pre, guide: false, name: 'Note vote accounts' });
    else notes.forEach((s, i) => D.text(s, nPos.x, nPos.y + i * nPos.size * 1.55 + (i ? 14 : 0), { size: nPos.size, t0: pre, weight: i ? 400 : 500, guide: !i, name: 'General notes ' + i }));

    // layout
    const tb = P ? { x: R.x, y: R.y + 540, w: R.w } : { x: R.x + 420, y: R.y + 412, w: R.w - 420 };
    tb.h = R.y + R.h - tb.y;
    const rev = P ? { x: R.x, y: R.y + 250, w: R.w, h: 220 } : { x: tb.x, y: R.y + 200, w: tb.w, h: 190 };
    const dimY = P ? R.y + 150 : R.y + 120;

    // ---- revision table (pre-printed frame) ----
    const rh = 40, rr = (rev.h - rh) / 2, c1 = 90, c2 = P ? 210 : 260;
    box(rev.x, rev.y, rev.w, rev.h, pre, 'thick');
    D.line([[rev.x, rev.y + rh], [rev.x + rev.w, rev.y + rh]], { t0: pre, type: 'thin' });
    D.line([[rev.x, rev.y + rh + rr], [rev.x + rev.w, rev.y + rh + rr]], { t0: pre, type: 'thin' });
    D.line([[rev.x + c1, rev.y], [rev.x + c1, rev.y + rev.h]], { t0: pre, type: 'thin' });
    D.line([[rev.x + c1 + c2, rev.y], [rev.x + c1 + c2, rev.y + rev.h]], { t0: pre, type: 'thin' });
    [['REV', 0], ['DATE', c1], ['DESCRIPTION', c1 + c2]].forEach(([s, x]) => D.text(s, rev.x + x + 14, rev.y + 28, { size: 20, t0: pre, guide: false }));
    // rev A — red pencil, written during the pull-back
    const rA = rev.y + rh + rr / 2 + 12, rB = rev.y + rh + rr * 1.5 + 12, rvS = P ? 30 : 30;
    const triA = [rev.x + c1 / 2, rA - 4];
    D.line([[triA[0], triA[1] - 30], [triA[0] + 26, triA[1] + 16], [triA[0] - 26, triA[1] + 16], [triA[0], triA[1] - 30]], { t0: tNo + 0.7, dur: 0.25, type: 'red', w: 4.5 });
    D.text('A', triA[0], triA[1] + 9, { size: 26, t0: tNo + 0.9, anchor: 'middle', red: true, guide: false, weight: 500 });
    D.text('27.10.62', rev.x + c1 + 14, rA, { size: rvS, t0: tNo + 0.95, cps: 26, red: true, guide: false, name: '4B Rev A date' });
    D.text(P ? 'FIRE ORDER REFUSED' : 'FIRE ORDER NOT APPROVED', rev.x + c1 + c2 + 16, rA, { size: rvS, t0: tNo + 1.2, cps: 30, red: true, guide: false, name: '4B Rev A text' });
    // rev B — the world learns
    D.text('B', rev.x + c1 / 2, rB, { size: 30, t0: tWorld - 0.05, anchor: 'middle', guide: false, weight: 500 });
    D.text('2002', rev.x + c1 + 14, rB, { size: rvS, t0: tWorld + 0.05, cps: 20, name: '4B Rev B date' });
    D.text(P ? 'HIS NAME MADE PUBLIC' : 'ACCOUNT MADE PUBLIC — HIS NAME', rev.x + c1 + c2 + 16, rB, { size: rvS, t0: tWorld + 0.3, cps: 34, name: '4B Rev B text' });

    // ---- 40-year dimension: time measured like a length ----
    const dx0 = rev.x + (P ? 70 : 120), dx1 = rev.x + rev.w - (P ? 70 : 120);
    D.line([[dx0, dimY - 64], [dx0, rev.y - 10]], { t0: tForty - 0.25, dur: 0.15, type: 'thin' });
    D.line([[dx1, dimY - 64], [dx1, rev.y - 10]], { t0: tForty - 0.18, dur: 0.15, type: 'thin' });
    const dm = (dx0 + dx1) / 2;
    D.line([[dm, dimY], [dx0, dimY]], { t0: tForty - 0.05, dur: 0.3, type: 'thin', w: 2.2, e: ez.move });
    D.line([[dm, dimY], [dx1, dimY]], { t0: tForty - 0.05, dur: 0.3, type: 'thin', w: 2.2, e: ez.move });
    D.arrow([dx0, dimY], [-1, 0], { t0: tForty + 0.25, size: 30 }); D.arrow([dx1, dimY], [1, 0], { t0: tForty + 0.25, size: 30 });
    D.text('40 YEARS', dm, dimY - 22, { size: P ? 76 : 84, t0: tYears - 0.05, cps: 22, anchor: 'middle', weight: 500, guide: false, name: '4B 40 years' });
    D.text('1962', dx0 + 14, dimY + 52, { size: P ? 36 : 40, t0: tForty - 0.15, cps: 24, guide: false, name: '4B 1962' });
    D.text('2002', dx1 - 14, dimY + 52, { size: P ? 36 : 40, t0: tForty + 0.1, cps: 24, anchor: 'end', guide: false, name: '4B 2002' });

    // ---- title block (pre-printed frame) ----
    box(tb.x, tb.y, tb.w, tb.h, pre, 'thick');
    const lab = (s, x, y) => D.text(s, x + 12, y + 26, { size: 18, t0: pre, guide: false, name: 'TB label ' + s });
    let ap, info;
    if (P) {
      ap = { x: tb.x, y: tb.y, w: tb.w, h: 56 + 3 * 150 };
      info = { x: tb.x, y: tb.y + ap.h, w: tb.w, h: tb.h - ap.h };
      D.line([[tb.x, info.y], [tb.x + tb.w, info.y]], { t0: pre, type: 'thick' });
    } else {
      info = { x: tb.x, y: tb.y, w: 470, h: tb.h };
      ap = { x: tb.x + 470, y: tb.y, w: tb.w - 470, h: tb.h };
      D.line([[ap.x, tb.y], [ap.x, tb.y + tb.h]], { t0: pre, type: 'thick' });
    }
    // info cells
    const vals = [['DRAWN', 'ONCLACK'], ['DATE', '27.10.1962'], ['SCALE', 'N.T.S.'], ['SHEET', '1 OF 1']];
    if (P) {
      const th = 130; D.line([[info.x, info.y + th], [info.x + info.w, info.y + th]], { t0: pre, type: 'thin' });
      lab('TITLE', info.x, info.y);
      D.text('SUBMARINE B-59 · PROJECT 641', info.x + 14, info.y + 76, { size: 30, t0: pre, guide: false, weight: 500 });
      D.text('GENERAL ARRANGEMENT · ILLUSTRATIVE', info.x + 14, info.y + 112, { size: 20, t0: pre, guide: false });
      const cw = info.w / 4;
      vals.forEach(([l, v], i) => {
        const x = info.x + i * cw; if (i) D.line([[x, info.y + th], [x, info.y + info.h]], { t0: pre, type: 'thin' });
        lab(l, x, info.y + th);
        D.text(v, x + 12, info.y + th + 86, { size: v.length > 8 ? 20 : 24, t0: l === 'DATE' ? t27 : pre, cps: 20, guide: false, weight: 500, name: 'TB ' + l });
      });
    } else {
      const th = 176; D.line([[info.x, info.y + th], [info.x + info.w, info.y + th]], { t0: pre, type: 'thin' });
      lab('TITLE', info.x, info.y);
      D.text('SUBMARINE B-59', info.x + 14, info.y + 84, { size: 42, t0: pre, guide: false, weight: 500 });
      D.text('PROJECT 641 · GENERAL ARRANGEMENT', info.x + 14, info.y + 122, { size: 22, t0: pre, guide: false });
      D.text('ILLUSTRATIVE · NOT A SURVEY DRAWING', info.x + 14, info.y + 152, { size: 18, t0: pre, guide: false });
      const ch = (info.h - th) / 2, cw = info.w / 2;
      D.line([[info.x, info.y + th + ch], [info.x + info.w, info.y + th + ch]], { t0: pre, type: 'thin' });
      D.line([[info.x + cw, info.y + th], [info.x + cw, info.y + info.h]], { t0: pre, type: 'thin' });
      vals.forEach(([l, v], i) => {
        const x = info.x + (i % 2) * cw, y = info.y + th + Math.floor(i / 2) * ch;
        lab(l, x, y);
        D.text(v, x + 14, y + ch * 0.68, { size: 32, t0: l === 'DATE' ? t27 : pre, cps: 20, guide: false, weight: 500, name: 'TB ' + l });
      });
    }
    // approvals
    const hh = 56, rowH = (ap.h - hh) / 3, cF = P ? 110 : 110, cR = P ? 380 : 380;
    D.line([[ap.x, ap.y + hh], [ap.x + ap.w, ap.y + hh]], { t0: pre, type: 'thick' });
    D.text('APPROVAL TO FIRE · SPECIAL WEAPON', ap.x + 16, ap.y + 37, { size: P ? 24 : 26, t0: pre, guide: false, weight: 500, name: 'TB approvals header' });
    for (let i = 1; i < 3; i++) D.line([[ap.x, ap.y + hh + i * rowH], [ap.x + ap.w, ap.y + hh + i * rowH]], { t0: pre, type: 'thin' });
    D.line([[ap.x + cF, ap.y + hh], [ap.x + cF, ap.y + ap.h]], { t0: pre, type: 'thin' });
    D.line([[ap.x + cF + cR, ap.y + hh], [ap.x + cF + cR, ap.y + ap.h]], { t0: pre, type: 'thin' });
    const roles = ['COMMANDING OFFICER', 'POLITICAL OFFICER', 'FLOTILLA CHIEF OF STAFF'];
    const sigX = ap.x + cF + cR, sigW = ap.w - cF - cR;
    roles.forEach((role, i) => {
      const ry = ap.y + hh + i * rowH;
      lab(`${i + 1}`, ap.x, ry);
      D.text('SIGNATURE', sigX + 12, ry + 26, { size: 16, t0: pre, guide: false, name: 'TB sig label ' + (i + 1) });
      D.figure(ap.x + cF / 2, ry + rowH / 2 + 6, P ? 30 : 32, { t0: tThree - 2 * F + i * 0.13, facing: -90 });
      D.text(role, ap.x + cF + 14, ry + 50, { size: 25, t0: tOff + 0.05 + i * 0.32, cps: 40, name: `4A Role ${i + 1}` });
      // signature line (pre-printed) inside the cell
      D.line([[sigX + 20, ry + rowH - 30], [sigX + sigW - 20, ry + rowH - 30]], { t0: pre, type: 'thin', w: 1 });
    });
    // two signatures — "two say yes"
    [0, 1].forEach(i => {
      const ry = ap.y + hh + i * rowH;
      D.line(signaturePts(31 + i * 17, sigX + 34, ry + rowH - 46, sigW - 70, rowH * 0.5), { t0: (i ? tYes - 0.12 : tTwo - 2 * F), dur: 0.55, type: 'thin', w: 2.6, e: ez.pen, name: `4A Signature ${i + 1}` });
    });
    // row 3 — the name, lettered by hand
    const r3 = ap.y + hh + 2 * rowH;
    D.text('VASILI ARKHIPOV', ap.x + cF + 14, r3 + 104, { size: P ? 34 : 34, t0: tVas - 2 * F, cps: 19, weight: 500, name: '4A Name Arkhipov' });
    // red pencil: NO
    const k = Math.min(1, (rowH - 44) / 150), nx = sigX + sigW / 2 - 100 * k, ny = r3 + 36;
    const R2 = (pts) => pts.map(([x, y]) => [nx + x * k, ny + y * k]);
    const tN = tNo - 3 * F;
    D.line(R2([[2, 118], [4, 60], [7, 0]]), { t0: tN, dur: 0.1, type: 'red', name: '4A NO (red pencil)' });
    D.line(R2([[7, 0], [40, 60], [72, 116]]), { t0: tN + 0.1, dur: 0.11, type: 'red' });
    D.line(R2([[72, 116], [74, 50], [79, -4]]), { t0: tN + 0.21, dur: 0.1, type: 'red' });
    D.line(R2(ellipsePts(150, 58, 44, 62, -1.75, -1.75 + Math.PI * 2.15, 40).map(([x, y], i) => [x + i * 0.12, y])), { t0: tN + 0.33, dur: 0.24, type: 'red' });
    D.line(R2([[-18, 146], [100, 140], [222, 134]]), { t0: tN + 0.6, dur: 0.13, type: 'red', w: 5 });
    D.line(R2([[10, 162], [120, 157], [200, 154]]), { t0: tN + 0.74, dur: 0.11, type: 'red', w: 4 });
    // red pencil ring around the whole row 3 entry (loose, by hand)
    const rc = [ap.x + 110 + (ap.w - 110) / 2 + 6, r3 + rowH / 2 + 4];
    D.line(ellipsePts(rc[0], rc[1], (ap.w - 110) / 2 + 14, rowH / 2 + 14, 2.6, 2.6 + Math.PI * 2.08, 70).map(([x, y], i) => [x, y + Math.sin(i / 9) * 3]), { t0: tNo + 0.45, dur: 0.4, type: 'red', w: 4 });

    geoOut.tb = tb; geoOut.ap = ap; geoOut.rev = rev; geoOut.r3 = { x: ap.x, y: r3, w: ap.w, h: rowH }; geoOut.dimY = dimY; geoOut.R = R;
  }

  /* =================== camera =================== */
  const frameQ = n => { const q = Q(n); return [q.ox + S.cx, q.oy + S.cy]; };
  const fit = (r, m = 1) => Math.min(S.w / (r.w * m), S.h / (r.h * m));
  const g4 = geoOut;
  const shots = {
    q1: { z: 1.02, c: frameQ(1) },
    title: P ? { z: 1.05, c: [Q(1).x + 360, Q(1).y + 465] } : { z: 1.4, c: [Q(1).x + 470, Q(1).y + 150] }, // shows the sheet's brushed edge on the table
    q2: { z: 1.02, c: frameQ(2) },
    q3: { z: 1.02, c: frameQ(3) },
    tb: P ? { z: 1, c: [g4.ap.x + g4.ap.w / 2, g4.ap.y + g4.ap.h / 2 - 20] } : { z: fit({ w: g4.tb.w, h: g4.tb.h }, 1.07), c: [g4.tb.x + g4.tb.w / 2, g4.tb.y + g4.tb.h / 2] },
    r3: P ? { z: 1.2, c: [g4.r3.x + g4.r3.w / 2 + 50, g4.r3.y + g4.r3.h / 2] } : { z: 2.4, c: [g4.ap.x + 110 + (g4.ap.w - 110) / 2, g4.r3.y + g4.r3.h / 2] },
    end: P ? { z: 0.62, c: [Wd * 2 + 60 - (Wd - S.cx) / 0.62, HH + 60 - (Hd - S.cy) / 0.62] } : { z: 0.486, c: [WW / 2, HH / 2] },
  };
  const tCut3 = 15.6;
  const tPull0 = tNo + 0.95, tPull1 = tPull0 + 1.35;
  const lerp = (a, b, p) => a + (b - a) * p;
  function camera(sceneId, gt) {
    let z, c;
    const creep = (sh, t0, rate = 0.006) => [sh.z * (1 + Math.max(0, gt - t0) * rate), sh.c];
    if (sceneId === 's1') { // hook: close on the date, then pull back to reveal the drawing as the pen starts on the hull
      const a = shots.title, b = shots.q1, p = ez.camera(progress(gt, tSov - 0.45, tSov + 0.75));
      const za = a.z * (1 + gt * (P ? 0.004 : 0.012)), zb = b.z * (1 + Math.max(0, gt - tSov) * 0.005);
      z = Math.exp(lerp(Math.log(za), Math.log(zb), p)); c = [lerp(a.c[0], b.c[0], p), lerp(a.c[1], b.c[1], p)];
    }
    else if (sceneId === 's2') {
      [z, c] = creep(shots.q2, 7.2, 0.006);
      // small hull-borne shudder on each burst (noise-free decaying sine, ≤ 3 px)
      let dy = 0; for (const tb of bursts) { const d = gt - tb; if (d > 0 && d < 0.5) dy += 3 * Math.exp(-d * 9) * Math.sin(d * 55); }
      c = [c[0], c[1] - dy / z];
    } else if (sceneId === 's3') {
      if (gt < tCut3) [z, c] = creep(shots.q3, 13.3, 0.007);
      else [z, c] = creep(shots.tb, tCut3, 0.006);
    } else {
      const a = shots.r3, b = shots.end;
      if (gt < tPull0) [z, c] = creep(a, 19.7, 0.008);
      else {
        const z0 = a.z * (1 + (tPull0 - 19.7) * 0.008);
        const p = ez.camera(progress(gt, tPull0, tPull1));
        z = Math.exp(lerp(Math.log(z0), Math.log(b.z), p));
        // keep the screen position of the NO steady-ish while zooming out (blend of both centres)
        c = [lerp(a.c[0], b.c[0], p), lerp(a.c[1], b.c[1], p)];
        z *= 1 + Math.max(0, gt - tPull1) * 0.004;
      }
    }
    D.setCamera(z, c[0], c[1], !((sceneId === 's4' && gt > tPull0) || sceneId === 's1'));
  }

  return {
    D, bursts,
    update(sceneId, gt) { camera(sceneId, gt); D.update(gt); },
  };
}
