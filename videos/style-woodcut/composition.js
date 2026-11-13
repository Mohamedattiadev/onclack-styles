// STYLE TEST — WOODCUT ("carve and pull"). 4 voice paragraphs = 4 scenes, 3 blocks (scenes 3+4 share one block).
// Each block is carved live in voice time (white gouge cuts out of a black-stained block), then a sheet is laid,
// rubbed and turned over to show the print: key block in black + one teal colour block, misregistered.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Woodcut (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#24201B',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-deep', label: '1 · Block I: date, sea, submarine → print', module: './scenes/s1-deep.js', duration: 7 },
    { id: 's2-above', label: '2 · Block II: ships, depth charges → print + stamp', module: './scenes/s2-above.js', duration: 6 },
    { id: 's3-vote', label: '3 · Block III: torpedo + three marks', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Block III: the carved NO → print + 2002 stamp', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
