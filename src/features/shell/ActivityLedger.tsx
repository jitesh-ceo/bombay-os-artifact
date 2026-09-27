import { AnimatePresence, motion } from 'framer-motion';
import { IntegrationMark } from '../../components/IntegrationMark';
import { useAppState } from '../../state/AppProvider';
import { fmtClock } from '../../state/selectors';
import { t } from '../../motion/transitions';

export function ActivityLedger() {
  const { ledger } = useAppState();
  const rows = [...ledger].reverse().slice(0, 12);

  return (
    <section className="ledger">
      <div className="ledger__head">
        <span className="mono t-3">Activity ledger</span>
        <span className="mono-sm t-4">Every action is recorded · {ledger.length} entries</span>
      </div>
      <div className="ledger__rows">
        <AnimatePresence initial={false}>
          {rows.map((e) => (
            <motion.div
              key={e.id}
              layout="position"
              className={`ledger__row ledger__row--${e.tone ?? 'default'}`}
              initial={{ opacity: 0, x: -8, backgroundColor: 'rgba(242,169,59,0.08)' }}
              animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(242,169,59,0)' }}
              exit={{ opacity: 0 }}
              transition={{ ...t.base, backgroundColor: { duration: 1.6 } }}
            >
              <span className="ledger__time">{fmtClock(e.time)}</span>
              <span className="ledger__stage mono-sm">{e.stage ?? 'system'}</span>
              <span className="ledger__text">{e.text}</span>
              {e.source && <IntegrationMark id={e.source} size="sm" />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
