// Sheet 1 — REPORT OF OBSERVATION, typed live. Then the camera finds the typed sketch map clipped to it.
// intent: KNOW 27 Oct 1962, a Soviet submarine, deep, near Cuba · FEEL curiosity · SEE the date striking onto paper
// truth: report form = RC (labelled reconstruction) · map = EV-derived (Natural Earth coast, typed as characters), sub = approx.
import { el } from '/onclack-styles/engine/lib/anim.js';
import { PAL, TS, CW, RUN, makeView, camAt, sheet, folder, typed, placeRun, carriage, printed, rule, paperClip, strikeJolt, quake } from '../shared/dossier.js';

const BLEED = 'THE OFFICERS ON BOARD HAD HAD NO WORD\nFROM MOSCOW FOR DAYS. ABOVE THEM THE\nSHIPS KEPT CIRCLING. INSIDE THE BOAT\nTHE AIR WAS HOT AND THIN.';

export default async function (root, ctx) {
  const L = ctx.layout, P = L.portrait;
  const V = makeView(root, ctx), Wd = V.world;
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();

  folder(Wd, { x: -70, y: -150, w: 2240, h: 2950, tabX: 1360, tabW: 600, label: 'B-59 · 27 X 62' });
  const pg = sheet(Wd, { x: 0, y: 0, w: 2100, h: 2700, name: 'Report sheet (onion-skin)', bleed: BLEED });

  // header: honesty line, printed form title, file line typed earlier
  printed(pg, P ? 'Reconstruction — not an original document' : 'Reconstruction for illustration — not an original document', { x: 150, y: 112, size: 30, weight: 700, track: 0.1, color: PAL.red, opacity: 0.9, name: 'Honesty label' });
  printed(pg, P ? 'Report of\nobservation' : 'Report of observation', { x: 150, y: 170, size: P ? 84 : 92, weight: 800, track: 0.1, name: 'Form title' });
  typed(pg, 'FILE 62/B-59', { x: 150, y: P ? 380 : 300, size: 40, seed: 11, name: 'File number (typed)' });
  typed(pg, P ? 'COPY 1/3' : 'COPY 1 OF 3', { x: P ? 640 : 1230, y: P ? 380 : 300, size: 40, seed: 12, name: 'Copy number (typed)' });
  rule(pg, { x: 150, y: P ? 446 : 372, w: P ? 760 : 1800, h: 5 });
  rule(pg, { x: 150, y: P ? 458 : 384, w: P ? 760 : 1800, h: 2 });

  // fields: labels printed on the form; the typist fills the values
  const F = P
    ? { date: [150, 570], vessel: [150, 730], pos: [150, 890], label: (y) => [150, y - 62] }
    : { date: [600, 520], vessel: [600, 680], pos: [600, 840], label: (y) => [150, y + 12] };
  const fields = [['date', 'Date'], ['vessel', 'Vessel'], ['pos', 'Position']];
  for (const [k, lab] of fields) {
    const [vx, vy] = F[k], [lx, ly] = F.label(vy);
    printed(pg, lab, { x: lx, y: ly, size: 40, weight: 700, track: 0.14, name: `Field label ${lab}` });
    if (!P) rule(pg, { x: 330, y: vy + 44, w: 240, h: 4, dotted: true, name: 'Dotted leader', opacity: 0.6 });
    rule(pg, { x: vx - 10, y: vy + 64, w: P ? 820 : 640, h: 3, name: `Field line ${lab}`, opacity: 0.55 });
  }
  const runs = ['date', 'vessel', 'pos'].map(id => placeRun(pg, id, ...F[id]));
  const pos = carriage(runs);

  // ---- enclosure: typed sketch map (carbon copy), clipped to the report
  const M = P ? { x: 120, y: 1000, w: 820, h: 700, rot: -1.2, size: 19 } : { x: 1330, y: 420, w: 720, h: 700, rot: 1.8, size: 18 };
  const encl = sheet(Wd, { x: M.x, y: M.y, w: M.w, h: M.h, rot: M.rot, name: 'Enclosure 1: typed sketch map', z: 3 });
  const cols = 60, rows = 26, lon0 = -85.6, lon1 = -66.6, lat0 = 30.4, lat1 = 18.6;
  const inside = (lo, la, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > la) !== (yj > la) && lo < ((xj - xi) * (la - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const land = (c, r) => { const lo = lon0 + ((c + 0.5) / cols) * (lon1 - lon0), la = lat0 + ((r + 0.5) / rows) * (lat1 - lat0); return geo.features.some(f => f.rings.some(ring => inside(lo, la, ring))); };
  const grid = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => land(c, r)));
  const txt = grid.map((row, r) => row.map((v, c) => !v ? ' ' : (grid[r - 1]?.[c] && grid[r + 1]?.[c] && row[c - 1] && row[c + 1]) ? ':' : 'X'));
  const put = (r, c, s) => { for (let i = 0; i < s.length; i++) if (txt[r]?.[c + i] != null) txt[r][c + i] = s[i]; };
  const cell = (lo, la) => [Math.round(((la - lat0) / (lat1 - lat0)) * rows - 0.5), Math.round(((lo - lon0) / (lon1 - lon0)) * cols - 0.5)];
  { const [r, c] = cell(-80.6, 20.6); put(r, c, 'CUBA'); }
  { const [r, c] = cell(-85.2, 27.2); put(r, c, 'FLA.'); }
  { const [r, c] = cell(-76.4, 27.6); put(r, c, 'BAHAMAS'); }
  const subCell = cell(-71.2, 25.4);
  txt[subCell[0]][subCell[1]] = ' ';
  const msz = M.size, mcw = msz * 0.6, mlh = mcw * (10 / 6);
  const mx = (M.w - cols * mcw) / 2, my = 120;
  typed(encl, 'ENCL. 1  SKETCH - NOT TO SCALE', { x: mx, y: 34, size: msz * 1.15, ink: 'blue', carbon: true, seed: 300, name: 'Enclosure caption' });
  rule(encl, { x: mx, y: 84, w: cols * mcw, h: 2, color: PAL.blue, opacity: 0.5 });
  txt.forEach((row, r) => typed(encl, row.join(''), { x: mx, y: my + r * mlh, size: msz, ink: 'blue', carbon: true, seed: 400 + r, name: `Map row ${r + 1}` }));
  const subX = typed(encl, 'X', { x: mx + subCell[1] * mcw, y: my + subCell[0] * mlh, size: msz * 1.15, ink: 'red', seed: 77, name: 'B-59 mark (red ribbon)', overstrike: true });
  typed(encl, 'B-59', { x: mx + (subCell[1] + 2) * mcw, y: my + (subCell[0] - 0.1) * mlh, size: msz * 1.15, ink: 'red', seed: 78, name: 'B-59 label' });
  typed(encl, '(APPROX.)', { x: mx + (subCell[1] + 2) * mcw, y: my + (subCell[0] + 1.1) * mlh, size: msz, ink: 'red', seed: 79, name: 'Approx label' });
  typed(encl, 'N', { x: mx + (cols - 3) * mcw, y: my + 2 * mlh, size: msz, ink: 'blue', carbon: true, seed: 81, name: 'North' });
  typed(encl, '^', { x: mx + (cols - 3) * mcw, y: my + 1 * mlh, size: msz, ink: 'blue', carbon: true, seed: 82 });
  typed(encl, 'COAST: NATURAL EARTH DATA', { x: mx, y: M.h - 64, size: msz * 0.85, ink: 'blue', carbon: true, seed: 83, name: 'Map source' });
  paperClip(pg, Wd, { x: M.x + M.w * 0.62, y: M.y - 70, len: 200, rot: M.rot + 2, name: 'Paper clip (map)' });

  // ---- sound: the sheet is wound in; the sea is under everything (muffled, through the hull)
  ctx.sfx('dos-paper-lay', 0.02, { lu: -16 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration + 0.3, lu: -24, fade: 1.2 });

  // ---- camera
  const tCuba = RUN.pos.chars.find(c => c.ch === 'C' && c.i > 6).t;
  const follow = (tg, s) => {
    let x = 0, y = 0; for (let k = 0; k < 12; k++) { const p = pos(tg - k * 0.03); x += p.x; y += p.y; } x /= 12; y /= 12;
    return P ? { x: 545 + 0.05 * (x - 150), y: y + 150 / s } : { x: 830 + 0.08 * (x - 600), y: y - 10 / s };
  };
  const keys = P
    ? [{ t: 0, x: 545, y: 1000, s: 1.0, follow: 0.6 }, { t: 0.5, x: 545, y: 820, s: 1.0, follow: 1 }, { t: 6.15, s: 1.0, follow: 1 },
      { t: 6.9, x: 560, y: 1250, s: 1.04, follow: 0 }, { t: 9, x: 560, y: 1270, s: 1.06, follow: 0 }]
    : [{ t: 0, x: 830, y: 760, s: 1.12, follow: 0.6 }, { t: 0.5, x: 830, y: 600, s: 1.12, follow: 1 }, { t: 6.15, s: 1.12, follow: 1 },
      { t: 6.9, x: 1640, y: 760, s: 1.25, follow: 0 }, { t: 9, x: 1650, y: 765, s: 1.3, follow: 0 }];

  return {
    update(t) {
      const tg = t + ctx.start;
      for (const r of runs) r.update(tg);
      subX.update(tg);
      const c = camAt(tg, keys, follow);
      const j = strikeJolt(tg, RUN ? [RUN.date, RUN.vessel, RUN.pos] : []);
      V.cam(c.x, c.y - j * 0.8, c.s, c.rot);
      V.grain(tg);
      V.cull();
    },
  };
}
