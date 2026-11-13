// STYLE TEST — MOSAIC ("history set in stone tiles"). 4 voice paragraphs = one floor, laid and re-laid 3 times.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Mosaic (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#8C8579',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-map', label: '1 · Map laid in stone + B-59 marker', module: './scenes/s1-map.js', duration: 7 },
    { id: 's2-section', label: '2 · Re-lay: under the sea, depth charges', module: './scenes/s2-section.js', duration: 6 },
    { id: 's3-vote', label: '3 · Re-lay: torpedo + three officers', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Re-lay: the gold-glass NO', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
