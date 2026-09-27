// Tiny WebAudio synth; no audio files. Every cue is short and quiet by design.
let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain: number, type: OscillatorType = 'sine', glideTo?: number) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  tick: () => tone(1850, 0, 0.05, 0.035, 'triangle'),
  softTick: () => tone(1320, 0, 0.045, 0.025, 'triangle'),
  flag: () => {
    tone(196, 0, 0.42, 0.09, 'sine', 174);
    tone(392, 0, 0.3, 0.025, 'triangle');
  },
  block: () => {
    tone(262, 0, 0.18, 0.06, 'sine');
    tone(208, 0.16, 0.3, 0.06, 'sine');
  },
  verified: () => tone(1046, 0, 0.18, 0.035, 'sine'),
  chime: () => {
    tone(784, 0, 0.9, 0.05, 'sine');
    tone(1175, 0.09, 0.9, 0.04, 'sine');
    tone(1568, 0.18, 1.1, 0.03, 'sine');
  },
  on: () => tone(1175, 0, 0.12, 0.04, 'sine'),
};
