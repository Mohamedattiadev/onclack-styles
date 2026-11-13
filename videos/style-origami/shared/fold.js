// FOLDED PAPER — tiny origami engine (C). Real CSS 3D: every face of a sheet is one flat div with a matrix3d that we
// compute ourselves (hinge chain = Rodrigues rotations about the crease lines), so we also know every face normal:
// one key light (upper-left, above the table) shades each face, the back side of coloured paper is white, and every
// face casts a real projected shadow on the table. Everything is a pure function of global time T.
import { svg, el, rand, clamp, progress } from '/onclack-styles/engine/lib/anim.js';

// ---------- 4×4 matrices, column-major (same layout as CSS matrix3d) ----------
export const M = {
  I: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  },
  T: (x, y, z = 0) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
  S: s => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1],
  Rz(deg) { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
  Rx(deg) { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
  /** Rotation by deg about the line through p with unit direction u (Rodrigues). */
  axis(p, u, deg) {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), k = 1 - c;
    const [x, y, z] = u;
    const R = [
      c + x * x * k, y * x * k + z * s, z * x * k - y * s, 0,
      x * y * k - z * s, c + y * y * k, z * y * k + x * s, 0,
      x * z * k + y * s, y * z * k - x * s, c + z * z * k, 0,
      0, 0, 0, 1,
    ];
    return M.mul(M.T(p[0], p[1], p[2] ?? 0), M.mul(R, M.T(-p[0], -p[1], -(p[2] ?? 0))));
  },
  pt: (m, x, y, z = 0) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]],
  dir: (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z],
  css: m => `matrix3d(${m.map(v => +v.toFixed(6)).join(',')})`,
};
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// ---------- palette (4 papers on a grey-wood table; red only for the NO) ----------
export const PAL = {
  table: '#706D68', slate: '#4C6987', kraft: '#B48E5E', paper: '#ECE7DB', red: '#B3302A',
  ink: '#26272A', inkLight: '#F1ECE1', shadow: '#151a24', back: '#EEEAE1',
};
// Key light: from the left, high, slightly in front of the table (direction TOWARD the light, world coords; z = up).
export const LIGHT = norm([-0.55, 0.62, 0.66]);
const AMB = 0.36;
const FLAT = AMB + (1 - AMB) * LIGHT[2];

// ---------- textures made once in code (deterministic, seeded) ----------
let paperTex = null, woodTex = null;
function paperTexture() {
  if (paperTex) return paperTex;
  const c = document.createElement('canvas'); c.width = c.height = 384;
  const g = c.getContext('2d');
  const img = g.createImageData(384, 384);
  for (let i = 0; i < 384 * 384; i++) {
    const v = 236 + (rand(i * 0.731 + 3.1) - 0.5) * 22;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // long soft fibres (washi-like but subtle), fixed per seed
  for (let f = 0; f < 140; f++) {
    const x = rand(f * 3.3) * 384, y = rand(f * 7.1 + 1) * 384, a = rand(f * 1.7 + 2) * Math.PI, L = 10 + rand(f * 5.9) * 34;
    g.strokeStyle = rand(f * 2.3) > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(150,145,135,0.18)';
    g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + 4, y + Math.sin(a) * L * 0.5 - 3, x + Math.cos(a) * L, y + Math.sin(a) * L);
    g.stroke();
  }
  paperTex = c.toDataURL('image/png');
  return paperTex;
}
function woodTexture() {
  if (woodTex) return woodTex;
  const W = 1024, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  const plank = 256;
  // periodic value noise along x (period W) so the tile has no seams
  const vn = (x, seed, cells) => {
    const f = (x / W) * cells, i = Math.floor(f), t = f - i, s = t * t * (3 - 2 * t);
    const a = rand(((i % cells) + cells) % cells * 1.37 + seed), b = rand((((i + 1) % cells) + cells) % cells * 1.37 + seed);
    return a + (b - a) * s;
  };
  for (let y = 0; y < H; y++) {
    const p = Math.floor(y / plank), py = y - p * plank;
    const tone = (rand(p * 9.7 + 1) - 0.5) * 10;
    for (let x = 0; x < W; x++) {
      const wob = (vn(x, p * 3.1, 2) - 0.5) * 22 + (vn(x, p * 5.3 + 2, 7) - 0.5) * 5;
      const yy = py + wob;
      // growth rings: irregular spacing from noise, thin darker lines
      const ring = Math.sin(yy * (0.075 + 0.03 * rand(p * 4.4)) + vn(x, p * 7.7, 3) * 4 + Math.sin(yy * 0.021 + p) * 2.2);
      const line = Math.pow(Math.max(0, ring), 30) * (0.35 + 0.65 * vn(x, p * 1.9 + 4, 5));
      const streak = (vn(x + yy * 3, p * 2.2 + 9, 64) - 0.5) * 7;
      let v = 112 + tone + streak - line * 16 + (rand(x * 0.37 + y * 13.1) - 0.5) * 7;
      if (py < 2) v -= 34; else if (py < 4) v -= 10; // plank seam
      const i = (y * W + x) * 4;
      img.data[i] = v + 1; img.data[i + 1] = v; img.data[i + 2] = v - 3; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  woodTex = c.toDataURL('image/png');
  return woodTex;
}

// ---------- camera ----------
/** cam = { x, y, z, s, tilt, yaw }. World div transform + eye position in world coords (for facing tests). */
export function camMatrix(cam) {
  return M.mul(M.Rx(cam.tilt), M.mul(M.Rz(cam.yaw ?? 0), M.mul(M.S(cam.s), M.T(-cam.x, -cam.y, -(cam.z ?? 0)))));
}
export function eyeWorld(cam, P) {
  const inv = M.mul(M.T(cam.x, cam.y, cam.z ?? 0), M.mul(M.S(1 / cam.s), M.mul(M.Rz(-(cam.yaw ?? 0)), M.Rx(-cam.tilt))));
  return M.pt(inv, 0, 0, P);
}

// ---------- the world: table + shadow layers + sheets ----------
export function makeWorld(root, ctx, { perspective = 1300, region = [-1400, -1100, 2800, 2200] } = {}) {
  const view = el('div', { 'data-name': 'Camera', style: {
    position: 'absolute', inset: '0', overflow: 'hidden', perspective: perspective + 'px', perspectiveOrigin: '50% 50%',
    background: '#3a3835',
  } }, root);
  const world = el('div', { 'data-name': 'Table (world)', style: {
    position: 'absolute', left: '50%', top: '50%', width: '0', height: '0', transformStyle: 'preserve-3d',
  } }, view);
  const [rx, ry, rw, rh] = region;
  // grey-wood table with one key-light pool (world space, so it stays put while the camera moves)
  const table = el('div', { 'data-name': 'Grey wood table', style: {
    position: 'absolute', left: rx + 'px', top: ry + 'px', width: rw + 'px', height: rh + 'px',
    backgroundColor: PAL.table, backgroundImage: `url(${woodTexture()})`, backgroundSize: '1024px 1024px',
    backgroundPosition: `${-rx}px ${-ry}px`, transform: 'translateZ(-0.6px)',
  } }, world);
  el('div', { style: {
    position: 'absolute', inset: '0',
    background: 'radial-gradient(ellipse 60% 55% at 38% 36%, rgba(255,248,232,0.22), rgba(255,248,232,0) 62%), radial-gradient(ellipse 70% 62% at 47% 47%, rgba(0,0,0,0) 45%, rgba(10,12,18,0.42) 100%)',
  } }, table);

  const mkShadow = (z, name, blur, op) => {
    const s = svg('svg', { 'data-name': name, viewBox: `${rx} ${ry} ${rw} ${rh}`, width: rw, height: rh }, world);
    Object.assign(s.style, { position: 'absolute', left: rx + 'px', top: ry + 'px', transform: `translateZ(${z}px)`, overflow: 'visible', pointerEvents: 'none' });
    const f = svg('filter', { id: `${name.replace(/\W/g, '')}-${ctx.start}`, x: '-20%', y: '-20%', width: '140%', height: '140%' }, s);
    svg('feGaussianBlur', { stdDeviation: blur }, f);
    const g = svg('g', { filter: `url(#${f.id})`, opacity: op, fill: PAL.shadow }, s);
    return { s, g, pool: [], z };
  };
  const shadowLo = mkShadow(0.2, 'Contact shadows', 2.2, 0.42);
  const shadowHi = mkShadow(1.4, 'Cast shadows', 5, 0.30);
  const overlay = svg('svg', { 'data-name': 'Diagram marks on the sea', viewBox: `${rx} ${ry} ${rw} ${rh}`, width: rw, height: rh }, world);
  Object.assign(overlay.style, { position: 'absolute', left: rx + 'px', top: ry + 'px', transform: 'translateZ(1.1px)', overflow: 'visible', pointerEvents: 'none' });

  const sheets = [];
  const W = {
    view, world, overlay, sheets, cam: null, eye: [0, 0, 1000],
    add(def) { const sh = makeSheet(world, def, ctx); sheets.push(sh); return sh; },
    /** Render the whole world at global time T with camera `cam` and an optional screen shake [dx, dy]. */
    update(T, cam, shakeXY = [0, 0]) {
      const C = camMatrix(cam);
      W.eye = eyeWorld(cam, perspective);
      world.style.transform = `translate(${shakeXY[0].toFixed(2)}px, ${shakeXY[1].toFixed(2)}px) ${M.css(C)}`;
      const lo = [], hi = [];
      for (const sh of sheets) sh.update(T, W.eye, lo, hi);
      drawShadows(shadowLo, lo);
      drawShadows(shadowHi, hi);
    },
  };
  return W;
}

function drawShadows(layer, polys) {
  while (layer.pool.length < polys.length) layer.pool.push(svg('polygon', {}, layer.g));
  layer.pool.forEach((p, i) => {
    if (i < polys.length) { p.setAttribute('points', polys[i].map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')); p.style.display = ''; }
    else p.style.display = 'none';
  });
}

// ---------- a sheet of paper ----------
/**
 * def = {
 *   name, color, back (colour of the reverse side), ink (print colour), z (lift above table),
 *   place: T => ({ x, y, z?, rot?, m? })   world placement (m = extra matrix applied after, e.g. a spin),
 *   visible: T => bool,
 *   faces: [{ id, poly: [[x,y]...], parent?: id, hinge?: [[x,y],[x,y]], angle: T => deg (+ = the child lifts toward
 *            the front side / off the table; − = mountain), score?: [t0, t1] (crease drawn as a diagram line), lift?: px }],
 *   art: (g, face) => void   printed graphics in sheet coords (called once per face, clipped by the face),
 * }
 */
function makeSheet(world, def, ctx) {
  // faces are built R× larger and scaled back down, so close-ups (camera s ≈ 2.5) stay sharp
  const R = def.res ?? 2.5;
  const tex = paperTexture();
  const faces = [];
  const byId = {};
  const hingeSegs = def.faces.filter(f => f.hinge && f.parent).map(f => f.hinge);
  const onSeg = (x, y, p, q) => {
    const dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy || 1;
    const t = ((x - p[0]) * dx + (y - p[1]) * dy) / L2;
    return t > -0.01 && t < 1.01 && Math.abs((x - p[0]) * dy - (y - p[1]) * dx) / Math.sqrt(L2) < 0.6;
  };
  const darkPaper = def.darkPaper ?? (def.color === PAL.slate || def.color === PAL.red);
  for (const f of def.faces) {
    const xs = f.poly.map(p => p[0]), ys = f.poly.map(p => p[1]);
    const bx = Math.min(...xs) - 1, by = Math.min(...ys) - 1, bw = Math.max(...xs) - bx + 1, bh = Math.max(...ys) - by + 1;
    const node = el('div', { 'data-name': `${def.name} · ${f.id}`, style: {
      position: 'absolute', left: '0', top: '0', width: bw * R + 'px', height: bh * R + 'px', transformOrigin: '0 0',
      clipPath: `polygon(${f.poly.map(p => `${((p[0] - bx) * R).toFixed(2)}px ${((p[1] - by) * R).toFixed(2)}px`).join(',')})`,
      backgroundColor: def.color, backgroundImage: `url(${tex})`, backgroundBlendMode: 'multiply',
      backgroundSize: `${384 * R}px ${384 * R}px`, backgroundPosition: `${(-bx - (def.texOff ?? 0)) * R}px ${-by * R}px`, backfaceVisibility: 'visible',
    } }, world);
    const art = svg('svg', { viewBox: `${bx} ${by} ${bw} ${bh}`, width: bw * R, height: bh * R }, node);
    Object.assign(art.style, { position: 'absolute', left: '0', top: '0', overflow: 'visible' });
    const front = svg('g', {}, art);
    if (def.art) def.art(front, f);
    // printed text only on the faces it actually touches (no hidden duplicates)
    for (const t of [...front.querySelectorAll('text')]) {
      // estimated box (no layout read: getBBox here forced a relayout per face and stalled loading)
      const size = +t.getAttribute('font-size'), w = t.textContent.length * size * 0.68, x = +t.getAttribute('x'), y = +t.getAttribute('y');
      const anc = t.getAttribute('text-anchor'), x0 = anc === 'middle' ? x - w / 2 : anc === 'end' ? x - w : x;
      if (x0 > bx + bw || x0 + w < bx || y - size > by + bh || y + size * 0.3 < by) t.remove();
    }
    // paper edge catching the light (thin, fixed)
    const n = f.poly.length;
    for (let i = 0; i < n; i++) {
      const a = f.poly[i], b = f.poly[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (hingeSegs.some(([p, q]) => onSeg(mx, my, p, q))) continue;
      svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'rgba(255,252,244,0.2)', 'stroke-width': 2 }, art);
    }
    const creaseG = svg('g', {}, art);
    const shade = el('div', { style: { position: 'absolute', inset: '0', background: '#0d1220', opacity: '0' } }, node);
    const face = { def: f, node, art, front, creaseG, shade, bx, by, bw, bh, lines: [], sign: 1, back: null };
    faces.push(face); byId[f.id] = face;
  }
  // hinge sign: + angle must lift the child toward +z (the front side); centroid test
  for (const face of faces) {
    const f = face.def;
    if (!f.hinge) continue;
    const [p, q] = f.hinge;
    const u = norm([q[0] - p[0], q[1] - p[1], 0]);
    const cx = f.poly.reduce((s, v) => s + v[0], 0) / f.poly.length - p[0];
    const cy = f.poly.reduce((s, v) => s + v[1], 0) / f.poly.length - p[1];
    face.u = u;
    face.sign = (u[0] * cy - u[1] * cx) >= 0 ? 1 : -1;
  }
  // creases: a diagram line along every hinge with a score window, drawn on the child and its parent
  const creases = [];
  for (const face of faces) {
    const f = face.def;
    if (!f.hinge || !f.score) continue;
    const kind = f.kind ?? 'valley';
    const ink = darkPaper ? 'rgba(244,240,230,0.85)' : 'rgba(38,39,42,0.75)';
    const crease = { f, kind, lines: [] };
    for (const host of [face, byId[f.parent]].filter(Boolean)) {
      const ln = svg('line', { x1: f.hinge[0][0], y1: f.hinge[0][1], x2: f.hinge[0][0], y2: f.hinge[0][1], stroke: ink,
        'stroke-width': def.creaseW ?? 2.2, 'stroke-dasharray': kind === 'valley' ? '9 6' : '11 4 2.5 4', 'stroke-linecap': 'butt' }, host.creaseG);
      crease.lines.push(ln);
    }
    creases.push(crease);
  }

  let shown = null;
  return {
    def, faces,
    update(T, eye, lo, hi) {
      const vis = def.visible ? def.visible(T) : true;
      if (vis !== shown) { for (const fc of faces) fc.node.style.display = vis ? '' : 'none'; shown = vis; }
      if (!vis) return;
      const pl = def.place(T);
      let base = M.mul(M.T(pl.x, pl.y, (pl.z ?? 0) + (def.z ?? 0.5)), M.Rz(pl.rot ?? 0));
      if (pl.m) base = M.mul(base, pl.m);
      const mats = {};
      for (const fc of faces) {
        const f = fc.def;
        let m = f.parent ? mats[f.parent] : base;
        if (f.hinge) {
          const ang = (f.angle ? f.angle(T) : 0) * fc.sign;
          if (ang) m = M.mul(m, M.axis([f.hinge[0][0], f.hinge[0][1], 0], fc.u, ang));
        }
        if (f.lift) m = M.mul(m, M.T(0, 0, f.lift));
        mats[f.id] = m;
        fc.node.style.transform = M.css(M.mul(m, M.mul(M.T(fc.bx, fc.by, 0), M.S(1 / R))));
        // light: which side faces the eye, Lambert on that side
        let n = norm(M.dir(m, 0, 0, 1));
        const c = M.pt(m, fc.bx + fc.bw / 2, fc.by + fc.bh / 2, 0);
        const toEye = [eye[0] - c[0], eye[1] - c[1], eye[2] - c[2]];
        const frontSeen = dot(n, toEye) >= 0;
        if (!frontSeen) n = [-n[0], -n[1], -n[2]];
        if (fc.back !== !frontSeen) {
          fc.back = !frontSeen;
          fc.node.style.backgroundColor = fc.back ? (def.back ?? PAL.back) : def.color;
          fc.front.style.display = fc.back && !def.printBoth ? 'none' : '';
        }
        const lam = (AMB + (1 - AMB) * Math.max(0, dot(n, LIGHT))) / FLAT;
        if (lam < 1) { fc.shade.style.background = '#0d1220'; fc.shade.style.opacity = Math.min(0.5, (1 - lam) * 0.85).toFixed(3); }
        else { fc.shade.style.background = '#fffaf0'; fc.shade.style.opacity = Math.min(0.3, (lam - 1) * 1.3).toFixed(3); }
        // shadows: contact (everything, onto the wood) and cast (raised faces, onto everything lying flat)
        const pts = f.poly.map(p => M.pt(m, p[0], p[1], 0));
        const maxZ = Math.max(...pts.map(p => p[2]));
        lo.push(pts.map(p => { const h = p[2] + 2.5; return [p[0] - LIGHT[0] * h / LIGHT[2], p[1] - LIGHT[1] * h / LIGHT[2]]; }));
        if (maxZ > 4) hi.push(pts.map(p => { const h = Math.max(0, p[2] - 1.4); return [p[0] - LIGHT[0] * h / LIGHT[2], p[1] - LIGHT[1] * h / LIGHT[2]]; }));
      }
      // diagram crease lines: drawn by a bone folder (grow along the hinge), fade to a faint score once folded
      for (const cr of creases) {
        const [t0, t1] = cr.f.score;
        const g = progress(T, t0, t1);
        const [a, b] = cr.f.hinge;
        // diagram ink until the fold happens, then only a faint score remains (even if the sheet is unfolded later)
        const fadeAt = cr.f.creaseFade ?? t1 + 0.3;
        const op = g <= 0 ? 0 : 0.9 - 0.66 * clamp((T - fadeAt) / 0.45);
        for (const ln of cr.lines) {
          ln.setAttribute('x2', (a[0] + (b[0] - a[0]) * g).toFixed(2));
          ln.setAttribute('y2', (a[1] + (b[1] - a[1]) * g).toFixed(2));
          ln.setAttribute('opacity', op.toFixed(3));
        }
      }
    },
  };
}

// ---------- helpers for timing folds ----------
import { spring, springs } from '/onclack-styles/engine/lib/spring.js';
/** Fold angle: springs from `from` to `to` at time t0 (paper snaps a little: default spring, ~6 % overshoot). */
export const foldAt = (T, t0, to, cfg = springs.default, from = 0) => from + (to - from) * spring(T - t0, cfg);
/** Sequence of fold targets [[t, deg], ...] with springs between (closed form, no state). */
export { track } from '/onclack-styles/engine/lib/spring.js';
export { springs };

/** Printed text on paper (SVG text in sheet coords). */
export function print(g, text, x, y, { size = 30, weight = 700, fill = PAL.ink, anchor = 'middle', track = 0.06, family = 'Jost', opacity = 1 } = {}) {
  const t = svg('text', { x, y, 'font-family': family, 'font-weight': weight, 'font-size': size, fill, 'text-anchor': anchor,
    'letter-spacing': (track * size).toFixed(2), opacity, 'dominant-baseline': 'alphabetic' }, g);
  t.textContent = text;
  return t;
}
