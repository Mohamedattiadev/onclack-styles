// S2 · "Above it, American ships drop practice depth charges. Moscow has been silent for days."
// intent: KNOW they are hunted and cut off · FEEL pressure · SEE the scope contacts + the shock through the panel.  intensity 3→4/5
// 2A MCU sonar scope (matte phosphor): three contacts swept in on "ships"; depth charges = panel jolts, dust, needle jumps.
// 2B travel right (rack focus) → CU radio signal meter: needle dead at zero under a "МОСКВА / MOSCOW" tape; the
//    temperature dial beside it creeps into the red.  Truth: RC instruments, VO meaning (no real B-59 readings exist here).
import { clamp, el, noise1, rand } from '/onclack-styles/engine/lib/anim.js';
import { spring } from '/onclack-styles/engine/lib/spring.js';
import { PAL, NARROW, rig, panel, gauge, object, enamel, screw, bezel, glass, tape, plateLabel, needlePainter, hubPainter,
  scale, dialFace, caption, grade, dust, rackIn, breathe, impact, wl, glideKeys, fgPipe, mkCanvas, rng } from '../shared/kit.js';

function knob(g, x, y, r, seed) {
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.arc(x + r * 0.15, y + r * 0.25, r * 1.05, 0, Math.PI * 2); g.fill();
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, '#4b4840'); gr.addColorStop(1, '#0e0e0b');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; g.strokeStyle = 'rgba(255,255,240,0.08)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
  const a = -2.2 + rng(seed)() * 1.2; g.strokeStyle = '#d8d1bb'; g.lineWidth = r * 0.1;
  g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35); g.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85); g.stroke();
}

function scope(cam, { x, y, size, seed, depth }) {
  const W = size * 1.25, H = size * 1.55, cx = W / 2, cy = size * 0.66, R = size * 0.4;
  const o = cam.add(object(cam.world, { x: x - cx, y: y - cy, w: W, h: H, depth, name: '2A Sonar scope', res: 2 }));
  o.layer(g => {
    g.save(); g.fillStyle = 'rgba(5,6,3,0.5)'; g.filter = `blur(${size * 0.03}px)`; g.fillRect(size * 0.03, size * 0.05, W, H); g.restore();
    enamel(g, 0, 0, W, H, seed, { base: PAL.enamelLt, rad: size * 0.035, wear: 1.4 });
    [[0.05, 0.04], [0.95, 0.04], [0.05, 0.97], [0.95, 0.97]].forEach(([u, v], i) => screw(g, W * u, H * v, size * 0.018, seed + i));
    // moulded rubber hood around the tube
    const hg = g.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.9, cx, cy, R * 1.3);
    hg.addColorStop(0, '#2a2a24'); hg.addColorStop(1, '#0b0b09');
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.arc(cx + R * 0.05, cy + R * 0.08, R * 1.27, 0, Math.PI * 2); g.fill();
    g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, R * 1.24, 0, Math.PI * 2); g.fill();
    // bearing ring (cream engraving on black)
    g.fillStyle = '#c9c2ab'; g.strokeStyle = '#c9c2ab'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let d = 0; d < 360; d += 5) {
      const a = (d - 90) * Math.PI / 180, big = d % 30 === 0;
      g.lineWidth = big ? 2.2 : 1; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 1.03, cy + Math.sin(a) * R * 1.03); g.lineTo(cx + Math.cos(a) * R * (big ? 1.09 : 1.06), cy + Math.sin(a) * R * (big ? 1.09 : 1.06)); g.stroke();
      if (big) { g.font = `700 ${R * 0.075}px ${NARROW}`; g.fillText(String(d / 10).padStart(2, '0'), cx + Math.cos(a) * R * 1.16, cy + Math.sin(a) * R * 1.16); }
    }
    // tube face: matte, slightly convex (darker rim), never glowing
    const fg = g.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.05, cx, cy, R);
    fg.addColorStop(0, '#2b3328'); fg.addColorStop(0.7, PAL.phosphorBg); fg.addColorStop(1, '#0f120e');
    g.fillStyle = fg; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    // engraved graticule on the filter glass
    g.strokeStyle = 'rgba(160,175,140,0.28)'; g.lineWidth = 1.1;
    for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(cx, cy, R * k / 4.2, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    // controls
    const ky = cy + R * 1.62;
    [[0.27, 'ЯРКОСТЬ'], [0.5, 'УСИЛЕНИЕ'], [0.73, 'ДАЛЬНОСТЬ']].forEach(([u, lab], i) => {
      knob(g, W * u, ky, size * 0.06, seed + i * 3);
      plateLabel(g, W * u - size * 0.11, ky + size * 0.085, size * 0.22, size * 0.055, lab, seed + i, { size: 0.55 });
    });
    plateLabel(g, cx - size * 0.3, size * 0.035, size * 0.6, size * 0.07, 'ГИДРОАКУСТИКА', seed + 9, { size: 0.55 });
  }, { name: '2A Scope body' });
  // dynamic phosphor layer (pure function of t)
  const D = mkCanvas(R * 2, R * 2, 2);
  Object.assign(D.c.style, { position: 'absolute', left: (cx - R) + 'px', top: (cy - R) + 'px', width: R * 2 + 'px', height: R * 2 + 'px', borderRadius: '50%' });
  D.c.dataset.name = '2A Scope picture';
  o.root.appendChild(D.c);
  o.layer(g => glass(g, cx, cy, R, seed), { name: '2A Scope glass', lowres: true });
  return { o, D, R };
}

export default function (root, ctx) {
  const L = ctx.layout, P = L.portrait;
  const cam = rig(root, ctx);
  panel(cam, { x: -500, y: -300, w: 3400, h: 2200, seed: 202, depth: 0.5, seams: [150], vseams: [1320], cables: [{ y: 1620, n: 3 }] });

  const SC = { x: 900, y: 660 }, RM = P ? { x: 1720, y: 980 } : { x: 1760, y: 820 }, TG = P ? { x: 1720, y: 1460 } : { x: 2330, y: 860 };
  const sc = scope(cam, { ...SC, size: 640, seed: 33, depth: 0 });
  const dg = gauge(cam.world, { x: 1500, y: 300, size: 300, seed: 21, depth: 0.5, name: '2A Depth gauge', min: 0, max: 400, a0: -135, a1: 135, major: 100, minor: 20, red: [300, 400], title: 'ГЛУБИНА', unit: 'м', bezel: 'brass' });
  cam.add(dg.obj);
  const tg = gauge(cam.world, { x: TG.x, y: TG.y, size: 400, seed: 52, depth: 1.25, name: '2B Temperature dial', min: 0, max: 70, a0: -130, a1: 130, major: 10, minor: 2, red: [45, 70], title: 'ТЕМП.', unit: '°C', bezel: 'black', tapeText: ['жарко!'] });
  cam.add(tg.obj);

  // radio signal meter: rectangular window meter, pivot below the scale
  const mW = 560, mH = 470;
  const rm = cam.add(object(cam.world, { x: RM.x - mW / 2, y: RM.y - mH / 2, w: mW, h: mH + 120, depth: 1, name: '2B Radio signal meter', res: 2.2 }));
  const pvx = mW / 2, pvy = mH * 0.8, MR = mW * 0.5;
  rm.layer(g => {
    g.save(); g.fillStyle = 'rgba(5,6,3,0.5)'; g.filter = 'blur(14px)'; g.fillRect(16, 26, mW, mH); g.restore();
    enamel(g, 0, 0, mW, mH, 61, { base: PAL.enamelLt, rad: 18, wear: 1.3 });
    [[0.06, 0.07], [0.94, 0.07], [0.06, 0.93], [0.94, 0.93]].forEach(([u, v], i) => screw(g, mW * u, mH * v, 10, 61 + i));
    const wx = mW * 0.1, wy = mH * 0.13, ww = mW * 0.8, wh = mH * 0.62;
    g.fillStyle = '#0d0d0a'; g.fillRect(wx - 8, wy - 8, ww + 16, wh + 16);
    g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    g.fillStyle = PAL.cream; g.fillRect(wx, wy, ww, wh);
    dialFace(g, pvx, wy + wh * 0.5, ww * 0.75, 64);
    scale(g, pvx, pvy, MR, { a0: -48, a1: 48, min: 0, max: 10, major: 2, minor: 0.5, red: undefined, font: 1.1 });
    g.fillStyle = PAL.ink; g.font = `700 ${MR * 0.12}px ${NARROW}`; g.textAlign = 'center'; g.letterSpacing = '2px'; g.fillText('СИГНАЛ', pvx, pvy - MR * 0.28); g.letterSpacing = '0px';
    const sh = g.createLinearGradient(0, wy, 0, wy + wh * 0.3); sh.addColorStop(0, 'rgba(60,50,30,0.35)'); sh.addColorStop(1, 'rgba(60,50,30,0)');
    g.fillStyle = sh; g.fillRect(wx, wy, ww, wh);
    g.restore();
    plateLabel(g, mW * 0.28, mH * 0.8, mW * 0.44, mH * 0.09, 'ПРИЁМНИК КВ', 66, { size: 0.55 });
    tape(g, mW * 0.16, mH + 8, mW * 0.68, 104, ['МОСКВА', 'Moscow'], 68, { rot: 0.025, size: 0.46 });
  }, { name: '2B Meter body' });
  const setM = rm.part(MR * 2.1, MR * 2.1, MR * 1.05, MR * 1.05, pvx, pvy, needlePainter(MR * 0.93, { width: 0.03, tail: 0.0 }), { shadow: 6, name: '2B Meter needle' });
  { // the pivot sits below the window edge, as on real panel meters: clip the needle to the window
    const wx = mW * 0.1, wy = mH * 0.13, ww = mW * 0.8, wh = mH * 0.62;
    const clip = el('div', { style: { position: 'absolute', left: wx + 'px', top: wy + 'px', width: ww + 'px', height: wh + 'px', overflow: 'hidden' } }, rm.root);
    for (const c of [...rm.root.querySelectorAll('canvas')].slice(-2)) { c.style.left = (parseFloat(c.style.left) - wx) + 'px'; c.style.top = (parseFloat(c.style.top) - wy) + 'px'; clip.appendChild(c); }
  }
  rm.layer(g => {
    g.save(); g.beginPath(); g.rect(mW * 0.1, mH * 0.13, mW * 0.8, mH * 0.62); g.clip();
    const rg = g.createLinearGradient(mW * 0.1, mH * 0.13, mW * 0.5, mH * 0.6);
    rg.addColorStop(0, 'rgba(255,252,240,0.16)'); rg.addColorStop(0.4, 'rgba(255,252,240,0.03)'); rg.addColorStop(1, 'rgba(255,252,240,0)');
    g.fillStyle = rg; g.fillRect(0, 0, mW, mH); g.restore();
  }, { name: '2B Meter glass', lowres: true });

  // timing from the voice
  const tShips = wl(ctx, 'ships', 0, 1.42), tCharges = wl(ctx, 'charges', 0, 2.84), tMoscow = wl(ctx, 'moscow', 0, 3.74), tSilent = wl(ctx, 'silent', 0, 4.72), tDays = wl(ctx, 'days', 0, 5.28);
  const hits = [[tCharges + 1 / 30, 1], [tCharges + 0.62, 0.7], [tDays + 0.62, 0.35]];
  ctx.sfx('boom-distant-01', hits[0][0], { lu: -9 });
  ctx.sfx('boom-slapback-01', hits[1][0], { lu: -14 });
  ctx.sfx('boom-distant-01', hits[2][0], { lu: -19 });
  ctx.sfx('drips-wood-01', tSilent + 0.3, { lu: -24 });

  const capA = caption(root, ctx, { text: 'US Navy practice depth charges', sub: 'signals to surface', t0: tCharges - 0.4, t1: tMoscow - 0.35, name: '2A Caption' });
  const pipe = fgPipe(root, ctx, { seed: 9, angle: 22, xFrac: -0.15, yFrac: 0.95, thick: 200, blur: 22 });
  const gr = grade(root, ctx, 2), du = dust(root, ctx, { seed: 5, hits, n: 30 });

  const sweepSpeed = 80, bearings = [[332, 0.58], [356, 0.66], [22, 0.5]], th0 = 332 - sweepSpeed * (tShips - 0.15);
  const g = sc.D.g, RR = sc.R;
  return {
    update(t) {
      rackIn(root, t, 0.5);
      // camera: MCU scope (slow push) → travel to the radio meter → hold with creep
      const cX = P ? RM.x : RM.x + 120, cY = P ? RM.y + 220 : RM.y + 60;
      const x = glideKeys(t, [[0, 0, SC.x, SC.x], [tMoscow - 0.75, tMoscow + 0.35, SC.x, cX]]);
      const y = glideKeys(t, [[0, 0, SC.y + 40, SC.y + 40], [tMoscow - 0.75, tMoscow + 0.35, SC.y + 40, cY]]);
      let size = glideKeys(t, [[0, 0, 820, 720], [tMoscow - 0.75, tMoscow + 0.35, 720, P ? 900 : 860]]);
      if (t < tMoscow - 0.75) size = 820 - (820 - 720) * clamp(t / (tMoscow - 0.75)) * 0.9;
      size *= 1 - Math.max(0, t - tMoscow - 0.35) * 0.012;
      const f = glideKeys(t, [[0, 0, 0, 0], [tMoscow - 0.6, tMoscow + 0.3, 0, 1]]);
      const [bx, by, br] = breathe(t, 21);
      const [sx, sy, sr] = impact(t, hits, L.unit);
      const k = cam.set({ x: x + bx, y: y + by, size, rot: br + sr, f, dof: 7, shakeX: sx * 1.4, shakeY: sy * 1.4 });
      pipe(bx * 3, by * 3, k);

      // sonar picture: sweep with matte persistence, three contacts, depth-charge clutter
      g.clearRect(0, 0, RR * 2, RR * 2);
      const th = th0 + sweepSpeed * t;
      for (let i = 0; i < 26; i++) { // trailing wedge drawn as thin sectors (no blur / no glow)
        const a1 = (th - i * 3 - 90) * Math.PI / 180, a0 = (th - (i + 1) * 3 - 90) * Math.PI / 180;
        g.fillStyle = `rgba(169,184,146,${(0.22 * (1 - i / 26) ** 2).toFixed(3)})`;
        g.beginPath(); g.moveTo(RR, RR); g.arc(RR, RR, RR, a0, a1); g.closePath(); g.fill();
      }
      g.strokeStyle = 'rgba(190,204,166,0.55)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(RR, RR); g.lineTo(RR + Math.cos((th - 90) * Math.PI / 180) * RR, RR + Math.sin((th - 90) * Math.PI / 180) * RR); g.stroke();
      // grass noise (seeded per frame, deterministic)
      const fr = Math.round(t * 30);
      for (let i = 0; i < 140; i++) {
        const a = rand(fr * 3.1 + i) * Math.PI * 2, r = Math.sqrt(rand(fr * 7.7 + i * 1.3)) * RR * 0.98;
        g.fillStyle = `rgba(169,184,146,${(0.05 + rand(i + fr) * 0.12).toFixed(3)})`;
        g.fillRect(RR + Math.cos(a) * r, RR + Math.sin(a) * r, 2, 1.4);
      }
      for (const [b, rr] of bearings) {
        let age = (((th - b) % 360) + 360) % 360 / sweepSpeed;            // seconds since the sweep last passed it
        const born = tShips - 0.2; if (t - age < born) continue;            // only painted after the ships "appear"
        const v = Math.exp(-age / 2.2);
        const a = (b - 90) * Math.PI / 180, px = RR + Math.cos(a) * rr * RR, py = RR + Math.sin(a) * rr * RR;
        // a contact = a ragged smear of phosphor grains along the arc (fixed shape per contact, fades with age)
        for (let j = 0; j < 46; j++) {
          const u = rand(b * 13 + j) - 0.5, w = rand(b * 7 + j * 3.1) - 0.5;
          const aa = a + u * 0.11, rr2 = rr * RR + w * RR * 0.035 * (1 - Math.abs(u) * 1.4);
          g.fillStyle = `rgba(200,212,176,${(v * (0.25 + 0.6 * (1 - Math.abs(u) * 2))).toFixed(3)})`;
          g.fillRect(RR + Math.cos(aa) * rr2, RR + Math.sin(aa) * rr2, 3.2, 2.4);
        }
        void px; void py;
      }
      for (const [tb, amp] of hits) { // explosion clutter: an expanding grainy ring, ≤ 0.9 s, low contrast (flash-safe)
        const d = t - tb; if (d < 0 || d > 0.9) continue;
        const rr = RR * (0.15 + d * 0.9), v = (1 - d / 0.9) * amp;
        for (let i = 0; i < 260; i++) {
          const a = rand(i * 1.7 + tb) * Math.PI * 2, r = rr * (0.8 + rand(i * 3.3 + fr) * 0.4);
          g.fillStyle = `rgba(190,204,166,${(0.35 * v).toFixed(3)})`;
          g.fillRect(RR + Math.cos(a) * r, RR + Math.sin(a) * r, 3, 2);
        }
      }

      // needles: depth needle kicks on each charge; radio dead at zero; temperature creeps into the red
      let kick = 0; for (const [tb, a] of hits) { const d = t - tb; if (d > 0) kick += a * 22 * Math.exp(-d * 3.5) * Math.sin(d * 18); }
      dg.set(170 + kick + noise1(t * 3, 2) * 1.5);
      const dead = 0.12 + Math.abs(noise1(t * 6, 4)) * 0.08;  // a faint twitch of static, never a signal
      setM(-48 + dead * 9.6 + impact(t, hits, 1)[1] * 0.12);
      tg.set(43.5 + clamp(t / ctx.duration) * 6.5 + noise1(t * 0.9, 7) * 0.2);

      capA(t); gr(t); du(t);
    },
  };
}
