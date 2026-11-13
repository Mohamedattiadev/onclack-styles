// Scene 3 — renders the one shared ink page at global time (intent, shots and truth codes: shared/page.js).
import { buildPage } from '../shared/page.js';
export default async function (root, ctx) { return buildPage(root, ctx, 3); }
