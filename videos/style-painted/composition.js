// STYLE TEST — PAINTED SHORT: hand-painted 2D animation (watercolour washes, ink line boil at 12 fps, paper).
// 4 voice paragraphs = 4 scenes. Everything is painted in code (shared/paint.js geometry, shared/water.js washes, shared/figure.js figures).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Painted Short (Arkhipov, Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#1a1216',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 'sea', label: '1 · Painted sea chart', module: './scenes/s1-sea.js', duration: 7.5 },
    { id: 'charges', label: '2 · Depth charges', module: './scenes/s2-charges.js', duration: 6.5 },
    { id: 'officers', label: '3 · Torpedo + three officers', module: './scenes/s3-officers.js', duration: 7 },
    { id: 'no', label: '4 · He says no', module: './scenes/s4-no.js', duration: 6.5 },
  ]),
};
