// STYLE TEST — LACQUER & GOLD DUST ("each image is laid in wet lacquer, sprinkled with metal powder, brushed, polished").
// One long black-lacquer board, 4 voice paragraphs = 4 stations; the camera travels along it (16:9 → right, 9:16 → down).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Lacquer & Gold Dust (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#0c0d11',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-map', label: '1 · Date + gold-dust map, shell sub', module: './scenes/s1-map.js', duration: 7 },
    { id: 's2-above', label: '2 · Silver ships, charges, photo', module: './scenes/s2-above.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three officers', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Polished-out NO + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
