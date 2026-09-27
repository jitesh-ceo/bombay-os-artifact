import { Bot, Check, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { IntegrationMark } from '../../components/IntegrationMark';
import { Kbd } from '../../components/primitives';
import { integrationById } from '../../data/integrations';
import { signals } from '../../data/signals';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { AUTONOMY, effAutonomy } from '../../state/autonomy';
import type { Autonomy } from '../../state/types';
import { t } from '../../motion/transitions';

export function SignalRail() {
  const { run, handled, integrations } = useAppState();
  const dispatch = useDispatch();
  const connected = Object.values(integrations).filter((s) => s === 'connected').length;
  const openCount = signals.filter((s) => !handled[s.id]).length;

  return (
    <aside className="rail">
      <div className="rail__head">
        <span className="mono t-3">Incoming signals</span>
        <span className="mono t-acc">{openCount} open</span>
      </div>

      <div className="rail__list">
        {signals.map((s, i) => {
          const active = run.signalId === s.id;
          const done = handled[s.id];
          const working = active && run.status !== 'idle' && run.status !== 'complete';
          return (
            <motion.button
              key={s.id}
              className={`signal ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
              onClick={() => dispatch({ type: 'SELECT_SIGNAL', id: s.id })}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...t.base, delay: 0.15 + i * 0.08 }}
            >
              {active && <motion.span layoutId="signal-rule" className="signal__rule" transition={t.spring} />}
              <div className="signal__top">
                <span className="signal__index display">{s.index}</span>
                <span className={`signal__urgency signal__urgency--${s.urgency.toLowerCase()}`}>
                  {done ? (
                    <>
                      <Check size={10} strokeWidth={2.5} /> Handled
                    </>
                  ) : working ? (
                    'In progress'
                  ) : (
                    s.urgency
                  )}
                </span>
              </div>
              <div className="signal__kind">{s.kind}</div>
              <div className="signal__headline">{s.headline}</div>
              <div className="signal__meta">
                <IntegrationMark id={s.source} size="sm" />
                <span className="mono-sm t-3">{integrationById[s.source].name}</span>
                <span className="signal__time mono-sm t-2">{s.time}</span>
              </div>
              {working && (
                <span className="signal__progress">
                  <span />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="rail__foot">
        <div className="rail__watch">
          <span className="live__dot" />
          <span className="t-2">
            Watching {connected} connected tools for new work
          </span>
        </div>
        <AutonomyDial />
      </div>
    </aside>
  );
}

const HUMAN_ROLE: Record<Autonomy, string> = {
  suggest: 'Approves the plan',
  draft: 'Approves each draft',
  approve: 'One approval sends all',
  autopilot: 'Sets policy · reviews after',
};

function AutonomyDial() {
  const state = useAppState();
  const dispatch = useDispatch();
  const level = effAutonomy(state);
  const idx = AUTONOMY.findIndex((a) => a.id === level);
  const def = AUTONOMY[idx];
  const locked = state.timelapse.active;

  return (
    <div className={`dial ${level === 'autopilot' ? 'dial--auto' : ''}`}>
      <div className="dial__head">
        <span className="mono-sm t-3">Autonomy · who’s in control</span>
        <Kbd>A</Kbd>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={level}
          className="dial__current display"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={t.fast}
        >
          {def.label}
        </motion.div>
      </AnimatePresence>
      <div className="dial__track" role="radiogroup" aria-label="Autonomy level">
        <span className="dial__line" />
        <motion.span className="dial__fill" animate={{ width: `${(idx / (AUTONOMY.length - 1)) * 100}%` }} transition={t.spring} />
        {AUTONOMY.map((a, i) => (
          <button
            key={a.id}
            role="radio"
            aria-checked={a.id === level}
            disabled={locked}
            className={`dial__stop ${i <= idx ? 'is-on' : ''} ${a.id === level ? 'is-current' : ''}`}
            style={{ left: `${(i / (AUTONOMY.length - 1)) * 100}%` }}
            onClick={() => dispatch({ type: 'SET_AUTONOMY', level: a.id, now: Date.now() })}
            title={a.line}
          >
            <span className="dial__knob" />
            <span className="dial__name mono-sm">{a.label}</span>
          </button>
        ))}
      </div>
      <div className="dial__roles">
        <span>
          <Bot size={12} className="t-acc" /> {level === 'suggest' ? 'Plans, then waits' : level === 'draft' ? 'Drafts everything' : level === 'approve' ? 'Does the work' : 'Does and delivers'}
        </span>
        <span>
          <UserRound size={12} className="t-2" /> {HUMAN_ROLE[level]}
        </span>
      </div>
    </div>
  );
}
