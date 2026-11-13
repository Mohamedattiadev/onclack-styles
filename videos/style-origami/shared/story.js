// FOLDED PAPER — the whole 26 s beat as ONE table of folded sheets, a pure function of global time T.
// Every scene module builds this world and shows it at ctx.start + t, so cuts never break continuity:
// scene 2 re-folds the sheets of scene 1, scene 3 unfolds the submarine into the deck, scene 4 folds the red sheet.
//
// Beat table (voice times from words.json):
//  s1 0–7.2   hook/establish · KNOW 27 Oct 1962, a sub deep near Cuba · FEEL quiet dread · SEE the slate-blue sheet
//             pleating into a sea surface while a kraft submarine folds up low in the deep (section on the table).
//  s2 7.2–13.3 rising · KNOW US ships drop practice charges, no word from Moscow · FEEL pressure · SEE three folded
//             charges tumbling down to the sub, the sea jolts; the MOSCOW card falls face-down (silence).
//  s3 13.3–19.7 crisis · KNOW nuclear torpedo, 3 officers must agree, 2 yes · FEEL dread · SEE the sub unfolds into
//             the deck; torpedo ridge; three folded figures; two YES markers flip open.
//  s4 19.7–25.9 peak → resolution · KNOW Arkhipov said no; known ~40 years later · FEEL relief/awe · SEE the only red
//             sheet turns up and snaps into a stop-sign octagon: NO. Then a folded strip opens to his name.
// Truth: all RC/VO (schematic reconstruction on a table: no real shapes, no faces). Sub/ships are generic silhouettes.
import { makeWorld, PAL, M, foldAt, springs, track, print } from './fold.js';
import { svg, clamp, progress, ease, glide, smootherstep } from '/onclack-styles/engine/lib/anim.js';

export const T_ = {
  date: 0.45, dateDown: 7.15, subUp: 3.72, pleat: 5.3, cuba: 6.22,
  shipsIn: 7.42, shipsUp: 7.98, drops: [9.25, 9.55, 9.88], hits: [10.5, 10.92, 11.32],
  moscowIn: 10.48, moscowUp: 10.9, moscowFall: 11.98,
  subFlat: 13.05, torpedo: 14.12, figs: [16.42, 16.56, 16.7], yes: [18.24, 18.5],
  third: 20.12, redIn: 20.1, redScore: 20.55, redUp: 21.62, corners: 22.02, nameIn: 22.4, nameOpen: 22.9, year: 24.08,
};

function layout(portrait) {
  const Y = portrait ? 330 : 200, SX = portrait ? 0 : 110;
  return portrait ? {
    hw: 460, top: -420, bodyTop: -240, bottom: 520, Y, SX,
    date: [-155, -700], cuba: [-300, -330], ships: [-150, 190], shipY: -332, moscow: [110, -560],
    hits: [[-330, Y - 60], [20, Y - 330], [320, Y - 70]],
    figY: Y - 96, red: [SX + 215, Y + 100], name: [-400, Y + 78], year: [-400, Y + 190],
    cams: [
      [0, 0, { x: 35, y: -650, z: 45, s: 1.45, tilt: 58, yaw: -16 }],
      [2.0, 3.8, { x: 0, y: -40, z: 0, s: 1.3, tilt: 50, yaw: 0 }],
      [7.2, 8.3, { x: 20, y: -30, z: 0, s: 1.5, tilt: 53 }],
      [12.9, 14.3, { x: SX, y: Y - 95, z: 35, s: 2.15, tilt: 56 }],
      [19.85, 20.9, { x: SX + 120, y: Y - 50, z: 55, s: 1.6, tilt: 54 }],
      [22.5, 23.7, { x: 0, y: Y - 40, z: 20, s: 1.15, tilt: 44 }],
    ],
  } : {
    hw: 700, top: -400, bodyTop: -220, bottom: 360, Y, SX,
    date: [380, -650], cuba: [-520, -310], ships: [-80, 300], shipY: -312, moscow: [460, -440],
    hits: [[SX - 345, Y - 40], [SX + 30, Y - 300], [SX + 330, Y - 60]],
    figY: Y - 96, red: [SX + 262, Y + 100], name: [SX - 480, Y + 78], year: [SX - 690, Y + 112],
    cams: [
      [0, 0, { x: 575, y: -600, z: 45, s: 1.5, tilt: 58, yaw: -16 }],
      [2.0, 3.8, { x: 20, y: -50, z: 0, s: 1.1, tilt: 48, yaw: 0 }],
      [7.2, 8.3, { x: 70, y: -70, z: 0, s: 1.28, tilt: 50 }],
      [12.9, 14.3, { x: SX, y: Y - 85, z: 35, s: 2.85, tilt: 56 }],
      [19.85, 20.9, { x: SX + 190, y: Y - 25, z: 55, s: 2.2, tilt: 54 }],
      [22.5, 23.7, { x: SX - 150, y: Y - 5, z: 20, s: 1.5, tilt: 50 }],
    ],
  };
}

/** Camera: glides between framings (camera token: smootherstep), slow creep in every hold. */
function camAt(L, T) {
  let c = { ...L.cams[0][2] }, lastEnd = 0;
  for (let i = 1; i < L.cams.length; i++) {
    const [t0, t1, k] = L.cams[i];
    if (T <= t0) break;
    const p = smootherstep((T - t0) / (t1 - t0));
    for (const key of Object.keys(k)) c[key] = c[key] + (k[key] - c[key]) * p;
    lastEnd = t1;
  }
  c.s *= 1 + 0.0045 * Math.max(0, T - lastEnd);
  return c;
}

const pulse = (T, hits, amp, f = 21, d = 5.5) => hits.reduce((s, h) => s + (T > h ? amp * Math.exp(-(T - h) * d) * Math.sin((T - h) * f) : 0), 0);

export function buildStory(root, ctx) {
  const L = layout(ctx.layout.portrait);
  const W = makeWorld(root, ctx, { region: [-2800, -3600, 5600, 5200] });
  const { hw, top, bodyTop, bottom, Y, SX } = L;

  // ---- SEA: slate-blue sheet (the deep) + a long slate strip that zig-zag pleats into the surface (∧∧∧) ----
  W.add({
    name: 'Sea (slate sheet)', color: PAL.slate, back: PAL.back, z: 0.3, place: () => ({ x: 0, y: 0 }),
    faces: [{ id: 'deep', poly: [[-hw, bodyTop], [hw, bodyTop], [hw, bottom], [-hw, bottom]] }],
    art(g) { print(g, 'SECTION · NOT TO SCALE', -hw + 30, bodyTop + 44, { size: 17, weight: 500, fill: 'rgba(241,236,225,0.55)', anchor: 'start', track: 0.14 }); },
  });
  const pw0 = 46, pa = 44, side = 21, sd = 74;          // panel width, pleat angle, panels each side of the centre, strip depth
  const sy0 = bodyTop - sd - 4;                        // strip lies just above the deep sheet
  const ang = (T, i) => pa * foldAt(T, T_.pleat + Math.abs(i) * 0.014, 1, springs.default) + pulse(T + Math.abs(i) * 0.01, T_.hits, 6);
  const pitch = (T, i) => (Math.abs(i) % 2 ? -1 : 1) * ang(T, i);  // + = rising to the right
  const surfFaces = [{ id: 'wave 0', poly: [[0, 0], [pw0, 0], [pw0, sd], [0, sd]], hinge: [[0, 0], [0, sd]], angle: T => pitch(T, 0) }];
  for (let k = 1; k <= side; k++) {
    const xr = pw0 * k, xl = -pw0 * (k - 1);
    surfFaces.push({ id: `wave ${k}`, parent: `wave ${k - 1}`, poly: [[xr, 0], [xr + pw0, 0], [xr + pw0, sd], [xr, sd]], hinge: [[xr, 0], [xr, sd]],
      kind: k % 2 ? 'mountain' : 'valley', score: [T_.pleat - 1.0 + k * 0.03, T_.pleat - 0.86 + k * 0.03], angle: T => pitch(T, k) - pitch(T, k - 1) });
    surfFaces.push({ id: `wave -${k}`, parent: k === 1 ? 'wave 0' : `wave -${k - 1}`, poly: [[xl - pw0, 0], [xl, 0], [xl, sd], [xl - pw0, sd]], hinge: [[xl, 0], [xl, sd]],
      kind: k % 2 ? 'valley' : 'mountain', score: [T_.pleat - 1.0 + k * 0.03, T_.pleat - 0.86 + k * 0.03], angle: T => -(pitch(T, -k) - pitch(T, -(k - 1))) });
  }
  W.add({
    name: 'Sea surface (pleated strip)', color: PAL.slate, back: PAL.back, z: 0.35, faces: surfFaces,
    // keep the pleated strip centred on the sheet while it shortens
    place: T => ({ x: -pw0 * Math.cos(ang(T, 0) * Math.PI / 180) / 2, y: sy0 }),
  });

  // ---- DATE: off-white tent card ----
  const dateA = T => track(T, [[0, 0], [T_.date, 64], [T_.dateDown, 0]], springs.default);
  W.add({
    name: 'Date tent card', color: PAL.paper, back: PAL.paper, z: 0.6, visible: T => T < T_.dateDown + 1.0, place: T => ({ x: L.date[0] + 1300 * ease.inOutCubic(progress(T, T_.dateDown + 0.35, T_.dateDown + 0.95)), y: L.date[1] }),
    faces: [
      { id: 'front', poly: [[0, 0], [380, 0], [380, 132], [0, 132]], hinge: [[0, 132], [380, 132]], angle: dateA },
      { id: 'back', parent: 'front', poly: [[0, -132], [380, -132], [380, 0], [0, 0]], hinge: [[0, 0], [380, 0]], score: [0.02, 0.4],
        angle: T => -2 * dateA(T) },
    ],
    art(g, f) {
      if (f.id !== 'front') return;
      print(g, '27 OCTOBER', 190, 58, { size: 44, track: 0.1 });
      print(g, '1962', 190, 112, { size: 52, weight: 500, track: 0.18 });
    },
  });

  // ---- CUBA: kraft island standing at the surface, a ridge crease down the middle ----
  W.add({
    name: 'Cuba (kraft)', color: PAL.kraft, back: PAL.kraft, z: 0.5, place: () => ({ x: L.cuba[0], y: L.cuba[1] }),
    visible: T => T > T_.cuba - 0.5,
    faces: [
      { id: 'west', poly: [[-171.1, 0.0], [0.0, 0.0], [0.0, -142.1], [-49.3, -130.5], [-110.2, -84.1], [-150.8, -37.7]], hinge: [[-171.1, 0.0], [0.0, 0.0]],
        angle: T => track(T, [[0, 0], [T_.cuba, 94], [T_.subFlat - 0.1, 0]], springs.default) },
      { id: 'east', parent: 'west', poly: [[0.0, 0.0], [185.6, 0.0], [159.5, -34.8], [104.4, -72.5], [43.5, -121.8], [0.0, -142.1]], hinge: [[0.0, 0.0], [0.0, -142.1]],
        kind: 'mountain', score: [T_.cuba - 0.45, T_.cuba - 0.1], angle: T => track(T, [[0, 0], [T_.cuba + 0.12, -38], [T_.subFlat - 0.15, 0]], springs.default) },
    ],
    art(g) { print(g, 'CUBA', 4, -40, { size: 40, track: 0.18 }); },
  });

  // ---- SUBMARINE: kraft, stands up deep in the sea (bow to the left, toward Cuba) ----
  const subStand = T => track(T, [[0, 0], [T_.subUp, 95], [T_.subFlat, 0]], springs.default);
  W.add({
    name: 'Submarine B-59 (kraft)', color: PAL.kraft, back: PAL.kraft, z: 0.8, place: T => ({ x: SX, y: Y, m: M.Rz(pulse(T, T_.hits, 0.6, 17, 4)) }),
    visible: T => T > 0.0,
    faces: [
      { id: 'lower hull', poly: [[-239.1, -48.8], [-212.3, -22.0], [-170.8, 0.0], [183.0, 0.0], [226.9, -26.8], [241.6, -48.8]], hinge: [[-170.8, 0.0], [183.0, 0.0]],
        angle: T => subStand(T) + pulse(T, T_.hits, 3) },
      { id: 'upper hull', parent: 'lower hull', poly: [[-239.1, -48.8], [241.6, -48.8], [214.7, -75.6], [158.6, -95.2], [-146.4, -95.2], [-209.8, -75.6]],
        hinge: [[-239.1, -48.8], [241.6, -48.8]], kind: 'mountain', score: [3.0, 3.5],
        angle: T => track(T, [[0.0, 0.0], [T_.subUp + 0.22, -34], [T_.subFlat - 0.05, 0]], springs.default) },
      { id: 'sail', parent: 'upper hull', poly: [[-12.2, -95.2], [78.1, -95.2], [63.4, -148.8], [7.3, -148.8]], hinge: [[-12.2, -95.2], [78.1, -95.2]], score: [3.2, 3.6],
        angle: T => track(T, [[0.0, 0.0], [T_.subUp + 0.36, 36], [T_.subFlat - 0.1, 0]], springs.snappy) },
    ],
    art(g, f) {
      if (f.id === 'lower hull') print(g, 'B-59', 50, -15, { size: 30, track: 0.12, fill: 'rgba(38,39,42,0.85)' });
    },
  });

  // ---- US SHIPS: off-white, slide in, fold up behind the pleats (the surface) ----
  L.ships.forEach((sx, k) => {
    const up = T_.shipsUp + k * 0.16;
    W.add({
      name: `US ship ${k + 1}`, color: PAL.paper, back: PAL.paper, z: 0.5,
      visible: T => T > T_.shipsIn - 0.1,
      place: T => ({ x: sx + 4 * k, y: L.shipY - 420 * (1 - ease.outCubic(progress(T, T_.shipsIn + k * 0.08, T_.shipsIn + 0.5 + k * 0.08))) }),
      faces: [
        { id: 'hull', poly: [[-118.4, 0.0], [105.6, 0.0], [144.0, -38.4], [-137.6, -38.4]], hinge: [[-118.4, 0.0], [105.6, 0.0]], angle: T => 93 * foldAt(T, up, 1) + pulse(T, T_.drops, 2.5, 18, 4) },
        { id: 'deckhouse', parent: 'hull', poly: [[-70.4, -38.4], [57.6, -38.4], [48.0, -64.0], [14.4, -64.0], [9.6, -102.4], [3.2, -102.4], [0.0, -64.0], [-32.0, -64.0], [-36.8, -81.6], [-48.0, -81.6], [-52.8, -64.0], [-64.0, -64.0]],
          hinge: [[-70.4, -38.4], [57.6, -38.4]], kind: 'mountain', score: [up - 0.3, up], angle: T => -10 * foldAt(T, up + 0.12, 1) },
      ],
    });
  });

  // ---- DEPTH CHARGES: hexagonal paper barrels, rolled at the stern, tumble down to the sub, unroll on impact ----
  T_.drops.forEach((t0, k) => {
    const hit = T_.hits[k];
    const ship = L.ships[k === 2 ? 1 : 0] + (k === 1 ? 60 : -50);
    const [ix, iy] = L.hits[k];
    const roll = T => (T < hit ? spring01(T - t0, springs.snappy) : 1 - spring01(T - hit - 0.04, springs.snappy));
    const faces = [];
    const st = 16, hw2 = 21;
    for (let i = 0; i < 6; i++) faces.push({ id: `stave ${i + 1}`, parent: i ? `stave ${i}` : undefined, poly: [[-hw2, st * i], [hw2, st * i], [hw2, st * i + st], [-hw2, st * i + st]],
      hinge: i ? [[-hw2, st * i], [hw2, st * i]] : undefined, angle: i ? (T => 60 * roll(T)) : undefined });
    W.add({
      name: `Depth charge ${k + 1}`, color: PAL.paper, back: '#E4DFD3', z: 0.7, visible: T => T > t0 - 0.03 && T < 13.4,
      place(T) {
        const u = progress(T, t0 + 0.22, hit);
        const p = ease.inOutSine(u);
        const r = roll(T);
        const sweep = ease.inCubic(progress(T, 12.7 + k * 0.05, 13.3 + k * 0.05));
        const x = ship + (ix - ship) * p, y = L.shipY + 14 + (iy - L.shipY - 14) * p + 1100 * sweep;
        const z = T < hit ? 30 * (1 - p) + 18 * r : 0.4;
        const spin = 720 * ease.inOutSine(u);
        return { x, y, z, rot: 8 * (k - 1), m: M.mul(M.Rx(spin), M.T(0, -8 * r, -13.86 * r)) };
      },
      faces,
      art(g) { for (const x of [-12, 12]) svg('line', { x1: x, x2: x, y1: 0, y2: 96, stroke: PAL.ink, 'stroke-width': 2.4, opacity: 0.8 }, g); },
    });
  });
  // impact marks: dashed rings (origami-diagram "burst" notation) printed onto the sea for a moment
  const rings = T_.hits.map((h, k) => [0, 1].map(j => svg('circle', { cx: L.hits[k][0], cy: L.hits[k][1], r: 1, fill: 'none', stroke: 'rgba(241,236,225,0.9)', 'stroke-width': 2.4, 'stroke-dasharray': '9 6' }, W.overlay)));

  // ---- MOSCOW: L-stand card, falls face-down at "silent" ----
  W.add({
    name: 'Moscow card', color: PAL.paper, back: PAL.paper, z: 0.6, visible: T => T > T_.moscowIn - 0.05,
    place: T => ({ x: L.moscow[0] + 700 * (1 - ease.outCubic(progress(T, T_.moscowIn, T_.moscowIn + 0.42))), y: L.moscow[1] }),
    faces: [
      { id: 'foot', poly: [[0, 0], [214, 0], [214, 40], [0, 40]] },
      { id: 'face', parent: 'foot', poly: [[0, -92], [214, -92], [214, 0], [0, 0]], hinge: [[0, 0], [214, 0]], score: [T_.moscowIn + 0.2, T_.moscowUp],
        angle: T => track(T, [[0, 0], [T_.moscowUp, 92], [T_.moscowFall, 178]], springs.default) },
    ],
    art(g, f) {
      if (f.id !== 'face') return;
      print(g, 'MOSCOW', 107, -40, { size: 38, track: 0.14 });
      svg('line', { x1: 40, x2: 174, y1: -24, y2: -24, stroke: PAL.ink, 'stroke-width': 2, 'stroke-dasharray': '3 7', opacity: 0.7 }, g);
    },
  });

  // ---- TORPEDO: off-white ridge on the unfolded sub deck ----
  W.add({
    name: 'Nuclear torpedo', color: PAL.paper, back: PAL.paper, z: 1.2, visible: T => T > T_.subFlat + 0.3,
    place: T => ({ x: SX + 10 + 300 * (1 - ease.outCubic(progress(T, T_.subFlat + 0.3, T_.torpedo - 0.05))), y: Y - 6 }),
    faces: [
      { id: 'near side', poly: [[-130, 0], [124, 0], [124, -24], [-150, -24]].map(([x, y]) => [x, y]), hinge: [[-130, 0], [124, 0]],
        angle: T => 40 * foldAt(T, T_.torpedo, 1) },
      { id: 'far side', parent: 'near side', poly: [[-150, -24], [124, -24], [124, -48], [-130, -48]], hinge: [[-150, -24], [124, -24]], kind: 'mountain',
        score: [T_.torpedo - 0.5, T_.torpedo - 0.05], angle: T => -80 * foldAt(T, T_.torpedo, 1) },
    ],
    art(g, f) {
      if (f.id === 'near side') print(g, 'NUCLEAR TORPEDO', -6, -6, { size: 17, track: 0.16 });
    },
  });

  // ---- THREE OFFICERS: folded figures, no faces; one YES marker each (third stays closed) ----
  [-130, 0, 130].forEach((dx, k) => {
    const up = T_.figs[k];
    W.add({
      name: `Officer ${k + 1}`, color: PAL.paper, back: PAL.paper, z: 1.4, visible: T => T > T_.subFlat + 0.4,
      place: T => ({ x: SX + dx, y: L.figY + 40 * (1 - ease.outCubic(progress(T, up - 0.6, up))) + (k === 2 ? 30 * foldAt(T, T_.third, 1, springs.gentle) : 0) }),
      faces: [
        { id: 'left', poly: [[-34.8, 0.0], [0.0, 0.0], [0.0, -122], [-15, -104], [-7.5, -86], [-21.8, -81.2], [-34.8, -65.2]], hinge: [[-34.8, 0.0], [0.0, 0.0]], angle: T => 96 * foldAt(T, up, 1) },
        { id: 'right', parent: 'left', poly: [[0.0, 0.0], [34.8, 0.0], [34.8, -65.2], [21.8, -81.2], [7.5, -86], [15, -104], [0.0, -122]], hinge: [[0.0, 0.0], [0.0, -122]], kind: 'mountain',
          score: [up - 0.5, up - 0.1], angle: T => -42 * foldAt(T, up + 0.1, 1) },
      ],
      art(g, f) { if (f.id === 'left') print(g, String(k + 1), -17, -34, { size: 24, weight: 500, fill: 'rgba(38,39,42,0.75)' }); },
    });
    if (k === 2) return;
    const yt = T_.yes[k];
    W.add({
      name: `YES marker ${k + 1}`, color: PAL.paper, back: '#E6E1D5', z: 1.6, visible: T => T > T_.subFlat + 0.4,
      place: T => ({ x: SX + dx - 30, y: L.figY + 14 + 40 * (1 - ease.outCubic(progress(T, up - 0.55, up + 0.05))) }),
      faces: [
        { id: 'a', poly: [[0, 0], [60, 0], [60, 26], [0, 26]], hinge: [[0, 26], [60, 26]], angle: T => 62 * foldAt(T, yt, 1, springs.default) },
        { id: 'b', parent: 'a', poly: [[0, -26], [60, -26], [60, 0], [0, 0]], hinge: [[0, 0], [60, 0]], score: [up + 0.3, up + 0.7], creaseFade: yt,
          angle: T => foldAt(T, yt - 0.02, -124, springs.default, 176) },
      ],
      art(g, f) { if (f.id === 'a') print(g, 'YES', 30, 20, { size: 19, track: 0.14 }); },
    });
  });

  // ---- RED: the only red sheet. Arrives face-down (white), turns up at "says", snaps into an octagon on "no" ----
  const S = 156, leg = S * 0.2929;
  const redUp = T => track(T, [[0, 179], [T_.redUp, 93]], { stiffness: 150, damping: 21 });
  const corner = (id, a, b, c, i) => ({ id, parent: 'octagon', poly: [a, b, c], hinge: [b, c], kind: 'mountain', score: [T_.redScore + i * 0.14, T_.redScore + 0.4 + i * 0.14], creaseFade: T_.corners + i * 0.06,
    angle: T => -168 * foldAt(T, T_.corners + i * 0.06, 1, springs.snappy) });
  const h = S / 2;
  W.add({
    name: 'Red sheet (NO)', color: PAL.red, back: PAL.back, z: 2, visible: T => T > T_.redIn - 0.05,
    place: T => ({ x: L.red[0], y: L.red[1] + 760 * (1 - ease.outCubic(progress(T, T_.redIn, T_.redIn + 0.5))), rot: 12 * foldAt(T, 22.6, 1, springs.gentle) }),
    faces: [
      { id: 'octagon', poly: [[-h + leg, -S], [h - leg, -S], [h, -S + leg], [h, -leg], [h - leg, 0], [-h + leg, 0], [-h, -leg], [-h, -S + leg]],
        hinge: [[-h + leg, 0], [h - leg, 0]], angle: redUp },
      corner('corner NW', [-h, -S], [-h + leg, -S], [-h, -S + leg], 0),
      corner('corner NE', [h, -S], [h, -S + leg], [h - leg, -S], 1),
      corner('corner SE', [h, 0], [h - leg, 0], [h, -leg], 2),
      corner('corner SW', [-h, 0], [-h, -leg], [-h + leg, 0], 3),
    ],
    art(g, f) { if (f.id === 'octagon') print(g, 'NO', 0, -50, { size: 74, fill: PAL.inkLight, track: 0.08 }); },
  });

  // ---- NAME: off-white strip, accordion-collapsed, opens to the name ----
  const panels = 6, pw = 76, ph = 64, [nx, ny] = L.name;
  const nameFaces = [];
  for (let i = 0; i < panels; i++) {
    const x0 = nx + pw * i;
    nameFaces.push({ id: `panel ${i + 1}`, parent: i ? `panel ${i}` : undefined, poly: [[x0, ny], [x0 + pw, ny], [x0 + pw, ny + ph], [x0, ny + ph]],
      hinge: i ? [[x0, ny], [x0, ny + ph]] : undefined, kind: i % 2 ? 'valley' : 'mountain', score: i ? [T_.nameIn, T_.nameIn + 0.01] : undefined,
      angle: i ? (T => (i % 2 ? 172 : -172) * (1 - foldAt(T, T_.nameOpen + i * 0.075, 1, springs.default))) : undefined });
  }
  W.add({
    name: 'Name strip', color: PAL.paper, back: '#E3DED2', z: 1.0, visible: T => T > T_.nameIn - 0.05, printBoth: false,
    place: T => ({ x: -620 * (1 - ease.outCubic(progress(T, T_.nameIn, T_.nameIn + 0.45))), y: 0 }),
    faces: nameFaces,
    art(g) {
      print(g, 'VASILI ARKHIPOV', nx + pw * panels / 2, ny + 38, { size: 37, track: 0.07 });
      print(g, '1926 – 1998', nx + pw * panels / 2, ny + 58, { size: 15, weight: 500, track: 0.2, fill: 'rgba(38,39,42,0.8)' });
    },
  });

  // ---- 2002: kraft card turned up on "forty years later" ----
  W.add({
    name: '2002 card', color: PAL.kraft, back: PAL.kraft, z: 1.0, visible: T => T > T_.nameIn - 0.05,
    place: T => ({ x: L.year[0] - 620 * (1 - ease.outCubic(progress(T, T_.nameIn + 0.06, T_.nameIn + 0.5))), y: L.year[1] }),
    faces: [
      { id: 'foot', poly: [[0, 0], [190, 0], [190, 34], [0, 34]] },
      { id: 'face', parent: 'foot', poly: [[0, -86], [190, -86], [190, 0], [0, 0]], hinge: [[0, 0], [190, 0]], angle: T => foldAt(T, T_.year, 92, springs.default, 178) },
    ],
    art(g, f) {
      if (f.id !== 'face') return;
      print(g, '2002', 95, -36, { size: 48, track: 0.1 });
      print(g, 'STORY WIDELY KNOWN', 95, -13, { size: 14, weight: 500, track: 0.12, fill: 'rgba(38,39,42,0.85)' });
    },
  });

  return {
    update(T) {
      const cam = camAt(L, T);
      // depth-charge hits: short decaying sway (≈ 9 Hz, no frame-by-frame flip), not a strobe
      const sh = T_.hits.reduce((s, h2, k) => s + (T > h2 && T < h2 + 0.5 ? (k === 1 ? 7 : 4.5) * Math.exp(-(T - h2) * 7) * Math.sin((T - h2) * 57) : 0), 0);
      W.update(T, cam, [sh * 0.6, sh]);
      rings.forEach((pair, k) => pair.forEach((c, j) => {
        const u = progress(T, T_.hits[k] + j * 0.1, T_.hits[k] + 0.75 + j * 0.1);
        c.setAttribute('r', (8 + 92 * ease.outCubic(u)).toFixed(1));
        c.setAttribute('opacity', (u > 0 && u < 1 ? 0.9 * (1 - u) : 0).toFixed(3));
      }));
    },
  };
}

function spring01(t, cfg) {
  if (t <= 0) return 0;
  const { stiffness: k, damping: c } = cfg, w0 = Math.sqrt(k), z = c / (2 * w0);
  if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

// ---- sound (no music): paper Foley for every fold + the story world under it (sea, booms, drips, a breath) ----
export const SOUNDS = [
  // beds (registered once by scene 1 or 3)
  { bed: 'sea-water-close-01', at: 0, to: 21.25, lu: -17 },
  { bed: 'drips-wood-01', at: 13.4, to: 21.2, lu: -24 },
  { bed: 'sea-wash-calm-01', at: 22.7, to: 25.9, lu: -21 },
  // paper
  { id: 'paper-crease-01', at: 0.05, lu: -19 },
  { id: 'paper-fold-03', at: T_.date + 0.02, lu: -12 },
  { id: 'paper-crease-03', at: 3.12, lu: -20 },
  { id: 'paper-fold-01', at: T_.subUp + 0.01, lu: -12 },
  { id: 'paper-crease-02', at: T_.subUp + 0.3, lu: -16 },
  { id: 'paper-fold-03', at: T_.pleat + 0.02, lu: -11 },
  { id: 'paper-fold-02', at: T_.cuba + 0.02, lu: -13 },
  { id: 'paper-fold-02', at: T_.dateDown + 0.02, lu: -16 },
  { id: 'paper-fold-04', at: T_.shipsIn, lu: -15 },
  { id: 'paper-crease-01', at: T_.shipsUp + 0.02, lu: -13 },
  { id: 'paper-crease-03', at: T_.drops[0] + 0.02, lu: -18 },
  { id: 'paper-crease-02', at: T_.drops[2] + 0.02, lu: -19 },
  { id: 'boom-distant-01', at: T_.hits[0] + 0.03, lu: -7 },
  { id: 'boom-slapback-01', at: T_.hits[1] + 0.03, lu: -8, duration: 2.6, fadeOut: 0.9 },
  { id: 'boom-distant-01', at: T_.hits[2] + 0.03, lu: -11 },
  { id: 'paper-fold-04', at: T_.moscowIn + 0.02, lu: -16 },
  { id: 'paper-crease-01', at: T_.moscowUp + 0.02, lu: -15 },
  { id: 'paper-fold-02', at: T_.moscowFall + 0.2, lu: -12 },
  { id: 'paper-fold-01', at: T_.subFlat + 0.02, lu: -13 },
  { id: 'paper-crease-02', at: T_.torpedo + 0.02, lu: -13 },
  { id: 'breath-close-01', at: 15.8, lu: -23, duration: 5.2, fadeIn: 0.6, fadeOut: 0.6 },
  { id: 'paper-fold-02', at: T_.figs[0] + 0.02, lu: -15 },
  { id: 'paper-crease-03', at: T_.figs[2] + 0.02, lu: -17 },
  { id: 'paper-crease-01', at: T_.yes[0] + 0.02, lu: -12 },
  { id: 'paper-crease-02', at: T_.yes[1] + 0.02, lu: -12 },
  { id: 'paper-fold-04', at: T_.redIn + 0.02, lu: -14 },
  { id: 'paper-crease-03', at: T_.redScore + 0.05, lu: -20 },
  { id: 'paper-fold-01', at: T_.redUp + 0.02, lu: -11 },
  { id: 'paper-crease-01', at: T_.corners + 0.03, lu: -10 },
  { id: 'paper-crease-02', at: T_.corners + 0.15, lu: -13 },
  { id: 'paper-fold-03', at: T_.nameOpen + 0.02, lu: -14 },
  { id: 'paper-fold-02', at: T_.year + 0.02, lu: -14 },
];
