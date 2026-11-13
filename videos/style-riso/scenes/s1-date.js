// Spread 1 — HOOK: the date, cut out as strips, and a torn chart of the Caribbean with B-59's approximate position.
// intent: KNOW where + when · FEEL quiet threat · SEE the orange mark landing on the chart, off-register then snapping in.
// truth: chart = EV-derived (Natural Earth coastlines), position = RC, printed "position approx."; date strips = VO (our type).
// shots: 1A EST (spread, both pages) HOLD+creep → 1B PUSH/s toward the mark on "deep".
import { glide } from '/onclack-styles/engine/lib/anim.js';
import { F, FONT, wordT, spread, furniture, columns, printed, jolt, text, measure, fitSize, pathFrom, cutPts, tornPts, pasteShadow, tape, grey } from '../shared/riso.js';

export default async function (root, ctx) {
  const L = ctx.layout, u = L.unit, P = L.portrait;
  const sheet = spread(root, ctx, { seed: 11 });
  const C = columns(L);
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const fur = furniture(sheet.cam, sheet, L, { page: 2 });

  // voice (local times), visuals land 2 f before their word
  const tOct = wordT(ctx, 'October', 0, 0.58) - 2 * F;
  const tTwenty = wordT(ctx, 'twenty-seventh', 0, 1.1) - 2 * F;
  const tNine = wordT(ctx, 'nineteen', 0, 2.07) - 2 * F;
  const tSixty = wordT(ctx, 'sixty-two', 0, 2.61) - 2 * F;
  const tSoviet = wordT(ctx, 'Soviet', 0, 3.79) - 2 * F;
  const tSub = wordT(ctx, 'submarine', 0, 4.3) - 2 * F;
  const tDeep = wordT(ctx, 'deep', 0, 5.42) - 2 * F;
  const tCuba = wordT(ctx, 'Cuba', 0, 6.52) - 2 * F;

  // ---- date strip 1: "OCTOBER 27" (teal type, orange scissor-cut strip under it)
  const fHead = { family: FONT.cut, weight: 800, track: -0.01 };
  const l1 = 'OCTOBER 27';
  const s1 = fitSize(l1, fHead, C.left.w - 60 * u, 150 * u);
  const m1 = measure(l1, { ...fHead, size: s1 });
  const padX = 26 * u, padY = 20 * u;
  const d1 = { w: m1.w + 2 * padX, h: m1.asc + m1.desc + 2 * padY };
  const y1 = C.top + L.pick({ landscape: 70, portrait: 160 }) * u;
  const date1 = printed(sheet.cam, sheet, {
    name: '1A Date strip OCTOBER 27', x: C.left.x, y: y1, w: d1.w + 12 * u, h: d1.h + 12 * u, rot: -1.6, seed: 21,
    layers: [
      { ink: 'teal', at: tOct, draw: g => text(g, l1, padX, padY + m1.asc, { ...fHead, size: s1 }) },
      { ink: 'orange', at: tTwenty, gain: 0.62, starve: 0.45, draw: g => { g.fillStyle = grey(1); g.fill(pathFrom(cutPts(4 * u, 4 * u, d1.w, d1.h, 22, u))); } },
    ],
  });

  // ---- date strip 2: "1962" big, on a torn orange scrap
  const l2 = '1962';
  const s2 = fitSize(l2, fHead, C.left.w * L.pick({ landscape: 0.86, portrait: 0.8 }), 330 * u);
  const m2 = measure(l2, { ...fHead, size: s2 });
  const d2 = { w: m2.w + 2 * padX, h: m2.asc + m2.desc + 2 * padY };
  const y2 = y1 + d1.h + L.pick({ landscape: 30, portrait: 22 }) * u;
  const x2 = C.left.x + L.pick({ landscape: 70, portrait: 90 }) * u;
  const date2 = printed(sheet.cam, sheet, {
    name: '1A Date 1962', x: x2, y: y2, w: d2.w + 20 * u, h: d2.h + 20 * u, rot: 1.2, seed: 23,
    layers: [
      { ink: 'teal', at: tNine, draw: g => text(g, l2, padX + 6 * u, padY + 6 * u + m2.asc, { ...fHead, size: s2 }) },
      { ink: 'orange', at: tSixty, gain: 0.5, starve: 0.5, draw: g => { g.fillStyle = grey(1); g.fill(pathFrom(tornPts(8 * u, 8 * u, d2.w, d2.h, 24, u, { amp: 9 }))); } },
    ],
  });

  // ---- typed note under the date (left page only on 16:9)
  const fType = { family: FONT.mono, size: 30 * u, weight: 500, track: 0 };
  const noteStr = ['a Saturday.', 'Caribbean Sea.'];
  const noteY = y2 + d2.h + 46 * u;
  const note = printed(sheet.cam, sheet, {
    name: '1A Typed note', x: x2 + 10 * u, y: noteY, w: 420 * u, h: 100 * u, seed: 25,
    layers: [{ ink: 'teal', at: tSixty + 10 * F, starve: 0.25, draw: g => noteStr.forEach((s, i) => text(g, s, 4 * u, 34 * u + i * 44 * u, fType)) }],
  });
  if (P) note.box.style.display = 'none';

  // ---- the chart: torn from a sea chart, pasted, printed teal; orange = the mark
  const M = L.pick({
    landscape: { x: C.right.x, y: C.top + 40 * u, w: C.right.w, h: 760 * u },
    portrait: { x: C.left.x, y: noteY - 20 * u, w: C.left.w, h: 700 * u },
  });
  const lonC = -75.3, latC = 22.6, span = L.pick({ landscape: 19, portrait: 18 });
  const kx = M.w / span, ky = kx / Math.cos((23 * Math.PI) / 180);
  const proj = (lon, lat) => [M.w / 2 + (lon - lonC) * kx, M.h / 2 - (lat - latC) * ky];
  const tear = pathFrom(tornPts(14 * u, 14 * u, M.w - 28 * u, M.h - 28 * u, 31, u, { amp: 8, torn: [1, 0, 1, 1] }));
  const subLL = [-70.6, 23.5];
  const [sx, sy] = proj(...subLL);
  const fLab = { family: FONT.mono, size: 26 * u, weight: 500, track: 3 * u };
  const chart = printed(sheet.cam, sheet, {
    name: '1B Chart (Natural Earth coastlines)', x: M.x, y: M.y, w: M.w, h: M.h, rot: L.pick({ landscape: 0.8, portrait: -0.6 }), seed: 33,
    layers: [
      {
        ink: 'teal', at: tSoviet - 6 * F, dur: 8 * F, draw: g => {
          pasteShadow(g, tear, u, 0.7);
          g.save(); g.clip(tear);
          // hand-ruled sea lines (a chart's water tint, made of lines)
          g.strokeStyle = grey(0.32); g.lineWidth = 2 * u;
          for (let y = 30 * u; y < M.h; y += 17 * u) { g.beginPath(); g.moveTo(0, y); g.lineTo(M.w, y + 3 * u); g.stroke(); }
          // land: solid flood, white coastline gap, then the coast edge
          const ring = r => { g.beginPath(); r.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
          g.lineJoin = 'round';
          for (const f of geo.features) for (const r of f.rings) { ring(r); g.strokeStyle = '#fff'; g.lineWidth = 9 * u; g.stroke(); }
          for (const f of geo.features) for (const r of f.rings) { ring(r); g.fillStyle = grey(f.name === 'Cuba' ? 0.95 : 0.62); g.fill(); }
          // graticule ticks at the torn chart's top edge
          g.fillStyle = grey(1);
          for (let lon = -85; lon <= -65; lon += 5) { const [x] = proj(lon, 0); g.fillRect(x - 1 * u, 18 * u, 2 * u, 18 * u); text(g, `${-lon}°W`, x + 6 * u, 40 * u, { ...fLab, size: 18 * u, track: 0 }, 0.9); }
          g.restore();
          // labels in the sea (typed, pasted on)
          text(g, 'ATLANTIC', proj(-71.5, 27.6)[0], proj(-71.5, 27.6)[1], fLab, 0.85);
          text(g, 'CARIBBEAN SEA', proj(-79, 16.4)[0], proj(-79, 16.4)[1], fLab, 0.85);
        },
      },
      {
        ink: 'orange', at: tSub, draw: g => {
          // tape pieces at the top corners (printed, like everything else)
          tape(g, 70 * u, 22 * u, 150 * u, 46 * u, -9, 34, u, 0.34);
          tape(g, M.w - 80 * u, 26 * u, 140 * u, 46 * u, 7, 35, u, 0.34);
          // the mark: dot + ring + a cut arrow
          g.fillStyle = grey(1);
          g.beginPath(); g.arc(sx, sy, 15 * u, 0, Math.PI * 2); g.fill();
          g.lineWidth = 6 * u; g.strokeStyle = grey(1);
          g.beginPath(); g.arc(sx, sy, 40 * u, 0, Math.PI * 2); g.stroke();
          g.textAlign = 'right';
          text(g, 'B-59', sx - 54 * u, sy - 6 * u, { family: FONT.cut, weight: 800, size: 64 * u }, 1, 'right');
          text(g, 'position approx.', sx - 54 * u, sy + 30 * u, { family: FONT.mono, weight: 500, size: 24 * u }, 1, 'right');
        },
      },
    ],
  });

  // "deep" — a depth line drops from the mark (orange, its own small pass)
  const depth = printed(sheet.cam, sheet, {
    name: '1B Depth line', x: M.x + sx - 30 * u, y: M.y + sy + 44 * u, w: 260 * u, h: 150 * u, seed: 37,
    layers: [{ ink: 'orange', at: tDeep, dur: 9 * F, draw: g => {
      g.fillStyle = grey(1);
      for (let y = 0; y < 100 * u; y += 14 * u) g.fillRect(28 * u, y, 4 * u, 8 * u);
      g.beginPath(); g.moveTo(16 * u, 100 * u); g.lineTo(44 * u, 100 * u); g.lineTo(30 * u, 120 * u); g.closePath(); g.fill();
      text(g, 'deep', 56 * u, 118 * u, { family: FONT.mono, weight: 500, size: 26 * u }, 1);
    } }],
  });

  // "near Cuba" — a cut orange label pasted on Cuba
  const cubaXY = proj(-79.6, 21.9);
  const cuba = printed(sheet.cam, sheet, {
    name: '1B Cut label near Cuba', x: M.x + cubaXY[0] - 30 * u, y: M.y + cubaXY[1] + 58 * u, w: 150 * u, h: 64 * u, rot: -3, seed: 39,
    layers: [{ ink: 'orange', at: tCuba, draw: g => {
      g.fillStyle = grey(0.95); g.fill(pathFrom(cutPts(4 * u, 4 * u, 140 * u, 54 * u, 40, u, 0.6)));
      text(g, 'CUBA', 18 * u, 43 * u, { family: FONT.mono, weight: 500, size: 30 * u, track: 2 * u }, 0); // knocked out: paper shows through
    } }],
  });

  const items = [date1, date2, note, chart, depth, cuba];
  const lands = items.flatMap(i => i.lands);
  // camera: creep on the spread, then a slow push toward the mark on "deep"
  const fx = M.x + sx * 0.6, fy = M.y + sy;
  sheet.cam.style.transformOrigin = `${fx.toFixed(1)}px ${fy.toFixed(1)}px`;

  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -24, fade: 1.2 });

  return {
    update(t) {
      fur.update(t);
      items.forEach(i => i.update(t));
      const s = 1 + 0.004 * t + glide(t, tDeep - 4 * F, ctx.duration, 0, L.pick({ landscape: 0.05, portrait: 0.04 }));
      const jy = jolt(t, lands, 1.6 * u);
      sheet.cam.style.transform = `translate(0px, ${jy.toFixed(2)}px) scale(${s.toFixed(5)})`;
    },
  };
}
