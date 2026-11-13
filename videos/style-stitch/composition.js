// STYLE TEST — STITCH ("history embroidered by hand"). 4 voice paragraphs = 4 embroidered pieces.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Stitch (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#CDBE9E',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1', label: '1 · Date cross-stitched → map of Cuba', module: './scenes/s1-map.js', duration: 7 },
    { id: 's2', label: '2 · Photo patch → depth-charge knots → cut thread to Moscow', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3', label: '3 · Torpedo → three names, two X stitches', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4', label: '4 · Red thread: NO → whole hoop, 2002', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
