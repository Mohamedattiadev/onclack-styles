// 3 · CRISIS. KNOW: a nuclear torpedo on board; three officers must agree; two say yes. FEEL: weight, a held breath.
// SEE: the torpedo cast across the top; three recessed niches, one officer in each (own posture, no faces);
//      cast tablets under them: YES, YES rubbed bright — the third tablet stays dark and blank.
// 3A (0–2.9 s) close on the torpedo, it rises and is rubbed; label.               truth: generic torpedo profile
// 3B (2.9–6.9 s) pull back: niches, three officers rise one by one; YES, YES.      truth: VO; who voted how is from later accounts (hedged)
import { keyframes, ease, svg } from '/onclack-styles/engine/lib/anim.js';
import { makePlaque, bead } from '../shared/bronze.js';
import { torpedo, officer } from '../shared/shapes.js';

export default function (root, ctx) {
  const B = makePlaque(root, ctx, { seed: 14, name: '3 · Bronze panel: torpedo + three officers' });
  const { W, H, L, u } = B;
  const port = L.portrait, sf = L.safe;
  const g0 = ctx.start;

  const fr = B.form('3 Frame moulding', -1);
  bead(fr, 26 * u, 26 * u, W - 52 * u, H - 52 * u, 18 * u, 16 * u, u);

  // torpedo
  const tY = sf.y + sf.h * (port ? 0.1 : 0.12);
  const tLen = (port ? 760 : 1180) * u;
  const tg = B.form('3A Nuclear torpedo', 14.35, 0.6);
  torpedo(tg, W / 2 + 20 * u, tY, tLen, 0.68);
  B.rub(W / 2, tY, tLen * 0.48, 70 * u, 14.85, 0.9, { n: port ? 4 : 6, seed: 31, ang: 0, name: '3A Rub: torpedo' });
  const lblSize = (port ? 40 : 40) * u, lblY = tY + tLen * 0.045 + (port ? 78 : 76) * u;
  const lab = B.form('3A Label', 14.9, 0.5);
  B.text(lab, 'NUCLEAR TORPEDO', W / 2, lblY, lblSize, { 'letter-spacing': 12 * u, 'fill-opacity': 0.58 });
  B.polish(B.text(B.rubs, 'NUCLEAR TORPEDO', W / 2, lblY, lblSize, { 'letter-spacing': 12 * u, stroke: '#000', 'stroke-width': 2 * u }), 15.2, 0.5);

  // three recessed niches (arched), sunk into the field
  const nTop = sf.y + sf.h * (port ? 0.27 : 0.31);
  const nH = sf.h * (port ? 0.58 : 0.6);
  const gap = (port ? 18 : 46) * u;
  const nW = port ? (sf.w - 2 * gap) / 3 : sf.w * 0.25;
  const x0 = W / 2 - (3 * nW + 2 * gap) / 2;
  const roles = port ? [['CAPTAIN'], ['POLITICAL', 'OFFICER'], ['CHIEF OF', 'STAFF']] : [['CAPTAIN'], ['POLITICAL OFFICER'], ['CHIEF OF STAFF']];
  const poses = [
    { lean: 6, head: 8, front: port ? [52, 22] : [74, 10], back: [-30, 105], stance: 44 },         // leans in, points at the weapon, other hand on the hip
    { lean: -1.5, head: -5, front: [-30, 13], back: [-34, 15], stance: 24 },     // upright, chin up, hands clasped behind his back
    { lean: 1, head: 12, front: [6, 6], back: [-3, 2], stance: 18 },             // still, head bowed, arms down
  ];
  const tabY = nTop + nH + (port ? 70 : 64) * u;
  for (let i = 0; i < 3; i++) {
    const nx = x0 + i * (nW + gap);
    const r = nW / 2;
    const niche = B.form(`3B Niche ${i + 1}`, -1, 0.5, B.sunk);
    svg('path', { d: `M ${nx} ${nTop + nH} L ${nx} ${nTop + r} A ${r} ${r * 0.9} 0 0 1 ${nx + nW} ${nTop + r} L ${nx + nW} ${nTop + nH} Z`, fill: '#000', 'fill-opacity': 0.55 }, niche);
    const rim = B.form(`3B Niche rim ${i + 1}`, -1, 0.5);
    svg('path', { d: `M ${nx - 8 * u} ${nTop + nH + 8 * u} L ${nx - 8 * u} ${nTop + r} A ${r + 8 * u} ${(r + 8 * u) * 0.9} 0 0 1 ${nx + nW + 8 * u} ${nTop + r} L ${nx + nW + 8 * u} ${nTop + nH + 8 * u}`,
      fill: 'none', stroke: '#fff', 'stroke-opacity': 0.5, 'stroke-width': 9 * u, 'stroke-linejoin': 'round' }, rim);
    // the officer
    const fig = B.form(`3B Officer ${i + 1} · ${roles[i].join(' ').toLowerCase()}`, 16.5 + i * 0.2, 0.6);
    const s = Math.min(nH * 0.72, nW * (port ? 1.85 : 1.5)) / 400;
    officer(fig, nx + nW * (i === 0 ? 0.4 : 0.5), nTop + nH - 18 * u, s, poses[i], { flip: i === 2 ? -1 : 1, lv: 0.5 });
    // role, small, cast in the niche head
    const rs = (port ? 25 : 26) * u;
    roles[i].forEach((w, k) => B.text(fig, w, nx + nW / 2, nTop + r * 0.62 + k * rs * 1.2 - (roles[i].length - 1) * rs * 0.3, rs, { 'letter-spacing': 3 * u, 'fill-opacity': 0.5 }));
    // tablet under the niche
    const tab = B.form(`3B Tablet ${i + 1}`, -1, 0.5);
    const tw = nW * 0.66, th = (port ? 78 : 84) * u;
    svg('rect', { x: nx + nW / 2 - tw / 2, y: tabY - th / 2, width: tw, height: th, rx: 10 * u, fill: '#fff', 'fill-opacity': 0.42 }, tab);
    if (i < 2) {
      const t0 = i ? 18.8 : 18.55;
      const yes = B.form(`3B Vote ${i + 1}: YES`, t0, 0.3);
      const ys = (port ? 52 : 58) * u;
      B.text(yes, 'YES', nx + nW / 2, tabY + ys * 0.36, ys, { 'letter-spacing': 8 * u, 'fill-opacity': 0.5 });
      B.polish(B.text(B.rubs, 'YES', nx + nW / 2, tabY + ys * 0.36, ys, { 'letter-spacing': 8 * u, stroke: '#000', 'stroke-width': 2 * u }), t0 + 0.1, 0.4);
      B.rub(nx + nW / 2, tabY, tw * 0.45, th * 0.75, t0 + 0.05, 0.5, { n: 3, seed: 40 + i, ang: 0 });
    }
  }

  ctx.sfx('footsteps-metal-deck-01', 0.1, { lu: -22 });
  ctx.sfx('cloth-jacket-01', 14.85 - g0, { lu: -22 });
  ctx.sfx('drawer-close-01', 18.55 - g0, { lu: -13 });
  ctx.sfx('drawer-close-01', 18.8 - g0, { lu: -11 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -27, fade: 0.8 });

  return {
    update(t) {
      const g = g0 + t;
      B.slide(t);
      B.tick(g);
      const cy = keyframes(g, [[13.3, port ? H * 0.45 : tY + 150 * u], [15.6, port ? H * 0.47 : tY + 190 * u], [16.6, H / 2], [20.3, H / 2 + 10 * u]], ease.inOutSine);
      const sc = keyframes(g, [[13.3, port ? 1.08 : 1.22], [15.6, port ? 1.1 : 1.26], [16.6, 1.0], [20.3, 1.035]], ease.inOutSine);
      B.cam(W / 2, cy, sc);
    },
  };
}
