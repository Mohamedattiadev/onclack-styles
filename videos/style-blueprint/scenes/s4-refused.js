// Scene s4 — one camera over the shared sheet (see shared/sheet.js for intent, timing and truth notes).
import { buildSheet } from '../shared/sheet.js';

export default async function (root, ctx) {
  const sheet = await buildSheet(root, ctx, [1, 2, 3, 4]);
  return { update(t) { sheet.update('s4', ctx.start + t); } };
}
