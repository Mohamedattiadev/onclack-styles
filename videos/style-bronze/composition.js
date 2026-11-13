// STYLE TEST — BRONZE RELIEF ("a memorial frieze cast in bronze; the story is where hands have rubbed it bright").
// 4 voice paragraphs = 4 panels of one cast frieze. Camera dollies along the bronze; forms rise out of the
// metal (repoussé) and the important parts are rubbed from green-brown patina to bare bronze.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Bronze Relief (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#1B1510',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date', label: '1 · Date + the sea, sub below', module: './scenes/s1-date.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships, depth charges, silence', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-officers', label: '3 · Torpedo + three niches', module: './scenes/s3-officers.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Rubbed NO + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
