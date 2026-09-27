import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Hand, Play, ShieldCheck } from 'lucide-react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { client } from '../../data/client';
import { deliverables } from '../../data/deliverables';
import { integrationById, type IntegrationId } from '../../data/integrations';
import { signalById } from '../../data/signals';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { currentWorkflow } from '../../state/selectors';
import { kindIcon } from '../outputs/OutputTray';
import { t } from '../../motion/transitions';

export function BriefPanel() {
  const state = useAppState();
  const dispatch = useDispatch();
  const wf = currentWorkflow(state);
  const sig = signalById[state.run.signalId];

  return (
    <div className="brief">
      <motion.div className="brief__signal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={t.base}>
        <div className="brief__from">
          <IntegrationMark id={sig.source} size="md" />
          <div>
            <div className="brief__name">{sig.from}</div>
            <div className="mono-sm t-3">{sig.fromRole}</div>
          </div>
          <span className="brief__time mono-sm t-3">{sig.time}</span>
        </div>
        <blockquote className="brief__quote display">“{sig.excerpt}”</blockquote>
        <div className="brief__facts">
          <span>
            <span className="mono-sm t-4">Signal</span>
            <span>{sig.kind}</span>
          </span>
          <span>
            <span className="mono-sm t-4">Priority</span>
            <span className={sig.urgency === 'High' ? 't-acc' : ''}>{sig.urgency}</span>
          </span>
          {sig.value && (
            <span>
              <span className="mono-sm t-4">Value</span>
              <span>{sig.value}</span>
            </span>
          )}
        </div>
      </motion.div>

      <motion.div className="brief__plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t.base, delay: 0.08 }}>
        <div className="mono-sm t-3">Bombay OS will</div>
        <p className="brief__goal">{wf.brief.goal}</p>

        <div className="brief__row">
          <span className="mono-sm t-4">Consult</span>
          <span className="brief__marks">
            {wf.sources.map((s) => (
              <span key={s} className="brief__chip">
                <IntegrationMark id={s} size="sm" />
                {integrationById[s].name}
              </span>
            ))}
          </span>
        </div>
        <div className="brief__row">
          <span className="mono-sm t-4">Produce</span>
          <span className="brief__outs">
            {wf.outputs.map((o) => {
              const Icon = kindIcon[deliverables[o].kind];
              return (
                <span key={o} className="brief__chip">
                  <Icon size={12} strokeWidth={1.7} />
                  {deliverables[o].short}
                </span>
              );
            })}
          </span>
        </div>

        <div className="brief__cta">
          <button className="btn btn--primary btn--lg" onClick={() => dispatch({ type: 'START', now: Date.now() })}>
            <Play size={14} fill="currentColor" />
            Run with Bombay OS
          </button>
          <div className="brief__estimate">
            <span className="t-1">{wf.brief.estimate}</span>
            <span className="t-3">vs {wf.brief.manual}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function UnderstandPanel({ focus }: { focus: IntegrationId | null }) {
  const state = useAppState();
  const wf = currentWorkflow(state);
  const n = state.run.facts;

  return (
    <div className="understand">
      <div className="panel-sub">
        <span className="mono-sm t-3">Context gathered</span>
        <span className="mono-sm t-acc">
          {n} / {wf.facts.length}
        </span>
      </div>
      <div className="facts">
        {wf.facts.map((f, i) => {
          const shown = i < n;
          const latest = i === n - 1;
          return (
            <div key={i} className={`fact-slot ${focus && focus !== f.source ? 'is-dim' : ''}`}>
              <AnimatePresence>
                {shown ? (
                  <motion.div
                    className={`fact ${latest ? 'is-latest' : ''}`}
                    initial={{ opacity: 0, x: -14, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={t.base}
                  >
                    <span className="fact__src">
                      <IntegrationMark id={f.source} size="sm" />
                      <span className="mono-sm">{integrationById[f.source].name}</span>
                    </span>
                    <span className="fact__main">
                      <span className="fact__label">{f.label}</span>
                      <span className="fact__value">{f.value}</span>
                    </span>
                    <span className="fact__ref mono-sm">{f.ref}</span>
                  </motion.div>
                ) : (
                  <div className="fact fact--pending">
                    <span className="fact__skeleton" style={{ width: `${40 + ((i * 17) % 35)}%` }} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DecidePanel({ focus }: { focus: IntegrationId | null }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const wf = currentWorkflow(state);
  const n = state.run.plan;

  return (
    <div className="decide">
      <div className="decide__from">
        <span className="mono-sm t-3">Reasoned from</span>
        <span className="display decide__count">{wf.facts.length}</span>
        <span className="t-2">facts across</span>
        <span className="brief__marks">
          {wf.sources.map((s) => (
            <IntegrationMark key={s} id={s} size="sm" />
          ))}
        </span>
        <ArrowRight size={14} className="t-acc" />
        <span className="t-1">{wf.plan.length}-step plan</span>
      </div>
      <div className="plan">
        {wf.plan.map((p, i) => {
          const shown = i < n;
          const dim = focus && !p.sources.includes(focus);
          return (
            <motion.div
              key={i}
              className={`pstep ${shown ? 'is-shown' : ''} ${i === n - 1 ? 'is-latest' : ''} ${dim ? 'is-dim' : ''}`}
              animate={shown ? { opacity: 1, y: 0 } : { opacity: 0.22, y: 0 }}
              initial={{ opacity: 0.22 }}
              transition={t.base}
            >
              <span className="pstep__num display">{String(i + 1).padStart(2, '0')}</span>
              <span className="pstep__body">
                <span className="pstep__title">{p.title}</span>
                <span className="pstep__detail">{shown ? p.detail : '—'}</span>
              </span>
              <span className="pstep__srcs">
                {p.sources.map((s) => (
                  <IntegrationMark key={s} id={s} size="sm" />
                ))}
              </span>
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {state.run.gate === 'plan' && (
          <motion.div
            className="gatebar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={t.base}
          >
            <Hand size={15} className="t-acc" />
            <span className="gatebar__text">
              <span className="mono-sm t-acc">Suggest mode</span>
              <span>Nothing is drafted or sent until {client.approver} approves this plan.</span>
            </span>
            <button className="btn btn--primary btn--sm" onClick={() => dispatch({ type: 'RESUME', now: Date.now() })}>
              <ShieldCheck size={12} /> Approve plan
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
