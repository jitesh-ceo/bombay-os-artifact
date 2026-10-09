// Starts Content Forge runs (voice, F, or the palette) and shows the topic prompt.
// The run starts at once on a matching sample; Gemini's package replaces it if it lands before EXECUTE.
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { t } from '../motion/transitions';
import { useAppState, useDispatch } from '../state/AppProvider';
import { buildForgePackage, cleanTopic, fallbackForge, FORGE_SIGNAL, registerForge } from './brain/forge';
import { useJarvis } from './JarvisProvider';

const SWAP_STAGES = new Set([null, 'understand', 'decide']);
const IDEAS = ['the new iPhone in Dubai', 'the best shawarma in Deira', 'a weekend in Hatta'];

export function ForgeController() {
  const state = useAppState();
  const dispatch = useDispatch();
  const jarvis = useJarvis();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const live = useRef({ state, jarvis });
  live.current = { state, jarvis };

  useEffect(
    () =>
      jarvis.register({
        forgePrompt: () => setOpen(true),
        forge: (raw: string) => {
          const { state: s, jarvis: j } = live.current;
          const running = s.run.signalId === FORGE_SIGNAL && s.run.status !== 'idle' && s.run.status !== 'complete';
          if (running) return j.say('Already forging one. Let me finish it first.');
          const clean = cleanTopic(raw);
          const first = fallbackForge(clean);
          registerForge(first);
          if (!s.bootDone) dispatch({ type: 'BOOT_DONE' });
          const now = Date.now();
          dispatch({ type: 'RUN_SIGNAL', id: FORGE_SIGNAL, now });
          if (!j.health.chat) return;
          void buildForgePackage(first.topic).then(({ pkg, source }) => {
            const cur = live.current.state.run;
            if (source === 'gemini' && cur.signalId === FORGE_SIGNAL && cur.startedAt === now && SWAP_STAGES.has(cur.stage)) {
              registerForge(pkg);
            }
          });
        },
      }),
    [jarvis.register, dispatch],
  );

  const submit = (value: string) => {
    const v = cleanTopic(value);
    if (!v) return;
    setOpen(false);
    setTopic('');
    jarvis.forge(v);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="forgeask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t.fast}>
          <div className="forgeask__backdrop" onClick={() => setOpen(false)} />
          <motion.form
            className="forgeask__box"
            initial={{ y: -10, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            onSubmit={(e) => {
              e.preventDefault();
              submit(topic);
            }}
          >
            <div className="mono-sm t-acc forgeask__eyebrow">
              <Sparkles size={12} /> Content Forge
            </div>
            <label className="forgeask__label" htmlFor="forge-topic">
              What should the video be about?
            </label>
            <input
              id="forge-topic"
              autoFocus
              value={topic}
              maxLength={120}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              placeholder="e.g. the new iPhone in Dubai"
            />
            <div className="forgeask__ideas">
              {IDEAS.map((idea) => (
                <button key={idea} type="button" onClick={() => submit(idea)}>
                  {idea}
                </button>
              ))}
            </div>
            <div className="mono-sm t-4">Enter to forge · Esc to close · or just say “JARVIS, make me a video about…”</div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
