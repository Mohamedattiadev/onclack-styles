// The tally board, shared by board 3 (vote) and board 4 (the NO). Everything is placed in GLOBAL time,
// so the cut from scene 3 to scene 4 is invisible: same marks, same camera, same frame.
// Vote = three knife tallies. Two cut deep (yes). The third is only a faint guide — it is never cut.
// NO = one deep diagonal gouge through all three, the only red in the film.
import { glide, clamp } from '/onclack-styles/engine/lib/anim.js';
import { wordG, label, toneOf, FONT, HEX, F } from './board.js';

export function tallyTimes(ctx) {
  return {
    three: wordG(ctx, 'three', 0, 16.51), officers: wordG(ctx, 'officers', 0, 16.86), two: wordG(ctx, 'Two', 0, 18.29), yes: wordG(ctx, 'yes', 0, 18.8),
    third: wordG(ctx, 'third', 0, 20.25), ark: wordG(ctx, 'Arkhipov', 0, 21.12), no: wordG(ctx, 'no', 0, 22.03), name: wordG(ctx, 'name', 0, 23.73),
    forty: wordG(ctx, 'forty', 0, 24.13), end: (ctx.words.at(-1)?.end ?? 25.1) + 0.9,
  };
}

export function tallyGeom(L) {
  const W = L.width, H = L.height, P = L.portrait, px = L.px;
  return P
    ? { xs: [0.27, 0.46, 0.65].map(f => f * W), yT: H * 0.2, yB: H * 0.43, slant: px(14), dx: 0, nameX: L.safe.x + px(28), nameY: H * 0.555, roleSize: px(24), yesSize: px(42) }
    : { xs: [0.36, 0.5, 0.64].map(f => f * W), yT: H * 0.17, yB: H * 0.6, slant: px(18), dx: 0.17 * W, nameX: 0.56 * W + 0.17 * W, nameY: H * 0.25, roleSize: px(26), yesSize: px(46) };
}

/** Camera for the tally board at GLOBAL time g. */
export function tallyCam(L, G, g) {
  const W = L.width, H = L.height, T = tallyGeom(L);
  const shift = T.dx * glide(g, G.yes + 0.3, G.ark + 0.15, 0, 1);
  const pull = glide(g, G.forty - 0.4, G.end, 0, 1);
  return { z: 1.01 + 0.003 * clamp(g - G.three, 0, 6) - 0.035 * pull, cx: W / 2 + shift, cy: H / 2 };
}

/** Add the tally marks to board B (scene-local times) and build its labels. Returns { update(t) } for the labels. */
export function buildTally(B, root, ctx) {
  const L = ctx.layout, px = L.px, P = L.portrait, G = tallyTimes(ctx), T = tallyGeom(L), lt = g => g - ctx.start;
  const top = i => [T.xs[i] + T.slant, T.yT + (i === 1 ? px(10) : i === 2 ? -px(6) : 0)];
  const bot = i => [T.xs[i] - T.slant * 0.4, T.yB + (i === 0 ? px(8) : i === 2 ? -px(4) : 0)];

  // three faint guides, scored lightly on "three officers"
  for (let i = 0; i < 3; i++) B.stroke({ name: `Guide ${i + 1}`, pts: [top(i), bot(i)], width: px(2.4), alpha: 0.38, t0: lt(G.three) - 2 * F + i * 0.1, t1: lt(G.three) + 0.14 + i * 0.1, taper: px(30), rough: 0.3, glint: false, seed: 20 + i });
  // two deep cuts: "Two" and "yes"
  [G.two, G.yes].forEach((g, i) => {
    const t0 = lt(g) - 3 * F;
    B.stroke({ name: `Tally ${i + 1} deep cut`, pts: [top(i), bot(i)], width: px(15), t0, t1: t0 + 0.2, taper: px(50), rough: 0.2, seed: 30 + i });
    // the knife slipped once beside the cut: a hairline that only a hand makes
    const o = px(i ? -10 : 11);
    B.stroke({ name: `Tally ${i + 1} slip`, pts: [[top(i)[0] + o, top(i)[1] + px(40)], [bot(i)[0] + o * 0.8, bot(i)[1] - px(120)]], width: px(1.8), alpha: 0.75, t0: t0 + 0.12, t1: t0 + 0.26, taper: px(20), glint: false, seed: 40 + i });
  });
  // the gouge: low left → high right through all three, deep red, with white burr on both walls
  const g0 = [T.xs[0] - px(P ? 70 : 90), T.yB - px(P ? 40 : 70)], g1 = [T.xs[2] + px(P ? 80 : 100), T.yT + px(P ? 70 : 110)];
  const mid = (a, b, f, off) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [a[0] + dx * f - (dy / l) * off, a[1] + dy * f + (dx / l) * off]; };
  const gp = (off, n = 40) => Array.from({ length: n + 1 }, (_, k) => mid(g0, g1, k / n, off + px(3) * Math.sin(k * 0.45) + px(1.2) * Math.sin(k * 1.7)));
  const tNo = lt(G.no) - 3 * F;
  B.stroke({ name: 'NO gouge', pts: gp(0), width: px(P ? 20 : 24), color: 2, t0: tNo, t1: tNo + 0.12, taper: px(60), rough: 0.28, seed: 50, over: true, glint: false });
  B.stroke({ name: 'Gouge burr upper', pts: gp(-px(P ? 17 : 20)), width: px(1.8), alpha: 0.6, t0: tNo + 0.05, t1: tNo + 0.24, taper: px(80), glint: false, seed: 51 });
  B.stroke({ name: 'Gouge burr lower', pts: gp(px(P ? 16 : 19)), width: px(1.5), alpha: 0.45, t0: tNo + 0.08, t1: tNo + 0.27, taper: px(90), glint: false, seed: 52 });

  // NO in red knife lines where the third "yes" would be
  const yesY = T.yB + px(P ? 132 : 150);
  const noSize = px(P ? 66 : 74), noW = noSize * 1.5;
  B.hatch({ name: 'NO letters', x: T.xs[2] - noW / 2, y: yesY - noSize * 0.08, w: noW, h: noSize * 1.05, angle: 72, spacing: px(4.2), maxW: 0.86, gamma: 1, order: -1, color: 2, t0: tNo + 0.12, dur: 0.18, lineTime: 0.06, seed: 53,
    draw: (g, w) => { g.font = `600 ${noSize}px ${FONT.display}`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('NO', w / 2, noSize * 0.84); } });

  // the name, cut in light, then brightened by a crossing pass when "the world learned his name"
  const nameLines = P ? [['Vasili Arkhipov', px(96)]] : [['Vasili', px(120)], ['Arkhipov', px(156)]];
  let ny = T.nameY;
  nameLines.forEach(([text, size], i) => {
    const font = `600 ${size}px ${FONT.display}`;
    const c = document.createElement('canvas').getContext('2d'); c.font = font;
    const w = Math.min(c.measureText(text).width + size * 0.2, L.width), h = size * 1.2;
    const tone = toneOf(w, h, g => { g.font = font; const gr = g.createLinearGradient(0, 0, w * 0.5, h); gr.addColorStop(0, '#fff'); gr.addColorStop(0.6, '#e2e2e2'); gr.addColorStop(1, '#909090'); g.fillStyle = gr; g.fillText(text, size * 0.05, size * 0.92); });
    const x = T.nameX - size * 0.05;
    B.hatch({ name: `Name line ${i + 1}`, x, y: ny, w, h, tone: tone.slice(), angle: 72, spacing: px(5), maxW: 0.8, gamma: 1, order: -1, t0: lt(G.ark) - 0.1 + i * 0.22, dur: 0.42, lineTime: 0.08, seed: 60 + i });
    B.hatch({ name: `Name line ${i + 1} brighten`, x, y: ny, w, h, tone: tone.slice(), angle: -30, spacing: px(5), lo: 0.35, maxW: 0.7, gamma: 1, t0: lt(G.name) - 0.05 + i * 0.12, dur: 0.4, lineTime: 0.09, seed: 62 + i, glint: false });
    ny += size * (P ? 1.05 : 1.0);
  });

  // labels live on the board (they move with it): roles, YES, YES, ?, the honest footnote, 2002
  const roles = P ? ['Captain', 'Political<br>officer', 'Chief of<br>staff'] : ['Captain', 'Political<br>officer', 'Flotilla chief<br>of staff'];
  const labs = [];
  roles.forEach((r, i) => labs.push([label(root, L, { name: `Role ${i + 1}`, html: r, x: 0, y: 0, size: T.roleSize, weight: 600, track: '0.12em', anchor: 'center', t0: lt(G.officers) + i * 0.1, dur: 0.3, opacity: 0.8 }), [T.xs[i], T.yB + px(P ? 30 : 36)]]));
  [G.two, G.yes].forEach((g, i) => labs.push([label(root, L, { name: `Yes ${i + 1}`, text: 'Yes', x: 0, y: 0, size: T.yesSize, weight: 800, track: '0.16em', anchor: 'center', t0: lt(g) + 0.1, dur: 0.25 }), [T.xs[i], yesY + px(6)]]));
  labs.push([label(root, L, { name: 'Third vote open', text: '?', x: 0, y: 0, size: T.yesSize, weight: 800, track: '0', anchor: 'center', t0: lt(G.yes) + 0.3, dur: 0.2, opacity: 0.45, out: tNo + 0.05 }), [T.xs[2], yesY + px(6)]]);
  labs.push([label(root, L, { name: 'Accounts differ', text: 'as later told by those on board · accounts differ', x: 0, y: 0, size: px(P ? 24 : 26), family: FONT.display, italic: true, caps: false, track: '0', anchor: 'left', t0: lt(G.yes) + 0.45, dur: 0.4, opacity: 0.62 }),
    P ? [L.safe.x + px(28), L.height * 0.765] : [T.xs[0] - px(150), yesY + px(110)]]);
  labs.push([label(root, L, { name: 'Forty years', html: `known to the world <span style="font-family:${FONT.display};text-transform:none;letter-spacing:0;font-weight:600;font-size:1.5em">· 2002</span>`, x: 0, y: 0, size: px(P ? 30 : 32), weight: 800, track: '0.12em', anchor: 'left', t0: lt(G.forty) - 2 * F, dur: 0.45 }),
    [T.nameX, ny + px(P ? 20 : 30)]]);
  const ap = label(root, L, { name: 'Approx note', text: 'approx. — his role became public around 2002', x: 0, y: 0, size: px(26), family: FONT.display, italic: true, caps: false, track: '0', t0: lt(G.forty) + 0.35, dur: 0.4, opacity: 0.62 });
  labs.push([ap, [T.nameX, ny + px(P ? 76 : 92)]]);

  return {
    G, T,
    update(t) {
      for (const [l, [wx, wy]] of labs) {
        const [x, y] = B.toScreen(wx, wy);
        l.node.style.left = x.toFixed(2) + 'px'; l.node.style.top = y.toFixed(2) + 'px';
        l.update(t);
      }
    },
  };
}
export { HEX, clamp };
