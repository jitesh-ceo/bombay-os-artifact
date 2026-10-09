// Spoken subtitles: what JARVIS says, what it heard, and a typed fallback when there is no microphone.
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, Mic } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useJarvis } from '../JarvisProvider';

const HOLD_MS = 4500;

function useFading(text: string, hold: boolean) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    if (!text) return;
    setShown(text);
    if (hold) return;
    const t = window.setTimeout(() => setShown(''), HOLD_MS + text.length * 35);
    return () => window.clearTimeout(t);
  }, [text, hold]);
  return shown;
}

export function Subtitles() {
  const j = useJarvis();
  const spoken = useFading(j.spoken, j.mode === 'speaking');
  const heard = useFading(j.heard, j.mode === 'listening');
  const [value, setValue] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (j.typeRequest) input.current?.focus();
  }, [j.typeRequest]);

  return (
    <div className="subs" aria-live="polite">
      <AnimatePresence>
        {(j.mode === 'listening' || j.mode === 'thinking') && (
          <motion.div key="state" className="subs__state mono-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {j.mode === 'listening' ? (
              <>
                <Mic size={11} /> Listening
              </>
            ) : (
              'Thinking'
            )}
            <span className="subs__dots" />
          </motion.div>
        )}
        {heard && (
          <motion.div key={`h-${heard}`} className="subs__heard" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            “{heard}”
          </motion.div>
        )}
        {spoken && (
          <motion.div key={`s-${spoken}`} className="subs__spoken" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <span className="subs__who mono-sm">JARVIS</span>
            {spoken}
          </motion.div>
        )}
      </AnimatePresence>
      {j.typing && (
        <form
          className="subs__type"
          onSubmit={(e) => {
            e.preventDefault();
            const text = value.trim();
            if (!text) return;
            setValue('');
            input.current?.blur();
            void j.handle(text);
          }}
        >
          <Keyboard size={13} />
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
                j.setTyping(false);
              }
            }}
            placeholder={j.health.stt ? 'Type to JARVIS · Enter to send · Esc to close' : 'Type to JARVIS · voice input needs Chrome or Edge'}
            aria-label="Command for JARVIS"
          />
        </form>
      )}
    </div>
  );
}
