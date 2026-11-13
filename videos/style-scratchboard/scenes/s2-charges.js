// Board 2 — the real photo, scratched; then the cross-section: ships above, charges falling, the hull below.
// intent: KNOW US ships hunted B-59 with practice depth charges; Moscow silent · FEEL dread · SEE light bursts in the dark sea above a black hull
// truth: 2A = EV (drawn line for line after the U.S. Navy photo, dated caption) · 2B = RC (schematic, not to scale)
import { glide, clamp, rand, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { makeBoard, fontsReady, wordT, label, toneOf, FONT, F } from '../shared/board.js';

export default async function (root, ctx) {
  await fontsReady();
  const L = ctx.layout, W = L.width, H = L.height, P = L.portrait, px = L.px;
  const B = makeBoard(root, ctx, 'Board 2');
  const photo = new Image(); photo.src = ctx.asset('assets/b59-surfaced-1962.jpg'); await photo.decode();

  const tAmer = wordT(ctx, 'American', 0, 0.86) - 2 * F, tDepth = wordT(ctx, 'depth', 0, 2.58) - 2 * F;
  const tMoscow = wordT(ctx, 'Moscow', 0, 3.74) - 2 * F;
  const wipeA = tDepth - 0.42, wipeB = wipeA + 0.32;

  // ---------- 2A · the evidence, cut line by line from the top ("Above it…")
  const iw = photo.naturalWidth, ih = photo.naturalHeight;
  const crop = P ? { sx: 0.12 * iw, sy: 0.13 * ih, sw: 0.86 * iw, sh: 0.73 * ih } : { sx: 0, sy: 0.13 * ih, sw: iw, sh: 0.73 * ih };
  const sc = P ? W / crop.sw : px(1.3);
  const plate = { x: P ? 0 : L.safe.x + px(10), y: P ? H * 0.2 : (H - crop.sh * sc) / 2, w: crop.sw * sc, h: crop.sh * sc };
  const toPlate = (u, v) => [plate.x + (u - crop.sx) * sc, plate.y + (v - crop.sy) * sc];
  const roughRect = (g, b, amp) => { // the knife never stops on a ruler: every edge is a little ragged
    const j = (i, k) => (rand(i * 3.1 + k * 17.3) - 0.5) * amp;
    g.beginPath(); g.moveTo(b.x, b.y);
    for (let i = 0; i <= 60; i++) g.lineTo(b.x + (b.w * i) / 60, b.y + j(i, 1));
    for (let i = 0; i <= 30; i++) g.lineTo(b.x + b.w + j(i, 2), b.y + (b.h * i) / 30);
    for (let i = 60; i >= 0; i--) g.lineTo(b.x + (b.w * i) / 60, b.y + b.h + j(i, 3));
    for (let i = 30; i >= 0; i--) g.lineTo(b.x + j(i, 4), b.y + (b.h * i) / 30);
    g.closePath();
  };
  const heli = toPlate(548, 210);
  const HULL = [[333, 418], [349, 372], [441, 377], [446, 424], [700, 444], [716, 452], [713, 466], [660, 469], [342, 441]];
  const PX = plate.x - px(12), PY = plate.y - px(12), PW = plate.w + px(24), PH = plate.h + px(24);
  const drawPhoto = g => {
    g.translate(-PX, -PY); g.save(); roughRect(g, plate, px(14)); g.clip();
    g.filter = `blur(${px(1.2)}px) contrast(1.55) brightness(0.95)`;
    g.drawImage(photo, crop.sx, crop.sy, crop.sw, crop.sh, plate.x, plate.y, plate.w, plate.h);
    g.filter = `blur(${px(1.5)}px)`; g.fillStyle = 'rgba(0,0,0,0.85)'; g.beginPath(); // the hull is dark steel: keep it uncut
    HULL.forEach(([u, v], i) => { const [x, y] = toPlate(u, v); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill();
    g.restore();
  };
  const ptone = toneOf(PW, PH, drawPhoto);
  B.hatch({ name: 'Photo 2A lines', x: PX, y: PY, w: PW, h: PH, tone: ptone.slice(), angle: -3, spacing: px(5.6), maxW: 0.9, gamma: 1.3, wobble: 0.4, color: 1, hi: { thr: 0.6, color: 0 }, t0: 0, dur: 1.4, lineTime: 0.24, seed: 11 });
  B.hatch({ name: 'Photo 2A cross', x: PX, y: PY, w: PW, h: PH, tone: ptone.slice(), angle: 62, spacing: px(5.6), lo: 0.9, maxW: 0.75, gamma: 1, t0: 1.0, dur: 0.9, lineTime: 0.12, order: -1, seed: 12, glint: false });

  // the artist's accent: light caught on the sail and along the deck (follows the photo's own edges)
  B.stroke({ name: 'Sail light', pts: [[351, 373], [392, 371], [440, 378]].map(p => toPlate(...p)), width: px(2.6), t0: 1.15, t1: 1.35, taper: 6 });
  B.stroke({ name: 'Deck light', pts: [[446, 427], [560, 436], [650, 443], [712, 451]].map(p => toPlate(...p)), width: px(2.2), t0: 1.3, t1: 1.6, taper: 10 });

  // heli leader: a short knife line from the label to the helicopter
  B.stroke({ name: 'Heli leader', pts: [[heli[0], plate.y - px(P ? 40 : 16)], [heli[0] + px(2), heli[1] - px(18)]], width: px(2), t0: tAmer + 0.05, t1: tAmer + 0.25, taper: 4, glint: false });
  B.wipe(wipeA, wipeB, 0);

  // ---------- 2B · cross-section (schematic)
  const ys = P ? H * 0.25 : H * 0.29;
  const subC = P ? [W * 0.47, H * 0.54] : [W * 0.56, H * 0.74], subLen = P ? px(640) : px(760), subH = subLen * 0.095;
  const ships = P ? [[W * 0.27, px(330)], [W * 0.7, px(300)]] : [[W * 0.2, px(340)], [W * 0.5, px(380)], [W * 0.8, px(320)]];
  const shipAbove = (g, cx, len) => {
    const b = cx + len / 2, s = cx - len / 2, hh = len * 0.055;
    g.beginPath(); g.moveTo(s, ys - hh * 0.9); g.lineTo(b - len * 0.18, ys - hh); g.quadraticCurveTo(b - len * 0.05, ys - hh * 1.05, b, ys - hh * 1.35);
    g.lineTo(b - len * 0.04, ys); g.lineTo(s + len * 0.02, ys); g.closePath(); g.fill();
    g.fillRect(cx + len * 0.12, ys - hh * 2.3, len * 0.13, hh * 1.4);      // bridge
    g.fillRect(cx - len * 0.02, ys - hh * 2.55, len * 0.05, hh * 1.7);     // funnel
    g.fillRect(cx - len * 0.22, ys - hh * 1.6, len * 0.08, hh * 0.7);      // after deckhouse
    g.fillRect(cx + len * 0.205, ys - hh * 4.4, len * 0.008, hh * 2.2);    // mast
    g.fillRect(cx + len * 0.16, ys - hh * 4.0, len * 0.09, len * 0.004);   // yard
  };
  const shipBelow = (g, cx, len) => { const hh = len * 0.05; g.beginPath(); g.moveTo(cx - len / 2 + len * 0.02, ys); g.lineTo(cx + len / 2 - len * 0.04, ys); g.quadraticCurveTo(cx + len * 0.3, ys + hh, cx, ys + hh); g.lineTo(cx - len * 0.44, ys + hh * 0.8); g.closePath(); g.fill(); };
  const subShape = g => { // bow LEFT (toward Cuba on the map plot)
    const [cx, cy] = subC, l = subLen, h = subH;
    g.beginPath(); g.moveTo(cx - l / 2, cy);
    g.bezierCurveTo(cx - l / 2, cy - h * 0.6, cx - l * 0.42, cy - h / 2, cx - l * 0.35, cy - h / 2);
    g.lineTo(cx + l * 0.3, cy - h / 2); g.quadraticCurveTo(cx + l * 0.42, cy - h * 0.4, cx + l / 2, cy - h * 0.08);
    g.lineTo(cx + l / 2, cy + h * 0.08); g.quadraticCurveTo(cx + l * 0.42, cy + h * 0.4, cx + l * 0.3, cy + h / 2);
    g.lineTo(cx - l * 0.35, cy + h / 2); g.bezierCurveTo(cx - l * 0.42, cy + h / 2, cx - l / 2, cy + h * 0.6, cx - l / 2, cy); g.fill();
    g.beginPath(); g.moveTo(cx - l * 0.17, cy - h / 2); g.lineTo(cx - l * 0.15, cy - h * 1.25); g.lineTo(cx - l * 0.02, cy - h * 1.25); g.quadraticCurveTo(cx + l * 0.03, cy - h * 0.9, cx + l * 0.05, cy - h / 2); g.fill();
  };
  const t2 = wipeB - 0.05;
  B.hatch({ name: 'Sea 2B', x: 0, y: ys, w: W, h: H - ys, angle: 0, spacing: px(8), maxW: 0.8, gamma: 1.05, color: 1, t0: t2, dur: 0.75, lineTime: 0.45, glint: false, seed: 13,
    waves: [[px(2.5), 0.01, 0.035, 0]],
    draw: (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.3, '#555'); gr.addColorStop(0.62, '#2a2a2a'); gr.addColorStop(1, '#0a0a0a');
      g.fillStyle = gr; g.fillRect(0, 0, w, h); g.translate(0, -ys); g.fillStyle = '#000';
      g.filter = `blur(${px(3)}px)`; subShape(g); g.filter = 'none'; subShape(g); for (const [cx, len] of ships) shipBelow(g, cx, len);
      roughRect(g, { x: -px(20), y: P ? H * 0.665 : H * 0.845, w: P ? W * 0.94 : W * 0.5, h: P ? H * 0.06 : H * 0.2 }, px(10)); g.fillStyle = '#000'; g.fill(); // caption corner left dark
      const cl = P ? { x: L.safe.x - px(16), y: H * 0.33 - px(10), w: px(470), h: px(56) } : { x: W * 0.27 - px(18), y: H * 0.395 - px(10), w: px(520), h: px(58) };
      roughRect(g, cl, px(8)); g.fill();
    } });
  B.hatch({ name: 'Ships', x: 0, y: 0, w: W, h: ys + px(2), angle: 90, spacing: px(4.6), maxW: 0.82, gamma: 1, order: -1, t0: t2 + 0.05, dur: 0.4, lineTime: 0.08, seed: 14,
    draw: (g, w, h) => { const gr = g.createLinearGradient(0, ys - px(90), 0, ys); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#777'); g.fillStyle = gr; for (const [cx, len] of ships) shipAbove(g, cx, len); } });
  const surf = []; for (let i = 0; i <= 60; i++) { const x = -px(20) + ((W + px(40)) * i) / 60; surf.push([x, ys + px(1.5) * Math.sin(i * 1.7)]); }
  B.stroke({ name: 'Surface', pts: surf, width: px(2.4), t0: t2, t1: t2 + 0.35, taper: px(40), rough: 0.25, glint: false });
  // light from above catches only the top of the hull
  B.hatch({ name: 'Hull rim light', x: subC[0] - subLen / 2 - px(10), y: subC[1] - subH * 1.4, w: subLen + px(20), h: subH * 2, angle: 0, spacing: px(4.4), maxW: 0.85, gamma: 1.1, t0: t2 + 0.3, dur: 0.45, lineTime: 0.22, seed: 15,
    draw: g => { g.translate(-(subC[0] - subLen / 2 - px(10)), -(subC[1] - subH * 1.4)); const gr = g.createLinearGradient(0, subC[1] - subH * 1.25, 0, subC[1] + subH * 0.1); gr.addColorStop(0, '#fff'); gr.addColorStop(0.42, '#bbb'); gr.addColorStop(0.6, '#555'); gr.addColorStop(1, '#000'); g.fillStyle = gr; subShape(g); } });

  // practice charges: fall from the ships, burst above the hull (positions schematic)
  const bursts = P
    ? [{ x: W * 0.36, y: H * 0.44, t: tDepth + 0.78 }, { x: W * 0.6, y: H * 0.47, t: tDepth + 1.32 }]
    : [{ x: W * 0.47, y: H * 0.56, t: tDepth + 0.78 }, { x: W * 0.68, y: H * 0.6, t: tDepth + 1.32 }];
  const fall = px(420);
  const charges = bursts.map((b, i) => ({ ...b, t0: b.t - (b.y - ys) / fall, x0: b.x - px(16) * (i ? -1 : 1) }));
  B.custom((t, api) => {
    for (const [i, c] of charges.entries()) {
      if (t < c.t0) continue;
      if (t < c.t) { // falling canister + its bubble trail
        const p = (t - c.t0) / (c.t - c.t0), x = c.x0 + (c.x - c.x0) * p, y = ys + (c.y - ys) * p;
        const [sx, sy] = api.toScreen(x, y); api.disc(sx, sy, px(5.5) * api.z, 1, 0);
        for (let j = 1; j < 7; j++) { const yy = y - j * px(15); if (yy < ys + px(6)) break; const [bx, by] = api.toScreen(x + px(3) * Math.sin(j * 2.1 + i), yy); api.disc(bx, by, px(2.4 - j * 0.25) * api.z, 0.8 - j * 0.1, 1); }
        continue;
      }
      const dt = t - c.t;
      if (dt < 0.55) { // knife rays out of the dark: the burst is scratched, not glowing
        const f = dt / 0.55, r0 = px(10) + f * px(110), r1 = r0 + px(46) * (1 - f) + px(8);
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2 + rand(k + i * 31) * 0.3, lr = 0.6 + 0.4 * rand(k * 7 + i);
          api.seg(c.x + Math.cos(a) * r0, c.y + Math.sin(a) * r0, c.x + Math.cos(a) * r0 + Math.cos(a) * (r1 - r0) * lr, c.y + Math.sin(a) * r0 + Math.sin(a) * (r1 - r0) * lr, px(3.2), px(0.8), 1 - f * f, 0);
        }
      }
      if (dt < 2.6) for (let k = 0; k < 14; k++) { // bubbles rise and thin out
        const a = rand(k * 3.3 + i * 9) * Math.PI * 2, rr = px(20) + rand(k * 5.1 + i) * px(70);
        const life = 1.2 + rand(k * 1.9 + i * 4) * 1.4; if (dt > life) continue;
        const x = c.x + Math.cos(a) * rr * Math.min(1, dt * 3) + px(4) * Math.sin(dt * 5 + k), y = c.y + Math.sin(a) * rr * 0.6 * Math.min(1, dt * 3) - dt * px(70);
        if (y < ys + px(6)) continue;
        const [sx, sy] = api.toScreen(x, y); api.disc(sx, sy, (px(2) + rand(k) * px(3)) * api.z, 1 - dt / life, k % 3 ? 1 : 0);
      }
    }
  });

  // ---------- labels (screen space)
  const colX = P ? L.safe.x : plate.x + plate.w + px(56), colY = P ? plate.y + plate.h + px(48) : plate.y + px(6);
  const cap0 = label(root, L, { name: 'Photo caption title', text: 'B-59', x: colX, y: colY, size: px(P ? 64 : 72), family: FONT.display, caps: false, track: '0', t0: 0.45, dur: 0.3, out: wipeA + 0.05 });
  const cap1 = label(root, L, { name: 'Photo caption', html: P ? 'on the surface · photo 28–29 Oct 1962' : 'on the surface<br>photo 28–29 Oct 1962', x: colX, y: colY + px(P ? 84 : 96), size: px(P ? 32 : 29), weight: 800, track: '0.08em', t0: 0.7, dur: 0.4, out: wipeA + 0.05 });
  const cap2 = label(root, L, { name: 'Photo credit', html: P ? 'drawn after a U.S. Navy photograph (NARA)' : 'drawn after a<br>U.S. Navy photograph<br>(NARA)', x: colX, y: colY + px(P ? 136 : 196), size: px(30), family: FONT.display, italic: true, caps: false, track: '0', t0: 1.0, dur: 0.4, out: wipeA + 0.05, opacity: 0.78 });
  const heliL = label(root, L, { name: 'Label helicopter', text: 'U.S. Navy helicopter', x: P ? heli[0] + px(14) : heli[0] - px(10), anchor: P ? 'right' : 'left', y: plate.y - px(P ? 92 : 62), size: px(30), weight: 600, track: '0.12em', t0: tAmer, dur: 0.3, out: wipeA + 0.05, opacity: 0.86 });
  const chL = label(root, L, { name: 'Label practice charges', text: 'practice depth charges', x: P ? L.safe.x : W * 0.27, y: P ? H * 0.33 : H * 0.395, size: px(30), weight: 600, track: '0.12em', t0: tDepth + 0.2, dur: 0.35, opacity: 0.86 });
  const mosL = label(root, L, { name: 'Moscow line', text: 'No word from Moscow for days', x: L.safe.x + (P ? 0 : px(10)), y: P ? H * 0.68 : H * 0.865, size: px(P ? 40 : 48), weight: 800, track: '0.06em', t0: tMoscow, dur: 0.45 });
  const labels = [cap0, cap1, cap2, heliL, chL, mosL];

  // sound: the bed continues from board 1; two real distant thuds on the bursts (on the frame, 0–2 f after)
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -14 });
  ctx.sfx('boom-distant-01', bursts[0].t, { lu: -6, duration: 2.2, fadeOut: 0.8 });
  ctx.sfx('boom-slapback-01', bursts[1].t - 0.43 + F, { lu: -10, duration: 3.2, fadeOut: 1.2 }); // file's hit is at 0.43 s; it repeats later, so it is cut

  return {
    update(t) {
      let cam;
      if (t < wipeB) cam = { z: 1 + 0.008 * t, cx: W / 2, cy: H / 2 };
      else {
        const p = clamp((t - wipeB) / (ctx.duration - wipeB));
        // slow push toward the hull; a small noise shake on each burst (decays in 0.4 s)
        let sh = 0; for (const b of bursts) { const d = t - b.t; if (d > 0 && d < 0.4) sh += px(5) * (1 - d / 0.4) * noise1(d * 40, b.x); }
        cam = { z: glide(p, 0, 1, 1, 1.06), cx: glide(p, 0, 1, W / 2, W / 2 + (subC[0] - W / 2) * 0.25) + sh, cy: glide(p, 0, 1, H / 2, H / 2 + (subC[1] - H / 2) * 0.2) + sh * 0.6 };
      }
      B.render(t, cam);
      for (const l of labels) l.update(t);
    },
  };
}
