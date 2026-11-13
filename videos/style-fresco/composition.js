// STYLE TEST — FRESCO WALL. One lime-plaster wall painted day-section by day-section (giornate) in voice time.
// 4 voice paragraphs = 4 camera stops on the same wall (identical wall in every module → invisible cuts).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Fresco Wall (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#A89E8D',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-sea', label: '1 · Date band + the sea section', module: './scenes/s1-sea.js', duration: 7.5 },
    { id: 's2-ships', label: '2 · Ships band + charges', module: './scenes/s2-ships.js', duration: 6.5 },
    { id: 's3-vote', label: '3 · Torpedo + three officers', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Third day: NO + forty years', module: './scenes/s4-no.js', duration: 6.5 },
  ]),
};
