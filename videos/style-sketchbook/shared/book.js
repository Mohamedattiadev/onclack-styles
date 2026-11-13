// The open sketchbook on a slate linen desk, a slow overhead camera, and the page turn.
// One global camera path for all scenes (so cuts between scene modules are invisible); pages animate from global time.
import { C, F, PAGE_W, PAGE_H, el, clamp, lerp, ease, wordAt, paperTexture, deskTexture, r1 } from './kit.js';
import { PAGES } from './pages.js';
import { smootherstep, noise1 } from '/onclack-styles/engine/lib/anim.js';

let geoCache = null;
export function times(ctx) {
  const w = (s, n = 0, fb = 0) => wordAt(ctx, s, n, fb);
  return {
    oct: w('October', 0, 0.58), t27: w('twenty-seventh', 0, 1.1), y62: w('nineteen', 0, 2.07), y62end: w('sixty-two', 0, 2.61) + 0.62,
    soviet: w('Soviet', 0, 3.79), submarine: w('submarine', 0, 4.3), hides: w('hides', 0, 4.93), deep: w('deep', 0, 5.42), sea: w('sea', 0, 5.98), cuba: w('Cuba', 0, 6.52),
    above: w('Above', 0, 7.56), american: w('American', 0, 8.07), ships: w('ships', 0, 8.63), drop: w('drop', 0, 8.95), practice: w('practice', 0, 9.28),
    depth: w('depth', 0, 9.79), charges: w('charges', 0, 10.05), moscow: w('Moscow', 0, 10.95), silent: w('silent', 0, 11.93), days: w('days', 0, 12.49),
    onboard: w('On', 0, 13.67), nuclear: w('nuclear', 0, 14.48), torpedo: w('torpedo', 0, 14.88), fire: w('fire', 0, 15.9), three: w('three', 0, 16.51),
    officers: w('officers', 0, 16.86), agree: w('agree', 0, 17.61), two: w('Two', 0, 18.29), yes: w('yes', 0, 18.8),
    third: w('third', 0, 20.25), vasili: w('Vasili', 0, 20.61), arkhipov: w('Arkhipov', 0, 21.12), no: w('no', 0, 22.03),
    world: w('world', 0, 23.07), name: w('name', 0, 23.73), forty: w('forty', 0, 24.13), later: w('later', 0, 24.73),
  };
}
export const TURN_DUR = 0.64;
export const turnStart = (T, spread) => (spread === 1 ? T.above : T.onboard) - 0.74;

/* ---------- camera (book coords: x −1000…1000 across the spread, y 0…1400) ---------- */
function camKeys(T, portrait) {
  if (!portrait) return [
    { cx: 0, cy: 700, s: 0.77 },
    { t: T.soviet - 0.35, d: 1.7, cx: 170, cy: 720, s: 0.84 },
    { t: T.deep - 0.15, d: 1.6, cx: 300, cy: 760, s: 0.9 },
    { t: turnStart(T, 1) - 0.05, d: 0.85, cx: 0, cy: 700, s: 0.78 },
    { t: T.above + 0.0, d: 1.4, cx: -440, cy: 720, s: 0.98 },
    { t: T.moscow - 0.4, d: 1.4, cx: 420, cy: 800, s: 0.98 },
    { t: turnStart(T, 2) - 0.05, d: 0.85, cx: 0, cy: 700, s: 0.78 },
    { t: T.onboard + 0.05, d: 1.3, cx: -440, cy: 690, s: 0.98 },
    { t: T.fire - 0.2, d: 1.5, cx: 420, cy: 660, s: 0.98 },
    { t: T.third - 0.3, d: 1.6, cx: 600, cy: 610, s: 1.18 },
    { t: T.world - 0.15, d: 2.2, cx: 0, cy: 700, s: 0.8 },
  ];
  return [
    { cx: -500, cy: 640, s: 1.06 },
    { t: T.submarine + 0.05, d: 0.95, cx: 500, cy: 800, s: 1.06 },
    { t: turnStart(T, 1) + 0.3, d: 0.9, cx: -500, cy: 700, s: 1.06 },
    { t: T.moscow - 0.45, d: 0.9, cx: 500, cy: 880, s: 1.06 },
    { t: turnStart(T, 2) + 0.3, d: 0.9, cx: -500, cy: 660, s: 1.06 },
    { t: T.fire - 0.15, d: 0.95, cx: 500, cy: 700, s: 1.06 },
    { t: T.third - 0.3, d: 1.6, cx: 676, cy: 740, s: 1.42 },
    { t: T.world - 0.15, d: 2.0, cx: 560, cy: 820, s: 0.98 },
  ];
}
function camAt(keys, tg) {
  let { cx, cy, s } = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i]; if (tg <= k.t) break;
    const q = smootherstep((tg - k.t) / k.d);
    cx = lerp(cx, k.cx, q); cy = lerp(cy, k.cy, q); s = lerp(s, k.s, q);
  }
  // a tripod over a desk still breathes a little (continuous across all scenes)
  return { cx: cx + 5 * noise1(tg * 0.18, 2), cy: cy + 4 * noise1(tg * 0.15, 5), s: s * (1 + 0.006 * noise1(tg * 0.12, 9)) };
}

/* ---------- page shell ---------- */
function pageShell(parent, side, name, seed) {
  const pg = el('div', { 'data-name': name, style: {
    position: 'absolute', left: 0, top: 0, width: PAGE_W + 'px', height: PAGE_H + 'px', overflow: 'hidden',
    backgroundColor: C.paper, backgroundImage: `url(${paperTexture()})`, backgroundSize: `${PAGE_W}px ${PAGE_H}px`,
    isolation: 'isolate', zIndex: 0,
  } }, parent);
  if (seed % 2) pg.style.backgroundPosition = '0 0'; else { pg.style.backgroundSize = `${PAGE_W}px ${PAGE_H}px`; pg.style.backgroundPosition = '0 0'; }
  // gutter: the paper curves down into the spine (key light upper left)
  const spineLeft = side === 'right';
  el('div', { 'data-name': 'Gutter shade', style: { position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', mixBlendMode: 'multiply',
    background: `linear-gradient(${spineLeft ? 90 : 270}deg, rgba(92,70,48,0.42) 0px, rgba(120,96,70,0.20) 26px, rgba(150,125,96,0.07) 80px, rgba(255,255,255,0) 170px, rgba(255,255,255,0) ${PAGE_W - 40}px, rgba(140,118,90,0.10) ${PAGE_W}px)` } }, pg);
  return pg;
}

export function buildBook(root, ctx, spread) {
  const L = ctx.layout, T = times(ctx), portrait = L.portrait;
  ctx.geo = geoCache;
  // desk
  el('div', { 'data-name': 'Desk (slate linen)', style: { position: 'absolute', inset: 0, backgroundColor: C.desk, backgroundImage: `url(${deskTexture()})`, backgroundSize: '128px 128px' } }, root);
  const cam = el('div', { 'data-name': 'Camera', style: { position: 'absolute', left: 0, top: 0, width: '2000px', height: '1400px', transformOrigin: '0 0' } }, root);
  // the book: cover, page-block edges, then pages
  const cover = el('div', { 'data-name': 'Sketchbook cover', style: { position: 'absolute', left: '-20px', top: '-18px', width: '2040px', height: '1438px', background: C.cover, borderRadius: '12px',
    boxShadow: '22px 30px 46px rgba(8,10,12,0.5), 4px 6px 8px rgba(8,10,12,0.45)' } }, cam);
  for (let i = 3; i >= 1; i--) {
    el('div', { style: { position: 'absolute', left: `${-i * 2.4}px`, top: `${i * 1.6}px`, width: '1000px', height: '1400px', background: i % 2 ? C.paperEdge : '#D6C9AD', borderRadius: '3px 0 0 3px' } }, cam);
    el('div', { style: { position: 'absolute', left: `${1000 + i * 2.4}px`, top: `${i * 1.6}px`, width: '1000px', height: '1400px', background: i % 2 ? C.paperEdge : '#D6C9AD', borderRadius: '0 3px 3px 0' } }, cam);
  }
  deskProps(cam);
  const book = el('div', { 'data-name': 'Spread', style: { position: 'absolute', left: 0, top: 0, width: '2000px', height: '1400px', perspective: '2600px', perspectiveOrigin: '1000px 700px' } }, cam);
  const leftBox = el('div', { 'data-name': 'Left page', style: { position: 'absolute', left: 0, top: 0, width: '1000px', height: '1400px' } }, book);
  const rightBox = el('div', { 'data-name': 'Right page', style: { position: 'absolute', left: '1000px', top: 0, width: '1000px', height: '1400px' } }, book);
  const pages = [];
  const mk = (idx, box, side) => { const pg = pageShell(box, side, `Page ${idx + 14}`, idx); pages.push(PAGES[idx](pg, ctx, T, side)); return pg; };
  const turn = spread === 1 || spread === 2;
  const base = [[0, 1], [0, 3], [2, 5], [4, 5]][spread];
  mk(base[0], leftBox, 'left');
  mk(base[1], rightBox, 'right');
  let leaf = null, front = null, back = null, shR = null, shL = null, shFront = null, shBack = null, t0 = 0;
  if (turn) {
    t0 = turnStart(T, spread);
    shR = el('div', { 'data-name': 'Turn shadow (right)', style: { position: 'absolute', left: '1000px', top: 0, width: '1000px', height: '1400px', pointerEvents: 'none', zIndex: 3, mixBlendMode: 'multiply' } }, book);
    shL = el('div', { 'data-name': 'Turn shadow (left)', style: { position: 'absolute', left: 0, top: 0, width: '1000px', height: '1400px', pointerEvents: 'none', zIndex: 3, mixBlendMode: 'multiply' } }, book);
    leaf = el('div', { 'data-name': 'Turning leaf', style: { position: 'absolute', left: '1000px', top: 0, width: '1000px', height: '1400px', transformOrigin: '0 50%', transformStyle: 'preserve-3d', zIndex: 4 } }, book);
    front = el('div', { style: { position: 'absolute', inset: 0, backfaceVisibility: 'hidden' } }, leaf);
    back = el('div', { style: { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' } }, leaf);
    const prevRight = spread === 1 ? 1 : 3, newLeft = spread === 1 ? 2 : 4;
    mk(prevRight, front, 'right'); mk(newLeft, back, 'left');
    shFront = el('div', { style: { position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(40,32,24,0.5), rgba(40,32,24,0.15))' } }, front);
    shBack = el('div', { style: { position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', background: 'linear-gradient(270deg, rgba(40,32,24,0.45), rgba(40,32,24,0.1))' } }, back);
  }
  // light: one key light upper left, a soft fall-off over the whole desk (screen space)
  el('div', { 'data-name': 'Grade (key light)', style: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50, mixBlendMode: 'multiply',
    background: `radial-gradient(ellipse ${L.pick({ landscape: '120% 140%', portrait: '160% 110%' })} at 22% 12%, rgba(255,255,255,0) 45%, rgba(70,62,54,0.16) 100%)` } }, root);

  const keys = camKeys(T, portrait);
  const rot = portrait ? -0.6 : -0.9;
  let lastCam = '';
  return {
    T,
    update(t) {
      const tg = t + ctx.start;
      const c = camAt(keys, tg);
      const tr = `translate(${(L.width / 2).toFixed(2)}px,${(L.height / 2).toFixed(2)}px) rotate(${rot}deg) scale(${c.s.toFixed(5)}) translate(${(-(c.cx + 1000)).toFixed(2)}px,${(-c.cy).toFixed(2)}px)`;
      if (tr !== lastCam) { cam.style.transform = tr; lastCam = tr; }
      if (turn) {
        const q = clamp((tg - t0) / TURN_DUR);
        const a = 180 * ease.inOutCubic(Math.pow(q, 0.92));
        if (q <= 0) {
          leaf.style.transform = 'none'; back.style.display = 'none'; front.style.display = 'block'; back.style.transform = 'rotateY(180deg)'; back.style.backfaceVisibility = 'hidden';
          shFront.style.opacity = 0; shR.style.opacity = 0; shL.style.opacity = 0; leftBox.style.display = 'block';
        } else if (q >= 1) {
          leaf.style.transform = 'translateX(-1000px)'; front.style.display = 'none'; back.style.display = 'block'; back.style.transform = 'none'; back.style.backfaceVisibility = 'visible';
          shBack.style.opacity = 0; shR.style.opacity = 0; shL.style.opacity = 0; leftBox.style.display = 'none';
        } else {
          leaf.style.transform = `rotateY(${(-a).toFixed(3)}deg)`; leftBox.style.display = 'block'; front.style.display = 'block'; back.style.display = 'block'; back.style.transform = 'rotateY(180deg)'; back.style.backfaceVisibility = 'hidden';
          const sa = Math.sin((a * Math.PI) / 180);
          shFront.style.opacity = (0.55 * Math.min(1, a / 90)).toFixed(3);
          shBack.style.opacity = (0.75 * (1 - clamp((a - 90) / 90))).toFixed(3);
          // shadow of the lifted leaf on the revealed right page, and on the left page as it comes down
          const xe = Math.max(0, Math.cos((a * Math.PI) / 180)) * 1000;
          shR.style.opacity = a < 90 ? (0.9 * sa).toFixed(3) : (0.9 * sa * 0.6).toFixed(3);
          shR.style.background = `linear-gradient(90deg, rgba(60,46,34,0.35) 0px, rgba(60,46,34,0.22) ${(xe * 0.6).toFixed(0)}px, rgba(60,46,34,0.0) ${(xe + 260).toFixed(0)}px)`;
          const xl = Math.max(0, -Math.cos((a * Math.PI) / 180)) * 1000;
          shL.style.opacity = a > 90 ? (0.8 * clamp((a - 90) / 70)).toFixed(3) : 0;
          shL.style.background = `linear-gradient(270deg, rgba(60,46,34,0.38) 0px, rgba(60,46,34,0.18) ${(xl * 0.8).toFixed(0)}px, rgba(60,46,34,0) ${(xl + 220).toFixed(0)}px)`;
        }
      }
      for (const p of pages) p.update(tg);
    },
  };
}
/* ---------- things on the desk: the pencil and the brush that made the pages ---------- */
function deskProps(cam) {
  const shadow = 'drop-shadow(12px 16px 9px rgba(6,8,10,0.55)) drop-shadow(2px 3px 2px rgba(6,8,10,0.5))';
  // pencil (unpainted cedar, hexagonal), left of the book
  const pen = el('div', { 'data-name': 'Desk: pencil', style: { position: 'absolute', left: '-170px', top: '300px', width: '32px', height: '830px', transform: 'rotate(-11deg)', transformOrigin: '50% 0', filter: shadow } }, cam);
  el('div', { style: { position: 'absolute', left: 0, top: 0, width: '32px', height: '700px', borderRadius: '3px 3px 0 0',
    background: 'linear-gradient(90deg, #A78A62 0 9px, #D8C29C 9px 21px, #BFA57D 21px 32px)' } }, pen);
  el('div', { style: { position: 'absolute', left: 0, top: '700px', width: '32px', height: '96px', clipPath: 'polygon(0 0, 100% 0, 58% 88%, 42% 88%)',
    background: 'linear-gradient(90deg, #C9B08A, #E8D8B8 45%, #CDB590)' } }, pen);
  el('div', { style: { position: 'absolute', left: '11px', top: '774px', width: '10px', height: '34px', clipPath: 'polygon(0 0, 100% 0, 55% 100%, 45% 100%)', background: '#3B3F44' } }, pen);
  // round brush (raw wood handle, nickel ferrule, the tip still wet with viridian), right of the book
  const br = el('div', { 'data-name': 'Desk: brush (viridian on the tip)', style: { position: 'absolute', left: '2150px', top: '90px', width: '30px', height: '900px', transform: 'rotate(13deg)', transformOrigin: '50% 0', filter: shadow } }, cam);
  el('div', { style: { position: 'absolute', left: 0, top: 0, width: '30px', height: '620px', clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)', borderRadius: '12px 12px 0 0',
    background: 'linear-gradient(90deg, #9C8058, #D3BC92 40%, #B59A70)' } }, br);
  el('div', { style: { position: 'absolute', left: '1px', top: '618px', width: '28px', height: '120px', clipPath: 'polygon(0 0, 100% 0, 88% 100%, 12% 100%)',
    background: 'linear-gradient(90deg, #6E7378, #C9CDD0 38%, #8D9296 70%, #5E6266)' } }, br);
  el('div', { style: { position: 'absolute', left: '4px', top: '736px', width: '22px', height: '150px', clipPath: 'polygon(0 0, 100% 0, 78% 55%, 52% 100%, 46% 100%, 22% 55%)',
    background: 'linear-gradient(180deg, #2E2A26 0 45%, #1E5A4A 70%, #24705C 100%)' } }, br);
}
export async function loadGeo(ctx) {
  if (!geoCache) geoCache = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  return geoCache;
}
