// BASE MAP — runs under the whole film. One world, one camera (global time), so cuts between the paragraph
// scenes never jump: "the survey glide". World marks (route, boat, ships, charges, links) live here too.
import { el, svg, clamp, progress, lerp, rand } from '/onclack-styles/engine/lib/anim.js';
import {
  C, LW, NS, P, W, mercY, loadMap, makeCamera, wordAt, LEAD, pathD, edgeFade, life, enterP, exitP, tok,
  haversineKm, bearingDeg, fmtKm, fmtM, chargeBursts,
} from '../shared/contour.js';

export default async function (root, ctx) {
  const L = ctx.layout, Wd = L.width, H = L.height, u = L.unit, px = L.px;
  const words = ctx.words;
  const wt = (w, n) => wordAt(words, w, n);
  const cam = makeCamera(L, words);
  const data = await loadMap(ctx);
  const lw = n => n * u; // line weights (1.5 / 2 / 3 at 1080) scale with the frame

  // ---------- paper + grain (grain is fixed per pixel: designed once, never boils) ----------
  el('div', { 'data-name': 'Bone paper', style: { position: 'absolute', inset: 0, background: C.bone } }, root);
  const g = document.createElement('canvas'); g.width = g.height = 256;
  const gc = g.getContext('2d'), id = gc.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = rand(i * 1.37 + 11) * 255; id.data.set([v, v, v, 255], i * 4); }
  gc.putImageData(id, 0, 0);
  const grain = el('div', { 'data-name': 'Grain', style: { position: 'absolute', inset: 0, backgroundImage: `url(${g.toDataURL()})`, opacity: 0.035, mixBlendMode: 'multiply', zIndex: 5, pointerEvents: 'none' } }, root);

  // ---------- world (SVG, camera transform; strokes do not scale) ----------
  const s = svg('svg', { width: Wd, height: H, viewBox: `0 0 ${Wd} ${H}`, style: { position: 'absolute', inset: 0 } }, root);
  const defs = svg('defs', {}, s);
  const world = svg('g', { 'data-name': 'Map world' }, s);
  const stroke = (color, w, extra = {}) => ({ fill: 'none', stroke: color, 'stroke-width': lw(w), 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });

  const smoothD = (rings, close = false) => rings.map(r => {
    if (r.length < 3) return 'M' + r.map(p => p.join(' ')).join('L');
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2].map(v => +v.toFixed(4)).join(' ');
    let d = 'M' + r[0].join(' ') + 'L' + m(r[0], r[1]);
    for (let i = 1; i < r.length - 1; i++) d += 'Q' + r[i].join(' ') + ' ' + m(r[i], r[i + 1]);
    return d + 'L' + r[r.length - 1].join(' ') + (close ? 'Z' : '');
  }).join('');
  const coast = data.levels.find(l => l.v === 0);
  svg('path', { 'data-name': 'Land', d: pathD(coast.fills, true), fill: C.ink, 'fill-opacity': 0.045, 'fill-rule': 'evenodd' }, world);

  // graticule every 2°
  const grat = svg('g', { 'data-name': 'Graticule' }, world);
  let gd = '';
  for (let lon = -94; lon <= -56; lon += 2) gd += `M${lon} ${mercY(8)}L${lon} ${mercY(38)}`;
  for (let lat = 8; lat <= 38; lat += 2) gd += `M-95 ${mercY(lat)}L-55 ${mercY(lat)}`;
  svg('path', { d: gd, ...stroke(C.ink, LW.hair), 'stroke-opacity': 0.09 }, grat);

  const levels = svg('g', { 'data-name': 'Depth contours' }, world);
  for (const lv of data.levels) {
    if (lv.v === 0) continue;
    const st = lv.kind === 'index' ? stroke(C.grey, LW.line) : lv.kind === 'land' ? stroke(C.grey, LW.hair) : lv.kind === 'mid' ? stroke(C.grey, LW.hair, { 'stroke-opacity': 0.75 }) : stroke(C.grey, LW.hair, { 'stroke-opacity': 0.4 });
    svg('path', { 'data-name': `Contour ${lv.v} m`, d: smoothD(lv.rings), ...st }, levels);
  }

  // detail contours (every 50 m) revealed in a growing disc around the boat → the lines "tighten"
  const mask = svg('mask', { id: 'deep-mask', maskUnits: 'userSpaceOnUse', x: -100, y: -100, width: 200, height: 200 }, defs);
  const rg = svg('radialGradient', { id: 'deep-grad' }, defs);
  svg('stop', { offset: '0%', 'stop-color': '#fff' }, rg);
  svg('stop', { offset: '72%', 'stop-color': '#fff' }, rg);
  svg('stop', { offset: '100%', 'stop-color': '#000' }, rg);
  const [sx, sy] = W(P.sub);
  const disc = svg('circle', { cx: sx, cy: sy, r: 0.001, fill: 'url(#deep-grad)' }, mask);
  const detail = svg('g', { 'data-name': 'Detail contours (50 m)', mask: 'url(#deep-mask)' }, world);
  svg('path', { d: smoothD(data.detail.flatMap(d => d.rings)), ...stroke(C.grey, LW.hair) }, detail);

  svg('path', { 'data-name': 'Coastline (0 m)', d: smoothD(coast.rings), ...stroke(C.ink, LW.line) }, world);

  // ---------- tension grade (colour script: bone → dimmer during the vote → bone again on "no") ----------
  const grade = el('div', { 'data-name': 'Tension grade', style: { position: 'absolute', inset: 0, background: C.ink, opacity: 0, pointerEvents: 'none' } }, root);

  // ---------- screen-space marks layer ----------
  const marks = svg('svg', { width: Wd, height: H, viewBox: `0 0 ${Wd} ${H}`, style: { position: 'absolute', inset: 0, overflow: 'visible' } }, root);
  const labels = el('div', { style: { position: 'absolute', inset: 0 } }, root);

  // Label factory: screen-constant size, Imhof offset from an anchor, halo for legibility over lines.
  function label(name, html, cls, { dx = 14, dy = -14, anchor = 'left' } = {}) {
    const d = el('div', { class: `lbl ${cls}`, 'data-name': name }, labels);
    d.innerHTML = html;
    d._dx = dx; d._dy = dy; d._anchor = anchor;
    return d;
  }
  function place(d, x, y, op) {
    if (op < 0.01) { d.style.display = 'none'; return; }
    d.style.display = ''; // measure only while shown (a hidden label measures 0 × 0)
    const w = d.offsetWidth, h = d.offsetHeight;
    let lx = x + px(d._dx), ly = y + px(d._dy);
    if (d._anchor === 'left') ly -= h; // upper-right of the anchor
    if (d._anchor === 'center') { lx -= w / 2; ly -= h / 2; }
    if (d._anchor === 'below') { lx -= w / 2; }
    if (d._anchor === 'right') { lx -= w; ly -= h; }
    const f = edgeFade(L, lx, ly, w, h, 30);
    const o = op * f;
    d.style.opacity = o.toFixed(3);
    d.style.display = o < 0.01 ? 'none' : '';
    d.style.transform = `translate(${lx.toFixed(2)}px, ${ly.toFixed(2)}px)`;
  }

  // places (zoom-dependent: shown only when the span is in range)
  const placeLabels = [
    { p: L.portrait ? { lon: -77.9, lat: 21.35 } : { lon: -79.2, lat: 21.75 }, html: 'CUBA', cls: 'place big', range: [5, 40], anchor: 'center', dx: 0, dy: 0 },
    { p: { lon: -77.6, lat: 25.3 }, html: 'BAHAMAS', cls: 'place', range: [8, 40], anchor: 'center', dx: 0, dy: 0 },
    { p: { lon: -72.6, lat: 19.0 }, html: 'HISPANIOLA', cls: 'place', range: [6, 40], anchor: 'center', dx: 0, dy: 0 },
    { p: { lon: -81.6, lat: 28.4 }, html: 'FLORIDA', cls: 'place', range: [9, 40], anchor: 'center', dx: 0, dy: 0 },
    { p: { lon: -66.6, lat: 28.6 }, html: 'Atlantic<br>Ocean', cls: 'sea', range: [6, 40], anchor: 'center', dx: 0, dy: 0 },
    { p: { lon: -77.5, lat: 16.6 }, html: 'Caribbean Sea', cls: 'sea', range: [9, 40], anchor: 'center', dx: 0, dy: 0 },
  ].map(o => ({ ...o, d: label(`Place · ${o.html.replace('<br>', ' ')}`, o.html, o.cls, o) }));

  // Havana: dot + label
  const havDot = svg('circle', { r: px(6), fill: C.ink, 'data-name': 'Havana dot' }, marks);
  const havLbl = label('Label · Havana', 'Havana', 'city', { dx: -12, dy: 10, anchor: 'right' });
  havLbl.style.transformOrigin = '0 0';

  // depth labels sitting ON index contours (line knocked out by the bone halo), rotated along the line
  function onLine(v, near) {
    const lv = data.levels.find(l => l.v === v); let best = null;
    for (const r of lv.rings) for (let i = 1; i < r.length - 1; i++) {
      const d = Math.hypot(r[i][0] - near[0], r[i][1] - near[1]);
      if (!best || d < best.d) best = { d, p: r[i], a: Math.atan2(r[i + 1][1] - r[i - 1][1], r[i + 1][0] - r[i - 1][0]) };
    }
    let a = best.a * 180 / Math.PI; if (a > 90) a -= 180; if (a < -90) a += 180;
    return { p: best.p, a };
  }
  const depthLabels = [[-5000, -67.4, 25.4], [-4000, -72.9, 23.6], [-2000, -75.0, 22.9], [-5000, -73.6, 26.8]].map(([v, lon, lat], i) => {
    const o = onLine(v, W({ lon, lat }));
    const d = el('div', { class: 'depth', 'data-name': `Depth label ${v} m #${i + 1}` }, labels, fmtM(v));
    return { ...o, d };
  });

  // graticule labels (screen edges)
  const latTicks = [20, 22, 24, 26, 28, 30].map(lat => ({ lat, d: el('div', { class: 'tick', 'data-name': `Graticule ${lat}°N` }, labels, `${lat}°N`) }));
  const lonTicks = [-84, -82, -80, -78, -76, -74, -72, -70, -68, -66, -64].map(lon => ({ lon, d: el('div', { class: 'tick', 'data-name': `Graticule ${-lon}°W` }, labels, `${-lon}°W`) }));

  // scale bar (bottom-left), nice length chosen per zoom
  const scaleG = svg('g', { 'data-name': 'Scale bar' }, marks);
  const scaleLine = svg('path', { ...stroke(C.ink, LW.line), 'vector-effect': null }, scaleG);
  const scaleLbl = el('div', { class: 'tick scale', 'data-name': 'Scale bar label' }, labels);

  // ---------- story marks ----------
  // B-59 track (side B: signal orange, DASHED) from the north-east to the approximate position.
  const routeLL = [{ lon: -62.6, lat: 29.2 }, { lon: -64.8, lat: 27.9 }, { lon: -67.3, lat: 25.9 }, { lon: -69.0, lat: 24.6 }, P.sub];
  const routeW = routeLL.map(W);
  const routeLen = routeW.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - routeW[i - 1][0], p[1] - routeW[i - 1][1]) : 0), 0);
  const along = f => { // point at fraction of world length
    let target = f * routeLen;
    for (let i = 1; i < routeW.length; i++) {
      const a = routeW[i - 1], b = routeW[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (target <= l || i === routeW.length - 1) { const q = clamp(target / l); return { p: [lerp(a[0], b[0], q), lerp(a[1], b[1], q)], i, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; }
      target -= l;
    }
  };
  const route = svg('path', { 'data-name': 'B-59 track (dashed)', ...stroke(C.signal, LW.route), 'vector-effect': null, 'stroke-dasharray': `${px(10)} ${px(8)}` }, marks);
  const head = svg('g', { 'data-name': 'Route head' }, marks);
  svg('circle', { r: px(9), fill: C.signal, stroke: C.ink, 'stroke-width': lw(LW.line) }, head);

  // uncertainty ring + boat glyph (plan view hull) at the end
  const unc = svg('circle', { 'data-name': 'Position uncertainty', fill: 'none', stroke: C.ink, 'stroke-width': lw(LW.hair), 'stroke-dasharray': `${px(4)} ${px(5)}` }, marks);
  const boat = svg('g', { 'data-name': 'B-59 mark' }, marks);
  svg('path', { d: `M${-px(22)} 0 C${-px(18)} ${-px(7)} ${px(12)} ${-px(7)} ${px(24)} 0 C${px(12)} ${px(7)} ${-px(18)} ${px(7)} ${-px(22)} 0Z`, fill: C.signal, stroke: C.ink, 'stroke-width': lw(LW.line) }, boat);
  const subLbl = label('Label · B-59', '<span class="key orange"></span><b>B-59</b><span class="sub">Soviet submarine</span>', 'mark', { dx: 26, dy: -22 });
  const coordLbl = label('Coordinates · B-59', '24.0°N 70.0°W <span class="approx">approx.</span>', 'mono', { dx: 26, dy: 4, anchor: 'below-left' });
  coordLbl._anchor = 'none';
  const seabedLbl = label('Seabed depth readout', `seabed ${fmtM(data.facts.sub.seabed)} m`, 'mono strong', { dx: 26, dy: 46 });
  seabedLbl._anchor = 'none';

  // distance to Cuba (dimension line with end ticks)
  const cubaKm = haversineKm(P.sub, P.maisi);
  const dim = svg('g', { 'data-name': 'Distance to Cuba' }, marks);
  const dimLine = svg('path', { ...stroke(C.ink, LW.hair), 'vector-effect': null }, dim);
  const dimLbl = label('Label · distance to Cuba', `${fmtKm(cubaKm)} km to Cuba`, 'mono pill', { dx: 0, dy: 0, anchor: 'center' });

  // section line A–A′ (links the map to the section card in scene 2)
  const secG = svg('g', { 'data-name': 'Section line A–A′' }, marks);
  const secLine = svg('path', { ...stroke(C.ink, LW.hair), 'vector-effect': null }, secG);
  const secA = label('Section end A', 'A', 'secend', { anchor: 'center', dx: 0, dy: 0 });
  const secB = label('Section end A′', 'A′', 'secend', { anchor: 'center', dx: 0, dy: 0 });

  // US destroyers (side A: cobalt, SOLID tracks)
  const ships = [[-0.62, 0.42, 20], [0.55, 0.5, -30], [-0.42, -0.5, 30], [0.66, -0.3, -10]].map(([dl, dφ, hdg], i) => {
    const gS = svg('g', { 'data-name': `US destroyer ${i + 1}` }, marks);
    const trk = svg('path', { ...stroke(C.cobalt, LW.line), 'vector-effect': null }, marks);
    svg('path', { d: `M${px(13)} 0 L${-px(9)} ${-px(8)} L${-px(9)} ${px(8)}Z`, fill: C.cobalt }, gS);
    const to = { lon: P.sub.lon + dl, lat: P.sub.lat + dφ };
    const from = { lon: to.lon - 0.55 * Math.cos(hdg / 57.3), lat: to.lat + 0.55 * Math.sin(hdg / 57.3) };
    return { gS, trk, to, from, i };
  });
  const shipLbl = label('Label · US destroyers', '<span class="key blue"></span><b>US destroyers</b>', 'mark', { anchor: 'left', dx: 30, dy: 24 });

  // depth charges on the map: one small ring per burst (same times as the section card)
  const bursts = chargeBursts(words).map((tb, i) => {
    const o = [[-0.18, 0.1], [0.16, 0.14], [0.02, -0.16]][i];
    return { tb, ll: { lon: P.sub.lon + o[0], lat: P.sub.lat + o[1] }, c: svg('circle', { fill: 'none', stroke: C.cobalt, 'stroke-width': lw(LW.hair), 'data-name': `Depth charge ring ${i + 1}` }, marks) };
  });
  for (const b of bursts) ctx.sfx('boom-distant-01', b.tb - ctx.start, { volume: 0.32 }); // thud lands when the card's charge bursts

  // Moscow link: dashed orange toward Moscow's great-circle bearing, then it breaks ("silent")
  const brg = bearingDeg(P.sub, P.moscow);
  const mosKm = haversineKm(P.sub, P.moscow);
  const mosG = svg('g', { 'data-name': 'Moscow link' }, marks);
  const mosSegs = Array.from({ length: 16 }, () => svg('path', { ...stroke(C.signal, LW.route), 'vector-effect': null }, mosG));
  const mosArrow = svg('path', { fill: C.ink }, mosG);
  const mosLbl = label('Label · Moscow', `Moscow <span class="mono-inline">${fmtKm(mosKm)} km</span>`, 'city strongcity', { anchor: 'right', dx: -24, dy: 70 });
  const silentLbl = label('Label · no contact', 'no orders received', 'mono pill', { anchor: 'center', dx: 0, dy: 0 });

  // 2002 route: the story travels from the sea to Havana (ink, solid, moving head)
  const havRoute = svg('path', { 'data-name': 'Route to Havana 2002', ...stroke(C.ink, LW.route), 'vector-effect': null }, marks);
  const havHead = svg('circle', { r: px(8), fill: C.bone, stroke: C.ink, 'stroke-width': lw(LW.route), 'data-name': 'Havana route head' }, marks);
  const havCtrl = { lon: -76.8, lat: 25.2 };

  // ---------- timing ----------
  const T = {
    route0: wt('nineteen') + 0.2, route1: wt('hides') + 0.25,
    sub: wt('submarine') - LEAD, deep: wt('deep') - LEAD, cuba: wt('Cuba') - 0.35,
    above: wt('Above') - LEAD, ships: wt('American') - LEAD, secOut: chargeBursts(words)[2] + 0.4,
    moscow: wt('Moscow') - LEAD, silent: wt('silent') - LEAD,
    on: wt('On') - 0.3, third: wt('third'), world: wt('world') - LEAD, later: wt('later'),
  };

  return {
    update(t, p, gt = ctx.start + t) {
      const cm = cam(gt);
      world.setAttribute('transform', `translate(${cm.ox.toFixed(3)} ${cm.oy.toFixed(3)}) scale(${cm.k.toFixed(5)})`);
      const pr = cm.project, ll = cm.projectLL;
      const inRange = (r, fade = 0.15) => clamp(Math.min((cm.span - r[0]) / (r[0] * fade), (r[1] - cm.span) / (r[1] * fade)));

      // contour tightening disc (world units, ° lon)
      const dp = tok.enter(progress(gt, T.deep, T.deep + 0.8));
      disc.setAttribute('r', (0.001 + dp * 2.6).toFixed(4));

      // places
      for (const o of placeLabels) { const [x, y] = ll(o.p); place(o.d, x, y, inRange(o.range) * (o.html === 'FLORIDA' ? enterP(gt, wt('hides') + 0.3, 14) : o.html === 'CUBA' && L.portrait ? 1 - enterP(gt, wt('later') - 0.2, 10) : 1)); }
      const [hx, hy] = ll(P.havana);
      havDot.setAttribute('cx', hx); havDot.setAttribute('cy', hy);
      const havOp = inRange([6, 40]) * edgeFade(L, hx, hy, 0, 0, 20);
      havDot.setAttribute('opacity', havOp);
      place(havLbl, hx, hy, havOp);

      for (const dl of depthLabels) {
        const [x, y] = pr(dl.p);
        dl.d.style.display = '';
        const w = dl.d.offsetWidth, h = dl.d.offsetHeight;
        const o = inRange([4, 30]) * edgeFade(L, x - w / 2, y - h / 2, w, h, 30) * (1 - 0.85 * life(gt, T.above, T.secOut, 12, 12));
        dl.d.style.opacity = o.toFixed(3); dl.d.style.display = o < 0.01 ? 'none' : '';
        dl.d.style.transform = `translate(${(x - w / 2).toFixed(2)}px, ${(y - h / 2).toFixed(2)}px) rotate(${dl.a.toFixed(1)}deg)`;
      }

      // graticule ticks: only on the wide shots (opening and closing)
      const tickOp = Math.max(1 - progress(gt, T.route0, T.route0 + 0.6), progress(gt, T.later - 0.6, T.later + 0.2));
      for (const tk of latTicks) {
        tk.d.style.display = '';
        const y = pr([0, mercY(tk.lat)])[1], h = tk.d.offsetHeight, w = tk.d.offsetWidth;
        const x = L.safe.x + L.safe.w - w;
        const o = tickOp * edgeFade(L, x, y - h - px(6), w, h, 60);
        tk.d.style.opacity = o.toFixed(3); tk.d.style.display = o < 0.01 ? 'none' : '';
        tk.d.style.transform = `translate(${x.toFixed(2)}px, ${(y - h - px(4)).toFixed(2)}px)`;
      }
      for (const tk of lonTicks) {
        tk.d.style.display = '';
        const x = pr([tk.lon, 0])[0], h = tk.d.offsetHeight, w = tk.d.offsetWidth;
        const y = L.safe.y + L.safe.h - h;
        const o = tickOp * edgeFade(L, x + px(6), y, w, h, 60) * (x + w > L.safe.x + L.safe.w - px(150) ? 0 : 1);
        tk.d.style.opacity = o.toFixed(3); tk.d.style.display = o < 0.01 ? 'none' : '';
        tk.d.style.transform = `translate(${(x + px(6)).toFixed(2)}px, ${y.toFixed(2)}px)`;
      }

      // scale bar
      {
        const kmPerUnit = 111.32 * Math.cos(24 / 57.3) * Math.cos(24 / 57.3); // Mercator unit ≈ 111.32·cosφ km on the ground at φ=24°
        const pxPerKm = cm.k / (111.32 * Math.cos(24 / 57.3));
        const nice = [50, 100, 200, 300, 500].find(n => n * pxPerKm >= px(150)) ?? 500;
        const len = nice * pxPerKm;
        const x0 = L.safe.x, y0 = L.safe.y + L.safe.h - px(L.portrait ? 6 : 64);
        const o = Math.max(tickOp, 0) * (L.portrait ? 0 : 1);
        scaleLine.setAttribute('d', `M${x0} ${y0 - px(8)}L${x0} ${y0}L${x0 + len} ${y0}L${x0 + len} ${y0 - px(8)}`);
        scaleLine.setAttribute('stroke-width', lw(LW.line));
        scaleG.setAttribute('opacity', o);
        scaleLbl.textContent = `${nice} km`;
        scaleLbl.style.opacity = o; scaleLbl.style.display = o < 0.01 ? 'none' : '';
        scaleLbl.style.transform = `translate(${(x0).toFixed(2)}px, ${(y0 - px(48)).toFixed(2)}px)`;
        void kmPerUnit;
      }

      // B-59 track with moving head — constant screen-ish speed, eased only at the ends
      const rp = progress(gt, T.route0, T.route1);
      const rpe = rp < 0.12 ? rp * rp / 0.24 : rp > 0.88 ? 1 - (1 - rp) * (1 - rp) / 0.24 : rp - 0.06; // linear middle, eased 10 % ends
      const rq = clamp(rpe / 0.88);
      const hd = along(rq);
      let d = '';
      { let acc = 0; d = 'M' + pr(routeW[0]).join(' ');
        for (let i = 1; i < routeW.length; i++) {
          const a = routeW[i - 1], b = routeW[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (acc + l <= rq * routeLen) d += 'L' + pr(b).join(' ');
          else { const q = (rq * routeLen - acc) / l; d += 'L' + pr([lerp(a[0], b[0], q), lerp(a[1], b[1], q)]).join(' '); break; }
          acc += l;
        } }
      const routeFade = 1 - 0.75 * progress(gt, T.on, T.on + 0.6);
      route.setAttribute('d', rq > 0 ? d : '');
      route.setAttribute('opacity', routeFade * (rq > 0 ? 1 : 0));
      const [hx2, hy2] = pr(hd.p);
      const headVis = rq > 0 && rq < 1 ? 1 : 0;
      head.setAttribute('transform', `translate(${hx2.toFixed(2)} ${hy2.toFixed(2)})`);
      head.setAttribute('opacity', headVis);

      // boat mark + uncertainty ring
      const [bx, by] = ll(P.sub);
      const arrive = enterP(gt, T.route1 - 0.05, 14);
      const boatHide = 1 - progress(gt, T.on + 0.2, T.on + 0.7) * 0.0; // the boat stays: it is the anchor of the inset
      boat.setAttribute('transform', `translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${(hd.ang * 57.3).toFixed(1)}) scale(${(0.6 + 0.4 * arrive).toFixed(3)})`);
      boat.setAttribute('opacity', arrive * boatHide);
      const uncR = 0.35 * cm.k; // ±0.35° — we show the position is approximate
      unc.setAttribute('cx', bx); unc.setAttribute('cy', by); unc.setAttribute('r', Math.max(px(30), uncR));
      unc.setAttribute('opacity', 0.8 * enterP(gt, T.deep, 16) * (1 - life(gt, T.on, 99, 12, 12)));

      // labels around the boat (hidden while the section card / inset take over that space)
      const scene1Lbl = life(gt, T.sub + 0.9, T.above - 0.2, 16, 10);
      place(subLbl, bx, by, Math.max(scene1Lbl, life(gt, T.moscow, T.on - 0.1, 14, 10)));
      place(coordLbl, bx, by + px(4), life(gt, T.sub + 1.1, T.above - 0.2, 16, 10));
      place(seabedLbl, bx, by + px(4), 0);

      // distance to Cuba
      {
        const o = life(gt, T.cuba, T.above - 0.25, 14, 10);
        const [mx, my] = ll(P.maisi);
        const k = clamp(tok.enter(progress(gt, T.cuba, T.cuba + 0.5)));
        const ex = lerp(bx, mx, k), ey = lerp(by, my, k);
        const ang = Math.atan2(my - by, mx - bx), nx = -Math.sin(ang) * px(10), ny = Math.cos(ang) * px(10);
        const pad = px(34), sx0 = bx + Math.cos(ang) * pad, sy0 = by + Math.sin(ang) * pad;
        dimLine.setAttribute('d', `M${sx0} ${sy0}L${ex} ${ey}M${sx0 - nx} ${sy0 - ny}L${sx0 + nx} ${sy0 + ny}` + (k > 0.98 ? `M${ex - nx} ${ey - ny}L${ex + nx} ${ey + ny}` : ''));
        dimLine.setAttribute('stroke-width', lw(LW.hair));
        dim.setAttribute('opacity', o);
        place(dimLbl, (sx0 + mx) / 2, (sy0 + my) / 2, o * progress(gt, T.cuba + 0.2, T.cuba + 0.5));
      }

      // section line
      {
        const o = life(gt, T.above, T.secOut, 14, 12);
        const a = ll(data.facts.section.from), b = ll(data.facts.section.to);
        const k = tok.move(progress(gt, T.above, T.above + 0.7));
        secLine.setAttribute('d', `M${a[0]} ${a[1]}L${lerp(a[0], b[0], k)} ${lerp(a[1], b[1], k)}`);
        secLine.setAttribute('stroke-width', lw(LW.line));
        secG.setAttribute('opacity', o);
        place(secA, a[0], a[1], o);
        place(secB, b[0], b[1], o * (k > 0.95 ? 1 : 0));
      }

      // ships
      for (const sh of ships) {
        const k = tok.enter(progress(gt, T.ships + sh.i * 0.1, T.ships + sh.i * 0.1 + 1.2));
        const a = ll(sh.from), b = ll(sh.to);
        const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k);
        const o = enterP(gt, T.ships + sh.i * 0.1, 10) * (1 - progress(gt, T.on, T.on + 0.5));
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 57.3;
        sh.gS.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${ang.toFixed(1)})`);
        sh.gS.setAttribute('opacity', o);
        sh.trk.setAttribute('d', `M${a[0]} ${a[1]}L${x} ${y}`);
        sh.trk.setAttribute('opacity', o * 0.55);
      }
      {
        const a = ll(ships[3].to);
        place(shipLbl, a[0], a[1], life(gt, T.ships + 0.5, T.on - 0.1, 14, 10) * (1 - life(gt, T.above + 0.3, T.secOut + 0.2, 1, 1) * 0) );
      }
      for (const b of bursts) {
        const q = progress(gt, b.tb, b.tb + 1.0);
        const [x, y] = ll(b.ll);
        b.c.setAttribute('cx', x); b.c.setAttribute('cy', y);
        b.c.setAttribute('r', px(6) + tok.enter(q) * px(46));
        b.c.setAttribute('opacity', q > 0 && q < 1 ? (1 - q) * 0.9 : 0);
      }

      // Moscow link
      {
        const o = life(gt, T.moscow, T.on - 0.05, 14, 10);
        const th = (brg - 90) / 57.3; // screen angle (north-up, Mercator: bearing ≈ rhumb direction near the boat)
        const r0 = px(40);
        // end at the safe edge
        const s = L.safe, dx = Math.cos(th), dy = Math.sin(th);
        const tx = dx > 0 ? (s.x + s.w - px(60) - bx) / dx : Infinity, ty = dy < 0 ? (s.y + px(110) - by) / dy : Infinity;
        const r1 = Math.min(tx, ty);
        const grow = tok.enter(progress(gt, T.moscow, T.moscow + 0.6));
        const breakP = progress(gt, T.silent, T.silent + 0.7);
        mosSegs.forEach((sg, i) => {
          const a = r0 + (r1 - r0) * i / mosSegs.length, b = r0 + (r1 - r0) * (i + 0.62) / mosSegs.length;
          const vis = (i + 1) / mosSegs.length <= grow + 0.001 ? 1 : 0;
          // the far half drops out from the Moscow end: the link goes dead
          const dead = i >= mosSegs.length / 2 && breakP > (mosSegs.length - 1 - i) / (mosSegs.length / 2) ? 1 : 0;
          sg.setAttribute('d', `M${bx + dx * a} ${by + dy * a}L${bx + dx * b} ${by + dy * b}`);
          sg.setAttribute('stroke-width', lw(LW.route));
          sg.setAttribute('opacity', vis * (dead ? 0.0 : 1));
        });
        const ex = bx + dx * r1, ey = by + dy * r1, aw = px(16);
        mosArrow.setAttribute('d', `M${ex + dx * aw} ${ey + dy * aw}L${ex - dy * aw * 0.55} ${ey + dx * aw * 0.55}L${ex + dy * aw * 0.55} ${ey - dx * aw * 0.55}Z`);
        mosG.setAttribute('opacity', o);
        mosArrow.setAttribute('opacity', grow > 0.97 ? 1 : 0);
        place(mosLbl, ex, ey, o * progress(gt, T.moscow + 0.3, T.moscow + 0.6));
        const mx = bx + dx * (r0 + (r1 - r0) * 0.72), my = by + dy * (r0 + (r1 - r0) * 0.72);
        place(silentLbl, mx, my, life(gt, T.silent + 0.25, T.on - 0.05, 14, 10));
      }

      // 2002: the route to Havana with a moving head (bezier through a control point)
      {
        const q = progress(gt, T.world + 0.25, T.later + 0.1);
        const qe = q < 0.1 ? q * q / 0.2 : q > 0.9 ? 1 - (1 - q) * (1 - q) / 0.2 : q - 0.05;
        const qq = clamp(qe / 0.9);
        const A = ll(P.sub), Bc = ll(havCtrl), Cc = ll(P.havana);
        const pt = s => [(1 - s) ** 2 * A[0] + 2 * (1 - s) * s * Bc[0] + s * s * Cc[0], (1 - s) ** 2 * A[1] + 2 * (1 - s) * s * Bc[1] + s * s * Cc[1]];
        let dd = 'M' + A.join(' ');
        for (let i = 1; i <= 48; i++) { const s2 = qq * i / 48; dd += 'L' + pt(s2).join(' '); }
        havRoute.setAttribute('d', qq > 0 ? dd : '');
        const [x, y] = pt(qq);
        havHead.setAttribute('cx', x); havHead.setAttribute('cy', y);
        havHead.setAttribute('opacity', qq > 0 ? 1 : 0);
      }
      grade.style.opacity = (0.075 * tok.move(progress(gt, wt('On') - 0.3, wt('yes') + 0.3)) * (1 - tok.move(progress(gt, wt('no') - 0.1, wt('no') + 0.9)))).toFixed(4);
      void grain; void H;
    },
  };
}
