// STYLE TEST — LECTURE CHALKBOARD. 4 voice paragraphs = 4 scenes, but ONE board on one global clock (shared/board.js):
// a lecturer's slate in a hall — chalk diagrams written in voice time, an eraser wipe that leaves a ghost, one pink NO.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Lecture Chalkboard (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#26332B',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-sea', label: '1 · Date, sea, the sub, Cuba', module: './scenes/s1-sea.js', duration: 7 },
    { id: 's2-above', label: '2 · Wipe → ships, charges, Moscow silent', module: './scenes/s2-above.js', duration: 6 },
    { id: 's3-vote', label: '3 · Wipe → torpedo, three officers, YES YES', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · The pink NO, forty years later', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
