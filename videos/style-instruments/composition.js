// STYLE TEST — INSTRUMENTS ("the story told by the dials"). 4 voice paragraphs = 4 instrument set-ups.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Instruments (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#12130f',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1', label: '1 · Clock + depth gauge', module: './scenes/s1-depth.js', duration: 7 },
    { id: 's2', label: '2 · Sonar scope + depth charges + silent radio', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3', label: '3 · Special weapon + key panel', module: './scenes/s3-keys.js', duration: 6.5 },
    { id: 's4', label: '4 · The empty slot + the needle falls', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
