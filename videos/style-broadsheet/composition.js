// STYLE TEST — BROADSHEET ("history as it went to press"). 4 voice paragraphs = 4 sheets.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Broadsheet (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#ECE6D6',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-dateline', label: '1 · Dateline + map', module: './scenes/s1-dateline.js', duration: 7 },
    { id: 's2-evidence', label: '2 · Photo + depth charges', module: './scenes/s2-evidence.js', duration: 6 },
    { id: 's3-officers', label: '3 · Torpedo + three officers', module: './scenes/s3-officers.js', duration: 6.5 },
    { id: 's4-no', label: '4 · NO + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
