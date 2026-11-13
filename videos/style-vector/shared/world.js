// VECTOR CRT — the whole 26 s film as ONE display list in GLOBAL time. Every scene module builds this same world and
// only shows its own time window, so cuts are invisible; the only visible "cuts" are the two storage-tube erases.
import { clamp, rand } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep } from '/onclack-styles/engine/lib/spring.js';
import { buildTube, makeDisplay, textStrokes, textWidth, place, circlePts } from './tube.js';

const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
const wordAt = (words, w, n = 0, fb = 0) => (words.filter(x => norm(x.word) === norm(w))[n]?.start ?? fb);
const F = 1 / 30;

/* ---------- shapes (local units, drawn by us from photos/plans, simplified) ---------- */
// Foxtrot-class (Project 641) submarine, side view, length 100
const SUB = [
  [[-50, 0], [-45, -4.2], [38, -4.6], [46, -3], [50, 0.2], [47, 3.4], [-40, 4], [-50, 0]],
  [[-9, -4.4], [-7, -12.5], [8, -12.5], [10.5, -4.6]],
  [[1, -12.5], [1, -17]], [[4, -12.5], [4, -15]],
  [[-47, -1.5], [-53, -3.5]], [[-47, 1.5], [-53, 3.2]],
];
// destroyer, side view, length 100 (waterline y = 0)
const SHIP = [
  [[-50, -3], [-47, 3], [43, 3], [50, -6.5], [32, -5.2], [-50, -3]],
  [[-24, -4], [-21, -12], [-15, -12], [-14, -4.2]],
  [[-6, -4.4], [-6, -10], [10, -10], [12, -14.5], [19, -14.5], [21, -5]],
  [[6, -10], [6, -26]], [[1, -21.5], [11, -21.5]],
  [[28, -5.6], [36, -8.2]], [[-36, -3.6], [-42, -6]],
];
// T-5 nuclear torpedo (533 mm), side view, length 100, diameter exaggerated ×1.3 so it reads
const TORP = [
  [[-38, -3.5], [40, -3.5], ...[0.25, 0.5, 0.75].map(k => [40 + 10 * Math.sin(k * Math.PI / 2), -3.5 * Math.cos(k * Math.PI / 2)]), [50, 0],
    ...[0.75, 0.5, 0.25].map(k => [40 + 10 * Math.sin(k * Math.PI / 2), 3.5 * Math.cos(k * Math.PI / 2)]), [40, 3.5], [-38, 3.5]],
  [[-38, -3.5], [-46, -1.7], [-46, 1.7], [-38, 3.5]],
  [[-42, -3.1], [-46.8, -5.2], [-48.4, -5.2], [-46, -1.7]],
  [[-42, 3.1], [-46.8, 5.2], [-48.4, 5.2], [-46, 1.7]],
  [[-48.2, -3.2], [-48.2, 3.2]], [[-49.4, -2.4], [-49.4, 2.4]],
  [[22, -3.5], [22, 3.5]], [[-12, -3.5], [-12, 3.5]],
];
// three officers: each his own posture (feet at 0, height ≈ 100). No faces — a circle is a head, nothing more.
const head = (x, y, r = 7) => circlePts(x, y, r, 20, Math.PI / 2, Math.PI / 2 + Math.PI * 2);
const cap = x => [[x - 9, -95], [x + 8, -95], [x + 6, -98.5], [x - 5, -100], [x - 9, -95]];
const FIG = [
  { // captain: weight on one leg, hand on hip, cap
    body: [head(1, -87.5), cap(1), [[-11, -76], [12, -76]], [[1, -80], [2, -46]], [[-6, -46], [9, -46]],
      [[-5, -46], [-8, -23], [-7, 0]], [[8, -46], [12, -23], [15, 0]], [[-11, -76], [-14, -58], [-15, -41]], [[12, -76], [20, -62], [9, -50]]],
  },
  { // political officer: arms folded, feet apart, bare head turned slightly
    body: [head(-1, -88), [[-12, -76], [11, -76]], [[0, -80], [0, -46]], [[-7, -46], [7, -46]],
      [[-6, -46], [-8, -23], [-11, 0]], [[6, -46], [8, -23], [11, 0]], [[-12, -76], [-15, -62], [9, -59]], [[11, -76], [14, -63], [-9, -61.5]]],
  },
  { // the third: standing still, feet together, cap, arms down (right arm is animated separately)
    body: [head(0, -88), cap(0), [[-11, -76], [11, -76]], [[0, -80], [0, -46]], [[-6, -46], [6, -46]],
      [[-4, -46], [-4.5, -23], [-4, 0]], [[4, -46], [4.5, -23], [4, 0]], [[11, -76], [13, -60], [12.5, -43]]],
  },
];
const ARM_REST = [[-11, -76], [-13, -60], [-12.5, -43]];
// "halt": forearm level at chest height, reaching toward the other two, palm up-right like a hand held against them.
// Not a raised arm, not a wave.
const ARM_STOP = [[-11, -76], [-21, -63], [-34, -64]];
const palm = (x, y, k) => [[[x, y + 1], [x, y - 7 * k]], [[x - 1.6, y + 0.5], [x - 1.6, y - 7.5 * k]], [[x - 3.2, y + 0.5], [x - 3.2, y - 6.8 * k]], [[x - 4.6, y + 1], [x - 4.6, y - 5.5 * k]], [[x + 0.4, y + 2], [x + 3 * k, y - 1.5 * k]]];

/* ---------- map ---------- */
function mapStrokes(geo, box, [lo0, lo1, la0, la1]) {
  const k = Math.cos(23 * Math.PI / 180);
  const s = Math.min(box.w / ((lo1 - lo0) * k), box.h / (la1 - la0));
  const ox = box.x + (box.w - (lo1 - lo0) * k * s) / 2, oy = box.y + (box.h - (la1 - la0) * s) / 2;
  const P = (lo, la) => [ox + (lo - lo0) * k * s, oy + (la1 - la) * s];
  const inside = ([lo, la]) => lo >= lo0 && lo <= lo1 && la >= la0 && la <= la1;
  const order = ['United States of America', 'Cuba', 'Bahamas', 'Haiti', 'Dominican Rep.', 'Jamaica', 'Turks and Caicos Is.', 'Mexico', 'Cayman Is.'];
  const out = [];
  for (const name of order) for (const f of geo.features.filter(f => f.name === name)) for (const ring of f.rings) {
    let cur = [];
    for (const p of ring) { if (inside(p)) cur.push(P(...p)); else { if (cur.length > 1) out.push(cur); cur = []; } }
    if (cur.length > 1) out.push(cur);
  }
  const big = out.filter(pl => { const xs = pl.map(p => p[0]), ys = pl.map(p => p[1]); return Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys) > 7; });
  return { strokes: big, P, s, frame: [ox, oy, (lo1 - lo0) * k * s, (la1 - la0) * s] };
}

export async function buildWorld(root, ctx) {
  const L = ctx.layout, u = L.unit, P = L.portrait, words = ctx.words;
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const tube = buildTube(root, ctx, ctx.layout.format + '-' + Math.round(ctx.start * 100));
  const D = makeDisplay(tube, { winFrom: ctx.start, winTo: ctx.start + ctx.duration });
  const S = L.safe, at = L.at, px = L.px;
  const w = (x, n, fb) => wordAt(words, x, n, fb);
  const FS = 2600; // default beam speed (design px/s)

  /* ================= 1 · THE DATE AND THE PLACE ================= */
  const dCap = px(P ? 118 : 96);
  const [dx, dy] = P ? at(0, 0.0) : at(0, 0.05);
  D.text('27 OCT', dx, dy, dCap, { t0: w('October') - 2 * F, dur: 0.75, name: 'Date "27 OCT"' });
  D.text('1962', dx, dy + dCap * 1.55, dCap, { t0: w('nineteen') - 2 * F, dur: 0.55, name: 'Year 1962' });
  const mbox = P ? { x: S.x, y: at(0, 0.235)[1], w: S.w, h: S.h * 0.57 } : { x: at(0.37, 0)[0], y: S.y, w: S.w * 0.63, h: S.h };
  const range = P ? [-84.5, -70.5, 18.4, 30.2] : [-85.5, -67.5, 17.6, 28.2];
  const map = mapStrokes(geo, mbox, range);
  // lat/long ticks on the map frame (dim) — the beam lays the reference before the coast
  const [fx, fy, fw, fh] = map.frame, tk = px(10), grid = [];
  for (let lo = Math.ceil(range[0] / 5) * 5; lo <= range[1]; lo += 5) { const [x] = map.P(lo, range[2]); grid.push([[x, fy], [x, fy + tk]], [[x, fy + fh], [x, fy + fh - tk]]); }
  for (let la = Math.ceil(range[2] / 5) * 5; la <= range[3]; la += 5) { const [, y] = map.P(range[0], la); grid.push([[fx, y], [fx + tk, y]], [[fx + fw, y], [fx + fw - tk, y]]); }
  D.draw([[[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh], [fx, fy]], ...grid], { t0: 0.12, dur: 0.38, int: 0.38, w: 0.8, name: 'Map frame + lat/long ticks' });
  D.draw(map.strokes, { t0: w('sixty-two.') + 0.12, dur: 1.55, int: 0.86, name: 'Coastlines (Natural Earth)' });
  const [mx, my] = map.P(-72.2, 24.4); // illustrative: open sea NE of Cuba; the real track is not precisely known
  D.draw([circlePts(mx, my, px(13), 24), [[mx - px(22), my], [mx - px(6), my]], [[mx + px(6), my], [mx + px(22), my]], [[mx, my - px(22)], [mx, my - px(6)]], [[mx, my + px(6)], [mx, my + px(22)]]],
    { t0: w('hides') - 3 * F, dur: 0.32, name: 'B-59 position marker' });
  const lab = P ? [mx - px(30), my - px(70)] : [mx + px(34), my - px(64)];
  D.draw([[[mx + (P ? -px(9) : px(9)), my - px(10)], [lab[0] + (P ? px(0) : -px(4)), lab[1] + px(36)]]], { speed: 2200, int: 0.7, name: 'Leader' });
  D.text('B-59', lab[0], lab[1], px(32), { anchor: P ? 'end' : 'start', speed: 1700, name: 'Label B-59' });
  const [cx1, cy1] = map.P(P ? -79.6 : -79.4, P ? 20.6 : 20.6);
  D.text('CUBA', cx1, cy1, px(28), { t0: w('Cuba.') - 2 * F, anchor: 'middle', speed: 1600, int: 0.85, name: 'Label CUBA' });
  // left column / bottom block: what and where (hedged)
  const [ix, iy] = P ? at(0, 0.83) : at(0, 0.52);
  D.text('SOVIET SUBMARINE', ix, iy, px(P ? 34 : 32), { t0: w('Soviet') - 2 * F, dur: 0.5, name: 'Caption 1' });
  D.text('SUBMERGED', ix, iy + px(P ? 58 : 54), px(P ? 34 : 32), { t0: w('deep') - 3 * F, dur: 0.32, name: 'Caption 2' });
  D.text('POSITION ILLUSTRATIVE', ix, iy + px(P ? 112 : 104), px(18), { t0: w('sea') - 2 * F, dur: 0.38, int: 0.55, name: 'Honesty note' });
  const E1 = w('Above') - 0.16;
  D.erase(E1);

  /* ================= 2 · THE PRESSURE ================= */
  const surfY = P ? at(0, 0.12)[1] : at(0, 0.24)[1];
  const subC = P ? at(0.53, 0.5) : at(0.44, 0.62), subS = P ? 5.6 : 5.4;
  D.draw(place(SUB, subC[0], subC[1], px(subS)), { t0: E1 + 0.1, dur: 0.42, name: 'Submarine B-59 (side)' });
  const wave = []; for (let x = S.x; x <= S.x + S.w + 0.1; x += px(12)) wave.push([x, surfY + Math.sin(x / px(37)) * px(2.2) + Math.sin(x / px(11)) * px(0.8)]);
  D.draw([wave], { t0: w('it,', 0, 7.9) - 0.02, dur: 0.22, int: 0.7, name: 'Sea surface' });
  const shipX = P ? [0.14, 0.5, 0.86] : [0.24, 0.46, 0.68], shipS = P ? 2.1 : 2.2;
  shipX.forEach((fxs, i) => D.draw(place(SHIP, at(fxs, 0)[0], surfY - px(2), px(shipS)), { t0: w('American') + i * 0.24, dur: 0.22, name: `US destroyer ${i + 1}` }));
  // depth ticks down the left edge: the water column, deliberately without numbers (depth not known exactly)
  const dTop = surfY + px(24), dBot = subC[1] + px(P ? 60 : 50), dTk = [];
  for (let y = dTop, i = 0; y <= dBot; y += px(P ? 32 : 26), i++) dTk.push([[S.x, y], [S.x + px(i % 5 ? 10 : 22), y]]);
  D.draw([[[S.x, dTop], [S.x, dBot]], ...dTk], { speed: 5200, int: 0.4, w: 0.8, name: 'Depth ticks (no numbers)' });
  D.text('US NAVY', at(shipX[0], 0)[0] - px(110), surfY - px(P ? 96 : 92), px(22), { int: 0.6, speed: 1700, name: 'Label US NAVY' });
  D.text(P ? 'NOT TO SCALE' : 'DIAGRAM · NOT TO SCALE', P ? S.x + px(36) : S.x, P ? at(0, 0.6)[1] : S.y + S.h - px(18), px(16), { int: 0.45, speed: 2000, name: 'Truth label' });
  // practice depth charges: re-drawn every refresh → each falling charge leaves its own fading copies
  const bursts = [w('practice'), w('depth'), w('charges.')].map((t, i) => t + 0.08 + i * 0.03);
  const bx = P ? [0.3, 0.62, 0.42] : [0.33, 0.52, 0.6];
  const by = [-px(48), -px(28), px(46)];
  const charges = bursts.map((tb, i) => ({ tb, tr: tb - 0.6, x0: at(shipX[i], 0)[0] + px(10), x1: at(bx[i], 0)[0], y1: subC[1] + by[i] }));
  const chargePos = (c, t) => { const k = clamp((t - c.tr) / (c.tb - c.tr)); return [c.x0 + (c.x1 - c.x0) * k, surfY + (c.y1 - surfY) * (k * k * 0.35 + k * 0.65)]; };
  D.dyn(t => {
    const out = [];
    for (const c of charges) {
      if (t >= c.tr && t < c.tb) for (let g = 0; g < 4; g++) { const [x, y] = chargePos(c, Math.max(c.tr, t - g * 1.5 * F)); out.push({ pts: circlePts(x, y, px(6), 10), o: [1, 0.45, 0.2, 0.08][g], hot: g ? 0 : 0.4 }); }
      const x = t - c.tb;
      if (x >= 0 && x < 1.1) {
        const r1 = px(90) * (1 - Math.exp(-x * 5)), r2 = px(150) * (1 - Math.exp(-x * 3));
        out.push({ pts: circlePts(c.x1, c.y1, r1, 40), o: Math.exp(-x / 0.35), hot: Math.exp(-x / 0.12) });
        out.push({ pts: circlePts(c.x1, c.y1, r2, 48), o: 0.5 * Math.exp(-x / 0.4) });
      }
    }
    return out;
  }, { max: 14, name: 'Depth charges', from: E1, to: 12 });
  D.jitter = t => { // deflection amplifiers shake: the whole picture, not the glass
    let dx = 0, sy = 1;
    for (const tb of bursts) { const x = t - tb; if (x >= 0 && x < 0.6) { const e = Math.exp(-x / 0.12); dx += px(9) * e * Math.sin(x * 2 * Math.PI * 17); sy += 0.012 * e * Math.sin(x * 2 * Math.PI * 11 + 1); } }
    return { dx, sy };
  };
  // MOSCOW: a flat line, swept again and again
  const win = P ? { x: S.x, y: at(0, 0.68)[1], w: S.w, h: S.h * 0.18 } : { x: at(0.63, 0)[0], y: at(0, 0.74)[1], w: S.w * 0.37, h: S.h * 0.2 };
  const tMos = w('Moscow');
  D.draw([[[win.x, win.y], [win.x + win.w, win.y], [win.x + win.w, win.y + win.h], [win.x, win.y + win.h], [win.x, win.y]]], { t0: tMos - 3 * F, dur: 0.2, int: 0.55, w: 0.8, name: 'Moscow channel frame' });
  D.text('MOSCOW', win.x + px(16), win.y + px(16), px(28), { dur: 0.3, name: 'Label MOSCOW' });
  const lineY = win.y + win.h * 0.62, sw0 = tMos + 0.55, per = 0.7;
  D.dyn(t => {
    if (t < sw0) return [];
    const out = [], n = Math.floor((t - sw0) / per), k = (t - sw0) / per - n;
    const trace = (m, kk) => { const pts = []; const steps = 60; for (let i = 0; i <= steps * kk; i++) pts.push([win.x + px(10) + (win.w - px(20)) * i / steps, lineY + (rand(m * 97 + i) - 0.5) * px(2.2)]); return pts; };
    out.push({ pts: trace(n, k), o: 1, hot: 0.2 });
    if (n > 0) out.push({ pts: trace(n - 1, 1), o: 0.35 * (1 - k) + 0.05 });
    return out;
  }, { max: 2, name: 'Moscow channel: flat line', from: sw0, to: 14 });
  D.text('NO WORD FOR DAYS', win.x + win.w - px(16), win.y + px(16), px(20), { t0: w('silent') - 2 * F, anchor: 'end', dur: 0.55, int: 0.8, name: 'Caption NO WORD' });
  const E2 = w('On') - 0.18;
  D.erase(E2);

  /* ================= 3 · THE VOTE  /  4 · THE NO (one picture, no erase) ================= */
  const tNo = w('no.'), decay = t => 1 - 0.84 * smootherstep((t - tNo - 0.25) / 0.8);
  const torpLen = P ? S.w * 0.92 : S.w * 0.74, torpS = torpLen / 100;
  const tC = P ? at(0.5, 0.095) : at(0.5, 0.12);
  const torpGone = t => 1 - smootherstep((t - tNo - 0.25) / 0.6);
  // the torpedo is first drawn big in the centre; on "To fire it" the deflection gain is turned down and the
  // picture glides up to make room for the three officers (vector displays scale cleanly — no pixels to blur)
  const big = P ? at(0.5, 0.36) : at(0.5, 0.42), k0 = P ? 1.0 : 1.22, tFire = w('fire');
  const gk = t => smootherstep((t - tFire + 0.1) / 0.75);
  const xfm = t => { const g = gk(t), k = k0 + (1 - k0) * g, cx = big[0] + (tC[0] - big[0]) * g, cy = big[1] + (tC[1] - big[1]) * g; return { k, cx, cy }; };
  const xf = t => { const { k, cx, cy } = xfm(t); return `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${k.toFixed(4)}) translate(${-tC[0]} ${-tC[1]})`; };
  const xp = (p, t) => { const { k, cx, cy } = xfm(t); return [cx + (p[0] - tC[0]) * k, cy + (p[1] - tC[1]) * k]; };
  const TX = { fade: torpGone, xf, xp };
  D.draw(place(TORP, tC[0], tC[1], torpS), { t0: E2 + 0.12, dur: 0.95, ...TX, name: 'T-5 nuclear torpedo' });
  const wx = tC[0] + 30 * torpS;
  D.draw([[[wx, tC[1] - 3.5 * torpS], [wx + px(26), tC[1] - 3.5 * torpS - px(40)]]], { t0: w('nuclear') - 2 * F, dur: 0.1, int: 0.7, ...TX, name: 'Leader warhead' });
  D.text('WARHEAD', wx + px(32), tC[1] - 3.5 * torpS - px(56), px(20), { dur: 0.3, ...TX, name: 'Label WARHEAD' });
  D.text('T-5 NUCLEAR TORPEDO', tC[0] - torpLen / 2 + 8 * torpS, tC[1] + 3.5 * torpS + px(26), px(P ? 26 : 28), { t0: w('torpedo.') - 2 * F, dur: 0.5, ...TX, name: 'Label T-5' });
  // end view of the same weapon: 533 mm tube section with the four fins, so the eye gets its real size
  const rr = px(P ? 30 : 34), rc = [tC[0] + 38 * torpS, tC[1] + 3.5 * torpS + rr + px(18)];
  D.draw([circlePts(rc[0], rc[1], rr, 32), circlePts(rc[0], rc[1], rr * 0.35, 16), [[rc[0] - rr * 1.5, rc[1]], [rc[0] - rr * 0.35, rc[1]]], [[rc[0] + rr * 0.35, rc[1]], [rc[0] + rr * 1.5, rc[1]]],
    [[rc[0], rc[1] - rr * 1.5], [rc[0], rc[1] - rr * 0.35]], [[rc[0], rc[1] + rr * 0.35], [rc[0], rc[1] + rr * 1.5]]], { dur: 0.32, int: 0.85, ...TX, name: 'End view (533 mm)' });
  D.text('533 MM', P ? rc[0] : rc[0] - rr * 1.5 - px(14), P ? rc[1] + rr * 1.5 + px(6) : rc[1] - px(10), px(P ? 16 : 20), { anchor: P ? 'middle' : 'end', dur: 0.22, int: 0.7, ...TX, name: 'Label 533 MM' });
  const ruleY = P ? at(0, 0.235)[1] : at(0, 0.335)[1];
  D.text('TO FIRE: ALL THREE MUST AGREE', at(0.5, 0)[0], ruleY, px(P ? 24 : 28), { t0: w('fire') - 2 * F, anchor: 'middle', dur: 0.75, fade: decay, int: 0.9, name: 'Rule' });
  const figX = P ? [0.16, 0.5, 0.84] : [0.2, 0.5, 0.8];
  const footY = P ? at(0, 0.6)[1] : at(0, 0.69)[1], fS = px(P ? 3.5 : 2.75);
  const figT = [w('three') - 2 * F, w('officers') + 0.08, w('must') + 0.08];
  const labY = footY + px(P ? 30 : 28), labCap = px(P ? 22 : 22);
  const roles = [['CAPTAIN'], ['POLITICAL', 'OFFICER'], []];
  FIG.forEach((fg, i) => {
    const x = at(figX[i], 0)[0];
    D.draw(place(fg.body, x, footY, fS), { t0: figT[i], dur: 0.3, fade: i < 2 ? decay : null, name: `Officer ${i + 1}` });
    if (i === 2) D.draw(place([ARM_REST], x, footY, fS), { dur: 0.05, until: w('says') - 0.12, ghost: false, name: 'Officer 3 arm (rest)' });
    roles[i].forEach((r, k) => D.text(r, x, labY + k * labCap * 1.6, labCap, { dur: 0.16, int: 0.75, fade: decay, anchor: 'middle', name: `Role ${i + 1}` }));
  });
  const voteY = labY + labCap * 3.5, voteCap = px(P ? 54 : 50);
  D.text('YES', at(figX[0], 0)[0], voteY, voteCap, { t0: w('Two') - 2 * F, anchor: 'middle', dur: 0.22, fade: decay, name: 'Vote 1 YES' });
  D.text('YES', at(figX[1], 0)[0], voteY, voteCap, { t0: w('yes.') - 2 * F, anchor: 'middle', dur: 0.22, fade: decay, name: 'Vote 2 YES' });
  // the beam parks on the empty third slot and burns there (the hesitation)
  const x3 = at(figX[2], 0)[0];
  D.dwell(x3, voteY + voteCap / 2, w('yes.') + 0.3, w('Vasili') - 0.05);
  const tThird = w('third,');
  const noCap = px(P ? 220 : 122);
  const bw = px(P ? 84 : 92), bTop = footY - fS * 108, bBot = P ? labY + labCap * 2.6 + px(30) : voteY + noCap + px(18), cl = px(26);
  D.draw([[[x3 - bw, bTop + cl], [x3 - bw, bTop], [x3 - bw + cl, bTop]], [[x3 + bw - cl, bTop], [x3 + bw, bTop], [x3 + bw, bTop + cl]],
    [[x3 + bw, bBot - cl], [x3 + bw, bBot], [x3 + bw - cl, bBot]], [[x3 - bw + cl, bBot], [x3 - bw, bBot], [x3 - bw, bBot - cl]]],
    { t0: tThird - 3 * F, dur: 0.3, int: 0.6, fade: t => 1 - 0.6 * smootherstep((t - tNo) / 0.6), name: 'Brackets on officer 3' });
  D.text('VASILI', x3, labY, labCap, { t0: w('Vasili') - 2 * F, anchor: 'middle', dur: 0.4, name: 'Name VASILI' });
  D.text('ARKHIPOV', x3, labY + labCap * 1.6, labCap, { t0: w('Arkhipov,') - 2 * F, anchor: 'middle', dur: 0.45, name: 'Name ARKHIPOV' });
  // the open hand: re-drawn while it moves (ghosts), then held
  const tArm = w('says') - 0.1, armDur = 0.32, fx3 = x3;
  D.dyn(t => {
    if (t < tArm) return [];
    const out = [];
    for (let g = 0; g < 4; g++) {
      const tt = t - g * 1.2 * F; if (g && tt < tArm) break;
      const k = smootherstep((tt - tArm) / armDur);
      const arm = ARM_REST.map((p, i) => [p[0] + (ARM_STOP[i][0] - p[0]) * k, p[1] + (ARM_STOP[i][1] - p[1]) * k]);
      const hand = arm[2];
      const shp = place([arm, ...(k > 0.6 ? palm(hand[0], hand[1], (k - 0.6) / 0.4) : [])], fx3, footY, fS);
      const o = g ? [1, 0.4, 0.18, 0.07][g] * (k < 1 ? 1 : 0) : 1;
      for (const pts of shp) out.push({ pts, o, hot: g ? 0 : 0.25 * (1 - k) });
    }
    return out;
  }, { max: 20, name: 'Officer 3: open hand', from: tArm });
  // THE NO — write-through: slower beam (= brighter), wider line, never decays
  const noX = P ? at(0.5, 0)[0] : x3, noY = P ? voteY + voteCap + px(56) : voteY + px(6);
  const noStart = textStrokes('NO', noX, noY, noCap, { anchor: 'middle' })[0][0];
  D.dwell(noStart[0], noStart[1], tArm, tNo - 0.08);
  D.text('NO', noX, noY, noCap, { t0: tNo - 0.08, anchor: 'middle', dur: 0.36, w: 2.1, int: 1, name: 'NO (write-through)' });
  // 40 years: the beam draws the gap as a line where the weapon was
  const tlY = P ? at(0, 0.095)[1] : at(0, 0.12)[1], yrCap = px(P ? 46 : 52);
  const tWorld = w('world');
  D.text('1962', S.x, tlY - yrCap / 2, yrCap, { t0: tWorld - 0.12, dur: 0.3, int: 0.8, name: 'Timeline 1962' });
  const l0 = S.x + textWidth('1962', yrCap) + px(24), l1 = S.x + S.w - textWidth('2002', yrCap) - px(24);
  D.draw([[[l0, tlY], [l1, tlY]]], { t0: tWorld + 0.22, dur: w('forty') - tWorld - 0.28, int: 0.9, name: 'Timeline: 40 years' });
  D.text('40 YEARS', (l0 + l1) / 2, tlY - px(46), px(26), { t0: w('forty') - 3 * F, anchor: 'middle', dur: 0.3, name: 'Label 40 YEARS' });
  D.text('2002', S.x + S.w, tlY - yrCap / 2, yrCap, { t0: w('later.') - 0.12, anchor: 'end', dur: 0.3, name: 'Timeline 2002' });
  D.text(P ? 'NAMED AT HAVANA CONFERENCE' : 'MADE PUBLIC AT THE HAVANA CONFERENCE, OCT 2002', (l0 + l1) / 2, tlY + px(30), px(17), { anchor: 'middle', speed: 4200, int: 0.55, name: 'Source note' });
  void FS;

  D.build();
  return { D, bursts, E1, E2, tNo, update: t => D.update(t) };
}
