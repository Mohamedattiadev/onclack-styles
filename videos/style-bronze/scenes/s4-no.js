// 4 · TURN + AFTERMATH. KNOW: the third officer, Vasili Arkhipov, says no; the world learned his name ~40 years later.
// FEEL: quiet resolve, then the weight of being forgotten and found again.
// SEE: the last panel: Arkhipov alone in his niche, a quiet open hand (not raised); a cartouche where NO is CUT INTO
//      the bronze (sunk, the only sunk letters in the frieze); his name is cast below it but stays dark under patina
//      until "forty years later" — then hands rub it bright. The plaque has been touched by many people.
// 4A (0–2.2 s) close on the third niche; name cast, still dark.                 truth: VO
// 4B (2.2–3.3 s) NO sinks into the metal, the cartouche is rubbed bright.        truth: VO (accounts differ in detail — hedged)
// 4C (3.3–6.6 s) pull back; the name is rubbed bright; museum murmur.            truth: "learned his name" ≈ 2002 Havana conference (hedged)
import { keyframes, ease, svg } from '/onclack-styles/engine/lib/anim.js';
import { makePlaque, bead, FONT } from '../shared/bronze.js';
import { officer } from '../shared/shapes.js';

export default function (root, ctx) {
  const B = makePlaque(root, ctx, { seed: 21, name: '4 · Bronze panel: NO + the name' });
  const { W, H, L, u } = B;
  const port = L.portrait, sf = L.safe;
  const g0 = ctx.start;

  const fr = B.form('4 Frame moulding', -1);
  bead(fr, 26 * u, 26 * u, W - 52 * u, H - 52 * u, 18 * u, 16 * u, u);

  // niche + Arkhipov
  const nW = port ? sf.w * 0.5 : sf.w * 0.3, nH = port ? sf.h * 0.46 : sf.h * 0.84;
  const nx = port ? W / 2 - nW / 2 : sf.x + sf.w * 0.06, nTop = port ? sf.y + sf.h * 0.02 : sf.y + sf.h * 0.06;
  const r = nW / 2;
  const niche = B.form('4A Niche (sunk)', -1, 0.1, B.sunk);
  svg('path', { d: `M ${nx} ${nTop + nH} L ${nx} ${nTop + r} A ${r} ${r * 0.9} 0 0 1 ${nx + nW} ${nTop + r} L ${nx + nW} ${nTop + nH} Z`, fill: '#000', 'fill-opacity': 0.55 }, niche);
  const rim = B.form('4A Niche rim', -1);
  svg('path', { d: `M ${nx - 9 * u} ${nTop + nH + 9 * u} L ${nx - 9 * u} ${nTop + r} A ${r + 9 * u} ${(r + 9 * u) * 0.9} 0 0 1 ${nx + nW + 9 * u} ${nTop + r} L ${nx + nW + 9 * u} ${nTop + nH + 9 * u}`,
    fill: 'none', stroke: '#fff', 'stroke-opacity': 0.5, 'stroke-width': 10 * u, 'stroke-linejoin': 'round' }, rim);
  const fig = B.form('4A Vasili Arkhipov (figure, no face)', -1);
  const s = (nH * 0.78) / 400;
  officer(fig, nx + nW * 0.44, nTop + nH - 20 * u, s, { lean: -2, head: 4, front: [30, 58], back: [-4, 4], stance: 26, palm: true }, { lv: 0.5 });
  B.rub(nx + nW * 0.5, nTop + nH * 0.5, nW * 0.32, nH * 0.32, 20.0, 1.2, { n: 4, seed: 51, ang: 80, name: '4A Rub: figure' });

  // cartouche with the sunk NO
  const cW = port ? sf.w * 0.8 : sf.w * 0.5, cH = port ? sf.h * 0.2 : sf.h * 0.42;
  const cx = port ? W / 2 : sf.x + sf.w * 0.69, cy = port ? sf.y + sf.h * 0.63 : sf.y + sf.h * 0.33;
  const cart = B.form('4B Cartouche', -1);
  svg('rect', { x: cx - cW / 2, y: cy - cH / 2, width: cW, height: cH, rx: 24 * u, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.55, 'stroke-width': 14 * u }, cart);
  svg('rect', { x: cx - cW / 2 + 22 * u, y: cy - cH / 2 + 22 * u, width: cW - 44 * u, height: cH - 44 * u, rx: 12 * u, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.4, 'stroke-width': 4 * u }, cart);
  const noSize = cH * (port ? 0.78 : 0.74);
  // a raised plate inside the cartouche; NO is CUT through it (the only cut letters in the frieze)
  const pm = svg('mask', { id: 'brzNoMask' + (port ? 'p' : 'l'), maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, B.defs);
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, pm);
  const cutG = svg('g', {}, pm);
  const noAttrs = { x: cx, y: cy + noSize * 0.35, 'font-size': noSize, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 600, 'letter-spacing': noSize * 0.08 };
  const cut = svg('text', { ...noAttrs, fill: '#000' }, cutG); cut.textContent = 'NO';
  const plate = B.form('4B Raised plate', -1);
  svg('rect', { x: cx - cW / 2 + 40 * u, y: cy - cH / 2 + 40 * u, width: cW - 80 * u, height: cH - 80 * u, rx: 8 * u, fill: '#fff', 'fill-opacity': 0.42, mask: `url(#${pm.id})` }, plate);
  const noSunk = B.form('4B NO (cut into the bronze)', 21.9, 0.3, B.sunk);
  const no = svg('text', { ...noAttrs, fill: '#000', 'fill-opacity': 0.95 }, noSunk);
  no.textContent = 'NO';
  // before the cut, the plate is whole: fade the cut in with the same timing
  B.form('4B Cut timing', 21.9, 0.3, cutG).appendChild(cut);
  B.rub(cx, cy, cW * 0.42, cH * 0.4, 21.92, 0.7, { n: port ? 4 : 5, seed: 61, ang: -10, name: '4B Rub: cartouche' });

  // the name: cast at once, dark, rubbed bright at "forty years later"
  const nmSize = (port ? 58 : 64) * u;
  const nmY = port ? sf.y + sf.h * 0.85 : sf.y + sf.h * 0.73;
  const nmX = cx;
  const nm = B.form('4C Name: Vasili Arkhipov', 20.6, 0.7);
  const nmOpt = { 'letter-spacing': (port ? 6 : 10) * u, 'fill-opacity': 0.55 };
  const nmLines = port ? [['VASILI', nmY - nmSize * 1.05], ['ARKHIPOV', nmY]] : [['VASILI ARKHIPOV', nmY]];
  nmLines.forEach(([str, y]) => {
    B.text(nm, str, nmX, y, nmSize, nmOpt);
    B.polish(B.text(B.rubs, str, nmX, y, nmSize, { ...nmOpt, 'fill-opacity': 1, stroke: '#000', 'stroke-width': 2.5 * u }), 23.75, 0.6);
  });
  const smSize = (port ? 28 : 30) * u;
  const sm = B.form('4C Small line: known c. 2002', 24.2, 0.6);
  B.text(sm, 'B-59 · 1962  —  WIDELY KNOWN ONLY C. 2002', nmX, nmY + smSize * 1.9, smSize, { 'letter-spacing': 4 * u, 'fill-opacity': 0.5 });
  B.rub(nmX, nmY - (port ? nmSize * 0.5 : nmSize * 0.35), (port ? 330 : 470) * u, (port ? 120 : 80) * u, 23.7, 1.3, { n: port ? 4 : 6, seed: 71, ang: 0, name: '4C Rub: name' });

  ctx.ambience('sea-water-close-01', { from: 0, to: 2.6, lu: -28, fade: 0.6 });
  ctx.sfx('breath-close-01', 21.2 - g0, { lu: -17 });
  ctx.sfx('door-close-01', 22.0 - g0, { lu: -11 });
  ctx.sfx('cloth-jacket-01', 22.2 - g0, { lu: -23 });
  ctx.ambience('crowd-museum-murmur-01', { from: 23.2 - g0, to: ctx.duration, lu: -24, fade: 1.2 });
  ctx.sfx('cloth-shake-01', 23.75 - g0, { lu: -24 });

  return {
    update(t) {
      const g = g0 + t;
      B.slide(t);
      B.tick(g);
      const fx = nx + nW / 2, fy = nTop + nH * 0.5;
      const k = [[19.7, 0], [21.6, 0.08], [22.2, 1], [23.2, 1.05], [24.3, 2], [27, 2.03]];
      const p = keyframes(g, k, ease.inOutSine);
      const pts = [[fx, fy, port ? 1.18 : 1.32], [port ? W / 2 : W * 0.55, port ? (fy + cy) / 2 + 130 * u : H * 0.47, port ? 1.06 : 1.06], [W / 2, H / 2, 1.0]];
      const i = Math.min(1, Math.floor(p)), f = Math.min(1, p - i);
      const a = pts[i], b = pts[i + 1];
      B.cam(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
    },
  };
}
