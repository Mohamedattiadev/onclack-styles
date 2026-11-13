// 2 · EVIDENCE PLATE — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// The real photo as a tipped-in plate (EV, untouched, captioned honestly: it was taken the day AFTER).
// Beside it our section diagram (VO, labelled): ships on the surface, charges falling, the ✱ deep below.
// Then "Moscow" and a hairline that keeps growing = days of silence.
import { el, svg, rand } from '/onclack-styles/engine/lib/anim.js';
import { creep } from '/onclack-styles/engine/lib/spring.js';
import { C, F, tok, at, page, chrome, camera, text, sc, mark, placeMark, filters, grain, stroke, pencilLoop, pencilLine, smooth, hand, progress, clamp, fontsReady } from '../shared/kit.js';

export default async function (root, ctx) {
  await fontsReady();
  const L = ctx.layout, W = L.width, H = L.height, P = L.portrait, u = L.px;
  const S = ctx.start; const lt = g => g - S;
  const fx = filters(root, 's2', L);
  // shadow the incoming page casts on the outgoing one (key light upper-left → shadow falls left of the edge as it slides)
  const edge = el('div', { 'data-name': 'Page edge shadow', style: { position: 'absolute', top: '0', width: `${u(60)}px`, height: `${H}px`,
    background: 'linear-gradient(to left, rgba(35,30,32,0.20), rgba(35,30,32,0))' } }, root);
  const pg = page(root, L, { w: W, h: H, seed: 8, name: '2 · Page' });
  const ink = { filter: fx.ink };

  const x0 = P ? L.safe.x + u(14) : Math.round(W * 0.075), x1 = P ? L.safe.x + L.safe.w - u(18) : Math.round(W * 0.935); // portrait: 18 px inside safe so the hold creep never pushes text out
  chrome(pg, L, { left: 'the arkhipov footnote', right: '§ 2 · the surface', top: P ? L.safe.y + u(26) : L.safe.y + u(4), x0, x1 });

  // ---------- Fig. 2 — the photograph, tipped in ----------
  const pw = P ? x1 - x0 - u(44) : u(820), ph = Math.round(pw * 734 / 948), mt = u(22);
  const px0 = x0, py0 = P ? Math.round(H * 0.115) : Math.round(H * 0.15);
  const mount = el('div', { 'data-name': '2A · Fig. 2 plate (mount)', style: {
    position: 'absolute', left: `${px0}px`, top: `${py0}px`, width: `${pw + mt * 2}px`, height: `${ph + mt * 2}px`, background: C.plate,
    boxShadow: `${u(1)}px ${u(2)}px ${u(3)}px rgba(32,28,30,0.30), ${u(10)}px ${u(16)}px ${u(34)}px rgba(40,38,48,0.16)` } }, pg);
  const photoWrap = el('div', { style: { position: 'absolute', left: `${mt}px`, top: `${mt}px`, width: `${pw}px`, height: `${ph}px`, overflow: 'hidden' } }, mount);
  const photo = el('img', { src: ctx.asset('assets/b59-surfaced-1962.jpg'), 'data-name': '2A · Photo B-59 (U.S. Navy, PD)', style: {
    position: 'absolute', left: '0', top: '0', width: `${pw}px`, height: `${ph}px`, transformOrigin: '47% 57%' } }, photoWrap);
  // our red pencil on the evidence (Marginalia layer): a loose loop round the hull + "B-59" in the sky.
  // The photo stays untouched underneath; the pencil lives in its own SVG on the page.
  const evOv = svg('svg', { width: W, height: H, style: { position: 'absolute', left: '0', top: '0', overflow: 'visible' }, 'data-name': '2A · Red pencil layer' }, pg);
  const pX = f => px0 + mt + pw * f, pY = f => py0 + mt + ph * f;
  const subLoop = stroke(evOv, pencilLoop(pX(0.405), pY(0.585), pw * 0.36, ph * 0.105, 17, 22, -5), { color: C.red, width: u(4), filter: fx.graphite, name: '2A · Red pencil loop B-59' });
  const subNote = hand(pg, 'B-59', { size: u(P ? 44 : 42), seed: 23, color: C.red, filter: fx.graphite, name: '2A · Red pencil B-59',
    style: { left: `${pX(0.17)}px`, top: `${pY(0.31)}px`, transform: 'rotate(-6deg)' } });
  const subTick = stroke(evOv, pencilLine([pX(0.255), pY(0.405)], [pX(0.33), pY(0.475)], 29, 0.08), { color: C.red, width: u(3.4), filter: fx.graphite, name: '2A · Red pencil tick' });
  const capY = py0 + ph + mt * 2 + u(28);
  text(pg, '<i>Fig. 2.</i>&ensp;B-59 forced to the surface, 28–29 October 1962.', { left: `${px0}px`, top: `${capY}px`, fontSize: `${u(P ? 34 : 32)}px`, ...ink }, '2A · Caption');
  text(pg, 'u.s. navy photograph · national archives 428-n-711200', { left: `${px0}px`, top: `${capY + u(46)}px`, fontFamily: F.mono, fontSize: `${u(P ? 23 : 22)}px`, color: C.pencil }, '2A · Source line');

  // ---------- Fig. 3 — section diagram (ours) ----------
  const dx0 = P ? x0 : Math.round(W * 0.575), dx1 = x1;
  const dy0 = P ? capY + u(130) : Math.round(H * 0.17), dh = P ? u(290) : u(450);
  const dw = dx1 - dx0;
  const kick = text(pg, sc('above it'), { left: `${dx0}px`, top: `${dy0}px`, fontSize: `${u(40)}px`, ...ink }, '2B · Kicker');
  const ds = svg('svg', { width: dw, height: dh, style: { position: 'absolute', left: `${dx0}px`, top: `${dy0 + u(60)}px`, overflow: 'visible' }, 'data-name': '2B · Section diagram' }, pg);
  const surfY = u(70);
  // sea surface: a hand-inked gentle wave
  const wpts = []; for (let i = 0; i <= 40; i++) wpts.push([i / 40 * dw, surfY + Math.sin(i * 1.1) * u(2.2) + (rand(i * 3.1) - 0.5) * u(1.2)]);
  svg('path', { d: smooth(wpts), fill: 'none', stroke: C.ink, 'stroke-width': u(2.4), filter: fx.ink, 'data-name': '2B · Sea surface' }, ds);
  // depth hatching (engraver's horizontal lines, getting sparser with depth)
  const hg = svg('g', { stroke: C.ink, 'stroke-width': u(1.3), opacity: 0.22 }, ds);
  for (let i = 1, y = surfY + u(16); y < dh; i++, y += u(10) + i * u(2.2)) svg('line', { x1: u(8) + rand(i) * u(30), y1: y, x2: dw - u(8) - rand(i * 2) * u(30), y2: y }, hg);
  // three ships (simple inked hull profiles)
  const shipX = [0.2, 0.5, 0.8].map(f => f * dw);
  const ships = shipX.map((x, i) => {
    const g = svg('g', { 'data-name': `2B · Ship ${i + 1}`, filter: fx.ink }, ds);
    const s = u(1);
    svg('path', { d: `M ${x - 46 * s} ${surfY - 1} L ${x + 50 * s} ${surfY - 1} L ${x + 40 * s} ${surfY - 12 * s} L ${x - 40 * s} ${surfY - 12 * s} Z
      M ${x - 14 * s} ${surfY - 12 * s} L ${x - 14 * s} ${surfY - 24 * s} L ${x + 8 * s} ${surfY - 24 * s} L ${x + 8 * s} ${surfY - 12 * s} Z
      M ${x - 4 * s} ${surfY - 24 * s} L ${x - 4 * s} ${surfY - 36 * s} L ${x - 1 * s} ${surfY - 36 * s} L ${x - 1 * s} ${surfY - 24 * s} Z`, fill: C.ink }, g);
    return g;
  });
  const shipLab = text(pg, 'u.s. navy ships', { top: `${dy0 + u(60) + surfY - u(78)}px`, fontFamily: F.mono, fontSize: `${u(24)}px`, color: C.pencil }, '2B · Label ships');
  shipLab.style.left = `${dx1 - shipLab.offsetWidth}px`;
  // the submarine = ✱, deep
  const subX = dx0 + dw * 0.56, subY = dy0 + u(60) + dh * 0.86;
  const m = mark(pg, u(26), { name: '2B · ✱ B-59 (deep)' });
  // charges: dark capsules falling from ships, a pencil ring where each goes off
  const charges = [0, 1, 2].map(i => {
    const x = shipX[i] + (i - 1) * u(-18) + u(10);
    const c = svg('rect', { width: u(9), height: u(15), rx: u(3), fill: C.ink, 'data-name': `2B · Charge ${i + 1}` }, ds);
    const burstY = dh * (0.52 + 0.1 * rand(i * 4.2));
    const ring = stroke(ds, pencilLoop(x, burstY, u(26), u(20), 20 + i, 30), { width: u(2.6), filter: fx.graphite, name: `2B · Burst ${i + 1}` });
    const ring2 = stroke(ds, pencilLoop(x, burstY, u(46), u(36), 40 + i, 20), { width: u(2), filter: fx.graphite, name: `2B · Burst outer ${i + 1}` });
    return { x, burstY, c, ring, ring2 };
  });
  const dLabel = hand(pg, 'practice charges', { size: u(P ? 34 : 34), seed: 12, filter: fx.graphite,
    style: { left: `${dx0 + charges[0].x - u(30)}px`, top: `${dy0 + u(60) + charges[0].burstY + u(62)}px`, transform: 'rotate(-3deg)' } });
  text(pg, '<i>Fig. 3.</i>&ensp;Section, not to scale — our diagram.', { left: `${dx0}px`, top: `${dy0 + u(60) + dh + u(22)}px`, fontSize: `${u(26)}px`, color: C.pencil }, '2B · Caption');

  // ---------- Moscow: a name and a growing silence ----------
  const my = P ? dy0 + u(60) + dh + u(66) : Math.round(H * 0.79);
  const mos = text(pg, 'Moscow', { left: `${dx0}px`, top: `${my}px`, fontSize: `${u(P ? 78 : 62)}px`, fontStyle: 'italic', letterSpacing: '-0.01em', ...ink }, '2C · Moscow');
  const lineX0 = dx0 + mos.offsetWidth + u(24), lineX1 = dx1, lineY = my + u(P ? 52 : 42);
  const sil = el('div', { 'data-name': '2C · Silence line', style: { position: 'absolute', left: `${lineX0}px`, top: `${lineY}px`, width: `${lineX1 - lineX0}px`, height: `${u(2)}px`, background: C.ink, transformOrigin: '0 50%' } }, pg);
  const ticks = [1, 2, 3, 4].map(i => el('div', { 'data-name': `2C · Day tick ${i}`, style: { position: 'absolute', left: `${lineX0 + (lineX1 - lineX0) * (i / 4.4)}px`, top: `${lineY - u(9)}px`, width: `${u(2)}px`, height: `${u(20)}px`, background: C.ink } }, pg));
  const nw = text(pg, 'no word, for days', { top: `${lineY + u(18)}px`, fontFamily: F.mono, fontSize: `${u(24)}px`, color: C.pencil }, '2C · No word');
  nw.style.left = `${lineX1 - nw.offsetWidth}px`;

  // sound: two muffled depth-charge thuds (one on the first burst, one alone in the silence after "days")
  const T = { above: lt(7.559), ships: lt(8.629), drop: lt(8.949), charges: lt(10.049), moscow: lt(10.949), silent: lt(11.929), days: lt(12.489) };
  const fall = 0.72, dropAt = i => T.drop - 0.05 + i * 0.16;
  ctx.sfx('boom-distant-01', dropAt(0) + fall + 0.02, { volume: 0.42 });
  ctx.sfx('boom-distant-01', T.days + 0.55, { volume: 0.3 });

  const gr = grain(root, L, 0.055);

  return {
    update(t, p, g) {
      gr.update(g ?? S + t);
      // slide in (move token, 15 f) — the new page arrives over the old one
      const sl = 1 - tok.move(progress(t, 0, 0.5));
      const off = sl * W;
      // camera: slow creep toward the plate, page offset during the slide
      const s = creep(t, 0.04);
      camera(pg, L, W / 2 - off / s, H / 2, s, sl > 0 || true);
      edge.style.left = `${off - u(60)}px`; edge.style.opacity = sl > 0 ? '1' : '0';
      // photo is never zoomed (evidence untouched); the page camera creeps instead
      subLoop.set(at(t, T.above + 0.15, T.above + 0.65, tok.move));
      subNote.set(progress(t, T.above + 0.55, T.above + 1.0));
      subTick.set(at(t, T.above + 0.95, T.above + 1.15));

      const press = (node, a) => { const q = at(t, a, a + 0.5); node.style.opacity = String(q); node.style.transform = `translateY(${(1 - q) * u(10)}px)`; };
      press(kick, T.above - 0.1);
      ships.forEach((s2, i) => { const q = at(t, T.ships - 0.1 + i * 0.1, T.ships + 0.4 + i * 0.1); s2.setAttribute('opacity', q); s2.setAttribute('transform', `translate(0 ${(1 - q) * u(8)})`); });
      placeMark(m, subX, subY, t - (T.above + 0.25), { spin: -12 });

      charges.forEach((c, i) => {
        const a = dropAt(i), q = clamp((t - a) / fall), y = surfY + (c.burstY - surfY) * q * q; // gravity: ease-in
        c.c.setAttribute('x', c.x - u(4.5)); c.c.setAttribute('y', y - u(7.5));
        c.c.setAttribute('opacity', t >= a && q < 1 ? 1 : 0);
        c.ring.set(at(t, a + fall, a + fall + 0.3));
        c.ring2.set(at(t, a + fall + 0.08, a + fall + 0.45));
        const fade = 1 - 0.55 * progress(t, a + fall + 1.2, a + fall + 2.2); // rings settle back, stay as marks
        c.ring.node.style.opacity = t > a + fall ? fade : 0; c.ring2.node.style.opacity = t > a + fall + 0.08 ? fade * 0.8 : 0;
      });
      dLabel.set(progress(t, dropAt(0) + fall + 0.3, dropAt(0) + fall + 1.1));

      press(mos, T.moscow - 0.08);
      // the silence grows at a constant, unhurried rate (drift) from "silent" to after "days"
      const gp = progress(t, T.moscow + 0.35, T.days + 0.4);
      sil.style.transform = `scaleX(${gp})`;
      ticks.forEach((tk, i) => { tk.style.opacity = gp >= (i + 1) / 4.4 ? '1' : '0'; });
      nw.style.opacity = String(at(t, T.days - 0.05, T.days + 0.4));
    },
  };
}
