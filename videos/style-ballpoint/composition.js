// STYLE TEST — NOTEBOOK MARGIN. One page of a spiral school notebook, filled in blue ballpoint during the story.
// The pen only ever ADDS ink (nothing moves, nothing is erased); only the camera moves. Red ballpoint = only the NO.
// 4 voice paragraphs = 4 scenes on one continuous page (s1+s2 = upper half, s3+s4 = lower half, then pull back).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Notebook Margin (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#2B2724',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-sea', label: '1 · Date + the boat drawn under the line', module: './scenes/s1-sea.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships, charges, Moscow silent', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three officers, two YES', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Red NO + the name, pull back', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
