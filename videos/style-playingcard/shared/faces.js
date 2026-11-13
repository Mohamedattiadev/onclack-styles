// CARD DECK — every card face is our own design, printed in four flat inks on cream card stock.
// Rules of the deck (kept on every card):
//   1. Four flat print inks only: red, blue, ochre, black. No gradients, no shading inside a card.
//   2. Colour inks sit slightly off-register (seeded 0.5–1.2 unit shift); the black keyline never moves.
//   3. Court cards are mirror-symmetric (upper half rotated 180° for the lower half), split by a hairline.
//   4. Figures are flat shapes: plain oval heads with NO facial features, still postures, hands low.
//   5. Indices in two corners (top-left, bottom-right upside down), slab serif, with the card's own suit pip.
//   6. Card backs: oxblood with a cream wave lattice. On the table only ONE card ever shows its back: the NO.
export const C = {
  felt: '#3A4250',
  stock: '#F2EBDA',
  stockShade: '#E7DDC6',
  edge: '#C9BC9C',
  red: '#BF3A2B',
  blue: '#24427C',
  ochre: '#D6A23B',
  ink: '#1D1B19',
  back: '#7A2520',
  backLine: '#EBD9B6',
  chalk: 'rgba(238,230,212,0.86)',
  tintO: '#EBDDBA', tintR: '#EED2C4', tintB: '#D3DAE3',
};
export const IDX = "'Alfa Slab One', serif";
export const SANS = "'Sofia Sans Extra Condensed', sans-serif";
export const NOTE = "'Fraunces', serif";

const r1 = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- suit pips (centred on 0,0, about ±18 units) ---------- */
export const PIP = {
  anchor: (c = C.red) => `<g fill="none" stroke="${c}" stroke-width="4.2" stroke-linecap="round"><circle cx="0" cy="-15" r="4.5"/><path d="M0 -10.5V16M-9 -4H9M-15 5Q-13 18 0 18Q13 18 15 5"/></g>`,
  wave: (c = C.blue) => `<path d="M-19 3Q-14 -7 -9.5 3T0 3T9.5 3T19 3" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M-19 13Q-14 3 -9.5 13T0 13T9.5 13T19 13" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.9"/>`,
  ship: (c = C.blue) => `<g fill="${c}"><path d="M-22 1H22L18 9H-19Z"/><path d="M-9 1V-6H7V1Z"/><path d="M-4 -6V-12H1V-6Z"/><rect x="10" y="-13" width="2" height="14"/></g>`,
  mast: (c = C.ink) => `<g fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"><path d="M0 -12L-9 17M0 -12L9 17M-5 6H5"/><path d="M-9 -17Q-14 -10 -9 -3M9 -17Q14 -10 9 -3" stroke-width="2.4" stroke-dasharray="2 3"/></g>`,
  barrel: (c = C.ochre) => `<g><rect x="-10" y="-15" width="20" height="30" rx="4" fill="${c}"/><rect x="-10" y="-8" width="20" height="4" fill="${C.ink}"/><rect x="-10" y="5" width="20" height="4" fill="${C.ink}"/></g>`,
  bolt: (c = C.red) => `<path d="M-6 -17H8L1 -3H9L-7 17L-2 1H-10Z" fill="${c}"/>`,
};

/* ---------- shape list → misregistered colour layer + fixed keyline ---------- */
// each shape: [tag, attrs, fill, keyline?]
function layer(shapes, seed) {
  const mx = ((r1(seed) - 0.5) * 2.4).toFixed(2), my = ((r1(seed + 3) - 0.5) * 2.4).toFixed(2);
  const attr = (a) => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');
  const fills = shapes.filter((s) => s[2] && s[2] !== 'none').map(([tag, a, f]) => `<${tag} ${attr(a)} fill="${f}"/>`).join('');
  const lines = shapes.filter((s) => s[3] !== false).map(([tag, a]) => `<${tag} ${attr(a)} fill="none" stroke="${C.ink}" stroke-width="1.7" stroke-linejoin="round"/>`).join('');
  return `<g transform="translate(${mx} ${my})">${fills}</g>${lines}`;
}
const mirror = (s) => `${s}<g transform="rotate(180 125 175)">${s}</g>`;

function frame(body, { idx, pip, idxColor = C.ink, seed = 1, idxSize }) {
  const sz = idxSize || (String(idx).length > 2 ? 20 : String(idx).length > 1 ? 30 : 36);
  const corner = `<text x="25" y="${18 + sz}" font-family="${IDX}" font-size="${sz}" fill="${idxColor}" text-anchor="middle">${idx}</text>` +
    `<g transform="translate(25 ${40 + sz}) scale(0.62)">${pip}</g>`;
  // card stock: faint paper fibre dots (seeded, static) so the cream is not a flat digital fill
  let dots = '';
  for (let i = 0; i < 26; i++) dots += `<circle cx="${(12 + r1(seed * 31 + i) * 226).toFixed(1)}" cy="${(12 + r1(seed * 17 + i * 3) * 326).toFixed(1)}" r="${(0.5 + r1(i + seed) * 0.8).toFixed(2)}" fill="#BFAF8C" opacity="0.35"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 350" width="100%" height="100%" style="display:block">` +
    `<rect x="0.6" y="0.6" width="248.8" height="348.8" rx="17" fill="${C.stock}" stroke="${C.edge}" stroke-width="1.2"/>${dots}` +
    body + corner + `<g transform="rotate(180 125 175)">${corner}</g></svg>`;
}

/* ---------- court frame: double rule + split hairline ---------- */
const courtFrame = (tint) => [
  ['rect', { x: 52, y: 46, width: 146, height: 258, rx: 4 }, tint, true],
];
const courtLines = `<rect x="56.5" y="50.5" width="137" height="249" rx="2" fill="none" stroke="${C.red}" stroke-width="1.1"/>` +
  `<path d="M52 175H198" stroke="${C.ink}" stroke-width="1.5"/><path d="M125 169L131 175L125 181L119 175Z" fill="${C.ochre}" stroke="${C.ink}" stroke-width="1"/>`;

/* ---------- officers: half figure, waist up, in the upper half (y 52..175) ---------- */
function officerHalf(v) {
  const hx = [-4, 3, 0][v], hy = [0, 0, 3][v];
  const coat = [C.blue, C.ink, C.blue][v];
  const S = [];
  // coat with slight shoulder tilt per figure (weight on one side)
  const tl = [0, 4, -3][v], tr = [0, -2, 3][v];
  S.push(['path', { d: `M60 175C61 148 66 ${132 + tl} 92 ${124 + tl}L113 119L125 142L137 119L158 ${124 + tr}C184 ${132 + tr} 189 148 190 175Z` }, coat]);
  S.push(['path', { d: 'M113 119L125 142L137 119Z' }, C.stock]);
  S.push(['path', { d: 'M122.5 122H127.5L126.8 139L125 142L123.2 139Z' }, C.ink, false]);
  S.push(['rect', { x: 117, y: 106, width: 16, height: 14 }, C.stock]);
  // epaulettes
  S.push(['rect', { x: 70, y: 124 + tl, width: 28, height: 8, rx: 3, transform: `rotate(-13 84 ${128 + tl})` }, C.ochre]);
  S.push(['rect', { x: 152, y: 124 + tr, width: 28, height: 8, rx: 3, transform: `rotate(13 166 ${128 + tr})` }, C.ochre]);
  // lapel trim (ochre lines) and buttons
  for (const by of [150, 163]) { S.push(['circle', { cx: 110, cy: by, r: 3 }, C.ochre]); S.push(['circle', { cx: 140, cy: by, r: 3 }, C.ochre]); }
  // head: a plain oval, no features
  S.push(['ellipse', { cx: 125 + hx, cy: 96 + hy, rx: 14.5, ry: 17 }, C.stock]);
  // peaked naval cap: crown, band, visor, badge
  const cx = 125 + hx, cy = 65 + hy;
  S.push(['path', { d: `M${cx - 30} ${cy + 2}Q${cx} ${cy - 17} ${cx + 30} ${cy + 2}L${cx + 25} ${cy + 8}L${cx - 25} ${cy + 8}Z` }, C.stock]);
  S.push(['rect', { x: cx - 25, y: cy + 7, width: 50, height: 7 }, C.ink]);
  S.push(['path', { d: `M${cx - 19} ${cy + 14}Q${cx} ${cy + 19} ${cx + 19} ${cy + 14}Z` }, C.ink]);
  S.push(['circle', { cx, cy: cy + 3, r: 3.6 }, C.ochre]);
  // props / hands — each officer holds a different thing, all hands low (no raised arms)
  if (v === 0) { // a rolled sea chart held low and diagonal across the body
    S.push(['rect', { x: 84, y: 148, width: 82, height: 13, rx: 6, transform: 'rotate(-24 125 154)' }, C.stock]);
    S.push(['rect', { x: 84, y: 148, width: 9, height: 13, rx: 3, transform: 'rotate(-24 125 154)' }, C.ochre]);
    S.push(['rect', { x: 157, y: 148, width: 9, height: 13, rx: 3, transform: 'rotate(-24 125 154)' }, C.ochre]);
    S.push(['ellipse', { cx: 104, cy: 165, rx: 8, ry: 6.5 }, C.stock]);
    S.push(['path', { d: 'M70 120 L56 108 L62 102 L78 116Z' }, C.red]); // red pennant on the shoulder line
  } else if (v === 1) { // closed book (the regulations) held flat against the chest
    S.push(['rect', { x: 120, y: 128, width: 36, height: 44, rx: 2, transform: 'rotate(-16 138 150)' }, C.red]);
    S.push(['rect', { x: 124, y: 133, width: 28, height: 4, transform: 'rotate(-16 138 150)' }, C.ochre, false]);
    S.push(['ellipse', { cx: 150, cy: 165, rx: 9, ry: 7 }, C.stock]);
    S.push(['path', { d: 'M74 136L88 132L90 140L76 144Z' }, C.ochre]); // sleeve stripe
  } else { // open hand laid flat on the chest — a still, quiet gesture
    S.push(['path', { d: 'M130 146C134 138 146 136 154 139L162 141C165 142 164 146 161 146L152 145L158 150C160 152 158 155 155 154L147 151C143 156 134 157 130 152Z' }, C.stock]);
    S.push(['path', { d: 'M150 120 L158 108 L166 112 L160 124Z' }, C.ochre]);
  }
  return S;
}
export function officerFace(v, seed) {
  const tint = [C.tintO, C.tintR, C.tintB][v];
  const half = layer([...officerHalf(v)], seed + v);
  const body = layer(courtFrame(tint), seed) + mirror(half) + courtLines;
  return frame(body, { idx: ['I', 'II', 'III'][v], pip: PIP.anchor(), idxColor: C.red, seed: seed + v });
}

/* ---------- B-59: court card, the boat under three sea lines ---------- */
export function subFace(seed) {
  const S = [
    ['path', { d: 'M58 132Q58 120 80 119L178 119Q197 120 198 132Q197 144 178 145L80 145Q58 144 58 132Z' }, C.ink],
    ['path', { d: 'M108 119L113 101L141 101L146 119Z' }, C.ink],
    ['rect', { x: 66, y: 130, width: 120, height: 3.5 }, C.ochre, false],
    ['rect', { x: 124, y: 86, width: 2.6, height: 16 }, C.ink, false],
    ['path', { d: 'M198 132L208 124L208 140Z' }, C.red],
  ];
  const sea = `<g fill="none" stroke="${C.blue}" stroke-width="2.6" stroke-linecap="round">` +
    [62, 71].map((y) => `<path d="M54 ${y}q6 -6 12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0"/>`).join('') + '</g>' +
    `<path d="M125 78V99" stroke="${C.blue}" stroke-width="1.4" stroke-dasharray="3 3"/>` +
    [[90, 158], [100, 165], [160, 160]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${2 + i * 0.6}" fill="none" stroke="${C.blue}" stroke-width="1.3"/>`).join('');
  const body = layer(courtFrame(C.tintB), seed) + mirror(`<g transform="translate(125 132) scale(0.88) translate(-125 -132)">${layer(S, seed + 9)}</g>` + sea) + courtLines;
  return frame(body, { idx: 'B59', pip: PIP.anchor(), idxColor: C.red, seed });
}

/* ---------- the date: a "27" that no real deck has ---------- */
export function dateFace(seed) {
  const body = layer([['rect', { x: 46, y: 196, width: 158, height: 38, rx: 3 }, C.blue]], seed) +
    `<text x="125" y="178" font-family="${IDX}" font-size="104" fill="${C.red}" text-anchor="middle">27</text>` +
    `<text x="125" y="224" font-family="${SANS}" font-weight="800" font-size="30" letter-spacing="3" fill="${C.stock}" text-anchor="middle">OCT · 1962</text>` +
    mirror(`<g transform="translate(125 64)">${PIP.wave()}</g>`.replace('translate(125 64)', 'translate(125 66)'));
  return frame(body, { idx: '27', pip: PIP.wave(), idxColor: C.blue, seed });
}

/* ---------- Cuba: island over the sea, the boat small and deep ---------- */
export function cubaFace(seed) {
  const isl = 'M40 128C58 116 78 116 96 122C114 128 128 131 146 137C162 142 182 144 202 150L212 157C197 160 181 156 165 154C150 152 139 150 127 146C111 141 99 136 85 133C70 130 56 133 43 134Z';
  const S = [['path', { d: isl }, C.ochre], ['path', { d: 'M74 165H86L80 175Z' }, C.red]];
  const sea = `<g fill="none" stroke="${C.blue}" stroke-width="2.2" stroke-linecap="round" opacity="0.95">` +
    [178, 192, 206, 220].map((y, i) => `<path d="M${46 + i * 6} ${y}q7 -6 14 0t14 0t14 0t14 0t14 0t14 0t14 0t14 0t14 0t14 0"/>`).join('') + '</g>' +
    `<path d="M150 228V262" stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="3 3"/>` +
    `<g transform="translate(150 276) scale(0.95)"><path d="M-26 0Q-26 -6 -16 -6H18Q26 -6 26 0Q26 6 18 6H-16Q-26 6 -26 0Z" fill="${C.ink}"/><path d="M-6 -6L-4 -13H6L8 -6Z" fill="${C.ink}"/></g>` +
    `<text x="125" y="96" font-family="${SANS}" font-weight="800" font-size="30" letter-spacing="5" fill="${C.ink}" text-anchor="middle">CUBA</text>`;
  return frame(layer(S, seed) + sea, { idx: 'CU', pip: PIP.wave(), idxColor: C.blue, seed });
}

/* ---------- US destroyers: a pip card of three ships ---------- */
export function shipsFace(seed, n = 3) {
  // ships stay upright in both halves (an upside-down ship would read as sunk)
  const pos = n === 3 ? [[125, 100, 0], [125, 178, 0], [125, 256, 0]] : [[88, 120, 0], [162, 120, 0], [88, 236, 0], [162, 236, 0]];
  const sc = n === 3 ? 2.3 : 1.45;
  const body = pos.map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${sc})">${PIP.ship()}</g>`).join('');
  return frame(layer([], seed) + body, { idx: String(n), pip: PIP.ship(), idxColor: C.blue, seed });
}

/* ---------- practice depth charge ---------- */
export function chargeFace(seed) {
  const burst = `<g stroke="${C.red}" stroke-width="4" stroke-linecap="round">` +
    Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.2, r0 = 50, r1v = i % 2 ? 66 : 76; return `<path d="M${(125 + Math.cos(a) * r0).toFixed(1)} ${(175 + Math.sin(a) * r0).toFixed(1)}L${(125 + Math.cos(a) * r1v).toFixed(1)} ${(175 + Math.sin(a) * r1v).toFixed(1)}"/>`; }).join('') + '</g>';
  const body = layer([], seed) + burst + `<g transform="translate(125 175) scale(2.3)">${PIP.barrel()}</g>` +
    mirror(`<text x="125" y="70" font-family="${SANS}" font-weight="800" font-size="20" letter-spacing="4" fill="${C.ink}" text-anchor="middle">PRACTICE</text>`);
  return frame(body, { idx: 'DC', pip: PIP.barrel(), idxColor: C.red, seed });
}

/* ---------- Moscow: a radio mast with its signal printed in grey — silent ---------- */
export function moscowFace(seed) {
  const arcs = [26, 44, 62].map((r) => `<path d="M${125 - r} ${110 - r * 0.2}A${r} ${r} 0 0 1 ${125 - r * 0.35} ${110 - r * 0.95}M${125 + r} ${110 - r * 0.2}A${r} ${r} 0 0 0 ${125 + r * 0.35} ${110 - r * 0.95}" fill="none" stroke="#B9AE96" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"/>`).join('');
  const mast = `<g fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"><path d="M125 92L100 262M125 92L150 262M106 222H144M111 182H139M116 142H134M106 222L139 182M111 182L134 142"/></g><circle cx="125" cy="90" r="5" fill="${C.red}"/>`;
  const body = layer([['rect', { x: 46, y: 270, width: 158, height: 34, rx: 3 }, C.red]], seed) + arcs + mast +
    `<text x="125" y="296" font-family="${SANS}" font-weight="800" font-size="26" letter-spacing="5" fill="${C.stock}" text-anchor="middle">MOSCOW</text>`;
  return frame(body, { idx: 'M', pip: PIP.mast(), seed });
}

/* ---------- the nuclear torpedo: a single long pip, like an ace ---------- */
export function torpedoFace(seed) {
  const S = [
    ['path', { d: 'M108 296L108 96Q108 60 125 52Q142 60 142 96L142 296Z' }, C.ochre],
    ['rect', { x: 108, y: 92, width: 34, height: 18 }, C.red],
    ['path', { d: 'M108 284L90 314L108 304Z' }, C.ink], ['path', { d: 'M142 284L160 314L142 304Z' }, C.ink],
    ['rect', { x: 113, y: 296, width: 24, height: 9 }, C.ink],
    ['rect', { x: 108, y: 160, width: 34, height: 3 }, C.ink, false], ['rect', { x: 108, y: 236, width: 34, height: 3 }, C.ink, false],
  ];
  const body = layer(S, seed) +
    `<text transform="translate(76 175) rotate(-90)" font-family="${SANS}" font-weight="800" font-size="19" letter-spacing="4" fill="${C.red}" text-anchor="middle">NUCLEAR TORPEDO</text>` +
    `<text transform="translate(184 175) rotate(-90)" font-family="${SANS}" font-weight="800" font-size="19" letter-spacing="4" fill="${C.blue}" text-anchor="middle">ON BOARD B-59</text>`;
  return frame(body, { idx: 'T', pip: PIP.bolt(), idxColor: C.red, seed });
}

/* ---------- our own card back ---------- */
export function backFace() {
  let waves = '';
  for (let row = 0, y = 26; y < 330; y += 13, row++) {
    let d = '';
    for (let x = 18 + (row % 2) * 8; x < 228; x += 16) d += `M${x} ${y}q4 -5 8 0`;
    waves += `<path d="${d}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 350" width="100%" height="100%" style="display:block">` +
    `<rect x="0.6" y="0.6" width="248.8" height="348.8" rx="17" fill="${C.stock}" stroke="${C.edge}" stroke-width="1.2"/>` +
    `<rect x="12" y="12" width="226" height="326" rx="9" fill="${C.back}"/>` +
    `<g transform="translate(0.8 -0.6)" fill="none" stroke="${C.backLine}" stroke-width="1.5" opacity="0.62">${waves}</g>` +
    `<rect x="19" y="19" width="212" height="312" rx="6" fill="none" stroke="${C.backLine}" stroke-width="1.4" opacity="0.85"/>` +
    `<path d="M125 128L160 175L125 222L90 175Z" fill="${C.back}" stroke="${C.backLine}" stroke-width="2.2"/>` +
    `<path d="M125 146L146 175L125 204L104 175Z" fill="none" stroke="${C.backLine}" stroke-width="1.2"/></svg>`;
}
