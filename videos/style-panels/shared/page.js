// Ink Panels — ONE graphic-novel page for the whole beat. Every scene module builds the same page and renders it at
// global time (ctx.start + t), so the camera travels panel to panel across one continuous page; only the owning scene
// registers its sounds. Truth codes: map = EV-derived (Natural Earth), B-59 position = RC "approx.", all drawings = RC
// (our own brush style, no faces), balloons / "WHUMM" / empty balloon = VO (comic language, clearly symbolic).
import { svg, rand, clamp, lerp, noise1 } from '/onclack-styles/engine/lib/anim.js';
import {
  PAL, F, FONT, W, ez, tw, snap, vnoise, rough, dPath, ellipsePts, cubicPts, brush, letter, caption, ruledBox, balloon,
  officerBack, subShape, shipShape,
} from './ink.js';

let MAP = null;

export async function buildPage(root, ctx, sceneNo) {
  const L = ctx.layout, P = L.portrait, FW = L.width, FH = L.height, uid = `pn${sceneNo}`;
  await Promise.all([document.fonts.load("500 48px 'Shantell Sans'"), document.fonts.load("800 48px 'Bricolage Grotesque'")]);
  if (!MAP) MAP = await fetch(ctx.asset('assets/caribbean.json')).then(r => r.json());

  // ---------- voice times (global seconds) ----------
  const T = {
    oct: W(ctx, 'October', 0, 0.58), soviet: W(ctx, 'Soviet', 0, 3.79), sub: W(ctx, 'submarine', 0, 4.3), deep: W(ctx, 'deep', 0, 5.42), cuba: W(ctx, 'Cuba', 0, 6.52),
    above: W(ctx, 'Above', 0, 7.56), ships: W(ctx, 'ships', 0, 8.63), drop: W(ctx, 'drop', 0, 8.95), practice: W(ctx, 'practice', 0, 9.28), depth: W(ctx, 'depth', 0, 9.79),
    charges: W(ctx, 'charges', 0, 10.05), moscow: W(ctx, 'Moscow', 0, 10.95), silent: W(ctx, 'silent', 0, 11.93),
    on: W(ctx, 'On', 0, 13.67), nuclear: W(ctx, 'nuclear', 0, 14.48), torpedo: W(ctx, 'torpedo', 0, 14.88), fire: W(ctx, 'fire', 0, 15.9), three: W(ctx, 'three', 0, 16.51),
    two: W(ctx, 'Two', 0, 18.29), yes: W(ctx, 'yes', 0, 18.8),
    third: W(ctx, 'third', 0, 20.25), vasili: W(ctx, 'Vasili', 0, 20.61), ark: W(ctx, 'Arkhipov', 0, 21.12), no: W(ctx, 'no', 0, 22.03),
    world: W(ctx, 'world', 0, 23.07), forty: W(ctx, 'forty', 0, 24.13), later: W(ctx, 'later', 0, 24.73),
  };
  const E = [T.depth - F, T.depth + 0.52, T.charges + 0.48]; // three bursts (the third is small and far)

  // ---------- page layout (world px; the camera frames it) ----------
  const G = 34;
  const R = P ? {
    p1a: [0, 0, 1000, 860], p1b: [0, 894, 1000, 1080], p2a: [0, 2008, 1000, 960], p2b: [0, 3002, 1000, 800], p3a: [0, 3836, 1000, 420], vote: [0, 4290, 1000, 1200],
    g1: [352, 316], g2: [676, 650],
  } : {
    p1a: [0, 0, 1150, 980], p1b: [1184, 0, 652, 980], p2a: [0, 1014, 1130, 900], p2b: [1164, 1014, 672, 900], p3a: [0, 1948, 1836, 400], vote: [0, 2382, 1836, 900],
    g1: [650, 588], g2: [1240, 1204],
  };
  const rectPoly = ([x, y, w, h]) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const [vx, vy, vw, vh] = R.vote, vy1 = vy + vh, vx1 = vx + vw;
  const VP = [
    [[vx, vy], [R.g1[0] - G / 2, vy], [R.g1[1] - G / 2, vy1], [vx, vy1]],
    [[R.g1[0] + G / 2, vy], [R.g2[0] - G / 2, vy], [R.g2[1] - G / 2, vy1], [R.g1[1] + G / 2, vy1]],
    [[R.g2[0] + G / 2, vy], [vx1, vy], [vx1, vy1], [R.g2[1] + G / 2, vy1]],
  ];
  const TXT = P ? 54 : 50; // caption lettering size (world px)

  // ---------- svg scaffold ----------
  Object.assign(root.style, { position: 'absolute', inset: '0', overflow: 'hidden', background: PAL.paper });
  const S = svg('svg', { width: FW, height: FH, viewBox: `0 0 ${FW} ${FH}`, style: 'position:absolute;left:0;top:0;display:block', 'data-name': 'Page' }, root);
  const style = svg('style', {}, S);
  style.textContent = `.${uid}-pencil *{fill:none!important;stroke:${PAL.pencil}!important;stroke-width:1.7px!important}
.${uid}-pencil text{fill:${PAL.pencil}!important;stroke:none!important}`;
  const defs = svg('defs', {}, S);
  // paper: fixed fibre/tooth texture (moves with the page, never boils)
  {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), im = g.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) {
      const v = rand(i * 0.731 + 3.1), fib = rand(Math.floor(i / 256) * 0.37 + (i % 256 > 128 ? 7 : 0));
      im.data[i * 4] = 120; im.data[i * 4 + 1] = 110; im.data[i * 4 + 2] = 95;
      im.data[i * 4 + 3] = v > 0.985 ? 30 : v < 0.5 ? 0 : Math.round((v - 0.5) * 18 + (fib > 0.97 ? 6 : 0));
    }
    g.putImageData(im, 0, 0);
    const pat = svg('pattern', { id: `${uid}-paper`, width: 256, height: 256, patternUnits: 'userSpaceOnUse' }, defs);
    svg('image', { href: c.toDataURL(), width: 256, height: 256 }, pat);
  }
  const world = svg('g', { 'data-name': 'World (camera)' }, S);
  svg('rect', { x: -6000, y: -6000, width: 16000, height: 20000, fill: PAL.paper }, world);
  svg('rect', { x: -6000, y: -6000, width: 16000, height: 20000, fill: `url(#${uid}-paper)` }, world);
  const pencilL = svg('g', { class: `${uid}-pencil`, 'data-name': 'Pencils (under the inks)' }, world);
  const panelL = svg('g', { 'data-name': 'Panels' }, world);
  const screenL = svg('g', { 'data-name': 'Screen layer' }, S);

  // ---------- panel factory ----------
  const panels = {};
  function panel(id, name, poly, { fill = PAL.paper, enter = 'snap', tIn, from = [0, 0], inkT, inkDur = 0.45, dir = [1, 0.3], seed = 1, build }) {
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
    const g = svg('g', { 'data-name': name, style: 'display:none' }, panelL);
    const cp = svg('clipPath', { id: `${uid}-c-${id}` }, defs); svg('path', { d: dPath(poly) }, cp);
    const sp = svg('clipPath', { id: `${uid}-s-${id}` }, defs); const sweep = svg('path', { d: '' }, sp);
    const art = svg('g', { 'clip-path': `url(#${uid}-c-${id})` }, g);
    const inked = svg('g', { 'clip-path': `url(#${uid}-s-${id})` }, art);
    svg('path', { d: dPath(poly), fill }, inked);
    const content = svg('g', {}, inked);
    const dyn = svg('g', {}, inked);
    const border = svg('path', { fill: PAL.ink, 'data-name': `${name} border` }, g);
    const over = svg('g', {}, g); // lettering allowed to break the border
    // border edges (centre lines with an inker's corner overshoot)
    const BW = P ? 7 : 7.5;
    const edges = poly.map((a, i) => {
      const b = poly[(i + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
      const o0 = rand(seed * 3.3 + i) * 7 + 1, o1 = rand(seed * 5.9 + i) * 7 + 1;
      return [[a[0] - ux * o0, a[1] - uy * o0], [b[0] + ux * o1, b[1] + uy * o1]];
    });
    const edgeD = p => edges.map((e, i) => brush(e, { w: BW, p, seed: seed + i, tin: 0.015, tout: 0.02, min: 0.7, wob: 0.1, step: 16 })).join('');
    const fullBorder = edgeD(1);
    const api = build({ g: content, dyn, over, x, y, w, h, poly }) ?? {};
    // pencils: the same drawing, light teal, a few px off — the page was pencilled before it was inked
    const pc = content.cloneNode(true);
    pc.querySelectorAll('[data-name]').forEach(n => n.removeAttribute('data-name'));
    pc.querySelectorAll('text').forEach(n => n.remove()); // pencils carry drawing only; lettering is inked straight
    const pgc = svg('g', { 'clip-path': `url(#${uid}-c-${id})` }, pencilL);
    const pg = svg('g', { transform: `translate(${((rand(seed * 9.1) - 0.5) * 8).toFixed(1)} ${((rand(seed * 4.7) - 0.5) * 8).toFixed(1)})` }, pgc);
    svg('path', { d: dPath(poly.map(([px, py], i) => [px + (rand(seed + i) - 0.5) * 10, py + (rand(seed * 2 + i) - 0.5) * 10])), fill: 'none' }, pg);
    edges.forEach(([a, b]) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); svg('path', { d: `M${a[0] - dx / l * 30} ${a[1] - dy / l * 30}L${b[0] + dx / l * 30} ${b[1] + dy / l * 30}` }, pg); });
    pg.appendChild(pc);
    // sweep geometry
    const dl = Math.hypot(dir[0], dir[1]), dx = dir[0] / dl, dy = dir[1] / dl, px = -dy, py = dx;
    const cx = x + w / 2, cy = y + h / 2, Hh = (w * Math.abs(dx) + h * Math.abs(dy)) / 2 + 60, Wp = (w * Math.abs(dy) + h * Math.abs(dx)) / 2 + 80, rag = 46;
    const sweepD = q => {
      const f = lerp(-Hh - rag, Hh + rag, q), pts = [], N = 28;
      for (let k = 0; k <= N; k++) {
        const u = -Wp + 2 * Wp * k / N, a = f + vnoise(k * 0.6, seed) * rag * 0.7 + vnoise(k * 2.1, seed + 5) * rag * 0.3;
        pts.push([cx + dx * a + px * u, cy + dy * a + py * u]);
      }
      pts.push([cx - dx * (Hh + 300) + px * Wp, cy - dy * (Hh + 300) + py * Wp], [cx - dx * (Hh + 300) - px * Wp, cy - dy * (Hh + 300) - py * Wp]);
      return dPath(pts);
    };
    const self = {
      x, y, w, h, poly, g, api, tIn, inkT,
      update(t, c) {
        // cull panels that are off camera (cheaper frames; the lint only sees what is on screen)
        let ox = 0, oy = 0;
        if (enter !== 'snap' && t >= tIn) { const s = 1 - snap(t, tIn, { stiffness: 300, damping: 30 }); ox = from[0] * s; oy = from[1] * s; }
        const [sx0, sy0] = toScreen(c, [x + ox, y + oy]), [sx1, sy1] = toScreen(c, [x + w + ox, y + h + oy]);
        const off = sx1 < -20 || sx0 > FW + 20 || sy1 < -20 || sy0 > FH + 20;
        pgc.style.display = off ? 'none' : '';
        if (t < tIn || off) { g.style.display = 'none'; return; }
        g.style.display = '';
        if (enter === 'snap') {
          const p = clamp((t - tIn) / (6 * F));
          border.setAttribute('d', p >= 1 ? fullBorder : edges.map((e, i) => brush(e, { w: BW, p: ez.enter(clamp((t - tIn - i * F) / (3 * F))), seed: seed + i, tin: 0.015, tout: 0.02, min: 0.7, wob: 0.1, step: 16 })).join(''));
          g.removeAttribute('transform');
        } else {
          border.setAttribute('d', fullBorder);
          const s = 1 - snap(t, tIn, { stiffness: 300, damping: 30 });
          g.setAttribute('transform', `translate(${(from[0] * s).toFixed(2)} ${(from[1] * s).toFixed(2)})`);
        }
        const q = (t - inkT) / inkDur;
        if (q <= 0) { inked.style.display = 'none'; }
        else {
          inked.style.display = '';
          if (q >= 1) inked.removeAttribute('clip-path');
          else { inked.setAttribute('clip-path', `url(#${uid}-s-${id})`); sweep.setAttribute('d', sweepD(ez.move(q))); }
        }
        api.update?.(t);
      },
    };
    panels[id] = self;
    return self;
  }

  // ======================= 1A · MAP + DATE =======================
  panel('p1a', '1A Map panel', rectPoly(R.p1a), {
    tIn: 0.22, inkT: 0.42, inkDur: 0.55, dir: [1, 0.35], seed: 11,
    build: ({ g, dyn, over, x, y, w, h }) => {
      const lon0 = -86.4, lon1 = -68.0, lat0 = 18.2, lat1 = 28.8, kc = Math.cos(23.5 * Math.PI / 180);
      const k = Math.min(w * 1.0 / ((lon1 - lon0) * kc), h * 0.84 / (lat1 - lat0));
      const ox = x + (w - (lon1 - lon0) * kc * k) / 2, oy = y + h - (lat1 - lat0) * k - h * 0.03;
      const pr = (lo, la) => [ox + (lo - lon0) * kc * k, oy + (lat1 - la) * k];
      const land = [];
      let s = 1;
      for (const f of MAP.features) for (const ring of f.rings) {
        const pts = ring.map(([lo, la]) => pr(lo, la));
        let A = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; A += a[0] * b[1] - b[0] * a[1]; }
        if (Math.abs(A) / 2 < 40) continue;
        if (pts.every(([px]) => px < x - 50) || pts.every(([px]) => px > x + w + 50) || pts.every(([, py]) => py < y - 50) || pts.every(([, py]) => py > y + h + 50)) continue;
        land.push(pts);
        svg('path', { d: dPath(rough(pts, { step: 5, amp: 1.1, seed: s++ })), fill: PAL.ink, ...(f.name === 'Cuba' ? { 'data-name': '1A Cuba' } : {}) }, g);
      }
      const inside = (X, Y) => land.some(r => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > Y) !== (yj > Y) && X < (xj - xi) * (Y - yi) / (yj - yi) + xi) c = !c; } return c; });
      // sea: little stacked teal brush dashes (comic water shorthand), never on land
      let n = 0;
      for (let i = 0; i < 400 && n < 44; i++) {
        const X = x + 40 + rand(i * 3.17) * (w - 80), Y = y + h * 0.2 + rand(i * 5.73) * (h * 0.76), l = 34 + rand(i * 1.9) * 46;
        if (X < x + w * 0.42 && Y < y + h * 0.26) continue; // date caption
        if (inside(X, Y) || inside(X + l, Y) || inside(X, Y + 22) || inside(X + l, Y + 22) || inside(X - 20, Y)) continue;
        n++;
        svg('path', { d: brush([[X, Y], [X + l * 0.5, Y - 2], [X + l, Y]], { w: 5, seed: i }), fill: PAL.teal }, g);
        if (rand(i * 7.7) > 0.4) svg('path', { d: brush([[X + 12, Y + 14], [X + 12 + l * 0.6, Y + 13]], { w: 4.5, seed: i + 99 }), fill: PAL.teal }, g);
      }
      const [cuX, cuY] = pr(-79.2, 20.55);
      letter(g, 'CUBA', { x: cuX, y: cuY + 24, size: P ? 46 : 44, anchor: 'middle', seed: 4, spacing: 0.14, name: '1A Label Cuba' });
      const [usX, usY] = pr(-81.45, 28.05);
      letter(g, 'U.S.', { x: usX, y: usY, size: P ? 34 : 32, anchor: 'middle', seed: 6, fill: PAL.paper, spacing: 0.1, name: '1A Label U.S.' });
      letter(g, 'COASTS: NATURAL EARTH', { x: P ? x + 24 : x + w - 24, y: P ? y + h - 20 : y + 44, size: 20, anchor: P ? 'start' : 'end', seed: 2, spacing: 0.08, fill: PAL.ink, jitter: 0.3, name: '1A Source' });
      // B-59 marker (position approximate) — lands on "Cuba", during the pull-back
      const [mx, my] = pr(-71.2, 25.4);
      const ring = ellipsePts(mx, my, 30, 30, 40); ring.push(ring[0], ring[1]);
      const mRing = svg('path', { fill: PAL.ink, 'data-name': '1A B-59 ring' }, dyn);
      const mDot = svg('path', { d: dPath(ellipsePts(mx, my, 9, 9, 16)), fill: PAL.ink }, dyn);
      const mLab = svg('g', { 'data-name': '1A B-59 label' }, dyn);
      const lab1 = letter(mLab, 'B-59', { x: mx + 44, y: my + 2, size: P ? 46 : 42, seed: 8, spacing: 0.06 });
      const lab2 = letter(mLab, 'POSITION APPROX.', { name: '1A B-59 approx', x: mx + 44, y: my + (P ? 50 : 46), size: P ? 26 : 24, seed: 9, spacing: 0.08, jitter: 0.5 });
      // date caption (lettered box)
      const cap = caption(over, ['OCTOBER 27, 1962'], { x: x + 26, y: y + 26, size: P ? 58 : 56, seed: 21, name: '1A Date caption' });
      const t0 = T.cuba - 0.12;
      return {
        update(t) {
          mRing.setAttribute('d', brush(ring, { w: 7, p: ez.enter(clamp((t - t0) / (9 * F))), seed: 3, tin: 0.05, tout: 0.1, min: 0.5 }));
          mDot.style.display = t >= t0 ? '' : 'none';
          const sl = snap(t, t0 + 4 * F);
          mLab.style.opacity = t >= t0 + 4 * F ? 1 : 0;
          mLab.setAttribute('transform', `translate(${((1 - sl) * 18).toFixed(2)} 0)`);
          const c = snap(t, T.oct + 2 * F);
          cap.g.style.display = t >= T.oct + 2 * F ? '' : 'none';
          cap.g.setAttribute('transform', `translate(${x + 26} ${y + 26}) scale(${(0.92 + 0.08 * c).toFixed(4)}) translate(${-(x + 26)} ${-(y + 26)})`);
        },
      };
    },
  });

  // ======================= 1B · DEPTH SECTION + SUB =======================
  const subCY = 0.63;
  panel('p1b', '1B Depth panel', rectPoly(R.p1b), {
    fill: PAL.teal, enter: 'slide', tIn: T.soviet - 0.62, from: P ? [0, 1300] : [900, 0], inkT: T.soviet + 0.05, inkDur: 0.5, dir: [0.15, 1], seed: 23,
    build: ({ g, dyn, x, y, w, h }) => {
      const sy = y + h * 0.13;
      svg('rect', { x: x - 5, y: y - 5, width: w + 10, height: sy - y + 5, fill: PAL.paper }, g);
      const surf = []; for (let i = 0; i <= 24; i++) surf.push([x - 10 + (w + 20) * i / 24, sy + Math.sin(i * 1.7) * 3]);
      svg('path', { d: brush(surf, { w: 8, seed: 5, tin: 0.02, tout: 0.02, min: 0.6 }), fill: PAL.ink }, g);
      for (let i = 0; i < 5; i++) { const X = x + 30 + rand(i * 2.3 + 1) * (w - 120); svg('path', { d: brush([[X, sy - 4], [X + 22, sy - 14], [X + 46, sy - 5]], { w: 5, seed: 40 + i }), fill: PAL.ink }, g); }
      // light streaks under the surface: density falls with depth (tone = line density)
      for (let i = 0; i < 16; i++) {
        const d = rand(i * 4.1 + 2) ** 1.8, Y = sy + 24 + d * h * 0.36, X = x + 10 + rand(i * 6.3) * (w - 60), l = 40 + rand(i * 2.9) * 120 * (1 - d);
        svg('path', { d: brush([[X, Y], [X + l, Y + 1]], { w: 4.5 - d * 2, seed: 60 + i }), fill: PAL.paper }, g);
      }
      // deep water: ink hatching, denser toward the bottom
      for (let X = x - 30, i = 0; X < x + w + 30; X += 22, i++) { // two rows of parallel hatch: darker toward the bottom
        const l1 = 40 + rand(i * 3.7) * 40; svg('path', { d: brush([[X, y + h + 6], [X + l1 * 0.55, y + h - l1 * 1.4]], { w: 4.5, seed: 80 + i }), fill: PAL.ink }, g);
        if (i % 2) { const l2 = 24 + rand(i * 5.3) * 26, Y = y + h - l1 * 1.4 - 18; svg('path', { d: brush([[X + 8, Y], [X + 8 + l2 * 0.55, Y - l2 * 1.3]], { w: 3.5, seed: 180 + i }), fill: PAL.ink }, g); }
      }
      const len = w * 0.8, sub = subShape(x + w * 0.11, y + h * subCY, len);
      const sg = svg('g', { 'data-name': '1B Submarine B-59' }, g);
      svg('path', { d: dPath(rough(sub.hull, { step: 6, amp: 0.8, seed: 7 })), fill: PAL.ink }, sg);
      svg('path', { d: dPath(rough(sub.sail, { step: 6, amp: 0.8, seed: 8 })), fill: PAL.ink }, sg);
      svg('path', { d: dPath(sub.fin), fill: PAL.ink }, sg);
      sub.masts.forEach((m, i) => svg('path', { d: brush(m, { w: 6, seed: 90 + i, tout: 0.3 }), fill: PAL.ink }, sg));
      svg('path', { d: brush(sub.rim, { w: 4.5, seed: 12, tin: 0.2, tout: 0.4 }), fill: PAL.paper }, sg);
      svg('path', { d: brush([sub.sail[1], sub.sail[2], sub.sail[3]].map(([a, b]) => [a, b + 3]), { w: 3.5, seed: 13 }), fill: PAL.paper }, sg);
      // a few rising bubbles from the stern
      for (let i = 0; i < 4; i++) svg('path', { d: dPath(ellipsePts(x + w * 0.11 + len * (0.86 + i * 0.02), y + h * subCY - sub.hh * (1.1 + i * 0.75), 5 + i * 1.5, 5 + i * 1.5, 14)), fill: 'none', stroke: PAL.paper, 'stroke-width': 3 }, g);
      const cap = caption(dyn, ['DEEP BELOW,', 'NEAR CUBA.'], { x: x + 24, y: y + h * 0.75, size: TXT, seed: 31, name: '1B Caption deep' });
      return { update(t) { cap.g.style.display = t >= T.deep - 2 * F ? '' : 'none'; } };
    },
  });

  // ======================= 2A · SHIPS ABOVE, CHARGES =======================
  panel('p2a', '2A Surface panel', rectPoly(R.p2a), {
    fill: PAL.teal, tIn: T.above - 0.2, inkT: T.ships - 0.5, inkDur: 0.5, dir: [1, 0.2], seed: 37,
    build: ({ g, dyn, over, x, y, w, h }) => {
      const sy = y + h * 0.34;
      svg('rect', { x: x - 5, y: y - 5, width: w + 10, height: sy - y + 5, fill: PAL.paper }, g);
      const surf = []; for (let i = 0; i <= 30; i++) surf.push([x - 10 + (w + 20) * i / 30, sy + Math.sin(i * 1.3) * 3]);
      svg('path', { d: brush(surf, { w: 8, seed: 15, tin: 0.02, tout: 0.02, min: 0.6 }), fill: PAL.ink }, g);
      // far ship (lighter = farther), near destroyer
      const far = shipShape(x + w * 0.74, sy, w * 0.2);
      [far.hull, ...far.blocks].forEach(p => svg('path', { d: dPath(p), fill: PAL.teal }, g));
      svg('path', { d: brush(far.mast, { w: 3, seed: 2 }), fill: PAL.teal }, g);
      const sh = shipShape(x + w * 0.05, sy + 4, w * 0.52);
      const sg = svg('g', { 'data-name': '2A US destroyer' }, g);
      [sh.hull, ...sh.blocks].forEach((p, i) => svg('path', { d: dPath(rough(p, { step: 6, amp: 0.7, seed: 30 + i })), fill: PAL.ink }, sg));
      svg('path', { d: brush(sh.mast, { w: 6, seed: 3, tout: 0.4 }), fill: PAL.ink }, sg);
      svg('path', { d: brush(sh.yard, { w: 4, seed: 4 }), fill: PAL.ink }, sg);
      svg('path', { d: brush(sh.brace, { w: 4, seed: 6 }), fill: PAL.ink }, sg);
      svg('path', { d: brush(sh.radar, { w: 7, seed: 8, min: 0.8 }), fill: PAL.ink }, sg);
      const bx = x + w * 0.05 + w * 0.52;
      svg('path', { d: brush([[bx - 30, sy + 2], [bx + 10, sy - 18], [bx + 46, sy + 2]], { w: 6, seed: 5 }), fill: PAL.paper }, g);
      for (let i = 0; i < 3; i++) svg('path', { d: brush([[x + w * (0.08 + i * 0.12), sy + 16 + i * 4], [x + w * (0.17 + i * 0.12), sy + 15 + i * 4]], { w: 4, seed: 70 + i }), fill: PAL.paper }, g);
      // the sub, far below
      const sub = subShape(x + w * 0.36, y + h * 0.88, w * 0.62);
      svg('path', { d: dPath(rough(sub.hull, { step: 6, amp: 0.8, seed: 17 })), fill: PAL.ink, 'data-name': '2A Submarine below' }, g);
      svg('path', { d: dPath(rough(sub.sail, { step: 6, amp: 0.8, seed: 18 })), fill: PAL.ink }, g);
      svg('path', { d: dPath(sub.fin), fill: PAL.ink }, g);
      svg('path', { d: brush(sub.rim, { w: 4, seed: 19, tin: 0.2, tout: 0.4 }), fill: PAL.paper }, g);
      // deep hatch
      for (let X = x - 30, i = 0; X < x + w + 30; X += 22, i++) { const l = 30 + rand(i * 3.1) * 34; svg('path', { d: brush([[X, y + h + 6], [X + l * 0.55, y + h - l * 1.3]], { w: 4, seed: 120 + i }), fill: PAL.ink }, g); }
      // ---- dynamic: three practice charges drop, sink, burst
      const drops = [0, 1, 2].map(i => ({
        x: x + w * (0.17 + i * 0.13), y0: sy - 6, y1: y + h * [0.6, 0.68, 0.56][i], t0: T.drop + i * 0.16 - 2 * F, e: E[i], r: [1, 0.78, 0.5][i] * (P ? 1.05 : 1),
      }));
      const parts = drops.map((d, i) => {
        const bar = svg('g', { 'data-name': `2A Charge ${i + 1}` }, dyn);
        svg('rect', { x: -13, y: -17, width: 26, height: 34, rx: 6, fill: PAL.ink }, bar);
        svg('rect', { x: -13, y: -4, width: 26, height: 4, fill: PAL.paper }, bar);
        const lines = svg('path', { d: [[-8, -28], [3, -34], [12, -26]].map(([a, b], k) => brush([[a, b], [a, b - 26 - k * 6]], { w: 3.5, seed: 200 + k })).join(''), fill: PAL.paper }, bar);
        // burst: jagged star + two rings, drawn once, then it stays (a drawn mark, not a glow)
        const R0 = (P ? 120 : 112) * d.r;
        const star = []; for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2, rr = R0 * (k % 2 ? 0.52 + rand(k + i) * 0.12 : 0.9 + rand(k * 3 + i) * 0.2); star.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.86]); }
        const burst = svg('g', { 'data-name': `2A Burst ${i + 1}` }, dyn);
        svg('path', { d: dPath(star), fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, burst);
        svg('path', { d: dPath(ellipsePts(0, 0, R0 * 0.32, R0 * 0.28, 20)), fill: PAL.ink }, burst);
        const rings = [1.35, 1.75].map((k, j) => ({ k, node: svg('path', { fill: PAL.paper }, dyn), pts: (() => { const p = ellipsePts(d.x, d.y1, R0 * k, R0 * k * 0.8, 56); p.push(p[0], p[1], p[2]); return p; })() }));
        return { bar, lines, burst, rings, R0 };
      });
      // SFX lettering, drawn as shapes: wide, heavy, wavy baseline (sound under water), breaks the panel border
      const sfx = (txt, cx, cy, size, seed, nm) => {
        const gg = svg('g', { 'data-name': nm }, over);
        const ls = [...txt].map((c, i) => {
          const s = size * (0.78 + i * 0.07), lg = svg('g', {}, gg);
          const back = svg('text', { x: 0, y: 0, 'font-family': FONT.sfx, 'font-weight': 800, 'font-size': s, fill: PAL.ink, stroke: PAL.ink, 'stroke-width': s * 0.16, 'stroke-linejoin': 'round', 'text-anchor': 'middle' }, lg);
          back.textContent = c;
          const front = svg('text', { x: 0, y: 0, 'font-family': FONT.sfx, 'font-weight': 800, 'font-size': s, fill: PAL.paper, 'text-anchor': 'middle' }, lg);
          front.textContent = c;
          return { lg, s, c };
        });
        let cx0 = 0; const xs = ls.map(l => { const wv = (l.lg.lastChild.getComputedTextLength() || l.s * 0.8); const v = cx0 + wv / 2; cx0 += wv * 0.9; return v; });
        ls.forEach((l, i) => { l.x = cx - cx0 / 2 + xs[i]; l.y = cy + Math.sin(i * 1.15 + seed) * size * 0.1; l.rot = -7 + (rand(seed + i) - 0.5) * 8; });
        return { gg, ls };
      };
      const sx1 = sfx('WHUMM', x + w * (P ? 0.5 : 0.56), y + h * (P ? 0.6 : 0.62), P ? 132 : 138, 3, '2A SFX lettering WHUMM');
      const sx2 = sfx('WHUMM', x + w * (P ? 0.36 : 0.36), y + h * 0.84, P ? 70 : 74, 7, '2A SFX lettering small');
      const cap = caption(dyn, ['PRACTICE DEPTH CHARGES'], { x: 0, y: 0, size: P ? 46 : 44, seed: 41, name: '2A Caption practice' });
      cap.g.setAttribute('transform', `translate(${x + w - cap.w - 24} ${y + 22})`);
      return {
        update(t) {
          drops.forEach((d, i) => {
            const pp = parts[i];
            const on = t >= d.t0 && t < d.e;
            pp.bar.style.display = on ? '' : 'none';
            if (on) {
              const q = clamp((t - d.t0) / (d.e - d.t0)), yy = lerp(d.y0, d.y1, ez.move(q)), rot = 18 * (i % 2 ? -1 : 1) + 70 * q * (i % 2 ? 1 : -1);
              pp.bar.setAttribute('transform', `translate(${d.x.toFixed(1)} ${yy.toFixed(1)}) rotate(${rot.toFixed(1)})`);
              pp.lines.style.display = q < 0.85 ? '' : 'none';
            }
            const b = snap(t, d.e, { stiffness: 700, damping: 46 });
            pp.burst.style.display = t >= d.e ? '' : 'none';
            pp.burst.setAttribute('transform', `translate(${d.x} ${d.y1}) scale(${(0.35 + 0.65 * b).toFixed(4)})`);
            pp.rings.forEach((r, j) => {
              const rp = ez.enter(clamp((t - d.e - (2 + j * 3) * F) / (10 * F)));
              r.node.setAttribute('d', rp > 0 ? brush(r.pts, { w: 5 - j, p: rp, seed: 300 + i * 2 + j, tin: 0.05, tout: 0.25, min: 0.3 }) : '');
            });
          });
          [[sx1, E[0]], [sx2, E[1]]].forEach(([s, e]) => {
            s.gg.style.display = t >= e ? '' : 'none';
            s.ls.forEach((l, i) => {
              const k = snap(t, e + i * 2 * F, { stiffness: 620, damping: 34 }), sc = 1.25 - 0.25 * k;
              l.lg.style.opacity = t >= e + i * 2 * F ? 1 : 0;
              l.lg.setAttribute('transform', `translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(2)}) scale(${sc.toFixed(4)})`);
            });
          });
          cap.g.style.display = t >= T.practice - 2 * F ? '' : 'none';
        },
      };
    },
  });

  // ======================= 2B · RADIO, EMPTY BALLOON =======================
  panel('p2b', '2B Radio panel', rectPoly(R.p2b), {
    fill: PAL.ink, enter: 'slide', tIn: T.moscow - 0.5, from: P ? [0, 1200] : [900, 0], inkT: T.moscow - 0.2, inkDur: 0.42, dir: [0.2, 1], seed: 43,
    build: ({ g, dyn, x, y, w, h }) => {
      // pipes overhead
      [0.06, 0.1, 0.9].forEach((f, i) => {
        const Y = y + h * f;
        svg('path', { d: brush([[x - 10, Y], [x + w + 10, Y + 2]], { w: i === 2 ? 16 : 12, seed: 400 + i, tin: 0.02, tout: 0.02, min: 0.8 }), fill: PAL.teal }, g);
        for (let k = 0; k < 3; k++) { const X = x + w * (0.18 + k * 0.33 + i * 0.05); svg('path', { d: brush([[X, Y - 14], [X, Y + 14]], { w: 6, seed: 410 + k + i * 3, min: 0.8 }), fill: PAL.teal }, g); }
      });
      // the receiver
      const rx = x + w * 0.1, ry = y + h * 0.5, rw = w * 0.8, rh = h * 0.3;
      const radio = svg('g', { 'data-name': '2B Radio receiver' }, g);
      svg('path', { d: ruledBox([[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh]], 6, 44), fill: PAL.paper }, radio);
      const dcx = rx + rw * 0.24, dcy = ry + rh * 0.48, dr = Math.min(rw, rh) * 0.3;
      const dial = ellipsePts(dcx, dcy, dr, dr, 40); dial.push(dial[0], dial[1]);
      svg('path', { d: brush(dial, { w: 5, seed: 45, tin: 0.02, tout: 0.02, min: 0.7 }), fill: PAL.paper }, radio);
      for (let k = 0; k < 9; k++) { const a = Math.PI * (1.15 + k * 0.0875); svg('path', { d: brush([[dcx + Math.cos(a) * dr * 0.78, dcy + Math.sin(a) * dr * 0.78], [dcx + Math.cos(a) * dr * 0.92, dcy + Math.sin(a) * dr * 0.92]], { w: 3, seed: 46 + k, min: 0.8 }), fill: PAL.paper }, radio); }
      svg('path', { d: brush([[dcx, dcy], [dcx - dr * 0.55, dcy - dr * 0.45]], { w: 4, seed: 47, min: 0.6 }), fill: PAL.teal }, radio);
      const gx = rx + rw * 0.5, gw = rw * 0.42;
      for (let k = 0; k < 5; k++) svg('path', { d: brush([[gx, ry + rh * (0.2 + k * 0.15)], [gx + gw, ry + rh * (0.2 + k * 0.15)]], { w: 5, seed: 50 + k, tin: 0.05, tout: 0.05, min: 0.6 }), fill: PAL.paper }, radio);
      [0.18, 0.32].forEach((f, k) => svg('path', { d: dPath(ellipsePts(rx + rw * f, ry + rh + 26, 15, 15, 18)), fill: PAL.teal, stroke: PAL.paper, 'stroke-width': 3 }, radio));
      // headphones hanging off the set
      const hx = rx + rw * 0.86, hy = ry + rh;
      svg('path', { d: brush(cubicPts([hx, hy], [hx + 10, hy + 60], [hx - 70, hy + 70], [hx - 60, hy + 120], 20), { w: 4, seed: 60, min: 0.7 }), fill: PAL.paper }, g);
      svg('path', { d: dPath(ellipsePts(hx - 60, hy + 140, 18, 24, 18)), fill: PAL.ink, stroke: PAL.paper, 'stroke-width': 4 }, g);
      // "MOSCOW:" + an empty balloon from the speaker grille = silence
      const cap = caption(dyn, ['MOSCOW:'], { x: x + 26, y: y + h * 0.15, size: TXT, seed: 51, name: '2B Caption Moscow' });
      const bal = balloon(dyn, { cx: x + w * 0.6, cy: y + h * 0.29, rx: w * 0.3, ry: h * 0.1, tx: gx + gw * 0.45, ty: ry - 8, seed: 5, bw: 6, name: '2B Empty balloon (silence)' });
      return {
        update(t) {
          cap.g.style.display = t >= T.moscow - 2 * F ? '' : 'none';
          const tb = T.silent - 2 * F, k = snap(t, tb, { stiffness: 560, damping: 36 });
          bal.g.style.display = t >= tb ? '' : 'none';
          const ox = gx + gw * 0.45, oy = ry - 8, sc = 0.55 + 0.45 * k;
          bal.g.setAttribute('transform', `translate(${ox} ${oy}) scale(${sc.toFixed(4)}) translate(${-ox} ${-oy})`);
        },
      };
    },
  });

  // ======================= 3A · THE TORPEDO =======================
  panel('p3a', '3A Torpedo panel', rectPoly(R.p3a), {
    tIn: T.on - 0.25, inkT: T.nuclear - 0.2, inkDur: 0.6, dir: [1, 0.08], seed: 53,
    build: ({ g, dyn, x, y, w, h }) => {
      const ty = y + h * (P ? 0.5 : 0.42), tl = w * 0.78, tx = x + w * 0.11, th = Math.min(h * 0.3, tl / 14);
      // rails + cradles
      [0.86, 0.93].forEach((f, i) => svg('path', { d: brush([[x - 10, y + h * f], [x + w + 10, y + h * f + 1]], { w: 6 - i * 2, seed: 500 + i, tin: 0.01, tout: 0.01, min: 0.8 }), fill: PAL.ink }, g));
      [0.25, 0.6].forEach((f, i) => svg('path', { d: dPath([[tx + tl * f - 40, ty + th * 0.45], [tx + tl * f + 40, ty + th * 0.45], [tx + tl * f + 56, y + h * 0.86], [tx + tl * f - 56, y + h * 0.86]]), fill: PAL.ink }, g));
      // hatch on the back wall (tone by line density)
      for (let X = x + w * 0.3, i = 0; X < x + w; X += 26, i++) { const l = 30 + rand(i * 2.7) * 26; svg('path', { d: brush([[X, y - 4], [X + l * 0.6, y + l]], { w: 4, seed: 520 + i }), fill: PAL.ink }, g); }
      const prof = u => (u < 0.06 ? Math.sqrt(Math.max(0, 1 - ((0.06 - u) / 0.06) ** 2)) : u > 0.88 ? 1 - ((u - 0.88) / 0.12) * 0.6 : 1) * th / 2;
      const top = [], bot = [];
      for (let i = 0; i <= 80; i++) { const u = i / 80; top.push([tx + u * tl, ty - prof(u)]); bot.push([tx + u * tl, ty + prof(u)]); }
      const tg = svg('g', { 'data-name': '3A Nuclear torpedo' }, g);
      svg('path', { d: dPath([...top, ...[...bot].reverse()]), fill: PAL.ink }, tg);
      // warhead section in the spot colour
      const wa = 0.07, wb = 0.24;
      svg('path', { d: dPath([...top.filter(([px]) => px >= tx + tl * wa && px <= tx + tl * wb), ...bot.filter(([px]) => px >= tx + tl * wa && px <= tx + tl * wb).reverse()]), fill: PAL.teal }, tg);
      svg('path', { d: brush(top.slice(4, 70).map(([a, b]) => [a, b + 4]), { w: 4, seed: 54, tin: 0.1, tout: 0.3 }), fill: PAL.paper }, tg);
      const fx = tx + tl;
      svg('path', { d: dPath([[fx - 30, ty - th * 0.2], [fx + 10, ty - th * 0.85], [fx + 22, ty - th * 0.8], [fx + 6, ty], [fx + 22, ty + th * 0.8], [fx + 10, ty + th * 0.85], [fx - 30, ty + th * 0.2]]), fill: PAL.ink }, tg);
      svg('path', { d: brush([[fx + 18, ty - th * 0.55], [fx + 18, ty + th * 0.55]], { w: 7, seed: 55, min: 0.7 }), fill: PAL.ink }, tg);
      // a cargo tag tied to the warhead, swinging (the motion settles = a held breath)
      const ax = tx + tl * 0.16, ay = ty + th / 2;
      const tag = svg('g', { 'data-name': '3A Tag NUCLEAR' }, dyn);
      const sl = P ? 60 : 50;
      svg('path', { d: brush([[0, 0], [2, sl]], { w: 3, seed: 56, min: 0.8 }), fill: PAL.ink }, tag);
      const tagTxt = letter(tag, 'NUCLEAR', { x: 0, y: sl + (P ? 54 : 48), size: P ? 42 : 36, anchor: 'middle', seed: 57, spacing: 0.1 });
      const tW = tagTxt.getComputedTextLength() + 34, tH = (P ? 66 : 58);
      const tagBox = svg('path', { d: dPath([[-tW / 2 + 14, sl], [tW / 2 - 14, sl], [tW / 2, sl + 14], [tW / 2, sl + tH], [-tW / 2, sl + tH], [-tW / 2, sl + 14]]), fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' }, tag);
      tag.insertBefore(tagBox, tagTxt);
      svg('circle', { cx: 0, cy: sl + 10, r: 5, fill: PAL.ink }, tag);
      const cap = caption(dyn, ['ON BOARD:'], { x: x + 24, y: y + 20, size: TXT, seed: 61, name: '3A Caption on board' });
      return {
        update(t) {
          cap.g.style.display = t >= T.on - 2 * F ? '' : 'none';
          const ts = T.torpedo, a = t < ts ? 0 : 16 * Math.exp(-(t - ts) / 0.7) * Math.sin((t - ts) * 7.5 + 1.2);
          tag.style.display = t >= T.nuclear + 2 * F ? '' : 'none';
          tag.setAttribute('transform', `translate(${ax} ${ay}) rotate(${a.toFixed(2)})`);
        },
      };
    },
  });

  // ======================= 3B–3D · THE VOTE: three narrow slanted panels =======================
  const tVote = [T.three - 4 * F, T.three + 1 * F, T.three + 6 * F];
  const tYes = [T.two - 2 * F, T.yes - 2 * F];
  VP.forEach((poly, i) => {
    panel(`v${i + 1}`, `3${'BCD'[i]} Vote panel ${i + 1}`, poly, {
      fill: PAL.teal, tIn: tVote[i], inkT: tVote[i] + 5 * F, inkDur: 0.36, dir: [0.1, 1], seed: 61 + i * 7,
      build: ({ g, dyn, x, y, w, h }) => {
        // background machinery: two vertical pipes + corner hatch
        [0.16, 0.84].forEach((f, k) => svg('path', { d: brush([[x + w * f + (i - 1) * 20, y - 10], [x + w * f + (i - 1) * 24, y + h + 10]], { w: 12 - k * 4, seed: 600 + i * 3 + k, min: 0.85, tin: 0.01, tout: 0.01 }), fill: PAL.ink }, g));
        for (let X = x - 40, k = 0; X < x + w; X += 20, k++) { const l = 40 + rand(k * 3.3 + i) * 50; svg('path', { d: brush([[X, y - 6], [X + l * 0.5, y + l]], { w: 3.8, seed: 640 + k + i * 20 }), fill: PAL.ink }, g); }
        const midL = (poly[0][0] + poly[3][0]) / 2, midR = (poly[1][0] + poly[2][0]) / 2, pw = midR - midL;
        const s = Math.min(pw * 0.36, h * 0.24) * [1, 0.93, 1.06][i], cx = (midL + midR) / 2 + [-0.05, 0.04, 0.03][i] * pw, by = y + h * 0.52 + s * 0.9;
        const o = officerBack(cx, by, s, { extend: 6 });
        const og = svg('g', { 'data-name': `3${'BCD'[i]} Officer ${i + 1} (from behind)`, transform: `rotate(${[-2, 1.5, 0][i]} ${cx} ${by})` }, g);
        o.parts.forEach((pp, k) => svg('path', { d: dPath(k === 0 ? rough(pp, { step: 8, amp: 1, seed: 70 + i }) : pp), fill: PAL.ink }, og));
        o.rim.forEach((r, k) => svg('path', { d: brush(r, { w: Math.max(3, s * 0.035), seed: 80 + k + i * 5, tin: 0.2, tout: 0.4 }), fill: PAL.paper }, og));
        o.boards.forEach((b, k) => svg('path', { d: brush(b, { w: s * 0.07, seed: 90 + k, min: 0.8, tin: 0.05, tout: 0.05 }), fill: PAL.teal }, og));
        // panel number, lettered
        const nb = caption(g, [`${i + 1}`], { x: poly[0][0] + 22, y: y + 22, size: P ? 46 : 44, seed: 95 + i, name: `3${'BCD'[i]} Number ${i + 1}` });
        if (i === 2) return {};
        const bcx = cx + pw * 0.06, bcy = y + h * (P ? 0.15 : 0.17), brx = pw * (P ? 0.4 : 0.34), bry = h * (P ? 0.065 : 0.1);
        const bal = balloon(dyn, { cx: bcx, cy: bcy, rx: brx, ry: bry, tx: cx + s * 0.28, ty: by - 1.75 * s, seed: 11 + i, bw: 5, name: `3${'BCD'[i]} Balloon YES ${i + 1}` });
        letter(bal.g, 'YES.', { x: bcx, y: bcy + (P ? 20 : 24), size: P ? 58 : 68, anchor: 'middle', seed: 101 + i, spacing: 0.06 });
        return {
          update(t) {
            const tb = tYes[i], k = snap(t, tb, { stiffness: 560, damping: 36 });
            bal.g.style.display = t >= tb ? '' : 'none';
            const ox = cx + s * 0.28, oy = by - 1.75 * s, sc = 0.6 + 0.4 * k;
            bal.g.setAttribute('transform', `translate(${ox} ${oy}) scale(${sc.toFixed(4)}) translate(${-ox} ${-oy})`);
          },
        };
      },
    });
  });

  // ======================= CAMERA =======================
  const sub1y = R.p1b[1] + R.p1b[3] * subCY;
  const v3cx = (VP[2][0][0] + VP[2][1][0] + VP[2][2][0] + VP[2][3][0]) / 4;
  const keys = P ? [
    [0, 500, 640, 0.92], [T.soviet - 0.3, 500, R.p1b[1] + R.p1b[3] / 2, 1.0, 0.85, 0.1], [T.deep - 0.2, 500, sub1y + 40, 1.38, 0.8], [T.cuba - 0.35, 500, 990, 0.66, 0.8],
    [T.above - 0.4, 500, R.p2a[1] + R.p2a[3] / 2, 0.95, 1.0, 0.16], [T.depth - 0.25, 500, R.p2a[1] + R.p2a[3] * 0.56, 1.04, 1.4], [T.moscow - 0.3, 500, R.p2b[1] + R.p2b[3] / 2, 1.0, 0.8],
    [T.on - 0.45, 500, 4120, 0.95, 1.0, 0.14], [T.fire - 0.25, 500, vy + vh / 2, 0.95, 0.9], [T.yes + 0.15, 720, vy + vh / 2 - 10, 1.08, 1.0], [T.third - 0.3, v3cx - 5, vy + vh * 0.48, 1.5, 0.75],
  ] : [
    [0, 575, 490, 1.04], [T.soviet - 0.25, 1420, 490, 1.08, 0.85, 0.08], [T.deep - 0.2, 1510, sub1y, 1.55, 0.8], [T.cuba - 0.35, 918, 490, 0.98, 0.8],
    [T.above - 0.4, 565, R.p2a[1] + R.p2a[3] / 2, 1.1, 1.0, 0.16], [T.depth - 0.25, 590, R.p2a[1] + R.p2a[3] * 0.56, 1.18, 1.4], [T.moscow - 0.3, 1500, R.p2b[1] + R.p2b[3] / 2, 1.22, 0.8],
    [T.on - 0.45, 918, R.p3a[1] + R.p3a[3] / 2 + 30, 1.03, 1.0, 0.14], [T.fire - 0.25, 918, vy + vh / 2, 1.0, 0.9], [T.yes + 0.15, 1250, vy + vh / 2 - 10, 1.1, 1.0], [T.third - 0.3, v3cx + 10, vy + vh * 0.46, 1.48, 0.75],
  ];
  const anchor = P ? [L.safe.cx, L.safe.cy] : [FW / 2, FH / 2];
  const cam = t => {
    let [, x, y, z] = keys[0], lz = Math.log(z), dip = 0;
    for (let i = 1; i < keys.length; i++) {
      const [t0, kx, ky, kz, dur, dp = 0] = keys[i];
      if (t <= t0) break;
      const p = clamp((t - t0) / dur), e = ez.camera(p);
      x = lerp(x, kx, e); y = lerp(y, ky, e); lz = lerp(lz, Math.log(kz), e);
      if (p < 1) dip = dp * Math.sin(Math.PI * p);
    }
    z = Math.exp(lz) * (1 - dip);
    // breathing drift (smooth, tiny) + impact shake from the bursts (noise, decays)
    x += 3 * noise1(t * 0.3, 1); y += 2.5 * noise1(t * 0.3, 2);
    E.slice(0, 2).forEach((e, i) => { const d = t - e; if (d > 0 && d < 0.45) { const a = (i ? 5 : 9) * (1 - d / 0.45) ** 2; x += a * vnoise(d * 22, 5 + i) / z; y += a * vnoise(d * 22, 9 + i) / z; } });
    return { x, y, z };
  };
  const toScreen = (c, [wx, wy]) => [anchor[0] + (wx - c.x) * c.z, anchor[1] + (wy - c.y) * c.z];

  // ======================= SCREEN LAYER: name, full-bleed NO, inset =======================
  const fbG = svg('g', { 'data-name': '4A Full-bleed NO panel', style: 'display:none' }, screenL);
  svg('clipPath', { id: `${uid}-fb` }, defs).appendChild(svg('path', {}));
  const fbClip = defs.querySelector(`#${uid}-fb path`);
  const fbArt = svg('g', { 'clip-path': `url(#${uid}-fb)` }, fbG);
  const fbBg = svg('path', { fill: PAL.paper }, fbArt);
  svg('rect', { x: -100, y: -100, width: FW + 200, height: FH + 200, fill: `url(#${uid}-paper)` }, fbArt);
  const fbIn = svg('g', {}, fbArt);
  const fbBorder = svg('path', { fill: PAL.ink }, fbG);
  {
    const s = P ? FW * 0.36 : FH * 0.33, cx = P ? FW * 0.47 : FW * 0.29, by = P ? FH * 0.69 : FH * 0.84;
    // floor line + a little ink hatch, so the huge figure stands somewhere
    const o = officerBack(cx, by, s, { extend: 4 });
    const og = svg('g', { 'data-name': '4A Arkhipov (from behind)' }, fbIn);
    o.parts.forEach((pp, k) => svg('path', { d: dPath(k === 0 ? rough(pp, { step: 10, amp: 1.6, seed: 170 }) : rough(pp, { step: 8, amp: 0.8, seed: 171 + k })), fill: PAL.ink }, og));
    o.boards.forEach((b, k) => svg('path', { d: brush(b, { w: s * 0.06, seed: 190 + k, min: 0.8 }), fill: PAL.paper }, og));
    const B = P ? { cx: FW * 0.53, cy: FH * 0.25, rx: FW * 0.33, ry: FH * 0.078, tx: cx + s * 0.5, ty: by - 1.62 * s }
      : { cx: FW * 0.68, cy: FH * 0.38, rx: FW * 0.19, ry: FH * 0.25, tx: cx + s * 0.5, ty: by - 1.62 * s };
    const bal = balloon(fbIn, { ...B, seed: 21, bw: P ? 8 : 9, name: '4A Balloon NO' });
    const no = letter(bal.g, 'NO.', { x: B.cx - (P ? 6 : 10), y: B.cy + (P ? 70 : 100), size: P ? 200 : 290, anchor: 'middle', seed: 5, fill: PAL.red, stroke: PAL.ink, strokeW: P ? 14 : 17, spacing: 0.04, jitter: 1.4, family: FONT.sfx, weight: 800, name: '4A NO lettering (red)' });
    var noBal = bal, noB = B;
  }
  // name captions (screen space, readable while the camera moves)
  const capS = P ? 56 : 58;
  // bottom-left, over the dark body, clear of the YES balloons (9:16: they slide out when the inset lands)
  const nY = L.safe.y + L.safe.h - 168;
  const nameTop = caption(screenL, ['THE THIRD OFFICER:'], { x: L.safe.x, y: nY, size: 38, seed: 140, name: '4A Caption third officer' });
  const nameCap = caption(screenL, ['VASILI ARKHIPOV'], { x: L.safe.x, y: nY + nameTop.h - 4, size: capS, seed: 141, name: '4A Caption name' });
  // inset: 40 years later
  const IN = P ? [L.safe.x, FH * 0.6, L.safe.w - 10, FH * 0.17] : [FW * 0.6, FH * 0.665, L.safe.x + L.safe.w - FW * 0.6, L.safe.y + L.safe.h - FH * 0.665];
  const inG = svg('g', { 'data-name': '4B Inset panel 40 years later', style: 'display:none' }, screenL);
  const inQ = rectPoly(IN);
  svg('path', { d: dPath(inQ), fill: PAL.teal }, inG);
  const inBorder = svg('path', { fill: PAL.ink }, inG);
  const inL1 = letter(inG, '40 YEARS LATER…', { x: IN[0] + 30, y: IN[1] + (P ? 82 : 80), size: P ? 54 : 52, seed: 150, fill: PAL.paper, name: '4B 40 years later' });
  const inL2 = letter(inG, 'HAVANA, 2002', { x: IN[0] + 30, y: IN[1] + IN[3] - (P ? 52 : 50), size: P ? 82 : 86, seed: 151, fill: PAL.paper, spacing: 0.04, name: '4B Havana 2002' });
  [inL1, inL2].forEach(n => { const mw = IN[2] - 60, cw = n.getComputedTextLength(); if (cw > mw) n.setAttribute('font-size', (parseFloat(n.getAttribute('font-size')) * mw / cw).toFixed(1)); });
  const inEdges = inQ.map((a, i) => { const b = inQ[(i + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [[a[0] - dx / l * 5, a[1] - dy / l * 5], [b[0] + dx / l * 6, b[1] + dy / l * 6]]; });

  const tFB = T.no - 3 * F, tIn4 = T.forty - 3 * F;
  const fbTarget = [[-40, -40], [FW + 40, -40], [FW + 40, FH + 40], [-40, FH + 40]];

  // ======================= SOUND (owned by one scene each; times are scene-local) =======================
  const at = g => g - ctx.start;
  if (sceneNo === 1) {
    ctx.sfx('page-turn-01', 0.0, { lu: -24 });
    ctx.ambience('sea-water-close-01', { from: at(T.soviet - 0.8), to: ctx.duration, lu: -17, fade: 0.8 });
    ctx.sfx('page-turn-01', at(T.soviet - 0.62), { lu: -27 }); // the panel slides onto the page
  } else if (sceneNo === 2) {
    ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -16, fade: 0.5 });
    ctx.sfx('boom-distant-01', at(E[0] + 2 * F), { lu: -6 });
    ctx.sfx('boom-slapback-01', at(E[1] + 2 * F), { lu: -9 });
    ctx.sfx('boom-distant-01', at(E[2] + 2 * F), { lu: -16 });
    ctx.sfx('door-creak-01', at(T.moscow - 0.4), { lu: -27 }); // hull groans after the charges
    ctx.sfx('drips-wood-01', at(T.silent - 0.25), { lu: -24 });
  } else if (sceneNo === 3) {
    ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -20, fade: 0.5 });
    ctx.sfx('footsteps-metal-deck-01', 0.25, { lu: -25 });
    ctx.sfx('cloth-jacket-01', at(T.three), { lu: -25 });
    ctx.sfx('breath-close-01', at(T.two - 0.55), { lu: -24 });
  } else if (sceneNo === 4) {
    ctx.ambience('sea-water-close-01', { from: 0, to: at(T.no - 0.7), lu: -21, fade: 0.6 }); // the drop: sea goes before the NO
    ctx.sfx('breath-scared-01', at(T.no - 0.62), { lu: -23 });
    ctx.sfx('page-turn-01', at(T.forty - 0.1), { lu: -19 }); // time jump = a page turned
  }

  return {
    update(lt) {
      const t = ctx.start + lt;
      const c = cam(t);
      world.setAttribute('transform', `translate(${anchor[0].toFixed(2)} ${anchor[1].toFixed(2)}) scale(${c.z.toFixed(5)}) translate(${(-c.x).toFixed(2)} ${(-c.y).toFixed(2)})`);
      world.style.display = t >= tFB + 0.5 ? 'none' : ''; // the full-bleed panel covers the page by then
      for (const k in panels) panels[k].update(t, c);

      // name captions
      const k1 = snap(t, T.third - 2 * F), k2 = snap(t, T.vasili - 2 * F);
      nameTop.g.style.display = t >= T.third - 2 * F ? '' : 'none';
      const ex = P ? -1100 * ez.exit(clamp((t - (tIn4 - 8 * F)) / (10 * F))) : 0; // 9:16: make room for the inset
      nameTop.g.setAttribute('transform', `translate(${((1 - k1) * -40 + ex).toFixed(2)} 0)`);
      nameCap.g.style.display = t >= T.vasili - 2 * F ? '' : 'none';
      nameCap.g.setAttribute('transform', `translate(${((1 - k2) * -40 + ex * 1.05).toFixed(2)} 0)`);
      if (P && t > tIn4 + 3 * F) { nameTop.g.style.display = 'none'; nameCap.g.style.display = 'none'; }

      // full bleed: the third panel bursts its borders to the frame edges (the grid breaks at the peak)
      if (t >= tFB) {
        fbG.style.display = '';
        const src = VP[2].map(p => toScreen(c, p));
        const q = fbTarget.map((tp, i) => { const k = snap(t, tFB + i * F * 0.5, { stiffness: 420, damping: 34 }); return [lerp(src[i][0], tp[0], k), lerp(src[i][1], tp[1], k)]; });
        fbClip.setAttribute('d', dPath(q)); fbBg.setAttribute('d', dPath(q));
        const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
        const bx = Math.min(...xs), byy = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - byy;
        const cr = 1 + 0.012 * Math.max(0, t - T.no - 0.3); // slow push on the held image
        const sc = Math.max(bw / (FW + 80), bh / (FH + 80)) * cr; // uniform "cover" scale, centred on the bursting panel
        const qcx = bx + bw / 2, qcy = byy + bh / 2;
        fbIn.setAttribute('transform', `translate(${(qcx - FW * 0.5 * sc + (1 - cr) * FW * 0.15).toFixed(2)} ${(qcy - FH * 0.5 * sc + (1 - cr) * FH * 0.1).toFixed(2)}) scale(${sc.toFixed(5)})`);
        const done = snap(t, tFB, { stiffness: 420, damping: 34 }) > 0.999;
        fbBorder.setAttribute('d', done ? '' : ruledBox(q, 9, 7));
        const kb = snap(t, T.no - 1 * F, { stiffness: 600, damping: 30 });
        noBal.g.style.display = t >= T.no - 1 * F ? '' : 'none';
        noBal.g.setAttribute('transform', `translate(${noB.tx} ${noB.ty}) scale(${(0.5 + 0.5 * kb).toFixed(4)}) translate(${-noB.tx} ${-noB.ty})`);
      } else fbG.style.display = 'none';

      // inset panel: border snaps, teal fills, lettering lands
      if (t >= tIn4) {
        inG.style.display = '';
        inBorder.setAttribute('d', inEdges.map((e, i) => brush(e, { w: 7, p: ez.enter(clamp((t - tIn4 - i * F) / (3 * F))), seed: 160 + i, tin: 0.015, tout: 0.02, min: 0.7, wob: 0.1, step: 16 })).join(''));
        inG.firstChild.style.display = t >= tIn4 + 4 * F ? '' : 'none';
        inL1.style.display = t >= tIn4 + 5 * F ? '' : 'none';
        inL2.style.display = t >= T.later - 2 * F ? '' : 'none';
      } else inG.style.display = 'none';
    },
  };
}
