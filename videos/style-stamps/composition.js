// STYLE TEST — STAMP ALBUM ("history kept like a collector keeps it"). 4 voice paragraphs = 4 album leaves.
// Own fictional issues ("SEA POST"), no real stamp, country postal name or emblem.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Stamp Album (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#E3DED0',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-issue', label: '1 · Date stamps + map issue + loupe', module: './scenes/s1-issue.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships issue, ring cancels, empty spaces', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-strip', label: '3 · Torpedo + se-tenant strip of three', module: './scenes/s3-strip.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Red NO overprint + 2002 cancel', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
