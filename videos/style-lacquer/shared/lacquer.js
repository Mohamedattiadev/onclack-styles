// THE LACQUER PANEL — one long black-lacquer board, four stations, read like a scroll (16:9: left → right; 9:16: top → down).
// Craft principle (learned, not copied): a design is first drawn in wet, red-brown lacquer; metal powder is sprinkled from a
// tube onto it and sticks only where it is wet; the loose grains are brushed away. Shell is cut into thin strips and inlaid.
// A design hidden under black layers is polished out with charcoal ("polished-out" reveal = the NO).
//
// BEAT TABLE (global seconds, words.json; visuals land 2 f before the word)
// 1 · MAP    0–7.0    KNOW 27 Oct 1962, Soviet sub near Cuba · FEEL quiet curiosity · SEE date + Cuba sprinkled in gold, shell sub set in
//                     truth: coasts EV-derived (Natural Earth); sub position RC "approx."
// 2 · ABOVE  7.0–13.4 KNOW US ships drop practice charges; Moscow silent · FEEL pressure · SEE silver ships, charges fall as grains,
//                     burst in rings round the shell sub; the gold line from Moscow is brushed off; real US Navy photo inlaid (EV)
// 3 · VOTE   13.4–19.9 KNOW 3 officers must agree; 2 say yes · FEEL dread · SEE two figures fill with gold, the third stays black
//                     truth: figures VO (no faces, no likeness); roles as told in later accounts
// 4 · NO     19.9–    KNOW Arkhipov said no; known 40 years later · FEEL relief · SEE charcoal polishes a vermilion NO out of the black
// Motif: the shell sub (S1, S2) → black figure (S3, S4). Metals: gold = the Soviet side and the story's words, silver = US Navy.
// The vermilion NO is the only red in the film. Light: one cool window reflected in the polish (never candle-warm).
import { svg, clamp, rand, progress, ease, lerp } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep, shake, spring, springs } from '/onclack-styles/engine/lib/spring.js';

const F = 1 / 30;
const FONT = { disp: "'Bricolage Grotesque', sans-serif", text: "'Schibsted Grotesk', sans-serif" };
const PAL = {
  lacquer: '#0c0d11', wet: '#2a110d', wetLine: '#6b2a1c', raised: '#17191e', raisedRim: '#4a515c',
  label: '#cfd3d8', labelDim: '#8c929a', shu: '#c4361f', shuDeep: '#8f2414',
};
const f1 = n => Math.round(n * 10) / 10;
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');

let cache = null; // the panel is built once and handed to whichever scene is on screen

export async function mountWorld(root, ctx) {
  if (!cache) cache = build(root, ctx);
  const Wd = await cache;
  return {
    update(t) {
      if (Wd.node.parentNode !== root) root.appendChild(Wd.node);
      Wd.update(ctx.start + t);
    },
  };
}

// ---------- materials ----------
function circ(x, y, r) { return `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0`; }
/** Metal-powder tile: seeded grains in a few tones (+ a few flat flakes), wrapped at the edges so the tile has no seams. */
function dustPattern(defs, id, { size, n, r: [r0, r1], cols, seed, base, flakes = 0, flakeS = 0 }) {
  const p = svg('pattern', { id, patternUnits: 'userSpaceOnUse', width: f1(size), height: f1(size) }, defs);
  if (base) svg('rect', { width: size, height: size, fill: base }, p);
  const d = cols.map(() => '');
  for (let i = 0; i < n; i++) {
    const x = rand(seed + i * 3.17) * size, y = rand(seed + i * 7.71) * size;
    const r = r0 + (r1 - r0) * rand(seed + i * 1.37) ** 2;
    const c = Math.min(cols.length - 1, Math.floor(rand(seed + i * 5.93) ** 1.4 * cols.length));
    for (const dx of [0, x < r ? size : x > size - r ? -size : 0]) for (const dy of [0, y < r ? size : y > size - r ? -size : 0]) {
      if ((dx || dy) && !(dx && x < r || dx && x > size - r || dy)) continue;
      d[c] += circ(x + dx, y + dy, r);
    }
  }
  // hirame-like flakes: small flat irregular quads that catch light differently from round powder
  let fd = '';
  for (let i = 0; i < flakes; i++) {
    const x = rand(seed + i * 9.1 + 400) * size, y = rand(seed + i * 4.3 + 400) * size, s = (flakeS || size * 0.035) * (0.6 + 0.8 * rand(seed + i * 2.2 + 400));
    const a = rand(seed + i * 6.6 + 400) * Math.PI;
    const pt = k => { const ang = a + k * Math.PI / 2 + (rand(seed + i * 11 + k) - 0.5) * 0.6; const rr = s * (0.6 + 0.5 * rand(seed + i * 13 + k)); return `${f1(x + Math.cos(ang) * rr)} ${f1(y + Math.sin(ang) * rr)}`; };
    fd += `M${pt(0)}L${pt(1)}L${pt(2)}L${pt(3)}Z`;
  }
  cols.forEach((c, k) => d[k] && svg('path', { d: d[k], fill: c }, p));
  if (fd) svg('path', { d: fd, fill: cols[0], opacity: 0.9 }, p);
  return `url(#${id})`;
}

function makeDefs(node, u) {
  const defs = svg('defs', {}, node);
  const gold = ['#c9a24c', '#e3c579', '#a77e34', '#7c5b24', '#f5e6b4'];
  const silver = ['#aab1b9', '#d6dadf', '#7f868f', '#5a6068', '#f1f3f5'];
  const M = {
    gold: dustPattern(defs, 'lq-gold', { size: u(110), n: 2300, r: [u(0.6), u(1.9)], cols: gold, seed: 11, base: '#3a2b12', flakes: 30 }),
    goldSparse: dustPattern(defs, 'lq-gold-sp', { size: u(64), n: 120, r: [u(0.6), u(1.6)], cols: gold, seed: 23 }),
    silver: dustPattern(defs, 'lq-silver', { size: u(110), n: 2100, r: [u(0.6), u(1.8)], cols: silver, seed: 37, base: '#26292e', flakes: 26 }),
    silverSparse: dustPattern(defs, 'lq-silver-sp', { size: u(64), n: 90, r: [u(0.6), u(1.5)], cols: silver, seed: 41 }),
    loose: dustPattern(defs, 'lq-loose', { size: u(70), n: 26, r: [u(0.6), u(1.5)], cols: gold, seed: 53 }),
    looseSilver: dustPattern(defs, 'lq-loose-s', { size: u(70), n: 22, r: [u(0.6), u(1.4)], cols: silver, seed: 59 }),
    // flakes suspended UNDER the clear top coats (dim, sparse): gives the black its depth
    deep: dustPattern(defs, 'lq-deep', { size: u(520), n: 90, r: [u(0.4), u(1.0)], cols: ['#5e4e2e', '#3f3a2c', '#343b46'], seed: 71, flakes: 34, flakeS: u(3.2) }),
    shu: dustPattern(defs, 'lq-shu', { size: u(90), n: 500, r: [u(0.8), u(2.4)], cols: ['#bd3820', '#ca4127', '#b3321b'], seed: 83, base: PAL.shu }),
  };
  // sweep gradients for masks (white = laid down, transparent = not yet)
  const gx = svg('linearGradient', { id: 'lq-sx', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  svg('stop', { offset: 0, 'stop-color': '#fff' }, gx); svg('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, gx);
  const gy = svg('linearGradient', { id: 'lq-sy', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  svg('stop', { offset: 0, 'stop-color': '#fff' }, gy); svg('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, gy);
  // abalone: four iridescent gradients, rotated a little with the camera so the shell "turns" in the light
  const shellStops = [
    [['#16303a', 0], ['#2e6870', 0.3], ['#a9d4cf', 0.5], ['#3f5f86', 0.7], ['#152a36', 1]],
    [['#1d3a3a', 0], ['#4d8f86', 0.35], ['#d9e9e2', 0.52], ['#7b6aa0', 0.68], ['#1a2e3c', 1]],
    [['#1b2c44', 0], ['#3b5f9a', 0.3], ['#86b9b6', 0.55], ['#c7b3d6', 0.62], ['#1f3a44', 1]],
    [['#22383c', 0], ['#93c2b4', 0.25], ['#4c7da6', 0.5], ['#8d6f9e', 0.72], ['#182a33', 1]],
  ];

  const shells = shellStops.map((st, i) => {
    const g = svg('linearGradient', { id: `lq-shell${i}`, x1: 0, y1: 0, x2: 1, y2: 0.35, gradientUnits: 'objectBoundingBox' }, defs);
    for (const [c, o] of st) svg('stop', { offset: o, 'stop-color': c }, g);
    return g;
  });
  // the window reflected in the polish: cool, soft-edged, two panes and a bar
  const rg = svg('linearGradient', { id: 'lq-refl', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  [[0, 0], [0.18, 1], [0.42, 0.85], [0.47, 0.15], [0.53, 0.15], [0.58, 0.8], [0.84, 1], [1, 0]].forEach(([o, a]) =>
    svg('stop', { offset: o, 'stop-color': '#c9d6e6', 'stop-opacity': a }, rg));
  const hg = svg('linearGradient', { id: 'lq-hl', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  [[0, 0], [0.5, 1], [1, 0]].forEach(([o, a]) => svg('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, hg));
  return { defs, M, shells };
}

// ---------- the "lay down" mechanic: wet line → sprinkle → brush off ----------
let uid = 0;
function sweepMask(defs, dir) {
  const id = `lq-m${uid++}`;
  const m = svg('mask', { id, maskUnits: 'userSpaceOnUse', x: -1e5, y: -1e5, width: 2e5, height: 2e5 }, defs);
  const solid = svg('rect', { fill: '#fff', x: 0, y: 0, width: 0, height: 0 }, m);
  const soft = svg('rect', { fill: `url(#lq-s${dir})`, x: 0, y: 0, width: 0, height: 0 }, m);
  return { id, solid, soft };
}
function setSweep(mk, b, p, dir, softPx) {
  const pad = softPx;
  if (dir === 'x') {
    const front = b.x - pad + p * (b.width + 2 * pad);
    mk.solid.setAttribute('x', f1(b.x - pad)); mk.solid.setAttribute('y', f1(b.y - pad));
    mk.solid.setAttribute('width', f1(Math.max(0, front - (b.x - pad)))); mk.solid.setAttribute('height', f1(b.height + 2 * pad));
    mk.soft.setAttribute('x', f1(front)); mk.soft.setAttribute('y', f1(b.y - pad));
    mk.soft.setAttribute('width', f1(p > 0 && p < 1 ? softPx : 0)); mk.soft.setAttribute('height', f1(b.height + 2 * pad));
    return front;
  }
  const front = b.y - pad + p * (b.height + 2 * pad);
  mk.solid.setAttribute('x', f1(b.x - pad)); mk.solid.setAttribute('y', f1(b.y - pad));
  mk.solid.setAttribute('width', f1(b.width + 2 * pad)); mk.solid.setAttribute('height', f1(Math.max(0, front - (b.y - pad))));
  mk.soft.setAttribute('x', f1(b.x - pad)); mk.soft.setAttribute('y', f1(front));
  mk.soft.setAttribute('width', f1(b.width + 2 * pad)); mk.soft.setAttribute('height', f1(p > 0 && p < 1 ? softPx : 0));
  return front;
}

/**
 * A design laid in lacquer. draw(g, paint) adds the shapes with paint = { fill, stroke, sw }.
 * wet: [t0, t1] the red-brown wet layer is drawn · dust: [t0, t1] powder falls from the tube (stream) and sticks ·
 * brush: time the loose grains are swept off. fill = the powder (or a solid for raised black lacquer).
 */
function laid(parent, D, u, o) {
  const g = svg('g', { 'data-name': o.name }, parent);
  const dir = o.dir ?? 'x';
  const wetG = svg('g', {}, g);
  if (o.noWet) wetG.style.visibility = 'hidden';
  o.draw(wetG, { fill: PAL.wet, stroke: PAL.wetLine, sw: u(1.4) });
  const dustG = svg('g', {}, g);
  o.draw(dustG, { fill: o.fill, stroke: o.stroke ?? 'none', sw: o.sw ?? 0 });
  let b = wetG.getBBox();
  if (!b.width) b = dustG.getBBox();
  const looseM = o.loose === false ? null : (o.looseFill ?? D.M.loose);
  const looseR = looseM ? svg('rect', { x: f1(b.x - u(26)), y: f1(b.y - u(26)), width: f1(b.width + u(52)), height: f1(b.height + u(52)), fill: looseM }, g) : null;
  const soft = u(o.soft ?? 46);
  const wm = sweepMask(D.defs, dir), dm = sweepMask(D.defs, dir);
  wetG.setAttribute('mask', `url(#${wm.id})`); dustG.setAttribute('mask', `url(#${dm.id})`);
  if (looseR) looseR.setAttribute('mask', `url(#${dm.id})`);
  // the sprinkling tube and its falling stream
  const stream = o.stream === false ? null : svg('g', { 'data-name': `${o.name} · falling powder` }, parent);
  const grains = [];
  const tube = stream ? svg('g', { 'data-name': 'Sprinkling tube' }, stream) : null;
  if (tube) {
    svg('rect', { x: -u(7), y: -u(130), width: u(14), height: u(130), rx: u(3), fill: '#3a2a1b' }, tube);
    svg('rect', { x: -u(7), y: -u(130), width: u(3.5), height: u(130), fill: '#6b5236' }, tube);
    svg('rect', { x: -u(8), y: -u(8), width: u(16), height: u(8), fill: '#1b140d' }, tube); // gauze end
    const cols = o.grainCols ?? ['#e3c579', '#c9a24c', '#f5e6b4', '#a77e34'];
    for (let i = 0; i < 34; i++) { const n = svg('circle', { r: f1(u(0.8 + 1.3 * rand(i * 4.1 + 7))), fill: cols[i % cols.length] }, stream); grains.push(n); }
  }
  const t = o.times;
  const ph = i => rand(i * 2.71 + 3), sp = i => (rand(i * 5.3 + 1) - 0.5);
  const sweepEase = p => ease.inOutSine(p);
  return {
    g, b,
    update(T) {
      const pw = sweepEase(progress(T, t.wet[0], t.wet[1]));
      setSweep(wm, b, pw, dir, soft);
      const pd = sweepEase(progress(T, t.dust[0], t.dust[1]));
      setSweep(dm, b, pd, dir, soft);
      // the wet layer is fully hidden under the powder once it is laid
      wetG.style.opacity = pd >= 1 ? 0 : 1;
      if (looseR) {
        const bp = smootherstep(progress(T, t.brush ?? t.dust[1] + 0.25, (t.brush ?? t.dust[1] + 0.25) + 0.45));
        looseR.setAttribute('transform', `translate(${f1(bp * u(60))} ${f1(bp * u(10))})`);
        looseR.style.opacity = (1 - bp) * 0.9;
      }
      if (stream) {
        const on = T > t.dust[0] - 0.25 && T < t.dust[1] + 0.2;
        stream.style.display = on ? '' : 'none';
        if (!on) return;
        const span = t.dust[1] - t.dust[0];
        const frontAt = te => {
          const p = sweepEase(progress(te, t.dust[0], t.dust[1]));
          if (dir === 'x') return [b.x + p * b.width, b.y + b.height * 0.5];
          // dir y: the tube zig-zags across while the front descends
          const zig = 0.5 + 0.45 * Math.sin((te - t.dust[0]) / Math.max(0.3, span) * Math.PI * 5);
          return [b.x + zig * b.width, b.y + p * b.height];
        };
        const top = b.y - u(150);
        const fall = 0.42;
        grains.forEach((n, i) => {
          const age = ((T - t.dust[0]) / fall + ph(i)) % 1;
          const te = T - age * fall;
          if (te < t.dust[0] || te > t.dust[1] || age < 0) { n.setAttribute('cx', -1e4); return; }
          const [fx, fy] = frontAt(te);
          const land = dir === 'x' ? b.y + b.height * (0.15 + 0.85 * rand(i * 9.7)) : fy;
          n.setAttribute('cx', f1(fx + sp(i) * u(22) + age * sp(i * 3) * u(14)));
          n.setAttribute('cy', f1(top + age * age * (land - top)));
        });
        const [tx] = frontAt(clamp(T, t.dust[0], t.dust[1]));
        const vis = Math.min(progress(T, t.dust[0] - 0.25, t.dust[0]), 1 - progress(T, t.dust[1], t.dust[1] + 0.18));
        tube.setAttribute('transform', `translate(${f1(tx + u(4))} ${f1(top - u(6) - (1 - vis) * u(60))}) rotate(14)`);
        tube.style.opacity = vis;
      }
    },
  };
}

/** Shell inlay: shape cut from strips of abalone (thin hairline gaps between pieces), set into the lacquer. */
function inlay(parent, D, u, { name, d, box, strips = 9, seed = 1, angle = -18 }) {
  const g = svg('g', { 'data-name': name }, parent);
  const cid = `lq-c${uid++}`;
  const cp = svg('clipPath', { id: cid }, D.defs);
  svg('path', { d }, cp);
  const shadow = svg('path', { d, fill: '#000', opacity: 0.55, transform: `translate(${u(3)} ${u(4)})` }, g);
  const body = svg('g', { 'clip-path': `url(#${cid})` }, g);
  const [x0, y0, w, h] = box;
  // irregular mosaic: slanted column cuts of uneven width, most columns broken once more across (shell cracks when bent)
  const xs = [x0 - 20];
  while (xs[xs.length - 1] < x0 + w + 20) xs.push(xs[xs.length - 1] + (w / strips) * (0.55 + 0.9 * rand(seed + xs.length * 3.3)));
  const sk = xs.map((_, k) => (rand(seed + k * 5.1) - 0.5) * h * 0.9);
  const Bx = (k, y) => xs[k] + sk[k] * ((y - y0) / h - 0.5);
  let cuts = '', gi = seed;
  const poly = pts => 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
  for (let k = 0; k < xs.length - 1; k++) {
    const ya = y0 - 4, yb = y0 + h + 4;
    const cut = rand(seed + k * 7.7) > 0.35;
    const yc = y0 + h * (0.3 + 0.4 * rand(seed + k * 2.9)), sl = (rand(seed + k * 4.4) - 0.5) * h * 0.5;
    const cells = cut
      ? [[[Bx(k, ya), ya], [Bx(k + 1, ya), ya], [Bx(k + 1, yc + sl / 2), yc + sl / 2], [Bx(k, yc - sl / 2), yc - sl / 2]],
         [[Bx(k, yc - sl / 2), yc - sl / 2], [Bx(k + 1, yc + sl / 2), yc + sl / 2], [Bx(k + 1, yb), yb], [Bx(k, yb), yb]]]
      : [[[Bx(k, ya), ya], [Bx(k + 1, ya), ya], [Bx(k + 1, yb), yb], [Bx(k, yb), yb]]];
    for (const c of cells) {
      const gidx = Math.floor(rand(gi++ * 1.7) * 4);
      svg('path', { d: poly(c), fill: `url(#lq-shell${gidx})` }, body);
      cuts += poly(c);
    }
  }
  // growth lines in the shell (fine pale waves along the piece)
  let gl = '';
  for (let i = 0; i < 9; i++) {
    const yy = y0 + h * (0.1 + 0.8 * i / 8);
    gl += `M${f1(x0)} ${f1(yy)}`;
    for (let x = x0; x <= x0 + w; x += w / 24) gl += `L${f1(x)} ${f1(yy + Math.sin(x / (w / 9) + i * 1.7 + seed) * h * 0.05)}`;
  }
  svg('path', { d: gl, stroke: '#e6f1ee', 'stroke-width': u(0.7), fill: 'none', opacity: 0.22 }, body);
  svg('path', { d: cuts, stroke: '#0c0d11', 'stroke-width': u(1.4), fill: 'none', opacity: 0.9 }, body);
  // the clear coat over the shell: edges sink into the black, so the piece reads as set IN, not stuck ON
  svg('path', { d, fill: 'none', stroke: '#0c0d11', 'stroke-width': u(9), opacity: 0.55 }, body);
  svg('path', { d, fill: '#0c0d11', opacity: 0.18 }, body);
  // thin gold keyline round the inlay, like the rim left when the lacquer is polished back to the shell
  svg('path', { d, fill: 'none', stroke: '#b38c42', 'stroke-width': u(1.6), opacity: 0.85 }, g);
  return { g, shadow };
}

// ---------- drawings ----------
const FIG = {
  A: [ // the captain: weight forward, one fist down on the chart
    ['c', 118, 66, 23], ['p', 'M90 54Q96 34 120 33Q146 34 150 50L152 57L88 59Z'], ['p', 'M126 56L160 60L157 66L124 63Z'],
    ['p', 'M108 84L126 84L128 100L106 100Z'], ['p', 'M92 98Q120 88 154 104L148 214L138 318L78 322L80 214Z'],
    ['l', 'M148 112L178 196L192 262', 24], ['c', 193, 268, 14], ['l', 'M96 112L80 198L94 262', 24],
    ['p', 'M80 316L108 316L90 508L62 508Z'], ['p', 'M110 316L140 314L156 508L128 508Z'],
    ['p', 'M56 504L92 504L94 514L52 514Z'], ['p', 'M124 504L164 504L166 514L124 514Z'],
  ],
  B: [ // the political officer: upright, arms crossed, head turned away
    ['c', 96, 62, 23], ['p', 'M70 50Q76 30 98 29Q122 30 126 46L128 53L66 55Z'], ['p', 'M60 52L90 52L88 58L58 58Z'],
    ['p', 'M86 80L106 80L106 98L86 98Z'], ['p', 'M64 98Q96 88 128 98L136 214L132 322L64 322L60 214Z'],
    ['l', 'M70 110L64 176L124 178', 24], ['l', 'M126 110L134 168L74 186', 24],
    ['p', 'M68 318L98 318L94 508L70 508Z'], ['p', 'M100 318L130 318L128 508L104 508Z'],
    ['p', 'M64 504L98 504L98 514L60 514Z'], ['p', 'M100 504L134 504L136 514L100 514Z'],
  ],
  C: [ // the third officer: upright, hands behind his back, weight on one leg, chin up
    ['c', 100, 60, 22], ['p', 'M76 48Q82 28 102 27Q124 28 128 44L130 51L72 53Z'], ['p', 'M106 50L136 48L136 54L106 56Z'],
    ['p', 'M90 78L110 78L110 96L90 96Z'], ['p', 'M70 96Q100 86 130 96L134 210L130 322L70 322L66 210Z'],
    ['l', 'M74 106L62 196L84 248', 22], ['l', 'M126 106L138 196L114 248', 22],
    ['p', 'M72 318L100 318L92 508L66 508Z'], ['p', 'M102 318L130 318L144 508L118 508Z'],
    ['p', 'M60 504L96 504L96 514L58 514Z'], ['p', 'M116 504L152 504L154 514L116 514Z'],
  ],
};
/** Scale + move absolute path data (M/L/Q/Z only) so powder patterns are never scaled with the drawing. */
function tp(d, s, tx, ty) { let i = 0; return d.replace(/-?\d*\.?\d+/g, m => f1(i++ % 2 === 0 ? +m * s + tx : +m * s + ty)); }
function drawFigure(g, parts, paint, extra = 0, X = [1, 0, 0]) {
  const [s, tx, ty] = X;
  for (const pt of parts) {
    if (pt[0] === 'c') svg('circle', { cx: f1(pt[1] * s + tx), cy: f1(pt[2] * s + ty), r: f1(pt[3] * s + extra / 2), fill: paint.fill }, g);
    else if (pt[0] === 'p') svg('path', { d: tp(pt[1], s, tx, ty), fill: paint.fill, stroke: extra ? paint.fill : 'none', 'stroke-width': extra, 'stroke-linejoin': 'round' }, g);
    else svg('path', { d: tp(pt[1], s, tx, ty), fill: 'none', stroke: paint.fill, 'stroke-width': f1(pt[2] * s + extra), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  }
}
/** Built-up (raised) black lacquer: a soft cast shadow down-right, a lit edge up-left (key light upper left), the body. */
function raisedFig(g, parts, X) {
  const [s, tx, ty] = X, k = s * 3.2;
  drawFigure(svg('g', { opacity: 0.55 }, g), parts, { fill: '#000' }, 2 * k, [s, tx + 2 * k, ty + 3 * k]);
  drawFigure(svg('g', {}, g), parts, { fill: '#4b525d' }, 0.9 * k, [s, tx - 0.8 * k, ty - 0.8 * k]);
  drawFigure(svg('g', {}, g), parts, { fill: '#1b1d23' }, 0, X);
}
const SUB_D = 'M8 46Q14 30 70 28L320 28Q392 30 400 44Q392 58 320 62L70 64Q14 62 8 46Z M170 30L180 6L246 6L262 30Z M10 46L0 28L18 36Z M10 46L0 64L18 56Z';
const TORP = { body: 'M40 14L520 14Q596 16 600 30Q596 44 520 46L40 46Z', tail: 'M44 14L4 0L14 30L4 60L44 46Z' };
function shipD(L, h, flip) {
  const X = x => (flip ? L - x : x);
  const poly = pts => 'M' + pts.map(([x, y]) => `${f1(X(x))} ${f1(y)}`).join('L') + 'Z';
  return [
    poly([[0, -h * 0.4], [L * 0.97, -h * 0.52], [L * 0.92, 0], [L * 0.05, 0]]),
    poly([[L * 0.33, -h * 0.42], [L * 0.62, -h * 0.44], [L * 0.62, -h * 0.82], [L * 0.33, -h * 0.8]]),
    poly([[L * 0.54, -h * 0.8], [L * 0.66, -h * 0.82], [L * 0.65, -h * 1.08], [L * 0.55, -h * 1.06]]),
    poly([[L * 0.41, -h * 0.8], [L * 0.49, -h * 0.8], [L * 0.48, -h * 1.2], [L * 0.42, -h * 1.18]]),
    poly([[L * 0.595, -h * 1.06], [L * 0.61, -h * 1.06], [L * 0.605, -h * 1.75], [L * 0.6, -h * 1.75]]),
    poly([[L * 0.1, -h * 0.42], [L * 0.2, -h * 0.43], [L * 0.2, -h * 0.6], [L * 0.1, -h * 0.58]]),
    poly([[L * 0.74, -h * 0.47], [L * 0.84, -h * 0.48], [L * 0.84, -h * 0.66], [L * 0.74, -h * 0.64]]),
  ].join(' ');
}

function textEl(g, { x, y, size, family, weight = 800, anchor = 'start', ls = 0, txt, paint, name }) {
  const a = { x: f1(x), y: f1(y), 'font-family': family, 'font-weight': weight, 'font-size': f1(size), 'text-anchor': anchor, 'letter-spacing': ls ? `${ls}em` : null, fill: paint.fill, stroke: paint.stroke && paint.stroke !== 'none' ? paint.stroke : null, 'stroke-width': paint.sw || null, 'data-name': name ?? null };
  for (const k of Object.keys(a)) if (a[k] == null) delete a[k];
  const n = svg('text', a, g);
  n.textContent = txt;
  return n;
}
/** Font size so a line fits maxW (measured once at build, deterministic). */
function fitSize(probeParent, txt, family, weight, size, maxW, ls = 0) {
  const t = svg('text', { 'font-family': family, 'font-weight': weight, 'font-size': size, 'letter-spacing': `${ls}em` }, probeParent);
  t.textContent = txt;
  const w = t.getComputedTextLength();
  t.remove();
  return w > maxW ? size * maxW / w : size;
}

// ---------- build ----------
async function build(root, ctx) {
  await Promise.all(['800 100px "Bricolage Grotesque"', '500 100px "Bricolage Grotesque"', '600 40px "Schibsted Grotesk"', '400 40px "Schibsted Grotesk"'].map(f => document.fonts.load(f)));
  const L = ctx.layout, W = L.width, H = L.height, P = L.portrait, u = L.px, S = L.safe;
  const words = ctx.words || [];
  const wt = (w, n = 0, fb = 0) => { const h = words.filter(x => norm(x.word) === norm(w)); return (h[n] ? h[n].start : fb) - 2 * F; };
  const T = {
    oct: wt('October', 0, 0.58), d27: wt('twenty-seventh', 0, 1.1), y62: wt('nineteen', 0, 2.07), sov: wt('Soviet', 0, 3.79),
    sub: wt('submarine', 0, 4.3), deep: wt('deep', 0, 5.42), sea: wt('sea', 0, 5.98), cuba: wt('Cuba', 0, 6.52),
    above: wt('Above', 0, 7.56), amer: wt('American', 0, 8.07), ships: wt('ships', 0, 8.63), drop: wt('drop', 0, 8.95), prac: wt('practice', 0, 9.28),
    charges: wt('charges', 0, 10.05), moscow: wt('Moscow', 0, 10.95), silent: wt('silent', 0, 11.93), days: wt('days', 0, 12.49),
    board: wt('board', 0, 13.83), nuclear: wt('nuclear', 0, 14.48), torpedo: wt('torpedo', 0, 14.88), three: wt('three', 0, 16.51),
    officers: wt('officers', 0, 16.86), agree: wt('agree', 0, 17.61), two: wt('Two', 0, 18.29), yes: wt('yes', 0, 18.8),
    third: wt('third', 0, 20.25), vasili: wt('Vasili', 0, 20.61), arkh: wt('Arkhipov', 0, 21.12), no: wt('no', 0, 22.03),
    world: wt('world', 0, 23.07), name: wt('name', 0, 23.73), forty: wt('forty', 0, 24.13), later: wt('later', 0, 24.73),
  };
  const tTo = wt('To', 0, 15.73);
  T.bursts = [T.charges + 0.12, T.charges + 0.5, T.charges + 0.9];
  // camera: station i is framed in [arrive, leave]; glides happen in the voice pauses
  const CAM = [{ arrive: 0, leave: 6.88 }, { arrive: 7.5, leave: 12.95 }, { arrive: 13.6, leave: 19.2 }, { arrive: 19.98, leave: 99 }];
  const O = i => (P ? [0, i * H] : [i * W, 0]);

  // ---------- stage ----------
  const node = svg('svg', { 'data-name': 'Lacquer panel', width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;left:0;top:0;display:block' }, root);
  const D = makeDefs(node, u);
  svg('rect', { 'data-name': 'Black lacquer', width: W, height: H, fill: PAL.lacquer }, node);
  const deepCam = svg('g', { 'data-name': 'Flakes under the clear coat' }, node);
  const span = P ? [W, 4 * H] : [4 * W, H];
  svg('rect', { x: -W, y: -H, width: span[0] + 2 * W, height: span[1] + 2 * H, fill: D.M.deep, opacity: 0.32 }, deepCam);
  const cam = svg('g', { 'data-name': 'Camera' }, node);
  const st = [0, 1, 2, 3].map(i => svg('g', { 'data-name': `Station ${i + 1}`, transform: `translate(${O(i)[0]} ${O(i)[1]})` }, cam));
  const ups = [];
  const add = x => (ups.push(x), x);
  const lab = (g, o) => { // quiet information text: laid down with the same sweep, no powder, cool silver-white
    const it = laid(g, D, u, {
      name: o.name, stream: false, loose: false, soft: 30, noWet: true, fill: o.color ?? PAL.label,
      draw: (gg, paint) => textEl(gg, { ...o, family: FONT.text, weight: o.weight ?? 600, paint: { fill: paint.fill === PAL.wet ? PAL.wet : (o.color ?? PAL.label) } }),
      times: { wet: [o.t - 0.12, o.t + 0.2], dust: [o.t, o.t + (o.dur ?? 0.35)] },
    });
    return add(it);
  };

  // ======================= STATION 1 · MAP =======================
  const s1 = st[0];
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const MP = P ? { lon: -77.0, lat: 23.4, k: u(70), cy: H * 0.56 } : { lon: -78.2, lat: 22.7, k: u(98), cy: H * 0.5 };
  const kx = MP.k * Math.cos(23.5 * Math.PI / 180);
  const proj = (lon, lat) => [W / 2 + (lon - MP.lon) * kx, MP.cy - (lat - MP.lat) * MP.k];
  const ringD = ring => { const pts = ring.map(([lo, la]) => proj(lo, la)); let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a / 2) < u(18) ? '' : 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z'; };
  const featD = names => geo.features.filter(f => names.includes(f.name)).map(f => f.rings.map(ringD).join('')).join('');
  const others = ['United States of America', 'Bahamas', 'Haiti', 'Dominican Rep.', 'Jamaica', 'Turks and Caicos Is.', 'Cayman Is.', 'Mexico', 'Puerto Rico', 'Belize', 'Honduras', 'Guatemala'];
  const mapClip = `lq-c${uid++}`;
  const mc = svg('clipPath', { id: mapClip }, D.defs);
  // the land fades out to the north (no hard data edge at lat 34)
  const fg = svg('linearGradient', { id: `${mapClip}g`, gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0, y1: f1(proj(0, 31.2)[1]), y2: f1(proj(0, 29.6)[1]) }, D.defs);
  svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, fg); svg('stop', { offset: 1, 'stop-color': '#fff' }, fg);
  const mm = svg('mask', { id: `${mapClip}m`, maskUnits: 'userSpaceOnUse', x: -W, y: -H, width: 3 * W, height: 3 * H }, D.defs);
  svg('rect', { x: -W, y: -H, width: 3 * W, height: 3 * H, fill: `url(#${mapClip}g)` }, mm);
  svg('rect', { x: 0, y: 0, width: W, height: H }, mc);
  const mapG = svg('g', { 'data-name': '1A · Map', 'clip-path': `url(#${mapClip})`, mask: `url(#${mapClip}m)` }, s1);
  const othersD = featD(others);
  add(laid(mapG, D, u, {
    name: '1A · Coasts (US, Bahamas, Hispaniola…)', fill: D.M.goldSparse, stroke: D.M.gold, sw: u(3), loose: false, soft: 220,
    draw: (g, p) => svg('path', { d: othersD, fill: p.fill, stroke: p.stroke, 'stroke-width': p.sw || u(3), 'stroke-linejoin': 'round', 'fill-rule': 'nonzero' }, g),
    times: { wet: [T.oct + 0.1, T.y62 + 0.4], dust: [T.d27 + 0.5, T.cuba - 0.1] },
  }));
  const cubaD = featD(['Cuba']);
  add(laid(mapG, D, u, {
    name: '1A · Cuba', fill: D.M.gold, stroke: D.M.gold, sw: u(2), soft: 120,
    draw: (g, p) => svg('path', { d: cubaD, fill: p.fill, stroke: p.stroke, 'stroke-width': p.sw }, g),
    times: { wet: [T.sub, T.sea], dust: [T.deep - 0.1, T.cuba + 0.15], brush: T.cuba + 0.4 },
  }));
  // the submarine: a strip of shell set into the sea, approx. position
  const [sx, sy] = P ? proj(-72.4, 24.4) : proj(-71.6, 24.6);
  const subW = u(P ? 180 : 190), subS = subW / 400;
  const sub1 = svg('g', { 'data-name': '1B · B-59 (shell inlay)' }, s1);
  const sub1In = svg('g', { transform: `translate(${f1(sx - subW / 2)} ${f1(sy - 40 * subS)}) scale(${subS})` }, sub1);
  const subA = inlay(sub1In, D, u, { name: 'Sub inlay', d: SUB_D, box: [0, 0, 400, 66], strips: 8, seed: 3 });
  const cubaLab = lab(s1, { name: '1C · Label CUBA', x: proj(-79.6, 21.0)[0], y: proj(-79.6, 21.0)[1] + u(P ? 70 : 92), size: u(P ? 36 : 40), ls: 0.14, txt: 'CUBA', t: T.cuba + 0.05 });
  const subLab = lab(s1, { name: '1C · Label B-59', x: P ? sx + subW / 2 : sx - subW / 2, anchor: P ? 'end' : 'start', y: sy + u(P ? 54 : 62), size: u(P ? 30 : 34), ls: 0.06, txt: 'B-59 · position approx.', t: T.sub + 0.25, color: PAL.labelDim, weight: 400 });
  // the date: OCTOBER / 27 / 1962, laid on its words
  const dx0 = P ? S.x + S.w - u(4) : S.x + u(10), dy0 = P ? S.y + u(70) : S.y + u(110);
  const dA = P ? 'end' : 'start', dI = P ? -u(8) : u(8);
  const bigSize = u(P ? 250 : 260);
  add(laid(s1, D, u, { name: '1D · Date OCTOBER', fill: D.M.gold, soft: 60, draw: (g, p) => textEl(g, { x: dx0 + dI, anchor: dA, y: dy0, size: u(P ? 66 : 70), family: FONT.disp, weight: 800, ls: 0.09, txt: 'OCTOBER', paint: p }), times: { wet: [T.oct - 0.25, T.oct + 0.3], dust: [T.oct - 0.05, T.oct + 0.55] } }));
  add(laid(s1, D, u, { name: '1D · Date 27', fill: D.M.gold, soft: 90, draw: (g, p) => textEl(g, { x: dx0, anchor: dA, y: dy0 + bigSize * 0.86, size: bigSize, family: FONT.disp, weight: 800, ls: -0.03, txt: '27', paint: p }), times: { wet: [T.d27 - 0.25, T.d27 + 0.3], dust: [T.d27 - 0.05, T.d27 + 0.75] } }));
  add(laid(s1, D, u, { name: '1D · Date 1962', fill: D.M.gold, soft: 60, draw: (g, p) => textEl(g, { x: dx0 + dI, anchor: dA, y: dy0 + bigSize * 0.86 + u(P ? 80 : 86), size: u(P ? 66 : 70), family: FONT.disp, weight: 800, ls: 0.09, txt: '1962', paint: p }), times: { wet: [T.y62 - 0.25, T.y62 + 0.3], dust: [T.y62 - 0.05, T.y62 + 0.8] } }));

  // ======================= STATION 2 · ABOVE =======================
  const s2 = st[1];
  const surfY = P ? H * 0.25 : H * 0.33;
  const surfD = (() => { let d = `M${f1(u(0))} ${f1(surfY)}`; for (let x = u(0); x <= W; x += u(24)) d += `L${f1(x)} ${f1(surfY + Math.sin(x / u(90)) * u(2.5) + Math.sin(x / u(37)) * u(1.2))}`; return d; })();
  add(laid(s2, D, u, { name: '2A · Sea surface', fill: 'none', stroke: D.M.silver, sw: u(4), loose: false, soft: 200, grainCols: ['#d6dadf', '#aab1b9', '#f1f3f5'],
    draw: (g, p) => svg('path', { d: surfD, fill: 'none', stroke: p.stroke, 'stroke-width': p.fill === PAL.wet ? u(4) : p.sw }, g),
    times: { wet: [T.above - 0.4, T.above + 0.3], dust: [T.above - 0.2, T.amer] } }));
  // depth: broken water lines, each fainter the deeper it lies (laid just after the surface)
  const deepest = P ? H * 0.5 : H * 0.92;
  [0, 1, 2, 3].forEach(k => {
    const y = surfY + (deepest - surfY) * (k + 1) / 4.6;
    let d = ''; let x = u(20) + rand(k * 3) * u(80);
    while (x < W - u(60)) { const len = u(60 + 140 * rand(x + k)); d += `M${f1(x)} ${f1(y + Math.sin(x / u(70) + k) * u(3))}`; for (let xx = x; xx <= x + len; xx += u(20)) d += `L${f1(Math.min(xx, W))} ${f1(y + Math.sin(xx / u(70) + k) * u(3))}`; x += len + u(30 + 120 * rand(x * 1.3 + k)); }
    const it = laid(s2, D, u, { name: `2A · Water line ${k + 1}`, fill: 'none', stroke: D.M.silver, sw: u(2.2), loose: false, stream: false, soft: 300,
      draw: (g, p) => svg('path', { d, fill: 'none', stroke: p.fill === PAL.wet ? PAL.wetLine : p.stroke, 'stroke-width': u(2.2), 'stroke-linecap': 'round' }, g),
      times: { wet: [T.above + 0.1 + k * 0.12, T.above + 0.6 + k * 0.12], dust: [T.above + 0.2 + k * 0.12, T.amer + 0.3 + k * 0.12] } });
    it.g.setAttribute('opacity', f1((0.5 - k * 0.1) * 100) / 100);
    add(it);
  });
  const ships = P
    ? [[W * 0.08, u(230), u(64), false], [W * 0.38, u(170), u(50), true], [W * 0.62, u(200), u(56), false]]
    : [[W * 0.08, u(300), u(78), false], [W * 0.33, u(230), u(62), true], [W * 0.53, u(270), u(70), false]];
  const shipD_all = ships.map(([x, L2, h, fl]) => { const d = shipD(L2, h, fl); return { x, L2, h, d }; });
  shipD_all.forEach((s, i) => add(laid(s2, D, u, { name: `2B · US ship ${i + 1} (silver)`, fill: D.M.silver, looseFill: D.M.looseSilver, soft: 60, grainCols: ['#d6dadf', '#aab1b9', '#f1f3f5'],
    draw: (g, p) => svg('path', { d: s.d, fill: p.fill, stroke: p.stroke, 'stroke-width': p.sw, transform: `translate(${f1(s.x)} ${f1(surfY + u(4))})` }, g),
    times: { wet: [T.amer - 0.25 + i * 0.3, T.amer + 0.25 + i * 0.3], dust: [T.amer + i * 0.36, T.amer + 0.34 + i * 0.36] } })));
  const shipLab = lab(s2, { name: '2B · Label US Navy', x: P ? W * 0.08 : W * 0.08, y: surfY - u(P ? 150 : 175), size: u(P ? 32 : 36), ls: 0.12, txt: 'US NAVY · PRACTICE DEPTH CHARGES', t: T.prac - 0.1, dur: 0.6 });
  // the sub, bigger now; same shell
  const sub2W = P ? W * 0.66 : W * 0.36, s2S = sub2W / 400;
  const sub2X = P ? W * 0.1 : W * 0.24, sub2Y = P ? H * 0.43 : H * 0.66;
  const sub2 = svg('g', { 'data-name': '2C · B-59 (shell inlay)', transform: `translate(${f1(sub2X)} ${f1(sub2Y)}) scale(${f1(s2S * 1000) / 1000})` }, s2);
  const subB = inlay(sub2, D, u, { name: 'Sub inlay', d: SUB_D, box: [0, 0, 400, 66], strips: 11, seed: 3 });
  const subCx = sub2X + 200 * s2S, subCy = sub2Y + 40 * s2S;
  // charges: silver grains dropping from the ships, bursting in rings round the hull
  const chargeG = svg('g', { 'data-name': '2D · Depth charges' }, s2);
  const charges = T.bursts.map((tb, i) => {
    const src = shipD_all[i];
    const x0 = src.x + src.L2 * 0.5, x1 = subCx + (i - 1) * sub2W * 0.36, y1 = subCy + (i === 1 ? -u(70) : u(10));
    const dot = svg('circle', { r: u(7), fill: D.M.silver, stroke: '#d6dadf', 'stroke-width': u(1) }, chargeG);
    const ring = svg('g', {}, chargeG);
    const rg = [];
    for (let k = 0; k < 40; k++) rg.push([svg('circle', { r: f1(u(1 + 1.6 * rand(k + i * 50))), fill: k % 3 ? '#d6dadf' : '#f1f3f5' }, ring), rand(k * 3.3 + i) * Math.PI * 2, 0.55 + 0.45 * rand(k * 7.1 + i)]);
    const halo = svg('circle', { r: 1, fill: 'none', stroke: '#aab1b9', 'stroke-width': u(2), 'stroke-dasharray': `${u(2)} ${u(9)}` }, chargeG);
    const t0 = tb - 1.15;
    return { update(Tt) {
      const pf = progress(Tt, t0, tb);
      const on = Tt > t0 && Tt < tb;
      dot.style.display = on ? '' : 'none';
      if (on) { const e = pf * pf; dot.setAttribute('cx', f1(lerp(x0, x1, pf))); dot.setAttribute('cy', f1(lerp(surfY + u(6), y1, e))); }
      const pb = progress(Tt, tb, tb + 1.4);
      ring.style.display = pb > 0 && pb < 1 ? '' : 'none';
      halo.style.display = pb > 0 && pb < 0.8 ? '' : 'none';
      if (pb > 0 && pb < 1) {
        const R = u(P ? 120 : 150) * ease.outCubic(pb);
        rg.forEach(([c, a, m]) => { c.setAttribute('cx', f1(x1 + Math.cos(a) * R * m)); c.setAttribute('cy', f1(y1 + Math.sin(a) * R * m * 0.8 + pb * pb * u(30))); });
        ring.style.opacity = 1 - pb;
        halo.setAttribute('cx', f1(x1)); halo.setAttribute('cy', f1(y1)); halo.setAttribute('r', f1(R * 1.05)); halo.style.opacity = 0.7 * (1 - pb / 0.8);
      }
    } };
  });
  add({ update: Tt => charges.forEach(c => c.update(Tt)) });
  // Moscow: a dotted gold line of orders that is brushed off, grain by grain
  const mosX = P ? W * 0.8 : W * 0.93, mosY = P ? H * 0.11 : H * 0.11;
  const mosTo = [subCx + sub2W * 0.07, subCy - 60 * s2S];
  const mosG = svg('g', { 'data-name': '2E · Line from Moscow' }, s2);
  const mdots = [];
  for (let k = 0; k < 26; k++) { const f = (k + 0.5) / 26; mdots.push([svg('circle', { r: u(3.2), fill: D.M.gold, stroke: '#c9a24c', 'stroke-width': u(0.8) }, mosG), lerp(mosX, mosTo[0], f), lerp(mosY + u(30), mosTo[1], f), f]); }
  const mosLab = lab(s2, { name: '2E · Label Moscow', x: mosX, y: mosY, anchor: 'end', size: u(P ? 40 : 44), ls: 0.14, txt: 'MOSCOW', t: T.moscow - 0.15, color: '#e3c579', weight: 600 });
  const silLab = lab(s2, { name: '2E · Label silent', x: mosX, y: mosY + u(P ? 52 : 112), anchor: 'end', size: u(P ? 30 : 34), ls: 0.06, txt: 'no word for days', t: T.silent + 0.15, color: PAL.labelDim, weight: 400, dur: 0.5 });
  add({ update(Tt) {
    mdots.forEach(([c, x, y, f], k) => {
      const a = progress(Tt, T.moscow + f * 0.45, T.moscow + f * 0.45 + 0.12);
      const off = progress(Tt, T.silent + (1 - f) * 0.5, T.silent + (1 - f) * 0.5 + 0.55); // brushed off from the sub end upward
      const keep = k % 5 === 2 && off > 0; // a few grains stay stuck: the line is broken, not erased
      c.style.opacity = a * (keep ? 0.55 : 1 - off);
      c.setAttribute('cx', f1(x + (keep ? 0 : smootherstep(off) * u(40 + 30 * rand(k)))));
      c.setAttribute('cy', f1(y + (keep ? 0 : smootherstep(off) * u(26) * rand(k * 3))));
    });
  } });
  // the evidence photo, set like an inlaid plate
  const ph = P ? { x: W * 0.08, y: H * 0.515, w: W * 0.52 } : { x: W * 0.69, y: H * 0.5, w: W * 0.25 };
  ph.h = ph.w * 734 / 948;
  const photo = svg('g', { 'data-name': '2F · Photo B-59 surfaced (US Navy, EV)' }, s2);
  const phIn = svg('g', {}, photo);
  svg('rect', { x: f1(ph.x - u(10)), y: f1(ph.y - u(10)), width: f1(ph.w + u(20)), height: f1(ph.h + u(20)), fill: D.M.gold }, phIn);
  svg('rect', { x: f1(ph.x - u(3)), y: f1(ph.y - u(3)), width: f1(ph.w + u(6)), height: f1(ph.h + u(6)), fill: '#0c0d11' }, phIn);
  const phClip = `lq-c${uid++}`;
  svg('rect', { x: f1(ph.x), y: f1(ph.y), width: f1(ph.w), height: f1(ph.h) }, svg('clipPath', { id: phClip }, D.defs));
  svg('image', { href: ctx.asset('assets/b59-surfaced-1962.jpg'), x: f1(ph.x - ph.w * 0.03), y: f1(ph.y - ph.h * 0.03), width: f1(ph.w * 1.06), height: f1(ph.h * 1.06), preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${phClip})`, style: 'filter:grayscale(1) contrast(1.05) brightness(0.8)' }, phIn);
  // a faint lacquer glaze over the print (it sits under the clear coat like everything else)
  svg('rect', { x: f1(ph.x), y: f1(ph.y), width: f1(ph.w), height: f1(ph.h), fill: '#0c0d11', opacity: 0.12 }, phIn);
  const phCap = lab(s2, { name: '2F · Caption photo', x: ph.x - u(10), y: ph.y + ph.h + u(P ? 54 : 52), size: u(P ? 28 : 28), txt: 'B-59 forced to surface, 28–29 Oct 1962', t: T.moscow + 0.3, color: PAL.labelDim, weight: 400, dur: 0.6 });
  lab(s2, { name: '2F · Credit photo', x: ph.x - u(10), y: ph.y + ph.h + u(P ? 92 : 88), size: u(28), txt: 'US Navy photo · NARA 428-N-711200', t: T.moscow + 0.5, color: PAL.labelDim, weight: 400, dur: 0.6 });
  const phT = T.moscow - 0.45;
  add({ update(Tt) {
    const p = spring(Tt - phT, springs.gentle);
    photo.style.opacity = clamp(progress(Tt, phT, phT + 0.25));
    // set into the lacquer: comes down from a few px above, its shadow closes up as it seats
    phIn.setAttribute('transform', `translate(0 ${f1((1 - p) * -u(14))})`);
  } });

  // ======================= STATION 3 · VOTE =======================
  const s3 = st[2];
  const torp = P ? { x: W * 0.08, y: H * 0.3, w: W * 0.76 } : { x: W * 0.1, y: H * 0.1, w: W * 0.72 };
  const tS = torp.w / 600;
  add(laid(s3, D, u, { name: '3A · Nuclear torpedo', fill: D.M.gold, soft: 160,
    draw: (g, p) => svg('path', { d: tp(TORP.body + TORP.tail, tS, torp.x, torp.y), fill: p.fill }, g),
    times: { wet: [T.board - 0.1, T.nuclear + 0.3], dust: [T.nuclear - 0.15, T.torpedo + 0.5] } }));
  // torpedo bands: thin black lacquer rings left un-dusted (drawn over)
  const bands = svg('g', { 'data-name': '3A · Torpedo bands', transform: `translate(${f1(torp.x)} ${f1(torp.y)}) scale(${f1(tS * 1000) / 1000})` }, s3);
  for (const bx of [130, 150, 470]) svg('rect', { x: bx, y: 12, width: 5, height: 36, fill: PAL.lacquer }, bands);
  const torLab = lab(s3, { name: '3A · Label torpedo', x: torp.x, y: torp.y + 60 * tS + u(P ? 56 : 62), size: u(P ? 34 : 38), ls: 0.12, txt: 'NUCLEAR TORPEDO · ON BOARD', t: T.nuclear - 0.1, dur: 0.45 });
  const figH = P ? H * 0.27 : H * 0.5, fS = figH / 520;
  const feetY = P ? H * 0.745 : H * 0.86;
  const fcx = P ? [W * 0.19, W * 0.46, W * 0.72] : [W * 0.23, W * 0.5, W * 0.77];
  const roles = ['CAPTAIN', 'POLITICAL OFFICER', 'THIRD OFFICER'];
  const figs = ['A', 'B', 'C'].map((k, i) => {
    const fx = fcx[i] - 100 * fS, fy = feetY - 514 * fS;
    const g = svg('g', { 'data-name': `3B · Officer ${i + 1} (${roles[i].toLowerCase()})` }, s3);
    const X = [fS, fx, fy];
    const t0 = T.three - 0.1 + i * 0.2;
    // raised black lacquer: rim pass (the sheen on the built-up edge) then the body
    const raised = add(laid(g, D, u, { name: `Officer ${i + 1} · raised lacquer`, stream: false, loose: false, soft: 260, dir: 'y', fill: PAL.raised,
      draw: (gg, p) => { if (p.fill !== PAL.wet) raisedFig(gg, FIG[k], X); else drawFigure(gg, FIG[k], p, 0, X); },
      times: { wet: [t0, t0 + 0.45], dust: [t0 + 0.2, t0 + 0.75] } }));
    let gold = null;
    if (i < 2) gold = add(laid(g, D, u, { name: `Officer ${i + 1} · gold YES`, fill: D.M.gold, soft: 220, dir: 'y', loose: false,
      draw: (gg, p) => p.fill === PAL.wet ? null : drawFigure(gg, FIG[k], p, 0, X),
      times: { wet: [0, 0.01], dust: i === 0 ? [T.two - 0.05, T.two + 0.55] : [T.yes - 0.12, T.yes + 0.5] } }));
    const lines = P && i > 0 ? roles[i].split(' ') : [roles[i]];
    lines.forEach((ln, j) => lab(s3, { name: `3B · Role ${i + 1}${j ? ' (2)' : ''}`, x: fcx[i], y: feetY + u(P ? 50 : 52) + j * u(36), anchor: 'middle', size: u(P ? 28 : 30), ls: 0.1, txt: ln, t: T.officers + i * 0.15 + j * 0.1, color: i === 2 ? PAL.label : PAL.labelDim, weight: i === 2 ? 600 : 400 }));
    return { g, raised, gold };
  });
  // YES, laid in gold beside the two heads; the third gets nothing yet
  const yesPos = i => (P ? [fcx[i], feetY - figH - u(26)] : [fcx[i] + 70 * fS + u(26), feetY - figH + u(70)]);
  [0, 1].forEach(i => add(laid(s3, D, u, { name: `3C · YES ${i + 1}`, fill: D.M.gold, soft: 50, stream: false,
    draw: (g, p) => textEl(g, { x: yesPos(i)[0], y: yesPos(i)[1], anchor: P ? 'middle' : 'start', size: u(P ? 60 : 72), family: FONT.disp, weight: 800, ls: 0.04, txt: 'YES', paint: p }),
    times: { wet: [i ? T.yes - 0.2 : T.two - 0.15, i ? T.yes + 0.1 : T.two + 0.15], dust: [i ? T.yes - 0.05 : T.two, i ? T.yes + 0.38 : T.two + 0.38] } })));
  if (P) {
    lab(s3, { name: '3D · Rule', x: W * 0.08, y: H * 0.15, size: u(40), txt: 'to fire it,', t: tTo - 0.05, color: PAL.label, weight: 400, dur: 0.4 });
    lab(s3, { name: '3D · Rule 2', x: W * 0.08, y: H * 0.15 + u(56), size: u(40), txt: 'all three must agree', t: T.three - 0.05, color: PAL.label, weight: 600, dur: 0.5 });
    lab(s3, { name: '3D · Rule source', x: W * 0.08, y: H * 0.15 + u(104), size: u(28), txt: 'as later accounts tell it', t: T.agree, color: PAL.labelDim, weight: 400, dur: 0.5 });
  } else lab(s3, { name: '3D · Rule', x: W * 0.1, y: H * 0.355, size: u(32), txt: 'to fire it, all three must agree · as later accounts tell it', t: T.agree - 0.3, color: PAL.labelDim, weight: 400, dur: 0.7 });

  // ======================= STATION 4 · NO =======================
  const s4 = st[3];
  const f4H = P ? H * 0.25 : H * 0.7, f4S = f4H / 520;
  const f4x = P ? W * 0.2 : W * 0.17, f4feet = P ? H * 0.785 : H * 0.92;
  const fig4 = svg('g', { 'data-name': '4A · Arkhipov (no likeness)' }, s4);
  const X4 = [f4S, f4x - 100 * f4S, f4feet - 514 * f4S];
  raisedFig(fig4, FIG.C, X4);
  // name, sprinkled in gold
  const nmX = P ? S.x + u(4) : W * 0.335, nmY = P ? S.y + u(96) : H * 0.2;
  const nmMax = P ? S.w * 0.98 : W * 0.6;
  const nmSize = fitSize(s4, 'ARKHIPOV', FONT.disp, 800, u(P ? 150 : 120), P ? nmMax : nmMax * 0.62, 0.02);
  add(laid(s4, D, u, { name: '4B · Name VASILI', fill: D.M.gold, soft: 70, draw: (g, p) => textEl(g, { x: nmX + u(4), y: P ? nmY : nmY, size: u(P ? 54 : 56), family: FONT.disp, weight: 800, ls: 0.16, txt: 'VASILI', paint: p }), times: { wet: [T.vasili - 0.2, T.vasili + 0.25], dust: [T.vasili - 0.05, T.vasili + 0.45] } }));
  add(laid(s4, D, u, { name: '4B · Name ARKHIPOV', fill: D.M.gold, soft: 90, draw: (g, p) => textEl(g, { x: nmX, y: nmY + nmSize * 0.88, size: nmSize, family: FONT.disp, weight: 800, ls: 0.02, txt: 'ARKHIPOV', paint: p }), times: { wet: [T.arkh - 0.25, T.arkh + 0.3], dust: [T.arkh - 0.08, T.arkh + 0.6] } }));
  // NO: vermilion under the black, polished out with charcoal
  const noBox = P ? { x: S.x, y: H * 0.255, w: S.w * 0.98, h: H * 0.245 } : { x: W * 0.335, y: H * 0.37, w: W * 0.5, h: H * 0.38 };
  const noSize = fitSize(s4, 'NO', FONT.disp, 800, noBox.h * 1.32, noBox.w, -0.02);
  const noG = svg('g', { 'data-name': '4C · NO (vermilion, polished out)' }, s4);
  const noMaskId = `lq-m${uid++}`;
  const noMask = svg('mask', { id: noMaskId, maskUnits: 'userSpaceOnUse', x: -1e5, y: -1e5, width: 2e5, height: 2e5 }, D.defs);
  const noInner = svg('g', { mask: `url(#${noMaskId})` }, noG);
  const noText = textEl(noInner, { x: noBox.x - noSize * 0.03, y: noBox.y + noBox.h * 0.98, size: noSize, family: FONT.disp, weight: 800, ls: -0.02, txt: 'NO', paint: { fill: D.M.shu } });
  const nb = noText.getBBox();
  // polishing strokes: back-and-forth rubs across the letters; overlapping rubs cut deeper (mask = how much black is gone)
  const rubs = [];
  const nR = 6;
  for (let k = 0; k < nR; k++) {
    const y = nb.y + nb.height * (0.12 + 0.76 * k / (nR - 1));
    const l2r = k % 2 === 0;
    const xa = nb.x - u(30), xb = nb.x + nb.width + u(30);
    const dd = `M${f1(l2r ? xa : xb)} ${f1(y + (rand(k) - 0.5) * u(20))}Q${f1((xa + xb) / 2)} ${f1(y + (rand(k + 9) - 0.5) * u(60))} ${f1(l2r ? xb : xa)} ${f1(y + (rand(k + 4) - 0.5) * u(20))}`;
    const pth = svg('path', { d: dd, stroke: '#fff', 'stroke-width': f1(nb.height * 0.36), 'stroke-linecap': 'round', fill: 'none', opacity: 0.62, pathLength: 1, 'stroke-dasharray': '0 2' }, noMask);
    const t0 = T.no - 0.62 + k * 0.1;
    rubs.push({ pth, t0, t1: t0 + 0.2 });
  }
  const noFull = svg('rect', { x: f1(nb.x - u(40)), y: f1(nb.y - u(40)), width: f1(nb.width + u(80)), height: f1(nb.height + u(80)), fill: '#fff', opacity: 0 }, noMask);
  // charcoal slurry left by the rubbing (grey haze), wiped after
  const slClip = `lq-c${uid++}`;
  svg('clipPath', { id: slClip }, D.defs).appendChild(noText.cloneNode(true));
  const slurry = svg('g', { 'data-name': 'Charcoal slurry', opacity: 0, 'clip-path': `url(#${slClip})` }, noG);
  rubs.forEach(r => svg('path', { d: r.pth.getAttribute('d'), stroke: '#3a3d42', 'stroke-width': f1(nb.height * 0.3), 'stroke-linecap': 'round', fill: 'none', opacity: 0.35 }, slurry));
  // the charcoal block
  const block = svg('g', { 'data-name': 'Polishing charcoal' }, s4);
  svg('rect', { x: -u(55), y: -u(30), width: u(110), height: u(60), rx: u(8), fill: '#2a2c30' }, block);
  svg('rect', { x: -u(55), y: -u(30), width: u(110), height: u(10), rx: u(5), fill: '#45484e' }, block);
  svg('path', { d: `M${-u(40)} ${-u(8)}l${u(70)} ${u(4)}M${-u(30)} ${u(10)}l${u(60)} ${-u(3)}`, stroke: '#1b1c1f', 'stroke-width': u(2) }, block);
  // the polish catching the window light, once, after the reveal
  const shineClip = `lq-c${uid++}`;
  const scp = svg('clipPath', { id: shineClip }, D.defs);
  scp.appendChild(noText.cloneNode(true));
  const shine = svg('rect', { 'data-name': 'Polish shine', x: 0, y: f1(nb.y - u(40)), width: f1(nb.width * 0.16), height: f1(nb.height + u(80)), fill: 'url(#lq-hl)', opacity: 0.55, 'clip-path': `url(#${shineClip})` }, noG);
  add({ update(Tt) {
    let active = null;
    rubs.forEach(r => { const p = ease.inOutSine(progress(Tt, r.t0, r.t1)); r.pth.setAttribute('stroke-dasharray', `${f1(p * 1000) / 1000} 2`); if (Tt >= r.t0 && Tt <= r.t1 + 0.04) active = { r, p }; });
    noFull.setAttribute('opacity', f1(progress(Tt, T.no - 0.06, T.no + 0.12) * 10) / 10);
    slurry.setAttribute('opacity', f1(Math.min(progress(Tt, T.no - 0.62, T.no - 0.4), 1 - progress(Tt, T.no - 0.15, T.no + 0.05)) * 100) / 100);
    if (active) {
      const len = active.r.pth.getTotalLength();
      const pt = active.r.pth.getPointAtLength(clamp(active.p) * len);
      block.style.display = '';
      block.setAttribute('transform', `translate(${f1(pt.x)} ${f1(pt.y)}) rotate(${f1(-6 + 4 * Math.sin(Tt * 30))})`);
    } else block.style.display = 'none';
    const ps = progress(Tt, T.no + 0.3, T.no + 1.25);
    shine.style.display = ps > 0 && ps < 1 ? '' : 'none';
    shine.setAttribute('x', f1(nb.x - nb.width * 0.2 + ease.inOutSine(ps) * nb.width * 1.25));
  } });
  // forty years: 1962 (silver, as it was) → 2002 (gold)
  const yr = P ? { x: W * 0.33, y: H * 0.66, s: u(84) } : { x: W * 0.335, y: H * 0.875, s: u(84) };
  add(laid(s4, D, u, { name: '4D · 1962', fill: D.M.silver, looseFill: D.M.looseSilver, soft: 50, grainCols: ['#d6dadf', '#aab1b9'], draw: (g, p) => textEl(g, { x: yr.x, y: yr.y, size: yr.s * 0.62, family: FONT.disp, weight: 800, ls: 0.04, txt: '1962', paint: p }), times: { wet: [T.world - 0.15, T.world + 0.2], dust: [T.world, T.name] } }));
  const w62 = (() => { const t = svg('text', { 'font-family': FONT.disp, 'font-weight': 800, 'font-size': yr.s * 0.62, 'letter-spacing': '0.04em' }, s4); t.textContent = '1962'; const w = t.getComputedTextLength(); t.remove(); return w; })();
  const lineX0 = yr.x + w62 + u(22), lineX1 = lineX0 + u(P ? 150 : 190);
  add(laid(s4, D, u, { name: '4D · Forty-year line', fill: 'none', stroke: D.M.gold, sw: u(4), loose: false, soft: 40,
    draw: (g, p) => svg('path', { d: `M${f1(lineX0)} ${f1(yr.y - yr.s * 0.2)}H${f1(lineX1)}`, stroke: p.fill === PAL.wet ? PAL.wetLine : p.stroke, 'stroke-width': u(4), fill: 'none' }, g),
    times: { wet: [T.name - 0.2, T.forty], dust: [T.name, T.forty + 0.1] } }));
  add(laid(s4, D, u, { name: '4D · 2002', fill: D.M.gold, soft: 60, draw: (g, p) => textEl(g, { x: lineX1 + u(22), y: yr.y + yr.s * 0.06, size: yr.s, family: FONT.disp, weight: 800, ls: 0.02, txt: '2002', paint: p }), times: { wet: [T.forty - 0.2, T.forty + 0.2], dust: [T.forty, T.later + 0.2] } }));
  const fyLab = lab(s4, { name: '4D · Label forty years', x: (lineX0 + lineX1) / 2, anchor: 'middle', y: yr.y - yr.s * 0.2 - u(20), size: u(P ? 26 : 28), ls: 0.1, txt: '40 YEARS', t: T.forty + 0.05, color: PAL.labelDim, weight: 400 });

  // ---------- reflection of the window in the polish (screen space, over everything) ----------
  const refl = svg('g', { 'data-name': 'Window reflection', style: 'mix-blend-mode:screen;pointer-events:none' }, node);
  const rw = P ? W * 0.9 : W * 0.42;
  const band = svg('path', { d: `M0 ${-H * 0.1}L${f1(rw)} ${-H * 0.1}L${f1(rw - H * 0.38)} ${f1(H * 1.1)}L${f1(-H * 0.38)} ${f1(H * 1.1)}Z`, fill: 'url(#lq-refl)', opacity: 0.045 }, refl);
  const hair = svg('path', { d: `M0 ${-H * 0.1}L${f1(u(5))} ${-H * 0.1}L${f1(u(5) - H * 0.38)} ${f1(H * 1.1)}L${f1(-H * 0.38)} ${f1(H * 1.1)}Z`, fill: '#dfe8f2', opacity: 0.07 }, refl);

  // ---------- camera ----------
  // each station has a view (world point at frame centre + scale) that creeps slowly; glides lerp between views in the pauses.
  const FOC = P ? [[0.5, 0.55], [0.45, 0.45], [0.5, 0.5], [0.5, 0.42]] : [[0.62, 0.5], [0.4, 0.6], [0.5, 0.55], [0.55, 0.5]];
  const torpC = [torp.x + 300 * tS, torp.y + 30 * tS];
  function view(i, Tt) {
    const c = CAM[i], [ox, oy] = O(i), [fx, fy] = [W * FOC[i][0], H * FOC[i][1]];
    let hold = Math.max(0, Math.min(Tt, c.leave) - c.arrive);
    if (i === 2) {
      // starts tight on the torpedo, pulls back to reveal the three officers on "To fire it"
      const q = smootherstep(progress(Tt, tTo - 0.1, tTo + 0.9));
      hold = Math.max(0, Math.min(Tt, c.leave) - (tTo + 0.9));
      const s = lerp(P ? 1.18 : 1.22, 1, q) * (1 + hold * 0.0042);
      let cx = lerp(torpC[0], fx + (W / 2 - fx) / s, q), cy = lerp(torpC[1] + (P ? H * 0.03 : H * 0.07), fy + (H / 2 - fy) / s, q);
      if (P) cy = Math.max(cy, H / 2 / s - H * 0.1); // 9:16: do not show the photo plate of station 2 above
      return { cx: ox + cx, cy: oy + cy, s };
    }
    const s = 1 + hold * 0.0042;
    return { cx: ox + fx + (W / 2 - fx) / s, cy: oy + fy + (H / 2 - fy) / s, s };
  }
  function camAt(Tt) {
    let v;
    let idx = 0;
    for (let i = 1; i < 4; i++) if (Tt >= CAM[i - 1].leave) idx = i;
    if (idx === 0 || Tt >= CAM[idx].arrive) v = view(idx, Tt);
    else {
      const A = view(idx - 1, CAM[idx - 1].leave), B = view(idx, CAM[idx].arrive);
      const p = smootherstep(progress(Tt, CAM[idx - 1].leave, CAM[idx].arrive));
      v = { cx: lerp(A.cx, B.cx, p), cy: lerp(A.cy, B.cy, p), s: lerp(A.s, B.s, p) };
    }
    // the hull takes the charges: a short shake on each burst
    v.sh = T.bursts.reduce((a, tb, i) => a + shake(Tt, tb, { amp: u(i === 1 ? 7 : 5), decay: 0.3 }), 0);
    return v;
  }

  function update(Tt) {
    const c = camAt(Tt);
    cam.setAttribute('transform', `translate(${f1(W / 2 + c.sh)} ${f1(H / 2 + c.sh * 0.4)}) scale(${(c.s).toFixed(4)}) translate(${f1(-c.cx)} ${f1(-c.cy)})`);
    const ox = c.cx - W / 2, oy = c.cy - H / 2;
    deepCam.setAttribute('transform', `translate(${f1(-ox * 0.9)} ${f1(-oy * 0.9)})`);
    const travel = P ? oy / H : ox / W;
    band.setAttribute('transform', `translate(${f1(W * (P ? 0.25 : 0.52) - travel * W * 0.07)} 0)`);
    hair.setAttribute('transform', `translate(${f1(W * (P ? 0.25 : 0.52) + rw * 0.47 - travel * W * 0.07)} 0)`);
    // the shell turns in the light as the camera moves
    D.shells.forEach((g, i) => g.setAttribute('gradientTransform', `rotate(${f1(i * 9 - 10 + travel * 28 + Tt * 1.5)} 0.5 0.5)`));
    // the sub is set in on "submarine"; the second one is already in place
    const ps = spring(Tt - (T.sub - 0.1), springs.default);
    sub1.style.opacity = clamp(progress(Tt, T.sub - 0.1, T.sub + 0.08));
    sub1In.parentNode && sub1.setAttribute('transform', `translate(0 ${f1((1 - ps) * -u(12))})`);
    subA.shadow.setAttribute('opacity', f1(0.55 * clamp(ps)) );
    for (const x of ups) x.update(Tt);
  }
  update(0);
  return { node, update };
}
