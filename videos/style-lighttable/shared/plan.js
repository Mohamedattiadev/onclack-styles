// The whole film is ONE continuous light table. This file is the director's plan in world units:
// where every object lies (per format), the camera shots, the loupe path and every grease-pencil mark —
// all timed from the voice (words.json, global seconds). Scenes only pick their slice of time and add sound.
import { FR, CHART, chartXY, SHEET } from './assets.js';
import { wordAt, handLoop, handTick, handLine, r01 } from './kit.js';

export const SUB = [-71.2, 25.4]; // B-59 position, approximate (accounts differ) — labelled "approx." on screen

/** rotate a local point (relative to the object's centre) into world coords */
const rot = (o, lx, ly) => { const a = (o.rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [o.x + lx * c - ly * s, o.y + lx * s + ly * c]; };

export function makePlan(words, P) {
  const w = (s, n = 0, fb = 0) => wordAt(words, s, n, fb);
  const T = {
    oct: w('October', 0, 0.58), sixty: w('sixty-two', 0, 2.61), sub: w('submarine', 0, 4.3), deep: w('deep', 0, 5.42), cuba: w('Cuba', 0, 6.52),
    above: w('Above', 0, 7.56), amer: w('American', 0, 8.07), ships: w('ships', 0, 8.63), drop: w('drop', 0, 8.95), practice: w('practice', 0, 9.28),
    depth: w('depth', 0, 9.79), charges: w('charges', 0, 10.05), moscow: w('Moscow', 0, 10.95), silent: w('silent', 0, 11.93), days: w('days', 0, 12.49),
    board: w('board', 0, 13.83), nuclear: w('nuclear', 0, 14.48), torpedo: w('torpedo', 0, 14.88), fire: w('fire', 0, 15.9), three: w('three', 0, 16.51),
    agree: w('agree', 0, 17.61), two: w('Two', 0, 18.29), say: w('say', 0, 18.55), yes: w('yes', 0, 18.8),
    third: w('third', 0, 20.25), vasili: w('Vasili', 0, 20.61), arkh: w('Arkhipov', 0, 21.12), no: w('no', 0, 22.03),
    world: w('world', 0, 23.07), name: w('name', 0, 23.73), forty: w('forty', 0, 24.13), years: w('years', 0, 24.46), later: w('later', 0, 24.73),
  };
  const F = 1 / 30, lead = 2 * F; // visuals land 0–3 frames before their word

  /* ---------- objects (world units, centre + rotation in degrees) ---------- */
  const O = P ? {
    glass: { x0: 120, y0: 150, x1: 2400, y1: 5000 },
    chart: { x: 760, y: 700, rot: -1.2, w: CHART.w, h: CHART.h },
    stripA: { x0: 160, y: 1720, rot: -0.5 },
    stripB: { x: 560, y: 2360, rot: 0.8 },
    singles: [{ x: 600, y: 2860, rot: -1.3 }, { x: 640, y: 3320, rot: 0.7 }, { x: 590, y: 3800, rot: 1.4 }],
    sheet: { x: 640, y: 4470, rot: 1.4, w: SHEET.w, h: SHEET.h },
    prints: [{ x: 1180, y: 1180, rot: 0.4 }, { x: 180, y: 2050, rot: 2.1 }, { x: 1040, y: 3500, rot: -0.7 }],
  } : {
    glass: { x0: 200, y0: 150, x1: 3500, y1: 2720 },
    chart: { x: 900, y: 690, rot: -1.2, w: CHART.w, h: CHART.h },
    stripA: { x0: 260, y: 1520, rot: -0.5 },
    stripB: { x: 560, y: 2170, rot: 0.8 },
    singles: [{ x: 1200, y: 2200, rot: -1.3 }, { x: 1610, y: 2175, rot: 0.6 }, { x: 2020, y: 2200, rot: 1.4 }],
    sheet: { x: 2700, y: 2185, rot: 1.6, w: SHEET.w, h: SHEET.h },
    prints: [{ x: 1520, y: 1180, rot: 0.4 }, { x: 2900, y: 1450, rot: 2.1 }, { x: 330, y: 1880, rot: -0.7 }],
  };
  // strip A: frame i centre (frames along the strip, strip rotated about its left end)
  const aLen = 60 + 6 * FR.pitch + 60;
  O.stripA.x = O.stripA.x0 + aLen / 2; O.stripA.w = aLen;
  const fA = i => rot(O.stripA, -aLen / 2 + 60 + FR.pitch * (i + 0.5), 0);
  const bLen = 130 + FR.pitch + 40; O.stripB.w = bLen;
  const fB = rot(O.stripB, -bLen / 2 + 130 + FR.pitch / 2, 0);
  const subW = (() => { const [cx, cy] = chartXY(...SUB); return rot(O.chart, cx - CHART.w / 2, cy - CHART.h / 2); })();
  const cubaW = (() => { const [cx, cy] = chartXY(-80.2, 22.3); return rot(O.chart, cx - CHART.w / 2, cy - CHART.h / 2); })();
  const S = O.singles, SH = O.sheet;
  // the officer frames are slid in by hand on "three": from below, staggered
  S.forEach((s, i) => { s.t0 = T.three - lead + i * 0.14; s.from = { dx: P ? 560 : 40 + i * 30, dy: P ? 60 : 560, drot: 6 - i * 4 }; });

  /* ---------- tapes (typed paper labels) ---------- */
  const tapes = [
    { name: 'Tape 2A Randolph', x: fA(0)[0] - 150, y: O.stripA.y + 190, rot: -1.5, lines: ['USS RANDOLPH', '1962'], size: 26 },
    { name: 'Tape 2A Beale', x: fA(1)[0] - 150, y: O.stripA.y + 195, rot: 0.8, lines: ['USS BEALE', 'PHOTO 1964'], size: 26 },
    { name: 'Tape 2A B-36 + Cecil', x: fA(2)[0] - 150, y: O.stripA.y + 188, rot: -0.6, lines: ['B-36 + USS CECIL', 'OCT 1962'], size: 26 },
    { name: 'Tape 3B Captain', on: 0, x: -165, y: 128, rot: -1, lines: ['CAPTAIN'], size: 30 },
    { name: 'Tape 3B Political officer', on: 1, x: -165, y: 128, rot: 0.6, lines: ['POLITICAL OFFICER'], size: 30 },
    { name: 'Tape 3B Chief of staff', on: 2, x: -165, y: 128, rot: -0.4, lines: ['CHIEF OF STAFF'], size: 30 },
    { name: 'Tape 4B B-59 caption', sheet: true, x: -360, y: 205, rot: -0.8, lines: ['B-59 FORCED TO SURFACE, 28–29 OCT 1962', 'U.S. NAVY PHOTO — NARA 428-N-711200'], size: 22 },
  ];

  /* ---------- grease-pencil marks ---------- */
  const Y = 'yellow', R = 'red';
  const marks = [];
  const txt = (name, color, t0, x, y, text, size, o = {}) => marks.push({ kind: 'text', name, color, t0: t0 - lead, dur: o.dur ?? Math.max(0.25, text.length / 13), x, y, text, size, rot: o.rot ?? (r01(name.length, 3) - 0.5) * 4, seed: o.seed ?? name.length * 7, anchor: o.anchor ?? 'start', obj: o.obj });
  const pth = (name, color, t0, dur, d, wdt = 7, o = {}) => marks.push({ kind: 'path', name, color, t0: t0 - lead, dur, d, width: wdt, obj: o.obj });
  const cA = (() => { const [x, y] = chartXY(-87.7, 26.7); return rot(O.chart, x - CHART.w / 2, y - CHART.h / 2); })();
  // 1 — chart
  txt('1A Date (grease)', Y, T.oct, cA[0], cA[1], '27 OCT', 50, { rot: -3, dur: 1.0 });
  txt('1A Year (grease)', Y, T.oct + 1.15, cA[0] + 14, cA[1] + 56, '1962', 50, { rot: -2, dur: T.sixty + 0.35 - T.oct - 1.15 });
  pth('1B Circle B-59', Y, T.sub, 0.55, handLoop(subW[0], subW[1], 44, 38, 3, -0.2), 6);
  txt('1B B-59 (grease)', Y, T.sub + 0.62, subW[0] - 60, subW[1] - 215, 'B-59', 50, { rot: -4 });
  txt('1B approx (grease)', Y, T.deep + 0.05, subW[0] - 52, subW[1] - 168, 'approx.', 34, { rot: -2 });
  pth('1C Underline Cuba', Y, T.cuba - 0.05, 0.35, handLine(cubaW[0] - 6, cubaW[1] + 14, cubaW[0] + 132, cubaW[1] + 10, 5, 4), 5);
  // 2 — the hunters strip, then the empty frames
  const f3 = fA(2), f4 = fA(3), f5 = fA(4), f6 = fA(5);
  pth('2B Circle frame 3', R, T.drop, 0.5, handLoop(f3[0], f3[1] + 4, 212, 158, 8, -0.04), 8);
  const capY = O.stripA.y - 292;
  txt('2B Practice (grease)', R, T.practice, f3[0] - (P ? 170 : 300), capY, 'PRACTICE', 54, { rot: -2 });
  txt('2B Depth charges (grease)', R, T.depth, f3[0] - (P ? 170 : 300), capY + 62, 'DEPTH CHARGES', 54, { rot: -1.5 });
  const mY = O.stripA.y - 230;
  txt('2C Moscow (grease)', R, T.moscow, f4[0] - 60, mY, 'MOSCOW', 62, { rot: -2.5 });
  pth('2C Flat line (no word)', R, T.silent - 0.05, 0.6, handLine(f4[0] - 175, f4[1] - 2, f6[0] + 175, f6[1] - 8, 21, 3), 7);
  for (let i = 0; i < 4; i++) {
    const x = f4[0] + 255 + i * 26;
    pth(`2C Tally day ${i + 1}`, R, T.days + i * 0.1, 0.09, handLine(x, mY - 46 + (i % 2) * 3, x - 4, mY + 2, 30 + i, 2), 6);
  }
  // 3 — torpedo frame, the three cut frames
  const wh = rot(O.stripB, -bLen / 2 + 130 + 10 + FR.w * 0.07 + FR.w * 0.11, 25);
  txt('3A Nuclear (grease)', Y, T.nuclear, fB[0] + 10, fB[1] - 52, 'NUCLEAR', 38, { rot: -3 });
  pth('3A Circle warhead', Y, T.torpedo + 0.05, 0.45, handLoop(wh[0], wh[1], 62, 34, 12, 0.05), 5);
  if (P) {
    const bx = S[0].x - 215;
    pth('3B Bracket all 3', R, T.agree - 0.25, 0.45, handLine(bx, S[0].y - 170, bx - 6, S[2].y + 170, 41, 4), 7);
    txt('3B All 3 (grease)', R, T.agree, bx - 24, S[1].y + 10, 'ALL 3', 50, { rot: -90, anchor: 'middle' });
  } else {
    const by = S[0].y + 215;
    pth('3B Bracket all 3', R, T.agree - 0.25, 0.45, handLine(S[0].x - 180, by, S[2].x + 180, by + 6, 41, 4), 7);
    txt('3B All 3 (grease)', R, T.agree, S[1].x, by + 66, 'ALL 3', 54, { anchor: 'middle', rot: -1 });
  }
  const tick = (i, t0, n) => {
    const s = S[i], tx = s.x + 95, ty = s.y - 45;
    pth(`3C Tick ${i + 1}`, R, t0, 0.22, handTick(tx, ty, 70, 50 + i), 8);
    txt(`3C Yes ${i + 1} (grease)`, R, T.yes + i * 0.16, tx - 40, ty + 95, 'YES', 44, { rot: -4 + i * 3 });
  };
  tick(0, T.two, 0); tick(1, T.say, 1);
  // 4 — the third frame, NO, then the sheet develops
  const s3 = S[2];
  txt('4A Arkhipov (grease)', R, T.vasili, s3.x + (P ? -185 : -190), s3.y - (P ? 200 : 205), 'V. ARKHIPOV', 52, { rot: -2, dur: T.arkh + 0.45 - T.vasili });
  txt('4A NO (grease)', R, T.no, s3.x + 4, s3.y + 48, 'NO', 150, { rot: -6, anchor: 'middle', dur: 0.38 });
  pth('4A Circle NO', R, T.no + 0.4, 0.35, handLoop(s3.x + 4, s3.y, 132, 96, 17, -0.1), 8);
  const sk = rot(SH, -330, -145);
  txt('4C 1962 (grease)', R, T.forty, sk[0], sk[1], '1962', 58, { rot: -3, dur: 0.3 });
  pth('4C Arrow', R, T.forty + 0.3, 0.25, handLine(sk[0] + 150, sk[1] - 18, sk[0] + 255, sk[1] - 26, 61, 3), 6);
  pth('4C Arrow head', R, T.forty + 0.52, 0.1, `M${sk[0] + 232} ${sk[1] - 44} L${sk[0] + 257} ${sk[1] - 26} L${sk[0] + 230} ${sk[1] - 8}`, 6);
  txt('4C 2002 (grease)', R, T.years, sk[0] + 275, sk[1] - 8, '2002', 58, { rot: -3, dur: 0.32 });

  /* ---------- camera shots: {t, from:[x,y,z], to:[x,y,z], a, b, e} (a cut = a new shot) ---------- */
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const cut1 = T.above - 0.2, cut2 = T.moscow - 0.12, cut3 = T.board - 0.36, cut4 = T.fire - 0.42;
  const cs = mid(subW, cubaW);
  const tDrop0 = T.world + 0.15, tDrop1 = T.name + 0.35;
  const shots = P ? [
    { t: 0, from: [O.chart.x - 40, O.chart.y + 30, 0.93], to: [cs[0] - 20, cs[1] + 10, 1.5], a: 0.4, b: cut1, e: 'camera' },
    { t: cut1, from: [fA(0)[0] + 110, O.stripA.y - 60, 1.5], to: [fA(1)[0] + 40, O.stripA.y - 60, 1.55], a: cut1, b: T.ships + 0.1, e: 'camera' },
    { t: T.drop - 0.1, from: [f3[0] + 20, O.stripA.y - 90, 2.1], to: [f3[0] + 25, O.stripA.y - 90, 2.2], a: T.drop - 0.1, b: cut2, e: 'drift' },
    { t: cut2, from: [f5[0] - 130, O.stripA.y - 60, 1.15], to: [f5[0] - 120, O.stripA.y - 60, 1.2], a: cut2, b: cut3, e: 'drift' },
    { t: cut3, from: [fB[0] - 20, fB[1] - 10, 2.05], to: [fB[0] - 20, fB[1] - 10, 2.15], a: cut3, b: cut4, e: 'drift' },
    { t: cut4, from: [S[1].x + 20, S[1].y, 1.06], to: [S[1].x + 20, S[1].y + 10, 1.1], a: cut4, b: T.third - 0.2, e: 'drift' },
    { t: T.third - 0.2, from: [S[1].x + 20, S[1].y + 10, 1.1], to: [s3.x - 30, s3.y - 50, 1.62], a: T.third - 0.2, b: T.no - 0.3, e: 'camera' },
    { t: T.no + 0.75, from: [s3.x - 30, s3.y - 50, 1.62], to: [SH.x, SH.y - 140, 0.86], a: T.no + 0.75, b: tDrop0 + 0.1, e: 'move' },
    { t: tDrop0 + 0.1, from: [SH.x, SH.y - 140, 0.86], to: [SH.x, SH.y + 10, 1.05], a: tDrop0 + 0.1, b: tDrop1, e: 'camera' },
  ] : [
    { t: 0, from: [O.chart.x - 120, O.chart.y + 20, 0.88], to: [cs[0] + 20, cs[1] + 20, 1.32], a: 0.4, b: cut1, e: 'camera' },
    { t: cut1, from: [fA(1)[0] - 20, O.stripA.y - 10, 1.3], to: [fA(1)[0] + 60, O.stripA.y - 20, 1.38], a: cut1, b: cut2, e: 'drift' },
    { t: cut2, from: [f5[0] + 180, O.stripA.y - 40, 1.28], to: [f5[0] + 190, O.stripA.y - 40, 1.33], a: cut2, b: cut3, e: 'drift' },
    { t: cut3, from: [fB[0] + 10, fB[1] - 8, 2.2], to: [fB[0] + 10, fB[1] - 8, 2.32], a: cut3, b: cut4, e: 'drift' },
    { t: cut4, from: [S[1].x, S[1].y + 60, 1.24], to: [S[1].x, S[1].y + 64, 1.28], a: cut4, b: T.third - 0.2, e: 'drift' },
    { t: T.third - 0.2, from: [S[1].x, S[1].y + 64, 1.28], to: [s3.x - 30, s3.y - 60, 1.55], a: T.third - 0.2, b: T.no - 0.3, e: 'camera' },
    { t: T.no + 0.75, from: [s3.x - 30, s3.y - 60, 1.55], to: [SH.x - 90, SH.y - 10, 1.08], a: T.no + 0.75, b: tDrop0 + 0.1, e: 'move' },
    { t: tDrop0 + 0.1, from: [SH.x - 90, SH.y - 10, 1.08], to: [SH.x, SH.y + 12, 1.3], a: tDrop0 + 0.1, b: tDrop1, e: 'camera' },
  ];

  /* ---------- loupe: rest points + moves {t, dur, x, y} (dur 0 = placed during a cut) ---------- */
  const rest = P ? [O.chart.x + 380, O.chart.y + 470] : [O.chart.x + 560, O.chart.y + 330];
  const loupe = [
    { t: 0, dur: 0, x: rest[0], y: rest[1] },
    { t: T.deep - 0.55, dur: 0.6, x: subW[0] - 8, y: subW[1] + 4 },
    { t: cut1, dur: 0, x: fA(0)[0], y: fA(0)[1] },
    { t: T.amer - 0.15, dur: 0.5, x: fA(1)[0], y: fA(1)[1] },
    { t: T.ships - 0.05, dur: 0.45, x: f3[0] - 30, y: f3[1] + 10 },
    { t: cut2, dur: 0, x: f6[0] - 20, y: f6[1] + 6 },
    { t: cut3, dur: 0, x: fB[0] + 250, y: fB[1] + 150 },
    { t: T.nuclear - 0.5, dur: 0.5, x: wh[0] - 20, y: wh[1] + 30 },
    { t: cut4, dur: 0, x: P ? s3.x + 330 : s3.x + 380, y: P ? s3.y + 260 : s3.y + 230 },
    { t: T.yes + 0.35, dur: 0.8, x: s3.x + 10, y: s3.y + 4 },
    { t: T.no + 0.8, dur: 0.75, x: SH.x - 20, y: SH.y - 10 },
  ];
  const drop = { t0: tDrop0, t1: tDrop1, x: SH.x, y: SH.y + 12, zFit: P ? 1.45 : 2.05 };
  const booms = [T.drop + 0.02, T.charges + 0.02];
  const develop = { t0: T.name - 0.05, t1: T.forty + 0.55 };
  const light = { t0: 0.1, t1: 0.55 };

  return { T, O, fA, fB, subW, cubaW, tapes, marks, shots, loupe, drop, booms, develop, light, lensR: 150, M: P ? 1.7 : 1.9 };
}
