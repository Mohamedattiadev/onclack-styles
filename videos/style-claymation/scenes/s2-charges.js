// SET-UP 2 — RISING. Clay ships on the surface drop dark clay barrels; each bursts into replacement "splat" pieces.
// intent: KNOW US ships dropped practice depth charges; Moscow was silent · FEEL dread · SEE barrels sinking toward the sub
// truth: RC — sculpted model; "practice depth charges" (signalling charges) as stated by most sources; ship count symbolic.
import { svg, rand } from '/onclack-styles/engine/lib/anim.js';
import { PAL, F, step, frameNo, wordT, replace, pose, makeSet, sea, crests, backdrop, submarine, ship, tag, pressOn, ovalPath, blobPath, thumb, kelp, shade } from '../shared/clay.js';

export default function (root, ctx) {
  const S = makeSet(root, ctx, 's2');
  const { L, W, H, u } = S;
  const P = L.portrait;

  const tAmer = wordT(ctx, /^American/, 0, 0.86) - 2 * F;
  const tDrop = wordT(ctx, /^drop/, 0, 1.74) - 2 * F;
  const tPrac = wordT(ctx, /^practice/, 0, 2.07) - 2 * F;
  const tCharges = wordT(ctx, /^charges/, 0, 2.84) - 2 * F;
  const tMoscow = wordT(ctx, /^Moscow/, 0, 3.74) - 2 * F;
  const tSilent = wordT(ctx, /^silent/, 0, 4.72) - 2 * F;
  const tDays = wordT(ctx, /^days/, 0, 5.28) - 2 * F;

  const surfY = H * (P ? 0.4 : 0.36);
  backdrop(S, S.cam, -40 * u, surfY + 40 * u, { seed: 6, color: shade(PAL.sky, 0.93), clouds: P ? [] : [[W * 0.36, H * 0.1, 44 * u, 41]] });

  // ---- ships (drawn before the sea so the top coil hides their keels)
  const shipsDef = P
    ? [{ x: W * 0.2, len: 340, dir: -1 }, { x: W * 0.66, len: 470, dir: -1 }, { x: W * 1.02, len: 220, dir: -1 }]
    : [{ x: W * 0.2, len: 340, dir: -1 }, { x: W * 0.52, len: 440, dir: -1 }, { x: W * 0.83, len: 290, dir: -1 }];
  const shipsG = S.group(S.cam, 'US Navy ships');
  const ships = shipsDef.map((d, i) => {
    const g = svg('g', { 'data-name': `2A Ship ${i + 1}` }, shipsG);
    ship(S, g, d.len * u, 30 + i * 7, d.dir, `Clay ship ${i + 1}`);
    return { ...d, g, len: d.len * u };
  });

  const SEA = sea(S, S.cam, surfY, H * (P ? 1.16 : 1) + 60 * u, { seed: 3, n: P ? 15 : 10 });
  crests(S, S.cam, surfY + 4 * u, 5, P ? 190 : 260);

  // ---- the sub, deep, holding still (it is hiding)
  const subLen = W * (P ? 0.5 : 0.26), subX = W * (P ? 0.46 : 0.5), subY = H * (P ? 0.7 : 0.8);
  const sub = submarine(S, S.group(S.cam, 'Submarine'), subLen, 9, 'Soviet sub B-59 (clay model)');

  // ---- depth charges: dark clay barrels, then replacement splat pieces
  const charges = [
    { ship: 1, td: tAmer - 0.35, tb: tDrop - 0.25, dx: -0.12 },
    { ship: 0, td: tDrop, tb: tCharges + 2 * F, dx: 0.1 },
    { ship: 2, td: tCharges - 0.15, tb: tMoscow + 0.15, dx: -0.06 },
  ].map((c, i) => {
    const sh = ships[c.ship];
    const x0 = sh.x + sh.len * c.dx, y0 = surfY - 6 * u;
    const xb = subX + (P ? [-0.28, 0.3, 0.05][i] : [-0.22, 0.24, 0.02][i]) * subLen * (P ? 1.6 : 2.2);
    const yb = subY - subLen * (P ? [0.62, 0.48, 0.8][i] : [0.5, 0.42, 0.62][i]);
    const g = svg('g', { 'data-name': `2B Depth charge ${i + 1}` }, S.cam);
    const barrel = svg('g', {}, g);
    S.clay(barrel, 's', 90 + i);
    const bw = 30 * u, bh = 40 * u;
    svg('path', { d: blobPath([[-bw / 2, -bh / 2], [bw / 2, -bh / 2], [bw / 2 + 2 * u, 0], [bw / 2, bh / 2], [-bw / 2, bh / 2], [-bw / 2 - 2 * u, 0]], 1.5 * u, 90 + i), fill: PAL.charge }, barrel);
    for (const ry of [-0.22, 0.22]) svg('path', { d: `M${-bw / 2} ${bh * ry} q ${bw / 2} ${3 * u} ${bw} 0`, fill: 'none', stroke: shade(PAL.charge, 1.5), 'stroke-width': 2.2 * u, 'stroke-linecap': 'round' }, barrel);
    // splat replacement pieces: built once, one shown per 12 fps frame
    const splat = svg('g', { 'data-name': `Splat pieces ${i + 1}` }, g);
    S.clay(splat, 's', 95 + i);
    const pieces = [];
    const R = (P ? 84 : 88) * u;
    const mk = (fn) => { const pg = svg('g', { display: 'none' }, splat); fn(pg); pieces.push(pg); };
    mk(pg => svg('path', { d: ovalPath(0, 0, R * 0.45, R * 0.4, R * 0.15, 101 + i, 9), fill: PAL.splat }, pg));
    mk(pg => {
      const pts = [];
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = R * (k % 2 ? 0.55 : 1.0) * (0.85 + rand(i * 9 + k) * 0.3); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      svg('path', { d: blobPath(pts, R * 0.06, 110 + i), fill: PAL.splat }, pg);
      thumb(pg, S, -R * 0.1, 0, R * 0.35, 0, 120 + i, PAL.splat);
    });
    mk(pg => { for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + i, rr = R * 1.15; svg('path', { d: ovalPath(Math.cos(a) * rr, Math.sin(a) * rr, R * 0.26, R * 0.22, R * 0.05, 130 + k), fill: PAL.splat }, pg); } svg('path', { d: ovalPath(0, 0, R * 0.42, R * 0.36, R * 0.1, 139), fill: shade(PAL.splat, 0.92) }, pg); });
    mk(pg => { for (let k = 0; k < 11; k++) { const a = (k / 11) * Math.PI * 2 + i * 0.5, rr = R * (1.5 + rand(k + i) * 0.4); svg('path', { d: ovalPath(Math.cos(a) * rr, Math.sin(a) * rr - R * 0.2, R * 0.14, R * 0.12, R * 0.03, 150 + k), fill: PAL.splat }, pg); } });
    mk(pg => { for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + i, rr = R * (1.9 + rand(k * 3 + i) * 0.4); svg('path', { d: ovalPath(Math.cos(a) * rr, Math.sin(a) * rr - R * 0.5, R * 0.08, R * 0.08, 0, 160 + k, 6), fill: PAL.sea[0] }, pg); } });
    return { ...c, g, barrel, splat, pieces, x0, y0, xb, yb };
  });

  // ---- Moscow: a clay speech bubble from off-frame right (east), with three dots that sag into silence
  const B = P ? { x: W * 0.5, y: L.safe.y + 60 * u, w: 360 * u, h: 165 * u } : { x: W * 0.66, y: L.safe.y + 20 * u, w: 330 * u, h: 140 * u };
  const bub = svg('g', { 'data-name': '2C Moscow bubble' }, S.cam);
  const bubIn = svg('g', {}, bub);
  S.clay(bubIn, 'c', 170);
  svg('path', { d: blobPath([[B.x, B.y + B.h * 0.5], [B.x + B.w * 0.08, B.y + B.h * 0.06], [B.x + B.w * 0.5, B.y - 4 * u], [B.x + B.w * 0.92, B.y + B.h * 0.06], [B.x + B.w, B.y + B.h * 0.5], [B.x + B.w * 0.92, B.y + B.h * 0.92], [B.x + B.w * 0.5, B.y + B.h + 4 * u], [B.x + B.w * 0.08, B.y + B.h * 0.92]], 4 * u, 171), fill: PAL.tag }, bubIn);
  svg('path', { d: blobPath([[B.x + B.w * 0.8, B.y + B.h * 0.2], [W + 40 * u, B.y - 30 * u], [B.x + B.w * 0.9, B.y + B.h * 0.55]], 2 * u, 172), fill: PAL.tag }, bubIn);
  const dots = [0, 1, 2].map(k => {
    const dg = svg('g', { 'data-name': `Silence dot ${k + 1}` }, bubIn);
    svg('path', { d: ovalPath(0, 0, 17 * u, 17 * u, 1.5 * u, 175 + k, 9), fill: PAL.ink }, dg);
    return { dg, x: B.x + B.w * (0.3 + k * 0.2), y: B.y + B.h * 0.52 };
  });
  thumb(bubIn, S, B.x + B.w * 0.35, B.y + B.h * 0.4, B.h * 0.35, 40, 179, PAL.tag);
  const moscowTag = tag(S.cam, S, 'Moscow: silent for days', P ? B.x + B.w - 10 * u : B.x + B.w * 0.5, B.y + B.h + 52 * u, { size: 34 * u, anchor: P ? 'r' : 'c', name: '2C Tag Moscow', seed: 21 });

  // ---- tags
  const shipTag = tag(S.cam, S, 'US Navy ships', P ? L.safe.x : W * 0.12, surfY - (P ? 235 : 205) * u, { size: 34 * u, anchor: 'l', name: '2A Tag ships', seed: 23 });
  const pracTag = tag(S.cam, S, 'practice depth charges', P ? L.safe.x : W * 0.06, P ? surfY + 190 * u : surfY + 170 * u, { size: 34 * u, anchor: 'l', name: '2B Tag practice charges', seed: 25 });

  const kelps = (P ? [[W * 0.1, 440], [W * 0.84, 560]] : [[W * 0.06, 300], [W * 0.9, 340]]).map(([kx, kh], i) => kelp(S, S.cam, kx, H * (P ? 1.16 : 1) + 30 * u, kh * u, 85 + i * 5));

  // ---- sound: the sea continues; booms land on the burst frame (+1 f); the hull answers once
  ctx.ambience('sea-wash-calm-01', { from: 0, to: ctx.duration, lu: -21, fade: 0.5 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -25, fade: 0.5 });
  charges.forEach((c, i) => ctx.sfx(i === 1 ? 'boom-slapback-01' : 'boom-distant-01', c.tb + F, { lu: [-12, -14, -15][i], ...(i === 1 ? { duration: 2.0, fadeOut: 0.6 } : {}) }));
  ctx.sfx('door-creak-01', charges[1].tb + 0.7, { lu: -27, duration: 1.6, fadeOut: 0.4 });

  S.finish();
  return {
    update(t) {
      const q = step(t), f = frameNo(t);
      S.update(t);
      // stepped push toward the sub as the charges fall (the danger narrows)
      const z = 1 + 0.05 * Math.min(1, q / ctx.duration);
      // 9:16: the camera starts tilted down (sea + ships fill the tall frame), then tilts up in notches to the
      // silent bubble on "Moscow" — a stepped stop-motion tilt with a reason
      const tilt = P ? -H * 0.14 * (1 - Math.min(1, Math.max(0, frameNo(q - tMoscow + 0.35) / 7))) : 0;
      S.cam.setAttribute('transform', `translate(0 ${tilt.toFixed(1)}) translate(${subX} ${subY}) scale(${z.toFixed(4)}) translate(${-subX} ${-subY})`);

      ships.forEach((s, i) => {
        const bob = Math.sin(q * 2.1 + i * 1.9) * 3 * u;
        s.g.setAttribute('transform', `translate(${(s.x - q * (8 + i * 3) * u).toFixed(1)} ${(surfY + SEA.gap * 0.15 + bob).toFixed(1)}) rotate(${(Math.sin(q * 1.7 + i) * 1.2).toFixed(2)})`);
      });

      let shk = 0;
      for (const c of charges) {
        const falling = q >= c.td && q < c.tb;
        const p = Math.min(1, Math.max(0, (q - c.td) / (c.tb - c.td)));
        const e = p * p * 0.35 + p * 0.65;
        const x = c.x0 + (c.xb - c.x0) * e + Math.sin(p * 9 + c.ship) * 10 * u, y = c.y0 + (c.yb - c.y0) * e;
        c.barrel.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(frameNo(q - c.td) * 28 + c.ship * 40) % 360})`);
        c.barrel.style.opacity = falling ? 1 : 0;
        const k = frameNo(q - c.tb);
        c.pieces.forEach((pg, j) => pg.setAttribute('display', q >= c.tb && j === Math.floor(k / 2) ? 'inline' : 'none'));
        c.splat.setAttribute('transform', `translate(${c.xb.toFixed(1)} ${c.yb.toFixed(1)})`);
        if (q >= c.tb && q < c.tb + 0.42) shk += (k % 2 ? -1 : 1) * 9 * u * (1 - (q - c.tb) / 0.42);
      }
      const jx = (rand(f * 1.3 + 2) - 0.5) * 1.4 * u;
      sub.setAttribute('transform', `translate(${(subX + shk + jx).toFixed(1)} ${(subY + Math.sin(q * 1.3) * 3 * u).toFixed(1)}) rotate(${(shk / u * 0.15).toFixed(2)})`);

      // bubble pressed on at "Moscow", dots sag one notch per frame on "silent", flat by "days"
      pose(bub, replace(q, tMoscow, [{ sx: 1.12, sy: 1.12, o: 1 }, { sx: 1.08, sy: 0.88, o: 1 }, { sx: 0.97, sy: 1.04, o: 1 }, { sx: 1, sy: 1, o: 1 }], { sx: 1, sy: 1, o: 0 }), B.x + B.w * 0.5, B.y + B.h);
      dots.forEach((d, k) => {
        const sag = Math.min(1, Math.max(0, frameNo(q - tSilent - k * 0.12) / 6));
        d.dg.setAttribute('transform', `translate(${d.x.toFixed(1)} ${(d.y + sag * 9 * u).toFixed(1)}) scale(${(1 + sag * 0.35).toFixed(3)} ${(1 - sag * 0.62).toFixed(3)})`);
      });
      pressOn(shipTag, q, tAmer);
      pressOn(pracTag, q, tPrac);
      pressOn(moscowTag, q, tSilent);
      for (const kl of kelps) kl.update(q);
    },
  };
}
