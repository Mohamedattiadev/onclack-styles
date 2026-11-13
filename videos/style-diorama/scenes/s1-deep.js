// 1 · EST, HI → descend — "October twenty-seventh, nineteen sixty-two. A Soviet submarine hides deep in the sea near Cuba."
// The model-maker's cross-section of the sea: card sky, cut Cuba hills, stacked wave strips, the card submarine low in the box.
// Camera: slow pedestal down + small dolly (parallax), focus racks from the surface to the submarine on "Soviet".
// Truth: RC (reconstruction, staged model). Key light upper-left everywhere.
import { glide, ease, progress } from '/onclack-styles/engine/lib/anim.js';
import { defs, makeCamera, grade, label, wt, sceneIn, boxFrame } from '../shared/kit.js';
import { buildSea } from '../shared/sea.js';

export default function (root, ctx) {
  const L = ctx.layout, W = ctx.width, H = ctx.height, u = L.unit, P = 's1';
  root.style.background = '#1b1916';
  const d = defs(root, P);
  const cam = makeCamera(root, W, H, '1 Camera world');
  const sY = H * L.pick({ landscape: 0.34, portrait: 0.3 });
  const sea = buildSea(cam, P, d, {
    u, surfaceY: sY, aspect: W / H, seed: 40,
    subX: W * L.pick({ landscape: 0.36, portrait: 0.14 }), subY: H * L.pick({ landscape: 0.72, portrait: 0.62 }),
    subLen: W * L.pick({ landscape: 0.46, portrait: 0.72 }), coastX1: W * L.pick({ landscape: 0.52, portrait: 0.7 }), floorY: 0.95,
  });
  boxFrame(cam, P, { u, p: 1.6, open: { x: -W * 0.01, y: -H * 0.03, w: W * 1.02, h: H * 1.06 } });

  const s = L.safe;
  const date = label(root, L, { name: '1 Tag: date', x: s.x, y: s.y, rot: -1.2, lines: [{ text: 'Caribbean Sea', kind: 'kicker' }, { text: '27 October 1962' }] });
  const cuba = label(root, L, { name: '1 Tag: Cuba', x: W * L.pick({ landscape: 0.37, portrait: 0.5 }), y: L.pick({ landscape: sY - H * 0.1, portrait: s.y + L.px(190) }), ax: L.pick({ landscape: 0, portrait: 0.5 }), ay: L.pick({ landscape: 1, portrait: 0 }), rot: 1.4, lines: [{ text: 'Cuba', size: 44 }] });
  const sub = label(root, L, {
    name: '1 Tag: submarine', x: L.pick({ landscape: s.x + s.w, portrait: s.x }), y: L.pick({ landscape: s.y + s.h, portrait: H * 0.73 }),
    ax: L.pick({ landscape: 1, portrait: 0 }), ay: L.pick({ landscape: 1, portrait: 0 }), rot: -0.8,
    lines: [{ text: 'Soviet submarine', kind: 'kicker' }, { text: 'B-59, hiding deep' }],
  });
  const g = grade(root, L, { vignette: 0, warm: 0.05 });

  const tSov = wt(ctx, 'Soviet', 0, 3.8), tSub = wt(ctx, 'submarine', 0, 4.3), tCuba = wt(ctx, 'Cuba.', 0, 6.5);
  return {
    update(t) {
      sceneIn(root, ctx, t);
      const rack = ease.inOutCubic(progress(t, tSov - 0.5, tSov + 0.2));
      const k = (a, b) => glide(t, 0, 3.6, a, b);
      cam.apply({
        unit: u,
        y: glide(t, 0, ctx.duration, -H * 0.07, H * 0.035),
        x: glide(t, 0, ctx.duration, -W * 0.015, W * 0.02),
        zoom: k(0.86, 0.97) * (1 + Math.max(0, t - 3.6) * 0.006),
        dolly: k(0, 0.15),
        focusP: 0.3 + rack * 0.6, blur: 6.5,
      });
      sea.update(t);
      date.update(t, 0.45);
      sub.update(t, tSub - 0.1);
      cuba.update(t, tCuba - 0.12);
      g.update(t + ctx.start);
    },
  };
}
