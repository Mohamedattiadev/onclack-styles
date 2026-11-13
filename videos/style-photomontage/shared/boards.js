// The three montage boards. All times are GLOBAL seconds (taken from words.json), so scenes 3+4 can share one board
// and continue it across the cut. Pieces are placed by hand with slap(); the camera only glides between them.
import { el, svg, clamp, lerp, progress, rand, smootherstep } from '/onclack-styles/engine/lib/anim.js';
import { PAL, FONT, F, ez, stageBoard, piece, slap, loadImg, bakePrint, flat, strip, label, scissor, rectPts, shapePiece, thin } from './montage.js';

/* ---------- time helpers ---------- */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
export const G = (ctx, w, n = 0, fb = 0) => {
  const hits = ctx.words.filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start : fb;
};
const glide = (t, a, b) => smootherstep(progress(t, a, b));

/** Camera that puts board point p=[x,y] at screen point q with scale s. */
function camTo(L, p, q, s) {
  const cx = L.width / 2, cy = L.height / 2;
  return { s, x: q[0] - cx - (p[0] - cx) * s, y: q[1] - cy - (p[1] - cy) * s };
}
const mixCam = (a, b, k) => ({ s: lerp(a.s, b.s, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });

/** A photo print cut with scissors (white print margin, greyscale silver tone). */
async function print(ctx, parent, { src, crop, w, h, name, seed, m = 0, cut = 0 }) {
  const img = await loadImg(ctx, src);
  const node = bakePrint(img, crop, w, h, { m: ctx.layout.px(m), seed, contrast: 1.35 });
  // montage cut: no snapshot border; one corner sliced off on a hard diagonal (which corner = cut 1..4)
  const c = [[0, 0], [w, 0], [w, h], [0, h]];
  const pts0 = cut === 0 ? c : sliceCorner(c, cut - 1, w * 0.26, h * 0.42);
  const pts = scissor(pts0, seed * 7 + 3, { snip: 30, jit: 1.6, nick: 0.4 });
  return piece(parent, { name, w, h, pts, node, L: ctx.layout });
}

function sliceCorner(c, i, dx, dy) {
  const out = [];
  c.forEach((p, j) => {
    if (j !== i) return out.push(p);
    const sx = (j === 0 || j === 3) ? 1 : -1, sy = (j === 0 || j === 1) ? 1 : -1;
    const a = [p[0], p[1] + sy * dy], b = [p[0] + sx * dx, p[1]];
    if (j === 0 || j === 2) out.push(a, b); else out.push(b, a);
  });
  return out;
}

/** Big flat paper block (red / black) cut by scissors. */
function block(parent, L, { w, h, color, name, seed, pts = null }) {
  const p = pts ?? scissor(rectPts(w, h), seed, { snip: 40, jit: 1.8, nick: 0.25 });
  return piece(parent, { name, w, h, pts: p, node: flat(color, w, h), L });
}

/** Paper disc (cut freehand with many short snips — never a perfect circle). */
function disc(parent, L, { r, color, name, seed }) {
  const n = Math.round(r / 7) + 18, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = r * (1 + (rand(seed + i * 1.3) - 0.5) * 0.012);
    pts.push([r + Math.cos(a) * rr, r + Math.sin(a) * rr]);
  }
  return piece(parent, { name, w: 2 * r, h: 2 * r, pts, node: flat(color, 2 * r, 2 * r), L });
}

/** Run a list of [piece, slap-opts] and shake-free settle. */
const placeAll = (t, list) => list.forEach(([pc, o]) => pc.set(slap(t, o.t0, o)));

/** Cut-paper officer: black (or other) paper silhouette, no face. Varied pose per figure. */
let patN = 0;
function officer(parent, L, { name, hgt, pose, color = PAL.black, tex = null }) {
  const u = hgt / 100, w = 90 * u, h = 108 * u;
  const d = (s) => s;
  const sv = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: 'position:absolute;left:0;top:0;overflow:visible' });
  if (tex) {
    // the silhouette is cut out of a Navy sea photograph (photomontage: people made of printed matter)
    const id = `pm-tex-${++patN}`;
    const defs = svg('defs', {}, sv);
    const pat = svg('pattern', { id, patternUnits: 'userSpaceOnUse', x: -10 * u, y: -10 * u, width: w + 20 * u, height: h + 20 * u }, defs);
    svg('image', { href: tex, x: 0, y: 0, width: w + 20 * u, height: h + 20 * u, preserveAspectRatio: 'xMidYMid slice' }, pat);
    svg('rect', { x: 0, y: 0, width: w + 20 * u, height: h + 20 * u, fill: 'rgba(20,16,12,0.28)' }, pat);
    color = `url(#${id})`;
  }
  const g = svg('g', { transform: `rotate(${pose.lean} ${w / 2} ${100 * u})` }, sv);
  const cx = w / 2, tw = 34 * u * (1 - (pose.twist ?? 0)), wa = tw * 0.78;
  const P = (dd, par = g) => svg('path', { d: d(dd), fill: color }, par);
  const st = pose.stance * u, sh = (pose.shift ?? 0) * u;
  // legs: trousers as two tapering strips, weight shifted to one side; boots point outward
  P(`M${cx - wa / 2} ${58 * u} L${cx - 0.8 * u} ${58 * u} L${cx - st * 0.5 + 3.5 * u + sh} ${98 * u} L${cx - st * 0.5 - 6.5 * u + sh} ${98 * u} Z`);
  P(`M${cx + 0.8 * u} ${58 * u} L${cx + wa / 2} ${58 * u} L${cx + st * 0.5 + 6.5 * u + sh} ${98 * u} L${cx + st * 0.5 - 3.5 * u + sh} ${98 * u} Z`);
  P(`M${cx - st * 0.5 - 7 * u + sh} ${97 * u} L${cx - st * 0.5 + 4 * u + sh} ${97 * u} L${cx - st * 0.5 + 4 * u + sh} ${101 * u} L${cx - st * 0.5 - 11 * u + sh} ${101 * u} Z`);
  P(`M${cx + st * 0.5 - 4 * u + sh} ${97 * u} L${cx + st * 0.5 + 7 * u + sh} ${97 * u} L${cx + st * 0.5 + 11 * u + sh} ${101 * u} L${cx + st * 0.5 - 4 * u + sh} ${101 * u} Z`);
  // tunic: sloped shoulders, narrower waist, short flared skirt
  P(`M${cx - tw / 2} ${27 * u} Q${cx - tw / 2} ${22.5 * u} ${cx - tw / 2 + 5 * u} ${22 * u} L${cx + tw / 2 - 5 * u} ${22 * u} Q${cx + tw / 2} ${22.5 * u} ${cx + tw / 2} ${27 * u} L${cx + wa / 2} ${52 * u} L${cx + wa / 2 + 2 * u} ${61 * u} L${cx - wa / 2 - 2 * u} ${61 * u} L${cx - wa / 2} ${52 * u} Z`);
  // arms: upper arm + fore-arm bent at the elbow; hand = small mitten or an open palm
  const arm = (side, a1, a2, open) => {
    const sx = cx + side * (tw / 2 - 4 * u), sy = 25.5 * u;
    const g1 = svg('g', { transform: `rotate(${-side * a1} ${sx} ${sy})` }, g);
    svg('rect', { x: sx - 4.4 * u, y: sy - 3 * u, width: 8.8 * u, height: 21 * u, rx: 4 * u, fill: color }, g1);
    const g2 = svg('g', { transform: `rotate(${-side * a2} ${sx} ${sy + 16 * u})` }, g1);
    svg('rect', { x: sx - 3.8 * u, y: sy + 13 * u, width: 7.6 * u, height: 18 * u, rx: 2.5 * u, fill: color }, g2);
    if (open) {
      // open palm, fingers together pointing on along the fore-arm, thumb out: a calm "stop" (never a fist)
      const hy = sy + 30 * u;
      svg('path', { d: `M${sx - 4.2 * u} ${hy} L${sx + 4.2 * u} ${hy} L${sx + 5.6 * u} ${hy + 12 * u} Q${sx} ${hy + 15 * u} ${sx - 5.6 * u} ${hy + 12 * u} Z`, fill: color }, g2);
      svg('rect', { x: sx - side * 4 * u - 1.6 * u, y: hy, width: 3.2 * u, height: 8 * u, rx: 1.5 * u, fill: color, transform: `rotate(${side * 40} ${sx - side * 4 * u} ${hy + 1 * u})` }, g2);
    } else svg('rect', { x: sx - 4 * u, y: sy + 29 * u, width: 8 * u, height: 6.5 * u, rx: 3 * u, fill: color }, g2);
  };
  arm(-1, pose.armL[0], pose.armL[1], pose.openL);
  arm(1, pose.armR[0], pose.armR[1], pose.openR);
  // neck, head (plain disc, no face), peaked cap seen from the front: wide flat crown, band, visor shadow
  const hd = pose.head ?? 0;
  const hg = svg('g', { transform: `rotate(${hd} ${cx} ${21 * u})` }, g);
  P(`M${cx - 3.6 * u} ${17 * u} L${cx + 3.6 * u} ${17 * u} L${cx + 4.4 * u} ${23.5 * u} L${cx - 4.4 * u} ${23.5 * u} Z`, hg);
  svg('ellipse', { cx, cy: 13.6 * u, rx: 6.4 * u, ry: 7.2 * u, fill: color }, hg);
  const vs = pose.visor ?? 0;
  P(`M${cx - 13.5 * u + vs * u} ${5.6 * u} Q${cx + vs * u} ${-2.6 * u} ${cx + 13.5 * u + vs * u} ${5.6 * u} L${cx + 13 * u + vs * u} ${7 * u} L${cx - 13 * u + vs * u} ${7 * u} Z`, hg);
  P(`M${cx - 7.6 * u} ${6.5 * u} L${cx + 7.6 * u} ${6.5 * u} L${cx + 7.2 * u} ${10 * u} L${cx - 7.2 * u} ${10 * u} Z`, hg);
  P(`M${cx - 8.4 * u} ${9.6 * u} Q${cx} ${13.4 * u} ${cx + 8.4 * u} ${9.6 * u} Z`, hg);
  const node = el('div', { style: { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px' } });
  node.appendChild(sv);
  const pc = piece(parent, { name, w, h, pts: rectPts(w, h), node, L, raw: true, clip: 'none', origin: [w / 2, 102 * u] });
  pc.root.firstChild.style.display = 'none';
  // a hair of white paper left by the scissors around the cut photo, then the cast shadow
  const e = (1.6 * L.unit).toFixed(1);
  sv.style.filter = `drop-shadow(${e}px 0 0 ${PAL.paper}) drop-shadow(-${e}px 0 0 ${PAL.paper}) drop-shadow(0 ${e}px 0 ${PAL.paper}) drop-shadow(0 -${e}px 0 ${PAL.paper}) drop-shadow(${(3.5 * L.unit).toFixed(1)}px ${(3 * L.unit).toFixed(1)}px ${(2 * L.unit).toFixed(1)}px rgba(38,28,20,0.45))`;
  return { piece: pc, w, h, u };
}

/* ===================================================================================== */
/* BOARD 1 — the date, the chart, the boat                                              */
/* ===================================================================================== */
export async function boardOpen(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, por = L.portrait, px = L.px;
  const st = stageBoard(root, ctx, { seed: 11 });
  const C = st.content;
  const T = {
    band: 0.18, oct: G(ctx, 'October') - 2 * F, year: G(ctx, 'nineteen') - 2 * F, map: 1.55,
    photo: G(ctx, 'submarine') - 2 * F, deep: G(ctx, 'deep') - 2 * F, cuba: G(ctx, 'Cuba') - 2 * F,
  };
  const pk = (l, p) => (por ? p : l);

  // black diagonal band — the board's spine (it runs on, rotated, through every board)
  const bandW = pk(W * 1.7, 2700), bandH = px(pk(210, 190));
  const band = block(C, L, { w: bandW, h: bandH, color: PAL.black, name: '1 Black diagonal band', seed: 21 });
  const bandAt = pk([W * 0.5, H * 0.66], [W * 0.5, H * 0.415]), bandR = pk(-14, -24);

  // map: a sheet of print paper with land cut from black paper (Natural Earth coasts)
  const data = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const mw = px(pk(760, 880)), mh = px(pk(520, 480));
  const lon0 = -86, lon1 = -66, lat1 = pk(29.5, 28.2);
  const k = mw / (lon1 - lon0), kc = 1; // plain lon/lat box: honest "chart sketch" (labelled)
  const proj = (lon, lat) => [(lon - lon0) * k * kc, (lat1 - lat) * k * 1.08];
  const mnode = el('div', { style: { position: 'absolute', left: 0, top: 0, width: mw + 'px', height: mh + 'px', background: PAL.paper } });
  const ms = svg('svg', { width: mw, height: mh, viewBox: `0 0 ${mw} ${mh}`, style: 'position:absolute;left:0;top:0' }, mnode);
  for (const lat of [20, 25]) { const [, y] = proj(-80, lat); svg('line', { x1: 0, x2: mw, y1: y, y2: y, stroke: PAL.ink, 'stroke-opacity': 0.35, 'stroke-width': 2, 'stroke-dasharray': '3 9' }, ms); }
  for (const lon of [-80, -75, -70]) { const [x] = proj(lon, 20); svg('line', { x1: x, x2: x, y1: 0, y2: mh, stroke: PAL.ink, 'stroke-opacity': 0.35, 'stroke-width': 2, 'stroke-dasharray': '3 9' }, ms); }
  for (const f of data.features) for (const ring of f.rings) {
    const pts = thin(ring.map(([lo, la]) => proj(lo, la)), 5);
    if (pts.length < 3) continue;
    svg('path', { d: 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + ' Z', fill: PAL.black }, ms);
  }
  const lab = (txt, lon, lat, size = 26) => { const [x, y] = proj(lon, lat); const tx = svg('text', { x, y, fill: PAL.ink, 'font-family': FONT.mono, 'font-weight': 500, 'font-size': px(size), 'letter-spacing': '0.08em', stroke: PAL.paper, 'stroke-width': px(6), 'paint-order': 'stroke' }, ms); tx.textContent = txt; };
  lab('CUBA', -79.6, 20.6, 30);
  lab('FLORIDA', -84.6, 28.4, 24);
  const map = piece(C, { name: '1 Chart (Natural Earth)', w: mw, h: mh, pts: scissor(rectPts(mw, mh, 1), 77, { snip: 34, jit: 1.6 }), node: mnode, L });
  const mapAt = pk([W * 0.265, H * 0.37], [W * 0.49, H * 0.672]), mapR = pk(-3, 2.5);
  // red spot on the chart = approximate position (cut red paper dot)
  const SUB = [-71.2, 25.4];
  const spot = disc(C, L, { r: px(22), color: PAL.red, name: '1 Red dot: B-59 approx.', seed: 9 });
  const spotLocal = proj(...SUB);
  const rot = (p, c, deg) => { const a = deg * Math.PI / 180, dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
  const spotAt = rot([mapAt[0] - mw / 2 + spotLocal[0], mapAt[1] - mh / 2 + spotLocal[1]], mapAt, mapR);
  const approx = label(C, { text: 'B-59 · position approx.', size: px(26), name: '1 Label approx', seed: 31, L });

  // date
  const oct = strip(C, { text: 'October 27', size: px(pk(132, 118)), bg: PAL.red, color: PAL.paper, name: '1 Date strip', seed: 5, L, track: 0.02 });
  const year = strip(C, { text: '1962', size: px(pk(290, 250)), name: '1 Year strip', seed: 8, L, track: 0.0, padX: 0.1 });
  const octAt = pk([W * 0.665, H * 0.215], [W * 0.47, H * 0.162]), yearAt = pk([W * 0.765, H * 0.4], [W * 0.56, H * 0.265]);

  // the boat: red disc behind a scissor-cut Navy print
  const discR = px(pk(250, 225));
  const rdisc = disc(C, L, { r: discR, color: PAL.red, name: '1 Red disc', seed: 4 });
  const pw = px(pk(660, 760)), ph = px(pk(410, 470));
  const photo = await print(ctx, C, { src: 'assets/b59-surfaced-1962.jpg', crop: { x: 0, y: 165, w: 800, h: 497 }, w: pw, h: ph, name: '1 Photo B-59 (US Navy)', seed: 13, cut: 2 });
  const photoAt = pk([W * 0.585, H * 0.715], [W * 0.47, H * 0.445]);
  const discAt = pk([W * 0.72, H * 0.64], [W * 0.66, H * 0.40]);
  const src = label(C, { text: 'U.S. Navy photo · B-59, Oct. 1962', size: px(26), name: '1 Photo source', seed: 41, L });
  const srcAt = pk([W * 0.585, H * 0.918], [W * 0.5, H * 0.552]);
  // "deep": a black paper wedge, point down, pushed under the print
  const dw = px(pk(120, 110)), dh = px(pk(300, 220));
  const wedge = shapePiece(C, { name: '1 Wedge DEEP', w: dw, h: dh, d: `M2 0 L${dw - 1} 3 L${dw * 0.53} ${dh} Z`, color: PAL.black, L });
  const wedgeAt = pk([W * 0.87, H * 0.79], [W * 0.84, H * 0.565]);

  // z-order: band < map < disc < wedge < photo < labels < date
  [band, map, spot, rdisc, wedge, photo, src, approx, oct, year].forEach((o, i) => ((o.piece ?? o).root.style.zIndex = i + 1));

  ctx.sfx('pm-paper-slide', T.band - 0.25, { lu: -16 });
  ctx.sfx('pm-paper-lay', T.oct, { lu: -15 });
  ctx.sfx('pm-paper-lay', T.year, { lu: -13 });
  ctx.sfx('pm-fold', T.map - 0.1, { lu: -17 });
  ctx.sfx('pm-paper-lay', T.photo, { lu: -13 });
  ctx.sfx('pm-snip', T.cuba, { lu: -17 });
  ctx.ambience('sea-water-close-01', { from: T.photo - 0.6, to: ctx.duration, lu: -20, fade: 1.2 });

  const cam0 = camTo(L, [W / 2, H / 2], [W / 2, H / 2], 1.0);
  const cam1 = camTo(L, [W * 0.5, H * 0.5], [W / 2, H / 2], 1.035);
  return {
    update(tl) {
      const t = tl + ctx.start;
      st.update(tl, mixCam(cam0, cam1, glide(t, 0, ctx.duration)));
      band.set(slap(t, T.band, { at: bandAt, r1: bandR, from: [px(320), px(-120)], r0: bandR + 2, dur: 0.4 }));
      map.set(slap(t, T.map, { at: mapAt, r1: mapR, from: [px(-160), px(-70)], r0: mapR - 7 }));
      oct.piece.set(slap(t, T.oct, { at: octAt, r1: pk(-14, -12), from: [px(180), px(-90)], r0: -4 }));
      year.piece.set(slap(t, T.year, { at: yearAt, r1: pk(-14, -12), from: [px(220), px(60)], r0: -22 }));
      rdisc.set(slap(t, T.year + 0.55, { at: discAt, from: [px(140), px(-40)] }));
      photo.set(slap(t, T.photo, { at: photoAt, r1: pk(4, -3.5), from: [px(-120), px(160)], r0: 12 }));
      src.piece.set(slap(t, T.photo + 0.55, { at: srcAt, r1: pk(4, -3.5), from: [0, px(40)], dur: 0.25 }));
      wedge.piece.set(slap(t, T.deep, { at: wedgeAt, r1: pk(-8, -10), from: [px(30), px(-120)], dur: 0.3 }));
      spot.set(slap(t, T.cuba, { at: spotAt, from: [px(-30), px(-40)], dur: 0.26 }));
      approx.piece.set(slap(t, T.cuba + 0.35, { at: [spotAt[0] + px(pk(-30, -60)), spotAt[1] + px(56)], r1: mapR, from: [0, px(30)], dur: 0.25 }));
    },
  };
}

/* ===================================================================================== */
/* BOARD 2 — ships above, charges falling, Moscow taped shut                            */
/* ===================================================================================== */
export async function boardAbove(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, por = L.portrait, px = L.px;
  const st = stageBoard(root, ctx, { seed: 23, sheetIn: true });
  const C = st.content;
  const pk = (l, p) => (por ? p : l);
  const T = {
    sub: ctx.start + 0.25, surf: G(ctx, 'Above') - 2 * F, s1: G(ctx, 'American') - 2 * F, s2: G(ctx, 'ships') - 2 * F, s3: G(ctx, 'drop') - 2 * F,
    dc: G(ctx, 'depth') - 2 * F, moscow: G(ctx, 'Moscow') - 2 * F, silent: G(ctx, 'silent') - 2 * F, days: G(ctx, 'days') - 2 * F,
  };
  // the sea surface: the black band again, now thin and nearly flat (we are under it)
  const sw = pk(W * 1.5, 2200), sh = px(pk(34, 30));
  const surf = block(C, L, { w: sw, h: sh, color: PAL.black, name: '2 Sea surface line', seed: 51 });
  const surfAt = pk([W * 0.5, H * 0.47], [W * 0.5, H * 0.445]), surfR = pk(-5, -7);
  const surfY = x => surfAt[1] + (x - surfAt[0]) * Math.tan(surfR * Math.PI / 180);

  const ships = [
    { src: 'assets/uss-beale-1964.jpg', crop: { x: 40, y: 110, w: 700, h: 400 }, w: pk(640, 560), h: pk(366, 320), at: pk([W * 0.215, H * 0.285], [W * 0.36, H * 0.165]), r: pk(-5, -6), t: T.s1, cut: 4, cap: 'USS Beale · photo 1964' },
    { src: 'assets/b36-cecil-1962.jpg', crop: { x: 0, y: 40, w: 690, h: 480 }, w: pk(430, 400), h: pk(300, 278), at: pk([W * 0.555, H * 0.225], [W * 0.65, H * 0.27]), r: pk(4, 5), t: T.s2, cut: 2, cap: 'U.S. Navy · Oct. 1962' },
    { src: 'assets/randolph-1962.jpg', crop: { x: 60, y: 40, w: 719, h: 560 }, w: pk(300, 250), h: pk(234, 196), at: pk([W * 0.83, H * 0.30], [W * 0.27, H * 0.335]), r: pk(-9, -7), t: T.s3, cut: 1, cap: 'USS Randolph · 1962' },
  ];
  // the hunters' beam: a long red wedge from the ships down onto the boat
  const bx0 = pk(W * 0.34, W * 0.18), bx1 = pk(W * 0.70, W * 0.86), btop = pk(-H * 0.08, H * 0.06);
  const boatAt0 = pk([W * 0.42, H * 0.775], [W * 0.46, H * 0.64]);
  const bw_ = bx1 - bx0, bh_ = boatAt0[1] - btop;
  const beam = shapePiece(C, { name: '2 Red wedge (pressure from above)', w: bw_, h: bh_, L, color: PAL.red,
    d: `M0 0 L${bw_} 0 L${boatAt0[0] - bx0 + px(40)} ${bh_ - px(30)} L${boatAt0[0] - bx0 - px(26)} ${bh_ - px(30)} Z` });
  const beamAt = [bx0 + bw_ / 2, btop + bh_ / 2];
  const shipP = [], capP = [];
  for (const [i, s] of ships.entries()) {
    shipP.push(await print(ctx, C, { src: s.src, crop: s.crop, w: px(s.w), h: px(s.h), name: `2 Ship photo ${i + 1}`, seed: 60 + i, cut: s.cut }));
    capP.push(label(C, { text: s.cap, size: px(22), name: `2 Ship source ${i + 1}`, seed: 70 + i, L }));
  }
  // the boat below: cut black paper (reconstruction, labelled)
  const bw = px(pk(560, 520)), bh = px(pk(92, 86));
  const boat = shapePiece(C, { name: '2 Submarine (cut paper)', w: bw, h: bh, L, color: PAL.black,
    d: `M0 ${bh * 0.62} Q${bw * 0.03} ${bh * 0.38} ${bw * 0.12} ${bh * 0.36} L${bw * 0.38} ${bh * 0.34} L${bw * 0.42} ${bh * 0.02} L${bw * 0.58} ${bh * 0.02} L${bw * 0.62} ${bh * 0.34} L${bw * 0.93} ${bh * 0.4} L${bw} ${bh * 0.62} L${bw * 0.93} ${bh * 0.84} L${bw * 0.1} ${bh * 0.86} Z` });
  const boatAt = boatAt0;
  const boatLab = label(C, { text: 'B-59 · cut paper, not to scale', size: px(22), name: '2 Sub label', seed: 81, L });

  // charges: red paper discs; each falls from the surface, slows, and is pressed down at its depth
  const ch = [0, 1, 2, 3].map(i => ({
    pc: disc(C, L, { r: px(pk(30, 28) - i * 2), color: PAL.black, name: `2 Depth charge ${i + 1}`, seed: 90 + i }),
    x: pk(W * [0.43, 0.52, 0.47, 0.57][i], W * [0.40, 0.55, 0.47, 0.62][i]),
    d: px(pk([90, 190, 140, 230][i], [70, 170, 120, 200][i])),
    t0: T.dc + i * 0.21 + 0.3,
  }));
  const dcStrip = strip(C, { text: 'Depth charges', size: px(pk(104, 78)), bg: PAL.paper, color: PAL.ink, name: '2 DEPTH CHARGES strip', seed: 97, L, track: 0.02 });
  const dcStripAt = pk([W * 0.77, H * 0.585], [W * 0.62, H * 0.6]);
  const dcLab = label(C, { text: 'practice charges · signals', size: px(26), name: '2 Charges label', seed: 95, L });
  const dcLabAt = pk([W * 0.80, H * 0.69], [W * 0.62, H * 0.66]);

  // Moscow: a strip, then a blank red strip glued across it (silence)
  const mos = strip(C, { text: 'Moscow', size: px(pk(150, 140)), bg: PAL.black, color: PAL.paper, name: '2 MOSCOW strip', seed: 101, L, track: 0.03 });
  const mosAt = pk([W * 0.78, H * 0.83], [W * 0.5, H * 0.745]);
  const gagW = mos.w * 1.12, gagH = px(pk(66, 62));
  const gag = block(C, L, { w: gagW, h: gagH, color: PAL.red, name: '2 Red tape over MOSCOW', seed: 103 });

  [beam.piece, surf, ...shipP, ...capP.map(c => c.piece), boat.piece, boatLab.piece, ...ch.map(c => c.pc), dcStrip.piece, dcLab.piece, mos.piece, gag].forEach((o, i) => (o.root.style.zIndex = i + 1));

  ctx.ambience('sea-wash-calm-01', { from: 0, to: ctx.duration, lu: -19, fade: 0.6 });
  ctx.sfx('pm-paper-lay', T.s1 - ctx.start, { lu: -15 });
  ctx.sfx('pm-paper-lay', T.s2 - ctx.start, { lu: -17 });
  ctx.sfx('pm-paper-lay', T.s3 - ctx.start, { lu: -16 });
  ctx.sfx('boom-distant-01', ch[0].t0 - ctx.start + F, { lu: -9 });
  ctx.sfx('boom-slapback-01', ch[2].t0 - ctx.start + F, { lu: -11 });
  ctx.sfx('pm-paper-lay', T.moscow - ctx.start, { lu: -14 });
  ctx.sfx('pm-tear', T.silent - ctx.start - 0.25, { lu: -16 });

  const cam0 = camTo(L, [W / 2, H * 0.42], [W / 2, H / 2], 1.06);
  const cam1 = camTo(L, pk([W * 0.52, H * 0.56], [W * 0.5, H * 0.52]), [W / 2, H / 2], 1.0);
  return {
    update(tl) {
      const t = tl + ctx.start;
      st.update(tl, mixCam(cam0, cam1, glide(t, T.surf, T.dc + 0.6)));
      surf.set(slap(t, T.surf, { at: surfAt, r1: surfR, from: [px(-260), 0], r0: surfR, dur: 0.32 }));
      boat.piece.set(slap(t, T.sub, { at: boatAt, r1: -1.5, from: [px(80), px(30)] }));
      boatLab.piece.set(slap(t, T.sub + 0.3, { at: [boatAt[0] + px(pk(40, 20)), boatAt[1] + px(pk(78, 74))], r1: -1.5, from: [0, px(24)], dur: 0.22 }));
      ships.forEach((s, i) => {
        shipP[i].set(slap(t, s.t, { at: s.at, r1: s.r, from: [px(-60 + i * 50), px(-170)], r0: s.r + (i % 2 ? -9 : 8) }));
        capP[i].piece.set(slap(t, s.t + 0.4, { at: [s.at[0] + px(s.w * 0.12), s.at[1] + px(s.h / 2 + 10)], r1: s.r, from: [0, px(20)], dur: 0.22 }));
      });
      for (const c of ch) {
        const y0 = surfY(c.x), y1 = y0 + c.d;
        const ta = c.t0 - 0.55;
        if (t < ta) { c.pc.set({ x: c.x, y: y0, op: 0 }); continue; }
        const p = progress(t, ta, c.t0);
        // falls through water: fast start under the surface, drag slows it (ease-out), lands pressed
        c.pc.set({ x: c.x + Math.sin(p * 2.2 + c.x) * px(5), y: lerp(y0 - px(24), y1, ez.out(p)), r: 0, s: lerp(1.1, 1, p), lift: 1 - p, op: clamp(p * 6) });
      }
      beam.piece.set(slap(t, T.surf + 0.3, { at: beamAt, r1: 0, from: [px(60), px(-200)], r0: 3, dur: 0.34 }));
      dcStrip.piece.set(slap(t, T.dc, { at: dcStripAt, r1: pk(-5, -6), from: [px(140), px(40)], r0: 3, dur: 0.3 }));
      if (por) dcLab.piece.set({ x: 0, y: 0, op: 0 }); else dcLab.piece.set(slap(t, T.dc + 1.2, { at: dcLabAt, r1: pk(-3, -2), from: [0, px(26)], dur: 0.24 }));
      mos.piece.set(slap(t, T.moscow, { at: mosAt, r1: pk(-8, -6), from: [px(150), px(110)], r0: 2 }));
      gag.set(slap(t, T.silent, { at: [mosAt[0] - px(4), mosAt[1] + px(4)], r1: pk(-1, 2), from: [px(-320), 0], r0: pk(-1, 2), dur: 0.26, s0: 1.03 }));
    },
  };
}

/* ===================================================================================== */
/* BOARD 3 — the torpedo, three officers, two YES, one NO (scenes 3 and 4 share it)     */
/* ===================================================================================== */
export async function boardVote(root, ctx, { sheetIn = false, phase = 3 } = {}) {
  const L = ctx.layout, W = L.width, H = L.height, por = L.portrait, px = L.px;
  const st = stageBoard(root, ctx, { seed: 37, sheetIn });
  const C = st.content;
  const pk = (l, p) => (por ? p : l);
  const T = {
    nuc: G(ctx, 'nuclear') - 2 * F, torp: G(ctx, 'torpedo') - 2 * F, three: G(ctx, 'three') - 2 * F, off: G(ctx, 'officers') - 2 * F,
    agree: G(ctx, 'agree') - 2 * F, two: G(ctx, 'Two') - 2 * F, say: G(ctx, 'say') - 2 * F, yes: G(ctx, 'yes') - 2 * F,
    third: G(ctx, 'third') - 2 * F, vas: G(ctx, 'Vasili') - 2 * F, ark: G(ctx, 'Arkhipov') - 2 * F, no: G(ctx, 'no') - 2 * F,
    world: G(ctx, 'world') - 2 * F, forty: G(ctx, 'forty') - 2 * F, later: G(ctx, 'later') - 2 * F,
  };
  // torpedo: two pieces (body + red warhead), cut from paper; the NO cuts them apart
  const tl_ = px(pk(1240, 860)), th = px(pk(104, 80));
  const bodyW = tl_ * 0.74, noseW = tl_ * 0.26;
  const body = shapePiece(C, { name: '3 Torpedo body (diagram)', w: bodyW, h: th, L, color: PAL.red,
    d: `M0 ${th * 0.08} L${bodyW * 0.035} ${th * 0.18} L${bodyW * 0.035} ${th * 0.82} L0 ${th * 0.92} L${bodyW * 0.07} ${th * 0.92} L${bodyW * 0.07} ${th * 0.86} L${bodyW} ${th * 0.86} L${bodyW} ${th * 0.14} L${bodyW * 0.07} ${th * 0.14} L${bodyW * 0.07} ${th * 0.08} Z` });
  const nose = shapePiece(C, { name: '3 Torpedo warhead', w: noseW, h: th, L, color: PAL.red,
    d: `M0 ${th * 0.14} L${noseW * 0.55} ${th * 0.14} Q${noseW} ${th * 0.2} ${noseW} ${th * 0.5} Q${noseW} ${th * 0.8} ${noseW * 0.55} ${th * 0.86} L0 ${th * 0.86} Z` });
  const torR = pk(-11, -14), torC = pk([W * 0.44, H * 0.25], [W * 0.47, H * 0.2]);
  const ca = Math.cos(torR * Math.PI / 180), sa = Math.sin(torR * Math.PI / 180);
  const along = d => [torC[0] + d * ca, torC[1] + d * sa];
  const bodyAt = along(-tl_ / 2 + bodyW / 2), noseAt = along(tl_ / 2 - noseW / 2 + px(1));
  const spine = block(C, L, { w: pk(W * 1.6, 2600), h: th * 2.7, color: PAL.black, name: '3 Black diagonal band', seed: 117 });
  const spineAt = along(px(pk(-80, 0)));
  const torLab = label(C, { text: 'torpedo · diagram, not to scale', size: px(pk(28, 26)), name: '3 Torpedo label', seed: 121, L });
  const torLabAt = pk([W * 0.78, H * 0.135], [W * 0.43, H * 0.125]);

  // three officers: different build, weight, head turn; cut from black paper, no faces
  const fy = pk(H * 0.885, H * 0.655), fh = px(pk(300, 290));
  const imB36 = await loadImg(ctx, 'assets/b36-cecil-1962.jpg'), imB59 = await loadImg(ctx, 'assets/b59-surfaced-1962.jpg');
  const texOf = (crop, sd, im = sd === 3 ? imB36 : imB59) => bakePrint(im, crop, Math.round(fh * 0.9), Math.round(fh * 1.08), { seed: sd, contrast: 1.5 }).toDataURL('image/jpeg', 0.92);
  const tex = [texOf({ x: 40, y: 480, w: 280, h: 250 }, 1), texOf({ x: 620, y: 440, w: 300, h: 280 }, 2), texOf({ x: 150, y: 90, w: 260, h: 200 }, 3)];
  const figs = [
    officer(C, L, { tex: tex[0], name: '3 Officer 1 (captain)', hgt: fh * 1.04, pose: { lean: 2, stance: 24, shift: 2, twist: 0.0, armL: [34, -78], armR: [34, -78], head: 4, visor: 1 } }),
    officer(C, L, { tex: tex[1], name: '3 Officer 2 (political officer)', hgt: fh * 0.97, pose: { lean: -3, stance: 10, shift: -2, twist: 0.22, armL: [6, 4], armR: [9, 2], head: -9, visor: -1 } }),
    officer(C, L, { tex: tex[2], name: '3 Officer 3 (Arkhipov)', hgt: fh, pose: { lean: -4, stance: 18, shift: -1, twist: 0.08, armL: [44, 4], armR: [6, 3], openL: true, head: -6, visor: -1 } }),
  ];
  const figX = pk([W * 0.17, W * 0.34, W * 0.80], [W * 0.19, W * 0.44, W * 0.735]);
  const ob = G(ctx, 'On') - 2 * F;
  const figT = [ob + 0.05, ob + 0.3, ob + 0.62];
  const roleT = [T.three, T.three + 0.25, T.off + 0.1];
  const roles = ['captain', 'political officer', 'chief of staff'].map((txt, i) => label(C, { text: txt, size: px(pk(26, 24)), name: `3 Role ${i + 1}`, seed: 130 + i, L }));
  const agree = strip(C, { text: '3 of 3 must agree', size: px(pk(64, 58)), bg: PAL.paper, color: PAL.ink, name: '3 Rule strip', seed: 141, L, weight: 700, track: 0.03 });
  const agreeAt = pk([W * 0.555, H * 0.66], [W * 0.5, H * 0.395]);
  const yes = [0, 1].map(i => strip(C, { text: 'Yes', size: px(pk(128, 104)), bg: PAL.paper, color: PAL.ink, name: `3 YES strip ${i + 1}`, seed: 150 + i, L, track: 0.02 }));
  const yesAt = [[figX[0] + px(pk(10, 4)), fy - fh * 1.3], [figX[1] - px(pk(6, 2)), fy - fh * 1.33]];

  // phase 4 pieces
  const name = strip(C, { text: 'Vasili Arkhipov', size: px(pk(80, 84)), bg: PAL.black, color: PAL.paper, name: '4 Name strip', seed: 161, L, track: 0.02 });
  const nameAt = pk([W * 0.785, H * 0.535], [W * 0.52, H * 0.722]);
  const noW = px(pk(700, 640)), noH = px(pk(270, 250));
  const noNode = el('div', { style: { position: 'absolute', left: 0, top: 0, width: noW + 'px', height: noH + 'px', background: PAL.paper, color: PAL.red, font: `900 ${px(pk(285, 262))}px ${FONT.disp}`, lineHeight: noH + 'px', textAlign: 'center', letterSpacing: '0.02em' } }, null, 'NO');
  const noBar = piece(C, { name: '4 NO bar', w: noW, h: noH, pts: scissor(rectPts(noW, noH), 171, { snip: 44, jit: 2, nick: 0.3 }), node: noNode, L });
  const noAt = pk([W * 0.45, H * 0.24], [W * 0.5, H * 0.255]), noR = pk(13, 12);
  const forty = strip(C, { text: '40 years later', size: px(pk(80, 74)), bg: PAL.paper, color: PAL.ink, name: '4 Forty years strip', seed: 181, L, weight: 900, track: 0.02 });
  const fortyAt = pk([W * 0.565, H * 0.80], [W * 0.47, H * 0.778]);
  const fortyLab = label(C, { text: 'widely known c. 2002', size: px(pk(24, 24)), name: '4 Forty label', seed: 183, L });
  const fortyLabAt = pk([W * 0.615, H * 0.88], [W * 0.53, H * 0.812]);

  // z-order: torpedo < figures < labels < yes < name < NO bar < forty
  [spine, body.piece, nose.piece, torLab.piece, ...figs.map(f => f.piece), ...roles.map(r => r.piece), agree.piece, ...yes.map(y => y.piece), name.piece, noBar, forty.piece, fortyLab.piece]
    .forEach((o, i) => (o.root.style.zIndex = i + 1));

  if (phase === 3) {
    ctx.ambience('door-creak-01', { from: 0, to: ctx.duration, lu: -24, fade: 1.0 }); // hull groans under pressure
    ctx.sfx('pm-paper-lay', T.torp - ctx.start, { lu: -12 });
    ctx.sfx('pm-paper-lay', T.three - ctx.start, { lu: -17 });
    ctx.sfx('pm-paper-lay', T.off - ctx.start, { lu: -18 });
    ctx.sfx('pm-paper-lay', T.say - ctx.start, { lu: -15 });
    ctx.sfx('pm-paper-lay', T.yes - ctx.start, { lu: -14 });
    ctx.sfx('breath-close-01', T.yes - ctx.start + 0.5, { lu: -22 });
  } else {
    ctx.ambience('door-creak-01', { from: 0, to: T.no - ctx.start - 0.6, lu: -25, fade: 0.8 });
    ctx.sfx('pm-paper-lay', T.vas - ctx.start, { lu: -15 });
    ctx.sfx('pm-paper-lay', T.no - ctx.start, { lu: -8 });
    ctx.sfx('pm-snip', T.no - ctx.start + 0.12, { lu: -12 });
    ctx.ambience('sea-wash-calm-01', { from: T.no - ctx.start + 0.4, to: ctx.duration, lu: -22, fade: 1.5 }); // air again
    ctx.sfx('pm-paper-lay', T.forty - ctx.start, { lu: -16 });
  }

  // camera: wide (3) → in on the third officer (4: "The third") → back out to the whole poster after NO
  const wide = camTo(L, [W / 2, H / 2], [W / 2, H / 2], 1.0);
  const third = camTo(L, pk([W * 0.74, H * 0.58], [W * 0.68, H * 0.55]), pk([W * 0.62, H * 0.55], [W * 0.56, H * 0.52]), pk(1.09, 1.08));
  const outro = camTo(L, [W / 2, H * 0.5], [W / 2, H / 2], 0.97);
  return {
    update(tl) {
      const t = tl + ctx.start;
      let cam = mixCam(wide, third, glide(t, T.third - 0.15, T.vas + 0.5));
      cam = mixCam(cam, wide, glide(t, T.no - 0.3, T.no + 0.15));
      cam = mixCam(cam, outro, glide(t, T.world, T.later + 0.6));
      st.update(tl, cam);
      // NO cuts the torpedo: the warhead slides off its axis and turns, a gap opens at the cut
      const cut = ez.out(progress(t, T.no + 0.12, T.no + 0.7));
      spine.set(slap(t, ob - 0.32, { at: spineAt, r1: torR, from: [px(-300), px(60)], r0: torR - 2, dur: 0.36 }));
      body.piece.set({ ...slap(t, T.torp, { at: bodyAt, r1: torR, from: [px(-380), px(80)], r0: torR - 4, dur: 0.4 }), r: torR - cut * 2 });
      const ns = slap(t, T.torp + 0.12, { at: noseAt, r1: torR, from: [px(-300), px(60)], r0: torR - 4, dur: 0.4 });
      nose.piece.set({ ...ns, x: ns.x + cut * px(pk(110, 60)), y: ns.y + cut * px(pk(120, 70)), r: ns.r + cut * 19 });
      torLab.piece.set(slap(t, T.torp + 0.5, { at: torLabAt, r1: torR * 0.6, from: [0, px(24)], dur: 0.24 }));
      figs.forEach((f, i) => {
        f.piece.set(slap(t, figT[i], { at: [figX[i], fy], r1: 0, from: [px(i === 2 ? 120 : -60), px(-90)], r0: i === 2 ? 5 : -5, dur: 0.3 }));
        roles[i].piece.set(slap(t, roleT[i], { at: [figX[i], fy + px(pk(36, 32))], r1: [-2, 2, -1][i], from: [0, px(20)], dur: 0.22 }));
      });
      agree.piece.set(slap(t, T.agree, { at: agreeAt, r1: pk(-5, -4), from: [px(60), px(-60)], dur: 0.28 }));
      yes[0].piece.set(slap(t, T.say, { at: yesAt[0], r1: -9, from: [px(-40), px(-90)], r0: -18, dur: 0.28 }));
      yes[1].piece.set(slap(t, T.yes, { at: yesAt[1], r1: 7, from: [px(40), px(-90)], r0: 15, dur: 0.28 }));
      name.piece.set(slap(t, T.vas, { at: nameAt, r1: pk(-5, -4), from: [px(120), px(60)], r0: 2, dur: 0.32 }));
      noBar.set(slap(t, T.no, { at: noAt, r1: noR, from: [px(pk(420, 260)), px(-260)], r0: noR + 10, dur: 0.3, s0: 1.2 }));
      forty.piece.set(slap(t, T.forty, { at: fortyAt, r1: pk(-4, -3), from: [px(-80), px(70)], dur: 0.3 }));
      fortyLab.piece.set(slap(t, T.later + 0.2, { at: fortyLabAt, r1: pk(-4, -3), from: [0, px(20)], dur: 0.22 }));
    },
  };
}
