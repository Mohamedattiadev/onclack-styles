// OCHRE ROCK — the whole film is ONE limestone wall in plain daylight. Every image is put on the rock in voice time:
// finger strokes, fingertip dots, and pigment blown from the mouth around a held object (it stays bare rock = negative).
// The painter uses the rock: the submarine is blown over a natural swelling, the torpedo follows a ridge, the three
// men stand on a real ledge. The daylight moves during the film (soft from upper left → low raking light from the right),
// so the relief grows stronger toward the vote. 4 scene modules build the same wall on one global clock (no visible cuts).
import { svg, el, rand, clamp } from '/onclack-styles/engine/lib/anim.js';
import { createPainter, PIG } from './paint.js';

const plan = await (await fetch(new URL('./plan.json', import.meta.url))).json();
const ez = (p) => { p = clamp(p); return p * p * p * (p * (p * 6 - 15) + 10); };

// ---------------------------------------------------------------- shapes (local coords)
/** Submarine silhouette (bow right): hull, sail, small rudder. Returns closed polygon points. */
function subPoly(L) {
  const h = L * 0.15, top = [], bot = [];
  for (let i = 0; i <= 48; i++) {
    const u = -0.5 + i / 48;
    let t = 1;
    if (u > 0.33) t = Math.sqrt(Math.max(0, 1 - ((u - 0.33) / 0.17) ** 2));
    if (u < -0.22) t = 1 - 0.8 * ((-0.22 - u) / 0.28) ** 1.5;
    let y = -h / 2 * t;
    if (u > 0.05 && u < 0.19) y = -h / 2 - L * 0.1 * (u < 0.07 ? (u - 0.05) / 0.02 * 0.85 + 0.15 : 1); // sail, sloped front
    if (u > -0.47 && u < -0.41) y = Math.min(y, -h * 0.75);                                            // rudder fin
    top.push([u * L, y]); bot.push([u * L, h / 2 * t]);
  }
  return [...top, ...bot.reverse()];
}
const drum = (w, h) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
function torpedoOutline(L) {
  const r = L * 0.055, pts = [];
  // body top: tail → nose (ogive), nose → bottom back to tail
  for (let i = 0; i <= 24; i++) { const u = i / 24; const x = -L / 2 + L * 0.06 + u * L * 0.74; pts.push([x, -r]); }
  for (let i = 1; i <= 12; i++) { const a = -Math.PI / 2 + Math.PI * i / 12; pts.push([L * 0.3 + Math.cos(a) * L * 0.2, Math.sin(a) * r]); }
  for (let i = 24; i >= 0; i--) { const u = i / 24; const x = -L / 2 + L * 0.06 + u * L * 0.74; pts.push([x, r]); }
  pts.push([-L / 2 + L * 0.06, -r]);
  return pts;
}
const SHIPS = {
  long: [
    [[-160, 0], [150, 0], [182, -30], [-175, -26], [-160, 0]],
    [[-50, -27], [-48, -62], [36, -62], [52, -28]],
    [[-6, -62], [-4, -122]], [[-30, -100], [22, -104]],
    [[-100, -27], [-96, -52], [-74, -52], [-72, -27]],
  ],
  short: [
    [[-120, 0], [115, 0], [140, -28], [-132, -24], [-120, 0]],
    [[-30, -26], [-26, -58], [40, -58], [48, -27]],
    [[-70, -25], [-68, -96]], [[16, -58], [18, -112]],
  ],
};
// Officers: no faces (head = plain dab), varied weight and gesture, no raised arms. Units: height 1, feet at y 0.
const FIG = {
  folded: { head: [0.03, -0.9, 0.075], w: 0.05, torso: [[0.02, -0.8], [-0.01, -0.62], [-0.03, -0.5]],
    limbs: [[[-0.09, -0.77], [0.1, -0.78]], [[-0.09, -0.77], [-0.11, -0.66], [0.11, -0.64]], [[0.1, -0.78], [0.13, -0.67], [-0.07, -0.66]],
      [[-0.03, -0.5], [-0.07, -0.25], [-0.1, -0.01], [-0.02, 0]], [[-0.03, -0.5], [0.05, -0.26], [0.09, -0.01], [0.17, 0]]] },
  seated: { head: [0.17, -0.8, 0.075], w: 0.05, torso: [[0.11, -0.71], [0.03, -0.52], [-0.05, -0.38]],
    limbs: [[[0.1, -0.69], [0.19, -0.47], [0.29, -0.43]], [[0.07, -0.66], [0.13, -0.45], [0.24, -0.4]],
      [[-0.05, -0.38], [0.18, -0.37], [0.17, -0.01], [0.25, 0]], [[-0.05, -0.38], [0.13, -0.33], [0.1, -0.01], [0.18, 0]],
      [[-0.2, -0.32], [0.04, -0.33]], [[-0.18, -0.32], [-0.17, 0]], [[0.02, -0.33], [0.03, 0]]] },
  stop: { head: [-0.01, -0.91, 0.075], w: 0.05, torso: [[0, -0.81], [0.01, -0.63], [0, -0.5]],
    limbs: [[[-0.04, -0.77], [-0.15, -0.67], [-0.27, -0.66]], [[-0.27, -0.75], [-0.28, -0.6]], [[-0.27, -0.66], [-0.31, -0.69]],
      [[0.05, -0.77], [0.08, -0.6], [0.07, -0.44]],
      [[0, -0.5], [-0.06, -0.25], [-0.11, -0.01], [-0.19, 0]], [[0, -0.5], [0.06, -0.26], [0.09, -0.01], [0.01, 0]]] },
};

// ---------------------------------------------------------------- layouts (world px)
const LAYOUT = {
  land: {
    date: [{ text: 'OCT 27', x: 230, y: 330, cap: 150, color: 'char' }, { text: '1962', x: 236, y: 545, cap: 165, color: 'red' }],
    waves: { x0: 150, x1: 1720, ys: [745, 789, 831], amp: 14, len: 150 },
    ships: [{ kind: 'long', x: 560, y: 735, s: 1.1 }, { kind: 'short', x: 1110, y: 737, s: 1.0 }],
    sub: { cx: 900, cy: 1165, L: 640, rot: -2, rx: 420, ry: 175 },
    charges: [{ from: [590, 757], to: [620, 975] }, { from: [720, 757], to: [750, 1020] }, { from: [1080, 757], to: [1060, 985] }],
    cuba: { cx: 1580, cy: 1010, w: 250, h: 120, label: [1580, 1150, 70] },
    moscow: { x: 1180, y: 300, cap: 104, tally: [1210, 375, 140] },
    torp: { cx: 2460, cy: 600, L: 900, rot: 2.5 },
    nuclear: { x: 2460, y: 400, cap: 100 },
    figs: [{ pose: 'folded', x: 1990, y: 1428, h: 470 }, { pose: 'seated', x: 2330, y: 1426, h: 470 }, { pose: 'stop', x: 2730, y: 1422, h: 490 }],
    yes: { dy: 92, cap: 46, r: 21 },
    no: { x: 2850, y: 1180, cap: 260 },
    name: { x: 2852, y: 1300, cap: 54 }, year: { x: 2852, y: 1400, cap: 64 },
    cancel: [[2750, 470], [2990, 710]],
    cams: {
      date: { cx: 640, cy: 380, s: 1.35 }, sea: { cx: 930, cy: 950, s: 1.02 }, charges: { cx: 860, cy: 900, s: 1.12 },
      moscow: { cx: 1380, cy: 430, s: 1.35 }, torp: { cx: 2540, cy: 560, s: 1.25 }, vote: { cx: 2540, cy: 1110, s: 1.04 },
      third: { cx: 2800, cy: 1130, s: 1.2 }, all: { cx: 1700, cy: 960, s: 0.56 },
    },
  },
  port: {
    date: [{ text: 'OCT 27', x: 200, y: 430, cap: 165, color: 'char' }, { text: '1962', x: 206, y: 680, cap: 190, color: 'red' }],
    waves: { x0: 90, x1: 1420, ys: [880, 924, 966], amp: 14, len: 140 },
    ships: [{ kind: 'long', x: 450, y: 870, s: 1.0 }, { kind: 'short', x: 980, y: 872, s: 0.86 }],
    sub: { cx: 760, cy: 1440, L: 700, rot: -2, rx: 450, ry: 185 },
    charges: [{ from: [470, 892], to: [500, 1160] }, { from: [600, 892], to: [640, 1215] }, { from: [950, 892], to: [925, 1175] }],
    cuba: { cx: 1210, cy: 1110, w: 190, h: 95, label: [1210, 1240, 60] },
    moscow: { x: 260, y: 1880, cap: 128, tally: [300, 1960, 150] },
    torp: { cx: 780, cy: 2520, L: 880, rot: 2.5 },
    nuclear: { x: 780, y: 2340, cap: 108 },
    figs: [{ pose: 'folded', x: 330, y: 3166, h: 430 }, { pose: 'seated', x: 680, y: 3168, h: 430 }, { pose: 'stop', x: 1090, y: 3163, h: 450 }],
    yes: { dy: 92, cap: 46, r: 21 },
    no: { x: 640, y: 3700, cap: 300 },
    name: { x: 760, y: 3850, cap: 66, anchor: 'middle' }, year: { x: 760, y: 3960, cap: 70, anchor: 'middle' },
    cancel: [[1030, 2390], [1250, 2640]],
    cams: {
      date: { cx: 560, cy: 600, s: 1.15 }, sea: { cx: 760, cy: 1200, s: 0.84 }, charges: { cx: 740, cy: 1170, s: 0.95 },
      moscow: { cx: 640, cy: 1930, s: 1.0 }, torp: { cx: 780, cy: 2440, s: 1.0 }, vote: { cx: 700, cy: 3060, s: 0.78 },
      third: { cx: 740, cy: 3230, s: 0.85 }, all: { cx: 760, cy: 2380, s: 0.585 },
    },
  },
};

export function buildWall(root, ctx, sceneIndex) {
  const Lay = ctx.layout, land = Lay.landscape, key = land ? 'land' : 'port';
  const P = LAYOUT[key], R = plan[key];
  const wt = (w, fb) => ctx.words.find((x) => x.word.toLowerCase().replace(/[^a-z-]/g, '') === w)?.start ?? fb;
  const F = 1 / 30;
  const t = {
    oct: wt('october', 0.58), tw: wt('twenty-seventh', 1.1), nine: wt('nineteen', 2.07), soviet: wt('soviet', 3.79), sub: wt('submarine', 4.3),
    deep: wt('deep', 5.42), sea: wt('sea', 5.98), cuba: wt('cuba', 6.52), above: wt('above', 7.56), ships: wt('ships', 8.63), drop: wt('drop', 8.95),
    depth: wt('depth', 9.79), charges: wt('charges', 10.05), moscow: wt('moscow', 10.95), silent: wt('silent', 11.93), days: wt('days', 12.49),
    board: wt('board:', 13.83), nuclear: wt('nuclear', 14.48), torpedo: wt('torpedo', 14.88), three: wt('three', 16.51), officers: wt('officers', 16.86),
    agree: wt('agree', 17.61), two: wt('two', 18.29), yes: wt('yes', 18.8), third: wt('third', 20.25), vasili: wt('vasili', 20.61),
    arkhipov: wt('arkhipov', 21.12), says: wt('says', 21.69), no: wt('no', 22.03), world: wt('world', 23.07), name: wt('name', 23.73), forty: wt('forty', 24.13),
  };

  // ---------------------------------------------------------------- DOM
  const [ox, oy] = R.origin, [TW, TH] = R.size;
  const frame = el('div', { 'data-name': 'Camera', style: { position: 'absolute', inset: 0, overflow: 'hidden', background: '#8e8270' } }, root);
  const world = el('div', { 'data-name': 'Rock wall', style: { position: 'absolute', left: 0, top: 0, width: '1px', height: '1px', transformOrigin: '0 0', isolation: 'isolate' } }, frame);
  const imgStyle = { position: 'absolute', left: ox + 'px', top: oy + 'px', width: TW + 'px', height: TH + 'px' };
  el('img', { src: ctx.asset(`assets/rock-${key}-soft.jpg`), 'data-name': 'Rock (soft daylight)', style: imgStyle }, world);
  const rake = el('img', { src: ctx.asset(`assets/rock-${key}-rake.jpg`), 'data-name': 'Rock (raking daylight)', style: { ...imgStyle, opacity: 0 } }, world);
  const grain = `url(${ctx.asset(`assets/grain-${key}.png`)})`;
  const layer = (name, blend, op = 1) => {
    const s = svg('svg', { 'data-name': name, width: TW, height: TH, viewBox: `${ox} ${oy} ${TW} ${TH}`, overflow: 'visible' }, world);
    Object.assign(s.style, { position: 'absolute', left: ox + 'px', top: oy + 'px', mixBlendMode: blend, opacity: op, maskImage: grain, webkitMaskImage: grain, maskSize: '100% 100%', webkitMaskSize: '100% 100%' });
    return s;
  };
  const earth = layer('Pigment (ochre + charcoal)', 'multiply');
  const clay = layer('Pigment (white clay)', 'normal', 0.82);
  const defs = svg('defs', {}, earth);
  const pe = createPainter(earth, defs), pw = createPainter(clay, svg('defs', {}, clay));
  const col = (c) => PIG[c];

  // ---------------------------------------------------------------- 1 · date, sea, the submarine (negative), Cuba
  const [d1, d2] = P.date;
  pe.write(earth, d1.text, { ...d1, color: col(d1.color), t0: t.oct - 2 * F, t1: t.tw + 0.62, seed: 3, name: 'Date "OCT 27"' });
  pe.write(earth, d2.text, { ...d2, color: col(d2.color), t0: t.nine - 2 * F, t1: t.nine + 0.85, seed: 7, name: 'Date "1962"' });

  const S = P.sub, rot = S.rot * Math.PI / 180;
  const tf = (pts, cx, cy, a = 0, s = 1) => pts.map(([x, y]) => [cx + (x * Math.cos(a) - y * Math.sin(a)) * s, cy + (x * Math.sin(a) + y * Math.cos(a)) * s]);
  const subPts = tf(subPoly(S.L), S.cx, S.cy, rot);
  const dPoly = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
  pe.blow(earth, { shape: subPts, cx: S.cx, cy: S.cy, rx: S.rx, ry: S.ry, color: PIG.red, t0: t.soviet - 0.1, t1: t.sub + 0.75, seed: 11, n: 34, reach: 0.75, name: 'Submarine (blown red ochre, negative)' });

  const Wv = P.waves;
  Wv.ys.forEach((y, i) => {
    const pts = []; for (let x = Wv.x0 + i * 40; x <= Wv.x1 - i * 30; x += 18) pts.push([x, y + Math.sin((x + i * 60) / Wv.len * Math.PI * 2) * Wv.amp * (1 - i * 0.2)]);
    pw.stroke(clay, pts, { w: 17 - i * 2, color: PIG.white, t0: t.deep - 0.15 + i * 0.22, t1: t.sea + 0.25 + i * 0.22, seed: 40 + i, name: `Sea surface line ${i + 1}` });
  });
  const C = P.cuba;
  for (let i = 0; i < 4; i++) {
    const yy = C.cy - C.h / 2 + (i + 0.5) * C.h / 4;
    const half = C.w / 2 * (1 - Math.abs(i - 1.3) * 0.22);
    pe.stroke(earth, [[C.cx - half, yy + 6], [C.cx - half * 0.2, yy - 8], [C.cx + half * 0.5, yy + 4], [C.cx + half, yy - 6]], { w: 34, color: PIG.yellow, t0: t.cuba - 0.3 + i * 0.1, t1: t.cuba + 0.05 + i * 0.1, seed: 60 + i, name: 'Cuba (yellow ochre smear)' });
  }
  pe.write(earth, 'CUBA', { x: C.label[0], y: C.label[1], cap: C.label[2], anchor: 'middle', color: PIG.char, t0: t.cuba + 0.05, t1: t.cuba + 0.75, seed: 21, name: 'Label "CUBA"' });

  // ---------------------------------------------------------------- 2 · ships, depth charges (blown soot around a held drum), Moscow silent
  P.ships.forEach((sh, k) => {
    SHIPS[sh.kind].forEach((ln, i) => pe.stroke(earth, ln.map(([x, y]) => [sh.x + x * sh.s, sh.y + y * sh.s]),
      { w: 15, color: PIG.char, t0: t.above + 0.2 + k * 0.45 + i * 0.13, t1: t.above + 0.55 + k * 0.45 + i * 0.13, seed: 80 + k * 10 + i, name: `American ship ${k + 1}` }));
  });
  const chargeT = [t.drop + 0.25, t.depth + 0.02, t.charges + 0.42];
  P.charges.forEach((c, i) => {
    const n = 6, tA = chargeT[i] - 0.5;
    for (let k = 0; k < n; k++) {
      const q = k / (n - 1);
      pe.dot(earth, c.from[0] + (c.to[0] - c.from[0]) * q, c.from[1] + (c.to[1] - c.from[1]) * q * 0.92, { r: 7 + q * 2, color: PIG.char, t: tA + q * 0.42, seed: 100 + i * 10 + k, name: `Depth charge ${i + 1} falling (finger dots)` });
    }
    const a = (rand(i + 5) - 0.5) * 0.6;
    pe.blow(earth, { shape: tf(drum(30, 40), c.to[0], c.to[1] + 30, a), cx: c.to[0], cy: c.to[1] + 30, rx: 74, ry: 64, color: PIG.char, t0: chargeT[i] - 0.04, t1: chargeT[i] + 0.2, seed: 120 + i * 7, n: 10, reach: 1.1, name: `Depth charge ${i + 1} (blown charcoal, negative drum)` });
  });
  const M = P.moscow;
  pe.write(earth, 'MOSCOW', { x: M.x, y: M.y, cap: M.cap, color: PIG.char, t0: t.moscow - 2 * F, t1: t.moscow + 0.55, seed: 33, name: 'Word "MOSCOW"' });
  const [tx, ty, th] = M.tally;
  for (let k = 0; k < 5; k++) {
    const isCross = k === 4;
    const pts = isCross ? [[tx - 18, ty + th * 0.7], [tx + 4 * 46 + 10, ty + th * 0.25]] : [[tx + k * 46, ty], [tx + k * 46 + 6, ty + th]];
    pe.stroke(earth, pts, { w: 22, color: PIG.red, t0: t.silent - 0.05 + k * 0.17, t1: t.silent + 0.13 + k * 0.17, seed: 140 + k, name: 'Tally of silent days' });
  }

  // ---------------------------------------------------------------- 3 · torpedo on the ridge, three officers on the ledge, two yes
  const T0 = P.torp, ta = T0.rot * Math.PI / 180;
  const tOut = tf(torpedoOutline(T0.L), T0.cx, T0.cy, ta);
  const clipId = `torpclip${sceneIndex}${key}`;
  const clip = svg('clipPath', { id: clipId }, defs); svg('path', { d: dPoly(tOut) }, clip);
  const fillG = svg('g', { 'clip-path': `url(#${clipId})`, 'data-name': 'Torpedo fill' }, earth);
  // finger infill: back-and-forth smears along the body, yellow; nose red
  const Lt = T0.L, rr = Lt * 0.055;
  for (let k = 0; k < 4; k++) {
    const y = -rr + (k + 0.5) * (2 * rr) / 4;
    const pts = tf([[-Lt * 0.46, y], [-Lt * 0.15, y + 5], [Lt * 0.12, y - 4], [Lt * 0.3, y + 3]], T0.cx, T0.cy, ta);
    pe.stroke(fillG, pts, { w: 34, color: PIG.yellow, t0: t.nuclear + 0.05 + k * 0.1, t1: t.nuclear + 0.45 + k * 0.1, seed: 160 + k, name: 'Torpedo body (yellow ochre)' });
  }
  for (let k = 0; k < 3; k++) {
    const y = -rr + (k + 0.5) * (2 * rr) / 3;
    pe.stroke(fillG, tf([[Lt * 0.3, y], [Lt * 0.52, y]], T0.cx, T0.cy, ta), { w: 40, color: PIG.red, t0: t.torpedo - 0.05 + k * 0.08, t1: t.torpedo + 0.2 + k * 0.08, seed: 170 + k, name: 'Warhead (red ochre)' });
  }
  pe.stroke(earth, tOut, { w: 16, color: PIG.char, t0: t.board - 0.1, t1: t.nuclear - 0.05, seed: 180, name: 'Torpedo outline (charcoal)' });
  const fin = (pts) => tf(pts, T0.cx, T0.cy, ta);
  pe.stroke(earth, fin([[-Lt * 0.44, -rr], [-Lt * 0.5, -rr * 2.1], [-Lt * 0.47, -rr * 0.2]]), { w: 13, color: PIG.char, t0: t.nuclear - 0.1, t1: t.nuclear + 0.15, seed: 181, name: 'Torpedo fin' });
  pe.stroke(earth, fin([[-Lt * 0.44, rr], [-Lt * 0.5, rr * 2.1], [-Lt * 0.47, rr * 0.2]]), { w: 13, color: PIG.char, t0: t.nuclear + 0.1, t1: t.nuclear + 0.3, seed: 182, name: 'Torpedo fin' });
  const N = P.nuclear;
  pe.write(earth, 'NUCLEAR', { x: N.x, y: N.y, cap: N.cap, anchor: 'middle', color: PIG.char, t0: t.nuclear - 4 * F, t1: t.torpedo + 0.05, seed: 44, name: 'Word "NUCLEAR"' });

  const figT = [t.three - 0.25, t.officers - 0.1, t.officers + 0.32];
  P.figs.forEach((f, k) => {
    const D = FIG[f.pose], h = f.h, X = (x) => f.x + x * h, Y = (y) => f.y + y * h;
    const tA = figT[k], dur = 0.85;
    const parts = [D.torso, ...D.limbs];
    const fg = svg('g', { 'data-name': `Officer ${k + 1} (${f.pose})`, opacity: 0.88 }, earth);
    pe.stroke(fg, D.torso.map(([x, y]) => [X(x), Y(y)]), { flat: true, w: h * 0.12, color: PIG.char, t0: tA, t1: tA + 0.25, seed: 200 + k * 20, name: `Officer ${k + 1} body` });
    D.limbs.forEach((ln, i) => pe.stroke(fg, ln.map(([x, y]) => [X(x), Y(y)]), { flat: true, w: h * D.w, color: PIG.char, t0: tA + 0.18 + i * (dur - 0.3) / parts.length, t1: tA + 0.36 + i * (dur - 0.3) / parts.length, seed: 201 + k * 20 + i, name: `Officer ${k + 1} limbs` }));
    const [hx, hy, hr] = D.head;
    pe.dot(fg, X(hx), Y(hy), { flat: true, r: hr * h, color: PIG.char, t: tA + 0.05, seed: 230 + k, name: `Officer ${k + 1} head (no face)` });
  });
  [0, 1].forEach((k) => {
    const f = P.figs[k], at = k ? t.yes - 0.02 : t.two - 0.05;
    pe.dot(earth, f.x + 0.03 * f.h, f.y + P.yes.dy * 0.45, { r: P.yes.r, color: PIG.yellow, t: at, seed: 240 + k, name: `Vote ${k + 1}: yes (yellow dot)` });
    pe.write(earth, 'YES', { x: f.x + 0.03 * f.h, y: f.y + P.yes.dy + P.yes.cap * 0.5, cap: P.yes.cap, anchor: 'middle', color: PIG.char, t0: at + 0.08, t1: at + 0.5, seed: 250 + k, name: `Label YES ${k + 1}` });
  });

  // ---------------------------------------------------------------- 4 · NO (red ochre, two-finger strokes), clay over the warhead, the name
  const NO = P.no;
  pe.write(earth, 'NO', { x: NO.x, y: NO.y, cap: NO.cap, color: PIG.red, t0: t.says - 0.4, t1: t.no - 0.04, seed: 52, w: NO.cap * 0.15, lean: 0.04, track: 0.24, name: 'Vote 3: NO (red ochre)' });
  pe.write(earth, 'NO', { x: NO.x + NO.cap * 0.05, y: NO.y + NO.cap * 0.03, cap: NO.cap * 0.98, color: PIG.red, t0: t.says - 0.36, t1: t.no + 0.0, seed: 53, w: NO.cap * 0.06, lean: 0.04, track: 0.26, name: 'NO second finger' });
  pw.stroke(clay, P.cancel, { w: 42, color: PIG.white, t0: t.no + 0.55, t1: t.no + 0.95, seed: 260, name: 'White clay smeared over the warhead' });
  pe.write(earth, 'V. ARKHIPOV', { x: P.name.x, y: P.name.y, cap: P.name.cap, anchor: P.name.anchor ?? 'start', color: PIG.char, t0: t.world - 0.05, t1: t.name + 0.25, seed: 61, name: 'Name "V. ARKHIPOV"' });
  pe.write(earth, '2002', { x: P.year.x, y: P.year.y, cap: P.year.cap, anchor: P.year.anchor ?? 'start', color: PIG.red, t0: t.forty - 0.02, t1: t.forty + 0.6, seed: 63, name: 'Year "2002" (name learned)' });

  // ---------------------------------------------------------------- sound (scheduled once; global seconds)
  if (sceneIndex === 0) {
    const at = (T) => Math.max(0, T - ctx.start);
    ctx.ambience('wind-grass-rustle-01', { from: 0, to: 27.5 - ctx.start, lu: -20, fade: 1.2 });
    ctx.ambience('woodland-wind-birds-01', { from: 0, to: 6.5 - ctx.start, lu: -27, fade: 1.5 });
    ctx.ambience('woodland-wind-birds-01', { from: at(23.2), to: 27.5 - ctx.start, lu: -26, fade: 1.5 });
    ctx.sfx('breath-close-01', at(t.soviet - 0.15), { lu: -19, duration: 1.5, fadeOut: 0.3 });
    ctx.sfx('sand-sprinkle-01', at(t.soviet), { lu: -27, duration: 1.3, fadeOut: 0.3 });
    chargeT.forEach((c, i) => ctx.sfx('boom-distant-01', at(c), { lu: -6 - i * 1.5 }));
    ctx.sfx('dirt-debris-01', at(chargeT[0] + 0.1), { lu: -21 });
    ctx.sfx('breath-close-01', at(t.says - 0.5), { lu: -22, duration: 0.7, fadeOut: 0.2 });
  }

  // ---------------------------------------------------------------- camera (locked tripod, slow creep; cuts hidden as moves)
  const V = P.cams;
  const keys = [
    [-1, V.date], [t.nine + 1.0, V.date], [t.soviet - 0.2, V.sea], [t.drop - 0.1, V.sea], [t.drop + 0.4, V.charges], [t.moscow - 0.45, V.charges],
    [t.moscow - 0.05, V.moscow], [t.days + 0.5, V.moscow], [t.board - 0.15, V.torp], [t.torpedo + 1.05, V.torp], [t.three - 0.35, V.vote],
    [t.third - 0.5, V.vote], [t.third + 0.2, V.third], [t.forty + 0.6, V.third], [t.forty + 2.4, V.all], [99, V.all],
  ];
  function cam(T) {
    let i = 0; while (i < keys.length - 2 && T > keys[i + 1][0]) i++;
    const [ta0, a] = keys[i], [ta1, b] = keys[i + 1];
    const p = ez((T - ta0) / (ta1 - ta0));
    const s = a.s * Math.pow(b.s / a.s, p);
    return { cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p, s };
  }
  const booms = chargeT;
  return {
    update(T) {
      const c = cam(T);
      const creepS = 1 + 0.004 * Math.sin(T * 0.21);
      let sx = 0, sy = 0;
      for (const b of booms) { const d = T - b; if (d > 0 && d < 0.5) { const k = Math.exp(-d * 9) * 7; sx += Math.sin(d * 71) * k; sy += Math.cos(d * 53) * k * 0.6; } }
      const s = c.s * creepS * (Lay.width / (land ? 1920 : 1080));
      const scx = Lay.safe.cx, scy = Lay.safe.cy;
      world.style.transform = `translate(${(scx - c.cx * s + sx).toFixed(2)}px, ${(scy - c.cy * s + sy).toFixed(2)}px) scale(${s.toFixed(5)})`;
      rake.style.opacity = (0.92 * ez((T - 12.5) / 9)).toFixed(3);
      pe.update(T); pw.update(T);
    },
  };
}
