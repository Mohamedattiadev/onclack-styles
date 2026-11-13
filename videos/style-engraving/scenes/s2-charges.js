// Scene 2 — PRESSURE. 2A: a second note — the real U.S. Navy photo (B-59 forced up, helicopter above), engraved line by
// line. 2B: CUT on "depth" back into the seascape, pushed in: two ships above, charges sink, each burst is a guilloche
// ripple that bends the engraved sea; on "Moscow … silent" the ripples die, the waves stop, an engraved plate says it.
// intent: KNOW US ships forced the boat; Moscow silent · FEEL pressure from above, then a void · SEE ripples around the hull.
// truth: 2A = EV (photo 28–29 Oct 1962, captioned; only re-drawn as lines, nothing added) · 2B = RC/VO (rings symbolic).
import { seaNote, loadPhoto, camPath, TS, SEA_BURSTS } from '../shared/sea.js';
import { noise1 } from '/onclack-styles/engine/lib/anim.js';

export default async function (root, ctx) {
  const photo = await loadPhoto(ctx, 'assets/b59-surfaced-1962.jpg');
  const ph = seaNote(root, ctx, { id: 's2p', photo });
  const sea = seaNote(root, ctx, { id: 's2s' });
  const s = x => x - ctx.start;
  const pf = ph.frame('photo'), sf = sea.frame('sub');
  ctx.sfx('eng-sheet-lay', 0.0, { lu: -14 });
  ctx.ambience('sea-water-close-01', { from: 0, to: s(TS.still) + 0.6, lu: -16, fade: 0.8 });
  ctx.sfx('boom-distant-01', s(SEA_BURSTS[0]) + 0.02, { lu: -8 });
  ctx.sfx('boom-distant-01', s(SEA_BURSTS[1]) + 0.02, { lu: -12 });
  ctx.sfx('boom-slapback-01', s(SEA_BURSTS[2]) + 0.02, { lu: -12, duration: 3.0, fadeOut: 1.4 });
  return {
    update(t) {
      const T = ctx.start + t;
      const isPhoto = T < TS.cut;
      ph.N.show(isPhoto); sea.N.show(!isPhoto);
      if (isPhoto) {
        ph.update(T, { ...pf, z: pf.z * (1 + t * 0.008) });
      } else {
        // impact jolt: noise-based, decays in 0.35 s (no per-frame sign flips)
        let jx = 0, jy = 0;
        for (const b of SEA_BURSTS) { const a = T - b; if (a > 0 && a < 0.4) { const k = 3.2 * (1 - a / 0.4); jx += noise1(a * 40, b) * k; jy += noise1(a * 40, b + 7) * k; } }
        const c = camPath(T, [[0, sf]]);
        sea.update(T, { x: c.x + jx, y: c.y + jy, z: c.z * (1 + (T - TS.cut) * 0.012) });
      }
    },
  };
}
