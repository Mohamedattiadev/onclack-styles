// S3 · "On board: a nuclear torpedo. To fire it, three officers must agree. Two say yes."
// intent: KNOW the rule (3 must agree) and the count (2 yes) · FEEL dread rising · SEE two keys turning, the needle
// climbing toward red.  intensity 4/5
// 3A CU torpedo-tube switch row: tube 4's guarded switch carries a red-pencil "СПЕЦ." tape (the special weapon).
// 3B travel down (rack focus) → MS key panel: three locks, 3 tapes (roles) on "three officers";
//    THE NEEDLE: key 1 turns on "Two", key 2 on "yes" — the consent needle steps 0 → 1 → 2, one step short of red.
import { clamp, el, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { spring } from '/onclack-styles/engine/lib/spring.js';
import { PAL, NARROW, rig, panel, object, enamel, screw, tape, plateLabel, caption, grade, dust, rackIn, breathe, wl, glideKeys, fgPipe, rng } from '../shared/kit.js';
import { keyPanel } from '../shared/keypanel.js';

const TAU = Math.PI * 2;

function switchRow(cam, { x, y, seed, depth }) {
  const W = 1180, H = 420;
  const o = cam.add(object(cam.world, { x: x - W / 2, y: y - H / 2, w: W, h: H + 110, depth, name: '3A Tube switch row', res: 2 }));
  const cols = [0, 1, 2, 3].map(i => W * (0.16 + i * 0.227));
  o.layer(g => {
    g.save(); g.fillStyle = 'rgba(5,6,3,0.5)'; g.filter = 'blur(16px)'; g.fillRect(18, 26, W, H); g.restore();
    enamel(g, 0, 0, W, H, seed, { base: '#5d6250', rad: 16, wear: 1.6 });
    [[0.025, 0.06], [0.975, 0.06], [0.025, 0.94], [0.975, 0.94]].forEach(([u, v], i) => screw(g, W * u, H * v, 10, seed + i));
    plateLabel(g, W * 0.3, 18, W * 0.4, 46, 'ТОРПЕДНЫЕ АППАРАТЫ', seed + 3, { size: 0.55 });
    cols.forEach((cx, i) => {
      const cy = H * 0.5;
      plateLabel(g, cx - 62, cy - 120, 124, 40, `ТА-${i + 1}`, seed + 10 + i, { size: 0.6 });
      // toggle base: hex nut + boot
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.arc(cx + 5, cy + 8, 40, 0, TAU); g.fill();
      const ng = g.createLinearGradient(cx - 40, cy - 40, cx + 40, cy + 40); ng.addColorStop(0, '#cfcdc0'); ng.addColorStop(1, '#4a4943');
      g.fillStyle = ng; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; g.lineTo(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38); } g.closePath(); g.fill();
      g.fillStyle = '#26261f'; g.beginPath(); g.arc(cx, cy, 22, 0, TAU); g.fill();
      // bat handle pointing DOWN (off) — drawn foreshortened
      const hg = g.createLinearGradient(cx - 12, 0, cx + 12, 0); hg.addColorStop(0, '#6c6c64'); hg.addColorStop(0.4, '#e2e1d7'); hg.addColorStop(1, '#55554e');
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(cx - 7, cy + 4, 22, 104, 10); g.fill();
      g.fillStyle = hg; g.beginPath(); g.moveTo(cx - 8, cy); g.lineTo(cx - 12, cy + 92); g.quadraticCurveTo(cx, cy + 104, cx + 12, cy + 92); g.lineTo(cx + 8, cy); g.closePath(); g.fill();
      g.fillStyle = '#e1dac4'; g.font = `700 24px ${NARROW}`; g.textAlign = 'center'; g.fillText('ВКЛ', cx, cy - 60); g.fillText('ВЫКЛ', cx, cy + 136);
      if (i === 3) {
        // hinged red guard cover, closed over the switch (the special weapon tube)
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.roundRect(cx - 52, cy - 46, 112, 176, 12); g.fill();
        const rg = g.createLinearGradient(cx - 50, cy - 50, cx + 50, cy + 120); rg.addColorStop(0, '#b5372a'); rg.addColorStop(0.5, PAL.red); rg.addColorStop(1, '#5f140e');
        g.fillStyle = rg; g.beginPath(); g.roundRect(cx - 56, cy - 52, 112, 172, 12); g.fill();
        enamel(g, cx - 56, cy - 52, 112, 172, seed + 77, { base: 'rgba(0,0,0,0)', rad: 12, wear: 0.7, chips: true });
        g.fillStyle = '#2b2b25'; g.fillRect(cx - 60, cy - 60, 120, 14); // hinge
        for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(255,255,240,0.25)'; g.fillRect(cx - 58 + k * 24, cy - 58, 2, 10); }
        // lead seal wire across the cover
        g.strokeStyle = '#8f8d82'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx - 62, cy + 100); g.quadraticCurveTo(cx, cy + 140, cx + 62, cy + 96); g.stroke();
        g.fillStyle = '#7d7b72'; g.beginPath(); g.arc(cx + 4, cy + 120, 10, 0, TAU); g.fill();
      }
    });
    // red-pencil tape under tube 4: the special weapon
    tape(g, cols[3] - 130, H - 12, 260, 92, ['СПЕЦ.', 'special'], seed + 50, { rot: -0.03, size: 0.46, color: PAL.red });
    // plain tapes under tubes 1–3 (what an ordinary crew would write)
    ['53-39', '53-39', 'СЭТ-53'].forEach((s, i) => tape(g, cols[i] - 90, H - 4, 180, 60, [s], seed + 60 + i, { rot: (rng(seed + i)() - 0.5) * 0.08, size: 0.5 }));
  }, { name: '3A Switch row body' });
  return { o, cols, x0: x - W / 2, y0: y - H / 2, H };
}

export default function (root, ctx) {
  const L = ctx.layout, P = L.portrait;
  const cam = rig(root, ctx);
  panel(cam, { x: -500, y: -600, w: 3200, h: 3000, seed: 303, depth: 0.5, seams: [880], vseams: [1950], cables: [{ y: 2160, n: 3 }] });
  const SW = { x: 1000, y: 360 }, KP = { x: 1000, y: 1500 };
  const sw = switchRow(cam, { ...SW, seed: 310, depth: 0 });
  const kp = keyPanel(cam, { cx: KP.x, cy: KP.y, seed: 330, depth: 1 });

  const tNuclear = wl(ctx, 'nuclear', 0, 1.16), tFire = wl(ctx, 'fire', 0, 2.58), tThree = wl(ctx, 'three', 0, 3.19), tTwo = wl(ctx, 'two', 0, 4.97), tYes = wl(ctx, 'yes', 0, 5.48);
  const tK1 = tTwo - 2 / 30, tK2 = tYes - 2 / 30;
  ctx.sfx('drawer-close-01', tK1 + 0.1, { lu: -15 });   // lock cylinder clacks over (latch, metal-in-wood housing)
  ctx.sfx('door-close-01', tK2 + 0.1, { lu: -15 });
  ctx.sfx('cloth-jacket-01', tFire - 0.2, { lu: -24 }); // someone shifts in the cramped post

  const special = { x: sw.x0 + sw.cols[3], y: sw.y0 + sw.H * 0.62 };
  const capA = caption(root, ctx, { text: 'T-5 nuclear torpedo', sub: 'approx. 10 kilotons · sources vary', t0: tNuclear - 2 / 30, t1: tFire - 0.3, name: '3A Caption' });
  const capB = caption(root, ctx, { text: '3 officers must agree', sub: 'as later accounts tell it', t0: tThree - 2 / 30, t1: tTwo - 0.25, name: '3B Caption' });
  const pipe = fgPipe(root, ctx, { seed: 11, angle: 14, xFrac: -0.25, yFrac: 1.0, thick: 170, blur: 22 });
  const gr = grade(root, ctx, 3), du = dust(root, ctx, { seed: 7 });

  return {
    update(t) {
      rackIn(root, t, 0.5);
      // camera: CU on the red guard (push) → travel down to the key panel → settle wide enough for 3 locks + meter
      const kx = KP.x, ky = P ? KP.y - 60 : KP.y - 90;
      const sx0 = P ? special.x - 134 : special.x - 40, sy0 = P ? special.y + 180 : special.y;
      const x = glideKeys(t, [[0, 0, sx0, sx0], [tFire - 0.45, tFire + 0.85, sx0, kx]]);
      const y = glideKeys(t, [[0, 0, sy0, sy0], [tFire - 0.45, tFire + 0.85, sy0, ky]]);
      let size = glideKeys(t, [[0, 0, 700, 700], [tFire - 0.45, tFire + 0.85, 600, P ? 1160 : 1060]]);
      if (t < tFire - 0.45) size = 700 - 100 * smooth(t / (tFire - 0.45));
      size *= 1 - Math.max(0, t - tFire - 0.85) * 0.014;
      const f = glideKeys(t, [[0, 0, 0, 0], [tFire - 0.3, tFire + 0.8, 0, 1]]);
      const [bx, by, br] = breathe(t, 31);
      const k = cam.set({ x: x + bx, y: y + by, size, rot: br, f, dof: 7 });
      pipe(bx * 3, by * 3, k);

      // THE NEEDLE: keys turn (stiff spring, tiny overshoot), consent needle steps after each key
      const k1 = 90 * spring(t - tK1, { stiffness: 320, damping: 30 }), k2 = 90 * spring(t - tK2, { stiffness: 320, damping: 30 });
      const consent = spring(t - tK1 - 0.08, { stiffness: 120, damping: 15 }) + spring(t - tK2 - 0.08, { stiffness: 120, damping: 15 }) + noise1(t * 4, 3) * 0.008;
      kp.set(t, { k1, k2, consent, sway: Math.max(0, t - tK2) });

      capA(t); capB(t); gr(t); du(t);
    },
  };
}
const smooth = p => { p = clamp(p); return p * p * (3 - 2 * p); };
