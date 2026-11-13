// STYLE TEST — OCHRE ROCK ("put on the rock"). One limestone wall in daylight; every image is finger-painted or
// mouth-blown in earth pigments in voice time. 4 voice paragraphs = 4 scene modules showing the same wall (shared/wall.js).
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Ochre Rock (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#8e8270',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-date-sub', label: '1 · Date, submarine blown on the rock, sea, Cuba', module: './scenes/s1-date-sub.js', duration: 7 },
    { id: 's2-ships-charges', label: '2 · Ships, depth charges, Moscow silent', module: './scenes/s2-ships-charges.js', duration: 6 },
    { id: 's3-torpedo-vote', label: '3 · Torpedo on the ridge, three officers, two yes', module: './scenes/s3-torpedo-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · NO in red ochre, the name, the whole wall', module: './scenes/s4-no.js', duration: 6, last: true },
  ]),
};
