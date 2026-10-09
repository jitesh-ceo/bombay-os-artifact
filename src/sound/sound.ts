// Tiny WebAudio synth; no audio files. Every cue is short and quiet by design.
let ctx: AudioContext | null = null;

// One AudioContext for every cue and for JARVIS’s voice. Resumes on demand (browsers start it suspended).
export function audioContext() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain: number, type: OscillatorType = 'sine', glideTo?: number) {
  const a = audioContext();
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

// HUD cues: glassy sine blips, a rising power-up, a low warning pulse.
export const sfx = {
  tick: () => {
    tone(2400, 0, 0.04, 0.03, 'sine', 3000);
    tone(4800, 0.01, 0.03, 0.008, 'sine');
  },
  softTick: () => tone(1760, 0, 0.05, 0.02, 'sine', 2100),
  flag: () => {
    tone(220, 0, 0.5, 0.08, 'sawtooth', 196);
    tone(440, 0, 0.18, 0.03, 'square');
    tone(440, 0.22, 0.18, 0.03, 'square');
  },
  block: () => {
    tone(330, 0, 0.16, 0.05, 'triangle');
    tone(247, 0.15, 0.32, 0.05, 'triangle');
  },
  verified: () => {
    tone(1318, 0, 0.12, 0.03, 'sine');
    tone(1976, 0.07, 0.18, 0.025, 'sine');
  },
  chime: () => {
    tone(880, 0, 0.9, 0.045, 'sine');
    tone(1320, 0.08, 0.9, 0.035, 'sine');
    tone(1760, 0.16, 1.1, 0.03, 'sine');
    tone(2640, 0.24, 1.2, 0.012, 'sine');
  },
  on: () => tone(1500, 0, 0.12, 0.035, 'sine', 2200),
  // The reactor coming online: a low hum that glides up, with a bright crest.
  powerUp: () => {
    tone(55, 0, 1.4, 0.09, 'sawtooth', 220);
    tone(110, 0.1, 1.2, 0.05, 'sine', 880);
    tone(1760, 0.95, 0.5, 0.03, 'sine', 2640);
  },
};
