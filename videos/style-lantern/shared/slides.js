// The five glass slides of the lecture. Each builder returns { el, update(t), spots } where `spots` are beam-px points
// for the lecturer's pointer. Builders take a times object T (scene-local seconds); a slide shown as the
// "previous" slide in the next scene is built with T = {} and updated with t = 1e6 (its final state).
import { el, rand } from '/onclack-styles/engine/lib/anim.js';
import { PAL, FONT, F, ez, tw, makeSlide, letter, wash, canvas, coverCard, blob } from './lantern.js';
import { progress } from '/onclack-styles/engine/lib/anim.js';

const LONG = 1e6;

/* ---------- drawings ---------- */
/** A Soviet naval officer's peaked cap, drawn as a plain engraving (no face, no person). */
export function drawCap(g, cx, cy, s, seed) {
  const lw = Math.max(1.6, s * 0.022);
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = PAL.ink; g.lineWidth = lw;
  // crown
  g.beginPath();
  g.moveTo(cx - 0.6 * s, cy - 0.12 * s);
  g.bezierCurveTo(cx - 0.66 * s, cy - 0.44 * s, cx + 0.66 * s, cy - 0.44 * s, cx + 0.6 * s, cy - 0.12 * s);
  g.bezierCurveTo(cx + 0.56 * s, cy + 0.0 * s, cx + 0.5 * s, cy + 0.06 * s, cx + 0.47 * s, cy + 0.08 * s);
  g.lineTo(cx - 0.47 * s, cy + 0.08 * s);
  g.bezierCurveTo(cx - 0.5 * s, cy + 0.06 * s, cx - 0.56 * s, cy + 0.0 * s, cx - 0.6 * s, cy - 0.12 * s);
  g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke();
  // the flat top of the crown seen from a little above, and engraved shading under its rim
  g.save(); g.clip();
  g.lineWidth = lw * 0.8;
  g.beginPath(); g.ellipse(cx, cy - 0.215 * s, 0.6 * s, 0.1 * s, 0, 0, Math.PI * 2); g.stroke();
  g.lineWidth = lw * 0.45;
  for (let i = 0; i < 7; i++) {
    const y = cy - 0.08 * s + i * 0.022 * s;
    g.beginPath(); g.moveTo(cx - 0.56 * s + i * 0.01 * s, y); g.quadraticCurveTo(cx - 0.3 * s, y + 0.02 * s, cx - 0.16 * s, y + 0.01 * s); g.stroke();
  }
  g.restore();
  // band (dark) with a pale piping line
  g.beginPath();
  g.moveTo(cx - 0.47 * s, cy + 0.08 * s); g.lineTo(cx + 0.47 * s, cy + 0.08 * s);
  g.quadraticCurveTo(cx + 0.47 * s, cy + 0.2 * s, cx + 0.44 * s, cy + 0.23 * s);
  g.quadraticCurveTo(cx, cy + 0.27 * s, cx - 0.44 * s, cy + 0.23 * s);
  g.quadraticCurveTo(cx - 0.47 * s, cy + 0.2 * s, cx - 0.47 * s, cy + 0.08 * s);
  g.fillStyle = PAL.ink; g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = lw * 0.6;
  g.beginPath(); g.moveTo(cx - 0.45 * s, cy + 0.11 * s); g.quadraticCurveTo(cx, cy + 0.14 * s, cx + 0.45 * s, cy + 0.11 * s); g.stroke();
  // visor
  g.beginPath();
  g.moveTo(cx - 0.44 * s, cy + 0.23 * s);
  g.quadraticCurveTo(cx, cy + 0.27 * s, cx + 0.44 * s, cy + 0.23 * s);
  g.quadraticCurveTo(cx + 0.3 * s, cy + 0.42 * s, cx, cy + 0.43 * s);
  g.quadraticCurveTo(cx - 0.3 * s, cy + 0.42 * s, cx - 0.44 * s, cy + 0.23 * s);
  g.fillStyle = PAL.ink; g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = lw * 0.5;
  g.beginPath(); g.moveTo(cx - 0.25 * s, cy + 0.33 * s); g.quadraticCurveTo(cx, cy + 0.38 * s, cx + 0.22 * s, cy + 0.34 * s); g.stroke();
  // cockade with a small wreath
  g.strokeStyle = PAL.ink; g.lineWidth = lw;
  g.beginPath(); g.ellipse(cx, cy - 0.02 * s, 0.07 * s, 0.085 * s, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.stroke();
  g.lineWidth = lw * 0.7;
  for (const sgn of [-1, 1]) {
    g.beginPath(); g.moveTo(cx + sgn * 0.09 * s, cy + 0.05 * s);
    g.quadraticCurveTo(cx + sgn * 0.2 * s, cy - 0.02 * s, cx + sgn * 0.16 * s, cy - 0.12 * s); g.stroke();
    for (let k = 0; k < 4; k++) {
      const yy = cy + 0.03 * s - k * 0.04 * s, xx = cx + sgn * (0.12 + k * 0.012) * s;
      g.beginPath(); g.ellipse(xx, yy, 0.02 * s, 0.009 * s, sgn * 0.7, 0, Math.PI * 2); g.stroke();
    }
  }
  g.restore();
}

/** An engraver's double-ruled oval frame. */
function ovalFrame(g, cx, cy, rx, ry, lw) {
  g.save(); g.strokeStyle = PAL.ink;
  g.lineWidth = lw * 1.6; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
  g.lineWidth = lw * 0.6; g.beginPath(); g.ellipse(cx, cy, rx * 0.93, ry * 0.95, 0, 0, Math.PI * 2); g.stroke();
  g.restore();
}

/** Hand-ruled line (a pen along a ruler that slips a little). */
function ruled(g, x0, y0, x1, y1, lw, seed) {
  g.save(); g.strokeStyle = PAL.ink; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0, y0);
  const n = 12;
  for (let i = 1; i <= n; i++) { const p = i / n; g.lineTo(x0 + (x1 - x0) * p, y0 + (y1 - y0) * p + (rand(seed + i) - 0.5) * lw * 0.6); }
  g.stroke(); g.restore();
}

/** Sea-going destroyer in profile, as a small diagram silhouette (generic, not a specific ship). */
function drawShip(g, x, y, s) {
  g.save(); g.fillStyle = PAL.ink; g.beginPath();
  g.moveTo(x - 0.5 * s, y - 0.06 * s); g.lineTo(x + 0.5 * s, y - 0.08 * s); g.lineTo(x + 0.42 * s, y + 0.04 * s); g.lineTo(x - 0.44 * s, y + 0.04 * s); g.closePath(); g.fill();
  g.fillRect(x - 0.18 * s, y - 0.16 * s, 0.26 * s, 0.1 * s);
  g.fillRect(x - 0.05 * s, y - 0.25 * s, 0.07 * s, 0.1 * s);
  g.fillRect(x + 0.14 * s, y - 0.13 * s, 0.06 * s, 0.07 * s);
  g.fillRect(x - 0.012 * s, y - 0.36 * s, 0.018 * s, 0.13 * s);
  g.restore();
}

/** Submarine hull in profile for the section diagram. */
function drawHull(g, x, y, s) {
  g.save(); g.fillStyle = PAL.ink; g.beginPath();
  g.ellipse(x, y, 0.5 * s, 0.07 * s, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(x - 0.12 * s, y - 0.05 * s); g.lineTo(x - 0.1 * s, y - 0.16 * s); g.lineTo(x + 0.08 * s, y - 0.16 * s); g.lineTo(x + 0.12 * s, y - 0.05 * s); g.closePath(); g.fill();
  g.restore();
}

/** Side elevation of a torpedo (diagram, proportions approximate). Returns the warhead box. */
function drawTorpedo(g, x, y, len, seed) {
  const d = len * 0.075, lw = Math.max(1.6, len * 0.0032);
  g.save(); g.strokeStyle = PAL.ink; g.lineWidth = lw; g.lineJoin = 'round';
  const nose = x + len * 0.12;
  const body = new Path2D();
  body.moveTo(nose, y - d / 2); body.lineTo(x + len * 0.9, y - d / 2);
  body.quadraticCurveTo(x + len * 0.97, y - d * 0.35, x + len, y - d * 0.12); body.lineTo(x + len, y + d * 0.12);
  body.quadraticCurveTo(x + len * 0.97, y + d * 0.35, x + len * 0.9, y + d / 2); body.lineTo(nose, y + d / 2);
  body.bezierCurveTo(x + len * 0.04, y + d / 2, x, y + d * 0.15, x, y); body.bezierCurveTo(x, y - d * 0.15, x + len * 0.04, y - d / 2, nose, y - d / 2);
  g.fillStyle = '#fff'; g.fill(body); g.stroke(body);
  // section joints
  for (const f of [0.3, 0.55, 0.72]) ruled(g, x + len * f, y - d / 2, x + len * f, y + d / 2, lw * 0.8, seed + f * 10);
  // fins + screws
  g.fillStyle = PAL.ink;
  g.beginPath(); g.moveTo(x + len * 0.93, y - d * 0.4); g.lineTo(x + len * 0.99, y - d * 0.95); g.lineTo(x + len * 1.0, y - d * 0.4); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x + len * 0.93, y + d * 0.4); g.lineTo(x + len * 0.99, y + d * 0.95); g.lineTo(x + len * 1.0, y + d * 0.4); g.closePath(); g.fill();
  g.fillRect(x + len * 1.0, y - d * 0.5, len * 0.008, d);
  // engraved shading along the lower half of the body
  g.save(); g.clip(body); g.lineWidth = lw * 0.45;
  for (let i = 0; i < 110; i++) { const xx = x + len * (0.02 + i * 0.0089); g.beginPath(); g.moveTo(xx, y + d * 0.12); g.lineTo(xx + d * 0.08, y + d / 2); g.stroke(); }
  g.restore();
  g.restore();
  return { x: x + len * 0.005, y: y - d / 2, w: len * 0.295, h: d, tip: [x, y] };
}

/* ---------- slide 1: the map ---------- */
export async function slideMap(parent, ctx, P, T = {}) {
  const L = ctx.layout, G = P.G, u = Math.min(G.w, G.h);
  const geo = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const win = L.pick({ landscape: { x: 0.07, y: 0.075, w: 0.86, h: 0.8, shape: 'round' }, portrait: { x: 0.075, y: 0.06, w: 0.85, h: 0.83, shape: 'round' } });
  const W = { x: win.x * G.w, y: win.y * G.h, w: win.w * G.w, h: win.h * G.h };
  const c0 = L.pick({ landscape: [-76.6, 23.4], portrait: [-75.4, 23.2] });
  const span = L.pick({ landscape: 24, portrait: 15.5 });
  const kc = Math.cos(c0[1] * Math.PI / 180), k = W.w / (span * kc);
  const proj = (lon, lat) => [W.x + W.w / 2 + (lon - c0[0]) * k * kc, W.y + W.h / 2 - (lat - c0[1]) * k];
  const sub = [-70.6, 25.2];
  const landPath = () => {
    const p = new Path2D();
    for (const f of geo.features) for (const r of f.rings) r.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? p.lineTo(x, y) : p.moveTo(x, y); });
    return p;
  };
  const cubaPath = () => {
    const p = new Path2D();
    for (const f of geo.features.filter(f => f.name === 'Cuba')) for (const r of f.rings) { r.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? p.lineTo(x, y) : p.moveTo(x, y); }); p.closePath(); }
    return p;
  };
  const S = makeSlide(parent, L, {
    w: G.w, h: G.h, seed: 11, name: '1 Map slide', num: 'No. 1', catalogue: 'Atlantic approaches — Oct. ’62',
    windows: [win],
    paint(g) {
      const land = landPath(), gap = u * 0.0105;
      // water-lining (engraved lines parallel to the coast)
      const wl = canvas(G.w, G.h), w = wl.getContext('2d');
      w.fillStyle = '#fff'; w.fillRect(0, 0, G.w, G.h); w.lineJoin = 'round';
      for (let i = 4; i >= 1; i--) {
        w.strokeStyle = `rgba(30,24,18,${0.42 - i * 0.07})`; w.lineWidth = 2 * i * gap; w.stroke(land);
        w.strokeStyle = '#fff'; w.lineWidth = 2 * i * gap - Math.max(1.4, u * 0.0016); w.stroke(land);
      }
      g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(wl, 0, 0); g.restore();
      // land: clean white, fine horizontal hatching, inked coast
      g.fillStyle = '#fff'; g.fill(land);
      g.save(); g.clip(land); g.strokeStyle = 'rgba(25,20,14,0.38)'; g.lineWidth = Math.max(1, u * 0.0011);
      for (let y = 0; y < G.h; y += u * 0.0062) { g.beginPath(); g.moveTo(0, y); g.lineTo(G.w, y + u * 0.002); g.stroke(); }
      g.restore();
      // hand tints: sea blue (stops short of the coast, unevenly), Cuba amber
      wash(g, G.w, G.h, t => { t.beginPath(); t.rect(W.x - 10, W.y - 10, W.w + 20, W.h + 20); }, PAL.blue, 21, {
        alpha: 0.62, angle: -0.35, streak: 0.09, gap: 5,
        keepOut: t => { t.lineJoin = 'round'; t.lineWidth = u * 0.011; t.stroke(land); t.fill(land); },
      });
      // Cuba: amber laid with a slightly bigger brush than the coast (it spills a little into the sea)
      {
        const c = canvas(G.w, G.h), t = c.getContext('2d'); const cp = cubaPath();
        t.strokeStyle = t.fillStyle = PAL.amber; t.lineJoin = 'round';
        t.globalAlpha = 0.5; t.lineWidth = u * 0.006; t.fill(cp); t.stroke(cp);
        t.translate(u * 0.002, -u * 0.0015); t.globalAlpha = 0.45; t.fill(cp);
        g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(c, 0, 0); g.restore();
      }
      g.strokeStyle = PAL.ink; g.lineWidth = Math.max(1.6, u * 0.0022); g.lineJoin = 'round'; g.stroke(land);
      // B-59 mark: inked ring + cross
      const [mx, my] = proj(...sub), r = u * 0.014;
      g.lineWidth = Math.max(2, u * 0.0028);
      g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(mx - r * 1.7, my); g.lineTo(mx + r * 1.7, my); g.moveTo(mx, my - r * 1.7); g.lineTo(mx, my + r * 1.7); g.stroke();
    },
  });
  // lettering on the glass
  const at = (ll, dx = 0, dy = 0) => { const [x, y] = proj(...ll); return [x + dx, y + dy]; };
  const sz = f => u * f;
  const lab = [];
  const put = (text, ll, o) => { const [x, y] = at(ll); const n = letter(S.el, text, { x, y, ...o }); n.style.transform = `translate(${o.ax ?? -50}%, -50%)`; n.style.whiteSpace = 'nowrap'; lab.push(n); return n; };
  put('CUBA', [-79.4, 21.75], { name: '1 Label Cuba', size: sz(0.046), track: 0.16, seed: 31 });
  put('FLORIDA', L.landscape ? [-83.6, 30.5] : [-82.2, 30.6], { name: '1 Label Florida', size: sz(0.03), track: 0.14, seed: 32 });
  put('BAHAMAS', L.landscape ? [-75.6, 27.4] : [-76.0, 27.5], { name: '1 Label Bahamas', size: sz(0.026), track: 0.14, seed: 33 });
  put('Atlantic Ocean', L.landscape ? [-68.4, 29.2] : [-71.6, 30.3], { name: '1 Label Atlantic', size: sz(0.04), italic: true, seed: 34 });
  put('B-59 · position approx.', [sub[0], sub[1] - (L.landscape ? 1.05 : 1.1)], { name: '1 Label B-59', size: sz(0.034), italic: true, seed: 35, ax: L.landscape ? -50 : -78 });
  // title, lettered in the clear sea at the bottom left
  const title = letter(S.el, 'Saturday, 27 October 1962', {
    name: '1 Title date', x: W.x + W.w * 0.045, y: W.y + W.h * L.pick({ landscape: 0.83, portrait: 0.86 }), size: sz(L.pick({ landscape: 0.07, portrait: 0.074 })), seed: 36,
    width: L.portrait ? W.w * 0.9 : null, style: { whiteSpace: L.portrait ? 'normal' : 'nowrap' },
  });
  void title;
  return {
    el: S.el,
    spots: { sub: at(sub), cuba: at([-78.6, 21.2]) },
    update() {},
  };
}

/* ---------- slide 2: the photograph + a slipping-glass diagram ---------- */
export async function slidePhoto(parent, ctx, P, T = {}) {
  const L = ctx.layout, G = P.G, u = Math.min(G.w, G.h);
  const img = new Image(); img.src = ctx.asset('assets/b59-surfaced-1962.jpg'); await img.decode();
  const wins = L.pick({
    landscape: [{ x: 0.06, y: 0.075, w: 0.585, h: 0.8, shape: 'dome' }, { x: 0.675, y: 0.075, w: 0.265, h: 0.8, shape: 'rect' }],
    portrait: [{ x: 0.075, y: 0.055, w: 0.85, h: 0.47, shape: 'dome' }, { x: 0.075, y: 0.555, w: 0.85, h: 0.345, shape: 'rect' }],
  });
  const A = { x: wins[0].x * G.w, y: wins[0].y * G.h, w: wins[0].w * G.w, h: wins[0].h * G.h };
  const B = { x: wins[1].x * G.w, y: wins[1].y * G.h, w: wins[1].w * G.w, h: wins[1].h * G.h };
  const capH = A.h * L.pick({ landscape: 0.2, portrait: 0.24 });
  const ph = { x: A.x, y: A.y, w: A.w, h: A.h - capH };
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(ph.w / iw, ph.h / ih) * 1.04;
  const ox = Math.min(ph.x, Math.max(ph.x + ph.w - iw * s, ph.x + ph.w / 2 - iw * s * 0.51));
  const oy = Math.min(ph.y, Math.max(ph.y + ph.h - ih * s, ph.y + ph.h / 2 - ih * s * 0.56));
  const I = (x, y) => [ox + x * s, oy + y * s];
  const lw = Math.max(1.6, u * 0.0024);
  // diagram geometry (inside window B)
  const lab = L.pick({ landscape: 0.15, portrait: 0.16 });
  const surfY = B.y + B.h * L.pick({ landscape: 0.25, portrait: 0.3 });
  const boatY = B.y + B.h * L.pick({ landscape: 0.6, portrait: 0.66 });
  const seaBottom = B.y + B.h * L.pick({ landscape: 0.7, portrait: 0.78 });
  const shipXs = [0.24, 0.52, 0.8].map(f => B.x + B.w * f);
  const shipS = Math.min(B.w * 0.27, u * 0.1);
  const chargeY0 = surfY + shipS * 0.06, chargeY1 = boatY - u * L.pick({ landscape: 0.075, portrait: 0.05 });
  const depths = [0, 0.18, 0.08].map(d => d * (chargeY1 - chargeY0));

  const S = makeSlide(parent, L, {
    w: G.w, h: G.h, seed: 12, name: '2 Photo slide', num: 'No. 2', catalogue: 'B-59 · U.S. Navy photograph · Atlantic',
    windows: wins,
    paint(g) {
      // the photograph (b/w, printed on the slide by contact, so it stays itself)
      g.save(); g.beginPath(); g.rect(ph.x, ph.y, ph.w, ph.h); g.clip();
      g.filter = 'grayscale(1) contrast(1.12) brightness(1.03)';
      g.drawImage(img, ox, oy, iw * s, ih * s); g.filter = 'none';
      // tints laid by hand: sea blue, sky a pale amber, the hull and the helicopter left bare
      const hull = [[345, 372], [395, 364], [440, 377], [446, 420], [560, 428], [680, 436], [716, 449], [713, 465], [680, 471], [560, 459], [440, 447], [360, 437], [338, 424]];
      const poly = (t, pts) => { pts.forEach(([x, y], i) => { const [X, Y] = I(x, y); i ? t.lineTo(X, Y) : t.moveTo(X, Y); }); t.closePath(); };
      wash(g, G.w, G.h, t => { t.beginPath(); poly(t, [[-20, 205], [300, 202], [640, 199], [970, 198], [970, 760], [-20, 760]]); }, PAL.blue, 41, {
        alpha: 0.72, angle: 0.05, streak: 0.12, gap: 6,
        keepOut: t => { t.beginPath(); poly(t, hull); t.lineJoin = 'round'; t.lineWidth = 5; t.stroke(); t.fill(); },
      });
      wash(g, G.w, G.h, t => { t.beginPath(); poly(t, [[-20, -20], [970, -20], [970, 186], [640, 184], [300, 187], [-20, 189]]); }, PAL.amber, 43, {
        alpha: 0.4, angle: 0.1, streak: 0.08, gap: 7, rim: 0.15,
        keepOut: t => { const [hx, hy] = I(540, 208); t.beginPath(); t.ellipse(hx, hy, 46 * s, 22 * s, 0, 0, Math.PI * 2); t.fill(); },
      });
      g.restore();
      // a hand-ruled line closing the photograph off from the lettering strip
      ruled(g, A.x + A.w * 0.05, ph.y + ph.h + capH * 0.08, A.x + A.w * 0.95, ph.y + ph.h + capH * 0.08, lw, 61);

      // diagram window: sea surface, ships, the boat, a light wash for the water, "not to scale"
      g.save(); g.beginPath(); g.rect(B.x, B.y, B.w, B.h); g.clip();
      wash(g, G.w, G.h, t => { t.beginPath(); t.rect(B.x - 8, surfY, B.w + 16, seaBottom - surfY); }, PAL.blue, 45, { alpha: 0.55, angle: -0.6, streak: 0.12, gap: 4 });
      ruled(g, B.x + B.w * 0.03, surfY, B.x + B.w * 0.97, surfY, lw * 1.3, 62);
      for (let i = 1; i <= 3; i++) ruled(g, B.x + B.w * 0.08, surfY + i * (seaBottom - surfY) / 4.2, B.x + B.w * 0.92, surfY + i * (seaBottom - surfY) / 4.2, lw * 0.45, 63 + i);
      shipXs.forEach(x => drawShip(g, x, surfY - shipS * 0.04, shipS));
      drawHull(g, B.x + B.w * 0.5, boatY, Math.min(B.w * 0.62, u * 0.25));
      ruled(g, B.x + B.w * 0.05, B.y + B.h * L.pick({ landscape: 0.8, portrait: 0.82 }), B.x + B.w * 0.95, B.y + B.h * L.pick({ landscape: 0.8, portrait: 0.82 }), lw, 66);
      g.restore();
    },
  });

  // lettering
  letter(S.el, 'B-59 on the surface, 28–29 Oct. 1962', { name: '2A Photo caption', x: A.x + A.w * 0.05, y: ph.y + ph.h + capH * 0.2, size: u * L.pick({ landscape: 0.044, portrait: 0.046 }), seed: 51, style: { whiteSpace: 'nowrap' } });
  letter(S.el, 'U.S. Navy photograph · NARA 428-N-711200', { name: '2A Photo credit', x: A.x + A.w * 0.05, y: ph.y + ph.h + capH * L.pick({ landscape: 0.58, portrait: 0.6 }), size: u * 0.028, italic: true, seed: 52, style: { whiteSpace: 'nowrap' } });
  const dLab = letter(S.el, L.landscape ? 'Practice\ndepth charges' : 'Practice depth charges', { name: '2B Diagram label', x: B.x + B.w * 0.06, y: B.y + B.h * 0.035, size: u * 0.04, seed: 53, lineHeight: 0.98 });
  void dLab; void lab;
  letter(S.el, L.landscape ? 'diagram,\nnot to scale' : 'diagram, not to scale', { name: '2B Diagram note', x: B.x + B.w * (L.landscape ? 0.06 : 0.62), y: L.landscape ? boatY + u * 0.04 : B.y + B.h * 0.07, size: u * 0.024, italic: true, seed: 54, lineHeight: 1 });
  const mosY = B.y + B.h * L.pick({ landscape: 0.83, portrait: 0.855 });
  const mos = letter(S.el, L.landscape ? 'Moscow:\nsilent for days.' : 'Moscow: silent for days.', { name: '2C Moscow line', x: B.x + B.w * 0.06, y: mosY, size: u * L.pick({ landscape: 0.042, portrait: 0.05 }), seed: 55, lineHeight: 1.0 });
  void mos;

  // slipping glass: three charges painted on a strip that the lecturer slides down with a lever
  const slipBox = el('div', { 'data-name': '2B Slipping glass (charges)', style: { position: 'absolute', left: B.x + 'px', top: B.y + 'px', width: B.w + 'px', height: B.h + 'px', overflow: 'hidden' } }, S.el);
  const sc = canvas(B.w, B.h), sg = sc.getContext('2d');
  Object.assign(sc.style, { position: 'absolute', left: 0, top: 0 });
  slipBox.appendChild(sc);
  const cw = u * 0.016, ch = u * 0.022;
  shipXs.forEach((x, i) => {
    const cx = x - B.x + (rand(70 + i) - 0.5) * cw, cy = chargeY0 - B.y + depths[i] * 0 + ch;
    sg.fillStyle = PAL.ink; sg.beginPath(); sg.roundRect(cx - cw / 2, cy - ch / 2 + depths[i] * -0, cw, ch, cw * 0.3); sg.fill();
  });
  // second glass, dropped into the same carrier: burst rings, amber washed (superimposed like a dissolving view)
  const burstBox = el('div', { 'data-name': '2B Burst glass', style: { position: 'absolute', left: B.x + 'px', top: B.y + 'px', width: B.w + 'px', height: B.h + 'px', overflow: 'hidden' } }, S.el);
  const bursts = shipXs.map((x, i) => {
    const bx = x - B.x, by = chargeY1 - B.y - depths[i] * 0.6;
    const c = canvas(u * 0.16, u * 0.16), bg = c.getContext('2d'), R = u * 0.08;
    bg.translate(R, R);
    bg.fillStyle = PAL.amber; bg.globalAlpha = 0.8;
    bg.beginPath();
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, rr = R * (k % 2 ? 0.45 : 0.85 + rand(80 + i * 9 + k) * 0.12); k ? bg.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : bg.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    bg.closePath(); bg.fill();
    bg.globalAlpha = 1; bg.strokeStyle = PAL.ink; bg.lineWidth = Math.max(1.5, u * 0.0024);
    bg.beginPath(); bg.arc(0, 0, R * 0.32, 0, Math.PI * 2); bg.stroke();
    Object.assign(c.style, { position: 'absolute', left: bx - R + 'px', top: by - R + 'px', mixBlendMode: 'multiply', opacity: 0 });
    burstBox.appendChild(c);
    return { c, i };
  });
  const card = coverCard(S.el, L, { name: '2C Cover card', x: B.x - u * 0.01, y: mosY - u * 0.015, w: B.w + u * 0.02, h: B.y + B.h - mosY + u * 0.03, soft: 4 });

  const tDrop = T.drop ?? -LONG, tBurst = T.burst ?? -LONG, tMos = T.moscow ?? -LONG;
  return {
    el: S.el,
    bursts: [0, 8 * F, 15 * F].map(d => tBurst + d),
    update(t) {
      // lever: one slide down, a hand's uneven speed, a small knock at the stop
      const p = progress(t, tDrop, tDrop + 1.0);
      const e = ez.move(p) + (p >= 1 ? Math.exp(-(t - tDrop - 1) * 18) * Math.sin((t - tDrop - 1) * 40) * 0.01 : 0);
      sc.style.transform = `translateY(${((chargeY1 - chargeY0) * e).toFixed(2)}px)`;
      bursts.forEach(b => {
        const tb = tBurst + [0, 8 * F, 15 * F][b.i];
        const q = progress(t, tb, tb + 4 * F);
        b.c.style.opacity = q.toFixed(3);
        b.c.style.transform = `scale(${(0.82 + 0.18 * ez.enter(progress(t, tb, tb + 8 * F))).toFixed(3)})`;
      });
      sc.style.opacity = t > tBurst + 15 * F + 6 * F ? 0.0 : 1;      // the charges are gone once the last burst lands
      card.update(t, tMos - 3 * F, 9 * F, B.w * 1.15);
    },
  };
}

/* ---------- slide 3: the torpedo and the three officers ---------- */
export function slideVote(parent, ctx, P, T = {}) {
  const L = ctx.layout, G = P.G, u = Math.min(G.w, G.h);
  const win = L.pick({ landscape: { x: 0.06, y: 0.075, w: 0.88, h: 0.8, shape: 'round' }, portrait: { x: 0.075, y: 0.055, w: 0.85, h: 0.845, shape: 'round' } });
  const W = { x: win.x * G.w, y: win.y * G.h, w: win.w * G.w, h: win.h * G.h };
  const torp = { x: W.x + W.w * 0.08, y: W.y + W.h * L.pick({ landscape: 0.29, portrait: 0.2 }), len: W.w * 0.82 };
  const rowY = W.y + W.h * L.pick({ landscape: 0.64, portrait: 0.6 });
  const cols = L.pick({ landscape: [0.2, 0.5, 0.8], portrait: [0.19, 0.5, 0.81] }).map(f => W.x + W.w * f);
  const ovR = L.pick({ landscape: [W.w * 0.085, W.h * 0.17], portrait: [W.w * 0.13, W.h * 0.09] });
  const dT = torp.len * 0.075;
  const head = { x: torp.x + torp.len * 0.005, y: torp.y - dT / 2, w: torp.len * 0.295, h: dT, tip: [torp.x, torp.y] };
  const S = makeSlide(parent, L, {
    w: G.w, h: G.h, seed: 13, name: '3 Vote slide', num: 'No. 3', catalogue: 'B-59 · the weapon and the vote',
    windows: [win],
    paint(g) {
      drawTorpedo(g, torp.x, torp.y, torp.len, 71);
      // warhead: hatched in section + amber wash (the only tint on this slide besides the votes)
      g.save(); g.beginPath(); g.rect(head.x, head.y, head.w, head.h); g.clip();
      g.strokeStyle = PAL.ink; g.lineWidth = Math.max(1, u * 0.0016);
      for (let i = -20; i < 60; i++) { g.beginPath(); g.moveTo(head.x + i * u * 0.008, head.y); g.lineTo(head.x + i * u * 0.008 - head.h, head.y + head.h); g.stroke(); }
      g.restore();
      wash(g, G.w, G.h, t => { t.beginPath(); blob(t, head.x + head.w * 0.5, head.y + head.h * 0.5, head.w * 0.56, head.h * 0.8, 74, -0.03); }, PAL.amber, 73, { alpha: 0.85, streak: 0.1, gap: 5 });
      // three officers: an oval cartouche with a peaked cap each (no faces), ruled base line
      cols.forEach((x, i) => {
        ovalFrame(g, x, rowY, ovR[0], ovR[1], Math.max(1.6, u * 0.0022));
        drawCap(g, x, rowY - ovR[1] * 0.05, ovR[0] * 1.15, 90 + i);
      });
    },
  });
  const sz = f => u * f;
  letter(S.el, 'On board: one nuclear torpedo', { name: '3 Title', x: W.x + W.w * 0.06, y: W.y + W.h * 0.035, size: sz(L.pick({ landscape: 0.056, portrait: 0.054 })), seed: 81, width: L.portrait ? W.w * 0.9 : null });
  letter(S.el, L.landscape ? 'warhead (approx. 10 kilotons) · diagram, proportions approx.' : 'warhead, approx. 10 kt · diagram', {
    name: '3 Torpedo note', x: W.x + W.w * 0.08, y: torp.y + torp.len * 0.075 * 0.5 + sz(0.03), size: sz(L.pick({ landscape: 0.028, portrait: 0.034 })), italic: true, seed: 82, style: { whiteSpace: 'nowrap' } });
  const roles = ['Captain', 'Political officer', 'Brigade chief of staff'];
  const roleNodes = cols.map((x, i) => {
    const n = letter(S.el, roles[i], { name: `3 Officer ${i + 1} role`, x, y: rowY + ovR[1] + sz(0.022), size: sz(L.pick({ landscape: 0.034, portrait: 0.038 })), seed: 83 + i, align: 'center' });
    n.style.transform = 'translateX(-50%)'; n.style.whiteSpace = L.portrait && i === 2 ? 'normal' : 'nowrap';
    if (L.portrait && i === 2) { n.style.width = W.w * 0.3 + 'px'; }
    return n;
  });
  void roleNodes;
  // slipping glass: two "yes" marks, amber-washed, pushed into register under officers 1 and 2
  const slip = el('div', { 'data-name': '3 Slipping glass (votes)', style: { position: 'absolute', left: 0, top: 0, width: G.w + 'px', height: G.h + 'px' } }, S.el);
  const slipClip = el('div', { style: { position: 'absolute', left: W.x + 'px', top: W.y + 'px', width: W.w + 'px', height: W.h + 'px', overflow: 'hidden' } }, S.el);
  slipClip.appendChild(slip); slip.style.left = -W.x + 'px'; slip.style.top = -W.y + 'px';
  const yesNodes = [0, 1].map(i => {
    const x = cols[i], y = rowY + ovR[1] * 0.25;
    const c = canvas(sz(0.2), sz(0.1)), cg = c.getContext('2d');
    wash(cg, c.width, c.height, t => { t.beginPath(); blob(t, c.width / 2, c.height / 2, c.width * 0.42, c.height * 0.36, 96 + i, -0.06); }, PAL.amber, 95 + i, { alpha: 0.95, streak: 0.06, gap: 4 });
    // wash() multiplies onto a transparent canvas → paint it opaque first
    Object.assign(c.style, { position: 'absolute', left: x - c.width / 2 + 'px', top: y - c.height / 2 + 'px', mixBlendMode: 'multiply' });
    slip.appendChild(c);
    const n = letter(slip, 'yes', { name: `3 Vote ${i + 1} yes`, x, y, size: sz(0.062), italic: true, seed: 97 + i });
    n.style.transform = 'translate(-50%, -55%)';
    return { c, n };
  });
  void yesNodes;
  const card = coverCard(S.el, L, { name: '3 Cover card', x: W.x - sz(0.01), y: rowY - ovR[1] - sz(0.02), w: W.w + sz(0.02), h: W.y + W.h - (rowY - ovR[1]) + sz(0.04), soft: 5 });
  const tThree = T.three ?? -LONG, tTwo = T.two ?? -LONG;
  const travel = W.w * 0.36;
  return {
    el: S.el,
    spots: { warhead: [head.x + head.w * 0.45, head.y + head.h * 0.8], tip: head.tip, third: [cols[2] + ovR[0] * 0.3, rowY + ovR[1] * 0.55] },
    update(t) {
      card.update(t, tThree - 4 * F, 12 * F, 0, W.h * 0.62);
      const p = ez.move(progress(t, tTwo - 3 * F, tTwo + 9 * F));
      slip.style.transform = `translateX(${(-travel * (1 - p)).toFixed(2)}px)`;
      slip.style.display = p <= 0 ? 'none' : '';
    },
  };
}

/* ---------- slide 4: the third officer — "No." ---------- */
export function slideNo(parent, ctx, P, T = {}) {
  const L = ctx.layout, G = P.G, u = Math.min(G.w, G.h);
  const win = L.pick({ landscape: { x: 0.06, y: 0.075, w: 0.88, h: 0.8, shape: 'round' }, portrait: { x: 0.075, y: 0.055, w: 0.85, h: 0.845, shape: 'round' } });
  const W = { x: win.x * G.w, y: win.y * G.h, w: win.w * G.w, h: win.h * G.h };
  const ov = L.pick({
    landscape: { x: W.x + W.w * 0.22, y: W.y + W.h * 0.47, rx: W.w * 0.15, ry: W.h * 0.34 },
    portrait: { x: W.x + W.w * 0.5, y: W.y + W.h * 0.2, rx: W.w * 0.2, ry: W.h * 0.14 },
  });
  const noBox = L.pick({
    landscape: { x: W.x + W.w * 0.44, y: W.y + W.h * 0.42, w: W.w * 0.5, h: W.h * 0.48 },
    portrait: { x: W.x + W.w * 0.08, y: W.y + W.h * 0.6, w: W.w * 0.84, h: W.h * 0.3 },
  });
  const S = makeSlide(parent, L, {
    w: G.w, h: G.h, seed: 14, name: '4 No slide', num: 'No. 4', catalogue: 'V. A. Arkhipov — the third vote',
    windows: [win],
    paint(g) {
      ovalFrame(g, ov.x, ov.y, ov.rx, ov.ry, Math.max(2, u * 0.0028));
      drawCap(g, ov.x, ov.y - ov.ry * 0.04, ov.rx * 1.15, 99);
      // carmine wash laid where the answer will be lettered — the one strong colour of the lecture
      wash(g, G.w, G.h, t => {
        t.beginPath();
        const cx = noBox.x + noBox.w * L.pick({ landscape: 0.36, portrait: 0.5 }), cy = noBox.y + noBox.h * 0.55;
        blob(t, cx, cy, noBox.w * L.pick({ landscape: 0.42, portrait: 0.38 }), noBox.h * 0.44, 103, -0.08);
      }, PAL.carmine, 101, { alpha: 0.95, streak: 0.12, gap: 7, angle: -0.5, rim: 0.3 });
      ruled(g, noBox.x, noBox.y - u * 0.012, noBox.x + noBox.w * 0.9, noBox.y - u * 0.012, Math.max(1.6, u * 0.0024), 102);
    },
  });
  const sz = f => u * f;
  const nameX = L.pick({ landscape: W.x + W.w * 0.44, portrait: W.x + W.w * 0.08 });
  letter(S.el, 'the third officer', { name: '4 Kicker', x: nameX, y: W.y + W.h * L.pick({ landscape: 0.1, portrait: 0.385 }), size: sz(0.044), italic: true, seed: 111 });
  const nameY = W.y + W.h * L.pick({ landscape: 0.17, portrait: 0.43 });
  const nm = letter(S.el, 'Vasili Arkhipov', { name: '4 Name', x: nameX, y: nameY, size: sz(L.pick({ landscape: 0.092, portrait: 0.1 })), seed: 112, style: { whiteSpace: 'nowrap' } });
  void nm;
  letter(S.el, 'brigade chief of staff, aboard B-59', { name: '4 Role', x: nameX, y: W.y + W.h * L.pick({ landscape: 0.3, portrait: 0.535 }), size: sz(0.03), italic: true, seed: 113, style: { whiteSpace: 'nowrap' } });
  const no = letter(S.el, 'No.', { name: '4 No', x: noBox.x + noBox.w * L.pick({ landscape: 0.36, portrait: 0.5 }), y: noBox.y + noBox.h * 0.55, size: sz(L.pick({ landscape: 0.3, portrait: 0.3 })), seed: 114, jitter: 0.6, lineHeight: 1 });
  no.style.transform = 'translate(-50%, -54%)'; no.style.whiteSpace = 'nowrap';
  const card = coverCard(S.el, L, { name: '4 Cover card', x: noBox.x - sz(0.03), y: noBox.y + sz(0.002), w: noBox.w + sz(0.06), h: noBox.h + sz(0.03), soft: 5 });
  const tNo = T.no ?? -LONG;
  return {
    el: S.el,
    spots: { no: [noBox.x + noBox.w * 0.6, noBox.y + noBox.h * 0.75], name: [nameX + W.w * L.pick({ landscape: 0.3, portrait: 0.45 }), nameY + sz(0.1) * 1.02] },
    update(t) { card.update(t, tNo - 4 * F, 6 * F, 0, noBox.h * 1.25); },
  };
}

/* ---------- slide 5 (second lantern): forty years ---------- */
export function slideLater(parent, ctx, P) {
  const L = ctx.layout, G = P.G, u = Math.min(G.w, G.h);
  const win = L.pick({ landscape: { x: 0.06, y: 0.075, w: 0.88, h: 0.8, shape: 'round' }, portrait: { x: 0.075, y: 0.055, w: 0.85, h: 0.845, shape: 'round' } });
  const W = { x: win.x * G.w, y: win.y * G.h, w: win.w * G.w, h: win.h * G.h };
  const lineY = W.y + W.h * L.pick({ landscape: 0.5, portrait: 0.46 });
  const S = makeSlide(parent, L, {
    w: G.w, h: G.h, seed: 15, name: '5 Later slide', num: 'No. 5', catalogue: 'Havana conference, Oct. 2002',
    windows: [win],
    paint(g) {
      const x0 = W.x + W.w * 0.1, x1 = W.x + W.w * 0.9, lw = Math.max(2, u * 0.003);
      wash(g, G.w, G.h, t => { t.beginPath(); t.rect(x0 - u * 0.01, lineY - u * 0.022, x1 - x0 + u * 0.02, u * 0.044); }, PAL.amber, 121, { alpha: 0.7, streak: 0.12, gap: 5 });
      ruled(g, x0, lineY, x1, lineY, lw, 122);
      for (let i = 0; i <= 40; i++) {
        const x = x0 + (x1 - x0) * i / 40, hh = i % 10 === 0 ? u * 0.03 : u * 0.012;
        ruled(g, x, lineY - hh, x, lineY + (i % 10 === 0 ? hh : 0), lw * (i % 10 === 0 ? 1 : 0.6), 130 + i);
      }
    },
  });
  const sz = f => u * f;
  const x0 = W.x + W.w * 0.1, x1 = W.x + W.w * 0.9;
  const y62 = letter(S.el, '1962', { name: '5 Year 1962', x: x0, y: lineY - sz(0.05), size: sz(0.13), seed: 141 });
  y62.style.transform = 'translate(-8%, -100%)'; y62.style.whiteSpace = 'nowrap';
  const y02 = letter(S.el, '2002', { name: '5 Year 2002', x: x1, y: lineY - sz(0.05), size: sz(0.13), seed: 142 });
  y02.style.transform = 'translate(-92%, -100%)'; y02.style.whiteSpace = 'nowrap'; y02.style.width = 'max-content';
  const mid = letter(S.el, 'forty years', { name: '5 Forty years', x: (x0 + x1) / 2, y: lineY + sz(0.045), size: sz(0.05), italic: true, seed: 143 });
  mid.style.transform = 'translateX(-50%)'; mid.style.whiteSpace = 'nowrap';
  const foot = letter(S.el, L.landscape ? 'His part became widely known only c. 2002. He died in 1998.' : 'His part became widely known\nonly c. 2002. He died in 1998.', {
    name: '5 Footnote', x: W.x + W.w * 0.5, y: W.y + W.h * L.pick({ landscape: 0.8, portrait: 0.78 }), size: sz(0.036), italic: true, seed: 144, align: 'center' });
  foot.style.transform = 'translateX(-50%)'; foot.style.whiteSpace = 'pre';
  return { el: S.el, update() {} };
}
