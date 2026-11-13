// The torpedo room (scenes 3 + 4): torpedo, lamp, three standing officers (no faces), YES halos.
import { field, mix, blend, segDist, inEllipse, inPoly, clamp01, prng } from './dots.js';
import { MIX, figure } from './pictures.js';

export function roomGeometry(Fm) {
  const { L, P, sp } = Fm;
  const T = L.pick({
    landscape: { y: P.y + P.h * 0.19, xa: P.x + P.w * 0.1, xb: P.x + P.w * 0.86, r: P.h * 0.072 },
    portrait: { y: P.y + P.h * 0.14, xa: P.x + P.w * 0.13, xb: P.x + P.w * 0.84, r: P.h * 0.052 },
  });
  const len = T.xb - T.xa;
  const tail = [[T.xa, T.y - T.r], [T.xa - T.r * 2.4, T.y - T.r * 0.45], [T.xa - T.r * 2.4, T.y + T.r * 0.45], [T.xa, T.y + T.r]];
  const fins = [[[T.xa - T.r * 1.6, T.y - T.r * 0.4], [T.xa - T.r * 2.5, T.y - T.r * 1.5], [T.xa - T.r * 1.9, T.y - T.r * 1.5], [T.xa - T.r * 0.9, T.y - T.r * 0.5]],
    [[T.xa - T.r * 1.6, T.y + T.r * 0.4], [T.xa - T.r * 2.5, T.y + T.r * 1.5], [T.xa - T.r * 1.9, T.y + T.r * 1.5], [T.xa - T.r * 0.9, T.y + T.r * 0.5]]];
  const torp = (x, y) => (x >= T.xa && x <= T.xb && Math.abs(y - T.y) <= T.r) || inEllipse(x, y, T.xb, T.y, T.r * 1.9, T.r) || inPoly(x, y, tail) || fins.some(f => inPoly(x, y, f));
  const warX = T.xb - len * 0.14;
  const H = L.pick({ landscape: P.h * 0.6, portrait: P.h * 0.47 });
  const fy = P.y + P.h * 0.985;
  const xs = L.pick({ landscape: [0.22, 0.5, 0.78], portrait: [0.18, 0.5, 0.81] });
  const figs = [figure('square', P.x + P.w * xs[0], fy, H), figure('crossed', P.x + P.w * xs[1], fy, H * 0.97), figure('turned', P.x + P.w * xs[2], fy, H * 1.01)];
  const lamp = [P.x + P.w * 0.03, P.y + P.h * 0.02];
  return { T, torp, warX, figs, lamp, nose: [T.xb + T.r * 1.2, T.y] };
}

/**
 * Dab lists for the room. times: { bg: [a, b], torp: [a, b], figs: [a, b], yes: [t1, t2] }
 * order keys grow from `from` (the camera's first look) outward.
 */
export function roomDabs(Fm, G, times, { coolRim3 = true, seed = 40 } = {}) {
  const { L, P, sp } = Fm;
  const { T, torp, warX, figs, lamp } = G;
  const diag = Math.hypot(P.w, P.h);
  const [fx0, fy0] = G.nose;
  const inFig = (x, y) => figs.some(f => f.inside(x, y));
  const lampR = P.w * 0.24;
  const roomCol = (x, y, r) => {
    const d = Math.hypot(x - lamp[0], (y - lamp[1]) * 1.3) / lampR;
    const w = d < 1 ? blend(MIX.lamp, MIX.room, Math.pow(d, 0.7)) : MIX.room;
    return mix(w, r);
  };
  const steelCol = (x, y, r) => {
    if (x > warX) return mix(MIX.warhead, r);
    const v = (y - (T.y - T.r)) / (T.r * 2);
    return mix(v < 0.38 ? MIX.steel : blend(MIX.steel, MIX.steelDark, clamp01((v - 0.38) / 0.5)), r);
  };
  const keyFrom = (x, y, r) => Math.hypot(x - fx0, (y - fy0) * 1.2) / diag + r * 0.06;
  const bg = field({
    x: P.x, y: P.y, w: P.w, h: P.h, sp, edge: sp * 2.2, seed,
    colorAt: (x, y, r) => {
      if (inFig(x, y)) return -1;
      if (torp(x, y)) return steelCol(x, y, r);
      const e = sp * 0.95; // contrast edge (irradiation): a dark seam where steel meets the room
      if (torp(x, y - e) || torp(x, y + e) || torp(x - e, y) || torp(x + e, y)) return mix(MIX.figure, r);
      return roomCol(x, y, r);
    },
    key: keyFrom, rot: () => 0.1, a: times.bg[0], b: times.bg[1], pow: 2,
  });
  const tp = field({
    x: T.xa - T.r * 2.6, y: T.y - T.r * 1.6, w: T.xb - T.xa + T.r * 4.8, h: T.r * 3.2, sp: sp * 0.58, rScale: 0.7, seed: seed + 1,
    colorAt: (x, y, r) => (torp(x, y) ? steelCol(x, y, r) : -1), key: keyFrom, rot: () => 0, a: times.torp[0], b: times.torp[1], pow: 2,
  });
  const fg = figs.flatMap((f, i) => field({
    x: f.fx - f.H * 0.3, y: f.fy - f.H * 1.0, w: f.H * 0.6, h: f.H * 1.02, sp: sp * 0.56, rScale: 0.72, seed: seed + 5 + i,
    colorAt: (x, y, r) => {
      if (!f.inside(x, y)) return -1;
      const rim = !f.inside(x - sp * 0.9, y - sp * 0.3);
      if (rim) return mix(i === 2 && coolRim3 ? MIX.rimCool : MIX.rimWarm, r);
      return mix(MIX.figure, r);
    },
    key: (x, y, r) => i * 10 + (f.fy - y) / f.H * 0.6 + r * 0.6, rot: () => 1.4, a: 0, b: 1,
  }).map((d, k, arr) => d)).sort((a, b) => a.k - b.k);
  // spread figure arrival over the window, figure by figure
  const span = (times.figs[1] - times.figs[0]) / 3;
  const R = prng(seed + 9);
  for (const d of fg) { const i = Math.floor(d.k / 10); d.t0 = times.figs[0] + span * i + span * 1.2 * Math.pow(clamp01((d.k - i * 10) / 1.2), 0.8) + R() * 0.03; }

  const halos = times.yes.flatMap((tv, i) => {
    const f = figs[i]; const [cx, cy] = f.chest; const Rr = f.H * 0.44;
    const Rh = prng(seed + 20 + i);
    return field({
      x: cx - Rr, y: cy - Rr, w: Rr * 2, h: Rr * 2, sp: sp * 0.8, rScale: 0.7, seed: seed + 30 + i,
      colorAt: (x, y, r) => { const d = Math.hypot(x - cx, y - cy) / Rr; if (d > 1 || x < P.x + sp || x > P.x + P.w - sp || f.inside(x, y) || torp(x, y) || ((r * 5.31) % 1) < d * d * 0.8) return -1; return mix(MIX.yes, r); },
      key: r => r, a: 0, b: 1,
    }).map(d => ({ ...d, t0: tv + 0.45 * Math.pow(Math.hypot(d.x - cx, d.y - cy) / Rr, 0.9) + Rh() * 0.04 }));
  });
  return { bg, tp, fg, halos };
}

export function roomUnderdrawing(G) {
  // a quick graphite construction sketch: ovals, a torso block, limb tubes — overlapping, two light passes
  return g => {
    for (const [fi, f] of G.figs.entries()) {
      for (let pass = 0; pass < 2; pass++) {
        const R = prng(500 + fi * 10 + pass), j = () => (R() - 0.5) * f.H * 0.008;
        g.globalAlpha = pass ? 0.22 : 0.42; g.lineWidth = Math.max(1.4, f.H * 0.004);
        const capsule = (ax, ay, bx, by, r) => {
          const th = Math.atan2(by - ay, bx - ax), nx = -Math.sin(th) * r, ny = Math.cos(th) * r;
          g.beginPath(); g.moveTo(ax + nx + j(), ay + ny + j()); g.lineTo(bx + nx + j(), by + ny + j());
          g.arc(bx, by, r, th + Math.PI / 2, th - Math.PI / 2, true); g.lineTo(ax - nx + j(), ay - ny + j());
          g.arc(ax, ay, r, th - Math.PI / 2, th + Math.PI / 2, true); g.stroke();
        };
        g.beginPath(); g.ellipse(f.head.cx + j(), f.head.cy + j(), f.head.rx, f.head.ry, 0, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.ellipse(f.cap.cx + j(), f.cap.cy + j(), f.cap.rx, f.cap.ry, 0, 0, Math.PI * 2); g.stroke();
        g.beginPath(); f.torso.forEach(([x, y], k) => (k ? g.lineTo(x + j(), y + j()) : g.moveTo(x + j(), y + j()))); g.closePath(); g.stroke();
        capsule(...f.neck);
        for (const l of f.limbs) capsule(...l);
        // a plumb line through the standing weight (painter's habit)
        if (!pass) { g.globalAlpha = 0.18; g.beginPath(); g.moveTo(f.head.cx, f.head.cy - f.head.ry * 1.6); g.lineTo(f.fx + j(), f.fy + f.H * 0.02); g.stroke(); }
      }
    }
    g.globalAlpha = 1;
  };
}
