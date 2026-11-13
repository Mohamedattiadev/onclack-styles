// 2 · WS cross-section, HI → PED down — "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// Two card destroyers sit on the surface strips (sailing slowly R→L, bow left, same side as the sub). Charges roll off the
// stern on fine threads and sink; each bursts as a twist of crumpled tissue beside the hidden sub. Camera follows them down,
// focus racks from the ships to the sub. Then the Moscow tag: silence. Truth: RC (staged model).
import { svg, glide, ease, progress, clamp, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { defs, makeCamera, grade, label, wt, sceneIn, destroyer, band, paper, shade, charge, tissue, toScreen, fromScreen } from '../shared/kit.js';
import { buildSea } from '../shared/sea.js';

export default function (root, ctx) {
  const L = ctx.layout, W = ctx.width, H = ctx.height, u = L.unit, P = 's2';
  root.style.background = '#1b1916';
  const d = defs(root, P);
  const cam = makeCamera(root, W, H, '2 Camera world');
  const sY = H * L.pick({ landscape: 0.36, portrait: 0.32 });
  const SHIP_P = 0.31, CH_P = 0.85;
  const ships = [];
  const sea = buildSea(cam, P, d, {
    u, surfaceY: sY, aspect: W / H, seed: 41, subP: 0.9,
    subX: W * L.pick({ landscape: 0.4, portrait: 0.12 }), subY: H * L.pick({ landscape: 0.86, portrait: 0.69 }),
    subLen: W * L.pick({ landscape: 0.4, portrait: 0.8 }), coastX1: W * L.pick({ landscape: -0.1, portrait: -0.2 }), floorY: 1.02,
    afterWater(c, { X0, X1 }) {
      const l = c.layer('2A US destroyers (card models)', SHIP_P);
      const specs = L.pick({
        landscape: [{ x: 0.2, len: 0.34, name: '2A Destroyer 1' }, { x: 0.66, len: 0.22, name: '2A Destroyer 2' }],
        portrait: [{ x: 0.1, len: 0.66, name: '2A Destroyer 1' }, { x: 0.86, len: 0.4, name: '2A Destroyer 2' }],
      });
      specs.forEach((sp, i) => {
        const g = svg('g', {}, l);
        destroyer(g, P, W * sp.x, sY + 3 * u, W * sp.len, { seed: 500 + i * 40, name: sp.name, fill: i ? '#8a9296' : '#7d878c' });
        ships.push({ g, x: W * sp.x, len: W * sp.len, speed: W * (i ? 0.006 : 0.009) });
      });
      // the front wave strip hides the hulls' bottoms: ships sit IN the sea, not on a line
      const fl = c.layer('2A Surface strip (front)', SHIP_P + 0.03);
      paper(fl, band(X0, X1, sY + 12 * u, H * 1.6, 9 * u, 70 * u, 77, 8 * u), { P, fill: '#5f9194', rim: '#cfe0d6', thick: 3.5 * u, shadow: { dx: 14 * u, dy: 5 * u, b: 4, op: 0.4 }, shadowCol: '#06141b', light: 0.6 });
    },
  });

  // charges + bursts live just in front of the deepest strip
  const cl = cam.layer('2B Depth charges on threads', CH_P);
  const N = 3, tDrop = wt(ctx, 'drop', 0, 1.74), tChg = wt(ctx, 'charges.', 0, 2.84);
  const charges = Array.from({ length: N }, (_, i) => {
    const g = svg('g', { 'data-name': `2B Depth charge ${i + 1}` }, cl);
    const thread = svg('path', { stroke: '#e8e2d0', 'stroke-width': 1 * u, opacity: 0.6, fill: 'none' }, cl);
    const body = svg('g', {}, g); charge(body, P, 1.7 * u, 1300 + i * 7);
    const burst = svg('g', { opacity: 0 }, cl); tissue(burst, P, 46 * u, 1400 + i * 13);
    return { g, thread, burst, rel: tDrop - 0.05 + i * 0.32, hit: tChg + 0.15 + i * 0.42 };
  });

  const s = L.safe;
  const navy = label(root, L, {
    name: '2 Tag: US Navy', x: L.pick({ landscape: s.x, portrait: s.x }), y: L.pick({ landscape: s.y, portrait: s.y }), rot: -1,
    lines: [{ text: 'US Navy destroyers', kind: 'kicker' }, { text: 'Practice depth charges' }],
  });
  const moscow = label(root, L, {
    name: '2 Tag: Moscow', x: L.pick({ landscape: s.x + s.w, portrait: s.x + s.w }), y: L.pick({ landscape: s.y + s.h, portrait: s.y + s.h }),
    ax: 1, ay: 1, rot: 1.2, lines: [{ text: 'Radio from Moscow', kind: 'kicker' }, { text: 'Silent for days', kind: 'accent' }],
  });
  const g = grade(root, L, { vignette: 0, warm: 0.05 });
  const tMos = wt(ctx, 'Moscow', 0, 3.74);
  for (const c of charges) ctx.sfx('boom-distant-01', c.hit, { volume: 0.35 });

  const camAt = t => {
    const down = glide(t, tDrop + 0.2, tChg + 0.9, 0, 1);
    return { x: glide(t, 0, ctx.duration, W * 0.01, -W * 0.015), y: -H * 0.06 + down * H * 0.13, zoom: 1.02 + t * 0.006, dolly: 0.04 + down * 0.04 };
  };
  return {
    update(t) {
      sceneIn(root, ctx, t);
      const st = camAt(t);
      // small, decaying, noise-based shake at each burst (no per-frame sign flips)
      let sh = 0;
      for (const c of charges) { const dt = t - c.hit; if (dt > 0 && dt < 0.5) sh += (1 - dt / 0.5) ** 2; }
      st.x += noise1(t * 23, 3) * sh * 3.5 * u; st.y += noise1(t * 19, 8) * sh * 2.5 * u;
      const rack = ease.inOutCubic(progress(t, tChg - 0.3, tChg + 0.5));
      cam.apply({ ...st, unit: u, focusP: 0.31 + rack * 0.57, blur: 6 });
      ships.forEach(sp => sp.g.setAttribute('transform', `translate(${(-sp.speed * t).toFixed(2)},0)`));
      // charges: the release point is the stern of ship 1 at release time, mapped into the charge layer
      const s1 = ships[0];
      charges.forEach((c, i) => {
        if (t < c.rel) { c.g.setAttribute('opacity', 0); c.thread.setAttribute('d', ''); c.burst.setAttribute('opacity', 0); return; }
        const stR = camAt(c.rel);
        const sx = s1.x + s1.len * (0.955 - i * 0.012) - s1.speed * c.rel;
        const [scX, scY] = toScreen(cam, SHIP_P, sx, sY - s1.len * 0.06, stR);
        const [x0, y0] = fromScreen(cam, CH_P, scX, scY, stR);
        const yEnd = H * L.pick({ landscape: 0.7, portrait: 0.55 }) + i * 18 * u;
        const k = (t - c.rel) / (c.hit - c.rel);
        const roll = ease.inOutCubic(clamp(k * 4)); // rolls off the rack, then sinks (slowing as it goes)
        const x = x0 + roll * 30 * u + ease.outQuad(clamp(k)) * (i - 1) * 110 * u + noise1(t * 1.3, i) * 6 * u;
        const y = y0 + roll * 24 * u + ease.outQuad(clamp(k)) * (yEnd - y0 - 24 * u);
        const alive = t < c.hit;
        c.g.setAttribute('opacity', alive ? 1 : 0);
        c.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(roll * 70 + k * 40 + i * 20).toFixed(1)})`);
        c.thread.setAttribute('d', alive ? `M${x.toFixed(1)},${(y - 12 * u).toFixed(1)} L${(x + 4 * u).toFixed(1)},${(-H).toFixed(0)}` : '');
        const b = t - c.hit;
        const bp = clamp(b / 0.18), fade = 1 - clamp((b - 1.1) / 0.9);
        c.burst.setAttribute('opacity', (b > 0 ? Math.min(1, bp * 2) * fade : 0).toFixed(3));
        c.burst.setAttribute('transform', `translate(${x.toFixed(1)},${(y - b * 14 * u).toFixed(1)}) scale(${(0.35 + 0.65 * ease.outCubic(bp) + b * 0.05).toFixed(3)}) rotate(${(i * 40 + b * 6).toFixed(1)})`);
      });
      sea.update(t);
      navy.update(t, wt(ctx, 'ships', 0, 1.42) - 0.1);
      moscow.update(t, tMos - 0.1);
      g.update(t + ctx.start);
    },
  };
}
