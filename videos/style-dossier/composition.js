// STYLE TEST — TYPED DOSSIER ("the story as it was typed up"). 4 voice paragraphs = 3 sheets in one folder.
// Signature: a line types, the carriage returns, the camera follows. Every key strike = one recorded strike
// (shared/plan.js drives both the picture and build-typing.mjs).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Typed Dossier (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#34322E',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  sfx: [{ id: 'dos-typing', at: 0, lu: -15 }],
  scenes: fromVoice(words, [
    { id: 's1-report', label: '1 · Report typed live + typed sketch map', module: './scenes/s1-report.js', duration: 7 },
    { id: 's2-carbon', label: '2 · Carbon copy log + B-59 photo', module: './scenes/s2-carbon.js', duration: 6 },
    { id: 's3-consent', label: '3 · Consent form: torpedo, 3 officers, 2 yes', module: './scenes/s3-consent.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Tape lifts, red NO, stamp 2002', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
