// The one wall: every day-section, drawing, pigment and crack with its global time (from words.json).
// Shot plan + camera live here too, so all 4 scene modules render the identical wall (invisible cuts).
import { svg, rand, clamp } from '/onclack-styles/engine/lib/anim.js';
import { buildWall, PAL, FONT, SERIF, arrTex } from './wall.js';

const F = 1 / 30;
const ez = (p) => { p = clamp(p); return p * p * p * (p * (p * 6 - 15) + 10); };

/* ---------------------------------------------------------------- shapes (our own drawings) */
function subPath(cx, cy, L) {
  const h = L * 0.13, top = [], bot = [];
  for (let i = 0; i <= 40; i++) {
    const u = -0.5 + i / 40;
    let k = 1;
    if (u > 0.3) k = Math.sqrt(Math.max(0, 1 - ((u - 0.3) / 0.2) ** 2));
    if (u < -0.25) k = 1 - 0.75 * ((-0.25 - u) / 0.25) ** 1.6;
    top.push([cx + u * L, cy - h / 2 * k]); bot.push([cx + u * L, cy + h / 2 * k]);
  }
  const hull = 'M' + [...top, ...bot.reverse()].map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
  const sx = cx + L * 0.06, sy = cy - h / 2 + 2;
  const sail = `M${sx - L * 0.08} ${sy}L${sx - L * 0.065} ${sy - L * 0.1}L${sx + L * 0.07} ${sy - L * 0.1}L${sx + L * 0.09} ${sy}Z`;
  const rud = `M${cx - L * 0.47} ${cy - h * 0.15}L${cx - L * 0.5} ${cy - h * 0.75}L${cx - L * 0.44} ${cy - h * 0.2}Z`;
  return { hull, sail, rud, all: [hull, sail, rud] };
}
function shipPath(cx, wy, L, kind) {
  const h = L * 0.075;
  const hull = `M${cx - L / 2} ${wy - h}L${cx + L / 2 + L * 0.06} ${wy - h * 1.5}L${cx + L * 0.42} ${wy}L${cx - L * 0.44} ${wy}Z`;
  const sup = kind === 0
    ? `M${cx - L * 0.2} ${wy - h}L${cx - L * 0.18} ${wy - h * 2.2}L${cx + L * 0.12} ${wy - h * 2.2}L${cx + L * 0.16} ${wy - h * 1.2}Z M${cx - L * 0.05} ${wy - h * 2.2}L${cx - L * 0.03} ${wy - h * 3.8}L${cx + L * 0.05} ${wy - h * 3.8}L${cx + L * 0.06} ${wy - h * 2.2}Z`
    : `M${cx - L * 0.28} ${wy - h}L${cx - L * 0.26} ${wy - h * 2}L${cx + L * 0.05} ${wy - h * 2}L${cx + L * 0.1} ${wy - h * 1.2}Z M${cx - L * 0.14} ${wy - h * 2}L${cx - L * 0.12} ${wy - h * 3.2}L${cx - L * 0.02} ${wy - h * 3.2}L${cx} ${wy - h * 2}Z`;
  const mast = `M${cx + L * 0.005} ${wy - h * 2}L${cx + L * 0.012} ${wy - h * (kind === 0 ? 6 : 5.2)}L${cx + L * 0.022} ${wy - h * (kind === 0 ? 6 : 5.2)}L${cx + L * 0.03} ${wy - h * 2}Z`;
  return [hull, sup, mast];
}
function torpedoPath(cx, cy, L, r) {
  const x0 = cx - L / 2, xt = x0 + L * 0.1, xn = cx + L * 0.3;
  const body = `M${xt} ${cy - r}L${xn} ${cy - r}L${xn} ${cy + r}L${xt} ${cy + r}L${x0 + L * 0.03} ${cy + r * 0.45}L${x0 + L * 0.03} ${cy - r * 0.45}Z`;
  const nose = `M${xn} ${cy - r}C${xn + L * 0.12} ${cy - r} ${xn + L * 0.2} ${cy - r * 0.55} ${xn + L * 0.2} ${cy}C${xn + L * 0.2} ${cy + r * 0.55} ${xn + L * 0.12} ${cy + r} ${xn} ${cy + r}Z`;
  const fins = `M${x0 + L * 0.02} ${cy - r * 1.25}L${x0 + L * 0.075} ${cy - r * 1.25}L${xt + 6} ${cy - r * 0.5}L${x0 + L * 0.02} ${cy - r * 0.5}Z M${x0 + L * 0.02} ${cy + r * 1.25}L${x0 + L * 0.075} ${cy + r * 1.25}L${xt + 6} ${cy + r * 0.5}L${x0 + L * 0.02} ${cy + r * 0.5}Z M${x0} ${cy - r * 0.6}L${x0 + 12} ${cy - r * 0.6}L${x0 + 12} ${cy + r * 0.6}L${x0} ${cy + r * 0.6}Z`;
  return { body, nose, fins };
}
const pl = (a) => 'M' + a.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
/** Thick limb as a closed outline (so the underdrawing and the spolvero trace its edges, not a stick). */
function limb(ptsA, w0, w1) {
  const n = ptsA.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = ptsA[Math.max(0, i - 1)], b = ptsA[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / (n - 1)) / 2;
    L.push([ptsA[i][0] - dy / l * w, ptsA[i][1] + dx / l * w]); R.push([ptsA[i][0] + dy / l * w, ptsA[i][1] - dx / l * w]);
  }
  const e = L[n - 1], r = R[n - 1], wEnd = w1 / 2;
  return pl(L) + `A${wEnd} ${wEnd} 0 0 0 ${r[0].toFixed(1)} ${r[1].toFixed(1)}` + pl(R.reverse()).replace('M', 'L') + 'Z';
}
/** Officer: feet at (cx, fy), height h. No face (plain head tone). Poses: 'clasp' | 'folder' | 'stop'. */
function figure(cx, fy, h, pose) {
  const u = h / 700, X = (x) => cx + x * u, Y = (y) => fy + y * u;
  const P2 = (x, y) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`;
  const lean = pose === 'folder' ? 8 : pose === 'clasp' ? -4 : 0;
  // greatcoat: sloped shoulders, a little waist, A-line hem; the hem is uneven (weight on one leg)
  const hemL = pose === 'clasp' ? -196 : -190, hemR = pose === 'clasp' ? -184 : -192;
  const coat = `M${P2(-30 + lean, -566)}C${P2(-62 + lean, -562)} ${P2(-92 + lean, -552)} ${P2(-96 + lean, -520)}L${P2(-80, -400)}C${P2(-84, -330)} ${P2(-96, -260)} ${P2(-102, hemL)}Q${P2(0, hemL + 12)} ${P2(100, hemR)}C${P2(96, -260)} ${P2(84, -330)} ${P2(80, -400)}L${P2(96 + lean, -520)}C${P2(92 + lean, -552)} ${P2(62 + lean, -562)} ${P2(30 + lean, -566)}Z`;
  const legsXY = pose === 'clasp' ? [[-44, -14], [50, 16]] : pose === 'folder' ? [[-50, -30], [24, 8]] : [[-34, -30], [30, 34]];
  const legs = legsXY.map(([x1, x2]) => limb([[x1 * 0.7, -200], [x1, -100], [x2 === undefined ? x1 : x1, -16]], 50 * u, 42 * u)).join(' ');
  const legs2 = legsXY.map(([, x2]) => limb([[x2 * 0.6, -200], [x2, -100], [x2, -16]], 50 * u, 42 * u)).join(' ');
  const boots = [legsXY[0][0], legsXY[1][1]].map((x, k) => `M${P2(x - 26, -22)}L${P2(x + 30 + (k ? 6 : 0), -22)}Q${P2(x + 40, -10)} ${P2(x + 34, 0)}L${P2(x - 28, 0)}Z`).join(' ');
  const hx = lean * 0.7 + (pose === 'stop' ? 4 : 0);
  const head = `M${P2(hx - 40, -612)}a${40 * u} ${48 * u} 0 1 0 ${80 * u} 0a${40 * u} ${48 * u} 0 1 0 ${-80 * u} 0Z`;
  const neck = `M${P2(hx - 18, -580)}L${P2(hx + 18, -580)}L${P2(hx + 20, -556)}L${P2(hx - 20, -556)}Z`;
  // peaked naval cap seen from the front: wide flat crown, dark band, short visor
  const cap = `M${P2(hx - 64, -664)}Q${P2(hx, -700)} ${P2(hx + 64, -664)}Q${P2(hx + 50, -650)} ${P2(hx + 40, -646)}L${P2(hx - 40, -646)}Q${P2(hx - 50, -650)} ${P2(hx - 64, -664)}Z M${P2(hx - 42, -648)}L${P2(hx + 42, -648)}L${P2(hx + 40, -630)}L${P2(hx - 40, -630)}Z M${P2(hx - 38, -632)}Q${P2(hx, -616)} ${P2(hx + 38, -632)}L${P2(hx + 30, -622)}Q${P2(hx, -610)} ${P2(hx - 30, -622)}Z`;
  let arms, hands = '', extra = '';
  if (pose === 'clasp') { // hands clasped low in front
    arms = [[[-84, -530], [-100, -420], [-40, -352]], [[84, -530], [100, -420], [40, -352]]];
    hands = `M${P2(-34, -356)}a${34 * u} ${26 * u} 0 1 0 ${68 * u} 0a${34 * u} ${26 * u} 0 1 0 ${-68 * u} 0Z`;
  } else if (pose === 'folder') { // a folder held flat to the chest
    arms = [[[-82 + lean, -530], [-104, -420], [-106, -318]], [[88 + lean, -530], [104, -440], [28, -436]]];
    extra = `M${P2(-64, -500)}L${P2(50, -508)}L${P2(56, -370)}L${P2(-58, -362)}Z`;
    hands = `M${P2(-124, -318)}a${18 * u} ${24 * u} 0 1 0 ${36 * u} 0a${18 * u} ${24 * u} 0 1 0 ${-36 * u} 0Z M${P2(6, -436)}a${22 * u} ${18 * u} 0 1 0 ${44 * u} 0a${22 * u} ${18 * u} 0 1 0 ${-44 * u} 0Z`;
  } else { // 'stop': open hand forward at chest height (not raised), the other arm still
    arms = [[[-84, -530], [-102, -420], [-104, -318]], [[84, -530], [120, -430], [196, -448]]];
    hands = `M${P2(196, -468)}C${P2(206, -500)} ${P2(236, -502)} ${P2(240, -470)}L${P2(242, -420)}C${P2(234, -404)} ${P2(206, -404)} ${P2(198, -420)}Z M${P2(-122, -318)}a${18 * u} ${24 * u} 0 1 0 ${36 * u} 0a${18 * u} ${24 * u} 0 1 0 ${-36 * u} 0Z`;
  }
  const armD = arms.map(a => limb(a.map(([x, y]) => [X(x), Y(y)]), 50 * u, 40 * u));
  const legD = [limb([[X(legsXY[0][0] * 0.6), Y(-210)], [X(legsXY[0][0]), Y(-110)], [X(legsXY[0][0]), Y(-18)]], 52 * u, 44 * u),
    limb([[X(legsXY[1][1] * 0.6), Y(-210)], [X(legsXY[1][1]), Y(-110)], [X(legsXY[1][1]), Y(-18)]], 52 * u, 44 * u)].join(' ');
  return { coat, legs: legD, boots, head, neck, cap, armD, hands, extra, u, outline: [coat, legD, head, cap, ...armD, hands, extra].filter(Boolean) };
}

/* ---------------------------------------------------------------- the wall content */
export async function buildFresco(root, ctx, tag) {
  const w = await buildWall(root, ctx, tag);
  const { G, P, patch, paint, spolvero, letters, incise, wobble, pts, bboxOf } = w;
  const words = ctx.words ?? [];
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const Wt = (word, n = 0, fb = 0) => { const h = words.filter(x => norm(x.word) === norm(word)); return h[n] ? h[n].start : fb; };
  const T = {
    october: Wt('October', 0, 0.58), twenty: Wt('twenty-seventh', 0, 1.1), nineteen: Wt('nineteen', 0, 2.07), sixty: Wt('sixty-two', 0, 2.61),
    soviet: Wt('Soviet', 0, 3.79), hides: Wt('hides', 0, 4.93), deep: Wt('deep', 0, 5.42), cuba: Wt('Cuba', 0, 6.52), near: Wt('near', 0, 6.24),
    above: Wt('Above', 0, 7.56), ships: Wt('ships', 0, 8.63), drop: Wt('drop', 0, 8.95), depth: Wt('depth', 0, 9.79), charges: Wt('charges', 0, 10.05),
    moscow: Wt('Moscow', 0, 10.95), silent: Wt('silent', 0, 11.93), days: Wt('days', 0, 12.49),
    board: Wt('board', 0, 13.83), nuclear: Wt('nuclear', 0, 14.48), torpedo: Wt('torpedo', 0, 14.88), three: Wt('three', 0, 16.51), officers: Wt('officers', 0, 16.86),
    agree: Wt('agree', 0, 17.61), two: Wt('Two', 0, 18.29), say: Wt('say', 0, 18.55), yes: Wt('yes', 0, 18.8),
    third: Wt('third', 0, 20.25), vasili: Wt('Vasili', 0, 20.61), arkhipov: Wt('Arkhipov', 0, 21.12), no: Wt('no', 0, 22.03),
    world: Wt('world', 0, 23.07), name: Wt('name', 0, 23.73), forty: Wt('forty', 0, 24.13), later: Wt('later', 0, 24.73),
  };
  w.T = T;

  /* ===== SEA group: ships band, sea + submarine, Cuba, date band ===== */
  const sea = G.sea;
  // 9:16 gets its own composition: a much deeper sea column (the sub sits far below the ships), date band under it
  const ys = (y) => (P && y > 420 ? 420 + (y - 420) * (1580 / 880) : y);
  const DY = P ? 700 : 0;
  const dateBot = P ? 2390 : 1460;
  const pDate = patch(sea, wobble([[0, 1290 + DY], [1720, 1296 + DY], [1720, dateBot], [0, dateBot]], 21, 7), 0.12, { dur: 0.5, seed: 21, name: '1A Date band (day 1)' });
  const dSize = P ? 130 : 116;
  if (P) {
    incise(pDate.content, `M40 ${2168}H1680`, 0.5); incise(pDate.content, `M40 ${2328}H1680`, 0.52);
    letters(pDate, 'OCTOBER 27,', 70, 2162, dSize, T.october - 2 * F, T.twenty + 0.55, { name: '1A Date: October 27' });
    letters(pDate, '1962', 70, 2322, dSize, T.nineteen - 2 * F, T.sixty + 0.5, { name: '1A Date: 1962' });
  } else {
    incise(pDate.content, `M40 1420H1680`, 0.5); incise(pDate.content, `M40 1334H1680`, 0.52);
    const parts = [['OCTOBER', T.october - 2 * F, T.october + 0.5], [' 27,', T.twenty - 2 * F, T.twenty + 0.5], [' 1962', T.nineteen - 2 * F, T.sixty + 0.55]];
    let x = 70;
    for (const [s, a, b] of parts) {
      const bb = letters(pDate, s.trim(), x + (s.startsWith(' ') ? dSize * 0.32 : 0), 1418, dSize, a, b, { name: '1A Date: ' + s.trim() });
      x = bb.x + bb.width;
    }
  }

  const pSea = patch(sea, wobble([[0, 412], [1720, 418], [1720, ys(1300)], [0, ys(1296)]], 31, 10), 0.7, { dur: 0.7, seed: 32, name: '1B Sea (day 2)' });
  const subY = P ? 1720 : 940;
  const sub = subPath(860, subY, 760);
  spolvero(pSea.content, sub.all, 1.35, 2.8, { fadeAt: T.hides + 1.2, seed: 41 });
  const band = (y0, y1, c, a, b, s) => paint(pSea, { x: -40, y: y0 - 14, width: 1800, height: y1 - y0 + 28 }, a, b,
    (g) => svg('rect', { x: -60, y: y0, width: 1840, height: y1 - y0 + 3, fill: c }, g), { dir: 'h', sp: 46, seed: s, name: 'Sea wash' });
  band(412, ys(700), PAL.sea1, 2.1, T.soviet - 0.1, 51);
  band(ys(700), ys(1010), PAL.sea2, T.soviet - 0.2, T.hides + 0.1, 52);
  band(ys(1010), ys(1300), PAL.sea3, T.hides - 0.1, T.deep + 0.4, 53);
  paint(pSea, { x: 470, y: subY - 100, width: 800, height: 150 }, T.hides - 3 * F, T.deep + 0.35, (g) => {
    for (const d of sub.all) svg('path', { d, fill: PAL.black, 'data-name': '1B Submarine B-59' }, g);
  }, { dir: 'v', sp: 30, seed: 61, name: '1B Submarine', streak: 'rgba(200,200,190,0.10)' });
  // lime-white light along the top of the hull (key light upper left) — painted last, normal blend
  paint(pSea, { x: 500, y: subY - 60, width: 640, height: 30 }, T.deep + 0.3, T.deep + 0.7, (g) => {
    svg('path', { d: `M520 ${subY - 760 * 0.13 / 2 + 9}Q860 ${subY - 760 * 0.13 / 2 + 2} 1110 ${subY - 760 * 0.13 / 2 + 10}`, fill: 'none', stroke: '#DAD8CF', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.65 }, g);
  }, { dir: 'v', sp: 20, blend: 'normal', streak: null, name: '1B Hull highlight' });

  const pCuba = patch(sea, wobble([[1380, 226], [1720, 222], [1720, 440], [1376, 440]], 71, 8), T.near - 0.45, { dur: 0.4, seed: 72, name: '1C Cuba (day 3)' });
  paint(pCuba, { x: 1380, y: 380, width: 340, height: 60 }, T.near - 0.15, T.near + 0.25, (g) => svg('rect', { x: 1370, y: 384, width: 360, height: 60, fill: PAL.sea1 }, g), { dir: 'h', sp: 30, name: 'Surface water' });
  paint(pCuba, { x: 1420, y: 350, width: 300, height: 50 }, T.near + 0.05, T.cuba + 0.15, (g) =>
    svg('path', { d: 'M1424 392Q1450 372 1490 374Q1530 352 1580 362Q1640 356 1690 372L1730 388L1730 396L1424 396Z', fill: PAL.verde, 'data-name': '1C Cuba coast' }, g), { dir: 'v', sp: 24, name: '1C Cuba coast' });
  letters(pCuba, 'CUBA', 1450, 318, 64, T.cuba - 2 * F, T.cuba + 0.35, { name: '1C Label CUBA' });

  /* ===== ships band (scene 2) ===== */
  const pShips = patch(sea, wobble([[0, 0], [1720, 4], [1720, 232], [1384, 232], [1384, 418], [0, 420]], 81, 10), T.above - 0.2, { dur: 0.7, seed: 82, name: '2A Ships band (day 4)' });
  paint(pShips, { x: 0, y: 0, width: 1400, height: 370 }, T.above + 0.1, T.ships, (g) => svg('rect', { x: -10, y: -10, width: 1420, height: 384, fill: PAL.skyBlue, opacity: 0.55 }, g), { dir: 'h', sp: 60, streak: 'rgba(255,255,255,0.18)', name: 'Sky wash' });
  paint(pShips, { x: 0, y: 366, width: 1400, height: 60 }, T.above + 0.3, T.ships + 0.1, (g) => svg('rect', { x: -10, y: 368, width: 1420, height: 60, fill: PAL.sea1 }, g), { dir: 'h', sp: 26, name: 'Surface water' });
  const shipsDef = [[300, 370, 300, 0], [700, 372, 250, 1], [1080, 370, 270, 0]];
  const shipDs = shipsDef.map(([x, y, l, k]) => shipPath(x, y, l, k));
  spolvero(pShips.content, shipDs.flat(), T.above + 0.35, T.ships - 0.05, { seed: 91, step: 9, fadeAt: T.ships + 1.4 });
  shipDs.forEach((ds, i) => {
    const [x, y, l] = shipsDef[i];
    paint(pShips, { x: x - l / 2 - 10, y: y - l * 0.5, width: l * 1.15, height: l * 0.52 }, T.ships - 0.25 + i * 0.2, T.ships + 0.2 + i * 0.2, (g) => {
      for (const d of ds) svg('path', { d, fill: PAL.slate, 'data-name': `2A US ship ${i + 1}` }, g);
    }, { dir: 'v', sp: 18, seed: 100 + i, name: `2A US ship ${i + 1}` });
  });
  // depth charges: painted one below the other as the voice drops them; bursts near the hull
  const charges = [];
  shipsDef.forEach(([x], i) => { for (let k = 0; k < 3; k++) charges.push([x + (k - 1) * 22 + (i - 1) * 40 + 20 * Math.sin(i + k), ys(470 + k * 105 + i * 30), i * 3 + k]); });
  charges.sort((a, b) => a[1] - b[1]);
  const cT0 = T.drop - 2 * F, cT1 = T.charges + 0.3;
  charges.forEach(([x, y], j) => {
    const pt = y < 418 ? pShips : pSea;
    const a = cT0 + (cT1 - cT0) * j / charges.length;
    paint(pt, { x: x - 16, y: y - 22, width: 32, height: 44 }, a, a + 0.12, (g) => {
      svg('rect', { x: x - 13, y: y - 18, width: 26, height: 36, rx: 6, fill: PAL.black, 'data-name': '2B Depth charge' }, g);
      svg('rect', { x: x - 13, y: y - 4, width: 26, height: 5, fill: PAL.sea2 }, g);
    }, { dir: 'h', sp: 10, streak: null, wetFor: 1.2, name: '2B Depth charge' });
  });
  const bursts = [[560, subY - 140, T.depth - 2 * F], [1010, subY - 170, T.charges - 2 * F], [1260, subY - 80, T.charges + 0.32]];
  w.bursts = bursts.map(b => b[2]);
  bursts.forEach(([bx, by, a], i) => {
    paint(pSea, { x: bx - 100, y: by - 120, width: 200, height: 220 }, a, a + 0.22, (g) => {
      // pressure wave: two broken rings of lime white + a few bubbles (no star shape)
      for (const [r, wd, gap] of [[48, 10, 0.7], [86, 6, 1.3]]) {
        for (let k = 0; k < 5; k++) {
          const a0 = k / 5 * Math.PI * 2 + rand(i * 7 + r + k) * 0.6, a1 = a0 + (Math.PI * 2 / 5) - gap * 0.35;
          svg('path', { d: `M${bx + Math.cos(a0) * r} ${by + Math.sin(a0) * r * 0.8}A${r} ${r * 0.8} 0 0 1 ${bx + Math.cos(a1) * r} ${by + Math.sin(a1) * r * 0.8}`, stroke: '#E2E0D8', 'stroke-width': wd, fill: 'none', 'stroke-linecap': 'round', opacity: 0.9 }, g);
        }
      }
      for (let k = 0; k < 9; k++) svg('circle', { cx: bx + (rand(i * 31 + k) - 0.5) * 70, cy: by - 20 - rand(i * 17 + k) * 90, r: 3 + rand(k + i * 3) * 6, fill: 'none', stroke: '#E2E0D8', 'stroke-width': 3 }, g);
    }, { dir: 'v', sp: 24, blend: 'normal', streak: null, wetFor: 0.6, name: '2B Burst' });
  });
  letters(pShips, 'NO WORD FROM MOSCOW', 60, 138, P ? 84 : 70, T.moscow - 2 * F, T.days + 0.2, { name: '2C Moscow silent' });
  paint(pShips, { x: 60, y: 160, width: 400, height: 60 }, T.days - 0.1, T.days + 0.4, (g) => {
    svg('text', { x: 62, y: 208, 'font-family': SERIF, 'font-style': 'italic', 'font-size': P ? 60 : 54, fill: PAL.umber, 'data-name': '2C for days' }, g).textContent = 'for days';
  }, { dir: 'v', sp: 10, streak: null, name: '2C for days' });

  /* ===== TORPEDO band (scene 3) ===== */
  const tp = G.torp;
  const pTorp = patch(tp, wobble([[0, 0], [1700, 6], [1700, 330], [0, 326]], 111, 9), T.board - 0.45, { dur: 0.55, seed: 112, name: '3A Torpedo band (day 5)' });
  const tor = torpedoPath(800, 150, 1060, 64);
  spolvero(pTorp.content, [tor.body, tor.nose, tor.fins], T.board - 0.05, T.nuclear + 0.05, { seed: 121, fadeAt: T.torpedo + 1 });
  paint(pTorp, { x: 260, y: 60, width: 1100, height: 180 }, T.nuclear - 0.1, T.torpedo + 0.2, (g) => {
    svg('path', { d: tor.body, fill: '#A9ABA2', 'data-name': '3A Torpedo body' }, g); svg('path', { d: tor.fins, fill: PAL.slate }, g);
  }, { dir: 'v', sp: 34, seed: 131, name: '3A Torpedo body' });
  paint(pTorp, { x: 1110, y: 80, width: 240, height: 140 }, T.nuclear - 3 * F, T.nuclear + 0.3, (g) => svg('path', { d: tor.nose, fill: PAL.ochre, 'data-name': '3A Nuclear warhead' }, g), { dir: 'v', sp: 24, name: '3A Nuclear warhead' });
  paint(pTorp, { x: 260, y: 70, width: 1100, height: 160 }, T.torpedo + 0.1, T.torpedo + 0.6, (g) => {
    svg('path', { d: tor.body + tor.nose, fill: 'none', stroke: PAL.umber, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
  }, { dir: 'v', sp: 30, streak: null, name: '3A Torpedo line' });
  letters(pTorp, 'ONE NUCLEAR TORPEDO', 60, P ? 300 : 296, P ? 64 : 50, T.nuclear - 2 * F, T.torpedo + 0.45, { name: '3A Label torpedo' });

  /* ===== OFFICERS: one day-section per man (scene 3–4) ===== */
  const off = G.off;
  const pw = P ? 440 : 520, gap = P ? 460 : 540, fh = P ? 700 : 760, feet = 820;
  const poses = ['clasp', 'folder', 'stop'];
  const coats = [PAL.black, PAL.slate, '#3A3530'];
  const figs = poses.map((pose, i) => {
    const x0 = i * gap, cx = x0 + pw / 2;
    const poly = wobble([[x0, 1000], [x0, 210], [x0 + pw * 0.18, 120], [x0 + pw * 0.5, 96], [x0 + pw * 0.82, 120], [x0 + pw, 210], [x0 + pw, 1000]], 140 + i * 13, 8);
    return { i, x0, cx, pose, poly, f: figure(cx + (pose === 'stop' ? -40 : 0) * (pw / 520), feet, fh, pose) };
  });
  const tLay = [T.three - 0.55, T.three - 0.3, T.third - 2 * F];
  const tPaint = [[T.officers - 0.1, T.agree + 0.2], [T.officers + 0.15, T.agree + 0.45], [T.vasili - 0.05, T.arkhipov + 0.35]];
  for (const fg of figs) {
    const { i, f, cx, x0 } = fg;
    { // the plan for the wall: a charcoal underdrawing on the rough arriccio, before any plaster (his stays longest)
      const ud = svg('g', { 'data-name': `3B Officer ${i + 1} underdrawing (charcoal on arriccio)` }, off.under);
      const lines = [...f.outline.map(d => svg('path', { d, fill: 'none', stroke: PAL.char, 'stroke-width': 3.6, opacity: 0.7, pathLength: 1, 'stroke-dasharray': 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, ud)),
        ...f.outline.slice(0, 2).map((d, k) => svg('path', { d, fill: 'none', stroke: PAL.char, 'stroke-width': 1.8, opacity: 0.35, transform: `translate(${k ? -5 : 4} ${k ? 3 : -4})`, pathLength: 1, 'stroke-dasharray': 1 }, ud))];
      const a = T.board + 0.2 + i * 0.35, b = T.torpedo + 0.5 + i * 0.35, gone = (i === 2 ? T.third : tLay[i]) + 0.7;
      w.ups.push((t) => { const p = ez(w.prog(t, a, b)); lines.forEach(l => l.setAttribute('stroke-dashoffset', 1 - p)); ud.style.display = p <= 0 || t > gone ? 'none' : ''; });
    }
    const pt = patch(off, fg.poly, tLay[i], { dur: i === 2 ? 0.45 : 0.5, seed: 150 + i, name: `3B Officer ${i + 1} (day ${6 + i})` });
    fg.pt = pt;
    spolvero(pt.content, f.outline, tLay[i] + 0.35, tPaint[i][0] + 0.35, { seed: 160 + i, step: 11, fadeAt: tPaint[i][1] + 0.8 });
    const [a, b] = tPaint[i];
    const bb = { x: x0, y: feet - fh - 30, width: pw, height: fh + 40 };
    paint(pt, { x: x0, y: feet - 40, width: pw, height: 50 }, a - 0.1, a + 0.2, (g) => svg('rect', { x: x0 - 10, y: feet - 26, width: pw + 20, height: 40, fill: PAL.verde }, g), { dir: 'h', sp: 18, name: 'Ground strip' });
    paint(pt, bb, a, b, (g) => {
      svg('path', { d: f.legs, fill: coats[i] }, g);
      svg('path', { d: f.boots, fill: PAL.black }, g);
      svg('path', { d: f.coat, fill: coats[i], 'data-name': `3B Officer ${i + 1} coat` }, g);
      for (const d of f.armD) svg('path', { d, fill: coats[i] }, g);
      if (f.extra) svg('path', { d: f.extra, fill: '#CFCBC0', 'data-name': 'Folder' }, g);
      svg('path', { d: f.neck, fill: PAL.skin }, g);
      svg('path', { d: f.head, fill: PAL.skin, 'data-name': `3B Officer ${i + 1} head (no face)` }, g);
      svg('path', { d: f.cap, fill: PAL.black }, g);
      svg('path', { d: f.hands, fill: PAL.skin }, g);
    }, { dir: 'h', sp: 34, seed: 170 + i, name: `3B Officer ${i + 1}` });
    // fresco modelling: lime-white light on the left edges, painted last (normal blend)
    paint(pt, bb, b - 0.15, b + 0.25, (g) => {
      const u = f.u;
            svg('path', { d: `M${cx - 30 * u + (fg.pose === 'stop' ? -40 * pw / 520 : 0)} ${feet - 640 * u}q${-6 * u} ${30 * u} ${4 * u} ${58 * u}`, stroke: '#E0D8CC', 'stroke-width': 8 * u, opacity: 0.5, fill: 'none', 'stroke-linecap': 'round' }, g);
    }, { dir: 'v', sp: 30, blend: 'normal', streak: null, name: 'Lime light' });
    const ly = 920;
    if (i < 2) {
      const at = i === 0 ? T.two - 2 * F : T.say - 2 * F;
      paint(pt, { x: cx - 110, y: ly - 46, width: 70, height: 70 }, at, at + 0.18, (g) => svg('circle', { cx: cx - 76, cy: ly - 18, r: 30, fill: PAL.verde, 'data-name': `3C YES mark ${i + 1}` }, g), { dir: 'v', sp: 14, streak: null });
      letters(pt, 'YES', cx - 30, ly, P ? 66 : 58, at + 0.06, at + 0.36, { name: `3C YES ${i + 1}` });
    } else {
      letters(pt, 'ARKHIPOV', cx, ly, P ? 60 : 62, T.arkhipov - 2 * F, T.arkhipov + 0.45, { anchor: 'middle', name: '4A Name ARKHIPOV' });
    }
  }

  /* ===== NOB: rule band + the NO section ===== */
  const nb = G.nob;
  const bw = P ? 1360 : 1060;
  const pBand = patch(nb, wobble([[0, 0], [bw, 4], [bw, 240], [0, 236]], 181, 8), T.three - 0.15, { dur: 0.45, seed: 182, name: '3D Rule band (day 8)' });
  letters(pBand, 'THREE MUST AGREE', 36, 112, P ? 96 : 82, T.three - 2 * F, T.agree + 0.3, { name: '3D Rule: three must agree' });
  // later scratched into the dry plaster (so it reads as added afterwards, not painted that day)
  const known = svg('text', { x: 40, y: 208, 'font-family': SERIF, 'font-style': 'italic', 'font-size': P ? 62 : 50, fill: 'rgba(60,52,46,0.85)', 'data-name': '4C Known c. 2002' }, pBand.content);
  known.textContent = 'his no became known c. 2002';
  const kf = svg('filter', { id: w.id('inc') }, w.defs); // incised: a light lower lip under the dark groove
  svg('feOffset', { in: 'SourceAlpha', dx: 1.2, dy: 1.8, result: 'o' }, kf); svg('feFlood', { 'flood-color': '#FFFDF8', 'flood-opacity': 0.75 }, kf);
  svg('feComposite', { in2: 'o', operator: 'in', result: 'l' }, kf); const km = svg('feMerge', {}, kf); svg('feMergeNode', { in: 'l' }, km); svg('feMergeNode', { in: 'SourceGraphic' }, km);
  known.setAttribute('filter', `url(#${kf.id})`);
  const kb = known.getBBox();
  const kc = svg('clipPath', { id: w.id('kc') }, w.defs); const kr = svg('rect', { x: kb.x - 4, y: kb.y - 6, width: 0, height: kb.height + 14 }, kc);
  const kg = svg('g', { 'clip-path': `url(#${kc.id})` }, pBand.content); kg.appendChild(known);
  w.ups.push((t) => kr.setAttribute('width', ((kb.width + 10) * ez(w.prog(t, T.forty - 0.35, T.later + 0.4))).toFixed(1)));

  const nx0 = P ? 260 : 1080, nw = P ? 840 : 620, ny0 = P ? 280 : -16;
  const pNo = patch(nb, wobble([[nx0, ny0], [nx0 + nw, ny0 + 6], [nx0 + nw, ny0 + 396], [nx0, ny0 + 400]], 191, 9), T.arkhipov + 0.1, { dur: 0.5, seed: 193, name: '4B NO section (day 9)', tone: '#E6E3DB' });
  const noSize = P ? 400 : 360;
  letters(pNo, 'NO', nx0 + nw / 2, P ? ny0 + 340 : 312, noSize, T.no - 3 * F, T.no + 0.28, { color: PAL.cinnabar, anchor: 'middle', name: '4B NO (cinnabar, the only red)', track: -0.02 });

  /* ===== forty years: cracks and losses (never through the NO) ===== */
  const crack = (g, x, y, ang, n, seed, a, b) => {
    const p = [[x, y]]; let A = ang;
    for (let i = 0; i < n; i++) { A += (rand(seed + i) - 0.5) * 0.9; const s = 14 + rand(seed * 2 + i) * 16; x += Math.cos(A) * s; y += Math.sin(A) * s; p.push([x, y]); }
    const dk = svg('path', { fill: 'none', stroke: 'rgba(40,36,32,0.75)', 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'data-name': 'Crack' }, g);
    const lt = svg('path', { fill: 'none', stroke: 'rgba(255,253,248,0.55)', 'stroke-width': 1.4, transform: 'translate(1.2 1.6)' }, g);
    let last = -1;
    w.ups.push((t) => { const k = Math.round(p.length * ez(w.prog(t, a, b))); if (k === last) return; last = k; const d = k > 1 ? pl(p.slice(0, k)) : 'M0 0'; dk.setAttribute('d', d); lt.setAttribute('d', d); });
  };
  const A0 = T.world - 0.05, A1 = T.later + 0.3;
  crack(sea.age, 120, 20, 1.2, 46, 301, A0, A1); crack(sea.age, 1700, ys(600), 2.6, P ? 70 : 52, 302, A0 + 0.3, A1); crack(sea.age, 900, ys(1295), -1.4, P ? 50 : 30, 303, A0 + 0.6, A1);
  crack(sea.age, 1300, 420, 1.7, 26, 304, A0 + 0.2, A1);
  crack(tp.age, 1690, 20, 2.3, 30, 311, A0 + 0.4, A1);
  crack(off.age, gap + 10, 990, -1.75, 34, 321, A0 + 0.5, A1); crack(off.age, 20, 400, 0.4, 18, 322, A0 + 0.7, A1);
  // losses: organic flake outlines (lime breaks along a curved edge), never on the NO or the key words
  const blob = (cx, cy, r, seed) => { const o = []; for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2; const rr = r * (0.62 + 0.38 * rand(seed + k) + 0.25 * Math.sin(a * 3 + seed)); o.push([cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr * 0.85]); } return o; };
  const losses = [
    [sea, blob(1600, 90, 58, 401), T.world + 0.2],
    [sea, blob(150, ys(1170), 50, 402), T.forty],
    [tp, blob(1580, 250, 40, 403), T.name],
    [off, blob(gap + pw - 70, 950, 44, 404), T.later - 0.1],
  ];
  w.flakes = losses.map(l => l[2]);
  losses.forEach(([g, poly, at], i) => {
    const bb = bboxOf(poly);
    const hole = svg('g', { 'data-name': 'Loss (arriccio shows)' }, g.age);
    const tex = svg('pattern', { id: w.id('arr'), patternUnits: 'userSpaceOnUse', width: 512, height: 512 }, w.defs);
    svg('image', { href: arrTex(), width: 512, height: 512 }, tex);
    svg('polygon', { points: pts(poly), fill: `url(#${tex.id})` }, hole);
    svg('polygon', { points: pts(poly), fill: 'none', stroke: 'rgba(250,248,240,0.7)', 'stroke-width': 3, transform: 'translate(1.5 2)' }, hole);
    svg('polygon', { points: pts(poly), fill: 'none', stroke: 'rgba(40,34,30,0.6)', 'stroke-width': 2.2 }, hole);
    const flake = svg('polygon', { points: pts(poly), fill: '#DCD8CE', stroke: 'rgba(60,54,48,0.5)', 'stroke-width': 2, 'data-name': 'Falling flake' }, g.age);
    const cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
    w.ups.push((t) => {
      const on = t >= at;
      hole.style.display = on ? '' : 'none';
      const d = t - at;
      flake.style.display = on && d < 1.6 ? '' : 'none';
      if (on && d < 1.6) flake.setAttribute('transform', `translate(${(d * 30 * (i % 2 ? 1 : -1)).toFixed(1)} ${(0.5 * 2600 * d * d).toFixed(1)}) rotate(${(d * 70 * (i % 2 ? -1 : 1)).toFixed(1)} ${cx} ${cy})`);
    });
  });

  /* ===== camera (global time) ===== */
  const keys = P ? [
    [0, 553, 800, 0.81], [3.3, 553, 800, 0.82], [4.4, 553, 900, 0.875], [5.95, 553, 900, 0.88], [6.6, 553, 760, 0.81],
    [7.3, 553, 760, 0.81], [8.4, 553, 740, 0.81], [12.95, 553, 740, 0.82], [14.3, 553, 1720, 0.84], [15.3, 553, 1720, 0.86],
    [16.4, 540, 2250, 0.84], [19.6, 540, 2250, 0.85], [20.6, 530, 2470, 0.85], [22.9, 530, 2475, 0.87], [25.1, 545, 1600, 0.44], [30, 545, 1600, 0.445],
  ] : [
    [0, 1000, 1160, 1.0], [3.3, 990, 1160, 1.03], [4.4, 960, 1150, 0.95], [5.95, 960, 1150, 0.96], [6.6, 980, 1010, 0.86],
    [7.3, 980, 1010, 0.86], [8.4, 960, 840, 0.7], [12.95, 960, 845, 0.715], [14.3, 2850, 640, 0.86], [15.4, 2850, 660, 0.87],
    [16.4, 2850, 1240, 0.72], [19.6, 2850, 1250, 0.74], [20.6, 3000, 1385, 0.75], [22.9, 3010, 1390, 0.77], [25.1, 1900, 1120, 0.47], [30, 1900, 1120, 0.475],
  ];
  const safe = w.L.safe;
  const scx = safe.cx, scy = safe.cy;
  w.camera = (t) => {
    let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
    const [t0, x0, y0, s0] = keys[i], [t1, x1, y1, s1] = keys[i + 1];
    const p = ez((t - t0) / (t1 - t0));
    let x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p;
    const s = s0 * Math.pow(s1 / s0, p);
    // a short camera tremor when a charge bursts (the hull is hit by the shock)
    let sx = 0, sy = 0;
    for (const b of w.bursts) { const d = t - b; if (d > 0 && d < 0.6) { const a = 7 * Math.exp(-d * 7); sx += Math.sin(d * 63) * a; sy += Math.cos(d * 51) * a; } }
    return { x, y, s, sx, sy };
  };
  w.update = (t) => {
    for (const u of w.ups) u(t);
    const c = w.camera(t);
    w.world.style.transform = `translate(${(scx - c.x * c.s + c.sx).toFixed(2)}px, ${(scy - c.y * c.s + c.sy).toFixed(2)}px) scale(${c.s.toFixed(5)})`;
  };
  return w;
}
