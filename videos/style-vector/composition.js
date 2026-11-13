// STYLE TEST — VECTOR CRT ("one beam draws the story"). 4 voice paragraphs = 4 scenes over ONE display list (shared/world.js).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Vector CRT (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#151614',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date', label: '1 · Date + map', module: './scenes/s1-date.js', duration: 7 },
    { id: 's2-pressure', label: '2 · Ships, charges, Moscow', module: './scenes/s2-pressure.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three officers', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · NO + forty years', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
