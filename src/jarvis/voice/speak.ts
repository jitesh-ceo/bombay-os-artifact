// JARVIS's voice. ElevenLabs through the local proxy when it is configured; the browser's own
// speech synthesis otherwise. Only one line plays at a time: a new line cuts off the last one.
import { audioContext } from '../../sound/sound';

export type SpeakState = 'idle' | 'speaking';

export interface Speaker {
  say(text: string): Promise<void>;
  cancel(): void;
  /** 0–1 loudness of what is playing right now, for the arc reactor. */
  level(): number;
  setMuted(muted: boolean): void;
  onState(cb: (s: SpeakState) => void): () => void;
}

/** Plays an mp3 blob until it ends or the signal aborts, reporting loudness through `meter`. */
export type PlayAudio = (blob: Blob, signal: AbortSignal, meter: (read: () => number) => void) => Promise<void>;

interface Options {
  fetchImpl?: typeof fetch;
  synth?: SpeechSynthesis | null;
  Utterance?: typeof SpeechSynthesisUtterance | null;
  /** null disables ElevenLabs playback (no audio output available). */
  playAudio?: PlayAudio | null;
}

const MALE_UK = ['daniel', 'arthur', 'google uk english male', 'microsoft ryan', 'microsoft george', 'oliver', 'george', 'ryan'];

export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const uk = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('en-gb'));
  return (
    uk.find((v) => MALE_UK.some((n) => v.name.toLowerCase().includes(n))) ??
    uk[0] ??
    voices.find((v) => v.lang.toLowerCase().startsWith('en'))
  );
}

/** Default playback: an <audio> element routed through the shared AudioContext with an analyser. */
export const playThroughAudioContext: PlayAudio = (blob, signal, meter) =>
  new Promise<void>((resolve) => {
    const url = URL.createObjectURL(blob);
    const el = new Audio(url);
    const done = () => {
      el.pause();
      URL.revokeObjectURL(url);
      meter(() => 0);
      resolve();
    };
    const ctx = audioContext();
    if (ctx) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaElementSource(el).connect(analyser).connect(ctx.destination);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      meter(() => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        return Math.min(1, peak / 64);
      });
    }
    el.onended = done;
    el.onerror = done;
    signal.addEventListener('abort', done, { once: true });
    el.play().catch(done);
  });

export function createSpeaker(opts: Options = {}): Speaker {
  const fetchImpl = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const synth = opts.synth === undefined ? (typeof speechSynthesis === 'undefined' ? null : speechSynthesis) : opts.synth;
  const Utterance =
    opts.Utterance === undefined ? (typeof SpeechSynthesisUtterance === 'undefined' ? null : SpeechSynthesisUtterance) : opts.Utterance;
  const playAudio = opts.playAudio === undefined ? playThroughAudioContext : opts.playAudio;

  let muted = false;
  let current: AbortController | null = null;
  let read: () => number = () => 0;
  let health: Promise<boolean> | null = null;
  const listeners = new Set<(s: SpeakState) => void>();
  const emit = (s: SpeakState) => listeners.forEach((cb) => cb(s));

  const ttsAvailable = () =>
    (health ??= fetchImpl('/api/health')
      .then((r) => (r.ok ? r.json() : { tts: false }))
      .then((h: { tts?: boolean }) => Boolean(h.tts))
      .catch(() => false));

  const cancel = () => {
    current?.abort();
    current = null;
    synth?.cancel();
    read = () => 0;
  };

  async function viaElevenLabs(text: string, signal: AbortSignal): Promise<boolean> {
    if (!playAudio || !(await ttsAvailable()) || signal.aborted) return false;
    try {
      const r = await fetchImpl('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
        signal,
      });
      if (!r.ok) return false;
      const blob = await r.blob();
      if (signal.aborted) return true;
      await playAudio(blob, signal, (fn) => (read = fn));
      return true;
    } catch {
      return signal.aborted;
    }
  }

  function viaBrowser(text: string, signal: AbortSignal): Promise<void> {
    if (!synth || !Utterance) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const u = new Utterance(text);
      const voice = pickVoice(synth.getVoices());
      if (voice) u.voice = voice;
      u.rate = 1;
      u.pitch = 0.9;
      const start = performance.now();
      read = () => 0.3 + 0.4 * Math.abs(Math.sin((performance.now() - start) / 90));
      const finish = () => {
        read = () => 0;
        resolve();
      };
      u.onend = finish;
      u.onerror = finish;
      signal.addEventListener('abort', finish, { once: true });
      synth.speak(u);
    });
  }

  return {
    async say(text) {
      const line = text.trim();
      if (muted || !line) return;
      cancel();
      const ctrl = new AbortController();
      current = ctrl;
      emit('speaking');
      try {
        if (!(await viaElevenLabs(line, ctrl.signal)) && !ctrl.signal.aborted) await viaBrowser(line, ctrl.signal);
      } finally {
        if (current === ctrl) {
          current = null;
          emit('idle');
        }
      }
    },
    cancel() {
      const was = current;
      cancel();
      if (was) emit('idle');
    },
    level: () => read(),
    setMuted(m) {
      muted = m;
      if (m) this.cancel();
    },
    onState(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
