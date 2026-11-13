// SEA NOTE — the seascape vignette (RC: our engraving, not a record) and the photo note (EV: U.S. Navy photo, engraved).
// Everything here is a function of GLOBAL time T, so scene 1 and scene 2 show the same sea at the same moment.
import { svg, clamp, lerp, noise1 } from '/onclack-styles/engine/lib/anim.js';
import {
  PAL, FONT, ss, makeNote, vignetteFrame, seal, serial, engraver, intaglioFamilies, burin, engravedText, hatchPattern, camPath,
} from './engrave.js';

const MICRO = 'TWENTY-SEVENTH OF OCTOBER NINETEEN SIXTY-TWO · SUBMARINE B-59 · WESTERN ATLANTIC NEAR CUBA';

// word times (global s, from words.json): October 0.58 · nineteen 2.07 · submarine 4.30 · Cuba 6.52 · ships 8.63 ·
// drop 8.95 · depth 9.79 · charges 10.05 · Moscow 10.95 · silent 11.93
export const TS = { small: 0.5, year: 2.0, pull: 2.7, engr: 2.95, sub: 4.22, cuba: 6.42, photo: 7.24, ships: 8.55, cut: 9.75, moscow: 10.9, still: 11.8 };
const BURSTS = [
  { ship: 0, drop: 9.1, at: 10.03, fx: 0.37, fy: 0.6 },
  { ship: 1, drop: 9.45, at: 10.62, fx: 0.6, fy: 0.66 },
  { ship: 0, drop: 9.95, at: 11.22, fx: 0.47, fy: 0.53 },
];
export const SEA_BURSTS = BURSTS.map(b => b.at);

function frame(N, kind) {
  const { G } = N, v = G.vig, P = N.L.portrait;
  if (kind === 'ecu') return { x: G.seal.cx, y: G.seal.cy, z: P ? 2.35 : 3.5 };
  if (kind === 'full') return { x: G.W / 2, y: G.H / 2, z: 1 };
  if (kind === 'vig') return P ? { x: 450, y: v.y + v.h / 2 + 40, z: 1.2 } : { x: 722, y: 412, z: 1.3 };
  if (kind === 'photo') return P ? { x: 450, y: v.y + v.h / 2 + 140, z: 1.08 } : { x: 792, y: 430, z: 1.24 };
  if (kind === 'sub') return { x: v.x + v.w * 0.5, y: v.y + v.h * (P ? 0.55 : 0.55), z: P ? 1.42 : 1.5 };
}

// ------------------------------------------------------------------ seascape tone field (vignette-local units)
function seaField(w, h, P) {
  const hy = h * 0.25;
  const sub = { cx: w * 0.47, cy: h * 0.77, hl: w * (P ? 0.3 : 0.22) };
  sub.r = sub.hl * 0.13;
  const ships = [{ x: w * 0.36 }, { x: w * 0.63 }];
  const rr = xn => {           // hull radius profile, xn −1 (bow, left) … 1 (stern)
    if (xn < -1 || xn > 1) return -1;
    if (xn < -0.84) { const q = (xn + 0.84) / 0.16; return sub.r * Math.sqrt(Math.max(0, 1 - q * q)); }
    if (xn > 0.5) return sub.r * (1 - 0.82 * Math.pow((xn - 0.5) / 0.5, 1.5));
    return sub.r;
  };
  const sail = { x0: sub.cx - sub.hl * 0.3, x1: sub.cx - sub.hl * 0.07, top: sub.cy - sub.r * 2.5 };
  const cubaH = x => (x < w * 0.6 ? 0 : (20 + 13 * Math.sin(x * 0.021 + 0.6) + 8 * Math.sin(x * 0.057 + 2.1)) * clamp((x - w * 0.6) / (w * 0.1)) * (P ? 0.8 : 1));
  function shipTone(x, y) {
    for (const s of ships) {
      const dx = x - s.x;                       // bow to the left
      if (dx < -72 || dx > 66) continue;
      const deck = hy - 10 - (dx < -30 ? (-30 - dx) * 0.16 : 0) - (dx > 40 ? 0 : 0);
      const bowCut = dx < -40 ? -40 + (y - deck) * -0.9 : -999;            // raked stem
      if (y > deck && y < hy + 4 && dx > Math.max(-72, bowCut - 32) && dx < 64 - Math.max(0, y - hy) * 1.5) return 0.78 + 0.14 * (y - deck) / 16;
      if (y > hy - 24 && y <= deck + 1 && dx > -26 && dx < 22) return 0.62;           // lower superstructure
      if (y > hy - 34 && y <= hy - 23 && dx > -18 && dx < 4) return 0.7;              // bridge
      if (y > hy - 38 && y <= hy - 23 && dx > 9 && dx < 19) return 0.82;              // funnel
      if (y > hy - 60 && y <= hy - 33 && Math.abs(dx + 8) < 1.6 - (hy - 33 - y) * 0.02) return 0.95; // mast
      if (Math.abs(y - (hy - 52)) < 1 && Math.abs(dx + 8) < 9) return 0.9;           // yard
    }
    return -1;
  }
  return { hy, sub, rr, sail, cubaH, ships, shipTone };
}

export function seaNote(root, ctx, { id, photo = null }) {
  const N = makeNote(root, ctx, 'sea', { id, micro: MICRO });
  const { G } = N, v = G.vig, P = N.L.portrait, w = v.w, h = v.h;
  vignetteFrame(N.front, v, photo ? 'Vignette frame (photo)' : 'Vignette frame (sea)');
  const S = seal(N.front, N.defs, G.seal, { id, small: 'OCTOBER 27', big: '1962' });
  const ns = P ? 30 : 34;
  serial(N.front, G.serialA, 'B·59  027 1962', PAL.red, ns, 'Serial number (red)');
  serial(N.front, G.serialB, 'B·59  027 1962', PAL.ink, ns, 'Serial number (green)');
  const F = seaField(w, h, P);
  const E = engraver(w, h, photo ? [
    { angle: 0, spacing: 4.8, width: t => (t < 0.03 ? 0 : 4.8 * (0.06 + 0.86 * t)), minW: 0.18 },
    { angle: 62, spacing: 5.4, offset: 0.3, width: t => 5.4 * 0.62 * clamp((t - 0.72) / 0.28), minW: 0.35 },
  ] : intaglioFamilies({ spacing: 6.2 }));

  // labels
  const labels = svg('g', { 'data-name': 'Labels' }, N.front);
  const cubaLab = engravedText(labels, N.defs, { id: `${id}-cuba`, text: 'C U B A', x: v.x + w * 0.83, y: v.y + F.hy - (P ? 34 : 40), size: P ? 30 : 30, family: FONT.num, weight: 700, fill: PAL.ink, spacing: 3, name: 'Label: Cuba' });
  let legend = null, plate = null, plateRect = null, rcCap = null;
  if (photo) {
    legend = engravedText(labels, N.defs, { id: `${id}-src`, text: 'U.S. Navy photo · Oct. 1962', x: G.legend.x, y: G.legend.y, size: G.legend.size * 0.9, italic: true, fill: PAL.ink, name: 'Source caption (EV)' });
  } else {
    rcCap = engravedText(labels, N.defs, { id: `${id}-rc`, text: 'Engraved reconstruction · position approximate', x: G.legend.x, y: G.legend.y, size: G.legend.size * 0.72, italic: true, fill: PAL.ink, name: 'Caption: reconstruction (RC)' });
    // Moscow plate inside the vignette, bottom-left
    const pw = P ? 560 : 520, ph = P ? 92 : 84, px0 = v.x + (P ? (w - pw) / 2 : 28), py0 = v.y + h - ph - (P ? 26 : 24);
    plate = svg('g', { 'data-name': 'Moscow plate' }, labels);
    plateRect = svg('rect', { x: px0, y: py0, width: pw, height: ph, fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 2 }, plate);
    svg('rect', { x: px0 + 6, y: py0 + 6, width: pw - 12, height: ph - 12, fill: 'none', stroke: PAL.ink, 'stroke-width': 0.7 }, plate);
    legend = engravedText(plate, N.defs, { id: `${id}-moscow`, text: 'Moscow: silent for days', x: px0 + pw / 2, y: py0 + ph * 0.68, size: P ? 52 : 48, italic: true, fill: PAL.ink, name: 'Legend: Moscow silent' });
  }

  // photo tone (EV): luminance grid
  let lum = null, iw = 0, ih = 0;
  if (photo) {
    iw = photo.width; ih = photo.height; lum = photo.lum;
  }
  const photoTone = (x, y) => {
    // crop (photo px at 474 wide): the boat + the helicopter, aspect of the vignette
    let cw = 356, ch = cw * h / w, cx0 = 75, cy0 = 72;
    if (cy0 + ch > ih - 2) { ch = ih - 8; cw = ch * w / h; cx0 = 268 - cw / 2; cy0 = 4; }   // tall vignette (Shorts)
    const u = clamp(cx0 + (x / w) * cw, 0, iw - 1.001), q = clamp(cy0 + (y / h) * ch, 0, ih - 1.001);
    const x0 = u | 0, y0 = q | 0, fx = u - x0, fy = q - y0, i = y0 * iw + x0;
    const l = lerp(lerp(lum[i], lum[i + 1], fx), lerp(lum[i + iw], lum[i + iw + 1], fx), fy);
    return 0.04 + 0.96 * ss(0.3, 0.92, 1 - l);
  };

  function seaTone(x, y, T, st) {
    const { hy, sub, rr, sail } = F;
    let t;
    if (y < hy - 1.6) {
      t = 0.09 + 0.12 * (1 - y / hy) + 0.13 * Math.exp(-(((y - hy * 0.42 - 6 * Math.sin(x * 0.004)) / 11) ** 2)) * Math.max(0, Math.sin(x * 0.006 + 0.4)) ** 2;
      const ch = F.cubaH(x) * st.cuba;
      if (ch > 0 && y > hy - ch) t = lerp(t, 0.5, clamp((y - (hy - ch)) / 2.5));
      if (st.ships > 0) { const s = F.shipTone(x, y); if (s > 0) t = lerp(t, s, st.ships); }
    } else {
      const d = (y - hy) / (h - hy);
      t = 0.2 + 0.36 * d + 0.035 * Math.sin(x * 0.013 + y * 0.021);
      t -= 0.07 * (1 - d) * Math.exp(-(((x - (w * 0.2 + (y - hy) * 0.45)) / 46) ** 2));   // a light shaft from upper left
      if (st.ships > 0) { const s = F.shipTone(x, y); if (s > 0) t = lerp(t, s, st.ships); }
      // the boat
      if (st.sub > 0) {
        const xn = (x - sub.cx) / sub.hl, r = rr(xn);
        let s = -1;
        if (r > 0 && Math.abs(y - sub.cy) < r) {
          const ny = (y - sub.cy) / r;
          s = 0.66 + 0.33 * Math.pow((ny + 1) / 2, 1.1) - 0.36 * Math.exp(-(((ny + 0.58) / 0.15) ** 2));
        } else if (x > sail.x0 && x < sail.x1 && y > sail.top && y < sub.cy) {
          const k = (x - sail.x0) / (sail.x1 - sail.x0);
          const topCurve = sail.top + (k < 0.2 ? (0.2 - k) ** 2 * 260 : 0) + (k > 0.85 ? (k - 0.85) ** 2 * 300 : 0);
          if (y > topCurve) s = 0.6 + 0.3 * k + 0.08 * (y - sail.top) / (sub.cy - sail.top);
        } else if (r > 0 && Math.abs(y - sub.cy) - r < 4 && Math.abs(xn) < 1.02) s = 0.05;      // engraver's white edge
        else if (x > sail.x0 - 5 && x < sail.x1 + 5 && y > sail.top - 4 && y < sub.cy - r) s = 0.05;
        if (s >= 0) t = lerp(t, s, st.sub);
      }
      // falling charges
      for (const c of st.charges) {
        const dx = (x - c.x) / 5.5, dy = (y - c.y) / 7.5;
        if (dx * dx + dy * dy < 1) t = 0.96;
        else if (dx * dx + dy * dy < 1.9) t = Math.min(t, 0.06);
      }
      // bursts: a white core of bubbles (lines thin out, never a glow)
      for (const b of st.bursts) {
        const dist = Math.hypot(x - b.x, y - b.y);
        t *= 1 - 0.88 * b.fade * Math.exp(-((dist / (16 + 50 * b.age)) ** 2));
      }
    }
    return clamp(t);
  }

  function state(T) {
    const st = { sub: ss(TS.sub, TS.sub + 0.55, T), cuba: ss(TS.cuba, TS.cuba + 0.55, T), ships: ss(TS.ships, TS.ships + 0.45, T), charges: [], bursts: [] };
    for (const b of BURSTS) {
      const sx = F.ships[b.ship].x, bx = w * b.fx, by = h * b.fy;
      if (T > b.drop && T < b.at) {
        const p = (T - b.drop) / (b.at - b.drop), e = p * p * (3 - 2 * p) * 0.35 + p * 0.65;
        st.charges.push({ x: lerp(sx + 10, bx, e) + 3 * Math.sin(p * 5), y: lerp(F.hy + 8, by, e) });
      }
      if (T >= b.at) {
        const age = T - b.at;
        st.bursts.push({ x: bx, y: by, age, R: 8 + 240 * (1 - Math.exp(-age * 1.9)), fade: Math.exp(-age * 1.25) });
      }
    }
    st.wave = 1 - ss(TS.still, TS.still + 1.2, T);
    return st;
  }

  function draw(T, cam) {
    N.setCam(cam);
    N.begin();
    if (photo) {
      E.draw(N.ink, v.x, v.y, {
        tone: photoTone,
        disp: (x, y) => [0, 1.1 * Math.sin(x * 0.018 + y * 0.004)],
        vis: burin(T, TS.photo, 0.95, { lag: 0.4, passGap: 0.25 }),
      });
    } else {
      const st = state(T);
      E.draw(N.ink, v.x, v.y, {
        tone: (x, y) => seaTone(x, y, T, st),
        disp: (x, y) => {
          let dx = 0, dy = 0;
          if (y > F.hy + 2) {
            const A = (0.25 + 2.8 * Math.exp(-(y - F.hy) / 80)) * st.wave;
            dy = A * Math.sin(x * 0.034 + y * 0.05 + T * 1.5);
          }
          for (const b of st.bursts) {
            const ux = x - b.x, uy = y - b.y, dist = Math.hypot(ux, uy) || 1;
            const a = 8 * b.fade * Math.exp(-(((dist - b.R) / 15) ** 2));
            dx += (ux / dist) * a; dy += (uy / dist) * a;
          }
          return dx || dy ? [dx, dy] : null;
        },
        vis: burin(T, TS.engr, 1.9),
      });
      // the sea surface: one clean engraved rule, slightly swelling
      const g = N.ink;
      g.fillStyle = PAL.ink; g.beginPath();
      for (let i = 0; i <= 200; i++) { const x = (i / 200) * w; g.lineTo(v.x + x, v.y + F.hy - 1.3 - 0.5 * Math.sin(x * 0.05)); }
      for (let i = 200; i >= 0; i--) { const x = (i / 200) * w; g.lineTo(v.x + x, v.y + F.hy + 1.3 + 0.5 * Math.sin(x * 0.05)); }
      g.fill();
      // guilloche ripples: interlaced strands around each burst
      for (const b of st.bursts) {
        if (b.fade < 0.04) continue;
        g.strokeStyle = PAL.ink;
        for (const [k, rr0] of [[0, 1], [1, 0.72]]) {
          for (let j = 0; j < 4; j++) {
            g.globalAlpha = clamp(b.fade * 1.1) * (k ? 0.7 : 0.95);
            g.lineWidth = k ? 0.7 : 1.0;
            g.beginPath();
            for (let i = 0; i <= 240; i++) {
              const th = (i / 240) * Math.PI * 2;
              const r = b.R * rr0 + (4 + 3 * k) * Math.sin(18 * th + j * Math.PI / 2 + b.age * 2.2 * (k ? -1 : 1));
              const px = v.x + b.x + Math.cos(th) * r, py = v.y + b.y + Math.sin(th) * r;
              i ? g.lineTo(px, py) : g.moveTo(px, py);
            }
            g.stroke();
          }
        }
        g.globalAlpha = 1;
      }
    }
    N.end();
  }

  return {
    N, S, F, frame: k => frame(N, k),
    update(T, cam) {
      draw(T, cam);
      S.ros.draw(ss(0.1, 2.7, T) * 1.0 + (photo ? 1 : 0));
      S.sm.reveal(photo ? 1 : (T - TS.small) / 0.5);
      S.bg.reveal(photo ? 1 : (T - TS.year) / 0.55);
      cubaLab.reveal(photo ? 0 : (T - TS.cuba - 0.15) / 0.4);
      if (photo) legend.reveal((T - TS.photo - 0.25) / 0.5);
      else {
        const pp = ss(TS.moscow - 0.12, TS.moscow + 0.18, T);
        plate.style.opacity = pp;
        plate.setAttribute('transform', '');
        legend.reveal((T - TS.moscow) / 0.6);
        rcCap.reveal((T - 5.0) / 0.7);
        rcCap.g.style.opacity = T < TS.cut - 0.3 ? 1 : 0;
      }
    },
  };
}

/** Load the photo and reduce it to a luminance grid (once). */
export async function loadPhoto(ctx, src, maxW = 474) {
  const img = new Image();
  img.src = ctx.asset(src);
  await img.decode();
  const sc = maxW / img.naturalWidth, W = maxW, H = Math.round(img.naturalHeight * sc);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, W, H);
  const d = g.getImageData(0, 0, W, H).data, lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
  // local contrast (the engraver's judgement: separate the hull from the sea), box blur r=7, amount 1.1
  const r = 7, blur = new Float32Array(W * H), tmp = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let a = 0, n = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < W) { a += lum[y * W + xx]; n++; } } tmp[y * W + x] = a / n; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let a = 0, n = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < H) { a += tmp[yy * W + x]; n++; } } blur[y * W + x] = a / n; }
  for (let i = 0; i < W * H; i++) lum[i] = Math.min(1, Math.max(0, lum[i] + 1.1 * (lum[i] - blur[i])));
  return { width: W, height: H, lum };
}

export { camPath, noise1 };
