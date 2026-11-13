// STYLE TEST — SAND TABLE ("history drawn in sand on a lit glass table"). 4 voice paragraphs, one continuous performance:
// each image is swept by the flat of a hand into the next (the wipe-morph). Shared world: shared/table.js.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Sand Table (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#3A2614',
  motionBlur: false, // the picture is a canvas; nothing translates — sand changes in place
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date-sea', label: '1 · Date in sand → sea, sub, Cuba', module: './scenes/s1-date-sea.js', duration: 7 },
    { id: 's2-charges', label: '2 · Ships, depth charges, silence', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo → three officers, two dots', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · Swept clean: NO, the name', module: './scenes/s4-no.js', duration: 6, last: true },
  ]),
};
