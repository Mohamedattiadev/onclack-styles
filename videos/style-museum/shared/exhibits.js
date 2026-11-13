// DISPLAY CASE — the four vitrines (built per scene; a case can appear dim in a neighbouring scene for continuity).
import { svg } from '/onclack-styles/engine/lib/anim.js';
import { submarine, chart, gauge, headset, photo, torpedo, card, slotTag, acrylic } from './objects.js';

const pick = (G, l, p) => (G.P ? p : l);

/** Exhibit 1 — model submarine in front of the chart. lights: { sub: keys, chart: keys } */
export function case1(G, cx, geoData, lights = {}) {
  const u = G.u, P = G.P;
  const subX = pick(G, -150, 0), chartX = pick(G, 180, 0);
  const chW = pick(G, 420, 480), chH = pick(G, 268, 340), lift = pick(G, 70, 200);
  const subLen = pick(G, 520, 600);
  const C = G.addCase({
    cx, w: pick(G, 860, 800), name: 'Case 1 · Model submarine + chart',
    label: { num: 'EXHIBIT 1  ·  1962.27.01', title: 'A submarine, hiding', align: P ? 'center' : 'right', w: pick(G, u(440), u(600)),
      lines: ['Model, B-59 (Project 641 type), made', 'for this film. Chart: modern outline;', 'pin marks the approx. area, 27 Oct.'], name: '1 Label' },
    spots: [
      { x: subX, y: pick(G, 105, 115), f: 0.3, r: pick(G, 330, 380), ry: 0.8, keys: lights.sub ?? [], name: 'sub' },
      { x: chartX, y: lift + chH * 0.5, f: 0.82, r: pick(G, 250, 290), ry: 0.85, keys: lights.chart ?? [], motes: 12, coneO: 0.7, weight: 0.6 },
    ],
  });
  const gc = C.place(chartX, 0.82, '1B Chart (Natural Earth, PD)');
  C.chart = chart(G, gc, chW, chH, geoData, lift);
  const gs = C.place(subX, 0.3, '1A Model submarine B-59 (RC)');
  submarine(G, gs, subLen);
  return C;
}

/** Exhibit 2 — depth gauge, loose headset, framed photograph. lights: { gauge, headset } */
export function case2(G, cx, photoHref, lights = {}, kick) {
  const P = G.P;
  const C = G.addCase({
    cx, w: pick(G, 820, 800), name: 'Case 2 · Depth gauge + headset + photo',
    label: { num: 'EXHIBIT 2  ·  1962.27.02', title: 'Pressure from above', align: P ? 'center' : 'right', w: pick(G, G.u(440), G.u(600)),
      lines: ['Depth gauge (similar type); headset.', 'Photo: B-59 surfaced, 28–29 Oct. 1962,', 'US Navy / NARA, public domain.'], name: '2 Label' },
    spots: [
      { x: pick(G, -170, -190), y: pick(G, 150, 160), f: 0.45, r: pick(G, 300, 320), keys: lights.gauge ?? [], kick },
      { x: pick(G, 150, 160), y: pick(G, 90, 100), f: 0.5, r: pick(G, 270, 290), ry: 1.1, keys: lights.headset ?? [], motes: 14, coneO: 0.75 },
    ],
  });
  const gp = C.place(pick(G, 190, 200), 0.85, '2C Photograph B-59 (EV)');
  photo(G, gp, pick(G, 210, 220), pick(G, 172, 180), photoHref);
  const gg = C.place(pick(G, -170, -190), 0.45, '2A Depth gauge (RC)');
  const gauge1 = gauge(G, gg, pick(G, 105, 115));
  const gh = C.place(pick(G, 115, 120), 0.15, '2B Radio headset, plug loose (RC)');
  headset(G, gh, pick(G, 190, 200));
  C.gauge = gauge1;
  return C;
}

/** Exhibit 3 — torpedo + approval cards I, II and the empty slot III. lights: { torpedo, cards } */
export function case3(G, cx, lights = {}) {
  const P = G.P;
  const tx = pick(G, -450, -480), cxs = P ? [380, 620, 860] : [360, 545, 730];
  const cw = pick(G, 150, 200), ch = pick(G, 205, 270);
  const C = G.addCase({
    cx, w: pick(G, 1700, 2000), name: 'Case 3 · Torpedo + approval cards',
    label: { num: 'EXHIBIT 3  ·  1962.27.03', title: 'Three must agree', align: 'right', w: pick(G, G.u(440), G.u(600)),
      lines: ['Torpedo with nuclear warhead: model,', 'not to scale. Cards are interpretive;', 'accounts come from later testimony.'], name: '3 Label' },
    spots: [
      { x: tx, y: pick(G, 62, 66), f: 0.4, r: pick(G, 520, 560), ry: 0.42, coneW: 0.45, keys: lights.torpedo ?? [], motes: 30 },
      { x: cxs[0], y: ch * 0.55, f: 0.45, r: pick(G, 150, 190), keys: lights.cards ?? [], motes: 10, coneO: 0.8 },
      { x: cxs[1], y: ch * 0.55, f: 0.45, r: pick(G, 150, 190), keys: lights.cards ?? [], motes: 10, coneO: 0.8 },
    ],
  });
  const gt = C.place(tx, 0.4, '3A Torpedo model (RC)');
  torpedo(G, gt, pick(G, 800, 900));
  const roles = [['I', 'Commander', 'V. G. SAVITSKY'], ['II', 'Political officer', 'I. S. MASLENNIKOV']];
  roles.forEach(([n, r, nm], i) => { const g = C.place(cxs[i], 0.45, `3B Card ${n} (VO)`, cw * 0.75); card(G, g, cw, ch, { numeral: n, role: r, nameLine: nm, stamp: 'YES' }); });
  const g3 = C.place(cxs[2], 0.45, '3C Empty slot III', cw * 0.75);
  slotTag(G, g3, cw, ['CARD III', 'SHOWN ALONE', 'IN THE NEXT ROOM']);
  return C;
}

/** Exhibit 3, card III — alone in a tall case. lights: { main, pin } */
export function case4(G, cx, lights = {}) {
  const P = G.P;
  const cw = pick(G, 230, 300), ch = pick(G, 310, 400), riser = pick(G, 60, 80);
  const stampH = riser + ch * 0.21 + G.u(6);
  const C = G.addCase({
    cx, w: pick(G, 600, 640), ph: pick(G, 420, 380), gh: pick(G, 430, 520), name: 'Case 4 · Card III alone',
    label: { num: 'EXHIBIT 3  ·  CARD III  ·  1962.27.03c', title: ['Exhibit 3:', 'the vote that failed'], align: 'center', w: pick(G, G.u(500), G.u(580)),
      titleSize: pick(G, G.u(42), G.u(50)),
      lines: ['Vasili A. Arkhipov, chief of staff', 'of the submarine brigade. Accounts', 'of the vote differ in detail.'], name: '4 Label' },
    spots: [
      { x: 0, y: riser + ch * 0.8, f: 0.5, r: pick(G, 250, 310), ry: 1.0, keys: lights.main ?? [], motes: 30 },
      { x: 0, y: stampH, f: 0.5, r: pick(G, 120, 150), ry: 0.7, keys: lights.pin ?? [], motes: 8, coneO: 0.9, coneW: 0.7 },
    ],
  });
  const g = C.place(0, 0.5, '4A Card III (VO)');
  acrylic(G, g, 0, cw * 1.1, riser);
  const cg = svg('g', { transform: `translate(0 ${-riser})` }, g);
  const c = card(G, cg, cw, ch, { numeral: 'III', role: 'Chief of staff', nameLine: 'V. A. ARKHIPOV', stamp: 'NO' });
  C.card = { cw, ch, riser, stampH, c };
  return C;
}
