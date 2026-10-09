// "Wake up, JARVIS." A dormant reactor, armed by the first click (browsers only allow sound after
// one), woken by voice or Space. It ignites, links the tools, the HUD assembles, and JARVIS briefs.
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { boot, client, os } from '../../data/client';
import { useJarvis } from '../../jarvis/JarvisProvider';
import { morningBriefing } from '../../jarvis/briefing';
import { ArcReactor } from '../../jarvis/ui/ArcReactor';
import { audioContext, sfx } from '../../sound/sound';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { pageActivated, wakeDecision } from './wake';

type Phase = 'dormant' | 'armed' | 'igniting';

const LINE_MS = 260;
const IGNITE_MS = 1100;
const BRIEF_AFTER_MS = 1500;

export function BootSequence() {
  const { bootDone, sound } = useAppState();
  const dispatch = useDispatch();
  const jarvis = useJarvis();
  const [phase, setPhase] = useState<Phase>('dormant');
  const [n, setN] = useState(0);
  // Heard "Wake up" before any click: one click will now wake JARVIS with sound.
  const [heardWake, setHeardWake] = useState(false);
  const briefing = useRef(false);
  const live = useRef({ phase, bootDone, sound, jarvis });
  live.current = { phase, bootDone, sound, jarvis };

  // The first click unlocks audio for the rest of the session.
  const arm = () => {
    audioContext();
    setPhase('armed');
  };

  const ignite = () => {
    if (live.current.phase === 'igniting') return;
    audioContext();
    setN(0);
    setPhase('igniting');
    if (live.current.sound) sfx.powerUp();
  };

  // Voice: "Wake up, JARVIS" ignites the dormant reactor; W (or saying it again later) replays the show.
  useEffect(
    () =>
      jarvis.register({
        wake: () => {
          if (live.current.bootDone) {
            live.current.jarvis.stop();
            dispatch({ type: 'REBOOT' });
            setPhase('armed');
          } else if (wakeDecision(pageActivated()) === 'ask-click') setHeardWake(true);
          else ignite();
        },
      }),
    [jarvis.register, dispatch],
  );

  // Keys before boot belong to the boot screen; Space during the briefing only skips the briefing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const { bootDone: done, jarvis: j } = live.current;
      if (done) {
        if (k === ' ' && briefing.current && j.mode === 'speaking') {
          e.preventDefault();
          e.stopImmediatePropagation();
          briefing.current = false;
          j.stop();
        }
        return;
      }
      if (k === 'v' || k === 'w') return; // push-to-talk and replay stay with JARVIS
      e.preventDefault();
      e.stopImmediatePropagation();
      ignite();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // Igniting: link the tools line by line, then hand over to the live HUD.
  useEffect(() => {
    if (phase !== 'igniting' || bootDone) return;
    if (n < boot.lines.length) {
      const t = window.setTimeout(() => setN((v) => v + 1), n === 0 ? IGNITE_MS : LINE_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      dispatch({ type: 'BOOT_DONE' });
      setPhase('dormant');
      setHeardWake(false);
      briefing.current = true;
      window.setTimeout(() => live.current.jarvis.say(morningBriefing()), BRIEF_AFTER_MS);
    }, 450);
    return () => window.clearTimeout(t);
  }, [phase, n, bootDone, dispatch]);

  // The briefing is over once JARVIS has gone quiet after it.
  useEffect(() => {
    if (jarvis.mode === 'idle' && briefing.current && bootDone && jarvis.spoken === morningBriefing()) briefing.current = false;
  }, [jarvis.mode, jarvis.spoken, bootDone]);

  return (
    <AnimatePresence>
      {!bootDone && (
        <motion.div
          className={`boot boot--${phase}`}
          onClick={phase === 'dormant' && !heardWake ? arm : ignite}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } }}
        >
          <div className="boot__center">
            <div className="boot__reactor">
              <span className="boot__ring boot__ring--1" />
              <span className="boot__ring boot__ring--2" />
              <span className="boot__ring boot__ring--3" />
              <ArcReactor size={9} />
            </div>
            <div className="boot__title">{os.name}</div>
            <div className="boot__sub mono">
              by {os.maker} · for {client.name}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                className="boot__prompt"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {phase === 'dormant' && heardWake && <span className="t-acc">I heard you. Click once so I can speak.</span>}
                {phase === 'dormant' && !heardWake && (
                  <>
                    Click to arm JARVIS <span className="t-4">·</span> or press <kbd className="kbd">Space</kbd> to wake it now
                  </>
                )}
                {phase === 'armed' && (
                  <>
                    <span className="boot__listen" /> Listening. Say <b>“Wake up, JARVIS”</b> <span className="t-4">·</span> or press{' '}
                    <kbd className="kbd">Space</kbd>
                  </>
                )}
                {phase === 'igniting' && <span className="t-acc">Systems online</span>}
              </motion.div>
            </AnimatePresence>
          </div>

          {phase === 'igniting' && (
            <div className="boot__log">
              {boot.lines.slice(0, n).map((l, i) => (
                <motion.div key={l} className="boot__line mono" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                  <span className="t-4">{String(i + 1).padStart(2, '0')}</span>
                  <span className="t-2">{l}</span>
                  <span className="boot__dots" />
                  <span className="t-ok">OK</span>
                </motion.div>
              ))}
              <div className="boot__bar">
                <motion.span animate={{ scaleX: n / boot.lines.length }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
