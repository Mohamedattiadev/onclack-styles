// 3 · THE RULE. KNOW: a nuclear torpedo on board; three officers must agree to fire; two say yes.
// FEEL: weight, a closing trap. SEE: a new folded sheet opens → the torpedo is cut in one long stroke and drops out →
// a saw-edged window is cut, its paper falls and leaves THREE PAPER OFFICERS standing (positive paper, lace in the
// coats, three different postures) → three pencilled circles = the three votes → YES, YES is cut; the third stays pencil.
// truth: RC (figures are generic, not portraits; "three must agree" as usually reported — accounts differ, hedge in VO).
import { makeStage, makeSheet, borderLace, garland, torpedoPath, officer, wt, textW, P, PAL } from '../shared/lace.js';
import { glide } from '/onclack-styles/engine/lib/spring.js';
import { svg, clamp } from '/onclack-styles/engine/lib/anim.js';

export default async function (root, ctx) {
  const S = await makeStage(root, ctx, { seed: 37, lamp: [0.5, 0.5] });
  const { L, W, H, u } = S;
  const port = L.portrait;
  const box = L.pick({
    landscape: { x: W * 0.065, y: H * 0.07, w: W * 0.87, h: H * 0.86 },
    portrait: { x: W * 0.04, y: H * 0.085, w: W * 0.86, h: H * 0.715 },
  });
  const r = L.pick({ landscape: 19, portrait: 17 }) * u;
  const sh = makeSheet(S, { ...box, r, openAt: 0.0, openDur: 0.5, enterAt: -0.12, name: '3 · Lace sheet (opens)' });
  const lace = borderLace(box.x, box.y, box.w, box.h, r, 37);
  sh.holes(lace.holes);
  const I = lace.inner, cx = box.x + box.w / 2;

  const T = {
    nuclear: wt(ctx, 'nuclear', 0, 1.16), torpedo: wt(ctx, 'torpedo', 0, 1.56), fire: wt(ctx, 'fire', 0, 2.58), three: wt(ctx, 'three', 0, 3.19),
    officers: wt(ctx, 'officers', 0, 3.54), must: wt(ctx, 'must', 0, 4.05), two: wt(ctx, 'Two', 0, 4.97), yes: wt(ctx, 'yes', 0, 5.48),
  };

  // ---- torpedo band
  const tp = L.pick({
    landscape: { x: cx - I.w * 0.3, y: I.y + I.h * 0.12, len: I.w * 0.6 },
    portrait: { x: I.x + I.w * 0.04, y: I.y + I.h * 0.075, len: I.w * 0.92 },
  });
  sh.cut(torpedoPath(tp.x, tp.y, tp.len), 0.5, T.torpedo - 0.06, { name: 'Torpedo cut', seed: 81, pre: 0.45, fallOpts: { spin: 0.25 } });
  const lS = L.pick({ landscape: 46, portrait: 52 }) * u, lab = 'NUCLEAR TORPEDO';
  sh.cutText(lab, cx - textW(lab, lS) / 2, tp.y + tp.len * 0.075 + lS * 1.35, lS, T.torpedo + 0.02, T.torpedo + 0.6, { name: 'Cut text NUCLEAR TORPEDO' });
  // frieze (ornament, symmetric — cut while folded)
  const frY = I.y + I.h * L.pick({ landscape: 0.36, portrait: 0.235 });
  sh.holes(garland(cx, frY, I.w * 0.86, L.pick({ landscape: 34, portrait: 32 }) * u, 0));

  // ---- window with three officers
  const win = L.pick({
    landscape: { x: I.x + I.w * 0.16, y: I.y + I.h * 0.43, w: I.w * 0.68, h: I.h * 0.4 },
    portrait: { x: I.x + I.w * 0.02, y: I.y + I.h * 0.29, w: I.w * 0.96, h: I.h * 0.48 },
  });
  const tooth = 22 * u;
  const winD = P.sawRect(win.x, win.y, win.w, win.h, tooth);
  const figs = [
    { fx: 0.2, pose: 'sides', h: 0.86, lean: 0, tilt: 0, name: 'Officer 1 (arms at sides)' },
    { fx: 0.5, pose: 'behind', h: 0.9, lean: -2, tilt: 3, name: 'Officer 2 (hands behind back)' },
    { fx: 0.8, pose: 'folded', h: 0.93, lean: 1.5, tilt: -5, name: 'Officer 3 (arms folded) — Arkhipov' },
  ];
  const foot = win.y + win.h + 2 * u;
  const winCut = sh.cut(winD, T.fire - 0.15, T.officers + 0.02, { name: 'Window cut', seed: 91, fall: false, kerf: 2.4, pre: 1.3 });
  const figG = figs.map(f => officer(sh, win.x + win.w * f.fx, foot, win.h * f.h, f.pose, { lean: f.lean, name: f.name, headTilt: f.tilt }));
  // the cutter's pencil drawing of the three figures, long before the window is cut (fills the wait, shows the plan)
  const sketch = svg('g', { opacity: 0, 'data-name': 'Pencil sketch of the officers' }, sh.pencilG);
  const pen = { island: (d, p) => svg('path', { d, fill: 'none', stroke: PAL.graphite, 'stroke-width': 1.5 * u, 'stroke-dasharray': `${5 * u} ${3 * u}` }, p), group: a => svg('g', a, sketch) };
  for (const f of figs) officer(pen, win.x + win.w * f.fx, foot, win.h * f.h, f.pose, { lean: f.lean, headTilt: f.tilt });
  sketch.querySelectorAll('path[fill="#000"]').forEach(n => n.remove());
  // the fallen window piece = the window minus the figures (a mask of its own)
  const pm = svg('mask', { id: 'pc-win-' + ctx.format, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, S.fdefs);
  svg('path', { d: winD, fill: '#fff' }, pm);
  const fake = { island: (d, p) => svg('path', { d, fill: '#000' }, p), group: a => svg('g', a, pm) };
  for (const f of figs) officer(fake, win.x + win.w * f.fx, foot, win.h * f.h, f.pose, { lean: f.lean, headTilt: f.tilt });
  const pieceNode = svg('g', { mask: `url(#${pm.id})` });
  svg('rect', { x: win.x - tooth, y: win.y - tooth, width: win.w + 2 * tooth, height: win.h + 2 * tooth, fill: S.paperFill2 }, pieceNode);
  sh.fallPiece(pieceNode, T.officers + 0.02, 7, { bbox: { x: win.x, y: win.y, width: win.w, height: win.h }, spin: 0.08, grav: 2600, name: 'Window piece (falls)' });

  // ---- three votes: pencilled circles, then YES, YES cut; the third stays pencil
  const vY = L.pick({ landscape: win.y + win.h + 62 * u, portrait: win.y + win.h + 78 * u });
  const vR = L.pick({ landscape: 40, portrait: 50 }) * u;
  const yS = L.pick({ landscape: 30, portrait: 36 }) * u;
  figs.forEach((f, i) => {
    const x = win.x + win.w * f.fx;
    sh.pencil(`M${x + vR} ${vY} A${vR} ${vR} 0 1 1 ${x + vR - 0.5} ${vY - vR * 0.06}`, T.must + i * 0.12, T.must + 0.25 + i * 0.12, { w: 2.2 });
    if (i < 2) sh.cutText('YES', x - textW('YES', yS) / 2, vY + yS * 0.36, yS, T.two + 0.02 + i * 0.32, T.two + 0.28 + i * 0.32, { name: `Vote ${i + 1}: YES` });
    else sh.pencilText('?', x, vY + yS * 0.4, yS * 1.3, T.yes + 0.2, { anchor: 'middle', rot: 4, name: 'Vote 3: not yet' });
  });

  // ---- sound
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -25, fade: 0.6 });
  ctx.sfx('page-turn-01', 0.02, { lu: -12, duration: 0.8, fadeOut: 0.2 });               // fold opens
  ctx.sfx('footsteps-metal-deck-01', T.officers + 0.1, { lu: -22, duration: 1.6, fadeOut: 0.5 }); // boots on a steel deck, far
  ctx.sfx('drawer-close-01', T.two + 0.3, { lu: -20 });                                   // a small wooden knock — vote one
  ctx.sfx('drawer-close-01', T.two + 0.62, { lu: -19, volume: 0.9 });                     // vote two

  return {
    update(t) {
      // camera: wide on the torpedo, then a slow tilt/push into the three figures
      const s = glide(t, 2.2, 5.2, 1.0, L.pick({ landscape: 1.06, portrait: 1.05 }));
      S.setCam(s, W * 0.5, win.y + win.h * 0.7);
      for (const g of figG) g.setAttribute('opacity', t >= T.officers + 0.02 ? 1 : 0);
      sketch.setAttribute('opacity', (0.7 * clamp((t - 0.9) / 0.6)).toFixed(3));
      S.update(t);
    },
  };
}
