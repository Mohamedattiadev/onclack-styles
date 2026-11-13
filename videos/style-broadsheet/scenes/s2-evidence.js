// Sheet A2 — EVIDENCE: the B-59 photo (halftone) + a section diagram of the practice depth charges + a Moscow brief.
// intent: KNOW US ships forced the sub, Moscow silent · FEEL pressure · SEE the real photo resolving from coarse dots
// truth: photo = EV (US Navy, 28–29 Oct 1962, NARA 428-N-711200; screened as a print process, nothing added);
//        section diagram = VO, labelled "not to scale"; Moscow brief = VO (set in our type).
import { el, svg, glide, fitText } from '/onclack-styles/engine/lib/anim.js';
import { INK, FONT, MISREG, F, ez, tw, wordT, grid, sheet, box, plate, press, applyPress, headStyle, labelStyle, captionStyle, inkDefs } from '../shared/press.js';
import { rand } from '/onclack-styles/engine/lib/anim.js';

export default async function (root, ctx) {
  const L = ctx.layout, G = grid(L);
  const S = sheet(root, ctx, { page: 2, folioRight: 'A2 · Atlantic', slideIn: true });
  const C = S.content;
  const fx = inkDefs(root, 's2');

  const img = new Image();
  img.src = ctx.asset('assets/b59-surfaced-1962.jpg');
  await img.decode();

  // ---- voice times (local)
  const tLand = 15 * F;                                   // sheet lands
  const tDrop = wordT(ctx, 'drop', 0, 1.74) - 2 * F;
  const tDepth = wordT(ctx, 'depth', 0, 2.58) - 2 * F;
  const tAmer = wordT(ctx, 'American', 0, 0.86) - 2 * F;
  const tShips = wordT(ctx, 'ships', 0, 1.42) - 2 * F;
  const tPrac = wordT(ctx, 'practice', 0, 2.07) - 2 * F;
  const tCharges = wordT(ctx, 'charges', 0, 2.84) - 2 * F;
  const tMoscow = wordT(ctx, 'Moscow', 0, 3.74) - 2 * F;
  const tSilent = wordT(ctx, 'silent', 0, 4.72) - 2 * F;
  const bursts = [tCharges + 0.22, tCharges + 0.55, tCharges + 0.8];
  // natural sound: two distant underwater thuds on the burst frames (no music, no tonal sounds)
  ctx.sfx('boom-distant-01', bursts[0] + 2 * F, { volume: 0.55 });
  ctx.sfx('boom-slapback-01', bursts[2] + 2 * F, { volume: 0.4 });

  // ---- layout
  const top = S.top + L.px(26);
  const R = L.pick({
    landscape: {
      photo: { x: G.x(0), y: top, w: G.w(8), h: L.px(796) },
      side: { x: G.x(8) + L.px(8), w: G.w(4) - L.px(8) },
    },
    portrait: {
      photo: { x: 0, y: top + L.px(196), w: L.width, h: L.px(560) },
      side: { x: L.safe.x, w: L.safe.w },
    },
  });

  // ---- headline (right column on 16:9, top on 9:16)
  const hSize = L.px(L.pick({ landscape: 172, portrait: 200 }));
  const headY = L.pick({ landscape: top + L.px(44), portrait: top });
  const kick = box(C, 'Kicker', R.side.x, L.pick({ landscape: top, portrait: top - L.px(4) }), R.side.w, null, labelStyle(L.px(26), { fontWeight: 800 }), 'Above B-59');
  if (L.portrait) kick.style.display = 'none';
  const head = box(C, 'Headline', R.side.x, headY, R.side.w, null, { ...headStyle(hSize), display: 'flex', flexDirection: L.landscape ? 'column' : 'row', columnGap: '0.16em', filter: fx.ink });
  const hw = [['American', tAmer], ['ships', tShips]].map(([w, at]) => ({ node: el('span', { 'data-name': `Headline word ${w}`, style: { display: 'inline-block' } }, head, w), at }));
  fitText(head, R.side.w);
  const headH = head.getBoundingClientRect().height;

  // ---- photo plate (EV): halftone 45°, resolves from coarse to fine as the sheet lands
  const P = R.photo;
  const photoBox = box(C, '2A Photo plate', P.x, P.y, P.w, P.h, { overflow: 'hidden', background: INK.paper });
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const ph = plate(photoBox, P.w, P.h, (g, w, h) => {
    // cover-crop, focused on the boat (fx .45, fy .58 of the frame)
    const s = Math.max(w / iw, h / ih) * L.pick({ landscape: 1.16, portrait: 1.12 });
    const dw = iw * s, dh = ih * s;
    const ox = Math.min(0, Math.max(w - dw, w * 0.5 - dw * 0.45)), oy = Math.min(0, Math.max(h - dh, h * 0.5 - dh * 0.55));
    // press contrast (a printer's levels, not retouching): lift paper white, deepen the sea
    g.filter = 'grayscale(1) contrast(1.5) brightness(1.04)';
    g.drawImage(img, ox, oy, dw, dh);
    g.filter = 'none';
  }, { name: 'Photo halftone', style: { left: 0, top: 0, transformOrigin: '45% 58%' } });
  if (L.landscape) box(photoBox, 'Plate frame', 0, 0, P.w, P.h, { boxShadow: `inset 0 0 0 ${Math.max(2, L.px(2))}px ${INK.black}` });

  const capY = P.y + P.h + L.px(12);
  const cap = box(C, '2A Photo caption', L.pick({ landscape: P.x, portrait: L.safe.x }), capY, L.pick({ landscape: P.w, portrait: L.safe.w }), null,
    captionStyle(L.px(L.pick({ landscape: 28, portrait: 28 })), { fontStyle: 'italic' }));
  cap.innerHTML = `<b style="font-style:normal;font-family:${FONT.grot};font-weight:800;letter-spacing:.1em;font-size:.84em">FIG. 2</b>&ensp;B-59 forced to the surface, a U.S. Navy helicopter above. 28–29 Oct. 1962.`
    + `<span style="display:block;margin-top:.25em;font-style:normal;font-family:${FONT.grot};font-weight:600;font-size:.72em;letter-spacing:.08em;text-transform:uppercase;opacity:.72">U.S. Navy · NARA 428-N-711200</span>`;
  if (L.portrait) cap.style.lineHeight = '1.18';

  // ---- section diagram (VO): sea surface, three charges sinking, the boat far below
  const D = L.pick({
    landscape: { x: R.side.x, y: headY + headH + L.px(40), w: R.side.w, h: L.px(300) },
    portrait: { x: L.safe.x, y: capY + L.px(96), w: L.safe.w, h: L.px(250) },
  });
  const dg = svg('svg', { 'data-name': '2B Section diagram', width: D.w, height: D.h, viewBox: `0 0 ${D.w} ${D.h}`, style: `position:absolute;left:${D.x}px;top:${D.y}px;overflow:visible` }, C);
  const surfY = L.px(34), boatY = D.h - L.px(44);
  const lineW = Math.max(2, L.px(2.5));
  // sea surface: a heavy rule, then thin water lines (grey, like column type)
  svg('rect', { 'data-name': 'Sea surface', x: 0, y: surfY, width: D.w, height: L.px(5), fill: INK.black }, dg);
  const waterLines = [];
  for (let i = 1; i <= 4; i++) waterLines.push(svg('rect', { x: 0, y: surfY + L.px(5) + i * (boatY - surfY - L.px(40)) / 5, width: D.w, height: Math.max(2, L.px(2)), fill: INK.grey, opacity: 0.35 }, dg));
  const surfLab = svg('text', { x: 0, y: surfY - L.px(10), fill: INK.black, 'font-family': FONT.grot, 'font-weight': 800, 'font-size': L.px(22), 'letter-spacing': '0.12em' }, dg);
  surfLab.textContent = 'PRACTICE DEPTH CHARGES';
  const noteLab = svg('text', { x: D.w, y: D.h + L.px(16), 'text-anchor': 'end', fill: INK.black, 'font-family': FONT.body, 'font-style': 'italic', 'font-size': L.px(24) }, dg);
  noteLab.textContent = 'diagram, not to scale';
  // boat in section: plain black hull + sail (a diagram, not a drawing of B-59)
  const bw = Math.min(D.w * 0.46, L.px(250)), bh = L.px(26), bx = D.w * 0.5 - bw / 2;
  const boat = svg('g', { 'data-name': 'Boat (diagram)' }, dg);
  svg('rect', { x: bx, y: boatY - bh / 2, width: bw, height: bh, rx: bh / 2, fill: INK.black }, boat);
  svg('rect', { x: bx + bw * 0.42, y: boatY - bh / 2 - L.px(18), width: bw * 0.16, height: L.px(20), fill: INK.black }, boat);
  const boatLab = svg('text', { x: bx + bw + L.px(14), y: boatY + L.px(8), fill: INK.black, 'font-family': FONT.grot, 'font-weight': 800, 'font-size': L.px(24), 'letter-spacing': '0.1em' }, dg);
  boatLab.textContent = 'B-59';
  // three charges: seeded x (designed once), sink, burst above the boat → spot-red ring stays printed
  const charges = bursts.map((at, i) => {
    const x = D.w * (0.3 + 0.2 * i) + (rand(41 + i * 7) - 0.5) * L.px(30);
    const depth = boatY - L.px(78) - rand(53 + i) * L.px(40);
    const g = svg('g', { 'data-name': `Depth charge ${i + 1}` }, dg);
    const can = svg('rect', { width: L.px(12), height: L.px(16), fill: INK.black }, g);
    const ring = svg('circle', { 'data-name': 'Burst ring (spot)', r: 1, fill: 'none', stroke: INK.spot, 'stroke-width': L.px(4), style: 'mix-blend-mode:multiply' }, g);
    return { at, x, depth, t0: tDrop + i * 6 * F, can, ring };
  });

  // ---- Moscow brief (VO): a boxed brief whose body never arrives
  const M = L.pick({
    landscape: { x: R.side.x, y: D.y + D.h + L.px(44), w: R.side.w },
    portrait: { x: L.safe.x, y: D.y + D.h + L.px(40), w: L.safe.w },
  });
  const mRule = box(C, '2C Brief rule', M.x, M.y, M.w, L.px(6), { background: INK.black, transformOrigin: '0 50%' });
  const mHead = box(C, '2C Moscow dateline', M.x, M.y + L.px(18), M.w, null, labelStyle(L.px(30), { fontWeight: 800, letterSpacing: '0.14em' }), 'Moscow —');
  const mBody = box(C, '2C Moscow brief', M.x, M.y + L.px(58), M.w, null, captionStyle(L.px(L.pick({ landscape: 48, portrait: 50 })), { fontWeight: 600, lineHeight: 1.05, fontStyle: 'italic' }), 'no orders, for days.');
  mBody.style.width = 'max-content';

  return {
    update(t) {
      const impacts = hw.map(w => [w.at, 1]).concat([[tMoscow, 0.6]], bursts.map(b => [b, 0.35]));
      S.update(t, impacts, L.px(3));

      // photo: coarse → fine in 16 f as the sheet lands, then a slow camera push on the boat (screen moves with the plate)
      const cell = +L.px(tw(t, tLand - 4 * F, tLand + 12 * F, 40, 6, ez.enter)).toFixed(2);
      ph.draw({ v: 1 }, [{ cell, angle: 45, color: INK.black, area: true, gain: 1.12 }]);
      ph.canvas.style.transform = `scale(${glide(t, tLand, ctx.duration, 1, 1.05).toFixed(4)})`;

      // headline pressed word by word
      hw.forEach((w, i) => applyPress(w.node, press(t, w.at), i === 1 && L.portrait ? '100% 90%' : '0% 90%'));
      kick.style.opacity = tw(t, tLand - 2 * F, tLand + 6 * F, 0, 1);
      surfLab.setAttribute('opacity', tw(t, tPrac - 2 * F, tPrac + 4 * F, 0, 1));

      // diagram: draws on "drop", charges sink (drag → slows), burst → red ring pressed and kept
      dg.style.opacity = tw(t, tDrop - 8 * F, tDrop, 0, 1);
      for (const c of charges) {
        const p = Math.max(0, Math.min(1, (t - c.t0) / (c.at - c.t0)));
        const y = surfY + (c.depth - surfY) * (1 - Math.pow(1 - p, 1.6));
        const on = t >= c.t0 && t < c.at;
        c.can.setAttribute('x', c.x - L.px(6)); c.can.setAttribute('y', y - L.px(8));
        c.can.setAttribute('opacity', on ? 1 : 0);
        const rp = tw(t, c.at, c.at + 9 * F, 0, 1, ez.enter);
        c.ring.setAttribute('cx', c.x + L.px(MISREG[0])); c.ring.setAttribute('cy', c.depth + L.px(MISREG[1]));
        c.ring.setAttribute('r', Math.max(0.1, L.px(8) + L.px(22) * rp));
        c.ring.setAttribute('stroke-width', L.px(8 - 4.5 * rp));
        c.ring.setAttribute('opacity', t >= c.at ? 1 : 0);
      }

      // Moscow brief: rule runs, dateline pressed; the body is set late, on "silent"
      mRule.style.transform = `scaleX(${tw(t, tMoscow - 6 * F, tMoscow + 4 * F, 0, 1, ez.enter)})`;
      applyPress(mHead, press(t, tMoscow), '0 100%');
      applyPress(mBody, press(t, tSilent), '0 100%');

      // caption sets after the photo resolves
      cap.style.opacity = tw(t, tLand + 14 * F, tLand + 22 * F, 0, 1);
    },
  };
}
