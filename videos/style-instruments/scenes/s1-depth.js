// S1 · "October 27th, 1962. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW date + place · FEEL quiet unease · SEE the depth needle sinking.  intensity 2/5
// 1A ECU bakelite clock + dated tape (EV-style detail, RC object) → camera travels right (rack focus) →
// 1B MCU depth gauge, needle sinks on "deep" → 1C tilt down: position counter rolls on "Cuba" (labelled approx.).
import { clamp, el, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { spring, springs } from '/onclack-styles/engine/lib/spring.js';
import { PAL, NARROW, rig, panel, gauge, object, enamel, screw, bezel, dialFace, glass, tape, needlePainter, hubPainter,
  counter, caption, grade, dust, rackIn, breathe, wl, glideKeys, fgPipe, rng } from '../shared/kit.js';

function clock(cam, { x, y, size, seed, depth }) {
  const S = size, pad = S * 0.1, W = S + pad * 2, cx = W / 2, cy = W / 2, R = S * 0.4;
  const o = cam.add(object(cam.world, { x: x - W / 2, y: y - W / 2, w: W, h: W + S * 0.3, depth, name: '1A Bakelite clock', res: 2.2 }));
  o.layer(g => {
    // bakelite case: round, moulded, with mounting lugs
    g.save(); g.fillStyle = 'rgba(5,6,3,0.5)'; g.filter = `blur(${S * 0.035}px)`; g.beginPath(); g.arc(cx + S * 0.03, cy + S * 0.05, S * 0.5, 0, 7); g.fill(); g.restore();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], i) => {
      const lx = cx + sx * S * 0.4, ly = cy + sy * S * 0.4;
      g.fillStyle = PAL.bakelite; g.beginPath(); g.arc(lx, ly, S * 0.07, 0, 7); g.fill();
      screw(g, lx, ly, S * 0.03, seed + i);
    });
    const cg = g.createRadialGradient(cx - S * 0.18, cy - S * 0.2, S * 0.05, cx, cy, S * 0.5);
    cg.addColorStop(0, '#45423a'); cg.addColorStop(0.6, '#1f1e19'); cg.addColorStop(1, '#0d0d0a');
    g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, S * 0.5, 0, 7); g.fill();
    // moulding swirl marks (bakelite flow lines), fixed
    const r = rng(seed);
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,240,210,${0.02 + r() * 0.03})`; g.lineWidth = 0.7; g.beginPath(); g.arc(cx, cy, S * (0.43 + r() * 0.06), r() * 7, r() * 7 + 0.6); g.stroke(); }
    bezel(g, cx, cy, R, S * 0.035, 'black', seed);
    dialFace(g, cx, cy, R, seed, { color: '#e8dfc5' });
    // minute track + hour numerals + inner 13–24
    g.strokeStyle = PAL.ink; g.fillStyle = PAL.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let m = 0; m < 60; m++) {
      const a = (m / 60) * Math.PI * 2 - Math.PI / 2, big = m % 5 === 0;
      g.lineWidth = big ? R * 0.03 : R * 0.01;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * R * (big ? 0.82 : 0.88), cy + Math.sin(a) * R * (big ? 0.82 : 0.88)); g.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); g.stroke();
    }
    for (let hr = 1; hr <= 12; hr++) {
      const a = (hr / 12) * Math.PI * 2 - Math.PI / 2;
      g.font = `700 ${R * 0.2}px ${NARROW}`; g.fillText(String(hr), cx + Math.cos(a) * R * 0.66, cy + Math.sin(a) * R * 0.66 + R * 0.01);
      g.font = `400 ${R * 0.08}px ${NARROW}`; g.fillText(String(hr + 12), cx + Math.cos(a) * R * 0.47, cy + Math.sin(a) * R * 0.47);
    }
    g.font = `700 ${R * 0.075}px ${NARROW}`; g.letterSpacing = `${R * 0.01}px`; g.fillText('СУДОВЫЕ ЧАСЫ', cx, cy - R * 0.28); g.letterSpacing = '0px';
    g.font = `400 ${R * 0.06}px ${NARROW}`; g.fillText('№ 2318', cx, cy + R * 0.3);
    // dated tape stuck under the clock: Cyrillic date, as a crewman might write it
    tape(g, cx - S * 0.36, W - pad * 0.2, S * 0.72, S * 0.2, ['27 окт. 1962'], seed, { rot: -0.035, size: 0.62 });
  }, { name: '1A Clock body' });
  // three different hand shapes (spade hour, lance minute, thin seconds with round counterweight)
  const spade = len => (g, pw, ph) => { const c = pw / 2, m = ph / 2; g.fillStyle = PAL.ink; g.beginPath(); g.moveTo(c - len * 0.05, m + len * 0.15); g.lineTo(c - len * 0.04, m - len * 0.6); g.quadraticCurveTo(c - len * 0.16, m - len * 0.75, c, m - len); g.quadraticCurveTo(c + len * 0.16, m - len * 0.75, c + len * 0.04, m - len * 0.6); g.lineTo(c + len * 0.05, m + len * 0.15); g.closePath(); g.fill(); };
  const lance = len => (g, pw, ph) => { const c = pw / 2, m = ph / 2; g.fillStyle = PAL.ink; g.beginPath(); g.moveTo(c - len * 0.035, m + len * 0.14); g.lineTo(c - len * 0.03, m - len * 0.82); g.lineTo(c, m - len); g.lineTo(c + len * 0.03, m - len * 0.82); g.lineTo(c + len * 0.035, m + len * 0.14); g.closePath(); g.fill(); };
  const thin = len => (g, pw, ph) => { const c = pw / 2, m = ph / 2; g.fillStyle = PAL.ink; g.fillRect(c - len * 0.006, m - len, len * 0.012, len * 1.25); g.beginPath(); g.arc(c, m + len * 0.2, len * 0.045, 0, 7); g.fill(); };
  const hour = o.part(R * 1.2, R * 1.2, R * 0.6, R * 0.6, cx, cy, spade(R * 0.5), { shadow: R * 0.05, name: '1A Hour hand' });
  const min = o.part(R * 1.9, R * 1.9, R * 0.95, R * 0.95, cx, cy, lance(R * 0.8), { shadow: R * 0.06, name: '1A Minute hand' });
  const sec = o.part(R * 2, R * 2, R * 1, R * 1, cx, cy, thin(R * 0.86), { shadow: R * 0.07, name: '1A Second hand' });
  o.part(R * 0.2, R * 0.2, R * 0.1, R * 0.1, cx, cy, hubPainter(R * 0.045, 'black'));
  o.layer(g => glass(g, cx, cy, R, seed), { name: '1A Clock glass', lowres: true });
  return { o, hour, min, sec };
}

export default function (root, ctx) {
  const L = ctx.layout;
  const cam = rig(root, ctx);
  const P = L.portrait;
  panel(cam, { x: -400, y: -300, w: 3000, h: 2200, seed: 101, depth: 0.55, seams: [180, 1560], vseams: [1040 + 400], cables: [{ y: 1700, n: 4 }] });

  const CK = { x: 620, y: 620 }, DG = { x: 1440, y: 700 }, PC = P ? { x: 1440, y: 1240 } : { x: 2010, y: 820 };
  const ck = clock(cam, { ...CK, size: 520, seed: 12, depth: 0 });
  const dg = gauge(cam.world, { x: DG.x, y: DG.y, size: 640, seed: 21, depth: 1, name: '1B Depth gauge', min: 0, max: 400, a0: -135, a1: 135, major: 50, minor: 10, red: [300, 400], title: 'ГЛУБИНА', unit: 'м', serial: 'МАНОМЕТР · № 0471', bezel: 'brass' });
  cam.add(dg.obj);
  const pc = counter(cam.world, { ...PC, digits: 2, dw: 66, dh: 100, seed: 31, depth: 1.15, name: '1C Latitude counter', label: 'ШИРОТА  N', tapeText: ['прибл. / approx.'] });
  cam.add(pc.obj);
  // a small second instrument at the left edge for context (no job but place: a control-room wall)
  const side = gauge(cam.world, { x: 160, y: 1240, size: 360, seed: 41, depth: -0.4, name: '1 Side gauge', min: 0, max: 10, a0: -120, a1: 120, major: 2, minor: 0.5, title: 'ДАВЛ.', unit: 'кгс/см²', bezel: 'black' });
  cam.add(side.obj);

  const tDate = wl(ctx, 'october', 0, 0.58), tA = wl(ctx, 'a', 0, 3.62), tDeep = wl(ctx, 'deep', 0, 5.42), tCuba = wl(ctx, 'cuba', 0, 6.52);
  const pipe = fgPipe(root, ctx, { seed: 7, angle: -30, xFrac: 1.12, yFrac: 0.98, thick: 210, blur: 22 });
  const capA = caption(root, ctx, { text: '27 October 1962', t0: tDate - 2 / 30, t1: tA - 0.3, name: '1A Caption date' });
  const capB = caption(root, ctx, { text: 'Soviet submarine B-59', sub: 'near Cuba (position approx.)', t0: wl(ctx, 'soviet', 0, 3.79) - 2 / 30, t1: 99, name: '1C Caption place' });
  const gr = grade(root, ctx, 1), du = dust(root, ctx, { seed: 3 });

  // sound: hull water bed for the whole beat until the hush before the reveal (scene-local times, global span)
  const tHush = 19.2 - ctx.start;
  ctx.ambience('sea-water-close-01', { from: 0, to: tHush, lu: -15, fade: 0.6 });
  ctx.ambience('sea-water-close-01', { from: 22.45 - ctx.start, to: 26.4 - ctx.start, lu: -19, fade: 1.2 });
  ctx.sfx('footsteps-metal-deck-01', 1.7, { lu: -24 });
  ctx.sfx('door-creak-01', tDeep - 0.25, { lu: -21 });      // hull groans as she goes deeper

  return {
    update(t) {
      rackIn(root, t, 0.6);
      // camera: ECU clock+tape → travel to depth gauge (rack focus) → tilt down to the counter
      const cX = P ? DG.x : (DG.x + PC.x) / 2 - 20, cY = P ? (DG.y + PC.y) / 2 + 40 : DG.y + 60;
      const x = glideKeys(t, [[0, 0, CK.x, CK.x], [tA - 0.35, tA + 1.05, CK.x, DG.x], [tCuba - 1.1, tCuba + 0.1, DG.x, cX]]);
      const y = glideKeys(t, [[0, 0, CK.y + 150, CK.y + 150], [tA - 0.35, tA + 1.05, CK.y + 150, DG.y + 10], [tCuba - 1.1, tCuba + 0.1, DG.y + 10, cY]]);
      let size = glideKeys(t, [[0, 0, 600, 600], [tA - 0.35, tA + 1.05, 580, 780], [tCuba - 1.1, tCuba + 0.1, 780, P ? 1000 : 900]]);
      size *= 1 - Math.min(t, tA) * 0.012; // creep in on the clock
      const f = glideKeys(t, [[0, 0, 0, 0], [tA - 0.1, tA + 1.0, 0, 1], [tCuba - 0.8, tCuba + 0.1, 1, 1.07]]);
      const [bx, by, br] = breathe(t, 11);
      const k = cam.set({ x: x + bx, y: y + by, size, rot: br, f, dof: 7 });
      pipe(bx * 3, by * 3, k);

      // clock: arbitrary time (no claim), second hand ticks once per second with a small settle
      const secs = 52 * 60 + 14 + t, whole = Math.floor(secs), frac = secs - whole;
      const tick = whole + Math.min(1, spring(frac, { stiffness: 900, damping: 38 }));
      ck.sec(tick * 6); ck.min((secs / 60) * 6); ck.hour((4 + secs / 3600) * 30);

      // THE NEEDLE: sinks as she goes down, lands on "deep", then trembles (pressure ripple)
      const sink = spring(t - (tDeep - 1.1), { stiffness: 14, damping: 7.2 });
      const depth = 35 + 135 * sink + noise1(t * 3.1, 2) * 1.6 + noise1(t * 11, 5) * 0.6;
      dg.set(depth);
      side.set(3.2 + noise1(t * 0.8, 9) * 0.08);
      // counter rolls to 23 (approx.) as the voice says "Cuba"
      const roll = spring(t - (tCuba - 0.35), { stiffness: 40, damping: 12 });
      pc.set(9 + 14 * clamp(roll, 0, 1.01));

      capA(t); capB(t); gr(t); du(t);
    },
  };
}
