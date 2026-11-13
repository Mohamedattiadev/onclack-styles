// STYLE TEST — LANTERN SLIDE ("a lecture in the dark"). 4 voice paragraphs = 4 slide changes (+ one dissolve).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Lantern Slide (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#0E0C0A',
  roomtone: 'roomtone-library-01',          // a quiet hall under everything
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-map', label: '1 · Slide 1: the map', module: './scenes/s1-map.js', duration: 7 },
    { id: 's2-photo', label: '2 · Slide 2: photo + charges', module: './scenes/s2-photo.js', duration: 6 },
    { id: 's3-vote', label: '3 · Slide 3: torpedo + vote', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Slide 4: No. + dissolve', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
