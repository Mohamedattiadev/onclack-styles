// STYLE TEST — DIORAMA: a 2.5D cut-paper museum model. Facts are a style test only (not checked for publication).
// Scene timing follows the voice: scene i = paragraph i of words.json.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Diorama (Arkhipov, 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#14110e',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-deep', label: '1 · The sea near Cuba (cross-section)', module: './scenes/s1-deep.js', duration: 7.5 },
    { id: 's2-charges', label: '2 · Depth charges', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-room', label: '3 · Torpedo + three officers', module: './scenes/s3-room.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Arkhipov says no → the model', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
