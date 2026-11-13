// STYLE TEST — CLAY FIGURE PAINTING ("history painted round a pot"). 4 voice paragraphs = 4 parts of ONE frieze
// running round ONE vessel; the pot turns to bring each part to the front.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Clay Figure Painting (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#2B3135',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1', label: '1 · Painted date → the pot → the sub', module: './scenes/s1-sea.js', duration: 7 },
    { id: 's2', label: '2 · Ships, depth charges, silence', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3', label: '3 · Turn: torpedo + three officers', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4', label: '4 · Turn: the third turns away — NO', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
