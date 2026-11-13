// Scene 1 — HOOK. ECU: a guilloche rosette is turned on the lathe, the date engraves into the cartouche
// ("October 27 … 1962") → pull out to the whole note while the burin sweeps the seascape in; the boat swells out of
// the deep lines on "submarine"; Cuba rises on the horizon on "Cuba".
// intent: KNOW date + place · FEEL quiet unease · SEE the boat appearing as darker lines in the deep.
// truth: seascape = RC (our engraving, not a record; position approximate). Date/numerals = VO.
// shots: 1A ECU seal (hook detail) · 1B PULL /m to the full note (camera token) · 1C CREEP into the vignette.
import { seaNote, camPath, TS } from '../shared/sea.js';

export default function (root, ctx) {
  const sea = seaNote(root, ctx, { id: 's1' });
  const ecu = sea.frame('ecu'), full = sea.frame('full'), vig = sea.frame('vig');
  const keys = [[0, ecu], [TS.pull, full, 1.8], [4.7, vig, 2.6]];
  // sound: the sheet is laid on the desk; the sea comes in (J-cut) as the vignette is engraved
  ctx.sfx('eng-sheet-lay', 0.0, { lu: -16 });
  ctx.sfx('eng-press-thump', TS.year - 0.12 + 0.02, { lu: -15 });
  ctx.ambience('sea-water-close-01', { from: TS.engr - 0.4, to: ctx.duration, lu: -17, fade: 1.2 });
  return {
    update(t) {
      const T = ctx.start + t;
      const c = camPath(T, keys);
      sea.update(T, { ...c, z: c.z * (1 + Math.max(0, T - 6.5) * 0.004) });
    },
  };
}
