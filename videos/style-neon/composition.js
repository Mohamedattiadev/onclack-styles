// STYLE TEST — NEON TUBES ("a sign-maker's wall at night"). 4 voice paragraphs = 4 framings of real bent-glass tubes.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Neon Tubes (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#120e0d',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date', label: '1 · Date + sea map', module: './scenes/s1-date.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships, charges, Moscow dark', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three officers', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Red NO + 2002', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
