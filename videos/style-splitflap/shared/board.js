// SPLIT-FLAP BOARD — one electromechanical departure board is the whole film.
// Every change on screen is a module flipping through its fixed card wheel (letters, coloured "pixel" cards, word cards).
// Nothing slides, fades or scales on the board itself; only the camera moves and the housing jolts on the depth charges.
// All state is a pure function of global time: each module has a list of events computed at build time.
import { el, rand, noise1, smootherstep } from '/onclack-styles/engine/lib/anim.js';

// ---------- palette (tokens) ----------
export const P = {
  wall: '#1A1916', wallLit: '#2B2925',
  housing: '#101113', rail: '#08090A', railEdge: '#24262A',
  paint: '#A39A8A',          // stencil paint on the housing (labels, row numbers)
  card: '#25262A',           // blank / letter card
  cream: '#ECE5D4',          // letters (≤ 245)
  creamOld: '#E2D3B4',       // a few replaced, older cards
  sea: '#28506A', deep: '#18303F', grey: '#7F8487', land: '#DDD3BA', amber: '#E3A12F', red: '#C7362A',
};

// Card wheels (fixed order, like the real drums: a module can only go forward).
export const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-:/+()≈';
const charWheel = [...CHARS].map(c => ({ text: c, bg: P.card }));
// pixel cards: blank, sea, deep sea, grey, land/cream, amber. (No red: red exists only on the vote card.)
export const PX = { BLANK: 0, SEA: 1, DEEP: 2, GREY: 3, LAND: 4, AMBER: 5 };
const pixWheel = [P.card, P.sea, P.deep, P.grey, P.land, P.amber].map(bg => ({ bg }));
// the vote module: one wide card per word (like a destination module)
const voteWheel = [{ text: '', bg: P.card }, { text: '—', bg: P.card }, { text: 'YES', bg: P.card }, { text: 'NO', bg: P.red }];
export const VOTE = { BLANK: 0, DASH: 1, YES: 2, NO: 3 };

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const shade = (h, f) => { const [r, g, b] = hex(h); const c = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c(r)},${c(g)},${c(b)})`; };

// ---------- geometry per format (board coordinates = frame coordinates at camera zoom 1) ----------
export function geometry(layout) {
  if (layout.portrait) return {
    W: 1080, H: 1920,
    housing: { x: 36, y: 150, w: 968, h: 1400 },
    pic: { x: 76, y: 226, cols: 30, rows: 23, pitch: 28.4, gap: 2.2 },
    txt: { x: 128, y: 934, cols: 12, rows: 7, pw: 66.7, ph: 74, gx: 4, gy: 8, font: 56 },
    rownum: { x: 78, w: 40 },
    headY: 184, statusY: 890, footY: null, lean: 0,
  };
  return {
    W: 1920, H: 1080,
    housing: { x: 46, y: 132, w: 1828, h: 860 },
    pic: { x: 128, y: 236, cols: 36, rows: 26, pitch: 25.4, gap: 2 },
    txt: { x: 1130, y: 236, cols: 12, rows: 7, pw: 57, ph: 94.3, gx: 4, gy: 9, font: 70 },
    rownum: { x: 1080, w: 40 },
    headY: 194, footY: 942, lean: 0,
  };
}

// ---------- one module ----------
class Module {
  constructor(parent, { x, y, w, h, wheel, kind, seed, font, name }) {
    Object.assign(this, { wheel, kind, w, h, events: [], idx0: 0, last: 0, key: '' });
    const r = rand(seed * 7.13 + 1), r2 = rand(seed * 3.71 + 2);
    this.tone = 0.95 + 0.09 * r;                     // fixed per module: a little lighter or darker
    this.old = kind === 'char' && r2 < 0.05;          // a few older replacement cards (warmer cream)
    const dy = (rand(seed * 1.9 + 5) - 0.5) * 1.1;    // modules are not perfectly in line
    const gap = Math.max(1.5, h * 0.03);
    this.gap = gap;
    const node = el('div', { class: `m m-${kind}`, style: { left: x + 'px', top: y + dy + 'px', width: w + 'px', height: h + 'px' } }, parent);
    if (name) node.setAttribute('data-name', name);
    const half = (h - gap) / 2;
    const mk = (cls, top, origin) => {
      const d = el('div', { class: 'h ' + cls, style: { top: top + 'px', height: half + 'px', transformOrigin: origin } }, node);
      if (kind !== 'pix') { d.style.fontSize = font + 'px'; d.style.lineHeight = h + 'px'; d.style.setProperty('--off', (top === 0 ? 0 : -(half + gap)) + 'px'); d.style.setProperty('--h', h + 'px'); }
      return d;
    };
    this.sTop = mk('top', 0, '50% 100%');
    this.sBot = mk('bot', half + gap, '50% 0');
    this.fTop = mk('top flap', 0, '50% 100%');
    this.fBot = mk('bot flap', half + gap, '50% 0');
    el('div', { class: 'hinge', style: { top: half + 'px', height: gap + 'px' } }, node);
    this.node = node;
  }
  /** add a change: start time, target card index, seconds per flip, extra full turns */
  to(t0, idx, dur, turns = 0) { this.events.push({ t0, to: idx, dur, turns }); this.last = idx; }
  flipsFrom(from, to) { const N = this.wheel.length; return ((to - from) % N + N) % N; }
  finalize() {
    this.events.sort((a, b) => a.t0 - b.t0);
    let prev = null;
    for (const e of this.events) {
      e.from = prev ? this.posAt(e.t0, prev).cur : this.idx0;
      e.flips = this.flipsFrom(e.from, e.to) + e.turns * this.wheel.length;
      prev = e;
    }
  }
  posAt(t, ev) {
    if (!ev) return { cur: this.idx0, next: this.idx0, phase: 0 };
    const N = this.wheel.length, k = Math.floor((t - ev.t0) / ev.dur);
    if (k >= ev.flips) return { cur: ev.to, next: ev.to, phase: 0 };
    const cur = (ev.from + Math.max(0, k)) % N;
    return { cur, next: (cur + 1) % N, phase: Math.max(0, (t - ev.t0) / ev.dur - k) };
  }
  state(t) {
    let ev = null;
    for (const e of this.events) { if (e.t0 <= t) ev = e; else break; }
    return this.posAt(t, ev);
  }
  card(i, part, f) {
    const c = this.wheel[i];
    const lift = part === 'top' ? 1.07 : 0.9;          // key light from above: upper half catches more light
    return { bg: shade(c.bg, this.tone * lift * f), text: c.text ?? '', fg: c.bg === P.card ? shade(this.old ? P.creamOld : P.cream, (part === 'top' ? 1 : 0.93) * f) : shade(P.cream, f) };
  }
  paint(d, c) {
    d.style.backgroundColor = c.bg;
    if (this.kind !== 'pix') { d.dataset.c = c.text; d.style.color = c.fg; }
  }
  update(t) {
    const s = this.state(t);
    const flipping = s.phase > 0 || s.cur !== s.next;
    const a = s.phase * 180;
    const key = flipping ? `${s.cur}|${s.next}|${a.toFixed(1)}` : `${s.cur}`;
    if (key === this.key) return;
    this.key = key;
    if (!flipping) {
      this.paint(this.sTop, this.card(s.cur, 'top', 1)); this.paint(this.sBot, this.card(s.cur, 'bot', 1));
      this.fTop.style.display = 'none'; this.fBot.style.display = 'none';
      return;
    }
    // behind: next card's upper half is already visible; current lower half until the new lower flap covers it
    this.paint(this.sTop, this.card(s.next, 'top', 0.78 + 0.22 * Math.min(1, a / 90)));
    this.paint(this.sBot, this.card(s.cur, 'bot', 1));
    if (a < 90) {
      this.fTop.style.display = ''; this.fBot.style.display = 'none';
      this.paint(this.fTop, this.card(s.cur, 'top', 1 - 0.45 * (a / 90)));
      this.fTop.style.transform = `perspective(${this.h * 4}px) rotateX(${-a}deg)`;
    } else {
      this.fTop.style.display = 'none'; this.fBot.style.display = '';
      this.paint(this.fBot, this.card(s.next, 'bot', 0.6 + 0.4 * ((a - 90) / 90)));
      this.fBot.style.transform = `perspective(${this.h * 4}px) rotateX(${180 - a}deg)`;
    }
  }
}

// ---------- the board ----------
export function buildBoard(root, ctx, map) {
  const L = ctx.layout, G = geometry(L);
  const world = el('div', { class: 'world', 'data-name': 'Camera' }, root);
  el('div', { class: 'wall', 'data-name': 'Hall wall' }, world);
  const rig = el('div', { class: 'rig', 'data-name': 'Board housing' }, world);
  const H = G.housing;
  const housing = el('div', { class: 'housing', style: { left: H.x + 'px', top: H.y + 'px', width: H.w + 'px', height: H.h + 'px' } }, rig);
  // screws: fixed slot angle per screw (a human detail, never animated)
  [[16, 16], [H.w - 16, 16], [16, H.h - 16], [H.w - 16, H.h - 16], [H.w / 2, 16], [H.w / 2, H.h - 16]].forEach(([x, y], i) =>
    el('div', { class: 'screw', style: { left: x - 7 + 'px', top: y - 7 + 'px', '--a': (rand(i + 40) * 180).toFixed(0) + 'deg' } }, housing));

  const paint = (txt, x, y, cls = '', name) => el('div', { class: 'paint ' + cls, style: { left: x + 'px', top: y + 'px' }, ...(name ? { 'data-name': name } : {}) }, rig, txt);
  const pic = G.pic, tx = G.txt;
  paint('VIEW', pic.x, G.headY, '', 'Label VIEW');
  paint('STATUS', tx.x, G.statusY ?? G.headY, '', 'Label STATUS');
  if (G.footY != null) paint('RECONSTRUCTION · POSITIONS APPROX. · ROLES FROM LATER ACCOUNTS', pic.x, G.footY, 'small', 'Honesty label');
  else paint('RECONSTRUCTION · POSITION APPROX.', tx.x + tx.cols * tx.pw - 40, G.headY + 6, 'small right', 'Honesty label');

  // panel wells (recessed black behind the modules) + rails between rows
  const well = (x, y, w, h) => el('div', { class: 'well', style: { left: x - 8 + 'px', top: y - 8 + 'px', width: w + 16 + 'px', height: h + 16 + 'px' } }, rig);
  well(pic.x, pic.y, pic.cols * pic.pitch, pic.rows * pic.pitch);
  well(tx.x, tx.y, tx.cols * tx.pw, tx.rows * tx.ph);
  for (let r = 0; r < tx.rows; r++) {
    el('div', { class: 'rail', style: { left: tx.x - 8 + 'px', top: tx.y + r * tx.ph + tx.ph - tx.gy / 2 - 1 + 'px', width: tx.cols * tx.pw + 16 + 'px' } }, rig);
    paint(String(r + 1).padStart(2, '0'), G.rownum.x, tx.y + r * tx.ph + tx.ph * 0.33, 'rownum');
  }

  // modules
  const mods = [];
  const pix = [];
  for (let r = 0; r < pic.rows; r++) for (let c = 0; c < pic.cols; c++) {
    const m = new Module(rig, { x: pic.x + c * pic.pitch, y: pic.y + r * pic.pitch, w: pic.pitch - pic.gap, h: pic.pitch - pic.gap, wheel: pixWheel, kind: 'pix', seed: 1000 + r * 97 + c });
    m.c = c; m.r = r; pix.push(m); mods.push(m);
  }
  const rows = [];
  const voteCells = [];
  for (let r = 0; r < tx.rows; r++) {
    const row = [];
    for (let c = 0; c < tx.cols; c++) {
      if (r >= 4 && c >= 9) continue;               // rows 5–7 end in one wide vote module
      const m = new Module(rig, { x: tx.x + c * tx.pw, y: tx.y + r * tx.ph, w: tx.pw - tx.gx, h: tx.ph - tx.gy, wheel: charWheel, kind: 'char', seed: r * 31 + c, font: tx.font, name: `Row ${r + 1} char ${c + 1}` });
      row.push(m); mods.push(m);
    }
    if (r >= 4) {
      const v = new Module(rig, { x: tx.x + 9 * tx.pw, y: tx.y + r * tx.ph, w: 3 * tx.pw - tx.gx, h: tx.ph - tx.gy, wheel: voteWheel, kind: 'word', seed: 500 + r, font: tx.font * 0.95, name: `Vote module ${r - 3}` });
      voteCells.push(v); mods.push(v);
    }
    rows.push(row);
  }
  // grade: one key light from above (housing top lit, floor side darker), no glow
  el('div', { class: 'grade' }, root);

  const cascades = [];   // for the sound: { t0, t1, n }
  const FLIP = 0.042;
  /** set a whole text row so its LAST module lands at `land` (all modules start together, each stops on its own card). */
  function row(r, text, land, { dur = FLIP } = {}) {
    const cells = rows[r];
    const str = text.toUpperCase().padEnd(cells.length, ' ').slice(0, cells.length);
    const ch = [...str].map(c => Math.max(0, CHARS.indexOf(c)));
    let maxF = 0;
    cells.forEach((m, i) => { maxF = Math.max(maxF, m.flipsFrom(m.last, ch[i])); });
    if (!maxF) return;
    dur = Math.min(dur, 0.72 / maxF);                 // a long way round the drum runs faster (motor speed per row)
    const t0 = land - maxF * dur;
    let n = 0;
    cells.forEach((m, i) => { if (m.flipsFrom(m.last, ch[i])) { m.to(t0, ch[i], dur); n++; } });
    cascades.push({ t0, t1: land, n, kind: 'row' });
  }
  function vote(i, idx, land, dur = 0.085) {
    const m = voteCells[i]; const f = m.flipsFrom(m.last, idx);
    m.to(land - f * dur, idx, dur); cascades.push({ t0: land - f * dur, t1: land, n: 3, kind: 'vote' });
  }
  /** a whole picture: fn(c, r, cols, rows) → PX index. Sweep left→right + seeded jitter (the drive shaft is not instant). */
  function page(t0, fn, { sweep = 0.35, jitter = 0.12, dur = 0.05, only } = {}) {
    let t1 = t0, n = 0;
    for (const m of pix) {
      const target = fn(m.c, m.r, pic.cols, pic.rows);
      if (target == null || (only && !only(m.c, m.r))) continue;
      const s = t0 + sweep * (m.c / pic.cols) + jitter * rand(m.c * 13.7 + m.r * 7.1 + t0);
      const f = m.flipsFrom(m.last, target);
      if (!f) continue;
      m.to(s, target, dur); n++;
      t1 = Math.max(t1, s + f * dur);
    }
    if (n) cascades.push({ t0, t1, n, kind: 'page' });
  }
  /** single pixel change (sprites: falling charges, bursts) */
  function dot(c, r, idx, t, dur = 0.012) {
    const m = pix[r * pic.cols + c]; if (!m || c < 0 || c >= pic.cols) return;
    m.to(t, idx, dur);
  }
  const bursts = [];

  function finalize() { for (const m of mods) m.finalize(); }

  function update(T, cam) {
    for (const m of mods) m.update(T);
    // housing jolt on depth charges (noise based, decays; no per-frame sign flips)
    let jx = 0, jy = 0;
    for (const b of bursts) {
      const d = T - b.t; if (d < 0 || d > 1.2) continue;
      const k = b.amp * Math.exp(-d / 0.22) * Math.min(1, d / 0.03);
      jx += k * noise1(d * 9, b.t * 3); jy += k * noise1(d * 9, b.t * 3 + 11);
    }
    rig.style.transform = `translate(${jx.toFixed(2)}px, ${jy.toFixed(2)}px)`;
    const z = cam.z, x = G.W / 2 - cam.x * z, y = G.H / 2 - cam.y * z;
    world.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${z.toFixed(4)})`;
  }

  return { G, rows, voteCells, pix, row, vote, page, dot, bursts, cascades, finalize, update, map };
}

/** camera keys: [[T, {x, y, z}], …] → smootherstep between keys (holds outside). */
export function camAt(T, keys) {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, a] = keys[i], [tb, b] = keys[i + 1];
    if (T <= tb) { const p = smootherstep((T - ta) / (tb - ta)); return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p }; }
  }
  return keys[keys.length - 1][1];
}
