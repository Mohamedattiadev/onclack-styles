// STYLE TEST — INK WASH ("few strokes, much silence"). 4 voice paragraphs = 4 sheets of rice paper.
// Signature move: THE STROKE — every image is a brush stroke painted live, with pressure; nothing fades in.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Ink Wash (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#F2EEE5',
  motionBlur: false, // strokes grow, they do not travel; the only fast move (1C push) is 14 frames into a cut
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1', label: '1 · Cuba in one stroke, the mark at sea', module: './scenes/s1-island.js', duration: 7 },
    { id: 's2', label: '2 · Sea washes, ships, ink-drop charges', module: './scenes/s2-sea.js', duration: 6 },
    { id: 's3', label: '3 · Torpedo stroke, three upright strokes', module: './scenes/s3-officers.js', duration: 6.5 },
    { id: 's4', label: '4 · The seal: НЕТ', module: './scenes/s4-seal.js', duration: 6 },
  ]),
};
