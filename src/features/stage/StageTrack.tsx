import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { STAGES, type StageId } from '../../data/workflows';
import { useAppState } from '../../state/AppProvider';
import { currentWorkflow } from '../../state/selectors';
import { t } from '../../motion/transitions';
import { ManualRace } from './ManualRace';

export function StageTrack() {
  const state = useAppState();
  const { run } = state;
  const wf = currentWorkflow(state);
  const idx = run.stage ? STAGES.findIndex((s) => s.id === run.stage) : -1;
  const allDone = run.status === 'awaitingApproval' || run.status === 'complete';

  const summary: Record<StageId, string> = {
    understand: `${run.facts} / ${wf.facts.length} facts`,
    decide: run.gate === 'plan' ? 'Awaiting approval' : `${run.plan} / ${wf.plan.length} steps`,
    execute: `${wf.lanes.length} parallel tasks`,
    verify: `${Object.values(run.checks).filter((c) => c === 'pass' || c === 'fixed').length} / ${wf.checks.length} checks`,
    deliver: `${wf.outputs.length} outputs`,
  };

  const fill = allDone ? 1 : idx < 0 ? 0 : (idx + 0.5) / STAGES.length;

  return (
    <div className="trackwrap">
      <div className="track">
        <div className="track__rail">
          <motion.div className="track__fill" animate={{ scaleX: fill }} transition={t.slow} />
        </div>
        {STAGES.map((s, i) => {
          const status = allDone || i < idx ? 'done' : i === idx ? (run.status === 'blocked' ? 'blocked' : 'active') : 'pending';
          return (
            <div key={s.id} className={`tstage tstage--${status}`}>
              <div className="tstage__top">
                <span className="mono-sm tstage__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="tstage__icon">{status === 'done' ? <Check size={10} strokeWidth={3} /> : <span />}</span>
              </div>
              <div className="tstage__label">{s.label}</div>
              <div className="tstage__sub mono-sm">
                {status === 'pending' ? 'Pending' : status === 'blocked' ? 'Waiting for access' : summary[s.id]}
              </div>
              {status === 'active' && <motion.span layoutId="tstage-active" className="tstage__active" transition={t.spring} />}
            </div>
          );
        })}
      </div>
      <ManualRace />
    </div>
  );
}
