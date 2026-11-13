// Sheet 2 — the CARBON COPY (blue, soft): signal log typed live beside the clipped U.S. Navy photo of B-59.
// intent: KNOW U.S. ships above drop practice depth charges; Moscow silent · FEEL dread · SEE the photo + each boom jolting the typing
// truth: photo = EV (U.S. Navy, NARA, 28–29 Oct 1962, shown as itself, dated caption) · log = RC (labelled)
import { el } from '/onclack-styles/engine/lib/anim.js';
import { PAL, RUN, makeView, camAt, sheet, typed, placeRun, carriage, printed, rule, paperClip, strikeJolt, quake, stamp, slideIn } from '../shared/dossier.js';
import { BOOMS, STAMPS } from '../shared/plan.js';

export default function (root, ctx) {
  const L = ctx.layout, P = L.portrait;
  const V = makeView(root, ctx), Wd = V.world;
  const pg = sheet(Wd, { x: 0, y: 0, w: 2100, h: 2700, name: 'Carbon copy sheet (onion-skin)' });

  // carbon copies carry no printed form: the header is typed through the carbon too
  printed(pg, P ? 'Reconstruction — not an original document' : 'Reconstruction for illustration — not an original document', { x: P ? 90 : 120, y: 130, size: 30, color: PAL.red, opacity: 0.9, track: 0.1, name: 'Honesty label' });
  typed(pg, P ? 'SIGNAL LOG  27.X.62' : 'SIGNAL LOG - 27 OCT 1962', { x: P ? 90 : 120, y: 200, size: 48, ink: 'blue', carbon: true, seed: 21, name: 'Log header' });
  typed(pg, 'COPY 2/3', { x: P ? 90 : 1640, y: P ? 268 : 200, size: 40, ink: 'blue', carbon: true, seed: 22, name: 'Copy number' });
  rule(pg, { x: P ? 90 : 120, y: P ? 330 : 280, w: P ? 880 : 1860, h: 3, color: PAL.blue, opacity: 0.45, name: 'Typed underline' });

  // ---- photo print, clipped on
  const ph = P ? { x: 90, y: 380, w: 790, rot: -1.3 } : { x: 120, y: 380, w: 900, rot: -1.6 };
  ph.h = ph.w * (734 / 948);
  const B = 22;
  const print = el('div', { 'data-name': 'Photo print: B-59 surfaced (U.S. Navy, PD)', style: { position: 'absolute', left: ph.x + 'px', top: ph.y + 'px', width: ph.w + 2 * B + 'px', height: ph.h + 2 * B + 'px', zIndex: 3, background: '#F1EDE3', transform: `rotate(${ph.rot}deg)`, boxShadow: '0 2px 3px rgba(22,26,36,0.32), 14px 24px 42px rgba(22,26,36,0.26)' } }, Wd);
  el('img', { src: ctx.asset('assets/b59-surfaced-1962.jpg'), 'data-name': 'B-59 photo', style: { position: 'absolute', left: B + 'px', top: B + 'px', width: ph.w + 'px', height: ph.h + 'px', filter: 'grayscale(1) contrast(1.06) sepia(0.12)' } }, print);
  el('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 40%)' } }, print);
  paperClip(pg, Wd, { x: ph.x + ph.w * 0.18, y: ph.y - 74, len: 210, rot: ph.rot - 3, name: 'Paper clip (photo)' });
  const capY = ph.y + ph.h + 2 * B + 34;
  const slip = sheet(Wd, { x: ph.x + 16, y: capY, w: ph.w - 20, h: P ? 120 : 112, rot: ph.rot * 0.4, kind: 'slip', name: 'Caption slip (pasted)', z: 3, shadow: 0.4 });
  typed(slip, 'ENCL. 2  B-59 SURFACED, 28-29 OCT 62', { x: 22, y: 20, size: P ? 32 : 30, seed: 31, name: 'Caption line 1' });
  typed(slip, 'U.S. NAVY PHOTO - NARA 428-N-711200', { x: 22, y: P ? 66 : 62, size: P ? 26 : 26, seed: 32, name: 'Caption line 2 (source)' });

  // ---- the log, typed live through the carbon
  const R = P ? { over: [110, 1300], drop: [110, 1425], moscow: [110, 1550] } : { over: [1150, 560], drop: [1150, 720], moscow: [1150, 880] };
  const ids = ['over', 'drop', 'moscow'];
  const runs = ids.map(id => placeRun(pg, id, ...R[id]));
  const pos = carriage(runs);
  const st = stamp(pg, P
    ? { x: 500, y: 1160, w: 400, h: 130, lines: ['No reply'], color: PAL.blue, rot: -6, seed: 5, name: 'Stamp NO REPLY (blue)' }
    : { x: 1500, y: 1020, w: 460, h: 150, lines: ['No reply'], color: PAL.blue, rot: -6, seed: 5, name: 'Stamp NO REPLY (blue)' });

  // ---- sound
  ctx.sfx('dos-paper-slide', 0, { lu: -14 });
  ctx.ambience('sea-water-close-01', { from: 0, to: ctx.duration + 0.3, lu: -22, fade: 0.6 });
  ctx.sfx('boom-distant-01', BOOMS[0] - ctx.start, { lu: -9 });
  ctx.sfx('boom-distant-01', BOOMS[1] - ctx.start, { lu: -8 });
  ctx.sfx('dos-stamp', STAMPS.noReply - ctx.start - 0.07, { lu: -9 });

  const follow = (tg, s) => {
    let x = 0, y = 0; for (let k = 0; k < 12; k++) { const p = pos(tg - k * 0.03); x += p.x; y += p.y; } x /= 12; y /= 12;
    return P ? { x: 490 + 0.12 * (x - 110), y: 930 + 0.5 * (y - 1300) } : { x: 1010 + 0.04 * (x - 1150), y: 770 + 0.4 * (y - 560) };
  };
  const keys = P
    ? [{ t: 7.2, x: 480, y: 750, s: 1.0, follow: 0 }, { t: 7.9, x: 485, y: 810, s: 1.0, follow: 0.3 }, { t: 9.3, follow: 1, s: 1.0 }, { t: 12.6, follow: 1, s: 1.0 }, { t: 13.4, x: 520, y: 1090, s: 1.02, follow: 0 }]
    : [{ t: 7.2, x: 640, y: 700, s: 1.04, follow: 0 }, { t: 8.3, x: 1000, y: 770, s: 0.88, follow: 0.5 }, { t: 9.3, follow: 1, s: 0.88 }, { t: 12.6, follow: 1, s: 0.88 }, { t: 13.4, x: 1150, y: 860, s: 0.95, follow: 0 }];

  return {
    update(t) {
      const tg = t + ctx.start;
      slideIn(root, t, 0.42, L.width);
      for (const r of runs) r.update(tg);
      st.update(tg, STAMPS.noReply);
      const c = camAt(tg, keys, follow);
      const q1 = quake(tg, BOOMS[0], 9, 0.7, 2), q2 = quake(tg, BOOMS[1], 11, 0.7, 5), q3 = quake(tg, STAMPS.noReply, 3, 0.25, 8);
      const j = strikeJolt(tg, ids.map(i => RUN[i]));
      V.cam(c.x + q1[0] + q2[0] + q3[0], c.y + q1[1] + q2[1] + q3[1] - j * 0.8, c.s, (q1[0] + q2[0]) * 0.02);
      V.grain(tg);
      V.cull();
    },
  };
}
