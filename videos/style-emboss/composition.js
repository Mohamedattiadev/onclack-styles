// STYLE TEST — BLIND EMBOSS ("history pressed into paper, seen only by a moving lamp"). 4 voice paragraphs = 4 sheets.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Blind Emboss (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#EFEBE2',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date', label: '1 · Date die + relief map', module: './scenes/s1-date.js', duration: 7 },
    { id: 's2-charges', label: '2 · Section: ships, charges, silence', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-officers', label: '3 · Torpedo + three officers', module: './scenes/s3-officers.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Inked NO + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
