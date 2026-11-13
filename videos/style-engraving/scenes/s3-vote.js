// Scene 3 — THE RULE. A new note is laid down: the burin engraves a dark field and a nuclear torpedo is carved out of it
// as light on "nuclear"; on "three officers" the camera tilts to three numbered serial stamps (Nº 001–003, printed in
// serial red); "Two say yes" → two green-black YES stamps land, box 3 stays empty.
// intent: KNOW one weapon, three keys, two yes · FEEL the rule closing in · SEE the empty third box.
// truth: torpedo = RC (labelled "reconstruction"); the vote = VO, with an honesty line (accounts differ).
// shots: 3A MS torpedo vignette (PUSH/s creep) · 3B TILT down (camera token 0.95 s) to the three boxes, hold.
import { voteNote, TV } from '../shared/vote.js';

export default function (root, ctx) {
  const vote = voteNote(root, ctx, { id: 's3' });
  const s = x => x - ctx.start;
  ctx.sfx('eng-sheet-lay', 0.0, { lu: -14 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -26, fade: 1.0 }); // the sea, heard through the hull
  ctx.sfx('eng-stamp-tap', s(TV.nums) - 0.08 + 0.02, { lu: -17 });
  ctx.sfx('eng-stamp-hit', s(TV.yes1) - 0.07 + 0.03, { lu: -9 });
  ctx.sfx('eng-stamp-hit', s(TV.yes2) - 0.07 + 0.03, { lu: -10 });
  return { update(t) { vote.update(ctx.start + t); } };
}
