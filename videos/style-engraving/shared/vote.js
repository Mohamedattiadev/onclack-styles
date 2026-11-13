// VOTE NOTE — the torpedo vignette (RC) + three numbered serial stamps (the vote) + the perforated NO.
// Function of GLOBAL time T, shared by scene 3 and scene 4, so the scene join is invisible.
import { svg, clamp, lerp } from '/onclack-styles/engine/lib/anim.js';
import { spring, springs } from '/onclack-styles/engine/lib/spring.js';
import {
  PAL, FONT, ss, makeNote, vignetteFrame, rosette, hatchPattern, serial, engraver, intaglioFamilies, burin, engravedText, camPath,
} from './engrave.js';

const MICRO = 'SUBMARINE B-59 · ONE SPECIAL WEAPON ON BOARD · THREE OFFICERS · TWENTY-SEVENTH OF OCTOBER NINETEEN SIXTY-TWO';
// words: On 13.67 · nuclear 14.48 · torpedo 14.88 · three 16.51 · officers 16.86 · Two 18.29 · yes 18.80 ·
// third 20.25 · Vasili 20.61 · Arkhipov 21.12 · no 22.03 · world 23.07 · forty 24.13
export const TV = { engr: 13.38, torp: 14.42, nums: 16.45, yes1: 18.27, yes2: 18.74, name: 20.56, no: 22.0, roll: 24.08 };

const ROLES = ['Commander', 'Political officer', 'Flotilla chief of staff'];

export function voteNote(root, ctx, { id }) {
  const N = makeNote(root, ctx, 'vote', { id, micro: MICRO });
  const { G } = N, v = G.vig, P = N.L.portrait, w = v.w, h = v.h;
  vignetteFrame(N.front, v, 'Vignette frame (torpedo)');

  // ---- seal with rolling numerals (numbering-machine wheels)
  const s = G.seal;
  const ros = rosette(N.front, s, 5);
  const cg = svg('g', { 'data-name': 'Denomination cartouche' }, N.front);
  const rx = s.cw / 2, ry = s.ch / 2;
  svg('ellipse', { cx: s.cx, cy: s.cy, rx: rx + 10, ry: ry + 10, fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 0.9 }, cg);
  svg('ellipse', { cx: s.cx, cy: s.cy, rx: rx + 4, ry: ry + 4, fill: 'none', stroke: PAL.ink, 'stroke-width': 2.4 }, cg);
  const small = svg('text', { x: s.cx, y: s.cy - ry * 0.5, 'text-anchor': 'middle', 'font-family': FONT.num, 'font-weight': 700, 'font-size': s.ch * 0.17, 'letter-spacing': s.ch * 0.06, fill: PAL.ink, 'data-name': 'Cartouche line' }, cg);
  small.textContent = 'SUBMARINE B-59';
  const fillNum = hatchPattern(N.defs, `${id}-numhatch`, { gap: 2.9, w: 1.5 });
  const size = s.ch * 0.66, dw = size * 0.5, base = s.cy + ry * 0.62, gap = size * 1.05;
  const clip = svg('clipPath', { id: `${id}-win` }, N.defs);
  svg('rect', { x: s.cx - rx, y: base - size * 0.82, width: rx * 2, height: size * 1.0 }, clip);
  const wheels = svg('g', { 'clip-path': `url(#${id}-win)`, 'data-name': 'Year wheels (1962 → 2002)' }, cg);
  const cols = [['1', '2'], ['9', '0'], ['6', '7', '8', '9', '0'], ['2']].map((digits, i) => {
    const g = svg('g', {}, wheels);
    digits.forEach((d, k) => {
      const t = svg('text', { x: s.cx + (i - 1.5) * dw, y: base + k * gap, 'text-anchor': 'middle', 'font-family': FONT.serif, 'font-size': size, fill: fillNum, stroke: PAL.ink, 'stroke-width': size * 0.009 + 0.35 }, g);
      t.textContent = d;
    });
    return { g, n: digits.length - 1 };
  });
  const ns = P ? 30 : 32;
  serial(N.front, G.serialA, 'B·59  027 1963', PAL.red, ns, 'Serial number (red)');
  serial(N.front, G.serialB, 'B·59  027 1963', PAL.ink, ns, 'Serial number (green)');

  // ---- torpedo engraving (RC)
  const ax = h * 0.5, r = h * 0.15, x0 = w * 0.07, len = w * 0.84;
  const prof = xn => {
    if (xn < 0 || xn > 1) return -1;
    if (xn < 0.13) { const q = 1 - xn / 0.13; return r * Math.pow(Math.max(0, 1 - q * q), 0.62); }
    if (xn > 0.84) return r * (1 - 0.65 * ((xn - 0.84) / 0.16) ** 1.3);
    return r;
  };
  const seams = [0.1, 0.33, 0.58, 0.84];
  function torpTone(x, y, a) {
    const ex = Math.min(x, w - x) / w, ey = Math.min(y, h - y) / h;
    let t = 0.34 + 0.14 * (y / h) + 0.03 * Math.sin(x * 0.011) + 0.22 * Math.exp(-ex * 14) + 0.2 * Math.exp(-ey * 9);
    t += 0.16 * Math.exp(-(((y - ax - r * 1.35) / (r * 0.5)) ** 2)) * (x > x0 && x < x0 + len ? 1 : 0) * a;   // cast shade under the body
    if (a <= 0) return t;
    const xn = (x - x0) / len, pr = prof(xn), dy = y - ax;
    let s = -1;
    // soft silhouette: lines taper into the engraver's white edge instead of stopping dead
    const d = pr > 0 ? Math.abs(dy) - pr : 99;
    if (d < 0) {
      const ny = dy / pr;
      let si = 0.24 + 0.64 * Math.pow(Math.abs(ny + 0.38) / 1.38, 1.15) + (ny > 0.55 ? 0.12 : 0);
      if (xn > 0.1 && xn < 0.33) si += 0.12;                                              // warhead section, darker
      for (const sm of seams) if (Math.abs(xn - sm) * len < 1.6) si = 0.85;
      s = lerp(0.02, si, clamp(-d / 3.5));
    } else if (xn > 0.86 && xn < 0.97 && Math.abs(dy) < r * (1.9 - (xn - 0.86) * 4)) {
      s = 0.34 + 0.3 * (dy > 0 ? 1 : 0);                                                  // fins
    } else if (xn >= 0.995 && xn < 1.012 && Math.abs(dy) < r * 1.45) s = 0.75;            // propeller blades
    else if (d < 4) s = 0.02;
    else if (d < 9) s = lerp(0.02, t, (d - 4) / 5);
    if (s >= 0) t = lerp(t, s, a);
    return clamp(t);
  }
  const E = engraver(w, h, intaglioFamilies({ spacing: 6 }));
  const legend = svg('g', { 'data-name': 'Torpedo plate' }, N.front);
  const lpw = P ? 470 : 470, lph = P ? 60 : 56, lpx = v.x + 22, lpy = v.y + h - lph - 18;
  svg('rect', { x: lpx, y: lpy, width: lpw, height: lph, fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 1.6 }, legend);
  const lt = engravedText(legend, N.defs, { id: `${id}-tl`, text: 'Nuclear torpedo · reconstruction', x: lpx + lpw / 2, y: lpy + lph * 0.7, size: P ? 36 : 34, italic: true, fill: PAL.ink, name: 'Legend: nuclear torpedo (RC)' });

  // ---- three serial stamps
  const boxes = G.boxes.map((b, i) => {
    const g = svg('g', { 'data-name': `Vote box ${i + 1}` }, N.front);
    svg('rect', { x: b.x, y: b.y, width: b.w, height: b.h, fill: 'none', stroke: PAL.ink, 'stroke-width': 2 }, g);
    svg('rect', { x: b.x + 7, y: b.y + 7, width: b.w - 14, height: b.h - 14, fill: 'none', stroke: PAL.ink, 'stroke-width': 0.7 }, g);
    const num = svg('text', { x: b.x + b.w - 22, y: b.y + 50, 'text-anchor': 'end', 'font-family': FONT.num, 'font-weight': 800, 'font-size': 38, 'letter-spacing': 3, fill: PAL.red, 'data-name': `Serial stamp Nº 00${i + 1}`, style: 'font-variant-numeric:tabular-nums' }, g);
    num.textContent = `Nº 00${i + 1}`;
    const role = svg('text', { x: b.x + 24, y: b.y + 50, 'font-family': FONT.serif, 'font-style': 'italic', 'font-size': P ? 38 : 36, fill: PAL.ink, 'data-name': `Role ${i + 1}` }, g);
    role.textContent = ROLES[i];
    let stamp = null;
    if (i < 2) {
      const sx = P ? b.x + b.w * 0.72 : b.x + b.w / 2, sy = P ? b.y + b.h * 0.62 : b.y + b.h * 0.62;
      stamp = svg('g', { 'data-name': `YES stamp ${i + 1}` }, g);
      const inner = svg('g', {}, stamp);
      svg('rect', { x: -112, y: -54, width: 224, height: 108, rx: 6, fill: 'none', stroke: PAL.ink, 'stroke-width': 5 }, inner);
      svg('rect', { x: -102, y: -44, width: 204, height: 88, rx: 3, fill: 'none', stroke: PAL.ink, 'stroke-width': 1.4 }, inner);
      const yt = svg('text', { x: 0, y: 29, 'text-anchor': 'middle', 'font-family': FONT.num, 'font-weight': 800, 'font-size': 84, 'letter-spacing': 10, fill: PAL.ink }, inner);
      yt.textContent = 'YES';
      stamp.dataset.cx = sx; stamp.dataset.cy = sy; stamp.dataset.rot = i ? 3.5 : -4;
    }
    return { b, g, num, role, stamp };
  });
  // box 3: the name (engraved) + the NO (red overprint + perforation)
  const b3 = G.boxes[2];
  const nameX = P ? b3.x + 26 : b3.x + 26, nameY = P ? b3.y + 128 : b3.y + 122;
  const name = engravedText(boxes[2].g, N.defs, { id: `${id}-name`, text: 'Vasili Arkhipov', x: nameX, y: nameY, size: P ? 60 : 56, anchor: 'start', fill: PAL.ink, name: 'Name: Vasili Arkhipov' });
  const noC = P ? { x: b3.x + b3.w * 0.78, y: b3.y + b3.h * 0.63, hh: 138 } : { x: b3.x + b3.w * 0.5, y: b3.y + b3.h * 0.7, hh: 134 };
  const noG = svg('g', { 'data-name': 'NO (red overprint + perforation)' }, N.front);
  // The NO is rasterised once (3× for zoom) so the red overprint and the punched holes come from the same glyphs.
  const fs = noC.hh * 1.38, ls = noC.hh * 0.12, SC = 3;
  const OW = Math.ceil(fs * 2.2), OH = Math.ceil(fs * 1.05);
  const oc = document.createElement('canvas'); oc.width = OW * SC; oc.height = OH * SC;
  const og = oc.getContext('2d');
  og.scale(SC, SC);
  og.font = `800 ${fs}px ${FONT.num}`; og.letterSpacing = `${ls}px`; og.textAlign = 'center'; og.fillStyle = PAL.red;
  const bx = OW / 2 + ls / 2, by = OH * 0.9;
  og.fillText('NO', bx, by);
  const od = og.getImageData(0, 0, oc.width, oc.height).data;
  const inside = (x, y) => { x = Math.round(x * SC); y = Math.round(y * SC); return x >= 0 && y >= 0 && x < oc.width && y < oc.height && od[(y * oc.width + x) * 4 + 3] > 128; };
  const ix = noC.x - OW / 2, iy = noC.y - OH / 2;          // note position of the raster
  svg('image', { href: oc.toDataURL('image/png'), x: ix + 4, y: iy - 3, width: OW, height: OH, style: 'mix-blend-mode:multiply', 'data-name': 'NO red overprint' }, noG);
  const holeG = svg('g', { 'data-name': 'Perforation holes' }, noG);
  const step = 11, hr = 3.9;
  for (let j = 0, y = 3; y < OH - 3; y += step * 0.866, j++) {
    for (let x = 3 + (j % 2) * step / 2; x < OW - 3; x += step) {
      let ok = inside(x, y);
      for (let k = 0; ok && k < 8; k++) { const a2 = (k / 8) * Math.PI * 2; ok = inside(x + Math.cos(a2) * (hr + 1.6), y + Math.sin(a2) * (hr + 1.6)); }
      if (!ok) continue;
      const hx = ix + x, hy = iy + y;
      svg('circle', { cx: hx.toFixed(1), cy: hy.toFixed(1), r: hr, fill: PAL.hole }, holeG);
      svg('path', { d: `M${(hx - hr * 0.88).toFixed(1)} ${(hy + hr * 0.45).toFixed(1)}a${hr} ${hr} 0 0 0 ${(hr * 1.6).toFixed(1)} ${(hr * 0.35).toFixed(1)}`, fill: 'none', stroke: 'rgba(238,234,217,0.45)', 'stroke-width': 0.7 }, holeG);
    }
  }
  const hon = svg('text', { x: G.legend.x, y: G.legend.y, 'text-anchor': 'middle', 'font-family': FONT.serif, 'font-style': 'italic', 'font-size': G.legend.size, fill: PAL.ink, 'data-name': 'Honesty line' }, N.front);
  hon.textContent = 'The vote as told in later accounts; details differ';

  // ---- camera
  const F = P ? {
    A: { x: 450, y: 330, z: 1.3 }, B: { x: 450, y: 1070, z: 1.3 }, C: { x: 450, y: b3.y + b3.h / 2, z: 1.24 }, D: { x: 450, y: 760, z: 1.0 },
  } : {
    A: { x: 720, y: 400, z: 1.36 }, B: { x: 820, y: 452, z: 1.18 }, C: { x: 1246, y: 620, z: 2.4 }, D: { x: 820, y: 430, z: 1.0 },
  };
  const keys = [[0, F.A], [16.15, F.B, 0.95], [19.95, F.C, 0.95], [22.75, F.D, 1.25]];

  return {
    N,
    update(T) {
      let c = camPath(T, keys);
      const creep = T < 16.15 ? (T - 13.3) * 0.01 : T < 19.95 ? (T - 17.1) * 0.006 : T < 22.75 ? (T - 20.9) * 0.008 : (T - 24) * 0.004;
      c = { ...c, z: c.z * (1 + Math.max(0, creep)) };
      // the punch jolts the sheet (noise-free decaying offset, one direction then settle)
      const pj = T > TV.no ? 4 * Math.exp(-(T - TV.no) * 9) * Math.sin((T - TV.no) * 40) : 0;
      N.setCam({ x: c.x, y: c.y - pj, z: c.z });
      N.begin();
      const a = ss(TV.torp, TV.torp + 0.5, T);
      E.draw(N.ink, v.x, v.y, { tone: (x, y) => torpTone(x, y, a), vis: burin(T, TV.engr, 1.0, { lag: 0.4 }) });
      N.end();
      ros.draw(1);
      lt.reveal((T - TV.torp - 0.3) / 0.6);
      boxes.forEach((B, i) => {
        const p = clamp((T - TV.nums - i * 0.1) / 0.12);
        B.num.style.opacity = p;
        if (B.stamp) {
          const ts = i ? TV.yes2 : TV.yes1, k = T - ts;
          const sp = k <= 0 ? 0 : spring(k, springs.snappy);
          const sc = 1 + (1 - sp) * 0.18;
          B.stamp.style.opacity = k <= 0 ? 0 : clamp(k / 0.05);
          B.stamp.setAttribute('transform', `translate(${B.stamp.dataset.cx} ${B.stamp.dataset.cy}) rotate(${B.stamp.dataset.rot}) scale(${sc.toFixed(4)})`);
        }
      });
      name.reveal((T - TV.name) / 1.0);
      noG.style.opacity = T >= TV.no ? 1 : 0;
      // year wheels: 9→0 then 6→7→8→9→0
      const p1 = ss(TV.roll, TV.roll + 0.35, T), p2 = ss(TV.roll + 0.12, TV.roll + 0.85, T);
      cols[0].g.setAttribute('transform', `translate(0 ${(-p1 * gap).toFixed(2)})`);
      cols[1].g.setAttribute('transform', `translate(0 ${(-p1 * gap).toFixed(2)})`);
      cols[2].g.setAttribute('transform', `translate(0 ${(-p2 * 4 * gap).toFixed(2)})`);
      // hide wheel digits that are outside the cartouche window (they are clipped anyway; keeps the layout lint honest)
      [[cols[0], p1], [cols[1], p1], [cols[2], p2 * 4]].forEach(([col, off]) => [...col.g.children].forEach((d, k) => { d.style.display = Math.abs(k - off) < 0.999 ? '' : 'none'; }));
    },
  };
}
