// STYLE TEST — FOOTNOTE (editorial book page). Not public content.
// Scene i = voice paragraph i (fromVoice). Scenes 3 + 4 share one page (shared/ledger.js) so the footnote dive is one continuous move.
import { fromVoice, loadWords } from '/onclack-styles/engine/lib/timeline.js';

const words = await loadWords(import.meta.url);

export default {
  title: 'Style test — Footnote',
  formats: ['youtube', 'shorts'],
  fps: 30,
  background: '#F2EBDD',
  audio: [{ src: 'audio/voice.wav', start: 0.5, volume: 1 }],
  scenes: shareLedger(fromVoice(words, [
    { id: 'chart', label: '1 · Chart plate', module: './scenes/s1-chart.js', duration: 7 },
    { id: 'evidence', label: '2 · Evidence plate', module: './scenes/s2-evidence.js', duration: 6 },
    { id: 'ledger', label: '3 · Three officers', module: './scenes/s3-ledger.js', duration: 6 },
    { id: 'footnote', label: '4 · The footnote', module: './scenes/s4-footnote.js', duration: 6 },
  ])),
};

// scenes 3 + 4 draw the same page; both need the moment it slid in
function shareLedger(scenes) {
  const s3 = scenes.find(s => s.id === 'ledger').start;
  return scenes.map(s => (s.id === 'ledger' || s.id === 'footnote' ? { ...s, props: { ledgerStart: s3 } } : s));
}
