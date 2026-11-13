// Output formats. One composition renders to any of them; scenes adapt through ctx.layout.
// `safe` = fraction of the frame covered by platform UI (approximate, conservative).
export const FORMATS = {
  youtube: {
    label: 'YouTube', short: '16:9', width: 1920, height: 1080,
    safe: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
    zones: [],
  },
  shorts: {
    label: 'YouTube Shorts', short: 'Shorts', width: 1080, height: 1920, maxDuration: 180,
    safe: { top: 0.08, right: 0.14, bottom: 0.2, left: 0.06 },
    zones: [
      { name: 'TOP BAR', x: 0, y: 0, w: 1, h: 0.075 },
      { name: 'BUTTONS', x: 0.86, y: 0.42, w: 0.14, h: 0.43 },
      { name: 'TITLE / CHANNEL', x: 0, y: 0.82, w: 0.86, h: 0.18 },
    ],
  },
  tiktok: {
    label: 'TikTok', short: 'TikTok', width: 1080, height: 1920, maxDuration: 600,
    safe: { top: 0.1, right: 0.16, bottom: 0.24, left: 0.06 },
    zones: [
      { name: 'TABS', x: 0, y: 0, w: 1, h: 0.09 },
      { name: 'BUTTONS', x: 0.84, y: 0.36, w: 0.16, h: 0.5 },
      { name: 'CAPTION / MUSIC', x: 0, y: 0.76, w: 0.84, h: 0.24 },
    ],
  },
};

export const formatList = comp => (comp.formats ?? ['youtube']).filter(f => FORMATS[f]);

/** Layout helper given to every scene as ctx.layout. */
export function makeLayout(name) {
  const f = FORMATS[name] ?? FORMATS.youtube;
  const W = f.width, H = f.height;
  const portrait = H > W;
  const unit = Math.min(W, H) / 1080; // 1 unit = 1px at 1080p short side
  const safe = {
    x: Math.round(W * f.safe.left), y: Math.round(H * f.safe.top),
    w: Math.round(W * (1 - f.safe.left - f.safe.right)), h: Math.round(H * (1 - f.safe.top - f.safe.bottom)),
  };
  safe.cx = safe.x + safe.w / 2; safe.cy = safe.y + safe.h / 2;
  return {
    format: name, label: f.label, width: W, height: H, portrait, landscape: !portrait, unit, safe,
    /** Size in px from "design px" (designed for a 1080 short side). */
    px: n => n * unit,
    /** Choose a value per orientation: pick({ landscape: 120, portrait: 90 }) or per format name. */
    pick: o => (name in o ? o[name] : portrait ? o.portrait : o.landscape),
    /** Point from fractions of the SAFE area: at(0.5, 0.5) = safe centre. */
    at: (fx, fy) => [safe.x + safe.w * fx, safe.y + safe.h * fy],
  };
}

/**
 * Shrink an element's font until it fits maxWidth (and optionally maxHeight). Call after setting text.
 * Deterministic: same text + same box → same size.
 */
export function fitText(el, maxWidth, maxHeight = Infinity, minPx = 10) {
  let size = parseFloat(getComputedStyle(el).fontSize);
  for (let i = 0; i < 40 && size > minPx && (el.scrollWidth > maxWidth + 0.5 || el.scrollHeight > maxHeight + 0.5); i++) {
    size *= 0.94;
    el.style.fontSize = size + 'px';
  }
  return size;
}
