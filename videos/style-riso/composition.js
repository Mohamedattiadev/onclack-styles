// STYLE TEST — RISO ZINE ("history, cut and printed by hand"). 4 voice paragraphs = 4 spreads of one zine.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Riso Zine (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#25221E',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date', label: '1 · Date + chart', module: './scenes/s1-date.js', duration: 7 },
    { id: 's2-above', label: '2 · Destroyer + charges + Moscow', module: './scenes/s2-above.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three slips', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · NO + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
