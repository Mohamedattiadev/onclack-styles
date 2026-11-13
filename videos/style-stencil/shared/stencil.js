// SPRAY STENCIL kit — one concrete wall, hand-cut card stencils that are laid, sprayed and lifted.
// Everything is a pure function of global time T. DOM + SVG only (no per-pixel canvas) so preview stays fast.
// Signature move: LAY (card slaps onto the wall, taped) → HISS (nozzle sweeps in rows, paint only gets through the
// cut holes, the card catches the overspray) → LIFT (card peels off, crisp paint + soft halo + drips stay).
import { el, svg, rand, clamp, progress, noise1, ease } from '/onclack-styles/engine/lib/anim.js';
import { spring, smootherstep } from '/onclack-styles/engine/lib/spring.js';

export const C = {
  black: '#1d1c1b', orange: '#ea561b', white: '#ebe8e0',
  sheet: '#c9b98c', sheetEdge: '#efe5c4', tape: '#dccf9f', shadow: '24,22,20',
};
export const FONT = "'Sofia Sans Extra Condensed', sans-serif";
let UID = 0;
const nid = (p) => `st-${p}-${++UID}`;

/** Draw a shape (list of svg specs) into parent with a fill. spec = { tag, attrs, text? } */
export function drawSpecs(parent, specs, fill, extra = {}) {
  for (const s of specs) {
    const n = svg(s.tag, { ...s.attrs, fill, ...extra }, parent);
    if (s.text != null) n.textContent = s.text;
  }
}

// ------------------------------------------------------------------ world (camera, wall, layers, grade)
export function createWorld(root, ctx, { worldW, worldH, wall, wallScale = 1.5, wallOrigin = [-300, -300], win = [-1e9, 1e9] }) {
  const L = ctx.layout;
  Object.assign(root.style, { position: 'absolute', inset: '0', overflow: 'hidden', background: '#8d8a84' });
  const cam = el('div', { 'data-name': 'Camera on the wall', style: { position: 'absolute', left: '0', top: '0', width: worldW + 'px', height: worldH + 'px', transformOrigin: '0 0' } }, root);
  const img = new Image();
  img.src = ctx.asset(wall);
  const wallEl = el('div', {
    'data-name': 'Concrete wall',
    style: { position: 'absolute', left: wallOrigin[0] + 'px', top: wallOrigin[1] + 'px', backgroundImage: `url(${ctx.asset(wall)})`, backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%' },
  }, cam);
  // wall size is fixed by the texture (rendered at 1/wallScale)
  const wallSize = wall.includes('land') ? [2667, 1600] : [1867, 3200];
  wallEl.style.width = wallSize[0] * wallScale + 'px';
  wallEl.style.height = wallSize[1] * wallScale + 'px';

  const paint = svg('svg', { width: worldW, height: worldH, viewBox: `0 0 ${worldW} ${worldH}`, 'data-name': 'Paint on the wall', style: 'position:absolute;left:0;top:0;overflow:visible' }, cam);
  const defs = svg('defs', {}, paint);
  // shared patterns: paint grain (from our generated tile) + overspray droplets per colour (vector)
  const grainId = nid('grain');
  const gp = svg('pattern', { id: grainId, patternUnits: 'userSpaceOnUse', width: 384, height: 384 }, defs);
  svg('image', { href: ctx.asset('assets/grain.png'), width: 384, height: 384 }, gp);
  const dotIds = {};
  for (const [k, col] of Object.entries({ black: C.black, orange: C.orange, white: C.white })) {
    const id = nid('dots-' + k); dotIds[col] = id;
    const p = svg('pattern', { id, patternUnits: 'userSpaceOnUse', width: 260, height: 260 }, defs);
    for (let i = 0; i < 150; i++) {
      const r = 0.5 + rand(i * 7.3 + k.length) ** 2.2 * 2.6;
      svg('circle', { cx: (rand(i * 3.1 + 1) * 260).toFixed(1), cy: (rand(i * 5.7 + 2) * 260).toFixed(1), r: r.toFixed(2), fill: col, opacity: (0.45 + rand(i * 1.9) * 0.55).toFixed(2) }, p);
    }
  }
  const sheets = el('div', { 'data-name': 'Stencil cards', style: { position: 'absolute', left: '0', top: '0', width: worldW + 'px', height: worldH + 'px' } }, cam);
  const mist = svg('svg', { width: worldW, height: worldH, viewBox: `0 0 ${worldW} ${worldH}`, 'data-name': 'Spray mist', style: 'position:absolute;left:0;top:0;overflow:visible' }, cam);
  const mistDefs = svg('defs', {}, mist);

  // grade (screen space): one key light upper-left, soft vignette, static fine grain
  el('div', { 'data-name': 'Grade: key light', style: { position: 'absolute', inset: '0', pointerEvents: 'none', background: 'linear-gradient(128deg, rgba(255,248,232,0.10) 0%, rgba(255,248,232,0) 42%, rgba(20,18,16,0) 62%, rgba(20,18,16,0.20) 100%)' } }, root);
  el('div', { 'data-name': 'Grade: vignette', style: { position: 'absolute', inset: '0', pointerEvents: 'none', background: 'radial-gradient(ellipse 75% 70% at 46% 44%, rgba(0,0,0,0) 55%, rgba(16,15,13,0.32) 100%)' } }, root);
  el('div', { 'data-name': 'Grade: grain', style: { position: 'absolute', inset: '0', pointerEvents: 'none', backgroundImage: `url(${ctx.asset('assets/grain.png')})`, backgroundSize: '384px 384px', opacity: '0.06', mixBlendMode: 'overlay' } }, root);

  const items = [];
  const world = {
    ctx, L, cam, paint, defs, sheets, mist, mistDefs, grainId, dotIds, worldW, worldH, items,
    /** register a sound at GLOBAL time T if it belongs to this scene's window (avoids double cues in overlaps) */
    sfx(id, T, opts = {}) { if (T >= win[0] && T < win[1]) ctx.sfx(id, T - ctx.start, opts); },
    add(item) { items.push(item); return item; },
    setCamera(cx, cy, s, rot = 0) {
      const tx = L.safe.cx - cx * s, ty = L.safe.cy - cy * s;
      cam.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(5)}) rotate(${rot.toFixed(3)}deg)`;
    },
    update(T) { for (const it of items) it.update(T); },
  };
  return world;
}

// ------------------------------------------------------------------ text as a stencil shape
const BRIDGED = new Set('ABDOPQR04689'.split(''));
/** Text cut as a stencil. Fits `width` (or uses `size`). Returns { specs, bridges, box, drips }. */
export function textShape(world, str, { x, baseline, top, width, size, anchor = 'start', spacing = 0.03, seed = 1, drips = 2 }) {
  const m = svg('text', { x: 0, y: 0, 'font-family': FONT, 'font-weight': 800, 'font-size': 100, 'letter-spacing': spacing * 100 }, world.paint);
  m.textContent = str;
  const len100 = m.getComputedTextLength();
  const fs = size ?? (100 * width) / len100;
  m.setAttribute('font-size', fs); m.setAttribute('letter-spacing', spacing * fs);
  const tw = m.getComputedTextLength();
  const x0 = anchor === 'end' ? x - tw : anchor === 'middle' ? x - tw / 2 : x;
  if (baseline == null) baseline = top + fs * 0.72;
  m.setAttribute('x', x0); m.setAttribute('y', baseline);
  const cap = fs * 0.72;
  const bridges = [], dripPts = [], chars = [];
  for (let i = 0; i < str.length; i++) {
    const e = m.getExtentOfChar(i), ch = str[i];
    chars.push({ ch, x: e.x, w: e.width });
    if (BRIDGED.has(ch)) {
      const bw = fs * 0.055, cx = e.x + (e.width - spacing * fs) * (ch === 'A' ? 0.5 : 0.5);
      bridges.push({ tag: 'rect', attrs: { x: (cx - bw / 2).toFixed(1), y: (baseline - cap - fs * 0.1).toFixed(1), width: bw.toFixed(1), height: (cap + fs * 0.2).toFixed(1) } });
    }
  }
  m.remove();
  // drips hang from the bottoms of a few letters (not from the bridge in the middle)
  const cand = chars.filter((c) => /[A-Z0-9]/.test(c.ch) && !'VTYJ'.includes(c.ch));
  for (let k = 0; k < drips && cand.length; k++) {
    const c = cand[Math.floor(rand(seed * 13 + k * 7.7) * cand.length)];
    const fx = 0.22 + rand(seed + k * 3.3) * 0.18;
    dripPts.push([c.x + (c.w - spacing * fs) * fx, baseline - fs * 0.01]);
  }
  return {
    specs: [{ tag: 'text', attrs: { x: x0.toFixed(1), y: baseline.toFixed(1), 'font-family': FONT, 'font-weight': 800, 'font-size': fs.toFixed(2), 'letter-spacing': (spacing * fs).toFixed(2) }, text: str }],
    bridges, box: { x: x0, y: baseline - cap, w: tw, h: cap }, drips: dripPts, fs,
  };
}

/** Merge shapes into one stencil (several holes cut in one card). */
export function merge(...shapes) {
  const xs = shapes.map((s) => s.box);
  const x = Math.min(...xs.map((b) => b.x)), y = Math.min(...xs.map((b) => b.y));
  const x2 = Math.max(...xs.map((b) => b.x + b.w)), y2 = Math.max(...xs.map((b) => b.y + b.h));
  return { specs: shapes.flatMap((s) => s.specs), bridges: shapes.flatMap((s) => s.bridges ?? []), drips: shapes.flatMap((s) => s.drips ?? []), box: { x, y, w: x2 - x, h: y2 - y } };
}

// ------------------------------------------------------------------ the stencil (card + paint + mist + drips)
/**
 * o: { name, shape, color, lay:[a,b], spray:[a,b], lift:[a,b], liftMode: 'top'|'left'|'corner'|'right',
 *      pad, seed, offset:[dx,dy] (misregistration of this layer), dripLen, sweep: 'rows'|'cols', sfx: true }
 */
export function stencil(world, o) {
  const { paint, defs, sheets, mist, mistDefs, ctx } = world;
  const seed = o.seed ?? 1;
  const color = o.color;
  const sh = o.shape;
  const [ox, oy] = o.offset ?? [0, 0];
  const b = { x: sh.box.x + ox, y: sh.box.y + oy, w: sh.box.w, h: sh.box.h };
  const pad = o.pad ?? Math.max(50, Math.min(b.w, b.h) * 0.35);
  const R = { x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad };
  const tr = `translate(${ox} ${oy})`;

  // ---- spray path (nozzle sweeps in rows across the holes)
  const cols = o.sweep === 'cols';
  const across = cols ? b.h : b.w, along = cols ? b.w : b.h;
  const rows = Math.max(1, Math.round(along / Math.max(70, Math.min(170, along / 2.2))));
  const sw = (along / rows) * 1.55 + 26;
  const ptsA = [];
  for (let r = 0; r < rows; r++) {
    const v = rows === 1 ? 0.5 : (r + 0.5) / rows;
    const a0 = -0.12, a1 = 1.12, dir = r % 2 === 0;
    const wob = (rand(seed * 9 + r) - 0.5) * sw * 0.18;
    const p0 = dir ? a0 : a1, p1 = dir ? a1 : a0;
    ptsA.push([p0, v, wob], [p1, v, -wob]);
  }
  const P = ptsA.map(([u, v, w]) => (cols ? [b.x + v * b.w + w, b.y + u * b.h] : [b.x + u * b.w, b.y + v * b.h + w]));
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 1; i < P.length; i++) {
    const [x0, y0] = P[i - 1], [x1, y1] = P[i];
    if (i % 2 === 1) d += ` L${x1.toFixed(1)},${y1.toFixed(1)}`; // the long pass
    else { const k = sw * 0.5 * (cols ? 1 : 1); d += ` C${(x0 + (cols ? 0 : (P[i - 1][0] > b.x + b.w / 2 ? k : -k))).toFixed(1)},${(y0 + (cols ? (y0 > b.y + b.h / 2 ? k : -k) : 0)).toFixed(1)} ${(x1 + (cols ? 0 : (x1 > b.x + b.w / 2 ? k : -k))).toFixed(1)},${(y1 + (cols ? (y1 > b.y + b.h / 2 ? k : -k) : 0)).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`; }
  }
  const measure = svg('path', { d, fill: 'none' }, paint);
  const LEN = measure.getTotalLength();
  const samples = [];
  for (let i = 0; i <= 160; i++) { const q = measure.getPointAtLength((LEN * i) / 160); samples.push([q.x, q.y]); }
  measure.remove();
  const nozzle = (p) => { const f = clamp(p) * 160, i = Math.min(159, Math.floor(f)), k = f - i; return [samples[i][0] + (samples[i + 1][0] - samples[i][0]) * k, samples[i][1] + (samples[i + 1][1] - samples[i][1]) * k]; };

  // ---- paint on the wall
  const g = svg('g', { 'data-name': `${o.name} — paint`, opacity: color === C.black ? 0.93 : 0.9 }, paint);
  const holeM = nid('hole'), sprayM = nid('spray'), blurF = nid('blur'), haloF = nid('halo');
  const big = { maskUnits: 'userSpaceOnUse', x: R.x - 200, y: R.y - 200, width: R.w + 400, height: R.h + 400 };
  const hm = svg('mask', { id: holeM, ...big }, defs);
  svg('rect', { ...rectOf(big), fill: '#000' }, hm);
  const hg = svg('g', { transform: tr }, hm);
  drawSpecs(hg, sh.specs, '#fff'); drawSpecs(hg, sh.bridges, '#000');
  const fb = svg('filter', { id: blurF, filterUnits: 'userSpaceOnUse', ...rectOf(big) }, defs);
  svg('feGaussianBlur', { stdDeviation: (sw * 0.2).toFixed(1) }, fb);
  const fh = svg('filter', { id: haloF, filterUnits: 'userSpaceOnUse', ...rectOf(big) }, defs);
  svg('feGaussianBlur', { stdDeviation: o.halo ?? 8 }, fh);
  const sm = svg('mask', { id: sprayM, ...big }, defs);
  svg('rect', { ...rectOf(big), fill: '#000' }, sm);
  const sprayStroke = svg('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': sw.toFixed(1), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: `url(#${blurF})`, 'stroke-dasharray': `${LEN} ${LEN + 10}`, 'stroke-dashoffset': LEN }, sm);
  const sprayed = svg('g', { mask: `url(#${sprayM})` }, g);
  const halo = svg('g', { filter: `url(#${haloF})`, opacity: o.haloOpacity ?? 0.34, transform: tr }, sprayed);
  drawSpecs(halo, sh.specs, color);
  const crisp = svg('g', { mask: `url(#${holeM})` }, sprayed);
  svg('rect', { ...rectOf(R), fill: color }, crisp);
  svg('rect', { ...rectOf(R), fill: `url(#${world.grainId})`, opacity: color === C.white ? 0.22 : 0.3 }, crisp);
  // a few stray droplets that got under the card edge (fixed per stencil, revealed with the spray)
  svg('rect', { ...rectOf({ x: b.x - 10, y: b.y - 10, w: b.w + 20, h: b.h + 20 }), fill: `url(#${world.dotIds[color]})`, opacity: 0.22, mask: `url(#${holeM})` }, sprayed);

  // ---- drips (run down after the paint is heavy, slow down, stop)
  const dripG = svg('g', { 'data-name': `${o.name} — drips` }, paint);
  const drips = (sh.drips ?? []).map(([x, y], i) => {
    const len = (o.dripLen ?? 70) * (0.45 + rand(seed * 5 + i * 2.9) * 0.8);
    const w = (o.dripW ?? 5) * (0.7 + rand(seed + i * 4.1) * 0.6);
    const t0 = (o.spray[1] - 0.25) + rand(seed * 3 + i) * 0.5;
    const line = svg('path', { d: '', fill: color, opacity: 0.94 }, dripG);
    const bulb = svg('circle', { r: (w * 0.95).toFixed(1), fill: color, cx: x + ox, cy: y + oy, opacity: 0 }, dripG);
    return { x: x + ox, y: y + oy, len, w, t0, line, bulb, wob: (rand(i + seed) - 0.5) * 3 };
  });

  // ---- the card (HTML div so it can peel in 3D)
  const card = el('div', { 'data-name': `${o.name} — stencil card`, style: { position: 'absolute', left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px', display: 'none', willChange: 'transform' } }, sheets);
  const mode = o.liftMode ?? 'top';
  card.style.transformOrigin = { top: '50% 0%', left: '0% 50%', right: '100% 50%', corner: '0% 0%', bottom: '50% 100%' }[mode];
  const cs = svg('svg', { width: R.w, height: R.h, viewBox: `${R.x} ${R.y} ${R.w} ${R.h}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, card);
  const cdefs = svg('defs', {}, cs);
  const cardM = nid('card'), dustM = nid('dust'), dustF = nid('dustf');
  const cm = svg('mask', { id: cardM, ...big }, cdefs);
  svg('rect', { ...rectOf(big), fill: '#000' }, cm);
  // hand-cut card outline: straight knife edges, small jitter, one clipped corner
  const j = (k) => (rand(seed * 17 + k) - 0.5) * 7;
  const clip = 18 + rand(seed) * 22;
  const outline = [[R.x + j(1), R.y + j(2)], [R.x + R.w * 0.5 + j(3), R.y + j(4)], [R.x + R.w - clip + j(5), R.y + j(6)], [R.x + R.w + j(7), R.y + clip + j(8)], [R.x + R.w + j(9), R.y + R.h + j(10)], [R.x + R.w * 0.45 + j(11), R.y + R.h + j(12)], [R.x + j(13), R.y + R.h + j(14)]];
  const outlinePts = outline.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  svg('polygon', { points: outlinePts, fill: '#fff' }, cm);
  const cg = svg('g', { transform: tr }, cm);
  drawSpecs(cg, sh.specs, '#000'); drawSpecs(cg, sh.bridges, '#fff');
  const fd = svg('filter', { id: dustF, filterUnits: 'userSpaceOnUse', ...rectOf(big) }, cdefs);
  svg('feGaussianBlur', { stdDeviation: (sw * 0.42).toFixed(1) }, fd);
  const dm = svg('mask', { id: dustM, ...big }, cdefs);
  svg('rect', { ...rectOf(big), fill: '#000' }, dm);
  const dustStroke = svg('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': (sw * 1.6).toFixed(1), 'stroke-linecap': 'round', filter: `url(#${dustF})`, 'stroke-dasharray': `${LEN} ${LEN + 10}`, 'stroke-dashoffset': LEN }, dm);

  const body = svg('g', { mask: `url(#${cardM})` }, cs);
  const tint = rand(seed * 2.2);
  svg('rect', { ...rectOf(R), fill: tint < 0.5 ? C.sheet : '#bfb48f' }, body);
  svg('rect', { ...rectOf(R), fill: `url(#${world.grainId})`, opacity: 0.09 }, body);
  // old paint from earlier jobs on this card (fixed, seeded)
  const oldF = nid('old');
  const fo = svg('filter', { id: oldF, filterUnits: 'userSpaceOnUse', ...rectOf(big) }, cdefs);
  svg('feGaussianBlur', { stdDeviation: 26 }, fo);
  const old = svg('g', { filter: `url(#${oldF})`, opacity: 0.22 }, body);
  for (let i = 0; i < 3; i++) {
    const cx = R.x + rand(seed * 31 + i) * R.w, cy = R.y + (rand(seed * 37 + i) < 0.5 ? 0.08 : 0.92) * R.h;
    svg('ellipse', { cx, cy, rx: 60 + rand(i + seed) * 120, ry: 30 + rand(i * 2 + seed) * 50, fill: rand(seed * 41 + i) < 0.6 ? C.black : C.white }, old);
  }
  // fresh overspray caught by the card (builds up with the spray)
  const dust = svg('g', { mask: `url(#${dustM})` }, body);
  svg('rect', { ...rectOf(R), fill: color, opacity: color === C.orange ? 0.34 : 0.5 }, dust);
  svg('rect', { ...rectOf(R), fill: `url(#${world.dotIds[color]})`, opacity: 0.9 }, dust);
  // cut edge of the card (card thickness catches the light)
  const edge = svg('g', { transform: tr, opacity: 0.55 }, body);
  drawSpecs(edge, sh.specs, 'none', { stroke: C.sheetEdge, 'stroke-width': 3 });
  svg('polygon', { points: outlinePts, fill: 'none', stroke: 'rgba(60,50,30,0.35)', 'stroke-width': 2 }, cs);
  // masking tape on 2–3 corners, torn ends
  const tapes = [];
  const corners = [[R.x, R.y, -1], [R.x + R.w, R.y + R.h, 1], [R.x + R.w, R.y + clip, 1], [R.x, R.y + R.h, -1]];
  const nT = 2 + Math.floor(rand(seed * 5) * 2);
  for (let i = 0; i < nT; i++) {
    const [cx, cy, s] = corners[i];
    const ang = (i % 2 ? 38 : -42) + (rand(seed + i * 9) - 0.5) * 14;
    const tl = 120, tw = 34;
    const pts = [];
    for (let k = 0; k <= 6; k++) pts.push([-tl / 2 + (rand(i * 11 + k + seed) - 0.5) * 4, -tw / 2 + (k / 6) * tw]);
    for (let k = 6; k >= 0; k--) pts.push([tl / 2 + (rand(i * 13 + k + seed) - 0.5) * 6, -tw / 2 + (k / 6) * tw]);
    tapes.push(svg('polygon', { points: pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '), fill: C.tape, opacity: 0.88, stroke: 'rgba(120,100,60,0.25)', 'stroke-width': 1.5, transform: `translate(${cx} ${cy}) rotate(${ang.toFixed(1)})` }, cs));
  }

  // ---- mist at the nozzle (only while spraying)
  const gradId = nid('mist');
  const rg = svg('radialGradient', { id: gradId }, mistDefs);
  svg('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.5 }, rg);
  svg('stop', { offset: '45%', 'stop-color': color, 'stop-opacity': 0.18 }, rg);
  svg('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }, rg);
  const mistC = svg('circle', { r: (sw * 0.9).toFixed(1), fill: `url(#${gradId})`, opacity: 0, 'data-name': `${o.name} — nozzle mist` }, mist);

  // ---- sound: slap on, hiss, peel off (registered once at build time)
  const [la, lb] = o.lay, [sa, sb] = o.spray, [fa, fb2] = o.lift;
  if (o.sfx !== false) {
    world.sfx('page-turn-01', lb - 0.06, { lu: o.layLu ?? -17 });
    world.sfx('sand-sprinkle-01', sa, { lu: o.hissLu ?? -11, duration: Math.max(0.2, sb - sa + 0.1), fadeIn: 0.03, fadeOut: 0.12 });
    world.sfx('page-turn-01', fa + 0.04, { lu: o.liftLu ?? -14 });
  }

  const sprayP = (T) => { const p = progress(T, sa, sb); return 0.55 * p + 0.45 * ease.inOutSine(p); };
  return world.add({
    name: o.name, box: b,
    update(T) {
      // paint reveal
      const p = sprayP(T);
      const off = (LEN * (1 - p)).toFixed(1);
      sprayStroke.setAttribute('stroke-dashoffset', off);
      dustStroke.setAttribute('stroke-dashoffset', off);
      const vz = p > 0 ? 'visible' : 'hidden';
      sprayStroke.setAttribute('visibility', vz); dustStroke.setAttribute('visibility', vz);
      // card
      const vis = T >= la && T < fb2;
      card.style.display = vis ? '' : 'none';
      if (vis) {
        let tf = '', sh2 = [2, 3, 3, 0.5], op = 1;
        if (T < lb + 0.6) { // lay: dropped and pressed on
          const q = clamp(spring(T - la, { stiffness: 260, damping: 26 }), 0, 1.2);
          const r = 1 - q;
          tf = `translate(${(-26 * r).toFixed(1)}px, ${(-70 * r).toFixed(1)}px) rotate(${(-3.5 * r).toFixed(2)}deg) scale(${(1 + 0.05 * r).toFixed(4)})`;
          sh2 = [2 + 22 * r, 3 + 34 * r, 3 + 26 * r, 0.5 - 0.2 * r];
          op = clamp((T - la) / 0.08);
        }
        if (T >= fa) { // lift: peel off toward the viewer and away
          const q = ease.inCubic(progress(T, fa, fb2)), q2 = ease.outCubic(progress(T, fa, fb2));
          const a = 78 * q2;
          tf = {
            top: `perspective(2200px) rotateX(${(-a).toFixed(2)}deg) translateY(${(-160 * q).toFixed(1)}px)`,
            bottom: `perspective(2200px) rotateX(${a.toFixed(2)}deg) translateY(${(-120 * q).toFixed(1)}px)`,
            left: `perspective(2200px) rotateY(${a.toFixed(2)}deg) translateX(${(-140 * q).toFixed(1)}px)`,
            right: `perspective(2200px) rotateY(${(-a).toFixed(2)}deg) translateX(${(140 * q).toFixed(1)}px)`,
            corner: `perspective(2200px) rotate(${(-14 * q2).toFixed(2)}deg) rotateX(${(-a * 0.8).toFixed(2)}deg) translate(${(-90 * q).toFixed(1)}px, ${(-140 * q).toFixed(1)}px)`,
          }[mode];
          sh2 = [2 + 30 * q2, 3 + 46 * q2, 3 + 40 * q2, 0.5 - 0.25 * q2];
          op = 1 - clamp((T - (fb2 - 0.14)) / 0.14);
        }
        card.style.transform = tf;
        card.style.opacity = op.toFixed(3);
        card.style.filter = `drop-shadow(${sh2[0].toFixed(1)}px ${sh2[1].toFixed(1)}px ${sh2[2].toFixed(1)}px rgba(${C.shadow},${sh2[3].toFixed(2)}))`;
      }
      // nozzle mist
      const on = T > sa - 0.03 && T < sb + 0.12;
      if (on) {
        const [nx, ny] = nozzle(p);
        const fade = Math.min(clamp((T - sa + 0.03) / 0.06), clamp((sb + 0.12 - T) / 0.15));
        mistC.setAttribute('cx', nx.toFixed(1)); mistC.setAttribute('cy', ny.toFixed(1));
        mistC.setAttribute('opacity', (fade * (0.72 + 0.18 * noise1(T * 9, seed))).toFixed(3));
      } else mistC.setAttribute('opacity', 0);
      // drips
      for (const dr of drips) {
        const k = T - dr.t0;
        if (k <= 0) { dr.line.setAttribute('d', ''); dr.bulb.setAttribute('opacity', 0); continue; }
        const g2 = 1 - Math.exp(-k * 1.6);
        const yEnd = dr.y + dr.len * g2;
        // a run: wide where it leaves the paint, thin neck, fat bead at the end
        const x0 = dr.x, y0 = dr.y - 2, xe = dr.x + dr.wob * 0.4, w0 = dr.w * 1.5, w1 = dr.w * 0.55, ym = (y0 + yEnd) / 2;
        dr.line.setAttribute('d', `M${(x0 - w0).toFixed(1)},${y0.toFixed(1)} Q${(x0 - w1 + dr.wob).toFixed(1)},${ym.toFixed(1)} ${(xe - w1 * 0.9).toFixed(1)},${yEnd.toFixed(1)} L${(xe + w1 * 0.9).toFixed(1)},${yEnd.toFixed(1)} Q${(x0 + w1 + dr.wob).toFixed(1)},${ym.toFixed(1)} ${(x0 + w0).toFixed(1)},${y0.toFixed(1)} Z`);
        dr.bulb.setAttribute('cx', (dr.x + dr.wob * 0.4).toFixed(1)); dr.bulb.setAttribute('cy', yEnd.toFixed(1)); dr.bulb.setAttribute('opacity', 0.94);
      }
    },
  });
}

function rectOf(r) { return { x: r.x, y: r.y, width: r.w ?? r.width, height: r.h ?? r.height }; }

// ------------------------------------------------------------------ camera path (views in world space)
/** keys: [[T, {cx, cy, s}], ...]; holds between keys, glides (smootherstep, log zoom) during [T0,T1] spans. */
export function cameraAt(T, moves, seed = 3) {
  let v = moves[0].to;
  for (const m of moves) {
    if (T <= m.t0) break;
    const k = smootherstep((T - m.t0) / (m.t1 - m.t0));
    const a = v;
    v = { cx: a.cx + (m.to.cx - a.cx) * k, cy: a.cy + (m.to.cy - a.cy) * k, s: Math.exp(Math.log(a.s) + (Math.log(m.to.s) - Math.log(a.s)) * k) };
    if (k < 1) break;
    v = m.to;
  }
  // handheld operator: tiny, slow (fixed seed)
  return { cx: v.cx + noise1(T * 0.45, seed) * 2.2 / v.s, cy: v.cy + noise1(T * 0.38, seed + 5) * 1.6 / v.s, s: v.s * (1 + noise1(T * 0.2, seed + 9) * 0.0016), rot: noise1(T * 0.3, seed + 2) * 0.06 };
}
