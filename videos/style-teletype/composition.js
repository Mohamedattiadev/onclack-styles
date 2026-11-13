// STYLE TEST — TELETYPE TAPE ("the story arrives on the wire"). 4 voice paragraphs = 4 camera set-ups in ONE wire room.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Teletype Tape (B-59, 27 Oct 1962)',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#1E1A21',
  roomtone: 'roomtone-city-window-01',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: fromVoice(words, [
    { id: 's1-flash', label: '1 · FLASH + the boat in type', module: './scenes/s1-flash.js', duration: 7 },
    { id: 's2-charges', label: '2 · Depth charges + blank tape', module: './scenes/s2-charges.js', duration: 6 },
    { id: 's3-vote', label: '3 · Torpedo + the vote', module: './scenes/s3-vote.js', duration: 6.5 },
    { id: 's4-no', label: '4 · NO in punched light, tear + pin', module: './scenes/s4-no.js', duration: 6 },
  ]),
};
