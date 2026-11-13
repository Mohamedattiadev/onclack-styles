// STYLE TEST — CONTOUR ("the ground the story happened on"). Not public content; facts to be re-checked.
// One base map (continuous camera, global time) + one overlay scene per voice paragraph (fromVoice).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);
const paras = fromVoice(words, [
  { id: 's1-position', label: '1 · Position — 27 Oct 1962', module: './scenes/s1-position.js', duration: 7 },
  { id: 's2-charges', label: '2 · Depth charges / Moscow silent', module: './scenes/s2-charges.js', duration: 6 },
  { id: 's3-vote', label: '3 · Torpedo + three officers', module: './scenes/s3-vote.js', duration: 6 },
  { id: 's4-arkhipov', label: '4 · Arkhipov says no', module: './scenes/s4-arkhipov.js', duration: 6 },
]);
const end = Math.max(...paras.map(s => s.start + s.duration));

export default {
  title: 'Style test — CONTOUR',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#E8E4D8',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: [
    { id: 'map', label: 'Base map (survey camera)', module: './scenes/map.js', start: 0, duration: end, z: 1 },
    ...paras.map((s, i) => ({ ...s, z: 10 + i })),
    { id: 'head', label: 'Dateline + running head', module: './scenes/head.js', start: 0, duration: end, z: 30 },
  ],
};
