// The three-row form (scene 3 builds it, scene 4 picks it up at the same screen spot).
import { C, T, box, tick, grid, ballotGeom } from './kt.js';

export function buildForm(root, L) {
  const G = grid(L), B = ballotGeom(L), P = L.portrait;
  const head = T(root, '3C Form head', '', { fam: 'mono', size: L.px(30), wght: 500, ls: 0.1, upper: true, words: ['To fire:', 'three must agree'], join: '   ' });
  head.place(G.x(0), B.top - B.step * 0.78);
  const rows = [['Savitsky', 'captain'], ['Maslennikov', 'political officer'], [null, null]].map(([name, role], i) => {
    const y = B.top + i * B.step;
    const num = T(root, `3C Row ${i + 1} number`, '', { fam: 'mono', size: L.px(30), wght: 500, words: [`0${i + 1}`] });
    num.place(B.numX, y);
    const bx = box(root, `3C Row ${i + 1} box`, B.boxX, y - B.boxS, B.boxS, B.boxS, { border: `${Math.max(3, L.px(4))}px solid ${C.ink}`, transformOrigin: '50% 100%' });
    let nm = null, ro = null, blank = null;
    if (name) {
      nm = T(root, `3C Row ${i + 1} name`, '', { size: B.size, wght: 700, wdth: 85, words: [name] });
      nm.place(B.nameX, y);
      ro = T(root, `3C Row ${i + 1} role`, '', { fam: 'mono', size: L.px(26), wght: 400, ls: 0.06, upper: true, words: [role] });
      if (P) ro.place(B.nameX + L.px(4), y + L.px(52)); else ro.place(G.x(7) + L.px(40), y);
    } else {
      blank = box(root, '3C Row 3 blank line', B.nameX, y - Math.max(2, L.px(3)), L.pick({ landscape: G.w(5), portrait: G.w(3) - L.px(20) }), Math.max(3, L.px(4)), { background: C.ink, transformOrigin: '0 50%' });
    }
    return { num, bx, nm, ro, blank, y };
  });
  const ticks = [0, 1].map(i => tick(root, `3C Tick ${i + 1}`, B.boxX - B.boxS * 0.1, rows[i].y - B.boxS * 1.32, B.boxS, i + 3));
  const yes = [0, 1].map(i => {
    const n = T(root, `3C Yes ${i + 1}`, '', { size: L.pick({ landscape: B.size, portrait: L.px(60) }), wght: 800, wdth: 75, color: C.signal, align: P ? 'right' : 'left', words: ['yes'] });
    if (P) n.place(G.right, rows[i].y + L.px(56)); else n.place(B.yesX, rows[i].y);
    return n;
  });

  return { head, rows, ticks, yes, B };
}
