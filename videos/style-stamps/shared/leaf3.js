// Leaf 3 — used by scenes 3 and 4 (same leaf, so the cut between them is invisible):
// a long torpedo issue on top, a se-tenant strip of three officer stamps below (joined by their perforations).
import { svg } from '/onclack-styles/engine/lib/anim.js';
import { C, F, makeLeaf, makeStamp, imageArea, screen, makeOverprint, makePencil, makeStrip, caption, txt, emptySpace } from './album.js';
import { torpD, officer } from './art.js';

export function buildLeaf3(root, ctx) {
  const pg = makeLeaf(root, ctx, { name: '3 · Album leaf', header: 'SEA POST · NAVAL EPISODES', folio: 'leaf 3' });
  const { W, H, L, u, content } = pg;
  const port = L.portrait;
  const T = L.pick({ landscape: { x: 360, y: 92, w: 1200, h: 280 }, portrait: { x: 105, y: 260, w: 790, h: 270 } });
  const R = L.pick({ landscape: { x: 495, y: 445, w: 310, h: 410 }, portrait: { x: 101, y: 750, w: 266, h: 440 } });

  // printed space under the torpedo stamp (visible before it is laid in)
  emptySpace(pg, content, { x: (T.x + 6) * u, y: (T.y + 6) * u, w: (T.w - 12) * u, h: (T.h - 12) * u, label: '', name: '3A Space for no. 9' });
  const ts = makeStamp(pg, content, { x: T.x * u, y: T.y * u, w: T.w * u, h: T.h * u, seed: 51, rot: 0.25, margin: 0.09, name: '3A Torpedo issue' });
  {
    const ia = imageArea(pg, ts); const { ix, iy, iw, ih } = ts;
    svg('rect', { x: ix, y: iy, width: iw, height: ih, fill: C.slate }, ia);
    svg('rect', { x: ix + iw * 0.2, y: iy, width: iw * 0.8, height: ih, fill: screen(pg, '#4C5C6B', { gap: 7, w: 2.4, bg: C.slate }) }, ia);
    const left = svg('rect', { x: ix, y: iy, width: iw * 0.2, height: ih, fill: C.ochre }, ia);
    txt(ia, 'SEA', ix + iw * 0.1, iy + ih * 0.36, (port ? 30 : 36) * u, { fill: C.slate, 'font-family': F.stamp, 'font-weight': 600, 'letter-spacing': 3 * u });
    txt(ia, 'POST', ix + iw * 0.1, iy + ih * 0.36 + (port ? 34 : 42) * u, (port ? 30 : 36) * u, { fill: C.slate, 'font-family': F.stamp, 'font-weight': 600, 'letter-spacing': 3 * u });
    txt(ia, '50', ix + iw * 0.1, iy + ih * 0.88, (port ? 52 : 66) * u, { fill: C.slate, 'font-family': F.stamp, 'font-weight': 600 });
    const tp = torpD(iw * 0.66);
    const tg = svg('g', { transform: `translate(${ix + iw * 0.6} ${iy + ih * 0.46})`, 'data-name': '3A Torpedo' }, ia);
    svg('path', { d: tp.fins, fill: '#E9DDBF' }, tg);
    svg('path', { d: tp.body, fill: '#E9DDBF' }, tg);
    svg('path', { d: tp.bands, fill: C.slate, opacity: 0.8 }, tg);
    txt(ia, 'ON BOARD · ONE NUCLEAR TORPEDO', ix + iw * 0.6, iy + ih * 0.9, (port ? 21 : 27) * u, { fill: '#E9DDBF', 'font-family': F.stamp, 'font-weight': 600, 'letter-spacing': 3 * u });
    void left;
  }

  ['I', 'II', 'III'].forEach((n, i) => emptySpace(pg, content, { x: (R.x + i * R.w + 8) * u, y: (R.y + 8) * u, w: (R.w - 16) * u, h: (R.h - 16) * u, label: n, name: `3B Space ${n}` }));
  // se-tenant strip: three stamps sharing perforations (gap 0), each its own ink and posture
  const inks = [[C.olive, '#DCD9BE'], [C.plum, '#E2D2D4'], [C.steel, '#D3DAE0']];
  const officers = inks.map(([ink, tint], i) => {
    const st = makeStamp(pg, content, { x: (R.x + i * R.w) * u, y: R.y * u, w: R.w * u, h: R.h * u, seed: 61 + i, rot: 0, margin: 0.085, name: `3B Officer stamp ${['I', 'II', 'III'][i]}` });
    const ia = imageArea(pg, st); const { ix, iy, iw, ih } = st;
    svg('rect', { x: ix, y: iy, width: iw, height: ih, fill: tint }, ia);
    svg('rect', { x: ix, y: iy + ih * 0.6, width: iw, height: ih * 0.26, fill: screen(pg, ink, { gap: 6, w: 1.6 }), opacity: 0.45 }, ia); // floor screen
    svg('rect', { x: ix, y: iy, width: iw, height: ih, fill: 'none', stroke: ink, 'stroke-width': 9 * u }, ia);
    const fs = Math.min(iw * 0.82 / 100, ih * 0.6 / 150);
    const fg = svg('g', { transform: `translate(${ix + iw / 2 - 50 * fs} ${iy + ih * 0.84 - 150 * fs}) scale(${fs})`, 'data-name': `3B Figure ${i + 1}` }, ia);
    officer(fg, i, ink, tint === '#D3DAE0' ? '#AFC0CF' : tint);
    svg('rect', { x: ix, y: iy + ih * 0.86, width: iw, height: ih * 0.14, fill: ink }, ia);
    txt(ia, ['I', 'II', 'III'][i], ix + iw - 22 * u, iy + 50 * u, 40 * u, { fill: ink, 'font-family': F.stamp, 'font-weight': 600, 'text-anchor': 'end' });
    txt(ia, 'SEA POST', ix + 20 * u, iy + 40 * u, 17 * u, { fill: ink, 'font-family': F.stamp, 'font-weight': 600, 'text-anchor': 'start', 'letter-spacing': 2 * u });
    txt(ia, 'OFFICER', ix + iw / 2, iy + ih * 0.955, 21 * u, { fill: tint, 'font-family': F.print, 'font-weight': 600, 'letter-spacing': 4 * u });
    return st;
  });
  const stripW = 3 * R.w * u;
  makeStrip(pg, content, { x: R.x * u - 30 * u, y: (R.y + R.h * 0.55) * u, w: stripW + 60 * u, h: R.h * 0.5 * u, name: '3B Glassine strip' });
  caption(pg, content, (R.x * u + stripW / 2), (R.y + R.h + 44) * u, 'NO. 10–12 · SE-TENANT STRIP', 'three officers · one decision', { name: '3B Printed caption' });

  // overprints (typeset on top): YES on I and II, the red NO on III
  const yes = [0, 1].map((i) => {
    const st = officers[i];
    return makeOverprint(pg, st.marks, { x: st.w / 2, y: st.h * 0.62, text: 'YES', size: 112 * u, rot: -9, color: '#151417', seed: 70 + i, name: `3B Overprint YES ${i + 1}` });
  });
  const s3 = officers[2];
  const no = makeOverprint(pg, s3.marks, { x: s3.w / 2, y: s3.h * 0.7, text: 'NO', size: 270 * u, rot: -11, color: C.carmine, spacing: 0.02, seed: 90, name: '4 Overprint NO (red)' });

  // pencil: bracket + "all three must agree" under the strip; the name under III
  const penAgree = makePencil(pg, content, L.pick({
    landscape: { x: R.x * u + stripW / 2, y: (R.y + R.h + 118) * u, text: 'all three must agree', size: 38 * u, anchor: 'middle', name: '3B Pencil: must agree' },
    portrait: { x: R.x * u + stripW / 2, y: (R.y + R.h + 140) * u, text: 'all three must agree', size: 40 * u, anchor: 'middle', name: '3B Pencil: must agree' },
  }));
  const penName = makePencil(pg, content, L.pick({
    landscape: { x: (R.x + 3 * R.w + 40) * u, y: (R.y + R.h * 0.5) * u, text: 'V. Arkhipov', size: 46 * u, anchor: 'start', rot: -4, underline: true, name: '4 Pencil: V. Arkhipov' },
    portrait: { x: (R.x + 3 * R.w - 10) * u, y: (R.y - 62) * u, text: 'III = V. Arkhipov', size: 44 * u, anchor: 'end', rot: -3, underline: true, name: '4 Pencil: V. Arkhipov' },
  }));
  return { pg, ts, officers, yes, no, penAgree, penName, T, R, stripW, W, H, L, u };
}

/** Camera key that both scenes share at the cut (end of 3 = start of 4). */
export function camAtCut(o) {
  const { L, R, u, stripW } = o;
  return L.pick({
    landscape: [R.x * u + stripW * 0.6, (R.y + R.h * 0.5) * u, 1.22],
    portrait: [R.x * u + stripW * 0.56, (R.y + R.h * 0.42) * u, 1.1],
  });
}
