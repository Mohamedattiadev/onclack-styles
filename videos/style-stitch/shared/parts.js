// Small parts shared by the scenes: the sewn-on cotton label (source / honesty notes) and the wooden hoop.
import { rand, smootherstep } from '/onclack-styles/engine/lib/anim.js';
import { PAL, rgb, Cloth } from './stitch.js';

export const FONT = "'Newsreader', serif";

/**
 * A strip of cotton twill tape tacked onto the cloth with two small stitches, printed with a short note.
 * Appears at t0 (it is "sewn on" with its two tacks). Text size in fabric units.
 */
export function label(cloth, { x, y, text, size = 26, rot = -0.02, t0 = -9, name = 'Label', color = PAL.charcoal }) {
  const g0 = cloth.g;
  g0.save(); g0.font = `600 ${size}px ${FONT}`; const tw = g0.measureText(text).width; g0.restore();
  const padX = size * 0.75, h = size * 1.55, w = tw + padX * 2;
  cloth.custom((g, t) => {
    const a = smootherstep((t - t0) / 0.2);
    g.translate(x, y); g.rotate(rot); g.globalAlpha = a;
    // shadow + tape
    g.fillStyle = rgb(cloth.shadowCol, cloth.shadowA * 0.8); g.fillRect(2, 3, w, h);
    g.fillStyle = 'rgb(236,231,216)'; g.fillRect(0, 0, w, h);
    // twill weave: fine diagonal ribs, fixed (seeded) — never per frame
    g.strokeStyle = 'rgba(150,135,110,0.16)'; g.lineWidth = 1; g.beginPath();
    for (let i = -h; i < w; i += 3.2) { g.moveTo(i, h); g.lineTo(i + h * 0.6, 0); }
    g.stroke();
    // woven selvedge lines
    g.fillStyle = 'rgba(120,100,80,0.22)'; g.fillRect(0, 2.5, w, 1.2); g.fillRect(0, h - 3.7, w, 1.2);
    // cut ends, slightly frayed
    g.strokeStyle = 'rgba(236,231,216,0.9)'; g.lineWidth = 0.8; g.beginPath();
    for (let i = 0; i < 9; i++) { const yy = 3 + (i / 8) * (h - 6), l = 1.5 + rand(i * 7.1 + x) * 4; g.moveTo(0, yy); g.lineTo(-l, yy + 0.6); g.moveTo(w, yy); g.lineTo(w + l, yy - 0.5); }
    g.stroke();
    // printed text (ink sits in the weave: slightly soft)
    g.fillStyle = rgb(color, 0.92); g.font = `600 ${size}px ${FONT}`; g.textBaseline = 'middle';
    g.fillText(text, padX, h * 0.53);
    g.globalAlpha = 1;
  }, t0);
  // two tacking stitches at the ends (thread matches the cloth's darkest thread)
  const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  cloth.run([[P(padX * 0.35, h * 0.2), P(padX * 0.35, h * 0.8)], [P(w - padX * 0.35, h * 0.8), P(w - padX * 0.35, h * 0.2)]], { t0: t0 + 0.02, rate: 30, color: PAL.charcoal, w: 2.2, needle: false });
  cloth.name(name, [x, y, w, h], t0);
  return { w, h };
}

/** Wooden embroidery hoop (inner + outer ring, brass screw at the top). Outside the hoop the cloth lies loose. */
export function hoop(cloth, { cx, cy, r, band = 26, name = 'Hoop' }) {
  const ringW = band;
  cloth.over = (g, t, z) => {
    // loose cloth outside the hoop: darker, with soft folds (fixed, seeded)
    g.save();
    g.beginPath(); g.rect(cx - r * 6, cy - r * 6, r * 12, r * 12); g.arc(cx, cy, r + ringW * 0.5, 0, Math.PI * 2, true); g.clip('evenodd');
    g.fillStyle = 'rgba(60,40,20,0.20)'; g.fillRect(cx - r * 6, cy - r * 6, r * 12, r * 12);
    // a few soft, curved folds where the loose cloth drapes (fixed, seeded)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3 + rand(i * 3.3) * 0.5, r0 = r + ringW * 1.2, r1 = r * (1.5 + rand(i * 5.1) * 0.6), bend = (rand(i * 7.7) - 0.5) * 0.35;
      const p0 = [cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], p2 = [cx + Math.cos(a + bend) * r1, cy + Math.sin(a + bend) * r1];
      const p1 = [cx + Math.cos(a + bend * 0.2) * (r0 + r1) / 2, cy + Math.sin(a + bend * 0.2) * (r0 + r1) / 2];
      const gr = g.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
      gr.addColorStop(0, 'rgba(50,30,12,0.13)'); gr.addColorStop(1, 'rgba(50,30,12,0)');
      g.strokeStyle = gr; g.lineWidth = 40 + rand(i * 9.7) * 40; g.lineCap = 'round'; g.filter = 'blur(14px)';
      g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); g.stroke();
      g.strokeStyle = gr; g.lineWidth = 3; g.filter = 'blur(2px)'; g.globalAlpha = 0.6;
      g.beginPath(); g.moveTo(p0[0] - 18, p0[1] - 18); g.quadraticCurveTo(p1[0] - 18, p1[1] - 18, p2[0] - 18, p2[1] - 18); g.stroke();
      g.globalAlpha = 1; g.filter = 'none';
    }
    g.restore();
    // inner shadow of the ring on the taut cloth
    g.save();
    const sh = g.createRadialGradient(cx + 4, cy + 6, r - 30, cx + 4, cy + 6, r);
    sh.addColorStop(0, 'rgba(50,30,10,0)'); sh.addColorStop(1, 'rgba(50,30,10,0.32)');
    g.fillStyle = sh; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.restore();
    // the ring: shadow, wood body, grain, edge highlight
    g.save();
    g.lineWidth = ringW; g.strokeStyle = 'rgba(40,24,8,0.45)'; g.beginPath(); g.arc(cx + 5, cy + 9, r + ringW * 0.5, 0, 7); g.stroke();
    const wood = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    wood.addColorStop(0, '#d9b27c'); wood.addColorStop(0.5, '#c39360'); wood.addColorStop(1, '#a5733f');
    g.strokeStyle = wood; g.beginPath(); g.arc(cx, cy, r + ringW * 0.5, 0, 7); g.stroke();
    // grain: long thin arcs at seeded radii
    g.lineWidth = 1.1; g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const rr = r + 2 + rand(i * 1.9) * (ringW - 4), a0 = rand(i * 4.7) * 6.28, l = 0.4 + rand(i * 2.3) * 1.4;
      g.strokeStyle = `rgba(110,66,28,${0.18 + rand(i * 8.1) * 0.25})`; g.beginPath(); g.arc(cx, cy, rr, a0, a0 + l); g.stroke();
    }
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,236,200,0.55)'; g.beginPath(); g.arc(cx, cy, r + ringW - 2, Math.PI * 0.95, Math.PI * 1.6); g.stroke();
    g.strokeStyle = 'rgba(80,46,16,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r + 1, 0, 7); g.stroke();
    // brass screw clamp at the top
    const bx = cx, by = cy - r - ringW * 0.5;
    g.fillStyle = 'rgba(40,24,8,0.4)'; g.fillRect(bx - 24 + 4, by - 30 + 7, 48, 38);
    const br = g.createLinearGradient(bx - 24, 0, bx + 24, 0); br.addColorStop(0, '#8a6a2c'); br.addColorStop(0.4, '#e2c27a'); br.addColorStop(1, '#7a5a20');
    g.fillStyle = br; g.fillRect(bx - 24, by - 30, 48, 38);
    g.fillStyle = 'rgba(60,40,10,0.5)'; for (let i = 0; i < 6; i++) g.fillRect(bx - 22 + i * 8, by - 50, 3, 22);
    g.fillStyle = br; g.beginPath(); g.ellipse(bx, by - 52, 26, 9, 0, 0, 7); g.fill();
    g.restore();
  };
  cloth.name(name, [cx - r - ringW, cy - r - ringW, 2 * (r + ringW), 2 * (r + ringW)]);
}
