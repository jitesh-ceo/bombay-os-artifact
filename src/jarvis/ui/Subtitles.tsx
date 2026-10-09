// Spoken subtitles: what JARVIS says, what it heard, and a typed fallback when there is no microphone.
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, Mic } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from '../../state/AppProvider';
import { useJarvis } from '../JarvisProvider';
import { sentences } from './sentences';

const HOLD_MS = 4500;
// Roughly the pace of JARVIS's voice, so each subtitle line changes with the speech.
const MS_PER_CHAR = 62;

/** Steps through the sentences of a line as it is spoken, then fades after the last one. */
function useSpokenLine(text: string, speaking: boolean) {
  const [shown, setShown] = useState('');
  const parts = useMemo(() => sentences(text), [text]);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [text]);
  useEffect(() => {
    if (!parts.length) return;
    setShown(parts[Math.min(i, parts.length - 1)]);
    if (i < parts.length - 1) {
      const t = window.setTimeout(() => setI((v) => v + 1), 300 + parts[i].length * MS_PER_CHAR);
      return () => window.clearTimeout(t);
    }
    if (speaking) return;
    const t = window.setTimeout(() => setShown(''), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [parts, i, speaking]);
  return shown;
}

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
  const { ui } = useAppState();
  // A fallback box stays out of the way of open documents and overlays unless it was asked for.
  const covered = Boolean(ui.viewer || ui.overlay || ui.drawer);
  const showBox = j.typingOpen || (j.typing && !covered);
  const spoken = useSpokenLine(j.spoken, j.mode === 'speaking');
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
      {showBox && (
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
