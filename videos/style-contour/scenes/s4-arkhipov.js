// SCENE 4 overlay — "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// Same vote panel (continuous across the cut); then the panel leaves, the survey camera pulls out, the ink route
// runs to Havana and the running head rolls 1962 → 2002. The Havana label names the 2002 conference.
import { el } from '/onclack-styles/engine/lib/anim.js';
import { buildVote } from '../shared/vote.js';
import { C, P, wordAt, LEAD, enterP, makeCamera } from '../shared/contour.js';

export default function (root, ctx) {
  const L = ctx.layout, px = L.px;
  const update = buildVote(root, ctx);
  const cam = makeCamera(L, ctx.words);
  const wt = w => wordAt(ctx.words, w);
  const tH = wt('later') + 0.05;
  const hav = el('div', { class: 'ov', 'data-name': '4C Havana 2002 label', style: { textShadow: `0 0 ${px(6)}px ${C.bone}, 0 0 ${px(6)}px ${C.bone}` } }, root);
  hav.innerHTML = `<div class="kicker" style="font-size:${px(24)}px">Havana · October 2002</div>
    <div class="vote-sub" style="margin-top:${px(6)}px">40th-anniversary conference<br><span class="dim">his “no” becomes public</span></div>`;
  return {
    update(t, p, gt = ctx.start + t) {
      update(gt);
      const e = enterP(gt, tH, 16);
      const [x, y] = cam(gt).projectLL(P.havana);
      hav.style.opacity = e.toFixed(3);
      hav.style.display = e <= 0.002 ? 'none' : '';
      const hx = L.portrait ? x - px(40) : x + px(28), hy = L.portrait ? y + px(56) : y - hav.offsetHeight - px(20);
      hav.style.transform = `translate(${hx.toFixed(1)}px, ${(hy + (1 - e) * px(10)).toFixed(1)}px)`;
      void LEAD;
    },
  };
}
