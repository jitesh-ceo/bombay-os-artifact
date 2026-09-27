import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Eye, FastForward, Map as MapIcon, ShieldCheck, Workflow } from 'lucide-react';
import { useState } from 'react';
import { Kbd, Spinner } from '../../components/primitives';
import { client } from '../../data/client';
import { deliverables } from '../../data/deliverables';
import type { IntegrationId } from '../../data/integrations';
import { signalById, signals } from '../../data/signals';
import { STAGES } from '../../data/workflows';
import { t } from '../../motion/transitions';
import { firstUnapproved, useAppState, useDispatch } from '../../state/AppProvider';
import { effAutonomy } from '../../state/autonomy';
import { OperationsMap } from '../map/OperationsMap';
import { currentWorkflow } from '../../state/selectors';
import { CompletePanel, DeliverPanel } from './DeliverPanel';
import { ExecutePanel } from './ExecutePanel';
import { BriefPanel, DecidePanel, UnderstandPanel } from './panels';
import { SourceContext } from './SourceContext';
import { StageTrack } from './StageTrack';
import { VerifyPanel } from './VerifyPanel';

function Header() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run } = state;
  const wf = currentWorkflow(state);
  const sig = signalById[run.signalId];
  const idx = run.stage ? STAGES.findIndex((s) => s.id === run.stage) : -1;
  const stage = idx >= 0 ? STAGES[idx] : null;
  const next = signals.find((s) => !state.handled[s.id]);
  const autonomy = effAutonomy(state);
  const approvedCount = Object.values(run.outputs).filter((o) => o === 'approved').length;
  const reviewId = autonomy === 'draft' ? (firstUnapproved(state) ?? wf.primaryOutput) : wf.primaryOutput;

  const onMap = state.ui.view === 'map';
  const open = signals.filter((s) => !state.handled[s.id]).length;
  let eyebrow = `Signal ${sig.index} · ${sig.kind}`;
  let title = 'Ready to act';
  let explain = 'A new signal has arrived. Bombay OS has everything it needs to handle it.';
  if (onMap) {
    eyebrow = `Live operations · ${client.name}`;
    title = 'Monitoring';
    explain = open
      ? `Every inbox, account and file your team relies on, watched continuously. ${open} signal${open === 1 ? '' : 's'} need action.`
      : 'Every signal this morning has been handled. Bombay OS keeps watching.';
  } else if (run.status === 'complete') {
    title = 'Delivered';
    explain = 'Approved work has been sent through the tools your team already uses.';
  } else if (stage) {
    eyebrow = `Stage ${String(idx + 1).padStart(2, '0')} / 05 · ${wf.runLabel}`;
    title = stage.title;
    explain = run.status === 'blocked' ? 'Paused safely. Bombay OS will not guess without the right source.' : stage.explain;
  }

  return (
    <div className="ophead">
      <div className="ophead__text">
        <div className="mono-sm t-3 ophead__eyebrow">{eyebrow}</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={title + run.status}
            className="ophead__titles"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={t.base}
          >
            <h1 className="display ophead__title">{title}</h1>
            <p className="ophead__explain">{explain}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="ophead__action">
        {!onMap && run.status === 'running' && (
          <>
            <span className="pill pill--accent">
              <Spinner /> Working
            </span>
            <button className="btn btn--ghost btn--sm" onClick={() => dispatch({ type: 'ADVANCE', now: Date.now() })} title="Skip to next stage">
              <FastForward size={12} /> Next stage
            </button>
          </>
        )}
        {!onMap && run.status === 'paused' && (
          <button className="btn btn--primary" onClick={() => dispatch({ type: 'RESUME', now: Date.now() })}>
            {run.gate === 'plan' ? (
              <>
                <ShieldCheck size={14} /> Approve plan &amp; execute
              </>
            ) : (
              <>
                Continue <ArrowRight size={14} />
              </>
            )}
          </button>
        )}
        {!onMap && run.status === 'blocked' && <span className="pill pill--bad pill--lg">Access required</span>}
        {!onMap && run.status === 'awaitingApproval' && autonomy !== 'autopilot' && (
          <button className="btn btn--primary" onClick={() => dispatch({ type: 'OPEN_VIEWER', id: reviewId })}>
            <Eye size={14} />{' '}
            {autonomy === 'draft'
              ? `Review drafts · ${approvedCount} / ${wf.outputs.length}`
              : `Review ${deliverables[wf.primaryOutput].short.toLowerCase()}`}
          </button>
        )}
        {!onMap && run.status === 'awaitingApproval' && autonomy === 'autopilot' && (
          <span className="pill pill--accent pill--lg">
            <Spinner /> Delivering on Autopilot
          </span>
        )}
        {!onMap && run.status === 'complete' && next && (
          <button className="btn btn--ghost" onClick={() => dispatch({ type: 'SELECT_SIGNAL', id: next.id })}>
            Next signal <Kbd>Space</Kbd>
          </button>
        )}
        <div className="viewswitch" role="tablist" aria-label="View">
          <button className={onMap ? 'is-on' : ''} onClick={() => dispatch({ type: 'SET_VIEW', view: 'map' })}>
            <MapIcon size={11} /> Map
          </button>
          <button className={!onMap ? 'is-on' : ''} onClick={() => dispatch({ type: 'SET_VIEW', view: 'stage' })}>
            <Workflow size={11} /> Stage
          </button>
        </div>
      </div>
    </div>
  );
}

export function OperatingStage() {
  const state = useAppState();
  const { run } = state;
  const [focus, setFocus] = useState<IntegrationId | null>(null);

  const panelKey =
    run.status === 'idle' ? `brief-${run.signalId}` : run.status === 'complete' ? 'complete' : run.stage ?? 'starting';

  const panel = (() => {
    if (run.status === 'idle') return <BriefPanel />;
    if (run.status === 'complete') return <CompletePanel />;
    switch (run.stage) {
      case 'understand':
        return <UnderstandPanel focus={focus} />;
      case 'decide':
        return <DecidePanel focus={focus} />;
      case 'execute':
        return <ExecutePanel />;
      case 'verify':
        return <VerifyPanel />;
      case 'deliver':
        return <DeliverPanel />;
      default:
        return (
          <div className="starting mono t-acc">
            <Spinner /> Accepting signal
          </div>
        );
    }
  })();

  return (
    <section className={`opstage opstage--${state.ui.view === 'map' ? 'map' : run.status}`}>
      <span className="corner corner--tl" />
      <span className="corner corner--tr" />
      <Header />
      {state.ui.view === 'map' ? (
        <OperationsMap />
      ) : (
        <>
          <SourceContext focus={focus} onFocus={setFocus} />
          <StageTrack />
          <div className="work">
            <AnimatePresence mode="wait">
              <motion.div
                key={panelKey}
                className="work__inner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
                transition={t.base}
              >
                {panel}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </section>
  );
}
