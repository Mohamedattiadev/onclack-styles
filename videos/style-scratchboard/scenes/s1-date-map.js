// Board 1 — DATE scratched in light, then the MAP cut out of the dark.
// intent: KNOW 27 Oct 1962, a Soviet sub near Cuba · FEEL curiosity, cold · SEE "1962" in knife lines, then Cuba brightening
// truth: date = fact; map = EV-derived (Natural Earth); sub position = RC, labelled "approx."
import { glide, clamp } from '/onclack-styles/engine/lib/anim.js';
import { makeBoard, fontsReady, wordT, toneOf, ringPts, label, FONT, HEX, F } from '../shared/board.js';

export default async function (root, ctx) {
  await fontsReady();
  const L = ctx.layout, W = L.width, H = L.height, P = L.portrait;
  const B = makeBoard(root, ctx, 'Board 1');
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();

  const tOct = wordT(ctx, 'October', 0, 0.58) - 2 * F, t27 = wordT(ctx, 'twenty-seventh', 0, 1.1) - 2 * F;
  const t19 = wordT(ctx, 'nineteen', 0, 2.07) - 2 * F, tSub = wordT(ctx, 'submarine', 0, 4.3) - 2 * F;
  const tDeep = wordT(ctx, 'deep', 0, 5.42) - 2 * F, tCuba = wordT(ctx, 'Cuba', 0, 6.52) - 3 * F;
  const tSov = wordT(ctx, 'A', 0, 3.62);
  const wipeA = tSov - 0.42, wipeB = wipeA + 0.34;

  // ---------- 1A · the date, letter by letter in knife lines (reading direction = tool direction)
  const word = (text, size, x, base, s, t0, dur, name, seed) => {
    const font = `600 ${size}px ${FONT.display}`;
    const c = document.createElement('canvas').getContext('2d'); c.font = font; c.letterSpacing = '-0.01em';
    const w = c.measureText(text).width + size * 0.2, h = size * 1.15;
    B.hatch({ name, x: x - size * 0.05, y: base - size * 0.92, w, h, angle: 72, spacing: s, maxW: 0.8, gamma: 1, order: -1, t0, dur, lineTime: 0.09, seed,
      draw: g => { g.font = font; g.letterSpacing = '-0.01em'; const gr = g.createLinearGradient(0, 0, w * 0.6, h); gr.addColorStop(0, '#fff'); gr.addColorStop(0.55, '#e6e6e6'); gr.addColorStop(1, '#8c8c8c'); g.fillStyle = gr; g.fillText(text, size * 0.05, size * 0.92); } });
    return w;
  };
  if (!P) {
    const x0 = L.safe.x + L.px(70);
    const w1 = word('October', L.px(150), x0, H * 0.38, L.px(5.2), tOct, 0.42, 'Date word October', 1);
    word('27', L.px(150), x0 + w1 + L.px(6), H * 0.38, L.px(5.2), t27, 0.22, 'Date word 27', 2);
    word('1962', L.px(440), x0 - L.px(18), H * 0.8, L.px(8.5), t19, 0.62, 'Date word 1962', 3);
  } else {
    const x0 = L.safe.x + L.px(16);
    const w1 = word('October', L.px(146), x0, H * 0.3, L.px(5.2), tOct, 0.42, 'Date word October', 1);
    word('27', L.px(146), x0 + w1 + L.px(4), H * 0.3, L.px(5.2), t27, 0.22, 'Date word 27', 2);
    word('1962', L.px(345), x0 - L.px(12), H * 0.49, L.px(7.5), t19, 0.62, 'Date word 1962', 3);
  }
  // the sea below the date: cold cyan swell lines, the only colour wash
  const seaY = P ? H * 0.6 : H * 0.865;
  B.hatch({ name: 'Swell', x: 0, y: seaY, w: W, h: H - seaY, angle: 0, spacing: L.px(9), maxW: 0.7, gamma: 1.1, color: 1, t0: 0.02, dur: 1.5, lineTime: 0.85, glint: false, seed: 4,
    waves: [[L.px(5), 0.0085, 0.045, 0], [L.px(2), 0.021, -0.02, 0]],
    draw: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a2a2a'); gr.addColorStop(0.12, '#9a9a9a'); gr.addColorStop(0.35, '#555'); gr.addColorStop(1, '#0c0c0c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } });

  B.wipe(wipeA, wipeB, 0.02);

  // ---------- 1B · the map, cut out of the dark
  const lon0 = P ? -84 : -87.2, lat0 = P ? 33.2 : 29.6, k = P ? L.px(80) : L.px(100), kc = Math.cos((23 * Math.PI) / 180);
  const proj = (lo, la) => [(lo - lon0) * k * kc, (lat0 - la) * k];
  const pathOf = pick => { const pa = new Path2D(); for (const f of geo.features) if (pick(f)) for (const r of f.rings) r.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? pa.lineTo(x, y) : pa.moveTo(x, y); }); return pa; };
  const ALL = pathOf(() => true), CUBA = pathOf(f => f.name === 'Cuba');
  const rings = (g, pick) => g.fill(pick === true ? ALL : CUBA);
  const blurred = (g, path, fill, r) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const cg = c.getContext('2d'); cg.fillStyle = fill; cg.fill(path); g.filter = `blur(${r}px)`; g.drawImage(c, 0, 0); g.filter = 'none'; };
  const t1 = wipeB - 0.06;
  // sea: thin cyan lines, a little brighter over the shallows
  B.hatch({ name: 'Sea lines', x: 0, y: 0, w: W, h: H, angle: 0, spacing: L.px(9.5), maxW: 0.75, gamma: 1, color: 1, t0: tDeep - 0.55, dur: 1.15, lineTime: 0.55, glint: false, seed: 5,
    waves: [[L.px(2.2), 0.012, 0.03, 0]],
    draw: (g, w, h) => {
      g.fillStyle = 'rgb(40,40,40)'; g.fillRect(0, 0, w, h);
      blurred(g, ALL, 'rgb(150,150,150)', L.px(14));
      g.fillStyle = '#000'; rings(g, true);
    } });
  // all land: fine diagonal hatch, half light
  B.hatch({ name: 'Land', x: 0, y: 0, w: W, h: H, angle: -45, spacing: L.px(6), maxW: 0.8, gamma: 1, t0: t1, dur: 0.85, lineTime: 0.12, seed: 6,
    draw: g => blurred(g, ALL, 'rgb(118,118,118)', L.px(1)) });
  // Cuba: the signature reveal — a second, crossing pass brightens it line by line on its word
  B.hatch({ name: 'Cuba brightening', x: 0, y: 0, w: W, h: H, angle: 45, spacing: L.px(6), maxW: 0.8, gamma: 1, order: -1, t0: tCuba, dur: 0.5, lineTime: 0.1, seed: 7,
    draw: g => { g.fillStyle = '#fff'; rings(g, false); } });
  const cuba = geo.features.find(f => f.name === 'Cuba').rings.reduce((a, r) => (r.length > a.length ? r : a));
  B.stroke({ name: 'Cuba coast', pts: cuba.filter((_, i) => i % 2 === 0).map(([lo, la]) => proj(lo, la)), width: L.px(2.4), t0: tCuba + 0.05, t1: tCuba + 0.9, taper: 6, rough: 0.2 });
  // the submarine: one knife ring, position approx.
  const sub = proj(-71.2, 25.4);
  B.stroke({ name: 'B-59 ring', pts: ringPts(sub[0], sub[1], L.px(30)), width: L.px(3.2), t0: tSub, t1: tSub + 0.32, taper: 10, rough: 0.15 });
  B.dots([{ x: sub[0], y: sub[1], r: L.px(5), t: tSub + 0.3 }]);

  const lab = [];
  const subL = label(root, L, { name: 'Label B-59', text: 'B-59', x: 0, y: 0, size: L.px(62), family: FONT.display, weight: 600, track: '0.01em', caps: false, anchor: 'right', t0: tSub + 0.1, dur: 0.3 });
  const subN = label(root, L, { name: 'Label approx', text: 'position approx.', x: 0, y: 0, size: L.px(30), weight: 600, track: '0.12em', anchor: 'right', t0: tSub + 0.3, dur: 0.3, opacity: 0.8 });
  const cubaL = label(root, L, { name: 'Label Cuba', text: 'Cuba', x: 0, y: 0, size: L.px(46), weight: 800, track: '0.32em', t0: tCuba + 0.1, dur: 0.35 });
  const flaL = label(root, L, { name: 'Label Florida', text: 'Florida', x: 0, y: 0, size: L.px(30), weight: 600, track: '0.24em', anchor: P ? 'left' : 'right', t0: t1 + 0.4, dur: 0.3, opacity: 0.7 });
  lab.push([subL, () => [sub[0] - L.px(46), sub[1] - L.px(62)]], [subN, () => [sub[0] - L.px(46), sub[1] + L.px(4)]],
    [cubaL, () => proj(-80.6, 20.6)], [flaL, () => (P ? proj(-79.7, 28.3) : proj(-82.9, 27.0))]);

  // sound: the sea at the hull, a little grit under the first knife strokes
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -14 });
  ctx.sfx('sand-sprinkle-01', tOct, { lu: -26 });

  return {
    update(t) {
      // camera: date board creeps; map board pushes in slowly toward Cuba and the sub
      let cam;
      if (t < wipeB) cam = { z: 1 + 0.006 * t, cx: W / 2, cy: H / 2 };
      else {
        const p = clamp((t - wipeB) / (ctx.duration - wipeB));
        const fx = (sub[0] + proj(-78, 21.5)[0]) / 2, fy = (sub[1] + proj(-78, 21.5)[1]) / 2;
        cam = { z: glide(p, 0, 1, 1, 1.07), cx: glide(p, 0, 1, W / 2, W / 2 + (fx - W / 2) * 0.2), cy: glide(p, 0, 1, H / 2, H / 2 + (fy - H / 2) * 0.2) };
      }
      B.render(t, cam);
      for (const [l, pos] of lab) {
        const [x, y] = B.toScreen(...pos());
        l.node.style.left = x.toFixed(2) + 'px'; l.node.style.top = y.toFixed(2) + 'px';
        l.update(t);
      }
    },
  };
}
