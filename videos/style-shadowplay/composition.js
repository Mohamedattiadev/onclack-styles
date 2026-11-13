// STYLE TEST — SHADOWPLAY ("people as shadows, history as theatre"). 4 voice paragraphs = 4 scenes.
// Facts are a style test only (re-check with 2+ sources before any public use).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Shadowplay (Arkhipov, B-59)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#15130F',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 'sea-map', label: '1 · Map: near Cuba (cobalt)', module: './scenes/1-map.js', duration: 7 },
    { id: 'depth-charges', label: '2 · Depth charges (verdigris)', module: './scenes/2-charges.js', duration: 6 },
    { id: 'three-officers', label: '3 · Torpedo + three officers (vermillion)', module: './scenes/3-officers.js', duration: 6.5 },
    { id: 'arkhipov', label: '4 · Arkhipov says no (saffron)', module: './scenes/4-arkhipov.js', duration: 6 },
  ], { overlap: 0.4 }),
};
