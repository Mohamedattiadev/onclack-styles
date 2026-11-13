// Scenes 3 + 4 share ONE sheet (one continuous camera, no cut between them): torpedo, three upright strokes, the seal.
// 3 · "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
//     intent: KNOW one weapon, three keys · FEEL weight · SEE a long heavy stroke over three standing strokes.
// 4 · "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
//     intent: KNOW his name and his "no" · FEEL relief, awe · SEE the only colour in the film: a vermillion seal, НЕТ.
// truth: VO — the officers are calligraphic marks, never faces. Roles from later accounts (Savitsky = commander,
//        Maslennikov = political officer, Arkhipov = flotilla chief of staff); details of the vote are debated.
//        "forty years later" = 2002 Havana conference made the story widely known (hedged in the caption).
import { glide, creep, lerp } from '/onclack-styles/engine/lib/anim.js';
import { makeSheet } from './stage.js';
import { stroke, seal, label, writeIn, wordAt } from './ink.js';

export function buildVote(root, ctx, part) {
  const S = makeSheet(root, ctx, `v${part}`, 37);
  const { L, W, H, F } = S, u = L.unit, P = L.portrait, w = ctx.words;
  const t2 = (re, n) => wordAt(w, 2, re, n), t3 = (re, n) => wordAt(w, 3, re, n);
  const layer = S.layer('Strokes');

  // torpedo: one long heavy stroke, nose (right) → tail, then a small crossing flick for the fins
  const ty = (P ? 0.27 : 0.29) * H, nose = (P ? 0.86 : 0.7) * W, tail = (P ? 0.13 : 0.09) * W;
  const tT = t2(/^a$/) - 0.02;
  const torpedo = stroke(layer, F, { name: '3A Torpedo (one heavy stroke)', pts: [[nose, ty], [lerp(nose, tail, 0.3), ty - 3 * u], [lerp(nose, tail, 0.75), ty + 2 * u], [tail, ty]],
    w: [[0, 30 * u], [0.04, 40 * u], [0.6, 38 * u], [0.9, 26 * u], [1, 14 * u]], t0: tT, dur: 0.66, ink: 0.94, dry: 0.74, bristles: 14, coreEnd: 0.55, rough: 0.05, seed: 41, unit: u, bleed: 5 });
  const fins = stroke(layer, F, { name: '3A Torpedo fins (flick)', pts: [[tail + 18 * u, ty - 34 * u], [tail + 6 * u, ty], [tail - 4 * u, ty + 34 * u]],
    w: [[0, 12 * u], [0.5, 9 * u], [1, 4 * u]], t0: tT + 0.68, dur: 0.12, ink: 0.85, dry: 0.4, bristles: 5, seed: 42, unit: u, bleed: 2 });

  // three officers: upright strokes, pressed at the top, lifting dry at the foot; the third stands apart
  const fx = P ? [0.2, 0.43, 0.7] : [0.52, 0.66, 0.86];
  const top = (P ? 0.45 : 0.47) * H, bot = (P ? 0.66 : 0.8) * H;
  const tFig = t2(/^three/) - 0.08;
  const lean = [-6, 5, -3];
  const figs = fx.map((x, i) => stroke(layer, F, { name: `3B Officer ${i + 1} (upright stroke)`, pts: [[x * W + lean[i] * u, top], [x * W - lean[i] * 0.4 * u, lerp(top, bot, 0.45)], [x * W + lean[i] * 0.6 * u, bot]],
    w: [[0, 30 * u], [0.08, 36 * u], [0.3, 25 * u], [0.85, 20 * u], [1, 9 * u]], t0: tFig + i * 0.24, dur: 0.36, ink: 0.92, dry: 0.66, bristles: 10, coreEnd: 0.5, rough: 0.08, seed: 50 + i * 3, unit: u, bleed: 4 }));
  // "yes": a short pressed dot-stroke beside the first two (a nod in ink)
  const tYes = t2(/^Two/) + 0.02;
  const yes = [0, 1].map(i => stroke(layer, F, { name: `3C Yes mark ${i + 1}`, pts: [[fx[i] * W + 34 * u, top + 2 * u], [fx[i] * W + 44 * u, top + 16 * u], [fx[i] * W + 50 * u, top + 28 * u]],
    w: [[0, 9 * u], [0.4, 15 * u], [1, 7 * u]], t0: tYes + i * 0.26, dur: 0.14, ink: 0.9, dry: 0.75, bristles: 4, seed: 60 + i, unit: u, bleed: 2 }));
  const items = [torpedo, fins, ...figs, ...yes];

  // the seal sits in the gap that separates the third from the two — the only colour in the film
  const sealP = P ? [0.56 * W, top + 0.03 * H] : [0.76 * W, top + 0.06 * H];
  const tNo = t3(/^no/) - 0.05;   // lands 1–2 frames before the word
  const sl = seal(S.ink, F, { x: sealP[0], y: sealP[1], S: (P ? 74 : 82) * u, rot: -3 });
  sl.g.setAttribute('display', 'none');

  // type
  const lab = (txt, o) => label(S.text, txt, { unit: u, ...o });
  const sz = P ? 40 : 36, small = P ? 34 : 30;
  const torLab = lab('nuclear torpedo', { size: sz, italic: true, name: '3A Label torpedo' });
  const roles = ['commander', 'political officer', 'flotilla chief of staff'].map((r, i) => lab(r, { size: small, italic: true, color: '#5E5A54', align: 'center', name: `3B Role ${i + 1}` }));
  const yesLab = [0, 1].map(i => lab('yes', { size: sz, align: 'center', name: `3C Yes ${i + 1}` }));
  const name = lab('Vasili Arkhipov', { size: P ? 52 : 48, align: 'center', name: '4A Name' });
  const noLab = lab('the seal reads “no” in Russian', { size: small, italic: false, color: '#5E5A54', align: 'center', name: '4A Seal caption' });
  const later = lab('His part became widely known only in 2002, forty years on.', { size: P ? 36 : 36, italic: true, name: '4B Forty years later' });
  if (P) later.el.style.whiteSpace = 'normal', later.el.style.width = (0.8 * W) + 'px';

  // sound: inside the boat — close water on the hull, a step on the metal deck, cloth as the officers stand;
  // the bed thins before "no", one dry wooden press for the seal, then open calm sea (we are out of the boat).
  if (part === 3) {
    ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration + 0.4, lu: -17, fade: 0.6 });
    ctx.sfx('footsteps-metal-deck-01', t2(/^officers/) - ctx.start, { lu: -16 });
    ctx.sfx('cloth-jacket-01', tYes - ctx.start, { lu: -18 });
    ctx.sfx('page-turn-01', 0.02, { lu: -21 });                                  // a new sheet is laid down
    ctx.sfx('breath-close-01', t2(/^yes/) + 0.45 - ctx.start, { lu: -22 });      // one held breath in the pause before "The third"
  } else {
    ctx.ambience('sea-water-close-01', { from: 0.4, to: tNo - 0.75 - ctx.start, lu: -19, fade: 0.5 });
    ctx.sfx('drawer-close-01', tNo + 0.05 - ctx.start, { lu: -4 });
    ctx.ambience('sea-wash-calm-01', { from: tNo + 0.6 - ctx.start, to: ctx.duration, lu: -16, fade: 1.5 });
  }

  // camera (global time): hold + creep, glide in to the third on "The third", hold through "no", pull back to the whole sheet
  const tThird = t3(/^third/) - 0.25, tBack = t3(/^world/) - 0.1;
  const focus = P ? [0.5 * W, 0.5 * H] : [0.78 * W, 0.6 * H], scr = P ? [0.5 * W, 0.5 * H] : [0.62 * W, 0.55 * H];
  const zIn = P ? 1.03 : 1.3;
  return function update(T) {
    for (const it of items) it.update(T);
    sl.g.setAttribute('display', T >= tNo ? '' : 'none');
    const k = glide(T, tThird, tThird + 1.3, 0, 1) * (1 - glide(T, tBack, tBack + 1.9, 0, 1));
    const s = creep(T - 13, 0.03) * lerp(1, zIn, k); // creep from a fixed global origin → identical in s3 and s4
    S.camera([lerp(W / 2, focus[0], k), lerp(H / 2, focus[1], k)], [lerp(W / 2, scr[0], k), lerp(H / 2, scr[1], k)], s);
    const sc = q => S.toScreen(q);
    const a = sc([tail + 4 * u, ty + 44 * u]);
    torLab.set(a[0], a[1], writeIn(T, t2(/^nuclear/) - 0.02, 0.45) * (P ? 1 : 1 - Math.min(1, k * 4))); // leaves before the push crops it
    fx.forEach((x, i) => {
      const p = sc([x * W, bot + 26 * u]);
      roles[i].set(p[0], p[1], writeIn(T, i < 2 ? t2(/^officers/) + i * 0.3 : t3(/^third/) + 0.1, 0.4));
      if (i < 2) yesLab[i].set(p[0], p[1] + (P ? 44 : 40) * u, writeIn(T, t2(/^yes/) - 0.05 + i * 0.12, 0.3));
    });
    const n = sc([fx[2] * W, bot + 26 * u]);
    name.set(n[0], n[1] + (P ? 44 : 40) * u, writeIn(T, t3(/^Vasili/) - 0.03, 0.6));
    const c = sc([sealP[0], sealP[1] + (P ? 62 : 66) * u]);
    noLab.set(c[0], c[1], writeIn(T, tNo + 0.45, 0.4));
    const lp = P ? L.at(0.02, 0.86) : L.at(0.0, 0.9);
    later.set(lp[0], lp[1], writeIn(T, t3(/^forty/) - 0.08, 0.9));
  };
}
