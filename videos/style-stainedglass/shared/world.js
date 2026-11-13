// THE WINDOW — one leaded-glass window, four panels (2 × 2), read like a page: 1 · 2 / 3 · 4.
// The camera travels from panel to panel; panes ignite on their words as the light moves; at the end we step back
// and see the whole window glowing, the ruby NO the hottest pane in it.
//
// BEAT TABLE (global seconds from words.json; visuals land 2 f before the word)
// 1 · MAP     0–7.0   KNOW 27 Oct 1962, Soviet sub near Cuba · FEEL curiosity, cool dawn · SEE date panes ignite, Cuba lights last
//                     truth: coast = EV-derived (Natural Earth), simplified to glass cuts; sub position = RC "approx."
// 2 · ABOVE   7.0–13  KNOW US ships dropped practice charges; Moscow silent · FEEL pressure · SEE charge panes ignite downward,
//                     bursts round the amber sub; the real photo (EV, US Navy) fired into a roundel; Moscow's signal panes go dark
// 3 · VOTE    13–19.6 KNOW 3 officers must agree; 2 say yes · FEEL dread · SEE three lancets, two YES panes ignite amber, third stays dark
//                     truth: figures = VO (no faces, no likeness); roles as reported in later accounts
// 4 · NO      19.6–   KNOW Arkhipov said no; known 40 years later · FEEL relief/awe · SEE the ruby NO ignites (peak contrast),
//                     then the pull-back: the whole window lit
// Motif: the amber sub (P1, P2) → amber YES (P3) → ruby NO (P4, the only red glass in the film).
// Light arc: cool morning sun (P1) → white noon (P2/P3) → low warm evening (P4).
import { svg, clamp, rand, glide } from '/onclack-styles/engine/lib/anim.js';
import { PAL, pick, makeDefs, makePanel, dPoly, bbox, simplify, area, ellipse, arch, quarries, borderBand, waterCut, strips, mix, f1 } from './glass.js';

const F = 1 / 30;
const FONT = { serif: "'Instrument Serif', serif", grot: "'Schibsted Grotesk', sans-serif" };
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');

let cache = null; // the window is built once and handed to whichever scene is on screen

export async function mountWorld(root, ctx) {
  if (!cache) cache = build(root, ctx);
  const W = await cache;
  return {
    update(t) {
      if (W.node.parentNode !== root) root.appendChild(W.node);
      W.update(ctx.start + t);
    },
  };
}

async function build(root, ctx) {
  await Promise.all(['400 100px "Instrument Serif"', 'italic 400 100px "Instrument Serif"', '600 40px "Schibsted Grotesk"', '800 40px "Schibsted Grotesk"'].map(f => document.fonts.load(f)));
  const L = ctx.layout, W = L.width, H = L.height, P = L.portrait, u = L.px;
  const words = ctx.words || [];
  const wt = (w, n = 0, fb = 0) => { const h = words.filter(x => norm(x.word) === norm(w)); return (h[n] ? h[n].start : fb) - 2 * F; };
  const T = {
    oct: wt('October', 0, 0.58), d27: wt('twenty-seventh', 0, 1.1), y62: wt('nineteen', 0, 2.07), sov: wt('Soviet', 0, 3.79),
    sub: wt('submarine', 0, 4.3), deep: wt('deep', 0, 5.42), sea: wt('sea', 0, 5.98), cuba: wt('Cuba', 0, 6.52),
    above: wt('Above', 0, 7.56), amer: wt('American', 0, 8.07), ships: wt('ships', 0, 8.63), drop: wt('drop', 0, 8.95), prac: wt('practice', 0, 9.28),
    charges: wt('charges', 0, 10.05), moscow: wt('Moscow', 0, 10.95), silent: wt('silent', 0, 11.93), days: wt('days', 0, 12.49),
    board: wt('board', 0, 13.83), nuclear: wt('nuclear', 0, 14.48), torpedo: wt('torpedo', 0, 14.88), three: wt('three', 0, 16.51),
    officers: wt('officers', 0, 16.86), agree: wt('agree', 0, 17.61), two: wt('Two', 0, 18.29), yes: wt('yes', 0, 18.8),
    third: wt('third', 0, 20.25), vasili: wt('Vasili', 0, 20.61), arkh: wt('Arkhipov', 0, 21.12), no: wt('no', 0, 22.03),
    world: wt('world', 0, 23.07), forty: wt('forty', 0, 24.13), later: wt('later', 0, 24.73),
  };
  T.bursts = [T.charges + 0.2, T.charges + 0.56, T.charges + 0.93];
  // camera stops: panel i is on screen in [arrive, leave]
  const CAM = [
    { arrive: 0, leave: 6.95 },
    { arrive: 7.7, leave: 13.1 },
    { arrive: 14.0, leave: 19.55 },
    { arrive: 20.3, leave: 23.4 },
  ];
  const END = { from: 23.4, to: 26.0 };

  // ---------- stage ----------
  const node = svg('svg', { 'data-name': 'Window', width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;left:0;top:0;display:block' }, root);
  const D = makeDefs(node, L);
  svg('rect', { 'data-name': 'Hall wall', width: W, height: H, fill: '#0b0c0e' }, node);
  const world = svg('g', { 'data-name': 'Camera' }, node);
  const M = u(64), B = u(110), lw = u(P ? 10 : 12);
  const WW = 2 * W + M + 2 * B, WH = 2 * H + M + 2 * B;
  // stone surround + mullions: dressed stone, one key light from upper left, a contact shadow inside the reveal
  const stone = svg('g', { 'data-name': 'Stone surround' }, world);
  const sg = svg('linearGradient', { id: 'sg-stone', x1: 0, y1: 0, x2: 1, y2: 1 }, D.defs);
  svg('stop', { offset: 0, 'stop-color': '#3a3936' }, sg); svg('stop', { offset: 1, 'stop-color': '#1f1f1e' }, sg);
  svg('rect', { x: -u(40), y: -u(40), width: WW + u(80), height: WH + u(80), fill: 'url(#sg-stone)' }, stone);
  // ashlar joints (seeded, fixed) so the stone reads as built, not as a flat frame
  let jd = '';
  const course = u(150);
  for (let y = -u(40), r = 0; y < WH + u(40); y += course, r++) {
    jd += `M${f1(-u(40))} ${f1(y)}H${f1(WW + u(40))}`;
    for (let x = -u(40) + (r % 2 ? u(130) : 0); x < WW + u(40); x += u(260) + rand(r * 7 + x) * u(60)) jd += `M${f1(x)} ${f1(y)}v${f1(course)}`;
  }
  svg('path', { d: jd, stroke: '#111110', 'stroke-width': u(3), fill: 'none', opacity: 0.8 }, stone);
  svg('rect', { x: B - u(14), y: B - u(14), width: WW - 2 * B + u(28), height: WH - 2 * B + u(28), fill: '#0d0d0d' }, stone);
  svg('rect', { x: B - u(14), y: B - u(14), width: WW - 2 * B + u(28), height: u(16), fill: '#000', opacity: 0.45 }, stone);
  const panelXY = i => [B + (i % 2) * (W + M), B + Math.floor(i / 2) * (H + M)];
  // mullion + transom (stone bars between the panels)
  svg('rect', { 'data-name': 'Mullion', x: B + W, y: B - u(14), width: M, height: WH - 2 * B + u(28), fill: '#2c2b29' }, stone);
  svg('rect', { 'data-name': 'Transom', x: B - u(14), y: B + H, width: WW - 2 * B + u(28), height: M, fill: '#2c2b29' }, stone);
  svg('rect', { x: B + W, y: B - u(14), width: u(6), height: WH - 2 * B + u(28), fill: '#4a4844' }, stone);
  svg('rect', { x: B - u(14), y: B + H, width: WW - 2 * B + u(28), height: u(6), fill: '#4a4844' }, stone);

  const panels = [0, 1, 2, 3].map(i => { const [x, y] = panelXY(i); return makePanel(world, D, { W, H, lw, name: `Panel ${i + 1}`, x, y }); });

  // ---------- shared helpers ----------
  const BW = u(P ? 34 : 38), G = u(P ? 22 : 26);
  const FR = { x: BW, y: BW, w: W - 2 * BW, h: H - 2 * BW };
  const rectP = r => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
  const text = (layer, str, x, y, o = {}) => {
    const t = svg('text', {
      x, y, 'text-anchor': o.anchor ?? 'middle', 'font-family': o.family ?? FONT.serif, 'font-size': o.size, 'font-weight': o.weight ?? 400,
      'font-style': o.italic ? 'italic' : 'normal', 'letter-spacing': o.track ?? '0', fill: o.color ?? PAL.paint, 'fill-opacity': o.alpha ?? 0.9,
      'font-kerning': 'normal', style: 'font-variant-numeric: lining-nums tabular-nums', 'data-name': o.name ?? `Painted "${str}"`,
    }, layer.paint);
    t.textContent = str;
    if (o.maxW) { let s = o.size; for (let k = 0; k < 30 && t.getComputedTextLength() > o.maxW; k++) { s *= 0.95; t.setAttribute('font-size', s); } }
    return t;
  };
  const ground = (pn, ta, band, seed) => {
    const l0 = pn.layer('ground');
    l0.region(rectP({ x: 0, y: 0, w: W, h: H }), borderBand({ x: 0, y: 0, w: W, h: H }, BW, u(P ? 70 : 78)), (i) => pick(band[i % band.length], seed + i), { at: ta, dur: 0.3, sweep: 0.7, max: 0.75, outline: true, name: 'Border band' });
    l0.region(rectP(FR), quarries(FR, u(P ? 60 : 66)), (i) => pick(PAL.white, seed * 3 + i), { at: ta + 0.08, dur: 0.35, sweep: 0.9, jitter: 0.12, max: (i, b) => 0.24 + 0.07 * rand(i + seed), name: 'Quarry field' });
    if (P) { // 9:16 only: a sea predella along the bottom (under the platform UI: glass only, never text)
      const lp = pn.layer('predella');
      const R = { x: BW + G, y: H * 0.815, w: W - 2 * (BW + G), h: H - BW - G - H * 0.815 };
      lp.region(rectP(R), waterCut(R, u(76), u(200), seed, 0.3), (i, p) => (p.row > 1 ? pick(PAL.deep, i + seed) : pick(PAL.cobalt, i + seed)), { at: ta + 0.25, sweep: 0.8, jitter: 0.1, max: (i) => 0.5 + 0.2 * rand(i * 3 + seed), name: 'Sea predella' });
    }
    return l0;
  };
  // a plate = one pale pane carrying painted words
  const plate = (layer, r, color, o = {}) => layer.piece(rectP(r), color, { name: o.name ?? 'Plate', at: o.at, dur: o.dur ?? 0.3, max: o.max ?? 1, keys: o.keys, sun: 0.4 });

  // ---------- figures (no faces, no likeness: glass shapes with grisaille detail) ----------
  function figure(lMid, lTop, cx, base, h, pose, at, name, coat = PAL.coat) {
    const rot = (p, o, deg) => { const a = (deg * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a); const x = p[0] - o[0], y = p[1] - o[1]; return [o[0] + x * c - y * s, o[1] + x * s + y * c]; };
    const hip = [0, -0.3];
    const U = pts => pts.map(p => rot(p, hip, pose.lean ?? 0));
    const Hd = pts => U(pts.map(p => rot(p, [0, -0.8], pose.head ?? 0)));
    const X = pts => pts.map(([x, y]) => [cx + x * h, base + y * h]);
    const sp = pose.spread ?? 0.02;
    const legs = [
      [[-0.135, -0.31], [-0.005, -0.31], [-0.03 - sp, -0.035], [-0.115 - sp, -0.035]],
      [[0.005, -0.31], [0.135, -0.31], [0.115 + sp, -0.035], [0.03 + sp, -0.035]],
    ];
    const pcs = [];
    legs.forEach((p, i) => pcs.push(lMid.piece(X(p), pick(PAL.deep, i + at), { name: `${name} leg`, at: at + 0.06, dur: 0.3, max: 0.8 })));
    pcs.push(lMid.piece(X([[-0.125 - sp, -0.035], [-0.02 - sp, -0.035], [-0.01 - sp, 0], [-0.14 - sp, 0]]), PAL.grey[2], { name: `${name} shoe`, at: at + 0.06, max: 0.5 }));
    pcs.push(lMid.piece(X([[0.02 + sp, -0.035], [0.125 + sp, -0.035], [0.14 + sp, 0], [0.01 + sp, 0]]), PAL.grey[2], { name: `${name} shoe`, at: at + 0.06, max: 0.5 }));
    const coatL = U([[-0.13, -0.795], [0.0, -0.8], [0.0, -0.29], [-0.17, -0.29], [-0.155, -0.42]]);
    const coatR = U([[0.0, -0.8], [0.13, -0.795], [0.155, -0.42], [0.17, -0.29], [0.0, -0.29]]);
    pcs.push(lMid.piece(X(coatL), coat[0], { name: `${name} coat`, at, dur: 0.3 }));
    pcs.push(lMid.piece(X(coatR), coat[1], { name: `${name} coat`, at: at + 0.04, dur: 0.3 }));
    // grisaille: buttons + belt line, painted on the coat
    const pd = X(U([[-0.045, -0.7], [0.045, -0.7], [-0.045, -0.6], [0.045, -0.6], [-0.045, -0.5], [0.045, -0.5]]));
    pd.forEach(([x, y]) => svg('circle', { cx: f1(x), cy: f1(y), r: f1(h * 0.011), fill: PAL.paint, 'fill-opacity': 0.75 }, lMid.paint));
    const belt = X(U([[-0.16, -0.43], [0.16, -0.43]]));
    svg('line', { x1: belt[0][0], y1: belt[0][1], x2: belt[1][0], y2: belt[1][1], stroke: PAL.paint, 'stroke-opacity': 0.55, 'stroke-width': h * 0.012 }, lMid.paint);
    // shoulder boards (painted)
    [[-0.12, -0.79, -0.05], [0.05, -0.79, 0.12]].forEach(([a, y, b]) => { const q = X(U([[a, y + 0.012], [b, y + 0.012]])); svg('line', { x1: q[0][0], y1: q[0][1], x2: q[1][0], y2: q[1][1], stroke: PAL.paint, 'stroke-opacity': 0.6, 'stroke-width': h * 0.016, 'stroke-linecap': 'round' }, lMid.paint); });
    // head (pale glass, no features) + officer's cap
    pcs.push(lTop.piece(X(Hd(ellipse(0, -0.885, 0.066, 0.08, 12))), PAL.skin[0], { name: `${name} head`, at: at + 0.1, dur: 0.3, max: 0.95 }));
    pcs.push(lTop.piece(X(Hd([[-0.092, -0.985], [0.096, -0.99], [0.078, -0.938], [-0.074, -0.934]])), coat[2], { name: `${name} cap`, at: at + 0.12, max: 0.85 }));
    pcs.push(lTop.piece(X(Hd([[-0.074, -0.934], [0.078, -0.938], [0.092, -0.915], [-0.084, -0.912]])), PAL.grey[1], { name: `${name} cap band`, at: at + 0.12, max: 0.7 }));
    // arms: upper + fore + hand
    for (const side of ['l', 'r']) {
      const sg = side === 'r' ? 1 : -1;
      const [a, e] = pose[side] ?? [6, -4];
      const dir = deg => [sg * Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)];
      const sh = [sg * 0.118, -0.765], d1 = dir(a), el = [sh[0] + d1[0] * 0.215, sh[1] + d1[1] * 0.215];
      const d2 = dir(a + e), wr = [el[0] + d2[0] * 0.19, el[1] + d2[1] * 0.19];
      const seg = (p, q, w0, w1) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; return [[p[0] + nx * w0, p[1] + ny * w0], [q[0] + nx * w1, q[1] + ny * w1], [q[0] - nx * w1, q[1] - ny * w1], [p[0] - nx * w0, p[1] - ny * w0]]; };
      pcs.push(lTop.piece(X(U(seg(sh, el, 0.042, 0.034))), coat[side === 'r' ? 1 : 0], { name: `${name} arm`, at: at + 0.08, max: 0.95 }));
      pcs.push(lTop.piece(X(U(seg(el, wr, 0.034, 0.028))), coat[side === 'r' ? 0 : 1], { name: `${name} forearm`, at: at + 0.1, max: 0.95 }));
      const hc = [wr[0] + d2[0] * 0.03, wr[1] + d2[1] * 0.03];
      const big = pose.palm === side;
      pcs.push(lTop.piece(X(U(ellipse(hc[0], hc[1], big ? 0.042 : 0.03, big ? 0.05 : 0.034, 9, Math.atan2(d2[1], d2[0])))), PAL.skin[1], { name: `${name} hand`, at: at + 0.14, max: 0.95 }));
      if (pose.prop === side) pcs.push(lTop.piece(X(U([[hc[0] - 0.06, hc[1] - 0.06], [hc[0] + 0.07, hc[1] - 0.07], [hc[0] + 0.075, hc[1] + 0.09], [hc[0] - 0.055, hc[1] + 0.1]])), PAL.pale[1], { name: `${name} folder`, at: at + 0.16, max: 0.9 }));
    }
    return pcs;
  }

  // ---------- projection for the map ----------
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const photo = ctx.asset('assets/b59-surfaced-1962.jpg');

  /* =========================== PANEL 1 · the date + the map =========================== */
  {
    const pn = panels[0], ta = 0.1;
    ground(pn, ta, [PAL.cobalt, PAL.sea], 11);
    const l1 = pn.layer('content'), l2 = pn.layer('land'), l3 = pn.layer('marks');
    // date panes
    let DC, MR, LP = null;
    if (!P) {
      DC = { x: BW + G, y: BW + G, w: u(560), h: H - 2 * (BW + G) };
      MR = { x: DC.x + DC.w + G, y: BW + G, w: W - BW - G - (DC.x + DC.w + G), h: H - 2 * (BW + G) };
    } else {
      DC = { x: BW + G, y: H * 0.092, w: W - 2 * (BW + G), h: H * 0.215 };
      MR = { x: BW + G, y: DC.y + DC.h + G, w: W - 2 * (BW + G), h: H * 0.4 };
      LP = { x: BW + G, y: MR.y + MR.h + G, w: W * 0.86 - BW - G, h: H * 0.775 - (MR.y + MR.h + G) };
    }
    // three hand-cut panes, each lit on its spoken word; cut lines are slightly off-square (seeded, fixed)
    const panes = [];
    if (!P) {
      const cuts = [0, 0.25, 0.56, 1].map((f, i) => ({ y: DC.y + DC.h * f, tilt: i === 0 || i === 3 ? 0 : (i === 1 ? -0.035 : 0.03) }));
      const yAt = (c, x) => c.y + c.tilt * (x - (DC.x + DC.w / 2));
      for (let i = 0; i < 3; i++) panes.push([[DC.x, yAt(cuts[i], DC.x)], [DC.x + DC.w, yAt(cuts[i], DC.x + DC.w)], [DC.x + DC.w, yAt(cuts[i + 1], DC.x + DC.w)], [DC.x, yAt(cuts[i + 1], DC.x)]]);
    } else {
      const ym = DC.y + DC.h * 0.42, xm = DC.x + DC.w * 0.66;
      panes.push([[DC.x, DC.y], [xm + u(14), DC.y], [xm - u(8), ym], [DC.x, ym]]);
      panes.push([[xm + u(14), DC.y], [DC.x + DC.w, DC.y], [DC.x + DC.w, ym], [xm - u(8), ym]]);
      panes.push([[DC.x, ym], [DC.x + DC.w, ym], [DC.x + DC.w, DC.y + DC.h], [DC.x, DC.y + DC.h]]);
    }
    const dateCol = [PAL.pale[0], PAL.pale[1], PAL.amber[3]];
    [T.oct, T.d27, T.y62].forEach((at, i) => l1.piece(panes[i], dateCol[i], { name: ['Date pane October', 'Date pane 27', 'Date pane 1962'][i], at, dur: 0.3, sun: 0.4 }));
    const pb = panes.map(bbox);
    if (!P) {
      text(l1, 'October', pb[0].cx, pb[0].cy + u(40), { size: u(124), maxW: DC.w * 0.84, name: 'Date October' });
      text(l1, '27', pb[1].cx, pb[1].cy + u(92), { size: u(270), name: 'Date 27' });
      text(l1, '1962', pb[2].cx, pb[2].cy + u(88), { size: u(250), maxW: DC.w * 0.86, name: 'Date 1962' });
    } else {
      text(l1, 'October', pb[0].cx, pb[0].cy + u(38), { size: u(120), maxW: pb[0].w * 0.86, name: 'Date October' });
      text(l1, '27', pb[1].cx - u(40), pb[1].cy + u(44), { size: u(132), maxW: W * 0.86 - pb[1].x - u(60), name: 'Date 27' });
      text(l1, '1962', W / 2 - u(30), pb[2].cy + u(86), { size: u(250), maxW: u(700), name: 'Date 1962' });
    }
    // the sea (wavy brick cut), lit in a sweep on "A Soviet …"
    const seaPolys = waterCut(MR, u(P ? 92 : 104), u(P ? 210 : 250), 3, 0.3);
    l1.region(rectP(MR), seaPolys, (i, p, b) => (rand(i * 2.3) < 0.06 ? PAL.sea[2] : pick(PAL.cobalt, i * 1.7 + 5)), { at: T.y62 + 0.45, dur: 0.35, sweep: 1.0, jitter: 0.15, max: (i, b) => 0.82 + 0.18 * rand(i), name: 'Sea' });
    // land: Natural Earth rings → projected → simplified to glass-cuttable shapes
    const lonR = P ? [-85.2, -68.2] : [-87.0, -66.6];
    const kc = Math.cos((23.5 * Math.PI) / 180), k = MR.w / ((lonR[1] - lonR[0]) * kc);
    const lat0 = 23.4 + (P ? 0.2 : 0);
    const proj = ([lo, la]) => [MR.x + (lo - lonR[0]) * k * kc, MR.y + MR.h / 2 - (la - lat0) * k];
    l2.g.setAttribute('clip-path', (() => { const id = D.uid(); const c = svg('clipPath', { id }, D.defs); svg('path', { d: dPoly(rectP(MR)) }, c); return `url(#${id})`; })());
    const keep = ['Cuba', 'United States of America', 'Bahamas', 'Haiti', 'Dominican Rep.', 'Jamaica', 'Mexico'];
    for (const f of geo.features) {
      if (!keep.includes(f.name)) continue;
      for (const ring of f.rings) {
        const pts = simplify(ring.map(proj), u(4.5));
        const bb = bbox(pts);
        if (pts.length < 3 || area(pts) < u(30) * u(30) || bb.x > MR.x + MR.w || bb.x + bb.w < MR.x || bb.y > MR.y + MR.h || bb.y + bb.h < MR.y) continue;
        const isCuba = f.name === 'Cuba';
        const n = Math.max(1, Math.min(5, Math.round(bb.w / u(isCuba ? 150 : 220))));
        l2.region(pts, strips(pts, n, -0.32 + rand(bb.x) * 0.2, bb.x), (i) => pick(PAL.sea, i + bb.x), {
          name: `Land ${f.name}`, at: isCuba ? T.cuba : T.y62 + 0.8, dur: isCuba ? 0.3 : 0.4, sweep: isCuba ? 0.3 : 0.6, max: isCuba ? 1 : 0.5,
        });
      }
    }
    l2.lead ? rectP(MR).forEach((p, i, a) => l2.lead(p, a[(i + 1) % 4])) : 0;
    text(l2, 'CUBA', ...proj([-78.3, 21.7]), { size: u(P ? 40 : 44), family: FONT.grot, weight: 600, track: '0.22em', name: 'Label Cuba' }).setAttribute('dy', u(14));
    // the sub — an amber pane (the motif) — and its painted uncertainty ring
    const [sx, sy] = proj([-71.4, 25.3]);
    const hl = u(P ? 150 : 176), hh = u(P ? 28 : 32);
    const hull = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 10; hull.push([sx + hl / 2 - hh / 2 + Math.cos(a) * hh * 0.9, sy + Math.sin(a) * hh / 2]); }
    hull.push([sx - hl / 2 + hh * 0.2, sy + hh / 2], [sx - hl / 2, sy + hh * 0.12], [sx - hl / 2, sy - hh * 0.12], [sx - hl / 2 + hh * 0.2, sy - hh / 2]);
    l3.piece(hull, PAL.amber[1], { name: 'B-59 hull (amber pane)', at: T.sub, dur: 0.3, joints: false });
    l3.piece([[sx - hl * 0.08, sy - hh / 2], [sx + hl * 0.14, sy - hh / 2], [sx + hl * 0.1, sy - hh * 1.35], [sx - hl * 0.04, sy - hh * 1.35]], PAL.amber[0], { name: 'B-59 tower', at: T.sub + 0.06, dur: 0.3 });
    const ring = svg('circle', { 'data-name': 'Uncertainty ring (painted)', cx: sx, cy: sy, r: u(P ? 76 : 88), fill: 'none', stroke: '#e9dfc4', 'stroke-width': u(4), 'stroke-dasharray': `${u(12)} ${u(10)}`, opacity: 0 }, l1.paint);
    // label plate
    let LBL;
    if (!P) {
      LBL = { x: sx - u(150), y: sy + u(108), w: u(300), h: u(118) };
      if (LBL.x + LBL.w > MR.x + MR.w - u(20)) LBL.x = MR.x + MR.w - u(20) - LBL.w;
    } else LBL = LP;
    plate(l3, LBL, PAL.pale[2], { name: 'Sub label plate', at: T.sub + 0.25 });
    if (!P) {
      text(l3, 'B-59', LBL.x + LBL.w / 2, LBL.y + u(54), { size: u(48), family: FONT.grot, weight: 800, track: '0.06em', name: 'Label B-59' });
      text(l3, 'position approx.', LBL.x + LBL.w / 2, LBL.y + u(96), { size: u(36), italic: true, name: 'Label approx' });
    } else {
      text(l3, 'B-59 · Soviet submarine', LBL.x + LBL.w / 2, LBL.y + LBL.h * 0.46, { size: u(52), family: FONT.grot, weight: 600, maxW: LBL.w * 0.9, name: 'Label B-59' });
      text(l3, 'position approx.', LBL.x + LBL.w / 2, LBL.y + LBL.h * 0.8, { size: u(42), italic: true, name: 'Label approx' });
      // a leaded "leader" from the plate up to the sub: two lead lines on top
    }
    pn.extra = T2 => ring.setAttribute('opacity', (clamp((T2 - T.deep) / 0.4) * 0.9).toFixed(3));
    pn.finish();
  }

  /* =========================== PANEL 2 · ships, charges, the photo, Moscow =========================== */
  {
    const pn = panels[1], ta = CAM[1].arrive - 0.45;
    ground(pn, ta, [PAL.amber, PAL.cobalt], 23);
    const l1 = pn.layer('content'), l2 = pn.layer('objects');
    let SR, RC, ROUND, CAP, MOS;
    if (!P) {
      SR = { x: BW + G, y: BW + G, w: W * 0.585, h: H - 2 * (BW + G) };
      RC = { x: SR.x + SR.w + G, y: BW + G, w: W - BW - G - (SR.x + SR.w + G), h: H - 2 * (BW + G) };
      const r = Math.min(RC.w * 0.44, H * 0.25);
      ROUND = { cx: RC.x + RC.w / 2, cy: RC.y + r + u(22), r };
      CAP = { x: RC.x, y: ROUND.cy + r + u(40), w: RC.w, h: u(122) };
      MOS = { x: RC.x, y: CAP.y + CAP.h + G, w: RC.w, h: RC.y + RC.h - (CAP.y + CAP.h + G) };
    } else {
      const r = W * 0.215;
      ROUND = { cx: BW + G + r + u(18), cy: H * 0.085 + r + u(10), r };
      CAP = { x: ROUND.cx + r + u(48), y: ROUND.cy - r * 0.78, w: W * 0.86 - (ROUND.cx + r + u(48)) - u(6), h: r * 1.56 };
      SR = { x: BW + G, y: ROUND.cy + r + u(46), w: W - 2 * (BW + G), h: H * 0.33 };
      MOS = { x: BW + G, y: SR.y + SR.h + G, w: W * 0.86 - BW - G, h: H * 0.78 - (SR.y + SR.h + G) };
    }
    // section: sky + sea with a wavy surface
    const surfY = SR.y + SR.h * (P ? 0.2 : 0.2);
    const wave = x => surfY + Math.sin((x - SR.x) / u(70)) * u(5);
    const top = [], N = 24; for (let i = 0; i <= N; i++) { const x = SR.x + (SR.w * i) / N; top.push([x, wave(x)]); }
    const skyPoly = [[SR.x, SR.y], [SR.x + SR.w, SR.y], ...top.slice().reverse()];
    const seaPoly = [...top, [SR.x + SR.w, SR.y + SR.h], [SR.x, SR.y + SR.h]];
    l1.region(skyPoly, strips(skyPoly, P ? 5 : 7, 0.05, 4), (i) => pick(PAL.sky, i + 2), { at: ta + 0.1, sweep: 0.6, max: 0.85, name: 'Sky' });
    const deepRows = waterCut({ x: SR.x, y: surfY, w: SR.w, h: SR.h - (surfY - SR.y) }, u(P ? 80 : 92), u(P ? 190 : 230), 9, 0.3);
    const nRows = Math.max(...deepRows.map(p => p.row)) + 1;
    l1.region(seaPoly, deepRows, (i, p) => { const k = p.row / nRows; return k < 0.3 ? pick(PAL.cobalt, i) : k < 0.65 ? pick([PAL.cobalt[2], PAL.cobalt[4], PAL.deep[2]], i) : pick(PAL.deep, i); }, { at: ta + 0.15, sweepY: 0.5, sweep: 0.3, jitter: 0.1, max: (i) => 0.75 + 0.2 * rand(i * 2), name: 'Sea section' });
    // ships on the surface (grey glass), three different hulls
    const shipX = P ? [0.2, 0.5, 0.8] : [0.17, 0.46, 0.76];
    const ships = shipX.map((fx, j) => {
      const cx = SR.x + SR.w * fx, len = u(P ? 150 : 180) * (1 - j * 0.08), hh = u(P ? 24 : 28);
      const y = wave(cx);
      const hullP = [[cx - len / 2, y - hh * 0.55], [cx + len / 2 + u(10), y - hh * 0.75], [cx + len / 2 - u(16), y + hh * 0.45], [cx - len / 2 + u(10), y + hh * 0.45]];
      l2.piece(hullP, PAL.grey[j % 3], { name: `US ship ${j + 1} hull`, at: T.amer + j * 0.14, dur: 0.3 });
      const sup = [[cx - len * 0.22, y - hh * 0.6], [cx + len * 0.14, y - hh * 0.65], [cx + len * 0.1, y - hh * 1.5], [cx - len * 0.16, y - hh * 1.45]];
      l2.piece(sup, PAL.grey[(j + 1) % 4], { name: `US ship ${j + 1} bridge`, at: T.amer + j * 0.14 + 0.06, dur: 0.3 });
      l2.lead([cx - len * 0.02, y - hh * 1.5], [cx - len * 0.02 + u(4), y - hh * 2.6]);
      return { cx, y: y + hh * 0.45 };
    });
    // the sub, deep (amber motif)
    const subC = [SR.x + SR.w * (P ? 0.5 : 0.48), SR.y + SR.h * 0.8];
    const hl = u(P ? 230 : 280), hh = u(P ? 38 : 44);
    const hull = []; for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 12; hull.push([subC[0] + hl / 2 - hh / 2 + Math.cos(a) * hh * 0.9, subC[1] + Math.sin(a) * hh / 2]); }
    hull.push([subC[0] - hl / 2 + hh * 0.3, subC[1] + hh / 2], [subC[0] - hl / 2, subC[1] + hh * 0.1], [subC[0] - hl / 2, subC[1] - hh * 0.1], [subC[0] - hl / 2 + hh * 0.3, subC[1] - hh / 2]);
    const hullCut = strips(hull, 3, 0, 7);
    l2.region(hull, hullCut, (i) => PAL.amber[[1, 0, 2][i % 3]], { name: 'B-59 (deep)', at: ta + 0.4, dur: 0.4, max: 0.9 });
    l2.piece([[subC[0] - hl * 0.08, subC[1] - hh / 2], [subC[0] + hl * 0.12, subC[1] - hh / 2], [subC[0] + hl * 0.09, subC[1] - hh * 1.3], [subC[0] - hl * 0.04, subC[1] - hh * 1.3]], PAL.amber[0], { name: 'B-59 tower', at: ta + 0.45, max: 0.9 });
    // depth charges: small barrel panes that ignite one under the other (the fall is told by light, glass never moves)
    const drops = [];
    ships.forEach((s, j) => {
      const n = 4;
      for (let kk = 0; kk < n; kk++) {
        const y = s.y + u(P ? 40 : 46) + kk * ((subC[1] - hh * 2.2 - s.y - u(46)) / (n - 0.4));
        const x = s.cx + (subC[0] - s.cx) * (kk / n) * 0.35;
        const w = u(P ? 18 : 20), h2 = u(P ? 26 : 30);
        const at = T.drop + j * 0.12 + kk * 0.2;
        drops.push(l2.piece([[x - w / 2, y - h2 / 2], [x + w / 2, y - h2 / 2], [x + w / 2, y + h2 / 2], [x - w / 2, y + h2 / 2]], PAL.amber[3], { name: `Depth charge ${j + 1}.${kk + 1}`, at, dur: 0.12, keys: [[at + 0.3, at + 0.8, 0.3]], sun: 0.2, unlit: 0, back: false, lead: false }));
      }
    });
    // bursts round the sub: pale shards that catch then cool (rise 5 f, fall 0.8 s — no strobe)
    const BP = [[subC[0] - hl * 0.55, subC[1] - hh * 2.1], [subC[0] + hl * 0.6, subC[1] - hh * 1.6], [subC[0] - hl * 0.05, subC[1] - hh * 3.2]];
    BP.forEach(([bx, by], j) => {
      const at = T.bursts[j], R1 = u(P ? 16 : 18), R2 = u(P ? 54 : 64), n = 7;
      for (let s = 0; s < n; s++) {
        const a0 = (s / n) * Math.PI * 2 + j, a1 = ((s + 1) / n) * Math.PI * 2 + j, r2 = R2 * (0.8 + rand(j * 9 + s) * 0.45);
        l2.piece([[bx + Math.cos(a0) * R1, by + Math.sin(a0) * R1], [bx + Math.cos((a0 + a1) / 2) * r2, by + Math.sin((a0 + a1) / 2) * r2], [bx + Math.cos(a1) * R1, by + Math.sin(a1) * R1]], s % 2 ? PAL.pale[0] : PAL.amber[3], { name: `Burst ${j + 1}`, at, dur: 0.16, keys: [[at + 0.25, at + 1.6, 0.5]], sun: 0, unlit: 0, back: false, lead: false });
      }
      l2.piece(ellipse(bx, by, R1, R1, 7), PAL.pale[2], { name: `Burst ${j + 1} core`, at, dur: 0.14, keys: [[at + 0.25, at + 1.6, 0.55]], sun: 0, unlit: 0, back: false, lead: false });
    });
    // practice-charge plate (bottom-left of the section)
    const PR = P ? { x: SR.x + u(20), y: SR.y + SR.h - u(116), w: u(430), h: u(96) } : { x: SR.x + u(26), y: SR.y + SR.h - u(122), w: u(520), h: u(100) };
    plate(l2, PR, PAL.pale[1], { name: 'Practice charges plate', at: T.prac });
    text(l2, 'PRACTICE DEPTH CHARGES', PR.x + PR.w / 2, PR.y + PR.h * 0.47, { size: u(P ? 30 : 34), family: FONT.grot, weight: 600, track: '0.08em', maxW: PR.w * 0.9, name: 'Practice label' });
    text(l2, 'signals to surface', PR.x + PR.w / 2, PR.y + PR.h * 0.82, { size: u(P ? 32 : 36), italic: true, name: 'Practice hedge' });
    // the real photo, fired into a roundel (EV: shown as itself, nothing added) + its border ring of small panes
    const circ = ellipse(ROUND.cx, ROUND.cy, ROUND.r, ROUND.r, 48);
    l1.image(photo, circ, { name: 'B-59 photo roundel (US Navy, 1962)', at: T.above - 0.1, dur: 0.5, max: 0.97, filter: 'grayscale(1) sepia(0.28) contrast(1.12) brightness(1.08)', x: ROUND.cx - ROUND.r * 1.32, y: ROUND.cy - ROUND.r, w: ROUND.r * 2.64, h: ROUND.r * 2 });
    const rr = ROUND.r + u(30), ringN = 12, ringPolys = [];
    for (let s = 0; s < ringN; s++) {
      const a0 = (s / ringN) * Math.PI * 2, a1 = ((s + 1) / ringN) * Math.PI * 2, p = [];
      for (let q = 0; q <= 4; q++) { const a = a0 + ((a1 - a0) * q) / 4; p.push([ROUND.cx + Math.cos(a) * rr, ROUND.cy + Math.sin(a) * rr]); }
      for (let q = 4; q >= 0; q--) { const a = a0 + ((a1 - a0) * q) / 4; p.push([ROUND.cx + Math.cos(a) * ROUND.r, ROUND.cy + Math.sin(a) * ROUND.r]); }
      p.corners = [p[0], p[4], p[5], p[9]]; ringPolys.push(p);
    }
    const ringOuter = ellipse(ROUND.cx, ROUND.cy, rr, rr, 48);
    l1.region(ringOuter, ringPolys, (i) => (i % 2 ? PAL.amber[1] : PAL.cobalt[1]), { name: 'Roundel border', at: T.above - 0.2, dur: 0.25, sweep: 0.3, max: 0.9 });
    plate(l1, CAP, PAL.pale[0], { name: 'Photo caption plate', at: T.above + 0.15 });
    if (!P) {
      text(l1, 'B-59 — forced to the surface', CAP.x + CAP.w / 2, CAP.y + CAP.h * 0.44, { size: u(40), family: FONT.grot, weight: 600, maxW: CAP.w * 0.82, name: 'Caption line 1' });
      text(l1, 'US Navy photo · 28–29 Oct 1962', CAP.x + CAP.w / 2, CAP.y + CAP.h * 0.8, { size: u(36), italic: true, maxW: CAP.w * 0.9, name: 'Caption source' });
    } else {
      const lines = [['B-59', 0.24, true], ['forced up', 0.44, true], ['US Navy photo', 0.68, false], ['28–29 Oct 1962', 0.86, false]];
      lines.forEach(([s, f, g]) => text(l1, s, CAP.x + CAP.w / 2, CAP.y + CAP.h * f, g ? { size: u(44), family: FONT.grot, weight: 600, maxW: CAP.w * 0.88 } : { size: u(38), italic: true, maxW: CAP.w * 0.88 }));
    }
    // Moscow: a plate + three signal panes that go dark one by one on "silent"
    const mosPlate = { x: MOS.x, y: MOS.y, w: MOS.w * 0.58, h: MOS.h };
    plate(l1, mosPlate, PAL.pale[2], { name: 'Moscow plate', at: T.moscow - 0.05 });
    text(l1, 'MOSCOW', mosPlate.x + mosPlate.w / 2, mosPlate.y + mosPlate.h * 0.5, { size: u(P ? 54 : 58), family: FONT.grot, weight: 800, track: '0.14em', maxW: mosPlate.w * 0.86, name: 'Moscow' });
    text(l1, 'silent for days', mosPlate.x + mosPlate.w / 2, mosPlate.y + mosPlate.h * 0.5 + u(P ? 48 : 52), { size: u(P ? 38 : 40), italic: true, maxW: mosPlate.w * 0.86, name: 'Moscow silent' });
    const sig = { x: mosPlate.x + mosPlate.w, y: MOS.y, w: MOS.w - mosPlate.w, h: MOS.h };
    const scx = sig.x + u(30), scy = sig.y + sig.h / 2, arcs = [];
    for (let a = 0; a < 3; a++) {
      const r0 = sig.h * (0.12 + a * 0.13), r1 = r0 + sig.h * 0.1, p = [];
      for (let q = -6; q <= 6; q++) { const t = (q / 6) * 0.75; p.push([scx + Math.cos(t) * r1, scy + Math.sin(t) * r1]); }
      for (let q = 6; q >= -6; q--) { const t = (q / 6) * 0.75; p.push([scx + Math.cos(t) * r0, scy + Math.sin(t) * r0]); }
      arcs.push(p);
    }
    const sigBg = rectP(sig);
    l1.region(sigBg, strips(sigBg, 2, 1.2, 3), (i) => PAL.deep[i % 3], { name: 'Signal ground', at: T.moscow, max: 0.45 });
    arcs.forEach((p, a) => l2.piece(p, PAL.sea[3], { name: `Signal arc ${a + 1}`, at: T.moscow + 0.12 + a * 0.12, dur: 0.2, keys: [[T.silent + (2 - a) * 0.22, T.silent + (2 - a) * 0.22 + 0.5, 0]], joints: false }));
    pn.finish();
  }

  /* =========================== PANEL 3 · the torpedo and the three officers =========================== */
  {
    const pn = panels[2], ta = CAM[2].arrive - 0.55;
    ground(pn, ta, [PAL.cobalt, PAL.grey], 37);
    const l1 = pn.layer('content'), l2 = pn.layer('objects'), l3 = pn.layer('figures-top');
    const TB = P ? { x: BW + G, y: H * 0.085, w: W - 2 * (BW + G), h: H * 0.13 } : { x: BW + G, y: BW + G, w: W - 2 * (BW + G), h: H * 0.25 };
    const TPL = P ? { x: BW + G, y: TB.y + TB.h + G * 0.6, w: W * 0.86 - BW - G, h: u(92) } : { x: TB.x + TB.w * 0.69, y: TB.y + u(22), w: TB.w * 0.31 - u(22), h: TB.h - u(44) };
    const tbPoly = rectP(TB);
    l1.region(tbPoly, waterCut(TB, TB.h / 3, u(170), 21, 0.12), (i) => pick(PAL.deep, i), { at: ta, sweep: 0.5, max: 0.55, name: 'Torpedo ground' });
    // torpedo: amber warhead + grey body cut in sections + tail fins
    const tx0 = TB.x + TB.w * (P ? 0.06 : 0.04), tx1 = TB.x + TB.w * (P ? 0.94 : 0.64), tcy = TB.y + TB.h / 2, tr = TB.h * (P ? 0.24 : 0.2);
    const noseL = (tx1 - tx0) * 0.16;
    const nose = []; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 8; nose.push([tx1 - noseL + Math.cos(a) * noseL, tcy + Math.sin(a) * tr]); }
    l2.piece(nose, PAL.amber[1], { name: 'Torpedo warhead', at: T.nuclear, dur: 0.3 });
    const bodyP = [[tx0 + (tx1 - tx0) * 0.12, tcy - tr], [tx1 - noseL, tcy - tr], [tx1 - noseL, tcy + tr], [tx0 + (tx1 - tx0) * 0.12, tcy + tr]];
    l2.region(bodyP, strips(bodyP, 4, 0, 13), (i) => PAL.grey[i % 4], { name: 'Torpedo body', at: T.torpedo - 0.1, sweep: -0.0, jitter: 0.15, dur: 0.3 });
    const tail = [[tx0 + (tx1 - tx0) * 0.12, tcy - tr], [tx0 + (tx1 - tx0) * 0.12, tcy + tr], [tx0 + (tx1 - tx0) * 0.03, tcy + tr * 0.45], [tx0 + (tx1 - tx0) * 0.03, tcy - tr * 0.45]];
    l2.piece(tail, PAL.grey[2], { name: 'Torpedo tail', at: T.torpedo, dur: 0.3 });
    l2.piece([[tx0 + (tx1 - tx0) * 0.03, tcy - tr * 0.45], [tx0 + (tx1 - tx0) * 0.09, tcy - tr * 0.75], [tx0, tcy - tr * 1.5], [tx0 - u(4), tcy - tr * 0.4]], PAL.grey[3], { name: 'Fin', at: T.torpedo + 0.05 });
    l2.piece([[tx0 + (tx1 - tx0) * 0.03, tcy + tr * 0.45], [tx0 + (tx1 - tx0) * 0.09, tcy + tr * 0.75], [tx0, tcy + tr * 1.5], [tx0 - u(4), tcy + tr * 0.4]], PAL.grey[3], { name: 'Fin', at: T.torpedo + 0.05 });
    plate(l2, TPL, PAL.pale[0], { name: 'Torpedo plate', at: T.torpedo + 0.1 });
    if (!P) {
      text(l2, 'NUCLEAR', TPL.x + TPL.w / 2, TPL.y + TPL.h * 0.36, { size: u(52), family: FONT.grot, weight: 800, track: '0.12em', maxW: TPL.w * 0.86 });
      text(l2, 'TORPEDO', TPL.x + TPL.w / 2, TPL.y + TPL.h * 0.62, { size: u(52), family: FONT.grot, weight: 800, track: '0.12em', maxW: TPL.w * 0.86 });
      text(l2, 'one on board', TPL.x + TPL.w / 2, TPL.y + TPL.h * 0.88, { size: u(38), italic: true, maxW: TPL.w * 0.86 });
    } else {
      text(l2, 'NUCLEAR TORPEDO', TPL.x + u(28), TPL.y + TPL.h * 0.64, { size: u(46), family: FONT.grot, weight: 800, track: '0.1em', anchor: 'start', maxW: TPL.w * 0.62 });
      text(l2, 'one on board', TPL.x + TPL.w - u(28), TPL.y + TPL.h * 0.64, { size: u(38), italic: true, anchor: 'end' });
    }
    // three lancets
    const LA = P ? { x: BW + G, y: TPL.y + TPL.h + G, w: W * 0.865 - BW - G, h: H * 0.785 - (TPL.y + TPL.h + G) } : { x: BW + G + u(20), y: TB.y + TB.h + G, w: W - 2 * (BW + G) - u(40), h: H - BW - G - (TB.y + TB.h + G) };
    const gap = u(P ? 26 : 56), lwid = (LA.w - 2 * gap) / 3;
    const roles = P ? [['COMMANDER'], ['POLITICAL', 'OFFICER'], ['CHIEF OF', 'STAFF']] : [['COMMANDER'], ['POLITICAL OFFICER'], ['CHIEF OF STAFF']];
    const poses = [
      { lean: -4, head: 5, r: [166, 8], l: [36, -112], spread: 0.03, palm: 'r' },
      { lean: 3, head: -6, l: [138, 28], r: [18, 62], prop: 'r', spread: 0.015, palm: 'l' },
      { lean: 0, head: 0, l: [7, -3], r: [7, -3], spread: 0.02 },
    ];
    const voteH = u(P ? 78 : 84), roleH = u(P ? 84 : 60);
    for (let i = 0; i < 3; i++) {
      const x = LA.x + i * (lwid + gap);
      const ap = arch(x, LA.y, lwid, LA.h, lwid * 0.95);
      l1.region(ap, quarries({ x, y: LA.y, w: lwid, h: LA.h }, u(P ? 56 : 76)), (q) => pick(i === 2 ? PAL.white : PAL.sky, q + i * 31), { name: `Lancet ${i + 1}`, at: ta + 0.15 + i * 0.12, sweepY: 0.6, jitter: 0.1, max: (q) => (i === 2 ? 0.5 : 0.78) + 0.12 * rand(q + i) });
      const voteR = { x: x + lwid * 0.12, y: LA.y + LA.h - voteH - u(14), w: lwid * 0.76, h: voteH };
      const roleR = { x: x + lwid * 0.06, y: voteR.y - roleH - u(10), w: lwid * 0.88, h: roleH };
      plate(l2, roleR, PAL.pale[1], { name: `Role plate ${i + 1}`, at: T.three + i * 0.18 + 0.1 });
      roles[i].forEach((s, k) => text(l2, s, roleR.x + roleR.w / 2, roleR.y + roleR.h * (roles[i].length === 1 ? 0.64 : 0.43 + k * 0.36), { size: u(P ? 28 : 32), family: FONT.grot, weight: 600, track: '0.08em', maxW: roleR.w * 0.88 }));
      const yes = i < 2;
      plate(l2, voteR, yes ? PAL.amber[1] : PAL.grey[2], { name: yes ? `YES pane ${i + 1}` : 'Third vote pane (unlit)', at: yes ? [T.two, T.yes][i] : ta + 0.3, max: yes ? 1 : 0.22, dur: 0.3 });
      if (yes) text(l2, 'YES', voteR.x + voteR.w / 2, voteR.y + voteR.h * 0.72, { size: u(P ? 54 : 60), family: FONT.grot, weight: 800, track: '0.16em', name: `YES ${i + 1}` });
      const fh = (roleR.y - u(14) - (LA.y + ap.rise * 0.1)) / 1.12;
      const fhh = Math.min(fh, lwid * (P ? 1.65 : 1.35));
      figure(l2, l3, x + lwid / 2, roleR.y - u(12), fhh * (i === 0 ? 0.86 : 0.93), poses[i], T.three - 0.85 + i * 0.28, `Officer ${i + 1}`);
    }
    pn.finish();
  }

  /* =========================== PANEL 4 · NO, the name, forty years =========================== */
  {
    const pn = panels[3], ta = CAM[3].arrive - 0.5;
    ground(pn, ta, [PAL.amber, PAL.sea], 41);
    const l1 = pn.layer('content'), l2 = pn.layer('objects'), l3 = pn.layer('figure-top');
    let LN, NB, NP, YP;
    if (!P) {
      LN = { x: BW + G + u(10), y: BW + G, w: W * 0.29, h: H - 2 * (BW + G) };
      NB = { x: LN.x + LN.w + G * 2, y: BW + G, w: W - BW - G - (LN.x + LN.w + G * 2), h: H * 0.5 };
      NP = { x: NB.x, y: NB.y + NB.h + G, w: NB.w, h: H * 0.17 };
      YP = { x: NB.x, y: NP.y + NP.h + G, w: NB.w, h: H - BW - G - (NP.y + NP.h + G) };
    } else {
      NB = { x: BW + G, y: H * 0.085, w: W * 0.86 - BW - G, h: H * 0.2 };
      NP = { x: BW + G, y: NB.y + NB.h + G, w: NB.w, h: H * 0.07 };
      LN = { x: W * 0.15, y: NP.y + NP.h + G * 1.5, w: W * 0.56, h: H * 0.695 - (NP.y + NP.h + G * 1.5) };
      YP = { x: BW + G, y: LN.y + LN.h + G, w: NB.w, h: H * 0.785 - (LN.y + LN.h + G) };
    }
    const ap = arch(LN.x, LN.y, LN.w, LN.h, LN.w * 0.95);
    l1.region(ap, quarries(LN, u(P ? 60 : 76)), (q) => pick(PAL.white, q * 3 + 7), { name: 'Lancet (Arkhipov)', at: T.third - 0.2, sweepY: 0.5, jitter: 0.1, max: (q) => 0.7 + 0.12 * rand(q) });
    const fh = Math.min((LN.h - ap.rise * 0.32) / 1.06, LN.w * (P ? 1.5 : 1.05));
    figure(l2, l3, LN.x + LN.w / 2, LN.y + LN.h - u(18), fh, { lean: -3, head: -4, r: [32, 68], l: [8, -4], spread: 0.045, palm: 'r' }, T.vasili, 'Arkhipov');
    // NO: ruby letters cut in glass inside a pale light-field
    const nbPoly = rectP(NB);
    l1.region(nbPoly, strips(nbPoly, P ? 4 : 5, 0.15, 17), (i) => pick(PAL.pale, i + 3), { name: 'NO light field', at: T.no - 0.35, dur: 0.4, sweep: 0.3, max: 0.92 });
    const lh = NB.h * 0.74, s = lh * 0.2, nw = lh * 0.96, ow = lh * 0.9, gapL = lh * 0.17;
    const x0 = NB.x + (NB.w - (nw + gapL + ow)) / 2, y0 = NB.y + (NB.h - lh) / 2;
    const N = [
      [[x0, y0], [x0 + s, y0], [x0 + s, y0 + lh], [x0, y0 + lh]],
      [[x0 + s, y0], [x0 + s * 2.15, y0], [x0 + nw - s, y0 + lh * 0.78], [x0 + nw - s, y0 + lh], [x0 + nw - s * 2.15, y0 + lh], [x0 + s, y0 + lh * 0.22]],
      [[x0 + nw - s, y0], [x0 + nw, y0], [x0 + nw, y0 + lh], [x0 + nw - s, y0 + lh]],
    ];
    const at = T.no;
    N.forEach((p, i) => l2.piece(p, PAL.ruby[[0, 1, 2][i]], { name: `NO letter N piece ${i + 1}`, at: at - 0.16 + i * 0.03, dur: 0.18, sun: 0.15, unlit: 0.12 }));
    const ocx = x0 + nw + gapL + ow / 2, ocy = y0 + lh / 2, orx = ow / 2, ory = lh / 2, irx = orx - s, iry = ory - s * 0.92;
    // the O: two ruby pieces split by one slanted cut (a glazier never cuts a full ring)
    [[-1.05, 1.95], [1.95, 5.23]].forEach(([a0, a1], q) => {
      const p = [], n = 14;
      for (let m = 0; m <= n; m++) { const a = a0 + ((a1 - a0) * m) / n; p.push([ocx + Math.cos(a) * orx, ocy + Math.sin(a) * ory]); }
      for (let m = n; m >= 0; m--) { const a = a0 + ((a1 - a0) * m) / n; p.push([ocx + Math.cos(a) * irx, ocy + Math.sin(a) * iry]); }
      l2.piece(p, PAL.ruby[q ? 0 : 1], { name: `NO letter O piece ${q + 1}`, at: at - 0.1 + q * 0.04, dur: 0.18, sun: 0.15, unlit: 0.12, corners: [p[0], p[n], p[n + 1], p[2 * n + 1]] });
    });
    // the O's counter is its own pale pane (so no lead line runs through the letter)
    l2.piece(ellipse(ocx, ocy, irx, iry, 24), PAL.pale[2], { name: 'NO counter pane', at: T.no - 0.35, dur: 0.4, max: 0.92, joints: false });
    // name plate
    plate(l1, NP, PAL.pale[0], { name: 'Name plate', at: T.vasili - 0.05, dur: 0.35 });
    text(l1, 'Vasili Arkhipov', NP.x + NP.w / 2, NP.y + NP.h * 0.68, { size: u(P ? 86 : 104), maxW: NP.w * 0.9, name: 'Name Vasili Arkhipov' });
    // forty years: 1962 (grey, cool) → 2002 (amber, warm), a small painted line between
    const third = YP.w / 3;
    const yA = { x: YP.x, y: YP.y, w: third, h: YP.h }, yM = { x: YP.x + third, y: YP.y, w: third, h: YP.h }, yB = { x: YP.x + 2 * third, y: YP.y, w: third, h: YP.h };
    plate(l1, yA, PAL.grey[3], { name: 'Year 1962 pane', at: T.world, max: 0.85 });
    plate(l1, yM, PAL.pale[1], { name: 'Forty years pane', at: T.forty, max: 0.95 });
    plate(l1, yB, PAL.amber[3], { name: 'Year 2002 pane', at: T.later - 0.1 });
    const ys = Math.min(YP.h * 0.62, u(P ? 70 : 96));
    text(l1, '1962', yA.x + yA.w / 2, yA.y + yA.h / 2 + ys * 0.36, { size: ys, maxW: yA.w * 0.84, name: 'Year 1962' });
    text(l1, 'forty years', yM.x + yM.w / 2, yM.y + yM.h / 2 + u(14), { size: Math.min(ys * 0.62, u(52)), italic: true, maxW: yM.w * 0.86, name: 'Forty years' });
    text(l1, '2002', yB.x + yB.w / 2, yB.y + yB.h / 2 + ys * 0.36, { size: ys, maxW: yB.w * 0.84, name: 'Year 2002' });
    pn.finish();
  }

  // ---------- camera ----------
  const fit = Math.min(W / (WW + u(120)), H / (WH + u(120)));
  const centerOf = i => { const [x, y] = panelXY(i); return [x + W / 2, y + H / 2]; };
  const camAt = t => {
    for (let i = 0; i < 4; i++) {
      const c = CAM[i];
      if (t <= c.leave || i === 3) {
        if (i > 0 && t < c.arrive) { // travel from panel i-1 to i: glide, stepping back a little mid-move (shows the leading)
          const a = CAM[i - 1].leave, p = clamp((t - a) / (c.arrive - a));
          const e = p * p * p * (p * (p * 6 - 15) + 10);
          const A = centerOf(i - 1), Bc = centerOf(i);
          const dip = i === 2 ? 0.3 : 0.16;
          return { x: A[0] + (Bc[0] - A[0]) * e, y: A[1] + (Bc[1] - A[1]) * e, s: 1 - dip * Math.sin(Math.PI * p) };
        }
        const [x, y] = centerOf(i);
        const span = c.leave - c.arrive, q = clamp((t - c.arrive) / span);
        let s = 1.0 + (P ? 0.012 : 0.02) * q; // slow push-in while the panel tells its line
        if (i === 3 && t > END.from) {
          const p = clamp((t - END.from) / (END.to - END.from)), e = p * p * p * (p * (p * 6 - 15) + 10);
          const s0 = 1 + (P ? 0.012 : 0.02), wc = [WW / 2, WH / 2];
          return { x: x + (wc[0] - x) * e, y: y + (wc[1] - y) * e, s: Math.exp(Math.log(s0) + (Math.log(fit) - Math.log(s0)) * e) };
        }
        return { x, y, s };
      }
    }
  };
  // light: where the sun hits each panel (panel px) and its colour over the day
  const SUN = [
    { c0: '#dbe6ff', c1: '#eef2ff', x0: 0.15, x1: 0.7, y: 0.22 },
    { c0: '#f2f4ff', c1: '#fff8ea', x0: 0.2, x1: 0.75, y: 0.18 },
    { c0: '#fff6e3', c1: '#ffeccc', x0: 0.2, x1: 0.8, y: 0.2 },
    { c0: '#ffe2b0', c1: '#ffcfa6', x0: 0.25, x1: 0.85, y: 0.3 },
  ];
  const span = i => [i === 0 ? 0 : CAM[i - 1].leave, i === 3 ? END.to : CAM[i].leave + 0.6];

  function update(t) {
    const c = camAt(t);
    world.setAttribute('transform', `translate(${f1(W / 2)} ${f1(H / 2)}) scale(${c.s.toFixed(5)}) translate(${f1(-c.x)} ${f1(-c.y)})`);
    // view rect in world coords → skip panels that are off screen
    const vw = W / c.s / 2, vh = H / c.s / 2;
    panels.forEach((pn, i) => {
      const [px, py] = panelXY(i);
      const vis = px < c.x + vw && px + W > c.x - vw && py < c.y + vh && py + H > c.y - vh;
      pn.g.style.display = vis ? '' : 'none';
      if (!vis) return;
      const [a, b] = span(i), p = clamp((t - a) / (b - a)), S = SUN[i];
      const ruby = i === 3 ? clamp((t - T.no) / 0.6) : 0;
      pn.update(t, { x: W * (S.x0 + (S.x1 - S.x0) * p), y: H * S.y, color: mix(mix(S.c0, S.c1, p), '#ffb9a8', ruby * 0.5), k: 1 });
      pn.extra?.(t);
    });
  }
  return { node, update };
}
