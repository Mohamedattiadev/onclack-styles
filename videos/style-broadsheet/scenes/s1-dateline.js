// Sheet A1 — DATELINE + two-ink map.
// intent: KNOW 27 Oct 1962, a Soviet sub near Cuba · FEEL curiosity · SEE banner pressed line by line, map resolving from coarse dots
// truth: map = EV-derived (Natural Earth coastlines); sub position = RC, marked "approx."
import { el, svg, glide, fitText } from '/onclack-styles/engine/lib/anim.js';
import { INK, FONT, MISREG, F, ez, tw, wordT, grid, sheet, box, plate, press, applyPress, headStyle, labelStyle, captionStyle, inkDefs } from '../shared/press.js';

export default async function (root, ctx) {
  const L = ctx.layout, G = grid(L), u = L.unit;
  const S = sheet(root, ctx, { page: 1, folioRight: 'A1 · Caribbean' });
  const C = S.content;
  const fx = inkDefs(root, 's1');
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();

  // ---- times from the voice (visual lands 2 f before its word)
  const tOct = wordT(ctx, 'October', 0, 0.58) - 2 * F;
  const t27 = wordT(ctx, 'twenty-seventh', 0, 1.1) - 2 * F;
  const t62 = wordT(ctx, 'nineteen', 0, 2.07) - 2 * F;
  const tSov = wordT(ctx, 'Soviet', 0, 3.79) - 3 * F;
  const tSub = wordT(ctx, 'submarine', 0, 4.3) - 2 * F;
  const tDeep = wordT(ctx, 'deep', 0, 5.42) - 2 * F;
  const tCuba = wordT(ctx, 'Cuba', 0, 6.52) - 3 * F;

  // ---- banner headline: OCTOBER 27, 1962 — each word pressed on its spoken word
  const top = S.top + L.px(L.pick({ landscape: 26, portrait: 30 }));
  const bannerSize = L.px(L.pick({ landscape: 250, portrait: 196 }));
  const banner = box(C, 'Banner headline', L.safe.x, top, L.safe.w, null, { ...headStyle(bannerSize), display: 'flex', flexWrap: 'wrap', columnGap: '0.16em', rowGap: L.px(10) + 'px', filter: fx.ink });
  const words = [['October', tOct], ['27,', t27], ['1962', t62]].map(([w, at]) =>
    ({ node: el('span', { 'data-name': `Banner word ${w}`, style: { display: 'inline-block' } }, banner, w), at }));
  if (L.portrait) { words[2].node.style.flexBasis = '100%'; }
  // set to the full measure (a banner fills the column width exactly)
  if (L.landscape) { banner.style.flexWrap = 'nowrap'; banner.style.width = 'max-content'; banner.style.fontSize = bannerSize * (L.safe.w / banner.scrollWidth) + 'px'; banner.style.width = L.safe.w + 'px'; }
  fitText(banner, L.safe.w);
  const bannerH = banner.getBoundingClientRect().height / 1;
  const below = G.base(top + bannerH + L.px(L.pick({ landscape: 28, portrait: 34 })));

  // rule under the banner (4 px, the "cut-off rule")
  box(C, 'Cut-off rule', L.safe.x, below, L.safe.w, L.px(4), { background: INK.black });

  // ---- map plate
  const mapRect = L.pick({
    landscape: { x: G.x(4), y: below + L.px(28), w: G.w(8), h: L.safe.y + L.safe.h - (below + L.px(28)) - L.px(52) },
    portrait: { x: 0, y: below + L.px(30), w: L.width, h: L.px(640) },
  });
  const mapBox = box(C, 'Map plate', mapRect.x, mapRect.y, mapRect.w, mapRect.h, { overflow: 'hidden' });
  // projection (equirectangular, cos 23°), camera = zoom about a focus
  const lon0 = L.pick({ landscape: -75.6, portrait: -77.2 }), lat0 = L.pick({ landscape: 23.6, portrait: 23.9 });
  const k = mapRect.w / L.pick({ landscape: 21.5, portrait: 17.5 }), kc = Math.cos((23 * Math.PI) / 180);
  const focus = [-75.5, 23.0];
  const proj = (lon, lat, z) => {
    const fxp = (focus[0] - lon0) * k * kc, fyp = (lat0 - focus[1]) * k;
    const x = (lon - lon0) * k * kc, y = (lat0 - lat) * k;
    return [mapRect.w / 2 + fxp + (x - fxp) * z, mapRect.h / 2 + fyp + (y - fyp) * z];
  };
  const mapPlate = plate(mapBox, mapRect.w, mapRect.h, (g, w, h, st) => {
    const ring = r => { g.beginPath(); r.forEach(([lo, la], i) => { const [x, y] = proj(lo, la, st.z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
    g.filter = `blur(${Math.max(0.6, st.cell * 0.18)}px)`;
    for (const f of geo.features) {
      g.fillStyle = f.name === 'Cuba' ? 'rgb(118,118,118)' : 'rgb(196,196,196)'; // tint: Cuba 54 %, other land 23 %
      for (const r of f.rings) { ring(r); g.fill(); }
    }
    g.filter = 'none';
  }, { name: 'Map halftone', style: { left: 0, top: 0 } });
  // coast hairline + graticule + marks live in an SVG on top (non-scaling strokes)
  const ms = svg('svg', { 'data-name': 'Map marks', width: mapRect.w, height: mapRect.h, viewBox: `0 0 ${mapRect.w} ${mapRect.h}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, mapBox);
  const coast = svg('path', { 'data-name': 'Coastline', fill: 'none', stroke: INK.black, 'stroke-width': Math.max(1.5, L.px(1.5)), 'stroke-opacity': 0.7, 'stroke-linejoin': 'round' }, ms);
  const grat = svg('g', { 'data-name': 'Graticule' }, ms);
  const gratLines = [];
  for (const lat of [20, 25, 30]) gratLines.push({ lat, line: svg('line', { stroke: INK.black, 'stroke-opacity': 0.28, 'stroke-width': 2, 'stroke-dasharray': `${L.px(2)} ${L.px(6)}` }, grat), lab: svg('text', { fill: INK.black, 'fill-opacity': 0.6, 'font-family': FONT.grot, 'font-weight': 600, 'font-size': L.px(20), 'letter-spacing': '0.06em' }, grat) });
  for (const lon of [-85, -80, -75, -70]) gratLines.push({ lon, line: svg('line', { stroke: INK.black, 'stroke-opacity': 0.28, 'stroke-width': 2, 'stroke-dasharray': `${L.px(2)} ${L.px(6)}` }, grat), lab: svg('text', { fill: INK.black, 'fill-opacity': 0.6, 'font-family': FONT.grot, 'font-weight': 600, 'font-size': L.px(20), 'letter-spacing': '0.06em' }, grat) });
  gratLines.forEach(g => (g.lab.textContent = g.lat != null ? `${g.lat}°N` : g.lon >= -70 ? '' : `${-g.lon}°W`));

  const lab = (name, text, size, weight = 800, extra = {}) => {
    const t = svg('text', { 'data-name': name, fill: INK.black, 'font-family': FONT.grot, 'font-weight': weight, 'font-size': L.px(size), 'letter-spacing': '0.16em', stroke: INK.paper, 'stroke-width': L.px(7), 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra }, ms);
    t.textContent = text; return t;
  };
  const cubaL = lab('Label Cuba', 'CUBA', 36);
  const flaL = lab('Label Florida', 'FLORIDA', 26, 600);
  // sub: spot-ink mark, misregistered by the constant MISREG, overprinted (multiply)
  const subLL = [-71.2, 25.4];
  const spot = svg('g', { 'data-name': 'B-59 position (spot ink)', style: `mix-blend-mode:multiply` }, ms);
  const ringC = svg('circle', { r: L.px(64), fill: 'none', stroke: INK.spot, 'stroke-width': L.px(4), 'stroke-dasharray': `${L.px(10)} ${L.px(8)}` }, spot);
  const dot = svg('rect', { width: L.px(22), height: L.px(22), fill: INK.spot }, spot);
  const leader = svg('polyline', { 'data-name': 'Leader', fill: 'none', stroke: INK.black, 'stroke-width': L.px(2.5) }, ms);
  const subName = lab('Label B-59', 'B-59', 40, 800, { 'letter-spacing': '0.08em' });
  const subNote = svg('text', { 'data-name': 'Label approx', fill: INK.black, 'font-family': FONT.body, 'font-style': 'italic', 'font-size': L.px(30), stroke: INK.paper, 'stroke-width': L.px(7), 'paint-order': 'stroke' }, ms);
  subNote.textContent = 'position approx.';
  const frame = box(mapBox, 'Plate frame', 0, 0, mapRect.w, mapRect.h, { boxShadow: `inset 0 0 0 ${Math.max(2, L.px(2))}px ${INK.black}`, pointerEvents: 'none' });
  if (L.portrait) frame.style.boxShadow = `inset 0 ${L.px(4)}px 0 ${INK.black}, inset 0 -${L.px(4)}px 0 ${INK.black}`;

  const capY = mapRect.y + mapRect.h + L.px(12);
  const cap = box(C, 'Map caption', L.pick({ landscape: mapRect.x, portrait: L.safe.x }), capY, L.pick({ landscape: mapRect.w, portrait: L.safe.w }), null,
    captionStyle(L.px(L.pick({ landscape: 26, portrait: 28 })), { fontStyle: 'italic', whiteSpace: 'nowrap' }));
  cap.innerHTML = `<b style="font-style:normal;font-family:${FONT.grot};font-weight:800;letter-spacing:.1em;font-size:.86em">FIG. 1</b>&ensp;Caribbean Sea. Position of B-59 is approximate.`;

  // ---- column: kicker, deck, grey type
  const col = L.pick({
    landscape: { x: G.x(0), y: mapRect.y, w: G.w(4) - L.px(12) },
    portrait: { x: L.safe.x, y: capY + L.px(64), w: L.safe.w },
  });
  const kick = box(C, 'Kicker', col.x, col.y, col.w, null, labelStyle(L.px(26), { fontWeight: 800, color: INK.black }), 'Atlantic approaches');
  const deck = box(C, 'Deck', col.x, col.y + L.px(46), col.w, null, captionStyle(L.px(L.pick({ landscape: 62, portrait: 58 })), { fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.01em', fontFeatureSettings: '"kern","liga","lnum"' }));
  const deckLines = L.pick({ landscape: ['A Soviet', 'submarine,', 'somewhere', 'below.'], portrait: ['A Soviet submarine,', 'somewhere below.'] })
    .map(s => el('div', { style: { whiteSpace: 'nowrap' } }, deck, s));
  if (L.portrait) deckLines.forEach(n => (n.style.fontSize = L.px(56) + 'px'));
  const deckH = deck.getBoundingClientRect().height;
  // grey "column type" (neutral lines — no fake text)
  const bars = []; let colRule = null;
  if (L.landscape) {
    const by = G.base(col.y + L.px(46) + deckH + L.px(34));
    const maxY = mapRect.y + mapRect.h;
    colRule = box(C, 'Column rule', col.x, by - L.px(16), L.px(90), L.px(4), { background: INK.black, transformOrigin: '0 50%' });
    for (let i = 0, y = by; y < maxY - L.px(10); i++, y += L.px(32)) {
      const last = (i + 1) % 6 === 0;
      const w = last ? col.w * (0.35 + ((i * 37) % 30) / 100) : col.w * (0.93 + ((i * 13) % 7) / 100);
      bars.push(box(C, 'Column type', col.x, y, w, L.px(11), { background: INK.grey, opacity: 0.55, transformOrigin: '0 50%' }));
      if (last) y += L.px(14);
    }
  }

  return {
    update(t) {
      const impacts = words.map(w => [w.at, 1]).concat([[t62 + 0.4, 0.6], [tSub, 0.5]]);
      S.update(t, impacts, L.px(3));
      for (const w of words) applyPress(w.node, press(t, w.at), '50% 90%');

      // map: halftone resolve (coarse → fine) on "Soviet", then a slow camera push toward the sub on "deep … Cuba"
      // plate is pressed after the year lands, then resolves coarse → fine in 16 f (the reveal)
      const tMap = t62 + 0.4;
      const mp = press(t, tMap);
      mapBox.style.opacity = mp.opacity; mapBox.style.transformOrigin = '50% 50%'; mapBox.style.transform = mp.transform;
      const cell = L.px(tw(t, tMap, tMap + 16 * F, 44, 9, ez.enter));
      const z = glide(t, tDeep, tDeep + 2.6, 1, L.pick({ landscape: 1.16, portrait: 1.14 }));
      const zr = +z.toFixed(4), cr = +cell.toFixed(2);
      mapPlate.draw({ z: zr, cell: cr }, [{ cell: cr, angle: 45, color: INK.black }]);
      const coastOn = tw(t, tMap + 10 * F, tMap + 22 * F, 0, 1, ez.enter);
      coast.setAttribute('stroke-opacity', 0.7 * coastOn);
      if (coastOn > 0) {
        let d = '';
        for (const f of geo.features) for (const r of f.rings) d += r.map(([lo, la], i) => { const [x, y] = proj(lo, la, zr); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join('') + 'Z';
        coast.setAttribute('d', d);
      }
      grat.setAttribute('opacity', coastOn);
      for (const gl of gratLines) {
        if (gl.lat != null) {
          const [, y] = proj(-80, gl.lat, zr);
          Object.entries({ x1: L.pick({ landscape: 0, portrait: L.safe.x }), x2: L.pick({ landscape: mapRect.w, portrait: L.safe.x + L.safe.w }), y1: y, y2: y }).forEach(([a, v]) => gl.line.setAttribute(a, v));
          gl.lab.setAttribute('x', L.pick({ landscape: 0, portrait: L.safe.x }) + L.px(12)); gl.lab.setAttribute('y', y - L.px(8));
          const vis = y > L.px(30) && y < mapRect.h - L.px(10) ? 'visible' : 'hidden';
          gl.line.setAttribute('visibility', vis); gl.lab.setAttribute('visibility', vis);
        } else {
          const [x] = proj(gl.lon, 20, zr);
          Object.entries({ x1: x, x2: x, y1: 0, y2: mapRect.h }).forEach(([a, v]) => gl.line.setAttribute(a, v));
          const inside = L.landscape || (x > L.safe.x + L.px(4) && x < L.safe.x + L.safe.w - L.px(60));
          gl.line.setAttribute('visibility', inside ? 'visible' : 'hidden'); gl.lab.setAttribute('visibility', inside ? 'visible' : 'hidden');
          gl.lab.setAttribute('x', x + L.px(8)); gl.lab.setAttribute('y', mapRect.h - L.px(14));
        }
      }
      const place = (node, ll, dx = 0, dy = 0, anchor = 'middle') => { const [x, y] = proj(ll[0], ll[1], zr); node.setAttribute('x', x + dx); node.setAttribute('y', y + dy); node.setAttribute('text-anchor', anchor); };
      place(cubaL, [-79.6, 21.95], 0, L.px(13));
      place(flaL, [-81.3, 27.0], 0, 0);
      flaL.setAttribute('opacity', coastOn);
      const cubaP = press(t, tCuba);
      cubaL.setAttribute('opacity', Math.max(coastOn * 0.0, cubaP.opacity));

      // sub mark: pressed on "submarine", uncertainty ring draws on "deep"
      const [sx, sy] = proj(subLL[0], subLL[1], zr);
      const mx = sx + L.px(MISREG[0]), my = sy + L.px(MISREG[1]);
      const sp = press(t, tSub, { lift: 0.5 });
      const s = sp.visible ? +sp.transform.match(/scale\(([\d.]+)/)[1] : 0;
      dot.setAttribute('x', mx - L.px(11) * s); dot.setAttribute('y', my - L.px(11) * s);
      dot.setAttribute('width', L.px(22) * s); dot.setAttribute('height', L.px(22) * s);
      dot.setAttribute('opacity', sp.opacity);
      ringC.setAttribute('cx', mx); ringC.setAttribute('cy', my);
      const rp = tw(t, tDeep, tDeep + 0.6, 0, 1, ez.enter);
      const circ = 2 * Math.PI * L.px(64);
      ringC.setAttribute('stroke-dasharray', rp >= 1 ? `${L.px(10)} ${L.px(8)}` : `${circ * rp} ${circ}`);
      ringC.setAttribute('opacity', rp > 0 ? 1 : 0);
      ringC.setAttribute('transform', `rotate(-90 ${mx} ${my})`);
      const side = L.pick({ landscape: 1, portrait: -1 });
      const lx = sx + side * L.px(110), ly = sy - L.px(104);
      const lp = tw(t, tSub + 0.15, tSub + 0.45, 0, 1, ez.enter);
      leader.setAttribute('points', `${sx + side * L.px(46)},${sy - L.px(46)} ${sx + side * L.px(46) + (lx - sx - side * L.px(46)) * lp},${sy - L.px(46) + (ly + L.px(8) - sy + L.px(46)) * lp}`);
      leader.setAttribute('opacity', lp > 0 ? 1 : 0);
      const anchor = side > 0 ? 'start' : 'end';
      subName.setAttribute('x', lx + side * L.px(8)); subName.setAttribute('y', ly); subName.setAttribute('text-anchor', anchor);
      subNote.setAttribute('x', lx + side * L.px(8)); subNote.setAttribute('y', ly + L.px(36)); subNote.setAttribute('text-anchor', anchor);
      subName.setAttribute('opacity', tw(t, tSub + 0.3, tSub + 0.45, 0, 1));
      subNote.setAttribute('opacity', tw(t, tDeep, tDeep + 0.3, 0, 1));

      // column: kicker + deck set line by line (5 f), grey type set like a galley being proofed
      kick.style.opacity = tw(t, tMap + 6 * F, tMap + 12 * F, 0, 1); // section label arrives with the plate
      deckLines.forEach((n, i) => {
        const a = tSov + i * 5 * F;
        n.style.opacity = tw(t, a, a + 4 * F, 0, 1, ez.enter);
        n.style.transform = `translateY(${tw(t, a, a + 10 * F, L.px(14), 0, ez.enter).toFixed(2)}px)`;
      });
      bars.forEach((b, i) => { b.style.transform = `scaleX(${tw(t, tSub + 0.3 + i * 2 * F, tSub + 0.3 + i * 2 * F + 8 * F, 0, 1, ez.enter)})`; });
      cap.style.opacity = tw(t, t62 + 0.9, t62 + 1.2, 0, 1);
      if (colRule) colRule.style.transform = `scaleX(${tw(t, tSov + 0.2, tSov + 0.5, 0, 1, ez.enter)})`;
    },
  };
}
