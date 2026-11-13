// CONTOUR style kit — shared by every scene of style-contour.
// The map is ONE world (Mercator, x = lon°, y = Mercator-y°) seen by ONE camera that is a pure function of
// GLOBAL time, so the base map and every overlay agree on where things are, across scene cuts ("the survey glide").
import { clamp, lerp, progress, smootherstep } from '/onclack-styles/engine/lib/anim.js';

export const C = {
  bone: '#E8E4D8', ink: '#1C1E22', cobalt: '#1F3FAF', signal: '#D9541A', grey: '#9E9787', brick: '#B8462E',
};
// Only these line weights exist in this style (screen px at 1080 short side → scaled by L.unit).
export const LW = { hair: 1.5, line: 2, route: 3 };

export const R2D = 180 / Math.PI;
export const mercY = lat => -R2D * Math.log(Math.tan(Math.PI / 4 + lat / R2D / 2));

// Motion tokens (history-director §7.10) as cubic-bezier easings.
function bezier(x1, y1, x2, y2) {
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const x = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3 - p;
      const dx = 3 * (1 - t) ** 2 * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      if (Math.abs(dx) < 1e-6) break;
      t = clamp(t - x / dx, 0, 1);
    }
    return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3;
  };
}
export const tok = { enter: bezier(0.16, 1, 0.3, 1), exit: bezier(0.7, 0, 0.84, 0), move: bezier(0.65, 0, 0.35, 1) };
export const enterP = (t, t0, frames = 16, fps = 30) => tok.enter(progress(t, t0, t0 + frames / fps));
export const exitP = (t, t0, frames = 12, fps = 30) => tok.exit(progress(t, t0, t0 + frames / fps));
/** 0→1 in, then 1→0 out (enter/exit tokens). */
export const life = (t, tin, tout, fin = 16, fout = 12) => Math.min(enterP(t, tin, fin), 1 - exitP(t, tout, fout));

// ---------- voice timing ----------
/** Global start time of the n-th occurrence of a word (case/punctuation-insensitive). */
export function wordAt(words, w, n = 0, fallback = 0) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = words.filter(x => norm(x.word) === norm(w));
  return hits[n]?.start ?? fallback;
}
export const LEAD = 2 / 30; // visuals land 2 frames before their word

// ---------- data ----------
let dataPromise;
export const loadMap = ctx => (dataPromise ??= fetch(ctx.asset('assets/data/contours.json')).then(r => r.json()));

// Places (lon, lat). Sub position is APPROXIMATE (style test).
export const P = {
  sub: { lon: -70.0, lat: 24.0 },
  havana: { lon: -82.3666, lat: 23.1136 },
  maisi: { lon: -74.134, lat: 20.212 }, // Punta Maisí, east tip of Cuba
  moscow: { lon: 37.6173, lat: 55.7558 },
};
export const W = p => [p.lon, mercY(p.lat)];

export function haversineKm(a, b) {
  const p1 = a.lat / R2D, p2 = b.lat / R2D, dp = (b.lat - a.lat) / R2D, dl = (b.lon - a.lon) / R2D;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}
export function bearingDeg(a, b) {
  const p1 = a.lat / R2D, p2 = b.lat / R2D, dl = (b.lon - a.lon) / R2D;
  const y = Math.sin(dl) * Math.cos(p2), x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) * R2D + 360) % 360;
}
export const fmtKm = km => Math.round(km).toLocaleString('en-US');
export const fmtM = m => (m < 0 ? '−' : '') + Math.abs(Math.round(m)).toLocaleString('en-US');

// ---------- camera ----------
// A view: world target (lon, lat) placed at screen fraction (fx, fy) of the full frame, `span` = degrees of
// longitude across the frame width. Portrait gets its own views (north-up crop of the same corridor).
const VIEWS = {
  landscape: {
    wide: { lon: -76.2, lat: 23.6, fx: 0.5, fy: 0.52, span: 21 },
    approach: { lon: -70.0, lat: 24.0, fx: 0.56, fy: 0.5, span: 10.5 },
    deep: { lon: -70.0, lat: 24.0, fx: 0.5, fy: 0.5, span: 7.6 },
    section: { lon: -70.0, lat: 24.0, fx: 0.3, fy: 0.42, span: 8.4 },
    moscow: { lon: -70.0, lat: 24.0, fx: 0.4, fy: 0.62, span: 7.2 },
    close: { lon: -70.0, lat: 24.0, fx: 0.27, fy: 0.5, span: 3.2 },
    portrait: { lon: -70.0, lat: 24.0, fx: 0.25, fy: 0.5, span: 2.8 },
    out: { lon: -76.0, lat: 23.0, fx: 0.5, fy: 0.5, span: 19 },
  },
  portrait: {
    wide: { lon: -75.6, lat: 23.0, fx: 0.5, fy: 0.56, span: 12.5 },
    approach: { lon: -70.0, lat: 24.0, fx: 0.55, fy: 0.46, span: 7.5 },
    deep: { lon: -70.0, lat: 24.0, fx: 0.5, fy: 0.45, span: 5.4 },
    section: { lon: -70.0, lat: 24.0, fx: 0.5, fy: 0.3, span: 6.0 },
    moscow: { lon: -70.0, lat: 24.0, fx: 0.36, fy: 0.55, span: 5.4 },
    close: { lon: -70.0, lat: 24.0, fx: 0.5, fy: 0.27, span: 2.4 },
    portrait: { lon: -70.0, lat: 24.0, fx: 0.5, fy: 0.24, span: 2.1 },
    out: { lon: -76.2, lat: 22.6, fx: 0.5, fy: 0.42, span: 14.5 },
  },
};

/** Camera moves in global seconds. Each move glides (smootherstep) from wherever the camera is to a view. */
export function cameraPlan(words) {
  const w = (x, n) => wordAt(words, x, n);
  return [
    { t0: w('Soviet') - 0.2, t1: w('hides') + 0.5, to: 'approach' },     // follow the route head in
    { t0: w('deep') - 0.25, t1: w('Cuba') + 0.3, to: 'deep' },           // settle over the position
    { t0: w('Above') - 0.4, t1: w('ships') + 0.2, to: 'section' },       // make room for the section card
    { t0: w('Moscow') - 0.15, t1: w('silent') + 0.45, to: 'moscow' },      // open space toward the north-east
    { t0: w('On') - 0.35, t1: w('torpedo') + 0.1, to: 'close' },         // push in to the boat
    { t0: w('third') - 0.3, t1: w('Arkhipov') + 0.2, to: 'portrait' },   // small push for the person
    { t0: w('world') - 0.15, t1: w('later') + 0.25, to: 'out' },         // the survey glide back out
  ];
}

export function makeCamera(L, words) {
  const views = L.portrait ? VIEWS.portrait : VIEWS.landscape;
  const plan = cameraPlan(words);
  const CREEP = 0.05; // span shrinks 0.5 %/s on holds — never fully static
  const creepV = (v, dt) => ({ ...v, span: v.span / (1 + Math.max(0, dt) * CREEP / 10) });
  const blend = (a, b, p) => {
    const span = Math.exp(lerp(Math.log(a.span), Math.log(b.span), p));
    // centre moves in proportion to the zoom, so screen motion stays even (no swing on zoom moves)
    const wgt = Math.abs(b.span - a.span) > 1e-6 ? (span - a.span) / (b.span - a.span) : p;
    const ya = mercY(a.lat), yb = mercY(b.lat);
    return { lon: lerp(a.lon, b.lon, wgt), my: lerp(ya, yb, wgt), fx: lerp(a.fx, b.fx, p), fy: lerp(a.fy, b.fy, p), span };
  };
  const norm = v => ({ ...v, my: v.my ?? mercY(v.lat) });
  function view(gt) {
    let cur = norm(views.wide), settle = 0;
    for (const m of plan) {
      if (gt < m.t0) break;
      const from = creepV(cur, m.t0 - settle);
      const to = norm(views[m.to]);
      if (gt < m.t1) return blend(from, to, smootherstep((gt - m.t0) / (m.t1 - m.t0)));
      cur = to; settle = m.t1;
    }
    return norm(creepV(cur, gt - settle));
  }
  /** Camera at global time: k = px per world unit; project([lon,merc]) → [x,y] screen px. */
  return gt => {
    const v = view(gt);
    const k = L.width / v.span;
    const ox = v.fx * L.width - v.lon * k, oy = v.fy * L.height - v.my * k;
    return { k, ox, oy, span: v.span, project: ([x, y]) => [ox + x * k, oy + y * k], projectLL: p => [ox + p.lon * k, oy + mercY(p.lat) * k] };
  };
}

// ---------- small DOM helpers ----------
export const NS = 'http://www.w3.org/2000/svg';
export const pathD = (rings, close = false) =>
  rings.map(r => 'M' + r.map(p => p[0] + ' ' + p[1]).join('L') + (close ? 'Z' : '')).join('');

/** Fade for screen-space labels near the safe-area edge (so nothing pokes out while the camera glides). */
export function edgeFade(L, x, y, w = 0, h = 0, margin = 40) {
  const m = L.px(margin), s = L.safe;
  const dx = Math.min(x - s.x, s.x + s.w - (x + w)), dy = Math.min(y - s.y, s.y + s.h - (y + h));
  return clamp(Math.min(dx, dy) / m);
}

/** Depth-charge burst times (global s): one per stressed word, shared by the map rings and the section card. */
export function chargeBursts(words) {
  const w = x => wordAt(words, x);
  return [w('drop') + 0.32, w('practice') + 0.62, w('charges') + 0.3];
}
export const CHARGE_FALL = 0.5; // s from the surface to the burst

/** Card paper (a touch lighter than the bone map, so the card reads as an object lying on the map). */
export const CARD = '#F2EFE6';
