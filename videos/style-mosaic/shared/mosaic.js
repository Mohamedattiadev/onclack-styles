// MOSAIC engine — turns region shapes into hand-cut tesserae that follow the contours ("andamento").
//
// How a picture is built (once, at scene build time — deterministic, seeded):
// 1. Every region draws its shape into a small raster (R = 0.5 of the output size). Each pixel gets a region id.
// 2. A Euclidean distance transform gives, for every pixel, the distance to the nearest region edge.
// 3. Each region has a FLOW field φ. Tile rows sit on the lines φ = (k + ½)·s:
//      contour → φ = distance to the edge (rows hug the outline, like opus vermiculatum)
//      wave    → φ = y + amp·sin(x) (undulating rows, opus undulatum — the sea)
//      halo    → contour rows for the first N rows next to an edge, then wave rows (real mosaics do exactly this:
//                a halo around every figure, then the background "flow"; where the two meet, tiles are cut to fit)
// 4. Tile centres are picked greedily on those row lines, then stretched along the row to close the gaps.
// 5. Every tile is a slightly irregular quadrilateral (sometimes a clipped corner), oriented along its row.
//    Imperfection is fixed per tile (seeded by its index), never per frame.
import { rand, clamp } from '/onclack-styles/engine/lib/anim.js';

const R = 0.5; // raster scale

/** Exact 1-D squared distance transform (Felzenszwalb & Huttenlocher). */
function dt1(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
function edt(seed, w, h) {
  const INF = 1e12, out = new Float32Array(w * h), n = Math.max(w, h);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = seed[y * w + x] ? 0 : INF;
    dt1(f, h, d, v, z);
    for (let y = 0; y < h; y++) out[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = out[y * w + x];
    dt1(f, w, d, v, z);
    for (let x = 0; x < w; x++) out[y * w + x] = Math.sqrt(d[x]);
  }
  return out;
}

/**
 * Build a tile set.
 * spec = { x, y, w, h (output px box), seed, regions: [{ name, draw(g), flow, s, amp, len, phase, halo, color(info, r),
 *          gap (grout ratio), lenRatio, kind }] }
 * Pixels no region covers stay empty (no tiles) — used for overlays.
 */
export function buildTiles(spec) {
  const { x: ox = 0, y: oy = 0, w: W, h: H, seed = 1 } = spec;
  const rw = Math.ceil(W * R), rh = Math.ceil(H * R), N = rw * rh;
  const ids = new Int16Array(N).fill(-1);
  const cv = document.createElement('canvas'); cv.width = rw; cv.height = rh;
  const g = cv.getContext('2d', { willReadFrequently: true });
  spec.regions.forEach((reg, i) => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, rw, rh);
    g.setTransform(R, 0, 0, R, -ox * R, -oy * R); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    reg.draw(g);
    const a = g.getImageData(0, 0, rw, rh).data;
    for (let p = 0; p < N; p++) if (a[p * 4 + 3] > 127) ids[p] = i;
  });
  // edges: pixel whose 4-neighbour has another id (frame edge counts as an edge)
  const edge = new Uint8Array(N);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const p = y * rw + x, id = ids[p];
    if (x === 0 || y === 0 || x === rw - 1 || y === rh - 1) { edge[p] = 1; continue; }
    if (ids[p - 1] !== id || ids[p + 1] !== id || ids[p - rw] !== id || ids[p + rw] !== id) edge[p] = 1;
  }
  const dist = edt(edge, rw, rh); // raster px
  const D = p => dist[p] / R;      // output px

  // ---- candidates on row centre lines
  const cands = [];
  const regs = spec.regions.map(r => ({ flow: 'contour', s: 16, amp: 0, len: 400, phase: 0, halo: 1, gap: 0.11, lenRatio: 1.18, ...r }));
  for (let y = 2; y < rh - 2; y++) for (let x = 2; x < rw - 2; x++) {
    const p = y * rw + x, id = ids[p]; if (id < 0) continue;
    const reg = regs[id], s = reg.s, d = D(p);
    const X = ox + (x + 0.5) / R, Y = oy + (y + 0.5) / R;
    let phi, gx, gy, row, contour = reg.flow === 'contour' || (reg.flow === 'halo' && d < reg.halo * s);
    if (contour) {
      phi = d;
      gx = (dist[p + 1] - dist[p - 1]) * 0.5; gy = (dist[p + rw] - dist[p - rw]) * 0.5;
      const gl = Math.hypot(gx, gy); if (gl < 0.55) continue; // medial axis: no clean direction
      gx /= gl; gy /= gl; row = Math.floor(phi / s);
    } else {
      const k = (2 * Math.PI) / reg.len, ang = reg.angle ?? 0, ca = Math.cos(ang), sa = Math.sin(ang);
      const u = X * ca + Y * sa, v = -X * sa + Y * ca;
      phi = v + reg.amp * Math.sin(u * k + reg.phase) + 4000;
      const dv = reg.amp * k * Math.cos(u * k + reg.phase);
      // gradient of phi in world: d/dX = -sa + dv*ca ; d/dY = ca + dv*sa
      gx = -sa + dv * ca; gy = ca + dv * sa; const gl = Math.hypot(gx, gy); gx /= gl; gy /= gl;
      row = 100000 + Math.floor(phi / s);
      if (d < 0.46 * s) continue;
    }
    const fr = phi / s - Math.floor(phi / s);
    if (Math.abs(fr - 0.5) * s > 0.62 / R) continue;
    if (contour && d < 0.4 * s) continue;
    cands.push({ X, Y, nx: gx, ny: gy, row, id, d, contour, key: rand(seed * 7.77 + p * 0.0137) });
  }
  cands.sort((a, b) => a.key - b.key);

  // ---- greedy pick with a spatial hash
  const smax = Math.max(...regs.map(r => r.s));
  const cell = smax * 1.4, gw = Math.ceil(W / cell) + 2, grid = new Map();
  const acc = [];
  const near = (X, Y, fn, rad = 1) => {
    const cx = Math.floor((X - ox) / cell), cy = Math.floor((Y - oy) / cell);
    for (let j = cy - rad; j <= cy + rad; j++) for (let i = cx - rad; i <= cx + rad; i++) {
      const b = grid.get(j * gw + i); if (b) for (const o of b) if (fn(o) === false) return false;
    }
    return true;
  };
  for (const c of cands) {
    const reg = regs[c.id], s = reg.s, L = s * reg.lenRatio;
    const ux = -c.ny, uy = c.nx;
    const ok = near(c.X, c.Y, o => {
      const dx = c.X - o.X, dy = c.Y - o.Y;
      if (o.id === c.id && o.row === c.row) {
        const along = Math.abs(dx * o.ux + dy * o.uy), across = Math.abs(dx * o.nx + dy * o.ny);
        if (across < 0.55 * s && along < L * 0.92) return false;
      } else {
        const ms = Math.min(s, regs[o.id].s);
        if (dx * dx + dy * dy < (0.78 * ms) ** 2) return false;
      }
    });
    if (!ok) continue;
    const t = { ...c, ux, uy, s };
    acc.push(t);
    const k = Math.floor((c.Y - oy) / cell) * gw + Math.floor((c.X - ox) / cell);
    (grid.get(k) ?? grid.set(k, []).get(k)).push(t);
  }

  // ---- stretch along the row, keep inside the region, build the hand-cut shape
  const idAt = (X, Y) => {
    const x = Math.floor((X - ox) * R), y = Math.floor((Y - oy) * R);
    return x < 0 || y < 0 || x >= rw || y >= rh ? -2 : ids[y * rw + x];
  };
  const tiles = [];
  acc.forEach((a, i) => {
    const reg = regs[a.id], s = a.s, L = s * reg.lenRatio, grout = s * reg.gap;
    let fwd = Infinity, back = Infinity;
    near(a.X, a.Y, o => {
      if (o === a || o.id !== a.id || o.row !== a.row) return;
      const dx = o.X - a.X, dy = o.Y - a.Y, along = dx * a.ux + dy * a.uy, across = Math.abs(dx * a.nx + dy * a.ny);
      if (across > 0.6 * s) return;
      if (along > 0) fwd = Math.min(fwd, along); else back = Math.min(back, -along);
    }, 2);
    const half = gapv => (gapv < 2.1 * L ? Math.min(gapv / 2, 0.92 * L) : 0.5 * L) - grout / 2;
    let ap = half(fwd), am = half(back);
    const fit = (sign, len) => {
      for (let k = 0; k < 4; k++) {
        const id = idAt(a.X + a.ux * len * sign, a.Y + a.uy * len * sign);
        if (id === a.id) return len; len *= 0.72;
      }
      return Math.max(len, 0.22 * L);
    };
    ap = fit(1, ap); am = fit(-1, am);
    const b = s / 2 - grout / 2;
    const r = k => rand(seed * 3.1 + i * 13.37 + k * 1.91);
    const j = s * 0.05;
    // corners in local (u along row, n across) coords
    let pts = [[-am + (r(1) - 0.5) * 2 * j, -b + (r(2) - 0.5) * 2 * j], [ap + (r(3) - 0.5) * 2 * j, -b + (r(4) - 0.5) * 2 * j],
      [ap + (r(5) - 0.5) * 2 * j, b + (r(6) - 0.5) * 2 * j], [-am + (r(7) - 0.5) * 2 * j, b + (r(8) - 0.5) * 2 * j]];
    if (r(9) < 0.28) { // hand-cut: one corner nipped off
      const c = Math.floor(r(10) * 4), p0 = pts[c], pn = pts[(c + 1) % 4], pp = pts[(c + 3) % 4], f = 0.22 + r(11) * 0.18;
      pts.splice(c, 1, [p0[0] + (pp[0] - p0[0]) * f, p0[1] + (pp[1] - p0[1]) * f], [p0[0] + (pn[0] - p0[0]) * f, p0[1] + (pn[1] - p0[1]) * f]);
    }
    const rot = (r(12) - 0.5) * 0.09, cr = Math.cos(rot), sr = Math.sin(rot);
    const ux = a.ux * cr - a.uy * sr, uy = a.ux * sr + a.uy * cr;
    // world-space polygon offsets (unrotated u/n frame kept for flips)
    const poly = new Float32Array(pts.length * 2);
    pts.forEach(([pu, pn], q) => { poly[q * 2] = pu; poly[q * 2 + 1] = pn; });
    const kRow = a.contour ? a.row : a.row - 100000;
    const col = reg.color({ x: a.X, y: a.Y, k: kRow, d: a.d, contour: a.contour, i }, r);
    const shade = 1 + (r(13) - 0.5) * (reg.shadeVar ?? 0.12);
    tiles.push({
      x: a.X, y: a.Y, ux, uy, poly, s, reg: reg.name, regIdx: a.id, k: kRow, contour: a.contour,
      col: col.map(v => v * shade), hl: 0.5 + r(14) * 0.5, seed: r(15), seed2: r(16), kind: reg.kind ?? 'stone',
      tIn: 0, inMode: 'lay', tOut: Infinity, flips: null,
    });
  });
  return { tiles, ids, rw, rh, ox, oy, W, H, R, regs, edge };
}

/** Is world point inside any region of a tile set (overlay mask test)? */
export function inside(set, X, Y) {
  const x = Math.floor((X - set.ox) * set.R), y = Math.floor((Y - set.oy) * set.R);
  if (x < 0 || y < 0 || x >= set.rw || y >= set.rh) return false;
  return set.ids[y * set.rw + x] >= 0;
}

/** Red-ochre sketch (the mosaicist's "sinopia") of a set's region edges, as a canvas at raster size. */
export function sinopia(set, color = [150, 62, 40], alpha = 0.55) {
  const c = document.createElement('canvas'); c.width = set.rw; c.height = set.rh;
  const g = c.getContext('2d'), im = g.createImageData(set.rw, set.rh);
  for (let p = 0; p < set.rw * set.rh; p++) if (set.edge[p] && set.ids[p] >= 0) {
    const x = p % set.rw, y = (p / set.rw) | 0;
    if (x === 0 || y === 0 || x === set.rw - 1 || y === set.rh - 1) continue;
    const a = alpha * (0.6 + 0.4 * rand(p * 0.71));
    im.data.set([color[0], color[1], color[2], Math.round(a * 255)], p * 4);
  }
  g.putImageData(im, 0, 0);
  return c;
}

/** The mortar bed: warm grey lime with fixed speckle (generated once). */
export function mortarBed(W, H, base = [142, 135, 123], seed = 5) {
  const c = document.createElement('canvas'); const w = Math.ceil(W / 2), h = Math.ceil(H / 2);
  c.width = w; c.height = h;
  const g = c.getContext('2d'), im = g.createImageData(w, h);
  for (let p = 0; p < w * h; p++) {
    const x = p % w, y = (p / w) | 0;
    const n = (rand(p * 0.618 + seed) - 0.5) * 22 + Math.sin(x * 0.031 + y * 0.017) * 4 + Math.sin(y * 0.045 - x * 0.012) * 3;
    im.data[p * 4] = base[0] + n; im.data[p * 4 + 1] = base[1] + n * 0.95; im.data[p * 4 + 2] = base[2] + n * 0.85; im.data[p * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return c;
}

const ease3 = p => 1 - (1 - p) ** 3;

/**
 * Draw one tile set at time t. cam = { s, ox, oy } (screen = world·s + o). fx = optional per-tile effect function
 * (tile, t) → { dx, dy, rot, mix: [r,g,b,amount], bright } for bursts etc.
 */
export function drawTiles(g, set, t, cam, fx) {
  const { s: cs, ox, oy } = cam;
  for (const T of set.tiles) {
    const a = t - T.tIn; if (a < 0) continue;
    let sc = 1, sN = 1, lift = 0, alpha = 1, bright = 1, col = T.col;
    if (T.inMode === 'lay') {
      const p = clamp(a / 0.3), e = ease3(p);
      sc = 1.2 - 0.2 * e; lift = (1 - e) * T.s * 0.55; alpha = clamp(a / 0.07);
    } else if (a < 0.26) {
      const p = a / 0.26; sN = Math.sin(p * Math.PI / 2); bright = 1 + 0.22 * (1 - p); lift = (1 - p) * T.s * 0.2;
    }
    if (t > T.tOut) {
      const q = (t - T.tOut) / 0.2; if (q >= 1) continue;
      sN *= Math.cos(q * Math.PI / 2); bright *= 1 - 0.4 * q; lift = Math.max(lift, q * T.s * 0.2);
    }
    if (T.flips) for (const f of T.flips) {
      if (t < f.t) break;
      const q = (t - f.t) / 0.26;
      if (q < 1) { sN *= Math.abs(Math.cos(q * Math.PI)); bright *= 1 - 0.3 * Math.sin(q * Math.PI); lift = Math.max(lift, Math.sin(q * Math.PI) * T.s * 0.25); col = q < 0.5 ? col : f.col; }
      else col = f.col;
    }
    let dx = 0, dy = 0, rot = 0;
    if (T.kind === 'sea') bright *= set.shimmer ? set.shimmer(T, t) : 1;
    if (T.kind === 'gold') bright *= set.glint ? set.glint(T, t) : 1;
    let r = col[0], gg = col[1], b = col[2];
    if (fx) {
      const e = fx(T, t);
      if (e) {
        dx = e.dx || 0; dy = e.dy || 0; rot = e.rot || 0; if (e.bright) bright *= e.bright;
        if (e.mix) { const m = e.mix[3]; r += (e.mix[0] - r) * m; gg += (e.mix[1] - gg) * m; b += (e.mix[2] - b) * m; }
      }
    }
    if (sN < 0.02) continue;
    let ux = T.ux, uy = T.uy;
    if (rot) { const c = Math.cos(rot), s = Math.sin(rot); [ux, uy] = [ux * c - uy * s, ux * s + uy * c]; }
    const nx = -uy, ny = ux;
    const cx = (T.x + dx) * cs + ox - lift * 0.35 * cs, cy = (T.y + dy) * cs + oy - lift * cs, k = sc * cs;
    const P = T.poly, n = P.length;
    // shadow (contact, key light upper left)
    const sh = (1.1 + lift * 0.6) * cs;
    g.beginPath();
    for (let q = 0; q < n; q += 2) {
      const pu = P[q] * k, pn = P[q + 1] * k * sN;
      const X = cx + pu * ux + pn * nx + sh, Y = cy + pu * uy + pn * ny + sh * 1.3;
      q ? g.lineTo(X, Y) : g.moveTo(X, Y);
    }
    g.globalAlpha = alpha * 0.5; g.fillStyle = '#1c1a18'; g.fill();
    g.beginPath();
    for (let q = 0; q < n; q += 2) {
      const pu = P[q] * k, pn = P[q + 1] * k * sN;
      const X = cx + pu * ux + pn * nx, Y = cy + pu * uy + pn * ny;
      q ? g.lineTo(X, Y) : g.moveTo(X, Y);
    }
    g.closePath();
    g.globalAlpha = alpha;
    g.fillStyle = `rgb(${Math.min(255, r * bright) | 0},${Math.min(255, gg * bright) | 0},${Math.min(255, b * bright) | 0})`;
    g.fill();
    g.globalAlpha = alpha * (0.1 + 0.16 * T.hl);
    g.strokeStyle = T.kind === 'gold' ? '#fff3c4' : '#fffaf0'; g.lineWidth = Math.max(1, 0.9 * cs);
    g.stroke();
  }
  g.globalAlpha = 1;
}

/** Colour helpers */
export const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const pickW = (list, r) => { // list = [[colour, weight], ...]
  const tot = list.reduce((a, b) => a + b[1], 0); let x = r * tot;
  for (const [c, w] of list) { x -= w; if (x <= 0) return c; }
  return list[list.length - 1][0];
};
