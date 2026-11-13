// 3 · Inside the model: the torpedo room / control post, built from folded card.
// 3A INS torpedo (PUSH/s) — "On board: a nuclear torpedo."  →  CUT on the pause  →
// 3B MS group, EYE (PUSH/s + rack) — "To fire it, three officers must agree. Two say yes."
// Vote card motif: three boxes; two pen ticks land on "Two say yes", the third stays empty (paid off in scene 4).
// Officers are staged paper figures, no faces, no likeness. Truth: RC. Key light: the caged lamp, upper left.
import { svg, glide, ease, progress, clamp, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { defs, makeCamera, grade, label, voteCard, wt, sceneIn, paper, poly, cut, rect, ellipse, roundRect, shade, officer, wheel, gauge, BRASS, VERMILION } from '../shared/kit.js';

export const ROOM = { wall: '#56646a', wallDark: '#3d494f', rib: '#cdbf9f', floor: '#2f3436', pipe: '#b9ae93', torp: '#6f7a72', coat: ['#252c38', '#2a303b', '#222833'], cap: '#1b2029', skin: '#c79f80', table: '#7a6449' };

/** Folded-card pipe (horizontal): lit upper half, shaded lower half — the fold is the "roundness". */
export function pipe(parent, P, x0, x1, y, d, fill, seed) {
  const g = svg('g', { 'data-name': 'Pipe (folded card)' }, parent);
  paper(g, poly(cut(rect(x0, y - d / 2, x1 - x0, d), seed, 0.4, 14)), { P, fill: shade(fill, 0.12), thick: 1.6, shadow: { dx: d * 0.9, dy: d * 0.55, b: 4, op: 0.35 }, shadowCol: '#0b1013' });
  svg('path', { d: poly(rect(x0, y + d * 0.05, x1 - x0, d * 0.45)), fill: shade(fill, -0.32) }, g);
  for (let x = x0 + 60; x < x1 - 20; x += 140 + (seed % 5) * 9) svg('path', { d: poly(rect(x, y - d * 0.62, d * 0.5, d * 1.24)), fill: shade(fill, -0.1) }, g); // collars
  return g;
}

/** The torpedo, a card model: rounded nose (left), body, tapered tail with fins and a two-blade prop. */
export function torpedo(parent, P, cx, cy, len, seed = 2000) {
  const g = svg('g', { 'data-name': '3A Nuclear torpedo (card model)' }, parent);
  const r = len * 0.055, x0 = cx - len / 2, x1 = cx + len / 2;
  const top = [], bot = [];
  for (let i = 0; i <= 60; i++) {
    const f = i / 60, x = x0 + f * len;
    const rr = f < 0.12 ? r * Math.sqrt(1 - ((0.12 - f) / 0.12) ** 2) : f < 0.8 ? r : r * (1 - 0.62 * ((f - 0.8) / 0.2) ** 1.4);
    top.push([x, cy - rr]); bot.push([x, cy + rr]);
  }
  const outline = cut([...top, ...bot.reverse()], seed, 0.4, 10);
  for (const s of [-1, 1]) paper(g, poly(cut([[x1 - len * 0.1, cy + s * r * 0.3], [x1 - len * 0.02, cy + s * r * 1.15], [x1 + len * 0.004, cy + s * r * 1.12], [x1 - len * 0.02, cy + s * r * 0.2]], seed + s, 0.3, 5)), { P, fill: shade(ROOM.torp, -0.2), thick: 1.5, shadow: { dx: 10, dy: 6, b: 4, op: 0.35 }, shadowCol: '#0b1013' });
  paper(g, poly(outline), { P, fill: ROOM.torp, thick: 2.4, shadow: { dx: r * 0.5, dy: r * 0.35, b: 7, op: 0.42 }, shadowCol: '#0b1013', name: '3A Torpedo body' });
  const clipId = P + 'tclip';
  const cp = svg('clipPath', { id: clipId }, g); svg('path', { d: poly(outline) }, cp);
  const shadeG = svg('g', { 'clip-path': `url(#${clipId})` }, g);
  svg('path', { d: poly(rect(x0 - 5, cy + r * 0.08, len + 10, r * 1.2)), fill: shade(ROOM.torp, -0.38) }, shadeG); // fold: lower half in shade
  svg('path', { d: poly(rect(x0 + len * 0.3, cy - r * 1.2, len * 0.045, r * 2.4)), fill: VERMILION }, shadeG); // the one accent: warhead band
  svg('path', { d: poly(rect(x0 + len * 0.3, cy + r * 0.08, len * 0.045, r * 1.2)), fill: shade(VERMILION, -0.35) }, shadeG);
  for (const f of [0.18, 0.5, 0.66]) svg('path', { d: `M${x0 + len * f},${cy - r} L${x0 + len * f},${cy + r}`, stroke: shade(ROOM.torp, -0.45), 'stroke-width': 1.4, opacity: 0.6 }, shadeG); // score lines
  // two-blade prop on a pin
  svg('path', { d: poly(rect(x1, cy - r * 0.06, len * 0.03, r * 0.12)), fill: '#3b3f3c' }, g);
  paper(g, poly(cut(ellipse(x1 + len * 0.03, cy, r * 0.16, r * 0.95, 14), seed + 5, 0.2, 4)), { P, fill: BRASS, thick: 1.2, shadow: { dx: 6, dy: 4, b: 2, op: 0.4 } });
  return { g, r, x0, x1 };
}

export function buildRoom(cam, P, W, H, L, u, { heroApart = false } = {}) {
  const pick = L.pick, fY = H * pick({ landscape: 0.84, portrait: 0.8 });
  const X0 = -W * 0.6, X1 = W * 1.6;
  // back wall + hull ribs (arched card strips)
  const back = cam.layer('3 Back wall (hull inside)', 0.45);
  paper(back, poly(rect(X0, -H, X1 - X0, H * 3)), { P, fill: ROOM.wall, thick: 0, shadow: false, contact: false, light: 0.5 });
  for (let i = 0; i < 9; i++) {
    const x = X0 + (i + 0.5) * ((X1 - X0) / 9);
    paper(back, poly(cut(rect(x, -H, W * 0.022, H * 2.2), 600 + i, 0.6, 16)), { P, fill: shade(ROOM.wall, -0.18), rim: shade(ROOM.wall, 0.15), thick: 3, shadow: { dx: 16, dy: 6, b: 7, op: 0.3 }, shadowCol: '#0b1013' });
  }
  pipe(back, P, X0, X1, H * pick({ landscape: 0.1, portrait: 0.12 }), 26 * u, ROOM.pipe, 3);
  pipe(back, P, X0, X1, H * pick({ landscape: 0.17, portrait: 0.16 }), 16 * u, shade(ROOM.pipe, -0.15), 7);
  // gauges + valve wheels on the back wall (no text, no glow)
  const gx = pick({ landscape: [0.56, 0.64, 1.0], portrait: [0.12, 0.3, 0.86] }), gy = H * pick({ landscape: 0.3, portrait: 0.47 });
  gx.forEach((f, i) => gauge(back, P, W * f, gy + (i % 2) * 14 * u, 26 * u, -0.6 + i * 0.5, 950 + i, '#e2d7bd'));
  wheel(back, P, W * pick({ landscape: 1.12, portrait: 0.36 }), gy + 20 * u, 44 * u, '#7c3a2c', 900);
  // the lamp (the scene's key light, upper left): caged bulb on a bracket — an object, not a glow
  const lamp = svg('g', { 'data-name': '3 Caged lamp (key light)' }, back);
  const lx = W * pick({ landscape: 0.06, portrait: 0.1 }), ly = H * pick({ landscape: 0.24, portrait: 0.22 });
  paper(lamp, poly(rect(lx - 4 * u, ly - 60 * u, 8 * u, 50 * u)), { P, fill: '#3a3f40', thick: 1.5 });
  paper(lamp, poly(ellipse(lx, ly, 22 * u, 26 * u, 18)), { P, fill: '#efe2bd', thick: 2, shadow: { dx: 12, dy: 8, b: 4, op: 0.35 } });
  for (let k = -2; k <= 2; k++) svg('path', { d: `M${lx + k * 8 * u},${ly - 24 * u} Q${lx + k * 11 * u},${ly} ${lx + k * 8 * u},${ly + 24 * u}`, stroke: '#2c3133', 'stroke-width': 2.2 * u, fill: 'none' }, lamp);
  // floor (deck plates)
  const floor = cam.layer('3 Deck', 0.7);
  paper(floor, poly(rect(X0, fY, X1 - X0, H * 2)), { P, fill: ROOM.floor, rim: '#6b7275', thick: 4 * u, shadow: false, light: 0.7 });
  for (let x = X0; x < X1; x += 120 * u) svg('path', { d: `M${x},${fY + 4 * u} L${x - 60 * u},${H * 1.5}`, stroke: '#1d2123', 'stroke-width': 1.5 * u }, floor);

  // torpedo on its cradle
  const tl = cam.layer('3A Torpedo layer', 0.75);
  const tcx = W * pick({ landscape: 0.27, portrait: 0.5 }), tcy = H * pick({ landscape: 0.6, portrait: 0.38 }), tlen = W * pick({ landscape: 0.44, portrait: 0.86 });
  // tube door (round hatch, open) behind the nose
  const tr = tlen * 0.055;
  paper(tl, poly(cut(ellipse(tcx - tlen * 0.56, tcy, tr * 1.9, tr * 1.9, 30), 2100, 0.4, 8)), { P, fill: '#4a5458', thick: 3, shadow: { dx: 14, dy: 9, b: 7, op: 0.4 }, shadowCol: '#0b1013', name: '3A Torpedo tube' });
  svg('path', { d: poly(ellipse(tcx - tlen * 0.56, tcy, tr * 1.35, tr * 1.35, 30)), fill: '#14191b' }, tl);
  const legs = [0.25, 0.72].map(f => tcx - tlen / 2 + tlen * f);
  const torp = torpedo(tl, P, tcx, tcy, tlen);
  const footY = H * pick({ landscape: 0.86, portrait: 0.5 });
  if (L.portrait) paper(tl, poly(cut(rect(tcx - tlen * 0.58, footY - 4 * u, tlen * 1.16, 16 * u), 2390, 0.4, 12)), { P, fill: '#4b5357', rim: '#8b9497', thick: 3, shadow: { dx: 16, dy: 8, b: 4, op: 0.45 }, shadowCol: '#0b1013', name: '3A Torpedo rack shelf' });
  for (const lx2 of legs) {
    paper(tl, poly(cut(rect(lx2 - 7 * u, tcy + tr * 0.5, 14 * u, footY - tcy - tr * 0.5), 2200 + lx2, 0.3, 8)), { P, fill: '#353c3f', thick: 2, shadow: { dx: 16, dy: 6, b: 4, op: 0.4 }, shadowCol: '#0b1013', name: '3A Cradle post' });
    const sad = [...ellipse(lx2, tcy, tr * 1.25, tr * 1.25, 14, 0, Math.PI)].reverse();
    paper(tl, poly(cut([[lx2 - tr * 1.35, tcy + tr * 0.1], ...ellipse(lx2, tcy, tr * 1.08, tr * 1.08, 14, Math.PI, 0), [lx2 + tr * 1.35, tcy + tr * 0.1], ...sad], 2300 + lx2, 0.3, 6)), { P, fill: '#4b5357', thick: 2.4, shadow: { dx: 14, dy: 6, b: 4, op: 0.4 }, shadowCol: '#0b1013', name: '3A Cradle saddle' });
    paper(tl, poly(cut(rect(lx2 - 46 * u, footY - 8 * u, 92 * u, 12 * u), 2350 + lx2, 0.3, 8)), { P, fill: '#353c3f', thick: 2, shadow: { dx: 12, dy: 4, b: 2, op: 0.4 }, shadowCol: '#0b1013' });
  }

  // officers + chart table
  const ol = cam.layer('3B Officers (paper figures)', 1.0);
  const ox = pick({ landscape: [0.63, 0.77, 0.91], portrait: [0.2, 0.5, 0.8] }), os = pick({ landscape: 1.49, portrait: 1.65 }) * u, oy = fY + H * 0.055 - 12.2 * 24 * os;
  const names = ['3B Officer 1 (captain, staged)', '3B Officer 2 (political officer, staged)', '3B Officer 3 (Arkhipov, staged)'];
  let dim = null;
  const offs = ox.map((f, i) => {
    let layer = ol;
    if (heroApart && i === 2) { // scene 4: the third officer stands on his own, nearer plane; a dimmer card sits between
      const dl = cam.layer('4 Room light dimmer', 1.04);
      dim = svg('path', { d: poly(rect(-W * 2, -H * 2, W * 5, H * 5)), fill: '#0b0f12', opacity: 0, 'data-name': '4 Dimmer' }, dl);
      layer = cam.layer('4A Arkhipov plane', 1.08);
    }
    return officer(layer, P, W * f + (i === 2 ? 6 * u : 0), oy + (i === 1 ? -6 * u : i === 2 ? 4 * u : 0), os * (i === 1 ? 0.97 : 1), { face: -1, coat: ROOM.coat[i], cap: ROOM.cap, skin: ROOM.skin, seed: 700 + i * 60, name: names[i] });
  });
  const fg = null;
  return { offs, torp, tcx, tcy, tlen, ox, oy, os, fg, dim, fY };
}

export default function (root, ctx) {
  const L = ctx.layout, W = ctx.width, H = ctx.height, u = L.unit, P = 's3';
  root.style.background = '#1b1916';
  defs(root, P);
  const cam = makeCamera(root, W, H, '3 Camera world');
  const R = buildRoom(cam, P, W, H, L, u);

  const tNuc = wt(ctx, 'nuclear', 0, 1.16), tCut = wt(ctx, 'To', 0, 2.41) - 0.12, tThree = wt(ctx, 'three', 0, 3.19);
  const tTwo = wt(ctx, 'Two', 0, 4.97), tSay = wt(ctx, 'say', 0, 5.23), tYes = wt(ctx, 'yes.', 0, 5.48);
  const s = L.safe;
  const torTag = label(root, L, { name: '3A Tag: torpedo', x: s.x, y: L.pick({ landscape: s.y, portrait: s.y + L.px(30) }), rot: -1.1, lines: [{ text: 'On board', kind: 'kicker' }, { text: 'A nuclear torpedo' }] });
  const vote = voteCard(root, L, { name: '3B Vote card', x: L.pick({ landscape: s.x, portrait: s.x }), y: L.pick({ landscape: s.y, portrait: s.y + L.px(30) }), rot: -0.8, kicker: 'To fire: all three agree' });
  const staged = label(root, L, { name: '3B Tag: staged', x: s.x + s.w, y: L.pick({ landscape: s.y, portrait: s.y + s.h }), ax: 1, ay: L.pick({ landscape: 0, portrait: 1 }), rot: 0.8, lines: [{ text: 'Figures staged — not portraits', kind: 'note' }] });
  const g = grade(root, L, { vignette: 0, warm: 0.05 });
  ctx.sfx('cloth-jacket-01', tTwo - 0.05, { volume: 0.25 });

  // shot 3A centres the torpedo; shot 3B frames the three officers (subject plane)
  const pT = 0.75, cxT = (R.tcx - W / 2) / pT, cyT = (R.tcy - H / 2) / pT;
  const midO = W * (R.ox[0] + R.ox[2]) / 2;
  return {
    update(t) {
      sceneIn(root, ctx, t);
      if (t < tCut) {
        const z = L.pick({ landscape: 1.55, portrait: 0.98 }) * (1 + t * 0.012);
        cam.apply({ unit: u, x: cxT * 0.92 + t * 4 * u, y: cyT, zoom: z, focusP: 0.75, blur: 12 });
      } else {
        const k = t - tCut;
        const z = L.pick({ landscape: 1.0, portrait: 1.0 }) * (1 + k * 0.011);
        const fx = L.pick({ landscape: (midO - W / 2) * 0.55, portrait: 0 });
        cam.apply({ unit: u, x: fx + k * 5 * u, y: L.pick({ landscape: 0, portrait: H * 0.04 }), zoom: z, focusP: 1.0, blur: 5 });
      }
      // arms: two officers raise their arm (yes); the third stays still
      const raise = (t0, i) => {
        const p = ease.inOutCubic(progress(t, t0, t0 + 0.24));
        R.offs[i].setArm(8 + p * 166 + noise1(t * 0.8, i) * 1.2);
      };
      raise(tSay - 0.05, 0); raise(tYes - 0.08, 1);
      R.offs[2].setArm(8 + noise1(t * 0.6, 7) * 0.8);
      torTag.update(t, tNuc - 0.12, tCut - 0.32);
      vote.update(t, tThree - 0.1, { ticks: [tSay - 0.03, tYes - 0.06] });
      staged.update(t, tCut + 0.4);
      g.update(t + ctx.start);
    },
  };
}
