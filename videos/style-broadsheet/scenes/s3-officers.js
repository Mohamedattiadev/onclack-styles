// Sheet A3 — THE VOTE: one nuclear torpedo, three officers, two stamps.
// intent: KNOW firing needs three officers, two said yes · FEEL dread · SEE two red YES stamps and one empty box
// truth: torpedo = VO diagram (labelled); officers = names/ranks only, no faces (accounts of the vote come from later
//        memoirs and are debated — re-check before public use); stamps = VO (our graphic device, not a document).
import { el, svg, rand } from '/onclack-styles/engine/lib/anim.js';
import { INK, FONT, MISREG, F, ez, tw, wordT, grid, sheet, box, press, applyPress, headStyle, labelStyle, captionStyle, inkDefs } from '../shared/press.js';

export default function (root, ctx) {
  const L = ctx.layout, G = grid(L);
  const S = sheet(root, ctx, { page: 3, folioRight: 'A3 · Aboard B-59', slideIn: true });
  const C = S.content;
  const fx = inkDefs(root, 's3');

  // ---- voice times (local)
  const tOn = wordT(ctx, 'On', 0, 0.35) - 2 * F;
  const tNuc = wordT(ctx, 'nuclear', 0, 1.16) - 2 * F;
  const tTorp = wordT(ctx, 'torpedo', 0, 1.56) - 2 * F;
  const tThree = wordT(ctx, 'three', 0, 3.19) - 2 * F;
  const tOff = wordT(ctx, 'officers', 0, 3.54) - 2 * F;
  const tMust = wordT(ctx, 'must', 0, 4.05) - 2 * F;
  const tAgree = wordT(ctx, 'agree', 0, 4.29) - 2 * F;
  const tTwo = wordT(ctx, 'Two', 0, 4.97) - 2 * F;
  const tYes = wordT(ctx, 'yes', 0, 5.48) - 2 * F;

  const top = S.top + L.px(26);

  // ---- row A: "on board" + the torpedo (diagram)
  const A = L.pick({
    landscape: { tx: G.x(0), tw: G.w(3), dx: G.x(4) - L.px(10), dw: G.w(8) + L.px(10), dy: top + L.px(34), dh: L.px(100) },
    portrait: { tx: L.safe.x, tw: L.safe.w, dx: L.safe.x, dw: L.safe.w, dy: top + L.px(150), dh: L.px(64) },
  });
  const kick = box(C, '3A Kicker', A.tx, top, A.tw, null, labelStyle(L.px(26), { fontWeight: 800 }), 'On board');
  const lede = box(C, '3A Lede', A.tx, top + L.px(40), A.tw, null, captionStyle(L.px(L.pick({ landscape: 48, portrait: 54 })), { fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.01em' }));
  lede.innerHTML = L.pick({ landscape: 'One nuclear<br>torpedo.', portrait: 'One nuclear torpedo.' });

  const T = svg('svg', { 'data-name': '3A Torpedo (diagram)', width: A.dw, height: A.dh, viewBox: `0 0 ${A.dw} ${A.dh}`, style: `position:absolute;left:${A.dx}px;top:${A.dy}px;overflow:visible` }, C);
  const tg = svg('g', {}, T);
  {
    const w = A.dw, h = A.dh, r = h * 0.36, cy = h / 2, tail = w * 0.09, nose = w * 0.11;
    // body + ogive nose (right) + tail cone (left)
    const d = `M ${tail} ${cy - r} L ${w - nose} ${cy - r} C ${w - nose * 0.35} ${cy - r} ${w} ${cy - r * 0.35} ${w} ${cy}`
      + ` C ${w} ${cy + r * 0.35} ${w - nose * 0.35} ${cy + r} ${w - nose} ${cy + r} L ${tail} ${cy + r} L ${tail * 0.35} ${cy + r * 0.45} L ${tail * 0.35} ${cy - r * 0.45} Z`;
    svg('path', { d, fill: INK.black }, tg);
    // fins + propeller
    svg('path', { d: `M ${tail * 0.2} ${cy - h * 0.5} L ${tail * 0.75} ${cy - h * 0.5} L ${tail * 1.05} ${cy - r * 0.9} L ${tail * 0.5} ${cy - r * 0.4} Z M ${tail * 0.2} ${cy + h * 0.5} L ${tail * 0.75} ${cy + h * 0.5} L ${tail * 1.05} ${cy + r * 0.9} L ${tail * 0.5} ${cy + r * 0.4} Z`, fill: INK.black }, tg);
    svg('rect', { x: 0, y: cy - r * 0.75, width: tail * 0.16, height: r * 1.5, fill: INK.black }, tg);
    // section lines in paper colour (hull plates)
    for (const f of [0.34, 0.58]) svg('rect', { x: w * f, y: cy - r, width: Math.max(2, L.px(2.5)), height: r * 2, fill: INK.paper, opacity: 0.85 }, tg);
  }
  // warhead section in spot ink (overprint, constant misregistration)
  const wh = svg('rect', { 'data-name': 'Warhead (spot)', x: A.dw * 0.62 + L.px(MISREG[0]), y: A.dh / 2 - A.dh * 0.36 + L.px(MISREG[1]), width: A.dw * 0.2, height: A.dh * 0.72, fill: INK.spot }, T); // knockout (not overprint): red on black would print black
  const tLab = box(C, '3A Torpedo caption', L.pick({ landscape: A.dx + A.dw * 0.62, portrait: A.dx }), A.dy + A.dh + L.px(14), L.pick({ landscape: A.dw * 0.38, portrait: A.dw }), null,
    captionStyle(L.px(L.pick({ landscape: 26, portrait: 26 })), { fontStyle: 'italic', whiteSpace: 'nowrap', textAlign: L.pick({ landscape: 'left', portrait: 'right' }) }));
  tLab.innerHTML = `<b style="font-style:normal;font-family:${FONT.grot};font-weight:800;letter-spacing:.1em;font-size:.86em;color:${INK.black}">NUCLEAR WARHEAD</b>&ensp;diagram`;

  // ---- rule + headline
  const ruleY = A.dy + A.dh + L.px(L.pick({ landscape: 78, portrait: 70 }));
  const rule = box(C, '3B Rule', L.safe.x, ruleY, L.safe.w, L.px(6), { background: INK.black, transformOrigin: '0 50%' });
  const hSize = L.px(L.pick({ landscape: 176, portrait: 176 }));
  const head = box(C, '3B Headline', L.safe.x, ruleY + L.px(30), L.safe.w, null, { ...headStyle(hSize), display: 'flex', flexWrap: 'wrap', columnGap: '0.16em', rowGap: L.px(6) + 'px', filter: fx.ink });
  const hw = [['Three', tThree], ['must', tMust], ['agree', tAgree]].map(([w, at]) => ({ node: el('span', { 'data-name': `Headline word ${w}`, style: { display: 'inline-block' } }, head, w), at }));
  if (L.portrait) hw[2].node.style.flexBasis = '100%';
  const headH = head.getBoundingClientRect().height;

  // ---- the three officers (ranks + names, no faces)
  const officers = [
    { n: '1', role: 'Captain', name: 'Valentin Savitsky', vote: tTwo },
    { n: '2', role: 'Political officer', name: 'Ivan Maslennikov', vote: tYes },
    { n: '3', role: 'Flotilla chief of staff', name: null, vote: null },
  ];
  const bandY = ruleY + L.px(30) + headH + L.px(L.pick({ landscape: 40, portrait: 36 }));
  const bandB = L.safe.y + L.safe.h;
  const cells = officers.map((o, i) => {
    const R = L.pick({
      landscape: { x: G.x(i * 4), y: bandY, w: G.w(4), h: bandB - bandY },
      portrait: { x: L.safe.x, y: bandY + i * ((bandB - bandY) / 3), w: L.safe.w, h: (bandB - bandY) / 3 },
    });
    const cell = box(C, `3C Officer ${o.n}`, R.x, R.y, R.w, R.h, {});
    // column rule (16:9: vertical in the gutter; 9:16: horizontal above)
    if (L.landscape && i > 0) box(cell, 'Column rule', -G.gut / 2 - 1, 0, Math.max(2, L.px(2)), R.h, { background: INK.black });
    if (L.portrait) box(cell, 'Row rule', 0, 0, R.w, Math.max(2, L.px(2)), { background: INK.black });
    const numSize = L.px(L.pick({ landscape: 128, portrait: 116 }));
    const num = box(cell, 'Number', 0, L.pick({ landscape: 0, portrait: L.px(20) }), numSize * 0.6, null, { ...headStyle(numSize), fontVariantNumeric: 'tabular-nums lining-nums', lineHeight: 0.8 }, o.n);
    const tx = numSize * 0.62 + L.px(14);
    const role = box(cell, 'Rank', tx, L.pick({ landscape: L.px(4), portrait: L.px(26) }), R.w - tx, null, labelStyle(L.px(22), { fontWeight: 800, whiteSpace: 'normal' }), o.role);
    const nameY = L.pick({ landscape: L.px(40), portrait: L.px(60) });
    // the sheet arrives as a pre-printed form: numbers, a blank name bar and a dashed vote box for each officer
    const blank = box(cell, 'Name (not yet set)', tx, nameY + L.px(16), L.px(L.pick({ landscape: 250, portrait: 300 })), L.px(16), { background: INK.grey, opacity: 0.5 });
    let name = null;
    if (o.name) {
      name = box(cell, 'Name', tx, nameY, R.w - tx, null, captionStyle(L.px(L.pick({ landscape: 44, portrait: 46 })), { fontWeight: 600, lineHeight: 1.0, whiteSpace: L.landscape ? 'normal' : 'nowrap' }), o.name);
      if (L.portrait) name.style.width = 'max-content';
    }
    const SB = L.pick({
      landscape: { x: tx, y: L.px(176), w: L.px(290), h: L.px(150) },
      portrait: { x: R.w - L.px(252), y: L.px(66), w: L.px(232), h: L.px(104) },
    });
    if (L.portrait) { role.style.width = R.w - tx - SB.w - L.px(20) + 'px'; }
    const empty = box(cell, 'Vote box', SB.x, SB.y, SB.w, SB.h, { border: `${Math.max(2, L.px(2.5))}px dashed ${INK.black}`, opacity: 0.5 });
    box(empty, 'Vote label', L.px(14), L.px(10), SB.w - L.px(28), null, labelStyle(L.px(20), { fontWeight: 600 }), 'Vote');
    let stamp = null;
    if (o.vote != null) {
      stamp = box(cell, `Stamp YES ${o.n}`, SB.x + L.px(MISREG[0]), SB.y + L.px(MISREG[1]), SB.w, SB.h, {
        border: `${L.px(7)}px solid ${INK.spot}`, outline: `${L.px(2.5)}px solid ${INK.spot}`, outlineOffset: `${L.px(5)}px`,
        color: INK.spot, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT.head, fontWeight: 800, fontSize: SB.h * 0.82 + 'px', letterSpacing: '0.04em', lineHeight: 1,
        mixBlendMode: 'multiply', filter: fx.stamp,
      }, 'YES');
    }
    return { o, cell, num, role, name, blank, stamp, empty, at: tOff + i * 4 * F, rot: o.vote != null ? (rand(70 + i * 13) - 0.5) * 9 : 0 };
  });

  return {
    update(t) {
      const impacts = [[tNuc, 0.6], ...hw.map(w => [w.at, w.node === hw[0].node ? 1 : 0.5]), [tTwo, 0.9], [tYes, 0.9]];
      S.update(t, impacts, L.px(3));

      kick.style.opacity = tw(t, tOn - 4 * F, tOn + 4 * F, 0, 1);
      lede.style.opacity = tw(t, tOn, tOn + 6 * F, 0, 1);
      lede.style.transform = `translateY(${tw(t, tOn, tOn + 12 * F, L.px(12), 0).toFixed(2)}px)`;

      // torpedo pressed on "nuclear"; the warhead plate (second ink) lands on "torpedo"
      applyPress(T, press(t, tNuc), '50% 50%');
      const wp = press(t, tTorp, { lift: 0.12 });
      wh.setAttribute('opacity', wp.opacity);
      tLab.style.opacity = tw(t, tTorp + 2 * F, tTorp + 8 * F, 0, 1);

      // the rule is pre-printed on the sheet
      for (const w of hw) applyPress(w.node, press(t, w.at), '50% 90%');

      for (const c of cells) {
        // ranks + names are set into the form on "officers" (staggered 4 f); the blank bar stays for no. 3
        applyPress(c.role, press(t, c.at, { lift: 0.04 }), '0 100%');
        if (c.name) { applyPress(c.name, press(t, c.at + 2 * F, { lift: 0.04 }), '0 100%'); c.blank.style.opacity = t >= c.at + 2 * F ? 0 : 0.5; }
        if (c.stamp) {
          const sp = press(t, c.o.vote, { lift: 0.22, squash: 0.015 });
          c.stamp.style.opacity = sp.opacity;
          c.stamp.style.transformOrigin = '50% 50%';
          c.stamp.style.transform = `rotate(${c.rot.toFixed(2)}deg) ${sp.transform}`;
          c.empty.style.opacity = t >= c.o.vote ? 0 : 0.5;
        }
      }
    },
  };
}
