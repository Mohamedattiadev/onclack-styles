// 3 · ON BOARD — TORPEDO is loaded across the whole frame; the camera pulls back and it becomes the held word at the top;
//     three names line up like a form; two get ticked; the third line is still empty.
// intent: KNOW firing needed 3 officers; 2 said yes · FEEL dread (it is almost decided) · SEE two ticks + one empty box
// shots: 3A INS "torpedo" slides in (loaded into the tube) · 3B PULL + PED-up (camera) → held word at top · 3C the form, ticks on "two say yes"
// truth: VO (type). Names: Savitsky (captain) and Maslennikov (political officer) — the vote comes from later accounts and
//        is debated (re-check 2+ sources before public use). The third name stays blank until scene 4.
import { C, F, ez, tw, on, grid, T, fitT, rise, show, vis, camera, ballotGeom, kicker } from '../shared/kt.js';
import { buildForm } from '../shared/form.js';

export default function (root, ctx) {
  const L = ctx.layout, G = grid(L), B = ballotGeom(L), P = L.portrait;
  root.style.background = C.paper;

  // ---- voice
  const tOn = on(ctx, 'On', 0, 0.35), tNuc = on(ctx, 'nuclear', 0, 1.16), tTor = on(ctx, 'torpedo', 0, 1.56);
  const tTo = on(ctx, 'To', 0, 2.41), tThree = on(ctx, 'three', 0, 3.19), tOff = on(ctx, 'officers', 0, 3.54);
  const tMust = on(ctx, 'must', 0, 4.05), tTwo = on(ctx, 'Two', 0, 4.97), tSay = on(ctx, 'say', 0, 5.23), tYes = on(ctx, 'yes', 0, 5.48);
  const tMove = tTo - 4 * F; // camera move starts in the voice pause after "torpedo"

  /* ---- 3A/3B: the torpedo (world layer, moved by the camera) */
  const cam = camera(root, '3A Torpedo layout (camera)');
  const tor = fitT(cam, '3A TORPEDO (held word)', 'torpedo', { size: L.pick({ landscape: L.px(520), portrait: L.px(440) }), wght: 800, wdth: L.pick({ landscape: 100, portrait: 75 }) }, L.safe.w + L.px(10));
  const torBase = L.pick({ landscape: L.height * 0.64, portrait: L.height * 0.47 });
  tor.place(G.x(0), torBase);
  const nuc = T(cam, '3A nuclear', '', { fam: 'mono', size: L.px(52), wght: 500, ls: 0.14, upper: true, words: ['nuclear'] });
  nuc.place(G.x(0), torBase - tor.m.cap - L.px(110));
  // end frame of the move: torpedo small at the top-left, baseline on the grid
  const s1 = L.pick({ landscape: 0.4, portrait: 0.56 });
  const endBase = L.safe.y + L.pick({ landscape: L.px(190), portrait: L.px(380) });

  const board = T(root, '3A On board', '', { fam: 'mono', size: L.px(30), wght: 500, ls: 0.1, upper: true, words: ['On board:'] });
  board.place(G.x(0), L.safe.y + L.pick({ landscape: L.px(150), portrait: L.px(250) }));

  /* ---- 3C: the form (screen space, so scene 4 picks it up at the same spot) */
  const { head, rows, ticks, yes } = buildForm(root, L);

  const kick = kicker(root, L, '3', 'On board');
  ctx.sfx('footsteps-metal-deck-01', tTor - 6 * F, { lu: -26 });

  return {
    update(t) {
      // 3A: torpedo loads from the left (12 f, enter), creep; 3B: camera pulls back + rises (camera token, 26 f)
      const pIn = ez.enter(Math.min(1, Math.max(0, (t - (tTor - 10 * F)) / (12 * F))));
      tor.style.visibility = t >= tTor - 10 * F ? 'visible' : 'hidden';
      tor.style.transform = `translateX(${(-(1 - pIn) * L.width * 1.1).toFixed(2)}px)`;
      const pc = ez.camera(Math.min(1, Math.max(0, (t - tMove) / (26 * F))));
      const s = 1 + (s1 - 1) * pc;
      const cr = Math.max(0, t) * L.px(3) * (1 - pc); // creep before the move
      // keep the focus point exact during the move: interpolate the torpedo's screen position, not the camera numbers
      const sx = G.x(0) + (G.right - tor.m.w * s - G.x(0)) * pc, sb = (torBase + cr) * (1 - pc) + endBase * pc;
      cam.set(G.x(0) - sx / s, torBase - sb / s, s);

      rise(board.words[0], t, tOn);
      vis(board, t < tMove + 6 * F);
      rise(nuc.words[0], t, tNuc);

      // 3C: the form builds on "to fire" / "three officers" / "must agree"
      rise(head.words[0], t, tTo + 8 * F); rise(head.words[1], t, tMust);
      rows.forEach((r, i) => {
        const a = tThree + i * 3 * F;
        rise(r.num.words[0], t, a);
        r.bx.style.visibility = t >= a ? 'visible' : 'hidden';
        r.bx.style.transform = `scaleY(${tw(t, a, a + 6 * F, 0.2, 1).toFixed(4)})`;
        if (r.nm) { rise(r.nm.words[0], t, tOff + i * 3 * F); rise(r.ro.words[0], t, tOff + 8 * F + i * 3 * F); }
        if (r.blank) r.blank.style.transform = `scaleX(${tw(t, tOff + 6 * F, tOff + 20 * F, 0, 1, ez.move).toFixed(4)})`;
      });
      ticks[0].draw(t, tTwo); ticks[1].draw(t, tSay);
      rise(yes[0].words[0], t, tYes); rise(yes[1].words[0], t, tYes + 3 * F);
      show(kick, t, 0);
    },
  };
}
