// 2 · RISING. 2A: worm's-eye from the boat's deck up to the surface: two U.S. hulls slide over, small practice charges
// sink straight at the lens and burst (yellow 3-frame marks). Hard cut on the pause → 2B: the radio set lunges at the
// lens, its needle never moves; "DAYS" echo-stacks.
// intent: KNOW U.S. ships signal from above, Moscow silent · FEEL pressure → isolation · SEE a charge filling the lens.
// truth: VO/RC (toy reconstruction; charges = practice/signal charges, sizes not to scale).
import { el, clamp, spring, springs, shake } from '/onclack-styles/engine/lib/anim.js';
import { C, F, wordT, thrust, layer, field, grain, echo, tag, popIn, doodleLayer, smear, bake, paint, mix } from '../shared/toy.js';
import { SHIP, shipBelow, CAN, canister, BURST, burst, RADIO, radio, surfaceBand } from '../shared/props.js';

export default function (root, ctx) {
  const L = ctx.layout, W = L.width, H = L.height, port = L.portrait;
  const T = {
    amer: wordT(ctx, 'American', 0, 0.86) - 2 * F,
    ships: wordT(ctx, 'ships', 0, 1.42) - 2 * F,
    drop: wordT(ctx, 'drop', 0, 1.74) - 2 * F,
    prac: wordT(ctx, 'practice', 0, 2.07) - 2 * F,
    charges: wordT(ctx, 'charges', 0, 2.84) - 2 * F,
    moscow: wordT(ctx, 'Moscow', 0, 3.74) - 2 * F,
    silent: wordT(ctx, 'silent', 0, 4.72) - 2 * F,
    days: wordT(ctx, 'days', 0, 5.28) - 2 * F,
  };
  const cut = T.moscow - 0.12; // in the voice pause after "charges."
  const bursts = [T.charges + 0.06, T.charges + 0.27, T.charges + 0.47].map((b) => Math.min(b, cut - 0.1));

  // ---------------- sound ----------------
  ctx.ambience('sea-water-close-01', { from: 0, to: cut + 0.6, lu: -15, fade: 0.4 });
  ctx.sfx('boom-distant-01', bursts[0] + F, { lu: -9 });
  ctx.sfx('boom-slapback-01', bursts[2] + F, { lu: -11 });
  ctx.sfx('door-creak-01', T.silent - 0.3, { lu: -23 });

  // ================= 2A charges =================
  const A = el('div', { 'data-name': '2A Charges shot', style: { position: 'absolute', inset: '0', zIndex: 1, overflow: 'hidden' } }, root);
  const world = el('div', { 'data-name': '2A World', style: { position: 'absolute', inset: '0' } }, A);
  field(world, L, 3);
  const bandH = (port ? 0.2 : 0.18) * H;
  layer(world, surfaceBand(W, bandH, 0.5, 9), '2A Sea surface (from below)', W, bandH, 2).set(0, 0, 1, 0, 0);
  const ships = [0, 1].map((i) => {
    const w = (port ? [1.5, 0.8] : [0.66, 0.34])[i] * W, h = w * (SHIP.h / SHIP.w);
    const ly = layer(world, shipBelow(Math.min(1.2, (w * 1.2) / SHIP.w), 140 + i * 10), `2A U.S. ship ${i + 1} (hull from below)`, w, h, 3 + i);
    const y = bandH * (port ? 0.62 : 0.66) - h * (SHIP.line / SHIP.h) + (i ? -L.px(10) : 0);
    const x1 = port ? [-0.45 * W, 0.62 * W][i] : [-0.04 * W, 0.64 * W][i];
    const x0 = i ? W * 1.05 : -w * 1.1;
    const t0 = i ? T.ships - 0.1 : T.amer - 0.05;
    return { ly, w, h, y, t0, x: (t) => thrust(t, t0, x0, x1, springs.gentle) + (t - t0) * L.px(i ? -8 : 10) };
  });
  // the boat's own hull in the extreme foreground (we stand on it, looking up)
  const fgH = (port ? 0.16 : 0.22) * H;
  const fg = bake(W, fgH, 0.5, (g, k) => {
    const p = new Path2D(); p.ellipse(W * 0.62, fgH * 1.25, W * 0.85, fgH * 1.05, -0.06, 0, Math.PI * 2);
    paint(g, p, { base: C.hull, lite: C.hullLite, box: [0, 0, W, fgH], k, seed: 160, dir: -0.1, light: [-0.3, -1], size: 3 });
  });
  const fgL = layer(world, fg, '2A Our hull (extreme foreground)', W, fgH, 8);

  const cw = (port ? 0.24 : 0.11) * W, chh = cw * (CAN.h / CAN.w);
  const cans = [0, 1, 2].map((i) => ({
    ly: layer(world, canister(Math.min(2, (cw * 2.4) / CAN.w), 170 + i), `2A Practice charge ${i + 1}`, cw, chh, 6),
    b: layer(world, burst(Math.min(1.2, (cw * 2.6) / BURST.w), 180 + i), `2A Burst ${i + 1}`, cw * 2, cw * 2, 7),
    t0: T.drop - 0.05 + i * 0.22, tb: bursts[i], z0: 3.2, z1: [1.3, 0.95, 0.24][i],
    ship: i === 1 ? 1 : 0, sx: port ? [0.5, 0.3, 0.42][i] : [0.62, 0.45, 0.4][i],
    end: port ? [[0.3, 0.5], [0.72, 0.6], [0.5, 0.48]][i] : [[0.28, 0.56], [0.72, 0.6], [0.52, 0.5]][i],
    spin: [40, -55, 28][i],
  }));
  const canAt = (c, t) => {
    const s = ships[c.ship];
    const p = Math.min(1, spring(t - c.t0, springs.default) * 0.82 + 0.18 * clamp((t - c.t0) / (c.tb - c.t0)));
    const sx = s.x(c.t0) + s.w * c.sx, sy = s.y + s.h * 0.86;
    return { x: sx + (c.end[0] * W - sx) * p, y: sy + (c.end[1] * H - sy) * p, z: c.z0 + (c.z1 - c.z0) * p, p };
  };
  const pracTag = tag(A, 'Practice depth charges', { x: L.safe.x, y: port ? 0.71 * H : L.safe.y + L.safe.h - L.px(56), size: L.px(port ? 36 : 34), name: '2A Charges label' });
  const shipTag = tag(A, 'U.S. Navy', { x: port ? L.safe.x : 0.12 * W, y: bandH + L.px(port ? 40 : 30), size: L.px(port ? 36 : 32), name: '2A Ships label' });

  // ================= 2B radio =================
  const B = el('div', { 'data-name': '2B Radio shot', style: { position: 'absolute', inset: '0', zIndex: 2, overflow: 'hidden', display: 'none' } }, root);
  field(B, L, 4);
  const rw = (port ? 0.98 : 0.6) * W, rh = rw * (RADIO.h / RADIO.w);
  const rbox = el('div', {}, B);
  const rc = radio(Math.min(1.3, (rw * 1.4) / RADIO.w));
  Object.assign(rc.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  rbox.appendChild(rc);
  const rL = layer(B, rbox, '2B Radio set (thrust)', rw, rh, 5);
  // paper tag tied to the set: the line it waits on
  const ptag = el('div', { 'data-name': '2B Moscow tag', style: {
    position: 'absolute', left: '47%', top: '27%', transformOrigin: '50% -40%', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
    fontSize: rw * 0.045 + 'px', letterSpacing: '0.08em', color: C.ink, background: C.cream, padding: '0.35em 0.6em 0.3em', borderRadius: '0.15em 0.15em 0.3em 0.3em',
    boxShadow: `0.1em 0.14em 0 ${mix(C.olive, C.ink, 0.6)}`,
  } }, rbox, 'MOSCOW');
  const rHome = port ? [0.5 * W, 0.62 * H] : [0.42 * W, 0.56 * H];
  const zR = (t) => thrust(t, cut - 0.08, 2.7, 1.0, springs.gentle) - 0.04 * clamp((t - T.silent) / 2);
  const days = port
    ? echo(B, 'DAYS', { x: L.safe.x, y: 0.1 * H, size: L.px(132), times: [T.days, T.days + 4 * F, T.days + 8 * F], name: '2B Days echo' })
    : echo(B, 'DAYS', { x: L.safe.x + L.safe.w, y: 0.16 * H, size: L.px(150), times: [T.days, T.days + 4 * F, T.days + 8 * F], align: 'right', name: '2B Days echo' });

  // ================= marks, smear, grain =================
  const D = doodleLayer(root, L);
  cans.forEach((c, i) => D.add('burst', c.tb, () => { const a = canAt(c, c.tb); return [a.x, a.y]; }, cw * [1.1, 1.3, 2.4][i], 20 + i, 3, `2A burst mark ${i + 1}`));
  const spkAt = () => { const z = zR(T.silent); return [rHome[0] + ((RADIO.spk[0] / RADIO.w - 0.5) * rw) / z, rHome[1] + ((RADIO.spk[1] / RADIO.h - 0.5) * rh) / z]; };
  D.add('flat', T.silent, spkAt, rw * 0.17, 31, 4, '2B flat line on the speaker');
  const sm = smear(root, L, 21, [C.hull, C.fieldLite, C.cream, C.hullLite], { angle: -0.08 });
  const gr = grain(root, L);

  return {
    update(t) {
      const inA = t < cut;
      A.style.display = inA ? '' : 'none';
      B.style.display = inA ? 'none' : '';
      if (inA) {
        let sh = 0;
        for (const b of bursts) sh += shake(t, b, { amp: L.px(7), decay: 0.22 });
        world.style.transform = `translate(${(sh * 0.6).toFixed(1)}px,${sh.toFixed(1)}px)`;
        for (const s of ships) { const k = 0.72 + 0.28 * spring(t - s.t0, springs.gentle); s.ly.set(s.x(t) + s.w / 2, s.y + s.h * (SHIP.line / SHIP.h), k, 0.5, SHIP.line / SHIP.h, 0, 10, L.px(1200)); }
        fgL.set(0, H - fgH + L.px(10) * Math.sin(t * 0.8), 1, 0, 0);
        for (const c of cans) {
          const on = t >= c.t0 && t < c.tb;
          c.ly.el.style.display = on ? '' : 'none';
          if (on) { const a = canAt(c, t); c.ly.set(a.x, a.y, 1 / a.z, 0.5, 0.5, (t - c.t0) * c.spin); }
          const bt = t - c.tb, bon = bt >= 0 && bt < 0.7;
          c.b.el.style.display = bon ? '' : 'none';
          if (bon) { const a = canAt(c, c.tb); c.b.set(a.x, a.y - bt * L.px(60), (0.35 + 0.8 * spring(bt, springs.snappy)) / a.z, 0.5, 0.5); c.b.el.style.opacity = (1 - bt / 0.7).toFixed(3); }
        }
        popIn(shipTag, t, T.ships);
        popIn(pracTag, t, T.prac);
      } else {
        const z = zR(t);
        rL.set(rHome[0], rHome[1], 1 / z, 0.5, 0.5, 0, 8, L.px(1600));
        const sw = Math.exp(-(t - cut) * 2.2) * Math.sin((t - cut) * 9);
        ptag.style.transform = `rotate(${(-6 + 9 * sw).toFixed(2)}deg)`;
        ptag.style.visibility = t >= T.moscow ? 'visible' : 'hidden';
        days.update(t);
      }
      D.update(t);
      sm(t);
      gr(t);
    },
  };
}
