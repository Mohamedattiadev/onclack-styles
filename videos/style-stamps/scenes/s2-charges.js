// 2 · PRESSURE. KNOW: US ships drop practice depth charges; Moscow silent for days. FEEL: being hit from above, alone.
// 2A (0–3.4 s)  a new leaf turns in: a tall "section" issue (ships above, the boat below). On "drop … depth charges"
//               four ring cancels are struck down the sea, each one a muffled boom; the stamp jolts.        truth: VO/RC
// 2B (3.4–6.6 s) pan to three printed EMPTY spaces "orders from Moscow · 24 X / 25 X / 26 X" — nothing in them;
//               a pencil note: "no word".                                                                   truth: VO
import { glide, clamp, svg, shake } from '/onclack-styles/engine/lib/anim.js';
import { C, F, makeLeaf, makeStamp, imageArea, screen, makePostmark, showStrike, strike, makePencil, caption, txt, emptySpace } from '../shared/album.js';
import { subD, shipD } from '../shared/art.js';

export default async function (root, ctx) {
  const pg = makeLeaf(root, ctx, { name: '2 · Album leaf', header: 'SEA POST · NAVAL EPISODES', folio: 'leaf 2' });
  const { W, H, L, u, content } = pg;
  const port = L.portrait;
  const g0 = ctx.start;

  const S = L.pick({ landscape: { x: 190, y: 110, w: 560, h: 820 }, portrait: { x: 200, y: 215, w: 600, h: 860 } });
  const st = makeStamp(pg, content, { x: S.x * u, y: S.y * u, w: S.w * u, h: S.h * u, seed: 31, rot: -0.6, margin: 0.07, name: '2A Section issue', shortPerf: 23 });
  const ia = imageArea(pg, st);
  const { ix, iy, iw, ih } = st;
  const top = iy + ih * 0.12, wl = iy + ih * 0.33, bot = iy + ih * 0.88;
  // sky (ochre screen), sea in three depth bands (prussian, darker with depth), bottom tablet
  svg('rect', { x: ix, y: iy, width: iw, height: wl - iy, fill: screen(pg, '#D7B06A', { gap: 6, w: 2.6, bg: '#EBDDBC' }) }, ia);
  const bands = ['#2F6A8C', '#24506A', '#1A3A50'];
  bands.forEach((c, i) => svg('rect', { x: ix, y: wl + (bot - wl) * i / 3, width: iw, height: (bot - wl) / 3 + 1, fill: c }, ia));
  svg('rect', { x: ix, y: wl, width: iw, height: bot - wl, fill: screen(pg, '#000', { gap: 9, w: 1.4 }), opacity: 0.18 }, ia);
  svg('rect', { x: ix, y: iy, width: iw, height: top - iy, fill: C.prussian }, ia);
  svg('rect', { x: ix, y: bot, width: iw, height: iy + ih - bot, fill: C.prussian }, ia);
  txt(ia, 'SEA POST', ix + 22 * u, iy + (top - iy) * 0.7, 34 * u, { fill: C.stampPaper, 'font-family': F.stamp, 'font-weight': 600, 'text-anchor': 'start', 'letter-spacing': 4 * u });
  txt(ia, '10', ix + iw - 22 * u, iy + (top - iy) * 0.78, 56 * u, { fill: C.ochre, 'font-family': F.stamp, 'font-weight': 600, 'text-anchor': 'end' });
  txt(ia, 'PRACTICE CHARGES', ix + iw / 2, bot + (iy + ih - bot) * 0.62, 32 * u, { fill: C.stampPaper, 'font-family': F.stamp, 'font-weight': 600, 'letter-spacing': 3 * u });
  // two destroyers on the waterline (different superstructures), wake lines
  const ships = [[ix + iw * 0.3, 0, 210], [ix + iw * 0.74, 1, 170]];
  for (const [x, v, len] of ships) {
    const sp = shipD(len * u, v);
    const gS = svg('g', { transform: `translate(${x} ${wl})`, fill: '#13283A', 'data-name': '2A Ship' }, ia);
    svg('path', { d: sp.hull }, gS); svg('path', { d: sp.sup }, gS);
  }
  svg('rect', { x: ix, y: wl - 1 * u, width: iw, height: 3 * u, fill: '#13283A' }, ia);
  // depth charges printed sinking (small barrels, short sink trails)
  const charges = [[0.26, 0.45], [0.42, 0.56], [0.7, 0.5], [0.58, 0.66]];
  for (const [fx, fy] of charges) {
    const cx = ix + iw * fx, cy = iy + ih * fy;
    svg('path', { d: `M ${cx} ${cy - 46 * u} L ${cx} ${cy - 14 * u}`, stroke: '#9FC0D2', 'stroke-width': 2 * u, 'stroke-dasharray': `${3 * u} ${5 * u}`, opacity: 0.7 }, ia);
    svg('rect', { x: cx - 9 * u, y: cy - 12 * u, width: 18 * u, height: 24 * u, rx: 3 * u, fill: '#E9DDBF' }, ia);
    svg('rect', { x: cx - 9 * u, y: cy - 4 * u, width: 18 * u, height: 3 * u, fill: '#1A3A50' }, ia);
  }
  // the boat, deep, cream on the darkest band
  const sp = subD(250 * u);
  const subX = ix + iw * 0.5, subY = iy + ih * 0.8;
  const subG = svg('g', { transform: `translate(${subX} ${subY})`, fill: C.stampPaper, 'data-name': '2A Submarine (deep)' }, ia);
  for (const d of [sp.hull, sp.sail, sp.tail]) svg('path', { d }, subG);
  // ring cancels (struck) — positions in stamp-local px
  const hits = [[0.3, 0.52, 8.93], [0.66, 0.6, 9.74], [0.44, 0.7, 10.02], [0.72, 0.78, 10.46]];
  const rings = hits.map(([fx, fy, tt], i) => {
    const cx = st.w * fx, cy = st.h * fy;
    return { m: makePostmark(pg, st.marks, { cx, cy, r: (78 - i * 4) * u, target: true, seed: 40 + i, color: '#0E0D14', name: `2A Ring cancel ${i + 1}` }), cx, cy, tt };
  });
  caption(pg, content, (S.x + S.w / 2) * u, (S.y + S.h + 50) * u, port ? '' : 'NO. 5 · THE CHARGES', port ? '' : 'SP 62 · 5 · section view, not to scale', { name: '2A Printed caption' });

  // 2B the empty spaces
  const E = L.pick({
    landscape: { x: 880, y: 330, w: 270, h: 330, gap: 36, cap: 250, pen: 800 },
    portrait: { x: 112, y: 1236, w: 236, h: 226, gap: 24, cap: 1160, pen: 1508 },
  });
  const days = ['24 X', '25 X', '26 X'];
  const spaces = days.map((d, i) => emptySpace(pg, content, { x: (E.x + i * (E.w + E.gap)) * u, y: E.y * u, w: E.w * u, h: E.h * u, label: d, name: `2B Empty space ${d}` }));
  const ex = (E.x + (3 * E.w + 2 * E.gap) / 2) * u;
  caption(pg, content, ex, E.cap * u, 'ORDERS FROM MOSCOW', 'spaces 6–8 · not issued', { size: 24, name: '2B Printed caption' });
  // an old hinge left in the middle space (a stamp was never mounted there — or was taken out)
  const hx = (E.x + E.w + E.gap + E.w * 0.38) * u, hy = (E.y + E.h * 0.2) * u;
  svg('path', { d: `M ${hx} ${hy} l ${46 * u} ${-3 * u} l ${3 * u} ${26 * u} l ${-47 * u} ${4 * u} Z`, fill: '#F7F3E8', opacity: 0.55, 'data-name': '2B Old hinge' }, content);
  const pen = makePencil(pg, content, { x: ex, y: E.pen * u, text: port ? 'no word. days.' : 'no word — for days', size: (port ? 40 : 42) * u, anchor: 'middle', underline: true, name: '2B Pencil note' });

  // ---------- sound ----------
  ctx.ambience('sea-water-close-01', { from: 0, to: 3.6, lu: -25, fade: 0.8 });
  ctx.sfx('page-turn-01', 0.02, { lu: -15 });                       // the leaf turns
  rings.forEach((r, i) => {
    ctx.sfx(i % 2 ? 'boom-slapback-01' : 'boom-distant-01', r.tt - g0 - 0.02, { lu: i === 2 ? -6 : -9 });
    ctx.sfx('letterpress-manual-01', r.tt - g0 - 0.03, { lu: -19 });
  });
  // then nothing: only the room — the silence is the point (sea bed fades out under "Moscow")

  return {
    update(t) {
      const g = g0 + t;
      pg.turn(glide(t, 0, 0.55, 0, 1));
      let jolt = 0;
      rings.forEach((r) => { showStrike(r.m, strike(g, r.tt), r.cx, r.cy); jolt += shake(g, r.tt, { amp: 5 * u, decay: 0.22 }); });
      st.setPose(jolt * 0.6, jolt);
      pen.set(clamp((g - 12.05) / 1.2));
      // camera: medium on the stamp, slow push toward the boat while it's hit; then the pan to the empty spaces
      const A = L.pick({ landscape: [(S.x + S.w / 2 + 300) * u, H / 2, 1.0], portrait: [W / 2, 900 * u, 1.06] });
      const B = L.pick({ landscape: [(S.x + S.w / 2 + 120) * u, (S.y + S.h * 0.58) * u, 1.1], portrait: [W / 2, 860 * u, 1.14] });
      const Cc = L.pick({ landscape: [ex - 40 * u, (E.y + E.h / 2 + 60) * u, 1.12], portrait: [W / 2, H / 2 + 40 * u, 1.0] });
      const k1 = glide(t, 0.6, 3.2, 0, 1), k2 = glide(t, 3.45, 4.7, 0, 1);
      const mix = (i) => A[i] + (B[i] - A[i]) * k1 + (Cc[i] - B[i]) * k2;
      pg.cam(mix(0), mix(1), mix(2) * (1 + 0.004 * t));
    },
  };
}
