// STYLE TEST — SCRATCHBOARD ("light scratched out of black"). 4 voice paragraphs = 4 boards.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Scratchboard (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#0E0E0E',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date-map', label: '1 · Date + map', module: './scenes/s1-date-map.js', duration: 7 },
    { id: 's2-charges', label: '2 · Photo + depth charges', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-torpedo-vote', label: '3 · Torpedo + tally', module: './scenes/s3-torpedo-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · The gouge + the name', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
