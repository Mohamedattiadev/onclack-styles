// STYLE TEST — CARD DECK. The story is dealt onto a slate wool cloth, one own-design card per fact.
// Four flat print inks on cream card stock; court cards are mirror-symmetric with featureless figures.
// Every card lands face up. The NO is the one card turned face down.
// 4 voice paragraphs = 4 scenes on one continuous table (s1+s2 = the sea table, s3+s4 = the vote table).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Card Deck (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#3A4250',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-sea', label: '1 · Date card, B-59, Cuba', module: './scenes/s1-sea.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships dealt, charges slapped, Moscow silent', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three officers, two YES', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Third card turned face down + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
