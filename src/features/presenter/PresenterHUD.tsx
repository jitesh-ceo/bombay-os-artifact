import { AnimatePresence, motion } from 'framer-motion';
import { Kbd } from '../../components/primitives';
import { prospect } from '../../data/prospect';
import { getEvents } from '../../state/compile';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { t } from '../../motion/transitions';

export function PresenterHUD() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { presenter, run } = state;
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
            <span><Kbd>Space</Kbd>/<Kbd>→</Kbd> advance</span>
            <span><Kbd>⌘K</Kbd> commands</span>
            {prospect.preset === 'agency' && <span><Kbd>C</Kbd> room / execution</span>}
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
