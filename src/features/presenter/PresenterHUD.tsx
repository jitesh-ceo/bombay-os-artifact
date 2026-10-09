import { AnimatePresence, motion } from 'framer-motion';
import { Kbd } from '../../components/primitives';
import { hasRoom } from '../../data/prospect';
import { useJarvis } from '../../jarvis/JarvisProvider';
import { getEvents } from '../../state/compile';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { t } from '../../motion/transitions';

export function PresenterHUD() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { presenter, run } = state;
  const { health } = useJarvis();
  const total = getEvents(run.workflowId).length;

  return (
    <AnimatePresence>
      {presenter.hud && (
        <motion.div className="hud" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={t.base}>
          <div className="hud__row">
            <span className="mono t-acc">Presenter</span>
            <span className="mono-sm t-4">
              {run.status} · {run.stage ?? '—'} · {run.cursor}/{total}
            </span>
          </div>
          {/* Which JARVIS services are live, so a fallback is never a surprise mid-pitch. */}
          <div className="hud__row">
            <span className="mono-sm t-3">JARVIS</span>
            <span className="mono-sm hud__health">
              <span className={health.tts ? 't-ok' : 't-4'}>Voice · {health.tts ? 'ElevenLabs' : 'Browser'}</span>
              <span className={health.chat ? 't-ok' : 't-4'}>Brain · {health.chat ? 'Gemini' : 'Scripted'}</span>
              <span className={health.stt ? 't-ok' : 't-4'}>Ears · {health.stt ? 'Mic' : 'Typed'}</span>
            </span>
          </div>
          <div className="hud__row">
            <span className="mono-sm t-3">Speed</span>
            <span className="hud__seg">
              {[0.75, 1, 1.5].map((s) => (
                <button key={s} className={presenter.speed === s ? 'is-on' : ''} onClick={() => dispatch({ type: 'SET_SPEED', speed: s })}>
                  {s}×
                </button>
              ))}
            </span>
          </div>
          <div className="hud__row">
            <span className="mono-sm t-3">Hold between stages</span>
            <button className={`hud__toggle ${presenter.hold ? 'is-on' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_HOLD' })}>
              <span />
            </button>
          </div>
          <div className="hud__row">
            <span className="mono-sm t-3">Access-required moment</span>
            <button className={`hud__toggle ${presenter.interrupt ? 'is-on' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_INTERRUPT' })}>
              <span />
            </button>
          </div>
          <div className="hud__keys mono-sm t-3">
            <span><Kbd>V</Kbd> hold to talk</span>
            <span><Kbd>F</Kbd> Content Forge</span>
            <span><Kbd>G</Kbd> hand gestures</span>
            <span><Kbd>W</Kbd> wake-up replay</span>
            <span><Kbd>Space</Kbd>/<Kbd>→</Kbd> advance</span>
            <span><Kbd>⌘K</Kbd> commands</span>
            {hasRoom() && <span><Kbd>C</Kbd> room / execution</span>}
            <span><Kbd>M</Kbd> map / stage</span>
            <span><Kbd>A</Kbd> autonomy</span>
            <span><Kbd>T</Kbd> time-lapse</span>
            <span><Kbd>O</Kbd> ROI</span>
            <span><Kbd>P</Kbd> prospect</span>
            <span><Kbd>S</Kbd> sound</span>
            <span><Kbd>I</Kbd> integrations</span>
            <span><Kbd>1–3</Kbd> signals</span>
            <span><Kbd>R</Kbd> reset</span>
            <span><Kbd>Esc</Kbd> close</span>
            <span><Kbd>H</Kbd> hide</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
