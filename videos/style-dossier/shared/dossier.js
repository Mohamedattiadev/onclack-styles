// TYPED DOSSIER — shared kit: paper, typed glyphs, carriage camera, stamps, clips, tape.
// Imperfection is designed once per object (seeded by id), never per frame. Only the camera and the typist move.
import { el, svg, rand, clamp, lerp, ease, smootherstep, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { schedule, CR_TIME, FPS } from './plan.js';

export const PAL = {
  paper: '#ECE7D9',        // onion-skin
  paperShade: '#E3DDCC',
  ink: '#1E1C1A',          // typewriter black (never pure black)
  blue: '#2C3C8A',         // carbon blue
  red: '#B3252A',          // stamp red / red half of the ribbon
  manila: '#D3B97F',
  manilaEdge: '#B89B5E',
  desk: '#34322E',
  print: '#2A2724',        // printed form labels (offset litho, slightly warmer than ribbon ink)
};
export const RGB = { ink: '30,28,26', blue: '44,60,138', red: '179,37,42', shadow: '22,26,36' };
export const FONT = { type: "'Courier Prime', monospace", print: "'Sofia Sans Extra Condensed', sans-serif" };
export const TS = 56;                  // typewriter size in world px (10 pitch at our page scale)
export const CW = TS * 0.6;            // Courier Prime advance = 0.6 em → a true character grid
export const PLAN = schedule();
export const RUN = Object.fromEntries(PLAN.map(r => [r.id, r]));
export const F = 1 / FPS;

/** local word time (scene seconds) — visuals land 2 frames before */
export const wordAt = (ctx, w, n = 0) => {
  const hits = ctx.words.filter(x => x.word.toLowerCase().replace(/[^a-z0-9-]/g, '') === w.toLowerCase());
  return (hits[n] ?? hits[0])?.start - ctx.start;
};

// ---------------------------------------------------------------- paper textures (built once, cached)
const texCache = {};
function paperTexture(kind) {
  if (texCache[kind]) return texCache[kind];
  const N = 420, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  const R = (i) => rand(i * 1.731 + (kind === 'manila' ? 77 : 3));
  g.clearRect(0, 0, N, N);
  // soft clouds (formation of the sheet)
  for (let i = 0; i < 260; i++) {
    const x = R(i) * N, y = R(i + 999) * N, r = 10 + R(i + 555) * 46, a = 0.018 + R(i + 77) * 0.025;
    const dark = R(i + 31) > 0.5;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, dark ? `rgba(90,80,60,${a})` : `rgba(255,255,250,${a * 1.4})`); grd.addColorStop(0.5, dark ? `rgba(90,80,60,${a * 0.5})` : `rgba(255,255,250,${a * 0.7})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { g.save(); g.translate(ox, oy); g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); }
  }
  // fibres
  for (let i = 0; i < (kind === 'manila' ? 900 : 520); i++) {
    const x = R(i + 3000) * N, y = R(i + 4000) * N, len = 3 + R(i + 5000) * (kind === 'manila' ? 14 : 9), an = R(i + 6000) * Math.PI * 2;
    g.strokeStyle = R(i + 7000) > 0.35 ? `rgba(80,70,50,${0.05 + R(i) * 0.08})` : `rgba(255,255,255,${0.12 + R(i) * 0.12})`;
    g.lineWidth = 0.6 + R(i + 8000) * 0.6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(an + 0.6) * len * 0.5, y + Math.sin(an + 0.6) * len * 0.5, x + Math.cos(an) * len, y + Math.sin(an) * len); g.stroke();
  }
  // specks
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(60,50,40,${0.08 + R(i + 9000) * 0.18})`; g.fillRect(R(i + 9100) * N, R(i + 9200) * N, 1 + R(i + 9300) * 1.2, 1 + R(i + 9400) * 1.2); }
  texCache[kind] = c.toDataURL('image/png');
  return texCache[kind];
}
let grainUrl = null;
function grainTexture() {
  if (grainUrl) return grainUrl;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), im = g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) { const v = Math.floor(rand(i * 0.917 + 11) * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  return (grainUrl = c.toDataURL('image/png'));
}
/** speckle mask for rubber-stamp ink (uneven pressure + pin holes), seeded */
function stampMask(w, h, seed) {
  const c = document.createElement('canvas'); c.width = Math.ceil(w / 2); c.height = Math.ceil(h / 2);
  const g = c.getContext('2d');
  const pressure = g.createLinearGradient(0, 0, c.width, c.height * 0.4);
  pressure.addColorStop(0, 'rgba(0,0,0,1)'); pressure.addColorStop(0.55, 'rgba(0,0,0,0.92)'); pressure.addColorStop(1, 'rgba(0,0,0,0.62)');
  g.fillStyle = pressure; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < (c.width * c.height) / 55; i++) {
    const x = rand(seed * 13 + i * 1.1) * c.width, y = rand(seed * 17 + i * 2.3) * c.height, r = 0.4 + rand(seed + i * 3.7) ** 3 * 3.2;
    g.fillStyle = `rgba(0,0,0,${0.35 + rand(seed + i * 5.3) * 0.65})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // one dry streak where the pad ran thin
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath(); g.ellipse(c.width * (0.65 + rand(seed) * 0.2), c.height * 0.7, c.width * 0.22, c.height * 0.12, -0.2, 0, Math.PI * 2); g.fill();
  return c.toDataURL('image/png');
}

// ---------------------------------------------------------------- view + camera
export function makeView(root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height;
  const view = el('div', { 'data-name': 'View', style: { position: 'absolute', inset: 0, overflow: 'hidden', background: PAL.desk } }, root);
  // desk: dark linoleum with a soft grain (only seen at the edges of wide shots)
  el('div', { 'data-name': 'Desk', style: { position: 'absolute', inset: 0, backgroundImage: `url(${paperTexture('manila')})`, opacity: 0.18, mixBlendMode: 'multiply' } }, view);
  const world = el('div', { 'data-name': 'World', style: { position: 'absolute', left: 0, top: 0, width: '10px', height: '10px', transformOrigin: '0 0' } }, view);
  // one key light, upper left: a broad warm fall-off (not a vignette — the light has a direction)
  el('div', { 'data-name': 'Key light', style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(${L.portrait ? 160 : 128}deg, rgba(255,250,235,0.10) 0%, rgba(255,250,235,0) 38%, rgba(${RGB.shadow},0) 55%, rgba(${RGB.shadow},0.16) 100%)` } }, view);
  const grain = el('div', { 'data-name': 'Film grain', style: { position: 'absolute', inset: '-256px', pointerEvents: 'none', backgroundImage: `url(${grainTexture()})`, opacity: 0.045, mixBlendMode: 'overlay' } }, view);
  return {
    view, world, W, H, L,
    cam(x, y, s, rot = 0) {
      world.style.transform = `translate(${(W / 2).toFixed(2)}px,${(H / 2).toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${s.toFixed(4)}) translate(${(-x).toFixed(2)}px,${(-y).toFixed(2)}px)`;
    },
    /** Text never sits in the platform UI: letters fade out over the last 40 px before the safe-area edge
     *  (like the key light falling off), so a camera that follows the carriage never shows half-cut words in the UI zones. */
    cull() {
      if (!this._txt) this._txt = [...view.querySelectorAll('*')].filter(n => [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()));
      const sf = L.safe, R = 40, out = [];
      for (const n of this._txt) {
        const r = n.getBoundingClientRect();
        if (r.width < 2) { out.push(null); continue; }
        const d = Math.min(r.left - sf.x, r.top - sf.y, sf.x + sf.w - r.right, sf.y + sf.h - r.bottom);
        out.push(d >= R ? 1 : d <= 0 ? 0 : d / R);
      }
      this._txt.forEach((n, i) => {
        if (out[i] == null) return;
        if (n._baseOp == null) n._baseOp = n.style.opacity === '' ? 1 : +n.style.opacity;
        const v = (n._baseOp * out[i]).toFixed(3);
        if (n.style.opacity !== v) n.style.opacity = v;
      });
    },
    grain(tg) { const f = Math.floor(tg * FPS); grain.style.transform = `translate(${Math.floor(rand(f * 1.3) * 256)}px,${Math.floor(rand(f * 2.7 + 5) * 256)}px)`; },
  };
}

/** Camera path: keys [{ t, x, y, s, follow }] (global t). Between keys: smootherstep. follow 0..1 blends to a
 *  carriage-follow target given by followFn(tg) → {x, y}. */
export function camAt(tg, keys, followFn) {
  let a = keys[0], b = keys[0], p = 0;
  for (let i = 1; i < keys.length; i++) {
    if (tg <= keys[i].t) { a = keys[i - 1]; b = keys[i]; p = smootherstep((tg - a.t) / (b.t - a.t)); break; }
    a = b = keys[i];
  }
  const m = (k, d) => lerp(a[k] ?? d, b[k] ?? d, p);
  let x = m('x', 0), y = m('y', 0);
  const s = m('s', 1), fw = m('follow', 0), rot = m('rot', 0);
  if (fw > 0 && followFn) { const f = followFn(tg, s); x = lerp(x, f.x, fw); y = lerp(y, f.y, fw); }
  return { x, y, s, rot };
}

/** noise shake (never a per-frame sign flip) */
export function quake(tg, t0, amp, decay = 0.5, seed = 1) {
  const dt = tg - t0;
  if (dt < 0 || dt > decay) return [0, 0];
  const k = amp * (1 - dt / decay) ** 2;
  return [k * noise1(dt * 38, seed), k * noise1(dt * 41, seed + 9)];
}

// ---------------------------------------------------------------- sheets
export function sheet(parent, { x, y, w, h, rot = 0, name, kind = 'onion', z = 0, shadow = 1, bleed = null }) {
  const bg = kind === 'manila' ? PAL.manila : kind === 'slip' ? '#E9E1CB' : PAL.paper;
  const s = el('div', {
    'data-name': name, style: {
      position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: z,
      transform: `rotate(${rot}deg)`, transformOrigin: '50% 50%',
      background: `url(${paperTexture(kind === 'manila' ? 'manila' : 'onion')}), ${bg}`,
      boxShadow: shadow ? `0 ${2 * shadow}px ${3 * shadow}px rgba(${RGB.shadow},0.30), ${16 * shadow}px ${26 * shadow}px ${46 * shadow}px rgba(${RGB.shadow},0.24)` : 'none',
    },
  }, parent);
  if (kind === 'onion') {
    // onion-skin is thin: the typing on the back shows through, mirrored and faint
    if (bleed) {
      const b = el('div', { 'data-name': 'Show-through (back of sheet)', style: { position: 'absolute', left: '8%', top: '30%', width: '84%', transform: 'scaleX(-1)', fontFamily: FONT.type, fontSize: TS * 0.9 + 'px', lineHeight: 1.7, color: PAL.ink, opacity: 0.03, whiteSpace: 'pre', filter: 'blur(1.6px)' } }, s);
      b.textContent = bleed;
    }
    // slight cockle: light from upper left on a sheet that is not quite flat
    el('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(170deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 30%, rgba(120,110,90,0.06) 62%, rgba(255,255,255,0.05) 80%, rgba(120,110,90,0.07))' } }, s);
  }
  return s;
}

/** Manila folder with a cut tab; label typed on the tab. */
export function folder(parent, { x, y, w, h, tabX, tabW = 520, label, name = 'Manila folder' }) {
  const f = el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' } }, parent);
  const tabH = 92;
  const shape = `polygon(0 ${tabH}px, ${tabX}px ${tabH}px, ${tabX + 34}px 0, ${tabX + tabW - 34}px 0, ${tabX + tabW}px ${tabH}px, 100% ${tabH}px, 100% 100%, 0 100%)`;
  el('div', { style: { position: 'absolute', inset: 0, background: `url(${paperTexture('manila')}), ${PAL.manila}`, clipPath: shape, filter: `drop-shadow(18px 26px 40px rgba(${RGB.shadow},0.35))` } }, f);
  el('div', { style: { position: 'absolute', inset: 0, clipPath: shape, background: `linear-gradient(180deg, rgba(0,0,0,0) ${tabH}px, rgba(90,70,30,0.10) ${tabH + 2}px, rgba(0,0,0,0) ${tabH + 26}px)` } }, f);
  if (label) {
    const lab = el('div', { 'data-name': 'Folder tab label', style: { position: 'absolute', left: tabX + 60 + 'px', top: '18px', width: tabW - 120 + 'px', height: '58px', background: '#EFE9D8', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' } }, f);
    typed(lab, label, { x: 18, y: 8, size: 38, seed: 901, name: 'Tab label text' });
  }
  return f;
}

// ---------------------------------------------------------------- typed glyphs
const INK_OF = { black: 'ink', blue: 'blue', red: 'red' };
/** Typed text, one span per character on a true monospace grid. times: optional array of global strike times. */
export function typed(parent, text, { x = 0, y = 0, size = TS, ink = 'black', seed = 0, name, times = null, jolts = null, overstrike = false, carbon = false, z = 2 } = {}) {
  const box = el('div', { 'data-name': name ?? `Typed: ${text.slice(0, 24)}`, style: { position: 'absolute', left: x + 'px', top: y + 'px', zIndex: z, fontFamily: FONT.type, fontWeight: 400, fontSize: size + 'px', lineHeight: 1, whiteSpace: 'pre', fontKerning: 'none', filter: carbon ? 'blur(0.55px)' : 'none' } }, parent);
  const rgb = RGB[INK_OF[ink] ?? 'ink'];
  const cw = size * 0.6, k = size / TS;
  const glyphs = [];
  [...text].forEach((ch, i) => {
    if (ch === ' ') { glyphs.push(null); return; }
    const r = q => rand(seed * 101 + i * 7.31 + q);
    const jolt = jolts?.[i];
    const a1 = 0.80 + r(1) * 0.2, a2 = a1 * (0.48 + r(2) * 0.45);           // uneven strike: one side of the letter lighter
    const ang = Math.floor(r(3) * 360);
    const dx = (r(4) - 0.5) * 1.2 * k, dy = (r(5) - 0.5) * 2.2 * k + (jolt ? 7 * k : 0), rot = (r(6) - 0.5) * 2.2 + (jolt ? 3.5 : 0);
    const mk = (extra = {}) => el('span', {
      style: {
        position: 'absolute', left: (i * cw + dx).toFixed(2) + 'px', top: dy.toFixed(2) + 'px', display: 'block',
        transform: `rotate(${rot.toFixed(2)}deg)`,
        backgroundImage: `linear-gradient(${ang}deg, rgba(${rgb},${a1.toFixed(3)}) 30%, rgba(${rgb},${a2.toFixed(3)}) 85%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        textShadow: carbon ? `0 0 ${1.6 * k}px rgba(${rgb},0.55), ${1.4 * k}px ${0.6 * k}px ${1.8 * k}px rgba(${rgb},0.28)` : `0 0 ${0.9 * k}px rgba(${rgb},${(0.28 + r(7) * 0.2).toFixed(2)})`,
        ...extra,
      },
    }, box, ch);
    const g = mk();
    // overstrike: the second blow of the same key lands a hair to the right (drawn as a crisp offset shadow)
    const g2 = overstrike ? { base: g.style.textShadow, hit: `${g.style.textShadow}, ${(1.4 * k).toFixed(2)}px ${(0.7 * k).toFixed(2)}px 0 rgba(${rgb},${(a1 * 0.9).toFixed(2)})` } : null;
    glyphs.push({ g, g2, t: times ? times[i] : -1e9, shown: null, hit: null });
  });
  return {
    box, cw, width: text.length * cw,
    update(tg) {
      for (const gl of glyphs) {
        if (!gl) continue;
        const on = tg >= gl.t - 1e-6;
        if (on !== gl.shown) { gl.g.style.visibility = on ? 'visible' : 'hidden'; gl.shown = on; }
        if (gl.g2) { const h = tg >= gl.t + 0.09; if (h !== gl.hit) { gl.g.style.textShadow = h ? gl.g2.hit : gl.g2.base; gl.hit = h; } }
      }
    },
  };
}

/** Place a planned run at world (x, y). Returns { update, startPos, endPos, posAt(n) }. */
export function placeRun(parent, id, x, y, opts = {}) {
  const r = RUN[id];
  const text = r.chars.map(c => c.ch).join('');
  const tx = typed(parent, text, { x, y, ink: r.ink, seed: id.length * 13 + id.charCodeAt(0), times: r.chars.map(c => c.t), jolts: r.chars.map(c => c.jolt), overstrike: !!r.overstrike, carbon: r.ink === 'blue', name: `Typed run: ${id}`, ...opts });
  return { ...tx, run: r, x, y, len: text.length };
}

/** Carriage position (world px, the next character cell) for the runs of one sheet, in plan order. */
export function carriage(placed) {
  const cw = placed[0]?.cw ?? CW;
  const cell = (p, n) => ({ x: p.x + n * cw, y: p.y });
  return function pos(tg) {
    let prevEnd = cell(placed[0], 0);
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i], r = p.run;
      const start = cell(p, 0);
      if (tg < r.start) {
        const cf = r.carriageFrom;
        if (i > 0 && cf && tg >= cf.at) return lerpP(prevEnd, start, ease.outCubic(clamp((tg - cf.at) / CR_TIME)));
        return i === 0 ? start : prevEnd;
      }
      if (tg < r.end) { let n = 0; for (const c of r.chars) if (c.t <= tg) n = c.i + 1; return cell(p, n); }
      prevEnd = cell(p, p.len);
    }
    return prevEnd;
  };
}
const lerpP = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

/** Camera follow: the eye trails the carriage (mean over the last 0.33 s → it lags, then settles). */
export function follower(pos, { kx = 0.55, ax = 0, offX = 0, offY = 0 } = {}) {
  return (tg, s) => {
    let x = 0, y = 0;
    for (let k = 0; k < 12; k++) { const p = pos(tg - k * 0.03); x += p.x; y += p.y; }
    x /= 12; y /= 12;
    return { x: ax + kx * (x - ax) + offX / s, y: y + offY / s };
  };
}

/** micro jolt of the sheet on each strike (typebar hits the platen) */
export function strikeJolt(tg, runs) {
  let j = 0;
  for (const r of runs) { if (tg < r.start - 0.1 || tg > r.end + 0.2) continue; for (const c of r.chars) { const d = tg - c.t; if (d >= 0 && d < 0.1 && c.ch !== ' ') j += Math.exp(-d / 0.03); } }
  return Math.min(1.5, j);
}

// ---------------------------------------------------------------- printed form furniture
export function printed(parent, text, { x, y, size = 34, weight = 700, track = 0.08, color = PAL.print, name, align = 'left', w = null, z = 1, opacity = 1 }) {
  return el('div', { 'data-name': name ?? `Printed: ${text.slice(0, 24)}`, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w ? w + 'px' : 'auto', textAlign: align, zIndex: z, fontFamily: FONT.print, fontWeight: weight, fontSize: size + 'px', letterSpacing: track + 'em', lineHeight: 1.05, color, textTransform: 'uppercase', whiteSpace: 'pre', opacity } }, parent, text);
}
export function rule(parent, { x, y, w, h = 3, color = PAL.print, dotted = false, name = 'Form rule', z = 1, opacity = 0.85 }) {
  return el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: z, opacity, background: dotted ? `repeating-linear-gradient(90deg, ${color} 0 ${h}px, transparent ${h}px ${h * 3.2}px)` : color } }, parent);
}

// ---------------------------------------------------------------- rubber stamp (block comes down, lifts, ink stays)
export function stamp(parent, { x, y, w, h, lines, color = PAL.red, rot = -6, seed = 1, name = 'Rubber stamp', z = 6, sizes }) {
  const wrap = el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: z, transform: `rotate(${rot}deg)` } }, parent);
  const ink = el('div', { 'data-name': `${name} ink`, style: { position: 'absolute', inset: 0, color, border: `${Math.round(h * 0.05)}px solid ${color}`, outline: `${Math.round(h * 0.022)}px solid ${color}`, outlineOffset: `${Math.round(h * 0.035)}px`, borderRadius: `${h * 0.06}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: FONT.print, fontWeight: 800, textTransform: 'uppercase', lineHeight: 0.92, mixBlendMode: 'multiply', WebkitMaskImage: `url(${stampMask(w + 40, h + 40, seed)})`, maskImage: `url(${stampMask(w + 40, h + 40, seed)})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' } }, wrap);
  lines.forEach((t, i) => el('div', { style: { fontSize: (sizes?.[i] ?? h * 0.42) + 'px', letterSpacing: '0.06em', whiteSpace: 'nowrap' } }, ink, t));
  // the stamp block seen from above: wood back, rubber edge, its shadow on the paper
  const block = el('div', { 'data-name': `${name} block`, style: { position: 'absolute', left: '-4%', top: '-6%', width: '108%', height: '112%', borderRadius: '10px', background: 'linear-gradient(135deg,#7A5636,#5A3C22 60%,#4A3019)', boxShadow: `inset 0 0 0 ${h * 0.05}px #2B2420, 0 0 0 rgba(0,0,0,0)`, opacity: 0 } }, wrap);
  el('div', { style: { position: 'absolute', left: '50%', top: '50%', width: h * 0.55 + 'px', height: h * 0.55 + 'px', marginLeft: -h * 0.275 + 'px', marginTop: -h * 0.275 + 'px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #A0764C, #5A3C22 70%)', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' } }, block);
  return {
    wrap,
    update(tg, tHit) {
      const d = tg - tHit;
      ink.style.opacity = d >= 0 ? 1 : 0;
      if (d < -0.2 || d > 0.42) { block.style.opacity = 0; return; }
      let tx = 0, ty = 0, sc = 1, op = 1, sh = 0;
      if (d < 0) { const p = ease.inQuad(clamp((d + 0.2) / 0.2)); sc = lerp(1.45, 1, p); tx = lerp(w * 0.35, 0, p); ty = lerp(-h * 1.2, 0, p); op = clamp((d + 0.2) / 0.06); sh = lerp(60, 4, p); }
      else if (d < 0.1) { sc = 1 - 0.02 * Math.sin((d / 0.1) * Math.PI); sh = 3; }
      else { const p = ease.inOutCubic(clamp((d - 0.1) / 0.32)); sc = lerp(1, 1.5, p); tx = lerp(0, w * 0.5, p); ty = lerp(0, -h * 1.6, p); op = 1 - clamp((d - 0.3) / 0.12); sh = lerp(4, 70, p); }
      block.style.opacity = op;
      block.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`;
      block.style.boxShadow = `inset 0 0 0 ${h * 0.05}px #2B2420, ${sh * 0.5}px ${sh * 0.8}px ${sh * 1.2}px rgba(${RGB.shadow},0.45)`;
    },
  };
}

// ---------------------------------------------------------------- gem paper clip (back loop under the paper, front loop over)
export function paperClip(under, over, { x, y, len = 190, rot = 0, name = 'Paper clip', z = 8 }) {
  const w = len / 3.1;
  const u = v => (v * w).toFixed(2);
  // unit coords: width 1, height 3.1 (y down); arcs keep their flags
  const front = `M ${u(0.3)} ${u(1.05)} L ${u(0.3)} ${u(2.55)} A ${u(0.2)} ${u(0.2)} 0 0 0 ${u(0.7)} ${u(2.55)} L ${u(0.7)} ${u(0.42)} A ${u(0.35)} ${u(0.35)} 0 0 0 ${u(0)} ${u(0.42)} L ${u(0)} ${u(1.2)}`;
  const back = `M ${u(0)} ${u(1.2)} L ${u(0)} ${u(2.72)} A ${u(0.5)} ${u(0.5)} 0 0 0 ${u(1)} ${u(2.72)} L ${u(1)} ${u(0.75)}`;
  const scale = d => d;
  const mk = (parent, d, nm, zz, shadow) => {
    const s = svg('svg', { 'data-name': nm, width: w + 16, height: len + 16, viewBox: `-8 -8 ${w + 16} ${len + 16}`, style: `position:absolute;left:${x}px;top:${y}px;overflow:visible;z-index:${zz};transform:rotate(${rot}deg);transform-origin:${w / 2}px ${len / 2}px;filter:drop-shadow(${shadow}px ${shadow * 1.5}px ${shadow * 1.4}px rgba(${RGB.shadow},0.38))` }, parent);
    const dd = scale(d);
    svg('path', { d: dd, fill: 'none', stroke: '#6F757B', 'stroke-width': 6.5, 'stroke-linecap': 'round' }, s);
    svg('path', { d: dd, fill: 'none', stroke: '#E6E9EB', 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: 0.85, transform: 'translate(-1.2,-1.2)' }, s);
    return s;
  };
  mk(under, back, `${name} (back loop)`, z - 1, 2);
  mk(over, front, name, z, 4);
}

// ---------------------------------------------------------------- redaction tape (lifts off, leaves faint adhesive)
export function redaction(parent, { x, y, w, h, seed = 3, name = 'Redaction tape', z = 7 }) {
  const jag = (n, side) => Array.from({ length: n }, (_, i) => side === 'l' ? `${(rand(seed + i * 3.1) * 1.6).toFixed(2)}% ${(i / (n - 1) * 100).toFixed(1)}%` : `${(100 - rand(seed + 50 + i * 2.7) * 1.6).toFixed(2)}% ${(100 - i / (n - 1) * 100).toFixed(1)}%`);
  const residue = el('div', { 'data-name': `${name} residue`, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: z - 1, background: 'rgba(120,110,95,0.06)', opacity: 0, clipPath: `polygon(${jag(9, 'l').join(',')},${jag(9, 'r').join(',')})` } }, parent);
  const tape = el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: z, transformOrigin: '0% 50%', background: `linear-gradient(178deg, #2a2826 0%, #171615 45%, #222120 100%)`, clipPath: `polygon(${jag(9, 'l').join(',')},${jag(9, 'r').join(',')})` } }, parent);
  // a soft sheen across the tape (one key light)
  el('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.08) 34%, rgba(255,255,255,0) 46%)' } }, tape);
  const shadow = el('div', { style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: z - 1, background: `rgba(${RGB.shadow},0.35)`, filter: 'blur(14px)', opacity: 0 } }, parent);
  return {
    update(tg, tLift) {
      const d = tg - tLift;
      if (d < 0) { tape.style.transform = 'none'; tape.style.opacity = 1; shadow.style.opacity = 0; residue.style.opacity = 0; return; }
      residue.style.opacity = 1;
      // peel: the left end lifts first (rotate up), then the strip is pulled away up-right
      const p1 = ease.outCubic(clamp(d / 0.22)), p2 = ease.inOutCubic(clamp((d - 0.12) / 0.45));
      const rot = -7 * p1 - 6 * p2, tx = w * 0.15 * p1 + w * 0.9 * p2, ty = -h * 0.8 * p1 - h * 4 * p2, sc = 1 + 0.06 * p1 + 0.1 * p2;
      tape.style.transformOrigin = '100% 50%';
      tape.style.transform = `translate(${tx}px,${ty}px) rotate(${rot}deg) scale(${sc})`;
      tape.style.opacity = 1 - clamp((d - 0.45) / 0.15);
      shadow.style.opacity = (1 - clamp((d - 0.4) / 0.2)) * p1;
      shadow.style.transform = `translate(${tx + 18 + 30 * p2}px,${ty + 30 + 40 * p2}px) rotate(${rot}deg)`;
    },
  };
}

// ---------------------------------------------------------------- pen signature (seeded scrawl, drawn live)
export function signature(parent, { x: sx, y: sy, w = 330, h = 90, seed = 1, name = 'Signature (scrawl, not a real signature)', z = 4 }) {
  const s = svg('svg', { 'data-name': name, width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: `position:absolute;left:${sx}px;top:${sy}px;overflow:visible;z-index:${z}` }, parent);
  // a run of cursive humps: each hump its own height/width, some loop back (l, e), a tall capital first
  const pts = [];
  const R = q => rand(seed * 31.7 + q * 7.13);
  let x = 0;
  const base = h * 0.62, slant = 0.18 + R(1) * 0.2;
  pts.push([x, base]);
  const humps = 6 + Math.floor(R(2) * 4);
  for (let k = 0; k < humps; k++) {
    const tall = k === 0 ? 1 : R(10 + k) > 0.7 ? 0.85 : 0.3 + R(20 + k) * 0.25;
    const hw = (w * 0.9) / humps * (0.7 + R(30 + k) * 0.6);
    const top = base - tall * h * 0.75;
    const loop = tall > 0.6;
    pts.push([x + hw * 0.25 + slant * (base - top), top + (loop ? 0 : h * 0.05)]);
    if (loop) pts.push([x + hw * 0.05 + slant * (base - top) * 0.6, top + h * 0.12]);
    pts.push([x + hw * 0.6, base + (R(40 + k) - 0.3) * h * 0.12]);
    x += hw;
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; }
  d += ` M ${(w * (0.1 + rand(seed) * 0.2)).toFixed(1)} ${(h * 0.9).toFixed(1)} q ${w * 0.4} ${-h * (0.05 + rand(seed + 3) * 0.15)} ${w * 0.78} ${-h * (0.12 + rand(seed + 4) * 0.1)}`;   // underline flourish
  const path = svg('path', { d, fill: 'none', stroke: PAL.blue, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.88 }, s);
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len}`;
  return { update(tg, t0, dur = 0.45) { path.style.strokeDashoffset = len * (1 - ease.inOutQuad(clamp((tg - t0) / dur))); } };
}

/** The new sheet arrives: the whole view slides in from the right like a page laid over the last one. */
export function slideIn(root, t, dur = 0.42, W) {
  const p = ease.outCubic(clamp(t / dur));
  root.style.transform = p < 1 ? `translateX(${((1 - p) * W * 1.04).toFixed(1)}px)` : 'none';
  root.style.boxShadow = p < 1 ? `-30px 0 60px rgba(${RGB.shadow},0.45)` : 'none';
}
