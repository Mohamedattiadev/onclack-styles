// TELETYPE TAPE — one continuous wire-room world shared by all 4 scenes.
// The whole picture is a pure function of GLOBAL time (scene start + t): every scene builds the same machine, the same
// roll and the same tape, and only its camera, framing and accents differ. So cuts are camera changes inside one world.
//
// The world:  a yellowed teleprinter roll feeds UP out of a dark crinkle-finish machine; characters strike one by one at
// the print line (type box moves, carriage returns, paper line-feeds); next to it a reperforator punches the SAME
// characters as real 5-level ITA2 code into oiled paper tape. A lamp behind the paper path and behind the tape makes
// every punched hole a point of warm light ("punched-hole light").
// Glyph rule (human detail): only characters a 1960s ITA2 teleprinter could print — A–Z 0–9 space - . , : / ( ) ' ? & # $ !
// So pictures are made the way operators made "teleprinter art": from letters, punctuation and overstrikes.
import { el, svg, rand, clamp, lerp } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep, spring } from '/onclack-styles/engine/lib/spring.js';

export const F = 1 / 30;
export const PAL = {
  paper: '#E9DDB6', paperLo: '#D5C496', paperEdge: '#B9A574',
  ink: '#2D2038',            // purple-black ribbon ink
  wall: '#1E1A21', wallHi: '#2A2430',
  metal: '#2A252E', metalHi: '#5E5566', metalLo: '#141116',
  tape: '#D8B56C', tapeLo: '#B8914A',
  light: '#FFF4D2',          // lamp light through punched holes
  ribbon: '#3B2448',
};
export const COLS = 32;

// ---------------------------------------------------------------- ITA2 (Baudot–Murray) 5-level code, US figures
const LTRS = { A: '11000', B: '10011', C: '01110', D: '10010', E: '10000', F: '10110', G: '01011', H: '00101', I: '01100', J: '11010', K: '11110', L: '01001', M: '00111', N: '00110', O: '00011', P: '01101', Q: '11101', R: '01010', S: '10100', T: '00001', U: '11100', V: '01111', W: '11001', X: '10111', Y: '10101', Z: '10001' };
const FIGS = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R', 5: 'T', 6: 'Y', 7: 'U', 8: 'I', 9: 'O', 0: 'P', '-': 'A', '?': 'B', ':': 'C', $: 'D', '!': 'F', '&': 'G', '#': 'H', "'": 'J', '(': 'K', ')': 'L', '.': 'M', ',': 'N', '/': 'X' };
const CODE = { SP: '00100', CR: '00010', LF: '01000', FIGS: '11011', LTRS: '11111', BLANK: '00000' };

// ---------------------------------------------------------------- word times from the voice
export function wordTime(words, w, n = 0, fallback = 0) {
  const clean = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = (words ?? []).filter(x => clean(x.word) === clean(w));
  return hits[n]?.start ?? fallback;
}

// ---------------------------------------------------------------- the wire script (builder)
class Wire {
  constructor() {
    this.chars = []; this.feeds = []; this.rows = []; this.heads = []; this.bursts = [];
    this.line = 0; this.col = 0; this.cursor = -1; this.shift = 'L'; this.pre = [];
  }
  preline(text) { this.pre.push(text); }
  punch(code, t) { this.rows.push({ code, t }); }
  seg(text, at, { cps = 22, bold = 1, sheet = 'A', sp = 1 } = {}) {
    let t = Math.max(at, this.cursor + 0.02);
    const t0 = t;
    for (const ch of text) {
      if (ch !== ' ') {
        const fig = ch in FIGS;
        if (fig && this.shift !== 'F') { this.punch(CODE.FIGS, t - 0.01); this.shift = 'F'; }
        if (!fig && this.shift !== 'L') { this.punch(CODE.LTRS, t - 0.01); this.shift = 'L'; }
        this.punch(fig ? LTRS[FIGS[ch]] : LTRS[ch] ?? CODE.BLANK, t);
        this.chars.push({ ch, t, line: this.line, col: this.col, bold, sheet, i: this.chars.length });
      } else this.punch(CODE.SP, t);
      this.col++;
      this.heads.push({ t, col: this.col });
      t += (ch === ' ' ? sp : 1) / cps;
    }
    this.bursts.push({ from: t0, to: t, cps });
    this.cursor = t;
    return this;
  }
  /** carriage return + n line feeds (amt = lines per feed). */
  nl(at, n = 1, { amt = 1, each = 0.085 } = {}) {
    let t = Math.max(at, this.cursor + 0.05);
    this.punch(CODE.CR, t);
    this.heads.push({ t, col: 0, from: this.col, cr: true });
    this.col = 0;
    for (let k = 0; k < n; k++) { this.feeds.push({ t: t + 0.03, amt }); this.punch(CODE.LF, t + 0.03); t += each; this.line += amt; }
    this.cursor = t;
    return this;
  }
  /** blank tape run (sprocket holes only = no data). */
  blank(from, to, rate = 9) { for (let t = from; t < to; t += 1 / rate) this.punch(CODE.BLANK, t); }
}

/** The whole broadcast. Times come from the voice (words.json). */
export function buildWire(words) {
  const w = (s, n, fb) => wordTime(words, s, n, fb);
  const W = new Wire();
  W.blank(-40, -0.2, 9);          // tape leader: sprocket holes only
  // earlier traffic on the roll: the classic line-test patterns operators sent (RY + pangram), then end-of-message NNNN
  W.preline('ZCZC 026');
  W.preline('TIME CHECK 1500Z OCT 27');
  W.preline('NNNN');
  W.preline('');
  W.preline('RYRYRYRYRYRYRYRYRYRYRYRYRYRYRYRY');
  W.preline('THE QUICK BROWN FOX JUMPED OVER');
  W.preline("THE LAZY DOG'S BACK 1234567890");
  W.preline('NNNN');
  W.preline('');
  W.preline('');
  W.preline('ZCZC 027 B59');
  W.preline('');
  W.preline('RECONSTRUCTION - NOT A 1962 WIRE');
  W.preline('SOURCES: CREW ACCOUNTS (2002)');
  W.preline('');
  // ---- 1 · FLASH + dateline + the boat
  W.seg('F L A S H', 0.04, { cps: 17, bold: 3 });
  W.nl(0.64, 2);
  W.seg('OCT', w('October', 0, 0.58) - 2 * F, { cps: 20 });
  W.seg(' 27', w('twenty-seventh', 0, 1.1) + 0.05, { cps: 14 });
  W.seg(' 1962', w('nineteen', 0, 2.07) + 0.05, { cps: 6 });
  W.nl(3.2, 1);
  W.seg('SOVIET SUB B-59', w('Soviet', 0, 3.79) - 2 * F, { cps: 18 });
  W.nl(0, 1);
  W.seg('HIDES DEEP', w('hides', 0, 4.93) - 2 * F, { cps: 20 });
  W.nl(0, 1);
  W.seg(".-'-.-'-.-'-.-'-.-'-.-'-.-'-.-'-", w('deep', 0, 5.42) + 0.1, { cps: 110 });   // sea surface
  W.nl(0, 2, { each: 0.07 });                                                         // depth = two blank feeds
  W.seg('             .MMM.', 0, { cps: 150, sp: 0.25 }); W.nl(0, 1, { each: 0.05 });
  W.seg('   .--------XMMMMX---------.', 0, { cps: 150, sp: 0.25 }); W.nl(0, 1, { each: 0.05 });
  W.seg(')-(XXXXXXXXXXXXXXXXXXXXXXXXXXX)', 0, { cps: 150, sp: 0.25, bold: 2 }); W.nl(0, 1, { each: 0.05 });
  W.seg("   '-------------------------'", 0, { cps: 150, sp: 0.25 }); W.nl(0, 1, { each: 0.05 });
  W.seg('NEAR CUBA', Math.max(W.cursor, w('near', 0, 6.24) - 0.1), { cps: 22 });
  W.nl(7.25, 2);
  // ---- 2 · ships above, depth charges, Moscow silent
  W.seg('ABOVE:', w('Above', 0, 7.56) - 2 * F, { cps: 22 });
  W.seg(' US NAVY SHIPS', w('American', 0, 8.07) - 2 * F, { cps: 24 });
  W.nl(0, 1);
  W.seg('PRACTICE DEPTH CHARGES', w('practice', 0, 9.28) - 0.2, { cps: 26 });
  W.nl(0, 1);
  const tCharges = w('charges', 0, 10.05);
  const booms = [tCharges + 0.18, tCharges + 0.62, tCharges + 1.18];
  W.seg('   ###', booms[0] - 0.08, { cps: 40, bold: 3 });
  W.seg('        ###', booms[1] - 0.2, { cps: 40, bold: 3 });
  W.seg('       ###', booms[2] - 0.2, { cps: 40, bold: 3 });
  W.nl(0, 1);
  W.seg('MOSCOW:', w('Moscow', 0, 10.95) - 2 * F, { cps: 22 });
  W.nl(0, 1);
  const tSilent = w('silent', 0, 11.93);
  W.seg('. . . . . . . . . . . . . .', tSilent - 0.15, { cps: 15, sp: 0.3 });
  W.blank(W.cursor + 0.05, w('On', 0, 13.67) - 0.5, 7);
  W.nl(w('On', 0, 13.67) - 0.45, 2);
  // ---- 3 · torpedo + the vote
  W.seg('ON BOARD:', w('On', 0, 13.67) - 2 * F, { cps: 24 });
  W.seg(' 1 NUCLEAR TORPEDO', w('a', 0, 14.18) - 2 * F, { cps: 30 });
  W.nl(0, 1);
  W.seg("  )-(MMMMMMMMMMMMMMMMMMMM$$$$$)", 0, { cps: 150, sp: 0.25, bold: 2 });
  W.nl(0, 2);
  W.seg('TO FIRE:', w('To', 0, 15.73) - 2 * F, { cps: 26 });
  W.seg(' 3 OFFICERS', w('three', 0, 16.51) - 2 * F, { cps: 26 });
  W.seg(' MUST AGREE', w('must', 0, 17.37) - 2 * F, { cps: 26 });
  W.nl(0, 2);
  W.seg('VOTE', w('agree', 0, 17.61) + 0.05, { cps: 26 });
  W.seg('  1:YES', w('Two', 0, 18.29) - 2 * F, { cps: 30, bold: 2 });
  W.seg('  2:YES', w('yes', 0, 18.8) - 0.12, { cps: 30, bold: 2 });
  W.seg('  3:', w('yes', 0, 18.8) + 0.3, { cps: 26 });
  const tVoteWait = W.cursor;                                   // the type box waits here (empty slot)
  // ---- 4 · the third officer, NO punched as light, tear + pin, 2002
  W.nl(w('third', 0, 20.25) - 0.25, 2);
  W.seg('3: VASILI', w('Vasili', 0, 20.61) - 0.22, { cps: 24 });
  W.seg(' ARKHIPOV', w('Arkhipov', 0, 21.12) - 2 * F, { cps: 26 });
  const tNo = w('no', 0, 22.03);
  // the NO rises out of the machine row by row: 7 hole rows, each punched then fed by one hole pitch
  const holeRows = 7, rowAmt = 0.86;
  W.nl(tNo - 0.62, 1);
  const noLine = W.line + 0.2;                     // paper line where hole row 0 sits
  const punchT = [];
  for (let r = 0; r < holeRows; r++) {
    const t = tNo - 0.42 + r * 0.06;
    punchT.push(t);
    W.feeds.push({ t: t + 0.025, amt: rowAmt }); W.line += rowAmt;
  }
  W.cursor = tNo + 0.05;
  W.nl(tNo + 0.08, 2);
  const tTear = w('The', 3, 22.96) - 0.12;          // "The world learned…"
  const lineAtTear = W.line;
  // sheet B: new paper after the tear
  W.nl(tTear + 0.05, 2, { each: 0.1 });
  W.seg('HAVANA, OCT 2002:', w('world', 0, 23.07) - 0.05, { cps: 30, sheet: 'B' });
  W.nl(0, 1);
  W.seg('HIS NAME,', w('name', 0, 23.73) - 0.18, { cps: 30, sheet: 'B' });
  W.seg(' 40 YEARS LATE.', w('forty', 0, 24.13) - 2 * F, { cps: 28, sheet: 'B' });
  W.nl(0, 1);
  return { W, liftPx: 0, booms, tNo, punchT, noLine, rowAmt, holeRows, tTear, lineAtTear, tVoteWait };
}

// ---------------------------------------------------------------- static textures (made once, seeded)
let paperTex = null, wallTex = null, metalTex = null;
function noiseTile(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); const im = g.createImageData(w, h); const d = im.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, gg, b, a] = fn(x, y); const k = (y * w + x) * 4; d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = a; }
  g.putImageData(im, 0, 0);
  return c.toDataURL('image/png');
}
function textures() {
  if (paperTex) return;
  // paper: horizontal fibres (roll paper is calendered → streaks run along the feed) + fine tooth
  const fib = Array.from({ length: 256 }, (_, y) => (rand(y * 3.1 + 7) - 0.5) * 10 + (rand(Math.floor(y / 5) + 91) - 0.5) * 6);
  paperTex = noiseTile(256, 256, (x, y) => {
    const n = (rand(x * 17.3 + y * 131.7) - 0.5) * 16 + fib[y] + (rand(Math.floor(x / 23) * 7 + y * 0.31) - 0.5) * 3;
    return [128 + n, 120 + n, 100 + n, 46];
  });
  wallTex = noiseTile(192, 192, (x, y) => { const n = (rand(x * 9.7 + y * 77.1 + 3) - 0.5) * 22; return [128 + n, 128 + n, 128 + n, 14]; });
  // crinkle finish: blotchy cells
  metalTex = noiseTile(160, 160, (x, y) => {
    const cx = Math.floor(x / 4), cy = Math.floor(y / 4);
    const n = (rand(cx * 13.1 + cy * 71.7) - 0.5) * 40 + (rand(x * 3.3 + y * 5.9) - 0.5) * 16;
    return [128 + n, 128 + n, 128 + n, 30];
  });
}

// ---------------------------------------------------------------- world geometry per format
export function geometry(L) {
  if (L.portrait) {
    const fs = 41, cw = fs * 0.6, lh = Math.round(fs * 1.32);
    const textX = 84, paperX = 44, paperW = textX - paperX + COLS * cw + 56;
    return { fs, cw, lh, textX, paperX, paperW, printY: 1150, hoodY: 1150 + lh * 0.42, hoodH: 330,
      tape: { orient: 'h', x: 905, y: 1338, pitch: 15, w: 150 }, worldW: 1080, worldH: 1920 };
  }
  const fs = 46, cw = fs * 0.6, lh = Math.round(fs * 1.32);
  const paperX = 300, textX = paperX + 52, paperW = 52 + COLS * cw + 64;
  return { fs, cw, lh, textX, paperX, paperW, printY: 812, hoodY: 812 + lh * 0.42, hoodH: 420,
    tape: { orient: 'v', x: 1452, y: 812 + lh * 0.42 + 6, pitch: 16, w: 160 }, worldW: 1920, worldH: 1080 };
}

const NO_GLYPHS = {
  N: ['1...1', '11..1', '11..1', '1.1.1', '1..11', '1..11', '1...1'],
  O: ['.111.', '1...1', '1...1', '1...1', '1...1', '1...1', '.111.'],
};

// ---------------------------------------------------------------- build the world into a scene root
export function buildWorld(root, ctx) {
  textures();
  const L = ctx.layout, G = geometry(L);
  const S = buildWire(ctx.words);
  const { W } = S;
  const sheetBStart = S.lineAtTear;

  Object.assign(root.style, { position: 'absolute', inset: '0', overflow: 'hidden', background: PAL.wall });
  // the camera looks slightly DOWN at the machine: the roll recedes as it rises (one fixed tilt, all scenes)
  const tilt = el('div', { style: { position: 'absolute', inset: 0, transformOrigin: `50% ${L.portrait ? 70 : 78}%`, transform: `perspective(${L.portrait ? 2600 : 2000}px) rotateX(${L.portrait ? 9 : 11}deg)` } }, root);
  const cam = el('div', { 'data-name': 'Camera', style: { position: 'absolute', left: 0, top: 0, width: G.worldW + 'px', height: G.worldH + 'px', transformOrigin: '0 0', willChange: 'transform' } }, tilt);
  // wall of the wire room (key light from top-left)
  el('div', { 'data-name': 'Wire-room wall', style: { position: 'absolute', left: '-1500px', top: '-1500px', width: G.worldW + 3000 + 'px', height: G.worldH + 3000 + 'px',
    background: `url(${wallTex}), radial-gradient(ellipse 1400px 1000px at ${1500 + G.paperX + 200}px ${1500 + 120}px, ${PAL.wallHi}, ${PAL.wall} 70%, #151217)` } }, cam);

  // lamp panel behind the paper path (only seen through holes and the tear gap)
  el('div', { 'data-name': 'Lamp panel behind roll', style: { position: 'absolute', left: G.paperX + 70 + 'px', top: '-2000px', width: G.paperW - 140 + 'px', height: G.printY + 2000 + 'px',
    background: `linear-gradient(180deg, #E9C987, ${PAL.light} 70%, #F6DFA8)` } }, cam);

  // ---- platen roller (seen beyond the paper edges) + bakelite knobs
  const platY = G.hoodY - G.lh * 0.95, platH = G.lh * 0.95;
  el('div', { 'data-name': 'Platen', style: { position: 'absolute', left: G.paperX - 120 + 'px', top: platY + 'px', width: G.paperW + 240 + 'px', height: platH + 'px',
    background: 'linear-gradient(180deg,#0E0C10,#38323C 38%,#1A171C 62%,#0B0A0C)', borderRadius: '6px' } }, cam);
  const knob = x => {
    const k = el('div', { 'data-name': 'Platen knob', style: { position: 'absolute', left: x + 'px', top: platY - G.lh * 0.25 + 'px', width: G.lh * 0.95 + 'px', height: platH + G.lh * 0.5 + 'px', borderRadius: G.lh * 0.22 + 'px',
      background: `repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 3px, rgba(0,0,0,.25) 3px 7px), linear-gradient(90deg,#141116,#4A424F 35%,#221E25 70%,#0E0C10)`, boxShadow: '4px 8px 14px rgba(0,0,0,.55)' } }, cam);
    return k;
  };
  knob(G.paperX - 150); knob(G.paperX + G.paperW + 150 - G.lh * 0.95);

  // ---- paper sheets: A (until the tear) and B (after)
  const paperBox = el('div', { style: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } }, cam);
  const mkSheet = (name, jaggedTop, jaggedBottom) => {
    const s = el('div', { 'data-name': name, style: { position: 'absolute', left: G.paperX + 'px', width: G.paperW + 'px', top: 0, height: (jaggedTop ? 2000 : 6000) + 'px', transformOrigin: '50% 100%', willChange: 'transform' } }, paperBox);
    const face = el('div', { style: { position: 'absolute', inset: 0, background: `url(${paperTex}), linear-gradient(90deg, ${PAL.paperLo} 0%, ${PAL.paper} 7%, ${PAL.paper} 80%, ${PAL.paperLo} 100%)`,
      boxShadow: '0 0 0 1px rgba(80,60,30,.25), 10px 14px 26px rgba(0,0,0,.45)' } }, s);
    if (jaggedTop || jaggedBottom) {
      // torn edge: one seeded zig-zag (tear bar teeth) used for both sides of the tear so they match
      const pts = []; const n = 34;
      for (let i = 0; i <= n; i++) pts.push([i / n * 100, (i % 2 ? 0 : 9) + rand(i * 7.7 + 3) * 7]);
      const edge = pts.map(([x, y]) => `${x}% ${y}px`).join(',');
      if (jaggedTop) face.style.clipPath = `polygon(${pts.map(([x, y]) => `${x}% ${y}px`).join(',')}, 100% 100%, 0% 100%)`;
      if (jaggedBottom) face.style.clipPath = `polygon(0% 0%, 100% 0%, ${pts.slice().reverse().map(([x, y]) => `${x}% calc(100% - ${16 - y}px)`).join(',')})`;
      void edge;
    }
    const text = el('div', { style: { position: 'absolute', left: G.textX - G.paperX + 'px', top: 0, width: COLS * G.cw + 'px', height: '100%',
      font: `500 ${G.fs}px 'IBM Plex Mono'`, color: PAL.ink, letterSpacing: '0px', lineHeight: G.lh + 'px' } }, s);
    return { s, face, text };
  };
  const A = mkSheet('Wire roll (sheet A)', false, true);
  const B = mkSheet('Wire roll (sheet B, after tear)', true, false);

  // On screen, line k's glyph box top = printY - (off - k)·lh - 0.8·lh  (off = lines fed so far).
  // Sheet A's bottom edge = the tear line: at the tear it sits on the tear bar (hoodY - 8). Sheet B's top edge = same line.
  const SH = 6000, lat = sheetBStart, D = 1.22 * G.lh - 8;
  const preN = W.pre.length;
  S.liftPx = (W.line - lat + 0.75) * G.lh;   // A ends just above the new paper B
  const lineTopA = k => SH - (lat - k) * G.lh - D;
  const lineTopB = k => (k - lat) * G.lh - D;
  // pre-printed lines (already on the roll)
  W.pre.forEach((txt, i) => {
    const k = i - preN;
    [...txt].forEach((ch, c) => { if (ch !== ' ') charEl(A.text, ch, c, lineTopA(k), 900 + i * 37 + c, 1, true); });
  });
  function charEl(parent, ch, col, top, seed, bold, shown) {
    const r1 = rand(seed * 1.37 + 5), r2 = rand(seed * 2.11 + 9), r3 = rand(seed * 3.7 + 1);
    // ribbon wear: density varies per strike (designed once, seeded by index); type box baseline wobble ±0.9 px
    const op = 0.74 + r1 * 0.24;
    const e = el('span', { style: { position: 'absolute', left: col * G.cw + (r3 - 0.5) * 1.2 + 'px', top: top + (r2 - 0.5) * 1.8 + 'px', width: G.cw + 'px', textAlign: 'center',
      opacity: op, visibility: shown ? 'visible' : 'hidden',
      textShadow: bold > 1 ? `${0.05 * G.fs}px 0 0 ${PAL.ink}${bold > 2 ? `, ${-0.03 * G.fs}px ${0.03 * G.fs}px 0 ${PAL.ink}` : ''}` : `0 0 0.6px ${PAL.ink}` } }, parent, ch);
    return e;
  }
  const chars = W.chars.map(c => ({ ...c, node: charEl(c.sheet === 'B' ? B.text : A.text, c.ch, c.col, c.sheet === 'B' ? lineTopB(c.line) : lineTopA(c.line), c.i + 11, c.bold, false) }));
  chars.forEach(c => { if (c.ch === '#' || c.ch === 'X' || c.ch === 'M' || c.ch === '$') c.node.dataset.art = '1'; });

  // ---- punched NO (holes through sheet A, lamp light shows through)
  const holeD = G.lh * 0.62, pitchX = G.cw * 2.05;
  const noW = 11 * pitchX;
  const noLeft = (COLS * G.cw - noW) / 2 + pitchX / 2;
  const holes = [];
  // when the NO is punched the room seems to dim: the paper darkens, only the holes stay lamp-bright
  const dim = el('div', { 'data-name': 'Paper dim', style: { position: 'absolute', inset: 0, background: '#1A1220', opacity: 0, pointerEvents: 'none' } }, A.s);
  ['N', 'O'].forEach((ltr, li) => NO_GLYPHS[ltr].forEach((row, r) => [...row].forEach((v, c) => {
    if (v !== '1') return;
    const x = noLeft + (li * 6 + c) * pitchX;
    const y = lineTopA(S.noLine + r * S.rowAmt) + G.lh * 0.2;
    const hEl = el('div', { 'data-name': `NO hole ${ltr}${r}${c}`, style: { position: 'absolute', left: G.textX - G.paperX + x - holeD / 2 + 'px', top: y + 'px', width: holeD + 'px', height: holeD + 'px', borderRadius: '50%',
      background: PAL.light, boxShadow: `0 0 ${holeD * 0.18}px rgba(255,214,130,.55), inset 0 ${holeD * 0.09}px 0 rgba(120,90,40,.55), inset 0 -${holeD * 0.04}px 0 rgba(255,255,255,.5)`, visibility: 'hidden' } }, A.s);
    holes.push({ node: hEl, t: S.punchT[r] + c * 0.004 });
  })));

  // ---- push-pin that fixes the torn sheet above the machine
  const pinD = G.lh * 0.85;
  const pin = el('div', { 'data-name': 'Push pin', style: { position: 'absolute', left: G.paperW - 170 + 'px', top: lineTopA(S.noLine - 1.4) + 'px', width: pinD + 'px', height: pinD + 'px', borderRadius: '50%',
    background: 'radial-gradient(circle at 36% 32%, #F3DDA0, #B98E3E 45%, #6E4E1C 85%)', visibility: 'hidden' } }, A.s);
  const pinT = S.tTear + 0.6;

  // ---- the machine (hood, tear bar, type box)
  const hood = el('div', { 'data-name': 'Teleprinter hood', style: { position: 'absolute', left: G.paperX - 220 + 'px', top: G.hoodY + 'px', width: G.paperW + 440 + (L.portrait ? 0 : 420) + 'px', height: G.hoodH + 900 + 'px',
    background: `url(${metalTex}), linear-gradient(180deg, ${PAL.metalHi} 0px, ${PAL.metal} 10px, ${PAL.metal} 120px, ${PAL.metalLo})`, borderRadius: '26px 26px 0 0',
    boxShadow: '0 -6px 18px rgba(0,0,0,.5)' } }, cam);
  // hood details: four slotted screws + a louvre block (machine, not a desk)
  const hx = G.paperX - 220, hw = G.paperW + 440 + (L.portrait ? 0 : 420);
  [[hx + (L.portrait ? 200 : 40), G.hoodY + 34], [hx + hw - (L.portrait ? 200 : 64), G.hoodY + 34]].forEach(([x, y], i) => {
    const sc = el('div', { style: { position: 'absolute', left: x + 'px', top: y + 'px', width: '22px', height: '22px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #8B8291, #3A343F 70%)', boxShadow: '0 2px 2px rgba(0,0,0,.6)' } }, cam);
    el('div', { style: { position: 'absolute', left: '3px', right: '3px', top: '10px', height: '2px', background: '#1A171C', transform: `rotate(${20 + i * 55}deg)` } }, sc);
  });
  const lv = el('div', { 'data-name': 'Louvres', style: { position: 'absolute', left: (L.portrait ? G.paperX + G.paperW - 330 : G.paperX + G.paperW - 360) + 'px', top: G.hoodY + (L.portrait ? 24 : 66) + 'px', width: '300px', height: (L.portrait ? 50 : 120) + 'px' } }, cam);
  for (let i = 0; i < (L.portrait ? 3 : 7); i++) el('div', { style: { position: 'absolute', left: 0, right: 0, top: i * 17 + 'px', height: '7px', borderRadius: '4px', background: '#100E12', boxShadow: '0 2px 0 rgba(255,255,255,.07)' } }, lv);
  // paper slot (dark mouth the paper comes out of) + platen curve shading on the paper
  el('div', { 'data-name': 'Paper slot', style: { position: 'absolute', left: G.paperX - 18 + 'px', top: G.hoodY - 4 + 'px', width: G.paperW + 36 + 'px', height: '22px', background: '#0D0B0E', borderRadius: '0 0 8px 8px' } }, cam);
  el('div', { style: { position: 'absolute', left: G.paperX + 'px', top: G.hoodY - G.lh * 1.6 + 'px', width: G.paperW + 'px', height: G.lh * 1.6 + 'px',
    background: 'linear-gradient(180deg, rgba(60,40,20,0) 0%, rgba(60,40,20,.16) 70%, rgba(30,20,10,.42) 100%)' } }, cam);
  // tear bar: serrated steel strip just above the slot
  const bar = svg('svg', { 'data-name': 'Tear bar', width: G.paperW + 60, height: 26, style: `position:absolute;left:${G.paperX - 30}px;top:${G.hoodY - 14}px;overflow:visible` }, cam);
  let d = 'M0 26 L0 12 ';
  const teeth = Math.round((G.paperW + 60) / 13);
  for (let i = 0; i <= teeth; i++) d += `L${i * 13 + 6.5} ${4 + rand(i) * 1.5} L${(i + 1) * 13} 12 `;
  d += `L${G.paperW + 60} 26 Z`;
  svg('path', { d, fill: '#8A8290' }, bar);
  svg('rect', { x: 0, y: 17, width: G.paperW + 60, height: 9, fill: '#4A434F' }, bar);
  // type box with ribbon (moves along the print line)
  const head = el('div', { 'data-name': 'Type box', style: { position: 'absolute', left: 0, top: G.printY - G.lh * 0.9 + 'px', width: G.cw * 1.7 + 'px', height: G.lh * 1.25 + 'px', willChange: 'transform' } }, cam);
  el('div', { style: { position: 'absolute', left: 0, right: 0, top: G.lh * 0.42 + 'px', height: G.lh * 0.36 + 'px', background: PAL.ribbon, boxShadow: '0 2px 0 rgba(0,0,0,.35)' } }, head);
  el('div', { style: { position: 'absolute', left: G.cw * 0.25 + 'px', right: G.cw * 0.25 + 'px', top: G.lh * 0.32 + 'px', bottom: 0, background: 'linear-gradient(180deg,#6B6372,#2A252E 40%,#18151A)', borderRadius: '3px 3px 0 0' } }, head);
  // ribbon line across the print window (the purple ribbon runs edge to edge just under the print line)
  el('div', { 'data-name': 'Ribbon', style: { position: 'absolute', left: G.paperX - 10 + 'px', top: G.hoodY - 18 + 'px', width: G.paperW + 20 + 'px', height: '5px', background: PAL.ribbon, opacity: 0.85 } }, cam);
  // small engraved plate on the hood (honesty label, period-plausible but brand-free)
  const plate = el('div', { 'data-name': 'Hood plate', style: { position: 'absolute', left: (L.portrait ? G.paperX + 30 : G.paperX + 40) + 'px', top: G.hoodY + (L.portrait ? 22 : 70) + 'px', padding: '6px 14px',
    border: '1.5px solid #6C6472', borderRadius: '4px', font: `500 ${L.portrait ? 20 : 19}px 'IBM Plex Mono'`, letterSpacing: '0.2em', color: '#A39AA8', background: 'rgba(0,0,0,.18)' } }, cam, 'WIRE 3 · RECONSTRUCTION');

  // ---- punched tape (5-level ITA2, sprocket between holes 3 and 4) from the reperforator
  const T = G.tape;
  const rows = W.rows;
  const tapeLen = rows.length * T.pitch + 400;
  const tapeWrap = el('div', { 'data-name': 'Punched tape', style: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 } }, cam);
  // tape strip in local coords: runs along -X from the punch (x=0), width across Y (centered on 0)
  const tapeClip = el('div', { style: { position: 'absolute', left: -4000 + 'px', top: -T.w / 2 - 20 + 'px', width: 4000 + 'px', height: T.w + 40 + 'px', overflow: 'hidden' } }, tapeWrap);
  // lamp behind the tape
  el('div', { style: { position: 'absolute', left: 0, right: 0, top: '20px', height: T.w + 'px', background: PAL.light } }, tapeClip);
  const SC = 1.5;
  const strip = el('canvas', { width: Math.ceil(tapeLen * SC), height: Math.ceil(T.w * SC), style: { position: 'absolute', left: '4000px', top: '20px', width: tapeLen + 'px', height: T.w + 'px', willChange: 'transform' } }, tapeClip);
  {
    const g = strip.getContext('2d'); g.scale(SC, SC);
    g.fillStyle = PAL.tape; g.fillRect(0, 0, tapeLen, T.w);
    g.fillStyle = PAL.tapeLo; g.globalAlpha = 0.35; g.fillRect(0, T.w * 0.06, tapeLen, T.w * 0.05); g.fillRect(0, T.w * 0.9, tapeLen, T.w * 0.04);
    // faint oil blotches (seeded, fixed)
    for (let i = 0; i < tapeLen / 90; i++) { g.globalAlpha = 0.08 + rand(i * 5.1) * 0.08; g.beginPath(); g.ellipse(rand(i * 2.3) * tapeLen, rand(i * 7.9) * T.w, 30 + rand(i) * 60, 8 + rand(i * 3) * 14, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    const yHole = [1, 2, 3, 5, 6].map(k => (k + 1.5) / 9.5 * T.w);  // tracks 1-3, sprocket, 4-5
    const ySpr = (4 + 1.5) / 9.5 * T.w;
    g.globalCompositeOperation = 'destination-out';
    rows.forEach((r, i) => {
      const x = (i + 0.5) * T.pitch;
      g.beginPath(); g.arc(x, ySpr, T.pitch * 0.19, 0, 7); g.fill();
      [...r.code].forEach((b, k) => { if (b === '1') { g.beginPath(); g.arc(x + (rand(i * 9 + k) - 0.5) * 0.6, yHole[k], T.pitch * 0.36, 0, 7); g.fill(); } });
    });
  }
  // reperforator block (the punch)
  const punch = el('div', { 'data-name': 'Reperforator', style: { position: 'absolute', left: '-12px', top: -T.w / 2 - 34 + 'px', width: '120px', height: T.w + 68 + 'px', background: `url(${metalTex}), linear-gradient(90deg,#3A3440,#26212A 60%,#19161C)`, borderRadius: '8px', boxShadow: '-6px 8px 16px rgba(0,0,0,.5)' } }, tapeWrap);
  el('div', { style: { position: 'absolute', left: '10px', top: '14px', width: '8px', height: T.w + 40 + 'px', background: '#0C0A0D' } }, punch);
  if (T.orient === 'v') tapeWrap.style.transform = `translate(${T.x}px, ${T.y}px) rotate(90deg)`;   // tape exits upward
  else tapeWrap.style.transform = `translate(${T.x}px, ${T.y}px)`;                                  // tape exits leftward
  const rowTimes = rows.map(r => r.t);

  // ---- time helpers
  const feedT = W.feeds;
  function paperOffset(t) {   // lines fed so far (smooth per feed, ~85 ms each)
    let s = 0;
    for (const f of feedT) { if (f.t > t) break; s += f.amt * smootherstep((t - f.t) / 0.075); }
    return s;
  }
  // number of lines on sheet A above sheet B bottom (B position)
  const heads = W.heads;
  function headCol(t) {
    let lo = 0, hi = heads.length - 1, k = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (heads[m].t <= t) { k = m; lo = m + 1; } else hi = m - 1; }
    if (k < 0) return 0;
    const h = heads[k];
    if (h.cr) return lerp(h.from, 0, smootherstep((t - h.t) / 0.16));
    return h.col;
  }
  const countLE = (arr, t) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) lo = m + 1; else hi = m; } return lo; };
  const charTimes = chars.map(c => c.t);
  let shownChars = 0;
  let lastHoleState = -1;

  return {
    G, S, cam, tilt, L, chars, sheetA: A.s, sheetB: B.s, head, hood, plate,
    /** global time tg → set the whole world. */
    update(tg) {
      // characters
      const n = countLE(charTimes, tg);
      if (n !== shownChars) {
        const [a, b, v] = n > shownChars ? [shownChars, n, 'visible'] : [n, shownChars, 'hidden'];
        for (let i = a; i < b; i++) chars[i].node.style.visibility = v;
        shownChars = n;
      }
      // pin pressed in (drops from 1.35× with a falling shadow)
      if (tg >= pinT - 0.12) {
        const pp = smootherstep((tg - (pinT - 0.12)) / 0.12);
        pin.style.visibility = 'visible';
        pin.style.transform = `scale(${lerp(1.35, 1, pp)})`;
        pin.style.boxShadow = `${lerp(14, 3, pp)}px ${lerp(18, 4, pp)}px ${lerp(10, 3, pp)}px rgba(20,10,0,${lerp(0.25, 0.6, pp)})`;
      } else pin.style.visibility = 'hidden';
      // dim the paper around the NO (and keep it a little dim once pinned)
      dim.style.opacity = (0.42 * smootherstep((tg - (S.tNo - 0.05)) / 0.35) - 0.12 * smootherstep((tg - S.tTear) / 0.8)).toFixed(3);
      // holes
      const hs = holes.filter(h => h.t <= tg).length;
      if (hs !== lastHoleState) { holes.forEach(h => (h.node.style.visibility = h.t <= tg ? 'visible' : 'hidden')); lastHoleState = hs; }
      const off = paperOffset(tg);
      const torn = tg >= S.tTear;
      const tearY = G.hoodY - 8;
      // A follows the feed until the tear, then is yanked up, lifted and pinned above the machine
      let aBottom = tearY - (Math.min(off, lat) - lat) * G.lh, aRot = 0, aX = 0;
      if (torn) {
        const at = tg - S.tTear;
        aBottom = tearY - 26 * smootherstep(at / 0.1) - S.liftPx * spring(at - 0.08, { stiffness: 70, damping: 15 });
        aRot = -2.2 * spring(at - 0.04, { stiffness: 80, damping: 11 });
        aX = -12 * spring(at - 0.04, { stiffness: 80, damping: 11 });
      }
      A.s.style.transform = `translate(${aX}px, ${aBottom - SH}px) rotate(${aRot}deg)`;
      // B exists only after the tear: its top edge starts on the tear bar and rises with the feed
      B.s.style.visibility = torn ? 'visible' : 'hidden';
      B.s.style.transform = `translate(0px, ${tearY - (off - lat) * G.lh}px)`;
      // type box
      const col = headCol(tg);
      head.style.transform = `translate(${G.textX + col * G.cw + G.cw * 0.12}px, 0px)`;
      // tape
      const rn = countLE(rowTimes, tg);
      const last = rn > 0 ? rowTimes[rn - 1] : -1;
      const pos = rn - 1 + smootherstep((tg - last) / 0.04);
      strip.style.transform = `translateX(${-(pos + 0.5) * T.pitch - 8}px)`;
    },
  };
}

/** Camera: scale s around world focus (fx, fy) placed at screen point (ax, ay). Optional shake (px). */
export function setCamera(world, L, { s = 1, fx, fy, ax = L.width / 2, ay = L.height / 2, rot = 0 }, sh = [0, 0]) {
  world.cam.style.transform = `translate(${ax - fx * s + sh[0]}px, ${ay - fy * s + sh[1]}px) scale(${s}) rotate(${rot}deg)`;
}

/** Register every sound cue of the film once (from scene 1, whose start is 0 → scene time = global time). */
export function registerSound(ctx, S) {
  const { W } = S;
  // printing chatter: one cue per burst of strikes (natural clacks, sequenced; not tonal)
  W.bursts.forEach((b, i) => {
    const dur = Math.max(0.12, b.to - b.from);
    const lu = b.cps >= 60 ? -12 : b.cps <= 14 ? -19 : -15;
    ctx.sfx('tt-chatter', b.from, { duration: dur + 0.03, loop: true, fadeIn: 0.006, fadeOut: 0.04, lu: lu + (rand(i * 3.3) - 0.5) * 2 });
  });
  // carriage returns (heavier clunk) — only the real CRs with movement
  W.heads.filter(h => h.cr && h.from > 4).forEach((h, i) => ctx.sfx('tt-return', h.t, { lu: -20 + (rand(i + 40) - 0.5) * 2 }));
  // depth charges: distant booms (story sound bleeding into the wire room)
  S.booms.forEach((t, i) => ctx.sfx('boom-distant-01', t, { lu: -7 - i * 1.5 }));
  ctx.sfx('tt-punch', S.punchT[0] - 0.02, { lu: -9 });
  ctx.sfx('tt-tear', S.tTear, { lu: -8 });
  ctx.sfx('tt-clip', S.tTear + 0.6, { lu: -12 });
}

/** Camera keyframes [[tGlobal, {s, fx, fy, ax?, ay?}], …] → smootherstep between keys (no state). */
export function camAt(tg, keys) {
  if (tg <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, b] = keys[i];
    if (tg <= t1) {
      const [t0, a] = keys[i - 1];
      const p = smootherstep((tg - t0) / (t1 - t0));
      const o = {};
      for (const k of Object.keys(b)) o[k] = lerp(a[k] ?? b[k], b[k], p);
      return o;
    }
  }
  return keys[keys.length - 1][1];
}

/** Shared scene factory: same world, scene-specific camera + accents. */
export function wireScene(root, ctx, cameraKeys, { sound = false, shakes = [] } = {}) {
  const world = buildWorld(root, ctx);
  if (sound) registerSound(ctx, world.S);
  const L = ctx.layout;
  const keys = cameraKeys(world.S, L, world.G);
  return {
    update(t) {
      const tg = ctx.start + t;
      world.update(tg);
      const c = camAt(tg, keys);
      let sx = 0, sy = 0;
      for (const [t0, amp] of shakes.map(f => f(world.S))) { sy += shakeV(tg, t0, amp); sx += shakeV(tg + 0.017, t0, amp * 0.4); }
      const cc = { ax: L.width / 2, ay: L.height / 2, ...c };
      if (L.portrait) cc.ay += 90;   // 9:16: print line low, tall column of paper above, tape just above the UI zone
      setCamera(world, L, cc, [sx, sy]);
    },
  };
}
function shakeV(t, t0, amp) {
  const dt = t - t0; if (dt < 0 || dt > 0.32) return 0;
  return Math.sin(dt * 2 * Math.PI * 17) * amp * Math.exp(-dt * 11);
}
