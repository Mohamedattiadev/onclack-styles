// TYPED DOSSIER — the typing plan. PURE (no DOM): used by the scenes (picture) AND by build-typing.mjs (sound),
// so every key strike you see has its own recorded strike on the same frame.
// All times are GLOBAL seconds (words.json times; voice starts at 0.5 s, already inside words.json).
// Typed values are the SAME in every format (the mix is shared); only their positions differ (layout in the scenes).

// seeded random (same formula as /engine/lib/anim.js rand, copied so Node can import this file without the engine)
export const rnd = s => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

export const FPS = 30;
export const CR_TIME = 0.3;             // carriage return glide (s)
export const BOOMS = [8.95, 10.62];     // distant practice depth charges (S2) — the hand flinches, a letter jumps
export const STAMPS = { noReply: 13.02, public: 24.44 };

// field = an anchor the scene places in world px; parts = [text, earliest global start]
export const RUNS = [
  // S1 · report sheet
  { id: 'date', sheet: 's1', field: 'date', cps: 15, parts: [['OCTOBER ', 0.54], ['27, ', 1.06], ['1962', 2.03]] },
  { id: 'vessel', sheet: 's1', field: 'vessel', cps: 16, parts: [['SOVIET ', 3.73], ['SUBMARINE', 4.25]] },
  { id: 'pos', sheet: 's1', field: 'pos', cps: 15, parts: [['DEEP, ', 5.37], ['NEAR ', 6.17], ['CUBA', 6.47]] },
  // S2 · carbon copy (blue)
  { id: 'over', sheet: 's2', field: 'over', cps: 16, ink: 'blue', parts: [['ABOVE: ', 7.5], ['U.S. ', 8.02], ['SHIPS', 8.56]] },
  { id: 'drop', sheet: 's2', field: 'drop', cps: 20, ink: 'blue', parts: [['PRACTICE ', 9.23], ['DEPTH ', 9.75], ['CHARGES', 10.02]] },
  { id: 'moscow', sheet: 's2', field: 'moscow', cps: 17, ink: 'blue', parts: [['MOSCOW: ', 10.88], ['SILENT ', 11.88], ['FOR DAYS', 12.33]] },
  // S3 · consent form
  { id: 'weapon', sheet: 'form', field: 'weapon', cps: 18, parts: [['1 ', 14.14], ['NUCLEAR ', 14.43], ['TORPEDO', 14.84]] },
  { id: 'rule', sheet: 'form', field: 'rule', cps: 18, parts: [['3 ', 16.47], ['OFFICERS ', 16.83], ['MUST AGREE', 17.37]] },
  { id: 'yes1', sheet: 'form', field: 'ans1', cps: 16, parts: [['YES', 18.26]] },
  { id: 'yes2', sheet: 'form', field: 'ans2', cps: 16, move: 'feed', parts: [['YES', 18.76]] },
  // S4 · the third answer, red half of the ribbon, struck twice
  { id: 'no', sheet: 'form', field: 'ans3', cps: 8, ink: 'red', overstrike: true, move: 'feed', moveAt: 21.45, parts: [['NO', 21.86]] },
];

/** Schedule every run: chars with global times, plus carriage events. Deterministic. */
export function schedule() {
  const out = [];
  let prevEnd = -1, prevRun = null;
  RUNS.forEach((run, ri) => {
    const chars = [];
    let t = -1;
    const sameSheet = prevRun && prevRun.sheet === run.sheet;
    run.parts.forEach(([text, at], pi) => {
      // a new line needs the carriage back first
      const minStart = pi === 0 && sameSheet ? prevEnd + CR_TIME + 0.04 : t + 0.03;
      t = Math.max(at, minStart);
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const k = ri * 100 + chars.length;
        chars.push({ ch, t, i: chars.length, jolt: BOOMS.some(b => t >= b && t < b + 0.14) });
        let dt = (1 / run.cps) * (0.7 + 0.6 * rnd(k * 1.37 + 3));
        if (ch === ' ') dt *= 1.25;
        if (rnd(k * 2.11 + 9) > 0.93) dt += 0.05;          // a small hesitation now and then
        t += dt;
      }
    });
    const last = chars[chars.length - 1];
    const end = last.t + (run.overstrike ? 0.1 : 0) + 0.04;
    out.push({ ...run, chars, start: chars[0].t, end, ink: run.ink ?? 'black' });
    prevEnd = end; prevRun = run;
  });
  // carriage events between runs of the same sheet: return (big move left) or line feed
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1], b = out[i];
    if (a.sheet !== b.sheet) continue;
    b.carriageFrom = { run: a.id, at: b.moveAt ?? a.end + 0.03, kind: b.move ?? 'return' };
  }
  return out;
}

/** Every audible event for the sound build: strikes (key/space) and carriage returns. */
export function soundEvents() {
  const ev = [];
  for (const r of schedule()) {
    r.chars.forEach((c, j) => {
      const k = r.id.length * 31 + j;
      ev.push({ kind: c.ch === ' ' ? 'space' : 'key', t: c.t, seed: k, loud: c.jolt ? 1.25 : 1, ink: r.ink });
      if (r.overstrike && c.ch !== ' ') ev.push({ kind: 'key', t: c.t + 0.09, seed: k + 7, loud: 1.1 });
    });
    if (r.carriageFrom) ev.push({ kind: r.carriageFrom.kind, t: r.carriageFrom.at });
  }
  return ev.sort((a, b) => a.t - b.t);
}
