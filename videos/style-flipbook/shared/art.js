// The drawings. art(n) = the pencil drawing on flipbook page n (10 pages per second of story).
// Three sections (sc.1 sea, sc.2 charges, sc.3 the vote) separated by fast riffles. After the NO the book is HELD:
// n stops; only real-time pencil notes (live()) are added to the held page.
import { C, DPS, G, B, R, T as Lt, hatch, ell, partial, xf, pd, hash, sr, clamp, lerp, prog, easeIO, easeOut, wordAt } from './kit.js';

export const PAGE = { landscape: { W: 1520, H: 980 }, portrait: { W: 1000, H: 1480 } };

export function times(words) {
  const w = (s, fb, k = 0) => wordAt(words, s, k, fb);
  const T0 = {
    oct: w('October', 0.58), y62: w('nineteen', 2.07), soviet: w('Soviet', 3.79), submarine: w('submarine', 4.3), hides: w('hides', 4.93),
    deep: w('deep', 5.42), sea: w('sea', 5.98), near: w('near', 6.24), cuba: w('Cuba', 6.52),
    above: w('Above', 7.56), american: w('American', 8.07), ships: w('ships', 8.63), drop: w('drop', 8.95), depth: w('depth', 9.79),
    charges: w('charges', 10.05), moscow: w('Moscow', 10.95), silent: w('silent', 11.93), days: w('days', 12.49),
    onboard: w('On', 13.67), nuclear: w('nuclear', 14.48), torpedo: w('torpedo', 14.88), fire: w('fire', 15.9), three: w('three', 16.51),
    officers: w('officers', 16.86), agree: w('agree', 17.61), two: w('Two', 18.29), yes: w('yes', 18.8),
    third: w('third', 20.25), vasili: w('Vasili', 20.61), arkhipov: w('Arkhipov', 21.12), says: w('says', 21.69), no: w('no', 22.03),
    world: w('world', 23.07), name: w('name', 23.73), forty: w('forty', 24.13), later: w('later', 24.73),
  };
  T0.r1 = T0.above - 0.35; T0.r2 = T0.onboard - 0.35;
  T0.nR1 = Math.round(T0.r1 * DPS); T0.nR2 = Math.round(T0.r2 * DPS);
  T0.nHold = Math.floor(T0.no * DPS);           // the drawing on screen when "no" is said — and then nothing more
  T0.bursts = [T0.depth + 0.15, T0.charges + 0.2, T0.moscow - 0.2];
  return T0;
}

/** Drawing number on screen at global time tg (stops at the hold). */
export const drawingAt = (T, tg) => Math.min(Math.floor(tg * DPS + 1e-6), T.nHold);
export const RIFFLE = 4; // drawings per riffle

/** Corner curl of the top page for drawing n: [a, b] legs along bottom / right edge (page units). */
export function curlFor(T, n, P) {
  if (n >= T.nHold) return [0, 0];
  for (const nr of [T.nR1, T.nR2]) {
    const k = n - nr;
    if (k >= 0 && k < RIFFLE) return [[0.5, 0.75], [1.15, 1.5], [0.62, 0.9], [0.22, 0.3]][k].map((f, i) => f * (i ? P.H : P.W) * (0.9 + 0.2 * hash(n, i, 3)));
  }
  if (n % 5 === 3) return [0, 0]; // sometimes the thumb lets a page go flat
  const a = P.W * (0.03 + 0.045 * hash(n, 1, 7));
  return [a, a * (1.0 + 0.5 * hash(n, 2, 7))];
}
export const sectionOf = (T, n) => (n >= T.nR2 + 2 ? 2 : n >= T.nR1 + 2 ? 1 : 0);

/* ======================================================================== */
export function makeArt(T, portrait, geo) {
  const P = portrait ? PAGE.portrait : PAGE.landscape;
  const pk = (l, p) => (portrait ? p : l);
  const field = pk([70, 108, 1330, 940], [130, 132, 962, 1290]);

  /* ---------------- reusable drawn things ---------------- */
  function sea(n, wl, f1, f2, f3, seed, q) {
    const [x0, , x1, y1] = field;
    let s = '';
    const pts = []; for (let x = x0 + 4; x <= x1 - 4; x += 30) pts.push([x, wl + 6 * Math.sin(x * 0.021 + q * 2.6) + 3 * Math.sin(x * 0.053 - q * 1.7)]);
    s += G(partial(pts, f1), seed, n, { w: 3.4 });
    const clipId = `sea${seed}`;
    s += `<clipPath id="${clipId}"><rect x="${x0}" y="${wl + 10}" width="${x1 - x0}" height="${y1 - wl - 10}"/></clipPath>`;
    s += `<g clip-path="url(#${clipId})">`;
    if (f1 > 0.5) s += `<g opacity="${clamp((f1 - 0.5) * 2)}">${hatch(x0, wl + 10, x1, y1, 30, -0.55, seed + 1, n, { op: 0.24, w: 1.5 })}</g>`;
    if (f2 > 0) s += `<g clip-path="url(#${clipId}b)">${hatch(x0, wl + 10, x1, y1, 24, 0.75, seed + 2, n, { op: 0.26, w: 1.5 })}</g><clipPath id="${clipId}b"><rect x="${x0}" y="${wl + pk(200, 270)}" width="${x1 - x0}" height="${(y1 - wl) * f2}"/></clipPath>`;
    if (f3 > 0) s += `<g clip-path="url(#${clipId}c)">${hatch(x0, wl + 10, x1, y1, 16, -1.25, seed + 3, n, { op: 0.3, w: 1.4 })}</g><clipPath id="${clipId}c"><rect x="${x0}" y="${wl + pk(360, 480)}" width="${x1 - x0}" height="${(y1 - wl) * f3}"/></clipPath>`;
    return s + '</g>';
  }

  const SUB_TOP = [[-0.5, 0.01], [-0.48, -0.03], [-0.42, -0.052], [-0.2, -0.06], [0.3, -0.055], [0.45, -0.03], [0.5, -0.006]];
  const SUB_BOT = [[0.5, 0.006], [0.44, 0.042], [0.3, 0.062], [-0.3, 0.066], [-0.44, 0.046], [-0.5, 0.01]];
  const SAIL = [[-0.18, -0.058], [-0.16, -0.15], [-0.03, -0.152], [0.03, -0.056]];
  function sub(cx, cy, L, n, seed, con, clean, tilt = 0) {
    const X = pts => xf(pts, cx, cy, L, tilt);
    let s = '';
    if (con > 0) {
      s += B(partial(ell(cx, cy, L * 0.5, L * 0.066, { rot: tilt }), con), seed, n);
      s += B(partial(X([[-0.56, 0], [0.56, 0]]), con), seed + 1, n);
      s += B(partial(X([[-0.19, -0.06], [-0.17, -0.155], [-0.02, -0.155], [0.04, -0.06]]), con), seed + 2, n);
    }
    if (clean > 0) {
      const hull = X([...SUB_TOP, ...SUB_BOT]);
      s += G(partial(hull, clean), seed + 3, n, { w: 3.6, over: 2 });
      s += G(partial(X(SAIL), clean), seed + 4, n, { w: 3.2 });
      if (clean >= 1) {
        s += G(X([[-0.11, -0.152], [-0.11, -0.21]]), seed + 5, n, { w: 2.4 }) + G(X([[-0.07, -0.152], [-0.07, -0.19]]), seed + 6, n, { w: 2.4 });
        s += G(X([[0.46, -0.03], [0.5, -0.085], [0.53, -0.085], [0.51, 0.0]]), seed + 7, n, { w: 2.6 });
        const id = `sh${seed}`;
        s += `<clipPath id="${id}"><path d="${pd(hull, seed + 3, n, { amp: 0 })}"/></clipPath><g clip-path="url(#${id})">${hatch(cx - L * 0.55, cy, cx + L * 0.55, cy + L * 0.08, 9, -0.9, seed + 8, n, { op: 0.6, w: 1.7 })}</g>`;
        for (let i = 0; i < 5; i++) s += G(X([[-0.38 + i * 0.16, 0.004], [-0.3 + i * 0.16, 0.004]]), seed + 20 + i, n, { w: 1.6, op: 0.5, two: false });
      }
    }
    return s;
  }

  const SHIP = [[-0.5, -0.1], [-0.43, -0.058], [0.44, -0.055], [0.5, -0.072], [0.48, 0.0], [-0.42, 0.0], [-0.5, -0.1]];
  const SHIP_TOP = [
    [[-0.26, -0.057], [-0.26, -0.14], [-0.08, -0.14], [-0.08, -0.056]],
    [[-0.23, -0.14], [-0.23, -0.195], [-0.14, -0.195], [-0.14, -0.14]],
    [[0.0, -0.056], [0.02, -0.15], [0.085, -0.15], [0.075, -0.056]],
    [[-0.185, -0.195], [-0.185, -0.34]], [[-0.23, -0.29], [-0.14, -0.29]],
    [[-0.37, -0.058], [-0.36, -0.092], [-0.3, -0.092], [-0.29, -0.058]], [[-0.36, -0.08], [-0.45, -0.088]],
    [[0.2, -0.055], [0.21, -0.09], [0.27, -0.09], [0.28, -0.055]],
  ];
  function ship(cx, wl, L, n, seed, con, clean) {
    const X = pts => xf(pts, cx, wl, L);
    let s = '';
    if (con > 0) {
      s += B(partial(X([[-0.55, -0.055], [0.55, -0.055]]), con), seed, n);
      s += B(partial(X([[-0.27, -0.2], [0.1, -0.2], [0.1, -0.055]]), con), seed + 1, n);
      s += B(partial(X([[-0.185, -0.05], [-0.185, -0.36]]), con), seed + 2, n);
    }
    if (clean > 0) {
      s += G(partial(X(SHIP), clean), seed + 3, n, { w: 3.4, over: 2 });
      SHIP_TOP.forEach((p, i) => { s += G(partial(X(p), clean), seed + 10 + i, n, { w: 2.8, smooth: false }); });
      if (clean >= 1) {
        const id = `shp${seed}`;
        s += `<clipPath id="${id}"><path d="${pd(X(SHIP), 0, 0, { amp: 0, smooth: false })}"/>${SHIP_TOP.slice(0, 3).map(p => `<path d="${pd(X([...p, p[0]]), 0, 0, { amp: 0, smooth: false })}"/>`).join('')}</clipPath>`;
        s += `<g clip-path="url(#${id})">${hatch(cx - L * 0.55, wl - L * 0.22, cx + L * 0.55, wl + 4, 7, -0.95, seed + 30, n, { op: 0.75, w: 1.8 })}${hatch(cx - L * 0.55, wl - L * 0.22, cx + L * 0.55, wl + 4, 9, 0.6, seed + 31, n, { op: 0.45, w: 1.4 })}</g>`;
      }
    }
    return s;
  }

  function burst(x, y, age, n, seed) {
    if (age < 0) return '';
    let s = '';
    if (age < 0.7) {
      const g = easeOut(clamp(age / 0.45)), Rr = pk(95, 85) * (0.35 + 0.65 * g);
      const pts = [];
      for (let i = 0; i <= 54; i++) {
        const a = i * 0.62, rr = Rr * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + seed))) * (0.85 + 0.15 * sr(seed, i, n));
        pts.push([x + Math.cos(a) * rr + Math.sin(i * 0.33) * Rr * 0.15, y + Math.sin(a) * rr * 0.85]);
      }
      s += G(pts, seed, n, { w: 2.6, over: 0, op: 0.85 * (1 - clamp((age - 0.45) / 0.25) * 0.5) });
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + sr(seed, k, 1) * 0.3, r0 = Rr * 1.1, r1 = Rr * (1.35 + 0.25 * g);
        s += G([[x + Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.85], [x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.85]], seed + 40 + k, n, { w: 2.4, over: 0, two: false });
      }
    }
    // what stays: a rubbed graphite smudge and a few rising bubbles
    const sm = clamp((age - 0.25) / 0.4);
    if (sm > 0) s += `<ellipse cx="${x}" cy="${y}" rx="${pk(80, 70)}" ry="${pk(56, 50)}" fill="url(#smudge)" opacity="${(0.55 * sm).toFixed(2)}"/>`;
    for (let b = 0; b < 4; b++) {
      const ba = age - 0.3 - b * 0.15; if (ba < 0 || ba > 2.2) continue;
      s += G(ell(x + sr(seed, b, 2) * 50 + Math.sin(ba * 5 + b) * 6, y - ba * 120, 5 + b * 2, 5 + b * 2, { seg: 10 }), seed + 60 + b, n, { w: 1.8, over: 0, two: false });
    }
    return s;
  }

  // ---- figures: rough animator mannequins in greatcoats + peaked caps; NO faces (construction cross only) ----
  const POSES = {
    capRest: { head: [0.1, 0.9], neck: [0.06, 0.8], hip: [0, 0.47], elA: [0.17, 0.62], haA: [0.27, 0.56], elB: [-0.04, 0.61], haB: [-0.02, 0.47], knA: [0.09, 0.24], ftA: [0.14, 0], knB: [-0.06, 0.24], ftB: [-0.13, 0] },
    capUp: { head: [0.08, 0.91], neck: [0.05, 0.81], hip: [0, 0.47], elA: [0.16, 0.74], haA: [0.2, 0.88], elB: [-0.04, 0.61], haB: [-0.02, 0.47], knA: [0.09, 0.24], ftA: [0.14, 0], knB: [-0.06, 0.24], ftB: [-0.13, 0] },
    capDown: { head: [0.13, 0.88], neck: [0.08, 0.79], hip: [0.01, 0.47], elA: [0.2, 0.62], haA: [0.32, 0.5], elB: [-0.03, 0.6], haB: [0.0, 0.47], knA: [0.1, 0.24], ftA: [0.15, 0], knB: [-0.06, 0.24], ftB: [-0.13, 0] },
    polRest: { head: [0, 0.93], neck: [0, 0.83], hip: [0, 0.49], elA: [-0.08, 0.63], haA: [-0.06, 0.52], elB: [-0.1, 0.64], haB: [-0.07, 0.53], knA: [0.03, 0.25], ftA: [0.06, 0], knB: [-0.03, 0.25], ftB: [-0.06, 0] },
    polNod: { head: [0.035, 0.895], neck: [0.015, 0.825], hip: [0, 0.49], elA: [0.08, 0.66], haA: [0.12, 0.76], elB: [-0.1, 0.64], haB: [-0.07, 0.53], knA: [0.03, 0.25], ftA: [0.06, 0], knB: [-0.03, 0.25], ftB: [-0.06, 0] },
    arkRest: { head: [0, 0.93], neck: [0, 0.83], hip: [-0.01, 0.49], elA: [0.04, 0.64], haA: [0.05, 0.49], elB: [-0.05, 0.64], haB: [-0.06, 0.49], knA: [0.05, 0.25], ftA: [0.08, 0], knB: [-0.04, 0.25], ftB: [-0.08, 0] },
    arkNo: { head: [-0.03, 0.935], neck: [-0.01, 0.835], hip: [0.0, 0.49], elA: [0.13, 0.73], haA: [0.21, 0.85], elB: [-0.05, 0.64], haB: [-0.06, 0.49], knA: [0.06, 0.25], ftA: [0.1, 0], knB: [-0.05, 0.25], ftB: [-0.1, 0] },
  };
  function pose(keys, q) { // keys: [[t, name], ...], stepped by drawings (q is already quantised)
    let a = POSES[keys[0][1]], b = a, p = 0;
    for (let i = 1; i < keys.length; i++) {
      const [t0, n0] = keys[i - 1], [t1, n1] = keys[i];
      if (q >= t1) { a = b = POSES[n1]; p = 0; continue; }
      if (q > t0) { a = POSES[n0]; b = POSES[n1]; p = easeIO((q - t0) / (t1 - t0)); }
      break;
    }
    const o = {}; for (const k in a) o[k] = [lerp(a[k][0], b[k][0], p), lerp(a[k][1], b[k][1], p)]; return o;
  }
  function tube(p, q, w, seed, n, o = {}) {
    const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w / 2, ny = dx / d * w / 2;
    return G([[p[0] + nx, p[1] + ny], [q[0] + nx * 0.85, q[1] + ny * 0.85]], seed, n, { w: 2.8, over: 3, ...o }) +
      G([[p[0] - nx, p[1] - ny], [q[0] - nx * 0.85, q[1] - ny * 0.85]], seed + 1, n, { w: 2.8, over: 3, ...o });
  }
  function figure(x0, base, H, J, face, n, seed, con, clean, { palm = false } = {}) {
    const S = ([x, y]) => [x0 + x * H * face, base - y * H];
    const j = {}; for (const k in J) j[k] = S(J[k]);
    const sp = [j.hip[0] - j.neck[0], j.hip[1] - j.neck[1]], sl = Math.hypot(...sp), u = [sp[0] / sl, sp[1] / sl], v = [-u[1], u[0]];
    const off = (p, k) => [p[0] + v[0] * k * H, p[1] + v[1] * k * H];
    const along = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
    const sh = along(j.neck, j.hip, 0.12);
    let s = '';
    if (con > 0) {
      // line of action first (head → hip → weight foot), then the masses
      s += B(partial([j.head, j.neck, along(j.neck, j.hip, 0.5), j.hip, j.knA, j.ftA], con), seed, n, { w: 2.6, op: 0.55 });
      s += B(partial(ell(j.head[0], j.head[1], H * 0.072, H * 0.08), con), seed + 1, n);
      const c1 = along(j.neck, j.hip, 0.32), c2 = along(j.neck, j.hip, 0.93), ang = Math.atan2(u[1], u[0]) - Math.PI / 2;
      s += B(partial(ell(c1[0], c1[1], H * 0.105, H * 0.15, { rot: ang }), con), seed + 2, n);
      s += B(partial(ell(c2[0], c2[1], H * 0.09, H * 0.06, { rot: ang }), con), seed + 3, n);
      for (const [a, b, c] of [[sh, j.elA, j.haA], [sh, j.elB, j.haB], [j.hip, j.knA, j.ftA], [j.hip, j.knB, j.ftB]]) s += B(partial([a, b, c], con), seed + 4 + a[0], n, { w: 1.8 });
    }
    if (clean > 0) {
      const k = clean;
      // head: outline + construction cross (no features), peaked cap
      const hx = j.head[0], hy = j.head[1], r = H * 0.068;
      s += G(partial(ell(hx, hy + r * 0.05, r * 0.92, r, { seg: 22 }), k), seed + 10, n, { w: 2.8, over: 0 });
      s += B([[hx - r * 0.2 * face, hy - r * 0.9], [hx + r * 0.25 * face, hy + r * 0.95]], seed + 11, n, { op: 0.4, over: 4 });
      s += B([[hx - r * 0.95, hy + r * 0.1], [hx + r * 0.95, hy + r * 0.18]], seed + 12, n, { op: 0.4, over: 4 });
      if (k > 0.3) {
        s += G([[hx - r * 1.05, hy - r * 0.35], [hx - r * 1.2, hy - r * 0.85], [hx + r * 0.9, hy - r * 1.05], [hx + r * 1.15, hy - r * 0.55], [hx + r * 0.9, hy - r * 0.35], [hx - r * 1.05, hy - r * 0.35]], seed + 13, n, { w: 3, smooth: false });
        s += G([[hx + r * 0.85 * face, hy - r * 0.38], [hx + r * 1.55 * face, hy - r * 0.2]], seed + 14, n, { w: 3.6 });
      }
      // greatcoat
      const hem = along(j.hip, [(j.knA[0] + j.knB[0]) / 2, (j.knA[1] + j.knB[1]) / 2], 0.75);
      const left = [off(j.neck, 0.05), off(sh, 0.12), off(along(j.neck, j.hip, 0.55), 0.105), off(j.hip, 0.11), off(hem, 0.13)];
      const right = [off(j.neck, -0.05), off(sh, -0.12), off(along(j.neck, j.hip, 0.55), -0.1), off(j.hip, -0.105), off(hem, -0.12)];
      s += G(partial(left, k), seed + 15, n, { w: 3.2 }) + G(partial(right, k), seed + 16, n, { w: 3.2 });
      if (k >= 1) {
        s += G([left[4], hem, right[4]], seed + 17, n, { w: 3 });
        s += G([off(j.neck, 0.0), along(j.neck, hem, 0.98)], seed + 18, n, { w: 1.6, op: 0.6, two: false }); // coat opening
        const id = `coat${seed}`;
        s += `<clipPath id="${id}"><path d="${pd([...left, ...right.slice().reverse()], 0, 0, { amp: 0, smooth: false })}"/></clipPath>`;
        s += `<g clip-path="url(#${id})">${hatch(j.hip[0] - H * 0.3, j.neck[1], j.hip[0] + H * 0.3, hem[1] + 10, 11, face > 0 ? -1.0 : 1.0, seed + 19, n, { op: 0.42, w: 1.5 })}</g>`;
      }
      // legs below the coat + boots
      for (const [kn, ft, i] of [[j.knA, j.ftA, 0], [j.knB, j.ftB, 1]]) {
        s += tube(along(hem, kn, 0.6), ft, H * 0.05, seed + 20 + i * 2, n);
        s += G([[ft[0] - H * 0.035 * face, ft[1]], [ft[0] + H * 0.07 * face, ft[1] + 1]], seed + 25 + i, n, { w: 6 });
      }
      // arms (sleeves) + hands
      for (const [el, ha, i, isA] of [[j.elB, j.haB, 1, false], [j.elA, j.haA, 0, true]]) {
        const s0 = off(sh, (isA ? -0.09 : 0.08) * face * (face > 0 ? 1 : 1));
        s += tube(s0, el, H * 0.06, seed + 30 + i * 4, n) + tube(el, ha, H * 0.05, seed + 32 + i * 4, n);
        if (isA && palm) {
          // open hand, palm out: a mitten with the thumb apart
          const [px, py] = ha;
          s += G([[px - 8, py + 14], [px - 10, py - 12], [px - 4, py - 26], [px + 6, py - 27], [px + 11, py - 12], [px + 10, py + 12]], seed + 40, n, { w: 3, smooth: true });
          s += G([[px + 9, py + 2], [px + 22 * face, py - 10]], seed + 41, n, { w: 3 });
        } else s += G(ell(ha[0], ha[1], H * 0.026, H * 0.028, { seg: 12 }), seed + 42 + i, n, { w: 2.6, over: 0 });
      }
    }
    return s;
  }

  // ---- Cuba inset (Natural Earth, public domain), projected into a box ----
  function mapInset(box, n, seed, fBox, fLand, fMark, q) {
    const [x0, y0, x1, y1] = box, lon0 = -86, lon1 = -66, lat0 = 17.5, lat1 = 29;
    const pr = ([lo, la]) => [x0 + ((lo - lon0) / (lon1 - lon0)) * (x1 - x0), y1 - ((la - lat0) / (lat1 - lat0)) * (y1 - y0)];
    let s = '';
    if (fBox > 0) s += G(partial([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0 - 6]], fBox), seed, n, { w: 2.4, smooth: false, over: 10 });
    if (fLand > 0 && geo) {
      const id = `mapc${seed}`;
      s += `<clipPath id="${id}"><rect x="${x0 + 3}" y="${y0 + 3}" width="${x1 - x0 - 6}" height="${y1 - y0 - 6}"/></clipPath><g clip-path="url(#${id})">`;
      let i = 0;
      for (const f of geo.features) {
        if (!['Cuba', 'United States of America', 'Bahamas', 'Haiti', 'Dominican Rep.', 'Jamaica', 'Mexico'].includes(f.name)) continue;
        for (const ring of f.rings) {
          const pts = ring.filter((_, k) => k % 2 === 0 || ring.length < 30).map(pr);
          if (pts.every(([x, y]) => x < x0 - 40 || x > x1 + 40 || y < y0 - 40 || y > y1 + 40)) continue;
          const big = f.name === 'Cuba' && ring.length > 100;
          s += G(partial(pts, fLand), seed + 3 + i++, n, { w: big ? 2.8 : 1.8, amp: 0.8, over: 0, two: big, op: big ? 0.95 : 0.7 });
          if (big && fLand >= 1) {
            const id2 = `cu${seed}`;
            s += `<clipPath id="${id2}"><path d="${pd(pts, 0, 0, { amp: 0, smooth: false })}"/></clipPath><g clip-path="url(#${id2})">${hatch(x0, y0, x1, y1, 6, -0.8, seed + 90, n, { op: 0.6, w: 1.4 })}</g>`;
          }
        }
      }
      s += '</g>';
      if (fLand >= 1) {
        const [cx, cy] = pr([-79.5, 21.1]);
        s += Lt('CUBA', cx - pk(40, 38), cy + pk(48, 46), pk(32, 30), seed + 70, n, { w: 700, ls: 2, name: 'Map: Cuba' });
        const [fx, fy] = pr([-81.3, 27.8]);
        s += Lt('Florida', fx + 14, fy + 4, pk(24, 24), seed + 71, n, { op: 0.7 });
      }
    }
    if (fMark > 0) {
      const [mx, my] = pr([-71.8, 24.6]);
      // dashed "somewhere here" ring: position is approximate in the sources
      const ring = ell(mx, my, pk(46, 48), pk(30, 32), { seg: 26 });
      for (let k = 0; k < 13; k++) if (k / 13 < fMark) s += G(ring.slice(k * 2, k * 2 + 2), seed + 80 + k, n, { w: 2.6, over: 0, two: false });
      if (fMark >= 1) s += Lt('B-59 · approx.', mx, my + pk(62, 66), pk(28, 28), seed + 79, n, { anchor: 'middle', w: 700, name: 'Map: B-59 approx.' });
    }
    return s;
  }

  /* ---------------- margins (same on every page of a section) ---------------- */
  const SC = ['sc.1 — the boat hides', 'sc.2 — charges', 'sc.3 — the vote'];
  function margins(sec, n, local, { ghost }) {
    let s = '';
    const [fx0, fy0, fx1, fy1] = field;
    // field guide (blue, light) + centre cross — an animator's frame
    s += B([[fx0, fy0], [fx1, fy0], [fx1, fy1], [fx0, fy1], [fx0, fy0 - 10]], 900 + sec, n, { op: 0.22, w: 1.8, smooth: false, over: 18 });
    const mx = (fx0 + fx1) / 2, my = (fy0 + fy1) / 2;
    s += B([[mx - 18, my], [mx + 18, my]], 905, n, { op: 0.25 }) + B([[mx, my - 18], [mx, my + 18]], 906, n, { op: 0.25 });
    if (ghost) return s;
    s += Lt('12 FLD', fx1 - pk(96, 130), fy0 + 32, 24, 907, n, { col: C.blue, op: 0.6, w: 700 });
    s += Lt(SC[sec], pk(74, 40), pk(70, 84), pk(36, 34), 910 + sec, n, { w: 700, name: 'Slug (scene)' });
    s += Lt('B-59 · 27.X.62', pk(560, 470), pk(70, 84), pk(28, 28), 914, n, { op: 0.6, name: 'Slug (job)' });
    // frame number, circled (the animator's drawing number)
    const [nx, ny] = pk([1442, 906], [880, 78]);
    s += G(ell(nx, ny - 9, 52, 30, { seg: 20, sweep: Math.PI * 2.2 }), 920 + (n % 7), n, { w: 2.2, over: 0 });
    s += Lt(`${'ABC'[sec]}${String(local).padStart(2, '0')}`, nx, ny, 34, 921, n, { anchor: 'middle', w: 700, name: 'Drawing number' });
    // timing chart: keys circled, inbetweens as ticks (closer at both ends = ease in/out)
    const [cx, cy0, cy1] = pk([1442, 190, 760], [64, 230, 980]);
    s += G([[cx, cy0], [cx, cy1]], 930 + sec, n, { w: 2, two: false });
    const ticks = 9;
    for (let i = 0; i < ticks; i++) {
      const f = 0.5 - 0.5 * Math.cos((i / (ticks - 1)) * Math.PI), y = lerp(cy0, cy1, f);
      const key = i === 0 || i === ticks - 1 || i === 4;
      s += G([[cx - (key ? 0 : 16), y], [cx + 16, y]], 940 + i, n, { w: 2, two: false, over: 2 });
      if (key) {
        s += G(ell(cx - 34 * (portrait ? -1 : 1), y - 8, 17, 17, { seg: 14 }), 950 + i, n, { w: 1.8, over: 0, two: false });
        s += Lt(String(1 + i * 4 + sec * 33), cx - 34 * (portrait ? -1 : 1), y, 22, 960 + i, n, { anchor: 'middle', w: 700 });
      }
    }
    s += Lt('on 3s', cx, cy1 + 46, 24, 970, n, { anchor: 'middle', op: 0.7 });
    return s;
  }

  /* ---------------- the three sections ---------------- */
  function secA(n, q) {
    const [x0] = field; let s = '';
    const [dx, dy, dsz] = pk([130, 230, 96], [160, 258, 86]);
    s += Lt('Oct. 27, 1962', dx, dy, dsz, 1, n, { w: 700, count: (q - T.oct + 0.05) * 22, name: 'Date (lettered)' });
    const ul = prog(q, T.y62 + 0.55, T.y62 + 0.85);
    if (ul > 0) s += G(partial([[dx - 10, dy + 26], [dx + pk(300, 260), dy + 30], [dx + pk(590, 530), dy + 24]], ul), 2, n, { w: 3.4, over: 10 });
    const wl = pk(430, 610);
    s += sea(n, wl, prog(q, 1.0, 1.6), prog(q, T.deep, T.deep + 0.45), prog(q, T.sea, T.sea + 0.4), 10, q);
    // the boat: blue construction on "Soviet", graphite on "submarine", then it sinks (hides deep)
    const con = prog(q, T.y62 + 0.3, T.y62 + 0.9), cl = prog(q, T.soviet - 0.05, T.submarine + 0.3); // blocked in blue on the date, inked on "Soviet submarine"
    const m = easeIO(prog(q, T.hides - 0.1, T.sea + 0.4));
    const [sx0, sy0, sx1, sy1, L] = pk([1080, 560, 760, 750, 480], [700, 760, 540, 1010, 440]);
    const cx = lerp(sx0, sx1, m), cy = lerp(sy0, sy1, m), tilt = 0.06 * Math.sin(Math.PI * m);
    s += sub(cx, cy, L, n, 30, con, cl, tilt);
    // bubbles from the boat as it dives
    for (let b = 0; b < 6; b++) {
      const age = q - (T.hides + b * 0.22); if (age < 0 || age > 1.6) continue;
      s += G(ell(cx + L * (0.3 - b * 0.02) + Math.sin(age * 6 + b) * 5, cy - L * 0.06 - age * 110, 4 + (b % 3) * 2, 4 + (b % 3) * 2, { seg: 10 }), 60 + b, n, { w: 1.8, over: 0, two: false });
    }
    // where: inset map, top right
    const box = pk([905, 140, 1305, 385], [520, 310, 945, 560]);
    s += mapInset(box, n, 100, prog(q, T.near - 0.25, T.near + 0.05), prog(q, T.near, T.cuba + 0.3), prog(q, T.cuba + 0.3, T.cuba + 0.6), q);
    return s;
  }

  function secB(n, q) {
    let s = '';
    const wl = pk(300, 450);
    s += sea(n, wl, 1, 1, 1, 210, q);
    const [s1x, s2x, SL] = pk([470, 980, 360], [310, 720, 350]);
    const drift = -16 * Math.max(0, q - T.r1);
    const sh1 = s1x + drift, sh2 = s2x + drift * 0.8;
    s += ship(sh1, wl, SL, n, 220, prog(q, T.above - 0.05, T.above + 0.3), prog(q, T.american - 0.05, T.american + 0.35));
    s += ship(sh2, wl, SL, n, 260, prog(q, T.american, T.american + 0.3), prog(q, T.ships - 0.05, T.ships + 0.35));
    // the boat holds deep and shakes on each burst
    const [bx, by, L] = pk([760, 770, 470], [540, 1040, 420]);
    let jx = 0, jy = 0;
    for (const tb of T.bursts) { const a = q - tb; if (a >= 0 && a < 0.5) { const k = Math.round(a * DPS); jx += (k % 2 ? -1 : 1) * 9 * (1 - a / 0.5); jy += (k % 2 ? 1 : -1) * 4 * (1 - a / 0.5); } }
    s += sub(bx + jx, by + jy, L, n, 230, 0, 1, -0.02 + jy * 0.004);
    // depth charges: roll off the sterns, tumble down with speed lines, burst near the boat
    const drops = [[sh1, T.drop, 0], [sh2, T.drop + 0.2, 1], [sh1, T.drop + 0.55, 2]];
    const targets = pk([[585, 600], [960, 680], [740, 520]], [[370, 860], [710, 950], [560, 790]]);
    drops.forEach(([shx, t0, i]) => {
      const tb = T.bursts[i], a = prog(q, t0, tb);
      if (q < t0 || q >= tb) return;
      const relX = (i === 1 ? sh2 : sh1) - drift * 0 + SL * 0.45;
      const x = lerp(relX, targets[i][0], easeIO(a)), y = lerp(wl - 4, targets[i][1], a * a * 0.6 + a * 0.4);
      const rot = a * 6 + i;
      const box = ell(0, 0, 1, 1, { seg: 4, start: Math.PI / 4, sweep: Math.PI * 2 }).map(([px, py]) => [px * 11, py * 15]);
      s += G(xf(box, x, y, 1, rot), 300 + i, n, { w: 2.6, smooth: false, over: 0 });
      if (a > 0.1) for (let k = -1; k <= 1; k++) s += G([[x + k * 8, y - 26], [x + k * 8 + 2, y - 26 - 60 * Math.min(1, a * 2)]], 310 + i * 3 + k, n, { w: 1.6, over: 0, two: false, op: 0.6 });
    });
    T.bursts.forEach((tb, i) => { s += burst(targets[i][0], targets[i][1], q - tb, n, 400 + i * 20); });
    // Moscow: a dotted radio line up from the mast that never gets an answer
    const mast = [bx - L * 0.09, by - L * 0.2];
    const [lx, ly, lsz] = pk([110, 200, 64], [160, 250, 58]);
    const fl = prog(q, T.moscow - 0.05, T.moscow + 0.4);
    if (fl > 0) {
      const line = partial([mast, [lerp(mast[0], lx + 120, 0.5) - pk(260, 200), lerp(mast[1], ly + 30, 0.45)], [lx + 60, ly + 44]], fl);
      for (let k = 0; k < 28; k++) { const seg = partial(line, (k + 0.45) / 28).slice(-1)[0]; const seg0 = partial(line, k / 28).slice(-1)[0]; if (seg && seg0 && k / 28 < 1) s += G([seg0, seg], 500 + k, n, { w: 2.4, over: 0, two: false }); }
    }
    s += Lt('Moscow?', lx, ly, lsz, 520, n, { w: 700, count: (q - T.moscow) * 25, name: 'Moscow?' });
    if (q > T.silent) {
      // two hard strokes break the line: no answer
      const mid = [lerp(mast[0], lx + 60, 0.5) - pk(250, 190), lerp(mast[1], ly + 44, 0.47)];
      s += G([[mid[0] - 22, mid[1] - 22], [mid[0] + 22, mid[1] + 22]], 530, n, { w: 3.4 }) + G([[mid[0] + 22, mid[1] - 22], [mid[0] - 22, mid[1] + 22]], 531, n, { w: 3.4 });
      s += Lt('no answer', lx + pk(250, 230), ly, pk(40, 38), 532, n, { count: (q - T.silent) * 22, op: 0.85 });
    }
    // days: a tally
    const tl = Math.floor((q - T.days + 0.1) * DPS);
    if (tl > 0) {
      const [tx, ty] = pk([120, 262], [170, 316]);
      for (let k = 0; k < Math.min(4, tl); k++) s += G([[tx + k * 18, ty], [tx + k * 18 + 3, ty + 50]], 540 + k, n, { w: 3, over: 3 });
      if (tl > 4) s += G([[tx - 8, ty + 38], [tx + 70, ty + 10]], 545, n, { w: 3, over: 4 });
      if (tl > 5) s += Lt('days', tx + 96, ty + 40, pk(40, 38), 546, n, { count: (tl - 5) * 2 });
    }
    return s;
  }

  function secC(n, q) {
    let s = '';
    // "On board": the inside of the hull, blocked in blue (ribs + deckhead), the deck in graphite
    {
      const [fx0, fy0, fx1] = field, deck = pk(906, 996), fi = prog(q, T.onboard - 0.1, T.onboard + 0.5);
      if (fi > 0) {
        const ribs = pk([250, 520, 790, 1060], [300, 560, 820]);
        ribs.forEach((x, i) => { s += B(partial([[x - 30, deck], [x - 12, lerp(deck, fy0, 0.55)], [x + 20, fy0 + 30]], fi), 560 + i, n, { op: 0.2, w: 2 }); });
        s += B(partial([[fx0 + 10, fy0 + 70], [lerp(fx0, fx1, 0.5), fy0 + 18], [fx1 - 10, fy0 + 70]], fi), 566, n, { op: 0.3 });
        s += G(partial([[fx0 + 6, deck + 2], [fx1 - 6, deck - 2]], fi), 567, n, { w: 3 });
        if (fi >= 1) {
          s += `<clipPath id="deck"><rect x="${fx0}" y="${deck + 4}" width="${fx1 - fx0}" height="${pk(30, 34)}"/></clipPath><g clip-path="url(#deck)">${hatch(fx0, deck, fx1, deck + 40, 9, 0.9, 568, n, { op: 0.45, w: 1.4 })}</g>`;
          const tag = pk([fx0 + 20, fy0 + 104], [fx0 + 20, fy0 + 0]);
          if (!portrait) s += Lt('on board B-59 (cutaway, not to scale)', fx0 + 90, fy0 + 40, 26, 569, n, { op: 0.6, col: C.blue, name: 'Note: cutaway' });
        }
      }
    }
    // the torpedo: cylinder construction on "On board", graphite on "nuclear"
    const [t0x, t1x, ty, tr] = pk([150, 880, 215, 34], [200, 790, 200, 28]);
    const con = prog(q, T.onboard, T.onboard + 0.5), cl = prog(q, T.nuclear - 0.05, T.nuclear + 0.4);
    if (con > 0) {
      s += B(partial([[t0x - 20, ty], [t1x + 40, ty]], con), 600, n);
      s += B(partial(ell(t0x, ty, tr * 0.35, tr), con), 601, n) + B(partial(ell(t1x - tr, ty, tr * 0.35, tr), con), 602, n);
      s += B(partial([[t0x, ty - tr], [t1x - tr, ty - tr]], con), 603, n) + B(partial([[t0x, ty + tr], [t1x - tr, ty + tr]], con), 604, n);
    }
    if (cl > 0) {
      const body = [[t0x + 4, ty - tr], [t1x - tr * 1.2, ty - tr], [t1x - tr * 0.3, ty - tr * 0.75], [t1x + tr * 0.25, ty - tr * 0.3], [t1x + tr * 0.35, ty], [t1x + tr * 0.25, ty + tr * 0.3], [t1x - tr * 0.3, ty + tr * 0.75], [t1x - tr * 1.2, ty + tr], [t0x + 4, ty + tr], [t0x - 4, ty + tr * 0.5], [t0x - 6, ty - tr * 0.5], [t0x + 4, ty - tr]];
      s += G(partial(body, cl), 610, n, { w: 3.4, over: 2 });
      if (cl >= 1) {
        s += G([[t0x, ty - tr], [t0x - 34, ty - tr * 1.6], [t0x - 40, ty - tr * 1.6], [t0x - 18, ty]], 611, n, { w: 2.6, smooth: false });
        s += G([[t0x, ty + tr], [t0x - 34, ty + tr * 1.6], [t0x - 40, ty + tr * 1.6], [t0x - 18, ty]], 612, n, { w: 2.6, smooth: false });
        for (const f of [0.22, 0.55]) s += G([[lerp(t0x, t1x, f), ty - tr + 2], [lerp(t0x, t1x, f) + 2, ty + tr - 2]], 613 + f * 10, n, { w: 1.8, op: 0.7, two: false });
        const id = 'torp';
        s += `<clipPath id="${id}"><path d="${pd(body, 0, 0, { amp: 0, smooth: false })}"/></clipPath><g clip-path="url(#${id})">${hatch(t0x, ty, t1x + tr, ty + tr, 8, -0.9, 620, n, { op: 0.6, w: 1.6 })}</g>`;
      }
    }
    const [lx, ly, lsz, anc] = pk([920, 236, 50, 'start'], [150, 300, 50, 'start']);
    s += Lt('nuclear torpedo', lx, ly, lsz, 630, n, { w: 700, count: (q - T.torpedo) * 26, anchor: anc, name: 'Label: nuclear torpedo' });
    if (!portrait && q > T.torpedo + 0.3) s += G(partial([[lx - 8, ly - 14], [t1x + tr + 10, ty]], prog(q, T.torpedo + 0.3, T.torpedo + 0.5)), 631, n, { w: 2.4, over: 4 });
    // three officers: line of action first ("three"), then the coats ("officers")
    const [base, H] = pk([900, 445], [990, 380]);
    const xs = pk([290, 600, 1000], [240, 470, 760]);
    const con3 = i => prog(q, T.nuclear + 0.2 + i * 0.15, T.nuclear + 0.5 + i * 0.15), cl3 = i => prog(q, T.officers + i * 0.15 - 0.05, T.officers + i * 0.15 + 0.4);
    const capK = [[0, 'capRest'], [T.two - 0.1, 'capRest'], [T.two + 0.1, 'capUp'], [T.two + 0.3, 'capDown']];
    const polK = [[0, 'polRest'], [T.yes - 0.3, 'polRest'], [T.yes - 0.05, 'polNod'], [T.yes + 0.25, 'polRest'], [T.yes + 0.45, 'polNod']];
    const arkK = [[0, 'arkRest'], [T.says - 0.15, 'arkRest'], [T.no - 0.02, 'arkNo']];
    s += figure(xs[0], base, H * 1.02, pose(capK, q), 1, n, 700, con3(0), cl3(0));
    s += figure(xs[1], base, H * 0.97, pose(polK, q), 1, n, 760, con3(1), cl3(1));
    s += figure(xs[2], base, H, pose(arkK, q), -1, n, 820, con3(2), cl3(2), { palm: q >= T.says });
    if (!portrait && q > T.officers + 0.5) {
      const roles = ['commander', 'political officer', 'chief of staff'];
      roles.forEach((r, i) => { s += Lt(r, xs[i], base + 44, 30, 840 + i, n, { anchor: 'middle', op: 0.8, count: (q - T.officers - 0.5 - i * 0.15) * 30, name: `Role ${i + 1}` }); });
    }
    const [ax, ay, asz, aanc] = pk([600, 352, 44, 'middle'], [150, 372, 40, 'start']);
    s += Lt('all three must agree', ax, ay, asz, 850, n, { anchor: aanc, count: (q - T.agree + 0.1) * 30, name: 'Note: all three must agree' });
    // YES ×2 (graphite, quick)
    const yesAt = [T.two + 0.25, T.yes];
    const yPos = pk([[xs[0] + 60, 452], [xs[1] + 30, 452]], [[xs[0] + 10, 596], [xs[1] + 10, 596]]);
    yesAt.forEach((ty0, i) => {
      if (q < ty0) return;
      s += Lt('yes', yPos[i][0], yPos[i][1], pk(64, 54), 860 + i, n, { w: 700, anchor: 'middle', count: (q - ty0) * 30 + 1, name: `Yes ${i + 1}` });
      const c = prog(q, ty0 + 0.1, ty0 + 0.3);
      const [cx, cy] = [yPos[i][0] + pk(70, 60), yPos[i][1] - 20];
      if (c > 0) s += G(partial([[cx - 14, cy - 2], [cx - 2, cy + 14], [cx + 24, cy - 26]], c), 870 + i, n, { w: 3.6, smooth: false });
    });
    // the name, lettered on "Vasili Arkhipov"
    const [nx, ny, nsz, nanc] = pk([1000, 446, 48, 'middle'], [890, 1052, 52, 'end']);
    s += Lt('Vasili Arkhipov', nx, ny, nsz, 880, n, { w: 700, anchor: nanc, count: (q - T.vasili + 0.05) * 22, name: 'Name: Vasili Arkhipov' });
    // NO — red pencil, pressed hard, lands on the held drawing
    if (q >= T.nHold / DPS - 1e-6) {
      const [ox, oy, osz] = pk([1088, 702, 196], [640, 512, 176]);
      s += Lt('NO', ox, oy, osz, 890, n, { w: 700, col: C.red, op: 0.96, name: 'NO (red pencil)', ls: 4 });
    }
    return s;
  }

  const cache = new Map();
  /** SVG markup for drawing n. opts.ghost = lines only (seen through the paper), no lettering. */
  function art(n, { ghost = false } = {}) {
    const key = n + (ghost ? 'g' : '');
    if (cache.has(key)) return cache.get(key);
    const q = n / DPS, sec = sectionOf(T, n);
    const local = n - (sec === 0 ? 0 : sec === 1 ? T.nR1 : T.nR2);
    let s = margins(sec, n, local, { ghost });
    s += sec === 0 ? secA(n, q) : sec === 1 ? secB(n, q) : secC(n, Math.min(q, T.no + 0.5));
    if (ghost) s = s.replace(/<text[\s\S]*?<\/text>/g, '');
    if (cache.size > 400) cache.clear();
    cache.set(key, s);
    return s;
  }

  /** Real-time pencil notes on the HELD page (smooth, 30 fps — a hand, not the book). */
  function live(tg) {
    if (tg < T.no + 0.25) return '';
    let s = '';
    const n = T.nHold; // no boil: the page is held
    const [ox, oy, ow] = pk([1088, 702, 232], [640, 512, 210]);
    const u1 = prog(tg, T.no + 0.3, T.no + 0.55), u2 = prog(tg, T.no + 0.6, T.no + 0.8);
    if (u1 > 0) s += R(partial([[ox - 6, oy + 24], [ox + ow * 0.5, oy + 30], [ox + ow + 6, oy + 22]], u1), 1001, n, { w: 6 });
    if (u2 > 0) s += R(partial([[ox + 4, oy + 44], [ox + ow * 0.55, oy + 49], [ox + ow - 6, oy + 41]], u2), 1002, n, { w: 5 });
    // timing chart: the hold bracket
    const [cx, cy0, cy1] = pk([1442, 190, 760], [64, 230, 980]);
    const hb = prog(tg, T.world - 0.1, T.world + 0.35);
    if (hb > 0) {
      const sx = 1, bx = cx + (portrait ? 80 : 46);
      s += G(partial([[bx - sx * 12, cy0 + 120], [bx, cy0 + 130], [bx, cy1 - 40], [bx - sx * 12, cy1 - 30]], hb), 1010, n, { w: 2.6, smooth: false, over: 2, two: false });
      if (hb >= 1) s += Lt('HOLD', bx + sx * 4, (cy0 + cy1) / 2, 30, 1011, n, { w: 700, anchor: 'middle', rot: -90, name: 'Chart: HOLD' });
    }
    // 40 years later
    const [yx, yy, ysz] = pk([1062, 832, 56], [440, 1118, 52]);
    s += Lt('1962', yx, yy, ysz, 1020, n, { w: 700, count: (tg - T.forty + 0.05) * 14, name: 'Note: 1962' });
    const ar = prog(tg, T.forty + 0.3, T.forty + 0.5), ax0 = yx + ysz * 2.25, ax1 = ax0 + ysz * 1.0, ay = yy - ysz * 0.32;
    if (ar > 0) s += G(partial([[ax0, ay], [ax1, ay - 2], [ax1 - 16, ay - 12], [ax1, ay - 2], [ax1 - 15, ay + 10]], ar), 1022, n, { w: 3.2, smooth: false, over: 2 });
    s += Lt('2002', ax1 + 14, yy, ysz, 1023, n, { w: 700, count: (tg - T.forty - 0.45) * 14, name: 'Note: 2002' });
    const yanc = 'start';
    s += Lt('(40 years on)', yx + (portrait ? 0 : 4), yy + pk(48, 44), pk(36, 34), 1021, n, { anchor: yanc, op: 0.8, count: (tg - T.later) * 18, name: 'Note: 40 years on' });
    return s;
  }
  return { art, live, P, field };
}
