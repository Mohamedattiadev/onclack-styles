// 1 · CHART PLATE — "October 27th, 1962. A Soviet submarine hides deep in the sea near Cuba."
// Hook: the date set like a chapter opener (MCU on type) → camera pulls back to reveal Fig. 1, the book-plate map.
// The ✱ (only red thing) lands on the submarine's approximate position; our pencil admits "position approx.".
import { el, svg } from '/onclack-styles/engine/lib/anim.js';
import { glide, creep } from '/onclack-styles/engine/lib/spring.js';
import { C, F, tok, at, page, chrome, camera, text, sc, mark, placeMark, filters, grain, stroke, pencilLoop, pencilLine, hand, progress, fontsReady } from '../shared/kit.js';

export default async function (root, ctx) {
  await fontsReady();
  const L = ctx.layout, W = L.width, H = L.height, P = L.portrait, u = L.px;
  const S = ctx.start; const lt = g => g - S; // global → local seconds
  const fx = filters(root, 's1', L);
  const pg = page(root, L, { w: W, h: H, seed: 3, name: '1 · Page' });

  const x0 = P ? L.safe.x + u(14) : Math.round(W * 0.075), x1 = P ? L.safe.x + L.safe.w - u(18) : Math.round(W * 0.935); // portrait: 18 px inside safe so the hold creep never pushes text out
  chrome(pg, L, { left: 'the arkhipov footnote', right: '§ 1 · the sea', top: P ? L.safe.y + u(26) : L.safe.y + u(4), x0, x1 });

  // ---------- date block (hero of 1A) ----------
  const dTop = P ? H * 0.135 : H * 0.285;
  const big = u(P ? 112 : 122);
  const ink = { filter: fx.ink };
  const kicker = text(pg, sc('saturday') + `<span style="color:${C.pencil}"> &nbsp;·&nbsp; </span>` + sc('day twelve'), { left: `${x0}px`, top: `${dTop}px`, fontSize: `${u(40)}px`, ...ink }, '1A · Kicker');
  const l1 = text(pg, '27 October', { left: `${x0 - big * 0.04}px`, top: `${dTop + u(70)}px`, fontSize: `${big}px`, fontStyle: 'italic', letterSpacing: '-0.015em', ...ink }, '1A · Date line 1');
  const l2 = text(pg, '1962', { left: `${x0 - big * 0.02}px`, top: `${dTop + u(70) + big * 1.02}px`, fontSize: `${big}px`, letterSpacing: '-0.01em', fontFeatureSettings: '"kern","lnum"', ...ink }, '1A · Year');
  const dek = text(pg, 'the thirteen days, day 12', { left: `${x0}px`, top: `${dTop + u(70) + big * 2.25}px`, fontFamily: F.mono, fontSize: `${u(30)}px`, color: C.pencil }, '1A · Dek');
  dek.innerHTML = 'Cuban Missile Crisis — <span style="color:#1A1714;display:inline-block">Black Saturday</span>';
  // a short rubric rule under the year (ink, not red — red is only for ✱)
  const rule = el('div', { 'data-name': '1A · Rule', style: { position: 'absolute', left: `${x0}px`, top: `${dTop + u(70) + big * 2.08}px`, width: `${u(96)}px`, height: `${u(3)}px`, background: C.ink, transformOrigin: '0 50%' } }, pg);

  // ---------- Fig. 1 — book-plate map ----------
  const mapW = P ? x1 - x0 : Math.round(W * 0.935 - W * 0.445);
  const geo = await (await fetch(ctx.asset('assets/caribbean-land.json'))).json();
  const mapH = Math.round(mapW * geo.height / geo.width);
  const mx = P ? x0 : Math.round(W * 0.445), my = P ? Math.round(H * 0.355) : Math.round(H * 0.165);
  const k = mapW / 1000; // svg units → px
  const plate = el('div', { 'data-name': '1B · Fig. 1 plate', style: { position: 'absolute', left: `${mx}px`, top: `${my}px`, width: `${mapW}px`, height: `${mapH}px`, outline: `${u(2)}px solid ${C.ink}`, outlineOffset: `${u(10)}px` } }, pg);
  const ms = svg('svg', { width: mapW, height: mapH, viewBox: `0 0 1000 ${geo.height}`, 'data-name': '1B · Map', style: { position: 'absolute', inset: '0', overflow: 'hidden' } }, plate);
  // engraver's water-lining: concentric rings around every coast (ink ring, then paper ring on top)
  const rings = svg('g', { 'data-name': '1B · Water lines', opacity: 0.8 }, ms);
  const sw = 1.3 / k;
  for (let i = 4; i >= 1; i--) {
    const wv = i * 9.5 / k * 2 - sw;
    svg('path', { d: geo.d, fill: 'none', stroke: C.ink, 'stroke-width': wv + sw * 2, 'stroke-linejoin': 'round', opacity: 0.62 - 0.12 * i }, rings);
    svg('path', { d: geo.d, fill: 'none', stroke: C.paper, 'stroke-width': wv, 'stroke-linejoin': 'round' }, rings);
  }
  svg('path', { d: geo.d, fill: C.paper, stroke: 'none' }, ms);
  svg('path', { d: geo.d, fill: C.inkTint, stroke: C.ink, 'stroke-width': 2 / k, 'stroke-linejoin': 'round', 'data-name': '1B · Coastline', filter: fx.ink }, ms);
  // graticule ticks at the plate edge (every 5°), like an atlas plate
  const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  const [LON0, LAT0, LON1, LAT1] = geo.bbox, kx = 1000 / ((LON1 - LON0) * Math.PI / 180);
  const proj = (lon, lat) => [(lon - LON0) * 1000 / (LON1 - LON0), (merc(LAT1) - merc(lat)) * kx];
  const tg = svg('g', { stroke: C.ink, 'stroke-width': 1.6 / k }, ms);
  for (let lon = -85; lon <= -65; lon += 5) { const [x] = proj(lon, 20); svg('line', { x1: x, y1: 0, x2: x, y2: 14 / k }, tg); svg('line', { x1: x, y1: geo.height, x2: x, y2: geo.height - 14 / k }, tg); }
  for (let lat = 15; lat <= 30; lat += 5) { const [, y] = proj(-80, lat); svg('line', { x1: 0, y1: y, x2: 14 / k, y2: y }, tg); svg('line', { x1: 1000, y1: y, x2: 1000 - 14 / k, y2: y }, tg); }
  // labels (constant px size: font-size in svg units = px / k)
  const lab = (str, lon, lat, px, style = {}, name) => {
    const [x, y] = proj(lon, lat);
    const t = svg('text', { x, y, 'font-size': px / k, 'font-family': "'Newsreader', serif", fill: C.ink, 'text-anchor': 'middle',
      stroke: C.paper, 'stroke-width': 5 / k, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'data-name': name ?? `1B · Label · ${str}`, ...style }, ms);
    t.textContent = str; return t;
  };
  lab('C U B A', -79.2, 20.55, u(P ? 46 : 44), { 'letter-spacing': 2 / k, 'font-weight': 600 }, '1B · Label · Cuba');
  const atl = lab('Atlantic Ocean', -67.5, 28.6, u(P ? 40 : 38), { 'font-style': 'italic', fill: C.pencil });
  const car = lab('Caribbean Sea', -76, 15.3, u(P ? 40 : 38), { 'font-style': 'italic', fill: C.pencil });
  const [hx, hy] = proj(-82.38, 23.13);
  svg('circle', { cx: hx, cy: hy, r: 5 / k, fill: C.ink }, ms);
  const hav = svg('text', { x: hx - 12 / k, y: hy - 12 / k, 'font-size': u(28) / k, 'font-family': "'Newsreader', serif", 'font-style': 'italic', 'text-anchor': 'end', fill: C.ink, stroke: C.paper, 'stroke-width': 6 / k, 'paint-order': 'stroke', 'data-name': '1B · Label · Havana' }, ms); hav.textContent = 'Havana';

  // caption under the plate
  const capTop = my + mapH + u(30);
  const cap1 = text(pg, `<i>Fig. 1.</i>&ensp;The Caribbean, October 1962.`, { left: `${mx}px`, top: `${capTop}px`, fontSize: `${u(P ? 36 : 34)}px`, ...ink }, '1B · Caption');
  const src1 = text(pg, 'coastlines: natural earth · position of b-59 approximate', { left: `${mx}px`, top: `${capTop + u(50)}px`, fontFamily: F.mono, fontSize: `${u(P ? 24 : 22)}px`, color: C.pencil, letterSpacing: '0.01em' }, '1B · Source line');

  // ---------- overlay layer for ✱ + pencil (page space) ----------
  const [sx0, sy0] = proj(-70.6, 23.4);
  const subX = mx + sx0 * k, subY = my + sy0 * k;
  const ov = svg('svg', { width: W, height: H, style: { position: 'absolute', inset: '0', overflow: 'visible' }, 'data-name': '1B · Pencil layer' }, pg);
  const loop = stroke(ov, pencilLoop(subX, subY, u(78), u(56), 7), { width: u(3.2), filter: fx.graphite, name: '1B · Pencil loop' });
  const m = mark(pg, u(P ? 30 : 28), { name: '1B · ✱ B-59' });
  const note = hand(pg, 'position approx.', { size: u(P ? 36 : 34), seed: 5, filter: fx.graphite, style: { left: `${subX + u(28)}px`, top: `${subY + u(82)}px`, transform: 'rotate(-3deg)' } });
  const arrow = stroke(ov, pencilLine([subX + u(40), subY + u(84)], [subX + u(30), subY + u(58)], 3), { width: u(3), filter: fx.graphite, name: '1B · Pencil tick' });
  const [cbx, cby] = proj(-79.2, 20.55);
  const ul = stroke(ov, pencilLine([mx + cbx * k - u(70), my + cby * k + u(14)], [mx + cbx * k + u(74), my + cby * k + u(11)], 9, 0.05), { width: u(3.2), filter: fx.graphite, name: '1B · Underline Cuba' });

  const gr = grain(root, L, 0.055);
  const lateL = [...pg.querySelectorAll('[data-name^="Running head"]'), atl, car, cap1, src1];

  // ---------- camera ----------
  const dateCx = P ? W / 2 : x0 + u(330), dateCy = dTop + big * 1.25;
  const s0 = P ? 1.0 : 1.42; // portrait: the column already fills the frame — the plate is tipped in instead
  const startCx = Math.max(W / (2 * s0), dateCx), startCy = Math.max(H / (2 * s0), dateCy, P ? 0 : u(505)); // landscape: running head fully out of the first frame (no half-cut rule)
  const restCx = W / 2, restCy = H / 2;

  // word times (global) → local
  const T = { oct: lt(0.58), y62: lt(2.07), sub: lt(4.3), hides: lt(4.93), deep: lt(5.42), cuba: lt(6.52) };

  return {
    update(t, p, g) {
      gr.update(g ?? S + t);
      // type presses in (rise 10 design px, enter token 15 f)
      const press = (node, a) => { const q = at(t, a, a + 0.5); node.style.opacity = String(q); node.style.transform = `translateY(${(1 - q) * u(10)}px)`; };
      press(kicker, 0.15); press(l1, T.oct - 0.08); press(l2, T.y62 - 0.08); press(dek, T.y62 + 0.55);
      rule.style.transform = `scaleX(${at(t, T.y62 + 0.2, T.y62 + 0.75)})`;

      // camera: hold on the date with a slow creep, then pull out to reveal the plate (36 f), then creep
      const pull = tok.camera(progress(t, T.sub - 0.95, T.sub + 0.35));
      const sc0 = s0 * creep(t, 0.06), sc1 = creep(Math.max(0, t - (T.sub + 0.35)), 0.05);
      const s = sc0 + (sc1 - sc0) * pull;
      const cx = startCx + (restCx + u(P ? 0 : 40) - startCx) * pull, cy = startCy + (restCy + u(P ? 60 : 0) - startCy) * pull;
      camera(pg, L, Math.max(W / (2 * s), Math.min(W - W / (2 * s), cx)), Math.max(H / (2 * s), Math.min(H - H / (2 * s), cy)), s);

      if (!P) { // landscape opens as an MCU on the date: what the crop would cut is printed as the camera pulls back
        lateL.forEach((n, i) => { const q = at(t, T.sub - 0.75 + i * 0.07, T.sub - 0.3 + i * 0.07); n.style.opacity = String(q); });
      }
      if (P) { // tipped in: the plate slides up 40 px into place as the voice reaches "submarine"
        const q = at(t, T.sub - 0.55, T.sub + 0.05);
        [plate, cap1, src1].forEach(n => { n.style.opacity = String(q); n.style.transform = `translateY(${(1 - q) * u(40)}px)`; });
      }
      // ✱ lands 2 f before "hides"; pencil loop on "deep"; note; underline on "Cuba"
      placeMark(m, subX, subY, t - (T.hides - 0.07));
      loop.set(at(t, T.deep - 0.05, T.deep + 0.5, tok.move));
      note.set(progress(t, T.deep + 0.35, T.deep + 1.05));
      arrow.set(at(t, T.deep + 0.95, T.deep + 1.2));
      ul.set(at(t, T.cuba - 0.1, T.cuba + 0.18, tok.move));

      // exit: the spread slides left under the next page (move token, 15 f)
      const ex = tok.exit(progress(t, ctx.duration - 0.5, ctx.duration));
      root.style.transform = `translateX(${-ex * W * 0.22}px)`;
      root.style.filter = ex > 0 ? `brightness(${1 - ex * 0.08})` : '';
    },
  };
}
