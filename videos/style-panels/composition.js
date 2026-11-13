// STYLE TEST — INK PANELS ("a graphic-novel page made live"). 4 voice paragraphs = 4 tiers of one page.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Ink Panels (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#F2EEE4',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1', label: '1 · Date + map panel → depth panel with the sub', module: './scenes/s1-date-map.js', duration: 7 },
    { id: 's2', label: '2 · Charges from above (WHUMM) → Moscow: empty balloon', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3', label: '3 · Torpedo panel → three slanted vote panels, two YES', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4', label: '4 · Full-bleed NO → inset: 40 years later', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
