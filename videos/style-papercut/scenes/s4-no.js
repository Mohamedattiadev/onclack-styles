// 4 · THE NO (peak). KNOW: the third officer, Vasili Arkhipov, said no; his name became widely known about 40 years later.
// FEEL: held breath → relief, awe. SEE: the last sheet opens → his window is cut, he stands alone (arms folded) → his name
// is cut → the blade cuts a huge NO, the letters DROP OUT and a second, warm amber lamp shines through them — the only
// warm light in the film (brightest + strongest contrast = the peak) → 1962 · forty notches · 2002.
// truth: RC figure (generic, not a portrait); name = VO; "about 40 years" = his role became widely known after the
// Oct 2002 Havana conference (approx.; re-check with 2+ sources before public use).
import { makeStage, makeSheet, borderLace, garland, officer, wt, textW, P, PAL, CUTFONT } from '../shared/lace.js';
import { glide, smootherstep } from '/onclack-styles/engine/lib/spring.js';
import { svg, clamp } from '/onclack-styles/engine/lib/anim.js';

export default async function (root, ctx) {
  const S = await makeStage(root, ctx, { seed: 53, lamp: [0.3, 0.45] });
  const { L, W, H, u } = S;
  const port = L.portrait;
  const box = L.pick({
    landscape: { x: W * 0.065, y: H * 0.07, w: W * 0.87, h: H * 0.86 },
    portrait: { x: W * 0.04, y: H * 0.085, w: W * 0.86, h: H * 0.715 },
  });
  const r = L.pick({ landscape: 19, portrait: 17 }) * u;
  const sh = makeSheet(S, { ...box, r, openAt: 0.0, openDur: 0.45, enterAt: -0.12, name: '4 · Lace sheet (opens)' });
  const lace = borderLace(box.x, box.y, box.w, box.h, r, 53);
  sh.holes(lace.holes);
  const I = lace.inner;

  const T = {
    third: wt(ctx, 'third', 0, 0.51), vas: wt(ctx, 'Vasili', 0, 0.87), ark: wt(ctx, 'Arkhipov', 0, 1.38), says: wt(ctx, 'says', 0, 1.95),
    no: wt(ctx, 'no', 0, 2.29), world: wt(ctx, 'world', 0, 3.33), forty: wt(ctx, 'forty', 0, 4.39), later: wt(ctx, 'later', 0, 4.99),
  };

  // ---- his window (left / top-left) — cut, the paper falls, he stands alone
  const win = L.pick({
    landscape: { x: I.x + I.w * 0.03, y: I.y + I.h * 0.05, w: I.w * 0.29, h: I.h * 0.8 },
    portrait: { x: I.x + I.w * 0.02, y: I.y + I.h * 0.02, w: I.w * 0.4, h: I.h * 0.39 },
  });
  const tooth = 22 * u;
  const winD = P.sawRect(win.x, win.y, win.w, win.h, tooth);
  const fig = { fx: 0.5, h: 0.86 };
  const foot = win.y + win.h + 2 * u;
  sh.cut(winD, T.third - 0.1, T.vas + 0.05, { name: 'Window cut', seed: 5, fall: false, pre: 0.25 });
  const figG = officer(sh, win.x + win.w * fig.fx, foot, win.h * fig.h, 'folded', { lean: 1.5, headTilt: -5, name: 'Vasili Arkhipov (generic paper figure, not a portrait)' });
  const pm = svg('mask', { id: 'pc4-win-' + ctx.format, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, S.fdefs);
  svg('path', { d: winD, fill: '#fff' }, pm);
  officer({ island: (d, p) => svg('path', { d, fill: '#000' }, p), group: a => svg('g', a, pm) }, win.x + win.w * fig.fx, foot, win.h * fig.h, 'folded', { lean: 1.5, headTilt: -5 });
  const pieceNode = svg('g', { mask: `url(#${pm.id})` });
  svg('rect', { x: win.x - tooth, y: win.y - tooth, width: win.w + 2 * tooth, height: win.h + 2 * tooth, fill: S.paperFill2 }, pieceNode);
  sh.fallPiece(pieceNode, T.vas + 0.05, 4, { bbox: { x: win.x, y: win.y, width: win.w, height: win.h }, spin: 0.1, name: 'Window piece (falls)' });

  // ---- right column: name, the NO, the years
  const col = L.pick({
    landscape: { x: I.x + I.w * 0.37, w: I.w * 0.6 },
    portrait: { x: I.x + I.w * 0.46, w: I.w * 0.53 },
  });
  const nS1 = L.pick({ landscape: 66, portrait: 54 }) * u, nS2 = L.pick({ landscape: 104, portrait: 70 }) * u;
  const n1y = L.pick({ landscape: I.y + I.h * 0.13, portrait: I.y + I.h * 0.09 });
  const n2y = n1y + nS2 * L.pick({ landscape: 1.0, portrait: 1.05 });
  sh.cutText('VASILI', col.x, n1y, nS1, T.vas + 0.08, T.ark - 0.06, { name: 'Name: VASILI' });
  const ark = sh.cutText('ARKHIPOV', col.x, n2y, nS2, T.ark - 0.02, T.says - 0.05, { name: 'Name: ARKHIPOV', maxW: col.w });
  sh.pencilText(L.pick({ landscape: 'flotilla chief of staff, aboard B-59', portrait: 'chief of staff, B-59' }), col.x + 4 * u, n2y + L.pick({ landscape: 52, portrait: 46 }) * u,
    L.pick({ landscape: 32, portrait: 30 }) * u, T.says - 0.1, { rot: -1 });

  // the NO: kerf traced by the blade, then the letters drop out → amber lamp
  const no = L.pick({
    landscape: { x: col.x + col.w * 0.42, y: I.y + I.h * 0.835, size: 400 * u },
    portrait: { x: I.x + I.w * 0.5, y: I.y + I.h * 0.8, size: 390 * u },
  });
  const noAttrs = { 'font-family': CUTFONT, 'font-weight': 800, 'font-size': no.size, 'letter-spacing': no.size * 0.02, 'text-anchor': 'middle' };
  const cp = svg('clipPath', { id: 'pc4-noclip-' + ctx.format }, S.defs);
  const cr = svg('rect', { x: 0, y: 0, width: 0, height: H }, cp);
  const noKerf = svg('text', { x: no.x, y: no.y, ...noAttrs, fill: 'none', stroke: '#000', 'stroke-width': 3 * u, 'clip-path': `url(#${cp.id})`, 'data-name': 'NO (cut)' }, sh.ops);
  noKerf.textContent = 'NO';
  const nb = noKerf.getBBox();
  cr.setAttribute('x', nb.x - 10 * u);
  const tNoCut0 = T.says - 0.1, tNoCut1 = T.no - 0.09, tDrop = T.no - 0.07;
  S.blade.segs.push({ t0: tNoCut0, t1: tNoCut1, pos: p => [nb.x + nb.width * p, nb.y + nb.height * (0.18 + 0.64 * (0.5 + 0.5 * Math.sin(p * Math.PI * 5)))] });
  const fallNo = svg('text', { x: no.x, y: no.y, ...noAttrs, fill: S.paperFill2, stroke: '#d8cfbc', 'stroke-width': 1 * u });
  fallNo.textContent = 'NO';
  sh.fallPiece(fallNo, tDrop, 12, { bbox: { x: nb.x, y: nb.y, width: nb.width, height: nb.height }, spin: 0.15, grav: 2000, name: 'NO letters (fall out)' });
  S.amberAt(nb);
  if (port) sh.holes(garland(I.x + I.w / 2, I.y + I.h * 0.475, I.w * 0.92, 30 * u, 0));

  // 1962 · forty notches · 2002
  const yr = L.pick({
    landscape: { x: col.x, y: I.y + I.h * 0.95, w: col.w },
    portrait: { x: I.x + I.w * 0.03, y: I.y + I.h * 0.95, w: I.w * 0.94 },
  });
  const yS = L.pick({ landscape: 44, portrait: 46 }) * u, yW = textW('2002', yS);
  sh.cutText('1962', yr.x, yr.y, yS, T.world - 0.02, T.world + 0.4, { name: 'Year 1962' });
  const n0 = yr.x + yW + 22 * u, n1 = yr.x + yr.w - yW - 22 * u;
  const notches = [];
  for (let i = 0; i < 40; i++) notches.push([n0 + (n1 - n0) * (i / 39), yr.y - yS * 0.36]);
  const nodes = notches.map(([x, y], i) => sh.island(P.slit(x, y, (i % 10 === 9 ? 0.95 : 0.6) * yS, 3.2 * u, Math.PI / 2)));
  nodes.forEach(nd => { nd.setAttribute('fill', '#000'); nd.setAttribute('opacity', 0); });
  S.blade.segs.push({ t0: T.forty - 0.04, t1: T.later - 0.06, pos: p => [n0 + (n1 - n0) * p, yr.y - yS * 0.36 + Math.sin(p * 40 * Math.PI) * yS * 0.25] });
  sh.cutText('2002', yr.x + yr.w - yW, yr.y, yS, T.later - 0.02, T.later + 0.36, { name: 'Year 2002' });
  sh.pencilText('40 years', (n0 + n1) / 2, yr.y - yS * 0.95, 30 * u, T.later + 0.2, { anchor: 'middle', rot: -2 });

  // ---- sound: the sea is gone (drop); a held breath; the NO lands in near-silence
  ctx.sfx('page-turn-01', 0.02, { lu: -12, duration: 0.8, fadeOut: 0.2 });
  ctx.sfx('breath-close-01', T.ark + 0.15, { lu: -21, duration: 1.0, fadeIn: 0.05, fadeOut: 0.3 });
  ctx.sfx('drawer-close-01', tDrop + 0.33, { lu: -24 });   // the paper letters land somewhere below — a soft knock

  return {
    update(t) {
      // camera: settle; after the NO, a slow push toward it
      const s = glide(t, T.no, T.no + 2.6, 1.0, 1.045);
      S.setCam(s, nb.x + nb.width / 2, nb.y + nb.height / 2);
      cr.setAttribute('width', Math.max(0, (nb.width + 20 * u) * clamp((t - tNoCut0) / (tNoCut1 - tNoCut0))));
      noKerf.setAttribute('fill', t >= tDrop ? '#000' : 'none');
      S.amber.style.opacity = smootherstep((t - tDrop) / 0.24).toFixed(3);
      nodes.forEach((nd, i) => nd.setAttribute('opacity', t >= T.forty - 0.04 + (T.later - T.forty - 0.02) * (i / 39) ? 1 : 0));
      figG.setAttribute('opacity', t >= T.vas + 0.05 ? 1 : 0);
      S.update(t);
    },
  };
}
