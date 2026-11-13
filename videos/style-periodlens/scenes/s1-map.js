// Plate 1 — PAMPHLET MAP + Fig. 1.
// intent: KNOW 27 Oct 1962, a Soviet sub near Cuba · FEEL curiosity · SEE a two-ink pamphlet map, the sub mark going "dashed" (= submerged)
// truth: map = EV-derived (Natural Earth coastlines, drawn in a 1962 pamphlet manner); sub position = RC, labelled approx.;
//        Fig. 1 = EV (U.S. Navy photo, NARA 428-N-711200), shown as itself.
import { el, svg, glide } from '/onclack-styles/engine/lib/anim.js';
import { INK, FONT, MISREG, F, ez, tw, wordT, box, eraCaps, mono, frame, inkDefs, plateSvg } from '../shared/lens.js';

export default async function (root, ctx) {
  const L = ctx.layout, u = L.unit;
  const FR = frame(root, ctx, { scene: 1, lens: 'pamphlet', fig: 1, caption: 'Soviet submarine B-59, U.S. Navy photo, Oct. 1962 (NARA). Map position approximate.' });
  const { plate, P } = FR;
  const ink = inkDefs(root, 's1', u);
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();

  // ---- voice (visual lands 2–3 f before its word)
  const tOct = wordT(ctx, 0, 'October', 0, 0.58) - 2 * F;
  const t27 = wordT(ctx, 0, 'twenty-seventh', 0, 1.1) - 2 * F;
  const t62 = wordT(ctx, 0, 'nineteen', 0, 2.07) - 2 * F;
  const tSov = wordT(ctx, 0, 'Soviet', 0, 3.79) - 3 * F;
  const tSub = wordT(ctx, 0, 'submarine', 0, 4.3) - 2 * F;
  const tDeep = wordT(ctx, 0, 'deep', 0, 5.42) - 2 * F;
  const tCuba = wordT(ctx, 0, 'Cuba', 0, 6.52) - 3 * F;
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -24 });

  // ---- layout (plate coords)
  const R = L.pick({
    landscape: { title: { x: 0, y: 6, size: 104 }, map: { x: 572, y: 0, w: P.w - 572, h: P.h }, photo: { x: 0, y: 318, w: 520 } },
    portrait: { title: { x: 0, y: 0, size: 92 }, map: { x: 0, y: 256, w: P.w, h: 520 }, photo: { x: 0, y: 790, w: 360 } },
  });

  // ---- title: pamphlet cover type, one ink + a flat yellow tint block behind the date
  const tSize = L.px(R.title.size);
  const kick = box(plate, '1A Kicker', R.title.x, R.title.y, null, null, eraCaps(L.px(26), 600, { letterSpacing: '0.18em', color: INK.navy }), 'Caribbean Sea · Situation');
  const titleTop = R.title.y + L.px(46);
  const tint = box(plate, '1A Date tint (yellow plate)', R.title.x - L.px(10) + L.px(MISREG[0]), titleTop + tSize * 0.98 + L.px(MISREG[1]), 0, tSize * 1.02, { background: INK.yellow, mixBlendMode: 'multiply', filter: ink });
  const line1 = box(plate, '1A Title line 1', R.title.x, titleTop, null, null, { ...eraCaps(tSize, 800, { letterSpacing: '0.01em' }), filter: ink });
  const line2 = box(plate, '1A Title line 2', R.title.x, titleTop + tSize * 1.02, null, null, { ...eraCaps(tSize, 800, { letterSpacing: '0.01em' }), filter: ink });
  const wOct = el('span', { 'data-name': 'Title October', style: { display: 'inline-block' } }, line1, 'October');
  const w27 = el('span', { 'data-name': 'Title 27', style: { display: 'inline-block' } }, line2, '27, ');
  const w62 = el('span', { 'data-name': 'Title 1962', style: { display: 'inline-block' } }, line2, '1962');
  const tintW = line2.scrollWidth + L.px(20);

  // ---- map
  const M = R.map;
  const mapBox = box(plate, '1B Map', M.x, M.y, M.w, M.h, { overflow: 'hidden' });
  const kc = Math.cos((23.5 * Math.PI) / 180);
  const c0 = L.pick({ landscape: [-77.6, 23.9], portrait: [-77.4, 23.6] });
  const span = L.pick({ landscape: 19.5, portrait: 18.5 }); // degrees of longitude across the map width
  const k = M.w / (span * kc);
  const proj = ([lo, la]) => [M.w / 2 + (lo - c0[0]) * k * kc, M.h / 2 - (la - c0[1]) * k];
  const dOf = rings => rings.map(r => r.map((p, i) => (i ? 'L' : 'M') + proj(p).map(v => v.toFixed(1)).join(' ')).join('') + 'Z').join('');
  const feats = geo.features.filter(f => f.rings.some(r => r.some(([lo, la]) => lo > -92 && lo < -64 && la > 15 && la < 32)));
  const allD = feats.map(f => dOf(f.rings)).join('');
  const cubaD = dOf(geo.features.find(f => f.name === 'Cuba').rings);

  const ms = plateSvg(mapBox, { w: M.w, h: M.h }, '1B Map art');
  // yellow plate (land tint) — overprints (multiply), constant misregistration
  const yel = svg('g', { 'data-name': 'Land tint (yellow plate)', style: `mix-blend-mode:multiply`, filter: ink }, ms.cam);
  svg('path', { d: allD, fill: INK.yellow, 'fill-opacity': 0.55 }, yel);
  svg('path', { d: cubaD, fill: INK.yellow }, yel);
  // navy plate: water-lining (concentric lines off the coast, a period map convention) + coastline
  const nav = svg('g', { 'data-name': 'Line plate (navy)', filter: ink }, ms.cam);
  const mid = 'wl-s1-' + L.format;
  const mask = svg('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -M.w, y: -M.h, width: M.w * 3, height: M.h * 3 }, svg('defs', {}, ms.s));
  svg('rect', { x: -M.w, y: -M.h, width: M.w * 3, height: M.h * 3, fill: 'black' }, mask);
  const g0 = L.px(11), lw = Math.max(1.3, L.px(1.35));
  for (let i = 3; i >= 1; i--) {
    const lum = Math.round(255 * [0.62, 0.36, 0.2][i - 1]);
    svg('path', { d: allD, fill: 'none', stroke: `rgb(${lum},${lum},${lum})`, 'stroke-width': 2 * i * g0 + lw, 'stroke-linejoin': 'round' }, mask);
    svg('path', { d: allD, fill: 'none', stroke: 'black', 'stroke-width': 2 * i * g0 - lw, 'stroke-linejoin': 'round' }, mask);
  }
  svg('path', { d: allD, fill: 'black' }, mask);
  svg('rect', { x: -M.w, y: -M.h, width: M.w * 3, height: M.h * 3, fill: INK.navy, mask: `url(#${mid})` }, nav);
  svg('path', { 'data-name': 'Coastline', d: allD, fill: 'none', stroke: INK.navy, 'stroke-width': Math.max(2, L.px(2.4)), 'stroke-linejoin': 'round' }, nav);

  // neatline with degree ticks (fixed to the map box, not the camera)
  const neat = svg('svg', { 'data-name': 'Neatline', width: M.w, height: M.h, style: 'position:absolute;left:0;top:0' }, mapBox);
  const nw = Math.max(2, L.px(2));
  svg('rect', { x: nw / 2, y: nw / 2, width: M.w - nw, height: M.h - nw, fill: 'none', stroke: INK.navy, 'stroke-width': nw }, neat);
  for (let lo = -90; lo <= -64; lo++) { const x = proj([lo, 0])[0]; if (x < 8 || x > M.w - 8) continue; const big = lo % 5 === 0; svg('path', { d: `M${x} 0v${L.px(big ? 18 : 8)}M${x} ${M.h}v${-L.px(big ? 18 : 8)}`, stroke: INK.navy, 'stroke-width': nw * 0.8 }, neat); }
  for (let la = 15; la <= 32; la++) { const y = proj([0, la])[1]; if (y < 8 || y > M.h - 8) continue; const big = la % 5 === 0; svg('path', { d: `M0 ${y}h${L.px(big ? 18 : 8)}M${M.w} ${y}h${-L.px(big ? 18 : 8)}`, stroke: INK.navy, 'stroke-width': nw * 0.8 }, neat); }

  // labels (HTML, constant screen size, positioned through the camera)
  const lab = (name, text, size, w = 800, extra = {}) => box(mapBox, name, 0, 0, null, null, { ...eraCaps(L.px(size), w, extra), filter: ink, transformOrigin: '0 0' }, text);
  const cubaL = lab('1B Label Cuba', 'Cuba', L.pick({ landscape: 46, portrait: 44 }), 800, { letterSpacing: '0.34em' });
  const flaL = lab('1B Label Florida', 'Florida', 26, 600, { letterSpacing: '0.24em', opacity: 0.85 });
  // sub mark: solid (surfaced convention) → dashed outline (submerged convention) on "deep"
  const subLL = [-71.6, 25.2];
  const SUB = 'M-40 4 Q-38 -4 -18 -5 L-8 -5 L-6 -16 L8 -16 L11 -5 L30 -5 Q42 -3 44 2 Q40 8 26 9 L-30 9 Q-40 9 -40 4 Z';
  const subG = svg('g', { 'data-name': '1C B-59 mark' }, ms.s);
  const disc = svg('circle', { r: L.px(54), fill: INK.yellow, style: 'mix-blend-mode:multiply', filter: ink }, subG);
  const subSolid = svg('path', { d: SUB, fill: INK.navy, filter: ink }, subG);
  const subDash = svg('path', { d: SUB, fill: 'none', stroke: INK.navy, 'stroke-width': 2.4, 'stroke-dasharray': '5 4', filter: ink }, subG);
  const subLab = box(mapBox, '1C Label B-59', 0, 0, null, null, { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: L.px(6) + 'px' });
  el('div', { style: eraCaps(L.px(40), 800, { letterSpacing: '0.06em' }) }, subLab, 'B-59');
  const subSub = el('div', { style: mono(L.px(22), { color: INK.navy }) }, subLab, 'approx. position');

  // ---- Fig. 1 photo (evidence, shown as itself; a print laid on the page)
  const ph = R.photo, phH = Math.round(ph.w * 734 / 948);
  const print = box(plate, '1D Fig. 1 photo print', ph.x, ph.y, ph.w, phH + L.px(L.pick({ landscape: 46, portrait: 46 })), { background: '#FBF8F1', boxShadow: `0 ${L.px(2)}px ${L.px(3)}px rgba(40,34,60,0.35), 0 ${L.px(14)}px ${L.px(30)}px rgba(40,34,60,0.16)`, padding: L.px(10) + 'px', boxSizing: 'border-box' });
  const img = el('img', { src: ctx.asset('assets/b59-surfaced-1962.jpg'), 'data-name': 'B-59 photo (US Navy, PD)', style: { display: 'block', width: '100%', height: (phH - L.px(20)) + 'px', objectFit: 'cover', objectPosition: '50% 60%', filter: 'grayscale(1) contrast(1.06)' } }, print);
  box(print, '1D Photo label', L.px(10), phH - L.px(4), ph.w - L.px(20), null, mono(L.px(20), { color: '#3A342C' }), 'Fig. 1 · B-59 · U.S. Navy');

  // ---- camera
  const focus = proj([-75.5, 23.6]);
  return {
    update(t) {
      FR.update(t);
      // title words: ink up on the spoken word (3 f opacity, 12 f settle)
      for (const [n, at] of [[wOct, tOct], [w27, t27], [w62, t62]]) {
        n.style.opacity = tw(t, at, at + 3 * F, 0, 1, p => p);
        n.style.transform = `translateY(${tw(t, at, at + 12 * F, 0.1, 0, ez.enter).toFixed(4)}em)`;
      }
      kick.style.opacity = tw(t, 0.15, 0.4, 0, 1);
      tint.style.width = tw(t, t62 + 4 * F, t62 + 16 * F, 0, tintW, ez.enter) + 'px';

      // map plates register: yellow first, navy 6 f later, both slide from a big offset to the constant one
      const py = ez.enter(Math.min(1, Math.max(0, (t - 0.2) / 0.6)));
      const pn = ez.enter(Math.min(1, Math.max(0, (t - 0.4) / 0.6)));
      yel.style.opacity = Math.min(1, (t - 0.2) / 0.2);
      yel.setAttribute('transform', `translate(${(L.px(MISREG[0]) + (1 - py) * L.px(14)).toFixed(2)} ${(L.px(MISREG[1]) - (1 - py) * L.px(8)).toFixed(2)})`);
      nav.style.opacity = Math.max(0, Math.min(1, (t - 0.4) / 0.2));
      nav.setAttribute('transform', `translate(${((1 - pn) * -L.px(10)).toFixed(2)} 0)`);
      const z = glide(t, 0.4, ctx.duration + 0.5, 1, 1.075);
      ms.setCam(z, focus[0], focus[1]);
      const at = ll => { const [x, y] = proj(ll); return [focus[0] + (x - focus[0]) * z, focus[1] + (y - focus[1]) * z]; };

      // labels
      const [cx, cy] = at([-83.4, 20.95]);
      cubaL.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
      cubaL.style.opacity = tw(t, tCuba, tCuba + 4 * F, 0, 1);
      cubaL.style.letterSpacing = tw(t, tCuba, tCuba + 1.2, 0.4, 0.34, ez.enter) + 'em';
      const [fx, fy] = at(L.pick({ landscape: [-85.7, 27.7], portrait: [-85.9, 26.6] }));
      flaL.style.transform = `translate(${fx.toFixed(1)}px, ${fy.toFixed(1)}px)`;
      flaL.style.opacity = 0.85 * tw(t, 0.9, 1.3, 0, 1);

      // sub mark
      const [sx, sy] = at(subLL);
      const ps = tw(t, tSub, tSub + 14 * F, 0, 1, ez.enter);
      subG.setAttribute('transform', `translate(${(sx + M.x * 0).toFixed(1)} ${sy.toFixed(1)}) scale(${(L.px(1.25) * (0.85 + 0.15 * ps)).toFixed(3)})`);
      subG.style.opacity = Math.min(1, (t - tSub) / (3 * F));
      disc.setAttribute('r', (L.px(42) * ps).toFixed(1));
      const pd = tw(t, tDeep, tDeep + 10 * F, 0, 1, ez.move);
      subSolid.style.opacity = 1 - pd;
      subDash.style.opacity = pd;
      subLab.style.transform = `translate(${(sx + L.px(56)).toFixed(1)}px, ${(sy - L.px(56)).toFixed(1)}px) translate(-100%, -100%)`;
      subLab.style.opacity = tw(t, tSub + 3 * F, tSub + 7 * F, 0, 1);
      subSub.textContent = t >= tDeep ? 'submerged · approx.' : 'approx. position';

      // photo print slides onto the page (physical: laid down), lands on "Soviet"
      const pp = tw(t, tSov, tSov + 16 * F, 0, 1, ez.enter);
      print.style.opacity = Math.min(1, Math.max(0, (t - tSov) / (5 * F)));
      print.style.transform = `translate(${((1 - pp) * -L.px(18)).toFixed(2)}px, ${((1 - pp) * L.px(26)).toFixed(2)}px) rotate(${(-0.9 + (1 - pp) * -1.5).toFixed(3)}deg)`;
    },
  };
}
