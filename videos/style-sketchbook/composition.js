// STYLE TEST — FIELD SKETCHBOOK. A travel journal kept by hand: pen line + loose watercolour on cream pages.
// 4 voice paragraphs = 4 scenes on 3 spreads (page turns at the first two paragraph breaks; s3 → s4 stay on one spread).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Field Sketchbook (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#262C31',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date-map', label: '1 · Date, map scrap, the boat hides', module: './scenes/s1-date-map.js', duration: 7 },
    { id: 's2-charges', label: '2 · Page turn, ships + charges, Moscow stub', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-officers', label: '3 · Page turn, torpedo, three officers', module: './scenes/s3-officers.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Viridian + red NO, 2002', module: './scenes/s4-no.js', duration: 6 },
  ], { lead: 0.8 }),
};
