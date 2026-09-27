import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Sunrise } from 'lucide-react';
import { client } from '../../data/client';
import { morning, signals } from '../../data/signals';
import { workflowForSignal } from '../../data/workflows';
import { t } from '../../motion/transitions';
import { useAppState, useDispatch } from '../../state/AppProvider';

const totals = signals.reduce(
  (acc, s) => {
    const wf = workflowForSignal(s.id);
    return { deliverables: acc.deliverables + wf.outputs.length, hours: acc.hours + wf.impact.hours };
  },
  { deliverables: 0, hours: 0 },
);

function MorningInner() {
  const dispatch = useDispatch();
  const stats: [string, string][] = [
    [String(signals.length), 'signals handled'],
    [String(totals.deliverables), 'deliverables'],
    [`${totals.hours}`, 'hours returned'],
  ];

  return (
    <motion.div className="morning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t.base}>
      <div className="morning__backdrop" />
      <motion.div className="morning__card" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={t.slow}>
        <div className="morning__eyebrow mono-sm t-acc">
          <Sunrise size={13} /> Morning time-lapse · {client.name}
        </div>
        <h2 className="display morning__title">{morning.label}</h2>
        <div className="morning__stats">
          {stats.map(([n, label], i) => (
            <motion.div
              key={label}
              className="morning__stat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...t.base, delay: 0.35 + i * 0.15 }}
            >
              <span className="display">{n}</span>
              <span className="mono-sm t-3">{label}</span>
            </motion.div>
          ))}
        </div>
        <div className="morning__lines">
          {morning.lines.map(([time, text], i) => (
            <motion.div
              key={time}
              className="morning__line"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...t.base, delay: 0.9 + i * 0.15 }}
            >
              <span className="mono-sm t-4">{time}</span>
              <Check size={12} strokeWidth={2.6} className="t-ok" />
              <span>{text}</span>
            </motion.div>
          ))}
        </div>
        <p className="morning__note t-3">All before the team’s first coffee. Every output verified against source and delivered through the tools they already use.</p>
        <div className="morning__actions">
          <button className="btn btn--primary btn--lg" onClick={() => dispatch({ type: 'OVERLAY', overlay: 'roi' })}>
            What this means for {client.name} <ArrowRight size={14} />
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              dispatch({ type: 'OVERLAY', overlay: null });
              dispatch({ type: 'SET_VIEW', view: 'map' });
            }}
          >
            Back to operations
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MorningCard() {
  const { ui } = useAppState();
  return <AnimatePresence>{ui.overlay === 'morning' && <MorningInner key="morning" />}</AnimatePresence>;
}
