// One "sheet" per scene: rice paper + ink SVG in world space (moves with the camera), labels in screen space.
import { el, svg } from '/onclack-styles/engine/lib/anim.js';
import { paper, inkDefs } from './ink.js';

export function makeSheet(root, ctx, prefix, paperSeed = 11) {
  const L = ctx.layout, W = ctx.width, H = ctx.height;
  root.style.background = '#F2EEE5';
  const world = el('div', { 'data-name': 'Sheet (world)', style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', transformOrigin: '0 0' } }, root);
  paper(world, W, H, { seed: paperSeed });
  const ink = svg('svg', { 'data-name': 'Ink', width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;left:0;top:0;overflow:visible;mix-blend-mode:multiply' }, world);
  const F = inkDefs(ink, prefix, L);
  const layer = name => svg('g', { 'data-name': name }, ink);
  const text = el('div', { 'data-name': 'Type (screen space)', style: { position: 'absolute', inset: 0 } }, root);
  let cam = { F: [W / 2, H / 2], T: [W / 2, H / 2], s: 1 };
  return {
    L, W, H, world, ink, F, layer, text,
    /** camera: world point F appears at screen point T, scale s (s ≥ 1 so the paper always covers). */
    camera(Fp, Tp, s) {
      cam = { F: Fp, T: Tp, s };
      world.style.transform = `translate(${(Tp[0] - Fp[0] * s).toFixed(2)}px, ${(Tp[1] - Fp[1] * s).toFixed(2)}px) scale(${s.toFixed(5)})`;
    },
    toScreen: ([x, y]) => [(x - cam.F[0]) * cam.s + cam.T[0], (y - cam.F[1]) * cam.s + cam.T[1]],
  };
}
