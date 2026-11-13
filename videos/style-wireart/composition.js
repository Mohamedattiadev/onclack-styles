// STYLE TEST — BENT WIRE. One white plaster wall; every figure is ONE bent wire on pins, throwing a real shadow.
// The wire never cuts: date → submarine → torpedo; coils stand up into officers; copper wire = Arkhipov and his NO.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Bent Wire (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#ECE8E0',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date', label: '1 · Straight wire bends into the date, then into the submarine', module: './scenes/s1-date.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships bend out of the sea wire, depth charges, Moscow line cut', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Sub bends into the torpedo, coils stand up as three officers, two YES', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · The copper wire bends out of his hand into NO', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
