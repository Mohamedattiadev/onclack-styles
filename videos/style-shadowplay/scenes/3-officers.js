// 3 · WS INTERIOR — "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// Vermillion field = the closed, hot hull. Floor plan: two officers left (facing right), the third alone on the right
// (facing left) — the empty space between them is the decision. Torpedo on its cradle in the back plane (hazed).
// Puppets are raised into the stage from below the deck flat (rod puppets), then two of them nod: "yes".
import { svg, clamp, lerp, progress, noise1, creep, rand } from '/onclack-styles/engine/lib/anim.js';
import { C, mix, stage, plate, railIn, beat, lag, span, tok, wordAt, shape, officer, TORPEDO } from '../shared/kit.js';

export default function (root, ctx) {
  const L = ctx.layout, W = ctx.width, H = ctx.height, F = C.vermillion, P = L.portrait;
  const S = stage(root, ctx, { field: F, name: '3 Stage (vermillion)' });

  const cutFar = S.cut('far', { rough: L.px(2), shadow: L.px(3), alpha: 0.14, seed: 21 });
  const cutMid = S.cut('mid', { rough: L.px(2.2), shadow: L.px(6), alpha: 0.22, seed: 23 });
  const cutFig = S.cut('fig', { rough: L.px(1.4), shadow: L.px(8), alpha: 0.28, seed: 25 });
  const cutNear = S.cut('near', { rough: L.px(3.2), shadow: L.px(10), alpha: 0.3, seed: 27 });

  const deck = H * L.pick({ landscape: 0.86, portrait: 0.74 });

  // Far (0.3): hull frames — ribs of the pressure hull, hazed deep into the field. Spacing varies a little (hand-set).
  const pFar = S.plane(0.3, '3 Hull frames (far)');
  const gFar = svg('g', { filter: cutFar }, pFar);
  const nR = P ? 4 : 6;
  for (let i = 0; i < nR; i++) {
    const x = W * (0.06 + (0.88 * i) / (nR - 1)) + (rand(i * 4.7) - 0.5) * L.px(40), w = L.px(26 + rand(i * 2.1) * 8);
    svg('path', { d: `M${x},${H * 1.1} L${x},${H * 0.2} Q${x + w * 0.5},${H * 0.06} ${x + w * 3},${-H * (P ? 0.35 : 0.05)} L${x + w * 4},${-H * (P ? 0.35 : 0.05)} Q${x + w * 1.4},${H * 0.12} ${x + w},${H * 0.22} L${x + w},${H * 1.1} Z`, fill: mix(C.ink, F, 0.72) }, gFar);
  }
  // Mid (0.6): the torpedo rack — a spare torpedo high, the weapon on its cradle.
  const pMid = S.plane(0.8, '3 Torpedo rack (mid)');
  const torW = W * L.pick({ landscape: 0.34, portrait: 0.8 });
  const spare = shape(pMid, TORPEDO, { fill: mix(C.ink, F, 0.7), filter: cutFar, w: torW * 0.7, field: mix(C.ink, F, 0.7), name: '3 Spare torpedo (rack, hazed)' });
  spare.setAttribute('transform', `translate(${W * L.pick({ landscape: 0.5, portrait: 0.4 })} ${H * L.pick({ landscape: 0.17, portrait: 0.215 })})`);
  const torHolder = svg('g', {}, pMid);
  const tor = shape(torHolder, TORPEDO, { fill: mix(C.ink, F, 0.18), filter: cutMid, w: torW, field: F, name: '3 T-5 nuclear torpedo (generic outline)' });
  const torX = W * L.pick({ landscape: 0.4, portrait: 0.1 }), torY = H * L.pick({ landscape: 0.44, portrait: 0.25 });

  // Subject (1): three officers (generic figures, not portraits).
  const pFig = S.plane(1, '3 Officers');
  const figH = H * L.pick({ landscape: 0.6, portrait: 0.36 });
  const sc = figH / 875;
  const xs = L.pick({ landscape: [0.14, 0.33, 0.82], portrait: [0.14, 0.43, 0.8] }).map(f => W * f);
  const names = ['3 Officer 1 — captain (generic figure)', '3 Officer 2 — political officer (generic figure)', '3 Officer 3 — Arkhipov (generic figure)'];
  const figs = xs.map((x, i) => {
    const holder = svg('g', {}, pFig);
    const o = officer(holder, { filter: cutFig, name: names[i], stocky: [1.08, 0.96, 1][i], cap: i !== 1, posture: [1, -0.6, 0][i] });
    return { holder, o, x, dir: i < 2 ? 1 : -1 };
  });
  // Near (1.4): deck flat (ink) the puppets rise out of, and the overhead pipe run with flanges.
  const pNear = S.plane(1.4, '3 Deck + pipes (near)');
  const gN = svg('g', { filter: cutNear }, pNear);
  const dk = [];
  for (let i = 0; i <= 26; i++) dk.push(`${(-W * 0.3 + (W * 1.6 * i) / 26).toFixed(1)},${(deck + (rand(i * 3.9) - 0.5) * L.px(6)).toFixed(1)}`);
  svg('path', { d: `M${dk.join('L')}L${W * 1.3},${H * 1.5}L${-W * 0.3},${H * 1.5}Z`, fill: C.ink }, gN);
  const py = H * L.pick({ landscape: 0.05, portrait: 0.06 }), pr = L.px(15);
  if (!P) { // the overhead pipe run (landscape only: in 9:16 the camera crane would drag it through the torpedo)
    svg('rect', { x: -W * 0.3, y: py - pr, width: W * 1.6, height: pr * 2, fill: C.ink }, gN);
    for (let i = 0; i < 7; i++) { const x = W * (0.04 + i * 0.16) + rand(i * 8.3) * L.px(30); svg('rect', { x, y: py - pr * 1.6, width: L.px(16), height: pr * 3.2, fill: C.ink }, gN); }
  }

  // Voice timing.
  const tNuc = wordAt(ctx, 'nuclear', 0, 1.16), tTor = wordAt(ctx, 'torpedo.', 0, 1.56);
  const tThree = wordAt(ctx, 'three', 0, 3.19), tOff = wordAt(ctx, 'officers', 0, 3.54), tAgree = wordAt(ctx, 'agree.', 0, 4.29);
  const tTwo = wordAt(ctx, 'Two', 0, 4.97), tYes = wordAt(ctx, 'yes.', 0, 5.48);
  ctx.sfx('cloth-jacket-01', tThree - 0.1, { volume: 0.25 });

  // Type.
  const sz = L.pick({ landscape: 30, portrait: 30 });
  const kicker = plate(S.type, L, { text: 'On board B-59', size: sz, ground: C.paper, color: C.ink, name: '3 Kicker', seed: 31 });
  const torLbl = plate(S.type, L, { text: 'T-5 nuclear torpedo', size: sz, name: '3 Torpedo label', seed: 33 });
  const roles = [['Savitsky', 'captain'], ['Maslennikov', 'political officer'], ['Arkhipov', 'chief of staff']];
  const lbl = roles.map(([n, r], i) => plate(S.type, L, { text: `${n}\n${r}`, size: L.pick({ landscape: 26, portrait: 24 }), ground: C.paper, color: C.ink, name: `3 Role ${i + 1}`, seed: 40 + i, track: 0.06 }));
  const yes = [0, 1].map(i => plate(S.type, L, { text: 'yes', font: 'title', italic: true, size: L.pick({ landscape: 50, portrait: 48 }), name: `3 Yes ${i + 1}`, seed: 50 + i, padX: 0.36, padY: 0.12 }));
  const credit = plate(S.type, L, { text: 'Figures staged — not portraits', size: L.pick({ landscape: 22, portrait: 24 }), ground: C.ink, color: mix(C.paper, C.ink, 0.25), name: '3 Credit', seed: 59, track: 0.06 });

  return {
    update(t) {
      S.update(t);
      // Camera: creep, then a slow push into the gap between the two and the one (from "agree").
      // Opens tight on the torpedo (the subject of "On board: a nuclear torpedo"), pulls back on "three" to reveal
      // the three men (a reveal with a reason: the weapon first, then who controls it). Then a slow push from "agree".
      const open = span(t, tThree - 0.75, tThree + 0.45);
      const push = span(t, tAgree - 0.3, ctx.duration + 0.3);
      const z0 = L.pick({ landscape: 1.45, portrait: 1.3 });
      const z = creep(t, 0.04) * (z0 + (1 - z0) * open) * (1 + 0.06 * push);
      const fx = lerp(torX + torW * 0.5, (xs[1] + xs[2]) / 2, open), fy = lerp(torY + torW * 0.07, deck - figH * 0.6, open);
      // crane: while tight, the camera is lowered so the torpedo sits at frame centre (pan is per plane = parallax)
      const panY = -((H * 0.5 - (torY + torW * 0.07)) / 0.8) * (1 - open);
      S.camera({ s: z, fx, fy, y: panY });
      const zx = (x, y, p = 1) => { const sp = 1 + (z - 1) * p; return [fx + (x - fx) * sp, fy + (y - fy - panY * p) * sp]; };

      // Torpedo slides in on its loading rail (from the left, physical reason: it is pushed along the rack).
      const tk = beat(t, tNuc - 0.25);
      torHolder.setAttribute('transform', `translate(${torX - (1 - tk) * W * 0.55} ${torY})`);

      // Officers rise from below the deck (rod puppets), staggered; then breathe; two nod at "yes".
      figs.forEach((f, i) => {
        const t0 = tThree - 0.2 + i * 0.22;
        const k = beat(t, t0);
        const sway = noise1(t * 0.35, i * 3) * 0.6;
        const yOff = (1 - k) * (figH + L.px(40));
        const vel = lag(t, t0);
        f.holder.setAttribute('transform', `translate(${f.x} ${deck + yOff}) scale(${sc * f.dir} ${sc}) translate(-150 -902)`);
        f.holder.style.visibility = t < t0 ? 'hidden' : 'visible';
        const nodK = i < 2 ? beat(t, tYes - 0.35 + i * 0.12) : 0;
        const nodBack = i < 2 ? beat(t, tYes + 0.5 + i * 0.12) : 0;
        const nod = 9 * nodK - 6 * nodBack;
        // arms swing behind the rise (follow-through, clamp ±10°), then hang
        f.o.set({ nod: nod + sway * 0.5, arm: clamp(-vel * 3.5, -10, 10) + sway, lean: sway * 0.4 });
      });

      // Type.
      const m = L.safe;
      railIn(kicker, t, 0.45, m.x, m.y + L.px(P ? 120 : 40), -L.px(80), 0, tThree - 0.4); // leaves when the men arrive (load)
      const [tx, ty] = zx(torX + torW * 0.2, torY + torW * 0.14, 0.8);
      railIn(torLbl, t, tTor - 0.1, Math.min(tx, m.x + m.w - torLbl.w()), ty, -L.px(60), 0);
      figs.forEach((f, i) => {
        // name boards stand on the deck under each figure (like a stage name board)
        const l = lbl[i], [fx0, fy0] = zx(f.x, deck);
        const x = clamp(fx0 - l.w() / 2 + f.dir * figH * 0.02, m.x, m.x + m.w - l.w());
        railIn(l, t, tOff - 0.05 + i * 0.18, x, Math.min(fy0 + L.px(18), m.y + m.h - l.h()), L.px(40) * f.dir, 0);
      });
      [0, 1].forEach(i => {
        const f = figs[i];
        const [hx, hy] = zx(f.x + figH * 0.1, deck - figH * 0.9);
        railIn(yes[i], t, tYes - 0.3 + i * 0.12, hx, hy, -L.px(30), 0);
      });
      railIn(credit, t, 0.6, P ? m.x : W * 0.46, P ? m.y + L.px(120) + kicker.h() + L.px(12) : m.y + m.h - credit.h(), 0, 0);
    },
  };
}
