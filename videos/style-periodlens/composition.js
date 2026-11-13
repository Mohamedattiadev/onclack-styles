// STYLE TEST — PERIOD LENS (D6): "each story in the graphic language of its own time".
// 1962 → civil-defence pamphlet (navy line + yellow tint), then the medium shift to a screenprint poster at the turn.
// 4 voice paragraphs = 4 plates inside one constant channel frame.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Period Lens (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#F2EBDD',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-map', label: '1 · Pamphlet map + Fig. 1 photo', module: './scenes/s1-map.js', duration: 7 },
    { id: 's2-section', label: '2 · Cross-section: depth charges', module: './scenes/s2-section.js', duration: 6 },
    { id: 's3-shift', label: '3 · Torpedo → MEDIUM SHIFT → three officers', module: './scenes/s3-shift.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Screenprint NO + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
