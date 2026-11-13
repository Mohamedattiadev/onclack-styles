// SCENE 1 — "October twenty-seventh, nineteen sixty-two. A Soviet submarine hides deep in the sea near Cuba."
// intent: KNOW date + a Soviet boat deep near Cuba · FEEL hidden, pressed down · SEE the boat drawn many lines under the surface line.
import { buildPage } from '../shared/page.js';
export default function (root, ctx) {
  const P = buildPage(root, ctx);
  const at = (tg) => tg - ctx.start;
  // a quiet classroom (room tone) + the sea the story is about, low and close; it runs on under scene 2
  ctx.ambience('sea-water-close-01', { from: at(3.2), to: at(13.9), lu: -19, fade: 1.2 });
  ctx.sfx('page-turn-01', at(0.0), { lu: -24, duration: 0.6, fadeOut: 0.2 });
  return { update: (t) => P.update(ctx.start + t) };
}
