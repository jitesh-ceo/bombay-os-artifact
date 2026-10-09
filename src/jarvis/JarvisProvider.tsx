// JARVIS's nervous system: ears (speech recognition), brain (intents → Gemini), voice (ElevenLabs →
// browser) and narration of the running workflow. Everything degrades to a working fallback.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAppState, useDispatch } from '../state/AppProvider';
import { askJarvis, FALLBACK_REPLY } from './brain/gemini';
import { morningBriefing } from './briefing';
import { intentToActions, matchIntent } from './brain/intents';
import { buildSnapshot } from './brain/snapshot';
import { confirmFor, narrationFor } from './narration';
import { createListener } from './voice/listen';
import { createSpeaker } from './voice/speak';

export type JarvisMode = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface JarvisHealth {
  tts: boolean;
  chat: boolean;
  stt: boolean;
}

export interface JarvisApi {
  mode: JarvisMode;
  /** Last line JARVIS said, and what it last heard. */
  spoken: string;
  heard: string;
  say(text: string): void;
  /** Stops whatever JARVIS is saying. */
  stop(): void;
  handle(text: string): Promise<void>;
  levels(): { mic: number; out: number };
  health: JarvisHealth;
  /** True when the typed command box should show (no speech recognition, or the mic is blocked). */
  typing: boolean;
  /** True only when the presenter opened the box on purpose. */
  typingOpen: boolean;
  setTyping(on: boolean): void;
  /** Increments when the presenter asks to type (V without a microphone): focus the box then, not before. */
  typeRequest: number;
  /** Opens the typed command box and focuses it (click the arc reactor, or V without a mic). */
  openTyping(): void;
  gestures: boolean;
  setGestures(on: boolean): void;
  forge(topic: string): void;
  /** Opens the Content Forge topic prompt (F, or the command palette). */
  openForge(): void;
  /** Hooks later features register: the wake sequence, Content Forge, the Forge topic prompt. */
  register(hooks: Partial<Hooks>): () => void;
}

interface Hooks {
  wake: () => void;
  forge: (topic: string) => void;
  forgePrompt: () => void;
  gestures: (on: boolean) => void;
}

const Ctx = createContext<JarvisApi | null>(null);

const FINALISE_MS = 700;
const CAPTURE_MS = 6000;

const typingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
};

export function JarvisProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const stateRef = useRef(state);
  stateRef.current = state;

  const [speaker] = useState(() => createSpeaker());
  const [listener] = useState(() => createListener());
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [spoken, setSpoken] = useState('');
  const [heard, setHeard] = useState('');
  const [health, setHealth] = useState<JarvisHealth>({ tts: false, chat: false, stt: listener.supported });
  const [micBlocked, setMicBlocked] = useState(false);
  const healthRef = useRef(health);
  healthRef.current = health;
  const [typingOpen, setTypingOpen] = useState(false);
  const [typeRequest, setTypeRequest] = useState(0);
  const [gestures, setGesturesState] = useState(false);
  const hooks = useRef<Partial<Hooks>>({});
  const gesturesRef = useRef(gestures);
  gesturesRef.current = gestures;

  const openTyping = useCallback(() => {
    setTypingOpen(true);
    setTypeRequest((n) => n + 1);
  }, []);

  // Stable for the life of the provider: features register in effects, and a new identity on every
  // render would tear them down (it switched hand tracking off the first time JARVIS spoke).
  const register = useCallback((h: Partial<Hooks>) => {
    Object.assign(hooks.current, h);
    return () => {
      for (const k of Object.keys(h) as (keyof Hooks)[]) if (hooks.current[k] === h[k]) delete hooks.current[k];
    };
  }, []);

  const say = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setSpoken(text);
      void speaker.say(text);
    },
    [speaker],
  );

  const setGestures = useCallback((on: boolean) => {
    setGesturesState(on);
    hooks.current.gestures?.(on);
  }, []);

  const forge = useCallback(
    (topic: string) => {
      if (hooks.current.forge) hooks.current.forge(topic);
      else say('Content Forge is not available in this build.');
    },
    [say],
  );

  const handle = useCallback(
    async (text: string) => {
      const line = text.trim();
      if (!line) return;
      setHeard(line);
      const intent = matchIntent(line);
      const s = stateRef.current;
      if (intent) {
        if (!s.bootDone && intent.kind !== 'wake') dispatch({ type: 'BOOT_DONE' });
        switch (intent.kind) {
          case 'forge':
            return forge(intent.topic);
          case 'wake':
            if (hooks.current.wake) return hooks.current.wake();
            return say('Online and listening.');
          case 'briefing':
            return say(morningBriefing());
          case 'mute':
            if (intent.on === s.sound) dispatch({ type: 'TOGGLE_SOUND' });
            if (!intent.on) {
              speaker.setMuted(false);
              say('Back online.');
            }
            return;
          case 'gestures':
            setGestures(intent.on);
            break;
          case 'lang':
            listener.setLang(intent.lang === 'ar' ? 'ar-AE' : 'en-GB');
            return say(intent.lang === 'ar' ? 'تمام، أسمعك بالعربي.' : 'Listening in English.');
          default:
            intentToActions(intent, s, Date.now()).forEach(dispatch);
        }
        say(confirmFor(intent));
        return;
      }
      // No brain configured: answer at once instead of waiting on a request that will fail.
      if (!healthRef.current.chat) return say(FALLBACK_REPLY);
      setThinking(true);
      try {
        const reply = await askJarvis(line, buildSnapshot(stateRef.current));
        say(reply.text);
      } finally {
        setThinking(false);
      }
    },
    [dispatch, forge, say, setGestures, speaker],
  );

  // Voice output follows the presenter's sound toggle (S).
  useEffect(() => speaker.setMuted(!state.sound), [speaker, state.sound]);
  useEffect(() => speaker.onState((st) => setSpeaking(st === 'speaking')), [speaker]);

  useEffect(() => {
    let live = true;
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : { tts: false, chat: false }))
      .catch(() => ({ tts: false, chat: false }))
      .then((h: { tts?: boolean; chat?: boolean }) => live && setHealth({ tts: Boolean(h.tts), chat: Boolean(h.chat), stt: listener.supported }));
    return () => {
      live = false;
    };
  }, [listener]);

  // Narrate the running workflow.
  const prevRef = useRef(state);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state;
    const line = narrationFor(prev, state);
    if (line) say(line);
  }, [state, say]);

  // Ears. Wake mode listens for "Jarvis…" all the time; push-to-talk (hold V) captures everything.
  const capture = useRef<{ final: string; interim: string; timer: number | null }>({ final: '', interim: '', timer: null });
  const handleRef = useRef(handle);
  handleRef.current = handle;

  const resumeWake = useCallback(() => {
    setListening(false);
    listener.setWakeMode(true);
    listener.start();
  }, [listener]);

  const finishCapture = useCallback(() => {
    const c = capture.current;
    if (c.timer) window.clearTimeout(c.timer);
    const text = (c.final || c.interim).trim();
    capture.current = { final: '', interim: '', timer: null };
    resumeWake();
    if (text) void handleRef.current(text);
  }, [resumeWake]);

  const startCapture = useCallback(
    (ms: number | null) => {
      capture.current = { final: '', interim: '', timer: ms ? window.setTimeout(finishCapture, ms) : null };
      listener.setWakeMode(false);
      listener.start();
      setListening(true);
    },
    [finishCapture, listener],
  );

  useEffect(() => {
    if (!listener.supported) return;
    const offT = listener.onTranscript((t) => {
      setHeard(t.text);
      const c = capture.current;
      if (t.final) {
        c.final = `${c.final} ${t.text}`.trim();
        // After "Jarvis" alone, the first complete sentence is the command.
        if (c.timer) finishCapture();
      } else c.interim = t.text;
    });
    const offW = listener.onWake((rest) => {
      if (rest === '') {
        say('Yes?');
        startCapture(CAPTURE_MS);
      } else void handleRef.current(rest);
    });
    let retry: number | null = null;
    const offE = listener.onError((code) => {
      if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
        setMicBlocked(true);
        setListening(false);
      } else if (code === 'network') {
        // Recognition needs the internet in Chrome. Back off instead of retrying in a loop.
        listener.stop();
        setListening(false);
        if (retry) window.clearTimeout(retry);
        retry = window.setTimeout(resumeWake, 15_000);
      }
    });
    resumeWake();
    return () => {
      offT();
      offW();
      offE();
      if (retry) window.clearTimeout(retry);
      listener.stop();
    };
  }, [finishCapture, listener, resumeWake, say, startCapture]);

  // Keys: hold V to talk; F, G and W are handed to the features that register for them.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingTarget(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === 'v') {
        e.preventDefault();
        if (e.repeat) return;
        if (!listener.supported || micBlocked) return openTyping();
        speaker.cancel();
        startCapture(null);
      } else if (k === 'f') {
        // Without this the F would land in the prompt's text box.
        e.preventDefault();
        hooks.current.forgePrompt?.();
      } else if (k === 'g') {
        setGestures(!gesturesRef.current);
      } else if (k === 'w') {
        hooks.current.wake?.();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'v' || !listening) return;
      listener.stop();
      // Give the recogniser a moment to deliver the final words after release.
      capture.current.timer = window.setTimeout(finishCapture, FINALISE_MS);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [finishCapture, listener, listening, micBlocked, openTyping, setGestures, speaker, startCapture]);

  const api = useMemo<JarvisApi>(
    () => ({
      mode: speaking ? 'speaking' : thinking ? 'thinking' : listening ? 'listening' : 'idle',
      spoken,
      heard,
      say,
      stop: () => speaker.cancel(),
      handle,
      levels: () => ({ mic: listener.level(), out: speaker.level() }),
      health,
      typing: typingOpen || micBlocked || !health.stt,
      typingOpen,
      setTyping: setTypingOpen,
      typeRequest,
      openTyping,
      gestures,
      setGestures,
      forge,
      openForge: () => hooks.current.forgePrompt?.(),
      register,
    }),
    [forge, gestures, handle, health, heard, listener, listening, micBlocked, openTyping, say, setGestures, speaker, speaking, spoken, thinking, typeRequest, typingOpen],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useJarvis() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useJarvis outside JarvisProvider');
  return v;
}
