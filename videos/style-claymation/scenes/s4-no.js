// SET-UP 4 — PEAK + RESOLUTION. The third clay officer steps forward; a red clay NO slams down (replacement squash/stretch).
// intent: KNOW Vasili Arkhipov said no; his name became known ~40 years later · FEEL awe, relief · SEE the red NO squashing
// truth: VO — the NO and the raised palm are symbols (no claim about his real gesture); no face, no likeness.
// 2002 = his role became widely known after the Oct. 2002 Havana conference (re-check with 2+ sources before public use).
import { svg, rand } from '/onclack-styles/engine/lib/anim.js';
import { PAL, F, FPS, sea, step, frameNo, wordT, replace, pose, SLAM, makeSet, cutaway, figure, tag, pressOn, clayText, coil, ovalPath, thumb, shade, FONT } from '../shared/clay.js';

export default function (root, ctx) {
  const S = makeSet(root, ctx, 's4');
  const { L, W, H, u } = S;
  const P = L.portrait;

  const tThird = wordT(ctx, /^third/, 0, 0.51) - 2 * F;
  const tVas = wordT(ctx, /^Vasili/, 0, 0.87) - 2 * F;
  const tSays = wordT(ctx, /^says/, 0, 1.95) - 2 * F;
  const tNo = wordT(ctx, /^no/, 0, 2.29) - 2 * F;
  const tWorld = wordT(ctx, /^world/, 0, 3.33) - 2 * F;
  const tForty = wordT(ctx, /^forty/, 0, 4.39) - 2 * F;
  const tLater = wordT(ctx, /^later/, 0, 4.99) - 2 * F;

  // the same interior, light dropped: one lamp, everything else in shadow (low key for the peak)
  sea(S, S.cam, -60 * u, H + 60 * u, { seed: 11, n: P ? 12 : 8, pal: ['#1A3A63', '#163259', '#132B4E', '#102644', '#0E213C', '#0C1D35', '#0B1A30', '#0A182C', '#09162A', '#091528', '#081426', '#081325'] });
  const C = cutaway(S, S.cam, -100 * u, -80 * u, W + 200 * u, P ? (0.62 * H + 36 * u) / 0.8 + 88 * u : H + 40 * u, 420, 0.55);

  // the two who said yes: further back, smaller, darker, arms down now
  const backG = svg('g', { 'data-name': '4A Officers 1–2 (background)', style: 'filter:brightness(0.62) saturate(0.8)' }, S.cam);
  const fy = C.floorY + (P ? 40 : 46) * u;
  const bh = P ? H * 0.17 : H * 0.34;
  const backs = (P ? [[W * 0.7, 1.15, 4, true], [W * 0.88, 0.95, -3, false]] : [[W * 0.085, 1.15, 4, true], [W * 0.195, 0.95, -3, false]]).map(([x, wide, lean, flip], i) => {
    const g = svg('g', { transform: `translate(${x} ${fy - (P ? 60 : 40) * u})` }, backG);
    figure(S, g, bh * (i ? 0.93 : 1), { body: PAL.uni[i], lean, wide, flip, seed: 600 + i * 20, name: `Officer ${i + 1} (background)`, poses: [i ? 'crossed' : 'down'], headR: [0.105, 0.098][i] });
    return g;
  });

  // Arkhipov — the hero figure, front
  const ah = P ? H * 0.245 : H * 0.62;
  const ax = P ? W * 0.32 : W * 0.33;
  const heroG = svg('g', { 'data-name': '4B Third officer (Arkhipov, featureless)' }, S.cam);
  const hero = figure(S, heroG, ah, { body: PAL.uni[2], lean: 0, wide: 0.86, seed: 640, name: 'Vasili Arkhipov (clay, no face)', poses: ['down', 'stop2', 'stop'], headR: 0.092 });
  // lamp pool on the floor behind him (one key light)
  const grad = svg('radialGradient', { id: 's4-pool', cx: '50%', cy: '50%', r: '50%' }, S.defs);
  svg('stop', { offset: '0', 'stop-color': '#FFD28A', 'stop-opacity': 0.34 }, grad);
  svg('stop', { offset: '1', 'stop-color': '#FFD28A', 'stop-opacity': 0 }, grad);
  const lampX = ax + ah * 0.05, lampY = P ? H * 0.06 : 0;
  const pool = svg('ellipse', { cx: lampX, cy: (lampY + fy) / 2, rx: ah * 0.62, ry: (fy - lampY) * 0.62, fill: 'url(#s4-pool)', 'data-name': 'Lamp light on the wall' }, S.cam);
  S.cam.insertBefore(pool, backG);
  svg('path', { d: `M${lampX} ${lampY - 20 * u} L ${lampX} ${lampY + 40 * u}`, stroke: '#2A2522', 'stroke-width': 3 * u }, S.cam);
  const bulb = svg('path', { d: ovalPath(lampX, lampY + 58 * u, 20 * u, 22 * u, 1 * u, 520), fill: '#F7D77A', 'data-name': 'Lamp bulb' }, S.cam);
  S.clay(bulb, 's', 520);
  S.cam.insertBefore(bulb, backG);

  // name tag
  const nameTag = tag(S.cam, S, 'Vasili Arkhipov', P ? W * 0.5 : ax, P ? H * 0.338 : fy + 58 * u, { size: (P ? 46 : 44) * u, anchor: 'c', name: '4B Tag name', seed: 51 });

  // THE NO — red clay letters, replacement squash/stretch (signature)
  const N = P ? { cx: W * 0.46, base: H * 0.265, size: 350 * u } : { cx: W * 0.68, base: H * 0.6, size: 440 * u };
  const noG = svg('g', { 'data-name': '4C NO (red clay)' }, S.cam);
  const noIn = svg('g', {}, noG);
  S.clay(noIn, 'k', 800);
  const noT = clayText(noIn, S, 'NO', N.cx, N.base, N.size, PAL.no, { anchor: 'middle', name: 'NO letters' });
  const nb = noT.getBBox();
  thumb(noIn, S, nb.x + nb.width * 0.27, nb.y + nb.height * 0.5, N.size * 0.12, 20, 805, PAL.no);
  thumb(noIn, S, nb.x + nb.width * 0.74, nb.y + nb.height * 0.42, N.size * 0.1, -40, 806, PAL.no);
  // clay crumbs knocked off on impact (replacement pieces, frame 2–5)
  const crumbs = [];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    const c = svg('path', { d: ovalPath(0, 0, (8 + rand(i) * 8) * u, (6 + rand(i + 3) * 6) * u, 1.5 * u, 820 + i, 8), fill: PAL.no }, S.cam);
    S.clay(c, 's', 820 + i);
    crumbs.push({ c, side, k: 0.6 + rand(i * 2.7) * 0.8, h: 0.3 + rand(i * 5.1) * 0.5 });
  }

  // 1962 ── 40 years ── 2002: a coil rolled out between two discs
  const TL = P ? { x0: W * 0.16, x1: W * 0.7, y: H * 0.72 } : { x0: W * 0.52, x1: W * 0.9, y: H * 0.86 };
  const tlG = svg('g', { 'data-name': '4D 40-year coil' }, S.cam);
  const tlCoil = coil(tlG, `M${TL.x0} ${TL.y} L ${TL.x0 + 1} ${TL.y}`, PAL.tag, 28 * u, 'Coil 1962–2002');
  const tlCoilG = svg('g', {}, tlG);
  svg('rect', { x: TL.x0 - 30 * u, y: TL.y - 30 * u, width: TL.x1 - TL.x0 + 60 * u, height: 60 * u, fill: 'none' }, tlCoilG);
  tlCoilG.appendChild(tlCoil);
  S.clay(tlCoilG, 's', 830);
  const disc = (x, str, seed) => {
    const g = svg('g', { 'data-name': `Year disc ${str}` }, S.cam);
    const inner = svg('g', {}, g);
    S.clay(inner, 'c', seed);
    const r = (P ? 66 : 60) * u;
    svg('path', { d: ovalPath(x, TL.y, r * 1.62, r, 2 * u, seed, 10), fill: PAL.tag }, inner);
    const tx = svg('text', { x, y: TL.y + r * 0.3, 'text-anchor': 'middle', fill: PAL.ink, style: `font-family:${FONT.clay};font-weight:800;font-size:${r * 0.8}px;font-variant-numeric:tabular-nums lining-nums` }, inner);
    tx.textContent = str;
    return { g, x, y: TL.y + r };
  };
  const d62 = disc(TL.x0, '1962', 840), d02 = disc(TL.x1, '2002', 845);
  const fortyTag = tag(S.cam, S, '40 years', (TL.x0 + TL.x1) / 2, TL.y - (P ? 88 : 80) * u, { size: 32 * u, anchor: 'c', name: '4D Tag 40 years', seed: 55 });

  ctx.ambience('drips-wood-01', { from: 0, to: ctx.duration, lu: -30, fade: 0.6 });
  ctx.sfx('footsteps-metal-deck-01', tThird + 2 / FPS, { lu: -20 });
  ctx.sfx('breath-close-01', tSays - 0.5, { lu: -26, duration: 0.7, fadeIn: 0.05, fadeOut: 0.25 });
  ctx.sfx('drawer-close-01', tNo + F, { lu: -12 }); // the clay NO hits the board (impact = SLAM frame 2)
  ctx.sfx('dirt-debris-01', tNo + 2 * F, { lu: -26, duration: 0.6, fadeOut: 0.3 });

  S.finish();
  return {
    update(t) {
      const q = step(t), f = frameNo(t);
      S.update(t);
      // stepped push-in to the hero until the NO, then hold (the peak gets a still frame)
      const z = 1 + 0.045 * Math.min(1, q / Math.max(0.1, tNo));
      const cx = P ? W * 0.45 : W * 0.5, cy = P ? H * 0.42 : H * 0.55;
      S.cam.setAttribute('transform', `translate(${cx} ${cy}) scale(${z.toFixed(4)}) translate(${-cx} ${-cy})`);

      // the third officer steps forward: 3 replacement steps on "third"
      const stepIdx = Math.min(4, Math.max(0, Math.floor((q - tThird) * FPS / 2)));
      const xs = [ah * -0.22, ah * -0.15, ah * -0.08, ah * -0.02, 0][stepIdx], ss = [0.9, 0.93, 0.96, 0.99, 1][stepIdx];
      const bob = stepIdx > 0 && stepIdx < 4 ? (stepIdx % 2 ? -8 : 0) * u : 0;
      heroG.setAttribute('transform', `translate(${(ax + xs).toFixed(1)} ${(fy + bob).toFixed(1)}) scale(${ss})`);
      hero.setPose(q >= tNo ? 'stop' : q >= tNo - 2 / FPS ? 'stop2' : 'down');
      pressOn(nameTag, q, tVas);

      // NO: falls in stretched, squashes flat on impact, rebounds, settles (one pose per 12 fps frame)
      const p = replace(q, tNo - 2 / FPS, SLAM, { sx: 1, sy: 1, dy: 0, o: 0 });
      pose(noG, p, N.cx, N.base, 0, (p.dy ?? 0) * N.size);
      const k = frameNo(q - tNo);
      crumbs.forEach((c, i) => {
        const vis = q >= tNo && k >= 0 && k <= 4;
        const s = Math.max(0, k);
        const x = N.cx + c.side * (nb.width * 0.52 * p.sx + s * 26 * u * c.k), y = N.base - nb.height * 0.05 - s * 30 * u * c.h + s * s * 7 * u;
        c.c.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        c.c.style.opacity = vis ? 1 : 0;
      });

      // 40-year coil: discs pressed on, the coil rolls out one notch per frame from "forty" to "later"
      pressOn({ g: d62.g, bx: d62.x, by: d62.y }, q, tWorld);
      const roll = Math.min(1, Math.max(0, (q - tForty) / Math.max(0.2, tLater - tForty)));
      const xe = TL.x0 + (TL.x1 - TL.x0) * roll;
      tlCoil.setAttribute('d', `M${TL.x0} ${TL.y} L ${Math.max(TL.x0 + 1, xe).toFixed(1)} ${(TL.y + Math.sin(roll * 9) * 2 * u).toFixed(1)}`);
      tlCoilG.style.opacity = q >= tForty ? 1 : 0;
      pressOn({ g: d02.g, bx: d02.x, by: d02.y }, q, tLater);
      pressOn(fortyTag, q, tForty + 4 / FPS);
    },
  };
}
