// STYLE TEST — PENCIL FLIPBOOK. One rough pencil flipbook on a desk; the story is drawn at 10 drawings/s.
// 4 voice paragraphs = 4 scene modules over ONE shared world (same global time → overlaps are invisible).
// Riffles (fast page flips) at the first two paragraph breaks; the NO stops the book (the hold).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Pencil Flipbook (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#3B3A34',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-sea', label: '1 · Date, the boat dives, Cuba inset', module: './scenes/s1-sea.js', duration: 7 },
    { id: 's2-charges', label: '2 · Riffle, ships, depth charges, Moscow?', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Riffle, torpedo, three officers, two yes', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Red NO — the book stops (hold), 2002', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
