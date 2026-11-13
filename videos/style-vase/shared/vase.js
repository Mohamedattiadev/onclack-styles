// ONE POT, ONE TURNTABLE. Every scene renders the same vessel from global time, so cuts are exact and the pot's
// rotation is continuous. Signature move: the pot TURNS to bring the next part of the story to the front.
// Renderer: the painted surface is drawn flat (frieze.js) at the resolution the camera needs (mip by construction),
// then wrapped per pixel onto a surface of revolution seen from 7° above, lit by one key light (upper left) + a
// soft fill, with a sharp specular on the glossy black slip and a dull sheen on the clay.
import { clamp, el } from '/onclack-styles/engine/lib/anim.js';
import { smootherstep } from '/onclack-styles/engine/lib/spring.js';
import { paintSurface, PAL, DEG, RB, D2A, U, ANT } from './frieze.js';

const TILT = 7 * DEG, sT = Math.sin(TILT), cT = Math.cos(TILT);
const YMAX = 1.6;
// profile (y down from the lip, radius) — our own shape: flared lip, tall neck, round shoulder, wide belly, small foot
const PROFILE = [[0, 0.272], [0.03, 0.287], [0.06, 0.262], [0.09, 0.216], [0.14, 0.198], [0.24, 0.193], [0.31, 0.2], [0.37, 0.236], [0.44, 0.322],
  [0.52, 0.406], [0.6, 0.466], [0.7, 0.5], [0.82, 0.513], [0.94, 0.506], [1.04, 0.481], [1.14, 0.428], [1.25, 0.35], [1.34, 0.27], [1.41, 0.2],
  [1.46, 0.158], [1.5, 0.152], [1.53, 0.176], [1.565, 0.214], [1.6, 0.221]];
const RL = 0.276; // lip radius used for the mouth ellipse

const N = 4096, RT = new Float32Array(N), DR = new Float32Array(N);
(() => { // Catmull-Rom through the profile, resampled on y
  const pts = [];
  const P = PROFILE, n = P.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    for (let s = 0; s < 1; s += 1 / 48) {
      const s2 = s * s, s3 = s2 * s, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
      pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  pts.push(P[n - 1]);
  let j = 0;
  for (let i = 0; i < N; i++) {
    const y = (i / (N - 1)) * YMAX;
    while (j < pts.length - 2 && pts[j + 1][0] < y) j++;
    const [ya, ra] = pts[j], [yb, rb] = pts[j + 1], f = yb > ya ? clamp((y - ya) / (yb - ya)) : 0;
    RT[i] = ra + (rb - ra) * f;
  }
  for (let i = 0; i < N; i++) DR[i] = (RT[Math.min(N - 1, i + 2)] - RT[Math.max(0, i - 2)]) / ((Math.min(N - 1, i + 2) - Math.max(0, i - 2)) * YMAX / (N - 1));
})();
const rOf = y => { const f = clamp(y / YMAX) * (N - 1), i = Math.min(N - 2, f | 0), t = f - i; return RT[i] + (RT[i + 1] - RT[i]) * t; };
const drOf = y => DR[Math.min(N - 1, Math.max(0, Math.round((y / YMAX) * (N - 1))))];

// lights (pot space: x right, y DOWN, z toward the camera); camera looks down 7°
const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const V = [0, -sT, cT];
const L1 = norm([-0.52, -0.58, 0.63]), L2 = norm([0.85, -0.18, 0.5]);
const H1 = norm(L1.map((x, i) => x + V[i])), H2 = norm(L2.map((x, i) => x + V[i]));

/* ---------------- turntable + camera (global time) ---------------- */
const S = (t, a, b) => smootherstep((t - a) / (b - a));
export const rotAt = t => -16 + 1.2 * t + 22 * S(t, 3.3, 5.8) + 80 * S(t, 12.75, 14.75) + 38 * S(t, 19.15, 20.5) + 22 * S(t, 22.95, 25.5);

const CUTS = [0, 7.21, 15.6];
function camKeys(L) {
  const p = L.pick.bind(L);
  const ECU = { s: p({ landscape: 3300, portrait: 3000 }), y: 0.772, ox: 0 };
  const WS = { s: p({ landscape: 590, portrait: 700 }), y: 0.8, ox: 0 };
  const MS = { s: p({ landscape: 1900, portrait: 2000 }), y: 0.866, ox: 0 };
  const PUSH = { s: p({ landscape: 2450, portrait: 2500 }), y: 0.872, ox: -0.055 };
  const TURN = { s: p({ landscape: 1500, portrait: 1500 }), y: 0.87, ox: 0 };
  const TORP = { s: p({ landscape: 2350, portrait: 2300 }), y: 0.925, ox: 0 };
  const MWS = { s: p({ landscape: 1620, portrait: 1250 }), y: 0.866, ox: 0.03 };
  const CU = { s: p({ landscape: 2700, portrait: 1900 }), y: 0.874, ox: p({ landscape: 0, portrait: -0.055 }) };
  const END = { s: p({ landscape: 545, portrait: 660 }), y: 0.79, ox: 0 };
  // [t0, t1, from, to] — holds have from === to
  return [[0, 3.25, ECU, ECU], [3.25, 5.9, ECU, WS], [5.9, 7.21, WS, WS],
    [7.21, 10.9, MS, MS], [10.9, 12.55, MS, PUSH], [12.55, 12.75, PUSH, PUSH], [12.75, 14.55, PUSH, TURN], [14.55, 15.35, TURN, TORP], [15.35, 15.6, TORP, TORP],
    [15.6, 19.15, MWS, MWS], [19.15, 20.5, MWS, CU], [20.5, 22.95, CU, CU], [22.95, 25.5, CU, END], [25.5, 99, END, END]];
}
export function camAt(keys, t) {
  const k = keys.find(k => t >= k[0] && t < k[1]) ?? keys[keys.length - 1];
  const p = k[2] === k[3] ? 0 : smootherstep((t - k[0]) / (k[1] - k[0]));
  const cut = CUTS.filter(c => c <= t).pop();
  const s = Math.exp(Math.log(k[2].s) + (Math.log(k[3].s) - Math.log(k[2].s)) * p) * (1 + 0.004 * (t - cut)); // log zoom + creep
  return { s, y: k[2].y + (k[3].y - k[2].y) * p, ox: k[2].ox + (k[3].ox - k[2].ox) * p };
}

/* ---------------- build ---------------- */
export async function buildVase(root, ctx) {
  const L = ctx.layout, W = L.width, Hh = L.height;
  const cx = L.safe.cx, cy = L.safe.cy;
  const keys = camKeys(L);
  const cvs = el('canvas', { width: W, height: Hh, 'data-name': 'Vase (one painted pot on a turntable)' }, root);
  cvs.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  const g = cvs.getContext('2d');
  const pot = document.createElement('canvas'); pot.width = W; pot.height = Hh;
  const pg = pot.getContext('2d', { willReadFrequently: true });
  const img = pg.createImageData(W, Hh), out = img.data;
  const tex = document.createElement('canvas'); tex.width = 16; tex.height = 16;
  const tg = tex.getContext('2d', { willReadFrequently: true });
  // fixed backdrop grain (screen space, seeded) — dithers the backdrop gradients
  const grain = document.createElement('canvas'); grain.width = grain.height = 256;
  { const gc = grain.getContext('2d'), d = gc.createImageData(256, 256); let s = 1234567;
    for (let i = 0; i < d.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = 128 + ((s >> 8) % 13) - 6; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    gc.putImageData(d, 0, 0); }
  const grainPat = g.createPattern(grain, 'repeat');

  function backdrop(c) {
    const s = c.s, fyv = c.y * cT + RB * sT;
    const px = cx + s * (0 - c.ox), footY = cy + s * (YMAX * cT + 0.2 * sT - fyv);
    const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#262C30'); bg.addColorStop(1, '#343B40');
    g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
    const pr = Math.max(W, Hh) * 0.55 + s * 0.35, py = cy + s * (0.75 - fyv);
    const pool = g.createRadialGradient(px - s * 0.12, py - s * 0.1, 0, px, py, pr);
    pool.addColorStop(0, 'rgba(112,124,130,0.55)'); pool.addColorStop(0.55, 'rgba(80,90,96,0.22)'); pool.addColorStop(1, 'rgba(60,68,72,0)');
    g.fillStyle = pool; g.fillRect(0, 0, W, Hh);
    // plinth top (only seen in wide shots): a lighter plane behind and under the foot
    const horizon = footY - s * 0.2;
    if (horizon < Hh) {
      const fl = g.createLinearGradient(0, horizon, 0, Math.max(horizon + 1, footY + s * 0.35));
      fl.addColorStop(0, 'rgba(70,78,82,0.0)'); fl.addColorStop(0.08, 'rgba(78,86,90,0.9)'); fl.addColorStop(1, 'rgba(92,100,104,0.95)');
      g.fillStyle = fl; g.fillRect(0, horizon, W, Hh - horizon);
      // cast shadow (key from upper left → falls right/back) + contact shadow
      g.save(); g.translate(px + s * 0.34, footY - s * 0.035); g.scale(1, 0.13);
      let sh = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.62); sh.addColorStop(0, 'rgba(14,16,18,0.42)'); sh.addColorStop(1, 'rgba(14,16,18,0)');
      g.fillStyle = sh; g.beginPath(); g.arc(0, 0, s * 0.62, 0, Math.PI * 2); g.fill(); g.restore();
      g.save(); g.translate(px, footY); g.scale(1, 0.16);
      sh = g.createRadialGradient(0, 0, s * 0.12, 0, 0, s * 0.3); sh.addColorStop(0, 'rgba(8,8,8,0.75)'); sh.addColorStop(1, 'rgba(8,8,8,0)');
      g.fillStyle = sh; g.beginPath(); g.arc(0, 0, s * 0.3, 0, Math.PI * 2); g.fill(); g.restore();
    }
    g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.5; g.fillStyle = grainPat; g.fillRect(0, 0, W, Hh); g.restore();
  }

  // handles: two loops from neck to shoulder, slip-black tubes; drawn behind or in front of the body by depth
  const HP = [[0.19, 0.14], [0.27, 0.098], [0.37, 0.108], [0.43, 0.175], [0.447, 0.275], [0.428, 0.375], [0.392, 0.468]];
  function handles(c, rot, front) {
    const s = c.s, fyv = c.y * cT + RB * sT;
    for (const uh of U.handles) {
      const ph = (uh - rot) * DEG, z = Math.cos(ph);
      if ((z >= 0) !== front) continue;
      const pts = HP.map(([r, y]) => [cx + s * (r * Math.sin(ph) - c.ox), cy + s * (y * cT + r * Math.cos(ph) * sT - fyv)]);
      const line = () => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; g.quadraticCurveTo(...pts[i], ...m); } g.lineTo(...pts[pts.length - 1]); };
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = '#15100D'; g.lineWidth = 0.036 * s; line(); g.stroke();
      g.save(); g.translate(-0.006 * s, -0.004 * s); g.strokeStyle = `rgba(255,238,215,${0.1 + 0.12 * Math.max(0, -Math.sin(ph))})`; g.lineWidth = 0.009 * s; line(); g.stroke(); g.restore();
    }
  }

  function render(T) {
    const rot = rotAt(T), c = camAt(keys, T), s = c.s, fyv = c.y * cT + RB * sT;
    const frame = Math.round(T * 30);
    // visible region in pot-view units
    const Xp0 = (0 - cx) / s + c.ox, Xp1 = (W - cx) / s + c.ox, Yp0 = (0 - cy) / s + fyv, Yp1 = (Hh - cy) / s + fyv;
    const yv0 = clamp((Yp0 - 0.52 * sT) / cT - 0.01, 0, YMAX), yv1 = clamp(Yp1 / cT + 0.01, 0, YMAX);
    let rmin = 1; for (let y = yv0; y <= yv1; y += 0.01) rmin = Math.min(rmin, rOf(y));
    const th = x => (x <= -rmin ? -92 : x >= rmin ? 92 : Math.asin(x / rmin) / DEG + Math.sign(x) * 3);
    const u0 = rot + th(Xp0) - 2, u1 = rot + th(Xp1) + 2;
    // texture density = screen density at the front, capped
    let K = s; const area = (u1 - u0) * D2A * (yv1 - yv0 + 0.004);
    if (area * K * K > 7.5e6) K = Math.sqrt(7.5e6 / area);
    const TW = Math.ceil((u1 - u0) * D2A * K) + 2, TH = Math.ceil((yv1 - yv0) * K) + 2;
    if (tex.width < TW) tex.width = TW; if (tex.height < TH) tex.height = TH;
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, TW, TH);
    tg.setTransform(K, 0, 0, K, -u0 * D2A * K, -yv0 * K);
    paintSurface(tg, T, rot, u0, u1, yv0, yv1, K);
    const td = tg.getImageData(0, 0, TW, TH).data;
    const DEGK = D2A * K;

    // screen bbox of the pot
    const bx0 = Math.max(0, Math.floor(cx + s * (-0.53 - c.ox))), bx1 = Math.min(W, Math.ceil(cx + s * (0.53 - c.ox)));
    const by0 = Math.max(0, Math.floor(cy + s * (-RL * sT - 0.01 - fyv))), by1 = Math.min(Hh, Math.ceil(cy + s * (YMAX * cT + 0.25 * sT + 0.01 - fyv)));
    const inv = 1 / s;
    for (let Y = by0; Y < by1; Y++) {
      const Yp = (Y + 0.5 - cy) * inv + fyv;
      let o = (Y * W + bx0) * 4;
      for (let X = bx0; X < bx1; X++, o += 4) {
        const Xp = (X + 0.5 - cx) * inv + c.ox;
        let y = (Yp - 0.5 * sT) / cT, r = 0.5, sx = 0, cc = 1;
        for (let it = 0; it < 3; it++) {
          r = rOf(y); sx = Xp / r; if (sx > 1) sx = 1; else if (sx < -1) sx = -1;
          cc = Math.sqrt(1 - sx * sx); y = (Yp - r * cc * sT) / cT;
        }
        const yc = y < 0 ? 0 : y > YMAX ? YMAX : y;
        r = rOf(yc);
        const ax = Xp < 0 ? -Xp : Xp;
        let cov = clamp((r - ax) * s + 0.5) * clamp((YMAX - y) * s * cT + 0.5);
        let R, G, B;
        if (y < 0 || cov <= 0) {
          // mouth: look into the vessel over the front lip
          const ex = Xp / RL, ey = Yp / (RL * sT), d = ex * ex + ey * ey;
          if (y < 0 && d < 1.0) {
            const m = Math.sqrt(d), rim = clamp((m - 0.8) / 0.12);
            const back = clamp(-ey) * 0.5;
            R = 20 + 18 * back + rim * 30; G = 15 + 12 * back + rim * 22; B = 12 + 9 * back + rim * 17;
            cov = clamp((1 - m) * RL * s + 0.5);
            if (y > -0.004) cov = 1;
          } else { out[o + 3] = 0; continue; }
        } else {
          sx = Xp / r; if (sx > 1) sx = 1; else if (sx < -1) sx = -1; cc = Math.sqrt(1 - sx * sx);
          // texture lookup (bilinear, 1–4 taps along u when the surface turns away)
          const th0 = Math.asin(sx) / DEG, tx = (rot + th0 - u0) * DEGK, ty = (yc - yv0) * K - 0.5;
          const fp = Math.min(6, (K * inv) * (RB / r) / Math.max(cc, 0.05));
          const taps = fp > 1.4 ? Math.min(4, Math.ceil(fp)) : 1;
          let ar = 0, ag = 0, ab = 0;
          const y0i = Math.max(0, Math.min(TH - 2, Math.floor(ty))), fy = clamp(ty - y0i);
          for (let q = 0; q < taps; q++) {
            const sxp = (taps === 1 ? tx : tx + ((q + 0.5) / taps - 0.5) * fp) - 0.5;
            const x0i = Math.max(0, Math.min(TW - 2, Math.floor(sxp))), fx = clamp(sxp - x0i);
            const i00 = (y0i * TW + x0i) * 4, i10 = i00 + 4, i01 = i00 + TW * 4, i11 = i01 + 4;
            const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
            ar += td[i00] * w00 + td[i10] * w10 + td[i01] * w01 + td[i11] * w11;
            ag += td[i00 + 1] * w00 + td[i10 + 1] * w10 + td[i01 + 1] * w01 + td[i11 + 1] * w11;
            ab += td[i00 + 2] * w00 + td[i10 + 2] * w10 + td[i01 + 2] * w01 + td[i11 + 2] * w11;
          }
          ar /= taps; ag /= taps; ab /= taps;
          // normal of the surface of revolution
          const rp = drOf(yc), nl = 1 / Math.sqrt(1 + rp * rp), nx = sx * nl, ny = -rp * nl, nz = cc * nl;
          const d1 = Math.max(0, nx * L1[0] + ny * L1[1] + nz * L1[2]), d2 = Math.max(0, nx * L2[0] + ny * L2[1] + nz * L2[2]);
          let h1 = Math.max(0, nx * H1[0] + ny * H1[1] + nz * H1[2]), h2 = Math.max(0, nx * H2[0] + ny * H2[1] + nz * H2[2]);
          let h8 = h1 * h1; h8 *= h8; h8 *= h8; let h64 = h8 * h8; h64 *= h64; h64 *= h64;
          let h16b = h2 * h2; h16b *= h16b; h16b *= h16b; h16b *= h16b;
          const lum = (ar + ag + ab) / 3, gl = clamp((96 - lum) / 52);
          const lit = 0.4 + 0.78 * d1 + 0.16 * d2;
          const sp = 255 * (gl * (0.4 * h64 + 0.07 * h8 + 0.14 * h16b) + (1 - gl) * 0.06 * h8);
          // a little occlusion where the neck meets the shoulder and under the lip
          const ao = 1 - 0.18 * clamp(1 - Math.abs(yc - 0.4) / 0.05) - 0.12 * clamp(1 - Math.abs(yc - 0.075) / 0.03);
          R = ar * lit * ao + sp; G = ag * lit * ao + sp * 0.96; B = ab * lit * ao + sp * 0.9;
        }
        // dither (±1.5 code values, per frame)
        let h = (X * 73856093) ^ (Y * 19349663) ^ (frame * 83492791); h = (h ^ (h >>> 13)) * 1274126177; const n = (((h >>> 16) & 255) / 255 - 0.5) * 3;
        out[o] = R + n; out[o + 1] = G + n; out[o + 2] = B + n; out[o + 3] = cov * 255;
      }
    }
    pg.clearRect(0, 0, W, Hh);
    pg.putImageData(img, 0, 0, bx0, by0, Math.max(1, bx1 - bx0), Math.max(1, by1 - by0));
    backdrop(c);
    handles(c, rot, false);
    g.drawImage(pot, 0, 0);
    handles(c, rot, true);
    return { rot, cam: c };
  }

  // screen position of a point on the surface (u degrees, y pot units) — for labels or checks
  function project(T, u, y) { const rot = rotAt(T), c = camAt(keys, T), r = rOf(y), ph = (u - rot) * DEG, fyv = c.y * cT + RB * sT;
    return [cx + c.s * (r * Math.sin(ph) - c.ox), cy + c.s * (y * cT + r * Math.cos(ph) * sT - fyv), Math.cos(ph)]; }

  return { render, project, canvas: cvs };
}
export { ANT, PAL };
