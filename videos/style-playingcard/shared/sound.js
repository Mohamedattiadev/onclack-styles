// Card sounds from the global library. Library files start with silence, so each cue is placed so that its
// transient lands on the visual hit: page-turn-01 snaps at ~0.86 s, drawer-close-01 knocks at ~0.85 s, cloth-shake-01 brushes at 0.1–0.35 s.
// kinds: deal (paper snap as the card lands), flip (same snap, a bit louder), slide (card brushed over wool), slap (hard landing).
export function cardSounds(ctx, ...cues) {
  for (const [kind, tg] of cues) {
    const t = tg - ctx.start;
    if (kind === 'deal') ctx.sfx('page-turn-01', t - 0.86, { lu: -19, duration: 1.05, fadeOut: 0.12 });
    else if (kind === 'flip') ctx.sfx('page-turn-01', t - 0.86, { lu: -14, duration: 1.1, fadeOut: 0.15 });
    else if (kind === 'slide') ctx.sfx('cloth-shake-01', t - 0.05, { lu: -24, duration: 0.5, fadeOut: 0.15 });
    else if (kind === 'slap') ctx.sfx('drawer-close-01', t - 0.85, { lu: -15, duration: 1.0, fadeOut: 0.1 });
  }
}
