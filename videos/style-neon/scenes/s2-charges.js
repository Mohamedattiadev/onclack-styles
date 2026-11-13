// 2 · Section through the sea. A neon sign cannot move, so motion is SWITCHING (chaser segments): each practice
// depth charge is a column of short tubes that light one after another downward, then a ring catches at depth
// (+ a muffled underwater thud). "Moscow" is on the wall too — on "silent" its relay clicks, the gas twitches,
// and it never catches.
import { glide } from '/onclack-styles/engine/lib/spring.js';
import { makeStage, makeTube, paintLabel, textStrokes, xf, SHAPES, bright } from '../shared/neon.js';
import { wordAt, switchOn, F } from '../shared/cues.js';

const SUB_ORDER = [[...SHAPES.sub[2]].reverse(), SHAPES.sub[1], SHAPES.sub[0]];
const SHIP_ORDER = [SHAPES.ship[3], SHAPES.ship[2], SHAPES.ship[1], SHAPES.ship[0]];
const ring = (cx, cy, r, n = 28) => Array.from({ length: n + 1 }, (_, i) => { const a = (-80 + 340 * i / n) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

export default function (root, ctx) {
  const st = makeStage(root, ctx, { seed: 23, name: '2 · Sign wall (section)' });
  const { W, H, u, L } = st;
  const sf = L.safe, P = L.portrait, words = ctx.words;

  // sea surface: one long wavy argon tube, ends run out of frame
  const wy = H * L.pick({ landscape: 0.4, portrait: 0.31 });
  const wave = [];
  for (let x = -60 * u; x <= W + 60 * u; x += 9 * u) wave.push([x, wy + 7 * u * Math.sin(x / (26 * u))]);
  const waveT = makeTube(st, { strokes: [wave], gas: 'blue', w: 7 * u, name: '2A sea surface', supportEvery: 7 * u * 26 });

  // two destroyers riding the surface
  const shipLen = L.pick({ landscape: 300, portrait: 300 }) * u;
  const shipX = P ? [W * 0.28, W * 0.66] : [W * 0.3, W * 0.62];
  const ships = shipX.map((x, i) => makeTube(st, {
    strokes: xf(SHIP_ORDER, x, wy - 11 * u, shipLen / 100, i === 1), gas: 'warm', w: 7 * u, name: `2B destroyer ${i + 1}`,
    ends: ['up', i ? 'right' : 'left'], grommet: true,
    wireTo: [[x + (i ? -1 : 1) * shipLen * 0.12, wy - shipLen * 0.27 - 46 * u], [x + (i ? 1 : -1) * (shipLen * 0.5 + 50 * u), wy - 30 * u]],
  }));

  // the submarine below (lit since scene 1)
  const subLen = L.pick({ landscape: 380, portrait: 520 }) * u;
  const sx = P ? W * 0.45 : W * 0.48, sy = H * L.pick({ landscape: 0.8, portrait: 0.69 });
  const subT = makeTube(st, { strokes: xf(SUB_ORDER, sx, sy, subLen / 100), gas: 'blue', w: 9 * u, name: '2C submarine', ends: ['up', 'left'],
    wireTo: [[sx + subLen * 0.08, sy - subLen * 0.165 - 50 * u], [sx - subLen * 0.5 - 70 * u, sy + 20 * u]], grommet: true });

  // depth-charge chasers (3 drops) + burst rings that catch short of the hull ("practice")
  const dashL = 30 * u, gap = 18 * u, n = P ? 6 : 4;
  const drops = [{ ship: 0, k: 0.3 }, { ship: 1, k: -0.25 }, { ship: 0, k: -0.1 }];
  const tDrop = wordAt(words, 'drop', 0, 8.95) - 2 * F;
  const chasers = drops.map((d, j) => {
    const x = shipX[d.ship] + d.k * shipLen + (d.ship ? 1 : -1) * 6 * u;
    const y0 = wy + 34 * u;
    const dashes = [];
    for (let i = 0; i < n; i++) {
      const y = y0 + i * (dashL + gap);
      dashes.push(makeTube(st, { strokes: [[[x, y], [x, y + dashL]]], gas: 'warm', w: 5.5 * u, name: `2D charge ${j + 1} segment ${i + 1}`,
        ends: ['back', 'back'], supports: false }));
    }
    const ry = y0 + n * (dashL + gap) + 22 * u;
    const rg = makeTube(st, { strokes: [ring(x, ry, 19 * u)], gas: 'warm', w: 5.5 * u, name: `2D burst ring ${j + 1}`, ends: ['back', 'back'], supports: false });
    const t0 = tDrop + j * 0.56;
    const tBurst = t0 + n * 0.1 + 0.05;
    ctx.sfx(j === 1 ? 'boom-slapback-01' : 'boom-distant-01', tBurst - ctx.start + F, { lu: j === 1 ? -15 : -12 });
    return { dashes, rg, t0, tBurst };
  });
  paintLabel(st, shipX[0] - shipLen * 0.5, wy + 34 * u + n * (dashL + gap) + 90 * u, 'practice depth charges', { size: 26, name: '2D label' });

  // Moscow: a sign that will not light
  const mcap = L.pick({ landscape: 58, portrait: 74 }) * u;
  const mx = P ? W / 2 : sf.x + sf.w - 20 * u, my = P ? sf.y + 40 * u : sf.y + 40 * u;
  const mText = textStrokes('MOSCOW', mx, my, mcap, { align: P ? 0.5 : 1 });
  const moscow = makeTube(st, { strokes: mText.strokes, gas: 'warm', w: 8 * u, name: '2E "MOSCOW" (never lights)', ends: ['left', 'right'],
    grommet: true, wireTo: [[mText.x0 - 36 * u, my + mcap * 0.3], [mText.x1 + 36 * u, my + mcap * 0.6]] });

  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -22 });
  const tShips = switchOn(ctx, wordAt(words, 'ships', 0, 8.63) - 2 * F, { lu: -18 });
  const tSilent = switchOn(ctx, wordAt(words, 'silent', 0, 11.93) - 2 * F, { sfx: 'neon-relay-02', lu: -15 });
  const tickAt = new Set();
  chasers.forEach(c => c.dashes.forEach((_, i) => { const tt = +(c.t0 + i * 0.1).toFixed(2); if (!tickAt.has(tt)) { tickAt.add(tt); if (i === 0) ctx.sfx('neon-tick-01', tt - ctx.start + F, { lu: -24 }); } }));

  const chase = (T, on, dur) => (T < on ? 0 : T < on + dur ? 0.95 : Math.max(0, 0.06 * (1 - (T - on - dur) / 0.3)));
  return {
    update(t) {
      const T = ctx.start + t;
      waveT.set(1);
      subT.set(bright(T, ctx.start - 2, 21));
      ships.forEach((s, i) => s.set(bright(T, tShips + i * 0.13, 41 + i)));
      for (const c of chasers) {
        c.dashes.forEach((d, i) => d.set(chase(T, c.t0 + i * 0.1, 0.2)));
        c.rg.set(bright(T, c.tBurst, 50, { gentle: true, off: c.tBurst + 0.55 }));
      }
      moscow.set(bright(T, tSilent, 61, { fail: true }));
      st.camera(glide(t, 0, ctx.duration + 1, 1.0, 1.035), sx, sy - (sy - wy) * 0.4);
      st.grainAt(T);
    },
  };
}
