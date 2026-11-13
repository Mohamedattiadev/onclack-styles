// One scene = the shared folded-paper table shown at global time ctx.start + t (continuity across cuts).
// Each scene registers only the sounds that start inside its own span (scenes overlap by 0.5 s).
import { buildStory, SOUNDS } from './story.js';

export function makeScene(root, ctx, { last = false } = {}) {
  const story = buildStory(root, ctx);
  const a = ctx.start, b = last ? Infinity : ctx.start + ctx.duration - 0.5;
  for (const s of SOUNDS) {
    if (s.at < a || s.at >= b) continue;
    if (s.bed) ctx.ambience(s.bed, { from: s.at - ctx.start, to: s.to - ctx.start, lu: s.lu, fade: 0.8 });
    else ctx.sfx(s.id, s.at - ctx.start, { lu: s.lu, duration: s.duration, fadeIn: s.fadeIn, fadeOut: s.fadeOut });
  }
  return { update(t) { story.update(ctx.start + t); } };
}
