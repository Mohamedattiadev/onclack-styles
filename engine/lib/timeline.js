// Timeline helpers for composition.js files.

/**
 * Place scenes one after another. Each item needs `duration`; optional
 * `overlap` (seconds it starts before the previous scene ends, for transitions).
 * Returns new objects with `start` filled in.
 */
export function sequence(items, startAt = 0) {
  let t = startAt;
  return items.map(item => {
    const start = Math.max(0, t - (item.overlap ?? 0));
    t = start + item.duration;
    return { ...item, start };
  });
}

/** Load words.json next to the composition (voice word timings). Use with top-level await. */
export async function loadWords(compUrl) {
  try { const r = await fetch(new URL('words.json', compUrl), { cache: 'no-store' }); return r.ok ? await r.json() : []; }
  catch { return []; }
}

/**
 * Time scenes from the voice: scene i covers paragraph `para` (default i) of words.json.
 * Each scene starts `lead` s before its first word and lasts until the next scene starts (+ overlap);
 * the last scene ends `tail` s after the last word. Falls back to each item's `duration` without words.
 */
export function fromVoice(words, items, { lead = 0.35, tail = 0.9, overlap = 0.5 } = {}) {
  if (!words?.length) return sequence(items);
  const paraStart = p => words.find(w => w.para === p)?.start;
  const paraEnd = p => [...words].reverse().find(w => w.para === p)?.end;
  const starts = items.map((it, i) => (i === 0 ? 0 : Math.max(0, (paraStart(it.para ?? i) ?? 0) - lead)));
  return items.map((it, i) => {
    const end = i < items.length - 1 ? starts[i + 1] + overlap : (paraEnd(it.para ?? i) ?? starts[i] + it.duration) + tail;
    return { ...it, start: +starts[i].toFixed(3), duration: +(end - starts[i]).toFixed(3) };
  });
}
