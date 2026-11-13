// PAINTED SHORT — original painted figures (waist-up, realistic proportions: head = 1 unit, shoulders 2 units wide).
// NOT portraits: generic officers in shirt sleeves (the boat was very hot), painted from imagination and labelled
// "illustration". Washes are painted once in 3 variants (wash boil, cycled on twos); the pen lines are drawn live
// and boil every drawing. Head is a separate group: it can nod / shake around the neck pivot.
import { rng, makeCanvas, blobPts, ellipsePts, TAU } from './paint.js';
import { PAL, wetWash, inkLine } from './water.js';

/** The third officer's face proportions (reused in shot 4 so he is the same painted man). */
export const ARKHIPOV_FACE = { w: 0.97, nose: 1.05, eyeY: 0.005, mouth: 0.95, eyeGap: 1 };

const SHIRT = { blue: '#9fb6cc', khaki: '#c8b98f', white: '#d9d6cc' };

/**
 * opts: u (px per head unit), arms: 'folded' | 'down' | 'behind' (hands behind the back) | 'hips', cap: bool, hair: colour, skin: colour, shirt: key/colour,
 * seed, U, brows: -1..1 (lowered = stern), build: 0.9–1.1 width factor
 */
export function makeFigure(o) {
  const { u, arms = 'down', cap = false, hair = '#6b5242', skin = PAL.sienna, seed = 1, U = 1, build = 1, brows = 0, older = 0 } = o;
  const F = { w: 1, nose: 1, eyeY: 0, mouth: 1, eyeGap: 1, ...(o.face ?? {}) }; // face proportions (no two figures alike)
  const shirt = SHIRT[o.shirt] ?? o.shirt ?? SHIRT.blue;
  const bw = build * (arms === 'behind' ? 0.97 : 1); // hands behind the back pull the shoulders in a little
  // ---------------- geometry in head units (origin = pit of the neck, y down)
  const body = [[-0.2, -0.06], [-0.55, 0.08], [-0.92 * bw, 0.22], [-1.05 * bw, 0.5], [-1.07 * bw, 1.1], [-1.0 * bw, 1.9], [-0.93 * bw, 2.9],
    [0.93 * bw, 2.9], [1.0 * bw, 1.9], [1.07 * bw, 1.1], [1.05 * bw, 0.5], [0.92 * bw, 0.22], [0.55, 0.08], [0.2, -0.06]];
  const shadowSide = [[0.25, 0.0], [0.93 * bw, 0.18], [1.1 * bw, 0.6], [1.08 * bw, 2.9], [0.35, 2.9], [0.45, 1.6], [0.3, 0.6]];
  const neck = [[-0.16, -0.32], [0.17, -0.32], [0.2, 0.02], [0, 0.32], [-0.2, 0.02]];
  const collarL = [[-0.22, -0.08], [-0.42, 0.12], [-0.06, 0.38], [0, 0.32]];
  const collarR = [[0.22, -0.08], [0.42, 0.12], [0.06, 0.38], [0, 0.32]];
  const boardL = [[-0.85 * bw, 0.13], [-0.45, 0.04], [-0.43, 0.14], [-0.84 * bw, 0.25]];
  const boardR = [[0.85 * bw, 0.13], [0.45, 0.04], [0.43, 0.14], [0.84 * bw, 0.25]];
  let forearms = [], hands = [];
  if (arms === 'folded') {
    forearms = [[[-0.92 * bw, 1.52], [-0.2, 1.48], [0.62, 1.42], [0.66, 1.62], [-0.2, 1.7], [-0.9 * bw, 1.76]], [[0.95 * bw, 1.66], [0.2, 1.7], [-0.52, 1.72], [-0.55, 1.9], [0.2, 1.92], [0.93 * bw, 1.9]]];
    hands = [blobPts(0.7, 1.5, 0.12, 0.1, { n: 14, rot: 0.3 }), blobPts(-0.6, 1.8, 0.11, 0.1, { n: 14, rot: -0.2 })];
  } else if (arms === 'hips') {
    forearms = [[[-1.08 * bw, 1.15], [-1.4 * bw, 1.6], [-0.95 * bw, 2.15], [-0.85 * bw, 1.95], [-1.15 * bw, 1.6]], [[1.08 * bw, 1.15], [1.4 * bw, 1.6], [0.95 * bw, 2.15], [0.85 * bw, 1.95], [1.15 * bw, 1.6]]];
    hands = [blobPts(-0.9 * bw, 2.05, 0.15, 0.12, { n: 12 }), blobPts(0.9 * bw, 2.05, 0.15, 0.12, { n: 12 })];
  }
  // head (pivot = 0,-0.2)
  const head = blobPts(0, -0.68, 0.36 * F.w, 0.5, { nTop: 2.1, nBot: 2.5, egg: 0.16, n: 40 });
  const faceShadow = [[0.12, -1.0], [0.37, -0.85], [0.36, -0.5], [0.2, -0.26], [0.04, -0.19], [0.14, -0.45], [0.18, -0.75]];
  const hairShape = cap ? [[-0.37, -0.85], [-0.3, -0.98], [0.3, -0.98], [0.37, -0.85], [0.36, -0.74], [0.3, -0.9], [-0.3, -0.9], [-0.36, -0.74]]
    : [[-0.38, -0.74], [-0.36, -1.0], [-0.18, -1.17], [0.1, -1.19], [0.33, -1.06], [0.38, -0.8], [0.28, -0.92], [0.1, -0.97], [-0.12, -0.94], [-0.3, -0.87]].map(([x, y]) => [x * F.w, y]);
  const earL = blobPts(-0.37, -0.64, 0.06, 0.11, { n: 12 }), earR = blobPts(0.37, -0.64, 0.06, 0.11, { n: 12 });
  const capCrown = blobPts(0, -1.12, 0.52, 0.15, { n: 24 });
  const capBand = [[-0.4, -1.08], [0.4, -1.08], [0.39, -0.93], [-0.39, -0.93]];
  const capPeak = [[-0.36, -0.95], [0.36, -0.95], [0.3, -0.86], [0, -0.83], [-0.3, -0.86]];

  // ---------------- paint 3 wash variants per group
  const PADX = 1.6, TOP = 1.45, BOT = 3.0;
  const bodyW = Math.ceil(u * PADX * 2), bodyH = Math.ceil(u * (BOT + 0.2));
  const headW = Math.ceil(u * 1.4), headH = Math.ceil(u * 1.4);
  const toBody = pts => pts.map(([x, y]) => [bodyW / 2 + x * u, u * 0.2 + y * u]);
  const toHead = pts => pts.map(([x, y]) => [headW / 2 + x * u, headH * 0.88 + (y + 0.2) * u]);   // head canvas: pivot at (headW/2, headH*0.88)
  const B = s => Math.max(1, s * u / 100); // blur scale with figure size
  const variants = [0, 1, 2].map(v => {
    const sd = seed * 97 + v * 13;
    const bc = makeCanvas(bodyW, bodyH), bg = bc.getContext('2d');
    // shirt: light wash, lifted where the lamp hits (upper left), shadow side dropped in wet
    wetWash(bg, toBody(body), shirt, { alpha: 0.55, soft: 0.5, bleed: B(9), rim: 0.6, rimW: B(4), mottle: 0.4, gran: 0.2, seed: sd + 1, U, spread: 0.012, maxSeg: 40,
      lift: { blur: B(30), alpha: 0.5, fn: lg => { lg.beginPath(); lg.ellipse(bodyW / 2 - u * 0.5, u * 0.9, u * 0.45, u * 0.7, -0.3, 0, TAU); lg.fill(); } } });
    wetWash(bg, toBody(shadowSide), PAL.payne, { alpha: 0.32, soft: 0.85, bleed: B(22), rim: 0.3, rimW: B(4), mottle: 0.5, gran: 0.3, seed: sd + 2, U, spread: 0.02, maxSeg: 40 });
    wetWash(bg, toBody(neck), skin, { alpha: 0.5, soft: 0.4, bleed: B(5), rim: 0.5, rimW: B(3), mottle: 0.3, gran: 0.15, seed: sd + 3, U, spread: 0.01, maxSeg: 30 });
    wetWash(bg, toBody([[-0.17, -0.06], [0.2, -0.06], [0.1, 0.1], [-0.1, 0.08]]), PAL.burnt, { alpha: 0.35, soft: 0.9, bleed: B(6), rim: 0, mottle: 0.2, gran: 0, seed: sd + 4, U, spread: 0.01 });
    [collarL, collarR].forEach((c, i) => wetWash(bg, toBody(c), '#eef0ec', { alpha: 0.5, soft: 0.2, bleed: B(3), rim: 0.4, rimW: B(2), mottle: 0.2, gran: 0, seed: sd + 5 + i, U, spread: 0.01, mode: 'source-over' }));
    [boardL, boardR].forEach((c, i) => wetWash(bg, toBody(c), '#4d5570', { alpha: 0.6, soft: 0.2, bleed: B(3), rim: 0.6, rimW: B(2), mottle: 0.3, gran: 0.2, seed: sd + 7 + i, U, spread: 0.01 }));
    forearms.forEach((f, i) => wetWash(bg, toBody(f), skin, { alpha: 0.4, soft: 0.35, bleed: B(6), rim: 0.6, rimW: B(3), mottle: 0.4, gran: 0.15, seed: sd + 9 + i, U, spread: 0.01, maxSeg: 30, mode: i === 1 ? 'source-over' : 'multiply' }));
    hands.forEach((h, i) => wetWash(bg, toBody(h), skin, { alpha: 0.55, soft: 0.3, bleed: B(4), rim: 0.6, rimW: B(2), mottle: 0.3, gran: 0.1, seed: sd + 11 + i, U, spread: 0.03 }));
    // the painter stopped here: the body fades out into bare paper (vignette)
    { const fg = bg.createLinearGradient(0, u * (0.2 + 1.9), 0, u * (0.2 + 2.85)); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)');
      bg.save(); bg.globalCompositeOperation = 'destination-out'; bg.fillStyle = fg; bg.fillRect(0, u * 2, bodyW, bodyH); bg.restore(); }
    // head
    const hc = makeCanvas(headW, headH), hg = hc.getContext('2d');
    wetWash(hg, toHead(head), skin, { alpha: 0.5, soft: 0.45, bleed: B(6), rim: 0.55, rimW: B(3), mottle: 0.35, gran: 0.15, seed: sd + 20, U, spread: 0.006, maxSeg: 25,
      shapes: [earL, earR].map(toHead), lift: { blur: B(12), alpha: 0.45, fn: lg => { lg.beginPath(); lg.ellipse(headW / 2 - u * 0.12, headH * 0.88 + (-0.55 + 0.2) * u, u * 0.12, u * 0.2, 0, 0, TAU); lg.fill(); } } });
    wetWash(hg, toHead(faceShadow), PAL.burnt, { alpha: 0.38, soft: 0.8, bleed: B(10), rim: 0.3, rimW: B(3), mottle: 0.4, gran: 0.2, seed: sd + 21, U, spread: 0.02, maxSeg: 25 });
    wetWash(hg, toHead(faceShadow), PAL.payne, { alpha: 0.22, soft: 0.9, bleed: B(14), rim: 0, mottle: 0.5, gran: 0.25, seed: sd + 22, U, spread: 0.03, maxSeg: 25 });
    wetWash(hg, toHead(blobPts(-0.16, -0.48, 0.1, 0.07, { n: 10 })), '#d98a78', { alpha: 0.28, soft: 1, bleed: B(8), rim: 0, mottle: 0, gran: 0, seed: sd + 23, U });
    wetWash(hg, toHead(hairShape), hair, { alpha: 0.6 - older * 0.15, soft: 0.6, bleed: B(5), rim: 0.6, rimW: B(2.5), mottle: 0.45, gran: 0.3, seed: sd + 24, U, spread: 0.015, maxSeg: 25 });
    if (cap) {
      wetWash(hg, toHead(capCrown), '#e9e6dc', { alpha: 0.8, soft: 0.2, bleed: B(3), rim: 0.5, rimW: B(2), mottle: 0.2, gran: 0.1, seed: sd + 25, U, spread: 0.01, mode: 'source-over' });
      wetWash(hg, toHead(capCrown), PAL.payne, { alpha: 0.22, soft: 0.6, bleed: B(5), rim: 0.6, rimW: B(2), mottle: 0.5, gran: 0.2, seed: sd + 26, U, spread: 0.01 });
      wetWash(hg, toHead(capBand), '#3f4357', { alpha: 0.75, soft: 0.2, bleed: B(3), rim: 0.6, rimW: B(2), mottle: 0.3, gran: 0.2, seed: sd + 27, U, spread: 0.005 });
      wetWash(hg, toHead(capPeak), '#2f3242', { alpha: 0.8, soft: 0.2, bleed: B(3), rim: 0.5, rimW: B(2), mottle: 0.3, gran: 0.1, seed: sd + 28, U, spread: 0.005 });
      wetWash(hg, toHead([[-0.08, -1.06], [0.08, -1.06], [0.06, -0.96], [-0.06, -0.96]]), PAL.ochre, { alpha: 0.8, soft: 0, bleed: 1, rim: 0.5, rimW: 1, mottle: 0, gran: 0, seed: sd + 29, U, mode: 'source-over' });
    }
    return { bc, hc };
  });

  // ---------------- live pen lines (boil)
  const bodyInk = [
    { p: [[-0.2, -0.06], [-0.55, 0.06], [-0.93 * bw, 0.18], [-1.07 * bw, 0.45], [-1.1 * bw, 1.1], [-1.06 * bw, 1.9], [-1.02 * bw, 2.6]], w: 1.6 },
    { p: [[0.2, -0.06], [0.55, 0.06], [0.93 * bw, 0.18], [1.07 * bw, 0.45], [1.1 * bw, 1.1], [1.06 * bw, 1.9], [1.02 * bw, 2.6]], w: 2.0 },
    { p: [[-0.42, 0.12], [-0.06, 0.38], [0, 0.32], [0.06, 0.38], [0.42, 0.12]], w: 1.3 },
    { p: [[0, 0.38], [0.01, 0.9], [0, 1.4]], w: 1.0, a: 0.4 },
    { p: [[-0.74 * bw, 0.55], [-0.78 * bw, 1.2], [-0.8 * bw, 1.9]], w: 1.1, a: 0.5 },
    { p: [[0.74 * bw, 0.55], [0.78 * bw, 1.2], [0.8 * bw, 1.9]], w: 1.3, a: 0.5 },
    { p: [[-0.5, 0.75], [-0.25, 0.72], [-0.24, 0.92], [-0.5, 0.94]], w: 1.0, a: 0.4 },  // pocket
  ];
  forearms.forEach(f => bodyInk.push({ p: f.slice(0, Math.ceil(f.length / 2)), w: 1.3, a: 0.55 }));
  hands.forEach(h => bodyInk.push({ p: h.slice(0, Math.ceil(h.length * 0.45)), w: 1.1, a: 0.5 }));
  const bl = brows * 0.04;
  const headInk = (turn) => {
    const sx = turn * 0.09, f = (pts, k = 1) => pts.map(([x, y]) => [x * F.w + sx * k, y]);
    const ey = F.eyeY, eg = F.eyeGap, nl = F.nose, mw = F.mouth;
    const L = [
      { p: head.slice(18, 34), w: 1.3, a: 0.55 },                                           // left contour of face (lit side: thin)
      { p: [[0.36, -0.6], [0.3, -0.38], [0.18, -0.24], [0.04, -0.18]], w: 1.8, a: 0.7 },     // jaw, shadow side
      { p: f([[-0.26 * eg, -0.8 + ey + bl], [-0.16 * eg, -0.835 + ey + bl * 0.5], [-0.07, -0.8 + ey]]), w: 2.3, a: 0.8 }, // brows
      { p: f([[0.07, -0.8 + ey], [0.16 * eg, -0.835 + ey + bl * 0.5], [0.26 * eg, -0.8 + ey + bl]]), w: 2.3, a: 0.8 },
      { p: f([[-0.22 * eg, -0.715 + ey], [-0.155 * eg, -0.735 + ey], [-0.09 * eg, -0.715 + ey]]), w: 1.5, a: 0.75 },        // upper lids
      { p: f([[0.09 * eg, -0.715 + ey], [0.155 * eg, -0.735 + ey], [0.22 * eg, -0.715 + ey]]), w: 1.5, a: 0.75 },
      { p: f([[0.02, -0.74 + ey], [0.05, -0.74 + ey + 0.2 * nl], [0.06, -0.74 + ey + 0.25 * nl], [0.0, -0.73 + ey + 0.27 * nl], [-0.05, -0.74 + ey + 0.26 * nl]], 1.25), w: 1.4, a: 0.65 }, // nose
      { p: f([[-0.1 * mw, -0.355], [0, -0.362], [0.1 * mw, -0.35]], 1.15), w: 1.7, a: 0.7 },        // mouth
      { p: f([[-0.07, -0.29], [0.06, -0.29]], 1.1), w: 1.0, a: 0.3 },                    // lower lip shadow
      { p: [[0.38, -0.72], [0.43, -0.66], [0.41, -0.56], [0.37, -0.53]], w: 1.2, a: 0.5 }, // ear
      { p: [[-0.14, -0.32], [-0.16, -0.06]], w: 1.1, a: 0.45 }, { p: [[0.17, -0.3], [0.2, -0.04]], w: 1.4, a: 0.55 }, // neck
    ];
    if (older) L.push({ p: f([[0.17, -0.5], [0.12, -0.42]]), w: 1, a: 0.35 }, { p: f([[-0.17, -0.5], [-0.12, -0.42]]), w: 1, a: 0.3 });
    if (cap) L.push({ p: [[-0.5, -1.1], [-0.3, -1.25], [0.3, -1.26], [0.52, -1.12]], w: 1.3, a: 0.55 }, { p: [[-0.36, -0.95], [0, -0.83], [0.36, -0.95]], w: 1.5, a: 0.65 });
    else L.push({ p: [[-0.37, -0.85], [-0.3, -1.05], [-0.1, -1.18], [0.15, -1.18], [0.34, -1.02]], w: 1.4, a: 0.55 }, { p: [[0.0, -1.12], [0.12, -1.0], [0.28, -0.95]], w: 1.0, a: 0.4 });
    return L;
  };

  return {
    u, bodyW, bodyH,
    /** Draw at (x, y) = pit of the neck. b = boil index; nod = head pitch (rad); turn = -1..1 head turn; tilt = roll (rad). */
    draw(g, x, y, { b = 0, nod = 0, turn = 0, tilt = 0, alpha = 1, inkA = 1 } = {}) {
      const v = variants[b % 3];
      g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = 'multiply';
      g.drawImage(v.bc, x - bodyW / 2, y - u * 0.2);
      g.restore();
      const toW = pts => pts.map(([px, py]) => [x + px * u, y + py * u]);
      g.save(); g.globalAlpha = alpha * inkA;
      bodyInk.forEach((l, i) => inkLine(g, toW(l.p), { w: l.w * u / 110, U: 1, alpha: (l.a ?? 0.75), seed: seed * 31 + i, boil: b, amp: 0.35 * u / 110, gaps: 0.22 }));
      g.restore();
      // head group: pivot at the neck (0, -0.2)
      g.save();
      g.translate(x, y - 0.2 * u); g.rotate(tilt + turn * 0.03); g.translate(0, nod * 0.25 * u); g.scale(1, 1 - Math.abs(nod) * 0.12);
      g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = 'multiply';
      g.drawImage(v.hc, -headW / 2 + turn * 0.03 * u, -headH * 0.88);
      g.restore();
      g.globalAlpha = alpha * inkA;
      { const ey = F.eyeY, eg = F.eyeGap, sx = turn * 0.09; g.fillStyle = PAL.ink; g.globalAlpha = alpha * inkA * 0.8;
        [-0.155, 0.155].forEach(ex => { g.beginPath(); g.ellipse((ex * eg * F.w + sx + turn * 0.02) * u, (-0.708 + ey + 0.2) * u + nod * 0.1 * u, 0.026 * u, 0.02 * u, 0, 0, TAU); g.fill(); }); }
      headInk(turn).forEach((l, i) => inkLine(g, l.p.map(([px, py]) => [px * u, (py + 0.2) * u + (i >= 2 && i <= 8 ? nod * 0.1 * u : 0)]), { w: l.w * u / 110, U: 1, alpha: l.a, seed: seed * 53 + i, boil: b, amp: 0.3 * u / 110, gaps: 0.15 }));
      g.restore();
    },
  };
}
