// SCENE 2 overlay — the map "folds down" into a section A–A′ along 24°N (real ETOPO1 profile).
// The card's x-axis is the map's x-axis: every point of the profile sits exactly under its spot on the map,
// recomputed from the live camera each frame, so the card glides with the survey camera.
// US ships (side A, cobalt, solid) on the surface; practice charges fall (solid cobalt) and burst near B-59
// (side B, orange); each burst shakes the boat. Then the card leaves before "Moscow".
import { el, svg, clamp, progress, lerp, shake } from '/onclack-styles/engine/lib/anim.js';
import {
  C, LW, P, CARD, wordAt, LEAD, enterP, exitP, life, tok, fmtM, loadMap, makeCamera, chargeBursts, CHARGE_FALL,
} from '../shared/contour.js';

export default async function (root, ctx) {
  const L = ctx.layout, px = L.px, s = L.safe, u = L.unit;
  const data = await loadMap(ctx);
  const cam = makeCamera(L, ctx.words);
  const wt = (w, n) => wordAt(ctx.words, w, n);
  const bursts = chargeBursts(ctx.words);
  const T = { in: wt('Above') - LEAD + 0.1, out: bursts[2] + 0.4, seabed: wt('practice') - 0.1 };
  const sec = data.facts.section, seabed = data.facts.sub.seabed;

  // card box (screen space)
  const box = L.portrait
    ? { x: s.x, y: L.height * 0.47, w: s.w, h: L.height * 0.3 }
    : { x: s.x, y: L.height * 0.565, w: s.w, h: L.height * 0.37 };
  const pad = px(24), headH = px(58);
  const plot = { x: box.x + px(118), y: box.y + headH + px(26), w: box.w - px(118) - pad, h: box.h - headH - px(26) - pad };
  const zMax = 6000, yOf = z => plot.y + plot.h * clamp(-z / zMax, -0.2, 1.05);

  const card = el('div', { 'data-name': '2A Section card', style: { position: 'absolute', left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px', background: CARD,
    boxShadow: `0 ${px(2)}px ${px(4)}px rgba(28,30,34,0.16), 0 ${px(16)}px ${px(40)}px rgba(28,30,34,0.10)` } }, root);
  const title = el('div', { class: 'card-title ov', 'data-name': '2A Card title' }, root);
  title.innerHTML = '<b>Section A–A′</b> along 24°N';
  const note = el('div', { class: 'card-note ov', 'data-name': '2A Card note' }, root);

  const g = svg('svg', { width: L.width, height: L.height, style: { position: 'absolute', inset: 0, overflow: 'visible' } }, root);
  const defs = svg('defs', {}, g);
  const clip = svg('clipPath', { id: 'sec-clip' }, defs);
  svg('rect', { x: plot.x, y: plot.y - px(60), width: plot.w, height: plot.h + px(60) }, clip);
  const hatch = svg('pattern', { id: 'sec-hatch', width: px(7), height: px(7), patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  svg('path', { d: `M0 0V${px(7)}`, stroke: C.grey, 'stroke-width': LW.hair * u }, hatch);
  const plotG = svg('g', { 'clip-path': 'url(#sec-clip)', 'data-name': '2A Profile' }, g);
  const grid = svg('path', { stroke: C.ink, 'stroke-opacity': 0.12, 'stroke-width': LW.hair * u, fill: 'none' }, plotG);
  const ground = svg('path', { fill: 'url(#sec-hatch)', stroke: 'none' }, plotG);
  const groundLine = svg('path', { fill: 'none', stroke: C.ink, 'stroke-width': LW.line * u, 'stroke-linejoin': 'round' }, plotG);
  const surface = svg('path', { stroke: C.ink, 'stroke-width': LW.line * u, fill: 'none' }, g);
  const yTicks = [0, -2000, -4000, -6000].map(z => el('div', { class: 'card-note ov', 'data-name': `2A Depth axis ${z}` }, root, z === 0 ? '0 m' : fmtM(z)));

  // the measured water column under the boat (dimension line, ink) and its value
  const dim = svg('path', { stroke: C.ink, 'stroke-width': LW.hair * u, fill: 'none' }, g);
  const dimLbl = el('div', { class: 'card-big ov', 'data-name': '2A Water below B-59' }, root);
  dimLbl.innerHTML = `${fmtM(-seabed)} m <span style="font-weight:400;color:#6f6a5e">of water below</span>`;

  // ships + charges (cobalt, solid) and the boat (orange) on the section
  const shipLon = [P.sub.lon - 0.62, P.sub.lon + 0.55];
  const ships = shipLon.map((lon, i) => svg('path', { fill: C.cobalt, 'data-name': `2A US ship ${i + 1}` }, g));
  const fromLon = [shipLon[0], shipLon[1], shipLon[0] + 0.3];
  const charges = bursts.map((tb, i) => ({
    tb, lon: fromLon[i], dx: [-0.07, 0.08, -0.02][i],
    line: svg('path', { stroke: C.cobalt, 'stroke-width': LW.line * u, fill: 'none' }, g),
    dot: svg('circle', { r: px(5), fill: C.cobalt }, g),
    ring: svg('circle', { fill: 'none', stroke: C.cobalt, 'stroke-width': LW.line * u }, g),
    ring2: svg('circle', { fill: 'none', stroke: C.cobalt, 'stroke-width': LW.hair * u }, g),
  }));
  const boat = svg('g', { 'data-name': '2A B-59 on section' }, g);
  svg('path', { d: `M${-px(26)} 0 C${-px(22)} ${-px(8)} ${px(14)} ${-px(9)} ${px(28)} 0 C${px(14)} ${px(8)} ${-px(22)} ${px(8)} ${-px(26)} 0Z`, fill: C.signal, stroke: C.ink, 'stroke-width': LW.line * u }, boat);
  svg('path', { d: `M${-px(2)} ${-px(7)}h${px(10)}l${-px(2)} ${-px(8)}h${-px(6)}Z`, fill: C.signal, stroke: C.ink, 'stroke-width': LW.hair * u }, boat);
  const boatLbl = el('div', { class: 'card-note ov', 'data-name': '2A B-59 label (depth approx.)', style: { color: C.ink } }, root);
  boatLbl.innerHTML = '<span class="key orange" style="width:0.7em;height:0.7em;display:inline-block;margin-right:0.4em"></span>B-59 <span style="color:#6f6a5e">depth approx.</span>';
  const pA = el('div', { class: 'secend ov', 'data-name': '2A End A' }, root, 'A');
  const pB = el('div', { class: 'secend ov', 'data-name': '2A End A′' }, root, 'A′');

  return {
    update(t, p, gt = ctx.start + t) {
      const ein = enterP(gt, T.in, 18), eout = exitP(gt, T.out, 12);
      const o = Math.min(ein, 1 - eout);
      root.style.display = o <= 0.002 ? 'none' : '';
      if (o <= 0.002) return;
      // slides up from the bottom edge (a card put down on the map), leaves downward
      const dy = (1 - ein) * px(70) + eout * px(50);
      root.style.transform = `translateY(${dy.toFixed(2)}px)`;
      root.style.opacity = Math.min(1, ein * 1.6, 1 - eout).toFixed(3);

      const cm = cam(gt);
      const X = lon => cm.projectLL({ lon, lat: 24 })[0];
      // horizontal / vertical scale → honest vertical exaggeration figure
      const kmPerPx = (111.32 * Math.cos(24 / 57.3)) / cm.k * Math.cos(24 / 57.3);
      const mPerPxV = zMax / plot.h;
      note.textContent = `ETOPO1 · vertical scale ×${Math.round(kmPerPx * 1000 / mPerPxV)}`;

      title.style.transform = `translate(${box.x + pad}px, ${box.y + pad * 0.8}px)`;
      note.style.transform = `translate(${(box.x + box.w - pad - note.offsetWidth).toFixed(1)}px, ${(box.y + pad * 0.8 + px(6)).toFixed(1)}px)`;
      for (const [i, tk] of yTicks.entries()) {
        const z = [0, -2000, -4000, -6000][i];
        tk.style.transform = `translate(${(plot.x - px(14) - tk.offsetWidth).toFixed(1)}px, ${(yOf(z) - tk.offsetHeight / 2).toFixed(1)}px)`;
      }
      // profile draws left → right from the section's start at constant speed (eased ends)
      const draw = tok.move(progress(gt, T.in + 0.1, T.in + 0.9));
      const xa = X(sec.from.lon), xb = X(sec.to.lon), xEnd = lerp(xa, xb, draw);
      let d = '', dl = '';
      for (const [lon, z] of sec.samples) {
        const x = X(lon); if (x > xEnd) break;
        const y = yOf(Math.min(z, 0));
        d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      dl = d;
      ground.setAttribute('d', d ? d + `L${xEnd.toFixed(1)} ${plot.y + plot.h + px(40)}L${xa.toFixed(1)} ${plot.y + plot.h + px(40)}Z` : '');
      groundLine.setAttribute('d', dl);
      grid.setAttribute('d', [-1000, -2000, -3000, -4000, -5000, -6000].map(z => `M${plot.x} ${yOf(z)}H${plot.x + plot.w}`).join(''));
      surface.setAttribute('d', `M${plot.x} ${yOf(0)}H${lerp(plot.x, plot.x + plot.w, tok.enter(progress(gt, T.in, T.in + 0.5)))}`);
      const placeEnd = (e, x) => { e.style.transform = `translate(${(x - e.offsetWidth / 2).toFixed(1)}px, ${(plot.y - px(78)).toFixed(1)}px)`; e.style.display = x < plot.x - px(10) || x > plot.x + plot.w + px(10) ? 'none' : ''; };
      placeEnd(pA, Math.max(plot.x + px(24), xa)); placeEnd(pB, Math.min(plot.x + plot.w - px(24), xb));
      pA.style.display = 'none'; pB.style.display = 'none'; // the map already carries A / A′ on its section line

      // boat on the section: x = its map x; nominal shallow depth (labelled "depth approx.")
      const bx = X(P.sub.lon), byBase = yOf(0) + px(30);
      let sx = 0, sy = 0;
      for (const b of bursts) { sy += shake(gt, b, { amp: px(4), decay: 0.25 }); sx += 0.5 * shake(gt, b + 1 / 30, { amp: px(4), decay: 0.25 }); }
      boat.setAttribute('transform', `translate(${(bx + sx).toFixed(2)} ${(byBase + sy).toFixed(2)})`);
      boatLbl.style.transform = `translate(${(bx + px(40)).toFixed(1)}px, ${(byBase + px(12)).toFixed(1)}px)`;

      // water column under the boat: dimension line from boat to seabed, value pill in the middle
      const dp = tok.enter(progress(gt, T.seabed, T.seabed + 0.6));
      const ySea = yOf(seabed), yTop = byBase + px(16);
      const yb = lerp(yTop, ySea, dp), tk = px(9);
      dim.setAttribute('d', dp > 0 ? `M${bx} ${yTop}V${yb}M${bx - tk} ${yTop}H${bx + tk}` + (dp > 0.98 ? `M${bx - tk} ${ySea}H${bx + tk}` : '') : '');
      dimLbl.style.opacity = progress(gt, T.seabed + 0.3, T.seabed + 0.6).toFixed(3);
      dimLbl.style.transform = `translate(${(bx + px(16)).toFixed(1)}px, ${(lerp(yTop, ySea, 0.55) - dimLbl.offsetHeight / 2).toFixed(1)}px)`;

      // ships on the surface
      ships.forEach((sh, i) => {
        const x = X(shipLon[i]), y = yOf(0);
        sh.setAttribute('d', `M${x - px(22)} ${y - px(2)}L${x + px(22)} ${y - px(2)}L${x + px(14)} ${y - px(14)}L${x - px(16)} ${y - px(14)}Z`);
        sh.setAttribute('opacity', enterP(gt, T.in + 0.3 + i * 0.1, 12));
      });
      // charges: fall from the ship (constant speed — gravity in water is near-terminal), burst near the boat
      for (const c of charges) {
        const x0 = X(c.lon), y0 = yOf(0), x1 = X(P.sub.lon + c.dx), y1 = byBase + px(4);
        const f = progress(gt, c.tb - CHARGE_FALL, c.tb);
        const x = lerp(x0, x1, f), y = lerp(y0, y1, f);
        const on = f > 0 && f < 1;
        c.line.setAttribute('d', f > 0 ? `M${x0} ${y0}L${x} ${y}` : '');
        c.line.setAttribute('opacity', f > 0 ? (0.6 * (1 - progress(gt, c.tb, c.tb + 0.6))).toFixed(3) : 0);
        c.dot.setAttribute('cx', x); c.dot.setAttribute('cy', y); c.dot.setAttribute('opacity', on ? 1 : 0);
        const q = progress(gt, c.tb, c.tb + 0.9);
        c.ring.setAttribute('cx', x1); c.ring.setAttribute('cy', y1);
        c.ring.setAttribute('r', px(4) + tok.enter(q) * px(60));
        c.ring.setAttribute('opacity', q > 0 && q < 1 ? (1 - q).toFixed(3) : 0);
        const q2 = progress(gt, c.tb + 0.08, c.tb + 1.1);
        c.ring2.setAttribute('cx', x1); c.ring2.setAttribute('cy', y1);
        c.ring2.setAttribute('r', px(4) + tok.enter(q2) * px(100));
        c.ring2.setAttribute('opacity', q2 > 0 && q2 < 1 ? (0.7 * (1 - q2)).toFixed(3) : 0);
      }
      void life;
    },
  };
}
