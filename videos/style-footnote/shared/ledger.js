// THE LEDGER PAGE — shared by scene 3 ("three officers") and scene 4 ("the footnote").
// One tall page in world space. Both scenes build the same page and drive it from GLOBAL time, so the
// scene cut at the voice paragraph is invisible and the footnote dive is one continuous move:
//   ✱ lands in row 3 → hairline drops to the foot of the page → camera follows down → the footnote opens.
// Layout: landscape = torpedo plate left, Table 1 right (asymmetric 5 : 6), footnote full text-block width.
//         portrait  = one column; the dive goes straight down the screen.
import { el, svg } from '/onclack-styles/engine/lib/anim.js';
import { creep, smootherstep } from '/onclack-styles/engine/lib/spring.js';
import { C, F, tok, at, page, chrome, camera, text, sc, mark, placeMark, filters, grain, stroke, pencilLoop, pencilLine, smooth, hand, progress, clamp, rand, fontsReady } from './kit.js';

export async function buildLedger(root, ctx, id) {
  await fontsReady();
  const L = ctx.layout, W = L.width, H = L.height, P = L.portrait, u = L.px;
  const fx = filters(root, id, L);
  const ink = { filter: fx.ink };

  // word time (global) by spoken word, first match at/after `after`
  const key = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const wt = (w, after = 0, fb = after) => ctx.words.find(x => x.start >= after - 0.01 && key(x.word) === w)?.start ?? fb;
  const T = {};
  T.on = wt('on', 13, 13.67); T.nuclear = wt('nuclear', T.on, 14.48); T.torpedo = wt('torpedo', T.on, 14.88);
  T.fire = wt('fire', T.on, 15.9); T.three = wt('three', T.fire, 16.51); T.officers = wt('officers', T.fire, 16.86);
  T.agree = wt('agree', T.fire, 17.61); T.two = wt('two', T.agree, 18.29); T.yes = wt('yes', T.two, 18.8);
  T.third = wt('third', T.yes, 20.25); T.vasili = wt('vasili', T.yes, 20.61); T.arkhipov = wt('arkhipov', T.yes, 21.12);
  T.no = wt('no', T.arkhipov, 22.03); T.world = wt('world', T.no, 23.07); T.forty = wt('forty', T.no, 24.13); T.later = wt('later', T.no, 24.73);
  const S3 = ctx.props.ledgerStart ?? 13.32; // scene-3 start (page slides in)

  // ---------- geometry ----------
  const x0 = P ? L.safe.x + u(14) : Math.round(W * 0.075), x1 = P ? L.safe.x + L.safe.w - u(18) : Math.round(W * 0.935); // portrait: 18 px inside safe so the hold creep never pushes text out
  const FR = P ? Math.round(H * 1.1) : Math.round(H * 1.16); // footnote rule (world y)
  const Hp = FR + H;
  const edge = el('div', { 'data-name': 'Page edge shadow', style: { position: 'absolute', top: '0', width: `${u(60)}px`, height: `${H}px`,
    background: 'linear-gradient(to left, rgba(35,30,32,0.20), rgba(35,30,32,0))' } }, root);
  const pg = page(root, L, { w: W, h: Hp, seed: 13, name: '3 · Ledger page' });
  chrome(pg, L, { left: 'the arkhipov footnote', right: '§ 3 · on board', top: P ? L.safe.y + u(26) : L.safe.y + u(4), x0, x1 });

  // ---------- 3A · the torpedo (our drawing) ----------
  const ky = P ? Math.round(H * 0.3) : Math.round(H * 0.235);
  const kick = text(pg, sc('on board'), { left: `${x0}px`, top: `${ky}px`, fontSize: `${u(40)}px`, ...ink }, '3A · Kicker');
  const hero = text(pg, 'one nuclear torpedo', { left: `${x0 - u(3)}px`, top: `${ky + u(58)}px`, fontSize: `${u(P ? 96 : 80)}px`, fontStyle: 'italic', letterSpacing: '-0.012em', ...ink }, '3A · Hero line');
  const tw = P ? x1 - x0 : Math.round(W * 0.43), th = u(P ? 170 : 110);
  const ty0 = ky + u(P ? 236 : 200);
  const ts = svg('svg', { width: tw, height: th + u(70), style: { position: 'absolute', left: `${x0}px`, top: `${ty0}px`, overflow: 'visible' }, 'data-name': '3A · Fig. 4 torpedo' }, pg);
  // body: a long cylinder, blunt nose right, taper + cruciform fins + twin screws left
  const cy = th * 0.5, r = th * 0.2, nx = tw * 0.985, tx = tw * 0.12;
  const bodyD = `M ${tx + u(40)} ${cy - r} L ${nx - r * 1.6} ${cy - r} Q ${nx} ${cy - r} ${nx} ${cy} Q ${nx} ${cy + r} ${nx - r * 1.6} ${cy + r} L ${tx + u(40)} ${cy + r} L ${tx} ${cy + r * 0.45} L ${tx} ${cy - r * 0.45} Z`;
  const finD = `M ${tx + u(26)} ${cy - r * 0.62} L ${tx - u(4)} ${cy - r * 2.0} L ${tx - u(16)} ${cy - r * 2.0} L ${tx + u(2)} ${cy - r * 0.5} ` +
    `M ${tx + u(26)} ${cy + r * 0.62} L ${tx - u(4)} ${cy + r * 2.0} L ${tx - u(16)} ${cy + r * 2.0} L ${tx + u(2)} ${cy + r * 0.5} ` +
    `M ${tx} ${cy - r * 0.3} L ${tx - u(30)} ${cy - r * 0.3} M ${tx} ${cy + r * 0.3} L ${tx - u(30)} ${cy + r * 0.3} ` +
    `M ${tx - u(30)} ${cy - r * 1.05} L ${tx - u(30)} ${cy + r * 1.05} M ${tx - u(42)} ${cy - r * 0.9} L ${tx - u(42)} ${cy + r * 0.9}`;
  const whX = nx - tw * 0.24; // warhead section starts here
  const hatch = svg('g', { 'data-name': '3A · Warhead hatching', stroke: C.ink, 'stroke-width': u(1.2), opacity: 0.55 }, ts);
  for (let i = 0, x = whX + u(8); x < nx - r * 0.4; i++, x += u(9)) {
    const yy = Math.min(r, Math.sqrt(Math.max(0, 1 - Math.max(0, (x - (nx - r * 1.6)) / (r * 1.6)) ** 2)) * r) - u(3);
    svg('line', { x1: x, y1: cy - yy, x2: x - u(5), y2: cy + yy }, hatch);
  }
  const body = stroke(ts, bodyD, { color: C.ink, width: u(2.2), filter: fx.ink, name: '3A · Torpedo body' });
  const fins = stroke(ts, finD, { color: C.ink, width: u(2), filter: fx.ink, name: '3A · Fins + screws' });
  const seam = stroke(ts, `M ${whX} ${cy - r} L ${whX} ${cy + r}`, { color: C.ink, width: u(2), name: '3A · Warhead seam' });
  // dimension line under the body (draftsman's habit)
  // pencil note pointing at the warhead section
  const whNote = hand(pg, 'warhead', { size: u(P ? 34 : 32), seed: 31, filter: fx.graphite, style: { left: `${x0 + whX - u(10)}px`, top: `${ty0 - u(48)}px`, transform: 'rotate(-4deg)' } });
  const ovT = svg('svg', { width: W, height: Hp, style: { position: 'absolute', left: '0', top: '0', overflow: 'visible' }, 'data-name': '3A · Pencil layer' }, pg);
  const whTick = stroke(ovT, pencilLine([x0 + whX + u(70), ty0 - u(12)], [x0 + whX + u(92), ty0 + cy - r - u(6)], 33, 0.06), { width: u(2.8), filter: fx.graphite, name: '3A · Pencil tick warhead' });
  const capY = ty0 + th + u(40);
  const cap4 = text(pg, '<i>Fig. 4.</i>&ensp;Type T-5 torpedo, nuclear warhead.', { left: `${x0}px`, top: `${capY}px`, fontSize: `${u(P ? 34 : 32)}px`, ...ink }, '3A · Caption');
  const src4 = text(pg, 'our drawing · outline after published profiles · not to scale', { left: `${x0}px`, top: `${capY + u(46)}px`, fontFamily: F.mono, fontSize: `${u(P ? 21 : 21)}px`, color: C.pencil }, '3A · Source line');

  // ---------- 3B · Table 1 — the three officers ----------
  const bx0 = P ? x0 : Math.round(W * 0.555);
  const by0 = P ? capY + u(260) : ky + u(12);
  const tTitle = text(pg, '<i>Table 1.</i>&ensp;To fire it, three officers must agree.', { left: `${bx0}px`, top: `${by0}px`, fontSize: `${u(P ? 34 : 32)}px`, ...ink }, '3B · Table title');
  const rule0 = by0 + u(62);
  const hr = (y, w, name, hgt = 2, col = C.ink) => el('div', { 'data-name': name, style: { position: 'absolute', left: `${bx0}px`, top: `${y}px`, width: `${w}px`, height: `${Math.max(1, u(hgt))}px`, background: col, transformOrigin: '0 50%' } }, pg);
  const tw2 = x1 - bx0;
  const topRule = hr(rule0, tw2, '3B · Top rule', 2);
  const colA = u(96); // the "agree" column (where ticks and the ✱ go)
  const hdA = text(pg, 'agree', { left: `${bx0}px`, top: `${rule0 + u(16)}px`, fontFamily: F.mono, fontSize: `${u(20)}px`, color: C.pencil }, '3B · Head agree');
  const hdB = text(pg, 'officer · post on b-59', { left: `${bx0 + colA}px`, top: `${rule0 + u(16)}px`, fontFamily: F.mono, fontSize: `${u(20)}px`, color: C.pencil }, '3B · Head officer');
  const midRule = hr(rule0 + u(52), tw2, '3B · Head rule', 1);
  const rowH = u(P ? 128 : 112), r0 = rule0 + u(52);
  const officers = [
    { name: 'Valentin Savitsky', post: 'captain' },
    { name: 'Ivan Maslennikov', post: 'political officer' },
    { name: null, post: 'brigade chief of staff' },
  ];
  const rows = officers.map((o, i) => {
    const y = r0 + i * rowH;
    const g = el('div', { 'data-name': `3B · Row ${i + 1}`, style: { position: 'absolute', left: '0', top: '0' } }, pg);
    // a small ruled box in the agree column (ballot square) — ticks and the ✱ go here
    const bs = u(34), bj = (rand(90 + i) - 0.5) * 1.2;
    const num = el('div', { 'data-name': `3B · Row ${i + 1} box`, style: { position: 'absolute', left: `${bx0 + u(17)}px`, top: `${y + u(46) - bs / 2}px`, width: `${bs}px`, height: `${bs}px`,
      border: `${Math.max(1, u(1.5))}px solid ${C.ink}`, boxSizing: 'border-box', opacity: '0', transform: `rotate(${bj}deg)` } }, g);
    const nm = o.name
      ? text(g, o.name, { left: `${bx0 + colA}px`, top: `${y + u(22)}px`, fontSize: `${u(P ? 46 : 42)}px`, letterSpacing: '-0.005em', ...ink }, `3B · Row ${i + 1} name`)
      : text(g, '', { left: `${bx0 + colA}px`, top: `${y + u(22)}px`, fontSize: `${u(P ? 46 : 42)}px` }, '3B · Row 3 name (blank)');
    if (!o.name) { // a ruled blank to be filled in — the name is withheld until the footnote
      el('div', { 'data-name': '3B · Row 3 blank', style: { position: 'absolute', left: '0', top: `${u(36)}px`, width: `${u(P ? 330 : 300)}px`, height: `${Math.max(1, u(1.5))}px`, background: C.pencil } }, nm);
    }
    const post = text(g, o.post, { left: `${bx0 + colA}px`, top: `${y + u(P ? 76 : 72)}px`, fontFamily: F.mono, fontSize: `${u(22)}px`, color: C.pencil }, `3B · Row ${i + 1} post`);
    const rl = hr(y + rowH, tw2, `3B · Row ${i + 1} rule`, 1, 'rgba(26,23,20,0.35)');
    return { g, y, num, nm, post, rl };
  });
  const botRule = hr(r0 + 3 * rowH, tw2, '3B · Bottom rule', 2);
  const srcT = text(pg, 'after crew accounts (Orlov, 2002) · the vote is debated', { left: `${bx0}px`, top: `${r0 + 3 * rowH + u(20)}px`, fontFamily: F.mono, fontSize: `${u(21)}px`, color: C.pencil }, '3B · Source line');
  const seeNote = text(pg, 'see note below', { left: `${bx0 + colA + u(P ? 346 : 316)}px`, top: `${rows[2].y + u(40)}px`, fontFamily: F.mono, fontSize: `${u(20)}px`, color: C.rubric }, '3B · See note');

  // pencil ✓ + "yes" in rows 1–2 (our layer); each tick is its own seeded shape
  const ov = svg('svg', { width: W, height: Hp, style: { position: 'absolute', left: '0', top: '0', overflow: 'visible' }, 'data-name': '3B · Pencil layer' }, pg);
  const ticks = [0, 1].map(i => {
    const cx = bx0 + u(34), cyy = rows[i].y + u(46), j = (rand(50 + i) - 0.5) * u(6);
    const d = smooth([[cx - u(16), cyy - u(2) + j], [cx - u(6), cyy + u(12)], [cx + u(2), cyy + u(18) + j * 0.5], [cx + u(14), cyy - u(8)], [cx + u(30), cyy - u(30) + j]]);
    return stroke(ov, d, { width: u(3.4), filter: fx.graphite, name: `3B · Pencil tick ${i + 1}` });
  });
  const yesN = [0, 1].map(i => hand(pg, 'yes', { size: u(30), seed: 60 + i, filter: fx.graphite,
    style: { left: `${x1 - u(70) - i * u(6)}px`, top: `${rows[i].y + u(34)}px`, transform: `rotate(${-5 + i * 3}deg)` }, name: `3B · Pencil yes ${i + 1}` }));
  // the ✱ in row 3 — the only red thing; the footnote mark
  const mR = u(P ? 26 : 24);
  const mX = bx0 + u(34), mY = rows[2].y + u(48);
  const m = mark(pg, mR, { name: '3B · ✱ row 3' });

  // ---------- 4 · the footnote (foot of the page) ----------
  const fmR = u(P ? 30 : 30), fmX = P ? mX : x0 + fmR, fmY = FR + u(P ? 104 : 102);
  const fm = mark(pg, fmR, { name: '4 · ✱ footnote mark' });
  const nameSz = u(P ? 104 : 112);
  const fName = text(pg, 'Vasili Arkhipov', { left: `${x0 + fmR * 2 + u(26)}px`, top: `${FR + u(50)}px`, fontSize: `${nameSz}px`, fontStyle: 'italic', letterSpacing: '-0.015em', ...ink }, '4 · Name');
  const fMeta = text(pg, P ? '1926–1998 · chief of staff,<br>69th submarine brigade, aboard b-59' : '1926–1998 · chief of staff, 69th submarine brigade, aboard b-59',
    { left: `${x0 + fmR * 2 + u(30)}px`, top: `${FR + u(50) + nameSz * 1.12}px`, fontFamily: F.mono, fontSize: `${u(P ? 24 : 24)}px`, color: C.pencil, lineHeight: '1.45' }, '4 · Name meta');
  const sy = FR + u(50) + nameSz * 1.12 + u(P ? 120 : 96);
  const saidSz = u(P ? 176 : 150);
  const fSaid = text(pg, 'said', { left: `${x0 + fmR * 2 + u(26)}px`, top: `${sy}px`, fontSize: `${saidSz}px`, letterSpacing: '-0.01em', ...ink }, '4 · Said');
  const noX = x0 + fmR * 2 + u(26) + fSaid.offsetWidth + saidSz * 0.24;
  const fNo = text(pg, 'no.', { left: `${noX}px`, top: `${sy}px`, fontSize: `${saidSz}px`, fontStyle: 'italic', fontWeight: '600', letterSpacing: '-0.01em', ...ink }, '4 · No');
  const noW = fNo.offsetWidth;
  // red pencil loop around "no." — the one red pencil mark of the page (red pencil = the decisive mark)
  const noCx = noX + noW * 0.5, noCy = sy + saidSz * 0.6;
  const noLoop = stroke(ov, pencilLoop(noCx, noCy, noW * 0.68, saidSz * 0.5, 71, 24, -4), { color: C.red, width: u(4.2), filter: fx.graphite, name: '4 · Red pencil loop "no."' });

  // forty years: 1962 ——— 2002, a pencil bracket, "40 years"
  const ly = P ? sy + saidSz * 1.6 : sy + saidSz * 0.92;
  const lx0 = P ? x0 + fmR * 2 + u(30) : Math.round(W * 0.6), lx1 = x1;
  const yA = text(pg, '1962', { left: `${lx0}px`, top: `${ly}px`, fontSize: `${u(54)}px`, fontFeatureSettings: '"kern","lnum","tnum"', ...ink }, '4 · Year 1962');
  const yB = text(pg, '2002', { top: `${ly}px`, fontSize: `${u(54)}px`, fontFeatureSettings: '"kern","lnum","tnum"', ...ink }, '4 · Year 2002');
  yB.style.left = `${lx1 - yB.offsetWidth}px`;
  const gapA = lx0 + yA.offsetWidth + u(22), gapB = lx1 - yB.offsetWidth - u(22), lineY = ly + u(32);
  const span = el('div', { 'data-name': '4 · Forty-year line', style: { position: 'absolute', left: `${gapA}px`, top: `${lineY}px`, width: `${gapB - gapA}px`, height: `${Math.max(1, u(2))}px`, background: C.ink, transformOrigin: '0 50%' } }, pg);
  const yearTicks = [];
  for (let i = 1; i < 4; i++) yearTicks.push(el('div', { 'data-name': `4 · Decade tick ${i}`, style: { position: 'absolute', left: `${gapA + (gapB - gapA) * i / 4}px`, top: `${lineY - u(7)}px`, width: `${Math.max(1, u(1.5))}px`, height: `${u(16)}px`, background: C.ink } }, pg));
  const brY = lineY + u(30);
  const bracket = stroke(ov, smooth([[gapA, brY - u(10)], [gapA + u(6), brY], [(gapA + gapB) / 2 - u(14), brY + u(2)], [(gapA + gapB) / 2, brY + u(14)], [(gapA + gapB) / 2 + u(14), brY + u(2)], [gapB - u(6), brY + u(1)], [gapB, brY - u(9)]]), { width: u(3), filter: fx.graphite, name: '4 · Pencil bracket' });
  const forty = hand(pg, '40 years', { size: u(38), seed: 81, filter: fx.graphite, style: { top: `${brY + u(24)}px`, transform: 'rotate(-2deg)' }, name: '4 · Pencil 40 years' });
  forty.box.style.left = `${(gapA + gapB) / 2 - forty.box.offsetWidth / 2}px`;
  const told = text(pg, 'name made public at the havana conference, oct. 2002', { left: `${lx0}px`, top: `${brY + u(96)}px`, fontFamily: F.mono, fontSize: `${u(21)}px`, color: C.pencil }, '4 · Source line 2002');
  if (!P) told.style.left = `${lx1 - told.offsetWidth}px`;

  // the dive hairline: from the ✱ in row 3 straight down, a rounded corner, then left to the footnote ✱
  const rc = u(22);
  const dropBottom = fmY - fmR * 1.7;
  // the hairline turns at the foot and BECOMES the footnote rule (one line, one gesture)
  const ruleEnd = Math.max(mX, x0 + (x1 - x0) * 0.3);
  // portrait: the mark column sits on the left margin, so the line turns RIGHT into the rule and the ✱ lands under the corner
  const hairD = P
    ? `M ${mX} ${mY + mR * 1.4} L ${mX} ${FR - rc} Q ${mX} ${FR} ${mX + rc} ${FR} L ${x0 + (x1 - x0) * 0.42} ${FR}`
    : `M ${mX} ${mY + mR * 1.4} L ${mX} ${FR - rc} Q ${mX} ${FR} ${mX - rc} ${FR} L ${x0} ${FR}`;
  void dropBottom; void ruleEnd;
  const hair = stroke(ov, hairD, { color: C.red, width: Math.max(1.5, u(2)), name: '4 · Dive hairline', cap: 'butt' });

  // ---------- camera ----------
  const viewA = { cx: W / 2, cy: H / 2 };
  // portrait: the page scrolls down to the table when the voice gets to it (torpedo stays in view above)
  const tblMid = (by0 + r0 + 3 * rowH + u(50)) / 2;
  const viewA2cy = P ? tblMid - (L.safe.y + L.safe.h / 2) + H / 2 : H / 2;
  const viewB = { cx: W / 2, cy: FR - H * (P ? 0.27 : 0.24) + H / 2 };
  const dive = { mark: T.yes + 0.62, drop0: T.yes + 0.82, drop1: T.yes + 0.82 + 0.53, cam0: T.yes + 0.88, cam1: T.yes + 0.88 + 1.15 };
  const gr = grain(root, L, 0.055);
  // everything above the footnote: hidden once the camera has fully left it (keeps the frame list honest for lint/studio)
  const upper = [...pg.querySelectorAll('[data-name]')].filter(n => !(n instanceof SVGElement) && !n.dataset.name.startsWith('4 ·'))
    .map(n => { const op = n.offsetParent; return { n, top: n.offsetTop + (op && op !== pg ? op.offsetTop : 0) }; })
    .filter(o => o.top < FR - u(40));
  // portrait scroll: text that slides up under the platform's top UI band is taken off the page (no half-hidden captions)

  return {
    T, dive,
    update(g) {
      gr.update(g);
      const lt = g - S3;
      // slide in over the previous page (move token, 15 f) + cast-shadow edge
      const sl = 1 - tok.move(progress(lt, 0, 0.5));
      const off = sl * W;
      // camera: creep on view A → dive (smootherstep, 34 f) → creep on view B; slight breath out mid-dive
      const k = smootherstep(progress(g, dive.cam0, dive.cam1));
      const sA = creep(lt, 0.035), sB = creep(g - dive.cam1, 0.03);
      const s = (sA + (sB - sA) * k) * (1 - 0.045 * Math.sin(Math.PI * k));
      const cxx = viewA.cx + (viewB.cx - viewA.cx) * k - off / s;
      const aCy = viewA.cy + (viewA2cy - viewA.cy) * smootherstep(progress(g, T.fire - 0.15, T.fire + 0.85));
      const cyy = aCy + (viewB.cy - aCy) * k;
      camera(pg, L, cxx, cyy, s, true);
      upper.forEach(({ n, top }) => {
        const scrY = H / 2 + (top - cyy) * s;
        const gone = k >= 0.999 || (P && scrY < L.safe.y - u(4)) ? 'hidden' : '';
        if (n.style.visibility !== gone) n.style.visibility = gone;
      });
      edge.style.left = `${off - u(60)}px`; edge.style.opacity = sl > 0 ? '1' : '0';

      const press = (node, a, d = 0.5) => { const q = at(g, a, a + d); node.style.opacity = String(q); node.style.transform = `translateY(${(1 - q) * u(10)}px)`; };
      // 3A
      press(kick, T.on - 0.1);
      press(hero, T.nuclear - 0.1);
      body.set(at(g, T.nuclear, T.nuclear + 0.7, tok.move));
      fins.set(at(g, T.nuclear + 0.35, T.nuclear + 0.9, tok.move));
      seam.set(at(g, T.torpedo + 0.1, T.torpedo + 0.3));
      hatch.setAttribute('opacity', String(0.55 * at(g, T.torpedo + 0.15, T.torpedo + 0.6)));
      whTick.set(at(g, T.torpedo + 0.35, T.torpedo + 0.6));
      whNote.set(progress(g, T.torpedo + 0.5, T.torpedo + 1.0));
      press(cap4, T.torpedo + 0.25); press(src4, T.torpedo + 0.45);
      // 3B — table draws itself as the voice reaches "three officers"
      press(tTitle, T.fire - 0.12);
      topRule.style.transform = `scaleX(${at(g, T.fire, T.fire + 0.5, tok.move)})`;
      [hdA, hdB].forEach((h, i) => { h.style.opacity = String(at(g, T.fire + 0.25 + i * 0.08, T.fire + 0.6 + i * 0.08)); });
      midRule.style.transform = `scaleX(${at(g, T.fire + 0.2, T.fire + 0.7, tok.move)})`;
      rows.forEach((r, i) => {
        const a = T.three - 0.08 + i * 0.16;
        press(r.nm, a); press(r.post, a + 0.08); r.num.style.opacity = String(at(g, a, a + 0.4));
        r.rl.style.transform = `scaleX(${at(g, a, a + 0.55, tok.move)})`;
      });
      botRule.style.transform = `scaleX(${at(g, T.three + 0.3, T.three + 0.85, tok.move)})`;
      press(srcT, T.agree);
      ticks.forEach((tk, i) => tk.set(at(g, T.two - 0.05 + i * 0.32, T.two + 0.2 + i * 0.32, tok.move)));
      yesN.forEach((y, i) => y.set(progress(g, T.yes - 0.12 + i * 0.2, T.yes + 0.25 + i * 0.2)));
      // the dive
      placeMark(m, mX, mY, g - dive.mark);
      seeNote.style.opacity = String(at(g, dive.mark + 0.15, dive.mark + 0.5));
      const hp = tok.drop(progress(g, dive.drop0, dive.drop1));
      hair.set(hp);
      if (hp > 0) hair.node.style.opacity = String(1 - 0.35 * progress(g, dive.cam1 + 0.3, dive.cam1 + 1.0)); // settles to a quiet hairline
      placeMark(fm, fmX, fmY, g - (dive.drop1 - 0.03), { spin: 18 });
      press(fName, T.vasili - 0.08, 0.45);
      press(fMeta, T.arkhipov + 0.3);
      press(fSaid, T.no - 0.45, 0.4);
      press(fNo, T.no - 0.2, 0.24); // lands on the word, quicker than the rest: the one hard beat
      noLoop.set(at(g, T.no + 0.18, T.no + 0.68, tok.move));
      // forty years later
      press(yA, T.world - 0.08);
      span.style.transform = `scaleX(${at(g, T.forty - 0.1, T.forty + 0.6, tok.move)})`;
      yearTicks.forEach((tk, i) => { tk.style.opacity = at(g, T.forty - 0.1, T.forty + 0.6, tok.move) >= (i + 1) / 4 ? '1' : '0'; });
      press(yB, T.later - 0.07);
      bracket.set(at(g, T.forty + 0.3, T.forty + 0.65, tok.move));
      forty.set(progress(g, T.forty + 0.55, T.forty + 1.1));
      press(told, T.later + 0.3);
    },
  };
}
