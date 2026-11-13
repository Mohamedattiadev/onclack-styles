// STYLE TEST — LEADED GLASS ("the story told by light through a window"). 4 voice paragraphs = 4 panels of one window.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Leaded Glass (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#0b0c0e',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-map', label: '1 · Date panes + glass map', module: './scenes/s1-map.js', duration: 7 },
    { id: 's2-above', label: '2 · Ships, charges, photo roundel', module: './scenes/s2-above.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three lancets', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Ruby NO + the whole window', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
