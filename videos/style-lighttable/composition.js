// STYLE TEST — LIGHT TABLE ("the archive under the loupe"). 4 voice paragraphs = 4 scenes on ONE light table.
// The table, camera, loupe and grease marks live in shared/plan.js (global time); scenes add their sound.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Light Table (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#111416',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-chart', label: '1 · Table on + chart negative', module: './scenes/s1-chart.js', duration: 7 },
    { id: 's2-hunters', label: '2 · Strip: the hunters + empty frames', module: './scenes/s2-hunters.js', duration: 6 },
    { id: 's3-frames', label: '3 · Torpedo frame + three cut frames', module: './scenes/s3-frames.js', duration: 6.5 },
    { id: 's4-loupe', label: '4 · NO + the loupe drop + develop', module: './scenes/s4-loupe.js', duration: 6 },
  ]),
};
