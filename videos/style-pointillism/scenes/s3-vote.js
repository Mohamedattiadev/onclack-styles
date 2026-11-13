// 3 · THE VOTE — macro on the warhead dabs, pull out: torpedo, then three pencil-reserved officers are painted in;
// two warm (vermilion/orange) halos bloom behind the two who say yes; the third keeps a cool rim.
// intent: KNOW firing needs three officers, two said yes · FEEL dread · SEE two warm halos, one figure without
// truth: RC (generic torpedo + figures, no faces) · VO (halo colour = vote). Accounts of the vote come from later memoirs and differ.
import { painter, wordT, glideT, F } from '../shared/dots.js';
import { roomGeometry, roomDabs, roomUnderdrawing } from '../shared/room.js';
import { frame, linenFor, caption, kickerStyle, capStyle, grade, INK } from '../shared/frame.js';

export default function (root, ctx) {
  const Fm = frame(ctx), { L, P, band, sp } = Fm;
  const W = L.width, H = L.height;
  const tNuc = wordT(ctx, 'nuclear', 0, 1.15), tThree = wordT(ctx, 'three', 0, 3.15), tOff = wordT(ctx, 'officers', 0, 3.55);
  const tTwo = wordT(ctx, 'two', 0, 4.95), tYes = wordT(ctx, 'yes', 0, 5.45);

  const G = roomGeometry(Fm);
  const D = roomDabs(Fm, G, { bg: [0.05, 1.35], torp: [0.05, 1.1], figs: [tThree - 0.1, tOff + 0.9], yes: [tTwo - 2 * F, tYes - 2 * F] });
  const linen = linenFor(ctx, Fm, 303, roomUnderdrawing(G));
  const pt = painter(root, ctx, { linen, name: '3A Dot painting · torpedo room', clip: Fm.clip });
  pt.set([...D.bg, ...D.tp, ...D.fg, ...D.halos]);

  const capW = L.pick({ landscape: band.w * 0.6, portrait: band.w });
  const k1 = caption(root, '3B Kicker', band.x, band.y, capW, 'On board B-59', kickerStyle(L, L.pick({ landscape: 26, portrait: 30 })), 0.3, L.portrait ? 99 : tThree - 0.4);
  const c1 = caption(root, '3B Caption', band.x, band.y + L.px(L.pick({ landscape: 38, portrait: 46 })), capW, 'One nuclear torpedo', capStyle(L, L.pick({ landscape: 56, portrait: 62 })), tNuc - 2 * F, tThree - 0.4);
  const ranks = ['Captain', 'Political officer', 'Chief of staff'];
  const colW = L.pick({ landscape: P.w * 0.26, portrait: P.w * 0.23 });
  const labels = G.figs.map((f, i) => {
    const x = Math.max(L.landscape ? band.x : L.safe.x, Math.min(f.fx - colW / 2, L.safe.x + L.safe.w - colW));
    // 9:16: a small linen label pinned on the canvas above each head · 16:9: columns in the band
    const y = L.landscape ? band.y : Math.min(...G.figs.map(g => g.head.cy - g.head.ry * 2)) - L.px(170);
    const plate = L.portrait ? { background: 'rgba(228,216,191,0.95)', padding: `${L.px(8)}px ${L.px(6)}px`, boxShadow: '0 1px 3px rgba(60,40,20,0.25)' } : {};
    const r = caption(root, `3C Officer ${i + 1} label`, x, y, colW, `<div>${i + 1}&nbsp;·&nbsp;${ranks[i]}</div>`, { ...kickerStyle(L, 24), color: INK.soft, textAlign: 'center', ...plate }, tOff - 2 * F + i * 3 * F);
    let v = null;
    if (i < 2) {
      const vn = document.createElement('div'); vn.dataset.name = `3C Officer ${i + 1} vote`; vn.textContent = 'YES';
      Object.assign(vn.style, { ...capStyle(L, L.pick({ landscape: 64, portrait: 60 })), fontWeight: 800, color: INK.accent, letterSpacing: '0.04em', textTransform: 'none', marginTop: L.px(10) + 'px' });
      r.node.appendChild(vn);
      const tv = [tTwo, tYes][i] - 2 * F;
      v = { update: t => { vn.style.opacity = Math.min(1, Math.max(0, (t - tv) / 0.2)).toFixed(3); } };
    }
    return [r, v];
  }).flat().filter(Boolean);
  // 9:16: the top placard follows the voice: torpedo → three must agree
  const c2 = L.portrait ? caption(root, '3B Caption 2', band.x, band.y + L.px(46), capW, 'Three must agree', capStyle(L, 62), tThree - 2 * F) : null;
  if (c2) labels.push(c2);
  if (L.portrait) { k1.node.dataset.keep = '1'; }
  const fade = grade(root, ctx);

  ctx.ambience('drips-wood-01', { from: 0, to: ctx.duration, lu: -21, fade: 0.5 });
  ctx.sfx('footsteps-metal-deck-01', tOff, { lu: -15 });
  ctx.sfx('breath-scared-01', tTwo - 0.5, { lu: -19 });

  const [nx, ny] = [G.T.xb - G.T.r * 0.5, G.T.y];
  const z0 = L.pick({ landscape: 3.4, portrait: 2.8 });
  return {
    update(t) {
      fade(t);
      const p = glideT(t, 0.2, 1.9, 0, 1);
      const z = (z0 + (1 - z0) * p) * (1 + Math.max(0, t - 1.9) * 0.005);
      pt.draw(t, { z, cx: nx + (W / 2 - nx) * p, cy: ny + (H / 2 - ny) * p });
      k1.update(t); c1.update(t); labels.forEach(l => l.update(t));
    },
  };
}
