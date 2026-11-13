// STYLE TEST — BLUEPRINT ("history as an engineering drawing"). 4 voice paragraphs = 4 views of ONE sheet.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Blueprint (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#173F6E',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1', label: '1 · General arrangement + key plan', module: './scenes/s1-arrangement.js', duration: 7 },
    { id: 's2', label: '2 · Section A–A: depth charges', module: './scenes/s2-section.js', duration: 6 },
    { id: 's3', label: '3 · Detail B torpedo → approvals', module: './scenes/s3-approvals.js', duration: 6.5 },
    { id: 's4', label: '4 · Red pencil NO → whole sheet', module: './scenes/s4-refused.js', duration: 6 },
  ]),
};
