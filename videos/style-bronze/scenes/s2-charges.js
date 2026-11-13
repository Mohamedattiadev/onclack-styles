// 2 · PRESSURE. KNOW: US ships drop practice depth charges; Moscow silent for days. FEEL: being hunted, alone.
// SEE: next panel of the frieze. Ships ride the scroll sea; charges fall in a column (relief shows motion by repeating
//      the object, one cast after another); pressure rings ring the submarine; at the top, a cast line: MOSCOW — SILENT.
// 2A (0–2.6 s) dolly along to the ships, they rise and are rubbed.                      truth: VO (ship type generic)
// 2B (2.6–4.0 s) push in: charges cast one under another, rings around the hull; booms.   truth: "practice" charges (signal charges) — hedged in README
// 2C (4.0–6.6 s) pull back up: MOSCOW — SILENT FOR DAYS rises, the line under it stays empty.
import { keyframes, ease, svg } from '/onclack-styles/engine/lib/anim.js';
import { makePlaque, bead, waveBand, deepWater } from '../shared/bronze.js';
import { submarine, destroyer, charge, rings } from '../shared/shapes.js';

export default function (root, ctx) {
  const B = makePlaque(root, ctx, { seed: 9, name: '2 · Bronze panel: ships + charges' });
  const { W, H, L, u } = B;
  const port = L.portrait, sf = L.safe;
  const g0 = ctx.start;

  const fr = B.form('2 Frame moulding', -1);
  bead(fr, 26 * u, 26 * u, W - 52 * u, H - 52 * u, 18 * u, 16 * u, u);

  const seaY = sf.y + sf.h * (port ? 0.36 : 0.36);
  const sea = B.form('2 Sea scroll', -1);
  waveBand(sea, -300 * u, W + 300 * u, seaY, (port ? 26 : 30) * u, u, { seed: 6, lv: 0.5 });
  deepWater(sea, -200 * u, W + 200 * u, seaY + 40 * u, H + 200 * u, u, 8);

  // three ships, varied size/height (near = higher relief)
  const ships = port
    ? [[0.62, 230, 0.46, -0.3], [0.27, 440, 0.72, 0.3], [0.86, 330, 0.6, 0.0]]
    : [[0.17, 470, 0.62, 0.0], [0.5, 560, 0.74, 0.3], [0.83, 400, 0.55, -0.3]];
  ships.forEach(([fx, len, lv, v], i) => {
    const g = B.form(`2A US destroyer ${i + 1}`, 7.95 + i * 0.22, 0.6);
    destroyer(g, sf.x + sf.w * fx, seaY - 4 * u, len * u, lv, v);
  });
  B.rub(sf.x + sf.w * 0.5, seaY - 50 * u, sf.w * 0.45, 70 * u, 8.6, 1.2, { n: port ? 4 : 6, seed: 21, name: '2A Rub: ships' });

  // submarine deep
  const subY = sf.y + sf.h * (port ? 0.76 : 0.82);
  const subX = W * (port ? 0.5 : 0.5), subLen = (port ? 760 : 820) * u;
  const subG = B.form('2B Submarine', -1);
  submarine(subG, subX, subY, subLen, 0.4);
  // rubbed already in panel 1 — keep the hull touched (continuity)
  B.rub(subX, subY - 10 * u, subLen * 0.5, 110 * u, -1, 0.1, { n: 5, seed: 12, ang: -6 });

  // depth charges: two columns, each charge cast a little lower and a little later (motion by repetition)
  const cols = port ? [[0.24, 8.8], [0.58, 9.1]] : [[0.22, 8.8], [0.56, 9.1]];
  const cs = (port ? 42 : 38) * u;
  cols.forEach(([fx, t0], c) => {
    for (let k = 0; k < 4; k++) {
      const y = seaY + (subY - seaY) * (0.18 + k * 0.17);
      const g = B.form(`2B Charge ${c + 1}.${k + 1}`, t0 + k * 0.28, 0.35);
      charge(g, sf.x + sf.w * fx + (k % 2 ? 6 : -6) * u, y, cs, 0.62 - k * 0.04, (k * 23 + c * 40) % 60 - 30);
    }
  });
  // pressure rings around the hull, cast at the booms
  [[9.8, 0.36], [10.38, 0.6]].forEach(([t0, fx], i) => {
    const g = B.form(`2B Pressure rings ${i + 1}`, t0, 0.4);
    rings(g, sf.x + sf.w * fx, subY - 20 * u, 70 * u, 4, 44 * u, 0.42);
  });

  // MOSCOW — SILENT (top)
  const tY = sf.y + sf.h * (port ? 0.09 : 0.07);
  const ins = B.form('2C Inscription: Moscow silent (cast, dark until named)', -1);
  const sz = (port ? 64 : 58) * u;
  const opt = { 'letter-spacing': 10 * u, 'fill-opacity': 0.6 };
  const mk = (s, y, size, t0) => {
    B.text(ins, s, W / 2, y, size, opt);
    B.polish(B.text(B.rubs, s, W / 2, y, size, { ...opt, 'fill-opacity': 1, stroke: '#000', 'stroke-width': 2.5 * u }), t0, 0.5);
  };
  if (port) { mk('MOSCOW', tY + sz * 0.4, sz * 1.2, 11.0); mk('SILENT FOR DAYS', tY + sz * 1.55, sz * 0.62, 11.95); }
  else mk('MOSCOW — SILENT FOR DAYS', tY + sz * 0.4, sz, 11.3);
  // the empty sunken line under it: where a message would be
  const blank = B.form('2C Empty message line', 12.4, 0.6, B.sunk);
  svg('rect', { x: W / 2 - (port ? 300 : 360) * u, y: tY + sz * (port ? 1.9 : 0.85), width: (port ? 600 : 720) * u, height: 16 * u, rx: 8 * u, fill: '#000', 'fill-opacity': 0.75 }, blank);

  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -19, fade: 0.6 });
  ctx.sfx('cloth-shake-01', 8.6 - g0, { lu: -24 });
  ctx.sfx('boom-distant-01', 9.8 - g0, { lu: -8 });
  ctx.sfx('boom-slapback-01', 10.38 - g0, { lu: -11 });
  ctx.sfx('drips-wood-01', 11.6 - g0, { lu: -26 });

  return {
    update(t) {
      const g = g0 + t;
      B.slide(t);
      B.tick(g);
      const midY = H * 0.5, deepY = port ? subY - 260 * u : seaY + (subY - seaY) * 0.55;
      const cy = keyframes(g, [[7.2, midY], [8.9, midY - 20 * u], [9.6, deepY], [10.8, deepY], [11.6, midY - 30 * u], [13.8, midY - 20 * u]], ease.inOutSine);
      const sc = keyframes(g, [[7.2, 1.0], [8.9, 1.03], [9.6, port ? 1.12 : 1.18], [10.8, port ? 1.14 : 1.2], [11.6, 1.0], [13.8, 1.03]], ease.inOutSine);
      // booms: a short heavy jolt of the whole camera
      const jolt = (t0) => (g > t0 ? Math.exp(-(g - t0) * 7) * Math.sin((g - t0) * 46) : 0);
      const j = (jolt(9.8) + 0.6 * jolt(10.38)) * 7 * u;
      B.cam(W / 2 + j * 0.4, cy + j, sc);
    },
  };
}
