import { FORMATS, formatList, makeLayout } from './lib/formats.js';

// Composition runtime: loads a composition, mounts its scenes, and exposes
// window.__comp.seek(t). Every scene must be a pure function of time, so the
// live preview and the frame-by-frame render always show the same picture.

function report(type, message) {
  try { parent.postMessage({ type, message: String(message) }, '*'); } catch {}
}
window.addEventListener('error', e => report('comp-error', e.message + (e.filename ? ` (${e.filename.split('/').slice(-2).join('/')}:${e.lineno})` : '')));
window.addEventListener('unhandledrejection', e => report('comp-error', e.reason?.stack || e.reason));

async function waitForImages(root) {
  const imgs = [...root.querySelectorAll('img, image')];
  await Promise.all(imgs.map(img => {
    if (img.tagName.toLowerCase() === 'img') {
      return img.complete ? img.decode?.().catch(() => {}) : new Promise(r => { img.onload = img.onerror = r; });
    }
    return Promise.resolve();
  }));
}

export async function boot(compUrl) {
  const compHref = new URL(compUrl, location.href);
  const base = new URL('.', compHref);
  const comp = (await import(compHref.href)).default;
  const formats = formatList(comp);
  const wanted = new URLSearchParams(location.search).get('format');
  const format = formats.includes(wanted) ? wanted : formats[0];
  const layout = makeLayout(format);
  const { width, height } = layout;
  const fps = comp.fps ?? 30;

  const stage = document.getElementById('stage');
  stage.style.width = width + 'px';
  stage.style.height = height + 'px';
  if (comp.background) stage.style.background = comp.background;
  stage.dataset.format = format;
  stage.classList.add(layout.portrait ? 'portrait' : 'landscape');
  // CSS can use these too: calc(var(--u) * 40) = 40 design px
  Object.entries({ '--u': layout.unit + 'px', '--safe-x': layout.safe.x + 'px', '--safe-y': layout.safe.y + 'px', '--safe-w': layout.safe.w + 'px', '--safe-h': layout.safe.h + 'px' })
    .forEach(([k, v]) => stage.style.setProperty(k, v));

  // Load every font BEFORE scenes are built, so measurements (getBBox, fitText) use the real font.
  await Promise.all([...document.fonts].map(f => f.load().catch(() => {})));
  await document.fonts.ready;

  // Optional voice word timings: words.json = [{ word, start, end, para? }]
  let words = [];
  const wordsSrc = comp.words ?? 'words.json';
  try {
    const r = await fetch(new URL(wordsSrc, base).href, { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); words = Array.isArray(j) ? j : j.words ?? []; }
  } catch {}

  // Sound effects library: global assets/sfx/sfx.json + optional per-video assets/sfx/sfx.json (video wins).
  const sfxLib = new Map();
  // `file` in sfx.json is relative to the project root (global lib) or to the video folder (video lib) — not to sfx.json.
  for (const [libUrl, fileBase] of [[new URL('/onclack-styles/assets/sfx/sfx.json', location.href), new URL('/onclack-styles/', location.href)], [new URL('assets/sfx/sfx.json', base), new URL(base)]]) {
    try {
      const r = await fetch(libUrl.href, { cache: 'no-store' });
      if (!r.ok) continue;
      const j = await r.json();
      for (const e of (Array.isArray(j) ? j : j.sounds ?? [])) if (e.id && e.file) sfxLib.set(e.id, { ...e, url: new URL(e.file, fileBase).href });
    } catch {}
  }
  const cues = [], warnings = [];
  const VOICE_LUFS = -16, DEFAULT_LU = { ambience: -13, roomtone: -35, sfx: -10 };
  const resolveSound = idOrSrc => {
    if (sfxLib.has(idOrSrc)) return sfxLib.get(idOrSrc);
    if (/\.(wav|mp3|ogg|flac|m4a)$/i.test(idOrSrc)) return { id: idOrSrc, url: new URL(idOrSrc, base).href };
    warnings.push(`Unknown sound "${idOrSrc}" (not in assets/sfx/sfx.json)`);
    return null;
  };
  /** Register a sound cue (global seconds). Called while scenes are built — never inside update().
   *  Level: `lu` = loudness relative to the voice (voice stem ≈ −16 LUFS; library clips are stored at −23 LUFS unless
   *  sfx.json has `lufs`). Defaults (docs/research-senior-audio.md): beds −13 LU in pauses (→ −20 under speech after the
   *  −7 dB duck), room tone −35, one-shots −10. An explicit `volume` without `lu` keeps the old linear level; with `lu`
   *  it is an extra trim. */
  const addCue = (idOrSrc, at, opts = {}) => {
    const snd = resolveSound(idOrSrc);
    if (!snd) return;
    const role = opts.role ?? 'sfx';
    const lu = opts.lu ?? (opts.volume == null ? DEFAULT_LU[role] ?? DEFAULT_LU.sfx : null);
    const volume = lu == null ? opts.volume
      : +(Math.pow(10, (VOICE_LUFS + lu - (snd.lufs ?? -23)) / 20) * (opts.volume ?? 1)).toFixed(4);
    cues.push({
      src: snd.id, url: snd.url, start: Math.max(0, at), role, volume, lu,
      duration: opts.duration ?? null, loop: !!opts.loop, fadeIn: opts.fadeIn ?? 0, fadeOut: opts.fadeOut ?? 0,
      license: snd.license ?? null,
    });
  };
  for (const c of comp.sfx ?? []) addCue(c.id ?? c.src, c.at ?? c.start ?? 0, c);

  const scenes = [];
  for (const [i, s] of comp.scenes.entries()) {
    const mod = await import(new URL(s.module, base).href);
    const factory = mod.default ?? mod.create;
    const el = document.createElement('div');
    el.className = 'scene';
    el.dataset.id = s.id;
    el.style.zIndex = String(s.z ?? i + 1);
    el.style.visibility = 'hidden'; // laid out (measurable) while building, but not visible
    stage.appendChild(el);
    const ctx = {
      width, height, fps, layout, format,
      duration: s.duration,
      props: s.props ?? {},
      start: s.start,
      words, // all words (global times); use ctx.wordsIn(a, b) for this scene
      wordsIn: (a = s.start, b = s.start + s.duration) => words.filter(w => w.start >= a && w.start < b),
      asset: p => new URL(p, base).href,
      /** Sound effect at scene-local time t: ctx.sfx('door-close', 1.2, { volume: 0.6 }) */
      sfx: (id, t = 0, opts = {}) => addCue(id, s.start + t, { ...opts, role: opts.role ?? 'sfx' }),
      /** Looping ambience bed for (part of) the scene: ctx.ambience('wind', { from: 0, to: ctx.duration, volume: 0.3 }) */
      ambience: (id, { from = 0, to = s.duration, volume, lu, fade = 0.8 } = {}) =>
        addCue(id, s.start + from, { role: 'ambience', loop: true, duration: Math.max(0.1, to - from), volume, lu, fadeIn: fade, fadeOut: fade }),
    };
    const inst = (await factory(el, ctx)) ?? {};
    el.style.display = 'none';
    el.style.visibility = '';
    scenes.push({ ...s, el, inst, end: s.start + s.duration });
  }

  await document.fonts.ready;
  await waitForImages(stage);

  const duration = comp.duration ?? Math.max(...scenes.map(s => s.end));

  // Room tone under the whole video ("silence is never digital zero"). composition.js: roomtone: '<sfx id>' | false.
  const roomtone = comp.roomtone === undefined ? 'roomtone-city-window-01' : comp.roomtone;
  if (roomtone && (sfxLib.has(roomtone) || comp.roomtone)) addCue(roomtone, 0, { role: 'roomtone', loop: true, duration, fadeIn: 0.5, fadeOut: 0.5 });

  // Ducking windows from the words (beds only, deterministic): phrases = words joined over gaps < minGap.
  // Bed is −7 dB from `pre` s before a phrase to `post` s after it; renderer + studio both use duckGain().
  // minGap 0.8 = post + rampUp + pre: a shorter gap would give a half swell (+6 dB for 0.3 s = audible pumping).
  const duck = { depth: 0.447, pre: 0.25, rampDown: 0.2, post: 0.15, rampUp: 0.4, minGap: 0.8, phrases: [] };
  for (const w of words) {
    const last = duck.phrases[duck.phrases.length - 1];
    if (last && w.start - last[1] < duck.minGap) last[1] = Math.max(last[1], w.end);
    else duck.phrases.push([w.start, w.end]);
  }

  function seek(t) {
    t = Math.max(0, Math.min(duration, t));
    for (const s of scenes) {
      const active = t >= s.start && (t < s.end || (t === duration && s.end === duration));
      if (active) {
        if (s.el.style.display === 'none') s.el.style.display = '';
        const local = t - s.start;
        s.inst.update?.(local, local / s.duration, t);
      } else if (s.el.style.display !== 'none') {
        s.el.style.display = 'none';
      }
    }
  }

  const meta = {
    title: comp.title ?? '',
    width, height, fps, duration, format, formats,
    formatInfo: Object.fromEntries(formats.map(f => [f, { label: FORMATS[f].label, short: FORMATS[f].short, width: FORMATS[f].width, height: FORMATS[f].height, maxDuration: FORMATS[f].maxDuration ?? null }])),
    safe: layout.safe, zones: FORMATS[format].zones,
    audio: [
      ...(comp.audio ?? []).map(a => ({
        src: a.src, url: new URL(a.src, base).href, start: a.start ?? 0, volume: a.volume ?? 1,
        role: a.role ?? 'voice', duration: a.duration ?? null, loop: !!a.loop, fadeIn: a.fadeIn ?? 0, fadeOut: a.fadeOut ?? 0,
      })),
      ...cues.sort((a, b) => a.start - b.start),
    ],
    warnings,
    words,
    duck,
    motionBlur: comp.motionBlur ?? true,   // false = never supersample this video
    scenes: scenes.map(s => ({ id: s.id, start: s.start, duration: s.duration, label: s.label ?? s.id, module: new URL(s.module, base).pathname })),
  };

  for (const w of warnings) console.warn('[comp] ' + w);
  seek(0);
  /** Largest on-screen travel (px) of any visible element between t and t+dt (edges of its box, so scale and rotation
   *  count too). The renderer uses it to decide which frames get real motion blur. Leaves the stage at t+dt. */
  function travel(t, dt) {
    const boxes = () => {
      const out = new Map();
      for (const s of scenes) if (s.el.style.display !== 'none') for (const e of s.el.querySelectorAll('*')) {
        const r = e.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) out.set(e, r);
      }
      return out;
    };
    seek(t); const a = boxes();
    seek(t + dt); const b = boxes();
    let max = 0;
    for (const [e, r] of a) {
      const q = b.get(e); if (!q) continue;
      const d = Math.max(Math.abs(q.left - r.left), Math.abs(q.right - r.right), Math.abs(q.top - r.top), Math.abs(q.bottom - r.bottom));
      if (d > max && d < width) max = d;                  // > width = a jump (cut), not a move
    }
    return max;
  }

  window.__comp = { meta, seek, travel };
  report('comp-ready', comp.title ?? '');
  return window.__comp;
}
