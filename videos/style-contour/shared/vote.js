// THE VOTE PANEL — shared by scene 3 (torpedo, three officers, two yes) and scene 4 (the third says no).
// One pure function of GLOBAL time, so the panel continues across the cut without a jump.
// Side code: Soviet "yes" marks = signal orange (fill); Arkhipov's "no" = INK — he steps outside the two-side code.
// People: no faces (no licensed photo checked) → initials in circles + role + dates ("data portraits").
import { el, svg, clamp, progress, lerp } from '/onclack-styles/engine/lib/anim.js';
import { C, LW, P, wordAt, LEAD, enterP, exitP, life, tok, makeCamera } from './contour.js';

export function buildVote(root, ctx) {
  const L = ctx.layout, px = L.px, s = L.safe, u = L.unit;
  const cam = makeCamera(L, ctx.words);
  const wt = (w, n) => wordAt(ctx.words, w, n);
  const T = {
    on: wt('On') - LEAD, torp: wt('nuclear') - LEAD, rule: wt('three') - LEAD, need: wt('agree') - LEAD,
    yes1: wt('Two') - LEAD, yes2: wt('yes') - LEAD, third: wt('third') - LEAD, name: wt('Vasili') - LEAD,
    no: wt('no') - LEAD, out: wt('world') - 0.05,
  };

  // ----- layout -----
  const portrait = L.portrait;
  const P0 = portrait ? { x: s.x, y: L.height * 0.385 } : { x: L.width * 0.445, y: s.y + s.h * 0.1 };
  const PW = portrait ? s.w : s.x + s.w - P0.x;
  const R = px(54), gap = portrait ? px(288) : px(240);
  const rowCircles = portrait ? px(330) : px(330);
  const cx0 = P0.x + R + px(portrait ? 22 : 8);

  const panel = el('div', { 'data-name': '3A Vote panel', style: { position: 'absolute', inset: 0 } }, root);
  const g = svg('svg', { width: L.width, height: L.height, style: { position: 'absolute', inset: 0, overflow: 'visible' } }, panel);
  const at = (e, x, y) => { e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; };

  // leader line: boat → panel (pinned, 1.5 px ink, dot on the boat)
  const leader = svg('path', { stroke: C.ink, 'stroke-width': LW.hair * u, fill: 'none', 'data-name': '3A Leader line' }, g);
  const pin = svg('circle', { r: px(5), fill: C.ink }, g);

  const kicker = el('div', { class: 'kicker ov', 'data-name': '3A Kicker' }, panel, 'On board B-59');

  // torpedo (side profile, schematic): ink outline, warhead section in orange
  const tl = portrait ? px(330) : px(300), th = px(30);
  const torp = svg('g', { 'data-name': '3A Torpedo (schematic)' }, g);
  svg('path', { d: `M0 ${-th / 2}H${tl - th * 1.6}C${tl - th * 0.4} ${-th / 2} ${tl} ${-th * 0.25} ${tl} 0C${tl} ${th * 0.25} ${tl - th * 0.4} ${th / 2} ${tl - th * 1.6} ${th / 2}H0Z`,
    fill: C.bone, stroke: C.ink, 'stroke-width': LW.line * u }, torp);
  svg('path', { d: `M${tl - th * 3.2} ${-th / 2}H${tl - th * 1.6}C${tl - th * 0.4} ${-th / 2} ${tl} ${-th * 0.25} ${tl} 0C${tl} ${th * 0.25} ${tl - th * 0.4} ${th / 2} ${tl - th * 1.6} ${th / 2}H${tl - th * 3.2}Z`,
    fill: C.signal, stroke: C.ink, 'stroke-width': LW.line * u }, torp);
  svg('path', { d: `M0 ${-th / 2}L${-px(16)} ${-th}M0 ${th / 2}L${-px(16)} ${th}M${-px(16)} ${-th}V${th}`, stroke: C.ink, 'stroke-width': LW.line * u, fill: 'none' }, torp);
  const tName = el('div', { class: 'vote-h ov', 'data-name': '3A Nuclear torpedo title', style: portrait ? {} : { fontSize: px(70) + 'px' } }, panel, 'Nuclear torpedo');
  const tSub = el('div', { class: 'vote-sub ov', 'data-name': '3A Torpedo note' }, panel);
  tSub.innerHTML = 'T-5 <span class="dim">· one aboard · warhead</span> <span style="display:inline-block;width:0.7em;height:0.7em;background:#D9541A"></span>';

  const rule = svg('path', { stroke: C.ink, 'stroke-width': LW.line * u, fill: 'none' }, g);
  const need = el('div', { class: 'vote-sub ov', 'data-name': '3B Rule: three must agree' }, panel);
  need.innerHTML = 'To fire: <b style="font-weight:500">all three</b> must agree';

  const people = [
    { ini: 'VS', name: 'Savitsky', role: 'commander' },
    { ini: 'IM', name: 'Maslennikov', role: 'political officer' },
    { ini: '?', name: 'the third', role: '' },
  ].map((o, i) => {
    const c = svg('circle', { r: R, 'stroke-width': LW.line * u, 'data-name': `3B Officer ${i + 1} circle` }, g);
    const ini = el('div', { class: 'initials ov', 'data-name': `3B Officer ${i + 1} initials`, style: { width: R * 2 + 'px', height: R * 2 + 'px' } }, panel, o.ini);
    const nm = el('div', { class: 'who ov', 'data-name': `3B Officer ${i + 1} name` }, panel, o.name);
    const rl = el('div', { class: 'role ov', 'data-name': `3B Officer ${i + 1} role` }, panel, o.role);
    const vd = el('div', { class: 'verdict ov', 'data-name': `3B Officer ${i + 1} verdict` }, panel, i < 2 ? 'YES' : '');
    return { ...o, c, ini, nm, rl, vd, i };
  });
  const ring3 = svg('circle', { r: R + px(10), fill: 'none', stroke: C.ink, 'stroke-width': LW.hair * u, 'stroke-dasharray': `${px(5)} ${px(7)}`, 'data-name': '4A Waiting ring' }, g);
  const tally = el('div', { class: 'tally ov', 'data-name': '3C Tally 2 of 3' }, panel);
  const caveat = el('div', { class: 'card-note ov', 'data-name': '3C Caveat (sources)' }, panel, 'from later accounts · details debated');

  // scene 4: the person and the word
  const pname = el('div', { class: 'pname ov', 'data-name': '4A Name · Vasili Arkhipov' }, panel, 'Vasili Arkhipov');
  const pmeta = el('div', { class: 'vote-sub ov', 'data-name': '4A Arkhipov dates + role' }, panel);
  pmeta.innerHTML = '1926–1998 <span class="dim">· flotilla chief of staff</span>';
  const noW = el('div', { class: 'no-word ov', 'data-name': '4B NO' }, panel, 'No.');

  return function update(gt) {
    const all = 1 - exitP(gt, T.out, 12);
    panel.style.opacity = all.toFixed(3);
    panel.style.display = all <= 0.002 || gt < T.on - 0.05 ? 'none' : '';
    if (panel.style.display === 'none') return;
    const cm = cam(gt);
    const [bx, by] = cm.projectLL(P.sub);

    // rows (y positions)
    const yK = P0.y, yT = P0.y + px(70), yR = yT + px(portrait ? 230 : 150), yC = yR + px(150) + R;
    // kicker
    const eK = enterP(gt, T.on, 14);
    kicker.style.opacity = eK.toFixed(3); at(kicker, P0.x, yK - (1 - eK) * px(10));
    // torpedo row
    const eT = enterP(gt, T.torp, 18);
    const tx = portrait ? P0.x + px(20) : P0.x + px(20), ty = portrait ? yT + px(30) : yT + px(48);
    torp.setAttribute('transform', `translate(${(tx + (1 - eT) * -px(40)).toFixed(1)} ${ty.toFixed(1)})`);
    torp.setAttribute('opacity', eT.toFixed(3));
    const nx = portrait ? P0.x : tx + tl + px(44), ny = portrait ? ty + px(46) : yT;
    tName.style.opacity = enterP(gt, T.torp + 0.08, 16).toFixed(3); at(tName, nx, ny + (1 - enterP(gt, T.torp + 0.08, 16)) * px(14));
    tSub.style.opacity = enterP(gt, T.torp + 0.3, 14).toFixed(3); at(tSub, nx, ny + px(92));
    // leader: boat → torpedo tail; in scene 4 it re-pins to the third circle (move token)
    const c3x = cx0 + 2 * gap;
    const re = 0;
    const lx = lerp(tx - px(26), c3x - R * Math.SQRT1_2, re), ly = lerp(ty, yC - R * Math.SQRT1_2, re);
    const lp = tok.enter(progress(gt, T.on + 0.1, T.on + 0.6));
    const sx0 = bx + (portrait ? 0 : px(40)), sy0 = by + (portrait ? px(28) : 0);
    leader.setAttribute('d', `M${sx0} ${sy0}L${lerp(sx0, lx, lp)} ${lerp(sy0, ly, lp)}`);
    pin.setAttribute('cx', sx0); pin.setAttribute('cy', sy0); pin.setAttribute('opacity', lp > 0 ? 1 : 0);
    leader.setAttribute('opacity', (1 - 0.0) * (lp > 0 ? 1 : 0));

    // the rule
    const eR = tok.enter(progress(gt, T.rule, T.rule + 0.5));
    rule.setAttribute('d', `M${P0.x} ${yR}H${P0.x + PW * eR}`);
    need.style.opacity = enterP(gt, T.rule + 0.15, 14).toFixed(3); at(need, P0.x, yR + px(16));

    // circles: appear one by one on "three officers" (stagger 3 f)
    const yes = [T.yes1, T.yes2];
    const dimOthers = tok.move(progress(gt, T.third, T.third + 0.5));
    for (const pp of people) {
      const e = enterP(gt, wt('officers') - LEAD + pp.i * 0.1, 14);
      const x = cx0 + pp.i * gap;
      let r = R * (0.85 + 0.15 * e);
      const isThird = pp.i === 2;
      const yv = !isThird ? enterP(gt, yes[pp.i], 10) : 0;
      const noP = isThird ? enterP(gt, T.no, 10) : 0;
      if (isThird) r *= 1 + 0.18 * tok.move(progress(gt, T.third, T.third + 0.6));
      pp.c.setAttribute('cx', x); pp.c.setAttribute('cy', yC); pp.c.setAttribute('r', r.toFixed(2));
      pp.c.setAttribute('fill', isThird ? (noP > 0.5 ? C.ink : C.bone) : yv > 0.5 ? C.signal : C.bone);
      pp.c.setAttribute('stroke', C.ink);
      pp.c.setAttribute('opacity', (e * (isThird ? 1 : 1 - 0.6 * dimOthers)).toFixed(3));
      // a "yes" lands as a quick fill punch (scale 1.08 → 1)
      if (!isThird && yv > 0 && yv < 1) pp.c.setAttribute('r', (r * (1 + 0.08 * Math.sin(yv * Math.PI))).toFixed(2));
      if (isThird && noP > 0 && noP < 1) pp.c.setAttribute('r', (r * (1 + 0.06 * Math.sin(noP * Math.PI))).toFixed(2));
      // initials
      const showVA = isThird && gt >= T.name;
      if (isThird) pp.ini.textContent = showVA ? 'VA' : '?';
      pp.ini.style.color = isThird && noP > 0.5 ? C.bone : C.ink;
      pp.ini.style.fontSize = px(isThird && !showVA ? 52 : 40) + 'px';
      pp.ini.style.opacity = (e * (isThird ? (showVA ? enterP(gt, T.name, 10) : 1) : 1 - 0.6 * dimOthers)).toFixed(3);
      at(pp.ini, x - R, yC - R);
      // labels under the circle
      const lo = e * (1 - tok.move(progress(gt, T.third, T.third + 0.3)));
      pp.nm.style.opacity = lo.toFixed(3); at(pp.nm, x - pp.nm.offsetWidth / 2, yC + R + px(18));
      pp.rl.style.opacity = lo.toFixed(3); at(pp.rl, x - pp.rl.offsetWidth / 2, yC + R + px(62));
      pp.vd.style.opacity = (yv * (1 - 0.6 * dimOthers)).toFixed(3);
      pp.vd.innerHTML = isThird ? '' : '<span style="display:inline-block;width:0.6em;height:0.6em;background:#D9541A;margin-right:0.45em"></span>YES';
      at(pp.vd, x - pp.vd.offsetWidth / 2, yC - R - px(46) - (1 - yv) * px(8));
    }
    // waiting ring around the empty third circle: turns slowly (time-driven), gone on "no"
    const wr = enterP(gt, T.yes2, 14) * (1 - enterP(gt, T.no, 8));
    ring3.setAttribute('cx', c3x); ring3.setAttribute('cy', yC);
    ring3.setAttribute('r', (R * (1 + 0.18 * tok.move(progress(gt, T.third, T.third + 0.6))) + px(12)).toFixed(2));
    ring3.setAttribute('transform', `rotate(${(gt * 14).toFixed(2)} ${c3x} ${yC})`);
    ring3.setAttribute('opacity', wr.toFixed(3));

    // tally: "2 of 3" — the count that is not enough
    const yt = enterP(gt, T.yes2 + 0.2, 16) * (1 - exitP(gt, T.third - 0.1, 10));
    tally.innerHTML = `${gt >= T.yes2 ? 2 : gt >= T.yes1 ? 1 : 0} <span class="dim">of 3</span>`;
    tally.style.opacity = yt.toFixed(3);
    const tyY = portrait ? yC + R + px(130) : yC - px(50);
    at(tally, portrait ? P0.x : c3x + R + px(70), tyY + (1 - yt) * px(12));
    caveat.style.opacity = (enterP(gt, T.yes2 + 0.5, 14) * (1 - exitP(gt, T.third, 10))).toFixed(3);
    at(caveat, P0.x, portrait ? tyY + px(116) : yC + R + px(120));

    // scene 4: name card under the third circle, then the word
    const eN = enterP(gt, T.name, 16);
    pname.style.opacity = eN.toFixed(3);
    pmeta.style.opacity = enterP(gt, T.name + 0.25, 14).toFixed(3);
    const pny = yC + R + px(portrait ? 40 : 46);
    const cx = w => Math.min(P0.x + PW - w, Math.max(P0.x, c3x - w / 2));
    at(pname, portrait ? P0.x : cx(pname.offsetWidth), pny + (1 - eN) * px(14));
    at(pmeta, portrait ? P0.x : cx(pmeta.offsetWidth), pny + px(78));
    const eNo = gt >= T.no ? 1 : 0;
    const settle = tok.enter(progress(gt, T.no, T.no + 0.4));
    noW.style.opacity = eNo;
    noW.style.transformOrigin = '0 60%';
    if (portrait) noW.style.fontSize = px(210) + 'px';
    const noX = portrait ? P0.x - px(6) : c3x + R * 1.18 + px(40);
    const noY = portrait ? pny + px(130) : yC - noW.offsetHeight * 0.52;
    noW.style.transform = `translate(${noX.toFixed(1)}px, ${noY.toFixed(1)}px) scale(${(1.06 - 0.06 * settle).toFixed(4)})`;
    noW.style.letterSpacing = `${(-0.02 + 0.02 * (1 - progress(gt, T.no, T.no + 1.5))).toFixed(4)}em`;
    void clamp; void life;
  };
}
