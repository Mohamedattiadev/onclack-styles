// DATELINE + RUNNING HEAD — runs under the whole film (z above the overlays).
// 0–5 s: the dateline is the hero, set word by word as the voice says it (US order = spoken order).
// Then it collapses into a mono running head; at "forty years later" its year rolls 1962 → 2002 (odometer).
import { el, svg, clamp, progress, lerp } from '/onclack-styles/engine/lib/anim.js';
import { C, wordAt, LEAD, enterP, exitP, life, tok } from '../shared/contour.js';

export default function (root, ctx) {
  const L = ctx.layout, px = L.px, s = L.safe;
  const wt = (w, n) => wordAt(ctx.words, w, n);
  const T = {
    rule: wt('October') - 0.3, oct: wt('October') - LEAD, day: wt('twenty-seventh') - LEAD, year: wt('nineteen') - LEAD,
    kick: wt('A') - 0.2, out: wt('hides') + 0.05, head: wt('deep') + 0.2,
    roll0: wt('forty') - LEAD, roll1: wt('later') + 0.25,
  };

  // ---------- big dateline (top-left of the safe area, on the 12-col grid: cols 1–7) ----------
  const block = el('div', { class: 'ov', 'data-name': '1A Dateline block', style: { transform: `translate(${s.x}px, ${s.y}px)` } }, root);
  const rs = svg('svg', { width: px(L.portrait ? 860 : 900), height: px(4), style: { display: 'block', overflow: 'visible' } }, block);
  const rule = svg('path', { d: `M0 ${px(1)}H${px(L.portrait ? 860 : 900)}`, stroke: C.ink, 'stroke-width': px(2), fill: 'none' }, rs);
  rule.setAttribute('pathLength', 1); rule.setAttribute('stroke-dasharray', '1 1');
  const kicker = el('div', { class: 'kicker', 'data-name': '1A Kicker', style: { marginTop: px(16) + 'px' } }, block);
  kicker.innerHTML = 'Cuban Missile Crisis <span class="dim">·</span> Day 12 of 13';
  const date = el('div', { class: 'dateline', 'data-name': '1A Date', style: { marginTop: px(14) + 'px' } }, block);
  const word = (txt, cls = '') => { const w = el('span', { class: 'w' }, date); const i = el('span', { class: cls }, w, txt); return { w, i }; };
  const wOct = word('October'); date.append(' ');
  const wDay = word('27,', 'num');
  if (L.portrait) date.append(el('br'));
  else date.append(' ');
  const wYear = word('1962', 'num');
  const dl = 1;
  if (L.portrait) date.style.fontSize = px(122 * dl) + 'px';
  const sub = el('div', { class: 'monoline', 'data-name': '1A Weekday line', style: { marginTop: px(18) + 'px' } }, block);
  sub.innerHTML = 'Saturday <span class="dim">· the day the crisis peaked</span>';
  date.style.textShadow = kicker.style.textShadow = sub.style.textShadow = `0 0 ${px(6)}px ${C.bone}, 0 0 ${px(6)}px ${C.bone}`;

  // ---------- running head (mono, small, stays for the rest of the film) ----------
  const head = el('div', { class: 'ov runhead', 'data-name': 'Running head (date · position)' }, root);
  const hDay = el('span', {}, head, '27 OCT');
  const hYear = el('span', { style: { display: 'inline-flex' } }, head);
  const cols = [3, 2, 1, 0].map(k => {
    const box = el('span', { class: 'digit' }, hYear);
    const strip = el('span', {}, box);
    const a = el('span', {}, strip, '0'), b = el('span', {}, strip, '0'); // current + next digit only
    return { k, strip, a, b };
  });
  const hPos = el('span', { class: 'dim', style: { color: '#6f6a5e', fontWeight: 400 } }, head, '· 24.0°N 70.0°W approx.');
  const hRule = el('div', { 'data-name': 'Running head rule', style: { position: 'absolute', left: 0, top: 0, height: px(2) + 'px', background: C.ink } }, root);

  return {
    update(t, p, gt = ctx.start + t) {
      // dateline: rule draws, words rise out of their own baseline boxes (type being set, not floating in)
      const out = exitP(gt, T.out, 12);
      block.style.opacity = (1 - out).toFixed(3);
      block.style.display = out >= 1 ? 'none' : '';
      rule.setAttribute('stroke-dashoffset', (1 - tok.enter(progress(gt, T.rule, T.rule + 0.6))).toFixed(4));
      const rise = (w, t0) => {
        const e = enterP(gt, t0, 16);
        w.i.style.transform = `translateY(${((1 - e) * 105).toFixed(2)}%)`;
      };
      rise(wOct, T.oct); rise(wDay, T.day); rise(wYear, T.year);
      kicker.style.opacity = enterP(gt, T.rule + 0.15, 14).toFixed(3);
      sub.style.opacity = enterP(gt, T.kick, 16).toFixed(3);
      sub.style.transform = `translateY(${((1 - enterP(gt, T.kick, 16)) * px(12)).toFixed(2)}px)`;
      // the whole block drifts up a few px while it holds (never dead still)
      block.style.transform = `translate(${s.x}px, ${(s.y - px(10) * progress(gt, 0, T.out) - px(24) * out).toFixed(2)}px)`;

      // running head
      const hIn = enterP(gt, T.head, 16);
      const hx = s.x, hy = s.y;
      head.style.opacity = hIn.toFixed(3);
      head.style.display = hIn <= 0.001 ? 'none' : '';
      head.style.transform = `translate(${hx}px, ${(hy + px(14)).toFixed(2)}px)`;
      hRule.style.transform = `translate(${hx}px, ${hy}px)`;
      hRule.style.width = (px(L.portrait ? 300 : 420) * tok.enter(progress(gt, T.head, T.head + 0.6))).toFixed(2) + 'px';
      hRule.style.display = gt < T.head ? 'none' : '';
      // year odometer 1962 → 2002, camera-token ease (slow start, long settle)
      const r = tok.move(progress(gt, T.roll0, T.roll1));
      const v = lerp(1962, 2002, r);
      for (const c of cols) {
        const pw = 10 ** c.k;
        let pos = Math.floor(v / pw) % 10;
        const rem = v % pw;
        if (c.k === 0) pos = v % 10;
        else if (rem > pw - 1) pos += rem - (pw - 1);
        const d0 = Math.floor(pos) % 10, fr = pos - Math.floor(pos);
        c.a.textContent = String(d0); c.b.textContent = String((d0 + 1) % 10);
        c.b.style.opacity = fr > 0.001 ? 1 : 0;
        c.strip.style.transform = `translateY(${(-fr * 1.2).toFixed(4)}em)`;
      }
      hDay.textContent = '27 OCT';
      const dayFade = progress(gt, T.roll0, T.roll0 + 0.3);
      if (dayFade >= 1) hDay.textContent = 'OCT';
      hDay.style.opacity = dayFade >= 1 ? enterP(gt, T.roll0 + 0.3, 10).toFixed(3) : (1 - dayFade).toFixed(3);
      hPos.textContent = gt >= T.roll0 + 0.3 ? '· Havana' : '· 24.0°N 70.0°W approx.';
      hPos.style.opacity = gt >= T.roll0 + 0.3 ? enterP(gt, T.roll0 + 0.3, 12).toFixed(3) : (1 - progress(gt, T.roll0, T.roll0 + 0.3)).toFixed(3);
      void clamp; void life;
    },
  };
}
