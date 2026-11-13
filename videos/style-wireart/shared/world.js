// BENT WIRE — the whole film is one white plaster wall, lit from the upper left. Every figure is one bent wire
// standing off the wall on pins, so it throws a real offset shadow. The wire never cuts: it BENDS from shape to shape.
// Global time T (seconds, voice-aligned). See README.md for the beat table and truth codes.
import { svg, el, clamp, rand, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep, glide } from '/onclack-styles/engine/lib/spring.js';
import { resample, place, endCurls, coil, flat, morph, wireText, textWidth, makeWire, fillet } from './wire.js';
import { OFF1, OFF2, OFF3, OFF3_HAND, SUB, TORPEDO, SHIP, CHARGE, BURST, SEA } from './shapes.js';

// ---- beat times (from words.json, global seconds; visuals land 0–3 frames before the word) ----
export const T = {
  date: [0.35, 2.45],          // straight wire bends into "27 OCT 1962" ("October twenty-seventh, nineteen sixty-two")
  sub: [3.55, 4.75],           // date bends into the submarine ("A Soviet submarine")
  deep: 5.36,                  // sea wire fed in above, sub sinks ("deep in the sea")
  ships: [7.5, 8.55],          // ships bend up out of the sea wire ("Above it, American ships")
  drops: [8.88, 9.22, 9.74],   // "drop practice depth charges"
  fall: 0.95,
  moscow: [10.88, 11.55], cut: 11.88, // "Moscow has been silent for days"
  below: [13.35, 14.2],        // "On board": sea + ships flatten and lift away
  torpedo: [14.05, 14.84],     // sub bends into the torpedo ("nuclear torpedo")
  figs: [16.32, 16.52, 16.72], figDur: 0.95, // "three officers"
  rule: 17.45,                 // "must agree"
  yes: [18.22, 18.72],         // "Two say yes"
  third: [19.95, 20.9],        // camera finds the copper figure ("The third")
  name: 20.55,                 // "Vasili Arkhipov"
  no: [21.38, 21.98],          // "says no" (word at 22.03)
  slack: [22.55, 23.7],        // the torpedo relaxes into plain slack wire
  later: 24.05,                // "forty years later"
};

export const SOUNDS = [
  { bed: 'sea-water-close-01', at: 0, to: 13.6, lu: -19 },
  { bed: 'drips-wood-01', at: 13.5, to: 21.1, lu: -25 },
  { id: 'cloth-jacket-01', at: 0.36, lu: -22 },
  { id: 'cloth-jacket-01', at: 3.56, lu: -21 },
  { id: 'footsteps-metal-deck-01', at: 4.74, lu: -20 },
  { id: 'boom-distant-01', at: 9.85, lu: -8 },
  { id: 'boom-slapback-01', at: 10.19, lu: -9, duration: 2.6, fadeOut: 0.9 },
  { id: 'boom-distant-01', at: 10.71, lu: -12 },
  { id: 'footsteps-metal-deck-01', at: 13.7, lu: -15 },
  { id: 'cloth-jacket-01', at: 16.33, lu: -20 },
  { id: 'breath-close-01', at: 18.9, lu: -24, duration: 1.0, fadeIn: 0.05, fadeOut: 0.3 },
  { id: 'drawer-close-01', at: 21.99, lu: -17 },
  { bed: 'sea-wash-calm-01', at: 22.8, to: 26.2, lu: -22 },
];

const N = { main: 900, sea: 260, ship: 260, fig: 520, tag: 220, charge: 120, mos: 120, no: 300 };

export function buildWorld(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, px = L.px, P = L.portrait, S = L.safe;
  const u = L.unit;

  // ---------- DOM ----------
  root.style.cssText = `position:absolute;inset:0;overflow:hidden;background:#ECE8E0;`;
  const wall = el('div', { 'data-name': 'Plaster wall', style: { position: 'absolute', inset: '-6%', backgroundImage: `url(${ctx.asset('assets/plaster.jpg')})`, backgroundSize: `${px(1100)}px`, backgroundColor: '#ECE8E0' } }, root);
  const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;inset:0;overflow:visible' }, root);
  const defs = svg('defs', {}, s);
  const f = svg('filter', { id: 'wa-soft', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
  svg('feGaussianBlur', { stdDeviation: (2.4 * u).toFixed(2) }, f);
  const cam = svg('g', { 'data-name': 'Camera' }, s);
  const gNotes = svg('g', { 'data-name': 'Pencil notes' }, cam);
  const gShadow = svg('g', { 'data-name': 'Shadows', filter: 'url(#wa-soft)' }, cam);
  const gPins = svg('g', { 'data-name': 'Pins' }, cam);
  const gWire = svg('g', { 'data-name': 'Wires' }, cam);
  // key light falloff (upper-left bright, lower-right a touch darker) — one light, not a vignette
  el('div', { 'data-name': 'Key light', style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(120% 120% at 12% 6%, rgba(255,253,248,0.35) 0%, rgba(255,253,248,0) 45%, rgba(70,60,50,0.10) 100%)` } }, root);

  const wire = (o) => makeWire(gShadow, gWire, { unit: u, ...o });

  // ---------- geometry per format ----------
  // the date is three wires: "27" and "OCT" (they later stretch into the sea wire) and "1962" (the main wire)
  const cap = P ? px(166) : px(156), trk = 0.24, gap = cap * 0.62;
  const w27 = textWidth('27', cap, trk), wOCT = textWidth('OCT', cap, trk), w62 = textWidth('1962', cap, trk);
  let x27, xOCT, x62, yA, yB;
  if (P) { yA = H * 0.40; yB = yA + cap * 1.45; x27 = W / 2 - (w27 + gap + wOCT) / 2; xOCT = x27 + w27 + gap; x62 = W / 2 - w62 / 2; }
  else { yA = yB = H * 0.47; x27 = W / 2 - (w27 + wOCT + w62 + 2 * gap) / 2; xOCT = x27 + w27 + gap; x62 = xOCT + wOCT + gap; }
  const date = resample(endCurls(wireText('1962', x62, yB, cap, { track: trk, align: 'left' }), px(9)), N.main);
  const d27 = resample(endCurls(wireText('27', x27, yA, cap, { track: trk, align: 'left' }), px(9)), N.sea);
  const dOCT = resample(endCurls(wireText('OCT', xOCT, yA, cap, { track: trk, align: 'left' }), px(9)), N.sea);
  const lineY = P ? H * 0.47 : H * 0.42;
  const straight = flat(N.main, S.x + px(30), lineY, S.x + S.w - px(30), lineY);

  const subW = P ? px(780) : px(820);
  const subPos1 = P ? [S.cx, H * 0.5] : [W / 2, H * 0.6];       // after it forms
  const subPos2 = P ? [S.cx, H * 0.56] : [W * 0.5, H * 0.66]; // sinks deeper
  const subShape = (x, y) => resample(endCurls(place(SUB(), x, y, subW), px(7)), N.main);
  const sub1 = subShape(...subPos1), sub2 = subShape(...subPos2);

  const seaY = P ? H * 0.27 : H * 0.3;
  const seaMid = S.x + S.w * 0.46;
  const seaL = resample(endCurls(SEA(S.x + px(14), seaMid, seaY, px(7), 300, 1), px(6)), N.sea);
  const seaR = resample(endCurls(SEA(seaMid, S.x + S.w - px(14), seaY, px(7), 300, 4.2), px(6)), N.sea);
  const d27Seed = straight.filter((_, i) => i % Math.ceil(N.main / N.sea) === 0).slice(0, N.sea);
  while (d27Seed.length < N.sea) d27Seed.push(d27Seed[d27Seed.length - 1]);

  const shipW = P ? px(330) : px(330);
  const shipX = P ? [0.13, 0.55, 0.93].map(f => S.x + S.w * f) : [0.22, 0.5, 0.77].map(f => S.x + S.w * f);
  const shipS = [1.0, 1.18, 0.78];
  const ships = shipX.map((x, i) => resample(endCurls(place(SHIP(i), x, seaY - px(4), shipW * shipS[i]), px(5)), N.ship));
  const shipFlat = shipX.map((x, i) => flat(N.ship, x - shipW * 0.55 * shipS[i], seaY - px(2), x + shipW * 0.55 * shipS[i], seaY + px(1)));

  // depth charges: drop from each ship's stern, burst beside the sub
  const chR = px(14);
  const chargeShape = resample(CHARGE(200, chR), N.charge);
  const burstAt = P
    ? [[W * 0.24, H * 0.53], [W * 0.73, H * 0.6], [W * 0.5, H * 0.47]]
    : [[W * 0.3, H * 0.58], [W * 0.79, H * 0.57], [W * 0.57, H * 0.5]];
  const dropFrom = [shipX[0] - shipW * 0.3, shipX[2] - shipW * 0.3, shipX[1] - shipW * 0.3];
  const burst = burstAt.map((b, i) => resample(BURST(240, px(62), i * 0.7), N.charge));

  // Moscow line: a thin wire from the sail up and away to the right; at "silent" it is cut
  const sail = [subPos2[0] - subW * 0.02, subPos2[1] - subW * 0.24];
  const mFar = P ? [S.x + S.w + px(40), H * 0.40] : [S.x + S.w + px(60), H * 0.44];
  const mCut = P ? [W * 0.74, H * 0.44] : [W * 0.79, H * 0.47];
  const mosA = resample(fillet([sail, [sail[0] + px(40), sail[1] - px(60)], [mCut[0] - px(60), mCut[1] - px(8)], mCut, mFar], px(20)), N.mos);
  const mosCut = resample(endCurls(fillet([sail, [sail[0] + px(40), sail[1] - px(60)], [mCut[0] - px(90), mCut[1] - px(6)], [mCut[0] - px(52), mCut[1] + px(26)]], px(26)), px(6), 'end'), N.mos);
  const mosFar = resample(endCurls(fillet([[mCut[0] + px(30), mCut[1] + px(40)], [mCut[0] + px(46), mCut[1] - px(2)], mFar], px(24)), px(6), 'start'), N.mos);
  const mosSeed = mosA.map(() => sail);

  // ---- scene 3/4: below decks ----
  const torW = P ? px(700) : px(940);
  const torPos = P ? [S.cx, H * 0.2] : [W * 0.5, H * 0.2];
  const torpedo = resample(place(TORPEDO(), ...torPos, torW), N.main);
  // 9:16: the torpedo first fills the tall frame on a diagonal, then is moved up to make room for the officers
  const torBig = P ? resample(place(TORPEDO(), S.cx + px(24), H * 0.41, px(790), 28), N.main) : resample(place(TORPEDO(), W * 0.5, H * 0.45, px(1240), 0), N.main);
  const torUp = [15.95, 16.55];
  const slack = resample(endCurls(fillet([[torPos[0] - torW * 0.5, torPos[1] - px(6)], [torPos[0] - torW * 0.2, torPos[1] + px(52)], [torPos[0] + torW * 0.15, torPos[1] + px(64)], [torPos[0] + torW * 0.5, torPos[1] + px(10)]], px(200), 10), px(7)), N.main);

  const figH = P ? px(440) : px(470);
  const figY = P ? H * 0.33 : H * 0.42; // head top
  const figX = P ? [px(200), px(420), px(772)] : [W * 0.33, W * 0.505, W * 0.69];
  const figs = [OFF1, OFF2, OFF3].map((F, i) => resample(endCurls(place(F(), figX[i], figY, figH), px(5)), N.fig));
  // raw wire hangs on a nail as a coil until it is bent into a person
  const coilC = figX.map(x => [x, figY + figH * 0.205 + px(54)]);
  const coils = coilC.map(([x, y], i) => resample(coil(x, y, px(58), 6, 600, 0.9, i * 1.3), N.fig));

  const tagCap = P ? px(64) : px(58);
  const tagPos = P ? [[figX[0], figY - px(30)], [figX[1] + px(40), figY - px(30)]] : [[figX[0] + px(70), figY + px(40)], [figX[1] + px(95), figY + px(40)]];
  const tags = tagPos.map(([x, y]) => resample(wireText('YES', x, y, tagCap, { track: 0.24, align: P ? 'center' : 'left' }), N.tag));
  const tagCoils = tagPos.map(([x, y], i) => resample(coil(x + (P ? 0 : tagCap * 0.9), y - tagCap * 0.4, px(26), 4, 300, 0.85, i), N.tag));

  // the copper NO, fed out of Arkhipov's open hand
  const hand = place([OFF3_HAND], figX[2], figY, figH)[0];
  const noCap = P ? px(230) : px(215);
  const noPos = P ? [W * 0.56, H * 0.75] : [W * 0.855, figY + figH * 0.74];
  const noLeft = noPos[0] - textWidth('NO', noCap, 0.26) / 2;
  const nTxt = wireText('N', noLeft, noPos[1], noCap, { align: 'left' });
  const oTxt = wireText('O', noLeft + 0.86 * noCap, noPos[1], noCap, { align: 'left' });
  const noShape = resample(endCurls(nTxt, px(8)), N.no);
  const oShape = resample(endCurls(oTxt, px(8)), N.no);
  const oSeed = oShape.map(() => nTxt[nTxt.length - 1]);
  const noSeed = noShape.map(() => hand);

  // ---------- wires ----------
  const wMain = wire({ name: 'Main wire (date → sub → torpedo)', w: P ? px(8.5) : px(8), standoff: 1.1 });
  const wSeaL = wire({ name: 'Date "27" → sea wire (left)', w: P ? px(8.5) : px(8), standoff: 1.1 });
  const wSeaR = wire({ name: 'Date "OCT" → sea wire (right)', w: P ? px(8.5) : px(8), standoff: 1.1 });
  const wShips = ships.map((_, i) => wire({ name: `Ship ${i + 1}`, w: px(5.5), standoff: 0.9 }));
  const wCharge = burst.map((_, i) => wire({ name: `Depth charge ${i + 1}`, w: px(4.5), standoff: 1.4 }));
  const wMos = wire({ name: 'Moscow line', w: px(3.5), standoff: 0.7 });
  const wMosFar = wire({ name: 'Moscow line (far end)', w: px(3.5), standoff: 0.7 });
  const wFigs = figs.map((_, i) => wire({ name: i === 2 ? 'Arkhipov (copper wire)' : `Officer ${i + 1}`, kind: i === 2 ? 'copper' : 'steel', w: px(6.5), standoff: 1.2 }));
  const wTags = tags.map((_, i) => wire({ name: `YES ${i + 1}`, w: px(5), standoff: 1.0 }));
  const wNo = wire({ name: 'N of NO (copper, out of his hand)', kind: 'copper', w: px(9), standoff: 1.35 });
  const wO = wire({ name: 'O of NO (copper)', kind: 'copper', w: px(9), standoff: 1.35 });

  // ---------- pins (where wires stand off the wall) ----------
  const pin = (x, y, name) => {
    const g = svg('g', { 'data-name': name }, gPins);
    svg('ellipse', { cx: x + px(3.5), cy: y + px(4.5), rx: px(5.5), ry: px(5), fill: '#4B5562', 'fill-opacity': 0.32 }, g);
    svg('circle', { cx: x, cy: y, r: px(5), fill: '#2C3035' }, g);
    svg('circle', { cx: x - px(1.6), cy: y - px(1.8), r: px(1.7), fill: '#DCE2E6' }, g);
    return g;
  };
  const pins = {
    date: [pin(straight[0][0] - px(18), straight[0][1], 'Pin L'), pin(straight[N.main - 1][0] + px(18), straight[0][1], 'Pin R')],
    sea: [pin(S.x + px(14), seaY + px(12), 'Sea pin L'), pin(seaMid, seaY + px(12), 'Sea pin M'), pin(S.x + S.w - px(14), seaY + px(12), 'Sea pin R')],
    figs: figX.map((x, i) => pin(x, figY + figH * 0.205, `Nail ${i + 1}`)),
  };

  // ---------- pencil notes on the plaster ----------
  const notes = [];
  const note = (txt, x, y, size, { at, end = 99, anchor = 'start', italic = true, mono = false, name, wipe = 0.45 }) => {
    const cid = 'wa-c' + notes.length + ctx.format;
    const cp = svg('clipPath', { id: cid }, defs);
    const r = svg('rect', { x: -10, y: -10, width: 0, height: H * 2 }, cp);
    const t = svg('text', {
      x, y, 'font-size': size, fill: mono ? '#5A5751' : '#3F3C37', 'text-anchor': anchor, 'clip-path': `url(#${cid})`, 'data-name': name ?? txt,
      style: `font-family:${mono ? "'IBM Plex Mono'" : "'Newsreader'"};font-style:${italic && !mono ? 'italic' : 'normal'};font-weight:${mono ? 400 : 600};letter-spacing:${mono ? '0.02em' : '0'};font-kerning:normal`,
    }, gNotes);
    t.textContent = txt;
    notes.push({ t, r, at, end, wipe, x, anchor, size, len: txt.length });
  };
  // pencil underline / tick marks (fixed per object, not boiling)
  const NS = P ? px(50) : px(46), NM = P ? px(36) : px(32);
  if (P) {
    note('the Cuban Missile Crisis', W / 2, H * 0.40 + cap * 2.15, NS, { at: 1.3, end: 3.55, anchor: 'middle' });
    note('B-59 · Soviet submarine', S.x + px(36), H * 0.66, NS, { at: 4.2, end: 13.4 });
    note('near Cuba · position approx.', S.x + px(36), H * 0.66 + px(52), NM, { at: 6.2, end: 13.4, mono: true });
    note('US Navy · practice depth charges', S.x + px(36), seaY + px(84), NM, { at: 8.9, end: 13.4, mono: true });
    note('Moscow: no orders for days', S.x + S.w - px(30), H * 0.40 - px(40), NS, { at: 11.95, end: 13.4, anchor: 'end' });
    note('nuclear torpedo', S.x + px(40), H * 0.6, NS, { at: 14.6, end: 15.95, name: 'nuclear torpedo (big)' });
    note('nuclear torpedo', torPos[0] + torW * 0.5, torPos[1] + px(112), NS, { at: 16.5, end: 21.2, anchor: 'end', name: 'nuclear torpedo (top)' });
    note('to fire, all three must agree', W / 2, figY + figH + px(78), NS, { at: T.rule, end: 19.9, anchor: 'middle' });
    note('from later accounts, debated', W / 2, figY + figH + px(128), NM, { at: 17.9, end: 19.9, anchor: 'middle', mono: true });
    note('Vasili Arkhipov', noPos[0], noPos[1] + px(82), NS, { at: T.name, anchor: 'middle' });
    note('his story told widely from 2002', noPos[0] - px(20), noPos[1] + px(128), NM, { at: T.later, anchor: 'middle', mono: true });
  } else {
    note('the Cuban Missile Crisis', W / 2, H * 0.47 + px(96), NS, { at: 1.3, end: 3.55, anchor: 'middle' });
    note('B-59 · Soviet submarine', subPos2[0] - subW * 0.5, subPos2[1] + px(110), NS, { at: 4.2, end: 13.4 });
    note('near Cuba · position approx.', subPos2[0] - subW * 0.5, subPos2[1] + px(156), NM, { at: 6.2, end: 13.4, mono: true });
    note('US Navy · practice depth charges', S.x + px(40), seaY - px(150), NM, { at: 8.9, end: 13.4, mono: true });
    note('Moscow: no orders for days', S.x + S.w - px(30), mCut[1] - px(50), NS, { at: 11.95, end: 13.4, anchor: 'end' });
    note('nuclear torpedo', W * 0.5 + px(620), H * 0.45 + px(130), NS, { at: 14.6, end: 15.95, anchor: 'end', name: 'nuclear torpedo (big)' });
    note('nuclear torpedo', torPos[0] + torW * 0.5, torPos[1] + px(110), NS, { at: 16.5, end: 21.2, anchor: 'end' });
    note('to fire,', S.x + px(40), figY + px(150), NS, { at: T.rule, end: 19.95 });
    note('all three must agree', S.x + px(40), figY + px(204), NS, { at: T.rule + 0.25, end: 19.95 });
    note('from later accounts,', S.x + px(40), figY + px(256), NM, { at: 17.9, end: 19.95, mono: true });
    note('details debated', S.x + px(40), figY + px(296), NM, { at: 18.1, end: 19.95, mono: true });
    note('Vasili Arkhipov', noPos[0], noPos[1] + px(80), NS, { at: T.name, anchor: 'middle' });
    note('his story told widely from 2002', noPos[0], noPos[1] + px(126), NM, { at: T.later, anchor: 'middle', mono: true });
  }

  // sculptor's pencil layout lines under the date (cap line + baseline + tick marks), rubbed out when the date is bent away
  const guides = svg('g', { 'data-name': 'Pencil layout lines', stroke: '#8A857C', 'stroke-width': Math.max(1.2, px(1.3)), 'stroke-linecap': 'round', fill: 'none' }, gNotes);
  const gl = (x0, y0, x1, y1) => svg('path', { d: `M${x0} ${y0}L${x1} ${y1}` }, guides);
  const gx0 = Math.min(x27, x62) - px(40), gx1 = (P ? Math.max(xOCT + wOCT, x62 + w62) : x62 + w62) + px(40);
  for (const yy of P ? [yA, yB] : [yA]) { gl(gx0, yy + px(3), gx1, yy + px(1)); gl(gx0 + px(20), yy - cap - px(1), gx1 - px(30), yy - cap + px(1)); }
  [x27, xOCT, x62].forEach((x, i) => { const yy = P && i === 2 ? yB : yA; gl(x, yy + px(12), x, yy + px(26)); });
  const guideClip = svg('clipPath', { id: 'wa-g' + ctx.format }, defs);
  const guideRect = svg('rect', { x: 0, y: 0, width: 0, height: H }, guideClip);
  guides.setAttribute('clip-path', `url(#wa-g${ctx.format})`);

  // ---------- camera keys (cx, cy, scale) ----------
  const camKeys = P
    ? [[0, W / 2, H / 2, 1.0], [13.3, W / 2, H / 2, 1.03], [19.95, W / 2, H / 2, 1.0], [20.9, W * 0.52, H * 0.56, 1.05], [26, W * 0.525, H * 0.565, 1.07]]
    : [[0, W / 2, H / 2, 1.0], [13.3, W / 2, H / 2, 1.03], [19.95, W / 2, H / 2, 1.0], [20.9, W * 0.6, H * 0.53, 1.07], [26, W * 0.61, H * 0.535, 1.09]];

  // ---------- update ----------
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  function update(t) {
    // camera: glide between keys, slow creep on holds, noise shake after each burst
    let k = 0; while (k < camKeys.length - 2 && t >= camKeys[k + 1][0]) k++;
    const [t0, x0, y0, s0] = camKeys[k], [t1, x1, y1, s1] = camKeys[k + 1];
    const q = k === 2 ? smootherstep(seg(t, t0, t1)) : seg(t, t0, t1);
    let cx = x0 + (x1 - x0) * q, cy = y0 + (y1 - y0) * q, sc = s0 + (s1 - s0) * q;
    let shx = 0, shy = 0;
    T.drops.forEach((d, i) => {
      const dt = t - (d + T.fall);
      if (dt > 0 && dt < 0.6) { const a = px(i === 1 ? 9 : 6) * Math.exp(-dt * 7); shx += a * noise1(dt * 40, i * 3); shy += a * noise1(dt * 40, i * 3 + 7); }
    });
    // "below decks" tilt: the whole wall slides up a little as we go on board
    const lift = smootherstep(seg(t, T.below[0], T.below[1]));
    cam.setAttribute('transform', `translate(${W / 2 + shx} ${H / 2 + shy}) scale(${sc}) translate(${-cx} ${-cy})`);
    wall.style.transform = `translate(${(shx - (cx - W / 2) * sc * 0.6).toFixed(1)}px, ${(shy - lift * px(40)).toFixed(1)}px)`;

    // ---- main wire: straight → date → sub → (sinks) → torpedo → slack ----
    let m, mLift = 0;
    const pd = seg(t, ...T.date), ps = seg(t, ...T.sub), pk = seg(t, T.deep, T.deep + 1.1), pt = seg(t, ...T.torpedo), pl = seg(t, ...T.slack);
    if (t < T.sub[0]) { const p2 = seg(t, T.date[0] + 0.25, T.date[1] + 0.25); m = morph(straight, date, p2, 0.7, px(10)); mLift = Math.sin(Math.PI * p2); }
    else if (t < T.deep) { m = morph(date, sub1, ps, 0.55, px(14)); mLift = Math.sin(Math.PI * ps); }
    else if (t < T.torpedo[0]) { m = morph(sub1, sub2, smootherstep(pk), 0, 0); }
    else if (t < torUp[0]) { m = morph(sub2, torBig, pt, 0.5, px(16)); mLift = Math.sin(Math.PI * pt); }
    else if (t < T.slack[0]) { const pu = seg(t, ...torUp); m = morph(torBig, torpedo, pu, 0.15, px(10)); mLift = Math.sin(Math.PI * pu); }
    else { m = morph(torpedo, slack, pl, 0.35, px(6)); mLift = 0.5 * Math.sin(Math.PI * pl); }
    // vibration after each depth-charge burst (the wire rings like a spring)
    if (t > T.drops[0] + T.fall && t < T.below[0]) {
      let amp = 0;
      T.drops.forEach((d, i) => { const dt = t - (d + T.fall); if (dt > 0) amp += px(i === 1 ? 7 : 4.5) * Math.exp(-dt * 5) * Math.sin(dt * 2 * Math.PI * 6.5); });
      if (Math.abs(amp) > 0.05) m = m.map(([x, y], i) => [x, y + amp * Math.sin(Math.PI * (i / (m.length - 1)) * 3)]);
    }
    wMain.set(m, { lift: mLift });
    pins.date.forEach(g => (g.style.display = t < T.date[0] + 0.25 ? '' : 'none'));

    // ---- "27" and "OCT": cut from the same straight wire, bent into the date, then stretched into the sea wire ----
    const away = smootherstep(seg(t, T.below[0] + 0.25, T.below[1]));
    {
      const dy = -away * H * 0.45;
      const sL = seg(t, T.sub[0] + 0.1, T.sub[1] + 0.25), sR = seg(t, T.sub[0] + 0.3, T.sub[1] + 0.45);
      const half = (seed, word, seaW, ps, off) => {
        if (t < T.date[0]) return null;
        if (ps <= 0) return morph(seed, word, seg(t, T.date[0] + off, T.date[1] + off), 0.7, px(10));
        return morph(word, seaW, ps, 0.4, px(12)).map(([x, y]) => [x, y + dy]);
      };
      const seedL = d27Seed.map(([x, y]) => [x * 0.25 + straight[0][0] * 0.75, y]);
      const seedR = d27Seed.map(([x, y]) => [straight[0][0] + (x - straight[0][0]) * 0.55 + S.w * 0.2, y]);
      if (away < 1) {
        wSeaL.set(half(seedL, d27, seaL, sL, 0), { lift: Math.sin(Math.PI * (sL > 0 ? sL : seg(t, ...T.date))) });
        wSeaR.set(half(seedR, dOCT, seaR, sR, 0.12), { lift: Math.sin(Math.PI * (sR > 0 ? sR : seg(t, T.date[0] + 0.12, T.date[1] + 0.12))) });
      } else { wSeaL.set(null); wSeaR.set(null); }
      pins.sea.forEach(g => { g.style.display = sR >= 1 && away < 1 ? '' : 'none'; g.setAttribute('transform', `translate(0 ${dy})`); });
    }

    // ---- ships bend up out of the sea wire ----
    wShips.forEach((w, i) => {
      const a = T.ships[0] + i * 0.18, p = seg(t, a, a + (T.ships[1] - T.ships[0]));
      const pf = seg(t, T.below[0], T.below[0] + 0.5);
      if (p <= 0 || away >= 1) return w.set(null);
      const dy = -away * H * 0.45;
      const shp = pf > 0 ? morph(ships[i], shipFlat[i], pf, 0.3) : morph(shipFlat[i], ships[i], p, 0.6, px(5));
      const rock = (Math.PI / 180) * 1.4 * noise1(t * 0.9, i * 5) * (p >= 1 && pf <= 0 ? 1 : 0), c = Math.cos(rock), sn = Math.sin(rock), ox = shipX[i], oy = seaY;
      w.set(shp.map(([x, y]) => [ox + (x - ox) * c - (y - oy) * sn, oy + (x - ox) * sn + (y - oy) * c + dy]), { lift: Math.sin(Math.PI * (pf > 0 ? pf : p)) * 0.8 });
    });

    // ---- depth charges ----
    wCharge.forEach((w, i) => {
      const d = T.drops[i], dt = t - d;
      if (dt < 0 || dt > T.fall + 0.75) return w.set(null);
      const from = [dropFrom[i], seaY - px(4)], to = burstAt[i];
      if (dt < T.fall) {
        const f = dt / T.fall, e = f * f * (1.6 - 0.6 * f); // accelerates, slows a little in water
        const x = from[0] + (to[0] - from[0]) * e, y = from[1] + (to[1] - from[1]) * e;
        w.set(chargeShape.map(([a, b]) => [a + x, b + y]), { lift: 0.3 });
      } else {
        const bt = dt - T.fall, p = smootherstep(clamp(bt / 0.16)), grow = 1 + bt * 0.35;
        const shp = morph(chargeShape, burst[i], p, 0.2, 0).map(([a, b]) => [to[0] + a * grow, to[1] + b * grow]);
        w.set(shp, { lift: 0.6 * (1 - clamp(bt / 0.7)), op: 1 - smootherstep(clamp((bt - 0.3) / 0.45)) });
      }
    });

    // ---- Moscow line ----
    const pm = seg(t, ...T.moscow);
    if (pm > 0 && away < 1) {
      const dy = -away * H * 0.45;
      const n = Math.max(2, Math.round(smootherstep(pm) * N.mos));
      const pc = smootherstep(seg(t, T.cut, T.cut + 0.35));
      const ln = pc > 0 ? morph(mosA, mosCut, pc, 0, 0) : mosA.slice(0, n);
      wMos.set(ln.map(([x, y]) => [x, y + dy]), { lift: pc > 0 ? 0.3 * Math.sin(Math.PI * pc) : 0 });
      wMosFar.set(pc > 0 ? morph(mosA.slice(-N.mos).map(() => mFar), mosFar, Math.min(1, pc * 2), 0).map(([x, y]) => [x, y + dy]) : null);
    } else { wMos.set(null); wMosFar.set(null); }

    // ---- figures: raw coils slide in with the tilt, then each coil stands up into a person (feet first) ----
    wFigs.forEach((w, i) => {
      const enter = smootherstep(seg(t, torUp[0] + 0.1, torUp[1] + 0.05));
      if (enter <= 0) { pins.figs[i].style.display = 'none'; return w.set(null); }
      const dyIn = (1 - enter) * H * 0.5;
      const p = seg(t, T.figs[i], T.figs[i] + T.figDur);
      const shp = morph(coils[i], figs[i], p, 0.75, px(8));
      w.set(shp.map(([x, y]) => [x, y + dyIn]), { lift: Math.sin(Math.PI * p) });
      pins.figs[i].style.display = '';
      pins.figs[i].setAttribute('transform', `translate(0 ${dyIn})`);
    });

    // ---- YES tags ----
    wTags.forEach((w, i) => {
      const a = T.yes[i] - 0.15, p = seg(t, a, a + 0.45);
      if (t < a - 0.25) return w.set(null);
      w.set(morph(tagCoils[i], tags[i], p, 0.6, px(4)), { lift: Math.sin(Math.PI * p), op: smootherstep(seg(t, a - 0.25, a)) });
    });

    // ---- the copper NO, fed out of the open hand ----
    const pn = seg(t, ...T.no);
    wNo.set(pn > 0 ? morph(noSeed, noShape, pn, 0.85, px(10)) : null, { lift: Math.sin(Math.PI * pn) * 1.2 });
    const po = seg(t, T.no[0] + 0.25, T.no[1] + 0.02);
    wO.set(po > 0 ? morph(oSeed, oShape, po, 0.8, px(10)) : null, { lift: Math.sin(Math.PI * po) * 1.2 });

    guideRect.setAttribute('width', (W * smootherstep(seg(t, 0, 0.5))).toFixed(1));
    guides.style.opacity = (0.55 * (1 - seg(t, T.sub[0], T.sub[0] + 0.4))).toFixed(3);

    // ---- pencil notes: written left → right, rubbed out at their end time ----
    for (const n of notes) {
      const w = clamp((t - n.at) / Math.max(0.3, n.wipe + n.len * 0.012));
      const gone = clamp((t - n.end) / 0.3);
      if (w <= 0 || gone >= 1) { n.t.style.display = 'none'; continue; }
      n.t.style.display = '';
      const full = n.len * n.size * 0.62 + 40;
      const left = n.anchor === 'middle' ? n.x - full / 2 : n.anchor === 'end' ? n.x - full : n.x;
      n.r.setAttribute('x', left - 10); n.r.setAttribute('width', (full + 20) * w);
      n.t.style.opacity = 0.92 * (1 - gone);
    }
  }
  return { update };
}
