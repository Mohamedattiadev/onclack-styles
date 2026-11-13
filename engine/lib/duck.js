// Deterministic bed ducking from words.json (docs/research-senior-audio.md §3.3). Shared by the renderer and the studio.
// duck = meta.duck = { depth, pre, rampDown, post, rampUp, phrases: [[start, end], …] } (global seconds).
const cos = x => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));   // 0→1 equal-ish S ramp

/** Gain (0..1) for a bed at global time t: 1 in pauses, `depth` under speech, cosine ramps. */
export function duckGain(t, duck) {
  if (!duck?.phrases?.length) return 1;
  let g = 1;
  for (const [s, e] of duck.phrases) {
    const a = s - duck.pre, b = e + duck.post;
    if (t < a || t > b + duck.rampUp) continue;
    const down = cos((t - a) / duck.rampDown), up = 1 - cos((t - b) / duck.rampUp);
    const k = t <= b ? down : up;                       // 0 = full level, 1 = fully ducked
    g = Math.min(g, 1 - (1 - duck.depth) * k);
  }
  return g;
}

/** Envelope samples for [from, from+len] at `rate` Hz (renderer writes it as raw f32 and multiplies the bed bus). */
export function duckEnvelope(duck, from, len, rate = 1000) {
  const n = Math.ceil(len * rate), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = duckGain(from + i / rate, duck);
  return out;
}
