// STYLE TEST — CLAY ("history sculpted in plasticine, shot one frame at a time"). 4 voice paragraphs = 4 set-ups.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Clay (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#E8B088',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-sea', label: '1 · Date + clay sea + sub', module: './scenes/s1-sea.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships + depth charges', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-cutaway', label: '3 · Cutaway: torpedo + three officers', module: './scenes/s3-cutaway.js', duration: 6.5 },
    { id: 's4-no', label: '4 · NO + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
