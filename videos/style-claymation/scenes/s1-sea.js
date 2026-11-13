// SET-UP 1 — ESTABLISH. The clay date drops onto the board, the grey clay sub creeps in under rolled-clay waves.
// intent: KNOW 27 Oct 1962, a Soviet sub hides near Cuba · FEEL curiosity · SEE a tiny grey sub deep under a sea of coils
// truth: RC/VO — a sculpted model, clearly a toy world; no faces; date = VO type in clay.
import { svg, rand } from '/onclack-styles/engine/lib/anim.js';
import { PAL, F, step, frameNo, wordT, replace, pose, makeSet, sea, crests, backdrop, submarine, clayText, tag, pressOn, coil, linePath, blobPath, ovalPath, thumb, shade, kelp } from '../shared/clay.js';

const DROP = [
  { sx: 0.82, sy: 1.3, o: 1 }, { sx: 1.25, sy: 0.72, o: 1 }, { sx: 0.92, sy: 1.1, o: 1 }, { sx: 1.04, sy: 0.97, o: 1 }, { sx: 1, sy: 1, o: 1 },
];

export default function (root, ctx) {
  const S = makeSet(root, ctx, 's1');
  const { L, W, H, u } = S;
  const P = L.portrait;

  const tOct = wordT(ctx, /^October/, 0, 0.58) - 2 * F;
  const t27 = wordT(ctx, /^twenty/, 0, 1.1) - 2 * F;
  const t62 = wordT(ctx, /^nineteen/, 0, 2.07) - 2 * F;
  const tSub = wordT(ctx, /^submarine/, 0, 4.3) - 2 * F;
  const tDeep = wordT(ctx, /^deep/, 0, 5.42) - 2 * F;
  const tCuba = wordT(ctx, /^Cuba/, 0, 6.52) - 2 * F;

  const surfY = H * (P ? 0.4 : 0.44);
  backdrop(S, S.cam, -40 * u, surfY + 40 * u, { seed: 4, clouds: P ? [[W * 0.3, surfY - 80 * u, 62 * u, 31], [W * 0.82, H * 0.13, 46 * u, 37]] : [[W * 0.7, H * 0.13, 58 * u, 31], [W * 0.9, H * 0.27, 44 * u, 37]] });

  // ---- Cuba: green clay lump on the horizon, two toothpick palms
  const cx = W * (P ? 0.72 : 0.83), iw = (P ? 190 : 230) * u, ih = (P ? 60 : 70) * u;
  const isl = S.group(S.cam, 'Cuba (clay island)');
  const islIn = svg('g', {}, isl);
  S.clay(islIn, 'c', 50);
  for (const [px, lean] of [[-0.25, -8], [0.18, 10]]) {
    const bx = cx + iw * px, by = surfY - ih * 0.75;
    svg('path', { d: `M${bx} ${by} q ${lean * u} ${-40 * u} ${lean * 2.2 * u} ${-78 * u}`, fill: 'none', stroke: PAL.wood, 'stroke-width': 5 * u, 'stroke-linecap': 'round', 'data-name': 'Toothpick palm' }, isl);
    const tx = bx + lean * 2.2 * u, ty = by - 78 * u;
    const leaves = svg('g', {}, isl);
    S.clay(leaves, 's', 51 + px);
    for (const a of [-160, -120, -60, -20]) {
      const r = a * Math.PI / 180;
      coil(leaves, `M${tx} ${ty} q ${Math.cos(r) * 20 * u} ${Math.sin(r) * 20 * u - 8 * u} ${Math.cos(r) * 40 * u} ${Math.sin(r) * 34 * u + 16 * u}`, PAL.islandLo, 11 * u);
    }
  }
  svg('path', { d: blobPath([[cx - iw * 0.62, surfY + 6 * u], [cx - iw * 0.4, surfY - ih * 0.7], [cx - iw * 0.05, surfY - ih], [cx + iw * 0.3, surfY - ih * 0.85], [cx + iw * 0.6, surfY + 6 * u]], 6 * u, 52), fill: PAL.island }, islIn);
  coil(islIn, `M${cx - iw * 0.58} ${surfY - 8 * u} Q ${cx} ${surfY - 20 * u} ${cx + iw * 0.56} ${surfY - 8 * u}`, PAL.sand, 14 * u);
  thumb(islIn, S, cx - iw * 0.08, surfY - ih * 0.55, ih * 0.38, 10, 53, PAL.island);

  // ---- sea of rolled clay (coils), crests on top
  const SEA = sea(S, S.cam, surfY, H + 60 * u, { seed: 1, n: P ? 13 : 10 });
  crests(S, S.cam, surfY + 4 * u, 2, P ? 190 : 260);

  // ---- the submarine
  const subLen = W * (P ? 0.6 : 0.33), subY0 = H * (P ? 0.6 : 0.71);
  const subX0 = -subLen * 0.75, subX1 = W * (P ? 0.47 : 0.42);
  const subG = S.group(S.cam, 'Submarine (moving)');
  const sub = submarine(S, subG, subLen, 9, 'Soviet sub B-59 (clay model)');
  // bubbles: small pale clay balls, a fixed set, each rising on its own clock
  const bub = [];
  const bubG = S.group(S.cam, 'Bubbles');
  for (let i = 0; i < 7; i++) {
    const b = svg('path', { d: ovalPath(0, 0, (5 + rand(i) * 6) * u, (5 + rand(i) * 6) * u, 1.2 * u, 60 + i, 8), fill: PAL.sea[0] }, bubG);
    S.clay(b, 's', 60 + i);
    bub.push({ b, ph: rand(i * 3.3) * 1.6, dx: (rand(i * 1.9) - 0.5) * 40 * u });
  }
  // front coil: passes in front of the sub's belly (depth: sub sits BETWEEN layers)
  const fTarget = subY0 + 34 * u + subLen * 0.085 + SEA.width * 0.38;
  const frontRow = SEA.rows.reduce((a, r) => (Math.abs(r.y - fTarget) < Math.abs(a.y - fTarget) ? r : a));
  const fy = fTarget;
  const fpts = [];
  for (let j = 0; j <= 9; j++) fpts.push([-120 * u + (W + 240 * u) * j / 9, fy + Math.sin(j * 1.3 + 0.7) * 7 * u]);
  const front = coil(S.group(S.cam, 'Front coil'), linePath(fpts), frontRow.col, SEA.width, 'Foreground sea coil');
  S.clay(front, 'k', 77);

  // ---- kelp in the foreground (depth cue; sways one notch per 12 fps frame)
  const kelps = (P ? [[W * 0.08, 520], [W * 0.86, 640], [W * 0.62, 380]] : [[W * 0.07, 330], [W * 0.66, 260], [W * 0.93, 380]])
    .map(([kx, kh], i) => kelp(S, S.cam, kx, H + 30 * u, kh * u, 80 + i * 5));

  // ---- the date in clay letters
  const dateG = S.group(S.cam, 'Date (clay letters)');
  const words = [];
  if (P) {
    const x = L.safe.x + 30 * u, s1 = 160 * u, s2 = 220 * u, y1 = L.safe.y + s1 * 1.05, y2 = y1 + s2 * 1.12;
    words.push({ str: '27', x, y: y1, size: s1, at: t27, col: '#2F4F8F' });
    words.push({ str: 'OCT', x: x + s1 * 1.5, y: y1, size: s1, at: tOct, col: '#2F4F8F' });
    words.push({ str: '1962', x, y: y2, size: s2, at: t62, col: '#F6E3C2' });
  } else {
    const x = L.safe.x + 40 * u, s = 150 * u, y = L.safe.y + s * 1.05;
    words.push({ str: '27', x, y, size: s, at: t27, col: '#2F4F8F' });
    words.push({ str: 'OCT', x: x + s * 1.45, y, size: s, at: tOct, col: '#2F4F8F' });
    words.push({ str: '1962', x: x + s * 1.45 + s * 2.6, y, size: s, at: t62, col: '#F6E3C2' });
  }
  for (const w of words) {
    w.g = svg('g', { 'data-name': `Date word ${w.str}` }, dateG);
    const inner = svg('g', {}, w.g);
    S.clay(inner, 'c', w.str.length * 5);
    w.t = clayText(inner, S, w.str, w.x, w.y, w.size, w.col);
    const bb = w.t.getBBox();
    w.bx = bb.x + bb.width / 2; w.by = bb.y + bb.height * 0.92;
    thumb(inner, S, bb.x + bb.width * 0.3, bb.y + bb.height * 0.55, w.size * 0.16, 25, w.str.length * 7, w.col);
  }

  // ---- tags
  const tagSize = 34 * u;
  const subTag = tag(S.cam, S, 'Soviet submarine B-59', P ? L.safe.x : W * 0.12, P ? subY0 - subLen * 0.36 : subY0 - subLen * 0.33, { size: tagSize, anchor: 'l', name: '1A Tag submarine', seed: 11 });
  const cubaTag = tag(S.cam, S, 'Cuba', cx - iw * (P ? 0.15 : 0.1), surfY - ih - (P ? 125 : 130) * u, { size: tagSize * 1.05, anchor: 'c', name: '1A Tag Cuba', seed: 13 });

  ctx.ambience('sea-wash-calm-01', { from: 0, to: ctx.duration, lu: -19, fade: 0.6 });
  ctx.ambience('sea-water-close-01', { from: tSub - 0.4, to: ctx.duration, lu: -27, fade: 0.8 });
  ctx.sfx('drawer-close-01', t62 + 2 * F + 1 / 12, { lu: -22, duration: 0.5, fadeOut: 0.15 }); // the 1962 lump lands on the board

  S.finish();
  return {
    update(t) {
      const q = step(t), f = frameNo(t);
      S.update(t);
      // stepped camera: a tiny push-in, one notch per 12 fps frame
      const z = 1 + 0.035 * Math.min(1, q / ctx.duration);
      S.cam.setAttribute('transform', `translate(${W / 2} ${H * 0.55}) scale(${z.toFixed(4)}) translate(${-W / 2} ${-H * 0.55})`);

      for (const w of words) {
        const p = replace(q, w.at, DROP, { sx: 1, sy: 1, o: 0 });
        const fall = q < w.at ? 0 : q < w.at + 1 / 12 ? -w.size * 0.45 : 0;
        pose(w.g, p, w.bx, w.by, 0, fall);
      }

      // sub: stepped creep L→R with placement jitter (an animator's hand, not a tween)
      const mv = Math.min(1, Math.max(0, (q - 0.9) / 4.9));
      const e = 1 - Math.pow(1 - mv, 2.2);
      const sink = q < tDeep ? 0 : Math.min(1, (q - tDeep) / 0.75) * 34 * u;
      const jx = (rand(f * 1.3 + 2) - 0.5) * 1.6 * u, jy = (rand(f * 2.1 + 5) - 0.5) * 1.6 * u;
      const sx = subX0 + (subX1 - subX0) * e + jx, sy = subY0 + sink + Math.sin(q * 1.6) * 4 * u + jy;
      sub.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
      for (const B of bub) {
        const age = ((q + B.ph) % 1.6) / 1.6;
        const by = sy - subLen * 0.2 - age * subLen * 0.5;
        B.b.setAttribute('transform', `translate(${(sx + subLen * 0.08 + B.dx + Math.sin(age * 6 + B.ph) * 6 * u).toFixed(1)} ${by.toFixed(1)})`);
        B.b.style.opacity = q > 1.2 && age < 0.9 && by > surfY + SEA.gap ? 1 : 0;
      }
      for (const k of kelps) k.update(q);
      pressOn(subTag, q, tSub);
      pressOn(cubaTag, q, tCuba);
    },
  };
}
