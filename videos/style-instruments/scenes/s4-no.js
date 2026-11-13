// S4 · "The third, Vasili Arkhipov, says no. The world learned his name forty years later."
// intent: KNOW one man refused · FEEL held breath → relief · SEE the empty third slot and the needle FALLING to zero.
// intensity 5/5 → 2/5 (peak, then resolution)
// 4A ECU the empty third slot + its tape (hush: bed drops out, one close breath) → tilt up to the meter:
//    THE NEEDLE falls from 2 to 0 on "no" (heavy, damped).  4B slow pull back: the year drums roll 1962 → 2002.
import { clamp, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { spring } from '/onclack-styles/engine/lib/spring.js';
import { PAL, rig, panel, counter, caption, grade, dust, rackIn, breathe, wl, glideKeys, fgPipe } from '../shared/kit.js';
import { keyPanel } from '../shared/keypanel.js';

export default function (root, ctx) {
  const L = ctx.layout, P = L.portrait;
  const cam = rig(root, ctx);
  panel(cam, { x: -500, y: -600, w: 3400, h: 3200, seed: 303, depth: 0.5, seams: [880], vseams: [1950], cables: [{ y: 2160, n: 3 }] });
  const KP = { x: 1000, y: 1500 };
  const kp = keyPanel(cam, { cx: KP.x, cy: KP.y, seed: 330, depth: 0 });
  const YC = P ? { x: KP.x, y: KP.y + 790 } : { x: KP.x + 900, y: KP.y - 60 };
  const yc = counter(cam.world, { ...YC, digits: 4, dw: 74, dh: 112, seed: 410, depth: 0.15, name: '4B Year counter', label: 'ГОД  ·  YEAR', tapeText: ['имя узнали', 'name known'] });
  cam.add(yc.obj);

  const tThird = wl(ctx, 'third', 0, 0.51), tVas = wl(ctx, 'vasili', 0, 0.87), tNo = wl(ctx, 'no', 0, 2.29), tWorld = wl(ctx, 'world', 0, 3.33), tForty = wl(ctx, 'forty', 0, 4.39);
  ctx.sfx('breath-close-01', Math.max(0, tThird - 0.55), { lu: -22 });   // the held breath in the hush before the name
  ctx.sfx('cloth-jacket-01', tNo + 0.75, { lu: -25 });

  const capA = caption(root, ctx, { text: 'Vasili Arkhipov', sub: 'flotilla chief of staff, aboard B-59', t0: tVas - 2 / 30, t1: tWorld - 0.3, at: P ? 'top' : 'low', name: '4A Caption name' });
  const capB = caption(root, ctx, { text: 'Widely known from 2002', sub: 'Havana conference, 40th anniversary', t0: tForty + 0.5, t1: 99, at: P ? 'top' : 'low', name: '4B Caption 2002' });
  const pipe = fgPipe(root, ctx, { seed: 11, angle: 14, xFrac: -0.25, yFrac: 1.0, thick: 170, blur: 22 });
  const gr = grade(root, ctx, 4), du = dust(root, ctx, { seed: 9 });

  const s3 = kp.locks[2], m = kp.meter;
  return {
    update(t) {
      rackIn(root, t, 0.5);
      // camera: ECU slot 3 → tilt to the meter (arrive before "no") → slow pull to the whole panel + year drums
      const wideX = P ? KP.x : (KP.x + YC.x) / 2 - 40, wideY = P ? KP.y + 300 : KP.y - 60;
      const x = glideKeys(t, [[0, 0, s3.x, s3.x], [tNo - 0.95, tNo - 0.12, s3.x, P ? m.x : m.x + 180], [tWorld - 0.2, tForty + 0.6, P ? m.x : m.x + 180, wideX]]);
      const y = glideKeys(t, [[0, 0, s3.y + 70, s3.y + 70], [tNo - 0.95, tNo - 0.12, s3.y + 70, P ? m.y + 300 : m.y + 40], [tWorld - 0.2, tForty + 0.6, P ? m.y + 300 : m.y + 40, wideY]]);
      let size = glideKeys(t, [[0, 0, 640, 640], [tNo - 0.95, tNo - 0.12, 600, P ? 880 : 720], [tWorld - 0.2, tForty + 0.6, P ? 880 : 720, P ? 1550 : 1250]]);
      if (t < tNo - 0.95) size = 640 - 40 * clamp(t / (tNo - 0.95));
      const f = glideKeys(t, [[0, 0, 0, 0], [tWorld - 0.2, tForty + 0.6, 0, 0.1]]);
      const [bx, by, br] = breathe(t, 41, 0.8);
      const k = cam.set({ x: x + bx, y: y + by, size, rot: br, f, dof: 7 });
      pipe(bx * 3, by * 3, k);

      // THE NEEDLE falls: 2 → 0 on "no", heavy and damped, a small rebound off the stop pin
      const fall = spring(t - (tNo - 1 / 30), { stiffness: 70, damping: 9 });
      let consent = 2 - 2 * fall; if (consent < 0) consent = -consent * 0.35; // bounces off the zero stop
      kp.set(t, { k1: 90, k2: 90, consent: consent + noise1(t * 4, 3) * 0.006, sway: 3 + t });
      // year drums roll 1962 → 2002 on "forty years later"
      const roll = spring(t - (tForty - 0.15), { stiffness: 34, damping: 11.7 });
      yc.set(roll > 0.997 ? 2002 : 1962 + 40 * clamp(roll, 0, 1));

      capA(t); capB(t); gr(t); du(t);
    },
  };
}
