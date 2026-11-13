// The canvas as an object: painted rectangle P on raw linen, graphite squaring grid, gallery-quiet type in the margin.
import { el } from '/onclack-styles/engine/lib/anim.js';
import { makeLinen, GRAPHITE, clamp01, smooth } from './dots.js';

export const INK = { text: '#2B2620', soft: '#5E5A55', accent: '#C2361F' };
export const FONT = { sans: "'Schibsted Grotesk', sans-serif" };

/** painted area + caption band, designed per orientation (not a crop) */
export function frame(ctx) {
  const L = ctx.layout, s = L.safe;
  const P = L.pick({
    landscape: { x: s.x, y: s.y, w: s.w, h: Math.round(s.h * 0.8) },
    portrait: { x: Math.round(L.width * 0.06), y: s.y + L.px(236), w: Math.round(L.width * 0.88), h: Math.round(L.height * 0.775) - (s.y + L.px(236)) },
  });
  // 16:9: type in a band under the painting · 9:16: type on top, like a placard above the canvas
  const band = L.landscape ? { x: s.x, y: P.y + P.h + L.px(26), w: s.w } : { x: s.x, y: s.y + L.px(6), w: s.w };
  band.h = L.landscape ? s.y + s.h - band.y : P.y - band.y;
  const foot = { x: s.x, y: P.y + P.h + L.px(14), w: s.w }; // one small line under the painting (9:16)
  const top = L.portrait ? { x: s.x, y: s.y + L.px(20), w: s.w } : null;
  const sp = L.px(L.pick({ landscape: 12, portrait: 13 }));
  // 9:16: the camera moves inside the canvas window, so the placard above stays clean
  const clip = { x: P.x - sp * 2.5, y: P.y - sp * 2.5, w: P.w + sp * 5, h: P.h + sp * 5 };
  return { L, P, band, top, foot, sp, clip };
}

export function linenFor(ctx, Fm, seed, under) {
  const { L, P } = Fm;
  const c = makeLinen(L.width, L.height, seed, { x: P.x, y: P.y, w: P.w, h: P.h, cols: L.pick({ landscape: 8, portrait: 5 }), rows: L.pick({ landscape: 4, portrait: 6 }), lw: Math.max(1.4, L.px(1.6)) });
  if (under) { // graphite underdrawing, covered later by dabs
    const g = c.getContext('2d');
    g.strokeStyle = GRAPHITE; g.lineWidth = Math.max(1.5, L.px(2)); g.lineJoin = 'round'; g.globalAlpha = 0.5;
    under(g);
    g.globalAlpha = 1;
  }
  return c;
}

/** caption block in the margin (DOM). returns { node, update(t) } */
export function caption(root, name, x, y, w, html, style, tIn, tOut = Infinity) {
  const node = el('div', { 'data-name': name, style: { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', fontFamily: FONT.sans, color: INK.text, fontKerning: 'normal', ...style } }, root);
  node.innerHTML = html;
  return {
    node,
    update(t) {
      const a = clamp01((t - tIn) / 0.35) * (1 - clamp01((t - tOut) / 0.25));
      node.style.opacity = a.toFixed(3);
      node.style.transform = `translateY(${((1 - smooth((t - tIn) / 0.5)) * 10).toFixed(2)}px)`;
    },
  };
}
export const kickerStyle = (L, size = 26) => ({ fontSize: L.px(size) + 'px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK.accent, lineHeight: 1.1 });
export const capStyle = (L, size) => ({ fontSize: L.px(size) + 'px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.08 });

/** soft warm vignette + scene fade-in (crossfade over the previous scene) */
export function grade(root, ctx) {
  el('div', { 'data-name': 'Grade vignette', style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 75% 70% at 50% 46%, rgba(0,0,0,0) 60%, rgba(70,50,25,0.16) 100%)' } }, root);
  return t => { root.style.opacity = clamp01(t / 0.4).toFixed(3); };
}
