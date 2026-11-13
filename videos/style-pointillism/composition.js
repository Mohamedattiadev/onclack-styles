// STYLE TEST — DOT PAINTING ("the picture is made of separate dabs of pure pigment"). 4 voice paragraphs = 4 canvases.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Dot Painting (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#E4D8BF',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-deep', label: '1 · Macro dabs → submarine in the deep', module: './scenes/s1-deep.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships above, depth charges bloom', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three officers, two warm halos', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Cool field spreads from the third: NO', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
