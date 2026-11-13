// 3 · CRISIS. KNOW: a nuclear torpedo; three officers must agree; two say yes. FEEL: weight, a held breath.
// SEE: three recessed panels, two with YES pressed under them, the third slot empty.
// 3A (0–2.4 s) INS: the torpedo die bites in, camera close; "NUCLEAR TORPEDO" rises.              truth: RC (profile)
// 3B (2.4–6.9 s) pull back: three panels press in, each officer in his own posture (no faces);
//                YES, YES pressed blind; the third slot stays empty and the lamp leaves it in shade. truth: VO (figures)
// Who voted how is reported mainly from later recollections — hedged in the README.
import { svg, clamp, ease, keyframes, glide } from '/onclack-styles/engine/lib/anim.js';
import { makeSheet, hgt, press, P } from '../shared/relief.js';
import { torpedoPaths, officer } from '../shared/shapes.js';

export default function (root, ctx) {
  const S = makeSheet(root, ctx, { seed: 8, name: '3 · Cotton sheet' });
  const { W, H, L, world, u } = S;
  const port = L.portrait, sf = L.safe;
  const g0 = ctx.start;

  // torpedo
  const tY = L.pick({ landscape: sf.y + sf.h * 0.14, portrait: sf.y + sf.h * 0.1 });
  const tLen = L.pick({ landscape: sf.w * 0.62, portrait: sf.w * 0.9 });
  const tp = torpedoPaths(tLen);
  const torp = svg('g', { 'data-name': '3A Nuclear torpedo', transform: `translate(${W / 2} ${tY})` }, world);
  svg('path', { d: tp.body, fill: hgt(0.5) }, torp);
  // modelled cylinder: a soft raised spine (die cut round, not flat)
  svg('path', { d: `M ${-tLen * 0.44} 0 L ${tLen * 0.44} 0`, stroke: hgt(0.95), 'stroke-width': tp.r * 0.9, 'stroke-linecap': 'round', style: `filter: blur(${tp.r * 0.35}px)` }, torp);
  svg('path', { d: tp.fins + ' ' + tp.prop, fill: hgt(0.5) }, torp);
  svg('path', { d: tp.bands, fill: hgt(0.35) }, torp);
  const tLbl = svg('g', { 'data-name': '3A Label' }, world);
  P.text(tLbl, 'NUCLEAR TORPEDO', W / 2, tY + tp.r + L.pick({ landscape: 66, portrait: 70 }) * u, L.pick({ landscape: 46, portrait: 48 }) * u, 0.8, { 'letter-spacing': 8 * u });

  // three panels
  const pTop = L.pick({ landscape: sf.y + sf.h * 0.36, portrait: sf.y + sf.h * 0.27 });
  const pH = L.pick({ landscape: sf.h * 0.62, portrait: sf.h * 0.56 });
  const gap = L.pick({ landscape: 40, portrait: 22 }) * u;
  const pW = L.pick({ landscape: sf.w * 0.24, portrait: (sf.w - 2 * gap) / 3 });
  const x0 = W / 2 - (3 * pW + 2 * gap) / 2;
  const roles = ['CAPTAIN', 'POLITICAL OFFICER', 'CHIEF OF STAFF'];
  const poses = [
    { lean: 5, tilt: 4, front: [62, 82], back: [-28, 58], legs: [14, -8], stance: 16 },     // leaning in, pointing forward
    { lean: -1.5, tilt: -6, front: [14, -78], back: [-14, 80], legs: [4, -3], stance: 10 },  // upright, arms folded
    { lean: 3, tilt: 18, front: [4, 8], back: [-5, -2], legs: [6, -10], stance: 18 },        // head bowed, arms hanging
  ];
  const panels = roles.map((r, i) => {
    const px = x0 + i * (pW + gap);
    const g = svg('g', { 'data-name': `3B Panel ${i + 1} · ${r.toLowerCase()}` }, world);
    // recessed panel (the die pushes the field down; the figure stands up out of it)
    svg('rect', { x: px, y: pTop, width: pW, height: pH, rx: 6 * u, fill: hgt(-0.22) }, g);
    const frame = svg('rect', { x: px - 8 * u, y: pTop - 8 * u, width: pW + 16 * u, height: pH + 16 * u, rx: 10 * u, fill: 'none', stroke: hgt(-0.5), 'stroke-width': 3 * u, 'data-name': `3B Empty seat ${i + 1}` }, world);
    const figS = Math.min(pH * 0.6, pW * 1.15) / 400;
    const fig = officer(g, { x: px + pW * 0.5 - (i === 0 ? pW * 0.08 : 0), y: pTop + pH * 0.72, s: figS, flip: i === 2 ? -1 : 1, lv: 0.4 + i * 0.03, name: `3B Officer ${i + 1}` });
    fig.pose(poses[i]);
    const roleSize = L.pick({ landscape: 28, portrait: 26 }) * u;
    const role = P.text(g, r, px + pW / 2, pTop + pH * L.pick({ landscape: 0.8, portrait: 0.765 }), roleSize, 0.8, { 'letter-spacing': 2 * u });
    if (port && r.length > 12) { role.textContent = ''; role.setAttribute('font-size', roleSize);
      (r === 'POLITICAL OFFICER' ? ['POLITICAL', 'OFFICER'] : ['CHIEF OF', 'STAFF']).forEach((w, k) => { const ts = svg('tspan', { x: px + pW / 2, dy: k ? roleSize * 1.15 : 0 }, role); ts.textContent = w; }); }
    const yes = svg('g', { 'data-name': `3B Vote ${i + 1}` }, world);
    if (i < 2) P.text(yes, 'YES', px + pW / 2, pTop + pH * 0.955, L.pick({ landscape: 64, portrait: 54 }) * u, 0.85, { 'letter-spacing': 6 * u });
    else svg('rect', { x: px + pW * 0.2, y: pTop + pH * 0.875, width: pW * 0.6, height: pH * 0.1, rx: 4 * u, fill: hgt(-0.55), 'data-name': '3B Empty slot' }, yes);
    return { g, yes, px, frame };
  });

  ctx.sfx('page-turn-01', 0.0, { lu: -17 });
  ctx.sfx('letterpress-manual-01', 13.85 - g0, { lu: -8 });
  ctx.sfx('letterpress-manual-01', 16.5 - g0, { lu: -9 });
  ctx.sfx('drawer-close-01', 18.55 - g0, { lu: -14 });
  ctx.sfx('drawer-close-01', 18.8 - g0, { lu: -12 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -27, fade: 0.8 }); // hull, fainter: we are inside

  return {
    update(t) {
      const g = g0 + t;
      S.enter(t);
      torp.style.opacity = press(g, 13.85);
      tLbl.style.opacity = press(g, 14.45);
      panels.forEach((p, i) => {
        p.g.style.opacity = press(g, 16.5 + i * 0.16);
        p.frame.style.opacity = press(g, 13.85);
        p.yes.style.opacity = i < 2 ? press(g, i ? 18.8 : 18.55) : press(g, 17.4);
      });
      // camera: close on the torpedo, then pull back to the whole sheet
      const pull = glide(g, 15.55, 16.6, 0, 1);
      const z0 = L.pick({ landscape: 1.32, portrait: 1.04 }), sc = z0 + (1 - z0) * pull;
      const c0 = L.pick({ landscape: tY + 20 * u, portrait: H * 0.42 }), cy = c0 + (H / 2 - c0) * pull;
      S.cam(W / 2, cy, sc * (1 + glide(g, 16.6, g0 + ctx.duration, 0, 0.03)));
      // lamp: low along the torpedo from the left, then up and over to the right, leaving panel 3 in shade
      const lx = keyframes(g, [[13.3, -0.25], [15.5, 0.3], [16.6, -0.12], [19.8, -0.2]], ease.inOutSine) * W;
      const ly = keyframes(g, [[13.3, -0.1], [15.5, -0.14], [16.6, 0.25], [19.8, 0.05]], ease.inOutSine) * H;
      S.lamp({ x: lx, y: ly, z: 290, power: 1 });
    },
  };
}
