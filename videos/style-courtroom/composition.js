// STYLE TEST — REPORTAGE SKETCH ("drawn as it happens"). 4 voice paragraphs = 3 sheets of toned paper
// (sheet 3 carries the vote AND the NO, so the crossing-out happens on the drawing it cancels).
// Earlier scenes sit ABOVE later ones (z), so the old sheet can flip away over the top of the pad and uncover the next.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Reportage Sketch (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#2B2824',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1', label: '1 · Date, corner map, the boat deep', module: './scenes/s1-sea.js', duration: 7, z: 40 },
    { id: 's2', label: '2 · Ships above, charges, Moscow silent', module: './scenes/s2-charges.js', duration: 6, z: 30 },
    { id: 's3', label: '3 · Torpedo, three officers, two yes', module: './scenes/s3-vote.js', duration: 6.5, z: 20 },
    { id: 's4', label: '4 · Arkhipov: NO (crossed out), 2002', module: './scenes/s4-no.js', duration: 6, z: 10 },
  ]),
};
