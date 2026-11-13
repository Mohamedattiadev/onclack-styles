// STYLE TEST — ENGRAVING ("history printed as a security note"). 4 voice paragraphs = 4 scenes, 3 notes.
// Every picture is built from engraved lines (tone = line width / density, no flat fills). Global-time worlds live in
// shared/sea.js (scenes 1–2) and shared/vote.js (scenes 3–4), so the scene joins are continuous.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Engraving (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#141B17',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-seascape', label: '1 · Rosette + date → engraved seascape', module: './scenes/s1-seascape.js', duration: 7 },
    { id: 's2-charges', label: '2 · Engraved photo → guilloche depth charges', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three serial stamps', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Perforated NO + 1962 → 2002', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
