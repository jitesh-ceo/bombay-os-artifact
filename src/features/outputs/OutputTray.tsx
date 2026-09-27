import { motion } from 'framer-motion';
import { ArrowUpRight, CalendarClock, Check, FileText, ListChecks, Mail, Presentation, Sparkles, UserCheck } from 'lucide-react';
import { client } from '../../data/client';
import { deliverables, type DeliverableKind } from '../../data/deliverables';
import { CountUp } from '../../motion/CountUp';
import { t } from '../../motion/transitions';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { currentWorkflow, fmtCrore } from '../../state/selectors';
import type { OutputStatus } from '../../state/types';

export const kindIcon: Record<DeliverableKind, typeof FileText> = {
  proposal: FileText,
  email: Mail,
  record: UserCheck,
  plan: CalendarClock,
  report: Presentation,
  recommendation: Sparkles,
  tasks: ListChecks,
};

const statusLabel: Record<OutputStatus, string> = {
  potential: 'Standby',
  drafting: 'Drafting',
  verifying: 'Verifying',
  staged: 'Finalising',
  ready: 'Ready',
  approved: 'Delivered',
};

export function OutputCard({ id, status, onOpen }: { id: string; status: OutputStatus; onOpen?: () => void }) {
  const d = deliverables[id];
  const Icon = kindIcon[d.kind];
  const approved = status === 'approved';
  return (
    <motion.button
      layoutId={`out-${id}`}
      transition={t.layout}
      className={`ocard ${approved ? 'is-approved' : ''}`}
      onClick={onOpen}
    >
      <span className="ocard__icon">
        <Icon size={15} strokeWidth={1.6} />
      </span>
      <span className="ocard__body">
        <span className="ocard__title">{d.title}</span>
        <span className="ocard__dest mono-sm">{approved ? d.approvedLabel : d.destinationLabel}</span>
      </span>
      {status === 'staged' ? (
        <span className="ocard__status mono-sm t-ok">
          <Check size={11} strokeWidth={2.5} /> Verified
        </span>
      ) : (
        <span className={`ocard__status mono-sm ${approved ? 't-ok' : 't-acc'}`}>
          {approved ? <Check size={11} strokeWidth={2.5} /> : <ArrowUpRight size={12} />}
          {approved ? 'Delivered' : 'Open'}
        </span>
      )}
    </motion.button>
  );
}

function Placeholder({ id, status, progress }: { id: string; status: OutputStatus; progress: number }) {
  const d = deliverables[id];
  const Icon = kindIcon[d.kind];
  const active = status !== 'potential';
  return (
    <div className={`oslot ${active ? 'is-active' : ''}`}>
      <span className="ocard__icon">
        <Icon size={15} strokeWidth={1.6} />
      </span>
      <span className="ocard__body">
        <span className="ocard__title">{d.title}</span>
        <span className="ocard__dest mono-sm">→ {d.destinationLabel}</span>
      </span>
      <span className={`mono-sm ${active ? 't-acc' : 't-4'}`}>{statusLabel[status]}</span>
      {active && (
        <span className="oslot__bar">
          <motion.span animate={{ width: `${Math.max(8, progress * 100)}%` }} transition={t.slow} />
        </span>
      )}
    </div>
  );
}

export function OutputTray() {
  const state = useAppState();
  const dispatch = useDispatch();
  const wf = currentWorkflow(state);
  const { run, impact } = state;
  const readyCount = wf.outputs.filter((o) => run.outputs[o] === 'ready' || run.outputs[o] === 'approved').length;

  const progressFor = (id: string) => {
    if (run.outputs[id] === 'verifying' || run.outputs[id] === 'staged') return 0.92;
    const lane = wf.lanes.find((l) => l.outputIds.includes(id));
    if (!lane) return 0;
    const done = Math.max(0, run.lanes[lane.id] ?? 0);
    return done / lane.steps.length * 0.85;
  };

  return (
    <aside className="tray">
      <div className="tray__head">
        <span className="mono t-3">Outputs</span>
        <span className={`mono ${readyCount ? 't-acc' : 't-4'}`}>
          {readyCount}/{wf.outputs.length} ready
        </span>
      </div>
      <p className="tray__lede">
        {run.status === 'idle'
          ? 'What this signal will produce'
          : run.status === 'complete'
            ? 'Delivered to the tools your team already uses'
            : readyCount
              ? 'Finished work, ready for your approval'
              : 'Being produced right now'}
      </p>

      <div className="tray__list">
        {wf.outputs.map((id) => {
          const status = run.outputs[id];
          const isOut = status === 'ready' || status === 'approved';
          return (
            <div key={id} className="tray__slot">
              {isOut ? (
                <OutputCard id={id} status={status} onOpen={() => dispatch({ type: 'OPEN_VIEWER', id })} />
              ) : status === 'staged' ? (
                <div className="oslot oslot--awaiting" />
              ) : (
                <Placeholder id={id} status={status} progress={progressFor(id)} />
              )}
            </div>
          );
        })}
      </div>

      <div className="impact">
        <div className="impact__head">
          <span className="mono t-3">Impact today</span>
          <span className="mono-sm t-4">{client.name}</span>
        </div>
        <div className="impact__grid">
          <div className="impact__cell">
            <span className="impact__value display">
              <CountUp value={impact.hoursSaved} format={(n) => `${n.toFixed(1)}h`} />
            </span>
            <span className="mono-sm t-3">Team hours saved</span>
          </div>
          <div className="impact__cell">
            <span className="impact__value display">
              <CountUp value={impact.pipelineLakhs} format={fmtCrore} />
            </span>
            <span className="mono-sm t-3">Pipeline handled</span>
          </div>
          <div className="impact__cell">
            <span className="impact__value display">
              <CountUp value={impact.tasksCompleted} format={(n) => `${Math.round(n)}`} />
            </span>
            <span className="mono-sm t-3">Tasks completed</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
