// Chart 3 — "What it took to fire"
// intent: KNOW there was one nuclear torpedo among the load, and the rule: three officers must agree · FEEL the rule
//         tightening (2 of 3) · SEE 22 torpedo units, one turns ochre; three different bodies; two vote slots fill.
// truth: VO chart. ≈ 22 torpedoes = standard Foxtrot load (re-check); 1 nuclear (≈ 10 kt, estimates differ);
//        the three-officer rule and the vote are as usually told (accounts differ in detail).
import { PAL, FONT, F, sheet, pict, box, rowLabel, laid, counted, tw, wordT, mix } from '../shared/iso.js';
import { buildOfficers } from '../shared/officers.js';

export default function (root, ctx) {
  const L = ctx.layout, px = L.px, S = L.safe;
  const sh = sheet(root, ctx, {
    n: 3, title: 'What it took to fire',
    key: [{ kind: 'torpedo', w: 72, label: '1 torpedo' }, { kind: 'behind', w: 16, label: '1 officer' }],
    note: 'Torpedo load ≈ (standard for the class). The vote is as usually told; accounts differ in detail.',
  });
  const C = sh.content, I = sh.ink, top = sh.bodyTop;

  const tBoard = wordT(ctx, 'board', 0, 0.51) - 2 * F;
  const tNuc = wordT(ctx, 'nuclear', 0, 1.16) - 2 * F;
  const tFire = wordT(ctx, 'fire', 0, 2.58) - 2 * F;
  const tThree = wordT(ctx, 'three', 0, 3.19) - 3 * F;
  const tAgree = wordT(ctx, 'agree', 0, 4.29) - 2 * F;
  const tTwo = wordT(ctx, 'Two', 0, 4.97) - 3 * F;
  const tYes = wordT(ctx, 'yes', 0, 5.48) - 3 * F;

  ctx.sfx('page-turn-01', 0.03, { lu: -22 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -21, fade: 0.8 });
  ctx.sfx('drawer-close-01', tTwo + 3 * F, { lu: -20 });
  ctx.sfx('drawer-close-01', tYes + 3 * F, { lu: -18 });

  // ---- torpedo rack
  const T = L.pick({
    landscape: { x: S.x, y: top, w: px(560), cols: 2, gx: px(40), gy: px(7), rackY: top + px(150) },
    portrait: { x: S.x, y: top, w: S.w, cols: 6, gx: px(14), gy: px(18), rackY: top + px(124) },
  });
  const tLab = rowLabel(C, L, 'Torpedoes counted', T.x, T.y, { caption: 'torpedoes aboard', prefix: '≈ ', size: 96, capSize: 24, inline: true });
  const tw0 = (T.w - (T.cols - 1) * T.gx) / T.cols, th = tw0 / 6;
  const torps = [];
  for (let i = 0; i < 22; i++) {
    const col = i % T.cols, row = Math.floor(i / T.cols);
    const x = T.x + col * (tw0 + T.gx), y = T.rackY + row * (th + T.gy);
    const gh = box(I, `Torpedo ${i + 1} slot`, x, y, {});
    pict(gh, 'torpedo', tw0, { color: PAL.ghost, mode: 'ghost', name: `Torpedo ${i + 1} empty` });
    const hold = box(I, `Torpedo ${i + 1}`, x, y, {});
    const u = pict(hold, 'torpedo', tw0, { color: PAL.ink, name: 'Torpedo unit' });
    torps.push({ gh, hold, u, at: tBoard + 0.06 + i * 0.03 });
  }
  const nuc = torps[21];
  const rackBottom = T.rackY + Math.ceil(22 / T.cols) * (th + T.gy) - T.gy;
  const nucCap = box(C, 'Nuclear caption', T.x, rackBottom + px(20), { font: `500 ${px(24)}px ${FONT}`, color: PAL.ink, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', columnGap: px(12) + 'px' });
  const sw = box(nucCap, 'Nuclear swatch', 0, 0, { position: 'relative', width: px(20) + 'px', height: px(20) + 'px', background: PAL.ochre });
  const ncTxt = box(nucCap, 'Nuclear text', 0, 0, { position: 'relative' });
  ncTxt.innerHTML = '<b style="font-weight:800">1 nuclear</b> · ≈ 10 kilotons (estimates differ)';

  // ---- the rule: three officers, three vote slots
  const O = L.pick({
    landscape: { x: S.x + px(700), y: top, w: S.w - px(700), figY: top + px(150), figH: px(400), slot: px(88) },
    portrait: { x: S.x, y: rackBottom + px(92), w: S.w, figY: rackBottom + px(92) + px(140), figH: px(360), slot: px(84) },
  });
  const oLab = rowLabel(C, L, 'Officers counted', O.x, O.y, { caption: 'officers who must all agree<br>before it can be fired', size: 96, capSize: 24, inline: true });
  const centers = [1, 3, 5].map(k => O.x + O.w * k / 6);
  const offs = buildOfficers(C, I, L, { centers, y: O.figY, h: O.figH, slot: O.slot, nameSize: 22, ghost: true });
  offs.forEach((o, i) => { o.at = tThree + i * 0.16; o.vAt = i === 0 ? tTwo : tYes; });
  const sy = offs[0].slotY;
  const need = box(C, 'Votes needed', centers[2] + O.slot / 2 + px(24), sy + O.slot / 2, { transform: 'translateY(-50%)', font: `800 ${px(40)}px ${FONT}`, color: PAL.ink, whiteSpace: 'nowrap', lineHeight: 1, fontVariantNumeric: 'tabular-nums' });
  const needSub = box(C, 'Votes needed sub', 0, 0, {});
  if (L.landscape) {
    // landscape: no room right of slot 3 → the tally sits under the slots
    Object.assign(need.style, { left: centers[0] - O.slot / 2 + 'px', top: sy + O.slot + px(26) + 'px', transform: 'none', font: `600 ${px(26)}px ${FONT}` });
  } else {
    Object.assign(need.style, { left: S.x + 'px', top: sy + O.slot + px(24) + 'px', transform: 'none', font: `600 ${px(26)}px ${FONT}` });
  }
  needSub.remove();

  return {
    update(t) {
      sh.update(t);
      tLab.wrap.style.opacity = tw(t, tBoard - 0.25, tBoard - 0.05, 0, 1);
      tLab.set(counted(t, torps.map(k => k.at)));
      const back = tw(t, tFire, tFire + 0.35, 0, 1);
      for (const k of torps) {
        k.gh.style.opacity = tw(t, tBoard - 0.25, tBoard - 0.05, 0, 1);
        const q = laid(t, k.at, px(22));
        k.hold.style.opacity = q.o;
        k.hold.style.transform = `translateX(${q.x.toFixed(2)}px)`;
        k.u.set(k === nuc ? mix(PAL.ink, PAL.ochre, tw(t, tNuc, tNuc + 4 * F, 0, 1)) : mix(PAL.ink, PAL.faded, back));
      }
      nucCap.style.opacity = tw(t, tNuc + 3 * F, tNuc + 9 * F, 0, 1);

      oLab.wrap.style.opacity = tw(t, tThree - 0.3, tThree - 0.1, 0, 1);
      oLab.set(counted(t, offs.map(o => o.at)));
      for (const o of offs) {
        const q = laid(t, o.at, px(30));
        o.hold.style.opacity = q.o;
        o.hold.style.transform = `translateX(${q.x.toFixed(2)}px)`;
        o.nameEl.style.opacity = tw(t, o.at + 3 * F, o.at + 8 * F, 0, 1);
        o.ghostEl.style.opacity = tw(t, 0.5, 0.8, 0, 1);
        o.slotGhost.style.opacity = tw(t, 0.6, 0.9, 0, 1);
        if (o.name === 'Arkhipov') { o.slotHold.style.opacity = 0; continue; }
        const v = laid(t, o.vAt, px(18));
        o.slotHold.style.opacity = v.o;
        o.slotHold.style.transform = `translateX(${v.x.toFixed(2)}px)`;
      }
      const yes = counted(t, [tTwo, tYes]);
      need.style.opacity = tw(t, tAgree, tAgree + 0.2, 0, 1);
      need.innerHTML = `<b style="font-weight:800">${yes} of 3</b> agree &nbsp;·&nbsp; 3 of 3 needed`;
    },
  };
}
