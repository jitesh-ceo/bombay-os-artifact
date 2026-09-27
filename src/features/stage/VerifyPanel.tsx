import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { Spinner } from '../../components/primitives';
import type { Check as CheckDef } from '../../data/workflows';
import { useAppState } from '../../state/AppProvider';
import { currentWorkflow, fillTokens } from '../../state/selectors';
import type { CheckState } from '../../state/types';
import { t } from '../../motion/transitions';

const checkLabel: Record<CheckState, string> = {
  pending: 'Queued',
  checking: 'Checking',
  pass: 'Verified',
  flag: 'Flagged',
  fixing: 'Correcting',
  fixed: 'Verified',
};

function CheckIcon({ st }: { st: CheckState }) {
  if (st === 'pass' || st === 'fixed') return <Check size={11} strokeWidth={3} />;
  if (st === 'flag') return <AlertTriangle size={11} strokeWidth={2.4} />;
  if (st === 'checking' || st === 'fixing') return <Spinner />;
  return null;
}

function Comparison({ check, st }: { check: CheckDef; st: CheckState }) {
  const state = useAppState();
  const wf = currentWorkflow(state);
  const flag = check.flag!;
  const lane = wf.lanes.find((l) => l.watchLine !== undefined);
  const watch = lane ? lane.preview[lane.watchLine!] : null;
  const phase: 'checking' | 'flag' | 'fixing' | 'fixed' =
    st === 'fixed' || st === 'pass' ? 'fixed' : st === 'fixing' ? 'fixing' : st === 'flag' ? 'flag' : 'checking';
  const pillTone = phase === 'flag' ? 'bad' : phase === 'fixed' ? 'ok' : 'accent';

  return (
    <motion.div className={`compare compare--${phase}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={t.base}>
      <div className="compare__head">
        <div>
          <div className="compare__field">{check.label}</div>
          <div className="compare__against">
            <span className="mono-sm t-4">Checking against</span>
            <IntegrationMark id={check.source} size="sm" />
            <span className="mono-sm t-2">{check.against}</span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            className={`pill pill--${pillTone} pill--lg`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={t.fast}
          >
            {phase === 'flag' && <AlertTriangle size={12} strokeWidth={2.4} />}
            {phase === 'fixing' && <Spinner />}
            {phase === 'fixed' && <ShieldCheck size={13} />}
            {phase === 'checking' && <Spinner />}
            {phase === 'fixed' ? 'Verified ✓' : checkLabel[phase]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="compare__cols">
        <div className="compare__col compare__col--gen">
          <span className="mono-sm t-4">Generated in draft</span>
          <span className="compare__value display">{flag.generated}</span>
          <span className="mono-sm t-3">{flag.field}</span>
        </div>
        <div className="compare__vs">
          <ArrowRight size={16} />
        </div>
        <div className="compare__col compare__col--src">
          <span className="mono-sm t-4">Source of truth</span>
          <span className="compare__value display">
            {phase === 'checking' ? <span className="compare__reading">Reading source…</span> : flag.verified}
          </span>
          <span className="mono-sm t-3">{check.against.split(' / ').slice(-1)[0]}</span>
        </div>
      </div>

      <AnimatePresence>
        {phase !== 'checking' && (
          <motion.div className="compare__reason" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={t.base}>
            <span className="mono-sm">{phase === 'flag' ? 'Why it was flagged' : 'Resolution'}</span>
            <span>{phase === 'flag' ? flag.reason : `Draft updated to the source value. ${flag.reason}`}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {watch && (
        <div className="compare__propagate">
          <span className="mono-sm t-4">In the proposal</span>
          <span className="compare__line">
            <span className="t-3">{flag.lineLabel}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={state.run.corrected ? 'v' : 'g'}
                className={`compare__line-value ${state.run.corrected ? 'is-fixed' : phase === 'flag' ? 'is-flag' : ''}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={t.base}
              >
                {fillTokens(`{{${flag.token}}}`, wf, state.run.corrected)}
              </motion.span>
            </AnimatePresence>
            {state.run.corrected && (
              <motion.span className="mono-sm t-ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Updated in proposal
              </motion.span>
            )}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function SimpleCheck({ check, st }: { check: CheckDef; st: CheckState }) {
  return (
    <motion.div key={check.id} className="compare compare--simple" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={t.base}>
      <div className="compare__head">
        <div>
          <div className="compare__field">{check.label}</div>
          <div className="compare__against">
            <span className="mono-sm t-4">Checking against</span>
            <IntegrationMark id={check.source} size="sm" />
            <span className="mono-sm t-2">{check.against}</span>
          </div>
        </div>
        <span className={`pill pill--${st === 'pass' ? 'ok' : 'accent'} pill--lg`}>
          <CheckIcon st={st} />
          {checkLabel[st]}
        </span>
      </div>
      <div className="compare__scan">
        <span className="compare__scanbar" />
      </div>
    </motion.div>
  );
}

export function VerifyPanel() {
  const state = useAppState();
  const wf = currentWorkflow(state);
  const { run } = state;
  const flagged = wf.checks.find((c) => c.flag && run.checks[c.id] !== 'pending' && run.checks[c.id] !== 'checking');
  const active = wf.checks.find((c) => c.id === run.activeCheck);
  const focus = flagged ?? active;

  return (
    <div className="verify">
      <div className="checks">
        <div className="panel-sub">
          <span className="mono-sm t-3">Verification</span>
          <span className="mono-sm t-ok">
            {Object.values(run.checks).filter((c) => c === 'pass' || c === 'fixed').length} / {wf.checks.length}
          </span>
        </div>
        {wf.checks.map((c) => {
          const st = run.checks[c.id];
          return (
            <div key={c.id} className={`check check--${st}`}>
              <span className="check__icon">
                <CheckIcon st={st} />
              </span>
              <span className="check__body">
                <span className="check__label">{c.label}</span>
                <span className="check__against mono-sm">{c.against}</span>
              </span>
              <span className="check__state mono-sm">{st === 'fixed' ? 'Corrected' : checkLabel[st]}</span>
            </div>
          );
        })}
      </div>
      <div className="verify__focus">
        {focus ? (
          focus.flag ? (
            <Comparison check={focus} st={run.checks[focus.id]} />
          ) : (
            <SimpleCheck check={focus} st={run.checks[focus.id]} />
          )
        ) : null}
      </div>
    </div>
  );
}
