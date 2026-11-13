// Word cues from words.json (global seconds). Visuals land 1–2 frames before their word.
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
export const wordAt = (words, w, n = 0, fb = 0) => words.filter(x => norm(x.word) === norm(w))[n]?.start ?? fb;
export const F = 1 / 30;
/** Switch a tube on: relay click on the switch frame (+1 f), returns global on-time. */
export function switchOn(ctx, tGlobal, { sfx = 'neon-relay-01', lu = -17 } = {}) {
  if (sfx) ctx.sfx(sfx, tGlobal - ctx.start + F, { lu });
  return tGlobal;
}
