// 1 · HOOK + ORIENT. KNOW: 27 Oct 1962, a Soviet submarine near Cuba. FEEL: quiet curiosity. SEE: the date set as stamps.
// 1A (0–2.6 s)  CU on a glassine strip: three numeral stamps are laid in on their words: X·OCTOBER, 27, 1962.   truth: VO
// 1B (2.6–7 s)  pan to the big map issue; a datestamp strikes it; the loupe comes down on the submarine,
//               pushes in on "deep"; pencil note "near Cuba — approx." on "Cuba".                     truth: RC (approx. area)
import { glide, clamp, spring, svg, keyframes, ease } from '/onclack-styles/engine/lib/anim.js';
import { C, F, makeLeaf, makeStamp, imageArea, screen, makePostmark, showStrike, strike, makePencil, makeLoupe, makeStrip, caption, txt } from '../shared/album.js';
import { subD } from '../shared/art.js';

const place = (t, t0) => (t < t0 ? 0 : clamp(spring(t - t0, { stiffness: 320, damping: 26 }), 0, 1.02));

export default async function (root, ctx) {
  const pg = makeLeaf(root, ctx, { name: '1 · Album leaf', header: 'SEA POST · NAVAL EPISODES', folio: 'leaf 1' });
  const { W, H, L, u, content } = pg;
  const port = L.portrait;
  const g0 = ctx.start;

  // ---------- 1A numeral strip ----------
  const sx0 = L.pick({ landscape: 1105, portrait: 108 }) * u, sy0 = L.pick({ landscape: 250, portrait: 230 }) * u;
  const sh = 240 * u, ws = [200 * u, 200 * u, 290 * u], gap = 24 * u;
  const stripW = ws.reduce((a, b) => a + b) + gap * 2;
  const numerals = [
    { big: 'X', small: 'OCTOBER', ink: C.ochre, rot: -0.7, name: '1A Stamp: October (X)' },
    { big: '27', small: 'DAY', ink: C.prussian, rot: 0.9, name: '1A Stamp: 27' },
    { big: '1962', small: 'YEAR', ink: C.slate, rot: -0.3, name: '1A Stamp: 1962' },
  ];
  let xx = sx0;
  const nStamps = numerals.map((n, i) => {
    const st = makeStamp(pg, content, { x: xx, y: sy0, w: ws[i], h: sh, seed: 11 + i, rot: n.rot, name: n.name, shortPerf: i === 1 ? 7 : -1 });
    xx += ws[i] + gap;
    const ia = imageArea(pg, st);
    svg('rect', { x: st.ix, y: st.iy, width: st.iw, height: st.ih, fill: n.ink }, ia);
    svg('rect', { x: st.ix + 7 * u, y: st.iy + 7 * u, width: st.iw - 14 * u, height: st.ih - 14 * u, fill: 'none', stroke: C.stampPaper, 'stroke-width': 2 * u, opacity: 0.8 }, ia);
    txt(ia, 'SEA POST', st.ix + st.iw / 2, st.iy + 34 * u, 19 * u, { fill: C.stampPaper, 'font-family': F.stamp, 'font-weight': 600, 'letter-spacing': 3 * u });
    const bs = n.big.length > 2 ? 96 : 118;
    txt(ia, n.big, st.ix + st.iw / 2, st.iy + st.ih * 0.66, bs * u, { fill: C.stampPaper, 'font-family': F.stamp, 'font-weight': 600 });
    txt(ia, n.small, st.ix + st.iw / 2, st.iy + st.ih - 18 * u, 17 * u, { fill: C.stampPaper, 'font-family': F.print, 'font-weight': 600, 'letter-spacing': 4 * u, opacity: 0.9 });
    return st;
  });
  makeStrip(pg, content, { x: sx0 - 30 * u, y: sy0 + sh * 0.42, w: stripW + 60 * u, h: sh * 0.62, name: '1A Glassine strip' });
  caption(pg, content, sx0 + stripW / 2, sy0 + sh + 58 * u, 'DATE OF THE EPISODE', 'SP 62 · 1–3', { name: '1A Printed caption' });

  // ---------- 1B map issue ----------
  const M = L.pick({ landscape: { x: 150, y: 170, w: 900, h: 640 }, portrait: { x: 100, y: 660, w: 800, h: 740 } });
  const ms = makeStamp(pg, content, { x: M.x * u, y: M.y * u, w: M.w * u, h: M.h * u, seed: 21, rot: 0.35, margin: 0.06, name: '1B Map issue' });
  const ia = imageArea(pg, ms);
  const { ix, iy, iw, ih } = ms;
  svg('rect', { x: ix, y: iy, width: iw, height: ih, fill: C.prussian }, ia);
  const band = ih * 0.13;
  const mapBox = { x: ix + 16 * u, y: iy + band, w: iw - 32 * u, h: ih - band * 2 };
  svg('rect', { x: mapBox.x, y: mapBox.y, width: mapBox.w, height: mapBox.h, fill: screen(pg, '#2F6A8C', { gap: 7, w: 2.2, bg: C.prussian }) }, ia);
  const view = L.pick({ landscape: [-87, 18, -66, 29.6], portrait: [-85.5, 18.4, -68.5, 29.6] });
  const c = Math.cos(24 * Math.PI / 180);
  const s = Math.min(mapBox.w / ((view[2] - view[0]) * c), mapBox.h / (view[3] - view[1]));
  const ox = mapBox.x + (mapBox.w - (view[2] - view[0]) * c * s) / 2, oy = mapBox.y + (mapBox.h - (view[3] - view[1]) * s) / 2;
  const proj = ([lo, la]) => [ox + (lo - view[0]) * c * s, oy + (view[3] - la) * s];
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const mapClip = 'mc' + ctx.format;
  const mcp = svg('clipPath', { id: mapClip }, pg.defs);
  svg('rect', { x: mapBox.x, y: mapBox.y, width: mapBox.w, height: mapBox.h }, mcp);
  const mapG = svg('g', { 'clip-path': `url(#${mapClip})`, 'data-name': '1B Map (litho)' }, ia);
  const mis = 3.2 * u; // second plate (ochre) misregistered — constant for this "printing"
  for (const f of geo.features) {
    const d = f.rings.filter((r) => r.length > 4).map((r) => 'M ' + r.map((p) => proj(p).map((v) => v.toFixed(1)).join(' ')).join(' L ') + ' Z').join(' ');
    if (!d) continue;
    svg('path', { d, fill: f.name === 'Cuba' ? '#D9A64B' : C.ochre, transform: `translate(${mis} ${mis * 0.6})` }, mapG);
    svg('path', { d, fill: 'none', stroke: '#14354A', 'stroke-width': 2.2 * u, 'stroke-linejoin': 'round' }, mapG);
  }
  svg('rect', { x: mapBox.x, y: mapBox.y, width: mapBox.w, height: mapBox.h, fill: 'none', stroke: C.stampPaper, 'stroke-width': 2.4 * u }, ia);
  const lab = (t2, lo, la, sz, nm) => { const [a, b] = proj([lo, la]); return txt(ia, t2, a, b, sz * u, { fill: '#14354A', 'font-family': F.print, 'font-weight': 800, 'letter-spacing': 3 * u, 'data-name': nm }); };
  lab('CUBA', -79.3, 21.75, 30, '1B Label Cuba');
  lab('FLORIDA', port ? -81.5 : -81.6, 28.0, 22, '1B Label Florida');
  // the submarine, approximate area (sources differ) — dashed ring, in the same prussian/cream as the plate
  const subLL = L.pick({ landscape: [-71.8, 25.2], portrait: [-72.6, 25.0] });
  const [sbx, sby] = proj(subLL);
  svg('circle', { cx: sbx, cy: sby, r: 62 * u, fill: 'none', stroke: C.stampPaper, 'stroke-width': 2.4 * u, 'stroke-dasharray': `${9 * u} ${7 * u}`, opacity: 0.85, 'data-name': '1B Approx. area ring' }, ia);
  const sp = subD(80 * u);
  const subG = svg('g', { transform: `translate(${sbx} ${sby})`, fill: C.stampPaper, 'data-name': '1B Submarine' }, ia);
  for (const d of [sp.hull, sp.sail, sp.tail]) svg('path', { d }, subG);
  txt(ia, 'APPROX.', sbx, sby + 92 * u, 17 * u, { fill: C.stampPaper, 'font-family': F.mono, 'letter-spacing': 2 * u, opacity: 0.9 });
  // inscriptions
  txt(ia, 'SEA POST', ix + 26 * u, iy + band * 0.68, 38 * u, { fill: C.stampPaper, 'font-family': F.stamp, 'font-weight': 600, 'text-anchor': 'start', 'letter-spacing': 4 * u });
  txt(ia, '27', ix + iw - 26 * u, iy + band * 0.8, 62 * u, { fill: C.ochre, 'font-family': F.stamp, 'font-weight': 600, 'text-anchor': 'end' });
  txt(ia, 'THE HIDDEN BOAT · OCTOBER 1962', ix + iw / 2, iy + ih - band * 0.34, (port ? 27 : 31) * u, { fill: C.stampPaper, 'font-family': F.stamp, 'font-weight': 600, 'letter-spacing': 3 * u });
  if (!port) caption(pg, content, (M.x + M.w / 2) * u, (M.y + M.h + 58) * u, 'NO. 4 · THE HIDDEN BOAT', 'SP 62 · 4 · two-colour litho', { name: '1B Printed caption' });
  // datestamp, struck on the stamp (masked to the paper: the ink only takes on the stamp)
  const pmx = ms.w * 0.115, pmy = ms.h * 0.84;
  const pm = makePostmark(pg, ms.marks, { cx: pmx, cy: pmy, r: 92 * u, ring: 'SEA POST · CARIBBEAN', mid: '27 X 62', bars: false, rot: 14, seed: 5, name: '1B Datestamp 27 X 62' });
  // pencil note
  const pen = makePencil(pg, content, L.pick({
    landscape: { x: (M.x + 40) * u, y: (M.y + M.h + 128) * u, text: 'near Cuba — approx. area', size: 36 * u, name: '1B Pencil note' },
    portrait: { x: (M.x + 30) * u, y: (M.y + M.h + 74) * u, text: 'near Cuba — approx.', size: 38 * u, name: '1B Pencil note' },
  }));
  const loupe = makeLoupe(pg, content, [ms.id], { r: L.pick({ landscape: 150, portrait: 150 }), name: '1B Loupe' });

  // ---------- sound ----------
  ctx.ambience('sea-water-close-01', { from: 3.2, to: ctx.duration, lu: -27, fade: 1.6 }); // the sea, faint, once the map is in view
  ctx.sfx('page-turn-01', 0.42, { lu: -20 });
  ctx.sfx('page-turn-01', 0.98, { lu: -22 });
  ctx.sfx('page-turn-01', 1.95, { lu: -21 });
  ctx.sfx('letterpress-manual-01', 3.42, { lu: -11 });   // datestamp strike
  ctx.sfx('drawer-close-01', 4.15, { lu: -24 });         // loupe set down on the leaf

  const tm = [0.5, 1.02, 1.98];
  return {
    update(t) {
      const g = g0 + t;
      nStamps.forEach((st, i) => {
        const p = place(g, tm[i]);
        st.outer.style.opacity = clamp((g - tm[i] + 0.04) * 12);
        st.setPose(0, -70 * u * (1 - p), st.rot + (1 - p) * 4, 1 + 0.05 * (1 - p), 1 - clamp(p));
      });
      showStrike(pm, strike(g, 3.45), pmx, pmy);
      pen.set(clamp((g - 6.35) / 1.3));
      // loupe: slides in from lower right, settles on the sub; pushes magnification on "deep"
      const lp = clamp(spring(t - 3.9, { stiffness: 60, damping: 15 }), 0, 1.03);
      const subWorld = [ms.x + sbx, ms.y + sby];
      const fromP = [subWorld[0] + 520 * u, subWorld[1] + 420 * u];
      const lx = fromP[0] + (subWorld[0] - fromP[0]) * lp, ly = fromP[1] + (subWorld[1] - fromP[1]) * lp;
      const mag = 2.1 + 0.55 * clamp(spring(g - 5.38, { stiffness: 90, damping: 16 }), 0, 1.05);
      loupe.set(lx, ly - 4 * u, mag, clamp((t - 3.85) * 4));
      // camera: CU on the numeral strip → pan to the map issue → slow push toward the loupe
      const A = L.pick({ landscape: [sx0 + stripW / 2, sy0 + sh * 0.6, 1.42], portrait: [W / 2, 690 * u, 1.1] });
      const B = L.pick({ landscape: [(M.x + M.w / 2 + 40) * u, (M.y + M.h / 2 + 40) * u, 1.12], portrait: [W / 2, (M.y + M.h / 2 + 10) * u, 1.12] });
      const Cc = L.pick({ landscape: [subWorld[0] - 120 * u, subWorld[1] + 20 * u, 1.3], portrait: [subWorld[0] - 60 * u, subWorld[1] + 40 * u, 1.3] });
      const Dd = L.pick({ landscape: [(M.x + M.w / 2 + 120) * u, (M.y + M.h / 2 + 110) * u, 1.04], portrait: [W / 2, (M.y + M.h / 2 + 60) * u, 1.06] });
      const k1 = glide(t, 2.55, 3.65, 0, 1), k2 = glide(t, 4.2, 5.9, 0, 1), k3 = glide(t, 6.0, 7.6, 0, 1);
      const mixv = (i) => A[i] + (B[i] - A[i]) * k1 + (Cc[i] - B[i]) * k2 + (Dd[i] - Cc[i]) * k3;
      pg.cam(mixv(0), mixv(1), mixv(2) * (1 + 0.006 * t));
    },
  };
}
