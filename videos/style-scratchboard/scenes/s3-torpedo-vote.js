// Board 3 — the torpedo, then the vote as three knife tallies.
// intent: KNOW a nuclear torpedo; three officers must agree; two say yes · FEEL dread rising · SEE the warhead brightening, two deep cuts and one faint line
// truth: torpedo = RC (generic Soviet 533 mm torpedo silhouette, not a drawing of the T-5) · vote = VO (tallies), roles RC, "accounts differ"
import { glide, clamp } from '/onclack-styles/engine/lib/anim.js';
import { makeBoard, fontsReady, wordT, label, FONT, F } from '../shared/board.js';
import { buildTally, tallyTimes, tallyCam } from '../shared/tally.js';

export default async function (root, ctx) {
  await fontsReady();
  const L = ctx.layout, W = L.width, H = L.height, P = L.portrait, px = L.px;
  const B = makeBoard(root, ctx, 'Board 3');
  const G = tallyTimes(ctx), lt = g => g - ctx.start;
  const tOn = wordT(ctx, 'On', 0, 0.35) - 2 * F, tNuc = wordT(ctx, 'nuclear', 0, 1.16) - 2 * F, tTorp = wordT(ctx, 'torpedo', 0, 1.56) - 2 * F;
  const wipeA = lt(G.three) - 0.5, wipeB = wipeA + 0.32;

  // ---------- 3A · torpedo (axis along x in its own frame; portrait stands it up, nose to the top)
  const len = P ? H * 0.56 : W * 0.7, r = px(P ? 62 : 74);
  const box = P ? { x: W * 0.42 - r * 2.2, y: H * 0.2, w: r * 4.4, h: len + r * 1.5 } : { x: W * 0.12 - r * 1.2, y: H * 0.56 - r * 2.2, w: len + r * 1.6, h: r * 4.4 };
  const frame = g => { // local frame: x along the axis (0 = tail), y across
    g.translate(-box.x, -box.y);
    if (P) { g.translate(W * 0.42, H * 0.2 + len); g.rotate(-Math.PI / 2); } else g.translate(W * 0.12, H * 0.56);
  };
  const body = (g, x0 = 0, x1 = 1) => {
    g.save(); g.beginPath(); g.rect(x0 * len, -r * 1.6, (x1 - x0) * len, r * 3.2); g.clip();
    g.beginPath(); g.moveTo(-len * 0.01, -r * 0.42); g.lineTo(len * 0.07, -r); g.lineTo(len * 0.78, -r);
    g.bezierCurveTo(len * 0.9, -r, len * 0.985, -r * 0.55, len, 0); g.bezierCurveTo(len * 0.985, r * 0.55, len * 0.9, r, len * 0.78, r);
    g.lineTo(len * 0.07, r); g.lineTo(-len * 0.01, r * 0.42); g.closePath(); g.fill(); g.restore();
  };
  const shade = g => { const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#3a3a3a'); gr.addColorStop(0.12, '#fff'); gr.addColorStop(0.3, '#dcdcdc'); gr.addColorStop(0.5, '#6a6a6a'); gr.addColorStop(0.64, '#1a1a1a'); gr.addColorStop(0.84, '#000'); gr.addColorStop(0.95, '#3c3c3c'); gr.addColorStop(1, '#000'); return gr; };
  B.hatch({ name: '3A Torpedo body', ...box, angle: P ? 90 : 0, spacing: px(5), maxW: 0.86, gamma: 1.2, pressure: 0.04, order: P ? -1 : 1, t0: tOn, dur: 0.85, lineTime: 0.3, seed: 70,
    draw: g => {
      frame(g); g.fillStyle = shade(g); body(g);
      g.fillStyle = shade(g); // tail fins + propeller (simple, schematic)
      g.fillRect(-len * 0.032, -r * 0.5, len * 0.024, r * 1.0); // propeller shroud
      g.fillStyle = '#000'; for (const f of [0.3, 0.56, 0.74]) g.fillRect(len * f, -r * 1.2, px(3), r * 2.4); // section seams stay uncut
    } });
  // the warhead section brightens by a crossing pass on "nuclear" — the signature reveal
  B.hatch({ name: '3A Warhead brighten', ...box, angle: P ? 55 : -35, spacing: px(6.5), lo: 0.3, maxW: 0.7, gamma: 1, order: -1, t0: tNuc, dur: 0.38, lineTime: 0.08, seed: 71,
    draw: g => { frame(g); g.fillStyle = shade(g); body(g, 0.742, 1.0); } });
  const tip = P ? [W * 0.42, H * 0.2] : [W * 0.12 + len, H * 0.56];
  const warhead = P ? [W * 0.42, H * 0.2 + len * 0.12] : [W * 0.12 + len * 0.87, H * 0.56];
  B.stroke({ name: '3A Leader', pts: P ? [[warhead[0] + r * 1.15, warhead[1] + px(30)], [warhead[0] + r * 1.75, warhead[1] - px(60)]] : [[warhead[0], warhead[1] - r * 1.25], [warhead[0] - px(30), warhead[1] - r * 2.6]], width: px(2.2), t0: tNuc + 0.05, t1: tNuc + 0.22, taper: 4, glint: false });
  void tip;

  const nucL = P ? [warhead[0] + r * 1.95, warhead[1] - px(120)] : [warhead[0] - px(30) + px(24), warhead[1] - r * 2.6 - px(132)];
  const lab1 = label(root, L, { name: 'Label nuclear torpedo', text: 'Nuclear torpedo', x: nucL[0], y: nucL[1], size: px(P ? 40 : 46), weight: 800, track: '0.12em', anchor: P ? 'left' : 'right', t0: tNuc + 0.1, dur: 0.3, out: wipeA + 0.05 });
  const lab2 = label(root, L, { name: 'Label torpedo yield', text: 'about 10 kilotons · estimates vary', x: nucL[0], y: nucL[1] + px(P ? 52 : 58), size: px(30), family: FONT.display, italic: true, caps: false, track: '0', anchor: P ? 'left' : 'right', t0: tNuc + 0.3, dur: 0.3, out: wipeA + 0.05, opacity: 0.8 });
  if (P) { lab1.node.style.whiteSpace = 'normal'; lab1.node.style.width = px(330) + 'px'; lab2.node.style.whiteSpace = 'normal'; lab2.node.style.width = px(330) + 'px'; lab2.node.style.top = nucL[1] + px(110) + 'px'; }

  B.wipe(wipeA, wipeB, 0.02);

  // ---------- 3B · the vote
  const tally = buildTally(B, root, ctx);

  // sound: a boot on the steel deck ("on board"), drips inside the hull, held breath under the vote, two knife cuts
  ctx.sfx('footsteps-metal-deck-01', tOn + 0.05, { lu: -14 });
  ctx.ambience('drips-wood-01', { from: 0, to: ctx.duration - 0.4, lu: -20 });
  ctx.ambience('breath-close-01', { from: lt(G.three), to: ctx.duration, lu: -24 });
  ctx.sfx('ice-debris-01', lt(G.two) - 3 * F + F, { lu: -16 });
  ctx.sfx('staff-hit-01', lt(G.yes) - 3 * F + F, { lu: -18 });

  return {
    update(t) {
      const g = t + ctx.start;
      const cam = t < wipeB ? { z: 1 + 0.01 * glide(t, 0, wipeB, 0, 1), cx: W / 2 + (P ? 0 : px(30) * glide(t, 0, wipeB, 0, 1)), cy: H / 2 } : tallyCam(L, G, g);
      B.render(t, cam);
      lab1.update(t); lab2.update(t);
      tally.update(t);
    },
  };
}
