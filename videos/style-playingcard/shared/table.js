// CARD DECK — the story is dealt, card by card, onto a slate wool cloth (a wardroom table) under one lamp.
// Rules of the table:
//   1. Overhead camera, locked like a copy stand; it only glides and pushes. Light comes from top-left, always.
//   2. Cards only do what real cards do: dealt (fly + spin + land with a short slide), slid, slapped, flipped.
//   3. Every card has thickness (an edge line) and a soft contact shadow that grows when it lifts.
//   4. Every card lands face UP. The single face-DOWN card at the end is the NO.
// Everything is a pure function of global time `tg`. All jitter is seeded per card, never by time.
import { el, clamp } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep, shake } from '/onclack-styles/engine/lib/spring.js';
import { C, IDX, SANS, NOTE, officerFace, subFace, dateFace, cubaFace, shipsFace, chargeFace, moscowFace, torpedoFace, backFace } from './faces.js';

const r1 = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, p) => a + (b - a) * p;
const outCubic = (p) => 1 - Math.pow(1 - clamp(p), 3);
const outBack = (p) => { p = clamp(p); const c = 1.2; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };

export function wordAt(ctx, w, n = 0, fb = 0) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = (ctx.words || []).filter((x) => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start : fb;
}

export function buildTable(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, px = L.px, P = L.portrait;
  const T = (w, n, fb) => wordAt(ctx, w, n, fb);
  const t = {
    oct: T('october', 0, 0.58), sub: T('submarine', 0, 4.3), deep: T('deep', 0, 5.42), cuba: T('cuba', 0, 6.52),
    above: T('above', 0, 7.56), ships: T('ships', 0, 8.63), depth: T('depth', 0, 9.79), charges: T('charges', 0, 10.05),
    moscow: T('moscow', 0, 10.95), silent: T('silent', 0, 11.93), days: T('days', 0, 12.49), on: T('on', 0, 13.67),
    nuclear: T('nuclear', 0, 14.48), torp: T('torpedo', 0, 14.88), fire: T('fire', 0, 15.9), three: T('three', 0, 16.51),
    officers: T('officers', 0, 16.86), agree: T('agree', 0, 17.61), two: T('two', 0, 18.29), yes: T('yes', 0, 18.8),
    third: T('third', 0, 20.25), vas: T('vasili', 0, 20.61), ark: T('arkhipov', 0, 21.12), says: T('says', 0, 21.69),
    no: T('no', 0, 22.03), world: T('world', 0, 23.07), name: T('name', 0, 23.73), forty: T('forty', 0, 24.13),
  };
  const F = 1 / 30;

  /* ---------- geometry per format (world units = screen px when camera is at rest) ---------- */
  const cw = px(P ? 236 : 200), ch = cw * 1.4;
  const BX = P ? 0 : px(2300), BY = P ? px(2300) : 0; // act B (vote table) offset
  const G = P ? {
    deckA: [px(930), px(1700), 10],
    date: [px(285), px(430), -6], cuba: [px(735), px(470), 5],
    ships: [[px(220), px(850), -4], [px(475), px(830), 2], [px(735), px(860), 7]],
    charges: [[px(360), px(1080), -16], [px(610), px(1060), 21]],
    sub: [px(410), px(1330), 3], subDeep: [px(410), px(1385), 2], moscow: [px(770), px(1315), -5],
    torp: [px(540), BY + px(440), 3], torpOut: [px(1500), BY + px(300), 70],
    off: [[px(225), BY + px(1060), -5], [px(517), BY + px(1050), 1], [px(805), BY + px(1065), 5]],
    offYes: [[px(228), BY + px(775), -3], [px(522), BY + px(765), 2]],
    entry: [px(1350), BY + px(1900), 30],
  } : {
    deckA: [px(620), px(610), 9],
    date: [px(360), px(320), -6], cuba: [px(1530), px(430), 5],
    ships: [[px(735), px(250), -4], [px(960), px(232), 2], [px(1185), px(258), 6]],
    charges: [[px(860), px(540), -16], [px(1075), px(520), 21]],
    sub: [px(960), px(800), 3], subDeep: [px(960), px(850), 2], moscow: [px(370), px(790), -5],
    torp: [BX + px(960), px(228), 90], torpOut: [BX + px(2300), px(140), 70],
    off: [[BX + px(560), px(735), -5], [BX + px(960), px(725), 1], [BX + px(1360), px(738), 4]],
    offYes: [[BX + px(800), px(515), -2], [BX + px(1065), px(505), 2]],
    entry: [BX + px(2200), px(1500), 30],
  };

  /* ---------- camera keys: [time, cx, cy, zoom] ---------- */
  const cam = P ? [
    [0, px(300), px(455), 2.05], [3.5, px(295), px(445), 2.14], [4.1, px(520), px(900), 1.12], [6.0, px(540), px(920), 1.08],
    [6.9, px(540), px(960), 1.0], [10.4, px(540), px(960), 1.0], [11.1, px(620), px(1170), 1.22], [13.1, px(640), px(1190), 1.26],
    [14.15, px(540), BY + px(440), 2.2], [15.75, px(540), BY + px(445), 2.28], [16.5, px(540), BY + px(880), 1.0], [20.0, px(540), BY + px(900), 1.02], [22.6, px(545), BY + px(910), 1.04], [25.6, px(700), BY + px(1120), 1.3],
  ] : [
    [0, px(500), px(420), 1.6], [3.5, px(520), px(430), 1.66], [4.1, px(960), px(640), 1.25], [6.0, px(1000), px(620), 1.2],
    [6.9, px(960), px(540), 1.0], [10.4, px(960), px(540), 1.0], [11.1, px(620), px(680), 1.3], [13.1, px(600), px(690), 1.34],
    [14.15, BX + px(960), px(236), 1.9], [15.75, BX + px(960), px(240), 1.97], [16.5, BX + px(960), px(540), 1.0], [20.0, BX + px(1010), px(545), 1.02], [22.6, BX + px(1050), px(550), 1.04], [25.6, BX + px(1330), px(770), 1.45],
  ];
  const camAt = (tg) => {
    let k = 0;
    while (k < cam.length - 1 && tg >= cam[k + 1][0]) k++;
    if (k >= cam.length - 1) return cam[cam.length - 1].slice(1);
    const a = cam[k], b = cam[k + 1];
    // keys come in pairs: a move happens between consecutive keys; long gaps are slow creeps
    const p = smootherstep((tg - a[0]) / (b[0] - a[0]));
    return [lerp(a[1], b[1], p), lerp(a[2], b[2], p), lerp(a[3], b[3], p)];
  };

  /* ---------- DOM ---------- */
  root.style.background = C.felt;
  const world = el('div', { 'data-name': 'Camera (table)', style: { position: 'absolute', left: 0, top: 0, width: '1px', height: '1px', transformOrigin: '0 0' } }, root);
  el('div', { 'data-name': 'Wool table cloth', style: {
    position: 'absolute', left: -W + 'px', top: -H + 'px', width: (W * 3 + BX * 1.2) + 'px', height: (H * 3 + BY * 1.2) + 'px',
    backgroundColor: C.felt, backgroundImage: `url(${ctx.asset('assets/felt-grain.png')})`, backgroundSize: px(256) + 'px',
  } }, world);
  // a sewn seam of the cloth, and a faint pressed fold — the cloth has been used
    el('div', { 'data-name': 'Cloth fold', style: { position: 'absolute', left: (P ? -W : BX - px(260)) + 'px', top: (P ? BY - px(260) : -H) + 'px',
    width: P ? W * 3 + 'px' : px(40) + 'px', height: P ? px(40) + 'px' : H * 3 + 'px',
    background: P ? 'linear-gradient(180deg, transparent, rgba(255,255,255,0.05) 45%, rgba(0,0,0,0.12) 55%, transparent)'
      : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 45%, rgba(0,0,0,0.12) 55%, transparent)' } }, world);

  const layerCards = el('div', { style: { position: 'absolute', left: 0, top: 0 } }, world);
  const radius = cw * 0.068;
  const BACK = backFace();

  /* ---------- chalk captions on the cloth ---------- */
  const chalk = (name, html, x, y, size, opts = {}) => {
    const d = el('div', { 'data-name': name, style: {
      position: 'absolute', left: x + 'px', top: y + 'px', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap',
      fontFamily: opts.font || SANS, fontWeight: opts.weight || 800, fontSize: size + 'px', letterSpacing: (opts.ls ?? 0.12) + 'em',
      color: opts.color || C.chalk, textAlign: 'center', lineHeight: 1.05, opacity: 0, textTransform: opts.upper === false ? 'none' : 'uppercase',
    } }, world);
    d.innerHTML = html;
    return d;
  };

  /* ---------- the deck (act A only) ---------- */
  const deckEls = [];
  const deckN = 14;
  const deckWrap = el('div', { 'data-name': 'Deck', style: { position: 'absolute', left: 0, top: 0 } }, layerCards);
  for (let i = 0; i < deckN; i++) {
    const d = el('div', { style: { position: 'absolute', width: cw + 'px', height: ch + 'px', borderRadius: radius + 'px', overflow: 'hidden',
      boxShadow: i === 0 ? `${px(8)}px ${px(10)}px ${px(16)}px rgba(8,10,14,0.55)` : `0 ${px(1.2)}px 0 ${C.edge}`, background: C.stock } }, deckWrap);
    d.innerHTML = BACK;
    deckEls.push(d);
  }

  /* ---------- cards ---------- */
  const cards = [];
  let zc = 10;
  function card(name, faceSvg, deal, extra = {}) {
    const box = el('div', { 'data-name': name, style: { position: 'absolute', left: 0, top: 0, zIndex: String(zc++) } }, layerCards);
    const shadow = el('div', { style: { position: 'absolute', left: 0, top: 0, width: cw + 'px', height: ch + 'px', borderRadius: radius + 'px', background: 'rgba(3,5,8,0.9)', transformOrigin: '50% 50%' } }, box);
    const body = el('div', { style: { position: 'absolute', left: 0, top: 0, width: cw + 'px', height: ch + 'px', borderRadius: radius + 'px', transformOrigin: '50% 50%',
      boxShadow: `0 ${px(1.4)}px 0 ${C.edge}, 0 ${px(2.4)}px 0 #A79976, ${px(2)}px ${px(4)}px ${px(5)}px rgba(4,6,10,0.45)` } }, box);
    const front = el('div', { style: { position: 'absolute', inset: 0, borderRadius: radius + 'px', overflow: 'hidden' } }, body);
    front.innerHTML = faceSvg;
    const back = el('div', { style: { position: 'absolute', inset: 0, borderRadius: radius + 'px', overflow: 'hidden', display: 'none' } }, body);
    back.innerHTML = BACK;
    // lamp sheen: card stock catches the light from top-left (static gradient, brighter when lifted)
    const sheen = el('div', { style: { position: 'absolute', inset: 0, borderRadius: radius + 'px', pointerEvents: 'none',
      background: 'linear-gradient(135deg, rgba(255,250,235,0.22), rgba(255,250,235,0) 45%, rgba(20,16,10,0.10))' } }, body);
    const shade = el('div', { style: { position: 'absolute', inset: 0, borderRadius: radius + 'px', background: '#0b0b0d', opacity: 0 } }, body);
    const c = { name, box, shadow, body, front, back, sheen, shade, deal, moves: extra.moves || [], flips: extra.flips || [], hits: extra.hits || [], seed: zc * 7.1, drop: extra.drop, k: extra.k || 1, last: null };
    cards.push(c);
    return c;
  }

  // deal: { t: landing time, from: [x,y,r], to: [x,y,r], dur }
  const dealFromA = (land, to, dur = 0.42) => ({ t: land - dur, dur, from: G.deckA, to, faceUp: true });
  const dealFromB = (land, to, dur = 0.5) => ({ t: land - dur, dur, from: G.entry, to, faceUp: true });

  const S1 = 1.0; // seed base
  const KB = P ? 1 : 1.2; // the vote table is shot closer: bigger cards in 16:9
  const cDate = card('Date card (27 Oct 1962)', dateFace(S1 + 1), { ...dealFromA(t.oct + 0.25 - 2 * F, G.date, 0.5), from: [G.date[0] + px(900), G.date[1] + px(420), 40] });
  const cSub = card('B-59 court card', subFace(S1 + 2), dealFromA(t.sub - 2 * F, G.sub), { moves: [{ t: t.deep - 0.05, dur: 0.7, to: G.subDeep }] });
  const cCuba = card('Cuba card', cubaFace(S1 + 3), dealFromA(t.cuba - 2 * F, G.cuba));
  const cShips = G.ships.map((p, i) => card(`US ships card ${i + 1}`, shipsFace(S1 + 4 + i, i === 1 ? 4 : 3), dealFromA(t.ships - 0.62 + i * 0.3, p, 0.4)));
  // depth charges are not dealt: they are dropped from above and slapped down
  const cCh = G.charges.map((p, i) => card(`Practice depth charge ${i + 1}`, chargeFace(S1 + 8 + i),
    { t: (i ? t.charges : t.depth) - 0.28, dur: 0.28, from: [p[0] + px(30), p[1] - px(60), p[2] - 25], to: p, faceUp: true }, { drop: true }));
  const cMoscow = card('Moscow card (silent)', moscowFace(S1 + 11), dealFromA(t.moscow - 2 * F, G.moscow));
  const hitA = [t.depth + 0.0, t.charges + 0.0];

  // act B
  const cTorp = card('Nuclear torpedo card', torpedoFace(S1 + 12), dealFromB(t.torp - 2 * F, G.torp, 0.55), { k: KB, moves: [{ t: t.no + 0.55, dur: 0.75, to: G.torpOut }] });
  const cOff = G.off.map((p, i) => card(`Officer ${['I', 'II', 'III'][i]} court card`, officerFace(i, S1 + 20),
    dealFromB(t.three - 0.05 + i * 0.27, p, 0.45), { k: KB }));
  cOff[0].moves.push({ t: t.two - 0.12, dur: 0.42, to: G.offYes[0] }, { t: t.no + 0.75, dur: 0.6, to: [G.off[0][0], G.off[0][1], G.off[0][2] - 3] });
  cOff[1].moves.push({ t: t.yes - 0.28, dur: 0.42, to: G.offYes[1] }, { t: t.no + 0.85, dur: 0.6, to: [G.off[1][0], G.off[1][1], G.off[1][2] + 2] });
  cOff[2].moves.push({ t: t.third - 0.05, dur: 0.5, to: [G.off[2][0], G.off[2][1] - px(28), 0], lift: 0.25 });
  cOff[2].flips.push(t.says + 0.0); // flip lands face-down on "no"

  /* ---------- captions ---------- */
  const capSize = px(P ? 40 : 34);
  const capRule = chalk('Rule caption', 'To fire it,<br>all three must agree', P ? px(540) : BX + px(560), P ? BY + px(205) : px(250), capSize, { ls: 0.1 });
  if (!P) capRule.style.textAlign = 'right', capRule.style.transform = 'translate(-100%, -50%)';
  if (!P) capRule.style.left = BX + px(770) + 'px';
  if (P) capRule.innerHTML = 'To fire it, all three must agree';
  const tallyX = P ? px(800) : BX + px(1280), tallyY = P ? BY + px(470) : px(250);
  const tally = chalk('Vote tally', '0 / 3', tallyX, tallyY, px(P ? 64 : 62), { font: IDX, weight: 400, ls: 0.02 });
  const tallyLbl = chalk('Vote tally label', 'agree', tallyX, tallyY + px(P ? 54 : 52), px(P ? 30 : 26), { ls: 0.25 });
  const roleNames = ['Captain', 'Political officer', 'Chief of staff'];
  const roles = G.off.map((p, i) => chalk(`Role label ${i + 1}`, roleNames[i], p[0], p[1], px(P ? 30 : 27), { ls: 0.16 }));

  // name label: a strip of card stock laid on the cloth under the face-down card
  const nameX = P ? px(560) : G.off[2][0], nameY = P ? G.off[2][1] - px(28) + ch / 2 + px(118) : G.off[2][1] - px(28) + ch * KB / 2 + px(72);
  const label = el('div', { 'data-name': 'Name label (card stock strip)', style: {
    position: 'absolute', left: nameX + 'px', top: nameY + 'px', transform: 'translate(-50%,-50%)', padding: `${px(12)}px ${px(26)}px ${px(13)}px`,
    background: C.stock, borderRadius: px(5) + 'px', boxShadow: `${px(4)}px ${px(6)}px ${px(10)}px rgba(6,8,12,0.5), 0 ${px(1.2)}px 0 ${C.edge}`,
    textAlign: 'center', whiteSpace: 'nowrap', opacity: 0, zIndex: '200',
  } }, layerCards);
  const nm = el('div', { style: { fontFamily: IDX, fontSize: px(P ? 50 : 44) + 'px', color: C.ink, letterSpacing: '0.02em', lineHeight: 1.05 } }, label);
  nm.innerHTML = `Vasili <span style="color:${C.red}">Arkhipov</span>`;
  const nm2 = el('div', { style: { fontFamily: NOTE, fontStyle: 'italic', fontWeight: 600, fontSize: px(P ? 28 : 24) + 'px', color: C.blue, marginTop: px(6) + 'px', overflow: 'hidden', height: 0 } }, label);
  nm2.textContent = 'his vote became widely known around 2002';

  /* ---------- screen-space light ---------- */
  el('div', { 'data-name': 'Lamp falloff', style: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: '50',
    background: `radial-gradient(ellipse ${P ? '95% 70%' : '75% 85%'} at 38% 34%, rgba(255,236,200,0.10) 0%, rgba(0,0,0,0) 45%, rgba(4,6,10,0.55) 100%)` } }, root);

  /* ---------- card pose at time tg ---------- */
  function pose(c, tg) {
    const d = c.deal;
    if (tg < d.t) return null;
    let p = clamp((tg - d.t) / d.dur);
    let x, y, r, lift, flipQ = -1, faceUp = true;
    if (c.drop) {
      // falls from above: big → table, hard landing, tiny bounce
      const e = p * p;
      x = lerp(d.from[0], d.to[0], e); y = lerp(d.from[1], d.to[1], e); r = lerp(d.from[2], d.to[2], e);
      lift = (1 - e) * 2.2;
    } else {
      const e = outCubic(p);
      x = lerp(d.from[0], d.to[0], e); y = lerp(d.from[1], d.to[1], e);
      r = lerp(d.from[2], d.to[2], e) - 14 * Math.sin(Math.PI * p) * (1 - p);
      lift = Math.sin(Math.PI * Math.min(1, p * 1.15)) * 0.9;
      // the card flips over in the air while it travels (dealt from a face-down deck)
      if (p < 1) flipQ = clamp(p * 1.25);
      // short slide after landing
      const slide = clamp((tg - d.t - d.dur) / 0.18);
      if (slide > 0 && slide < 1) { const s = (1 - outCubic(slide)) * px(6); x += s * Math.cos(Math.atan2(d.to[1] - d.from[1], d.to[0] - d.from[0])); y += s * Math.sin(Math.atan2(d.to[1] - d.from[1], d.to[0] - d.from[0])); }
    }
    for (const m of c.moves) {
      if (tg <= m.t) break;
      const q = clamp((tg - m.t) / m.dur), e = smootherstep(q);
      x = lerp(x, m.to[0], e); y = lerp(y, m.to[1], e); r = lerp(r, m.to[2], e);
      lift += Math.sin(Math.PI * q) * (m.lift ?? 0.35) + (m.lift && q >= 1 ? 0 : 0);
    }
    for (const f of c.flips) {
      if (tg <= f) continue;
      const q = clamp((tg - f) / 0.34);
      if (q < 1) { flipQ = q; lift += Math.sin(Math.PI * q) * 0.75; }
      faceUp = !faceUp;
      if (q < 1 && q < 0.5) faceUp = !faceUp; // before half-way the old face still shows
    }
    return { x, y, r, lift, flipQ, faceUp, dealing: !c.drop && p < 1 };
  }

  function update(tg) {
    // camera
    const [cx, cy, z] = camAt(tg);
    const hitShake = hitA.reduce((s, h) => s + shake(tg, h, { amp: px(5), decay: 0.3 }), 0);
    world.style.transform = `translate(${W / 2 + hitShake * 0.6}px, ${H / 2 + hitShake}px) scale(${z}) translate(${-cx}px, ${-cy}px)`;

    // deck shrinks as cards leave it
    const dealtA = [cDate, cSub, cCuba, ...cShips, cMoscow].filter((c) => tg >= c.deal.t).length;
    const left = deckN - dealtA;
    deckEls.forEach((d, i) => {
      d.style.display = i < left && tg <= 14.4 ? 'block' : 'none';
      const off = (left - 1 - i) * px(1.3);
      d.style.transform = `translate(${G.deckA[0] - cw / 2 - off * 0.4}px, ${G.deckA[1] - ch / 2 - off}px) rotate(${G.deckA[2] + (r1(i) - 0.5) * 1.6}deg)`;
      d.style.zIndex = String(i);
    });

    for (const c of cards) {
      const actA = cards.indexOf(c) < cards.indexOf(cTorp);
      const s = (actA && tg > 14.4) ? null : pose(c, tg);
      if (!s) { c.box.style.display = 'none'; continue; }
      c.box.style.display = 'block';
      let { x, y, r, lift, flipQ, faceUp } = s;
      // depth-charge hits make every card already on the table jump a little
      for (const h of hitA) {
        const dt = tg - h;
        if (dt > 0 && dt < 0.35 && c !== cCh[1] && tg > c.deal.t + c.deal.dur) {
          const k = Math.sin(dt * 40) * Math.exp(-dt * 12);
          x += k * px(4) * (r1(c.seed) - 0.5) * 2; y -= Math.abs(k) * px(3); r += k * 1.6 * (r1(c.seed + 1) - 0.5);
          lift += Math.abs(k) * 0.12;
        }
      }
      let sx = 1;
      if (flipQ >= 0 && flipQ < 1) {
        sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * flipQ)));
        if (s.dealing) faceUp = flipQ >= 0.5; // dealt: back first, face after half-way
      }
      const sc = (1 + lift * 0.075) * c.k;
      c.last = { x, y };
      c.front.style.display = faceUp ? 'block' : 'none';
      c.back.style.display = faceUp ? 'none' : 'block';
      c.shade.style.opacity = ((1 - sx) * 0.32).toFixed(3);
      c.body.style.transform = `translate(${x - cw / 2}px, ${y - ch / 2}px) rotate(${r}deg) scale(${(sc * sx).toFixed(4)}, ${sc.toFixed(4)})`;
      const so = px(10) + lift * px(22);
      c.shadow.style.transform = `translate(${x - cw / 2 + so * 0.8}px, ${y - ch / 2 + so}px) rotate(${r}deg) scale(${(sc * sx * (1 + lift * 0.03)).toFixed(4)}, ${(sc * (1 + lift * 0.03)).toFixed(4)})`;
      c.shadow.style.filter = `blur(${(px(7) + lift * px(11)).toFixed(1)}px)`;
      c.shadow.style.opacity = clamp(0.72 - lift * 0.18, 0.3, 0.72).toFixed(3);
      c.sheen.style.opacity = (0.8 + lift * 0.25).toFixed(3);
      // lifted / travelling cards ride above the others
      c.box.style.zIndex = String((lift > 0.05 ? 100 : 10) + cards.indexOf(c));
    }

    // captions
    const fade = (a, d = 0.3) => clamp((tg - a) / d);
    capRule.style.opacity = (fade(t.fire - 0.1) * (1 - fade(t.no + 0.5, 0.5))).toFixed(3);
    const votes = (tg >= t.two + 0.25 ? 1 : 0) + (tg >= t.yes + 0.1 ? 1 : 0);
    tally.textContent = `${votes} / 3`;
    tally.style.opacity = (fade(t.agree - 0.25) * (1 - fade(t.no + 0.5, 0.5))).toFixed(3);
    tallyLbl.style.opacity = tally.style.opacity;
    // the tally number gives a small knock when it changes
    const knock = Math.max(0, 1 - (tg - (votes === 2 ? t.yes + 0.1 : t.two + 0.25)) / 0.25);
    tally.style.transform = `translate(-50%, -50%) scale(${1 + (votes ? knock * 0.12 : 0)})`;
    roles.forEach((d, i) => {
      const a = cOff[i].deal.t + cOff[i].deal.dur + 0.1;
      let o = fade(a) * (i === 2 ? 1 : 1 - fade(t.no + 0.7, 0.35));
      if (i === 2) o *= 1 - fade(t.vas - 0.1, 0.25); // his role makes way for his name
      d.style.opacity = o.toFixed(3);
    });
    // role labels ride under their cards; a voted card's label gets an ochre YES
    roles.forEach((d, i) => {
      const lc = cOff[i].last; if (!lc) return;
      d.style.left = lc.x + 'px'; d.style.top = (lc.y + ch * KB / 2 + px(P ? 34 : 30)) + 'px';
      d.style.transform = 'translate(-50%, 0) translate(0, -' + px(P ? 18 : 16) + 'px)';
      const voted = i < 2 && tg >= (i ? t.yes + 0.1 : t.two + 0.25) && tg < t.no + 0.75;
      const html = roleNames[i] + (voted ? (P ? `<br><span style="color:${C.ochre}">yes</span>` : ` <span style="color:${C.ochre}">· yes</span>`) : '');
      if (d.innerHTML !== html) d.innerHTML = html;
    });
    // name label slides in under his card, second line opens at "forty years later"
    const lp = outBack((tg - (t.vas - 0.12)) / 0.45);
    label.style.opacity = clamp((tg - (t.vas - 0.12)) / 0.15).toFixed(3);
    label.style.transform = `translate(-50%, -50%) translate(0, ${(1 - lp) * px(26)}px) rotate(${-1.2}deg)`;
    const op = smootherstep((tg - (t.forty - 0.1)) / 0.5);
    nm2.style.height = (op * px(P ? 36 : 31)) + 'px';
    nm2.style.opacity = op.toFixed(3);
  }

  return { update, t };
}
