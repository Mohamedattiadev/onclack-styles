// Spread 3 — THE VOTE: a cut-paper hull section with the torpedo inside (orange warhead), then three typed slips;
// two get an orange YES, the third stays blank (the open question, closed on the next spread).
// intent: KNOW one weapon, three keys, two yes · FEEL dread rising · SEE two orange YES next to one empty box.
// truth: hull + torpedo = VO (diagram, "not to scale"); slips = VO (our paste-up); roles/names from later accounts
//        (Savitsky, Maslennikov, Arkhipov) — debated details, to re-check with 2+ sources before public use.
import { glide } from '/onclack-styles/engine/lib/anim.js';
import { F, FONT, wordT, spread, furniture, columns, printed, jolt, text, measure, fitSize, pathFrom, cutPts, tornPts, pasteShadow, grey, rpm } from '../shared/riso.js';

export default async function (root, ctx) {
  const L = ctx.layout, u = L.unit, P = L.portrait;
  const sheet = spread(root, ctx, { seed: 13 });
  const C = columns(L);
  const fur = furniture(sheet.cam, sheet, L, { page: 6 });

  const tBoard = wordT(ctx, 'board', 0, 0.5) - 2 * F;
  const tNuclear = wordT(ctx, 'nuclear', 0, 1.15) - 2 * F;
  const tTorpedo = wordT(ctx, 'torpedo', 0, 1.55) - 2 * F;
  const tThree = wordT(ctx, 'three', 0, 3.18) - 2 * F;
  const tOfficers = wordT(ctx, 'officers', 0, 3.53) - 2 * F;
  const tAgree = wordT(ctx, 'agree', 0, 4.28) - 2 * F;
  const tTwo = wordT(ctx, 'Two', 0, 4.96) - 2 * F;
  const tSay = wordT(ctx, 'say', 0, 5.22) - 2 * F;
  const tYes = wordT(ctx, 'yes', 0, 5.47) - 2 * F;

  // ---- hull section (VO) with the torpedo
  const H = L.pick({
    landscape: { x: C.left.x - 10 * u, y: C.top + 230 * u, w: C.left.w + 20 * u, h: 330 * u },
    portrait: { x: C.left.x - 10 * u, y: C.top + 140 * u, w: C.left.w + 20 * u, h: 300 * u },
  });
  const hullPts = (() => {
    const w = H.w - 40 * u, h = 150 * u, x0 = 20 * u, y0 = H.h * 0.5 - h / 2 + 20 * u, pts = [];
    // a long cigar cut with scissors: straight segments around a rounded outline (bow left)
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const cx = Math.cos(a), sy = Math.sin(a);
      const ex = cx < 0 ? Math.sign(cx) * Math.pow(Math.abs(cx), 0.35) : Math.sign(cx) * Math.pow(Math.abs(cx), 0.22);
      pts.push([x0 + w / 2 + ex * w / 2 + rpm(91, i) * 3 * u, y0 + h / 2 + sy * h / 2 + rpm(92, i) * 3 * u]);
    }
    return pts;
  })();
  const hullPath = pathFrom(hullPts);
  const sail = pathFrom(cutPts(H.w * 0.42, H.h * 0.5 - 75 * u - 58 * u + 20 * u, H.w * 0.13, 64 * u, 93, u, 0.5));
  const hull = printed(sheet.cam, sheet, {
    name: '3A Hull section (diagram)', x: H.x, y: H.y, w: H.w, h: H.h, rot: -0.8, seed: 95,
    layers: [{ ink: 'teal', at: tBoard, dur: 8 * F, starve: 0.3, draw: g => {
      g.fillStyle = grey(0.85); g.fill(sail);
      g.fillStyle = grey(0.2); g.fill(hullPath);
      g.lineWidth = 6 * u; g.strokeStyle = grey(1); g.lineJoin = 'miter'; g.stroke(hullPath);
      // frames: hand-ruled bulkheads
      g.lineWidth = 2.5 * u; g.strokeStyle = grey(0.55);
      for (let i = 1; i < 7; i++) { const x = H.w * (0.12 + i * 0.11); g.beginPath(); g.moveTo(x, H.h * 0.5 - 50 * u); g.lineTo(x + 2 * u, H.h * 0.5 + 90 * u); g.stroke(); }
    } }],
  });
  // the torpedo: teal body, orange warhead (overprint → near-black where they meet)
  const T = { x: H.x + H.w * 0.07, y: H.y + H.h * 0.5 - 2 * u, w: H.w * 0.5, h: 60 * u };
  const torp = printed(sheet.cam, sheet, {
    name: '3A Nuclear torpedo', x: T.x, y: T.y, w: T.w, h: T.h + 4 * u, rot: -0.8, seed: 97,
    layers: [
      { ink: 'teal', at: tNuclear, draw: (g, w, h) => {
        g.fillStyle = grey(1);
        g.beginPath(); g.moveTo(w * 0.16, 4 * u); g.lineTo(w - 26 * u, 6 * u); g.lineTo(w - 4 * u, h / 2 - 14 * u); g.lineTo(w - 4 * u, h / 2 + 14 * u); g.lineTo(w - 26 * u, h - 6 * u); g.lineTo(w * 0.16, h - 4 * u); g.closePath(); g.fill();
      } },
      { ink: 'orange', at: tTorpedo, draw: (g, w, h) => {
        g.fillStyle = grey(1);
        g.beginPath(); g.moveTo(w * 0.22, 3 * u); g.lineTo(w * 0.07, 9 * u); g.lineTo(2 * u, h / 2); g.lineTo(w * 0.07, h - 9 * u); g.lineTo(w * 0.22, h - 3 * u); g.closePath(); g.fill();
      } },
    ],
  });
  const fType = { family: FONT.mono, size: L.pick({ landscape: 30, portrait: 28 }) * u, weight: 500 };
  const tl = ['ONE NUCLEAR TORPEDO.', 'diagram, not to scale'];
  const torpLab = printed(sheet.cam, sheet, {
    name: '3A Typed label torpedo', x: H.x + 24 * u, y: H.y + H.h + 6 * u, w: H.w * 0.9, h: 90 * u, seed: 99,
    layers: [{ ink: 'teal', at: tTorpedo + 4 * F, starve: 0.2, draw: g => { text(g, tl[0], 4 * u, 32 * u, fType, 1); text(g, tl[1], 4 * u, 72 * u, { ...fType, size: 22 * u }, 0.8); } }],
  });

  // ---- heading strip: THREE MUST AGREE (teal type on an orange cut strip)
  const R = L.pick({
    landscape: { x: C.right.x, w: C.right.w, y: C.top + 40 * u },
    portrait: { x: C.left.x, w: C.left.w, y: H.y + H.h + 120 * u },
  });
  const fHead = { family: FONT.cut, weight: 800, track: 0 };
  const hStr = 'THREE MUST AGREE';
  const hs = fitSize(hStr, fHead, R.w - 60 * u, 92 * u);
  const hm = measure(hStr, { ...fHead, size: hs });
  const hd = { w: hm.w + 44 * u, h: hm.asc + hm.desc + 34 * u };
  const head = printed(sheet.cam, sheet, {
    name: '3B Heading THREE MUST AGREE', x: R.x - 8 * u, y: R.y, w: hd.w + 10 * u, h: hd.h + 10 * u, rot: 1.3, seed: 101,
    layers: [
      { ink: 'teal', at: tThree, draw: g => text(g, hStr, 22 * u + 4 * u, 17 * u + hm.asc + 4 * u, { ...fHead, size: hs }) },
      { ink: 'orange', at: tAgree, gain: 0.5, starve: 0.5, draw: g => { g.fillStyle = grey(1); g.fill(pathFrom(cutPts(4 * u, 4 * u, hd.w, hd.h, 102, u))); } },
    ],
  });

  // ---- three slips (VO)
  const slips = [
    ['CAPTAIN', 'V. Savitsky'],
    ['POLITICAL OFFICER', 'I. Maslennikov'],
    ['BRIGADE CHIEF OF STAFF', ''],
  ];
  const sh = L.pick({ landscape: 150, portrait: 132 }) * u, gap = L.pick({ landscape: 34, portrait: 24 }) * u;
  const sw = R.w * L.pick({ landscape: 0.86, portrait: 0.9 });
  const y0 = R.y + hd.h + L.pick({ landscape: 56, portrait: 40 }) * u;
  const fRole = { family: FONT.mono, size: 24 * u, weight: 500, track: 2 * u };
  const fName = { family: FONT.mono, size: L.pick({ landscape: 34, portrait: 34 }) * u, weight: 500 };
  const fYes = { family: FONT.cut, weight: 800, size: 60 * u, track: 1 * u };
  const yesAt = [tTwo, tSay + 2 * F, -1];
  const slipItems = slips.map(([role, name], i) => {
    const x = R.x + (i % 2 ? 40 : 0) * u, y = y0 + i * (sh + gap);
    const path = pathFrom(cutPts(10 * u, 10 * u, sw - 20 * u, sh - 20 * u, 110 + i, u, 0.8));
    const blank = !name;
    return printed(sheet.cam, sheet, {
      name: `3C Slip ${i + 1} ${role}`, x, y, w: sw, h: sh, rot: [-1.4, 0.9, -0.5][i], seed: 113 + i,
      layers: [
        { ink: 'teal', at: tOfficers + i * 4 * F, starve: 0.25, draw: g => {
          pasteShadow(g, path, u, 0.6);
          text(g, `${i + 1}`, 30 * u, sh * 0.5 + 26 * u, { family: FONT.cut, weight: 800, size: 74 * u }, 1);
          text(g, role, 104 * u, 50 * u, fRole, 0.9);
          if (blank) {
            g.strokeStyle = grey(0.9); g.lineWidth = 3 * u; g.setLineDash([10 * u, 8 * u]);
            g.strokeRect(104 * u, 68 * u, sw * 0.42, sh - 100 * u);
          } else text(g, name, 104 * u, 102 * u, fName, 1);
        } },
        ...(blank ? [] : [{ ink: 'orange', at: yesAt[i], draw: g => {
          g.save(); g.translate(sw - 112 * u, sh * 0.52); g.rotate((-8 + 5 * i) * Math.PI / 180);
          g.strokeStyle = grey(1); g.lineWidth = 6 * u; g.strokeRect(-80 * u, -44 * u, 160 * u, 88 * u);
          text(g, 'YES', 0, 22 * u, fYes, 1, 'center');
          g.restore();
        } }]),
      ],
    });
  });

  const items = [hull, torp, torpLab, head, ...slipItems];
  const lands = items.flatMap(i => i.lands);
  sheet.cam.style.transformOrigin = L.pick({ landscape: '55% 50%', portrait: '50% 55%' });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration, lu: -27, fade: 0.6 });

  return {
    update(t) {
      fur.update(t);
      items.forEach(i => i.update(t));
      // camera: creep in, then truck right toward the slips as the vote starts (connect weapon → people)
      const s = 1.015 + 0.005 * t + glide(t, tThree - 6 * F, tYes + 10 * F, 0, 0.025);
      const tx = glide(t, tThree - 6 * F, tYes, 0, L.pick({ landscape: -16, portrait: 0 }) * u);
      const ty = glide(t, tThree - 6 * F, tYes, 0, L.pick({ landscape: 0, portrait: -40 }) * u);
      sheet.cam.style.transform = `translate(${tx.toFixed(2)}px, ${(ty + jolt(t, lands, 1.6 * u)).toFixed(2)}px) scale(${s.toFixed(5)})`;
    },
  };
}
