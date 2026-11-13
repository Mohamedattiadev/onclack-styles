// Chart 2 — "Above B-59"
// intent: KNOW US ships were above and dropped signal depth charges; Moscow was silent · FEEL outnumbered, then cut off
//         · SEE 12 steel-blue ship units, 5 charge units falling into their row, and a row that stays EMPTY (zero).
// truth: VO chart. ≈ 1 carrier + ≈ 11 destroyers in the hunting group (sources differ); 5 practice/signal charges in one
//        US log entry (USS Cony, evening of 27 Oct — re-check); "0" orders = no contact with Moscow for days (as told).
import { PAL, FONT, F, sheet, pict, box, rowLabel, laid, counted, tw, outCubic, inQuad, wordT, mix, spring, springs } from '../shared/iso.js';

export default function (root, ctx) {
  const L = ctx.layout, px = L.px, S = L.safe;
  const sh = sheet(root, ctx, {
    n: 2, title: 'Above B-59',
    key: [{ kind: 'destroyer', w: 64, color: PAL.steel, label: '1 US ship' }, { kind: 'charge', w: 20, label: '1 charge' }],
    note: 'Ship count ≈ (sources differ). Charges: one log entry only — more were dropped that day.',
  });
  const C = sh.content, I = sh.ink, top = sh.bodyTop;

  const tAm = wordT(ctx, 'American', 0, 0.86) - 3 * F;
  const tDrop = wordT(ctx, 'drop', 0, 1.74) - 2 * F;
  const tCharges = wordT(ctx, 'charges', 0, 2.84);
  const tMoscow = wordT(ctx, 'Moscow', 0, 3.74) - 2 * F;
  const tSilent = wordT(ctx, 'silent', 0, 4.72) - 2 * F;
  const tDays = wordT(ctx, 'days', 0, 5.28) - 2 * F;

  ctx.sfx('page-turn-01', 0.03, { lu: -22 });
  ctx.ambience('sea-water-close-01', { from: 0, to: tMoscow + 0.2, lu: -17, fade: 0.6 });

  // geometry: landscape = label column + unit column; portrait = label above units (stacked on purpose)
  const G = L.pick({
    landscape: { lx: S.x, ux: S.x + px(450), uw: S.w - px(450), perRow: 6, r1: top, r2: top + px(290), r3: top + px(560), uOff: 0 },
    portrait: { lx: S.x, ux: S.x, uw: S.w, perRow: 4, r1: top, r2: top + px(450), r3: top + px(760), uOff: px(128) },
  });
  const capW = L.pick({ landscape: 400, portrait: 620 });

  // ---- row 1: ships (1 carrier + 11 destroyers)
  const shipLab = rowLabel(C, L, 'Ships counted', G.lx, G.r1, { caption: 'US Navy ships in the group<br>hunting B-59 (1 carrier, ≈ 11 destroyers)', prefix: '≈ ', size: 96, capSize: 24, capWidth: capW, inline: L.portrait, color: PAL.steel });
  const sgx = px(L.pick({ landscape: 22, portrait: 22 })), sgy = px(L.pick({ landscape: 24, portrait: 20 }));
  const shW = (G.uw - (G.perRow - 1) * sgx) / G.perRow;
  const shipY0 = G.r1 + G.uOff + px(L.pick({ landscape: 14, portrait: 0 }));
  const ships = [];
  for (let i = 0; i < 12; i++) {
    const col = i % G.perRow, row = Math.floor(i / G.perRow);
    const x = G.ux + col * (shW + sgx), y = shipY0 + row * (shW / 3 + sgy);
    const kind = i === 0 ? 'carrier' : 'destroyer';
    const gh = box(I, `Ship ${i + 1} slot`, x, y, {});
    pict(gh, kind, shW, { color: PAL.ghost, mode: 'ghost', name: `Ship ${i + 1} empty` });
    const hold = box(I, `Ship ${i + 1}`, x, y, {});
    pict(hold, kind, shW, { color: PAL.steel, name: `${kind} unit` });
    ships.push({ gh, hold, at: tAm + i * 0.068 });
  }
  const shipsBottom = shipY0 + Math.ceil(12 / G.perRow) * (shW / 3 + sgy) - sgy;

  // ---- row 2: five signal charges, falling into their row
  const chLab = rowLabel(C, L, 'Charges counted', G.lx, G.r2, { caption: 'signal depth charges,<br>in one US log entry', size: 96, capSize: 24, capWidth: capW, inline: L.portrait });
  const cw = px(L.pick({ landscape: 84, portrait: 74 })), cg = px(L.pick({ landscape: 56, portrait: 46 }));
  const chY = G.r2 + G.uOff + px(L.pick({ landscape: 8, portrait: 0 }));
  const charges = [];
  for (let i = 0; i < 5; i++) {
    const x = G.ux + i * (cw + cg);
    const gh = box(I, `Charge ${i + 1} slot`, x, chY, {});
    pict(gh, 'charge', cw, { color: PAL.ghost, mode: 'ghost', name: `Charge ${i + 1} empty` });
    const hold = box(I, `Charge ${i + 1}`, x, chY, {});
    const u = pict(hold, 'charge', cw, { color: PAL.ink, name: 'Charge unit' });
    charges.push({ gh, hold, u, at: tDrop + i * 0.2 });
  }
  // landscape: from under the ship row; portrait: a short drop (the label sits between the rows there)
  const fallH = L.portrait ? px(70) : chY - shipsBottom - px(6);
  const FALL = 0.3;
  ctx.sfx('boom-distant-01', charges[0].at + FALL, { lu: -9 });
  ctx.sfx('boom-slapback-01', charges[4].at + FALL + 0.02, { lu: -12 });

  // ---- row 3: orders from Moscow — an empty row (zero is drawn, not skipped)
  const mLab = rowLabel(C, L, 'Orders counted', G.lx, G.r3, { caption: 'orders received<br>from Moscow — for days', size: 96, capSize: 24, capWidth: capW, inline: L.portrait });
  const trackY = G.r3 + G.uOff + px(L.pick({ landscape: 10, portrait: 0 }));
  const trackH = px(L.pick({ landscape: 100, portrait: 120 }));
  const trackW = G.uw;
  const track = box(I, 'Empty row', G.ux, trackY, { width: trackW + 'px', height: trackH + 'px', boxSizing: 'border-box', border: `${Math.max(2, px(2.4))}px dashed ${PAL.ghost}`, borderRadius: px(4) + 'px' });
  const none = box(C, 'Empty row text', G.ux + px(28), trackY + trackH / 2, { font: `600 ${px(22)}px ${FONT}`, letterSpacing: '0.16em', color: PAL.text2, transform: 'translateY(-50%)', whiteSpace: 'nowrap' }, 'NO UNITS · THE RADIO STAYS SILENT');
  const sig = box(I, 'Signal slot', G.ux + trackW - px(118), trackY + (trackH - px(72)) / 2, {});
  pict(sig, 'signal', px(96), { color: PAL.ghost, mode: 'ghost', name: 'Signal empty' });

  return {
    update(t) {
      sh.update(t);
      // ships
      shipLab.wrap.style.opacity = tw(t, tAm - 0.3, tAm - 0.1, 0, 1);
      shipLab.set(counted(t, ships.map(s => s.at)));
      const back = tw(t, tDays, tDays + 0.4, 0, 1);
      for (const s of ships) {
        s.gh.style.opacity = tw(t, 0.35, 0.6, 0, 1);
        const q = laid(t, s.at, px(26));
        s.hold.style.opacity = q.o * (1 - 0.5 * back);
        s.hold.style.transform = `translateX(${q.x.toFixed(2)}px)`;
      }
      // charges: dropped from the ship row, fall with gravity, a 2-frame squash on landing
      chLab.wrap.style.opacity = tw(t, tDrop - 0.3, tDrop - 0.1, 0, 1);
      chLab.set(counted(t, charges.map(c => c.at + FALL - 3 * F)));
      for (const c of charges) {
        c.gh.style.opacity = tw(t, 0.45, 0.7, 0, 1);
        const p = (t - c.at) / FALL;
        if (p < 0) { c.hold.style.opacity = 0; continue; }
        const y = p < 1 ? -fallH * (1 - inQuad(p)) : 0;
        const land = t - (c.at + FALL);
        const sq = land >= 0 && land < 4 * F ? 0.9 + 0.1 * (land / (4 * F)) : 1;
        c.hold.style.opacity = tw(t, c.at, c.at + 2 * F, 0, 1);
        c.hold.style.transform = `translateY(${y.toFixed(2)}px) scale(${(2 - sq).toFixed(3)}, ${sq.toFixed(3)})`;
        c.hold.style.transformOrigin = `${cw / 2}px ${cw * 1.25}px`;
      }
      // Moscow: the row is drawn, the numeral lands on "silent", nothing ever fills it
      const m = tw(t, tMoscow - 0.25, tMoscow, 0, 1);
      mLab.wrap.style.opacity = m;
      mLab.num.style.opacity = t >= tSilent ? 1 : 0.0;
      mLab.num.style.transform = `translateX(${(-px(18) * (1 - spring(t - tSilent, springs.snappy))).toFixed(2)}px)`;
      track.style.clipPath = `inset(0 ${(100 - 100 * tw(t, 0.5, 1.0, 0, 1, outCubic)).toFixed(2)}% 0 0)`;
      sig.style.opacity = tw(t, 0.9, 1.1, 0, 1);
      none.style.opacity = tw(t, tSilent + 0.1, tSilent + 0.35, 0, 1);
    },
  };
}
