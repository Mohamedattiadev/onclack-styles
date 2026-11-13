// Scene 4 — PEAK + RESOLUTION. Push into the empty third box; the name is engraved on "Vasili Arkhipov"; a held breath;
// on "no" one press stroke: the serial-red NO overprint and its perforation are punched through the note (the sheet
// jolts, the desk shows through the holes). Pull back to the whole note; on "forty years later" the numbering wheels
// in the cartouche roll 1962 → 2002.
// intent: KNOW Arkhipov said no; known 40 years later · FEEL held breath → release · SEE the punched red NO.
// truth: name/role = documented; the NO stamp = VO (symbolic); 2002 = when his role became widely known (approx.).
// shots: 4A PUSH /m into box 3 · 4B HOLD on the NO (1.5 s breathing room) · 4C PULL to the full note, wheels roll.
import { voteNote, TV } from '../shared/vote.js';

export default function (root, ctx) {
  const vote = voteNote(root, ctx, { id: 's4' });
  const s = x => x - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: s(TV.no) - 0.6, lu: -26, fade: 0.6 });
  ctx.sfx('eng-breath-in', s(TV.no) - 1.05, { lu: -21 });
  ctx.sfx('eng-press-thump', s(TV.no) - 0.12 + 0.03, { lu: -5 });
  ctx.sfx('eng-sheet-slide', s(22.75), { lu: -20 });
  ctx.sfx('eng-stamp-tap', s(TV.roll) - 0.08 + 0.33, { lu: -18 });
  ctx.sfx('eng-stamp-tap', s(TV.roll) - 0.08 + 0.86, { lu: -15 });
  return { update(t) { vote.update(ctx.start + t); } };
}
