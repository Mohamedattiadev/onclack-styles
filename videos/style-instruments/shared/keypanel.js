// The key panel (S3 + S4). VO / symbolic: B-59 had no such three-key panel — the "three must agree" rule comes from
// later accounts. The panel says so on its own plate ("illustration") and in README.
import { clamp, el, noise1 } from '/onclack-styles/engine/lib/anim.js';
import { spring } from '/onclack-styles/engine/lib/spring.js';
import { PAL, NARROW, object, enamel, screw, bezel, dialFace, glass, scale, tape, plateLabel, needlePainter, hubPainter, rng } from './kit.js';

const TAU = Math.PI * 2;

/** cx,cy = centre of the lock row; returns handles. Lock spacing 330 world px. */
export function keyPanel(cam, { cx, cy, seed = 300, depth = 0 }) {
  const W = 1240, H = 1060, x0 = cx - W / 2, y0 = cy - H * 0.62;
  const o = cam.add(object(cam.world, { x: x0, y: y0, w: W, h: H + 40, depth, name: '3B Key panel', res: 2 }));
  const locks = [-1, 0, 1].map(i => ({ x: W / 2 + i * 330, y: H * 0.62 }));
  const mx = W / 2, my = H * 0.33, MR = 300; // consent meter pivot + radius
  const roles = [['1 · КОМАНДИР', 'captain'], ['2 · ЗАМПОЛИТ', 'political officer'], ['3 · НАЧ. ШТАБА', 'chief of staff']];
  o.layer(g => {
    g.save(); g.fillStyle = 'rgba(5,6,3,0.55)'; g.filter = 'blur(22px)'; g.fillRect(24, 34, W, H); g.restore();
    enamel(g, 0, 0, W, H, seed, { base: '#666b58', rad: 22, wear: 1.5 });
    [[0.03, 0.03], [0.97, 0.03], [0.03, 0.97], [0.97, 0.97], [0.5, 0.03], [0.5, 0.97]].forEach(([u, v], i) => screw(g, W * u, H * v, 11, seed + i));
    plateLabel(g, W * 0.27, H * 0.035, W * 0.46, 52, 'СОГЛАСИЕ НА ПУСК', seed + 20, { size: 0.55 });
    // consent meter: a window with a 0–3 scale (symbolic)
    const wx = mx - MR * 0.95, wy = my - MR * 0.86, ww = MR * 1.9, wh = MR * 0.98;
    g.fillStyle = '#0d0d0a'; g.beginPath(); g.roundRect(wx - 10, wy - 10, ww + 20, wh + 20, 14); g.fill();
    g.save(); g.beginPath(); g.roundRect(wx, wy, ww, wh, 8); g.clip();
    g.fillStyle = PAL.cream; g.fillRect(wx, wy, ww, wh);
    dialFace(g, mx, wy + wh * 0.4, ww * 0.72, seed + 4);
    scale(g, mx, my, MR, { a0: -56, a1: 56, min: 0, max: 3, major: 1, minor: 0.25, red: [2.5, 3], font: 1.35 });
    g.fillStyle = PAL.ink; g.font = `700 ${MR * 0.085}px ${NARROW}`; g.textAlign = 'center'; g.fillText('ОФИЦЕРОВ  ·  officers', mx, my - MR * 0.22);
    const sh = g.createLinearGradient(0, wy, 0, wy + wh * 0.35); sh.addColorStop(0, 'rgba(60,50,30,0.4)'); sh.addColorStop(1, 'rgba(60,50,30,0)');
    g.fillStyle = sh; g.fillRect(wx, wy, ww, wh);
    g.restore();
    // locks
    locks.forEach((L, i) => {
      // engraved position marks: 0 (up) and I (right, 90°)
      g.fillStyle = '#e1dac4'; g.font = `700 34px ${NARROW}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('0', L.x, L.y - 112); g.fillText('I', L.x + 112, L.y);
      g.strokeStyle = '#e1dac4'; g.lineWidth = 3; g.beginPath(); g.moveTo(L.x, L.y - 92); g.lineTo(L.x, L.y - 80); g.moveTo(L.x + 92, L.y); g.lineTo(L.x + 80, L.y); g.stroke();
      bezel(g, L.x, L.y, 48, 22, 'brass', seed + i * 7);
      const cg = g.createRadialGradient(L.x - 14, L.y - 16, 4, L.x, L.y, 48);
      cg.addColorStop(0, '#d9d8cf'); cg.addColorStop(0.6, '#8e8d84'); cg.addColorStop(1, '#4b4a44');
      g.fillStyle = cg; g.beginPath(); g.arc(L.x, L.y, 48, 0, TAU); g.fill();
      // keyway (vertical, the "0" position)
      g.fillStyle = '#0b0b09'; g.beginPath(); g.roundRect(L.x - 6, L.y - 30, 12, 60, 4); g.fill();
      g.fillStyle = 'rgba(255,255,250,0.25)'; g.fillRect(L.x + 6, L.y - 28, 1.5, 56);
      tape(g, L.x - 150, L.y + 150, 300, 104, roles[i], seed + 40 + i, { rot: (rng(seed + i)() - 0.5) * 0.07, size: 0.44 });
    });
    g.fillStyle = 'rgba(225,218,196,0.75)'; g.font = `400 26px ${NARROW}`; g.textAlign = 'right';
    g.fillText('illustration · not the real B-59 panel', W - 70, H - 30);
  }, { name: '3B Panel body' });

  const setNeedle = o.part(MR * 2.1, MR * 2.1, MR * 1.05, MR * 1.05, mx, my, needlePainter(MR * 0.92, { width: 0.035, tail: 0.05 }), { shadow: 8, name: '3B Consent needle' });
  // keys: bow seen at a slight angle (foreshortened), rotating with the cylinder; a numbered tag hangs from the bow
  const keyPaint = (g, pw, ph, isShadow) => {
    const c = pw / 2, m = ph / 2;
    const steel = g.createLinearGradient(c - 40, 0, c + 40, 0);
    steel.addColorStop(0, '#5f5f58'); steel.addColorStop(0.35, '#d7d6cc'); steel.addColorStop(0.6, '#8a8a80'); steel.addColorStop(1, '#3d3d38');
    g.fillStyle = isShadow ? '#000' : steel;
    g.beginPath(); g.roundRect(c - 9, m - 70, 18, 82, 4); g.fill();                       // neck
    g.beginPath(); g.ellipse(c, m - 118, 36, 54, 0, 0, TAU); g.fill();                     // bow
    if (!isShadow) {
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(c, m - 140, 9, 12, 0, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(255,255,250,0.35)'; g.lineWidth = 2; g.beginPath(); g.ellipse(c, m - 118, 31, 49, 0, 3.6, 5.2); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(c, m - 118, 33, 51, 0, 0.3, 1.9); g.stroke();
      g.fillStyle = 'rgba(30,30,25,0.6)'; g.font = `700 22px ${NARROW}`; g.textAlign = 'center'; g.fillText('№', c, m - 100);
    }
  };
  const keys = [0, 1].map(i => o.part(160, 360, 80, 200, locks[i].x, locks[i].y, keyPaint, { shadow: 10, name: `3B Key ${i + 1}` }));
  const tagPaint = n => (g, pw, ph, isShadow) => {
    const c = pw / 2;
    g.strokeStyle = isShadow ? '#000' : '#9a9a90'; g.lineWidth = 3; g.beginPath(); g.ellipse(c, 14, 10, 13, 0, 0, TAU); g.stroke(); // ring
    g.fillStyle = isShadow ? '#000' : '#cfc6a8'; g.beginPath(); g.roundRect(c - 30, 26, 60, 84, 6); g.fill();
    if (!isShadow) {
      g.fillStyle = '#7d4a24'; g.beginPath(); g.arc(c, 36, 5, 0, TAU); g.fill();
      g.fillStyle = PAL.pencil; g.font = `600 52px 'Caveat'`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), c, 76);
    }
  };
  const tags = [0, 1].map(i => o.part(80, 120, 40, 14, locks[i].x, locks[i].y - 140, tagPaint(i + 1), { shadow: 8, name: `3B Key tag ${i + 1}` }));
  o.layer(g => { // meter glass
    g.save(); g.beginPath(); g.roundRect(mx - MR * 0.95, my - MR * 0.86, MR * 1.9, MR * 0.98, 8); g.clip();
    const rg = g.createLinearGradient(mx - MR, my - MR, mx, my - MR * 0.2);
    rg.addColorStop(0, 'rgba(255,252,240,0.18)'); rg.addColorStop(0.5, 'rgba(255,252,240,0.04)'); rg.addColorStop(1, 'rgba(255,252,240,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H); g.restore();
  }, { name: '3B Meter glass', lowres: true });

  const world = (lx, ly) => ({ x: x0 + lx, y: y0 + ly });
  return {
    o, locks: locks.map(L => world(L.x, L.y)), meter: world(mx, my - MR * 0.4), tape3: world(locks[2].x, locks[2].y + 200),
    /** angles: key turn 0..90 deg (spring), consent value 0..3 */
    set(t, { k1 = 0, k2 = 0, consent = 0, sway = 0 }) {
      const ks = [k1, k2];
      ks.forEach((a, i) => {
        keys[i](a);
        // tag hangs from the bow hole: hole moves with the key, tag swings back to vertical (damped)
        const r = 140, hx = Math.sin(a * Math.PI / 180) * r, hy = -Math.cos(a * Math.PI / 180) * r + r;
        const swing = -a * 0.45 * Math.exp(-sway * 2.2) * Math.cos(sway * 7) + noise1(t * 0.7, i) * 1.2;
        tags[i](swing, hx, hy);
      });
      setNeedle(-56 + clamp(consent, -0.05, 3.1) / 3 * 112);
    },
  };
}
