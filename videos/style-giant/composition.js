// STYLE TEST — GIANT FOREGROUND. Painted toy-scale 2.5D on one flat colour field; every beat thrusts one huge object
// at the lens; cuts dive through openings or smear for 1 frame; the NO is the only time a hand pulls back.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Giant Foreground (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#127463',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-periscope', label: '1 · Periscope hands → dive → the boat near Cuba', module: './scenes/s1-periscope.js', duration: 7 },
    { id: 's2-charges', label: '2 · Charges fall at the lens · the silent radio', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-torpedo', label: '3 · Torpedo · three pairs of boots', module: './scenes/s3-torpedo.js', duration: 6.5 },
    { id: 's4-no', label: '4 · The hand pulls back: NO · hatch → 2002', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
