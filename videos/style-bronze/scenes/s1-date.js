// 1 · SETUP. KNOW: 27 Oct 1962, a Soviet submarine deep in the sea near Cuba. FEEL: a monument, a calm sea hiding something.
// SEE: the head panel of a cast bronze frieze: the date in raised letters (rubbed bright), the sea as a running scroll,
//      Cuba's hills on the horizon, and far below, in lower relief (= farther), the submarine.
// 1A (0–3.6 s) close on the date; rubs polish it word by word.                                      truth: date (sourced)
// 1B (3.6–7.7 s) camera sinks below the scroll waves; the submarine rises out of the metal, gets rubbed.  truth: VO (profile is generic)
import { glide, keyframes, ease } from '/onclack-styles/engine/lib/anim.js';
import { makePlaque, bead, waveBand, deepWater } from '../shared/bronze.js';
import { submarine } from '../shared/shapes.js';

export default function (root, ctx) {
  const B = makePlaque(root, ctx, { seed: 4, name: '1 · Bronze panel: date + sea' });
  const { W, H, L, u, relief } = B;
  const port = L.portrait, sf = L.safe;
  const g0 = ctx.start;

  // frame moulding
  const fr = B.form('1 Frame moulding', -1);
  bead(fr, 26 * u, 26 * u, W - 52 * u, H - 52 * u, 18 * u, 16 * u, u);

  // date
  const dateG = B.form('1A Date (raised letters)', g0 - 1);
  const polishG = [];
  const lines = port ? [['27', 260, 0.205], ['OCTOBER', 118, 0.305], ['1962', 200, 0.44]] : [['27 OCTOBER 1962', 132, 0.215]];
  lines.forEach(([s, size, fy], i) => {
    const y = sf.y + sf.h * fy;
    const opt = { 'letter-spacing': (port ? 10 : 14) * u, 'fill-opacity': 0.62 };
    B.text(dateG, s, W / 2, y, size * u, opt);
    // polished letter faces: the same glyphs, a touch thinner, in the rub mask
    const face = B.text(B.rubs, s, W / 2, y, size * u, { ...opt, 'fill-opacity': 1, stroke: '#000', 'stroke-width': 3 * u, 'paint-order': 'normal' });
    polishG.push(B.polish(face, [0.6, 1.1, 2.1][i] ?? 0.6, 0.6));
  });
  // small cast rule under the date
  const ruleY = sf.y + sf.h * (port ? 0.475 : 0.275);
  svg2(dateG, `M ${W / 2 - 220 * u} ${ruleY} L ${W / 2 + 220 * u} ${ruleY}`, 0.5, 5 * u);
  B.rub(W / 2, sf.y + sf.h * (port ? 0.31 : 0.19), (port ? 420 : 800) * u, (port ? 300 : 150) * u, 0.55, 2.2, { n: port ? 5 : 9, seed: 3, name: '1A Rub: date' });

  // sea: surface scroll + deep water
  const seaY = sf.y + sf.h * (port ? 0.56 : 0.47);
  const sea = B.form('1B Sea scroll', g0 - 1);
  waveBand(sea, -300 * u, W + 300 * u, seaY, (port ? 30 : 34) * u, u, { seed: 2, lv: 0.5 });
  deepWater(sea, -200 * u, W + 200 * u, seaY + 40 * u, H + 200 * u, u, 5);
  // Cuba on the horizon (low hills, lowest relief = far)
  const cuba = B.form('1B Cuba hills', 5.95, 0.7);
  const cx0 = port ? W * 0.52 : W * 0.66, cx1 = W + 80 * u, hy = seaY - 6 * u;
  const hill = `M ${cx0} ${hy} C ${cx0 + 60 * u} ${hy - 30 * u}, ${cx0 + 120 * u} ${hy - 58 * u}, ${cx0 + 200 * u} ${hy - 52 * u} `
    + `C ${cx0 + 260 * u} ${hy - 48 * u}, ${cx0 + 300 * u} ${hy - 86 * u}, ${cx0 + 380 * u} ${hy - 80 * u} C ${cx0 + 470 * u} ${hy - 74 * u}, ${cx1 - 80 * u} ${hy - 40 * u}, ${cx1} ${hy - 36 * u} L ${cx1} ${hy} Z`;
  svg2(cuba, hill, 0.3, 0, true);
  const cubaLbl = B.text(cuba, 'CUBA', cx0 + (port ? 250 : 300) * u, hy - (port ? 108 : 112) * u, (port ? 54 : 50) * u, { 'letter-spacing': 12 * u, 'fill-opacity': 0.55 });
  B.polish(B.text(B.rubs, 'CUBA', cubaLbl.getAttribute('x'), cubaLbl.getAttribute('y'), (port ? 54 : 50) * u, { 'letter-spacing': 12 * u }), 6.5, 0.5);

  // submarine, deep: lower relief
  const subY = sf.y + sf.h * (port ? 0.8 : 0.79);
  const subLen = (port ? 820 : 900) * u;
  const sub = B.form('1B Soviet submarine (low relief)', 3.75, 0.8);
  submarine(sub, W * (port ? 0.47 : 0.44), subY, subLen, 0.4);
  B.rub(W * (port ? 0.47 : 0.44), subY - 10 * u, subLen * 0.5, 120 * u, 4.3, 1.4, { n: 6, seed: 11, ang: -6, name: '1B Rub: submarine' });

  ctx.ambience('sea-wash-calm-01', { from: 0, to: ctx.duration, lu: -15, fade: 0.6 });
  ctx.sfx('cloth-jacket-01', 0.55, { lu: -19 });
  ctx.sfx('cloth-shake-01', 4.3, { lu: -24 });

  function svg2(g, d, o, w, filled = false) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    if (filled) { p.setAttribute('fill', '#fff'); p.setAttribute('fill-opacity', o); }
    else { p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#fff'); p.setAttribute('stroke-opacity', o); p.setAttribute('stroke-width', w); p.setAttribute('stroke-linecap', 'round'); }
    g.appendChild(p); return p;
  }

  return {
    update(t) {
      const g = g0 + t;
      B.tick(g);
      // camera: close on the date → whole panel → sink a little toward the submarine
      const dY = sf.y + sf.h * (port ? 0.31 : 0.2);
      const cy = keyframes(g, [[0, dY], [2.9, dY + 40 * u], [4.0, H * 0.5], [7.7, H * (port ? 0.56 : 0.56)]], ease.inOutSine);
      const sc = keyframes(g, [[0, port ? 1.12 : 1.3], [2.9, port ? 1.08 : 1.22], [4.0, 1.02], [7.7, 1.06]], ease.inOutSine);
      const cx = W / 2 + glide(g, 0, 7.7, -20 * u, 20 * u);
      B.cam(cx, cy, sc);
    },
  };
}
