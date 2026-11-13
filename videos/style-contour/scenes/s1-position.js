// SCENE 1 overlay — "hides DEEP in the sea": a depth gauge (data, from ETOPO1) that runs down to the seabed under the
// boat while the map's contour lines tighten around it. Mono counter, tabular figures; ink only (a fact, not a side).
import { el, svg, progress, lerp } from '/onclack-styles/engine/lib/anim.js';
import { C, LW, wordAt, LEAD, enterP, life, tok, fmtM, loadMap } from '../shared/contour.js';

export default async function (root, ctx) {
  const L = ctx.layout, px = L.px, s = L.safe, u = L.unit;
  const data = await loadMap(ctx);
  const seabed = data.facts.sub.seabed; // −5,489 m
  const wt = (w, n) => wordAt(ctx.words, w, n);
  const T = { in: wt('deep') - LEAD - 0.1, run0: wt('deep') - LEAD, run1: wt('sea') + 0.3, out: wt('Above') - 0.25 };

  // geometry: landscape = right edge column; portrait = left edge (the right edge belongs to the Shorts buttons)
  const x = L.portrait ? s.x + px(8) : s.x + s.w - px(250);
  const y0 = L.portrait ? L.height * 0.6 : s.y + s.h * 0.24, y1 = L.portrait ? L.height * 0.76 : s.y + s.h * 0.86;
  const zMax = 6000, yOf = z => lerp(y0, y1, -z / zMax);

  const g = svg('svg', { width: L.width, height: L.height, style: { position: 'absolute', inset: 0, overflow: 'visible' }, 'data-name': '1B Depth gauge' }, root);
  const axis = svg('path', { stroke: C.ink, 'stroke-width': LW.line * u, fill: 'none' }, g);
  const ticks = svg('path', { stroke: C.ink, 'stroke-width': LW.hair * u, fill: 'none' }, g);
  const fill = svg('rect', { x: x - px(5), width: px(10), fill: C.ink, 'fill-opacity': 0.12 }, g);
  const mark = svg('path', { fill: C.ink }, g);
  const lbls = [0, -2000, -4000, -6000].map(z => ({ z, d: el('div', { class: 'gauge-lbl ov', 'data-name': `Gauge tick ${z}` }, root, z === 0 ? 'sea level' : fmtM(z)) }));
  const head = el('div', { class: 'kicker ov', 'data-name': '1B Gauge title', style: { fontSize: px(24) + 'px' } }, root, 'Seabed below B-59');
  const val = el('div', { class: 'gauge-val ov', 'data-name': '1B Gauge reading' }, root);
  const src = el('div', { class: 'gauge-lbl ov', 'data-name': '1B Gauge source' }, root, 'ETOPO1 · NOAA');

  return {
    update(t, p, gt = ctx.start + t) {
      const o = life(gt, T.in, T.out, 14, 10);
      root.style.opacity = o.toFixed(3);
      root.style.display = o < 0.005 ? 'none' : '';
      if (o < 0.005) return;
      const grow = tok.enter(progress(gt, T.in, T.in + 0.5));
      axis.setAttribute('d', `M${x} ${y0}V${lerp(y0, y1, grow)}`);
      ticks.setAttribute('d', [0, -1000, -2000, -3000, -4000, -5000, -6000].map(z => `M${x} ${yOf(z)}h${px(z % 2000 ? 10 : 18)}`).join(''));
      // the reading falls at constant speed (it is a measurement), eased only at the ends
      const r = progress(gt, T.run0, T.run1);
      const re = r < 0.12 ? r * r / 0.24 : r > 0.88 ? 1 - (1 - r) ** 2 / 0.24 : r - 0.06;
      const z = seabed * Math.min(1, re / 0.88);
      const ym = yOf(z);
      fill.setAttribute('y', y0); fill.setAttribute('height', Math.max(0, ym - y0));
      const a = px(16);
      mark.setAttribute('d', `M${x - px(8)} ${ym}l${-a} ${-a * 0.6}v${a * 1.2}Z`);
      const side = L.portrait ? 1 : -1; // labels away from the screen edge
      for (const lb of lbls) {
        const w = lb.d.offsetWidth, h = lb.d.offsetHeight;
        lb.d.style.transform = `translate(${(x + px(28)).toFixed(1)}px, ${(yOf(lb.z) - h / 2).toFixed(1)}px)`;
        lb.d.style.opacity = (0.9 * enterP(gt, T.in + 0.1, 14)).toFixed(3);
        void w; void side;
      }
      const clampX = el => Math.min(x, s.x + s.w - el.offsetWidth);
      head.style.transform = `translate(${clampX(head).toFixed(1)}px, ${(y0 - px(110)).toFixed(1)}px)`;
      val.textContent = `${fmtM(z)} m`;
      const vw = val.offsetWidth, vh = val.offsetHeight;
      const vx = L.portrait ? x + px(28) + px(150) : x - px(36) - vw;
      val.style.transform = `translate(${vx.toFixed(1)}px, ${(ym - vh / 2).toFixed(1)}px)`;
      val.style.textShadow = `0 0 ${px(5)}px ${C.bone}, 0 0 ${px(5)}px ${C.bone}`;
      src.style.transform = `translate(${clampX(src).toFixed(1)}px, ${(y0 - px(70)).toFixed(1)}px)`;
    },
  };
}
