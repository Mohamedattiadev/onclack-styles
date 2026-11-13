// Museum object label (screen space, never on a moving layer). Two cards: the place at the start, the person at the end.
// Card = a real thing placed on the plinth: it slides up 10 px and settles (enter token), leaves faster (exit token).
import { el, clamp } from '/onclack-styles/engine/lib/anim.js';

const enter = p => 1 - Math.pow(1 - clamp(p), 3.2), exit = p => Math.pow(clamp(p), 2.4);
const CARDS = [
  { id: 'L1', t0: 4.28, t1: 6.95, a: 'Submarine B-59, near Cuba', b: 'Fig. 1 · 27 October 1962' },
  { id: 'L4', t0: 23.3, t1: 99, a: 'Vasili Arkhipov, 1926–1998', b: 'Fig. 4 · his part widely known c. 2002' },
];

export function buildLabels(root, ctx) {
  const L = ctx.layout;
  const cards = CARDS.map(c => {
    const box = el('div', { class: 'vase-label', 'data-name': `Museum label ${c.id}` }, root);
    el('div', { class: 'vase-label-a' }, box, c.a);
    el('div', { class: 'vase-label-b' }, box, c.b);
    box.style.left = Math.round(L.safe.x) + 'px';
    box.style.bottom = Math.round(L.height - (L.safe.y + L.safe.h)) + 'px';
    box.style.fontSize = L.px(L.pick({ landscape: 50, portrait: 46 })) + 'px';
    return { ...c, box };
  });
  return {
    update(T) {
      for (const c of cards) {
        const pin = enter((T - c.t0) / 0.5), pout = exit((T - (c.t1 - 0.32)) / 0.32);
        const o = T < c.t0 || T > c.t1 ? 0 : pin * (1 - pout);
        c.box.style.opacity = o.toFixed(3);
        c.box.style.transform = `translate3d(0, ${((1 - pin) * 10 + pout * 6).toFixed(2)}px, 0)`;
        c.box.style.display = o > 0.001 ? '' : 'none';
      }
    },
  };
}
