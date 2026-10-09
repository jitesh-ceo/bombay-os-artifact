// JARVIS's ears: the browser's speech recognition (Chrome / Edge). Push-to-talk emits every
// transcript; wake mode stays quiet until a final phrase starts with "Jarvis".
import { audioContext } from '../../sound/sound';

interface RecognitionAlternative {
  transcript: string;
}
type RecognitionResult = ArrayLike<RecognitionAlternative> & { isFinal: boolean };
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}
export type RecognitionCtor = new () => Recognition;

export interface Transcript {
  text: string;
  final: boolean;
}

export interface Listener {
  supported: boolean;
  start(): void;
  stop(): void;
  /** 0–1 microphone loudness, for the arc reactor. */
  level(): number;
  setLang(lang: 'en-GB' | 'ar-AE'): void;
  setWakeMode(on: boolean): void;
  onTranscript(cb: (t: Transcript) => void): () => void;
  onWake(cb: (rest: string) => void): () => void;
  onError(cb: (code: string) => void): () => void;
}

interface Options {
  lang?: 'en-GB' | 'ar-AE';
  Recognition?: RecognitionCtor | null;
  media?: MediaDevices | null;
}

const WAKE_EN = /^\s*(?:hey|ok|okay)?[\s,]*jarvis\b[\s,.!?]*(.*)$/i;
const WAKE_UP = /\bwake\s+up[\s,]*jarvis\b/i;
const WAKE_AR = /^\s*(?:يا\s*)?جارفس[\s،,.!؟]*(.*)$/;

/** The command after the wake word, '' for the wake word alone, or null if it was not said. */
export function parseWake(text: string): string | null {
  if (WAKE_UP.test(text)) return 'wake up';
  const m = text.match(WAKE_EN) ?? text.match(WAKE_AR);
  return m ? m[1].trim() : null;
}

function defaultRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function createListener(opts: Options = {}): Listener {
  const Ctor = opts.Recognition === undefined ? defaultRecognition() : opts.Recognition;
  const media = opts.media === undefined ? (typeof navigator === 'undefined' ? null : (navigator.mediaDevices ?? null)) : opts.media;

  let lang = opts.lang ?? 'en-GB';
  let wakeMode = false;
  let active = false;
  let rec: Recognition | null = null;
  let mic: { stream: MediaStream; read: () => number } | null = null;

  const transcriptCbs = new Set<(t: Transcript) => void>();
  const wakeCbs = new Set<(rest: string) => void>();
  const errorCbs = new Set<(code: string) => void>();

  function handle(e: RecognitionEvent) {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const text = Array.from(r).map((a) => a.transcript).join(' ').trim();
      if (!text) continue;
      if (wakeMode) {
        if (!r.isFinal) continue;
        const rest = parseWake(text);
        if (rest !== null) wakeCbs.forEach((cb) => cb(rest));
      } else {
        transcriptCbs.forEach((cb) => cb({ text, final: r.isFinal }));
      }
    }
  }

  function recognition(): Recognition | null {
    if (!Ctor) return null;
    if (!rec) {
      rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = handle;
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          active = false;
          releaseMic();
        }
        if (e.error !== 'no-speech' && e.error !== 'aborted') errorCbs.forEach((cb) => cb(e.error));
      };
      // Chrome ends a session after silence; keep listening until we are told to stop.
      rec.onend = () => {
        if (!active || !rec) return;
        try {
          rec.start();
        } catch {
          /* already started */
        }
      };
    }
    rec.lang = lang;
    return rec;
  }

  async function openMic() {
    if (!media?.getUserMedia || mic) return;
    try {
      const stream = await media.getUserMedia({ audio: true });
      if (!active) return stream.getTracks().forEach((t) => t.stop());
      const ctx = audioContext();
      if (!ctx) return stream.getTracks().forEach((t) => t.stop());
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      mic = {
        stream,
        read: () => {
          analyser.getByteTimeDomainData(buf);
          let peak = 0;
          for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
          return Math.min(1, peak / 48);
        },
      };
    } catch {
      /* the level meter is decoration; recognition reports permission errors itself */
    }
  }

  function releaseMic() {
    mic?.stream.getTracks().forEach((t) => t.stop());
    mic = null;
  }

  return {
    supported: Boolean(Ctor),
    start() {
      const r = recognition();
      if (!r || active) return;
      active = true;
      try {
        r.start();
      } catch {
        /* already started */
      }
      void openMic();
    },
    stop() {
      active = false;
      releaseMic();
      rec?.stop();
    },
    level: () => mic?.read() ?? 0,
    setLang(l) {
      lang = l;
      if (rec) rec.lang = l;
    },
    setWakeMode(on) {
      wakeMode = on;
    },
    onTranscript(cb) {
      transcriptCbs.add(cb);
      return () => transcriptCbs.delete(cb);
    },
    onWake(cb) {
      wakeCbs.add(cb);
      return () => wakeCbs.delete(cb);
    },
    onError(cb) {
      errorCbs.add(cb);
      return () => errorCbs.delete(cb);
    },
  };
}
