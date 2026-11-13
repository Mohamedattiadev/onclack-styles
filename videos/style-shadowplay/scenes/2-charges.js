// 2 · WS CROSS-SECTION — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// Verdigris field = the sea in section. Direction plot: US above (surface), Soviet below; the hunter moves L→R.
// Hero order: destroyer → falling charges → bursts near the hidden sub → "Moscow" tag hangs on a string, silent.
import { svg, clamp, progress, noise1, creep, rand } from '/onclack-styles/engine/lib/anim.js';
import { C, mix, stage, plate, railIn, beat, span, tok, wordAt, shape, SUB, DESTROYER } from '../shared/kit.js';

export default function (root, ctx) {
  const L = ctx.layout, W = ctx.width, H = ctx.height, F = C.verdigris;
  const S = stage(root, ctx, { field: F, name: '2 Stage (verdigris)' });
  const P = L.portrait;
  const surf = H * L.pick({ landscape: 0.33, portrait: 0.27 });
  const air = mix(F, C.paper, 0.32);

  const cutFar = S.cut('far', { rough: L.px(2), shadow: L.px(3), alpha: 0.15, seed: 4 });
  const cutMid = S.cut('mid', { rough: L.px(2.4), shadow: L.px(6), alpha: 0.26, seed: 6 });
  const cutSub = S.cut('sub', { rough: L.px(2.4), shadow: L.px(5), alpha: 0.2, seed: 12 });
  const cutNear = S.cut('near', { rough: L.px(3.5), shadow: L.px(10), alpha: 0.3, seed: 8 });

  // Sky: the air above the surface is the field lifted toward paper (one field, two values).
  const pSky = S.plane(0.05, '2 Air above the sea');
  svg('rect', { x: -W, y: -H, width: W * 3, height: surf + H, fill: air }, pSky);
  // Far: a second US ship on the horizon, hazed into the air.
  const pFar = S.plane(0.3, '2A Far destroyer (haze)');
  const farW = W * L.pick({ landscape: 0.17, portrait: 0.3 });
  const far = shape(pFar, DESTROYER, { fill: mix(C.ink, air, 0.62), filter: cutFar, w: farW, name: '2A Far destroyer' });
  far.setAttribute('transform', `translate(${W * L.pick({ landscape: 0.7, portrait: 0.74 })} ${surf - farW * 0.82 * 230 / 1000})`);
  // Mid: the sea surface — a cut-paper strip with a hand-cut swell edge (fixed, never boils).
  const pSea = S.plane(0.6, '2 Sea surface strip');
  const n = 40, pts = [];
  for (let i = 0; i <= n; i++) { const x = -W * 0.3 + (W * 1.6 * i) / n; pts.push(`${x.toFixed(1)},${(surf + Math.sin(i * 1.7) * L.px(5) + (rand(i * 3.3) - 0.5) * L.px(6)).toFixed(1)}`); }
  const gSea = svg('g', { filter: cutMid }, pSea);
  svg('path', { d: `M${pts.join('L')}L${W * 1.3},${H * 2}L${-W * 0.3},${H * 2}Z`, fill: F }, gSea);

  // Subject: the destroyer (after the US Navy photo of USS Charles P. Cecil, 1962).
  const pShip = S.plane(1, '2B Destroyer plane');
  const shipW = W * L.pick({ landscape: 0.44, portrait: 0.68 });
  const shipH = shipW * 230 / 1000;
  const ship = shape(pShip, DESTROYER, { fill: C.ink, filter: cutMid, w: shipW, name: '2B US destroyer (silhouette after US Navy photo)' });
  // The hidden sub, deep: hazed by the water above it.
  const pSub = S.plane(0.8, '2C Submarine plane');
  const subW = W * L.pick({ landscape: 0.34, portrait: 0.62 });
  const sub = shape(pSub, SUB, { fill: mix(C.ink, F, 0.3), filter: cutSub, w: subW, name: '2C Submarine B-59, deep (hazed)' });
  const subX = W * L.pick({ landscape: 0.55, portrait: 0.3 }), subY = H * L.pick({ landscape: 0.7, portrait: 0.66 }) - subW * 0.12;
  // Charges: three canisters; they roll off the stern and sink, tumbling on the pin.
  const charges = [0, 1, 2].map(i => {
    const g = svg('g', { 'data-name': `2B Depth charge ${i + 1}` }, pShip);
    const s = L.px(L.pick({ landscape: 22, portrait: 24 }));
    svg('rect', { x: -s / 2, y: -s * 0.7, width: s, height: s * 1.4, rx: s * 0.22, fill: C.ink, filter: cutSub }, g);
    return g;
  });
  // Bursts: cut-paper star rings (paper, low area → flash-safe).
  const bursts = [0, 1, 2].map(i => {
    const g = svg('g', { 'data-name': `2B Burst ${i + 1}` }, pShip);
    const r0 = L.px(70), m = 14, d = [];
    for (let j = 0; j < m * 2; j++) { const a = (j / (m * 2)) * Math.PI * 2, r = j % 2 ? r0 * (0.55 + rand(i * 9 + j) * 0.12) : r0 * (0.9 + rand(j * 2.7 + i) * 0.2); d.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`); }
    svg('path', { d: `M${d.join('L')}Z`, fill: mix(C.paper, F, 0.15), filter: cutMid }, g);
    svg('circle', { r: r0 * 0.36, fill: F }, g); // the hole cut out of the middle: a ring, not a glow
    return g;
  });
  // Near: the sea floor, a ragged ink flat in front of everything.
  const pNear = S.plane(1.4, '2 Sea floor (near flat)');
  const fl = [], m2 = 30;
  for (let i = 0; i <= m2; i++) fl.push(`${(-W * 0.3 + (W * 1.6 * i) / m2).toFixed(1)},${(H * (P ? 0.88 : 0.9) - Math.abs(Math.sin(i * 0.9 + 1)) * L.px(36) - rand(i * 5.1) * L.px(26) - (i > m2 * 0.62 && i < m2 * 0.8 ? L.px(40) : 0)).toFixed(1)}`);
  const gFloor = svg('g', { filter: cutNear }, pNear);
  svg('path', { d: `M${fl.join('L')}L${W * 1.3},${H * 1.4}L${-W * 0.3},${H * 1.4}Z`, fill: C.ink }, gFloor);

  // Timing from the voice.
  const tAbove = wordAt(ctx, 'Above', 0, 0.35), tDrop = wordAt(ctx, 'drop', 0, 1.74), tCharges = wordAt(ctx, 'charges.', 0, 2.84);
  const tMoscow = wordAt(ctx, 'Moscow', 0, 3.74), tSilent = wordAt(ctx, 'silent', 0, 4.72);
  const burstT = [tCharges - 0.05, tCharges + 0.42, tCharges + 0.85];
  ctx.sfx('boom-distant-01', burstT[0], { volume: 0.55 });
  ctx.sfx('boom-slapback-01', burstT[2], { volume: 0.35 });

  // Type: the hanging tag (on a string from the fly loft) and the credit.
  const tagX = W * L.pick({ landscape: 0.84, portrait: 0.1 }), tagTop = 0;
  const string = svg('line', { x1: tagX, y1: tagTop, x2: tagX, y2: 0, stroke: C.ink, 'stroke-width': L.px(2.5), 'data-name': '2D Tag string' }, S.s);
  const tag = plate(S.type, L, { text: 'Moscow', font: 'title', size: L.pick({ landscape: 64, portrait: 70 }), ground: C.paper, color: C.ink, name: '2D Moscow tag', seed: 5, padX: 0.4, padY: 0.2 });
  const tag2 = plate(S.type, L, { text: 'no word for days', size: L.pick({ landscape: 28, portrait: 32 }), name: '2D Silent tag', seed: 9 });
  const credit = plate(S.type, L, { text: 'Ship outlines drawn after US Navy photos', size: L.pick({ landscape: 22, portrait: 26 }), ground: C.ink, color: mix(C.paper, C.ink, 0.25), name: '2 Credit', seed: 3, track: 0.06 });
  const pdc = plate(S.type, L, { text: 'Practice depth charges\ngrenade-sized signals', size: L.pick({ landscape: 26, portrait: 28 }), ground: C.paper, color: C.ink, name: '2B Practice charge label', seed: 15, track: 0.06 });
  const hang = L.pick({ landscape: H * 0.42, portrait: H * 0.36 });

  return {
    update(t) {
      S.update(t);
      // Camera: hold + creep; a slow tilt down toward the sub after the charges sink.
      const tilt = span(t, tCharges - 0.6, tCharges + 1.6);
      S.camera({ s: creep(t, 0.05) * (1 + 0.05 * tilt), fx: W * 0.5, fy: subY, y: L.px(-20) * tilt });

      // Destroyer enters on its groove at "Above" and keeps hunting slowly to the right.
      const sIn = beat(t, tAbove - 0.35);
      const shipX = W * L.pick({ landscape: 0.06, portrait: 0.02 }) + (1 - sIn) * -W * 0.25 + t * L.px(6);
      const roll = noise1(t * 0.8, 2) * 0.6;
      ship.setAttribute('transform', `translate(${shipX} ${surf - shipH * 0.84 + noise1(t, 5) * L.px(2)}) rotate(${roll} ${shipW / 2} ${shipH})`);
      // Sub: still, deep; shudders after each burst (noise-based, decays).
      let sh = 0; for (const b of burstT) { const d = t - b; if (d > 0 && d < 0.7) sh += (1 - d / 0.7) * noise1(d * 30, b * 7) * L.px(5); }
      sub.setAttribute('transform', `translate(${subX + sh} ${subY + noise1(t * 0.4, 1) * L.px(3)})`);

      // Charges: roll off the stern at "drop", sink (drag: fast start, slow end), tumble on the puppet spring.
      charges.forEach((g, i) => {
        const t0 = tDrop - 0.05 + i * 0.16, tEnd = burstT[i];
        const x0 = shipX + shipW * (0.06 + i * 0.012), y0 = surf - L.px(4);
        const x1 = subX + subW * (0.25 + i * 0.22), y1 = subY - L.px(P ? 70 : 60) + i * L.px(14);
        const k = tok.enter(progress(t, t0, tEnd));
        const x = x0 + (x1 - x0) * k + Math.sin(k * 5 + i) * L.px(8), y = y0 + (y1 - y0) * k;
        const rot = (1 - beat(t, t0)) * (i % 2 ? -1 : 1) * 70 + noise1(t * 2, i) * 10;
        g.setAttribute('transform', `translate(${x} ${y}) rotate(${rot})`);
        g.style.visibility = t >= t0 && t < tEnd ? 'visible' : 'hidden';
        const b = bursts[i], d = t - tEnd;
        b.style.visibility = d >= 0 && d < 0.9 ? 'visible' : 'hidden';
        if (d >= 0) b.setAttribute('transform', `translate(${x1} ${y1}) scale(${0.25 + 0.95 * tok.enter(clamp(d / 0.35))}) rotate(${i * 17 + d * 12})`);
        b.style.opacity = String(1 - tok.exit(clamp((d - 0.35) / 0.55)));
      });

      // Moscow tag: lowered from the fly loft on a string, swings on its pin, then hangs still — silent.
      const k = beat(t, tMoscow - 0.06);
      const yTag = -L.px(160) + (hang + L.px(160)) * k;
      const sw = Math.exp(-Math.max(0, t - tMoscow) * 1.6) * Math.sin(Math.max(0, t - tMoscow) * 5.2) * 5;
      const tw = tag.w();
      const ax = tagX + Math.sin((sw * Math.PI) / 180) * (yTag);
      string.setAttribute('x2', ax); string.setAttribute('y2', Math.max(0, yTag));
      string.style.visibility = t >= tMoscow - 0.06 ? 'visible' : 'hidden';
      railIn(tag, t, tMoscow - 0.06, ax - (P ? 0 : tw / 2), yTag, 0, 0);
      tag.wrap.style.transform += ` rotate(${sw}deg)`;
      tag.wrap.style.transformOrigin = P ? '0 0' : '50% 0';
      railIn(tag2, t, tSilent - 0.05, ax - (P ? 0 : tag2.w() / 2), yTag + tag.h() + L.px(10), 0, -L.px(24));
      railIn(pdc, t, tDrop - 0.1, shipX + shipW * L.pick({ landscape: 0.2, portrait: 0.3 }), surf + H * L.pick({ landscape: 0.1, portrait: 0.09 }), 0, -L.px(30), tMoscow - 0.4);
      // Credit (truth label) sits on the sea floor, bottom-left of the safe area.
      railIn(credit, t, 0.6, L.safe.x, P ? subY + subW * 0.32 : L.safe.y + L.safe.h - credit.h(), 0, 0);
    },
  };
}
