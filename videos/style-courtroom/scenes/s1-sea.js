// SHEET 1 — "October 27th, 1962. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW date + a boat hidden deep near Cuba · FEEL curiosity · SEE the boat sketched deep under one surface line.
// truth: corner map = Natural Earth coasts (EV-derived), boat position RC "approx."; the boat drawing = RC (Foxtrot type);
// the page says "reconstruction — from later accounts" (nobody drew this on the spot).
import { Sheet, PAL, seq, fit, camAt, pastelPatch, blob } from '../shared/sketch.js';
import { submarine, cubaMap } from '../shared/figures.js';
import { creep, rand } from '/onclack-styles/engine/lib/anim.js';

export default async function (root, ctx) {
  const L = ctx.layout, Pt = L.portrait, W = ctx.width, H = ctx.height, sf = L.safe, u = L.unit;
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const S = new Sheet(root, ctx, { seed: 11, name: 'Sheet 1' });
  const T0 = ctx.start, END = ctx.start + ctx.duration;

  // ---- 1A date, written as the voice says it ----
  const dx = sf.x + 24 * u, dy = sf.y + (Pt ? 96 : 92) * u;
  const date = S.text('27 Oct. 1962', dx, dy, { size: (Pt ? 96 : 86) * u, t0: 0.5, cps: 9.5, rot: -1.2 });
  const under = S.stroke([[dx - 6 * u, dy + 18 * u], [dx + date.total * 0.55, dy + 14 * u], [dx + date.total + 14 * u, dy + 8 * u]], { w: 4 * u, over: 10, alpha: 0.85 });
  seq([under], date.t1 + 0.05, { speed: 2600 });
  S.name('1A Date note', [dx, dy - 80 * u, date.total, 100 * u]);

  // ---- 1B corner map (where), drawn while the year is said ----
  const mb = Pt ? [sf.x + 40 * u, sf.y + 170 * u, sf.w - 90 * u, 420 * u] : [W * 0.625, sf.y + 30 * u, W * 0.3, H * 0.36];
  const [bx, by, bw, bh] = mb;
  const frame = [
    S.stroke([[bx - 10, by], [bx + bw + 14, by + 3]], { w: 2.6 * u, alpha: 0.7, over: 8 }),
    S.stroke([[bx + bw, by - 10], [bx + bw - 2, by + bh + 12]], { w: 2.6 * u, alpha: 0.7 }),
    S.stroke([[bx + bw + 10, by + bh], [bx - 12, by + bh - 2]], { w: 2.6 * u, alpha: 0.7 }),
    S.stroke([[bx + 1, by + bh + 10], [bx - 1, by - 12]], { w: 2.6 * u, alpha: 0.7 }),
  ];
  const map = cubaMap(S, geo, [bx + 14 * u, by + 14 * u, bw - 28 * u, bh - 28 * u], Pt ? { lon0: -85.5, lon1: -67.5, lat0: 18.6, lat1: 28 } : { lon0: -85.5, lon1: -68.5, lat0: 18.4, lat1: 28.2 });
  let t = seq(frame, 1.75, { speed: 3200 });
  fit(map.strokes, t, t + 1.3);
  const [mx, my] = map.proj([-71.2, 25.4]);
  const ring = [];
  for (let i = 0; i <= 14; i++) { const a = (i / 13) * Math.PI * 2 + 0.6; ring.push([mx + Math.cos(a) * 30 * u * (1 + i * 0.01), my + Math.sin(a) * 22 * u]); }
  const mark = [S.stroke([[mx - 9 * u, my - 9 * u], [mx + 9 * u, my + 9 * u]], { w: 3.6 * u }), S.stroke([[mx + 9 * u, my - 9 * u], [mx - 9 * u, my + 9 * u]], { w: 3.6 * u }),
    S.stroke(ring, { w: 2.4 * u, alpha: 0.75, wobble: 0.6 })];
  seq(mark, 4.95, { speed: 1800 });
  const lbl = S.text('B-59, approx.', mx - 12 * u, my - 40 * u, { size: 50 * u, t0: 5.3, cps: 16, align: 'right', rot: -2 });
  const cuba = S.text('CUBA', ...(Pt ? [bx + bw * 0.22, by + bh * 0.9] : [bx + bw * 0.16, by + bh * 0.88]), { size: 56 * u, t0: 6.3, cps: 13, rot: 2 });
  S.name('1B Corner map: Cuba (Natural Earth), B-59 approx.', [bx, by, bw, bh]);

  // ---- 1C the sea: one surface line, blue pastel water ----
  const sy = Pt ? H * 0.445 : H * 0.375, sx0 = Pt ? W * 0.04 : W * 0.035, sx1 = Pt ? W * 0.97 : W * 0.585;
  const surf = S.stroke([[sx0, sy + 4], [sx0 + (sx1 - sx0) * 0.3, sy - 3], [sx0 + (sx1 - sx0) * 0.65, sy + 5], [sx1, sy - 2]], { w: 4.2 * u, over: 16, taper: [0.05, 0.3] });
  const flicks = Array.from({ length: Pt ? 5 : 6 }, (_, i) => {
    const x = sx0 + (sx1 - sx0) * (0.06 + i * 0.16 + (rand(40 + i) - 0.5) * 0.08), yy = sy - (8 + rand(50 + i) * 10) * u, L = (26 + rand(60 + i) * 40) * u;
    return S.stroke([[x, yy + 3 * u], [x + L * 0.45, yy - (5 + rand(70 + i) * 6) * u], [x + L, yy + 2 * u]], { w: (1.8 + rand(80 + i)) * u, alpha: 0.55, taper: [0.2, 0.5], dur: 0.06 });
  });
  t = seq([surf], 1.95, { speed: 2400 });
  seq(flicks, t, { speed: 1600, gap: 0.02 });
  const subPl = Pt ? { x: W * 0.5, y: H * 0.635, s: 0.82 * u } : { x: W * 0.35, y: H * 0.72, s: 0.98 * u };
  // water: pastel only around the boat and under the surface line, edges left unfinished
  const band = pastelPatch(S, blob(Pt ? W * 0.5 : W * 0.3, sy + 70 * u, Pt ? W * 0.46 : W * 0.27, 55 * u, 9, 10), { color: PAL.blue, w: 22 * u, seed: 31, alpha: 0.42, angles: [-4] });
  const water = pastelPatch(S, blob(subPl.x, subPl.y + 10 * u, 620 * subPl.s, 150 * subPl.s, 5), { color: PAL.blue, w: 30 * u, seed: 21, alpha: 0.5 });
  seq(band, 2.62, { speed: 9000 });
  seq(water, 5.3, { speed: 16000, gap: 0.05 });            // the sea closes round the boat after it is drawn

  // ---- 1D the quick sketch: three gesture lines → finished boat in ~1.5 s ----
  const sub = submarine(S, subPl, { seed: 3 });
  fit(sub.gesture, 3.72, 4.12);                       // "A Soviet…"
  t = fit(sub.contour, 4.14, 4.78);                   // "…submarine" (4.30)
  fit(sub.ticks, t, t + 0.16, { gap: 0.004 });
  t = fit(sub.tone, t + 0.18, t + 0.42);
  fit(sub.chalk, t, t + 0.16);
  S.smudge(sub.smudge, { t0: 5.0, t1: 5.7, alpha: 0.32, blur: 18 * u });
  S.name('1D Submarine B-59 (Foxtrot type, sketch)', [subPl.x - 520 * subPl.s, subPl.y - 165 * subPl.s, 1040 * subPl.s, 230 * subPl.s]);

  // ---- 1E "deep": a dashed sounding line from the surface down to the boat ----
  const ax = Pt ? W * 0.27 : W * 0.155, ay0 = sy + 22 * u, ay1 = subPl.y - 60 * subPl.s;
  const dash = [];
  for (let y = ay0; y < ay1 - 18 * u; y += 30 * u) dash.push(S.stroke([[ax, y], [ax + 1, y + 16 * u]], { w: 3 * u, dur: 0.03, wobble: 0, taper: [0.1, 0.3] }));
  dash.push(S.stroke([[ax - 14 * u, ay1 - 20 * u], [ax, ay1], [ax + 14 * u, ay1 - 22 * u]], { w: 3.2 * u, dur: 0.08 }));
  seq(dash, 5.36, { gap: 0.012 });
  const deep = S.text('deep', ax + 22 * u, (ay0 + ay1) / 2 + 14 * u, { size: 62 * u, t0: 5.42, cps: 12, rot: -3 });
  S.name('1E "deep" sounding line', [ax - 20 * u, ay0, 200 * u, ay1 - ay0]);

  // ---- honesty line ----
  const cx = Pt ? sf.x + sf.w - 10 * u : W * 0.885, cy = Pt ? sf.y + sf.h - 30 * u : sf.y + sf.h - 24 * u;
  S.text('reconstruction, drawn from later accounts', cx, cy, { size: 46 * u, t0: 5.95, cps: 42, align: 'right', alpha: 0.7 });
  S.name('Honesty line', [cx - 760 * u, cy - 50 * u, 760 * u, 60 * u]);

  // ---- camera: close on the date → open the sheet → lean in to the boat → drift toward the map ----
  const C = Pt
    ? [[0, 1.07, W * 0.44, H * 0.38], [1.9, 1.07, W * 0.44, H * 0.38], [3.3, 1.0, W * 0.5, H * 0.5], [3.7, 1.0, W * 0.5, H * 0.5], [5.4, 1.05, W * 0.5, H * 0.55], [6.0, 1.05, W * 0.5, H * 0.55], [7.4, 1.03, W * 0.5, H * 0.47]]
    : [[0, 1.08, W * 0.42, H * 0.42], [1.9, 1.08, W * 0.42, H * 0.42], [3.3, 1.0, W * 0.5, H * 0.5], [3.7, 1.0, W * 0.5, H * 0.5], [5.4, 1.045, W * 0.46, H * 0.54], [6.0, 1.045, W * 0.46, H * 0.54], [7.4, 1.03, W * 0.52, H * 0.48]];

  // ---- sound: the sea under the sheet; dry pastel grain while the boat is sketched; the page turns ----
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -22, fade: 0.6 });
  ctx.sfx('sand-sprinkle-01', 2.7, { lu: -27, duration: 0.7, fadeIn: 0.05, fadeOut: 0.25 });   // pastel side dragged for the water
  ctx.sfx('sand-sprinkle-01', 4.14, { lu: -24, duration: 1.1, fadeIn: 0.03, fadeOut: 0.3 });   // charcoal on the boat
  const flipAt = ctx.duration - 0.5;
  ctx.sfx('page-turn-01', flipAt - 0.62, { lu: -14, duration: 1.3, fadeOut: 0.25 });

  return {
    update(tl) {
      const tg = T0 + tl;
      const [s, fx, fy] = camAt(tg, C);
      S.camera(s * creep(tl, 0.05), fx, fy);
      S.render(tg);
      S.flip((tl - flipAt) / 0.5);
    },
  };
}
