// SCRATCHBOARD — the board renderer. Light is never painted: it is scratched out of black clay.
// One canvas per scene. Every frame is rebuilt from zero (pure function of t):
//   hatch  = a tone field cut as parallel knife lines (width ∝ tone), revealed line by line in the tool's direction
//   stroke = one knife cut along a path (tally, coast, gouge), revealed along its length
//   dots   = stipple pecks
//   wipe   = the board is re-inked (roller sweep); old scratches stay as a faint ghost (ink fills the cut, never fully)
// Camera = per-pixel inverse transform (world → screen), so knife lines stay razor sharp at any zoom.
import { el, rand, clamp } from '/onclack-styles/engine/lib/anim.js';

// palette: 0 scratch white · 1 cold cyan wash (sea only) · 2 the one red (NO only)
export const PAL = [[237, 234, 226], [95, 163, 181], [196, 46, 34]];
export const BOARD = [14, 14, 14];
export const HEX = { board: '#0E0E0E', white: '#EDEAE2', cyan: '#5FA3B5', red: '#C42E22' };
export const FONT = { display: "'Fraunces', serif", label: "'Schibsted Grotesk', sans-serif" };
export const F = 1 / 30;

export async function fontsReady() {
  await Promise.all(['600 100px Fraunces', 'italic 600 100px Fraunces', '600 40px "Schibsted Grotesk"', '800 40px "Schibsted Grotesk"'].map(f => document.fonts.load(f)));
}

/** Word start in scene-local seconds (n-th match), fallback if missing. */
const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
export function wordT(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.words.filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start - ctx.start : fallback;
}
/** Word start in GLOBAL seconds. */
export function wordG(ctx, w, n = 0, fallback = 0) {
  const hits = ctx.words.filter(x => norm(x.word) === norm(w));
  return hits[n] ? hits[n].start : fallback;
}

/** Draw greyscale light (white = scratched) into an offscreen canvas and read it back as Uint8 tone. */
export function toneOf(w, h, draw) {
  w = Math.ceil(w); h = Math.ceil(h);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  draw(g, w, h);
  const d = g.getImageData(0, 0, w, h).data, out = new Uint8Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4];
  return out;
}

const smooth = p => p * p * (3 - 2 * p);
const TEX = {}; // board micro-texture, shared by all boards of one size (constant)

export function makeBoard(root, ctx, name = 'Board') {
  const W = ctx.width, H = ctx.height;
  const cv = el('canvas', { 'data-name': name, width: W, height: H, style: { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' } }, root);
  const g = cv.getContext('2d');
  const img = g.createImageData(W, H), px = img.data;
  const V = new Float32Array(W * H), C = new Uint8Array(W * H);
  // clay board micro-texture: fixed (never boils), ±2 code values on the black, ±4 % on the white
  const tex = TEX[W + 'x' + H] ?? (TEX[W + 'x' + H] = new Int8Array(W * H));
  if (!tex.done) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let hsh = (x * 374761393 + y * 668265263) | 0; hsh = Math.imul(hsh ^ (hsh >>> 13), 1274126177); hsh ^= hsh >>> 16;
    const r = (hsh & 1023) / 1023;
    const fib = ((x + (y >> 5)) % 7 === 0 ? 0.6 : 0); // faint drag direction of the clay coating
    tex[y * W + x] = Math.round((r - 0.5) * 4 + fib);
  }
  tex.done = true;
  const ops = [];
  let cam = { z: 1, cx: W / 2, cy: H / 2 };
  const toScreen = (wx, wy) => [(wx - cam.cx) * cam.z + W / 2, (wy - cam.cy) * cam.z + H / 2];

  let over = false; // a later, deeper cut paints over earlier light (the gouge)
  function put(i, v, c) { if (v > V[i] || (over && v > 0.5)) { V[i] = over ? Math.max(v, V[i]) : v; C[i] = c; } }

  /** Hatch a tone field. o: {name,x,y,w,h,tone|draw, angle(deg), spacing, maxW, gamma, lo, color, hi:{thr,color},
   *  t0, dur, lineTime, order(1|-1), waves:[[amp,fx,fy,phase]], wobble, pressure, alpha, seed} */
  function hatch(o) {
    let w = Math.ceil(o.w), h = Math.ceil(o.h);
    let tone = o.tone ?? toneOf(w, h, o.draw);
    { // crop to the part that holds light (big patches are mostly black)
      let x0 = w, x1 = -1, y0 = h, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (tone[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
      const nw = x1 - x0 + 1, nh = y1 - y0 + 1;
      if (nw * nh < w * h * 0.9) {
        const t2 = new Uint8Array(nw * nh);
        for (let y = 0; y < nh; y++) t2.set(tone.subarray((y + y0) * w + x0, (y + y0) * w + x0 + nw), y * nw);
        o = { ...o, x: o.x + x0, y: o.y + y0 }; w = nw; h = nh; tone = t2;
      }
    }
    const th = (o.angle ?? 0) * Math.PI / 180, ux = Math.cos(th), uy = Math.sin(th), nx = -uy, ny = ux;
    const s = o.spacing, seed = o.seed ?? 1;
    const corners = [[o.x, o.y], [o.x + w, o.y], [o.x, o.y + h], [o.x + w, o.y + h]];
    const ds = corners.map(([x, y]) => x * nx + y * ny), as = corners.map(([x, y]) => x * ux + y * uy);
    const kmin = Math.floor(Math.min(...ds) / s) - 1, kmax = Math.ceil(Math.max(...ds) / s) + 1;
    const amin = Math.min(...as), amax = Math.max(...as);
    const n = kmax - kmin + 1;
    const lb = new Float32Array(n), lw = new Float32Array(n);
    for (let k = 0; k < n; k++) { lb[k] = 0.8 + 0.2 * rand(k * 7.13 + seed * 31.7); lw[k] = 0.88 + 0.24 * rand(k * 3.71 + seed * 17.3); }
    const lo = o.lo ?? 0, gamma = o.gamma ?? 0.85, maxW = o.maxW ?? 0.86;
    const hw = new Float32Array(256);
    for (let v = 0; v < 256; v++) { const q = (v / 255 - lo) / (1 - lo); hw[v] = q <= 0.02 ? -1 : 0.5 * s * maxW * Math.pow(q, gamma); }
    // hand wobble: smooth field, lines gently wavy and never perfectly parallel (fixed per board, not per frame)
    // hand wobble (lines gently wavy, never perfectly parallel) and knife pressure (harder / lighter along each stroke):
    // both are sums of sines in world space → separable into row/column tables, so building is cheap and the
    // field is fixed per board (imperfection designed once, never boiling).
    const wa = (o.wobble ?? 0.3) * s, pr = o.pressure ?? 0.15;
    const wterms = [[wa * 0.6, 0.0061, 0.0043, seed], [wa * 0.4, 0.0173, -0.0119, seed * 2.3], ...(o.waves ?? [])];
    // pressure terms in (along a, across d) → world: a·k1 + d·k2 = X(ux k1 + nx k2) + Y(uy k1 + ny k2)
    const pterms = [[0.55, 0.019, 0.31, seed], [0.45, 0.047, -0.13, seed * 1.7]].map(([A, k1, k2, ph]) => [A, ux * k1 + nx * k2, uy * k1 + ny * k2, ph]);
    const tables = terms => terms.map(([A, fx, fy, ph]) => {
      const sx = new Float32Array(w), cx = new Float32Array(w), sy = new Float32Array(h), cy = new Float32Array(h);
      for (let x = 0; x < w; x++) { const v = (x + o.x) * fx + ph; sx[x] = A * Math.sin(v); cx[x] = A * Math.cos(v); }
      for (let y = 0; y < h; y++) { const v = (y + o.y) * fy; sy[y] = Math.sin(v); cy[y] = Math.cos(v); }
      return { sx, cx, sy, cy };
    });
    const WT = tables(wterms), PT = tables(pterms);
    // bake both fields once (multiply-adds only) where there is light to cut
    const warp = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (tone[i] === 0) continue;
      let wv = 0; for (const T of WT) wv += T.sx[x] * T.cy[y] + T.cx[x] * T.sy[y];
      warp[i] = wv;
      if (pr > 0) { let nz = 0; for (const T of PT) nz += T.sx[x] * T.cy[y] + T.cx[x] * T.sy[y]; tone[i] = (tone[i] * (1 - pr + pr * (0.5 + 0.5 * nz))) | 0; }
    }
    ops.push({ type: 'hatch', o, w, h, tone, ux, uy, nx, ny, s, kmin, n, amin, amax, lb, lw, hw, warp,
      t0: o.t0 ?? 0, dur: o.dur ?? 0.6, lt: o.lineTime ?? 0.16, order: o.order ?? 1,
      color: o.color ?? 0, hi: o.hi, alpha: o.alpha ?? 1 });
  }

  /** One knife cut along a polyline. o: {pts, width, color, t0, t1, taper, rough, alpha, seed, glint} */
  function stroke(o) {
    // resample to short pieces so width (taper, pressure) can change along the cut
    const pts = [], step = o.step ?? 8;
    for (let i = 1; i < o.pts.length; i++) {
      const [x0, y0] = o.pts[i - 1], [x1, y1] = o.pts[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let k = 0; k < n; k++) pts.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
    }
    pts.push(o.pts[o.pts.length - 1]);
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    ops.push({ type: 'stroke', o, pts, L, total: L[L.length - 1] });
  }
  function dots(list) { ops.push({ type: 'dots', list }); }
  function custom(fn) { ops.push({ type: 'custom', fn }); }
  function wipe(t0, t1, ghost = 0.05, camAtEnd = {}) { ops.push({ type: 'wipe', t0, t1, ghost, cam: camAtEnd }); }

  // ---------- rasterisers (screen space, world sampling) ----------
  function drawHatch(op, t) {
    if (t < op.t0) return;
    const { o, w, h, tone, ux, uy, nx, ny, s, kmin, n, amin, amax, lb, lw, hw, warp, t0, dur, lt, order, alpha } = op;
    const z = cam.z, span = amax - amin, dk = n > 1 ? dur / (n - 1) : 0;
    const [sx0, sy0] = toScreen(o.x, o.y), [sx1, sy1] = toScreen(o.x + w, o.y + h);
    const X0 = Math.max(0, Math.floor(sx0)), X1 = Math.min(W, Math.ceil(sx1)), Y0 = Math.max(0, Math.floor(sy0)), Y1 = Math.min(H, Math.ceil(sy1));
    const hiThr = op.hi ? Math.round(op.hi.thr * 255) : 999, hiC = op.hi?.color ?? 0, col = op.color;
    const done = t >= t0 + dur + lt;
    for (let sy = Y0; sy < Y1; sy++) {
      const wy = (sy + 0.5 - H / 2) / z + cam.cy, iy = Math.floor(wy - o.y);
      if (iy < 0 || iy >= h) continue;
      const row = iy * w;
      for (let sx = X0; sx < X1; sx++) {
        const wx = (sx + 0.5 - W / 2) / z + cam.cx, ix = Math.floor(wx - o.x);
        if (ix < 0 || ix >= w) continue;
        const tv = tone[row + ix];
        const half = hw[tv]; if (half < 0) continue;
        const q = (wx * nx + wy * ny + warp[row + ix]) / s, k = Math.round(q), kk = k - kmin;
        if (kk < 0 || kk >= n) continue;
        let cov = (half * lw[kk] - Math.abs(q - k) * s) * z + 0.5;
        if (cov <= 0) continue; if (cov > 1) cov = 1;
        if (!done) {
          const idx = order > 0 ? kk : n - 1 - kk, Tk = t0 + idx * dk;
          if (t < Tk) continue;
          const pr = (t - Tk) / lt;
          if (pr < 1) {
            const a = wx * ux + wy * uy;
            const head = (k & 1) ? amax - pr * span : amin + pr * span; // boustrophedon: the hand goes back and forth
            const c2 = clamp(((k & 1) ? a - head : head - a) * z * 0.5 + 0.5);
            cov *= c2; if (cov <= 0) continue;
          }
        }
        put(sy * W + sx, cov * lb[kk] * alpha, tv >= hiThr ? hiC : col);
      }
    }
    // tool glints: the fresh tip of each line still being cut
    if (!done && o.glint !== false) {
      for (let kk = 0; kk < n; kk++) {
        const idx = order > 0 ? kk : n - 1 - kk, Tk = t0 + idx * dk, pr = (t - Tk) / lt;
        if (pr < 0 || pr >= 1) continue;
        const k = kk + kmin, a = (k & 1) ? amax - pr * span : amin + pr * span, d = k * s;
        const wx = a * ux + d * nx, wy = a * uy + d * ny, ix = Math.floor(wx - o.x), iy = Math.floor(wy - o.y);
        if (ix < 0 || iy < 0 || ix >= w || iy >= h || tone[iy * w + ix] < 40) continue;
        const [gx, gy] = toScreen(wx, wy);
        disc(gx, gy, 1.6 * z + 0.6, 1, 0);
      }
    }
  }
  function disc(cx, cy, r, v, c) {
    const X0 = Math.max(0, Math.floor(cx - r - 1)), X1 = Math.min(W, Math.ceil(cx + r + 1)), Y0 = Math.max(0, Math.floor(cy - r - 1)), Y1 = Math.min(H, Math.ceil(cy + r + 1));
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) {
      const cov = clamp(r - Math.hypot(x + 0.5 - cx, y + 0.5 - cy) + 0.5);
      if (cov > 0) put(y * W + x, cov * v, c);
    }
  }
  /** Capsule segment in WORLD coords with widths w0→w1 (world px). */
  function seg(x0, y0, x1, y1, w0, w1, v, c) {
    const [a0, b0] = toScreen(x0, y0), [a1, b1] = toScreen(x1, y1), z = cam.z;
    const r = Math.max(w0, w1) * z / 2 + 1;
    const X0 = Math.max(0, Math.floor(Math.min(a0, a1) - r)), X1 = Math.min(W, Math.ceil(Math.max(a0, a1) + r));
    const Y0 = Math.max(0, Math.floor(Math.min(b0, b1) - r)), Y1 = Math.min(H, Math.ceil(Math.max(b0, b1) + r));
    const dx = a1 - a0, dy = b1 - b0, L2 = dx * dx + dy * dy || 1;
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) {
      const px_ = x + 0.5 - a0, py_ = y + 0.5 - b0;
      const u = clamp((px_ * dx + py_ * dy) / L2);
      const d = Math.hypot(px_ - u * dx, py_ - u * dy);
      const cov = clamp(((w0 + (w1 - w0) * u) * z) / 2 - d + 0.5);
      if (cov > 0) put(y * W + x, cov * v, c);
    }
  }
  function drawStroke(op, t) {
    const { o, pts, L, total } = op;
    if (t < o.t0) return;
    const pr = smooth(clamp((t - o.t0) / Math.max(1e-3, o.t1 - o.t0)));
    const vis = total * pr, taper = o.taper ?? Math.min(total * 0.2, 30), seed = o.seed ?? 3;
    const widthAt = l => {
      const tp = Math.min(1, l / taper, (total - l) / taper);
      const rough = 1 + (o.rough ?? 0.12) * (0.6 * Math.sin(l * 0.06 + seed) + 0.4 * Math.sin(l * 0.21 + seed * 3.1));
      return Math.max(0.6, o.width * (0.25 + 0.75 * Math.sqrt(Math.max(0, tp))) * rough);
    };
    const v = o.alpha ?? 1, c = o.color ?? 0;
    over = !!o.over;
    for (let i = 1; i < pts.length; i++) {
      if (L[i - 1] >= vis) break;
      let [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      let l1 = L[i];
      if (L[i] > vis) { const f = (vis - L[i - 1]) / (L[i] - L[i - 1]); x1 = x0 + (x1 - x0) * f; y1 = y0 + (y1 - y0) * f; l1 = vis; }
      seg(x0, y0, x1, y1, widthAt(L[i - 1]), widthAt(l1), v, c);
      if (L[i] >= vis && pr < 1 && o.glint !== false) { const [gx, gy] = toScreen(x1, y1); disc(gx, gy, (o.width * 0.5 + 1.2) * cam.z, 1, 0); }
    }
    over = false;
  }
  function applyWipe(op, t) {
    if (t < op.t0) return;
    const p = clamp((t - op.t0) / (op.t1 - op.t0)), e = p * p * (3 - 2 * p);
    const front = -0.08 * W + e * 1.16 * W;
    for (let y = 0; y < H; y++) {
      const cut = p >= 1 ? W : Math.min(W, Math.max(0, Math.floor(front + 14 * Math.sin(y * 0.011) + 7 * Math.sin(y * 0.047 + 1.3))));
      const row = y * W;
      for (let x = 0; x < cut; x++) V[row + x] *= op.ghost;
    }
  }

  const api = { seg, disc, put, toScreen, W, H, get z() { return cam.z; } };

  function runOps(t, camera, upto) {
    cam = { z: 1, cx: W / 2, cy: H / 2, ...camera };
    V.fill(0); C.fill(0);
    // a finished wipe buries everything before it: start from its cached ghost (computed once, from constants only)
    let start = 0;
    for (let i = upto - 1; i >= 0; i--) {
      const op = ops[i];
      if (op.type !== 'wipe' || t < op.t1) continue;
      if (!op.cache) {
        if (op.ghost > 0) {
          runOps(op.t1, op.cam ?? {}, i);
          op.cache = V.map(v => v * op.ghost); op.cacheC = C.slice();
        } else { op.cache = new Float32Array(W * H); op.cacheC = new Uint8Array(W * H); }
        cam = { z: 1, cx: W / 2, cy: H / 2, ...camera };
      }
      V.set(op.cache); C.set(op.cacheC); start = i + 1; break;
    }
    for (let i = start; i < upto; i++) {
      const op = ops[i];
      if (op.type === 'hatch') drawHatch(op, t);
      else if (op.type === 'stroke') drawStroke(op, t);
      else if (op.type === 'dots') { for (const d of op.list) if (t >= d.t) { const [x, y] = toScreen(d.x, d.y); disc(x, y, d.r * cam.z, (d.v ?? 1) * clamp((t - d.t) * 15), d.c ?? 0); } }
      else if (op.type === 'custom') op.fn(t, api);
      else if (op.type === 'wipe') applyWipe(op, t);
    }
  }

  function render(t, camera) {
    runOps(t, camera, ops.length);
    const bR = BOARD[0], bG = BOARD[1], bB = BOARD[2];
    for (let i = 0, j = 0; i < V.length; i++, j += 4) {
      const v = V[i], tx = tex[i];
      if (v <= 0.002) { px[j] = bR + tx; px[j + 1] = bG + tx; px[j + 2] = bB + tx; px[j + 3] = 255; continue; }
      const c = PAL[C[i]], gr = 1 + tx * 0.012;
      px[j] = bR + (c[0] * gr - bR) * v; px[j + 1] = bG + (c[1] * gr - bG) * v; px[j + 2] = bB + (c[2] * gr - bB) * v; px[j + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  return { cv, hatch, stroke, dots, custom, wipe, render, W, H, toScreen: (x, y) => toScreen(x, y), get cam() { return cam; } };
}

/** Polyline of a circle (for knife-cut rings). */
export function ringPts(cx, cy, r, n = 48, a0 = -2.2, turns = 1.06) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI * 2 * turns; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return out;
}

/** Screen-space label revealed left→right as if the knife lettered it. Returns {node, update(t)}. */
export function label(root, L, { name, text, html, x, y, size, weight = 600, family = FONT.label, color = HEX.white, track = '0.14em', caps = true, t0 = 0, dur = 0.35, italic = false, anchor = 'left', opacity = 0.94, out }) {
  const node = el('div', { 'data-name': name, style: {
    position: 'absolute', left: x + 'px', top: y + 'px', fontFamily: family, fontWeight: weight, fontSize: size + 'px', lineHeight: 1.15,
    letterSpacing: track, textTransform: caps ? 'uppercase' : 'none', color, whiteSpace: 'nowrap', fontStyle: italic ? 'italic' : 'normal',
    fontKerning: 'normal', fontSynthesis: 'none', textAlign: anchor === 'center' ? 'center' : anchor === 'right' ? 'right' : 'left', fontVariantNumeric: 'lining-nums tabular-nums', opacity: 0,
    transform: anchor === 'right' ? 'translateX(-100%)' : anchor === 'center' ? 'translateX(-50%)' : 'none',
  } }, root);
  if (html) node.innerHTML = html; else node.textContent = text;
  return {
    node,
    update(t) {
      const p = clamp((t - t0) / dur);
      const gone = out != null ? clamp((t - out) / 0.12) : 0;
      node.style.opacity = p > 0 ? String(opacity * (1 - gone)) : '0';
      node.style.clipPath = `inset(-20% ${((1 - smooth(p)) * 100).toFixed(2)}% -20% -2%)`;
    },
  };
}
