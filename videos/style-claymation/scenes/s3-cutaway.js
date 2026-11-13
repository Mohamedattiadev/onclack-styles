// SET-UP 3 — TURN. The clay sub is sliced open: a torpedo slides onto its rack; three clay officers, two raise a hand.
// intent: KNOW a nuclear torpedo needed three officers to agree; two said yes · FEEL tension · SEE two raised hands, one not
// truth: RC/VO — featureless figures (no faces, no likeness); roles as most sources give them (captain, political
// officer, flotilla chief of staff); the "vote" is shown as a symbol, not a record of the room.
import { svg, rand } from '/onclack-styles/engine/lib/anim.js';
import { PAL, F, step, frameNo, wordT, replace, pose, makeSet, sea, torpedo, cutaway, figure, tag, pressOn, ovalPath, thumb, shade, FONT } from '../shared/clay.js';

export default function (root, ctx) {
  const S = makeSet(root, ctx, 's3');
  const { L, W, H, u } = S;
  const P = L.portrait;

  const tNuclear = wordT(ctx, /^nuclear/, 0, 1.16) - 2 * F;
  const tFire = wordT(ctx, /^fire/, 0, 2.58) - 2 * F;
  const tThree = wordT(ctx, /^three/, 0, 3.19) - 2 * F;
  const tOff = wordT(ctx, /^officers/, 0, 3.54) - 2 * F;
  const tTwo = wordT(ctx, /^Two/, 0, 4.97) - 2 * F;
  const tSay = wordT(ctx, /^say/, 0, 5.23) - 2 * F;
  const tYes = wordT(ctx, /^yes/, 0, 5.48) - 2 * F;

  // deep water behind the sliced hull
  sea(S, S.cam, -60 * u, H + 60 * u, { seed: 7, n: P ? 12 : 8, pal: PAL.sea.slice(4).concat(['#0F2546', '#0D203D', '#0B1B33', '#0A1830', '#09152B']) });
  const C = P ? cutaway(S, S.cam, -60 * u, H * 0.1, W + 120 * u, H * 0.72) : cutaway(S, S.cam, -80 * u, H * 0.06, W + 160 * u, H * 0.9);

  // hanging lamp: wire + a warm clay bulb (the one key light, upper left)
  const lampX = P ? W * 0.3 : W * 0.3;
  svg('path', { d: `M${lampX} ${C.iy} L ${lampX} ${C.iy + 60 * u}`, stroke: '#3A3530', 'stroke-width': 3 * u, 'data-name': 'Lamp wire' }, S.cam);
  const bulb = svg('path', { d: ovalPath(lampX, C.iy + 76 * u, 18 * u, 20 * u, 1 * u, 501), fill: '#F7D77A', 'data-name': 'Lamp bulb' }, S.cam);
  S.clay(bulb, 's', 501);

  // torpedo on its rack
  const T = P ? { x: W * 0.47, y: C.iy + C.ih * 0.3, len: W * 0.74 } : { x: W * 0.28, y: C.iy + C.ih * 0.6, len: W * 0.37 };
  const rack = svg('g', { 'data-name': 'Torpedo rack' }, S.cam);
  S.clay(rack, 's', 510);
  for (const fx of [-0.3, 0.25]) svg('path', { d: `M${T.x + T.len * fx - 26 * u} ${T.y + T.len * 0.07} l ${52 * u} 0 l ${-8 * u} ${46 * u} l ${-36 * u} 0 z`, fill: '#5B4636' }, rack);
  const torpG = svg('g', { 'data-name': '3A Torpedo (moving)' }, S.cam);
  torpedo(S, torpG, T.len, 300);
  const torpTag = tag(S.cam, S, 'nuclear torpedo', P ? T.x - T.len * 0.42 : T.x - T.len * 0.45, T.y - T.len * (P ? 0.14 : 0.17), { size: (P ? 36 : 36) * u, anchor: 'l', name: '3A Tag torpedo', seed: 31 });

  // three officers — different weight, lean, height; no faces
  const fy = C.floorY + (P ? 30 : 34) * u;
  const fh = P ? H * 0.25 : H * 0.44;
  const defs = P
    ? [{ x: W * 0.2, s: 1, wide: 1.18, lean: 4, flip: true, body: PAL.uni[0], poses: ['down', 'point', 'up'], role: 'Captain' },
       { x: W * 0.47, s: 0.92, wide: 1.0, lean: -3, flip: false, body: PAL.uni[1], poses: ['crossed', 'up2'], role: 'Political officer' },
       { x: W * 0.74, s: 1.06, wide: 0.86, lean: 0, flip: false, body: PAL.uni[2], poses: ['down'], role: 'Chief of staff' }]
    : [{ x: W * 0.55, s: 1, wide: 1.18, lean: 4, flip: true, body: PAL.uni[0], poses: ['down', 'point', 'up'], role: 'Captain' },
       { x: W * 0.71, s: 0.92, wide: 1.0, lean: -3, flip: false, body: PAL.uni[1], poses: ['crossed', 'up2'], role: 'Political officer' },
       { x: W * 0.87, s: 1.06, wide: 0.86, lean: 0, flip: false, body: PAL.uni[2], poses: ['down'], role: 'Chief of staff' }];
  const figs = defs.map((d, i) => {
    const g = svg('g', { 'data-name': `3B Officer ${i + 1}`, transform: `translate(${d.x} ${fy})` }, S.cam);
    const fg = figure(S, g, fh * d.s, { body: d.body, lean: d.lean, wide: d.wide, flip: d.flip, seed: 600 + i * 20, name: `Officer ${i + 1} (${d.role})`, poses: d.poses, headR: [0.105, 0.098, 0.092][i] });
    const rt = tag(S.cam, S, d.role, d.x, fy + (P ? 52 : 56) * u, { size: (P ? 27 : 30) * u, anchor: 'c', name: `3B Tag ${d.role}`, seed: 40 + i });
    return { ...d, g, fg, rt };
  });

  // YES tokens: cream discs with the word pressed in, popped above the raised hands
  const yes = [0, 1].map(i => {
    const F0 = figs[i];
    const h = fh * F0.s;
    const ox = F0.flip ? -h * 0.2 : h * 0.22;
    const cx = F0.x + ox, cy = fy - h * 1.16;
    const g = svg('g', { 'data-name': `3C YES token ${i + 1}` }, S.cam);
    const inner = svg('g', {}, g);
    S.clay(inner, 'c', 700 + i);
    const r = (P ? 52 : 56) * u;
    svg('path', { d: ovalPath(cx, cy, r * 1.25, r, 2 * u, 701 + i, 10), fill: PAL.tag }, inner);
    thumb(inner, S, cx + r * 0.3, cy - r * 0.2, r * 0.5, 30, 705 + i, PAL.tag);
    const tx = svg('text', { x: cx, y: cy + r * 0.3, 'text-anchor': 'middle', fill: PAL.ink, style: `font-family:${FONT.clay};font-weight:800;font-size:${r * 0.85}px` }, inner);
    tx.textContent = 'YES';
    return { g, cx, cy: cy + r };
  });

  ctx.ambience('drips-wood-01', { from: 0, to: ctx.duration, lu: -27, fade: 0.6 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -30, fade: 0.6 });
  ctx.sfx('drawer-close-01', tNuclear + 0.5 + F, { lu: -17 }); // torpedo bumps its stop
  ctx.sfx('cloth-jacket-01', tTwo + F, { lu: -24, duration: 0.8, fadeOut: 0.2 });

  S.finish();
  return {
    update(t) {
      const q = step(t), f = frameNo(t);
      S.update(t);
      const z = 1 + 0.05 * Math.min(1, Math.max(0, (q - tThree) / 3));
      const fx = P ? W * 0.5 : W * 0.7, fyc = fy - fh * 0.5;
      S.cam.setAttribute('transform', `translate(${fx} ${fyc}) scale(${z.toFixed(4)}) translate(${-fx} ${-fyc})`);

      // torpedo slides in on "nuclear" (stepped), bumps the stop: one squash frame
      const sp = Math.min(1, Math.max(0, (q - tNuclear + 0.3) / 0.8));
      const sx = (1 - (1 - sp) * (1 - sp)) ;
      const off = (1 - sx) * -T.len * 1.1;
      const bump = replace(q, tNuclear + 0.5, [{ sx: 0.97, sy: 1.08 }, { sx: 1.01, sy: 0.98 }, { sx: 1, sy: 1 }], { sx: 1, sy: 1 });
      torpG.setAttribute('transform', `translate(${(T.x + off).toFixed(1)} ${T.y}) scale(${bump.sx} ${bump.sy})`);
      pressOn(torpTag, q, tNuclear + 0.3);

      // poses (replacement arms)
      figs[0].fg.setPose(q >= tTwo ? 'up' : q >= tFire ? 'point' : 'down');
      figs[1].fg.setPose(q >= tSay ? 'up2' : 'crossed');
      figs.forEach((F0, i) => {
        pressOn(F0.rt, q, tOff + i * 2 / 12);
        // weight shift: tiny stepped sway, different per figure
        const sw = Math.sin(q * 1.1 + i * 2) * 0.6;
        const p = q >= tThree && q < tThree + 0.25 ? replace(q, tThree + i / 12, [{ sx: 1.03, sy: 0.96 }, { sx: 0.99, sy: 1.02 }, { sx: 1, sy: 1 }], { sx: 1, sy: 1 }) : { sx: 1, sy: 1 };
        F0.g.setAttribute('transform', `translate(${F0.x} ${fy}) rotate(${sw.toFixed(2)}) scale(${p.sx} ${p.sy})`);
      });
      yes.forEach((Y, i) => pose(Y.g, replace(q, tYes + i * 2 / 12, [{ sx: 0.6, sy: 0.6, o: 1 }, { sx: 1.15, sy: 0.88, o: 1 }, { sx: 0.95, sy: 1.06, o: 1 }, { sx: 1, sy: 1, o: 1 }], { sx: 1, sy: 1, o: 0 }), Y.cx, Y.cy));
    },
  };
}
