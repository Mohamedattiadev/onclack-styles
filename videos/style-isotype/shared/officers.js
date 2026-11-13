// The three officers + their vote slots (used by charts 3 and 4). Same scale for all three (the system),
// three different bodies (the people). No faces, no raised arms.
import { el } from '/onclack-styles/engine/lib/anim.js';
import { PAL, FONT, pict, box } from './iso.js';

export const OFFICERS = [
  { kind: 'akimbo', name: 'Savitsky', role: 'captain' },
  { kind: 'folder', name: 'Maslennikov', role: 'political officer' },
  { kind: 'behind', name: 'Arkhipov', role: 'flotilla chief of staff' },
];

/** centers: x centres; y: figure top; h: figure height. Returns per officer { hold, fig, nameEl, slotGhost, slotHold, x }. */
export function buildOfficers(C, I, L, { centers, y, h, slot, nameSize = 22, roles = true, gap = 14, ghost = false }) {
  const px = L.px;
  const w = h * 0.4;
  return OFFICERS.map((o, i) => {
    const cx = centers[i];
    let ghostEl = null;
    if (ghost) { ghostEl = box(I, `Officer ${o.name} slot`, cx - w / 2, y, {}); pict(ghostEl, o.kind, w, { color: '#D2CEC2', name: `${o.name} empty` }); }
    const hold = box(I, `Officer ${o.name}`, cx - w / 2, y, {});
    const fig = pict(hold, o.kind, w, { color: PAL.ink, name: `${o.name} figure` });
    const nameEl = box(C, `${o.name} name`, cx, y + h + px(gap), { transform: 'translateX(-50%)', textAlign: 'center', font: `700 ${px(nameSize)}px ${FONT}`, color: PAL.ink, whiteSpace: 'nowrap', lineHeight: 1.2 });
    el('div', {}, nameEl, o.name);
    if (roles) el('div', { style: { fontWeight: 400, fontSize: px(nameSize - 2) + 'px', color: PAL.text2 } }, nameEl, o.role);
    const sy = y + h + px(gap) + px(nameSize * (roles ? 2.5 : 1.3)) + px(16);
    const slotGhost = box(I, `Vote slot ${i + 1}`, cx - slot / 2, sy, {});
    pict(slotGhost, 'vote', slot, { color: PAL.ghost, mode: 'ghost', name: `Vote ${i + 1} empty` });
    const slotHold = box(I, `Vote ${i + 1}`, cx - slot / 2, sy, { width: slot + 'px', height: slot + 'px' });
    const vote = pict(slotHold, 'vote', slot, { color: PAL.ink, name: `Vote ${i + 1} unit` });
    const word = box(slotHold, `Vote ${i + 1} word`, 0, 0, { width: slot + 'px', height: slot + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `800 ${slot * 0.34}px ${FONT}`, color: PAL.board, letterSpacing: '0.02em' }, i < 2 ? 'YES' : 'NO');
    return { ...o, cx, w, ghostEl, hold, fig, nameEl, slotGhost, slotHold, vote, word, slotY: sy };
  });
}
