// GIANT FOREGROUND — painted toy props. Each is drawn once in design units and baked to a canvas (gouache look).
// Toy proportions: huge hands and boots, small far heads. Figures are faceless (no features at all).
import { C, mix, rgba, rng, paint, shade, bake } from './toy.js';

const P = () => new Path2D();
const rr = (p, x, y, w, h, r) => { p.roundRect(x, y, w, h, r); return p; };
const capsule = (x1, y1, x2, y2, wd) => {
  const p = P(), a = Math.atan2(y2 - y1, x2 - x1), n = a + Math.PI / 2, h = wd / 2;
  p.moveTo(x1 + Math.cos(n) * h, y1 + Math.sin(n) * h);
  p.lineTo(x2 + Math.cos(n) * h, y2 + Math.sin(n) * h);
  p.arc(x2, y2, h, n, n + Math.PI, true);
  p.lineTo(x1 - Math.cos(n) * h, y1 - Math.sin(n) * h);
  p.arc(x1, y1, h, n + Math.PI, n, true);
  p.closePath();
  return p;
};
const poly = (pts) => { const p = P(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const ell = (x, y, a, b, r = 0) => { const p = P(); p.ellipse(x, y, a, b, r, 0, Math.PI * 2); return p; };
const strokeLine = (g, pts, col, w, a = 0.6) => {
  g.save(); g.strokeStyle = rgba(col, a); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore();
};

/* ---------- 1A: periscope eyepiece box, two fists on the handles, sleeves to the lens (operator POV, worm's-eye) ---------- */
// design 1000 × 1400; eyepiece centre (500, 600), inner lens radius 62
export const PERI = { w: 1000, h: 1400, eye: [500, 600], lensR: 62 };
export function periscope(res) {
  return bake(PERI.w, PERI.h, res, (g, k) => {
    // tube rising out of frame
    const tube = rr(P(), 425, -40, 150, 520, 12);
    paint(g, tube, { base: C.steel, lite: C.steelLite, box: [425, -40, 150, 520], k, seed: 11, dir: -1.45, light: [-0.9, -0.2], size: 1.2 });
    for (const y of [90, 250, 400]) strokeLine(g, [[428, y], [572, y]], C.ink, 9, 0.45);
    // underside of the box (we are below it) then the box
    const under = poly([[300, 760], [700, 760], [660, 830], [340, 830]]);
    paint(g, under, { base: mix(C.steel, C.ink, 0.45), box: [300, 760, 400, 70], k, seed: 12, dir: 0, rim: 0.5 });
    const boxP = rr(P(), 295, 440, 410, 330, 46);
    shade(g, boxP, k, { dy: 18, blur: 16, alpha: 0.35 });
    paint(g, boxP, { base: C.steel, lite: C.steelLite, box: [295, 440, 410, 330], k, seed: 13, light: [-0.6, -0.7], size: 1.1 });
    // eyepiece: rubber cup + lens
    const cup = ell(500, 600, 108, 104);
    paint(g, cup, { base: '#1B1D20', lite: '#4B5258', box: [392, 496, 216, 208], k, seed: 14, dir: 0.4, gloss: 0.8 });
    g.fillStyle = '#08090B'; g.fill(ell(500, 600, PERI.lensR, PERI.lensR));
    g.strokeStyle = rgba(C.fieldLite, 0.55); g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.arc(500, 600, 40, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
    // handles (bars) out of the box sides
    for (const [x0, x1] of [[110, 300], [700, 890]]) {
      const bar = rr(P(), x0, 578, x1 - x0, 52, 26);
      paint(g, bar, { base: C.ink, lite: '#5B636B', box: [x0, 578, x1 - x0, 52], k, seed: x0 + 3, dir: 0, gloss: 0.7, size: 0.7 });
    }
    // sleeves from the bottom corners (the operator = us), then fists
    const sleeves = [
      poly([[130, 690], [300, 680], [330, 1400], [-60, 1400]]),
      poly([[700, 680], [870, 690], [1060, 1400], [670, 1400]]),
    ];
    sleeves.forEach((s, i) => {
      shade(g, s, k, { dy: 10, blur: 14, alpha: 0.4 });
      paint(g, s, { base: C.navy, lite: C.navyLite, box: [i ? 670 : -60, 680, 390, 720], k, seed: 21 + i, dir: -1.35 + i * 0.4, light: [i ? 0.2 : -0.7, -0.8], size: 1.6 });
      // cuff band (two thin rank stripes)
      const cx = i ? 785 : 215;
      for (const dy of [0, 34]) {
        const band = poly([[cx - 95 - dy * 0.05, 725 + dy], [cx + 95 + dy * 0.05, 722 + dy], [cx + 97 + dy * 0.05, 738 + dy], [cx - 97 - dy * 0.05, 741 + dy]]);
        paint(g, band, { base: C.brass, lite: C.brassLite, box: [cx - 100, 720 + dy, 200, 22], k, seed: 30 + i + dy, dir: 0, rim: 0.3, size: 0.6 });
      }
    });
    // fists around the bars: knuckles row on top, thumb over the bar, finger grooves
    for (const [cx, side] of [[205, -1], [795, 1]]) {
      const body = rr(P(), cx - 96, 556, 192, 158, 58);
      shade(g, body, k, { dx: 6, dy: 16, blur: 12, alpha: 0.45 });
      const sk = { base: C.skin, lite: C.skinLite, dark: C.skinDark, k, size: 0.8, light: [-0.6, -0.7] };
      paint(g, body, { ...sk, box: [cx - 96, 556, 192, 158], seed: 40 + side, dir: 0.2 });
      // four knuckles rolled over the bar (front row, each its own little form)
      for (let i = 0; i < 4; i++) {
        const kx = cx - 69 + i * 46, kn = rr(P(), kx - 24, 548, 48, 86, 22);
        paint(g, kn, { ...sk, box: [kx - 24, 548, 48, 86], seed: 44 + i + side * 10, dir: -1.4, size: 0.5, rim: 0.8 });
      }
      // thumb wrapping over the top of the bar, toward the box
      const th = capsule(cx + side * 92, 600, cx - side * 4, 556, 54);
      paint(g, th, { ...sk, box: [cx - 110, 520, 220, 120], seed: 49 + side, dir: 0.4, size: 0.5, rim: 0.9 });
    }
  });
}

/* ---------- 1B: submarine, 3/4 from low front-left (bow nearest) ---------- */
// design 1400 × 800; bow centre (450, 470)
export const SUB34 = { w: 1400, h: 800, bow: [450, 470], door: [355, 520] };
export function sub34(res) {
  return bake(SUB34.w, SUB34.h, res, (g, k) => {
    const hull = P();
    hull.moveTo(450, 240);
    hull.quadraticCurveTo(900, 168, 1305, 196);
    hull.quadraticCurveTo(1372, 250, 1305, 306);
    hull.quadraticCurveTo(900, 560, 450, 700);
    hull.ellipse(450, 470, 205, 230, 0, Math.PI / 2, Math.PI * 1.5, false);
    hull.closePath();
    // sail (conning tower) behind the hull top
    const sail = P();
    sail.moveTo(690, 222); sail.lineTo(706, 70); sail.quadraticCurveTo(712, 44, 760, 42); sail.lineTo(842, 46);
    sail.quadraticCurveTo(866, 50, 866, 80); sail.lineTo(878, 206); sail.closePath();
    paint(g, sail, { base: C.hull, lite: C.hullLite, box: [690, 42, 190, 180], k, seed: 51, dir: -1.5, light: [-0.7, -0.6] });
    // periscope + mast stubs
    paint(g, rr(P(), 760, -10, 18, 70, 6), { base: C.hull, lite: C.hullLite, box: [760, -10, 18, 70], k, seed: 52, rim: 0.3, size: 0.4 });
    paint(g, rr(P(), 800, 8, 14, 50, 6), { base: C.hull, lite: C.hullLite, box: [800, 8, 14, 50], k, seed: 53, rim: 0.3, size: 0.4 });
    // fairwater plane
    paint(g, poly([[700, 120], [620, 132], [624, 146], [704, 140]]), { base: C.hull, lite: C.hullLite, box: [620, 120, 90, 30], k, seed: 54, rim: 0.3, size: 0.5 });
    paint(g, hull, { base: C.hull, lite: C.hullLite, box: [245, 168, 1130, 532], k, seed: 55, dir: -0.25, light: [-0.35, -0.95], size: 1.5, gloss: 0.5 });
    // bow cap highlight + torpedo-tube doors on the bow face
    const cap = ell(400, 430, 120, 150, -0.2);
    g.save(); g.clip(hull); g.globalAlpha = 0.5;
    paint(g, cap, { base: mix(C.hull, C.hullLite, 0.35), lite: mix(C.hullLite, '#ffffff', 0.2), box: [280, 280, 240, 300], k, seed: 56, rim: 0, size: 0.8 });
    g.restore();
    const doors = [[340, 470], [395, 455], [355, 535], [410, 520]];
    doors.forEach(([x, y], i) => {
      const d = ell(x, y, 21, 30, -0.15);
      g.fillStyle = '#0B0C0E'; g.fill(d);
      g.strokeStyle = rgba(C.hullLite, 0.6); g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, 25, 34, -0.15, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
    });
    // bow planes (left, near; right, mostly hidden)
    const plane = poly([[300, 585], [92, 640], [96, 668], [318, 625]]);
    shade(g, plane, k, { dy: 12, blur: 10, alpha: 0.4 });
    paint(g, plane, { base: C.hull, lite: C.hullLite, box: [92, 585, 226, 83], k, seed: 57, dir: 0.25, size: 0.7 });
    paint(g, poly([[600, 585], [700, 600], [698, 616], [596, 606]]), { base: C.hull, lite: C.hullLite, box: [596, 585, 104, 31], k, seed: 58, size: 0.5, rim: 0.3 });
    // weld seams (hand-drawn, light)
    strokeLine(g, [[560, 228], [570, 670]], C.hullLite, 4, 0.25);
    strokeLine(g, [[900, 186], [905, 530]], C.hullLite, 4, 0.22);
    // ballast vents along the bottom
    for (let i = 0; i < 9; i++) strokeLine(g, [[600 + i * 70, 620 - i * 24], [640 + i * 70, 608 - i * 24]], '#08090B', 9, 0.55);
  });
}

/* ---------- island (Cuba, toy) ---------- */
export const ISLE = { w: 420, h: 120 };
export function island(res) {
  return bake(ISLE.w, ISLE.h, res, (g, k) => {
    const p = P();
    p.moveTo(0, 104); p.bezierCurveTo(60, 70, 110, 40, 170, 46); p.bezierCurveTo(230, 20, 300, 36, 340, 62); p.bezierCurveTo(380, 80, 410, 96, 420, 104); p.closePath();
    paint(g, p, { base: C.sand, lite: C.sandLite, box: [0, 20, 420, 84], k, seed: 61, dir: 0, size: 0.6, rim: 0.6 });
    // one toy palm
    strokeLine(g, [[250, 40], [258, -4]], '#4A3A26', 6, 1);
    for (const a of [-2.6, -2.0, -1.2, -0.5]) strokeLine(g, [[258, -4], [258 + Math.cos(a) * 34, -4 + Math.sin(a) * 18 + 10]], '#4F6B35', 8, 1);
  });
}

/* ---------- sea surface band (seen from below) ---------- */
export function surfaceBand(W, Hb, res, seed) {
  return bake(W, Hb, res, (g, k) => {
    const R = rng(seed);
    const p = P();
    p.moveTo(0, 0); p.lineTo(W, 0); p.lineTo(W, Hb * 0.72);
    const n = 14;
    for (let i = n; i >= 0; i--) { const x = (i / n) * W; p.lineTo(x, Hb * (0.7 + (i % 2 ? 0.12 : 0.02) + (R() - 0.5) * 0.06)); }
    p.closePath();
    paint(g, p, { base: C.fieldLite, lite: mix(C.fieldLite, C.cream, 0.35), dark: C.field, box: [0, 0, W, Hb], k, seed: seed + 1, dir: 0.05, light: [0, -1], size: 2.2, rim: 0, flow: 0.25 });
    // sun-flecks under the surface
    for (let i = 0; i < 60; i++) { g.fillStyle = rgba(C.cream, 0.08 + R() * 0.12); g.beginPath(); g.ellipse(R() * W, R() * Hb * 0.6, 18 + R() * 40, 3 + R() * 4, 0, 0, Math.PI * 2); g.fill(); }
  });
}

/* ---------- ship hull seen from below the surface ---------- */
export const SHIP = { w: 900, h: 300, line: 110 };
export function shipBelow(res, seed) {
  return bake(SHIP.w, SHIP.h, res, (g, k) => {
    // superstructure above the waterline: faint, through the water
    g.save(); g.globalAlpha = 0.32;
    paint(g, poly([[250, SHIP.line], [280, 40], [520, 40], [560, 0], [640, 0], [660, SHIP.line]]), { base: C.hull, box: [250, 0, 410, SHIP.line], k, seed: seed + 1, rim: 0 });
    g.restore();
    const hull = P();
    hull.moveTo(0, SHIP.line); hull.lineTo(900, SHIP.line);
    hull.quadraticCurveTo(860, 240, 690, 262); hull.lineTo(170, 262); hull.quadraticCurveTo(40, 240, 0, SHIP.line); hull.closePath();
    paint(g, hull, { base: C.hull, lite: C.hullLite, box: [0, SHIP.line, 900, 152], k, seed: seed + 2, dir: 0.02, light: [0, -1], size: 1.1 });
    // keel line + propeller
    strokeLine(g, [[190, 258], [680, 258]], C.ink, 10, 0.7);
    paint(g, ell(780, 250, 12, 34, 0.3), { base: C.brass, lite: C.brassLite, box: [766, 214, 28, 72], k, seed: seed + 3, rim: 0.3, size: 0.4 });
  });
}

/* ---------- practice depth charge (small canister) ---------- */
export const CAN = { w: 200, h: 290 };
export function canister(res, seed) {
  return bake(CAN.w, CAN.h, res, (g, k) => {
    const body = P(); body.moveTo(20, 50); body.lineTo(20, 240); body.ellipse(100, 240, 80, 24, 0, Math.PI, 0, true); body.lineTo(180, 50); body.closePath();
    paint(g, body, { base: C.olive, lite: C.oliveLite, box: [20, 50, 160, 214], k, seed, dir: -1.5, light: [-0.8, -0.3], size: 0.8, gloss: 0.5 });
    paint(g, ell(100, 50, 80, 24), { base: mix(C.olive, C.oliveLite, 0.5), lite: C.oliveLite, box: [20, 26, 160, 48], k, seed: seed + 1, rim: 0.5, size: 0.5 });
    for (const y of [95, 195]) strokeLine(g, [[22, y], [100, y + 22], [178, y]], C.ink, 9, 0.5);
    paint(g, ell(100, 46, 22, 8), { base: C.ink, box: [78, 38, 44, 16], k, seed: seed + 2, rim: 0, size: 0.3 });
  });
}

/* ---------- burst (cream bubble ring, painted) ---------- */
export const BURST = { w: 400, h: 400 };
export function burst(res, seed) {
  return bake(BURST.w, BURST.h, res, (g) => {
    const R = rng(seed);
    for (let i = 0; i < 70; i++) {
      const a = R() * Math.PI * 2, d = 60 + R() * 130, r = 6 + R() * 26;
      g.fillStyle = rgba(C.cream, 0.25 + R() * 0.5);
      g.beginPath(); g.ellipse(200 + Math.cos(a) * d, 200 + Math.sin(a) * d * 0.8, r, r * 0.85, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = rgba(C.fieldDeep, 0.35); g.lineWidth = 3; g.stroke();
    }
    g.fillStyle = rgba(C.cream, 0.55); g.beginPath(); g.ellipse(200, 200, 70, 58, 0, 0, Math.PI * 2); g.fill();
  });
}

/* ---------- radio set (low angle: we see its underside) ---------- */
export const RADIO = { w: 1000, h: 800, dial: [330, 400], spk: [700, 385] };
export function radio(res) {
  return bake(RADIO.w, RADIO.h, res, (g, k) => {
    const under = poly([[100, 650], [900, 650], [858, 745], [142, 745]]);
    const side = poly([[900, 150], [965, 105], [965, 600], [900, 650]]);
    const front = rr(P(), 100, 150, 800, 500, 22);
    shade(g, front, k, { dy: 40, blur: 30, alpha: 0.4 });
    paint(g, under, { base: mix(C.olive, C.ink, 0.5), box: [100, 650, 800, 95], k, seed: 71, dir: 0, size: 1.2, rim: 0.4 });
    paint(g, side, { base: mix(C.olive, C.ink, 0.25), box: [900, 105, 65, 545], k, seed: 72, dir: -1.5, size: 0.8, rim: 0.4 });
    paint(g, front, { base: C.olive, lite: C.oliveLite, box: [100, 150, 800, 500], k, seed: 73, dir: -0.2, size: 1.4 });
    // dial: bezel + cream face + ticks + needle (still: no word comes)
    const [dx, dy] = RADIO.dial;
    paint(g, ell(dx, dy, 178, 178), { base: C.brass, lite: C.brassLite, box: [dx - 178, dy - 178, 356, 356], k, seed: 74, gloss: 0.8, size: 0.8 });
    paint(g, ell(dx, dy, 148, 148), { base: C.cream, lite: '#FFFFFF', dark: '#BFB39A', box: [dx - 148, dy - 148, 296, 296], k, seed: 75, size: 0.6, rim: 0.6 });
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI * (0.8 + (i / 20) * 1.4), r1 = 128, r0 = i % 5 ? 112 : 96;
      strokeLine(g, [[dx + Math.cos(a) * r0, dy + Math.sin(a) * r0], [dx + Math.cos(a) * r1, dy + Math.sin(a) * r1]], C.ink, i % 5 ? 4 : 7, 0.8);
    }
    const na = Math.PI * 1.02;
    strokeLine(g, [[dx, dy], [dx + Math.cos(na) * 118, dy + Math.sin(na) * 118]], '#8E2A1E', 9, 0.95);
    paint(g, ell(dx, dy, 20, 20), { base: C.ink, box: [dx - 20, dy - 20, 40, 40], k, seed: 76, rim: 0, size: 0.3, gloss: 1 });
    // speaker grille
    const [sx, sy] = RADIO.spk;
    paint(g, ell(sx, sy, 160, 160), { base: mix(C.olive, C.ink, 0.35), box: [sx - 160, sy - 160, 320, 320], k, seed: 77, size: 0.7 });
    g.save(); g.clip(ell(sx, sy, 142, 142));
    for (let y = sy - 140; y < sy + 140; y += 26) strokeLine(g, [[sx - 150, y], [sx + 150, y]], '#0D0F0E', 13, 0.8);
    g.restore();
    // knobs
    for (const [x, y] of [[240, 590], [480, 598], [760, 590]]) paint(g, ell(x, y, 30, 30), { base: C.ink, lite: '#5E666C', box: [x - 30, y - 30, 60, 60], k, seed: x, gloss: 1, size: 0.4 });
    // brass name plate (blank) + screws
    paint(g, rr(P(), 420, 182, 170, 38, 6), { base: C.brass, lite: C.brassLite, box: [420, 182, 170, 38], k, seed: 79, size: 0.4, rim: 0.4 });
    for (const [x, y] of [[130, 180], [870, 180], [130, 620], [870, 620]]) { g.fillStyle = rgba(C.ink, 0.7); g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill(); }
  });
}

/* ---------- torpedo on its cradle, side 3/4, nose to screen-left (never at the viewer) ---------- */
export const TORP = { w: 1600, h: 510 };
export function torpedo(res) {
  return bake(TORP.w, TORP.h, res, (g, k) => {
    // contact shadows of the cradles on the deck we never see
    g.save(); g.filter = `blur(${16 * k}px)`; g.fillStyle = rgba(mix(C.fieldDeep, '#000000', 0.4), 0.6);
    for (const x of [470, 1130]) { g.beginPath(); g.ellipse(x, 472, 150, 22, 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
    // cradles behind/below
    for (const x of [470, 1130]) {
      const c = poly([[x - 70, 300], [x + 70, 300], [x + 90, 470], [x - 90, 470]]);
      paint(g, c, { base: C.ink, lite: '#4F575E', box: [x - 90, 300, 180, 170], k, seed: x, dir: -1.5, size: 0.8 });
    }
    const body = P();
    body.moveTo(300, 80); body.lineTo(1350, 80); body.lineTo(1500, 142); body.lineTo(1500, 278); body.lineTo(1350, 340); body.lineTo(300, 340);
    body.ellipse(300, 210, 250, 130, 0, Math.PI / 2, Math.PI * 1.5, false); body.closePath();
    // tail fins + propeller
    for (const pts of [[[1400, 128], [1520, 40], [1560, 44], [1500, 146]], [[1400, 292], [1520, 380], [1560, 376], [1500, 274]]]) paint(g, poly(pts), { base: C.torp, lite: C.torpLite, box: [1400, 40, 160, 340], k, seed: 81, size: 0.5 });
    shade(g, body, k, { dy: 26, blur: 18, alpha: 0.45 });
    paint(g, body, { base: C.torp, lite: C.torpLite, box: [50, 80, 1450, 260], k, seed: 82, dir: 0.02, light: [-0.3, -0.95], size: 1.4, gloss: 0.6, flow: 0.35 });
    paint(g, ell(1540, 210, 16, 58), { base: C.brass, lite: C.brassLite, box: [1524, 152, 32, 116], k, seed: 83, size: 0.4 });
    // warhead section: cream band + a painted red-ochre band (paint codes, no text)
    g.save(); g.clip(body);
    paint(g, rr(P(), 560, 70, 42, 290, 0), { base: C.cream, box: [560, 70, 42, 290], k, seed: 84, dir: -1.5, size: 0.5, rim: 0.4 });
    paint(g, rr(P(), 622, 70, 22, 290, 0), { base: '#9A3B27', box: [622, 70, 22, 290], k, seed: 85, dir: -1.5, size: 0.4, rim: 0.4 });
    for (const x of [980, 1250]) strokeLine(g, [[x, 70], [x, 350]], C.ink, 6, 0.5);
    g.restore();
    // cradle straps over the body
    for (const x of [470, 1130]) paint(g, rr(P(), x - 22, 76, 44, 268, 8), { base: C.ink, lite: '#555D63', box: [x - 22, 76, 44, 268], k, seed: x + 1, dir: -1.5, size: 0.5, rim: 0.4 });
  });
}

/* ---------- officer, worm's-eye (huge boots, tiny faceless head) ---------- */
// design 600 × 1400; feet at the bottom. pose: 'behind' (hands behind back) | 'crossed' | 'sides' | 'reach' (no left arm)
export const OFF = { w: 600, h: 1400, shoulderL: [218, 372], head: [300, 250] };
export function officer(res, { seed = 1, pose = 'sides', lean = 0 } = {}) {
  return bake(OFF.w, OFF.h, res, (g, k) => {
    const R = rng(seed);
    const j = (v) => v + (R() - 0.5) * 14;
    // contact shadow on the field (the deck we never see)
    g.save(); g.filter = `blur(${18 * k}px)`; g.fillStyle = rgba(mix(C.fieldDeep, '#000000', 0.4), 0.55); g.beginPath(); g.ellipse(300, 1380, 300, 30, 0, 0, Math.PI * 2); g.fill(); g.restore();
    // trousers: strongly tapering legs (worm's-eye)
    const legs = poly([[j(80), 1265], [j(285), 1265], [300, 790], [j(318), 1265], [j(520), 1265], [j(372) + lean, 560], [j(228) + lean, 560]]);
    paint(g, legs, { base: C.navy, lite: C.navyLite, box: [80, 560, 440, 705], k, seed: seed + 1, dir: -1.45, light: [-0.6, -0.4], size: 1.3 });
    strokeLine(g, [[300, 800], [300, 1240]], C.ink, 7, 0.5);
    // boots: two big glossy domes, toes at the lens
    for (const [cx, w] of [[j(175), 128], [j(425), 132]]) {
      const b = P(); b.moveTo(cx - w, 1360); b.bezierCurveTo(cx - w * 1.05, 1250, cx - w * 0.6, 1210, cx, 1212); b.bezierCurveTo(cx + w * 0.6, 1210, cx + w * 1.05, 1250, cx + w, 1360); b.quadraticCurveTo(cx, 1392, cx - w, 1360); b.closePath();
      paint(g, b, { base: C.boot, lite: C.bootLite, box: [cx - w, 1210, 2 * w, 180], k, seed: seed + cx, dir: 0.1, gloss: 1.2, size: 0.9, light: [-0.5, -0.9] });
    }
    // jacket (perspective: narrow at the top), belt hem, brass buttons
    const jacket = poly([[j(196) + lean, 610], [j(404) + lean, 610], [376 + lean * 1.4, 335], [224 + lean * 1.4, 335]]);
    paint(g, jacket, { base: C.navy, lite: C.navyLite, box: [196, 335, 210, 275], k, seed: seed + 2, dir: -1.5, size: 1 });
    for (let i = 0; i < 3; i++) paint(g, ell(300 + lean * (1.2 - i * 0.15) + 18, 560 - i * 66, 7, 7), { base: C.brass, lite: C.brassLite, box: [300, 540 - i * 66, 40, 40], k, seed: seed + 9 + i, rim: 0, size: 0.2 });
    // arms by pose
    const sleeve = (pth, s) => paint(g, pth, { base: C.navy, lite: C.navyLite, box: [120, 330, 360, 400], k, seed: seed + s, dir: -1.3, size: 0.8 });
    const hand = (x, y, r) => paint(g, ell(x, y, r, r * 1.15), { base: C.skin, lite: C.skinLite, dark: C.skinDark, box: [x - r, y - r, 2 * r, 2 * r], k, seed: seed + x, size: 0.4 });
    const L0 = 224 + lean * 1.4, R0 = 376 + lean * 1.4;
    if (pose === 'behind') {
      sleeve(poly([[L0 - 32, 345], [L0 + 4, 345], [L0 + 2, 470], [L0 + 22, 560], [L0 - 8, 566], [L0 - 50, 470]]), 3);
      sleeve(poly([[R0 - 4, 345], [R0 + 32, 345], [R0 + 50, 470], [R0 + 8, 566], [R0 - 22, 560], [R0 - 2, 470]]), 4);
    } else if (pose === 'crossed') {
      sleeve(poly([[L0 - 32, 345], [L0 + 6, 345], [L0 + 30, 470], [L0 - 10, 480]]), 3);
      sleeve(poly([[R0 - 6, 345], [R0 + 32, 345], [R0 + 10, 480], [R0 - 30, 470]]), 4);
      sleeve(poly([[L0 - 8, 448], [R0 + 8, 440], [R0 + 6, 488], [L0 - 6, 496]]), 5);
      hand(R0 + 6, 452, 20); hand(L0 - 6, 470, 19);
    } else if (pose === 'sides' || pose === 'reach') {
      if (pose === 'sides') { sleeve(poly([[L0 - 34, 345], [L0 + 4, 345], [L0 - 22, 600], [L0 - 60, 596]]), 3); hand(L0 - 42, 622, 24); }
      sleeve(poly([[R0 - 4, 345], [R0 + 34, 345], [R0 + 62, 596], [R0 + 24, 600]]), 4); hand(R0 + 44, 622, 24);
    }
    // shoulders (epaulette hints)
    for (const x of [L0 - 10, R0 + 10]) paint(g, ell(x, 345, 34, 14), { base: C.navy, lite: C.navyLite, box: [x - 34, 331, 68, 28], k, seed: seed + x + 7, size: 0.3, rim: 0.4 });
    // neck + head seen from below (chin), faceless; cap brim underside + crown
    const hx = 300 + lean * 1.6;
    paint(g, rr(P(), hx - 22, 300, 44, 46, 10), { base: C.skinDark, box: [hx - 22, 300, 44, 46], k, seed: seed + 20, size: 0.3, rim: 0.4 });
    paint(g, ell(hx, 268, 46, 52), { base: C.skin, lite: C.skinLite, dark: C.skinDark, box: [hx - 46, 216, 92, 104], k, seed: seed + 21, light: [-0.4, 0.6], size: 0.4 });
    paint(g, ell(hx, 218, 74, 20), { base: C.ink, lite: '#4C545C', box: [hx - 74, 198, 148, 40], k, seed: seed + 22, rim: 0.4, size: 0.4, gloss: 0.6 });
    paint(g, poly([[hx - 64, 214], [hx + 64, 214], [hx + 80, 178], [hx - 80, 178]]), { base: C.ink, lite: '#3F464D', box: [hx - 80, 178, 160, 36], k, seed: seed + 23, size: 0.4 });
    paint(g, rr(P(), hx - 66, 200, 132, 10, 3), { base: C.brass, lite: C.brassLite, box: [hx - 66, 200, 132, 10], k, seed: seed + 24, size: 0.2, rim: 0 });
  });
}

/* ---------- reaching hand (back of the hand, fingers curled toward the lens) ---------- */
export const HAND = { w: 520, h: 520, wrist: [260, 470] };
export function reachHand(res) {
  return bake(HAND.w, HAND.h, res, (g, k) => {
    const sk = { base: C.skin, lite: C.skinLite, dark: C.skinDark, k, light: [-0.5, -0.8] };
    const back = rr(P(), 110, 170, 300, 300, 120);
    const thumb = capsule(130, 380, 50, 250, 84);
    shade(g, back, k, { dx: 10, dy: 22, blur: 20, alpha: 0.5 });
    paint(g, thumb, { ...sk, box: [10, 200, 170, 220], seed: 90, dir: -1, size: 0.6 });
    paint(g, back, { ...sk, box: [110, 170, 300, 300], seed: 91, dir: -1.2, size: 0.9 });
    [[150, 168, 50], [222, 150, 54], [298, 152, 54], [366, 172, 48]].forEach(([x, y, r], i) => paint(g, ell(x, y + 10, r * 0.9, r * 1.05), { ...sk, box: [x - r, y + 10 - r * 1.05, 2 * r, 2.1 * r], seed: 94 + i, dir: -1.4, size: 0.5, rim: 0.8 }));
    // fingertip creases (curled), knuckle line
    [[150, 168], [222, 150], [298, 152], [366, 172]].forEach(([x, y]) => strokeLine(g, [[x - 26, y + 36], [x, y + 46], [x + 26, y + 36]], C.skinDark, 7, 0.55));
    strokeLine(g, [[140, 250], [230, 236], [320, 238], [400, 256]], C.skinDark, 6, 0.3);
    // cuff with two rank stripes
    const cuff = rr(P(), 150, 430, 220, 90, 18);
    paint(g, cuff, { base: C.navy, lite: C.navyLite, box: [150, 430, 220, 90], k, seed: 92, size: 0.6 });
    for (const y of [452, 476]) paint(g, rr(P(), 152, y, 216, 10, 3), { base: C.brass, lite: C.brassLite, box: [152, y, 216, 10], k, seed: 93 + y, size: 0.2, rim: 0 });
  });
}

/* ---------- open hatch from below + ladder ---------- */
export const HATCH = { w: 700, h: 760, c: [350, 150], r: [190, 92] };
export function hatch(res) {
  return bake(HATCH.w, HATCH.h, res, (g, k) => {
    const [cx, cy] = HATCH.c, [a, b] = HATCH.r;
    // ladder rails + rungs, receding up into the hatch
    for (const x of [[230, 285], [470, 415]]) paint(g, poly([[x[0] - 18, 760], [x[0] + 18, 760], [x[1] + 9, 170], [x[1] - 9, 170]]), { base: C.steel, lite: C.steelLite, box: [Math.min(...x) - 18, 170, Math.abs(x[0] - x[1]) + 36, 590], k, seed: x[0], dir: -1.5, size: 0.6 });
    for (let i = 0; i < 6; i++) { const y = 700 - i * 100 + i * i * 6, w = 120 - i * 10; paint(g, rr(P(), cx - w, y, 2 * w, 18 - i * 1.5, 6), { base: C.steelLite, box: [cx - w, y, 2 * w, 18], k, seed: 100 + i, size: 0.4, rim: 0.4 }); }
    // coaming ring + the opening (sky = the field, lighter)
    const ring = ell(cx, cy, a + 34, b + 22);
    paint(g, ring, { base: C.steel, lite: C.steelLite, box: [cx - a - 34, cy - b - 22, 2 * a + 68, 2 * b + 44], k, seed: 110, gloss: 0.6, size: 0.8 });
    g.fillStyle = mix(C.fieldLite, C.cream, 0.18); g.fill(ell(cx, cy, a, b));
    // open lid on its hinge (to the right), with the wheel
    const lid = ell(cx + a + 80, cy - 40, 70, 150, -0.25);
    paint(g, lid, { base: C.steel, lite: C.steelLite, box: [cx + a + 10, cy - 190, 140, 300], k, seed: 111, size: 0.6 });
    g.strokeStyle = rgba(C.ink, 0.8); g.lineWidth = 10; g.beginPath(); g.ellipse(cx + a + 80, cy - 40, 34, 74, -0.25, 0, Math.PI * 2); g.stroke();
  });
}
export const HATCH_OPEN = { c: HATCH.c, r: HATCH.r };

/* ---------- surfaced submarine, side profile, with a tiny faceless figure on the sail ---------- */
export const SUBSIDE = { w: 1800, h: 420, water: 330 };
export function subSide(res) {
  return bake(SUBSIDE.w, SUBSIDE.h, res, (g, k) => {
    const sail = P(); sail.moveTo(700, 255); sail.lineTo(720, 110); sail.quadraticCurveTo(728, 90, 760, 88); sail.lineTo(930, 88); sail.quadraticCurveTo(958, 92, 962, 120); sail.lineTo(990, 255); sail.closePath();
    paint(g, sail, { base: C.hull, lite: C.hullLite, box: [700, 88, 290, 167], k, seed: 121, dir: -1.5, light: [-0.7, -0.7] });
    for (const [x, h] of [[790, 60], [830, 46], [880, 30]]) paint(g, rr(P(), x, 88 - h, 12, h, 4), { base: C.hull, lite: C.hullLite, box: [x, 88 - h, 12, h], k, seed: x, rim: 0.2, size: 0.3 });
    // tiny figure on the bridge (faceless, cap)
    paint(g, rr(P(), 850, 54, 26, 36, 8), { base: C.navy, lite: C.navyLite, box: [850, 54, 26, 36], k, seed: 122, size: 0.2, rim: 0.2 });
    paint(g, ell(863, 46, 10, 11), { base: C.skin, lite: C.skinLite, box: [853, 35, 20, 22], k, seed: 123, size: 0.15, rim: 0.2 });
    paint(g, rr(P(), 851, 33, 24, 7, 3), { base: C.ink, box: [851, 33, 24, 7], k, seed: 124, size: 0.15, rim: 0 });
    const hull = P(); hull.moveTo(40, 300); hull.quadraticCurveTo(80, 240, 260, 236); hull.lineTo(1500, 238); hull.quadraticCurveTo(1700, 250, 1790, 300); hull.lineTo(1790, SUBSIDE.water + 10); hull.lineTo(40, SUBSIDE.water + 10); hull.closePath();
    paint(g, hull, { base: C.hull, lite: C.hullLite, box: [40, 236, 1750, 104], k, seed: 125, dir: 0, light: [-0.4, -0.9], size: 1.1 });
    // waterline lap
    const R = rng(126);
    for (let i = 0; i < 40; i++) { const x = 30 + R() * 1760; g.strokeStyle = rgba(C.cream, 0.25 + R() * 0.3); g.lineWidth = 3 + R() * 4; g.beginPath(); g.moveTo(x, SUBSIDE.water + 6 + R() * 6); g.lineTo(x + 20 + R() * 40, SUBSIDE.water + 6 + R() * 6); g.stroke(); }
  });
}

/* ---------- sea band for the open-air ending ---------- */
export function seaBand(W, Hb, res, seed) {
  return bake(W, Hb, res, (g, k) => {
    paint(g, rr(P(), 0, 0, W, Hb + 10, 0), { base: C.fieldDeep, lite: C.field, dark: mix(C.fieldDeep, '#000000', 0.3), box: [0, 0, W, Hb], k, seed, dir: 0.0, light: [0, -1], size: 2.4, rim: 0, flow: 0.15 });
    const R = rng(seed + 9);
    for (let i = 0; i < 90; i++) { const y = Math.pow(R(), 1.6) * Hb, w = 20 + (y / Hb) * 120; g.strokeStyle = rgba(C.fieldLite, 0.25 + R() * 0.3); g.lineWidth = 2 + (y / Hb) * 8; g.lineCap = 'round'; g.beginPath(); const x = R() * W; g.moveTo(x, y); g.lineTo(x + w, y + (R() - 0.5) * 3); g.stroke(); }
  });
}
