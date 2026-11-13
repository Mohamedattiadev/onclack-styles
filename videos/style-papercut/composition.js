// STYLE TEST — LACE PAPERCUT ("history cut from one sheet, held against a lit teal glass"). 4 voice paragraphs = 4 sheets.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Lace Papercut (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#062226',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-sea', label: '1 · Fold opens: date, sea, submarine, Cuba', module: './scenes/s1-sea.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships, falling charges, lace bursts, silence', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-officers', label: '3 · Torpedo + three paper officers', module: './scenes/s3-officers.js', duration: 6.5 },
    { id: 's4-no', label: '4 · The NO is cut — the amber lamp', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
