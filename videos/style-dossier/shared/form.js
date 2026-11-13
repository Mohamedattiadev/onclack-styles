// Sheet 3 — the consent form, shared by scene 3 and scene 4 (one continuous sheet, everything in global time,
// so the cut between the two scenes is invisible).
import { PAL, RUN, makeView, camAt, sheet, folder, typed, placeRun, carriage, printed, rule, strikeJolt, quake, stamp, redaction, signature } from './dossier.js';
import { STAMPS } from './plan.js';

export const T = { tape: 20.56, sig1: 18.5, sig2: 19.0, no: RUN.no.start, stamp: STAMPS.public };

export function buildForm(root, ctx) {
  const L = ctx.layout, P = L.portrait;
  const V = makeView(root, ctx), Wd = V.world;
  folder(Wd, { x: -70, y: -150, w: 2240, h: 2950, tabX: P ? 1300 : 1360, tabW: 640, label: 'ARKHIPOV, V. A.' });
  const pg = sheet(Wd, { x: 0, y: 0, w: 2100, h: 2700, name: 'Consent form (onion-skin)', bleed: 'TO FIRE THE SPECIAL WEAPON THE\nCOMMANDER, THE POLITICAL OFFICER\nAND THE CHIEF OF STAFF MUST AGREE.' });

  const X0 = P ? 100 : 150;
  printed(pg, P ? 'Reconstruction — not an original document' : 'Reconstruction for illustration — not an original document', { x: X0, y: 112, size: 30, color: PAL.red, opacity: 0.9, track: 0.1, name: 'Honesty label' });
  printed(pg, P ? 'Special weapon\nconsent' : 'Special weapon — consent', { x: X0, y: 170, size: 88, weight: 800, track: 0.08, name: 'Form title' });
  const subY = P ? 372 : 282;
  printed(pg, 'As recalled years later · accounts differ', { x: X0, y: subY, size: 32, weight: 700, track: 0.1, opacity: 0.8, name: 'Hedge line' });
  rule(pg, { x: X0, y: subY + 62, w: P ? 880 : 1800, h: 5 });

  // geometry per format
  const G = P
    ? { weapon: [100, 560], rule: [100, 740], lab: (x, y) => [x, y - 62], head: 860, rows: [960, 1290, 1620], name: y => [100, y + 58], box: y => [100, y + 140], sig: y => [380, y + 150], stamp: { x: 140, y: 1960, w: 760, h: 210 } }
    : { weapon: [760, 480], rule: [760, 620], lab: (x, y) => [150, y + 12], head: 780, rows: [890, 1060, 1230], name: y => [760, y], box: y => [1520, y - 18], sig: y => [1150, y + 34], stamp: { x: 700, y: 1420, w: 860, h: 250 } };
  for (const [k, lab] of [['weapon', 'Weapon on board'], ['rule', 'To fire']]) {
    const [vx, vy] = G[k], [lx, ly] = G.lab(vx, vy);
    printed(pg, lab, { x: lx, y: ly, size: 40, track: 0.12, name: `Field label ${lab}` });
    rule(pg, { x: vx - 10, y: vy + 64, w: P ? 840 : 760, h: 3, opacity: 0.55, name: `Field line ${lab}` });
  }
  // officers table
  const roles = ['1. Commander', '2. Political officer', '3. Chief of staff'];
  const names = ['V. G. SAVITSKY', 'I. S. MASLENNIKOV', 'V. A. ARKHIPOV'];
  if (!P) { printed(pg, 'Officer', { x: 150, y: G.head, size: 30, track: 0.2, opacity: 0.75 }); printed(pg, 'Name', { x: 760, y: G.head, size: 30, track: 0.2, opacity: 0.75 }); printed(pg, 'Agrees', { x: 1520, y: G.head, size: 30, track: 0.2, opacity: 0.75 }); }
  else printed(pg, 'Officers · each must agree', { x: 100, y: G.head, size: 32, track: 0.16, opacity: 0.75 });
  rule(pg, { x: X0, y: G.head + 44, w: P ? 880 : 1800, h: 2, opacity: 0.6 });
  const tapeBox = [];
  G.rows.forEach((y, i) => {
    printed(pg, roles[i], { x: X0, y: P ? y : y + 8, size: P ? 40 : 42, track: 0.08, name: `Role ${i + 1}` });
    const [nx, ny] = G.name(y);
    typed(pg, names[i], { x: nx, y: ny, size: P ? 44 : 56, seed: 600 + i, name: `Officer name ${i + 1}` });
    if (i === 2) tapeBox.push([nx - 16, ny - 12, names[i].length * (P ? 26.4 : 33.6) + 30, P ? 68 : 82]);
    const [bx, by] = G.box(y);
    rule(pg, { x: bx, y: by, w: 220, h: 4, name: 'Answer box top' }); rule(pg, { x: bx, y: by + 96, w: 220, h: 4, name: 'Answer box bottom' });
    rule(pg, { x: bx, y: by, w: 4, h: 100, name: 'Answer box left' }); rule(pg, { x: bx + 216, y: by, w: 4, h: 100, name: 'Answer box right' });
    if (!P || i < 2) rule(pg, { x: X0, y: (P ? y + 280 : y + 120), w: P ? 880 : 1800, h: 2, dotted: true, opacity: 0.4 });
  });
  const ansPos = i => { const [bx, by] = G.box(G.rows[i]); return [bx + (220 - (i === 2 ? 2 : 3) * 33.6) / 2, by + 22]; };
  const runs = ['weapon', 'rule', 'yes1', 'yes2', 'no'].map(id => placeRun(pg, id, ...(id === 'weapon' || id === 'rule' ? G[id] : ansPos({ yes1: 0, yes2: 1, no: 2 }[id]))));
  const pos = carriage(runs);
  const sigs = [0, 1].map(i => signature(pg, { x: G.sig(G.rows[i])[0], y: G.sig(G.rows[i])[1], w: P ? 300 : 240, h: P ? 80 : 66, seed: 11 + i * 7 }));
  const tape = redaction(pg, { x: tapeBox[0][0], y: tapeBox[0][1], w: tapeBox[0][2], h: tapeBox[0][3], seed: 9, name: 'Redaction tape over name 3' });
  const st = stamp(pg, { ...G.stamp, lines: ['Made public', '2002 · 40 years later'], sizes: P ? [92, 52] : [110, 58], color: PAL.red, rot: -7, seed: 13, name: 'Stamp MADE PUBLIC 2002 (red)' });

  // ---- camera (global time); NO = the tightest, highest-contrast frame of the film
  const [nbx, nby] = ansPos(2);
  const noC = { x: nbx + 33.6, y: nby + 30 };
  const r3 = G.rows[2];
  const follow = (tg, s) => {
    let x = 0, y = 0; for (let k = 0; k < 12; k++) { const p = pos(tg - k * 0.03); x += p.x; y += p.y; } x /= 12; y /= 12;
    return P ? { x: 470 + 0.1 * (x - 100), y: y + 200 / s } : { x: 925 + 0.06 * (x - 760), y: y + 100 / s };
  };
  const keys = P
    ? [{ t: 13.3, x: 480, y: 780, s: 1.08, follow: 0 }, { t: 14.1, s: 1.1, follow: 1 }, { t: 17.9, s: 1.1, follow: 1 },
      { t: 18.3, x: 480, y: 1290, s: 1.02, follow: 0 }, { t: 19.2, x: 480, y: 1320, s: 1.04 }, { t: 20.3, x: 380, y: r3 - 60, s: 1.3 },
      { t: 21.2, x: 370, y: r3 - 60, s: 1.4 }, { t: 21.8, x: 350, y: r3 - 50, s: 1.52 }, { t: 22.9, x: 350, y: r3 - 40, s: 1.58 },
      { t: 24.1, x: 540, y: 1450, s: 0.72 }, { t: 26.2, x: 540, y: 1460, s: 0.74 }]
    : [{ t: 13.3, x: 925, y: 590, s: 1.0, follow: 0 }, { t: 14.1, s: 1.0, follow: 1 }, { t: 17.9, s: 1.0, follow: 1 },
      { t: 18.3, x: 1250, y: 1020, s: 1.0, follow: 0 }, { t: 19.2, x: 1260, y: 1040, s: 1.02 }, { t: 20.3, x: 1150, y: r3 - 20, s: 1.4 },
      { t: 21.2, x: 1240, y: r3 - 60, s: 1.45 }, { t: 21.8, x: 1265, y: r3 - 90, s: 1.55 }, { t: 22.9, x: 1330, y: r3 - 70, s: 1.68 },
      { t: 24.1, x: 1050, y: 1080, s: 0.66 }, { t: 26.2, x: 1050, y: 1090, s: 0.68 }];
  const strikeRuns = ['weapon', 'rule', 'yes1', 'yes2', 'no'].map(i => RUN[i]);
  return {
    V, update(tg) {
      for (const r of runs) r.update(tg);
      sigs[0].update(tg, T.sig1, 0.42); sigs[1].update(tg, T.sig2, 0.45);
      tape.update(tg, T.tape);
      st.update(tg, T.stamp);
      const c = camAt(tg, keys, follow);
      const j = strikeJolt(tg, strikeRuns);
      const q = quake(tg, T.stamp, 6, 0.3, 4), qn = quake(tg, T.no, 2.5, 0.2, 6), qn2 = quake(tg, RUN.no.chars[1].t, 2.5, 0.2, 7);
      V.cam(c.x + q[0] + qn[0] + qn2[0], c.y + q[1] + qn[1] + qn2[1] - j * 0.8, c.s, c.rot);
      V.grain(tg);
      V.cull();
    },
  };
}
