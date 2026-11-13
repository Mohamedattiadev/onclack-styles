// STYLE TEST — WOOD INLAY (marquetry). 4 voice paragraphs = 4 inlaid panels.
// Every picture is cut from real wood species and fitted flush; grain direction draws the forms.
// The ONLY dyed veneer in the film is the indigo of the NO.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Wood Inlay (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#2B1D13',
  roomtone: 'roomtone-library-01', // quiet workshop room (no city whine)
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-map', label: '1 · Inlaid map of the Caribbean', module: './scenes/s1-map.js', duration: 7 },
    { id: 's2-section', label: '2 · Sea strata + depth charges', module: './scenes/s2-section.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + three officers', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · The indigo NO', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
