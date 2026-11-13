// Scene 4 — one camera set-up on the shared board (all flap events live in shared/story.js, in global time).
import { getStory, cameras, sounds, storySfx } from '../shared/story.js';
import { camAt } from '../shared/board.js';

export default async function (root, ctx) {
  const { holder, B } = await getStory(ctx);
  const keys = cameras(ctx.layout, ctx.words).s4;
  sounds(ctx, B, storySfx(ctx.words, B));
  return {
    update(t) {
      if (holder.parentNode !== root) root.appendChild(holder);   // the one board moves to the active scene
      const T = ctx.start + t;
      B.update(T, camAt(T, keys));
    },
  };
}
