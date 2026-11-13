// The light table rig: builds the world twice (the table + the copy seen through the loupe), and moves the
// camera, the loupe and the grease pencil from global time. Scenes call film(root, ctx).
import { el, svg, clamp, progress, lerp, spring, smootherstep } from '/onclack-styles/engine/lib/anim.js';
import { C, FONT, F, ez, r01, n1, hash, canvas } from './kit.js';
import { loadAssets, FR, SHEET } from './assets.js';
import { makePlan } from './plan.js';

const abs = (o = {}) => ({ position: 'absolute', left: '0px', top: '0px', ...o });
const place = (node, cx, cy, w, h, rot = 0) => Object.assign(node.style, { position: 'absolute', left: `${cx - w / 2}px`, top: `${cy - h / 2}px`, width: `${w}px`, height: `${h}px`, transform: `rotate(${rot}deg)` });

/* ---------- one copy of the world ---------- */
function buildWorld(host, A, plan, id, P) {
  const { O, tapes, marks } = plan;
  const w = el('div', { 'data-name': 'Light table world', style: abs({ width: '1px', height: '1px', transformOrigin: '0 0' }) }, host);
  const G = O.glass, gw = G.x1 - G.x0, gh = G.y1 - G.y0;
  // aluminium rail + glass + dust on the glass
  el('div', { 'data-name': 'Table rail', style: abs({ left: `${G.x0 - 38}px`, top: `${G.y0 - 38}px`, width: `${gw + 76}px`, height: `${gh + 76}px`, borderRadius: '10px',
    background: 'linear-gradient(135deg, #9AA2A7 0%, #6F777C 40%, #585F63 100%)', boxShadow: '0 0 0 2px #2A2F32, 0 30px 80px rgba(0,0,0,0.55), 0 0 260px 30px rgba(150,180,200,0.07)' }) }, w);
  el('div', { 'data-name': 'Light table glass', style: abs({ left: `${G.x0}px`, top: `${G.y0}px`, width: `${gw}px`, height: `${gh}px`, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.35), inset 0 0 60px rgba(120,150,170,0.25)',
    background: `radial-gradient(ellipse 70% 60% at 42% 38%, ${C.glassHi} 0%, ${C.glass} 55%, ${C.glassLo} 100%)` }) }, w);
  el('div', { 'data-name': 'Glass dust', style: abs({ left: `${G.x0}px`, top: `${G.y0}px`, width: `${gw}px`, height: `${gh}px`, backgroundImage: `url(${A.dust})`, backgroundSize: '512px 512px', opacity: 0.9 }) }, w);
  O.prints.forEach((p, i) => { const im = el('img', { decoding: 'sync', src: A.prints[i], 'data-name': `Fingerprint ${i + 1}` }, w); place(im, p.x, p.y, 120, 150, p.rot * 20); });

  const shadowed = (node, name) => { const s = el('div', { 'data-name': name + ' contact shadow' }, w); return s; };
  const obj = (name, url, o, ww, hh) => {
    const sh = shadowed(null, name); place(sh, o.x, o.y + 2, ww, hh, o.rot); sh.style.boxShadow = '0 2px 3px rgba(25,40,50,0.32), 0 6px 18px rgba(25,40,50,0.10)';
    const im = el('img', { decoding: 'sync', src: url, 'data-name': name }, w); place(im, o.x, o.y, ww, hh, o.rot); return im;
  };
  obj('1 Chart negative (Natural Earth coastlines)', A.chart.url, O.chart, A.chart.w, A.chart.h);
  obj('2 Strip A — hunters + empty frames', A.stripA.url, O.stripA, A.stripA.w, A.stripA.h);
  obj('3 Strip B — torpedo diagram frame', A.stripB.url, O.stripB, A.stripB.w, A.stripB.h);

  const tapeEls = [];
  const tapeEl = (parent, t, x, y) => {
    const d = el('div', { 'data-name': t.name, style: abs({ left: `${x}px`, top: `${y}px`, transform: `rotate(${t.rot}deg)`, transformOrigin: '0 0', padding: `${t.size * 0.32}px ${t.size * 0.55}px`,
      backgroundImage: `url(${A.tape})`, backgroundSize: '256px 256px', boxShadow: '0 1px 2px rgba(30,40,45,0.35)', fontFamily: FONT.type, fontWeight: 500, fontSize: `${t.size}px`,
      lineHeight: 1.3, color: C.type, whiteSpace: 'nowrap', letterSpacing: '0.02em', fontKerning: 'normal' }) }, parent);
    t.lines.forEach(s => el('div', {}, d, s));
    tapeEls.push(d);
    return d;
  };
  for (const t of tapes) if (t.on == null && !t.sheet) tapeEl(w, t, t.x, t.y);

  // cut single frames (slid in by hand)
  const singles = O.singles.map((s, i) => {
    const wr = el('div', { 'data-name': `3B Cut frame ${i + 1}` }, w); place(wr, s.x, s.y, FR.pitch, FR.H, s.rot);
    wr.style.boxShadow = '0 2px 3px rgba(25,40,50,0.32), 0 8px 20px rgba(25,40,50,0.12)';
    el('img', { decoding: 'sync', src: A.singles[i].url, style: abs({ width: `${FR.pitch}px`, height: `${FR.H}px` }) }, wr);
    for (const t of tapes) if (t.on === i) tapeEl(wr, t, FR.pitch / 2 + t.x, FR.H / 2 + t.y);
    return { wr, s };
  });

  // sheet film with the develop canvas
  const SH = O.sheet;
  const sw = el('div', { 'data-name': '4 Sheet negative B-59 (U.S. Navy photo)' }, w); place(sw, SH.x, SH.y, SHEET.w, SHEET.h, SH.rot);
  sw.style.filter = 'drop-shadow(0 2px 2px rgba(25,40,50,0.35))';
  el('img', { decoding: 'sync', src: A.sheet.url, style: abs({ width: `${SHEET.w}px`, height: `${SHEET.h}px` }) }, sw);
  const D = A.develop, dev = canvas(D.w, D.h);
  dev.setAttribute('data-name', '4B B-59 image (negative → positive)');
  Object.assign(dev.style, abs({ left: `${SHEET.m}px`, top: `${SHEET.m}px`, width: `${SHEET.w - 2 * SHEET.m}px`, height: `${SHEET.h - 2 * SHEET.m}px`, borderRadius: '3px' }));
  sw.appendChild(dev);
  const dg = dev.getContext('2d'), dimg = dg.createImageData(D.w, D.h);
  for (const t of tapes) if (t.sheet) tapeEl(sw, t, SHEET.w / 2 + t.x, SHEET.h / 2 + t.y);
  let lastDev = -1;
  const developTo = p => {
    if (p === lastDev) return; lastDev = p;
    const o = dimg.data, n = D.neg, q = D.pos, th = D.th, band = 0.09, pp = p * (1 + 2 * band) - band;
    if (p <= 0) o.set(n); else if (p >= 1) o.set(q);
    else for (let i = 0, N = D.w * D.h; i < N; i++) {
      const k = clamp((pp - th[i]) / band * 0.5 + 0.5), j = i * 4;
      const kk = k * k * (3 - 2 * k);
      o[j] = n[j] + (q[j] - n[j]) * kk; o[j + 1] = n[j + 1] + (q[j + 1] - n[j + 1]) * kk; o[j + 2] = n[j + 2] + (q[j + 2] - n[j + 2]) * kk; o[j + 3] = 255;
    }
    dg.putImageData(dimg, 0, 0);
  };
  developTo(0);

  // grease pencil layer
  const gs = svg('svg', { 'data-name': 'Grease pencil layer', width: 1, height: 1, style: 'position:absolute;left:0;top:0;overflow:visible' }, w);
  const defs = svg('defs', {}, gs);
  const fl = svg('filter', { id: `${id}-gr`, x: '-15%', y: '-15%', width: '130%', height: '130%', 'color-interpolation-filters': 'sRGB' }, defs);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.07, numOctaves: 2, seed: 4, result: 'n' }, fl);
  svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 3.2, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, fl);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.6, numOctaves: 2, seed: 9, result: 'g' }, fl);
  svg('feColorMatrix', { in: 'g', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.65', result: 'ga' }, fl);
  svg('feComposite', { in: 'd', in2: 'ga', operator: 'in' }, fl);
  const col = c => (c === 'yellow' ? C.yellow : C.red);
  const M = marks.map((m, i) => {
    if (m.kind === 'path') {
      const p = svg('path', { d: m.d, 'data-name': m.name, fill: 'none', stroke: col(m.color), 'stroke-width': m.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1.01', filter: `url(#${id}-gr)`, opacity: 0.94 }, gs);
      return { m, p };
    }
    const g = svg('g', { 'data-name': m.name, transform: `translate(${m.x} ${m.y}) rotate(${m.rot})`, filter: `url(#${id}-gr)`, opacity: 0.95 }, gs);
    const cp = svg('clipPath', { id: `${id}-c${i}` }, defs);
    const t = svg('text', { x: 0, y: 0, 'font-family': FONT.hand, 'font-weight': 500, 'font-size': m.size, fill: col(m.color), stroke: col(m.color), 'stroke-width': m.size * 0.035,
      'text-anchor': m.anchor, 'clip-path': `url(#${id}-c${i})`, 'letter-spacing': m.size * 0.02 }, g);
    // per-letter variation (seeded): small rotations + baseline drift, so repeated letters are never identical
    const chars = [...m.text];
    t.setAttribute('rotate', chars.map((_, j) => ((r01(m.seed, j) - 0.5) * 7).toFixed(1)).join(' '));
    let prev = 0; const dys = chars.map((_, j) => { const v = (r01(m.seed + 1, j) - 0.5) * m.size * 0.07 - j * m.size * 0.004; const d = v - prev; prev = v; return d.toFixed(2); });
    t.setAttribute('dy', dys.join(' '));
    t.textContent = m.text;
    const len = t.getComputedTextLength() || m.text.length * m.size * 0.6;
    const x0 = m.anchor === 'middle' ? -len / 2 : 0;
    const r = svg('rect', { x: x0 - m.size * 0.15, y: -m.size * 1.2, height: m.size * 1.8, width: 0 }, cp);
    return { m, t, r, len, g };
  });

  // culling: text that is not on screen (or not under the lens) is hidden — cheaper, and the layout lint sees only real text
  const stageEl = () => host.closest('#stage') ?? host;
  const cull = box => {
    const sr = stageEl().getBoundingClientRect(), k = sr.width / (stageEl().offsetWidth || sr.width) || 1;
    const items = [...tapeEls, ...M.filter(x => x.g).map(x => x.g)];
    for (const n of items) {
      if (n.style.visibility === 'hidden' && n.tagName !== 'DIV') continue;
      if (n.tagName === 'DIV') n.style.visibility = 'visible';
      const r = n.getBoundingClientRect(), x0 = (r.left - sr.left) / k, y0 = (r.top - sr.top) / k, x1 = x0 + r.width / k, y1 = y0 + r.height / k;
      if (x1 < box[0] || x0 > box[2] || y1 < box[1] || y0 > box[3]) n.style.visibility = 'hidden';
    }
  };

  return {
    el: w,
    cull,
    update(T) {
      for (const s of singles) {
        const k = spring(T - s.s.t0, { stiffness: 150, damping: 22 }), f = s.s.from;
        s.wr.style.transform = `translate(${(f.dx * (1 - k)).toFixed(2)}px, ${(f.dy * (1 - k)).toFixed(2)}px) rotate(${(s.s.rot + f.drot * (1 - k)).toFixed(3)}deg)`;
        s.wr.style.visibility = T < s.s.t0 - 0.05 ? 'hidden' : 'visible';
      }
      developTo(+smootherstep(progress(T, plan.develop.t0, plan.develop.t1)).toFixed(3));
      for (const x of M) {
        const p = progress(T, x.m.t0, x.m.t0 + x.m.dur);
        if (x.p) { x.p.style.visibility = p <= 0 ? 'hidden' : 'visible'; x.p.setAttribute('stroke-dashoffset', (1 - ez.move(p) * 1.0).toFixed(4)); }
        else { x.g.style.visibility = p <= 0 ? 'hidden' : 'visible'; x.r.setAttribute('width', ((x.len + x.m.size * 0.3) * p).toFixed(1)); }
      }
    },
  };
}

/* ---------- barrel map for the loupe glass (feDisplacementMap) ---------- */
function barrelMap() {
  const S = 256, c = canvas(S, S), g = c.getContext('2d'), id = g.createImageData(S, S), d = id.data, inner = 1 / 1.12, ENC = 0.2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const nx = ((x + 0.5) / S) * 2 - 1, ny = ((y + 0.5) / S) * 2 - 1, rn = Math.min(1, Math.hypot(nx, ny) / inner);
    const k = 0.17 * rn * rn; // sample further out near the rim → edges squeezed (barrel), like a cheap loupe
    const i = (y * S + x) * 4;
    d[i] = clamp(0.5 + (k * nx / 2) / ENC) * 255; d[i + 1] = clamp(0.5 + (k * ny / 2) / ENC) * 255; d[i + 2] = 128; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0); return { url: c.toDataURL('image/png'), ENC };
}
let BARREL = null;

/* ---------- camera / loupe evaluation ---------- */
function camAt(plan, T) {
  let s = plan.shots[0];
  for (const x of plan.shots) if (x.t <= T) s = x;
  const p = progress(T, s.a, s.b), e = s.e === 'drift' ? p : s.e === 'move' ? ez.move(p) : smootherstep(p);
  // zoom interpolates in log space (constant perceived speed)
  return [lerp(s.from[0], s.to[0], e), lerp(s.from[1], s.to[1], e), Math.exp(lerp(Math.log(s.from[2]), Math.log(s.to[2]), e))];
}
function loupeAt(plan, T) {
  let x = plan.loupe[0].x, y = plan.loupe[0].y, lift = 0;
  for (const k of plan.loupe) {
    if (k.t > T) break;
    if (!k.dur) { x = k.x; y = k.y; continue; }
    const p = progress(T, k.t, k.t + k.dur), e = ez.move(p);
    x = lerp(x, k.x, e); y = lerp(y, k.y, e);
    if (p > 0 && p < 1) lift = Math.sin(Math.PI * p);
  }
  // resting hand tremor (tiny) — the loupe is held, not animated on rails
  x += n1(T * 0.9, 3) * 0.8; y += n1(T * 0.9, 8) * 0.8;
  return { x, y, lift };
}
function shakeAt(plan, T) {
  let sx = 0, sy = 0;
  for (const b of plan.booms) {
    const dt = T - b; if (dt < 0 || dt > 0.9) continue;
    const a = 4.5 * Math.exp(-dt * 6.5);
    sx += a * n1(T * 14, b * 3); sy += a * n1(T * 14, b * 3 + 11);
  }
  return [sx, sy];
}

export async function film(root, ctx) {
  const L = ctx.layout, u = L.unit, P = L.portrait, W = L.width, H = L.height;
  const A = await loadAssets(ctx);
  const plan = makePlan(ctx.words, P);
  const id = `lt${Math.round(ctx.start * 100)}`;
  Object.assign(root.style, { background: C.room });
  const [ax, ay] = [L.safe.cx, L.safe.cy];

  const mainHost = el('div', { 'data-name': 'Table (camera)', style: abs({ width: `${W}px`, height: `${H}px`, overflow: 'hidden' }) }, root);
  const main = buildWorld(mainHost, A, plan, `${id}m`, P);

  // loupe pieces (screen space)
  if (!BARREL) BARREL = barrelMap();
  const defsSvg = svg('svg', { width: 0, height: 0, style: 'position:absolute' }, root);
  const bf = svg('filter', { id: `${id}-barrel`, filterUnits: 'objectBoundingBox', primitiveUnits: 'objectBoundingBox', x: 0, y: 0, width: 1, height: 1, 'color-interpolation-filters': 'sRGB' }, defsSvg);
  const feImg = svg('feImage', { href: BARREL.url, x: 0, y: 0, width: 1, height: 1, preserveAspectRatio: 'none', result: 'map' }, bf);
  const feD = svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' }, bf);

  const shadow = el('div', { 'data-name': 'Loupe shadow', style: abs({ borderRadius: '50%' }) }, root);
  const lensOuter = el('div', { 'data-name': 'Loupe lens', style: abs({}) }, root);
  const lensFx = el('div', { style: abs({ width: '100%', height: '100%', overflow: 'hidden' }) }, lensOuter);
  const lens = buildWorld(lensFx, A, plan, `${id}l`, P);
  const lensShade = el('div', { style: abs({ width: '100%', height: '100%' }) }, lensOuter);
  const rim = svg('svg', { 'data-name': 'Loupe rim', width: W, height: H, style: 'position:absolute;left:0;top:0;overflow:visible' }, root);
  const rimOuter = svg('circle', { fill: 'none', stroke: '#26292C' }, rim);
  const rimEdge = svg('circle', { fill: 'none', stroke: 'rgba(210,220,226,0.55)' }, rim);
  const rimInner = svg('circle', { fill: 'none', stroke: 'rgba(0,0,0,0.45)' }, rim);
  const glint = svg('path', { fill: 'none', stroke: 'rgba(255,255,255,0.16)', 'stroke-linecap': 'round' }, rim);

  // room light: the table is switched on at the start
  const dark = el('div', { 'data-name': 'Table switched off', style: abs({ width: `${W}px`, height: `${H}px`, background: '#090B0C' }) }, root);
  // dither (not a look grain): 2–3 code values of per-frame noise to stop banding in the glass gradient
  const dt = canvas(256, 256), dgc = dt.getContext('2d'), did = dgc.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = 128 + (hash(i, 0, 3) - 0.5) * 120; did.data.set([v, v, v, 255], i * 4); }
  dgc.putImageData(did, 0, 0);
  const dither = el('div', { style: abs({ width: `${W}px`, height: `${H}px`, backgroundImage: `url(${dt.toDataURL()})`, opacity: 0.045, mixBlendMode: 'overlay', pointerEvents: 'none' }) }, root);

  return {
    plan,
    update(t) {
      const T = ctx.start + t;
      let [cx, cy, z] = camAt(plan, T);
      const [shx, shy] = shakeAt(plan, T);
      const zu = z * u;
      const scr = (x, y) => [ax + (x + shx - cx) * zu, ay + (y + shy - cy) * zu];
      main.el.style.transform = `translate(${(ax - (cx - shx) * zu).toFixed(2)}px, ${(ay - (cy - shy) * zu).toFixed(2)}px) scale(${zu.toFixed(5)})`;
      main.update(T);
      main.cull([0, 0, W, H]);

      // loupe
      const lp = loupeAt(plan, T), d = smootherstep(progress(T, plan.drop.t0, plan.drop.t1));
      const jx = n1(T * 12, 41) * 1.6 * Math.exp(-Math.max(0, T - plan.booms[0]) * 5) * (T > plan.booms[0] ? 1 : 0);
      const lx = lerp(lp.x + jx, plan.drop.x, d), ly = lerp(lp.y, plan.drop.y, d);
      const lift = lp.lift * (1 - d);
      const R0 = plan.lensR * zu * (1 + 0.035 * lift);
      const [sx0, sy0] = scr(lp.x + jx, lp.y);
      const Sx = lerp(sx0, ax, d), Sy = lerp(sy0, ay, d);
      const Rbig = Math.hypot(W, H) * 1.05;
      const Rs = lerp(R0, Rbig, Math.pow(d, 1.7));
      const after = Math.max(0, T - plan.drop.t1);
      const zt = lerp(zu * plan.M, plan.drop.zFit * u, d) * (1 + after * 0.012);
      const Ws = 2 * Rs * 1.12;
      Object.assign(lensOuter.style, { left: `${(Sx - Ws / 2).toFixed(2)}px`, top: `${(Sy - Ws / 2).toFixed(2)}px`, width: `${Ws.toFixed(2)}px`, height: `${Ws.toFixed(2)}px`, clipPath: `circle(${Rs.toFixed(2)}px at 50% 50%)` });
      lens.el.style.transform = `translate(${(Ws / 2 - lx * zt).toFixed(2)}px, ${(Ws / 2 - ly * zt).toFixed(2)}px) scale(${zt.toFixed(5)})`;
      lens.update(T);
      lens.cull([Math.max(0, Sx - Rs), Math.max(0, Sy - Rs), Math.min(W, Sx + Rs), Math.min(H, Sy + Rs)]);
      const strength = (1 - d) * (1 - d);
      if (strength > 0.02) {
        feD.setAttribute('scale', (BARREL.ENC * strength).toFixed(4));   // bbox units: no per-frame geometry on the filter
        lensFx.style.filter = `url(#${id}-barrel)`;
      } else lensFx.style.filter = 'none';
      lensShade.style.background = `radial-gradient(circle ${Rs.toFixed(1)}px at 50% 50%, rgba(0,0,0,0) 78%, rgba(10,14,16,${(0.28 * (1 - d)).toFixed(3)}) 100%)`;
      mainHost.style.visibility = d > 0.995 ? 'hidden' : 'visible';
      // shadow of the loupe body (key light upper-left → shadow lower-right; grows when lifted)
      const so = (10 + 16 * lift) * zu, sr = Rs + (14 + 6 * lift) * zu;
      Object.assign(shadow.style, { left: `${(Sx - sr + so).toFixed(2)}px`, top: `${(Sy - sr + so * 1.2).toFixed(2)}px`, width: `${(2 * sr).toFixed(2)}px`, height: `${(2 * sr).toFixed(2)}px`,
        background: `radial-gradient(circle, rgba(20,30,38,${(0.30 - 0.08 * lift) * (1 - d)}) 62%, rgba(20,30,38,0) 72%)`, visibility: d > 0.9 ? 'hidden' : 'visible' });
      const rw = 15 * zu * (1 + d);
      for (const c of [rimOuter, rimEdge, rimInner]) { c.setAttribute('cx', Sx.toFixed(2)); c.setAttribute('cy', Sy.toFixed(2)); }
      rimOuter.setAttribute('r', (Rs + rw / 2).toFixed(2)); rimOuter.setAttribute('stroke-width', rw.toFixed(2));
      rimEdge.setAttribute('r', (Rs + rw - 1).toFixed(2)); rimEdge.setAttribute('stroke-width', Math.max(1.5, 2 * zu).toFixed(2));
      rimInner.setAttribute('r', (Rs + 0.5).toFixed(2)); rimInner.setAttribute('stroke-width', Math.max(1.5, 2.5 * zu).toFixed(2));
      const gr = Rs * 0.82, a0 = Math.PI * 1.08, a1 = Math.PI * 1.42;
      glint.setAttribute('d', `M${(Sx + gr * Math.cos(a0)).toFixed(1)} ${(Sy + gr * Math.sin(a0)).toFixed(1)} A${gr.toFixed(1)} ${gr.toFixed(1)} 0 0 1 ${(Sx + gr * Math.cos(a1)).toFixed(1)} ${(Sy + gr * Math.sin(a1)).toFixed(1)}`);
      glint.setAttribute('stroke-width', (9 * zu).toFixed(1)); glint.style.opacity = String(1 - d);
      rim.style.visibility = d > 0.97 ? 'hidden' : 'visible';

      // switch-on: one ramp with one small sag (a tube striking), no flicker
      const Lt = plan.light, on = smootherstep(progress(T, Lt.t0, Lt.t1)) - 0.18 * Math.max(0, 1 - Math.abs(T - (Lt.t0 + 0.2)) / 0.07);
      dark.style.opacity = clamp(0.94 * (1 - on)).toFixed(3);
      dark.style.visibility = T > Lt.t1 + 0.1 ? 'hidden' : 'visible';
      const fr = Math.floor(T * 30);
      dither.style.backgroundPosition = `${Math.floor(hash(fr, 1, 5) * 256)}px ${Math.floor(hash(fr, 2, 5) * 256)}px`;
    },
  };
}
