// Scene s2 — one camera over the shared sheet (see shared/sheet.js for intent, timing and truth notes).
import { buildSheet } from '../shared/sheet.js';

export default async function (root, ctx) {
  const sheet = await buildSheet(root, ctx, [2]);
  // distant underwater thuds on each burst (real recordings, impact frame + 1 f)
  sheet.bursts.forEach((tb, i) => ctx.sfx(i % 2 ? 'boom-slapback-01' : 'boom-distant-01', tb - ctx.start + 1 / 30, { lu: i % 2 ? -13 : -11 }));
  return { update(t) { sheet.update('s2', ctx.start + t); } };
}
