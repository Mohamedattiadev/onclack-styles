// STYLE TEST — KINETIC TYPE ("the words are the picture"). 4 voice paragraphs = 4 type layouts.
// Same voice + words.json as style-broadsheet (voice starts at 0.5 s there too, so word times match).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Kinetic Type (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#ECE8DF',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-surface', label: '1 · Date on the waterline → DEEP sinks', module: './scenes/s1-surface.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships, depth charges hit · Moscow silent', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · TORPEDO + the three-name vote', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Arkhipov · no. · forty years', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
