// STYLE TEST — FOLDED PAPER ("origami"). One table of coloured sheets that fold along scored creases; 4 voice paragraphs.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Folded Paper (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#706D68',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-sea', label: '1 · Date card, the sea pleats, the sub folds up', module: './scenes/s1-sea.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships, depth charges, Moscow falls silent', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Sub unfolds to a deck: torpedo, three officers, two YES', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · The red sheet folds into NO, the name unfolds', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
