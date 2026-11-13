// The physical flipbook on the desk: page block, binding, the top leaf with its curling corner, the next leaf seen
// through the paper and under the corner, the reference photo, two pencils. The camera moves smoothly at 30 fps;
// the drawings change at 10 fps — the paper is real time, the drawing is the book's time.
import { C, DPS, clamp, lerp, hash, sr, paperTexture, deskTexture } from './kit.js';
import { times, makeArt, drawingAt, curlFor, sectionOf } from './art.js';
import { smootherstep, noise1 } from '/onclack-styles/engine/lib/anim.js';

let geoCache = null;
export async function loadGeo(ctx) {
  try { await Promise.all(['400 40px Kalam', '700 40px Kalam'].map(f => document.fonts.load(f))); } catch {}
  if (!geoCache) { try { geoCache = await (await fetch(ctx.asset('assets/caribbean.json'))).json(); } catch { geoCache = null; } }
  return geoCache;
}
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (k === 'style') Object.assign(n.style, v); else n.setAttribute(k, v); }
  parent?.appendChild(n); return n;
}

/* ---------- camera keys (world = page units) ---------- */
function camKeys(T, portrait) {
  if (!portrait) return [
    { cx: 946, cy: 490, s: 0.92 },
    { t: T.soviet - 0.4, d: 2.4, cx: 950, cy: 535, s: 0.95 },
    { t: T.near - 0.5, d: 1.2, cx: 975, cy: 470, s: 0.94 },
    { t: T.r1 - 0.1, d: 0.7, cx: 946, cy: 490, s: 0.92 },
    { t: T.american, d: 1.4, cx: 1000, cy: 480, s: 0.93 },
    { t: T.drop + 0.1, d: 1.4, cx: 950, cy: 545, s: 0.95 },
    { t: T.moscow - 0.3, d: 1.4, cx: 950, cy: 480, s: 0.94 },
    { t: T.r2 - 0.1, d: 0.7, cx: 946, cy: 490, s: 0.92 },
    { t: T.three - 0.3, d: 1.6, cx: 950, cy: 520, s: 0.94 },
    { t: T.third - 0.35, d: 1.9, cx: 965, cy: 522, s: 1.06 },
    { t: T.world, d: 3.0, cx: 970, cy: 525, s: 1.075 },
  ];
  return [
    { cx: 512, cy: 630, s: 0.95 },
    { t: T.soviet - 0.4, d: 2.2, cx: 515, cy: 630, s: 0.98 },
    { t: T.near - 0.5, d: 1.2, cx: 515, cy: 620, s: 0.98 },
    { t: T.r1 - 0.1, d: 0.7, cx: 512, cy: 630, s: 0.95 },
    { t: T.drop + 0.1, d: 1.4, cx: 515, cy: 630, s: 0.98 },
    { t: T.moscow - 0.3, d: 1.4, cx: 512, cy: 625, s: 0.97 },
    { t: T.r2 - 0.1, d: 0.7, cx: 512, cy: 630, s: 0.95 },
    { t: T.third - 0.35, d: 1.9, cx: 518, cy: 630, s: 0.975 },
    { t: T.world, d: 3.0, cx: 518, cy: 632, s: 0.985 },
  ];
}
function camAt(keys, tg) {
  let { cx, cy, s } = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i]; if (tg <= k.t) break;
    const q = smootherstep((tg - k.t) / k.d);
    cx = lerp(cx, k.cx, q); cy = lerp(cy, k.cy, q); s = lerp(s, k.s, q);
  }
  return { cx: cx + 3 * noise1(tg * 0.2, 3), cy: cy + 2.5 * noise1(tg * 0.17, 7), s: s * (1 + 0.004 * noise1(tg * 0.13, 1)) };
}

/* ---------- half-plane clip of the page rectangle by the fold line ---------- */
function foldGeom(W, H, a, b) {
  const A = [W - a, H], Bp = [W, H - b];
  const d = [Bp[0] - A[0], Bp[1] - A[1]], len = Math.hypot(d[0], d[1]) || 1, u = [d[0] / len, d[1] / len];
  const side = p => (p[0] - A[0]) * u[1] - (p[1] - A[1]) * u[0]; // < 0 = corner side
  const rect = [[0, 0], [W, 0], [W, H], [0, H]];
  const clip = (poly, keepCorner) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], sp = side(p), sq = side(q);
      const inP = keepCorner ? sp < 0 : sp >= 0, inQ = keepCorner ? sq < 0 : sq >= 0;
      if (inP) out.push(p);
      if (inP !== inQ) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  };
  const keep = clip(rect, false), cut = clip(rect, true);
  const refl = p => { const v = [p[0] - A[0], p[1] - A[1]], k = v[0] * u[0] + v[1] * u[1]; return [A[0] + 2 * k * u[0] - v[0], A[1] + 2 * k * u[1] - v[1]]; };
  return { keep, flap: cut.map(refl), A, Bp, u };
}
const poly = pts => pts.map(p => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',');
const pts = p => p.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');

/* ======================================================================== */
let WID = 0;
export function buildWorld(root, ctx) {
  const wid = ++WID;
  const fix = (str, pfx) => str.replace(/url\(#smudge\)/g, `url(#smudge${wid})`).replace(/id="/g, `id="${pfx}${wid}`).replace(/url\(#(?!smudge)/g, `url(#${pfx}${wid}`);
  const L = ctx.layout, portrait = L.portrait, T = times(ctx.words);
  const { art, live, P } = makeArt(T, portrait, geoCache);
  const W = P.W, H = P.H;

  el('div', { 'data-name': 'Desk (masonite)', style: { position: 'absolute', inset: 0, backgroundColor: C.desk, backgroundImage: `url(${deskTexture()})`, backgroundSize: '256px 256px' } }, root);
  const cam = el('div', { 'data-name': 'Camera', style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', transformOrigin: '0 0' } }, root);

  // reference photo (US Navy, public domain), tucked under the book, with a masking-tape caption
  const ph = portrait ? { x: 585, y: -232, w: 330, r: 3.2 } : { x: 1498, y: 112, w: 330, r: 2.6 };
  const phH = ph.w / 1.2916;
  const photo = el('div', { 'data-name': 'Reference photo (US Navy, B-59 surfaced)', style: { position: 'absolute', left: ph.x + 'px', top: ph.y + 'px', width: ph.w + 'px', height: phH + 'px', padding: '10px 10px 10px 10px', background: '#E9E6DE', boxSizing: 'content-box', transform: `rotate(${ph.r}deg)`, boxShadow: '6px 9px 14px rgba(10,9,7,0.5), 1px 2px 2px rgba(10,9,7,0.4)' } }, cam);
  el('img', { src: ctx.asset('assets/b59-surfaced-1962.jpg'), style: { width: ph.w + 'px', height: phH + 'px', display: 'block', filter: 'grayscale(1) contrast(1.05) brightness(0.98)' } }, photo);
  el('div', { style: { position: 'absolute', left: '36%', top: '-16px', width: '92px', height: '34px', background: 'rgba(222,210,170,0.86)', transform: 'rotate(-4deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' } }, photo);
  const capBox = portrait ? { x: 40, y: -184, w: 470, r: 0 } : { x: 1556, y: 112 + phH + 40, w: 286, r: 0.6 };
  const cap = el('div', { 'data-name': 'Photo caption (tape)', style: { position: 'absolute', left: capBox.x + 'px', top: capBox.y + 'px', width: capBox.w + 'px', padding: '8px 14px 6px', background: 'rgba(226,214,176,0.93)', transform: `rotate(${capBox.r}deg)`, boxShadow: '2px 3px 4px rgba(10,9,7,0.35)',
    fontFamily: "'Kalam'", fontWeight: 700, fontSize: portrait ? '26px' : '23px', lineHeight: portrait ? '33px' : '29px', color: C.graphite } }, cam);
  el('div', {}, cap).textContent = 'REF. — US Navy photo:';
  el('div', { style: { fontWeight: 400 } }, cap).textContent = 'B-59 after it surfaced,';
  el('div', { style: { fontWeight: 400 } }, cap).textContent = 'approx. 28–29 Oct 1962';

  // two pencils on the desk: the blue one is worn down; the red one is long — barely used
  const pencil = (x, y, len, rot, body, name) => {
    const p = el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: len + 'px', height: '22px', transform: `rotate(${rot}deg)`, transformOrigin: '0 50%', filter: 'drop-shadow(7px 9px 5px rgba(10,9,7,0.55))' } }, cam);
    el('div', { style: { position: 'absolute', left: '62px', top: 0, width: (len - 62) + 'px', height: '22px', borderRadius: '0 3px 3px 0', background: `linear-gradient(180deg, ${body} 0 30%, rgba(255,255,255,0.22) 30% 38%, ${body} 38% 70%, rgba(0,0,0,0.18) 70%)`, backgroundColor: body } }, p);
    el('div', { style: { position: 'absolute', left: '8px', top: 0, width: '56px', height: '22px', clipPath: 'polygon(0 50%, 100% 0, 100% 100%)', background: 'linear-gradient(180deg,#d9c2a0,#efe0c4 45%,#c9ae86)' } }, p);
    el('div', { style: { position: 'absolute', left: '0', top: '5px', width: '20px', height: '12px', clipPath: 'polygon(0 50%, 100% 0, 100% 100%)', background: body, filter: 'brightness(0.7)' } }, p);
  };
  if (portrait) { pencil(120, H + 40, 380, -6, '#3D6FA9', 'Desk: blue pencil'); pencil(560, H + 70, 560, 4, '#A9352B', 'Desk: red pencil'); }
  else { pencil(1590, 760, 330, -24, '#3D6FA9', 'Desk: blue pencil'); pencil(1610, 930, 520, -9, '#A9352B', 'Desk: red pencil'); }

  // page block: the edges of the pages still to flip (fewer as the story goes on)
  const stack = [];
  for (let i = 14; i >= 1; i--) stack.push(el('div', { style: { position: 'absolute', left: (i * 2.2) + 'px', top: (i * 2.7) + 'px', width: W + 'px', height: H + 'px', background: i % 3 === 0 ? C.edgeDark : C.edge, borderRadius: '2px', boxShadow: i === 14 ? '14px 18px 26px rgba(10,9,7,0.55), 3px 4px 5px rgba(10,9,7,0.45)' : 'none' } }, cam));

  // the next leaf (under the corner) — paper + its drawing
  const paper = paperTexture();
  const under = el('div', { 'data-name': 'Next page (under the corner)', style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', backgroundColor: C.paper, backgroundImage: `url(${paper})`, backgroundSize: '512px 512px', overflow: 'hidden' } }, cam);
  const underSvg = document.createElementNS(NS, 'svg');
  underSvg.setAttribute('viewBox', `0 0 ${W} ${H}`); underSvg.setAttribute('width', W); underSvg.setAttribute('height', H);
  Object.assign(underSvg.style, { position: 'absolute', left: 0, top: 0, opacity: 0.55, filter: `url(#graphite${wid})` });
  under.appendChild(underSvg);
  const underShade = el('div', { style: { position: 'absolute', inset: 0, background: 'rgba(60,54,44,0.10)' } }, under);

  // the top leaf
  const leaf = el('div', { 'data-name': 'Flipbook page (top leaf)', style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', backgroundColor: C.paper, backgroundImage: `url(${paper})`, backgroundSize: '512px 512px', transformOrigin: portrait ? '50% 0' : '0 50%' } }, cam);
  const svgTop = document.createElementNS(NS, 'svg');
  svgTop.setAttribute('viewBox', `0 0 ${W} ${H}`); svgTop.setAttribute('width', W); svgTop.setAttribute('height', H);
  Object.assign(svgTop.style, { position: 'absolute', left: 0, top: 0, overflow: 'visible' });
  svgTop.innerHTML = `<defs>
    <filter id="graphite${wid}" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" result="nz"/>
      <feColorMatrix in="nz" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.05" result="grain"/>
      <feComposite in="SourceGraphic" in2="grain" operator="in" result="g"/>
      <feDisplacementMap in="g" in2="nz" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <radialGradient id="smudge${wid}"><stop offset="0" stop-color="#55565a" stop-opacity="0.55"/><stop offset="0.6" stop-color="#6a6b6e" stop-opacity="0.25"/><stop offset="1" stop-color="#777" stop-opacity="0"/></radialGradient>
  </defs><g class="ghost" opacity="0.07"></g><g class="ink" filter="url(#graphite${wid})"></g><g class="live" filter="url(#graphite${wid})"></g>`;
  leaf.appendChild(svgTop);
  const gGhost = svgTop.querySelector('.ghost'), gInk = svgTop.querySelector('.ink'), gLive = svgTop.querySelector('.live');
  // the folded corner (back of the leaf) + its shadow, drawn above the leaf
  const flapSvg = document.createElementNS(NS, 'svg');
  flapSvg.setAttribute('viewBox', `${-W} ${-H} ${W * 3} ${H * 3}`); flapSvg.setAttribute('width', W * 3); flapSvg.setAttribute('height', H * 3);
  flapSvg.setAttribute('data-name', 'Curling corner');
  Object.assign(flapSvg.style, { position: 'absolute', left: -W + 'px', top: -H + 'px', pointerEvents: 'none', overflow: 'visible' });
  flapSvg.innerHTML = `<defs><linearGradient id="flapG${wid}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#F3F0E8"/><stop offset="1" stop-color="${C.paperBack}"/></linearGradient>
    <filter id="flapBlur${wid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter></defs>
    <polygon class="sh" fill="rgba(30,26,20,0.32)" filter="url(#flapBlur${wid})"/><polygon class="fl" fill="url(#flapG${wid})" stroke="rgba(90,84,72,0.55)" stroke-width="1.5"/>`;
  cam.appendChild(flapSvg);
  const flapSh = flapSvg.querySelector('.sh'), flapPoly = flapSvg.querySelector('.fl'), flapGrad = flapSvg.querySelector('linearGradient');

  // binding: black cloth tape + bulldog clips
  const bind = portrait
    ? { tape: { left: '-14px', top: '-22px', width: (W + 28) + 'px', height: '58px' }, clips: [[150, -64], [W - 470, -64]] }
    : { tape: { left: '-24px', top: '-14px', width: '62px', height: (H + 28) + 'px' }, clips: [[-70, 190], [-70, H - 290]] };
  el('div', { 'data-name': 'Binding tape', style: { position: 'absolute', ...bind.tape, background: 'linear-gradient(90deg,#1d1c1a,#2c2a27 50%,#1a1918)', borderRadius: '3px', boxShadow: '3px 5px 7px rgba(10,9,7,0.5)' } }, cam);
  for (const [x, y] of bind.clips) {
    const c = el('div', { 'data-name': 'Bulldog clip', style: { position: 'absolute', left: x + 'px', top: y + 'px', width: portrait ? '150px' : '120px', height: portrait ? '120px' : '150px', filter: 'drop-shadow(5px 8px 5px rgba(8,8,6,0.6))' } }, cam);
    el('div', { style: { position: 'absolute', inset: portrait ? '30px 0 30px 0' : '0 30px 0 30px', background: 'linear-gradient(135deg,#3a3936,#151413 60%,#2b2a28)', borderRadius: '6px' } }, c);
    el('div', { style: { position: 'absolute', ...(portrait ? { left: '28px', top: '0', width: '94px', height: '40px' } : { left: '0', top: '28px', width: '40px', height: '94px' }), border: '5px solid #A7A39A', borderRadius: '10px', boxSizing: 'border-box' } }, c);
  }

  // one grade layer: key light upper left, gentle fall-off
  el('div', { 'data-name': 'Grade (desk lamp)', style: { position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply', background: `radial-gradient(ellipse ${portrait ? '150% 95%' : '110% 130%'} at 26% 18%, rgba(255,255,255,0) 48%, rgba(40,36,30,0.30) 100%)` } }, root);

  const keys = camKeys(T, portrait);
  let lastN = -1, lastLive = '', lastCam = '';
  return {
    T,
    update(t) {
      const tg = t + ctx.start;
      const c = camAt(keys, tg);
      const tr = `translate(${(L.width / 2).toFixed(2)}px,${(L.height / 2).toFixed(2)}px) rotate(${portrait ? -0.5 : -0.8}deg) scale(${c.s.toFixed(5)}) translate(${(-c.cx).toFixed(2)}px,${(-c.cy).toFixed(2)}px)`;
      if (tr !== lastCam) { cam.style.transform = tr; lastCam = tr; }
      const n = drawingAt(T, tg), held = n >= T.nHold;
      if (n !== lastN) {
        lastN = n;
        gInk.innerHTML = fix(art(n), 'i');
        gGhost.innerHTML = held ? '' : fix(art(n + 1, { ghost: true }), 'g');
        gGhost.setAttribute('transform', `translate(${(3 + 2 * sr(n, 4)).toFixed(1)} ${(-2 + 2 * sr(n, 5)).toFixed(1)})`);
        underSvg.innerHTML = fix(art(Math.min(n + 1, T.nHold), { ghost: true }), 'u');
        // registration error: every leaf sits a little differently on the binding (none when held)
        const j = held ? 0 : 1;
        leaf.style.transform = `translate(${(1.6 * sr(n, 1) * j).toFixed(2)}px,${(1.3 * sr(n, 2) * j).toFixed(2)}px) rotate(${(0.12 * sr(n, 3) * j).toFixed(3)}deg)`;
        leaf.style.backgroundPosition = `${Math.floor(hash(n, 8) * 512)}px ${Math.floor(hash(n, 9) * 512)}px`;
        under.style.backgroundPosition = `${Math.floor(hash(n + 1, 8) * 512)}px ${Math.floor(hash(n + 1, 9) * 512)}px`;
        const [a, b] = curlFor(T, n, P);
        if (a > 1) {
          const g = foldGeom(W, H, a, b);
          leaf.style.clipPath = `polygon(${poly(g.keep)})`;
          flapPoly.setAttribute('points', pts(g.flap)); flapSh.setAttribute('points', pts(g.flap.map(([x, y]) => [x - 6 - 0.04 * a, y - 4 - 0.04 * b])));
          flapPoly.style.display = flapSh.style.display = '';
          const m = [(g.A[0] + g.Bp[0]) / 2, (g.A[1] + g.Bp[1]) / 2], far = g.flap.reduce((best, p) => (Math.hypot(p[0] - m[0], p[1] - m[1]) > Math.hypot(best[0] - m[0], best[1] - m[1]) ? p : best), m);
          flapGrad.setAttribute('x1', m[0]); flapGrad.setAttribute('y1', m[1]); flapGrad.setAttribute('x2', far[0]); flapGrad.setAttribute('y2', far[1]);
          underShade.style.opacity = clamp(0.6 + a / W);
        } else {
          leaf.style.clipPath = 'none'; flapPoly.style.display = flapSh.style.display = 'none';
        }
        // pages left in the block
        const left = Math.round(lerp(14, 5, clamp(tg / 24)));
        stack.forEach((s, i) => { s.style.display = 14 - i <= left ? '' : 'none'; });
      }
      const lv = held ? live(tg) : '';
      if (lv !== lastLive) { gLive.innerHTML = fix(lv, 'l'); lastLive = lv; }
    },
  };
}
