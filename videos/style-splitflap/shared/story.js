// The whole story as board events in GLOBAL time (voice word times from words.json), plus cameras and sound.
// Each scene module builds the same board and only chooses its camera + registers the sounds of its own time window.
//
// Truth codes: map = RC (Natural Earth coastlines, sub position APPROX.), cross-section = RC/VO (schematic, practice charges
// shown as falling cards, not to scale), figures = VO (no faces, roles from later accounts), vote module = VO.
import { rand } from '/onclack-styles/engine/lib/anim.js';
import { buildBoard, PX, VOTE, camAt } from './board.js';

const wordAt = (words, w, n = 0) => {
  const hits = words.filter(x => x.word.toLowerCase().replace(/[^a-z-]/g, '') === w);
  return hits[n]?.start ?? null;
};

// pixel figures (VO: no faces; different postures, never a raised fist or straight-arm pose)
const FIG = {
  capt: ['...###...', '..#####..', '...###...', '...###...', '....#....', '..#####..', '.#.###.#.', '#..###..#', '.#.###.#.', '..#####..', '...###...', '...#.#...', '...#.#...', '...#.#...', '..##.##..'],
  pol:  ['.........', '...###...', '...###...', '...###...', '....#....', '..#####..', '.#######.', '.#######.', '..#####..', '..#####..', '...###...', '...#.#...', '..#..#...', '..#..#...', '.##..##..'],
  third:['.........', '...###...', '...###...', '...###...', '....#....', '..#####..', '.#.###.#.', '.#.###.#.', '.#.###.#.', '.#.###.#.', '...###...', '...#.#...', '...#.#...', '...#.#...', '..##.##..'],
  // open-hand "stop": forearm up beside the head, palm open (elbow bent, not a straight-arm pose)
  stop: ['.......##', '...###.##', '...###.##', '...###.#.', '....#..#.', '..######.', '.#.###...', '.#.###...', '.#.###...', '.#.###...', '...###...', '...#.#...', '...#.#...', '...#.#...', '..##.##..'],
};
const TORPEDO = ['...AAA##################.##', '.AAAAA###################.#', '...AAA##################.##'];
const SHIP = ['....#.....', '..###..#..', '##########', '.########.'];
const SUB = ['.....###.......', '..############.', '###############', '..###########..'];

function stamp(art, c0, r0, c, r) {
  const rr = r - r0, cc = c - c0;
  if (rr < 0 || rr >= art.length || cc < 0 || cc >= art[0].length) return null;
  const ch = art[rr][cc];
  return ch === '.' || ch === ' ' ? null : ch;
}

// The board is built ONCE per page and handed to whichever scene is active (scenes never overlap: overlap 0).
let shared = null;
export function getStory(ctx) {
  if (!shared) shared = (async () => { const holder = document.createElement('div'); holder.className = 'holder'; return { holder, B: await buildStory(holder, ctx) }; })();
  return shared;
}

async function buildStory(root, ctx) {
  const L = ctx.layout;
  const map = await (await fetch(ctx.asset('assets/caribbean.json'))).json();
  const B = buildBoard(root, ctx, map);
  const { G } = B, C = G.pic.cols, R = G.pic.rows;
  const W = ctx.words;
  const at = (w, n = 0, fb = 0) => wordAt(W, w, n) ?? fb;
  const v = 1 / 30; // one frame: visuals land 1 frame before their word

  // ---- 1 · the map (RC) ----
  const lat0 = 23.5, latSpan = 14, lonC = -77.5, lonSpan = latSpan * (C / R) / Math.cos(lat0 * Math.PI / 180);
  const toLL = (c, r) => [lonC - lonSpan / 2 + lonSpan * c / C, lat0 + latSpan / 2 - latSpan * r / R];
  const inRing = (x, y, ring) => { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const feats = map.features.map(f => { const xs = f.rings.flat(); return { ...f, bb: [Math.min(...xs.map(p => p[0])), Math.max(...xs.map(p => p[0])), Math.min(...xs.map(p => p[1])), Math.max(...xs.map(p => p[1]))] }; });
  const landAt = (c, r) => {               // 3×3 samples per card; ≥ 3 hits = land (keeps the Bahamas as specks)
    let hit = 0, cuba = 0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const [x, y] = toLL(c + (i + 0.5) / 3, r + (j + 0.5) / 3);
      for (const f of feats) if (x >= f.bb[0] && x <= f.bb[1] && y >= f.bb[2] && y <= f.bb[3] && f.rings.some(rg => inRing(x, y, rg))) { hit++; if (f.name === 'Cuba') cuba++; break; }
    }
    return hit >= 3 ? (cuba >= hit / 2 ? 'cuba' : 'land') : null;
  };
  const mapGrid = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) mapGrid.push(landAt(c, r));
  const subLL = [-71.2, 25.4];   // approx. — accounts differ; shown as "POS. APPROX."
  const subC = Math.round((subLL[0] - (lonC - lonSpan / 2)) / lonSpan * C), subR = Math.round((lat0 + latSpan / 2 - subLL[1]) / latSpan * R);
  const isSub = (c, r) => r === subR && (c === subC || c === subC + 1);

  B.page(at('october') - 0.15, (c, r) => (mapGrid[r * C + c] ? PX.GREY : PX.SEA), { sweep: 0.7, jitter: 0.18 });
  B.row(0, '27 OCT', at('twenty-seventh') - v);
  B.row(0, '27 OCT 1962', at('nineteen') - v);
  B.page(at('submarine') - 0.12, (c, r) => (isSub(c, r) ? PX.AMBER : null), { sweep: 0, jitter: 0 });
  B.row(2, 'SOVIET SUB', at('submarine') - v);
  B.row(3, 'B-59', at('hides') - v);
  B.row(1, 'POS. APPROX.', at('hides') + 0.2);
  // "deep": the sea around the boat turns to deep-water cards
  B.page(at('deep') - 0.1, (c, r) => (!isSub(c, r) && Math.abs(c - subC - 0.5) <= 2.6 && Math.abs(r - subR) <= 1.6 && !mapGrid[r * C + c] ? PX.DEEP : null), { sweep: 0, jitter: 0.08 });
  B.row(5, 'DEEP', at('deep') - v);
  B.page(at('cuba') - 0.1, (c, r) => (mapGrid[r * C + c] === 'cuba' ? PX.LAND : null), { sweep: 0.25, jitter: 0.06 });
  B.row(6, 'NEAR CUBA', at('cuba') - v);

  // ---- 2 · ships above, practice depth charges (RC/VO schematic) ----
  const s = Math.round(R * 0.27);
  const seaAt = r => (r < s ? PX.BLANK : r < R * 0.62 ? PX.SEA : PX.DEEP);
  const bed = c => R - 1 - (rand(Math.floor(c / 3) * 5.3) < 0.5 ? 0 : 1);
  const subR0 = R - 7, subC0 = Math.round(C * 0.44 - SUB[0].length / 2);
  const ships = [1, Math.round(C / 2 - 5), C - 11];
  const shipArt = (c, r) => ships.some(x => stamp(SHIP, x, s - SHIP.length, c, r));
  const section = (c, r) => (stamp(SUB, subC0, subR0, c, r) ? PX.AMBER : r >= bed(c) ? PX.GREY : seaAt(r));
  B.page(at('above') - 0.25, section, { sweep: 0.45, jitter: 0.15 });
  B.page(at('ships') - 0.25, (c, r) => (shipArt(c, r) ? PX.GREY : null), { sweep: 0.12, jitter: 0.06 });
  for (const r of [1, 2, 3, 4, 5, 6]) B.row(r, '', at('american') + 0.15, { dur: 0.018 });
  B.row(0, 'US NAVY', at('american') - v);
  B.row(2, 'PRACTICE', at('practice') - v);
  B.row(3, 'DEPTH', at('depth') - v);
  B.row(4, 'CHARGES', at('charges') - v);
  const drops = [{ c: ships[0] + 6, t: at('drop') - v, dc: 3 }, { c: ships[1] + 4, t: at('drop') + 0.3, dc: 1 }, { c: ships[2] + 4, t: at('drop') + 0.62, dc: -2 }];
  const step = 0.095;
  drops.forEach((d, i) => {
    const rEnd = subR0 - 2 + (i === 1 ? -1 : 0);
    let c = d.c;
    for (let r = s + 1; r <= rEnd; r++) {
      const t = d.t + (r - s - 1) * step;
      if ((r - s) % 4 === 0) c += Math.sign(d.dc);          // a little drift in the water
      B.dot(c, r, PX.LAND, t); B.dot(c, r, seaAt(r), t + step, 0.008);
    }
    const tb = d.t + (rEnd - s) * step;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const dd = Math.hypot(dr, dc * 0.8); if (dd > 2.3) continue;
      const cc = c + dc, rr = rEnd + dr; if (stamp(SUB, subC0, subR0, cc, rr)) continue;
      const tt = tb + dd * 0.035;
      B.dot(cc, rr, dd < 1.2 ? PX.LAND : PX.GREY, tt);
      B.dot(cc, rr, seaAt(rr), tt + 0.3 + 0.25 * rand(cc * 3 + rr + i), 0.01);
    }
    B.bursts.push({ t: tb, amp: L.px(i === 1 ? 9 : 6), c, r: rEnd });
  });
  B.row(0, 'MOSCOW', at('moscow') - v);
  for (const r of [2, 3, 4]) B.row(r, '', at('moscow') + 0.25, { dur: 0.018 });
  B.row(2, 'NO SIGNAL', at('silent') - v);
  B.row(3, 'FOR DAYS', at('days') - v);

  // ---- 3 · torpedo + three officers (VO) ----
  const tr0 = Math.round(R * 0.1), tc0 = Math.round(C / 2 - TORPEDO[0].length / 2);
  const figR0 = R - 15, figC = [Math.round(C * 0.2) - 4, Math.round(C * 0.5) - 4, Math.round(C * 0.8) - 4];
  const figs = [FIG.capt, FIG.pol, FIG.third];
  const figAt = (c, r, arts = figs) => arts.findIndex((a, i) => stamp(a, figC[i], figR0, c, r));
  B.page(at('board') - 0.3, () => PX.BLANK, { sweep: 0.35, jitter: 0.1, dur: 0.03 });
  for (const r of [1, 2, 3, 4]) B.row(r, '', at('board'), { dur: 0.018 });
  B.row(0, 'ON BOARD', at('board') - v);
  const trMid = Math.round(R * 0.42);
  const torpAt = r0 => (c, r) => { const k = stamp(TORPEDO, tc0, r0, c, r); return k === 'A' ? PX.AMBER : k ? PX.GREY : null; };
  B.page(at('nuclear') - 0.4, torpAt(trMid), { sweep: 0.4, jitter: 0.05 });
  // "three officers": the torpedo is re-laid at the top (the board can only re-flip, never slide) and the three appear
  B.page(at('three') - 0.35, (c, r) => torpAt(tr0)(c, r) ?? PX.BLANK, { sweep: 0.3, jitter: 0.08, only: (c, r) => r <= trMid + 3 });
  B.row(2, 'NUCLEAR', at('nuclear') - v);
  B.row(3, 'TORPEDO', at('torpedo') - v);
  B.row(0, 'TO FIRE:', at('fire') - v);
  B.page(at('three') - 0.2, (c, r) => (figAt(c, r) >= 0 ? PX.GREY : null), { sweep: 0.45, jitter: 0.1 });
  B.row(4, 'CAPTAIN', at('officers') - v);
  B.row(5, 'POLITRUK', at('officers') + 0.16);
  B.row(6, '3RD', at('officers') + 0.32);
  B.row(1, '3 OF 3', at('agree') - v);
  B.vote(0, VOTE.YES, at('two') - v);
  B.page(at('two') - 0.12, (c, r) => (figAt(c, r) === 0 ? PX.LAND : null), { sweep: 0, jitter: 0.06 });
  B.vote(1, VOTE.YES, at('yes') - v);
  B.page(at('yes') - 0.12, (c, r) => (figAt(c, r) === 1 ? PX.LAND : null), { sweep: 0, jitter: 0.06 });
  B.vote(2, VOTE.DASH, at('yes') + 0.45);

  // ---- 4 · the third says no; the name, 40 years later ----
  const tArk = at('arkhipov');
  B.row(6, 'ARKHIPOV', tArk - v);
  B.page(tArk - 0.1, (c, r) => (figAt(c, r) === 2 ? PX.LAND : null), { sweep: 0, jitter: 0.06 });
  const tNo = at('no') - 2 / 30;
  B.vote(2, VOTE.NO, tNo);
  const stopFigs = [FIG.capt, FIG.pol, FIG.stop];
  B.page(tNo - 0.13, (c, r) => {
    const was = stamp(FIG.third, figC[2], figR0, c, r), now = stamp(FIG.stop, figC[2], figR0, c, r);
    return was && !now ? PX.BLANK : now && !was ? PX.LAND : null;
  }, { sweep: 0, jitter: 0.02, dur: 0.025 });
  void stopFigs;
  const tWorld = at('world');
  B.page(tWorld - 0.2, (c, r) => (stamp(TORPEDO, tc0, tr0, c, r) === 'A' ? PX.GREY : null), { sweep: 0.2, jitter: 0.05 });
  B.row(0, 'NOT FIRED', tWorld - v);
  B.row(1, 'NAME KNOWN', at('name') - v);
  B.row(2, '≈2002 (+40)', at('forty') - v);
  B.row(3, '', at('forty') + 0.35, { dur: 0.018 });

  B.finalize();
  return B;
}

// ---- cameras (board coordinates; smootherstep between keys) ----
export function cameras(L, W) {
  const at = (w, n = 0) => wordAt(W, w, n) ?? 0;
  if (L.portrait) return {
    s1: [[0, { x: 520, y: 900, z: 1.0 }], [7.3, { x: 520, y: 895, z: 1.02 }]],
    s2: [[7.2, { x: 515, y: 880, z: 1.04 }], [at('moscow') - 0.15, { x: 515, y: 878, z: 1.06 }], [at('moscow') + 0.75, { x: 528, y: 1090, z: 1.12 }], [13.4, { x: 528, y: 1095, z: 1.14 }]],
    s3: [[13.3, { x: 520, y: 900, z: 1.0 }], [19.8, { x: 520, y: 905, z: 1.02 }]],
    s4: [[19.7, { x: 530, y: 1030, z: 1.03 }], [at('no'), { x: 530, y: 1040, z: 1.045 }], [at('world') - 0.05, { x: 530, y: 1040, z: 1.045 }], [at('forty'), { x: 520, y: 900, z: 1.0 }], [26, { x: 520, y: 900, z: 1.01 }]],
  };

  return {
    s1: [[0, { x: 975, y: 562, z: 1.0 }], [7.3, { x: 975, y: 560, z: 1.025 }]],
    s2: [[7.2, { x: 585, y: 548, z: 1.42 }], [at('moscow') - 0.15, { x: 587, y: 552, z: 1.48 }], [at('moscow') + 0.75, { x: 1440, y: 520, z: 1.42 }], [13.4, { x: 1440, y: 525, z: 1.46 }]],
    s3: [[13.3, { x: 975, y: 560, z: 1.0 }], [19.8, { x: 975, y: 568, z: 1.025 }]],
    s4: [[19.7, { x: 1445, y: 702, z: 2.04 }], [at('no'), { x: 1448, y: 708, z: 2.1 }], [at('world') - 0.05, { x: 1448, y: 708, z: 2.1 }], [at('forty'), { x: 960, y: 562, z: 1.02 }], [26, { x: 960, y: 562, z: 1.01 }]],
  };
}

// ---- sound for one scene's window (global times) ----
export function sounds(ctx, B, story) {
  const a = ctx.start, b = ctx.start + ctx.duration;
  const local = T => T - a;
  let k = 0;
  for (const c of B.cascades) {
    if (c.t0 < a || c.t0 >= b) continue;
    const d = Math.max(0.12, c.t1 - c.t0);
    if (c.kind === 'page') ctx.sfx('flap-run', local(c.t0), { lu: c.n > 200 ? -12 : -17, duration: d, loop: true, fadeIn: 0.02, fadeOut: 0.12 });
    else if (c.kind === 'row') ctx.sfx('flap-few', local(c.t0), { lu: -19, duration: d, loop: true, fadeIn: 0.02, fadeOut: 0.06 });
    if (c.kind !== 'vote') ctx.sfx(`flap-tick-${(k++ % 3) + 1}`, local(c.t1), { lu: -17 });
  }
  for (const s of story) if (s.t >= a && s.t < b) ctx.sfx(s.id, local(s.t), s.opts);
}

// story sounds (natural recordings from the global library; the flaps come from this video's own sfx.json)
export function storySfx(W, B) {
  const at = w => wordAt(W, w) ?? 0;
  const [b1, b2, b3] = B.bursts.map(x => x.t);
  return [
    { t: b1, id: 'boom-distant-01', opts: { lu: -9 } },
    { t: b2, id: 'boom-slapback-01', opts: { lu: -8 } },
    { t: b3, id: 'boom-distant-01', opts: { lu: -13 } },
    { t: at('moscow') + 0.95, id: 'door-creak-01', opts: { lu: -24 } },          // the hull, far off
    { t: at('no') - 2 / 30 + 0.005, id: 'flap-stop', opts: { lu: -6 } },          // the vote module lands
  ];
}
