// Voice lines use the browser's speech engine; tones are synthesised so no audio assets ship.

let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, gain = 0.06, type: OscillatorType = 'sine') {
  const a = audio();
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + at);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur);
  osc.connect(g).connect(a.destination);
  osc.start(a.currentTime + at);
  osc.stop(a.currentTime + at + dur + 0.02);
}

export const sfx = {
  ding: () => tone(1320, 0, 0.35, 0.05),
  confirm: () => {
    tone(880, 0, 0.12, 0.05, 'triangle');
    tone(1320, 0.09, 0.2, 0.05, 'triangle');
  },
  arm: () => {
    tone(220, 0, 0.5, 0.05, 'sawtooth');
    tone(440, 0.15, 0.45, 0.04, 'square');
  },
  disarm: () => {
    tone(440, 0, 0.3, 0.04, 'square');
    tone(220, 0.12, 0.45, 0.05, 'sawtooth');
  },
};

export function speak(text: string, lang: 'en' | 'ar') {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'ar' ? 'ar-AE' : 'en-GB';
  u.rate = 0.95;
  u.pitch = 0.85;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang === 'ar' ? 'ar' : 'en-GB'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
