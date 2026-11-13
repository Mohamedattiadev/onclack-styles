// STYLE TEST — SPRAY STENCIL ("lay · hiss · lift"). One concrete wall fills up, stencil by stencil, in voice time.
// 4 voice paragraphs = 4 scene modules that all show the same wall (shared/mural.js), so cuts are invisible
// and the last shot pulls back to the whole piece.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Spray Stencil (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#8d8a84',
  roomtone: 'roomtone-city-window-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date-sub', label: '1 · Date, submarine, sea', module: './scenes/s1-date-sub.js', duration: 7 },
    { id: 's2-ships-charges', label: '2 · Ships, depth charges, Moscow silent', module: './scenes/s2-ships-charges.js', duration: 6 },
    { id: 's3-torpedo-vote', label: '3 · Torpedo + three officers, two YES', module: './scenes/s3-torpedo-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · NO + the name, pull back', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
