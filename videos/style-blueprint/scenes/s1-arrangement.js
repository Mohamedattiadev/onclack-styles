// Scene s1 — one camera over the shared sheet (see shared/sheet.js for intent, timing and truth notes).
import { buildSheet } from '../shared/sheet.js';

export default async function (root, ctx) {
  const sheet = await buildSheet(root, ctx, [1]);
  return { update(t) { sheet.update('s1', ctx.start + t); } };
}
