// STYLE TEST — COUNT SHEET (isotype principle: the story told as counted picture units).
// 4 voice paragraphs = 4 chart cards. One symbol = one thing; more = more symbols; empty slots shown before the count.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Count Sheet (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#E4E1D6',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-days', label: '1 · 27 days + four boats', module: './scenes/s1-days.js', duration: 7.7 },
    { id: 's2-above', label: '2 · Ships, charges, zero orders', module: './scenes/s2-above.js', duration: 6.6 },
    { id: 's3-rule', label: '3 · 22 torpedoes, three officers', module: './scenes/s3-rule.js', duration: 6.9 },
    { id: 's4-no', label: '4 · The NO + forty years', module: './scenes/s4-no.js', duration: 6.1 },
  ]),
};
