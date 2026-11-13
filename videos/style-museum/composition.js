// STYLE TEST — DISPLAY CASE ("history as a walk past the vitrines"). 4 voice paragraphs = 4 cases in one dark gallery.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Display Case (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#1b1c20',
  roomtone: 'roomtone-library-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-wall', label: '1 · Wall text → Exhibit 1 (model sub + chart)', module: './scenes/s1-wall.js', duration: 7 },
    { id: 's2-gauge', label: '2 · Exhibit 2 (depth gauge, headset, photo)', module: './scenes/s2-gauge.js', duration: 6 },
    { id: 's3-torpedo', label: '3 · Exhibit 3 (torpedo → cards I, II)', module: './scenes/s3-torpedo.js', duration: 6.5 },
    { id: 's4-alone', label: '4 · Card III alone: NO → 2002', module: './scenes/s4-alone.js', duration: 6 },
  ]),
};
