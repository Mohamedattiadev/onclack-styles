// SHADOWPLAY kit — shared by the 4 scenes of this style test.
// Field + stage light + paper fibre, parallax planes with a 2.5D camera, cut-paper edge filter,
// hinged silhouette puppets, paper/ink plates on rails, and the stage-flat wipe.
// Everything is a pure function of time.
import { el, svg, clamp, progress, lerp, spring, rand } from '/onclack-styles/engine/lib/anim.js';

export const C = {
  saffron: '#E8A33D', verdigris: '#3E8C7E', vermillion: '#C8432B', cobalt: '#2B4FA3',
  ink: '#15130F', paper: '#F6F1E6',
};

/** Mix two hex colours (p = 0 → a, 1 → b). Used for aerial-perspective haze (field colour over far planes). */
export function mix(a, b, p) {
  const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], p)).toString(16).padStart(2, '0')).join('');
}

// ---------- motion ----------
/** THE PUPPET BEAT: heavy spring (k 120, c 18 → ζ ≈ 0.82, ≈ 1.5 % overshoot, settles in ≈ 35–45 f). */
export const HEAVY = { stiffness: 120, damping: 18 };
export const beat = (t, t0) => spring(t - t0, HEAVY);
/** Follow-through of a hinged limb: proportional to the (negative) velocity of its parent's beat. Pure in t. */
export const lag = (t, t0, dt = 1 / 30) => (beat(t, t0) - beat(t - dt, t0)) / dt; // ≈ velocity in "progress per s"

/** CSS-style cubic-bezier easing (solved with Newton steps). */
export function bez(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s;
  const dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    p = clamp(p); let s = p;
    for (let i = 0; i < 8; i++) { const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= (X(s) - p) / d; s = clamp(s); }
    return Y(s);
  };
}
export const tok = { enter: bez(0.16, 1, 0.3, 1), exit: bez(0.7, 0, 0.84, 0), move: bez(0.65, 0, 0.35, 1), camera: bez(0.45, 0, 0.15, 1) };
export const span = (t, a, b, e = tok.camera) => e(progress(t, a, b));

/** Local time (s) of the n-th spoken word that matches `w` inside this scene (from words.json — never hand-typed). */
export function wordAt(ctx, w, n = 0, fallback = 0) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const hits = ctx.wordsIn().filter(x => norm(x.word) === norm(w));
  const hit = hits[Math.min(n, hits.length - 1)];
  return hit ? hit.start - ctx.start : fallback;
}

// ---------- stage ----------
let uid = 0;
/**
 * Build the theatre for one scene: colour field, key light (upper-left), paper fibre, an SVG for planes,
 * an HTML layer for type (screen space) and the stage-flat wipe.
 */
export function stage(root, ctx, { field, name = 'Stage', wipe = true }) {
  const L = ctx.layout, W = ctx.width, H = ctx.height, id = 'sp' + (++uid) + '-';
  const content = el('div', { 'data-name': name, style: { position: 'absolute', inset: 0, background: field, overflow: 'hidden' } }, root);
  // No glow / gradient / vignette (AI-tell #11): the field is flat; depth comes from planes, haze and cast shadows.
  // Paper fibre on the field: fixed (world-fixed, never boils), very low contrast, long fibres.
  const fib = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;inset:0;mix-blend-mode:soft-light;opacity:.55', 'data-name': 'Paper fibre' }, content);
  const fdef = svg('defs', {}, fib);
  const ff = svg('filter', { id: id + 'fibre', x: 0, y: 0, width: '100%', height: '100%' }, fdef);
  svg('feTurbulence', { type: 'fractalNoise', baseFrequency: `${0.9 / L.unit} ${0.035 / L.unit}`, numOctaves: 3, seed: 11 }, ff);
  svg('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  1.2 0 0 0 -0.35' }, ff);
  svg('rect', { width: W, height: H, filter: `url(#${id}fibre)` }, fib);

  const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'position:absolute;inset:0;overflow:visible', 'data-name': 'Planes' }, content);
  const defs = svg('defs', {}, s);
  /** Cut-paper edge (+ optional cast shadow down-right, key light upper-left). Imperfection is fixed per object. */
  const cut = (key, { rough = 2.6, shadow = 0, blur = 0, alpha = 0.3, seed = 7 } = {}) => {
    const f = svg('filter', { id: id + key, x: '-10%', y: '-10%', width: '125%', height: '125%', 'color-interpolation-filters': 'sRGB' }, defs);
    svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.045, numOctaves: 2, seed, result: 'n' }, f);
    svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: rough, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, f);
    if (shadow) svg('feDropShadow', { in: 'd', dx: shadow, dy: shadow * 1.25, stdDeviation: blur || shadow * 0.45, 'flood-color': '#0c0a18', 'flood-opacity': alpha }, f);
    return `url(#${id + key})`;
  };
  const planes = [];
  /** A parallax plane (p: sky .05 · far .1–.3 · mid .6 · subject 1 · near 1.4). */
  const plane = (p, pname, parent = s) => { const g = svg('g', { 'data-name': pname }, parent); planes.push({ g, p }); return g; };
  /** 2.5D camera: zoom s about focus (fx, fy) in screen px, pan (x, y). Each plane moves by its parallax p. */
  const camera = ({ s: zoom = 1, x = 0, y = 0, fx = W / 2, fy = H / 2 }) => {
    for (const { g, p } of planes) {
      const sp = 1 + (zoom - 1) * p;
      g.setAttribute('transform', `translate(${fx} ${fy}) scale(${sp}) translate(${-fx - x * p} ${-fy - y * p})`);
    }
  };
  const type = el('div', { 'data-name': 'Type layer', style: { position: 'absolute', inset: 0 } }, content);

  // Stage-flat wipe: an ink flat with cut edges crosses the frame (12 f); the new scene is revealed behind it.
  let flat = null;
  if (wipe) {
    const fw = W * 0.24;
    flat = svg('svg', { width: fw + 40, height: H, viewBox: `-20 0 ${fw + 40} ${H}`, style: 'position:absolute;top:0;left:0', 'data-name': 'Stage flat (wipe)' }, root);
    const n = 28, edge = side => Array.from({ length: n + 1 }, (_, i) => [side + (rand(i * 7.1 + side) - 0.5) * L.px(14), (H * i) / n]);
    const a = edge(0), b = edge(fw).reverse();
    svg('path', { d: 'M' + [...a, ...b].map(q => q.map(v => v.toFixed(1)).join(',')).join('L') + 'Z', fill: C.ink }, flat);
  }
  const WIPE = 0.4;
  const update = t => {
    if (!flat) return;
    if (t >= WIPE) { content.style.clipPath = 'none'; flat.style.display = 'none'; return; }
    const fw = W * 0.24, x = lerp(-fw - 30, W + 30, tok.move(progress(t, 0, WIPE)));
    flat.style.display = '';
    flat.style.transform = `translateX(${x - 20}px)`;
    content.style.clipPath = `inset(0 ${Math.max(0, W - x - fw * 0.5)}px 0 0)`;
  };
  update(0);
  return { content, s, defs, cut, plane, camera, type, update, id, W, H, L };
}

// ---------- type on plates ----------
/** A cut-paper plate carrying text (ink or paper). Slides on a rail with the puppet beat. */
export function plate(parent, L, { text, font = 'label', ground = C.ink, color = C.paper, size = 34, name, seed = 1, padX = 0.55, padY = 0.32, track = 0.08, italic = false }) {
  const wrap = el('div', { 'data-name': name ?? text, style: { position: 'absolute', left: 0, top: 0, filter: `drop-shadow(${L.px(5)}px ${L.px(7)}px ${L.px(3)}px rgba(12,10,24,.32))`, willChange: 'transform' } }, parent);
  const r = i => ((rand(seed * 13.7 + i) - 0.5) * 0.9).toFixed(2);
  const inner = el('div', { style: {
    background: ground, color, whiteSpace: 'pre', textAlign: 'left', padding: `${padY}em ${padX}em`, fontSize: L.px(size) + 'px',
    fontFamily: font === 'title' ? "'Fraunces', serif" : "'Schibsted Grotesk', sans-serif",
    fontWeight: font === 'title' ? 600 : 600, fontStyle: italic ? 'italic' : 'normal',
    letterSpacing: font === 'title' ? '-0.01em' : `${track}em`, textTransform: font === 'title' ? 'none' : 'uppercase',
    lineHeight: 1.05, fontKerning: 'normal', fontSynthesis: 'none', fontVariantNumeric: 'lining-nums', // not tabular: tnum also widens , : . in Schibsted
    clipPath: `polygon(${r(1)}% ${r(2)}%, ${100 + +r(3)}% ${r(4)}%, ${100 + +r(5)}% ${100 + +r(6)}%, ${r(7)}% ${100 + +r(8)}%)`,
  } }, wrap, text);
  return { wrap, inner, w: () => wrap.offsetWidth, h: () => wrap.offsetHeight };
}

/** Place a plate at (x, y) [its top-left], sliding from (dx, dy) offset with the puppet beat at t0. Hides before t0. */
export function railIn(p, t, t0, x, y, dx = 0, dy = 0, out = Infinity) {
  const k = beat(t, t0), o = 1 - k;
  const leave = t > out ? tok.exit(progress(t, out, out + 0.3)) : 0;
  p.wrap.style.visibility = t < t0 ? 'hidden' : 'visible';
  p.wrap.style.opacity = String(1 - leave);
  const px = x + dx * o, py = y + dy * o - leave * 20;
  // whole pixels once resting (crisp type), fractional while moving
  const rest = Math.abs(o) < 0.002 && !leave;
  p.wrap.style.transform = rest ? `translate(${Math.round(px)}px, ${Math.round(py)}px)` : `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;
}

// ---------- silhouettes (hand-drawn SVG, traced by eye from the public-domain photos in assets/LICENSES.md) ----------
/** Soviet Project 641 ("Foxtrot") submarine, side view, bow right. Drawn by eye after the public-domain US Navy photos of B-59 surfaced, Oct 1962. 1000 × 200, waterline ≈ y 120. */
export const SUB = {
  w: 1000, h: 200,
  d: 'M18,131 C52,121 130,111 236,108 L948,106 C978,108 996,119 996,134 C995,150 975,159 936,161 L236,164 C132,162 56,150 18,140 Z' +
     'M452,109 L466,58 C469,47 478,41 492,40 L560,38 C566,32 576,30 588,31 L604,33 C616,35 622,44 624,56 L640,109 Z' + // sail (bridge fin) with stepped top
     'M526,40 L526,6 L533,6 L533,40 Z M552,38 L552,14 L558,14 L558,38 Z M584,32 L586,18 L590,18 L590,32 Z' + // periscopes and mast
     'M22,133 L3,110 L17,109 L40,127 Z M24,139 L4,160 L20,161 L42,143 Z' + // rudder and stern planes
     'M905,120 L930,112 L934,116 L912,124 Z', // bow plane
};

/** US Navy Gearing-class destroyer (USS Charles P. Cecil, DDR-835), side view, bow right. Drawn by eye after public-domain US Navy photos of the class. 1000 × 230, waterline y 192. */
export const DESTROYER = {
  w: 1000, h: 230,
  d: 'M22,160 L940,146 L992,138 L978,166 L960,196 L70,198 L40,186 Z' + // hull with sheer to the bow
     'M80,160 L84,146 L150,145 L156,158 Z M150,148 L118,141 L119,138 L152,144 Z' + // aft gun mount + barrel
     'M200,158 L206,122 L300,120 L322,156 Z M228,122 L232,102 L270,101 L274,121 Z' + // aft deckhouse
     'M352,156 L356,128 L392,127 L396,155 Z' + // mid deckhouse
     'M405,156 L412,90 C414,82 440,80 448,88 L458,155 Z M424,84 L428,72 L444,72 L446,84 Z' + // aft funnel (raked) with cap
     'M470,156 L476,118 L560,116 L566,155 Z' + // torpedo deck / boats
     'M572,156 L578,74 C580,64 608,62 616,72 L626,155 Z M590,66 L592,52 L608,52 L611,66 Z' + // forward funnel + cap
     'M640,155 L648,104 L702,102 L708,154 Z' + // aft bridge structure
     'M694,154 L702,92 L744,88 L770,60 L800,58 L812,90 L824,150 Z' + // bridge block
     'M748,62 L746,40 L790,38 L792,58 Z' + // pilot house top
     'M734,92 L742,10 L748,10 L760,92 Z M742,22 L784,22 L784,26 L742,26 Z M780,14 L800,4 L812,30 L790,36 Z' + // tripod mast, yard, radar
     'M838,146 L846,122 L890,120 L904,144 Z M884,124 L944,118 L945,122 L888,128 Z', // forward gun mount + barrel
};

/** Torpedo on a cradle (generic 533 mm torpedo shape; no secret detail implied). 1000 × 120. */
export const TORPEDO = {
  w: 1000, h: 140,
  d: 'M70,38 L850,38 C930,38 988,50 998,64 C988,78 930,90 850,90 L70,90 Z M70,40 L18,50 L18,78 L70,88 Z' +
     'M46,42 L6,16 L28,15 L80,40 Z M46,86 L6,112 L28,113 L80,88 Z' +
     'M220,90 L200,132 L330,132 L310,90 Z M640,90 L620,132 L750,132 L730,90 Z',
  rings: [770, 786], // thin field-coloured joints near the warhead section
};

/**
 * Hinged silhouette: a naval officer standing in profile, facing right. Generic figure (no likeness, no face detail),
 * realistic proportions (≈ 7.5 heads, head ≈ 118 of 880). Pinned like a shadow puppet: head at the neck, front arm at
 * the shoulder, whole body at the feet (lean). Local units: feet at y 902, x ≈ 100–215.
 * Variation per figure (fixed, not random per frame): stocky (width), cap or bare head, posture (chest forward/back).
 */
export function officer(parent, { fill = C.ink, filter, name = 'Officer', stocky = 1, cap = true, posture = 0 } = {}) {
  const g = svg('g', { 'data-name': name }, parent);
  const body = svg('g', { filter: filter ?? '', fill }, g);
  const sc = svg('g', { transform: `translate(150 0) scale(${1.22 * stocky} 1) translate(-150 0)` }, body);
  const q = posture * 6; // chest forward (+) or back (-), belly the other way
  // torso + legs in one outline (legs together; the near leg hides the far one, the far heel peeks out behind)
  svg('path', { d: `M132,150 C122,160 110,172 104,192 C99,218 102,256 106,296 C110,336 110,380 106,420 C103,446 102,476 112,520 ` +
    `C118,560 121,620 119,670 C117,722 113,792 111,852 L109,884 C107,894 110,902 120,902 L200,902 C210,902 211,889 201,883 ` +
    `C185,875 170,868 163,857 C160,800 163,742 165,692 C167,670 172,652 170,632 C168,582 170,542 173,502 C175,482 177,466 ${177 - q},450 ` +
    `C${179 - q},420 ${185 - q},390 ${187 - q * 0.5},350 C${190 + q},312 ${193 + q},272 ${191 + q},242 C${189 + q},212 182,194 170,180 C164,172 160,164 160,150 Z` +
    // far heel behind
    'M104,884 L102,902 L122,902 L118,884 Z' }, sc);
  // front arm, pinned at the shoulder (148,190): upper arm, elbow break, forearm, loosely closed hand
  const arm = svg('g', {}, sc);
  svg('path', { d: 'M122,196 C120,176 136,166 152,166 C168,166 180,178 178,198 C176,226 170,256 167,284 L165,358 C167,396 168,432 170,468 ' +
    'C172,494 172,512 174,526 C174,540 160,544 154,532 C148,518 146,496 144,470 C140,438 137,400 136,362 L130,284 C127,256 124,226 122,196 Z' }, arm); // deltoid cap at the top
  // head + neck, pinned at the neck (148,168); scaled about the pin so the head is ≈ 1/7.5 of the height
  const head = svg('g', {}, sc);
  const hs = svg('g', { transform: 'translate(150 150) scale(1.08) translate(-150 -150)' }, head);
  svg('path', { d: 'M134,174 L136,142 C122,134 112,116 112,92 C112,66 128,48 152,46 C170,46 180,56 182,70 C183,78 182,84 184,90 ' +
    'L193,103 C195,107 192,110 186,110 C188,114 188,118 185,120 C187,124 186,128 182,131 C180,138 174,142 165,143 L163,174 Z' }, hs);
  if (cap) svg('path', { d: 'M108,70 C104,58 110,46 126,42 C150,34 178,26 198,28 C206,30 208,40 202,50 L196,60 C198,64 200,66 200,68 ' +
    'C206,70 211,73 213,77 C204,80 192,79 182,75 L114,76 C110,75 108,73 108,70 Z' }, hs); // peaked cap: crown higher at the front, visor down
  else svg('path', { d: 'M110,88 C106,64 122,44 150,42 C172,41 186,52 186,66 C176,58 160,58 150,62 C136,66 124,76 118,94 Z' }, hs); // short hair
  const set = ({ nod = 0, arm: a = 0, lean = 0 } = {}) => {
    head.setAttribute('transform', `rotate(${nod} 148 168)`);
    arm.setAttribute('transform', `rotate(${a - 4} 150 190)`);
    body.setAttribute('transform', `rotate(${lean} 150 902)`);
  };
  set();
  return { g, set, head, arm };
}

/** Draw a silhouette path (SUB, DESTROYER, TORPEDO) into a group, scaled to width w with its top-left at (0,0). */
export function shape(parent, S, { fill = C.ink, filter, name, w = S.w, field } = {}) {
  const g = svg('g', { 'data-name': name ?? 'Silhouette' }, parent);
  const mid = svg('g', { filter: filter ?? '' }, g); // filter in (unscaled) screen-ish units → same edge everywhere
  const inner = svg('g', { transform: `scale(${w / S.w})` }, mid);
  svg('path', { d: S.d, fill }, inner);
  if (S.rings && field) for (const x of S.rings) svg('rect', { x, y: 36, width: 4, height: 56, fill: field }, inner);
  return g;
}
