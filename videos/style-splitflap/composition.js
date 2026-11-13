// STYLE TEST — SPLIT-FLAP ("Departure Board"). One electromechanical board; 4 voice paragraphs = 4 camera set-ups on it.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Split-Flap Departure Board (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#1A1916',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-position', label: '1 · Date + map, the boat hides', module: './scenes/s1.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships, depth charges, Moscow silent', module: './scenes/s2.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three officers', module: './scenes/s3.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Arkhipov: NO, 40 years later', module: './scenes/s4.js', duration: 6 },
  ], { overlap: 0 }),
};
