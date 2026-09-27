import { motion } from 'framer-motion';
import { ArrowRight, Check, Eye, TrendingUp } from 'lucide-react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { Kbd, Spinner } from '../../components/primitives';
import { client } from '../../data/client';
import { deliverables } from '../../data/deliverables';
import { signals } from '../../data/signals';
import { t } from '../../motion/transitions';
import { firstUnapproved, useAppState, useDispatch } from '../../state/AppProvider';
import { effAutonomy } from '../../state/autonomy';
import { currentWorkflow, fmtCrore, fmtDuration } from '../../state/selectors';
import { OutputCard } from '../outputs/OutputTray';

export function DeliverPanel() {
  const state = useAppState();
  const dispatch = useDispatch();
  const wf = currentWorkflow(state);
  const { run } = state;
  const staged = wf.outputs.filter((o) => run.outputs[o] === 'staged');
  const ready = run.status === 'awaitingApproval';
  const fixes = wf.checks.filter((c) => run.checks[c.id] === 'fixed').length;
  const elapsed = run.finishedAt ? run.finishedAt - run.startedAt - run.blockedMs : 0;
  const autonomy = effAutonomy(state);

  return (
    <div className="deliver">
      <div className="deliver__staging">
        {staged.map((id) => (
          <div key={id} className="deliver__slot">
            <OutputCard id={id} status="staged" />
          </div>
        ))}
      </div>

      {ready && (
        <motion.div className="deliver__summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t.slow, delay: 0.1 }}>
          <div className="deliver__headline">
            <span className="display deliver__big">{wf.outputs.length} deliverables ready</span>
            <span className="t-2">
              {autonomy === 'autopilot'
                ? 'Drafted and verified. Autopilot policy allows delivery without a manual approval.'
                : autonomy === 'draft'
                  ? 'Drafted and verified. Draft mode: each deliverable is approved individually.'
                  : 'Drafted, verified and waiting for one approval.'}
            </span>
          </div>
          <div className="deliver__stats">
            <div>
              <span className="display">{fmtDuration(elapsed)}</span>
              <span className="mono-sm t-3">Signal to finished work</span>
            </div>
            <div>
              <span className="display">{wf.brief.manual.replace(' manually', '')}</span>
              <span className="mono-sm t-3">Typical manual effort</span>
            </div>
            <div>
              <span className="display">{wf.checks.length}</span>
              <span className="mono-sm t-3">Source checks passed</span>
            </div>
            <div>
              <span className={`display ${fixes ? 't-acc' : ''}`}>{fixes}</span>
              <span className="mono-sm t-3">Error caught and fixed</span>
            </div>
          </div>
          <div className="deliver__route">
            <span className="mono-sm t-4">On approval</span>
            {wf.outputs.map((o) => (
              <span key={o} className="deliver__dest">
                <IntegrationMark id={deliverables[o].destination} size="sm" />
                <span>
                  {deliverables[o].short} <span className="t-4">→</span> {deliverables[o].destinationLabel}
                </span>
              </span>
            ))}
          </div>
          <div className="deliver__cta">
            {autonomy === 'autopilot' ? (
              <span className="deliver__auto">
                <Spinner /> Delivering automatically · Autopilot policy
              </span>
            ) : (
              <>
                <button
                  className="btn btn--primary btn--lg"
                  onClick={() => dispatch({ type: 'OPEN_VIEWER', id: autonomy === 'draft' ? (firstUnapproved(state) ?? wf.primaryOutput) : wf.primaryOutput })}
                >
                  <Eye size={15} />
                  {autonomy === 'draft'
                    ? `Review drafts · ${wf.outputs.filter((o) => run.outputs[o] === 'approved').length} / ${wf.outputs.length} approved`
                    : `Review ${deliverables[wf.primaryOutput].short.toLowerCase()}`}
                </button>
                <span className="mono-sm t-4">
                  <Kbd>Space</Kbd> to open
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function CompletePanel() {
  const state = useAppState();
  const dispatch = useDispatch();
  const wf = currentWorkflow(state);
  const next = signals.find((s) => !state.handled[s.id]);

  return (
    <div className="complete">
      <motion.div className="complete__mark" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={t.spring}>
        <Check size={26} strokeWidth={2.2} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t.base, delay: 0.1 }}>
        <div className="mono t-ok">{state.run.autoApproved ? 'Delivered on Autopilot · within policy' : 'Delivered'}</div>
        <div className="display complete__title">The work is done.</div>
      </motion.div>
      <div className="complete__list">
        {wf.completion.map((c, i) => (
          <motion.div key={c} className="complete__item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...t.base, delay: 0.3 + i * 0.18 }}>
            <Check size={13} strokeWidth={2.6} className="t-ok" />
            {c}
          </motion.div>
        ))}
      </div>
      <motion.div className="complete__impact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + wf.completion.length * 0.18 }}>
        <span>
          <span className="display">+{wf.impact.hours}h</span>
          <span className="mono-sm t-3">Time returned to the team</span>
        </span>
        {wf.impact.pipelineLakhs > 0 && (
          <span>
            <span className="display">{fmtCrore(wf.impact.pipelineLakhs)}</span>
            <span className="mono-sm t-3">Pipeline progressed</span>
          </span>
        )}
        <span>
          <span className="display">+{wf.impact.tasks}</span>
          <span className="mono-sm t-3">Tasks completed</span>
        </span>
      </motion.div>
      {next && (
        <motion.button
          className="btn btn--ghost"
          onClick={() => dispatch({ type: 'SELECT_SIGNAL', id: next.id })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          Next signal · {next.kind}
          <ArrowRight size={14} />
        </motion.button>
      )}
      {!next && !state.timelapse.active && (
        <motion.button
          className="btn btn--primary"
          onClick={() => dispatch({ type: 'OVERLAY', overlay: 'roi' })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <TrendingUp size={14} /> What this means for {client.name}
        </motion.button>
      )}
    </div>
  );
}
